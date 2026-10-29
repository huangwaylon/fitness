# Round 5 · R2: code, performance, a11y (after the fix round)

Scope: `a0b071d..b572caa` (51 files in `app/src`). Tested live at 393×852 @3x, mobile + touch, CPU 4×, on the dev server (`/fitness/?demo`) and a `vite preview` of a fresh `build-pages/` (Fast 4G).

## Gates
`npm run check`: 440 files, 0 errors, 0 warnings · `npx vitest run`: **162/162** (15 files; R1 had 119/11) · `npm run build`: OK.

## Round-1 verification
| ID | Status | Evidence |
|---|---|---|
| P1 tree-shake crash | **Fixed** | `FruitTree.svelte:65-67` `if (shakeN > 0) untrack(shake)`. No errors in 3 min of idle life (prod). There is no component test that bumps `shakeN`, which R1 asked for |
| P2 idle timers outlive stop | **Fixed** | `idleLife.svelte.ts:53-59` routes every beat through `director.later`, and stop() cancels `owned` (`:197-205`). Covered by `idleLife.test.ts` (2 tests) |
| P3 shared `host.present` | **Fixed** | `claimHost()` keeps a claim stack and `present = claims > 0` (`director.svelte.ts:68-91`). Only the newest live Host is `driven` (`Host.svelte:42`) |
| P4 Host crossfade race | **Fixed** | `alive` token + timer cleared in the effect cleanup (`Host.svelte:59-81`). See N5 for one leftover edge case |
| P5 animation budget | **Fixed** | 35 running = **19 scene** + 16 particle animations (8 leaves × fall/flutter); the budget is ≤ 24 scene. The moon glint is static (`Sea.svelte:34`) |
| P6 font-face CSS | **Fixed** | `0.css` is 76 KB raw / **16.6 KB gz** (94 `@font-face`), down from 227/73 |
| P7 oversized decodes | **Partly** | `palm-sm` was added. `nookphone.webp` is still 512 px wide, shown at 104 device px |
| P8 `day` flag | **Fixed** | `idleLife.svelte.ts:130`, `IslandScene.svelte:249` |
| P9 sync-error keyed on text | **Not fixed** | `+page.svelte:97` still compares against `t('state.saveFailed')` |
| P10 stale reduced motion | **Partly** | There is a shared `MediaQuery` (`clock.ts:28`), and Fx and the director use it. `Bubble.svelte:42` and `HarvestOverlay.svelte:43` still read it once per instance |
| P11 untracked timers | **Partly** | Fixed in FruitTree, Balloon, IslandScene and Host. Still open in `+page.svelte:73,109,112` |
| A1 double score label | **Fixed** | Both pills are `aria-hidden` (`IslandScene.svelte:351,356`) |
| C1 magic values | **Fixed** (mostly) | `--dur-walk` = `WALK_MS` (`tokens.css:190`, `director.svelte.ts:183`). A few literals remain (`.glass-line #4A3A2C`, the colours in `Mark.svelte`) |

## Metrics
| | |
|---|---|
| 10 s rAF sample (dev, 4×) | 601 frames, **60.1 fps**, avg 16.7 ms, p95 18.5, max 18.7, **0 frames > 34 ms**, 0 long tasks |
| Load trace (dev, 4×) | LCP 821 ms (load delay 708 ms: unbundled dev modules), **CLS 0.00** |
| Load (prod preview, 4× CPU, Fast 4G) | FCP = LCP **1488 ms** |
| Heap over 3 min idle (prod, sampled every 20 s) | 3.55 → 3.90 MB. DOM stays at 566 nodes (peaks at 580 during a beat, then back). Running animations back to 35 every time. **No leak** |
| Console over 3 min | 0 JS errors. One 404 for `/favicon.ico` (N6) |
| Reduced motion, toggled live | **0** running animations |
| JS | 22 files, 321 KB raw / **117 KB gz** in total; 106 KB transferred on 島 |
| CSS | 136 KB raw / **34 KB gz** in total; 31 KB transferred on 島 |
| First paint of 島 (≤ 1.5 s) | **32 art files / ≈ 180 KB** (budget ≤ 30 / 220). Six more (reactions, a villager icon) arrive with the first idle beats, for 38 / 205 KB in total. Fonts: 13 woff2 / 163 KB |

