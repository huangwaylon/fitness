# Round 5 · R1 — performance, accessibility, code (v4 UI)

Scope: `e542dc7..0c69b6a` UI work. Tested live at 393×852 @3x, touch, CPU 4×, on the dev server and a `vite preview` of `build-pages/`.

## Gates
`npm run check`: 431 files, 0 errors, 0 warnings · `npx vitest run`: 119/119 passed (11 files) · `npm run build`: OK.

## Metrics
| | |
|---|---|
| Frames, 10 s idle + autumn particles (rAF, 4×) | avg 16.6 ms · p95 18.5 · max 18.7 · **0 frames > 34 ms** |
| Long tasks at load (dev, unbundled) | 87 / 60 / 117 ms; none afterwards |
| LCP (prod preview, 4× CPU, Fast 4G) · CLS | 572 ms · **0.00** (dev and prod) |
| DOM · running animations | 569 nodes · 50 (34 scene + 16 particles); budget is ≤ 24 scene |
| Heap over 60 s | 12.86 → 13.04 MB, DOM count unchanged (no leak) |
| Reduced motion (emulated) | **0** running animations |
| JS (gzip) | entry 81 KB (largest chunk 81 KB raw / 27 KB gz) + ≈ 20 KB for the 島 route; all JS 107 KB |
| CSS (gzip) | global `0.css` 227 KB raw / **73 KB**, of which ~200 KB is 250 `@font-face` rules; IslandScene 14 KB / 3.6 KB |
| First paint of 島 | 33 art files / 189 KB (budget ≤ 30 / 220 KB) · 13 font files / 166 KB |

## Findings
| ID | Sev | What | Evidence | Fix |
|---|---|---|---|---|
| P1 | **Blocking** | **The idle "tree shake" crashes the app.** FruitTree's `$effect` calls `shake()`, which reads and writes `leaves`, so the effect re-triggers itself → `effect_update_depth_exceeded`, and the whole page turns into **"500 Internal Error"** | `island/FruitTree.svelte:47,51-53`; the console stack comes from `idleLife.svelte.ts:48` → `treeShake` (`IslandScene.svelte:246-249`). Reproduced in dev and the **prod preview**; twice unforced within ~2 min (≈ 4.6 % per tick ⇒ median ~3–4 min on the island) | `$effect(() => { if (shakeN > 0) untrack(shake); })`. Add a component test that bumps `shakeN` |
| P2 | Should | Idle-life timers outlive `stop()`. `setTimeout`s at `idleLife.svelte.ts:90,129,130` are not tracked, so they write the module-global `actors` after `resetAll()`: villagers can come back facing inward, or しずえ stuck in a pose | `idleLife.svelte.ts:90,129-133`, `director.svelte.ts:194` | Schedule them through the director's `later(id, …)` so `cancel`/`resetAll` clears them |
| P3 | Should | `actors.host.present` is a single boolean shared by every live `<Host>`: the island Bubble, the HarvestOverlay Bubble, and the dev gallery. Unmounting one sets it to false while another is still mounted, so しずえ's idle moves and reactions stop for the session. All live Hosts also mirror one `pose` override (wrong poses in the gallery) | `Host.svelte:66-72,39`; `HarvestOverlay.svelte:82`, `+page.svelte:117`, `dev/characters:55,106` | Refcount `present`, or give the director host to one Host only (an `actor` prop like Villager has) and pass `animate={false}` everywhere else |
| P4 | Should | Host crossfade race: the `decode()` promise is never cancelled. A→B→A within the decode leaves `shown = B`. The `prev = null` timer is not cleared either | `Host.svelte:51-64` | Use a `let alive = true` token in the effect and return `() => (alive = false)` |
| P5 | Should | Over the animation budget: 34 infinite scene animations against ≤ 24. (12 stars, 3 sea twinkles, 6 waves, 3 glows, an invisible glint) | trace sample; `Sky.svelte:72`, `Sea.svelte:54`, `BackRow.svelte:50-54` | Use 6 stars, keep the glint at `animation: none` until it is shown, and count against §S.13 in the gallery |
| P6 | Should | The render-blocking CSS is mostly font-face declarations: 250 `@font-face` rules (Zen Maru Gothic 500 + 700) (predates v4; biggest first-paint cost) | `+layout.svelte:4-7`, `0.CSq6k9CA.css` | Subset to the glyphs we use (i18n strings + kana) as 1 woff2 per weight, or load the CJK face's CSS non-blocking |
| P7 | Nice | Oversized decodes: `nookphone.webp` 512×444 shown at 104×90 device px (~5×), one `palm` 320×302 shown at 83×79, `isabelle-*` 512² shown at 301². `oak-fall` 309×384 is *upscaled* to 374×461 | measured `naturalWidth` vs rect × DPR | Export the dock icon at 128; second palm size; oak to the art reviewer |
| P8 | Nice | The `day: true` flag in `IDLE_POOL` is never checked, so tree shakes and hops run during `tod = night` before 22:00 | `reactions.ts:117-123`, `idleLife.svelte.ts:100-107` | Filter on `e.day && tod === 'night'`, or drop the field |
| P9 | Nice | The `sync-error` reaction is keyed on the *translated* toast text.; fragile on copy/locale changes | `+page.svelte:83-85` | Typed error flag from the store, or emit from its catch |
| P10 | Nice | Reduced motion is read once per component instance, so it goes stale if the user toggles it | `Fx.svelte:36`, `Bubble.svelte:42` | Use one shared `new MediaQuery('(prefers-reduced-motion: reduce)')` from `svelte/reactivity` |
| P11 | Nice | Untracked timers write state after unmount | `FruitTree.svelte:48`, `Balloon.svelte:25`, `IslandScene.svelte:103,112`, `+page.svelte:96-99`, `Host.svelte:58` | Add a small `later()` helper with cleanup (IslandScene already has one, `:169`) |
| A1 | Nice | The score is announced twice: the villager button and the pill `role="img"` carry the same label | `IslandScene.svelte:322-338` | Make the "mine" pill `aria-hidden`, like the partner's |
| C1 | Nice | Magic colours and durations in components: jar fills `#F7C548`/`#7BC67E`, pill border `#EADBB8`, firefly `#F3FF9E`, `CONFETTI`. Walk timings 1600/1200/640 are duplicated between JS and the CSS `transition: 1600ms` | `IslandScene.svelte:84,299-311,368,391`, `Particles.svelte:72`, `director.svelte.ts:146-162` | Move them into tokens (`--dur-walk`, `--jar-*`) and read the duration in JS from one constant |

## Verified OK
Sheets: native `<dialog>` + `showModal()` (focus moves in, Esc closes, focus returns). Tap targets ≥ 44 px. Text contrast ≥ 4.5 (lowest: 「使う」 4.90). Decorative images `alt=""`/`aria-hidden`. Bus and listeners clean up. `data-paused` works when the tab is hidden. CSP: only the hashed bootstrap script.

**Verdict:** ship only after P1, a one-line fix. P2–P5 should follow in the same pass.
