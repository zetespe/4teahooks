// Gauge (tension) swatch: what the pattern asks for and how a swatch compares.
//
// The app only compares the swatch with the pattern's gauge and suggests a
// hook (or yarn) change. It never recalculates the pattern or the finished
// size: the aim is a swatch that matches.

export const TOLERANCES = [3, 5, 10]; // percent, chosen in Settings
export const DEFAULT_TOLERANCE = 5;

const str = (v) => (v == null ? "" : String(v).trim());
// A positive number from 17, "17", "17 sts", "4,5" → 17 / 4.5; otherwise null.
const num = (v) => {
  if (typeof v === "number") return Number.isFinite(v) && v > 0 ? v : null;
  const m = String(v ?? "").match(/\d+(?:[.,]\d+)?/);
  if (!m) return null;
  const n = parseFloat(m[0].replace(",", "."));
  return n > 0 ? n : null;
};
export const parseCount = num;
const NOT_CRITICAL = /\bnot\s+(critical|important|essential)|doesn'?t\s+matter|isn'?t\s+important|no\s+gauge/i;

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
  const rows = num(raw.rows ?? raw.rounds ?? raw.rnds);
  const over = num(raw.over ?? raw.size ?? raw.width);
  if (over && (stitches || rows)) {
    if (stitches) g.stitches = stitches;
    if (rows) g.rows = rows;
    g.over = over;
    g.unit = /^(in|inch|inches|"|″)$/i.test(str(raw.unit)) ? "in" : "cm";
  }
  const stitch = str(raw.stitch || raw.stitchPattern);
  if (stitch) g.stitch = stitch;
  const hook = str(raw.hook);
  if (hook) g.hook = hook;
  const c = raw.critical;
  g.critical = typeof c === "boolean" ? c
    : typeof c === "string" && c.trim() ? !/^(no|false|not)/i.test(c.trim())
      : !NOT_CRITICAL.test(g.text);
  if (!g.text) g.text = gaugeLine(g);
  return g.text ? g : null;
}

// "17 dc and 9 rows = 10 cm"
export function gaugeLine(g) {
  if (!g || !g.over) return "";
  const what = [g.stitches && `${g.stitches} ${g.stitch || "sts"}`, g.rows && `${g.rows} rows`].filter(Boolean).join(" and ");
  return `${what} = ${g.over} ${g.unit}`;
}

export const canCheck = (g) => !!(g && g.over && (g.stitches || g.rows));

// How big to make the swatch: half as big again as the measured square, so
// the count is taken in the middle, away from the edges.
export function swatchPlan(g) {
  const k = 1.5;
  return {
    size: Math.round(g.over * k * 2) / 2,
    stitches: g.stitches ? Math.ceil(g.stitches * k) : null,
    rows: g.rows ? Math.ceil(g.rows * k) : null,
  };
}

// The hook size in mm from what the user typed: "4", "4,5 mm", "H-8 / 5 mm".
export function hookMm(v) {
  const t = str(v);
  const mm = t.match(/(\d+(?:[.,]\d+)?)\s*mm/i);
  if (mm) return parseFloat(mm[1].replace(",", "."));
  const n = t.match(/^\d+(?:[.,]\d+)?$/);
  return n ? parseFloat(n[0].replace(",", ".")) : null;
}

const fmtMm = (n) => `${Number.isInteger(n) ? n : n.toFixed(1).replace(/\.0$/, "")} mm`;

// One count against the pattern's: "match", "more" or "fewer".
function compare(mine, wanted, tolerance) {
  if (!mine || !wanted) return null;
  const diff = (mine - wanted) / wanted;
  return { mine, wanted, result: Math.abs(diff) * 100 <= tolerance + 1e-9 ? "match" : diff > 0 ? "more" : "fewer" };
}

// Compares a swatch with the pattern's gauge. `mine` holds the counts over
// the same width as the pattern's (g.over). Stitches decide the verdict;
// rows only when the pattern gives no stitch count.
export function checkSwatch(g, mine, tolerance = DEFAULT_TOLERANCE) {
  const stitches = compare(num(mine.stitches), g.stitches, tolerance);
  const rows = compare(num(mine.rows), g.rows, tolerance);
  const main = stitches || rows;
  if (!main) return null;
  const verdict = main.result;
  const out = { verdict, by: stitches ? "stitches" : "rows", stitches, rows };
  if (verdict !== "match") {
    // More stitches than the pattern = stitches too small = bigger hook.
    const step = verdict === "more" ? 0.5 : -0.5;
    const now = hookMm(mine.hook);
    if (now && now + step >= 1) out.hook = fmtMm(now + step);
  }
  return out;
}

// Short summary for the swatch history.
export function verdictLabel(v, by = "stitches") {
  return v === "match" ? "Matches" : v === "more" ? `Too many ${by}` : v === "fewer" ? `Too few ${by}` : "";
}
