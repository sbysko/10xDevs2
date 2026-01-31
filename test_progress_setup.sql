-- ============================================================================
-- Test Setup for Progress Endpoint
-- ============================================================================
-- This creates test data for testing the POST /api/progress endpoint
--
-- Test User ID: 365689ec-aaba-43f6-b8ad-488f09dba54c (testparent@example.com)
-- ============================================================================

-- Create a test profile for the authenticated user
INSERT INTO profiles (parent_id, display_name, avatar_url, language_code)
VALUES
  ('365689ec-aaba-43f6-b8ad-488f09dba54c', 'Test Child', NULL, 'pl')
ON CONFLICT (id) DO NOTHING
RETURNING id, parent_id, display_name;

-- Show some vocabulary IDs for testing
SELECT id, word_text, category, difficulty_level
FROM vocabulary
WHERE language_code = 'pl'
  AND category = 'zwierzeta'
ORDER BY difficulty_level, word_text
LIMIT 10;
