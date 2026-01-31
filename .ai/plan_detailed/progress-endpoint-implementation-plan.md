# Progress Endpoint Implementation Plan

**Document Version:** 1.0
**Created:** 2026-01-31
**Status:** Ready for Implementation
**Priority:** 🔴 CRITICAL - Blocks MVP Launch

---

## 1. Executive Summary

### Problem Statement
The application lacks a critical endpoint to record game session results. Currently, children can play games but their progress cannot be saved to the database, making the learning tracker non-functional.

### Solution
Implement `POST /api/progress` endpoint with support for both single-word and batch-mode progress updates. The endpoint will calculate stars based on attempt number, update mastery status, and maintain learning statistics.

### Success Criteria
- ✅ Single word progress can be recorded
- ✅ Batch progress updates work for full game sessions (10 words)
- ✅ Stars calculated correctly (3★ = 1st attempt, 2★ = 2nd, 1★ = 3rd+)
- ✅ Mastery status updates when word answered correctly
- ✅ UPSERT pattern prevents duplicate records
- ✅ Performance: < 200ms for batch update of 10 words

---

## 2. Architecture Overview

### Component Layers

```
┌─────────────────────────────────────────────────────┐
│ POST /api/progress (API Route)                      │
│ - JWT Authentication                                │
│ - Zod Validation                                    │
│ - Error Handling                                    │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ ProgressService (Business Logic)                    │
│ - Calculate stars (attempt → stars mapping)         │
│ - Update mastery status (is_correct → is_mastered)  │
│ - UPSERT to user_progress table                     │
│ - Handle batch operations with transaction          │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│ Supabase Database (user_progress table)             │
│ - UPSERT on (profile_id, vocabulary_id)             │
│ - RLS enforces profile ownership                    │
│ - Triggers update updated_at timestamp              │
└─────────────────────────────────────────────────────┘
```

### Data Flow

**Single Word Update:**
```
Client → POST /api/progress
{
  "profile_id": "uuid",
  "vocabulary_id": "uuid",
  "is_correct": true,
  "attempt_number": 1
}
↓
ProgressService.recordProgress()
↓
Calculate: attempt=1 + correct=true → 3 stars, is_mastered=true
↓
UPSERT user_progress
↓
Response: ProgressRecordDTO
```

**Batch Update (Game Session End):**
```
Client → POST /api/progress
{
  "profile_id": "uuid",
  "results": [
    {"vocabulary_id": "uuid1", "is_correct": true, "attempt_number": 1},
    {"vocabulary_id": "uuid2", "is_correct": false, "attempt_number": 3},
    ...10 words total
  ]
}
↓
ProgressService.recordBatchProgress()
↓
For each word: calculate stars + mastery
↓
Batch UPSERT (transaction)
↓
Response: BatchProgressResponseDTO with per-word results
```

---

## 3. Implementation Checklist

### Phase 1: Validation Schemas (Est: 1 hour)
- [ ] Create `src/lib/validation/progress.schemas.ts`
- [ ] Implement `RecordProgressSchema` (single word)
- [ ] Implement `RecordBatchProgressSchema` (batch mode)
- [ ] Add comprehensive Zod validation rules
- [ ] Write JSDoc comments with examples

### Phase 2: Service Layer (Est: 2-3 hours)
- [ ] Create `src/lib/services/progress.service.ts`
- [ ] Implement `ProgressService` class
- [ ] Method: `recordProgress(data)` - single word update
- [ ] Method: `recordBatchProgress(data)` - batch updates
- [ ] Private method: `calculateStars(attempt, isCorrect)` - stars logic
- [ ] Private method: `determinemastery(isCorrect, currentMastery)` - mastery logic
- [ ] Error handling for database operations
- [ ] Add comprehensive JSDoc documentation

### Phase 3: API Endpoint (Est: 2 hours)
- [ ] Create `src/pages/api/progress.ts`
- [ ] Implement `POST` handler
- [ ] JWT authentication check
- [ ] Request body parsing
- [ ] Zod validation
- [ ] Profile ownership verification (security)
- [ ] Call ProgressService
- [ ] Error handling (400, 401, 403, 404, 500)
- [ ] Add detailed comments

### Phase 4: Testing (Est: 2 hours)
- [ ] Test single word progress (correct answer)
- [ ] Test single word progress (incorrect answer)
- [ ] Test batch progress (10 words)
- [ ] Test stars calculation (1st, 2nd, 3rd+ attempts)
- [ ] Test mastery status updates
- [ ] Test UPSERT behavior (existing vs new records)
- [ ] Test error cases (invalid profile_id, missing vocabulary_id)
- [ ] Verify RLS policies work correctly

