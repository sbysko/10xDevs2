/**
 * ParentalGateModal Component
 *
 * Modal that prevents children from accessing profile management features.
 * Uses a simple math challenge (addition) to verify adult access.
 *
 * Features:
 * - Random math question (numbers 1-20)
 * - Numeric keypad for answer input
 * - Validates answer before calling onSuccess
 * - Regenerates question on wrong answer
 *
 * Security Note:
 * This is a UX pattern, not a security feature. Real authorization
 * happens at the API level with JWT tokens.
 *
 * Props:
 * - isOpen: Whether modal is visible
 * - onSuccess: Callback when correct answer is entered
 * - onClose: Callback to close modal
 */

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ParentalGateModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

/**
 * Math challenge structure
 */
interface MathChallenge {
  num1: number;
  num2: number;
  answer: number;
}

/**
 * Generate random math challenge
 */
function generateChallenge(): MathChallenge {
  const num1 = Math.floor(Math.random() * 20) + 1; // 1-20
  const num2 = Math.floor(Math.random() * 20) + 1; // 1-20

  return {
    num1,
    num2,
    answer: num1 + num2,
  };
}

export default function ParentalGateModal({ isOpen, onSuccess, onClose }: ParentalGateModalProps) {
  // ===================================================================
  // STATE
  // ===================================================================

  const [challenge, setChallenge] = useState<MathChallenge>(generateChallenge());
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");

  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setChallenge(generateChallenge());
      setUserAnswer("");
      setError("");
    }
  }, [isOpen]);

  // ===================================================================
  // HANDLERS
  // ===================================================================

  /**
   * Handle number button click
   */
  const handleNumberClick = useCallback((digit: number) => {
    setUserAnswer((prev) => prev + digit.toString());
    setError("");
  }, []);

  /**
   * Handle backspace
   */
  const handleBackspace = useCallback(() => {
    setUserAnswer((prev) => prev.slice(0, -1));
    setError("");
  }, []);

  /**
   * Handle clear
   */
  const handleClear = useCallback(() => {
    setUserAnswer("");
    setError("");
  }, []);

  /**
   * Handle submit answer
   */
  const handleSubmit = useCallback(() => {
    const answer = parseInt(userAnswer, 10);

    if (isNaN(answer)) {
      setError("Wpisz liczbę");
      return;
    }

    if (answer === challenge.answer) {
      // Correct! Close modal and call success callback
      onSuccess();
    } else {
      // Wrong answer - generate new challenge
      setError("Nieprawidłowa odpowiedź. Spróbuj ponownie.");
      setChallenge(generateChallenge());
      setUserAnswer("");
    }
  }, [userAnswer, challenge.answer, onSuccess]);

  /**
   * Handle Enter key press
   */
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Backspace") {
        handleBackspace();
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, handleBackspace, onClose]
  );

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyPress}>
        <DialogHeader>
          <DialogTitle className="text-2xl">Weryfikacja rodzica</DialogTitle>
          <DialogDescription>Rozwiąż proste zadanie matematyczne, aby kontynuować</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Math Question */}
          <div className="rounded-lg bg-purple-50 p-6 text-center">
            <p className="mb-2 text-lg text-purple-700">Ile to jest?</p>
            <p className="text-4xl font-bold text-purple-900">
              {challenge.num1} + {challenge.num2} = ?
            </p>
          </div>

          {/* Answer Display */}
          <div className="relative">
            <div className="rounded-lg border-2 border-purple-300 bg-white p-4 text-center text-3xl font-bold text-purple-900">
              {userAnswer || "\u00A0"}
            </div>
            {userAnswer && (
              <button
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-purple-600 hover:bg-purple-100"
                aria-label="Wyczyść"
              >
                <X size={20} />
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && <div className="rounded-lg bg-red-50 p-3 text-center text-red-700">{error}</div>}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="rounded-lg bg-purple-100 p-4 text-2xl font-bold text-purple-900 transition-colors hover:bg-purple-200 active:bg-purple-300"
              >
                {num}
              </button>
            ))}

            {/* Bottom Row */}
            <button
              onClick={handleBackspace}
              className="rounded-lg bg-gray-100 p-4 text-lg font-semibold text-gray-700 transition-colors hover:bg-gray-200 active:bg-gray-300"
            >
              ←
            </button>
            <button
              onClick={() => handleNumberClick(0)}
              className="rounded-lg bg-purple-100 p-4 text-2xl font-bold text-purple-900 transition-colors hover:bg-purple-200 active:bg-purple-300"
            >
              0
            </button>
            <button
              onClick={handleSubmit}
              className="rounded-lg bg-green-600 p-4 text-lg font-semibold text-white transition-colors hover:bg-green-700 active:bg-green-800"
            >
              ✓
            </button>
          </div>

          {/* Cancel Button */}
          <button
            onClick={onClose}
            className="w-full rounded-lg border-2 border-gray-300 p-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Anuluj
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
