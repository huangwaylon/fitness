# Round 6: v5 review (UI/UX lead)

Builds A 422c755/d27991c, B e4eee42, checked against `v5-direction.md` on the dev server (island, Jar, harvest, night, winter, spring dusk) at 393×852, 375×667 and 320×568, all in `colorScheme: "dark"`. Shots: `.shots/v6/`.

## Verdict on the brief

| Goal | Result |
|---|---|
| Chrome follows the sky | **Pass.** Noon in dark mode is cream, night is periwinkle (`jar-noon-dark-320`, `jar-night-320`) |
| One focal point | **Pass.** The ribbon is the only loud element on 島; the total leads the Jar |
| Clutter | **Pass.** Images 79 → 45, animations 22 → 7, 4 font sizes |
| One illustration style | **Pass**, with gaps F5, F6, F10 |
| Tab bar removed | **Pass.** The jar plate `¥146,200 ▶` reads as a door; `◀ 島へ` is clear |
| Motion | **Pass.** The greeting on load is R1, an event |
| Small screens | **Pass.** 320 fits with the sky intact (`island-noon-320`) |

## Findings

| ID | Sev | What | Viewport | Evidence | Fix |
|---|---|---|---|---|---|
| F1 | **Major** | The island re-lays out when the dialogue box appears or hides: at 320 it moves ~35px after はい, then ~70px when the line clears. | all, worst 320 | `island-noon-320` → `island-after-yes-320` → `island-idle-320` | **A + B:** bottom-anchor the stage at a fixed height; the dialogue overlays the sea band instead of changing `--chrome-below`. |
| F2 | **Major** | Empty sky band of ~235px (28% of the screen) between the ribbon (bottom 92px) and the horizon. | 393×852 | `island-noon-dark-393` | See (a): raise the horizon. |
| F3 | **Major** | The harvest tint is a grey-brown wash: grey clouds, mustard sun. | all | `harvest-393-b` | **B:** cool tint `rgba(58,72,134,.18)` by day (night keeps `--scrim`). |
| F4 | Minor | Harvest confetti falls across the card's numbers (¥3,700, ¥1,480). | 320 | `harvest-320` | **A:** confetti behind the card, or only in the band above it, ≤ 1.2s. |
| F5 | Minor | Two dialogue styles: the NH box on 島, the old tailed bubble with Isabelle on the harvest. | all | `harvest-393-b` vs `island-noon-375` | **B:** the harvest uses the same box. |
| F6 | Minor | Two jars: plain yellow block on the Jar page, coins and leaf on the island. | all | `jar-noon-dark-320` vs `island-noon-375` | **A:** one jar symbol in `Sprites.svelte`, used in both places. |
| F7 | Minor | The payday banner is a full-width yuzu bar, louder than the hero and button-like. | all | `jar-noon-dark-320` | **B:** a cream NH banner with a small bells icon. |
| F8 | Minor | はい and いいえ look identical; NH shows a ▶ cursor on the first option. | all | `island-noon-dark-393` | **B:** yuzu ▶ cursor on はい; keep the cream bubbles. |
| F9 | Nit | Lip is 3px on the ribbon and plate, 4px elsewhere. | all | computed styles | **B/A:** use 4px everywhere, or set a `--lip-h` token. |
| F10 | Nit | The band under the island is plain mint with no ▲ marks, so the sea seems to stop. | 393, 375 | `island-noon-dark-393` | **A/B:** continue the pattern into the chrome band. |
| F11 | Nit | The 320 clock keeps the date (the spec said time only). It fits, so I accept it and will update the spec. | 320 | `island-noon-320` | none |

## (a) The empty sky band at 393

**Recommendation: raise the horizon, not the island, and add nothing.** Cap the sky at `ribbon bottom + 88px` (≈ 180px, about 21% of the height) and give the rest to the flat sea, with ▲ marks and the islet. The island stays anchored to the bottom (that anchoring also fixes F1).

Keeping the gap reads as unfinished. Raising the island crowds the ribbon. Filling the sky brings back the clutter. More patterned sea is the NH-map look.

## (b) Token aliases to migrate (`tokens.css` alias block)

| Alias | Readers | Action |
|---|---|---|
| `--c-bubble`, `--c-pill-edge`, `--c-ink-talk`, `--c-leaf-soft`, `--c-leaf-ink`, `--tag-apricot`, `--tag-plum` | none (grep) | Delete now. |
| `--fs-h2` | `routes/dev/characters/+page.svelte` | → `--fs-talk`, then delete. |
| `--sh-ground` | `Villager.svelte` (also rendered outside `.if-scene` in Avatar, Toast, HarvestOverlay, ShimaPhone), `island/Ground.svelte` | Promote to the depth section as the official "ground ellipse" token, and drop the duplicate in `.if-scene`. |
| `--plate`, `--plate-lip`, `--plate-ink` (scene block, hex) | IslandScene | → `var(--c-cream)` / `var(--c-lip)` / `var(--c-ink)`, keeping only the night override. |
| Hex fallbacks `var(--c-yuzu, #FFD84D)`, `--c-yuzu-lip`, `--c-leaf-lip`, `--plate*` | `island/FruitTree.svelte`, `island/IslandScene.svelte` | Remove the fallbacks, since the tokens are global. |
| `--jar-leaf:#6ED07A`, scene `--sea:#7BD7C1` | scene block | → `var(--c-leaf)` and `var(--c-mint)`. |
| `--sea-flat` (`:root[data-tod]`) and scene `--sea` (`.if-scene[data-tod]`) | B chrome / A scene | One table: the scene reads `--sea-flat`, so tod sea colours are defined once. |

## (c) しずえ on sync errors

**I agree, with conditions.** Being offline or out of date is a lasting *system state*, and the HUD chip under the clock is the right weight. Putting it in しずえ's box would take the one dialogue slot from a pending question or harvest news, and it would make her nag. My conditions:

1. The chip must be **tappable to retry**, and say so ("オフライン · タップで再接続").
2. A **failed save** (possible data loss) still gets one NH banner. My villager also plays the sheepish R17 (the old `emit('sync-error')`), so the event is felt without words from しずえ.
3. Update the spec (v5 §3 listed "sync error" as a しずえ trigger).

## Sign-off

**Approved with fixes.** v5 meets the brief: the chrome follows the sky, there is one focal point, there is one flat illustration style, and the app is navigable without the tab bar. **F1–F3 must be fixed** before v5 is called done (A: bottom-anchored stage + raised horizon; B: fixed chrome slot + harvest tint). F4–F10 and the (b) migration go into the next polish round. I will re-check F1–F3 at all three viewports.

UI/UX lead, 2026-10-29
