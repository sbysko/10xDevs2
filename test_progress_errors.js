/**
 * Test error cases for POST /api/progress endpoint
 */

const API_URL = "http://localhost:3000";
const VALID_PROFILE_ID = "cf85fdf1-5aba-4094-b174-53fd5a33e144";
const VALID_VOCAB_ID = "215a6e88-8abc-4c18-8b8c-b19f2ca9177d";
const VALID_TOKEN =
  "eyJhbGciOiJFUzI1NiIsImtpZCI6ImI4MTI2OWYxLTIxZDgtNGYyZS1iNzE5LWMyMjQwYTg0MGQ5MCIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJzdWIiOiIzNjU2ODllYy1hYWJhLTQzZjYtYjhhZC00ODhmMDlkYmE1NGMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzY5ODk0NjYzLCJpYXQiOjE3Njk4OTEwNjMsImVtYWlsIjoidGVzdHBhcmVudEBleGFtcGxlLmNvbSIsInBob25lIjoiIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZW1haWwiLCJwcm92aWRlcnMiOlsiZW1haWwiXX0sInVzZXJfbWV0YWRhdGEiOnsiZW1haWwiOiJ0ZXN0cGFyZW50QGV4YW1wbGUuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwic3ViIjoiMzY1Njg5ZWMtYWFiYS00M2Y2LWI4YWQtNDg4ZjA5ZGJhNTRjIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Njk4OTEwNjN9XSwic2Vzc2lvbl9pZCI6ImFmOTkyNWExLTEzNDUtNGU2Ni1iOWFlLTY3MTE0YzQ1Y2NkZiIsImlzX2Fub255bW91cyI6ZmFsc2V9.qdVo2kApvjAOVcuS-LojCF0rKsj2EN6cj2IAQi9-F-s51ISsRUHdfvUV2V_xKKqpME4pksEk82w3jMljFYhiEw";

async function testErrorCase(testName, requestConfig, expectedStatus) {
  console.log(`\nTesting: ${testName}`);
  console.log("─".repeat(60));

  try {
    const response = await fetch(`${API_URL}/api/progress`, requestConfig);
    const body = await response.text();

    const statusMatch = response.status === expectedStatus;
    const icon = statusMatch ? "✅" : "❌";

    console.log(`${icon} Status: ${response.status} (expected: ${expectedStatus})`);
    console.log(`   Response: ${body.substring(0, 150)}${body.length > 150 ? "..." : ""}`);

    return statusMatch;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║  Progress Endpoint Error Tests                         ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  const results = [];

  // Test 1: 401 Unauthorized - No token
  results.push(
    await testErrorCase(
      "401 Unauthorized - No token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: VALID_PROFILE_ID,
          vocabulary_id: VALID_VOCAB_ID,
          is_correct: true,
          attempt_number: 1,
        }),
      },
      401
    )
  );

  // Test 2: 401 Unauthorized - Invalid token
  results.push(
    await testErrorCase(
      "401 Unauthorized - Invalid token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid_token_here",
        },
        body: JSON.stringify({
          profile_id: VALID_PROFILE_ID,
          vocabulary_id: VALID_VOCAB_ID,
          is_correct: true,
          attempt_number: 1,
        }),
      },
      401
    )
  );

  // Test 3: 400 Bad Request - Invalid UUID format
  results.push(
    await testErrorCase(
      "400 Bad Request - Invalid profile UUID",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: JSON.stringify({
          profile_id: "not-a-uuid",
          vocabulary_id: VALID_VOCAB_ID,
          is_correct: true,
          attempt_number: 1,
        }),
      },
      400
    )
  );

  // Test 4: 400 Bad Request - Attempt number > 10
  results.push(
    await testErrorCase(
      "400 Bad Request - Attempt number > 10",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: JSON.stringify({
          profile_id: VALID_PROFILE_ID,
          vocabulary_id: VALID_VOCAB_ID,
          is_correct: true,
          attempt_number: 15,
        }),
      },
      400
    )
  );

  // Test 5: 400 Bad Request - Batch too large (> 20 words)
  const tooManyResults = Array(25).fill({
    vocabulary_id: VALID_VOCAB_ID,
    is_correct: true,
    attempt_number: 1,
  });

  results.push(
    await testErrorCase(
      "400 Bad Request - Batch size > 20",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: JSON.stringify({
          profile_id: VALID_PROFILE_ID,
          results: tooManyResults,
        }),
      },
      400
    )
  );

  // Test 6: 403 Forbidden - Profile belongs to different user
  // (Would need another user's profile ID to test properly)
  results.push(
    await testErrorCase(
      "403/404 Forbidden - Non-existent profile",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: JSON.stringify({
          profile_id: "00000000-0000-0000-0000-000000000000",
          vocabulary_id: VALID_VOCAB_ID,
          is_correct: true,
          attempt_number: 1,
        }),
      },
      403 // Could also be 404
    )
  );

  // Test 7: 404 Not Found - Invalid vocabulary ID
  results.push(
    await testErrorCase(
      "404 Not Found - Invalid vocabulary ID",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: JSON.stringify({
          profile_id: VALID_PROFILE_ID,
          vocabulary_id: "00000000-0000-0000-0000-000000000000",
          is_correct: true,
          attempt_number: 1,
        }),
      },
      404
    )
  );

  // Test 8: 400 Bad Request - Missing required field
  results.push(
    await testErrorCase(
      "400 Bad Request - Missing is_correct field",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: JSON.stringify({
          profile_id: VALID_PROFILE_ID,
          vocabulary_id: VALID_VOCAB_ID,
          attempt_number: 1,
        }),
      },
      400
    )
  );

  // Summary
  console.log("\n╔════════════════════════════════════════════════════════╗");
  const passedCount = results.filter((r) => r).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  if (allPassed) {
    console.log("║  ✅ ALL ERROR TESTS PASSED                             ║");
  } else {
    console.log(`║  ⚠️  SOME TESTS FAILED: ${passedCount}/${totalCount} passed               ║`);
  }
  console.log("╚════════════════════════════════════════════════════════╝\n");

  process.exit(allPassed ? 0 : 1);
}

main();
