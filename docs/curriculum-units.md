# ききみみ: life-domain units (proposal, 2026-11-06)

**Sources:**
- the content audit: docs/reviews/2026-11-06-content-coverage-audit.md;
- the language-app research: docs/reviews/2026-11-06-language-apps-research.md (live sources);
- docs/curriculum.md;
- docs/kikimimi-ux.md (しまの みち).

**The user's focus:** conversational English for everyday use, around life and friends, travel, work, shopping, events and places.

## Where we are

**Structure.** Content is organised by stage (はまべ → かわ → もり → やま → ほし, plus アナウンス) and by question type. Situations are only tags (scenario seeds). A game draws a mixed deck from a stage. There are no units, no phrase goals and no "you can now…" milestones.

**Volume.** About 880 items: 750 in play (1,022 clips) and 100 YAML drafts.

**Strengths.**
- Domains: work (153), travel (107), news and academic at the top.
- Functions: information, plans, requests and apologies.
- Sounds: idioms, contractions, numbers, weak forms.
- Speakers: 102 villagers, well spread.

**Gaps that matter for everyday conversation.**
- **Events and celebrations: 10 items.** Parties, weddings, festivals, sports, concerts.
- **Places around town at the B1+–B2 core:** restaurants, cafés, the park, the museum, the gym, hotels, clinics. Today's place content is mostly island-themed at S0.
- **The glue of conversation:** introducing (1), ending a conversation (3), inviting (6), asking for clarification (6), complimenting (9).
- **Friends:** no phone calls between friends, few weekend stories, few opinions about films, music or hobbies.
- **Repetition:** refunds (12), Osaka (11), bill splits (10), oat milk / the misheard name / the key code (4 each).
- **Scenes:** only 8 backdrops, and none for a shop, restaurant, hotel, clinic, park or party.

## What the apps do

- **Duolingo:** one path of sections → units → levels, with a Guidebook of key phrases per unit. Grammar is implicit. Its score is mapped to CEFR: B1 60–99, B2 100–129.
  - Conversation comes mostly from Stories, Roleplay, Video Call and Adventures, not the main path.
  - Review runs on two systems: half-life regression for spacing, Birdbrain for difficulty.
  - Critics point to isolated sentences and to rewarding the streak over the skill.
- **Babbel:** about 6-minute situational dialogue lessons, spaced review of phrases, CEFR can-do tasks.
- **Speak:** learn → practise → apply.
- **Busuu:** community feedback.
- **Pimsleur:** graduated recall.
- **The shared pattern:** situation → model dialogue → pull out the phrases → controlled practice → a freer task → spaced review of the phrases.
- **The British Council–EAQUALS Core Inventory** gives the B1/B2 functions, discourse markers and topics. These become our can-dos.

## The proposal: path → life domain → unit → 5 lessons

**Levels.** Four core bands, mapped to Duolingo's B1/B2 score bands so progress means something:

| Band | Score | Stage |
|---|---|---|
| B1 | 60–79 | かわ |
| B1+ | 80–99 | もり |
| B2- | 100–114 | やま |
| B2 | 115–129 | ほし |

はまべ stays as a warm-up and placement floor. アナウンス and the news become tracks that run alongside, not levels.

**Nine life domains** (the しまの みち path shows them as areas of the island):
1. ともだち・ひと (friends and people: plans, invitations, small talk, catching up, feelings, opinions)
2. いえ・まいにち (home and daily life: chores, neighbours, deliveries, repairs)
3. たべる・のむ (food and drink: restaurants, cafés, bars, cooking, konbini)
4. かいもの・サービス (shopping and services: shops, returns, the bank, phone support, the ward office)
5. たび・のりもの (travel and transport: airport, trains, hotels, directions, taxis)
6. しごと (work: meetings, small talk, feedback, requests, interviews)
7. イベント (events: birthdays, weddings, festivals, sports, concerts, holidays)
8. まちの ばしょ (places in town: park, museum, gym, salon, clinic, library, cinema)
9. からだ・もしも (health and emergencies: doctor, pharmacy, lost items, accidents)

**A unit is one situation with one can-do.** For example, 「ともだちと よていを たてる・かえる」 (making and changing plans with friends):
- a host villager and a scene backdrop;
- **8–10 key phrases**, collected into the phrase ずかん (Duolingo's Guidebook equivalent), with B1/B2 tags from the English Vocabulary Profile;
- **a function from the Core Inventory**, plus one sound feature (e.g. "gonna / wanna", "can / can't");
- **5 lessons of about 4–6 minutes,** built from our existing game types:
  1. **であい:** a model dialogue for gist (gist / next).
  2. **フレーズ:** catch the chunks in connected speech (word, ことば タイル).
  3. **ばめん:** variations of the dialogue, with different voices, replies and implied meaning (reply / mean).
  4. **はやい:** the same situation faster, over noise, in another accent (the speed ladder, conditions).
  5. **チェック:** a mission. A phone errand or an overheard conversation that uses the unit's phrases (ようじ でんわ / たちぎき). Pass at 80% on the first listen to earn the unit's stamp.
- **Review:** the unit's phrases go into spaced repetition, and later units deliberately reuse earlier phrases in new contexts. "Caught" means heard in 3 contexts.

**Size.** About 25 items, 4 dialogues and 1 call per unit.
- **First wave:** 9 domains × 4 units at B1+/B2- = 36 units, about 900 items. Existing items are re-tagged into units first, since most map. The new content then targets the gaps.
- **Long term:** about 6 units per domain per band, roughly 200 units.

**Repetition rules.**
- A situation may appear in at most one unit per band.
- Each scenario seed has a budget.
- The near-duplicate test runs across all banks (built).
- The anti-repetition deck (built).

**Visuals.** About 10 new backdrops (shop, restaurant, izakaya, hotel lobby, clinic, park, party room, gym, museum hall, konbini). Use the same Z-Image recipe as the existing 8, about 25 s each.

## First units to write (the gaps first)

| Domain | Units |
|---|---|
| イベント | a birthday party; a friend's wedding; a summer festival / matsuri; watching a match at a sports bar |
| まちの ばしょ | the park on a Sunday; the gym's front desk; a hair salon; at the museum |
| ともだち・ひと | introducing a friend; catching up on the weekend (past stories); recommending a film or show; ending a call or chat politely |
| たべる・のむ | ordering with dietary needs; an izakaya with friends; a café mix-up |
| たび・のりもの | checking in at a hotel with a problem; asking for directions; a missed connection |
| しごと | small talk with coworkers; asking for clarification in a meeting; giving and getting feedback |
| かいもの・サービス | a gift for someone; asking for a size or colour; phone support with a hold queue |

## Build order

1. **Unit schema** in the increment 9 YAML compiler (`unit`, domain, can-do, phrases, function, sound feature, lessons). Re-tag the existing items into units.
2. **しまの みち UI** (UX U7): domains as island areas, units as stops. Unit detail shows its phrases.
3. **Content waves of about 6 units at a time,** the gaps first. Each wave goes through English and Japanese review, then batch TTS, then the listening check.
4. **The phrase ずかん** wired to the units' phrases (UX U5).
