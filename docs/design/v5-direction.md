# Island Fund v5 direction: one focus, one style, sky-matched chrome

Overrides style-guide v4.1 where they conflict. Shots: `.shots/v5/critique-*`.

## 1. Critique (393×852, 320×568)

- **Chrome follows the phone, not the sky.** `season.ts` makes night = clock night **or** `systemDark`, so the dialogue area, dock and Jar turn navy under a noon sky.
- **Five competing focal points** on 島 (date pill, two score pills, jar, bubble + two buttons, dock). The chrome takes 40% of the screen (45% at 320, where the sky disappears).
- **Two illustration styles:** official renders on hand-drawn vectors (gradient sea, squiggle waves, scalloped outline, outlined jar, haloed sun). NH's map UI is flat: no outlines, small triangle wave marks.
- **No system:** the source has 27 radii, 23 font sizes, 218 hex colours and 45 shadows. The Jar uses 3 card skins and 14 backgrounds.
- **Busy:** 79 images, 22 running animations. The Jar's しずえ repeats the ladder card. The harvest card leaves 60% of the screen empty.

## 2. Principles

1. **One focal point per screen.** 島 shows *this week's score*. 旅の壺 shows *the total*.
2. **HUD-light, like NH's island view:** a corner clock, the NookPhone, one ribbon and one action. しずえ speaks only when she has news.
3. **Game-derived only:** official art or NH 2D-UI patterns (map sea, map ribbon, NookPhone tiles, dialogue box, choice list).
4. **The sky sets the theme.** `prefers-color-scheme` is ignored.
5. **Calm motion:** idle animation stays in the background, one event at a time.

## 3. 島 Island

```
393×852 (320×568 in brackets)
top+8    12:40 10/28(水)                    [NookPhone 40]   (time only)
top+56            ═══ 今週 43/100 ═══                         (43/100, 32 tall)
         sky ── straight horizon ── flat map-style sea        (sky ≥ 40)
         island, full bleed:  orchard · jar + ¥146,200 plate · orchard
         me (left)                                partner (right)
bottom   [しずえ box, 2 lines (1)]   [はい] [いいえ] stacked right   ← news only
         [ 今夜のチェック ]  56 (48)                          safe 34 (8)
```

- **Focus: the score ribbon**, a copy of the NH map's yellow title banner (yuzu, with ribbon tails). It shows `今週 43/100` (Fredoka 24; `今週` is dropped at 320). The fruit on my orchard is the only other progress cue.
- **Jar plate:** a 12px cream nameplate with the total. It is the scene's only label. Tap the jar to open 旅の壺.
- **One action:** 今夜のチェック, full width, leaf green. A pending question uses NH's **choice list** (cream bubbles stacked at the right), which takes the same slot.
- **しずえ:** the NH dialogue box (wobbly cream box, tilted nameplate, ▼). It shows only for a pending question, harvest, payday or "grew". It **overlays** the bottom band of the scene (the sea) and never changes the scene's height (round 6 F1). A question puts the box and the choice list in one row over the action's slot. The harvest uses the same box (no tail, no figure).
- **Choice list:** cream pills stacked at the right; a yuzu ▶ cursor starts on the first option (はい), and hover, focus or ↑/↓ moves it.
- **Sync errors are not しずえ's** (round 6 (c)). Offline or a failed refresh is a lasting state: the chip under the clock, `オフライン · タップで再接続`, tap = retry now (`同期中…` while it runs). A failed save (data may be lost) gets one banner, and my villager plays the sheepish R17 (`emit('sync-error')`).
- **Moves:** デモ goes to the NookPhone status row. The clock is plain HUD text with no pill; at 320 it keeps the date (it fits; round 6 F11). The partner's progress goes to the partner sheet. The sync chip shows only when sync is not ok.
- **Layout contract (A ↔ B):** on `main.island`, `--chrome-below` = gap + CTA + lip + bottom pad (the one fixed slot under the scene) and `--chrome-talk` = the band at the scene's bottom that the dialogue box may cover. Both are constants per viewport; the scene is `100dvh − --chrome-below` tall with the stage anchored to its bottom.
- **Goes:** the dock. The Jar returns with NH's `◀ 島へ` pill.

## 4. Other screens

- **旅の壺:** hero = the jar + **¥146,200** (44) + `今週 ≈ ¥5,860`. Then **two cream Nook Miles+ cards, one skin**: the trip (`money/miles-ticket`, 次は 沖縄, a bar, `あと ¥3,800`) and ごほうび財布 (`phone/nook-shopping`, 使う). Payday becomes an NH banner. No しずえ.
- **Harvest:** the island stays visible behind a cool tint (`rgba(58,72,134,.18)` fading in below the sky, so the clouds stay white and the sun yellow; `rgba(30,36,80,.16)` at night), with the dialogue box and the card at the bottom above the CTA. Confetti ≤ 1.2 s falls behind the box and the card, never over the numbers.
- **Payday (Jar):** a quiet cream banner with the small official bells icon, body text, quieter than the total.
- **島 ⇄ 旅の壺:** the jar squashes (R18), then a 360 ms eased zoom from the jar into the Jar page; `◀ 島へ` (or back) shrinks the page into the jar. View Transitions where supported, the same zoom as a CSS entrance otherwise, a short crossfade under reduced motion (`client/jarTransition.ts`).
- **しまフォン / sheets:** official tiles (settings = `phone/island-designer`). One sheet skin: cream, radius 32, a lip, a nameplate title, one CTA.

## 5. Unified visual system

**Scene:** the NH map look (`map/islet`) under the official renders.

