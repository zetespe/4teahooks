# 4tea Hooks

Keep your place in any crochet pattern. A free, private web app (PWA) for
phones: find a pattern online, let your chatbot convert it, then tick off
rounds and rows as you crochet.

- **Any pattern**: toys, garments, blankets, motifs. Parts you make several
  times ("make 2") are tracked per copy; ranges ("Rnds 12–18"), repeats and
  "repeat until 30 cm" are supported, as are steps like stuffing, safety eyes
  and sewing up.
- **Pick up where you left off**: each project opens at the next row, with
  your "where I stopped" note and when you last worked on it.
- **Stitch help**: tap any stitch for how to make it, with US/UK names.
- **Bring your own chatbot**: the app gives you a prompt; paste it with the
  pattern into Claude, ChatGPT or Gemini and paste the answer back. Format:
  [`docs/AI-PROTOCOL.md`](docs/AI-PROTOCOL.md).
- **Private**: no account, no server. Projects live in the browser's local
  storage; backups are a file you keep wherever you like.

**Live app:** https://zetespe.github.io/4teahooks/
**About page:** https://zetespe.github.io/4teahooks/about/

## Privacy and what is counted

Everything a user records stays on their device. Two anonymous counts go to
[GoatCounter](https://www.goatcounter.com) (no cookies, no personal data
stored), dashboard at https://4teahooks.goatcounter.com:

- **Page views** of the About page (`public/about/`).
- **App use** from `src/usage.js`: each device sends at most one `app/day`
  event per day, `app/week` per ISO week, `app/month/new` or
  `app/month/returning` per month, and `app/install` once ever, with
  GoatCounter sessions off (`ns=1`) and no identifier. Users can switch this
  off in Backup & settings.

No token or key is involved: the count URL is public by design, and the
dashboard is behind the GoatCounter account login.

## Install on your phone

- **iOS (Safari):** open the URL → Share → Add to Home Screen.
- **Android (Chrome):** open the URL → ⋮ menu → Add to Home screen.

## Development

```sh
npm install
npm run dev       # local dev server
npm test          # unit tests (vitest)
npm run lint
npm run build
```

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`;
Settings → Pages → Source: GitHub Actions).

Product notes: [`docs/SPEC.md`](docs/SPEC.md); research in
[`docs/research/`](docs/research/).

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md): free for personal and other
noncommercial use.
