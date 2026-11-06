# ききみみ curriculum wave 2: more content, more ways to listen (signed off, 2026-11-07)

**The user, 2026-11-07:** "work with curriculum team, lets start developing more content. more types and ways of studying."

**The team round.** A curriculum designer (ex-Duolingo/Babbel), an American EFL teacher of Japanese adults, a learning scientist (listening research), a game designer (casual mobile and Animal Crossing), a learner panel (two B1+ adults in Tokyo) and the engineer. Inputs: docs/curriculum.md §7–7.1, docs/curriculum-units.md, docs/kikimimi.md, kikimimi-framework.md and kikimimi-ux.md, the three 2026-11-06 reviews, and the compiled content (app/src/lib/kikimimi/levels/, app/content/) as of aff5e496. Mic modes are out of scope (discussed separately).

**The verdict in five lines:**
1. Single-speaker items are plentiful. Missing: three-speaker talk (0 items), anything over 30 s (1 item), rebuilding what you heard (0 shipped), phone errands with notes (0 shipped), units in every domain but たび, しごと, ともだち and イベント, and the B2 sound features (h-drop, chains, assimilation, fillers: 0 tagged).
2. 100 items for three new modes are already drafted (60 tiles, 20 calls, 20 たちぎき) and only need a game: the cheapest new ways of studying.
3. Build one feature and five modes, in this order: よみきき サンド, ことば タイル, たちぎき, ようじ でんわ, すうじ ラッシュ, しずえの ニュース. トーン あて is a spike only.
4. Write 14 units, 7 at かわ and 7 at もり, so both stages pass the compiler's coverage rule (≥ 7 of 9 domains). Today かわ covers 2 and もり 2.
5. Wave 2 adds ~60 MB of audio. Today the games' packs are 41 MB (bank.test's line: 50) and the stories' 12 MB (line: 20). Both lines are crossed by wave 2, so the packs move to R2 (W2-R) before audio batch A2.

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
- **Effort:** S (0.5 d). No content, no audio.

### 2.1 ことば タイル: rebuild what you heard

