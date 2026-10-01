import { useEffect, useRef, useState } from "react";
import { useStore, patchProject, patch, uid } from "./store";
import { unitsOfStep, stitchesOfStep } from "./pattern";
import { copyState, editCopy, partProgress, projectProgress, resumePoint } from "./progress";
import { explain } from "./stitches";
import { useWakeLock } from "./useWakeLock";
import { Bar, Check, Icon, Sheet, ago, fmtDate, go, toast } from "./ui";

const ACTION_LABEL = {
  fasten_off: "Fasten off", stuff: "Stuff", safety_eyes: "Safety eyes", sew: "Sew", join: "Join", button: "Buttons",
  embroider: "Embroider", block: "Block", weave_in: "Weave in ends", change_colour: "Change colour", place_marker: "Marker", other: "Step",
};

export default function Project({ id }) {
  const S = useStore();
  const p = S.projects.find((x) => x.id === id);
  useWakeLock(!!p && S.settings.keepAwake !== false && p.status !== "finished");
  const r = p ? resumePoint(p) : null;
  const [sel, setSel] = useState(() => (r ? { partId: r.part.id, copy: r.copy } : p ? { partId: p.pattern.parts[0].id, copy: 0 } : null));
  const [menu, setMenu] = useState(false);
  const scrollKey = useRef(r ? r.unit.key : null);

  // Open the project at the row to work next.
  useEffect(() => {
    if (!scrollKey.current) return;
    const el = document.querySelector(`[data-unit="${CSS.escape(scrollKey.current)}"]`);
    scrollKey.current = null;
    if (el) el.scrollIntoView({ block: "center" });
  });

  if (!p) return <p className="hint">Project not found. <a href="#/">Back to projects</a></p>;

  const part = p.pattern.parts.find((x) => x.id === sel?.partId) || p.pattern.parts[0];
  const copy = Math.min(sel?.copy || 0, part.make - 1);
  const cs = copyState(p, part.id, copy);
  const pp = partProgress(part, cs);
  const total = projectProgress(p);

  const toggle = (unit) => {
    const was = !!cs.done[unit.key];
    patchProject(p.id, (d) => editCopy(d, part.id, copy, (c) => {
      if (was) delete c.done[unit.key]; else c.done[unit.key] = new Date().toISOString();
    }));
    if (!was && pp.done + 1 === pp.total) toast(part.make > 1 ? `${part.name} ${copy + 1} of ${part.make} finished!` : `${part.name} finished!`, 3000);
  };
  const setNote = (unit, text) => patchProject(p.id, (d) => editCopy(d, part.id, copy, (c) => {
    if (text) c.notes[unit.key] = text; else delete c.notes[unit.key];
  }));
  const setCounter = (step, n) => patchProject(p.id, (d) => editCopy(d, part.id, copy, (c) => { c.counters[step.id] = Math.max(0, n); }));

  const jump = (target) => {
    setSel({ partId: target.part.id, copy: target.copy });
    scrollKey.current = target.unit.key;
  };

  return (
    <>
      <header className="top">
        <a className="icon-btn" href="#/" aria-label="Back to projects"><Icon name="back" /></a>
        <h1 className="title-clip">{p.pattern.title}</h1>
        <button type="button" className="icon-btn" onClick={() => setMenu(true)} aria-label="Project options"><Icon name="more" /></button>
      </header>

      <SourceBar pattern={p.pattern} />

      <ResumeCard p={p} r={r} total={total} onJump={jump} />

      <PartTabs p={p} part={part} copy={copy} onSelect={(partId, c) => setSel({ partId, copy: c })} />

      <section className="steps" aria-label={`${part.name} steps`}>
        {part.notes && part.notes.map((n, i) => <p key={i} className="step note">{n}</p>)}
        {part.steps.map((step) => (
          <StepView key={step.id} step={step} cs={cs} nextKey={pp.next?.key} pattern={p.pattern}
            onToggle={toggle} onNote={setNote} onCounter={setCounter} />
        ))}
      </section>

      <AboutPattern pattern={p.pattern} />
      <Journal p={p} />

      {menu && <ProjectMenu p={p} onClose={() => setMenu(false)} />}
    </>
  );
}

