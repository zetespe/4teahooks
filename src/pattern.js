// Pattern format: what a chatbot returns and what the app stores.
// Documented for AIs in docs/AI-PROTOCOL.md; keep the two in step.
//
// Imported JSON is written by AIs, so `normalizePattern` is forgiving: it
// accepts common aliases, fills defaults, makes ids unique and collects
// warnings instead of failing, as long as there is something to crochet.

export const PATTERN_TYPE = "4tea-hooks-pattern";
export const PATTERN_VERSION = 1;

export const STEP_KINDS = ["row", "round", "repeat", "action", "note"];
export const ACTIONS = ["fasten_off", "stuff", "safety_eyes", "sew", "join", "button", "embroider", "block", "weave_in", "change_colour", "place_marker", "other"];
export const PART_TYPES = ["piece", "assembly", "finishing"];

const KIND_ALIASES = {
  rnd: "round", rnds: "round", rounds: "round", round: "round",
  row: "row", rows: "row", line: "row", instruction: "row",
  repeat: "repeat", rep: "repeat", block: "repeat",
  action: "action", step: "action", task: "action",
  note: "note", info: "note", chart: "note", text: "note",
};

export function strList(v) {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : String(v).split(/\r?\n/);
  return arr.map((s) => (typeof s === "string" ? s : s == null ? "" : String(s)).trim()).filter(Boolean);
}

const str = (v) => (v == null ? "" : String(v).trim());
// First whole number in a value: 5, "5", "Rnd 5 (12 sts)" → 5.
const int = (v) => {
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  const m = String(v ?? "").match(/-?\d+/);
  return m ? parseInt(m[0], 10) : null;
};
// A count written by a chatbot: 3, "3", "3 times" are plain; "10 (12, 14)"
// or "2 pairs" are read as their first number with a warning; text without a
// leading number ("until 120 cm") is not a count at all.
function count(v, what, ctx) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? Math.trunc(v) : null;
  const t = String(v).trim();
  if (/^\d+\s*(x|×|times?)?$/i.test(t)) return parseInt(t, 10);
  if (/^\d/.test(t)) { const n = parseInt(t, 10); ctx.warn(`${what}: “${t}” was read as ${n}. Check it against the pattern.`); return n; }
  return null;
}

