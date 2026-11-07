# ききみみ framework: RoundSession, GameDef, `play`, packs (design 2026-11-06; as built 2026-11-07)

The platform under every ききみみ game: curriculum §14 increments 8 (the engine and the `play` wire) and 9 (the content compiler and the audio packs). It follows docs/curriculum.md §7 and §12, docs/kikimimi.md (the game as built) and docs/backend.md ("Live relay", "Events" `listen`, "Service worker").

**Status (2026-11-07).**
- **Built:** 8a (the contract), 8b (the engine, the quiz's GameDefs, the shared frame: "8b as built"), 8c (`play` out, cv, roles, tiers: "8c as built"), 9a (the slicing spike), 9c (packs and their cache), the compiler (§6: the TS bank, units, listening files and stories into lazy parts), the registry (W2-C2), the tournament, みみ チェック, the five listening games (W2-1…W2-5) and the stories' frame.
- **Pending:**
  - **`QUIZ_ON_PLAY`** (round/wire.ts: `false`, so `WIRE` is `'guarded'`): the quiz family still goes out as `quiz` until `npm run logs` shows both phones on an 8b-or-later build; then the one-line flip, then 8d / 8e (§4.3).
  - **W2-R, the packs on R2** behind `PACK_BASE` (§6): not in the code yet. **It waits for the user** to enable R2 in the Cloudflare dashboard (a bucket and a token). Until then bank.test's size lines are raised per batch as the stopgap: the games' packs 89.3 MiB under 92, the stories' 21.4 under 23 (144 packs).
- **Dropped:** the bank's move to YAML (`from-bank.ts`, `listen:build`, `ids.json`): units reference the bank's ids instead (docs/reviews/2026-11-06-units-review-eng.md P0-1: moving 750 items would change every deck and cv for nothing). `/dev/listen` and its check plugin: the check is `npm run audio:kikimimi -- --listen` and the user's ear on the phone, and a file's `status` is set by hand after the user's go-ahead. `RoundSheet` / `RoundGame`: the registry's lanes and views made them unnecessary (§5).

## 1. What exists and what generalises

What 8b took from the quiz, and where it went:

| Before 8b | Game-agnostic? | Now |
|---|---|---|
| `kikimimi/session.ts` `QuizSession`: lobby, invite, join/leave, `go`, the host clock (`skip` as position and beacon, `adopt`, `rebase`, never-decreasing starts), `late` / `out`, host grace, re-sends on presence, early reveal, `had`, the team tally | Yes, except the 8 questions, one answer window, `k` 0–3, `points()`, the `lv`/`same`/`seed` open | `round/session.ts` `RoundSession` (QuizSession deleted) |
| `QuizDeck` + `DeckOf(seed, lv)` | Shape yes, content no | `RoundDeck` (§3.1), dealt by a `GameDef` |
| `versus(seed)`: たいせん in the seed's low bit | A wire hack | `f` bit 1 on `play`; on `quiz` the GameDef's `seedBits` |
| `QuizLink`, `quizLink`, `wireQuiz` | Yes | `round/link.ts` (`roundLink`, `soloLink`, `wire`) |
| `game.svelte.ts` `QuizGame`: refresh loop, cues, clip planning, `playSequence`, `talk`, replay counts, the listen row | Mostly | stays `game.svelte.ts` (every game, through its lane), with `clipPlayer.svelte.ts` and `recorder.ts` |
| `decks.ts` (pinned, practice and LRU decks) | Yes, keyed by `gm:seed:o:u` | `round/decks.ts` + `components/kikimimi/decks.ts` |
| `deck.ts`, `bank*.ts`, `dialogues.ts`, `staging.ts`, `marks.ts`, `score.ts`, `tags.ts` | Quiz content | stay in `kikimimi/`, compiled into lazy parts (§6) |
| `progress.ts`, `srs.ts`, `advice.ts`, `report.ts` | Folds over answers by item id, generic once rows carry `gm` | stay in `kikimimi/` (きろく) |
| `contract/listen.ts` | Mostly | + optional `gm`, `u`; `pick` −1…4095 |
| Lobby, Play, Results, PlayerChip, Transcript, scene/* | See §5 | `components/kikimimi/frame/` + per-game folders |

## 2. File layout after step 8

```
app/src/lib/kikimimi/
  round/          game-agnostic, pure, no Svelte
    session.ts    RoundSession, WINDOWS / FAST_WINDOWS
    schedule.ts   schedule, times, where, fix
    tally.ts      team, teamFirst, sum, rightOf
    wire.ts       the session's ops <-> `quiz` and `play`; SEND_PLAY, QUIZ_ON_PLAY, WIRE
    link.ts       roundLink(live, mode), soloLink, wire(session, link, changed)
    decks.ts      decks by gm:seed:o:u
    types.ts      GameDef, RoundKind, Round, RoundDeck, RoundTiming, AnswerValue
    registry.ts   LANES: EAGER (quiz, ladder, lesson, taikai, check) + LATER (one lazy line a game)
  games/<gm>/     def.ts (a pure GameDef) and lane.ts: quiz, ladder, lesson, taikai, check, tile, tachi, call, rush,
                  news, and the mic games (docs/kikimimi-mic.md); listened.ts + listenLane.ts for the listening games
  compile.ts, pool.ts, packing.ts, listen.ts, story.ts   §6
  progress.ts, srs.ts, advice.ts, report.ts, tags.ts     きろく, over every game's rows
app/src/lib/components/kikimimi/
  frame/          RoundFrame, RevealFrame, Results, ResultsShell, ScoreCard, ReviewList, ReviewRow, LineRow, HearButton,
                  Note, FirstStamp, ChoiceGrid, PlayerChip, Why, Sandwich, SandButton
  <gm>/views.ts   a game's lazy lobby / play / results pages
  KikimimiSheet.svelte, game.svelte.ts, clipPlayer.svelte.ts, chunkQueue.ts, packs.ts, recorder.ts
  Lobby, Play, Results, Verdict, Transcript, scene/*     the quiz's pages and the shared pieces
  KikimimiHost.svelte, invite.svelte.ts   always loaded; hear `quiz` and `play`
```

## 3. The engine

### 3.1 Types (`round/types.ts`)

As built, smaller than the design: a game's review, row, clips and pages live in its lane and views, not on the kind.
- `GameId`: `/^[a-z][a-z0-9]{1,7}$/` (`GM_RE`). `AnswerValue`: an int 0–255, or ≤ 12 ints 0–63 (tiles, memo rows, faces).
- `RoundTiming {lead, play, answer, auto?}` in ms: the pop-in (1500; 0 for a follow-up round), the audio as scheduled (lines plus gaps), the limit from the play's end (the lobby's こたえる じかん: 30 / 20 / 60 s or Infinity), and `auto` (the reveal moves on by itself after `WINDOWS.auto`, 3 s: the ladder's lower rungs). Every other reveal is untimed: there is no reveal window.
- `RoundKind {id, play, valid, grade, auto?}`; `Round {kind, id}`; `Graded {ok, pts}`.
- `RoundDeck {count, round, timing, valid, grade, score?, maxScore}` (`score` for a deck scored as a whole: the ladder's climb).
- `GameDef {id, modes {solo, coop, vs, same}, opts {encode, decode}, seedBits?, deck(seed, o, ctx), cv?, tier?, roles?, next?}`: `seedBits` keeps the `quiz` wire's flags in the seed; `next` is the placement check's adaptive round.

**Roles.** `go` carries `pl`, the host's bitmask of players at the start (A=1, B=2, G=4). Every phone derives `players = ORDER.filter(in pl)` and `role(who) = index`: deterministic, unlike "who I've heard join". A late joiner takes `index % roles`.

### 3.2 `RoundSession` (`round/session.ts`)

`QuizSession` line for line (`adopt`, `fix`, `rebase`, never-decreasing `schedule()`, `late` → `out`, host gone, re-sends on presence, early reveal, `had`, the team tally, `close`, `prune`, early joins), with:
- `new RoundSession({me, defs, windows?, random?, seedFor?})`; `open({gm, o, same?, vs?, u?, ids?})`. A `Game` holds `gm, o (encoded), f, cv, u?, ids?, pl?` instead of `lv, same`.
- `answer(a, rp, now)` validates with `deck.valid`; the running total `s` sums `grade().pts`, capped at `maxScore`; `rp` is a count. Rounds ≤ `PLAY_ROUNDS` (32); `skip.i` runs 0…n.
- A heard `open` whose cv isn't mine, or of an unknown game or options, is an invite `blocked: 'update'` ("8c as built"). A `quiz` open has no cv and is never blocked.
- Placement: with `def.next` and a local game, the next round is dealt as a reveal ends (a local game sends nothing, so provisional starts are harmless).
- `view(now)` gains `gm, o, cv, u, roles, blocked, ids, evs, tiers`.

**Content before the deck.** A deck is dealt synchronously, but content loads lazily. game.svelte.ts holds a heard `open` and everything after it for that game (chunkQueue.ts) until its lane and chunks are in, then hands them to the session in order. A part is ≤ 60 KB gzipped, well inside the 4 s countdown.

### 3.3 The quiz as a GameDef (`games/quiz/def.ts`)

`opts [lv, timer]` (timer: `TIMERS`' index); the deck is `deck(seed, lv)`, a round per item (`quiz.<type>`), `play = itemDur`, `grade = points(right)` (100 or 0; いっぱつ is a badge, never points). 「にがて れんしゅう」 stays a local deck. スピード はしご is the game `ladder` (the same opts; one `ladder.rung` round per rung, the lower rungs' reveals `auto`, the deck's `score` the climb: 100 a rung climbed in order on the first listen). On the `quiz` wire both keep their flags in the seed (bit 0 たいせん, bit 1 the ladder, bits 2–3 the timer) through `seedBits`, so the quiz adapter is the only code that knows the wire's tricks.

## 4. The `play` intent

### 4.1 Wire (`contract/live-protocol.ts`)

```ts
export type PlayWire =
  | { g: string; gm: string; op: 'open'; cv: string; seed: number; f: number; o: number[]; u?: string; ids?: number[] }
  | { g: string; gm: string; op: 'join'; tr?: number }
  | { g: string; gm: string; op: 'leave' | 'end' }
  | { g: string; gm: string; op: 'go'; at: number; pl: number }
  | { g: string; gm: string; op: 'a'; i: number; k: number | number[]; rp: number; s: number }
  | { g: string; gm: string; op: 'skip'; i: number; at: number }
  | { g: string; gm: string; op: 'ev'; i: number; e: number; x?: number };   // the tournament's miss offers; free for later extras
```

Validation in `playOf`, which keeps known fields only, as `quizOf` does:

| field | rule |
|---|---|
| `g` | `/^[a-z0-9]{4,8}$/` |
| `gm` | `/^[a-z][a-z0-9]{1,7}$/` (never matched against a list: the relay doesn't know the games) |
| `cv` | `/^[0-9a-f]{6}$/` |
| `seed` | uint32 |
| `f` | 0–7: bit 0 おなじへや, bit 1 たいせん, bit 2 reserved |
| `o` | ≤ 4 ints 0–255 (game options: level, timer, tier or ear, …) |
| `u` | `/^[a-z0-9-]{1,12}$/` (unit) |
| `ids` | ≤ 8 ints 0–99 999 (numeric item ids: the tournament's deck) |
| `tr` | 0–3 (the player's tier) |
| `pl` | 1–7 |
| `i` | 0–31 (`a`, `ev`), 0–32 (`skip`) |
| `k` | int 0–255, or an array of 1–12 ints 0–63 |
| `rp` | 0–99 |
| `s` | 0–9 999 |
| `e`, `x` | 0–255, 0–65 535 |

`guestMaySend` allows `play`. `isStored` and `isAcked` stay false: presence only, never kept, acked or replayed, sent to all others.

**Size budget (≤ 210 B sent; the relay adds `who` and `t`, about 30 B).** The worst-case `open` is about 197 B, the worst-case `a` (12 tiles) about 125 B. wire.test builds the maximal message for every op and asserts ≤ 210 B sent and ≤ 256 B relayed. Extend through `o` and `ev`, never new top-level fields.

### 4.2 `cv`, the content version

6 hex characters of a hash per game over only what shapes the deck and the schedule: item ids, order, choice counts and answers, the mix, clip lengths to 10 ms, `gm`, and the game's `BUILD_V` (games/versions.ts, bumped by hand when its deal changes). Text, notes and marks are left out, so a copy fix never blocks co-play. Built in 8c (compile.ts `gameCv`, cv.test with its golden; "8c as built").

### 4.3 Migration from `quiz`, relay first

| Step | Change | State | Gate before the next step |
|---|---|---|---|
| 8a | Contract: `play`, `playOf`, `guestMaySend`; the `listen` row's `gm` / `u` / `pick`; relay first | built | relay `/health` shows the build |
| 8b | Client hears both wires; still sends `quiz` | built 2026-11-06 | `npm run logs -- report` *Live hellos*: every phone's `ws.hello` build ≥ 8b |
| 8c | `SEND_PLAY = true`: new games go out as `play`; the quiz family stays on `quiz` (`WIRE` 'guarded') | built 2026-11-06 | the same log: no pre-8b phone left |
| 8c′ | `QUIZ_ON_PLAY = true`: the quiz family on `play` too | **pending** (the log gate) | — |
| 8d | Stop parsing `quiz` on the client (two weeks after 8c′ at least) | later | log quiet |
| 8e | Drop `quiz` from the contract | later, relay last | — |

8b is dual-stack: an 8b phone plays with a pre-8b phone over `quiz`, and with an 8c phone because it hears `play`. Only a pre-8b phone can't hear `play`, which is what the log gate is for.

### 4.4 The `listen` row

`contract/listen.ts` has `gm?` (absent: the quiz) and `u?`; `pick` is −1…4095 (a tile round's wrong-slot mask, a memo's wrong rows, opinions in base 4); `ok` stays 0/1 and `lv` is the level 1–8 (the stage for games without levels). The relay checks rows with the same file and refuses unknown keys, so row fields ship relay first. `rowsFor` is unchanged; progress.ts skips answers whose id it doesn't know, so a newer game's row leaves an older build's stats as they were.

## 5. Shared UI (`components/kikimimi/frame/`)

As built (8b, then W2-C2): `RoundFrame` (chips, timer, status line, つぎへ / よみおわった; the game's stage and input as snippets), `RevealFrame` (sat out, ○ +points / ×, いっぱつ, co-op's count; the game's own line), `Results` (しずえ's line, team tally or ranking, my tally and first listens, おわる / もういっかい; the game's strip and sections as snippets), `ReviewList` (まちがえた だけ, a retry, all right), `ChoiceGrid` (choices, not an Item; the mic's answer slot), `PlayerChip`, `Why` (かいせつ), `Sandwich` / `SandButton` (よみきき サンド, curriculum-wave2.md §2.0). The quiz's Lobby, Play, Verdict and Results sit over them; `Transcript` (seats: two speakers left/right, three left/centre/right, overlaps from line offsets) and `scene/*` stay at components/kikimimi/. Every `data-kiki-*` hook stayed on its element through 8b and 8c.

Every game's results are built from the same parts (2026-11-07 review): `ResultsShell` (しずえ's line in the bubble, the game's sections, 終わる / もう一度遊ぶ) around a `ScoreCard` (the headline: `.big` / `.sub` lines, the 一発 stamp, a 🔒 `note`; yuzu on cream at any time of day); a review row is `ReviewRow` (the head a button with ○ / × per round it holds, the summary and 一発; opened, ▶︎ then the game's text), a voice game's line `LineRow` (its mark, the English and Japanese, ▶︎); ▶︎ / 🐢 is `HearButton`, the trap's `note` is `Note` (at a reveal and in a row), 一発 is `FirstStamp` (`pop` at a reveal, `sm` on a row).

Not built, and not needed: a generic `RoundSheet` and `RoundGame`. KikimimiSheet and game.svelte.ts serve every game through its lane, and a game's pages come from its `views.ts` ("The registry as built").

## 6. Increment 9: compiler, packs, cache, `/dev/listen`

**The compiler** (`kikimimi/compile.ts`, `npm run kikimimi:levels`; the audio scripts run it at their end). It landed early (2026-11-06), when the content sprint's 257 KB gzipped sheet chunk forced the text's half of 9 ahead of the rest (docs/kikimimi.md "Loading"). It compiles the TS bank (`source.ts`), the ladders, clips.json and words.json, plus the YAML: `app/content/units/*.yaml` (curriculum-units.md §11), `app/content/listen/*.yaml` ("Listen parts as built") and `app/content/listen/story/*.yaml` (docs/kikimimi.md "Loading", Stories), into `kikimimi/levels/parts/<part>.json` (a level past budget split in order; each ≤ 60 KB gzipped, a unit or listening part ≤ 32 KB) and `levels/index.json` (parts, counts, `cv`, the gates, every item's id, level, type, accent and tags for きろく, the units, listening files, stories and `games`' cvs). Parts load lazily through pool.ts (`import.meta.glob`); the files are committed and levels.test fails while they differ from the compiler's output. YAML is parsed by `yaml` (a devDependency) and checked by hand-written checkers (units.ts, listen.ts, story.ts) in the contract's style. The bank stays TS, its ids unchanged (SRS and rows are keyed by id); the tournament's numeric ids are each item's place in the index (`numbering`), not an `ids.json`.

**Packs** (9c, built 2026-11-06; kikimimi/packing.ts, scripts/kikimimi-packs.ts). `static/audio/listen/<pack>.<hash>.pak` is whole m4a files (mono AAC 48 kbps 24 kHz) end to end; packs.json holds each pack's hash and its clips' offsets and lengths. A clip's home is its level's pack, the ladders', its unit's (`u-<id>`), its listening file's or its story chapter's; slow takes go in the home's `-slow` pack; a home past 1.2 MB (slow 0.8 MB) is split into stable parts, so re-speaking a clip changes its own pack only. One file per pack keeps static/ far under Pages' 20,000 files (static-files.test: ≤ 15,000). Details and the batches' sizes: docs/kikimimi.md "Audio".

**R2 (W2-R, pending).** The design moves the packs to R2 behind `PACK_BASE` (a same-origin route) once they outgrow the repo's lines: 50 MB for the games, 20 MB for the stories. Wave 2 outgrew both (now 89.3 and 21.4 MiB). `PACK_BASE` isn't in the code; **the user must enable R2 in the Cloudflare dashboard** (a bucket and a token) before W2-R can be built. Meanwhile bank.test's lines are raised per batch (92 and 23 MiB): Pages takes files up to 25 MiB and a pack is ≤ 1.2 MB, so the total isn't Pages' limit (curriculum-wave2.md §5, question 3). The URL scheme won't change.

**PackStore** (`components/kikimimi/packs.ts`): `prefetchClips` fetches a deck's packs whole (no Range requests: the service worker passes those through uncached), the first question's pack first; a clip is sliced `[offset, offset + bytes)` and decoded by `engine.loadBytes`, sharing the clip LRU of 4.

**The spike (9a, 2026-11-06): passed.** Six real clips (levels 1, 4 and 6, a slow take, a ladder rung, a 9 s PA) concatenated, fetched whole, sliced and decoded, never played. Headless WebKit and the iOS 26.5 Simulator's Safari decode every slice to the standalone file's very samples, in 2–7 ms a clip: a slice is the file's own bytes (`+faststart`). ADTS frames lose the m4a's priming and padding (1,088–1,900 samples off), so the packs stay m4a.

**Service-worker cache** (`caches.ts` `LISTEN_CACHE` 'island-listen-v1'): cache first, never revalidated (the hash is in the name), LRU by pack under 30 MB with its own index (the room cache's pattern), and a pack used in the last 10 minutes is never evicted, so a game keeps its packs. Packs aren't precached. On DevTools' Fast 4G a level-4 deck's first pack lands in ~2 s, not the 6.3 s of all its packs at once.

**`/dev/listen`: dropped.** The listening check is `npm run audio:kikimimi -- --listen [--only <regex>]` on the Mac (silent otherwise: a person runs it) and the user's ear on the phone; the gate's report.json holds the flags. A file ships once its `status` is `listened` (units: past `draft`), set by hand after the user's go-ahead; the games show only those.

## 7. Later games on GameDef (10–19)

| # | Game | `gm` | State |
|---|---|---|---|
| 10 | ことば タイル | `tile` | built (W2-1, below) |
| 11 | みみ チェック | `check` | built 2026-11-07 (kikimimi-ux.md U6): solo, adaptive (`def.next`: up after 2 right, down after 1 wrong, stop after two reversals), items from the places' quiz items, a `check` row (`u` the skill profile, `lv` the placed level). Tiers in shared games: other games' `join.tr` |
| 12 | しずえの おさらい | — | built as a solo practice deck (srs.ts, catalog.ts おさらい), not a GameDef; nothing on the wire |
| 13 | ききとり page | — | not a game: きろく over every game's rows (`gm`), with stamps and minutes |
| 14 | ようじ でんわ | `call` | built (W2-3, below) |
| 15 | たちぎき | `tachi` | built (W2-2, below) |
| 16 | しずえの ニュース | `news` | built (W2-5, below): evergreen bulletins plus today's real weather, not a weekly batch |
| 17 | Long-form | `long` | not started (answers during play, a comprehension map) |
| 18 | ジョニーの たび | — | built as おやすみ ものがたり (StoryFrame, components/kikimimi/story/): solo, no score or questions, not a GameDef |
| 19 | ふたりで ジグソー | `jigsaw` | not started; roles from `pl` and `half` in the call schema are ready for it |

Wave 2's own: すうじ ラッシュ (`rush`, W2-4) and the mic games (docs/kikimimi-mic.md). Party extras use the `ev` op without a relay deploy (the tournament's miss offers already do).

## 8. Content schemas (drafting can start now)

The reference is app/content/listen/README.md (the header, every item, the text rules, `tile`, `call`, `tachi`, `rush`, `news`, Stories) and its checker kikimimi/listen.ts ("Listen parts as built"); units are curriculum-units.md §11. Every file shares one header:

```yaml
schema: 1
unit: s1-call              # [a-z0-9-]{1,12}: the part, the pack and `u`
game: call                 # which game shows it
stage: 2                   # 1-5 (S0-S4)
track: life                # life | people | work | broadcast
seeds: [16, 27]            # curriculum §5.5 scenario seeds
features: { primary: self-repair, review: weak-form }
cando: "でんわで とちゅうの へんこうや いいなおしを ききとって メモできる"
status: listened           # draft | voiced | listened
cast: { me: us-m3 }        # villager -> voice for this file (defaults: bank4 CAST)
```

Built kinds: `tile`, `call` (with `half` and `memo`), `tachi` (lines with `at` offsets, three rounds), `rush`, `news` and `weather`, and the stories' chapters. Drafted and not built: a `ladder` kind with three authored takes (the ladder time-stretches one take instead: docs/kikimimi.md "スピード はしご"), `long` and `serial` as games. A jigsaw needs no schema of its own: any `call` or `tachi` with `half`.

## 9. Migration plan and tests (main green at every step)

| Step | Work | Tests | State |
|---|---|---|---|
| **8a** | Contract `play`, `playOf`, `guestMaySend`; the `listen` row's `gm` / `u` / `pick` | live-protocol.test (each op, every bound ±1, unknown keys dropped, worst-case size), listen.test, relay room.test | built |
| **8b** | `round/`, `RoundSession`, the quiz's GameDefs, `frame/`; still on `quiz` | session.test ported, parity.test (then deleted with QuizSession), wire.test, decks.test, e2e unchanged | built ("8b as built") |
| **8c** | `SEND_PLAY`, cv per game, `pl` on `go`, the blocked invite | cv.test (golden), session.test, e2e dual stack (`?wire=quiz`) and the update card | built, guarded ("8c as built") |
| **8c′ / 8d / 8e** | `QUIZ_ON_PLAY`; then drop `quiz` parsing; then the relay | wire.test pins the mode; relay test keeps "quiz refused" | pending (the log gate) |
| **9a** | The slicing spike, `engine.loadBytes`, PackStore | engine test with a fake context; slice → the source clip's bytes | built |
| **9b** | The compiler (§6) | levels.test (the committed files, the budget, the index against the bank), units.test (golden decks), content.test, stories.test | built as §6 (the bank's YAML dropped) |
| **9c** | Packs, `island-listen-v1`, the loose clips removed | caches.test (class, cap, LRU, a recent pack kept), packs.test, usage tests, e2e on packs | built |
| **9d** | `/dev/listen` | — | dropped (§6) |

Each later game: GameDef + lane + views + content, with its kinds' unit tests (determinism, grade, team, the row round-trip through `listenOf`, `valid` bounds), the budget (≤ 15 KB gzipped a lane or view, kikimimi-budget.ts), and one e2e solo plus one co-op run (Chromium, logic only).

### 8b as built (2026-11-06)

- **The engine** (`kikimimi/round/`, §2): `RoundSession` is QuizSession line for line, its quiz specifics moved into the games; `wire.ts` maps the session's ops to both wires (`quizIn` / `quizOut`, `playIn` / `playOut`, `gameIn`, `toWire`); `decks.ts` keys decks `gm:seed:o:u`. The session caps rounds at PLAY_ROUNDS, the quiz family's decks at QUIZ_QS.
- **The games**: `quiz` (opts `[lv, timer]`), `ladder` (the same opts, the lobby's level kept for the switch back and the `quiz` wire's `lv`; its points the climb) and `lesson` (opts `[lv, timer, lesson, tier]`, its unit `u`). Their kinds (`games/quiz/kinds.ts`): `quiz.<type>` and `ladder.rung`. `GameDef.seedBits` keeps the `quiz` wire's flags in the seed's low bits, so `quizOut` sends the seed as it is and `quizIn` reads `gm`, `o` and `f` back from it. `games/quiz/session.ts` `QuizRounds` is the quiz sheet's lobby over the session, `games/quiz/view.ts` its view.
- **Lessons** are the game `lesson` dealt into my lobby (`QuizRounds.lesson`, the lobby's seed kept), not a practice deck; `unlesson` goes back to the quiz. `play` is the one wire that carries `u`.
- **Parity**: every session.test scenario (44) was fed to QuizSession and to the round session side by side, the outputs, the view after every call and the sends compared; it held, and QuizSession and parity.test went in the same push. e2e kikimimi* unchanged, Chromium and WebKit.
- **Deferred then, since done or dropped:** cv, the update card and roles (8c); Lobby and Transcript in `frame/` (they stayed put); per-kind clips / review / record / pages on RoundKind (lanes and views instead); lazy per-game chunks (the registry's `LATER`).

### 8c as built (2026-11-06)

- **cv** (§4.2): compile.ts `gameCv(gm, content)` over the game's id, its `BUILD_V` and its deck's content cv. levels/index.json `games` (`quiz:<lv>`, `ladder:ladder`, `lesson:<unit>`, `taikai:all`, `<gm>:<file>`); pool.ts `gameCvOf`. `GameDef.cv(o, u)` rides my `open`. **cv.test**: cv.golden.json keeps each game's cv and a digest of its decks (seeds 0–19, a lesson's every lesson and tier): decks changed under the same cv fail with "bump BUILD_V"; the same decks under a new cv (a re-voicing's lengths) pass; a deliberate change is `vitest -u`.
- **Blocked:** a heard `play` open whose cv isn't `def.cv(o, u)` (or a game or options this build hasn't) is an invite `blocked: 'update'` (the newest invite wins), `join` refuses it, a lobby I was in that turns into one is left for it, and it goes with its host. The sheet's idle card shows 「アプリを こうしんしてね」 and こうしんする (ui-state/reload.ts `reloadForUpdate`).
- **Roles:** `view().roles` from `go`'s `pl` (a `quiz` go has none: those in by then), a late joiner at their place, modulo `GameDef.roles` (default one each). The co-op listening games read them (two roles).
- **Tiers** (`GameDef.tier {of, with}`): the host's tier rides `o`, each player's their `join`'s `tr` (`tier(tr, now)` re-sends it before `go`). `Game.deckFor(w)` is that player's deck at their tier (the same rounds and timing); tally.ts grades with it, so `team`, `teamFirst` and the scores agree on every phone; the view's `o` is mine.
- **Wire:** `SEND_PLAY = true`, `QUIZ_ON_PLAY = false`, so `WIRE` is 'guarded': the quiz family (quiz, ladder) goes out as `quiz`, everything else as `play`; 'play' sends every game as `play`, 'quiz' is 8b's. The e2e's `?wire=quiz|guarded|play`. **Why guarded:** the phones' builds (`ws.hello`, 2026-11-06 23:00) were A on 4096003 and B on 5059da0, both from before 8b (421f15f0). **Pending:** `QUIZ_ON_PLAY = true` (one line; wire.test pins the mode) once the log shows both phones on 8b or later.
- **Co-op lessons:** curriculum-units.md §13; e2e kikimimi-coop (Chromium and WebKit) on the default wire and over the dual stack, and the update card for another cv.

### G-たいかい logic as built (2026-11-07)

しずえの しゅうまつ たいかい (curriculum §7.1, kikimimi-ux.md §7.1) as a GameDef: `games/taikai/` (its UI: docs/kikimimi-ux.md).
- **Window** (`window.ts`): offered Fri 18:00 – Mon 05:00 Tokyo (`taikaiAt(now)`: open, its span or the next, its Friday `fri`, which names it); `taikaiOfDay(d)` files a row's day under its weekend (Monday the one before); `taikaiDays(fri)` the misses' days.
- **The deck, and why `ids`.** A phone knows only its own player's answers (the partner's rows are summaries), so no phone can deal the others' misses from a seed. Each player's phone offers its own misses in the lobby (`weekMisses` → `offerOf`, ≤ 4 numeric ids) as `ev` ops (`e` EV_MISS, `i` the slot, `x` the id: no relay change); the host picks (`taikaiPick`: the offers round-robin A B G, fresh items at each player's level to fill, the hardest last as the wager, the rest interleaved by type and level) and sends the pick as the `open`'s `ids` (≤ 8: 7 questions and the wager), again whenever an offer changes it. Every phone deals from the open alone (`taikaiItems(seed, ids)`). Numeric ids are each item's place in the index (`numbering`); the game's cv (`taikai:all`: every level's content) makes them the same on both phones.
- **Session:** a set-up carries `ids` (re-dealt when they change); `event(i, e, x)` sends an `ev`, kept per player and slot and re-sent with a player's `join`; the view gains `ids`, `evs` and `tiers`. Both ride `play` only.
- **Tiers and points:** a player's tier 0–3 is their comfortable level's place (`tierOf`; unmeasured かわ). A right question pays 100 × (1.5 − expected at that tier): 50 for a sure thing, up to 150 for a stretch, so in しょうぶ the B1+ partner can win.
- **The wager** (the last round): 100 round-only chips, a bet of 10–100 before choosing, the answer `[choice, bet / 10]`; right pays ×2, wrong loses it; 15 s more to answer. A bet ≥ 70 missed is `wagerReveal` 'confident-miss', the big reveal (hypercorrection). Chips are never kept: no かいがら.
- **Results:** co-op (default) counts the team's rounds against しずえ's target (`taikaiTarget`: the rounds someone should get at their tier, short of all; gold two more); `trophyOf` bronze / silver / gold. The row: `gm` 'taikai', `u` the trophy, `lv` the tier's level; `trophiesOf(rows)` the best per weekend for the tent. しょうぶ ranks by points plus chips.
- **For the UI:** `source.ts` (`taikaiSource`, `TAIKAI_IDS`, `taikaiPool`, `taikaiLevels`, `taikaiDeals`), `taikaiGame(taikaiSource)` in the registry; the recorder's pick is `choiceOf(a)`.

### Listen parts as built (W2-C1, 2026-11-07)

The listening kinds (content/listen/*.yaml, not story/) compile with the levels. `kikimimi/listen.ts` holds their types, the checker and the clip ids, for the compiler, the scripts and the tests (it reads the roster); the phone imports its types only. A problem in any file stops the compiler, and content.test runs the same checker.

- **Part** `levels/parts/<unit>.json` (≤ 32 KB gz), pool.ts `Part.listen`: `{"listen": {unit, game, stage, status, cando, items}, packs, clips, words}`. `items` are as authored minus `tts`, with a `clip` id on every tile and on every line of a call or a たちぎき, so a game never derives an id. A derived tile's `clip` is its bank item's id, and it carries that item's `speaker`.
- **Index:** `units[<unit>] = {parts: [<unit>], n, cv}`, so `load(<unit>)` works as for a level; `listen[<unit>] = [game, stage, status]` for the catalog, with no part loaded; `games['<gm>:<unit>']` = `gameCv(gm, cv)`, written once games/versions.ts has the game's `BUILD_V`. The cv covers ids, kinds, answer shapes and clip lengths, never text.
- **Gate:** every status compiles. Past `draft`, every clip must exist or the compiler fails; the games show `listened` only. All 25 listening files are `listened` (2026-11-07).
- **Clip ids** (`listenClipIds`): a tile's id, or its `clip`; a call's or a たちぎき's lines are `<id>-<n>`. The audio script speaks them at level stage + 1 (S1 かわ → 3: no slow take), a call's `me` in the file's `cast.me`, a call in its phone band, and reads a draft file only under `--only`. Each file's clips go in its own pack.
- **Checks** (beyond the README's): US voices only; the US-only lint (`notUs`, over `en`, lines and plan choices, never `tts`; `accent-exposure` exempt), an error on content/listen, the units' items and the bank; ids apart from every bank, unit and rung clip. **Japanese help** (bank.ts helpProblems) is checked wherever it appears and required past draft: a tile's `ctx` and `why`; a call's `ctx`, each memo round's `why` and each slot's `cja`; each たちぎき round's `ctx` and `why` (the plan round's `cja` optional).
- **Later kinds:** `rush` (W2-4), `news` and `weather` (W2-5), below.

### The registry as built (W2-C2, 2026-11-07)

Every game is a **lane** in `kikimimi/round/registry.ts`. The quiz, ladder, lesson, taikai and check lanes (`games/<gm>/lane.ts`) ride the sheet's chunk (`EAGER`). A later game is one `LATER` line, `tile: { lane: () => import('../games/tile/lane.ts') }`, and its own chunk. A lane implements:

| Field | |
|---|---|
| `id`, `def(phone)` | its GameDef over the phone's deck cache (`phone.items(d)`, `phone.cv(gm, unit)`) |
| `chunks(d)`, `deal(d)` | the pool.ts chunks a deck needs, then its items from them (pure; a listening file's part is pool.ts `listenOf(unit)`) |
| `byIds?` | its deck is the open's `ids` |
| `seed?`, `solo?` | the host's seed (recent.ts), a solo game's own deck |
| `myTier?` | my `join.tr` for a game I join |
| `ahead?` | chunks to preload while it runs |
| `opts?` | a lobby's options from the mode page's level and timer (default `[lv, timer]`; they always lead with those two), with my comfortable `level` |
| `record?` | my row's answers when they aren't choices (the row then carries its `gm`: recorder.ts) |
| `title?` | the title bar's key while it runs, or in another's lobby |

- **Its pages:** `components/kikimimi/<gm>/views.ts` exports `views: { lobby?, play?, results? }`, each loaded with `import()`. The sheet finds them by folder name and mounts the one for the phase with `{ game, onagain, onmissed, ondone, onhub }`; without one it shows the quiz's.
- **Strings:** `i18n/kiki-<gm>.{ja,en}.json` (keys `kiki.<gm>.*`) plus a `kiki-<gm>.ts` that calls `addCatalog`, imported by the game's views (deps.test: kikimimi/ may not import i18n/). usage.test, fonts.test and linebreaks.test pick them up by glob.
- **Loading:** game.svelte.ts loads a later game's lane before the session takes its `open` (ChunkQueue waits on it), then its deck's chunks.
- **Catalog:** each mode has a shelf, an icon, `places` and `game` (catalog.ts). A lane's mode shows once its `LATER` line exists and a file of its game is `listened` (`LANES.ready`), or once its line's `content()` says so. A mic mode brings its own `mode` (`addMode`): the shelf `koe` (声に出す, last, hidden while empty), `gate()` (shown only while true on this phone) and `requires: 'mic'`. きまぐれ never picks a mic mode.
- **Budget** (kikimimi-budget.ts): a later lane chunk and every view in `components/kikimimi/<gm>/` ≤ 15 KB gz each, at least one view of a game folder lazy; frame/Sandwich ≤ 15 KB; a listening part ≤ 32 KB.
- **A new game:** its `BUILD_V` line (games/versions.ts), then `npm run kikimimi:levels`, and teach cv.test's `decksOf` its deal. The quiz view keeps a later game's raw answer as `a` (mine and, at a reveal, each player's pick).

### The listening games' shared pieces (2026-11-07 review)

ことば タイル, たちぎき, ようじ でんわ and すうじ ラッシュ share `games/listened.ts` (pure): `EMPTY` (63), `ROLES` (2), `listenOpts` (`[lv, timer, ear]`), `filesOf(gm, lv)` (the `listened` files at the place), `tierAt`, `shareOf` (a role's slots or rows), `cvOver`, and `listenGame` / `listenRecord` over a game's `ListenRules` (its rounds at an ear, timing, valid, ok, the row's `pick`). Each lane.ts is one line, `listenLane(RULES, deal, more?)`; `more` overrides what a game does its own way (`codec`, `game`, `lobby`, `seed`, `record`): すうじ ラッシュ its GameDef and row, しずえの ニュース its options' codec, GameDef, the host's weather and the Tokyo day's seed. The pages share `components/kikimimi/listenView.ts` (`isCoop`, `roleOf`, `easy`, `blank`, `playAgain`). A unit's lesson on recipe 2 (W2-9, curriculum-units.md §16) deals their cards with the same deals and grades them with the same rules (games/lesson/recipe.ts); its pages get the lesson's game through components/kikimimi/lesson/board.ts `cardGame`.

### ことば タイル as built (W2-1, 2026-11-07)

`games/tile/` and `components/kikimimi/tile/` (TilePlay, TileResults, board.ts); strings in i18n/kiki-tile.*.
- **Deck:** options `[lv, timer, ear]`; the `listened` tile files at the lobby's place, 6 sentences by the seed, the shortest first. A card is an Item whose `id` is the clip it plays (a derived tile's bank clip), its `tile.id` the row's id.
- **Tiers:** each player's `ear` (0 はまべ … 3 やま: taikai's `tierOf`; unmeasured かわ) against the deck's place: below, easy (the first authored decoy, my first slot placed for me); above, hard (the decoys topped up to 3–4 from a sound-swap table over the sentence's own words); else as authored.
- **Answer:** the board's index per slot, `EMPTY` for a slot not filled; valid: one per slot, within the board, each tile once. Right: every filled slot holds its word (by text) and they're the whole sentence or one role's half. 100 a right sentence; a replay costs nothing (the row's `rp`).
- **Co-op:** `roles: 2`; role 0 fills the odd slots, role 1 the others; the partner's slots are dashed. The team builds a sentence when both halves are right (`team.all`), shown from both answers; 「ふたりで k / n」 counts them.
- **Row:** `gm: 'tile'`, `[tile id, ok, wrong-slot mask, rp]` (`tileRecord`; `wrongWords` reads it back).
- **e2e** kikimimi-tile (solo, co-op) on the shipped, listened files.

### たちぎき as built (W2-2, 2026-11-07)

`games/tachi/` and `components/kikimimi/tachi/` (TachiPlay, TachiResults, board.ts); strings in i18n/kiki-tachi.*.
- **Deck:** options `[lv, timer, ear]`; the `listened` tachi files at the place, 2 conversations by the seed, 3 rounds each: opinions, changed, plan (6 rounds, ~3 min). A card's `id` is the conversation's (its lines' clips `<id>-<n>`), with its lines' `at`, the round's `ctx` / `why` (the plan's `ja` / `cja`), `tachi.row` the row's id (`<id>-op|ch|pl`).
- **Timing:** the conversation plays before the opinions round only (`play` its length over the offsets; answer +10 s); changed and plan have no lead and no clip, and nothing replays at their reveals (`quietReveal`). After the first play each line replays alone (a chip per line; `game.hear`, not counted in `rp`).
- **Offsets** (clips.ts): `lineGaps` (a line's `at`, else LINE_GAP) feed `sequenceStarts` and `itemDur`; clipPlayer's `talk` keeps the latest line begun and `all` every line under way (two in an overlap). Transcript seats three speakers left/centre/right.
- **The party bed:** a card from a file tagged `party` plays static/audio/beds/party.<sha8>.m4a (a copy of scripts/tts/beds/party.m4a, board.test checks it) under the whole sequence and a line replay: from the item's place in the loop, 0.5 s before to 0.35 s after, 0.25 s fades, at the light +15 dB SNR (`bedSamples`). So a party file's lines are voiced dry.
- **Answers:** opinions `[speaker of claim 0, 1, 2]` (EMPTY for none); changed a speaker; plan a choice. Opinions is right when every placed face is at its claim and the faces are all three or one role's two (`facesOf`). Easy (ear below the place): the third speaker's claim placed.
- **Co-op 「たんとう」:** `roles: 2`; role 0 follows the first speaker, role 1 the second, the third is shared (「あなたの担当」「ふたりで」「相手の担当」); everyone answers changed and plan. 「ふたりで k / n」 is `team.all`.
- **Row:** `gm: 'tachi'`, `[row id, ok, pick, rp]`: a choice, or opinions in base 4 (3 none; `opinionsOf`).
- **e2e** kikimimi-tachi (solo, night shots, co-op) on the shipped, listened files.

### ようじ でんわ as built (W2-3, 2026-11-07)

`games/call/` and `components/kikimimi/call/` (CallPlay, CallResults, MemoPad, Basket, CallLog, board.ts); strings in i18n/kiki-call.*.
- **Deck:** options `[lv, timer, ear]`; the `listened` call files at the place, 3 calls by the seed, **2 rounds each**. Round 1 is the call (an Item with `lines`, its clips `<id>-<n>`, played on the relay clock as a dialogue); round 2 is `<id>-memo`, no clip and `play` 0. Two memo rounds play as authored; one memo is split, its first half in round 1.
- **Tiers** (`tierAt`): easy 2 rows, as authored 3, hard 4 plus a sound-trap chip on a number's row (`trapOf`: teen ↔ -ty, else two digits swapped).
- **Answer:** the chip per row, `EMPTY` for none; right: every filled row right, and they're the whole memo or one role's share. The chips take taps while the call plays; 「メモできた」 sends once it ends. 🔁 in round 2 is `game.hear` (not a replay).
- **Co-op 「わけて メモ」:** `roles: 2`, both hear the whole call; a round's rows split by place, a round of one row both's. The team's memo (`unionOf`) shows a wrong chip over a right one.
- **Reveal:** the right chip (○) and its `cja`, a wrong pick struck, the errand's basket (`basketOf`), and at round 2 the `note`, 解説 and the transcript (言い直し, 途切れた). PhoneFrame's `bars` drop to 1 while a `signal` line plays.
- **Row:** `gm: 'call'`, `[call id, ok, wrong-rows mask, rp]` (`callRecord`; `wrongRows`). quiz/view.ts reads a two-int answer as a wager only in the tournament.
- **e2e** kikimimi-call (solo, night, co-op) on the shipped, listened files.

### すうじ ラッシュ as built (W2-4, 2026-11-07)

`games/rush/` (over listenLane) and `components/kikimimi/rush/` (RushPlay, RushResults, Counter, board.ts); strings in i18n/kiki-rush.*.
- **Content:** `scripts/kikimimi-rush.ts` (`npm run kikimimi:rush`; `--check`, `--clips`) expands 60 frames (30 かわ, 30 もり; six counters: café, konbini, ticket window, a deli abroad in dollars, taxi stand, pharmacy) four times each, by four of the 12 US voices, into s1-rush.yaml and s2-rush.yaml: 240 customers, one clip each, a third corrected at seeded random places (make that, I mean, scratch that, did I say…), some with a second number. The four chips are the answer, the slip, the second number, the -teen / -ty twin and near values, ascending, with `cja`, `why` and `note`. listen.ts kind `rush`. rush.test checks the files are as generated and apart from the bank (near-duplicates among rush items exempt).
- **Deck:** options `[lv, timer, ear]`; 8 customers by the seed, never two of one frame. A card is a `num` Item, `rush: {ask, at, was, b}`.
- **Tiers:** hard all 4; as authored 3, the farthest dropped but never `was` or the twin; easy 3, `was` dropped. The row's pick is the chip as authored.
- **Timing:** the answers open when the order ends; 8 s (`WINDOW`) whatever こたえる じかん, none with なし, so its pages offer just 8秒 and なし.
- **Points:** `questionPoints(ear, b)`, b the place plus 0.5 for a correction (the tournament's rule), so しょうぶ works against expectation. Co-op counts customers, not points.
- **Co-op 「ふたつの レジ」:** `roles: 2`; customer i goes to register `i % 2`; the other phone answers `PASS` (99): valid, never right, no row, so `team.right` is the customers served.
- **Combo:** customers served right on the first listen in a row; a miss resets it, the customer repeats the line (one replay at the reveal) and the line goes on.
- **Audio (A3):** 240 clean clips (the bed is only tagged), both files `listened` (docs/kikimimi.md "Audio").
- **e2e** kikimimi-rush (solo with a miss, night shots, co-op) on the shipped files.

### しずえの ニュース as built (W2-5, 2026-11-07)

`games/news/` (def.ts, weather.ts pure) and `components/kikimimi/news/` (NewsPlay, NewsStage, NewsResults, board.ts); strings in i18n/kiki-news.*. On じっくり only (no places, no hub card); きまぐれ picks it only in the morning (catalog `hours: [5, 11]`; outside them the next mode in turn), as its 「Good morning」 says.
- **Content (B5):** news-a.yaml and news-b.yaml, stage 4 (やま), 15 bulletins each (by season or any), 7 with a `weekday`. Kind `news`: `season`, `weekday?`, two `segments` (`island` or `season`, then `tokyo`) of 3–5 lines read by しずえ (us-f4), 100–170 words; `gist` and `detail` with 4 English choices, `trap`, `cja`, `why`; `ctx`. The kind `weather` (news-a's `news-wx`) holds the tail: 8 skies, the high as a template, 6 alerts, the sign-off, expanded to 56 clips (`news-wx-sky-rain`, `news-wx-hi-23`, `news-wx-hi-m2`, `news-wx-alert-heat`, `news-wx-end`).
- **The weather:** the relay's timeline carries `hi` (`[tokyoDay, °C]`: relay/src/weather.ts `highOf`). weather.ts `newsWxOf` reads the sky over 06:00 (or now) to 21:00 Tokyo, or after 18:00 the next six hours (sunny, partly, cloudy, later, clearing, rain, storm, snow), any fog, and the high (−2…38 °C); `tailKeys` gives the sky, the high, at most two alerts and the sign-off. With no timeline, the sign-off follows segment 2 and there's no umbrella question.
- **Deck:** the seed is the Tokyo day (`Lane.seed`). `bulletinOf` takes the day's season or `any` (a weekday's only on its day), `day % n`. The options are `[lv, timer, ear + 4 × sky byte, high byte]` (`newsOpts`: the host's weather, so every phone plays and grades the same tail). The cards: the gist (the bulletin and the tail), `<id>-d` and `<id>-kasa` (with the weather only), the last two with no clip.
- **Tiers:** easy shows the answer and its `trap` only; else all four. Every player has the same questions (co-op shares one session).
- **Rounds:** the bulletin plays before the gist, then the answers (+5 s to read); after it, NewsStage's chips replay a segment (`game.hear`). The last reveal shows the note and the whole bulletin. Co-op: everyone answers everything, 「ふたりで k / n」 is `team.all`. **Row:** `gm: 'news'`, `[card id, ok, choice, rp]`.
- **Audio (A3):** 291 clips (235 bulletin lines, 56 weather sentences) in us-f4 at −18 LUFS like the stories; both files `listened`. Joins fall between sentences, judged on the iOS Simulator.
- **e2e** kikimimi-news (solo, night shots, co-op) on the shipped files, the weather planted in `island.wx` on the `?date=` day.

## 10. Risks

1. **Deploy order** (`play`, or a row field, sent before the relay knows it). Mitigation: contract first, the `SEND_PLAY` / `QUIZ_ON_PLAY` switches, gates on the `ws.hello` log.
2. **`cv` too strict** (a deploy window blocks co-play). Mitigation: hash only what shapes the deck; the update card calls the existing reload path.
3. **Byte budget creep** (`open` at about 197 B). Mitigation: size tests per op at worst case; `ids` capped at 8; extend through `o` and `ev`.
4. **Evicting a pack mid-game.** Mitigation: never evict one used in the last 10 minutes; a missing pack refetches (a failed fetch is a silent clip).
5. **Audio outgrowing the repo** until W2-R: each batch raises bank.test's lines; the user's R2 step unblocks the real fix (§6).
6. **The listening check** is the content bottleneck (curriculum §13): the gate flags clips for the user's ear, listed in curriculum-wave2.md §4.1.

Retired: the extraction's regressions (parity held, 8b), conflicts with increments 6 and 7 (landed first), slicing m4a in WebKit (the spike passed), lazy content vs a sync deal (chunkQueue), schema drift (`schema: 1`, drafts compile without audio).
