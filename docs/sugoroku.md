# 英語すごろく

A team board game for 2–3 of us, passed round one phone (1台を回して) or each on their own (それぞれのスマホで): roll,
move along a route through the island, and do the English the space asks for. For A1–A2 learners; never "incorrect".
English Study's third tab, すごろく (its own chunk, loaded on the tab). Code: `app/src/lib/sugoroku/` (pure rules
beside their tests, the screens in `components/`, strings in `i18n.ts`: kanji, one spelling per term). No ベル; かいがら for playing (below). Players are their own characters (the island's look): the one sheet
with characters in it, since they are the pieces. A team game: one team total toward a goal, never a ranking.

## Rules

- **Seats** (だれが遊ぶ？): 2–3 of us (the members and the guest), each as their own character (the island's look),
  turns in the order picked, each an English **level** (`game.ts LEVEL`): what its spaces ask, not what they pay, so a
  mixed table stays close. A **length**: 短い (by round 7), 普通 (the round someone's home), 長い (everyone home, 20 rounds at most).

  | | やさしい | 普通 | 難しい |
  |---|---|---|---|
  | shortest word | 3 | 3 | 4 |
  | everyday word | +3 | +2 | +1 |
  | ヒント's word | full | half | half |
  | 文's lines | level 1 | level 2 | level 3, the Japanese behind 意味を見る (+2 unopened) |
  | 絵 | one of three spellings | its letters, the first given | its letters and two more |
  | イベント's Japanese | shown | shown | on a tap |
- **The board** (`board.ts`, `layout.ts`): a new one every game, generated from the game's layout seed (kept in the
  game, `layout`: a reload and every phone build the same one). A **family** (くねくね rows, ジグザグ legs, なみ waves,
  わっか a loop round a pond, 十字路 lanes with a crossing where you may swap, みつまた three small forks), 1–3 **forks**
  (split lanes either side, a corner cut short or gone round, a crossroads; joining early or late; the short way's
  stones richer: ×2, 絵 or イベント, the long way's steadier), 4–7 stretches (家 first, 浜辺's あがり last; 広場 川 博物館
  お店 飛行場 森 丘 駅 公園 in a new order), mirrored half the time. Rules (`problems`, tested over 240 seeds): every route
  37–45 steps (about 11 rounds), at most 6 apart, its play (ことば 1, ダブル 1.7, 絵 1.3, 文 1.2, イベント 1.1) within
  12 % of the richest route's, each kind's count per route in a band, no 4 ことば in a row, ×2 / 絵 / イベント 3 apart
  and 文 2; stones apart, links 40–100 (a crossing's 150), nothing on another's link, links crossing only at a
  crossroads, the river under one bridge link (two bridges at most), signs, the house and trees off the route, no
  more scenery than the classic (6 signs, 22 trees, one house). A layout breaking one is tried again with the next
  sub-seed. A golden hash of pinned seeds' boards (`layout.test`) is tied to `GEN` (`family.ts`): change the
  generator, bump GEN. This build builds GEN 1 (the boards as they were) and GEN 2 (the same with 2–3 みんなで！ stones a
  route: below); new boards are GEN 1 till mini-games are on. A fork's buttons read its ways: 「森の近道」 / 「広場の遠回り」, steps and what's on it (「4マス・ダブル2」);
  each way's sign in 3D says 近道 / 遠回り and its steps. Two games in a row are of different families (local: the
  last game's; online: the last id's). A game without a layout (an older save or game id) plays the
  **classic** board: 47 stones, one fork after 広場 (川の近道 4 / 博物館の遠回り 7). The 2D map (the 3D board's
  fallback) is a tall map, a window following whose turn it is (and scrolling by hand), full-bleed like the 3D board.
- **A turn** (`game.ts`, a pure reducer seeded by the game's seed and step count, every step moving it on): roll 1–6
  and walk; each fork stops the walk for its choice (`ways`: the way taken at each). The table kept together (`rollMode`): the one 6+ steps behind
  whoever's furthest on rolls two dice and keeps the higher; the one 6+ steps ahead of whoever's
  furthest back rolls two and keeps the lower. The stone:
  - **ことば**: make a word from your 8 tiles (tap to place, tap to take back). Points (`tiles.ts scoreOf`) = letters
    (1 for E A I O N R T L S U, 2 D G B C M P, 3 F H V W Y, 4 K, 5 J X Z: a short word with a rare letter ties a long one)
    + 2 for each of the game's two lucky letters, × 2 on ダブル, + the level's everyday bonus, at least 3, said in words.
    ヒント fills in the rack's best everyday word (sticks for the turn). 入れかえる swaps the rack for no stars. Not a word:
    a soft note, the tiles kept.
  - **文**: put a line's word tiles in order: 6 stars, 4 after 「おしい！」 (the wrong order shown a moment), 2 with
    「答えはこれ」. No line left for the level (or offline): the stone plays as ことば.
  - **絵** (`pictures.ts`): an everyday thing's picture (Google's Noto Emoji, Apache 2.0, hotlinked from its CDN: the CSP
    allows that path only; `pictures.json`, 706 things one emoji shows, our Japanese, no signs), a tier by the seat's level (TIERS:
    260 everyday, 242 B1, 204 B2+ such as hedgehog or stethoscope; names up to 12 letters), its English to spell by the level: 5 stars, 3 after 「おしい！」, 2 with
    「答えはこれ」 (each once a game).
  - **イベント** (`cards.ts`): an A1 card (English, its key word marked, then Japanese; a villager's head when one says
    it), its effect as a chip: good or neutral only; a move walks on like a roll (letters picked up, the fork asks) and the stone it lands on is
    played in the same turn (an イベント there plays as ことば: no chain). The lucky letters are common consonants (D G H L M N P R S T), so racks hold them.
  - **あがり**: +4 for the team, whoever's home first. The game ends with the round someone got home in (equal turns), at the
    length's cap (`ROUND_CAP`), or 終了.
- **Results** (a team game: never a ranking or a winner): おつかれさま, the team's stars against its goal (`teamGoal`:
  45/60/65 a seat by the length; 「前回より…」 only when beaten), each one's good thing (their longest word, pictures, lines),
  **みんなで覚えたことば** (up to five of the game's things with Japanese, each Japanese once, to match English ↔
  Japanese; a mismatch just lets go), 今日のことば, and the かいがら: a game played (someone home, or 3 rounds) pays
  everyone at the table 500 (750 with the goal) once (`rewardOf`; the record's `sg_reward`: one game pays each of us
  once, whichever phone sends it; no daily cap).

