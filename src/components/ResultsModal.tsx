/**
 * ResultsModal Component
 *
 * Modal displaying session results after completing all questions.
 *
 * Features:
 * - Total stars earned
 * - Number of newly mastered words
 * - "Play Again" button (new session in same category)
 * - "Change Category" button (back to categories)
 * - Confetti animation for great performance
 *
 * Props:
 * - isOpen: Whether modal is visible
 * - totalStars: Total stars earned in session
 * - newlyMastered: Number of newly mastered words
 * - onPlayAgain: Callback to restart session
 * - onChangeCategory: Callback to go back to categories
 */

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ResultsModalProps {
  isOpen: boolean;
  totalStars: number;
  newlyMastered: number;
  onPlayAgain: () => void;
  onChangeCategory: () => void;
}

export default function ResultsModal({
  isOpen,
  totalStars,
  newlyMastered,
  onPlayAgain,
  onChangeCategory,
}: ResultsModalProps) {
  // ===================================================================
  // EFFECTS
  // ===================================================================

  // Trigger confetti animation for excellent performance
  useEffect(() => {
    if (isOpen && totalStars >= 25) {
      // 25+ stars = at least 8-9 words correct on first try
      // TODO: Add confetti library (e.g., canvas-confetti)
      console.log("🎉 Confetti! Excellent performance!");
    }
  }, [isOpen, totalStars]);

  // ===================================================================
  // PERFORMANCE MESSAGE
  // ===================================================================

  const getPerformanceMessage = () => {
    if (totalStars >= 28) {
      return "Niesamowite! Jesteś mistrzem! 🏆";
    } else if (totalStars >= 25) {
      return "Świetna robota! 🌟";
    } else if (totalStars >= 20) {
      return "Bardzo dobrze! 👍";
    } else if (totalStars >= 15) {
      return "Dobra robota! ⭐";
    } else {
      return "Trening czyni mistrza! 💪";
    }
  };

  // ===================================================================
  // RENDER
  // ===================================================================

  return (
    <Dialog open={isOpen} onOpenChange={() => undefined} modal>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold text-purple-800">Koniec gry!</DialogTitle>
          <DialogDescription className="sr-only">Podsumowanie wyników sesji gry</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Performance Message */}
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-700">{getPerformanceMessage()}</p>
          </div>

          {/* Total Stars */}
          <div className="rounded-lg bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 text-center">
            <div className="mb-2 text-5xl">⭐</div>
            <div className="text-4xl font-bold text-yellow-700">{totalStars}</div>
            <div className="mt-1 text-lg font-semibold text-yellow-800">
              {totalStars === 1 ? "gwiazdka" : totalStars < 5 ? "gwiazdki" : "gwiazdek"}
            </div>
          </div>

          {/* Newly Mastered Words */}
          {newlyMastered > 0 && (
            <div className="rounded-lg bg-gradient-to-br from-green-100 to-green-200 p-4 text-center">
              <div className="mb-2 text-4xl">🎯</div>
              <div className="text-2xl font-bold text-green-700">
                {newlyMastered} {newlyMastered === 1 ? "nowe słowo" : "nowe słowa"}!
              </div>
              <div className="mt-1 text-sm font-semibold text-green-800">
                {newlyMastered === 1 ? "Opanowałeś" : "Opanowałeś"} je!
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button onClick={onPlayAgain} className="w-full bg-purple-600 py-6 text-xl font-bold hover:bg-purple-700">
              🎮 Graj ponownie
            </Button>
            <Button
              onClick={onChangeCategory}
              variant="outline"
              className="w-full border-2 border-purple-300 py-6 text-xl font-bold hover:bg-purple-50"
            >
              🔄 Zmień kategorię
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
