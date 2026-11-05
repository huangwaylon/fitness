# ききみみ クイズ: English listening game (as built, 2026-11-06)

The user asked for a game for several players. It's started from the HUD menu (originally せってい), syncs so everyone starts and plays together, and is for Japanese speakers learning English. It trains **listening** with spoken English sentences, using the Animal Crossing characters and world.

Draft 1 was reviewed by an English teacher (Japanese learners), a game/UX designer and an engineer, and this is the result, kept up to date as the feature's detailed reference: docs/design.md `### ききみみ クイズ` has the summary, docs/backend.md the wire format and docs/decisions.md the choices.

## The game

- **Host and speakers.** しずえ (Isabelle) hosts. Each question is spoken by a villager. Their icon bobs with an NH speech bubble that stays empty (「♪…」) and a thin progress bar the clip's length. The text is never shown before the reveal.
- **Length.** A game is **8 questions** at level 1, 2, 3 or 4 ("Level 4" below).
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
  - しずえ reads them out like the morning broadcast: co-op (the default with several), the team's 「ふたりで n/8」; たいせん, a ranking with reactions ("Co-op and たいせん" below).
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
- **`mean`** (level 4): what the speaker really means, from 3 English paraphrases. The distractors are the literal reading, the opposite and a plausible wrong inference. Its `ask` is 「つまり、どういうこと？」; it renders like `reply`.
- **`gist`** and **`next`** (level 4, dialogues): over a 2-4-line dialogue between two villagers, what's going on or will happen (its own `ask`), and the best next line (「つぎの ひとことは？」). 3 English choices. "Dialogues" below.
- **Later (v2):** level 3 chunk tiles, a shared co-op best, たいせん scored against expectation (curriculum §11: needs per-player stages) (missed items come back through にがて れんしゅう: "Adaptivity" below).

**Mix per 8 questions.** L1: 3 pic, 3 word, 2 num. L2: 2 pic, 2 word, 2 num, 2 reply. L3: 1 pic, 2 word, 2 num, 3 reply. L4: 2 word, 2 num, 2 reply, 2 mean; once the dialogues are voiced, 2 word, 1 num, 1 reply, 2 mean, 1 gist, 1 next.

## Co-op and たいせん (docs/curriculum.md §14, increment 3; built 2026-11-06)

- **Co-op is the default** for a game of several (the user's choice). The results read **「ふたりで n/8」** (3 players: 「さんにんで」): a question counts for the team when **at least one player got it right**. Answers are hidden till the reveal, so nobody can lean on the other; the team covers each other's gaps, which suits two strong listeners with different weak spots, and a miss never costs the team anything the partner caught. Under it, **「そろって せいかい m もん」**: the questions every player in them got right (a player had a question when they answered it or were in the game as its clip began, their `join` heard before it: one who joined later doesn't hold back the ones before, one who let it time out does, on every phone alike; a soft, celebratory count). A player who leaves keeps their answers in both counts. Fair: the same on every phone (from the `join`s and `a`s heard; a lost `a` costs that question's credit on that phone only).
- **Never shame:** in co-op the others' chips show only ✓ (answered), never right or wrong, and no one's points; the reveal says how many got it (「2にん せいかい！」, none: 「むずかしかったね！」), never who. The results have no ranking; each phone shows its own tally (「じぶんは 8もん中 6もん」) and its own review list.
- **「たいせん」** is a lobby switch, set by the host (others see it): the points, the chips' ✓ / × at the reveal and the ranking as before. It rides on the `open`'s **seed's lowest bit** (1: たいせん; a new lobby's seed is even), so no new field and **no relay deploy** (the relay passes known fields only). Flipping it deals a new deck, which nobody has seen yet. A phone from before reads any seed as before (it ranks, as it always did). もういっかい keeps the mode. Expectation scoring (curriculum §11) waits for per-player stages.
- **Level names:** neutral places with ★ counts, never やさしい/むずかしい (curriculum §3): ★ はまべ, ★★ いりえ, ★★★ かわぐち, ★★★★ かわ・もり.
- Built: session.ts `versus(seed)`, `open({vs})`, `configure({vs})`, the view's `vs`, `team {right, all, done}` (over the questions revealed) and `rightNow` (a reveal's count); Lobby's `data-kiki-vs`; Play's `data-kiki-team-now`; Results' `data-kiki-team`. Tests: session.test "co-op and たいせん", e2e kikimimi (co-op and たいせん, two players).

## Dialogues (docs/curriculum.md §14, increment 4; built 2026-11-06)

