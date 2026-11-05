# ききみみ クイズ: English listening game (spec v2, 2026-11-05)

The user asked for a game for several players. It's started from せってい, syncs so everyone starts and plays together, and is for Japanese speakers learning English. It trains **listening** with spoken English sentences, using the Animal Crossing characters and world.

Draft 1 was reviewed by an English teacher (Japanese learners), a game/UX designer and an engineer, and this is the result. Builders follow this spec and update it as they go. When the feature lands, its prose moves into docs/design.md (`### ききみみ クイズ`), the wire format into docs/backend.md and the choices into docs/decisions.md.

## The game

- **Host and speakers.** しずえ (Isabelle) hosts. Each question is spoken by a villager. Their icon bobs with an NH speech bubble that stays empty (「♪…」) and a thin progress bar the clip's length. The text is never shown before the reveal.
- **Length.** A game is **8 questions** at level 1, 2 or 3.
- **Countdown.** A 3-2-1 runs once, at the start. Each question then has a ~1.5 s lead-in: the villager pops in with a chime.
- **Answering.**
  - The choices show dimmed while the clip plays. They unlock when its first play ends.
  - One tap, final. Then the time limit runs: 15 s from the end of the first play.
  - 🔁 replay is allowed as often as you like. 🐢 slow is levels 1 and 2 only (slowed TTS undoes level 3's reductions).
- **Showing who answered.** Each player's avatar chip gets a ✓ when they answer, without showing what they chose.
- **Reveal.** It starts once everyone joined has answered, or at the time limit. It holds about 8 s:
  - the right choice shows with ○, and a wrong pick with ×, so colour isn't the only signal;
  - the English sentence shows at ≥ 17 px with the key word (`focus`) highlighted, and the clip plays once automatically;
  - below it are the Japanese and the voice's accent (US / UK / AU);
  - the speaker reacts (✨ or 💦), and so does each player's chip.
- **Scoring.** A correct answer is **100**, plus **30 if it was answered with no replay or slow play** (「1かいで！」). Wrong or timed out is 0. There's no speed bonus: it rewarded guessing.
- **Results.**
  - しずえ reads them out like the morning broadcast: a ranking with reactions.
  - Then a **review list** of every sentence: its English, its Japanese, ▶︎ and 🐢 (L1/L2). A 「まちがえた だけ」 filter shows only the missed ones.
  - The review list is the main learning moment.
- **Solo** works the same way, with one player.
- **Who can play.** A, B and the guest (G) can all host and join. There's no ベル or economy tie in v1.
- **「おなじへや」 (same room).** A lobby toggle, set by the host, makes only the host's phone speak. Without it, three phones a little out of sync sound like a chorus. Without it, suggest earphones.
- **No Animalese** before or over the English.

## Question types (v1)

- **`pic`**: tap the picture you heard, from 4 NH art choices. The words must be ones the players already know, or katakana traps (banana, museum, orange, tarantula, Halloween, vitamin, energy). The sentence carries the test, not an obscure noun. The distractors are heard in the sentence too, or sound close. Example: "I didn't catch a tuna, but I got a squid!" → squid.
- **`word`**: the sentence shows with a blank, and you pick the word you heard from **3 near-sound choices**. Every choice must fit the sentence, so meaning can't give it away.
  - L/R: light/right, fly/fry, rock/lock, glass/grass, collect/correct, play/pray.
  - Vowels: hat/hut/hot, cap/cup, bag/bug, fan/fun, full/fool, coat/caught (avoid in US voices).
  - Others: berry/very, sink/think, sea/she, food/hood, walk/work (careful in UK voices), can/can't, walk/walked, cat/cats, fifteen/fifty, thirteen/thirty.
  - Check each pair in the voice's accent.
- **`num`**: prices in ベル, times and dates, as text choices with close distractors: 2:15 / 2:50, quarter past / to, 1,500 / 15,000 ベル, the 13th / 30th. These are built from **templates** (speaker × phrase × number), which also makes the bank big cheaply.
- **`reply`**: a villager asks something, and you pick the best reply from 3 written replies (like TOEIC Part 2). Example: "What're you up to?" → "Just fishing." This is level 2 and 3 only.
- **Later (v2):** `mean` with hard distractors, level 3 chunk tiles, co-op mode 「ふたりで」 (a combined grade against しずえ), bests, and missed items drawn more often.

**Mix per 8 questions.** L1: 3 pic, 3 word, 2 num. L2: 2 pic, 2 word, 2 num, 2 reply. L3: 1 pic, 2 word, 2 num, 3 reply.

## Content: `app/src/lib/kikimimi/`

- **`bank.ts`**: each item is `{id, lv, type, en, ja, speaker, choices, answer, focus?}`.
  - `speaker` is a villager id from roster.ts. Jock villagers say gym lines ("Ten more push-ups!"), since this is a fitness app.
  - Accents: L1 is US only, L2 adds UK, L3 adds AU.
  - Aim for **≥ 40 items per level in v1**, templates included. Grow towards 80 or more.
- **`deck.ts`**: `deck(seed, lv): Item[]` is pure and deterministic. It follows the per-level mix, never puts the same type more than twice in a row, and shuffles the choices by the seed. Every phone builds the same deck from `{seed, lv}`, so no text goes on the wire.
- **`score.ts`**: pure scoring.

## Audio

- **Generation.**
  - `app/scripts/kikimimi-audio.ts` (`npm run audio:kikimimi`) uses macOS `say` with a voice table per accent and gender.
  - It prefers Premium/Enhanced voices (Ava, Zoe, Evan, Serena, Lee and so on) when installed, and falls back to **Samantha (US), Daniel (UK) and Karen (AU)**.
  - The robotic Eloquence voices (Eddy, Reed, Rocko, Flo, Shelley, Sandy, Fred, Ralph) are **never used**.
- **Files.**
  - `ffmpeg` encodes mono AAC `.m4a` at about 48 kbps, into `static/audio/kikimimi/<id>.m4a`, plus `<id>-slow.m4a` (`say -r` about 70%) for L1 and L2.
  - The script writes `app/src/lib/kikimimi/clips.json` (`{id: {dur, hash}}`), which is imported at build time. It is **not** under static, because audio is cache-first and never revalidated. URLs carry `?v=<hash>`.
  - It regenerates only the items whose text or voice changed.
- **Listening check.** A person listens to every clip before it counts as done. The lead and the user do this; the script prints a list to listen through.
- **Engine additions** (sound/engine.ts and sound.svelte.ts):
  - a `voice` bus. Its level follows the master volume only, not the 効果音/ミュージック toggles;
  - `loadClip(path)`, which returns an `AudioBuffer` or null;
  - `playClip(buf, {at?})`, which returns `{stop(), endsAt}`. It ducks the music (duckPlan), is tracked as live, and keeps the context awake;
  - `holdAwake(on)`;
  - `voiceSession(on)`, called **inside a tap** (さんか / はじめる / あそぶ). It creates and unlocks the context even when sound is set silent, holds it awake, and sets `navigator.audioSession.type = 'playback'` so it plays with the silent switch on. Leaving the game restores it;
  - `playVoice(buf, {relayAt?})`, which converts relay time with `ctx.currentTime + (relayAt − serverNow())/1000`.
  - Decoded buffers are kept in an LRU of 4.
  - Built: `voiceSession(on): boolean`, `voice: {on, state}` (the card shows while `on` and `state !== 'running'`; its tap calls `voiceSession(true)`), `loadVoice('kikimimi/<id>.m4a?v=<hash>')`, `playVoice(buf, {relayAt?, now?})` → `{stop(), endsAt}` (audio clock) or null. A `relayAt` already past plays the clip whole from now. At 音量 0 the voice is silent too.
- **Fetching.** The lobby fetches the deck's clips as bytes (8 × ~25 KB) and decodes them just in time.
- **Caching.** The service worker's audio cache gets a `kiki` class, KEEP about 24, so quiz clips don't push the game's effects out. A played clip replays offline. Clips are not precached.
- **The lobby** has a 🔊 「きこえる？」 test.
- **After a lock or app switch,** the context is suspended. A 「タップして つづける」 card (しずえ) resumes it.

## Sync: one new presence-only intent

`{kind:'quiz', g, op, …}` needs a `case 'quiz'` in `intentOf` (contract/live-protocol.ts) and `'quiz'` in `guestMaySend`. The relay's routing is unchanged: the intent is unstored and unacked, and goes to all others. That contract file is bundled into the Worker, so the relay deploys first (relay.yml on push to main). Client messages are ≤ 210 bytes, since the relay adds about 35 bytes and 256 is the cap.

| op | sender | fields | meaning |
|---|---|---|---|
| `open` | host | `g, seed, lv, same` | a lobby is open; the others see an invite banner (TTL: dropped if the host leaves or after 10 min) |
| `join` / `leave` | anyone | `g` | joining or leaving the lobby or game |
| `go` | host | `g, at` | the game starts at relay time `at` (now + 4 s) |
| `a` | player | `g, i, k, rp, s` | the answer to question i: choice k, `rp` whether it replayed, `s` the sender's running total |
| `skip` | host | `g, i, at` | question i starts at `at` (the early つぎへ, or everyone done) |
| `end` | host | `g` | the game is cancelled |

Field validation:
- `g`: `/^[a-z0-9]{4,8}$/`
- `lv`: 1-3
- `i`: 0-7
- `k`: 0-3
- `s`: 0-1040
- `seed`: a 32-bit unsigned int

**The schedule is computed, not driven.**
- Every phone has the deck and each clip's `dur`. So from `go.at` it computes every question's start on its own: the lead (1.5 s) + `dur` + the answer window (15 s) + the reveal (8 s).
- A `skip` re-bases the schedule from question i, and the host sends it when its own reveal ends early: everyone answered, or つぎへ.
- Lost messages are harmless. A lost `skip` falls back to the full-length schedule, and a lost `a` is corrected by the next `s`. The game finishes even if the host leaves.

**Late messages.** A `go` or `skip` that arrives late plays at once if it's ≤ 5 s late; otherwise that question is skipped. Each phone's answer timing is local.

**Re-sends.** The host re-sends `open`, and once the game has started `go` plus the last `skip`, when someone's presence comes back. So a phone back from a lock rejoins the schedule.

**The client state machine.** `kikimimi/session.ts` is pure. It folds intents and the clock into `{phase: idle|lobby|countdown|lead|play|answer|reveal|results, players, answers, scores, i}`. It's unit-tested with fake time and covers: lost `a`/`skip`, the host gone mid-game, a stale `open`, a late `go`, and a phone rejoining. The Svelte UI only renders it.

**The demo relay.** The banner and the sheet reuse the island's existing Live (`relay ?? demoRelay`, IslandScene). They never create a second one: a second local live sends its own hi/bye.

## UI

- **Starting a game.** せってい → the row 「えいご ききとり」 [あそぶ] opens `components/kikimimi/KikimimiSheet.svelte`, a lazy chunk (`lazy(() => import(...))`, as Hud's sheets do).
- **The lobby** has the level, 「おなじへや」, who's here and who joined, 🔊 test, and [はじめる].
- **The invite banner** is a tiny always-loaded listener on the shared Live. It shows 「ウェイが ききとりクイズに さそっています」 [さんか], through the existing toast/banner host.
- **Mid-game,** a backdrop tap or Esc doesn't close the sheet. ✕ asks 「やめる？」.
- **Look.** The paper theme with `ui/Sheet.svelte`, villager art via `villagerArt()`, critters, fruit and items via the art manifest.
  - Taps are ≥ 44 px with `data-sfx`, plus the right/wrong cues.
  - Reduced motion is honoured.
  - `pic` choices have Japanese labels for VoiceOver, so the English isn't given away.
- **Strings** are an `addCatalog` chunk (ja + en).

## Performance

- Nothing heavy loads before the sheet opens. The banner listener is a few hundred bytes.
- The art is the existing webp files, loaded lazily. The island's render loop is idle under the sheet, as with other sheets.
- Only the clip bytes for one deck are kept, plus an LRU of 4 decoded buffers. All of it is dropped when the sheet closes.

## Tests

- **vitest:**
  - the deck's determinism and mix rules;
  - the bank's validity: every speaker and art ref exists; the answer is in range; a `word` item's choices are distinct, its answer word is in `en`, and its focus is in `en`; every item has a clip in clips.json, and L1/L2 items a slow clip;
  - the session's state machine, as listed above;
  - the protocol's parse cases, including size, guest allowed, and a relayed message ≤ 256 B;
  - the engine's clip API, with a fake context.
- **relay vitest:** `quiz` goes to the others and is never stored.
- **e2e (logic tier, chromium):**
  - a two-player game over `?demo` and `?demo&as=B`, from the invite through the results;
  - solo;
  - a hook, `?kikimimi=fast`, shortens the answer and reveal windows for tests.

## Phases (each lands on main, green)

1. These three run in parallel:
   - **Content and audio:** bank, deck, score, script, clips, clips.json, tests.
   - **Protocol and session:** the intent, relay test, `session.ts` (against the deck's interface), tests.
   - **Engine voice:** the engine and sound additions, the `kiki` cache class, tests.
2. **UI:** the sheet, the settings row, the banner, the wiring, e2e.
3. **Reviews and fixes:** English content (including a listen-through), UX on the iOS Simulator, perf and quality. Then docs.
