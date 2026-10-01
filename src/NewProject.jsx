import { useState } from "react";
import { useStore, patch, newProject } from "./store";
import { normalizePattern, extractJSON, unitsOfPart } from "./pattern";
import { pruneProgress, keptAfterReimport } from "./progress";
import { aiPrompt } from "./prompt";
import { copyText, toast, go, Icon } from "./ui";

// New project, or (replaceId) a fresh conversion of an existing project's
// pattern that keeps the progress on rows that are still there.
export default function NewProject({ replaceId = null }) {
  const S = useStore();
  const existing = replaceId ? S.projects.find((p) => p.id === replaceId) : null;
  const [link, setLink] = useState(existing?.pattern.sourceUrl || "");
  const [size, setSize] = useState(existing?.pattern.size && existing.pattern.size !== "One size" ? existing.pattern.size : "");
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState(null); // { pattern, warnings }
  const [error, setError] = useState("");

  if (replaceId && !existing) return <p className="hint">Project not found. <a href="#/">Back to projects</a></p>;

  const check = (text = answer) => {
    setError(""); setResult(null);
    if (!text.trim()) { setError("Paste the chatbot's answer first."); return; }
    try {
      const r = normalizePattern(extractJSON(text));
      if (!r.pattern.sourceUrl && /^https?:\/\//i.test(link.trim())) r.pattern.sourceUrl = link.trim();
      setResult(r);
      // The preview opens below the fold on a phone: bring it into view.
      setTimeout(() => document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) { setError(e.message); }
  };

  const pasteFromClipboard = async () => {
    try {
      const t = await navigator.clipboard.readText();
      setAnswer(t); check(t);
    } catch (e) { toast("Couldn't read the clipboard. Long-press the box and paste."); }
  };

  const save = () => {
    if (!result) return;
    if (existing) {
      patch((s) => {
        const p = s.projects.find((x) => x.id === existing.id);
        p.previous = { pattern: p.pattern, progress: p.progress, at: new Date().toISOString() };
        p.pattern = result.pattern;
        p.progress = pruneProgress(p.progress, result.pattern);
        p.updatedAt = new Date().toISOString();
      });
      toast("Pattern updated. Changed your mind? ⋯ → Undo the last conversion", 4000);
      go("p/" + existing.id, { replace: true });
      return;
    }
    const p = newProject(result.pattern);
    patch((s) => { s.projects.push(p); s.settings.changesSinceBackup = (s.settings.changesSinceBackup || 0) + 1; });
    go("p/" + p.id, { replace: true });
  };

  return (
    <>
      <header className="top">
        <a className="icon-btn" href={existing ? "#/p/" + existing.id : "#/"} aria-label="Back"><Icon name="back" /></a>
        <h1>{existing ? "Convert again" : "New project"}</h1>
        <span />
      </header>

      {existing && <p className="hint">The new version replaces the pattern of <b>{existing.pattern.title}</b>. Ticks and notes stay on rows that keep the same id.</p>}

      <section className="card">
        <h2><span className="num">1</span> Copy the prompt</h2>
        <label className="field">
          <span>Pattern link</span>
          <input type="url" inputMode="url" placeholder="https://…" value={link} onChange={(e) => setLink(e.target.value)} />
        </label>
        <label className="field">
          <span>Size you're making <small>(leave empty for one-size patterns)</small></span>
          <input placeholder="e.g. M, 2–3 years, 100 cm chest" value={size} onChange={(e) => setSize(e.target.value)} />
        </label>
        <button type="button" className="btn primary wide" onClick={() => copyText(aiPrompt({ link, size }), "prompt")}>Copy prompt</button>
        <p className="hint">Paste it into Claude, ChatGPT or Gemini. No link? Paste the pattern text (or attach the PDF or a photo) right after the prompt.</p>
      </section>

      <section className="card">
        <h2><span className="num">2</span> Paste the answer</h2>
        <textarea className="paste" rows={6} placeholder="Paste the chatbot's whole answer here" value={answer}
          onChange={(e) => { setAnswer(e.target.value); setResult(null); setError(""); }} />
        <div className="row-gap">
          <button type="button" className="btn" onClick={pasteFromClipboard}>Paste</button>
          <button type="button" className="btn" onClick={() => check()}>Check</button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
      </section>

      {result && <Preview result={result} onSave={save} replacing={!!existing} kept={existing ? keptAfterReimport(existing.progress, result.pattern) : null} />}
    </>
  );
}

function Preview({ result, onSave, replacing, kept }) {
  const { pattern, warnings } = result;
  return (
    <section className="card" id="preview">
      <h2><span className="num">3</span> Check and save</h2>
      <h3 className="preview-title">{pattern.title}</h3>
      <p className="meta">
        {[pattern.designer, pattern.size && `size ${pattern.size}`, pattern.terminology !== "unknown" && `${pattern.terminology} terms`].filter(Boolean).join(" · ")}
      </p>
      <ul className="preview-parts">
        {pattern.parts.map((part) => {
          const n = unitsOfPart(part).length;
          return <li key={part.id}><b>{part.name}</b>{part.make > 1 ? ` ×${part.make}` : ""} <span className="meta">{n} {n === 1 ? "step" : "steps"} to tick</span></li>;
        })}
      </ul>
      {warnings.length > 0 && (
        <ul className="warnings">{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
      )}
      {kept && kept.before > 0 && (
        <p className={kept.after < kept.before ? "warnings" : "hint"}>
          {kept.after === kept.before
            ? `All ${kept.before} of your ticks and notes stay in place.`
            : `${kept.after} of your ${kept.before} ticks and notes stay; ${kept.before - kept.after} are on rows that changed and will be dropped. You can undo this from the project menu.`}
        </p>
      )}
      <p className="hint">Compare a few rows with the original pattern. If something's off, ask the chatbot to fix it and paste again.</p>
      <button type="button" className="btn primary wide" onClick={onSave}>{replacing ? "Replace pattern" : "Save project"}</button>
    </section>
  );
}
