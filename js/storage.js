// public/js/storage.js

const STORAGE_KEY_FILTERS = "recipeFilters";
const STORAGE_KEY_FAVORITES = "recipeFavorites";

/**
 * @returns {{meal:string, keywords:string[], q:string, favOnly:boolean}|null}
 */
export function readFiltersFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FILTERS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      meal: typeof parsed.meal === "string" ? parsed.meal : "all",
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      q: typeof parsed.q === "string" ? parsed.q : "",
      favOnly: Boolean(parsed.favOnly),
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} meal
 * @param {Set<string>} keywordsSet
 * @param {string} q
 * @param {boolean} favOnly
 */
export function saveFiltersToStorage(meal, keywordsSet, q, favOnly) {
  try {
    const data = {
      meal,
      keywords: Array.from(keywordsSet),
      q,
      favOnly,
    };
    localStorage.setItem(STORAGE_KEY_FILTERS, JSON.stringify(data));
  } catch {
    // ignore
  }
}

/**
 * @returns {Set<string>}
 */
export function readFavoritesFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set();
    return new Set(arr);
  } catch {
    return new Set();
  }
}

/**
 * @param {Set<string>} favsSet
 */
export function saveFavoritesToStorage(favsSet) {
  try {
    const arr = Array.from(favsSet);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(arr));
  } catch {
    // ignore
  }
}
