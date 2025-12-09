// public/js/detail.js

import { state } from "./state.js";
import { recipeDetailEl } from "./dom.js";
import { saveFavoritesToStorage } from "./storage.js";

/**
 * Escape HTML entities.
 * @param {string | number} str
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Render the active recipe detail.
 * @param {() => void} onFavoritesChanged called after favourites change
 */
export function renderRecipeDetail(onFavoritesChanged) {
  if (!state.activeSlug) {
    recipeDetailEl.innerHTML =
      '<p class="muted">Select a recipe from the list on the left.</p>';
    return;
  }

  const recipe = state.recipes.find((r) => r.slug === state.activeSlug);
  if (!recipe) {
    recipeDetailEl.innerHTML =
      '<p class="muted">Selected recipe not found.</p>';
    return;
  }

  const meals = (recipe.meals || []).map(
    (m) => `<span class="badge badge-meal">${escapeHtml(m)}</span>`,
  );
  const keywords = (recipe.keywords || []).map(
    (kw) => `<span class="badge badge-keyword">${escapeHtml(kw)}</span>`,
  );

  const favActive = state.favorites.has(recipe.slug);
  const favLabel = favActive ? "★ Favourite" : "☆ Add to favourites";

  // Whole-recipe macros
  let macrosWholeHtml = "";
  if (recipe.macros && typeof recipe.macros === "object") {
    const m = recipe.macros;
    const chips = [];

    if (m.calories != null) {
      chips.push(
        `<span class="badge badge-macro-calories">${escapeHtml(
          m.calories,
        )} kcal</span>`,
      );
    }
    if (m.protein != null) {
      chips.push(
        `<span class="badge badge-macro-protein">${escapeHtml(
          m.protein,
        )} g protein</span>`,
      );
    }
    if (m.carbs != null) {
      chips.push(
        `<span class="badge badge-macro-carbs">${escapeHtml(
          m.carbs,
        )} g carbs</span>`,
      );
    }
    if (m.fat != null) {
      chips.push(
        `<span class="badge badge-macro-fat">${escapeHtml(m.fat)} g fat</span>`,
      );
    }
    if (m.fiber != null) {
      chips.push(
        `<span class="badge badge-macro-fiber">${escapeHtml(
          m.fiber,
        )} g fiber</span>`,
      );
    }

    if (chips.length > 0) {
      const weightLine =
        recipe.totalWeightGrams != null
          ? `<p class="muted">Macros for the whole recipe (${escapeHtml(
              recipe.totalWeightGrams,
            )} g).</p>`
          : `<p class="muted">Macros for the whole recipe.</p>`;

      macrosWholeHtml = `
        <h2>Macros</h2>
        ${weightLine}
        <div class="badge-row">
          ${chips.join("")}
        </div>
      `;
    }
  }

  // Portion calculator (grams)
  const hasPortionCalc =
    recipe.macros &&
    typeof recipe.macros === "object" &&
    typeof recipe.totalWeightGrams === "number" &&
    recipe.totalWeightGrams > 0;

  let portionSectionHtml = "";
  if (hasPortionCalc) {
    portionSectionHtml = `
      <div class="portion-controls interactable">
        <div class="portion-controls-label">
          <span>Your portion (g):</span>
          <input
            type="number"
            min="0"
            step="1"
            id="portionInput"
            class="portion-input"
            placeholder="e.g. 150"
          />
        </div>
        <div id="portionMacros" class="badge-row"></div>
      </div>
    `;
  }

  const ingredients = (recipe.ingredients || [])
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("");
  const steps = (recipe.steps || [])
    .map((s) => `<li>${escapeHtml(s)}</li>`)
    .join("");

  recipeDetailEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
      <div>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="description">${escapeHtml(recipe.description)}</p>
      </div>
      <button type="button" id="favoriteToggle" class="interactable btn-fav${
        favActive ? " btn-fav-active" : ""
      }">
        ${favLabel}
      </button>
    </div>

    <div class="badge-row">
      ${meals.join("")}
      ${keywords.join("")}
    </div>

    ${macrosWholeHtml}
    ${portionSectionHtml}

    <h2>Ingredients</h2>
    <ul>
      ${ingredients}
    </ul>

    <h2>Steps</h2>
    <ol>
      ${steps}
    </ol>
  `;

  // Favourite toggle
  const favButton = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("favoriteToggle")
  );
  if (favButton) {
    favButton.addEventListener("click", () => {
      if (state.favorites.has(recipe.slug)) {
        state.favorites.delete(recipe.slug);
      } else {
        state.favorites.add(recipe.slug);
      }
      saveFavoritesToStorage(state.favorites);
      onFavoritesChanged();
    });
  }

  // Portion calculator behaviour
  if (hasPortionCalc) {
    const input = /** @type {HTMLInputElement | null} */ (
      document.getElementById("portionInput")
    );
    const portionMacrosEl = document.getElementById("portionMacros");

    if (input && portionMacrosEl) {
      const totalWeight = recipe.totalWeightGrams;
      const m = recipe.macros;

      const updatePortion = () => {
        const grams = parseFloat(input.value);
        if (!grams || grams <= 0 || !isFinite(grams)) {
          portionMacrosEl.innerHTML = "";
          return;
        }

        const factor = grams / totalWeight;
        const chips = [];

        if (m.calories != null) {
          chips.push(
            `<span class="badge badge-macro-calories">${escapeHtml(
              (m.calories * factor).toFixed(0),
            )} kcal</span>`,
          );
        }
        if (m.protein != null) {
          chips.push(
            `<span class="badge badge-macro-protein">${escapeHtml(
              (m.protein * factor).toFixed(1),
            )} g protein</span>`,
          );
        }
        if (m.carbs != null) {
          chips.push(
            `<span class="badge badge-macro-carbs">${escapeHtml(
              (m.carbs * factor).toFixed(1),
            )} g carbs</span>`,
          );
        }
        if (m.fat != null) {
          chips.push(
            `<span class="badge badge-macro-fat">${escapeHtml(
              (m.fat * factor).toFixed(1),
            )} g fat</span>`,
          );
        }
        if (m.fiber != null) {
          chips.push(
            `<span class="badge badge-macro-fiber">${escapeHtml(
              (m.fiber * factor).toFixed(1),
            )} g fiber</span>`,
          );
        }

        if (chips.length > 0) {
          portionMacrosEl.innerHTML = `
            <span class="badge badge-macro-label">
              Approx. macros for ${escapeHtml(grams.toFixed(0))} g
            </span>
            ${chips.join("")}
          `;
        } else {
          portionMacrosEl.innerHTML = "";
        }
      };

      input.addEventListener("input", updatePortion);
    }
  }
}
