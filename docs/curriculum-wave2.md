# ききみみ curriculum wave 2: more content, more ways to listen (signed off and built, 2026-11-07)

**Status (2026-11-07).** Built and shipped: よみきき サンド, the five modes, the conditions, recipe 2, the 14 units, every content lane and audio batches A1–A5, all `listened` with the user's go-ahead ("proceed for all"). **Pending:** W2-R (the packs on R2: the user's Cloudflare step, §5 question 3), the 7 new backdrops (ART, §3.3), the tone spike (W2-6, §2.6), and the user's listening check of the flagged clips (§4.1).

**The user, 2026-11-07:** "work with curriculum team, lets start developing more content. more types and ways of studying."

**The team round.** A curriculum designer (ex-Duolingo/Babbel), an American EFL teacher of Japanese adults, a learning scientist (listening research), a game designer (casual mobile and Animal Crossing), a learner panel (two B1+ adults in Tokyo) and the engineer. Inputs: docs/curriculum.md §7–7.1, docs/curriculum-units.md, docs/kikimimi.md, kikimimi-framework.md and kikimimi-ux.md, the three 2026-11-06 reviews, and the compiled content (app/src/lib/kikimimi/levels/, app/content/) as of aff5e496. Mic modes are out of scope (discussed separately).

**The verdict in five lines:**
1. Single-speaker items are plentiful. Missing: three-speaker talk (0 items), anything over 30 s (1 item), rebuilding what you heard (0 shipped), phone errands with notes (0 shipped), units in every domain but たび, しごと, ともだち and イベント, and the B2 sound features (h-drop, chains, assimilation, fillers: 0 tagged).
2. 100 items for three new modes are already drafted (60 tiles, 20 calls, 20 たちぎき) and only need a game: the cheapest new ways of studying.
3. Build one feature and five modes, in this order: よみきき サンド, ことば タイル, たちぎき, ようじ でんわ, すうじ ラッシュ, しずえの ニュース. トーン あて is a spike only.
4. Write 14 units, 7 at かわ and 7 at もり, so both stages pass the compiler's coverage rule (≥ 7 of 9 domains). Today かわ covers 2 and もり 2.
5. Wave 2 adds ~60 MB of audio: the games' packs 41 → ~90 MB (bank.test's line was 50), the stories' 12 → ~23 MB (line 20), so the packs move to R2 (W2-R). As built: 89.3 and 21.4 MiB, still on Pages under raised lines until W2-R (§5, question 3).

