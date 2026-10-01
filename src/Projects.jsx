import { useStore } from "./store";
import { projectProgress, resumePoint } from "./progress";
import { Bar, ago } from "./ui";

const STATUS_ORDER = { active: 0, paused: 1, finished: 2 };

export default function Projects() {
  const S = useStore();
  const projects = [...S.projects].sort((a, b) =>
    (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || String(b.lastWorkedAt || b.createdAt).localeCompare(String(a.lastWorkedAt || a.createdAt)));

  return (
    <>
      <header className="top">
        <div>
          <h1>4tea Hooks</h1>
          <p className="sub">Keep your place in every crochet pattern.</p>
        </div>
        <a className="btn primary" href="#/new">+ New</a>
      </header>

      {!projects.length && <Welcome />}

      <ul className="cards">
        {projects.map((p) => <ProjectCard key={p.id} p={p} />)}
      </ul>

      {S.projects.length > 0 && (S.settings.changesSinceBackup || 0) >= 30 && (
        <p className="hint center"><a href="#/settings">Save a backup</a>: it's been a while.</p>
      )}
    </>
  );
}

function ProjectCard({ p }) {
  const prog = projectProgress(p);
  const r = resumePoint(p);
  let where = "All done";
  if (r) {
    const copy = r.part.make > 1 ? ` ${r.copy + 1} of ${r.part.make}` : "";
    const unit = r.unit.kind === "action" ? (r.unit.step.text.length > 40 ? r.unit.step.text.slice(0, 40) + "…" : r.unit.step.text) : r.unit.label + (r.unit.rep ? ` (${r.unit.rep.i} of ${r.unit.rep.of})` : "");
    where = `${r.part.name}${copy} · ${unit}`;
  }
  return (
    <li>
      <a className={"card project-card status-" + p.status} href={"#/p/" + p.id}>
        <div className="row-between">
          <h2>{p.pattern.title}</h2>
          {p.status !== "active" && <span className="badge">{p.status}</span>}
        </div>
        <p className="where">{where}</p>
        {r && r.note && <p className="stop-note">“{r.note}”</p>}
        <Bar value={prog.done} total={prog.total} label={`${p.pattern.title} progress`} />
        <p className="meta">{prog.pct}% · {p.pattern.size && p.pattern.size !== "One size" ? `size ${p.pattern.size} · ` : ""}last worked {ago(p.lastWorkedAt)}</p>
      </a>
    </li>
  );
}

function Welcome() {
  return (
    <section className="card welcome">
      <h2>How it works</h2>
      <ol>
        <li><b>Find a pattern</b> online: a toy, a sweater, a blanket, anything.</li>
        <li><b>Let your chatbot convert it.</b> Tap <i>New</i>, copy the prompt, and paste it with the pattern link into Claude, ChatGPT or Gemini. Paste the answer back.</li>
        <li><b>Tick off rows as you go.</b> Leave a note when you stop mid-row. Tap any stitch to see how it's made.</li>
      </ol>
      <p className="hint">Your projects stay on this device. Nothing is uploaded; save a backup file from <a href="#/settings">Backup &amp; settings</a>.</p>
      <a className="btn primary wide" href="#/new">Start a project</a>
    </section>
  );
}