### Phase 5: Integration (Est: 1 hour)
- [ ] Verify GameSessionManager calls new endpoint
- [ ] Test end-to-end flow: Play Game → Save Progress → View Stats
- [ ] Verify progress dashboard updates correctly
- [ ] Check performance (<200ms for batch)

**Total Estimated Time: 8-9 hours**

---

## 4. File Structure

```
src/
├── pages/
│   └── api/
│       └── progress.ts          ← NEW FILE (API endpoint)
│
├── lib/
│   ├── services/
│   │   └── progress.service.ts  ← NEW FILE (Business logic)
│   │
│   └── validation/
│       └── progress.schemas.ts  ← NEW FILE (Zod schemas)
│
└── types.ts                      ← EXISTING (DTOs already defined)
```

---

## 5. Detailed Specifications

### 5.1 Validation Schemas

**File:** `src/lib/validation/progress.schemas.ts`

```typescript
import { z } from "zod";

/**
 * Schema for recording single word progress
 * Used in: POST /api/progress (single mode)
 */
export const RecordProgressSchema = z.object({
  /**
   * Child profile ID
   * Must exist in profiles table and belong to authenticated parent
   */
  profile_id: z.string().uuid("Profile ID must be a valid UUID"),

  /**
   * Vocabulary word ID
   * Must exist in vocabulary table
   */
  vocabulary_id: z.string().uuid("Vocabulary ID must be a valid UUID"),

  /**
   * Whether the answer was correct
   * true = correct answer, false = incorrect answer
   */
  is_correct: z.boolean({
    required_error: "is_correct is required",
    invalid_type_error: "is_correct must be a boolean",
  }),

  /**
   * Attempt number for this question (1, 2, 3, ...)
   * Used to calculate stars: 1st attempt = 3★, 2nd = 2★, 3rd+ = 1★
   *
   * Min: 1 (first attempt)
   * Max: 10 (reasonable limit to prevent abuse)
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
 */
const BatchProgressItemSchema = z.object({
  vocabulary_id: z.string().uuid("Vocabulary ID must be a valid UUID"),
  is_correct: z.boolean(),
  attempt_number: z.number().int().min(1).max(10),
});

/**
 * Schema for recording batch progress (full game session)
 * Used in: POST /api/progress (batch mode)
 */
export const RecordBatchProgressSchema = z.object({
  /**
   * Child profile ID
   * Must exist in profiles table and belong to authenticated parent
   */
  profile_id: z.string().uuid("Profile ID must be a valid UUID"),

  /**
   * Array of word results from game session
   * Typically 10 words per session
   *
   * Min: 1 word (edge case)
   * Max: 20 words (game session max)
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
 * TypeScript types inferred from schemas
 */
export type RecordProgressInput = z.infer<typeof RecordProgressSchema>;
export type RecordBatchProgressInput = z.infer<typeof RecordBatchProgressSchema>;
```

**Key Validation Rules:**
- ✅ UUIDs validated with `.uuid()` method
- ✅ Attempt number limited to 1-10 (prevents abuse)
- ✅ Batch results limited to 20 words max (prevents large payloads)
- ✅ All required fields enforced with custom error messages

---

### 5.2 Service Layer

**File:** `src/lib/services/progress.service.ts`

