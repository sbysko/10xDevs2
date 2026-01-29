/**
 * Zod Validation Schemas for Profile Operations
 *
 * Rules derived from api-plan.md:
 * - display_name: 2-50 characters, Unicode letters and spaces only
 * - avatar_url: Must match pattern "avatars/avatar-[1-8].png" or be null/undefined
 * - language_code: Must be 'pl' or 'en', defaults to 'pl'
 *
 * Security:
 * - Regex for display_name prevents XSS attacks (no special characters)
 * - Avatar URL pattern prevents path traversal attacks
 */

import { z } from "zod";

/**
 * Validation schema for creating a child profile
 *
 * Used in: POST /api/profiles
 *
 * @example Valid input:
 * ```json
 * {
 *   "display_name": "Maria",
 *   "avatar_url": "avatars/avatar-1.png",
 *   "language_code": "pl"
 * }
 * ```
 *
 * @example Minimal valid input (with defaults):
 * ```json
 * {
 *   "display_name": "Jan"
 * }
 * ```
 * avatar_url defaults to null, language_code defaults to 'pl'
 */
export const CreateProfileSchema = z.object({
  /**
   * Display name of the child
   *
   * Rules:
   * - Required field
   * - Min 2 characters
   * - Max 50 characters
   * - Only Unicode letters and spaces (no digits, no special characters)
   *
   * Examples: "Maria", "Jan Kowalski", "Zofia"
   * Invalid: "M", "Maria123", "Jan@Home"
   */
  display_name: z
    .string({
      required_error: "Display name is required",
      invalid_type_error: "Display name must be a string",
    })
    .min(2, "Display name must be at least 2 characters")
    .max(50, "Display name must be at most 50 characters")
    .regex(/^[\p{L}\s]+$/u, "Display name must contain only letters and spaces"),

  /**
   * Avatar URL - pre-defined avatar selection (8 options)
   *
   * Rules:
   * - Optional field
   * - Must match pattern "avatars/avatar-[1-8].svg"
   * - Can be null or undefined (no avatar selected)
   *
   * Valid examples: "avatars/avatar-1.svg", "avatars/avatar-8.svg", null
   * Invalid: "avatars/avatar-9.svg", "custom/avatar.svg", "../../../etc/passwd"
   */
  avatar_url: z
    .string()
    .regex(/^avatars\/avatar-[1-8]\.svg$/, "Avatar must be one of the predefined options (avatar-1 to avatar-8)")
    .nullable()
    .optional(),

  /**
   * Language code for child's UI
   *
   * Rules:
   * - Optional field
   * - Must be 'pl' (Polish) or 'en' (English)
   * - Defaults to 'pl' if not provided
   *
   * Valid examples: "pl", "en", undefined (defaults to "pl")
   * Invalid: "de", "fr", "es"
   */
  language_code: z
    .enum(["pl", "en"], {
      errorMap: () => ({ message: "Language must be 'pl' or 'en'" }),
    })
    .default("pl")
    .optional(),
});

/**
 * TypeScript type inferred from Zod schema
 *
 * Should match CreateProfileCommand from types.ts
 * Use this type for validated input in service layer
 */
export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;
