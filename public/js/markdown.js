// public/js/markdown.js

/**
 * @typedef {import("./api.js").Recipe} Recipe
 */

/**
 * Build a Markdown representation of a recipe.
 * @param {Recipe} recipe
 */
export function buildMarkdown(recipe) {
  const lines = [];
  lines.push(`# ${recipe.title}`);
  lines.push("");
  if (recipe.description) {
    lines.push(recipe.description);
    lines.push("");
  }

  if (recipe.macros && typeof recipe.macros === "object") {
    const m = recipe.macros;
    const totalWeight = recipe.totalWeightGrams;
    const wholeParts = [];

    if (m.calories != null) wholeParts.push(`${m.calories} kcal`);
    if (m.protein != null) wholeParts.push(`${m.protein} g protein`);
    if (m.carbs != null) wholeParts.push(`${m.carbs} g carbs`);
    if (m.fat != null) wholeParts.push(`${m.fat} g fat`);
    if (m.fiber != null) wholeParts.push(`${m.fiber} g fiber`);

    if (wholeParts.length > 0) {
      lines.push(`**Macros – whole recipe**`);
      lines.push("");
      if (totalWeight != null) {
        lines.push(`- Total weight: ${totalWeight} g`);
      }
      lines.push(`- ${wholeParts.join(" · ")}`);
      lines.push("");
    }

    if (totalWeight != null && totalWeight > 0) {
      const per100 = {};
      if (m.calories != null)
        per100.calories = (m.calories / totalWeight) * 100;
      if (m.protein != null) per100.protein = (m.protein / totalWeight) * 100;
      if (m.carbs != null) per100.carbs = (m.carbs / totalWeight) * 100;
      if (m.fat != null) per100.fat = (m.fat / totalWeight) * 100;
      if (m.fiber != null) per100.fiber = (m.fiber / totalWeight) * 100;

      const perParts = [];
      if (per100.calories != null)
        perParts.push(`${per100.calories.toFixed(0)} kcal`);
      if (per100.protein != null)
        perParts.push(`${per100.protein.toFixed(1)} g protein`);
      if (per100.carbs != null)
        perParts.push(`${per100.carbs.toFixed(1)} g carbs`);
      if (per100.fat != null) perParts.push(`${per100.fat.toFixed(1)} g fat`);
      if (per100.fiber != null)
        perParts.push(`${per100.fiber.toFixed(1)} g fiber`);

      if (perParts.length > 0) {
        lines.push(`**Macros – per 100 g**`);
        lines.push("");
        lines.push(`- ${perParts.join(" · ")}`);
        lines.push("");
      }
    }
  }

  lines.push("## Ingredients");
  lines.push("");
  for (const ing of recipe.ingredients || []) {
    lines.push(`- ${ing}`);
  }
  lines.push("");

  lines.push("## Steps");
  lines.push("");
  let i = 1;
  for (const step of recipe.steps || []) {
    lines.push(`${i}. ${step}`);
    i++;
  }

  return lines.join("\n");
}