## The 3D board

`board3d/` (engine.ts `createBoard3D(canvas, board)`, the pure part in plan.ts): the game's board as a minimal island (one
mesh of vertex colours, one of water, one atlas of marks and signs: three draws whatever the layout; built once a game): a few flat low-poly
shapes (grass, the river with its bridges, the beach and sea, a few trees, the sandy path), the stones in their kind's
colours with their marks, signs, at 1.5× pixels (kept this light for an iPhone's memory), the players as their own characters (person3d) hopping stone to stone, a pip die tumbling onto its face, a 3/4
camera following whose turn it is; a celebration never sad (joy, a small hop, a wave). Drawn only while something
moves; pawns and no draws in logic mode. Previewed at /dev/sugoroku3d (dev only; `?layout=<seed>` a generated board).

A game plays on its **own screen**, `/sugoroku` (`?m=local` this phone's, `?m=online` the shared one; the page's query
kept), like the museum: the island isn't drawn meanwhile (one WebGL context on the phone). Starting or resuming in the
tab goes there; ‹ goes back to the island with English Study open on the tab; a reload there resumes the game. The
board (`Board3D.svelte`) covers the whole screen and is never resized by a phase: the heads hop a stone at a time (260
ms), the die tumbles before the move, a ★ 6+ or あがり gets a jump of joy (else a hop). It watches its WebGL context like the island (`watchContext`, `gl.lost`
where `sugoroku`): a lost context is drawn again once back; one not back in 3 s, refused twice, or no WebGL at all
puts the 2D map in its place.

**The play screen** (iPhone 15's 393 × 659 the target): over the board, a top overlay (the NavBar on a clear ground: ‹,
⋯ then ✕, the team's ★ pill in the title's place; under it the players' pills: name, level `.tag`, pocket letters, whose turn yuzu and `aria-current`)
and the turn's bottom sheet (cream, its content's height up to what leaves the board 160 px, then it scrolls; its action
the last row, full width). The engine frames only the part between (`setInsets`: `setViewOffset` on the visible part,
plan.ts `visibleOf` / `cameraFor`): whose turn it is in the lower third with the stones ahead, x kept to the land (only
the beach at the sides), the horizon never shown (the bottom inset given back first); a fork's choice aims between the
ways. Two exceptions to design.md's kit, for the board's room: the team pill in the title bar's place, and this
sheet's handle (a tap or a drag down) folding it to a 56 px bar (the phase ▲) to see the board; every new phase
opens it again; a walk shows the die and 「3マス」 in that bar. A check's note is a toast pill over the sheet. ⋯ holds 遊び方
and 終了する (「ゲームを終了する？」 [キャンセル][終了する]: passed round 「ここまでの星で結果を見るよ」, online the danger
button and 「全員のゲームが終わるよ」). The fork and stretch signs read at the default camera; ↻入れかえ asks inline (「星なしで入れかえる？」).

## みんなで！ (mini-games)

**On** (`mini/flag.ts MINIS`): new games are GEN 2 boards on RULES '3'. The logic is `lib/sugoroku/mini/` (pure,
tested), the screens `components/mini/`; design: the 11-18 proposal (user-approved: ことばの市場, 伝えて当てて, みんなで一文,
なかま分け first; しりとり, 数字キャッチ, おつかい, 返事はどれ？ next). Only games with a screen are offered
(`mini/offer.ts OFFERED`: adding one changes what a landing deals, so it goes with a RULES bump).

- **The stone** (GEN 2 boards): a ことば stone with the みんなで！ mark (`Space.mini`), 2–3 a route, 6 apart, none in a
  route's first 5 steps or last 3, never a fork or a join, play 1.5 in the routes' balance (a fork's short way may carry
  one). Its mark: a rose top with two heads (3D atlas cell 7, the 2D board's SVG), a ことば's once played. Landed on (a
  card's move too): the lander picks one of two options (`offer.ts`, seeded: none again in a game till the pool runs
  out), each card its name, one line and its time. Everyone present plays; the close gives each seat that played its stars (a
  team's: never ranked, never negative, ≤ 12 a seat present), keeps what it made (the results' words, lines, pictures),
  marks the stone played (`g.minis`: a ことば from then on) and ends the lander's turn.
- **The games** (each `deal → play → done? → close`, `types.ts`): ことばの市場 (9 tiles, 60 s, every word anyone finds
  the first finder's, points ÷ 4, a 7+ letter word +3), 伝えて当てて (3 rounds: the 伝える人 spells a picture, the others
  tap it in a grid of 4, 6 at むずかしい; 2 / 1 after 「おしい！」; a round's timer `next` shows the word, then ends it),
  みんなで一文 (two lines, their tiles dealt across the seats, the weakest the first word, the strongest the hard ones;
  6 / 4 / 2 + 2 clean, +1 むずかしい; a quiet seat's tiles freed by anyone), なかま分け (two bins by level band,
  `categories.ts`, 30 s, one count a seat, stars by the level's pace 8/10/12). Passed round: hot-seat turns (20 s
  each) or one shared phone (`registry.ts`).
- **The next wave** (not a game's first pick): しりとり (`chain.ts`: an everyday picture to start, each seat in turn a
  word from the last letter (x z q: the one before), the level's minLen to 8 letters, 10 s a turn (the timer's `next`
  skips), パス free, ヒント two letters (free at やさしい, else no everyday +1); a round all passed: a new start; 1 a link
  +1 everyday, ≤ 10 a seat); 数字キャッチ (`numbers.ts`: a number, time or price in words, four to tap with the classic
  misses (13 / 30, 45 / 54, a quarter to eight / 8:15), each phone its own seeded stream: やさしい 1–100, ふつう + times
  and prices, むずかしい + "a quarter to", "twelve ninety-nine", years, thousands; 30 s, one count a seat as なかま分け).
- **Online:** the lander's `mg` (the option `b`, the seats present `s`: only they are dealt in), then `mp` plays (`w`,
  `k`, `n`, `y`, `op`) and the `mc` close from any seat at the table (the relay refuses moves from anyone not seated).
  They race for the next `i`: the room keeps the first, the log's order decides (the first finder, a tile's place) the
  same on every phone. Each phone keeps one in flight (`wire.ts` Outbox): one that lost its race (another's heard at
  its `i`, or refused) goes again at the new end once the winner's in. **The clock** (`clock.ts`): start-at, never a
  tick: the `mg`'s room stamp (`Move.t`, `miniOpenedAt`) + 3 s countdown + the game's length; any phone sends `mc` 1 s
  after the end; the first closes, later ones and plays after it are nothing. A game's own end (every count in, the
  rounds or lines done) closes it in the fold. A dropped phone's plays already in stand; back, it folds the same.
