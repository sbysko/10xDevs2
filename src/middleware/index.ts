/**
 * Astro Middleware - Supabase Client Initialization
 *
 * This middleware runs on every request and initializes the Supabase client
 * in context.locals, making it available to all API routes and pages.
 *
 * Security:
 * - Uses SUPABASE_URL and SUPABASE_KEY from environment variables
 * - Passes Authorization header to Supabase for JWT verification
 * - Client is automatically configured with user's session
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
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = ["/login", "/register"];

/**
 * Routes that should redirect to /profiles if user is authenticated
 */
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Middleware to initialize Supabase client and handle authentication
 *
 * Flow:
 * 1. Extract SUPABASE_URL and SUPABASE_KEY from environment
 * 2. Create server-side Supabase client with cookie handling
 * 3. Attach client to context.locals.supabase
 * 4. Check authentication for protected routes
 * 5. Continue to next middleware/route handler
 */
export const onRequest = defineMiddleware(async (context, next) => {
  // Get Supabase configuration from environment variables
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseKey = import.meta.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables");
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in environment variables");
  }

  /**
   * Create server-side Supabase client with SSR support
   *
   * This client handles:
   * - Cookie-based session management
   * - Authorization header (Bearer token) for API requests
   * - Automatic token refresh
   * - Server-side authentication
   */
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      /**
       * Get cookie value by name
       * Used for reading session cookies
       */
      get(key: string) {
        return context.cookies.get(key)?.value;
      },

      /**
       * Set cookie with options
       * Used for storing session tokens
       */
      set(key: string, value: string, options: Record<string, unknown>) {
        context.cookies.set(key, value, options);
      },

      /**
       * Remove cookie by name
       * Used for logout/session cleanup
       */
      remove(key: string, options: Record<string, unknown>) {
        context.cookies.delete(key, options);
      },
    },
    // Pass Authorization header to Supabase for Bearer token authentication
    global: {
      headers: {
        Authorization: context.request.headers.get("Authorization") || "",
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

  // Check if route is public
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route);

  // Get user session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If user is authenticated and trying to access auth routes (login/register)
  // Redirect to profiles page
  if (session && AUTH_ROUTES.includes(pathname)) {
    return context.redirect("/profiles");
  }

  // If user is not authenticated and trying to access protected route
  // Redirect to login with redirect query param
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL("/login", context.url.origin);
    if (pathname !== "/") {
      redirectUrl.searchParams.set("redirect", pathname);
    }
    return context.redirect(redirectUrl.toString());
  }

  // Continue to next middleware or route handler
  return next();
});
