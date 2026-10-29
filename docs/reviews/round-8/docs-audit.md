# Round 8: documentation audit (tech writer + lead)

Read-only at `d74268f`. All relative links in 51 `.md` files resolve (**0 broken**). Facts checked against `rules.ts`, `gas/main.ts`, `sheet-api.ts`, `routes/`, `pages.yml`.

## Headline findings
1. **The rules docs are behind the code.** `rules.ts` has `stepDaysPerWeek: 4`, step-derived minutes and `CALIBRATION_WEEKS = ['2026-11-02','2026-11-09']` (`e472264`), in no ADR; PROPOSAL §2.3/§3.2, ADRs 0009/0014 still say "5 of 7".
2. **The design docs are four layers that contradict each other.** style-guide v4.1 still has the dock, "2 tabs", pastel cards; v5 overrides it ("flat map sea, 2-stop sky"); environment-style overrides v5's scene (3-stop sky, gradients: what `Sea/Sky/Ground.svelte` implement); scale-and-ground adds the tile grid.
3. **PROPOSAL §4 describes an app that no longer exists:** Mochi/Bean/Juniper, "original… draw everything ourselves", 2 pages, and no きろく.
4. **The setup order differs between docs.** google-setup goes §6 Shortcut → §7 pair → §8 migrate. runbook §1 goes migrate → Shortcuts → pair.
5. **The IP stance contradicts itself.** style-guide: "the repo stays private"; `gh`: **PUBLIC**, and Pages serves the official art. ac-research: "we draw everything ourselves". No ADR covers official art.
6. **A hidden rule-change hazard.** With compute-on-read, editing `MONEY`/`POINTS` in `rules.ts` re-prices **every past week**. The `rules.ts` header still says "`npm run recompute -- --dry-run`" (deleted script).

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
- Architecture: the PWA also writes きろく edits.
- Status: link the canonical setup path (below) instead of restating it in a different order.

**PROPOSAL.md**
- Header: change "decisions 0001–0014" to "0001–0018". Change the `reviews/round-4/` link to ADR 0017.
- §2.2: the baseline is now "the Shortcut's optional 84-day run" (shortcut-health-sync §6), not a "history export". Calibration is **the weeks of Nov 2 and Nov 9 2026**, flat 60 at ≥ 6 data days.
- §2.3 table and §3.2 Apple: "**4 of 7 days**". §3.2 Peach: "Active minutes = max(Watch, (steps − goal)/100, manual workouts in きろく), daily cap". Coconut: "≤ 2 confirmed gym visits paid/week". The "at most 3 paid strength days" in §2.1 only holds for S3 targets; reword it.
- §2.3/§7: drop "private" (self-check, answers; 0016).
- §3.3: payday "reminder" → in-app 給料日 banner (0016).
- §4 **rewrite**: the screens are 島 (clock, NookPhone, 今週 ribbon, jar plate, one action, しずえ only with news), 旅の壺 (`◀ 島へ`, total, trip card, purse card), the NookPhone apps (きろく, 村人, 言語, 同期, 使い方), the harvest overlay and the check-in sheet. Look: official NH renders on a Pocket Camp–style diorama, NH tile scale, time-of-day theme. Cast: villagers from the 10-villager roster, named **ウェイ (A)** and **うめ (B)**; the host is **しずえ**. Delete Mochi/Bean/Juniper and "original… inspired".
- §5: add "きろく edits as append-only events, own data only, open weeks only".
- §6: Phase 1 "¥ ledger" becomes "compute-on-read payouts". Mark Phase 1 as built.
- §8: delete Q4 (villagers: answered).

**profiles.md**: add names ウェイ (A) / うめ (B); mark "Always-on Mac" and "ngrok" answers "(superseded: 0015)".

**Decisions**
- New **0017 rule changes from round 4**: step days 4/wk, step-derived minutes, calibration weeks, gym visits as busy days, plus the manual-minutes max rule (move it from 0011). Also add: **"rules are not versioned: changing MONEY/POINTS re-prices history; change them only at a season start, via a dated entry"**. Engineer: consider versioning like `SEASONS`.
- New **0018 official art + public site**: official NH art via `<OfficialArt>`, the public repo/Pages trade-off, and the fallback rule. It supersedes ac-research's "draw everything ourselves".
- Status lines: 0002 "amended by 0009"; 0003 "ledger/locking superseded by 0015"; 0006 "partly superseded by 0008"; 0009/0014 "step days: 0017"; 0011 "notifications → 0016, settlement → 0015, minutes → 0017"; 0005/0015 "notifications → 0016".
- `decisions/README.md`: add an index table (number, title, status, superseded-by).

**rules.ts header**: replace the `recompute` line with the 0017 re-pricing warning; note `JOBS` are read times, not jobs. 0011 "tuned without code changes" → "edit `rules.ts`, redeploy".

**sheets-architecture.md**
- §1: change `share` "no longer sent; old rows are ignored" to "refused by the script (`bad_request`); old rows ignored" (round 7 L3).
- §2 ingest reply: add `skipped?`, `unknownTypes?`.
- §3: "Pairing: paste the key in the installed app; `#key=` only works when opened inside the installed PWA (iOS storage is per app)".

**google-setup.md**
- §7: same iOS note; tell people to install to the Home Screen first.
- §8: drop "Stop the Mac server" as step 1. The Shortcut already moved in §6, so say "the Mac receives nothing after §6; export now".
- Add a top "Order: §1–5 → shortcut-health-sync.md → §7 → §8".

**runbook.md**
- §1: reorder to sheet → `GAS_URL` → Shortcuts → pair → migrate. Link, don't restate.
- §8: "Metrics only ever go up" becomes "Synced metrics only go up; a きろく edit can lower a day".
- §7: point to ADR 0018.

**shortcut-health-sync.md**: §1 "numbers only ever go up" → "…from the Shortcut". Rest matches `places.ts`/`main.ts`.


## Canonical setup path (state it once, in runbook §1; others link to it)
1. **google-setup §1–5**: create the sheet, the bound script, `KEY_A`/`KEY_B`, deploy, then `whoami` curl.
2. **`gh variable set GAS_URL`** → the Pages workflow reruns.
3. **Shortcut**: shortcut-health-sync §2–4 (sync), §5 (gym), §6 (baseline, optional).
4. **Pairing**: Safari → Add to Home Screen → open from the icon → paste the key.
5. **Migration**: google-setup §8 (`npm run export:sheet`, paste the TSVs), compare the jar, and do it before **Sun 2026-11-08 19:30**.
6. Day 8: re-run the `whoami` check (google-setup §9).
