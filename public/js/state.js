// public/js/state.js

/**
 * @typedef {import("./api.js").Recipe} Recipe
 */

export const state = {
  recipes: /** @type {Recipe[]} */ ([]),
  activeSlug: /** @type {string | null} */ (null),
  mealFilter: "all",
  selectedKeywords: new Set(),
  searchText: "",
  favorites: new Set(), // slugs
  showFavoritesOnly: false,
};

/**
 * Collect all distinct keywords across recipes.
 * @returns {string[]}
 */
export function getAllKeywords() {
  const set = new Set();
  for (const recipe of state.recipes) {
    if (Array.isArray(recipe.keywords)) {
      for (const kw of recipe.keywords) {
        set.add(kw);
      }
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Return recipes matching current filters in state.
 * @returns {Recipe[]}
 */
export function getFilteredRecipes() {
  const mealFilter = state.mealFilter;
  const q = state.searchText.toLowerCase();

  return state.recipes.filter((recipe) => {
    // favourites-only
    if (state.showFavoritesOnly && !state.favorites.has(recipe.slug)) {
      return false;
    }

    // meal filter
    if (mealFilter !== "all") {
      if (!Array.isArray(recipe.meals) || !recipe.meals.includes(mealFilter)) {
        return false;
      }
    }

    // keyword filter: require ALL selected keywords
    if (state.selectedKeywords.size > 0) {
      const kws = new Set(recipe.keywords || []);
      for (const kw of state.selectedKeywords) {
        if (!kws.has(kw)) return false;
      }
    }

    // search filter
    if (q) {
      const haystackParts = [
        recipe.title || "",
        recipe.description || "",
        ...(recipe.ingredients || []),
        ...(recipe.steps || []),
      ];
      const haystack = haystackParts.join(" ").toLowerCase();
      if (!haystack.includes(q)) {
        return false;
      }
    }

    return true;
  });
}
