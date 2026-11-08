# ききみみ: speaking with the mic

Opt-in speaking modes on ききみみ: まねっこ シャドーイング, くりかえし チャレンジ, こたえて！, はつおん ききわけ and ふたりで ロールプレイ. Speech to text runs on the phone first; no free LLM conversation. The game itself is [kikimimi.md](kikimimi.md); the engine, [kikimimi-engine.md](kikimimi-engine.md). Open items (the probe on both phones, R2, the leftovers) are in kikimimi.md "Open items".

**Rules for every mic mode:**
- **Off by default**, turned on per phone in ききみみ's せってい. Solo by default. Earphones recommended on every mic screen.
- **Short, never homework:** ≤ 2½ min a game; no streaks, no keyboard; replays free; a tap fallback wherever speech is the input.
- American English only (`voice === 'us'` items).
- No かいがら and no new reward: the payoff is in the round (the villager's reaction, the contour, the sentence ladder).
- Japanese help on every screen: `ctx` before; `ja`, `why` and `note` after; feedback in Japanese. Sheet text in kanji Japanese; character speech in spaced kana (しずえ: 「わあ、 そっくり！」).
- **No pronunciation score, no accent grading.** Speech to text checks words (were you understood?), never "nativeness". The target sentence is never given to the recogniser as a prompt (priming makes it hear what we expect); it's used only to compare afterwards.
- iPhone Safari (15 and 16, home-screen PWA). Mic buttons ≥ 72 px, tap to start, auto-stop on silence or a tap; they never start on their own.
- Lazy chunks: each game's view ≤ 15 KB gz; the mic core ≤ 10 KB gz; the recogniser its own worker chunk, never in index.html's transitive set (load-budget.ts), never precached.

## What runs on the phone

On an iPhone 15/16 in Safari 26/27: getUserMedia in the home-screen app; playing and recording at once (`navigator.audioSession` `play-and-record`; risks: the output dropping to the earpiece, AirPods falling to the hands-free profile); capture to PCM with an AudioWorklet on the voice's context (one clock for the clip and the mic); pitch and timing analysis (milliseconds); whisper in the page (transformers.js + onnxruntime-web; not cross-origin isolated, so WASM is single-threaded; WebGPU when present). webkitSpeechRecognition may not work standalone and may send audio to Apple. The relay can run Workers AI's `@cf/openai/whisper-large-v3-turbo` within the Free plan's daily neurons (docs/ops/observability.md). Echo cancellation goes through iOS voice processing, which may lower the clip's quality. Chromium's fake device proves only the logic; the probe measures the rest.

## The probe

せってい's 「マイク診断（テスト）」 (a small row under 「マイクを使う」) opens `mic/MicProbe.svelte` (lazy), kept for re-runs after an iOS update: one screen a step, one button, 「スキップ」 and a plain result line, about 6 minutes.

| # | Step | Measures | The user does |
|---|---|---|---|
| 1 | 環境 | standalone, `crossOriginIsolated`, `navigator.gpu` (page + Worker), `shader-f16`, `webkitSpeechRecognition`, `audioSession`, MediaRecorder types, AudioWorklet | nothing |
| 2 | マイクの許可 | permission state, ms to grant, track settings, input class; on the next launch, whether it asked again | taps 許可; later, 聞かれた / 聞かれなかった |
| 3 | 再生と録音 | per route (none / wired / AirPods): bleed with echo cancellation on and off, round-trip ms, the built-in mic with AirPods, the session restored | puts earphones on or off; rates the clip |
| 4 | Whisper（約 70 MB） | download, load (WebGPU, WASM), latency and WER on 3 pinned clips' PCM (decoded, never played), then on the 3 sentences spoken | taps ダウンロード (Wi-Fi); speaks 3 sentences |
| 5 | Safari の音声認識 | exists, error, prompt, ms, WER, coexistence with capture | speaks the 3 sentences |
| 6 | サーバーで文字起こし | round trip, WER | taps 送る (disclosed) |
| 7 | 結果 | a table on screen; 「結果を送信」 posts the events | taps |

The sentences are 3 pinned US clips (lib/mic/probe/steps.ts `SENTENCES`). The WER is computed on the phone (match.ts); heard text shows on screen only. **The log events** (contract/log.ts, `src: 'c'`; numbers, booleans, closed sets):

| Event | Fields |
|---|---|
| `mic.env` | `pwa`, `coi`, `gpu`, `gpuW`, `f16` b, `arch` t, `wks` b, `ses` b, `mr` ['mp4','webm','none'], `wl` b |
| `mic.perm` | `st` ['granted','denied','prompt','unsupported'], `ms` n, `again`, `asked`, `ec` b, `sr` n, `inp` ['builtin','bluetooth','wired','other'] |
| `mic.duplex` | `ear` ['none','wired','bluetooth'], `aec` b, `bleed` n (dB), `rtl` n (ms), `loud` ['none','quiet','ok'], `pick` b, `restored` b, `err` t |
| `mic.stt` | `be` ['whisper-gpu','whisper-wasm','webkit','relay'], `model` ['tiny.en','base.en','tiny.en-f16','turbo','none'], `step` ['dl','load','clip','spoken'], `ms`, `mb`, `audS`, `wer` n, `ok` b, `err` [closed set] |

The relay adds `stt` (`src: 'r'`: `ms`, `inB`, `model`, `ok`, `err`). Read with `npm run logs -- --event mic. --since 1d --json` and `--event stt`.

**The decision rule**, to be set from both phones' runs (until then pick.ts's 自動 is whisper once its model is on the phone, and Safari's or the relay only when picked by hand):
1. whisper in the page if a 5 s utterance is transcribed in ≤ 2 s (WebGPU, else WASM) and the spoken WER is ≤ 0.20; tiny.en first, base.en only if tiny's WER is > 0.20 and base's latency ≤ 3 s;
2. else Safari's recogniser, if it works standalone, its WER is ≤ 0.20 and the user accepts its disclosure;
3. else the relay, if its round trip is ≤ 2.5 s;
4. else the modes that need speech to text stay hidden (まねっこ still works).

If the AirPods mic drops playback to the hands-free profile, record with the iPhone's mic while the AirPods play (if `deviceId` allows), else recommend wired earphones and offer まねっこ (repeat after) instead of shadowing.

## The modes

Content reuse: single-speaker US items with a clean take, `reply` items, two-speaker dialogues, the units' key phrases and minimal-pair `word` items; the only new audio is はつおん's pair words. Each game is a `GameDef` with a lazy view ("In the registry"); every row is minutes only.

### まねっこ シャドーイング

- **The round:** a line heard once blind, then said over it (重ねて言う 🎧: shadowing, with earphones) or right after it (あとから言う: お手本, then the mic; for when the clip bleeds). The take ends on the VAD's silence; then the **two contours** overlay (the villager's melody and yours, the words under them from words.json), the villager reacts in spaced kana with ≤ 2 tips in kanji, praise first (「最後の 上がり調子が そっくりです」, 「もう少し 高い・低いを 大きく」, 「単語の 間を つなげて みよう」); 「自分の 声を 聞く」 plays the take from memory, then it's gone; もう一回, 次の文へ / この文はとばす. Never a number, never 「ちがう」. No co-op (private).
- **Trains:** rhythm (stress against mora timing), pitch range (Japanese learners compress it), linking and weak forms.
- **Lines:** 4 at my placed level (the mode page's おまかせ), single-speaker US items with a clean take (no `cond`, no `channel`), 4–12 words, no figures, shortest first; a line said with reductions shows its `tts` under it.
- **No speech to text:** pitch and timing are compared on the phone ("Pitch and timing").
- Files: games/mane/, components/kikimimi/mane/ (ManePlay, ManeResults), mic/Contour.svelte, lib/mic/{pitch,prosody}.ts. ModeDetail shows no 問 chip and no こたえる じかん for a mic mode; きろく shows the mic games' minutes as 「声に出す ○分」.

### くりかえし チャレンジ

Elicited imitation: sentence repetition tracks proficiency.
- **The run:** a sentence ladder (8 → 22 syllables, at the mode page's おまかせ level); each sentence the unused eligible item (US, one voice, 5–16 words, clean; light conditions from もり) nearest its rung's syllables. Each clip plays once, a 1 s beat (so you rebuild it rather than echo it), you say it; the sentence shows with the words said lit and the missed grey (match.ts `align`, contractions both ways), then `ja` and `note` or `why`. ≥ 80 % of the content words climbs a rung; two misses in a row end the run (「ここまで 14語！」, only to you). 「もう一回 聞く」 is free, but that sentence can't climb. No co-op.
- Answer `[hit, of, heard]`, `pts` 0. A take with nothing heard says why, then 「もう一度話す」 or 「この文はとばす」 (neither climbs nor misses). The take's cap is the clip × 2 + 2 s (≤ 15 s). 自動 without the model on the phone, or an unpaired relay, is known only at the round, which says so with やめる.
- **The speaking span** (planned): the run's top rung kept on this phone only, checked against a month of placements before it touches みみ チェック or the listening stats.
- Files: games/kuri/ (def.ts, lane.ts, mode.ts), components/kikimimi/kuri/.

### こたえて！

Not a mode: inside any reply round (the quiz's, a unit's lessons; not たいかい or みみ チェック), a 🎤 「声で 答える」 under the choices. A clear match (content-word overlap with a margin over the next, match.ts `choose`) answers as that tap; none: 「その 言い方も 通じるかも。選ぶなら？」 with the choices, never ✗ (a valid reply off the list mustn't be marked wrong). The answer is a choice index, so the session, the wire, co-op and the rows are untouched; the partner sees the choice like a tap and hears you only live. frame/ChoiceGrid mounts mic/MicAnswer lazily at the first such round with the mic on and keeps it to the game's end (the recogniser readied once); a tap on a choice mid-take drops the take; the heard text shows on this phone until the next round.

### はつおん ききわけ

Production minimal pairs: the contrasts Japanese speakers merge (r/l, the hat/hut/hot vowels, b/v, s/th, s/sh, teen/ty, final consonants).
- **The round:** a card of two pictures with kanji labels; hear both first (perception before production); the card says which to say; the villager **shows what they heard** (the wrong word is a joke, 「え、 しらみ？！」, never ✗); two tries; the card's `why`.
- **Check:** whisper scores the two candidates by forced decoding (each word's mean token log-probability given the audio): a two-way intelligibility judgement, not a free transcript. Safari's and the relay give only a transcript, so the mode matches it ("unsure" when neither word appears) and asks 「聞いて選んでね」. Measured on our 72 clips (tiny.en q8, WASM, local Chromium): candidates 70/72 right, ~1.3 s a take; the transcript fallback 62 right, 2 wrong, 8 unsure.
- **Co-op 「あてっこ」:** role i % 2 sees the word and says it; the other hears it live and taps the picture (a human ear is the best judge). The team's 「通じた 6 / 8」, no per-person figure.
- **Content:** app/content/mic/pairs.yaml, 36 pairs (r/l 7, b/v 4, th 4, s/sh 1, vowels 8, teen/ty 7, final consonants 5), each with a US villager, `ctx`, `why`, two words with a kanji label, a reading, an emoji, an everyday line and a mouth tip; compiled to `parts/mic-pairs.json`. 72 clips, each word alone (`<pair>-1`, `-2`), the best of ten seeds by UTMOS among the takes whisper heard as written, in their own pack `mic-pairs`.
- Files: games/pair/ (pairs.ts, def.ts, lane.ts), components/kikimimi/pair/; `coop: true` (あてっこ in the みんなで picker).

### ふたりで ロールプレイ

- **The round:** a unit's scene, two of its dialogues chained (7 scenes, one per wave-1 unit, 8–10 turns, roles' names and goals in kanji; the scene is the options' third int `[lv, timer, scene]`, the host's pick). Each phone gets a role card; each turn shows its speaker the line in Japanese with the key phrases in English as chips (the whole English faded on easy); the speaker's phone checks the key phrases (match.ts `phrases`) and sends the bitmask; the other phone shows ✓ chips, never a transcript. 「お手本」 at the end plays the villagers' version with the karaoke. Score: the team's 「ふたりで 9 / 11 フレーズ」, never per person.
- **A turn:** a round with no clip (`play` 0, `quietReveal`), untimed, the reveal `auto`. The speaker's answer is the mask (bits 0–5 the phrases, bit 6 spoken; 「マイクなしで次へ」 always); the other phone acks (255). cv: the unit's lesson cv, `BUILD_V.role` and the scene's dialogues.
- **Consent:** joining is the consent (no wire field). Before joining, the invitee's phone says 「マイクを使います」 with 参加する / やめる; a phone with the mic off can't join.
- Files: games/role/ (scenes.ts, def.ts, lane.ts, mode.ts), components/kikimimi/role/ (RoleLobby, RolePlay, RoleMic, RoleResults, MicJoin); group `together` (the みんなで picker only).

### Where they show

| Where | Adds | Shows when |
|---|---|---|
| **声に 出す**（マイクを 使う）, the last shelf | まねっこ シャドーイング, くりかえし チャレンジ, はつおん ききわけ | the mic is on (this phone); each tile when its backend is ready (まねっこ: capture only) |
| in place | こたえて！ in reply rounds | the mic is on and a recogniser is ready |
| みんなで picker | ロールプレイ, はつおん's あてっこ | the mic is on (the invitee consents at join) |
| せってい › マイク (MicOptIn) | 「マイクを使う」 (off), 「マイクのチェック」, 音声認識 自動 / このiPhone / Safari / サーバー (each with its disclosure), the model's download and 「音声認識データを削除（{mb}MB）」, the probe's row | always |

No hub card; きまぐれ never picks a mic mode (it would surprise people into speaking); the first time 声に 出す shows, one line says the voice stays on this iPhone (or the backend's own line). The download is asked for once, with its size (Wi-Fi recommended).

## Architecture

### Files

```
app/src/lib/mic/
  capture.ts, capture.worklet.js   getUserMedia → the voice's context → the worklet; 16 kHz mono; level; stop() releases the track
  vad.ts                           20 ms frames, energy over a following floor + zero-crossing, 300 ms hang
  session.ts                       one take at a time and its ends ("Audio session")
  stt.ts                           the Recogniser interface; recogniser() picks and lazily loads a backend
  pick.ts                          the backend choice from DEVICE.mic and what can run here (pure)
  match.ts                         normalise (US contractions and reductions both ways, digits ⇄ words, fillers out), align,
                                   WER, content-word recall, choose (with a margin), phrases (a bitmask), candidate (pure)
  pitch.ts, prosody.ts             YIN f0, the envelope, syllable nuclei, DTW, the comparison → feedback codes (pure)
  models.ts                        the pinned manifest: files, bytes, sha256, parts; ensureStt
  backends/{whisper.ts, whisper.worker.ts, webkit.ts, relay.ts, stub.ts}
  probe/{steps.ts, run.ts, gpu.worker.ts}
app/src/lib/components/kikimimi/mic/   MicProbe, MicOptIn, MicButton (72 px, ring meter), MicAnswer, Contour, sttRound.ts
app/src/lib/kikimimi/games/modes.ts   the mic modes' metas and gates
app/src/lib/kikimimi/games/{mane,kuri,pair,role}/ and components/kikimimi/{mane,kuri,pair,role}/
app/content/mic/pairs.yaml
app/scripts/stt-models.ts   fetch the pinned files (HF, npm), verify, split ≤ 20 MiB, write the manifest; --r2 <bucket> uploads
app/functions/stt/[[path]].ts   /stt/* from R2 once STT_BUCKET is bound, else the static files
relay/src/sttRoute.ts      POST /stt
```

### The Recogniser

```ts
// lib/mic/stt.ts
export type Backend = 'whisper' | 'webkit' | 'relay' | 'stub';
export interface Heard { text: string; words?: readonly { w: string; t0: number; t1: number }[];
  /** per candidate, a log-probability (whisper only) */ cand?: readonly number[]; ms: number; be: Backend }
export interface Hint { maxS?: number; candidates?: readonly string[]; frame?: (v: VadState) => void }   // never the expected sentence
export type Outcome = Heard | { miss: Miss; be: Backend };
export interface Take { readonly level: number; readonly heard: Promise<Outcome>; stop(): Promise<Outcome>; cancel(): void }
export interface Recogniser {
  readonly be: Backend;
  ready(progress?: (got: number, of: number) => void): Promise<boolean>;   // whisper: the download if missing, the load
  listen(h?: Hint): Take;    // inside a tap; whisper/relay/stub capture through session.ts, webkit runs its own
  dispose(): void;
}
```

- The modes see only `Heard` and match.ts: swapping the backend changes no game. `Heard.text` lives in the round's memory only.
- `recogniser(be?)`: the stub under `e2e.stt`; else, mic on, pick.ts's choice (whisper only once its model is on the phone: a round never downloads; Safari and the relay only when picked by hand). One recogniser and one take at a time; `release()` when the sheet closes.
- `heard` never rejects: a `Heard`, or `{ miss }`: none, aborted, denied, capped (429: 「今日は ここまで」), off, unpaired, network, timeout, oom, service-not-allowed or other.
- Whisper runs in a dedicated Worker, on WebGPU, else WASM (one GPU failure keeps it on WASM); a timed-out request terminates the Worker. Its input is the VAD-trimmed take, so silence never reaches the model (no hallucinated "Thank you."). `candidates` runs the encoder once and scores each word by forced decoding.
- The relay backend sends ≤ 10 s of 16 kHz WAV (≤ 340 KB) with a 20 s timeout; cancel aborts it.

### Pitch and timing

prosody.ts, for まねっこ:
- **Input:** the take's 16 kHz PCM and the reference clip's decoded buffer, resampled once, through the same code.
- **f0:** YIN, 32 ms window, 10 ms hop, 70–400 Hz, threshold 0.15; a 5-point median and octave-jump repair; semitones against each speaker's own median (a male learner and a female villager compare fairly).
- **Envelope and nuclei:** RMS in dB at 10 ms; nuclei are voiced peaks ≥ 2 dB above their dips. The reference's word starts come from words.json.
- **Alignment:** DTW over [semitone z-score, energy z-score], band ±25 %.
- **Outputs:** rate ratio; lag (the take's start on the voice's clock minus the clip's speech start, less the output latency; the input latency isn't taken off yet); range ratio (p90−p10); final direction (the last voiced 300 ms); the 3 loudest nuclei's alignment; extra pauses. Outputs → codes → i18n lines; the codes, never the PCM, go to the view.

### In the registry

| `gm` | modes | Rounds | Answer (ints, on the device; on the wire only for `role`) | Timing |
|---|---|---|---|---|
| `mane` | solo | 4 lines | none (0) | the clip, then untimed |
| `kuri` | solo | ≤ 8, `next()` adaptive | `[hit, of, heard]` content words | the clip, then untimed; a take ≤ clip × 2 + 2 s |
| `pair` | solo, coop (あてっこ, `roles: 2`) | 8 cards | the word (solo); the picture tapped (あてっこ) | two tries a card |
| `role` | coop only, `roles: 2` | 8–10 turns | phrase bitmask | untimed per turn |

Grading is pure over the ints: the device does the hearing and the session sees numbers, so the RoundSession, the wire and the relay are unchanged. The metas live in games/modes.ts (the registry adds them): shelf `koe`, `gate()` (まねっこ, はつおん and ロールプレイ while the mic is on; くりかえし also needs a recogniser that can run here), `requires: 'mic'` (the みんなで picker's 「マイクがオフです」). Every mic page gets its recogniser through mic/sttRound.ts: stt.ts loaded lazily, `ready()`, `release()` on destroy.

### The relay endpoint

`POST /stt` (relay/src/sttRoute.ts; docs/ops/observability.md):
- **Auth:** the record's key (`keyOwner`); CORS for our origin only.
- **Body:** `audio/wav`, ≤ 340 KB (10 s at 16 kHz 16-bit), read no further (a streamed body is cut off at 413).
- **Call:** `env.AI.run('@cf/openai/whisper-large-v3-turbo', …)`: the audio and language only, never a prompt. **Reply:** `{ text, words? }`, `Cache-Control: no-store`.
- **Never kept:** the body is never written to a Durable Object, R2, KV or the log, nor `console.log`ged. Logs `stt` with sizes, ms, model and ok only.
- **Caps:** 300 requests per role per day (`STT_DAY_MAX`; over it 429). `STT_OFF = "1"` switches it off.

### Hosting and the service worker

- **CSP:** `connect-src 'self'` covers `/stt/*`; `script-src 'self' 'wasm-unsafe-eval'` covers ort's wasm. No new origin: transformers.js's remote models are off, its paths point at `/stt/`, and the worker refuses any fetch outside it. **Permissions-Policy:** `microphone=(self)`.
- **Pinned:** whisper-tiny.en q8 @ `2575352d`, onnxruntime-web `1.31.0-dev.20260914-8d85527a0` (package.json overrides; transformers.js 4.3.2 exact, its Node-only deps replaced by an empty package). Every file (each over Pages' 25 MiB) is split into ≤ 20 MiB parts (`<path>.<sha8>.pN`), listed with bytes and sha256 in `/stt/manifest.json`: ~70 MB in all (the model 41 MB + the runtime 27 MB). ensureStt fetches what's missing after the user opts in, assembles, checks the sha256 and keeps each file whole in `island-stt-v1`. Paths carry the revision; manifest.json is revalidated.
- **Hosting:** functions/stt/[[path]].ts serves `/stt/*` from R2 once the Pages project has the bucket bound as `STT_BUCKET`; without it the request falls through to the static files. Today pages.yml's deploy restores the files from an Actions cache keyed on the pins into the site's `stt/` (never in git or the artifact) and checks the live manifest. Once R2 is bound: `node scripts/stt-models.ts --r2 <bucket>` and drop the deploy's copy step.
- **The service worker:** caches.ts `isStt` (`/stt/` and `workers/stt.<hash>.js`, named by vite.config.ts's `stt-names` rule) and `STT_CACHE`; out of the precache; served cache-first and never stored by the SW (the page fills it on the download); せってい's 削除 deletes it. A user who never opts in downloads 0 bytes of it.
- **Budgets:** load-budget.ts keeps `lib/mic/` and MicProbe out of the first load and the worker ≤ 450 KB gz.

### Audio session

- sound.svelte.ts `micSession(on)` layers the type: the mic's `play-and-record` over a game's `playback`, the one before back once both are over. `audioCtx()` wakes the voice's context, which capture.ts uses. Music is held ducked while recording.
- session.ts owns a take: one at a time, ended by stop / cancel, the VAD (1 s quiet), the 15 s cap, 8 s without speech, a new take, `visibilitychange` hidden or `pagehide`; each end releases the track (the orange dot goes off at once). A take that opens after its button is gone is cancelled at once.
- MicOptIn: the switch asks the permission first (refused: off, with where to change it); `DEVICE.mic` `{ on, be }`.

### Tests

- **vitest (pure):** pitch, prosody and vad on synthetic signals (glides of known f0, pulse trains, a rise against a fall); match.ts; pick.ts; models.ts (parts, sha check, ensureStt's cache); stt.ts; each GameDef; caches.test `isStt`; relay stt.test (auth, sizes, the cap, a chunked body cut off, nothing kept); log.ts accepting `mic.*` and refusing text.
- **e2e:** the Playwright project `chromium-mic` (`kikimimi-mic*.spec.ts`: probe, optin, mane, kuri, reply, pair, role) with Chromium's fake media device on a committed clip, `--mute-audio` (no audio plays on the dev Mac), no network, and the stub recogniser via `localStorage['e2e.stt']` (a JSON list of what it hears, one entry a take; pick.ts `stubbed()`, `stubScript()`, `stubNext()`).
- **Not tested:** loading whisper, WebGPU, or the analysis's numbers; the real model was checked once by hand in local Chromium. Rendering and feel are judged on the iOS Simulator and the phones.

## The privacy rule

- Off by default. Turned on per phone in ききみみ's せってい and off again there.
- Solo by default. The partner is involved only in ロールプレイ and あてっこ, and only when both players opted in: joining is consenting.
- **Recordings are never stored or synced.** A take lives in memory for its round and is dropped at the next round, on leaving, or when the app hides. It's never written to localStorage, IndexedDB, the Cache API, the record, R2 or the log, and never sent to the partner. The partner hears only your live voice in the room.
- **Speech to text runs on the phone first** (whisper in the page; the model, ~70 MB, is downloaded once after you agree, and can be deleted).
  - If Safari's recogniser is used, the audio may go to Apple.
  - If the relay is used (`POST /stt`), the audio goes to our relay and Cloudflare's Workers AI for the request only, and nothing is kept; the relay logs only sizes and times, with a daily cap a person and an off switch.
  - The opt-in names the backend in use.
- **No transcript and no speaking score leaves the phone.** Mic games' rows carry minutes only. ロールプレイ shares only its ✓ per phrase, as the team's.
- **No ranking or leaderboard for speaking.** Mic modes are not in たいかい or きまぐれ.
- Heard text is never put into a log event or an `Error`; the probe's `mic.*` events are numbers and closed sets (contract/log.ts).
- The Permissions-Policy allows the microphone to our origin only.
