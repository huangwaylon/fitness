# Round 8: documentation audit (tech writer + lead)

Read-only, at `d74268f`. I checked every relative link in 51 `.md` files (**0 broken**) and every backticked path (only historical `server/*` in sheets-architecture §3, which is fine). I checked facts against `rules.ts`, `gas/main.ts`, `ingest/sheet-api.ts`, `routes/` (`/`, `/jar`, `/pair`, `/dev/characters`) and `pages.yml`.

## Headline findings
1. **The rules docs are behind the code.** `rules.ts` has `stepDaysPerWeek: 4`, step-derived minutes and `CALIBRATION_WEEKS = ['2026-11-02','2026-11-09']` (commit `e472264`, round-4 W1/W4–W6). No ADR records them. PROPOSAL §2.3/§3.2, ADR 0009 and 0014 still say "5 of 7". Only ADR 0011 has the manual-minutes max rule.
2. **The design docs are four layers that contradict each other.** style-guide v4.1 still specifies the dock, "2 tabs", pastel cards and §S scenery. v5 overrides it with "NH map look, flat sea, 2-stop sky". environment-style then overrides v5's scene (gradients, 3-stop sky, which is what `Sea/Sky/Ground.svelte` implement). scale-and-ground sets the tile grid. No single doc is current.
3. **PROPOSAL §4 describes an app that no longer exists:** Mochi/Bean/Juniper, "original… draw everything ourselves", 2 pages, and no きろく.
4. **The setup order differs between docs.** google-setup goes §6 Shortcut → §7 pair → §8 migrate. runbook §1 goes migrate → Shortcuts → pair.
5. **The IP stance contradicts itself.** style-guide says "the repo stays private". `gh` says the repo is **PUBLIC**, and Pages serves the official art publicly. runbook §7 notes this, and ac-research says "we draw everything ourselves". No ADR covers the switch to official art.
6. **A hidden rule-change hazard.** With compute-on-read, editing `MONEY`/`POINTS` in `rules.ts` re-prices **every past week**. The `rules.ts` header says "then `npm run recompute -- --dry-run`", but that script was deleted. ADR 0011 says values "can be tuned without code changes".

## Target doc set

| Doc | Action |
|---|---|
| `README.md` | Rewrite the layout/status sections (below) |
| `docs/PROPOSAL.md` | Keep as the product doc; rewrite §4, fix §2–3, §5–8 |
| `docs/profiles.md` | Keep; add names and annotate stale answers |
| `docs/decisions/0001–0016` | Keep all; fix the status lines; **add 0017, 0018**; index in README |
| `docs/design/design.md` (**new**) | **Merge** v5-direction + environment-style + scale-and-ground + the still-valid parts of style-guide (§A art map, §M motion, §T theme, §R small screens, tokens, §0 budget minus "2 tabs") into one current design spec |
| `docs/design/style-guide.md`, `v5-direction.md`, `environment-style.md`, `scale-and-ground.md` | **Delete** after the merge (git keeps them). Drop the Builder A/B work splits and the C1–C4x checklists |
| `docs/design/ac-research.md` | Keep as research; add a header note "superseded by official art (ADR 0018)" |
| `docs/design/sheets-architecture.md` | Keep (the contract); small fixes |
| `docs/design/history-and-editing.md` | Keep §1–4 as the きろく spec; delete §5–7 (task list, work plan, acceptance: shipped in round 7) |
| `docs/ops/google-setup.md`, `shortcut-health-sync.md`, `runbook.md` | Keep; align the order; trim the duplication |
| `docs/research/no-mac/` | Keep (cited by 0015); add a header line "Decided: ADR 0015. Notifications: dropped by 0016" |
| `docs/reviews/round-4/*` | Delete. Fold fitness-nutrition W1/W4–W7 into ADR 0017 first, since PROPOSAL §2 cites it |
| `docs/reviews/round-5/*`, `round-6/*` | Delete (their fixes landed in v5/v6/round 7) |
| `docs/reviews/round-7/*` | Keep until the round-8 fixes land, then delete. README keeps the rule "latest round only" |

## Edit list

**README.md**
- Replace "3 simple pages" with "the island, 旅の壺 and NookPhone apps (きろく history + editing)".
- Repo-layout table: change "style guide v3, AC research" to the new `design.md`, change "Decision records 0001–0016 (latest: 0015…)" to "0001–0018", and change "Latest reviews round-4" to "round-7 / round-8".
- Add `/pair` and `?demo` to the layout or Architecture line. Mention that the PWA also writes きろく edits.
- Status: link the canonical setup path (below) instead of restating it in a different order.