- **Content.** `dialogues.ts`: 24 dialogues (12 `gist`, 12 `next`), level 4, B1+ → B2, each from a scenario seed (§5.5): café orders going wrong (the wrong milk, a misheard name, a sold-out dish), a cancelled train, a GP receptionist's cancellation list, a friend cancelling, a coworker hinting for the meeting room, a landlord who won't commit, a neighbour's party, a gate change, a gym trainer's correction, a parcel left with the neighbour, store credit, a taxi mishearing Street for Road, "we should grab lunch", a video call breaking up, a friend on a diet saying no, a pharmacist and a long drive, an installer's "between eight and one", a service charge, "I'm easy", a hotel upsell, a bank scam call, a ferry called off. US, UK and AU pairs; reductions in `tts` (lemme, kinda, wanna, 'em), numbers written out.
- **Shape.** An item with `lines: {who, cast, en, ja, tts?}[]` (2-4, two villagers taking turns, each with their cast voice, bank4.ts CAST); `en` the lines joined (the `focus` is in one line), `speaker` / `cast` / `voice` the first line's, `ja` the right choice's Japanese, `note` the trap (≤ 40 字), `tags` as level 4's. The distractors: for `gist` a heard detail misplaced, the literal reading or the opposite; for `next` a repeated word or sound, the wrong role, an answer to what wasn't asked. Skills (tags.ts): `next` うけこたえ, `gist` だいじな ところ (both ほんね when the pragmatic layer is unsaid).
- **Clips: one per line**, `<item>-<n>` (n from 1; bank.ts `clipIds`). The audio script (v2) maps `clipItems(item)` over the bank: an item itself, or each line as an item of its own (its clip id, speaker, cast, `en`, `tts`, `ja`), so castOf, spokenText, the gate and the listen list need no dialogue case; `--list` shows the 84 line clips, and the next run voices them (then the dialogue gate opens by itself). In bank.ts, not clips.ts, so the script doesn't load clips.json. `voiced(item)` and `itemDur(item)`: the lines' lengths plus `LINE_GAP` (0.3 s) between them, which is the item's `dur` in the session's schedule (the host-clock design is unchanged: every phone computes the same summed length from clips.json).
- **Playing** (game.svelte.ts `playSequence`): the lines' buffers decoded first, then each line through `playVoice` at its relay time (`sequenceStarts`: LINE_GAP after the one before; heard late, a line over is skipped and the one under way plays whole from now, never two at once). The reveal's replay, 🔁 and the review's ▶︎ play the whole sequence (no 🐢 at level 4). `talk` follows the turns from the schedule on every phone.
- **UI.** While it plays: both speakers' heads by the empty bubble, the one talking bobbing. At the reveal: the accent and the `note` in the bubble (level 4's other items now show their `note` too), and the two-sided transcript (`Transcript.svelte`): the first speaker's lines left, the other's right (mint), each with its Japanese, the focus marked; a `next` item's answer closes it as a dashed 「つぎの ひとこと」 bubble from whoever's turn it is. The review list shows the transcript compact, a gist's answer under it.
- **The gate.** Dialogues have their own: deck.ts `mixes(clips)` gives level 4 its dialogue mix only once every line of every dialogue has a clip, so level 4's single items and the dialogues can be voiced in either order; until then neither the deck nor にがて れんしゅう (`inMix`) draws them. `playable` checks every clip of the items a level's mix draws.
- Tests: bank.test (24, 12 / 12, two villagers taking turns, cast and gender, Japanese, `tts` rules per line, the focus in one line, clip ids unique), deck.test (the dialogue mix, the gate both ways, clip ids, clipItems, itemDur, sequenceStarts), session.test (a sequence's summed length in the schedule on every phone); e2e kikimimi "dialogues" (a test hook, `__kiki.deck(ids)`, starts a solo game on them before their clips: both heads, the transcript and next line, the review's transcripts).
- As built, the session counts the deck again at `go` (a deck settled in the lobby: にがて れんしゅう's, which had kept the lobby's count and answers).

## Visuals (docs/curriculum.md §8 and §14, increment 5; built 2026-11-06)

