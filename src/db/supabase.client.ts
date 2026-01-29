/**
 * Supabase Client Type Definition
 *
 * This file exports the SupabaseClient type used throughout the application.
 * Use this type instead of importing from @supabase/supabase-js directly.
 */

import type { SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Typed Supabase client with database schema
 *
 * Usage in services:
 * ```typescript
 * import type { SupabaseClient } from '@/db/supabase.client';
 *
 * class MyService {
 *   constructor(private supabase: SupabaseClient) {}
 * }
 * ```
 *
 * Usage in API routes:
 * ```typescript
 * const supabase = context.locals.supabase;
 * ```
 */
export type SupabaseClient = SupabaseClientBase<Database>;
