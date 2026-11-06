# ききみみ framework: RoundSession, GameDef, `play`, packs (design, 2026-11-06)

This is the design for curriculum §14 increment 8 (the framework) and 9 (the content compiler and packs), and the platform that increments 10–19 build on. It follows docs/curriculum.md §7 and §12, docs/kikimimi.md (as built) and docs/backend.md ("Live relay", "Events" `listen`, "Service worker"). Step 8a (the contract), 8b (the engine, the quiz's GameDefs, the shared UI: "8b as built" below) and 8c (`play` out, cv, roles, co-op lessons: "8c as built") are built; the rest is the plan.

**State of main (855e695c).** Increments 6 (audio conditions plus the アナウンス pack) and 7 (the speed ladder) are being built and have **not landed**. Step 8b below assumes they land first and is rebased onto them. Any trick they use to fit a mode or mix onto the `quiz` wire (spare seed bits, `lv` 5) must live in the quiz's `opts` encode/decode (§3.3). Then the quiz adapter is the only code that has to know about it.

## 1. What exists and what generalises

| Today | Game-agnostic? | Destination |
|---|---|---|
| `kikimimi/session.ts` `QuizSession`: lobby, invite, join/leave, `go`, the host clock (`skip` as position and beacon, `adopt`, `rebase`, never-decreasing starts), `late` / `out`, host grace, re-sends on presence, early reveal (`allIn`), `had`, `team()` / `hadQuestion` / `since` / `played` | Yes, except the fixed 8 questions, one fixed answer window, `k` 0–3, `points()`, the `lv`/`same`/`seed` open | `kikimimi/round/session.ts` `RoundSession` |
| `QuizDeck {count, dur(i), answer(i)}` + `DeckOf(seed, lv)` | Shape yes, content no | `RoundDeck` (§3.1), built from a `GameDef` |
| `versus(seed)`: たいせん in the seed's low bit | A wire hack | the `play` flag `f` bit 1; kept for the `quiz` wire only |
| `QuizLink`, `quizLink`, `wireQuiz` | Yes | `round/link.ts` (`roundLink`, `wire`) |
| `game.svelte.ts` `QuizGame`: refresh loop, cues, clip planning, `playSequence`, `talk`, replay counts, `#keep` (the listen row) | Mostly; the clip lookup and item types aren't | `components/kikimimi/frame/round.svelte.ts` `RoundGame` + a per-kind `clips(round)` |
| `decks.ts` (pinned, practice and LRU decks) | Yes, once keyed by `gm:seed:opts` | `round/decks.ts` |
| `deck.ts`, `bank*.ts`, `dialogues.ts`, `staging.ts`, `marks.ts`, `score.ts`, `tags.ts` | Quiz content | `games/quiz/` (moves in 9 to compiled units) |
| `progress.ts`, `srs.ts`, `advice.ts`, `report.ts` | Fold over answers keyed by item id: generic once rows carry `gm` | stays in `kikimimi/` (the きろく hub) |
| `contract/listen.ts` | Mostly | + optional `gm`, `u`; `pick` −1…4095 |
| Lobby, Play, Results, PlayerChip, Transcript, scene/* | See §5 | `components/kikimimi/frame/` + per-game components |

## 2. File layout after step 8

```
app/src/lib/kikimimi/
  round/                      game-agnostic, pure, no Svelte
    session.ts                RoundSession (from session.ts)
    schedule.ts               schedule(), times(): pure, per-round timing
    tally.ts                  team(), hadRound(), scores
    wire.ts                   PlayOut/PlayIn <-> internal ops; quizToPlay / playToQuiz (deprecation adapter)
    link.ts                   RoundLink, roundLink(live), wire(session, link, changed)
    decks.ts                  decks by gm:seed:opts (pin, practice, LRU)
    types.ts                  GameDef, RoundKind, Round, AnswerValue, RoundTiming, ReviewRow
    registry.ts               GAMES: Record<GameId, () => Promise<GameDef>> (lazy imports)
    session.test.ts           today's session.test, ported; + parity.test.ts (old vs new), wire.test.ts
  games/quiz/
    def.ts                    quizGame: GameDef (build = deck(), opts = [lv], kinds pic/word/num/reply/mean/gist/next)
    kinds.ts                  RoundKind per item type (grade = points(), review, record)
    (deck.ts, bank*.ts, dialogues.ts, staging.ts, marks.ts move here in 9)
  progress.ts, srs.ts, advice.ts, report.ts, tags.ts   the きろく hub, over every game's rows
app/src/lib/components/kikimimi/
  frame/                      shared UI
    RoundSheet.svelte         (KikimimiSheet minus quiz specifics)
    round.svelte.ts           RoundGame (QuizGame minus quiz specifics)
    Lobby.svelte, RoundFrame.svelte, RevealFrame.svelte, Results.svelte, ReviewList.svelte
    PlayerChip.svelte, ChoiceGrid.svelte, Transcript.svelte, scene/*
  quiz/                       QuizStage, QuizInput, QuizReveal, QuizReviewItem
  KikimimiHost.svelte, invite.svelte.ts   always loaded; now hears `play` and `quiz`
```

## 3. The engine

### 3.1 Types (`round/types.ts`)

```ts
export type GameId = string;                 // /^[a-z][a-z0-9]{1,7}$/: 'quiz' 'ladder' 'tile' 'check' 'review' 'call' 'tachi' 'news' 'long' 'serial' 'jigsaw'
export type AnswerValue = number | readonly number[];   // an int 0-255, or ≤ 12 ints 0-63 (tiles, memo slots, face matching)

export interface RoundTiming {               // ms; every phone computes the same from the round
  lead: number;                              // pop-in before the audio (1500 default; 0 for a follow-up round on the same clip)
  play: number;                              // the audio's length as scheduled (sum of lines + gaps, or 0)
  answer: number;                            // the time limit from the play's end (15 000 default)
  reveal: number;                            // 8000 default
  answerDuringPlay?: boolean;                // long-form, jigsaw: answers open while it plays
}

export interface Round {                     // what build() returns: plain data, the same on every phone
  kind: string;                              // a RoundKind id: 'quiz.word', 'tile', 'call', ...
  id: string;                                // the item id (SRS card, listen row): /^[a-z0-9][a-z0-9-]{0,31}$/
  n: number;                                 // stable numeric id (the review ids on the wire, §4)
  group?: string;                            // rounds that share a clip or a ladder (review rows fold by group)
  role?: number;                             // which half a player hears (jigsaw, co-op calls): see roles below
}

export interface Graded { ok: boolean; pts: number }

export interface RoundKind<R extends Round = Round, A extends AnswerValue = AnswerValue> {
  id: string;
  timing(r: R, w: Windows): RoundTiming;
  valid(r: R, a: AnswerValue): a is A;       // range, array length
  grade(r: R, a: A, rp: number, o: { same: boolean }): Graded;
  /** Co-op: whether the team has the round (default: someone ok). Tiles split in halves: the union. */
  team?(r: R, answers: ReadonlyMap<Who, A>): boolean;
  clips(r: R, role?: number): ClipRef[];     // what to fetch and play, in order (with offsets for overlap)
  record(r: R, a: A | null, rp: number): ListenAnswer;   // [id, ok, pick, rp]
  review(r: R, a: A | null): ReviewRow;      // text, transcript, marks, ▶︎ clips, feature labels
  skills(r: R): { primary: Skill; also: Skill[] };       // feeds tags.ts / progress
  ui: () => Promise<KindUI>;                 // { Stage, Input, Reveal, ReviewItem }: Svelte components
}

