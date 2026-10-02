import { useState } from "react";
import { STITCHES, TERMS } from "./stitches";
import { StitchSymbol, VideoLink } from "./symbols";

// The built-in library, browsable and searchable in US or UK terms.
export default function Stitches() {
  const [q, setQ] = useState("");
  const [terms, setTerms] = useState("US");
  const [open, setOpen] = useState(null);
  const uk = terms === "UK";
  const needle = q.trim().toLowerCase();
  const match = (s) => !needle || [s.name, s.uk, ...s.us, ...s.ukAbbr].filter(Boolean).some((x) => x.toLowerCase().includes(needle));
  const list = STITCHES.filter(match);
  const groups = [...new Set(list.map((s) => s.group))];
  const terms2 = Object.entries(TERMS).filter(([k, v]) => !needle || k.includes(needle) || v.toLowerCase().includes(needle));

  return (
    <>
      <header className="top">
        <div>
          <h1>Stitches</h1>
          <p className="sub">How each stitch is made, in US or UK terms.</p>
        </div>
      </header>
      <div className="search-row">
        <input type="search" placeholder="Search: sc, magic ring, treble…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search stitches" />
        <div className="seg" role="group" aria-label="Terms">
          {["US", "UK"].map((t) => <button key={t} type="button" className={terms === t ? "on" : ""} aria-pressed={terms === t} onClick={() => setTerms(t)}>{t}</button>)}
        </div>
      </div>
      <p className="hint">US and UK patterns use the same names for different stitches: US single crochet (sc) is UK double crochet (dc). Each project shows which terms its pattern uses.</p>

      {groups.map((g) => (
        <section key={g} className="lib-group">
          <h2>{g}</h2>
          <ul className="lib">
            {list.filter((s) => s.group === g).map((s) => {
              const name = uk ? s.uk || s.name : s.name;
              const abbr = (uk ? s.ukAbbr : s.us)[0];
              const isOpen = open === s.id;
              return (
                <li key={s.id} className={isOpen ? "open" : ""}>
                  <button type="button" className="lib-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                    <span className="abbr">{abbr}</span>
                    <span className="grow">{name}</span>
                    <span aria-hidden="true">{isOpen ? "−" : "+"}</span>
                  </button>
                  {isOpen && (
                    <div className="how">
                      <div className="how-head">
                        {s.uk && s.uk !== s.name ? <p className="meta">US: {s.name} ({s.us[0]}) · UK: {s.uk} ({s.ukAbbr[0]})</p> : <span />}
                        <StitchSymbol id={s.id} label={s.name} />
                      </div>
                      <ol>{s.how.map((h, i) => <li key={i}>{h}</li>)}</ol>
                      {s.tip && <p className="tip">{s.tip}</p>}
                      <VideoLink name={uk ? s.uk || s.name : s.name} uk={uk && !!s.uk && s.uk !== s.name} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {terms2.length > 0 && (
        <section className="lib-group">
          <h2>Pattern words</h2>
          <dl className="terms">
            {terms2.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </section>
      )}
      {!list.length && !terms2.length && <p className="hint">Nothing found. The pattern's own abbreviation list (on the pattern page) has the rest.</p>}
    </>
  );
}
