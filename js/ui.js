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
  clearFiltersButtonEl,
  keywordAnyModeEl,
} from "./dom.js";
import { renderKeywordFilters } from "./filters.js";
import { renderRecipeList } from "./list.js";
import { renderRecipeDetail } from "./detail.js";
import {
  renderActiveFilters,
  getClearedFiltersPatch,
} from "./activeFilters.js";

function syncInputsFromState() {
  mealFilterEl.value = state.mealFilter;
  searchInputEl.value = state.searchText;
  favoritesOnlyEl.checked = state.showFavoritesOnly;
  keywordAnyModeEl.checked = state.keywordMatchMode === "any";
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

function rerenderAll() {
  renderKeywordFilters(onFiltersChanged);
  renderRecipeList(onSelectRecipe);
  renderActiveFilters(applyPatch);
  ensureActiveRecipeVisible();
  renderRecipeDetail(onFavoritesChanged);
}

function onFiltersChanged() {
  renderRecipeList(onSelectRecipe);
  renderActiveFilters(applyPatch);
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
  renderRecipeList(onSelectRecipe);
  renderRecipeDetail(onFavoritesChanged);
}

function applyPatch(patch) {
  if (patch.mealFilter != null) state.mealFilter = patch.mealFilter;
  if (patch.searchText != null) state.searchText = patch.searchText;
  if (patch.showFavoritesOnly != null)
    state.showFavoritesOnly = patch.showFavoritesOnly;
  if (patch.selectedKeywords != null)
    state.selectedKeywords = patch.selectedKeywords;
  if (patch.keywordMatchMode != null)
    state.keywordMatchMode = patch.keywordMatchMode;

  syncInputsFromState();
  rerenderAll();
  syncUrlAndStorage();
}

export async function initApp() {
  state.recipes = await loadRecipes();
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

  // keyword match mode defaults to "all" for now (not stored previously)
  state.keywordMatchMode = "all";

  syncInputsFromState();
  renderKeywordFilters(onFiltersChanged);
  renderRecipeList(onSelectRecipe);
  renderActiveFilters(applyPatch);

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

  // Events
  mealFilterEl.addEventListener("change", () => {
    state.mealFilter = mealFilterEl.value;
    onFiltersChanged();
  });

  searchInputEl.addEventListener("input", () => {
    state.searchText = searchInputEl.value.trim();
    onFiltersChanged();
  });

  favoritesOnlyEl.addEventListener("change", () => {
    state.showFavoritesOnly = favoritesOnlyEl.checked;
    onFiltersChanged();
  });

  keywordAnyModeEl.addEventListener("change", () => {
    state.keywordMatchMode = keywordAnyModeEl.checked ? "any" : "all";
    onFiltersChanged();
  });

  clearFiltersButtonEl.addEventListener("click", () => {
    applyPatch(getClearedFiltersPatch());
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
    await navigator.clipboard.writeText(md);
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
    renderActiveFilters(applyPatch);

    if (slug && state.recipes.some((r) => r.slug === slug)) {
      state.activeSlug = slug;
    } else {
      const filtered = getFilteredRecipes();
      state.activeSlug = filtered[0]?.slug ?? null;
    }

    renderRecipeDetail(onFavoritesChanged);
  });
}
