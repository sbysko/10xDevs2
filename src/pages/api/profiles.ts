/**
 * POST /api/profiles - Create child profile
 *
 * Documentation: .ai/create-profile-implementation-plan.md
 * User Story: US-003 (Create Child Profile)
 *
 * Request:
 * - Headers: Authorization: Bearer <jwt_token>
 * - Body: { display_name, avatar_url?, language_code? }
 *
 * Responses:
 * - 201 Created: Profile created successfully
 * - 400 Bad Request: Validation error
 * - 401 Unauthorized: Missing/invalid token
 * - 409 Conflict: Profile limit exceeded (max 5)
 * - 500 Internal Server Error: Unexpected error
 */

import type { APIRoute } from 'astro';
import { ProfileService } from '@/lib/services/profile.service';
import { CreateProfileSchema } from '@/lib/validation/profile.schemas';

// IMPORTANT: Disable prerendering for API routes
export const prerender = false;

/**
 * POST handler - Create new child profile
 *
 * Flow:
 * 1. Authenticate: Extract and validate JWT from Authorization header
 * 2. Parse: Read and parse request body JSON
 * 3. Validate: Check input data with Zod schema
 * 4. Create: Call ProfileService to insert into database
 * 5. Return: 201 with created profile DTO
 *
 * Error handling:
 * - 401 if token missing or invalid
 * - 400 if JSON parsing fails or validation fails
 * - 409 if profile limit exceeded (database trigger)
 * - 500 for unexpected database errors
 */
export const POST: APIRoute = async (context) => {
  // ===================================================================
  // STEP 1: AUTHENTICATION - Verify JWT token
  // ===================================================================

  const authHeader = context.request.headers.get('Authorization');

  // Check if Authorization header exists and has Bearer format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'unauthorized',
        message: 'Authentication required'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Verify JWT token with Supabase Auth
  const {
    data: { user },
    error: authError
  } = await context.locals.supabase.auth.getUser();

  if (authError || !user) {
    console.error('Authentication failed:', authError?.message);

    return new Response(
      JSON.stringify({
        error: 'unauthorized',
        message: 'Invalid or expired token'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // ===================================================================
  // STEP 2: PARSE REQUEST BODY - Read JSON from request
  // ===================================================================

  let requestBody: unknown;

  try {
    requestBody = await context.request.json();
  } catch (jsonError) {
    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: 'Invalid JSON in request body',
        field: 'body'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // ===================================================================
  // STEP 3: VALIDATE INPUT - Check data with Zod schema
  // ===================================================================

  const validationResult = CreateProfileSchema.safeParse(requestBody);

  if (!validationResult.success) {
    // Extract first validation error for user-friendly message
    const firstError = validationResult.error.errors[0];

    return new Response(
      JSON.stringify({
        error: 'validation_error',
        message: firstError.message,
        field: firstError.path.join('.') || 'unknown'
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const validatedData = validationResult.data;

  // ===================================================================
  // STEP 4: CREATE PROFILE - Call service layer
  // ===================================================================

  const profileService = new ProfileService(context.locals.supabase);

  try {
    // Create profile with parent_id from JWT (security measure)
    const newProfile = await profileService.createProfile(
      user.id,
      validatedData
    );

    // Success: Return 201 Created with profile DTO
    return new Response(JSON.stringify(newProfile), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (dbError: unknown) {
    // ===================================================================
    // STEP 5: ERROR HANDLING - Database errors
    // ===================================================================

    const error = dbError as { message?: string; code?: string };

    // Error 1: Profile limit exceeded (database trigger)
    // Trigger message: "Rodzic może mieć maksymalnie 5 profili dzieci"
    if (error.message?.includes('maksymalnie 5 profili')) {
      return new Response(
        JSON.stringify({
          error: 'profile_limit_exceeded',
          message:
            'Maximum number of profiles is 5. Please delete an existing profile first.',
          current_count: 5,
          max_allowed: 5
        }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Error 2: RLS policy violation (should NOT happen with correct implementation)
    // PostgreSQL error code 42501 = insufficient_privilege
    if (error.code === '42501') {
      console.error('CRITICAL: RLS policy violation in createProfile', {
        userId: user.id,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({
          error: 'forbidden',
          message: 'Access denied'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Error 3: Generic database error
    // Log details for debugging, but return generic message to client
    console.error('Database error in POST /api/profiles:', {
      userId: user.id,
      errorCode: error.code,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'An unexpected error occurred. Please try again later.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
