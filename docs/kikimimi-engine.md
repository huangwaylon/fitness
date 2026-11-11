# ききみみ engine: rounds, the wire, content and audio

The platform under every ききみみ game: the round engine and its games, the presence wire, the content compiler and lazy
loading, the audio pipeline and packs. The player's side is [kikimimi.md](kikimimi.md); what is taught,
[curriculum.md](curriculum.md); the mic modes, [kikimimi-mic.md](kikimimi-mic.md); the relay's side, docs/backend.md
("Live relay", "Events" `listen`, "Service worker"). What isn't built yet: kikimimi.md "Open items".

## Files

```
app/src/lib/kikimimi/
  round/          game-agnostic, pure, no Svelte: session, schedule, tally, wire, link, decks, types, registry
  games/<gm>/     def.ts (a pure GameDef) and lane.ts, one folder a game; listened.ts + listenLane.ts for the listening
                  games; versions.ts (BUILD_V); modes.ts (the mic modes' metas)
  bank*.ts, dialogues.ts, content/, source.ts, ladders.ts   the TS banks (BANK, LADDERS)
  compile.ts, pool.ts, packing.ts, units.ts, listen.ts, story.ts, levels/   the compiler and its output
  the deck, scoring, clips and staging; the path, menu, week and stamps; progress.ts, srs.ts, advice.ts (記録)
app/src/lib/components/kikimimi/
  frame/          the shared round, reveal and results parts ("Shared UI")
  <gm>/views.ts   a game's lazy lobby / play / results pages
  nav.ts, KikimimiSheet.svelte, game.svelte.ts, clipPlayer.svelte.ts, chunkQueue.ts, packs.ts, recorder.ts
  hub/, asobu/, mode/, path/, zukan/, story/, taikai/, settings/, onboarding/, lesson/, scene/, mic/   (lazy)
  KikimimiHost.svelte, invite.svelte.ts   always loaded; hear `quiz` and `play`
app/src/lib/sync/storage.ts   DEVICE: the phone's ききみみ keys (kikimimi*, kiki*, mic)
app/content/units/, app/content/listen/ (README.md: the listening schemas), app/content/mic/
```

## The round engine

### Types

`round/types.ts`, each field documented there. A game's review, row, clips and pages live in its lane and views, not
on the kind. An `AnswerValue` is an int 0–255 or ≤ 12 ints 0–63; `RoundTiming {lead, play, answer, auto?}` in ms (an
`auto` reveal moves on after 3 s; every other reveal is untimed); `GameDef.next` deals an adaptive game's next round
(みみ チェック, くりかえし).

**Roles.** `go` carries `pl`, the host's bitmask of players at the start (A=1, B=2, G=4). Every phone derives
`players = ORDER.filter(in pl)` and `role(who) = index`, deterministic; a late joiner takes `index % roles`
(`GameDef.roles`, default one each). **Tiers** (`GameDef.tier {of, with}`): the host's tier rides `o`, each player's
their `join`'s `tr`. `Game.deckFor(w)` is that player's deck at their tier (same rounds and timing); tally.ts grades
with it, so `team`, `teamFirst` and the scores agree on every phone.

### RoundSession

`round/session.ts`, pure: it folds intents and the clock into `{phase, players, answers, scores, i}` (the clock's
rules: "The host is the clock"). `answer` validates with `deck.valid`; the running total `s` is capped at `maxScore`;
rounds ≤ `PLAY_ROUNDS` (32), the quiz family's decks `QUIZ_QS` (8). A heard `open` whose cv isn't mine, or of an
unknown game or options, is an invite `blocked: 'update'` (`join` refuses it; the card offers 更新する); a `quiz` open
has no cv and is never blocked.

**Content before the deck.** A deck is dealt synchronously but content loads lazily: game.svelte.ts holds a heard
`open` and everything after it for that game (chunkQueue.ts) until its lane and chunks are in, then hands them to the
session in order. A part is ≤ 60 KB gzipped, well inside the 4 s countdown.

### The quiz as a GameDef

`games/quiz/def.ts`: `opts [lv, timer]` (timer: `TIMERS`' index); the deck is `deck(seed, lv)`, a round per item
(`quiz.<type>`, games/quiz/kinds.ts), `play = itemDur`, `grade = points(right)`. スピード はしご is the game `ladder` (the
same opts; one `ladder.rung` round per rung, the lower rungs' reveals `auto`, the deck's `score` the climb). `lesson`
(opts `[lv, timer, lesson, tier]`, its unit `u`) is a unit's lesson dealt into my lobby (curriculum.md
"Lesson decks and stamps"). `games/quiz/session.ts` `QuizRounds` is the quiz sheet's lobby over the session. にがて れんしゅう
stays a local deck (srs.ts).

