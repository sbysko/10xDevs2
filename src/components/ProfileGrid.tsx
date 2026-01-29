/**
 * ProfileGrid Component
 *
 * Grid layout for displaying profile cards and add profile button.
 *
 * Features:
 * - Responsive grid (1-3 columns based on screen size)
 * - Displays ProfileCard for each child profile
 * - Shows AddProfileCard when under 5 profiles
 * - Empty state message when no profiles exist
 *
 * Props:
 * - profiles: Array of child profiles to display
 * - canAddProfile: Whether user can add more profiles (limit check)
 * - onAddProfileClick: Callback when "Add Profile" card is clicked
 */

import type { ProfileDTO } from "@/types";
import ProfileCard from "@/components/ProfileCard";
import AddProfileCard from "@/components/AddProfileCard";

interface ProfileGridProps {
  profiles: ProfileDTO[];
  canAddProfile: boolean;
  onAddProfileClick: () => void;
}

export default function ProfileGrid({ profiles, canAddProfile, onAddProfileClick }: ProfileGridProps) {
  // ===================================================================
  // EMPTY STATE
  // ===================================================================

  if (profiles.length === 0) {
    return (
      <div className="text-center">
        <div className="mb-6 text-6xl">👶</div>
        <h2 className="mb-4 text-2xl font-bold text-purple-800">Brak profili</h2>
        <p className="mb-6 text-lg text-purple-600">Dodaj pierwszy profil, aby rozpocząć zabawę!</p>
        <AddProfileCard disabled={!canAddProfile} onClick={onAddProfileClick} />
      </div>
    );
  }

  // ===================================================================
  // GRID LAYOUT
  // ===================================================================

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* Existing Profiles */}
      {profiles.map((profile) => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}

      {/* Add Profile Card (only if under limit) */}
      {canAddProfile && <AddProfileCard disabled={false} onClick={onAddProfileClick} />}
    </div>
  );
}
