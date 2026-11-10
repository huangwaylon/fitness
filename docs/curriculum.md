# ききみみ curriculum: what is taught, and the content

What ききみみ teaches, how content is made harder, the units, and what's written. The games are [kikimimi.md](kikimimi.md); the engine and the audio pipeline, [kikimimi-engine.md](kikimimi-engine.md); speaking, [kikimimi-mic.md](kikimimi-mic.md). The listening files' schemas are app/content/listen/README.md.

## Goals

| | |
|---|---|
| **Primary learner** | ウェイ: a Japanese adult in Tokyo, TOEIC 700+, reads well and follows clear speech. The gaps are what a 700 score hides: fast, reduced, overlapping and indirect speech; phone and PA audio; group talk; long-form (podcasts, news, meetings). |
| **Second learner** | うめ, around B1+ (みみ チェック measures it). The design keeps a floor (はまべ) and per-player tiers, so two levels share one scene. The guest plays with its own private record, in no couple summary. |
| **Goal (12 months)** | Natural-speed daily conversation, service calls, meetings and announcements on the first listen; then podcasts and the news at C1. |
| **Focus** | Listening. Speaking only in the opt-in mic modes. |
| **Sessions** | 3–10 minutes, solo or 2–3 live, iPhone Safari. No push notifications: the hook is in the app (the daily menu, しずえ's line). |

So the core band is **B1+ → B2 → C1**; A1/A2 material is only a warm-up and a placement floor. "Harder" isn't rarer words: it's the **conditions** (speed, reduction, overlap, noise, channel, accent, hesitation, self-repair) and the **pragmatics** (an implied refusal, sarcasm, hedging, a joke). The sentence and its delivery carry the difficulty, never an obscure noun.

## Principles

1. **Real life in island clothes.** Villagers are the cast and the NH world the stage dressing; the situations, money, places and stakes are adult and real ("The island frame").
2. **Listen first, read after.** No text before or during the clip; the transcript, sound marks and Japanese come at the reveal (`ctx` sets the situation before it).
3. **The first listen is the measure** (いっぱつ). Replays are free but count as "hard" for spaced repetition.
4. **Conditions, not vocabulary.** Difficulty comes from tagged levers, turned one at a time, so a miss is diagnosable.
5. **Many talkers.** Every contrast and phrase is heard from ≥ 4 voices before it counts as covered: many American voices (ages, timbres, a light Southern and a light New York voice), not many accents.
6. **Co-op over ranking**; a ranking is opt-in (しょうぶ).
7. **Results private, summaries shared** ("The couple").
8. **Teach the trap, not grammar.** One Japanese line on why the sound or the logic fooled you (`note`, ≤ 40 字), `why` for the full かいせつ. No grammar terms.
9. **Short, fun, never homework:** ≤ 3 min a game, tap only, no streaks; the one keyboard is 音の へんしん's dictation, with tiles beside it.
10. **Measure before scaling.** A stage's content grows only once real play shows 75–85 % first-listen success.

## American English first

Every item and dialogue line is American by default: US vocabulary, idioms and spelling (color, apartment, check, elevator, line, vacation, cell phone, fall), US dates and times, dollars where money isn't yen or ベル, US social norms (tipping, small talk), and a US voice (`voice: 'us'`, cast `us-*`). UK/AU slang and phrasing (mate, cheers for thanks, brilliant, rubbish, queue, flat, lift, loo, fortnight, arvo, reckon, keen, half nine, fancy a…) is out. UK and AU survive only as deliberate **accent exposure at やま and ほし**: ≤ 10 % of each, every such item tagged `accent-exposure`, in standard international English rather than slang. はまべ, かわ, もり and every unit and listening file are 100 % US. bank.test's accent policy enforces the shares and the US-only lint (listen.ts `notUs`) the wording.

## Stages and can-dos

Stages are places, never やさしい / むずかしい; the UI shows ★ (kikimimi.md "Places"). L5 is the アナウンス pack beside もり (bank.ts `levelRank`), not a stage.

| Stage | CEFR | Role | Listening can-do ("I can…") | Rate (syl/s) | Conditions |
|---|---|---|---|---|---|
| **S0 はまべ** ★ | A2–B1 | floor and warm-up (L1–L2) | catch numbers, prices and key words in clear single sentences | 3.0–3.8 | studio-clean |
| **S1 かわ** ★★ | B1+ | entry (L3) | follow casual exchanges with common reductions (gonna, didja, lemme), phrasal verbs and indirect replies; catch details in service talk | 3.8–4.5 | 1–2 speakers, light café or street noise |
| **S2 もり** ★★★ | B2 | core (L4) | follow native-speed conversation between 2–3 people, phone calls and announcements; tell attitude and implied refusals; follow self-corrections ("Thursday — no, Friday") | 4.5–5.2 | overlap, phone band, PA reverb, SNR to +10 dB |
| **S3 やま** ★★★★ | B2+ | core (L6) | follow fast group talk with interruptions, meetings, voicemail and support calls with complications; catch sarcasm, hedging and humour; cope with a less familiar accent | 5.0–5.8 | 3 speakers, interruptions, SNR to +5 dB; UK/AU exposure ≤ 10 % |
| **S4 ほし** ★★★★★ | C1 | stretch (L7) | follow podcasts, news, lectures and debates on unfamiliar topics; infer stance; follow structure | casual 5.5–6.2, news ~4.5 dense | long-form; UK/AU exposure ≤ 10 % |

**The sound-feature sequence** (one primary per unit, earlier ones reviewed; stages.ts `STAGES`):

| Stage | Primary features |
|---|---|
| S0 | L/R, the æ/ʌ/ɑ contrasts, -teen/-ty, can/can't, final -s/-ed, katakana stress |
| S1 | weak forms (to/for/of/and/can/have/them), contractions ('d, 'll, 've), US flapping, t/d elision, yod coalescence (did you, would you), gonna/wanna/gotta, the US glottal stop |
| S2 | reduction chains (whaddaya, dunno, lemme, 'cause), h-dropping (tell 'im), assimilation (ten minutes), contrastive stress, attitude intonation, fillers and false starts |
| S3 | very fast casual speech, overlap and turn-taking, sarcasm prosody, upspeak, light US regional voices; UK/AU exposure |
| S4 | news-reader density, academic stress shifts (PHOtograph/phoTOgraphy), signposting, argument structure |

## Tracks

Strands inside units, not separate apps; each unit belongs to one, and reviews mix them all.

| Track | Content | Weight S1 / S2 / S3 / S4 |
|---|---|---|
| **Life** | shops, trains, the doctor, the bank, the landlord, travel, phone support | 50 / 35 / 25 / 10 |
| **People** | friends, the partner, group chats, parties, gossip, humour, slang, idioms in character | 35 / 35 / 30 / 20 |
| **Work** | small talk, meetings, video calls, requests, negotiation, feedback | 10 / 20 / 30 / 25 |
| **Broadcast** | announcements, しずえ's news, K.K.'s radio, フータ's talks, podcasts, story serials | 5 / 10 / 15 / 45 |

## Scenarios

### The generator

A scenario seed is one value from each dimension; an author turns it into a script, and the tags go on every item so difficulty can be turned one lever at a time.

| Dimension | Values (examples) |
|---|---|
| **Setting** | konbini, station/train, airport, hotel, restaurant/café, doctor/pharmacy/dentist, bank/post office, phone support, landlord/repairs, gym, office/meeting/video call, party/bar, home, shop/returns, taxi, ward office, school, broadcast |
| **Goal** | get information, buy/order, book/change/cancel, fix a problem, complain/get a refund, ask a favour, invite/accept/decline, make a plan, directions, an opinion, negotiate, report, follow instructions |
| **Complication** | sold out or cancelled, a delay or gate change, a wrong item or bill, a misunderstanding (a name, a number, a homophone), a mind changed midway, a policy refusal, transferred or on hold, a bad line, a second speaker cutting in, a time conflict, a missing document, an emergency |
| **Register** | stranger/service (polite), colleague (neutral), boss/client (deferential), friend (casual), partner (intimate, teasing), neighbour/landlord (careful), official (formal, scripted), broadcaster (read speech) |
| **Speech conditions** | rate, reduction density, overlap and interruption, noise (SNR +20 → +5 dB), channel (phone band, voicemail, PA reverb, video dropouts), accent, hesitation, fillers and self-correction, 2–3 speakers |
| **Pragmatic layer** | literal; indirect request ("It's a bit cold in here"); implied refusal ("I'll see what I can do"); hedging; sarcasm/irony; humour; understatement ("not bad"); politeness formula vs real meaning; small-talk ritual; a cliffhanger |

### Question angles

Every scenario yields several question types from one recording, so audio is reused: gist, detail / number, inference, attitude, next line, repair (which detail was corrected), rebuild (ことば タイル). Example: "Your 6:40 to Osaka has been moved to platform 14 — not 12 — and is running about ten minutes behind." → どんな アナウンス？ / なんばんせん？ 12 / **14** / 40 / What should you do?

### Difficulty levers

An item's difficulty is the sum of its steps; adaptivity moves one lever at a time. The noise steps built so far are +15 dB (light) and +10 dB (heavy) (kikimimi-engine.md "Conditions"); +5 dB waits for S3 content.

| Lever | Step 0 | Step 1 | Step 2 | Step 3 |
|---|---|---|---|---|
| Rate | careful (S0) | natural | brisk | fast casual |
| Reduction | citation | contractions | weak forms + flaps | chains (whaddaya, dunno) |
| Speakers | 1 | 2, turn by turn | 2 with overlap | 3 with interruptions |
| Noise (SNR) | clean | +20 dB | +10 dB | +5 dB |
| Channel | studio | room | phone/voicemail | PA reverb, video dropouts |
| Accent | General American, one voice | many US voices | light US regional | UK/AU exposure (S3–S4, tagged) |
| Disfluency | none | fillers | false starts | self-correction that changes the answer |
| Pragmatics | literal | indirect | implied refusal/hedge | sarcasm, irony, humour |
| Distractors | far | heard in the clip | the corrected value | the plausible wrong inference |
| Length | 1 line | 3–6 lines | 30–60 s | 2–6 min, segmented |
| Support | 🐢 slow take | replay | segment replay | one play only |

### The island frame

The frame is Animal Crossing, the content is real: villagers play people; real-world scenes use real currencies and places; ベル and island settings appear only in island-flavoured content (S0, しずえ's island news). Generated art never shows an NH character.

| Real setting | Who speaks, the scene |
|---|---|
| Airport, flights | ロドリー and モーリー at the Dodo Airlines desk; ジョニー stranded abroad |
| Trains, taxis, ferries | カッペイ as driver or conductor; a cast "announcer" for the PA |
| Office, ward office | しずえ as the colleague, たぬきち as the manager |
| Shops, konbini | まめきち・つぶきち at the counter; エイブル姉妹 for clothes and sizes |
| Café, restaurant | マスター at the café; villagers as diners and staff |
| Doctor, pharmacy | a normal or smug villager as the doctor; a jock as the patient |
| Bank, phone support, scams | the NookPhone call screen; つねきち as the suspicious caller |
| Landlord, repairs | たぬきち as the landlord; a cranky villager as the neighbour |
| News, radio, lectures | しずえ's morning broadcast, K.K.'s radio, フータ and フーコ talks |

### The scenario bank

Items and listening files tag their seeds (`tags.seed`, `seeds: [...]`). Stage is where a seed first appears; each can be re-cut harder with the levers. R / C / P = register / conditions / pragmatic layer.

| # | Seed (setting: goal → complication) | R / C / P | Stage |
|---|---|---|---|
| 1 | Airport desk: check in → overbooked, a voucher offered | polite / desk noise / politeness formula | S1 |
| 2 | Gate PA: board → gate change and a delay, then a correction | official / PA reverb / literal | S1 |
| 3 | Hotel desk: check in → room not ready, an upgrade "for a small fee" | polite / lobby / implied upsell | S1 |
| 4 | Taxi: an address → the driver mishears the street | casual / car noise, accent / repair | S2 |
| 5 | Train: transfer → service suspended, replacement bus, platform change | official / station PA / literal | S2 |
| 6 | Lost luggage: report a bag → a missing form, a reference read fast | neutral / fast numbers / literal | S2 |
| 7 | Car rental: pick up → insurance upsell, deposit hold explained fast | polite / brisk / hedge | S3 |
| 8 | Missed connection: rebook → three options, each with a catch | neutral / overlap / implied | S3 |
| 9 | Immigration: questions → an officer's dry joke | formal / desk / humour | S3 |
| 10 | Rental host voicemail: the key box → self-corrects the code | casual / voicemail / self-repair | S2 |
| 11 | Ferry PA in wind: departure → weather cancellation | official / wind +5 dB / literal | S3 |
| 12 | Strangers on a train overheard → infer where they get off | casual / train noise / inference | S3 |
| 13 | Pharmacy: cold medicine → "Are you taking anything else?" | polite / counter / literal | S1 |
| 14 | Doctor's office phone booking → only a callback, "the nurse will call you" | polite / phone / policy refusal | S2 |
| 15 | Doctor: symptoms → fast follow-up questions, dosage | neutral / brisk / literal | S2 |
| 16 | Dentist reception: reschedule → a cancellation fee hinted | polite / phone / implied | S2 |
| 17 | Gym trainer: instructions → corrects form mid-set | casual / gym music / self-repair | S1 |
| 18 | Friend on a diet: dinner plans → hedges, means no | casual / café / implied refusal | S2 |
| 19 | Health podcast: sleep research → host and guest disagree | broadcast / two hosts / stance | S4 |
| 20 | Hospital PA plus a nurse: directions → interruptions | official / reverb, overlap / literal | S3 |
| 21 | Bank phone menu: report a card → IVR, a human, a security question | formal / phone / literal | S2 |
| 22 | Mobile carrier: roaming charges → transferred twice, on hold | polite / hold music / "unfortunately" | S3 |
| 23 | Scam call: "your parcel" → spot the red flags | fake-polite / phone / deception | S3 |
| 24 | Post office: send abroad → customs form, three price tiers | neutral / counter / literal | S1 |
| 25 | Internet installer: book → "between 8 and 1", someone home | casual / phone / literal | S2 |
| 26 | Refund at a shop → "store credit only" | polite / shop / policy refusal | S2 |
| 27 | Restaurant bill: split → service charge dispute, a joke | casual / restaurant / humour | S2 |
| 28 | Insurance claim voicemail: a reference and deadlines read fast | formal / voicemail / literal | S3 |
| 29 | Subscription cancel: a retention offer → refuse politely | polite / phone / persistence | S3 |
| 30 | Landlord: a leak → "should be fine", vague timing | careful / phone / evasive | S2 |
| 31 | Plumber visit: diagnosis → options and costs, jargon | casual / room noise / literal | S2 |
| 32 | Neighbour: noise complaint → softened with small talk | careful / doorstep / indirect | S2 |
| 33 | Moving company: quote → hidden extras | neutral / phone / hedge | S3 |
| 34 | Building manager PA: water shut-off → times corrected | official / PA / self-repair | S1 |
| 35 | Partner at home: what to cook → teasing, a mind changed | intimate / kitchen / humour | S1 |
| 36 | Partner: weekend plans → "I'm easy" (they're not) | intimate / fast / implied | S2 |
| 37 | Delivery driver: missed parcel → leave with a neighbour? | casual / doorstep / literal | S1 |
| 38 | Coffee machine small talk → "we should grab lunch" (ritual) | neutral / office / small-talk ritual | S1 |
| 39 | Video call → "you're on mute", dropouts, two talk at once | neutral / video / literal | S2 |
| 40 | Meeting: move the deadline → the boss hedges | deferential / 3 speakers / hedge | S3 |
| 41 | Client call: scope change → polite pushback | formal / phone / negotiation | S3 |
| 42 | Feedback chat → praise sandwich, the point in the middle | neutral / 1:1 / indirect | S3 |
| 43 | Onboarding: instructions → acronyms, "does that make sense?" | neutral / brisk / literal | S2 |
| 44 | Stand-up: three updates → overlap, find who's blocked | casual / 3 speakers fast / inference | S3 |
| 45 | Colleague's voicemail: a favour → rambling, the ask at the end | casual / voicemail / indirect | S2 |
| 46 | Job interview: a tricky question → dry humour | formal / office / humour | S3 |
| 47 | Conference Q&A → the speaker deflects | formal / hall reverb / evasive | S4 |
| 48 | Invitation: a party → "I'll try to make it" (won't) | casual / fast / implied refusal | S1 |
| 49 | Cancelling plans last minute → an excuse, a reschedule | casual / phone / apology | S1 |
| 50 | Group voice chat: a restaurant → three opinions, one changes | casual / overlap / tracking | S2 |
| 51 | Misheard name at a café: "Wei?" → "Way?" "May?" | casual / café noise / repair | S1 |
| 52 | Friends' banter: a bad movie → sarcasm | casual / fast / sarcasm | S2 |
| 53 | Barbecue overheard: gossip → who's dating whom | casual / outdoor, 3 speakers / inference | S3 |
| 54 | Birthday planning: a surprise → hide it from the one who walks in | casual / interruption / code-switching | S3 |
| 55 | Bar trivia: questions read fast, banter between | casual / bar noise / humour | S3 |
| 56 | Date planning: "next Friday" misunderstood | intimate / casual / ambiguity | S2 |
| 57 | Venting to a friend → pick the supportive reply | casual / emotional / attitude | S2 |
| 58 | A stranger asks directions in Tokyo → follow their paraphrase | polite / street / repair | S1 |
| 59 | しずえ's morning news: island news plus the real Tokyo weather | broadcast / clear / literal | S1 |
| 60 | Weather forecast: a typhoon warning with times and areas | broadcast / dense numbers / literal | S2 |
| 61 | K.K.'s radio: a listener call-in, a bad line | broadcast + caller / phone / humour | S3 |
| 62 | News bulletin: three stories, a correction at the end | broadcast / news-dense / literal | S3 |
| 63 | Podcast: two hosts, tangents and laughter | casual broadcast / overlap / humour | S4 |
| 64 | フータ's lecture: why fossils form, with signposting | academic / hall / structure | S4 |
| 65 | Debate: remote work, interruptions | broadcast / overlap / stance | S4 |
| 66 | ジョニー's travel serial: a chapter with a cliffhanger | narrative / multi-voice / prediction | S2 |

### Personality and register

Personality keeps register memorable: jock (gym, health, hype slang), peppy (pop slang, upspeak), snooty (shopping, understatement), lazy (food, "I'm beat"), cranky (complaints, dry humour), smug (explanations, workplace jargon), sisterly (idioms, blunt advice), normal (home life, polite requests).

## Modes

What each game trains, and why it's there (the rules: kikimimi.md and kikimimi-engine.md "The games"). Ranked by learning value for two B1+ learners × fun × cost; phonemic drills sit at the floor, tasks with complications, overheard talk and long-form above.

| Mode | Trains | Notes |
|---|---|---|
| ひとこと クイズ (levels 1-7) | replies, pragmatics (`mean`, `gist`, `next`), numbers in context | the base game |
| アナウンス (level 5) | channel and noise tolerance: PA, voicemail, IVR menus | |
| スピード はしご | rate tolerance, reductions | rewards rungs climbed in order on the first listen, stops at the first miss |
| 音の へんしん | decoding American connected speech (reductions, flaps, linking, elision, weak forms) | daily, 8 phrases; pick the full form, then dictation; many voices ("Connected speech") |
| ことば タイル | segmentation, weak forms, contractions, h-drop, chains | decoys are sound traps, tiles shown only after the first listen, so it stays listening, not a grammar puzzle |
| たちぎき | tracking 3 speakers, attitude, mind change, inference through overlap | the only three-speaker training |
| ようじ でんわ | multi-detail listening, self-repair, phone audio | chips, not typing; the basket is the payoff; the units' チェック |
| すうじ ラッシュ | numbers at speed, self-repair, teen/ty, yen and dollars | template-made; a miss never ends the run |
| しずえの ニュース | news register, signposting, extended listening; the bridge to ほし | 60–75 s and 3 taps, the real weather as the hook, no hub card; evergreen bulletins (nothing to fact-check or go stale) |
| しゅうまつ たいかい | retrieval, spacing, interleaving, hypercorrection (the wager) | levelled per player so the B1+ partner can win |
| まるごと 聞く | C1 listening: 2–5 minute real and generated conversations heard whole; gist, implication, attitude, next step; dictation near misses | ほし; "Long listening" |
| おやすみ ものがたり | extensive listening at 95 %+ comprehension | no score; 3 serials (st-johnny, st-cafe, st-tokyo) |
| よみきき サンド | the listen → read → listen cycle (metacognition) | no new content; the clip always plays blind first |
| おさらい, みみ チェック | spaced review of what tripped you; placement | |
| the mic modes | prosody, sentence rebuilding, minimal pairs in production | private, opt-in (kikimimi-mic.md) |

**Not built:** segmented talks with a comprehension map; トーン あて ("Backlog"); うわさの でんごん, めいたんてい フータ, ざつだん パーティ (turn-taking taps are fragile on the audio clock); かいぎの ぎじろく (work is already the heaviest domain); ながら ききみみ (WebKit suspends audio on lock); とたけけの よふかしラジオ, いっしょに クッキング, わらいどころ (humour is hard for TTS). **Cut:** minimal-pair fishing (barely transfers at TOEIC 700+), riddles (no listening target), karaoke and the K.K. chant (recall, and singing is embarrassing), ふたりで タイル (dictogloss) and an earphones-only split (the listening games' two roles cover the information gap).

## Visual rules

The paper theme; lazy-loaded. Scene cards show the setting and the speakers, never the words or the outcome; transcripts and marks appear only at the reveal. Channel frames (phone, PA, video, voicemail), NH-style empty bubbles while playing, karaoke and sound marks at the reveal (kikimimi.md "Visuals"). Generated backdrops never show an NH character or imitate Nintendo's look; the NH art itself stays as the app already uses it. Not built: intonation contours over the text, a comprehension map.

## Audio and script rules

- **The cast** (kikimimi-engine.md "Generation"; `app/scripts/tts/cast.json`): 12 US voices (ten General American, a light Southern, a light New York) and 6 UK/AU for exposure only; each villager one voice for good; ≥ 4 voices per minimal-pair contrast and per target phrase. Designed voices only; no cloning of real people. Later exposure voices (Irish, Scottish, Indian, non-native) only at S3–S4, tagged the same way.
- **🐢** is an atempo stretch at 0.75 for L1 and L2 only (it kept UTMOS); from L3 there's no 🐢, since a stretch undoes reductions: support is replay and the transcript.

| Rule | Detail |
|---|---|
| `en` ≠ `tts` | `en` is standard American spelling (shown); `tts` is spelled as said: gonna, wanna, lemme, dunno, 'cause, d'you, whaddaya. Never a respelling that voices the distractor. |
| Numbers as spoken | "six forty", "fifteen hundred yen", "the thirteenth", "oh-nine-oh"; never digits for the engine (digit-free `tts` is checked). |
| Punctuation is prosody | comma = tone-unit break; "—" a break or self-repair; "…" trailing off. |
| Disfluency on purpose | fillers (um, like, y'know), false starts, self-corrections, written in. |
| Rate by style | "fast casual chat" in the text, not stretching (except スピード はしご's rungs). |
| Multi-speaker | one clip per line; overlap made on the audio clock (a negative `at`), never baked. |
| Conditions in the mix | beds at set SNRs, phone band, PA reverb, dropouts, all offline from the clean master. |
| Checks | whisper hears every word (numbers and contractions normalised) and ECAPA holds the voice; reductions aren't machine-checked (whisper normalises them), so they're for the listening check. |
| Tags | `features[]`, `register`, `conditions[]`, `pragmatic`, `seed` on every item from level 4: they drive the levers, review and the skills. |
| Japanese | `ja`, `note` (≤ 40 字), `ctx` (≤ 30 字, never the answer), `cja` (one per choice, no English), `why` (≤ 90 字, names the trap). Shown, not collapsed, at the reveal. |
| Licence | all scripts original: no copyrighted lyrics, broadcasts or news audio. |

## Placement and spaced repetition

- **Placement, みみ チェック:** private, ~3 minutes, 8–12 adaptive items, starting at かわ (not はまべ, given the learners' level), up after 2 right, down after 1 wrong, stopping after two reversals; a band per skill gives とくい / これから. Re-check from せってい only. Not yet sampled: accent and phone clips; a stage-boundary re-check offer.
- **Adaptivity:** one Elo-style ability per player, and each item's difficulty learned from that player's answers, seeded from where it's filed (its place and type; an item's own shift and its shelf's, bounded). おさらい picks the items nearest the 75–85 % target (the comfortable level at 80 %). Per-lever abilities aren't built.
- **Spaced repetition:** the card is a chunk or a feature, never a clip; each review uses a different clip where one tests the same (a sibling: the same level, type and sound or skill), else the same clip with its choices turned. Intervals 0 / 1 / 3 / 7 / 16 / 35 / 90 days; right first play good, after a replay hard, wrong again. No streak guilt: a missed day only means more due cards (capped at 8 a day). As built: kikimimi.md "Progress & feedback", kikimimi-engine.md "みみ チェック".

## The couple

| Who sees it | What |
|---|---|
| **Me only** | my answers, review lists, skill bars, placement, due cards, minutes, my stamps and ずかん |
| **Both members** | that a person played and for how long (each row's summary `{d, g, n, ms}`, server-enforced by `rowsFor`), co-op scores, shared stamps, the couple quest's minutes |
| **Never shown** | who picked what in a live game (only ✓ chips and 「2にん せいかい」), one partner's level next to the other's, the guest's data |

Co-op by default; per-player tiers on the same audio (co-op lessons and the listening games: each phone's choices at its player's tier, only the seed and tiers on the wire); しょうぶ scored against expectation where a game supports it (the tournament, すうじ ラッシュ), so a lower level can win.

## Units

The units are the path's stops (kikimimi.md "しまの みち"): one situation, one can-do, three short games.

### The spine

The stage stays the spine; units are its stops. A **domain** is a tag, not a place on the map (an icon, a tint, a filter chip). The nine domains: ともだち (friends, partner, family), いえ (home, daily life, tech trouble), たべもの, かいもの (shopping and services), たび (travel, showing a friend around Tokyo), しごと, イベント, まち (places, hobbies, going out), からだ (health and emergencies). **Coverage**, checked by the compiler: each stage covers ≥ 7 of the 9 domains and no domain is over 25 % of a stage (a warning until the stage has its planned units). **Glue anchor units** open each stage and are reused across domains: introducing, inviting, asking for clarification, ending a conversation.

### A unit

- **One situation, one can-do**, from the CEFR Companion Volume's listening scales: 「[だれ]が [なにを する]のを [どんな じょうけんで] きいて、[じょうほう／いと]が わかる」, with an English sentence ("I can follow …, and catch/tell …") and a one-line `short` for the UI.
- **6–10 key phrases** (`ph`), each with register, scene and the trap a Japanese speaker falls into, heard in ≥ 3 items by ≥ 2 voices; ≥ 20 % of a unit's items recycle a lower stage's or the anchors' phrases. A phrase is **caught** when right on the first listen in 3 different items on ≥ 2 days.
- **A host villager, a scene, one main sound feature** from the stage's list. **Names are can-do verbs:** 「よていを かえる」, 「ききかえす」, 「おいわいする」. Never 「レッスン」.
- About 30 items, 100 % US; a 40–60-word letter from the host; a 「きょうの ひとこと」 (one line for the couple to say tonight, in the file's header comment).

### Lessons

- **A lesson is one game:** 6 questions, about 2½ minutes, using the existing round types.
- **The core is 3 lessons:** **であい** (a model dialogue for the gist), **ばめん** (variations: other voices, replies, implied meaning), **チェック** (a mission on held-out items, ≥ 2 voices; 5 of 6 right on the first listen stamps the unit; retakeable, never locked).
- **2 optional extras** that never block the stamp: **おと** (the chunks in connected speech: `word` items or tiles) and **じっせん** (faster, over noise, other voices).
- **Skipping:** 「とばして チェック」 goes straight to the check. A stamped unit returns once, after ~30 days, as a solo 6-question recheck (menu card 1).
- **Quick modes stay:** ひとこと クイズ, はしご and アナウンス draw from the whole stage; quick play counts toward ずかん phrases and the menu but never moves a unit's lesson dots.

### Playing together

- **Write once, play at both levels:** one unit, the same audio, each player's choices at their tier (`tiers` in the unit file).
- **Shared passes:** a co-op チェック the team passes stamps everyone in it. The row carries `tm` (0–6), the team's first-listen rights from the session's tally (`teamFirst`), the same on every phone; contract/listen.ts `stampsUnit`: `l` 3, with my own ≥ 5 right on the first listen or `tm` ≥ 5. The partner's summary carries `{u, stamped: 1}`; both stamped is the double stamp. Each player's own tally shows next to the shared stamp; answers stay private.
- **Co-op lessons:** in a shared lobby the host picks a unit and lesson on しまの みち and it goes out as `play` (the only wire with `u`) with its cv. Each other phone sends its tier for the unit (`tierFor`, as `join.tr`), and each phone grades each player against their tier (round/session.ts `deckFor`), so the team's tally and `tm` match everywhere. The strip shows 「じぶん いっぱつ 2/6 · チーム 6/6」, never the partner's. The recheck stays solo.

### The unit file

`app/content/units/<id>.yaml`, read and checked by kikimimi/units.ts, compiled by kikimimi/compile.ts (`npm run kikimimi:levels`):

```yaml
schema: 1
unit: tr-hotel              # <domain2>-<slug>, ≤ 12: the row's u; never a stage
name: ホテルで こまった       # a can-do verb, ≤ 12 characters, never レッスン
stage: mori                 # hama | kawa | mori | yama | hoshi
domain: tabi                # glue | tomodachi ie tabemono kaimono tabi shigoto ibento machi karada
also: [machi]               # optional: more chips (coverage counts domain only)
host: diana                 # a roster villager
scene: lobby                # the unit's backdrop: a SCENE_IDS backdrop, or a planned one (the page shows the domain's tint)
sound: self-repair          # the main feature, from the stage's list (units.ts STAGES)
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

Every lesson id not under `review` is homed in the unit (each item has ≤ 1 home; ids never encode a unit; shipped ids are frozen). The level banks stay TypeScript and keep their `lv`.
- **Output:** `levels/parts/u-<id>.json` (the unit, its phrases with the items they're heard in, its lessons, tiers and homes, the items, clips and timings; ≤ 32 KB gzipped); the index's `units[<id>]` (parts, count, cv) and a `paths` line `[id, name, stage, domain, host, status, lesson bitmask, short?]`; `parts/letters.json`.
- **Checks** (an error stops the compiler; warnings print): the schema; ids unique across the bank, ladders and units; ≤ 1 home; every reference exists (a rung named by its ladder); each item within one step of the stage (`levelRank`); the can-do template and its English; `short`; the recipe (a known `v`, the 3 core lessons, ≥ 6 ids each, であい with a dialogue, チェック held out with ≥ 2 voices, おと mostly words); tiers on lesson items only; American only; every clip past draft; each phrase in ≥ 3 items by ≥ 2 voices (error past draft); recycling ≥ 20 % (an error once 7 units are past draft, `WAVE1`); coverage per stage (an error once a stage has its `PLANNED` units); a letter past draft.
- **Level-deck invariance:** the levels' chunks are byte-identical with and without units; `kikimimi/decks.golden.json` digests the decks for seeds 0–99 per level, so homing an item can't change a quiz deck (a deliberate bank change is `vitest -u`). A unit shows from `voiced` (a draft only with the dev hooks on).

### Lesson decks and stamps

- **A lesson's deck** (`kikimimi/lesson.ts` `lessonDeck(chunk, lesson, seed, tier?)`): 6 questions drawn by the seed, choices shuffled as `deck()` does; であい opens on its model dialogue; the チェック plays only held-out items (`playIds`); じっせん's ladders play only in はしご for now (its items only); a tier swaps in the item's choice set (`tierFor`: half a step below my comfortable level easy, a step above hard).
- **Solo play:** `QuizGame.playLesson(unit, lesson)` deals the game `lesson` into my lobby kept alone and shows its intro card (LessonIntro.svelte; the チェック's is a phone errand: 「{host}から でんわ！ ようじを ききとろう」). A reveal folds the note and transcript under 「くわしく」.
- **The row** carries `u`, `l` and the stage's level (a co-op lesson adds `tm`).
- **Stamps** (`kikimimi/stamps.ts` `unitsOf`, from `gamesOf`): a lesson's dot from a row of it with a whole game's answers; my stamp the first stamping row's day and tally; the partner's from their summary; the recheck due 30 days after, done by a solo チェック on or after that day (`rechecksDue`).
- **Phrases** (srs.ts): `phrasesOf` (caught) and `phraseReview` (a Leitner card per phrase, a new clip each, ≤ 8 a day).

### Recipe 2

With `lessons.v: 2` a unit's おと is tiles, its じっせん a たちぎき and its チェック a phone call plus 4 quiz items; each lesson opts in on its own and falls back to recipe 1:

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

- Each id must be that game's item in a content/listen/ file whose `stage` is the unit's place + 1 (かわ 2, もり 3). units.ts checks them against the files (`checkUnits`, `listenRefs`); the index records each lesson's files in `units[<id>].kinds`; the unit's lesson cv takes in only `listened` files.
- **On the phone:** a lesson's chunks are its unit's, then its kind's `listened` files (games/lesson/lane.ts `lessonChunks`). games/lesson/recipe.ts `recipeDeck` deals the kind's cards first by the game's own deal, topped up to 6 from the recipe-1 deck; each round is graded by its kind at the player's ear (my lesson tier as an ear a step below or above the card's place); co-op uses the games' own shares. A card plays on its game's page (`cardGame`). The row is still a lesson's (`u`, `l`, no `gm`), so `stampsUnit` reads a チェック's 6 answers as before.
- **The fallback** (recipe.ts `kindCards` returns null) plays the recipe-1 deck, byte-identical to before, when the unit is on v1 or the lesson has no kind, a kind's file isn't `listened` or loaded, or an id is missing. It reads the index's statuses only, so every phone deals the same deck.
- Not yet: じっせん as a ladder; an easier tier at はまべ or a harder one at やま for cards (the ears stop at 0-3).

## Content

### What's written

- **The level banks:** 862 items and 30 ladders (per level: kikimimi-engine.md "Content").
- **21 units** (かわ 11, もり 10), all `voiced`; the plan (units.ts `PLANNED`) is はまべ 3, かわ 10, もり 14, やま 14, ほし 10.
- **29 listening files**, all `listened`: tiles (232: drafts, 65 derived from voiced bank items, 30 for the B2 features, the units' おと), calls (34), たちぎき (30), すうじ ラッシュ (240 customers), しずえの ニュース (30 bulletins and the weather tail), まるごと 聞く (10 pieces: "Long listening").
- **音の へんしん:** 180 phrases at level 8, 15 phenomena of 12 ("Connected speech").
- **3 bedtime serials:** st-johnny, st-cafe and st-tokyo (トウキョウ ひとりぐらし: an American newcomer's first month in Tokyo, 7 chapters of ~4 min, narrator us-f3, recycling the units' phrases).
- **The audio packs:** their count and sizes, kikimimi.md "Open items".
- Every level and unit item has `ctx`, `cja` and `why` (音の へんしん's phrases `ctx`, `cja` and `note`).
- **Stays outside units:** the はまべ island lines, the アナウンス pack and ほし's news, lectures and talks (modes and tracks), the number templates.

### The 21 units

Each unit's name, domain, host, scene, sound and recipe are its file's (`app/content/units/<id>.yaml`). かわ (11): gl-clarify, gl-endcall, fr-replan, ev-bday (recipe 1), gl-intro, gl-invite, fd-order, sh-shop, hm-neighbor, hl-clinic, mc-weekend (recipe 2). もり (10): tr-guide, tr-hotel, wk-chat (recipe 1), ev-wedding, fd-dinner, hl-doctor, hm-repair, sh-phone, fr-catchup, mc-tickets (recipe 2).

Their party, restaurant, shop, clinic, park and lobby scenes are planned backdrops, not painted yet ("Backdrops"). Coverage: かわ 7 of 9 domains, もり 9 of 9. Each recipe-2 unit has one call in s1-call-b (かわ) or s2-call-c (もり) and 6 おと tiles in s1-tile-c / s2-tile-c. The recipe-1 units move to recipe 2 once they have calls (wave 3). Notes for the writers: ききかえす covers both directions (recognising native repair, and picking your own "Sorry, fifteen or fifty?"); でんわを おえる checks pre-closings ("Anyway, I'll let you go"); ともだちを あんない makes the learner the host; every dialogue opens and closes naturally.

### Backdrops

The units' headers name seven planned backdrops, `party`, `restaurant`, `shop`, `clinic`, `park`, `konbini`, `lobby`, not painted yet: bank.ts `SCENE_IDS` holds the 8 painted ones, so items use those or the plain stage, and the unit page shows the domain's tint. They're made by the existing pipeline (kikimimi.md "Visuals") on the second Mac, never during a TTS batch.

### Authoring pipeline

1. **Seed sheet:** can-do, phrases, sound, host and scene, the scenario seeds; for a game the kind and tier sets.
2. **Draft** (one author per file): `en`; `tts` only where the reduction matters; `ja`; `note`; `ctx`; `cja`; `why`; tags. Per kind: a tile's `why` names each decoy's trap; a call's `cja` per chip and `why` per memo round; たちぎき `ctx` and `why` per round. Rush comes from its frames (`npm run kikimimi:rush`); derived tiles from `scripts/kikimimi-tiles.ts`, then a person.
3. **Machine gates** (CI; errors past draft): schema and ids; `helpProblems`; the US-only lint (a UK/AU list: mate, cheers, queue, flat, lift, fortnight, reckon, fancy, half nine, neighbour, realise…; `accent-exposure` exempt); digit-free `tts`; the choice tells ("Choice tells"); phrase, recycling and coverage rules; near-duplicates (rush only against the rest); the chunk budgets.
4. **Human review before voicing:** an EFL teacher, a US scriptwriter and a Japanese reviewer read each batch: natural for an American friend or clerk; one clearly best answer; the second distractor the real trap; `ctx` without the answer; natural Japanese; kana in character speech, kanji in sheet copy, one spelling per term. Findings go into the files or this doc's backlog, not into docs/.
5. **Voicing:** `npm run audio:kikimimi` (the gate and re-rolls), conditions mixed after the gate, then `npm run kikimimi:packs`.
6. **Listening check** ("Listening check"); a file's `status` goes `draft` → `voiced` → `listened`, set by hand.
7. **Tuning:** a week of play; grow a stage only at 75–85 % first-listen success.

### Choice tells

A choice set must not give its answer away without the audio. `tells.test` holds each level's 3-choice `reply`, `mean`, `gist` and `next` sets (and the units' tiers) near chance: the right choice the longest in 20–45 % of sets (by ≥ 1.25× in ≤ 12 %), the shortest in 20–45 %, echoing the clip's words least in ≤ 45 % and most in ≥ 15 %, and opening with a reaction or being a question about as often as the wrong ones (± 12 points). Distractors are what a partial listener could pick: a near sound, a number or name caught wrong, the right words with the wrong implication; the clip's words are spread across the choices. `npm run kikimimi:tells -- <level | file>` lists the sets with a tell. The right choice's place comes from the deck's seeded shuffle, even across places.

## Long listening

Everyday conversation and travel, American first, real recordings allowed if licensed (PD or CC) and credited. The B2 → C1 step is following extended, unscripted talk and what's meant rather than said (CEFR CV 2020); まるごと 聞く (kikimimi.md) gives one piece a day, ~6 minutes with its questions and dictation.
- **Real recordings** (s4-long-c, -d): 5 excerpts of 2.7–4.7 min, unscripted, American (CORAAL's is African American English; the sources and licences: kikimimi-engine.md "Generation"). Only PD, CC BY, CC BY-SA or CC BY-NC-SA (long.test); each piece's `credit`: title, by, page, file and its sha256, the excerpt's span, licence, its deed and the credit line. Downloads are data: their own directory, read by ffmpeg and Python with `-I` only, never run. The transcript is the official one where there is one, else whisper's; lines cut at sentence ends (≤ 16 s).
- **Generated scenes** (s4-long-a, -b): 5 of 2.4–3.3 min, 3 villagers each, everyday and travel (a hotel at night, a missed connection, a flea-market haggle, dinner with news let out sideways, a neighbour's tree): refusals said politely, sarcasm, a sales trick, a budget never named; interruptions and overlap (a negative `at`), reductions in `tts`.
- **Questions:** 4–5 a piece, the gist first, then the implied meaning, the attitude and the next step; 3 choices held to "Choice tells" against the whole transcript. **Dictation:** 2–4 lines a piece on connected speech (a henshin.ts phenomenon), 1–6 words each. **Alignment:** whisper hears every line's clip; a piece's weighted WER ≤ 20 %, a line of 4+ words ≤ 60 % (align.ts; real 8.6 % mean, generated 1.9 %).
- **Listen-check:** the real pieces' cuts (a word clipped at a boundary: rl-canyon-questions-8, -12, rl-space-food-2), CORAAL's interviewer asides, and the generated scenes' flagged lines (homophones suite / steak, "Ms.—", numbers said as prices).

## Connected speech

For a strong listener the biggest gain is decoding American connected speech, checked by dictation, from many voices (Field 2008; HVPT, Logan et al. 1991). 音の へんしん drills it daily (kikimimi.md "音の へんしん").
- **The phenomena,** in the order taught (henshin.ts `PHENOMENA`, each a feature under つながる おと): gonna, wanna, gotta / hafta, contractions (I'll, we've, should've), weak forms (fer, 'em, 'n), the flap (a lodda), linking (pi-ki-tup), t / d + you (didja, gotcha), lemme / gimme, kinda / outta, dunno, elided t / d (nex' week), the stopped t (tha' one), the dropped h (tell 'im), chains (whaddaya, gonna hafta).
- **The phrases** (content/henshin.ts, level 8): 12 a phenomenon, 180 in all, everyday and travel, each in another of the 12 US voices (every phenomenon heard in all 12). A `word` item: `en` written in full, `focus` the changing chunk, `tts` the line as said, `hs.red` the chunk as said, `hs.full` a contraction's long form, two near-sound wrong chunks that fit, `ja`, `note`, `ctx`, `cja`. **Takes:** natural, careful (`<id>-c`: the full form, its words set apart by commas, slowed to 0.8) and fast (`<id>-f`: the natural take at 1.25×).
- **Validators** (content/henshin.test.ts): order and coverage; voices; focus in the sentence, wrong chunks not; a full form that types right; tiles at every tier; the choice tells near chance against what is said (tells.ts `DRILL_LIMITS`: length only, every word for the echo, no form gap); and every voiced phrase heard as said (`npm run kikimimi:reduce`, at its clips' hashes): whisper hears the careful take in full, and, where the spelling as said is one whisper writes (gonna, lemme, outta, gotcha, whaddaya, 'em…), it writes it for the natural take when prompted with them. A flap, a dropped t or h, a link or a weak vowel whisper spells as written whatever is said: for those the natural take is the respelling said (`tts`: "Pud it on", "nex' week"), every word still heard by the gate. No timing measure: whisper's word times are too coarse for a two-syllable chunk.

## Listening check

A person listens before a clip counts as done: every clip the gate flagged plus a 20 % sample, on the phone. `npm run audio:kikimimi -- --listen [--only <regex>]` plays each with its text on the Mac (only when a person runs it). The whole list is the clips `app/scripts/tts/report.json` flags (its summary's `flagged` counts them); most are whisper's own spellings. Worth a listen:

- **The bank:** whaddaya (ml-w-whaddaya, ya-r-whaddaya), mw-used-to, mw-ya-gonna, ya-w-whydja; voice drift on dya-capital-3, dya-parking-2; over a bed (`cond-wer`), mw-tickets and ya-n-rent; the conditions' d4-landlord-1, d4-installer-3, w2-read, w3-gotta, w3-shouldve. **スピード はしご:** number formats, 'em heard as "him", a swallowed "Breakfast's" / "I've"; sp-key-code at 1.4× (UTMOS 3.38); 9 rungs clamped (tempo 0.7–1.6).
- **Wave 1 units:** names, homophones and reductions (Marshal, Kicks, two/too, gotta, up ta).
- **Listening files:** 'em heard "him" (tachi-standup-blocked-3/5), "kinduva trek" (tachi-im-easy-3), "manager's joinin'" (call-handouts-favour-5); tip's (dk-fast-check-2); Kid Cat and Bea as names (dk-pickup-fifteen-2, dk-fast-late-doc-1); "greadon" heard "great in" (kw-great-on, tile-shop-great-on-you); dk-hike-dinner-2 (UTMOS 3.49), dk-dentist-day-4 (similarity 0.49); couldja heard "Kuja" (wg-n-rsvp); "Will call" heard "We'll call" (tk-will-call-next-1); standin' / citin' / jus' an' (tk-fast-three-3, tachi-deposit-letter-7, tachi-movers-or-truck-8); cu-r-landlord's café mix; short lines' voice (tk-w-fifty and its tile, sm-eighty-next-3, UTMOS 3.02); the h-drop "but 'is" (tachi-hiring-pick-3).
- **Stories:** serial-cafe-3-16's "Bean There" (heard "Being there": a pun on "been there"); serial-tokyo-4-30's "her sister's". st-tokyo's Japanese words in the US voices: "Nakameguro", "Meguro", "mikoshi", "wasshoi", "yukata", "konbini". **はつおん's pair words** (`pr-*`): 65 single words flagged for low similarity or drift, as single words are; "berry" is heard "Barry" in every take.

A clip fixed after the listen is re-spoken with `PINNED` or a `tts` respelling, then `npm run audio:kikimimi-words`.

## Backlog

- **Backdrops:** paint the seven planned scenes and add them to `SCENE_IDS` ("Backdrops").
- **トーン あて** (one line spoken sincere / sarcastic / resigned): a spike of 10 lines × 3 tones through Qwen3-TTS style instructions against the Base clone; ship as a quiz kind only if the voice holds (ECAPA ≥ 0.6 to the reference) and the takes can be told apart blind on the phone; otherwise cut (attitude stays word-borne in `mean`). Not run.
- **Wave 3:** calls for the 7 recipe-1 units (then recipe 2); やま units, opening with idioms and group talk on たちぎき; more ジョニー chapters once st-tokyo is played.
- **Variety clusters** for a new-situations writer:
  - corrected numbers ("X, sorry, Y"): sp-key-code, a5-key-code, n4-gate, n4-water, n4-platform, a5-track; every listen call turns on a slot that changes mid-call; the units' corrected times (kn-*-time, dk-cut-out, dk-fast-wrap);
  - medical: six clinic or pharmacy settings at level 4 (r4-anything-else, r4-triage, w4-cant-uk, w4-id-ill, d4-receptionist, d4-cough-drive), and the ladders' appointment slots;
  - transit PA: nine train and five airport announcements in アナウンス, nine flight items at もり, five commute disruptions at ほし;
  - customer-service calls (~14 in yama-b); leases and landlords (yama-b 6, r4-leak, m4-damp, d4-landlord: all Tom Nook, "sometime next week"); the hotel desk: ml-* (7), d4-hotel-suite, r4-room-ready, m4-upgrade and tr-hotel's refuse-tonight-fix-tomorrow and checkout-fee items;
  - near repeats: d4-installer ≈ call-installer-signal (8 to 1, someone over 18 at home; the near-dupes test doesn't compare them); rain check and ballpark taught at both もり and やま; Kyoto crowds three times in yama-b; the digits 4473 in ya-n-phone and call-gp-callback;
  - openers: wk-chat opens five times with "How was your weekend?"; tr-hotel and tr-guide use "Sorry, did you say X?" six times; d4-oat-latte still opens on a misheard name;
  - settings and speakers: the listening files are almost all in Tokyo (an American diner, Target or a ballgame would help); kk-slider is the radio host in all his ほし lines.
- **Questions:** mild swearing ("damn", "crap", "pissed off") at やま and ほし? ウェイ's field of work, for meeting and client scenarios?
