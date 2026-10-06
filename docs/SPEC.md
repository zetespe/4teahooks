# Crochet pattern tracker — product spec (draft)

Name: **4tea Hooks**. Signature: *brewed by 4tea*.

Background research: [`research/market.md`](research/market.md),
[`research/pattern-anatomy.md`](research/pattern-anatomy.md).

## Principles

- **Private.** No accounts, no server. Everything lives on the device (local storage).
  Backups are a JSON file the user saves wherever they like (Files, Google Drive, AirDrop…)
  through the share sheet or a save dialog — same mechanism as Gymmy.
- **Bring your own AI.** The app never calls an AI. It gives the user a ready prompt;
  the user pastes it with the pattern (link or text) into any chatbot (Claude, ChatGPT,
  Gemini…) and pastes the JSON answer back. Format documented in `AI-PROTOCOL.md`.
- **One size per conversion.** The user tells the chatbot which size they are making;
  the chatbot resolves every "S (M, L)" number for that size. Another size = convert again.
- **No stored images.** Photos, charts and videos stay at the source; the source link is
  always shown at the top of the project.
- **English UI.** PWA on GitHub Pages, installable on the phone, works offline.
- **Anonymous usage counts** via GoatCounter, the same scheme as Gymmy (day/week/month/install,
  no identifiers; can be switched off in Settings, with a request to keep it on).

## What the user does

1. Finds a pattern online → taps **New project** → copies the prompt → pastes prompt + pattern
   link/text (+ the size being made) into a chatbot → pastes the answer back.
2. The app shows the pattern split into **parts** (Head, Body, Arm ×2, Assembly, Finishing…).
3. While crocheting the user **ticks rows/rounds**; the app keeps her place per part and per copy
   ("Arm 2 of 2, Rnd 7").
4. Stopping mid-row: a small **"where I stopped" note** on the current row
   (e.g. "done 4 of 6 repeats, marker is blue").
5. A week later the user opens the project: a **Resume card** shows part, row, the note,
   and when it was last worked on.
6. Any stitch in a row is tappable → **How to do it** toggle with a description, the US/UK
   equivalent and the pattern's own definition for special stitches.

7. Before starting, the user can **make a gauge swatch**: the project shows how to make it
   (size, stitch, hook) and asks what she counted in 10 cm, or 4 in for patterns in inches.
   Whether the pattern measures in centimetres or inches is always shown in words; if the
   pattern doesn't make it clear, she chooses. The app says whether the swatch matches the
   pattern, within a tolerance chosen in Settings (±3, 5 or 10%, default 5), or to try the
   next bigger or smaller hook (or a thicker or thinner yarn) and swatch again. Stitches
   decide; rows alone never change the hook. It never recalculates the pattern or the
   finished size: the aim is a swatch that matches. The last 50 swatches are kept.

## Screens

- **Projects** — list of projects with progress bar, current position, last worked; status
  (in progress / finished / paused).
- **Project** — source link on top; Resume card; Gauge swatch card (when the pattern gives one); parts with progress; rows to tick;
  per-row note; project journal (dated notes); materials, gauge and pattern notes in a
  collapsible "About this pattern".
- **New project** — copy prompt, paste answer, preview, save.
- **Stitches** — the built-in stitch library (US with UK equivalents), searchable.
- **Backup & settings** — save/restore backup file, gauge tolerance, usage-count switch, about.

## Pattern format (what the chatbot returns)