function SourceBar({ pattern }) {
  let host = "";
  try { host = pattern.sourceUrl ? new URL(pattern.sourceUrl).hostname.replace(/^www\./, "") : ""; } catch (e) { host = ""; }
  return (
    <div className="source">
      {host ? (
        <a href={pattern.sourceUrl} target="_blank" rel="noopener noreferrer"><Icon name="link" /> Pattern page · {host}</a>
      ) : <span className="meta">No link to the original pattern</span>}
      <span className="meta">
        {[pattern.size && pattern.size !== "One size" && `Size ${pattern.size}`, pattern.terminology !== "unknown" && `${pattern.terminology} terms`].filter(Boolean).join(" · ")}
      </span>
    </div>
  );
}

function ResumeCard({ p, r, total, onJump }) {
  if (!r) {
    return (
      <section className="card resume done">
        <h2>All done!</h2>
        <p>Every row and step is ticked.</p>
        {p.status !== "finished" && (
          <button type="button" className="btn primary" onClick={() => patchProject(p.id, (d) => { d.status = "finished"; d.finishedAt = new Date().toISOString(); })}>Mark as finished</button>
        )}
      </section>
    );
  }
  const what = r.unit.kind === "action" ? r.unit.step.text : r.unit.label + (r.unit.rep ? ` (repeat ${r.unit.rep.i} of ${r.unit.rep.of})` : "");
  return (
    <section className="card resume">
      <div className="row-between">
        <span className="eyebrow">Pick up here</span>
        <span className="meta">last worked {ago(p.lastWorkedAt)}</span>
      </div>
      <p className="resume-where"><b>{r.part.name}{r.part.make > 1 ? ` ${r.copy + 1} of ${r.part.make}` : ""}</b> · {what}</p>
      {r.note && <p className="stop-note">“{r.note}”</p>}
      {r.unit.kind === "counter" && <p className="meta">{r.counter} rows worked so far</p>}
      <Bar value={total.done} total={total.total} />
      <div className="row-between">
        <span className="meta">{total.done} of {total.total} steps · {total.pct}%</span>
        <button type="button" className="btn small" onClick={() => onJump(r)}>Go there</button>
      </div>
    </section>
  );
}

