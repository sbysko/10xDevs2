/**
 * /api/profiles/:id/stats - Profile statistics endpoint
 *
 * GET /api/profiles/:id/stats - Get aggregated statistics for a profile
 *
 * Documentation: .ai/progress-view-implementation-plan.md
 * User Story: US-007 (View Progress Statistics)
 *
 * Security:
 * - Requires JWT authentication
 * - RLS policies enforce profile ownership (profile.parent_id = auth.uid())
 */

import type { APIRoute } from "astro";

// IMPORTANT: Disable prerendering for API routes
export const prerender = false;

/**
 * GET handler - Get profile statistics
 *
 * Flow:
 * 1. Authenticate: Validate JWT from Authorization header
 * 2. Verify: Check profile ownership
 * 3. Query: Get stats from profile_stats view
 * 4. Return: 200 with ProfileStatsDTO
 *
 * Responses:
 * - 200 OK: ProfileStatsDTO with aggregated stats
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
  // STEP 2: EXTRACT PROFILE ID FROM URL
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
  // STEP 4: QUERY PROFILE STATS VIEW
  // ===================================================================

  try {
    const { data: stats, error: statsError } = await context.locals.supabase
      .from("profile_stats")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    if (statsError) {
      throw statsError;
    }

    if (!stats) {
      // Profile exists but has no stats yet (no words attempted)
      // Get profile details for response
      const { data: profileDetails } = await context.locals.supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", profileId)
        .single();

      return new Response(
        JSON.stringify({
          profile_id: profileId,
          display_name: profileDetails?.display_name || "Unknown",
          avatar_url: profileDetails?.avatar_url || null,
          total_words_attempted: 0,
          words_mastered: 0,
          total_stars: 0,
          mastery_percentage: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success: Return 200 OK with ProfileStatsDTO
    return new Response(JSON.stringify(stats), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (dbError: unknown) {
    const error = dbError as { message?: string; code?: string };

    console.error("Database error in GET /api/profiles/:id/stats:", {
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
