/**
 * useGameSession Hook
 *
 * Custom hook for managing game session state and logic.
 *
 * Responsibilities:
 * - Create game session via API
 * - Manage current question index
 * - Generate answer options (1 correct + 2 distractors)
 * - Track answers and attempts
 * - Calculate stars based on attempts
 * - Batch save progress at session end
 *
 * Used in: GameSessionManager component
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import type { GameSessionDTO, GameWordDTO } from "@/types";

/**
 * Game session state
 */
export interface GameState {
  session: GameSessionDTO | null;
  currentQuestionIndex: number;
  answers: AnswerRecord[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook return type
 */
export interface UseGameSessionReturn {
  // State
  session: GameSessionDTO | null;
  currentWord: GameWordDTO | null;
  currentQuestionIndex: number;
  totalQuestions: number;
  answerOptions: AnswerOption[];
  currentAttempts: number;
  answers: AnswerRecord[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  submitAnswer: (selectedText: string) => void;
  nextQuestion: () => void;
  restartSession: () => void;
  goToCategories: () => void;
}

/**
 * Answer option for question
 */
export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

/**
 * Answer record for progress tracking
 */
export interface AnswerRecord {
  vocabulary_id: string;
  is_correct: boolean;
  attempt_number: number;
  stars_earned: number;
}

/**
 * Custom hook for managing game session
 *
 * @param profileId - UUID of child profile
 * @param category - Optional vocabulary category filter
 * @returns Game session state and actions
 *
 * @example
 * ```tsx
 * const {
 *   currentWord,
 *   answerOptions,
 *   submitAnswer,
 *   nextQuestion,
 *   isComplete
 * } = useGameSession(profileId, 'zwierzeta');
 * ```
 */
export function useGameSession(profileId: string | null, category: string | null = null): UseGameSessionReturn {
  // ===================================================================
  // STATE
  // ===================================================================

  const [session, setSession] = useState<GameSessionDTO | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [currentAttempts, setCurrentAttempts] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ===================================================================
  // COMPUTED VALUES
  // ===================================================================

  const currentWord = useMemo(() => {
    if (!session || currentQuestionIndex >= session.words.length) {
      return null;
    }
    return session.words[currentQuestionIndex];
  }, [session, currentQuestionIndex]);

  const totalQuestions = session?.word_count ?? 0;

  // ===================================================================
  // ANSWER OPTIONS GENERATION
  // ===================================================================

  const answerOptions = useMemo(() => {
    if (!currentWord || !session) {
      return [];
    }

    return generateAnswerOptions(currentWord, session.words);
  }, [currentWord, session]);

  // ===================================================================
  // API FUNCTIONS
  // ===================================================================

  /**
   * Create game session via API
   */
  const createSession = useCallback(async () => {
    if (!profileId) {
      setError("Brak wybranego profilu");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/game/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          profile_id: profileId,
          category: category,
          word_count: 10,
        }),
      });

      if (!response.ok) {
        // Handle error responses
        const errorData = await response.json();

        if (response.status === 422) {
          // Insufficient words
          throw new Error(
            errorData.message ||
              `Za mało słów w tej kategorii (dostępne: ${errorData.available}, wymagane: ${errorData.requested})`
          );
        }

        if (response.status === 401) {
          throw new Error("Musisz być zalogowany");
        }

        if (response.status === 404) {
          throw new Error("Profil nie został znaleziony");
        }

        throw new Error(errorData.message || "Nie udało się utworzyć sesji");
      }

      const sessionData: GameSessionDTO = await response.json();
      setSession(sessionData);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setCurrentAttempts(0);
      setIsComplete(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      setError(errorMessage);
      // eslint-disable-next-line no-console
      console.error("Error creating game session:", err);
    } finally {
      setIsLoading(false);
    }
  }, [profileId, category]);

  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Create session on mount
  useEffect(() => {
    createSession();
  }, [createSession]);

  // ===================================================================
  // GAME ACTIONS
  // ===================================================================

  /**
   * Submit answer for current question
   */
  const submitAnswer = useCallback(
    (selectedText: string) => {
      if (!currentWord || isComplete) {
        return;
      }

      const isCorrect = selectedText === currentWord.word_text;
      const attemptNumber = currentAttempts + 1;

      if (isCorrect) {
        // Calculate stars based on attempts (3/2/1)
        const starsEarned = attemptNumber === 1 ? 3 : attemptNumber === 2 ? 2 : 1;

        // Record answer
        const answerRecord: AnswerRecord = {
          vocabulary_id: currentWord.id,
          is_correct: true,
          attempt_number: attemptNumber,
          stars_earned: starsEarned,
        };

        setAnswers((prev) => [...prev, answerRecord]);

        // Reset attempts for next question
        setCurrentAttempts(0);

        // Check if this was the last question
        if (currentQuestionIndex >= totalQuestions - 1) {
          // Session complete!
          setIsComplete(true);
          // Save progress will be triggered by ResultsModal
        }
      } else {
        // Incorrect answer - increment attempts
        setCurrentAttempts((prev) => prev + 1);
      }
    },
    [currentWord, currentAttempts, currentQuestionIndex, totalQuestions, isComplete]
  );

  /**
   * Move to next question
   */
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setCurrentAttempts(0);
    }
  }, [currentQuestionIndex, totalQuestions]);

  /**
   * Restart session (create new session in same category)
   */
  const restartSession = useCallback(() => {
    setSession(null);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setCurrentAttempts(0);
    setIsComplete(false);
    createSession();
  }, [createSession]);

  /**
   * Navigate back to categories
   */
  const goToCategories = useCallback(() => {
    window.location.href = "/game/categories";
  }, []);

  // ===================================================================
  // RETURN
  // ===================================================================

  return {
    // State
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

    // Actions
    submitAnswer,
    nextQuestion,
    restartSession,
    goToCategories,
  };
}

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

/**
 * Generate answer options (1 correct + 2 distractors)
 *
 * Logic:
 * - Correct answer: current word
 * - 2 distractors: random words from same category
 * - Shuffle final array
 *
 * @param correctWord - The correct word for this question
 * @param allWords - All words in the session
 * @returns Array of 3 answer options in random order
 */
function generateAnswerOptions(correctWord: GameWordDTO, allWords: GameWordDTO[]): AnswerOption[] {
  // Filter words from same category (excluding current word)
  const sameCategory = allWords.filter((w) => w.category === correctWord.category && w.id !== correctWord.id);

  // Pick 2 random distractors
  const shuffled = [...sameCategory].sort(() => Math.random() - 0.5);
  const distractors = shuffled.slice(0, 2);

  // Combine with correct answer
  const options: AnswerOption[] = [
    { text: correctWord.word_text, isCorrect: true },
    ...distractors.map((d) => ({ text: d.word_text, isCorrect: false })),
  ];

  // Shuffle options so correct answer is not always first
  return options.sort(() => Math.random() - 0.5);
}
