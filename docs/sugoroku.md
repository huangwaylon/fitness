# 英語すごろく

A team board game for 2–3 of us, passed round one phone (1台を回して) or each on their own (それぞれのスマホで): roll, move,
do the English the space asks. A1–A2; never "incorrect"; one team total toward a goal, never a ranking
([decisions](decisions.md#english-and-food-data)). English Study's third tab; code `app/src/lib/sugoroku/`. Players are
their island characters.

## Rules
- **Seats**: 2–3 (the guest too), each its own level (`game.ts LEVEL`: what its spaces ask); first seat from the seed
  (`wire.ts firstSeat`). **Length** (`ROUND_CAP`): 短い (someone home, or round 7), 普通 (someone home), 長い (everyone
  home, ≤ 20 rounds).
- **The board** (`board.ts`, `layout.ts`, `family.ts`): generated from the layout seed, so every phone builds the same;
  every route 37–45 steps (`problems`). Change the generator, bump `GEN` (`layout.test`'s golden hash).
- **A turn** (`game.ts`, a pure seeded reducer): roll 1–6; a fork asks; catch-up dice 6+ steps apart (`rollMode`).
  Stones: **ことば** (a word from 8 tiles, `tiles.ts scoreOf`; ヒント's first tap a clue, the second fills it at half
  points), **文** (a line's tiles in order), **絵** (spell the picture: Noto Emoji from its CDN, CSP that path only),
  **イベント** (an A1 card, `cards.ts`), **あがり** (+4; the game ends that round, at the cap or on 終了).
- **Results** (never a winner): stars against `teamGoal`, みんなで覚えたことば; a played game pays everyone かいがら
  `REWARD` 500 (+ `REWARD_GOAL` 250 at the goal), once (`sg_reward`).
- **Letters**: ≤ 3 in a pocket; one may be a 贈り物 (`giveLetter`).

## Tiles
`tiles.ts`: Scrabble's spread without Q; a rack is drawn round a seed word (`seeds.json`), so it holds a 5–8 letter word.

## The 3D board
`board3d/` (`createBoard3D`, pure `plan.ts`), drawn only while something moves; the game plays on `/sugoroku`
(`?m=local|online`) with the island unloaded (one WebGL context); a lost context or no WebGL falls to the 2D map.
Preview `/dev/sugoroku3d?layout=<seed>`.

## みんなで！ (mini-games)
Pure logic in `mini/`, screens `components/mini/`. 2–3 marked ことば stones a route; the lander picks one of two
(`offer.ts`: a new game changes the deal, bump RULES); everyone plays for 0–12 stars each. A game is `deal → play →
done? → close`, content lazy in `mini/data/*.json`. Games: ことばの市場, 伝えて当てて, みんなで一文, なかま分け, しりとり,
数字キャッチ, おつかい, 返事はどれ？.
- **Online**: `mg`, then `mp` plays and an `mc` close; the room keeps the first of each `i`. **The clock** (`clock.ts`):
  the `mg`'s room stamp + 3 s + the game's length.
- **Test hooks**: `?sgNew=A2B2`, `?sgMini=<id>`, `?sgMiniMs`, `?sgRoundMs`, `?sgFast`, `?sgFirst`; `mini/online.test`
  plays every game to its end. Logged `sg.mini` once at the close.

## Speaking
**Off** (`game.ts SPEAK = false`) until the [speech test](speech-test.md) passes; `?speak=1` for a page. After a 絵
answer, optional: 話す (≤ 10 s, `lib/speech/stt.ts`) or 書く → 聞こえた文 → これでOK; stars at once, /grade's recast
after; never 判定 or 採点. `POST /grade` (`relay/src/gradeRoute.ts`): wasei list first, else Workers AI;
`GRADE_DAY_MAX` (250) a role a day; nothing kept; `sg.grade` logged without text.

## Online
それぞれのスマホで: a game is its moves (`live-protocol.ts` SgIntent, ≤ 256 bytes) kept by the room
([backend](backend.md#shared-world): 2 days, 12 games) and each phone; every phone folds them through the same rules
(`online.ts foldMoves`); a move counts only from whose turn it is. Watching (`sgv`) mirrors my turn's panel, never kept.
Races (`wire.ts`): the first of each `i` stands. **Version**: the start carries `RULES`; another version folds nothing
(`updateNeeded()`); bump RULES with any change to a fold. Invitations: an in-app banner once a game, never Web Push.

## Words
`scripts/sugoroku-wordlist.py`, then `npm run sugoroku:words`: `accept.txt`, `words.txt` (hints), `everyday.json`
(bonus words with Japanese), `sentences.json`; loaded as the `sg` chunk (`content.ts loadContent`). Credits: SCOWL,
wordfreq, NGSL (CC BY-SA 4.0), CEFR-J, Norvig's count_1w; derived lists CC BY-SA 4.0.

## Saving
After every step on the phone (`save.ts`); one game a phone; a save of another `v`, `CONTENT` or `GEN` reads as none.
