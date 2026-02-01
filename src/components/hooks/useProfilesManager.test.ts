/**
 * Unit Tests for useProfilesManager Hook
 *
 * Tests cover critical business logic:
 * - Profile fetching and state management
 * - Profile limit enforcement (max 5)
 * - Profile creation and list updates
 * - Modal state management
 * - Error handling and recovery
 *
 * Key Business Rules (from CLAUDE.md):
 * - Max 5 child profiles per parent account (DB trigger enforced)
 * - Cannot delete last remaining profile (prevent orphaned accounts)
 * - RLS ensures parent can only access their own children
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useProfilesManager } from "./useProfilesManager";
import type { ProfileDTO } from "@/types";

// ===================================================================
// MOCKS
// ===================================================================

// Mock Supabase browser client
vi.mock("@/lib/supabase-browser", () => ({
  getAccessToken: vi.fn(() => Promise.resolve("mock-token-123")),
}));

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ===================================================================
// TEST DATA
// ===================================================================

const mockProfiles: ProfileDTO[] = [
  {
    id: "profile-1",
    parent_id: "parent-123",
    display_name: "Maria",
    avatar_url: "avatars/avatar-1.svg",
    language_code: "pl",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "profile-2",
    parent_id: "parent-123",
    display_name: "Jan",
    avatar_url: "avatars/avatar-2.svg",
    language_code: "pl",
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
  },
];

const mockNewProfile: ProfileDTO = {
  id: "profile-3",
  parent_id: "parent-123",
  display_name: "Zofia",
  avatar_url: "avatars/avatar-3.svg",
  language_code: "pl",
  created_at: "2026-01-03T00:00:00Z",
  updated_at: "2026-01-03T00:00:00Z",
};

// ===================================================================
// TEST SUITE: Profile Fetching
// ===================================================================

describe("useProfilesManager - Profile Fetching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch profiles on mount", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfiles,
    });

    const { result } = renderHook(() => useProfilesManager());

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.profiles).toEqual([]);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Profiles loaded
    expect(result.current.profiles).toEqual(mockProfiles);
    expect(result.current.error).toBeNull();

    // Verify API call
    expect(mockFetch).toHaveBeenCalledWith("/api/profiles", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer mock-token-123",
      },
      credentials: "include",
    });
  });

  it("should handle empty profiles list", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => [],
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Empty array is valid state
    expect(result.current.profiles).toEqual([]);
    expect(result.current.canAddProfile).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("should handle 401 unauthorized error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: "unauthorized" }),
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error state set
    expect(result.current.error).toBe("Musisz być zalogowany, aby zobaczyć profile");
    expect(result.current.profiles).toEqual([]);
  });

  it("should handle network errors gracefully", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Error captured
    expect(result.current.error).toBe("Network error");
    expect(result.current.profiles).toEqual([]);
  });
});

// ===================================================================
// TEST SUITE: Profile Limit Enforcement (Max 5)
// ===================================================================

describe("useProfilesManager - Profile Limit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow adding profile when count < 5", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfiles, // 2 profiles
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Can add more profiles
    expect(result.current.canAddProfile).toBe(true);
    expect(result.current.profiles.length).toBe(2);

    // Act: Open parental gate (should succeed)
    act(() => {
      result.current.openParentalGate();
    });

    expect(result.current.activeModal).toBe("parental_gate");
    expect(result.current.error).toBeNull();
  });

  it("should block adding profile when count = 5", async () => {
    const fiveProfiles: ProfileDTO[] = [
      ...mockProfiles,
      { ...mockNewProfile, id: "profile-3", display_name: "Zofia" },
      { ...mockNewProfile, id: "profile-4", display_name: "Kasia" },
      { ...mockNewProfile, id: "profile-5", display_name: "Tomek" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fiveProfiles,
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Cannot add more profiles
    expect(result.current.canAddProfile).toBe(false);
    expect(result.current.profiles.length).toBe(5);

    // Act: Try to open parental gate (should fail)
    act(() => {
      result.current.openParentalGate();
    });

    // Assert: Modal not opened, error set
    expect(result.current.activeModal).toBe("none");
    expect(result.current.error).toBe("Osiągnięto maksymalną liczbę profili (5)");
  });

  it("should recalculate canAddProfile after profile creation", async () => {
    const fourProfiles: ProfileDTO[] = [
      ...mockProfiles,
      { ...mockNewProfile, id: "profile-3", display_name: "Zofia" },
      { ...mockNewProfile, id: "profile-4", display_name: "Kasia" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => fourProfiles,
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial state: 4 profiles, can add
    expect(result.current.profiles.length).toBe(4);
    expect(result.current.canAddProfile).toBe(true);

    // Act: Add 5th profile
    const fifthProfile: ProfileDTO = {
      ...mockNewProfile,
      id: "profile-5",
      display_name: "Tomek",
    };

    act(() => {
      result.current.handleProfileCreated(fifthProfile);
    });

    // Assert: Now at limit, cannot add more
    expect(result.current.profiles.length).toBe(5);
    expect(result.current.canAddProfile).toBe(false);
  });
});

// ===================================================================
// TEST SUITE: Profile Creation
// ===================================================================

describe("useProfilesManager - Profile Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfiles,
    });
  });

  it("should add new profile to state after creation", async () => {
    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.profiles.length).toBe(2);

    // Act: Create new profile
    act(() => {
      result.current.handleProfileCreated(mockNewProfile);
    });

    // Assert: Profile added to beginning of list
    expect(result.current.profiles.length).toBe(3);
    expect(result.current.profiles[0]).toEqual(mockNewProfile);
    expect(result.current.profiles[1]).toEqual(mockProfiles[0]);
  });

  it("should close modal after profile creation", async () => {
    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Arrange: Open create profile modal
    act(() => {
      result.current.openCreateProfile();
    });

    expect(result.current.activeModal).toBe("create_profile");

    // Act: Handle profile created
    act(() => {
      result.current.handleProfileCreated(mockNewProfile);
    });

    // Assert: Modal closed
    expect(result.current.activeModal).toBe("none");
  });
});

// ===================================================================
// TEST SUITE: Modal State Management
// ===================================================================

describe("useProfilesManager - Modal Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfiles,
    });
  });

  it("should manage modal state transitions correctly", async () => {
    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial state: no modal
    expect(result.current.activeModal).toBe("none");

    // Flow: User clicks "Add Profile" → Parental Gate
    act(() => {
      result.current.openParentalGate();
    });
    expect(result.current.activeModal).toBe("parental_gate");

    // Flow: Parent passes gate → Create Profile Modal
    act(() => {
      result.current.openCreateProfile();
    });
    expect(result.current.activeModal).toBe("create_profile");

    // Flow: User closes modal
    act(() => {
      result.current.closeModal();
    });
    expect(result.current.activeModal).toBe("none");
  });

  it("should allow direct close from any modal state", async () => {
    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Open parental gate
    act(() => {
      result.current.openParentalGate();
    });
    expect(result.current.activeModal).toBe("parental_gate");

    // Close directly without completing flow
    act(() => {
      result.current.closeModal();
    });
    expect(result.current.activeModal).toBe("none");
  });
});

// ===================================================================
// TEST SUITE: Error Recovery
// ===================================================================

describe("useProfilesManager - Error Recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow refetch after error", async () => {
    // First call fails
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.profiles).toEqual([]);

    // Second call succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfiles,
    });

    // Act: Refetch
    await act(async () => {
      await result.current.refetchProfiles();
    });

    // Assert: Error cleared, profiles loaded
    expect(result.current.error).toBeNull();
    expect(result.current.profiles).toEqual(mockProfiles);
  });

  it("should handle server errors (500) gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "internal_error" }),
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Generic error message
    expect(result.current.error).toBe("Nie udało się załadować profili");
    expect(result.current.profiles).toEqual([]);
  });
});

// ===================================================================
// TEST SUITE: Edge Cases
// ===================================================================

describe("useProfilesManager - Edge Cases", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle profiles with null avatar_url", async () => {
    const profilesWithNullAvatar: ProfileDTO[] = [{ ...mockProfiles[0], avatar_url: null }];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => profilesWithNullAvatar,
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Null avatar is valid
    expect(result.current.profiles[0].avatar_url).toBeNull();
  });

  it("should preserve profile order from API", async () => {
    const orderedProfiles = [...mockProfiles].reverse();

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => orderedProfiles,
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Assert: Order maintained
    expect(result.current.profiles[0].id).toBe(orderedProfiles[0].id);
    expect(result.current.profiles[1].id).toBe(orderedProfiles[1].id);
  });

  it("should add new profile to beginning of list (most recent first)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockProfiles,
    });

    const { result } = renderHook(() => useProfilesManager());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Act: Add new profile
    act(() => {
      result.current.handleProfileCreated(mockNewProfile);
    });

    // Assert: New profile is first
    expect(result.current.profiles[0].id).toBe(mockNewProfile.id);
    expect(result.current.profiles[0].display_name).toBe("Zofia");
  });
});
