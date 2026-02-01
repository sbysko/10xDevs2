/**
 * GameScreen Component
 *
 * Main game screen displaying current question and progress.
 *
 * Features:
 * - Progress bar at top
 * - Question card with image and answer options
 * - Handles question transitions
 *
 * Props:
 * - currentWord: Current GameWordDTO
 * - currentIndex: Current question index (0-based)
 * - totalQuestions: Total number of questions
 * - answerOptions: Answer options for current question
 * - currentAttempts: Number of attempts for current question
 * - totalStars: Total stars earned so far
 * - onAnswer: Callback when answer is selected
 * - onNextQuestion: Callback to move to next question
 */

import type { GameWordDTO } from "@/types";
import type { AnswerOption } from "@/components/AnswerButtons";
import ProgressBar from "@/components/ProgressBar";
import QuestionCard from "@/components/QuestionCard";

interface GameScreenProps {
  currentWord: GameWordDTO;
  currentIndex: number;
  totalQuestions: number;
  answerOptions: AnswerOption[];
  currentAttempts: number;
  totalStars: number;
  onAnswer: (selectedText: string) => void;
  onNextQuestion: () => void;
  onQuitGame?: () => void;
}

export default function GameScreen({
  currentWord,
  currentIndex,
  totalQuestions,
  answerOptions,
  currentAttempts,
  totalStars,
  onAnswer,
  onNextQuestion,
  onQuitGame,
}: GameScreenProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-8">
      {/* Header with Progress Bar and Quit Button */}
      <div className="flex items-center justify-between gap-4">
        {/* Progress Bar */}
        <div className="flex-1">
          <ProgressBar current={currentIndex + 1} total={totalQuestions} stars={totalStars} />
        </div>

        {/* Quit Button */}
        {onQuitGame && (
          <button
            onClick={onQuitGame}
            className="shrink-0 rounded-lg bg-red-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-red-600 active:bg-red-700 md:px-6 md:py-3"
            aria-label="Zakończ grę"
          >
            <span className="hidden md:inline">Zakończ</span>
            <span className="md:hidden">✕</span>
          </button>
        )}
      </div>

      {/* Question Card */}
      <QuestionCard
        word={currentWord}
        answerOptions={answerOptions}
        onAnswer={onAnswer}
        onCorrectAnswer={onNextQuestion}
        attempts={currentAttempts}
      />
    </div>
  );
}