- **Backdrops, painted.** 8 scenes (`cafe`, `platform`, `pharmacy`, `office`, `door`, `gate`, `street`, `living`; bank.ts `SCENE_IDS`) in `static/art/scene/<id>{,@2x,@3x}.webp` at the card's 393×224 (1x 4-8 KB, 2x 10-19 KB, 3x 17-32 KB; 332 KB for all 24), each in the art manifest at its 1x size (the card's srcset names the others: scene/stage.ts `sceneArt`, `sceneSrcset`). The prototype's SVG kit gave way to generated paper-gouache backdrops (curriculum §8's optional row), the villagers' official art composited over them by the app; no NH character or Nintendo look is ever generated. `app/scripts/scenes/scenes.ts` (`npm run art:scenes [ids] [--force | --encode]`) paints and encodes them: **Z-Image-Turbo** (Tongyi-MAI, **Apache-2.0**: the outputs are ours to ship), MFlux's Q6 conversion at `~/.cache/island-fund/zimg-q6` (`mflux-generate-z-image-turbo`), 9 steps, 1344×768, **seed 7**, each scene's line plus the shared style from `scripts/scenes/scenes.json` (no people, no text, an empty floor in the lower third), ~25 s a scene on the M5 Max; re-painting gives the same pixels (checked against the prototype's). cwebp q80 cuts 393:224 at three scales. Masters are cached under `app/.cache/scenes/`, not committed. The backdrops hold no text or numbers (the platform's clock time is never asked), so none gives an answer away.
- **Staging** (`kikimimi/staging.ts`, folded into the items by `staged`): `scene?` and `channel?` (`'live' | 'phone' | 'pa' | 'video'`) on items, `marks?` on items and dialogue lines. `PLACES` stages every level-4 item and dialogue: 81 of 91 have a scene (a hotel desk, the gym, a ferry terminal, a repair shop or a customs form have none: the plain stage, or a frame over paper); calls are heard at home unless they're work's. The channel defaults from `tags.conditions` (bank.ts `channelOf`: a call or voicemail a phone, a PA, a video call, else face to face); `PLACES` names it only where the conditions don't. Levels 1-3 stay unstaged (the plain stage).
- **Scene card** (`components/kikimimi/scene/SceneCard.svelte`): for a staged item (a scene, or a non-live channel: stage.ts `isStaged`) it replaces Play's stage from the lead-in until the reveal, 🔁 / 🐢 centred under it. The backdrop (`srcset` at the phone's scale, `decoding="async"`, softened under a paper vignette), its place's name, and the channel: face to face the speakers stand in it full-body on ground shadows, the one talking bobbing under the empty 「♪…」 bubble with the clip's bar (a dialogue's first speaker left, the other right and a little back); `PhoneFrame` (a paper phone over the room blurred, the talker's head and name, 「つうわちゅう」 or 「るすでん」, signal bars, a voice wave while it plays), `PaFrame` (a horn speaker with reverb ripples, 「♪…」 echoed), `VideoFrame` (a 2×2 call grid: the speaker(s) and others to fill it, the talker ringed in yuzu, one muted), all CSS/SVG. One image on screen at a time; reduced motion stills the bob, ripples and wave.
- **At the reveal** (`SoundLine.svelte`, over `marks.ts` `soundLine`): the English (a dialogue's on each transcript line) as words with the focus marked and the sound marks over them: `say` the shape it's said in above a reduced run (Let me → *lemme*, 14 → *fourTEEN*, a dotted line under it), `link` ‿ arcs where words join, `drop` swallowed letters greyed and struck (tryin~~g~~), `stress` ● over a word; `MarkLegend` keys the kinds shown. Marks are authored per clip (`MARKS`, `[kind, at, said?]`, on whole words: `findWords`) for every level-4 item and dialogue line with a `tts` respelling (43 clips). **Karaoke**: while the clip replays (the reveal's own, 🔁, a dialogue's line as `talk` reaches it, the review's ▶︎ for dialogues) the words said are ink, the one being said underlined with a hop, the rest soft; a frame loop runs only while it plays and re-renders only when the word changes.
- **Word timings** (`app/scripts/kikimimi-words.ts`, `npm run audio:kikimimi-words`, run after `audio:kikimimi`): whisper-cli large-v3-turbo hears every normal clip word by word (`-ml 1 -sow`, DTW timestamps; ~45 s for all 295), its words are matched to the shown words by a DP over normalised spellings, and the unmatched are spread between their neighbours by their letters. `src/lib/kikimimi/words.json`: `{clip: [hash, start…, end]}` in centiseconds (19 KB, 8 KB gzipped, in the sheet's chunk), one start per word of `en` (marks.ts `wordSpans`). clips.ts `wordTimes` uses them while the hash is the clip's, else spreads the clip's length over the words (a re-spoken clip falls back until the script runs again). All levels' reveals get the karaoke.
- **Performance.** All of it is in the sheet's lazy chunk (176.6 → 213.0 KB, 63.0 → 75.8 KB gzipped, words.json 8 KB of it; the island's chunks unchanged). The next question's backdrop (and, face to face, its speakers' full-body art) is fetched with its clip (stage.ts `preloadStage`, from game.svelte.ts; the first at the lobby). The service worker caches the backdrops on first use, never at install (caches.ts).
- Tests: staging.test (every scene's three webps, its manifest entry and prompt; every level-4 item staged with a known scene or none and a valid channel, each channel and scene in use; `channelOf`; marks for exactly the tts clips, each on whole words, say runs never overlapping; `soundLine`'s pieces; words.json well-formed for the current clips, `wordTimes` aligned and fallback), usage.test (the backdrops used), caches.test (never precached); e2e `kikimimi-scenes.spec.ts` (8 items through every channel: the card, the backdrop at the phone's scale, the speakers or the frame, one backdrop on screen, no text before the reveal; at the reveal the marks and their key), and `KIKI_SHOTS=1` writes the 393×852 screenshot pass into `/tmp/kikimimi-shots/inc5/`. kikimimi.spec's dialogue test sees the speakers standing in the card.

## Level 4 「かわ・もり」 (docs/curriculum.md §14, increment 1)

- **Content.** `bank4.ts`: 67 items for B1+ → B2 (21 reply, 18 mean, 15 word, 13 num), each cut from a scenario seed of docs/curriculum.md §5.5 (travel, health, phone support and services, home and the landlord, work, plans), with its register, speech conditions and pragmatic layer in `tags`. Real places and money (yen, dollars, pounds), villagers playing adults; natural speed, reductions, indirect replies, self-corrections, understatement, sarcasm. No `pic` (the art is island things).
- **New fields** (level 4): `tts` spells what's said (gonna, lemme, d'you; every number written out, never a digit); `note`, the trap in Japanese (≤ 40 字, for the reveal); `cast`, an abstract voice id (accent, gender, slot: `us-f1` … `au-m2`, 12 core voices, one per villager for good, `CAST`; "Audio"); `tags` `{seed, register, pragmatic, conditions?, features?}`.
- **The gate.** `deck.ts` `LEVELS` (= `playable(CLIPS)`) is the levels a phone offers: those with a mix and a clip for every item. The lobby lists only those, and the last level kept on the phone falls back to 1 if it isn't one. Level 4 was hidden until the neural cast's clips landed (`say` never spoke it); since the v2 clips ("Audio") all four levels are offered (deck.test's tripwire). `deck(seed, lv)` still builds a level-4 deck (tests), and a level with no mix (5) is an empty deck.
- **Not done yet:** collapsing the Japanese at L4 (Play.svelte). (`note` shows at the reveal since increment 4.)

## Content: `app/src/lib/kikimimi/`

- **`bank.ts`**: each item is `{id, lv, type, en, ja, speaker, voice, choices, answer, focus?, ask?, tts?}`.
  - `speaker` is a villager id from roster.ts. Jock villagers say gym lines ("Ten more push-ups!"), since this is a fitness app.
  - Accents: L1 is US only, L2 adds UK, L3 adds AU. `voice` is the item's accent; the voice's gender is the speaker's (roster).
  - `ask` (pic, num) is a short Japanese question shown while the clip plays (「なにが つれた？」): a pic sentence names several of its pictures, so it says what to listen for.
  - `pic` choices are art keys (`critters/squid`, `finds/items/blue-umbrella`, `decor/kettlebell-0`…); `PIC_JA` gives each its Japanese label (VoiceOver, the review list).
  - `word` items' `focus` is the answer as it appears in `en` (the blank before the reveal). `reply` items' `ja` is the question → the right reply.
  - `tts` is what's spoken when it isn't `en` as written (level 4: reductions and numbers, docs/curriculum.md §9).
  - Aim for **≥ 40 items per level in v1**, templates included. Grow towards 80 or more. v1 has 46 / 49 / 49 (144 items).
- **`deck.ts`**: `deck(seed, lv): Item[]` is pure and deterministic. It follows the per-level mix, never puts the same type more than twice in a row, and shuffles the choices by the seed. Every phone builds the same deck from `{seed, lv}`, so no text goes on the wire. The returned items are copies: `choices` is the shuffled order and `answer` the right choice's index in it. Num items from the same template aren't drawn together while the pool allows.
- **`score.ts`**: pure scoring: `points(right, replayed)` (the most a game scores is the protocol's `QUIZ_MAX_S`, 1040; deck.test checks it and `QUIZ_QS` against the deck).
- **`clips.ts`**: `clipUrl(id, slow?)`, the path under audio/ that `loadVoice` takes (`kikimimi/<id>.m4a?v=<hash>`), and `clipDur(id)`, from clips.json.

## Audio

- **Generation (v2, neural).** `app/scripts/kikimimi-audio.ts` (`npm run audio:kikimimi`), with `app/scripts/tts/tts.py` (run in uv venvs under `app/.cache/tts/`, ignored by the repo, or the pythons named by `KIKIMIMI_*_PY` / `KIKIMIMI_TTS_EVAL`). Engine-pluggable (`--engine qwen3`, `voxcpm2`, `kokoro` (US/UK only), per accent `kokoro,au=qwen3`; `say` is the legacy v1 path, levels 1-3 only). The engine is **Qwen3-TTS 1.7B Base** (mlx-audio, `mlx-community/Qwen3-TTS-12Hz-1.7B-Base-bf16`), seeded, cloning each cast voice's reference clip with its exact transcript for every line, so a voice stays the same voice.
  - **One-time setup** (macOS, Apple silicon; checked 2026-11-06 from a clean cache with no `KIKIMIMI_*` env). `brew install uv ffmpeg whisper-cpp` (`whisper-cli`), and whisper's model: `mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-large-v3-turbo.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin` (1.6 GB; `WHISPER_MODEL` names another). Nothing else: the first run makes the venvs with uv under `app/.cache/tts/` (`KIKIMIMI_TTS_CACHE` moves it) from `app/scripts/tts/requirements-{gen,qa,kokoro}.txt` (Python 3.12; gen ~0.5 GB, qa ~1 GB with torch, kokoro only for `--engine kokoro`), and the models download into the Hugging Face cache on first use (Qwen3-TTS 1.7B Base ~4 GB, Kokoro, SpeechBrain's ECAPA into `.cache/tts/ecapa`, UTMOS through `torch.hub` from GitHub). A check before any synthesis names whatever is missing. A smoke test into a scratch dir: `npm run audio:kikimimi -- --only '^p1-cake$' --out /tmp/kiki-pipe-test --force` (~45 s warm), then `npm run audio:kikimimi-words` (only clips whose hash changed; `--force --only <regex>` re-aligns those and keeps the rest). Re-making the AU references (`--refs`, never needed for lines: the refs are committed) also needs the VCTK corpus's wavs named in cast.json under `.cache/tts/vctk/` (or `KIKIMIMI_VCTK_REFS`). `KIKIMIMI_TTS_EVAL=/tmp/tts-eval` (the evaluation's venvs) and the `KIKIMIMI_*_PY` pythons still override the venvs.
  - **The cast** (`app/scripts/tts/cast.json`, 12 voices, US weighted: `us-f1…f3`, `us-m1…m3`, `uk-f1`, `uk-m1`, `uk-m2`, `au-f1`, `au-m1`, `au-m2`; `speech.ts` `SLOTS`). Each entry: accent, gender, source, description, seed, and its reference's transcript, origin and licence. References are committed (`app/scripts/tts/refs/<id>.m4a`, mono AAC 64 kbps, 54-127 KB) and made by `--refs`: US voices designed by Qwen3-TTS **VoiceDesign** from the description (3+ seeds, the best by UTMOS kept: `--refs --design-seeds 7,11,23`), no real person; UK voices spoken by **Phonon 31m** (Apache-2.0) catalogue voices Maeve, Toby and Edwin (synthetic); AU voices from the **VCTK corpus** (p326 and p374, Australian men; p335, a New Zealand woman: the corpus has no Australian woman). VoiceDesign itself never speaks lines (not consistent across clips, and it can't do UK or AU).
  - **Who speaks.** Each villager has one voice (`bank4.ts` `CAST`, levels 1-3's speakers too, at their main accent); a line in another accent takes a voice of that accent and gender by a stable hash of the villager (`speech.ts` `castOf`).
  - **Text.** `speech.ts` `spokenText`: `tts`, else `en` with its numbers written out (`sayNumbers`: "fifteen hundred Bells", "the thirty-first", "two fifteen"; UK and AU say "and").
  - **Processing.** The raw take (cached by source hash and seed under `.cache/tts/raw`: the masters) → edge silence trimmed → a gain to −16 LUFS, a limiter holding −1.5 dBTP → mono AAC 48 kbps 24 kHz. L1's normal clips are slowed to 0.92 (Qwen speaks them at ~205 wpm; v1's `say` was 160) and L1/L2 get `<id>-slow.m4a` at 0.75, both by ffmpeg `atempo` from the same take (in the pilot atempo kept UTMOS; rubberband cost 0.7-1.9). (Curriculum §9 prefers a separate careful take for 🐢; the stretch is the lead's call for now.)
  - **The gate.** whisper-cli large-v3-turbo hears every clip (numbers, contractions and reductions normalised; articles and fillers aside); a content word wrong, or a voice drifting from its reference (SpeechBrain ECAPA cosine < 0.5), re-rolls the take with the next seed, up to 5 times; the best take is kept and anything still failing is flagged for a person. UTMOS (SpeechMOS utmos22) is measured too. `app/scripts/tts/report.json`: every clip's text, cast, seed, takes, what whisper heard, WER, UTMOS, similarity, RTF, wpm and flags, and a summary.
- **Files.**
  - `static/audio/kikimimi/<id>.m4a`, plus `<id>-slow.m4a` for L1 and L2.
  - The script writes `app/src/lib/kikimimi/clips.json` (`{id: {dur, hash, slow?}}`: `slow` is the slow file's hash), which is imported at build time, and `app/scripts/kikimimi-clips.src.json` (`{id: src}`: the hash of the engine, model, cast voice and its reference, the text, the seed and the pipeline version; the script's alone, out of the client bundle). It is **not** under static, because audio is cache-first and never revalidated. URLs carry `?v=<hash>`.
  - It regenerates only the items whose source hash changed (or whose files are missing), and deletes the files of items no longer in the bank. `--out <dir>` writes everything to a scratch dir instead (pilots).
- **Attribution.** The AU voices are derived from the CSTR VCTK Corpus (CC BY 4.0): Yamagishi, Junichi; Veaux, Christophe; MacDonald, Kirsten. (2019). *CSTR VCTK Corpus: English Multi-speaker Corpus for CSTR Voice Cloning Toolkit (version 0.92)*. University of Edinburgh, CSTR. https://doi.org/10.7488/ds/2645. Changes: utterances trimmed, joined, loudness-normalised and resampled into the reference clips, which the TTS clones. The UK references are Phonon 31m output (Apache-2.0); the US ones are VoiceDesign output.
- **Listening check.** A person listens to every clip before it counts as done. The lead and the user do this; the script prints a list to listen through, and `npm run audio:kikimimi -- --listen [--only <regex>]` plays each clip (and its slow one) with its text. (v1, the `say` voices: a machine pass with whisper large-v3-turbo heard 126 of the 144 normal clips word for word; 16 more differ only in how numbers or contractions are written; two were near misses: r2-caught "this" heard as "the", r3-boxes "boxes" as "boxers" in Daniel's UK voice. The content review (docs/reviews/2026-11-05-kikimimi-content.md) rewrote both ("that sea bass", "this box"); whisper hears every rewritten clip word for word.)
- **Engine additions** (sound/engine.ts and sound.svelte.ts):
  - a `voice` bus. Its level follows the master volume only, not the 効果音/ミュージック toggles;
  - `loadClip(path)`, which returns an `AudioBuffer` or null;
  - `playClip(buf, {at?})`, which returns `{stop(), endsAt}`. It ducks the music (duckPlan), is tracked as live, and keeps the context awake;
  - `holdAwake(on)`;
  - `voiceSession(on)`, called **inside a tap** (さんか / はじめる / あそぶ). It creates and unlocks the context even when sound is set silent, holds it awake, and sets `navigator.audioSession.type = 'playback'` so it plays with the silent switch on. Leaving the game restores it;
  - `playVoice(buf, {relayAt?})`, which converts relay time with `ctx.currentTime + (relayAt − serverNow())/1000`.
  - Decoded buffers are kept in an LRU of 4.
  - Built: `voiceSession(on): boolean`, `voice: {on, state}` (the card shows while `on` and `state !== 'running'`; its tap calls `voiceSession(true)`), `loadVoice('kikimimi/<id>.m4a?v=<hash>')`, `playVoice(buf, {relayAt?, now?})` → `{stop(), endsAt}` (audio clock) or null. A `relayAt` already past plays the clip whole from now. At 音量 0 the voice is silent too.
- **Fetching.** The lobby fetches the deck's clips as bytes (8 clips, a level-4 deck's dialogues 3-4 lines each, ~18 KB a clip) and decodes them just in time; the next question's first clip is decoded while one plays.
- **Caching.** The service worker's audio cache gets a `kiki` class, KEEP 40 (any one game: levels 1-2's 8 clips and 8 slow ones, a にがて れんしゅう deck of 8 dialogues 32 at worst), so quiz clips don't push the game's effects out. A played clip replays offline. Clips are not precached.
- **The lobby** has a 🔊 「きこえる？」 test.
- **After a lock or app switch,** the context is suspended. A 「タップして つづける」 card (しずえ) resumes it.