### The registry

Every game is a lane in `round/registry.ts` (`Lane`, each field documented there): the quiz, ladder, lesson, taikai
and check lanes ride the sheet's chunk (`EAGER`); a later game is one `LATER` line and its own chunk. A lane is its
GameDef over the phone's deck cache, the chunks a deck needs and its pure deal from them, plus optional hooks (a deck
by the open's `ids`, my tier, the host's seed, a lobby's options, always leading with `[lv, timer]`).

- **Pages:** `components/kikimimi/<gm>/views.ts` exports lazy `{ lobby?, play?, results? }`, mounted through `<Lazy>`.
- **Strings:** `i18n/kiki-<gm>.{ja,en}.json` (keys `kiki.<gm>.*`), added by the views' `kiki-<gm>.ts` (deps.test:
  kikimimi/ may not import i18n/).
- **Catalog:** each mode has a shelf, an icon, `places` and `game` (catalog.ts). A lane's mode shows once its `LATER`
  line exists and a file of its game is `listened` (`LANES.ready`), or its line's `content()` says so. A mic mode
  brings its own `mode` (`addMode`): the shelf `koe`, `gate()` and `requires: 'mic'`. きまぐれ never picks a mic mode.
- **A new game:** its lane, views and content; its `BUILD_V` line (games/versions.ts); `npm run kikimimi:levels`;
  teach cv.test's `decksOf` its deal. Tests: its kinds (determinism, grade, team, the row's round-trip through
  `listenOf`, `valid` bounds), the budget, one e2e solo and one co-op (Chromium, logic only).

### Shared UI

`components/kikimimi/frame/`: the round, reveal and results frames every game fills with snippets (RoundFrame,
RevealFrame, Results / ResultsShell, ScoreCard), the review's rows (ReviewList, ReviewRow, LineRow, HearButton, Note,
FirstStamp, Why), ChoiceGrid (with the mic's answer slot), PlayerChip and Sandwich / SandButton; `Transcript` and
`scene/*` sit beside it. Every `data-kiki-*` hook stays on its element.

## Sync

Two presence-only intents (contract/live-protocol.ts): unstored, unacked, never replayed, sent to all others, the
guest's as the members' (no guest gate: contract/guest.ts `guestMayWrite` rules stored events only). Client messages ≤
210 bytes (the relay adds `who` and `t`, ~35; 256 is the cap); live-protocol.test builds the maximal message for every
op. The relay deploys first for any contract change. A lobby kept alone and its game send nothing. The banner and the
sheet reuse the island's Live (`relay ?? demoRelay`).

### The quiz wire

`{kind:'quiz', g, op, …}`, the quiz family's from builds before `QUIZ_ON_PLAY`: heard, never sent. Its ops (`open`,
`join`, `leave`, `go`, `a`, `skip`, `end`) and their bounds are in contract/live-protocol.ts; it goes with the parse.

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

`playOf` keeps known fields only, each bounded in contract/live-protocol.ts; `gm` is checked by `GM_RE`, never against
a list (the relay doesn't know the games); `f` bit 0 is 音を1台にまとめる, bit 1 勝負. The worst `open` is ~197 B. Extend
through `o` and `ev`, never new top-level fields.

### The host is the clock

- Every phone has the deck and each clip's `dur`. Question 0 starts at `go.at`; within a question every phone computes
  the lead, the clip and the answer window. The reveal starts at the limit or once everyone joined and here has
  answered, and is untimed: the next start is known only from a `skip` (session.ts `schedule`).
- Every phone adopts the host's `skip`, even back to a question it passed; starts never decrease. A lost `skip` costs
  at most one beacon (3 s); a lost `a` is corrected by the next `s`.
- **The host gone** (its `leave`, or its presence gone 15 s, `hostGrace`): every phone shows 次へ; a tap moves on and
  sends a skip the others follow. A host back adopts the players' position. A phone whose own socket is down ignores
  presence.
- **Late messages.** A question whose clip began more than 5 s before it was heard is sat out (`out`); one heard
  sooner plays from then. With no 答える時間 nothing is sat out.
- **Re-sends.** When someone's presence comes back, the host re-sends `open` (in a game `go` and its position) and a
  player its `join`, its `a` under way and its 読み終わった; a socket replaced unseen answers the host's re-send the same.

### cv, the content version

6 hex characters of a hash per game over only what shapes the deck and the schedule: item ids, order, choice counts
and answers, the mix, clip lengths to 10 ms, `gm`, and the game's `BUILD_V` (games/versions.ts, bumped by hand when
its deal changes). Text, notes and marks are left out, so a copy fix never blocks co-play. compile.ts `gameCv`;
levels/index.json `games` (`quiz:<lv>`, `ladder:ladder`, `lesson:<unit>`, `taikai:all`, `<gm>:<file>`); pool.ts
`gameCvOf`. cv.test's golden keeps each game's cv and a digest of its decks (seeds 0–19): decks changed under the same
cv fail with "bump BUILD_V"; a deliberate change is `vitest -u`.

