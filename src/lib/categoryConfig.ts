/**
 * Category Configuration
 *
 * Defines visual styling and metadata for vocabulary categories
 */

/**
 * Category icon mapping (emoji)
 */
export const CATEGORY_ICONS: Record<string, string> = {
  zwierzeta: "🐾",
  owoce_warzywa: "🍎",
  pojazdy: "🚗",
  kolory_ksztalty: "🎨",
  przedmioty_codzienne: "🏠",
};

/**
 * Category color scheme (Tailwind gradient classes)
 */
export interface CategoryColors {
  from: string;
  to: string;
  hover: string;
}

export const CATEGORY_COLORS: Record<string, CategoryColors> = {
  zwierzeta: {
    from: "from-green-400",
    to: "to-teal-400",
    hover: "hover:from-green-500 hover:to-teal-500",
  },
  owoce_warzywa: {
    from: "from-yellow-400",
    to: "to-orange-400",
    hover: "hover:from-yellow-500 hover:to-orange-500",
  },
  pojazdy: {
    from: "from-blue-400",
    to: "to-indigo-400",
    hover: "hover:from-blue-500 hover:to-indigo-500",
  },
  kolory_ksztalty: {
    from: "from-pink-400",
    to: "to-purple-400",
    hover: "hover:from-pink-500 hover:to-purple-500",
  },
  przedmioty_codzienne: {
    from: "from-gray-400",
    to: "to-slate-400",
    hover: "hover:from-gray-500 hover:to-slate-500",
  },
};

/**
 * Get icon for category
 */
export function getCategoryIcon(categoryCode: string): string {
  return CATEGORY_ICONS[categoryCode] || "📚";
}

/**
 * Get colors for category
 */
export function getCategoryColors(categoryCode: string): CategoryColors {
  return (
    CATEGORY_COLORS[categoryCode] || {
      from: "from-gray-400",
      to: "to-gray-500",
      hover: "hover:from-gray-500 hover:to-gray-600",
    }
  );
}
