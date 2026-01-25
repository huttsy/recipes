// js/detail.js

import { state } from "./state.js";
import { recipeDetailEl, cookModeButtonEl } from "./dom.js";
import { saveFavoritesToStorage } from "./storage.js";
import { parseDurationSeconds, startTimer } from "./timers.js";

let cookMode = false;
let cookStepIndex = 0;

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
 * Scale an ingredient line if it begins with a number or range.
 * Supported examples:
 * - "500 g flour" -> "250 g flour" (factor 0.5)
 * - "1-2 tbsp chili" -> "0.5-1 tbsp chili" (factor 0.5)
 * - "10 ml oil" -> "5 ml oil"
 * Non-matching lines are returned unchanged.
 * @param {string} line
 * @param {number} factor
 */
function scaleIngredientLine(line, factor) {
  const trimmed = line.trim();

  // range: 1–2 or 1-2
  let m = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:–|-)\s*(\d+(?:\.\d+)?)(.*)$/);
  if (m) {
    const a = parseFloat(m[1]);
    const b = parseFloat(m[2]);
    const rest = m[3] ?? "";
    const a2 = (a * factor).toFixed(a % 1 === 0 ? 0 : 1);
    const b2 = (b * factor).toFixed(b % 1 === 0 ? 0 : 1);
    return `${a2}–${b2}${rest}`;
  }

  // single: 500 g ...
  m = trimmed.match(/^(\d+(?:\.\d+)?)(.*)$/);
  if (m) {
    const a = parseFloat(m[1]);
    const rest = m[2] ?? "";
    const a2 = (a * factor).toFixed(a % 1 === 0 ? 0 : 1);
    return `${a2}${rest}`;
  }

  return line;
}

function setCookMode(next) {
  cookMode = next;
  document.body.classList.toggle("cook-mode", cookMode);
  cookModeButtonEl.textContent = cookMode
    ? "🧑‍🍳 Exit Cooking Mode"
    : "🍳 Cooking Mode";
}

cookModeButtonEl?.addEventListener("click", () => {
  setCookMode(!cookMode);
  cookStepIndex = 0;
  // re-render (ui.js already calls renderRecipeDetail; but safe to rerender here too)
  renderRecipeDetail(() => {});
});

