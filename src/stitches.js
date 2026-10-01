// Built-in stitch and technique library, written for this app.
//
// US and UK patterns use the same names for different stitches (US "sc" is
// UK "dc"), so each entry lists its abbreviations per terminology. Lookups
// take the pattern's terminology into account; "unknown" is read as US.
//
// Fields: id, name (US), uk (UK name if different), us/ukAbbr (abbreviations
// as written in patterns), aliases (other spellings, both systems), group,
// how (steps), tip.

export const STITCHES = [
  // ---- basics ----
  { id: "ch", name: "chain", us: ["ch"], ukAbbr: ["ch"], group: "Basics",
    how: ["Yarn over (wrap the yarn over the hook from back to front).", "Pull the yarn through the loop on the hook. That's one chain."],
    tip: "When counting chains, don't count the loop on the hook or the slip knot." },
  { id: "slst", name: "slip stitch", us: ["sl st", "slst", "sl"], ukAbbr: ["ss", "sl st", "slst"], group: "Basics",
    how: ["Insert the hook into the stitch.", "Yarn over and pull through the stitch and the loop on the hook in one go."],
    tip: "Used to join rounds and to move along without adding height." },
  { id: "sc", name: "single crochet", uk: "double crochet", us: ["sc"], ukAbbr: ["dc"], group: "Basics",
    how: ["Insert the hook into the stitch.", "Yarn over and pull up a loop (2 loops on hook).", "Yarn over and pull through both loops."],
    tip: "The shortest standard stitch. Amigurumi is mostly made of these." },
  { id: "hdc", name: "half double crochet", uk: "half treble", us: ["hdc"], ukAbbr: ["htr"], group: "Basics",
    how: ["Yarn over, then insert the hook into the stitch.", "Yarn over and pull up a loop (3 loops on hook).", "Yarn over and pull through all 3 loops."] },
  { id: "dc", name: "double crochet", uk: "treble", us: ["dc"], ukAbbr: ["tr"], group: "Basics",
    how: ["Yarn over, then insert the hook into the stitch.", "Yarn over and pull up a loop (3 loops on hook).", "Yarn over, pull through 2 loops (2 left).", "Yarn over, pull through the last 2 loops."] },
  { id: "tr", name: "treble crochet", uk: "double treble", us: ["tr", "trc"], ukAbbr: ["dtr"], group: "Basics",
    how: ["Yarn over twice, then insert the hook into the stitch.", "Yarn over and pull up a loop (4 loops on hook).", "[Yarn over, pull through 2 loops] 3 times."] },
  { id: "dtr", name: "double treble crochet", uk: "triple treble", us: ["dtr"], ukAbbr: ["trtr", "ttr"], group: "Basics",
    how: ["Yarn over 3 times, then insert the hook into the stitch.", "Yarn over and pull up a loop (5 loops on hook).", "[Yarn over, pull through 2 loops] 4 times."] },

  // ---- increases and decreases ----
  { id: "inc", name: "increase", us: ["inc"], ukAbbr: ["inc"], group: "Shaping",
    how: ["Work 2 stitches into the same stitch.", "In amigurumi this means 2 single crochet (UK: 2 double crochet) in one stitch, unless the pattern says otherwise."],
    tip: "Check the pattern's own definition: some use inc with taller stitches." },
  { id: "dec", name: "decrease", us: ["dec"], ukAbbr: ["dec"], group: "Shaping",
    how: ["Work 2 stitches together so they become 1.", "In amigurumi this is usually sc2tog (UK: dc2tog) or an invisible decrease. Check the pattern's definition."] },
  { id: "invdec", name: "invisible decrease", us: ["inv dec", "invdec", "invisible dec"], ukAbbr: ["inv dec", "invdec"], group: "Shaping",
    how: ["Insert the hook into the front loop only of the next stitch, then the front loop only of the stitch after it (3 loops on hook).", "Yarn over and pull through the 2 front loops (2 loops on hook).", "Yarn over and pull through both loops."],
    tip: "Gives a neater, almost invisible decrease in amigurumi." },
  { id: "sc2tog", name: "single crochet 2 together", uk: "double crochet 2 together", us: ["sc2tog"], ukAbbr: ["dc2tog"], group: "Shaping",
    how: ["Insert the hook into the next stitch, yarn over, pull up a loop (2 loops on hook).", "Insert the hook into the following stitch, yarn over, pull up a loop (3 loops on hook).", "Yarn over and pull through all 3 loops."] },
  { id: "hdc2tog", name: "half double crochet 2 together", uk: "half treble 2 together", us: ["hdc2tog"], ukAbbr: ["htr2tog"], group: "Shaping",
    how: ["Yarn over, insert into the next stitch, yarn over, pull up a loop (3 loops on hook).", "Yarn over, insert into the following stitch, yarn over, pull up a loop (5 loops on hook).", "Yarn over and pull through all 5 loops."] },
  { id: "dc2tog", name: "double crochet 2 together", uk: "treble 2 together", us: ["dc2tog"], ukAbbr: ["tr2tog"], group: "Shaping",
    how: ["Yarn over, insert into the next stitch, pull up a loop, yarn over, pull through 2 loops (2 on hook).", "Yarn over, insert into the following stitch, pull up a loop, yarn over, pull through 2 loops (3 on hook).", "Yarn over and pull through all 3 loops."] },
  { id: "dc3tog", name: "double crochet 3 together", uk: "treble 3 together", us: ["dc3tog"], ukAbbr: ["tr3tog"], group: "Shaping",
    how: ["Like dc2tog, but over 3 stitches: work each of the 3 stitches until 1 step before the end (4 loops on hook).", "Yarn over and pull through all 4 loops."] },

  // ---- where to insert the hook ----
  { id: "blo", name: "back loop only", us: ["blo", "bl"], ukAbbr: ["blo", "bl"], group: "Where to work",
    how: ["Each stitch has two loops on top. Insert the hook under the back loop only (the one further from you).", "Work the stitch as usual."],
    tip: "Leaves a ridge on the front, often used for edges and soles." },
  { id: "flo", name: "front loop only", us: ["flo", "fl"], ukAbbr: ["flo", "fl"], group: "Where to work",
    how: ["Insert the hook under the front loop only (the one closer to you).", "Work the stitch as usual."] },
  { id: "fpdc", name: "front post double crochet", uk: "front post treble", us: ["fpdc"], ukAbbr: ["fptr", "rtrf"], group: "Where to work",
    how: ["Yarn over. Insert the hook from front to back to front around the post (the body) of the stitch, not into its top.", "Yarn over, pull up a loop, then finish like a double crochet (UK treble)."],
    tip: "Raises the stitch to the front: used for ribbing and cables." },
  { id: "bpdc", name: "back post double crochet", uk: "back post treble", us: ["bpdc"], ukAbbr: ["bptr", "rtrb"], group: "Where to work",
    how: ["Yarn over. Insert the hook from back to front to back around the post of the stitch.", "Yarn over, pull up a loop, then finish like a double crochet (UK treble)."] },
  { id: "chsp", name: "chain space", us: ["ch-sp", "ch sp", "sp"], ukAbbr: ["ch-sp", "ch sp", "sp"], group: "Where to work",
    how: ["The gap under one or more chains of the previous row.", "Insert the hook into the gap (not into the chains themselves) and work the stitch."] },
  { id: "sk", name: "skip", uk: "miss", us: ["sk", "skip"], ukAbbr: ["miss", "sk"], group: "Where to work",
    how: ["Don't work into the next stitch; go on to the one after it."] },
  { id: "tch", name: "turning chain", us: ["tch", "t-ch"], ukAbbr: ["tch", "t-ch"], group: "Where to work",
    how: ["Chains made at the start of a row to reach the height of the stitches: usually 1 for sc, 2 for hdc, 3 for dc (US terms).", "The pattern says whether the turning chain counts as a stitch."] },

  // ---- starts and foundations ----
  { id: "mr", name: "magic ring", us: ["mr", "magic ring", "magic loop", "magic circle", "adjustable ring"], ukAbbr: ["mr", "magic ring", "magic loop", "magic circle"], group: "Starting",
    how: ["Wrap the yarn around two fingers to make a loop, tail in front.", "Insert the hook under the loop, catch the working yarn and pull up a loop.", "Chain 1 to secure (doesn't count as a stitch).", "Work the first round's stitches into the ring, over both strands.", "Pull the tail to close the ring tight."],
    tip: "Closes without a hole in the middle, which is why amigurumi starts with it." },
  { id: "fsc", name: "foundation single crochet", uk: "foundation double crochet", us: ["fsc"], ukAbbr: ["fdc"], group: "Starting",
    how: ["Chain 2. Insert into the 2nd chain from hook, yarn over, pull up a loop (2 on hook).", "Yarn over, pull through 1 loop (this makes the 'chain').", "Yarn over, pull through both loops (this makes the stitch).", "Next: insert into the 'chain' of the stitch you just made and repeat."],
    tip: "Makes the chain and the first row at once; stretchier than a chain." },
  { id: "slipknot", name: "slip knot", us: ["slip knot"], ukAbbr: ["slip knot"], group: "Starting",
    how: ["Make a loop with the tail behind the working yarn.", "Pull a loop of the working yarn through it and put it on the hook.", "Tighten by pulling the tail."] },

  // ---- textured and decorative stitches ----
  { id: "shell", name: "shell", us: ["shell", "sh"], ukAbbr: ["shell", "sh"], group: "Textures",
    how: ["Several tall stitches (often 5 dc, UK tr) worked into the same stitch or space so they fan out.", "The pattern defines the exact number."] },
  { id: "vst", name: "V-stitch", us: ["v-st", "v st", "vst"], ukAbbr: ["v-st", "v st", "vst"], group: "Textures",
    how: ["Work (dc, ch 1, dc) into the same stitch (UK: tr, ch 1, tr), unless the pattern defines it differently."] },
  { id: "puff", name: "puff stitch", us: ["puff", "puff st"], ukAbbr: ["puff", "puff st"], group: "Textures",
    how: ["[Yarn over, insert into the stitch, yarn over, pull up a loop to the height of the row] 3 to 5 times, as the pattern says.", "Yarn over and pull through all loops on the hook.", "Often closed with a chain 1."] },
  { id: "bobble", name: "bobble", us: ["bobble", "bo", "bob"], ukAbbr: ["bobble", "bo", "bob"], group: "Textures",
    how: ["Work 5 double crochet (UK treble) into the same stitch, each stopped before its last step, keeping the last loop of each on the hook.", "Yarn over and pull through all loops (6 on hook)."],
    tip: "Usually worked on wrong-side rows so the bobble pops out on the right side." },
  { id: "popcorn", name: "popcorn", us: ["pc", "popcorn"], ukAbbr: ["pc", "popcorn"], group: "Textures",
    how: ["Work 5 double crochet (UK treble) into the same stitch.", "Take the hook out of the loop, insert it into the top of the first of the 5 stitches, put the dropped loop back on the hook.", "Pull the loop through to fold the group into a popcorn."] },
  { id: "cluster", name: "cluster", us: ["cl", "cluster"], ukAbbr: ["cl", "cluster"], group: "Textures",
    how: ["Several partly worked stitches joined at the top into one. The pattern says how many and where.", "Work each stitch until 2 loops of it remain, then yarn over and pull through all loops."] },
  { id: "picot", name: "picot", us: ["picot", "p"], ukAbbr: ["picot", "p"], group: "Textures",
    how: ["Chain 3 (or as the pattern says).", "Slip stitch into the first of those chains (or into the stitch at the base) to make a little bump."] },
  { id: "revsc", name: "reverse single crochet (crab stitch)", uk: "reverse double crochet (crab stitch)", us: ["rev sc", "reverse sc", "crab st"], ukAbbr: ["rev dc", "crab st"], group: "Textures",
    how: ["Work single crochet (UK double crochet) from left to right instead of right to left (opposite if you are left-handed).", "Gives a twisted, corded edge."] },
  { id: "esc", name: "extended single crochet", uk: "extended double crochet", us: ["esc", "exsc"], ukAbbr: ["edc", "exdc"], group: "Textures",
    how: ["Insert, yarn over, pull up a loop (2 on hook).", "Yarn over, pull through 1 loop.", "Yarn over, pull through 2 loops."] },
  { id: "waistcoat", name: "waistcoat stitch (knit stitch)", us: ["waistcoat st", "ksc", "knit st"], ukAbbr: ["waistcoat st", "knit st"], group: "Textures",
    how: ["Insert the hook between the two 'legs' of the V of the stitch below, not under the top loops.", "Work a single crochet (UK double crochet)."],
    tip: "Looks like knitting; keep it loose, it's tight to work into." },
  { id: "spike", name: "spike stitch", us: ["spike", "spike st", "lsc"], ukAbbr: ["spike", "spike st"], group: "Textures",
    how: ["Insert the hook into a stitch one or more rows below, as the pattern says.", "Pull up a long loop to the current height and finish the stitch."] },
  { id: "moss", name: "moss stitch (linen stitch)", us: ["moss st", "linen st"], ukAbbr: ["moss st", "linen st"], group: "Textures",
    how: ["Alternate (sc, ch 1) across, skipping the stitch under each chain (UK: dc, ch 1).", "On the next row, work the sc into each chain space."] },
  { id: "c2c", name: "corner to corner (C2C) tile", us: ["c2c"], ukAbbr: ["c2c"], group: "Textures",
    how: ["Each tile is ch 3 plus 3 dc (UK tr), worked diagonally.", "New tiles are started into the ch-3 space of the tile beside them. Follow the pattern's chart for colours."] },

  // ---- Tunisian ----
  { id: "tss", name: "Tunisian simple stitch", us: ["tss"], ukAbbr: ["tss"], group: "Tunisian",
    how: ["Forward pass: insert the hook from right to left under the front vertical bar, yarn over, pull up a loop and keep it on the hook. Repeat across.", "Return pass: yarn over, pull through 1 loop, then [yarn over, pull through 2 loops] until 1 loop remains."] },
  { id: "tks", name: "Tunisian knit stitch", us: ["tks"], ukAbbr: ["tks"], group: "Tunisian",
    how: ["Forward pass: insert the hook from front to back between the front and back vertical bars, yarn over, pull up a loop. Repeat across.", "Return pass as usual."] },

  // ---- techniques and finishing ----
  { id: "colour", name: "colour change", us: ["change color", "change colour"], ukAbbr: ["change colour"], group: "Techniques",
    how: ["Work the last stitch in the old colour until the final yarn over.", "Yarn over with the new colour and pull through to finish the stitch.", "Carry on with the new colour; tie or weave the ends later."] },
  { id: "fo", name: "fasten off", uk: "fasten off", us: ["fo", "fasten off"], ukAbbr: ["fo", "fasten off"], group: "Techniques",
    how: ["Cut the yarn, leaving a tail (long if you'll sew with it).", "Yarn over and pull the tail all the way through the loop on the hook. Tighten."] },
  { id: "invjoin", name: "invisible join", us: ["invisible join"], ukAbbr: ["invisible join"], group: "Techniques",
    how: ["Cut the yarn and pull it through the last stitch.", "Thread it on a needle, go under both loops of the 2nd stitch of the round, then back into the top of the last stitch.", "Gives a seamless finish on the last round."] },
  { id: "close", name: "closing a hole (final round)", us: ["close"], ukAbbr: ["close"], group: "Techniques",
    how: ["Fasten off with a tail and thread it onto a needle.", "Go through the front loop of each remaining stitch around.", "Pull tight to close the hole, then hide the tail inside."] },
  { id: "pm", name: "place marker", us: ["pm", "place marker", "sm"], ukAbbr: ["pm", "place marker"], group: "Techniques",
    how: ["Clip a stitch marker into the stitch you just made (in spirals: the first stitch of each round).", "Move it up as you go so you always know where the round starts."] },
  { id: "eyes", name: "safety eyes", us: ["safety eyes"], ukAbbr: ["safety eyes"], group: "Techniques",
    how: ["Push the eye's post through from the outside between the rounds the pattern gives.", "Check both eyes' placement before you lock them, it's permanent.", "From inside, press the washer firmly onto the post (flat side towards the fabric)."],
    tip: "Insert them before stuffing and closing. Not for toys for children under 3: embroider eyes instead." },
  { id: "stuff", name: "stuffing", us: ["stuff"], ukAbbr: ["stuff"], group: "Techniques",
    how: ["Pull the fibre fill apart into small fluffy pieces.", "Stuff a little at a time, filling the edges first.", "Stuff firmly unless the pattern says otherwise; it settles over time."] },
  { id: "whip", name: "whip stitch", us: ["whip st", "whipstitch"], ukAbbr: ["whip st"], group: "Sewing up",
    how: ["Hold the two edges together.", "Bring the needle through both edges from the same side every time, so the yarn wraps over the edge.", "Used for attaching amigurumi parts and seaming flat pieces."] },
  { id: "mattress", name: "mattress stitch", us: ["mattress st"], ukAbbr: ["mattress st"], group: "Sewing up",
    how: ["Lay the pieces side by side, right side up.", "Go under a stitch on one side, then the matching stitch on the other side, zig-zagging.", "Every few stitches pull the yarn so the seam closes invisibly."] },
  { id: "slstseam", name: "slip stitch seam", us: ["sl st seam"], ukAbbr: ["ss seam"], group: "Sewing up",
    how: ["Hold the pieces together and work slip stitches through both layers along the edge.", "Firm and quick; leaves a ridge on the side facing you."] },
  { id: "jayg", name: "join as you go", us: ["jayg", "join as you go"], ukAbbr: ["jayg", "join as you go"], group: "Sewing up",
    how: ["Work the last round of a new motif, and where it meets a finished motif, replace a chain with a slip stitch into the matching space of the finished one.", "No sewing needed afterwards."] },
  { id: "weave", name: "weaving in ends", us: ["weave in ends"], ukAbbr: ["weave in ends"], group: "Finishing",
    how: ["Thread the tail on a needle.", "Weave it through the backs of stitches in one direction, then back the other way for a few stitches.", "Cut close to the fabric."] },
  { id: "block", name: "blocking", us: ["block"], ukAbbr: ["block"], group: "Finishing",
    how: ["Wet or steam the finished piece (check the yarn label).", "Pin it to the finished measurements on a flat surface.", "Let it dry completely before unpinning."] },
];

