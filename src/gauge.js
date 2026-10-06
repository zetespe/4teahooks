// Gauge (tension) swatch: what the pattern asks for and how a swatch compares.
//
// The app only compares the swatch with the pattern's gauge and suggests a
// hook (or yarn) change. It never recalculates the pattern or the finished
// size: the aim is a swatch that matches.

export const TOLERANCES = [3, 5, 10]; // percent, chosen in Settings
export const DEFAULT_TOLERANCE = 5;
export const MAX_SWATCHES = 50; // kept per project, newest first
export const UNITS = { cm: { span: 10, name: "centimetres", short: "cm" }, in: { span: 4, name: "inches", short: "in" } };

const str = (v) => (v == null ? "" : String(v).trim());

// A positive number: 17, "17 sts", "4,5", "17½", "17 1/2", "½". A negative
// number, a range ("15-17") or several sizes ("15 (16, 17)", "15/16/17",
// "15, 16, 17", "15/16") give null, so a count is never guessed.
const frac = (a, b) => ([2, 3, 4, 8].includes(b) && a > 0 && a < b ? a / b : null);
function num(v) {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
  const t = str(v).replace(/(\d)\s*([½¼¾])/g, "$1 $2").replace(/½/g, "1/2").replace(/¼/g, "1/4").replace(/¾/g, "3/4");
  if (!t || /^[-–−]/.test(t) || /\(/.test(t) || /\d\s*(?:-|–|—|to)\s*\d/.test(t)
    || /\d\s*,\s+\d/.test(t) || /\d\s*\/\s*\d+\s*\/\s*\d/.test(t)) return null;
  const m = t.match(/(\d+(?:[.,]\d+)?)(?:\s*\/\s*(\d+)|\s+(\d+)\s*\/\s*(\d+))?/);
  if (!m) return null;
  const whole = parseFloat(m[1].replace(",", "."));
  if (m[2]) return frac(whole, +m[2]); // "1/2"; "15/16" is two sizes → null
  let n = whole;
  if (m[3]) { const f = frac(+m[3], +m[4]); if (f == null) return null; n += f; }
  return n > 0 ? n : null;
}
export const parseCount = num;
const NOT_CRITICAL = /\bnot\s+(critical|important|essential)|doesn'?t\s+matter|isn'?t\s+important|no\s+gauge/i;

// The width a gauge is counted over: "10 cm", "4 in / 10 cm", "4 in (10 cm)".
// Only the first measurement counts.
const overOf = (v) => (typeof v === "number" ? num(v) : num(str(v).split(/[/(]/)[0]));

// The unit written right after the width's number in a string: "= 10 cm",
// "10 x 10 cm", "4 in.", '4"'. A number elsewhere ("2 in each st") doesn't
// count.
const UNIT_WORD = /^(?:\s*(?:x|×)\s*\d+(?:[.,]\d+)?)?\s*(cm\b|centimet|in\b|in\.|inch|["″”])/i;
function unitAfter(s, over) {
  const n = String(Math.round(over * 100) / 100).replace(".", "[.,]");
  const re = new RegExp(`(?<![\\d.,])${n}(?![\\d])`, "g");
  let m;
  while ((m = re.exec(s))) {
    const u = s.slice(m.index + m[0].length).match(UNIT_WORD);
    if (u) return /^(cm|centimet)/i.test(u[1]) ? "cm" : "in";
  }
  return undefined;
}

// "cm" or "in" when the chatbot's answer says so clearly; otherwise
// undefined and the user is asked. The unit field, the width and the text
// must agree: when two of them disagree, the user is asked too.
function detectUnit(raw, over, text) {
  const u = str(raw.unit).toLowerCase();
  const field = /^(cm|centi)/.test(u) ? "cm" : /^(in|inch|"|″|”)/.test(u) ? "in" : undefined;
  const width = typeof (raw.over ?? raw.size ?? raw.width) === "string" ? unitAfter(str(raw.over ?? raw.size ?? raw.width).split(/[/(]/)[0], over) : undefined;
  const written = text ? unitAfter(text, over) : undefined;
  const found = [field, width, written].filter(Boolean);
  if (!found.length || found.some((x) => x !== found[0])) return undefined;
  return found[0];
}

// Accepts the chatbot's object or the plain text older patterns have.
// Numbers are kept only when they make sense together; the text is always
// kept so the user can check them against the pattern.
export function normalizeGauge(raw) {
  if (raw == null || raw === "") return null;
  if (typeof raw !== "object") {
    const text = str(raw);
    return text ? { text, critical: !NOT_CRITICAL.test(text) } : null;
  }
  const g = { text: str(raw.text || raw.original || raw.description) };
  const stitches = num(raw.stitches ?? raw.sts);
  const roundsKey = raw.rows == null && (raw.rounds != null || raw.rnds != null);
  const rows = num(raw.rows ?? raw.rounds ?? raw.rnds);
  const over = overOf(raw.over ?? raw.size ?? raw.width);
  if (over && (stitches || rows)) {
    if (stitches) g.stitches = stitches;
    if (rows) g.rows = rows;
    g.over = over;
    const unit = detectUnit(raw, over, g.text);
    if (unit) g.unit = unit;
    if (rows && (roundsKey || raw.inRounds === true || (/\b(rnds?|rounds?)\b/i.test(g.text) && !/\brows?\b/i.test(g.text)))) g.rounds = true;
  }
  const stitch = str(raw.stitch || raw.stitchPattern);
  if (stitch) g.stitch = stitch;
  const hook = str(raw.hook);
  if (hook) g.hook = hook;
  const c = raw.critical;
  g.critical = typeof c === "boolean" ? c
    : typeof c === "string" && c.trim() ? !/^(no|none|false|not)/i.test(c.trim())
      : !NOT_CRITICAL.test(g.text);
  if (!g.text) g.text = gaugeLine(g);
  return g.text ? g : null;
}

const fmt = (n) => String(Math.round(n * 10) / 10);

// "17 dc and 9 rows = 10 cm"
export function gaugeLine(g, unit = g && g.unit) {
  if (!g || !g.over) return "";
  const what = [g.stitches && `${fmt(g.stitches)} ${g.stitch || "sts"}`, g.rows && `${fmt(g.rows)} ${g.rounds ? "rounds" : "rows"}`].filter(Boolean).join(" and ");
  return `${what} = ${fmt(g.over)}${unit ? ` ${unit}` : ""}`;
}

export const canCheck = (g) => !!(g && g.over && (g.stitches || g.rows));

// True when the pattern's text shows every number the app read, so there is
// nothing to double-check.
export function textShowsNumbers(g) {
  const has = (n) => n == null || new RegExp(`(^|[^\\d.,])${fmt(n).replace(".", "[.,]")}(?![\\d])`).test(g.text);
  return has(g.stitches) && has(g.rows) && has(g.over);
}

// What a swatch is compared with. The user always counts over 10 cm or 4 in.
// A pattern that states its gauge over another width ("4 sts = 1 in") is
// compared as a rate, per 4 in, because a count over 1 inch is too rough.
export function gaugeTarget(g, unit) {
  if (!canCheck(g) || !UNITS[unit]) return null;
  const span = UNITS[unit].span;
  const k = span / g.over;
  return {
    unit, span, per: `${span} ${unit}`, scaled: g.over !== span,
    stitches: g.stitches ? Math.round(g.stitches * k * 10) / 10 : null,
    rows: g.rows ? Math.round(g.rows * k * 10) / 10 : null,
    rowWord: g.rounds ? "rounds" : "rows",
  };
}

// How big to make the swatch: half as big again as the measured width, so
// the count is taken in the middle, away from the edges.
export function swatchPlan(t) {
  const k = 1.5;
  return {
    size: t.span * k,
    stitches: t.stitches ? Math.ceil(t.stitches * k) : null,
    rows: t.rows ? Math.ceil(t.rows * k) : null,
  };
}

// The hook size in mm from what the user typed: "4", "4,5 mm", "H-8 / 5 mm".
// The field asks for mm, so a bare number is read as mm; "H-8" or "US 7"
// give null and no hook is suggested.
export function hookMm(v) {
  const t = str(v);
  const mm = t.match(/(\d+(?:[.,]\d+)?)\s*mm/i);
  if (mm) return parseFloat(mm[1].replace(",", "."));
  const n = t.match(/^\d+(?:[.,]\d+)?$/);
  return n ? parseFloat(n[0].replace(",", ".")) : null;
}

// Metric hook sizes that are actually sold.
export const HOOKS = [0.6, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 9, 10, 12, 15, 20, 25];
export function nextHook(mm, dir) {
  if (!mm) return null;
  const h = dir > 0 ? HOOKS.find((x) => x > mm + 1e-9) : [...HOOKS].reverse().find((x) => x < mm - 1e-9);
  return h ?? null;
}
export const fmtMm = (n) => `${String(Number(n.toFixed(2)))} mm`;

// One count against the pattern's: "match", "more" or "fewer".
function compare(mine, wanted, tolerance) {
  if (!mine || !wanted) return null;
  const diff = (mine - wanted) / wanted;
  return { mine, wanted, result: Math.abs(diff) * 100 <= tolerance + 1e-9 ? "match" : diff > 0 ? "more" : "fewer" };
}

// Compares a swatch (counts over t.span) with the target. When the pattern
// gives stitches, they decide: row height depends a lot on how each person
// works, so rows alone never lead to a hook change. Rows decide only when
// the pattern gives no stitch count.
export function checkSwatch(t, mine, tolerance = DEFAULT_TOLERANCE) {
  if (!t) return null;
  const stitches = compare(num(mine.stitches), t.stitches, tolerance);
  const rows = compare(num(mine.rows), t.rows, tolerance);
  const main = t.stitches ? stitches : rows;
  if (!main) return null;
  const by = t.stitches ? "stitches" : t.rowWord;
  const out = { verdict: main.result, by, stitches, rows };
  if (main.result !== "match") {
    // More stitches than the pattern = stitches too small = bigger hook.
    const h = nextHook(hookMm(mine.hook), main.result === "more" ? 1 : -1);
    if (h) out.hook = fmtMm(h);
  }
  return out;
}

// Short summary for the swatch history.
export function verdictLabel(v, by = "stitches") {
  return v === "match" ? "Matches" : v === "more" ? `Too many ${by}` : v === "fewer" ? `Too few ${by}` : "";
}