| Layer | Rule |
|---|---|
| Sea | Flat fill. Offset rows of small `▲` marks (6×4u, 8% darker, ~10% coverage). One slow drift. |
| Shore | Flat sand plus a 4u foam line, like the map pads. |
| Horizon | A straight line and a 3u lighter strip. |
| Grass | NH diamond texture at ≤ 5% contrast. The cliff is a darker band. |
| Sky | 2-stop gradient. Flat sun/moon, 2 clouds. |
| Jar | No ink outline. Flat glass, one highlight. |

**Outline/shadow:** no strokes anywhere. Depth = one lip (12% darker bottom edge) + a ground ellipse `rgba(40,60,40,.18)`. Chrome = a 4px lip everywhere (`--lip-h`; round 6 F9). `--sh-float` only on floating layers.

**Radius:** `8` chips · `16` buttons · `24` cards/dialogue · `32` sheets/phone · `30%` tiles · pill only for the ribbon, plate and choices.

**Type:** `12` · `15` body · `18` talk/button · `24` title/score · `44` hero. Weights 500/700. Fredoka for numbers only.

**Palette (≤ 12):** ink `#4A3A2C`/`#6B5544`, cream `#FFF9E3`, paper `#FFF3D6`, lip `#E0C48A`, leaf `#6ED07A`/`#4FB35C` (action), yuzu `#FFD84D`/`#E6B22E` (focus), map mint `#7BD7C1`/`#63B4B5`, coral `#FF8F7A` (errors). Delete the pastel cards, miles navy, person colours and `--app-*`.

**Time of day re-tints everything** from one `data-tod`:

| tod | Sky | Sea | Chrome surface / text | `theme-color` |
|---|---|---|---|---|
| dawn 05–07 | `#FFC6A8→#CDEBFF` | `#8FD8C8` | cream / ink | sky top |
| day | season sky | `#7BD7C1` | cream / ink | sky top |
| dusk 16–19 | `#FF9E7A→#FFE2A8` | `#86C9B9` | `#FFF1DC` / ink, lip `#E8B98A` | sky top |
| night 19–05 | `#3A4886→#7584CC` | `#3F6F9C`, marks `#5585B3` | `#3A4886`/`#45559A` / `#FFF6E0` | `#3A4886` |

The ribbon, plate, dialogue box and choices stay cream/yellow (game objects). `data-theme` comes **only** from tod. Drop `systemDark` and its `matchMedia` listener.

## 6. Motion

Idle budget 22 → **≤ 10** (breathing ×2, しずえ blink, clouds, sea marks, ≤ 3 particles, ≤ 2 twinkles). Events go through a queue and play one at a time. Emotes appear on events only. Focus beats: the ribbon counts up after a check-in, and the jar pops on harvest. Reduced motion = static.

## 7. Removal list

1. The dock (`TabBar.svelte`).
2. On 島: the date pill + デモ, both beach score pills, idle しずえ, SyncPill when ok.
3. Sea gradient, deep corners, wave squiggles, 4 sparkles, moon glint, sun halo, the 3rd cloud.
4. The scalloped plateau outline and the strong checker.
5. Fences, shells, mushrooms, acorns and the rock. Bushes go 8 → 4 and leaves 5 → 2.
6. On the Jar: しずえ, the header tile, scallop textures, the dashed payday card and the empty stamp circle.

## 8. New official art

Fetched: `map/islet` (style reference), `money/miles-ticket`, `phone/nook-shopping`, `phone/island-designer`. Reuse the map icons `deco/resident-services`, `deco/airport` and `phone/glyph-*`.

## 9. Before vs. after (393×852, demo)

| Screen | Chrome blocks | Images | Anims | Font sizes | Radii | Card skins |
|---|---|---|---|---|---|---|
| 島 | 8 → **4** (+dialogue on news) | 79 → **≤ 45** | 22 → **≤ 10** | 5 → 4 | 9 → 4 | — |
| 旅の壺 | 7 → **4** | 5 → 5 | — | 7 → 4 | 6 → 4 | 3 → **1** |
| Harvest | island hidden → visible | — | — | — | — | 1 |

島 before: date, デモ, phone, 2 pills, bubble, 2 buttons, dock. After: clock, phone, ribbon, CTA. Jar before: tile, hero, しずえ, 3 cards, dock. After: back, hero, 2 cards.

## 10. Work split

**Builder A (scene, characters, motion, art):** `island/*` (flat `Sea`/`Ground`/`Sky`/`Clouds`, a decluttered `BackRow`/`FlowerBeds`/`Particles`, the jar plate), `Villager`, `Host`, `Emote`, `Fx`, `Sprites` (jar), `motion/*` (budget, queue, count-up), `art.ts`, `OfficialArt`, the scene block of `tokens.css`.

**Builder B (chrome, screens, theme, i18n):** `client/theme.svelte.ts` + `season.ts` (**unlocked**: tod-only theme), `tokens.css`, `theme.css`, `+layout.svelte` (dock removed, `TabBar.svelte` deleted), `+page.svelte`, new `Hud.svelte` + `ChoiceList.svelte`, `Bubble`, `Toast`, `ShimaPhone`/`HelpButton`, `SyncPill`, `Sheet`, `CheckinSheet`, `PartnerSheet`, `HarvestOverlay`, `jar/+page.svelte`, `i18n/*`.

**Contract:** `IslandScene` gets a `total` prop and keeps `onjar`. `--chrome-below` becomes 90–200. The art director owns `static/art/**` and `scripts/*`. Order: B theme → A sea/sky → B HUD → A declutter/motion → B Jar/sheets → 320 pass.
