# Review rounds

Team reviews of the app, newest last. Their findings were applied (or decided against) in the code, the design docs
and the ADRs, so only rounds 19 and 21 are kept here. The full reports of rounds 7–18 are in git history: list them with
`git ls-tree -r --name-only b34746e docs/reviews` and read one with `git show b34746e:docs/reviews/round-N/<file>.md`.
Rounds 1–6 (role memos) and the no-Mac backend research behind ADR 0015 (`docs/archive/no-mac/`) are at the same commit
or earlier.

| Round | Date | Topic | Outcome |
|---|---|---|---|
| 7 | 2026-10-29 | Code review of きろく editing; experience review of the demo | Undo windows and week-lock handling in the write queue; UI fixes |
| 8 | 2026-10-29 | Backend/model, client UI and docs audit | Dead code removed; docs aligned with the Sheet backend |
| 9 | 2026-10-29 | Senior review after the Mac was retired | IndexedDB snapshot cache, `rev` resync, compaction, folder boundaries (`deps.test.ts`), health monitor, Dependabot |
| 10 | 2026-10-30 | iOS Safari scroll/viewport audit; UI sizing | Viewport and safe-area fixes, sizing tokens, 16px form fields (`inputs.test.ts`) |
| 11 | 2026-10-30 | The ベル engine contract for the UI | View types in `types.ts` (ADR 0019) |
| 12 | 2026-10-30 | Goals review (coach, dietitian, behaviour designer) | ADR 0019 tuning amendment |
| 13 | 2026-10-30 | Apps Script review; button contrast on cream screens | Backend hardening (locks, `REV`, tail reads); four button tiers |
| 14 | 2026-10-30 | Sound design after NH | The sound module and `docs/design/sound.md` |
| 15 | 2026-10-30 | Automating the 🍐 eating check-in | Led to ADR 0021 (no manual check-ins) |
| 16 | 2026-10-30 | Whole-codebase code review; sound on iPhone; whole-app UX | Sync robustness fixes, audio performance fixes, UX fixes |
| 17 | 2026-10-30 | Information architecture and content | Navigation and copy simplified |
| 18 | 2026-10-30 | Rings contract (ADR 0021) and wallet UI cleanup (ADR 0022) | Model contract for rings; UI moved to rings and one wallet |
| 19 | 2026-10-30 | Goals and economy against real data | [round-19/](round-19/) (report only; proposals not yet decided) |
| 21 | 2026-10-31 | Final UI polish (measured walk: centring, rhythm, overlaps, stacking, ja line breaks) and a code review | [round-21/](round-21/): Japanese keep-all breaks, `--z-*` scale, tap-safe popup and footers, the buy sheet's live price, the harvest load fallback |
