# ききみみ curriculum: what is taught, and the content

What ききみみ teaches, how content gets harder, the units and what's written. The games: [kikimimi.md](kikimimi.md);
the engine and audio pipeline: [kikimimi-engine.md](kikimimi-engine.md); speaking: [kikimimi-mic.md](kikimimi-mic.md);
the listening files' schemas: app/content/listen/README.md; what isn't built: kikimimi.md "Open items".

## Goals

| | |
|---|---|
| **Learners** | ウェイ and うめ at one level, one track: Japanese adults in Tokyo, TOEIC 700+, strong listening (B1+ → C1). The gaps a 700 hides: fast, reduced, overlapping and indirect speech; phone and PA audio; group and long talk. The guest keeps its own private record. |
| **Goal** | Everyday conversation and travel (not work, not exams) on the first listen; then conversational C1 (implied meaning, attitude, overlap, accents), not lectures. |
| **Focus** | Listening; speaking only in the opt-in mic modes. |
| **Sessions** | ~15 min a day, a game 2–3 min, solo or 2–3 live. No push notifications. |

The core band is **B1+ → B2 → C1**; A1/A2 is a warm-up and placement floor. Difficulty comes from the **conditions**
(speed, reduction, overlap, noise, channel, accent, hesitation, self-repair) and the **pragmatics** (an implied
refusal, sarcasm, hedging, a joke), never an obscure noun.

## Principles

1. **Real life in island clothes:** villagers are the cast, NH the dressing; situations, money and stakes are adult and
   real ("The island frame").
2. **Listen first, read after:** no text before or during the clip (`ctx` sets the situation); transcript, marks and
   Japanese at the reveal.
3. **The first listen is the measure** (「1回目で正解」); replays are free but grade "hard" for spaced repetition.
4. **Conditions, not vocabulary:** tagged levers, one turned at a time, so a miss is diagnosable.
5. **Many talkers:** a contrast or phrase counts as covered once heard from ≥ 4 voices; many American voices (ages,
   timbres, a light Southern and New York voice), not many accents.
6. **Co-op over ranking**; ranking is opt-in (勝負).
7. **Results private, summaries shared** (kikimimi.md "Storage").
8. **Teach the trap, not grammar:** one Japanese line on why it fooled you (`note`, ≤ 40 字), `why` for the full
   解説; no grammar terms.
9. **Short, never homework:** ≤ 3 min a game, tap only, no streaks; the one keyboard is 音の へんしん's dictation, tiles
   beside it.
10. **Measure before scaling:** a stage grows only at 75–85 % first-listen success in real play.

## American English first

Every item and line is American: US vocabulary, spelling, dates, norms, dollars (when not yen or ベル), a US voice
(`voice: 'us'`, cast `us-*`); no UK/AU slang (mate, queue, flat, fortnight, reckon…). UK and AU appear only as
**accent exposure at やま and ほし**: ≤ 10 % of each, tagged `accent-exposure`, standard international English. はまべ,
かわ, もり and every unit and listening file are 100 % US. bank.test's accent policy enforces the shares, listen.ts
`notUs` the wording.

## Stages and can-dos

Stages are places, never やさしい / むずかしい; the UI shows ★ (kikimimi.md "Places"). L5 is the アナウンス pack beside
もり (bank.ts `levelRank`), not a stage.

| Stage | CEFR | Role | Listening can-do ("I can…") | Rate (syl/s) | Conditions |
|---|---|---|---|---|---|
| **S0 はまべ** ★ | A2–B1 | floor, warm-up (L1–L2) | catch numbers, prices and key words in clear single sentences | 3.0–3.8 | studio-clean |
| **S1 かわ** ★★ | B1+ | entry (L3) | follow casual exchanges at natural speed (weak forms, contractions, gonna), phrasal verbs and indirect replies; catch service-talk details | 3.8–4.5 | 1–2 speakers, light café or street noise |
| **S2 もり** ★★★ | B2 | core (L4) | follow native-speed talk between 2–3 people, phone calls and announcements; tell attitude and implied refusals; follow self-corrections ("Thursday — no, Friday") | 4.5–5.2 | overlap, phone band, PA reverb, SNR to +10 dB |
| **S3 やま** ★★★★ | B2+ | core (L6) | follow fast group talk with interruptions, meetings, voicemail and support calls with complications; catch sarcasm, hedging, humour; cope with a less familiar accent | 5.0–5.8 | 3 speakers, interruptions, SNR to +5 dB; UK/AU ≤ 10 % |
| **S4 ほし** ★★★★★ | C1 | stretch (L7) | follow podcasts, news, lectures and debates on unfamiliar topics; infer stance; follow structure | casual 5.5–6.2, news ~4.5 dense | long-form; UK/AU ≤ 10 % |

