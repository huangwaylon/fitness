# 英語すごろく

A board game for 2–4 people at one table, passed round one phone: spin, move along a route through the island, and
do the English the space asks for. For A1–A2 learners; never "incorrect". English Study's third tab, すごろく (its own
chunk, loaded on the tab; the tab bar shows on its menu only). Code: `app/src/lib/sugoroku/` (pure rules beside their tests, the sheet in `components/`, strings in
`i18n.ts`). No ベル; かいがら for playing (below). Players are their own characters (the island's look): the one sheet
with characters in it, since they are the pieces. A team game: one team total toward a goal, never a ranking.

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
- **The board** (`board.ts`, `layout.ts`): a new one every game, generated from the game's layout seed (kept in the
  game, `layout`: a reload and every phone build the same one). A **family** (くねくね rows, ジグザグ legs, なみ waves,
  わっか a loop round a pond, 十字路 lanes with a crossing where you may swap, みつまた three small forks), 1–3 **forks**
  (split lanes either side, a corner cut short or gone round, a crossroads; joining early or late; the short way's
  stones richer: ×2, 絵 or イベント, the long way's steadier), 4–7 stretches (家 first, 浜辺's あがり last; 広場 川 博物館
  お店 飛行場 森 丘 駅 公園 in a new order), mirrored half the time. Rules (`problems`, tested over 240 seeds): every route
  37–45 steps (about 11 rounds), at most 6 apart, its play (ことば 1, ダブル 1.7, 絵 1.3, ぶん 1.2, イベント 1.1) within
  12 % of the richest route's, each kind's count per route in a band, no 4 ことば in a row, ×2 / 絵 / イベント 3 apart
  and ぶん 2; stones apart, links 40–100 (a crossing's 150), nothing on another's link, links crossing only at a
  crossroads, the river under one bridge link (two bridges at most), signs, the house and trees off the route, no
  more scenery than the classic (6 signs, 22 trees, one house). A layout breaking one is tried again with the next
  sub-seed. A fork's buttons read its ways: 「森の近道」 / 「広場の遠回り」, steps and what's on it (「4マス・ダブル2」);
  each way's sign in 3D says 近道 / 遠回り and its steps. Two games in a row are of different families (local: the
  last game's; online: the last id's). A game without a layout (a save or online game from before) plays the
  **classic** board: 47 stones, one fork after 広場 (川の近道 4 / 博物館の遠回り 7). A tall map: the board is a window
  onto it that follows whose turn it is (and scrolls by hand), full-bleed under the play screen's overlays like the 3D
  board (its fallback).
- **A turn** (`game.ts`, a pure reducer seeded by the game's seed and step count, every step moving it on): roll 1–6
  and walk; each fork stops the walk for its choice (`ways`: the way taken at each). The table kept together (`rollMode`): the one 6+ steps behind
  whoever's furthest on rolls two dice and keeps the higher; the one 6+ steps ahead of whoever's
  furthest back rolls two and keeps the lower. The stone:
  - **ことば**: make a word from your 8 tiles (tap to place, tap to take back). Points (`tiles.ts scoreOf`) = letters
    (1 for E A I O N R T L S U, 2 D G B C M P, 3 F H V W Y, 4 K, 5 J X Z: a short word with a rare letter ties a long one)
    + 2 for each of the game's two lucky letters, × 2 on ダブル, + the level's everyday bonus, at least 3, said in words.
    ヒント fills in the rack's best everyday word (sticks for the turn). 入れかえる swaps the rack for no stars. Not a word:
    a soft note, the tiles kept.
  - **ぶん**: put a line's word tiles in order: 6 stars, 4 after 「おしい！」 (the wrong order shown a moment), 2 with
    「答えはこれ」. No line left for the level (or offline): the stone plays as ことば.
  - **絵** (`pictures.ts`): an everyday thing's picture (Google's Noto Emoji, Apache 2.0, hotlinked from its CDN: the CSP
    allows that path only; `pictures.json`, 706 things one emoji shows, our Japanese, no signs), a tier by the seat's level (TIERS:
    260 everyday, 242 B1, 204 B2+ such as hedgehog or stethoscope; names up to 12 letters), its English to spell by the level: 5 stars, 3 after 「おしい！」, 2 with
    「答えはこれ」 (each once a game).
  - **イベント** (`cards.ts`): an A1 card (English, its key word marked, then Japanese; a villager's head when one says
    it), its effect as a chip: good or neutral only; a move walks on like a roll (letters picked up, the fork asks) and the stone it lands on is
    played in the same turn (an イベント there plays as ことば: no chain). The lucky letters are common consonants (D G H L M N P R S T), so racks hold them.
  - **あがり**: +4 for the team, whoever's home first. The game ends with the round someone got home in (equal turns), after
    `MAX_ROUNDS` (16, 14 by seats), or 終了.
