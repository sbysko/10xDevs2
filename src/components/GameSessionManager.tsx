/**
 * GameSessionManager Component
 *
 * Main container component for game session view.
 * Coordinates session creation, gameplay, and results.
 *
 * Features:
 * - Manages session lifecycle (loading, playing, complete)
 * - Displays appropriate UI for each state
 * - Handles transitions between questions
 * - Triggers progress save on completion
 * - Retrieves profileId from sessionStorage (client-side only)
 *
 * Props:
 * - category: Optional category filter (from URL query param)
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { useGameSession } from "@/components/hooks/useGameSession";
import SessionLoader from "@/components/SessionLoader";
import GameScreen from "@/components/GameScreen";
import ResultsModal from "@/components/ResultsModal";

interface GameSessionManagerProps {
  category: string | null;
}

export default function GameSessionManager({ category }: GameSessionManagerProps) {
  // ===================================================================
  // STATE - PROFILE ID FROM SESSION STORAGE
  // ===================================================================

  const [profileId, setProfileId] = useState<string | null>(null);

  // Get profileId from sessionStorage on mount (client-side only)
  useEffect(() => {
    const storedProfileId = sessionStorage.getItem("selectedProfileId");
    setProfileId(storedProfileId);
  }, []);
  // ===================================================================
  // HOOK
  // ===================================================================

  const {
    session,
    currentWord,
    currentQuestionIndex,
    totalQuestions,
    answerOptions,
    currentAttempts,
    answers,
    isComplete,
    isLoading,
    error,
    submitAnswer,
    nextQuestion,
    restartSession,
    goToCategories,
  } = useGameSession(profileId, category);

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  // Calculate total stars earned
  const totalStars = useMemo(() => {
    return answers.reduce((sum, answer) => sum + answer.stars_earned, 0);
  }, [answers]);

  // Calculate newly mastered words (is_correct = true)
  const newlyMastered = useMemo(() => {
    return answers.filter((a) => a.is_correct).length;
  }, [answers]);

  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Redirect to profiles if no profileId
  useEffect(() => {
    if (!profileId && !isLoading) {
      console.error("No profile ID found in sessionStorage");
      window.location.href = "/profiles";
    }
  }, [profileId, isLoading]);

  // Save progress when session is complete
  useEffect(() => {
    if (isComplete && answers.length > 0) {
      saveProgress();
    }
  }, [isComplete, answers.length, saveProgress]);

  // ===================================================================
  // API FUNCTIONS
  // ===================================================================

  /**
   * Save progress to backend (batch mode)
   */
  const saveProgress = useCallback(async () => {
    if (!profileId || answers.length === 0) {
      return;
    }

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profile_id: profileId,
          results: answers.map((a) => ({
            vocabulary_id: a.vocabulary_id,
            is_correct: a.is_correct,
            attempt_number: a.attempt_number,
          })),
        }),
      });

      if (!response.ok) {
        console.error("Failed to save progress:", await response.text());
        // Don't block UI - progress save is non-critical
        return;
      }

      const result = await response.json();
      console.log("Progress saved successfully:", result);
    } catch (err) {
      console.error("Error saving progress:", err);
      // Don't block UI - progress save is non-critical
    }
  }, [profileId, answers]);

  // ===================================================================
  // RENDER - LOADING STATE
  // ===================================================================

  if (isLoading) {
    return <SessionLoader category={category} />;
  }

  // ===================================================================
  // RENDER - ERROR STATE
  // ===================================================================

  if (error) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <div className="mb-4 text-5xl">😞</div>
          <h2 className="mb-2 text-xl font-bold text-red-800">Ups! Coś poszło nie tak</h2>
          <p className="mb-4 text-red-600">{error}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={restartSession}
              className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 active:bg-red-800"
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={goToCategories}
              className="flex-1 rounded-lg border-2 border-red-300 px-6 py-3 font-semibold text-red-700 transition-colors hover:bg-red-50"
            >
              Zmień kategorię
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===================================================================
  // RENDER - NO WORD (EDGE CASE)
  // ===================================================================

  if (!currentWord || !session) {
    return (
      <div className="flex min-h-[500px] items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 text-5xl">🤔</div>
          <h2 className="mb-2 text-xl font-bold text-purple-800">Brak pytań</h2>
          <p className="mb-4 text-purple-600">Nie znaleziono pytań dla tej sesji</p>
          <button
            onClick={goToCategories}
            className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-700"
          >
            Powrót do kategorii
          </button>
        </div>
      </div>
    );
  }

  // ===================================================================
  // RENDER - GAME SCREEN
  // ===================================================================

  return (
    <>
      <GameScreen
        currentWord={currentWord}
        currentIndex={currentQuestionIndex}
        totalQuestions={totalQuestions}
        answerOptions={answerOptions}
        currentAttempts={currentAttempts}
        totalStars={totalStars}
        onAnswer={submitAnswer}
        onNextQuestion={nextQuestion}
      />

      {/* Results Modal */}
      <ResultsModal
        isOpen={isComplete}
        totalStars={totalStars}
        newlyMastered={newlyMastered}
        onPlayAgain={restartSession}
        onChangeCategory={goToCategories}
      />
    </>
  );
}
