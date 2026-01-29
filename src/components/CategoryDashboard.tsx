/**
 * CategoryDashboard Component
 *
 * Main container for category selection view
 *
 * Features:
 * - Loads categories and progress
 * - Displays ProfileHeader
 * - Renders CategoryGrid with CategoryCards
 * - Handles loading and error states
 * - Manages category selection
 *
 * State managed by useCategoriesManager hook
 */

import { useCategoriesManager } from "@/components/hooks/useCategoriesManager";
import ProfileHeader from "@/components/ProfileHeader";
import CategoryGrid from "@/components/CategoryGrid";
import CategoryCard from "@/components/CategoryCard";
import { Button } from "@/components/ui/button";

export default function CategoryDashboard() {
  // ===================================================================
  // STATE
  // ===================================================================

  const { categories, progress, isLoading, error, selectedProfile, selectCategory, goBackToProfiles, refetch } =
    useCategoriesManager();

  // ===================================================================
  // ERROR STATE
  // ===================================================================

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg bg-white p-8 shadow-md">
        <div className="text-6xl">😕</div>
        <h2 className="text-2xl font-bold text-gray-800">Ups! Coś poszło nie tak</h2>
        <p className="text-center text-gray-600">{error}</p>
        <div className="flex gap-3">
          <Button onClick={refetch} className="bg-purple-600 hover:bg-purple-700">
            Spróbuj ponownie
          </Button>
          {error.includes("profil") && (
            <Button onClick={goBackToProfiles} variant="outline">
              Wybierz profil
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ===================================================================
  // LOADING STATE
  // ===================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="text-lg font-medium text-purple-600">Ładowanie kategorii...</p>
        </div>
      </div>
    );
  }

  // ===================================================================
  // NO PROFILE STATE
  // ===================================================================

  if (!selectedProfile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg bg-white p-8 shadow-md">
        <div className="text-6xl">👤</div>
        <h2 className="text-2xl font-bold text-gray-800">Nie wybrano profilu</h2>
        <p className="text-center text-gray-600">Wybierz profil, aby rozpocząć grę</p>
        <Button onClick={goBackToProfiles} className="bg-purple-600 hover:bg-purple-700">
          Wybierz profil
        </Button>
      </div>
    );
  }

  // ===================================================================
  // NO CATEGORIES STATE
  // ===================================================================

  if (categories.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg bg-white p-8 shadow-md">
        <div className="text-6xl">📚</div>
        <h2 className="text-2xl font-bold text-gray-800">Brak kategorii</h2>
        <p className="text-center text-gray-600">Nie znaleziono dostępnych kategorii słownictwa</p>
        <Button onClick={refetch} className="bg-purple-600 hover:bg-purple-700">
          Odśwież
        </Button>
      </div>
    );
  }

  // ===================================================================
  // MAIN VIEW
  // ===================================================================

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <ProfileHeader profile={selectedProfile} onBack={goBackToProfiles} />

      {/* Title */}
      <div className="text-center">
        <h1 className="mb-2 text-4xl font-bold text-purple-800 md:text-5xl">Wybierz kategorię</h1>
        <p className="text-lg text-purple-600">Która kategoria Cię dziś interesuje?</p>
      </div>

      {/* Categories Grid */}
      <CategoryGrid>
        {categories.map((category) => {
          // Find progress for this category
          const categoryProgress = progress?.categories.find((p) => p.category === category.code) || null;

          return (
            <CategoryCard key={category.code} category={category} progress={categoryProgress} onSelect={selectCategory} />
          );
        })}
      </CategoryGrid>

      {/* Overall Progress (Optional) */}
      {progress && (
        <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-2 text-lg font-semibold text-gray-800">Całkowity postęp</h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-purple-600">
              {progress.overall.mastered_words}/{progress.overall.total_words}
            </div>
            <div className="flex-1">
              <div className="h-4 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                  style={{ width: `${progress.overall.completion_percentage}%` }}
                />
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-600">
              {progress.overall.completion_percentage.toFixed(0)}%
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
