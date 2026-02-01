/**
 * useCategoriesManager Hook
 *
 * Manages state and logic for the category selection view
 *
 * Responsibilities:
 * - Validate selected profile from sessionStorage
 * - Fetch categories list
 * - Fetch profile progress for categories
 * - Handle category selection and navigation
 * - Error handling
 */

import { useState, useEffect, useCallback } from "react";
import type { CategoryDTO, CategoryProgressDTO, CategoriesListDTO } from "@/types";
import { deleteCookie, getCookie } from "@/lib/utils";

/**
 * Selected profile info from sessionStorage
 */
interface SelectedProfile {
  id: string;
  display_name?: string;
  avatar_url?: string | null;
}

/**
 * Hook state interface
 */
interface CategoryViewState {
  categories: CategoryDTO[];
  progress: CategoryProgressDTO | null;
  isLoading: boolean;
  error: string | null;
  selectedProfile: SelectedProfile | null;
}

/**
 * Hook return type
 */
interface UseCategoriesManagerReturn extends CategoryViewState {
  selectCategory: (categoryCode: string) => void;
  goBackToProfiles: () => void;
  refetch: () => void;
}

/**
 * Custom hook for managing category selection view
 *
 * @returns UseCategoriesManagerReturn
 *
 * @example
 * const {
 *   categories,
 *   progress,
 *   isLoading,
 *   error,
 *   selectedProfile,
 *   selectCategory,
 *   goBackToProfiles,
 *   refetch
 * } = useCategoriesManager();
 */
export function useCategoriesManager(): UseCategoriesManagerReturn {
  // ===================================================================
  // STATE
  // ===================================================================

  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [progress, setProgress] = useState<CategoryProgressDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<SelectedProfile | null>(null);

  // ===================================================================
  // PROFILE VALIDATION
  // ===================================================================

  /**
   * Get and validate selected profile from sessionStorage
   */
  const getSelectedProfile = useCallback((): SelectedProfile | null => {
    // Check if we're in browser environment
    if (typeof window === "undefined") {
      return null;
    }

    const profileId = sessionStorage.getItem("selectedProfileId");

    if (!profileId) {
      console.log("[useCategoriesManager] No profile ID in sessionStorage");
      return null;
    }

    // Optionally get profile name and avatar from sessionStorage
    // (These could be set by /profiles page when selecting profile)
    const displayName = sessionStorage.getItem("selectedProfileName") || undefined;
    const avatarUrl = sessionStorage.getItem("selectedProfileAvatar") || undefined;

    console.log("[useCategoriesManager] Selected profile from sessionStorage:", {
      id: profileId,
      display_name: displayName,
    });

    return {
      id: profileId,
      display_name: displayName,
      avatar_url: avatarUrl,
    };
  }, []);

  // ===================================================================
  // DATA FETCHING
  // ===================================================================

  /**
   * Fetch categories list from API
   */
  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/categories?language=pl", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sesja wygasła. Zaloguj się ponownie.");
        }
        throw new Error("Nie udało się załadować kategorii");
      }

      const data: CategoriesListDTO = await response.json();
      setCategories(data.categories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      throw new Error(errorMessage);
    }
  }, []);

  /**
   * Fetch profile progress for categories
   */
  const fetchProgress = useCallback(async (profileId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/profiles/${profileId}/progress/categories?language=pl`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        // Progress is optional - if it fails, we can still show categories
        // Just log the error and continue
        console.warn("Failed to fetch progress:", response.statusText);
        setProgress(null);
        return;
      }

      const data: CategoryProgressDTO = await response.json();
      setProgress(data);
    } catch (err) {
      // Progress is optional - continue without it
      console.warn("Failed to fetch progress:", err);
      setProgress(null);
    }
  }, []);

  /**
   * Load all data (categories + progress)
   */
  const loadData = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Validate selected profile
      const profile = getSelectedProfile();

      if (!profile) {
        throw new Error("Nie wybrano profilu. Wróć do ekranu wyboru profili.");
      }

      setSelectedProfile(profile);

      // 2. Fetch categories (required)
      await fetchCategories();

      // 3. Fetch progress (optional)
      await fetchProgress(profile.id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się załadować danych";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [getSelectedProfile, fetchCategories, fetchProgress]);

  // ===================================================================
  // EFFECTS
  // ===================================================================

  /**
   * Load data on mount
   */
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===================================================================
  // ACTIONS
  // ===================================================================

  /**
   * Handle category selection
   *
   * Saves selected category to sessionStorage and navigates to game session
   */
  const selectCategory = useCallback((categoryCode: string): void => {
    // Save selected category to sessionStorage
    sessionStorage.setItem("selectedCategory", categoryCode);

    // Navigate to game session
    window.location.href = `/game/session?category=${categoryCode}`;
  }, []);

  /**
   * Navigate back to profiles page
   */
  const goBackToProfiles = useCallback((): void => {
    // Clear selected profile from sessionStorage to prevent auto-redirect
    sessionStorage.removeItem("selectedProfileId");
    sessionStorage.removeItem("selectedProfileName");
    sessionStorage.removeItem("selectedProfileAvatar");

    // Clear active profile cookie
    deleteCookie("app_active_profile_id");

    // Navigate to profiles
    window.location.href = "/profiles";
  }, []);

  /**
   * Refetch data (retry on error)
   */
  const refetch = useCallback((): void => {
    loadData();
  }, [loadData]);

  // ===================================================================
  // RETURN
  // ===================================================================

  return {
    categories,
    progress,
    isLoading,
    error,
    selectedProfile,
    selectCategory,
    goBackToProfiles,
    refetch,
  };
}
