/**
 * Unit Tests for useGameSession Hook
 *
 * Tests cover critical business logic:
 * - Stars calculation (3/2/1 based on attempts)
 * - Mastery state management (is_correct flag)
 * - Attempt counting and retry logic
 * - Answer recording and session completion
 *
 * Key Business Rules (from CLAUDE.md):
 * - 1st attempt correct: 3 stars
 * - 2nd attempt correct: 2 stars
 * - 3rd+ attempt correct: 1 star
 * - Incorrect: 0 stars (unlimited retries)
 * - is_mastered = true when answered correctly (remains true even if answered wrong later)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useGameSession } from './useGameSession';
import type { GameSessionDTO } from '@/types';

// ===================================================================
// MOCKS
// ===================================================================

// Mock Supabase browser client
vi.mock('@/lib/supabase-browser', () => ({
  getAccessToken: vi.fn(() => Promise.resolve('mock-token-123')),
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ===================================================================
// TEST DATA
// ===================================================================

const mockGameSession: GameSessionDTO = {
  session_id: 'session-123',
  profile_id: 'profile-456',
  word_count: 3,
  category: 'zwierzeta',
  words: [
    {
      id: 'word-1',
      word_text: 'Kot',
      category: 'zwierzeta',
      image_path: 'vocabulary/zwierzeta/kot.png',
    },
    {
      id: 'word-2',
      word_text: 'Pies',
      category: 'zwierzeta',
      image_path: 'vocabulary/zwierzeta/pies.png',
    },
    {
      id: 'word-3',
      word_text: 'Królik',
      category: 'zwierzeta',
      image_path: 'vocabulary/zwierzeta/krolik.png',
    },
  ],
};

// ===================================================================
// TEST SUITE: Stars Calculation Logic
// ===================================================================

describe('useGameSession - Stars Calculation Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful session creation
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGameSession,
    });
  });

  it('should award 3 stars for correct answer on 1st attempt', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    // Wait for session to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Arrange: Current word is "Kot"
    expect(result.current.currentWord?.word_text).toBe('Kot');
    expect(result.current.currentAttempts).toBe(0);

    // Act: Submit correct answer on first try
    act(() => {
      result.current.submitAnswer('Kot');
    });

    // Assert: 3 stars awarded, answer recorded
    expect(result.current.answers).toHaveLength(1);
    expect(result.current.answers[0]).toEqual({
      vocabulary_id: 'word-1',
      is_correct: true,
      attempt_number: 1,
      stars_earned: 3,
    });
    expect(result.current.currentAttempts).toBe(0); // Reset for next question
  });

  it('should award 2 stars for correct answer on 2nd attempt', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Arrange: Current word is "Kot"
    expect(result.current.currentWord?.word_text).toBe('Kot');

    // Act: Submit incorrect answer first
    act(() => {
      result.current.submitAnswer('Pies');
    });

    // Assert: Attempts incremented, no answer recorded
    expect(result.current.currentAttempts).toBe(1);
    expect(result.current.answers).toHaveLength(0);

    // Act: Submit correct answer on second try
    act(() => {
      result.current.submitAnswer('Kot');
    });

    // Assert: 2 stars awarded
    expect(result.current.answers).toHaveLength(1);
    expect(result.current.answers[0]).toEqual({
      vocabulary_id: 'word-1',
      is_correct: true,
      attempt_number: 2,
      stars_earned: 2,
    });
    expect(result.current.currentAttempts).toBe(0);
  });

  it('should award 1 star for correct answer on 3rd attempt', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Act: Submit 2 incorrect answers
    act(() => {
      result.current.submitAnswer('Pies');
    });
    act(() => {
      result.current.submitAnswer('Królik');
    });

    expect(result.current.currentAttempts).toBe(2);

    // Act: Submit correct answer on third try
    act(() => {
      result.current.submitAnswer('Kot');
    });

    // Assert: 1 star awarded
    expect(result.current.answers[0]).toEqual({
      vocabulary_id: 'word-1',
      is_correct: true,
      attempt_number: 3,
      stars_earned: 1,
    });
  });

  it('should award 1 star for correct answer on 4th+ attempt', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Act: Submit 3 incorrect answers
    act(() => {
      result.current.submitAnswer('Wrong1');
    });
    act(() => {
      result.current.submitAnswer('Wrong2');
    });
    act(() => {
      result.current.submitAnswer('Wrong3');
    });

    expect(result.current.currentAttempts).toBe(3);

    // Act: Submit correct answer on fourth try
    act(() => {
      result.current.submitAnswer('Kot');
    });

    // Assert: Still 1 star (minimum)
    expect(result.current.answers[0]).toEqual({
      vocabulary_id: 'word-1',
      is_correct: true,
      attempt_number: 4,
      stars_earned: 1,
    });
  });
});

// ===================================================================
// TEST SUITE: Attempt Counting and Retry Logic
// ===================================================================

describe('useGameSession - Attempt Counting', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGameSession,
    });
  });

  it('should increment attempts on incorrect answer', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.currentAttempts).toBe(0);

    // Act: Submit incorrect answers
    act(() => {
      result.current.submitAnswer('Wrong1');
    });
    expect(result.current.currentAttempts).toBe(1);

    act(() => {
      result.current.submitAnswer('Wrong2');
    });
    expect(result.current.currentAttempts).toBe(2);

    act(() => {
      result.current.submitAnswer('Wrong3');
    });
    expect(result.current.currentAttempts).toBe(3);
  });

  it('should reset attempts after correct answer', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Act: Submit incorrect then correct answer
    act(() => {
      result.current.submitAnswer('Wrong');
    });
    expect(result.current.currentAttempts).toBe(1);

    act(() => {
      result.current.submitAnswer('Kot');
    });

    // Assert: Attempts reset to 0
    expect(result.current.currentAttempts).toBe(0);
  });

  it('should reset attempts when moving to next question', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Act: Answer first question and move to next
    act(() => {
      result.current.submitAnswer('Kot');
    });

    act(() => {
      result.current.nextQuestion();
    });

    // Assert: Attempts reset for new question
    expect(result.current.currentAttempts).toBe(0);
    expect(result.current.currentQuestionIndex).toBe(1);
  });

  it('should allow unlimited retries (no limit on attempts)', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Act: Submit 10 incorrect answers
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.submitAnswer('Wrong');
      });
    }

    // Assert: All attempts counted, no error
    expect(result.current.currentAttempts).toBe(10);
    expect(result.current.answers).toHaveLength(0); // No correct answers yet

    // User can still submit correct answer
    act(() => {
      result.current.submitAnswer('Kot');
    });

    expect(result.current.answers).toHaveLength(1);
    expect(result.current.answers[0].stars_earned).toBe(1);
  });
});

// ===================================================================
// TEST SUITE: Answer Recording and Session Completion
// ===================================================================

describe('useGameSession - Answer Recording', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGameSession,
    });
  });

  it('should record all correct answers in sequence', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Answer all 3 questions correctly on first try
    act(() => {
      result.current.submitAnswer('Kot'); // Q1
    });
    act(() => {
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer('Pies'); // Q2
    });
    act(() => {
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer('Królik'); // Q3
    });

    // Assert: All answers recorded with correct data
    expect(result.current.answers).toHaveLength(3);

    expect(result.current.answers[0].vocabulary_id).toBe('word-1');
    expect(result.current.answers[0].stars_earned).toBe(3);

    expect(result.current.answers[1].vocabulary_id).toBe('word-2');
    expect(result.current.answers[1].stars_earned).toBe(3);

    expect(result.current.answers[2].vocabulary_id).toBe('word-3');
    expect(result.current.answers[2].stars_earned).toBe(3);
  });

  it('should mark session as complete after last question', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isComplete).toBe(false);

    // Answer questions 1 and 2
    act(() => {
      result.current.submitAnswer('Kot');
    });
    act(() => {
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer('Pies');
    });
    act(() => {
      result.current.nextQuestion();
    });

    expect(result.current.isComplete).toBe(false);

    // Answer last question
    act(() => {
      result.current.submitAnswer('Królik');
    });

    // Assert: Session marked as complete
    expect(result.current.isComplete).toBe(true);
  });

  it('should not accept answers after session is complete', async () => {
    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Complete all questions
    act(() => {
      result.current.submitAnswer('Kot');
    });
    act(() => {
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer('Pies');
    });
    act(() => {
      result.current.nextQuestion();
    });
    act(() => {
      result.current.submitAnswer('Królik');
    });

    expect(result.current.isComplete).toBe(true);
    expect(result.current.answers).toHaveLength(3);

    // Try to submit another answer
    act(() => {
      result.current.submitAnswer('Extra');
    });

    // Assert: No additional answers recorded
    expect(result.current.answers).toHaveLength(3);
  });
});

// ===================================================================
// TEST SUITE: Edge Cases
// ===================================================================

describe('useGameSession - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle session with only 1 question', async () => {
    const singleQuestionSession: GameSessionDTO = {
      ...mockGameSession,
      word_count: 1,
      words: [mockGameSession.words[0]],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => singleQuestionSession,
    });

    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalQuestions).toBe(1);

    // Answer the only question
    act(() => {
      result.current.submitAnswer('Kot');
    });

    // Assert: Session immediately complete
    expect(result.current.isComplete).toBe(true);
    expect(result.current.answers).toHaveLength(1);
  });

  it('should handle null profileId gracefully', async () => {
    const { result } = renderHook(() => useGameSession(null, 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error state set
    expect(result.current.error).toBe('Brak wybranego profilu');
    expect(result.current.session).toBeNull();
  });

  it('should preserve answer order across multiple attempts', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGameSession,
    });

    const { result } = renderHook(() => useGameSession('profile-456', 'zwierzeta'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Answer in specific order with different attempt counts
    act(() => {
      result.current.submitAnswer('Wrong');
    });
    act(() => {
      result.current.submitAnswer('Kot'); // 2 attempts
    });

    act(() => {
      result.current.nextQuestion();
    });

    act(() => {
      result.current.submitAnswer('Pies'); // 1 attempt
    });

    // Assert: Answers array preserves order
    expect(result.current.answers[0].vocabulary_id).toBe('word-1');
    expect(result.current.answers[0].attempt_number).toBe(2);

    expect(result.current.answers[1].vocabulary_id).toBe('word-2');
    expect(result.current.answers[1].attempt_number).toBe(1);
  });
});
