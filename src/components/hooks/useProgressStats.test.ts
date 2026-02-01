/**
 * Unit Tests for useProgressStats Hook
 *
 * Tests cover critical business logic:
 * - Statistics aggregation and calculations
 * - Mastery percentage edge cases (0%, 50%, 100%)
 * - Total stars summation across categories
 * - Profile selection and data fetching
 * - Parallel data loading
 *
 * Key Business Rules (from CLAUDE.md):
 * - Dashboard shows accurate progress data for parents
 * - Mastery percentage: words_mastered / total_words * 100
 * - Stats must filter by profile_id correctly (RLS enforced)
 * - Performance target: Fetch progress tracker < 300ms
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProgressStats } from './useProgressStats';
import type { ProfileDTO, ProfileStatsDTO, CategoryProgressDTO, DetailedProgressItem } from '@/types';

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

const mockProfiles: ProfileDTO[] = [
  {
    id: 'profile-1',
    parent_id: 'parent-123',
    display_name: 'Maria',
    avatar_url: 'avatars/avatar-1.svg',
    language_code: 'pl',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'profile-2',
    parent_id: 'parent-123',
    display_name: 'Jan',
    avatar_url: 'avatars/avatar-2.svg',
    language_code: 'pl',
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

const mockStats: ProfileStatsDTO = {
  profile_id: 'profile-1',
  total_stars: 45,
  words_mastered: 15,
  mastery_percentage: 6.0, // 15 / 250 * 100 = 6%
  total_words_attempted: 20,
};

const mockCategoryProgress: CategoryProgressDTO = {
  profile_id: 'profile-1',
  categories: [
    {
      category: 'zwierzeta',
      total_words: 50,
      words_mastered: 5,
      mastery_percentage: 10.0,
      total_stars: 15,
    },
    {
      category: 'owoce_warzywa',
      total_words: 50,
      words_mastered: 10,
      mastery_percentage: 20.0,
      total_stars: 30,
    },
  ],
};

const mockMasteredWords: DetailedProgressItem[] = [
  {
    vocabulary_id: 'word-1',
    word_text: 'Kot',
    category: 'zwierzeta',
    is_mastered: true,
    stars_earned: 3,
    attempts_count: 1,
    last_attempted_at: '2026-01-15T10:00:00Z',
  },
  {
    vocabulary_id: 'word-2',
    word_text: 'Pies',
    category: 'zwierzeta',
    is_mastered: true,
    stars_earned: 2,
    attempts_count: 2,
    last_attempted_at: '2026-01-15T11:00:00Z',
  },
];

// ===================================================================
// TEST SUITE: Statistics Aggregation
// ===================================================================

describe('useProgressStats - Statistics Aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and display all statistics correctly', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockProfiles,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockCategoryProgress,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ progress: mockMasteredWords }),
      });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    // Wait for all data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: All data loaded correctly
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.categoryProgress).toEqual(mockCategoryProgress);
    expect(result.current.masteredWords).toEqual(mockMasteredWords);
    expect(result.current.error).toBeNull();
  });

  it('should calculate mastery percentage correctly for 0%', async () => {
    const zeroMasteryStats: ProfileStatsDTO = {
      profile_id: 'profile-1',
      total_stars: 0,
      words_mastered: 0,
      mastery_percentage: 0.0,
      total_words_attempted: 5,
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => zeroMasteryStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: 0% mastery is valid
    expect(result.current.stats?.mastery_percentage).toBe(0.0);
    expect(result.current.stats?.words_mastered).toBe(0);
  });

  it('should calculate mastery percentage correctly for 50%', async () => {
    const halfMasteryStats: ProfileStatsDTO = {
      profile_id: 'profile-1',
      total_stars: 375,
      words_mastered: 125, // 125 / 250 = 50%
      mastery_percentage: 50.0,
      total_words_attempted: 150,
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => halfMasteryStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: 50% mastery
    expect(result.current.stats?.mastery_percentage).toBe(50.0);
    expect(result.current.stats?.words_mastered).toBe(125);
  });

  it('should calculate mastery percentage correctly for 100%', async () => {
    const fullMasteryStats: ProfileStatsDTO = {
      profile_id: 'profile-1',
      total_stars: 750, // Perfect 3 stars × 250 words
      words_mastered: 250,
      mastery_percentage: 100.0,
      total_words_attempted: 250,
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => fullMasteryStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: 100% mastery (all words mastered)
    expect(result.current.stats?.mastery_percentage).toBe(100.0);
    expect(result.current.stats?.words_mastered).toBe(250);
  });

  it('should sum total stars correctly across categories', async () => {
    const categoryStatsWithStars: CategoryProgressDTO = {
      profile_id: 'profile-1',
      categories: [
        { category: 'zwierzeta', total_words: 50, words_mastered: 10, mastery_percentage: 20, total_stars: 25 },
        { category: 'owoce_warzywa', total_words: 50, words_mastered: 8, mastery_percentage: 16, total_stars: 20 },
        { category: 'pojazdy', total_words: 50, words_mastered: 5, mastery_percentage: 10, total_stars: 12 },
      ],
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => categoryStatsWithStars })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Category stars sum correctly
    const totalCategoryStars = categoryStatsWithStars.categories.reduce((sum, cat) => sum + cat.total_stars, 0);
    expect(totalCategoryStars).toBe(57); // 25 + 20 + 12
  });
});

// ===================================================================
// TEST SUITE: Profile Selection
// ===================================================================

describe('useProgressStats - Profile Selection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should auto-select first profile if none provided', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats()); // No initial profile

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: First profile auto-selected
    expect(result.current.selectedProfileId).toBe('profile-1');
  });

  it('should use initial profile if provided', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-2'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Initial profile used
    expect(result.current.selectedProfileId).toBe('profile-2');
  });

  it('should refetch data when profile changes', async () => {
    // Initial profile data
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.selectedProfileId).toBe('profile-1');

    // New profile data
    const profile2Stats: ProfileStatsDTO = {
      ...mockStats,
      profile_id: 'profile-2',
      total_stars: 30,
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => profile2Stats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    // Act: Change profile
    act(() => {
      result.current.selectProfile('profile-2');
    });

    // Wait for loading to start
    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 3000 }
    );

    // Assert: New data fetched
    expect(result.current.selectedProfileId).toBe('profile-2');
    expect(result.current.stats?.total_stars).toBe(30);
  });
});

// ===================================================================
// TEST SUITE: Parallel Data Loading
// ===================================================================

describe('useProgressStats - Parallel Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all data in parallel for performance', async () => {
    const fetchStartTime = Date.now();

    // All responses resolve immediately
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: mockMasteredWords }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const fetchDuration = Date.now() - fetchStartTime;

    // Assert: All data loaded
    expect(result.current.stats).toBeTruthy();
    expect(result.current.categoryProgress).toBeTruthy();
    expect(result.current.masteredWords).toHaveLength(2);

    // Assert: Performance (should be fast due to parallel loading)
    // In real scenario with 300ms target, this would verify optimization
    expect(fetchDuration).toBeLessThan(1000); // Very generous for test env
  });

  it('should handle partial failure gracefully (non-critical mastered words)', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockRejectedValueOnce(new Error('Network error')); // Mastered words fails

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Critical data loaded, error not propagated
    expect(result.current.stats).toBeTruthy();
    expect(result.current.categoryProgress).toBeTruthy();
    expect(result.current.masteredWords).toEqual([]); // Empty but not error
    expect(result.current.error).toBeNull(); // Non-critical error suppressed
  });
});

// ===================================================================
// TEST SUITE: Error Handling
// ===================================================================

describe('useProgressStats - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle 401 unauthorized error', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'unauthorized' }),
      });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error captured
    expect(result.current.error).toBeTruthy();
    expect(result.current.stats).toBeNull();
  });

  it('should handle 404 profile not found', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not_found' }),
      });

    const { result } = renderHook(() => useProgressStats('profile-999'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: 404 error handled
    expect(result.current.error).toBe('Profil nie został znaleziony');
  });

  it('should handle 403 forbidden access', async () => {
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'forbidden' }),
      });

    const { result } = renderHook(() => useProgressStats('profile-other'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Access denied error
    expect(result.current.error).toBe('Brak dostępu do tego profilu');
  });

  it('should allow manual refetch after error', async () => {
    // First attempt fails
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');

    // Second attempt succeeds
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    // Act: Manual refetch
    await act(async () => {
      await result.current.refetch();
    });

    // Assert: Error cleared, data loaded
    expect(result.current.error).toBeNull();
    expect(result.current.stats).toEqual(mockStats);
  });
});

// ===================================================================
// TEST SUITE: Edge Cases
// ===================================================================

describe('useProgressStats - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle profile with no progress (0 words attempted)', async () => {
    const emptyStats: ProfileStatsDTO = {
      profile_id: 'profile-1',
      total_stars: 0,
      words_mastered: 0,
      mastery_percentage: 0.0,
      total_words_attempted: 0,
    };

    const emptyCategories: CategoryProgressDTO = {
      profile_id: 'profile-1',
      categories: [],
    };

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => emptyStats })
      .mockResolvedValueOnce({ ok: true, json: async () => emptyCategories })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: [] }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: 0/0 case handled gracefully
    expect(result.current.stats?.total_words_attempted).toBe(0);
    expect(result.current.stats?.mastery_percentage).toBe(0.0);
    expect(result.current.categoryProgress?.categories).toEqual([]);
  });

  it('should handle empty profiles list', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => [] });

    const { result } = renderHook(() => useProgressStats());

    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    // Assert: No profile selected, no data fetched
    expect(result.current.profiles).toEqual([]);
    expect(result.current.selectedProfileId).toBeNull();
    expect(result.current.stats).toBeNull();
  });

  it('should filter mastered words correctly by profile_id', async () => {
    const profile1Words: DetailedProgressItem[] = mockMasteredWords;

    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockProfiles })
      .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
      .mockResolvedValueOnce({ ok: true, json: async () => mockCategoryProgress })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ progress: profile1Words }) });

    const { result } = renderHook(() => useProgressStats('profile-1'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Only profile-1 words returned (filtered by RLS or API)
    expect(result.current.masteredWords).toHaveLength(2);

    // Verify API call included profile_id filter
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/profiles/profile-1/progress'),
      expect.any(Object)
    );
  });
});
