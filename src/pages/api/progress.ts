/**
 * /api/progress - Learning progress tracking endpoint
 *
 * POST /api/progress - Record progress for single word or batch
 *
 * Modes (auto-detected):
 * - Single mode: Record one word result (has vocabulary_id field)
 * - Batch mode: Record multiple results (has results array)
 *
 * Single Mode Example:
 * ```json
 * {
 *   "profile_id": "uuid",
 *   "vocabulary_id": "uuid",
 *   "is_correct": true,
 *   "attempt_number": 1
 * }
 * ```
 *
 * Batch Mode Example:
 * ```json
 * {
 *   "profile_id": "uuid",
 *   "results": [
 *     { "vocabulary_id": "uuid1", "is_correct": true, "attempt_number": 1 },
 *     { "vocabulary_id": "uuid2", "is_correct": false, "attempt_number": 2 }
 *   ]
 * }
 * ```
 *
 * Documentation: .ai/progress-endpoint-implementation-plan.md
 * User Story: US-006 (Track Progress & Earn Stars)
 *
 * Security:
 * - Requires JWT authentication
 * - Validates profile ownership (profile.parent_id = auth.uid())
 * - RLS policies enforce multi-tenancy at database level
 */

import type { APIRoute } from "astro";
import { ProgressService } from "@/lib/services/progress.service";
import { RecordProgressSchema, RecordBatchProgressSchema } from "@/lib/validation/progress.schemas";

// IMPORTANT: Disable prerendering for API routes
export const prerender = false;

/**
 * POST handler - Record learning progress
 *
 * Supports two modes (auto-detected from request body structure):
 * 1. Single mode: { profile_id, vocabulary_id, is_correct, attempt_number }
 * 2. Batch mode: { profile_id, results: [...] }
 *
 * Flow:
 * 1. Authenticate: Validate JWT from Authorization header
 * 2. Parse: Read and parse request body JSON
 * 3. Detect Mode: Check if single or batch based on request structure
 * 4. Validate: Use appropriate Zod schema (RecordProgressSchema or RecordBatchProgressSchema)
 * 5. Verify Ownership: Check profile belongs to authenticated user (security)
 * 6. Record Progress: Call ProgressService with validated data
 * 7. Return: 201 Created with DTO
 *
 * Error handling:
 * - 401 if token missing or invalid
 * - 400 if JSON parsing fails or validation fails
 * - 403 if profile doesn't belong to authenticated user
 * - 404 if profile or vocabulary not found
 * - 500 for unexpected database errors
 *
 * Performance target: < 200ms for batch mode (10 words)
 */
export const POST: APIRoute = async (context) => {
  // ===================================================================
  // STEP 1: AUTHENTICATION - Verify JWT token
  // ===================================================================

  const authHeader = context.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication failed:", authError?.message);

    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Invalid or expired token",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ===================================================================
  // STEP 2: PARSE REQUEST BODY - Read JSON from request
  // ===================================================================

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "Invalid JSON in request body",
        field: "body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ===================================================================
  // STEP 3: DETECT MODE - Single vs Batch
  // ===================================================================

  // Type guard: if body has 'results' array, it's batch mode
  // Otherwise, it's single mode (has vocabulary_id field)
  const isBatchMode =
    typeof requestBody === "object" &&
    requestBody !== null &&
    "results" in requestBody &&
    Array.isArray(requestBody.results);

  // ===================================================================
  // STEP 4: VALIDATE INPUT - Check data with appropriate Zod schema
  // ===================================================================

  let validatedData: {
    profile_id: string;
    vocabulary_id?: string;
    is_correct?: boolean;
    attempt_number?: number;
    results?: { vocabulary_id: string; is_correct: boolean; attempt_number: number }[];
  };

  if (isBatchMode) {
    // BATCH MODE VALIDATION
    const validationResult = RecordBatchProgressSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];

      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: firstError.message,
          field: firstError.path.join(".") || "unknown",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    validatedData = validationResult.data;
  } else {
    // SINGLE MODE VALIDATION
    const validationResult = RecordProgressSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];

      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: firstError.message,
          field: firstError.path.join(".") || "unknown",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    validatedData = validationResult.data;
  }

  // ===================================================================
  // STEP 5: VERIFY PROFILE OWNERSHIP (Critical Security Check)
  // ===================================================================

  // Check if profile exists and belongs to authenticated user
  // This prevents users from updating progress for other parents' children
  const { data: profile, error: profileError } = await context.locals.supabase
    .from("profiles")
    .select("id, parent_id")
    .eq("id", validatedData.profile_id)
    .single();

  if (profileError || !profile) {
    return new Response(
      JSON.stringify({
        error: "not_found",
        message: "Profile not found",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Security check: Verify profile belongs to authenticated user
  if (profile.parent_id !== user.id) {
    console.error("SECURITY: User attempted to update another parent's profile progress", {
      userId: user.id,
      attemptedProfileId: validatedData.profile_id,
      actualParentId: profile.parent_id,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "forbidden",
        message: "You do not have access to this profile",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ===================================================================
  // STEP 6: RECORD PROGRESS - Call service layer
  // ===================================================================

  const progressService = new ProgressService(context.locals.supabase);

  try {
    if (isBatchMode && validatedData.results) {
      // ================================================================
      // BATCH MODE: Record multiple words (typical game session end)
      // ================================================================

      const batchResult = await progressService.recordBatchProgress({
        profile_id: validatedData.profile_id,
        results: validatedData.results,
      });

      // Success: Return 201 Created with batch response
      return new Response(JSON.stringify(batchResult), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else if (
      !isBatchMode &&
      validatedData.vocabulary_id &&
      typeof validatedData.is_correct === "boolean" &&
      typeof validatedData.attempt_number === "number"
    ) {
      // ================================================================
      // SINGLE MODE: Record one word
      // ================================================================

      const singleResult = await progressService.recordProgress({
        profile_id: validatedData.profile_id,
        vocabulary_id: validatedData.vocabulary_id,
        is_correct: validatedData.is_correct,
        attempt_number: validatedData.attempt_number,
      });

      // Success: Return 201 Created with single record DTO
      return new Response(JSON.stringify(singleResult), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // ================================================================
      // INVALID MODE (shouldn't happen with proper validation)
      // ================================================================

      return new Response(
        JSON.stringify({
          error: "validation_error",
          message:
            "Invalid request format. Must be either single mode (with vocabulary_id) or batch mode (with results array).",
          field: "body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (dbError: unknown) {
    // ===================================================================
    // STEP 7: ERROR HANDLING - Database and business logic errors
    // ===================================================================

    const error = dbError as { message?: string; code?: string };

    // Error 1: Vocabulary not found
    // Thrown by ProgressService when vocabulary_id doesn't exist
    if (error.message?.includes("Vocabulary word not found")) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: "Vocabulary word not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Error 2: RLS policy violation
    // PostgreSQL error code 42501 = insufficient_privilege
    // This should NEVER happen if profile ownership check works correctly
    if (error.code === "42501") {
      console.error("CRITICAL: RLS policy violation in recordProgress", {
        userId: user.id,
        profileId: validatedData.profile_id,
        mode: isBatchMode ? "batch" : "single",
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: "Access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Error 3: Generic database error
    // Log full details for debugging, return generic message to client
    console.error("Database error in POST /api/progress:", {
      userId: user.id,
      profileId: validatedData.profile_id,
      mode: isBatchMode ? "batch" : "single",
      wordCount: isBatchMode ? validatedData.results?.length : 1,
      errorCode: error.code,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
