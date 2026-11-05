# ききみみ curriculum: listening English on the island (v1, 2026-11-05)

This is the lead curriculum designer's synthesis of six round-1 proposals (linguist, teacher, Japanese learner panel, curriculum designer, game designer, engineer; drafts in /tmp/curriculum/round1/) and the user's decisive input of 2026-11-05. It builds on the shipped game, ききみみ クイズ (docs/kikimimi.md). Builders follow this document and update it as they go. Choices settled here move into docs/decisions.md as they land.

**The user's input overrides the brief.** The learner is at "high school level and higher": TOEIC 700+ years ago, and listening "quite proficient". So the core band is **B1+ → B2 → C1**. A1/A2 material is only a warm-up and a placement floor. The user wants (a) lots of realistic, harder content, (b) a systematic way to make harder, more useful daily-life scenarios, (c) new visuals, (d) incremental releases that show study progress, and (e) natural neural TTS with a large, consistent cast.

---

## 1. Goals and learner profile

| | |
|---|---|
| **Primary learner** | ウェイ. A Japanese adult in Tokyo, high-school English and more, TOEIC 700+ (old). Reads well and follows clear speech. The gaps are what a 700 score hides: fast, reduced, overlapping, accented and indirect speech; phone and PA audio; group talk; long-form (podcasts, news, meetings). |
| **Second learner** | うめ, level unknown (open question 1). The design keeps a floor (はまべ) and **parallel decks**, so two levels can share one scene. |
| **Guest** | Plays with their own private record and appears in no couple summary. |
| **Goal (12 months)** | Understand natural-speed daily conversation, service calls, meetings and announcements on the first listen, then podcasts and the news at C1. |
| **Focus** | Listening. Speaking appears only as optional private shadowing. |
| **Sessions** | 3–10 minutes, solo or 2–3 live, on iPhone 15/16 Safari. No push notifications (the app's rule); the hook is in the app (しずえ's morning line, a villager's ♪ bubble). |

**What "harder" means for this learner.** It isn't rarer words. It's the **conditions** and the **pragmatics**: speed, reduction, overlap, noise, channel, accent, hesitation and self-repair, and meaning that isn't said outright (an implied refusal, sarcasm, hedging, a joke). All six proposals agree that the sentence and its delivery carry the difficulty, never an obscure noun.

## 2. Principles

1. **Real life in island clothes.** Villagers are the cast and the NH world is the stage dressing, but the situations, money, places and stakes are adult and real (yen, dollars and pounds; Haneda, a GP surgery, a landlord). Never childish (§5.4).
2. **Listen first, read after.** No text before or during the clip. The transcript, the sound marks and the Japanese come at the reveal.
3. **The first listen is the score.** 「いっぱつ せいかい」 (no replay) is the main measure of automaticity. Replays are free but count as "hard" for spaced repetition.
4. **Conditions, not vocabulary.** Difficulty comes from levers (§5.3), each tagged, so the system can turn one at a time.
5. **Many talkers.** High-variability training: every contrast and phrase is heard from ≥ 4 voices, and every accent × gender from ≥ 2 voices before it counts as covered.
6. **Co-op over ranking (adopted default).** Live games show a shared score (「ふたりで 7/8」). A ranking is an opt-in たいせん mode.
7. **Results private, summaries shared (adopted default).** Each person's answers, review list and feature profile stay on their own record. Others see only counts and shared summaries (§11).
8. **Teach the trap, not grammar.** One Japanese line on why the sound or the logic fooled you (`note`, ≤ 40 字). No grammar terms.
9. **Ship small and often.** Every increment (1–3 agent-days) adds playable content and stays green (§14).
10. **Measure before scaling.** Each stage's content grows only once real logs show 75–85% success and 3–10-minute sessions.

## 3. Stages and can-dos (rebased to B1+ → C1)

Stages are named after places, never やさしい/むずかしい (the panel found choosing やさしい in front of a partner shaming). The UI shows ★ counts.

| Stage | CEFR | Role | Listening can-do ("I can…") | Rate (syl/s) | Conditions |
|---|---|---|---|---|---|
| **S0 はまべ** ★ | A2–B1 | Floor and warm-up only (today's L1–L2) | catch numbers, prices and key words in clear single sentences | 3.0–3.8 | studio-clean, US + UK |
| **S1 かわ** ★★ | B1+ | Entry for ウェイ (today's L3 and up) | follow casual exchanges with common reductions (gonna, didja, lemme), phrasal verbs and indirect replies; catch details in service talk | 3.8–4.5 | 1–2 speakers, light café or street noise, US/UK/AU |
| **S2 もり** ★★★ | B2 | Core | follow native-speed conversation between 2–3 people, phone calls and announcements; tell attitude (annoyed, unsure, joking) and implied refusals; follow self-corrections ("Thursday — no, Friday") | 4.5–5.2 | overlap, phone band, PA reverb, SNR to +10 dB |
| **S3 やま** ★★★★ | B2+ | Core | follow fast group talk with interruptions, workplace meetings, voicemail and support calls with complications; catch sarcasm, hedging and humour; cope with less familiar accents | 5.0–5.8 | 3 speakers, interruptions, SNR to +5 dB, IE/SC/NZ/IN accents for exposure |
| **S4 ほし** ★★★★★ | C1 | Stretch | follow podcasts, news, lectures and debates on unfamiliar topics; infer stance; take notes on structure; follow non-native speakers | casual 5.5–6.2, news ~4.5 dense | long-form (2–6 min, segmented), mixed accents, non-native English |

**The existing levels map** as L1 → S0, L2 → S0 high, L3 → S1 low. The first increment adds **L4 = S1/S2** content to the existing quiz (§14).

**The sound-feature sequence** (one primary per unit, earlier ones reviewed):

| Stage | Primary features |
|---|---|
| S0 | L/R, the æ/ʌ/ɑ contrasts, -teen/-ty, can/can't, final -s/-ed, katakana stress (a warm-up drill, 「みみ トレーニング」) |
| S1 | weak forms (to/for/of/and/can/have/them), contractions ('d, 'll, 've, I'd've), US flapping, t/d elision, yod coalescence (did you, would you), gonna/wanna/gotta, UK t-glottalling |
| S2 | reduction chains (whaddaya, dunno, lemme, 'cause), h-dropping (tell 'im), assimilation (ten minutes, good boy), contrastive stress, attitude intonation, fillers and false starts, AU vowels |
| S3 | very fast casual speech, overlap and turn-taking, sarcasm prosody, upspeak, regional accents (IE/SC/NZ/IN) |
| S4 | news-reader density, academic stress shifts (PHOtograph/phoTOgraphy), signposting, argument structure, non-native accents |

## 4. Tracks

Tracks are strands inside units, not separate apps. Each unit belongs to one track; sessions mix due reviews from all of them.

| Track | Content | Weight S1 / S2 / S3 / S4 |
|---|---|---|
| **A. Life** (daily errands and services) | shops, trains, the doctor, the bank, the landlord, travel, phone support | 50 / 35 / 25 / 10 |
| **B. People** (casual and social) | friends, the partner, group chats, parties, gossip, humour, slang, idioms in character | 35 / 35 / 30 / 20 |
| **C. Work** | small talk, meetings, video calls, requests, negotiation, feedback | 10 / 20 / 30 / 25 |
| **D. Broadcast** (news, talks, long-form) | announcements, しずえ's news, K.K.'s radio, フータ's talks, podcasts, story serials | 5 / 10 / 15 / 45 |

## 5. The scenario system

### 5.1 The generator: six dimensions

A scenario seed is one value from each dimension. Authors (LLM draft, then a person) turn a seed into a script; the tags go on every item, so difficulty can be turned one lever at a time.

| Dimension | Values (examples) |
|---|---|
| **Setting** | konbini, station/train, airport, hotel, restaurant/café, doctor/pharmacy/dentist, bank/post office, phone support, landlord/repairs, gym, office/meeting/video call, party/bar, home (the couple), shop/returns, taxi/rideshare, city hall/ward office, school/class, broadcast (PA, radio, news, podcast) |
| **Goal** | get information, buy/order, book/change/cancel, fix a problem, complain/get a refund, ask a favour, invite/accept/decline, make a plan, give/get directions, give/get an opinion, negotiate, report, follow instructions |
| **Complication** | something sold out or cancelled, a delay or gate/platform change, a wrong item or bill, a misunderstanding (a name, a number, a homophone), a mind changed midway, a policy refusal, being transferred or put on hold, a bad line, a second speaker cutting in, a time conflict, a missing document, a language barrier, an emergency |
| **Relationship and register** | stranger/service (polite), colleague (neutral), boss/client (deferential), friend (casual), partner (intimate, teasing), neighbour/landlord (careful), official (formal, scripted), broadcaster (read speech) |
| **Speech conditions** | rate (careful → fast), reduction density, overlap and interruption, noise (café, street, station, rain, wind; SNR +20 → +5 dB), channel (phone band, voicemail, PA reverb, video call dropouts), accent, hesitation, fillers and self-correction, 2–3 speakers |
| **Pragmatic layer** | literal; indirect request ("It's a bit cold in here"); implied refusal ("I'll see what I can do"); hedging; sarcasm/irony; humour and puns; understatement (UK "not bad", "a bit of a problem"); politeness formula vs real meaning; small-talk ritual; a cliffhanger (what will happen next?) |

**The generator step.** An LLM receives a seed, the stage's rate and feature targets, the cast list, the scenario's AC frame (§5.4) and the item schema. It returns a script (lines with `spk`, `en`, `tts`, `ja`, `note`) plus 2–4 questions, each tagged with what it tests (gist, detail, number, inference, attitude, next-line). A lint checks the stage's limits; an agent teacher reviews; a person signs off (§9).

### 5.2 Question angles per scenario

Every scenario yields several question types from one recording, so audio is reused:

| Angle | Example ("Your 6:40 to Osaka has been moved to platform 14 — not 12 — and is running about ten minutes behind.") |
|---|---|
| gist | どんな アナウンス？ → a platform and a delay change |
| detail / number | なんばんせん？ 12 / **14** / 40 |
| inference | What should you do? → go to another platform now |
| attitude | (in dialogues) Is she annoyed or joking? |
| next line | What's the best reply? (TOEIC Part 2/3 style) |
| repair | Which detail did the speaker correct? |
| dictation-lite | rebuild "has been moved to" from tiles (ことば タイル) |

### 5.3 Difficulty levers

Each lever has steps. An item's difficulty is the sum of its steps, and the adaptive engine (§10) moves **one lever at a time** so a miss is diagnosable.

| Lever | Step 0 | Step 1 | Step 2 | Step 3 |
|---|---|---|---|---|
| Rate | careful (S0) | natural | brisk | fast casual |
| Reduction | citation | contractions | weak forms + flaps | chains (whaddaya, dunno) |
| Speakers | 1 | 2, turn by turn | 2 with overlap | 3 with interruptions |
| Noise (SNR) | clean | +20 dB | +10 dB | +5 dB |
| Channel | studio | room | phone/voicemail | PA reverb, video dropouts |
| Accent | US | UK | AU | IE/SC/NZ/IN/non-native |
| Disfluency | none | fillers | false starts | self-correction that changes the answer |
| Pragmatics | literal | indirect | implied refusal/hedge | sarcasm, irony, humour |
| Distractors | far | heard in the clip | the corrected value | the plausible inference that's wrong |
| Length | 1 line | 3–6 lines | 30–60 s | 2–6 min, segmented |
| Support | 🐢 careful take | replay | segment replay only | one play only (チャレンジ) |

### 5.4 Mapping onto the AC world without making it childish

Rule: **the frame is AC, the content is real.** Villagers play people; scenes use real currencies and places when the scenario is real-world. Island-world settings (ベル, the museum) appear only in island-flavoured content (S0, seasonal packs, しずえ's island news).

| Real setting | AC frame (who speaks, the scene card) |
|---|---|
| Airport, flights, immigration | ロドリー (Wilbur) and モーリー (Orville) at the Dodo Airlines desk; ジョニー (Gulliver) stranded abroad |
| Trains, taxis, ferries | カッペイ (Kapp'n) as the driver or conductor; the PA voice is a cast "announcer" |
| Office, city hall, ward office | Resident Services: しずえ as the colleague, たぬきち as the manager |
| Shops, returns, konbini | まめきち・つぶきち at the counter; エイブル姉妹 for clothes and sizes |
| Café, restaurant | マスター (Brewster) at the café; villagers as diners and staff |
| Doctor, pharmacy | a normal or smug villager as the GP or pharmacist; a jock as the patient |
| Bank, phone support, scams | the NookPhone call screen; つねきち (Redd) as the suspicious caller |
| Landlord, repairs, contractors | たぬきち as the landlord; a cranky villager as the neighbour |
| Friends, parties, group chat | villagers by personality (§5.6) |
| News, radio, lectures, podcasts | しずえ's morning broadcast, K.K.'s radio, フータ (Blathers) and フーコ (Celeste) talks |

### 5.5 The scenario bank (64 seeds)

Stage is where a seed first appears; each can be re-cut harder with the levers. Abbreviations: R = register, C = conditions, P = pragmatic layer.

**A. Travel and transport**

| # | Seed (setting: goal → complication) | R / C / P | Stage |
|---|---|---|---|
| 1 | Airport desk: check in → flight overbooked, offered a voucher | polite / desk noise / politeness formula | S1 |
| 2 | Gate PA: board → gate change and a delay, then a correction | official / PA reverb / literal | S1 |
| 3 | Hotel desk: check in → room not ready, offered an upgrade "for a small fee" | polite / lobby / implied upsell | S1 |
| 4 | Taxi: go to an address → driver mishears the street name | casual / car noise, accent / repair | S2 |
| 5 | Train: transfer → service suspended, replacement bus, platform change | official / station PA / literal | S2 |
| 6 | Lost luggage desk: report a bag → missing form, a reference number read fast | neutral / phone-fast numbers / literal | S2 |
| 7 | Car rental: pick up → insurance upsell, deposit hold explained fast | polite / brisk / hedge | S3 |
| 8 | Missed connection: rebook → three options, each with a catch | neutral / overlap with another passenger / implied | S3 |
| 9 | Immigration: questions → an officer's dry joke | formal / IE accent / humour | S3 |
| 10 | Airbnb host voicemail: directions to the key box → self-corrects the code | casual / voicemail / self-repair | S2 |
| 11 | Ferry PA in wind: departure → weather cancellation | official / wind +5 dB / literal | S3 |
| 12 | Strangers on a train overheard: plans → you infer where they get off | casual / train noise / inference | S3 |

**B. Health**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 13 | Pharmacy: buy cold medicine → "Are you taking anything else?" drowsiness warning | polite / counter / literal | S1 |
| 14 | GP phone booking: an appointment → only a callback slot, "it's triage" | polite / phone / policy refusal | S2 |
| 15 | Doctor: describe symptoms → follow-up questions fast, dosage instructions | neutral / brisk / literal | S2 |
| 16 | Dentist reception: reschedule → cancellation fee hinted | polite / phone / implied | S2 |
| 17 | Gym trainer: instructions → corrects form mid-set | casual / gym music / self-repair | S1 |
| 18 | Friend on a diet: dinner plans → hedges, means no | casual / café / implied refusal | S2 |
| 19 | Health podcast: sleep research → host and guest disagree | broadcast / two hosts / stance | S4 |
| 20 | Hospital PA plus a nurse: directions → interruptions | official / reverb, overlap / literal | S3 |

**C. Money, phone support and services**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 21 | Bank phone menu: report a card → IVR options, then a human, a security question | formal / phone / literal | S2 |
| 22 | Mobile carrier support: roaming charges → transferred twice, on hold | polite / hold music / "unfortunately" | S3 |
| 23 | Scam call: "your parcel" → spot the red flags | fake-polite / phone / deception | S3 |
| 24 | Post office: send abroad → customs form, three price tiers | neutral / counter / literal | S1 |
| 25 | Internet installer: book → "between 8 and 1", needs someone home | casual / phone / literal | S2 |
| 26 | Refund at a shop: return → "store credit only" | polite / shop / policy refusal | S2 |
| 27 | Restaurant bill: split → service charge dispute, a joke to ease it | casual / restaurant / humour | S2 |
| 28 | Insurance claim voicemail: a reference and deadlines read fast | formal / voicemail / literal | S3 |
| 29 | Subscription cancel: retention offer → refuse politely, agent persists | polite / phone / persistence | S3 |

**D. Home and neighbours**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 30 | Landlord: report a leak → "should be fine", vague timing | careful / phone / evasive | S2 |
| 31 | Plumber visit: diagnosis → options and costs, jargon | casual / room noise / literal | S2 |
| 32 | Neighbour: noise complaint → softened with small talk | careful / doorstep / indirect | S2 |
| 33 | Moving company: quote → hidden extras | neutral / phone / hedge | S3 |
| 34 | Building manager PA: water shut-off → times corrected | official / PA / self-repair | S1 |
| 35 | Partner at home: what to cook → teasing, a mind changed | intimate / kitchen / humour | S1 |
| 36 | Partner: weekend plans → "I'm easy" (they're not) | intimate / casual fast / implied | S2 |
| 37 | Delivery driver: missed parcel → leave with a neighbour? | casual / doorstep, accent / literal | S1 |

**E. Work**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 38 | Coffee machine small talk → weekend, weather, "we should grab lunch" (ritual) | neutral / office / small-talk ritual | S1 |
| 39 | Video call: start → "you're on mute", dropouts, two talk at once | neutral / video channel / literal | S2 |
| 40 | Meeting: move the deadline → boss hedges ("it might be tricky") | deferential / 3 speakers / hedge | S3 |
| 41 | Client call: scope change → polite pushback | formal / phone / negotiation | S3 |
| 42 | Feedback chat: performance → praise sandwich, the real point in the middle | neutral / 1:1 / indirect | S3 |
| 43 | Onboarding: instructions → acronyms, "does that make sense?" | neutral / brisk / literal | S2 |
| 44 | Stand-up: three updates → overlap, find who's blocked | casual / 3 speakers fast / inference | S3 |
| 45 | Colleague's voicemail: a favour → rambling, the ask at the end | casual / voicemail / indirect | S2 |
| 46 | Job interview: a tricky question → interviewer's dry humour | formal / UK / humour | S3 |
| 47 | Conference talk Q&A: a question → speaker deflects | formal / hall reverb / evasive | S4 |

**F. Social, plans and misunderstandings**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 48 | Invitation: a party → "I'll try to make it" (won't) | casual / fast / implied refusal | S1 |
| 49 | Cancelling plans: last minute → excuse, an offer to reschedule | casual / phone / apology | S1 |
| 50 | Group voice chat: choose a restaurant → three opinions, one changes mind | casual / overlap / tracking | S2 |
| 51 | Misheard name at a café: "Wei?" → "Way?" "May?" repair | casual / café noise / repair | S1 |
| 52 | Friends' banter: a bad film → sarcasm ("Oh, it was *brilliant*") | casual / UK / sarcasm | S2 |
| 53 | Barbecue overheard: gossip → who's dating whom | casual / outdoor, 3 speakers / inference | S3 |
| 54 | Birthday planning: a surprise → keep it secret from the one who walks in | casual / interruption / code-switching | S3 |
| 55 | Pub quiz: questions read fast, banter in between | casual / bar noise, AU / humour | S3 |
| 56 | Date planning: a misunderstanding over "next Friday" | intimate / casual / ambiguity | S2 |
| 57 | Complaint to a friend: venting → you pick the supportive reply | casual / emotional / attitude | S2 |
| 58 | Stranger asks directions in Tokyo: you follow their paraphrase back | polite / street / repair | S1 |

**G. Broadcast and long-form**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 59 | しずえ's morning news: island news plus the real Tokyo weather | broadcast / clear / literal | S1 |
| 60 | Weather forecast: a typhoon warning with times and areas | broadcast / dense numbers / literal | S2 |
| 61 | K.K.'s radio: a listener call-in, a bad line | broadcast + caller / phone / humour | S3 |
| 62 | News bulletin: three stories, a correction at the end | broadcast / news-dense / literal | S3 |
| 63 | Podcast: two hosts on a travel story, tangents and laughter | casual broadcast / overlap / humour | S4 |
| 64 | フータ's lecture: why fossils form, with signposting | academic / hall / structure | S4 |
| 65 | Debate: two guests disagree on remote work, interruptions | broadcast / overlap / stance | S4 |
| 66 | ジョニー's travel serial: chapter 1 of 10, a cliffhanger | narrative / multi-voice / prediction | S2 |

### 5.6 Personality → register

Personality keeps register memorable and casts lines naturally: jock (gym, health, hype slang), peppy (pop slang, upspeak), snooty (shopping, understatement), lazy (food, "I'm beat"), cranky (complaints, news opinion, dry humour), smug (explanations, workplace jargon), sisterly (idioms, blunt advice), normal (home life, polite requests). Specials as in §5.4.

## 6. The unit and session template

**Resolution (curriculum designer vs teacher).** Both shapes are kept at different scales: the curriculum designer's 5-lesson unit is the **unit**, and the teacher's 4-beat session is the shape of **every lesson** inside it.

**A unit** is 1 scenario family (2–4 seeds from §5.5), 6–8 target chunks, 1 primary sound feature + 1 in review, 1 can-do, and a host villager. About 40 short items and 3–4 dialogues or long texts. It is released as one pack.

| Lesson | Content | Lever emphasis |
|---|---|---|
| 1 であい | short lines that carry the chunks (`reply`, `mean`, `num`) | natural rate, 1 speaker |
| 2 おと | the feature in context (`word`, ことば タイル, the speed ladder) | reduction |
| 3 ばめん | the scenario as a 30–90 s dialogue: gist → details → inference | speakers, pragmatics |
| 4 じっせん | the same scenario re-cut harder: noise, phone, another accent, a complication | conditions |
| 5 チェック | 8 items across ≥ 2 voices; ≥ 80% on the first play stamps the can-do. A test-out is allowed from lesson 1 | mixed |

**A session** (3–10 min): warm-up (1–2 due reviews you'll likely get right) → the lesson's core (6–8 items) → チャレンジ (1–2 items one lever harder, bonus points) → review list (missed first; ▶︎ normal, segment replay, transcript with sound marks; optional private shadowing). It ends with 「きょうの ひとこと」: one line to use with the partner tonight.

## 7. Game catalogue and build order

Each game reuses ききみみ's seeded deck, host clock, presence intents and lazy sheet, then the shared `RoundSession`/`GameDef` framework (§12). The game designer's picks are re-weighed for an advanced learner: phonemic drills move down to the floor; tasks with complications, overheard talk and long-form move up.

| # | Game | Trains | Modes | Effort | Priority |
|---|---|---|---|---|---|
| 1 | **ききみみ クイズ** (existing) + L4/L5 and the new types `mean` (what do they mean?), `gist`, `next` (best next line after a 2–4-line dialogue) | replies, pragmatics, numbers in real contexts | co-op, solo, たいせん | S per step | **now** |
| 2 | **スピード はしご** (speed ladder): one line in 3 takes, careful → natural → fast reduced; answer at each rung, the top pays most | reductions, rate tolerance | solo, co-op | S | 2 |
| 3 | **ことば タイル** with reductions: rebuild what was said from tiles, with decoys *to/the/a, I'd/I'll, can/can't, should've/shouldn't have*; the reveal shows the spoken shape | segmentation, weak forms | solo, co-op (half the tiles each) | S | 3 |
| 4 | **ようじ でんわ** (phone errands with complications): a NookPhone call asks for something, then changes it ("oh, actually, make that…"), you act on the pocket grid or fill a memo | multi-step detail, self-repair, phone audio | solo, co-op (each hears half) | M | 4 |
| 5 | **たちぎき** (overheard): 2–3 villagers talk, overlap and interrupt; match opinions to faces, then who changed their mind, the mood, the plan | tracking speakers, attitude, inference | co-op, solo | S UI, content-heavy | 5 |
| 6 | **しずえの ニュース** (daily broadcast): 45–90 s at S1, a full bulletin with corrections at S3; gist + 2 details | long-form, news register | solo daily, co-op | M | 6 |
| 7 | **アナウンス** pack: PA, voicemail, IVR menus (a ladder of channel and noise) | channel and noise tolerance | solo | S (pipeline) | 7 |
| 8 | **フータ／ラジオ** long-form: segmented talks, podcasts, debates; a comprehension map fills as you answer; notes | structure, stance | solo | M | 8 |
| 9 | **ジョニーの たび** (story serial): one chapter a day, predict the next | extensive listening | solo, co-op unlock | M | 9 |
| 10 | **ふたりで ジグソー** (jigsaw): each phone hears half (earphones), they must talk | information gap | co-op only | S on top of 4/5 | 10 |
| 11 | **フータの なぞなぞ** (buzz-in riddles) | inference, fun party game | たいせん | S–M | later (a party game, not core) |
| 12 | **まねっこ エコー** (shadowing, private, no scoring) | prosody | solo | M (iOS audio session) | later |
| 13 | **つり ききわけ** (minimal-pair fishing) | phonemes | solo | S–M | floor only |
| — | ラベルの コーデ, ケケの チャント, Redd's fakes | — | — | — | parked (low transfer, fragile timing) |

## 8. The visual system

Everything uses the app's paper theme (cream paper, rounded cards, the NH brown ink, soft drop shadows) and stays lazy-loaded.

| Element | What it is | How it's built |
|---|---|---|
| **Scene card** | A 16:9 card shown *before* the clip: the setting (station platform, café counter, phone screen, office, airport desk), the speakers' icons, a one-line Japanese task (`ask`). It gives context the way real life does, without giving words away. | **SVG/CSS scene kit**: ~20 flat paper-style backdrops drawn as SVG (≤ 6 KB each), composited with the existing NH art (880 villager images, hosts, reactions, items). Cheap, tiny, consistent. |
| **Channel frames** | The NookPhone call screen (signal bars that drop on a bad line), a PA speaker with a reverb ripple, a video-call grid with a "muted" icon, a voicemail tape. They show the condition, which is part of the scenario. | SVG components |
| **Dialogue bubbles** | NH-style bubbles per speaker, empty (「♪…」) while playing; bubbles overlap when speech overlaps; the speaker's icon bobs. | existing SpeakerBubble, extended |
| **Transcript karaoke** | At the reveal, the transcript highlights word by word as the clip replays; tap a sentence to replay it. | word timestamps from forced alignment in the pipeline |
| **Sound marks** | Over the revealed text: linking arcs (‿) between words, stress dots (● strong ○ weak), elided letters greyed (nex<s>t</s> week), a flap marked (wa**d**er), the reduced shape above the spelling (going to → *gonna*), an intonation contour line for attitude items. One mark type per item, the item's `feature`. | CSS over spans; marks generated from `features` and alignment |
| **Comprehension map** | For dialogues and long-form: a small node map (who, where, when, what changed) or a timeline that fills in as questions are answered; the review shows it complete. | Svelte + SVG |
| **Stamp card and ずかん** | Can-do stamps per stage (Nook Miles style); a phrase ずかん filled when a chunk is heard in 3 contexts; a "sounds I can hear" collection. | existing paper components |
| **Generated illustrations** (optional) | Richer backdrops for news and podcasts. | Feasible offline on the M5 Max (an open-weights image model), styled as paper watercolour backgrounds only. **Licence:** never generate NH characters or imitate Nintendo assets; check the model's licence for the outputs. The NH art itself is Nintendo's and stays as the app already uses it (a private app; the repo goes private after the hosting move). Start with the SVG kit; add generated backdrops only if the kit feels thin. |

**Rule:** no visual may show the answer before the reveal. Scene cards show the setting, never the outcome; transcripts and marks appear only at the reveal.

## 9. Audio and script rules for TTS

**Resolution (slow clips).** The linguist wanted a separate careful-speech take; the engineer, a time-stretch. Adopted: S0–S1 🐢 is a **separate careful take** (「ゆっくり ていねいに」), never a stretch (stretching undoes reductions). From S2 there's no 🐢: support is **segment replay** (one sentence) and the transcript.

**The cast.** At least 2 voices per accent × gender for US, UK and AU (≥ 12 core voices), with ages young, middle and older; ≥ 4 voices per minimal-pair contrast and per target phrase; plus exposure voices at S3–S4: Irish, Scottish, NZ, Indian, Singaporean, and non-native English (e.g. Spanish-, French-, Chinese- and Korean-accented), where the chosen model can do them convincingly. A cast "announcer" (PA) and a "newsreader" voice. Each villager maps to one cast voice for good (`Voices`: villager → cast). Designed voices only; no cloning of real people without their consent.

**Script rules.**

| Rule | Detail |
|---|---|
| `en` ≠ `tts` | `en` is standard spelling (shown); `tts` is spelled as said: gonna, wanna, lemme, dunno, 'cause, d'you, whaddaya, I'd've. Contractions everywhere. |
| Numbers as spoken | "six forty", "fifteen hundred yen", "the thirteenth", "oh-nine-oh". Never digits for the engine. |
| Punctuation is prosody | comma = tone-unit break; none where speech runs on; "—" a break or self-repair; "…" trailing off. |
| Disfluency on purpose | fillers (um, like, y'know), false starts, self-corrections, written in. |
| Stress | mark contrastive stress the way the engine takes it (CAPS, emphasis tags, a style instruction). |
| Rate by style | "fast casual chat" in the style prompt, not stretching (keep stretching within ±10%). Measure syl/s per clip and tag it. |
| Multi-speaker | one clip per line; overlap made in the mix (a negative gap, the next line under the last); interruptions cut the previous line. |
| Conditions in the mix | noise beds at set SNRs (café, street, station, rain, wind), phone band (300–3,400 Hz + codec), PA reverb, video dropouts. All offline; the clean master is kept. |
| Takes | 3–5 takes per line; pick by checks below. |
| Checks | whisper hears every word (numbers and contractions normalised); reductions are checked by forced alignment against `tts` (whisper normalises gonna → going to): weak *to/of* < ~80 ms with a central vowel, flap present, /t/ deleted. A person listens to everything the checks flag plus a 20% sample per unit. |
| Pinning | the engine, its version, the cast ref and the seed are in each clip's `src` hash; master WAVs are cached by hash. |
| Tags | `features[]`, `rate`, `accent`, `register`, `conditions[]`, `pragmatic` on every item: these drive the levers, review and coverage reports. |
| Japanese | `ja` and an optional `note` (≤ 40 字) that explains the trap; from S2 the Japanese is collapsed at the reveal, tap to open. |
| Licence | all scripts original. No copyrighted lyrics, broadcasts or news audio: the news is written news-style by us. |

**The model choice** (being made now) should be judged on: reductions and flaps on demand, natural two-voice dialogue, accent stability across a long script (no drift towards US), disfluency that sounds real, and speed on the M5 Max for ~16 hours of audio.

## 10. Placement, adaptivity and spaced repetition

**Placement 「みみ チェック」.** Private, ~4 minutes, 12 adaptive items. It **starts at S1** (not S0, given the user's level), goes up a band after 2 right and down after 1 wrong, and stops after two reversals. It samples a reduction, a number under noise, an implied-meaning reply, a 30 s gist, an accent and a phone clip. The output is a stage **per sub-skill** (decoding, rate, channel, accent, pragmatics, long-form), not one number. Re-checks are offered quietly at stage boundaries.

**Adaptivity.** An Elo-style ability per player for each lever and feature. Updates go to the learner, not the items (three players give too little data to calibrate items). The target is 75–85% correct: above it, turn one lever up; below it, one down. Two misses in a row make the next item easier without saying so. A first-play correct answer counts more.

**Spaced repetition.** The card is a **chunk, a feature or a scenario skill** ("self-correction in numbers"), never a clip. FSRS-lite intervals 1 / 3 / 7 / 16 / 35 / 90 days. Right first play = good; right after a replay = hard; wrong = again. Each review uses a different clip (voice, accent or condition). 「しずえの おさらい」 is a 3-minute due-only session, capped at 20 cards a day. No streak guilt: a missed day only means more due cards.

**Resolutions.** Placement length: 12 items (between the linguist's 10–12 and the curriculum designer's 14–18), with long gist as one item. Storage: the engineer's one row per person per day (below) rather than one row per answer, but each entry keeps the pick, so distractors still diagnose.

## 11. Progress and the couple experience

| Who sees it | What |
|---|---|
| **Me only** | my answers, review lists, feature profile (bars), placement result, due cards, minutes, the can-do stamps and my ずかん |
| **Both members** (shared summaries) | that a person listened today and for how long (`listen_day {date, n, min}`), co-op game scores, shared stamps (units both cleared), phrases both know, a weekly line in しずえ's broadcast that's always positive ("ふたりで 42ふん きいたよ") |
| **Never shown** | who picked what in a live game (only ✓ chips and 「2にん せいかい」), one partner's level next to the other's (unless both opt in), the guest's data |

**Live play.**
- **Co-op by default:** results read 「ふたりで 7/8」, plus a shared best. たいせん (ranking) is a lobby toggle; it scores against expectation (a hard item for you earns more), so a lower level can win.
- **Parallel decks:** the same scene and audio, with each phone's choices at its player's tier (`tier {easy, hard}`). Only the seed and tiers go on the wire.
- **Asynchronous:** 「ウェイは もう きいたよ」 shows that a set was played, never the score; the same daily set waits for the other.
- **Review together** (optional): ▶︎ synced between phones on the shared review, showing items, not who missed them.

**Rewards** stay light: stamps, ずかん, a K.K. song when the couple reaches shared listening goals. No economy tie yet.

## 12. The platform

The engineer's proposal is adopted as the target, reached step by step (§14).

| Piece | Decision |
|---|---|
| Content source | `content/listen/<unit>.yaml` (zod schema) → lazy JSON per unit. Types: Cast, Voices, Unit, Script (line/dialogue/monologue/announcement), Phrase, Item with `tags`, `tier`, `conditions`. bank.ts converts into 3 units. |
| Pipeline | `npm run listen:build` on the M5 Max: draft → lint (schema, refs, minimal pairs per accent, CEFR-J vocabulary, rate per stage) → agent review → TTS adapter per engine → ASR + forced-alignment gate (3 retries) → mix conditions → normalise (−16 LUFS, mono 24 kHz AAC 48 kbps) → pack → `/dev/listen` check page. Ships `listened` units only. |
| Packs | `audio/listen/<unit>.<hash>.pak` (concatenated m4a, sliced and decoded just in time), served immutable; normal ≤ 1.2 MB, careful-take pack ≤ 0.8 MB. Needed because Pages caps a deploy at 20,000 files (11,627 used). Move packs to R2 behind a same-origin route past 50 MB. |
| Cache | SW cache `island-listen-v1`: cache-first, LRU by unit, byte cap ≤ 30 MB, nothing precached. |
| Sync | One generic intent `play {g, gm, op, …}`; `open` carries `gm`, unit, `cv` (content version) and optional review `ids`. A `cv` mismatch shows 「アプリを こうしんしてね」. The relay validates shape only, so new games need no relay deploy. `quiz` stays accepted until both phones migrate. |
| Framework | `RoundSession` (session.ts minus quiz specifics) + `GameDef {build, rounds, grade, encode, decode, Input, Reveal}`; shared SpeakerBubble, ChoiceGrid, TileOrder, Transcript, Lobby, Results; `PackStore` and `playSequence` (gapless on the audio clock). |
| Records | slot `listen|<who>|<date>` {r: [[card, pick, grade, ms]…]}; `rowsFor` sends a person's rows to its owner only; `listen_day` is public. SRS state is folded deterministically, never stored. Never compacted. |
| Budgets | hub ≤ 25 KB gz, each game ≤ 15 KB gz, always loaded +0.5 KB; long-form as 3–12 s segments, never one big buffer. |

## 13. Content volume

Rebased to the user's level: the floor stays at today's size, and the volume concentrates in S1–S4.

| Stage | Units | Short items | Dialogues / long texts | Audio | Packs |
|---|---|---|---|---|---|
| S0 はまべ | 3 (existing 144 items, re-voiced) | 150 | — | ~15 min | ~5 MB |
| S1 かわ | 10 | 400 | 40 × 30–60 s | ~2 h | ~45 MB |
| S2 もり | 12 | 450 | 60 × 45–120 s | ~3.5 h | ~75 MB |
| S3 やま | 12 | 350 | 60 × 1–3 min | ~4.5 h | ~95 MB |
| S4 ほし | 10 | 200 | 60 × 2–6 min (segmented) | ~6 h | ~130 MB |
| **Total** | 47 | ~1,550 | ~220 | **~16 h** | ~350 MB (R2) |

Plus variants: each chunk in ≥ 3 clips (voices and conditions), counted above. Condition re-mixes of the same clean master cost no synthesis. The human listening check is the bottleneck: the checks gate, people listen to flags plus 20%.

## 14. Phased release plan

Each increment takes 1–3 agent-days, lands on main green, and ships something the user can play. Each also adds content, so every few days there's new listening.

| # | Increment | Ships | Days |
|---|---|---|---|
| **1** | **ききみみ L4 「かわ・もり」: realistic, harder content in the existing quiz.** ~64 new items from §5.5 seeds (travel, phone, health, work, plans): `reply` with indirect and implied answers, `num` at natural speed in real contexts (platforms, flight numbers, prices in yen/dollars/pounds, self-corrected times), `word` with reductions in context (should've/shouldn't have, I'd/I'll, can/can't in UK), and the new `mean` type (what do they really mean? English paraphrases). `tts` respellings, `note` lines, Japanese collapsed at L4. Contract `lv` 1–3 → 1–4 (relay deploys first). Voices: the neural candidate if picked, else the best `say` voices (the `src` hash re-voices it later automatically). | 2–3 |
| 2 | Neural cast v1: the engine adapter, 12 core voices, villager → voice map, forced-alignment check; re-voice all items; careful takes for S0. | 2–3 |
| 3 | Co-op default and privacy: 「ふたりで n/8」 results, たいせん toggle, copy fixes (おしい！, いっぱつ せいかい！, ★ level names); log each answer to the `listen` day row (owner-only). Progress data starts accruing. | 2 |
| 4 | Dialogue items in the quiz: `gist` / `next` over 2–4-line dialogues (`playSequence`), 24 overheard and service dialogues. | 2–3 |
| 5 | Visuals v1: the SVG scene kit (8 backdrops), channel frames, transcript karaoke and sound marks at the reveal. | 2–3 |
| 6 | Conditions in the pipeline: noise beds, phone band, PA reverb; the アナウンス pack (30 PA, voicemail and IVR items) as a quiz level mix. | 2 |
| 7 | スピード はしご as a quiz mode: 30 ladders. | 1–2 |
| 8 | Framework: `RoundSession`, `GameDef`, `play` intent (relay first), the quiz migrated. | 3 |
| 9 | YAML content compiler and packs, SW cache class, `/dev/listen`. | 3 |
| 10 | ことば タイル with reductions: 60 sentences. | 2 |
| 11 | Placement みみ チェック and per-player stage; tiers in shared games. | 2–3 |
| 12 | SRS fold and 「しずえの おさらい」. | 2–3 |
| 13 | ききとり page: stamps, feature bars, minutes; the couple summary and しずえ's weekly line. | 2 |
| 14 | ようじ でんわ with complications: 20 calls. | 3 |
| 15 | たちぎき: 20 three-person dialogues. | 2–3 |
| 16 | しずえの ニュース: a weekly generated batch with the real weather. | 2–3 |
| 17 | Long-form: segmented talks and podcasts, the comprehension map, notes. | 3 |
| 18 | ジョニーの たび serial, chapter by chapter. | 2 + content |
| 19 | ふたりで ジグソー on errands and overheard dialogues. | 2 |
| 20+ | Content drip: one unit pack (S1 → S4) every 2–3 days; seasonal packs; R2 past 50 MB; shadowing if wanted. | ongoing |

**Every increment's gate:** the listening check passes, CI is green, and after real play the logs show 75–85% success; otherwise re-tune the levers before writing more.

## 15. Resolved conflicts (summary)

| Conflict | Resolution |
|---|---|
| Level band A2–B1+ (brief) vs the user's B1+–C1 | Rebased; A2 is the floor only (S0). |
| Ranking (existing results) vs co-op (panel) | Co-op default; たいせん opt-in with expectation scoring. |
| Slow = stretch (engineer) vs careful take (linguist) | Careful take at S0–S1; segment replay from S2. |
| Unit shape (curriculum) vs session shape (teacher) | Unit = 5 lessons; each lesson = the 4-beat session. |
| Build-first games (game designer) | Re-weighed: quiz expansion, speed ladder, tiles, phone errands, overheard, news first; riddles and fishing later. |
| Per-answer rows (curriculum) vs day rows (engineer) | Day rows, with the pick kept. |
| Placement length (10–18) | 12 adaptive items, starting at S1. |
| Japanese shown | After the reveal only; collapsed from S2; `note` explains the trap. |
| L/R and vowel drills | A floor warm-up and a side drill (みみ トレーニング), not the core quiz. |
| Island currency vs real | Real currencies and places in real-world scenarios; ベル only in island content. |

## 16. Open questions for the user

1. **うめ's level.** Is the partner also around B1+, or lower? This decides how much S0 and parallel-deck work comes early.
2. **Accents.** Which do you meet most (US, UK, AU, or Indian, Singaporean and non-native English at work)? This sets the cast order.
3. **Work content.** What's your field? Meeting and client scenarios can use your real domain's vocabulary.
4. **Realism of language.** Is mild swearing ("damn", "crap", "pissed off") in realistic speech fine at S3–S4?
5. **Real-world vs island framing.** Are real currencies and places (yen, Haneda, a London GP) in scenarios fine, with ベル only for island content?
6. **Japanese at the reveal.** Collapsed by default from S2 (tap to open): OK?
7. **Generated illustrations.** Are local AI-generated backdrops fine, or should we stay with NH art plus the SVG scene kit?
8. **たいせん mode.** Do you want a ranking mode at all, or co-op only?
9. **The news.** Should it be news-style originals on current topics (written by us, dated), or evergreen topics only?
10. **The listening check.** With ~16 h of audio, may people check only what the automatic checks flag plus a 20% sample per unit?
11. **Shadowing.** Is a private microphone echo mode wanted, given the iOS audio-session risk?
12. **The daily hook.** With no push notifications, is しずえ's in-app morning line plus a villager's ♪ bubble enough, or would you like a fixed daily set?
13. **The guest.** Should the guest get placement and a progress page, or only play live games?
