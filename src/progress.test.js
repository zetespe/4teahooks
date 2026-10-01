import { describe, it, expect } from "vitest";
import sample from "./fixtures/sample-pattern.json";
import { normalizePattern } from "./pattern";
import { editCopy, copyState, partProgress, projectProgress, resumePoint, pruneProgress } from "./progress";
import { newProject, normalizeProject, applyBackup, exportObject, emptyState } from "./store";
import { findStitch, explain, isAmbiguous } from "./stitches";

const make = () => newProject(normalizePattern(structuredClone(sample)).pattern);
const tick = (p, partId, copy, key) => editCopy(p, partId, copy, (cs) => { cs.done[key] = "t"; });

describe("progress", () => {
  it("counts every copy of every part", () => {
    const p = make();
    // body 9 units, ear 3 units × 2 copies, making up 2 units
    expect(projectProgress(p)).toMatchObject({ done: 0, total: 17, pct: 0, finished: false });
  });

  it("resumes at the next unticked row of the part last worked on", () => {
    const p = make();
    expect(resumePoint(p).unit.key).toBe("b1");
    tick(p, "ear", 1, "e1");
    const r = resumePoint(p);
    expect(r.part.id).toBe("ear");
    expect(r.copy).toBe(1);
    expect(r.unit.key).toBe("e2@1/e2a");
  });

  it("shows the 'where I stopped' note of the next row", () => {
    const p = make();
    editCopy(p, "body", 0, (cs) => { cs.done.b1 = "t"; cs.notes.b2 = "4 of 6 done, blue marker"; });
    expect(resumePoint(p).note).toBe("4 of 6 done, blue marker");
  });

  it("moves on to the next unfinished part when the last one is done", () => {
    const p = make();
    for (const u of partProgress(p.pattern.parts[1], copyState(p, "ear", 0)).units) tick(p, "ear", 0, u.key);
    const r = resumePoint(p);
    expect(r.part.id).toBe("body");
  });

  it("finishes when everything is ticked", () => {
    const p = make();
    for (const part of p.pattern.parts) for (let c = 0; c < part.make; c++)
      for (const u of partProgress(part, copyState(p, part.id, c)).units) tick(p, part.id, c, u.key);
    expect(projectProgress(p).finished).toBe(true);
    expect(resumePoint(p)).toBeNull();
  });

  it("keeps progress for rows that survive a re-import and drops the rest", () => {
    const p = make();
    tick(p, "body", 0, "b3#4");
    tick(p, "ear", 1, "e1");
    const changed = structuredClone(p.pattern);
    changed.parts[0].steps[2].to = 5; // Rnds 3–5 now
    changed.parts[1].make = 1;
    const pr = pruneProgress(p.progress, changed);
    expect(pr.copies.body[0].done).toEqual({ "b3#4": "t" });
    expect(pr.copies.ear).toHaveLength(1);
  });
});

describe("backups", () => {
  it("round-trips through export and merge", () => {
    const p = make();
    tick(p, "body", 0, "b1");
    const s = { ...emptyState(), projects: [p] };
    const file = JSON.parse(JSON.stringify(exportObject(s)));
    const { state, report } = applyBackup(emptyState(), file);
    expect(report).toBe("1 added");
    expect(state.projects[0].progress.copies.body[0].done.b1).toBe("t");
    expect(applyBackup(s, file).report).toBe("1 updated");
    expect(applyBackup(s, file, "replace").state.projects).toHaveLength(1);
  });
  it("skips broken projects and refuses files without any", () => {
    expect(normalizeProject({ id: "x" })).toBeNull();
    expect(() => applyBackup(emptyState(), { projects: [{ id: "x" }] })).toThrow(/No projects/);
  });
});

describe("stitch library", () => {
  it("reads dc and tr according to the pattern's terms", () => {
    expect(findStitch("dc", "US").id).toBe("dc");
    expect(findStitch("dc", "UK").id).toBe("sc");
    expect(findStitch("tr", "UK").id).toBe("dc");
    expect(findStitch("htr", "US").id).toBe("hdc"); // UK-only abbreviation still found
    expect(isAmbiguous("dc")).toBe(true);
    expect(isAmbiguous("hdc")).toBe(false);
  });
  it("prefers the pattern's own definition", () => {
    const { pattern } = normalizePattern(structuredClone(sample));
    const e = explain("inv dec", pattern);
    expect(e.own.name).toBe("invisible decrease");
    expect(e.lib.id).toBe("invdec");
    expect(explain("MR", pattern).lib.id).toBe("mr");
    expect(explain("sts", pattern).term).toBe("stitches");
  });
});
