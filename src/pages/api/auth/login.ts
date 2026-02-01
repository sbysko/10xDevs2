/**
 * Login API Endpoint
 *
 * POST /api/auth/login
 *
 * Handles user authentication with:
 * - Zod validation for email and password
 * - Supabase Auth signInWithPassword
 * - Proper error handling with user-friendly messages
 *
 * Request Body:
 * {
 *   email: string (valid email format)
 *   password: string (min 8 chars)
 * }
 *
 * Response:
 * - 200 OK: { user: {...}, profile_count: number }
 * - 400 Bad Request: { error: "validation_error", message: "..." }
 * - 401 Unauthorized: { error: "invalid_credentials", message: "..." }
 * - 500 Internal Server Error: { error: "server_error", message: "..." }
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Zod schema for login validation
const loginSchema = z.object({
  email: z.string().min(1, "Email jest wymagany").email("Wprowadź poprawny adres email"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Validate with Zod
    const result = loginSchema.safeParse(body);

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

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);

      // Map Supabase errors to user-friendly messages
      let errorMessage = "Wystąpił błąd podczas logowania";
      let errorCode = "login_failed";

      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy email lub hasło";
        errorCode = "invalid_credentials";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Potwierdź swój adres email";
        errorCode = "email_not_confirmed";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę";
        errorCode = "rate_limit";
      }

      return new Response(
        JSON.stringify({
          error: errorCode,
          message: errorMessage,
        }),
        {
          status: error.status || 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: "login_failed",
          message: "Nie udało się zalogować",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check how many profiles this user has
    const { count, error: profileError } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", data.user.id);

    if (profileError) {
      console.error("Profile count error:", profileError);
    }

    // Return success with profile count for client-side redirect logic
    return new Response(
      JSON.stringify({
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        profile_count: count ?? 0,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected login error:", error);
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
