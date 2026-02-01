# Testing Guide - Dopasuj Obrazek do Słowa

## Quick Start

### Problem z Vitest 4.x na Windows ⚠️

Obecnie testy nie uruchamiają się z powodu known issue z Vitest 4.0.18 na Windows.

**Szybkie rozwiązanie:**
```bash
# Downgrade to stable Vitest 3.x
npm install --save-dev vitest@^3.3.0 @vitest/ui@^3.3.0
npm run test
```

### Uruchomienie testów (gdy działają)

```bash
# Watch mode (development)
npm run test

# Run once (CI/CD)
npm run test:run

# With UI
npm run test:ui

# With coverage
npm run test:coverage
```

## Struktura testów

```
src/
├── components/hooks/
│   ├── useGameSession.test.ts         (20+ tests)
│   ├── useProfilesManager.test.ts     (18+ tests)
│   └── useProgressStats.test.ts       (16+ tests)
└── lib/validation/
    └── profile.schemas.test.ts        (35+ tests)
```

## Co jest przetestowane

### 1. useGameSession (Logika gry)

✅ **Stars calculation** (3/2/1 za 1/2/3+ próbę)
✅ **Attempts counting** (unlimited retries)
✅ **Mastery state** (is_mastered = true przy poprawnej odpowiedzi)
✅ **Answer recording** (wszystkie odpowiedzi zapisane)
✅ **Session completion** (is_complete po ostatnim pytaniu)

**Przykładowy test:**
```typescript
it('should award 3 stars for correct answer on 1st attempt', async () => {
  // Arrange
  const { result } = renderHook(() => useGameSession('profile-id', 'zwierzeta'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // Act
  act(() => {
    result.current.submitAnswer('Kot');
  });

  // Assert
  expect(result.current.answers[0]).toEqual({
    vocabulary_id: 'word-1',
    is_correct: true,
    attempt_number: 1,
    stars_earned: 3,
  });
});
```

### 2. useProfilesManager (Zarządzanie profilami)

✅ **Profile limit** (max 5 profili enforced)
✅ **CRUD operations** (create, read, list)
✅ **Modal state management**
✅ **Error handling** (401, 500, network errors)

**Przykładowy test:**
```typescript
it('should block adding profile when count = 5', async () => {
  // Arrange: 5 profiles already exist
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fiveProfiles });
  const { result } = renderHook(() => useProfilesManager());
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // Act: Try to add 6th profile
  act(() => {
    result.current.openParentalGate();
  });

  // Assert: Blocked with error
  expect(result.current.activeModal).toBe('none');
  expect(result.current.error).toBe('Osiągnięto maksymalną liczbę profili (5)');
});
```

### 3. useProgressStats (Dashboard statystyk)

✅ **Mastery percentage** (0%, 50%, 100% edge cases)
✅ **Total stars aggregation**
✅ **Category progress**
✅ **Profile selection**
✅ **Parallel data loading** (performance)

**Przykładowy test:**
```typescript
it('should calculate mastery percentage correctly for 100%', async () => {
  // Arrange
  const fullMasteryStats = {
    profile_id: 'profile-1',
    total_stars: 750,
    words_mastered: 250,
    mastery_percentage: 100.0,
    total_words_attempted: 250,
  };
  mockFetch.mockResolvedValueOnce({ ok: true, json: async () => fullMasteryStats });

  // Act
  const { result } = renderHook(() => useProgressStats('profile-1'));
  await waitFor(() => expect(result.current.isLoading).toBe(false));

  // Assert
  expect(result.current.stats?.mastery_percentage).toBe(100.0);
  expect(result.current.stats?.words_mastered).toBe(250);
});
```

### 4. profile.schemas (Walidacja Zod)

✅ **display_name** (2-50 znaków, tylko litery i spacje)
✅ **avatar_url** (pattern: avatars/avatar-[1-8].svg)
✅ **language_code** (pl/en, default: pl)
✅ **Security** (XSS, SQL injection, path traversal)

**Przykładowy test:**
```typescript
it('should prevent path traversal via avatar_url', () => {
  const pathTraversalAttempts = [
    '../../../etc/passwd',
    'avatars/../../../etc/passwd',
  ];

  pathTraversalAttempts.forEach((malicious) => {
    const result = CreateProfileSchema.safeParse({
      display_name: 'Maria',
      avatar_url: malicious,
    });

    expect(result.success).toBe(false);
  });
});
```

## Coverage Targets

```
Lines:      > 70%
Functions:  > 70%
Branches:   > 65%
Statements: > 70%
```

## Test Patterns

### Arrange-Act-Assert
```typescript
it('should do something', () => {
  // Arrange: Setup test data
  const input = { ... };

  // Act: Execute function under test
  const result = functionUnderTest(input);

  // Assert: Verify result
  expect(result).toBe(expected);
});
```

### Async Testing
```typescript
it('should handle async operation', async () => {
  const { result } = renderHook(() => useCustomHook());

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.data).toBeDefined();
});
```

### Mocking Fetch
```typescript
beforeEach(() => {
  vi.clearAllMocks();

  mockFetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: async () => mockData,
  });
});
```

## Debugging Tests

### Enable console output
```typescript
// Temporarily remove console mocks in src/test/setup.ts
// Comment out lines with vi.fn() for console.log, console.debug
```

### Run specific test
```bash
npm run test -- --reporter=verbose specific.test.ts
```

### Use test.only for single test
```typescript
it.only('should test this specific case', () => {
  // This test will run alone
});
```

## CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:coverage
```

## Known Issues & Solutions

### Issue: "No test suite found" on Windows
**Solution:** Downgrade to Vitest 3.x or use WSL2

### Issue: Tests timeout
**Solution:** Increase timeout in vitest.config.ts
```typescript
test: {
  testTimeout: 20000, // 20 seconds
}
```

### Issue: Import errors with @/ alias
**Solution:** Check path resolution in vitest.config.ts
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Project Test Summary](./.ai/unit-tests-implementation-summary.md)
- [Test Selection Rationale](./.ai/unit-test-choice.md)

## Contributing Tests

1. Follow AAA pattern (Arrange-Act-Assert)
2. Write descriptive test names
3. Test edge cases
4. Mock external dependencies
5. Keep tests isolated and independent
6. Run `npm run test:coverage` before committing
