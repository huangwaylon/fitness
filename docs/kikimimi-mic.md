# ききみみ: speaking with the mic

Opt-in speaking modes: まねっこ シャドーイング, くりかえし チャレンジ, こたえて！, はつおん ききわけ and ふたりで ロールプレイ.
Speech to text runs on the phone first; no free LLM conversation. The game is [kikimimi.md](kikimimi.md), the engine
[kikimimi-engine.md](kikimimi-engine.md); open items, kikimimi.md "Open items".

**Rules for every mic mode** (privacy: "The privacy rule"):
- **Short, never homework:** ≤ 2½ min a game; no streaks, no keyboard; replays free; a tap fallback wherever speech is
  the input. Earphones recommended on every mic screen.
- American English only (`voice === 'us'` items). No かいがら, no new reward: the payoff is the villager's reaction,
  the contour, the sentence ladder.
- Japanese help on every screen (`ctx` before; `ja`, `why`, `note` after), sheet text in kanji, character speech in
  spaced kana.
- **Words, never "nativeness":** speech to text checks whether you were understood. The target sentence is never a
  prompt to the recogniser (priming makes it hear what we expect); it's only compared afterwards.
- Mic buttons ≥ 72 px, tap to start, auto-stop on silence or a tap; never start on their own.
- Lazy: each game's view ≤ 15 KB gz, the mic core ≤ 10 KB gz, the recogniser its own worker chunk ≤ 450 KB gz, none in
  the first load (scripts/load-budget.ts), never precached.

## The probe

On the phone: capture (getUserMedia, an AudioWorklet on the voice's context, `play-and-record`), pitch and timing,
and whisper in the page (transformers.js + onnxruntime-web, WebGPU else single-threaded WASM); Safari's recogniser and
the relay's Workers AI whisper are the alternatives. The probe measures which works on each phone (Chromium's fake
device proves only the logic).

設定's マイク診断（テスト） opens `mic/MicProbe.svelte` (lazy; re-run after an iOS update): one screen a step, about 6
minutes. The steps (lib/mic/probe/steps.ts, each header says what it measures): この端末でできること, マイクの許可,
再生と録音 (bleed and round trip per route: none, wired, AirPods), このiPhoneで文字起こし（Whisper） (download, load,
latency, WER on 3 pinned sentences, then spoken), Safariの音声認識, サーバーで文字起こし (disclosed), 結果
(「結果を送信」). WER is computed on the phone; heard text stays on screen. The events `mic.env`, `mic.perm`, `mic.duplex`, `mic.stt` are numbers and closed sets
(contract/log.ts): `npm run logs -- --event mic. --since 1d --json`.

**The decision rule**, set from both phones' runs:
1. whisper in the page if a 5 s utterance transcribes in ≤ 2 s and the spoken WER is ≤ 0.20; tiny.en first, base.en
   only if tiny's WER > 0.20 and base's latency ≤ 3 s;
2. else Safari's recogniser, if it works standalone at WER ≤ 0.20 and its disclosure is accepted;
3. else the relay, if its round trip is ≤ 2.5 s;
4. else the modes needing speech to text stay hidden (まねっこ still works).

If the AirPods mic drops playback to the hands-free profile: record on the iPhone's mic while the AirPods play (if
`deviceId` allows), else recommend wired earphones and offer まねっこ's あとから言う.

## The modes

Content reuse: single-speaker US items with a clean take, `reply` items, two-speaker dialogues, the units' key phrases
and minimal-pair `word` items; the only new audio is はつおん's pair words. Each game is a `GameDef` with a lazy view
("In the registry"); every row is minutes only.

### まねっこ シャドーイング

- **The round:** a line heard once blind, then said over it (重ねて言う 🎧) or after it (あとから言う, for when the clip
  bleeds). The take ends on the VAD's silence; the **two contours** overlay (the villager's melody and yours, words
  from words.json); the villager reacts in spaced kana with ≤ 2 tips, praise first (`kiki.mane.fb.*`); 自分の声を聞く
  plays the take from memory once. Never a number, never "wrong"; no co-op.
