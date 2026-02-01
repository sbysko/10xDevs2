# Plan Integracji Autentykacji - Backend & Frontend Integration

**Data utworzenia:** 2026-02-01
**Wersja:** 1.0
**Status:** Do implementacji

---

## 🎯 Kontekst i Wymagania

### Wybrane Opcje Implementacyjne

1. **Opcja B**: API endpoint `/api/auth/login` + wywołanie z React przez `fetch()`
2. **Opcja B**: Inteligentny redirect (0→onboarding, 1→auto-select, 2+→profiles/select)
3. **Opcja B**: Migracja na `/auth/login`, `/auth/register`
4. **Opcja A**: Full page reload po zalogowaniu (`window.location.href`)
5. **Opcja A**: Pełna implementacja forgot password flow

### Powiązane Dokumenty

- `prd.md` - User Stories: US-001 (Rejestracja), US-002 (Logowanie), US-003 (Wylogowanie)
- `auth-spec.md` - Specyfikacja techniczna systemu autentykacji
- `supabase-auth.mdc` - Best practices dla Supabase Auth w Astro

---

## 📋 Szczegółowy Plan Implementacji

### **FAZA 1: Refaktoryzacja Middleware i Struktura Ścieżek**

#### 1.1. Modyfikacja Middleware

**Plik:** `src/middleware/index.ts`
**Linie do zmiany:** 28-140

**Obecny stan:**
```typescript
const PUBLIC_ROUTES = ["/login", "/register"];
const AUTH_ROUTES = ["/login", "/register"];
```

**Nowy stan zgodny z auth-spec:**
```typescript
// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
];

const AUTH_PAGES = ["/auth/login", "/auth/register"];
```

**Zmiana głównej logiki middleware:**

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY required");
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(key: string) {
        return context.cookies.get(key)?.value;
      },
      set(key: string, value: string, options: Record<string, unknown>) {
        context.cookies.set(key, value, options);
      },
      remove(key: string, options: Record<string, unknown>) {
        context.cookies.delete(key, options);
      },
    },
  });

  context.locals.supabase = supabase as SupabaseClient;

  const pathname = new URL(context.request.url).pathname;

  // Skip for API routes (they handle auth internally)
  if (pathname.startsWith("/api/")) {
    return next();
  }

  // Skip for static assets
  if (pathname.startsWith("/_") || pathname.includes(".")) {
    return next();
  }

  // Check if path is public
  const isPublic = PUBLIC_PATHS.includes(pathname);

  // Get user session with PROPER error handling
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error("Auth error in middleware:", error);
  }

  // Store user in locals if authenticated
  if (user) {
    context.locals.user = {
      id: user.id,
      email: user.email || "",
    };
  }

  // REDIRECT LOGIC

  // 1. Authenticated user trying to access auth pages → redirect to smart handler
  if (user && AUTH_PAGES.includes(pathname)) {
    return context.redirect("/profiles");
  }

  // 2. Non-authenticated user on protected route → redirect to login
  if (!user && !isPublic) {
    const redirectUrl = new URL("/auth/login", context.url.origin);
    if (pathname !== "/") {
      redirectUrl.searchParams.set("redirect", pathname);
    }
    return context.redirect(redirectUrl.toString());
  }

  return next();
});
```

**Kluczowe zmiany:**
- ✅ Zmiana nazwy z `PUBLIC_ROUTES` na `PUBLIC_PATHS` (zgodnie z auth-spec)
- ✅ Użycie `supabase.auth.getUser()` zamiast `getSession()` (best practice)
- ✅ Przechowywanie `user` w `Astro.locals.user` (zgodnie z auth-spec)
- ✅ Redirect zalogowanych userów z `/auth/login` na `/profiles`

---

#### 1.2. Aktualizacja env.d.ts

**Plik:** `src/env.d.ts`

**Dodanie typu user w Locals:**

```typescript
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace App {
  interface Locals {
    supabase: import("./db/supabase.client").SupabaseClient;
    user?: {
      id: string;
      email: string;
    };
  }
}
```

---

### **FAZA 2: Migracja Plików i Ścieżek**

#### 2.1. Utworzenie struktury `/auth/`

**Operacje:**
```bash
# Utwórz folder auth
mkdir src/pages/auth

