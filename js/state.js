/**
 * @typedef {import("./api.js").Recipe} Recipe
 */

export const state = {
  recipes: /** @type {Recipe[]} */ ([]),
  activeSlug: /** @type {string | null} */ (null),
  mealFilter: "all",
  selectedKeywords: new Set(),
  keywordMatchMode: /** @type {"all" | "any"} */ ("all"),
  searchText: "",
  favorites: new Set(),
  showFavoritesOnly: false,
};

export function getAllKeywords() {
  const set = new Set();
  for (const recipe of state.recipes) {
    if (Array.isArray(recipe.keywords)) {
      for (const kw of recipe.keywords) set.add(kw);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function getFilteredRecipes() {
  const mealFilter = state.mealFilter;
  const q = state.searchText.toLowerCase();
  const selected = Array.from(state.selectedKeywords);

  return state.recipes.filter((recipe) => {
    if (state.showFavoritesOnly && !state.favorites.has(recipe.slug))
      return false;

    if (mealFilter !== "all") {
      if (!Array.isArray(recipe.meals) || !recipe.meals.includes(mealFilter))
        return false;
    }

    if (selected.length > 0) {
      const kws = new Set(recipe.keywords || []);
      if (state.keywordMatchMode === "all") {
        for (const kw of selected) {
          if (!kws.has(kw)) return false;
        }
      } else {
        // any
        let hit = false;
        for (const kw of selected) {
          if (kws.has(kw)) {
            hit = true;
            break;
          }
        }
        if (!hit) return false;
      }
    }

    if (q) {
      const haystackParts = [
        recipe.title || "",
        recipe.description || "",
        ...(recipe.ingredients || []),
        ...(recipe.steps || []),
      ];
      const haystack = haystackParts.join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}
