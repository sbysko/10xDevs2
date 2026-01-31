/**
 * Zod Validation Schemas for Progress Tracking Operations
 *
 * Rules derived from api-plan.md and progress-endpoint-implementation-plan.md:
 * - profile_id: Must be valid UUID
 * - vocabulary_id: Must be valid UUID
 * - is_correct: Boolean indicating correct/incorrect answer
 * - attempt_number: Integer 1-10 (prevents abuse)
 * - results: Array of 1-20 items for batch mode
 *
 * Security:
 * - UUIDs validated to prevent injection
 * - Attempt number capped at 10 to prevent abuse
 * - Batch size limited to 20 words
 */

import { z } from "zod";

/**
 * Validation schema for recording single word progress
 *
 * Used in: POST /api/progress (single mode)
 *
 * @example Valid input:
 * ```json
 * {
 *   "profile_id": "123e4567-e89b-12d3-a456-426614174000",
 *   "vocabulary_id": "123e4567-e89b-12d3-a456-426614174001",
 *   "is_correct": true,
 *   "attempt_number": 1
 * }
 * ```
 *
 * Stars calculation:
 * - 1st attempt correct: 3 stars ⭐⭐⭐
 * - 2nd attempt correct: 2 stars ⭐⭐
 * - 3rd+ attempt correct: 1 star ⭐
 * - Incorrect: 0 stars
 */
export const RecordProgressSchema = z.object({
  /**
   * Child profile ID
   *
   * Rules:
   * - Required field
   * - Must be valid UUID format
   * - Must exist in profiles table
   * - Must belong to authenticated parent (verified at API layer)
   *
   * Example: "123e4567-e89b-12d3-a456-426614174000"
   */
  profile_id: z.string().uuid("Profile ID must be a valid UUID"),

  /**
   * Vocabulary word ID
   *
   * Rules:
   * - Required field
   * - Must be valid UUID format
   * - Must exist in vocabulary table
   *
   * Example: "123e4567-e89b-12d3-a456-426614174001"
   */
  vocabulary_id: z.string().uuid("Vocabulary ID must be a valid UUID"),

  /**
   * Whether the answer was correct
   *
   * Rules:
   * - Required field
   * - Must be boolean
   * - true = correct answer, false = incorrect answer
   *
   * Valid: true, false
   * Invalid: "true", 1, null, undefined
   */
  is_correct: z.boolean({
    required_error: "is_correct is required",
    invalid_type_error: "is_correct must be a boolean",
  }),

  /**
   * Attempt number for this question (1, 2, 3, ...)
   *
   * Used to calculate stars earned:
   * - 1st attempt correct = 3 stars
   * - 2nd attempt correct = 2 stars
   * - 3rd+ attempt correct = 1 star
   *
   * Rules:
   * - Required field
   * - Must be integer
   * - Min: 1 (first attempt)
   * - Max: 10 (prevents abuse)
   *
   * Valid: 1, 2, 3, ..., 10
   * Invalid: 0, 11, 1.5, "1", null
   */
  attempt_number: z
    .number({
      required_error: "attempt_number is required",
      invalid_type_error: "attempt_number must be a number",
    })
    .int("attempt_number must be an integer")
    .min(1, "attempt_number must be at least 1")
    .max(10, "attempt_number cannot exceed 10"),
});

/**
 * Schema for single word in batch progress update
 *
 * Same as RecordProgressSchema but without profile_id (defined at batch level)
 *
 * @example Valid item:
 * ```json
 * {
 *   "vocabulary_id": "123e4567-e89b-12d3-a456-426614174001",
 *   "is_correct": true,
 *   "attempt_number": 1
 * }
 * ```
 */
const BatchProgressItemSchema = z.object({
  /**
   * Vocabulary word ID
   * Must be valid UUID format
   */
  vocabulary_id: z.string().uuid("Vocabulary ID must be a valid UUID"),

  /**
   * Whether the answer was correct
   * true = correct, false = incorrect
   */
  is_correct: z.boolean({
    required_error: "is_correct is required",
    invalid_type_error: "is_correct must be a boolean",
  }),

  /**
   * Attempt number (1-10)
   * Used for stars calculation
   */
  attempt_number: z
    .number({
      required_error: "attempt_number is required",
      invalid_type_error: "attempt_number must be a number",
    })
    .int("attempt_number must be an integer")
    .min(1, "attempt_number must be at least 1")
    .max(10, "attempt_number cannot exceed 10"),
});

/**
 * Validation schema for recording batch progress (full game session)
 *
 * Used in: POST /api/progress (batch mode)
 *
 * @example Valid input:
 * ```json
 * {
 *   "profile_id": "123e4567-e89b-12d3-a456-426614174000",
 *   "results": [
 *     {
 *       "vocabulary_id": "123e4567-e89b-12d3-a456-426614174001",
 *       "is_correct": true,
 *       "attempt_number": 1
 *     },
 *     {
 *       "vocabulary_id": "123e4567-e89b-12d3-a456-426614174002",
 *       "is_correct": false,
 *       "attempt_number": 2
 *     }
 *   ]
 * }
 * ```
 *
 * Typical use case: Save results at end of game session (10 words)
 */
export const RecordBatchProgressSchema = z.object({
  /**
   * Child profile ID
   *
   * Rules:
   * - Required field
   * - Must be valid UUID format
   * - Must exist in profiles table
   * - Must belong to authenticated parent (verified at API layer)
   *
   * Example: "123e4567-e89b-12d3-a456-426614174000"
   */
  profile_id: z.string().uuid("Profile ID must be a valid UUID"),

  /**
   * Array of word results from game session
   *
   * Typical game session: 10 words
   * Edge cases: 5-20 words
   *
   * Rules:
   * - Required field
   * - Must be array
   * - Min: 1 word (edge case)
   * - Max: 20 words (game session max)
   * - Each item must conform to BatchProgressItemSchema
   *
   * Valid: [{ vocabulary_id, is_correct, attempt_number }, ...]
   * Invalid: [], [...21 items], [{missing_fields}]
   */
  results: z
    .array(BatchProgressItemSchema, {
      required_error: "results array is required",
      invalid_type_error: "results must be an array",
    })
    .min(1, "results must contain at least 1 word")
    .max(20, "results cannot exceed 20 words"),
});

/**
 * TypeScript types inferred from Zod schemas
 *
 * Use these types for validated input in service layer
 */
export type RecordProgressInput = z.infer<typeof RecordProgressSchema>;
export type RecordBatchProgressInput = z.infer<typeof RecordBatchProgressSchema>;
export type BatchProgressItemInput = z.infer<typeof BatchProgressItemSchema>;