# Przenieś pliki
mv src/pages/login.astro src/pages/auth/login.astro
# mv src/pages/register.astro src/pages/auth/register.astro (jeśli istnieje)
```

#### 2.2. Aktualizacja login.astro

**Plik:** `src/pages/auth/login.astro`

```astro
---
import Layout from "@/layouts/Layout.astro";
import LoginForm from "@/components/LoginForm";

export const prerender = false;

// Server-side check handled by middleware
// User is redirected from /auth/login if already authenticated
const { user } = Astro.locals;

if (user) {
  // This should not happen due to middleware, but defensive check
  return Astro.redirect("/profiles");
}
---

<Layout title="Logowanie - Dopasuj Obrazek do Słowa">
  <div
    class="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
  >
    <div class="w-full max-w-md py-8">
      <LoginForm client:load />
    </div>
  </div>
</Layout>
```

**Zmiana:** Link do forgot-password w komponencie będzie wskazywać na `/auth/forgot-password`

---

### **FAZA 3: API Endpoints - Login, Forgot Password, Reset Password**

#### 3.1. Utworzenie /api/auth/login.ts

**Plik:** `src/pages/api/auth/login.ts`

```typescript
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
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Wprowadź poprawny adres email"),
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków"),
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
```

**Kluczowe elementy:**
- ✅ Walidacja Zod zgodnie z CLAUDE.md
- ✅ User-friendly error messages po polsku
- ✅ Zwracanie `profile_count` dla logiki redirect
- ✅ Proper error handling z fallback

---

#### 3.2. Utworzenie /api/auth/forgot-password.ts

**Plik:** `src/pages/api/auth/forgot-password.ts`

```typescript
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
 * - 200 OK: { message: "Email wysłany" }
 * - 400 Bad Request: { error: "validation_error", message: "..." }
 * - 500 Internal Server Error: { error: "server_error", message: "..." }
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email jest wymagany")
    .email("Wprowadź poprawny adres email"),
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
```

---

#### 3.3. Utworzenie /api/auth/reset-password.ts

**Plik:** `src/pages/api/auth/reset-password.ts`

```typescript
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
 * - 200 OK: { message: "Hasło zmienione" }
 * - 400 Bad Request: { error: "validation_error", message: "..." }
 * - 401 Unauthorized: { error: "unauthorized", message: "..." }
 * - 500 Internal Server Error: { error: "server_error", message: "..." }
 */

import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Hasło musi mieć minimum 8 znaków")
    .max(72, "Hasło może mieć maksymalnie 72 znaki"),
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();

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
```

---

### **FAZA 4: Refaktoryzacja LoginForm.tsx**

#### 4.1. Modyfikacja LoginForm.tsx

**Plik:** `src/components/LoginForm.tsx`

**Główne zmiany:**

1. **Usunięcie direct Supabase client:**
```typescript
// REMOVE:
import { createBrowserClient } from "@supabase/ssr";
const supabase = createBrowserClient(...);
```

2. **Dodanie fetch do API endpoint:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);

  // Client-side validation (unchanged)
  if (!formData.email) {
    setError({ message: "Wprowadź adres email", field: "email" });
    return;
  }

  if (!validateEmail(formData.email)) {
    setError({ message: "Wprowadź poprawny adres email", field: "email" });
    return;
  }

  if (!formData.password) {
    setError({ message: "Wprowadź hasło", field: "password" });
    return;
  }

  if (formData.password.length < 8) {
    setError({
      message: "Hasło musi mieć minimum 8 znaków",
      field: "password",
    });
    return;
  }

  setIsLoading(true);

  try {
    // Call API endpoint instead of direct Supabase
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle API errors
      setError({ message: data.message || "Wystąpił błąd podczas logowania" });
      setIsLoading(false);
      return;
    }

    // SUCCESS - Redirect based on profile_count
    const { profile_count } = data;

    let redirectUrl = "/profiles"; // default

    if (profile_count === 0) {
      redirectUrl = "/onboarding";
    } else if (profile_count === 1) {
      // Auto-select logic will be handled server-side or in /profiles page
      redirectUrl = "/profiles";
    } else {
      // 2+ profiles
      redirectUrl = "/profiles";
    }

    // Check for redirect query param
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get("redirect");

    if (redirectParam) {
      redirectUrl = redirectParam;
    }

    // Full page reload to refresh server session
    window.location.href = redirectUrl;

  } catch (err) {
    console.error("Login error:", err);
    setError({ message: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie" });
    setIsLoading(false);
  }
};
```