- **Rules:** RULES '3' (GEN 2 boards, the mini-games, nothing dealt solved: みんなで一文's weakest seat the first word
  only, the rest dealt apart (a word's neighbours in other hands where the counts allow), each hand shown shuffled and
  never in the line's order while it holds two words; the market's rack never reads its word); '2' (hands in the line's
  order) and '1' still folded, so an older game plays on as it was (the game's `rules`, mini-games' `Deal.rules`).
- **The screen** (`MiniTurn`, in the turn's sheet opened tall; the 3D board idle): the pick, a 3-2-1, one bar drained by
  a CSS animation (yuzu with 「あと5秒！」), the game, then `MiniResults` on every phone till 次へ (what it made in
  TurnResult with the team's stars, each seat's part in seat order, a seat with none お休み). Online every seat dealt
  in plays at once; a seat back after the open watches. The lander's phone sends `mc`, the others a moment later if
  none came; a closed game's queued plays are let go (`dropMiniPlays`). Live frames (the `mini` view, ≤ 1 a second
  for counts): 伝えて当てて's speller's letters (`sp<round>.<letters>`: the finders' `h _ _ _`), なかま分け's counts
  (`so<n>`: the team's total live). Passed round, private info behind a cover (「スマホをBに渡してね」 [見る]): the
  market and the sort a 20 s turn each, 伝えて当てて a step each (the speller's, each finder's; a seat going on, no
  cover); みんなで一文 on the one phone, every hand in its seat's colour (A sky, B rose, G lilac, its head beside it).
  Online, みんなで一文 frees a quiet seat's cards after 15 s once its word is next (2 s if it left).
- **Log:** `sg.mini` (open, close with its ms here; the game, the seats, the mode), never a play.
- **Tests:** `?sgMini=<id>` forces the game's first landing (that game first), `?sgMiniMs=<ms>` every length (a 1 s
  countdown), dev/test only; e2e/sugoroku-mini.spec (each game passed round, two online with a phone gone and back).
  The demo's tab relay keeps the first move at each index and answers each (`onAck`, after the other tabs' ping).

## Speaking

**Off** (`game.ts SPEAK = false`) until the real-phone checks pass ([speech test](speech-test.md)); `?speak=1` turns it
on for a page (the tests, a trial); off, no step shows.

- **Where:** after a 絵 turn's answer, before 次へ: 「この絵で一文言ってみよう」 (+2), optional, 次へ skips it at no
  cost. やさしい sees two frames (I like ___. / There is a ___.), むずかしい a nudge for 6+ words (shorter: the stars and
  「次は6語以上にも…」).
- **Who:** /stt and /grade take a person's key only, so the step shows on a phone with one (not the guest's: on the
  guest's own phone there's no step). Passed round, everyone speaks on this phone's key (its daily caps). The mic is asked
  for only on 話す.
