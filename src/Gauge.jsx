import { useState } from "react";
import { patchProject, uid } from "./store";
import { MAX_SWATCHES, UNITS, canCheck, checkSwatch, fmtMm, gaugeLine, gaugeTarget, hookMm, parseCount, swatchPlan, textShowsNumbers, verdictLabel, DEFAULT_TOLERANCE } from "./gauge";
import { fmtDate } from "./ui";

// "Gauge swatch" card: how to make one, what the user counted, and whether
// to change the hook. Verdicts are worked out again on every render, so a
// new tolerance in Settings applies to swatches measured earlier too.
// Project.jsx keys it by project and gauge, so its local state starts over
// when either changes.
export default function GaugeCard({ p, started, tolerance = DEFAULT_TOLERANCE }) {
  const g = p.pattern.gauge;
  const unit = p.gaugeUnit || g?.unit;
  const t = gaugeTarget(g, unit);
  const swatches = p.swatches || [];
  // A swatch measured in the other unit (before the user changed it) isn't compared.
  const sameUnit = (s) => !s.unit || !t || s.unit === t.unit;
  const check = (s) => (sameUnit(s) ? checkSwatch(t, s, tolerance) : null);
  const last = swatches[0];
  const lastCheck = last ? check(last) : null;
  const [open, setOpen] = useState(() => !!(canCheck(g) && g.critical && lastCheck?.verdict !== "match" && !started));
  const [form, setForm] = useState(() => ({ hook: last?.hook || g?.hook || "", stitches: "", rows: "" }));
  if (!canCheck(g)) return null;

  const earlier = lastCheck?.verdict !== "match" ? swatches.slice(1).find((s) => check(s)?.verdict === "match") : null;
  const status = !t ? "Choose centimetres or inches"
    : last && !sameUnit(last) ? `Last swatch was measured in ${UNITS[last.unit].name}`
    : !lastCheck ? (g.critical ? "Not checked yet" : "Optional for this pattern")
      : lastCheck.verdict === "match" ? `Matches${last.hook ? ` with ${showHook(last.hook)}` : ""}`
        : `Last swatch: ${verdictLabel(lastCheck.verdict, lastCheck.by).toLowerCase()}${earlier ? ` · matched earlier${earlier.hook ? ` with ${showHook(earlier.hook)}` : ""}` : ""}`;

  const setUnit = (u) => patchProject(p.id, (d) => { d.gaugeUnit = u; d.updatedAt = new Date().toISOString(); }, { count: false });

  return (
    <details className="card about gauge" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><span className="summary-title">Gauge swatch</span> <span className={"meta" + (lastCheck?.verdict === "match" ? " ok" : "")}>{status}</span></summary>

      <p><b>The pattern:</b> {g.text}</p>
      {!textShowsNumbers(g) && <p className="meta">The app read this as {gaugeLine(g, unit)}{g.hook ? ` with a ${g.hook} hook` : ""}. If that doesn't match the pattern, go by the pattern.</p>}
      {!g.critical && <p className="meta">The pattern says gauge isn't critical, so a swatch is optional here.</p>}

      <div className="setting">
        <span id={`unit-${p.id}`}>This pattern measures in</span>
        <div className="seg" role="group" aria-labelledby={`unit-${p.id}`}>
          {Object.entries(UNITS).map(([u, x]) => (
            <button key={u} type="button" className={unit === u ? "on" : ""} aria-pressed={unit === u} onClick={() => setUnit(u)}>{x.name[0].toUpperCase() + x.name.slice(1)}</button>
          ))}
        </div>
      </div>
      <p className="meta">
        {!unit ? "The pattern doesn't make it clear. Check the gauge on the pattern page and choose one: your ruler and the counts below will use it."
          : p.gaugeUnit && p.gaugeUnit !== g.unit ? (g.unit ? `The pattern says ${UNITS[g.unit].name}; you chose ${UNITS[unit].name}.` : `You chose ${UNITS[unit].name}.`)
            : `From the pattern. Measure with the ${UNITS[unit].name} side of your ruler.`}
      </p>

      {t && <SwatchSteps g={g} t={t} />}
      {t && <SwatchForm p={p} t={t} form={form} setForm={setForm} />}
      {t && lastCheck && <Advice c={lastCheck} hook={last.hook} t={t} tolerance={tolerance} />}

      {t && swatches.length > 0 && (
        <>
          <h3>Your swatches</h3>
          <ul className="swatches">
            {swatches.map((s) => {
              const c = check(s);
              return (
                <li key={s.id}>
                  <span className="meta">{fmtDate(s.at)}</span>{" "}
                  {[s.hook && showHook(s.hook), s.stitches && `${s.stitches} sts`, s.rows && `${s.rows} ${t.rowWord}`].filter(Boolean).join(" · ")}
                  {" "}in {UNITS[s.unit || t.unit].span} {s.unit || t.unit}
                  {c && <> · <b>{verdictLabel(c.verdict, c.by)}</b></>}
                  {!sameUnit(s) && <span className="meta"> · not compared: measured in {UNITS[s.unit].name}</span>}
                  {" "}<button type="button" className="link-btn" onClick={() => patchProject(p.id, (d) => { d.swatches = (d.swatches || []).filter((x) => x.id !== s.id); })}>Delete</button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </details>
  );
}

// The field asks for mm, so a bare "4" is shown as "4 mm".
const showHook = (h) => (/^\d+(?:[.,]\d+)?$/.test(h.trim()) ? fmtMm(hookMm(h)) : h);

function SwatchSteps({ g, t }) {
  const plan = swatchPlan(t);
  const span = `${t.span} ${UNITS[t.unit].name}`;
  const what = [t.stitches && `how many stitches fit in ${span} across`, t.rows && `how many ${t.rowWord} fit in ${span} up and down`].filter(Boolean).join(", then ");
  return (
    <>
      <h3>Make a swatch</h3>
      <ol>
        <li>With {g.hook ? `a ${g.hook} hook` : "the pattern's hook"} and the yarn you'll use, crochet a piece about {plan.size} × {plan.size} {t.unit}
          {plan.stitches ? `, about ${plan.stitches} stitches wide` : ""}{plan.rows ? `${plan.stitches ? " and" : ","} ${plan.rows} ${t.rowWord} tall` : ""}{g.stitch ? `, in ${g.stitch}` : ""}.</li>
        {g.rounds && <li>The pattern counts rounds, so work the swatch in rounds too, without turning (for example as a small tube), or work every row from the right side, cutting the yarn at the end of each row.</li>}
        <li>If the pattern says to wash or block the finished piece, do the same to the swatch. Let it lie flat, without stretching it.</li>
        <li>Lay a ruler across the middle, away from the edges, and count {what}. Half stitches count too: write 17.5 or 17½.</li>
      </ol>
      {t.scaled && <p className="meta">The pattern gives its gauge as {gaugeLine(g, t.unit)}. Counting over {t.per} is more accurate, so the app compares it as {t.stitches ? `${t.stitches} stitches` : ""}{t.stitches && t.rows ? " and " : ""}{t.rows ? `${t.rows} ${t.rowWord}` : ""} in {t.per}.</p>}
    </>
  );
}

function SwatchForm({ p, t, form, setForm }) {
  const counts = { stitches: t.stitches ? parseCount(form.stitches) : null, rows: t.rows ? parseCount(form.rows) : null };
  // When the pattern gives stitches, they're needed: rows alone don't say which hook to use.
  const ready = t.stitches ? !!counts.stitches : !!counts.rows;
  const save = () => {
    if (!ready) return;
    const s = { id: uid(), at: new Date().toISOString(), hook: form.hook.trim(), unit: t.unit };
    if (counts.stitches) s.stitches = counts.stitches;
    if (counts.rows) s.rows = counts.rows;
    patchProject(p.id, (d) => { d.swatches = [s, ...(d.swatches || [])].slice(0, MAX_SWATCHES); d.updatedAt = new Date().toISOString(); });
    setForm({ ...form, stitches: "", rows: "" });
  };
  return (
    <>
      <h3>What did you count?</h3>
      <p className="meta">Fill this in and the app tells you whether your swatch matches the pattern, or which hook to try next.</p>
      <div className="gauge-form">
        <label className="field"><span>Your hook (mm)</span>
          <input type="text" inputMode="decimal" placeholder="e.g. 4.5" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} />
        </label>
        {t.stitches && (
          <label className="field"><span>Stitches in {t.per} <small>(pattern: {t.stitches})</small></span>
            <input type="text" inputMode="decimal" value={form.stitches} onChange={(e) => setForm({ ...form, stitches: e.target.value })} />
          </label>
        )}
        {t.rows && (
          <label className="field"><span>{t.rowWord[0].toUpperCase() + t.rowWord.slice(1)} in {t.per} <small>(pattern: {t.rows}{t.stitches ? ", optional" : ""})</small></span>
            <input type="text" inputMode="decimal" value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} />
          </label>
        )}
      </div>
      <button type="button" className="btn primary" onClick={save} disabled={!ready}>Compare with the pattern</button>
      {!ready && <p className="meta">{t.stitches ? `Enter the number of stitches you counted in ${t.per} first.` : `Enter the number of ${t.rowWord} you counted in ${t.per} first.`}</p>}
    </>
  );
}

function Advice({ c, hook, t, tolerance }) {
  const main = c.by === "stitches" ? c.stitches : c.rows;
  const rowsOff = c.by === "stitches" && c.rows && c.rows.result !== "match";
  return (
    <div className={"gauge-result " + c.verdict} role="status">
      {c.verdict === "match" && (
        <p><b>Your swatch matches.</b> {main.mine} {c.by} in {t.per}, the pattern has {main.wanted}. Use {hook ? `the ${showHook(hook)} hook` : "this hook"} for the project.</p>
      )}
      {c.verdict === "more" && (
        <p><b>Your {c.by} are smaller than the pattern's:</b> {main.mine} instead of {main.wanted} in {t.per}, so the piece would come out smaller.
          Try a bigger hook{c.hook ? ` (${c.hook})` : ", one size up"} and make a new swatch.</p>
      )}
      {c.verdict === "fewer" && (
        <p><b>Your {c.by} are bigger than the pattern's:</b> {main.mine} instead of {main.wanted} in {t.per}, so the piece would come out bigger.
          Try a smaller hook{c.hook ? ` (${c.hook})` : ", one size down"} and make a new swatch.</p>
      )}
      {c.verdict !== "match" && (
        <p className="meta">If you're already two or more hook sizes away from the pattern's and it still doesn't match, the yarn is probably {c.verdict === "more" ? "thinner" : "thicker"} than the pattern's. A {c.verdict === "more" ? "slightly thicker" : "slightly thinner"} yarn will work better.</p>
      )}
      {rowsOff && (
        <p className="meta">{t.rowWord[0].toUpperCase() + t.rowWord.slice(1)}: {c.rows.mine} instead of {c.rows.wanted}. A small difference here is common and depends on how tall you make each stitch. Where the pattern gives lengths in {UNITS[t.unit].name}, follow the measurements.</p>
      )}
      <p className="meta">Counts within ±{tolerance}% of the pattern's count as a match. You can change this in Settings.</p>
    </div>
  );
}
