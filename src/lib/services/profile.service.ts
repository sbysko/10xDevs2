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

import type { SupabaseClient } from "@/db/supabase.client";
import type { CreateProfileCommand, ProfileDTO, CategoryProgressDTO, CategoryProgressItem } from "@/types";
import type { Database } from "@/db/database.types";

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
  async createProfile(parentId: string, data: CreateProfileCommand): Promise<ProfileDTO> {
    // Prepare insert data with defaults
    const insertData = {
      parent_id: parentId, // From JWT, NOT from request body (security)
      display_name: data.display_name,
      avatar_url: data.avatar_url ?? null,
      language_code: data.language_code ?? "pl",
    };

    // Execute INSERT with automatic RETURNING clause (single round-trip)
    const { data: profile, error } = await this.supabase.from("profiles").insert(insertData).select().single();

    if (error) {
      // Re-throw error for API route to handle
      // Errors include:
      // - Profile limit trigger: "Rodzic może mieć maksymalnie 5 profili dzieci"
      // - RLS policy violation: code '42501' (shouldn't happen with correct implementation)
      // - Generic database errors
      throw error;
    }

    if (!profile) {
      throw new Error("Profile created but not returned from database");
    }

    // Map database row to DTO (in this case it's 1:1 mapping)
    return {
      id: profile.id,
      parent_id: profile.parent_id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      language_code: profile.language_code,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  }

  /**
   * Get all profiles for a parent
   *
   * Business rules:
   * - Returns all child profiles for authenticated parent
   * - RLS policies automatically filter by parent_id = auth.uid()
   * - Results ordered by created_at DESC (newest first)
   *
   * @param parentId - UUID of authenticated parent from JWT token
   * @returns Array of profile DTOs (max 5 profiles)
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const service = new ProfileService(supabase);
   * const profiles = await service.getAllProfiles(user.id);
   * ```
   */
  async getAllProfiles(parentId: string): Promise<ProfileDTO[]> {
    const { data: profiles, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    if (!profiles) {
      return [];
    }

    // Map database rows to DTOs
    return profiles.map((profile) => ({
      id: profile.id,
      parent_id: profile.parent_id,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      language_code: profile.language_code,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    }));
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
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("parent_id", parentId);

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  /**
   * Get category progress for a specific profile
   *
   * Calculates mastered words per category and overall progress
   *
   * @param profileId - UUID of child profile
   * @param languageCode - Language filter (default: 'pl')
   * @returns CategoryProgressDTO with per-category and overall progress
   * @throws Error if database query fails
   *
   * @example
   * ```typescript
   * const progress = await service.getCategoryProgress(profileId, 'pl');
   * // Returns: { profile_id, language, categories: [...], overall: {...} }
   * ```
   */
  async getCategoryProgress(profileId: string, languageCode = "pl"): Promise<CategoryProgressDTO> {
    // 1. Get all vocabulary words grouped by category
    const { data: vocabData, error: vocabError } = await this.supabase
      .from("vocabulary")
      .select("id, category")
      .eq("language_code", languageCode);

    if (vocabError) {
      throw vocabError;
    }

    if (!vocabData || vocabData.length === 0) {
      // No vocabulary found - return empty progress
      return {
        profile_id: profileId,
        language: languageCode,
        categories: [],
        overall: {
          total_words: 0,
          mastered_words: 0,
          completion_percentage: 0,
        },
      };
    }

    // 2. Get mastered words for this profile
    const { data: progressData, error: progressError } = await this.supabase
      .from("user_progress")
      .select("vocabulary_id, is_mastered")
      .eq("profile_id", profileId)
      .eq("is_mastered", true);

    if (progressError) {
      throw progressError;
    }

    const masteredIds = new Set((progressData || []).map((p) => p.vocabulary_id));

    // 3. Group vocabulary by category and calculate progress
    const categoryMap = new Map<string, { total: number; mastered: number }>();

    vocabData.forEach((word) => {
      const category = word.category;
      const isMastered = masteredIds.has(word.id);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, { total: 0, mastered: 0 });
      }

      const stats = categoryMap.get(category);
      if (stats) {
        stats.total += 1;
        if (isMastered) {
          stats.mastered += 1;
        }
      }
    });

    // 4. Build CategoryProgressItem array
    const categories: CategoryProgressItem[] = Array.from(categoryMap.entries()).map(([category, stats]) => ({
      category: category as Database["public"]["Enums"]["vocabulary_category"],
      total_words: stats.total,
      mastered_words: stats.mastered,
      completion_percentage: stats.total > 0 ? (stats.mastered / stats.total) * 100 : 0,
    }));

    // 5. Calculate overall progress
    const total_words = vocabData.length;
    const mastered_words = masteredIds.size;
    const completion_percentage = total_words > 0 ? (mastered_words / total_words) * 100 : 0;

    return {
      profile_id: profileId,
      language: languageCode,
      categories,
      overall: {
        total_words,
        mastered_words,
        completion_percentage,
      },
    };
  }
}
