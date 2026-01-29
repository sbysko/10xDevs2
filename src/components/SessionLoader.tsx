/**
 * SessionLoader Component
 *
 * Loading screen displayed while game session is being created.
 * Shows spinner animation and friendly message to child.
 *
 * Features:
 * - Animated spinner
 * - Loading message: "Przygotowujemy pytania..."
 * - Category display (if selected)
 *
 * Props:
 * - category: Optional category name for display
 */

interface SessionLoaderProps {
  category?: string | null;
}

/**
 * Category name mapping (enum code -> Polish display name)
 */
const CATEGORY_NAMES: Record<string, string> = {
  zwierzeta: "Zwierzęta",
  owoce_warzywa: "Owoce i Warzywa",
  pojazdy: "Pojazdy",
  kolory_ksztalty: "Kolory i Kształty",
  przedmioty_codzienne: "Przedmioty Codzienne",
};

export default function SessionLoader({ category }: SessionLoaderProps) {
  const categoryName = category ? CATEGORY_NAMES[category] || category : null;

  return (
    <div className="flex min-h-[500px] flex-col items-center justify-center p-8">
      {/* Spinner Animation */}
      <div className="mb-8 h-20 w-20 animate-spin rounded-full border-8 border-purple-200 border-t-purple-600"></div>

      {/* Loading Message */}
      <h2 className="mb-4 text-2xl font-bold text-purple-800 md:text-3xl">Przygotowujemy pytania...</h2>

      {/* Category Info */}
      {categoryName && (
        <p className="text-lg text-purple-600 md:text-xl">
          Kategoria: <span className="font-semibold">{categoryName}</span>
        </p>
      )}

      {/* Fun Emoji Animation */}
      <div className="mt-8 animate-bounce text-6xl">🎮</div>
    </div>
  );
}