- **Flow** (`app/src/lib/sugoroku/components/SpeakStep.svelte`, its own chunk: PictureTurn imports it only with the switch on): 話す (tap to
  record, tap to stop, 10 s at most: lib/speech/stt.ts) or 書く → **聞こえた文**, editable, これでOK; もう一度 twice,
  then the keyboard → the feedback. Whisper's words on silence (empty, "Thanks for watching!", "Thank you.", mostly not
  Latin) → 「もう一度どうぞ」, not graded.
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
- **The relay's `POST /grade`** (relay/src/gradeRoute.ts): body `{ s, t }` (the sentence 1–200 chars, the target word,
  lowercase), a person's key, CORS like `/stt`. Answers `{ ok, verdict: great|ok|tip, fixed, natural, also, tip, used,
  src: ai|wasei, aiMs }`, or 400, 401, 413, 429 (`GRADE_DAY_MAX` a role a UTC day, 250), 502 (the model failed or gave
  no JSON), 503 (`GRADE_OFF`). The Japanese-English list first (relay/src/wasei.ts: mansion, テンション, open the TV…): a
  hit answers at once, nothing spent. Else Workers AI `@cf/google/gemma-4-26b-a4b-it` (json schema, thinking off,
  temperature 0; a cheerful friend's Japanese, no grammar terms; the sentence sent as `<s>` data); no answer in 2.5 s: one
  identical second call, the first answer wins (one call against the cap; the log says `hedged`, `won`). Both ends clean
  the answer with one sanitiser (`contract/grade.ts gradeOf`): a tip with a scolding word or a grammar term, no kana or
  over 40 characters is dropped; a recast that isn't plain English, has a placeholder or is over twice the sentence
  falls back to their sentence (`natural`: to none); `also` only on great. About 6–8 neurons a call: two roles' caps
  (250 + 100 STT each) stay under the free 10k a day. Nothing kept: the `grade` log line has the length, ms, verdict
  and source only.

## Online

新しいゲーム's **それぞれのスマホで**: each player on their own phone (me among them). A game is its moves (`contract/live-protocol.ts` SgIntent `sg`: game id `g`, index `i`, the move
`a` and its few fields, ≤ 256 bytes; a game id of 10 letters is its board's layout seed, an older 6–8 the classic board), sent to the relay and kept by the room per game
([backend](backend.md#shared-world): a row a move, folded into one a game, apart from the day's ring), so a phone that opens later or reloads
gets them again (its own too); the room keeps a game 2 days after its last move, 12 games at most. Each phone also keeps them (`DEVICE.sugorokuOnline`). Every phone folds them in order
through the same pure rules (`online.ts` foldMoves; the words and lines must be in: an everyday word's bonus and a
文's line are the fold's), so all show the same game. A move counts only from whose turn it is (the start, and 終了
from anyone at the table; a mini-game's plays and close from any seat: みんなで！). The phone whose turn it isn't watches (whose turn, the last move), then the player's turn live.

- **Watching** (`view.ts`, `sgv`: presence only, never kept or logged): while it's my turn, my sheet's panel (the
  ことば's tiles, ヒント, ↻入れかえ's ask, the check; the 文's tiles, 「おしい！」, 答えはこれ; the 絵's letters or choices; the
  card's Japanese; the fork; the speaking step's phase and words) goes to the relay as a whole snapshot (indices and flags,
  the speaking step's texts cut to fit 256 bytes: ~100 a frame, ~190 at most), on change at most every 200 ms, again
  whole when someone arrives, and every 30 s unchanged (so the room sleeps between); one heard unchanged isn't set again. The relay sends it to the game's other seats only (the guest when seated), and only
  at the game's next move. A watching phone shows it under 「Xが考え中…」 through the same turn components (`mirror`),
  inert; one of an older move is let go, and the move's fold takes over when it lands. The 3D board isn't touched by it.

- **Races** (`wire.ts` heard, the same result in any order): the room takes a game's moves in order, the first of
  each `i` (a later one hears `ack {ok: false}` and leaves the sender's log). An 終了's `i` is the moves it follows:
  the earliest end stands and the moves from it on count for nothing, so an end racing the turn's move ends the game
  at the same place on every phone. A move heard past a missing one waits for the gap, and this phone sends nothing
  till it fills. Two starts within 15 s: the table plays the lower id.
- **Version:** the start carries the rules' version (`wire.ts` RULES, `r`). A phone on one it doesn't play folds
  nothing and says so (`updateNeeded()`, copy `updateApp`); a game keeps the rules it started on. Bump RULES with any change to what a fold makes of the moves (rules,
  cards, pictures, the board generator, the word and line lists): `online.test`'s pin fails until it is.
- **Logged:** `sg.sync` once per game and reason (gap, wait, clash, refused, drop: a move the outbox gave up on, rolled back like a refused one; version), never a move each.
- **Loading:** the app listens from the start (`online.svelte.ts`, light: `wire.ts` only); the rules, words and
  lines load when an invitation is checked or a game opens.

A game started with me in it comes as an invitation, wherever the phone is (the island, any sheet, other
screens, the museum; listening starts with the app, `routes/+layout.svelte`): a banner with the starter's head,
「Xが英語すごろくを始めたよ」 [参加] ✕ (`sugoroku/components/InviteBanner.svelte`, placed with the toasts by
ToastHost: in the open sheet's dialog when there is one). It stays till 参加 (straight into `/sugoroku?m=online`) or ✕,
each remembered by game id on the phone (`DEVICE.sugorokuAnswered`); never on that game's own screen. One at a time, the
latest game's. Not for my own start, a phone not seated, a game over (an 終了 or the fold's end) or one whose last move
is over 30 min old (a start replayed from the room): `wire.ts` invited. すごろく's tab menu puts the running game
first, 「Xが始めたゲーム」 [参加]. In-app only: no Web Push. After a contract change the relay deploys first.

## Letters

About 10 ことば stones hold a letter (`game.ts` letters: scoring letters, a rare one now and then); whoever walks over
one (or lands on it) picks it up into their **pocket** (3 at most): extra tiles any word may use (`tilesFor`: the rack's
first, then the pocket's). At the start of my turn I may send a pocket letter as a **贈り物** (`giveLetter`) to
someone on the way who has none waiting (whoever's furthest back offered first): their next word must use it, +3 for
the team; a swap clears it (never a penalty), and their ヒント finds a word with it. Online: the `gift` move.

## Tiles

`tiles.ts`: Scrabble's spread without Q (no Q for a beginner), the vowels richer. A rack is 8 tiles, drawn round a seed
(`seeds.json`, `npm run sugoroku:words`): a common word of 5–8 letters the bag can spell (lengths 5 and 6 likeliest, 8
least; an everyday word 6 times in 10), its missing letters taken from the bag, the rest as they come, shuffled; so every
rack holds a real 5–8 letter word (and the shorter ones in it). No seed fits (a short bag): a friendly draw (2–4
vowels).

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
  Japanese reader's fixes from `scripts/data/sugoroku-line-overrides.json` (0 drops a line; a line the deck adds later gets a guess: ≤ 4
  everyday words 1, ≤ 5 and 80 % 2, else 3).

They load with a game, as the carried feature chunk `sg` (vite.config.ts FEATURE_CHUNK: not in the install
precache; kept by the service worker after the first online game, so a game night works offline). Credits: SCOWL (Kevin Atkinson,
MIT-like), wordfreq data (Robyn Speer, CC BY-SA 4.0), NGSL and NGSL-Spoken (Browne, Culligan & Phillips, CC BY-SA 4.0),
CEFR-J (Tono Lab, free with citation), Norvig's count_1w (MIT); the derived lists are shared under CC BY-SA 4.0 as they
must be.

## Saving

The game is saved on the phone after every step (`save.ts`, `DEVICE.sugoroku`): ‹ or ✕ mid-game leaves it to
続きから; a finished one is cleared. One game a phone. A turn's tries
(misses, ヒント, 意味を見る) are in the save, a mini-game's state too. A v6 save (before mini-games) reads as v7's. A save of another shape (`v`) or structure (`CONTENT`: the classic stones' kinds and
links, the cards' effects, the pictures' sets; never the copy) or a layout key of another generator (`GEN`) reads as
none, as does a corrupt one; one from before layouts (a player's one `branch`) loads as the classic board.
