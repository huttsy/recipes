// public/js/ui.js

import { loadRecipes } from "./api.js";
import { state, getFilteredRecipes } from "./state.js";
import { readStateFromUrl, writeStateToUrl } from "./router.js";
import {
  readFiltersFromStorage,
  saveFiltersToStorage,
  readFavoritesFromStorage,
} from "./storage.js";
import { buildMarkdown } from "./markdown.js";
import {
  mealFilterEl,
  searchInputEl,
  favoritesOnlyEl,
  randomButtonEl,
  printButtonEl,
  copyButtonEl,
} from "./dom.js";
import { renderKeywordFilters } from "./filters.js";
import { renderRecipeList } from "./list.js";
import { renderRecipeDetail } from "./detail.js";

/* Helpers */

function syncInputsFromState() {
  mealFilterEl.value = state.mealFilter;
  searchInputEl.value = state.searchText;
  favoritesOnlyEl.checked = state.showFavoritesOnly;
}

function syncUrlOnly() {
  writeStateToUrl({
    slug: state.activeSlug,
    meal: state.mealFilter,
    keywords: Array.from(state.selectedKeywords),
    q: state.searchText,
    favOnly: state.showFavoritesOnly,
  });
}

function syncUrlAndStorage() {
  syncUrlOnly();
  saveFiltersToStorage(
    state.mealFilter,
    state.selectedKeywords,
    state.searchText,
    state.showFavoritesOnly,
  );
}

function ensureActiveRecipeVisible() {
  const filtered = getFilteredRecipes();
  if (!filtered.some((r) => r.slug === state.activeSlug)) {
    state.activeSlug = filtered[0]?.slug ?? null;
    renderRecipeDetail(onFavoritesChanged);
  }
}

function onFiltersChanged() {
  renderRecipeList(onSelectRecipe);
  ensureActiveRecipeVisible();
  syncUrlAndStorage();
}

function onSelectRecipe(slug) {
  state.activeSlug = slug;
  renderRecipeList(onSelectRecipe);
  renderRecipeDetail(onFavoritesChanged);
  syncUrlOnly();
}

function onFavoritesChanged() {
  // just re-render list & detail to reflect stars and button
  renderRecipeList(onSelectRecipe);
  renderRecipeDetail(onFavoritesChanged);
}

/* Public init */

export async function initApp() {
  try {
    state.recipes = await loadRecipes();
  } catch (err) {
    console.error(err);
    // detail renderer will show generic error if recipes empty; good enough
    return;
  }

  state.favorites = readFavoritesFromStorage();

  const urlState = readStateFromUrl();
  const storedFilters = readFiltersFromStorage();

  let initialMeal = urlState.meal || "all";
  let initialKeywords = urlState.keywords || [];
  let initialSearch = urlState.q || "";
  let initialFavOnly = urlState.favOnly || false;
  let initialSlug = urlState.slug || null;

  const urlHasFilters =
    urlState.meal ||
    (urlState.keywords && urlState.keywords.length > 0) ||
    (urlState.q && urlState.q.trim() !== "") ||
    urlState.favOnly;

  if (!urlHasFilters && storedFilters) {
    initialMeal = storedFilters.meal || "all";
    initialKeywords = storedFilters.keywords || [];
    initialSearch = storedFilters.q || "";
    initialFavOnly = storedFilters.favOnly || false;
  }

  state.mealFilter = initialMeal;
  state.selectedKeywords = new Set(initialKeywords);
  state.searchText = initialSearch;
  state.showFavoritesOnly = initialFavOnly;

  syncInputsFromState();
  renderKeywordFilters(onFiltersChanged);
  renderRecipeList(onSelectRecipe);

  if (initialSlug && state.recipes.some((r) => r.slug === initialSlug)) {
    state.activeSlug = initialSlug;
  } else {
    const filtered = getFilteredRecipes();
    state.activeSlug = filtered[0]?.slug ?? null;
  }

  renderRecipeDetail(onFavoritesChanged);

  writeStateToUrl(
    {
      slug: state.activeSlug,
      meal: state.mealFilter,
      keywords: Array.from(state.selectedKeywords),
      q: state.searchText,
      favOnly: state.showFavoritesOnly,
    },
    { replace: true },
  );

  /* Event wiring */

  mealFilterEl.addEventListener("change", () => {
    state.mealFilter = mealFilterEl.value;
    renderRecipeList(onSelectRecipe);
    ensureActiveRecipeVisible();
    syncUrlAndStorage();
  });

  searchInputEl.addEventListener("input", () => {
    state.searchText = searchInputEl.value.trim();
    renderRecipeList(onSelectRecipe);
    ensureActiveRecipeVisible();
    syncUrlAndStorage();
  });

  favoritesOnlyEl.addEventListener("change", () => {
    state.showFavoritesOnly = favoritesOnlyEl.checked;
    renderRecipeList(onSelectRecipe);
    ensureActiveRecipeVisible();
    syncUrlAndStorage();
  });

  randomButtonEl.addEventListener("click", () => {
    const candidates = getFilteredRecipes();
    if (!candidates.length) return;
    const random = candidates[Math.floor(Math.random() * candidates.length)];
    state.activeSlug = random.slug;
    renderRecipeList(onSelectRecipe);
    renderRecipeDetail(onFavoritesChanged);
    syncUrlOnly();
  });

  printButtonEl.addEventListener("click", () => {
    if (!state.activeSlug) return;
    window.print();
  });

  copyButtonEl.addEventListener("click", async () => {
    if (!state.activeSlug) return;
    const recipe = state.recipes.find((r) => r.slug === state.activeSlug);
    if (!recipe) return;
    const md = buildMarkdown(recipe);
    try {
      await navigator.clipboard.writeText(md);
    } catch (err) {
      console.error("Clipboard error", err);
    }
  });

  window.addEventListener("popstate", () => {
    const { slug, meal, keywords, q, favOnly } = readStateFromUrl();

    state.mealFilter = meal || "all";
    state.selectedKeywords = new Set(keywords || []);
    state.searchText = q || "";
    state.showFavoritesOnly = Boolean(favOnly);

    syncInputsFromState();
    renderKeywordFilters(onFiltersChanged);
    renderRecipeList(onSelectRecipe);

    if (slug && state.recipes.some((r) => r.slug === slug)) {
      state.activeSlug = slug;
    } else {
      const filtered = getFilteredRecipes();
      state.activeSlug = filtered[0]?.slug ?? null;
    }

    renderRecipeDetail(onFavoritesChanged);
  });
}