// A range written as text: "12-18", "Rnds 12–18" → [12, 18]; otherwise null.
const range = (v) => {
  if (typeof v !== "string") return null;
  const m = v.match(/(\d+)\s*(?:-|–|—|to)\s*(\d+)/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
};
export const slug = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function normTerminology(v) {
  const t = str(v).toLowerCase();
  if (/^(us|usa|american|us terms)/.test(t)) return "US";
  if (/^(uk|british|gb|uk terms|au|australian)/.test(t)) return "UK";
  return "unknown";
}

function normAction(v) {
  const a = slug(v).replace(/-/g, "_");
  if (ACTIONS.includes(a)) return a;
  if (/eye/.test(a)) return "safety_eyes";
  if (/stuff/.test(a)) return "stuff";
  if (/fasten|finish_off|tie_off/.test(a)) return "fasten_off";
  if (/sew|seam|attach|whip|mattress/.test(a)) return "sew";
  if (/join|connect/.test(a)) return "join";
  if (/button|zip|snap/.test(a)) return "button";
  if (/embroider|face|mouth|nose/.test(a)) return "embroider";
  if (/block/.test(a)) return "block";
  if (/weave|ends/.test(a)) return "weave_in";
  if (/colou?r/.test(a)) return "change_colour";
  if (/marker/.test(a)) return "place_marker";
  return "other";
}

// Makes ids unique across the whole pattern: progress is stored by id, so a
// clash would tick two rows at once. Ids are also used as object keys, so
// names like "constructor" (inherited by every object) are avoided.
function idMaker() {
  const seen = new Set();
  return (wanted, fallback) => {
    let base = slug(wanted) || fallback;
    if (base in Object.prototype) base += "-x";
    let id = base, n = 2;
    while (seen.has(id)) id = `${base}-${n++}`;
    seen.add(id);
    return id;
  };
}

function normStep(raw, ctx, path) {
  const where = (s) => `${ctx.part}${s ? `, ${s}` : ""}`;
  if (typeof raw === "string") raw = { kind: "row", text: raw };
  if (!raw || typeof raw !== "object") return null;
  let kind = KIND_ALIASES[str(raw.kind || raw.type).toLowerCase()];
  if (!kind) kind = Array.isArray(raw.steps) ? "repeat" : raw.action ? "action" : "row";
  const s = { id: ctx.id(raw.id, `${path}`), kind };
  const label = str(raw.label || raw.name || raw.title);
  if (label) s.label = label;
  const text = str(raw.text || raw.instructions || raw.instruction || raw.description);
  if (text) s.text = text;
  const original = str(raw.original || raw.source || raw.raw);
  if (original && original !== text) s.original = original;
  const note = str(raw.note || raw.notes || raw.tip);
  if (note) s.note = note;

  if (kind === "row" || kind === "round") {
    const r = range(raw.from) || range(raw.number);
    let from = r ? r[0] : int(raw.from ?? raw.number), to = r ? r[1] : int(raw.to ?? raw.number);
    if (from != null && to == null) to = from;
    if (to != null && from == null) from = to;
    if (from != null && to != null) {
      if (to < from) [from, to] = [to, from];
      if (to - from > 999) { ctx.warn(`${where(label)}: range ${from}–${to} is too long, kept as one line.`); }
      else if (to > from) { s.from = from; s.to = to; }
      else s.number = from;
    }
    const count = raw.count ?? raw.stitchCount ?? raw.sts;
    if (count != null && str(count) !== "") s.count = typeof count === "number" ? count : str(count);
    const st = strList(raw.stitches).map((c) => c.toLowerCase());
    if (st.length) s.stitches = [...new Set(st)];
    if (!text && !label) { ctx.warn(`${where(from != null ? `${kind === "round" ? "Rnd" : "Row"} ${from}${to > from ? `–${to}` : ""}` : "")}: a ${kind} without instructions was skipped.`); return null; }
  } else if (kind === "repeat") {
    const rawTimes = raw.times ?? raw.repeat ?? raw.repeats;
    const times = count(rawTimes, where(label || "a repeat"), ctx);
    if (times != null && times > 0) s.times = Math.min(times, 500);
    let until = str(raw.until);
    if (!until && times == null && typeof rawTimes === "string" && rawTimes.trim()) until = rawTimes.trim().replace(/^until\s+/i, "");
    if (until) s.until = until;
    if (s.times == null && !s.until) s.until = "the pattern says to stop";
    s.steps = (Array.isArray(raw.steps) ? raw.steps : [])
      .map((c, i) => normStep(c, ctx, `${s.id}-${i + 1}`))
      .filter(Boolean);
    if (!s.steps.some((c) => c.kind !== "note")) {
      if (!text) { ctx.warn(`${where(label || "a repeat")}: no rows inside, skipped.`); return null; }
      // A repeat described only in words still has to be worked: one line per repeat.
      s.steps = [{ id: ctx.id(`${s.id}-row`, `${s.id}-row`), kind: "row", text }];
    }
  } else if (kind === "action") {
    s.action = normAction(raw.action || raw.what || label || text);
    if (!text && !label) { ctx.warn(`${where()}: an action without text was skipped.`); return null; }
    if (!text) s.text = label;
  } else if (kind === "note") {
    if (!text && !label) return null;
  }
  return s;
}

function normPart(raw, ctx, i) {
  if (!raw || typeof raw !== "object") return null;
  const name = str(raw.name || raw.title || raw.label) || `Part ${i + 1}`;
  const p = { id: ctx.id(raw.id || name, `part-${i + 1}`), name };
  ctx.part = name;
  const make = count(raw.make ?? raw.quantity ?? raw.copies, `${name}: how many to make`, ctx);
  p.make = make != null && make > 0 ? Math.min(make, 200) : 1;
  const type = slug(raw.type);
  p.type = PART_TYPES.includes(type) ? type : /assembl|making.up|sew/.test(slug(name)) ? "assembly" : /finish/.test(slug(name)) ? "finishing" : "piece";
  const yarn = str(raw.yarn || raw.color || raw.colour);
  if (yarn) p.yarn = yarn;
  const notes = strList(raw.notes);
  if (notes.length) p.notes = notes;
  p.steps = (Array.isArray(raw.steps) ? raw.steps : Array.isArray(raw.rows) ? raw.rows : [])
    .map((s, j) => normStep(s, ctx, `${p.id}-${j + 1}`))
    .filter(Boolean);
  if (!p.steps.length) { ctx.warn(`${name} had no steps and was skipped.`); return null; }
  capUnits(p, ctx);
  return p;
}

// Nested repeats multiply (500 × 500 × a range…), which would make a part too
// big to show or store. Over the limit, the biggest counted repeats become
// counters: the user counts repetitions instead of ticking each row.
export const MAX_UNITS_PER_PART = 3000;
const unitCount = (steps) => steps.reduce((n, s) => n + (
  s.kind === "note" ? 0
    : s.kind === "repeat" ? (s.times == null ? 1 : s.times * unitCount(s.steps))
      : s.from != null ? s.to - s.from + 1 : 1), 0);

function capUnits(part, ctx) {
  while (unitCount(part.steps) > MAX_UNITS_PER_PART) {
    let biggest = null, size = 0;
    const walk = (steps) => steps.forEach((s) => {
      if (s.kind !== "repeat") return;
      if (s.times != null) { const n = s.times * unitCount(s.steps); if (n > size) { biggest = s; size = n; } }
      walk(s.steps);
    });
    walk(part.steps);
    if (!biggest) break;
    biggest.until = `you've worked it ${biggest.times} times`;
    delete biggest.times;
    ctx.warn(`${part.name}: “${biggest.label || "a repeat"}” is too long to tick row by row, so it has a counter instead.`);
  }
}

export function normalizePattern(raw) {
  if (!raw || typeof raw !== "object") throw new Error("That isn't a pattern.");
  if (raw.pattern && typeof raw.pattern === "object" && !raw.parts) raw = raw.pattern;
  const warnings = [];
  const ctx = { id: idMaker(), warn: (m) => warnings.push(m) };
  const parts = (Array.isArray(raw.parts) ? raw.parts : Array.isArray(raw.sections) ? raw.sections : [])
    .map((p, i) => normPart(p, ctx, i))
    .filter(Boolean);
  if (!parts.length) throw new Error("No parts with rows found. Ask the chatbot to follow the format exactly.");

  const m = raw.materials && typeof raw.materials === "object" ? raw.materials : {};
  const yarns = (Array.isArray(m.yarns) ? m.yarns : strList(m.yarns || m.yarn))
    .map((y, i) => (typeof y === "string" ? { id: String.fromCharCode(65 + i), label: y } : { id: str(y.id) || String.fromCharCode(65 + i), label: str(y.label || y.name || y.description) }))
    .filter((y) => y.label);
  const pattern = {
    type: PATTERN_TYPE,
    version: PATTERN_VERSION,
    title: str(raw.title || raw.name) || "Untitled pattern",
    designer: str(raw.designer || raw.author),
    sourceUrl: /^https?:\/\//i.test(str(raw.sourceUrl || raw.source || raw.url)) ? str(raw.sourceUrl || raw.source || raw.url) : "",
    category: str(raw.category),
    size: str(raw.size),
    terminology: normTerminology(raw.terminology || raw.terms),
    materials: {
      yarns,
      hook: str(m.hook || m.hooks),
      notions: strList(m.notions || m.other),
    },
    gauge: str(raw.gauge),
    notes: strList(raw.notes),
    stitches: (Array.isArray(raw.stitches) ? raw.stitches : [])
      .map((x) => (x && typeof x === "object" ? { code: str(x.code || x.abbr || x.abbreviation).toLowerCase(), name: str(x.name), how: strList(x.how || x.steps || x.definition) } : null))
      .filter((x) => x && (x.code || x.name)),
    parts,
  };
  if (pattern.terminology === "unknown") warnings.push("The chatbot didn't say whether the pattern uses US or UK terms. Stitch help assumes US terms.");
  return { pattern, warnings };
}

// ---- expanding steps into tickable units ----
//
// A unit is one thing to tick: a single row/round, one row of one repetition,
// an action, or (for open-ended repeats) a counter that is ticked when done.
// Keys are stable across re-imports as long as step ids stay the same.

const lineWord = (kind) => (kind === "round" ? "Rnd" : "Row");

// Lines inside a repeat often have no number of their own ("sc around"):
// they are named after the repeat ("Rnds 2–3"), and the unit's `rep` says
// which repetition it is.
function lineLabel(step, n, rep) {
  if (n != null) return `${lineWord(step.kind)} ${n}`;
  if (step.label) return step.label;
  if (step.number != null) return `${lineWord(step.kind)} ${step.number}`;
  if (rep && rep.label) return rep.label;
  return step.kind === "round" ? "Round" : "Row";
}

function expandStep(step, prefix, rep, out) {
  if (step.kind === "note") return;
  if (step.kind === "row" || step.kind === "round") {
    if (step.from != null) {
      for (let n = step.from; n <= step.to; n++) out.push({ key: `${prefix}${step.id}#${n}`, step, kind: "line", label: lineLabel(step, n, rep), rep });
    } else out.push({ key: `${prefix}${step.id}`, step, kind: "line", label: lineLabel(step, null, rep), rep });
    return;
  }
  if (step.kind === "action") { out.push({ key: `${prefix}${step.id}`, step, kind: "action", label: step.label || "", rep }); return; }
  if (step.kind === "repeat") {
    if (step.times == null) { out.push({ key: `${prefix}${step.id}`, step, kind: "counter", label: step.label || "Repeat", rep }); return; }
    for (let i = 1; i <= step.times; i++) {
      const r = { i, of: step.times, stepId: step.id, label: step.label || "", outer: rep };
      for (const c of step.steps) expandStep(c, `${prefix}${step.id}@${i}/`, r, out);
    }
  }
}

export function unitsOfStep(step) {
  const out = [];
  expandStep(step, "", null, out);
  return out;
}

// Called many times per render (tabs, progress, resume card), so cached per
// part object; parts are replaced, never mutated, when the state changes.
const unitCache = new WeakMap();
export function unitsOfPart(part) {
  let u = unitCache.get(part);
  if (!u) { u = part.steps.flatMap((s) => unitsOfStep(s)); unitCache.set(part, u); }
  return u;
}

// Every stitch code a step (and its children) uses, in order of first use.
export function stitchesOfStep(step) {
  const out = [];
  const walk = (s) => { (s.stitches || []).forEach((c) => out.includes(c) || out.push(c)); (s.steps || []).forEach(walk); };
  walk(step);
  return out;
}

// ---- reading the chatbot's answer ----

// Finds the JSON object in a pasted answer. Chatbots wrap it in prose that
// may contain small objects of its own, so an object that looks like a
// pattern or a backup wins; otherwise the first non-empty object is used.
export function extractJSON(text) {
  const found = jsonObjects(String(text));
  const best = found.find((v) => Array.isArray(v.parts) || Array.isArray(v.sections) || Array.isArray(v.projects) || (v.pattern && typeof v.pattern === "object"));
  if (best) return best;
  if (found.length) return found[0];
  if (/[{[]/.test(text) && /"parts"|"projects"/.test(text)) throw new Error("Found the pattern, but it isn't valid JSON (maybe cut off). Ask the chatbot to send the complete JSON again.");
  throw new Error("No JSON found in the pasted text.");
}

function jsonObjects(s) {
  const out = [];
  for (let start = s.indexOf("{"); start !== -1; start = s.indexOf("{", start + 1)) {
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < s.length; i++) {
      const c = s[i];
      if (esc) { esc = false; continue; }
      if (inStr) { if (c === "\\") esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === "{") depth++;
      else if (c === "}" && --depth === 0) {
        // A trivial brace expression in surrounding prose must not hijack the
        // import: only a non-empty object counts.
        try {
          const chunk = s.slice(start, i + 1);
          let v;
          // Chatbots sometimes leave trailing commas: "[1, 2,]".
          try { v = JSON.parse(chunk); } catch (e) { v = JSON.parse(chunk.replace(/,(\s*[}\]])/g, "$1")); }
          if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length) { out.push(v); start = i; }
        } catch (e) { /* keep scanning */ }
        break;
      }
    }
  }
  return out;
}
