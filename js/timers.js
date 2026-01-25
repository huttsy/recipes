import { timersBarEl } from "./dom.js";

const timers = new Map();

/**
 * Parse a duration from a step string.
 * Supports: "10 min", "10 minutes", "1 hour", "1 hr", ranges "12–15 minutes" (takes first number).
 * @param {string} text
 * @returns {number | null} seconds
 */
export function parseDurationSeconds(text) {
  const t = text.toLowerCase();

  // minutes (range supported)
  let m = t.match(/(\d+)\s*(?:–|-)\s*(\d+)\s*(min|mins|minute|minutes)\b/);
  if (m) return parseInt(m[1], 10) * 60;

  m = t.match(/(\d+)\s*(min|mins|minute|minutes)\b/);
  if (m) return parseInt(m[1], 10) * 60;

  // hours (range supported)
  let h = t.match(/(\d+)\s*(?:–|-)\s*(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  if (h) return parseInt(h[1], 10) * 3600;

  h = t.match(/(\d+)\s*(h|hr|hrs|hour|hours)\b/);
  if (h) return parseInt(h[1], 10) * 3600;

  return null;
}

function formatSeconds(s) {
  const sec = Math.max(0, Math.floor(s));
  const mm = Math.floor(sec / 60);
  const ss = sec % 60;
  const hh = Math.floor(mm / 60);
  const m2 = mm % 60;

  if (hh > 0)
    return `${hh}:${String(m2).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  return `${m2}:${String(ss).padStart(2, "0")}`;
}

function renderTimers() {
  timersBarEl.innerHTML = "";
  if (timers.size === 0) return;

  for (const [id, t] of timers.entries()) {
    const remaining = (t.endAt - Date.now()) / 1000;

    const card = document.createElement("div");
    card.className = "timer-card";
    card.innerHTML = `
      <div class="timer-title">${t.title}</div>
      <div class="timer-row">
        <div class="timer-time">${formatSeconds(remaining)}</div>
        <div class="timer-actions">
          <button type="button" class="btn btn-ghost" data-act="stop">Stop</button>
        </div>
      </div>
    `;

    card
      .querySelector('[data-act="stop"]')
      .addEventListener("click", () => stopTimer(id));
    timersBarEl.appendChild(card);
  }
}

/**
 * Start a timer.
 * @param {string} id unique
 * @param {string} title
 * @param {number} seconds
 */
export function startTimer(id, title, seconds) {
  stopTimer(id);

  const endAt = Date.now() + seconds * 1000;
  const interval = setInterval(() => {
    const remaining = endAt - Date.now();
    if (remaining <= 0) {
      stopTimer(id);
      // Optional: you can beep here later
      return;
    }
    renderTimers();
  }, 250);

  timers.set(id, { title, endAt, interval });
  renderTimers();
}

/**
 * Stop timer by id.
 * @param {string} id
 */
export function stopTimer(id) {
  const t = timers.get(id);
  if (t?.interval) clearInterval(t.interval);
  timers.delete(id);
  renderTimers();
}
