/**
 * StatsOverview Component
 *
 * Grid of 4 key statistics cards.
 *
 * Features:
 * - Responsive grid (1-4 columns)
 * - Total stars, words mastered, mastery %, total attempts
 * - Color-coded gradient per metric
 *
 * Props:
 * - stats: ProfileStatsDTO with aggregated statistics
 */

import StatCard from "@/components/StatCard";
import type { ProfileStatsDTO } from "@/types";

interface StatsOverviewProps {
  stats: ProfileStatsDTO;
}

export default function StatsOverview({ stats }: StatsOverviewProps) {
  // Format mastery percentage to 1 decimal place
  const masteryPercentage = stats.mastery_percentage.toFixed(1);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Total Stars */}
      <StatCard
        icon="⭐"
        value={stats.total_stars}
        label="Gwiazdek"
        gradient="bg-gradient-to-br from-yellow-400 to-orange-500"
      />

      {/* Words Mastered */}
      <StatCard
        icon="🎯"
        value={stats.words_mastered}
        label="Słów opanowanych"
        gradient="bg-gradient-to-br from-green-400 to-emerald-600"
      />

      {/* Mastery Percentage */}
      <StatCard
        icon="📊"
        value={`${masteryPercentage}%`}
        label="Postęp"
        gradient="bg-gradient-to-br from-blue-400 to-indigo-600"
      />

      {/* Total Attempts */}
      <StatCard
        icon="🎮"
        value={stats.total_words_attempted}
        label="Słów próbowanych"
        gradient="bg-gradient-to-br from-purple-400 to-pink-600"
      />
    </div>
  );
}
