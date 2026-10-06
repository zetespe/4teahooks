// Storage. Everything lives in localStorage on the device; nothing is uploaded.
// The shape is versioned so later versions can upgrade it in place.
import { useSyncExternalStore } from "react";
import { normalizePattern } from "./pattern";
import { pruneProgress } from "./progress";
import { DEFAULT_TOLERANCE, MAX_SWATCHES } from "./gauge";
import { toast } from "./ui";

export const KEY = "4teahooks.state";
// If stored data ever fails to load, the raw text is copied here before the
// app starts over, so nothing is lost for good.
export const RECOVERY_KEY = "4teahooks.recovery";
export const SCHEMA = 1;
export const BACKUP_TYPE = "4tea-hooks-backup";

export function emptyState() {
  return {
    version: SCHEMA,
    settings: { keepAwake: true, theme: "system", gaugeTolerance: DEFAULT_TOLERANCE, usageCount: true, usageSent: {}, lastBackupAt: null, changesSinceBackup: 0 },
    projects: [],
  };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newProject(pattern) {
  const now = new Date().toISOString();
  return { id: uid(), pattern, status: "active", createdAt: now, updatedAt: now, lastWorkedAt: null, progress: { copies: {}, last: null }, journal: [], swatches: [] };
}

// Re-validates a stored or imported project. Patterns are normalised again so
// a backup edited by hand (or by an AI) can't break the app.
export function normalizeProject(p) {
  try { return normalizeProjectUnsafe(p); } catch (e) { console.warn("skipped a broken project", e); return null; }
}

function normalizeProjectUnsafe(p) {
  if (!p || typeof p !== "object" || !p.pattern) return null;
  const pattern = normalizePattern(p.pattern).pattern;
  const out = {
    id: String(p.id || uid()),
    pattern,
    status: ["active", "paused", "finished"].includes(p.status) ? p.status : "active",
    createdAt: p.createdAt || new Date().toISOString(),
    updatedAt: p.updatedAt || p.createdAt || new Date().toISOString(),
    lastWorkedAt: p.lastWorkedAt || null,
    progress: pruneProgress(p.progress, pattern),
    journal: (Array.isArray(p.journal) ? p.journal : [])
      .filter((j) => j && j.text)
      .map((j) => ({ id: String(j.id || uid()), at: j.at || new Date().toISOString(), text: String(j.text) })),
    swatches: normalizeSwatches(p.swatches),
  };
  // Centimetres or inches, when the user chose it for this pattern's gauge.
  if (p.gaugeUnit === "cm" || p.gaugeUnit === "in") out.gaugeUnit = p.gaugeUnit;
  if (p.finishedAt) out.finishedAt = p.finishedAt;
  // The version before the last "convert again", so it can be undone.
  if (p.previous && typeof p.previous === "object" && p.previous.pattern) {
    try {
      const prevPattern = normalizePattern(p.previous.pattern).pattern;
      out.previous = { pattern: prevPattern, progress: pruneProgress(p.previous.progress, prevPattern), at: p.previous.at || null };
    } catch (e) { /* drop a broken previous version */ }
  }
  return out;
}

// Gauge swatches the user measured, newest first.
function normalizeSwatches(list) {
  const n = (v) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
  return (Array.isArray(list) ? list : [])
    .filter((x) => x && typeof x === "object" && (n(x.stitches) || n(x.rows)))
    .map((x) => {
      const s = { id: String(x.id || uid()), at: x.at || new Date().toISOString(), hook: x.hook == null ? "" : String(x.hook) };
      if (n(x.stitches)) s.stitches = x.stitches;
      if (n(x.rows)) s.rows = x.rows;
      if (x.unit === "cm" || x.unit === "in") s.unit = x.unit;
      return s;
    })
    .slice(0, MAX_SWATCHES);
}

export function migrate(raw) {
  if (!raw || typeof raw !== "object") return emptyState();
  const s = emptyState();
  s.settings = Object.assign(s.settings, raw.settings || {});
  s.projects = (Array.isArray(raw.projects) ? raw.projects : []).map(normalizeProject).filter(Boolean);
  return s;
}

// ---- backups ----

export function exportObject(state) {
  return { type: BACKUP_TYPE, version: SCHEMA, exportedAt: new Date().toISOString(), projects: state.projects };
}

// Merge adds new projects and, for projects on both sides, keeps whichever
// was changed more recently, so an old backup can't undo newer progress.
// Replace drops everything first. Returns the new state and a short report.
export function applyBackup(state, obj, mode = "merge") {
  if (!obj || typeof obj !== "object") throw new Error("Not a backup file.");
  const incoming = (Array.isArray(obj.projects) ? obj.projects : obj.project ? [obj.project] : []).map(normalizeProject).filter(Boolean);
  if (!incoming.length) throw new Error("No projects found in this file.");
  const base = mode === "replace" ? [] : state.projects;
  const byId = new Map(base.map((p) => [p.id, p]));
  let added = 0, updated = 0, kept = 0;
  for (const p of incoming) {
    const mine = byId.get(p.id);
    if (!mine) { added++; byId.set(p.id, p); }
    else if (String(p.updatedAt || "") > String(mine.updatedAt || "")) { updated++; byId.set(p.id, p); }
    else kept++;
  }
  const next = { ...state, projects: [...byId.values()] };
  const parts = [];
  if (added) parts.push(`${added} added`);
  if (updated) parts.push(`${updated} updated`);
  if (kept) parts.push(`${kept} kept as on this device (newer here)`);
  return { state: next, report: parts.join(", ") || "nothing changed" };
}

// ---- external store ----
let state = null;
const listeners = new Set();

function read() {
  let raw = null;
  try { raw = localStorage.getItem(KEY); } catch (e) { console.warn("storage unavailable", e); }
  if (!raw) return emptyState();
  try {
    const parsed = JSON.parse(raw);
    const s = migrate(parsed);
    const before = Array.isArray(parsed.projects) ? parsed.projects.length : 0;
    if (s.projects.length < before) keepRecovery(raw);
    return s;
  } catch (e) {
    console.warn("could not read storage", e);
    keepRecovery(raw);
    return emptyState();
  }
}

function keepRecovery(raw) {
  try { if (!localStorage.getItem(RECOVERY_KEY)) localStorage.setItem(RECOVERY_KEY, raw); } catch (e) { /* ignore */ }
}

export function getState() {
  if (!state) state = read();
  return state;
}

// Note fields call setState per keystroke, so writes are batched (~300ms) and
// flushed when the page hides, the last reliable moment before a phone
// browser kills the tab.
let saveTimer = null;
let saveFailed = false;
function persist() {
  saveTimer = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    saveFailed = false;
  } catch (e) {
    console.warn("could not save", e);
    if (!saveFailed) toast("Couldn't save on this device (storage full or blocked). Save a backup now.", 6000);
    saveFailed = true;
  }
}
function flush() { if (saveTimer != null) { clearTimeout(saveTimer); persist(); } }
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
  // Another tab (or the installed app and a browser tab) saved: load its
  // version instead of overwriting it later with ours.
  window.addEventListener("storage", (e) => {
    if (e.key !== KEY || e.newValue == null) return;
    try { if (saveTimer != null) { clearTimeout(saveTimer); saveTimer = null; } state = migrate(JSON.parse(e.newValue)); listeners.forEach((l) => l()); } catch (err) { /* keep ours */ }
  });
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });
}

