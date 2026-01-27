# REST API Plan - Match Picture to Word

## 1. Resources

### Core Resources
| Resource | Database Table | Description |
|----------|---------------|-------------|
| **profiles** | `profiles` | Child profiles managed by parent account |
| **vocabulary** | `vocabulary` | Central vocabulary database (250 words, read-only) |
| **progress** | `user_progress` | Learning progress tracking per child per word |
| **categories** | `vocabulary_category` (ENUM) | Vocabulary categories (virtual resource) |
| **game-sessions** | `user_progress` + `get_next_words()` | Game session management with smart word selection |
| **stats** | `profile_stats` (VIEW) | Aggregated statistics per profile |

### Authentication
- **Managed by Supabase Auth** - No custom endpoints required
- All API requests require JWT token in Authorization header: `Bearer <token>`
- Row Level Security (RLS) automatically filters data by `auth.uid()`

---

## 2. Endpoints

### 2.1 Profile Management

#### Create Child Profile
```
POST /api/profiles
```

**Description:** Creates a new child profile for the authenticated parent. Maximum 5 profiles per parent.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "display_name": "Maria",
  "avatar_url": "avatars/avatar-1.png",
  "language_code": "pl"
}
```

**Validation Rules:**
- `display_name`: Required, 2-50 characters
- `avatar_url`: Optional, must be valid path in Supabase Storage
- `language_code`: Optional, must be 'pl' or 'en', defaults to 'pl'

**Success Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "parent-uuid",
  "display_name": "Maria",
  "avatar_url": "avatars/avatar-1.png",
  "language_code": "pl",
  "created_at": "2026-01-26T10:00:00Z",
  "updated_at": "2026-01-26T10:00:00Z"
}
```

**Error Responses:**
```json
// 400 Bad Request - Invalid input
{
  "error": "validation_error",
  "message": "Display name must be between 2 and 50 characters",
  "field": "display_name"
}

// 409 Conflict - Profile limit exceeded
{
  "error": "profile_limit_exceeded",
  "message": "Maximum number of profiles is 5. Please delete an existing profile first.",
  "current_count": 5,
  "max_allowed": 5
}

// 401 Unauthorized - Missing/invalid token
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

#### List All Profiles for Parent
```
GET /api/profiles
```

**Description:** Returns all child profiles belonging to the authenticated parent.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Query Parameters:** None

**Success Response (200 OK):**
```json
{
  "profiles": [
    {
      "id": "profile-uuid-1",
      "parent_id": "parent-uuid",
      "display_name": "Maria",
      "avatar_url": "avatars/avatar-1.png",
      "language_code": "pl",
      "created_at": "2026-01-20T10:00:00Z",
      "updated_at": "2026-01-20T10:00:00Z"
    },
    {
      "id": "profile-uuid-2",
      "parent_id": "parent-uuid",
      "display_name": "Jan",
      "avatar_url": "avatars/avatar-2.png",
      "language_code": "pl",
      "created_at": "2026-01-21T14:30:00Z",
      "updated_at": "2026-01-21T14:30:00Z"
    }
  ],
  "total": 2
}
```

**Error Responses:**
```json
// 401 Unauthorized
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

#### Get Single Profile
```
GET /api/profiles/:id
```

**Description:** Returns details of a specific child profile. RLS ensures parent can only access their own children's profiles.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Path Parameters:**
- `id` (UUID, required): Profile ID

**Success Response (200 OK):**
```json
{
  "id": "profile-uuid-1",
  "parent_id": "parent-uuid",
  "display_name": "Maria",
  "avatar_url": "avatars/avatar-1.png",
  "language_code": "pl",
  "created_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-20T10:00:00Z"
}
```

**Error Responses:**
```json
// 404 Not Found - Profile doesn't exist or doesn't belong to parent
{
  "error": "not_found",
  "message": "Profile not found"
}

// 401 Unauthorized
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

#### Update Profile
```
PATCH /api/profiles/:id
```

**Description:** Updates child profile information (name and/or avatar).

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Path Parameters:**
- `id` (UUID, required): Profile ID

**Request Body (all fields optional):**
```json
{
  "display_name": "Maria Anna",
  "avatar_url": "avatars/avatar-3.png"
}
```

**Validation Rules:**
- `display_name`: If provided, must be 2-50 characters
- `avatar_url`: If provided, must be valid path
- At least one field must be provided

**Success Response (200 OK):**
```json
{
  "id": "profile-uuid-1",
  "parent_id": "parent-uuid",
  "display_name": "Maria Anna",
  "avatar_url": "avatars/avatar-3.png",
  "language_code": "pl",
  "created_at": "2026-01-20T10:00:00Z",
  "updated_at": "2026-01-26T11:30:00Z"
}
```

**Error Responses:**
```json
// 400 Bad Request
{
  "error": "validation_error",
  "message": "Display name must be between 2 and 50 characters",
  "field": "display_name"
}

