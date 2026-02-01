/**
 * ProgressDashboard Component
 *
 * Main container for progress statistics view.
 * Orchestrates all sub-components and data fetching.
 *
 * Features:
 * - Profile selector (if multiple profiles)
 * - Stats overview (4 key metrics)
 * - Category progress chart
 * - Mastered words list
 * - Loading/error states
 * - Empty state (no progress yet)
 *
 * Props:
 * - initialProfileId: Optional initial profile ID from URL
 */

import { useProgressStats } from "@/components/hooks/useProgressStats";
import ProfileSelector from "@/components/ProfileSelector";
import StatsOverview from "@/components/StatsOverview";
import CategoryProgressChart from "@/components/CategoryProgressChart";
import MasteredWordsList from "@/components/MasteredWordsList";
import { Button } from "@/components/ui/button";

interface ProgressDashboardProps {
  initialProfileId?: string | null;
}

export default function ProgressDashboard({ initialProfileId }: ProgressDashboardProps) {
  // ===================================================================
  // HOOK
  // ===================================================================

  const {
    profiles,
    selectedProfileId,
    stats,
    categoryProgress,
    masteredWords,
    isLoading,
    error,
    selectProfile,
    refetch,
  } = useProgressStats(initialProfileId);

  // ===================================================================
  // LOADING STATE
  // ===================================================================

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-8 border-purple-200 border-t-purple-600"></div>
          <p className="text-xl font-semibold text-purple-600">Ładowanie statystyk...</p>
        </div>
      </div>
    );
  }

  // ===================================================================
  // ERROR STATE
  // ===================================================================

  if (error) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <div className="mb-4 text-6xl">😞</div>
          <h2 className="mb-2 text-2xl font-bold text-red-800">Ups! Coś poszło nie tak</h2>
          <p className="mb-6 text-red-600">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={refetch} className="bg-red-600 hover:bg-red-700">
              Spróbuj ponownie
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/profiles")}>
              Powrót do profili
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================================
  // NO PROFILES STATE
  // ===================================================================

  if (profiles.length === 0) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-4 text-6xl">👶</div>
          <h2 className="mb-2 text-2xl font-bold text-purple-800">Brak profili</h2>
          <p className="mb-6 text-lg text-purple-600">Utwórz profil dziecka, aby śledzić postępy!</p>
          <Button onClick={() => (window.location.href = "/profiles")} className="bg-purple-600 hover:bg-purple-700">
            Dodaj profil
          </Button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // EMPTY STATE (NO PROGRESS YET)
  // ===================================================================

  if (stats && stats.total_words_attempted === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        {/* Profile Selector */}
        <ProfileSelector profiles={profiles} selectedProfileId={selectedProfileId} onSelect={selectProfile} />

        {/* Empty State */}
        <div className="flex min-h-[400px] items-center justify-center rounded-2xl bg-white p-8 shadow-lg">
          <div className="text-center">
            <div className="mb-4 text-6xl">📚</div>
            <h2 className="mb-2 text-2xl font-bold text-purple-800">Jeszcze nie rozpoczęto gry</h2>
            <p className="mb-6 text-lg text-purple-600">Wybierz kategorię i zacznij naukę, aby zobaczyć statystyki!</p>
            <Button
              onClick={() => (window.location.href = "/game/categories")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Rozpocznij grę
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================================
  // MAIN RENDER (WITH DATA)
  // ===================================================================

  if (!stats || !categoryProgress) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* Header with Profile Selector */}
      <div>
        <h1 className="mb-4 text-3xl font-bold text-purple-800 md:text-4xl">Statystyki postępów</h1>
        <ProfileSelector profiles={profiles} selectedProfileId={selectedProfileId} onSelect={selectProfile} />
      </div>

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Category Progress Chart */}
      <CategoryProgressChart categoryProgress={categoryProgress} />

      {/* Mastered Words List */}
      <MasteredWordsList words={masteredWords} />

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
        <Button
          onClick={() => (window.location.href = "/game/categories")}
          className="bg-purple-600 hover:bg-purple-700"
        >
          🎮 Kontynuuj naukę
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/profiles?switch=true")}>
          👥 Zmień profil
        </Button>
      </div>
    </div>
  );
}
