# 英語すごろく

A board game for 2–4 people at one table, passed round one phone: spin, move along a route through the island, and
do the English the space asks for. For A1–A2 learners; never "incorrect". English Study's third tab, すごろく (its own
chunk, loaded on the tab; the tab bar shows on its menu only). Code: `app/src/lib/sugoroku/` (pure rules beside their tests, the sheet in `components/`, strings in
`i18n.ts`). No ベル: the stars are the game's own. Players are their own characters (the island's look): the one sheet
with characters in it, since they are the pieces.

## Rules

- **Seats** (だれが遊ぶ？): 2–3 of us (the members and the guest), each as their own character (the island's look),
  turns in the order picked, each an English **level** (`game.ts LEVEL`): what its spaces ask, not what they pay, so a
  mixed table stays close. A **length**: みじかい (by round 7), ふつう (the round someone's home), ながい (everyone home, 20 rounds at most).

  | | やさしい | ふつう | むずかしい |
  |---|---|---|---|
  | shortest word | 3 | 3 | 4 |
  | everyday word | +3 | +2 | +1 |
  | ヒント's word | full | half | half |
  | ぶん's lines | level 1 | level 2 | level 3, the Japanese behind 意味を見る (+2 unopened) |
  | 絵 | one of three spellings | its letters, the first given | its letters and two more |
  | イベント's Japanese | shown | shown | on a tap |
- **The board** (`board.ts`): 47 stones on a drawn island (grass, river, beach, sea; signs for 家 広場 川 博物館 お店 飛行場
  浜辺), ふりだし to あがり, one **fork** after 広場: 川の近道 (4 stones) or 博物館の遠回り (7: two 絵, two イベント): 39 or 42
  steps, about 11 rounds. A tall map: the board is a window onto it that follows whose turn it is (and scrolls by hand),
  smaller during a turn's English so its controls stay on screen.
- **A turn** (`game.ts`, a pure reducer seeded by the game's seed and step count, every step moving it on): roll 1–6
  and walk; the fork stops the walk for the choice. The last in stars (2+ behind everyone) rolls two dice and keeps the
  better (the catch-up). The stone:
  - **ことば**: make a word from your 7 tiles (tap to place, tap to take back). Points (`tiles.ts scoreOf`) = letters
    (1 for E A I O N R T L S U, 2 D G B C M P, 3 F H V W Y, 4 K, 5 J X Z: a short word with a rare letter ties a long one)
    + 2 for each of the game's two lucky letters, × 2 on ダブル, + the level's everyday bonus, at least 3, said in words.
    ヒント fills in the rack's best everyday word (sticks for the turn). 入れかえる swaps the rack for no stars. Not a word:
    a soft note, the tiles kept.
  - **ぶん**: put a line's word tiles in order: 6 stars, 4 after 「おしい！」 (the wrong order shown a moment), 2 with
    「答えはこれ」. No line left for the level (or offline): the stone plays as ことば.
  - **絵** (`pictures.ts`): an NH item's picture (the app's art: 41 bugs, sea things, farm finds, fruit, treats), its
    Japanese, its English to spell by the level: 5 stars, 3 after 「おしい！」, 2 with 「答えはこれ」 (each once a game).
  - **イベント** (`cards.ts`): an A1 card (English, its key word marked, then Japanese; a villager's head when one says
    it), its effect as a chip: good or neutral only; a move stops at the fork. The lucky letters are common consonants (D G H L M N P R S T), so racks hold them.
  - **あがり**: +6, +3, +1 by order home. The game ends with the round someone got home in (equal turns), after
    `MAX_ROUNDS` (16, 14 by seats), or 終了.
- **Results**: the ranking, **ふりかえり** (up to five of the game's things with Japanese, each Japanese once, to match
  English ↔ Japanese; a mismatch just lets go), and 今日のことば.

## The 3D board

`components/sugoroku3d/` (engine.ts `createBoard3D`, the pure parts in plan.ts): the board as a 3D island (grass, the
river with bridges at the fork, the beach and sea, the sandy path, the stones coloured by kind with their marks, signs,
trees), the players as their own characters (person3d) hopping stone to stone, a pip die tumbling onto its face, a 3/4
camera following whose turn it is; a celebration never sad (joy, a small hop, a wave). Drawn only while something
moves; pawns and no draws in logic mode. Previewed at /dev/sugoroku3d (dev only). Not in the game yet: it's to be its
own screen like the museum (one WebGL context on the phone).

## Online

新しいゲーム's **それぞれのスマホで**: each player on their own phone (me among them). A game is its moves (`contract/live-protocol.ts` SgIntent `sg`: game id `g`, index `i`, the move
`a` and its few fields, ≤ 256 bytes), sent to the relay and kept in the day's ring, so a phone that opens later or
reloads gets them again (its own too); each phone also keeps them (`DEVICE.sugorokuOnline`). Every phone folds them in
order through the same pure rules (`online.ts` foldMoves; the words and lines must be in: an everyday word's bonus and a
ぶん's line are the fold's), so all show the same game. A move counts only from whose turn it is (the start, and 終了 from
anyone at the table); out of order, it waits for the gap. The phone whose turn it isn't watches (whose turn, the last
move). A game started with me in it comes as a banner, 「Xが英語すごろくを始めました」 with 参加, straight into it; the
menu's みんなのゲームに戻る while it lasts. Listening starts with the island (Hud). No relay code: the room relays and
keeps any parsed kept intent; after a contract change the relay deploys first.

