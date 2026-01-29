/**
 * API Endpoint: /api/categories
 *
 * Handles vocabulary category operations
 *
 * Methods:
 * - GET: List all available categories with word counts
 */

import type { APIRoute } from "astro";
import { CategoryService } from "@/lib/services/category.service";
import type { CategoriesListDTO, ErrorResponse } from "@/types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/categories
 *
 * Returns available vocabulary categories with word counts
 *
 * Query Parameters:
 * - language (optional): Language code, default 'pl'
 *
 * Response:
 * - 200 OK: CategoriesListDTO
 * - 401 Unauthorized: Missing or invalid token
 * - 500 Internal Server Error: Database error
 *
 * @example
 * GET /api/categories?language=pl
 *
 * Response:
 * {
 *   "categories": [
 *     {
 *       "code": "zwierzeta",
 *       "name": "Zwierzęta",
 *       "word_count": 50
 *     },
 *     ...
 *   ],
 *   "total_words": 250
 * }
 */
export const GET: APIRoute = async ({ locals, url }) => {
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
  // QUERY PARAMETERS
  // ===================================================================

  const languageCode = url.searchParams.get("language") || "pl";

  // ===================================================================
  // FETCH CATEGORIES
  // ===================================================================

  try {
    const categoriesData: CategoriesListDTO = await CategoryService.getAllCategories(supabase, languageCode);

    return new Response(JSON.stringify(categoriesData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Database or service error
    const errorResponse: ErrorResponse = {
      error: "internal_server_error",
      message: error instanceof Error ? error.message : "Failed to fetch categories",
    };

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
