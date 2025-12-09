/**
 * @typedef {Object} Macros
 * @property {number=} calories
 * @property {number=} protein
 * @property {number=} carbs
 * @property {number=} fat
 * @property {number=} fiber
 */

/**
 * @typedef {Object} Recipe
 * @property {string} slug
 * @property {string} title
 * @property {string} description
 * @property {string[]} ingredients
 * @property {string[]} steps
 * @property {string[]=} keywords
 * @property {string[]=} meals
 * @property {number=} totalWeightGrams
 * @property {Macros=} macros
 */

/**
 * Fetch recipes from recipes.json.
 * @returns {Promise<Recipe[]>}
 */
export async function loadRecipes() {
  const res = await fetch("recipes.json");
  if (!res.ok) {
    throw new Error("Failed to load recipes.json");
  }
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
