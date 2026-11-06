# ききみみ: units (plan v2, 2026-11-06)

v1 was reviewed by four people: a curriculum designer, an EFL teacher with a Japanese learner panel, the UX designer, and the engineering lead (/tmp/units-review/*.md). v2 resolves their reviews and adds the user's two decisions:
- "Keep lessons fun, engaging and short, targeted at a short attention span, someone who doesn't like homework."
- "Unit passes can be shared."

## 1. The spine: stages, with units as stops

- **The stage stays the spine** of しまの みち, as in the UX already approved.

| Stage | Level | Role |
|---|---|---|
| はまべ | A2–B1 | warm-up and placement floor |
| かわ | B1+ | |
| もり | B2 | |
| やま | B2+ | |
| ほし | C1 | news and long-form |

- **No Duolingo score mapping:** the learners don't have a Duolingo score.
- **A domain is a tag, not a place on the map.** Each unit shows a small icon and tint, and the path has a row of filter chips. The nine domains:
  - ともだち (friends, partner and family)
  - いえ (home, daily life, tech trouble)
  - たべもの
  - かいもの (shopping and services)
  - たび (travel, plus showing a friend around Tokyo)
  - しごと
  - イベント
  - まち (places, hobbies, going out)
  - からだ (health and emergencies)
- **Coverage rule, checked by the compiler:** each stage covers at least 7 of the 9 domains, and no domain is more than 25% of a stage.
- **Glue anchor units** open each stage and are reused across domains: introducing, inviting, asking for clarification, ending a conversation.

## 2. A unit

- **One situation, one can-do.** The can-do follows a listening template from the CEFR Companion Volume scales: 「[だれ]が [なにを する]のを [どんな じょうけんで] きいて、[じょうほう／いと]が わかる」. For example: "I can follow a friend changing our plans on the phone, over street noise, and catch the new time and place."
- **6–10 key phrases** with ids (`ph`). They go into the phrase ずかん with register, scene, and the trap a Japanese speaker falls into.
  - **Caught** means right on the first listen in 3 different clips on 2 or more days.
  - The daily review is capped at 8.
- **A host villager, a scene backdrop, and one main sound feature** taken from that stage's list in curriculum §3.
- **Unit names are can-do verbs:** 「よていを かえる」, 「ききかえす」, 「おいわいする」. The word 「レッスン」 is never used.

## 3. Lessons: short, fun, game-first

- **A lesson is one game:** 6 questions, about 2½ minutes, using the existing round types.
- **The core is 3 lessons:**
  1. **であい:** a model dialogue for the gist.
  2. **ばめん:** variations: other voices, replies, implied meaning.
  3. **チェック:** a mission. Pass with 5 of 6 right on the first listen. You can retry, and it never locks.
- **2 optional extras that never block the stamp:**
  - **おと:** catch the chunks in connected speech (word / ことば タイル).
  - **じっせん:** faster, over noise, other accents (はしご / conditions / アナウンス).
- **Notes and transcripts** fold under 「くわしく」 on the reveal screen.
- **Until ようじ でんわ / たちぎき are built,** チェック is a mixed check on held-out items behind a "phone errand" intro card. Lesson recipes carry a version number.
- **Skipping:** 「とばして チェック」 lets you go straight to the check. Each stamped unit returns once, after about 30 days, as a 6-question recheck.
- **Ends with 「きょうの ひとこと」:** one line for the couple to say to each other.

## 4. Playing together, and two levels

- **Write once, play at both levels.** A unit is written once at its stage. Both phones hear the same audio, and each player gets answer choices at their own tier: the B1+ partner an easier set, the stronger player an extra challenge item.
- **Lobby:** a new 「しまの みち」 entry where the host picks a unit and a lesson. Co-op is the default.
- **Shared passes (the user's decision):**
  - a co-op チェック at ≥ 5/6 as a pair stamps both players;
  - each person's stamps are visible to the partner;
  - a "double stamp" shows when both have passed;
  - this needs a `stamped` flag in the partner summary;
  - answers stay private.

## 5. Quick modes stay

- ひとこと クイズ, はしご and アナウンス keep drawing from the whole stage. Quick play counts toward ずかん phrases and the daily menu, but never moves a unit's lesson dots.
- **Hub card 2** shows the next lesson only once a unit has been started. Otherwise it stays 「きょうの クイズ」, so quick fun stays the default.

## 6. Rewards (no かいがら)

- A villager letter with a furniture gift per stamped unit.
- Friendship points.
- Can-do stamps in ずかん.
- The stage landmark, when the stage is cleared unit by unit.

## 7. Size and the existing content

- **48 units:** かわ 10, もり 14, やま 14, ほし 10.
- **Re-tagging what we have:**
  - About 22 units at もり and やま come from existing situational items. Refunds, meetings and partner plans are split across stages.
  - Each re-tagged unit needs `ph` phrase ids and 10–15 new items, because phrase overlap inside a situation is near zero.
  - About 26 new units, かわ first, since the partner has almost nothing there today.
- **Stays outside units:**
  - the 144 island lines (はまべ);
  - the アナウンス and ほし news, lectures and talks, which remain modes and tracks;
  - the number templates, which stay in the mixed pool.

## 8. Engineering

- **Manifests:** each unit is a YAML file, `content/units/<id>.yaml`, with an id of ≤ 12 characters like `ev-bday`. It points at existing item ids and defines only its new items.
  - Each item has at most one home unit.
  - Ids never encode a unit, and the ids already shipped are frozen.
  - The 750 TS items keep their `lv`. Level quizzes and their decks stay byte-identical: a test checks seeds 0–99 per level.
- **The listen row** gains `l` (lesson 1–5) next to `u`, and the partner summary gains `stamped`. The relay deploys first.
- **Stamps** are computed from listen rows, never stored.
- **Loading:** the units index extends the per-level chunk split (it lands first; no second loader). Per-unit content chunks are ≤ 20 KB gzipped, and the path index ≤ 12 KB gzipped at 200 units.
- **Order:**
  1. The chunk split lands.
  2. **U1:** the schema, the compiler checks (coverage, phrase ids, can-do template, the level-deck invariance test), and a migration script that drafts manifests from the audit data. Its dry run re-tags もり and lists each unit's items, phrases and top-up count.
  3. Solo lessons, then stamps.
  4. The しまの みち UI: the path, the unit page, the results strip. This is a UX doc §6–7 update plus a WebKit prototype pass.
  5. Co-op lessons, after framework 8c.
  6. The TS → YAML move with 9b, and per-unit packs with 9c.
- **Effort:** about 6 agent-days of code plus about 2 of UI. Content waves start after U1.

## 9. The pilot before scaling

**Wave 1:** 6 units, each a full unit with its core and extras.

| # | Unit | Stage | Domain |
|---|---|---|---|
| 1 | ききかえす (clarify) | かわ | glue |
| 2 | よていを かえる (change plans with a friend) | かわ | ともだち |
| 3 | おいわいする (a birthday party) | かわ | イベント |
| 4 | ともだちを あんない (show a friend around Tokyo) | もり | たび/まち |
| 5 | ホテルで こまった (a hotel problem) | もり | たび |
| 6 | しごとの ざつだん (small talk with coworkers) | もり | しごと |

Both partners play wave 1 for a week. We tune from the listen rows and the user's feedback, then write the rest in waves of about 6.
