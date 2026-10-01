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

describe("robustness (QA findings)", () => {
  it("reads numbers and ranges written as text", () => {
    const { pattern } = normalizePattern({ parts: [{ name: "A", make: "2 (one per side)", steps: [
      { kind: "round", number: "Rnds 12–18", text: "sc" },
      { kind: "round", from: "12-18", text: "sc" },
      { kind: "round", number: "Rnd 5 (12 sts)", text: "sc" },
      { kind: "repeat", times: "3 times", steps: ["sc"] },
    ] }] });
    const [a, b, c, d] = pattern.parts[0].steps;
    expect([a.from, a.to, b.from, b.to, c.number, d.times]).toEqual([12, 18, 12, 18, 5, 3]);
    expect(pattern.parts[0].make).toBe(2);
  });
  it("an action with only a label gets that label as its text", () => {
    const { pattern } = normalizePattern({ parts: [{ name: "A", steps: [{ kind: "action", action: "stuff", name: "Stuff the head" }] }] });
    expect(pattern.parts[0].steps[0].text).toBe("Stuff the head");
  });
  it("keeps an open-ended repeat inside a counted one as a counter per repetition", () => {
    const { pattern, warnings } = normalizePattern({ parts: [{ name: "A", steps: [
      { kind: "repeat", label: "Stripe", times: 2, steps: ["sc row", { kind: "repeat", until: "5 cm", steps: ["dc row"] }] },
    ] }] });
    expect(warnings.filter((w) => !/US or UK/.test(w))).toEqual([]);
    expect(unitsOfPart(pattern.parts[0]).map((u) => u.kind)).toEqual(["line", "counter", "line", "counter"]);
  });
  it("caps huge nested repeats so the app stays fast", () => {
    const { pattern, warnings } = normalizePattern({ parts: [{ name: "Blanket", steps: [
      { kind: "repeat", times: 500, steps: [{ kind: "repeat", times: 500, steps: [{ kind: "row", from: 1, to: 4, text: "sc" }] }] },
    ] }] });
    expect(unitsOfPart(pattern.parts[0]).length).toBeLessThanOrEqual(3000);
    expect(warnings.some((w) => /counter instead/.test(w))).toBe(true);
    expect(normalizePattern(structuredClone(pattern)).pattern).toEqual(pattern);
  });
  it("prefers the pattern over small objects in the chatbot's prose", () => {
    const text = 'Use {"note": "US terms"} as you like. Here: {"title":"Real","parts":[{"name":"A","steps":["sc"]}]}';
    expect(extractJSON(text).title).toBe("Real");
  });
});

describe("chatbot quirks (browser QA)", () => {
  it("'times' written as a condition becomes an open-ended repeat", () => {
    const { pattern } = normalizePattern({ parts: [{ name: "Blanket", steps: [{ kind: "repeat", label: "Stripes", times: "until 120 cm", steps: ["sc row"] }] }] });
    expect(pattern.parts[0].steps[0]).toMatchObject({ until: "120 cm" });
    expect(pattern.parts[0].steps[0].times).toBeUndefined();
  });
  it("warns when a count had to be guessed from text, naming the part", () => {
    const { pattern, warnings } = normalizePattern({ parts: [{ name: "Sleeve", make: "1 pair (2 pieces)", steps: [{ kind: "repeat", label: "Cuff", times: "10 (12, 14)", steps: ["sc row"] }, { kind: "row", number: 7 }] }] });
    expect(pattern.parts[0].steps[0].times).toBe(10);
    expect(warnings.some((w) => /Sleeve, Cuff: “10 \(12, 14\)” was read as 10/.test(w))).toBe(true);
    expect(warnings.some((w) => /Sleeve: how many to make/.test(w))).toBe(true);
    expect(warnings.some((w) => /Sleeve, Row 7: a row without instructions/.test(w))).toBe(true);
  });
  it("tolerates trailing commas and explains broken JSON", () => {
    expect(extractJSON('```json\n{"title":"T","parts":[{"name":"A","steps":["sc",],},],}\n```').title).toBe("T");
    expect(() => extractJSON('{"title":"T","parts":[{"name":"A"')).toThrow(/isn't valid JSON/);
  });
});
