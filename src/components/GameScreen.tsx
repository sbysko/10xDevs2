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
}: GameScreenProps) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 p-4 md:p-8">
      {/* Progress Bar */}
      <ProgressBar current={currentIndex + 1} total={totalQuestions} stars={totalStars} />

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
