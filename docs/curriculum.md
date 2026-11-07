# ききみみ curriculum: listening English on the island (v1, 2026-11-05; status 2026-11-07)

This is the lead curriculum designer's synthesis of six round-1 proposals (linguist, teacher, Japanese learner panel, curriculum designer, game designer, engineer) and the user's decisive input of 2026-11-05. It is the **why and the plan**; what's built is described in docs/kikimimi.md (the quiz, audio, sync, progress), docs/kikimimi-framework.md (the engine and the games), docs/kikimimi-ux.md (the screens), docs/curriculum-units.md (units) and docs/curriculum-wave2.md (wave 2). Where the build differs from the plan, the section says so in an **As built** line. Settled choices are in docs/decisions.md.

**The user's input overrides the brief.** The learner is at "high school level and higher": TOEIC 700+ years ago, and listening "quite proficient". So the core band is **B1+ → B2 → C1**. A1/A2 material is only a warm-up and a placement floor. The user wants (a) lots of realistic, harder content, (b) a systematic way to make harder, more useful daily-life scenarios, (c) new visuals, (d) incremental releases that show study progress, and (e) natural neural TTS with a large, consistent cast.

**American English first (the user, 2026-11-06: "too much Australian and British slang; I want the focus to be American English").** Every item and dialogue line is American by default: US vocabulary, idioms and spelling (color, apartment, check, elevator, line, vacation, cell phone, fall), US dates and times, dollars where money isn't yen or ベル, US social norms (tipping, small talk), and a US voice (`accent: 'us'`, cast `us-*`). UK/AU slang and phrasing (mate, cheers for thanks, brilliant, rubbish, queue, flat, lift, loo, fortnight, arvo, heaps, reckon, keen, sorted, half nine, fancy a…, how are you going) is gone. UK and AU survive only as **deliberate accent exposure at やま and ほし**: at most 10% of each of those stages, every such item tagged `accent-exposure`, in standard international English rather than slang. はまべ, かわ, もり and every unit lesson are 100% US (bank.test enforces the shares). This overrides the US/UK/AU mix wherever it appears below.

---

## 1. Goals and learner profile

