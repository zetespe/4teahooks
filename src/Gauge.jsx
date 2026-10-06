import { useState } from "react";
import { patchProject, uid } from "./store";
import { canCheck, checkSwatch, gaugeLine, parseCount, swatchPlan, verdictLabel, DEFAULT_TOLERANCE } from "./gauge";
import { fmtDate } from "./ui";

// "Gauge swatch" card: how to make one, what the user counted, and whether
// to change the hook. Verdicts are worked out again on every render, so a
// new tolerance in Settings applies to swatches measured earlier too.
export default function GaugeCard({ p, started, tolerance = DEFAULT_TOLERANCE }) {
  const g = p.pattern.gauge;
  const swatches = p.swatches || [];
  const check = (s) => checkSwatch(g, s, tolerance);
  const matched = canCheck(g) ? swatches.find((s) => check(s)?.verdict === "match") : null;
  const [open, setOpen] = useState(() => !!(canCheck(g) && g.critical && !matched && !started));
  const [form, setForm] = useState(() => ({ hook: swatches[0]?.hook || g?.hook || "", stitches: "", rows: "" }));
  if (!canCheck(g)) return null;

  const last = swatches[0];
  const lastCheck = last ? check(last) : null;
  const plan = swatchPlan(g);
  const per = `${g.over} ${g.unit}`;
  const status = matched ? `Matched${matched.hook ? ` with ${matched.hook}` : ""}`
    : lastCheck ? verdictLabel(lastCheck.verdict, lastCheck.by)
      : g.critical ? "Check before you start" : "Optional for this pattern";

  const counts = { stitches: g.stitches ? parseCount(form.stitches) : null, rows: g.rows ? parseCount(form.rows) : null };
  const ready = !!(counts.stitches || counts.rows);
  const save = () => {
    if (!ready) return;
    const s = { id: uid(), at: new Date().toISOString(), hook: form.hook.trim() };
    if (counts.stitches) s.stitches = counts.stitches;
    if (counts.rows) s.rows = counts.rows;
    patchProject(p.id, (d) => { d.swatches = [s, ...(d.swatches || [])]; d.updatedAt = new Date().toISOString(); });
    setForm({ ...form, stitches: "", rows: "" });
  };
  const remove = (id) => patchProject(p.id, (d) => { d.swatches = (d.swatches || []).filter((x) => x.id !== id); });

  return (
    <details className="card about gauge" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary><h2>Gauge swatch</h2> <span className={"meta" + (matched ? " ok" : "")}>{status}</span></summary>

      <p><b>The pattern:</b> {g.text}</p>
      {gaugeLine(g) !== g.text && <p className="meta">Read as {gaugeLine(g)}{g.hook ? ` with a ${g.hook} hook` : ""}. If that doesn't match the pattern, go by the pattern.</p>}
      {!g.critical && <p className="meta">The pattern says gauge isn't critical, so a swatch is optional here.</p>}

      <h3>Make a swatch</h3>
      <ol>
        <li>With {g.hook ? `a ${g.hook} hook` : "the pattern's hook"} and the yarn you'll use, crochet a piece about {plan.size} × {plan.size} {g.unit}
          {plan.stitches ? `, about ${plan.stitches} stitches wide` : ""}{plan.rows ? `${plan.stitches ? " and" : ","} ${plan.rows} rows tall` : ""}{g.stitch ? `, in ${g.stitch}` : ""}.</li>
        <li>If the pattern says to wash or block the finished piece, do the same to the swatch. Let it lie flat, without stretching it.</li>
        <li>Lay a ruler across the middle, away from the edges, and count {g.stitches ? `the stitches in ${per}` : ""}{g.stitches && g.rows ? ", then " : ""}{g.rows ? `the rows in ${per} up and down` : ""}. Half stitches count too.</li>
      </ol>

      <h3>What did you count?</h3>
      <div className="gauge-form">
        <label className="field"><span>Hook</span>
          <input type="text" placeholder="e.g. 4 mm" value={form.hook} onChange={(e) => setForm({ ...form, hook: e.target.value })} />
        </label>
        {g.stitches && (
          <label className="field"><span>Stitches in {per}</span>
            <input type="text" inputMode="decimal" placeholder={String(g.stitches)} value={form.stitches} onChange={(e) => setForm({ ...form, stitches: e.target.value })} />
          </label>
        )}
        {g.rows && (
          <label className="field"><span>Rows in {per}</span>
            <input type="text" inputMode="decimal" placeholder={String(g.rows)} value={form.rows} onChange={(e) => setForm({ ...form, rows: e.target.value })} />
          </label>
        )}
      </div>
      <button type="button" className="btn primary" onClick={save} disabled={!ready}>Check my swatch</button>

      {lastCheck && <Advice c={lastCheck} hook={last.hook} per={per} tolerance={tolerance} />}

      {swatches.length > 0 && (
        <>
          <h3>Your swatches</h3>
          <ul className="swatches">
            {swatches.map((s) => {
              const c = check(s);
              return (
                <li key={s.id}>
                  <span className="meta">{fmtDate(s.at)}</span>{" "}
                  {[s.hook, s.stitches && `${s.stitches} sts`, s.rows && `${s.rows} rows`].filter(Boolean).join(" · ")}
                  {c && <> · <b>{verdictLabel(c.verdict, c.by)}</b></>}
                  {" "}<button type="button" className="link-btn" onClick={() => remove(s.id)}>Delete</button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </details>
  );
}

function Advice({ c, hook, per, tolerance }) {
  const main = c[c.by];
  const rowsOff = c.by === "stitches" && c.rows && c.rows.result !== "match";
  return (
    <div className={"gauge-result " + c.verdict} role="status">
      {c.verdict === "match" && (
        <p><b>Your swatch matches.</b> {main.mine} {c.by} in {per}, the pattern has {main.wanted}. Use {hook ? `the ${hook} hook` : "this hook"} for the project.</p>
      )}
      {c.verdict === "more" && (
        <p><b>Your {c.by} are smaller than the pattern's:</b> {main.mine} instead of {main.wanted} in {per}, so the piece would come out smaller.
          Try a bigger hook{c.hook ? ` (${c.hook})` : ", half a size up"} and make a new swatch.</p>
      )}
      {c.verdict === "fewer" && (
        <p><b>Your {c.by} are bigger than the pattern's:</b> {main.mine} instead of {main.wanted} in {per}, so the piece would come out bigger.
          Try a smaller hook{c.hook ? ` (${c.hook})` : ", half a size down"} and make a new swatch.</p>
      )}
      {c.verdict !== "match" && (
        <p className="meta">If you're already two or more hook sizes away from the pattern's and it still doesn't match, the yarn is probably {c.verdict === "more" ? "thinner" : "thicker"} than the pattern's. A {c.verdict === "more" ? "slightly thicker" : "slightly thinner"} yarn will work better.</p>
      )}
      {rowsOff && (
        <p className="meta">Rows: {c.rows.mine} instead of {c.rows.wanted}. A small difference in rows is common. Where the pattern gives lengths in {per.split(" ")[1]}, follow the measurements.</p>
      )}
      <p className="meta">Counts within ±{tolerance}% of the pattern's count as a match. You can change this in Settings.</p>
    </div>
  );
}