## Sync: one new presence-only intent

`{kind:'quiz', g, op, …}` needs a `case 'quiz'` in `intentOf` (contract/live-protocol.ts) and `'quiz'` in `guestMaySend`. The relay's routing is unchanged: the intent is unstored and unacked, and goes to all others. That contract file is bundled into the Worker, so the relay deploys first (relay.yml on push to main). Client messages are ≤ 210 bytes, since the relay adds about 35 bytes and 256 is the cap.

| op | sender | fields | meaning |
|---|---|---|---|
| `open` | host | `g, seed, lv, same` | a lobby is open to the others (sent on みんなを さそう, never for a lobby kept alone); they see an invite banner (TTL: dropped if the host leaves or after 10 min). The seed's lowest bit is たいせん |
| `join` / `leave` | anyone | `g` | joining or leaving the lobby or game |
| `go` | host | `g, at` | the game starts at relay time `at` (now + 4 s) |
| `a` | player | `g, i, k, rp, s` | the answer to question i: choice k, `rp` whether it replayed, `s` the sender's running total |
| `skip` | host | `g, i, at` | the host's position: question i starts at `at` (i = 8: the results). Sent when it changes (everyone answered, つぎへ, the next question on the schedule) and every 3 s while a game runs (the beacon) |
| `end` | host | `g` | the game is cancelled |

