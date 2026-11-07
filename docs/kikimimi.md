# ききみみ クイズ: English listening game (as built, 2026-11-07)

The user asked for a game for several players, started from the HUD menu, synced so everyone plays together, for Japanese speakers learning English: it trains **listening** with spoken English, using the Animal Crossing characters and world. Reviewed by an English teacher, a game/UX designer and an engineer; this file is the feature's detailed reference for the quiz and its engine. docs/design.md `### ききみみ クイズ` has the summary, docs/backend.md the wire and the caches, docs/decisions.md the choices. The other ききみみ docs: kikimimi-framework.md (RoundSession, `play`, packs, the listening games), kikimimi-ux.md (the hub and progression), kikimimi-mic.md (speaking), curriculum.md, curriculum-units.md and curriculum-wave2.md (what is taught and the content).

**Pending (2026-11-07):**
- **R2 (W2-R).** The packs are 89.3 MiB (games) + 21.4 MiB (stories) on Pages. bank.test's lines (92 and 23 MiB) were raised per audio batch as a stopgap; the fix is the packs on R2 behind a same-origin `PACK_BASE` (not in the code yet). It needs **the user to enable R2 in the Cloudflare dashboard** (a bucket and a token): curriculum-wave2.md §5 question 3.
- **The phone mic probe.** The user runs せってい's 「マイク診断（テスト）」 on both phones; its thresholds are tuned from the logs after (kikimimi-mic.md §1.1, §4).
- **The listening check.** Clips the gate flagged wait for the user's ear: one list in curriculum-wave2.md §4.1.
- **`QUIZ_ON_PLAY`** (round/wire.ts) is off: the quiz and スピード はしご still go out as `quiz` so phones from before 8b play along. Turn it on once both phones run an 8c build ("Sync").

## The game

- **Host and speakers.** しずえ (Isabelle) hosts. Each question is spoken by a villager: their icon bobs with an empty NH speech bubble (「♪…」) and a thin progress bar the clip's length. The text is never shown before the reveal.
- **Length.** A game is **8 questions**: a level (1-4, 6 やま, 7 ほし), level 5 (the アナウンス pack), or two スピード はしご ladders of 4 rungs.
- **Countdown.** 「よーい」 then 3-2-1 once, at the start (4 s). Each question then has a ~1.5 s lead-in: the villager pops in with a chime.
- **Answering.**
  - The choices show dimmed while the clip plays and unlock when its first play ends. One tap, final.
  - The time limit runs from the end of the first play: the lobby's **「こたえる じかん」**, 20 / **30** (default) / 60 びょう or なし (untimed: the question waits for everyone joined and here; solo, for you). The host sets it; each phone remembers its last (`DEVICE.kikimimiTimer`); it rides on the `open`'s seed (bits 2-3, "Sync"). Raised from 15 s at the user's request (2026-11-06).
  - 🔁 replay as often as you like. 🐢 slow at levels 1 and 2 only (slowed TTS undoes level 3's reductions).
- **Showing who answered.** Each player's chip gets a ✓ when they answer, never what they chose.
- **Reveal.** Once everyone joined has answered, or at the limit. It is **untimed** (the user: "i want time to read"): it stays until the host taps つぎへ (solo: you). The others tap **「よみおわった」** (📖 on their chip); the host's button counts them (「つぎへ（よみおわった 1/2）」) but can always go on. With the host gone ("Sync") everyone gets つぎへ. It shows ○ on the right choice and × on a wrong pick (colour is never the only signal); the English at ≥ 17 px with the key word (`focus`) marked, played once automatically; the Japanese and the voice's accent; the speaker's and the chips' reactions (✨ / 💦).
- **Scoring.** Right is **100**, wrong or timed out 0. No speed bonus (it rewarded guessing) and no first-listen bonus (the user, 2026-11-06, curriculum §7.1): **「いっぱつ！」**, right with no replay or slow play, is a stamp on the reveal, the review and the results' count, never points. おなじへや never gives it (only the host's phone can replay). The wire's `s` bound stays 1040 for older phones.
- **Results.** しずえ reads them out like the morning broadcast: co-op (the default with several) 「ふたりで n/8」; たいせん a ranking. Then the **review list**, the main learning moment: with any misses it **opens on them** (「まちがえた だけ」, the first missed row open). A row folds open to the English with its sound marks and karaoke, the marks' key, the Japanese, the answer, the `note`, the skills it tripped, my pick, ▶︎ and 🐢 (L1/L2). **「まちがえた もんだいを もういちど」** replays just the misses solo (nothing on the wire), untimed, recorded as practice (`p: 1`) so they feed the SRS.
- **Solo** is the same game with one player. **Who:** A, B and the guest (G) can all host and join. No ベル or economy tie.
- **「おなじへや」.** A lobby toggle: only the host's phone speaks (three phones slightly out of sync sound like a chorus). Without it, earphones are suggested.
- **No Animalese** before or over the English.

## Question types (v1)