// 404 Not Found
{
  "error": "not_found",
  "message": "Profile not found"
}
```

---

#### Delete Profile
```
DELETE /api/profiles/:id
```

**Description:** Deletes a child profile and all associated progress data (CASCADE). Prevents deletion of last remaining profile.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Path Parameters:**
- `id` (UUID, required): Profile ID

**Business Logic:**
- Check if this is the last profile for the parent
- If yes, return 409 Conflict
- If no, proceed with deletion (CASCADE deletes user_progress records)

**Success Response (204 No Content):**
```
(Empty response body)
```

**Error Responses:**
```json
// 409 Conflict - Last profile
{
  "error": "last_profile",
  "message": "Cannot delete the last profile. You must have at least one child profile.",
  "remaining_profiles": 1
}

// 404 Not Found
{
  "error": "not_found",
  "message": "Profile not found"
}
```

---

### 2.2 Profile Statistics

#### Get Profile Statistics
```
GET /api/profiles/:id/stats
```

**Description:** Returns aggregated statistics for a child profile using the `profile_stats` view.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Path Parameters:**
- `id` (UUID, required): Profile ID

**Success Response (200 OK):**
```json
{
  "profile_id": "profile-uuid-1",
  "display_name": "Maria",
  "avatar_url": "avatars/avatar-1.png",
  "total_words_attempted": 45,
  "words_mastered": 32,
  "total_stars": 89,
  "mastery_percentage": 71.1
}
```

**Error Responses:**
```json
// 404 Not Found
{
  "error": "not_found",
  "message": "Profile not found"
}
```

---

#### Get Category Progress
```
GET /api/profiles/:id/progress/categories
```

**Description:** Returns progress breakdown by category for tracker display (US-011).

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Path Parameters:**
- `id` (UUID, required): Profile ID

**Query Parameters:**
- `language` (string, optional): Language code, defaults to profile's language_code

**Success Response (200 OK):**
```json
{
  "profile_id": "profile-uuid-1",
  "language": "pl",
  "categories": [
    {
      "category": "zwierzeta",
      "total_words": 50,
      "mastered_words": 12,
      "completion_percentage": 24.0
    },
    {
      "category": "owoce_warzywa",
      "total_words": 50,
      "mastered_words": 8,
      "completion_percentage": 16.0
    },
    {
      "category": "pojazdy",
      "total_words": 50,
      "mastered_words": 5,
      "completion_percentage": 10.0
    },
    {
      "category": "kolory_ksztalty",
      "total_words": 50,
      "mastered_words": 7,
      "completion_percentage": 14.0
    },
    {
      "category": "przedmioty_codzienne",
      "total_words": 50,
      "mastered_words": 0,
      "completion_percentage": 0.0
    }
  ],
  "overall": {
    "total_words": 250,
    "mastered_words": 32,
    "completion_percentage": 12.8
  }
}
```

---

#### Get Detailed Progress
```
GET /api/profiles/:id/progress
```

**Description:** Returns detailed word-level progress for a profile with optional filtering.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Path Parameters:**
- `id` (UUID, required): Profile ID

**Query Parameters:**
- `category` (string, optional): Filter by category
- `is_mastered` (boolean, optional): Filter by mastery status
- `limit` (integer, optional): Number of records to return, default 20
- `offset` (integer, optional): Pagination offset, default 0

**Success Response (200 OK):**
```json
{
  "profile_id": "profile-uuid-1",
  "progress": [
    {
      "id": "progress-uuid-1",
      "vocabulary_id": "word-uuid-1",
      "word_text": "Kot",
      "category": "zwierzeta",
      "image_path": "vocabulary/pl/zwierzeta/kot.png",
      "is_mastered": true,
      "stars_earned": 3,
      "attempts_count": 1,
      "last_attempted_at": "2026-01-25T14:30:00Z",
      "created_at": "2026-01-25T14:30:00Z"
    },
    {
      "id": "progress-uuid-2",
      "vocabulary_id": "word-uuid-2",
      "word_text": "Pies",
      "category": "zwierzeta",
      "image_path": "vocabulary/pl/zwierzeta/pies.png",
      "is_mastered": false,
      "stars_earned": 1,
      "attempts_count": 3,
      "last_attempted_at": "2026-01-26T09:15:00Z",
      "created_at": "2026-01-25T14:45:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 2.3 Vocabulary

#### List Vocabulary Words
```
GET /api/vocabulary
```

**Description:** Returns vocabulary words with optional filtering. Read-only access for authenticated users.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Query Parameters:**
- `category` (string, optional): Filter by category (zwierzeta, owoce_warzywa, pojazdy, kolory_ksztalty, przedmioty_codzienne)
- `language` (string, optional): Filter by language, default 'pl'
- `limit` (integer, optional): Number of records, default 50
- `offset` (integer, optional): Pagination offset, default 0

**Success Response (200 OK):**
```json
{
  "vocabulary": [
    {
      "id": "word-uuid-1",
      "word_text": "Kot",
      "category": "zwierzeta",
      "language_code": "pl",
      "image_path": "vocabulary/pl/zwierzeta/kot.png",
      "image_url": "https://[project].supabase.co/storage/v1/object/public/vocabulary/pl/zwierzeta/kot.png",
      "difficulty_level": 1,
      "created_at": "2026-01-15T00:00:00Z"
    },
    {
      "id": "word-uuid-2",
      "word_text": "Pies",
      "category": "zwierzeta",
      "language_code": "pl",
      "image_path": "vocabulary/pl/zwierzeta/pies.png",
      "image_url": "https://[project].supabase.co/storage/v1/object/public/vocabulary/pl/zwierzeta/pies.png",
      "difficulty_level": 1,
      "created_at": "2026-01-15T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "offset": 0,
    "has_more": false
  }
}
```

**Note:** The `image_url` field is constructed by the API from `image_path` using the Supabase Storage public URL pattern.

---

#### Get Single Vocabulary Word
```
GET /api/vocabulary/:id
```

**Description:** Returns details of a specific vocabulary word.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Path Parameters:**
- `id` (UUID, required): Vocabulary word ID

**Success Response (200 OK):**
```json
{
  "id": "word-uuid-1",
  "word_text": "Kot",
  "category": "zwierzeta",
  "language_code": "pl",
  "image_path": "vocabulary/pl/zwierzeta/kot.png",
  "image_url": "https://[project].supabase.co/storage/v1/object/public/vocabulary/pl/zwierzeta/kot.png",
  "difficulty_level": 1,
  "created_at": "2026-01-15T00:00:00Z"
}
```

---

### 2.4 Categories

#### List Categories
```
GET /api/categories
```

**Description:** Returns available vocabulary categories with word counts.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Query Parameters:**
- `language` (string, optional): Filter by language, default 'pl'

**Success Response (200 OK):**
```json
{
  "categories": [
    {
      "code": "zwierzeta",
      "name": "Zwierzęta",
      "word_count": 50
    },
    {
      "code": "owoce_warzywa",
      "name": "Owoce i Warzywa",
      "word_count": 50
    },
    {
      "code": "pojazdy",
      "name": "Pojazdy",
      "word_count": 50
    },
    {
      "code": "kolory_ksztalty",
      "name": "Kolory i Kształty",
      "word_count": 50
    },
    {
      "code": "przedmioty_codzienne",
      "name": "Przedmioty Codziennego Użytku",
      "word_count": 50
    }
  ],
  "total_words": 250
}
```

---

### 2.5 Game Sessions

#### Create Game Session
```
POST /api/game/sessions
```

**Description:** Creates a new game session and returns 10 words selected using the 80/20 algorithm (US-017). Calls the `get_next_words()` database function.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "profile_id": "profile-uuid-1",
  "category": "zwierzeta",
  "word_count": 10
}
```

**Validation Rules:**
- `profile_id`: Required, must belong to authenticated parent
- `category`: Optional, if provided must be valid category, if null returns "Mix" mode
- `word_count`: Optional, default 10, must be 1-50

**Success Response (200 OK):**
```json
{
  "session_id": "session-uuid-1",
  "profile_id": "profile-uuid-1",
  "category": "zwierzeta",
  "word_count": 10,
  "words": [
    {
      "id": "word-uuid-1",
      "word_text": "Kot",
      "category": "zwierzeta",
      "image_path": "vocabulary/pl/zwierzeta/kot.png",
      "image_url": "https://[project].supabase.co/storage/v1/object/public/vocabulary/pl/zwierzeta/kot.png",
      "difficulty_level": 1,
      "is_mastered": false,
      "previous_stars": 0,
      "previous_attempts": 0
    },
    {
      "id": "word-uuid-2",
      "word_text": "Pies",
      "category": "zwierzeta",
      "image_path": "vocabulary/pl/zwierzeta/pies.png",
      "image_url": "https://[project].supabase.co/storage/v1/object/public/vocabulary/pl/zwierzeta/pies.png",
      "difficulty_level": 1,
      "is_mastered": true,
      "previous_stars": 3,
      "previous_attempts": 1
    }
  ],
  "algorithm": {
    "unmastered_words": 8,
    "mastered_words": 2,
    "description": "80% unmastered + 20% mastered"
  },
  "created_at": "2026-01-26T10:00:00Z"
}
```

**Business Logic (80/20 Algorithm):**
1. Query user_progress for profile to get mastered vs unmastered words
2. Randomly select 80% from unmastered words (is_mastered = false)
3. Randomly select 20% from mastered words (is_mastered = true)
4. Prefer words with older last_attempted_at or never attempted
5. If insufficient words in category, fill from other categories (Mix mode)
6. Shuffle the final list for random order

**Error Responses:**
```json
// 400 Bad Request - Invalid category
{
  "error": "validation_error",
  "message": "Invalid category. Must be one of: zwierzeta, owoce_warzywa, pojazdy, kolory_ksztalty, przedmioty_codzienne",
  "field": "category"
}

// 404 Not Found - Profile not found or doesn't belong to parent
{
  "error": "not_found",
  "message": "Profile not found"
}

// 422 Unprocessable Entity - Insufficient words
{
  "error": "insufficient_words",
  "message": "Not enough words available in category 'zwierzeta' for requested word_count",
  "available": 5,
  "requested": 10
}
```

---

### 2.6 Progress Tracking

#### Record Progress
```
POST /api/progress
```

**Description:** Records or updates progress for a word after child's answer. Uses UPSERT pattern (US-014, US-015).

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "profile_id": "profile-uuid-1",
  "vocabulary_id": "word-uuid-1",
  "is_correct": true,
  "attempt_number": 1
}
```

**Validation Rules:**
- `profile_id`: Required, must belong to authenticated parent
- `vocabulary_id`: Required, must exist in vocabulary
- `is_correct`: Required, boolean
- `attempt_number`: Required, integer >= 1

**Business Logic:**
1. Calculate stars_earned based on attempt_number:
   - attempt_number = 1 → 3 stars
   - attempt_number = 2 → 2 stars
   - attempt_number >= 3 → 1 star
2. Set is_mastered = true if is_correct = true
3. UPSERT into user_progress:
   - If record exists: UPDATE stars_earned (accumulate), attempts_count (+1), is_mastered, last_attempted_at
   - If new: INSERT new record
4. Update updated_at via trigger

**Success Response (200 OK):**
```json
{
  "id": "progress-uuid-1",
  "profile_id": "profile-uuid-1",
  "vocabulary_id": "word-uuid-1",
  "is_mastered": true,
  "stars_earned": 3,
  "attempts_count": 1,
  "last_attempted_at": "2026-01-26T10:15:00Z",
  "created_at": "2026-01-26T10:15:00Z",
  "updated_at": "2026-01-26T10:15:00Z",
  "word_details": {
    "word_text": "Kot",
    "category": "zwierzeta"
  }
}
```

**Alternative Request Format (Batch):**
```json
{
  "profile_id": "profile-uuid-1",
  "results": [
    {
      "vocabulary_id": "word-uuid-1",
      "is_correct": true,
      "attempt_number": 1
    },
    {
      "vocabulary_id": "word-uuid-2",
      "is_correct": false,
      "attempt_number": 2
    }
  ]
}
```

**Batch Success Response (200 OK):**
```json
{
  "profile_id": "profile-uuid-1",
  "processed": 2,
  "results": [
    {
      "vocabulary_id": "word-uuid-1",
      "status": "success",
      "stars_earned": 3,
      "is_mastered": true
    },
    {
      "vocabulary_id": "word-uuid-2",
      "status": "success",
      "stars_earned": 0,
      "is_mastered": false
    }
  ]
}
```

**Error Responses:**
```json
// 400 Bad Request - Invalid attempt_number
{
  "error": "validation_error",
  "message": "attempt_number must be >= 1",
  "field": "attempt_number"
}

// 404 Not Found - Profile or vocabulary not found
{
  "error": "not_found",
  "message": "Profile or vocabulary word not found"
}
```

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Provider:** Supabase Auth (GoTrue)

**Implementation:**
- Frontend uses `@supabase/auth-ui-react` for login/register forms
- Supabase SDK manages JWT tokens automatically
- All API requests include JWT in Authorization header

**Token Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Token Validation:**
- API validates JWT using Supabase client library
- Extract `user.id` from validated token
- Use `user.id` as `auth.uid()` in database queries

**Session Management:**
- Tokens expire after configured period (default 3600s)
- Refresh tokens handled automatically by Supabase SDK
- Logout clears session and invalidates tokens

### 3.2 Authorization (Row Level Security)

**Parent-Child Relationship:**
```sql
-- Parent can only access their own profiles
WHERE profiles.parent_id = auth.uid()

-- Parent can only access progress for their children
WHERE EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_progress.profile_id
  AND profiles.parent_id = auth.uid()
)
```

**Vocabulary Access:**
- All authenticated users have read-only access
- No write access for regular users (admin-only)

**Implementation:**
- RLS policies defined in database schema (db-plan.md lines 333-410)
- API relies on database-level authorization
- API validates that profile_id belongs to authenticated parent before operations

### 3.3 Protected Routes

All endpoints require authentication except:
- `/health` (health check endpoint)
- Documentation endpoints

**Middleware Flow:**
1. Extract JWT from Authorization header
2. Validate token with Supabase
3. If invalid: Return 401 Unauthorized
4. If valid: Extract user_id and proceed
5. Database RLS filters results automatically

---

## 4. Validation and Business Logic

### 4.1 Profile Validation

**Create/Update Profile:**
```typescript
{
  display_name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[\p{L}\s]+$/u, // Unicode letters and spaces
    message: "Display name must be 2-50 characters, letters and spaces only"
  },
  avatar_url: {
    required: false,
    pattern: /^avatars\/avatar-[1-8]\.png$/,
    message: "Avatar must be one of the predefined options"
  },
  language_code: {
    required: false,
    enum: ['pl', 'en'],
    default: 'pl',
    message: "Language must be 'pl' or 'en'"
  }
}
```

**Delete Profile:**
- Business rule: Cannot delete if only 1 profile remaining
- Check count before deletion: `SELECT COUNT(*) FROM profiles WHERE parent_id = auth.uid()`
- Return 409 if count = 1

**Profile Limit:**
- Business rule: Maximum 5 profiles per parent
- Enforced by database trigger `check_profile_limit()`
- API catches exception and returns 409 with user-friendly message

### 4.2 Progress Validation

**Record Progress:**
```typescript
{
  profile_id: {
    required: true,
    type: 'uuid',
    validate: async (id) => {
      // Check if profile belongs to authenticated parent
      const profile = await db.profiles.findOne({
        id,
        parent_id: auth.uid()
      });
      return !!profile;
    },
    message: "Invalid profile_id or access denied"
  },
  vocabulary_id: {
    required: true,
    type: 'uuid',
    validate: async (id) => {
      const word = await db.vocabulary.findOne({ id });
      return !!word;
    },
    message: "Vocabulary word not found"
  },
  is_correct: {
    required: true,
    type: 'boolean'
  },
  attempt_number: {
    required: true,
    type: 'integer',
    min: 1,
    max: 10,
    message: "Attempt number must be between 1 and 10"
  }
}
```

**Stars Calculation Logic:**
```typescript
function calculateStars(attemptNumber: number, isCorrect: boolean): number {
  if (!isCorrect) return 0;
  
  if (attemptNumber === 1) return 3;
  if (attemptNumber === 2) return 2;
  return 1; // attemptNumber >= 3
}
```

**Mastery Logic:**
```typescript
function determineMastery(isCorrect: boolean, currentAttempts: number): boolean {
  // Word is mastered when answered correctly
  // Remains mastered even if later answered incorrectly (spaced repetition)
  return isCorrect || currentMastery;
}
```

### 4.3 Game Session Validation

**Create Session:**
```typescript
{
  profile_id: {
    required: true,
    type: 'uuid',
    validate: async (id) => {
      const profile = await db.profiles.findOne({
        id,
        parent_id: auth.uid()
      });
      return !!profile;
    }
  },
  category: {
    required: false,
    enum: [
      'zwierzeta',
      'owoce_warzywa',
      'pojazdy',
      'kolory_ksztalty',
      'przedmioty_codzienne',
      null // null = Mix mode
    ],
    message: "Invalid category"
  },
  word_count: {
    required: false,
    type: 'integer',
    min: 1,
    max: 50,
    default: 10
  }
}
```

**80/20 Algorithm Implementation:**
```sql
-- Implemented as get_next_words() function in database
-- See db-plan.md lines 227-277 for full implementation

SELECT * FROM get_next_words(
  p_profile_id := 'profile-uuid',
  p_language_code := 'pl',
  p_limit := 10,
  p_category := 'zwierzeta'  -- or NULL for Mix
);
```

### 4.4 Database Constraints

**Automatically Enforced:**
- UNIQUE constraints: `(word_text, language_code)`, `(profile_id, vocabulary_id)`
- CHECK constraints: stars_earned BETWEEN 0 AND 3, attempts_count >= 0
- Foreign key constraints: All relationships enforced with CASCADE deletion
- Triggers: updated_at timestamp, profile limit (max 5)

**API Responsibility:**
- Catch constraint violations
- Return appropriate HTTP status codes (400, 409, 422)
- Provide user-friendly error messages
- Log validation failures for monitoring

### 4.5 Error Handling Strategy

**Error Response Format:**
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "field_name",
    "constraint": "constraint_type"
  },
  "timestamp": "2026-01-26T10:00:00Z",
  "request_id": "req-uuid"
}
```

**Error Code Mappings:**
- 400 Bad Request: Invalid input, validation failure
- 401 Unauthorized: Missing or invalid authentication token
- 403 Forbidden: Valid token but insufficient permissions (rare with RLS)
- 404 Not Found: Resource doesn't exist or parent doesn't own it
- 409 Conflict: Profile limit exceeded, last profile deletion, unique constraint
- 422 Unprocessable Entity: Business logic validation failure
- 429 Too Many Requests: Rate limiting (future)
- 500 Internal Server Error: Unexpected errors, database failures

---

## 5. Performance Considerations

### 5.1 Query Optimization

**Indexes (Already Defined in Database):**
```sql
-- profiles
CREATE INDEX idx_profiles_parent_id ON profiles(parent_id);
CREATE INDEX idx_profiles_language_code ON profiles(language_code);

