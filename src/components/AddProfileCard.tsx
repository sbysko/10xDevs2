/**
 * AddProfileCard Component
 *
 * Special card with "+" icon to add new profile.
 * Opens Parental Gate when clicked to prevent children from accessing.
 *
 * Features:
 * - Large "+" icon from Lucide React
 * - Dashed border to differentiate from profile cards
 * - Disabled state when profile limit (5) is reached
 * - Same size and styling as ProfileCard for consistency
 *
 * Props:
 * - disabled: Whether card is clickable (limit reached)
 * - onClick: Callback to open Parental Gate
 */

import { Plus } from "lucide-react";

interface AddProfileCardProps {
  disabled: boolean;
  onClick: () => void;
}

export default function AddProfileCard({ disabled, onClick }: AddProfileCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative overflow-hidden rounded-2xl border-4 border-dashed border-purple-300 bg-purple-50 p-6 shadow-lg transition-all duration-200 hover:scale-105 hover:border-purple-400 hover:bg-purple-100 hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:border-purple-300 disabled:hover:bg-purple-50"
      aria-label="Dodaj nowy profil"
    >
      {/* Card Content */}
      <div className="flex flex-col items-center gap-4">
        {/* Plus Icon */}
        <div className="flex h-32 w-32 items-center justify-center rounded-full bg-purple-200 transition-transform duration-200 group-hover:rotate-90 group-disabled:rotate-0">
          <Plus size={64} className="text-purple-600" strokeWidth={3} aria-hidden="true" />
        </div>

        {/* Label */}
        <h3 className="text-2xl font-bold text-purple-800">{disabled ? "Limit osiągnięty" : "Dodaj profil"}</h3>

        {/* Subtitle */}
        {disabled && <p className="text-sm text-purple-600">Maksymalnie 5 profili</p>}
      </div>

      {/* Hover Glow Effect */}
      {!disabled && (
        <div className="absolute inset-0 bg-purple-400 opacity-0 transition-opacity duration-200 group-hover:opacity-10"></div>
      )}
    </button>
  );
}