| | |
|---|---|
| **Primary learner** | ウェイ. A Japanese adult in Tokyo, high-school English and more, TOEIC 700+ (old). Reads well and follows clear speech. The gaps are what a 700 score hides: fast, reduced, overlapping, accented and indirect speech; phone and PA audio; group talk; long-form (podcasts, news, meetings). |
| **Second learner** | うめ, level unknown (open question 1). The design keeps a floor (はまべ) and **parallel decks**, so two levels can share one scene. |
| **Guest** | Plays with their own private record and appears in no couple summary. |
| **Goal (12 months)** | Understand natural-speed daily conversation, service calls, meetings and announcements on the first listen, then podcasts and the news at C1. |
| **Focus** | Listening. Speaking only in the opt-in mic modes (docs/kikimimi-mic.md). |
| **Sessions** | 3–10 minutes, solo or 2–3 live, on iPhone 15/16 Safari. No push notifications (the app's rule); the hook is in the app (しずえ's morning line, a villager's ♪ bubble). |

**What "harder" means for this learner.** It isn't rarer words. It's the **conditions** and the **pragmatics**: speed, reduction, overlap, noise, channel, accent, hesitation and self-repair, and meaning that isn't said outright (an implied refusal, sarcasm, hedging, a joke). All six proposals agree that the sentence and its delivery carry the difficulty, never an obscure noun.

## 2. Principles

1. **Real life in island clothes.** Villagers are the cast and the NH world is the stage dressing, but the situations, money, places and stakes are adult and real (yen and dollars; Haneda, a doctor's office, a landlord). Never childish (§5.4).
2. **Listen first, read after.** No text before or during the clip. The transcript, the sound marks and the Japanese come at the reveal.
3. **The first listen is the score.** 「いっぱつ せいかい」 (no replay) is the main measure of automaticity. Replays are free but count as "hard" for spaced repetition.
4. **Conditions, not vocabulary.** Difficulty comes from levers (§5.3), each tagged, so the system can turn one at a time.
5. **Many talkers.** High-variability training: every contrast and phrase is heard from ≥ 4 voices before it counts as covered: the variety comes from many American voices (ages, timbres, a light Southern and a light New York voice), not from many accents.
6. **Co-op over ranking (adopted default).** Live games show a shared score (「ふたりで 7/8」). A ranking is an opt-in たいせん mode.
7. **Results private, summaries shared (adopted default).** Each person's answers, review list and feature profile stay on their own record. Others see only counts and shared summaries (§11).
8. **Teach the trap, not grammar.** One Japanese line on why the sound or the logic fooled you (`note`, ≤ 40 字). No grammar terms.
9. **Ship small and often.** Every increment (1–3 agent-days) adds playable content and stays green (§14).
10. **Measure before scaling.** Each stage's content grows only once real logs show 75–85% success and 3–10-minute sessions.

## 3. Stages and can-dos (rebased to B1+ → C1)

Stages are named after places, never やさしい/むずかしい (the panel found choosing やさしい in front of a partner shaming). The UI shows ★ counts.

| Stage | CEFR | Role | Listening can-do ("I can…") | Rate (syl/s) | Conditions |
|---|---|---|---|---|---|
| **S0 はまべ** ★ | A2–B1 | Floor and warm-up only (today's L1–L2) | catch numbers, prices and key words in clear single sentences | 3.0–3.8 | studio-clean, US only |
| **S1 かわ** ★★ | B1+ | Entry for ウェイ (today's L3 and up) | follow casual exchanges with common reductions (gonna, didja, lemme), phrasal verbs and indirect replies; catch details in service talk | 3.8–4.5 | 1–2 speakers, light café or street noise, US only |
| **S2 もり** ★★★ | B2 | Core | follow native-speed conversation between 2–3 people, phone calls and announcements; tell attitude (annoyed, unsure, joking) and implied refusals; follow self-corrections ("Thursday — no, Friday") | 4.5–5.2 | overlap, phone band, PA reverb, SNR to +10 dB, US only |
| **S3 やま** ★★★★ | B2+ | Core | follow fast group talk with interruptions, workplace meetings, voicemail and support calls with complications; catch sarcasm, hedging and humour; cope with a less familiar accent | 5.0–5.8 | 3 speakers, interruptions, SNR to +5 dB; mostly US, UK/AU as tagged exposure (≤ 10%) |
| **S4 ほし** ★★★★★ | C1 | Stretch | follow podcasts, news, lectures and debates on unfamiliar topics; infer stance; take notes on structure; follow non-native speakers | casual 5.5–6.2, news ~4.5 dense | long-form (2–6 min, segmented); mostly US, UK/AU (later non-native) as tagged exposure (≤ 10%) |

**The quiz levels map** onto the stages (bank.ts `levelRank`, kikimimi-ux.md §4): L1 and L2 → はまべ 1 and 2, L3 → かわ, L4 → もり (S1/S2 material), L6 → やま, L7 → ほし; L5 is the アナウンス pack beside もり, not a stage.

**The sound-feature sequence** (one primary per unit, earlier ones reviewed):

| Stage | Primary features |
|---|---|
| S0 | L/R, the æ/ʌ/ɑ contrasts, -teen/-ty, can/can't, final -s/-ed, katakana stress (a warm-up drill, 「みみ トレーニング」) |
| S1 | weak forms (to/for/of/and/can/have/them), contractions ('d, 'll, 've, I'd've), US flapping, t/d elision, yod coalescence (did you, would you), gonna/wanna/gotta, the US glottal stop (button, can't be) |
| S2 | reduction chains (whaddaya, dunno, lemme, 'cause), h-dropping (tell 'im), assimilation (ten minutes, good boy), contrastive stress, attitude intonation, fillers and false starts |
| S3 | very fast casual speech, overlap and turn-taking, sarcasm prosody, upspeak, light US regional voices; UK/AU accent exposure (tagged, ≤ 10%) |
| S4 | news-reader density, academic stress shifts (PHOtograph/phoTOgraphy), signposting, argument structure, UK/AU accent exposure (tagged, ≤ 10%; non-native later) |

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
| **Pragmatic layer** | literal; indirect request ("It's a bit cold in here"); implied refusal ("I'll see what I can do"); hedging; sarcasm/irony; humour and puns; understatement ("not bad", "kind of a problem"); politeness formula vs real meaning; small-talk ritual; a cliffhanger (what will happen next?) |

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
| Accent | General American, one voice | many US voices | light US regional (Southern, New York) | UK/AU exposure (S3–S4 only, tagged, ≤ 10%) |
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
| Doctor, pharmacy | a normal or smug villager as the doctor or pharmacist; a jock as the patient |
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
| 9 | Immigration: questions → an officer's dry joke | formal / desk / humour | S3 |
| 10 | Airbnb host voicemail: directions to the key box → self-corrects the code | casual / voicemail / self-repair | S2 |
| 11 | Ferry PA in wind: departure → weather cancellation | official / wind +5 dB / literal | S3 |
| 12 | Strangers on a train overheard: plans → you infer where they get off | casual / train noise / inference | S3 |

**B. Health**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 13 | Pharmacy: buy cold medicine → "Are you taking anything else?" drowsiness warning | polite / counter / literal | S1 |
| 14 | Doctor's office phone booking: an appointment → only a callback slot, "the nurse will call you" | polite / phone / policy refusal | S2 |
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
| 46 | Job interview: a tricky question → interviewer's dry humour | formal / office / humour | S3 |
| 47 | Conference talk Q&A: a question → speaker deflects | formal / hall reverb / evasive | S4 |

**F. Social, plans and misunderstandings**

| # | Seed | R / C / P | Stage |
|---|---|---|---|
| 48 | Invitation: a party → "I'll try to make it" (won't) | casual / fast / implied refusal | S1 |
| 49 | Cancelling plans: last minute → excuse, an offer to reschedule | casual / phone / apology | S1 |
| 50 | Group voice chat: choose a restaurant → three opinions, one changes mind | casual / overlap / tracking | S2 |
| 51 | Misheard name at a café: "Wei?" → "Way?" "May?" repair | casual / café noise / repair | S1 |
| 52 | Friends' banter: a bad movie → sarcasm ("Oh, it was *amazing*") | casual / fast / sarcasm | S2 |
| 53 | Barbecue overheard: gossip → who's dating whom | casual / outdoor, 3 speakers / inference | S3 |
| 54 | Birthday planning: a surprise → keep it secret from the one who walks in | casual / interruption / code-switching | S3 |
| 55 | Bar trivia night: questions read fast, banter in between | casual / bar noise / humour | S3 |
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

| # | Game | Trains | Status (2026-11-07) |
|---|---|---|---|
| 1 | **ききみみ クイズ** + L4/L5 and the types `mean`, `gist`, `next` | replies, pragmatics, numbers in real contexts | built (co-op, solo, たいせん; kikimimi.md) |
| 2 | **スピード はしご**: one line at rising speeds, a different question a rung | reductions, rate tolerance | built: 4 rungs, 0.8× → 1.4× by time-stretch, a flat 100 a rung climbed in order on the first listen (kikimimi.md "スピード はしご") |
| 3 | **ことば タイル** with reductions: rebuild what was said, decoys *to/the/a, I'd/I'll, can/can't* | segmentation, weak forms | built (W2-1, kikimimi-framework.md) |
| 4 | **ようじ でんわ**: a call asks for something, then changes it; fill a memo | multi-step detail, self-repair, phone audio | built (W2-3) |
| 5 | **たちぎき**: 2–3 villagers talk, overlap and interrupt | tracking speakers, attitude, inference | built (W2-2) |
| 6 | **しずえの ニュース**: a bulletin, gist + 2 details | long-form, news register | built (W2-5): evergreen bulletins and the real Tokyo weather |
| 7 | **アナウンス** pack: PA, voicemail, IVR menus | channel and noise tolerance | built: quiz level 5 |
| 8 | **フータ／ラジオ** long-form with a comprehension map | structure, stance | partly: ほし (level 7) has talks, news and debates as 2–4-sentence clips; segmented long-form and the map not built |
| 9 | **ジョニーの たび** (story serial) | extensive listening | built as おやすみ ものがたり (§7.1): st-johnny, st-cafe, st-tokyo |
| 10 | **ふたりで ジグソー**: each phone hears half | information gap | folded into the listening games' co-op (two roles, each hears half: games/listened.ts) |
| 11 | **フータの なぞなぞ** (buzz-in riddles) | inference | cut: no clear listening target |
| 12 | **まねっこ エコー** (shadowing) | prosody | revisited as the mic modes (docs/kikimimi-mic.md), private and opt-in |
| 13 | **つり ききわけ** (minimal-pair fishing) | phonemes | cut: barely transfers at TOEIC 700+ |
| — | ラベルの コーデ, ケケの チャント, Redd's fakes | — | parked (low transfer, fragile timing) |

### 7.1 New modes from the second team round (2026-11-06)

The learning scientist, the EFL teacher with the curriculum designer, and the game designer with the Japanese panel proposed 24 modes, merged here and ranked by learning value × fun × cost. All run on the framework (`GameDef`). The user's order: たいかい and おやすみ ものがたり first, then the rest of Tier 1.

**Tier 1 (all built by 2026-11-07).**

| Mode | What it is | Why | Status |
|---|---|---|---|
| **しずえの しゅうまつ たいかい** | A Sunday quiz show from the week's misses: interleaved, levelled per player so the B1+ partner can win, a confidence wager round (かけて ききみみ: the round's own chips, no かいがら) | retrieval, spacing, interleaving, hypercorrection; a weekly ritual | built (kikimimi-framework.md "G-たいかい logic as built"; components/kikimimi/taikai/) |
| **おやすみ ものがたり** | A bedtime story in the tent: no score, a sleep timer, chapters | extensive listening at 95%+ comprehension; the panel: 「これは毎日やる」 | built: 3 serials (kikimimi-ux.md §6.8) |
| **すうじ ラッシュ** | A café rush of orders full of numbers, with mid-stream corrections | numbers under pressure; template-generated | built (W2-4) |
| **よみきき サンド** | Listen blind → read → listen blind again, over any item | the metacognitive cycle; no new content | built (W2-0): solo reveals and review rows only |
| **みんなで ディクトグロス** | Co-op: rebuild a passage together on one tile board | | not built as its own mode; ことば タイル's co-op splits the tiles |

**Tier 2.**
- **トーン あて** (one line sincere / sarcastic / resigned): pending its spike (curriculum-wave2.md §2.6, W2-6: ships only if the clone holds its voice and the user tells the tones apart).
- **いいまわし ずかん + なかよし**: built as ずかん and なかよし (kikimimi-ux.md §6.10, §7.7); friendship never drops.
- **ピーッ！ かいしゅう**: folded into the SRS. **でんごん リレー**: folded into the games' co-op halves.
- Not built: うわさの でんごん, めいたんてい フータ, かいぎの ぎじろく, ざつだん パーティ.

**Tier 3 (later or seasonal, none built):** とたけけの よふかしラジオ, いっしょに クッキング, ウィスプの なぞとき, わらいどころ (humour is hard for TTS); フータの ノート and おなじ はなし、3にん fold into long-form and たちぎき.

**Cut:** minimal-pair fishing (barely transfers at TOEIC 700+), riddles (no listening target), karaoke and the K.K. chant (recall, and singing is embarrassing). Mic modes were parked for iOS fragility and shyness, then designed as private, opt-in modes and approved 2026-11-07 (docs/kikimimi-mic.md; the user's phone probe comes first).

**Two changes the scientist flagged, both adopted:** the speed ladder rewards rungs climbed in order and stops at the first miss; 「いっぱつ」 is a badge, not +30 points (the user's decision, 2026-11-06), so replaying isn't discouraged.

## 8. The visual system

Everything uses the app's paper theme (cream paper, rounded cards, the NH brown ink, soft drop shadows) and stays lazy-loaded.

| Element | What it is | As built (2026-11-07) |
|---|---|---|
| **Scene card** | The setting and the speakers, from the lead-in until the reveal: context the way real life gives it, never the words | built: 8 painted backdrops (generated paper-gouache, Z-Image-Turbo, Apache-2.0, not the planned SVG kit), the villagers' NH art composited over them (docs/kikimimi.md "Visuals"); wave 2's 7 more (ART) pending |
| **Channel frames** | The phone call screen, a PA horn with reverb ripples, a video-call grid, a voicemail | built in CSS/SVG (PhoneFrame, PaFrame, VideoFrame) |
| **Dialogue bubbles** | NH-style bubbles per speaker, empty (「♪…」) while playing; the talker bobs | built |
| **Transcript karaoke** | At the reveal the words light as the clip replays | built, timed by whisper's word alignment (words.json) |
| **Sound marks** | Over the revealed text: the said shape above a reduced run (going to → *gonna*), linking arcs, swallowed letters, stress dots | built: `say`, `link`, `drop`, `stress`, authored per clip (`MARKS` or the sets' `marks`); intonation contours not built |
| **Comprehension map** | A node map or timeline for long-form that fills as you answer | not built (no segmented long-form yet) |
| **Stamps and ずかん** | Can-do stamps, a phrase ずかん, sounds I can hear | built (kikimimi-ux.md §6.10) |

Generated art never shows an NH character or imitates Nintendo's look; the NH art itself stays as the app already uses it (a private app).

**Rule:** no visual may show the answer before the reveal. Scene cards show the setting, never the outcome; transcripts and marks appear only at the reveal.

## 9. Audio and script rules for TTS

**Resolution (slow clips).** The linguist wanted a separate careful-speech take; the engineer, a time-stretch. Adopted: S0–S1 🐢 is a **separate careful take** (「ゆっくり ていねいに」), never a stretch (stretching undoes reductions). From S2 there's no 🐢: support is **segment replay** (one sentence) and the transcript. **As built:** 🐢 is an atempo stretch at 0.75 for L1 and L2 only (the careful takes weren't made; the stretch kept UTMOS in the pilot), and no 🐢 from L3 up.

**The cast (American first, 2026-11-06).** 18 voices: **12 US** (`us-f1…f6`, `us-m1…m6`: ages early twenties to sixties, bright to deep, brisk to unhurried; ten General American, `us-f6` a light Southern and `us-m6` a light New York accent for variety), and 6 kept only for exposure (`uk-f1`, `uk-m1`, `uk-m2`, `au-f1`, `au-m1`, `au-m2`). Nearly every villager's one voice for good (`CAST`: villager → cast) is a US voice; the handful of UK/AU villagers speak only the やま/ほし `accent-exposure` items (≤ 10% of each stage; none at はまべ/かわ/もり or in units). ≥ 4 voices per minimal-pair contrast and per target phrase, from the US cast. Later exposure voices (Irish, Scottish, Indian, non-native English) only at S3–S4, tagged the same way, where the model does them convincingly. A cast "announcer" (PA) and a "newsreader" voice are US. Designed voices only; no cloning of real people without their consent.

**Script rules.**

| Rule | Detail |
|---|---|
| `en` ≠ `tts` | `en` is standard American spelling (shown); `tts` is spelled as said, the American way: gonna, wanna, lemme, dunno, 'cause, d'you, whaddaya, I'd've. Contractions everywhere. |
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

**As built** (docs/kikimimi.md "Audio"): the engine is Qwen3-TTS 1.7B Base, cloning each cast voice's reference; up to 5 seeds a line, re-rolled by the gate. The gate is whisper word for word plus ECAPA voice similarity, UTMOS measured; the forced-alignment checks of reductions weren't built (whisper normalises them), so reductions are a person's to hear in the listening check. Dialogue lines play in turn (a 0.3 s gap); たちぎき's lines may overlap on the audio clock. The Japanese isn't collapsed at the reveal: the user asked for more Japanese help instead (2026-11-07: `cja`, `why`, `ctx`; kikimimi.md "Japanese help").

## 10. Placement, adaptivity and spaced repetition

**Placement 「みみ チェック」.** Private, ~4 minutes, 12 adaptive items. It **starts at S1** (not S0, given the user's level), goes up a band after 2 right and down after 1 wrong, and stops after two reversals. It samples a reduction, a number under noise, an implied-meaning reply, a 30 s gist, an accent and a phone clip. The output is a stage **per sub-skill** (decoding, rate, channel, accent, pragmatics, long-form), not one number. Re-checks are offered quietly at stage boundaries.

**Adaptivity.** An Elo-style ability per player for each lever and feature. Updates go to the learner, not the items (three players give too little data to calibrate items). The target is 75–85% correct: above it, turn one lever up; below it, one down. Two misses in a row make the next item easier without saying so. A first-play correct answer counts more.

**Spaced repetition.** The card is a **chunk, a feature or a scenario skill** ("self-correction in numbers"), never a clip. FSRS-lite intervals 1 / 3 / 7 / 16 / 35 / 90 days. Right first play = good; right after a replay = hard; wrong = again. Each review uses a different clip (voice, accent or condition). 「しずえの おさらい」 is a 3-minute due-only session, capped at 20 cards a day. No streak guilt: a missed day only means more due cards.

**As built.**
- **Placement** (kikimimi/games/check/): the bands are the quiz levels as places (はまべ 1, はまべ 2, かわ, もり, やま, ほし), starting at かわ. 8 to 12 items, about 3 minutes, over this build's skills (すうじ, つながる おと, へんじ・ほんね, にた おと, one gist; accent and phone clips wait for content). The placed band is the reversals' mean, rounded down; each skill's band gives the とくい / これから chips. The result is a `listen` row with `gm: 'check'`. Re-check: せってい's 「みみ チェックを もういちど」 only (no stage-boundary offer yet).
- **Adaptivity and SRS** (docs/kikimimi.md "Progress & feedback"): one Elo-style θ per player (not per lever), the comfortable level at 80 %; Leitner boxes 0 / 1 / 3 / 7 / 16 / 35 / 90 days over item cards (a missed item) and feature cards, folded from the rows, never stored. 「おさらい」 is the due-only mode (🔁 in あそぶ).
- **Storage:** one `listen` row per person **per game**, not per day (a retry is a duplicate, two phones never overwrite each other); each answer keeps its pick, so distractors still diagnose.

## 11. Progress and the couple experience

| Who sees it | What |
|---|---|
| **Me only** | my answers, review lists, feature profile (bars), placement result, due cards, minutes, the can-do stamps and my ずかん |
| **Both members** (shared summaries) | that a person played and for how long (each row's summary `{d, g, n, ms}`, server-enforced by `rowsFor`), co-op game scores, shared stamps (units both cleared), phrases both know, a weekly line in しずえ's broadcast that's always positive ("ふたりで 42ふん きいたよ") |
| **Never shown** | who picked what in a live game (only ✓ chips and 「2にん せいかい」), one partner's level next to the other's (unless both opt in), the guest's data |

**Live play.**
- **Co-op by default:** results read 「ふたりで 7/8」, plus a shared best. たいせん (ranking) is a lobby toggle; it scores against expectation (a hard item for you earns more), so a lower level can win.
- **Parallel decks:** the same scene and audio, with each phone's choices at its player's tier (`tier {easy, hard}`). Only the seed and tiers go on the wire.
- **Asynchronous:** 「ウェイは もう きいたよ」 shows that a set was played, never the score; the same daily set waits for the other.
- **Review together** (optional): ▶︎ synced between phones on the shared review, showing items, not who missed them.

**Rewards** stay light: stamps, ずかん, letters, なかよし, ふたりの クエスト (kikimimi-ux.md §7). No economy tie.

**As built:** co-op default and the たいせん toggle (kikimimi.md "Co-op and たいせん"); たいせん ranks plain points, since expectation scoring waits for per-player stages. Per-player tiers exist in co-op lessons (curriculum-units.md §13) and the listening games' ears, not in the quiz. The asynchronous 「もう きいたよ」 and synced review aren't built.

## 12. The platform

The engineer's proposal was the target; as built (docs/kikimimi-framework.md):

| Piece | Plan → as built |
|---|---|
| Content source | YAML per unit → units in `content/units/*.yaml` and the listening games and stories in `content/listen/`; the level banks stay TypeScript (`source.ts`). `kikimimi/compile.ts` (`npm run kikimimi:levels`) writes a lazy JSON chunk per level, unit, listening file and chapter. |
| Pipeline | `npm run audio:kikimimi` on the M5 Max: TTS → whisper and ECAPA gate (5 seeds) → conditions mixed → −16 LUFS, mono AAC 48 kbps 24 kHz → packs. The drafting lint is the content tests (bank.test, units.ts, near-dupes.test). `/dev/listen` wasn't built: the listening check uses `--listen` and the phone. Listening files show once `listened`, units and serials from `voiced`. |
| Packs | `static/audio/listen/<pack>.<hash>.pak` (whole m4a files end to end, sliced and decoded just in time), immutable; ≤ 1.2 MB a pack, slow ≤ 0.8 MB. 144 packs: the games' 89.3 MiB, the stories' 21.4 MiB. **Pending: W2-R**, the packs on R2 behind a same-origin route (`PACK_BASE`), waits for the user to enable R2 in the Cloudflare dashboard; till then bank.test's lines (92 and 23 MiB) are raised per batch as a stopgap (curriculum-wave2.md §5). |
| Cache | the SW's `island-listen-v1`: cache-first, least recently used past 30 MB, nothing precached. |
| Sync | the generic `play {g, gm, op, …}` intent with `cv` (a mismatch shows 「アプリを こうしんしてね」); lessons and every later game go out on it. The quiz and スピード はしご still send `quiz` (`QUIZ_ON_PLAY` off, pending: both phones on a build that hears `play`). |
| Framework | `RoundSession` + `GameDef`, shared frames (RoundFrame, RevealFrame, ChoiceGrid, Transcript…), `playSequence` on the audio clock. |
| Records | one `listen` row per person per game (§10), owner-only but its summary; SRS folded, never stored, never compacted. |
| Budgets | the sheet ≤ 80 KB gzipped, the hub ≤ 25 KB, each page or game view ≤ 15 KB, each level's chunk ≤ 60 KB (scripts/kikimimi-budget.ts fails the build). |

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

**As of 2026-11-07:** the level banks hold 862 items (L1–L7: 46 / 49 / 89 / 297 / 30 / 236 / 115, bank.test), plus 30 ladders, 21 units (かわ 10, もり 11), 26 listening files and 3 serials; 144 packs, ~111 MiB (§12).

## 14. Phased release plan

Each increment took 1–3 agent-days, landed on main green and shipped something playable. Status on 2026-11-07:

| # | Increment | Status |
|---|---|---|
| 1 | ききみみ L4 「かわ・もり」: harder, realistic content in the quiz (`mean`, `tts`, `note`) | built (kikimimi.md "Level 4"); the Japanese not collapsed (§9) |
| 2 | Neural cast | built: Qwen3-TTS, 18 voices (12 US); careful takes for S0 not made (§9) |
| 3 | Co-op default, たいせん, the `listen` row | built (a row per game, §10) |
| 4 | Dialogue items (`gist` / `next`, `playSequence`) | built |
| 5 | Visuals: backdrops, channel frames, karaoke, sound marks | built (painted, not the SVG kit: §8) |
| 6 | Conditions in the pipeline and the アナウンス pack | built (kikimimi.md "Conditions", "The アナウンス pack") |
| 7 | スピード はしご | built |
| — | Content sprint: もり +170, やま (L6), ほし (L7), less repetition | built (kikimimi.md "Levels 6 and 7", "Variety") |
| 8 | Framework: `RoundSession`, `GameDef`, `play` | built (8b, 8c); `QUIZ_ON_PLAY` off, pending (§12) |
| 9 | Compiler, packs, the SW cache | built; `/dev/listen` dropped (§12); R2 pending (W2-R) |
| 10 | ことば タイル | built (W2-1) |
| 11 | Placement みみ チェック; tiers in shared games | placement built (§10); tiers in co-op lessons and the listening games only |
| 12 | SRS fold and おさらい | built |
| 13 | きろく: stamps, bars, minutes, the couple summary | built |
| 14 | ようじ でんわ | built (W2-3) |
| 15 | たちぎき | built (W2-2) |
| 16 | しずえの ニュース | built (W2-5): evergreen, not a weekly batch (curriculum-wave2.md §5) |
| 17 | Long-form: segmented talks, the comprehension map | not built (ほし's clips cover talks in short) |
| 18 | The story serial | built as おやすみ ものがたり |
| 19 | ふたりで ジグソー | folded into the games' co-op halves (§7) |
| 20+ | Content drip: unit packs, seasonal packs, R2, shadowing | units by wave (curriculum-units.md, curriculum-wave2.md); R2 pending; the mic modes (docs/kikimimi-mic.md) |

**Every increment's gate:** the listening check passes, CI is green, and after real play the logs show 75–85% success; otherwise re-tune the levers before writing more.

## 15. Resolved conflicts (summary)

| Conflict | Resolution |
|---|---|
| Level band A2–B1+ (brief) vs the user's B1+–C1 | Rebased; A2 is the floor only (S0). |
| Ranking (existing results) vs co-op (panel) | Co-op default; たいせん opt-in (expectation scoring later). |
| Slow = stretch (engineer) vs careful take (linguist) | Careful take at S0–S1 planned; as built, a stretch at L1–L2 (§9). |
| Unit shape (curriculum) vs session shape (teacher) | Unit = 5 lessons; each lesson = the 4-beat session. |
| Build-first games (game designer) | Re-weighed: quiz expansion, speed ladder, tiles, phone errands, overheard, news first; riddles and fishing later. |
| Per-answer rows (curriculum) vs day rows (engineer) | Neither: a row per game, with the pick kept (§10). |
| Placement length (10–18) | 12 adaptive items, starting at S1. |
| Japanese shown | After the reveal only (`ctx` before it); `note`, `cja` and `why` explain the trap; not collapsed (§9). |
| L/R and vowel drills | A floor warm-up and a side drill (みみ トレーニング), not the core quiz. |
| Island currency vs real | Real currencies and places in real-world scenarios; ベル only in island content. |
| US/UK/AU mix (v1) vs the user's American focus (2026-11-06) | American English everywhere; UK/AU only as tagged accent exposure at やま/ほし (≤ 10%). |

## 16. Open questions for the user

**Open:**
- Q1. **うめ's level.** Around B1+, or lower? みみ チェック (§10) now measures it; it decides how much はまべ and parallel-deck work comes early.
- Q3. **Work content.** What's your field? Meeting and client scenarios can use your real domain's vocabulary.
- Q4. **Realism of language.** Is mild swearing ("damn", "crap", "pissed off") fine at やま and ほし?

**Settled** (an answer, or the default taken and built; say if you want otherwise):
- Q2. Accents: American English; UK/AU only as tagged exposure at やま/ほし (the user, 2026-11-06).
- Q5. Real currencies and places in real-world scenarios, ベル only in island content (built).
- Q6. Japanese at the reveal: shown, with more help (the user, 2026-11-07), not collapsed.
- Q7. Generated backdrops: built (§8).
- Q8. たいせん: an opt-in toggle, co-op the default (the user's choice).
- Q9. The news: evergreen bulletins plus today's real Tokyo weather (curriculum-wave2.md §5).
- Q10. The listening check: the gate's flags, heard by the user on the phone after each batch.
- Q11. Shadowing: the mic modes, approved 2026-11-07 (docs/kikimimi-mic.md).
- Q12. The daily hook: the hub's daily menu (kikimimi-ux.md §7.1), no push.
- Q13. The guest: its own きろく, no couple summary.