**The sound-feature sequence** (one primary per unit, earlier ones reviewed; stages.ts `STAGES`):

| Stage | Primary features |
|---|---|
| S0 | L/R, the æ/ʌ/ɑ contrasts, -teen/-ty, can/can't, final -s/-ed, katakana stress |
| S1 | weak forms (to/for/of/and/can/have/them), contractions ('d, 'll, 've), US flapping, t/d elision, yod coalescence (did you, would you), gonna/wanna/gotta, the US glottal stop |
| S2 | fluent let me / have to / did you, 'cause, h-dropping (tell him), assimilation (ten minutes), contrastive stress, attitude intonation, fillers and false starts |
| S3 | very fast casual speech, overlap and turn-taking, sarcasm prosody, upspeak, light US regional voices; UK/AU exposure |
| S4 | news-reader density, academic stress shifts (PHOtograph/phoTOgraphy), signposting, argument structure |

## Tracks

Strands inside units (each unit has one; reviews mix them).

| Track | Content | Weight S1 / S2 / S3 / S4 |
|---|---|---|
| **Life** | shops, trains, the doctor, the bank, the landlord, travel, phone support | 50 / 35 / 25 / 10 |
| **People** | friends, the partner, group chats, parties, gossip, humour, slang, idioms in character | 35 / 35 / 30 / 20 |
| **Work** | small talk, meetings, video calls, requests, negotiation, feedback | 10 / 20 / 30 / 25 |
| **Broadcast** | announcements, しずえ's news, K.K.'s radio, フータ's talks, podcasts, story serials | 5 / 10 / 15 / 45 |

## Scenarios

### The generator

A scenario seed takes one value per dimension; an author scripts it, and its tags go on every item so difficulty
turns one lever at a time.

| Dimension | Values (examples) |
|---|---|
| **Setting** | konbini, station, airport, hotel, café, doctor, bank, phone support, landlord, gym, office, party, home, shop, taxi, broadcast |
| **Goal** | get information, buy, book or change, fix a problem, complain, ask a favour, invite or decline, plan, directions, an opinion, negotiate |
| **Complication** | sold out, a delay or gate change, a wrong bill, a misheard name or number, a mind changed, a policy refusal, on hold, a bad line, a speaker cutting in |
| **Register** | service (polite), colleague, boss/client (deferential), friend (casual), partner (teasing), neighbour (careful), official, broadcaster |
| **Speech conditions** | "Difficulty levers" |
| **Pragmatic layer** | literal; indirect request; implied refusal ("I'll see what I can do"); hedging; sarcasm; humour; understatement; politeness formula vs real meaning; small-talk ritual |

### Question angles

One recording yields several question types: gist, detail / number, inference, attitude, next line, repair (which
detail was corrected), rebuild (ことば タイル).

### Difficulty levers

An item's difficulty is the sum of its steps; adaptivity moves one lever at a time. Noise built so far: +15 dB (light)
and +10 dB (heavy) (kikimimi-engine.md "Conditions"); +5 dB waits for S3 content.

| Lever | Step 0 | Step 1 | Step 2 | Step 3 |
|---|---|---|---|---|
| Rate | careful (S0) | natural | brisk | fast casual |
| Reduction | citation | contractions | weak forms + flaps | chains (whaddaya, dunno) |
| Speakers | 1 | 2, turn by turn | 2 with overlap | 3 with interruptions |
| Noise (SNR) | clean | +15 dB | +10 dB | +5 dB |
| Channel | studio | room | phone/voicemail | PA reverb, video dropouts |
| Accent | General American, one voice | many US voices | light US regional | UK/AU exposure (S3–S4, tagged) |
| Disfluency | none | fillers | false starts | self-correction that changes the answer |
| Pragmatics | literal | indirect | implied refusal/hedge | sarcasm, irony, humour |
| Distractors | far | heard in the clip | the corrected value | the plausible wrong inference |
| Length | 1 line | 3–6 lines | 30–60 s | 2–6 min, segmented |
| Support | 🐢 slow take | replay | segment replay | one play only |

### The island frame

The frame is Animal Crossing, the content real: villagers play people; real-world scenes use real currencies and
places; ベル and island settings only in island content (S0, しずえ's island news). Generated art never shows an NH
character. NH's cast take the roles that fit (ロドリー at the airport desk, カッペイ driving, まめきち・つぶきち at the
counter, マスター at the café, つねきち the suspicious caller, しずえ's broadcast, フータ's talks); villagers play the rest.

### The scenario bank

The 70 seeds (setting: goal → complication, register / conditions / pragmatic layer, first stage) are in
[app/content/listen/seeds.md](../app/content/listen/seeds.md).

### Personality and register

Personality keeps register memorable: jock (hype), peppy (upspeak), snooty (understatement), lazy (food), cranky (dry
humour), smug (jargon), sisterly (blunt advice), normal (polite requests).

## Modes

What each game trains and why it's there (rules: kikimimi.md, kikimimi-engine.md "The games"), ranked by learning
value for two B1+ learners × fun × cost: phonemic drills at the floor; tasks with complications, overheard talk and
long-form above.

| Mode | Trains | Notes |
|---|---|---|
| ひとこと クイズ (levels 1-7) | replies, pragmatics (`mean`, `gist`, `next`), numbers in context | the base game |
| アナウンス (level 5) | channel and noise tolerance: PA, voicemail, IVR menus | |
| スピード はしご | rate tolerance, reductions | rungs climbed in order on the first listen; stops at the first miss |
| 音の へんしん | decoding connected speech (reductions, flaps, linking, elision, weak forms) | daily, 8 phrases: the full form, then dictation ("Connected speech") |
| ことば タイル | segmentation of natural-speed speech: weak forms, contractions, linking, numbers, stress | plain sentences, sound-trap decoys, tiles only after the first listen (content/listen/README.md "tile") |
| たちぎき | tracking 3 speakers, attitude, mind change, inference through overlap | the only three-speaker training |
| ようじ でんわ | multi-detail listening, self-repair, phone audio | chips, not typing; the units' チェック |
| すうじ ラッシュ | numbers at speed, self-repair, teen/ty, yen and dollars | template-made; a miss never ends the run |
| しずえの ニュース | news register, signposting, extended listening; the bridge to ほし | real weather as the hook; evergreen bulletins |
| しゅうまつ たいかい | retrieval, spacing, interleaving, hypercorrection (the wager) | levelled per player so either can win |
| まるごと 聞く | 2–5 min conversations heard whole | every place; "Long listening" |
| おやすみ ものがたり | extensive listening at 95 %+ comprehension | no score; serials st-johnny, st-cafe, st-tokyo |
| よみきき サンド | listen → read → listen (metacognition) | no new content; blind first play |
| おさらい, みみ チェック | spaced review of misses; placement | |
| the mic modes | prosody, sentence rebuilding, minimal pairs in production | private, opt-in (kikimimi-mic.md) |

**Cut:** minimal-pair fishing (barely transfers at TOEIC 700+), riddles, karaoke, ふたりで タイル (the two roles cover
the information gap), turn-taking tap games, humour games (hard for TTS), ながら ききみみ (WebKit suspends audio on
lock).

## Visual rules

Scene cards show the setting and speakers, never the words or outcome; transcripts and marks only at the reveal; no NH
character in generated backdrops (kikimimi.md "Visuals").

## Audio and script rules

- **Voices** (the cast: kikimimi-engine.md "Generation"): ≥ 4 per minimal-pair contrast and target phrase; designed
  voices only, never a cloned real person; exposure voices only at S3–S4, tagged.
- **🐢** is an atempo stretch at 0.75, L1–L2 only (it kept UTMOS); from L3 a stretch would undo the reductions, so
  support is replay and the transcript.

The text rules (`en`, `tts`, numbers, punctuation, the Japanese fields) are app/content/listen/README.md's "Text
rules" and "Every item"; the quiz's `tts` may also respell (gonna, lemme, 'cause, d'you), never so it voices the
distractor.

| Rule | Detail |
|---|---|
| Disfluency on purpose | fillers, false starts, self-corrections, written in. |
| Rate by style | in the text, not stretching (except スピード はしご's rungs). |
| Multi-speaker | one clip per line; overlap on the audio clock (a negative `at`), never baked. |
| Conditions | mixed offline from the clean master (kikimimi-engine.md "Conditions"). |
| Checks | the gate (kikimimi-engine.md "Generation"); reductions aren't machine-checked: the listening check covers them. |
| Tags | `features[]`, `register`, `conditions[]`, `pragmatic`, `seed` on every item from level 4: they drive the levers, review and skills. |
| Licence | all scripts original: no copyrighted lyrics, broadcasts or news audio. |

## Placement and spaced repetition

Placement: kikimimi-engine.md "みみ チェック"; ability, cards and おさらい: kikimimi.md "Progress & feedback" (aim
75–85 %; a missed day only means more due cards, ≤ 8).

## The couple

Who sees what: kikimimi.md "Storage". Co-op by default; per-player tiers on the same audio; 勝負 scored against
expectation where a game supports it (the tournament, すうじ ラッシュ), so a lower level can win.

## Units

The units are the path's stops (kikimimi.md "しまの みち"): one situation, one can-do, three short games.

### The spine

The stage is the spine, units its stops. A **domain** is a tag, not a map place: ともだち, いえ, たべもの, かいもの, たび,
しごと, イベント, まち, からだ (stages.ts `DOMAINS`). **Coverage** (compiler-checked): each stage covers ≥ 7 of the 9, no
domain over 25 % of it (a warning until the stage has its planned units). **Glue anchor units** (introducing, inviting,
asking for clarification, ending a conversation) open each stage.

### A unit

- **One situation, one can-do**, from the CEFR Companion Volume's listening scales:
  「[だれ]が [なにを する]のを [どんな じょうけんで] きいて、[じょうほう／いと]が わかる」, an English sentence ("I can follow
  …, and catch/tell …") and a one-line `short` for the UI.
- **6–10 key phrases** (`ph`), each with register, scene and the trap a Japanese speaker falls into, heard in ≥ 3 items
  by ≥ 2 voices; ≥ 20 % of a unit's items recycle a lower stage's or the anchors' phrases. A phrase is **caught** when
  right on the first listen in 3 items on ≥ 2 days.
- **A host villager, a scene, one main sound feature** from the stage's list. **Names are can-do verbs:** 「よていを
  かえる」, 「ききかえす」, 「おいわいする」, never 「レッスン」.
- ~30 items, 100 % US; a 40–60-word letter from the host; a line of the day for the couple (the file's header
  comment).

### Lessons

- **A lesson is one game:** 6 questions, ~2½ min, the existing round types.
- **The core is 3 lessons:** **であい** (a model dialogue, for the gist), **ばめん** (variations: other voices, replies,
  implied meaning), **チェック** (held-out items, ≥ 2 voices; 5 of 6 on the first listen stamps the unit; retakeable,
  never locked).
- **2 optional extras**, never blocking the stamp: **おと** (chunks of connected speech: `word` items or tiles) and
  **じっせん** (faster, noisier, other voices).
- **Skipping:** 飛ばしてチェック goes straight to the check. A stamped unit returns once, ~30 days on, as a solo
  6-question recheck.
- **Quick modes stay:** ひとこと クイズ, はしご and アナウンス draw from the whole stage; they count toward 図鑑 phrases and
  the menu, never a unit's lesson dots.

### Playing together

- **Write once, play at both levels:** one unit, the same audio, each player's choices at their tier (`tiers`).
- **Shared passes:** a co-op チェック the team passes stamps everyone in it: the row's `tm` (0–6) is the team's
  first-listen rights (`teamFirst`), and contract/listen.ts `stampsUnit` stamps `l` 3 on my own ≥ 5 or `tm` ≥ 5. The
  partner's summary carries `{u, stamped: 1}`; both stamped is the double stamp. Answers stay private.
- **Co-op lessons:** the host picks a unit and lesson on しまの みち; it goes out as `play` with `u` and its cv; each
  phone sends its tier (`tierFor`, as `join.tr`) and grades each player at theirs, so `tm` matches everywhere. The
  recheck stays solo.

### The unit file

`app/content/units/<id>.yaml`, read and checked by kikimimi/units.ts, compiled by kikimimi/compile.ts
(`npm run kikimimi:levels`):

```yaml
schema: 1
unit: tr-hotel              # <domain2>-<slug>, ≤ 12: the row's u; never a stage
name: ホテルで こまった       # a can-do verb, ≤ 12 characters, never レッスン
stage: mori                 # hama | kawa | mori | yama | hoshi
domain: tabi                # glue | tomodachi ie tabemono kaimono tabi shigoto ibento machi karada
also: [machi]               # optional: more chips (coverage counts domain only)
host: diana                 # a roster villager
scene: lobby                # a SCENE_IDS backdrop, or a planned one (the page shows the domain's tint)
sound: self-repair          # the main feature, from the stage's list (stages.ts STAGES)
cando:                      # 「{who}が {does}のを {cond} きいて、{catch}が わかる」
  who: ホテルの スタッフ
  does: へやの もんだいへの たいおうを せつめいする
  cond: ロビーの ざつおんの なかで
  catch: できる ことと ついかの りょうきん
  short: ホテルの もんだいを ききとれる   # ≤ 25 characters, one line, no 。、; required past draft
  en: "I can follow hotel staff explaining what they can do about a room problem, over lobby noise, and catch the options and any extra charge."
status: voiced              # draft | voiced | listened
ph:                         # 1-10 key phrases (6-10 once written), ids unique across units
  - { id: ph-im-afraid, en: "I'm afraid", ja: あいにく, register: service, scene: hotel desk, trap: こわい ではなく「あいにく」 }
  - { id: ph-small-extra, en: a small charge, match: "small (additional charge|supplement|fee)", register: service, scene: hotel desk, trap: small でも お金は かかる }
review: [m4-be-good]        # existing items the lessons reuse without homing them here
items: [...]                # new items, in the bank's Item shape
lessons:
  v: 1                      # the recipe: 1, or 2 ("Recipe 2")
  deai: [d4-hotel-suite, r4-room-ready, …]   # ≥ 6 ids each; であい has a dialogue
  bamen: [...]
  check: [...]              # held out of であい and ばめん, ≥ 2 voices
  oto: [...]                # optional, mostly word items
  jissen: [...]             # optional, items or ladder ids
tiers:                      # optional, per item: an easier and a harder choice set (same audio)
  r4-room-ready: { easy: { choices: [...], answer: 0 }, hard: { choices: [...], answer: 0 } }
letter:                     # the host's letter at my stamp, 40-60 words, one of its phrases in it
  en: "I'm afraid I have a confession: …"
  ja: "あいにく、うちあけたい ことが あるの。…"
```

Every lesson id not under `review` is homed in the unit (an item has ≤ 1 home; ids never encode a unit; shipped ids
are frozen). The level banks stay TypeScript with their `lv`.
- **Output:** `levels/parts/u-<id>.json` (≤ 32 KB gzipped, compile.ts `UNIT_MAX`), the index's `units[<id>]` and
  `paths` line, and `parts/letters.json`.
- **Checks** (units.ts `checkUnits`; errors stop the compiler, warnings print): schema, ids and homes, each item within
  one step of the stage, the can-do, the recipe, tiers, American only, every clip past draft, the phrase, recycling and
  coverage rules, a letter past draft.
- **Level-deck invariance:** the levels' chunks are byte-identical with and without units; `kikimimi/decks.golden.json`
  digests the decks for seeds 0–99 per level, so homing an item can't change a quiz deck (a deliberate bank change is
  `vitest -u`). A unit shows from `voiced` (a draft only with the dev hooks on).

### Lesson decks and stamps

- **Deck** (`kikimimi/lesson.ts` `lessonDeck`): 6 questions by the seed; であい opens on its dialogue; チェック plays only
  held-out items (`playIds`); a tier swaps in the item's choice set (`tierFor`: easy half a step below my comfortable
  level, hard a step above).
- **Solo play:** `QuizGame.playLesson(unit, lesson)` deals the game `lesson` into my lobby kept alone, after its intro
  card (LessonIntro.svelte).
- **The row** carries `u`, `l` and the stage's level (co-op adds `tm`).
- **Stamps** (`kikimimi/stamps.ts` `unitsOf`, from `gamesOf`): a lesson's dot from a row with a whole game's answers;
  my stamp the first stamping row's day and tally; the partner's from their summary; the recheck due 30 days after,
  done by a solo チェック on or after that day (`rechecksDue`).
- **Phrases** (srs.ts): `phrasesOf` (caught), `phraseReview` (a Leitner card per phrase, a new clip each, ≤ 8 a day).

### Recipe 2

With `lessons.v: 2`, おと is tiles, じっせん a たちぎき, チェック a phone call plus 4 quiz items; each lesson opts in on its
own and falls back to recipe 1:

```yaml
lessons:
  v: 2
  deai: [...]                   # as v1
  bamen: [...]                  # as v1
  check: [...]                  # as v1 (≥ 6, held out): the fallback, and the call's 4 quiz items
  oto: [...]                    # required with `tiles` (what おと plays till they're listened)
  jissen: [...]                 # required with `tachi`
  tiles: [tile-…, …]            # おと: 6-40 tile ids from content/listen/ (6 dealt by the seed, the shortest first)
  tachi: [tachi-…]              # じっせん: 1-2 たちぎき ids (2: 6 rounds; 1: its 3 rounds, then 3 of `jissen`'s items)
  call: [call-…]                # チェック: 1 call id with ≥ 2 memo rows (its 2 rounds, then 4 of `check`'s items)
```

- Each id must be that game's item in a content/listen/ file whose `stage` is the unit's place + 1 (かわ 2, もり 3);
  units.ts `checkUnits` / `listenRefs` check them; the index records each lesson's files in `units[<id>].kinds`; the
  lesson cv takes in only `listened` files.
- **On the phone:** games/lesson/recipe.ts `recipeDeck` deals the kind's cards by the game's own deal, topped up to 6
  from the recipe-1 deck, each graded by its kind at the player's ear on its game's page. The row is still a lesson's
  (`u`, `l`, no `gm`), so `stampsUnit` reads a チェック's 6 answers as before.
- **Fallback** (recipe.ts `kindCards` null): the recipe-1 deck when the unit is v1, the lesson has no kind, a kind's
  file isn't `listened` or loaded, or an id is missing; it reads only the index's statuses, so every phone deals the
  same deck.

## Content

### What's written

Counts: the tests' (bank.test, content.test, units.test, henshin.test).
- **The level banks** (kikimimi-engine.md "Content"), **the units** (かわ and もり, "The 21 units"; the plan: units.ts
  `PLANNED`), **the listening files** (every lane at all five places), **音の へんしん** ("Connected speech") and **3
  bedtime serials** (st-johnny, st-cafe, st-tokyo, recycling the units' phrases). Audio packs: kikimimi-engine.md
  "Packs".
- Every level and unit item has `ctx`, `cja` and `why` (音の へんしん's: `ctx`, `cja`, `note`).
- **Outside units:** the はまべ island lines, the アナウンス pack, ほし's news, lectures and talks, the number templates.

### The 21 units

Each unit's name, domain, host, scene, sound and recipe are in its file (`app/content/units/<id>.yaml`), at かわ and もり
(coverage: "The spine"). A unit naming an unpainted backdrop
("Backlog") shows the domain's tint.

### Authoring pipeline

1. **Seed sheet:** can-do, phrases, sound, host, scene, scenario seeds; for a game, the kind and tier sets.
2. **Draft** (one author per file): `en`; `tts` only where the reduction matters; `ja`, `note`, `ctx`, `cja`, `why`;
   tags (each kind's required help: content/listen/README.md). Rush comes from its frames (`npm run kikimimi:rush`),
   derived tiles from `npm run kikimimi:tiles`, then a person.
3. **Machine gates** (CI; errors past draft): schema and ids; `helpProblems`; the US-only lint; digit-free `tts`; the
   choice tells; the phrase, recycling and coverage rules; near-duplicates; the chunk budgets.
4. **Human review before voicing:** natural for an American friend or clerk; one clearly best answer; the second
   distractor the real trap; `ctx` without the answer; natural Japanese (kana in character speech, kanji in sheet
   copy). Findings go into the files or "Backlog", never a review report in docs/.
5. **Voicing:** `npm run audio:kikimimi` (the gate, re-rolls, conditions, then the packs and levels; a listening
   file's steps: content/listen/README.md "Adding a listening file").
6. **Listening check** ("Listening check"); `status` goes `draft` → `voiced` → `listened`, by hand.
7. **Tuning:** a week of play; grow a stage only at 75–85 % first-listen success.

### Choice tells

A choice set mustn't give its answer away without the audio. `tells.test` holds each level's 3-choice `reply`, `mean`,
`gist` and `next` sets (and the units' tiers) near chance: the right choice the longest in 20–45 % of sets (by ≥ 1.25×
in ≤ 12 %), the shortest in 20–45 %, echoing the clip's words least in ≤ 45 % and most in ≥ 15 %, opening with a
reaction or a question about as often as the wrong ones (± 12 points). Distractors are what a partial listener could
pick: a near sound, a number or name caught wrong, the right words with the wrong implication; spread the clip's words
across the choices. `npm run kikimimi:tells -- <level | file>` lists the sets with a tell. The right choice's place
comes from the deck's seeded shuffle.

## Long listening

The B2 → C1 step is following extended, unscripted talk and what's meant rather than said (CEFR CV 2020); まるごと 聞く
(kikimimi.md) gives one piece a day, ~6 min with its questions and dictation. Everyday and travel, American first.
- **At every place:** s0–s3-long are generated scenes graded to their place (2 min at はまべ, 3 at やま); ほし has the
  generated s4-long-a, -b and the real recordings.
- **Real recordings** (s4-long-c, -d): unscripted American excerpts, only PD, CC BY, CC BY-SA or CC
  BY-NC-SA (long.test), each with its `credit` (source, sha256, span, licence, credit line). Downloads are data (their
  own directory, never run). Lines cut at sentence ends (≤ 16 s).
- **ほし's generated scenes** (s4-long-a, -b): 3 villagers each: polite refusals, sarcasm, a sales trick;
  interruptions and overlap, reductions in `tts`.
- **Questions:** 4–5 a piece (gist, implied meaning, attitude, next step), held to "Choice tells". **Dictation:** 2–4
  lines a piece on connected speech. **Alignment:** a piece's weighted WER ≤ 20 % (align.ts).

## Connected speech

For a strong listener the biggest gain is decoding American connected speech, checked by dictation, from many voices
(Field 2008; HVPT, Logan et al. 1991). 音の へんしん drills it daily (kikimimi.md "音の へんしん").
- **The phenomena,** in teaching order (henshin.ts `PHENOMENA`, each a feature under つながる音): gonna, wanna, gotta /
  hafta, contractions (I'll, we've, should've), weak forms (fer, 'em, 'n), the flap (a lodda), linking (pi-ki-tup), t /
  d + you (didja, gotcha), lemme / gimme, kinda / outta, dunno, elided t / d (nex' week), the stopped t (tha' one), the
  dropped h (tell 'im), chains (whaddaya, gonna hafta).
- **The phrases** (content/henshin.ts, level 8; fields in its header): everyday and travel, each phenomenon in all
  12 US voices. **Takes:** natural, careful (`<id>-c`, 0.8) and fast (`<id>-f`, 1.25×).
- **Validators** (content/henshin.test.ts): order, coverage and voices; the chunks; tiles at every tier; the choice
  tells; every voiced phrase heard as said (`npm run kikimimi:reduce`). What whisper always spells as written (a flap,
  a dropped t or h) is voiced from a `tts` respelling ("Pud it on").

## Listening check

A person listens before a clip counts as done: every clip the gate flagged plus a 20 % sample, on the phone. The
flagged list is `app/scripts/tts/report.json` (its summary's `flagged`; most are whisper's own spellings);
`npm run audio:kikimimi -- --listen [--only <regex>]` plays each with its text on the Mac, only when a person runs it.
A clip fixed after the listen is re-spoken with `PINNED` or a `tts` respelling, then `npm run audio:kikimimi-words`.

## Backlog

- **Backdrops:** paint the planned scenes (`party`, `restaurant`, `shop`, `clinic`, `park`, `konbini`, `lobby`) and add
  them to `SCENE_IDS`, by the existing pipeline (kikimimi.md "Visuals") on the second Mac, never during a TTS batch.
- **The listening check** ("Listening check"): the flagged clips, the real pieces' cut boundaries.
- **トーン あて** (one line sincere / sarcastic / resigned): a 30-take spike; a quiz kind only if the voice holds and the
  tones tell apart blind on the phone.
- **Next content:** a `weather` item in each place's news file (only やま's asks 「傘は いる？」 today); calls for the
  recipe-1 units (then recipe 2); やま units, opening with idioms and group talk on
  たちぎき; more ジョニー chapters.
- **Variety:** the overused clusters (corrected numbers, clinics, transit PA, service calls, landlords, the hotel desk,
  repeated openers, Tokyo-only settings) wait for a new-situations writer; content/variety.test keeps the variety set
  out of them.
