/**
 * Reset Password API Endpoint
 *
 * POST /api/auth/reset-password
 *
 * Updates user password after clicking email link
 *
 * Request Body:
 * {
 *   password: string (min 8 chars)
 * }
 *
 * Headers:
 * - Authorization: Bearer <access_token> (from URL hash)
 *
 * Response:
 * - 200 OK: { success: true, message: "Hasło zmienione" }
 * - 400 Bad Request: { error: "validation_error", message: "..." }
 * - 401 Unauthorized: { error: "unauthorized", message: "..." }
 * - 500 Internal Server Error: { error: "server_error", message: "..." }
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const resetPasswordSchema = z.object({
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków").max(72, "Hasło może mieć maksymalnie 72 znaki"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: result.error.errors[0].message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { password } = result.data;
    const supabase = locals.supabase;

    // Verify user session (token from email link should be in cookies)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({
          error: "unauthorized",
          message: "Sesja wygasła. Poproś o nowy link resetowania hasła",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error("Reset password error:", error);
      return new Response(
        JSON.stringify({
          error: "update_failed",
          message: "Nie udało się zmienić hasła. Spróbuj ponownie",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Hasło zostało zmienione. Możesz się teraz zalogować",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected reset password error:", error);
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