export function setState(updater) {
  const next = typeof updater === "function" ? updater(getState()) : updater;
  state = next;
  if (saveTimer == null) saveTimer = setTimeout(persist, 300);
  listeners.forEach((l) => l());
}

export function patch(fn) {
  setState((s) => {
    const copy = structuredClone(s);
    fn(copy);
    return copy;
  });
}

// Patch one project. Ticks count towards the backup reminder; typing in a
// note (count: false) doesn't, or every keystroke would.
export function patchProject(id, fn, { count = true } = {}) {
  patch((s) => {
    const p = s.projects.find((x) => x.id === id);
    if (!p) return;
    fn(p);
    if (count) s.settings.changesSinceBackup = (s.settings.changesSinceBackup || 0) + 1;
  });
}

export function useStore() {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    getState,
    getState,
  );
}

export function resetAll() {
  // Erasing keeps the usage-count choice: an opt-out must survive, and
  // periods already counted must not be counted again.
  const keep = state && state.settings ? { usageCount: state.settings.usageCount, usageSent: state.settings.usageSent } : {};
  try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  state = emptyState();
  Object.assign(state.settings, keep);
  persist();
  listeners.forEach((l) => l());
}

// Ask the browser not to evict our storage.
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch (e) { /* ignore */ }
  return false;
}