- **`pic`**: tap the picture you heard, from 4 NH art choices. Known words or katakana traps (banana, museum, tarantula, vitamin); the sentence carries the test, and the distractors are heard in it too or sound close ("I didn't catch a tuna, but I got a squid!" → squid).
- **`word`**: the sentence with a blank; pick the word heard from **3 near-sound choices**, each of which fits the sentence. L/R (light/right, fly/fry, collect/correct), vowels (hat/hut/hot, cap/cup, full/fool), others (berry/very, sink/think, walk/work, can/can't by vowel and stress, walked, cats, fifteen/fifty). Each pair checked in American English.
- **`num`**: prices in ベル, times and dates as text with close distractors (2:15 / 2:50, quarter past / to, 1,500 / 15,000, the 13th / 30th), from **templates** (speaker × phrase × number).
- **`reply`**: pick the best of 3 written replies to a question (TOEIC Part 2). Levels 2 and up.
- **`mean`**: what the speaker really means, from 3 English paraphrases (the literal reading, the opposite, a plausible wrong inference); 「つまり、どういうこと？」.
- **`gist`** and **`next`**: over a 2-4-line dialogue (or, at ほし and in the pack, a single bulletin), what's going on, or the best next line (「つぎの ひとことは？」). "Dialogues".
- **Not built:** a shared co-op best and たいせん scored against expectation (curriculum §11: it needs per-player stages). Level 3 chunk tiles became ことば タイル (kikimimi-framework.md, W2-1).

**Mix per 8 questions** (mix.ts): L1 3 pic, 3 word, 2 num. L2 2 pic, 2 word, 2 num, 2 reply. L3 1 pic, 2 word, 2 num, 3 reply. L4 2 word, 1 num, 1 reply, 2 mean, 1 gist, 1 next (2 word, 2 num, 2 reply, 2 mean while any level-4 dialogue lacks a clip). L5 3 num, 2 gist, 2 mean, 1 reply. L6 2 reply, 2 mean, 1 gist, 1 next, 1 word, 1 num. L7 2 mean, 2 gist, 1 next, 1 reply, 1 word, 1 num.

## Content: `app/src/lib/kikimimi/`

- **Items** (`bank.ts` the shape: `{id, lv, type, en, ja, speaker, voice, choices, answer, focus?, ask?, tts?, …}`), authored in `bank1.ts` (levels 1-3), `bank4.ts` and `dialogues.ts` (4), `bank5.ts` (5) and `content/` (the sets below), all gathered in `source.ts` `BANK`: the compiler's, the audio scripts' and the tests' input, never the app's ("Loading").
  - `speaker` a villager (roster.ts; jocks say gym lines). `voice` the item's accent: US everywhere (the user, 2026-11-06: curriculum.md "American English first") but for やま and ほし's `accent-exposure` items, ≤ 10 % of each level, in UK or AU (bank.test "accent policy").
  - `ask` (pic, num) a short Japanese question shown while the clip plays; `pic` choices are art keys with Japanese labels (`PIC_JA`, for VoiceOver and the review); `word`'s `focus` the answer as it appears in `en`; `reply`'s `ja` the question → the reply; `tts` what's spoken when it isn't `en` (reductions, numbers written out: curriculum §9).
- **Counts** (bank.test's fixed counts): levels 1-7 **46 / 49 / 89 / 297 / 30 / 236 / 115**, 862 items. Level 3 has かわ's 40 breadth items (content/kawa-b.ts, wave 2); level 4 bank4.ts 67, dialogues.ts 24, もり's sets 206.
- **Waiting sets.** A set written after its level was offered waits for its voices (content/index.ts `WAITING`): `BANK` and the compiler take its items only once all their clips exist, so the level stays offered meanwhile. Every set is voiced today.
- **`deck.ts`**: `deck(seed, lv)` is deterministic over the level's loaded items: the mix, never one type more than twice in a row, choices shuffled by the seed, templates not drawn together while the pool allows. Every phone builds the same deck from `{seed, lv}`, so no text goes on the wire. `LEVELS` (= `playable`) are the levels this phone offers: a mix and a clip for every item.
- **`score.ts`**: `points(right)` and `firstListen(right, replayed, same)`; `QUIZ_MAX_S` 1040. **`clips.ts`**: `clipAt(id, slow?)` (a clip's pack, offset, bytes) and `clipDur(id)`.

### Level 4 「もり」 (curriculum §14, increment 1)

- **`bank4.ts`**: 67 items for B1+ → B2 (21 reply, 18 mean, 15 word, 13 num), each from a scenario seed (curriculum §5.5: travel, health, phone services, the landlord, work, plans) with its register, conditions and pragmatic layer in `tags`. Real places and money, villagers as adults; natural speed, reductions, indirect replies, self-corrections, sarcasm. No `pic` (the art is island things).
- **Fields** (level 4 and up): `tts`; `note`, the trap in Japanese (≤ 40 字, at the reveal); `cast`, the voice id (`us-f1` … `au-m2`, "Audio"); `tags` `{seed, register, pragmatic, conditions?, features?}`.
- **Japanese help** (2026-11-07, the user: "Japanese translations of the options, Japanese explanations… often the quizzes have too little context"; every level, the dialogues and the units' items, optional): `cja` each choice in Japanese (aligned to `choices`, carried through the shuffle, no English letters); `why` かいせつ (≤ 90 字); `ctx` the situation before the clip (≤ 30 字, one line). bank.ts `helpProblems` checks them. Shown: `ctx` under the speaker before the clip; at the reveal each choice's `cja` under it and `why` in a 「解説」 box; the same in the review, the lessons and the dialogues; a missing field is hidden (frame/Why.svelte, ChoiceGrid `ja`; e2e kikimimi-help).
- Dropped: collapsing the Japanese at level 4 (the user asked for more Japanese help instead).

### Levels 6 and 7: やま, ほし and もり's new sets (the content sprint, 2026-11-06)

The user: "I want much more content and more variety, esp in the harder levels." Sets wired in by `content/index.ts` (`SETS`):

| set | file (prefixes) | level | single items | dialogues | what |
|---|---|---|---|---|---|
| もり: daily life | mori-life.ts (`ml-`, `dml-`) | 4 | 70 | 15 | shops, restaurants, hotels, travel, health, banks, landlords, deliveries, the ward office, gyms, emergencies |
| もり: work and people | mori-work.ts (`mw-`, `dmw-`) | 4 | 70 | 15 | meetings, deadlines, feedback, IT, clients, interviews; friends, gossip, dating, family |
| やま A | yama-a.ts (`ya-`, `dya-`) | 6 | 80 | 20 | idioms, phrasal verbs, slang, sarcasm, banter, puns, heavy reductions |
| やま B | yama-b.ts (`yb-`, `dyb-`) | 6 | 80 | 20 | negotiation, complaints, disagreement, bad news, contracts, money, escalations |
| ほし | hoshi.ts (`ho-`, `dho-`) | 7 | 90 | 25 | news, radio, podcasts, mini-lectures, documentary, debates, dense statistics, stance |
| variety | variety.ts (`vm-`, `dvm-`, `vy-`, `dvy-`) | 4, 6 | 30 + 30 | 6 + 6 | the user: "more variety and situations": events (a wedding toast, a Super Bowl party), town, home, tech help, Tokyo told by Americans |
| かわ breadth | kawa-b.ts (`kb-`) | 3 | 40 | 0 | wave 2 (curriculum-wave2.md §3.2) |

- **Voices.** The sets' villagers are in `CAST` (cast.ts), each with one US voice; exposure items use `EXPOSURE` ("Audio").
- **Staging** is on the items themselves (`scene`, `channel`, `marks`); staging.ts's tables stay the older banks'. `withBed`: a live item in a café, street, platform or gate scene gets that bed, light; `word` items clean. ほし is broadcast on the plain stage.
- **ほし's shapes.** `mean` and `gist` run 2-4 sentences (≤ 45 words); a single-clip `gist` asks what a bulletin is about, a single-clip `next` what the same speaker says next; their Japanese is the transcript only.
- **Clip caps** (bank.test): length 8 s a line at levels 1-3, 10 at level 4, 11 at やま, 22 at ほし, 18 in the pack (a PA +3); size 60 KB a clip, level 4 and a rung 80, the pack and やま 100, ほし 160, a story segment or listening line 100, a はつおん word 20.
- **The ladder.** The lobby lists 6 and 7 after 4; きろく's stages reach ほし (C1); the level nudge steps もり (or the pack) → やま → ほし. The protocol's `lv` went to 1-8 first (relay deployed 2026-11-06).
- **Tests:** content/sets.test.ts (sizes, splits, prefixes, families, words a clip), then the shared bank / staging / conditions / near-dupes tests.

### Variety: less repetition (2026-11-06)

- **History.** Each phone keeps the item ids of its last 6 games (`DEVICE.kikimimiRecent`; recent.ts `remember`).
- **A shared game.** The host picks the seed: 24 tries (`freshSeed`, via the session's `seedFor` at `open` and on `configure`), keeping the deck with the least overlap with its history (an item from the last game weighs 6, the oldest 1). The seed's low bits stay the lobby's flags. The others only use the seed: no protocol change.
- **Solo and にがて れんしゅう** draw the items not heard lately first (`deck(seed, lv, mix, seen)`, srs.ts `practiceDeck`).
- **Measured** (60 games; items of a game heard in the last 6, random → host's pick → solo): level 4 1.60 → 0.08 → 0, 6 1.73 → 0.03 → 0, 7 2.77 → 1.13 → 0. Levels 1-2 and the pack are small, so some overlap there is unavoidable.
- **Near-duplicates** (near-dupes.test.ts): every clip's English against every other's (Jaccard over content words ≥ 0.5 with 4+ words) and every right answer against the others'. Five pairs were rewritten on one side before voicing.

## Co-op and たいせん (curriculum §14, increment 3)

- **Co-op is the default** with several (the user's choice). The results read **「ふたりで n/8」** (3 players 「さんにんで」): a question counts when **at least one player got it right**. Answers are hidden till the reveal, so nobody leans on the other; a miss never costs what the partner caught. Under it, **「そろって せいかい m もん」**: the questions every player who had them got right (had: answered, or in the game as its clip began). The same on every phone (from the `join`s and `a`s heard).
- **Never shame:** in co-op the chips show only ✓, never right or wrong or points; the reveal says how many got it (「2にん せいかい！」, none: 「むずかしかったね！」), never who. No ranking; each phone its own tally (「じぶんは 8もん中 6もん」) and review.
- **「たいせん」**, the host's lobby switch: points, the chips' ✓ / × at the reveal and a ranking. It rides on the seed's **bit 0**, so no new field and no relay deploy; flipping it deals a new deck. もういっかい keeps the mode.
- **Places**, never やさしい/むずかしい (curriculum §3): ★ はまべ (levels 1-2), ★★ かわ (3), ★★★ もり (4), ★★★★ やま (6), ★★★★★ ほし (7), and 📢 アナウンス beside もり (catalog.ts `PLACES`, kikimimi-ux.md §4).
- Built: seed.ts `versus`, the view's `vs` and `team {right, all, done}`; tests session.test "co-op and たいせん", e2e kikimimi.

## Dialogues (curriculum §14, increment 4)

- **Content.** `dialogues.ts`: 24 (12 `gist`, 12 `next`), level 4, B1+ → B2, each from a scenario seed (§5.5): café orders going wrong, a cancelled train, a landlord who won't commit, a gate change, "we should grab lunch", a bank scam call. Reductions in `tts`, numbers written out. もり's and やま's sets add their own.
- **Shape.** `lines: {who, cast, en, ja, tts?}[]` (2-4, two villagers taking turns); `en` the lines joined, `speaker`/`cast`/`voice` the first line's, `note` the trap. Distractors: for `gist` a heard detail misplaced, the literal reading or the opposite; for `next` a repeated word, the wrong role, an answer to what wasn't asked.
- **Clips: one per line**, `<item>-<n>` (bank.ts `clipIds`, `clipItems`). The item's length is the lines' plus `LINE_GAP` (0.3 s) between them (`itemDur`), the same on every phone.
- **Playing** (clipPlayer.svelte.ts `playSequence`, clips.ts `sequenceStarts`): each line at its relay time; heard late, a line over is skipped, never two at once. Replays play the whole sequence (no 🐢).
- **UI.** Both speakers' heads, the one talking bobbing. At the reveal: the accent and `note`, the verdict, the right choice and my pick, then the two-sided transcript (`Transcript.svelte`: the first speaker left, the other right, each line's Japanese; a `next` answer as a dashed 「つぎの ひとこと」 bubble).
- **The gate.** Level 4's dialogue mix only once every level-4 dialogue line has a clip (deck.ts `mixes`, compiled into `index.json`'s `dialogues`), so single items and dialogues could be voiced in either order.
- Tests: bank.test, deck.test (mix, gate, clipItems, itemDur, sequenceStarts), session.test; e2e kikimimi "dialogues" (`__kiki.deck(ids)`).

## Visuals (curriculum §8 and §14, increment 5)

- **Backdrops.** 8 painted scenes (`cafe`, `platform`, `pharmacy`, `office`, `door`, `gate`, `street`, `living`; bank.ts `SCENE_IDS`) in `static/art/scene/<id>{,@2x,@3x}.webp` at the card's 393×224, in the art manifest (stage.ts `sceneArt`, `sceneSrcset`). Generated paper-gouache backdrops (curriculum §8), the villagers' official art composited over them by the app; no NH character or Nintendo look is ever generated. `npm run art:scenes [ids] [--force | --encode]` (scripts/scenes/scenes.ts): **Z-Image-Turbo** (Tongyi-MAI, **Apache-2.0**: the outputs are ours to ship) through MFlux's Q6 conversion, 9 steps, 1344×768, **seed 7**, each scene's line plus the shared style (scenes.json: no people, no text, an empty floor in the lower third); re-painting gives the same pixels; cwebp q80. Masters cached under `app/.cache/scenes/`. No backdrop holds text or numbers, so none gives an answer away.
- **Staging** (`staging.ts`, folded in by `staged`): `scene?` and `channel?` (`live | phone | pa | video`) on items, `marks?` on items and lines. The channel defaults from `tags.conditions` (bank.ts `channelOf`). Levels 1-3 stay on the plain stage.
- **Scene card** (`scene/SceneCard.svelte`): a staged item's stage from the lead-in to the reveal. The backdrop (softened under a paper vignette), the place's name, and the channel: face to face the speakers stand in it full-body; `PhoneFrame` (a paper phone, 「つうわちゅう」 or 「るすでん」, signal bars), `PaFrame` (a horn with ripples), `VideoFrame` (a 2×2 call grid), all CSS/SVG. One image at a time; reduced motion stills them.
- **At the reveal** (`SoundLine.svelte`, marks.ts `soundLine`): the English with the focus and sound marks: `say` (Let me → *lemme*), `link` ‿, `drop` (tryin~~g~~), `stress` ●; `MarkLegend` keys them. Marks are authored per clip (`MARKS`, on whole words) for every `tts` respelling. **Karaoke** while the clip replays: the words said in ink, the one being said underlined; a frame loop only while it plays.
- **Word timings** (`npm run audio:kikimimi-words`, after `audio:kikimimi`): whisper-cli large-v3-turbo hears every clip word by word (DTW timestamps), matched to the shown words by a DP over normalised spellings, the rest spread by letters. `words.json` `{clip: [hash, start…, end]}` in centiseconds, compiled into the levels' chunks; `wordTimes` falls back to spreading the clip's length when the hash differs.
- The next question's backdrop and speakers are fetched with its clip (stage.ts `preloadStage`); the service worker caches backdrops on first use (caches.ts).
- Tests: staging.test, usage.test, caches.test; e2e `kikimimi-scenes.spec.ts` (`KIKI_SHOTS=1` → /tmp/kikimimi-shots/inc5/).

## Conditions (curriculum §5.3, §9 and §14, increment 6)

- **What.** A clip can carry `cond: {kind, level, bed?}` (bank.ts `Cond`): a channel (`phone`, `signal`, `voicemail`, `pa`) or a bed (`cafe`, `street`, `station`, `party`), `light` or `heavy`, and a channel's bed behind it (a PA on a platform: `pa` + `station`). A dialogue's lines take the item's unless a line has its own. `conditions.ts condOf`: the clip's own, else a phone's light `phone` (voicemail, or `signal` on a line that breaks off), a PA's light `pa`; video and face to face stay clean, and so does a たちぎき (its game loops the party bed under the whole talk). Levels 1-3 never have one.
- **The settings** (`condPlan`, carried out by `scripts/kikimimi-audio.ts` with `scripts/tts/dsp.ts`):

  | condition | light | heavy |
  |---|---|---|
  | phone | band 300-3400 Hz, compressor −22 dB 3:1, G.711 µ-law 8 kHz | band 350-3200 Hz, −26 dB 4:1, line hiss +32 dB, G.726 24 kbps |
  | signal (W2-A) | the phone line, then dropouts (`dropGaps`, seeded: one every 1.4 s, 120-320 ms; 60 % silence, 40 % stutter), G.726 24 kbps | every 0.9 s, 150-450 ms, half stutters, hiss, G.726 16 kbps |
  | voicemail | the caller's room (RT60 0.35 s), then the phone line | the same, then the heavy line |
  | pa | a two-tone chime, horn band 250-6000 Hz, −20 dB 3:1, hall RT60 1.0 s | band 300-5000 Hz, −22 dB 4:1, hall RT60 1.6 s |
  | bed (café, street, station) | **+15 dB** SNR | **+10 dB** |

  The SNR is integrated loudness of the speech over the bed's stretch (the bed from 0.5 s before to 0.35 s after, from an offset by the clip's id). A call's bed sits before the phone line, a PA's after the hall. Then −16 LUFS, a limiter, AAC. These are curriculum §5.3's noise steps 1-2; +5 dB waits for S3. Only a line that breaks off gets `signal`, and the player asks again on the next line, so a dropout never falls on a memo answer.
- **The beds** (`app/scripts/tts/beds/{cafe,street,station,party}.m4a`, committed, 24 s, ~121 KB; beds.json says how): `npm run audio:kikimimi-beds` synthesises them from our own TTS clips reversed and layered, plus seeded noise and simple synthesis (clinks, traffic, a train), so there's **no third-party audio and no licence to track**. `party` (16 reversed talkers, glasses, a groove from the next room) ships as `static/audio/beds/party.<sha8>.m4a` for たちぎき. whisper hears no words in any of them.
- **Hashes.** A conditioned clip's source hash is its master's plus the plan, the bed's hash and a version (`condSource`), so a changed bed or setting re-mixes only its clips and never re-speaks (raw takes cached by the master's hash).
- **QA.** The strict gate runs on the clean take; the mixed clip gets a loose whisper WER check (≤ 0.2 light, 0.3 heavy; signal 0.5 / 0.6), else it's flagged `cond-wer`. The clean take is kept (`.cache/tts/clean/<id>.m4a` with its `lead`) for the word timings.
- **Where.** Level 4: every phone and PA clip, and the noisy scenes (`staging.ts NOISE`: cafés, stations, streets; heavy where the noise is the point); `word` items clean; heavy under 15 %. The pack and the sets as written. The units and listening files carry their own (wave 2).
- Tests: conditions.test.

## The アナウンス pack (curriculum §7 game 7, §14 increment 6)

- **Level 5 「アナウンス」** (bank5.ts, 30 items, B1+ → B2): station and train announcements (Tokyo and UK rail: track changes, delays, suspensions, the last train), airport PA (final calls, gate changes, boarding by rows), phone menus ("press 3", the queue), voicemails, shop announcements, a fire alarm test, a radio typhoon blurb in a café. 12 `num`, 6 single-clip `gist`, 6 `mean`, 6 `reply`; all US since "American English first" (it was written with UK and AU voices).
- **Each** has its condition written out (PA 16, calls and voicemails 12, two over a bed; 8 heavy), tags, scene, marks, `note` and `ja` (gist, mean and reply end 「→ the answer」).
- **Beside level 4**, not above it (bank.ts `levelRank`: difficulty and the nudge count it as もり). The protocol already allowed `lv` 5.
- Tests: bank.test, deck.test, staging.test; e2e `kikimimi-announce.spec.ts`.

## スピード はしご (curriculum §7 game 2, §14 increment 7)

- **The mechanic.** One line of daily life (B1+ → B2) heard four times, faster each time: **0.8×, 1.0×, 1.2×, 1.4×** of natural speech (ladder.ts `SPEEDS`; 1.0× = 4.3 syllables a second, curriculum §3's S1; 1.4× = 6.0, S4's fast casual). Each rung asks **something different**: 1 the gist, 2 a detail, 3 a harder detail, all **in Japanese** (nothing English to read before the faster listen); 4 **ことば**: the line with its key chunk blanked and 3 near-sound forms that mean much the same ("The train's / was / got stuck"), so only the weak forms heard at 1.4× give it. A game is 2 ladders.
- **The climb and the score.** A rung is **climbed** when right **on the first listen** with every rung under it climbed (ladder.ts `climb`): the climb stops at the first miss, replay or time-out. A flat **100 a rung climbed** (never more for a higher rung, which would invite guessing; ≤ 800 a game). In おなじへや a replay counts against the host's climb only.
- **Reveals.** A rung below the top moves on by itself 3 s after its reveal (`timing.auto`) and keeps the line **hidden and silent** (no English, Japanese, replay: game.svelte.ts `hidesLine`), so the next rung is a listen of its own. The top rung's reveal is the quiz's plus how high the ladder went (「1.0× まで のぼった！」). Over the stage, four steps rising (climbed leaf, this one yuzu, stopped coral).
- **Results.** How high I climbed, a card of my climbs, co-op's 「ふたりで n/8」, and one review row a ladder with ▶︎ at each speed.
- **On the wire:** the seed's **bit 1** (seed.ts `isLadder`); the 8 questions, 3 choices and score fit the quiz's, so **no protocol or relay change**. Rejected: a level value or a new field (a relay deploy for nothing).
- **Content** (`ladders.ts`): **30 ladders** (`sp-<name>`, rungs `sp-<name>-1…4`): 10 climb level 4's own lines (the same take), 20 new 15-30-word lines with reductions and marks; all US.
- **Audio.** Each line is spoken once through the gate, then **time-stretched by ffmpeg atempo** to each rung's syllable rate (tempo clamped 0.7-1.6); rungs are clean (speed is the one lever). Why atempo, not `playbackRate`: Web Audio's `playbackRate` shifts pitch; atempo measured UTMOS 4.30 at 1.0× and 3.93 at 1.4×. Pre-rendered rungs work offline from the cache. As made: UTMOS by rung 4.25 / 4.28 / 4.17 / 4.02, 120 files, 4.2 MB.
- **きろく: the fastest comfortable speed** (progress.ts `speedOf`): the fastest rung at least 75 % of my last 8 ladders climbed (curriculum §10's band); under 4 ladders 「はかっている とちゅう」. Ladder games stay out of the quiz's trend, level nudge and skills. Advice kind `speed`: 「スピード はしごを ためそう」 / 「スピード はしごで はやさに なれよう」.
- Tests: ladder.test, session.test, progress.test; e2e `kikimimi-ladder.spec.ts`.

## Loading: a chunk per level (2026-11-06)

The content sprint took the sheet's chunk to 696 KB (257 KB gzipped) on phones that play one level a game, so the content was split out (framework §6):
- **The compiler** (`kikimimi/compile.ts`, `npm run kikimimi:levels`; the audio scripts run it at their end): `BANK`, `LADDERS`, clips.json and words.json into `kikimimi/levels/`. `parts/lv<n>.json` a level's items with their clips and timings, split in order past 54 KB gzipped (`lv4-1`, `lv4-2`…); `parts/ladder.json`; the units' `parts/u-<id>.json` (≤ 32 KB, docs/curriculum-units.md §11); the stories' chapters `parts/<serial>-<n>.json`; the listening files' parts (framework "Listen parts as built"). `index.json`: each part, the content versions (`cv`, framework §4.2), the gates (`offered`, `dialogues`, the ladder), the sound check's clip, every item's id, level, type, accent and features, the units, stories and listening files. Committed; levels.test fails while they differ from the compiler's output.
- **The phone** (`kikimimi/pool.ts`): the index is in the sheet's chunk, and きろく, the advice and にがて れんしゅう read it alone. Each part is its own lazy chunk; `load(...units)` fetches a level's (or `'ladder'`, a unit's), `loadChapter` a story chapter's; `levelItems(lv)` throws for a level not loaded (a deck from half a bank would differ between phones).
- **When.** The sheet loads the remembered level's chunk and those of lobbies heard; then chunkQueue.ts: a heard `open` waits for its chunk, and everything after it waits behind it, in order; my own taps likewise. にがて れんしゅう loads its picks' levels, then deals. A chunk that won't load drops what waited; the host's re-sent `open` tries again.
- **The budget** (scripts/kikimimi-budget.ts, run by `npm run build`, and levels.test): the sheet's chunk ≤ 80 KB gzipped, the hub ≤ 25, each other page and game view ≤ 15, each level's part ≤ 60, a listening file's ≤ 32. Measured 2026-11-06: the sheet 50.2 KB gzipped; lv1 5.4, lv4 38.3 + 38.5, lv7 41.3.
- Tests: levels.test, game.test (an `open` for a level not loaded; my taps behind it), units.test's golden decks (`decks.golden.json`).

## Audio

- **Generation (neural).** `app/scripts/kikimimi-audio.ts` (`npm run audio:kikimimi`) with `app/scripts/tts/tts.py` in uv venvs under `app/.cache/tts/`. Engine-pluggable (`--engine qwen3 | voxcpm2 | kokoro`; `say` the legacy v1 path, levels 1-3 only). The engine is **Qwen3-TTS 1.7B Base** (mlx-audio), seeded, cloning each cast voice's reference clip with its exact transcript, so a voice stays the same voice.
  - **Setup** (Apple silicon): `brew install uv ffmpeg whisper-cpp`, and `~/.cache/whisper/ggml-large-v3-turbo.bin` (1.6 GB, from huggingface.co/ggerganov/whisper.cpp; `WHISPER_MODEL` names another). The first run makes the venvs (`requirements-{gen,qa,kokoro}.txt`, Python 3.12) and the models download on first use; a check before any synthesis names what's missing. Smoke test: `npm run audio:kikimimi -- --only '^p1-cake$' --out /tmp/kiki-pipe-test --force`. `--refs` re-makes references (the AU ones need VCTK's wavs under `.cache/tts/vctk/`).
  - **The cast** (`app/scripts/tts/cast.json`, 18 voices): 12 US (`us-f1…f6`, `us-m1…m6`, twenty-something to sixty-something, `us-f6` light Southern, `us-m6` light New York), designed by Qwen3-TTS **VoiceDesign** from descriptions (seeds 7-42, the best by UTMOS and most unlike the others, ECAPA ≤ 0.64), no real person; 6 for the exposure items only: UK from **Phonon 31m** catalogue voices (Apache-2.0, synthetic), AU from the **VCTK corpus** (p326, p374; p335 a New Zealand woman). References committed (`refs/<id>.m4a`). VoiceDesign never speaks lines (not consistent across clips).
  - **Who speaks.** Each villager has one US voice for good (cast.ts `CAST`, the units too); an `accent-exposure` item uses the speaker's UK or AU voice (`EXPOSURE`).
  - **Text.** `speech.ts spokenText`: `tts`, else `en` with numbers written out (`sayNumbers`).
  - **Processing.** The raw take (cached by master hash and seed) → edges trimmed → −16 LUFS, a limiter at −1.5 dBTP → mono AAC 48 kbps 24 kHz (the stories and しずえの ニュース at −18 LUFS: `SOFT`). L1's normal clips slowed to 0.92, and L1/L2's `-slow` at 0.75, by atempo from the same take (curriculum §9 preferred a separate careful take for 🐢; the stretch kept UTMOS, so it stayed).
  - **The gate.** whisper-cli large-v3-turbo hears every clip (numbers, contractions and reductions normalised by tts.py); a content word wrong or a voice drifting (ECAPA < 0.5) re-rolls with the next seed, up to 5 times; the best take is kept and the rest flagged for a person. UTMOS measured too. Re-rolls a person chose are pinned (`PINNED`). `app/scripts/tts/report.json` has every clip's text, seed, takes, what whisper heard, WER, UTMOS, similarity and flags.
- **Files.** Loose m4a in the work folder `app/.cache/tts/clips/` (refilled from the packs before a run: `unpackClips`), then packed. `clips.json` (`{id: {dur, hash, slow?}}`, compiled into the parts) and `app/scripts/kikimimi-clips.src.json` (each clip's source hash: engine, voice, text, seed, pipeline version). Only clips whose source hash changed are re-made; `--out <dir>` writes to a scratch dir.
- **Packs** (framework §6). The clips ship as `static/audio/listen/<pack>.<hash>.pak`, whole m4a files end to end (`packing.ts`). A clip's home is its level's pack (`lv4`), `ladder`, its unit's (`u-<id>`), its listening file's or its story chapter's; slow takes in `-slow`; a home past 1.2 MB splits into parts kept stable (`planHome`), so re-speaking a clip changes its own pack only. `npm run kikimimi:packs` writes the changed packs and `packs.json` (offsets and lengths). WebKit decodes a slice to the standalone file's samples (spike 9a), so ADTS wasn't needed. **Today: 144 packs, games 89.3 MiB, stories 21.4 MiB** (bank.test's 92 / 23 MiB lines: the stopgap till W2-R, "Pending"). Pages takes files ≤ 25 MiB and 20,000 a deploy (static-files.test keeps static/ ≤ 15,000), so the total isn't Pages' limit.
- **Voiced so far** (each through the gate; per-batch details in the commits and curriculum-wave2.md §4):

  | batch (date) | content | clips | UTMOS mean (min) | similarity |
  |---|---|---|---|---|
  | bank v2 (11-06) | levels 1-7, the dialogues, the pack, the ladders | 1,237 files | 4.27-4.30 (3.30) | 0.73-0.76 |
  | units wave 1 (11-06) | 7 units, 322 clips | 322 | 4.24 (3.42) | 0.73 |
  | stories (11-06) | st-cafe, st-johnny | 324 | 4.43 (3.73) | 0.78 |
  | A1 (11-07) | tiles, calls, たちぎき | 352 | 4.32 (3.61) | 0.73 |
  | A2 (11-07) | 7 かわ units, s1-call-b, s1-tile-c, kawa-b | 486 | 4.27 (3.49) | 0.72 |
  | A3 (11-07) | すうじ ラッシュ, しずえの ニュース | 531 | 4.37 (3.64) | 0.76 |
  | A4 (11-07) | 7 もり units, s2-call-c, tiles, たちぎき | 565 | 4.27 (3.02) | 0.72 |
  | A5 (11-07) | st-tokyo | 230 | 4.39 (3.65) | 0.74 |

  The units' and stories' scripts read app/content/units/*.yaml and content/listen/ (compile.ts `unitItems`, story.ts `storyItems`) with the same cast and rules. Stories have no condition or tempo change (~200 wpm).
- **The listening check.** A person listens before a clip counts as done; `npm run audio:kikimimi -- --listen [--only <regex>]` plays each with its text (never on the Mac unasked). A file's status goes `draft` → `voiced` → `listened`; the user approved batches A1-A5 on the machine gate ("proceed for all", 2026-11-07), and the flagged clips (195 in report.json's summary) wait for the ear: curriculum-wave2.md §4.1 "Pending: the listening check".
- **Attribution.** The AU voices are derived from the CSTR VCTK Corpus (CC BY 4.0): Yamagishi, Junichi; Veaux, Christophe; MacDonald, Kirsten. (2019). *CSTR VCTK Corpus: English Multi-speaker Corpus for CSTR Voice Cloning Toolkit (version 0.92)*. University of Edinburgh, CSTR. https://doi.org/10.7488/ds/2645. Changes: utterances trimmed, joined, loudness-normalised and resampled into the reference clips, which the TTS clones. The UK references are Phonon 31m output (Apache-2.0); the US ones are VoiceDesign output.
- **The engine** (sound/engine.ts, sound.svelte.ts): a `voice` bus following the master volume only (silent at 音量 0); `voiceSession(on)`, called **inside a tap**, creates and unlocks the context even when sound is off, holds it awake and sets `navigator.audioSession.type = 'playback'` (it plays with the silent switch on); `loadVoice(key, fetchBytes)` decodes a pack slice; `playVoice(buf, {relayAt?})` → `{stop(), endsAt}` at `ctx.currentTime + (relayAt − serverNow())/1000` (already past: whole from now), ducking the music. Decoded buffers in an LRU of 4 (`CLIP_CAP`), cleared on `voiceSession(false)`.
- **Fetching.** The lobby fetches the deck's packs whole (packs.ts `prefetchClips`: the first question's pack first) and decodes the first clip; each clip is sliced and decoded just in time. Measured (Chromium, Fast 4G): the first pack 2.0-2.1 s after picking level 4 or 7; a decode 1-3 ms.
- **Caching.** The service worker keeps the packs in `island-listen-v1` (docs/backend.md "Service worker": cache first, outliving builds, 30 MB by least recent use), so a played level replays offline. Packs are never precached.
- **After a lock or app switch** the context is suspended; a 「タップして つづける」 card resumes it, so nothing plays with the screen locked (おやすみ ものがたり pauses and keeps its place). A story holds the music down (`holdDuck`) and its sleep timer fades the voice (`fadeVoice`).

## Sync: one new presence-only intent

`{kind:'quiz', g, op, …}`: a `case 'quiz'` in `intentOf` (contract/live-protocol.ts) and `'quiz'` in `guestMaySend`. Unstored, unacked, to all others; the relay deploys first. Client messages ≤ 210 bytes (the relay adds ~35; 256 is the cap). Since 8c later games go out as `play` (framework §4); the quiz still sends `quiz` while `QUIZ_ON_PLAY` is off.

| op | sender | fields | meaning |
|---|---|---|---|
| `open` | host | `g, seed, lv, same` | a lobby open to the others (on みんなを さそう); they see an invite (dropped if the host leaves, or after 10 min) |
| `join` / `leave` | anyone | `g` | joining or leaving the lobby or game |
| `go` | host | `g, at` | the game starts at relay time `at` (now + 4 s) |
| `a` | player | `g, i, k, rp, s` | the answer to question i: choice k, `rp` replayed, `s` the running total |
| `skip` | host | `g, i, at` | the host's position: question i starts at `at` (8: the results); on つぎへ and every 3 s (the beacon) |
| `skip` | player | `g, i, at` | `i` the sender's question: its よみおわった; `i` the next one: its つぎへ with the host gone |
| `end` | host | `g` | the game is cancelled |

Validation: `g` `/^[a-z0-9]{4,8}$/`; `lv` 1-8 (8 room for the next level without a relay deploy); `i` 0-7 (`a`), 0-8 (`skip`); `k` 0-3; `s` 0-1040 (now at most 800); `seed` a 32-bit unsigned int: **bit 0 たいせん, bit 1 スピード はしご, bits 2-3 こたえる じかん** (seed.ts `TIMERS`: 0 → 30 s, 1 → 20, 2 → 60, 3 → none). Flags on the seed need no new field and no relay deploy; changing one deals a new deck.

**The host is the clock** (2026-11-05, after a review reproduced drift).
- Every phone has the deck and each clip's `dur`. Question 0 starts at `go.at`; within a question every phone computes the lead (1.5 s), the clip and the answer window. The reveal starts at the limit or once everyone joined and here has answered (from the `a`s heard), and is untimed: the next start is only known from a `skip` (session.ts `schedule`).
- Every phone **adopts** the host's `skip`, even back to a question it got past; starts never decrease. A lost `skip` costs at most one beacon (3 s); a lost `a` is corrected by the next `s`.
- **The host gone** (its `leave`, or its presence gone 15 s, `hostGrace`): every phone shows つぎへ; a tap moves on and sends a skip the others follow. A host back after that adopts the players' position. A phone whose own socket is down ignores presence.
- **Late messages.** A question whose clip began more than 5 s before it was heard is sat out (`out`); one heard sooner plays from then. Nobody waits for a player who joined after a clip began. With こたえる じかん なし nothing is sat out.
- **Re-sends.** When someone's presence comes back, the host re-sends `open`, and in a game `go` plus its position; a player re-sends `join`, its `a` for the question under way and its よみおわった. **A socket replaced unseen** (2026-11-07, `ws.hello` `rep`): the host's re-sent `go` (or `open`) is the sign, and a player answers it with its `join`, `a` and よみおわった (else an untimed round's host waited for ever).
- **The state machine.** `kikimimi/round/session.ts` (`RoundSession`, any game's: framework §3.2 and "8b as built") is pure: it folds intents and the clock into `{phase, players, answers, scores, i}`, unit-tested with fake time (lost messages, the beacon, the host gone or locked, a stale `open`, a late `go`). The quiz drives it through games/quiz/session.ts `QuizRounds`. The Svelte UI only renders it.
- **8c** (framework "8c as built"): `SEND_PLAY` on, `QUIZ_ON_PLAY` off (`WIRE` 'guarded'): a co-op lesson and every later game send `play`, the quiz `quiz`; `?wire=quiz|play` forces either. A `play` open carries the game's `cv`; one this build can't play is a blocked invite (「アプリを こうしんしてね」).
- A lobby kept alone and its game send nothing. The banner and the sheet reuse the island's Live (`relay ?? demoRelay`), never a second one.

## UI

- **Starting.** The HUD menu's pill 「ききみみ」 (しずえ's head, above せってい) opens the sheet on its hub (kikimimi-ux.md §5, §6.1); the voice session begins in the pill's tap (`wakeQuizVoice`). While an invite is live the pill reads 「さそわれています！」.
- **Pages.** One push/pop stack over the hub (nav.ts): あそぶ › a mode's page (the ばしょ, こたえる じかん, さそう / はじめる; おさらい is にがて れんしゅう); みんなで (the lobby: the game, its ばしょ, who's in, 「きょうりょく ／ しょうぶ」, 「おとを 1だいに まとめる」, さそう then 「はじめる（Nにん）」); きろく; せってい (🔊 「きこえる？」); しまの みち › a unit › the ずかん. My lobby is kept on this phone alone until さそう.
- **The invite banner** (KikimimiHost.svelte, invite.svelte.ts: always loaded, a few hundred bytes) keeps the last 10 min of quiz intents and shows 「ウェイが ききみみに さそっています」 [さんか] through the toast host; さんか opens みんなで, joined.
- **Mid-game,** a backdrop tap or Esc doesn't close the sheet; ✕ asks 「ここでやめますか？」 (Sheet's `ondismiss`). Notices: 「ホストが ゲームを とじました」, 「ホストが いなくなりました」, 「じかんが たったので おわりました」.
- **おなじへや:** 🔁 / 🐢 only on the host's phone; the others show them off with 「ホストの スマホで ながれます」.
- **Look.** The paper theme, `ui/Sheet.svelte`, villager art via `villagerArt()`; taps ≥ 44 px with `data-sfx`; reduced motion honoured; `pic` choices have Japanese labels for VoiceOver so the English isn't given away; strings an `addCatalog` chunk (ja + en). Play: 🔁 / 🐢 under the bubble, the question centred, choices `clamp(56px, 8vh, 72px)`; an item without `ask` gets its type's (「きこえた ことばは？」, 「なんて こたえる？」). Reveal: 「せいかい！ +100」 and the いっぱつ stamp apart; a missed picture names the right one; しずえ's word per verdict.

## Progress & feedback (built 2026-11-05)

The user asked for "a mechanic for progress and improvement and learning tracking; recommendations and feedback on what to study and focus on". Both learners are B1+ (TOEIC 700+), so the point is **which sounds and skills still trip you**, not a score. Each person's details are theirs alone; only shared summaries reach the partner; co-op by default (curriculum §11).

### What's measured (per person)

- **Every answer:** the item, right or not, the authored choice picked (so distractors diagnose), first listen or not, replays, the level, whether practice.
- **Sub-skills** (the bars): each item's primary skill (its type, or its first feature for `word`) and secondaries (its other features, half weight):

  | skill | label | from |
  |---|---|---|
  | `lr` | L と R | `l-r` |
  | `vowel` | にた ぼいん | `vowel` |
  | `cons` | にた しいん | `b-v`, `th`, `sh-s`, `f-h`, `ending`; a `word` item with no feature |
  | `reduce` | つながる おと | `contraction`, `weak-form`, `flap`, `yod`, `gonna` … `kinda`, `can-cant`, `t-glottal`, `ellipsis` |
  | `num` | すうじ | type `num`; `numbers`, `teen-ty`, `clock`, `self-repair` |
  | `detail` | だいじな ところ | type `pic`, `gist`; `contrast`, `katakana` |
  | `reply` | うけこたえ | `reply`, `next`; `idiom` |
  | `indirect` | ほんね | type `mean`; a `reply`, `next` or `gist` whose pragmatic layer is unsaid (refusal, hedge, understatement, sarcasm…); `intonation` |

- **Tags.** Level 4 and up carry `tags`; levels 1-3 a table by id (`kikimimi/tags.ts`). bank.test checks every item has tags and every tag maps to a skill.
- **Mastery** (0-1): a recency-weighted (half-life 21 days), smoothed (prior 0.7 × 2) mean: **first listen right 1, after a replay 0.6, wrong 0** (curriculum §10). Shown from 3 answers.
- **Per type, accent and level:** accuracy and first-listen accuracy.
- **The level estimate:** an Elo-style ability θ (updates go to the learner, never the items). An item's difficulty is its place (progress.ts `difficulty`: L1 −1 … もり 2, やま 3, ほし 4; the pack as もり) plus a type offset; K 0.3 for the first 24 answers, then 0.15. The **comfortable level** is where θ predicts 80 % (θ − ln 4), capped at the hardest played + 0.5, shown as its stage (stages.ts `stageAt`: はまべ ★ A2–B1, かわ ★★ B1+, もり ★★★ B2, やま ★★★★ B2+, ほし ★★★★★ C1). 「はかっている とちゅう」 until 16 answers.
- **Trend:** first-listen accuracy per game, the last 12 (a sparkline). **Consistency, never a streak:** the days played this Tokyo week, 7 dots.

### Storage: one `listen` row per person per game

- **The row** (docs/backend.md "Events", `contract/listen.ts`): `listen {d, g, lv, n, ms, p?, r}` plus `gm?`, `u?` and a lesson's `l?` / `tm?` (curriculum-units.md §10). `r` 1-12 answers `[id, ok, pick, rp]`, only the questions I had (never counted as misses: progress.ts `listenAnswers`). ~200 bytes.
- **Why per game, not per day:** written once at the results with its own event id, so a retry is a duplicate and two phones never overwrite a day. A game left and rejoined writes a second row with the same `g`; the fold (`gamesOf`) makes them one. ~2,000 rows a year. Never compacted.
- **Who sees it** (`contract/guest.ts rowsFor`, server-enforced): its owner the whole row; everyone else only `{d, g, n, ms}` and a unit's `{u, stamped: 1}`; the guest and the members alike. The guest writes its own.
- **Offline:** the write queue, the optimistic view, and the phone's own copy of my last 300 games (`DEVICE.kikimimiGames`); the record's rows win by game id. Everything else, the SRS too, is folded from the rows, never stored.

### Adaptivity: spaced repetition and にがて れんしゅう

- **The shared deck stays deterministic**; personal adaptivity is solo only.
- **Cards** (curriculum §10: a chunk or a feature, never a clip): an item card for each item missed or right only after a replay, a feature card for each feature answered. Leitner boxes 0-6 (0 / 1 / 3 / 7 / 16 / 35 / 90 days): first listen right = good, after a replay = hard, wrong = again. Folded from the answers (`srs.ts`), never stored.
- **「にがて れんしゅう」** (あそぶ › おさらい): 8 questions from the levels offered: due item cards first (at most 4), then items carrying the weakest due features (another clip of the feature), then the weakest skills' items. A recommendation narrows it to a skill or an accent. Nothing on the wire.

### Recommendations and feedback (`kikimimi/advice.ts`, pure)

- **「つぎは これを れんしゅう しよう」** (at most 3, each one tap): due cards ≥ 4 → おさらい; the weakest skills (mastery < 0.75) → that skill's practice; a level nudge (the last 3 games ≥ 85 % and a higher place offered → 「… に ちょうせん」; ≤ 50 % → practice first); an accent ≥ 15 points below (≥ 6 answers) → that accent's practice; an unmeasured skill → 「… を ためそう」; スピード はしご ("スピード はしご").
- **しずえ's line after a game:** the skill that rose most (≥ +0.05), else the first recommendation; all right 「ぜんもん せいかい！ すごい！」.
- **Per game:** 「つまずいた ところ」 chips of the missed features and skills, and each missed row's feature label.

### UI and tests

- **きろく** (`Progress.svelte`, lazy; kikimimi-ux.md §6.9): the stage and its bar, the sub-skills as horizontal bars (one hue, the value at the end, unmeasured as an outline: bars read better than a radar at 8 skills), the trend sparkline, the week's dots, the recommendations, the couple summary 「ふたりで こんしゅう: いっしょに Nかい · Mふん」 (never a level), and 「くわしく」 (per type, accent, level). The guest sees its own きろく without the couple summary. Dataviz: one series, one hue, labelled directly; day `#3E9E4C`, night `--c-leaf`.
- vitest: the stats, the SRS fold and practice deck, the advice, the row's validation, the tag table; relay: owner-only rows and summaries. e2e `kikimimi-progress.spec.ts`.

## マイク (docs/kikimimi-mic.md; the privacy rule, 2026-11-07)

- Off by default. Turned on per phone in ききみみ's せってい and off again there.
- Solo by default. The partner is involved only in ロールプレイ and あてっこ, and only when both players opted in: joining is consenting.
- **Recordings are never stored or synced.** A take lives in memory for its round and is dropped at the next round, on leaving, or when the app hides. It's never written to localStorage, IndexedDB, the Cache API, the record, R2 or the log, and never sent to the partner. The partner hears only your live voice in the room.
- **Speech to text runs on the phone first** (whisper in the page; the model, ~70 MB, is downloaded once after you agree, and can be deleted).
  - If Safari's recogniser is used, the audio may go to Apple.
  - If the relay is used (`POST /stt`, relay/src/sttRoute.ts), the audio goes to our relay and Cloudflare's Workers AI for the request only, and nothing is kept; the relay logs only sizes and times (`stt`), with a daily cap a person (300) and an off switch (`STT_OFF`).
  - The opt-in names the backend in use.
- **No transcript and no speaking score leaves the phone.** Mic games' rows carry minutes only. ロールプレイ shares only its ✓ per phrase, as the team's.
- **No ranking or leaderboard for speaking.** Mic modes are not in たいかい or きまぐれ.
- Heard text is never put into a log event or an `Error`. The probe's `mic.*` events are numbers and closed sets (contract/log.ts).
- The Permissions-Policy allows the microphone to our origin only.

The probe (M0) is せってい's 「マイク診断（テスト）」 (`mic/MicProbe.svelte`): environment, permission, playback and recording per earphone route, whisper, Safari's recogniser and the relay, each on 3 pinned sentences with the WER computed on the phone; 「結果を送信」 sends only the `mic.*` numbers. **The user's run on both phones is pending** ("Pending"). The modes (まねっこ, くりかえし, こたえて！, はつおん ききわけ and あてっこ, ロールプレイ) are built: kikimimi-mic.md §4.

## Performance

- Nothing heavy loads before the sheet opens: the island's first load carries ~4 KB of ききみみ (the invite listener and host, the `listen` contract, the pill, the cues; ~2 KB gzipped).
- The sheet's chunk and each part are lazy and budgeted ("Loading"). The island's render loop idles under the sheet.
- The packs live in the service worker's listen cache, not in memory; in memory only the LRU of 4 decoded buffers.
- During play nothing renders per frame but the karaoke (only while a clip replays, re-rendering when the word changes); the bars, timer, bob and waves are CSS; the view refreshes at each phase's end (at least every 3 s).

## Tests

- **vitest:** the deck's determinism and mix; the bank's validity (speakers and art exist, answers in range, `word` choices distinct with the focus in `en`, every item with its clips, L1/L2 with slow ones, caps); the session's state machine; the protocol's parse cases (size, guest, ≤ 256 B relayed); the engine's clip API with a fake context.
- **relay vitest:** `quiz` goes to the others and is never stored.
- **e2e (logic tier, chromium):** two players over `?demo` and `?demo&as=B`, from the invite through the results; solo; `?kikimimi=fast` shortens the timed windows; the specs tap つぎへ and よみおわった through the untimed reveals. `KIKI_SHOTS=1` writes screenshots under /tmp/kikimimi-shots/. Rendering is judged on the iOS Simulator and the phones, not in CI.

## History

Built in three phases by 2026-11-05 (content and audio, the protocol and session, the engine's voice; the UI; reviews and fixes with a listen-through, the iOS Simulator and perf). On 2026-11-06 curriculum §14's increments 1 and 3-7 (level 4, co-op and たいせん, dialogues, visuals, conditions and the pack, スピード はしご), the neural cast (increment 2; its careful 🐢 takes not made), the content sprint (やま, ほし), the per-level chunks and packs (increment 9), the framework (8b, 8c) and the hub (kikimimi-ux.md). On 2026-11-07 the Japanese help, wave 2's listening games and audio (curriculum-wave2.md) and the mic probe. The v1 `say` voices gave way to the neural cast.
