/**
 * ProfileSelector Component
 *
 * Dropdown selector for choosing which profile's stats to view.
 * Used when parent has multiple children.
 *
 * Features:
 * - Dropdown with profile list
 * - Shows avatar + display_name for each
 * - Highlights selected profile
 *
 * Props:
 * - profiles: Array of ProfileDTO
 * - selectedProfileId: Currently selected profile ID
 * - onSelect: Callback when profile selected
 */

import type { ProfileDTO } from "@/types";
import { normalizeAvatarUrl } from "@/lib/utils";

interface ProfileSelectorProps {
  profiles: ProfileDTO[];
  selectedProfileId: string | null;
  onSelect: (profileId: string) => void;
}

export default function ProfileSelector({ profiles, selectedProfileId, onSelect }: ProfileSelectorProps) {
  const selectedProfile = profiles.find((p) => p.id === selectedProfileId);

  // Don't show selector if only 1 profile
  if (profiles.length <= 1) {
    return null;
  }

  return (
    <div className="mb-6">
      <label htmlFor="profile-select" className="mb-2 block text-sm font-semibold text-purple-700">
        Wybierz profil:
      </label>
      <select
        id="profile-select"
        value={selectedProfileId || ""}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full rounded-lg border-2 border-purple-300 bg-white p-3 text-lg font-semibold text-purple-800 transition-colors hover:border-purple-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 md:w-auto md:min-w-[300px]"
      >
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.display_name}
          </option>
        ))}
      </select>

      {/* Selected Profile Info */}
      {selectedProfile && (
        <div className="mt-4 flex items-center gap-3 rounded-lg bg-purple-50 p-4">
          {selectedProfile.avatar_url && (
            <img
              src={normalizeAvatarUrl(selectedProfile.avatar_url)}
              alt={selectedProfile.display_name}
              className="h-12 w-12 rounded-full border-2 border-purple-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
          <div>
            <p className="text-sm font-semibold text-purple-600">Statystyki dla:</p>
            <p className="text-xl font-bold text-purple-800">{selectedProfile.display_name}</p>
          </div>
        </div>
      )}
    </div>
  );
}