### Wire migration

`SEND_PLAY` and `QUIZ_ON_PLAY` are on (round/wire.ts `WIRE` 'play'): every game goes out as `play`; every build since
the dual stack hears both. `?wire=quiz|guarded|play` forces a mode in the e2e. Left: stop parsing `quiz` on the client
(no sooner than 11-24), then drop it from the contract, relay last. Order: contract and relay first, then the
switches, gated on the `ws.hello` log.

### The listen row

`contract/listen.ts`: `listen {d, g, lv, n, ms, p?, r}` plus `gm?` (absent: the quiz), `u?`, a lesson's `l?` (1 であい, 2
ばめん, 3 チェック, 4 おと, 5 じっせん) and `tm?` (0–6, the team's first-listen rights). `r` 1-12 answers `[id, ok, pick, rp]`,
only the questions I had; `pick` −1…4095 (a tile round's wrong-slot mask, a memo's wrong rows, opinions in base 4);
`lv` the level 1–8 (the stage for games without levels). A mic game's row is minutes only (`minutesOnly`: `r: []`).
The relay checks rows with the same file and refuses unknown keys, so row fields ship relay first; an older build
skips answers whose id it doesn't know. `stampsUnit`:
curriculum.md "Playing together".

## Content

- **Items** (the shape and every field: `bank.ts` `Item`), authored in `bank1.ts` (levels 1-3), `bank4.ts` and
  `dialogues.ts` (4), `bank5.ts` (5) and `content/` (the sets), gathered in `source.ts` `BANK`: the compiler's, the
  audio scripts' and the tests' input, never the app's ("Loading"). A dialogue's `lines` each have their own `cast`;
  staging (`scene`, `channel`, `marks`) defaults from the tags (bank.ts `channelOf`, staging.ts).
- **Counts** (bank.test): levels 1-7 46 / 49 / 89 / 297 / 30 / 236 / 115, 862 items; 30 ladders (`sp-<name>`, rungs
  `-1…4`). **Waiting sets.** A set written after its level was offered waits for its voices (content/index.ts
  `WAITING`): `BANK` and the compiler take its items only once all their clips exist. Every set is voiced.
- **`deck.ts`**: `deck(seed, lv)` is deterministic over the level's loaded items (the mix, never one type more than
  twice in a row, choices shuffled by the seed), so every phone builds the same deck from `{seed, lv}` and no text
  goes on the wire. `LEVELS` are the levels this phone offers: a mix and a clip for every item.
