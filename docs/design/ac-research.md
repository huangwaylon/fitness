# Animal Crossing: New Horizons style research (for the v2 revamp)

Owner: UI/UX Designer · 2026-10-28 · Feeds [style-guide.md](style-guide.md) v2

Reference images live in the repo root at `.refs/`. It is git-ignored, so nothing Nintendo-owned ships. **Rule: we study the traits and draw everything ourselves.**

## Sources

- Villager list and moods: https://nookipedia.com/wiki/Villager. Group art: `.refs/group-artwork-nh.png`
- Official villager art (Bob, Goldie, Bunnie, Stitches, Hamlet, Molly, Lily, Dom, Marshal, Judy) via Nookipedia/dodo.ac: `.refs/villager-*.png`
- Phone UI: https://nookipedia.com/wiki/NookPhone. `.refs/phone-interface.png`, `.refs/phone-in-use.jpg`, `.refs/icon-map.png`, `.refs/icon-camera.png`
- Dialogue box: https://nookipedia.com/wiki/Isabelle/Gallery. `.refs/dialogue-a.jpg`, `.refs/dialogue-b.jpg`
- Reactions: https://nookipedia.com/wiki/Reaction. `.refs/reaction-*.png`
- Art direction: https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons (Koji Takahashi: "trigger of play", the "imagination gap", checkerboard grass, the curved 45° world)
- Fonts: Fontworks catalogue, https://ja.wikipedia.org/wiki/フォントワークス

## 1. Character design: what we observed

| Trait | Observation | Adopt? |
|---|---|---|
| Proportion | The head is about 45–50% of total height and 1.6–2× as wide as the torso, so head:body ≈ 1:1 to 1.2:1 | **Yes.** Shared body, head 64u : body+legs 50u |
| Body | A short tapered "bell" torso that is mostly shirt. Arms are nubs with no fingers; legs are two short stumps | **Yes.** The shirt is a colour slot plus a pattern slot |
| Silhouette | Species reads from **ears + muzzle + one marking** only (cat triangles, dog flaps, rabbit tall ears, frog eye-bumps, sheep wool ring, duck bill) | **Yes.** Swappable head features on one head shape |
| Eyes | Huge variety: dot, oval with highlight, ringed, half-lidded "smug", lashes. Set wide (spacing ≈ 40% of head width), around mid-height | **Yes.** 7 eye variants, same anchors for every species |
| Blush | Round or oval cheek patches on almost everyone (Lily, Dom, Molly, Bunnie) | **Yes.** Always on, scaled per species |
| Mouth | Small. The open mouth is a dark D-shape with a pink tongue (Dom, Hamlet). Cats get a "w" | **Yes.** 5 shared mouths |
| Colour | Flat, saturated, one base colour per character plus one marking colour. Unexpected colours are fine (purple cat, pink sheep) | **Yes.** 3 colourways per species, some playful |
| Rendering | Soft 3D fuzz, no outlines | **No.** Flat 2D with warm brown outlines (our scrapbook take; reads at 32px) |
| Mood | Shown with floating manga symbols (♪, !, sweat, Zzz, flowers) above the head and whole-body motion | **Yes, positives only.** No sad or angry states (PROPOSAL §3.8) |

Special characters are never used, even as silhouettes. Juniper (calm capybara, dot gaze, yuzu on her head, host neckerchief) fills the host role.

## 2. UI language

| Element | Observed | Our version |
|---|---|---|
| Phone | A cream slab with huge corner radii (≈ 18% of width), a status row (time, location pin), the title of the focused app above a **3-column grid of squircle tiles**, and page dots | **「しまフォン」**: same anatomy, our own icons. It replaces the "?" sheet (help + settings) |
| App icons | A solid bright squircle with a **flat dark-brown glyph** plus one accent colour. No outline, no gradient. The map icon uses **dashed "stitch" lines** | Tab icons and phone tiles use this recipe exactly |
| Cursor | A white gloved pointing hand | **Avoid** (identifiable; pointless on touch) |
| Dialogue | A **wide cream blob with gently wavy edges** and no border. A **colour-coded name tag**, a tilted pill overlapping the top-left. Bold rounded text in brown-grey (not black). An **amber ▼** bottom-centre that nudges when more text follows. Text types in letter by letter | Adopt all of it. Our name tag is in the speaker's colour |
| Buttons | Cream pills with a darker circle for the controller letter, light drop lip | Chunky pills with a 5px lip and squash on press |
| Counters | A pill with an icon at the left and a bold number | **Leaf-coin** (our coin: ¥ with a sprouting leaf) + `¥146,200` |
| Patterns | Menus over subtle patterns (dots, stripes), checkered grass, paper | ≤ 7% opacity patterns per page |
| Seasons | Grass hue shifts (spring yellow-green, summer deep green, autumn ochre, winter snow), blossoms, falling leaves, snow; real-time sky | `data-season` + `data-tod` tokens |
| Reactions | Small icons pop in above the head with overshoot and hold, then fade | Emote bubbles: ♪ ! z ✦ ♥ |

