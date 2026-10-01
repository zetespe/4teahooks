# Anatomy of a Crochet Pattern: Research for the Pattern-Tracker Schema

Purpose: list the structural variations real crochet patterns use, so that an AI can turn any web pattern into one JSON schema and a user can track progress against it (rows and rounds, repeats, parts, sizes, finishing steps, stitch help).

> **Method note.** The research environment allowed web search but blocked full-page fetches. Quoted examples therefore come from search-result excerpts of the cited pages. Where an example is a typical construction and not a quote from one page, it is marked *(representative)*. The sources are listed at the end.

---

## 1. Standard pattern sections

Commercial patterns (Yarnspirations/Caron, Lion Brand, DROPS) and blog patterns (Sarah Maker, The Woobles, Hobbii, amigurumi blogs) use almost the same front matter, though the order varies:

| Section | Typical content | Notes for schema |
|---|---|---|
| Title / designer / source URL | | Copyright: store a link and the source. |
| Skill level | Craft Yarn Council (CYC) 4-level scale. It was Beginner / Easy / Intermediate / Experienced before 2019 and is now **Basic / Easy / Intermediate / Complex** ([Joy of Motion](https://joyofmotioncrochet.com/how-to-read-a-crochet-pattern-part-1/)) | Enum plus free text. |
| Finished size / measurements | "Finished sizes S (M, L, XL, 2X), bust 40″–58½″" (Tulipa Sweater, via [Oombawka](https://oombawkadesigncrochet.com/free-chunky-crochet-sweater-patterns/)); a toy is "approx. 12 cm tall" | Per size; units in or cm. |
| Materials: yarn | Brand, fibre, weight, colour names, **amount per size**, colour letters (A, B, C, or MC/CC) | CYC weight 0–7: 0 Lace, 1 Super Fine, 2 Fine, 3 Light, 4 Medium, 5 Bulky, 6 Super Bulky, 7 Jumbo ([CYC via search](https://www.craftyarncouncil.com/standards/yarn-label-information)). |
| Hook(s) | "6.5 mm"; often two hooks (a smaller one for ribbing) | List; metric and US letter/number. |
| Notions | Safety eyes (e.g. 8 mm), fiberfill stuffing, stitch markers, tapestry needle, buttons, zipper, embroidery floss, pellets, wire, felt | List with quantity and size. |
| Gauge | "14 sc and 17 rows = 4″" (Caron Meshy Cardigan, [Yarnspirations](https://www.yarnspirations.com/products/caron-meshy-crochet-cardigan)); measured over a 4 in / 10 cm square | Stitches + rows + stitch pattern + hook; often "not critical" for toys. |
| Abbreviations | Pattern-specific list, often marked "US terms" | Per-pattern glossary. |
| Special stitches | Definitions of e.g. "inc = 2 sc in 1 st", "dec = invisible decrease", cluster, puff, shell | Per-pattern glossary with steps. |
| Notes | "Ch 1 does not count as a st", "worked in continuous rounds, do not join", "the pattern is written in US terms" | Free text, sometimes with rules that change how lines are read. |
| Instructions | Grouped by part (Head, Body…), panel (Back, Front, Sleeve), or phase (Body, Border) | Core of the schema. |
| Assembly / Finishing | Sewing, seaming, borders, blocking, weaving in ends, fringe | Steps that are not stitch lines. |
| Charts / diagrams / photos | Symbol charts, colour graphs, schematics with measurements, layout diagrams | Images with descriptions. |

The Woobles' free chick pattern shows the smallest version of this front matter: it says it is "written in US terminology, and crocheted in the round," defines `inc` and `dec (invisible decrease)`, and explains that "[sc, inc] x 3 means 1 sc followed by 1 inc, repeated 3 times" and that "(6 sts)" is the round total ([The Woobles](https://thewoobles.com/pages/free-chick-amigurumi-crochet-pattern)).

---

## 2. Terminology

### 2.1 US vs UK: the same names mean different stitches

UK terms are one "height name" higher than US terms ([Jo to the World](https://jototheworld.com/us-to-uk-crochet-terms), [Cilla Crochets](https://www.cillacrochets.com/crochet-resources/uk-vs-us-crochet-terms)):

| US | UK |
|---|---|
| slip stitch (sl st) | slip stitch (ss) |
| single crochet (sc) | **double crochet (dc)** |
| half double crochet (hdc) | half treble (htr) |
| double crochet (dc) | **treble (tr)** |
| treble (tr) | double treble (dtr) |
| double treble (dtr) | triple treble (ttr) |
| skip | miss |
| yarn over (yo) | yarn over hook / yarn round hook (yoh, yrh) |
| gauge | tension |

How to detect which system a pattern uses: "sc" only exists in US patterns and "htr" only in UK patterns ([Easy Crochet](https://easycrochet.com/uk-to-us-crochet-terms/)). **Schema consequence:** each pattern must carry a `terminology: "US" | "UK"` value. Stitch codes are better normalised to a canonical internal ID (for example `sc_us`) than stored as bare "dc", because "dc" is ambiguous. A pattern with no "sc" and no "htr" (for example only ch/dc/tr) is genuinely ambiguous. The AI should record that as `unknown` and flag it.

### 2.2 Common abbreviations (CYC master list plus common usage)

The Craft Yarn Council keeps the standard list and states that designers "may also use special abbreviations in a pattern that might not be found on this standard list" ([CYC Crochet Abbreviations](https://www.craftyarncouncil.com/standards/crochet-abbreviations)). The most common abbreviations:

| Abbr. | Meaning | Abbr. | Meaning |
|---|---|---|---|
| alt | alternate | lp(s) | loop(s) |
| approx | approximately | MC / CC | main colour / contrasting colour |
| beg | begin/beginning | MR / magic ring / magic loop | adjustable ring |
| bet / btwn | between | pm | place marker |
| BL / BLO | back loop (only) | pc | popcorn |
| FL / FLO | front loop (only) | prev | previous |
| BP / BPdc | back post (double crochet) | rem | remain(ing) |
| FP / FPdc | front post (double crochet) | rep | repeat |
| bo / bob | bobble | rnd(s) | round(s) |
| CL | cluster | RS / WS | right side / wrong side |
| ch | chain | sc | single crochet |
| ch- | refers to a chain or space previously made, e.g. ch-2 sp | sc2tog | sc 2 sts together (decrease) |
| ch-sp | chain space | dc2tog / hdc2tog | 2-st decreases |
| cont | continue | sh | shell |
| dc | double crochet (US) | sk | skip |
| dec | decrease | sl st | slip stitch |
| dtr | double treble | sp(s) | space(s) |
| foll | following | st(s) | stitch(es) |
| hdc | half double crochet | tbl | through back loop |
| inc | increase (usually 2 sts in 1 st) | tch / t-ch | turning chain |
| tog | together | tr | treble (US) |
| yo | yarn over | FO | fasten off |
| inv dec | invisible decrease | WS/RS | wrong/right side |
| tss / tks / tps | Tunisian simple / knit / purl stitch | blo sl st | back-loop slip stitch (ribbing) |

Sources: [CYC](https://www.craftyarncouncil.com/standards/crochet-abbreviations), [The Crochet Crowd](https://thecrochetcrowd.com/crochet-abbreviations-guide/), [Ribblr ball pattern abbreviations FO/MR/dec/inc/sc2tog](https://ribblr.com/pattern/amigurumi-ball-free-pattern-Crochet/).

**Key point:** `inc` and `dec` are *not* fixed stitches. In amigurumi `dec` is usually an invisible sc decrease, while in a garment it may mean `dc2tog`. Every abbreviation should therefore resolve through the pattern's own glossary first and fall back to a global glossary second.

---

## 3. Instruction syntax

### 3.1 Line units: rows, rounds and passes
- **Rows** are worked flat and turned at the end. A row starts with a turning chain: "Row 2 (WS): Turn, ch 1 (do not count as a st), 1 hdc into each st across" ([Sewrella cardigan, via search](https://www.sewrella.com/crochet-everyday-cotton-cardigan-free-pattern/)). A line may carry a **RS/WS** label.
- **Joined rounds** close each round with a slip stitch and start the next with a chain: "ch 3 (counts as dc) … join with sl st in top of beg ch-3" ([granny square examples](https://easycrochet.com/crochet-granny-square/)). The pattern also says whether the beginning chain **counts as a stitch**, which affects stitch counts.
- **Continuous spiral rounds** are the amigurumi default: "Do not join rounds with a slip stitch unless specified. Use a stitch marker to mark the first stitch of each round and move it up as you work" ([Joanna's Crochet](https://www.joannascrochet.com/2025/10/spiral-vs-joined-rounds-explained-which.html), [Supergurumi](https://www.supergurumi.com/how-to-crochet-in-rows-spiralrounds-and-joined-rounds)).
- **Rounds worked then turned** (joined and turned) also occur, mostly in hats and sweaters.
- **Tunisian rows** have two passes: "For each row of Tunisian Crochet, there is a Forward Pass and a Return Pass" ([Clover](https://blog.clover-usa.com/2021/04/13/how-to-do-the-tunisian-simple-stitch/)).
- **C2C rows** are diagonal and counted in blocks: "Row 2 (WS): Ch4, hdc in third ch from hook … [2 c2c blocks]" ([Make & Do Crew](https://makeanddocrew.com/how-to-corner-to-corner-crochet-c2c-for-beginners/)).

### 3.2 Starts
- **Foundation chain:** "Ch 84 (92, 100, 108)" ([Yarnspirations](https://www.yarnspirations.com/blogs/how-to/how-to-read-a-crochet-pattern)). Often "plus 1/2/3 for turning". Some patterns use a *foundation single crochet* (fsc) instead.
- **Magic ring:** "Rnd 1: 6 sc in magic ring [6]" (baby unicorn, [Amigurumi Today](https://amigurumi.today/crochet-baby-unicorn-amigurumi-pattern/)); "Round 1: 6 sc in magic loop (6 sts)" ([The Woobles](https://thewoobles.com/pages/free-chick-amigurumi-crochet-pattern)).
- **Chain ring:** "ch 4, join with sl st to form a ring".
- **Starting around a foundation chain** (oval amigurumi bodies, bag bottoms): work along one side of the chain, then along the other.
- **Joining yarn to existing work:** "Join next color in any ch-2 sp of Rnd 1" ([granny pattern, via search](https://easycrochet.com/crochet-granny-square/)).

### 3.3 Stitch counts
Counts appear at the end of a line in different brackets: `(6 sts)`, `[6]`, `(12)`, `— 36 sts`, `[2 c2c blocks]`, or counts of *repeats* such as `(12 shells)` or `(4 corners)`. They are optional and often missing on lines that repeat.

### 3.4 Repeats inside a line
- **Asterisk repeat to end:** "* ch 1, (3 dc, ch 2, 3 dc) in next ch-2 sp (corner made); rep from * 2 more times, ch 1; join with sl st in top of beg ch-3" ([granny Rnd 2](https://easycrochet.com/crochet-granny-square/)). Variants include `rep from * across`, `rep from * to last 3 sts, sc in last 3 sts`, `*…**` double-asterisk ranges, and "ending last rep at **".
- **Bracket/parenthesis groups with a count:** `[sc, inc] x 3`, `(inc) repeat 6 times`, `(2 dc in next st, 2 ch, miss next st) repeat around`.
- **Nested repeats:** "When combined together in the same row, the brackets are the larger repeat and the parenthesis indicate a repeat within the bracket repeat" ([Sigoni Macaroni](https://www.sigonimacaroni.com/how-to-read-crochet-patterns-for-beginners-part-2/)).
- **Ambiguous parentheses:** the same `( )` can mean (a) a repeat group, (b) "all in the same stitch", as in `(3 dc, ch 2, 3 dc) in next ch-2 sp`, (c) a stitch count, (d) per-size values, or (e) an explanatory aside such as `ch 3 (counts as dc)`. The AI must work out which one is meant. The schema should store the result of that interpretation, not the brackets.

### 3.5 Repeats across lines and ranges
- **Range of identical lines:** "Rnds 12–18: sc around (36)" *(representative)*. This is 7 tickable rounds sharing one instruction.
- **Repeat a block of lines N times:** "Rep Rows 2 and 3 for a total of 89 rows" ([Daisy Cottage Designs](https://daisycottagedesigns.net/double-crochet-blanket-pattern/)); "rep Rnds 5–8 three more times" *(representative)*.
- **Repeat until a measurement:** "Rep Rows 2 and 3 until desired height" ([Bella Coco](https://blog.bellacococrochet.com/block-stitch/)); "work even until piece measures 14 (15, 16)″ from beg, ending with a WS row". "Work even" means continuing the established stitch without increasing or decreasing ([Lion Brand / search summary](https://www.lionbrand.com/community/blog/tips-tricks-for-reversing-shaping/)). **The total number of lines is unknown in advance.**
- **Shaping intervals:** "dec 1 st at each end every 4th row 6 (5, 4) times" *(representative)*. This puts a pattern of shaping rows on top of plain rows.
- **"Continue in pattern" / "as established":** refers back to a stitch pattern defined earlier, so the instruction text has no stitches of its own.

### 3.6 Multi-size patterns
"Ch 84 (92, 100, 108)" gives one value per size in order, smallest first ([Yarnspirations](https://www.yarnspirations.com/blogs/how-to/how-to-read-a-crochet-pattern)). Some patterns group sizes in two sets of parentheses, e.g. "XS (S, M, L, XL) (2XL, 3XL, 4XL, 5XL)" ([Hanjan Crochet](https://www.hanjancrochet.com/oversized-sweater-crochet-pattern/)). Edge cases:
- a value of `0` or `–` means "skip this for your size" (e.g. "rep 0 (0, 2, 4) times");
- **conditional blocks**: "For sizes L and XL only: …", "All sizes: …";
- a single value means it applies to all sizes;
- **size-dependent stitch counts and repeat counts**, and occasionally different row numbers per size.
Readers are advised to "highlight or circle every instance of your specific size's number", which is exactly what the app should do automatically.

### 3.7 Colour changes
"Change to color B in last yarn over of previous st". The technique is to work the stitch up to its final yarn over and finish it in the new colour ([Interweave](https://www.interweave.com/article/crochet/crochet-colorwork-how-to-change-yarn-color/)). Stripe sequences ("2 rows A, 1 row B, rep"), carried yarn and colour-per-stitch rows (tapestry/C2C: "Row 10: 3A, 2B, 5A" — [Sarah Maker C2C](https://sarahmaker.com/c2c-crochet/)) all appear.

### 3.8 Pieces, quantities and mirroring
- "Arms (make 2)", "Ears (make 4: 2 in A, 2 in B)", "Make 20 squares".
- Mirrored pieces: "It is common practice in cardigan patterns to write out shaping for only one front and then indicate … to 'reverse shaping' for the second front" ([Sage Yarn](https://sageyarn.wordpress.com/2014/01/21/decoding-the-left-and-right-fronts/)). This can only be stored as a text note, or as a second part generated by the AI.
- "Work as for Back until …" means one part reuses a prefix of another part's steps.

### 3.9 In-line actions that are not stitches
- "Insert safety eyes between Rounds 8 & 9, with 5 stitches between them" ([The Woobles](https://thewoobles.com/pages/free-chick-amigurumi-crochet-pattern)).
- "Start stuffing", "stuff firmly and continue", "place marker", "pm in 10th st", "do not fasten off", "do not turn" ([Bella Coco](https://blog.bellacococrochet.com/block-stitch/)), "fasten off, leaving a long tail for sewing".
- Joining two pieces mid-pattern (e.g. legs joined into one body in amigurumi; join-as-you-go on the final round of a motif).

---

## 4. Pattern types and their structure

### 4.1 Amigurumi (toys, balls)
- **Many parts**, each worked in spiral rounds from a magic ring: Head, Body, Arms (make 2), Legs (make 2), Ears, Tail, Snout.
- Rounds are short with counts on every line: `Rnd 2: (inc) repeat 6 times [12]`, `[sc, inc] x 6 (18)`.
- Mid-part actions include inserting safety eyes, stuffing ("start stuffing", "stuff as you go") and closing the hole ("sc2tog around … close the hole, fasten off"; [Ribblr ball](https://ribblr.com/pattern/amigurumi-ball-free-pattern-Crochet/)).
- **Assembly section:** "sew each arm to round 17 of 19 of the body" (Bunny Kylie, [blogkb](https://amigurumi.blogkb.com/crochet-bunny-kylie-free-amigurumi-pattern/)); "sew the arms to the body in round 21" ([Always Free Amigurumi](https://blog.alwaysfreeamigurumi.com/crochet-piglet-amigurumi-free-pattern/)); "embroider mouth if desired" ([All About Ami](https://www.allaboutami.com/pattern-amigurumi-turtle/)). These positions refer to round numbers of *another part*.
- Some are "no-sew" designs where parts are crocheted directly onto each other ([Once Upon a Cheerio](https://www.onceuponacheerio.com/2025/02/no-sew-amigurumi-chick.html)).

### 4.2 Garments
- **Panels**: Back, Front (or Left/Right Front), Sleeves (make 2), then Neckband, Ribbing, Collar, Button band.
- **Multi-size** numbers throughout, gauge that matters, and a schematic (diagram with measurements).
- Mostly worked in rows, with shaping (armhole, neck, sleeve cap) and many "work even until X cm" lines.
- Ribbing may be worked sideways and then attached, or worked onto the garment: "The ribbed sweater is crocheted in 4 panels – front, back and 2 sleeves and then the body and neckline ribbing are crocheted separately and sewn onto the sweater" ([search summary](https://vivcrochets.com/ribbed-sweater/)).
- "Picking up" stitches along an edge ("join yarn at underarm, work 60 (64, 68) sc evenly along edge").
- Top-down raglans and yokes are worked in one piece with **branching**: divide for sleeves, work the body, then return to work each sleeve around the armhole.
- **Finishing:** block pieces, seam the shoulders, set in the sleeves, seam the sides (slip stitch, whip stitch or mattress stitch), add borders, add buttons.

### 4.3 Blankets
- A long **row repeat** ("Rep Rows 2–3 until desired height" or for a set count), stripes, then a **border** worked in rounds around all four sides with corner increases.
- Or **motif-based** (see 4.4). Finishing includes weaving in ends (often *before* the border), blocking, and fringe or tassels ("cut yarn into 12 inch strands, folding them in half…" — [Jewels and Jones](https://jewelsandjones.com/how-to-add-tassels-to-a-crochet-blanket/)).

### 4.4 Granny squares and motifs
- The motif is worked in joined rounds, often changing colour every round, with corners as `(3 dc, ch 2, 3 dc)` groups.
- "Make N" with **colour variants** (e.g. 8 in colourway 1, 12 in colourway 2).
- **Layout:** a grid (e.g. 5 × 7) or a layout diagram assigning colourways to positions ([TL Yarn Crafts](https://tlycblog.com/crochet-granny-square-blanket-with-mini-skeins/)).
- **Joining**: sewn or crocheted together afterwards, or **join-as-you-go**, where "on the final round of your square edging, you join the square onto the blanket, complete your round, cut the yarn" ([You Should Craft](https://www.youshouldcraft.com/join-as-you-go-granny-squares/)). In join-as-you-go the last round of motif *k* differs from the last round of motif 1, depending on how many neighbours it has.
- The "endless" or continuous granny square has no fixed round count.

### 4.5 C2C and tapestry / colourwork
- C2C: blocks rather than stitches; increase phase, then decrease phase (sometimes decreasing on one side only for rectangles). Graphs are "read from the bottom right corner up to the top left corner" ([Make & Do Crew](https://makeanddocrew.com/how-to-corner-to-corner-crochet-c2c-for-beginners/)). Written row lists such as "Row 10: 3A, 2B, 5A" can run to 100+ rows.
- Tapestry: "each square is equal to one stitch… changing colors when they change in the box" ([Interweave](https://www.interweave.com/article/crochet/crochet-colorwork-how-to-change-yarn-color/)). Mosaic crochet uses charts plus dropped-down stitches.
- **Tracking need:** the chart *is* the instructions, so a row is a sequence of colour runs, and the user may want to tick runs within a row.

### 4.6 Filet crochet
A grid of open mesh and solid blocks: "Each empty square on the chart represents an open mesh space. Each filled square represents a filled block". The chart is read "from the bottom up — Row 1 right-to-left, Row 2 left-to-right" ([Treasurie](https://blog.treasurie.com/filet-crochet-pattern-and-chart-tutorial/), [CrochetPop](https://learn.crochetpop.app/learn/filet-crochet)). Each row can be derived as a run-length list (e.g. `3 open, 2 solid, 3 open`).

### 4.7 Tunisian crochet
Each row has a Forward Pass (loops picked up, right to left) and a Return Pass (`ch 1, *yo, pull through 2 loops*`, left to right) ([Clover](https://blog.clover-usa.com/2021/04/13/how-to-do-the-tunisian-simple-stitch/)). The return pass is usually "standard" and often not written out. Its own stitches (tss, tks, tps) need their own glossary entries.

### 4.8 Symbol charts and diagrams
- CYC standard symbols (oval = ch, X/+ = sc, T = hdc, T with crossbars = dc and taller). Round charts are read "counterclockwise" by right-handers and begin in the centre ([TL Yarn Crafts](https://tlycblog.com/how-to-read-crochet-charts/)).
- DROPS patterns refer to named diagrams: "A.1 is the name of the diagram… everything inside the square brackets is 1 repeat… If it says to work 5 repeats of A.1 in the round, then you work A.1 a total of 5 times… 2 repeats of A.1 vertically… work the entire diagram once, then begin again" ([DROPS lesson](https://www.garnstudio.com/lesson.php?id=69&page=3&cid=17)). Written text then reads like "work A.1 over all sts (= 12 repeats)". **Charts can repeat horizontally and vertically, and different charts can sit side by side in one row (A.1, A.2, A.3).**
- Some patterns are chart-only, with no text at all (common for Japanese and lace patterns).

### 4.9 Video-led patterns
The Woobles kits use "detailed videos divided into bite-sized steps" ([Woobles kit listing](https://thewoobles.com/collections/beginner-crochet-amigurumi-kits)). Many blogs embed YouTube videos with a timestamp per round. The schema needs per-step `media` links, including timestamps.

---

## 5. Steps that are not stitches

| Kind | Example phrasing | Data needed |
|---|---|---|
| Fasten off | "Fasten off, leaving a long tail for sewing" | tail length |
| Stuff | "Start stuffing", "stuff firmly" | firmness, partial/complete |
| Insert safety eyes | "between Rnds 8 & 9, 5 sts apart" | size, position (round, spacing) |
| Sew / attach part | "Sew arms to round 17 of the body" | which parts, location ref, method |
| Seam | slip stitch, whip stitch, mattress stitch ([Lucy Kate](https://lucykatecrochet.com/getting-started-with-crochet-ribbing)) | edges, method |
| Join motifs | sew, sl st, join-as-you-go | layout ref |
| Embroider | mouth, nose, eyebrows, cheeks | thread colour |
| Attach buttons / zipper / snaps | "sew buttons opposite buttonholes" | count, positions |
| Pick up / join yarn | "join B at right underarm" | location |
| Block | wet, steam or spray; to the schematic measurements | target dims |
| Weave in ends | | none |
| Fringe / tassels / pompom | "cut 12″ strands, fold, pull through" | count, length, spacing |
| Felting, starching, inserting wire or pellets | | free text |

---

## 6. Edge cases that break a naive "list of rows" model

1. **Unknown line count:** "repeat until piece measures 30 cm" or "until desired length". There is no fixed number of rows to tick.
2. **Ranges:** "Rnds 12–18" is 7 tickable units sharing one text.
3. **Block repeats:** "Rep Rows 2–3 for a total of 89 rows" or "rep Rnds 5–8 three more times" means iterating a *group* of lines, so the tracker must know the iteration number and the line within the group.
4. **Nested and in-line repeats**, plus "ending last rep at **" (a partial final iteration).
5. **Per-size values** for stitch counts, repeat counts, chain lengths and measurements, including `0` (skip) and size-only blocks.
6. **Multiple parts with quantities** ("make 2", "make 20 squares"). Progress belongs to *each copy* of a part.
7. **Colour variants of the same part** (8 squares in colourway 1, 12 in colourway 2).
8. **Mirrored parts** ("reverse shaping"), often not written out.
9. **"Work as for Back until…"**: a part that reuses a prefix of another part.
10. **Branching / non-linear construction** (top-down yoke dividing into body and sleeves; amigurumi legs joined into one body).
11. **References across parts:** assembly positions such as "round 17 of the body".
12. **Interleaved actions** such as eyes or stuffing between round 8 and round 9.
13. **Two-pass rows** (Tunisian), **block rows** (C2C) and **chart rows** (filet, tapestry), where a row is not a list of stitches.
14. **Charts as the only source**, with horizontal and vertical repeats and multiple charts in one row.
15. **Ambiguous terms:** US/UK dc, `inc`/`dec` meaning different stitches per pattern, and whether the beginning chain counts as a stitch.
16. **Join-as-you-go**, where the final round of each motif depends on its position in the layout.
17. **Shaping intervals** ("dec every 4th row 6 times") laid over a stitch pattern.
18. **Optional / variant sections** ("optional border", "for a longer version…").
19. **Gauge-dependent or measurement-based starts** ("chain a multiple of 6 + 2 to desired width").
20. **Video-only steps** whose content lives in a timestamp, not in text.

---

## 7. Implications for the schema

### 7.1 Principles
- **Store meaning, not typography.** The AI turns `*…; rep from *`, `[…] x6`, `(…) repeat 6 times` and nested repeats into one tree of `Repeat` nodes, and keeps the original text alongside for display.
- **Separate structure from tickable units.** A `Step` may expand to many tickable units (a range, a block repeat, a `make 2` copy). Progress is stored against the *expanded* positions.
- **Sizes are a projection.** Any number may be a `SizedValue`; the user picks a size and the app resolves every value.
- **Always have a fallback.** Any step may be `kind: "text"` with the raw instruction, and any chart may be an image plus a description. The converter should never be forced to invent structure.

### 7.2 Proposed data model (TypeScript-like)

```ts
// ---------- Top level ----------
interface Pattern {
  schemaVersion: string;
  id: string;
  title: string;
  designer?: string;
  source: { url?: string; retrievedAt?: string; license?: string; notes?: string };
  terminology: "US" | "UK" | "unknown";       // drives stitch resolution
  craft: "crochet" | "tunisian";
  category: "amigurumi" | "garment" | "blanket" | "motif" | "bag" | "accessory" | "homeware" | "other";
  skillLevel?: "basic" | "easy" | "intermediate" | "complex";
  sizes?: SizeDef[];                          // absent => single size
  finishedMeasurements?: Measurement[];       // per size via SizedValue
  materials: Materials;
  gauge?: Gauge;
  glossary: StitchDef[];                      // abbreviations + special stitches used in this pattern
  notes?: Note[];                             // e.g. "ch-1 does not count as st", "work in spiral"
  charts?: Chart[];
  layouts?: Layout[];                         // motif placement grids
  parts: Part[];                              // ordered sections: Head, Body, Back, Square A, Border…
  assembly?: Section;                         // non-stitch steps referencing parts
  finishing?: Section;
  media?: Media[];
}

interface SizeDef { id: string; label: string; order: number }   // "S", "M", "2XL", "6-12 mo"

/** A value that may vary by size. A plain value applies to all sizes. */
type SizedValue<T> = T | { bySize: Record<string /*SizeDef.id*/, T | null> }; // null = "–" / not applicable

interface Measurement { name: string; value: SizedValue<number>; unit: "cm" | "in" }

// ---------- Materials ----------
interface Materials {
  yarns: Yarn[];
  hooks: { size_mm: number; usLabel?: string; purpose?: string }[];   // "for ribbing"
  notions: Notion[];
}
interface Yarn {
  id: string;               // referenced by colour changes: "A", "MC", "CC1"
  label: string;            // "Color A – Cream"
  brand?: string; name?: string; fiber?: string; colorName?: string;
  weight?: 0|1|2|3|4|5|6|7; // CYC
  amount?: SizedValue<{ qty: number; unit: "skein" | "g" | "m" | "yd" }>;
  heldStrands?: number;
}
interface Notion {
  kind: "safety_eyes" | "stuffing" | "stitch_marker" | "tapestry_needle" | "button" | "zipper"
      | "embroidery_thread" | "pellets" | "wire" | "felt" | "other";
  label: string; quantity?: SizedValue<number>; size?: string;
}
interface Gauge {
  stitches?: number; rows?: number; over: { value: number; unit: "cm" | "in" };
  stitchPattern?: string; hook_mm?: number; critical: boolean; text: string;
}

// ---------- Stitches ----------
interface StitchDef {
  code: string;                 // as written in pattern: "dc", "inc", "puff", "A.1"?
  canonicalId?: string;         // normalised: "us:dc", "uk:tr" -> same id "dc_us"
  name: string;                 // "double crochet"
  kind: "basic" | "special" | "technique";   // technique = magic ring, inv dec, fsc
  definition?: string;          // pattern's own definition, verbatim
  steps?: string[];             // how-to for the user
  consumes?: number;            // sts used from previous row (dec = 2)
  produces?: number;            // sts made (inc = 2)
  videoUrl?: string; imageUrl?: string;
  chartSymbol?: string;
}

// ---------- Structure ----------
interface Part {
  id: string;
  name: string;                 // "Arm", "Sleeve", "Granny Square A"
  quantity: SizedValue<number>; // "make 2"
  copies?: CopyVariant[];       // when copies differ: colours, left/right
  construction: "rows" | "joined_rounds" | "spiral_rounds" | "turned_rounds" | "tunisian_rows"
              | "c2c" | "chart" | "mixed";
  basedOn?: { partId: string; upToStepId?: string; mirrored?: boolean; note?: string }; // "work as for Back until…", "reverse shaping"
  appliesToSizes?: string[];
  optional?: boolean;
  sections?: Section[];         // optional sub-headings: "Shape armhole", "Neck"
  steps: Step[];
}
interface CopyVariant { label: string; count: number; yarnMap?: Record<string, string>; mirrored?: boolean }

interface Section { id: string; title?: string; steps: Step[] }

/** One instruction line or block, as written. */
type Step =
  | LineStep            // a row/round or range of identical rows/rounds
  | RepeatBlock         // repeat a group of steps
  | ActionStep          // non-stitch: stuff, sew, eyes, block…
  | ChartStep           // work rows of a chart
  | TextStep;           // fallback

interface StepBase {
  id: string;
  rawText: string;                       // verbatim from source (for display & audit)
  appliesToSizes?: string[];             // "For sizes L and XL only"
  optional?: boolean;
  note?: string;
  media?: Media[];                       // video timestamp, photo
}

interface LineStep extends StepBase {
  type: "line";
  unit: "row" | "round" | "pass_pair" | "block_row";
  label?: string;                        // "Rnd", "Row", "R"
  number?: SizedValue<{ from: number; to: number }>;  // Rnds 12–18 => 7 tickable units
  side?: "RS" | "WS";
  start?: "magic_ring" | "chain" | "chain_ring" | "join_yarn" | "fsc" | "continue";
  turningChain?: { count: number; countsAsStitch: boolean };
  join?: "sl_st_to_first" | "none";
  turn?: boolean;
  body: Instruction[];                   // parsed stitch content
  tunisian?: { forward: Instruction[]; return?: Instruction[] | "standard" };
  colorRuns?: { yarnId: string; count: number; unit: "st" | "block" | "mesh" }[]; // C2C / tapestry / filet
  endCount?: SizedValue<StitchCount>;    // "(18 sts)", "[2 blocks]"
  until?: Condition;                     // "work even until piece measures 30 cm"
  colorChange?: { toYarnId: string; when: "start" | "last_yo_of_prev" | "end" };
}

interface RepeatBlock extends StepBase {
  type: "repeat";
  steps: Step[];                         // e.g. Rows 2–3
  times?: SizedValue<number>;            // total iterations (normalise "3 more times" => 4 total incl. first)
  until?: Condition;                     // "until desired height"
  numberingContinues: boolean;           // rows keep counting (Rows 4,5,6…) vs reuse labels
}

interface ActionStep extends StepBase {
  type: "action";
  action: "fasten_off" | "stuff" | "insert_safety_eyes" | "place_marker" | "sew" | "seam"
        | "join_motifs" | "embroider" | "attach_notion" | "pick_up_stitches" | "join_yarn"
        | "block" | "weave_in_ends" | "fringe" | "tassel" | "pompom" | "felt" | "other";
  params?: {
    parts?: string[];                    // Part ids involved
    location?: PartRef;                  // "between rnd 8 and 9", "to round 17 of Body"
    method?: "whip_stitch" | "mattress_stitch" | "sl_st" | "sc" | "join_as_you_go" | "sewn";
    tailLength?: string;
    quantity?: number; spacing?: string; yarnId?: string;
  };
}
interface PartRef { partId?: string; afterStepId?: string; row?: number; betweenRows?: [number, number]; description?: string }

interface ChartStep extends StepBase {
  type: "chart";
  chartId: string;
  rows?: { from: number; to: number };
  horizontalRepeats?: SizedValue<number>;   // "A.1 × 12 around"
  verticalRepeats?: SizedValue<number> | Condition;
  sequence?: { chartId: string; repeats?: number }[]; // A.1, A.2 ×3, A.3 in same row
}

interface TextStep extends StepBase { type: "text"; tickable: boolean }

// ---------- Inline instruction tree ----------
type Instruction =
  | { kind: "stitch"; code: string; count?: number; into?: Placement; color?: string }
  | { kind: "group"; items: Instruction[]; into: Placement }          // "(3 dc, ch 2, 3 dc) in next ch-2 sp"
  | { kind: "repeat"; items: Instruction[];
      times?: SizedValue<number> | "to_end" | { toLast: number };      // "rep from * to last 3 sts"
      partialLast?: Instruction[] }                                    // "ending last rep at **"
  | { kind: "skip"; count: number }
  | { kind: "chain_space"; size: number }
  | { kind: "note"; text: string };
type Placement = "next_st" | "same_st" | "each_st" | "ch_sp" | "ring" | "blo" | "flo" | "front_post" | "back_post" | string;

interface StitchCount { stitches?: number; perUnit?: { unit: string; count: number }[]; text?: string }

type Condition =
  | { kind: "measure"; value: SizedValue<number>; unit: "cm" | "in"; from?: string; endingWith?: "RS" | "WS" }
  | { kind: "desired"; text: string }    // "until desired length"
  | { kind: "stitch_count"; value: SizedValue<number> };

// ---------- Charts, layouts, media ----------
interface Chart {
  id: string;                         // "A.1", "Graph 1"
  kind: "symbol" | "colorwork" | "filet" | "c2c" | "schematic" | "layout";
  imageUrl?: string;                  // always allowed
  description: string;                // fallback text the AI writes
  readingDirection?: "bottom_right_up_alternating" | "counterclockwise_from_center" | string;
  grid?: { width: number; height: number; cells: string[][] }; // optional machine-readable grid (yarnId or symbol code)
  repeatBox?: { cols?: [number, number]; rows?: [number, number] };
  legend?: Record<string, string>;    // symbol -> StitchDef.code / yarnId
}
interface Layout { id: string; rows: number; cols: number; cells: (string | null)[][]; joinMethod?: string; imageUrl?: string }
interface Media { kind: "video" | "image" | "link"; url: string; startSec?: number; caption?: string }
interface Note { text: string; scope?: "pattern" | string /* partId */ }
```

Key modelling decisions:
- **Ranges** (`number: {from, to}`) and **repeat blocks** are expanded at runtime into tickable units. Row numbers in `rawText` are kept for display.
- **"Rep N more times"** is normalised to total iterations; the raw text is kept.
- **Open-ended repeats** (`until`) produce a "counter" UI: the user taps "+1 row" and can record measurements, and the block ends when the user marks it done.
- **Mirroring** and **work-as-for** use `basedOn`. If the AI writes out the mirrored part fully, `basedOn` is only informational.
- **Size filtering**: steps with `appliesToSizes` that exclude the chosen size are hidden, and `SizedValue` with `null` hides that element.
- **The glossary per pattern** resolves codes first. A global stitch library supplies explanations and videos when `canonicalId` matches.

### 7.3 Progress-tracking state

```ts
interface Project {
  id: string;
  patternId: string;
  patternVersion: string;              // pattern may be re-converted; keep cursor stable by step ids
  selectedSize?: string;
  yarnSubstitutions?: Record<string, string>;
  parts: PartProgress[];
  checklist: Record<string /*stepId*/, boolean>;   // materials & assembly/finishing actions
  notes: { at?: Cursor; text: string; createdAt: string }[];
  startedAt: string; updatedAt: string;
}

interface PartProgress {
  partId: string;
  copyIndex: number;                   // which of the "make 2" / "make 20" copies (0-based)
  variantLabel?: string;               // "Left", "Colourway 2"
  status: "not_started" | "in_progress" | "done";
  cursor: Cursor;
  completed: string[];                 // serialised cursors (or a bitmap over expanded units)
  openEndedCounts?: Record<string /*stepId*/, { rows: number; measured?: number }>;
}

/** Location within the expanded step tree. */
interface Cursor {
  path: { stepId: string; iteration?: number; lineNumber?: number }[];
  // e.g. [{stepId:"rep_rows_2_3", iteration: 37}, {stepId:"row_3"}]
  // range: [{stepId:"rnds_12_18", lineNumber: 15}]
  inlineRepeat?: { repeatIndex: number; of?: number };  // optional "[sc, inc] 4 of 6"
  chartCell?: { row: number; col?: number; runIndex?: number }; // C2C / tapestry granularity
  stitchCounter?: number;              // optional manual counter within a row
}
```

The tracking state needs:
1. **Which part and which copy.** Progress for "Arm 1 of 2" is separate from "Arm 2 of 2". Motifs may be tracked as counters ("13 of 20 squares done") and not as full cursors, when every copy is identical.
2. **Which step**, including the **line within a range** (Rnd 15 of 12–18).
3. **Which repeat iteration** for block repeats, nested to any depth (iteration 37 of "Rows 2–3", currently on Row 3). The app should show the absolute row number (here Row 2 + 2×36 + 1 = Row 75) and "37/44".
4. **Optional finer position**: the in-line repeat count, the stitch counter, or the colour run within a C2C/tapestry row.
5. **Open-ended counters and measurements** for `until` conditions.
6. **The chosen size**, which is fixed per project and resolves every `SizedValue`.
7. **Checklists for actions** (eyes inserted, stuffed, sewn, blocked, ends woven in) that may depend on parts being finished; for example, an assembly step that references Arm copies 0 and 1.
8. **Stability across re-conversion**: cursors reference stable `stepId`s so a corrected AI conversion does not lose progress.

---

## Sources
- Craft Yarn Council – Crochet Abbreviations Master List: https://www.craftyarncouncil.com/standards/crochet-abbreviations
- Craft Yarn Council – Yarn Label Information / weights: https://www.craftyarncouncil.com/standards/yarn-label-information
- CYC Standards & Guidelines PDF: https://media.craftyarncouncil.com/sites/default/files/images/standards/CYC_YarnStandards-2018-11-06.pdf
- Joy of Motion Crochet – skill levels: https://joyofmotioncrochet.com/how-to-read-a-crochet-pattern-part-1/
- The Crochet Crowd – abbreviations: https://thecrochetcrowd.com/crochet-abbreviations-guide/
- Jo to the World – US/UK terms: https://jototheworld.com/us-to-uk-crochet-terms
- Easy Crochet – UK to US terms: https://easycrochet.com/uk-to-us-crochet-terms/
- Cilla Crochets – UK vs US: https://www.cillacrochets.com/crochet-resources/uk-vs-us-crochet-terms
- The Woobles – Free Chick pattern: https://thewoobles.com/pages/free-chick-amigurumi-crochet-pattern
- The Woobles – kits: https://thewoobles.com/collections/beginner-crochet-amigurumi-kits
- Amigurumi Today – Baby unicorn: https://amigurumi.today/crochet-baby-unicorn-amigurumi-pattern/
- Ribblr – Amigurumi ball: https://ribblr.com/pattern/amigurumi-ball-free-pattern-Crochet/
- Bunny Kylie: https://amigurumi.blogkb.com/crochet-bunny-kylie-free-amigurumi-pattern/
- Piglet: https://blog.alwaysfreeamigurumi.com/crochet-piglet-amigurumi-free-pattern/
- All About Ami – Turtle: https://www.allaboutami.com/pattern-amigurumi-turtle/
- Once Upon a Cheerio – No-sew chick: https://www.onceuponacheerio.com/2025/02/no-sew-amigurumi-chick.html
- Joanna's Crochet – spiral vs joined: https://www.joannascrochet.com/2025/10/spiral-vs-joined-rounds-explained-which.html
- Supergurumi – rows/spiral/joined: https://www.supergurumi.com/how-to-crochet-in-rows-spiralrounds-and-joined-rounds
- Sigoni Macaroni – reading patterns pt 2: https://www.sigonimacaroni.com/how-to-read-crochet-patterns-for-beginners-part-2/
- Yarnspirations – How to read a crochet pattern: https://www.yarnspirations.com/blogs/how-to/how-to-read-a-crochet-pattern
- Yarnspirations – Caron Meshy Cardigan: https://www.yarnspirations.com/products/caron-meshy-crochet-cardigan
- Easy Crochet – granny square: https://easycrochet.com/crochet-granny-square/
- Oombawka – chunky sweaters (Tulipa sizes): https://oombawkadesigncrochet.com/free-chunky-crochet-sweater-patterns/
- Hanjan Crochet – oversized sweater sizes: https://www.hanjancrochet.com/oversized-sweater-crochet-pattern/
- Sewrella – Everyday Cotton Cardigan: https://www.sewrella.com/crochet-everyday-cotton-cardigan-free-pattern/
- Sage Yarn – Left and right fronts: https://sageyarn.wordpress.com/2014/01/21/decoding-the-left-and-right-fronts/
- Lion Brand – reversing shaping: https://www.lionbrand.com/community/blog/tips-tricks-for-reversing-shaping/
- Viv Crochets – ribbed sweater: https://vivcrochets.com/ribbed-sweater/
- Lucy Kate Crochet – ribbing: https://lucykatecrochet.com/getting-started-with-crochet-ribbing
- Daisy Cottage Designs – dc blanket: https://daisycottagedesigns.net/double-crochet-blanket-pattern/
- Bella Coco – block stitch: https://blog.bellacococrochet.com/block-stitch/
- Jewels and Jones – tassels: https://jewelsandjones.com/how-to-add-tassels-to-a-crochet-blanket/
- You Should Craft – JAYG: https://www.youshouldcraft.com/join-as-you-go-granny-squares/
- TL Yarn Crafts – granny blanket: https://tlycblog.com/crochet-granny-square-blanket-with-mini-skeins/
- TL Yarn Crafts – reading charts: https://tlycblog.com/how-to-read-crochet-charts/
- Make & Do Crew – C2C: https://makeanddocrew.com/how-to-corner-to-corner-crochet-c2c-for-beginners/
- Sarah Maker – C2C: https://sarahmaker.com/c2c-crochet/
- Interweave – colour changes: https://www.interweave.com/article/crochet/crochet-colorwork-how-to-change-yarn-color/
- Treasurie – filet crochet: https://blog.treasurie.com/filet-crochet-pattern-and-chart-tutorial/
- CrochetPop – filet: https://learn.crochetpop.app/learn/filet-crochet
- Clover – Tunisian simple stitch: https://blog.clover-usa.com/2021/04/13/how-to-do-the-tunisian-simple-stitch/
- DROPS – How to read crochet diagrams: https://www.garnstudio.com/lesson.php?id=69&page=3&cid=17
