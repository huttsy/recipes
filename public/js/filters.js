// public/js/filters.js

import { state, getAllKeywords } from "./state.js";
import { keywordFiltersContainer } from "./dom.js";

/**
 * Render keyword filter chips and wire change events.
 * @param {() => void} onFiltersChanged called after state.selectedKeywords changes
 */
export function renderKeywordFilters(onFiltersChanged) {
  const keywords = getAllKeywords();
  keywordFiltersContainer.innerHTML = "";

  if (keywords.length === 0) {
    keywordFiltersContainer.innerHTML =
      '<p class="muted">No keywords defined yet.</p>';
    return;
  }

  for (const kw of keywords) {
    const id = `kw-${kw.replace(/\s+/g, "-")}`;

    const wrapper = document.createElement("label");
    wrapper.className = "keyword-chip";
    wrapper.htmlFor = id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = id;
    checkbox.value = kw;

    if (state.selectedKeywords.has(kw)) {
      checkbox.checked = true;
    }

    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        state.selectedKeywords.add(kw);
      } else {
        state.selectedKeywords.delete(kw);
      }

      onFiltersChanged();
    });

    const text = document.createElement("span");
    text.textContent = kw;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(text);
    keywordFiltersContainer.appendChild(wrapper);
  }
}