- **Results** (a team game: never a ranking or a winner): おつかれさま, the team's stars against its goal (`teamGoal`:
  45/60/65 a seat by the length; 「前回より…」 only when beaten), each one's good thing (their longest word, pictures, lines),
  **みんなで覚えたことば**, and the かいがら: a game played (someone home, or 3 rounds) pays everyone at the table 500 (750
  with the goal) once (`rewardOf`; the record's `sg_reward`: one game pays each of us once, whichever phone sends it; no
  daily cap) (up to five of the game's things with Japanese, each Japanese once, to match
  English ↔ Japanese; a mismatch just lets go), and 今日のことば.

## The 3D board

`components/sugoroku3d/` (engine.ts `createBoard3D(canvas, board)`, the pure part in plan.ts): the game's board as a minimal island (one
mesh of vertex colours, one of water, one atlas of marks and signs: three draws whatever the layout; built once a game): a few flat low-poly
shapes (grass, the river with its bridges, the beach and sea, a few trees, the sandy path), the stones in their kind's
colours with their marks, signs, at 1.5× pixels (an iPhone's memory: the island-model version, 2026-11-18, was too heavy), the players as their own characters (person3d) hopping stone to stone, a pip die tumbling onto its face, a 3/4
camera following whose turn it is; a celebration never sad (joy, a small hop, a wave). Drawn only while something
moves; pawns and no draws in logic mode. Previewed at /dev/sugoroku3d (dev only; `?layout=<seed>` a generated board).

A game plays on its **own screen**, `/sugoroku` (`?m=local` this phone's, `?m=online` the shared one; the page's query
kept), like the museum: the island isn't drawn meanwhile (one WebGL context on the phone). Starting or resuming in the
tab goes there; ‹ goes back to the island with English Study open on the tab; a reload there resumes the game. The
board (`Board3D.svelte`) covers the whole screen and is never resized by a phase: the heads hop a stone at a time (260
ms), the die tumbles before the move, a ★ 6+ or あがり gets a jump of joy (else a hop). No WebGL: the 2D map in its place.

**The play screen** (iPhone 15's 393 × 659 the target): over the board, a top overlay (the NavBar on a clear ground: ‹,
⋯ then ✕, the team's ★ pill in the title's place; under it the players' chips, whose turn yuzu, their pocket letters)
and the turn's bottom sheet (cream, its content's height up to what leaves the board 160 px, then it scrolls; its action
the last row, full width). The engine frames only the part between (`setInsets`: `setViewOffset` on the visible part,
plan.ts `visibleOf` / `cameraFor`): whose turn it is in the lower third with the stones ahead, x kept to the land (only
the beach at the sides), the horizon never shown (the bottom inset given back first); a fork's choice aims between the
ways. Two exceptions to design.md's kit, for the board's room: the team pill in the title bar's place, and this
sheet's handle (a tap or a drag down) folding it to a 56 px bar (the phase ▲) to see the board; every new phase
opens it again; a walk shows the die and 「3マス」 in that bar. A check's note is a toast pill over the sheet. ⋯ holds 遊び方
and 終了する (「ゲームを終了しますか？」 [キャンセル][終了する]); ↻入れかえ asks inline (「星なしで入れかえる？」).

## Speaking

**Off** (`game.ts SPEAK = false`) until the real-phone checks pass; `?speak=1` turns it on for a page (the tests, a
trial). Off, the game is exactly as before. The design and its evidence: /tmp/grade/plan.md; the relay's `POST /grade`:
relay/src/gradeRoute.ts.

- **Where:** after a 絵 turn's answer, before 次へ: 「この絵で一文言ってみよう」 (+2), optional, 次へ skips it at no
  cost. やさしい sees two frames (I like ___. / There is a ___.), むずかしい a nudge for 6+ words (shorter: the stars and
  「次は6語以上にも…」).
- **Who:** /stt and /grade take a person's key only, so the step shows on a phone with one (not the guest's: on the
  guest's own phone there's no step). Passed round, everyone speaks on this phone's key (its daily caps). The mic is asked
  for only on 話す.
- **Flow** (`app/src/lib/sugoroku/components/SpeakStep.svelte`, its own chunk: PictureTurn imports it only with the switch on): 話す (tap to
  record, tap to stop, 10 s at most: lib/speech/stt.ts) or 書く → **聞こえた文**, editable, これでOK; もう一回 twice,
  then the keyboard → the feedback. Whisper's words on silence (empty, "Thanks for watching!", "Thank you.", mostly not
  Latin) → 「もう一回どうぞ」, not graded.
