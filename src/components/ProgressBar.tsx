/**
 * ProgressBar Component
 *
 * Visual progress indicator for game session.
 * Shows current question number, progress bar, and total stars earned.
 *
 * Features:
 * - Question counter (e.g., "3/10")
 * - Visual progress bar (animated width)
 * - Total stars display (optional)
 *
 * Props:
 * - current: Current question number (1-based index)
 * - total: Total number of questions
 * - stars: Total stars earned so far (optional)
 */

interface ProgressBarProps {
  current: number;
  total: number;
  stars?: number;
}

export default function ProgressBar({ current, total, stars = 0 }: ProgressBarProps) {
  // Calculate percentage for progress bar width
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full space-y-3">
      {/* Top Row: Question Counter + Stars */}
      <div className="flex items-center justify-between">
        {/* Question Counter */}
        <div className="text-lg font-bold text-purple-800 md:text-xl">
          Pytanie {current}/{total}
        </div>

        {/* Stars Display */}
        {stars > 0 && (
          <div className="flex items-center gap-2 text-lg font-semibold text-yellow-600 md:text-xl">
            <span>⭐</span>
            <span>{stars}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-3 overflow-hidden rounded-full bg-purple-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={current}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Postęp: ${current} z ${total} pytań`}
        ></div>
      </div>
    </div>
  );
}
