/**
 * QuestionCard Component
 *
 * Displays current question with image and answer options.
 *
 * Features:
 * - Large word image (400x300px)
 * - Answer buttons below image
 * - Visual feedback on answer selection
 *
 * Props:
 * - word: Current GameWordDTO to display
 * - answerOptions: 3 answer options (1 correct + 2 distractors)
 * - onAnswer: Callback when answer is selected
 * - onCorrectAnswer: Callback when correct answer is given (to trigger next question)
 * - attempts: Number of attempts for this question
 */

import { useCallback, useState } from "react";
import type { GameWordDTO } from "@/types";
import AnswerButtons, { type AnswerOption } from "@/components/AnswerButtons";

interface QuestionCardProps {
  word: GameWordDTO;
  answerOptions: AnswerOption[];
  onAnswer: (selectedText: string) => void;
  onCorrectAnswer: () => void;
  attempts: number;
}

export default function QuestionCard({
  word,
  answerOptions,
  onAnswer,
  onCorrectAnswer,
  attempts,
}: QuestionCardProps) {
  // ===================================================================
  // STATE
  // ===================================================================

  const [isTransitioning, setIsTransitioning] = useState(false);

  // ===================================================================
  // HANDLERS
  // ===================================================================

  /**
   * Handle answer selection
   */
  const handleAnswer = useCallback(
    (selectedText: string, isCorrect: boolean) => {
      // Call parent callback
      onAnswer(selectedText);

      // If correct, trigger transition to next question
      if (isCorrect) {
        setIsTransitioning(true);

        // Delay for feedback animation (1 second)
        setTimeout(() => {
          onCorrectAnswer();
          setIsTransitioning(false);
        }, 1500);
      }
    },
    [onAnswer, onCorrectAnswer]
  );

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 md:space-y-8">
      {/* Word Image */}
      <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-lg md:p-6">
        <img
          src={word.image_url}
          alt="Co to jest?"
          className="mx-auto h-auto w-full max-w-md rounded-lg object-cover"
          onError={(e) => {
            // Fallback if image fails to load
            e.currentTarget.src = "https://via.placeholder.com/400x300?text=Obrazek";
          }}
        />
      </div>

      {/* Instruction Text */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-purple-800 md:text-3xl">Co widzisz na obrazku?</h2>
        {attempts > 0 && (
          <p className="mt-2 text-lg text-purple-600">
            Spróbuj ponownie! ({attempts} {attempts === 1 ? "próba" : "próby"})
          </p>
        )}
      </div>

      {/* Answer Buttons */}
      <AnswerButtons options={answerOptions} onAnswer={handleAnswer} disabled={isTransitioning} />
    </div>
  );
}
