/**
 * API Endpoint: /api/profiles/:id/progress/categories
 *
 * Returns progress breakdown by category for a profile
 *
 * Methods:
 * - GET: Get category progress for profile
 */

import type { APIRoute } from "astro";
import { ProfileService } from "@/lib/services/profile.service";
import type { CategoryProgressDTO, ErrorResponse } from "@/types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/profiles/:id/progress/categories
 *
 * Returns progress breakdown by category for tracker display
 *
 * Path Parameters:
 * - id: Profile ID (UUID)
 *
 * Query Parameters:
 * - language (optional): Language code, default 'pl'
 *
 * Response:
 * - 200 OK: CategoryProgressDTO
 * - 401 Unauthorized: Missing or invalid token
 * - 404 Not Found: Profile not found
 * - 500 Internal Server Error: Database error
 *
 * @example
 * GET /api/profiles/uuid-123/progress/categories?language=pl
 *
 * Response:
 * {
 *   "profile_id": "uuid-123",
 *   "language": "pl",
 *   "categories": [
 *     {
 *       "category": "zwierzeta",
 *       "total_words": 50,
 *       "mastered_words": 12,
 *       "completion_percentage": 24.0
 *     },
 *     ...
 *   ],
 *   "overall": {
 *     "total_words": 250,
 *     "mastered_words": 45,
 *     "completion_percentage": 18.0
 *   }
 * }
 */
export const GET: APIRoute = async ({ locals, params, url }) => {
  // ===================================================================
  // AUTHENTICATION
  // ===================================================================

  const supabase = locals.supabase;

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ErrorResponse = {
      error: "unauthorized",
      message: "Authentication required",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // ===================================================================
  // PATH PARAMETERS
  // ===================================================================

  const profileId = params.id;

  if (!profileId) {
    const errorResponse: ErrorResponse = {
      error: "validation_error",
      message: "Profile ID is required",
      field: "id",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // ===================================================================
  // QUERY PARAMETERS
  // ===================================================================

  const languageCode = url.searchParams.get("language") || "pl";

  // ===================================================================
  // VERIFY PROFILE OWNERSHIP
  // ===================================================================

  // Check if profile belongs to authenticated user (via RLS)
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, parent_id")
    .eq("id", profileId)
    .single();

  if (profileError || !profile) {
    const errorResponse: ErrorResponse = {
      error: "not_found",
      message: "Profile not found or access denied",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 404,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // ===================================================================
  // FETCH CATEGORY PROGRESS
  // ===================================================================

  try {
    const service = new ProfileService(supabase);
    const progressData: CategoryProgressDTO = await service.getCategoryProgress(profileId, languageCode);

    return new Response(JSON.stringify(progressData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Database or service error
    const errorResponse: ErrorResponse = {
      error: "internal_server_error",
      message: error instanceof Error ? error.message : "Failed to fetch category progress",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
