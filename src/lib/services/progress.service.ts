/**
 * Progress Service - Business logic for learning progress tracking
 *
 * Responsibilities:
 * - Record single word progress with star calculation
 * - Record batch progress for game sessions (10 words)
 * - Calculate stars based on attempt number (1st=3★, 2nd=2★, 3rd+=1★)
 * - Update mastery status (is_mastered = true when answered correctly)
 * - UPSERT to user_progress table (on conflict update existing record)
 *
 * Star Calculation Logic (from PRD):
 * - 1st attempt correct: 3 stars ⭐⭐⭐
 * - 2nd attempt correct: 2 stars ⭐⭐
 * - 3rd+ attempt correct: 1 star ⭐
 * - Incorrect answer: 0 stars (no progress, but attempts_count incremented)
 *
 * Mastery Rules:
 * - is_mastered = true when answer is correct (any attempt)
 * - Once mastered, status remains true even if answered incorrectly later
 * - Stars never decrease (keep highest earned)
 *
 * UPSERT Behavior:
 * - New record: Create with calculated stars and mastery
 * - Existing record: Update preserving highest stars and mastery status
 * - Always increment attempts_count
 * - Always update last_attempted_at timestamp
 *
 * Security:
 * - profile_id ownership validated at API layer before calling service
 * - RLS policies enforce profile.parent_id = auth.uid() at database level
 * - All queries filtered by RLS automatically
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type {
  RecordProgressCommand,
  ProgressRecordDTO,
  RecordBatchProgressCommand,
  BatchProgressResponseDTO,
  BatchProgressResultItem,
  WordDetailsDTO,
} from "@/types";

/**
 * Service for managing user progress tracking
 */
