// public/js/list.js

import { state, getFilteredRecipes } from "./state.js";
import { recipeListEl } from "./dom.js";

/**
 * Render the recipe list in the sidebar.
 * @param {(slug: string) => void} onSelectRecipe
 */
export function renderRecipeList(onSelectRecipe) {
  const recipes = getFilteredRecipes();
  recipeListEl.innerHTML = "";

  if (recipes.length === 0) {
    recipeListEl.innerHTML =
      '<li class="recipe-item"><span class="muted">No recipes match these filters.</span></li>';
    return;
  }

  for (const recipe of recipes) {
    const li = document.createElement("li");
    li.className = "recipe-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "recipe-button";
    if (recipe.slug === state.activeSlug) {
      btn.classList.add("recipe-button-active");
    }

    btn.addEventListener("click", () => {
      onSelectRecipe(recipe.slug);
    });

    const headerRow = document.createElement("div");
    headerRow.className = "recipe-button-header";

    const title = document.createElement("span");
    title.className = "recipe-button-title";
    title.textContent = recipe.title;

    const favMark = document.createElement("span");
    favMark.className = "recipe-button-fav";
    if (state.favorites.has(recipe.slug)) {
      favMark.textContent = "★";
    } else {
      favMark.textContent = "";
    }

    headerRow.appendChild(title);
    headerRow.appendChild(favMark);

    const desc = document.createElement("span");
    desc.className = "recipe-button-description";
    desc.textContent = recipe.description;

    const meta = document.createElement("span");
    meta.className = "recipe-button-meta";

    const meals = (recipe.meals || []).join(", ");
    const weight = recipe.totalWeightGrams;
    let metaText = "";

    if (meals) metaText += `Meals: ${meals}`;
    if (weight != null) {
      if (metaText) metaText += " · ";
      metaText += `Total: ${weight} g`;
    }
    meta.textContent = metaText;

    btn.appendChild(headerRow);
    btn.appendChild(desc);
    if (metaText) {
      btn.appendChild(meta);
    }

    li.appendChild(btn);
    recipeListEl.appendChild(li);
  }
}
