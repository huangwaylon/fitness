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

- **American English throughout** (the user, 2026-11-06; curriculum.md "American English first"): every unit item and dialogue line is US English with a US voice (`voice: us`, a `us-*` cast), at every stage. UK/AU accent exposure lives only in the やま/ほし level banks (tagged `accent-exposure`, ≤ 10%), never in a unit.
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
  - **じっせん:** faster, over noise, other American voices (はしご / conditions / アナウンス).
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
- **Loading:** the units index extends the per-level chunk split (it lands first; no second loader). Per-unit content chunks are ≤ 32 KB gzipped, and the path index ≤ 12 KB gzipped at 200 units.
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

## 10. v2.1 amendments (the reviewers' sign-off notes)

- **Co-op stamp from rows (eng, P0):** the listen row gains `tm?` (0–6): the team's first-listen right count from the session's team tally, the same number on both phones. It ships in the same relay-first contract change as `l` and `stamped`. A player's stamp is earned when their own score is ≥ 5/6 **or** `tm` ≥ 5. Results show each player's own 6-question tally next to the shared stamp. The 30-day recheck is solo.
- **Per-player choice tiers (eng, P1):** an optional schema field in U1 for an easier and a harder choice set per item.
- **Recycling (curriculum):** ≥ 20% of a unit's items reuse phrases from lower stages or the stage's anchor units.
- **Phrase check (curriculum):** the compiler checks each phrase appears in ≥ 3 items spoken by ≥ 2 voices. Items may carry more than one phrase.
- **Wave-1 can-dos:** all written to the template before any content.
- **Glue everywhere (teacher):** an authoring rule that every dialogue opens and closes naturally.
- **Wave 1 gets a 7th unit:** 「でんわを おえる」 (ending a call), glue, かわ.
- **Each wave** is reviewed by the EFL teacher and the Japanese panel (English and Japanese copy) before voicing.
- **The 30-day recheck** shows on hub card 1 (おさらい) (UX).

## 11. U1 as built (2026-11-06): the schema and the compiler

**The listen row** (relay first, deployed 2026-11-06):
- `l` is the lesson: 1 であい, 2 ばめん, 3 チェック, 4 おと, 5 じっせん (only with `u`).
- `tm` 0–6 is the team's first-listen rights (only with `l`).
- The partner's summary gains `{u, stamped: 1}` when the row stamps its unit. The rule is contract/listen.ts `stampsUnit`: `l` 3, with own ≥ 5 right on the first listen or `tm` ≥ 5. rowsFor computes it at each read.

**A unit** is `app/content/units/<id>.yaml`. kikimimi/units.ts reads and checks it; kikimimi/compile.ts compiles it.

```yaml
schema: 1
unit: tr-hotel              # <domain2>-<slug>, ≤ 12: the row's u; never a stage
name: ホテルで こまった       # a can-do verb, ≤ 12 characters, never レッスン
stage: mori                 # hama | kawa | mori | yama | hoshi
domain: tabi                # glue | tomodachi ie tabemono kaimono tabi shigoto ibento machi karada
also: [machi]               # optional: more chips (coverage counts domain only)
host: diana                 # a roster villager
scene: lobby                # the backdrop's id
sound: self-repair          # the main feature, from the stage's list (curriculum §3; units.ts STAGES)
cando:                      # 「{who}が {does}のを {cond} きいて、{catch}が わかる」
  who: ホテルの スタッフ
  does: へやの もんだいへの たいおうを せつめいする
  cond: ロビーの ざつおんの なかで
  catch: できる ことと ついかの りょうきん
  short: ホテルの もんだいを ききとれる   # the one line: kana with spaces, ≤ 25 characters, no 。、; required past draft
  en: "I can follow hotel staff explaining what they can do about a room problem, over lobby noise, and catch the options and any extra charge."
status: draft               # draft | voiced | listened
ph:                         # 1-10 key phrases (6-10 once written), ids unique across units
  - { id: ph-im-afraid, en: "I'm afraid", ja: あいにく, register: service, scene: hotel desk, trap: こわい ではなく「あいにく」 }
  - { id: ph-small-extra, en: a small charge, match: "small (additional charge|supplement|fee)", register: service, scene: hotel desk, trap: small でも お金は かかる }
review: [m4-be-good]        # existing items the lessons reuse without homing them here
items: [...]                # new items, in the bank's Item shape (lv, type, en, ja, speaker, voice, cast, choices, answer, lines…)
lessons:
  v: 1                      # the recipe's version (v1: the interim チェック, a mixed check on held-out items)
  deai: [d4-hotel-suite, r4-room-ready, …]   # ≥ 6 ids each; であい has a dialogue
  bamen: [...]
  check: [...]              # held out of であい and ばめん, ≥ 2 voices
  oto: [...]                # optional, mostly word items
  jissen: [...]             # optional, items or ladder ids
tiers:                      # optional, per item: an easier and a harder choice set (same audio, each player's tier)
  r4-room-ready: { easy: { choices: [...], answer: 0 }, hard: { choices: [...], answer: 0 } }
letter:                     # optional (U7): the host's letter at my stamp, 40-60 words, one of its phrases in it
  en: "I'm afraid I have a confession: …"
  ja: "あいにく、うちあけたい ことが あるの。…"
```

