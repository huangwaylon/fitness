# ききみみ: speaking with the mic (signed off 2026-11-07; M0r–M7 built the same day)

**The user, 2026-11-07:** approved adding mic modes in this order: まねっこ シャドーイング, くりかえし チャレンジ, こたえて！, はつおん ききわけ, ふたりで ロールプレイ. Speech to text runs on the phone first. A phone probe comes first. No free LLM conversation.

**The team:** a learning scientist (shadowing, elicited imitation, Japanese learners), an American EFL teacher, a game/UX designer, the learner panel (two B1+ adults in Tokyo: short attention, no homework, shy about speaking), the senior web/iOS engineer and a privacy reviewer. Inputs: docs/curriculum-wave2.md, kikimimi.md, kikimimi-framework.md, kikimimi-ux.md, the code as of 91c21a40 and the Hugging Face listings of onnx-community/whisper-tiny.en and whisper-base.en.

**Status (2026-11-07).** Every increment is on main (§4). **Pending:**
- **The user's probe** (M0) on both phones, home-screen app, with and without earphones. Then we read `npm run logs -- --event mic.` and set the decision rule's thresholds (§1.1); until then 自動 means the phone's own whisper only (pick.ts), and Safari's or the relay's recogniser only when picked by hand.
- **R2** (the user's step, shared with W2-R): enable R2 in the Cloudflare dashboard, make the bucket and bind it to the Pages project as `STT_BUCKET`. Until then the model is served by the deploy's stopgap (§3.6).
- Workers AI's data terms (no training, no storage) written into docs/ops by the privacy reviewer (§3.5). The relay path is opt-in by hand only meanwhile.
- Small leftovers: こたえて！'s 「これ？」 band and 「声で / タップで」 preference (§2.3), くりかえし's device-local speaking span (§2.2), the unit page's ロールプレイ row (§2.5), the input latency off まねっこ's lag (§3.3).

**The verdict in seven lines:**
1. Everything the modes need can run on an iPhone 15/16 in Safari 26/27. The phone must confirm: permission persistence in the home-screen app; playing and recording at once (route, loudness, echo, AirPods); whisper's speed and accuracy on the user's voice; whether webkitSpeechRecognition works standalone. **M0, the probe, ships first, alone,** and reports to the relay log.
2. まねっこ needs **no speech to text**: pitch and timing are compared on the phone with Web Audio and plain math, so it doesn't wait for the recogniser.
3. One `Recogniser` interface, with backends `whisper` (in-page, WebGPU then WASM), `webkit` and `relay` (Workers AI); `stub` for the tests. The probe's numbers pick the backend per phone.
4. The model can't sit on Pages as-is: every whisper decoder, and ort's wasm, is over the 25 MiB file limit. The files are served same-origin under `/stt/` in parts of ≤ 20 MiB (R2, or the deploy's stopgap), **never precached**, fetched only after the user opts in: **~70 MB** (the model 41 MB + the runtime 27 MB).
5. Privacy: recordings exist only in memory for the round; nothing audio or text is synced, logged or sent to the partner; the relay path stores nothing; rows carry minutes only; no speaking leaderboard (§5).
6. The modes are W2-C2 games on one shelf, **声に 出す**, shown only with the mic on. こたえて！ is a mic chip inside the existing reply rounds, not a mode.
7. Increments M0–M7 (§4).

**Rules for every mic mode** (the user's constraints, plus this round's):
- **Off by default.** Turned on per phone in ききみみ's せってい. Solo by default. Earphones are recommended on every mic screen.
- **Short, fun, never homework:** ≤ 2½ min a game; no streaks, no keyboard; replays free; a tap fallback wherever speech is the input.
- American English only (`voice === 'us'` items only).
- No かいがら and no new reward. The payoff is in the round: the villager's reaction, the contour, the sentence ladder.
- Japanese help on every screen: `ctx` before; `ja`, `why` and `note` after; feedback in Japanese.
- **Sheet text in kanji Japanese** (「最後の 上がり調子が そっくりです」). **Character speech in spaced kana** (しずえ: 「わあ、 そっくり！」).
- **No pronunciation score, no accent grading.** Speech to text checks *words* (were you understood?), never "nativeness".
- iPhone Safari only (15 and 16, home-screen PWA). Mic buttons are ≥ 72 px, tap to start, auto-stop on silence or a tap to stop. They never start on their own.
- Lazy chunks: each game's view ≤ 15 KB gz; the mic core ≤ 10 KB gz (~2.5 KB as built); the recogniser its own worker chunk, never in index.html's transitive set (load-budget.ts), never precached.

---

## 0. How the team converged

| Role | First pick | Objection raised | Where it landed |
|---|---|---|---|
| Learning scientist | Shadowing and elicited imitation (EI). Both have a research base with Japanese EFL learners: shadowing mainly trains bottom-up perception and phoneme-level parsing (Kadota 2007, 2019; Hamada 2016, 2019), and EI sentence-repetition scores track proficiency (Erlam 2006; Yan et al. 2016 meta-analysis) | "An ASR pronunciation score is noise. Priming whisper with the target sentence makes it hear what we expect" | No pronunciation score. The target is **never** given to the recogniser as a prompt; it's used only to compare afterwards. Minimal pairs are judged by intelligibility (Munro & Derwing), and **perception comes before production** (Bradlow et al. 1997: /r/–/l/ perception training carried over to production). Visual pitch contours help prosody (Hardison 2004), so まねっこ shows them |
| EFL teacher | こたえて！ (real replies) and ロールプレイ (the units' phrases) | "Marking a valid reply wrong because it isn't one of the four kills speaking. And `gonna` must count as `going to`" | When a reply matches no choice, it's never shown as ✗: 「その 言い方も 通じるかも」 and the choices to tap. Reductions and contractions fold both ways in the matcher |
| Game designer | A 「そっくり度 87%」 meter in まねっこ; a ranking for くりかえし | Panel: 「点数は いや」; the user: unscored, no speaking leaderboard | No number in まねっこ: the villager reacts in spaced kana and the two contours overlay. くりかえし's "longest sentence" is a sentence ladder shown only to you. はつおん gets the fun: the villager **shows what they heard** (rice 🍚 / lice 🪲) |
| Learner panel | 「一人で イヤホンなら やる」, 「ロールプレイは 二人とも その気なら 楽しそう」 | 「相手に 聞かれたくない」; 「大きい ダウンロードは Wi-Fi で」; 「マイクが 勝手に つくのは こわい」 | Solo by default. Co-op only when both opt in (joining = consenting). The mic never starts by itself. The download is asked for once, with its size (Wi-Fi recommended). A visible listening ring on top of iOS's orange dot |
| Engineer | The probe first; まねっこ before any recogniser | "Wave 2's sheet, Play.svelte, catalog and registry are being rewritten. The model files are over Pages' 25 MiB. The SW precaches every hashed chunk by default. The Permissions-Policy blocks the mic" | The mic core is a self-contained `lib/mic/`. Games only after W2-C2. Model parts under `/stt/`. A `stt-names` Vite rule keeps the recogniser out of the precache. `microphone=(self)` shipped in M0 |
| Privacy reviewer | In-page whisper only | "webkitSpeechRecognition sends audio to Apple. The relay sends it to Cloudflare. Transcripts in error messages leak into `js.error`" | Allowed as fallbacks, **disclosed per backend** in the opt-in. The relay holds audio for the request only and logs sizes and times. No `Error` built from heard text. Rows carry minutes only |

---

## 1. Feasibility per capability

Phones: iPhone 15 (A16, 6 GB) and iPhone 16 (A18, 8 GB), iOS 27, home-screen PWA. "Known" means from WebKit's shipped features and public reports, not measured on these phones; the last column is what M0 measures.

| Capability | On the phone? | Evidence / what we know | What the probe must confirm |
|---|---|---|---|
| **getUserMedia** in the home-screen app | Yes | Supported standalone since iOS 13.4; Permissions API `microphone` query since Safari 16. The Permissions-Policy was `microphone=()`; M0 made it `microphone=(self)` | Time to grant; the state before and after; **whether the prompt comes back on the next launch**; the track settings; the input's class (built-in / Bluetooth / wired, from the label, which is never logged) |
| **Play and record at once** | Yes, with caveats | `navigator.audioSession` `play-and-record` (Safari 16.4+). Risks: output dropping to the earpiece or ducked by voice processing; AirPods falling to the hands-free profile when their mic is used | Per route {none, wired, AirPods}: is the clip heard (聞こえない / 小さい / ふつう)? Bleed (dB) with echo cancellation on and off; round-trip latency; can the built-in mic be picked while AirPods play, keeping their quality; is the session restored after `stop()` |
| **Capture to PCM** (AudioWorklet on the engine's context) | Yes | AudioWorklet since Safari 14.1; a same-origin module (`script-src 'self'`). One context with the voice, so the mic and the clip share a clock (shadowing's lag) | The context's rate with the mic open; the input latency |
| **Pitch and timing analysis** | Yes, trivially | YIN over 5 s at 16 kHz is milliseconds on an A16; unit-tested on synthetic signals | Nothing beyond capture |
| **WebGPU** | Very likely | On by default since Safari 26; the island stops drawing under a sheet | `navigator.gpu` in the page **and in a Worker**; `shader-f16`; limits; survival across background/foreground |
| **Whisper in-page** (transformers.js + onnxruntime-web) | Yes if latency holds | tiny.en int8 39 MiB of model (fp16 72.6 MiB); base.en int8 73 MiB. Every decoder is over 25 MiB → parts (§3.6). Not cross-origin isolated, so WASM is **single-threaded**. Expect a higher WER on Japanese-accented English than on native speech | Download time; load cold and cached; **per-clip latency** on WebGPU and WASM, first on our clips' PCM, then on 3 sentences the user speaks; the **WER on the user's voice**; whether iOS kills the page (memory) |
| **webkitSpeechRecognition** | Maybe | Needs Siri & Dictation on; may use Apple's servers; no word timings; standalone has had `service-not-allowed` reports | Exists standalone? Its error; a second prompt; time to result; WER; **whether it runs while our capture is open** |
| **Relay Whisper** (Workers AI `@cf/openai/whisper-large-v3-turbo`) | No, server-side | One `[ai]` binding; cents a month, inside the Free plan's daily neurons (docs/ops/observability.md). No new processor: Cloudflare already hosts everything | Round trip on LTE and Wi-Fi; WER (the baseline) |
| **Echo cancellation** | Yes (constraint) | `echoCancellation: true` goes through iOS voice processing, which may lower the clip's quality | Bleed on and off; the user's rating of the clip with it on |

**What the probe can't settle** (judged on the phone by the user): whether shadowing with earphones *feels* right (the lag), and whether the feedback lines encourage. Chromium's fake device proves only the logic (§3.8).

### 1.1 M0, the probe, step by step (≈ 6 minutes, once, on each phone)

**Where:** せってい's 「マイク診断（テスト）」 opens `MicProbe.svelte` (lazy) in the page's place; since M1 it's a small row under 「マイクを使う」, kept for re-runs after an iOS update. One screen a step, one button, 「スキップ」 and a plain result line.

| # | Step | Measures | The user does |
|---|---|---|---|
| 1 | 環境 | standalone, `crossOriginIsolated`, `navigator.gpu` (page + Worker), `shader-f16`, `webkitSpeechRecognition`, `audioSession`, MediaRecorder types, AudioWorklet | nothing |
| 2 | マイクの許可 (a later open: 開き直しの確認) | permission state, ms to grant, track settings, input class; on the next launch, whether it asked again | taps 許可; later, 聞かれた / 聞かれなかった |
| 3 | 再生と録音 | per route (none / wired / AirPods): bleed with echo cancellation on and off, round-trip ms, the built-in mic with AirPods, the session restored | puts earphones on or off when asked; rates the clip |
| 4 | Whisper（約 70 MB） | download, load (WebGPU, WASM), latency and WER on our 3 clips' PCM (decoded, never played), then on the 3 sentences spoken, on the faster device | taps ダウンロード (Wi-Fi); speaks 3 sentences |
| 5 | Safari の音声認識 | exists, error, prompt, ms, WER, coexistence with capture | speaks the 3 sentences |
| 6 | サーバーで文字起こし | round trip, WER | taps 送る (disclosed: the audio goes to the server only for the transcription and isn't kept) |
| 7 | 結果 | a table on screen; 「結果を送信」 posts the events | taps |

**The sentences:** 3 pinned clean US clips (lib/mic/probe/steps.ts `SENTENCES`), the same on both phones, shown with their `ja`. The WER is computed **on the phone** (match.ts). **No heard text is ever logged**: it shows on screen only.

**The log events** (contract/log.ts, `src: 'c'`; numbers, booleans, closed sets or short tokens):

| Event | Fields |
|---|---|
| `mic.env` | `pwa` b, `coi` b, `gpu` b, `gpuW` b (in a Worker), `f16` b, `arch` t, `wks` b, `ses` b, `mr` ['mp4','webm','none'], `wl` b |
| `mic.perm` | `st` ['granted','denied','prompt','unsupported'], `ms` n, `again` b, `asked` b, `ec` b, `sr` n, `inp` ['builtin','bluetooth','wired','other'] |
| `mic.duplex` | `ear` ['none','wired','bluetooth'], `aec` b, `bleed` n (dB), `rtl` n (ms), `loud` ['none','quiet','ok'], `pick` b (built-in chosen with BT), `restored` b, `err` t |
| `mic.stt` | `be` ['whisper-gpu','whisper-wasm','webkit','relay'], `model` ['tiny.en','base.en','tiny.en-f16','turbo','none'], `step` ['dl','load','clip','spoken'], `ms` n, `mb` n, `audS` n, `wer` n, `ok` b, `err` ['not-allowed','service-not-allowed','network','no-speech','aborted','audio-capture','oom','timeout','other'] |

The relay adds `stt` (`src: 'r'`: `ms`, `inB`, `model`, `ok`, `err`). Read with `npm run logs -- --event mic. --since 1d --json` and `--event stt` (docs/ops/observability.md).

**The decision rule** (to set from the user's results; **pending**: pick.ts applies only "自動 = whisper when its model is on the phone"):
1. **whisper in-page** if a 5 s utterance is transcribed in ≤ 2 s (WebGPU, else WASM) and the user's spoken WER is ≤ 0.20. Tiny.en first; base.en only if tiny's WER is > 0.20 and base's latency ≤ 3 s.
2. else **webkit**, if it works standalone, its WER is ≤ 0.20 and the user accepts its disclosure.
3. else **relay**, if its round trip is ≤ 2.5 s.
4. else the modes that need speech to text stay hidden. まねっこ still works.

---

## 2. The modes

Content reuse, counted over the compiled levels on 2026-11-07: 1,199 items (1,171 US); 995 single-speaker, 801 of them clean; 655 US single-speaker at 5–16 words; 221 `reply` items; 176 two-speaker dialogues; 30 ladders; the units' key phrases; minimal-pair `word` items (l-r 10, vowel 12, th 4, b-v 3, sh-s 2, can-cant 2) and `teen-ty` 18. The only new audio is はつおん's pair words (§2.4).

### 2.1 まねっこ シャドーイング (private, unscored)

- **The design:** a line heard once blind, then said over it (**shadowing**, with earphones) or right after it (**まねっこ**, when the clip bleeds); the **two contours** overlay (the villager's melody and yours, the words under them from words.json); the villager reacts in spaced kana with ≤ 2 tips in kanji, praise first (「最後の 上がり調子が そっくりです」, 「強く 言う ところが ぴったり」, 「もう少し 高い・低いを 大きく」, 「少し 早口に なって います」, 「単語の 間を つなげて みよう」); 「自分の 声を 聞く」 plays the take from memory, then it's gone. Never a number, never 「ちがう」. **Co-op:** none (private, the panel and the user).
- **What it trains:** rhythm (stress-timing against mora-timing), pitch range (Japanese learners compress it), linking and weak forms, shadowing's perception gains.
- **As built (M2):** games/mane/ (def.ts pure, lane.ts), components/kikimimi/mane/ (ManePlay, ManeResults), mic/Contour.svelte, lib/mic/{pitch,prosody}.ts, i18n/kiki-mane.*; its registry line: shelf `koe`, `gate` DEVICE.mic on, `requires: 'mic'`, never きまぐれ or shared.
  - **Lines:** 4 at my placed level (the mode page's おまかせ; 5 plays 4), single-speaker US items with a clean take (no `cond`, no `channel`), 4–12 words, no figures, shortest first. Not the ladders' lines (10–27 words, number drills: the plan's 0.8× rungs were dropped for this). A line said with reductions shows its `tts` under it.
  - **The round:** the clip once, listen only; then untimed: 重ねて言う 🎧 (the mic opens, then the line plays) or あとから言う (お手本, then the mic), the choice kept while the app is open. The take ends on the VAD's silence; then the contours, the reaction, the tips, 自分の声を聞く, もう一回, 次の文へ / この文はとばす.
  - **The row:** minutes only (contract/listen.ts `minutesOnly`: a `mane`, `kuri`, `pair` or `role` row has `r: []` and is refused with any answer, by the relay too); きろく shows the mic games' minutes as 「声に出す ○分」 under the week's line. ModeDetail shows no 問 chip and no こたえる じかん for a mic mode.

### 2.2 くりかえし チャレンジ (elicited imitation)

- **The design:** a **sentence ladder** (8 → 22 syllables); each clip plays **once**, a 1 s beat (you rebuild it rather than echo it), you say it; the sentence shows with the words said **lit** and the missed grey (contractions both ways); then `ja` and `note` or `why`. ≥ 80 % of the content words climbs a rung; two misses in a row end the run (「ここまで 14語！」, only to you). 「もう一回 聞く」 is free, but that sentence can't climb. **No prompt is given to the recogniser.** **Co-op:** none.
- **What it trains:** chunking, holding a sentence in working memory, the grammar you can rebuild: the research's proficiency proxy.
- **The speaking span** (pending): the run's top rung, kept **on this phone only**; after a month of both signals the learning scientist checks whether it predicts placement. Until then it touches neither みみ チェック nor the listening stats.
- **As built (M4):** games/kuri/ (def.ts pure, lane.ts, mode.ts), components/kikimimi/kuri/ (KuriPlay, KuriMic, KuriResults, board.ts), i18n/kiki-kuri.*; shelf `koe`, `requires: 'mic'`, `gate()` the mic on (and Safari's recogniser present when picked). 自動 without the model on the phone, or an unpaired relay, is known only at the round, which says so with やめる.
  - The run is at the mode page's おまかせ level; each sentence the unused eligible item (US, one voice, 5–16 words, clean; light conditions from もり) nearest its rung's syllables (8, 10 … 22). `GameDef.next`'s `done` carries each answer and its replays.
  - Answer `[hit, of, heard]`; ≥ 80 % is said, `pts` 0. A take with nothing heard says why, then 「もう一度話す」 or 「この文はとばす」 (neither climbs nor misses). The take's cap is the clip × 2 + 2 s (≤ 15 s).
  - The reveal: the climb, 大事な語 k / n, the sentence lit (match.ts `align`), the missed words, 聞こえた言葉, the Japanese, `note` else `why`. The results: 「ここまで n語」 and 言えた文 k / n. Row minutes only.

### 2.3 こたえて！ (say the reply)

- **The design:** inside any **reply** round (the quiz's, a unit's lessons; not たいかい or みみ チェック), a 🎤 「声で 答える」 under the choices. Say the reply; a clear match (content-word overlap with a margin over the next) answers **as that tap**; none: 「その 言い方も 通じるかも。選ぶなら？」 with the choices. The answer **is a choice index**, so the session, the wire, co-op and the rows are untouched; the partner sees your choice like a tap and hears you only live.
- **As built (M5):** Play passes `voice` for such a round (one line); frame/ChoiceGrid mounts mic/MicAnswer lazily at the first one with the mic on and keeps it to the game's end (the recogniser readied once, released when it goes; stt.ts imported dynamically). Tap, then tap to stop (or the VAD). match.ts `choose` ≥ 0 answers through `onpick`; −1 shows what was heard with the choices; a miss says why (none, denied, capped, other); a tap on a choice mid-take drops the take. The heard text shows on this phone only until the next round.
- **Not built:** the best guess's 「これ？」 confirm (`choose` has no middle band) and the per-phone 「声で」 / 「タップで」 preference.

### 2.4 はつおん ききわけ (production minimal pairs)

- **The design:** a card of two pictures with kanji labels; **hear both first** (perception before production); the card says which to say; the villager **shows what they heard** (the wrong word is a joke, 「え、 しらみ？！」, never ✗); two tries; the card's `why`. Trains the contrasts Japanese speakers merge: r/l, the hat/hut/hot vowels, b/v, s/th, s/sh, teen/ty, final consonants.
- **Check:** whisper scores the **two candidates** by forced decoding (each word's mean token log-probability given the audio): a two-way intelligibility judgement, not a free transcript. Safari's and the relay give only a transcript, so the mode falls back to matching it ("unsure" when neither word appears) and 「聞いて選んでね」.
- **Co-op 「あてっこ」:** one phone shows A the word; B hears it **live** and taps the picture. No recogniser: a human ear is the best intelligibility judge. The team's 「通じた 6 / 8」, no per-person figure.
- **As built (M6):** games/pair/ (pairs.ts, def.ts pure, lane.ts), components/kikimimi/pair/ (PairPlay, PairResults, SayButton, board.ts), i18n/kiki-pair.*; shelf `koe`, `gate` DEVICE.mic on, `requires: 'mic'`, `coop: true` (あてっこ in the みんなで picker), shown once its chunk exists.
  - **Content:** app/content/mic/pairs.yaml, 36 pairs (r/l 7, b/v 4, th 4, s/sh 1, vowels 8, teen/ty 7, final consonants 5), each a US villager, `ctx`, `why`, two words with a kanji label, a spaced-kana reading, an emoji, an everyday line with its Japanese and a mouth tip; compile.ts writes `parts/mic-pairs.json`; status `voiced`.
  - **Audio:** 72 clips, each word alone (`<pair>-1`, `-2`), 0.4–0.95 s, in their own pack `mic-pairs` (302 KB). Each word the best of ten seed runs by UTMOS among the takes whisper heard as written (PINNED; ECAPA can't judge a word this short); UTMOS 4.00 mean (min 3.28). Flagged for the listening check: "berry" heard "Barry" in every take.
  - **The round:** both words play; solo, the mic with the two words as candidates; the wrong word heard is the joke and the tip, with a second try. Unsure, a failed take or no recogniser: my own tap. あてっこ: role i % 2 speaks (言えた), the other taps; no mic on the listener. Row minutes only.
  - **Measured** (tiny.en q8, WASM, local Chromium, our 72 clips): the candidates 70/72 right, all past the 0.3 margin, ~1.3 s a take (the misses lean to the commoner word: fool → full, thick → sick); the transcript fallback 62 right, 2 wrong, 8 unsure. A silence-prior correction (71/72) over-corrected other takes: not adopted.

### 2.5 ふたりで ロールプレイ (both opt in)

- **The design:** a unit's scene, two of its dialogues chained; each phone gets a **role card**; each turn shows its speaker the line **in Japanese** with the key phrases in English as chips (the whole English faded on easy); the speaker's phone checks the **key phrases** (match.ts `phrases`) and sends the bitmask; the other phone shows ✓ chips, never a transcript. 「お手本」 at the end plays the villagers' version with the karaoke. **Score:** the team's 「ふたりで 9 / 11 フレーズ」, never per person; not in たいかい.
- **Consent:** joining is the consent (no wire field). Before joining, the invitee's phone says 「マイクを使います」 with 参加する / やめる; a phone with the mic off can't join (the invite says so).
- **As built (M7):** games/role/ (scenes.ts, def.ts pure, lane.ts, mode.ts), components/kikimimi/role/ (RoleLobby, RolePlay, RoleMic, RoleResults, MicJoin, board.ts), i18n/kiki-role.*; group `together` (on no shelf: the みんなで picker only), `requires: 'mic'`, `gate` the mic on.
  - **Scenes:** 7, one per wave-1 unit, 8–10 turns, the roles' names and goals in kanji; the scene is the options' third int (`[lv, timer, scene]`), the host's pick in the lobby. cv: the unit's lesson cv, BUILD_V.role and the scene's dialogues.
  - **A turn:** a round with no clip (`play` 0, `quietReveal`), untimed, the reveal `auto`. The speaker's answer is the mask (bits 0–5 the phrases, bit 6 spoken; 「マイクなしで次へ」 always); the other phone acks (255). The results: the phrases from the running totals, ✓ per turn as this phone saw it, お手本 per part.
  - **Not built:** the unit page's じっせん row 「ふたりで ロールプレイ」 (the plan's second entry point).

### 2.6 Placement (kikimimi-ux.md §6.2)

| Shelf | Adds | Shows when |
|---|---|---|
| **声に 出す**（マイクを 使う）, last | まねっこ シャドーイング, くりかえし チャレンジ, はつおん ききわけ | the mic is on (on this phone); each tile when its backend is ready (まねっこ: capture only) |
| (in place) | こたえて！ chip in reply rounds | the mic is on and a recogniser is ready |
| みんなで picker | ロールプレイ, はつおん's あてっこ | the mic is on (the invitee consents at join) |
| せってい › マイク (MicOptIn) | 「マイクを使う」 (off), 「マイクのチェック」, 音声認識 自動 / このiPhone / Safari / サーバー (each with its disclosure), the model's download and 「音声認識データを削除（{mb}MB）」, the probe's row | always |

No hub card; きまぐれ (today.ts) never picks a mic mode (it would surprise people into speaking); the first time 声に 出す shows, one line says the voice stays on this iPhone (or the backend's own line).

---

## 3. Architecture

### 3.1 Files

```
app/src/lib/mic/
  capture.ts, capture.worklet.js   getUserMedia → the voice's context → the worklet; 16 kHz mono; level; stop() releases the track
  vad.ts                           20 ms frames, energy over a following floor + zero-crossing, 300 ms hang
  session.ts                       one take at a time and its ends (§3.7)
  stt.ts                           the Recogniser interface; recogniser() picks and lazily loads a backend
  pick.ts                          the backend choice from DEVICE.mic and what can run here (pure)
  match.ts                         normalise (US contractions and reductions both ways, digits ⇄ words, fillers out), align,
                                   WER, content-word recall, choose (with a margin), phrases (a bitmask), candidate (pure)
  pitch.ts, prosody.ts             YIN f0, the envelope, syllable nuclei, DTW, the comparison → feedback codes (pure)
  models.ts                        the pinned manifest: files, bytes, sha256, parts; ensureStt
  backends/{whisper.ts, whisper.worker.ts, webkit.ts, relay.ts, stub.ts}
  probe/{steps.ts, run.ts, gpu.worker.ts}   M0
app/src/lib/components/kikimimi/mic/   MicProbe, MicOptIn, MicButton (72 px, ring meter), MicAnswer, Contour, sttRound.ts
app/src/lib/kikimimi/games/modes.ts   the mic modes' metas and gates (§3.4)
app/src/lib/kikimimi/games/{mane,kuri,pair,role}/ and components/kikimimi/{mane,kuri,pair,role}/
app/content/mic/pairs.yaml
app/scripts/stt-models.ts   fetch the pinned files (HF, npm), verify, split ≤ 20 MiB, write the manifest; --r2 <bucket> uploads
app/functions/stt/[[path]].ts   /stt/* from R2 once STT_BUCKET is bound, else the static files
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

- The modes see only `Heard` and match.ts: swapping the backend changes no game. `Heard.text` lives in the round's memory only. `cand` exists only on whisper.
- `recogniser(be?)` gives this phone's: the stub under `e2e.stt`; else, mic on, pick.ts's choice from what can run (whisper only once its model is on the phone: a round never downloads; Safari and the relay only when picked by hand). One recogniser and one take at a time (a new take cancels the last); `release()` when the sheet closes.
- `heard` never rejects: a `Heard`, or `{ miss }`: none, aborted, denied, capped (429: 「今日は ここまで」), off (STT_OFF), unpaired, network, timeout, oom, service-not-allowed or other.
- Whisper runs in a dedicated Worker (the sheet stays smooth), on WebGPU, else WASM (one GPU failure keeps it on WASM); a timed-out request terminates the Worker. Its input is the VAD-trimmed take, so silence never reaches the model (no hallucinated "Thank you."). `candidates` runs the encoder once and scores each word by forced decoding.
- The relay backend sends ≤ 10 s of 16 kHz WAV (≤ 340 KB) with a 20 s timeout; cancel aborts it.

### 3.3 The pitch and timing analysis (prosody.ts)

- **Input:** the take's 16 kHz PCM and the reference clip's decoded `AudioBuffer`, resampled once, through the same code.
- **f0:** YIN, 32 ms window, 10 ms hop, 70–400 Hz, threshold 0.15; a 5-point median and octave-jump repair; semitones against each speaker's own median (a male learner and a female villager compare fairly).
- **Envelope and nuclei:** RMS in dB at 10 ms; nuclei are voiced peaks ≥ 2 dB above their dips (de Jong & Wempe). The reference's word starts come from words.json.
- **Alignment:** DTW over [semitone z-score, energy z-score], band ±25 %.
- **Outputs:** rate ratio; lag (session.ts's take start on the voice's clock minus the clip's speech start, less the output latency; **the input latency isn't taken off yet**, as no probe number is stored); range ratio (p90−p10); final direction (the last voiced 300 ms); the 3 loudest nuclei's alignment; extra pauses.
- **Feedback:** outputs → codes → i18n lines. The codes, never the PCM, go to the view.
- **Tests:** vitest on synthetic signals (glides of known f0, pulse trains of known nuclei, a rise against a fall).

### 3.4 Into W2-C2's registry

Each game is a `GameDef` with a lazy view, its deck pure and seeded:

| `gm` | modes | Rounds | Answer (ints, on the device; on the wire only for `role`) | Timing |
|---|---|---|---|---|
| `mane` | solo | 4 lines | none (0) | the clip, then untimed |
| `kuri` | solo | ≤ 8, `next()` adaptive (climb or stop) | `[hit, of, heard]` content words | the clip, then untimed; a take ≤ clip × 2 + 2 s |
| `pair` | solo, coop (あてっこ, `roles: 2`) | 8 cards | the word (solo); the picture tapped (あてっこ) | two tries a card |
| `role` | coop only, `roles: 2` | 8–10 turns | phrase bitmask (bits 0–5, bit 6 spoken) | untimed per turn |

**Grading** is pure over the ints: the device does the hearing and the session sees numbers, so the RoundSession, the wire and the relay are unchanged. Every row is minutes only. W2-C2 gave the mic what it asked: a per-mode `gate()`, the shelf `koe` (声に 出す), and `requires: 'mic'` (the みんなで picker's 「マイクがオフです」). The four metas live in games/modes.ts (round/registry.ts adds them): まねっこ, はつおん and ロールプレイ show while the mic is on (DEVICE.mic); くりかえし also needs a recogniser that can run here (the stub, or anything but Safari's where it's missing). Every mic page gets its recogniser through components/kikimimi/mic/sttRound.ts: stt.ts loaded lazily, `ready()` (the recogniser, or null), `release()` on the page's destroy. **こたえて！** isn't a game: `MicAnswer` inside frame/ChoiceGrid.svelte (§2.3).

### 3.5 The relay endpoint

**`POST /stt`** (relay/src/sttRoute.ts; docs/ops/observability.md):
- **Auth:** the record's key (`keyOwner`); CORS for our origin only; preflight allowed.
- **Body:** `audio/wav`, ≤ 340 KB (10 s at 16 kHz 16-bit), read no further than that (a streamed body is cut off at 413).
- **Call:** `env.AI.run('@cf/openai/whisper-large-v3-turbo', …)`: the audio and language only, never a prompt. **Reply:** `{ text, words? }`, `Cache-Control: no-store`.
- **Never kept:** the body is never written to a Durable Object, R2, KV or the log, nor `console.log`ged.
- **Logs** `stt` with sizes, ms, model and ok only. **Caps:** 300 requests per role per day (`STT_DAY_MAX`; over it 429, 「今日は ここまで」). `STT_OFF = "1"` switches it off.
- **Pending:** the privacy reviewer writes Workers AI's data terms (inputs out of training and storage) into docs/ops. Meanwhile the relay is never 自動, only picked by hand after its disclosure.

### 3.6 CSP, headers, hosting and the service worker

- **CSP:** `connect-src 'self'` covers `/stt/*`; `script-src 'self' 'wasm-unsafe-eval'` covers ort's wasm; `worker-src` falls back to it. **No new origin:** transformers.js's remote models are off, `env.remoteHost` / `localModelPath` / `wasmPaths` point at `/stt/`, and the worker refuses any fetch outside it.
- **Permissions-Policy:** `microphone=(self)`; everything else stays off.
- **Pinned:** whisper-tiny.en q8 @ `2575352d`, onnxruntime-web `1.31.0-dev.20260914-8d85527a0` (package.json overrides; transformers.js 4.3.2 exact, its Node-only deps replaced by an empty package). Every file (the decoder and ort's 25.6 MiB asyncify wasm too) is split into **≤ 20 MiB parts** (`<path>.<sha8>.pN`), listed with bytes and sha256 in `/stt/manifest.json`: **~70 MB** in all. ensureStt fetches what's missing, assembles, checks the sha256 (a bad file is thrown away) and keeps each file whole in `island-stt-v1`. Paths carry the revision: immutable, but manifest.json is revalidated.
- **Hosting, as built:** functions/stt/[[path]].ts serves `/stt/*` from R2 once the Pages project has the bucket bound as `STT_BUCKET`; without it, the request falls through to the static files. **The stopgap, live:** pages.yml's deploy restores the files from an Actions cache keyed on the pins (filled on a miss) into the site's `stt/`, never in git or the artifact, then checks the live `/stt/manifest.json`. **The R2 switch (pending, the user's step shared with W2-R):** enable R2 in the Cloudflare dashboard, create the bucket and bind it as `STT_BUCKET`; then `node scripts/stt-models.ts --r2 <bucket>` and drop the deploy's copy step.
- **The service worker:** caches.ts `isStt` (`/stt/` and `workers/stt.<hash>.js`, named by vite.config.ts's `stt-names` rule) and `STT_CACHE = 'island-stt-v1'`; out of the precache; served **cache-first from STT_CACHE and never stored by the SW** (the page fills it on the download, with progress); せってい's 削除 deletes it. A user who never opts in downloads 0 bytes of it, and a deploy never re-fetches it.
- **Budgets:** load-budget.ts keeps `lib/mic/` and MicProbe out of the first load and the worker ≤ 450 KB gz (136 KB); kikimimi-budget.ts covers the game folders; the model and wasm are not JS and outside the precache by construction.

### 3.7 Audio session and the engine

- sound.svelte.ts `micSession(on)` layers the type: the mic's `play-and-record` over a game's `playback`, the one from before back once both are over, in either order. `audioCtx()` wakes the voice's context, which capture.ts uses: one clock for the clip and the mic.
- Music is held ducked while recording.
- session.ts owns a take: one at a time, ended by stop / cancel, the VAD (done after 1 s quiet), the 15 s cap, 8 s without speech, a new take, `visibilitychange` hidden or `pagehide`; each end releases the track (the orange dot goes off at once). A take that opens after its button is gone is cancelled at once.
- MicOptIn: the switch asks the permission first (refused: off, with where to change it); DEVICE.mic `{ on, be }`.
- 「おとを 1だいに まとめる」 (same room) is unchanged: mic games are solo or role-play, where each phone plays only its own prompts.

### 3.8 Hermetic tests

- **vitest (pure):** pitch, prosody and vad on synthetic signals; match.ts; pick.ts; models.ts (parts, sha check, ensureStt's cache); stt.ts; each GameDef; caches.test `isStt`; relay stt.test (auth, sizes, the cap, a chunked body cut off, nothing kept); log.ts accepting `mic.*` and refusing text.
- **e2e:** the Playwright project **`chromium-mic`** (`kikimimi-mic*.spec.ts`: probe, optin, mane, kuri, reply, pair, role), with Chromium's fake media device on a committed clean clip, `--mute-audio` (**no audio plays on the dev Mac**), no network, and the stub recogniser via `localStorage['e2e.stt']` (DEVICE.sttStub: a JSON list of what it hears, one entry a take; set at all, it's this phone's recogniser and the speech modes show). pick.ts reads it: `stubbed()`, `stubScript()` (the list), `stubNext()` (the next entry, the list rotated: backends/stub.ts, the probe).
- **What the tests don't do:** load whisper, touch WebGPU, or judge the analysis's numbers; only the flow and that feedback appears. The real model was checked once by hand in local Chromium (§2.4). Rendering and the feel are judged on the iOS Simulator and the phones. Pinned date, seeded decks, no sleeps.

---

## 4. Increments

All built 2026-11-07, each green on main; they kept clear of wave 2's files until W2-C2 had landed (the games then took one registry line each, and M5 one Play.svelte line).

| # | Increment | Status |
|---|---|---|
| **M0r** | Relay side: `mic.*` and `stt` in the log registry; `POST /stt` with the AI binding, caps and off switch; the privacy rule in docs | built, deployed first |
| **M0** | The probe (§1.1), `microphone=(self)` | built |
| **M0w** | Whisper for the probe: stt-models.ts, the parts and manifest, `/stt/*` (the R2 Function and the stopgap), the SW's STT cache, `stt-names` | built; on the stopgap until R2 is bound |
| — | **The user runs the probe** on both phones; we read the log and set §1.1's thresholds | **pending, the user** |
| **M1** | Mic core and opt-in: capture, worklet, VAD, session, `micSession` / `audioCtx`, MicOptIn, MicButton, DEVICE.mic | built |
| **M2** | まねっこ シャドーイング | built |
| **M3** | The Recogniser: stt.ts, the webkit, relay and stub backends, whisper general (WebGPU → WASM, candidates), match.ts | built |
| **M4** | くりかえし チャレンジ | built (the span pending) |
| **M5** | こたえて！ | built (「これ？」 and the preference not) |
| **M6** | はつおん ききわけ + あてっこ, the 72 pair clips | built |
| **M7** | ふたりで ロールプレイ | built (the unit page's row not) |

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

1. **The model's home.** **Default:** R2 under `/stt/` (W2-R's bucket). Until you enable R2, the deploy's Actions cache serves the ~70 MB. Never git.
2. **A recogniser off the phone.** **Default:** in-page whisper. Safari's or the relay only if the probe says whisper is too slow or wrong for your voice, and only after its one-line disclosure.
3. **AirPods.** If the probe shows the AirPods mic drops the sound to the hands-free profile, **default:** record with the iPhone's mic while the AirPods play (if `deviceId` allows it). Else shadowing with AirPods becomes まねっこ (repeat after) and wired earphones are recommended.

---

## Sign-off (2026-11-07)

| Reviewer | Verdict | Changes made |
|---|---|---|
| Learning scientist | **Approve with changes** | No pronunciation score anywhere. The target never primes the recogniser. Perception before production in はつおん (hear both, then say). EI's one-second delay, sentences climbing by syllables, a replay disqualifies a climb. The EI span stays device-local and outside みみ チェック until it's checked against a month of placements. Visual contours in まねっこ. Speaking never feeds the listening stats |
| American EFL teacher | **Approve with changes** | Contractions and reductions count both ways (gonna = going to). A reply that matches no choice is 「通じるかも」, never ✗. US voices only. The pair list from the tagged `word` items plus teen/ty and the user's rice/lice. Role-play hints are the unit's key phrases, the lines given in Japanese, not to be read off |
| Game/UX designer | **Approve with changes** | One shelf, 声に 出す, shown only with the mic on. こたえて！ is a chip in place, not a mode. ロールプレイ and あてっこ in the みんなで picker. A 72 px tap-to-talk with a ring meter, auto-stop on silence. Not in きまぐれ. The villager's reactions (spaced kana) and the "what they heard" pictures carry the fun. No meter, no ranking |
| Learner panel | **Approve** | 「一人で イヤホンなら やれる」. The mic never starts on its own. The partner never gets your recordings. No score in まねっこ. あてっこ's wrong picture is funny, not shaming. The download is asked for once with its size. ≤ 2½ min each; role-play ~3 min, only when both want it |
| Senior engineer | **Approve with changes** | `microphone=()` → `(self)` in M0. Every whisper decoder is > 25 MiB, hence parts and R2. The SW precaches hashed chunks by default, hence `stt-names` and `isStt`. Not cross-origin isolated, so WASM is single-threaded: measured, not COEP'd. Capture on the voice's AudioContext for one clock. The session type restored. Whisper in a Worker. No wire or relay change for the games (answers are ints). Asks to W2-C2: `gate()`, the `koe` shelf, `requires: 'mic'`. The relay deploys before M0 |
| Privacy reviewer | **Approve with changes** | The rule in §5, in the docs with M0r. Per-backend disclosure in the opt-in. The relay keeps no audio and no text, logs sizes and times, has a daily cap and an off switch. Rows are minutes only. The log's closed schema makes transcripts unloggable. The probe's spoken samples go to the relay only on its own tap. Workers AI's data terms written into docs/ops (pending) |
