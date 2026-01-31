/**
 * Game Session Service - Business logic for game session management
 *
 * Responsibilities:
 * - Create game sessions with 80/20 algorithm
 * - Fetch words using get_next_words() database function
 * - Generate GameSessionDTO with computed image URLs
 *
 * Algorithm (80/20):
 * - Prioritize unknown words (no user_progress record)
 * - 80% unmastered words (is_mastered = false)
 * - 20% mastered words (is_mastered = true, oldest first for review)
 * - Random shuffle final selection
 *
 * Security:
 * - profile_id validated against auth.uid() via RLS
 * - All queries filtered by RLS policies
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { GameSessionDTO, GameWordDTO, CreateGameSessionCommand, AlgorithmInfo } from "@/types";
import type { Database } from "@/db/database.types";

type VocabularyCategory = Database["public"]["Enums"]["vocabulary_category"];

/**
 * Service for managing game sessions
 */
export class GameSessionService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new game session with word selection based on 80/20 algorithm
   *
   * Business rules:
   * - Default word_count: 10
   * - Min word_count: 5, Max word_count: 20
   * - Uses get_next_words() database function for smart word selection
   * - Returns 422 if insufficient words available
   *
   * @param command - Session creation parameters
   * @returns GameSessionDTO with selected words
   * @throws Error if insufficient words (422)
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const service = new GameSessionService(supabase);
   * const session = await service.createSession({
   *   profile_id: 'uuid',
   *   category: 'zwierzeta',
   *   word_count: 10
   * });
   * ```
   */
  async createSession(command: CreateGameSessionCommand): Promise<GameSessionDTO> {
    const { profile_id, category, word_count = 10 } = command;

    // Validate word_count range
    if (word_count < 5 || word_count > 20) {
      throw new Error("Word count must be between 5 and 20");
    }

    // ===================================================================
    // STEP 1: CALL get_next_words() DATABASE FUNCTION
    // ===================================================================

    const { data: wordsData, error: wordsError } = await this.supabase.rpc("get_next_words", {
      p_profile_id: profile_id,
      p_category: category ?? null,
      p_limit: word_count,
    });

    if (wordsError) {
      throw wordsError;
    }

    if (!wordsData || wordsData.length === 0) {
      // No words available - throw insufficient words error
      const error = new Error("Insufficient words available") as Error & {
        code: string;
        available: number;
        requested: number;
      };
      error.code = "insufficient_words";
      error.available = 0;
      error.requested = word_count;
      throw error;
    }

    // Check if we got enough words
    if (wordsData.length < word_count) {
      const error = new Error("Insufficient words available") as Error & {
        code: string;
        available: number;
        requested: number;
      };
      error.code = "insufficient_words";
      error.available = wordsData.length;
      error.requested = word_count;
      throw error;
    }

    // ===================================================================
    // STEP 2: FETCH USER PROGRESS FOR THESE WORDS
    // ===================================================================

    const vocabularyIds = wordsData.map((w) => w.id);

    const { data: progressData, error: progressError } = await this.supabase
      .from("user_progress")
      .select("vocabulary_id, is_mastered, stars_earned, attempts_count")
      .eq("profile_id", profile_id)
      .in("vocabulary_id", vocabularyIds);

    if (progressError) {
      throw progressError;
    }

    // Create lookup map for progress
    const progressMap = new Map(
      (progressData || []).map((p) => [
        p.vocabulary_id,
        {
          is_mastered: p.is_mastered,
          stars_earned: p.stars_earned,
          attempts_count: p.attempts_count,
        },
      ])
    );

    // ===================================================================
    // STEP 3: MAP TO GameWordDTO WITH COMPUTED IMAGE URLS
    // ===================================================================

    const gameWords: GameWordDTO[] = wordsData.map((word) => {
      const progress = progressMap.get(word.id);

      // Compute image URL from Supabase Storage
      // For MVP: Use placeholder or emoji fallback
      // TODO: Replace with actual Supabase Storage URL when images uploaded
      const imageUrl = this.computeImageUrl(word.image_path);

      return {
        id: word.id,
        word_text: word.word_text,
        category: word.category as VocabularyCategory,
        image_path: word.image_path,
        image_url: imageUrl,
        difficulty_level: word.difficulty_level,
        is_mastered: progress?.is_mastered ?? false,
        previous_stars: progress?.stars_earned ?? 0,
        previous_attempts: progress?.attempts_count ?? 0,
      };
    });

    // ===================================================================
    // STEP 4: CALCULATE ALGORITHM INFO
    // ===================================================================

    const unmasteredCount = gameWords.filter((w) => !w.is_mastered).length;
    const masteredCount = gameWords.filter((w) => w.is_mastered).length;

    const algorithmInfo: AlgorithmInfo = {
      unmastered_words: unmasteredCount,
      mastered_words: masteredCount,
      description:
        unmasteredCount > 0
          ? `${Math.round((unmasteredCount / word_count) * 100)}% nowych słów, ${Math.round((masteredCount / word_count) * 100)}% powtórki`
          : "Wszystkie słowa opanowane - sesja powtórkowa",
    };

    // ===================================================================
    // STEP 5: BUILD GameSessionDTO
    // ===================================================================

    const session: GameSessionDTO = {
      session_id: crypto.randomUUID(), // Generate unique session ID
      profile_id,
      category: category ?? null,
      word_count: gameWords.length,
      words: gameWords,
      algorithm: algorithmInfo,
      created_at: new Date().toISOString(),
    };

    return session;
  }

  /**
   * Compute image URL for vocabulary word
   *
   * For MVP: Returns placeholder or emoji
   * For production: Will return Supabase Storage public URL
   *
   * @param imagePath - Relative path from database (e.g., "vocabulary/zwierzeta/pies.jpg")
   * @returns Public URL for image
   *
   * @private
   */
  private computeImageUrl(imagePath: string): string {
    // TODO: Replace with Supabase Storage URL when images uploaded
    // const { data } = this.supabase.storage.from('vocabulary').getPublicUrl(imagePath);
    // return data.publicUrl;

    // MVP: Use Lorem Picsum placeholder
    // Extract word name from path for consistent image
    const wordName =
      imagePath
        .split("/")
        .pop()
        ?.replace(/\.(jpg|png|svg)$/, "") || "default";
    const seed = this.hashCode(wordName); // Consistent seed for same word

    return `https://picsum.photos/seed/${seed}/400/300`;
  }

  /**
   * Simple hash function for consistent placeholder images
   *
   * @param str - String to hash
   * @returns Numeric hash
   *
   * @private
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
