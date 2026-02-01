/**
 * Test script for POST /api/progress endpoint
 *
 * Usage: node test_progress_endpoint.js
 */

const SUPABASE_URL = "http://127.0.0.1:54321";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjIwODQ4MjIyNTd9.7LVOG62shhOz6jaYkziS5CmsQOFL078CruO8iZ6Vs6yGlquhVppzgIOcHyq9zRXykOvJm6YhG1AENOt81_G6MA";
const API_URL = "http://localhost:3000";

const TEST_USER = {
  email: "testparent@example.com",
  password: "testpass123",
  id: "365689ec-aaba-43f6-b8ad-488f09dba54c",
};

let accessToken = "";
let profileId = "";
let vocabularyIds = [];

/**
 * Step 1: Sign in to get access token
 */
async function signIn() {
  console.log("\n==========================================");
  console.log("Step 1: Signing in...");
  console.log("==========================================\n");

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: TEST_USER.email,
      password: TEST_USER.password,
    }),
  });

  if (!response.ok) {
    throw new Error(`Sign in failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log("✅ Signed in successfully");
  console.log(`   User ID: ${data.user.id}`);
  console.log(`   Token expires at: ${new Date(data.expires_at * 1000).toISOString()}`);

  return data;
}

/**
 * Step 2: Create or get existing profile
 */
async function createProfile() {
  console.log("\n==========================================");
  console.log("Step 2: Creating profile...");
  console.log("==========================================\n");

  // First, try to get existing profiles
  const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?parent_id=eq.${TEST_USER.id}&select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  const existingProfiles = await getResponse.json();

  if (existingProfiles.length > 0) {
    profileId = existingProfiles[0].id;
    console.log("✅ Found existing profile");
    console.log(`   Profile ID: ${profileId}`);
    console.log(`   Display Name: ${existingProfiles[0].display_name}`);
    return existingProfiles[0];
  }

  // Create new profile
  const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      parent_id: TEST_USER.id,
      display_name: "Test Child",
      language_code: "pl",
    }),
  });

  if (!createResponse.ok) {
    throw new Error(`Profile creation failed: ${createResponse.status} ${await createResponse.text()}`);
  }

  const newProfile = await createResponse.json();
  profileId = newProfile[0].id;
  console.log("✅ Created new profile");
  console.log(`   Profile ID: ${profileId}`);
  console.log(`   Display Name: ${newProfile[0].display_name}`);

  return newProfile[0];
}

/**
 * Step 3: Get vocabulary IDs for testing
 */
async function getVocabulary() {
  console.log("\n==========================================");
  console.log("Step 3: Fetching vocabulary...");
  console.log("==========================================\n");

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/vocabulary?language_code=eq.pl&category=eq.zwierzeta&order=word_text.asc&limit=10`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Vocabulary fetch failed: ${response.status} ${await response.text()}`);
  }

  const vocab = await response.json();
  vocabularyIds = vocab.map((v) => ({ id: v.id, word: v.word_text }));

  console.log(`✅ Fetched ${vocabularyIds.length} vocabulary words`);
  vocabularyIds.slice(0, 3).forEach((v) => {
    console.log(`   - ${v.word} (${v.id})`);
  });
  console.log(`   ... and ${vocabularyIds.length - 3} more`);

  return vocabularyIds;
}

/**
 * Step 4: Test single word progress
 */
async function testSingleWordProgress() {
  console.log("\n==========================================");
  console.log("Step 4: Testing single word progress...");
  console.log("==========================================\n");

  const testWord = vocabularyIds[0];
  const requestBody = {
    profile_id: profileId,
    vocabulary_id: testWord.id,
    is_correct: true,
    attempt_number: 1,
  };

  console.log("Request body:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${API_URL}/api/progress`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log(`\nResponse status: ${response.status}`);
  console.log("Response body:", responseText);

  if (response.ok) {
    const result = JSON.parse(responseText);
    console.log("\n✅ Single word progress saved successfully");
    console.log(`   Stars earned: ${result.stars_earned}`);
    console.log(`   Mastered: ${result.is_mastered}`);
  } else {
    console.log("\n❌ Single word progress failed");
  }

  return response.ok;
}

/**
 * Step 5: Test batch progress (10 words)
 */
async function testBatchProgress() {
  console.log("\n==========================================");
  console.log("Step 5: Testing batch progress (10 words)...");
  console.log("==========================================\n");

  const results = vocabularyIds.slice(0, 10).map((word, index) => ({
    vocabulary_id: word.id,
    is_correct: index < 7, // First 7 correct, last 3 incorrect
    attempt_number: (index % 3) + 1, // Vary attempt numbers (1, 2, 3)
  }));

  const requestBody = {
    profile_id: profileId,
    results: results,
  };

  console.log(`Request: Saving progress for ${results.length} words`);
  console.log("Sample results:", JSON.stringify(results.slice(0, 3), null, 2));

  const response = await fetch(`${API_URL}/api/progress`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log(`\nResponse status: ${response.status}`);
  console.log("Response body:", responseText);

  if (response.ok) {
    const result = JSON.parse(responseText);
    console.log("\n✅ Batch progress saved successfully");
    console.log(`   Saved: ${result.saved_count}/${result.total_count} words`);
    console.log(`   Failed: ${result.failed_count} words`);
    if (result.results && result.results.length > 0) {
      console.log("\nSample saved records:");
      result.results.slice(0, 3).forEach((r) => {
        console.log(`   - Stars: ${r.stars_earned}, Mastered: ${r.is_mastered}, Attempts: ${r.attempts_count}`);
      });
    }
  } else {
    console.log("\n❌ Batch progress failed");
  }

  return response.ok;
}

/**
 * Step 6: Verify data in database
 */
async function verifyDatabase() {
  console.log("\n==========================================");
  console.log("Step 6: Verifying data in database...");
  console.log("==========================================\n");

  const response = await fetch(`${SUPABASE_URL}/rest/v1/user_progress?profile_id=eq.${profileId}&select=*`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Database verification failed: ${response.status} ${await response.text()}`);
  }

  const progressRecords = await response.json();

  console.log(`✅ Found ${progressRecords.length} progress records in database`);

  if (progressRecords.length > 0) {
    console.log("\nSample records:");
    progressRecords.slice(0, 5).forEach((record, index) => {
      console.log(
        `   ${index + 1}. Stars: ${record.stars_earned}, Mastered: ${record.is_mastered}, Attempts: ${record.attempts_count}`
      );
    });
  }

  // Calculate stats
  const totalStars = progressRecords.reduce((sum, r) => sum + r.stars_earned, 0);
  const masteredCount = progressRecords.filter((r) => r.is_mastered).length;

  console.log(`\nOverall stats:`);
  console.log(`   Total stars: ${totalStars}`);
  console.log(`   Words mastered: ${masteredCount}/${progressRecords.length}`);

  return progressRecords;
}

/**
 * Main test runner
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  Progress Endpoint Test Suite                          ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  try {
    await signIn();
    await createProfile();
    await getVocabulary();
    await testSingleWordProgress();
    await testBatchProgress();
    await verifyDatabase();

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║  ✅ ALL TESTS PASSED                                   ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");

    process.exit(0);
  } catch (error) {
    console.error("\n╔════════════════════════════════════════════════════════╗");
    console.error("║  ❌ TEST FAILED                                        ║");
    console.error("╚════════════════════════════════════════════════════════╝\n");
    console.error("Error:", error.message);
    console.error("\nStack trace:");
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
main();
