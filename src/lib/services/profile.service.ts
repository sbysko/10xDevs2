/**
 * Profile Service - Business logic for child profile management
 *
 * Responsibilities:
 * - Create child profiles (max 5 per parent, enforced by DB trigger)
 * - Validate profile data before database operations
 * - Handle profile count checks
 *
 * Security:
 * - parent_id is ALWAYS set from authenticated user (JWT), never from request body
 * - RLS policies automatically enforce parent_id = auth.uid() at database level
 */

import type { SupabaseClient } from '@/db/supabase.client';
import type { CreateProfileCommand, ProfileDTO } from '@/types';

/**
 * Service for managing child profiles
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new child profile
   *
   * Business rules:
   * - Max 5 profiles per parent (enforced by DB trigger `check_profile_limit`)
   * - parent_id automatically set from authenticated user (security measure)
   * - avatar_url defaults to null if not provided
   * - language_code defaults to 'pl' if not provided
   *
   * @param parentId - UUID of authenticated parent from JWT token
   * @param data - Profile data from validated request body
   * @returns Created profile with all fields
   * @throws Error if profile limit exceeded (trigger raises exception)
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const service = new ProfileService(supabase);
   * const profile = await service.createProfile(user.id, {
   *   display_name: 'Maria',
   *   avatar_url: 'avatars/avatar-1.png',
   *   language_code: 'pl'
   * });
   * ```
   */
  async createProfile(
    parentId: string,
    data: CreateProfileCommand
  ): Promise<ProfileDTO> {
    // Prepare insert data with defaults
    const insertData = {
      parent_id: parentId, // From JWT, NOT from request body (security)
      display_name: data.display_name,
      avatar_url: data.avatar_url ?? null,
      language_code: data.language_code ?? 'pl'
    };

    // Execute INSERT with automatic RETURNING clause (single round-trip)
    const { data: profile, error } = await this.supabase
      .from('profiles')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      // Re-throw error for API route to handle
      // Errors include:
      // - Profile limit trigger: "Rodzic może mieć maksymalnie 5 profili dzieci"
      // - RLS policy violation: code '42501' (shouldn't happen with correct implementation)
      // - Generic database errors
      throw error;
    }

    if (!profile) {
      throw new Error('Profile created but not returned from database');
    }

    // Map database row to DTO (in this case it's 1:1 mapping)
    return {
      id: profile.id,
      parent_id: profile.parent_id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      language_code: profile.language_code,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };
  }

  /**
   * Get profile count for a parent (optional pre-check before insert)
   *
   * Note: This is optional - the database trigger will enforce the limit anyway.
   * Use this if you want to provide a friendlier error message before attempting insert.
   *
   * @param parentId - UUID of parent user
   * @returns Number of existing profiles for this parent
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const count = await service.getProfileCount(user.id);
   * if (count >= 5) {
   *   // Return 409 error before attempting insert
   * }
   * ```
   */
  async getProfileCount(parentId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('parent_id', parentId);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }
}
