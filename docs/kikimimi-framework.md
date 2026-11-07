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

**Packs.** `static/audio/listen/<unit>.<hash>.pak` holds each clip's finished m4a (mono AAC 48 kbps 24 kHz, as now) concatenated. The unit JSON holds `clips: {id: [offset, bytes, dur_cs, wordsHash]}`, and the slow takes go in a second pack, `<unit>-slow.<hash>.pak`. Sizes: normal ≤ 1.2 MB, slow ≤ 0.8 MB. One file per pack: the quiz's 390 files become about 8, so Pages stays far under 20,000 (11,802 static files today). Past 50 MB in total, packs move to R2 behind `PACK_BASE` (a same-origin route or CORS). The bedtime stories (2026-11-06) have their own 20 MB beside the games' 50: a chapter's packs (~1.3 MB) are fetched only when it's played. The URL scheme doesn't change.

**PackStore** (`components/kikimimi/frame/packs.ts`). `clip(unit, id, slow?)` fetches the whole pack (no Range requests: the service worker passes those through uncached), slices `[offset, offset + bytes)`, and calls a new `engine.loadBytes(key, () => Promise<ArrayBuffer>)` that shares the clip LRU of 4. **Spike on day 1** on a real iPhone: decoding one m4a sliced from a concatenation. If WebKit refuses, the fallback is ADTS AAC frames, which can be sliced at frame boundaries (offsets on frames).