One JSON object. Every line keeps `original` (the pattern's own wording) so the user can
check the conversion.

```json
{
  "type": "4tea-hooks-pattern",
  "version": 1,
  "title": "Little Bear",
  "designer": "…",
  "sourceUrl": "https://…",
  "category": "amigurumi",
  "size": "One size",
  "terminology": "US",
  "materials": {
    "yarns": [{ "id": "A", "label": "Brown, DK cotton, 50 g" }],
    "hook": "3 mm",
    "notions": ["Safety eyes 8 mm ×2", "Fibre fill", "Stitch marker", "Tapestry needle"]
  },
  "gauge": { "text": "17 dc and 9 rows = 10 x 10 cm", "stitches": 17, "rows": 9, "over": 10,
             "unit": "cm", "stitch": "dc", "hook": "4 mm", "critical": true },
  "notes": ["Worked in continuous spiral rounds — don't join."],
  "stitches": [
    { "code": "inv dec", "name": "invisible decrease",
      "how": "Insert hook in front loops of next 2 sts, yarn over, pull through both loops, yarn over, pull through 2." }
  ],
  "parts": [
    {
      "id": "head", "name": "Head", "make": 1, "yarn": "A",
      "steps": [
        { "id": "h1", "kind": "round", "label": "Rnd 1", "text": "6 sc in a magic ring",
          "count": 6, "stitches": ["mr", "sc"], "original": "Rnd 1: 6 sc in MR (6)" },
        { "id": "h2", "kind": "round", "label": "Rnd 2", "text": "inc in each st",
          "count": 12, "stitches": ["inc"], "original": "Rnd 2: inc x6 (12)" },
        { "id": "h5", "kind": "round", "label": "Rnds 5–9", "from": 5, "to": 9,
          "text": "sc in each st", "count": 24, "stitches": ["sc"],
          "original": "Rnds 5-9: sc around (24)" },
        { "id": "h-eyes", "kind": "action", "action": "safety_eyes",
          "text": "Insert safety eyes between Rnds 7 and 8, 6 sts apart." }
      ]
    },
    {
      "id": "scarf", "name": "Scarf", "make": 1,
      "steps": [
        { "id": "s1", "kind": "row", "label": "Row 1", "text": "ch 31, sc in 2nd ch from hook and each ch across, turn",
          "count": 30, "stitches": ["ch", "sc"], "original": "…" },
        { "id": "s2", "kind": "repeat", "label": "Rows 2–3", "times": 10,
          "steps": [
            { "id": "s2a", "kind": "row", "label": "Row 2", "text": "ch 1, sc in blo across, turn", "count": 30, "stitches": ["ch", "sc", "blo"] },
            { "id": "s2b", "kind": "row", "label": "Row 3", "text": "ch 1, sc across, turn", "count": 30, "stitches": ["ch", "sc"] }
          ] }
      ]
    },
    {
      "id": "assembly", "name": "Assembly", "type": "assembly",
      "steps": [
        { "id": "a1", "kind": "action", "action": "sew", "text": "Sew arms to the body between Rnds 17 and 18." }
      ]
    }
  ]
}
```

Step kinds:

| kind | Meaning | Ticks |
|---|---|---|
| `row` / `round` | One line, or a range with `from`/`to` (Rnds 12–18 = 7 ticks) | one per row/round |
| `repeat` | A block of rows repeated `times` times, or open-ended with `until` ("until piece measures 30 cm") — then a +1 counter | one per row per repetition |
| `action` | Not a stitch: `fasten_off`, `stuff`, `safety_eyes`, `sew`, `join`, `button`, `embroider`, `block`, `weave_in`, `other` | one |
| `note` | Information or chart reference ("work Chart A — see source"), not tickable | — |

Parts have `make` (how many copies; progress tracked per copy) and an optional
`type`: `piece` (default), `assembly`, `finishing`.

## Progress (stored on the device, separate from the pattern)

- Per part copy: ticked units, current position, an optional "where I stopped" note.
- Open-ended repeats: a row counter (+ optional measurement).
- Project journal: dated free-text notes.
- Gauge swatches: hook and counts per swatch, and the chosen unit when the pattern is unclear;
  the verdict is worked out when shown.
- Last worked timestamp, status.

## MVP scope

1. Projects list, resume card, several projects at once.
2. Import by copy/paste (prompt + validation + preview).
3. Tick rows/rounds/actions with undo; ranges and repeat blocks; "make N" copies.
4. "Where I stopped" note per row + project journal.
5. Stitch library + tappable stitches with "How to do it"; pattern's own special stitches.
6. Backup to file / restore (merge or replace); paste-a-backup.
7. PWA, offline, GitHub Pages deploy, GoatCounter counts, About page.

Later: manual editing of a converted pattern, row counter for "until" lengths with
measurements, export of a project summary for the chatbot, reminders at a row
("change colour at Rnd 20"), dark mode tuning.
