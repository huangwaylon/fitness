# ききみみ: speaking with the mic (design, signed off 2026-11-07)

**The user, 2026-11-07:** approved adding mic modes in this order: まねっこ シャドーイング, くりかえし チャレンジ, こたえて！, はつおん ききわけ, ふたりで ロールプレイ. Speech to text runs on the phone first. A phone probe comes first. No free LLM conversation.

**The team:** a learning scientist (shadowing, elicited imitation, Japanese learners), an American EFL teacher, a game/UX designer, the learner panel (two B1+ adults in Tokyo: short attention, no homework, shy about speaking), the senior web/iOS engineer and a privacy reviewer.

**Inputs:**
- docs/curriculum-wave2.md (W2-C1 and W2-C2 in progress);
- kikimimi.md, kikimimi-framework.md and kikimimi-ux.md;
- the code as of 91c21a40:
  - the round engine and registry (round/types.ts, round/registry.ts);
  - clipPlayer, packs.ts (`voiceClip` returns a decoded `AudioBuffer`);
  - lib/sound (`applySession`, `voiceSession`, `playVoice`);
  - the service worker (caches.ts `precachable`, the MapLibre exclusion);
  - scripts/headers.ts (the Permissions-Policy has **`microphone=()`** today) and vite.config.ts's CSP;
  - contract/log.ts (closed-schema events, no free text);
  - relay/src/logRoute.ts;
  - e2e/fixtures.ts and playwright.config.ts;
  - the compiled levels (levels/parts/*.json);
- the Hugging Face file listings for onnx-community/whisper-tiny.en and whisper-base.en, fetched today.

**The verdict in seven lines:**
1. Everything the modes need can run on an iPhone 15/16 in Safari 26/27. These need the phone to confirm:
   - permission persistence in the home-screen app;
   - playing and recording at once (route, loudness, echo, AirPods);
   - whisper's speed and accuracy on the user's own voice;
   - whether webkitSpeechRecognition works in standalone mode.

   **M0, the probe, ships first, alone.** It reports to the relay log.
2. まねっこ needs **no speech to text**: pitch and timing are compared on the phone with Web Audio and plain math. So it ships first, while the probe picks the recogniser.
3. One `Recogniser` interface, with backends `whisper` (in-page, WebGPU then WASM), `webkit` and `relay` (Workers AI). `stub` is for the tests. The probe's numbers pick the backend per phone.
4. The model can't sit on Pages as-is. Every whisper decoder file is over the 25 MiB limit (tiny.en int8 29.3 MiB, fp16 56.8 MiB). Model files are served same-origin under `/stt/` from R2 (W2-R's bucket), in parts of ≤ 20 MiB. The recogniser's chunk, the ONNX runtime's wasm and the model are **never precached**. They are fetched only after the user opts in.
5. Privacy:
   - recordings exist only in memory for the round;
   - nothing audio or text is synced, logged or sent to the partner;
   - the relay path stores nothing;
   - rows carry minutes only;
   - no speaking leaderboard.

   The rule goes into docs/kikimimi.md and docs/decisions.md with M0.
6. The modes become W2-C2 games on one new shelf, **声に 出す**. It shows only when the mic is turned on. こたえて！ is a mic chip inside the existing reply rounds, not a new mode.
7. Increments M0–M7. M0, M1 and M3 need nothing from wave 2. M2, M4, M5 (its one Play.svelte line), M6 and M7 wait for W2-C2.

**Rules for every mic mode** (the user's constraints, plus this round's):
- **Off by default.** Turned on per phone in ききみみ's せってい. Solo by default. Earphones are recommended on every mic screen.
- **Short, fun, never homework:**
  - ≤ 2½ min a game;
  - no streaks, no keyboard;
  - replays free;
  - a tap fallback wherever speech is the input ("タップで 答える").
- American English only (the content's US-only lint; `voice === 'us'` items only).
- No かいがら and no new reward. The payoff is in the round: the villager's reaction, the contour, the sentence ladder.
- Japanese help on every screen:
  - `ctx` before;
  - `ja`, `why` and `note` after;
  - feedback in Japanese.
- **Sheet text in kanji Japanese** (「最後の 上がり調子が そっくりです」). **Character speech in spaced kana** (しずえ: 「わあ、 そっくり！」).
- **No pronunciation score, no accent grading.** Speech to text checks *words* (were you understood?), never "nativeness".
- iPhone Safari only (15 and 16, home-screen PWA). Mic buttons are ≥ 72 px, tap to start, auto-stop on silence or a tap to stop. They never start on their own.
- Lazy chunks:
  - each game's view ≤ 15 KB gz;
  - the mic core ≤ 10 KB gz;
  - the recogniser (transformers.js + onnxruntime-web) its own chunk, never in index.html's transitive set (load-budget.ts), never precached.

---

## 0. How the team converged

| Role | First pick | Objection raised | Where it landed |
|---|---|---|---|
| Learning scientist | Shadowing and elicited imitation (EI). Both have a research base with Japanese EFL learners: shadowing mainly trains bottom-up perception and phoneme-level parsing (Kadota 2007, 2019; Hamada 2016, 2019), and EI sentence-repetition scores track proficiency (Erlam 2006; Yan et al. 2016 meta-analysis) | "An ASR pronunciation score is noise. Priming whisper with the target sentence makes it hear what we expect" | No pronunciation score. The target is **never** given to the recogniser as a prompt; it's used only to compare afterwards. Minimal pairs are judged by intelligibility (Munro & Derwing), and **perception comes before production** (Bradlow et al. 1997: /r/–/l/ perception training carried over to production). Visual pitch contours help prosody (Hardison 2004), so まねっこ shows them |
| EFL teacher | こたえて！ (real replies) and ロールプレイ (the units' phrases) | "Marking a valid reply wrong because it isn't one of the four kills speaking. And `gonna` must count as `going to`" | When a reply matches no choice, it's never shown as ✗: 「その 言い方も 通じるかも」 and the choices to tap. Reductions and contractions fold both ways in the matcher. Shadowing starts on the clean ladder rungs (0.8×) |
| Game designer | A 「そっくり度 87%」 meter in まねっこ; a ranking for くりかえし | Panel: 「点数は いや」; the user: unscored, no speaking leaderboard | No number in まねっこ: the villager reacts in spaced kana and the two contours overlay. くりかえし's "longest sentence" is a sentence ladder you climb, shown only to you. はつおん gets the fun: the villager **shows what they heard** (rice 🍚 / lice 🪲) |
| Learner panel | 「一人で イヤホンなら やる」, 「ロールプレイは 二人とも その気なら 楽しそう」 | 「相手に 聞かれたくない」; 「40 MB は Wi-Fi で」; 「マイクが 勝手に つくのは こわい」 | Solo by default. Co-op only when both opt in (joining = consenting). The mic never starts by itself. The download is asked for once, with its size (Wi-Fi recommended). A visible listening ring on top of iOS's orange dot |
| Engineer | The probe first; まねっこ before any recogniser | "Wave 2's sheet, Play.svelte, catalog and registry are being rewritten. The model files are over Pages' 25 MiB. The SW precaches every hashed chunk by default. The Permissions-Policy blocks the mic today" | The mic core is a self-contained `lib/mic/`. Games come only after W2-C2. Model parts go on R2 under `/stt/`. A `stt-names` Vite rule (the maplibre-names pattern) keeps the recogniser out of the precache. `microphone=(self)` ships in M0 |
| Privacy reviewer | In-page whisper only | "webkitSpeechRecognition sends audio to Apple. The relay sends it to Cloudflare. Transcripts in error messages leak into `js.error`" | Allowed as fallbacks, **disclosed per backend** in the opt-in. Never more than one backend's disclosure applies. The relay holds audio for the request only and logs sizes and times. A lint: no `Error` built from heard text. Rows carry minutes only |

---

## 1. Feasibility per capability

Phones: iPhone 15 (A16, 6 GB) and iPhone 16 (A18, 8 GB), iOS 27 (the `os` log field already says `ios27.x`), home-screen PWA. "Known" below means from WebKit's shipped features and public reports, not measured on these phones. Everything marked *probe* is measured by M0 before a backend or a mode depends on it.

| Capability | On the phone? | Evidence / what we know | What the probe must confirm |
|---|---|---|---|
| **getUserMedia** in the home-screen app | Yes | Supported in standalone web apps since iOS 13.4. Permissions API `microphone` query since Safari 16. Our Permissions-Policy sets **`microphone=()`** (scripts/headers.ts), which blocks it today: M0 changes it to `microphone=(self)` | Time to grant. `permissions.query` state before and after. **Whether the prompt comes back on the next launch** (standalone apps have historically re-asked per launch). The applied track settings (sample rate, `echoCancellation`, channels). The input's class (built-in / Bluetooth / wired, mapped on the phone from the label; the label itself is never logged) |
| **Play and record at once** | Yes, with caveats | `navigator.audioSession` (Safari 16.4+) has `play-and-record`. The voice path is Web Audio (`playVoice`), already on `playback` (sound.svelte.ts `voiceSession`). Known risks: with the mic open, output can drop to the earpiece or be ducked by voice processing; AirPods switch to the low-quality hands-free profile when their mic is used | For each of {no earphones, wired, AirPods}, with `play-and-record`: is the clip heard (the user taps 聞こえない / 小さい / ふつう)? Bleed of the clip into the mic (dB) with echo cancellation on and off. Round-trip latency (a click, speaker only). Can the built-in mic be chosen while AirPods play (`deviceId`), and does the output then stay high quality? Does the music or session come back after `stop()`? |
| **Capture to PCM** (AudioWorklet on the engine's AudioContext) | Yes | AudioWorklet since Safari 14.1. The worklet module is a same-origin file (`script-src 'self'`, no blob:). One context with the voice, so mic frames and the clip's start share one clock (needed for shadowing's lag) | The context's sample rate with the mic open (48 kHz expected) and the input latency |
| **Pitch and timing analysis** | Yes, trivially | YIN over 5 s at 16 kHz is about a million multiply-adds: milliseconds on an A16. The reference is the clip's decoded `AudioBuffer` (packs.ts `voiceClip`). Unit-tested on synthetic signals | Nothing beyond capture working. The probe times one analysis for the record |
| **WebGPU** | Very likely | On by default since Safari 26 (iOS 26). A16/A18 are supported GPUs. The island stops drawing under a sheet (sheet-idle), so the GPU is free | `navigator.gpu` in the page **and in a dedicated Worker**. The adapter's info tokens. `shader-f16`. `maxBufferSize` and `maxStorageBufferBindingSize`. Survival across a background/foreground |
| **Whisper in-page** (transformers.js v4 + onnxruntime-web) | Yes if latency holds | Sizes (HF, today): **tiny.en** int8 = encoder 9.7 + decoder-merged 29.3 = **39 MiB** (WASM); fp16 = 15.8 + 56.8 = **72.6 MiB** (WebGPU). **base.en** int8 = 22.1 + 51.2 = **73 MiB**; fp16 139 MiB. Every decoder is over Pages' 25 MiB per file → parts (§3.6). `script-src` already has `wasm-unsafe-eval`. Not cross-origin isolated (COOP only, no COEP), so WASM runs **single-threaded**. Whisper tiny/base are trained mostly on native speech; expect a higher WER on Japanese-accented English than LibriSpeech's ~5% | Download time on the user's Wi-Fi and LTE. Model load (session create) cold and from the cache. **Per-clip latency** on WebGPU and on WASM, first from our clips' PCM directly (a baseline: no mic), then on 3 sentences the user speaks back. The **WER on the user's voice**. Whether iOS kills the page (memory) during fp16 base.en |
| **webkitSpeechRecognition** | Maybe | Exists in Safari. On iOS it needs Siri & Dictation on, and it may use Apple's servers. No word timings. `maxAlternatives` and grammars have little effect. Standalone mode has had reports of `service-not-allowed` | Exists in standalone? Its error code (closed set). A second permission prompt? Time to the final result. WER on the same 3 sentences. **Whether it can run while our getUserMedia capture is open** (if not, the modes that need both, like EI with a waveform, close the capture first) |
| **Relay Whisper** (Workers AI `@cf/openai/whisper-large-v3-turbo`, or `whisper-tiny-en`) | No, server-side | One `[ai]` binding in relay/wrangler.toml. Cost is negligible at our volume (cents a month), within the Free plan's daily neurons. Audio goes over a TLS POST to our relay, then to Cloudflare's inference in the same account: no new processor, Cloudflare already hosts everything | Round-trip ms on LTE and Wi-Fi. WER on the same 3 sentences (it should be the best: a baseline for the on-phone ones) |
| **Echo cancellation** | Yes (constraint) | `echoCancellation: true` is honoured on iOS through voice processing. It may also lower the clip's quality: measured, not assumed | Bleed with it on and off; the user's rating of the clip's sound with it on |
| **The ONNX runtime's wasm** | Yes | onnxruntime-web's WebGPU/JSEP wasm is ~20–25 MB per variant; one variant shipped. Served from `/stt/ort/<ver>/`, not through Vite (so never a hashed precache entry) | Load time. Single-threaded fallback works |

**What the probe can't settle** (judged later on the phone, by the user): whether shadowing with earphones *feels* right (the lag), and whether the feedback lines are encouraging. Our test browsers judge none of this (Chromium's fake device only proves the logic: §3.8).

### 1.1 M0, the probe, step by step (≈ 6 minutes, once, on each phone)

**Where:** ききみみ's せってい, a last row 「マイク診断（テスト）」 opens `MicProbe.svelte` (its own lazy chunk). After M1 the row sits under 「マイクを 使う」 as 「マイクの チェック」 and stays: re-running it after an iOS update is useful. Kanji sheet copy. Each step has one screen, a 「スキップ」 and a plain result line.

| # | Step | Measures | The user does |
|---|---|---|---|
| 1 | 環境 | standalone, `crossOriginIsolated`, `navigator.gpu` (page + Worker), adapter tokens, `shader-f16`, limits, `webkitSpeechRecognition`, `audioSession`, MediaRecorder types, AudioWorklet | nothing |
| 2 | マイクの 許可 | permission state, ms to grant, track settings, input class | taps 許可 |
| 2b | もう一度 (next launch) | state without asking; whether a prompt appeared | reopens the app, taps 聞かれた / 聞かれなかった |
| 3 | 再生と 録音 | per route (none / wired / AirPods): bleed dB with echo cancellation on and off, round-trip ms, whether the built-in mic can be picked with AirPods on, session restored after stop | puts earphones on or off when asked; rates the clip 聞こえない / 小さい / ふつう |
| 4 | Whisper（約 39 MB） | download ms and MiB; load ms (WebGPU, WASM); latency and WER on 3 of our clips' PCM; then latency and WER on 3 sentences the user speaks after hearing them | taps ダウンロード (Wi-Fi recommended); speaks 3 sentences. Optional: base.en (73 MB), tiny.en fp16 on WebGPU (73 MB) |
| 5 | Safari の 音声認識 | exists, error code, prompt, ms, WER, coexistence with capture | speaks the same 3 sentences |
| 6 | サーバーで 文字起こし | round-trip ms, WER | taps 送る (disclosed: 「音声は 文字起こしの 間だけ サーバーへ 送られ、保存されません」) |
| 7 | 結果 | a table on screen; 「ログに 送る」 posts the events | taps |

**The sentences:** 3 clean US clips from the ladders' 1.0× rung (the same 3 on both phones, pinned by id), shown in English with their `ja`. The WER is computed **on the phone** against `en`, using match.ts's normaliser. **No heard text is ever logged.**

**The log events** (contract/log.ts, `src: 'c'`). Each field is a number, a boolean, a closed set or a short token, as the registry requires:

| Event | Fields |
|---|---|
| `mic.env` | `pwa` b, `coi` b, `gpu` b, `gpuW` b (in a Worker), `f16` b, `arch` t, `wks` b, `ses` b, `mr` ['mp4','webm','none'], `wl` b |
| `mic.perm` | `st` ['granted','denied','prompt','unsupported'], `ms` n, `again` b, `asked` b, `ec` b, `sr` n, `inp` ['builtin','bluetooth','wired','other'] |
| `mic.duplex` | `ear` ['none','wired','bluetooth'], `aec` b, `bleed` n (dB), `rtl` n (ms), `loud` ['none','quiet','ok'], `pick` b (built-in chosen with BT), `restored` b, `err` t |
| `mic.stt` | `be` ['whisper-gpu','whisper-wasm','webkit','relay'], `model` ['tiny.en','base.en','tiny.en-f16','turbo','none'], `step` ['dl','load','clip','spoken'], `ms` n, `mb` n, `audS` n, `wer` n, `ok` b, `err` ['not-allowed','service-not-allowed','network','no-speech','aborted','audio-capture','oom','timeout','other'] |

**The relay** adds `stt` (`src: 'r'`): `ms`, `inB`, `model`, `ok`, `err`. Read with `npm run logs -- --event mic. --since 1d --json` and `--event stt`. The relay deploys first: the registry is bundled into the Worker, and unknown events are dropped.

**The decision rule** (applied by `pick.ts` on each phone from its own stored probe result, and by us reading the log):
1. **whisper in-page** if a 5 s utterance is transcribed in ≤ 2 s (WebGPU, else WASM) and the user's spoken WER is ≤ 0.20. Tiny.en first; base.en if tiny's WER is > 0.20 and base's latency is ≤ 3 s.
2. else **webkit**, if it works in standalone, its WER is ≤ 0.20, and the user accepts its disclosure.
3. else **relay**, if its round trip is ≤ 2.5 s.
4. else the modes that need speech to text stay hidden. まねっこ still works.

---

## 2. The modes

Content reuse, counted over the compiled levels (levels/parts, today):
- 1,199 items; 1,171 US;
- 995 single-speaker; 801 of those clean (no `cond`);
- 456 clean at 4–14 words; 655 US single-speaker at 5–16 words;
- 221 `reply` items;
- 176 two-speaker dialogues (3–6 lines);
- 30 ladders × 4 clean rungs;
- 7 units today (+14 in wave 2), 131 key phrases;
- minimal-pair `word` items tagged l-r 10, vowel 12, th 4, b-v 3, sh-s 2, can-cant 2;
- `teen-ty` 18.

Every mode draws from these. The only new audio is はつおん's isolated pair words (~80 short clips, §2.4).

### 2.1 まねっこ シャドーイング (private, unscored)

- **The loop (≈ 2 min, 4 lines):**
  1. The line plays once, blind (`ctx` shown).
  2. 「いっしょに 言って みよう」: the line plays again and you speak over it (**shadowing**, with earphones), or right after it (**まねっこ**, without earphones, when the probe or the route says the clip bleeds).
  3. A second try.
  4. The **two contours** overlay: the villager's melody line and yours, syllable dots on both, the words under them (the karaoke's word times, words.json).
  5. The villager reacts in spaced kana, and one tip shows in kanji.
  6. 「自分の 声を 聞く」 (earphones icon) plays your take from memory, then it's gone.
- **What it trains:**
  - rhythm (stress-timing against Japanese mora-timing);
  - pitch range (Japanese learners tend to compress it);
  - linking and weak forms at speed;
  - the perception gains shadowing is known for.
- **Content:**
  - the 30 ladders' rungs (clean, graded speed: start at 0.8×, step up to 1.0× when the lag is steady);
  - the 456 clean 4–14-word US items;
  - a unit's おと lines when played from the unit.

  Dialogues are skipped (one voice at a time).
- **Feedback (no number, no stars).** The rules pick ≤ 2 lines from a table of ~12, praise first:
  - 「最後の 上がり調子が そっくりです」 (final direction matched);
  - 「強く 言う ところが ぴったり」 (stressed nuclei aligned);
  - 「もう少し 高い・低いを 大きく」 (range ratio < 0.6);
  - 「少し 早口に なって います。お手本の 速さで」 (rate ratio > 1.25);
  - 「ついていけて います（遅れ 0.4秒）」 (lag, in shadowing);
  - 「単語の 間を つなげて みよう」 (pauses > model + 2).

  The villager says 「わあ、 そっくり！」 or 「いい かんじ！ もう いっかい？」. Never 「ちがう」.
- **Co-op:** none. It stays private (the panel and the user).
- **Where:** the 声に 出す shelf, first tile. Also 「まねして みる」 on a unit's おと lesson's results, only when the mic is on (after W2-9).
- **Row:** `{gm: 'mane', ms, n: 1, r: []}`: minutes only (like the stories' no-answer rows).

### 2.2 くりかえし チャレンジ (elicited imitation)

- **The loop (≈ 2 min, up to 8 sentences):**
  1. A **sentence ladder**: each sentence a bit longer (8 → 22 syllables).
  2. The clip plays **once**.
  3. A 1 s beat (a soft tick: the delay makes you rebuild it rather than echo it).
  4. You say it.
  5. The sentence shows with the words you said **lit** and the missed ones grey. Contractions and reductions count both ways.
  6. `ja`, then `note` or `why` if it has one.
  7. A sentence with ≥ 80% of its content words climbs one rung. Two misses in a row end the run: 「ここまで 14語！」, shown only to you.
  8. 「もう一回 聞く」 is free, but that sentence then can't climb (the wave-2 rule: a replay counts as hard).
- **What it trains:** parsing into chunks, holding a sentence in working memory, the grammar you can rebuild. The research's proficiency proxy.
- **Content:** the 655 US single-speaker 5–16-word items, ordered by syllables. Light conditions are allowed from もり up. Each run is drawn from the player's stage (the stage picker as the other modes).
- **Check:** content-word recall against `en` (match.ts). **No prompt is given to the recogniser.**
- **みみ チェック:** the run's top rung is kept **on this phone only** as a speaking span. After a month of both signals, the learning scientist checks whether it predicts the placement. Until then it doesn't touch the check or the listening stats.
- **Co-op:** none in v1.
- **Where:** 声に 出す, second tile.
- **Row:** minutes only (`gm: 'kuri'`).

### 2.3 こたえて！ (say the reply)

- **The loop:** inside any **reply** round (the quiz's 221 reply items, a unit's lessons, みみ チェック excluded):
  1. When the choices unlock, a 🎤 chip shows beside them: 「声で 答える」.
  2. Tap, say the reply, and the matcher maps it to the closest choice.
  3. A clear match (content-word overlap ≥ 0.6 and a margin of ≥ 0.25 over the next) answers **as that tap**.
  4. An unclear one highlights the best guess: 「これ？」 tap to confirm.
  5. None: 「その 言い方も 通じるかも。選ぶなら？」 with the choices.
- **What it trains:** producing a reply in the time a real one takes; the reply's formulae.
- **Grading:** the existing reply kind's. The answer **is a choice index**, so the session, the wire, co-op and the rows are untouched. The partner sees your choice like a tap. They hear you only live, never a recording.
- **Where:** the chip only. No tile and no new mode. Off unless the mic is on. The chip remembers a 「声で」 / 「タップで」 preference per phone.

### 2.4 はつおん ききわけ (production minimal pairs)

- **The loop (≈ 2 min, 8 cards):**
  1. A card shows two pictures with kanji labels: 🍚 米 / 🪲 シラミ, 歩く / 働く, 13 / 30.
  2. **Hear both first** (perception before production), each from a US voice.
  3. The card says which to say ("say **rice**").
  4. You say it, and the villager **shows what they heard**: the picture pops up, and the wrong one is a joke, not a ✗ (「え、 シラミ？！」).
  5. Two tries a card.
  6. The reveal gives the item's existing `why` (「r は 舌を どこにも つけず…」).
- **What it trains:** the contrasts Japanese speakers merge: r/l, æ/ʌ/ɑ (hat/hut/hot), b/v, s/th, s/sh, can/can't (stress and vowel), teen/ty (stress).
- **Content:**
  - the pair words come from the existing tagged `word` items' choices (w1-right: right/light; w1-walk: walk/work…): 33 pairs;
  - 14 teen/ty numbers;
  - the user's rice/lice;
  - ~80 isolated word clips (2 US voices, ~0.6 MB), one small audio batch on the normal pipeline (the whisper gate; ECAPA), after wave 2's batches.
- **Check:** whisper in-page scores the **two candidates** by forced decoding: the mean token log-probability of "rice" against "lice" given the audio. That's a two-way intelligibility judgement, not a free transcript. It needs only a decoder pass of ~3 tokens each. The relay and webkit give only a transcript, so the mode falls back to transcript matching ("unsure" when neither word appears) and shows 「判定が むずかしい ときは 聞いて 選んでね」.
- **Co-op 「あてっこ」 (both opt in):**
  - one phone shows A the word to say; B hears it **live** and taps the picture;
  - no recogniser at all: a human ear is the best intelligibility judge;
  - the team count is 「通じた 6 / 8」, shared, no per-person figure.
- **Where:** 声に 出す, third tile. あてっこ also in the みんなで picker.

### 2.5 ふたりで ロールプレイ (both opt in)

- **The loop (≈ 3 min, one scene, 6–10 turns):**
  1. A unit's scene: its 2–3 dialogues chained, from the 176, e.g. fr-replan's café call.
  2. Each phone gets a **role card**: A the friend, B the clerk.
  3. Each turn shows its speaker their line **in Japanese** (`ja`) with the unit's key phrase in English as a hint chip ("count me in"). Tier easy shows the whole English line, faded.
  4. The speaker taps 🎤 and says it. Their phone checks the line's **key phrases** (match.ts phrase detection, contractions folded) and sends `a` = the phrase bitmask. The other phone shows ✓ chips, never the transcript.
  5. 「お手本」 at the end plays the villagers' version of the scene (the existing clips) with the karaoke.
- **Consent:**
  - the host invites;
  - each invitee's phone, before joining, shows 「マイクを 使います。あなたの 声は 相手の スマホには 送られません」 with 参加 / やめる;
  - joining is the consent (no wire field);
  - a phone with the mic off can't join (the invite says so);
  - "both opt in" holds without a new message.
- **What it trains:** saying the unit's phrases in a real exchange, turn-taking, listening to your partner's live English.
- **Score:** the team's phrases, 「ふたりで 9 / 11 フレーズ」, never per person. Not in たいかい.
- **Where:** the みんなで picker, and a unit page's じっせん row 「ふたりで ロールプレイ」 when both are on the island and the mic is on. Not on the shelf (it needs two).
- **Row:** minutes only (`gm: 'role'`).

### 2.6 Placement (kikimimi-ux.md §6.2)

| Shelf | Adds | Shows when |
|---|---|---|
| **声に 出す**（マイクを 使う）, new, last | まねっこ シャドーイング, くりかえし チャレンジ, はつおん ききわけ | the mic is on (on this phone); each tile when its backend is ready (まねっこ: capture only) |
| (in place) | こたえて！ chip in reply rounds | the mic is on and a recogniser is ready |
| みんなで picker | ロールプレイ, はつおん's あてっこ | the mic is on (the invitee consents at join) |
| せってい | 「マイクを 使う」 (off), 「マイクの チェック」, 「音声認識」 (自動 / この iPhone で / Safari / サーバー, with each one's disclosure), 「音声認識データを 削除（39 MB）」 | always |

**Other rules:**
- No hub card and no ✨ storm: one ✨ at a time, as today.
- きまぐれ (today.ts) never picks a mic mode. It would surprise people into speaking.
- The first time 声に 出す shows, its header has a one-line explainer: 「声は この iPhone の 中だけで 使われます」 (or the backend's own line).

---

## 3. Architecture

### 3.1 Files (all new unless marked)

```
app/src/lib/mic/
  capture.ts            openMic(): getUserMedia → MediaStreamSource on the engine's context → the worklet; 16 kHz mono ring;
                        level meter; VAD (energy + zero-crossing, 300 ms hang); stop() releases the track and the session
  capture.worklet.js    the AudioWorkletProcessor (a same-origin file, not a blob:)
  session.ts            play-and-record on capture, restoring what sound.svelte.ts had (one owner of the session type)
  stt.ts                the Recogniser interface, Heard, Take; recogniser() picks and lazily loads a backend
  pick.ts               the backend choice from this phone's probe result + the せってい override (pure)
  match.ts              normalise (US contractions and reductions both ways, digits ⇄ words, fillers out), word alignment
                        (Levenshtein), WER, content-word recall, choice matching with margin, key-phrase detection (pure)
  pitch.ts, prosody.ts  YIN f0, the envelope, syllable nuclei, DTW, the comparison → feedback codes (pure)
  backends/whisper.ts   the page side: a Worker, progress, the model cache
  backends/whisper.worker.ts  transformers.js: pipeline('automatic-speech-recognition'), WebGPU else WASM; candidates
                        by forced decoding (decoder logits on given token ids)
  backends/webkit.ts    webkitSpeechRecognition, en-US, interim off, one utterance
  backends/relay.ts     16 kHz 16-bit WAV (≤ 10 s, ≤ 340 KB) → POST /stt
  backends/stub.ts      the e2e's: scripted Heard from localStorage['e2e.stt'] (inert without it, like e2e.date)
  probe/steps.ts        M0's steps and their measurements (pure where possible: bleed, rtl from a click)
  models.ts             the pinned manifest: model, revision, files, sha256, parts
app/src/lib/components/kikimimi/mic/
  MicProbe.svelte  MicOptIn.svelte  MicButton.svelte (72 px, ring meter)  Contour.svelte (SVG, two lines)
app/src/lib/kikimimi/games/{mane,kuri,pair,role}/   GameDefs + decks (pure)
app/src/lib/components/kikimimi/{mane,kuri,pair,role}/   their views (lazy)
app/src/lib/i18n/kiki-mic.{ja,en}.json (+ kiki-mane…, one per game, addCatalog)
app/scripts/stt-models.ts   fetch the pinned files from HF once (on the Mac), verify sha256, split ≤ 20 MiB, upload to R2
relay/src/sttRoute.ts      POST /stt
```

### 3.2 One interface, three backends

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

- The modes see only `Heard` and match.ts. Swapping the backend changes no game.
- `Heard.text` lives in the round's memory, with nothing persisted.
- `cand` exists only on whisper. はつおん uses it when present.
- Whisper runs in a dedicated Worker, so the sheet stays at 60 fps. The Worker is created only after opt-in and the first mic round, and is terminated when the sheet closes (iOS memory).
- Whisper's input is the capture's 16 kHz PCM, trimmed by the VAD. Silence never reaches the model (no hallucinated "Thank you.").
- **As built (M3, 2026-11-07):**
  - `recogniser(be?)` gives this phone's recogniser: the stub under `e2e.stt`; else, with the mic on, pick.ts's choice from what can run (whisper only once the model is on the phone: a round never downloads). One recogniser at a time, one take at a time (a new take cancels the last); `release()` when the sheet closes.
  - `listen(h)` is called inside a tap and returns `{ level, heard, stop(), cancel() }`. `heard` never rejects: a `Heard`, or `{ miss }` with miss one of none, aborted, denied, capped (429: 「今日は ここまで」), off (STT_OFF), unpaired, network, timeout, oom, service-not-allowed or other.
  - whisper loads on WebGPU, else WASM; one GPU failure keeps it on WASM. A timed-out request terminates the Worker. `candidates` scores each word by forced decoding (the encoder runs once), with the transcript as the fallback.
  - The relay sends ≤ 10 s of WAV with a 20 s timeout; cancel aborts the request.
  - match.ts: `words`, `wer`, `align`, `recall` (content words), `choose` (lenient, with a margin; −1 = 「通じるかも」), `phrases` (a bitmask) and `candidate`.

### 3.3 The pitch and timing analysis (prosody.ts)

- **Input:** the take's 16 kHz PCM and the reference clip's `AudioBuffer` (packs.ts `voiceClip`, resampled once), both through the same code.
- **f0:**
  - YIN, 32 ms window, 10 ms hop, 70–400 Hz, threshold 0.15;
  - a 5-point median and octave-jump repair;
  - in semitones relative to each speaker's own median (a male learner and a female villager compare fairly).
- **Envelope and nuclei:** RMS in dB at 10 ms. Syllable nuclei are peaks voiced and ≥ 2 dB above their dips (de Jong & Wempe's method). The reference's word starts come from words.json.
- **Alignment:** DTW over [semitone z-score, energy z-score] with a band of ±25%.
- **Outputs:**
  - rate ratio;
  - lag (shadowing: your start minus the clip's start on the shared context clock, less the probe's round-trip latency);
  - range ratio (your p90−p10 / theirs);
  - final direction match (the last voiced 300 ms);
  - stressed-nucleus alignment (the reference's 3 loudest nuclei against yours);
  - extra pauses.
- **Feedback:** the outputs → feedback codes → i18n lines. The codes, never the PCM, go to the view.
- **Tests:** vitest on synthetic signals (glides with known f0, pulse trains with known nuclei, a rise against a fall) and one committed fixture WAV (§3.8), with a tiny WAV parser and no ffmpeg in tests.

### 3.4 Into W2-C2's registry

Each game is a `GameDef` with a lazy `view` (W2-C2's slot), its deck pure and seeded as every game's:

| `gm` | modes | Rounds (kind) | Answer (ints, on the device; on the wire only for `role`) | Timing |
|---|---|---|---|---|
| `mane` | solo | 4 × `mic.shadow` (auto: no grade) | none | play = clip ×2 + record, untimed |
| `kuri` | solo | ≤ 8 × `mic.repeat`, `next()` adaptive (climb or stop, like みみ チェック's) | `[hit, of]` content words | play = clip, then 1 s, answer ≤ clip × 2 + 2 s |
| `pair` | solo, coop (あてっこ, `roles: 2`) | 8 × `mic.pair` | candidate index (solo); the picture tapped (あてっこ, the listener's) | answer 8 s ×2 tries |
| `role` | coop only, `roles: 2` | 6–10 × `mic.turn` (the speaker's role answers) | phrase bitmask ≤ 12 bits | untimed per turn |

**Grading.** `grade` is pure over the ints: the device does the hearing, and the session only sees numbers. So the RoundSession, the wire format (`a` ≤ 12 ints) and the relay are unchanged. Every row is minutes only (`r: []`); the device-local marks (くりかえし's span, a pair's miss) sit beside サンド's (DEVICE).

**Asks for W2-C2** (sent to that lane now, as one line each in its catalog design):
- a per-mode `gate()` (playable only when `micOn() && backendReady(kind)`);
- a shelf id `koe` (声に 出す) after じっくり;
- `requires: 'mic'` on a mode, so the みんなで picker can say 「マイクが オフです」 for the invitee.

**こたえて！** isn't a game. It's `MicAnswer` inside frame/ChoiceGrid.svelte, shown when Play passes `voice` (the round's kind is reply). That needs one line in Play.svelte after W2-C2 lands (§4).

### 3.5 The relay endpoint

**`POST /stt`** (relay/src/sttRoute.ts, beside logRoute.ts, free of the Workers runtime for tests):
- **Auth:** the record's key (auth.ts `keyOwner`); CORS for our origin only (`originAllowed`); preflight allowed (a non-simple request).
- **Body:** `audio/wav`, ≤ 340 KB (10 s at 16 kHz 16-bit), anything else 413.
- **Call:** `env.AI.run('@cf/openai/whisper-large-v3-turbo', { audio: base64 })`.
- **Reply:** `{ text, words? }`, `Cache-Control: no-store`.
- **Never kept:** the body is never written to a Durable Object, R2, KV or the log. Nothing is `console.log`ged. The audio is dropped when the request ends.
- **Logs** `stt` with sizes, ms, model and ok only.
- **Caps:** 300 requests per role per day (a counter in the log object's day cap pattern); over it, 429 → the client says 「今日は ここまで」. A `STT_OFF=1` switch, like `LOG_OFF`.
- **wrangler.toml:** `[ai] binding = "AI"` (and the test env's). No secrets.
- **Before M5 relies on it:** the privacy reviewer confirms in docs/ops that Workers AI's terms keep inputs out of training and out of storage.

### 3.6 CSP, headers, hosting and the service worker

- **CSP (vite.config.ts):**
  - `connect-src 'self'` already covers `/stt/*`, and the relay is already listed;
  - `script-src 'self' 'wasm-unsafe-eval'` covers ort's wasm;
  - `worker-src` falls back to `script-src` (a same-origin module Worker);
  - WebGPU needs nothing;
  - **no new origin**: no huggingface.co, no CDN; ort's `wasmPaths` and transformers' `env.remoteHost` point at `/stt/`, `allowRemoteModels` is off.
- **Permissions-Policy (scripts/headers.ts):** `microphone=(self)` (M0). Everything else stays off.
- **`_headers`:** `/stt/*` gets `Cache-Control: public, max-age=31536000, immutable`. The paths carry the revision: `/stt/whisper-tiny.en@<rev8>/…`, `/stt/ort/<ver>/…`.
- **Hosting:**
  - Pages allows 25 MiB per file and the decoders are 29–100 MiB. So `stt-models.ts` splits each file into **≤ 20 MiB parts** (`<file>.<sha8>.p0…pN`) with a manifest (`models.ts`: bytes, sha256, parts).
  - The page's transformers.js `env.customCache` serves each model file from our `island-stt-v1` cache, assembling the parts. A failed sha256 throws the file away.
  - **The home is R2**, behind a same-origin route `/stt/*`: its own Pages Function file (functions/stt/[[path]].ts), disjoint from W2-R's packs route, on the same bucket and binding (the user's one Cloudflare step, shared with W2-R).
  - **Stopgap if R2 isn't ready for M0:** the deploy job copies tiny.en int8's 3 parts (39 MiB) and ort's wasm from an Actions cache (filled by stt-models.ts from the pinned revision, sha256-checked) into build-pages/stt/. Never in git.
  - **As built (M0w, 2026-11-07):** the stopgap is live. Pinned: whisper-tiny.en @ `2575352d`, onnxruntime-web `1.31.0-dev.20260914-8d85527a0` (package.json's overrides; transformers.js 4.3.2 exact, its Node-only deps replaced by an empty package). ort's asyncify wasm is 25.6 MiB, so it's in parts too: the download is **~70 MB** (the model 41 MB + the runtime 27 MB), and the probe says so. The worker is `workers/stt.<hash>.js`, 136 KB gz. The R2 switch: bind the bucket to the Pages project as `STT_BUCKET`, run `node scripts/stt-models.ts --r2 <bucket>`, then drop the deploy's copy step.
- **The service worker:**
  - caches.ts gains `isStt` (`/stt/`, and the recogniser chunk named `stt.<hash>.js` by a `stt-names` rule in vite.config.ts, the maplibre-names pattern) and `STT_CACHE = 'island-stt-v1'`;
  - `precachable()` excludes both;
  - the fetch handler serves `/stt/` and the stt chunk **cache-first from STT_CACHE and never stores** (the page fills the cache itself on opt-in, with progress);
  - `staleCaches` keeps `island-stt-v1`;
  - せってい's 削除 deletes it.

  So a user who never opts in downloads 0 bytes of it, and a deploy never re-fetches it.
- **Budgets:**
  - scripts/load-budget.ts adds the stt chunk and `lib/mic/` to its "never in index.html's set" list;
  - kikimimi-budget.ts (W2-C2's glob) covers the four game folders (≤ 15 KB gz each);
  - the mic core is a shared lazy chunk ≤ 10 KB gz;
  - the recogniser chunk is checked ≤ 450 KB gz (its own line);
  - ort's wasm and the model are not JS and are outside the 3 MB precache line by construction.

### 3.7 Audio session and the engine

- sound.svelte.ts gets `micSession(on)` beside `voiceSession`: `play-and-record` while a capture is open, back to what it was after. It also exports `audioCtx()` so capture.ts uses **the voice's context** (one clock for the clip and the mic).
- Music is held ducked while recording (`holdVoiceDuck`).
- The capture stops on `visibilitychange` hidden, the sheet closing, or 15 s max, and it releases the track: the orange dot goes off at once.
- **As built (M1, 2026-11-07):** `micSession(on)` layers the type (mic 'play-and-record' over a game's 'playback', the one from before back once both are over, in either order); `audioCtx()` wakes the voice's context. lib/mic/session.ts owns a take: one at a time, ended by stop / cancel, the VAD (vad.ts: 20 ms frames, energy over a following floor + zero-crossing, 300 ms hang, done after 1 s quiet), the 15 s cap, 8 s without speech, a new take, `visibilitychange` hidden or `pagehide`; each end releases the track. The core chunk is ~2.5 KB gz (load-budget's line). せってい › マイク (MicOptIn): the switch asks the permission first; DEVICE.mic `{ on, be }`; 自動 = whisper only; M0's 「マイク診断（テスト）」 kept as a small row under it until the user has run the probe.
- 「おとを 1だいに まとめる」 (same room) stays as it is. Mic games are solo or role-play, where each phone plays only its own prompts.

### 3.8 Hermetic tests

- **vitest (pure):**
  - pitch.ts and prosody.ts on synthetic signals and the fixture;
  - match.ts (reductions, digits, choice margins, phrase bitmasks, WER);
  - pick.ts (the decision rule);
  - each GameDef (determinism, grade, valid bounds, `next`);
  - sttRoute (auth, sizes, the cap, nothing kept: a fake `AI` and a spy on the log);
  - log.ts accepting `mic.*` and refusing text in them.
- **e2e:** a new Playwright project **`chromium-mic`** (testMatch `kikimimi-mic*.spec.ts`; the others' testIgnore it):
  - `--use-fake-ui-for-media-stream`;
  - `--use-fake-device-for-media-stream`;
  - `--use-file-for-fake-audio-capture=e2e/fixtures/mic/ladder-line.wav` (one of our clean clips, 16 kHz mono, ~100 KB, made once by a script);
  - plus the existing `--mute-audio --disable-audio-output` (**no audio plays on the dev Mac**) and the host-resolver rule (no network);
  - the stub recogniser via `localStorage['e2e.stt']` (a scripted `Heard` per call);
  - specs: the opt-in, the probe's flow with stubs, one solo run per mic game, こたえて in a co-op reply round, role-play's consent and phrase chips.
- **What the tests don't do:** load whisper, touch WebGPU, or judge the analysis's numbers (the fake device's start offset varies), only the flow and that feedback appears. Rendering and the feel are judged on the iOS Simulator and the phones.
- `hermetic-tests` rules hold: pinned date, seeded decks, no sleeps (waits on the stub's promise, not time).

---

## 4. Increments

Each lands green on main, deployable on its own, with disjoint files. **None touches** compile.ts, listen.ts, registry.ts, decks.ts, game.svelte.ts, KikimimiSheet.svelte, Play.svelte (until §M5's one line, after W2-C2), catalog.ts, Asobu.svelte, ModeDetail.svelte or content/listen/*. Shared files touched (one increment each): contract/log.ts, scripts/headers.ts, vite.config.ts, caches.ts and the SW, sound.svelte.ts, sync/storage.ts (one DEVICE key), KikiSettings.svelte, frame/ChoiceGrid.svelte, playwright.config.ts.

| # | Increment | Files it owns | Waits for | Effort |
|---|---|---|---|---|
| **M0r** | Relay side of the probe: `mic.*` and `stt` events in the log registry; `POST /stt` with the AI binding, caps and the off switch; the privacy rule in docs. **Deploys first** | app/src/lib/contract/log.ts, relay/src/sttRoute.ts (+1 line in relay/src/index.ts), relay/wrangler.toml, relay/test/stt.test.ts, docs/kikimimi.md §"マイク" (the rule), docs/decisions.md, docs/ops/observability.md (the events) | – | 0.5 d |
| **M0** | **The probe**, steps 1–3, 5 and 6, plus step 4 when `/stt/` has the model: せってい's 「マイク診断（テスト）」, MicProbe; `microphone=(self)`; the events posted | lib/mic/probe/*, lib/mic/match.ts (WER only), components/kikimimi/mic/MicProbe.svelte, i18n/kiki-mic.*, settings/KikiSettings.svelte (one row), scripts/headers.ts, e2e/kikimimi-mic-probe.spec.ts, playwright.config.ts (the `chromium-mic` project), e2e/fixtures/mic/*.wav | M0r deployed | 1.5 d |
| **M0w** | Whisper for the probe: stt-models.ts, the parts and manifest, `/stt/*` (R2 Function or the stopgap), the SW's STT cache and exclusions, the `stt-names` chunk rule, backends/whisper* (probe use) | scripts/stt-models.ts, lib/mic/models.ts, lib/mic/backends/whisper.ts + .worker.ts, functions/stt/[[path]].ts, src/service-worker/caches.ts + index.ts (the `/stt/` branch), vite.config.ts (stt-names), scripts/load-budget.ts (the stt line), package.json (@huggingface/transformers, pinned) | the R2 bucket (the user's step) or the stopgap; ∥ M0 | 1 d |
| — | **The user runs the probe** on both phones (home-screen app, with and without earphones). We read `npm run logs -- --event mic.` and fix the decision rule's thresholds | – | M0 (+M0w) | 15 min, the user |
| **M1** | Mic core and opt-in: capture + worklet + VAD, the session, `micSession`/`audioCtx`, MicOptIn (the switch, the disclosures, the download, 削除), MicButton, the DEVICE key | lib/mic/{capture.ts, capture.worklet.js, session.ts, pick.ts}, components/kikimimi/mic/{MicOptIn,MicButton}.svelte, sound/sound.svelte.ts (2 exports), sync/storage.ts (DEVICE.mic), KikiSettings.svelte (the switch replaces M0's row), e2e/kikimimi-mic-optin.spec.ts | M0 | 1 d |
| **M2** | **まねっこ シャドーイング**: pitch/prosody, Contour, the game, its shelf entry | lib/mic/{pitch,prosody}.ts (+ tests), games/mane/, components/kikimimi/mane/ (+ mic/Contour.svelte), i18n/kiki-mane.*, its registry line, e2e/kikimimi-mic-mane.spec.ts | **W2-C2** (registry, view slot, the `koe` shelf and `gate`), M1 | 2 d |
| **M3** | The Recogniser: stt.ts, the webkit, relay and stub backends, whisper made general (WebGPU→WASM, candidates), match.ts complete | lib/mic/stt.ts, lib/mic/backends/{webkit,relay,stub}.ts, lib/mic/backends/whisper*.ts (extends M0w's), lib/mic/match.ts | M1, the probe's result; ∥ M2 | 1.5 d |
| **M4** | **くりかえし チャレンジ** | games/kuri/, components/kikimimi/kuri/, i18n/kiki-kuri.*, its registry line, e2e/kikimimi-mic-kuri.spec.ts | **W2-C2**, M3 | 1.5 d |
| **M5** | **こたえて！**: MicAnswer in ChoiceGrid; Play passes `voice` for reply rounds (one line) | frame/ChoiceGrid.svelte, components/kikimimi/mic/MicAnswer.svelte, Play.svelte (one line, **after W2-C2 has landed**), e2e/kikimimi-mic-reply.spec.ts | **W2-C2 landed**, M3 | 1 d |
| **M6** | **はつおん ききわけ** + あてっこ; the pair-word clips (a small audio batch, GPU idle, after A3) | games/pair/, components/kikimimi/pair/, i18n/kiki-pair.*, content/mic/pairs.yaml (its own folder: not content/listen), the pair clips in their own pack, its registry line, e2e | **W2-C2**, M3; the audio batch | 2 d |
| **M7** | **ふたりで ロールプレイ**: role cards from units' dialogues, consent at join, phrase chips, お手本 | games/role/, components/kikimimi/role/, i18n/kiki-role.*, its registry line, e2e (two phones, the stub) | **W2-C2**, M3, W2-9 (the unit page's じっせん row; else the みんなで picker only) | 2 d |

**Order (≤ 3 agents, the ACC cap; wave 2 comes first):**
1. M0r → M0 ∥ M0w. Today, alongside W2-C1/C2: the files are disjoint.
2. The user runs the probe. Then M1.
3. When W2-C2 lands: M2 ∥ M3.
4. M4 ∥ M5. Then M6 ∥ M7 as wave 2's game lanes free up the agent slots.

**Waits for W2-C2:** M2, M4, M5 (the Play line), M6, M7. **Doesn't:** M0r, M0, M0w, M1, M3.

---

## 5. The privacy rule (for docs/kikimimi.md "マイク", and docs/decisions.md)

> **The microphone (2026-11-07).**
> - Off by default. Turned on per phone in ききみみ's せってい and off again there.
> - Solo by default. The partner is involved only in ロールプレイ and あてっこ, and only when both players opted in: joining is consenting.
> - **Recordings are never stored or synced.** A take lives in memory for its round and is dropped at the next round, on leaving, or when the app hides. It's never written to localStorage, IndexedDB, the Cache API, the record, R2 or the log, and never sent to the partner. The partner hears only your live voice in the room.
> - **Speech to text runs on the phone first** (whisper in the page; the model is downloaded once after you agree, and can be deleted).
>   - If Safari's recogniser is used, the audio may go to Apple.
>   - If the relay is used, the audio goes to our relay and Cloudflare's Workers AI for the request only, and nothing is kept; the relay logs only sizes and times.
>   - The opt-in names the backend in use.
> - **No transcript and no speaking score leaves the phone.** Mic games' rows carry minutes only. ロールプレイ shares only its ✓ per phrase, as the team's.
> - **No ranking or leaderboard for speaking.** Mic modes are not in たいかい or きまぐれ.
> - Heard text is never put into a log event or an `Error`.
> - The Permissions-Policy allows the microphone to our origin only.

---

## 6. Open questions for the user (the defaults are taken)

1. **The model's home.** **Default:** R2 under `/stt/` (the same bucket as W2-R's packs). Until then, a CI cache feeds the probe's 39 MiB. Never git.
2. **A recogniser off the phone.** **Default:** in-page whisper. Safari's or the relay only if the probe says whisper is too slow or wrong for your voice, and only after its one-line disclosure.
3. **AirPods.** If the probe shows the AirPods mic drops the sound to the hands-free profile, **default:** record with the iPhone's mic while the AirPods play (if `deviceId` allows it). Else shadowing with AirPods becomes まねっこ (repeat after) and wired earphones are recommended.

---

## Sign-off (2026-11-07)

| Reviewer | Verdict | Changes made |
|---|---|---|
| Learning scientist | **Approve with changes** | No pronunciation score anywhere. The target never primes the recogniser. Perception before production in はつおん (hear both, then say). EI's one-second delay, sentences climbing by syllables, a replay disqualifies a climb. The EI span stays device-local and outside みみ チェック until it's checked against a month of placements. Visual contours in まねっこ. Speaking never feeds the listening stats |
| American EFL teacher | **Approve with changes** | Contractions and reductions count both ways (gonna = going to). A reply that matches no choice is 「通じるかも」, never ✗. Shadowing starts on the clean 0.8× rungs. US voices only. The pair list from the tagged `word` items plus teen/ty and the user's rice/lice. Role-play hints are the unit's key phrases, the lines given in Japanese, not to be read off |
| Game/UX designer | **Approve with changes** | One shelf, 声に 出す, shown only with the mic on. こたえて！ is a chip in place, not a mode. ロールプレイ and あてっこ in the みんなで picker. A 72 px tap-to-talk with a ring meter, auto-stop on silence. Not in きまぐれ. The villager's reactions (spaced kana) and the "what they heard" pictures carry the fun. No meter, no ranking |
| Learner panel | **Approve** | 「一人で イヤホンなら やれる」. The mic never starts on its own. The partner never gets your recordings. No score in まねっこ. あてっこ's wrong picture is funny, not shaming. The 39 MB is asked for once with its size. ≤ 2½ min each; role-play ~3 min, only when both want it |
| Senior engineer | **Approve with changes** | `microphone=()` → `(self)` in M0. Every whisper decoder is > 25 MiB (measured from HF), hence parts and R2. The SW precaches hashed chunks by default, hence `stt-names` and `isStt`. Not cross-origin isolated, so the WASM path is single-threaded: measured, not COEP'd. Capture on the voice's AudioContext for one clock (`audioCtx()`). The session type restored. Whisper in a Worker, terminated when the sheet closes. No wire or relay change for the games (answers are ints). Asks to W2-C2: `gate()`, the `koe` shelf, `requires: 'mic'`. The relay deploys before M0. Wave-2 lanes' files untouched |
| Privacy reviewer | **Approve with changes** | The rule in §5, in the docs with M0r. Per-backend disclosure in the opt-in. The relay keeps no audio and no text, logs sizes and times, has a daily cap and an off switch. Rows are minutes only. The log's closed schema makes transcripts unloggable; plus a lint against `Error(heard…)`. The probe's spoken samples go to the relay only on its own tap. Workers AI's data terms are written into docs/ops before M5 relies on the relay |
