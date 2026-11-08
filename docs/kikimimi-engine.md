# ききみみ engine: rounds, the wire, content and audio

The platform under every ききみみ game: the round engine and its games, the presence wire, the content compiler and lazy loading, the audio pipeline and packs. The player's side is [kikimimi.md](kikimimi.md); what is taught, [curriculum.md](curriculum.md); the mic modes, [kikimimi-mic.md](kikimimi-mic.md); the relay's side, docs/backend.md ("Live relay", "Events" `listen`, "Service worker").

## Files

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
  games/<gm>/     def.ts (a pure GameDef) and lane.ts: quiz, ladder, lesson, taikai, check, tile, tachi, call, rush, news,
                  mane, kuri, pair, role; listened.ts + listenLane.ts for the listening games; versions.ts (BUILD_V)
  bank*.ts, dialogues.ts, content/, source.ts, ladders.ts   the TS banks (BANK, LADDERS)
  deck.ts, mix.ts, score.ts, clips.ts, staging.ts, marks.ts, conditions.ts, speech.ts, cast.ts
  compile.ts, pool.ts, packing.ts, units.ts, listen.ts, story.ts, levels/   the compiler and its output
  catalog.ts, today.ts, week.ts, path.ts, letters.ts, stamps.ts, stages.ts, lesson.ts, bedtime.ts, friendship.ts, zukan.ts
  progress.ts, srs.ts, advice.ts, report.ts, tags.ts   きろく, over every game's rows
app/src/lib/components/kikimimi/
  frame/          RoundFrame, RevealFrame, Results, ResultsShell, ScoreCard, ReviewList, ReviewRow, LineRow, HearButton,
                  Note, FirstStamp, ChoiceGrid, PlayerChip, Why, Sandwich, SandButton
  <gm>/views.ts   a game's lazy lobby / play / results pages
  nav.ts, KikimimiSheet.svelte, game.svelte.ts, clipPlayer.svelte.ts, chunkQueue.ts, packs.ts, recorder.ts, actions.ts
  hub/, asobu/, mode/, path/, zukan/, story/, taikai/, settings/, onboarding/, lesson/, scene/, mic/   (lazy)
  Lobby, Play, Results, Verdict, Transcript, Progress, LessonIntro   the quiz's pages and shared pieces
  KikimimiHost.svelte, invite.svelte.ts   always loaded; hear `quiz` and `play`
app/src/lib/sync/storage.ts   DEVICE: kikimimiLv, kikiStage, kikiSame, kikiJa, kikiWeekGoal, kikiOnboarded, kikiStory, kikiZukan,
                              kikiLandmarks, kikiMada