## Tiles

`tiles.ts`: Scrabble's spread without Q (no Q for a beginner), the vowels richer. A rack is drawn friendly when it can
be (2–4 vowels, one of S T R N D, at most one of J K X Z, at most two of a letter): a dozen tries, then as drawn.

## Words

Curated by cross-reference (`scripts/sugoroku-wordlist.py`, then `SUGOROKU_LISTS=… npm run sugoroku:words`):

- `accept.txt`: what a word may be: real and actually used, 2–8 letters (~47,500, prefix-delta coded). An ENABLE word
  (public domain) in SCOWL ≤ 60, or of 4+ letters with a wordfreq Zipf ≥ 2.5 or in 2 of 3 open frequency sources
  (wordfreq, Norvig's counts, NGSL's ranks); SCOWL's own forms of those (mingled from mingle); the learner lists, months
  and days, modern words in SCOWL ≤ 50 (email, selfie), a few loanwords a Japanese table uses (bento, matcha, wifi);
  minus SCOWL's vulgar and offensive flags and a block list of slurs. Scrabble-only words (aa, qat, zax) don't count;
  2–3 letter words need SCOWL ≤ 60 (frequency alone takes abbreviations).
- `words.txt`: the common words (~9,000): NGSL 1.01, NGSL-Spoken 1.2, CEFR-J 1.5 A1–B1 and everyday.json, with their
  forms; plus Zipf ≥ 4 words that aren't names. The hints draw from it.
- `everyday.json`: ~1,700 A1–A2 words with a short Japanese gloss (drafted, then read by a Japanese speaker): the
  everyday bonus and the meaning card.
- `sentences.json`: the フレーズ deck's `use` lines of 3–6 words with their Japanese and a level, an ESL teacher's and a
  Japanese reader's fixes from `line-overrides.json` (0 drops a line; a line the deck adds later gets a guess: ≤ 4
  everyday words 1, ≤ 5 and 80 % 2, else 3).

Each is its own chunk, loaded with the tab (precached: a game night works offline). Credits: SCOWL (Kevin Atkinson,
MIT-like), wordfreq data (Robyn Speer, CC BY-SA 4.0), NGSL and NGSL-Spoken (Browne, Culligan & Phillips, CC BY-SA 4.0),
CEFR-J (Tono Lab, free with citation), Norvig's count_1w (MIT); the derived lists are shared under CC BY-SA 4.0 as they
must be.

## Saving

The game is saved on the phone after every step (`save.ts`, `DEVICE.sugoroku`): ‹ or ✕ mid-game leaves it to
続きから; a finished one is cleared. One game a phone. A turn's tries
(misses, ヒント, 意味を見る) are in the save. A save of another shape (`v`) or structure (`CONTENT`: the stones' kinds and
links, the cards' effects, the pictures' sets; never the copy) reads as none, as does a corrupt one.