-- vocabulary
CREATE INDEX idx_vocabulary_category ON vocabulary(category);
CREATE INDEX idx_vocabulary_language_code ON vocabulary(language_code);
CREATE INDEX idx_vocabulary_lang_category ON vocabulary(language_code, category);

-- user_progress
CREATE INDEX idx_user_progress_profile_id ON user_progress(profile_id);
CREATE INDEX idx_user_progress_vocabulary_id ON user_progress(vocabulary_id);
CREATE INDEX idx_user_progress_is_mastered ON user_progress(is_mastered);
CREATE INDEX idx_user_progress_profile_mastered ON user_progress(profile_id, is_mastered);
CREATE INDEX idx_user_progress_last_attempted ON user_progress(profile_id, last_attempted_at DESC);
```

**Performance Targets (from PRD 6.3.3):**
- Fetch 10 questions: < 500ms
- UPSERT progress: < 200ms
- Fetch progress tracker: < 300ms

**Optimization Strategies:**
- Use database views for aggregations (`profile_stats`)
- Use database functions for complex logic (`get_next_words()`)
- Leverage database indexes for filtering and sorting
- Consider caching vocabulary (static data)

### 5.2 Caching Strategy

**Vocabulary (Static Data):**
- Cache duration: 24 hours
- Cache invalidation: On vocabulary updates (admin-only)
- Implementation: API-level cache or CDN

**Profile Stats:**
- Cache duration: 5 minutes
- Cache key: `profile:${profile_id}:stats`
- Invalidation: On progress update

**Categories:**
- Cache duration: 24 hours
- Static data, rarely changes

**No Caching:**
- User progress (real-time data)
- Game sessions (unique per request)
- Profile CRUD operations

### 5.3 Pagination

**Standard Pagination Parameters:**
```
?limit=20&offset=0
```

**Endpoints with Pagination:**
- GET /api/vocabulary
- GET /api/profiles/:id/progress

**Pagination Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 250,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_offset": 20
  }
}
```