function PartTabs({ p, part, copy, onSelect }) {
  return (
    <>
      <div className="part-tabs" role="tablist" aria-label="Parts">
        {p.pattern.parts.map((x) => {
          let d = 0, t = 0;
          for (let c = 0; c < x.make; c++) { const q = partProgress(x, copyState(p, x.id, c)); d += q.done; t += q.total; }
          return (
            <button key={x.id} type="button" role="tab" aria-selected={x.id === part.id} className={"chip" + (x.id === part.id ? " on" : "") + (d === t ? " complete" : "")}
              onClick={() => onSelect(x.id, 0)}>
              {x.name}{x.make > 1 ? ` ×${x.make}` : ""} <small>{d}/{t}</small>
            </button>
          );
        })}
      </div>
      {part.make > 1 && (
        <div className="copy-tabs" role="tablist" aria-label={`Which ${part.name}`}>
          {Array.from({ length: part.make }, (_, c) => {
            const q = partProgress(part, copyState(p, part.id, c));
            return (
              <button key={c} type="button" role="tab" aria-selected={c === copy} className={"chip small" + (c === copy ? " on" : "") + (q.done === q.total ? " complete" : "")} onClick={() => onSelect(part.id, c)}>
                {part.name} {c + 1} <small>{q.done}/{q.total}</small>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

// ---- steps ----

function headingOf(step) {
  if (step.label) return step.label;
  const w = step.kind === "round" ? "Rnd" : "Row";
  if (step.from != null) return `${w}s ${step.from}–${step.to}`;
  if (step.number != null) return `${w} ${step.number}`;
  return step.kind === "round" ? "Round" : "Row";
}

function repeatLineHeading(c, repeat) {
  if (c.kind === "note") return "Note";
  if (c.label || c.number != null || c.from != null) return headingOf(c);
  const lines = repeat.steps.filter((x) => x.kind !== "note");
  return lines.length === 1 ? "Each time" : `${c.kind === "round" ? "Round" : "Row"} ${lines.indexOf(c) + 1} of each repeat`;
}

function StepView({ step, cs, nextKey, pattern, onToggle, onNote, onCounter }) {
  const units = unitsOfStep(step);
  const isNext = units.some((u) => u.key === nextKey);
  const allDone = units.length > 0 && units.every((u) => cs.done[u.key]);

  if (step.kind === "note") return <p className="step note">{step.label ? <b>{step.label}: </b> : null}{step.text}</p>;

  if (step.kind === "action") {
    const u = units[0];
    return (
      <article className={"step action" + (isNext ? " next" : "") + (allDone ? " done" : "")} data-unit={u.key}>
        <div className="step-row">
          <Check done={!!cs.done[u.key]} onClick={() => onToggle(u)} label={ACTION_LABEL[step.action]} big />
          <div className="grow">
            <span className="tag">{ACTION_LABEL[step.action]}</span>
            <p className="step-text">{step.text || step.label}</p>
            {step.note && <p className="meta">{step.note}</p>}
          </div>
        </div>
        <NoteBox unit={u} cs={cs} isNext={u.key === nextKey} onNote={onNote} />
      </article>
    );
  }

  if (step.kind === "repeat") return <RepeatView step={step} units={units} cs={cs} nextKey={nextKey} pattern={pattern} isNext={isNext} allDone={allDone} onToggle={onToggle} onNote={onNote} onCounter={onCounter} />;

  // row / round, single or range
  const single = units.length === 1;
  return (
    <article className={"step" + (isNext ? " next" : "") + (allDone ? " done" : "")} data-unit={single ? units[0].key : undefined}>
      <div className="step-row">
        {single && <Check done={!!cs.done[units[0].key]} onClick={() => onToggle(units[0])} label={headingOf(step)} big />}
        <div className="grow">
          <LineBody step={step} heading={headingOf(step)} pattern={pattern} />
        </div>
      </div>
      {!single && (
        <ul className="units">
          {units.map((u) => (
            <li key={u.key} className={"unit" + (u.key === nextKey ? " next" : "") + (cs.done[u.key] ? " done" : "")} data-unit={u.key}>
              <div className="step-row">
                <Check done={!!cs.done[u.key]} onClick={() => onToggle(u)} label={u.label} />
                <span className="unit-label">{u.label}</span>
              </div>
              <NoteBox unit={u} cs={cs} isNext={u.key === nextKey} onNote={onNote} />
            </li>
          ))}
        </ul>
      )}
      {single && <NoteBox unit={units[0]} cs={cs} isNext={units[0].key === nextKey} onNote={onNote} />}
    </article>
  );
}

function LineBody({ step, heading, pattern }) {
  const [orig, setOrig] = useState(false);
  return (
    <>
      <div className="row-between">
        <h3 className="step-head">{heading}</h3>
        {step.count != null && <span className="count" title="Stitch count at the end">{typeof step.count === "number" ? `${step.count} sts` : step.count}</span>}
      </div>
      <p className="step-text">{step.text}</p>
      {step.note && <p className="meta">{step.note}</p>}
      {orig && step.original && <p className="original">{step.original}</p>}
      <StitchHelp codes={stitchesOfStep(step)} pattern={pattern}
        extra={step.original ? <button type="button" className="link-btn" onClick={() => setOrig(!orig)}>{orig ? "Hide original" : "Original"}</button> : null} />
    </>
  );
}

function RepeatView({ step, units, cs, nextKey, pattern, isNext, allDone, onToggle, onNote, onCounter }) {
  const head = step.label || "Repeat";
  const [showAll, setShowAll] = useState(false);

  if (step.times == null) {
    const u = units[0];
    const n = cs.counters[step.id] || 0;
    return (
      <article className={"step repeat" + (isNext ? " next" : "") + (allDone ? " done" : "")} data-unit={u.key}>
        <h3 className="step-head">{head}</h3>
        <p className="until">Repeat until {step.until}</p>
        {step.text && <p className="step-text">{step.text}</p>}
        <div className="repeat-lines">
          {step.steps.map((c) => <div key={c.id} className="repeat-line"><LineBody step={c} heading={repeatLineHeading(c, step)} pattern={pattern} /></div>)}
        </div>
        <div className="counter">
          <button type="button" className="btn round" onClick={() => onCounter(step, n - 1)} aria-label="One row less">−</button>
          <div className="counter-val"><b>{n}</b><span>rows worked</span></div>
          <button type="button" className="btn round" onClick={() => onCounter(step, n + 1)} aria-label="One more row">+</button>
        </div>
        <div className="step-row">
          <Check done={!!cs.done[u.key]} onClick={() => onToggle(u)} label={`${head} finished`} big />
          <span>Reached it, move on</span>
        </div>
        <NoteBox unit={u} cs={cs} isNext={u.key === nextKey} onNote={onNote} />
      </article>
    );
  }

  // Counted repeat: units are grouped per repetition.
  const per = units.length / step.times;
  const groups = Array.from({ length: step.times }, (_, i) => units.slice(i * per, i * per + per));
  const doneGroups = groups.filter((g) => g.every((u) => cs.done[u.key])).length;
  const firstOpen = groups.findIndex((g) => !g.every((u) => cs.done[u.key]));
  const visible = showAll ? groups.map((g, i) => i) : groups.map((g, i) => i).filter((i) => firstOpen === -1 ? i >= step.times - 1 : i >= firstOpen && i < firstOpen + 2);

  return (
    <article className={"step repeat" + (isNext ? " next" : "") + (allDone ? " done" : "")}>
      <div className="row-between">
        <h3 className="step-head">{head}</h3>
        <span className="count">{doneGroups} of {step.times} repeats</span>
      </div>
      {step.text && <p className="step-text">{step.text}</p>}
      <div className="repeat-lines">
        {step.steps.map((c) => <div key={c.id} className="repeat-line"><LineBody step={c} heading={repeatLineHeading(c, step)} pattern={pattern} /></div>)}
      </div>
      {!showAll && step.times > 2 && <button type="button" className="link-btn" onClick={() => setShowAll(true)}>Show all {step.times} repeats</button>}
      <ol className="reps">
        {visible.map((i) => (
          <li key={i} className={groups[i].every((u) => cs.done[u.key]) ? "done" : ""}>
            <span className="rep-no">Repeat {i + 1}</span>
            <ul className="units">
              {groups[i].map((u) => (
                <li key={u.key} className={"unit" + (u.key === nextKey ? " next" : "") + (cs.done[u.key] ? " done" : "")} data-unit={u.key}>
                  <div className="step-row">
                    <Check done={!!cs.done[u.key]} onClick={() => onToggle(u)} label={`${u.label}, repeat ${i + 1}`} />
                    <span className="unit-label">{u.label}</span>
                  </div>
                  <NoteBox unit={u} cs={cs} isNext={u.key === nextKey} onNote={onNote} />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {showAll && <button type="button" className="link-btn" onClick={() => setShowAll(false)}>Show fewer</button>}
    </article>
  );
}

// "Where I stopped" note. Always offered on the row to work next; elsewhere
// only shown when there is one.
function NoteBox({ unit, cs, isNext, onNote }) {
  const note = cs.notes[unit.key] || "";
  const [open, setOpen] = useState(false);
  if (!isNext && !note) return null;
  if (!note && !open) {
    return <button type="button" className="link-btn note-add" onClick={() => setOpen(true)}><Icon name="note" /> {unit.kind === "line" ? "Stopped mid-row? Add a note" : "Add a note"}</button>;
  }
  return (
    <label className="note-box">
      <span className="sr-only">Where I stopped</span>
      <textarea rows={2} autoFocus={open && !note} placeholder="e.g. 4 of 6 repeats done, blue marker on the last st" value={note}
        onChange={(e) => onNote(unit, e.target.value)} onBlur={() => { if (!note) setOpen(false); }} />
    </label>
  );
}

// Stitch chips; tapping one opens "How to do it" right under the step.
function StitchHelp({ codes, pattern, extra }) {
  const [open, setOpen] = useState(null);
  if (!codes.length && !extra) return null;
  const info = open ? explain(open, pattern) : null;
  return (
    <div className="stitch-help">
      <div className="chips">
        {codes.map((c) => (
          <button key={c} type="button" className={"chip stitch" + (open === c ? " on" : "")} aria-expanded={open === c} onClick={() => setOpen(open === c ? null : c)}>{c}</button>
        ))}
        {codes.length > 0 && !open && <span className="meta how-hint">tap a stitch: how to do it</span>}
        {extra}
      </div>
      {info && <StitchInfo info={info} terminology={pattern.terminology} />}
    </div>
  );
}

export function StitchInfo({ info, terminology }) {
  const { own, lib, term, code } = info;
  const uk = terminology === "UK";
  return (
    <div className="how">
      {own && (
        <div>
          <h4>{own.name || code} <small>this pattern's definition</small></h4>
          {own.how.length > 0 && <ol>{own.how.map((s, i) => <li key={i}>{s}</li>)}</ol>}
        </div>
      )}
      {lib && (
        <div>
          <h4>{uk ? lib.uk || lib.name : lib.name}</h4>
          {(lib.uk && lib.uk !== lib.name) && (
            <p className="meta">US: {lib.name} ({lib.us[0]}) · UK: {lib.uk} ({lib.ukAbbr[0]}){info.ambiguous ? `. Careful: “${code}” means different stitches in US and UK patterns; this pattern uses ${terminology === "unknown" ? "unknown (read as US)" : terminology} terms.` : ""}</p>
          )}
          {!own && <ol>{lib.how.map((s, i) => <li key={i}>{s}</li>)}</ol>}
          {own && lib.how.length > 0 && <details><summary>General how-to</summary><ol>{lib.how.map((s, i) => <li key={i}>{s}</li>)}</ol></details>}
          {lib.tip && <p className="tip">{lib.tip}</p>}
        </div>
      )}
      {!own && !lib && term && <p><b>{code}</b>: {term}</p>}
      {!own && !lib && !term && <p className="meta">No explanation for “{code}” yet. Check the pattern's abbreviation list on the pattern page.</p>}
    </div>
  );
}

// ---- about, journal, menu ----

function AboutPattern({ pattern }) {
  const m = pattern.materials;
  const has = m.yarns.length || m.hook || m.notions.length || pattern.gauge || pattern.notes.length || pattern.stitches.length;
  if (!has) return null;
  return (
    <details className="card about">
      <summary><h2>About this pattern</h2></summary>
      {pattern.designer && <p><b>Designer:</b> {pattern.designer}</p>}
      {m.yarns.length > 0 && <><h3>Yarn</h3><ul>{m.yarns.map((y) => <li key={y.id}><b>{y.id}</b> {y.label}</li>)}</ul></>}
      {m.hook && <p><b>Hook:</b> {m.hook}</p>}
      {m.notions.length > 0 && <><h3>You'll also need</h3><ul>{m.notions.map((n, i) => <li key={i}>{n}</li>)}</ul></>}
      {pattern.gauge && <p><b>Gauge:</b> {pattern.gauge}</p>}
      {pattern.notes.length > 0 && <><h3>Notes</h3><ul>{pattern.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></>}
      {pattern.stitches.length > 0 && (
        <>
          <h3>Special stitches</h3>
          {pattern.stitches.map((s, i) => (
            <div key={i} className="special">
              <b>{s.code}</b>{s.name && s.name !== s.code ? ` – ${s.name}` : ""}
              {s.how.length > 0 && <ol>{s.how.map((h, j) => <li key={j}>{h}</li>)}</ol>}
            </div>
          ))}
        </>
      )}
    </details>
  );
}

function Journal({ p }) {
  const [text, setText] = useState("");
  const add = () => {
    const t = text.trim();
    if (!t) return;
    patchProject(p.id, (d) => { d.journal.unshift({ id: uid(), at: new Date().toISOString(), text: t }); d.updatedAt = new Date().toISOString(); });
    setText("");
  };
  return (
    <section className="card journal">
      <h2>Notes</h2>
      <textarea rows={2} placeholder="Anything to remember: changes you made, yarn left, hook swapped…" value={text} onChange={(e) => setText(e.target.value)} />
      <button type="button" className="btn small" onClick={add} disabled={!text.trim()}>Add note</button>
      <ul>
        {p.journal.map((j) => (
          <li key={j.id}>
            <span className="meta">{fmtDate(j.at)}</span>
            <p>{j.text}</p>
            <button type="button" className="link-btn" onClick={() => patchProject(p.id, (d) => { d.journal = d.journal.filter((x) => x.id !== j.id); })}>Delete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProjectMenu({ p, onClose }) {
  const [confirm, setConfirm] = useState(false);
  const setStatus = (status) => { patchProject(p.id, (d) => { d.status = status; }); onClose(); };
  return (
    <Sheet title={p.pattern.title} onClose={onClose}>
      <div className="menu">
        {p.status !== "active" && <button type="button" className="btn wide" onClick={() => setStatus("active")}>Back in progress</button>}
        {p.status === "active" && <button type="button" className="btn wide" onClick={() => setStatus("paused")}>Pause (moves down the list)</button>}
        {p.status !== "finished" && <button type="button" className="btn wide" onClick={() => setStatus("finished")}>Mark as finished</button>}
        <button type="button" className="btn wide" onClick={() => { onClose(); go("p/" + p.id + "/reimport"); }}>Convert the pattern again…</button>
        {!confirm ? (
          <button type="button" className="btn wide danger" onClick={() => setConfirm(true)}>Delete project…</button>
        ) : (
          <div className="confirm">
            <p>Delete <b>{p.pattern.title}</b> and all its progress from this device?</p>
            <div className="row-gap">
              <button type="button" className="btn" onClick={() => setConfirm(false)}>Keep it</button>
              <button type="button" className="btn danger" onClick={() => { patch((s) => { s.projects = s.projects.filter((x) => x.id !== p.id); }); go(""); }}>Delete</button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}
