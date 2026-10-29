# 0018 — Official Animal Crossing art; public repo and site for now
**Status:** Accepted (user decision; recorded in round 8). Supersedes the "original, inspired, we draw everything ourselves" stance of PROPOSAL v2.1 §4 and [ac-research.md](../design/ac-research.md), and style-guide's "the repo stays private".

**User input:** use the real New Horizons look (villagers, しずえ, trees, NookPhone tiles) rather than look-alike drawings. Keep the repo public for now (GitHub Pages on the free plan needs it); make it private later.

## Decision
- **Official NH renders** are the art: villagers from the 10-villager roster, しずえ (Isabelle) as the host, fruit, trees, NookPhone tiles and glyphs. `npm run assets:fetch` (`app/scripts/fetch-assets.ts`) downloads them from Nookipedia's file pages into `app/static/art/` (WebP, downscaled to the size the UI needs, about 1 MB in total) with a `manifest.json`.
- **One component draws them:** `<OfficialArt key=…>`. It reserves the box from the manifest aspect ratio and shows a `fallback` snippet (our own SVG drawing, e.g. `<Villager>`) when a key is missing or the image fails to load. New art goes through the manifest; nothing hot-links Nookipedia at run time.
- **The repo and the Pages site are public for now.** So the official art is served from `huangwaylon.github.io/fitness/`. Health data lives only in the Google Sheet, and keys live in Script Properties and on the phones. But [profiles.md](../profiles.md) and PROPOSAL §1 (age, height, weight, gyms, eating habits) are public too.
- **Later: make it private.** Either GitHub Pro (private Pages) or another static host. The app code does not change; only the hosting and the CSP origin do.

## Risks
- **Copyright.** The art is Nintendo's. A public repo plus a public site is redistribution, not just personal use. A takedown (DMCA to GitHub, or a request from Nintendo) is possible. Response: make the repo private or delete `static/art/`; `<OfficialArt>` falls back to our drawings, so the app keeps working.
- **Discoverability.** The site URL is guessable, and anyone can load the UI. Without a key it shows only the pairing screen and holds no data, so the exposure is the art, not the couple's data.
- **Source drift.** Nookipedia may rename or remove files. The fetch is idempotent and only runs by hand; the committed WebPs are what ships.
- **No commercial use**, ever: this stays a two-person app.

## Consequences
- The design spec ([design.md](../design/design.md)) assumes official renders on a Pocket Camp–style diorama. ac-research.md stays as research only.
- The `fetch-assets.ts` header still says "keep the repo private"; it should say "public for now, see ADR 0018" (engineer follow-up).