export interface GameDef<O = unknown> {
  id: GameId;
  title: string;                             // i18n key
  modes: { solo: boolean; coop: boolean; vs: boolean; min?: 1 | 2; same?: boolean };
  cv: string;                                // content version (§4.2), compiled
  opts: { encode(o: O): number[]; decode(a: readonly number[]): O | null; offered(): O[]; label(o: O): string };
  load(o: O): Promise<void>;                 // content units in memory (lazy JSON, §6); build is sync after this
  build(seed: number, o: O, ctx: BuildCtx): Round[];     // pure, deterministic; ≤ 32 rounds
  kinds: Record<string, RoundKind<any, any>>;
  /** Placement only: the next round from the answers so far (solo, nothing on the wire). */
  next?(seed: number, o: O, done: readonly { r: Round; a: AnswerValue | null; ok: boolean }[]): Round | null;
  maxScore(rounds: readonly Round[]): number;           // ≤ 9999 (the wire's `s`)
}

export interface BuildCtx { ids?: readonly number[]; tiers?: Partial<Record<Who, number>>; players?: readonly Who[] }

export interface RoundDeck {                 // what the session sees (QuizDeck generalised)
  count: number;
  round(i: number): Round;
  timing(i: number): RoundTiming;
  grade(i: number, a: AnswerValue, rp: number): Graded;
  team(i: number, answers: ReadonlyMap<Who, AnswerValue>): boolean;
  valid(i: number, a: AnswerValue): boolean;
}
```

**Roles.** `go` carries `pl`, the host's bitmask of players at the start (A=1, B=2, G=4). Every phone derives `players = ORDER.filter(in pl)` and `role(who) = index`. This is deterministic, unlike "who I've heard join", which can differ between phones. A late joiner gets role `index % roles`.

### 3.2 `RoundSession` (`round/session.ts`)

This is `QuizSession` with the following changes. All other behaviour carries over line for line: `adopt`, `fix`, `rebase`, never-decreasing `schedule()`, `late` → `out`/`inAt`, `hostGone`, re-sends in `presence`, `allIn`, `had`, `team`/`since`/`played`, `close`, `prune`, and `early` joins.

- `new RoundSession({me, defs: (gm) => GameDef | undefined, windows?, random?})`. `open({gm, o, same?, vs?, u?, ids?})`. A `Game` holds `gm, o (encoded number[]), f, cv, u?, ids?, pl?` instead of `lv, same`.
- `full(i)` = `timing(i).lead + play + answer + reveal`; `times(i)` reads `timing(i)`. The `answer` phase opens at `playAt` when `answerDuringPlay`.
- `answer(a: AnswerValue, rp: number, now)` validates with `deck.valid(i, a)`. The running total `s` is the sum of `grade().pts`, capped at `maxScore`. `QuizAnswer.k` becomes `a: AnswerValue`; `rp` becomes a count.
- `n = min(PLAY_ROUNDS = 32, deck.count)`; `skip.i` runs 0…n.
- A `cv` mismatch on a heard `open` keeps the game with `blocked: 'update'`. It is offered as an invite (「アプリを こうしんしてね」, which taps into ui-state/reload.ts), and `join` is refused. An unknown `gm` gets the same treatment. A `quiz`-wire open has no cv, so it is never blocked (as today).
- **Adaptive (placement):** with `def.next` and a local game, `round(i+1)` is built when round i's reveal ends. The schedule's later starts are provisional, which is harmless because a local game sends nothing.
- `view(now)` gains `gm, o, cv, u, roles, blocked`; `answers` holds `{a, rp, t}`; `lv` becomes `o`.

Keep it pure. game.svelte.ts's current trick of reading through `itemsOf()` stays, as `round/decks.ts` keyed `gm:seed:o`.

**Content before the deck.** `build` is sync, but packs load lazily. `RoundGame` buffers a heard `open` (and everything later for that `g`) until `def.load(o)` resolves, then hands the whole lot to `receive` with the original `now`. The unit JSON is small (≤ 20 KB), so this takes well under the 4 s countdown.

### 3.3 The quiz as a GameDef (`games/quiz/def.ts`)

`opts = {lv: Level}` (plus whatever 6/7 add: a mix id, ladder on/off) ↔ `[lv, …]`. `build = deck(seed, lv)` mapped to rounds `{kind: 'quiz.'+type, id, n}`. `timing` is the default windows with `play = itemDur`. `grade = points(k === answer, rp > 0 || same)`. `record` is today's `listenAnswers` per round. 「にがて れんしゅう」 stays a local deck via `usePractice`.

7 shipped the speed ladder inside the quiz (2026-11-06, docs/kikimimi.md "スピード はしご"): on the `quiz` wire it is the `open` seed's bit 1 (session.ts `isLadder`), its deck ladder.ts `ladderDeck(seed)`, its points the deck's (`QuizDeck.score`: a flat 100 a rung climbed in order on the first listen, not weighted by rung). On the `play` wire it becomes `gm: 'ladder'`: one round per rung (`group` the ladder), `timing.lead` 0 after rung 1, a group score (the climb). Its `quiz`-wire form decodes through `QuizOpts` (the seed bit) for the deprecation window.

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
  | { g: string; gm: string; op: 'ev'; i: number; e: number; x?: number };   // reserved: buzz-in, synced review ▶︎
```

