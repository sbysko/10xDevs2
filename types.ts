/**
 * DTO (Data Transfer Object) and Command Model Type Definitions
 * 
 * This file contains all TypeScript type definitions for API request/response objects
 * derived from database entities and API specifications.
 * 
 * Database source: database_types.ts
 * API specification: api-plan.md
 */

import type { Database } from './database_types';

// ============================================================================
// BASE DATABASE TYPE UTILITIES
// ============================================================================

/** Type alias for database Tables for easier access */
type Tables = Database['public']['Tables'];

/** Type alias for database Views for easier access */
type Views = Database['public']['Views'];

/** Type alias for database Enums for easier access */
type Enums = Database['public']['Enums'];

/** Type alias for vocabulary category enum */
type VocabularyCategory = Enums['vocabulary_category'];

// ============================================================================
// COMMON UTILITY TYPES
// ============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

/**
 * Generic error response structure
 */
export interface ErrorResponse {
  error: string;
  message: string;
  field?: string;
}

// ============================================================================
// PROFILE DTOs
// ============================================================================

/**
 * Create Profile Command Model
 * Used in: POST /api/profiles
 * Derived from: Tables['profiles']['Insert']
 */
export interface CreateProfileCommand {
  display_name: string;
  avatar_url?: string | null;
  language_code?: string;
}

/**
 * Update Profile Command Model
 * Used in: PATCH /api/profiles/:id
 * Derived from: Partial selection of Tables['profiles']['Update']
 */
export interface UpdateProfileCommand {
  display_name?: string;
  avatar_url?: string | null;
}

/**
 * Profile DTO - Standard profile representation in API responses
 * Used in: GET /api/profiles/:id, POST /api/profiles, PATCH /api/profiles/:id
 * Derived from: Tables['profiles']['Row']
 */
export interface ProfileDTO {
  id: string;
  parent_id: string;
  display_name: string;
  avatar_url: string | null;
  language_code: string;
  created_at: string;
  updated_at: string;
}

/**
 * Profiles List Response DTO
 * Used in: GET /api/profiles
 */
export interface ProfilesListDTO {
  profiles: ProfileDTO[];
  total: number;
}

/**
 * Profile Limit Error Response
 * Used when profile creation limit is exceeded (409)
 */
export interface ProfileLimitErrorDTO extends ErrorResponse {
  error: 'profile_limit_exceeded';
  current_count: number;
  max_allowed: number;
}

/**
 * Last Profile Error Response
 * Used when attempting to delete the last profile (409)
 */
export interface LastProfileErrorDTO extends ErrorResponse {
  error: 'last_profile';
  remaining_profiles: number;
}

// ============================================================================
// PROFILE STATISTICS DTOs
// ============================================================================

/**
 * Profile Statistics DTO
 * Used in: GET /api/profiles/:id/stats
 * Derived from: Views['profile_stats']['Row']
 */
export interface ProfileStatsDTO {
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  total_words_attempted: number;
  words_mastered: number;
  total_stars: number;
  mastery_percentage: number;
}

/**
 * Category Progress Item - Single category progress details
 */
export interface CategoryProgressItem {
  category: VocabularyCategory;
  total_words: number;
  mastered_words: number;
  completion_percentage: number;
}

/**
 * Overall Progress Summary
 */
export interface OverallProgressSummary {
  total_words: number;
  mastered_words: number;
  completion_percentage: number;
}

/**
 * Category Progress Response DTO
 * Used in: GET /api/profiles/:id/progress/categories
 */
export interface CategoryProgressDTO {
  profile_id: string;
  language: string;
  categories: CategoryProgressItem[];
  overall: OverallProgressSummary;
}

/**
 * Detailed Progress Item - Single word progress details
 */
export interface DetailedProgressItem {
  id: string;
  vocabulary_id: string;
  word_text: string;
  category: VocabularyCategory;
  image_path: string;
  is_mastered: boolean;
  stars_earned: number;
  attempts_count: number;
  last_attempted_at: string | null;
  created_at: string;
}

/**
 * Detailed Progress Response DTO
 * Used in: GET /api/profiles/:id/progress
 */
export interface DetailedProgressDTO {
  profile_id: string;
  progress: DetailedProgressItem[];
  pagination: PaginationMeta;
}

// ============================================================================
// VOCABULARY DTOs
// ============================================================================

/**
 * Vocabulary Word DTO - Standard vocabulary representation
 * Used in: GET /api/vocabulary, GET /api/vocabulary/:id
 * Derived from: Tables['vocabulary']['Row'] with computed image_url
 */
export interface VocabularyDTO {
  id: string;
  word_text: string;
  category: VocabularyCategory;
  language_code: string;
  image_path: string;
  image_url: string; // Computed: Supabase Storage public URL
  difficulty_level: number | null;
  created_at: string;
}

/**
 * Vocabulary List Response DTO
 * Used in: GET /api/vocabulary
 */
export interface VocabularyListDTO {
  vocabulary: VocabularyDTO[];
  pagination: PaginationMeta;
}

// ============================================================================
// CATEGORY DTOs
// ============================================================================

/**
 * Category Item DTO
 */
export interface CategoryDTO {
  code: VocabularyCategory;
  name: string;
  word_count: number;
}

/**
 * Categories List Response DTO
 * Used in: GET /api/categories
 */
export interface CategoriesListDTO {
  categories: CategoryDTO[];
  total_words: number;
}

// ============================================================================
// GAME SESSION DTOs
// ============================================================================

/**
 * Create Game Session Command Model
 * Used in: POST /api/game/sessions
 */
