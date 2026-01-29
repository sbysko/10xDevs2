/**
 * Category Service
 *
 * Business logic for vocabulary categories
 * Handles fetching categories and progress data
 */

import type { SupabaseClient } from "@/db/supabase.client";
import type { CategoriesListDTO, CategoryDTO } from "@/types";

/**
 * Category names mapping (Polish)
 */
const CATEGORY_NAMES: Record<string, string> = {
  zwierzeta: "Zwierzęta",
  owoce_warzywa: "Owoce i Warzywa",
  pojazdy: "Pojazdy",
  kolory_ksztalty: "Kolory i Kształty",
  przedmioty_codzienne: "Przedmioty Codziennego Użytku",
};

/**
 * Get all available vocabulary categories with word counts
 *
 * @param supabase - Supabase client instance
 * @param languageCode - Language filter (default: 'pl')
 * @returns Promise<CategoriesListDTO>
 *
 * @example
 * const categories = await CategoryService.getAllCategories(supabase, 'pl');
 */
export async function getAllCategories(
  supabase: SupabaseClient,
  languageCode = "pl"
): Promise<CategoriesListDTO> {
  // Query vocabulary table to get word counts per category
  const { data, error } = await supabase
    .from("vocabulary")
    .select("category")
    .eq("language_code", languageCode);

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  if (!data || data.length === 0) {
    // No vocabulary words found - return empty structure
    return {
      categories: [],
      total_words: 0,
    };
  }

  // Count words per category
  const categoryCounts = data.reduce(
    (acc, row) => {
      const category = row.category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Build CategoryDTO array
  const categories: CategoryDTO[] = Object.entries(categoryCounts).map(([code, count]) => ({
    code: code as any, // vocabulary_category enum
    name: CATEGORY_NAMES[code] || code,
    word_count: count,
  }));

  // Calculate total words
  const total_words = categories.reduce((sum, cat) => sum + cat.word_count, 0);

  return {
    categories,
    total_words,
  };
}

/**
 * Category Service Export
 */
export const CategoryService = {
  getAllCategories,
  CATEGORY_NAMES,
};
