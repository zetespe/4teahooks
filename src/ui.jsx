import { useEffect, useRef, useState } from "react";

// replace: true swaps the current history entry, so Back doesn't lead to a
// form that was already submitted or a project that was deleted.
export function go(path, { replace = false } = {}) {
  const hash = "#/" + path.replace(/^\//, "");
  if (replace) window.location.replace(hash); else window.location.hash = hash;
}

// ---- toast (module-level so any helper can call it) ----
let toastListener = null;
export function toast(msg, ms = 2400, action = null) { if (toastListener) toastListener(msg, ms, action); }
export function Toaster() {
  const [t, setT] = useState(null);
  useEffect(() => {
    let timer;
    toastListener = (msg, ms, action) => { setT({ msg, action }); clearTimeout(timer); timer = setTimeout(() => setT(null), ms); };
    return () => { toastListener = null; clearTimeout(timer); };
  }, []);
  if (!t) return null;
  return (
    <div className="toast" role="status">
      <span>{t.msg}</span>
      {t.action && <button type="button" onClick={() => { t.action.fn(); setT(null); }}>{t.action.label}</button>}
    </div>
  );
}

export async function copyText(text, label = "") {
  try { await navigator.clipboard.writeText(text); toast("Copied " + label); return true; }
  catch (e) {
    const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); toast("Copied " + label); return true; } catch (e2) { toast("Copy failed"); return false; } finally { ta.remove(); }
  }
}

export function Bar({ value, total, label }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value} aria-label={label || "Progress"}>
      <div className="bar-fill" style={{ width: pct + "%" }} />
    </div>
  );
}

// "today", "yesterday", "3 days ago", "12 Mar"
export function ago(iso) {
  if (!iso) return "not yet";
  const d = new Date(iso), now = new Date();
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(now) - day(d)) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  if (diff < 14) return "a week ago";
  if (diff < 60) return `${Math.floor(diff / 7)} weeks ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: d.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

export function Check({ done, onClick, label, big }) {
  return (
    <button type="button" className={"check" + (done ? " on" : "") + (big ? " big" : "")} onClick={onClick} aria-pressed={done} aria-label={(done ? "Untick " : "Tick ") + label}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" /></svg>
    </button>
  );
}

// A bottom sheet / dialog, closed by the backdrop or Escape.
export function Sheet({ title, onClose, children }) {
  const ref = useRef(null);
  // Focus moves into the sheet, stays there while it's open (Tab wraps), and
  // returns to whatever opened it.
  useEffect(() => {
    const opener = document.activeElement;
    const focusables = () => [...ref.current.querySelectorAll("button, a[href], input, textarea, select")].filter((el) => !el.disabled);
    (focusables()[1] || focusables()[0])?.focus();
    const k = (e) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab") return;
      const f = focusables();
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("keydown", k); if (opener && opener.focus) opener.focus(); };
  }, [onClose]);
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" ref={ref} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Icon({ name }) {
  const paths = {
    back: "M15 5l-7 7 7 7",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    plus: "M12 5v14M5 12h14",
    note: "M5 4h10l4 4v12H5zM15 4v4h4M8 12h8M8 16h5",
    more: "M5 12h.01M12 12h.01M19 12h.01",
  };
  return <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d={paths[name]} /></svg>;
}