- **`score.ts`** grades and `clips.ts` times the clips (a line's `at`, else `LINE_GAP` 0.3 s).

### The sets

`content/index.ts` `SETS`, each a file of single items and dialogues: もり's two (level 4: daily life; work and people),
やま's two (6: idioms and banter; negotiation and bad news), ほし (7: news, talks, debates), variety (4 and 6) and かわ's
breadth set (3, single items). Their prefixes and rules: content/sets.test.ts.

- ほし's `mean` and `gist` run 2-4 sentences (≤ 45 words); a single-clip `gist` asks what a bulletin is about, a
  single-clip `next` what the speaker says next. ほし is broadcast on the plain stage.
- `withBed`: a live item in a café, street, platform or gate scene gets that bed, light; `word` items stay clean.
- **Clip caps** (length and size by level and kind: bank.test). Tests: content/sets.test.ts, the shared bank / staging
  / conditions / near-dupes tests.

### Variety

- Each phone keeps the item ids of its last 6 games (`DEVICE.kikimimiRecent`; recent.ts `remember`).
- **A shared game:** the host tries 24 seeds (`freshSeed`, via the session's `seedFor`) and keeps the deck with the
  least overlap with its history (an item from the last game weighs 6, the oldest 1). The seed's low bits stay the
  lobby's flags; no protocol change.
- **Solo and おさらい** draw the items not heard lately first (`deck(seed, lv, mix, seen)`, srs.ts `practiceDeck`).
- **Near-duplicates** (near-dupes.test.ts): every clip's English and every right answer against the others'.

### Listen parts

The listening kinds (`content/listen/*.yaml`, not story/; schemas in app/content/listen/README.md) compile with the
levels. `kikimimi/listen.ts` holds their types, the checker and the clip ids, for the compiler, the scripts and the
tests; the phone imports its types only. A problem in any file stops the compiler, and content.test runs the same
checker.
- **Part** `levels/parts/<unit>.json` (≤ 32 KB gz): the items as authored minus `tts`, a `clip` id on every tile and
  line (`listenClipIds`), and the index's `units`, `listen` and `games` entries, so `load(<unit>)` works as for a
  level. **Gate:** every status compiles; past `draft` every clip must exist; the games show `listened` files only.
  Each file's clips are in its own pack.
- **Checks:** app/content/listen/README.md "Checks"; the US-only lint (`notUs`) also runs on units and the bank
  (`accent-exposure` exempt).

## Loading

- **The compiler** (`kikimimi/compile.ts`, `npm run kikimimi:levels`; the audio scripts run it at their end) writes
  `kikimimi/levels/`:
  - `parts/`: a level's items with their clips and timings (split past 54 KB gzipped: `lv4-1`, `lv4-2`…), the ladder,
    each unit, listening file and story chapter, the letters and the mic pairs.
  - `index.json`: each part, the cvs, the gates, and every item's id, level, type, accent and features (for 記録).
  - YAML is checked by hand-written checkers (units.ts, listen.ts, story.ts). Committed; levels.test fails while they
    differ from the compiler's output.
- **The phone** (`kikimimi/pool.ts`): the index is in the sheet's chunk, and 記録, the advice and おさらい read it alone.
  Each part is its own lazy chunk (`import.meta.glob`): `load(...units)` fetches a level's (or `'ladder'`, a unit's, a
  file's), `loadChapter` a chapter's, `loadLetters`; `levelItems(lv)` throws for a level not loaded (a deck from half
  a bank would differ between phones).
- **When.** The sheet loads the remembered level's chunk and those of lobbies heard; then a heard `open` waits for its
  chunk, and everything after it waits behind it, in order; my own taps likewise. おさらい loads its picks' levels, then
  deals. A chunk that won't load drops what waited; the host's re-sent `open` tries again.
- **The budget** (scripts/kikimimi-budget.ts, run by `npm run build`, and levels.test): the sheet's chunk ≤ 80 KB
  gzipped, the hub ≤ 25, each other page, game view and later lane ≤ 15 (at least one view of a game folder lazy),
  each level's part ≤ 60, a unit or listening part ≤ 32; the path index ≤ 12 KB at 200 units (units.test). Tests:
  levels.test, game.test (an `open` for a level not loaded; my taps behind it), units.test's golden decks.

## Audio

### Generation

`npm run audio:kikimimi` (`app/scripts/kikimimi-audio.ts`, with `app/scripts/tts/tts.py` in uv venvs under
`app/.cache/tts/`), on the Mac, silent (it never plays a clip unless `--listen` is asked for). Its header holds the
flags, the setup (uv, ffmpeg, whisper-cli and its model; the venvs), the processing steps and the QA numbers.
- **Engine:** Qwen3-TTS 1.7B Base (mlx-audio), seeded, cloning each cast voice's reference clip, so a voice stays the
  same voice.
- **The cast** (`app/scripts/tts/cast.json`, 18 voices): 12 US designed by VoiceDesign (no real person); UK and AU
  for `accent-exposure` items only. Each villager has one US voice for good (cast.ts `CAST`).
- **Each clip:** `speech.ts spokenText` (`tts`, else `en` with numbers written out) → the seeded take → −16 LUFS mono
  AAC (stories and しずえの ニュース softer: `SOFT`); L1/L2's slow takes by atempo from the same take.
- **The gate:** whisper-cli hears every clip; a content word wrong or the voice drifting re-rolls with the next seed,
  the best take kept and the rest flagged for a person; a person's re-rolls are pinned (`PINNED`).
  `app/scripts/tts/report.json` has every clip's numbers and flags (its summary's `flagged`: curriculum.md
  "Listening check").
- **音の へんしん's takes:** a careful take through the same gate (speech.ts `carefulText`, slowed: `CAREFUL_TEMPO`) and a
  fast one, the natural take sped up (`FAST`), flagged, never re-rolled. `npm run kikimimi:reduce` then checks each
  phrase is heard reduced (curriculum.md "Connected speech") into `reduce.json`.
- **Word timings** (`npm run audio:kikimimi-words`): whisper-cli's word timestamps into `words.json`, compiled into
  the parts. Only clips whose source hash changed are re-made (`app/scripts/kikimimi-clips.src.json`); the units' and
  stories' YAML go through the same cast and rules.
- **Attribution.** The AU voices are derived from the CSTR VCTK Corpus (CC BY 4.0): Yamagishi, Junichi; Veaux,
  Christophe; MacDonald, Kirsten. (2019). *CSTR VCTK Corpus: English Multi-speaker Corpus for CSTR Voice Cloning
  Toolkit (version 0.92)*. University of Edinburgh, CSTR. https://doi.org/10.7488/ds/2645. Changes: utterances
  trimmed, joined, loudness-normalised and resampled into the reference clips, which the TTS clones. The UK references
  are Phonon 31m output (Apache-2.0); the US ones are VoiceDesign output.
- **Recordings** (まるごと 聞く's real pieces): each one's source, licence and credit line in its YAML (`credit`), shown in
  the app (settings/LongCredits.svelte); excerpts, loudness-normalised and re-encoded, the CC ones shared under their
  licence.

### Packs

`static/audio/listen/<pack>.<hash>.pak`: whole m4a files end to end (`packing.ts`, `npm run kikimimi:packs`);
`packs.json` holds each pack's hash and its clips' offsets and lengths. A clip's home is its level's pack (`lv4`),
`ladder`, its unit's (`u-<id>`), its listening file's, its story chapter's or `mic-pairs`; slow takes in `-slow`; a
home past 1.2 MB (slow 0.8 MB) splits into stable parts (`planHome`), so re-speaking a clip changes its own pack only.
The packs stay m4a (ADTS would lose the priming and padding; WebKit decodes a slice exactly). Pages static, no R2
(decided): 153
packs, games 101.6 MiB and stories 21.4 MiB, under bank.test's budget (160 and 32 MiB), each fetched whole; Pages
takes files ≤ 25 MiB and 20,000 a deploy (static-files.test keeps static/ ≤ 18,000: lib/static-budget.ts).

### Playback

- **The engine** (sound/engine.ts, sound.svelte.ts): a `voice` bus following the master volume only (silent at 音量 0);
  `voiceSession(on)`, inside a tap, unlocks the context even when sound is off and sets the audio session to
  `playback` (it plays with the silent switch on); `playVoice` starts a clip at its relay time, ducking the music;
  decoded buffers in an LRU of 4 (`CLIP_CAP`). **Dialogues** (clipPlayer.svelte.ts `playSequence`): each line at its
  relay time, two at once in an overlap.
- **Fetching** (`components/kikimimi/packs.ts`, `lib/packStore.ts`): Pages answers a Range with the whole file, so a
  pack is fetched whole, once, held in memory (12 MB) and each clip cut from it. `prefetchClips` fetches a deck's packs, the first question's first, then the rest, once a game is in sight
  (あそぶ and its pages, みんなで, a lesson's card, another's lobby: `QuizGame.ahead`) or at the countdown, never for a look
  at the hub; none after the sheet closes (`clear`). Each clip is decoded just in time (1-3 ms).
- **Caching:** the service worker's `island-listen-v1` (caches.ts `LISTEN_CACHE`; docs/backend.md "Service worker"):
  cache first, never revalidated (the hash is in the name), LRU by pack under 30 MB, a pack used in the last 10
  minutes never evicted. Offline, a deck plays only the packs it has had. Packs are never precached; backdrops are
  cached on first use.

## Conditions

A clip can carry `cond: {kind, level, bed?}` (bank.ts `Cond`): a channel (`phone`, `signal`, `voicemail`, `pa`) or a
bed (`cafe`, `street`, `station`, `party`), `light` or `heavy`, and a channel's bed behind it (a PA on a platform:
`pa` + `station`). A dialogue's lines take the item's unless a line has its own. `conditions.ts condOf`: the clip's
own, else a phone's light `phone` (voicemail, or `signal` on a line that breaks off), a PA's light `pa`; video, face
to face and たちぎき stay clean. Levels 1-3 never have one. `condPlan` sets the mix (bands, codecs, rooms and the beds'
SNR: conditions.ts's header), carried out by `scripts/kikimimi-audio.ts` with `scripts/tts/dsp.ts`. Only a line that
breaks off gets `signal`, and the player asks again on the next line, so a dropout never falls on a memo answer.
- **The beds** (`app/scripts/tts/beds/`, committed): `npm run audio:kikimimi-beds` synthesises them from our own TTS
  clips and seeded noise, so there's no third-party audio; `party` ships for たちぎき.
- **Hashes.** A conditioned clip's source hash is its master's plus the plan, the bed's hash and a version
  (`condSource`), so a changed bed or setting re-mixes only its clips and never re-speaks.
- **QA.** The strict gate runs on the clean take; the mixed clip gets a loose whisper WER check (conditions.ts
  `COND_MAX_WER`, `SIGNAL_MAX_WER`), else it's flagged `cond-wer`. The clean take is kept
  (`.cache/tts/clean/<id>.m4a`) for the word timings. Tests: conditions.test.
- **Where:** level 4's phone and PA clips and noisy scenes (`staging.ts NOISE`; heavy under 15 %); the pack, the sets,
  the units and the listening files as written.

## The games

What each game deals and grades. The listening games' player-facing summary is kikimimi.md "遊ぶ"; why each exists,
curriculum.md "Modes".

### しゅうまつ たいかい

しずえの しゅうまつ たいかい, a weekend quiz show from the week's misses (`games/taikai/`).
- **Window** (`window.ts`): Fri 18:00 – Mon 05:00 Tokyo.
- **The deck, and why `ids`.** A phone knows only its own player's answers, so no phone can deal the others' misses
  from a seed: each phone offers ≤ 4 of its misses in the lobby as `ev` ops, the host picks (`taikaiPick`: round-robin,
  topped up with fresh items, the hardest last as the wager) and sends the pick as the `open`'s `ids` (≤ 8); every
  phone deals from the open alone.
- **Points:** a right question pays 100 × (1.5 − expected at the player's tier, `tierOf`): 50 for a sure thing, up to
  150 for a stretch, so in 勝負 a lower place can win.
- **The wager** (the last round): 100 round-only chips, a bet of 10–100 before choosing, the answer
  `[choice, bet / 10]`; right pays ×2, wrong loses it; 15 s more. A missed bet ≥ 70 is `wagerReveal` 'confident-miss'
  (hypercorrection).
- **Results:** co-op counts the team's rounds against しずえ's target (`taikaiTarget`); `trophyOf` bronze / silver /
  gold. The row: `gm` 'taikai', `u` the trophy, `lv` the tier's level; `trophiesOf(rows)` the best per weekend. しょうぶ
  ranks by points plus chips.

### みみ チェック

The placement (`games/check/`): solo, nothing on the wire, rounds dealt one at a time through `GameDef.next`. It
starts at かわ (the bands are the places: はまべ 1, はまべ 2, かわ, もり, やま, ほし), goes up a band after 2 right and down after 1
wrong, and stops after two reversals (at least 8 items) or at 12. The skills take turns (すうじ, つながる おと, へんじ・ほんね, にた おと,
one gist) over the places' voiced items (`TAIKAI_IDS`). The placed band is the reversals' mean, rounded down; each
skill's band gives the chips. A `listen` row `{gm: 'check', lv: <placed level>, u: <a digit a skill, x unsampled>}`.
Other games' tiers come from `join.tr`.

### The listening games

ことば タイル, たちぎき, ようじ でんわ, すうじ ラッシュ and しずえの ニュース deal `listened` files at the lobby's place and share
`games/listened.ts` (pure): `EMPTY` (63), `ROLES` (2), `listenOpts` (`[lv, timer, ear]`), `filesOf(gm, lv)`, `tierAt`,
`shareOf` (a role's slots or rows), `cvOver`, `listenGame` / `listenRecord` over a game's `ListenRules`. Each lane.ts
is one line, `listenLane(RULES, deal, more?)`. **The ear** is each player's tier (0 はまべ … 3 やま: taikai's `tierOf`)
against the deck's place: below, easy; above, hard; else as authored. Co-op has two roles, one co-op rule per game,
and the team tally is `team.all`. The pages share `components/kikimimi/listenView.ts`. A unit's lesson on recipe 2
deals their cards with the same deals and rules (curriculum.md "Recipe 2"). Every game has an e2e solo, at night and
co-op on the shipped files.

### ことば タイル

Rebuild what you heard (`games/tile/`, `components/kikimimi/tile/`). 6 sentences by the seed, the shortest first; the
clip plays once with no tiles, then the words plus 1–4 sound decoys (weak forms, contractions) appear, tapped into
order. A card is an Item whose `id` is the clip it plays, its `tile.id` the row's id.
- **Tiers:** easy, the first authored decoy and my first slot placed; hard, decoys topped up to 3–4 from a sound-swap
  table over the sentence's own words.
- **Answer:** the board's index per slot, `EMPTY` for none; valid: one per slot, each tile once. Right: every filled
  slot holds its word and they're the whole sentence or one role's half. 100 a sentence; a replay costs nothing.
- **Co-op:** role 0 fills the odd slots, role 1 the others; the partner's slots dashed. **Row:** `gm: 'tile'`,
  `[tile id, ok, wrong-slot mask, rp]` (`listenRecord`).

### たちぎき

Overheard three-speaker talk (`games/tachi/`, `components/kikimimi/tachi/`). 2 conversations of 30–50 s, 3 rounds
each: opinions (match three Japanese claims to three faces), changed (who changed their mind), plan (what happens
next).
- **Timing:** the conversation plays before the opinions round only (answer +10 s); changed and plan have no clip and
  nothing replays at their reveals (`quietReveal`). After the first play each line replays alone (`game.hear`, not
  counted as a replay).
- **Offsets:** a line's `at` (negative = overlap, only where the line's start carries no answer) feeds
  `sequenceStarts` and `itemDur`, played on the audio clock, not baked, so a line still replays alone.
- **The party bed:** a file tagged `party` loops `party.<sha8>.m4a` under the whole sequence at +15 dB SNR
  (clipPlayer.svelte.ts `PARTY_BED`, `BED_GAIN`), so its lines are voiced dry.
- **Answers:** opinions `[speaker of claim 0, 1, 2]`, right when every placed face is at its claim and the faces are
  all three or one role's two; changed a speaker; plan a choice. Easy: the third claim placed.
- **Co-op (each their speaker):** role 0 follows the first speaker, role 1 the second, the third is shared; everyone
  answers changed and plan. **Row:** `gm: 'tachi'`, `[row id (<id>-op|ch|pl), ok, pick, rp]`, opinions in base 4.

### ようじ でんわ

Phone errands that change mid-call (`games/call/`, `components/kikimimi/call/`: CallPlay, MemoPad, Basket, CallLog). 3
calls by the seed, 2 rounds each: round 1 the call (lines `<id>-<n>` on the relay clock), round 2 `<id>-memo` with no
clip. Fill a memo of chip rows (what, how many, when, where); the reveal fills the errand's basket with what you
caught.
- **Tiers** (`tierAt`): easy 2 rows, as authored 3, hard 4 plus a sound-trap chip on a number's row (`trapOf`: teen ↔
  -ty, else two digits swapped).
- **Answer:** the chip per row; right: every filled row right and they're the whole memo or one role's share. The
  chips take taps while the call plays; メモできた sends once it ends.
- **Co-op (`kiki.call.coop`):** both hear the whole call; a round's rows split by place; the team's memo (`unionOf`)
  shows a wrong chip over a right one.
- **Reveal:** the right chip and its `cja`, the basket (`basketOf`), and at round 2 the `note`, 解説 and the transcript.
  PhoneFrame's bars drop to 1 while a `signal` line plays. **Row:** `gm: 'call'`, `[call id, ok, wrong-rows mask, rp]`
  (`listenRecord`).

### すうじ ラッシュ

A café rush of numbers (`games/rush/`, `components/kikimimi/rush/`). `npm run kikimimi:rush` expands 60 frames by four US
voices into s1-rush.yaml and s2-rush.yaml (240 customers, a third corrected mid-order; the script's header has the
chips); rush.test checks the files are as generated.
- **Deck:** 8 customers by the seed, never two of one frame; a card is a `num` Item with `rush: {ask, at, was, b}`.
- **Tiers:** hard all 4; as authored 3 (never dropping `was` or the twin); easy 3, `was` dropped. **Timing:** answers
  open when the order ends; 8 s (`WINDOW`) whatever 答える時間, none with なし.
- **Points:** `questionPoints(ear, b)` (b the place, +0.5 for a correction), so しょうぶ works against expectation. A
  **combo** counts first-listen rights in a row; a miss resets it and the customer repeats the line.
- **Co-op (two registers):** customer i goes to register `i % 2`; the other phone answers `PASS` (99): valid, never
  right, no row.

### しずえの ニュース

The morning bulletin (`games/news/`: def.ts, weather.ts; `components/kikimimi/news/`). On じっくり only; きまぐれ picks it
05:00-11:00 (catalog `hours: [5, 11]`).
- **Content:** news-a.yaml and news-b.yaml, stage 4 (やま), 30 evergreen bulletins read by しずえ: two segments of 3–5
  lines, a `gist` and a `detail` question. The kind `weather` (`news-wx`) holds the tail as whole-sentence clips
  (skies, the high as a template, alerts, the sign-off).
- **The weather:** from the relay's timeline (`hi`: relay/src/weather.ts `highOf`), read by `newsWxOf` and `tailKeys`
  (weather.ts's header). With no timeline the sign-off follows segment 2 and there's no umbrella question.
- **Deck:** the seed is the Tokyo day (`Lane.seed`); `bulletinOf` takes the day's season or `any`, `day % n`. Options
  `[lv, timer, ear + 4 × sky byte, high byte]` (`newsOpts`: the host's weather, so every phone plays and grades the
  same tail). Cards: the gist, `<id>-d` and `<id>-kasa` (with the weather), the last two with no clip.
- **Tiers:** easy shows the answer and its `trap` only. **Rounds:** the bulletin plays before the gist (+5 s to read);
  NewsStage's chips replay a segment. **Row:** `gm: 'news'`, `[card id, ok, choice, rp]`.

### 音の へんしん

The connected-speech drill (`games/henshin/`: def.ts, lane.ts, match.ts, reduce.ts; `components/kikimimi/henshin/`;
the player's side kikimimi.md "音の へんしん"). Its phrases are level 8 (content/henshin.ts, in the bank and the index like
any level, but in no level's mix, so never a quiz level, a place or the tournament's), compiled as `lv8`; its mode
comes with its registry line (`HENSHIN_MODE`) once level 8 has 12 phrases.
- **Options** `[8, timer, ear, focus]` (`henshinOpts`): the host's ear and today's phenomenon (the sheet's `focus`:
  progress.svelte.ts `currentHenshin`, a pick on the mode page or henshin.ts `focusOf`). cv `henshin:8`.
- **Deck** (`henshinDeal`): kikimimi.md's 8 by the seed, each next in the voice most unlike the last; the kinds
  alternate, a pick first.
- **Rounds:** `henshin.pick` (the choices at my tier in the deal's order; easy keeps two) and `henshin.type` (the
  focus's words, the board: those and the wrong choices' words as decoys, hard topped up from sound swaps). A
  dictation is answered as tiles, the board's index per word; a typed one is matched on the phone (match.ts
  `matchTyped`) and sent the same way (`typedAnswer`: a word right its tile, else `OTHER` 62), so nothing typed goes
  on the wire. The window grows 3 s a missing word.
- **Row:** `gm: 'henshin'`, `lv` 8, `[id, ok, pick, rp]`: a pick's choice as authored, the dictation's wrong words as
  a mask (`henshinRecord`).
- **Takes:** natural `<id>`, careful `<id>-c` and fast `<id>-f` (bank.ts `takeIds`) share its pack.
- **Review:** srs.ts `practicePicks` takes a due level-8 card through a sibling of the same phenomenon; progress.ts
  leaves level 8 out of θ, the difficulties, the trend and the nudge.

### まるごと 聞く

The long piece (`games/long/`: def.ts, lane.ts; `components/kikimimi/long/`; the player's side kikimimi.md "まるごと 聞く").
Content: content/listen/s4-long-a…d.yaml (`game: long`, stage 5; a and b generated, c and d real), compiled as listen
parts; their questions and dictation lines also go into the index's `long` (listen.ts `longEntries`: きろく and おさらい know
them).
- **Options** `[lv, timer, ear, piece]` (`longOpts`): the host's piece (a pick on the mode page or def.ts `pieceFor`).
- **Deck** (`longDeal`): the piece's questions in order, the first card carrying its lines. **Rounds:** the piece
  plays before the first question, +8 s to read. **Row:** `gm: 'long'`, `[q id, ok, choice, rp]`; the dictation a row
  of its own after it (`QuizGame.keepMore`, nothing on the wire).
- **Audio:** a generated line at −18 LUFS, 32 kbps; a real line cut from its recording (`npm run kikimimi:real`, its
  sha256 checked). A file is one pack (≤ 8 MB), fetched whole.
- **Checks:** listen.ts `checkLong`, tells.test's `long` group, long.test (licences, credit lines, 2–6 minutes, every
  line heard by whisper within align.ts's bounds), e2e kikimimi-long.

### よみきき サンド

Listen blind → read → listen blind, over any item: 読んでから もう一度 (frame/SandButton) under a solo reveal's verdict (never
in co-op: it would hold up the partner) and in an open review row. frame/Sandwich is a full-height sheet: the clip
blind, then the transcript with its marks, `cja` and `why`, then the clip blind again, then 聞き取れた ／ まだ. まだ is a
device-local mark (`DEVICE.kikiMada` `{[who]: [id, day][]}`, ≤ 200) that srs.ts folds as "hard" after that day's
answers; no row change, nothing on the wire.

## Performance

- The island's first load carries ~4 KB of ききみみ (the invite listener and host, the `listen` contract, the pill, the
  cues); the rest as in "Loading" and "Playback". The island's render loop idles under the sheet.
- During play nothing renders per frame but the karaoke (only while a clip replays); bars, timer, bob and waves are
  CSS; the view refreshes at each phase's end (at least every 3 s; not while the page is hidden, once when it's back).
  Outside the questions (idle, a lobby, the results) the clips stop on entering, and a replay there (a review ▶︎,
  まるごと's 通しでもう一度, the lobby's 🔊) plays through the refreshes.

## Tests

Pure vitest for every fold, deck and GameDef (session.test with fake time: lost messages, the beacon, the host gone, a
stale `open`). e2e per game solo and co-op on the default wire and over the dual stack (`?wire=quiz`), logic tier
(kikimimi.md "Tests"). Byte budgets per op at the worst case (live-protocol.test).