// Abbreviations that are terms, not stitches. Shown as short explanations.
export const TERMS = {
  st: "stitch", sts: "stitches", rnd: "round", rnds: "rounds", rep: "repeat", yo: "yarn over (UK: yrh, yarn round hook)", yoh: "yarn over hook",
  tog: "together", rs: "right side", ws: "wrong side", beg: "beginning", prev: "previous", rem: "remaining", foll: "following",
  approx: "approximately", alt: "alternate", cont: "continue", lp: "loop", lps: "loops", mc: "main colour (in some patterns: magic circle, see magic ring)", cc: "contrast colour",
  sp: "space", "sp(s)": "space(s)", "*": "repeat the instructions after the asterisk as the pattern says",
};

const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();

// Finds the library entry for an abbreviation as written in a pattern.
// UK patterns: "dc" means US sc, "tr" means US dc and so on.
export function findStitch(code, terminology = "US") {
  const c = norm(code);
  if (!c) return null;
  const uk = terminology === "UK";
  const primary = STITCHES.find((s) => (uk ? s.ukAbbr : s.us).some((a) => norm(a) === c));
  if (primary) return primary;
  // Not a known abbreviation in this system: try the other one, then names.
  // Full names are just as ambiguous ("double crochet"), so they are read in
  // the pattern's terms first too.
  return STITCHES.find((s) => (uk ? s.us : s.ukAbbr).some((a) => norm(a) === c))
    || STITCHES.find((s) => norm(uk ? s.uk || s.name : s.name) === c)
    || STITCHES.find((s) => norm(uk ? s.name : s.uk) === c)
    || null;
}

// True when the abbreviation means different stitches in US and UK patterns
// (e.g. "dc", "tr"), so the app can say which one this pattern means.
export function isAmbiguous(code) {
  const c = norm(code);
  const inUs = STITCHES.find((s) => s.us.some((a) => norm(a) === c));
  const inUk = STITCHES.find((s) => s.ukAbbr.some((a) => norm(a) === c));
  return !!(inUs && inUk && inUs.id !== inUk.id);
}

// Everything the app knows about a code in the context of one pattern:
// the pattern's own definition first, then the library entry.
export function explain(code, pattern) {
  const c = norm(code);
  const own = (pattern?.stitches || []).find((s) => norm(s.code) === c || (s.name && norm(s.name) === c)) || null;
  const lib = findStitch(c, pattern?.terminology) || (own && own.name ? findStitch(own.name, pattern?.terminology) : null);
  const term = TERMS[c] || null;
  return { code: c, own, lib, term, ambiguous: isAmbiguous(c) };
}

export const usName = (s) => s.name;
export const ukName = (s) => s.uk || s.name;
