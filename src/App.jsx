import { Component, useEffect, useState } from "react";
import { Toaster } from "./ui";
import { requestPersistence } from "./store";
import { maybeCountUsage } from "./usage";
import Projects from "./Projects";
import Project from "./Project";
import NewProject from "./NewProject";
import Stitches from "./Stitches";
import Settings from "./Settings";

// Hash routes keep the app working from any GitHub Pages path and offline:
// #/  #/new  #/p/<id>  #/p/<id>/reimport  #/stitches  #/settings
function parse(hash) {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  return { name: parts[0] || "projects", id: parts[1] || null, sub: parts[2] || null };
}

// A crash in one screen must never lock the user out of the app (an
// installed PWA has no address bar): show a way back instead.
class Boundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidUpdate(prev) { if (prev.route !== this.props.route && this.state.error) this.setState({ error: null }); }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <section className="card">
        <h2>Something went wrong on this screen</h2>
        <p>Your projects are still saved on this device. Try another screen, or save a backup to be safe.</p>
        <p className="meta">{String(this.state.error.message || this.state.error)}</p>
        <div className="row-gap">
          <a className="btn primary" href="#/">Projects</a>
          <a className="btn" href="#/settings">Backup &amp; settings</a>
        </div>
      </section>
    );
  }
}

export default function App() {
  const [route, setRoute] = useState(() => parse(window.location.hash));
  useEffect(() => {
    const on = () => { setRoute(parse(window.location.hash)); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  useEffect(() => {
    requestPersistence();
    maybeCountUsage();
    const vis = () => { if (document.visibilityState === "visible") maybeCountUsage(); };
    document.addEventListener("visibilitychange", vis);
    return () => document.removeEventListener("visibilitychange", vis);
  }, []);

  let page;
  if (route.name === "p" && route.id && route.sub === "reimport") page = <NewProject replaceId={route.id} />;
  else if (route.name === "p" && route.id) page = <Project key={route.id} id={route.id} />;
  else if (route.name === "new") page = <NewProject />;
  else if (route.name === "stitches") page = <Stitches />;
  else if (route.name === "settings") page = <Settings />;
  else page = <Projects />;

  const tab = route.name === "stitches" ? "stitches" : route.name === "settings" ? "settings" : "projects";
  return (
    <div className="app">
      <main className="page"><Boundary route={window.location.hash}>{page}</Boundary></main>
      <nav className="tabs" aria-label="Main">
        <a href="#/" className={tab === "projects" ? "on" : ""} aria-current={tab === "projects" ? "page" : undefined}>Projects</a>
        <a href="#/stitches" className={tab === "stitches" ? "on" : ""} aria-current={tab === "stitches" ? "page" : undefined}>Stitches</a>
        <a href="#/settings" className={tab === "settings" ? "on" : ""} aria-current={tab === "settings" ? "page" : undefined}>Backup &amp; settings</a>
      </nav>
      <Toaster />
    </div>
  );
}
