# Animal Crossing: New Horizons style notes

Reference notes behind the look in [design.md](design.md). Since ADR [0018](../decisions/0018-official-art-public-site.md)
the app uses official NH renders for characters, trees, fruit and phone tiles, so these notes matter for what we still
draw ourselves (scenery, chrome, effects) and for matching it to the renders. Reference images live in `.refs/`
(git-ignored).

## Sources

- Villagers and moods: https://nookipedia.com/wiki/Villager · NookPhone: https://nookipedia.com/wiki/NookPhone ·
  dialogue: https://nookipedia.com/wiki/Isabelle/Gallery · reactions: https://nookipedia.com/wiki/Reaction
- Art direction: https://en.wikipedia.org/wiki/Animal_Crossing:_New_Horizons (Koji Takahashi: the "trigger of play",
  the "imagination gap", checkerboard grass, the curved world)
- The Nookipedia MediaWiki API (`action=parse&prop=images` on the Reaction, Tree, Bush, NookPhone and Weather pages)
  for the official files `scripts/fetch-assets.ts` downloads.

## UI language

| Element | Observed in NH | Ours |
|---|---|---|
| Phone | A cream slab with big corner radii, a status row, the app's title, a **3-column grid of squircle tiles** | 「しまフォン」, same anatomy, official tiles and glyphs on our colours |
| App icons | A bright squircle with a flat dark-brown glyph, no outline, no gradient | The recipe for our own tiles (サウンド) |
| Dialogue | A wide cream blob with wavy edges, no border; a tilted colour-coded name tag; bold rounded brown-grey text; an amber ▼ when more follows; letter-by-letter reveal | `Bubble.svelte` |
| Buttons | Cream pills with a light drop lip | Chunky pills with a lip and a squash on press |
| Reactions | Icons pop in above the head with overshoot, hold, fade | Emotes and marks (design.md §M.3) |
| Seasons | Grass hue shifts, blossoms, falling leaves, snow, a real-time sky | `data-season` + `data-tod` |
| Cursor | A white gloved pointing hand | Not used (identifiable; pointless on touch) |

Also adopted: one tappable invitation per screen ("trigger of play") and sparse detail ("imagination gap"), which suit
the word budget. Mood is positive only: no sad or angry states.

## Official art findings

- **Reactions:** 44+ reaction-wheel icons (`Emotion_<Name>_NH_Icon.png`, a grey cat face with coloured accents) and pose
  icons (`<Name>_NH_Reaction_Icon.png`). Villagers emote with a bubble and a small hop, turn or laugh; the game has no
  separate bubble art, so the bubble is ours, and villagers get our marks instead of the player's cat faces.
- **Trees:** the hardwood has four seasonal renders (`Oak_Tree_NH_Spring` = blossom, summer, `_Fall`, `_Winter`). Fruit
  trees share its silhouette. Bushes exist only as 128 px inventory icons (azalea, hydrangea, hibiscus, tea olive,
  camellia, holly).
- **Sky:** sunny skies are saturated blue (≈ `#3FA9F5` at the top) with flat-bottomed soft cumulus and lavender-blue
  undersides; snowy skies pale lilac-grey. No cloud, sky, sea or ground art exists (Nookipedia's are screenshots), so we
  paint them.
- **Nook Miles+:** a periwinkle background, a wavy cream header, pastel scalloped cards, round date stamps, a navy
  counter pill: the model for きろく's cards.
- **Phone:** bare glyphs (`Menu_*_NH_Icon.png`, 180 px) drawn on coloured squircles, plus a few full tiles
  (`NookPhone_*_NH_Icon.png`, 92 px).

## Typography

NH uses commercial Fontworks rounded families (fans cite FOT-Seurat and FOT-Rodin / Humming), so we ship none. The
traits that matter: rounded terminals, a generous x-height, heavy headings, warm brown text. **Zen Maru Gothic** (OFL)
is the UI and Japanese face; **Fredoka** (OFL) the numbers. A second CJK face would cost megabytes of cache.
