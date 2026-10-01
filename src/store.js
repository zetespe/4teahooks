// Storage. Everything lives in localStorage on the device; nothing is uploaded.
// The shape is versioned so later versions can upgrade it in place.
import { useSyncExternalStore } from "react";
import { normalizePattern } from "./pattern";
import { pruneProgress } from "./progress";

export const KEY = "4teahooks.state";
export const SCHEMA = 1;
export const BACKUP_TYPE = "4tea-hooks-backup";

export function emptyState() {
  return {
    version: SCHEMA,
    settings: { keepAwake: true, usageCount: true, usageSent: {}, lastBackupAt: null, changesSinceBackup: 0 },
    projects: [],
  };
}

export const uid = () => Math.random().toString(36).slice(2, 10);

export function newProject(pattern) {
  const now = new Date().toISOString();
  return { id: uid(), pattern, status: "active", createdAt: now, updatedAt: now, lastWorkedAt: null, progress: { copies: {}, last: null }, journal: [] };
}

// Re-validates a stored or imported project. Patterns are normalised again so
// a backup edited by hand (or by an AI) can't break the app.
export function normalizeProject(p) {
  if (!p || typeof p !== "object" || !p.pattern) return null;
  let pattern;
  try { pattern = normalizePattern(p.pattern).pattern; } catch (e) { return null; }
  return {
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
  };
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

// Merge adds new projects and replaces ones with the same id; replace drops
// everything first. Returns the new state and a short report.
export function applyBackup(state, obj, mode = "merge") {
  if (!obj || typeof obj !== "object") throw new Error("Not a backup file.");
  const incoming = (Array.isArray(obj.projects) ? obj.projects : obj.project ? [obj.project] : []).map(normalizeProject).filter(Boolean);
  if (!incoming.length) throw new Error("No projects found in this file.");
  const base = mode === "replace" ? [] : state.projects;
  const byId = new Map(base.map((p) => [p.id, p]));
  let added = 0, updated = 0;
  for (const p of incoming) { if (byId.has(p.id)) updated++; else added++; byId.set(p.id, p); }
  const next = { ...state, projects: [...byId.values()] };
  const parts = [];
  if (added) parts.push(`${added} added`);
  if (updated) parts.push(`${updated} updated`);
  return { state: next, report: parts.join(", ") || "nothing changed" };
}

// ---- external store ----
let state = null;
const listeners = new Set();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn("could not read storage", e);
  }
  return emptyState();
}

export function getState() {
  if (!state) state = read();
  return state;
}

// Note fields call setState per keystroke, so writes are batched (~300ms) and
// flushed when the page hides, the last reliable moment before a phone
// browser kills the tab.
let saveTimer = null;
function persist() {
  saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn("could not save", e); }
}
function flush() { if (saveTimer != null) { clearTimeout(saveTimer); persist(); } }
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flush);
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

// Patch one project; counts the change towards the backup reminder.
export function patchProject(id, fn) {
  patch((s) => {
    const p = s.projects.find((x) => x.id === id);
    if (!p) return;
    fn(p);
    s.settings.changesSinceBackup = (s.settings.changesSinceBackup || 0) + 1;
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
