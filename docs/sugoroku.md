# 英語すごろく

A board game for 2–4 people at one table, passed round one phone: spin, move along a route through the island, and
do the English the space asks for. For A1–A2 learners; never "incorrect". The leaf menu's すごろく pill (under 英語)
opens it. Code: `app/src/lib/sugoroku/` (pure rules beside their tests, the sheet in `components/`, strings in
`i18n.ts`). No relay, no record, no ベル: the stars are the game's own. Players wear their heads (the members', the
guest's, or a villager friend's): the one sheet with characters in it, since they are the pieces.

## Rules

- **Seats** (だれが遊ぶ？): 2–4 of the members, the guest and eight villager friends (しずえ, たぬきち…), turns in the order picked.
- **The board** (`board.ts`): 24 spaces in a 5-wide snake, from 家 through 広場, 博物館, お店, 飛行場 to 海's ゴール:
  ことば 11, ことば×2 3, ぶん 4, イベント 4 (`ROUTE`).
- **A turn** (`game.ts`, a pure reducer seeded by the game's seed and step count): spin 1–6 and move; the last in
  stars (2+ behind everyone) spins twice and keeps the better (the catch-up). The space:
  - **ことば**: make a word from your 7 tiles (tap to place, tap to take back). Points (`tiles.ts scoreOf`) = letters
    (1 for E A I O N R T L S U, 2 D G B C M P, 3 F H V W Y, 4 K, 5 J X Z: a short word with a rare letter ties a long one)
    + 2 for each of the game's two lucky letters, × the space's 2, + 2 for an everyday word, at least 3. ヒント fills in
    the rack's best everyday word for half. 交換 swaps the rack for no stars. Not a word: a soft note, the tiles kept.
  - **ぶん**: put a line's word tiles in order, its Japanese the clue: 6 stars, 4 after 「おしい！」, 2 with 「答えはこれ」.
  - **イベント** (`cards.ts`): an A1 card (English, its key word marked, then Japanese): good or neutral only.
  - **ゴール**: +6, +3, +1 by order home. The game ends with the round someone got home in (equal turns), or 終了.
- **Results**: the ranking and 今日のことば, every word and line made with its Japanese.

## Tiles

`tiles.ts`: Scrabble's spread without Q (no Q for a beginner), the vowels richer. A rack is drawn friendly when it can
be (2–4 vowels, one of S T R N D, at most one of J K X Z, at most two of a letter): a dozen tries, then as drawn.

## Words

`words.txt`: the words heard in 3+ of English Study's transcripts, 2–8 letters, that macOS's dictionary knows (its
base words and simple inflections), minus names and a short list of words not for the table; plus `everyday.json`,
~1,700 A1–A2 words with a short Japanese gloss (drafted, to be read by a Japanese speaker). `sentences.json`: the
フレーズ deck's `use` lines of 3–6 words with their Japanese. All three are written by `npm run sugoroku:words` (it
needs /usr/share/dict, so on a Mac) and committed; each is its own chunk, loaded as the sheet opens (precached:
a game night works offline).

## Saving

The game is saved on the phone after every step (`save.ts`, `DEVICE.sugoroku`): ‹ or ✕ mid-game leaves it to
続きから; a finished one is cleared. One game a phone.