3. **Aktualizacja linków:**
```typescript
{/* Forgot password link */}
<div className="text-right">
  <a
    href="/auth/forgot-password"
    className="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
  >
    Zapomniałeś hasła?
  </a>
</div>

{/* Register link */}
<div className="mt-6 text-center">
  <p className="text-sm text-gray-600">
    Nie masz konta?{" "}
    <a href="/auth/register" className="font-medium text-purple-600 hover:text-purple-700 hover:underline">
      Zarejestruj się
    </a>
  </p>
</div>
```

---

### **FAZA 5: Forgot Password i Reset Password UI**

#### 5.1. Utworzenie /auth/forgot-password.astro

**Plik:** `src/pages/auth/forgot-password.astro`

```astro
---
import Layout from "@/layouts/Layout.astro";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const prerender = false;
---

<Layout title="Zresetuj hasło - Dopasuj Obrazek do Słowa">
  <div
    class="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
  >
    <div class="w-full max-w-md py-8">
      <ForgotPasswordForm client:load />
    </div>
  </div>
</Layout>
```

#### 5.2. Utworzenie ForgotPasswordForm.tsx

**Plik:** `src/components/ForgotPasswordForm.tsx`

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email) {
      setError("Wprowadź adres email");
      return;
    }

    if (!validateEmail(email)) {
      setError("Wprowadź poprawny adres email");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Wystąpił błąd. Spróbuj ponownie");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Email wysłany!</h1>
            <p className="text-gray-600">
              Jeśli podany email istnieje w systemie, wysłaliśmy na niego link do resetowania hasła.
            </p>
          </div>

          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Sprawdź swoją skrzynkę email i kliknij w link, aby zresetować hasło.
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => window.location.href = "/auth/login"}
              className="w-full"
            >
              Wróć do logowania
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Zapomniałeś hasła?</h1>
          <p className="text-gray-600">Wprowadź swój email, a wyślemy link do resetowania</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Adres email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rodzic@example.com"
              disabled={isLoading}
              autoComplete="email"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a href="/auth/login" className="text-sm text-purple-600 hover:text-purple-700 hover:underline">
            Wróć do logowania
          </a>
        </div>
      </div>
    </div>
  );
}
```

#### 5.3. Utworzenie /auth/reset-password.astro

**Plik:** `src/pages/auth/reset-password.astro`

```astro
---
import Layout from "@/layouts/Layout.astro";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const prerender = false;

// Extract access_token from URL hash (Supabase sends it there after email click)
// This will be handled in React component via useEffect
---

<Layout title="Ustaw nowe hasło - Dopasuj Obrazek do Słowa">
  <div
    class="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500"
  >
    <div class="w-full max-w-md py-8">
      <ResetPasswordForm client:load />
    </div>
  </div>
