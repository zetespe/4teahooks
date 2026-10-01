import { describe, it, expect } from "vitest";
import sample from "./fixtures/sample-pattern.json";
import { normalizePattern, unitsOfPart, extractJSON, stitchesOfStep } from "./pattern";
import { aiPrompt } from "./prompt";

describe("normalizePattern", () => {
  const { pattern, warnings } = normalizePattern(structuredClone(sample));

  it("keeps the pattern's details", () => {
    expect(pattern.title).toBe("Pocket Bunny (sample)");
    expect(pattern.terminology).toBe("US");
    expect(pattern.materials.yarns.map((y) => y.id)).toEqual(["A", "B"]);
    expect(pattern.stitches[0].how).toHaveLength(3);
    expect(warnings).toEqual([]);
  });

  it("reads kinds, actions, ranges and parts", () => {
    const [body, ear, makingUp] = pattern.parts;
    expect(body.steps.map((s) => s.kind)).toEqual(["round", "round", "round", "action", "round", "action"]);
    expect(body.steps[2]).toMatchObject({ from: 3, to: 6 });
    expect(body.steps[3].action).toBe("safety_eyes");
    expect(body.steps[5].action).toBe("fasten_off");
    expect(body.steps[0].stitches).toEqual(["mr", "sc"]);
    expect(ear.make).toBe(2);
    expect(ear.steps[0].kind).toBe("round");
    expect(makingUp.type).toBe("assembly");
  });

  it("makes ids unique so ticks never collide", () => {
    const { pattern: p } = normalizePattern({ parts: [
      { name: "Arm", steps: [{ id: "r1", text: "a" }, { id: "r1", text: "b" }] },
      { name: "Arm", steps: [{ id: "r1", text: "c" }] },
    ] });
    const ids = p.parts.flatMap((x) => [x.id, ...x.steps.map((s) => s.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("accepts loose AI output and warns instead of failing", () => {
    const { pattern: p, warnings: w } = normalizePattern({ title: "Loose", parts: [
      { name: "Square", quantity: "4", steps: ["ch 4, join", { type: "Rnds", from: 9, to: 5, text: "dc around" }, { kind: "row" }] },
    ] });
    expect(p.parts[0].make).toBe(4);
    expect(p.parts[0].steps[0]).toMatchObject({ kind: "row", text: "ch 4, join" });
    expect(p.parts[0].steps[1]).toMatchObject({ kind: "round", from: 5, to: 9 });
    expect(p.parts[0].steps).toHaveLength(2);
    expect(w.some((m) => /US or UK/.test(m))).toBe(true);
  });

  it("rejects something that isn't a pattern", () => {
    expect(() => normalizePattern({ title: "x" })).toThrow(/No parts/);
    expect(() => normalizePattern(null)).toThrow();
  });

  it("is stable when normalised twice (stored projects are re-checked on load)", () => {
    const again = normalizePattern(structuredClone(pattern)).pattern;
    expect(again).toEqual(pattern);
  });
});

describe("unitsOfPart", () => {
  const { pattern } = normalizePattern(structuredClone(sample));
  const [body, ear, makingUp] = pattern.parts;

  it("expands a range into one tick per round", () => {
    const labels = unitsOfPart(body).map((u) => u.label);
    expect(labels).toEqual(["Rnd 1", "Rnd 2", "Rnd 3", "Rnd 4", "Rnd 5", "Rnd 6", "", "Rnd 7", ""]);
    expect(unitsOfPart(body).filter((u) => u.kind === "action")).toHaveLength(2);
  });

  it("expands a counted repeat, skips notes", () => {
    const units = unitsOfPart(ear);
    expect(units.map((u) => u.key)).toEqual(["e1", "e2@1/e2a", "e2@2/e2a"]);
    expect(units[2].rep).toMatchObject({ i: 2, of: 2 });
    expect(units[2].label).toBe("Rnds 2–3"); // unnumbered line is named after its repeat
  });

  it("turns an open-ended repeat into one counter", () => {
    const units = unitsOfPart(makingUp);
    expect(units.map((u) => u.kind)).toEqual(["action", "counter"]);
  });

  it("lists stitches used by a step and its children", () => {
    expect(stitchesOfStep(ear.steps[1])).toEqual(["sc"]);
  });
});

describe("extractJSON", () => {
  it("finds the object inside chatbot prose and code fences", () => {
    const text = 'Sure! Here it is:\n```json\n{"title":"X","parts":[{"name":"A","steps":["sc"]}]}\n```\nUse {} if empty.';
    expect(extractJSON(text).title).toBe("X");
  });
  it("throws when there's no JSON", () => {
    expect(() => extractJSON("no json here {}")).toThrow();
  });
});

describe("aiPrompt", () => {
  it("includes the link and size, and an example that the app itself accepts", () => {
    const p = aiPrompt({ link: "https://example.com/p", size: "M" });
    expect(p).toContain("https://example.com/p");
    expect(p).toContain("I'm making this size: M");
    const { pattern, warnings } = normalizePattern(extractJSON(p));
    expect(pattern.parts.length).toBeGreaterThan(2);
    expect(warnings).toEqual([]);
  });
  it("asks the chatbot to check the size when none is given", () => {
    expect(aiPrompt({})).toMatch(/ask me which size/);
  });
});