- **Task check** (`speak.ts`, on the phone): the picture's word in any form, a word a small edit away credited
  (boring → bowling), or the relay's `used`; missing → 「「apple」を入れて言ってみてね」, no stars yet. A bare noun phrase
  ("a red apple") → 「動詞を入れて文にしてみよう」; casual sentences ("So tired today.") pass.
- **No visible wait:** /grade is asked as soon as the words arrive (again only if edited). これでOK gives the stars at once
  and the sentence shimmers; the recast slides in, or praise only once 4 s have passed since it was asked for (the relay's
  slow tail: p90 ~7 s), or offline, capped, off; a later answer is let go, never swapped in. Never 判定 or 採点.
- **Feedback:** their sentence (changed words a soft yuzu underline); 「こう言うともっと自然」 and the recast (changed words
  bold) when it differs; the tip folded under ヒント, opening by itself at most once in three sentences a player a game
  (やさしい: no tip when only an article or an -s changed); a great sentence: a cheer of the phone's, a few in turn,
  and its `also` as 「こんな言い方も」. The phone
  checks the answer again (`cleanGrade`: failure words and grammar terms drop the tip, a placeholder fix keeps theirs).
  まねして言ってみる after a recast: +1 「言い直せた！」.
- **Stars:** +2 an on-task sentence, +1 said again (3 at most: `game.ts pictureDone(g, misses, said)`); the verdict never
  changes them. Online, the `pic` move carries only them (`y`); the words stay on the speaker's phone.
- **Logged:** `sg.grade` once a step used (the deciding layer, the verdict, stop → feedback ms, takes, edited, said
  again, why not), never the text.

## Online

新しいゲーム's **それぞれのスマホで**: each player on their own phone (me among them). A game is its moves (`contract/live-protocol.ts` SgIntent `sg`: game id `g`, index `i`, the move
`a` and its few fields, ≤ 256 bytes; a game id of 10 letters is its board's layout seed, an older 6–8 the classic board), sent to the relay and kept in the day's ring, so a phone that opens later or
reloads gets them again (its own too); each phone also keeps them (`DEVICE.sugorokuOnline`). Every phone folds them in
order through the same pure rules (`online.ts` foldMoves; the words and lines must be in: an everyday word's bonus and a
ぶん's line are the fold's), so all show the same game. A move counts only from whose turn it is (the start, and 終了 from
anyone at the table); out of order, it waits for the gap. The phone whose turn it isn't watches (whose turn, the last
move). A game started with me in it comes as an invitation, wherever the phone is (the island, any sheet, other
screens, the museum; listening starts with the app, `routes/+layout.svelte`): a banner with the starter's head,
「Xが英語すごろくを始めました」 [参加] ✕ (`sugoroku/components/InviteBanner.svelte`, placed with the toasts by
ToastHost: in the open sheet's dialog when there is one). It stays till 参加 (straight into `/sugoroku?m=online`) or ✕,
each remembered by game id on the phone (`DEVICE.sugorokuAnswered`); never on that game's own screen. One at a time, the
latest game's. Not for my own start, a phone not seated, a game over (an 終了 or the fold's end) or one whose last move
is over 30 min old (a start replayed from the day's ring): `online.ts` invited. すごろく's tab menu puts the running game
first, 「Xが始めたゲーム」 [参加]. In-app only: no Web Push. No relay code: the room relays and
keeps any parsed kept intent; after a contract change the relay deploys first.

## Letters

About 10 ことば stones hold a letter (`game.ts` letters: scoring letters, a rare one now and then); whoever walks over
one (or lands on it) picks it up into their **pocket** (3 at most): extra tiles any word may use (`tilesFor`: the rack's
first, then the pocket's). At the start of my turn I may send a pocket letter as an **おくりもの** (`giveLetter`) to
someone on the way who has none waiting (whoever's furthest back offered first): their next word must use it, +3 for
the team; a swap clears it (never a penalty), and their ヒント finds a word with it. Online: the `gift` move.

## Tiles

`tiles.ts`: Scrabble's spread without Q (no Q for a beginner), the vowels richer. A rack is 8 tiles, drawn round a seed
(`seeds.json`, `npm run sugoroku:words`): a common word of 5–8 letters the bag can spell (lengths 5 and 6 likeliest, 8
least; an everyday word 6 times in 10), its missing letters taken from the bag, the rest as they come, shuffled; so every
rack holds a real 5–8 letter word (and the shorter ones in it). No seed fits (a short bag): a friendly draw (2–4
vowels) as before.

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
(misses, ヒント, 意味を見る) are in the save. A save of another shape (`v`) or structure (`CONTENT`: the classic stones' kinds and
links, the cards' effects, the pictures' sets; never the copy) or a layout key of another generator (`GEN`) reads as
none, as does a corrupt one; one from before layouts (a player's one `branch`) loads as the classic board.