**The spike (9a, 2026-11-06): passed.** Six real clips (a level-1 clip and its slow take, a level-4 dialogue line, a level-6 line, a ladder rung, a 9 s アナウンス PA) concatenated into one file, fetched whole, each sliced `[offset, offset + bytes)` and decoded by `decodeAudioData`, never played (an `OfflineAudioContext`, and an `AudioContext` left suspended, no source ever started). Headless WebKit (Playwright, Safari 27.2's engine on macOS) and the iOS 26.5 Simulator's Safari (iPhone 17 Pro, over safaridriver) both decode every slice to the very samples of the standalone file (same length, every sample equal), in 2-7 ms a clip. A slice is the file's own bytes (each m4a is whole, `+faststart`), so nothing about the container changes. ADTS frames decode too but lose the m4a's priming and padding (their lengths differ from the m4a's by 1,088-1,900 samples, by engine), so the packs stay m4a; ADTS is not needed.

**Service-worker cache** (`caches.ts`): a new `island-listen-v1` for `/audio/listen/`. Cache-first, never revalidated (the hash is in the name), LRU by pack with a byte cap of 30 MB and an index kept in the cache (the room cache's `roomEvict` pattern). A pack used in the last 10 minutes is never evicted, so a game in progress keeps its pack. Built 2026-11-06 (9c): 42 packs, 39.7 MB, in place of 1,559 loose clips (38.7 MB); static/ 12,969 files → 11,452 (static-files.test keeps it ≤ 15,000); the `kiki` class went with the loose clips. The lobby fetches the first question's pack alone, then the rest: on DevTools' Fast 4G a level-4 deck's first pack lands in ~2 s, not the 6.3 s of all its packs at once (docs/kikimimi.md "Audio", Fetching).

**`/dev/listen`** (`src/routes/dev/listen/+page.ts`: 404 outside `vite dev`, as /dev/characters is). For each unit: the items with ▶︎ from the pack, 🐢, transcript, marks and karaoke, the whisper report row (WER, UTMOS, similarity, flags), filters (flagged, unchecked, per voice), and a ✓ / ✗ + note. A Vite dev-server plugin (`/__listen/check`) appends to `content/listen/checks/<unit>.json`. The compiler ships only units whose audio is checked (`listened`, curriculum §12); others compile with `status: draft` and are hidden by each game's gate, the way `LEVELS` works today.

## 7. Later games on GameDef (10–19)

| # | Game | `gm` | Rounds and kinds | Answer | Timing | Notes |
|---|---|---|---|---|---|---|
| 10 | ことば タイル | `tile` | 8 sentences, kind `tile` | array: tile indices in order (≤ 12), decoys included | play = clip; answer 30 s | Co-op 「half the tiles each」: role 0 gets even slots, role 1 odd; `team` is the union. Reveal shows the spoken shape (marks `say`). `pick` = wrong-slot bitmask |
| 11 | みみ チェック | `check` | 12 adaptive rounds drawn from other games' kinds (`quiz.*`, `tile`, `news.gist`) | that kind's | that kind's | Solo, `def.next` (up after 2 right, down after 1 wrong, stop after two reversals). Output: per-skill stage in a `check` row (`gm: 'check'`). **Built 2026-11-07** (kikimimi-ux.md U6): solo only so far, items drawn from the places' quiz items (tiers in shared games not done). Tiers go on `join.tr` in shared games, and `BuildCtx.tiers` picks each phone's choice set (same audio) |
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

### G-たいかい logic as built (2026-11-07)

しずえの しゅうまつ たいかい (curriculum §7.1, kikimimi-ux.md §7.1) as a GameDef, no UI yet: `games/taikai/`.
- **Window** (`window.ts`): offered Fri 18:00 – Mon 05:00 Tokyo (`taikaiAt(now)`: open, its span or the next, its Friday `fri`, which names it); `taikaiOfDay(d)` files a row's day under its weekend (Monday the one before); `taikaiDays(fri)` the misses' days, its week's Monday on.
- **The deck, and why `ids`.** A phone knows only its own player's answers (the partner's rows are summaries), so no phone can deal the others' misses from a seed. Each player's phone offers its own misses in the lobby (`weekMisses` → `offerOf`, ≤ 4 numeric ids) as `ev` ops (`e` EV_MISS, `i` the slot, `x` the id: the contract's reserved op, no relay change); the host picks (`taikaiPick`: the offers round-robin A B G, fresh items at each player's level to fill, the hardest last as the wager, the rest interleaved by type and level) and sends the pick as the `open`'s `ids` (≤ 8: 7 questions and the wager), again whenever an offer changes it (`configure({ids})`). Every phone deals from the open alone (`taikaiItems(seed, ids)`: the choices shuffled by the seed). Numeric ids are each item's place in the index, level by level (`numbering`); the game's cv (`taikai:all`, compile.ts: every level's content) makes them the same on both phones.
- **Session** (round/): a set-up carries `ids` (`open`, `configure`, the deck's ctx, re-dealt when they change); `event(i, e, x)` sends an `ev`, kept per player and slot and sent again with a player's `join` when someone comes back; the view gains `ids`, `evs` and `tiers` (each joined player's, for the target). wire.ts carries both on `play` (never on `quiz`).
- **Tiers and points:** a player's tier 0–3 is their comfortable level's place (`tierOf`; unmeasured かわ), the host's in `o` (`[tier, timer]`), a player's on `join.tr`. A right question pays 100 × (1.5 − expected at that tier): 50 for a sure thing, up to 150 for a stretch, so in しょうぶ the B1+ partner can win.
- **The wager** (the last round): 100 round-only chips, a bet of 10–100 before choosing, the answer `[choice, bet / 10]`; right pays ×2, wrong loses it; 15 s more to answer. A bet ≥ 70 missed is `wagerReveal` 'confident-miss', the big reveal (hypercorrection). Chips are never kept: no かいがら.
- **Results:** co-op (default) counts the team's rounds against しずえ's target (`taikaiTarget`: the rounds someone should get at their tier, rounded, short of all; gold two more); `trophyOf` bronze / silver / gold. The row: `gm` 'taikai', `u` the trophy, `lv` the tier's level (`taikaiRow`); `trophiesOf(rows)` the best per weekend for the tent. しょうぶ ranks by points plus chips.
- **For the UI:** `source.ts` (`taikaiSource`, `TAIKAI_IDS`, `taikaiPool`, `taikaiLevels` to load, `taikaiDeals`), `taikaiGame(taikaiSource)` into the registry; the recorder's pick is `choiceOf(a)`.

### Listen parts as built (W2-C1, 2026-11-07)

The listening kinds (`tile`, `call`, `tachi`; content/listen/*.yaml, not story/) compile with the levels (`npm run kikimimi:levels`). `kikimimi/listen.ts` holds their types, the checker and the clip ids. It is for the compiler, the scripts and the tests (it reads the roster); the phone imports its types only. A problem in any file stops the compiler, and content.test runs the same checker.

- **Part** `levels/parts/<unit>.json` (≤ 32 KB gz), pool.ts `Part.listen`: `{"listen": {unit, game, stage, status, cando, items}, packs, clips, words}`. `items` are as authored (listen.ts `TileItem`, `CallItem`, `TachiItem`) minus `tts`, with a `clip` id on every tile and on every line of a call or a たちぎき (the stories' `segments[].clip` pattern), so a game never derives an id. A derived tile's `clip` is its bank item's id, and it carries that item's `speaker`.
- **Index** (pool.ts `Index`): `units[<unit>] = {parts: [<unit>], n, cv}`, so `load(<unit>)` works as it does for a level; `listen[<unit>] = [game, stage, status]` for the catalog, with no part loaded; `games['<gm>:<unit>']` (`tile:s1-tile-a`) = `gameCv(gm, cv)`, written only once games/versions.ts `BUILD_V` has the game (re-run kikimimi:levels after adding it). The cv covers ids, kinds and answer shapes (tiles and decoys; halves and the memo's option counts and answers; speakers, `at` and round answers) and clip lengths, never text.
- **Gate:** every status compiles. Past `draft`, every clip must exist, or the compiler fails; the games show `listened` only (§6).
- **Clip ids** (`listenClipIds`): a tile's id, or its `clip`; a call's or a たちぎき's lines are `<id>-<n>` (n from 1). The audio script speaks them at level stage + 1 (S1 かわ → 3: no slow take), a call's `me` in the file's `cast.me`, a call in its phone band. It reads a draft file only under `--only`. Each file's clips go in its own pack (`s1-tile-a`, kikimimi-packs.ts).
- **Checks** (beyond the README's): US voices only; the US-only lint (`notUs`, over `en`, lines and plan choices, never `tts`; `accent-exposure` exempt), an error on content/listen and on the units' items and a warning on the bank (none today); ids apart from every bank, unit and rung clip. **Japanese help** (bank.ts helpProblems) is checked wherever it appears, and required past draft at these places: a tile's `ctx` and `why`; a call's `ctx`, each memo round's `why` and each slot's `cja` (one per option); each たちぎき round's `ctx` and `why` (the plan round's `cja`, one per choice, optional).
- **Later kinds:** `rush` came with W2-4 ("すうじ ラッシュ as built"), `news` and `weather` with W2-5 ("しずえの ニュース as built").

### The registry as built (W2-C2, 2026-11-07)

Every game goes through `kikimimi/round/registry.ts` as a **lane**. The quiz, ladder, lesson, taikai and check lanes (`games/<gm>/lane.ts`) ride the sheet's chunk. A later game is one `LATER` line, `tile: { lane: () => import('../games/tile/lane.ts') }`, and is its own chunk. A lane implements:

| Field | |
|---|---|
| `id`, `def(phone)` | its GameDef over the phone's deck cache (`phone.items(d)`, `phone.cv(gm, unit)`) |
| `chunks(d)`, `deal(d)` | the pool.ts chunks a deck needs, then its items from them (pure; a listening file's part is pool.ts `listenOf(unit)`) |
| `byIds?` | its deck is the open's `ids` (the cache keys on them) |
| `seed?`, `solo?` | the host's seed (recent.ts), a solo game's own deck |
| `myTier?` | my `join.tr` for a game I join |
| `ahead?` | chunks to preload while it runs |
| `opts?` | a lobby's options from the mode page's level and timer (default `[lv, timer]`; they always lead with those two) |
| `title?` | the title bar's key while it runs, or in another's lobby |

- **Its pages:** `components/kikimimi/<gm>/views.ts` exports `views: { lobby?, play?, results? }`, each loaded with `import()`. The sheet finds them by folder name (an eager glob) and mounts the one for the current phase with `{ game, onagain, onmissed, ondone, onhub }`. Without one it shows the quiz's Lobby, Play or Results.
- **Strings:** `i18n/kiki-<gm>.{ja,en}.json` (keys `kiki.<gm>.*`) plus a `kiki-<gm>.ts` that calls `addCatalog`, imported by its lane.ts. usage.test, fonts.test and linebreaks.test pick the files up by glob.
- **Loading:** game.svelte.ts loads a later game's lane before the session takes its `open` (ChunkQueue waits on it), then its deck's chunks.
- **Catalog:** each mode has a shelf, an icon, `places` and `game` (catalog.ts). A lane's mode shows once its `LATER` line exists and a file of its game is `listened` (`LANES.ready`), or once its line's `content()` says so. The five wave-2 modes are pre-registered; their names and about lines are in the main ききみみ catalog. A mic mode brings its own `mode` on its line (`addMode`): the shelf `koe` (声に出す, last, hidden while empty), `gate()` (shown only while true on this phone) and `requires: 'mic'`. きまぐれ never picks a mic mode.
- **Budget** (kikimimi-budget.ts): a later lane.ts chunk and every view in `components/kikimimi/<gm>/` are ≤ 15 KB gz each, and at least one view of a game folder must be lazy. frame/Sandwich is ≤ 15 KB once it exists. A listening part is ≤ 32 KB.
- **Not here:** a game's `BUILD_V` (games/versions.ts, one line a game) comes with its deal. After adding it, re-run `npm run kikimimi:levels` and teach cv.test's `decksOf` the new deal.
- **Added with W2-1:** `Lane.record` (my row's answers when they aren't choices; the row then carries its `gm`: recorder.ts), `Lane.opts` gets my comfortable `level` (a host's tier), and the quiz view keeps a later game's raw answer as `a` (mine and, at a reveal, each player's pick). A game's strings are imported by its views, not its lane (deps.test: kikimimi/ may not import i18n/).

### The listening games' shared pieces (2026-11-07 review)

ことば タイル, たちぎき and ようじ でんわ share `games/listened.ts` (pure): `EMPTY` (63), `ROLES` (2), `listenOpts` (`[lv, timer, ear]`), `filesOf(gm, lv)` (the `listened` files at the place), `tierAt`, `shareOf` (a role's slots or rows), `cvOver`, and `listenGame` / `listenRecord` over a game's `ListenRules` (its rounds at an ear, timing, valid, ok, the row's `pick`). Each lane.ts is one line, `listenLane(RULES, deal)` (games/listenLane.ts). The pages share `components/kikimimi/listenView.ts` (`isCoop`, `roleOf`, `easy`, `blank`, `playAgain`). A new listening game writes its rules and deal, not a deck.

### ことば タイル as built (W2-1, 2026-11-07)

`games/tile/` (def.ts pure, lane.ts) and `components/kikimimi/tile/` (TilePlay, TileResults, board.ts); strings in i18n/kiki-tile.*.
- **Deck:** options `[lv, timer, ear]`; the `listened` tile files at the lobby's place, 6 sentences by the seed, the shortest first. A card is an Item whose `id` is the clip it plays (a derived tile's bank clip), its `tile.id` the row's id.
- **Tiers:** each player's `ear` (0 はまべ … 3 やま: taikai's `tierOf` over the comfortable level; unmeasured かわ) against the deck's place: below easy (the first authored decoy, my first slot placed for me), above hard (the authored decoys topped up to 3–4 from a sound-swap table over the sentence's own words), else as authored. The host's ear rides `o`, a player's `join.tr`.
- **Answer:** the board's index per slot, `EMPTY` (63) for a slot not filled; valid: one per slot, within the board, each tile once. Right: every filled slot holds its word (by text: a word twice is either tile) and they're the whole sentence or one role's half. 100 a right sentence; a replay costs nothing (the row's `rp`).
- **Co-op:** `roles: 2`; role 0 fills the 1st, 3rd, 5th… slots, role 1 the others; the partner's slots are dashed. The team builds a sentence when both halves are right (`team.all`); the reveal shows the team's sentence from both answers (each on its owner's board); the results' 「ふたりで k / n」 is that count.
- **Row:** `gm: 'tile'`, each round I had `[tile id, ok, wrong-slot mask, rp]` (`tileRecord`; `wrongWords` reads a mask back).
- **e2e** kikimimi-tile (solo, co-op): the built index's s2-tile-bank flipped to `listened` as the test serves it; nothing ships listened.

### たちぎき as built (W2-2, 2026-11-07)

`games/tachi/` (def.ts pure, lane.ts) and `components/kikimimi/tachi/` (TachiPlay, TachiResults, board.ts); strings in i18n/kiki-tachi.*.
- **Deck:** options `[lv, timer, ear]`; the `listened` tachi files at the lobby's place, 2 conversations by the seed, each 3 rounds in turn: opinions, changed, plan (6 rounds, ~3 min). A card is an Item whose `id` is the conversation's (its lines' clips `<id>-<n>`), its lines with `at`, the round's `ctx`/`why` (the plan's `ja`/`cja`), `tachi.row` the row's id (`<id>-op|ch|pl`).
- **Timing:** the conversation plays before the opinions round only (`play` its length: clips.ts `itemDur` over the offsets; answer +10 s); changed and plan have no lead and no clip, and clipPlayer plays nothing there and no replay at any reveal (`quietReveal`). After the first play each line replays alone (a chip per line, its face and number; `game.hear` of the line's clip, so not counted in `rp`).
- **Offsets** (clips.ts): `lineGaps` (a line's `at`, else LINE_GAP) feed `sequenceStarts` and `itemDur`, on the audio clock; clipPlayer's `talk` keeps the latest line begun and `all`, every line under way (two in an overlap). Transcript seats speakers by first line: two left/right, three left/centre/right (yuzu tint, set in).
- **The party bed:** a card from a file tagged `party` has `bed: 'party'`; clipPlayer plays static/audio/beds/party.<sha8>.m4a (a copy of scripts/tts/beds/party.m4a, board.test checks it) under the whole sequence, a line replay too: from the item's place in the loop, 0.5 s before to 0.35 s after, 0.25 s fades, at −1 dB (the light +15 dB SNR), one AudioBuffer built per play (`bedSamples`).
- **Answers:** opinions `[speaker of claim 0, 1, 2]` (0-2 by first line, EMPTY 63); changed a speaker; plan a choice. Opinions is right when every placed face is at its claim and the faces are all three or one role's two (`facesOf`).
- **Tiers:** ear below the deck's place is easy: the third speaker's claim placed (not movable).
- **Co-op 「たんとう」:** `roles: 2`; role 0 follows the first speaker, role 1 the second, the third is shared (the seats say 「あなたの担当」「ふたりで」「相手の担当」); in opinions each places their own face and the shared one; everyone answers changed and plan. The results' 「ふたりで k / n」 is `team.all`.
- **Row:** `gm: 'tachi'`, each round I had `[row id, ok, pick, rp]`: the pick a choice, or opinions in base 4 (3 none; `opinionsOf` reads it back).
- **e2e** kikimimi-tachi (solo, night shots, co-op): s2-tachi-a/b flipped to `listened` as served; nothing ships listened.

### ようじ でんわ as built (W2-3, 2026-11-07)

`games/call/` (def.ts pure, lane.ts) and `components/kikimimi/call/` (CallPlay, CallResults, MemoPad, Basket, CallLog, board.ts); strings in i18n/kiki-call.*.
- **Deck:** options `[lv, timer, ear]`; the `listened` call files at the lobby's place, 3 calls by the seed, **2 rounds each**. Round 1 is the call itself (an Item with `lines`, its clips `<id>-<n>`, played on the relay clock as a dialogue; its `play` the lines plus LINE_GAP, 2 s a line while unvoiced); round 2 is `<id>-memo`, no clip and `play` 0, so nothing sounds. Two memo rounds play as authored; one memo is split, its first half in round 1.
- **Tiers** (ear against the place, `tierAt`): easy 2 rows, as authored 3, hard 4 plus a sound-trap chip on a number's row (`trapOf`: teen ↔ -ty, else two digits swapped; placed in order among ascending numbers).
- **Answer:** the chip per row, `EMPTY` (63) for none; right: every filled row right, and they're the whole memo or one role's share. The chips take taps while the call plays; 「メモできた」 sends once it ends. 🔁 in round 2 is `game.hear` (not counted as a replay).
- **Co-op 「わけて メモ」:** `roles: 2`, both hear the whole call; a round's rows split by place (role 0 the 1st, 3rd…), a round of one row both's. The team's memo (`unionOf`, by the row's place in the call) shows a wrong chip over a right one; a co-op reveal shows the partner's own rows too.
- **Reveal:** the right chip (○) and its `cja` when it reads otherwise, a wrong pick struck, the errand's basket (`basketOf`: every row of the call at my tier, caught, missed or still to come), and at round 2 the `note`, 解説 (a split memo's at round 2, two memos' each at its own) and the transcript (言い直し, 途切れた). PhoneFrame's `bars` drop to 1 while a `signal` line ("...") plays.
- **Row:** `gm: 'call'`, each round I had `[call id, ok, wrong-rows mask over the call's memo, rp]` (`callRecord`; `wrongRows` reads it back).
- **Shared fix:** quiz/view.ts reads a two-int answer as a wager only in the tournament (a two-row memo was taken for one).
- **e2e** kikimimi-call (solo, night, co-op): the built index's s1-call flipped to `listened` as the test serves it; nothing ships listened.

### すうじ ラッシュ as built (W2-4, 2026-11-07)

`games/rush/` (def.ts pure, lane.ts over listenLane) and `components/kikimimi/rush/` (RushPlay, RushResults, Counter, board.ts); strings in i18n/kiki-rush.*.
- **Content:** `scripts/kikimimi-rush.ts` (`npm run kikimimi:rush`; `--check`, `--clips`) expands 60 frames (30 かわ, 30 もり; six counters: café, konbini, ticket window, deli on a trip in dollars, taxi stand, pharmacy) four times each, by four of the 12 US voices, into s1-rush.yaml and s2-rush.yaml: 240 customers, one clip each, a third corrected at seeded random places. A frame's line comes plain or with a slip (`w`, then the cue: make that, I mean, sorry, no wait, scratch that, hang on, did I say…), sometimes with a second number (`o`). The four chips are the answer, the slip, `o`, the -teen / -ty twin and near values, ascending, with `cja`, `why` and `note` written from the frame. listen.ts kind `rush`: `at`, `speaker`, `en`/`tts`/`ja`, `ask`, 4 `options`, `answer`, `was` (with the self-repair feature), the help required past draft (`ctx`, `cja`, `why`). Its shape for the cv holds the chips, since a tier keeps them by their numbers. rush.test checks the files are as generated and kept apart from the bank (near-duplicates among rush items are exempt).
- **Deck:** options `[lv, timer, ear]`; 8 customers by the seed, never two of one frame. A card is an Item (`type: 'num'`, choices the authored chips), `rush: {ask, at, was, b}`.
- **Tiers** (the ear against the place): hard all 4; as authored 3, the farthest from the answer dropped, but never `was` or the -teen / -ty twin (`twins`); easy 3, `was` dropped. The row's pick is the chip as authored.
- **Timing:** the answers open when the order ends; 8 s (`WINDOW`) whatever こたえる じかん, none with なし.
- **Points:** a right ticket pays `questionPoints(ear, b)`, with b the place plus 0.5 for a correction (the tournament's rule), so しょうぶ (`modes.vs`) works against expectation. Co-op results count customers, not points.
- **Co-op 「ふたつの レジ」:** `roles: 2`; customer i goes to register `i % 2`. The other phone answers `PASS` (99) as its window opens. PASS is valid, never right and has no row, so the team's `team.right` is the customers served. The partner's pick is shown on my chips at the reveal.
- **Combo:** customers served right on the first listen in a row (mine without a replay; co-op the partner's as each reveal showed them, board.ts `HEARD`). A miss resets it, the customer says the line again (one replay at the reveal), and the line goes on. The results show the best combo.
- **Audio:** none yet. Both files stay `draft`. Batch A3 voices them with `npm run audio:kikimimi -- --only '^rush-'` (240 clips; `--clips` lists them), the café, konbini and deli lines on the café bed and the ticket window on the station one. bank.test's every-clip rule now applies per file.
- **e2e** kikimimi-rush (solo with one miss, night shots, co-op on two phones): both files flipped to `listened` as served; unvoiced, each order plays 2 s of silence.

### しずえの ニュース as built (W2-5, 2026-11-07)

`games/news/` (def.ts, weather.ts pure; lane.ts) and `components/kikimimi/news/` (NewsPlay, NewsStage, NewsResults, board.ts); strings in i18n/kiki-news.*. On じっくり only (no places, no hub card); きまぐれ picks it like the other shelves' modes.
- **Content (B5):** content/listen/news-a.yaml and news-b.yaml, stage 4 (やま), 15 bulletins each (spring, summer, any; autumn, winter, any), 7 with a `weekday` (one each). listen.ts kind `news`: `season`, `weekday?`, two `segments` (`island` or `season`, then `tokyo`) of 3-5 lines read by しずえ (`cast.isabelle`: us-f4), 100-170 words; `gist` and `detail` each 4 English choices, `answer`, `trap`, `cja`, `why`; `ctx`. Its clips are `<id>-<n>` over both segments. The kind `weather` (one item, news-a's `news-wx`) holds the tail's sentences: 8 skies (each with the umbrella question's `why`), the high as a template (`{n}`, `one` for 1 degree), 6 alerts, the sign-off. The compiler expands it to 56 clips (`news-wx-sky-rain`, `news-wx-hi-23`, `news-wx-hi-m2`, `news-wx-alert-heat`, `news-wx-end`): each high is shown as a figure and spoken in words.
- **The weather:** the relay's timeline now carries `hi` (`[tokyoDay, °C]`, the day's high: relay/src/weather.ts `highOf`; a changed high is sent). weather.ts `newsWxOf` reads the sky over 06:00 (or now) to 21:00 Tokyo time, or after 18:00 the next six hours: sunny, partly, cloudy, later, clearing, rain, storm or snow. It also reads any fog and the high (−2…38 °C). `tailKeys` gives the sky, the high, at most two alerts (storm, snow or fog, then heat ≥ 35, hot ≥ 30, cold ≤ 5) and the sign-off. With no timeline that serves, the sign-off follows segment 2 and there's no umbrella question.
- **Deck:** the lobby's seed is the Tokyo day (`Lane.seed`, the scene clock). `bulletinOf` takes those of the day's season or `any`, a weekday's only on that day, in id order, `day % n`. The options are `[lv, timer, ear + 4 × sky byte, high byte]` (`newsOpts`: the host's weather, so every phone plays and grades the same tail). The cards: the gist (the bulletin, its lines then the tail's, a weather line naming its own clip: bank.ts `Line.clip`), `<id>-d` and `<id>-kasa` (only with the weather; いる when it rains or snows), the last two with no clip.
- **Tiers:** easy shows the answer and its `trap` only; else all four. The question count is the same for everyone (co-op shares one session), so easy never drops the detail.
- **Rounds:** the bulletin plays before the gist, then the answers (+5 s to read). After the first play, NewsStage's story chips replay a segment (`segItem`, `game.hear`). The last reveal shows the note and the whole bulletin.
- **Co-op:** everyone answers every question; 「ふたりで k / n」 is `team.all`. **Row:** `gm: 'news'`, `[card id, ok, choice as authored, rp]`.
- **Audio (A3):** 291 clips: 235 bulletin lines and 56 weather sentences, in us-f4 at −18 LUFS like the stories (`--only '^news-'`). Both files stay `draft` until the listening check. Joins happen between sentences only, and they're judged on the iOS Simulator.
- **e2e** kikimimi-news (solo, night shots, co-op): both files flipped to `listened` as served, the weather planted in `island.wx` on the `?date=` day (dry, then rain from 15:00, 17 °C).

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