Every lesson id that isn't under `review` is homed in the unit. The unit's own items always are.

**The compiler** is `npm run kikimimi:levels`, with no second loader.
- **Unit chunk:** each unit becomes `levels/parts/u-<id>.json`. It holds the unit (its can-do as one sentence, `cando.ja`, and its one line, `cando.short`; its phrases with the items they're heard in; its lessons, tiers and homes), its lessons' items as authored, and their clips and timings.
- **Index:** gains `units[<id>]` (parts, count, cv) and one `paths` line per unit: `[id, name, stage, domain, host, status, lesson bitmask, short?]` (the can-do's one line last, when the unit has one).
- **Problems:** an error stops it; warnings are printed.

**The checks:**
- the schema;
- ids unique across the bank, the ladders and the units;
- each item has ≤ 1 home;
- every reference exists (a rung must be named by its ladder);
- each item within one step of the stage (levelRank);
- the can-do template, including its English: "I can follow …, and catch/tell …";
- the can-do's one line, `short`: ≤ 25 characters, one line, no 。 or 、 (optional in a draft, required once voiced). The unit page, a path stop's subtitle and a lesson's intro card show it; the full sentence stays under 「くわしく」 on the unit page;
- the recipe: a known `v`, the 3 core lessons, ≥ 6 ids each, であい with a dialogue, チェック held out with ≥ 2 voices, おと mostly words;
- the tiers on lesson items only;
- American only: every inline item `voice: us` and every line a `us-*` cast (bank.test's accent policy);
- every clip, for a unit past draft;
- each phrase in ≥ 3 items by ≥ 2 voices (over the bank and the units; a warning in a draft, an error past it);
- recycling: ≥ 20 % of a unit's items carry a lower stage's or the stage's anchors' phrase (a warning until 7 units are past draft);
- coverage per stage: ≥ 7 of 9 domains and none over 25 % (a warning until the stage has its planned units).

**Budgets** (units.test, at 200 synthetic units): the path index ≤ 12 KB gzipped; each unit's chunk ≤ 32 KB (20 till the Japanese help, 2026-11-07; the compiler fails over it).

**Level-deck invariance:**
- The levels' chunks are byte-identical with and without units.
- `kikimimi/decks.golden.json` holds a digest of the decks for seeds 0–99 per level. A re-tagging commit must leave it unchanged. A deliberate change to the bank's content updates it with `vitest -u`.

Wave 1 is written (draft, §12): もり's app/content/units/tr-guide.yaml, tr-hotel.yaml and wk-chat.yaml, and かわ's gl-clarify.yaml, gl-endcall.yaml, fr-replan.yaml and ev-bday.yaml (about 30 items each, mostly new and inline; the bank's under `review`, so no level item changes home). Each file's header comment carries its 「きょうの ひとこと」 (the schema has no field for it). The もり re-tag dry run is `npm run kikimimi:units-dry-run` (scripts/kikimimi-units-dry-run.ts), and its report is docs/reviews/2026-11-06-mori-retag-dry-run.md.

## 12. Wave-1 can-dos (draft, 2026-11-06)

These are written to the §2 template before any content (§10). units.test checks every one against it (units.ts `candoProblems`). They follow the user's brief: each is one everyday moment the couple would really meet, small enough for three 2½-minute games. The English and Japanese copy goes to the EFL teacher and the Japanese panel before voicing (§10).

```yaml
- unit: gl-clarify
  name: ききかえす
  stage: kawa
  domain: glue
  cando:
    who: ともだちや おみせの ひと
    does: ききかえされて いいなおす
    cond: カフェの ざわざわの なかで
    catch: なおした すうじや なまえ
    en: "I can follow a friend or a server repeating, rephrasing or correcting themselves when I ask again, at natural speed in a noisy café, and catch the corrected number, name or detail."
- unit: fr-replan
  name: よていを かえる
  stage: kawa
  domain: tomodachi
  cando:
    who: ともだち
    does: でんわで やくそくの よていを かえる
    cond: まちの ざつおんの なかで
    catch: あたらしい ひ・じかん・ばしょと キャンセルか どうか
    en: "I can follow a friend changing our plans on the phone, over street noise at natural speed, and catch the new day, time and place, and whether they're really cancelling."
- unit: ev-bday
  name: おいわいする
  stage: kawa
  domain: ibento
  cando:
    who: ともだちや どうりょう
    does: たんじょうびの パーティーに さそって、かんぱいする
    cond: パーティーの にぎやかな なかで
    catch: いつ・どこで、なにを もっていくか
    en: "I can follow friends and coworkers inviting me to a birthday party and making a toast, in a lively room, and catch when and where it is, what to bring and who the surprise is for."
- unit: gl-endcall
  name: でんわを おえる
  stage: kawa
  domain: glue
  cando:
    who: ともだちや しごとの あいて
    does: はっきり いわずに でんわを おえようと する
    cond: でんわの こもった おとで
    catch: もう きりたい きもちと さいごの やくそく
    en: "I can follow a friend or a colleague winding up a phone call without saying so directly, over a phone line, and catch that they want to hang up and what we agreed at the end."
- unit: tr-guide
  name: ともだちを あんない
  stage: mori
  domain: tabi
  also: [machi]
  cando:
    who: とうきょうに きた ともだち
    does: いきたい ところや こまっている ことを はなす
    cond: えきや まちの ざつおんの なかで
    catch: なにが したいかと なにが しんぱいか
    en: "I can follow a friend visiting Tokyo talking about where they want to go and what's confusing them, over station and street noise at natural speed, and catch what they want to do and what's worrying them."
- unit: tr-hotel
  name: ホテルで こまった
  stage: mori
  domain: tabi
  cando:
    who: ホテルの フロントの ひと
    does: へやの もんだいへの たいおうを せつめいする
    cond: ていねいだけど はやい ことばで
    catch: できる こと・できない ことと ついかの りょうきん
    en: "I can follow hotel front-desk staff explaining what they can do about a room problem, in polite but fast speech at the desk or on the phone, and catch what's possible, what isn't, and any extra charge."
- unit: wk-chat
  name: しごとの ざつだん
  stage: mori
  domain: shigoto
  cando:
    who: しょくばの どうりょう
    does: しゅうまつや しごとの ざつだんを する
    cond: オフィスの ざわざわの なかで
    catch: わだいと、「こんど ランチ」が ほんきか
    en: "I can follow coworkers making small talk about the weekend and work by the coffee machine, in fast casual speech over office noise, and tell what they're talking about and whether 'let's grab lunch' is a real plan."
```

**Notes for the writers:**
- **ききかえす** covers both directions (teacher P1-5). One is recognising native repair ("Sorry, I meant the 15th"). The other is picking your own move as a `reply`: "Sorry, fifteen or fifty?", "Could you say the last part again?".
- **でんわを おえる** checks pre-closings with `mean` and `next` ("Anyway, I'll let you go", "Listen, I've gotta run").
- **ともだちを あんない** makes the learner the host. The friend's questions are the listening, and the replies are the learner's lines.
- Every dialogue opens and closes naturally (§10), and each unit ends with 「きょうの ひとこと」.

## 13. U2–U3 as built (2026-11-06): solo lessons and stamps

**A lesson's deck** is `kikimimi/lesson.ts` `lessonDeck(chunk, lesson, seed, tier?)`, over the unit's chunk (pool.ts `unitPart`, loaded like a level):
- 6 questions drawn by the seed, choices shuffled by it as `deck()` does: the same deck for the same seed, so co-op (8c) can share it;
- であい opens on its model dialogue;
- the チェック plays only items held out of であい and ばめん (`playIds`, besides the compiler's check);
- じっせん's ladders stay with はしご for now (its items only);
- a tier (`easy`/`hard`) swaps in that item's choice set on the same audio; `tierFor` picks it from きろく's comfortable level against the unit's stage (half a step below: easy; a step above: hard).

**Solo play** goes through the quiz's session and UI: `QuizGame.playLesson(unit, lesson)` deals the deck into my lobby kept alone (since framework 8b as the game `lesson`, games/lesson/def.ts, the lobby's seed kept) and shows the lesson's intro card (LessonIntro.svelte). The チェック's card is the phone errand: 「{host}から でんわ！ ようじを ききとろう」, with the 5-of-6 rule. A reveal in a lesson folds the note and a dialogue's transcript under 「くわしく」. Results add a strip: the unit's dots, the next core lesson, and on a チェック the stamp with my own first-listen tally (and the team's). もういっかい deals the lesson again at once.

**The row** carries `u`, `l` and the stage's level; a co-op lesson would add `tm` from the session's `teamFirst` (questions someone got right on the first listen), wired but unused until 8c.

**Stamps** (`kikimimi/stamps.ts` `unitsOf`, from gamesOf's games, which keep a lesson row's `u`, `l`, `tm`, every answer and `stampsUnit`):
- a lesson's dot: a row of it with a whole game's answers (quick play never moves dots);
- my stamp: the first stamping row's day and tally;
- the partner's: their summary's `stamped`; both: the double stamp;
- the recheck: due 30 days after the stamp, done once by a solo チェック on or after that day; `rechecksDue` lists them (for hub card 1).

**The phrase ずかん** (srs.ts): `phrasesOf` (caught: right on the first listen in 3 different items on ≥ 2 days, any mode) and `phraseReview` (a Leitner card per phrase, a new clip each, ≤ 8 a day, counting those reviewed today).

**The test entry** (`?units`, UnitList.svelte) was replaced by しまの みち in U4 (§14). The e2e puts a fixture unit in through `__kiki.unit` (pool.ts `addUnit`).

**Co-op lessons (framework 8c, 2026-11-06).** In a shared lobby the host's しまの みち card opens the path, and the lesson the host picks there (a unit page's lesson, とばして チェック) is everyone's: the game `lesson` goes out as `play` (the only wire that carries `u`) with its `cv`. The other phones take it as heard (game.svelte.ts: the lesson from the view, its intro card with 「{host}が はじめるのを まっています」) and send their tier for the unit (`tierFor` over きろく's level, as a `join`'s `tr`), so everyone hears the same items and audio with their own tier's choices; each phone grades each player against their tier (round/session.ts `deckFor`), so the team's tally and `tm` are the same on every phone. The intro card shows who's in it and, on a チェック, 「ふたりなら チームで いっぱつ 5もん でも、ふたりとも スタンプ」. Each phone writes its own row with `tm` (`teamFirst`, questions someone got right on the first listen), so `stampsUnit` (own ≥ 5 or `tm` ≥ 5) stamps everyone who played a co-op チェック the team passed; the results' strip shows the shared stamp with my own tally beside it (「じぶん いっぱつ 2/6 · チーム 6/6」), never the partner's. The 30-day recheck stays solo. A unit this phone's build doesn't have (or other content: its cv) is an update offered, not an invite. e2e kikimimi-coop (both stamped with B at 2/6, on the default wire and B on `?wire=quiz`; the update card).

**Left for later:** the phone-band condition on the チェック's audio; hub cards (with the hub); じっせん's ladders as a lesson.

## 14. U4 as built (2026-11-06): しまの みち

docs/kikimimi-ux.md §6.3 (the path), §6.3b (a unit's page), §6.5 (the lobby's card), §6.7 (the results' strip) and §6.10 (a minimal phrase ずかん) describe what's built. In short:
- **The model** is `kikimimi/path.ts` (pure, path.test): the stages as the spine, the anchors first in a stage, the current unit (the last one played and unstamped, else the first open one from my comfortable stage up), `nextLesson`, domain filters (other domains collapse to a dot; the anchors stay), a stage more than a step above my level shown softly but playable. progress.svelte.ts `pathUnits` / `currentPath` feed it from the index's path lines (and a fixture's chunk); a `draft` unit shows only with the dev hooks on.
- **The UI** is `components/kikimimi/path/`: PathCard (in the lobby, until the hub), IslandPath, UnitPage (lazy chunks; the phrase ずかん is ずかん › ことば since U5: components/kikimimi/zukan/, docs/kikimimi-ux.md §6.10, ≤ 15 KB gzipped each by kikimimi-budget.ts), LessonDots (shared with the results' strip). The sheet keeps one stack over my lobby (path › unit, ずかん); a lesson's おわる comes back to it; the results' strip offers the next core lesson. In a shared lobby the host's lesson is everyone's (co-op lessons, §13, since 8c).
- **Hub card 1's recheck** is a banner on the path until the hub exists.
- **Tests:** path.test (ordering, the current unit, filters, the soft stage, the next lesson); e2e kikimimi-units (the path from the lobby, a unit's page, であい played solo moving its dot on the page and the path, a filter; とばして チェック's mission card and stamp on the results, the unit page and the path; the ずかん on the unit's phrases). `KIKI_SHOTS=1` writes /tmp/kikimimi-shots/u4/.

## 15. U7 as built (2026-11-07): letters and landmarks

docs/kikimimi-ux.md's U7 line has the whole of it. In short:
- **Letters:** the unit's optional `letter: {en, ja}` (units.ts: `{en, ja}` only, 40-60 words of English, one of the unit's phrases heard in it). The compiler writes them all into `parts/letters.json` (the unit chunks don't change); pool.ts `loadLetters`. `letters.ts lettersOf` is mine: a letter per unit I stamped (my row's stamp, solo or co-op), newest first. The 7 wave-1 units have theirs; units.test requires one past draft.
- **Landmarks:** path.ts `landmarksOf`: a stage is cleared when each of its units has my stamp. The placement is no input and the partner's stamps don't count, so a stage the check skipped is open, never cleared. Cosmetic only.

