/**
 * Forgot Password API Endpoint
 *
 * POST /api/auth/forgot-password
 *
 * Sends password reset email via Supabase Auth
 *
 * Request Body:
 * {
 *   email: string
 * }
 *
 * Response:
 * - 200 OK: { success: true, message: "Email wysłany" }
 * - 400 Bad Request: { error: "validation_error", message: "..." }
 * - 500 Internal Server Error: { error: "server_error", message: "..." }
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Wprowadź poprawny adres email"),
});

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);

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

    const { email } = result.data;
    const supabase = locals.supabase;

    // Generate reset password link pointing to /auth/reset-password
    const redirectTo = `${url.origin}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("Forgot password error:", error);
      return new Response(
        JSON.stringify({
          error: "reset_failed",
          message: "Nie udało się wysłać emaila. Spróbuj ponownie",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Always return success (security best practice - don't reveal if email exists)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Jeśli podany email istnieje w systemie, wysłaliśmy link do resetowania hasła",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected forgot password error:", error);
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