app/content/units/, app/content/listen/ (README.md: the listening schemas), app/content/mic/
```

## The round engine

### Types

`round/types.ts`. A game's review, row, clips and pages live in its lane and views, not on the kind.
- `GameId`: `/^[a-z][a-z0-9]{1,7}$/` (`GM_RE`). `AnswerValue`: an int 0–255, or ≤ 12 ints 0–63 (tiles, memo rows, faces).
- `RoundTiming {lead, play, answer, auto?}` in ms: the pop-in (1500; 0 for a follow-up round), the audio as scheduled, the limit from the play's end (30 / 20 / 60 s or Infinity), and `auto` (the reveal moves on by itself after `WINDOWS.auto`, 3 s). Every other reveal is untimed.
- `RoundKind {id, play, valid, grade, auto?}`; `Round {kind, id}`; `Graded {ok, pts}`.
- `RoundDeck {count, round, timing, valid, grade, score?, maxScore}` (`score` for a deck scored as a whole: the ladder's climb).
- `GameDef {id, modes {solo, coop, vs, same}, opts {encode, decode}, seedBits?, deck(seed, o, ctx), cv?, tier?, roles?, next?}`: `seedBits` keeps the `quiz` wire's flags in the seed; `next` deals an adaptive game's next round (みみ チェック, くりかえし).

**Roles.** `go` carries `pl`, the host's bitmask of players at the start (A=1, B=2, G=4). Every phone derives `players = ORDER.filter(in pl)` and `role(who) = index`, deterministic; a late joiner takes `index % roles` (`GameDef.roles`, default one each).

**Tiers** (`GameDef.tier {of, with}`): the host's tier rides `o`, each player's their `join`'s `tr`. `Game.deckFor(w)` is that player's deck at their tier (same rounds and timing); tally.ts grades with it, so `team`, `teamFirst` and the scores agree on every phone.

### RoundSession

`round/session.ts`, pure: it folds intents and the clock into `{phase, players, answers, scores, i}`.
- `new RoundSession({me, defs, windows?, random?, seedFor?})`; `open({gm, o, same?, vs?, u?, ids?})`. A `Game` holds `gm, o, f, cv, u?, ids?, pl?`.
- The host clock (`adopt`, `fix`, `rebase`, never-decreasing `schedule()`), `late` → `out`, host grace, re-sends on presence, early reveal, `had`, the team tally, `close`, `prune` ("The host is the clock").
- `answer(a, rp, now)` validates with `deck.valid`; the running total `s` sums `grade().pts`, capped at `maxScore`; rounds ≤ `PLAY_ROUNDS` (32), the quiz family's decks `QUIZ_QS` (8).
- A heard `open` whose cv isn't mine, or of an unknown game or options, is an invite `blocked: 'update'` (the newest invite wins; `join` refuses it; the card offers こうしんする, ui-state/reload.ts). A `quiz` open has no cv and is never blocked.
- With `def.next` and a local game, the next round is dealt as a reveal ends.
- `view(now)` adds `gm, o, cv, u, roles, blocked, ids, evs, tiers`.

**Content before the deck.** A deck is dealt synchronously but content loads lazily: game.svelte.ts holds a heard `open` and everything after it for that game (chunkQueue.ts) until its lane and chunks are in, then hands them to the session in order. A part is ≤ 60 KB gzipped, well inside the 4 s countdown.

### The quiz as a GameDef

`games/quiz/def.ts`: `opts [lv, timer]` (timer: `TIMERS`' index); the deck is `deck(seed, lv)`, a round per item (`quiz.<type>`, games/quiz/kinds.ts), `play = itemDur`, `grade = points(right)`. スピード はしご is the game `ladder` (the same opts; one `ladder.rung` round per rung, the lower rungs' reveals `auto`, the deck's `score` the climb). `lesson` (opts `[lv, timer, lesson, tier]`, its unit `u`) is a unit's lesson dealt into my lobby (curriculum.md "Lesson decks and stamps"). `games/quiz/session.ts` `QuizRounds` is the quiz sheet's lobby over the session. にがて れんしゅう stays a local deck (srs.ts).

### The registry

Every game is a lane in `round/registry.ts`. The quiz, ladder, lesson, taikai and check lanes ride the sheet's chunk (`EAGER`); a later game is one `LATER` line, `tile: { lane: () => import('../games/tile/lane.ts') }`, and its own chunk. A lane has:

| Field | |
|---|---|
| `id`, `def(phone)` | its GameDef over the phone's deck cache (`phone.items(d)`, `phone.cv(gm, unit)`) |
| `chunks(d)`, `deal(d)` | the pool.ts chunks a deck needs, then its items from them (pure) |
| `byIds?` | its deck is the open's `ids` |
| `seed?`, `solo?` | the host's seed (recent.ts), a solo game's own deck |
| `myTier?` | my `join.tr` for a game I join |
| `ahead?` | chunks to preload while it runs |
| `opts?` | a lobby's options from the mode page (default `[lv, timer]`, always leading with those two) |
| `record?` | my row's answers when they aren't choices (the row then carries its `gm`: recorder.ts) |
| `title?` | the title bar's key while it runs |

- **Pages:** `components/kikimimi/<gm>/views.ts` exports `views: { lobby?, play?, results? }`, each `import()`ed; the sheet mounts the one for the phase, else the quiz's.
- **Strings:** `i18n/kiki-<gm>.{ja,en}.json` (keys `kiki.<gm>.*`) plus a `kiki-<gm>.ts` that calls `addCatalog`, imported by the views (deps.test: kikimimi/ may not import i18n/).
- **Catalog:** each mode has a shelf, an icon, `places` and `game` (catalog.ts). A lane's mode shows once its `LATER` line exists and a file of its game is `listened` (`LANES.ready`), or its line's `content()` says so. A mic mode brings its own `mode` (`addMode`): the shelf `koe`, `gate()` and `requires: 'mic'`. きまぐれ never picks a mic mode.
- **A new game:** its lane, views and content; its `BUILD_V` line (games/versions.ts); `npm run kikimimi:levels`; teach cv.test's `decksOf` its deal. Tests: its kinds (determinism, grade, team, the row's round-trip through `listenOf`, `valid` bounds), the budget, one e2e solo and one co-op (Chromium, logic only).

### Shared UI

`components/kikimimi/frame/`: `RoundFrame` (chips, timer, status line, つぎへ / よみおわった; the game's stage and input as snippets), `RevealFrame` (sat out, ○ / ×, いっぱつ, co-op's count), `Results` / `ResultsShell` (しずえ's line, the game's sections, おわる / もういっかい) around a `ScoreCard`, `ReviewList` / `ReviewRow` (まちがえた だけ, ▶︎ then the game's text), `LineRow` (a voice game's line), `HearButton` (▶︎ / 🐢), `Note`, `FirstStamp`, `ChoiceGrid` (choices, and the mic's answer slot), `PlayerChip`, `Why`, `Sandwich` / `SandButton`. `Transcript` (seats: two speakers left/right, three left/centre/right, overlaps from line offsets) and `scene/*` sit at components/kikimimi/. Every `data-kiki-*` hook stays on its element.

## Sync

Two presence-only intents (contract/live-protocol.ts): unstored, unacked, never replayed, sent to all others, allowed for the guest (`guestMaySend`). Client messages ≤ 210 bytes (the relay adds `who` and `t`, ~35; 256 is the cap); wire.test builds the maximal message for every op. The relay deploys first for any contract change. A lobby kept alone and its game send nothing. The banner and the sheet reuse the island's Live (`relay ?? demoRelay`).

### The quiz wire

`{kind:'quiz', g, op, …}`, the quiz family's while `QUIZ_ON_PLAY` is off:

| op | sender | fields | meaning |
|---|---|---|---|
| `open` | host | `g, seed, lv, same` | a lobby open to the others; an invite, dropped if the host leaves or after 10 min |
| `join` / `leave` | anyone | `g` | joining or leaving |
| `go` | host | `g, at` | the game starts at relay time `at` (now + 4 s) |
| `a` | player | `g, i, k, rp, s` | the answer to question i: choice k, `rp` replayed, `s` the running total |
| `skip` | host | `g, i, at` | the host's position: question i starts at `at` (8: the results); on つぎへ and every 3 s |
| `skip` | player | `g, i, at` | `i` the sender's question: its よみおわった; `i` the next one: its つぎへ with the host gone |
| `end` | host | `g` | the game is cancelled |

Validation: `g` `/^[a-z0-9]{4,8}$/`; `lv` 1-8; `i` 0-7 (`a`), 0-8 (`skip`); `k` 0-3; `s` 0-1040 (`QUIZ_MAX_S` in contract/live-protocol.ts; now at most 800); `seed` uint32: bit 0 たいせん, bit 1 スピード はしご, bits 2-3 こたえる じかん (seed.ts `TIMERS`: 0 → 30 s, 1 → 20, 2 → 60, 3 → none). Flags on the seed need no new field and no relay deploy.

### The play wire

Every other game, and the lesson (the one wire that carries `u`):

```ts
export type PlayWire =
  | { g: string; gm: string; op: 'open'; cv: string; seed: number; f: number; o: number[]; u?: string; ids?: number[] }
  | { g: string; gm: string; op: 'join'; tr?: number }
  | { g: string; gm: string; op: 'leave' | 'end' }
  | { g: string; gm: string; op: 'go'; at: number; pl: number }
  | { g: string; gm: string; op: 'a'; i: number; k: number | number[]; rp: number; s: number }
  | { g: string; gm: string; op: 'skip'; i: number; at: number }
  | { g: string; gm: string; op: 'ev'; i: number; e: number; x?: number };   // the tournament's miss offers; free for extras
```

`playOf` keeps known fields only: `gm` `GM_RE` (never matched against a list: the relay doesn't know the games); `cv` `/^[0-9a-f]{6}$/`; `f` 0–7 (bit 0 おなじへや, bit 1 たいせん); `o` ≤ 4 ints 0–255; `u` `/^[a-z0-9-]{1,12}$/`; `ids` ≤ 8 ints 0–99 999; `tr` 0–3; `pl` 1–7; `i` 0–31 (`a`, `ev`), 0–32 (`skip`); `k` 0–255 or 1–12 ints 0–63; `rp` 0–99; `s` 0–9 999; `e`, `x` 0–255, 0–65 535. The worst `open` is ~197 B. Extend through `o` and `ev`, never new top-level fields.

### The host is the clock

- Every phone has the deck and each clip's `dur`. Question 0 starts at `go.at`; within a question every phone computes the lead, the clip and the answer window. The reveal starts at the limit or once everyone joined and here has answered, and is untimed: the next start is known only from a `skip` (session.ts `schedule`).
- Every phone adopts the host's `skip`, even back to a question it passed; starts never decrease. A lost `skip` costs at most one beacon (3 s); a lost `a` is corrected by the next `s`.
- **The host gone** (its `leave`, or its presence gone 15 s, `hostGrace`): every phone shows つぎへ; a tap moves on and sends a skip the others follow. A host back adopts the players' position. A phone whose own socket is down ignores presence.
- **Late messages.** A question whose clip began more than 5 s before it was heard is sat out (`out`); one heard sooner plays from then. With こたえる じかん なし nothing is sat out.
- **Re-sends.** When someone's presence comes back, the host re-sends `open`, and in a game `go` plus its position; a player re-sends `join`, its `a` for the question under way and its よみおわった. A socket replaced unseen (`ws.hello` `rep`): the host's re-sent `go` (or `open`) is the sign, and a player answers it with the same.

### cv, the content version

6 hex characters of a hash per game over only what shapes the deck and the schedule: item ids, order, choice counts and answers, the mix, clip lengths to 10 ms, `gm`, and the game's `BUILD_V` (games/versions.ts, bumped by hand when its deal changes). Text, notes and marks are left out, so a copy fix never blocks co-play. compile.ts `gameCv`; levels/index.json `games` (`quiz:<lv>`, `ladder:ladder`, `lesson:<unit>`, `taikai:all`, `<gm>:<file>`); pool.ts `gameCvOf`. cv.test's golden keeps each game's cv and a digest of its decks (seeds 0–19): decks changed under the same cv fail with "bump BUILD_V"; a deliberate change is `vitest -u`.

### Wire migration

`SEND_PLAY` is on and `QUIZ_ON_PLAY` off (`WIRE` 'guarded'): the quiz family goes out as `quiz`, everything else as `play`; every build since the dual stack hears both. `?wire=quiz|guarded|play` forces a mode in the e2e. Left: `QUIZ_ON_PLAY = true` (one line; wire.test pins the mode) once `npm run logs -- report` *Live hellos* shows no phone on a build that can't hear `play`; then stop parsing `quiz` on the client (two weeks later at least), then drop it from the contract, relay last.

### The listen row

`contract/listen.ts`: `listen {d, g, lv, n, ms, p?, r}` plus `gm?` (absent: the quiz), `u?`, a lesson's `l?` (1 であい, 2 ばめん, 3 チェック, 4 おと, 5 じっせん) and `tm?` (0–6, the team's first-listen rights). `r` 1-12 answers `[id, ok, pick, rp]`, only the questions I had; `pick` −1…4095 (a tile round's wrong-slot mask, a memo's wrong rows, opinions in base 4); `lv` the level 1–8 (the stage for games without levels). A mic game's row is minutes only (`minutesOnly`: `r: []`). The relay checks rows with the same file and refuses unknown keys, so row fields ship relay first. progress.ts skips answers whose id it doesn't know, so a newer game's row leaves an older build's stats alone. `stampsUnit`: curriculum.md "Playing together".

## Content

- **Items** (`bank.ts` the shape: `{id, lv, type, en, ja, speaker, voice, choices, answer, focus?, ask?, tts?, …}`), authored in `bank1.ts` (levels 1-3), `bank4.ts` and `dialogues.ts` (4), `bank5.ts` (5) and `content/` (the sets), gathered in `source.ts` `BANK`: the compiler's, the audio scripts' and the tests' input, never the app's ("Loading").
  - `speaker` a villager (roster.ts); `voice` the accent: US but for やま and ほし's `accent-exposure` items (≤ 10 % of each, bank.test "accent policy"); `cast` the voice id.
  - `ask` (pic, num) a short Japanese question shown while the clip plays; `pic` choices are art keys with Japanese labels (`PIC_JA`); `word`'s `focus` the answer as it appears in `en`; `tts` what's spoken when it isn't `en` (curriculum.md "Audio and script rules"); level 4 up: `note`, `tags {seed, register, pragmatic, conditions?, features?}`; any level: `cja`, `why`, `ctx`.
  - Dialogues: `lines: {who, cast, en, ja, tts?}[]`; `en` the lines joined, `speaker`/`cast`/`voice` the first line's.
  - Staging: `scene?`, `channel?` (`live | phone | pa | video`, defaulting from `tags.conditions`: bank.ts `channelOf`), `marks?` on items and lines (staging.ts's tables hold the older banks').
- **Counts** (bank.test): levels 1-7 46 / 49 / 89 / 297 / 30 / 236 / 115, 862 items; 30 ladders (`sp-<name>`, rungs `-1…4`).
- **Waiting sets.** A set written after its level was offered waits for its voices (content/index.ts `WAITING`): `BANK` and the compiler take its items only once all their clips exist. Every set is voiced.
- **`deck.ts`**: `deck(seed, lv)` is deterministic over the level's loaded items: the mix (mix.ts), never one type more than twice in a row, choices shuffled by the seed, templates not drawn together while the pool allows. Every phone builds the same deck from `{seed, lv}`, so no text goes on the wire. `LEVELS` (= `playable`) are the levels this phone offers: a mix and a clip for every item. Level 4's dialogue mix only once every level-4 dialogue line has a clip (deck.ts `mixes`, compiled as `index.json`'s `dialogues`).
- **`score.ts`**: `points(right)`, `firstListen(right, replayed, same)`. **`clips.ts`**: `clipAt(id, slow?)`, `clipDur(id)`, `itemDur`, `sequenceStarts`, `lineGaps` (a line's `at`, else `LINE_GAP` 0.3 s).

### The sets

`content/index.ts` `SETS`:

| set | file (prefixes) | level | single items | dialogues | what |
|---|---|---|---|---|---|
| もり: daily life | mori-life.ts (`ml-`, `dml-`) | 4 | 70 | 15 | shops, restaurants, hotels, travel, health, banks, landlords, the ward office |
| もり: work and people | mori-work.ts (`mw-`, `dmw-`) | 4 | 70 | 15 | meetings, feedback, IT, clients, interviews; friends, gossip, dating, family |
| やま A | yama-a.ts (`ya-`, `dya-`) | 6 | 80 | 20 | idioms, phrasal verbs, slang, sarcasm, banter, heavy reductions |
| やま B | yama-b.ts (`yb-`, `dyb-`) | 6 | 80 | 20 | negotiation, complaints, disagreement, bad news, contracts, escalations |
| ほし | hoshi.ts (`ho-`, `dho-`) | 7 | 90 | 25 | news, radio, podcasts, mini-lectures, debates, dense statistics, stance |
| variety | variety.ts (`vm-`, `dvm-`, `vy-`, `dvy-`) | 4, 6 | 30 + 30 | 6 + 6 | events, town, home, tech help, Tokyo told by Americans |
| かわ breadth | kawa-b.ts (`kb-`) | 3 | 40 | 0 | introductions, invitations, compliments, small talk, emergencies |

- ほし's `mean` and `gist` run 2-4 sentences (≤ 45 words); a single-clip `gist` asks what a bulletin is about, a single-clip `next` what the speaker says next. ほし is broadcast on the plain stage.
- `withBed`: a live item in a café, street, platform or gate scene gets that bed, light; `word` items stay clean.
- **Clip caps** (bank.test): length 8 s a line at levels 1-3, 10 at 4, 11 at やま, 22 at ほし, 18 in the pack; size 60 KB a clip, level 4 and a rung 80, the pack and やま 100, ほし 160, a story segment or listening line 100, a はつおん word 20.
- Tests: content/sets.test.ts (sizes, splits, prefixes, words a clip), the shared bank / staging / conditions / near-dupes tests.

### Variety

- Each phone keeps the item ids of its last 6 games (`DEVICE.kikimimiRecent`; recent.ts `remember`).
- **A shared game:** the host tries 24 seeds (`freshSeed`, via the session's `seedFor`) and keeps the deck with the least overlap with its history (an item from the last game weighs 6, the oldest 1). The seed's low bits stay the lobby's flags; no protocol change.
- **Solo and おさらい** draw the items not heard lately first (`deck(seed, lv, mix, seen)`, srs.ts `practiceDeck`).
- **Near-duplicates** (near-dupes.test.ts): every clip's English against every other's (Jaccard over content words ≥ 0.5 with 4+ words) and every right answer against the others'.

### Listen parts

The listening kinds (`content/listen/*.yaml`, not story/; schemas in app/content/listen/README.md) compile with the levels. `kikimimi/listen.ts` holds their types, the checker and the clip ids, for the compiler, the scripts and the tests; the phone imports its types only. A problem in any file stops the compiler, and content.test runs the same checker.
- **Part** `levels/parts/<unit>.json` (≤ 32 KB gz): `{"listen": {unit, game, stage, status, cando, items}, packs, clips, words}`. Items as authored minus `tts`, with a `clip` id on every tile and every line of a call or たちぎき; a derived tile's `clip` is its bank item's id.
- **Index:** `units[<unit>] = {parts, n, cv}` (so `load(<unit>)` works as for a level); `listen[<unit>] = [game, stage, status]` for the catalog; `games['<gm>:<unit>']`, once games/versions.ts has the game's `BUILD_V`.
- **Gate:** every status compiles; past `draft` every clip must exist; the games show `listened` files only. All 25 listening files are `listened`.
- **Clip ids** (`listenClipIds`): a tile's id or its `clip`; a call's or たちぎき's lines `<id>-<n>`. The audio script speaks them at the file's stage + 1, a call's `me` in the file's `cast.me`, a call in its phone band, a draft only under `--only`; each file's clips in its own pack.
- **Checks** beyond the README's: US voices only and the US-only lint (`notUs`, over `en`, lines and plan choices, never `tts`; `accent-exposure` exempt), an error on content/listen, units and the bank; ids apart from every bank, unit and rung clip; the Japanese help (`helpProblems`), required past draft.

## Loading

- **The compiler** (`kikimimi/compile.ts`, `npm run kikimimi:levels`; the audio scripts run it at their end) writes `kikimimi/levels/`: `parts/lv<n>.json` a level's items with their clips and timings, split in order past 54 KB gzipped (`lv4-1`, `lv4-2`…); `parts/ladder.json`; a unit's `parts/u-<id>.json` (curriculum.md "The unit file"); `parts/letters.json`; a listening file's part ("Listen parts"); a story chapter's `parts/<serial>-<n>.json`; `parts/mic-pairs.json`. `index.json`: each part, the cvs, the gates (`offered`, `dialogues`, the ladder), the sound check's clip, every item's id, level, type, accent and features (for きろく), the units, path lines, stories and listening files. YAML is parsed by `yaml` and checked by hand-written checkers (units.ts, listen.ts, story.ts). Committed; levels.test fails while they differ from the compiler's output. The tournament's numeric ids are each item's place in the index (`numbering`).
- **The phone** (`kikimimi/pool.ts`): the index is in the sheet's chunk, and きろく, the advice and おさらい read it alone. Each part is its own lazy chunk (`import.meta.glob`): `load(...units)` fetches a level's (or `'ladder'`, a unit's, a file's), `loadChapter` a chapter's, `loadLetters`; `levelItems(lv)` throws for a level not loaded (a deck from half a bank would differ between phones).
- **When.** The sheet loads the remembered level's chunk and those of lobbies heard; then a heard `open` waits for its chunk, and everything after it waits behind it, in order; my own taps likewise. おさらい loads its picks' levels, then deals. A chunk that won't load drops what waited; the host's re-sent `open` tries again.
- **The budget** (scripts/kikimimi-budget.ts, run by `npm run build`, and levels.test): the sheet's chunk ≤ 80 KB gzipped, the hub ≤ 25, each other page, game view and later lane ≤ 15 (at least one view of a game folder lazy), each level's part ≤ 60, a unit or listening part ≤ 32; the path index ≤ 12 KB at 200 units (units.test).
- Tests: levels.test, game.test (an `open` for a level not loaded; my taps behind it), units.test's golden decks.

## Audio

### Generation

`npm run audio:kikimimi` (`app/scripts/kikimimi-audio.ts` with `app/scripts/tts/tts.py` in uv venvs under `app/.cache/tts/`), on the Mac, silent (it never plays a clip unless `--listen` is asked for).
- **Engine:** Qwen3-TTS 1.7B Base (mlx-audio), seeded, cloning each cast voice's reference clip with its exact transcript, so a voice stays the same voice. `--engine qwen3 | voxcpm2 | kokoro` (`say` the legacy path, levels 1-3 only).
- **Setup** (Apple silicon): `brew install uv ffmpeg whisper-cpp`, and `~/.cache/whisper/ggml-large-v3-turbo.bin` (`WHISPER_MODEL` names another). The first run makes the venvs (`requirements-{gen,qa,kokoro}.txt`, Python 3.12); a check before any synthesis names what's missing. Smoke test: `npm run audio:kikimimi -- --only '^p1-cake$' --out /tmp/kiki-pipe-test --force`. `--refs` re-makes references (the AU ones need VCTK's wavs under `.cache/tts/vctk/`).
- **The cast** (`app/scripts/tts/cast.json`, 18 voices): 12 US (`us-f1…f6`, `us-m1…m6`, twenties to sixties, `us-f6` light Southern, `us-m6` light New York), designed by Qwen3-TTS VoiceDesign from descriptions (the best seed by UTMOS and most unlike the others, ECAPA ≤ 0.64), no real person; 6 for exposure items only: UK from Phonon 31m catalogue voices (Apache-2.0), AU from the VCTK corpus. References committed (`refs/<id>.m4a`). Each villager has one US voice for good (cast.ts `CAST`); an `accent-exposure` item uses the speaker's UK or AU voice (`EXPOSURE`).
- **Text:** `speech.ts spokenText`: `tts`, else `en` with numbers written out (`sayNumbers`).
- **Processing:** the raw take (cached by master hash and seed) → edges trimmed → −16 LUFS, a limiter at −1.5 dBTP → mono AAC 48 kbps 24 kHz (stories and しずえの ニュース at −18 LUFS: `SOFT`). L1's clips slowed to 0.92 and L1/L2's `-slow` to 0.75 by atempo from the same take.
- **The gate:** whisper-cli large-v3-turbo hears every clip (numbers, contractions and reductions normalised); a content word wrong or the voice drifting (ECAPA < 0.5) re-rolls with the next seed, up to 5 times; the best take is kept and the rest flagged for a person. UTMOS measured too. Re-rolls a person chose are pinned (`PINNED`). `app/scripts/tts/report.json` has every clip's text, seed, takes, what whisper heard, WER, UTMOS, similarity and flags (its summary's `flagged`: curriculum.md "Listening check").
- **Word timings** (`npm run audio:kikimimi-words`): whisper-cli hears every clip word by word (DTW timestamps), matched to the shown words by a DP over normalised spellings; `words.json` `{clip: [hash, start…, end]}` in centiseconds, compiled into the parts; `wordTimes` spreads the clip's length when the hash differs.
- **Files:** loose m4a in the work folder `app/.cache/tts/clips/` (refilled from the packs before a run: `unpackClips`); `clips.json` (`{id: {dur, hash, slow?}}`) and `app/scripts/kikimimi-clips.src.json` (each clip's source hash: engine, voice, text, seed, pipeline version). Only clips whose source hash changed are re-made; `--out <dir>` writes to a scratch dir. The units' and stories' YAML go through the same cast and rules (compile.ts `unitItems`, story.ts `storyItems`); stories have no condition or tempo change.
- **Attribution.** The AU voices are derived from the CSTR VCTK Corpus (CC BY 4.0): Yamagishi, Junichi; Veaux, Christophe; MacDonald, Kirsten. (2019). *CSTR VCTK Corpus: English Multi-speaker Corpus for CSTR Voice Cloning Toolkit (version 0.92)*. University of Edinburgh, CSTR. https://doi.org/10.7488/ds/2645. Changes: utterances trimmed, joined, loudness-normalised and resampled into the reference clips, which the TTS clones. The UK references are Phonon 31m output (Apache-2.0); the US ones are VoiceDesign output.

### Packs

`static/audio/listen/<pack>.<hash>.pak`: whole m4a files end to end (`packing.ts`, `npm run kikimimi:packs`); `packs.json` holds each pack's hash and its clips' offsets and lengths. A clip's home is its level's pack (`lv4`), `ladder`, its unit's (`u-<id>`), its listening file's, its story chapter's or `mic-pairs`; slow takes in `-slow`; a home past 1.2 MB (slow 0.8 MB) splits into stable parts (`planHome`), so re-speaking a clip changes its own pack only. WebKit decodes a slice to the standalone file's very samples (a slice is the file's own bytes with `+faststart`); ADTS would lose the m4a's priming and padding, so the packs stay m4a. 144 packs: games 89.3 MiB, stories 21.4 MiB, under bank.test's lines (92 / 23 MiB) until R2 (kikimimi.md "Open items"). Pages takes files ≤ 25 MiB and 20,000 a deploy (static-files.test keeps static/ ≤ 15,000).

### Playback

- **The engine** (sound/engine.ts, sound.svelte.ts): a `voice` bus following the master volume only (silent at 音量 0); `voiceSession(on)`, called inside a tap, creates and unlocks the context even when sound is off, holds it awake and sets `navigator.audioSession.type = 'playback'` (it plays with the silent switch on); `loadVoice` / `loadBytes` decode a pack slice; `playVoice(buf, {relayAt?})` → `{stop(), endsAt}` at `ctx.currentTime + (relayAt − serverNow())/1000`, ducking the music. Decoded buffers in an LRU of 4 (`CLIP_CAP`), cleared on `voiceSession(false)`.
- **Dialogues** (clipPlayer.svelte.ts `playSequence`): each line at its relay time; `talk` keeps the latest line begun and `all` every line under way (two in an overlap).
- **Fetching** (`components/kikimimi/packs.ts`): `prefetchClips` fetches a deck's packs whole (no Range requests: the service worker passes those through uncached), the first question's pack first; each clip is sliced and decoded just in time (1-3 ms). The next question's backdrop and speakers come with its clip (stage.ts `preloadStage`).
- **Caching:** the service worker's `island-listen-v1` (caches.ts `LISTEN_CACHE`; docs/backend.md "Service worker"): cache first, never revalidated (the hash is in the name), LRU by pack under 30 MB, a pack used in the last 10 minutes never evicted. Packs are never precached; backdrops are cached on first use.

## Conditions

A clip can carry `cond: {kind, level, bed?}` (bank.ts `Cond`): a channel (`phone`, `signal`, `voicemail`, `pa`) or a bed (`cafe`, `street`, `station`, `party`), `light` or `heavy`, and a channel's bed behind it (a PA on a platform: `pa` + `station`). A dialogue's lines take the item's unless a line has its own. `conditions.ts condOf`: the clip's own, else a phone's light `phone` (voicemail, or `signal` on a line that breaks off), a PA's light `pa`; video, face to face and たちぎき stay clean. Levels 1-3 never have one. `condPlan` sets the mix, carried out by `scripts/kikimimi-audio.ts` with `scripts/tts/dsp.ts`:

| condition | light | heavy |
|---|---|---|
| phone | band 300-3400 Hz, compressor −22 dB 3:1, G.711 µ-law 8 kHz | band 350-3200 Hz, −26 dB 4:1, line hiss, G.726 24 kbps |
| signal | the phone line, then seeded dropouts (`dropGaps`: one every 1.4 s, 120-320 ms; 60 % silence, 40 % stutter), G.726 24 kbps | every 0.9 s, 150-450 ms, half stutters, hiss, G.726 16 kbps |
| voicemail | the caller's room (RT60 0.35 s), then the phone line | the same, then the heavy line |
| pa | a two-tone chime, horn band 250-6000 Hz, −20 dB 3:1, hall RT60 1.0 s | band 300-5000 Hz, −22 dB 4:1, hall RT60 1.6 s |
| bed (café, street, station) | +15 dB SNR | +10 dB |

- The SNR is the speech's integrated loudness over the bed's stretch (from 0.5 s before to 0.35 s after, at an offset by the clip's id). A call's bed sits before the phone line, a PA's after the hall; then −16 LUFS, a limiter, AAC. Only a line that breaks off gets `signal`, and the player asks again on the next line, so a dropout never falls on a memo answer.
- **The beds** (`app/scripts/tts/beds/{cafe,street,station,party}.m4a`, committed, 24 s): `npm run audio:kikimimi-beds` synthesises them from our own TTS clips reversed and layered, seeded noise and simple synthesis, so there's no third-party audio and no licence to track. `party` ships as `static/audio/beds/party.<sha8>.m4a` for たちぎき.
- **Hashes.** A conditioned clip's source hash is its master's plus the plan, the bed's hash and a version (`condSource`), so a changed bed or setting re-mixes only its clips and never re-speaks.
- **QA.** The strict gate runs on the clean take; the mixed clip gets a loose whisper WER check (≤ 0.2 light, 0.3 heavy; signal 0.5 / 0.6), else it's flagged `cond-wer`. The clean take is kept (`.cache/tts/clean/<id>.m4a`) for the word timings.
- **Where:** level 4's phone and PA clips and noisy scenes (`staging.ts NOISE`; heavy under 15 %); the pack, the sets, the units and the listening files as written.
- Tests: conditions.test.

## The games

What each game deals and grades. The listening games' player-facing summary is kikimimi.md "あそぶ"; why each exists, curriculum.md "Modes".

### しゅうまつ たいかい

しずえの しゅうまつ たいかい, a weekend quiz show from the week's misses (`games/taikai/`).
- **Window** (`window.ts`): Fri 18:00 – Mon 05:00 Tokyo (`taikaiAt(now)`); `taikaiOfDay(d)` files a row's day under its weekend.
- **The deck, and why `ids`.** A phone knows only its own player's answers (the partner's rows are summaries), so no phone can deal the others' misses from a seed. Each player's phone offers its own misses in the lobby (`weekMisses` → `offerOf`, ≤ 4 numeric ids) as `ev` ops (`e` EV_MISS, `i` the slot, `x` the id); the host picks (`taikaiPick`: the offers round-robin A B G, fresh items at each player's level to fill, the hardest last as the wager, the rest interleaved by type and level) and sends the pick as the `open`'s `ids` (≤ 8: 7 questions and the wager). Every phone deals from the open alone (`taikaiItems(seed, ids)`); the cv `taikai:all` keeps the numbering equal.
- **Points:** a player's tier 0–3 is their comfortable level's place (`tierOf`; unmeasured かわ). A right question pays 100 × (1.5 − expected at that tier): 50 for a sure thing, up to 150 for a stretch, so in しょうぶ the B1+ partner can win.
- **The wager** (the last round): 100 round-only chips, a bet of 10–100 before choosing, the answer `[choice, bet / 10]`; right pays ×2, wrong loses it; 15 s more. A missed bet ≥ 70 is `wagerReveal` 'confident-miss' (hypercorrection).
- **Results:** co-op counts the team's rounds against しずえ's target (`taikaiTarget`); `trophyOf` bronze / silver / gold. The row: `gm` 'taikai', `u` the trophy, `lv` the tier's level; `trophiesOf(rows)` the best per weekend. しょうぶ ranks by points plus chips.

### みみ チェック

The placement (`games/check/`): solo, nothing on the wire, rounds dealt one at a time through `GameDef.next`. It starts at かわ (the bands are the places: はまべ 1, はまべ 2, かわ, もり, やま, ほし), goes up a band after 2 right and down after 1 wrong, and stops after two reversals (at least 8 items) or at 12. The skills take turns (すうじ, つながる おと, へんじ・ほんね, にた おと, one gist) over the places' voiced items (`TAIKAI_IDS`). The placed band is the reversals' mean, rounded down; each skill's band gives the chips. A `listen` row `{gm: 'check', lv: <placed level>, u: <a digit a skill, x unsampled>}`. Other games' tiers come from `join.tr`.

### The listening games

ことば タイル, たちぎき, ようじ でんわ, すうじ ラッシュ and しずえの ニュース deal `listened` files at the lobby's place and share `games/listened.ts` (pure): `EMPTY` (63), `ROLES` (2), `listenOpts` (`[lv, timer, ear]`), `filesOf(gm, lv)`, `tierAt`, `shareOf` (a role's slots or rows), `cvOver`, `listenGame` / `listenRecord` over a game's `ListenRules`. Each lane.ts is one line, `listenLane(RULES, deal, more?)`. **The ear** is each player's tier (0 はまべ … 3 やま: taikai's `tierOf`) against the deck's place: below, easy; above, hard; else as authored. Co-op has two roles, one co-op rule per game, and 「ふたりで k / n」 is `team.all`. The pages share `components/kikimimi/listenView.ts`. A unit's lesson on recipe 2 deals their cards with the same deals and rules (curriculum.md "Recipe 2"). Every game has an e2e solo, at night and co-op on the shipped files.

### ことば タイル

Rebuild what you heard (`games/tile/`, `components/kikimimi/tile/`). 6 sentences by the seed, the shortest first; the clip plays once with no tiles, then the words plus 1–4 sound decoys (weak forms, contractions) appear, tapped into order. A card is an Item whose `id` is the clip it plays, its `tile.id` the row's id.
- **Tiers:** easy, the first authored decoy and my first slot placed; hard, decoys topped up to 3–4 from a sound-swap table over the sentence's own words.
- **Answer:** the board's index per slot, `EMPTY` for none; valid: one per slot, each tile once. Right: every filled slot holds its word and they're the whole sentence or one role's half. 100 a sentence; a replay costs nothing.
- **Co-op:** role 0 fills the odd slots, role 1 the others; the partner's slots dashed.
- **Row:** `gm: 'tile'`, `[tile id, ok, wrong-slot mask, rp]` (`tileRecord`; `wrongWords`).

### たちぎき

Overheard three-speaker talk (`games/tachi/`, `components/kikimimi/tachi/`). 2 conversations of 30–50 s, 3 rounds each: opinions (match three Japanese claims to three faces), changed (who changed their mind), plan (what happens next).
- **Timing:** the conversation plays before the opinions round only (answer +10 s); changed and plan have no clip and nothing replays at their reveals (`quietReveal`). After the first play each line replays alone (`game.hear`, not counted as a replay).
- **Offsets:** a line's `at` (negative = overlap, only where the line's start carries no answer) feeds `sequenceStarts` and `itemDur`, played on the audio clock, not baked, so a line still replays alone.
- **The party bed:** a file tagged `party` loops `party.<sha8>.m4a` under the whole sequence at +15 dB SNR (`bedSamples`), so its lines are voiced dry.
- **Answers:** opinions `[speaker of claim 0, 1, 2]`, right when every placed face is at its claim and the faces are all three or one role's two; changed a speaker; plan a choice. Easy: the third claim placed.
- **Co-op 「たんとう」:** role 0 follows the first speaker, role 1 the second, the third is shared; everyone answers changed and plan.
- **Row:** `gm: 'tachi'`, `[row id (<id>-op|ch|pl), ok, pick, rp]`, opinions in base 4.

### ようじ でんわ

Phone errands that change mid-call (`games/call/`, `components/kikimimi/call/`: CallPlay, MemoPad, Basket, CallLog). 3 calls by the seed, 2 rounds each: round 1 the call (lines `<id>-<n>` on the relay clock), round 2 `<id>-memo` with no clip. Fill a memo of chip rows (what, how many, when, where); the reveal fills the errand's basket with what you caught.
- **Tiers** (`tierAt`): easy 2 rows, as authored 3, hard 4 plus a sound-trap chip on a number's row (`trapOf`: teen ↔ -ty, else two digits swapped).
- **Answer:** the chip per row; right: every filled row right and they're the whole memo or one role's share. The chips take taps while the call plays; 「メモできた」 sends once it ends.
- **Co-op 「わけて メモ」:** both hear the whole call; a round's rows split by place; the team's memo (`unionOf`) shows a wrong chip over a right one.
- **Reveal:** the right chip and its `cja`, the basket (`basketOf`), and at round 2 the `note`, 解説 and the transcript. PhoneFrame's bars drop to 1 while a `signal` line plays.
- **Row:** `gm: 'call'`, `[call id, ok, wrong-rows mask, rp]` (`callRecord`).

### すうじ ラッシュ

A café rush of numbers (`games/rush/`, `components/kikimimi/rush/`). `scripts/kikimimi-rush.ts` (`npm run kikimimi:rush`; `--check`, `--clips`) expands 60 frames (30 かわ, 30 もり; café, konbini, ticket window, a deli abroad in dollars, taxi stand, pharmacy) four times each by four of the US voices into s1-rush.yaml and s2-rush.yaml: 240 customers, a third corrected at seeded random places, some with a second number; four chips each (the answer, the slip, the second number, the -teen / -ty twin and near values) with `cja`, `why` and `note`. rush.test checks the files are as generated (near-duplicates among rush items exempt).
- **Deck:** 8 customers by the seed, never two of one frame; a card is a `num` Item with `rush: {ask, at, was, b}`.
- **Tiers:** hard all 4; as authored 3 (never dropping `was` or the twin); easy 3, `was` dropped.
- **Timing:** answers open when the order ends; 8 s (`WINDOW`) whatever こたえる じかん, none with なし.
- **Points:** `questionPoints(ear, b)` (b the place, +0.5 for a correction), so しょうぶ works against expectation. A **combo** counts first-listen rights in a row; a miss resets it and the customer repeats the line.
- **Co-op 「ふたつの レジ」:** customer i goes to register `i % 2`; the other phone answers `PASS` (99): valid, never right, no row.

### しずえの ニュース

The morning bulletin (`games/news/`: def.ts, weather.ts; `components/kikimimi/news/`). On じっくり only; きまぐれ picks it 05:00-11:00 (catalog `hours: [5, 11]`).
- **Content:** news-a.yaml and news-b.yaml, stage 4 (やま), 30 evergreen bulletins (by season or any, 7 with a `weekday`): two segments (`island` or `season`, then `tokyo`) of 3–5 lines read by しずえ (us-f4), 100–170 words; `gist` and `detail` with 4 choices, `trap`, `cja`, `why`, `ctx`. The kind `weather` (`news-wx`) holds the tail: 8 skies, the high as a template (−2…38 °C), 6 alerts and the sign-off, 56 whole-sentence clips, joined only between sentences.
- **The weather:** the relay's timeline carries `hi` (relay/src/weather.ts `highOf`). `newsWxOf` reads the sky over 06:00 (or now) to 21:00 Tokyo, or after 18:00 the next six hours, any fog and the high; `tailKeys` gives the sky, the high, ≤ 2 alerts and the sign-off. With no timeline the sign-off follows segment 2 and there's no umbrella question.
- **Deck:** the seed is the Tokyo day (`Lane.seed`); `bulletinOf` takes the day's season or `any`, `day % n`. Options `[lv, timer, ear + 4 × sky byte, high byte]` (`newsOpts`: the host's weather, so every phone plays and grades the same tail). Cards: the gist, `<id>-d` and `<id>-kasa` (with the weather), the last two with no clip.
- **Tiers:** easy shows the answer and its `trap` only. **Rounds:** the bulletin plays before the gist (+5 s to read); NewsStage's chips replay a segment. **Row:** `gm: 'news'`, `[card id, ok, choice, rp]`.

### よみきき サンド

Listen blind → read → listen blind, over any item: 「📖 読んでから もう一度」 (frame/SandButton) under a solo reveal's verdict (never in co-op: it would hold up the partner) and in an open review row. frame/Sandwich is a full-height sheet: the clip blind, then the transcript with its marks, `cja` and `why`, then the clip blind again, then 「聞き取れた ／ まだ」. まだ is a device-local mark (`DEVICE.kikiMada` `{[who]: [id, day][]}`, ≤ 200) that srs.ts folds as "hard" after that day's answers; no row change, nothing on the wire.

### Not built

Long-form (segmented talks with a comprehension map, answers during play) and a game of its own for ふたりで ジグソー (the listening games' two roles already split what each hears; `half` in the call schema is ready).

## Performance

- Nothing heavy loads before the sheet opens: the island's first load carries ~4 KB of ききみみ (the invite listener and host, the `listen` contract, the pill, the cues).
- The sheet's chunk and each part are lazy and budgeted ("Loading"). The island's render loop idles under the sheet.
- The packs live in the service worker's cache; in memory only the LRU of 4 decoded buffers.
- During play nothing renders per frame but the karaoke (only while a clip replays); bars, timer, bob and waves are CSS; the view refreshes at each phase's end (at least every 3 s).

## Risks

1. **Deploy order** (`play`, or a row field, sent before the relay knows it): contract first, the `SEND_PLAY` / `QUIZ_ON_PLAY` switches, gates on the `ws.hello` log.
2. **`cv` too strict** (a deploy window blocks co-play): hash only what shapes the deck; the update card calls the reload path.
3. **Byte budget creep** (`open` at ~197 B): size tests per op at worst case; `ids` capped at 8; extend through `o` and `ev`.
4. **Evicting a pack mid-game:** never evict one used in the last 10 minutes; a missing pack refetches.
5. **Audio outgrowing Pages** until R2: each batch raises bank.test's lines.

## Tests

Pure vitest for every fold, deck and GameDef (session.test with fake time: lost messages, the beacon, the host gone or locked, a stale `open`, a late `go`; wire.test; cv.test; levels.test; units.test; content.test; recipe.test; caches.test; packs.test; the engine's clip API with a fake context). e2e per game solo and co-op on the default wire and over the dual stack (`?wire=quiz`), logic tier; kikimimi.md "Tests".
