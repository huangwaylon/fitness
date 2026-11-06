# ききみみ content audit (2026-11-06)

Scripts: `/tmp/audit/dump.mts` imports every TS bank via `npx tsx` and parses the 12 YAML files, writing `items.json`. `/tmp/audit/analyse.py` classifies the items and writes `tables.md` (all tables), `classified.json`, `gap.md` and `fn.md`.

**Stage mapping:**
- bank L1–L2 → S0, L3 → S1;
- the wired level 4 set (bank4, dialogues, the アナウンス pack `bank5.ts`, ladders) → "S1/S2";
- mori-* → S2, yama-* → S3, hoshi → S4;
- YAML `stage: n` → S(n−1).

## 1. Totals (880 items)

| Stage | single | dialogue | announcement | ladder | YAML tile | YAML call | YAML tachi | total |
|---|---|---|---|---|---|---|---|---|
| S0 | 95 | – | – | – | – | – | – | 95 |
| S1 | 49 | – | – | – | 30 | 5 | – | 84 |
| S1/S2 (L4, wired) | 67 | 24 | 30 | 30 | – | – | – | 151 |
| S2 (mori) | 140 | 30 | – | – | 15 | 10 | 10 | 205 |
| S3 (yama) | 160 | 40 | – | – | 15 | 5 | 10 | 230 |
| S4 (hoshi) | 90 | 25 | – | – | – | – | – | 115 |

Where they live: 295 are wired (bank 144, bank4 67, dialogues 24, bank5 30, ladders 30). 485 are in the five content sets being wired. 100 are YAML drafts: 60 tiles, 20 calls and 20 たちぎき.

| Type | S0 | S1 | L4 | S2 | S3 | S4 |
|---|---|---|---|---|---|---|
| pic | 26 | 8 | – | – | – | – |
| word | 27 | 12 | 15 | 31 | 33 | 12 |
| num | 28 | 13 | 25 | 31 | 31 | 16 |
| reply | 14 | 16 | 27 | 40 | 44 | 14 |
| mean | – | – | 24 | 38 | 52 | 27 |
| gist | – | – | 18 | 16 | 20 | 27 |
| next | – | – | 12 | 14 | 20 | 19 |

## 2. Domain × stage (primary domain)

**Heuristic:** each item scores against the 18 domains:
- +1 for each keyword hit in `en`, the right choice, the `note`, the `ja` and the `ask` (capped at 4 per domain);
- +3 for the domain of its curriculum §5.5 seed (all 66 mapped, e.g. 26 → shopping, 35/36/56 → dating & family, 38–47 → work);
- +4 for a content-set family that names a domain (mori-life `hotel`, yama-b `medical`, hoshi `lecture`, …);
- +1 for the scene (office → work, gate/platform → travel, pharmacy → health, cafe → food).

The highest score is the primary domain. Any other domain scoring ≥ 3 counts as secondary.

S0 island items use extra cues: fishing and bugs → hobbies, fossils and the gym → places, Bells → shopping. 47 S0/S1 generic one-liners ("Look at that big ship!") stay "other". A spot-check of 45 random items found about 85% plausible. The misses are mostly hoshi sports and economy bulletins filed under news (which is defensible) and "meeting room" read as a hotel room.

| Domain | S0 | S1 | L4 | S2 | S3 | S4 | Total | +2nd |
|---|---|---|---|---|---|---|---|---|
| daily life | 0 | 3 | 7 | 15 | 9 | 1 | 35 | 12 |
| friends & social | 0 | 7 | 11 | 30 | 26 | 1 | 75 | 8 |
| dating & family | 0 | 5 | 5 | 10 | 12 | 0 | 32 | 3 |
| food & restaurants | 7 | 3 | 11 | 11 | 8 | 3 | 43 | 11 |
| shopping & returns | 12 | 3 | 8 | 9 | 9 | 0 | 41 | 6 |
| travel & transport | 5 | 7 | **41** | 26 | 27 | 1 | **107** | 6 |
| health | 1 | 7 | 16 | 10 | 11 | 1 | 46 | 4 |
| money & banking | 0 | 1 | 8 | 6 | 21 | 0 | 36 | 21 |
| services | 0 | 8 | 14 | 13 | 22 | 0 | 57 | 16 |
| work | 0 | 4 | 20 | **55** | **65** | 9 | **153** | 5 |
| events & celebrations | 4 | 0 | 0 | 4 | 2 | 0 | **10** | 3 |
| places | 21 | 6 | 4 | 7 | 4 | 0 | 42 | 2 |
| hobbies & entertainment | 13 | 6 | 1 | 5 | 12 | 2 | 39 | 4 |
| weather & seasons | 5 | 1 | 3 | 1 | 1 | 6 | 17 | 5 |
| tech | 1 | 0 | 0 | 0 | 0 | 0 | **1** | 0 |
| emergencies | 0 | 1 | 2 | 3 | 0 | 0 | **6** | 4 |
| news & media | 0 | 0 | 0 | 0 | 1 | 63 | 64 | 11 |
| academic | 0 | 1 | 0 | 0 | 0 | 28 | 29 | 6 |

