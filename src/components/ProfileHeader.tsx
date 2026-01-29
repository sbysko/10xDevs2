/**
 * ProfileHeader Component
 *
 * Displays selected profile information at the top of category view
 *
 * Features:
 * - Profile avatar (small, 48x48px)
 * - Display name
 * - Back button to profiles
 *
 * Props:
 * - profile: { id, display_name?, avatar_url? }
 * - onBack: () => void
 */

import { ArrowLeft } from "lucide-react";

interface ProfileHeaderProps {
  profile: {
    id: string;
    display_name?: string;
    avatar_url?: string | null;
  };
  onBack: () => void;
}

export default function ProfileHeader({ profile, onBack }: ProfileHeaderProps) {
  const avatarUrl = profile.avatar_url || "/avatars/default-avatar.svg";
  const displayName = profile.display_name || "Gracz";

  return (
    <div className="mb-8 flex items-center justify-between">
      {/* Profile Info */}
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="h-12 w-12 overflow-hidden rounded-full bg-white shadow-md">
          <img
            src={avatarUrl}
            alt={`Avatar ${displayName}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.src = "/avatars/default-avatar.svg";
            }}
          />
        </div>

        {/* Name */}
        <div>
          <p className="text-sm font-medium text-purple-600">Grasz jako:</p>
          <h2 className="text-xl font-bold text-purple-800">{displayName}</h2>
        </div>
      </div>

      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-purple-600 shadow-md transition-all hover:bg-purple-50 hover:shadow-lg active:scale-95"
        aria-label="Wróć do wyboru profili"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="hidden sm:inline">Zmień profil</span>
      </button>
    </div>
  );
}