Field validation:
- `g`: `/^[a-z0-9]{4,8}$/`
- `lv`: 1-5 (4 かわ・もり; 5 room for the next level without a relay deploy; a phone offers only the levels it has every clip of)
- `i`: 0-7 (`a`), 0-8 (`skip`; 8 is the end, added 2026-11-05: the relay must be deployed for it)
- `k`: 0-3
- `s`: 0-1040
- `seed`: a 32-bit unsigned int

**The host is the clock** (2026-11-05, after a review reproduced drift with two sessions on one clock).
- Every phone has the deck and each clip's `dur`. So from `go.at` it computes every question's start on its own: the lead (1.5 s) + `dur` + the answer window (15 s) + the reveal (8 s).
- The host's `skip` is its position: question i starts at `at`. The host sends it as it changes (its reveal ending early: everyone answered, or つぎへ; the end after the last question, i = 8) and every 3 s while a game runs. Every other phone **adopts** it, even for a question already under way there or one it got past by itself (it goes back). Starts never decrease: a start fixed sooner than the schedule had cuts the questions before it short, and the phone shows the last question started, never an old one.
- A lost `skip` costs at most one beacon (3 s), not the rest of the game. A lost `a` is corrected by the next `s`.
- Players only move on by themselves when the host has really gone: its `leave`, or its presence gone for 15 s (`hostGrace`). Then each phone moves on once everyone left has answered (the next question at its reveal's end, nothing sent), and the game finishes. A host back after that is adopted again. A phone whose own socket is down ignores presence (who's here is unknown, nobody counts as gone).

**Late messages.** The host's times are kept as sent. A question whose clip began more than 5 s before its start was heard (a late `go`, a lock, a join mid-game) is sat out (`out`, not answerable); one heard sooner is played (its clip whole from then) on the host's answer window.

**Re-sends.** When someone's presence comes back (and to everyone when this phone's own socket comes back) the host re-sends `open`, and once the game has started `go` plus its position; a player re-sends `join`. So a phone back from a lock rejoins the host's clock at once.

