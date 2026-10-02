// Light / dark / follow the system. The choice lives in settings.theme and
// is applied as data-theme on <html>; index.css keys its dark palette off it.
const BAR = { light: "#f4ebdf", dark: "#1e1915" };

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") root.dataset.theme = theme;
  else delete root.dataset.theme;
  // The phone's status bar colour follows the theme too.
  const dark = theme === "dark" || (theme !== "light" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", dark ? BAR.dark : BAR.light);
    m.removeAttribute("media");
  });
}
