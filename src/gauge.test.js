import { describe, it, expect } from "vitest";
import { normalizeGauge, checkSwatch, canCheck, swatchPlan, hookMm, gaugeLine } from "./gauge";
import { normalizePattern } from "./pattern";
import { normalizeProject, newProject } from "./store";
import sample from "./fixtures/sample-pattern.json";

const g = normalizeGauge({ text: "17 dc and 9 rows = 10 x 10 cm", stitches: 17, rows: 9, over: 10, unit: "cm", stitch: "dc", hook: "4 mm", critical: true });

describe("normalizeGauge", () => {
  it("keeps the counts and the pattern's words", () => {
    expect(g).toMatchObject({ stitches: 17, rows: 9, over: 10, unit: "cm", stitch: "dc", hook: "4 mm", critical: true });
    expect(canCheck(g)).toBe(true);
  });

  it("reads plain text from older patterns without guessing numbers", () => {
    expect(normalizeGauge("Not critical; work tightly.")).toEqual({ text: "Not critical; work tightly.", critical: false });
    const t = normalizeGauge("17 dc x 9 rows = 10 cm");
    expect(t.critical).toBe(true);
    expect(canCheck(t)).toBe(false);
    expect(normalizeGauge("")).toBeNull();
  });

  it("accepts loose AI output", () => {
    const x = normalizeGauge({ sts: "14 sc", rows: "17", over: "4", unit: "inches", critical: "no" });
    expect(x).toMatchObject({ stitches: 14, rows: 17, over: 4, unit: "in", critical: false });
    expect(x.text).toBe(gaugeLine(x));
  });

  it("drops counts that have no width", () => {
    expect(canCheck(normalizeGauge({ text: "Rnds 1-5 = 7 cm across", stitches: 30 }))).toBe(false);
  });

  it("is part of a normalised pattern", () => {
    expect(normalizePattern(structuredClone(sample)).pattern.gauge).toEqual({ text: "Not critical; work tightly.", critical: false });
  });
});

describe("checkSwatch", () => {
  it("matches within the tolerance", () => {
    expect(checkSwatch(g, { stitches: 17.5, rows: 9 }, 5).verdict).toBe("match");
    expect(checkSwatch(g, { stitches: 18 }, 5).verdict).toBe("more");
    expect(checkSwatch(g, { stitches: 18 }, 10).verdict).toBe("match");
  });

  it("suggests a bigger hook for too many stitches and a smaller one for too few", () => {
    expect(checkSwatch(g, { stitches: 19, hook: "4 mm" })).toMatchObject({ verdict: "more", by: "stitches", hook: "4.5 mm" });
    expect(checkSwatch(g, { stitches: "15", hook: "4,5" })).toMatchObject({ verdict: "fewer", hook: "4 mm" });
    expect(checkSwatch(g, { stitches: 19, hook: "H" }).hook).toBeUndefined();
  });

  it("decides on stitches and reports rows separately", () => {
    const c = checkSwatch(g, { stitches: 17, rows: 11 });
    expect(c.verdict).toBe("match");
    expect(c.rows.result).toBe("more");
  });

  it("uses rows when the pattern gives only rows", () => {
    const r = normalizeGauge({ rows: 20, over: 10 });
    expect(checkSwatch(r, { rows: 17 })).toMatchObject({ verdict: "fewer", by: "rows" });
    expect(checkSwatch(r, {})).toBeNull();
  });
});

describe("helpers", () => {
  it("plans a swatch bigger than the measured square", () => {
    expect(swatchPlan(g)).toEqual({ size: 15, stitches: 26, rows: 14 });
  });

  it("reads hook sizes", () => {
    expect(hookMm("4 mm")).toBe(4);
    expect(hookMm("H-8 / 5 mm")).toBe(5);
    expect(hookMm("3,5")).toBe(3.5);
    expect(hookMm("H-8")).toBeNull();
  });
});

describe("swatches in a project", () => {
  it("keep valid entries through backup and restore", () => {
    const p = newProject(normalizePattern(structuredClone(sample)).pattern);
    p.swatches = [{ id: "s1", at: "2026-01-01T00:00:00Z", hook: "4 mm", stitches: 18, rows: 9 }, { id: "bad" }, null];
    const back = normalizeProject(JSON.parse(JSON.stringify(p)));
    expect(back.swatches).toEqual([{ id: "s1", at: "2026-01-01T00:00:00Z", hook: "4 mm", stitches: 18, rows: 9 }]);
    expect(normalizeProject({ ...p, swatches: undefined }).swatches).toEqual([]);
  });
});