Validation in `playOf`, which keeps known fields only, as `quizOf` does:

| field | rule |
|---|---|
| `g` | `/^[a-z0-9]{4,8}$/` |
| `gm` | `/^[a-z][a-z0-9]{1,7}$/` (never matched against a list: the relay doesn't know the games) |
| `cv` | `/^[0-9a-f]{6}$/` |
| `seed` | uint32 |
| `f` | 0–7: bit 0 おなじへや, bit 1 たいせん, bit 2 reserved |
| `o` | ≤ 4 ints 0–255 (game options: level, mix, chapter) |
| `u` | `/^[a-z0-9-]{1,12}$/` (unit) |
| `ids` | ≤ 8 ints 0–99 999 (stable numeric item ids, for a shared review deck) |
| `tr` | 0–3 (the player's tier, increment 11) |
| `pl` | 1–7 |
| `i` | 0–31 (`a`, `ev`), 0–32 (`skip`) |
| `k` | int 0–255, or an array of 1–12 ints 0–63 |
| `rp` | 0–99 |
| `s` | 0–9 999 |
| `e`, `x` | 0–255, 0–65 535 |

`guestMaySend` allows `play`. `isStored` and `isAcked` stay false: presence only, never kept, acked or replayed, sent to all others.

**Size budget (≤ 210 B sent; the relay adds `who` and `t`, about 30 B).** The worst-case `open` (g 8, gm 8, cv, max seed, `f`, `o` of 4×255, a 12-character `u`, 8 five-digit ids) is about 197 B. The worst-case `a` (a 12-tile array, i 31, rp 99, s 9999) is about 125 B. `wire.test` builds the maximal message for every op and asserts ≤ 210 B sent and ≤ 256 B relayed.

### 4.2 `cv`, the content version

`cv` is the first 6 hex characters of a hash, computed at build time per game, over only what shapes the deck and the schedule: item ids, order, choice counts and answers, mixes, durations rounded to 10 ms, `gm`, and the `build` code's own `BUILD_V` constant (bumped by hand when the algorithm changes). Japanese text, notes and marks are left out, so a copy fix doesn't block co-play. `cv.test` keeps a golden value per game and fails, with a reminder to bump it, when deck-shaping content changes without a new cv.

### 4.3 Migration from `quiz`, relay first

| Step | Change | Deploy | Gate before the next step |
|---|---|---|---|
| 8a | Contract: `PlayWire`, `playOf`, `guestMaySend`; relay tests | relay.yml on push (phones unchanged, nobody sends `play`) | relay `/health` shows the build |
| 8b | Client hears both. `invite.svelte.ts` keeps `quiz` and `play`; `round/wire.ts` maps `quiz` → internal (`gm: 'quiz'`, `o: [lv]`, `f` from `same` and `versus(seed)`, no cv). Still **sends `quiz`** for the quiz (`SEND_PLAY = false`) | Pages | `npm run logs -- report` *Live hellos*: every phone's `ws.hello` build ≥ 8b for 3 days |
| 8c | `SEND_PLAY = true`: the quiz goes out as `play` (cv, `pl`, `rp` counts). New games are `play` only | Pages | the same log: no 8b-only phones left |
| 8d | Stop parsing `quiz` on the client (two weeks after 8c at least) | Pages | log quiet |
| 8e | Drop `quiz` from the contract (the relay stops relaying it) | relay last | — |

8b is dual-stack: an 8b phone plays with a pre-8b phone over `quiz`, and with an 8c phone because it hears `play`. Only a pre-8b phone can't hear an 8c phone, which is what the log gate is for.

### 4.4 The `listen` row

`contract/listen.ts` gains `gm?` (absent means quiz) and `u?`. `pick` widens to −1…4095 (a tile round's bitmask of wrong slots, a memo's per-slot result). `ok` stays 0/1 and `lv` stays 1–5 (the stage). The relay checks rows with the same file and refuses unknown keys, so this ships in 8a with the relay first. A phone may write `gm` only from 8c on. `rowsFor` doesn't change. `progress.ts` must skip answers whose id it doesn't know: add a test that a row from a newer game leaves the stats unchanged on an older build.

## 5. Shared UI (`components/kikimimi/frame/`)

| Component | From | Generic part | Supplied by the game |
|---|---|---|---|
| `RoundSheet` | KikimimiSheet | Sheet, title (`kiki.q` i/n), やめる？, notices, phase switch, voice session, ✕ | `title`, the Lobby options panel |
| `Lobby` | Lobby.svelte | here/joined chips, invite, ひとりで / みんなを さそう, おなじへや, たいせん (hidden unless `modes.vs`), 🔊 test, はじめる（Nにん）, a game picker row when more than one game is offered | `opts.offered()` + `label` (the level grid becomes an options grid) |
| `RoundFrame` | Play.svelte's shell | countdown (よーい 3-2-1), lead pop, ClipBar, 🔁 / 🐢 row with listenOnly, players' ✓ chips, the host's つぎへ foot, the sticky area | `Stage` (what's shown while it plays: SceneCard, heads, a phone frame), `Input` (choices, tiles, memo) |
| `RevealFrame` | Play.svelte's reveal | ○ / × verdict, +100 / いっぱつ pills, しずえ's word, 「2にん せいかい！」 (co-op) or ✓/× chips (たいせん), auto replay | `Reveal` (right answer, transcript, marks, note) |
| `Results` | Results.svelte | ranking or team tally (「ふたりで n/m」, そろって), じぶんは m中 n, feedback card, もういっかい | — |
| `ReviewList` | Results.svelte's list | まちがえた だけ filter, ▶︎ / 🐢, ○/×, えらんだ, trip labels | `ReviewItem` (one row; group-folded) |
| `PlayerChip`, `ClipBar`, `SoundLine`, `MarkLegend`, `SceneCard`, `PhoneFrame`, `PaFrame`, `VideoFrame` | as built | as is | — |
| `ChoiceGrid` | Play.svelte's choices | 3–4 text or picture choices, dimmed till unlocked, one final tap | choices + labels |
| `Transcript` | Transcript.svelte | bubbles per line, karaoke, marks | **change:** speaker positions from a `seat` per speaker (left, right, centre) so たちぎき's three fit; overlap drawn by line offsets |

`data-kiki-*` attributes stay on the same elements, so the e2e specs pass unchanged through 8b and 8c.

## 6. Increment 9: compiler, packs, cache, `/dev/listen`

**Source.** `app/content/listen/<unit>.yaml`, one unit per file (curriculum §6). It is parsed by `yaml` (a devDependency, build time only) and validated by hand-written checkers in `scripts/listen/schema.ts`, in the contract's style with no runtime dependency. `bank.ts`, `bank4.ts` and `dialogues.ts` become `s0-island-1..3.yaml` and `s1-kawa-mori.yaml` through a one-off `scripts/listen/from-bank.ts`. Item ids stay the same, because SRS history and rows are keyed by id.

**Compiler** (`npm run listen:build`, `scripts/listen/build.ts`): parse → lint (schema, refs to the roster and cast, minimal pairs per accent, `tts` digit-free, note ≤ 40 字, ids unique across units, focus in `en`) → assign numeric ids (`content/listen/ids.json`, append-only; a test fails if one disappears or is renumbered) → write `src/lib/kikimimi/units/<unit>.json` (committed, loaded by `import.meta.glob` lazily, ≤ 20 KB each) and `units/index.json` (unit → game, stage, cv, pack URL and hash). The audio pass (`kikimimi-audio.ts`, M5 Max only) stays separate. `npm run listen:check` (in CI) re-runs the text pass and fails on any diff.

**Landed early (2026-11-06, docs/kikimimi.md "Loading").** The content sprint's 257 KB gzipped chunk forced the text's half of this ahead of the YAML and the packs: `kikimimi/compile.ts` (`npm run kikimimi:levels`) compiles the TS bank, the ladders, clips.json and words.json into `kikimimi/levels/parts/<level>.json` (a level past budget split in order into parts; each ≤ 60 KB gzipped, scripts/kikimimi-budget.ts on every build) and `levels/index.json` (parts, counts, `cv`, the gates, every item's id, level, type, accent and tags for きろく), loaded lazily by `kikimimi/pool.ts` through `import.meta.glob`; the session's intents wait for their level's chunk (game.svelte.ts). The units here replace the levels as the unit of loading when the YAML lands; the index's shape carries over.

**Packs.** `static/audio/listen/<unit>.<hash>.pak` holds each clip's finished m4a (mono AAC 48 kbps 24 kHz, as now) concatenated. The unit JSON holds `clips: {id: [offset, bytes, dur_cs, wordsHash]}`, and the slow takes go in a second pack, `<unit>-slow.<hash>.pak`. Sizes: normal ≤ 1.2 MB, slow ≤ 0.8 MB. One file per pack: the quiz's 390 files become about 8, so Pages stays far under 20,000 (11,802 static files today). Past 50 MB in total, packs move to R2 behind `PACK_BASE` (a same-origin route or CORS). The URL scheme doesn't change.

**PackStore** (`components/kikimimi/frame/packs.ts`). `clip(unit, id, slow?)` fetches the whole pack (no Range requests: the service worker passes those through uncached), slices `[offset, offset + bytes)`, and calls a new `engine.loadBytes(key, () => Promise<ArrayBuffer>)` that shares the clip LRU of 4. **Spike on day 1** on a real iPhone: decoding one m4a sliced from a concatenation. If WebKit refuses, the fallback is ADTS AAC frames, which can be sliced at frame boundaries (offsets on frames).

**The spike (9a, 2026-11-06): passed.** Six real clips (a level-1 clip and its slow take, a level-4 dialogue line, a level-6 line, a ladder rung, a 9 s アナウンス PA) concatenated into one file, fetched whole, each sliced `[offset, offset + bytes)` and decoded by `decodeAudioData`, never played (an `OfflineAudioContext`, and an `AudioContext` left suspended, no source ever started). Headless WebKit (Playwright, Safari 27.2's engine on macOS) and the iOS 26.5 Simulator's Safari (iPhone 17 Pro, over safaridriver) both decode every slice to the very samples of the standalone file (same length, every sample equal), in 2-7 ms a clip. A slice is the file's own bytes (each m4a is whole, `+faststart`), so nothing about the container changes. ADTS frames decode too but lose the m4a's priming and padding (their lengths differ from the m4a's by 1,088-1,900 samples, by engine), so the packs stay m4a; ADTS is not needed.

**Service-worker cache** (`caches.ts`): a new `island-listen-v1` for `/audio/listen/`. Cache-first, never revalidated (the hash is in the name), LRU by pack with a byte cap of 30 MB and an index kept in the cache (the room cache's `roomEvict` pattern). A pack used in the last 10 minutes is never evicted, so a game in progress keeps its pack. Built 2026-11-06 (9c): 42 packs, 39.7 MB, in place of 1,559 loose clips (38.7 MB); static/ 12,969 files → 11,452 (static-files.test keeps it ≤ 15,000); the `kiki` class went with the loose clips. The lobby fetches the first question's pack alone, then the rest: on DevTools' Fast 4G a level-4 deck's first pack lands in ~2 s, not the 6.3 s of all its packs at once (docs/kikimimi.md "Audio", Fetching).

**`/dev/listen`** (`src/routes/dev/listen/+page.ts`: 404 outside `vite dev`, as /dev/characters is). For each unit: the items with ▶︎ from the pack, 🐢, transcript, marks and karaoke, the whisper report row (WER, UTMOS, similarity, flags), filters (flagged, unchecked, per voice), and a ✓ / ✗ + note. A Vite dev-server plugin (`/__listen/check`) appends to `content/listen/checks/<unit>.json`. The compiler ships only units whose audio is checked (`listened`, curriculum §12); others compile with `status: draft` and are hidden by each game's gate, the way `LEVELS` works today.

## 7. Later games on GameDef (10–19)

| # | Game | `gm` | Rounds and kinds | Answer | Timing | Notes |
|---|---|---|---|---|---|---|
| 10 | ことば タイル | `tile` | 8 sentences, kind `tile` | array: tile indices in order (≤ 12), decoys included | play = clip; answer 30 s | Co-op 「half the tiles each」: role 0 gets even slots, role 1 odd; `team` is the union. Reveal shows the spoken shape (marks `say`). `pick` = wrong-slot bitmask |
| 11 | みみ チェック | `check` | 12 adaptive rounds drawn from other games' kinds (`quiz.*`, `tile`, `news.gist`) | that kind's | that kind's | Solo, `def.next` (up after 2 right, down after 1 wrong, stop after two reversals). Output: per-skill stage in a `check` row (`gm: 'check'`). Tiers go on `join.tr` in shared games, and `BuildCtx.tiers` picks each phone's choice set (same audio) |
| 12 | しずえの おさらい | `review` | Due cards from srs.ts (exists), each a round of its source kind, a **different variant** clip (voice or condition) | that kind's | that kind's | Solo, nothing on the wire, ≤ 20 cards a day, 3 min. Co-op review uses `open.ids` (≤ 8). srs.ts's card key becomes `id` or `feature` across games |
| 13 | ききとり page | — | not a game | — | — | Progress.svelte over all rows (`gm`), plus stamps (a unit's チェック ≥ 80 % first play), minutes, and しずえ's weekly line (couple summary, exists). Kinds supply `skills()` |
| 14 | ようじ でんわ | `call` | 4–5 calls; each call = 1 play round (lines with a mid-call change) + 1–2 memo rounds (`lead` 0, `play` 0, replay allowed) | array: per-slot choice (item, qty, time, place) | play 20–40 s, answer 30 s | PhoneFrame. Co-op 「each hears half」: `clips(r, role)` plays only that role's lines; `team` combines slots |
| 15 | たちぎき | `tachi` | One 3-speaker dialogue gives 3 rounds: who thinks what (array: face per opinion), who changed their mind (int), the plan or mood (int) | mixed | play only in round 1 | Overlap: compiled line offsets (negative gaps) replace LINE_GAP; `sequenceStarts` takes offsets. Transcript seats ×3 |
| 16 | しずえの ニュース | `news` | This week's bulletin: segments, then gist + 2 details | int | play 45–90 s | Weekly unit `news-2026-wNN` from the batch script with the real weather (the relay's `wx` history); `o: [day 0–6]`. Solo daily, co-op allowed |
| 17 | Long-form | `long` | Segment rounds (3–12 s each), each followed by a question round | int / array | `answerDuringPlay` on map rounds | Comprehension map: rounds carry `node`; RevealFrame's slot shows the map filling. Notes are local only (DEVICE) |
| 18 | ジョニーの たび | `serial` | 1 chapter: 3–5 segments + a prediction round + 2 comprehension rounds | int | long | `o: [chapter]`; the chapters open are folded from rows. Co-op unlock: both rows for chapter n-1 |
| 19 | ふたりで ジグソー | `jigsaw` | Built from `call` / `tachi` content: each role hears half, then the shared questions | array | answer 60–90 s (talk time) | `modes {coop: true, min: 2}`, earphones prompt; the roles from `pl` matter most here |

Party extras (riddles 11, synced review ▶︎) use the reserved `ev` op without a relay deploy.

## 8. Content schemas (drafting can start now)

Every unit file shares one header:

```yaml
schema: 1
unit: s2-clinic            # [a-z0-9-]{1,12}: the pack name and `u`
game: call                 # which GameDef shows it (a unit may serve several via items' kind)
stage: 2                   # 1-5 (S0-S4)
track: life                # life | people | work | broadcast
seeds: [21, 22]            # §5.5 scenario seeds
features: { primary: weak-form, review: flap }
cando: "電話で 予約の 変更を ききとれる"
status: draft              # draft | voiced | listened
cast: { kanon: us-f2, kappn: au-m1 }   # villager -> voice for this unit (defaults: bank4 CAST)
```

The item kinds (fields beyond `id`, `tags {register, pragmatic, conditions[], features[]}`, `note`, and `scene` / `channel`):

```yaml
- kind: quiz.reply              # quiz.pic|word|num|reply|mean|gist|next (today's Item, unchanged)
  speaker: kanon
  en: "Could you make it Thursday instead?"
  tts: "Couldja make it Thursday instead?"
  ja: "木曜日に できますか？ → ええ、10時なら"
  choices: ["Sure, ten works.", "It's on Thursday.", "I made it myself."]
  answer: 0
- kind: ladder                  # speed ladder: one line, three takes
  speaker: kappn
  en: "I'm going to have to call you back."
  takes: { careful: "I am going to have to call you back.", natural: "I'm gonna have to call you back.", fast: "I'm'na hafta callya back." }
  choices: [...]; answer: 0
- kind: tile
  speaker: kanon
  en: "You should've told me earlier."
  tiles: ["You", "should've", "told", "me", "earlier"]
  decoys: ["shouldn't have", "tell"]
- kind: call
  lines: [{who: kanon, en: ..., tts: ...}, {who: me, en: ...}, {who: kanon, en: "Oh, actually, make that two.", repair: true}]
  half: [0, 0, 1, 1]            # jigsaw/co-op: which role hears each line
  memo:                         # one round per memo; each slot picks from its options
    - slots: [{ask: "なにを？", options: [...], answer: 1}, {ask: "いくつ？", options: ["1","2","3"], answer: 1}]
- kind: tachi
  lines: [{who: a, en: ..., at: 0}, {who: b, en: ..., at: -0.4}]    # at: offset to the previous end (s); negative overlaps
  rounds:
    - {type: opinions, claims: ["駅前が いい", "高すぎる", "まだ わからない"], answer: [b, c, a]}
    - {type: changed, answer: c}
    - {type: plan, choices: [...], answer: 2}
- kind: news
  week: 2026-w45
  segments: [{reader: newsreader-f, en: ..., tts: ...}]     # 3-12 s each
  gist: {choices: [...], answer: 1}
  details: [{ask: ..., choices: [...], answer: 0}]
  weather: {from: wx, day: 2}   # filled by the batch script
- kind: long
  segments: [...]
  map: [{node: who, label: "話し手"}, {node: claim, label: "主張"}]
  questions: [{after: 3, node: claim, choices: [...], answer: 2}]
- kind: serial
  chapter: 4
  segments: [...]
  predict: {choices: [...], answer: 1}
  questions: [...]
```

A jigsaw needs no schema of its own: any `call` or `tachi` item with `half` can be used.

## 9. Migration plan and tests (main green at every step)

| Step | Work | Tests | Est. |
|---|---|---|---|
| **8a** | Contract `play`, `playOf`, `guestMaySend`; `listen` row `gm` / `u` / `pick` range | live-protocol.test (each op, every bound ±1, unknown keys dropped, worst-case size per op, guest allowed); listen.test; relay room.test (play relayed to all others, never kept or acked, unknown `gm` passes, an oversize one dropped) | 0.5 d |
| **8b** (built 2026-11-06) | `round/` extracted; `RoundSession`; quiz `GameDef`; `RoundGame` + `frame/` components; quiz still on the `quiz` wire. **`QuizSession` kept until parity holds**, then deleted in the same PR | session.test ported to `RoundSession` + quiz def (all 110 cases); **parity.test**: every session.test scenario's intent script fed to both `QuizSession` and `RoundSession`, `view()` and outputs compared at each step; wire.test (quiz ↔ internal both ways); decks.test; e2e kikimimi / -scenes / -progress unchanged | 1.5 d |
| **8c** (built 2026-11-06, guarded: "8c as built") | `SEND_PLAY`; cv per game; `pl` on `go`; invite banner for `play` and blocked cv | cv.test (golden); session.test (cv mismatch → blocked, join refused; roles from `pl`); e2e two players with `?wire=quiz` on one page and the default on the other (the dual stack), and a cv mismatch banner via a test hook | 0.75 d |
| **8d / 8e** | Drop `quiz` parsing, then relay last | remove the quiz cases; relay test keeps "quiz refused" | 0.25 d (spread over weeks) |
| **9a** | Day-1 spike: decoding a sliced m4a on iOS Safari; `engine.loadBytes`; PackStore | engine test with a fake context; a pack round-trip test (slice → bytes equal to the source clip) | 0.5 d |
| **9b** | YAML schema + compiler + ids.json; `from-bank.ts`; units JSON replaces bank imports (quiz `load()`) | schema tests per kind (good and bad fixtures); compile is deterministic; ids append-only; `listen:check` in CI; bank.test / deck.test now run over the compiled units (same decks for the same seed: a golden deck list) | 1.25 d |
| **9c** | Audio script writes packs; SW `island-listen-v1`; loose kikimimi clips removed | caches.test (class, byte cap, LRU by pack, recent pack kept); usage / unused-assets tests; e2e kikimimi with packs | 0.75 d |
| **9d** | `/dev/listen` + the check plugin; ship-only-`listened` gate | a unit gate test (draft hidden); a manual pass | 0.5 d |

Each later game: GameDef + kinds + components + content (curriculum's 2–3 days), with its kinds' unit tests (build determinism, grade, team, record round-trip through `listenOf`, `valid` bounds), a bundle-size check (≤ 15 KB gz per game, hub ≤ 25 KB), and one e2e solo plus one co-op run.


### 8b as built (2026-11-06)

- **The engine** (`kikimimi/round/`): `session.ts` `RoundSession` (QuizSession line for line, its quiz specifics moved into the games), `schedule.ts` (`schedule`, `times`, `where`, `fix`), `tally.ts` (`team`, `teamFirst`, `sum`, `rightOf`), `wire.ts` (the session's ops, `RoundOut` / `RoundIn`, `play`'s shape; `quizIn` / `quizOut`, `playIn` / `playOut`, `gameIn`, `toWire`, `SEND_PLAY = false`), `link.ts` (`roundLink`: hears both wires, sends `quiz`; `soloLink`; `wire`), `decks.ts` (`Decks`, `gameKey` gm:seed:o:u), `types.ts`, `registry.ts`. A game's deck is a `RoundDeck` (count, `timing(i)` {lead, play, answer, auto?}, `valid`, `grade`, `score?`, `maxScore`); the session caps rounds at PLAY_ROUNDS, the quiz family's decks at QUIZ_QS.
- **The games** (`kikimimi/games/`): `quiz` (opts `[lv, timer]`, the timer TIMERS' index), `ladder` (the same opts, the lobby's level kept for the switch back and the `quiz` wire's `lv`; its points the climb, a deck score) and `lesson` (opts `[lv, timer, lesson, tier]`, its unit `u`; solo, off the `quiz` wire). Their RoundKinds (`games/quiz/kinds.ts`): `quiz.<type>` per item type and `ladder.rung` (its reveal below the top `auto`). `GameDef.seedBits` keeps the `quiz` wire's flags in the seed's low bits, so `quizOut` sends the seed as it is and `quizIn` reads `gm`, `o` and `f` back from it. `games/quiz/session.ts` `QuizRounds` is the quiz sheet's lobby over the session; `games/quiz/view.ts` `quizView` its view (the old QuizView, plus `gm`, `o`, `u`).
- **Lessons** are now the game `lesson` dealt into my lobby (`QuizRounds.lesson`: the lobby's seed kept, so the same 6 items as before), not a practice deck over the quiz's; `dropLesson` goes back to the quiz (`unlesson`). The row, stamps and recheck are unchanged (recorder.ts reads the deck by the view's key). 8c only has to send it: `play` is the one wire that carries `u`.
- **Hearing `play`**: an 8c phone's lobby is an invite (invite.svelte.ts keeps both kinds), and an 8b phone answers it over `quiz`. Its `cv` is kept on the op, not checked (8c's `blocked: 'update'`); an unknown `gm` or unreadable `o` is ignored. The host's `go` carries `pl` internally (dropped on `quiz`).
- **The shared UI** (`components/kikimimi/frame/`): `RoundFrame` (chips, timer, status line, つぎへ / よみおわった; the game's stage, input and what follows as snippets), `RevealFrame` (sat out, ○ +points / ×, いっぱつ, co-op's count; a game's own line), `Results` (しずえ's line, team tally or ranking, my tally and first listens, おわる / もういっかい; a game's strip and sections as snippets), `ReviewList` (まちがえた だけ, a retry, all right), `ChoiceGrid` (choices, not an Item), `PlayerChip`. Play, Verdict and Results are the quiz's parts over them; every `data-kiki-*` hook is on the same element.
- **Parity**: every session.test scenario (44, one new: a choice out of range) was fed to QuizSession and to the round session on the `quiz` wire side by side, the outputs, the view after every call and the wiring's sends compared; it held, and QuizSession went in the same push (its parity.test with it). session.test is the round session's (round/session.test.ts, + a lesson's game and an 8c phone's `play`), wire.test covers both wires both ways; decks.golden.json unchanged; e2e kikimimi* unchanged, chromium and WebKit 15/15.
- **Deferred to later steps**: `RoundGame` / `RoundSheet` (game.svelte.ts and KikimimiSheet still the quiz's, over the engine), Lobby and Transcript in `frame/`, per-kind `clips` / `review` / `record` / `skills` / `ui` on RoundKind, `cv` per game and the update banner (8c), roles from `pl` (8c), lazy per-game chunks in the registry (all three games ride the sheet's chunk).

### 8c as built (2026-11-06)

- **cv** (§4.2): compile.ts `gameCv(gm, content)` = 6 hex of a hash over the game's id, its `BUILD_V` (games/versions.ts, one per game, bumped by hand) and its deck's content's cv (the existing per-unit cv: ids, order, choice counts, answers, the mix, clip lengths to 10 ms; no text). levels/index.json gains `games` (`quiz:<lv>`, `ladder:ladder`, `lesson:<unit>`); pool.ts `gameCvOf`, a fixture unit's from `addUnit(id, part, cv)`. `GameDef.cv(o, u)` (the defs read it through their source), sent on my `open`. **cv.test**: every game has one and it follows its inputs; cv.golden.json keeps each game's cv and a digest of its decks (seeds 0-19, a lesson's every lesson and tier): decks changed under the same cv fail with "bump BUILD_V"; the same decks under a new cv (a re-voicing's lengths) pass; a deliberate change is `vitest -u`.
- **Blocked:** a heard `play` open whose cv isn't `def.cv(o, u)` (or a game or options this build hasn't) is kept apart as an invite `blocked: 'update'` (the newest invite wins either way), `join` refuses it, a lobby I was in that turns into one is left for it, and it goes with its host (`end`/`leave`, the host's grace, the lobby TTL). A `quiz` open (no cv) is never blocked. The sheet's idle card shows 「アプリを こうしんしてね」 and こうしんする (ui-state/reload.ts `reloadForUpdate`: `newWorker`, then `safeReload`).
- **Roles:** `view().roles` from `go`'s `pl` (a `quiz` go has none: those in by then), a late joiner at their place among those and them, modulo `GameDef.roles` (default: one each). No game reads them yet (jigsaw, co-op calls).
- **Tiers** (`GameDef.tier {of, with}`, the lesson's): the host's tier rides `o`, each player's their `join`'s `tr` (`join(now, g, tr)`; `tier(tr, now)` re-sends it before `go`, when the lobby becomes a lesson). `Game.deckFor(w)` is that player's deck at their tier (the same rounds and timing); tally.ts grades with it, so `team`, `teamFirst` (a co-op lesson's `tm`) and the scores agree on every phone; the view's `o` is mine (my items, my record).
- **Wire:** `SEND_PLAY = true`, `QUIZ_ON_PLAY = false`: mode `WIRE` 'guarded' sends the quiz family as `quiz` and everything else (a co-op lesson) as `play`; 'play' sends every game as `play`; 'quiz' is 8b's. `roundLink(live, mode)`; the e2e's `?wire=quiz|guarded|play`. **The phones' builds (`ws.hello`, 2026-11-06 23:00):** A last on 4096003 and B on 5059da0, both from before 8b (421f15f0), neither has reloaded since 8b deployed. So the quiz family stays on `quiz` until the log shows every phone on 8b or later; then `QUIZ_ON_PLAY = true` (one line; wire.test pins the mode).
- **Co-op lessons:** curriculum-units.md §13. e2e kikimimi-coop (chromium and WebKit): a fixture unit's チェック picked for both from A's shared lobby, both stamped with B at 2/6 (`tm` 6), on the default wire and over the dual stack (B on `?wire=quiz`); B with another cv gets the update card, which reloads.
- **Deferred:** `QUIZ_ON_PLAY` (above); 8d/8e as planned; the tier picker's `join.tr` for other games (increment 11).

## 10. Risks

1. **Subtle regressions in the extraction** (lateness, co-op `had`, beacon timing were each hard-won). Mitigation: the parity test before deleting `QuizSession`, porting session.test case for case, no behaviour change in 8b.
2. **Conflicts with increments 6 and 7** (session.ts, deck.ts and Play.svelte are all being touched). Mitigation: 8a (contract only) can land now; 8b waits for 6 and 7 to merge; their wire hacks are absorbed by `QuizOpts`.
3. **Deploy order** (`play`, or a `gm` row, sent before the relay knows it). Mitigation: contract-first commits, the `SEND_PLAY` switch, gates on the `ws.hello` log.
4. **Slicing m4a in WebKit.** Mitigation: the day-1 spike, with the ADTS fallback.
5. **`cv` too strict** (a deploy window blocks co-play). Mitigation: hash only what shapes the deck; the update banner calls the existing reload path.
6. **Byte budget creep** (`open` at about 197 B). Mitigation: size tests per op at worst case; `ids` capped at 8; extend through `o` and `ev`, never new top-level fields.
7. **Lazy content vs. a pure, synchronous build.** Mitigation: buffer intents per `g` until `load()` resolves; the countdown covers it.
8. **Evicting a pack mid-game.** Mitigation: never evict one used in the last 10 minutes; a missing pack refetches (fetch failure = silent clip, as today).
9. **Schema drift** for games drafted before their engine exists. Mitigation: `schema: 1`, `status: draft` compiles without audio, and kinds may add fields only in a later schema version.
10. **The listening check** remains the content bottleneck (curriculum §13); `/dev/listen` filters to flagged items plus a 20 % sample.

**Total for 8 and 9:** about 6.0 agent-days (8: 3.0 + 0.25 later; 9: 3.0).
