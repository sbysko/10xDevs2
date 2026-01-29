-- Create Test User for Local Development
--
-- This script creates a test parent user and sample child profiles
-- for testing the /profiles view
--
-- Usage:
-- 1. Open Supabase Studio: http://localhost:54323
-- 2. Go to SQL Editor
-- 3. Paste and run this script
--
-- OR run via CLI:
-- psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/create-test-user.sql

-- ============================================================================
-- STEP 1: Create test parent user in auth.users
-- ============================================================================

-- Insert test parent into auth.users
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
)
VALUES (
    '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid, -- Fixed UUID for testing
    '00000000-0000-0000-0000-000000000000'::uuid,
    'testparent@example.com',
    '$2a$10$rZ8qY8QxQxQxQxQxQxQxQuVlQRXKJ3yKZ8qY8QxQxQxQxQxQxQxQu', -- bcrypt hash for 'password123'
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"email": "testparent@example.com", "email_verified": true, "phone_verified": false, "sub": "9afae696-c49f-4b2e-b7b2-5f0be3901498"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Also insert into auth.identities for proper authentication
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    created_at,
    updated_at
)
VALUES (
    gen_random_uuid(),
    '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid,
    '{"sub": "9afae696-c49f-4b2e-b7b2-5f0be3901498", "email": "testparent@example.com", "email_verified": true}'::jsonb,
    'email',
    '9afae696-c49f-4b2e-b7b2-5f0be3901498',
    NOW(),
    NOW()
)
ON CONFLICT (provider, provider_id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create sample child profiles
-- ============================================================================

-- Insert 5 test profiles (to test the limit)
INSERT INTO public.profiles (id, parent_id, display_name, avatar_url, language_code)
VALUES
    (
        gen_random_uuid(),
        '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid,
        'Zosia',
        'avatars/avatar-1.svg',
        'pl'
    ),
    (
        gen_random_uuid(),
        '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid,
        'Janek',
        'avatars/avatar-2.svg',
        'pl'
    ),
    (
        gen_random_uuid(),
        '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid,
        'Ania',
        'avatars/avatar-3.svg',
        'pl'
    )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify user was created
DO $$
DECLARE
    user_count INTEGER;
    profile_count INTEGER;
BEGIN
    -- Count users
    SELECT COUNT(*) INTO user_count
    FROM auth.users
    WHERE email = 'testparent@example.com';

    -- Count profiles
    SELECT COUNT(*) INTO profile_count
    FROM public.profiles
    WHERE parent_id = '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid;

    -- Display results
    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ Test User Creation Complete!';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Test Parent Account:';
    RAISE NOTICE '  Email: testparent@example.com';
    RAISE NOTICE '  Password: password123';
    RAISE NOTICE '  Users created: %', user_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Child Profiles:';
    RAISE NOTICE '  Profiles created: %', profile_count;
    RAISE NOTICE '  Remaining slots: %', 5 - profile_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. Go to http://localhost:3000/profiles';
    RAISE NOTICE '  2. Login with testparent@example.com / password123';
    RAISE NOTICE '  3. Test adding new profiles (Parental Gate)';
    RAISE NOTICE '  4. Test profile selection and navigation';
    RAISE NOTICE '';
END $$;

-- Display created profiles
SELECT
    p.id,
    p.display_name,
    p.avatar_url,
    p.language_code,
    p.created_at
FROM public.profiles p
WHERE p.parent_id = '9afae696-c49f-4b2e-b7b2-5f0be3901498'::uuid
ORDER BY p.created_at DESC;
