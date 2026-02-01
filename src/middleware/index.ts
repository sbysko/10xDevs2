/**
 * Astro Middleware - Supabase Client Initialization & Authentication
 *
 * This middleware runs on every request and:
 * 1. Initializes Supabase client with proper SSR cookie handling (getAll/setAll)
 * 2. Validates user session using auth.getUser()
 * 3. Protects routes and handles redirects
 *
 * Security Features:
 * - Uses @supabase/ssr recommended cookie methods (getAll/setAll ONLY)
 * - Validates JWT on every request via auth.getUser()
 * - Implements automatic session refresh
 * - Protects all routes except PUBLIC_PATHS
 * - Prevents authenticated users from accessing auth pages
 *
 * Usage in API routes:
 * ```typescript
 * export const GET: APIRoute = async (context) => {
 *   const supabase = context.locals.supabase;
 *   const { data, error } = await supabase.from('table').select();
 * }
 * ```
 */

import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Public paths - Accessible without authentication
 *
 * Includes:
 * - Landing page (/)
 * - Auth pages (/auth/*)
 * - Auth API endpoints (/api/auth/*)
 */
const PUBLIC_PATHS = [
  // Landing page
  "/",
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

/**
 * Auth pages that should redirect to /profiles if user is authenticated
 */
const AUTH_PAGES = ["/auth/login", "/auth/register", "/auth/forgot-password"];

/**
 * Parse Cookie header into array format required by getAll()
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

/**
 * Middleware to initialize Supabase client and handle authentication
 *
 * Flow:
 * 1. Create Supabase client with proper SSR cookie handling (getAll/setAll)
 * 2. Validate user session with auth.getUser()
 * 3. Attach user to context.locals if authenticated
 * 4. Handle redirects based on authentication state
 * 5. Continue to next middleware/route handler
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get Supabase configuration from environment variables
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set in environment variables");
  }

  /**
   * Create server-side Supabase client with SSR support
   *
   * CRITICAL: Must use getAll() and setAll() ONLY per @supabase/ssr requirements
   * DO NOT use get(), set(), or remove() - these are deprecated and cause issues
   */
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      /**
       * Get ALL cookies at once
       * Required by @supabase/ssr for proper session handling
       */
      getAll() {
        return parseCookieHeader(context.request.headers.get("Cookie") ?? "");
      },

      /**
       * Set ALL cookies at once
       * Required by @supabase/ssr for proper session handling
       */
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          context.cookies.set(name, value, options);
        });
      },
    },
  });

  // Attach Supabase client to context.locals for use in routes
  context.locals.supabase = supabase as SupabaseClient;

  // Get current pathname
  const pathname = new URL(context.request.url).pathname;

  // Skip auth check for API routes (they handle their own auth)
  if (pathname.startsWith("/api/")) {
    return next();
  }

  // Skip auth check for static assets
  if (pathname.startsWith("/_") || pathname.includes(".")) {
    return next();
  }

  // Check if path is public
  const isPublic = PUBLIC_PATHS.includes(pathname);

  /**
   * CRITICAL: Always call auth.getUser() to validate JWT
   * DO NOT use getSession() - it doesn't verify the JWT
   * This prevents security vulnerabilities from forged tokens
   */
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Auth error in middleware:", error);
    // On auth error, treat as unauthenticated
  }

  // Store user in locals if authenticated
  if (user) {
    context.locals.user = {
      id: user.id,
      email: user.email || "",
    };
  }

  // ============================================================================
  // REDIRECT LOGIC - Universal Protection Mechanism
  // ============================================================================

  // 1. Authenticated user trying to access auth pages → redirect to /profiles
  if (user && AUTH_PAGES.includes(pathname)) {
    // IMPORTANT: Set cache control headers on redirect response
    const response = context.redirect("/profiles");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // 2. Non-authenticated user on protected route → redirect to /auth/login
  // This protects ALL routes except PUBLIC_PATHS (including home page "/")
  if (!user && !isPublic) {
    const redirectUrl = new URL("/auth/login", context.url.origin);
    // Preserve original destination for post-login redirect
    if (pathname !== "/") {
      redirectUrl.searchParams.set("redirect", pathname);
    }
    return context.redirect(redirectUrl.toString());
  }

  // ============================================================================
  // CACHE CONTROL - Prevent browser caching of auth pages
  // ============================================================================
  // This prevents the "back button" issue where users see cached auth pages
  // after logging in. Without this, clicking browser "back" shows old login page.
  // This applies to non-authenticated users viewing auth pages.
  if (AUTH_PAGES.includes(pathname) || pathname.startsWith("/auth/")) {
    // Get response from next handler
    const response = await next();

    // Clone response to modify headers (responses are immutable)
    const newResponse = new Response(response.body, response);

    // Set cache control headers to prevent caching
    newResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    newResponse.headers.set("Pragma", "no-cache");
    newResponse.headers.set("Expires", "0");

    return newResponse;
  }

  // Continue to next middleware or route handler
  return next();
});
