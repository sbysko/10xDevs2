/**
 * useProgressStats Hook
 *
 * Custom hook for managing progress statistics view.
 *
 * Responsibilities:
 * - Fetch all profiles for selection
 * - Fetch profile statistics
 * - Fetch category progress
 * - Fetch mastered words list
 * - Handle profile selection changes
 *
 * Used in: ProgressDashboard component
 */

import { useState, useEffect, useCallback } from "react";
import type { ProfileDTO, ProfileStatsDTO, CategoryProgressDTO, DetailedProgressItem } from "@/types";
import { getAccessToken } from "@/lib/supabase-browser";

/**
 * Hook state interface
 */
export interface ProgressStatsState {
  profiles: ProfileDTO[];
  selectedProfileId: string | null;
  stats: ProfileStatsDTO | null;
  categoryProgress: CategoryProgressDTO | null;
  masteredWords: DetailedProgressItem[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook return type
 */
export interface UseProgressStatsReturn extends ProgressStatsState {
  // Actions
  selectProfile: (profileId: string) => void;
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing progress statistics
 *
 * @param initialProfileId - Optional initial profile ID (from URL)
 * @returns Progress stats state and actions
 *
 * @example
 * ```tsx
 * const {
 *   profiles,
 *   selectedProfileId,
 *   stats,
 *   categoryProgress,
 *   masteredWords,
 *   isLoading,
 *   selectProfile
 * } = useProgressStats();
 * ```
 */
export function useProgressStats(initialProfileId?: string | null): UseProgressStatsReturn {
  // ===================================================================
  // STATE
  // ===================================================================

  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(initialProfileId || null);
  const [stats, setStats] = useState<ProfileStatsDTO | null>(null);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgressDTO | null>(null);
  const [masteredWords, setMasteredWords] = useState<DetailedProgressItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // API FUNCTIONS
  // ===================================================================

  /**
   * Fetch all profiles for selection dropdown
   */
  const fetchProfiles = useCallback(async () => {
    try {
      // Get authentication token
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Musisz być zalogowany");
      }

      const response = await fetch("/api/profiles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Musisz być zalogowany");
        }
        throw new Error("Nie udało się załadować profili");
      }

      const data: ProfileDTO[] = await response.json();
      setProfiles(data);

      // Handle empty profiles list - stop loading
      if (data.length === 0) {
        setIsLoading(false);
        return data;
      }

      // Auto-select first profile if no profile selected
      if (!initialProfileId && data.length > 0) {
        setSelectedProfileId(data[0].id);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      setIsLoading(false);
      console.error("Error fetching profiles:", err);
      return [];
    }
  }, [initialProfileId]);

  /**
   * Fetch profile statistics
   */
  const fetchStats = useCallback(async (profileId: string) => {
    try {
      // Get authentication token
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Musisz być zalogowany");
      }

      const response = await fetch(`/api/profiles/${profileId}/stats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Profil nie został znaleziony");
        }
        if (response.status === 403) {
          throw new Error("Brak dostępu do tego profilu");
        }
        throw new Error("Nie udało się załadować statystyk");
      }

      const data: ProfileStatsDTO = await response.json();
      setStats(data);
      return data;
    } catch (err) {
      console.error("Error fetching stats:", err);
      throw err;
    }
  }, []);

  /**
   * Fetch category progress
   */
  const fetchCategoryProgress = useCallback(async (profileId: string) => {
    try {
      // Get authentication token
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Musisz być zalogowany");
      }

      const response = await fetch(`/api/profiles/${profileId}/progress/categories?language=pl`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Nie udało się załadować postępu kategorii");
      }

      const data: CategoryProgressDTO = await response.json();
      setCategoryProgress(data);
      return data;
    } catch (err) {
      console.error("Error fetching category progress:", err);
      throw err;
    }
  }, []);

  /**
   * Fetch mastered words
   */
  const fetchMasteredWords = useCallback(async (profileId: string) => {
    try {
      // Get authentication token
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Musisz być zalogowany");
      }

      const response = await fetch(`/api/profiles/${profileId}/progress?is_mastered=true&limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Nie udało się załadować listy słów");
      }

      const data = await response.json();
      setMasteredWords(data.progress || []);
      return data.progress;
    } catch (err) {
      console.error("Error fetching mastered words:", err);
      // Non-critical error - don't throw
      setMasteredWords([]);
      return [];
    }
  }, []);

  /**
   * Fetch all data for selected profile
   */
  const fetchAllData = useCallback(
    async (profileId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all data in parallel
        await Promise.all([fetchStats(profileId), fetchCategoryProgress(profileId), fetchMasteredWords(profileId)]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchStats, fetchCategoryProgress, fetchMasteredWords]
  );

  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // Fetch data when profile selected
  useEffect(() => {
    if (selectedProfileId) {
      fetchAllData(selectedProfileId);
    }
  }, [selectedProfileId, fetchAllData]);

  // ===================================================================
  // ACTIONS
  // ===================================================================

  /**
   * Select a profile
   */
  const selectProfile = useCallback((profileId: string) => {
    setSelectedProfileId(profileId);
  }, []);

  /**
   * Refetch all data (for error recovery)
   */
  const refetch = useCallback(async () => {
    if (selectedProfileId) {
      await fetchAllData(selectedProfileId);
    }
  }, [selectedProfileId, fetchAllData]);

  // ===================================================================
  // RETURN
  // ===================================================================

  return {
    // State
    profiles,
    selectedProfileId,
    stats,
    categoryProgress,
    masteredWords,
    isLoading,
    error,

    // Actions
    selectProfile,
    refetch,
  };
}