**Future: Cursor-based Pagination**
```
?limit=20&cursor=eyJpZCI6InV1aWQiLCJ0cyI6IjIwMjYtMDEtMjYifQ==
```

### 5.4 Rate Limiting (Future Enhancement)

**Recommended Limits:**
- Authentication endpoints: 5 requests per minute per IP
- Profile CRUD: 10 requests per minute per user
- Progress updates: 100 requests per minute per user (game play)
- Read operations: 100 requests per minute per user

**Implementation:**
- Use Supabase Edge Functions rate limiting
- Or implement API Gateway with rate limiting
- Return 429 with Retry-After header

### 5.5 Image Delivery

**Strategy:**
- Images stored in Supabase Storage
- Direct access via public URLs (no API proxy)
- CDN acceleration enabled in Supabase

**URL Construction:**
```typescript
const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/vocabulary/${imagePath}`;
```

**Optimization:**
- All images pre-optimized to < 50KB (PRD 6.3.4)
- Format: PNG with transparency
- Dimensions: Consistent size for all images (e.g., 512x512px)
- Total storage: 250 × 50KB = ~12.5MB

---

## 6. Security Measures

### 6.1 Authentication Security

**Token Management:**
- JWT tokens with 1-hour expiration
- Refresh tokens with 7-day expiration
- Secure httpOnly cookies for refresh tokens
- Token rotation on refresh

**Password Requirements:**
- Minimum 8 characters (enforced by Supabase Auth)
- No maximum length enforcement (best practice)
- Password hashing via Supabase Auth (bcrypt)

**Session Security:**
- Logout invalidates all tokens
- No concurrent session limit for MVP
- Session activity tracking for monitoring

### 6.2 Authorization Security

**Row Level Security (RLS):**
- Enabled on all user tables
- Policies enforce parent-child relationship
- Nested queries prevent unauthorized access
- Database-level enforcement (defense in depth)

**API-Level Checks:**
```typescript
// Always verify profile ownership before operations
async function verifyProfileOwnership(profileId: string, userId: string): Promise<boolean> {
  const profile = await db.profiles.findOne({
    id: profileId,
    parent_id: userId
  });
  return !!profile;
}
```

### 6.3 Input Validation

**Validation Layers:**
1. Client-side: Basic format validation, immediate feedback
2. API-level: Schema validation, business rules
3. Database: Constraints, triggers, CHECK conditions

**SQL Injection Prevention:**
- Use parameterized queries exclusively
- Supabase client handles query parameterization
- Never concatenate user input into SQL

**XSS Prevention:**
- Sanitize all user inputs
- React escapes output by default
- Content Security Policy headers

### 6.4 Data Privacy

**Minimal Data Collection (GDPR/COPPA Compliant):**
- Parent email (authentication only)
- Child display name (no surname)
- No date of birth or precise age
- No personal identifiable information for children
- No tracking beyond essential game metrics

**Data Retention:**
- User can delete profiles at any time
- CASCADE deletion removes all associated data
- No soft deletes for personal data

**Privacy Policy Requirements:**
- Clear disclosure of data collection
- Parent consent for child participation
- Right to data export
- Right to deletion

### 6.5 CORS Configuration

**Allowed Origins:**
```typescript
// Production
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com'
];