We also adopt **"trigger of play"** (one tappable invitation per screen) and the **"imagination gap"** (sparse detail, which suits our word budget).

## 3. Typography

The game uses Fontworks rounded families (fans cite **FOT-Seurat** for dialogue and UI and **FOT-Rodin / Humming** for labels; not officially confirmed). All are commercial, so **we ship none**. The traits that matter: rounded terminals, a generous x-height, heavy headings, warm brown text.

| Candidate (OFL) | Verdict |
|---|---|
| **Zen Maru Gothic** (installed) | Closest feel to Seurat: soft maru, and has **900 Black** for headings. **Keep as the UI and Japanese face** |
| **Fredoka** (installed) | Chunky rounded numerals, as on game counters. **Keep for numbers and ¥** |
| M PLUS Rounded 1c · Kosugi Maru · Kiwi Maru · Nunito | A second CJK face costs MBs of cache; single weight / calligraphic / Latin-only. No |

**Decision: no new font packages.** Add the Zen Maru Gothic 900 weight (already in the installed package).

## 4. What we deliberately avoid (IP)

No game characters, sprites, screenshots, icons, sounds, logos, fonts or names (its phone, currency, miles, company, cast) in the repo or UI. No pointing hand, no leaf-logo lookalike (our leaf-coin is a ¥ coin with a sprouting yuzu leaf), no animalese voice. Everything in `app/` is drawn from scratch from the style-guide specs.

## v4 findings (2026-10-29, art director)

Sources: the Nookipedia MediaWiki API (`action=parse&prop=images` on Reaction, Tree, Bush, NookPhone, Weather pages), plus file pages. Reference images are in `.refs/v4/` (gitignored).

- **Reactions.** NH has 44+ reaction-wheel icons named `Emotion_<Name>_NH_Icon.png` (128 px: a grey cat face plus coloured accents such as flowers for Joy and sparkles for Excited). There are also pose reactions named `<Name>_NH_Reaction_Icon.png` (player silhouettes: Viva, Confetti, Stretch…). Villagers emote by popping a bubble over the head with a small hop, turn, or laugh bounce. The game has no separate "emotion bubble" art, so the bubble is ours.
- **Trees.** The hardwood tree has four seasonal renders (`Oak_Tree_NH_Spring` = cherry blossom, `Oak_Tree_NH` summer, `_Fall` red-orange, `_Winter` snow-capped). Fruit trees in NH share the hardwood silhouette, so an oak plus fruit icons reads as a fruit tree. Cedar and palm (with coconuts) have big transparent renders. Bushes exist only as 128 px inventory icons (azalea, hydrangea, hibiscus, tea olive, camellia, holly).
- **Sky.** Sunny NH skies are a saturated blue (≈ `#3FA9F5` at the top) with long, flat-bottomed, soft cumulus clouds that have a lavender-blue underside. Snowy skies are pale lilac-grey. There is no cloud art, so we draw it.
- **UI.** The Nook Miles+ screen uses a periwinkle background, a wavy cream header edge, pastel cards (pink, teal, butter, lime) with a scallop texture, round date stamps, and a navy counter pill with white digits. NookPhone app glyphs (`Menu_*_NH_Icon.png`, 180 px) are bare glyphs that the phone draws on coloured squircles. A few full tiles also exist (`NookPhone_*_NH_Icon.png`, 92 px).
- **Buildings.** Map icons (`Resident_Services_NH_Map_Icon.png`, `Airport_(Blue)_NH_Map_Icon.png`, 320×256) are clean 3/4-view renders, usable as small set pieces.
