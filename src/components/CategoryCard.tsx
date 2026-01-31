/**
 * CategoryCard Component
 *
 * Displays a single vocabulary category as an interactive card
 *
 * Features:
 * - Large, colorful gradient background
 * - Category icon (emoji)
 * - Category name
 * - Progress tracker ("35/50")
 * - Visual progress bar
 * - Hover/active animations
 *
 * Props:
 * - category: CategoryDTO
 * - progress: CategoryProgressItem | null
 * - onSelect: (categoryCode: string) => void
 */

import { useCallback } from "react";
import type { CategoryDTO, CategoryProgressItem } from "@/types";
import { getCategoryIcon, getCategoryColors } from "@/lib/categoryConfig";

interface CategoryCardProps {
  category: CategoryDTO;
  progress: CategoryProgressItem | null;
  onSelect: (categoryCode: string) => void;
}

export default function CategoryCard({ category, progress, onSelect }: CategoryCardProps) {
  // ===================================================================
  // HANDLERS
  // ===================================================================

  const handleClick = useCallback(() => {
    onSelect(category.code);
  }, [category.code, onSelect]);

  // ===================================================================
  // VISUAL CONFIG
  // ===================================================================

  const icon = getCategoryIcon(category.code);
  const colors = getCategoryColors(category.code);

  // Progress data
  const masteredWords = progress?.mastered_words || 0;
  const totalWords = progress?.total_words || category.word_count;
  const percentage = progress?.completion_percentage || 0;

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <button
      onClick={handleClick}
      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} p-6 shadow-lg transition-all duration-200 ${colors.hover} hover:scale-105 hover:shadow-xl active:scale-95`}
      aria-label={`Wybierz kategorię ${category.name}`}
    >
      {/* Card Content */}
      <div className="flex flex-col items-center gap-4">
        {/* Icon */}
        <div className="text-6xl drop-shadow-md transition-transform duration-200 group-hover:scale-110">{icon}</div>

        {/* Category Name */}
        <h3 className="text-center text-2xl font-bold text-white drop-shadow-md">{category.name}</h3>

        {/* Progress Tracker */}
        <div className="w-full space-y-2">
          {/* Text: "35/50" */}
          <p className="text-center text-lg font-semibold text-white">
            {masteredWords}/{totalWords}
          </p>

          {/* Progress Bar */}
          <div className="h-3 w-full overflow-hidden rounded-full bg-white bg-opacity-30">
            <div
              className="h-full rounded-full bg-white transition-all duration-500"
              style={{ width: `${percentage}%` }}
              aria-label={`Postęp: ${percentage.toFixed(0)}%`}
            />
          </div>

          {/* Percentage Text */}
          <p className="text-center text-sm font-medium text-white opacity-90">{percentage.toFixed(0)}% opanowane</p>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-20">
        <div className="absolute inset-0 bg-white" />
      </div>
    </button>
  );
}