export class ProgressService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Record progress for a single vocabulary word
   *
   * Flow:
   * 1. Calculate stars based on attempt_number and is_correct
   * 2. Fetch existing progress (if any) for UPSERT logic
   * 3. Determine final stars (keep highest) and mastery (sticky)
   * 4. UPSERT to user_progress table
   * 5. Fetch word details for response
   * 6. Return ProgressRecordDTO
   *
   * Business Rules:
   * - Stars calculated: 1st=3★, 2nd=2★, 3rd+=1★, incorrect=0★
   * - Mastery sticky: once true, stays true
   * - Stars never downgrade: keep highest earned
   * - Attempts always increment
   *
   * @param data - Single word progress data (validated by Zod)
   * @returns ProgressRecordDTO with updated progress and word details
   * @throws Error if vocabulary_id not found
   * @throws Error if database operation fails
   *
   * @example
   * ```typescript
   * const service = new ProgressService(supabase);
   * const result = await service.recordProgress({
   *   profile_id: '123e4567-e89b-12d3-a456-426614174000',
   *   vocabulary_id: '123e4567-e89b-12d3-a456-426614174001',
   *   is_correct: true,
   *   attempt_number: 1
   * });
   * // Returns: { ..., is_mastered: true, stars_earned: 3, attempts_count: 1, ... }
   * ```
   */
  async recordProgress(data: RecordProgressCommand): Promise<ProgressRecordDTO> {
    const { profile_id, vocabulary_id, is_correct, attempt_number } = data;

    // ===================================================================
    // STEP 1: CALCULATE STARS FOR THIS ATTEMPT
    // ===================================================================

    const starsForThisAttempt = this.calculateStars(attempt_number, is_correct);

    // ===================================================================
    // STEP 2: FETCH EXISTING PROGRESS (FOR UPSERT LOGIC)
    // ===================================================================

    const { data: existingProgress, error: fetchError } = await this.supabase
      .from("user_progress")
      .select("id, is_mastered, stars_earned, attempts_count")
      .eq("profile_id", profile_id)
      .eq("vocabulary_id", vocabulary_id)
      .maybeSingle(); // Returns null if not found (not an error)

    if (fetchError) {
      throw fetchError;
    }

    // ===================================================================
    // STEP 3: DETERMINE FINAL VALUES (UPSERT BUSINESS LOGIC)
    // ===================================================================

    // Business rules for updates:
    // - attempts_count: Always increment (existing + 1, or 1 for new)
    // - stars_earned: Keep highest (never downgrade)
    // - is_mastered: Once true, stays true (sticky mastery)
    // - last_attempted_at: Update to current timestamp

    let finalStarsEarned: number;
    let finalIsMastered: boolean;
    let newAttemptsCount: number;

    if (existingProgress) {
      // UPDATE EXISTING RECORD
      // Keep highest stars (e.g., if user had 3★ and now gets 2★, keep 3★)
      finalStarsEarned = Math.max(existingProgress.stars_earned, starsForThisAttempt);

      // Once mastered, always mastered (sticky behavior)
      finalIsMastered = existingProgress.is_mastered || is_correct;

      // Increment attempts count
      newAttemptsCount = existingProgress.attempts_count + 1;
    } else {
      // INSERT NEW RECORD
      finalStarsEarned = starsForThisAttempt;
      finalIsMastered = is_correct;
      newAttemptsCount = 1;
    }

    // ===================================================================
    // STEP 4: UPSERT TO DATABASE
    // ===================================================================

    const upsertData = {
      profile_id,
      vocabulary_id,
      is_mastered: finalIsMastered,
      stars_earned: finalStarsEarned,
      attempts_count: newAttemptsCount,
      last_attempted_at: new Date().toISOString(),
    };

    const { data: progressRecord, error: upsertError } = await this.supabase
      .from("user_progress")
      .upsert(upsertData, {
        onConflict: "profile_id,vocabulary_id", // Unique constraint name
        ignoreDuplicates: false, // Always update on conflict
      })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    if (!progressRecord) {
      throw new Error("Progress record upserted but not returned from database");
    }

    // ===================================================================
    // STEP 5: FETCH WORD DETAILS FOR RESPONSE
    // ===================================================================

    const { data: vocabularyData, error: vocabError } = await this.supabase
      .from("vocabulary")
      .select("word_text, category")
      .eq("id", vocabulary_id)
      .single();

    if (vocabError || !vocabularyData) {
      throw new Error(`Vocabulary word not found: ${vocabulary_id}`);
    }

    // ===================================================================
    // STEP 6: BUILD RESPONSE DTO
    // ===================================================================

    const wordDetails: WordDetailsDTO = {
      word_text: vocabularyData.word_text,
      category: vocabularyData.category,
    };

    const response: ProgressRecordDTO = {
      id: progressRecord.id,
      profile_id: progressRecord.profile_id,
      vocabulary_id: progressRecord.vocabulary_id,
      is_mastered: progressRecord.is_mastered,
      stars_earned: progressRecord.stars_earned,
      attempts_count: progressRecord.attempts_count,
      last_attempted_at: progressRecord.last_attempted_at,
      created_at: progressRecord.created_at,
      updated_at: progressRecord.updated_at,
      word_details: wordDetails,
    };

    return response;
  }

  /**
   * Record progress for multiple words (batch mode)
   *
   * Used at the end of a game session to save all 10 word results at once.
   * Processes each word individually using recordProgress() method.
   *
   * Resilience Strategy:
   * - NOT using database transactions (resilience over atomicity)
   * - If one word fails, others still succeed (partial success acceptable)
   * - Each word result includes success/error status
   * - Failed words have error_message for debugging
   *
   * Performance:
   * - Target: < 200ms for 10 words (PRD requirement)
   * - Sequential processing (could optimize with Promise.all if needed)
   *
   * @param data - Batch progress data (validated by Zod)
   * @returns BatchProgressResponseDTO with per-word success/error status
   *
   * @example
   * ```typescript
   * const result = await service.recordBatchProgress({
   *   profile_id: '123e4567-e89b-12d3-a456-426614174000',
   *   results: [
   *     { vocabulary_id: 'uuid1', is_correct: true, attempt_number: 1 },
   *     { vocabulary_id: 'uuid2', is_correct: false, attempt_number: 2 },
   *     // ... 8 more words
   *   ]
   * });
   * // Returns: { profile_id, processed: 10, results: [{ status: "success", ... }] }
   * ```
   */
  async recordBatchProgress(data: RecordBatchProgressCommand): Promise<BatchProgressResponseDTO> {
    const { profile_id, results } = data;

    // ===================================================================
    // PROCESS EACH WORD INDIVIDUALLY
    // ===================================================================

    const batchResults: BatchProgressResultItem[] = [];

    for (const wordResult of results) {
      try {
        // Call single word progress method (reuses all business logic)
        const progressRecord = await this.recordProgress({
          profile_id,
          vocabulary_id: wordResult.vocabulary_id,
          is_correct: wordResult.is_correct,
          attempt_number: wordResult.attempt_number,
        });

        // Success: Add result with earned stars and mastery status
        batchResults.push({
          vocabulary_id: wordResult.vocabulary_id,
          status: "success",
          stars_earned: progressRecord.stars_earned,
          is_mastered: progressRecord.is_mastered,
        });
      } catch (error) {
        // Error: Log and add error result (continue processing other words)
        const err = error as { message?: string };

        console.error(`Failed to record progress for word ${wordResult.vocabulary_id}:`, {
          profile_id,
          vocabulary_id: wordResult.vocabulary_id,
          error: err.message,
          timestamp: new Date().toISOString(),
        });

        // Add failed result (partial failure is acceptable)
        batchResults.push({
          vocabulary_id: wordResult.vocabulary_id,
          status: "error",
          stars_earned: 0,
          is_mastered: false,
          error_message: err.message || "Unknown error occurred",
        });
      }
    }

    // ===================================================================
    // BUILD BATCH RESPONSE
    // ===================================================================

    const response: BatchProgressResponseDTO = {
      profile_id,
      processed: batchResults.length,
      results: batchResults,
    };

    return response;
  }

  /**
   * Calculate stars earned based on attempt number and correctness
   *
   * Star Logic (from PRD - User Story US-006):
   * - 1st attempt correct: 3 stars ⭐⭐⭐ (perfect!)
   * - 2nd attempt correct: 2 stars ⭐⭐ (good!)
   * - 3rd+ attempt correct: 1 star ⭐ (keep trying!)
   * - Incorrect answer: 0 stars (no progress)
   *
   * Educational Psychology:
   * - Rewards speed of learning (more stars for faster mastery)
   * - Still rewards eventual success (1 star for 3rd+ attempt)
   * - No punishment for trying (attempts tracked but not penalized)
   *
   * @param attemptNumber - Which attempt this is (1, 2, 3, ...)
   * @param isCorrect - Whether the answer was correct
   * @returns Number of stars earned (0-3)
   *
   * @example
   * ```typescript
   * calculateStars(1, true)  // → 3 stars (first try!)
   * calculateStars(2, true)  // → 2 stars (second try)
   * calculateStars(5, true)  // → 1 star (eventually got it)
   * calculateStars(1, false) // → 0 stars (incorrect)
   * ```
   *
   * @private
   */
  private calculateStars(attemptNumber: number, isCorrect: boolean): number {
    // No stars for incorrect answer (regardless of attempt number)
    if (!isCorrect) {
      return 0;
    }

    // Stars decrease with more attempts (rewards speed of learning)
    if (attemptNumber === 1) return 3; // Perfect! ⭐⭐⭐
    if (attemptNumber === 2) return 2; // Good! ⭐⭐
    return 1; // 3rd attempt or higher - Keep trying! ⭐
  }
}
