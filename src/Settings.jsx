import { useRef, useState } from "react";
import { useStore, patch, setState, exportObject, applyBackup, resetAll } from "./store";
import { extractJSON } from "./pattern";
import { wakeLockSupported } from "./useWakeLock";
import { toast, fmtDate } from "./ui";

const fileName = () => `4teahooks-${new Date().toISOString().slice(0, 10)}.json`;

export default function Settings() {
  const S = useStore();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // parsed backup waiting for merge/replace
  const [erase, setErase] = useState(false);

  const markBackedUp = () => patch((s) => { s.settings.lastBackupAt = new Date().toISOString(); s.settings.changesSinceBackup = 0; });

  // Save where the user chooses: share sheet (iOS → Save to Files, Google
  // Drive, AirDrop), the save dialog (Chrome/Edge), or a plain download.
  const saveBackup = async () => {
    const json = JSON.stringify(exportObject(S), null, 1);
    const name = fileName();
    try {
      const file = new File([json], name, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "4tea Hooks backup" });
        markBackedUp(); toast("Backup shared"); return;
      }
    } catch (e) { if (e.name === "AbortError") return; }
    try {
      if (window.showSaveFilePicker) {
        const h = await window.showSaveFilePicker({ suggestedName: name, types: [{ description: "JSON", accept: { "application/json": [".json"] } }] });
        const w = await h.createWritable(); await w.write(json); await w.close();
        markBackedUp(); toast("Backup saved"); return;
      }
    } catch (e) { if (e.name === "AbortError") return; }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = name; document.body.appendChild(a); a.click(); a.remove();
    markBackedUp(); toast("Backup downloaded");
  };

  // Restoring is two steps: read the file, then choose merge / replace on an
  // in-app panel. Only an explicit tap on "Replace" is destructive.
  const readFile = async (file) => {
    if (!file) return;
    try {
      const obj = extractJSON(await file.text());
      const n = Array.isArray(obj.projects) ? obj.projects.length : 0;
      if (!S.projects.length) { restore(obj, "merge"); return; }
      setPending({ obj, n, date: obj.exportedAt ? fmtDate(obj.exportedAt) : null });
    } catch (e) { toast("Restore failed: " + e.message, 4000); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  };
  const restore = (obj, mode) => {
    setPending(null);
    try {
      const r = applyBackup(S, obj, mode);
      setState(r.state);
      toast("Restored: " + r.report, 3500);
    } catch (e) { toast("Restore failed: " + e.message, 4000); }
  };

  const set = (k, v) => patch((s) => { s.settings[k] = v; });

  return (
    <>
      <header className="top">
        <div>
          <h1>Backup &amp; settings</h1>
          <p className="sub">Your projects live only on this device.</p>
        </div>
      </header>

      <section className="card">
        <h2>Backup</h2>
        <p>Save a file with all your projects and progress, to Files, Google Drive, email… Restore it here on any phone or computer.</p>
        <p className="meta">{S.settings.lastBackupAt ? `Last backup ${fmtDate(S.settings.lastBackupAt)}` : "No backup yet"} · {S.projects.length} {S.projects.length === 1 ? "project" : "projects"}</p>
        <div className="row-gap">
          <button type="button" className="btn primary" onClick={saveBackup} disabled={!S.projects.length}>Save backup</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Restore from file</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => readFile(e.target.files[0])} />
        </div>
        {pending && (
          <div className="confirm">
            <p>This file has {pending.n} {pending.n === 1 ? "project" : "projects"}{pending.date ? ` (saved ${pending.date})` : ""}.</p>
            <p className="meta"><b>Merge</b> adds them and updates projects that are in both. <b>Replace</b> deletes everything on this device first.</p>
            <div className="row-gap">
              <button type="button" className="btn primary" onClick={() => restore(pending.obj, "merge")}>Merge</button>
              <button type="button" className="btn danger" onClick={() => restore(pending.obj, "replace")}>Replace</button>
              <button type="button" className="btn" onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>Settings</h2>
        {wakeLockSupported && (
          <label className="switch">
            <input type="checkbox" checked={S.settings.keepAwake !== false} onChange={(e) => set("keepAwake", e.target.checked)} />
            <span>Keep the screen on while a project is open</span>
          </label>
        )}
        <label className="switch">
          <input type="checkbox" checked={S.settings.usageCount !== false} onChange={(e) => set("usageCount", e.target.checked)} />
          <span>Count my use anonymously <small>(at most one ping per day, week and month; no identifiers, no project data. <a href="about/" target="_blank" rel="noopener">What's counted</a>)</small></span>
        </label>
      </section>

      <section className="card">
        <h2>About</h2>
        <p>4tea Hooks is free, has no ads and no accounts. Patterns are converted by the chatbot you choose; the app itself never sends your patterns or progress anywhere.</p>
        <p><a href="about/" target="_blank" rel="noopener">About and privacy</a> · <a href="https://4teahub.com" target="_blank" rel="noopener">brewed by 4tea</a></p>
      </section>

      <section className="card">
        <h2>Erase</h2>
        {!erase ? (
          <button type="button" className="btn danger" onClick={() => setErase(true)}>Erase everything…</button>
        ) : (
          <div className="confirm">
            <p>Delete all projects and progress from this device? Save a backup first if you might want them back.</p>
            <div className="row-gap">
              <button type="button" className="btn" onClick={() => setErase(false)}>Cancel</button>
              <button type="button" className="btn danger" onClick={() => { resetAll(); setErase(false); toast("Everything erased"); }}>Erase</button>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
