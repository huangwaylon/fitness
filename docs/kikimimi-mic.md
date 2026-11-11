# ききみみ: speaking with the mic

Opt-in speaking modes on ききみみ: まねっこ シャドーイング, くりかえし チャレンジ, こたえて！, はつおん ききわけ and ふたりで ロールプレイ. Speech to text runs on the
phone first; no free LLM conversation. The game itself is [kikimimi.md](kikimimi.md); the engine,
[kikimimi-engine.md](kikimimi-engine.md). Open items (the probe on both phones, the leftovers) are in kikimimi.md
"Open items".

**Rules for every mic mode** (privacy: "The privacy rule"):
- **Short, never homework:** ≤ 2½ min a game; no streaks, no keyboard; replays free; a tap fallback wherever speech is
  the input. Earphones recommended on every mic screen.
- American English only (`voice === 'us'` items). No かいがら and no new reward: the payoff is in the round (the
  villager's reaction, the contour, the sentence ladder).
- Japanese help on every screen: `ctx` before; `ja`, `why` and `note` after; feedback in Japanese, sheet text in kanji,
  character speech in spaced kana.
- **Words, never "nativeness":** speech to text checks whether you were understood. The target sentence is never given
  to the recogniser as a prompt (priming makes it hear what we expect); it's used only to compare afterwards.
- iPhone Safari (15 and 16, home-screen PWA). Mic buttons ≥ 72 px, tap to start, auto-stop on silence or a tap; they
  never start on their own.
- Lazy chunks: each game's view ≤ 15 KB gz; the mic core ≤ 10 KB gz; the recogniser its own worker chunk, never in
  index.html's transitive set (load-budget.ts), never precached.

## What runs on the phone

Capture (getUserMedia, an AudioWorklet on the voice's context, `play-and-record`), pitch and timing analysis, and
whisper in the page (transformers.js + onnxruntime-web, WebGPU else single-threaded WASM). Safari's recogniser and
the relay's Workers AI whisper are the alternatives; the probe measures which works on each phone (Chromium's fake
device proves only the logic).

## The probe

設定's マイク診断（テスト） (a small row under マイクを使う) opens `mic/MicProbe.svelte` (lazy), kept for re-runs after an iOS update:
one screen a step, one button, a skip and a plain result line, about 6 minutes.

The steps (lib/mic/probe/steps.ts, each measuring what its header says): 環境 (the browser's capabilities), マイクの許可,
再生と録音 (bleed and round trip per route: none, wired, AirPods), Whisper (download, load, latency and WER on 3 pinned
US sentences, then spoken), Safari の音声認識, サーバーで文字起こし (disclosed), 結果 (「結果を送信」 posts the events). The
WER is computed on the phone; heard text shows on screen only. **The log events** `mic.env`, `mic.perm`,
`mic.duplex` and `mic.stt` are numbers and closed sets (contract/log.ts); the relay adds `stt`. Read with
`npm run logs -- --event mic. --since 1d --json`.

**The decision rule**, to be set from both phones' runs (until then: kikimimi.md "Open items"):
1. whisper in the page if a 5 s utterance is transcribed in ≤ 2 s (WebGPU, else WASM) and the spoken WER is ≤ 0.20;
   tiny.en first, base.en only if tiny's WER is > 0.20 and base's latency ≤ 3 s;
2. else Safari's recogniser, if it works standalone, its WER is ≤ 0.20 and its disclosure is accepted;
3. else the relay, if its round trip is ≤ 2.5 s;
4. else the modes that need speech to text stay hidden (まねっこ still works).

If the AirPods mic drops playback to the hands-free profile, record with the iPhone's mic while the AirPods play (if
`deviceId` allows), else recommend wired earphones and offer まねっこ (repeat after) instead of shadowing.

## The modes

Content reuse: single-speaker US items with a clean take, `reply` items, two-speaker dialogues, the units' key phrases
and minimal-pair `word` items; the only new audio is はつおん's pair words. Each game is a `GameDef` with a lazy view
("In the registry"); every row is minutes only.

### まねっこ シャドーイング

- **The round:** a line heard once blind, then said over it (重ねて言う 🎧: shadowing, with earphones) or right after it
  (あとから言う: お手本, then the mic; for when the clip bleeds). The take ends on the VAD's silence; then the **two contours**
  overlay (the villager's melody and yours, the words under them from words.json), the villager reacts in spaced kana
  with ≤ 2 tips in kanji, praise first (`kiki.mane.fb.*`); 自分の声を聞く plays the take from memory, then it's gone; again,
  next or skip. Never a number, never "wrong". No co-op (private).
- **Trains:** rhythm (stress against mora timing), pitch range (Japanese learners compress it), linking and weak
  forms. **No speech to text:** pitch and timing are compared on the phone ("Pitch and timing").
- **Lines:** 4 at my placed level (the mode page's おまかせ), single-speaker US items with a clean take (no `cond`, no
  `channel`), 4–12 words, no figures, shortest first; a line said with reductions shows its `tts` under it.
- Files: games/mane/, components/kikimimi/mane/ (ManePlay, ManeResults), mic/Contour.svelte,
  lib/mic/{pitch,prosody}.ts.

### くりかえし チャレンジ

Elicited imitation: sentence repetition tracks proficiency.
- **The run:** a sentence ladder (8 → 22 syllables, at the mode page's おまかせ level); each sentence the unused eligible
  item (US, one voice, 5–16 words, clean; light conditions from もり) nearest its rung's syllables. Each clip plays
  once, a 1 s beat (so you rebuild it rather than echo it), you say it; the sentence shows with the words said lit and
  the missed grey (match.ts `align`, contractions both ways), then `ja` and `note` or `why`. ≥ 80 % of the content
  words climbs a rung; two misses in a row end the run (`kiki.kuri.reached`, only to you). Hearing it again is free,
  but that sentence can't climb. No co-op.
- Answer `[hit, of, heard]`, `pts` 0. A take with nothing heard says why, then speak again or skip it (neither climbs
  nor misses). The take's cap is the clip × 2 + 2 s (≤ 15 s). 自動 without the model on the phone, or an unpaired relay,
  is known only at the round, which says so with やめる.

### こたえて！

Not a mode: inside any reply round (the quiz's, a unit's lessons; not たいかい or みみ チェック), a 🎤 声で答える under the choices. A
clear match (content-word overlap with a margin over the next, match.ts `choose`) answers as that tap; none:
`kiki.mic.reply.unsure` with the choices, never ✗ (a valid reply off the list mustn't be marked wrong). The answer is
a choice index, so the session, the wire, co-op and the rows are untouched; the partner sees the choice like a tap and
hears you only live. frame/ChoiceGrid mounts mic/MicAnswer lazily at the first such round with the mic on and keeps it
to the game's end (the recogniser readied once); a tap on a choice mid-take drops the take; the heard text shows on
this phone until the next round.

### はつおん ききわけ

Production minimal pairs: the contrasts Japanese speakers merge (r/l, the hat/hut/hot vowels, b/v, s/th, s/sh,
teen/ty, final consonants).
- **The round:** a card of two pictures with kanji labels; hear both first (perception before production); the card
  says which to say; the villager **shows what they heard** (the wrong word is a joke, never ✗); two tries; the card's
  `why`.
- **Check:** whisper scores the two candidates by forced decoding (each word's mean token log-probability given the
  audio): a two-way intelligibility judgement, not a free transcript. Safari's and the relay give only a transcript,
  so the mode matches it ("unsure" when neither word appears) and asks you to pick. Candidates were 70/72 right in a
  local test.
- **Co-op 「あてっこ」:** role i % 2 sees the word and says it; the other hears it live and taps the picture (a human ear is
  the best judge). The team's `kiki.pair.score`, no per-person figure.
- **Content:** app/content/mic/pairs.yaml, 36 pairs (its header has the fields), compiled to `parts/mic-pairs.json`;
  72 clips, each word alone, the best of ten seeds among the takes whisper heard as written, in the pack `mic-pairs`.

### ふたりで ロールプレイ

- **The round:** a unit's scene, two of its dialogues chained (7 scenes, one per unit of the first seven, 8–10 turns,
  roles' names and goals in kanji; the scene is the options' third int `[lv, timer, scene]`, the host's pick). Each
  phone gets a role card; each turn shows its speaker the line in Japanese with the key phrases in English as chips
  (the whole English faded on easy); the speaker's phone checks the key phrases (match.ts `phrases`) and sends the
  bitmask; the other phone shows ✓ chips, never a transcript. お手本 at the end plays the villagers' version with the
  karaoke. Score: the team's phrases said, never per person.
- **A turn:** a round with no clip (`play` 0, `quietReveal`), untimed, the reveal `auto`. The speaker's answer is the
  mask (bits 0–5 the phrases, bit 6 spoken; マイクなしで次へ always); the other phone acks (255). cv: the unit's lesson cv,
  `BUILD_V.role` and the scene's dialogues.
- **Consent:** joining is the consent; the invitee's phone asks first (参加する / やめる), and with the mic off can't join.
- Files: games/role/ (scenes.ts, def.ts, lane.ts), components/kikimimi/role/ (RoleLobby, RolePlay, RoleResults,
  MicJoin; the mic: mic/TalkButton); group `together` (the みんなで picker only).

### Where they show

| Where | Adds | Shows when |
|---|---|---|
| **声に出す**（マイクを使う）, the last shelf | まねっこ シャドーイング, くりかえし チャレンジ, はつおん ききわけ | the mic is on (this phone); each tile when its backend is ready (まねっこ: capture only) |
| in place | こたえて！ in reply rounds | the mic is on and a recogniser is ready |
| みんなで picker | ロールプレイ, はつおん's あてっこ | the mic is on (the invitee consents at join) |
| 設定 › マイク (MicOptIn) | マイクを使う (off), the mic check, 音声認識 自動 / このiPhone / Safari / サーバー (each with its disclosure), the model's download and its delete, the probe's row | always |

No hub card; きまぐれ never picks a mic mode (it would surprise people into speaking); the first time 声に出す shows, one line
says the voice stays on this iPhone (or the backend's own line). The download is asked for once, with its size (Wi-Fi
recommended).

## Architecture

### Files

`app/src/lib/mic/` (capture and the VAD, `session.ts` one take at a time, `stt.ts` the Recogniser, `pick.ts` the
backend choice, `match.ts`, `pitch.ts` and `prosody.ts` pure, `models.ts` the pinned files, `backends/`, `probe/`),
`components/kikimimi/mic/`, `kikimimi/games/modes.ts` and the games' folders (mane, kuri, pair, role),
`app/content/mic/pairs.yaml`, `app/scripts/stt-models.ts`, `relay/src/sttRoute.ts`. Each file's header has its part.

### The Recogniser

`lib/mic/stt.ts` (the types there): a `Recogniser` (`whisper`, `webkit`, `relay` or `stub`) is readied once, then each
`listen(hint)` inside a tap is a `Take` whose `heard` never rejects: a `Heard` (text, word times, whisper's per-candidate
scores) or a `{ miss }`. A hint never carries the expected sentence.
- The modes see only `Heard` and match.ts: swapping the backend changes no game. `Heard.text` lives in the round's
  memory only.
- `recogniser(be?)`: the stub under `e2e.stt`; else, mic on, pick.ts's choice (whisper only once its model is on the
  phone: a round never downloads; Safari and the relay only when picked by hand). One recogniser and one take at a
  time; `release()` when the sheet closes.
- Whisper runs in a dedicated Worker, on WebGPU, else WASM (one GPU failure keeps it on WASM); a timed-out request
  terminates the Worker. Its input is the VAD-trimmed take, so silence never reaches the model (no hallucinated
  "Thank you."). `candidates` runs the encoder once and scores each word by forced decoding. The relay backend sends ≤
  10 s of 16 kHz WAV (≤ 340 KB) with a 20 s timeout; cancel aborts it.

### Pitch and timing

prosody.ts, for まねっこ (the parameters in pitch.ts's and prosody.ts's headers): the take's 16 kHz PCM and the reference
clip, through the same code; YIN's f0 in semitones against each speaker's own median (a male learner and a female
villager compare fairly), the level and the syllable nuclei (the reference's word starts from words.json), aligned by
DTW. **Outputs:** rate ratio; lag (the take's start on the voice's clock minus the clip's speech start, less the
output latency; the input latency isn't taken off yet); range ratio; final direction; the loudest nuclei's alignment;
extra pauses. Outputs → codes → i18n lines; the codes, never the PCM, go to the view.

### In the registry

| `gm` | modes | Rounds | Answer (ints, on the device; on the wire only for `role`) | Timing |
|---|---|---|---|---|
| `mane` | solo | 4 lines | none (0) | the clip, then untimed |
| `kuri` | solo | ≤ 8, `next()` adaptive | `[hit, of, heard]` content words | the clip, then untimed; a take ≤ clip × 2 + 2 s |
| `pair` | solo, coop (あてっこ, `roles: 2`) | 8 cards | the word (solo); the picture tapped (あてっこ) | two tries a card |
| `role` | coop only, `roles: 2` | 8–10 turns | phrase bitmask | untimed per turn |

Grading is pure over the ints: the device does the hearing and the session sees numbers, so the RoundSession, the wire
and the relay are unchanged. The metas live in games/modes.ts (the registry adds them): shelf `koe`, `gate()` (まねっこ,
はつおん and ロールプレイ while the mic is on; くりかえし also needs a recogniser that can run here), `requires: 'mic'` (the みんなで
picker's `kiki.role.join.offTitle`). Every mic page gets its recogniser through mic/sttRound.ts: stt.ts loaded lazily,
`ready()`, `release()` on destroy.

### The relay endpoint

`POST /stt` (relay/src/sttRoute.ts; docs/ops/observability.md):
- **Auth:** the record's key (`keyOwner`); CORS for our origin only.
- **Body:** `audio/wav`, ≤ 340 KB (10 s at 16 kHz 16-bit), read no further (a streamed body is cut off at 413).
- **Call:** `env.AI.run('@cf/openai/whisper-large-v3-turbo', …)`: the audio and language only, never a prompt.
  **Reply:** `{ text, words? }`, `Cache-Control: no-store`.
- **Never kept:** the body is never written to a Durable Object, R2, KV or the log, nor `console.log`ged. Logs `stt`
  with sizes, ms, model and ok only. **Caps:** 300 requests per role a UTC day (`STT_DAY_MAX`; over it 429).
  `STT_OFF = "1"` switches it off.

### Hosting and the service worker

- **CSP:** `connect-src 'self'` covers `/stt/*`; `script-src 'self' 'wasm-unsafe-eval'` covers ort's wasm. No new
  origin: transformers.js's remote models are off, its paths point at `/stt/`, and the worker refuses any fetch
  outside it. **Permissions-Policy:** `microphone=(self)`.
- **Pinned** (lib/mic/models.ts: revisions, bytes and sha256): whisper-tiny.en q8 and onnxruntime-web, ~70 MB in
  all; a file over Pages' 25 MiB is split into parts (`/stt/manifest.json`). ensureStt fetches what's missing after
  the opt-in, checks the sha256 and keeps each file whole in `island-stt-v1`.
- **Hosting:** Pages static files, no R2 (decided), restored at deploy from an Actions cache keyed on the pins (never
  in git); `_headers` makes `stt/<dir>/` immutable and compressed (70.5 → 30.4 MB on the wire, measured live).
- **The service worker:** caches.ts `isStt`, out of the precache, cache-first, filled by the page's download; 設定's
  delete removes it. A phone that never opts in downloads 0 bytes of it. **Budgets:** load-budget.ts keeps `lib/mic/`
  and MicProbe out of the first load and the worker ≤ 450 KB gz.

### Audio session

- sound.svelte.ts `micSession(on)` layers the type: the mic's `play-and-record` over a game's `playback`, the one
  before back once both are over. `audioCtx()` wakes the voice's context, which capture.ts uses. Music is held ducked
  while recording. MicOptIn: the switch asks the permission first (refused: off, with where to change it);
  `DEVICE.mic` `{ on, be }`.
- session.ts owns a take: one at a time, ended by stop / cancel, the VAD (1 s quiet), the 15 s cap, 8 s without
  speech, a new take, `visibilitychange` hidden or `pagehide`; each end releases the track (the orange dot goes off at
  once). A take that opens after its button is gone is cancelled at once.

### Tests

- **vitest (pure):** pitch, prosody and vad on synthetic signals; match.ts; pick.ts; models.ts; stt.ts; each GameDef;
  relay stt.test (auth, sizes, the cap, nothing kept); log.ts refusing text.
- **e2e:** the Playwright project `chromium-mic` (`kikimimi-mic*.spec.ts`) with Chromium's fake media device on a
  committed clip, `--mute-audio`, no network, and the stub recogniser via `localStorage['e2e.stt']` (pick.ts). **Not
  tested:** loading whisper, WebGPU, or the analysis's numbers. Rendering and feel are judged on the phones.

## The privacy rule

- **Off by default**, turned on per phone in ききみみ's 設定 and off again there.
- **Solo by default.** The partner is involved only in ロールプレイ and あてっこ, and only when both opted in: joining is
  consenting.
- **Recordings are never stored or synced.** A take lives in memory for its round and is dropped at the next round, on
  leaving, or when the app hides. It's never written to localStorage, IndexedDB, the Cache API, the record, R2 or the
  log, and never sent to the partner. The partner hears only your live voice in the room.
- **Speech to text runs on the phone first** (whisper in the page; the model, ~70 MB, is downloaded once after you
  agree, and can be deleted). The opt-in names the backend in use.
  - If Safari's recogniser is used, the audio may go to Apple.
  - If the relay is used (`POST /stt`), the audio goes to our relay and Cloudflare's Workers AI for the request only,
    and nothing is kept; the relay logs only sizes and times, with a daily cap a person and an off switch.
  - **No transcript and no speaking score leaves the phone.** Mic games' rows carry minutes only. ロールプレイ shares only
    its ✓ per phrase, as the team's.
- **No speaking score, no accent grading, no ranking or leaderboard for speaking.** Mic modes are not in たいかい or
  きまぐれ.
- Heard text is never put into a log event or an `Error`; the probe's `mic.*` events are numbers and closed sets
  (contract/log.ts).
- The Permissions-Policy allows the microphone to our origin only.
