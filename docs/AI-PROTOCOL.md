# 4tea Hooks ↔ chatbot protocol

4tea Hooks never calls an AI. The user copies a prompt from **New project**
(source: `src/prompt.js`), pastes it with a pattern link or text into any
chatbot (Claude, ChatGPT, Gemini…), and pastes the answer back. Prose and code
fences around the answer are ignored; the first JSON object is read and
checked by `normalizePattern` in `src/pattern.js`, which accepts common
aliases and reports what it had to skip.

## Pattern object

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
  "materials": { "yarns": [{ "id": "A", "label": "Brown DK cotton, 50 g" }], "hook": "3 mm", "notions": ["Safety eyes 8 mm ×2"] },
  "gauge": { "text": "17 dc and 9 rows = 10 x 10 cm", "stitches": 17, "rows": 9, "over": 10, "unit": "cm", "stitch": "dc", "hook": "4 mm", "critical": true },
  "notes": ["Worked in continuous spiral rounds."],
  "stitches": [{ "code": "inv dec", "name": "invisible decrease", "how": ["step 1", "step 2"] }],
  "parts": [ { "id": "head", "name": "Head", "make": 1, "type": "piece", "yarn": "A", "steps": [ … ] } ]
}
```

- `terminology`: `US` or `UK`, as the pattern uses them. Stitch help reads
  abbreviations accordingly (UK `dc` = US `sc`).
- `size`: the size being made. The chatbot resolves "S (M, L)" numbers for
  that size; another size means converting again.
- `stitches`: the pattern's special stitches and its own definitions. Standard
  stitches come from the app's library (`src/stitches.js`).
- `gauge`: `text` is the pattern's own wording. `stitches`, `rows`, `over` and
  `unit` (`cm` or `in`) are filled only when the pattern states them as counts
  over a square; then the project shows the **Gauge swatch** card, which
  compares the user's swatch with them and suggests a bigger or smaller hook.
  `critical: false` when the pattern says gauge doesn't matter. A plain string
  is still accepted (text only, no swatch check).
- `parts[].make`: how many to make; progress is tracked per copy.
- `parts[].type`: `piece` (default), `assembly` or `finishing`.

## Steps

| kind | Fields | Ticks |
|---|---|---|
| `row` / `round` | `number`, or `from` + `to` for a range; `text`, `original`, `count`, `stitches` | one per row/round |
| `repeat` | `label`, `times` (total), or `until` for open-ended; `steps` | one per row per repetition; open-ended = a row counter and one "done" tick |
| `action` | `action` (`fasten_off`, `stuff`, `safety_eyes`, `sew`, `join`, `button`, `embroider`, `block`, `weave_in`, `change_colour`, `place_marker`, `other`), `text` | one |
| `note` | `text` | none |

Every step has a short unique `id`. Progress is stored by id, so converting
the same pattern again keeps ticks on rows whose ids didn't change.

## Backup file

`{ "type": "4tea-hooks-backup", "version": 1, "exportedAt": "…", "projects": [ … ] }`,
where each project holds its `pattern`, `progress`, `journal`, `swatches`
(`{ id, at, hook, stitches, rows }`, newest first) and `status`.
Restoring merges by project id or replaces everything.
