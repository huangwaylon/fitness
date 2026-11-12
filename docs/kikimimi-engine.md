# ききみみ engine: rounds, the wire, content and audio

The platform under every ききみみ game. The player's side is [kikimimi.md](kikimimi.md); what is taught,
[curriculum.md](curriculum.md); the mic modes, [kikimimi-mic.md](kikimimi-mic.md); the relay's side, docs/backend.md
("Live relay", "Events" `listen`, "Service worker"). What isn't built: kikimimi.md "Open items".

## Files

```
app/src/lib/kikimimi/
  round/          game-agnostic, pure, no Svelte: session, schedule, tally, wire, link, decks, types, registry
  games/<gm>/     def.ts (a pure GameDef) and lane.ts; listened.ts + listenLane.ts (the listening games);
                  versions.ts (BUILD_V); modes.ts (the mic modes' metas)
  bank*.ts, dialogues.ts, content/, source.ts, ladders.ts           the TS banks
  compile.ts, pool.ts, packing.ts, units.ts, listen.ts, story.ts, levels/   the compiler and its output
  progress.ts, srs.ts, advice.ts, path.ts, today.ts, week.ts, stamps.ts …   the folds behind 記録 and the menu
app/src/lib/components/kikimimi/
  frame/          the shared round, reveal and results parts ("Shared UI")
  <gm>/views.ts   a game's lazy lobby / play / results pages
  nav.ts, KikimimiSheet.svelte, game.svelte.ts, clipPlayer.svelte.ts, chunkQueue.ts, packs.ts
  hub/, asobu/, mode/, path/, zukan/, story/, taikai/, settings/, onboarding/, lesson/, scene/, mic/   (lazy)
  KikimimiHost.svelte, invite.svelte.ts   always loaded; hear `quiz` and `play`
app/content/units/, app/content/listen/ (README.md: the listening schemas), app/content/mic/
```

The phone's ききみみ keys are `DEVICE.kikimimi*`, `kiki*` and `mic` (sync/storage.ts).

## The round engine

### Types

`round/types.ts`, each field documented there. An `AnswerValue` is an int 0–255 or ≤ 12 ints 0–63; `RoundTiming
{lead, play, answer, auto?}` in ms (an `auto` reveal moves on after 3 s; every other reveal is untimed);
`GameDef.next` deals an adaptive game's next round (みみ チェック, くりかえし).

**Roles.** `go`'s `pl` is the host's bitmask of players at the start (A=1, B=2, G=4); every phone derives `players`
and `role(who)` from it; a late joiner takes `index % roles`. **Tiers** (`GameDef.tier`): the host's rides `o`, each
player's their `join`'s `tr`; `Game.deckFor(w)` is that player's deck at their tier (same rounds and timing), and
tally.ts grades with it, so team tallies and scores agree on every phone.

### RoundSession

`round/session.ts`, pure: folds intents and the clock into `{phase, players, answers, scores, i}`; its windows are
`WINDOWS` there. `answer` validates with `deck.valid`; `s` is capped at `maxScore`; rounds ≤ `PLAY_ROUNDS` (32), the quiz
family's `QUIZ_QS` (8). A heard `open` whose cv isn't mine, or of an unknown game or options, is `blocked: 'update'`
(the card offers 更新する); a `quiz` open has no cv and is never blocked.

**Content before the deck.** Decks deal synchronously but content loads lazily: game.svelte.ts holds a heard `open`
and everything after it (chunkQueue.ts) until its lane and chunks are in, then hands them over in order.

### The quiz as a GameDef

