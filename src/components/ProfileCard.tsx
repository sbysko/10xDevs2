/**
 * ProfileCard Component
 *
 * Large, colorful card displaying a child's profile.
 * Designed for easy recognition by 4-6 year olds.
 *
 * Features:
 * - Large avatar image (min 80x80px as per PRD)
 * - Big, readable display name
 * - Hover and active animations for feedback
 * - Click redirects to /game/categories with profile ID in sessionStorage
 *
 * Accessibility:
 * - Large touch targets for small fingers
 * - High contrast colors
 * - Clear visual feedback on interaction
 *
 * Props:
 * - profile: ProfileDTO with id, display_name, avatar_url
 */

import { useCallback } from "react";
import type { ProfileDTO } from "@/types";

interface ProfileCardProps {
  profile: ProfileDTO;
}

export default function ProfileCard({ profile }: ProfileCardProps) {
  // ===================================================================
  // HANDLERS
  // ===================================================================

  /**
   * Handle profile selection
   * - Save profile ID to sessionStorage
   * - Navigate to game categories page
   */
  const handleSelect = useCallback(() => {
    // Store selected profile ID for game session
    sessionStorage.setItem("selectedProfileId", profile.id);

    // Navigate to game categories
    window.location.href = "/game/categories";
  }, [profile.id]);

  // ===================================================================
  // AVATAR URL
  // ===================================================================

  // Use avatar_url if provided, otherwise show default avatar
  const avatarUrl = profile.avatar_url || "/avatars/default-avatar.svg";

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <button
      onClick={handleSelect}
      className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-400 to-pink-400 p-6 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
      aria-label={`Wybierz profil ${profile.display_name}`}
    >
      {/* Card Content */}
      <div className="flex flex-col items-center gap-4">
        {/* Avatar */}
        <div className="relative h-32 w-32 overflow-hidden rounded-full bg-white p-2 shadow-md transition-transform duration-200 group-hover:rotate-6">
          <img
            src={avatarUrl}
            alt={`Avatar ${profile.display_name}`}
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.src = "/avatars/default-avatar.svg";
            }}
          />
        </div>

        {/* Display Name */}
        <h3 className="text-2xl font-bold text-white drop-shadow-md">{profile.display_name}</h3>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 bg-white opacity-0 transition-opacity duration-200 group-hover:opacity-10"></div>
    </button>
  );
}
