# Test Guide: POST /api/profiles Endpoint

## Prerequisites

1. **Supabase Project Setup:**
   - Ensure your Supabase project is configured
   - Database migration applied (20260126120000_initial_schema_setup.sql)
   - RLS policies enabled on profiles table
   - Trigger `check_profile_limit` active

2. **Environment Variables:**
   ```env
   PUBLIC_SUPABASE_URL=your_supabase_project_url
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Authenticated User:**
   - Register a test parent account in Supabase
   - Obtain JWT token from authentication

## Getting JWT Token

### Option 1: Using Supabase Dashboard
1. Go to Supabase Dashboard → Authentication → Users
2. Click on your test user
3. Copy the JWT token from session details

### Option 2: Programmatically (TypeScript)
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.PUBLIC_SUPABASE_URL!,
  process.env.PUBLIC_SUPABASE_ANON_KEY!
);

const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'your-password'
});

console.log('JWT Token:', data.session?.access_token);
```

## Test Cases

### Test 1: Success - Create Profile with All Fields

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria Anna",
    "avatar_url": "avatars/avatar-3.png",
    "language_code": "en"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "parent_id": "parent-uuid-from-jwt",
  "display_name": "Maria Anna",
  "avatar_url": "avatars/avatar-3.png",
  "language_code": "en",
  "created_at": "2026-01-27T10:00:00Z",
  "updated_at": "2026-01-27T10:00:00Z"
}
```

---

### Test 2: Success - Minimal Data (Defaults Applied)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Jan"
  }'
```

**Expected Response (201 Created):**
```json
{
  "id": "...",
  "parent_id": "...",
  "display_name": "Jan",
  "avatar_url": null,
  "language_code": "pl",
  "created_at": "...",
  "updated_at": "..."
}
```

---

### Test 3: Error - Missing Authorization Header (401)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "unauthorized",
  "message": "Authentication required"
}
```

---

### Test 4: Error - Invalid Token (401)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer invalid_token_12345" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria"
  }'
```

**Expected Response (401 Unauthorized):**
```json
{
  "error": "unauthorized",
  "message": "Invalid or expired token"
}
```

---

### Test 5: Error - Invalid JSON (400)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria",
    invalid json here
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "validation_error",
  "message": "Invalid JSON in request body",
  "field": "body"
}
```

---

### Test 6: Error - Display Name Too Short (400)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "M"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "validation_error",
  "message": "Display name must be at least 2 characters",
  "field": "display_name"
}
```

---

### Test 7: Error - Display Name Too Long (400)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "This is a very long name that exceeds the maximum allowed length of fifty characters for display names"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "validation_error",
  "message": "Display name must be at most 50 characters",
  "field": "display_name"
}
```

---

### Test 8: Error - Invalid Characters in Display Name (400)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria123!@#"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "validation_error",
  "message": "Display name must contain only letters and spaces",
  "field": "display_name"
}
```

---

### Test 9: Error - Invalid Avatar URL Pattern (400)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria",
    "avatar_url": "invalid-path/avatar.png"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "validation_error",
  "message": "Avatar must be one of the predefined options (avatar-1 to avatar-8)",
  "field": "avatar_url"
}
```

---

### Test 10: Error - Invalid Language Code (400)

```bash
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Maria",
    "language_code": "de"
  }'
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "validation_error",
  "message": "Language must be 'pl' or 'en'",
  "field": "language_code"
}
```

---

### Test 11: Error - Profile Limit Exceeded (409)

**Prerequisites:** Create 5 profiles for your test user first

```bash
# Create 6th profile (should fail)
curl -X POST http://localhost:3000/api/profiles \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "display_name": "Sixth Profile"
  }'
```

**Expected Response (409 Conflict):**
```json
{
  "error": "profile_limit_exceeded",
  "message": "Maximum number of profiles is 5. Please delete an existing profile first.",
  "current_count": 5,
  "max_allowed": 5
}
```

---

## Verification Steps

### 1. Check Database

After successful profile creation, verify in Supabase:

```sql
SELECT
  id,
  parent_id,
  display_name,
  avatar_url,
  language_code,
  created_at,
  updated_at
FROM profiles
WHERE parent_id = 'YOUR_PARENT_ID'
ORDER BY created_at DESC;
```

### 2. Verify RLS Policy

Test that RLS prevents unauthorized access:

```sql
-- This should fail if RLS is working correctly
SET request.jwt.claims = '{"sub": "different-user-id"}';

INSERT INTO profiles (parent_id, display_name)
VALUES ('original-user-id', 'Unauthorized Profile');

-- Expected: ERROR - new row violates row-level security policy
```

### 3. Check Profile Count

```sql
SELECT COUNT(*) as profile_count
FROM profiles
WHERE parent_id = 'YOUR_PARENT_ID';
```

### 4. Test Profile Limit Trigger

If you have 5 profiles, try to insert a 6th directly:

```sql
INSERT INTO profiles (parent_id, display_name)
VALUES ('your-user-id', 'Sixth Profile');

-- Expected: ERROR - Rodzic może mieć maksymalnie 5 profili dzieci
```

---

## Troubleshooting

### "Authentication required" despite valid token

**Possible causes:**
- Token expired (default: 1 hour)
- Token format incorrect (missing "Bearer " prefix)
- Token from different Supabase project

**Solution:**
```bash
# Check token format
echo "Bearer YOUR_TOKEN" | cat -A

# Refresh token
# Use Supabase client to get a fresh token
```

### "Profile limit exceeded" with < 5 profiles

**Possible causes:**
- Soft-deleted profiles still count (if using soft delete)
- Trigger counting profiles for wrong parent_id

**Solution:**
```sql
-- Check actual count
SELECT COUNT(*) FROM profiles WHERE parent_id = 'YOUR_PARENT_ID';

-- Inspect trigger function
SELECT proname, prosrc FROM pg_proc WHERE proname = 'check_profile_limit';
```

### Response time > 500ms

**Possible causes:**
- Missing index on profiles.parent_id
- Database in different region than API

**Solution:**
```sql
-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'profiles';

-- Check query performance
EXPLAIN ANALYZE
SELECT COUNT(*) FROM profiles WHERE parent_id = 'uuid';
```

---

## Performance Benchmarks

Expected response times (from PRD):
- **Target:** < 200ms for profile creation
- **p50:** ~150ms
- **p95:** < 250ms
- **p99:** < 400ms

Use tools like:
- `curl -w "@curl-format.txt"`
- Apache Bench: `ab -n 100 -c 10`
- Vercel Analytics (production)
