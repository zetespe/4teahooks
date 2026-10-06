// The prompt the user copies into any chatbot (Claude, ChatGPT, Gemini, …)
// together with the pattern. The chatbot answers with one JSON object that
// the user pastes back. Keep in step with docs/AI-PROTOCOL.md and pattern.js.

const EXAMPLE = {
  type: "4tea-hooks-pattern",
  version: 1,
  title: "Little Bear",
  designer: "Designer name",
  sourceUrl: "https://example.com/little-bear",
  category: "amigurumi",
  size: "One size",
  terminology: "US",
  materials: {
    yarns: [{ id: "A", label: "Brown, DK cotton, about 50 g" }],
    hook: "3 mm",
    notions: ["Safety eyes 8 mm ×2", "Fibre fill", "Stitch marker", "Tapestry needle"],
  },
  gauge: { text: "22 sc and 24 rnds = 10 cm with a 3 mm hook. Not critical, but work tightly so the stuffing doesn't show.", stitches: 22, rows: 24, over: 10, unit: "cm", stitch: "sc", hook: "3 mm", critical: false },
  notes: ["Worked in continuous spiral rounds; don't join."],
  stitches: [
    { code: "inv dec", name: "invisible decrease", how: ["Insert the hook in the front loop of the next 2 stitches", "Yarn over, pull through both front loops", "Yarn over, pull through the 2 loops on the hook"] },
  ],
  parts: [
    {
      id: "head", name: "Head", make: 1, type: "piece", yarn: "A",
      steps: [
        { id: "h1", kind: "round", number: 1, text: "6 sc in a magic ring", count: 6, stitches: ["mr", "sc"], original: "Rnd 1: 6 sc in MR (6)" },
        { id: "h2", kind: "round", number: 2, text: "inc in each st around", count: 12, stitches: ["inc"], original: "Rnd 2: inc x6 (12)" },
        { id: "h3", kind: "round", number: 3, text: "[sc, inc] 6 times", count: 18, stitches: ["sc", "inc"], original: "Rnd 3: (sc, inc) x6 (18)" },
        { id: "h5", kind: "round", from: 4, to: 8, text: "sc in each st around", count: 18, stitches: ["sc"], original: "Rnds 4-8: sc around (18)" },
        { id: "h-eyes", kind: "action", action: "safety_eyes", text: "Insert the safety eyes between Rnds 6 and 7, 5 sts apart." },
        { id: "h9", kind: "round", number: 9, text: "[sc, inv dec] 6 times", count: 12, stitches: ["sc", "inv dec"] },
        { id: "h-stuff", kind: "action", action: "stuff", text: "Stuff the head firmly." },
        { id: "h-fo", kind: "action", action: "fasten_off", text: "Fasten off, leaving a long tail for sewing." },
      ],
    },
    {
      id: "ear", name: "Ear", make: 2, yarn: "A",
      steps: [
        { id: "e1", kind: "round", number: 1, text: "6 sc in a magic ring", count: 6, stitches: ["mr", "sc"] },
      ],
    },
    {
      id: "scarf", name: "Scarf", make: 1,
      steps: [
        { id: "s1", kind: "row", number: 1, text: "ch 31, sc in 2nd ch from hook and in each ch across, turn", count: 30, stitches: ["ch", "sc"] },
        { id: "s2", kind: "repeat", label: "Rows 2–3", times: 10, steps: [
          { id: "s2a", kind: "row", label: "Row 2", text: "ch 1, sc in the back loop of each st across, turn", count: 30, stitches: ["ch", "sc", "blo"] },
          { id: "s2b", kind: "row", label: "Row 3", text: "ch 1, sc in each st across, turn", count: 30, stitches: ["ch", "sc"] },
        ] },
        { id: "s3", kind: "repeat", label: "Fringe rows", until: "the scarf measures 30 cm", steps: [
          { id: "s3a", kind: "row", text: "ch 1, sc in each st across, turn", stitches: ["ch", "sc"] },
        ] },
        { id: "s-chart", kind: "note", text: "The colour chart for the stripe is on the pattern page (Chart A)." },
      ],
    },
    {
      id: "assembly", name: "Assembly", type: "assembly",
      steps: [
        { id: "a1", kind: "action", action: "sew", text: "Sew the ears to the head between Rnds 3 and 5, 8 sts apart, using whip stitch." },
        { id: "a2", kind: "action", action: "weave_in", text: "Weave in all ends." },
      ],
    },
  ],
};

