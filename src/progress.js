// Progress through a pattern, kept apart from the pattern itself so that a
// re-imported pattern keeps the user's place (progress is keyed by unit keys,
// see unitsOfPart in pattern.js).
//
// project.progress = {
//   copies: { [partId]: [ { done: {unitKey: isoTime}, counters: {repeatId: n}, notes: {unitKey: text} }, … one per copy ] },
//   last: { partId, copy },   // where the user last ticked something
// }
import { unitsOfPart } from "./pattern";

export const emptyCopy = () => ({ done: {}, counters: {}, notes: {} });

export function copyState(project, partId, copy) {
  const list = project.progress?.copies?.[partId];
  return (list && list[copy]) || emptyCopy();
}

// Mutates a draft project (use inside store.patch).
export function editCopy(project, partId, copy, fn) {
  project.progress = project.progress || { copies: {}, last: null };
  project.progress.copies = project.progress.copies || {};
  const list = project.progress.copies[partId] = project.progress.copies[partId] || [];
  while (list.length <= copy) list.push(emptyCopy());
  list[copy] = { ...emptyCopy(), ...list[copy] };
  fn(list[copy]);
  project.progress.last = { partId, copy };
  const now = new Date().toISOString();
  project.lastWorkedAt = now;
  project.updatedAt = now;
}

export function partProgress(part, cs) {
  const units = unitsOfPart(part);
  const done = units.filter((u) => cs.done[u.key]).length;
  return { done, total: units.length, next: units.find((u) => !cs.done[u.key]) || null, units };
}

export function projectProgress(project) {
  let done = 0, total = 0;
  for (const part of project.pattern.parts) {
    for (let c = 0; c < part.make; c++) {
      const p = partProgress(part, copyState(project, part.id, c));
      done += p.done; total += p.total;
    }
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0, finished: total > 0 && done === total };
}

// Where to pick up: the part copy last worked on if it isn't finished,
// otherwise the first unfinished part copy in pattern order.
export function resumePoint(project) {
  const parts = project.pattern.parts;
  const at = (part, copy) => {
    const cs = copyState(project, part.id, copy);
    const p = partProgress(part, cs);
    if (!p.next) return null;
    const note = cs.notes[p.next.key] || "";
    return { part, copy, unit: p.next, note, done: p.done, total: p.total, counter: cs.counters[p.next.step.id] || 0 };
  };
  const last = project.progress?.last;
  if (last) {
    const part = parts.find((p) => p.id === last.partId);
    if (part && last.copy < part.make) { const r = at(part, last.copy); if (r) return r; }
  }
  for (const part of parts) for (let c = 0; c < part.make; c++) { const r = at(part, c); if (r) return r; }
  return null;
}

// The latest "where I stopped" note anywhere in the project, for the list view.
export function latestNote(project) {
  const r = resumePoint(project);
  return r && r.note ? r.note : "";
}

// Drops progress for parts/units that no longer exist after a re-import, and
// trims copies beyond the new "make" count.
export function pruneProgress(progress, pattern) {
  const out = { copies: {}, last: progress?.last || null };
  for (const part of pattern.parts) {
    const keys = new Set(unitsOfPart(part).map((u) => u.key));
    const stepIds = new Set();
    const walk = (s) => { stepIds.add(s.id); (s.steps || []).forEach(walk); };
    part.steps.forEach(walk);
    const list = progress?.copies?.[part.id] || [];
    out.copies[part.id] = list.slice(0, part.make).map((cs) => ({
      done: Object.fromEntries(Object.entries(cs.done || {}).filter(([k]) => keys.has(k))),
      counters: Object.fromEntries(Object.entries(cs.counters || {}).filter(([k]) => stepIds.has(k))),
      notes: Object.fromEntries(Object.entries(cs.notes || {}).filter(([k]) => keys.has(k))),
    }));
  }
  if (out.last && !pattern.parts.some((p) => p.id === out.last.partId)) out.last = null;
  return out;
}