- **Solo (2½ min):** 6 sentences. The clip plays once with no tiles; then the sentence's words plus 1–4 decoys appear; tap them into order. Replay is free (counts as "hard"). The reveal shows the **spoken shape** over the written one (should've → *shoulda*), then `ja`, `why` and ▶︎.
- **Co-op:** one board, odd slots for role 0, even for role 1 (`roles: 2`); `team` is the union. Both hear the same clip in one room.
- **The skill:** segmentation, weak forms, contractions, h-drop, elision, chains, linking.
- **The content:** the `tile` schema (content/listen/README.md): **53 drafts** (60 less the 7 duplicates of bank lines, folded into their bank items), **76 derived** from voiced bank items by scripts/kikimimi-tiles.ts (tiles from `en`, decoys from a weak-form/contraction/near-sound table) then reviewed by a person, and 30 new for the zero-count features.
- **Tiers:** easy 1 decoy and the first tile placed; hard 3–4 decoys.
- **The framework:** GameDef `tile`; answer ≤ 12 ints (in the contract); `pick` the wrong-slot bitmask (fits the row's 0–4095). A tap-to-place TileBoard that wraps at 393 px. The derived tiles play their bank item's clip from its level's pack.
- **The audio:** ~83 new clips (≈ 4 min, ~1.5 MB) over the 12 US voices.
- **The risks:** a grammar puzzle (sound decoys only, tiles hidden until the first listen ends); overflow (≤ 12 tiles).
- **Effort:** S–M (2 d game; content in B1).

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
- **The audio:** 30 conversations × ~9 lines ≈ 270 clips, ≈ 22 min, ~8 MB; three distinct voices per item (ECAPA ≤ 0.64 between them); the party bed (W2-A).
- **The risks:** overlap masking the answer (overlap only on lines whose start carries none, −0.2 to −0.5 s); voices hard to tell apart (mixed genders, faces bob while speaking).
- **Effort:** M (2.5 d).

### 2.3 ようじ でんわ: phone errands that change mid-call

- **The loop (2½–3 min):** 3 calls of 20–40 s on the NookPhone frame. A villager asks for something, then changes it ("oh, actually, make that two"). Fill a memo of 2–4 chip rows (what, how many, when, where). The reveal fills the errand's basket or bag with what you caught.
- **Rounds:** 2 per call (6 a game, ≤ the row's 12): the call plays in memo round 1; round 2 has `play` 0.
- **Co-op 「わけて メモ」:** both hear the whole call; the slots split by role; the team's memo is the union.
- **The skill:** multi-detail listening, self-repair, phone-band audio, a detail remembered late.
- **The content:** the `call` schema: 20 drafts (s1-call, s2-call-a/b, s3-call) and **16 new**: 8 at かわ, 8 at もり (one per wave-2 unit for its チェック, plus a spare each). Settings: konbini, a prescription pickup, a delivery slot, a restaurant booking.
- **Tiers:** easy 2 slots; hard 4 slots and an extra distractor chip.
- **The framework:** GameDef `call`, a MemoPad of chip rows, PhoneFrame reused (its bars drop on `signal` lines).
- **The audio:** 36 calls × ~7 lines ≈ 250 clips, ≈ 18 min, ~6.5 MB; phone band, and the `signal` condition (W2-A) never over a memo answer.
- **The risk:** form fatigue. 3 calls only, chips not typing, the basket payoff.
- **Effort:** M (3 d).

### 2.4 すうじ ラッシュ: a café rush of numbers

- **The loop (2 min):** 8 customers at マスター's counter. Each says a 1–2 line order with prices, times, quantities, table numbers or dates; about a third (at random, not every third) correct themselves. Tap the right ticket of 3–4 chips. A combo meter fills on first-listen rights; a miss doesn't end the run (the customer repeats).
- **Settings:** a café, a konbini, a ticket counter, a deli, a taxi fare, a prescription pickup.
- **Co-op:** two registers, customers alternating by role, one shared queue. しょうぶ: the same queue, scored against expectation (the たいかい rule).
- **The skill:** numbers at speed, self-repair, teen/ty, yen and dollars.
- **The content:** template-made. scripts/kikimimi-rush.ts expands seeded frames (speaker × setting × number × correction) into content/listen/s1-rush.yaml and s2-rush.yaml, ~240 lines, with `ctx`, `cja` and `why` from each frame ("make that three: 最後の 数が 答え"). A person samples 20%. Rush items are exempt from the near-duplicate gate among themselves (one frame makes many).
- **Tiers:** easy 3 chips; hard 4, the pre-correction value always among them.
- **The framework:** GameDef `rush`, `num`-like kinds with an 8 s answer window (the lobby's なし turns it off), ChoiceGrid, a small Counter stage.
- **The audio:** 240 clips over the 12 US voices, ≈ 12 min, ~4.3 MB, on the café bed.
- **The risk:** a TOEIC drill. In-character lines and the combo meter.
- **Effort:** S–M (1.5 d game, 0.5 d generator).

### 2.5 しずえの ニュース: the morning bulletin

- **The loop (≈ 2 min):** しずえ's 60–75 s bulletin in three segments (an island or seasonal item, a Tokyo-life item, **today's real weather**), then 3 taps: gist, a detail, 「傘は いる？」. One bulletin a day, picked by the date; segment replay allowed.
- **Where:** じっくり, and in きまぐれ's rotation in the morning. No hub card of its own, no streak.
- **Co-op:** together, one shared answer count.
- **The skill:** news register, signposting, extended listening; the bridge to ほし.
- **The content:** 30 evergreen bulletins we write (open question 1's default), content/listen/news-a.yaml and -b.yaml, tagged by season and weekday.
- **The weather tail:** one clip per **whole sentence**, joined only between sentences: 8 conditions, highs −2…38 °C ("a high of twenty-three degrees": Celsius, as Tokyo reports it), 6 alerts ≈ 55 clips. The data is the relay's Open-Meteo `wx` (sync/wx.ts); without it the bulletin ends after segment 2 and the weather question is skipped.
- **Tiers:** easy asks the gist and the umbrella; hard adds the detail.
- **The framework:** GameDef `news`, segment rounds, answers after play; a NewsStage with しずえ at her desk (PaFrame-like).
- **The audio:** 90 segments + 55 weather ≈ 35 min, ~12 MB; one fixed US newsreader voice, −18 LUFS like the stories.
- **The risks:** "homework" (60 s, the weather hook, no streak); choppy joins (sentence joins only, checked on the iOS Simulator).
- **Effort:** M (2 d game; content in B5).

### 2.6 トーン あて (conditional)

One line spoken three ways (sincere, sarcastic, resigned), matched to a face or to what happens next. **Spike (1 d):** 10 lines × 3 tones through Qwen3-TTS with style instructions against the Base clone. It passes only if the voice holds (ECAPA ≥ 0.6 to the cast's reference) **and** the user, on the phone, tells the takes apart blind. Pass: S, a quiz kind of 3 clips. Fail: cut; attitude stays word-borne (`mean`).

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

**Landing order (keeps main green):** at かわ, land the 5 domain units before gl-intro and gl-invite. At 10 かわ units the coverage check turns into an error, and it fails if fewer than 7 domains are in by then.

**Lessons:** each unit ships on recipe v1 (playable at once) with its call and tiles already written in content/listen/. W2-9 flips it to v2: おと = 6 tiles from the unit's lines; じっせん = a ladder, or a たちぎき where one fits; チェック = 1 call (2 memo rounds) + 4 quiz items (a 6-answer row, 5 of 6 stamps it). The 7 wave-1 units stay on v1 until they have calls (wave 3).

**Not in wave 2:** やま and ほし units (351 level items between them; daily conversation comes first). Wave 3 opens やま with idioms and group talk on たちぎき. C1 practice in wave 2 comes from s3 tiles, calls and たちぎき, the 5 new やま たちぎき, and ニュース.

### 3.2 More items for the thin spots

| Where | What | How many |
|---|---|---|
| Tiles | h-drop, chain, assimilation, elision, filler, stress | 30 (5 each) |
| Calls | かわ 8, もり 8 (the units' チェック) | 16 |
| たちぎき | もり 5, やま 5, in the thin situations | 10 |
| かわ level 3 breadth | introductions, invitations, compliments, weather small talk, emergencies (a lost wallet, a koban, an earthquake drill) | 40 |
| `ctx` back-fill | levels 1–3 (138), L4 (36), units (40) | 214, text only |
| Cleanup | fold the 7 duplicate tiles; spread Osaka, refunds, bill splits, "actually"; the bank's US-lint hits | – |

**Bedtime: a third serial, 「トウキョウ ひとりぐらし」** (st-tokyo), 7 chapters of ~4 min. An American newcomer's first month in Tokyo (the konbini, the ward office, a festival, the first earthquake drill) in US English, recycling the units' phrases; narrator us-f3, villagers as the people she meets. With 10 chapters a nightly listener runs out in under two weeks. More ジョニー chapters wait until st-tokyo is played. ~28 min, ~11 MB: past the stories' 20 MB line, so A5 needs W2-R.

### 3.3 Visuals

Seven painted backdrops: `party`, `restaurant`, `shop`, `clinic`, `park`, `konbini`, `lobby` (tr-hotel already names it). The existing pipeline (scripts/scenes/, Z-Image-Turbo, paper style, 1x/2x/3x webp) on the second Mac, throttled against the food images and never during a TTS batch.

### 3.4 Volume, pipeline and gates

| | Items | New clips | Audio | Packs |
|---|---|---|---|---|
| 14 units | ~420 (~70% inline) | ~630 | ~45 min | ~17 MB |
| Tiles | 159 (76 reused) | ~83 | 4 min | 1.5 MB |
| Calls | 36 | ~250 | 18 min | 6.5 MB |
| たちぎき | 30 | ~270 | 22 min | 8 MB |
| すうじ ラッシュ | 240 | 240 | 12 min | 4.3 MB |
| しずえの ニュース | 30 + weather | ~145 | 35 min | 12 MB |
| かわ breadth | 40 | 40 | 3 min | 1 MB |
| st-tokyo | 7 chapters | ~230 | 28 min | 11 MB |
| **Total** | **~1,000 rounds** | **~1,900** | **~2.8 h** | **~60 MB** (games 41 → ~90, stories 12 → ~23) |

Synthesis is ~3–4 GPU hours (Qwen3 at RTF ~0.65 on the M5 Max, with re-rolls and whisper). The human listen is the bottleneck.

**Pipeline:**
1. **Seed sheet** (the lead): can-do, phrases, sound, host and scene, §5.5 seeds; for modes the kind and tier sets.
2. **Draft** (one author per file): `en`; `tts` (a respelling only where the reduction matters, **never** one that voices the distractor); `ja`; `note` (≤ 40 字); `ctx` (≤ 30 字, the situation, never the answer); `cja` (one per choice or chip, no English); `why` (≤ 90 字, names the trap); tags. Per kind: tile `ctx`, `ja` and a `why` naming each decoy's trap; call `ctx` per call, `cja` per chip, `why` per memo round; たちぎき `ctx` and `why` per round; news `ctx`, `cja` and `why` per question; rush from its frame.
3. **Machine gates** (CI; errors past draft): schema and ids; helpProblems over the new kinds; **the US-only lint** (a UK/AU list: mate, cheers for thanks, queue, flat, lift, fortnight, reckon, fancy, half nine, neighbour, realise…; an error on content/listen and units, a warning on the bank until B7 clears it; `accent-exposure` items exempt); digit-free `tts`; phrase and recycling rules; coverage; near-duplicates (TF-IDF > 0.42; rush only against the rest of the bank); the chunk budgets.
4. **Human review before voicing** (per batch, a short report in docs/reviews/): an EFL teacher, a US scriptwriter, a Japanese reviewer. Natural for an American friend or clerk; one clearly best answer; the second distractor the real trap; `ctx` without the answer; natural Japanese in `cja` and `why`; kana in character speech, kanji in sheet copy, one spelling per term.
5. **Voicing:** `npm run audio:kikimimi` (whisper gate, ECAPA ≥ 0.5, re-rolls); conditions mixed after the gate.
6. **Listening check:** the user, on the phone, every flagged clip plus a 20% sample; only then `listened` and shipped.
7. **Tuning:** a week of play; grow a stage only at 75–85% first-listen success.

## 4. The build plan

One agent per increment, disjoint files, each landing green on main and playable on its own. ≤ 3 agents at once (the ACC proxy), one GPU job at a time. Audio batches are script runs by the lead, not agent slots.

| # | Increment | Files it owns | Depends on | Effort |
|---|---|---|---|---|
| **W2-C1** | Compiler for the new kinds: content/listen/*.yaml → `levels/parts/<file>.json` (≤ 32 KB gz) and the index's `games` entries; the listen-kinds checker (content.test's rules move into it); the help checks and the US-only lint; the kinds' clip ids for voicing | kikimimi/compile.ts, a new kikimimi/listen.ts, content.test.ts, scripts/kikimimi-audio.ts, scripts/kikimimi-levels.ts | – | 1 d |
| **W2-C2** | Runtime registry: lazy per-game chunks (GameDef + a `view` loaded by `import()`), a per-game `deal`/`chunks`/seed hook so decks.ts and game.svelte.ts stop branching per game, a view slot in the sheet; the catalog data-driven (each mode's shelf, icon, places; playable = the index has its content and the registry its game), all five modes pre-registered; per-game i18n catalogs (`addCatalog`, as food.ts); kikimimi-budget.ts globbing each game's folder and frame/Sandwich at 15 KB | round/registry.ts, components/kikimimi/decks.ts, game.svelte.ts, KikimimiSheet.svelte, Play.svelte, catalog.ts, asobu/Asobu.svelte, mode/ModeDetail.svelte, games/versions.ts, scripts/kikimimi-budget.ts | – | 1 d |
| **W2-0** | よみきき サンド | frame/ReviewList, frame/RevealFrame, new frame/Sandwich.svelte, srs.ts (the device mark), its i18n keys | W2-C2 (budget line) | 0.5 d |
| **W2-A** | Conditions: the party bed (babble from our own clips) and `signal` (dropouts plus codec artifacts) | kikimimi/conditions.ts, bank.ts (Bed/Cond), scripts/kikimimi-beds.ts, scripts/tts/beds/; the dropout step in kikimimi-audio.ts | W2-C1 | 0.5 d |
| **W2-1** | ことば タイル | games/tile/, components/kikimimi/tile/, i18n/kiki-tile.* | W2-C1, C2 | 2 d |
| **W2-2** | たちぎき | games/tachi/, components/kikimimi/tachi/, Transcript.svelte (seats), clips.ts (offsets), clipPlayer.svelte.ts, i18n/kiki-tachi.* | W2-C1, C2 | 2.5 d |
| **W2-3** | ようじ でんわ | games/call/, components/kikimimi/call/ (MemoPad, basket), i18n/kiki-call.* | W2-C1, C2 | 3 d |
| **W2-R** | Packs on R2 behind `PACK_BASE` (same-origin route; URL scheme unchanged); bank.test's 50/20 MB lines then measure what Pages serves | packs.ts, the Pages route, bank.test.ts, docs/ops | open question 3, the user's Cloudflare step | 0.5 d |
| **W2-4** | すうじ ラッシュ | games/rush/, components/kikimimi/rush/, scripts/kikimimi-rush.ts, content/listen/s*-rush.yaml, i18n/kiki-rush.* | W2-C1, C2 | 2 d |
| **W2-5** | しずえの ニュース | games/news/, components/kikimimi/news/, the weather tail, i18n/kiki-news.* | W2-C1, C2 | 2 d |
| **W2-6** | Tone spike | scripts/tts/ (an experiment outside the build), a report | – | 1 d, GPU idle |
| **W2-9** | Recipe v2 (the lesson loads its kinds' chunks before its deck) | kikimimi/lesson.ts, units.ts (RECIPES [1, 2]), stages.ts, games/lesson/ | W2-1, W2-3 | 1.5 d |

After W2-C1/C2 a game lane adds only its own folder, i18n file and one registry line. **W2-C1 landed 2026-11-07.** The part and index shapes, the clip ids and where the help goes are in kikimimi-framework.md "Listen parts as built". W2-C1 ∥ W2-C2 (disjoint). W2-1 ∥ W2-2 ∥ W2-3. W2-4 ∥ W2-5.

**Content lanes** (YAML/text only, one author per file; each batch reviewed before its audio):

| Lane | Work | Files | Effort |
|---|---|---|---|
| B1 | The US pass and `ctx`/`cja`/`why` on the 100 drafts; fold the 7 duplicate tiles; the 76 derived tiles (script plus review). One agent, in turn: tiles, calls, たちぎき | content/listen/s*-tile*, s*-call*, s*-tachi*, scripts/kikimimi-tiles.ts | 1.5 d |
| B2 | Wave 2a: 7 かわ units, each with its call and tiles (the landing order above) | content/units/{gl-intro,gl-invite,fd-order,sh-shop,hm-neighbor,hl-clinic,mc-weekend}.yaml, content/listen/s1-call-b.yaml | 3 d |
| B3 | Wave 2b: 7 もり units, the same | content/units/{ev-wedding,fd-dinner,hl-doctor,hm-repair,sh-phone,fr-catchup,mc-tickets}.yaml, content/listen/s2-call-c.yaml | 3 d |
| B4 | たちぎき 10, feature tiles 30, かわ breadth 40 (level 3's decks and their golden change: one commit) | content/listen/s2-tachi-c, s3-tachi-c, s2-tile-b; src/lib/kikimimi/content/kawa-b.ts plus its line in content/index.ts | 2 d |
| B5 | 30 bulletins and the weather sentences | content/listen/news-a/-b.yaml | 1 d |
| B6 | st-tokyo, 7 chapters | content/listen/story/st-tokyo.yaml | 1.5 d |
| B7 | `ctx` back-fill (214) and the bank's US-lint hits | bank1.ts, bank4.ts, the 7 wave-1 unit YAMLs (text only; deck goldens unchanged) | 0.5 d |
| ART | 7 backdrops | static/art/scene/, scripts/scenes/ | 0.5 d (second Mac) |

**Audio batches** (sequential on the M5 Max, each after its review; the user listens on the phone after each):

| Batch | Content | Clips | Needs | Unblocks |
|---|---|---|---|---|
| A1 | B1's drafts and derived tiles (53 tiles, 20 calls, 20 たちぎき), party and signal | ~360 | B1, W2-C1, W2-A | W2-1..3 playable (~47 MB: under the line) |
| A2 | Wave 2a units with their calls + かわ breadth | ~360 | B2, B4's breadth, **W2-R** | the partner's かわ path |
| A3 | Rush + news + weather | ~385 | W2-4's generator, B5 | W2-4, W2-5 |
| A4 | Wave 2b units with their calls + B4's たちぎき and tiles | ~560 | B3, B4, **wave 1's first week of rows** | もり; recipe v2 |
| A5 | st-tokyo | ~230 | B6, W2-R | stories |

**Order** (≤ 3 agents):
1. W2-C1 ∥ W2-C2 ∥ B1. When the C lanes finish: W2-0 and W2-A. Then A1.
2. W2-1 ∥ W2-2 ∥ W2-3. When W2-1 finishes: W2-R, then B2.
3. W2-4 ∥ W2-5 ∥ B2 (or B3). Then A2 and A3.
4. W2-9 ∥ B3 ∥ B4, then B5 and B7. A4 when wave 1's rows allow.
5. B6 and A5; ART on the second Mac at any point; W2-6 whenever the GPU is idle.

**Tests:** each game gets kinds unit tests (determinism, grade, team, row round-trip through `listenOf`, `valid` bounds) and one e2e run solo and one co-op (Chromium, logic only). Rendering and the weather joins are judged on the iOS Simulator. No relay change: `gm` is free-form on the wire and in rows.

## 5. Open questions for the user (the defaults are taken)

1. **News: evergreen or current?** (curriculum Q9.) **Default, taken:** evergreen bulletins we write ourselves, plus today's real Tokyo weather. Nothing to fact-check and nothing goes stale. The alternative is a weekly topical batch, which would need fact-checking.
2. **トーン あて if the clone can't act.** **Default, taken:** ship only if the same voice holds (ECAPA ≥ 0.6) and you can tell the tones apart on the phone; otherwise cut it.
3. **Audio hosting.** Wave 2 takes the games' packs from 41 to ~90 MB and the stories' from 12 to ~23 MB. **Default, taken:** R2 behind a same-origin route (W2-R, before A2). It needs your Cloudflare step: an R2 bucket and a token. The phones' cache stays a 30 MB LRU. If R2 isn't ready by A2, the stopgap is to raise bank.test's lines, since Pages limits files to 25 MiB each and packs are ≤ 1.2 MB. The alternative is to cap wave 2 at ~30 MB by cutting the news and st-tokyo.

## Sign-off (2026-11-07)

| Reviewer | Verdict | Changes made |
|---|---|---|
| Senior engineer | **Approve with changes** | Code check: the sheet, game.svelte.ts, Play.svelte, Asobu's icon map and kikimimi-budget.ts's page list all branch per game, so "one registry line per game" was false. W2-C is split into C1 (compiler) ∥ C2 (registry, a lazy view slot, data-driven catalog, per-game i18n, a budget glob). `sequenceStarts`/LINE_GAP live in clips.ts and Transcript is at components/kikimimi/, so W2-2's files are fixed. The party bed and `signal` both edited conditions.ts, so they move to a new W2-A. The packs' 50/20 MB lines in bank.test would turn A2 and A5 red, so W2-R is added before them. かわ covers 2 domains, not 3, and a landing order keeps coverage green. まだ can't feed the row-folded SRS with "no row change", so it's a device-local mark. Calls play in memo round 1 (no answerless round). Rush is exempt from near-duplicates among itself. B1 is one agent so the agent cap of 3 holds. ふたりで タイル and サンドで おさらい are cut |
| UX designer | **Approve with changes** | A placement table on the existing shelves: no new hub card, no co-op sub-mode pickers (one co-op rule per mode), ニュース only in じっくり and きまぐれ, ModeDetail showing only a mode's places, サンド on review rows and in solo reveals only (it would stall a co-op reveal) |
| American EFL teacher | **Approve with changes** | US fixes: neighbor, artifacts, "share a few plates", "your prescription's ready" (replaces the overused drowsy line), "are you still working on that?", "would you mind…"; the wedding's gift custom is generic, not ご祝儀. The weather is read as whole sentences in Celsius, as Tokyo reports it. `cja` per memo chip. More C1: 5 of the new たちぎき at やま; calls rebalanced to one per wave-2 unit |
| Learner panel | **Approve** | Every mode ≤ 3 min, tap-only, no streaks or rewards to chase. The panel liked that ニュース gets no hub card and that a ラッシュ miss never ends the run. Self-corrections are now random, not every third order |
