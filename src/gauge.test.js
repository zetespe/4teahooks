import { describe, it, expect } from "vitest";
import { normalizeGauge, checkSwatch, canCheck, gaugeTarget, swatchPlan, hookMm, nextHook, fmtMm, gaugeLine, parseCount, textShowsNumbers } from "./gauge";
import { normalizePattern } from "./pattern";
import { normalizeProject, newProject, applyBackup, emptyState } from "./store";
import sample from "./fixtures/sample-pattern.json";

const g = normalizeGauge({ text: "17 dc and 9 rows = 10 x 10 cm", stitches: 17, rows: 9, over: 10, unit: "cm", stitch: "dc", hook: "4 mm", critical: true });
const t = gaugeTarget(g, "cm");

describe("normalizeGauge", () => {
  it("keeps the counts and the pattern's words", () => {
    expect(g).toMatchObject({ stitches: 17, rows: 9, over: 10, unit: "cm", stitch: "dc", hook: "4 mm", critical: true });
    expect(canCheck(g)).toBe(true);
    expect(textShowsNumbers(g)).toBe(true);
  });

  it("reads plain text from older patterns without guessing numbers", () => {
    expect(normalizeGauge("Not critical; work tightly.")).toEqual({ text: "Not critical; work tightly.", critical: false });
    const x = normalizeGauge("17 dc x 9 rows = 10 cm");
    expect(x.critical).toBe(true);
    expect(canCheck(x)).toBe(false);
    expect(normalizeGauge("")).toBeNull();
  });

  it("finds inches even when the unit field is missing or odd", () => {
    expect(normalizeGauge({ stitches: 16, rows: 20, over: "4 in" }).unit).toBe("in");
    expect(normalizeGauge({ stitches: 16, over: 4, unit: "in." }).unit).toBe("in");
    expect(normalizeGauge({ stitches: 16, over: '4"' }).unit).toBe("in");
    expect(normalizeGauge({ text: "16 sc = 4 inches", stitches: 16, over: 4 }).unit).toBe("in");
    expect(normalizeGauge({ text: "16 sc = 10 cm", stitches: 16, over: 10 }).unit).toBe("cm");
    expect(normalizeGauge({ stitches: 16, over: 4, unit: "centimetres" }).unit).toBe("cm");
  });

  it("uses the width to choose when the text gives both units", () => {
    expect(normalizeGauge({ text: "16 sc = 10 cm / 4 in", stitches: 16, over: 4 }).unit).toBe("in");
    expect(normalizeGauge({ text: "16 sc = 10 cm / 4 in", stitches: 16, over: 10 }).unit).toBe("cm");
  });

  it("leaves the unit unknown rather than guessing cm", () => {
    const x = normalizeGauge({ stitches: 16, over: 4 });
    expect(x.unit).toBeUndefined();
    expect(gaugeTarget(x, x.unit)).toBeNull();
    expect(gaugeTarget(x, "in")).toMatchObject({ span: 4, stitches: 16, scaled: false });
  });

  it("accepts loose AI output", () => {
    const x = normalizeGauge({ sts: "14 sc", rows: "17", over: "4", unit: "inches", critical: "no" });
    expect(x).toMatchObject({ stitches: 14, rows: 17, over: 4, unit: "in", critical: false });
    expect(x.text).toBe(gaugeLine(x));
    expect(normalizeGauge({ stitches: 14, over: 10, critical: "None" }).critical).toBe(false);
  });

  it("knows a gauge counted in rounds", () => {
    expect(normalizeGauge({ stitches: 22, rounds: 24, over: 10, unit: "cm" })).toMatchObject({ rows: 24, rounds: true });
    expect(gaugeTarget(normalizeGauge({ stitches: 22, rounds: 24, over: 10, unit: "cm" }), "cm").rowWord).toBe("rounds");
    expect(normalizeGauge({ text: "22 sc and 24 rnds = 10 cm", stitches: 22, rows: 24, over: 10 }).rounds).toBe(true);
    expect(g.rounds).toBeUndefined();
  });

  it("drops counts that have no width, sizes or ranges", () => {
    expect(canCheck(normalizeGauge({ text: "Rnds 1-5 = 7 cm across", stitches: 30 }))).toBe(false);
    expect(normalizeGauge({ stitches: "15 (16, 17)", over: 10 })?.stitches).toBeUndefined();
    expect(normalizeGauge({ stitches: "15-17", over: 10 })?.stitches).toBeUndefined();
    expect(normalizeGauge({ stitches: -17, rows: 9, over: 10 })?.stitches).toBeUndefined();
  });

  it("is part of a normalised pattern", () => {
    expect(normalizePattern(structuredClone(sample)).pattern.gauge).toEqual({ text: "Not critical; work tightly.", critical: false });
  });

  it("says when the text doesn't show what was read", () => {
    expect(textShowsNumbers(normalizeGauge({ text: "Gauge: see the pattern", stitches: 17, over: 10, unit: "cm" }))).toBe(false);
  });
});

describe("counts", () => {
  it("reads halves and fractions", () => {
    expect(parseCount("17½")).toBe(17.5);
    expect(parseCount("17 1/2")).toBe(17.5);
    expect(parseCount("17,5")).toBe(17.5);
    expect(parseCount("-17")).toBeNull();
    expect(parseCount("")).toBeNull();
  });
});