export interface CreateGameSessionCommand {
  profile_id: string;
  category?: VocabularyCategory | null;
  word_count?: number;
}

/**
 * Game Word DTO - Word representation in game session with progress context
 */
export interface GameWordDTO {
  id: string;
  word_text: string;
  category: VocabularyCategory;
  image_path: string;
  image_url: string; // Computed: Supabase Storage public URL
  difficulty_level: number | null;
  is_mastered: boolean;
  previous_stars: number;
  previous_attempts: number;
}

/**
 * Algorithm Info - 80/20 algorithm details
 */
export interface AlgorithmInfo {
  unmastered_words: number;
  mastered_words: number;
  description: string;
}

/**
 * Game Session Response DTO
 * Used in: POST /api/game/sessions
 */
export interface GameSessionDTO {
  session_id: string;
  profile_id: string;
  category: VocabularyCategory | null;
  word_count: number;
  words: GameWordDTO[];
  algorithm: AlgorithmInfo;
  created_at: string;
}

/**
 * Insufficient Words Error Response
 * Used when not enough words are available for game session (422)
 */
export interface InsufficientWordsErrorDTO extends ErrorResponse {
  error: 'insufficient_words';
  available: number;
  requested: number;
}

// ============================================================================
// PROGRESS TRACKING DTOs & Commands
// ============================================================================

/**
 * Record Progress Command Model - Single word progress update
 * Used in: POST /api/progress
 */
export interface RecordProgressCommand {
  profile_id: string;
  vocabulary_id: string;
  is_correct: boolean;
  attempt_number: number;
}

/**
 * Word Details nested object in progress response
 */
export interface WordDetailsDTO {
  word_text: string;
  category: VocabularyCategory;
}

/**
 * Progress Record Response DTO
 * Used in: POST /api/progress (single word response)
 * Derived from: Tables['user_progress']['Row'] with word_details
 */
export interface ProgressRecordDTO {
  id: string;
  profile_id: string;
  vocabulary_id: string;
  is_mastered: boolean;
  stars_earned: number;
  attempts_count: number;
  last_attempted_at: string | null;
  created_at: string;
  updated_at: string;
  word_details: WordDetailsDTO;
}

/**
 * Batch Progress Result Item - Single result in batch operation
 */
export interface BatchProgressResultItem {
  vocabulary_id: string;
  status: 'success' | 'error';
  stars_earned: number;
  is_mastered: boolean;
  error_message?: string;
}

/**
 * Batch Progress Item - Single word data in batch request
 */
export interface BatchProgressItem {
  vocabulary_id: string;
  is_correct: boolean;
  attempt_number: number;
}

/**
 * Record Batch Progress Command Model
 * Used in: POST /api/progress (batch mode)
 */
export interface RecordBatchProgressCommand {
  profile_id: string;
  results: BatchProgressItem[];
}

/**
 * Batch Progress Response DTO
 * Used in: POST /api/progress (batch mode response)
 */
export interface BatchProgressResponseDTO {
  profile_id: string;
  processed: number;
  results: BatchProgressResultItem[];
}

// ============================================================================
// VALIDATION ERROR DTOs
// ============================================================================

/**
 * Validation Error Response
 * Used for 400 Bad Request errors with field-specific validation issues
 */
export interface ValidationErrorDTO extends ErrorResponse {
  error: 'validation_error';
  field: string;
}

/**
 * Not Found Error Response
 * Used for 404 Not Found errors
 */
export interface NotFoundErrorDTO extends ErrorResponse {
  error: 'not_found';
}

/**
 * Unauthorized Error Response
 * Used for 401 Unauthorized errors
 */
export interface UnauthorizedErrorDTO extends ErrorResponse {
  error: 'unauthorized';
}

// ============================================================================
// QUERY PARAMETER TYPES
// ============================================================================

/**
 * Vocabulary List Query Parameters
 * Used in: GET /api/vocabulary
 */
export interface VocabularyQueryParams {
  category?: VocabularyCategory;
  language?: string;
  limit?: number;
  offset?: number;
}

/**
 * Detailed Progress Query Parameters
 * Used in: GET /api/profiles/:id/progress
 */
export interface DetailedProgressQueryParams {
  category?: VocabularyCategory;
  is_mastered?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Category Progress Query Parameters
 * Used in: GET /api/profiles/:id/progress/categories
 */
export interface CategoryProgressQueryParams {
  language?: string;
}

/**
 * Categories List Query Parameters
 * Used in: GET /api/categories
 */
export interface CategoriesQueryParams {
  language?: string;
}

// ============================================================================
// TYPE GUARDS (Helper functions for type checking)
// ============================================================================

/**
 * Type guard to check if an error is a ProfileLimitErrorDTO
 */
export function isProfileLimitError(error: ErrorResponse): error is ProfileLimitErrorDTO {
  return error.error === 'profile_limit_exceeded';
}

/**
 * Type guard to check if an error is a LastProfileErrorDTO
 */
export function isLastProfileError(error: ErrorResponse): error is LastProfileErrorDTO {
  return error.error === 'last_profile';
}

/**
 * Type guard to check if an error is a ValidationErrorDTO
 */
export function isValidationError(error: ErrorResponse): error is ValidationErrorDTO {
  return error.error === 'validation_error';
}

/**
 * Type guard to check if an error is an InsufficientWordsErrorDTO
 */
export function isInsufficientWordsError(error: ErrorResponse): error is InsufficientWordsErrorDTO {
  return error.error === 'insufficient_words';
}