// Development
if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:4321'); // Astro dev server
}
```

**CORS Headers:**
```
Access-Control-Allow-Origin: [allowed-origin]
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

---

## 7. API Versioning

### 7.1 Versioning Strategy

**Current Version:** v1 (MVP)

**URL Structure:**
```
https://api.yourdomain.com/v1/profiles
https://api.yourdomain.com/v1/vocabulary
```

**Alternative (No Version for MVP):**
```
https://api.yourdomain.com/api/profiles
```

**Recommendation:** Start without version prefix for MVP, add versioning when introducing breaking changes in v1.1+

### 7.2 Breaking vs Non-Breaking Changes

**Non-Breaking Changes (No Version Bump):**
- Adding new optional fields to requests
- Adding new fields to responses
- Adding new endpoints
- Adding new query parameters (optional)
- Relaxing validation rules

**Breaking Changes (Require New Version):**
- Removing fields from responses
- Changing field types
- Making optional fields required
- Changing endpoint URLs
- Changing authentication mechanism

---

## 8. Monitoring and Observability

### 8.1 Health Check

#### Health Check Endpoint
```
GET /health
```

**Description:** Returns API health status. No authentication required.

**Success Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-01-26T10:00:00Z",
  "database": "connected",
  "storage": "accessible"
}
```

**Degraded Response (503 Service Unavailable):**
```json
{
  "status": "degraded",
  "version": "1.0.0",
  "timestamp": "2026-01-26T10:00:00Z",
  "database": "slow",
  "storage": "accessible",
  "issues": ["Database response time > 1000ms"]
}
```

### 8.2 Logging

**Log Levels:**
- ERROR: 500 errors, database failures, authentication failures
- WARN: 4xx errors, validation failures, rate limit hits
- INFO: Successful requests, user actions (login, profile creation)
- DEBUG: Detailed request/response logs (development only)

**Log Format (JSON):**
```json
{
  "timestamp": "2026-01-26T10:00:00Z",
  "level": "INFO",
  "method": "POST",
  "path": "/api/profiles",
  "status": 201,
  "duration_ms": 45,
  "user_id": "parent-uuid",
  "request_id": "req-uuid",
  "message": "Profile created successfully"
}
```

**Sensitive Data Exclusion:**
- Never log passwords or tokens
- Never log full email addresses (hash or truncate)
- Never log children's personal information

### 8.3 Metrics

**Key Metrics to Track:**
- Request rate (requests per minute)
- Response times (p50, p95, p99)
- Error rates (by status code)
- Database query performance
- Authentication success/failure rate
- Active sessions
- Cache hit rates

**Monitoring Tools:**
- Supabase Dashboard: Database performance, storage usage
- Vercel Analytics: Request metrics, performance
- Custom logging: Application-specific metrics

### 8.4 Error Tracking

**Error Categories:**
- Authentication errors (401)
- Authorization errors (403, 404 with RLS)
- Validation errors (400)
- Business logic errors (409, 422)
- System errors (500)

**Alert Thresholds:**
- Error rate > 5%: Warning
- Error rate > 10%: Critical
- Database response time > 1000ms: Warning
- Authentication failure rate > 20%: Potential attack

---

## 9. Development Workflow

### 9.1 API Development Checklist

For each new endpoint:
- [ ] Define endpoint in this API plan
- [ ] Create database schema/migrations if needed
- [ ] Implement endpoint handler
- [ ] Add input validation
- [ ] Add authentication/authorization
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Add API documentation
- [ ] Test with Postman/Insomnia
- [ ] Review error handling
- [ ] Check performance targets
- [ ] Deploy to staging
- [ ] End-to-end testing
- [ ] Deploy to production

### 9.2 Testing Strategy

**Unit Tests:**
- Validation logic
- Business logic (stars calculation, mastery determination)
- Helper functions

**Integration Tests:**
- Full request/response cycle
- Database operations
- Authentication flow
- RLS policy enforcement

**End-to-End Tests:**
- Complete user flows (register → create profile → play game → view progress)
- Cross-browser testing
- Mobile device testing

**Test Coverage Target:** 80%+ for business logic

### 9.3 API Documentation

**Tools:**
- OpenAPI/Swagger specification
- Postman collection
- Interactive API documentation (Swagger UI)

**Documentation Includes:**
- All endpoints with examples
- Authentication guide
- Error codes reference
- Rate limiting information
- Changelog

---

## 10. Future Enhancements (Post-MVP)

### 10.1 Version 1.1 Features

**New Endpoints:**
- POST /api/game/sessions/:id/feedback - Submit feedback after session
- GET /api/profiles/:id/achievements - Badge/achievement system
- GET /api/leaderboard - Optional leaderboard (privacy-conscious)

**Enhanced Features:**
- Batch progress updates for entire session
- Audio narration support (add audio_url to vocabulary)
- Parental controls and time limits
- Multi-language support (English vocabulary)

### 10.2 Analytics and Reporting

**Parent Dashboard Enhancements:**
- Weekly progress reports via email
- Detailed learning analytics
- Time spent analysis
- Difficulty progression tracking

**New Endpoints:**
- GET /api/reports/weekly/:profile_id
- GET /api/analytics/learning-patterns/:profile_id

### 10.3 Social Features (Optional)

**With Privacy Protections:**
- Friend profiles (no real names, avatar only)
- Anonymous leaderboards
- Collaborative challenges

**Note:** Requires careful COPPA compliance and parental consent.

---

## 11. Migration Path

### 11.1 Database Migrations

**Initial Migration (v1.0):**
```sql
-- Create ENUM types
CREATE TYPE vocabulary_category AS ENUM (...);

