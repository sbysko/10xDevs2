/**
 * WordBadge Component
 *
 * Badge displaying a mastered word with stats.
 *
 * Features:
 * - Word text
 * - Stars earned (⭐ icons)
 * - Category emoji
 * - Hover: show attempts count in tooltip
 *
 * Props:
 * - word: DetailedProgressItem with word data
 */

import type { DetailedProgressItem } from "@/types";

interface WordBadgeProps {
  word: DetailedProgressItem;
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

export default function WordBadge({ word }: WordBadgeProps) {
  const categoryIcon = CATEGORY_ICONS[word.category] || "📚";
  const stars = "⭐".repeat(word.stars_earned);

  return (
    <div
      className="group relative rounded-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 shadow-sm transition-all hover:scale-105 hover:border-purple-400 hover:shadow-md"
      title={`${word.attempts_count} ${word.attempts_count === 1 ? "próba" : "prób"}`}
    >
      {/* Category Icon */}
      <div className="mb-2 text-2xl">{categoryIcon}</div>

      {/* Word Text */}
      <div className="mb-2 text-lg font-bold text-purple-800">{word.word_text}</div>

      {/* Stars */}
      <div className="flex items-center gap-1 text-sm">
        <span>{stars}</span>
        <span className="text-yellow-600">({word.stars_earned})</span>
      </div>

      {/* Tooltip on hover */}
      <div className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-sm text-white opacity-0 transition-opacity group-hover:opacity-100">
        {word.attempts_count} {word.attempts_count === 1 ? "próba" : "prób"}
      </div>
    </div>
  );
}
