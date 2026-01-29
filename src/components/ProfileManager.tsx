/**
 * ProfileManager Component
 *
 * Main container component for profile selection view.
 * Coordinates profile grid, modals, and state management.
 *
 * Features:
 * - Displays loading state while fetching profiles
 * - Shows error message with retry button if fetch fails
 * - Renders profile grid with all child profiles
 * - Manages Parental Gate and Create Profile modals
 *
 * User Stories: US-002, US-003
 */

import { useProfilesManager } from "@/components/hooks/useProfilesManager";
import ProfileGrid from "@/components/ProfileGrid";
import ParentalGateModal from "@/components/ParentalGateModal";
import CreateProfileModal from "@/components/CreateProfileModal";

export default function ProfileManager() {
  const {
    profiles,
    isLoading,
    error,
    activeModal,
    canAddProfile,
    openParentalGate,
    openCreateProfile,
    closeModal,
    handleProfileCreated,
    refetchProfiles,
  } = useProfilesManager();

  // ===================================================================
  // LOADING STATE
  // ===================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-lg text-purple-600">Ładowanie profili...</p>
        </div>
      </div>
    );
  }

  // ===================================================================
  // ERROR STATE
  // ===================================================================

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <div className="mb-4 text-5xl">😞</div>
          <h2 className="mb-2 text-xl font-bold text-red-800">Ups! Coś poszło nie tak</h2>
          <p className="mb-4 text-red-600">{error}</p>
          <button
            onClick={refetchProfiles}
            className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
          >
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // MAIN RENDER
  // ===================================================================

  return (
    <>
      {/* Profile Grid */}
      <ProfileGrid profiles={profiles} canAddProfile={canAddProfile} onAddProfileClick={openParentalGate} />

      {/* Parental Gate Modal */}
      <ParentalGateModal isOpen={activeModal === "parental_gate"} onSuccess={openCreateProfile} onClose={closeModal} />

      {/* Create Profile Modal */}
      <CreateProfileModal
        isOpen={activeModal === "create_profile"}
        onCreated={handleProfileCreated}
        onClose={closeModal}
      />
    </>
  );
}
