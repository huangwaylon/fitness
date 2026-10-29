# Round 5 · R2: code, performance, a11y (after the fix round)

Scope: `a0b071d..b572caa` (51 files in `app/src`). Tested live at 393×852 @3x, mobile + touch, CPU 4×, on the dev server (`/fitness/?demo`) and a `vite preview` of a fresh `build-pages/` (Fast 4G).

## Gates
`npm run check`: 440 files, 0 errors, 0 warnings · `npx vitest run`: **162/162** (15 files; R1 had 119/11) · `npm run build`: OK.

## Round-1 verification
| ID | Status | Evidence |
|---|---|---|
| P1 tree-shake crash | **Fixed** | `FruitTree.svelte:65-67` `untrack(shake)`; 0 errors in 3 min idle. The `shakeN` test R1 asked for is missing |
| P2 idle timers | **Fixed** | `idleLife.svelte.ts:53-59,197-205` (via `director.later`); `idleLife.test.ts` |
| P3 `host.present` | **Fixed** | claim stack, `director.svelte.ts:68-91`; `Host.svelte:42` |
| P4 crossfade race | **Fixed** | `alive` token, `Host.svelte:59-81` (edge case: N5) |
| P5 animation budget | **Fixed** | 35 running = **19 scene** + 16 particle animations (budget ≤ 24 scene); moon glint static |
| P6 font CSS | **Fixed** | `0.css` 76 KB / **16.6 KB gz** (94 rules), from 227/73 |
| P7 oversized decodes | **Partly** | `palm-sm` added; `nookphone.webp` still 512 px for 104 device px |
| P8 `day` flag | **Fixed** | `idleLife.svelte.ts:130`, `IslandScene.svelte:249` |
| P9 sync-error on text | **Not fixed** | `+page.svelte:97` |
| P10 stale reduced motion | **Partly** | shared `MediaQuery` (`clock.ts:28`); `Bubble.svelte:42`, `HarvestOverlay.svelte:43` still read once |
| P11 untracked timers | **Partly** | still open in `+page.svelte:73,109,112` |
| A1 double label | **Fixed** | `IslandScene.svelte:351,356` |
| C1 magic values | **Fixed** | `--dur-walk` = `WALK_MS` (`tokens.css:190`); a few literals remain |

## Metrics
| | |
|---|---|
| 10 s rAF sample (dev, 4×) | 601 frames, **60.1 fps**, avg 16.7 ms, p95 18.5, max 18.7, **0 frames > 34 ms**, 0 long tasks |
| Load trace (dev, 4×) | LCP 821 ms (load delay 708 ms: unbundled dev modules), **CLS 0.00** |
| Load (prod preview, 4× CPU, Fast 4G) | FCP = LCP **1488 ms** |
| Heap, 3 min idle (prod, every 20 s) | 3.55 → 3.90 MB; DOM 566 (580 mid-beat); animations back to 35. **No leak** |
| Console over 3 min | 0 JS errors. One 404 for `/favicon.ico` (N6) |
| Reduced motion, toggled live | **0** running animations |
| JS | 22 files, 321 KB raw / **117 KB gz** in total; 106 KB transferred on 島 |
| CSS | 136 KB raw / **34 KB gz** in total; 31 KB transferred on 島 |
| First paint of 島 | **32 art files / ≈ 180 KB** (budget ≤ 30 / 220); 38 / 205 KB after the first idle beats. Fonts 13 woff2 / 163 KB |

## New findings
| ID | Sev | What | Evidence | Fix |
|---|---|---|---|---|
| N1 | **Should** | **An undo can leave a "ghost" event that never goes away.** `#flush` treats every event that was in `before` and is gone afterwards as acked. If you tap 取り消す on a held payday or spend while another event's POST is in flight, `unqueue` succeeds (`flushingId` is the other event) and `#flush` pushes the undone event into `#sent`. The server never has it, so `notInCache` never drops it and the ✓ or purse deduction stays until reload. GAS takes 1–3 s, so a tick, then payday, then undo is enough | `week.svelte.ts:195-198`, `gas.ts:153-158,187-189` | `flush()` returns `sentIds`, push only those; add a test (unqueue mid-flight) |
| N2 | Nice | Concurrent `#flush` callers share one `flush()` promise and both push the same acked events (`#sent = [A,B,A,B]`), so duplicate rows appear until reconcile. Mostly harmless (the model is idempotent) | `week.svelte.ts:195-198`, `view.ts:16-21` | `sentIds` (N1) fixes this too. Or dedupe by id in `composeView` |
| N3 | Nice | A held event at the head of the queue blocks later events for 5 s | `gas.ts:186` | Skip held events (`continue`) instead of `break` |
| N4 | Nice | Demo undo restores a whole-view snapshot and also rolls back other actions taken in the window | `week.svelte.ts:170-177` | Inverse edit, or snapshot only `jar` |
| N5 | Nice | Host B→X→B within 180 ms of a swap leaves the `prev` layer in the DOM (timer cleared, next run returns early) | `Host.svelte:61,77-80` | Clear `prev` in the early-return branch |
| N6 | Nice | No `<link rel="icon">`: `/favicon.ico` 404s outside the base | `src/app.html` | Link `icons/icon.svg` |
| N7 | Nice | The 5 s undo banner can't be extended (WCAG 2.2.1); a swipe also dismisses the undo | `jar/+page.svelte:83-88`, `Toast.svelte:50-59` | Hold while focused, or offer undo on the jar row too |
| N8 | Nice | Idle-life `owned` keeps cancellers that the director already cancelled (bounded by the 10 min sleep) | `idleLife.svelte.ts:53-59` | Delete on cancel |
| N9 | Nice | `fonts.test.ts` checks only the catalogs, not names in `.ts`/`.svelte`; the script header names a non-existent `font-subsets.test.ts`. My full source scan: nothing uncovered today | `fonts.test.ts:28`, `font-subsets.ts:5` | Reuse `wanted()` in the test |
| N10 | Nice | First paint is 32 art files, 2 over the budget | resource timing | Lazy-load `glyph-map` / `isabelle-stand` |

`season.ts`: pure and tested. `Mark.svelte` (`aria-hidden`) and `+error.svelte` are fine.

## Sign-off
The R1 blocker and all should-items are fixed. Performance is at budget (60 fps at 4×, CLS 0, no leak, render-blocking CSS −77 %). **Fix N1 before ship** (small change plus a test); the rest can go in the next pass.
