# 英語すごろく

A team board game for 2–3 of us, passed round one phone (1台を回して) or each on their own (それぞれのスマホで): roll,
move along a route through the island, and do the English the space asks for. A1–A2 learners; never "incorrect"; one
team total toward a goal, never a ranking. English Study's third tab (its own chunk). Code: `app/src/lib/sugoroku/`
(pure rules beside their tests, screens in `components/`, strings in `i18n.ts`: kanji, one spelling per term). No ベル;
かいがら for playing. Players are their own characters (the island's look): they are the pieces.

## Rules

- **Seats** (だれが遊ぶ？): 2–3 of us (members and the guest), the first seat drawn from the game's seed (`wire.ts
  firstSeat`; e2e: `sgSeed` / `sgId` start with the first picked, or `?sgFirst=<k>`), each an English **level**
  (`game.ts LEVEL`): what its spaces ask, not what they pay. A **length**: 短い (by round 7), 普通 (the round someone's
  home), 長い (everyone home, 20 rounds at most).

  | | やさしい | 普通 | 難しい |
  |---|---|---|---|
  | shortest word | 3 | 3 | 4 |
  | everyday word | +3 | +2 | +1 |
  | ヒント's word | full | half | half |
  | 文's lines | level 1 | level 2 | level 3, the Japanese behind 意味を見る (+2 unopened) |
  | 絵 | one of three spellings | its letters, the first given | its letters and two more |
  | イベント | the key word's Japanese from 3 | from 4 | the gap's English from 4; the card's Japanese on a tap |
- **The board** (`board.ts`, `layout.ts`): generated every game from its layout seed (`layout`: every phone and a reload
  build the same). A **family** (くねくね, ジグザグ, なみ, わっか, 十字路, みつまた; two games in a row differ), 1–3 **forks**
  (the short way's stones richer, the long way's steadier), 4–7 named stretches (家 first, 浜辺's あがり last), mirrored
  half the time. `problems` (tested over 240 seeds): every route 37–45 steps (about 11 rounds), its play within 12 % of
  the richest route's, kinds spread and spaced, links that never cross off a crossroads, one river bridge, scenery as
  light as 6 signs, 22 trees and a house. A failing layout tries the next sub-seed. `layout.test`'s golden hash is tied
  to `GEN` (`family.ts`, 2): change the generator, bump GEN. A fork's buttons read its ways (「森の近道」「4マス・ダブル2」),
  as its 3D signs do. `classic.fixture.ts` (the old hand-drawn board) is the tests' fixed board only. The 2D map (the 3D
  board's fallback): a tall map following whose turn it is, scrollable.
- **A turn** (`game.ts`, a pure reducer seeded by the game's seed and step): roll 1–6 and walk; a fork stops the walk
  for its choice (`ways`). Catch-up dice (`rollMode`): 6+ steps behind the leader rolls two and keeps the higher, 6+
  ahead of the last keeps the lower. The stone:
  - **ことば**: a word from your 8 tiles (tap to place / take back; ⌫ one back). Points (`tiles.ts scoreOf`) = letters (1
    E A I O N R T L S U, 2 D G B C M P, 3 F H V W Y, 4 K, 5 J X Z) + 2 a lucky letter (two a game, common consonants), × 2
    on ダブル, + the everyday bonus, at least 3. ヒント fills in the rack's best everyday word; 入れかえる swaps the rack
    for no stars. Not a word: a soft note, the tiles kept.
  - **文**: a line's word tiles in order: 6 stars, 4 after 「おしい！」, 2 with 「答えはこれ」. No line left (or offline): ことば.
  - **絵** (`pictures.ts`, `pictures.json`: 706 things, Google's Noto Emoji, Apache 2.0, from its CDN: the CSP allows that
    path only): a tier by level (260 everyday, 242 B1, 204 B2+, up to 12 letters); spell its English: 5, 3 after
    「おしい！」, 2 with 「答えはこれ」.
  - **イベント** (`cards.ts`): an A1 card (English with its key word marked, Japanese, a villager's head). 14 of the 20 ask
    about the key word (`quiz.ts`, `EventTurn.svelte`; the levels in the table, the wrong choices another part of
    speech): 3 stars, 2 after 「おしい！」, 1 with 答えはこれ, the word kept with the game's words. The rest move you on
    (a walk like a roll; the stone landed on plays, an イベント as ことば) or roll again, shown as a chip.
  - **あがり**: +4 for the team, first home. The game ends with that round (equal turns), the length's cap
    (`ROUND_CAP`), or 終了.
- **Results** (never a winner): the team's stars against `teamGoal` (45/60/65 a seat by length; 「前回より…」 only when
  beaten), each one's good thing, **みんなで覚えたことば** (match up to five English ↔ Japanese; a mismatch just lets
  go), 今日のことば, and かいがら: a game played (someone home, or 3 rounds) pays everyone 500 (750 with the goal), once
  a game (`rewardOf`, the record's `sg_reward`), no daily cap.

## The 3D board

`board3d/` (engine.ts `createBoard3D`, the pure part in plan.ts): the board as a minimal island, three draws whatever
the layout (one vertex-coloured mesh, water, one atlas of marks and signs), 1.5× pixels, the players as their
characters (person3d) hopping stone to stone (260 ms), a pip die, a 3/4 camera on whose turn it is, a jump of joy for a
6+ or あがり. Drawn only while something moves; pawns and no draws in logic mode. Preview: /dev/sugoroku3d
(`?layout=<seed>`).

A game plays on its **own screen**, `/sugoroku` (`?m=local` / `?m=online`, the page's query kept), the island unloaded
(one WebGL context). ‹ goes back to the island with the tab open; a reload resumes. `Board3D.svelte` watches its
context (`watchContext`, `gl.lost` where `sugoroku`): lost → drawn again once back; not back in 3 s, refused twice or
no WebGL → the 2D map. At its leave it logs `perf.sg` once (first frame and last model ms, moving fps, gap p95 and
>50 ms, draws, pixel ratio, seconds shown).

**The play screen** (iPhone 15's 393 × 659): over the board the NavBar (‹, ⋯, ✕; the team's ★ pill in the title's
place) and the players' pills (level, pocket letters, whose turn yuzu); below, the turn's cream sheet (its content's
height, leaving the board 160 px, then it scrolls; its action the last row). The camera frames the part between
(`setInsets`, plan.ts `visibleOf` / `cameraFor`; never the horizon). Two exceptions to design.md's kit: the team pill in
the title's place, and the sheet's handle folding it to a 56 px bar (every new phase opens it). A check's note is a
toast over the sheet. ⋯ holds 遊び方 and 終了する (passed round 「ここまでの星で結果を見るよ」, online 「全員のゲームが終わるよ」).

## みんなで！ (mini-games)

Logic in `mini/` (pure), screens in `components/mini/`. A ことば stone with the みんなで！ mark (`Space.mini`: a rose top
with two heads), 2–3 a route, 6 apart, not in a route's first 5 or last 3 steps, never a fork or join. The lander
picks one of two (`offer.ts`, seeded, none again till the pool runs out; adding a game changes what a landing deals:
bump RULES). Everyone present plays; the close gives each seat that played its stars (never negative, ≤ 12 a seat),
keeps what was made, marks the stone played (`g.minis`) and ends the lander's turn. Written content (`mini/data/*.json`)
loads lazily with the words (`data.ts`, the `sg` chunks); a deal copies what its rounds use into the state.

Each game is `deal → play → done? → close` (`types.ts`):

| game | file | what |
|---|---|---|
| ことばの市場 | `market.ts` | 9 tiles, 60 s; a word the first finder's, points ÷ 4, 7+ letters +3 |
| 伝えて当てて | `spell.ts` | 3 rounds: one spells a picture, the others tap it among 4 (6 at 難しい); 2, 1 after おしい |
| みんなで一文 | `together.ts`, `hands.ts` | two lines dealt across the seats (the weakest the first word, never a hand in order); 6/4/2 + 2 clean |
| なかま分け | `sort.ts`, `categories.ts` | two bins by level band, 30 s, a count a seat, stars by the level's pace (`race.ts`) |
| しりとり | `chain.ts` | a word from the last letter, 8 tiles (`chainRack`), 10 s a turn, パス, ヒント; 1 a link +1 everyday |
| 数字キャッチ | `numbers.ts` | a number, time or price in words, four to tap with the classic misses; a seeded stream a seat, 30 s |
| おつかい | `shopping.ts` | two rounds: the お客さん builds the English of a Japanese list from chips; the shop fills the basket |
| 返事はどれ？ | `reply.ts` | 4 rounds: a line, each replier's cards, the one that fits; 108 exchanges, 41 from フレーズ |

- **The screen** (`MiniTurn`, in the sheet opened tall): the pick, 3-2-1, one CSS-drained bar (「あと5秒！」), the game,
  then `MiniResults` on every phone till 次へ (the team's stars, each seat's part, never a 0: お休み; read from
  `g.lastMini`). Passed round, private info goes behind a cover (「スマホをBに渡してね」 [見る]): 20 s turns or a step
  each; みんなで一文 and 返事はどれ？ share one phone, each hand in its seat's colour. Timers send the stage's `next`.
- **Online:** the lander's `mg` (option `b`, seats present `s`), then `mp` plays and the `mc` close from any seated
  phone; the room keeps the first of each `i`, so every phone folds the same. One move in flight a phone (`wire.ts`
  Outbox; a lost race goes again at the new end). **The clock** (`clock.ts`): the `mg`'s room stamp (`Move.t`, or when
  this phone first saw it if earlier) + 3 s + the game's length; any phone sends `mc` 1 s after; later plays count for
  nothing. Live frames (≤ 1 a second): the speller's letters, the sort's counts. A closed game's queued plays drop.
- **Log:** `sg.mini` once, at the close (its ms here, the game, the seats, the mode), never a play.
- **Tests** (dev/test hooks): `?sgNew=A2B2` a game on its own screen (`start.ts hookStart`), `?sgMini=<id>[,…]` forces
  the first landings, `?sgMiniMs=<ms>` every length, `__sgMini.end()` the step's clock over now. e2e/sugoroku-mini.spec
  plays each passed round and online (数字キャッチ on three phones through the real room, e2e/liveRoom.ts);
  mini/online.test plays every game to its end.

## Speaking

**Off** (`game.ts SPEAK = false`) until the real-phone checks pass ([speech test](speech-test.md)); `?speak=1` turns it
on for a page.

- **Where:** after a 絵 answer, before 次へ: 「この絵で一文言ってみよう」, optional. やさしい sees two frames (I like ___.),
  難しい a nudge for 6+ words. Only on a phone with a person's key (/stt and /grade refuse the guest's); passed round,
  everyone uses this phone's. The mic is asked for only on 話す.
- **Flow** (`SpeakStep.svelte`, its own chunk): 話す (10 s at most, lib/speech/stt.ts) or 書く → **聞こえた文**, editable,
  これでOK. Whisper's silence words → 「もう一度どうぞ」. The task check (`speak.ts`): the picture's word in some form, a
  verb (a bare noun phrase is nudged).
- **No visible wait:** /grade is asked as the words arrive; これでOK gives the stars at once; the recast slides in, or
  praise only after 4 s (offline, capped, off); a later answer is let go. Never 判定 or 採点.
- **Feedback:** their sentence (changes underlined), 「こう言うともっと自然」 and the recast, the tip folded under ヒント
  (opening itself at most once in three), a great one's `also`. まねして言ってみる: +1. The phone cleans the answer
  again (`contract/grade.ts gradeOf`: scolding words, grammar terms, placeholders dropped).
- **Stars:** +2 on-task, +1 said again (`pictureDone(g, misses, said)`); online the `pic` move carries only them.
- **Logged:** `sg.grade` once a step (layer, verdict, ms, takes), never the text.
- **The relay's `POST /grade`** (relay/src/gradeRoute.ts): `{ s, t }`, a person's key; the wasei list first
  (relay/src/wasei.ts), else Workers AI gemma-4-26b-a4b-it (JSON schema, thinking off; a second identical call after
  2.5 s, the first answer wins); `GRADE_DAY_MAX` 250 a role a day, `GRADE_OFF` 503. Nothing kept.

## Online

それぞれのスマホで: a game is its moves (`contract/live-protocol.ts` SgIntent `sg`: game id `g` (10 letters, the layout
seed), index `i`, move `a`, ≤ 256 bytes), kept by the relay's room ([backend](backend.md#shared-world): 2 days after
the last move, 12 games) and on each phone (`DEVICE.sugorokuOnline`). Every phone folds them through the same rules
(`online.ts foldMoves`; the words and lines must be in). A move counts only from whose turn it is (the start and 終了
from anyone seated; mini-game moves from any seat).

- **Watching** (`view.ts`, `sgv`: never kept or logged): my turn's panel as a snapshot (≤ 256 bytes, on change at most
  every 200 ms, whole when someone arrives, every 30 s unchanged), sent to the game's other seats only; theirs shows it
  under 「Xが考え中…」 through the same components (`mirror`), inert, till the move lands.
- **Races** (`wire.ts`, the same result in any order): the first of each `i` stands (a later one hears `ack {ok:
  false}`). The earliest 終了 stands. A move past a gap waits, and this phone sends nothing till it fills. Two starts
  within 15 s: the lower id.
- **Version:** the start carries `wire.ts` RULES (`r`, '5'); a phone on another folds nothing and says so
  (`updateNeeded()`). Bump RULES with any change to what a fold makes of the moves: `mini/online.test`'s pin fails till
  then.
- **Logged:** `sg.sync` once a game and reason (gap, wait, clash, refused, drop, version).
- **Invitations:** listening starts with the app (`online.svelte.ts`, light); a game started with me in it shows a banner
  anywhere but its own screen (`InviteBanner.svelte`, by ToastHost): 「Xが英語すごろくを始めたよ」 [参加] ✕, answered
  once a game (`DEVICE.sugorokuAnswered`); not for my own start, a game over, or one idle 30 min (`wire.ts invited`). The
  tab puts the running game first. No Web Push. After a contract change the relay deploys first.

## Letters

About 10 ことば stones hold one; walking over picks it into the **pocket** (3 at most, any word may use
it). At my turn's start I may send one as a **贈り物** (`giveLetter`) to someone with none waiting: their next word
must use it, +3 for the team; a swap clears it. Online: the `gift` move.

## Tiles

`tiles.ts`: Scrabble's spread without Q, vowels richer. An 8-tile rack is drawn round a seed word
(`seeds.json`: 5–8 letters, an everyday one 6 times in 10), so every rack holds a real 5–8 letter word.

## Words

Built by `scripts/sugoroku-wordlist.py`, then `npm run sugoroku:words`: `accept.txt` what counts (~47,500, 2–8
letters: ENABLE × SCOWL / wordfreq / Norvig / NGSL / CEFR-J, minus vulgar flags and slurs, no Scrabble-only words);
`words.txt` the common ~9,000 the hints draw from; `everyday.json` ~1,700 A1–A2 words with Japanese (the bonus);
`sentences.json` the フレーズ deck's 3–6 word lines with levels (`scripts/data/sugoroku-line-overrides.json`). They
load with a game as the `sg` chunk (kept by the service worker after the first online game). Credits: SCOWL (MIT-like),
wordfreq (CC BY-SA 4.0), NGSL / NGSL-Spoken (CC BY-SA 4.0), CEFR-J (with citation), Norvig's count_1w (MIT); the
derived lists are CC BY-SA 4.0.

## Saving

Saved on the phone after every step (`save.ts`, `DEVICE.sugoroku`), the turn's tries and a mini-game's state with it;
‹ or ✕ leaves it to 続きから; a finished game is cleared. One game a phone. A save of another shape (`v`), structure
(`CONTENT`: the cards' effects, the pictures' set), generator (`GEN`) or a corrupt one reads as none.
