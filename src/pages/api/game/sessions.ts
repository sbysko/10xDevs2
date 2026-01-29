/**
 * /api/game/sessions - Game session management endpoint
 *
 * POST /api/game/sessions - Create new game session with 80/20 word selection
 *
 * Documentation: .ai/game-session-view-implementation-plan.md
 * User Story: US-004 (Start Game Session)
 *
 * Security:
 * - Requires JWT authentication
 * - RLS policies enforce profile ownership (profile.parent_id = auth.uid())
 */

import type { APIRoute } from "astro";
import { GameSessionService } from "@/lib/services/game-session.service";
import { z } from "zod";

// IMPORTANT: Disable prerendering for API routes
export const prerender = false;

/**
 * Validation schema for creating game session
 */
const CreateGameSessionSchema = z.object({
  /**
   * Profile ID of the child playing
   * Required field
   */
  profile_id: z.string().uuid("Profile ID must be a valid UUID"),

  /**
   * Vocabulary category filter
   * Optional - null means mixed categories
   */
  category: z
    .enum(["zwierzeta", "owoce_warzywa", "pojazdy", "kolory_ksztalty", "przedmioty_codzienne"])
    .nullable()
    .optional(),

  /**
   * Number of words in session
   * Optional - defaults to 10
   * Min: 5, Max: 20
   */
  word_count: z.number().int().min(5).max(20).default(10).optional(),
});

/**
 * POST handler - Create new game session
 *
 * Flow:
 * 1. Authenticate: Extract and validate JWT from Authorization header
 * 2. Parse: Read and parse request body JSON
 * 3. Validate: Check input data with Zod schema
 * 4. Create: Call GameSessionService to generate session with 80/20 algorithm
 * 5. Return: 201 with GameSessionDTO
 *
 * Error handling:
 * - 401 if token missing or invalid
 * - 400 if JSON parsing fails or validation fails
 * - 422 if insufficient words available (InsufficientWordsErrorDTO)
 * - 500 for unexpected database errors
 */
export const POST: APIRoute = async (context) => {
  // ===================================================================
  // STEP 1: AUTHENTICATION - Verify JWT token
  // ===================================================================

  const authHeader = context.request.headers.get("Authorization");

  // Check if Authorization header exists and has Bearer format
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

  // Verify JWT token with Supabase Auth
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
  // STEP 3: VALIDATE INPUT - Check data with Zod schema
  // ===================================================================

  const validationResult = CreateGameSessionSchema.safeParse(requestBody);

  if (!validationResult.success) {
    // Extract first validation error for user-friendly message
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

  const validatedData = validationResult.data;

  // ===================================================================
  // STEP 4: VERIFY PROFILE OWNERSHIP
  // ===================================================================

  // Check if profile belongs to authenticated user
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

  if (profile.parent_id !== user.id) {
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
  // STEP 5: CREATE GAME SESSION - Call service layer
  // ===================================================================

  const gameSessionService = new GameSessionService(context.locals.supabase);

  try {
    const session = await gameSessionService.createSession({
      profile_id: validatedData.profile_id,
      category: validatedData.category ?? null,
      word_count: validatedData.word_count ?? 10,
    });

    // Success: Return 201 Created with GameSessionDTO
    return new Response(JSON.stringify(session), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (dbError: unknown) {
    // ===================================================================
    // STEP 6: ERROR HANDLING - Database and business logic errors
    // ===================================================================

    const error = dbError as { message?: string; code?: string; available?: number; requested?: number };

    // Error 1: Insufficient words available
    if (error.code === "insufficient_words") {
      return new Response(
        JSON.stringify({
          error: "insufficient_words",
          message: `Not enough words available in selected category. Available: ${error.available}, Requested: ${error.requested}`,
          available: error.available ?? 0,
          requested: error.requested ?? 10,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Error 2: RLS policy violation (should NOT happen with correct implementation)
    if (error.code === "42501") {
      console.error("CRITICAL: RLS policy violation in createSession", {
        userId: user.id,
        profileId: validatedData.profile_id,
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
    console.error("Database error in POST /api/game/sessions:", {
      userId: user.id,
      profileId: validatedData.profile_id,
      category: validatedData.category,
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
