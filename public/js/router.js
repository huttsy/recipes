// public/js/router.js

/**
 * Read current state from the URL query string.
 */
export function readStateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug") || null;
  const meal = params.get("meal") || null;
  const keywordsParam = params.get("keywords") || "";
  const keywords = keywordsParam
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const q = params.get("q") || "";
  const favOnly = params.get("fav") === "1";

  return { slug, meal, keywords, q, favOnly };
}

/**
 * Write state back to the URL.
 * @param {{slug:string|null, meal:string|null, keywords:string[], q:string, favOnly:boolean}} state
 * @param {{replace?:boolean}} [options]
 */
export function writeStateToUrl(state, options = {}) {
  const { slug, meal, keywords, q, favOnly } = state;
  const { replace = false } = options;

  const params = new URLSearchParams();

  if (slug) params.set("slug", slug);
  if (meal && meal !== "all") params.set("meal", meal);
  if (keywords && keywords.length) params.set("keywords", keywords.join(","));
  if (q && q.trim() !== "") params.set("q", q.trim());
  if (favOnly) params.set("fav", "1");

  const query = params.toString();
  const newUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", newUrl);
}
