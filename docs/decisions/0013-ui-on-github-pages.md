# 0013 — UI on GitHub Pages; API stays on the Mac
**Status:** Accepted (user input, 2026-10-28). Amends 0005/0010 (hosting): the Mac now serves only the API (it can still serve the UI too).

**User input:** "let's host the UI on github pages."

## Decision
- **UI:** a static SPA built with `BUILD_TARGET=pages` (adapter-static, base `/fitness`) and deployed by `.github/workflows/pages.yml` on every push to main that touches `app/`. URL: https://huangwaylon.github.io/fitness/
- **API:** unchanged, on the Mac behind Tailscale Funnel. The build bakes in the repo variable `API_BASE` (`https://waylons-mbp.tail24a157.ts.net`).
- **Auth across sites:** Safari drops cross-site cookies, so `POST /api/pair` from an allowed origin also returns the session as a token. The UI keeps it in `localStorage` and sends `Authorization: Bearer`. `/api/*` accepts only `pwa` sessions as bearer tokens; Shortcuts tokens still can't open it.
- **CORS:** the Mac answers only origins listed in `CORS_ORIGINS` (`https://huangwaylon.github.io`), and only on `/api/*`. Unsafe methods still require an allowed `Origin`.
- **Build hygiene:** `app/.npmrc` pins the public npm registry (this Mac's default registry is internal and unreachable from CI). CI installs with `--ignore-scripts`.

## Consequences
- The UI is public (Pages sites are public), but data isn't: every API call needs a paired session.
- All of `huangwaylon.github.io/*` is one origin, so another Pages project of this account could read the stored session. A custom domain would isolate it.
- The session token sits in JS-readable storage instead of an HttpOnly cookie. Acceptable for two users; revoke with `scripts/devices.ts revoke <id>`.
- The PWA is installed from the Pages URL; push subscriptions belong to that origin. If the Mac's Funnel hostname changes, update `API_BASE` and redeploy (no re-pairing needed unless the database changes).
- The Animal Crossing fan art is now on a public website as well as in the public repo.