</Layout>
```

#### 5.4. Utworzenie ResetPasswordForm.tsx

**Plik:** `src/components/ResetPasswordForm.tsx`

```typescript
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if we have access_token in URL hash (from Supabase email link)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");

    if (accessToken) {
      setHasToken(true);
    } else {
      setError("Link resetowania hasła jest nieprawidłowy lub wygasł");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError("Wprowadź nowe hasło");
      return;
    }

    if (password.length < 8) {
      setError("Hasło musi mieć minimum 8 znaków");
      return;
    }

    if (password !== confirmPassword) {
      setError("Hasła nie są identyczne");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Wystąpił błąd. Spróbuj ponownie");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setIsLoading(false);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = "/auth/login";
      }, 2000);

    } catch (err) {
      console.error("Reset password error:", err);
      setError("Wystąpił nieoczekiwany błąd. Spróbuj ponownie");
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-green-600 mb-2">Hasło zmienione!</h1>
            <p className="text-gray-600">
              Twoje hasło zostało pomyślnie zmienione. Za chwilę przekierujemy Cię do logowania.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-red-600 mb-2">Link wygasł</h1>
            <p className="text-gray-600">
              Link resetowania hasła jest nieprawidłowy lub wygasł.
            </p>
          </div>

          <Button
            onClick={() => window.location.href = "/auth/forgot-password"}
            className="w-full"
          >
            Poproś o nowy link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ustaw nowe hasło</h1>
          <p className="text-gray-600">Wprowadź swoje nowe hasło poniżej</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">Nowe hasło</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Zmieniam hasło..." : "Zmień hasło"}
          </Button>
        </form>
      </div>
    </div>
  );
}
```

---

### **FAZA 6: Profile Selection Logic**

#### 6.1. Rozszerzenie logiki w profiles.astro

**Plik:** `src/pages/profiles.astro`

**Dodanie smart redirect logic:**

```astro
---
import Layout from "@/layouts/Layout.astro";
import ProfileManager from "@/components/ProfileManager";
import AppHeader from "@/components/AppHeader";

export const prerender = false;

const { user } = Astro.locals;

if (!user) {
  return Astro.redirect("/auth/login");
}

const supabase = Astro.locals.supabase;