- **Trains** rhythm, pitch range (Japanese learners compress it), linking and weak forms, all on the phone ("Pitch and
  timing"; no speech to text).
- **Lines:** 4 at my placed level, US single-speaker clean takes (no `cond`, no `channel`), 4–12 words, no figures,
  shortest first; a reduced line shows its `tts` under it.
- Files: games/mane/, components/kikimimi/mane/, mic/Contour.svelte, lib/mic/{pitch,prosody}.ts.

### くりかえし チャレンジ

Elicited imitation: sentence repetition tracks proficiency.
- **The run:** a ladder of 8 → 22 syllables at the おまかせ level; each rung the unused eligible item (US, one voice,
  5–16 words, clean; light conditions from もり) nearest its syllables. The clip plays once, a 1 s beat (rebuild, don't
  echo), you say it; the sentence shows the words said lit, the missed grey (match.ts `align`, contractions both ways),
  then `ja` and `note` or `why`. ≥ 80 % of the content words climbs; two misses in a row end it (`kiki.kuri.reached`,
  only to you). A replay is free but that sentence can't climb.
- A take with nothing heard says why (neither climbs nor misses). The take's cap: clip × 2 + 2 s (≤ 15 s). 自動 without
  the model, or an unpaired relay, shows at the round with やめる.

### こたえて！

Not a mode: in any reply round (the quiz's, a unit's lessons; not たいかい or みみ チェック), 🎤 声で答える under the
choices. A clear match (content-word overlap with a margin, match.ts `choose`) answers as that tap; else
`kiki.mic.reply.unsure` with the choices, never ✗ (a valid reply off the list mustn't be wrong). The answer is a choice
index, so the session, wire, co-op and rows are untouched. frame/ChoiceGrid mounts mic/MicAnswer lazily at the first
such round and keeps it to the game's end; a tap mid-take drops the take.

### はつおん ききわけ

Production minimal pairs (r/l, hat/hut/hot, b/v, s/th, s/sh, teen/ty, final consonants).
- **The round:** two pictures with kanji labels; hear both first; the card says which to say; the villager **shows what
  they heard** (the wrong word is a joke, never ✗); two tries; the card's `why`.
- **Check:** whisper scores the two candidates by forced decoding (each word's mean token log-probability given the
  audio): a two-way judgement, not a transcript. Safari's and the relay give only a transcript, matched against both
  words ("unsure" when neither appears, then a pick).
- **Co-op 「あてっこ」:** role i % 2 sees the word and says it; the other hears it live and taps the picture.
  `kiki.pair.score` is the team's.
- **Content:** app/content/mic/pairs.yaml (36 pairs, fields in its header) → `parts/mic-pairs.json`; 72 clips, each the
  best of ten seeds whisper heard as written, in the pack `mic-pairs`.

### ふたりで ロールプレイ

- **The round:** a unit's scene, two of its dialogues chained (games/role/scenes.ts: 7 scenes, 8–10 turns, names and
  goals in kanji; the scene is the options' third int, the host's pick). Each phone a role card; each turn shows its
  speaker the line in Japanese with the key phrases in English as chips (the whole English faded on easy); the
  speaker's phone checks the phrases (match.ts `phrases`) and sends the bitmask; the other shows ✓ chips, never a
  transcript. お手本 plays the villagers' version at the end. Score: the team's phrases said.
- **A turn:** no clip (`play` 0, `quietReveal`), untimed, reveal `auto`. Answer: bits 0–5 the phrases, bit 6 spoken
  (マイクなしで次へ always); the other phone acks 255. cv: the unit's lesson cv, `BUILD_V.role`, the scene's dialogues.
- **Consent:** joining is consenting; the invitee's phone asks first, and with the mic off can't join.
- Files: games/role/, components/kikimimi/role/, mic/TalkButton; group `together` (the みんなで picker only).

### Where they show

| Where | Adds | Shows when |
|---|---|---|
| **声に出す**, the last shelf | まねっこ, くりかえし, はつおん | the mic is on (this phone); each when its backend is ready (まねっこ: capture only) |
| in place | こたえて！ in reply rounds | the mic is on and a recogniser is ready |
| みんなで picker | ロールプレイ, あてっこ | the mic is on (the invitee consents at join) |
| 設定 › マイク (MicOptIn) | マイクを使う (off), the mic check, 音声認識 自動 / このiPhone / Safari / サーバー (each with its disclosure), the model's download and delete, the probe | always |

No hub card; きまぐれ never picks a mic mode (no surprise speaking). The first time 声に出す shows, one line says where the
voice goes. The download is asked once, with its size.

## Architecture

### Files

`app/src/lib/mic/` (capture and VAD, `session.ts` one take, `stt.ts` the Recogniser, `pick.ts` the backend choice,
pure `match.ts`, `pitch.ts`, `prosody.ts`, `models.ts` the pins, `backends/`, `probe/`), `components/kikimimi/mic/`,
`kikimimi/games/modes.ts` and games mane, kuri, pair, role; `app/scripts/stt-models.ts`, `relay/src/sttRoute.ts`.

### The Recogniser

`lib/mic/stt.ts`: a `Recogniser` (`whisper`, `webkit`, `relay` or `stub`) is readied once; each `listen(hint)` in a
tap is a `Take` whose `heard` never rejects: a `Heard` (text, word times, per-candidate scores) or `{ miss }`.
- The modes see only `Heard` and match.ts, so swapping backends changes no game. `Heard.text` lives in the round only.
- `recogniser(be?)`: the stub under `e2e.stt`; else pick.ts's choice (whisper only once its model is on the phone: a
  round never downloads; Safari and the relay only when picked by hand). One take at a time; `release()` on close.
