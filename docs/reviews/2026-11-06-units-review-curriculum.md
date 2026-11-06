# Curriculum designer: review of docs/curriculum-units.md

**Verdict:** the direction is right (life-domain units, can-dos, phrase sets, 5 lessons). The spine and the band mapping are wrong: they conflict with curriculum §3, with UX §4 and §6.3, and with how the existing content is shaped.

## Pilot mapping

I mapped the 66 scenario seeds to 30 situation-units plus 2 tracks (script: /tmp/units-review-scratch/pilot.py). Of the 880 items:

- **144 (16%)** are unseeded island lines (gym, fishing, Bells). They stay in はまべ.
- **135 (15%)** are tracks (PA, news, lectures), 105 of them at ほし.
- **601 (68%)** are situational, but every situation is spread across stages. Refund has 2 at S1, 19 at もり and 9 at やま; meetings have 18 at もり and 22 at やま.
  - Only 22 unit × band cells reach 12 or more items (373 items, 42%). Only 5 reach 20.
  - The situational items sit at かわ 34, もり 334, やま 223 and ほし 10.
- **Seeds are loose buckets.** Seed 26 "refund" includes a coat-sale PA and investment advice. In a 50-item spot check, about 75% fit one situation tightly.
- **Clean fit:** about 32% of items fit a one-situation, one-band unit, and about 60% fit some situation. The rest belong in はまべ, アナウンス or ほし.
- **Phrase coherence is near zero.** Items were written one-off, so re-tagging yields situations, not 8–10 phrases heard 3 times.

## Issues

### P0

1. **The bands break the approved ladder and lower the ceiling.**
   - §3 has かわ B1+, もり B2, やま B2+, ほし C1. "B2-" isn't a CEFR level, and Duolingo's score bands mean nothing to us.
   - A TOEIC 700+ strong listener sits around やま, so a B2 top leaves no stretch. ほし's news and lectures are C1.
   - **Fix:** keep §3, drop the score column, and keep ほし as C1, track-heavy (§4).
2. **The spine.** Domain areas add a second navigation axis to the approved stage path, while placement and rewards are keyed to stages. The content is already spiral (each situation at 2–3 stages).
   - **Fix:** stages stay the spine, with units as nodes. Domain becomes a tag (node icon, filter) plus a coverage rule: each stage covers 7 or more of the 9 domains, and no domain has more than 25% of a stage.
   - Situations spiral: one recurs at the next stage only with a new function or complication (かわ café order → もり mix-up → やま bill dispute).
3. **The can-dos are situation labels, not testable listening can-dos.** The Core Inventory is productive.
   - **Fix:** use the template "I can follow [who] [function] [condition] and catch [info/intent]". Example: "…a friend changing plans in a voicemail at natural speed, and catch the new day, time and place, and whether they're really cancelling."
   - Draw on the CEFR Companion Volume listening scales. チェック items test the "catch" clause.
4. **Re-tagging won't produce phrase units.**
   - **Fix:** add `ph: [phraseId]` on items, with a compiler lint: each phrase in 3 or more items, 2 or more voices.
   - Derive the phrases from the items' recurring glossed chunks, then budget 10–15 new items for each re-tagged unit.

### P1

5. **The count and size conflict with §13 and the UX (47 units, about 40 items each).** 200 units would swamp the human listening check.
   - **Fix:** 48 units: かわ 10, もり 14, やま 14, ほし 10.
   - Each unit gets about 24 short items, 3 dialogues and 1 call. Lesson 4 is remixes (no synthesis); lesson 5 is 8 items, half in new voices.
6. **The partner (B1+, かわ) has 34 items.**
   - **Fix:** put 8 かわ units in wave 1, re-cut from もり situations.
   - Every unit gets a `tier: easy` set, so the couple can play one unit together (§11).
7. **The glue functions are confined to ともだち.**
   - **Fix:** each stage opens with 2–3 suggested anchor units (introduce, invite, clarify, end). Every other unit includes 2 or more glue-phrase items.
8. **The sound features aren't sequenced.**
   - **Fix:** each unit's primary feature comes from its stage's list in §3, and each feature leads 2 or more units per stage.
9. **Missing domains:** partner and family (34 items), hobbies (39), tech.
   - **Fix:** いえ・かぞく, hobbies in ともだち, tech in かいもの・サービス.
10. **Review is underspecified.** srs.ts has only item and feature cards, and in an open stage there is no fixed order to reuse "earlier" phrases from.
    - **Fix:** add phrase cards. "Caught" means right on first listen in 3 distinct clips on 2 or more days, with a new clip each review.
    - At least 20% of a unit's items reuse phrases from lower stages or from that stage's anchor units.
    - A stamped unit returns once as an 8-item check at about 30 days. The daily cap is 8 (UX), not 20.
11. **The lessons drift.** The proposal's フレーズ/はやい differ from §6's おと/じっせん, and lesson 5 needs ようじ でんわ and たちぎき, which aren't built.
    - **Fix:** use §6's names. Lesson 5 falls back to dialogue gist and detail until those games ship.

### P2

12. The English Vocabulary Profile doesn't cover reductions, so its tags are soft.
13. Re-tagging needs an agent pass plus a human sample, not an automatic seed → unit mapping.
14. Placement opens the median sub-skill's stage. Units below a sub-skill suggest とばして チェック.

## Restructuring the existing content and design

- **はまべ:** stays as is, as 3 floor units.
- **Situational items:** re-tag into about 22 units (もり about 13, やま about 9).
  - Split the overweight situations (refund, meetings, partner plans) into もり/やま spiral pairs.
  - Fold the thin ones (scam, post office, café, diet) into neighbouring units.
- **New:** about 26 units. かわ first, then events, places, glue anchors and hobbies.
- **アナウンス:** stays a mode. Its PA items are also tagged to units for lessons 4 and 5.
- **ほし:** the news and long-form track, plus about 3 life units.
- **The ladders:** become lesson 4, each assigned to its base line's unit.
- **The quiz and lv 1–5:**
  - The wire is unchanged. The quiz becomes 「ひとこと クイズ」, a free mixed deck over a stage's open units, and the engine for lessons 1–3.
  - The YAML tiles that re-cut bank lines fold into おと.

## Sign-off conditions

1. §3's mapping is restored, with stages as the spine and domain as a tag plus a coverage rule.
2. The can-do template is adopted and the first 6 units are written to it.
3. Phrase ids, the lint, and the recycling and caught rules are in the schema.
4. The 48-unit plan (8 かわ units, the easy tier) replaces "36 / 200".
5. A もり re-tag dry run lists each unit's items, phrases and top-up count before any new writing.
