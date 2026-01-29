/**
 * /api/profiles/:id/progress - Detailed progress endpoint
 *
 * GET /api/profiles/:id/progress - Get detailed word-level progress for a profile
 *
 * Documentation: .ai/progress-view-implementation-plan.md
 * User Story: US-007 (View Progress Statistics)
 *
 * Security:
 * - Requires JWT authentication
 * - RLS policies enforce profile ownership (profile.parent_id = auth.uid())
 */

import type { APIRoute } from "astro";
import { z } from "zod";

// IMPORTANT: Disable prerendering for API routes
export const prerender = false;

/**
 * Query parameters schema
 */
const QueryParamsSchema = z.object({
  category: z
    .enum(["zwierzeta", "owoce_warzywa", "pojazdy", "kolory_ksztalty", "przedmioty_codzienne"])
    .optional(),
  is_mastered: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  limit: z.string().transform(Number).pipe(z.number().int().min(1).max(500).default(100)).optional(),
  offset: z.string().transform(Number).pipe(z.number().int().min(0).default(0)).optional(),
});

/**
 * GET handler - Get detailed word-level progress
 *
 * Flow:
 * 1. Authenticate: Validate JWT from Authorization header
 * 2. Verify: Check profile ownership
 * 3. Query: Get user_progress + vocabulary (JOIN)
 * 4. Filter: Apply query params (category, is_mastered)
 * 5. Paginate: Apply limit + offset
 * 6. Return: 200 with DetailedProgressDTO
 *
 * Query Parameters:
 * - category: Filter by vocabulary category (optional)
 * - is_mastered: Filter by mastered status (optional, "true" or "false")
 * - limit: Number of results (default: 100, max: 500)
 * - offset: Pagination offset (default: 0)
 *
 * Responses:
 * - 200 OK: DetailedProgressDTO with progress array
 * - 400 Bad Request: Invalid query parameters
 * - 401 Unauthorized: Missing/invalid token
 * - 403 Forbidden: Profile belongs to different parent
 * - 404 Not Found: Profile does not exist
 * - 500 Internal Server Error: Database error
 */
export const GET: APIRoute = async (context) => {
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
  // STEP 2: EXTRACT AND VALIDATE PARAMS
  // ===================================================================

  const profileId = context.params.id;

  if (!profileId) {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "Profile ID is required",
        field: "id",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // Parse query params
  const url = new URL(context.request.url);
  const queryParams = {
    category: url.searchParams.get("category"),
    is_mastered: url.searchParams.get("is_mastered"),
    limit: url.searchParams.get("limit"),
    offset: url.searchParams.get("offset"),
  };

  const validationResult = QueryParamsSchema.safeParse(queryParams);

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

  const { category, is_mastered, limit = 100, offset = 0 } = validationResult.data;

  // ===================================================================
  // STEP 3: VERIFY PROFILE OWNERSHIP
  // ===================================================================

  const { data: profile, error: profileError } = await context.locals.supabase
    .from("profiles")
    .select("id, parent_id")
    .eq("id", profileId)
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
  // STEP 4: QUERY USER PROGRESS WITH VOCABULARY (JOIN)
  // ===================================================================

  try {
    // Build query with JOIN
    let query = context.locals.supabase
      .from("user_progress")
      .select(
        `
        id,
        vocabulary_id,
        is_mastered,
        stars_earned,
        attempts_count,
        last_attempted_at,
        created_at,
        vocabulary:vocabulary_id (
          word_text,
          category,
          image_path
        )
      `,
        { count: "exact" }
      )
      .eq("profile_id", profileId);

    // Apply filters
    if (category) {
      query = query.eq("vocabulary.category", category);
    }

    if (is_mastered !== undefined) {
      query = query.eq("is_mastered", is_mastered);
    }

    // Apply ordering (latest first)
    query = query.order("last_attempted_at", { ascending: false, nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: progressData, error: progressError, count } = await query;

    if (progressError) {
      throw progressError;
    }

    // Map to DetailedProgressItem format
    const progress = (progressData || []).map((item: any) => ({
      id: item.id,
      vocabulary_id: item.vocabulary_id,
      word_text: item.vocabulary?.word_text || "",
      category: item.vocabulary?.category || "",
      image_path: item.vocabulary?.image_path || "",
      is_mastered: item.is_mastered,
      stars_earned: item.stars_earned,
      attempts_count: item.attempts_count,
      last_attempted_at: item.last_attempted_at,
      created_at: item.created_at,
    }));

    // Build pagination metadata
    const total = count ?? 0;
    const has_more = offset + limit < total;

    // Success: Return 200 OK with DetailedProgressDTO
    return new Response(
      JSON.stringify({
        profile_id: profileId,
        progress,
        pagination: {
          total,
          limit,
          offset,
          has_more,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (dbError: unknown) {
    const error = dbError as { message?: string; code?: string };

    console.error("Database error in GET /api/profiles/:id/progress:", {
      userId: user.id,
      profileId,
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
