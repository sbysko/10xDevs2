/**
 * AnswerButtons Component
 *
 * Three large buttons displaying answer options.
 * Provides visual feedback (correct/incorrect) after selection.
 *
 * Features:
 * - 3 answer options (1 correct + 2 distractors)
 * - Large, touch-friendly buttons
 * - Feedback animations (green for correct, red for incorrect)
 * - Disabled state after correct answer (prevent re-click during transition)
 *
 * Props:
 * - options: Array of answer options (text + isCorrect flag)
 * - onAnswer: Callback when answer is selected
 * - disabled: Whether buttons are disabled (during transition)
 */

import { useState, useCallback, useEffect } from "react";

export interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

interface AnswerButtonsProps {
  options: AnswerOption[];
  onAnswer: (selectedText: string, isCorrect: boolean) => void;
  disabled?: boolean;
}

export default function AnswerButtons({ options, onAnswer, disabled = false }: AnswerButtonsProps) {
  // ===================================================================
  // STATE
  // ===================================================================

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // ===================================================================
  // EFFECTS
  // ===================================================================

  /**
   * Reset selection state when options change (new question)
   */
  useEffect(() => {
    setSelectedIndex(null);
    setIsCorrect(null);
  }, [options]);

  // ===================================================================
  // HANDLERS
  // ===================================================================

  /**
   * Handle answer button click
   */
  const handleClick = useCallback(
    (option: AnswerOption, index: number) => {
      if (disabled || selectedIndex !== null) {
        return;
      }

      // Set selected state for visual feedback
      setSelectedIndex(index);
      setIsCorrect(option.isCorrect);

      // Call parent callback
      onAnswer(option.text, option.isCorrect);

      // Auto-reset after delay (if incorrect, allow retry)
      if (!option.isCorrect) {
        setTimeout(() => {
          setSelectedIndex(null);
          setIsCorrect(null);
        }, 1000);
      }
    },
    [disabled, selectedIndex, onAnswer]
  );

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <div className="grid grid-cols-1 gap-4 md:gap-6">
      {options.map((option, index) => {
        const isSelected = selectedIndex === index;
        const showCorrect = isSelected && isCorrect === true;
        const showIncorrect = isSelected && isCorrect === false;

        return (
          <button
            key={index}
            onClick={() => handleClick(option, index)}
            disabled={disabled || selectedIndex !== null}
            className={`
              group relative overflow-hidden rounded-2xl p-6 text-xl font-bold shadow-lg transition-all duration-300 disabled:cursor-not-allowed md:p-8 md:text-2xl
              ${
                showCorrect
                  ? "scale-105 bg-green-500 text-white"
                  : showIncorrect
                    ? "scale-95 bg-red-500 text-white"
                    : "bg-white text-purple-800 hover:scale-105 hover:shadow-xl active:scale-95"
              }
            `}
            aria-label={`Odpowiedź: ${option.text}`}
          >
            {/* Button Text */}
            <span className="relative z-10">{option.text}</span>

            {/* Hover Glow Effect (only when not selected) */}
            {!isSelected && (
              <div className="absolute inset-0 bg-purple-400 opacity-0 transition-opacity duration-300 group-hover:opacity-10"></div>
            )}

            {/* Feedback Icon */}
            {showCorrect && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-4xl">✓</span>}
            {showIncorrect && <span className="absolute right-6 top-1/2 -translate-y-1/2 text-4xl">✗</span>}
          </button>
        );
      })}
    </div>
  );
}