/**
 * Render the active recipe detail.
 * @param {() => void} onFavoritesChanged
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

  // reset step index if needed
  if (cookStepIndex >= (recipe.steps?.length ?? 0)) cookStepIndex = 0;

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

    if (m.calories != null)
      chips.push(
        `<span class="badge badge-macro-calories">${escapeHtml(m.calories)} kcal</span>`,
      );
    if (m.protein != null)
      chips.push(
        `<span class="badge badge-macro-protein">${escapeHtml(m.protein)} g protein</span>`,
      );
    if (m.carbs != null)
      chips.push(
        `<span class="badge badge-macro-carbs">${escapeHtml(m.carbs)} g carbs</span>`,
      );
    if (m.fat != null)
      chips.push(
        `<span class="badge badge-macro-fat">${escapeHtml(m.fat)} g fat</span>`,
      );
    if (m.fiber != null)
      chips.push(
        `<span class="badge badge-macro-fiber">${escapeHtml(m.fiber)} g fiber</span>`,
      );

    if (chips.length > 0) {
      const weightLine =
        recipe.totalWeightGrams != null
          ? `<p class="muted">Macros for the whole recipe (${escapeHtml(recipe.totalWeightGrams)} g).</p>`
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

  // Portion calculator + ingredient scaling require totalWeightGrams + macros (for portion macros)
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
        <div id="scaledIngredients" class="muted"></div>
      </div>
    `;
  }

  // Steps list with timer buttons
  const stepsHtml = (recipe.steps || [])
    .map((s, idx) => {
      const secs = parseDurationSeconds(s);
      const timerBtn = secs
        ? `<button type="button" class="step-timer-btn interactable" data-step-timer="${idx}">Start timer</button>`
        : "";
      return `<li>${escapeHtml(s)}${timerBtn}</li>`;
    })
    .join("");

  const ingredientsHtml = (recipe.ingredients || [])
    .map((i) => `<li data-ingredient="${escapeHtml(i)}">${escapeHtml(i)}</li>`)
    .join("");

  // Cooking mode view (stepper)
  let cookingModeHtml = "";
  if (cookMode) {
    const steps = recipe.steps || [];
    const total = steps.length;
    const current = steps[cookStepIndex] ?? "";
    const secs = parseDurationSeconds(current);

    cookingModeHtml = `
      <div class="cook-stepper">
        <div class="cook-step-number">Step ${cookStepIndex + 1} of ${total}</div>
        <div class="cook-step-text">${escapeHtml(current)}</div>
        <div class="cook-step-controls interactable">
          <button type="button" class="btn btn-ghost" id="cookPrev">← Prev</button>
          <button type="button" class="btn btn-ghost" id="cookNext">Next →</button>
          ${
            secs
              ? `<button type="button" class="btn btn-ghost" id="cookTimer">⏱ Start ${Math.round(secs / 60)} min</button>`
              : ""
          }
        </div>
      </div>
    `;
  }

  recipeDetailEl.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;">
      <div>
        <h1>${escapeHtml(recipe.title)}</h1>
        <p class="description">${escapeHtml(recipe.description)}</p>
      </div>
      <button type="button" id="favoriteToggle" class="btn-fav interactable ${favActive ? "btn-fav-active" : ""}">
        ${favLabel}
      </button>
    </div>

    <div class="badge-row">
      ${meals.join("")}
      ${keywords.join("")}
    </div>

    ${macrosWholeHtml}
    ${portionSectionHtml}

    ${cookMode ? cookingModeHtml : ""}

    <h2>Ingredients</h2>
    <ul id="ingredientsList">
      ${ingredientsHtml}
    </ul>

    <h2>Steps</h2>
    <ol>
      ${stepsHtml}
    </ol>
  `;

  // Favourite toggle
  const favButton = /** @type {HTMLButtonElement | null} */ (
    document.getElementById("favoriteToggle")
  );
  favButton?.addEventListener("click", () => {
    if (state.favorites.has(recipe.slug)) state.favorites.delete(recipe.slug);
    else state.favorites.add(recipe.slug);

    saveFavoritesToStorage(state.favorites);
    onFavoritesChanged();
  });

  // Wire cooking stepper controls
  if (cookMode) {
    document.getElementById("cookPrev")?.addEventListener("click", () => {
      cookStepIndex = Math.max(0, cookStepIndex - 1);
      renderRecipeDetail(onFavoritesChanged);
    });
    document.getElementById("cookNext")?.addEventListener("click", () => {
      cookStepIndex = Math.min(
        (recipe.steps?.length ?? 1) - 1,
        cookStepIndex + 1,
      );
      renderRecipeDetail(onFavoritesChanged);
    });
    document.getElementById("cookTimer")?.addEventListener("click", () => {
      const current = (recipe.steps || [])[cookStepIndex] ?? "";
      const secs = parseDurationSeconds(current);
      if (!secs) return;
      startTimer(
        `${recipe.slug}:cook:${cookStepIndex}`,
        `${recipe.title} – Step ${cookStepIndex + 1}`,
        secs,
      );
    });
  }

  // Wire step timers in normal list
  for (const btn of recipeDetailEl.querySelectorAll("[data-step-timer]")) {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-step-timer"));
      const stepText = (recipe.steps || [])[idx] ?? "";
      const secs = parseDurationSeconds(stepText);
      if (!secs) return;
      startTimer(
        `${recipe.slug}:step:${idx}`,
        `${recipe.title} – Step ${idx + 1}`,
        secs,
      );
    });
  }

  // Portion calc: macros + ingredient scaling
  if (hasPortionCalc) {
    const input = /** @type {HTMLInputElement | null} */ (
      document.getElementById("portionInput")
    );
    const portionMacrosEl = document.getElementById("portionMacros");
    const scaledIngredientsEl = document.getElementById("scaledIngredients");
    const ingredientsList = document.getElementById("ingredientsList");

    const totalWeight = recipe.totalWeightGrams;
    const m = recipe.macros;

    const updatePortion = () => {
      const grams = parseFloat(input.value);
      if (!grams || grams <= 0 || !isFinite(grams)) {
        if (portionMacrosEl) portionMacrosEl.innerHTML = "";
        if (scaledIngredientsEl) scaledIngredientsEl.innerHTML = "";
        // reset ingredient list text
        if (ingredientsList) {
          const lis = ingredientsList.querySelectorAll("li");
          lis.forEach((li) => {
            const original = li.getAttribute("data-ingredient");
            if (original != null) li.textContent = original;
          });
        }
        return;
      }

      const factor = grams / totalWeight;

      // macros chips
      const chips = [];
      if (m.calories != null)
        chips.push(
          `<span class="badge badge-macro-calories">${escapeHtml((m.calories * factor).toFixed(0))} kcal</span>`,
        );
      if (m.protein != null)
        chips.push(
          `<span class="badge badge-macro-protein">${escapeHtml((m.protein * factor).toFixed(1))} g protein</span>`,
        );
      if (m.carbs != null)
        chips.push(
          `<span class="badge badge-macro-carbs">${escapeHtml((m.carbs * factor).toFixed(1))} g carbs</span>`,
        );
      if (m.fat != null)
        chips.push(
          `<span class="badge badge-macro-fat">${escapeHtml((m.fat * factor).toFixed(1))} g fat</span>`,
        );
      if (m.fiber != null)
        chips.push(
          `<span class="badge badge-macro-fiber">${escapeHtml((m.fiber * factor).toFixed(1))} g fiber</span>`,
        );

      if (portionMacrosEl) {
        portionMacrosEl.innerHTML = `
          <span class="badge badge-macro-label">Approx. macros for ${escapeHtml(grams.toFixed(0))} g</span>
          ${chips.join("")}
        `;
      }

      // ingredient scaling
      if (scaledIngredientsEl) {
        scaledIngredientsEl.innerHTML = `Scaled ingredients for ${escapeHtml(grams.toFixed(0))} g (×${factor.toFixed(2)})`;
      }

      if (ingredientsList) {
        const lis = ingredientsList.querySelectorAll("li");
        lis.forEach((li) => {
          const original =
            li.getAttribute("data-ingredient") || li.textContent || "";
          li.textContent = scaleIngredientLine(original, factor);
        });
      }
    };

    input?.addEventListener("input", updatePortion);
  }
}
