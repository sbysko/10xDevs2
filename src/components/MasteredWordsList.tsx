/**
 * MasteredWordsList Component
 *
 * Grid of mastered word badges.
 *
 * Features:
 * - Responsive grid (2-4 columns)
 * - WordBadge for each word
 * - Empty state if no words mastered
 *
 * Props:
 * - words: Array of DetailedProgressItem (mastered words)
 */

import WordBadge from "@/components/WordBadge";
import type { DetailedProgressItem } from "@/types";

interface MasteredWordsListProps {
  words: DetailedProgressItem[];
}

export default function MasteredWordsList({ words }: MasteredWordsListProps) {
  // ===================================================================
  // EMPTY STATE
  // ===================================================================

  if (words.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">💪</div>
        <h3 className="mb-2 text-xl font-bold text-purple-800">Jeszcze brak opanowanych słów</h3>
        <p className="text-purple-600">Kontynuuj naukę, aby opanować pierwsze słowa!</p>
      </div>
    );
  }

  // ===================================================================
  // WORD GRID
  // ===================================================================

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-purple-800">Opanowane słowa</h2>
        <p className="text-lg text-purple-600">
          {words.length} {words.length === 1 ? "słowo" : words.length < 5 ? "słowa" : "słów"}
        </p>
      </div>

      {/* Word Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {words.map((word) => (
          <WordBadge key={word.id} word={word} />
        ))}
      </div>
    </div>
  );
}