- Whisper runs in a Worker, WebGPU else WASM (one GPU failure keeps it on WASM); a timeout terminates it. Its input is
  the VAD-trimmed take, so silence never reaches the model (no hallucinated "Thank you."). `candidates` runs the encoder
  once and scores each word. The relay backend sends ≤ 10 s of 16 kHz WAV with a 20 s timeout.

### Pitch and timing

prosody.ts, for まねっこ (parameters in pitch.ts's and prosody.ts's headers): take and reference through the same code;
YIN's f0 in semitones against each speaker's own median (a male learner and a female villager compare fairly), the
level and syllable nuclei (the reference's word starts from words.json), aligned by DTW. **Outputs:** rate ratio, lag
(input latency not yet taken off), range ratio, final direction, the loudest nuclei's alignment, extra pauses → codes →
i18n lines; only the codes reach the view.

### In the registry

| `gm` | modes | Rounds | Answer (ints; on the wire only for `role`) | Timing |
|---|---|---|---|---|
| `mane` | solo | 4 lines | none (0) | the clip, then untimed |
| `kuri` | solo | ≤ 8, `next()` adaptive | `[hit, of, heard]` content words, `pts` 0 | the clip, then untimed |
| `pair` | solo, coop (`roles: 2`) | 8 cards | the word; the picture tapped (あてっこ) | two tries a card |
| `role` | coop only, `roles: 2` | 8–10 turns | phrase bitmask | untimed per turn |

The device hears; the session sees ints, so RoundSession, the wire and the relay are unchanged. games/modes.ts holds
the metas: shelf `koe`, `gate()` (the mic on; くりかえし also a recogniser that can run here), `requires: 'mic'`. Every mic
page gets its recogniser through mic/sttRound.ts (stt.ts lazy, `ready()`, `release()` on destroy).

### The relay endpoint

`POST /stt` (relay/src/sttRoute.ts; docs/ops/observability.md): the record's key (`keyOwner`), CORS for our origin;
`audio/wav` ≤ 340 KB (`STT_MAX`), read no further (413); `env.AI.run(STT_MODEL)` with the audio and language only, never
a prompt; reply `{ text, words? }`, `no-store`. The body is never stored or logged; the `stt` log line has sizes, ms,
model and ok. 300 calls per role a UTC day (`STT_DAY_MAX`, then 429); `STT_OFF = "1"` switches it off (503).

### Hosting and the service worker

- **CSP:** `connect-src 'self'` covers `/stt/*`, `'wasm-unsafe-eval'` ort's wasm. No new origin: transformers.js's
  remote models off, its paths at `/stt/`, the worker refuses any other fetch. `Permissions-Policy: microphone=(self)`.
- **Pinned** (lib/mic/models.ts: revisions, bytes, sha256): whisper-tiny.en q8 and onnxruntime-web, ~70 MB; a file over
  Pages' 25 MiB split into parts (`/stt/manifest.json`). ensureStt fetches what's missing after the opt-in, checks the
  sha256, keeps each file whole in `island-stt-v1`.
- **Hosting:** Pages static files, no R2 (decided), restored at deploy from an Actions cache keyed on the pins (never in
  git); `_headers` makes `stt/<dir>/` immutable and compressed (~30 MB on the wire).
- **Service worker:** caches.ts `isStt`, no precache, cache-first, filled by the download; 設定's delete empties it. A
  phone that never opts in downloads nothing.

### Audio session

- sound.svelte.ts `micSession(on)` layers the type: `play-and-record` over a game's `playback`, restored once both end.
  Capture uses the voice's context (`audioCtx()`). Music stays ducked while recording. MicOptIn asks the permission
  first (refused: off, 「もう一度試す」: "A refused mic"); `DEVICE.mic` `{ on, be }`.
- session.ts owns a take, ended by stop / cancel, the VAD (1 s quiet), the 15 s cap, 8 s without speech, a new take,
  `visibilitychange` hidden or `pagehide`; each end releases the track (the orange dot goes off at once). A take that
  opens after its button is gone is cancelled.

### A refused mic

- **WebKit** refuses a refused page's later asks outside a tap, unasked, until a reload (the evidence: lib/mic/retry.ts's
  header).