**PROPOSAL.md**
- Header: change "decisions 0001–0014" to "0001–0018". Change the `reviews/round-4/` link to ADR 0017.
- §2.2: the baseline is now "the Shortcut's optional 84-day run" (shortcut-health-sync §6), not a "history export". Calibration is **the weeks of Nov 2 and Nov 9 2026**, flat 60 at ≥ 6 data days.
- §2.3 table and §3.2 Apple: "**4 of 7 days**". §3.2 Peach: "Active minutes = max(Watch, (steps − goal)/100, manual workouts in きろく), daily cap". Coconut: "≤ 2 confirmed gym visits paid/week". The "at most 3 paid strength days" in §2.1 only holds for S3 targets; reword it.
- §2.3/§7: delete "private monthly self-check" and "private answers" (0016). Replace them with "self-check, shared".
- §3.3: change the payday "reminder" to "an in-app 給料日 banner on the 25th" (0016). Keep the 19:30/04:00 times; they are read times, not jobs.
- §3.5: change "The jar on Home" to "the jar plate on 島; tap opens 旅の壺".
- §4 **rewrite**: the screens are 島 (clock, NookPhone, 今週 ribbon, jar plate, one action, しずえ only with news), 旅の壺 (`◀ 島へ`, total, trip card, purse card), the NookPhone apps (きろく, 村人, 言語, 同期, 使い方), the harvest overlay and the check-in sheet. Look: official NH renders on a Pocket Camp–style diorama, NH tile scale, time-of-day theme. Cast: villagers from the 10-villager roster, named **ウェイ (A)** and **うめ (B)**; the host is **しずえ**. Delete Mochi/Bean/Juniper and "original… inspired".
- §5: add "きろく edits as append-only events, own data only, open weeks only".
- §6: Phase 1 "¥ ledger" becomes "compute-on-read payouts". Mark Phase 1 as built.
- §8: delete Q4 (villagers: answered).

**profiles.md**: add "Names in the app: ウェイ (A), うめ (B)". Mark the answers "Always-on Mac" and "ngrok or similar" as "(superseded: ADR 0015)".

**Decisions**
- New **0017 rule changes from round 4**: step days 4/wk, step-derived minutes, calibration weeks, gym visits as busy days, plus the manual-minutes max rule (move it from 0011). Also add: **"rules are not versioned: changing MONEY/POINTS re-prices history; change them only at a season start, via a dated entry"**. Flag this for the engineer: it may need versioning like `SEASONS`.
- New **0018 official art + public site**: official NH art via `<OfficialArt>`, the public repo/Pages trade-off, and the fallback rule. It supersedes ac-research's "draw everything ourselves".
- 0002 status: "Amended by 0009 (no sleep)". 0003: "Ledger/locking mechanics superseded by 0015 (compute-on-read)". 0006: "Partly superseded by 0008". 0009/0014: "Step days: 0017". 0011: "notifications superseded by 0016, settlement entries by 0015, active minutes by 0017". 0005/0015: "notifications: 0016".
- `decisions/README.md`: add an index table (number, title, status, superseded-by).

**rules.ts header** (a comment that acts as docs): delete the `recompute` instruction and point to ADR 0017's re-pricing warning. `JOBS` now only defines the read times; add a comment saying so. ADR 0011's "can be tuned without code changes" becomes "edit `rules.ts` and redeploy the UI".

**sheets-architecture.md**
- §1: change `share` "no longer sent; old rows are ignored" to "refused by the script (`bad_request`); old rows ignored" (round 7 L3).
- §2 ingest reply: add `skipped?`, `unknownTypes?`.
- §3: "Pairing: paste the key in the installed app; `#key=` only works when opened inside the installed PWA (iOS storage is per app)". This matches the `pair/+page.svelte` comment.
- §1 intro: "nothing is updated or deleted" stays true; add "edits are new events (きろく)".

**google-setup.md**
- §7: same iOS note; tell people to install to the Home Screen first.
- §8: drop "Stop the Mac server" as step 1. The Shortcut already moved in §6, so say "the Mac receives nothing after §6; export now".
- Add a top "Order: §1–5 → shortcut-health-sync.md → §7 → §8".

**runbook.md**
- §1: reorder to sheet → `GAS_URL` → Shortcuts → pair → migrate. Link, don't restate.
- §5.1: delete "behind Tailscale Funnel" detail or keep it only for the cleanup in §5.5.
- §8: "Metrics only ever go up" becomes "Synced metrics only go up; a きろく edit can lower a day".
- §7: point to ADR 0018.

**shortcut-health-sync.md**: change §1 "A day's numbers only ever go up" to "…from the Shortcut". §5: "the app asks on 島 (しずえ's choice list)". Everything else matches `places.ts` and `main.ts`.

**history-and-editing.md**: delete §5–7. Keep the round-7 M1/M2 lock text (it matches the 65 s close).

## Canonical setup path (state it once, in runbook §1; others link to it)
1. **google-setup §1–5**: create the sheet, the bound script, `KEY_A`/`KEY_B`, deploy, then `whoami` curl.
2. **`gh variable set GAS_URL`** → the Pages workflow reruns.
3. **Shortcut**: shortcut-health-sync §2–4 (sync), §5 (gym), §6 (baseline, optional).
4. **Pairing**: Safari → Add to Home Screen → open from the icon → paste the key.
5. **Migration**: google-setup §8 (`npm run export:sheet`, paste the TSVs), compare the jar, and do it before **Sun 2026-11-08 19:30**.
6. Day 8: re-run the `whoami` check (google-setup §9).
