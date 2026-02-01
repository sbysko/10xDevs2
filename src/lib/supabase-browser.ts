/**
 * Browser-side Supabase Client
 *
 * This file provides a singleton Supabase client for browser-side operations.
 * Use this client in React components and hooks to access authentication state
 * and make authenticated API calls.
 *
 * Features:
 * - Singleton pattern (one client instance)
 * - Automatic session management via cookies
 * - Type-safe with database schema
 *
 * Usage:
 * ```typescript
 * import { getSupabaseBrowserClient } from '@/lib/supabase-browser';
 *
 * const supabase = getSupabaseBrowserClient();
 * const { data: { session } } = await supabase.auth.getSession();
 * const token = session?.access_token;
 * ```
 */

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@/db/supabase.client";

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

/**
 * Get or create browser-side Supabase client
 *
 * Returns a singleton instance that manages authentication state
 * and provides access to the Supabase API.
 *
 * @returns Typed Supabase client for browser use
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase environment variables");
    }

    supabaseInstance = createBrowserClient(supabaseUrl, supabaseKey);
  }

  return supabaseInstance as SupabaseClient;
}

/**
 * Get current session's access token
 *
 * Helper function to retrieve the JWT token for authenticated API calls.
 * Returns null if user is not authenticated.
 *
 * @returns JWT access token or null
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    const supabase = getSupabaseBrowserClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("[getAccessToken] Error getting session:", error);
      return null;
    }

    if (!session) {
      console.warn("[getAccessToken] No active session found");
      return null;
    }

    console.log("[getAccessToken] Session found, token length:", session.access_token?.length ?? 0);
    return session.access_token ?? null;
  } catch (err) {
    console.error("[getAccessToken] Unexpected error:", err);
    return null;
  }
}
