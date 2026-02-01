/**
 * Register API Endpoint
 *
 * POST /api/auth/register
 *
 * Handles user registration with:
 * - Zod validation for email and password
 * - Supabase Auth signUp
 * - Proper error handling with user-friendly messages
 *
 * Request Body:
 * {
 *   email: string (valid email format)
 *   password: string (min 8 chars)
 * }
 *
 * Response:
 * - 200 OK: { user: {...}, session: {...} } or { user: {...}, email_confirmation_required: true }
 * - 400 Bad Request: { error: "validation_error", message: "..." }
 * - 409 Conflict: { error: "user_exists", message: "..." }
 * - 500 Internal Server Error: { error: "server_error", message: "..." }
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Zod schema for registration validation
const registerSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Wprowadź poprawny adres email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków").max(72, "Hasło może mieć maksymalnie 72 znaki"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: result.error.errors[0].message,
          field: result.error.errors[0].path[0],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = result.data;
    const supabase = locals.supabase;

    // Sign up with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Registration error:", error);

      // Map Supabase errors to user-friendly messages
      let errorMessage = "Wystąpił błąd podczas rejestracji";
      let errorCode = "registration_failed";
      let statusCode = 500;

      if (error.message.includes("User already registered")) {
        errorMessage = "Ten adres email jest już zarejestrowany";
        errorCode = "user_exists";
        statusCode = 409;
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Nieprawidłowy format adresu email";
        errorCode = "invalid_email";
        statusCode = 400;
      } else if (error.message.includes("Password")) {
        errorMessage = "Hasło nie spełnia wymagań bezpieczeństwa";
        errorCode = "weak_password";
        statusCode = 400;
      }

      return new Response(
        JSON.stringify({
          error: errorCode,
          message: errorMessage,
        }),
        {
          status: statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "registration_failed",
          message: "Nie udało się utworzyć konta",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email confirmation is required
    if (!data.session) {
      // Email confirmation is enabled - user needs to confirm email
      return new Response(
        JSON.stringify({
          user: {
            id: data.user.id,
            email: data.user.email,
          },
          email_confirmation_required: true,
          message: "Rejestracja udana! Sprawdź swoją skrzynkę email i potwierdź adres.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Auto-login successful (email confirmation disabled)
    // Session is automatically set via cookies by Supabase client
    // Return success response with redirect flag
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        session: {
          access_token: data.session.access_token,
        },
        redirect: "/profiles",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected registration error:", error);
    return new Response(
      JSON.stringify({
        error: "server_error",
        message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