- So every ask is getUserMedia first thing in the tap (no await before it: MicOptIn, MicButton, the probe), and nothing
  keeps a refusal. Refused, 設定's switch, its check and the probe's step offer 「もう一度試す」: lib/mic/retry.ts notes
  the step in sessionStorage (`DEVICE.micRetry`, 2 min) and reloads; KikimimiHost opens the sheet back on 設定 (the
  probe on its permission step) for a fresh tap. The copy differs for the Home Screen app (retry, then close and
  reopen it) and a Safari tab (Safari's mic setting). Logged: `mic.perm` `at`, `retry`, `pwa`; `app.reload` `mic`.

### Tests

- **vitest:** pitch, prosody, vad on synthetic signals; match.ts, pick.ts, models.ts, stt.ts; each GameDef; relay
  stt.test (auth, sizes, the cap, nothing kept); log.ts refusing text.
- **e2e:** project `chromium-mic` (`kikimimi-mic*.spec.ts`): Chromium's fake media device on a committed clip,
  `--mute-audio`, no network, the stub recogniser via `localStorage['e2e.stt']`; `mic-retry.spec.ts` (chromium,
  webkit): a shimmed refusal, 「もう一度試す」's reload back to its step. Not tested: loading whisper, WebGPU, the
  analysis's numbers; feel is judged on the phones.

## The privacy rule

- **Off by default**, on and off per phone in ききみみ's 設定.
- **Solo by default.** The partner is involved only in ロールプレイ and あてっこ, when both opted in: joining is consenting.
- **Recordings are never stored or synced.** A take lives in memory for its round, dropped at the next round, on
  leaving, or when the app hides; never in localStorage, IndexedDB, the Cache API, the record, R2 or the log; never
  sent to the partner, who hears only your live voice.
- **Speech to text on the phone first** (the ~70 MB model downloaded once after you agree, deletable). The opt-in names
  the backend: Safari's may send the audio to Apple; the relay's sends it to our relay and Workers AI for the request
  only ("The relay endpoint").
- **No transcript and no speaking score leaves the phone:** mic rows carry minutes only; ロールプレイ shares only the
  team's ✓ per phrase. No accent grading, no speaking ranking; mic modes are not in たいかい or きまぐれ.
- Heard text never goes into a log event or an `Error` (contract/log.ts).