## New findings
| ID | Sev | What | Evidence | Fix |
|---|---|---|---|---|
| N1 | **Should** | **An undo can leave a "ghost" event that never goes away.** `#flush` treats every event that was in `before` and is gone afterwards as acked. Suppose you tap 取り消す on a held payday or spend while another event's POST is still in flight (`send()` → `#flush` joins the shared `flush()` promise). `unqueue` succeeds, because `flushingId` is the other event. `#flush` then pushes the undone event into `#sent`. The server never has it, so `notInCache` never drops it. The payday ✓ or the purse deduction stays on screen until reload. It is easy to hit: GAS round-trips take 1–3 s, so a habit tick followed by payday and then undo is enough | `week.svelte.ts:195-198`, `gas.ts:153-158,187-189` | Have `flush()` return `sentIds` and push only those. Add a test: an event in flight + a held event, unqueue mid-flight, and expect the held event not to be in the view |
| N2 | Nice | Concurrent `#flush` callers share one `flush()` promise, so both push the same acked events: `#sent = [A,B,A,B]`. `composeView` dedupes only against cache rows, so it adds duplicate rows until reconcile. Most event types are idempotent in the model (checkin set, spend by `spendId`), so the risk is low | `week.svelte.ts:195-198`, `view.ts:16-21` | `sentIds` (N1) fixes this too. Or dedupe by id in `composeView` |
| N3 | Nice | A held event at the head of the queue blocks everything behind it for 5 s (`flush` breaks on `nextAt > now`). A habit tick right after payday waits for the window. It is still optimistic on screen, but a reload in that time loses no data only because the queue is persisted | `gas.ts:186` | Skip held events (`continue`) instead of breaking, or accept and document it |
| N4 | Nice | Demo undo restores a whole-view snapshot, so it also rolls back any other action taken in the 5 s window (payday → spend → undo payday removes the spend) | `week.svelte.ts:170-177` | Pass an inverse edit, or snapshot only `jar` |
| N5 | Nice | Host crossfade: when the pose goes B→X→B within 180 ms of a swap, the cleanup clears the `prev = null` timer and the next run returns early, so the faded-out `prev` layer stays in the DOM | `Host.svelte:61,77-80` | In the early-return branch, clear `prev` if it is set (or let `transitionend` clear it) |
| N6 | Nice | No `<link rel="icon">`, so browsers request `/favicon.ico` outside the `/fitness` base and get a 404 | `src/app.html`; preview network log | `<link rel="icon" href="%sveltekit.assets%/icons/icon.svg">` |
| N7 | Nice | The 5 s undo banner has no way to extend the window (WCAG 2.2.1). A screen-reader user hears the `role="status"` announcement but may not reach 取り消す in time. A swipe on the banner also dismisses the undo | `jar/+page.svelte:83-88`, `Toast.svelte:50-59` | Keep the banner while it is focused or hovered, and keep the hold until it closes; or offer undo from the jar row as well |
| N8 | Nice | The idle-life `owned` set never drops cancellers that the director cancelled through a preempting reaction. They accumulate, but only until the 10-minute sleep or unmount | `idleLife.svelte.ts:53-59` | Delete on cancel (wrap `c`), or clear `owned` at each tick |
| N9 | Nice | `fonts.test.ts` checks only the i18n catalogs, while the script also keeps glyphs from `.ts`/`.svelte` (villager and place names). The script's header refers to a non-existent `font-subsets.test.ts`. I re-scanned all non-dev sources for both weights: nothing is uncovered today | `fonts.test.ts:28`, `scripts/font-subsets.ts:5` | Reuse the script's `wanted()` in the test, and fix the name |
| N10 | Nice | First paint is 32 files, 2 over the ≤ 30 budget (bytes are fine). `isabelle-stand` is decoded at load next to `isabelle` | preview resource timing | Lazy-load `glyph-map`/`isabelle-stand`, or merge small deco into one sprite |

`season.ts` is pure and has tests (`season.test.ts`: season and foliage edges, tod, previews). One intended quirk: chrome night runs 19–06 but the sky's night ends at 05. `Mark.svelte` is purely decorative (`aria-hidden`) and fine. `+error.svelte` uses a static Host, full reloads and safe areas, and is fine.

## Sign-off
Every blocking item and most should-items from R1 are fixed. Performance is at budget (60 fps at 4×, CLS 0, no leak, render-blocking CSS cut by 77 %). **One should-fix before ship: N1** (the undo ghost), a small change plus a test. P9/P10/P11 leftovers and the N-nices can go in the next pass.