`games/quiz/def.ts`: `opts [lv, timer]` (timer: `TIMERS`' index); `deck(seed, lv)`, a round per item (games/quiz/kinds.ts),
`grade = points(right)`. スピード はしご is `ladder` (same opts; a `ladder.rung` round per rung, lower reveals `auto`, the
deck's `score` the climb). `lesson` (opts `[lv, timer, lesson, tier]`, its unit `u`) is a unit's lesson (curriculum.md
"Lesson decks and stamps"). `games/quiz/session.ts` `QuizRounds` is the quiz sheet's lobby; にがて れんしゅう stays a local
deck (srs.ts).

### The registry

Every game is a lane in `round/registry.ts` (`Lane`, documented there): quiz, ladder, lesson, taikai and check ride the
sheet's chunk (`EAGER`); a later game is one `LATER` line and its own chunk.
- **Pages:** `components/kikimimi/<gm>/views.ts` exports lazy `{ lobby?, play?, results? }`, mounted through `<Lazy>`.
- **Strings:** `i18n/kiki-<gm>.{ja,en}.json` (`kiki.<gm>.*`), added by the views' `kiki-<gm>.ts` (deps.test: kikimimi/
  may not import i18n/).
- **Catalog** (catalog.ts): each mode's shelf, icon, `places` and `game`. A lane's mode shows once its `LATER` line
  exists and a file of its game is `listened` (`LANES.ready`), or its `content()` says so. A mic mode brings its own
  `mode` (`addMode`).
- **A new game:** its lane, views and content; a `BUILD_V` line; `npm run kikimimi:levels`; teach cv.test's `decksOf` its
  deal. Tests: its kinds (determinism, grade, team, the row's round-trip through `listenOf`, `valid` bounds), the
  budget, one e2e solo and one co-op.

### Shared UI

`components/kikimimi/frame/`: the frames every game fills with snippets (RoundFrame, RevealFrame, Results /
ResultsShell, ScoreCard), the review rows (ReviewList, ReviewRow, LineRow, HearButton, Note, FirstStamp, Why),
ChoiceGrid (with the mic's answer slot), PlayerChip, Sandwich / SandButton; `Transcript` and `scene/*` beside it. Every
`data-kiki-*` hook stays on its element.

## Sync

Two presence-only intents (contract/live-protocol.ts): unstored, unacked, never replayed, sent to all others, the
guest's as the members' (`guestMayWrite` rules stored events only). Client messages ≤ 210 bytes (the relay adds `who`
and `t`; `MAX_BYTES` 256); live-protocol.test builds the maximal message for every op. The relay deploys first for any
contract change. A lobby kept alone sends nothing. The banner and the sheet reuse the island's Live.

### The play wire

`PlayWire` (contract/live-protocol.ts; the session's `RoundOut` in round/wire.ts): ops `open` (`cv, seed, f, o, u?,
ids?`), `join` (`tr?`), `leave`, `end`, `go` (`at, pl`), `a` (`i, k, rp, s`), `skip` (`i, at`) and `ev` (`i, e, x?`: the
tournament's miss offers, free for extras). `playOf` keeps known fields only, each bounded; `gm` is checked by `GM_RE`,
never a list (the relay doesn't know the games); `f` bit 0 is 音を1台にまとめる, bit 1 勝負. Extend through `o` and `ev`,
never new top-level fields.

### The host is the clock

- Every phone has the deck and each clip's `dur`. Question 0 starts at `go.at`; within a question every phone computes
  the lead, the clip and the answer window. The reveal starts at the limit or once everyone joined and here has
  answered, and is untimed: the next start comes only from a `skip` (session.ts `schedule`).
- Every phone adopts the host's `skip`, even back to a question it passed; starts never decrease. A lost `skip` costs at
  most one beacon (3 s); a lost `a` is corrected by the next `s`.
- **The host gone** (its `leave`, or its presence gone 15 s, `hostGrace`): every phone shows 次へ; a tap sends a skip the
  others follow. A host back adopts the players' position. A phone whose own socket is down ignores presence.
- **Late messages.** A question whose clip began > 5 s before it was heard is sat out (`out`); sooner, it plays from
  then. Untimed, nothing is sat out.
- **Re-sends.** When someone's presence returns, the host re-sends `open` (in a game, `go` and its position) and a
  player its `join`, its `a` under way and its 読み終わった.

### cv, the content version

6 hex of a hash per game over only what shapes the deck and the schedule: item ids, order, choice counts and answers,
the mix, clip lengths to 10 ms, `gm`, and the game's `BUILD_V` (games/versions.ts, bumped by hand when its deal
changes). Text, notes and marks are left out, so a copy fix never blocks co-play. compile.ts `gameCv`; levels/index.json
`games`; pool.ts `gameCvOf`. cv.test's golden keeps each game's cv and a digest of its decks (seeds 0–19): decks changed
under the same cv fail with "bump BUILD_V"; a deliberate change is `vitest -u`.

### Wire migration

`{kind:'quiz'}` is the quiz family's wire from builds before `QUIZ_ON_PLAY`: heard, never sent. `SEND_PLAY` and
`QUIZ_ON_PLAY` are on (round/wire.ts `WIRE` 'play'), and every build since the dual stack hears both; `?wire=quiz|
guarded|play` forces a mode in the e2e. Left: stop parsing `quiz` on the client (no sooner than 11-24), then drop it
from the contract, relay last, gated on the `ws.hello` log.

### The listen row

`contract/listen.ts`: `listen {d, g, lv, n, ms, p?, r}` plus `gm?` (absent: the quiz), `u?`, a lesson's `l?` (1 であい, 2
ばめん, 3 チェック, 4 おと, 5 じっせん) and `tm?` (0–6, the team's first-listen rights). `r`: 1–12 answers `[id, ok, pick,
rp]`, only the questions I had; `pick` −1…4095 (a tile round's wrong-slot mask, a memo's wrong rows, opinions in base 4);
`lv` 1–8 (the stage for games without levels). A mic game's row is minutes only (`minutesOnly`). The relay checks rows
with the same file and refuses unknown keys, so row fields ship relay first; an older build skips answers whose id it
doesn't know. `stampsUnit`: curriculum.md "Playing together".

## Content

- **Items** (`bank.ts` `Item`), authored in `bank1.ts` (levels 1–3), `bank4.ts` and `dialogues.ts` (4), `bank5.ts` (5) and
  `content/` (the sets), gathered in `source.ts` `BANK`: input to the compiler, the audio scripts and the tests, never
  the app ("Loading"). A dialogue's `lines` each have their own `cast`; staging (`scene`, `channel`, `marks`) defaults
  from the tags (bank.ts `channelOf`, staging.ts).
- **Counts** are bank.test's (levels 1–7, the 30 ladders `sp-<name>`). A set written after its level was offered waits
  for its voices (content/index.ts `WAITING`): `BANK` takes its items only once all their clips exist.
- **`deck.ts`**: `deck(seed, lv)` is deterministic over the level's loaded items (the mix, never one type more than twice
  in a row, choices shuffled by the seed), so every phone builds the same deck from `{seed, lv}` and no text goes on the
  wire. `LEVELS`: the levels this phone offers.
- **`score.ts`** grades; `clips.ts` times the clips (a line's `at`, else `LINE_GAP` 0.3 s).

### The sets

`content/index.ts` `SETS`: もり's two (level 4: daily life; work and people), やま's two (6: idioms and banter; negotiation
and bad news), ほし (7: news, talks, debates), variety (4 and 6) and かわ's breadth set (3). Prefixes and rules:
content/sets.test.ts.
- ほし's `mean` and `gist` run 2–4 sentences (≤ 45 words); a single-clip `gist` asks what a bulletin is about, a
  single-clip `next` what the speaker says next. ほし is on the plain stage.
- `withBed`: a live item in a café, street, platform or gate scene gets that bed, light; `word` items stay clean.
- Clip caps by level and kind: bank.test.

### Variety

- Each phone keeps the item ids of its last 6 games (`DEVICE.kikimimiRecent`; recent.ts `remember`).
- **A shared game:** the host tries 24 seeds (`freshSeed`) and keeps the deck least overlapping its history (an item
  from the last game weighs 6, the oldest 1). The seed's low bits stay the lobby's flags.
- **Solo and おさらい** draw items not heard lately first (`deck(seed, lv, mix, seen)`, srs.ts `practiceDeck`).
- **Near-duplicates** (near-dupes.test.ts): every clip's English and right answer against the others'.

### Listen parts

The listening kinds (`content/listen/*.yaml`; schemas and "Checks" in app/content/listen/README.md) compile with the
levels. `kikimimi/listen.ts` holds their types, checker and clip ids; the phone imports its types only. A problem in any
file stops the compiler; content.test runs the same checker.
- **Part** `levels/parts/<unit>.json`: the items minus `tts`, a `clip` id on every tile and line (`listenClipIds`), and
  the index's `units`, `listen` and `games` entries, so `load(<unit>)` works as for a level. **Gate:** every status
  compiles; past `draft` every clip must exist; games show `listened` files only. Each file's clips are its own pack.
- The US-only lint (`notUs`) also runs on units and the bank (`accent-exposure` exempt).

## Loading

- **The compiler** (`kikimimi/compile.ts`, `npm run kikimimi:levels`; the audio scripts run it at their end) writes
  `kikimimi/levels/`: `parts/` (a level's items with clips and timings, split past 54 KB gz as `lv4-1`, `lv4-2`…; the
  ladder; each unit, listening file and story chapter; the letters; the mic pairs) and `index.json` (each part, the cvs,
  the gates, every item's id, level, type, accent and features for 記録). YAML goes through hand-written checkers
  (units.ts, listen.ts, story.ts). Committed; levels.test fails while they differ from the compiler's output.
- **The phone** (`kikimimi/pool.ts`): the index is in the sheet's chunk (記録, the advice and おさらい read it alone); each
  part is a lazy chunk (`import.meta.glob`): `load(...)`, `loadChapter`, `loadLetters`; `levelItems(lv)` throws for a
  level not loaded (a deck from half a bank would differ between phones).
- **When.** The sheet loads the remembered level's chunk and those of lobbies heard; a heard `open` and my own taps wait
  for their chunk, in order. A chunk that won't load drops what waited; the host's re-sent `open` tries again.
- **The budget** (scripts/kikimimi-budget.ts, run by `npm run build`, and levels.test): the sheet's chunk ≤ 80 KB gz, the
  hub ≤ 25, each other page, game view and later lane ≤ 15, each level's part ≤ 60, a unit or listening part ≤ 32; the
  path index ≤ 12 KB at 200 units (units.test).

## Audio

### Generation

`npm run audio:kikimimi` (`app/scripts/kikimimi-audio.ts`, with `app/scripts/tts/tts.py` in uv venvs under
`app/.cache/tts/`), on the Mac, silent unless `--listen`. Its header holds the flags, setup, steps and QA numbers.
- **Engine:** Qwen3-TTS 1.7B Base (mlx-audio), seeded, cloning each cast voice's reference clip.
- **The cast** (`app/scripts/tts/cast.json`, 18 voices): 12 US designed by VoiceDesign (no real person); UK and AU for
  `accent-exposure` items only. Each villager has one US voice for good (cast.ts `CAST`).
- **Each clip:** `speech.ts spokenText` (`tts`, else `en` with numbers written out) → the seeded take → −16 LUFS mono
  AAC (stories and しずえの ニュース softer: `SOFT`); L1/L2's slow takes by atempo.
- **The gate:** whisper-cli hears every clip; a content word wrong or the voice drifting re-rolls with the next seed,
  the best take kept and the rest flagged; a person's re-rolls are pinned (`PINNED`). `app/scripts/tts/report.json` has
  every clip's numbers and flags (curriculum.md "Listening check").
- **音の へんしん's takes:** careful (speech.ts `carefulText`, slowed by `CAREFUL_TEMPO`, through the gate) and fast (the
  natural take sped up, `FAST`; flagged, never re-rolled). `npm run kikimimi:reduce` checks each phrase is heard reduced
  into `reduce.json`.
- **Word timings** (`npm run audio:kikimimi-words`): whisper-cli's word timestamps into `words.json`, compiled into the
  parts. Only clips whose source hash changed are re-made (`app/scripts/kikimimi-clips.src.json`).
- **Attribution.** The AU voices are derived from the CSTR VCTK Corpus (CC BY 4.0): Yamagishi, Junichi; Veaux,
  Christophe; MacDonald, Kirsten. (2019). *CSTR VCTK Corpus: English Multi-speaker Corpus for CSTR Voice Cloning
  Toolkit (version 0.92)*. University of Edinburgh, CSTR. https://doi.org/10.7488/ds/2645. Changes: utterances
  trimmed, joined, loudness-normalised and resampled into the reference clips, which the TTS clones. The UK references
  are Phonon 31m output (Apache-2.0); the US ones are VoiceDesign output.
- **Recordings** (まるごと 聞く's real pieces): each one's source, licence and credit line in its YAML (`credit`), shown in
  settings/LongCredits.svelte; excerpts, loudness-normalised and re-encoded, the CC ones shared under their licence.

### Packs

`static/audio/listen/<pack>.<hash>.pak`: whole m4a files end to end (`packing.ts`, `npm run kikimimi:packs`);
`packs.json` holds each pack's hash and its clips' offsets and lengths. A clip's home is its level's pack (`lv4`),
`ladder`, its unit's (`u-<id>`), its listening file's, its story chapter's or `mic-pairs`; slow takes in `-slow`; a home
past 1.2 MB (slow 0.8 MB) splits into stable parts (`planHome`), so re-speaking a clip changes its own pack only. m4a,
not ADTS (ADTS loses the priming and padding; WebKit decodes a slice exactly). Pages static, no R2 (decided): bank.test
caps the games' packs at 160 MiB and the stories' at 32 MiB; Pages takes files ≤ 25 MiB and static-files.test keeps
static/ under its file count (lib/static-budget.ts).

### Playback

- **The engine** (sound/engine.ts, sound.svelte.ts): a `voice` bus on the master volume only (silent at 音量 0);
  `voiceSession(on)`, inside a tap, unlocks the context even with sound off and sets the audio session to `playback`
  (plays with the silent switch on); `playVoice` starts a clip at its relay time, ducking the music; decoded buffers in
  an LRU of 4 (`CLIP_CAP`). **Dialogues** (clipPlayer.svelte.ts `playSequence`): each line at its relay time.
- **Fetching** (`components/kikimimi/packs.ts`, `lib/packStore.ts`): Pages answers a Range with the whole file, so a pack
  is fetched whole once, held in memory (`HOLD_BYTES`, 12 MB) and each clip cut from it and decoded just in time.
  `prefetchClips` fetches the first question's packs once a game is in sight (a mode's page, みんなで, a lesson's card,
  another's lobby: `QuizGame.ahead`), the rest of the deck's from the countdown; never for the hub or あそぶ; none after
  the sheet closes.
- **Caching:** the service worker's `island-listen-v1` (caches.ts `LISTEN_CACHE`; docs/backend.md "Service worker"):
  cache first, never revalidated (the hash is in the name), LRU by pack under 30 MB, a pack used in the last 10 minutes
  never evicted. Offline, a deck plays only the packs it has had. Never precached; backdrops cached on first use.

## Conditions

A clip can carry `cond: {kind, level, bed?}` (bank.ts `Cond`): a channel (`phone`, `signal`, `voicemail`, `pa`) or a bed
(`cafe`, `street`, `station`, `party`), `light` or `heavy`, and a channel's bed behind it (`pa` + `station`). A
dialogue's lines take the item's unless a line has its own. `conditions.ts condOf`: the clip's own, else a phone's light
`phone` (voicemail, or `signal` on a line that breaks off), a PA's light `pa`; video, face to face and たちぎき stay clean;
levels 1–3 never have one. `condPlan` sets the mix (conditions.ts's header), carried out by `scripts/kikimimi-audio.ts`
with `scripts/tts/dsp.ts`. Only a line that breaks off gets `signal`, and the next line asks again, so a dropout never
falls on a memo answer.
- **The beds** (`app/scripts/tts/beds/`, committed): `npm run audio:kikimimi-beds` synthesises them from our own TTS clips
  and seeded noise (no third-party audio).
- **Hashes.** A conditioned clip's source hash is its master's plus the plan, the bed's hash and a version
  (`condSource`): a changed bed re-mixes only its clips, never re-speaks.
- **QA.** The strict gate runs on the clean take; the mix gets a loose WER check (`COND_MAX_WER`, `SIGNAL_MAX_WER`), else
  `cond-wer`. The clean take is kept (`.cache/tts/clean/<id>.m4a`) for the word timings.
- **Where:** level 4's phone and PA clips and noisy scenes (`staging.ts NOISE`); the pack, sets, units and listening files
  as written.

## The games

What each game deals and grades. The player's side is kikimimi.md "遊ぶ"; why each exists, curriculum.md "Modes".

### しゅうまつ たいかい

A weekend quiz show from the week's misses (`games/taikai/`), Fri 18:00 – Mon 05:00 Tokyo (`window.ts`).
- **The deck, and why `ids`.** A phone knows only its own player's answers, so no seed can deal the others' misses: each
  phone offers ≤ 4 misses in the lobby as `ev` ops, the host picks (`taikaiPick`: round-robin, topped up with fresh
  items, the hardest last as the wager) and sends them as the `open`'s `ids` (≤ 8).
- **Points:** 100 × (1.5 − expected at the player's tier, `tierOf`): 50 for a sure thing up to 150 for a stretch, so in
  勝負 a lower place can win.
- **The wager** (the last round): 100 round-only chips, a bet of 10–100 before choosing (answer `[choice, bet / 10]`);
  right ×2, wrong loses it; 15 s more. A missed bet ≥ 70 is `wagerReveal` 'confident-miss' (hypercorrection).
- **Results:** co-op against しずえ's target (`taikaiTarget`); `trophyOf` bronze / silver / gold. Row: `gm` 'taikai', `u`
  the trophy, `lv` the tier's level; `trophiesOf(rows)` the best per weekend. 勝負 ranks by points plus chips.

### みみ チェック

The placement (`games/check/`): solo, nothing on the wire, dealt a round at a time through `GameDef.next`. Starts at
かわ (bands: はまべ 1, はまべ 2, かわ, もり, やま, ほし), up a band after 2 right, down after 1 wrong, stops after two
reversals (≥ 8 items) or at 12. The skills take turns (すうじ, つながる おと, へんじ・ほんね, にた おと, one gist) over voiced
items (`TAIKAI_IDS`). Placed: the reversals' mean, rounded down; each skill's band gives the chips. Row `{gm: 'check',
lv: <placed>, u: <a digit a skill, x unsampled>}`. Other games' tiers come from `join.tr`.

### The listening games

ことば タイル, たちぎき, ようじ でんわ, すうじ ラッシュ and しずえの ニュース deal `listened` files at the lobby's place and
share `games/listened.ts` (pure: `EMPTY` 63, `ROLES` 2, `listenOpts` `[lv, timer, ear]`, `filesOf`, `tierAt`, `shareOf`,
`cvOver`, `listenGame` / `listenRecord` over a game's `ListenRules`); each lane.ts is one `listenLane(RULES, deal, more?)`.
**The ear** is each player's tier (0 はまべ … 3 やま: `tierOf`) against the deck's place: below, easy; above, hard; else
as authored. Co-op has two roles; the team tally is `team.all`. The pages share `components/kikimimi/listenView.ts`. A
unit's lesson on recipe 2 deals their cards the same way (curriculum.md "Recipe 2"). Each has an e2e solo, at night and
co-op on the shipped files.

### ことば タイル

Rebuild what you heard (`games/tile/`). 6 sentences, shortest first; the clip plays once with no tiles, then the words
plus 1–4 sound decoys (weak forms, contractions) are tapped into order. A card's `id` is the clip, its `tile.id` the
row's id.
- **Tiers:** easy, the first authored decoy and my first slot placed; hard, decoys topped up to 3–4 from a sound-swap
  table over the sentence's own words.
- **Answer:** the board's index per slot (`EMPTY` none), each tile once. Right: every filled slot holds its word and they
  are the whole sentence or one role's half. 100 a sentence.
- **Co-op:** role 0 the odd slots, role 1 the others. **Row:** `[tile id, ok, wrong-slot mask, rp]`.
- **Input:** a tap fills my next empty slot (its dashed yuzu outline) or takes a placed tile back; a drag past 8 px
  (`tile/drag.svelte.ts`, Pointer Events, `touch-action: none` on tiles and my slots only while the window is open)
  drops onto a slot (a filled one: inserted, the rest shifting into the nearest empty slot of mine, else replaced),
  moves a placed tile (a list reorder) or takes it back; the sentence previews the drop while held (`tile/drop.ts`,
  pure). Shifting walks my slots only (never the partner's or easy's given word, which is fixed: no lip, a pin). The
  window's end cancels a drag. With my slots full, a tile's tap flashes the sentence's outline.

### たちぎき

Overheard three-speaker talk (`games/tachi/`). 2 conversations of 30–50 s, 3 rounds each: opinions (match three Japanese
claims to three faces), changed (who changed their mind), plan (what happens next).
- **Timing:** the conversation plays before opinions only (+10 s); changed and plan have no clip and nothing replays at
  their reveals (`quietReveal`). After the first play each line replays alone (`game.hear`, not a replay).
- **Offsets:** a line's `at` (negative = overlap, only where its start carries no answer) feeds `sequenceStarts` and
  `itemDur`, played on the audio clock, not baked.
- **The party bed:** a file tagged `party` loops `party.<sha8>.m4a` under the sequence at +15 dB SNR (clipPlayer.svelte.ts
  `PARTY_BED`, `BED_GAIN`), its lines voiced dry.
- **Answers:** opinions `[speaker of claim 0, 1, 2]`, right when every placed face is at its claim and they're all three
  or one role's two; changed a speaker; plan a choice. Easy: the third claim placed.
- **Co-op:** role 0 follows the first speaker, role 1 the second, the third shared; everyone answers changed and plan.
  **Row:** `[<id>-op|ch|pl, ok, pick, rp]`, opinions in base 4.

### ようじ でんわ

Phone errands that change mid-call (`games/call/`). 3 calls, 2 rounds each: the call (lines `<id>-<n>` on the relay
clock), then `<id>-memo` with no clip: a memo of chip rows (what, how many, when, where); the reveal fills the errand's
basket with what you caught (`basketOf`).
- **Tiers** (`tierAt`): easy 2 rows, as authored 3, hard 4 plus a sound-trap chip on a number's row (`trapOf`: teen ↔
  -ty, else two digits swapped).
- **Answer:** a chip per row; right when every filled row is right and they're the whole memo or one role's share. Chips
  take taps during the call; メモできた sends once it ends.
- **Co-op:** both hear the call; the rows split by place; the team's memo (`unionOf`) shows a wrong chip over a right
  one. PhoneFrame's bars drop to 1 while a `signal` line plays. **Row:** `[call id, ok, wrong-rows mask, rp]`.

### すうじ ラッシュ

A café rush of numbers (`games/rush/`). `npm run kikimimi:rush` expands 60 frames by four US voices into s1-rush.yaml and
s2-rush.yaml (240 customers, a third corrected mid-order); rush.test checks they're as generated.
- **Deck:** 8 customers, never two of one frame; a card is a `num` Item with `rush: {ask, at, was, b}`.
- **Tiers:** hard all 4 chips; as authored 3 (never dropping `was` or the twin); easy 3, `was` dropped. Answers open when
  the order ends; `WINDOW` 8 s whatever 答える時間, none with なし.
- **Points:** `questionPoints(ear, b)` (b the place, +0.5 for a correction), so 勝負 scores against expectation. A
  **combo** counts first-listen rights in a row; a miss resets it and the customer repeats the line.
- **Co-op:** customer i goes to register `i % 2`; the other phone answers `PASS` (99): valid, never right, no row.

### しずえの ニュース

The morning bulletin (`games/news/`), on じっくり; きまぐれ picks it 05:00–11:00 (catalog `hours`).
- **Content:** news-a.yaml and news-b.yaml, stage 4 (やま), 30 evergreen bulletins read by しずえ: two segments of 3–5
  lines, a `gist` and a `detail` question. The kind `weather` (`news-wx`) holds the tail as whole-sentence clips.
- **The weather:** from the relay's timeline (`hi`: relay/src/weather.ts `highOf`), read by `newsWxOf` and `tailKeys`
  (weather.ts's header). With no timeline the sign-off follows segment 2 and there's no umbrella question.
- **Deck:** the seed is the Tokyo day (`Lane.seed`); `bulletinOf` takes the day's season or `any`, `day % n`. Options
  `[lv, timer, ear + 4 × sky byte, high byte]` (`newsOpts`: the host's weather). Cards: the gist, `<id>-d` and
  `<id>-kasa` (with the weather), the last two with no clip.
- Easy shows the answer and its `trap` only. The bulletin plays before the gist (+5 s); NewsStage's chips replay a
  segment. **Row:** `[card id, ok, choice, rp]`.

### 音の へんしん

The connected-speech drill (`games/henshin/`). Its phrases are level 8 (content/henshin.ts, in the bank and index like
any level but in no mix, so never a quiz level, a place or the tournament's), compiled as `lv8`; the mode
(`HENSHIN_MODE`) shows once level 8 has 12 phrases.
- **Options** `[8, timer, ear, focus]` (`henshinOpts`): the host's ear and today's phenomenon (progress.svelte.ts
  `currentHenshin`: a pick on the mode page, else henshin.ts `focusOf`). cv `henshin:8`.
- **Deck** (`henshinDeal`): 8 phrases, each in the voice most unlike the last; the kinds alternate, a pick first.
- **Rounds:** `henshin.pick` (the choices at my tier; easy keeps two) and `henshin.type` (the focus's words; the board
  adds the wrong choices' words as decoys, hard topped up from sound swaps). Tiles send the board's index per word; a
  typed answer is matched on the phone (match.ts `matchTyped`) and sent the same way (`typedAnswer`: a word right its
  tile, else `OTHER` 62), so nothing typed goes on the wire. The window grows 3 s a missing word.
- **Row:** `lv` 8, `[id, ok, pick, rp]` (`henshinRecord`). **Takes:** `<id>`, careful `<id>-c`, fast `<id>-f` (bank.ts
  `takeIds`) share its pack.
- **Review:** srs.ts `practicePicks` brings a due level-8 card back through a sibling of the same phenomenon;
  progress.ts leaves level 8 out of θ, the difficulties, the trend and the nudge.

### まるごと 聞く

The long piece (`games/long/`). Content: content/listen/s4-long-a…d.yaml (`game: long`, stage 5; a and b generated, c
and d real), compiled as listen parts; their questions and dictation lines also go into the index's `long` (listen.ts
`longEntries`), so 記録 and おさらい know them.
- **Options** `[lv, timer, ear, piece]` (`longOpts`): the host's piece (a pick, else def.ts `pieceFor`).
- **Deck** (`longDeal`): the piece's questions in order, the first card carrying its lines; the piece plays before the
  first question, +8 s to read. **Row:** `[q id, ok, choice, rp]`; the dictation a row of its own after it
  (`QuizGame.keepMore`, nothing on the wire).
- **Audio:** a generated line at −18 LUFS, 32 kbps; a real line cut from its recording (`npm run kikimimi:real`, sha256
  checked). A file is one pack (≤ 8 MB).
- **Checks:** listen.ts `checkLong`, tells.test's `long` group, long.test (licences, credit lines, 2–6 minutes, every
  line heard by whisper within align.ts's bounds).

### よみきき サンド

Listen blind → read → listen blind, over any item: 読んでから もう一度 (frame/SandButton) under a solo reveal (never in
co-op: it would hold up the partner) and in an open review row. frame/Sandwich, a full-height sheet: the clip blind, the
transcript with its marks, `cja` and `why`, the clip blind again, then 聞き取れた ／ まだ. まだ is device-local
(`DEVICE.kikiMada`, ≤ 200) and srs.ts folds it as "hard"; nothing on the wire.

## Performance

- The island's first load carries ~4 KB of ききみみ (the invite listener and host, the `listen` contract, the pill); the
  island's render loop idles under the sheet.
- During play only the karaoke renders per frame (while a clip replays); bars, timer, bob and waves are CSS; the view
  refreshes at each phase's end (at least every 3 s, not while hidden). Outside the questions the clips stop on
  entering, and a replay there plays through the refreshes.

## Tests

Pure vitest for every fold, deck and GameDef (session.test with fake time: lost messages, the beacon, the host gone, a
stale `open`); byte budgets per op at the worst case (live-protocol.test). e2e per game solo and co-op on the default
wire and the dual stack (`?wire=quiz`), logic tier (kikimimi.md "Tests").
