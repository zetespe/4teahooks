import { describe, it, expect } from "vitest";
import sample from "./fixtures/sample-pattern.json";
import { normalizePattern, unitsOfPart } from "./pattern";
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
    expect(applyBackup(s, file, "replace").state.projects).toHaveLength(1);
  });
  it("merging an older backup never undoes newer progress", () => {
    const p = make();
    tick(p, "body", 0, "b1");
    const old = JSON.parse(JSON.stringify(exportObject({ projects: [p] })));
    old.projects[0].updatedAt = "2020-01-01T00:00:00.000Z";
    tick(p, "body", 0, "b2");
    const s = { ...emptyState(), projects: [p] };
    const r = applyBackup(s, old);
    expect(r.report).toMatch(/kept as on this device/);
    expect(Object.keys(r.state.projects[0].progress.copies.body[0].done)).toEqual(["b1", "b2"]);
    const newer = JSON.parse(JSON.stringify(exportObject(s)));
    newer.projects[0].updatedAt = "2999-01-01T00:00:00.000Z";
    expect(applyBackup(s, newer).report).toBe("1 updated");
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

describe("robustness (QA findings)", () => {
  it("a part or step called 'constructor' neither crashes nor starts ticked", () => {
    const pat = normalizePattern({ parts: [{ name: "Constructor", steps: [{ id: "constructor", text: "sc" }, { id: "b", text: "sc" }] }] }).pattern;
    const p = newProject(pat);
    expect(projectProgress(p).done).toBe(0);
    tick(p, pat.parts[0].id, 0, pat.parts[0].steps[1].id);
    const again = normalizeProject(JSON.parse(JSON.stringify(p)));
    expect(projectProgress(again).done).toBe(1);
  });
  it("broken stored progress doesn't throw or lose the project", () => {
    const p = make();
    p.progress = { copies: { body: [null, "x"], ear: "nope" }, last: 5 };
    const again = normalizeProject(JSON.parse(JSON.stringify(p)));
    expect(again).not.toBeNull();
    expect(projectProgress(again).done).toBe(0);
  });
  it("re-import keeps the previous version and reports what is kept", async () => {
    const { keptAfterReimport } = await import("./progress");
    const p = make();
    tick(p, "body", 0, "b1");
    tick(p, "body", 0, "b2");
    const changed = structuredClone(p.pattern);
    changed.parts[0].steps[1].id = "b2-new";
    // The renamed row is matched by its label and text, so nothing is lost.
    expect(keptAfterReimport(p.pattern, p.progress, normalizePattern(changed).pattern)).toEqual({ before: 2, after: 2 });
    changed.parts[0].steps.splice(0, 2);
    expect(keptAfterReimport(p.pattern, p.progress, normalizePattern(changed).pattern)).toEqual({ before: 2, after: 0 });
  });
  it("UK full names and abbreviations resolve in the pattern's terms", () => {
    expect(findStitch("double crochet", "US").id).toBe("dc");
    expect(findStitch("double crochet", "UK").id).toBe("sc");
    expect(findStitch("treble", "UK").id).toBe("dc");
    expect(explain("mc", null).lib).toBeNull();
  });
});

describe("resume order (browser QA)", () => {
  it("prefers a half-done copy over an untouched part", () => {
    const p = make();
    tick(p, "ear", 1, "e1");
    for (const u of partProgress(p.pattern.parts[2], copyState(p, "making-up", 0)).units) tick(p, "making-up", 0, u.key);
    const r = resumePoint(p);
    expect([r.part.id, r.copy]).toEqual(["ear", 1]);
  });
});

describe("re-import keeps progress when the chatbot changes ids", async () => {
  const { remapProgress, keptAfterReimport } = await import("./progress");
  const done = (pr, part, copy = 0) => Object.keys(pr.copies[part][copy].done).sort();

  it("same pattern, only the link changed: everything kept", () => {
    const p = make();
    tick(p, "body", 0, "b1"); tick(p, "body", 0, "b3#5"); tick(p, "ear", 1, "e2@2/e2a");
    editCopy(p, "body", 0, (cs) => { cs.notes["b3#6"] = "half way"; });
    const next = structuredClone(p.pattern); next.sourceUrl = "https://example.com/the-real-page";
    expect(keptAfterReimport(p.pattern, p.progress, next)).toEqual({ before: 4, after: 4 });
  });

  it("all ids renamed: ticks follow the rows by label, repeat and text", () => {
    const p = make();
    tick(p, "body", 0, "b1"); tick(p, "body", 0, "b3#5"); tick(p, "body", 0, "b-eyes"); tick(p, "ear", 1, "e2@2/e2a");
    const json = JSON.parse(JSON.stringify(p.pattern).replace(/"id":"([^"]+)"/g, '"id":"new-$1"'));
    const next = normalizePattern(json).pattern;
    const pr = remapProgress(p.pattern, p.progress, next);
    expect(done(pr, "new-body")).toEqual(["new-b-eyes", "new-b1", "new-b3#5"]);
    expect(done(pr, "new-ear", 1)).toEqual(["new-e2@2/new-e2a"]);
    expect(pr.last).toEqual({ partId: "new-ear", copy: 1 });
  });

  it("a row inserted in the middle doesn't shift ticks onto the wrong row", () => {
    const p = make();
    tick(p, "body", 0, "b1"); tick(p, "body", 0, "b2");
    const json = structuredClone(p.pattern);
    json.parts[0].steps.splice(1, 0, { id: "x", kind: "action", action: "place_marker", text: "Place a marker." });
    json.parts[0].steps.forEach((s, i) => { s.id = "s" + i; });
    const next = normalizePattern(json).pattern;
    const pr = remapProgress(p.pattern, p.progress, next);
    const labels = unitsOfPart(next.parts[0]).filter((u) => pr.copies.body[0].done[u.key]).map((u) => u.label);
    expect(labels).toEqual(["Rnd 1", "Rnd 2"]);
  });
});
