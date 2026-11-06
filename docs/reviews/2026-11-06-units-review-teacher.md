# Review: life-domain units (EFL teacher + learner panel), 2026-11-06

Panel: the TOEIC 700+ partner and the B1+ partner. The direction is right: situations with a can-do and phrases match their real English (foreign friends and coworkers in Tokyo, trips abroad, video calls). The risks: homework fatigue, losing the quick mixed game, two competing maps.

## Issues

### P0

1. **Five lessons of 4–6 min reads as homework.** One unit is about 25 min. At the default 3 days a week and 3 minutes a day, a unit takes 2–3 weeks. Panel: 「5つ ぜんぶは しゅくだいみたい。であいと チェックだけで いい日も ある」.
   **Fix:** one lesson is one 8-question game (about 4 min). The core is 3 lessons: であい, then ばめん, then チェック. おと and じっせん are optional ★ extras. Keep 「とばして チェック」. A unit takes about a week.

2. **The fun of the quick mixed game must survive.** If the path becomes the only way in, ひとこと クイズ turns into a syllabus.
   **Fix:** the hub's default card stays a mixed 8-question quiz at your stage. It draws from the open units plus phrases due for review. The path is opt-in.

3. **Two maps on one path.** The approved UX (§6.3) lays out stages (はまべ → ほし) as the path's geography. The proposal makes the nine domains the island areas.
   **Fix:** the stage stays the vertical axis (★, mist). The domain is the node's icon and colour, and a filter chip. No second map.

4. **Two partners, two levels.** "One situation per band" could split the couple across different units.
   **Fix:** write each unit once at B1+/B2- with the same audio for both. Choice sets differ by tier (`BuildCtx.tiers`, already designed): the B1+ partner gets gist and reply, the stronger partner gets mean and next. The stronger partner also gets the チャレンジ item (faster, noisier, another accent). Co-op works on any unit. The double stamp shows when both have cleared it.

### P1

5. **The glue functions need their own listening design.**
   - Introducing: a たちぎき scene where you catch who is who and what they share ("Oh, you're the one who…").
   - Ending: pre-closings checked with `mean` and `next` ("Anyway, I'll let you go", "I should get going", "Listen, I've gotta run" mean "let's end").
   - Clarifying: two directions.
     - Recognise native repair ("Sorry, I meant the 15th").
     - Choose your own move: a `reply` whose choices are the learner's line ("Sorry, fifteen or fifty?", "Could you say the last part again?").
   - **Fix:** every unit dialogue opens and closes naturally, so the glue is a strand in all units (today most clips start in the middle of the action). Add three dedicated glue units in wave 1. Each unit ends with 「きょうの ひとこと」 for the couple to say to each other that night.

6. **Domain fit for Tokyo.**
   - Missing: **tech trouble** (1 item today: SIM, Wi-Fi, app login, the hotel TV) and **showing a visiting friend around Tokyo**. In the second, the learner is the host explaining trains and food.
   - Hobbies and dating/family are missing as domains. Fold them into ともだち (films, music, a partner's family abroad).
   - Wave-1 swaps: hair salon → SIM/Wi-Fi trouble; sports bar → "a friend visits Tokyo". Keep the birthday and the matsuri, where a foreign friend asks you to explain it.

7. **Drop the Duolingo score mapping.** They have no Duolingo score; the number would be invented. Use Japanese can-do statements in the UI. If a reference is wanted, use their TOEIC listening score internally.

8. **Lesson names conflict.** The UX approved であい・おと・ばめん・じっせん・チェック. The proposal uses フレーズ and はやい ("はやい" sounds like only speed). Use the approved set.

### P2

9. **Japanese naming.** Use short domain labels that fit a chip: ともだち, いえ, たべもの, かいもの, たび, しごと, イベント, まち, からだ. 「もしも」 and 「・サービス」 are opaque or long. Unit names should be can-do verbs of 12 characters or fewer, in NH-style hiragana with spaces: 「ともだちを しょうかいする」, 「でんわを じょうずに おえる」, 「ききかえす」.

10. **The phrase ずかん has high value.** It's the visible "what I gained" and it feeds きょうの ひとこと. Keep it to chunks (300–400), not single words.
    - Each entry: when to use it (casual or polite), the scene, and the Japanese-English trap ("I'm easy" doesn't mean 簡単).
    - Keep "caught = heard in 3 contexts".
    - Keep 「ふたりとも しってる」 in きろく.

11. **Repetition.** Cap refunds at one かいもの unit plus one per band. Vary Osaka. The bill split appears once in たべもの.

## Restructuring the existing ~880 items

- **Three bins:**
  - **Unit core:** the situational S1–S3 items, about 550. Re-tag them with the audit's classifier (about 85% accurate), then a person checks.
  - **Mixed pool:** S0 pic/word, the num templates and generic one-liners. Not in units; they feed the mixed quiz and warm-ups.
  - **Tracks:** アナウンス (30), ほし news and lectures (about 90).
- **Levels:** stages become the bands, and the stage picker in ひとこと クイズ stays as built. Each unit has one stage.
- **The quiz mode is the lesson engine.** A lesson is an 8-question game with a unit filter and a fixed mix (であい: reply/mean/num; ばめん: gist/next on the dialogue; チェック: 8 items, 2 or more voices, 80% or better on first listen). Almost no new UI.
- **The ladder** is the mechanic for じっせん where a unit has a ladder line. スピード はしご stays standalone in あそぶ.
- **アナウンス** stays a track. Its station and airport PAs also feed the たび units' じっせん.
- **New units fill the gaps:** events, places, glue, tech, the visiting friend.

## What I need to sign off

1. A lesson is one 8-question game. The core is 3 lessons; 2 are optional. Test-out is kept.
2. The hub's default stays the mixed quiz. The path is opt-in.
3. The stage is the path's axis and the domain is a tag.
4. Shared units use the same audio with per-player tiers. Co-op works on every unit.
5. Openings and closings in every dialogue, plus 3 glue units and 「きょうの ひとこと」.
6. The Duolingo score is gone, the approved lesson names are used, and the panel reviews the Japanese copy.
7. **A pilot of 6 units** that both partners play for a week before the 36 are written.
