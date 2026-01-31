/**
 * Logout API Endpoint
 *
 * POST /api/auth/logout
 *
 * Handles user logout by:
 * 1. Signing out from Supabase Auth
 * 2. Clearing session cookies
 * 3. Returning success response
 *
 * Response:
 * - 200 OK: { success: true, message: "Logged out successfully" }
 * - 500 Internal Server Error: { error: "logout_failed", message: "..." }
 */

import type { APIRoute } from "astro";

export const prerender = false;

/**
 * POST handler - Logout user
 */
export const POST: APIRoute = async ({ locals, cookies }) => {
  try {
    const supabase = locals.supabase;

    // Sign out from Supabase Auth
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout error:", error);
      return new Response(
        JSON.stringify({
          error: "logout_failed",
          message: "Nie udało się wylogować",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Clear all Supabase-related cookies
    // Supabase uses cookies with prefix "sb-"
    const cookieNames = ["sb-access-token", "sb-refresh-token", "sb-auth-token"];

    for (const cookieName of cookieNames) {
      cookies.delete(cookieName, { path: "/" });
    }

    // Return success
    return new Response(
      JSON.stringify({
        success: true,
        message: "Wylogowano pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected logout error:", error);
    return new Response(
      JSON.stringify({
        error: "server_error",
        message: "Wystąpił nieoczekiwany błąd",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
