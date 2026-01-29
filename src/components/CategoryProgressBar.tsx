/**
 * CategoryProgressBar Component
 *
 * Progress bar for a single vocabulary category.
 *
 * Features:
 * - Category name with emoji icon
 * - Visual progress bar (width = completion %)
 * - Word counter: "35/50"
 * - Percentage display: "70%"
 *
 * Props:
 * - category: CategoryProgressItem with progress data
 */

import type { CategoryProgressItem } from "@/types";

interface CategoryProgressBarProps {
  category: CategoryProgressItem;
}

/**
 * Category emoji mapping
 */
const CATEGORY_ICONS: Record<string, string> = {
  zwierzeta: "🐾",
  owoce_warzywa: "🍎",
  pojazdy: "🚗",
  kolory_ksztalty: "🎨",
  przedmioty_codzienne: "🏠",
};

/**
 * Category name mapping
 */
const CATEGORY_NAMES: Record<string, string> = {
  zwierzeta: "Zwierzęta",
  owoce_warzywa: "Owoce i Warzywa",
  pojazdy: "Pojazdy",
  kolory_ksztalty: "Kolory i Kształty",
  przedmioty_codzienne: "Przedmioty Codzienne",
};

export default function CategoryProgressBar({ category }: CategoryProgressBarProps) {
  const icon = CATEGORY_ICONS[category.category] || "📚";
  const name = CATEGORY_NAMES[category.category] || category.category;
  const percentage = category.completion_percentage.toFixed(1);

  return (
    <div className="space-y-2">
      {/* Header: Name + Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <span className="font-semibold text-purple-800">{name}</span>
        </div>
        <div className="flex items-center gap-3 text-sm font-semibold text-purple-600">
          <span>
            {category.mastered_words}/{category.total_words}
          </span>
          <span className="text-purple-500">{percentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${category.completion_percentage}%` }}
          role="progressbar"
          aria-valuenow={category.mastered_words}
          aria-valuemin={0}
          aria-valuemax={category.total_words}
          aria-label={`${name}: ${category.mastered_words} z ${category.total_words} opanowanych`}
        ></div>
      </div>
    </div>
  );
}