// Fetch profiles for this user
const { data: profiles, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("parent_id", user.id);

if (error) {
  console.error("Error fetching profiles:", error);
}

const profileCount = profiles?.length ?? 0;

// SMART REDIRECT LOGIC
// If 0 profiles → redirect to onboarding
if (profileCount === 0) {
  return Astro.redirect("/onboarding");
}

// If 1 profile → auto-select and redirect to dashboard
if (profileCount === 1) {
  const profile = profiles[0];

  // Set active profile cookie
  Astro.cookies.set("app_active_profile_id", profile.id, {
    path: "/",
    httpOnly: false, // Must be accessible from JS
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return Astro.redirect("/dashboard");
}

// If 2+ profiles → show selection screen (continue rendering)
---

<Layout title="Wybierz Profil - Dopasuj Obrazek do Słowa">
  <AppHeader client:load />

  <main class="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 p-4 md:p-8">
    <div class="mx-auto max-w-6xl">
      <header class="mb-8 text-center">
        <h1 class="mb-2 text-4xl font-bold text-purple-800 md:text-5xl">Kto dziś gra?</h1>
        <p class="text-lg text-purple-600 md:text-xl">Wybierz swój profil, aby rozpocząć zabawę!</p>
      </header>

      <ProfileManager client:load />
    </div>
  </main>
</Layout>
```

**Alternatywnie:** Możesz utworzyć osobną stronę `/profiles/select` jeśli chcesz mieć wyraźną separację.

---

## 🧪 Checklist Testowania

Po implementacji przetestuj następujące scenariusze:

### Login Flow:
- [ ] Logowanie z pustym emailem → błąd walidacji
- [ ] Logowanie z nieprawidłowym formatem email → błąd walidacji
- [ ] Logowanie z poprawnym email ale błędnym hasłem → błąd "Nieprawidłowy email lub hasło"
- [ ] Logowanie z poprawnymi danymi (0 profili) → redirect `/onboarding`
- [ ] Logowanie z poprawnymi danymi (1 profil) → auto-select + redirect `/dashboard`
- [ ] Logowanie z poprawnymi danymi (2+ profile) → redirect `/profiles` (select screen)

### Forgot Password Flow:
- [ ] Kliknięcie "Zapomniałeś hasła?" → redirect `/auth/forgot-password`
- [ ] Wysłanie formularza z pustym email → błąd walidacji
- [ ] Wysłanie formularza z poprawnym email → sukces + komunikat
- [ ] Sprawdzenie czy email dotarł (test na prawdziwym emailu)
- [ ] Kliknięcie linku w emailu → redirect `/auth/reset-password` z tokenem

### Reset Password Flow:
- [ ] Wejście na `/auth/reset-password` bez tokenu → komunikat o błędzie
- [ ] Wejście z tokenu (po kliknięciu emaila) → formularz zmiany hasła
- [ ] Zmiana hasła na zbyt krótkie → błąd walidacji
- [ ] Zmiana hasła (niezgodne potwierdzenie) → błąd "Hasła nie są identyczne"
- [ ] Zmiana hasła (poprawne dane) → sukces + redirect `/auth/login`
- [ ] Logowanie z nowym hasłem → sukces

### Middleware & Protected Routes:
- [ ] Próba wejścia na `/dashboard` bez logowania → redirect `/auth/login?redirect=/dashboard`
- [ ] Próba wejścia na `/auth/login` gdy zalogowany → redirect `/profiles`
- [ ] Wylogowanie → czyszczenie cookies + redirect `/auth/login`

---

## 📊 Struktura Plików Po Implementacji

```
src/
├── pages/
│   ├── auth/
│   │   ├── login.astro ✅ (przeniesione z /login.astro)
│   │   ├── register.astro ✅ (przeniesione z /register.astro)
│   │   ├── forgot-password.astro ✅ (nowe)
│   │   └── reset-password.astro ✅ (nowe)
│   ├── api/
│   │   └── auth/
│   │       ├── login.ts ✅ (nowe)
│   │       ├── logout.ts ✅ (istniejące)
│   │       ├── forgot-password.ts ✅ (nowe)
│   │       └── reset-password.ts ✅ (nowe)
│   ├── profiles.astro ✅ (rozszerzone o redirect logic)
│   └── dashboard.astro (TODO - będzie wymagał aktywnego profilu)
├── components/
│   ├── LoginForm.tsx ✅ (zrefaktoryzowane - fetch zamiast direct Supabase)
│   ├── ForgotPasswordForm.tsx ✅ (nowe)
│   └── ResetPasswordForm.tsx ✅ (nowe)
├── middleware/
│   └── index.ts ✅ (zaktualizowane - PUBLIC_PATHS + user w locals)
├── db/
│   └── supabase.client.ts ✅ (bez zmian)
└── env.d.ts ✅ (zaktualizowane - Locals.user)
```

---

## 🎯 Podsumowanie Kluczowych Decyzji

| Aspekt | Wybrana Opcja | Uzasadnienie |
|--------|---------------|--------------|
| **Wywołanie API** | Endpoint `/api/auth/login` + `fetch()` | Większa kontrola server-side, separacja concerns, zgodność z auth-spec |
| **Redirect logic** | Smart redirect (0→onboarding, 1→auto, 2+→select) | Lepsze UX, mniej kliknięć dla użytkowników z 1 profilem |
| **Struktura ścieżek** | `/auth/*` zamiast root `/*` | Zgodność z auth-spec, lepsza organizacja |
| **Session sync** | `window.location.href` (full reload) | Prostsze, pewne odświeżenie server-side cookies |
| **Forgot Password** | Pełna implementacja | Wymagana funkcjonalność dla production app |

---

## 📝 Kolejne Kroki

Implementacja w następującej kolejności:

1. ✅ **Middleware** - fundament całego systemu
2. ✅ **API Endpoints** - backend logic
3. ✅ **LoginForm refactor** - frontend integration
4. ✅ **Forgot/Reset Password** - pełny flow
5. ✅ **Profile redirect logic** - smart routing
6. ✅ **Testing** - wszystkie scenariusze

---

## 📚 Powiązania z User Stories (PRD)

- **US-001**: Rejestracja rodzica → `/api/auth/register` (TODO)
- **US-002**: Logowanie rodzica → `/api/auth/login` + `LoginForm.tsx`
- **US-003**: Wylogowanie → `/api/auth/logout` (istniejące)
- **US-007**: Wybór aktywnego profilu → `profiles.astro` smart redirect
- **US-008**: Przełączanie profili → cookie `app_active_profile_id`

---

**Autor:** Claude
**Data ostatniej aktualizacji:** 2026-02-01
**Status:** Gotowe do implementacji