**The client state machine.** `kikimimi/session.ts` is pure. It folds intents and the clock into `{phase: idle|lobby|countdown|lead|play|answer|reveal|results, players, answers, scores, i}`. It's unit-tested with fake time and covers: lost `a`/`skip`, the beacon, the host gone (left, or away past the grace) and locked (no racing ahead, adopted when back), my own short disconnect, a stale `open`, a late `go`, a phone back from a lock (the host's question, sat out, never an old one), the end broadcast. The Svelte UI only renders it.
- Built: `new QuizSession({me, deckOf, windows?})`, `deckOf(seed, lv)` → `{count, dur(i) (ms), answer(i)}` (the deck's interface, not the bank). In: `receive(m, now)`, `presence(here | null, now)`, `tick(now)` (the host's beacon; a player's moving on with the host gone). Taps: `open({lv, same}, now)` (on this phone only), `invite` (みんなを さそう: the `open`), `configure`, `join`, `leave` (the host's lobby: `end`; a game going goes on), `go`, `answer(k, rp, now)`, `next` (つぎへ), `close`. Each returns the intents to send; `now` is the relay's clock. `view(now)` gives `{phase, i, n, from, until, playAt, playEnd, limit, out, local, players, answers, had, scores, speaks, canNext, invite, notice}`. `quizLink(live)` (here: null while disconnected) and `wireQuiz(session, link, changed)` (`act`, `tick`) do the wiring; game.svelte.ts wakes at least every 3 s. `WINDOWS` / `FAST_WINDOWS` (`?kikimimi=fast`, on every phone: a 1.5 s reveal; the answer window 8 s, as a tab behind is throttled).
- As built: a lobby whose host has been away 15 s is dropped (a moment's reconnect keeps it). The host's skip on everyone answered is `at` = its reveal's start + 8 s, sent as the reveal starts; after the last question it's i = 8, the results on every phone, as is つぎへ on the last reveal. Players re-send `join` when someone comes back too, so a phone back from a lock knows who to wait for. A lobby kept alone and its game send nothing at all.
- Scoring in おなじへや: no first-listen bonus for anyone (only the host's phone can replay), so 100 a right answer.

**The demo relay.** The banner and the sheet reuse the island's existing Live (`relay ?? demoRelay`, IslandScene). They never create a second one: a second local live sends its own hi/bye.

## UI

- **Starting a game.** The HUD menu's pill 「えいご ききとり」 (しずえ's head, right above せってい; moved out of せってい 2026-11-05 at the user's request) opens it; the voice session begins in the pill's tap itself (`wakeQuizVoice`), the sheet after the press beat. While someone's invite is live (invite.svelte.ts `invitedNow()`) the pill says 「さそわれています！」 under its name and the folded leaf has a coral dot. It opens `components/kikimimi/KikimimiSheet.svelte`, a lazy chunk (`lazy(() => import(...))`, as Hud's sheets do; a chunk that fails to load leaves it closed and ends the voice session).
- **The lobby** opens on this phone alone (nothing sent): the level, 🔊 「きこえる？」 (full width), and 「ひとりで はじめる」 (primary) over 「みんなを さそう」. さそう sends the `open`; then who's here and who joined, 「おなじ へやで あそぶ」 (its sub-label only when on), and 「はじめる（Nにん）」.
- **The invite banner** is a tiny always-loaded listener on the shared Live. It shows 「ウェイが ききとりクイズに さそっています」 [さんか], through the existing toast/banner host.
- **Mid-game,** a backdrop tap or Esc doesn't close the sheet. ✕ asks 「やめる？」.
- **Look.** The paper theme with `ui/Sheet.svelte`, villager art via `villagerArt()`, critters, fruit and items via the art manifest.
  - Taps are ≥ 44 px with `data-sfx`, plus the right/wrong cues.
  - Reduced motion is honoured.
  - `pic` choices have Japanese labels for VoiceOver, so the English isn't given away.
- **Strings** are an `addCatalog` chunk (ja + en).

- **Built (phase 2):**
  - `components/kikimimi/KikimimiHost.svelte` + `invite.svelte.ts` (always loaded): `quiz` {mounted, open, join}, `openQuiz(join?)` (calls `voiceSession(true)` in the tap), `listenQuiz(live, invited, ended)` keeping the last 10 min of quiz intents (`heardQuiz()`, replayed into the sheet's session as it opens), the banner via `toasts.show(…, {person, low, action: さんか})`, dropped when the host ends or leaves that lobby. Mounted in IslandScene with `relay ?? demoRelay`; `quiz.open` covers the island (its 3D engine paused).
  - `KikimimiSheet.svelte` (lazy, `Sheet` variant `pop`): from the menu a lobby of mine at once unless an invite is waiting (then the invite and 「じぶんで はじめる」); the level last played is kept (`DEVICE.kikimimiLv`). `Lobby.svelte`, `Play.svelte`, `Results.svelte`, `PlayerChip.svelte`; `game.svelte.ts` (the session wired to the Live, the deck adapter, clip scheduling and prefetch, cues `quiz-pop` / `quiz-right` / `quiz-wrong` / `quiz-end`).
  - `Sheet.svelte` gained `ondismiss` (false keeps it open: the game's 「やめる？」).
  - おなじへや: 🔁 / 🐢 play only on the phone that speaks (the host's); the others show them disabled with 「ホストの スマホで ながれます」 (game.svelte.ts `listenOnly`) and hear the host's replays.
  - Notices: 「ホストが ゲームを とじました」 (cancelled), 「ホストが いなくなりました」, 「じかんが たったので おわりました」 (stale).
  - e2e: `app/e2e/kikimimi.spec.ts` (solo, やめる？, two players from the banner to both results).
- **Polish (phase 3, game/UX review):**
  - Play: 🔁 / 🐢 sit in a small row under the bubble (on おなじへや's other phones shown off, 「ホストの スマホで ながれます」); the foot holds only the host's つぎへ. The question takes the scroller's room with its content centred (no gap under it on a tall phone); choices `clamp(56px, 8vh, 72px)` tall. An item without `ask` gets its type's: word 「きこえた ことばは？」, reply 「なんて こたえる？」.
  - Reveal: 「せいかい！ +100」 and a 「いっぱつ せいかい！ +30」 pill apart; a missed picture names the right one (「こたえ: イカ」, PIC_JA); a reply's Japanese on two lines (the question, then 「→ the reply」: bank.ts `jaLines`); しずえ's head with a word per verdict under the choices; 「よく きいてね！ よーい…」 at the 3-2-1.
  - Results: 「8もん中 6もん せいかい」 under しずえ's line; the winner's row a yuzu ribbon with 🏆; a missed row shows 「えらんだ: … ×」 under the right answer; 「もういっかい あそぶ」.
  - bank.ts `splitFocus(item)` → [before, focus, after], shared by Play and Results. theme.css `.level-acts::after` covers the scroller's bottom padding, so rows scrolling under a sheet's sticky buttons don't show again below them.

## Progress & feedback (built 2026-11-05)

The user asked for "a mechanic for progress and improvement and learning tracking; recommendations and feedback on what to study and focus on". Both learners are B1+ (TOEIC 700+, listening already good), so the point is **which sounds and skills still trip you**, not a score. Decided defaults: each person's detailed results are theirs alone; only shared summaries reach the partner; co-op by default (no level next to the other's: docs/curriculum.md §11).

### What's measured (per person)

- **Every answer:** the item, right or not, the choice picked (the authored index, so distractors still diagnose: an L/R miss vs a vowel miss), first listen or not and the number of replays (🔁 and 🐢 alike), the game's level and whether it was にがて れんしゅう.
- **Sub-skills** (the bars). Each item has a primary skill (its type, or its first feature for `word`) and secondary ones (its other features, at half weight):

  | skill | label | from |
  |---|---|---|
  | `lr` | L と R | feature `l-r` |
  | `vowel` | にた ぼいん | `vowel` (hat/hut, ship/sheep) |
  | `cons` | にた しいん | `b-v`, `th`, `sh-s`, `f-h`, `ending` (cats/cat); a `word` item with no feature |
  | `reduce` | つながる おと | `contraction`, `weak-form`, `flap`, `yod`, `gonna` … `kinda`, `can-cant`, `t-glottal`, `ellipsis` |
  | `num` | すうじ | type `num`; `numbers`, `teen-ty`, `clock`, `self-repair` |
  | `detail` | だいじな ところ | type `pic` (the right word among others heard); `contrast`, `katakana` |
  | `reply` | うけこたえ | type `reply` with a literal or formulaic pragmatic layer; `idiom` |
  | `indirect` | ほんね | type `mean`; a `reply` whose pragmatic layer is indirect, a refusal, a hedge, understatement, sarcasm, humour, attitude or deception; `intonation` |

- **Tags.** Level 4 has `tags` already (bank4.ts). Levels 1-3 get a compact table keyed by item id (`kikimimi/tags.ts`: features plus, for replies, a pragmatic layer), with the same vocabulary plus S0's segmentals (curriculum §3): `l-r`, `vowel`, `b-v`, `th`, `sh-s`, `f-h`, `ending`, `katakana`, `contrast`, `clock`. bank.test checks every item has tags and every tag maps to a skill.
- **Mastery** of a skill (0-1): a recency-weighted (half-life 21 days), smoothed (prior 0.7 × 2 answers) mean of answer scores, **first listen right = 1, right after a replay = 0.6, wrong = 0** (curriculum §10: a first-play correct answer counts more). Shown from 3 answers (else 「まだ」).
- **Also per type, per accent (US / UK / AU) and per level:** plain accuracy and first-listen accuracy, with counts.
- **The level estimate:** an Elo-style ability θ (curriculum §10: updates go to the learner, never the items). An item's difficulty is its level (L1 −1, L2 0, L3 1, L4 2) plus a type offset (pic −0.3, reply +0.2, gist and next +0.3, mean +0.4); after each answer θ += K × (score − expected), K 0.3 for the first 24 answers, then 0.15. The **comfortable level** is where θ predicts 80 % (θ − ln 4, on the levels' scale), capped at the hardest level played + 0.5, and shown as the curriculum's stage: below L2.5 S0 はまべ ★ (A2-B1), below L3.5 S1 かわ ★★ (B1+), below L4.5 S2 もり ★★★ (B2), else S3 やま ★★★★ (B2+). 「はかっている とちゅう」 until 16 answers.
- **Trend:** first-listen accuracy per game, the last 12 games (a sparkline), and the last 5 games' against the 5 before.
- **Consistency, never a streak:** the days played this Tokyo week (Monday first), 7 dots. A missed day costs nothing.

### Storage: one `listen` row per person per game

- **The row** (docs/backend.md "Events", `contract/listen.ts`): `listen {d, g, lv, n, ms, p?, r}`. `d` the Tokyo day; `g` the game id (the session's, `[a-z0-9]{4,12}`); `lv` 1-5; `n` the players 1-3; `ms` the game's length (0-1 h); `p: 1` にがて れんしゅう; `r` 1-12 answers `[id, ok, pick, rp]` (`id` an item id, `ok` 0/1, `pick` the authored choice index or −1 timed out, `rp` replays 0-99). Only the questions I had (the session view's `had`: answered, or its clip began after I came in), so those before a mid-game join or slept through in a lock aren't in it, never counted as misses (progress.ts `listenAnswers`). ~200 bytes.
- **Why per game, not per day** (curriculum §12 proposed a day slot): a game is written once, at its results, with its own event id, so a retry is a duplicate and two phones of one person never overwrite each other's day; no slot and no merge on the record. A game left and joined again (the sheet closed and opened) writes a second row with the same `g`: the fold (progress.ts `gamesOf`) makes them one game, each answer once (the first kept), the minutes summed; the partner's summaries by `g` alike. ~3 games a day × 2 people is ~2,000 rows (~400 KB) a year. Never compacted (the record never compacts events).
- **Who sees it** (`contract/guest.ts rowsFor`, server-enforced, in every snapshot and delta): its owner the whole row; the other member only the summary `{d, g, n, ms}` (that a game was played, when, how long, with how many: the couple summary; never the level, the answers or the score); the guest's rows reach only the guest, and the members' never reach the guest. The guest writes its own (`guestMayWrite`).
- **Relay change:** a new event type is refused by an older relay (`bad_request`), so the relay deploys before a phone sends one. An app from before it ignores the rows (`EVENT_TYPES`).
- **Offline:** the row goes through the write queue like every event (kept in localStorage until acked) and shows at once (the optimistic view); the snapshot cache keeps the acked ones. The phone also keeps its own copy of my last 300 games (`DEVICE.kikimimiGames`, `components/kikimimi/progress.svelte.ts`), so きろく has a game even when the record refused it (a relay from before the row: dropped without the save-failed toast, store/live.ts); the record's rows win by game id. Everything below is folded from the rows on the phone, never stored: the SRS state too (curriculum §12).

### Adaptivity: spaced repetition and にがて れんしゅう

- **The shared deck stays deterministic** (`deck(seed, lv)`): every multiplayer game and the normal solo game are as before. Personal adaptivity is solo only.
- **Cards** (curriculum §10: a chunk or a feature, never a clip): an **item card** for each item missed or answered only after a replay (in any game, multiplayer too: the per-player review set), and a **feature card** for each feature answered. Leitner boxes 0-6 with intervals 0 / 1 / 3 / 7 / 16 / 35 / 90 days: right on the first listen = good (up a box), right after a replay = hard (the box kept, at least 1), wrong = again (box 0, due at once). Folded from the answers in time order (`kikimimi/srs.ts`), deterministic, never stored.
- **「にがて れんしゅう」** (a solo mode, the lobby's): 8 questions from the levels this phone offers: due item cards first (most overdue, lowest box; at most 4), then items carrying the weakest due features (a different item from the one missed when there is one: another clip of the feature), then the weakest skills' items, never the same item twice. A recommendation's tap narrows it to one skill or one accent. Choices shuffled by the seed. Nothing on the wire (a lobby kept alone sends nothing); the session runs it as any solo game (`deckOf` returns the practice deck).

### Recommendations and feedback (`kikimimi/advice.ts`, pure)

- **「つぎは これを れんしゅう しよう」** (at most 3, each with a one-tap start):
  1. due cards ≥ 4: 「おさらい」 (にがて れんしゅう, every skill);
  2. the weakest skills with enough data (mastery < 0.75, or the lowest one below 0.85): 「{skill} を れんしゅう」 (にがて れんしゅう of that skill);
  3. a level nudge: the last 3 games at the current level ≥ 85 % right and a higher level offered: 「レベル N に ちょうせん」 (that level's game); ≤ 50 %: 「にがて れんしゅう」 before moving on;
  4. an accent ≥ 15 points below the others (≥ 6 answers each): 「{accent} の えいごに なれよう」 (にがて れんしゅう of that accent only);
  5. a skill the levels offered haven't measured (< 3 answers): 「{skill} を ためそう」 (last: at most 3 are shown, in this order).
- **しずえ's line after each game** (the results): the skill whose mastery rose most with this game (≥ +0.05): 「{skill}が のびてるよ！」, then the first recommendation: 「つぎは {skill}！」; all right: 「ぜんもん せいかい！ すごい！」; nothing yet: an encouragement.
- **Per-game feedback** (the results): 「つまずいた ところ」, chips of this game's missed features and skills with their counts (「L と R ×2」, 「-teen / -ty」), and each missed review row's feature label.

### UI

- **The lobby** gets two tabs: 「あそぶ」 (as now, plus 「🎯 にがて れんしゅう」 under ひとりで はじめる; with no games yet it draws a spread of skills) and 「きろく」.
- **「きろく」** (`Progress.svelte`, its own lazy chunk inside the sheet's): the stage and its bar (the comfortable level within it); the sub-skills as horizontal bars (mastery, one hue, the value at the bar's end, unmeasured shown as an outline: bars, not a radar, read better at 8 skills on a phone); the trend sparkline with its last value; the week's 7 dots; the recommendations with their start buttons; the couple summary 「ふたりで こんしゅう: いっしょに Nかい · Mふん」 (games both played, by `g`, and both people's minutes; never a level); details (per type, per accent, per level) folded under 「くわしく」. The guest sees its own きろく and no couple summary.
- **Results:** しずえ's line from the feedback, 「つまずいた ところ」 chips above the review list.
- **Built (2026-11-05):** `Progress.svelte` (lazy, `{#await import()}` in the sheet), `progress.svelte.ts` (`recordGame`, the phone's copy, `currentReport`, `recWords`), the tabs in KikimimiSheet; Results' feedback card (`data-kiki-feedback`, `data-trip`) and each missed row's feature labels. The bars and sparkline follow the dataviz rules (one series, one hue, labelled directly, no legend; bars 12 px with a 4 px data end; the line 2 px with an 8 px end dot): day `#3E9E4C` (passes the palette checks on the cream card), night `--c-leaf` (≥ 3:1 on the navy card), the track a light step of the same leaf. Demo rows: 5 of A's games, 2 with B (store/demo/rows.ts). e2e: `e2e/kikimimi-progress.spec.ts` (`KIKI_SHOTS=1` writes /tmp/kikimimi-shots/progress/).
- **The paper style** of the sheets (cards, lips, the AC palette: leaf for the bars, coral only for "missed"); tap targets ≥ 44 px; reduced motion honoured.

### Tests

- vitest: the stats (mastery, the estimate, trend, week dots, couple summary), the SRS fold and the practice deck (determinism, due first, no repeats, a focus), the advice rules, the row's validation (`contract/listen.ts`), the tag table's coverage; relay: the row accepted and refused, owner-only rows, the summary to the partner, nothing between the guest and the members.
- e2e (logic tier): a solo game in `?demo`, then きろく shows the game, the bars and a recommendation whose start opens にがて れんしゅう.

## Performance

- Nothing heavy loads before the sheet opens. The banner listener is a few hundred bytes.
- The art is the existing webp files, loaded lazily, plus level 4's painted scene backdrops (art/scene/, cached on first use). The island's render loop is idle under the sheet, as with other sheets.
- The deck's clips are fetched into the service worker's `kiki` audio cache (it outlives the sheet; nothing of the bytes is held in memory); in memory only an LRU of 4 decoded buffers (engine.ts `CLIP_CAP`), cleared when the game closes (`voiceSession(false)` → `clearVoice`). Measured 2026-11-06: the island's first load carries ~4 KB of ききみみ (the invite listener and host, the `listen` contract, the HUD pill, 4 strings, the cues; ~2 KB gzipped); the sheet's lazy chunk is 213 KB (75.8 KB gzipped: clips.json 13.6 KB / 4.7 KB, words.json 17.7 KB / 7.9 KB of it), きろく's 8 KB. During play nothing renders per frame but the karaoke (a frame loop only while a clip replays, re-rendering only when the word changes); the bars, the timer, the bob and the waves are CSS animations; the view refreshes at each phase's end (at least every 3 s).

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

## History

Built in three phases, all on main by 2026-11-05: content and audio, the protocol and session, and the engine's voice in parallel; then the UI (the HUD pill, the banner, the wiring, e2e); then reviews and fixes (English content with a listen-through, UX on the iOS Simulator, perf). Increments 1 and 3-5 of docs/curriculum.md §14 followed on 2026-11-06 (level 4, co-op and たいせん, dialogues, visuals), with the neural cast (increment 2's voices; its careful takes for S0 not made: 🐢 is an atempo stretch).