**Rules for every new mode** (the user's constraints):
- short (≤ 3 min a game), fun, never homework: no streaks, no keyboard, replays free;
- American English only (the US-only lint, §3.4);
- no かいがら and no new reward of any kind: a mode's payoff is in the round (the basket, the combo meter);
- solo and co-op, **co-op the default** with two players; one co-op rule per mode, no sub-mode picker; しょうぶ only where a mode says so;
- no mic;
- a per-player **tier** (easy/hard) on the same audio, through `join.tr` (8c);
- Japanese help on every round: `ctx` before the clip, `cja` and `why` at the reveal;
- iPhone 15/16 Safari: tap only, no drag, targets ≥ 44 px, laid out at 393 px; rendering checked on the iOS Simulator;
- each game its own lazy chunk (≤ 15 KB gz, its strings in its own i18n catalog), its content in parts ≤ 32 KB gz;
- hermetic tests: pinned date, weather (`?wx=` fixtures) and seed; no network, no sleeps.

---

## 0. How the team converged

| Role | First pick | Objection | Where it landed |
|---|---|---|---|
| Curriculum designer | Units: かわ and もり fail 7-of-9 | Modes without units don't move the path | 14 units; the modes become unit lessons (recipe v2, W2-9) |
| EFL teacher | ようじ でんわ, たちぎき: real tasks | Tiles can become a reading puzzle | Decoys are **sound** traps (weak forms, contractions); tiles appear only after the first listen |
| Learning scientist | タイル (bottom-up decoding), サンド (listen → read → listen) | Gist first, replays free, one lever at a time | サンド first. Replays count as "hard" for spaced repetition, never as points |
| Game designer | ラッシュ, たちぎき: pressure and gossip | A memo feels like a form | The errand's basket fills with what you caught; ラッシュ has a combo meter |
| Learner panel | 「たちぎき おもしろそう」「ラッシュ やりたい」 | 「ニュースは しゅくだい みたい」; typing is a chore | News is 60 s with 3 taps, the weather is the hook, no own hub card. No keyboard anywhere |
| Engineer | The drafted modes first, lazy chunks | The sheet, game.svelte.ts and decks.ts branch per game, so every game rides the sheet's chunk and edits shared files | W2-C1/C2 (compiler, registry, view slot) before any game. トーン あて is a 1-day spike |

## 1. The gaps

A snapshot at the team round (aff5e496): the why of §2–3. What wave 2 added is in §3.4.

### 1.1 What exists

**1,012 quiz items**, 30 ladders (120 rungs), 10 bedtime chapters, and 100 drafts not wired to any game.

| Stage (as played) | pic | word | num | reply | mean | gist | next | all |
|---|---|---|---|---|---|---|---|---|
| はまべ (lv 1–2) | 26 | 27 | 28 | 14 | – | – | – | 95 |
| かわ (lv 3 + 4 units) | 8 | 36 | 29 | 38 | 23 | 16 | 12 | 162 |
| かわ・もり (lv 4) | – | 53 | 51 | 69 | 64 | 31 | 29 | 297 |
| もり (3 units) | – | 16 | 6 | 20 | 18 | 12 | 5 | 77 |
| アナウンス (lv 5) | – | – | 12 | 6 | 6 | 6 | – | 30 |
| やま (lv 6) | – | 40 | 38 | 52 | 60 | 23 | 23 | 236 |
| ほし (lv 7) | – | 12 | 16 | 14 | 27 | 27 | 19 | 115 |
| **Unwired drafts** (content/listen/) | 60 tiles | 20 calls | 20 たちぎき | | | | | 100 |

**Japanese help.** Every item has `cja` and `why`; `ctx` is on 798 of 1,012 (missing on 138 of levels 1–3's 144, 36 at level 4, 40 in the units). None of the 100 drafts has `cja`, `why` or `ctx`. The drafts are mostly US, with ~10 UK/AU words to fix.

### 1.2 By can-do and sub-skill

| Can-do | Today | Gap |
|---|---|---|
| S2/S3: follow 2–3 people, with overlap | 176 dialogues, all two-speaker (3–6 lines), no overlap | 0 three-speaker items; 20 たちぎき drafted |
| S2: phone calls, the changed detail | `phone` on 151 items, `self-repair` on 37, single-answer MCQ | No multi-detail notes; 20 calls drafted |
| S1/S2: decode connected speech | `word` (188, 4-choice) | No rebuild task. 60 tiles drafted; 76 voiced bank items qualify with no new audio (US, `tts` ≠ `en`, 3–12 words, a reduction tag) |
| S4: podcasts and news | ほし median 6.7 s, longest 15.7 s; 1 item over 30 s | Long-form untrained beyond 10 question-free bedtime chapters |
| Numbers under pressure | `numbers` on 155 items, one at a time | Never in sequence or timed |
| Tone carried by the voice | attitude 55, sarcasm 28, intonation 32, all word-borne | Untested: the Qwen3 Base clone takes no tone direction |
| Knowing what you missed | the review list | No listen → read → listen cycle |

**Sound features** (stages.ts STAGES against item tags): 0 tagged items for h-drop, chain, assimilation, filler, elision, stress and overlap; t-glottal 3, flap 7, linking 14.

**Conditions.** Beds: café 83, phone 73, street 68, PA 18, station 17, voicemail 5. Missing for wave 2: **party** and **`signal`** (a line breaking up). Train, wind and rain wait.

### 1.3 By domain and situation

**Units: 7** (glue 2, たび 2, ともだち 1, イベント 1, しごと 1). かわ covers 2 of 9 domains (ともだち, イベント) and もり 2 (たび, しごと); the rule is ≥ 7 (a warning until a stage has its PLANNED units: かわ 10, もり 14). The glue anchors for introducing and inviting don't exist.

**Thin situations** (keyword probe over 772 core items, ≤ 7 each): weddings, festivals, concerts, museums, the doctor and pharmacy, emergencies and lost items, introductions, compliments, invitations, partner talk, clothes and sizes, groceries and the konbini, taxis. Heavy: trains (50), money (40), work (38), media (47).

**Scenes.** 8 backdrops; 383 items have none; tr-hotel names `lobby`, which has no art.

**Overused:** Osaka, refunds and store credit, bill splitting, "actually", the oat-milk mix-up, misheard "Wei", the drowsy medicine.

**The partner's stage** (かわ, B1+) has 162 items to もり's 374: the thinnest core stage.

## 2. New modes, ranked

V = learning value for these two learners, F = fun for the panel (1–5), cost S/M/L (drafted content and voiced audio lower it).

| Rank | Mode | V | F | Cost | Why |
|---|---|---|---|---|---|
| 0 | **よみきき サンド** (a feature) | 4 | 2 | S | No new content; every item; metacognition |
| 1 | **ことば タイル** | 5 | 3 | S–M | 129 items ready (76 voiced); the decoding gap |
| 2 | **たちぎき** | 5 | 5 | M | The only three-speaker, overlap training; the panel's favourite |
| 3 | **ようじ でんわ** | 5 | 4 | M | Real errands with self-repair; the units' チェック |
| 4 | **すうじ ラッシュ** | 3 | 5 | S–M | Template-made; partner-friendly; a good きまぐれ pick |
| 5 | **しずえの ニュース** | 4 | 3 | M | A 60 s daily ritual; the on-ramp to ほし's long-form |
| – | トーン あて | 3 | 4 | spike S | Only if the spike passes (§2.6) |

**Cut or parked:** うわさの でんごん, めいたんてい フータ, ざつだん パーティ (Tier 2: turn-taking taps are fragile on the audio clock); かいぎの ぎじろく (work is already the heaviest domain); ながら ききみみ (WebKit suspends audio on lock); ふたりで タイル (dictogloss) and the earphones-only はんぶんこ split: both wait for ふたりで ジグソー (framework 19).

**Where each lives** (kikimimi-ux.md §6.2; only playable modes show, at most one ✨ at a time, no new hub card):

| Shelf | Wave 2 adds | The shelf after |
|---|---|---|
| さくっと | ことば タイル, すうじ ラッシュ | 5 tiles |
| まちで・でんわで | ようじ でんわ, たちぎき | 3 |
| じっくり | しずえの ニュース | 1 (the shelf appears with it) |
| (none) | よみきき サンド: a button on review rows and a solo reveal | – |

All five join きまぐれ's rotation (today.ts) and the みんなで picker. A mode's page (ModeDetail) shows only the places its content has (ニュース: none).

### 2.0 よみきき サンド: listen → read → listen

- **Where:** 「読んでから もう一度」 on Results' review rows and the おさらい list, and in a game's reveal **only when solo** (in co-op it would hold up the partner's つぎへ).
- **The loop:** the clip plays blind → the transcript with its sound marks, `cja` and `why` (own pace) → the clip blind again → one tap 「聞き取れた ／ まだ」.
- **The data:** まだ is a device-local mark (DEVICE, like the last timer) that srs.ts folds in as "hard" on this phone. No row change, nothing on the wire.
- **The framework:** frame/ReviewList and frame/RevealFrame get the button; a new lazy frame/Sandwich.svelte reuses Transcript, scene/karaoke and SoundLine.
- **The risk:** a reading crutch. The clip always plays blind first.
- **As built (W2-0):** frame/SandButton (「📖 読んでから もう一度」) under a solo reveal's verdict and in an open review row; frame/Sandwich a full-height sheet (the reveal behind blurred), 読む / 聞き取れた waiting for the blind clip's end (or 3 s with no voice). まだ: DEVICE.kikiMada `{[who]: [id, day][]}` (≤ 200), folded by srs.ts cardsOf as "hard" after that day's answers (the report's `due` and にがて れんしゅう with it). e2e kikimimi-sandwich.spec.

### 2.1 ことば タイル: rebuild what you heard

- **Solo (2½ min):** 6 sentences. The clip plays once with no tiles; then the sentence's words plus 1–4 decoys appear; tap them into order. Replay is free (counts as "hard"). The reveal shows the **spoken shape** over the written one (should've → *shoulda*), then `ja`, `why` and ▶︎.
- **Co-op:** one board, odd slots for role 0, even for role 1 (`roles: 2`); `team` is the union. Both hear the same clip in one room.
- **The skill:** segmentation, weak forms, contractions, h-drop, elision, chains, linking.
- **The content:** the `tile` schema (content/listen/README.md): **53 drafts** (60 less the 7 duplicates of bank lines, folded into their bank items), **65 derived** from voiced bank items by scripts/kikimimi-tiles.ts (s2/s3-tile-bank, then reviewed by a person), 30 for the zero-count features (s2-tile-b) and the units' おと tiles (s1-tile-c, s2-tile-c: 42 each).
- **Tiers:** easy 1 decoy and the first tile placed; hard 3–4 decoys.
- **The framework:** GameDef `tile`; answer ≤ 12 ints (in the contract); `pick` the wrong-slot bitmask (fits the row's 0–4095). A tap-to-place TileBoard that wraps at 393 px. The derived tiles play their bank item's clip from its level's pack.
- **The risks:** a grammar puzzle (sound decoys only, tiles hidden until the first listen ends); overflow (≤ 12 tiles).
- **Built (W2-1):** kikimimi-framework.md "ことば タイル as built".

### 2.2 たちぎき: overheard three-speaker talk

- **The loop (2½–3 min):** 2 conversations of 30–50 s, 3 rounds each: **opinions** (match three Japanese claims to three faces), **changed** (who changed their mind), **plan** (what happens next, 3–4 choices). The clip plays before round 1; one-line segment replay after.
- **Co-op 「たんとう」:** each player is given one speaker to follow and the third is shared; the opinions round takes both players' faces. An information gap without earphones.
- **The skill:** tracking speakers, attitude, mind change, inference through overlap (S2–S3). At もり and やま; the partner plays it on the easy tier.
- **The content:** the `tachi` schema: 20 drafts (s2-tachi-a/b, s3-tachi-a/b) and 10 new (5 もり, 5 やま) in the thin situations: a wedding gift, a festival plan, a gym class, a neighbor's noise.
- **Tiers:** easy 2 claims, the third pre-filled.
- **The framework:**
  - GameDef `tachi`, a FaceMatch input (array of 3); each round's row id is the item's id plus a round suffix (ITEM_ID_RE allows `-`);
  - **line offsets:** `at` (negative = overlap) replaces LINE_GAP in clips.ts `sequenceStarts` and `itemDur`, played on the audio clock, not baked, so segment replay still works; clipPlayer's `talk` holds more than one line at once;
  - **three seats** in components/kikimimi/Transcript.svelte (`seat`: left, centre, right). Only this lane edits Transcript and clipPlayer.
- **The audio:** three distinct voices per item; the party bed (W2-A) is looped by the player under the whole conversation, so its lines are mixed dry.
- **The risks:** overlap masking the answer (overlap only on lines whose start carries none, −0.2 to −0.5 s); voices hard to tell apart (mixed genders, faces bob while speaking).
- **Built (W2-2):** kikimimi-framework.md "たちぎき as built".

### 2.3 ようじ でんわ: phone errands that change mid-call

- **The loop (2½–3 min):** 3 calls of 20–40 s on the NookPhone frame. A villager asks for something, then changes it ("oh, actually, make that two"). Fill a memo of 2–4 chip rows (what, how many, when, where). The reveal fills the errand's basket or bag with what you caught.
- **Rounds:** 2 per call (6 a game, ≤ the row's 12): the call plays in memo round 1; round 2 has `play` 0.
- **Co-op 「わけて メモ」:** both hear the whole call; the slots split by role; the team's memo is the union.
- **The skill:** multi-detail listening, self-repair, phone-band audio, a detail remembered late.
- **The content:** the `call` schema: 20 drafts (s1-call, s2-call-a/b, s3-call) and **14 new**, one per wave-2 unit for its チェック (s1-call-b at かわ, s2-call-c at もり; the two planned spares weren't written).
- **Tiers:** easy 2 slots; hard 4 slots and an extra distractor chip.
- **The framework:** GameDef `call`, a MemoPad of chip rows, PhoneFrame reused (its bars drop on `signal` lines).
- **The audio:** the phone band, and the `signal` condition (W2-A) never over a memo answer.
- **The risk:** form fatigue. 3 calls only, chips not typing, the basket payoff.
- **Built (W2-3):** kikimimi-framework.md "ようじ でんわ as built".

### 2.4 すうじ ラッシュ: a café rush of numbers

- **The loop (2 min):** 8 customers at マスター's counter. Each says a 1–2 line order with prices, times, quantities, table numbers or dates; about a third (at random, not every third) correct themselves. Tap the right ticket of 3–4 chips. A combo meter fills on first-listen rights; a miss doesn't end the run (the customer repeats).
- **Settings:** a café, a konbini, a ticket counter, a deli, a taxi fare, a prescription pickup.
- **Co-op:** two registers, customers alternating by role, one shared queue. しょうぶ: the same queue, scored against expectation (the たいかい rule).
- **The skill:** numbers at speed, self-repair, teen/ty, yen and dollars.
- **The content:** template-made. scripts/kikimimi-rush.ts expands seeded frames (speaker × setting × number × correction) into content/listen/s1-rush.yaml and s2-rush.yaml, 240 lines, with `ctx`, `cja` and `why` from each frame ("make that three: 最後の 数が 答え"). A person samples 20%. Rush items are exempt from the near-duplicate gate among themselves (one frame makes many).
- **Tiers:** easy 3 chips; hard 4, the pre-correction value always among them.
- **The framework:** GameDef `rush`, `num`-like kinds with an 8 s answer window (the lobby's なし turns it off), ChoiceGrid, a small Counter stage.
- **The audio:** 240 clean takes over the 12 US voices (a bed is tagged in `tags.conditions` only, not mixed).
- **The risk:** a TOEIC drill. In-character lines and the combo meter.
- **Built (W2-4):** kikimimi-framework.md "すうじ ラッシュ as built".

### 2.5 しずえの ニュース: the morning bulletin

- **The loop (≈ 2 min):** しずえ's 60–75 s bulletin in three segments (an island or seasonal item, a Tokyo-life item, **today's real weather**), then 3 taps: gist, a detail, 「傘は いる？」. One bulletin a day, picked by the date; segment replay allowed.
- **Where:** じっくり, and in きまぐれ's rotation in the morning. No hub card of its own, no streak.
- **Co-op:** together, one shared answer count.
- **The skill:** news register, signposting, extended listening; the bridge to ほし.
- **The content:** 30 evergreen bulletins we write (open question 1's default), content/listen/news-a.yaml and -b.yaml, tagged by season and weekday.
- **The weather tail:** one clip per **whole sentence**, joined only between sentences: 8 conditions, highs −2…38 °C ("a high of twenty-three degrees": Celsius, as Tokyo reports it), 6 alerts: 56 sentences. The data is the relay's Open-Meteo `wx` (sync/wx.ts); without it the bulletin ends after segment 2 and the weather question is skipped.
- **Tiers:** easy asks the gist and the umbrella; hard adds the detail.
- **The framework:** GameDef `news`, segment rounds, answers after play; a NewsStage with しずえ at her desk (PaFrame-like).
- **The audio:** one fixed US newsreader voice (us-f4), −18 LUFS like the stories.
- **The risks:** "homework" (60 s, the weather hook, no streak); choppy joins (sentence joins only, checked on the iOS Simulator).
- **Built (W2-5, B5):** kikimimi-framework.md "しずえの ニュース as built".

### 2.6 トーン あて (conditional)

One line spoken three ways (sincere, sarcastic, resigned), matched to a face or to what happens next. **Spike (1 d):** 10 lines × 3 tones through Qwen3-TTS with style instructions against the Base clone. It passes only if the voice holds (ECAPA ≥ 0.6 to the cast's reference) **and** the user, on the phone, tells the takes apart blind. Pass: S, a quiz kind of 3 clips. Fail: cut; attitude stays word-borne (`mean`). **Not run yet** (W2-6, whenever the GPU is idle).

## 3. Content wave 2

### 3.1 New units (14)

Per curriculum-units.md §2 and §11: one situation and one can-do; 6–10 key phrases, each heard in ≥ 3 items by ≥ 2 voices; ≥ 20% recycled; the three core lessons (≥ 6 items) plus おと and じっせん; ~30 items; a 40–60 word letter; a 「きょうの ひとこと」; 100% US. Can-do fields are in kanji Japanese (the 2026-11-07 sheet rule; units.ts's kana `short` changes with the ききみみ kanji conversion). Phrase ids are checked against the 131 that exist; "no way!" (`ph-no-way`) and "I've heard…" (`ph-ive-heard`) already exist and count as recycling.

**Wave 2a, かわ (7): the partner's stage first.**

| Unit | Name | Domain | Host / scene | Sound | Can-do: who · does · cond · catch | Key phrases (samples) |
|---|---|---|---|---|---|---|
| gl-intro | 紹介する | glue | marshal / party* | yod | 友だちが · 人を 紹介し合う · パーティーの にぎやかさの 中で · 名前・関係・共通の 話題 | this is my…, have you two met?, nice to meetcha, I've heard so much about you, how do you know…? |
| gl-invite | 誘う・断る | glue | maple / street | wanna | 友だちや 同僚が · 誘ったり やんわり 断ったりする · 速い 会話で · 本当に 来るか どうか | wanna come?, I'll try to make it, count me in, I'm gonna pass, maybe next time |
| fd-order | 注文する | たべもの | brewster / restaurant* | weak-form | 店員が · 注文の 確認や 質問を する · レストランの ざわざわの 中で · 何が 来るか・追加の 料金 | for here or to go?, soup or salad, on the side, are you still working on that?, I'll be right back with… |
| sh-shop | お店で 聞く | かいもの | label / shop* | flap | 店員や 友だちが · サイズや 似合うかを 話す · お店の BGMの 中で · 在庫・サイズ・本音の 感想 | a little bigger, it looks great on you, we're all out, let me check in the back, it runs small |
| hm-neighbor | 近所の 人 | いえ | tom-nook / door | elision | 近所の 人が · 立ち話や お願いを する · 玄関先で · 頼みごとと 本当の 用件 | just so you know, I hate to ask, no big deal, would you mind…, keep an eye on |
| hl-clinic | 受付と 薬局 | からだ | pashmina / clinic* | numbers | 受付や 薬剤師が · 予約と 飲み方を 説明する · 電話や カウンターで · 日時・回数・注意 | twice a day, with food, the soonest we have, are you allergic to…, your prescription's ready† |
| mc-weekend | 週末 どこ行く | まち | punchy / park* | lemme | 友だちが · 週末の 行き先を 決める · 外の ざわざわの 中で · どこへ・何時に・何を 持っていくか | lemme check, it's supposed to rain, the line's gonna be crazy, tickets sold out, let's play it by ear |

**Wave 2b, もり (7).** Authored any time; voiced (A4) only after wave 1's first week of rows.

| Unit | Name | Domain | Host / scene | Sound | Can-do: who · does · cond · catch | Key phrases (samples) |
|---|---|---|---|---|---|---|
| ev-wedding | 結婚式に 出る | イベント | diana / party* | intonation | 友人や 新郎新婦が · 招待・スピーチ・乾杯を する · 披露宴の にぎやかさで · 日時・贈り物の 習慣・冗談の 意図 | RSVP by…, plus-one, the registry, I couldn't be happier for you, raise your glasses |
| fd-dinner | 食事で 決める | たべもの | cherry / restaurant* | chain | 友だちと 店員が · おすすめや 食事制限を 話す · 速い 会話で · 何に 決まったか・誰が 何を 食べられないか | whaddaya feel like, the special tonight, I'm good with whatever, does it have nuts in it, share a few plates |
| hl-doctor | 診察で | からだ | julian / clinic* | stress | 医者が · 症状を 聞いて 指示を 出す · 診察室の 早口で · 回数・期間・次に 来る 目安 | how long has this been going on, it's nothing serious, keep an eye on it, if it gets worse, come back in a week |
| hm-repair | 修理を 頼む | いえ | cyd / living | h-drop | 大家や 業者が · 修理の 日程と 内容を 話す · 電話で · 時間帯・費用・あいまいな 約束 | between eight and noon, should be fine, I'll have 'im call you, it's gonna run you…, worst case |
| sh-phone | スマホの トラブル | かいもの (+ いえ) | kid-cat / shop* | assimilation | 店員が · スマホや 回線の 問題を 説明する · 店の ざわざわの 中で · 原因・選択肢・料金 | have you tried restarting it, it's under warranty, you'd have to back it up, sign in, it'll take about an hour |
| fr-catchup | 久しぶりに 会う | ともだち | rosie / cafe | self-repair | 友だちが · 近況や 出来事を 話す · カフェの ざわざわで · 何が あったか・相手の 気持ち | you'll never guess, long story short, no way!, that's so rough, wait, back up |
| mc-tickets | チケットを 取る | まち | kicks / street | numbers | 窓口や 友だちが · 席・時間・売り切れの 代わりを 話す · 窓口や 電話で · 日時・席・値段 | sold out, standing room, the matinee, aisle seat, there's a two-ticket limit |

\* A new backdrop (§3.3). † Replaces the overused drowsy-medicine line.

**Coverage:** かわ → ともだち, イベント, たべもの, かいもの, いえ, からだ, まち: **7 of 9** ✓ (11 units with 4 glue, past PLANNED 10, so the rule becomes an error). もり → **9 of 9** ✓ (10 units, still a warning until 14). No domain over 25%.

**Landing order (kept main green):** the 5 かわ domain units landed before gl-intro and gl-invite, since at 10 かわ units the coverage check becomes an error.

**Lessons (as built, W2-9):** the 14 units are on recipe 2 (`lessons.v: 2`, curriculum-units.md §16): おと = 6 tiles from the unit's lines; じっせん = a ladder, or a たちぎき where one fits; チェック = 1 call (2 memo rounds) + 4 quiz items (a 6-answer row, 5 of 6 stamps it). A lesson plays recipe 1 until its content is `listened` (all of it is now). The 7 wave-1 units stay on recipe 1 until they have calls (wave 3).

**Not in wave 2:** やま and ほし units (351 level items between them; daily conversation comes first). Wave 3 opens やま with idioms and group talk on たちぎき. C1 practice in wave 2 comes from s3 tiles, calls and たちぎき, the 5 new やま たちぎき, and ニュース.

### 3.2 More items for the thin spots

All written (B4, B6, B7) and voiced; the planned calls became the units' 14 (§2.3).

| Where | What | How many |
|---|---|---|
| Tiles | h-drop, chain, assimilation, elision, filler, stress | 30 (5 each) |
| Calls | かわ 8, もり 8 (the units' チェック) | 16 |
| たちぎき | もり 5, やま 5, in the thin situations | 10 |
| かわ level 3 breadth | introductions, invitations, compliments, weather small talk, emergencies (a lost wallet, a koban, an earthquake drill) | 40 |
| `ctx` back-fill | levels 1–3 (138), L4 (36), units (40) | 214, text only |
| Cleanup | fold the 7 duplicate tiles; spread Osaka, refunds, bill splits, "actually"; the bank's US-lint hits | – |

**Bedtime: a third serial, 「トウキョウ ひとりぐらし」** (st-tokyo), 7 chapters of ~4 min. An American newcomer's first month in Tokyo (the konbini, the ward office, a festival, the first earthquake drill) in US English, recycling the units' phrases; narrator us-f3, villagers as the people she meets. With 10 chapters a nightly listener runs out in under two weeks. More ジョニー chapters wait until st-tokyo is played. As built: 7 chapters of 681–694 words, 230 segments, 25.6 min, 9.7 MB.

### 3.3 Visuals

Seven painted backdrops: `party`, `restaurant`, `shop`, `clinic`, `park`, `konbini`, `lobby`. The existing pipeline (scripts/scenes/, Z-Image-Turbo, paper style, 1x/2x/3x webp) on the second Mac, throttled against the food images and never during a TTS batch. **Pending (ART):** not painted yet. bank.ts `SCENE_IDS` still holds the 8, so the units' headers name these scenes while their items use the existing backdrops or the plain stage.

### 3.4 Volume, pipeline and gates

| | Planned | As built (2026-11-07) |
|---|---|---|
| 14 units | ~420 items, ~630 clips | 14 × 30 items, 719 unit lines |
| Tiles | 159 (76 reused) | 232: 53 drafts, 65 derived (playing their bank clips), 30 feature, 84 units' おと |
| Calls | 36 | 34 (20 drafts + 14 for the units) |
| たちぎき | 30 | 30 |
| すうじ ラッシュ | 240 | 240 |
| しずえの ニュース | 30 + weather | 30 bulletins + 56 weather sentences |
| かわ breadth | 40 | 40 (content/kawa-b.ts, level 3) |
| st-tokyo | 7 chapters | 7 chapters, 230 clips |
| **Audio** | ~1,900 clips, ~2.8 h, ~60 MB | 2,164 clips (A1–A5), ~2.6 h; the games' packs 41 → 89.3 MiB, the stories' 12.8 → 21.4 MiB |

The human listen is the bottleneck, not the GPU.

**Pipeline:**
1. **Seed sheet** (the lead): can-do, phrases, sound, host and scene, §5.5 seeds; for modes the kind and tier sets.
2. **Draft** (one author per file): `en`; `tts` (a respelling only where the reduction matters, **never** one that voices the distractor); `ja`; `note` (≤ 40 字); `ctx` (≤ 30 字, the situation, never the answer); `cja` (one per choice or chip, no English); `why` (≤ 90 字, names the trap); tags. Per kind: tile `ctx`, `ja` and a `why` naming each decoy's trap; call `ctx` per call, `cja` per chip, `why` per memo round; たちぎき `ctx` and `why` per round; news `ctx`, `cja` and `why` per question; rush from its frame.
3. **Machine gates** (CI; errors past draft): schema and ids; helpProblems over the new kinds; **the US-only lint** (a UK/AU list: mate, cheers for thanks, queue, flat, lift, fortnight, reckon, fancy, half nine, neighbour, realise…; an error on content/listen, units and the bank (B7 cleared it); `accent-exposure` items exempt); digit-free `tts`; phrase and recycling rules; coverage; near-duplicates (TF-IDF > 0.42; rush only against the rest of the bank); the chunk budgets.
4. **Human review before voicing** (per batch, a short report in docs/reviews/): an EFL teacher, a US scriptwriter, a Japanese reviewer. Natural for an American friend or clerk; one clearly best answer; the second distractor the real trap; `ctx` without the answer; natural Japanese in `cja` and `why`; kana in character speech, kanji in sheet copy, one spelling per term.
5. **Voicing:** `npm run audio:kikimimi` (whisper gate, ECAPA ≥ 0.5, re-rolls); conditions mixed after the gate.
6. **Listening check:** the user, on the phone, every flagged clip plus a 20% sample; only then `listened` and shipped.
7. **Tuning:** a week of play; grow a stage only at 75–85% first-listen success.

## 4. The build plan

One agent per increment, disjoint files, each landing green on main and playable on its own; ≤ 3 agents at once (the ACC proxy), one GPU job at a time; audio batches are the lead's script runs. After W2-C1/C2 a game lane adds only its own folder, i18n file and one registry line. All of it landed on 2026-11-07 but the rows marked pending.

| # | Increment | Status |
|---|---|---|
| **W2-C1** | Compiler for the listening kinds: content/listen/*.yaml → `levels/parts/<file>.json` and the index's `listen` / `games`; the kinds' checker (listen.ts), the help checks and the US-only lint | Built: kikimimi-framework.md "Listen parts as built" |
| **W2-C2** | The games' registry: lazy per-game chunks and views, the data-driven catalog, per-game i18n, the budget glob | Built: kikimimi-framework.md "The registry as built" |
| **W2-0** | よみきき サンド | Built (§2.0) |
| **W2-A** | Conditions: the party bed and `signal` | Built: kikimimi.md "Conditions" |
| **W2-1** | ことば タイル | Built (§2.1) |
| **W2-2** | たちぎき | Built (§2.2) |
| **W2-3** | ようじ でんわ | Built (§2.3) |
| **W2-4** | すうじ ラッシュ | Built (§2.4) |
| **W2-5** | しずえの ニュース | Built (§2.5) |
| **W2-9** | Recipe 2: a unit's lessons play the listening games | Built: curriculum-units.md §16 |
| **W2-R** | The packs on R2 behind `PACK_BASE` (a same-origin route, the URL scheme unchanged); bank.test's lines then measure what Pages serves | **Pending: the user enables R2 in the Cloudflare dashboard (a bucket and a token).** Until then the stopgap (§5, question 3) |
| **W2-6** | The tone spike | **Pending** (§2.6), whenever the GPU is idle |

**Content lanes** (YAML/text only, one author per file, each batch reviewed before its audio):

| Lane | Work | Status |
|---|---|---|
| B1 | The US pass and `ctx`/`cja`/`why` on the 100 drafts; the 7 duplicate tiles folded; the derived tiles | Written |
| B2 | Wave 2a: 7 かわ units and their calls (s1-call-b) and おと tiles (s1-tile-c) | Written |
| B3 | Wave 2b: 7 もり units and their calls (s2-call-c) and おと tiles (s2-tile-c) | Written |
| B4 | 10 たちぎき (s2-tachi-c, s3-tachi-c), 30 feature tiles (s2-tile-b), かわ's 40 breadth items (content/kawa-b.ts) | Written |
| B5 | 30 bulletins and the weather sentences (news-a, news-b) | Written |
| B6 | st-tokyo, 7 chapters | Written (reviewed: docs/reviews/2026-11-06-bedtime-stories-review.md "st-tokyo") |
| B7 | `ctx` back-fill (214) and the bank's US-lint hits | Written |
| ART | 7 backdrops | **Pending** (§3.3) |

**Audio batches** (the M5 Max, each after its review). Each batch's gate figures, retakes and flags are in kikimimi.md "Audio"; every file is `listened` (the user's go-ahead, "proceed for all").

| Batch | Content | Clips | Minutes | Packs |
|---|---|---|---|---|
| A1 | B1's tiles, calls and たちぎき | 352 | 24.1 | 9.3 MB |
| A2 | The 7 かわ units with their calls, then their tiles and かわ's breadth | 404 + 82 | 26.2 + 3.2 | 10.0 MB + |
| A3 | すうじ ラッシュ, the bulletins and the weather | 531 | 41.3 | 15.7 MB |
| A4 | The 7 もり units with their calls, their tiles, B4's たちぎき and feature tiles | 565 | 38.0 | 14.5 MB |
| A5 | st-tokyo | 230 | 25.6 | 9.7 MB |

The games' packs went 41 → 89.3 MiB (bank.test's line 92) and the stories' 12.8 → 21.4 MiB (line 23): the stopgap until W2-R.

**Tests:** each game has kinds unit tests (determinism, grade, team, the row's round-trip through `listenOf`, `valid` bounds) and an e2e run solo and co-op (Chromium, logic only); rendering and the weather joins are judged on the iOS Simulator. No relay change: `gm` is free-form on the wire and in rows.

### 4.1 Pending: the listening check

Still flagged after the gate's re-rolls, for the user's ear on the phone (§3.4, pipeline step 6: the flagged clips plus a 20% sample). The whole list is report.json's summary `flagged` (app/scripts/tts/report.json: 195 clips, 2026-11-07); most are whisper's own spellings. By group, the ones worth a listen:

- **The bank (content sprint, 2026-11-06):** whaddaya (ml-w-whaddaya, ya-r-whaddaya), mw-used-to, mw-ya-gonna, ya-w-whydja; voice drift on dya-capital-3, dya-parking-2; over a bed (`cond-wer`), mw-tickets and ya-n-rent; the conditions' d4-landlord-1, d4-installer-3, w2-read, w3-gotta, w3-shouldve.
- **スピード はしご:** number formats, 'em heard as "him", a swallowed "Breakfast's" / "I've"; sp-key-code at 1.4× (UTMOS 3.38); 9 rungs clamped (the tempo's 0.7–1.6).
- **Wave 1 units:** names, homophones and reductions (Marshal, Kicks, two/too, gotta, up ta).
- **A1:** 'em heard "him" (tachi-standup-blocked-3/5), "kinduva trek" (tachi-im-easy-3), "manager's joinin'" (call-handouts-favour-5, `cond-wer`).
- **A2:** tip's (dk-fast-check-2); Kid Cat and Bea as names (dk-pickup-fifteen-2, dk-fast-late-doc-1); "greadon" heard "great in" (kw-great-on, tile-shop-great-on-you); dk-hike-dinner-2 (UTMOS 3.49), dk-dentist-day-4 (similarity 0.49).
- **A3:** none.
- **A4:** couldja heard "Kuja" (wg-n-rsvp); "Will call" heard "We'll call" (tk-will-call-next-1); standin' / citin' / jus' an' (tk-fast-three-3, tachi-deposit-letter-7, tachi-movers-or-truck-8); the heavy signal over "Ugh. So when?" (rp-fast-truck-2, mixed WER 1.0 in every take); cu-r-landlord's café mix ("sell in"); short lines' voice (tk-w-fifty and its tile, sm-eighty-next-3, UTMOS 3.02); the h-drop "but 'is" (tachi-hiring-pick-3); possessives.
- **Stories:** serial-cafe-3-16's "Bean There" (heard "Being there" in every take: a pun on "been there"); serial-tokyo-4-30's "her sister's" (heard "sisters").
- **はつおん ききわけ's pair words** (`pr-*`, kikimimi-mic.md §2.4): 65 single words flagged for low similarity or drift, as single words are; "berry" is heard "Barry" in every take.

A clip fixed after the listen is re-spoken with `PINNED` or a `tts` respelling, then `npm run audio:kikimimi-words`.

## 5. Open questions for the user (the defaults are taken)

1. **News: evergreen or current?** (curriculum Q9.) **Default, taken:** evergreen bulletins we write ourselves, plus today's real Tokyo weather. Nothing to fact-check and nothing goes stale. The alternative is a weekly topical batch, which would need fact-checking.
2. **トーン あて if the clone can't act.** **Default, taken:** ship only if the same voice holds (ECAPA ≥ 0.6) and you can tell the tones apart on the phone; otherwise cut it.
3. **Audio hosting.** Wave 2 took the games' packs from 41 to 89.3 MiB and the stories' from 12.8 to 21.4 MiB. **Default, taken:** R2 behind a same-origin route (W2-R). **Pending your Cloudflare step:** enable R2 in the dashboard, with a bucket and a token. The phones' cache stays a 30 MB LRU. Meanwhile the stopgap is in use: bank.test's lines are raised per batch (the games' 50 → 92 MiB, the stories' 20 → 23), which Pages allows, since it limits files to 25 MiB each and a pack is ≤ 1.2 MB. (The alternative, capping wave 2 at ~30 MB by cutting the news and st-tokyo, was not taken.)

## Sign-off (2026-11-07)

| Reviewer | Verdict | Changes made |
|---|---|---|
| Senior engineer | **Approve with changes** | Code check: the sheet, game.svelte.ts, Play.svelte, Asobu's icon map and kikimimi-budget.ts's page list all branch per game, so "one registry line per game" was false. W2-C is split into C1 (compiler) ∥ C2 (registry, a lazy view slot, data-driven catalog, per-game i18n, a budget glob). `sequenceStarts`/LINE_GAP live in clips.ts and Transcript is at components/kikimimi/, so W2-2's files are fixed. The party bed and `signal` both edited conditions.ts, so they move to a new W2-A. The packs' 50/20 MB lines in bank.test would turn A2 and A5 red, so W2-R is added before them. かわ covers 2 domains, not 3, and a landing order keeps coverage green. まだ can't feed the row-folded SRS with "no row change", so it's a device-local mark. Calls play in memo round 1 (no answerless round). Rush is exempt from near-duplicates among itself. B1 is one agent so the agent cap of 3 holds. ふたりで タイル and サンドで おさらい are cut |
| UX designer | **Approve with changes** | A placement table on the existing shelves: no new hub card, no co-op sub-mode pickers (one co-op rule per mode), ニュース only in じっくり and きまぐれ, ModeDetail showing only a mode's places, サンド on review rows and in solo reveals only (it would stall a co-op reveal) |
| American EFL teacher | **Approve with changes** | US fixes: neighbor, artifacts, "share a few plates", "your prescription's ready" (replaces the overused drowsy line), "are you still working on that?", "would you mind…"; the wedding's gift custom is generic, not ご祝儀. The weather is read as whole sentences in Celsius, as Tokyo reports it. `cja` per memo chip. More C1: 5 of the new たちぎき at やま; calls rebalanced to one per wave-2 unit |
| Learner panel | **Approve** | Every mode ≤ 3 min, tap-only, no streaks or rewards to chase. The panel liked that ニュース gets no hub card and that a ラッシュ miss never ends the run. Self-corrections are now random, not every third order |
