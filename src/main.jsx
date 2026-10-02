import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'
import { getState } from './store'
import { applyTheme } from './theme'

// Set the theme before the first paint so a dark-mode user never sees a
// light flash.
applyTheme(getState().settings.theme)
window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener?.('change', () => applyTheme(getState().settings.theme))

// The app works offline from a cached copy. Check for a new version on start,
// whenever it comes back to the screen, and hourly; a new version installs
// itself and the page reloads into it (autoUpdate).
if (!import.meta.env.DEV) {
  registerSW({
    immediate: true,
    onRegisteredSW(_url, reg) {
      if (!reg) return
      const check = () => { if (navigator.onLine !== false) reg.update().catch(() => {}) }
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check() })
      setInterval(check, 60 * 60 * 1000)
    },
  })
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