Keyword probes over the core stages (S1–S3, 670 items) confirm the thin spots:

| Topic | Core items |
|---|---|
| museum or gallery | 1 (an S1 bank line) |
| park | 0 real |
| wedding | 2 |
| festival | 1 |
| introductions ("this is my…", "nice to meet") | 0 |
| taxi | 1 |
| salon | 1 |
| cinema | 3 |
| concerts | 0 |
| sport | 4 |
| school or kids | 1 |
| app, password or Wi-Fi trouble | about 3 |

## 3. Communicative functions (multi-label, regex lower bounds)

**Heuristic:** a regex per function over `en` plus the right reply ("could you|would you mind" → requesting, "rain check|I'll pass" → accepting/declining). Signals added on top:
- pragmatic tags: refusal → declining, ritual → small talk, attitude → feelings;
- families: yama-b negotiate, complain, disagree, opinion and recommend; hoshi debate and stance;
- a phone channel → telephone conventions;
- broadcasts → information.

Counts are indicative. They undercount implicit functions.

| Function | Core S1–S3 | All | | Function | Core | All |
|---|---|---|---|---|---|---|
| asking/giving info | 359 | 501 | | complaining | 19 | 22 |
| making plans | 103 | 124 | | negotiating | 21 | 24 |
| describing | 71 | 90 | | agreeing/disagreeing | 20 | 37 |
| expressing feelings | 66 | 87 | | checking understanding | 18 | 20 |
| requesting | 64 | 75 | | small-talk open/close | 15 | 16 |
| greeting | 62 | 68 | | persuading | 11 | 14 |
| apologising | 59 | 65 | | complimenting | **9** | 11 |
| offering | 50 | 52 | | inviting | **6** | 6 |
| accepting/declining | 41 | 45 | | asking for clarification | **6** | 7 |
| narrating past events | 39 | 52 | | ending conversations | **3** | 3 |
| giving opinions | 38 | 57 | | introducing | **1** | 1 |
| suggesting | 34 | 51 | | | | |
| telephone conventions | 31 | 32 | | | | |
| thanking | 30 | 33 | | | | |
| giving advice | 28 | 28 | | | | |

## 4. Listening sub-skills and sound features

**By question type:**

| Sub-skill | Where it's trained |
|---|---|
| word recognition | `word` 130, tile 60 |
| numbers and details | `num` 144, ladder rungs 2–3, call memos |
| pragmatic inference | `mean` 141 |
| response choice (TOEIC Part 2) | `reply` 155 |
| gist | `gist` 81, ladder rung 1 |
| prediction | `next` 65 |
| speaker tracking and mind-change | たちぎき 20 |
| note-taking with corrections | calls 20 |
| rate tolerance | ladders 30 |

The most frequent **feature tags** are:

| Feature | Items |
|---|---|
| idiom | 143 |
| contraction | 137 |
| numbers | 136 |
| weak-form | 86 |
| self-repair | 52 |
| ellipsis | 45 |
| yod | 41 |
| gonna | 34 |
| teen-ty | 30 |
| intonation | 29 |
| contrast | 29 |
| overlap | 20 (YAML only) |

Thin feature tags:

| Feature | Items |
|---|---|
| t-glottal | 18 |
| h-drop | 16 |
| chain | 14 |
| linking | 14 |
| flap | 11 |
| vowel | 5 |
| gotta | 4 |
| filler | 3 (S2 lists fillers and false starts as primary) |
| dunno | 2 |
| elision | 2 |
| katakana | 2 |