describe("gaugeTarget", () => {
  it("compares a gauge over a short width as a rate over 4 in", () => {
    const x = gaugeTarget(normalizeGauge({ text: "4 sts = 1 in", stitches: 4, over: 1, unit: "in" }), "in");
    expect(x).toMatchObject({ span: 4, per: "4 in", stitches: 16, scaled: true });
  });

  it("plans a swatch of at least 15 cm or 6 in", () => {
    expect(swatchPlan(t)).toEqual({ size: 15, stitches: 26, rows: 14 });
    expect(swatchPlan(gaugeTarget(normalizeGauge({ stitches: 4, over: 1, unit: "in" }), "in")).size).toBe(6);
  });
});

describe("checkSwatch", () => {
  it("matches within the tolerance, including the boundary", () => {
    expect(checkSwatch(t, { stitches: 17.5, rows: 9 }, 5).verdict).toBe("match");
    expect(checkSwatch(t, { stitches: 18 }, 5).verdict).toBe("more");
    expect(checkSwatch(t, { stitches: 18 }, 10).verdict).toBe("match");
    const t20 = gaugeTarget(normalizeGauge({ stitches: 20, over: 10, unit: "cm" }), "cm");
    expect(checkSwatch(t20, { stitches: 21 }, 5).verdict).toBe("match");
    expect(checkSwatch(t20, { stitches: 19 }, 5).verdict).toBe("match");
    expect(checkSwatch(t20, { stitches: 21.5 }, 5).verdict).toBe("more");
  });

  it("suggests the next real hook size", () => {
    expect(checkSwatch(t, { stitches: 19, hook: "4 mm" })).toMatchObject({ verdict: "more", by: "stitches", hook: "4.5 mm" });
    expect(checkSwatch(t, { stitches: "15", hook: "4,5" })).toMatchObject({ verdict: "fewer", hook: "4 mm" });
    expect(checkSwatch(t, { stitches: 19, hook: "3.25" }).hook).toBe("3.5 mm");
    expect(checkSwatch(t, { stitches: 15, hook: "3.25 mm" }).hook).toBe("3 mm");
    expect(checkSwatch(t, { stitches: 19, hook: "H" }).hook).toBeUndefined();
    expect(checkSwatch(t, { stitches: 19, hook: "US 7" }).hook).toBeUndefined();
  });

  it("decides on stitches and never on rows alone when the pattern gives stitches", () => {
    const c = checkSwatch(t, { stitches: 17, rows: 11 });
    expect(c.verdict).toBe("match");
    expect(c.rows.result).toBe("more");
    expect(checkSwatch(t, { rows: 11 })).toBeNull();
  });

  it("uses rows when the pattern gives only rows", () => {
    const r = gaugeTarget(normalizeGauge({ rows: 20, over: 10, unit: "cm" }), "cm");
    expect(checkSwatch(r, { rows: 17 })).toMatchObject({ verdict: "fewer", by: "rows" });
    expect(checkSwatch(r, {})).toBeNull();
  });
});

describe("hooks", () => {
  it("reads hook sizes", () => {
    expect(hookMm("4 mm")).toBe(4);
    expect(hookMm("H-8 / 5 mm")).toBe(5);
    expect(hookMm("3,5")).toBe(3.5);
    expect(hookMm("H-8")).toBeNull();
  });

  it("steps through sizes that are sold", () => {
    expect(nextHook(3.75, 1)).toBe(4);
    expect(nextHook(8, 1)).toBe(9);
    expect(nextHook(10, 1)).toBe(12);
    expect(nextHook(2, -1)).toBe(1.75);
    expect(nextHook(4.2, 1)).toBe(4.5);
    expect(nextHook(25, 1)).toBeNull();
    expect(fmtMm(3.75)).toBe("3.75 mm");
    expect(fmtMm(4)).toBe("4 mm");
  });
});

describe("swatches in a project", () => {
  const p = newProject(normalizePattern(structuredClone(sample)).pattern);
  p.swatches = [{ id: "s1", at: "2026-01-01T00:00:00Z", hook: "4 mm", stitches: 18, rows: 9 }, { id: "bad" }, null];
  p.gaugeUnit = "in";

  it("keep valid entries and the chosen unit through backup and restore", () => {
    const back = normalizeProject(JSON.parse(JSON.stringify(p)));
    expect(back.swatches).toEqual([{ id: "s1", at: "2026-01-01T00:00:00Z", hook: "4 mm", stitches: 18, rows: 9 }]);
    expect(back.gaugeUnit).toBe("in");
    expect(normalizeProject({ ...p, swatches: undefined, gaugeUnit: "furlong" })).toMatchObject({ swatches: [] });
    expect(normalizeProject({ ...p, gaugeUnit: "furlong" }).gaugeUnit).toBeUndefined();
  });

  it("merge from a backup with the newer project", () => {
    const state = { ...emptyState(), projects: [normalizeProject({ ...p, swatches: [], updatedAt: "2026-01-01T00:00:00Z" })] };
    const newer = { ...p, updatedAt: "2026-02-01T00:00:00Z" };
    const r = applyBackup(state, { projects: [newer] }, "merge");
    expect(r.state.projects[0].swatches).toHaveLength(1);
  });

  it("turn an old string gauge into an object", () => {
    const old = JSON.parse(JSON.stringify(p));
    old.pattern.gauge = "18 sc = 10 cm";
    expect(normalizeProject(old).pattern.gauge).toEqual({ text: "18 sc = 10 cm", critical: true });
  });
});
