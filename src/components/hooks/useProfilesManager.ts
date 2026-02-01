/**
 * useProfilesManager Hook
 *
 * Custom hook for managing profile selection view state and API interactions.
 *
 * Responsibilities:
 * - Fetch profiles from API on mount
 * - Manage modal visibility (Parental Gate, Create Profile)
 * - Handle profile creation
 * - Validate profile limit (max 5)
 *
 * Used in: ProfileManager component
 */

import { useState, useEffect, useCallback } from "react";
import type { ProfileDTO } from "@/types";
import { getAccessToken } from "@/lib/supabase-browser";

/**
 * Modal types for the profile selection view
 */
export type ModalType = "none" | "parental_gate" | "create_profile";

/**
 * View state for profile management
 */
export interface ProfileViewState {
  profiles: ProfileDTO[];
  isLoading: boolean;
  error: string | null;
  activeModal: ModalType;
}

/**
 * Hook return type
 */
export interface UseProfilesManagerReturn {
  // State
  profiles: ProfileDTO[];
  isLoading: boolean;
  error: string | null;
  activeModal: ModalType;
  canAddProfile: boolean;

  // Actions
  openParentalGate: () => void;
  openCreateProfile: () => void;
  closeModal: () => void;
  handleProfileCreated: (newProfile: ProfileDTO) => void;
  refetchProfiles: () => Promise<void>;
}

/**
 * Custom hook for managing profiles view
 *
 * @returns Profile manager state and actions
 *
 * @example
 * ```tsx
 * const {
 *   profiles,
 *   isLoading,
 *   error,
 *   activeModal,
 *   canAddProfile,
 *   openParentalGate,
 *   handleProfileCreated
 * } = useProfilesManager();
 * ```
 */
export function useProfilesManager(): UseProfilesManagerReturn {
  // ===================================================================
  // STATE
  // ===================================================================

  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>("none");

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  // Profile limit check (max 5 profiles)
  const canAddProfile = profiles.length < 5;

  // ===================================================================
  // API FUNCTIONS
  // ===================================================================

  /**
   * Fetch all profiles from API
   */
  const fetchProfiles = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get authentication token
      const token = await getAccessToken();

      if (!token) {
        throw new Error("Musisz być zalogowany, aby zobaczyć profile");
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
        // Handle different error status codes
        if (response.status === 401) {
          throw new Error("Musisz być zalogowany, aby zobaczyć profile");
        }

        throw new Error("Nie udało się załadować profili");
      }

      const data = await response.json();

      // API returns array of ProfileDTO directly
      setProfiles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error fetching profiles:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // ===================================================================
  // MODAL ACTIONS
  // ===================================================================

  /**
   * Open Parental Gate modal (triggered by "Add Profile" button)
   */
  const openParentalGate = useCallback(() => {
    // Only allow if profile limit not reached
    if (!canAddProfile) {
      setError("Osiągnięto maksymalną liczbę profili (5)");
      return;
    }

    setActiveModal("parental_gate");
  }, [canAddProfile]);

  /**
   * Open Create Profile modal (after Parental Gate success)
   */
  const openCreateProfile = useCallback(() => {
    setActiveModal("create_profile");
  }, []);

  /**
   * Close any active modal
   */
  const closeModal = useCallback(() => {
    setActiveModal("none");
  }, []);

  // ===================================================================
  // PROFILE ACTIONS
  // ===================================================================

  /**
   * Handle successful profile creation
   * - Add new profile to local state
   * - Close modal
   */
  const handleProfileCreated = useCallback((newProfile: ProfileDTO) => {
    setProfiles((prev) => [newProfile, ...prev]);
    setActiveModal("none");
  }, []);

  /**
   * Manually refetch profiles (for error recovery)
   */
  const refetchProfiles = useCallback(async () => {
    await fetchProfiles();
  }, [fetchProfiles]);

  // ===================================================================
  // RETURN
  // ===================================================================

  return {
    // State
    profiles,
    isLoading,
    error,
    activeModal,
    canAddProfile,

    // Actions
    openParentalGate,
    openCreateProfile,
    closeModal,
    handleProfileCreated,
    refetchProfiles,
  };
}