export function aiPrompt({ link = "", size = "" } = {}) {
  const sizeLine = size.trim()
    ? `I'm making this size: ${size.trim()}. Where the pattern gives several sizes, e.g. "Ch 84 (92, 100)", use only the numbers for my size, and leave out instructions that don't apply to it.`
    : `If the pattern comes in several sizes, ask me which size I'm making before you answer. If it has one size, go ahead.`;
  const linkLine = link.trim()
    ? `The pattern is here: ${link.trim()}\nIf you can't open the link, tell me and I'll paste the pattern text.`
    : `I'll paste the pattern below this message (or attach it).`;
  return `Please convert a crochet pattern for my tracking app, 4tea Hooks.

${linkLine}

${sizeLine}

Answer with exactly one JSON object in the format below, nothing else needed. Rules:

1. Keep the designer's instructions; restructure them, don't redesign the pattern. Never invent rows, counts or stitches that aren't in the pattern. If something is unclear, keep the pattern's own words in "text".
2. "terminology": "US" or "UK", as the pattern uses them. Don't convert stitch names between US and UK. Keep the pattern's abbreviations in "text".
3. "parts": every separately made piece in order (Head, Body, Arm, Front, Back, Sleeve, Square A…). "make" is how many to make ("make 2" → 2). Put sewing/joining in a part with "type": "assembly", and blocking, weaving in ends, buttons etc. in a part with "type": "finishing" (or in the assembly part).
4. Steps:
   - "row" or "round": one line of the pattern. Use "number" for a single row/round, or "from" and "to" for a range ("Rnds 12-18" → from 12, to 18). "text" is the instruction written clearly in full (expand "rep from * around" into readable text); "original" is the line exactly as written in the pattern; "count" is the stitch count at the end, if given; "stitches" lists the abbreviations used, in lowercase, as written in the pattern (e.g. ["sc", "inc", "inv dec"]).
   - "repeat": a group of rows worked several times ("Rep Rows 2-3 ten times" → "times": 10, the total number of times, so "3 more times" after working it once means "times": 4). For "repeat until the piece measures 30 cm" leave out "times" and set "until".
   - "action": anything that isn't crocheting a row: fasten_off, stuff, safety_eyes, sew, join, button, embroider, block, weave_in, change_colour, place_marker, other. Put it exactly where the pattern does it (e.g. eyes between two rounds).
   - "note": information or anything that can't be written as rows, such as a chart or diagram: describe it briefly and say it's on the pattern page.
5. "stitches" at the top: the pattern's special stitches and any abbreviation it defines differently from the standard, with "how" as short steps. Standard stitches (ch, sc, dc…) don't need to be listed.
6. Give every part and step a short unique "id" (letters, numbers, dashes).
7. "gauge": "text" is the pattern's gauge exactly as written. Fill "stitches", "rows", "over" and "unit" ("cm" or "in") only with numbers the pattern states, for the size I'm making ("17 dc and 9 rows = 10 x 10 cm" → stitches 17, rows 9, over 10, unit "cm"); don't calculate or guess them. Leave them out when the gauge isn't counted in stitches and rows over a square (e.g. a diameter after Rnd 5, or pattern repeats). "stitch" is the stitch the swatch is worked in, "hook" the hook size. "critical": false if the pattern says gauge isn't important or gives none; otherwise true.
8. Fill "sourceUrl" with the exact address of the pattern page (the full link I gave you, not the website's home page), "size" with the size I'm making (or "One size"), and list materials and important notes.

Format (an example; use the same field names):

${JSON.stringify(EXAMPLE, null, 1)}`;
}
