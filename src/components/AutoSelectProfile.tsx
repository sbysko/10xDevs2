/**
 * AutoSelectProfile Component
 *
 * Auto-selects a single profile and redirects to game categories.
 * Used when a parent account has only 1 child profile.
 *
 * Features:
 * - Stores profile data in sessionStorage
 * - Redirects to /game/categories
 * - Shows loading message while redirecting
 *
 * Props:
 * - profile: ProfileDTO with id, display_name, avatar_url
 */

import { useEffect } from "react";
import type { ProfileDTO } from "@/types";
import { setCookie } from "@/lib/utils";

interface AutoSelectProfileProps {
  profile: ProfileDTO;
}

export default function AutoSelectProfile({ profile }: AutoSelectProfileProps) {
  useEffect(() => {
    // Store selected profile data in sessionStorage
    sessionStorage.setItem("selectedProfileId", profile.id);
    sessionStorage.setItem("selectedProfileName", profile.display_name);
    if (profile.avatar_url) {
      sessionStorage.setItem("selectedProfileAvatar", profile.avatar_url);
    }

    // Set active profile cookie (30 days expiration)
    // Note: This is also set server-side in profiles.astro, but we ensure it's set client-side too
    setCookie("app_active_profile_id", profile.id, 30);

    // Redirect to game categories
    window.location.href = "/game/categories";
  }, [profile.id, profile.display_name, profile.avatar_url]);

  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
        <p className="text-lg font-medium text-purple-600">Przygotowywanie gry...</p>
      </div>
    </div>
  );
}
