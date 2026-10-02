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
export function keptAfterReimport(oldPattern, progress, pattern) {
  const count = (pr) => Object.values(obj(pr?.copies)).flat().reduce((n, cs) => n + Object.keys(obj(cs?.done)).length + Object.keys(obj(cs?.notes)).length, 0);
  return { before: count(progress), after: count(remapProgress(oldPattern, progress, pattern)) };
}

// ---- re-import: carry progress over to a new version of the pattern ----
//
// A chatbot converting the pattern again may give rows new ids, so progress
// is matched in steps, each old row used at most once:
//   1. same unit key (same ids)
//   2. same row label, same repeat position and same instruction text
//   3. same row label and repeat position, when that label is unique
//   4. same instruction text and repeat position, in order of appearance
// Parts are matched by id, then by name. Rows with no match start fresh.

const normText = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const repPath = (u) => { const out = []; for (let r = u.rep; r; r = r.outer) out.unshift(r.i); return out.join("."); };

function matchUnits(oldUnits, newUnits) {
  const map = new Map(); // new key -> old key
  const used = new Set();
  const take = (nu, ou) => { if (ou && !used.has(ou.key)) { map.set(nu.key, ou.key); used.add(ou.key); return true; } return false; };
  const oldByKey = new Map(oldUnits.map((u) => [u.key, u]));
  for (const nu of newUnits) take(nu, oldByKey.get(nu.key));
  const passes = [
    (u) => `${u.label}|${repPath(u)}|${normText(u.step.text)}`,
    (u) => (u.label ? `${u.label}|${repPath(u)}` : null),
    (u) => (u.step.text ? `${normText(u.step.text)}|${repPath(u)}` : null),
  ];
  passes.forEach((sig, pass) => {
    const bucket = (units) => {
      const m = new Map();
      for (const u of units) { const s = sig(u); if (s) { if (!m.has(s)) m.set(s, []); m.get(s).push(u); } }
      return m;
    };
    const olds = bucket(oldUnits.filter((u) => !used.has(u.key)));
    const news = bucket(newUnits.filter((u) => !map.has(u.key)));
    for (const [s, list] of news) {
      const cand = olds.get(s);
      if (!cand) continue;
      // Pass 3 (label only) is only safe when the label is unique on both sides.
      if (pass === 1 && (cand.length !== 1 || list.length !== 1)) continue;
      list.forEach((nu, i) => take(nu, cand[i]));
    }
  });
  return map;
}

export function remapProgress(oldPattern, oldProgress, newPattern) {
  const out = { copies: {}, last: null };
  const byName = new Map();
  for (const p of oldPattern.parts) { const k = normText(p.name); byName.set(k, byName.has(k) ? null : p); }
  const partMap = new Map();
  for (const np of newPattern.parts) {
    const op = oldPattern.parts.find((p) => p.id === np.id) || byName.get(normText(np.name)) || null;
    if (op) partMap.set(op.id, np.id);
    out.copies[np.id] = [];
    if (!op) continue;
    const map = matchUnits(unitsOfPart(op), unitsOfPart(np));
    const copies = Math.min(np.make, op.make);
    for (let c = 0; c < copies; c++) {
      const cs = copyState({ progress: oldProgress }, op.id, c);
      const next = emptyCopy();
      for (const [nk, ok] of map) {
        if (Object.hasOwn(cs.done, ok)) next.done[nk] = cs.done[ok];
        if (Object.hasOwn(cs.notes, ok)) next.notes[nk] = cs.notes[ok];
        if (Object.hasOwn(cs.counters, ok)) next.counters[nk] = cs.counters[ok];
      }
      out.copies[np.id].push(next);
    }
  }
  const last = oldProgress?.last;
  if (last && partMap.has(last.partId)) out.last = { partId: partMap.get(last.partId), copy: last.copy };
  return out;
}