Not tagged anywhere:
- assimilation (an S2 primary);
- upspeak;
- the IE/SC/NZ/IN accents (S3 exposure);
- non-native English (S4);
- academic stress shift.

**Pragmatic tags:**

| Tag | Items |
|---|---|
| literal | 341 |
| indirect | 76 |
| hedge | 64 |
| attitude | 63 |
| humour | 51 |
| formula | 47 |
| refusal | 31 |
| sarcasm | 24 |
| understatement | 21 |
| ritual | 15 |
| deception | 3 |

**Register:**

| Register | Items |
|---|---|
| service | 205 |
| friend | 174 |
| broadcast | 105 |
| colleague | 93 |
| official | 47 |
| boss | 39 |
| partner | 28 |
| neighbour | 26 |
| stranger | 19 |

**Conditions:**

| Condition | Items |
|---|---|
| phone | 121 |
| desk | 32 |
| pa | 30 |
| video | 24 |
| station | 23 |
| cafe | 21 |
| voicemail | 15 |
| street | 5 |

No party, wind or rain beds are used at the core, though seeds 11 and 55 call for them. Accents: US 411, UK 222, AU 147, unset 100 (YAML).

## 5. Repetition

- **Speakers:** 102 villagers, fairly flat. The top ones are raymond 35, goldie 31, molly 28, tom-nook 27 and julian 27 (about 4% each). Eight villagers appear only once. In the YAML calls, "me" (Wei) is the caller in 7 of 20.
- **Scenes:** only 8 backdrops. 327 items have none; the rest are living 167, office 147, street 81, cafe 64, gate 32, door 24, platform 23 and pharmacy 15. There is no shop, restaurant, hotel, clinic, park, museum, gym or party scene, so the hotel, shop and doctor items reuse `living` or none.
- **Seeds:** the most used are 26 refund (30), 64 lecture (26), 40 deadline hedge (25), 27 bill split (25), 62 bulletin (25), 44 stand-up (22) and 5 train suspension (22). 59 (しずえ's news) is unused. 6, 9, 11, 20, 23, 28, 47 and 66 have ≤ 3 items each.
- **Recurring situations across sources:**

| Situation | Items | Notes |
|---|---|---|
| refund / store credit / receipt | 12 | |
| Osaka | 11 | as a destination |
| bill split / service charge | 10 | |
| running late / train stuck | 8 | |
| missed parcel / depot / neighbour | 6 | |
| on mute / breaking up | 6 | |
| deadline moved / "Friday's tricky" | 6 | |
| Airbnb key-code self-repair | 4 | in bank5, ladders, yama-a and YAML |
| oat/almond milk mix-up | 4 | |
| misheard "Wei" | 4 | |
| the installer's "between eight and one" | 4 | |
| drowsy medicine | 4 | |
| "this Friday or next" | 2 | |

- **Phrases:**

| Phrase | Items |
|---|---|
| "actually" | 36 |
| "mate" | 21 |
| "I'm afraid" | 18 |
| "to be honest" | 8 |
| "just so you know" | 6 |
| "I was going to" | 6 |
| "actually, make it" | 5 |

  Glossed chunks used more than once include lemme and whaddaya (4 each), breaking up, fortnight, woulda and gonna hafta (3 each), and half six / half nine, store credit, I'm easy and give or take (2 each).
- **Near-duplicates:** 134 pairs have a TF-IDF cosine above 0.42 (excluding the ten ladders that deliberately reuse bank4 lines). Most are S0 `num` template siblings, which is intended. The real cross-file duplicates are:

| Item | Duplicate |
|---|---|
| `ya-w-whatcha` | `tile-whatcha-up-to` (identical) |
| `w3-shouldve` | `tile-shoulda-told-him` |
| `ml-n-tablets` | `yb-max-dose` |
| `r4-anything-else` | `tile-not-been-taking` |
| `w4-can-us` / `d4-installer` | `tile-eight-and-one` |
| `r4-name` | `tile-loud-in-here` |
| `r2-sleepy` | `tile-wont-make-me-sleepy` |

  The YAML tiles largely re-cut existing bank lines.

## 6. Gaps

**Domain × function at the core (S1–S3, primary or secondary domain).** Bold 0 means no item.

| Domain | n | inv | acc/dec | sugg | agr/dis | opin | compl | apol | compli | advice | clarif | small | narr | feel | phone | intro | end |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| daily life | 44 | **0** | 1 | 1 | 1 | 2 | 3 | 7 | **0** | 3 | **0** | **0** | 5 | 5 | 2 | **0** | **0** |
| friends & social | 82 | 1 | 18 | 6 | 2 | 6 | 1 | 6 | 2 | 6 | **0** | 4 | 7 | 25 | **0** | **0** | 1 |
| dating & family | 35 | **0** | **0** | 1 | 1 | 3 | 1 | 2 | 2 | **0** | 2 | **0** | 4 | 2 | 1 | **0** | **0** |
| food & restaurants | 43 | 4 | 2 | 6 | 3 | 5 | 1 | 7 | 1 | **0** | **0** | 1 | 3 | 3 | **0** | **0** | **0** |
| shopping & returns | 35 | **0** | 7 | 2 | **0** | **0** | 3 | 5 | 1 | 2 | **0** | **0** | 2 | 1 | 2 | **0** | **0** |
| travel & transport | 106 | **0** | 1 | 3 | **0** | 6 | 1 | 18 | 2 | 7 | 1 | **0** | 2 | 3 | 6 | **0** | 1 |
| health | 45 | **0** | 1 | **0** | **0** | **0** | 1 | 2 | **0** | 3 | **0** | **0** | 2 | **0** | 6 | **0** | 1 |
| services | 73 | **0** | 5 | 1 | **0** | 1 | 4 | 4 | **0** | 2 | 1 | **0** | 2 | 5 | 14 | **0** | **0** |
| work | 148 | 2 | 5 | 17 | 14 | 9 | 3 | 9 | **0** | 4 | 1 | 10 | 9 | 20 | 1 | 1 | **0** |
| events | 9 | **0** | 2 | 4 | **0** | 2 | **0** | **0** | **0** | 1 | **0** | **0** | 4 | 3 | **0** | **0** | **0** |
| places | 23 | 1 | 1 | 2 | **0** | **0** | **0** | 1 | **0** | 1 | **0** | 1 | **0** | 1 | 1 | **0** | **0** |
| hobbies | 26 | **0** | 1 | **0** | 1 | 4 | 1 | **0** | 3 | **0** | **0** | **0** | 4 | 7 | **0** | **0** | **0** |

**Priorities for the B1+–B2 core:**

1. **Events and celebrations (9 core items).** Weddings (speeches, RSVP, the gift), festivals and matsuri, birthdays, leaving dos, sports watched together, concerts, New Year. Every function is thin here.
2. **Places (23, mostly island).** The town, the museum (a guide, a ticket desk, an audio tour), the park, the gym (sign-up, induction, class booking), the café as a meeting place, the library. Matching scenes are needed too.
3. **Friends: the social glue.** There is almost no *inviting* (6 overall), *introducing* (1), *ending conversations* (3), *complimenting* (9) or *asking for clarification* (6). Friends get 0 clarification and 0 phone calls (calling a friend), and few stories told about the past or opinion swaps on hobbies, film and music.
4. **Travel is large but transactional.** There is no small talk with fellow travellers, no hotel complaint, no taxi (1 item), no sightseeing or tour guide, no asking a stranger to take a photo, and no disagreeing about plans on a trip.
5. **Shopping:** no opinions or advice ("does this suit me?"), no small talk with staff, no haggling at a market; returns dominate.
6. **Work:** 0 compliments and recognition, 2 invitations (after-work drinks), almost no clarification ("sorry, which deck?"), and no email-talk read-backs. It is already heavily covered otherwise, so further work content is not a priority.
7. **Daily life and dating:** neighbours have 0 small talk and 0 invitations. Couples get 0 accepting/declining and 0 advice, few household chores, and no family visits or in-laws.
8. **Thin domains everywhere:** tech (1: phone or app trouble, a friend's tech help), emergencies (6: a lost wallet, a koban, an earthquake drill), weather small talk (6 core).
9. **Features and conditions:** assimilation, fillers and false starts, upspeak, the S3 exposure accents (IE/SC/NZ/IN), and party, wind and rain beds. S1's weak forms and linking rest mostly on YAML drafts.
10. **Cleanup:** fold or retire the YAML tiles that re-cut bank lines. Spread "Osaka", "mate", "actually" and the refund, bill-split and "Friday" scenarios. Use seed 59 and seeds 6, 9, 11, 20, 23, 28, 47 and 66.
