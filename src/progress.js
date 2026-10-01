// Progress through a pattern, kept apart from the pattern itself so that a
// re-imported pattern keeps the user's place (progress is keyed by unit keys,
// see unitsOfPart in pattern.js).
//
// project.progress = {
//   copies: { [partId]: [ { done: {unitKey: isoTime}, counters: {unitKey: n}, notes: {unitKey: text} }, … one per copy ] },
//   last: { partId, copy },   // where the user last ticked something
// }
import { unitsOfPart } from "./pattern";

export const emptyCopy = () => ({ done: {}, counters: {}, notes: {} });

const own = (o, k) => (o && typeof o === "object" && Object.hasOwn(o, k) ? o[k] : undefined);
const obj = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});

export function copyState(project, partId, copy) {
  const list = own(project.progress?.copies, partId);
  const cs = Array.isArray(list) ? list[copy] : null;
  return cs && typeof cs === "object" ? { done: obj(cs.done), counters: obj(cs.counters), notes: obj(cs.notes) } : emptyCopy();
}

// Mutates a draft project (use inside store.patch).
export function editCopy(project, partId, copy, fn) {
  project.progress = project.progress || { copies: {}, last: null };
  project.progress.copies = project.progress.copies || {};
  const prev = own(project.progress.copies, partId);
  const list = project.progress.copies[partId] = Array.isArray(prev) ? prev : [];
  while (list.length <= copy) list.push(emptyCopy());
  const cur = list[copy] && typeof list[copy] === "object" ? list[copy] : {};
  list[copy] = { done: obj(cur.done), counters: obj(cur.counters), notes: obj(cur.notes) };
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

// Where to pick up: the part copy last worked on if it isn't finished;
// otherwise a started but unfinished part copy (one left half-done, maybe
// with a note); otherwise the first unfinished one in pattern order.
export function resumePoint(project) {
  const parts = project.pattern.parts;
  const at = (part, copy) => {
    const cs = copyState(project, part.id, copy);
    const p = partProgress(part, cs);
    if (!p.next) return null;
    const note = cs.notes[p.next.key] || "";
    return { part, copy, unit: p.next, note, done: p.done, total: p.total, counter: cs.counters[p.next.key] || 0 };
  };
  const last = project.progress?.last;
  if (last) {
    const part = parts.find((p) => p.id === last.partId);
    if (part && last.copy < part.make) { const r = at(part, last.copy); if (r) return r; }
  }
  let first = null;
  for (const part of parts) for (let c = 0; c < part.make; c++) {
    const r = at(part, c);
    if (!r) continue;
    const cs = copyState(project, part.id, c);
    if (r.done > 0 || Object.keys(cs.notes).length || Object.keys(cs.counters).length) return r;
    first = first || r;
  }
  return first;
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
    const keep = (o) => Object.fromEntries(Object.entries(obj(o)).filter(([k]) => keys.has(k)));
    const list = own(progress?.copies, part.id);
    out.copies[part.id] = (Array.isArray(list) ? list : []).slice(0, part.make).map((cs) => ({
      done: keep(cs?.done), counters: keep(cs?.counters), notes: keep(cs?.notes),
    }));
  }
  if (out.last && (typeof out.last !== "object" || !pattern.parts.some((p) => p.id === out.last.partId))) out.last = null;
  return out;
}

// What a re-import would keep: ticks and notes on units that still exist.
export function keptAfterReimport(progress, pattern) {
  const count = (pr) => Object.values(obj(pr?.copies)).flat().reduce((n, cs) => n + Object.keys(obj(cs?.done)).length + Object.keys(obj(cs?.notes)).length, 0);
  return { before: count(progress), after: count(pruneProgress(progress, pattern)) };
}
