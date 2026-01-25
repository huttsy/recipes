import { state } from "./state.js";
import { activeFiltersEl } from "./dom.js";

/**
 * Render active filter chips with remove buttons.
 * @param {(patch: Partial<{mealFilter:string, searchText:string, showFavoritesOnly:boolean, selectedKeywords:Set<string>, keywordMatchMode:"all"|"any"}>) => void} applyPatch
 */
export function renderActiveFilters(applyPatch) {
  const chips = [];

  if (state.mealFilter !== "all") {
    chips.push({
      label: `Meal: ${state.mealFilter}`,
      onRemove: () => applyPatch({ mealFilter: "all" }),
    });
  }

  if (state.searchText.trim()) {
    chips.push({
      label: `Search: ${state.searchText.trim()}`,
      onRemove: () => applyPatch({ searchText: "" }),
    });
  }

  if (state.showFavoritesOnly) {
    chips.push({
      label: `Favourites only`,
      onRemove: () => applyPatch({ showFavoritesOnly: false }),
    });
  }

  if (state.selectedKeywords.size > 0) {
    for (const kw of state.selectedKeywords) {
      chips.push({
        label: `KW: ${kw}`,
        onRemove: () => {
          const next = new Set(state.selectedKeywords);
          next.delete(kw);
          applyPatch({ selectedKeywords: next });
        },
      });
    }
    chips.push({
      label: `Mode: ${state.keywordMatchMode.toUpperCase()}`,
      onRemove: () => applyPatch({ keywordMatchMode: "all" }),
    });
  }

  activeFiltersEl.innerHTML = "";
  if (chips.length === 0) {
    activeFiltersEl.innerHTML = '<span class="muted">No active filters.</span>';
    return;
  }

  for (const chip of chips) {
    const el = document.createElement("span");
    el.className = "filter-chip";
    el.innerHTML = `
      <span>${chip.label}</span>
      <button type="button" aria-label="Remove filter">×</button>
    `;
    el.querySelector("button").addEventListener("click", chip.onRemove);
    activeFiltersEl.appendChild(el);
  }
}

/**
 * Reset filter state.
 * @returns {Partial<{mealFilter:string, searchText:string, showFavoritesOnly:boolean, selectedKeywords:Set<string>, keywordMatchMode:"all"|"any"}>}
 */
export function getClearedFiltersPatch() {
  return {
    mealFilter: "all",
    searchText: "",
    showFavoritesOnly: false,
    selectedKeywords: new Set(),
    keywordMatchMode: "all",
  };
}