-- Create tables
CREATE TABLE profiles (...);
CREATE TABLE vocabulary (...);
CREATE TABLE user_progress (...);

-- Create indexes
CREATE INDEX idx_profiles_parent_id ...;

-- Create functions and triggers
CREATE FUNCTION get_next_words() ...;
CREATE TRIGGER check_profile_limit ...;

-- Create views
CREATE VIEW profile_stats AS ...;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_policy ...;
```

**Migration Best Practices:**
- Never drop columns (create new columns instead)
- Use transactions for multi-step migrations
- Test migrations on staging first
- Keep rollback scripts ready
- Document breaking changes

### 11.2 API Deprecation Policy

When deprecating endpoints:
1. Announce deprecation 3 months in advance
2. Add deprecation header: `X-API-Warn: "Deprecated, use /v2/endpoint instead"`
3. Continue support for 6 months
4. Remove after 6 months grace period

---

## 12. Appendix

### 12.1 Complete Endpoint Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /health | Health check | No |
| GET | /api/profiles | List all child profiles | Yes |
| POST | /api/profiles | Create child profile | Yes |
| GET | /api/profiles/:id | Get single profile | Yes |
| PATCH | /api/profiles/:id | Update profile | Yes |
| DELETE | /api/profiles/:id | Delete profile | Yes |
| GET | /api/profiles/:id/stats | Get profile statistics | Yes |
| GET | /api/profiles/:id/progress | Get detailed progress | Yes |
| GET | /api/profiles/:id/progress/categories | Get category progress | Yes |
| GET | /api/vocabulary | List vocabulary words | Yes |
| GET | /api/vocabulary/:id | Get single word | Yes |
| GET | /api/categories | List categories | Yes |
| POST | /api/game/sessions | Create game session | Yes |
| POST | /api/progress | Record/update progress | Yes |

### 12.2 Database Function Reference

**get_next_words()**
```sql
get_next_words(
  p_profile_id UUID,
  p_language_code VARCHAR DEFAULT 'pl',
  p_limit INTEGER DEFAULT 10,
  p_category vocabulary_category DEFAULT NULL
) RETURNS TABLE (...)
```

**Purpose:** Implements 80/20 algorithm for smart word selection
**Performance:** Optimized with indexes on user_progress

### 12.3 RLS Policy Reference

**profiles table:**
- SELECT: parent_id = auth.uid()
- INSERT: (new.parent_id = auth.uid())
- UPDATE: parent_id = auth.uid()
- DELETE: parent_id = auth.uid()

**user_progress table:**
- SELECT: profile_id IN (SELECT id FROM profiles WHERE parent_id = auth.uid())
- INSERT: Same as SELECT
- UPDATE: Same as SELECT
- DELETE: Same as SELECT

**vocabulary table:**
- SELECT: authenticated users only
- No INSERT/UPDATE/DELETE for regular users

### 12.4 HTTP Status Code Reference

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PATCH, POST (update) |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid input, validation failure |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist or no access |
| 409 | Conflict | Profile limit, last profile deletion |
| 422 | Unprocessable Entity | Business logic validation failure |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected error |
| 503 | Service Unavailable | Database or storage unavailable |

### 12.5 Environment Variables

**Required:**
```env
SUPABASE_URL=https://[project].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
DATABASE_URL=postgresql://...
```

**Optional:**
```env
NODE_ENV=development|production
API_VERSION=v1
LOG_LEVEL=info
ENABLE_CORS=true
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_ENABLED=false
```

---

## Summary

This REST API plan provides a comprehensive foundation for the "Match Picture to Word" educational game. The API is designed with:

✅ **Security:** JWT authentication, RLS policies, input validation  
✅ **Performance:** Database indexes, views, functions, caching strategies  
✅ **Scalability:** Pagination, versioning strategy, clear migration path  
✅ **Maintainability:** Clear separation of concerns, comprehensive validation  
✅ **User Experience:** Fast response times, clear error messages  
✅ **Privacy:** GDPR/COPPA compliance, minimal data collection  
✅ **Developer Experience:** RESTful design, consistent patterns, documentation

The API leverages Supabase's built-in features (Auth, RLS, Storage) to minimize custom implementation while maintaining full control over business logic. All endpoints are designed to meet PRD requirements and performance targets.