/**
 * CategoryProgressChart Component
 *
 * Chart displaying progress for all vocabulary categories.
 *
 * Features:
 * - List of 5 categories with progress bars
 * - Sorted by completion percentage (highest first)
 * - Overall progress summary at top
 *
 * Props:
 * - categoryProgress: CategoryProgressDTO with all categories
 */

import CategoryProgressBar from "@/components/CategoryProgressBar";
import type { CategoryProgressDTO } from "@/types";
import { useMemo } from "react";

interface CategoryProgressChartProps {
  categoryProgress: CategoryProgressDTO;
}

export default function CategoryProgressChart({ categoryProgress }: CategoryProgressChartProps) {
  // Sort categories by completion percentage (highest first)
  const sortedCategories = useMemo(() => {
    return [...categoryProgress.categories].sort((a, b) => b.completion_percentage - a.completion_percentage);
  }, [categoryProgress.categories]);

  const overallPercentage = categoryProgress.overall.completion_percentage.toFixed(1);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h2 className="mb-2 text-2xl font-bold text-purple-800">Postęp w kategoriach</h2>
        <p className="text-lg text-purple-600">
          Ogółem: <span className="font-semibold">{categoryProgress.overall.mastered_words}</span> /{" "}
          {categoryProgress.overall.total_words} słów ({overallPercentage}%)
        </p>
      </div>

      {/* Category Bars */}
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <CategoryProgressBar key={category.category} category={category} />
        ))}
      </div>
    </div>
  );
}
