# 英語すごろく

A team board game for 2-3 of us, passed round one phone (1台を回して) or each on their own (それぞれのスマホで): roll,
move along a route, do the English the space asks for. A1-A2 learners; never "incorrect"; one team total toward a goal,
never a ranking. English Study's third tab. Code: `app/src/lib/sugoroku/` (rules, `components/`,
`i18n.ts`). Players are their island characters.

## Rules

- **Seats**: 2-3 (members and the guest), each an English level (`game.ts LEVEL`: what its spaces ask, not what they
  pay); first seat from the seed (`wire.ts firstSeat`). **Length** (`ROUND_CAP`): 短い (someone home, or round 7), 普通 (someone home),
  長い (everyone home, ≤ 20 rounds).
- **The board** (`board.ts`, `layout.ts`, `family.ts`): generated every game from the layout seed, so every phone
  builds the same; `problems` keeps every route 37-45 steps and balanced
  (tested over 240 seeds). `layout.test`'s golden hash is tied to `GEN`: change the generator, bump GEN.
  `classic.fixture.ts` is the tests' fixed board. The 2D map is the 3D board's fallback.
- **A turn** (`game.ts`, a pure reducer seeded by game seed and step): roll 1-6 and walk; a fork stops for a choice;
  catch-up dice for 6+ steps behind or ahead (`rollMode`). The stone:
  - **ことば**: a word from 8 tiles (「この文字で英単語を作ろう（N文字以上）」); points `tiles.ts scoreOf` (letters, lucky
    letters, ダブル, everyday bonus, ≥ 3). ヒント's first tap is a free clue (the best everyday word's first letter,
    length, Japanese); the second fills the word in and halves its points (not at やさしい).
  - **文**: a line's word tiles in order (6 / 4 after 「おしい！」 / 2 with 「答えはこれ」).
  - **絵** (`pictures.ts`, `pictures.json`: Google's Noto Emoji, Apache 2.0, from its CDN; CSP allows that path only):
    spell the thing's English.
  - **イベント** (`cards.ts`, `quiz.ts`, `EventTurn.svelte`): an A1 card; most ask about its key word, the rest move you.
  - **あがり**: +4 for the team. The game ends that round, at the cap, or on 終了.
- **Results** (never a winner): the team's stars against `teamGoal` (45/60/65 a seat by length), みんなで覚えたことば,
  and かいがら: a played game (someone home, or 3 rounds) pays everyone `REWARD` 500, + `REWARD_GOAL` 250 with the goal,
  once a game (the record's `sg_reward`).
- **Letters**: picked from stones into a pocket (≤ 3); one may be sent as a 贈り物 (`giveLetter`, online the `gift` move).

## Tiles

`tiles.ts`: Scrabble's spread without Q. A rack is drawn round a seed word (`seeds.json`), so it always holds a real
5-8 letter word.

## The 3D board

`board3d/` (`engine.ts createBoard3D`, pure parts in `plan.ts`): three draws, the players' characters hopping, a 3/4
camera on whose turn it is; drawn only while something moves. Preview `/dev/sugoroku3d?layout=<seed>`. A game plays on
its own screen `/sugoroku` (`?m=local|online`) with the island unloaded (one WebGL context); a reload resumes.
`Board3D.svelte` watches the context: not back in 3 s, refused twice or no WebGL → the 2D map. Logs `perf.sg` at leave.
The turn's sheet folds to a 56 px bar; the camera frames what's between (`setInsets`, `plan.ts cameraFor`).

## みんなで！ (mini-games)

Logic in `mini/` (pure), screens in `components/mini/`. A ことば stone with the みんなで！ mark (`Space.mini`), 2-3 a route.
The lander picks one of two (`offer.ts`; adding a game changes the deal: bump RULES). Everyone present plays; each
seat gets its stars (≥ 0, ≤ 12), the stone is marked (`g.minis`) and the lander's turn ends. Each game is `deal → play →
done? → close` (`types.ts`); content in `mini/data/*.json` loads lazily (`data.ts`). Games (file): ことばの市場
`market.ts`, 伝えて当てて `spell.ts`, みんなで一文 `together.ts`, なかま分け `sort.ts`, しりとり `chain.ts`, 数字キャッチ
`numbers.ts`, おつかい `shopping.ts`, 返事はどれ？ `reply.ts`.

- **The screen** (`MiniTurn`, `MiniResults`); passed round, private info sits behind a cover.
- **Online**: the lander's `mg`, then `mp` plays and an `mc` close from any seat; the room keeps the first of each `i`.
  **The clock** (`clock.ts`): the `mg`'s room stamp + 3 s + the game's length; the lander's phone sends `mc` 1 s after, the others 1.5 s apart each if none came.
- **Log**: `sg.mini` once at the close, never a play.
- **Test hooks**: `?sgNew=A2B2` (`start.ts hookStart`), `?sgMini=<id>[,…]`, `?sgMiniMs=<ms>`, `?sgFast`,
  `__sgMini.end()`; `?sgFirst=<k>`. `mini/online.test` plays every game to its end.

## Speaking

**Off** (`game.ts SPEAK = false`) until the real-phone checks pass ([speech test](speech-test.md)); `?speak=1` turns it
on for a page.

- **Where**: after a 絵 answer, optional 「この絵で一文言ってみよう」; only on a phone with a key; the mic asked on 話す.
- **Flow** (`SpeakStep.svelte`): 話す (≤ 10 s, `lib/speech/stt.ts`) or 書く → editable 聞こえた文 → これでOK; check
  `speak.ts`. Stars at once (+2 on-task, +1 said again); /grade's recast slides in or praise after 4 s. Never
  判定 or 採点. The phone re-cleans the answer (`contract/grade.ts gradeOf`).
- **Logged**: `sg.grade` once a step, never the text.
- **The relay's `POST /grade`** (`relay/src/gradeRoute.ts`): `{ s, t }`, a person's key; the wasei list first
  (`relay/src/wasei.ts`), else Workers AI `GRADE_MODEL`; `GRADE_DAY_MAX` (250) a role a day then 429, `GRADE_OFF`
  503. Nothing kept.

## Online

それぞれのスマホで: a game is its moves (`contract/live-protocol.ts` SgIntent `sg`: game id `g`, index `i`, move `a`,
≤ 256 bytes), kept by the relay's room ([backend](backend.md#shared-world): 2 days, 12 games) and on each phone
(`DEVICE.sugorokuOnline`); every phone folds them through the same rules (`online.ts foldMoves`). A move counts only
from whose turn it is.
- **Watching** (`view.ts`, `sgv`, never kept or logged): my turn's panel mirrored to the other seats.
- **Races** (`wire.ts`): the first of each `i` stands, the earliest 終了 stands, a gap waits, two starts within 15 s:
  the lower id.
- **Version**: the start carries `wire.ts` RULES; a phone on another folds nothing (`updateNeeded()`). Bump RULES with
  any change to what a fold makes of the moves (`mini/online.test`'s pin fails till then).
- **Logged**: `sg.sync` once a game and reason.
- **Invitations** (`online.svelte.ts`, `InviteBanner.svelte`): a banner 「Xが英語すごろくを始めたよ」 [参加], once a game
  (`DEVICE.sugorokuAnswered`, `wire.ts invited`). No Web Push. After a contract change the relay deploys first.

## Words

Built by `scripts/sugoroku-wordlist.py`, then `npm run sugoroku:words`: `accept.txt` (2-8 letter words that count),
`words.txt` (hint words), `everyday.json` (A1-A2 words with Japanese, the bonus), `sentences.json` (フレーズ deck lines,
`scripts/data/sugoroku-line-overrides.json`); loaded with a game as the `sg` chunk. Credits: SCOWL (MIT-like), wordfreq,
NGSL / NGSL-Spoken (CC BY-SA 4.0), CEFR-J (with citation), Norvig's count_1w (MIT); derived lists CC BY-SA 4.0.

## Saving

After every step on the phone (`save.ts`, `DEVICE.sugoroku`); ‹ or ✕ leaves it to 続きから; one game a phone. A save of
another shape (`v`), content (`CONTENT`), generator (`GEN`) or a corrupt one reads as none.