```typescript
/**
 * Progress Service - Business logic for learning progress tracking
 *
 * Responsibilities:
 * - Record single word progress with star calculation
 * - Record batch progress for game sessions
 * - Calculate stars based on attempt number (1st=3★, 2nd=2★, 3rd+=1★)
 * - Update mastery status (is_mastered = true when answered correctly)
 * - UPSERT to user_progress table (on conflict update)
 *
 * Star Calculation Logic:
 * - 1st attempt correct: 3 stars
 * - 2nd attempt correct: 2 stars
 * - 3rd+ attempt correct: 1 star
 * - Incorrect answer: 0 stars (no progress, but attempts_count incremented)
 *
 * Mastery Rules:
 * - is_mastered = true when answer is correct (any attempt)
 * - Once mastered, status remains true even if answered incorrectly later
 *
 * Security:
 * - profile_id ownership validated at API layer before calling service
 * - RLS policies enforce profile.parent_id = auth.uid() at database level
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
   * 2. Determine mastery status (true if correct, preserve if already mastered)
   * 3. UPSERT to user_progress table (on conflict update existing record)
   * 4. Fetch word details for response
   *
   * @param data - Single word progress data
   * @returns ProgressRecordDTO with updated progress and word details
   * @throws Error if database operation fails
   * @throws Error if vocabulary_id not found
   *
   * @example
   * ```typescript
   * const service = new ProgressService(supabase);
   * const result = await service.recordProgress({
   *   profile_id: 'uuid',
   *   vocabulary_id: 'uuid',
   *   is_correct: true,
   *   attempt_number: 1
   * });
   * // Returns: { id, profile_id, vocabulary_id, is_mastered: true, stars_earned: 3, ... }
   * ```
   */
  async recordProgress(data: RecordProgressCommand): Promise<ProgressRecordDTO> {
    const { profile_id, vocabulary_id, is_correct, attempt_number } = data;

    // ===================================================================
    // STEP 1: CALCULATE STARS AND MASTERY
    // ===================================================================

    const stars_earned = this.calculateStars(attempt_number, is_correct);
    const is_mastered = is_correct; // True if correct, false if incorrect

    // ===================================================================
    // STEP 2: FETCH EXISTING PROGRESS (FOR UPSERT LOGIC)
    // ===================================================================

    const { data: existingProgress, error: fetchError } = await this.supabase
      .from("user_progress")
      .select("id, is_mastered, stars_earned, attempts_count")
      .eq("profile_id", profile_id)
      .eq("vocabulary_id", vocabulary_id)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    // ===================================================================
    // STEP 3: PREPARE UPSERT DATA
    // ===================================================================

    // Business rules for updates:
    // - attempts_count: Always increment
    // - stars_earned: Keep highest stars (don't downgrade)
    // - is_mastered: Once true, stays true (even if later incorrect)
    // - last_attempted_at: Update to current timestamp

    let finalStarsEarned: number;
    let finalIsMastered: boolean;
    let newAttemptsCount: number;

    if (existingProgress) {
      // UPDATE EXISTING RECORD
      finalStarsEarned = Math.max(existingProgress.stars_earned, stars_earned);
      finalIsMastered = existingProgress.is_mastered || is_mastered;
      newAttemptsCount = existingProgress.attempts_count + 1;
    } else {
      // INSERT NEW RECORD
      finalStarsEarned = stars_earned;
      finalIsMastered = is_mastered;
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
        onConflict: "profile_id,vocabulary_id", // Unique constraint
        ignoreDuplicates: false, // Always update
      })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    if (!progressRecord) {
      throw new Error("Progress record created but not returned from database");
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
   * Used at the end of a game session to save all results at once.
   * Processes each word individually but returns aggregated results.
   *
   * Note: Not using database transactions to avoid complexity.
   * If one word fails, others may still succeed (partial success is acceptable).
   *
   * @param data - Batch progress data
   * @returns BatchProgressResponseDTO with per-word success/error status
   * @throws Error only if critical database failure (not per-word errors)
   *
   * @example
   * ```typescript
   * const result = await service.recordBatchProgress({
   *   profile_id: 'uuid',
   *   results: [
   *     { vocabulary_id: 'uuid1', is_correct: true, attempt_number: 1 },
   *     { vocabulary_id: 'uuid2', is_correct: false, attempt_number: 3 },
   *     // ...8 more words
   *   ]
   * });
   * // Returns: { profile_id, processed: 10, results: [...] }
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
        // Call single word progress method
        const progressRecord = await this.recordProgress({
          profile_id,
          vocabulary_id: wordResult.vocabulary_id,
          is_correct: wordResult.is_correct,
          attempt_number: wordResult.attempt_number,
        });

        // Success: Add to results
        batchResults.push({
          vocabulary_id: wordResult.vocabulary_id,
          status: "success",
          stars_earned: progressRecord.stars_earned,
          is_mastered: progressRecord.is_mastered,
        });
      } catch (error) {
        // Error: Log and add error result (continue processing other words)
        const err = error as { message?: string };
        console.error(`Failed to record progress for word ${wordResult.vocabulary_id}:`, err.message);

        batchResults.push({
          vocabulary_id: wordResult.vocabulary_id,
          status: "error",
          stars_earned: 0,
          is_mastered: false,
          error_message: err.message || "Unknown error",
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
   * Star Logic (from PRD):
   * - 1st attempt correct: 3 stars ⭐⭐⭐
   * - 2nd attempt correct: 2 stars ⭐⭐
   * - 3rd+ attempt correct: 1 star ⭐
   * - Incorrect answer: 0 stars
   *
   * @param attemptNumber - Which attempt this is (1, 2, 3, ...)
   * @param isCorrect - Whether the answer was correct
   * @returns Number of stars earned (0-3)
   *
   * @private
   */
  private calculateStars(attemptNumber: number, isCorrect: boolean): number {
    if (!isCorrect) {
      return 0; // No stars for incorrect answer
    }

    // Stars decrease with more attempts
    if (attemptNumber === 1) return 3;
    if (attemptNumber === 2) return 2;
    return 1; // 3rd attempt or higher
  }
}
```

**Key Design Decisions:**
1. **UPSERT Logic:** Preserves highest stars and mastery status
2. **No Transactions:** Batch mode processes words individually for resilience
3. **Partial Success:** Batch can succeed partially (some words succeed, others fail)
4. **Stars Never Decrease:** If child already earned 3★, won't drop to 2★ on retry
5. **Mastery Sticky:** Once mastered, stays mastered forever

---

### 5.3 API Endpoint

**File:** `src/pages/api/progress.ts`

```typescript
/**
 * /api/progress - Learning progress tracking endpoint
 *
 * POST /api/progress - Record progress for single word or batch
 *
 * Modes:
 * - Single mode: Record one word result (has vocabulary_id field)
 * - Batch mode: Record multiple results (has results array)
 *
 * Documentation: .ai/progress-endpoint-implementation-plan.md
 * User Story: US-006 (Track Progress & Earn Stars)
 *
 * Security:
 * - Requires JWT authentication
 * - Validates profile ownership (profile.parent_id = auth.uid())
 * - RLS policies enforce multi-tenancy
 */

import type { APIRoute } from "astro";
import { ProgressService } from "@/lib/services/progress.service";
import { RecordProgressSchema, RecordBatchProgressSchema } from "@/lib/validation/progress.schemas";

// IMPORTANT: Disable prerendering for API routes
export const prerender = false;

/**
 * POST handler - Record learning progress
 *
 * Supports two modes (auto-detected):
 * 1. Single mode: { profile_id, vocabulary_id, is_correct, attempt_number }
 * 2. Batch mode: { profile_id, results: [...] }
 *
 * Flow:
 * 1. Authenticate: Validate JWT from Authorization header
 * 2. Parse: Read and parse request body JSON
 * 3. Detect Mode: Check if single or batch based on fields
 * 4. Validate: Use appropriate Zod schema
 * 5. Verify Ownership: Check profile belongs to authenticated user
 * 6. Record Progress: Call ProgressService
 * 7. Return: 201 with DTO
 *
 * Error handling:
 * - 401 if token missing or invalid
 * - 400 if JSON parsing fails or validation fails
 * - 403 if profile doesn't belong to user
 * - 404 if profile or vocabulary not found
 * - 500 for unexpected database errors
 */
export const POST: APIRoute = async (context) => {
  // ===================================================================
  // STEP 1: AUTHENTICATION - Verify JWT token
  // ===================================================================

  const authHeader = context.request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Authentication required",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication failed:", authError?.message);

    return new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "Invalid or expired token",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ===================================================================
  // STEP 2: PARSE REQUEST BODY - Read JSON from request
  // ===================================================================

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: "validation_error",
        message: "Invalid JSON in request body",
        field: "body",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ===================================================================
  // STEP 3: DETECT MODE - Single vs Batch
  // ===================================================================

  // Type guard: if body has 'results' array, it's batch mode
  const isBatchMode =
    typeof requestBody === "object" &&
    requestBody !== null &&
    "results" in requestBody &&
    Array.isArray(requestBody.results);

  // ===================================================================
  // STEP 4: VALIDATE INPUT - Check data with appropriate Zod schema
  // ===================================================================

  let validatedData: {
    profile_id: string;
    vocabulary_id?: string;
    is_correct?: boolean;
    attempt_number?: number;
    results?: Array<{ vocabulary_id: string; is_correct: boolean; attempt_number: number }>;
  };

  if (isBatchMode) {
    // Batch mode validation
    const validationResult = RecordBatchProgressSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];

      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: firstError.message,
          field: firstError.path.join(".") || "unknown",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    validatedData = validationResult.data;
  } else {
    // Single mode validation
    const validationResult = RecordProgressSchema.safeParse(requestBody);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];

      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: firstError.message,
          field: firstError.path.join(".") || "unknown",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    validatedData = validationResult.data;
  }

  // ===================================================================
  // STEP 5: VERIFY PROFILE OWNERSHIP (Security Check)
  // ===================================================================

  // Check if profile belongs to authenticated user
  const { data: profile, error: profileError } = await context.locals.supabase
    .from("profiles")
    .select("id, parent_id")
    .eq("id", validatedData.profile_id)
    .single();

  if (profileError || !profile) {
    return new Response(
      JSON.stringify({
        error: "not_found",
        message: "Profile not found",
      }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (profile.parent_id !== user.id) {
    return new Response(
      JSON.stringify({
        error: "forbidden",
        message: "You do not have access to this profile",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // ===================================================================
  // STEP 6: RECORD PROGRESS - Call service layer
  // ===================================================================

  const progressService = new ProgressService(context.locals.supabase);

  try {
    if (isBatchMode && validatedData.results) {
      // BATCH MODE: Record multiple words
      const batchResult = await progressService.recordBatchProgress({
        profile_id: validatedData.profile_id,
        results: validatedData.results,
      });

      return new Response(JSON.stringify(batchResult), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else if (
      !isBatchMode &&
      validatedData.vocabulary_id &&
      typeof validatedData.is_correct === "boolean" &&
      typeof validatedData.attempt_number === "number"
    ) {
      // SINGLE MODE: Record one word
      const singleResult = await progressService.recordProgress({
        profile_id: validatedData.profile_id,
        vocabulary_id: validatedData.vocabulary_id,
        is_correct: validatedData.is_correct,
        attempt_number: validatedData.attempt_number,
      });

      return new Response(JSON.stringify(singleResult), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      // Invalid mode detection (shouldn't happen with proper validation)
      return new Response(
        JSON.stringify({
          error: "validation_error",
          message: "Invalid request format. Must be single or batch mode.",
          field: "body",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (dbError: unknown) {
    // ===================================================================
    // STEP 7: ERROR HANDLING - Database and business logic errors
    // ===================================================================

    const error = dbError as { message?: string; code?: string };

    // Error 1: Vocabulary not found (referenced in service)
    if (error.message?.includes("Vocabulary word not found")) {
      return new Response(
        JSON.stringify({
          error: "not_found",
          message: "Vocabulary word not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Error 2: RLS policy violation (should NOT happen with correct implementation)
    if (error.code === "42501") {
      console.error("CRITICAL: RLS policy violation in recordProgress", {
        userId: user.id,
        profileId: validatedData.profile_id,
        error: error.message,
        timestamp: new Date().toISOString(),
      });

      return new Response(
        JSON.stringify({
          error: "forbidden",
          message: "Access denied",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Error 3: Generic database error
    console.error("Database error in POST /api/progress:", {
      userId: user.id,
      profileId: validatedData.profile_id,
      mode: isBatchMode ? "batch" : "single",
      errorCode: error.code,
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        error: "internal_error",
        message: "An unexpected error occurred. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

**Key Features:**
- ✅ Auto-detects single vs batch mode
- ✅ Validates profile ownership before processing
- ✅ Comprehensive error handling
- ✅ Detailed logging for debugging
- ✅ Follows established API patterns from existing endpoints

---

## 6. Business Logic Details

### 6.1 Stars Calculation Algorithm

```
FUNCTION calculateStars(attemptNumber: number, isCorrect: boolean) → number
  IF NOT isCorrect THEN
    RETURN 0
  END IF

  SWITCH attemptNumber
    CASE 1: RETURN 3  // Perfect! ⭐⭐⭐
    CASE 2: RETURN 2  // Good! ⭐⭐
    DEFAULT: RETURN 1  // Keep trying! ⭐
  END SWITCH
END FUNCTION
```

**Examples:**
- `calculateStars(1, true)` → 3 stars
- `calculateStars(2, true)` → 2 stars
- `calculateStars(5, true)` → 1 star
- `calculateStars(1, false)` → 0 stars

### 6.2 UPSERT Logic

```sql
-- Simplified SQL representation
INSERT INTO user_progress (
  profile_id,
  vocabulary_id,
  is_mastered,
  stars_earned,
  attempts_count,
  last_attempted_at
) VALUES (
  $profile_id,
  $vocabulary_id,
  $is_mastered,
  $stars_earned,
  1,  -- First attempt
  NOW()
)
ON CONFLICT (profile_id, vocabulary_id) DO UPDATE SET
  -- Keep highest stars (never downgrade)
  stars_earned = GREATEST(user_progress.stars_earned, EXCLUDED.stars_earned),

  -- Once mastered, always mastered
  is_mastered = user_progress.is_mastered OR EXCLUDED.is_mastered,

  -- Increment attempts count
  attempts_count = user_progress.attempts_count + 1,

  -- Update last attempt timestamp
  last_attempted_at = EXCLUDED.last_attempted_at;
```

**Behavior Examples:**

| Scenario | Existing Record | New Attempt | Final Result |
|----------|-----------------|-------------|--------------|
| First attempt | `null` | 1st attempt, correct | `stars=3, mastered=true, attempts=1` |
| Perfect retry | `stars=3, mastered=true` | 1st attempt, correct | `stars=3, mastered=true, attempts=2` |
| Improvement | `stars=1, mastered=true` | 1st attempt, correct | `stars=3, mastered=true, attempts=2` |
| Failed retry | `stars=3, mastered=true` | 3rd attempt, wrong | `stars=3, mastered=true, attempts=2` |
| Late success | `stars=0, mastered=false` | 3rd attempt, correct | `stars=1, mastered=true, attempts=2` |

---

## 7. Testing Strategy

### 7.1 Unit Tests (Service Layer)

**Test File:** `src/lib/services/progress.service.test.ts` (Future)

```typescript
describe("ProgressService", () => {
  describe("calculateStars", () => {
    it("should return 3 stars for 1st attempt correct", () => {
      expect(service["calculateStars"](1, true)).toBe(3);
    });

    it("should return 2 stars for 2nd attempt correct", () => {
      expect(service["calculateStars"](2, true)).toBe(2);
    });

    it("should return 1 star for 3rd+ attempt correct", () => {
      expect(service["calculateStars"](3, true)).toBe(1);
      expect(service["calculateStars"](5, true)).toBe(1);
    });

    it("should return 0 stars for incorrect answer", () => {
      expect(service["calculateStars"](1, false)).toBe(0);
    });
  });

  describe("recordProgress", () => {
    it("should create new progress record on first attempt", async () => {
      // Test implementation
    });

    it("should update existing record and preserve highest stars", async () => {
      // Test implementation
    });

    it("should keep is_mastered=true once set", async () => {
      // Test implementation
    });
  });
});
```

### 7.2 Integration Tests (API Layer)

**Manual Test Cases:**

#### Test 1: Single Word - First Attempt Correct
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "uuid",
    "vocabulary_id": "uuid",
    "is_correct": true,
    "attempt_number": 1
  }'

# Expected Response: 201 Created
{
  "id": "uuid",
  "profile_id": "uuid",
  "vocabulary_id": "uuid",
  "is_mastered": true,
  "stars_earned": 3,
  "attempts_count": 1,
  "last_attempted_at": "2026-01-31T12:00:00Z",
  "created_at": "2026-01-31T12:00:00Z",
  "updated_at": "2026-01-31T12:00:00Z",
  "word_details": {
    "word_text": "Pies",
    "category": "zwierzeta"
  }
}
```

#### Test 2: Batch Progress (Game Session End)
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "uuid",
    "results": [
      {"vocabulary_id": "uuid1", "is_correct": true, "attempt_number": 1},
      {"vocabulary_id": "uuid2", "is_correct": false, "attempt_number": 2},
      {"vocabulary_id": "uuid3", "is_correct": true, "attempt_number": 3}
    ]
  }'

# Expected Response: 201 Created
{
  "profile_id": "uuid",
  "processed": 3,
  "results": [
    {
      "vocabulary_id": "uuid1",
      "status": "success",
      "stars_earned": 3,
      "is_mastered": true
    },
    {
      "vocabulary_id": "uuid2",
      "status": "success",
      "stars_earned": 0,
      "is_mastered": false
    },
    {
      "vocabulary_id": "uuid3",
      "status": "success",
      "stars_earned": 1,
      "is_mastered": true
    }
  ]
}
```

#### Test 3: Error Case - Invalid Profile ID
```bash
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "invalid-uuid",
    "vocabulary_id": "uuid",
    "is_correct": true,
    "attempt_number": 1
  }'

# Expected Response: 400 Bad Request
{
  "error": "validation_error",
  "message": "Profile ID must be a valid UUID",
  "field": "profile_id"
}
```

#### Test 4: Security - Unauthorized Profile Access
```bash
# Try to update progress for another parent's profile
curl -X POST http://localhost:3000/api/progress \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "OTHER_PARENTS_PROFILE_UUID",
    "vocabulary_id": "uuid",
    "is_correct": true,
    "attempt_number": 1
  }'

# Expected Response: 403 Forbidden
{
  "error": "forbidden",
  "message": "You do not have access to this profile"
}
```

### 7.3 Performance Test

**Target:** < 200ms for batch update of 10 words

```bash
# Use Apache Bench or similar tool
ab -n 100 -c 10 -p batch_payload.json -T application/json \
  -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/progress
```

**Acceptance Criteria:**
- ✅ P50 latency < 150ms
- ✅ P95 latency < 200ms
- ✅ P99 latency < 300ms
- ✅ Zero errors for valid requests

---

## 8. Database Impact Analysis

### 8.1 Index Usage

The endpoint will leverage existing indexes:

```sql
-- Primary index for UPSERT lookup
CREATE INDEX idx_user_progress_profile_id ON user_progress(profile_id);

-- Used when checking if word already attempted
CREATE INDEX idx_user_progress_vocabulary_id ON user_progress(vocabulary_id);

-- Composite index for optimal UPSERT performance
CREATE INDEX idx_user_progress_profile_mastered ON user_progress(profile_id, is_mastered);
```

**Query Plan Analysis:**
```sql
EXPLAIN ANALYZE
INSERT INTO user_progress (...)
VALUES (...)
ON CONFLICT (profile_id, vocabulary_id) DO UPDATE ...;

-- Expected: Index scan on user_progress_unique_profile_vocabulary
-- Should use B-tree index for conflict detection
```

### 8.2 Expected Load

**Assumptions:**
- 20 families (MVP target)
- 5 profiles per family = 100 children
- Each child plays 2 game sessions per day
- 10 words per session
- **Total: 2,000 progress updates per day**

**Peak Load:**
- Batch endpoint called: 200 times/day
- Single endpoint called: 0 times/day (batch preferred)
- **Peak QPS:** < 1 query/second

**Conclusion:** Database will handle load easily with current indexes.

---

## 9. Error Handling Matrix

| Error Type | Status Code | Response Example | Cause |
|------------|-------------|------------------|-------|
| Missing JWT | 401 | `{"error": "unauthorized", "message": "Authentication required"}` | No Authorization header |
| Invalid JWT | 401 | `{"error": "unauthorized", "message": "Invalid or expired token"}` | Token expired or malformed |
| Invalid JSON | 400 | `{"error": "validation_error", "message": "Invalid JSON in request body"}` | Malformed JSON |
| Invalid UUID | 400 | `{"error": "validation_error", "message": "Profile ID must be a valid UUID", "field": "profile_id"}` | Validation failed |
| Attempt > 10 | 400 | `{"error": "validation_error", "message": "attempt_number cannot exceed 10"}` | Attempt number too high |
| Profile not found | 404 | `{"error": "not_found", "message": "Profile not found"}` | Profile doesn't exist |
| Vocabulary not found | 404 | `{"error": "not_found", "message": "Vocabulary word not found"}` | Invalid vocabulary_id |
| Wrong parent | 403 | `{"error": "forbidden", "message": "You do not have access to this profile"}` | Profile belongs to different user |
| RLS violation | 403 | `{"error": "forbidden", "message": "Access denied"}` | RLS policy blocked access |
| Database error | 500 | `{"error": "internal_error", "message": "An unexpected error occurred"}` | Generic DB error |

---

## 10. Integration Checklist

### Frontend Integration (GameSessionManager)

**Current Code Location:** [src/components/GameSessionManager.tsx](src/components/GameSessionManager.tsx)

**Expected Changes:**
```typescript
// After game session completes, call batch progress endpoint
const saveProgress = async (sessionResults: GameResult[]) => {
  const response = await fetch('/api/progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userToken}`
    },
    body: JSON.stringify({
      profile_id: selectedProfileId,
      results: sessionResults.map(r => ({
        vocabulary_id: r.word.id,
        is_correct: r.isCorrect,
        attempt_number: r.attemptNumber
      }))
    })
  });

  if (!response.ok) {
    // Handle error
    throw new Error('Failed to save progress');
  }

  const data = await response.json();
  // Show success message or redirect to progress dashboard
};
```

**Validation Checklist:**
- [ ] GameSessionManager calls `/api/progress` on session end
- [ ] Batch payload includes all 10 words from session
- [ ] Attempt numbers tracked correctly during game
- [ ] Error handling implemented (retry logic or user notification)
- [ ] Success shows "Progress Saved!" message

---

## 11. Rollout Plan

### Phase 1: Implementation (Day 1-2)
- [ ] Create validation schemas file
- [ ] Create service layer file
- [ ] Create API endpoint file
- [ ] Code review

### Phase 2: Testing (Day 2-3)
- [ ] Unit test stars calculation
- [ ] Manual test single word progress
- [ ] Manual test batch progress
- [ ] Test error cases
- [ ] Performance test (check <200ms target)

### Phase 3: Integration (Day 3-4)
- [ ] Update GameSessionManager to call endpoint
- [ ] Test end-to-end flow (play game → save → view stats)
- [ ] Verify progress dashboard updates correctly
- [ ] Test with multiple profiles

### Phase 4: Launch (Day 4)
- [ ] Deploy to production
- [ ] Monitor error logs
- [ ] Verify database performance
- [ ] Collect user feedback

**Total Timeline: 4 days**

---

## 12. Success Metrics

### Technical Metrics
- ✅ Endpoint latency < 200ms (P95)
- ✅ Zero critical errors in first week
- ✅ UPSERT pattern prevents duplicate records
- ✅ RLS policies enforce security

### Business Metrics
- ✅ 100% of game sessions save progress successfully
- ✅ Progress dashboard shows real-time updates
- ✅ Stars calculation matches PRD requirements
- ✅ Mastery status updates correctly

### User Experience
- ✅ Children see updated star count after each game
- ✅ Parents see progress dashboard with accurate stats
- ✅ No data loss or duplicate progress records
- ✅ Fast response time (users don't notice delay)

---

## 13. References

### Related Files
- [types.ts](../types.ts) - DTOs already defined
- [database.types.ts](../src/db/database.types.ts) - Database schema types
- [20260126120000_initial_schema_setup.sql](../supabase/migrations/20260126120000_initial_schema_setup.sql) - user_progress table definition
- [CLAUDE.md](../CLAUDE.md) - Project documentation

### Related Endpoints
- `POST /api/game/sessions` - Creates game session (uses same profile validation pattern)
- `GET /api/profiles/:id/stats` - Reads from user_progress table
- `GET /api/profiles/:id/progress` - Reads from user_progress table

### PRD References
- **US-006:** Track Progress & Earn Stars
- **Section 6.3.3:** Performance Requirements (< 200ms for UPSERT)
- **Section 4.2.2:** Stars & Mastery Logic

---

## 14. FAQ

**Q: Why not use database transactions for batch mode?**
A: Partial success is acceptable. If 9/10 words save successfully, that's better than failing the entire batch. We prioritize resilience over atomicity.

**Q: Why preserve highest stars instead of overwriting?**
A: Educational psychology - never punish improvement. Once a child earns 3 stars, we don't downgrade them if they retry and get 2 stars.

**Q: Can is_mastered ever go back to false?**
A: No. Once mastered, always mastered. This encourages children to retry words without fear of "losing" progress.

**Q: What happens if vocabulary_id is deleted from database?**
A: Database has `ON DELETE CASCADE` on user_progress.vocabulary_id foreign key, so progress records auto-delete.

**Q: Should we rate-limit this endpoint?**
A: Not for MVP. With only 20 families and 100 children, we're nowhere near abuse threshold. Add rate limiting post-MVP if needed.

**Q: Can we optimize batch UPSERT with a single query?**
A: Yes, but adds complexity. Current implementation prioritizes code clarity and partial success handling. Optimize if performance becomes an issue.

---

## 15. Next Steps

**Ready to implement?** Follow the [Implementation Checklist](#3-implementation-checklist) step by step.

**Questions?** Refer to existing endpoint patterns:
- [src/pages/api/profiles.ts](../src/pages/api/profiles.ts) - Auth + validation pattern
- [src/pages/api/game/sessions.ts](../src/pages/api/game/sessions.ts) - Profile ownership check

**Need help?** Review [ProfileService](../src/lib/services/profile.service.ts) for service layer patterns.

---

**Document Status:** ✅ APPROVED - Ready for implementation
**Estimated Effort:** 8-9 hours
**Priority:** 🔴 CRITICAL
**Blocks:** MVP Launch

**Implementation assigned to:** [Your name]
**Target completion:** [Date]

---

*End of Progress Endpoint Implementation Plan*
