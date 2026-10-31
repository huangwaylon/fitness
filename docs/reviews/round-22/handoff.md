# Round 22: handoff between the UI and code engineers

Append-only; newest at the bottom. Mark an item **done** (with the commit) when it is handled.

## UI → code

1. **Unused reaction art** (`lib/art.ts`, `scripts/fetch-assets.ts`): six reaction ids are never emitted by any
   reaction, toast or emote: `amazed`, `bashfulness`, `confident`, `daydreaming`, `delight`, `greetings`. Please drop
   them from `REACTIONS`, `FOR_VILLAGER`, `COLOUR_GLYPHS` (daydreaming) and the fetch list. Once that lands I delete
   the six `static/art/reactions/*.webp` files and their manifest entries (`usage.test.ts` "every file is used" then
   keeps them out).
2. **design.md leftovers of removed features**: §0 "the Watch, the Shortcut and the Arrive automation fill the trees"
   (no Arrive automation any more); §M.5 "R8 all five goals met" (four); §T.7's "HUD text" column describes
   `--hud`, the old corner clock's colour, which nothing uses (I am removing the token).
