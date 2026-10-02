// Standard crochet chart symbols, drawn for this app (international chart
// conventions, the same in US and UK patterns). Keyed by stitch id from
// stitches.js; stitches without a common symbol have none.

const BASE = 42;

// A vertical stitch: post from the base up `h`, top bar, `slashes` across
// the post (hdc 0, dc 1, tr 2, dtr 3). `x`/`angle` place it in a fan.
function Post({ h, slashes = 0, x = 24, angle = 0, base = BASE, bar = true, barW = 6, at = 0.5 }) {
  const top = base - h;
  const mid = base - h * at;
  return (
    <g transform={`rotate(${angle} ${x} ${base})`}>
      <line x1={x} y1={base} x2={x} y2={top} />
      {bar && <line x1={x - barW} y1={top} x2={x + barW} y2={top} />}
      {Array.from({ length: slashes }, (_, i) => {
        const y = mid + (i - (slashes - 1) / 2) * 6;
        const w = barW > 4 ? 5 : 3.5;
        return <line key={i} x1={x - w} y1={y + 3} x2={x + w} y2={y - 3} />;
      })}
    </g>
  );
}

const X = ({ x = 24, y = 24, s = 8 }) => (
  <g>
    <line x1={x - s} y1={y - s} x2={x + s} y2={y + s} />
    <line x1={x + s} y1={y - s} x2={x - s} y2={y + s} />
  </g>
);

// Several posts that start apart and close into one stitch at the top
// (decreases), with optional slashes on each.
function Together({ n, slashes = 0, apex = 10 }) {
  const xs = n === 2 ? [14, 34] : [12, 24, 36];
  return (
    <g>
      {xs.map((x, i) => {
        const my = (BASE + apex) / 2, mx = (x + 24) / 2;
        const dx = 24 - x, dy = apex - BASE, len = Math.hypot(dx, dy);
        const ux = dx / len, uy = dy / len;
        return (
          <g key={i}>
            <line x1={x} y1={BASE} x2={24} y2={apex} />
            {Array.from({ length: slashes }, (_, k) => {
              const off = (k - (slashes - 1) / 2) * 6;
              const cx = mx + ux * off, cy = my + uy * off;
              return <line key={k} x1={cx - 5} y1={cy + 3} x2={cx + 5} y2={cy - 3} />;
            })}
          </g>
        );
      })}
      <line x1={18} y1={apex} x2={30} y2={apex} />
    </g>
  );
}

const SYMBOLS = {
  ch: <ellipse cx="24" cy="24" rx="11" ry="5.5" />,
  slst: <ellipse cx="24" cy="24" rx="6" ry="4" fill="currentColor" />,
  sc: <X />,
  hdc: <Post h={26} />,
  dc: <Post h={32} slashes={1} />,
  tr: <Post h={36} slashes={2} />,
  dtr: <Post h={38} slashes={3} base={44} />,
  inc: (
    <g>
      <line x1="24" y1="44" x2="13" y2="20" />
      <line x1="24" y1="44" x2="35" y2="20" />
      <X x={13} y={14} s={5} />
      <X x={35} y={14} s={5} />
    </g>
  ),
  dec: (
    <g>
      <X x={13} y={38} s={5} />
      <X x={35} y={38} s={5} />
      <line x1="13" y1="32" x2="24" y2="8" />
      <line x1="35" y1="32" x2="24" y2="8" />
    </g>
  ),
  hdc2tog: <Together n={2} />,
  dc2tog: <Together n={2} slashes={1} />,
  dc3tog: <Together n={3} slashes={1} />,
  cluster: <Together n={3} slashes={1} />,
  bobble: (
    <g>
      {[-14, -7, 0, 7, 14].map((b) => <path key={b} d={`M24 44 Q${24 + b * 1.4} 26 24 8`} fill="none" />)}
      <line x1="18" y1="8" x2="30" y2="8" />
    </g>
  ),
  puff: (
    <g fill="none">
      <path d="M24 44 Q8 26 24 8 Q40 26 24 44" />
      <path d="M24 44 Q16 26 24 8 Q32 26 24 44" />
    </g>
  ),
  popcorn: (
    <g>
      {[-40, -20, 0, 20, 40].map((a) => <Post key={a} h={26} angle={a} base={44} bar={false} />)}
      <path d="M7 27 Q24 4 41 27" fill="none" />
    </g>
  ),
  shell: <g>{[-38, -19, 0, 19, 38].map((a) => <Post key={a} h={30} slashes={1} angle={a} base={44} barW={3} at={0.62} />)}</g>,
  vst: (
    <g>
      <Post h={30} slashes={1} angle={-26} base={44} barW={4} at={0.6} />
      <Post h={30} slashes={1} angle={26} base={44} barW={4} at={0.6} />
      <ellipse cx="24" cy="14" rx="4.5" ry="2.8" />
    </g>
  ),
  picot: (
    <g>
      <ellipse cx="17" cy="20" rx="4.5" ry="3" transform="rotate(-60 17 20)" />
      <ellipse cx="24" cy="11" rx="4.5" ry="3" />
      <ellipse cx="31" cy="20" rx="4.5" ry="3" transform="rotate(60 31 20)" />
      <ellipse cx="24" cy="32" rx="4" ry="3" fill="currentColor" />
    </g>
  ),
  blo: (
    <g>
      <X y={20} />
      <path d="M14 38 Q24 48 34 38" fill="none" />
    </g>
  ),
  flo: (
    <g>
      <X y={18} />
      <path d="M14 42 Q24 32 34 42" fill="none" />
    </g>
  ),
  fpdc: (
    <g fill="none">
      <Post h={34} slashes={1} base={36} />
      <path d="M24 36 Q24 44 32 42" />
    </g>
  ),
  bpdc: (
    <g fill="none">
      <Post h={34} slashes={1} base={36} />
      <path d="M24 36 Q24 44 16 42" />
    </g>
  ),
  mr: (
    <g fill="none">
      <circle cx="24" cy="22" r="12" />
      <path d="M24 34 Q26 42 34 44" />
    </g>
  ),
  revsc: (
    <g>
      <X y={22} />
      <path d="M36 38 L12 38 M17 33 L12 38 L17 43" fill="none" />
    </g>
  ),
  spike: (
    <g>
      <X y={14} s={7} />
      <line x1="24" y1="21" x2="24" y2="44" />
    </g>
  ),
};
SYMBOLS.sc2tog = SYMBOLS.dec;
SYMBOLS.invdec = SYMBOLS.dec;

export const hasSymbol = (id) => !!SYMBOLS[id];

export function StitchSymbol({ id, label }) {
  const s = SYMBOLS[id];
  if (!s) return null;
  return (
    <figure className="symbol">
      <svg viewBox="0 0 48 48" role="img" aria-label={`Chart symbol for ${label}`}>
        <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">{s}</g>
      </svg>
      <figcaption>Chart symbol</figcaption>
    </figure>
  );
}

// A video search for the stitch: never a dead link, and the user picks the
// tutorial that suits them. UK names get "UK" so results use UK terms.
export function videoUrl(name, uk = false) {
  const q = `how to crochet ${name}${uk ? " UK terms" : ""}`;
  return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);
}

export function VideoLink({ name, uk }) {
  return (
    <a className="video-link" href={videoUrl(name, uk)} target="_blank" rel="noopener noreferrer">
      Watch how it's made ↗
    </a>
  );
}
