# Units in the approved UX: game and UX designer's review (2026-11-06)

Two inputs: the user's two new decisions (a lesson is one 2–3 min game of 6–8 questions, game first, depth optional; a unit pass can be shared with the partner, double stamp OK), and the teacher, curriculum and eng reviews. **Where I agree with them:** stages stay the spine, domains are tags, there are 3 core lessons plus optional ones, and units are manifests (eng P0-1, which the UI never sees). **Where I disagree:** flagged inline with ⚑.

## Issues

### P0

1. **The proposal's "domains as island areas" would mean two maps.** Placement, mist and landmarks are all keyed to stages (UX §4, §6.3). **Fix:** しまの みち stays vertical by stage. A domain shows up as the node's small icon and tint, plus one row of filter chips (teacher P0-3, curriculum P0-2). There is no second map.
2. **Five lessons of 4–6 min is homework.** **Fix (user decision 1):** a lesson is **one game of 6 questions, about 2½ min**. The 3 core lessons are **であい · ばめん · チェック**. **おと** and **じっせん** are optional ★おまけ: they don't block the stamp and they don't hide anything. ⚑ The teacher said 8 questions in about 4 min; I'd go with 6 to fit the user's limit. Depth moves under the reveal's 「くわしく」 (note, transcript, marks), folded by default. 「とばして チェック」 stays.
3. **Units must not swallow the quick modes.** ひとこと クイズ, はしご and アナウンス keep drawing from the **whole stage pool**, units or not (eng: items keep their `lv`). Units only add a curated order on top. How they coexist:
   - Free play moves phrases in ずかん (a phrase heard in any mode counts toward "caught") and ticks a menu card. It never moves lesson dots.
   - Lessons move lesson dots, and they also count as a finished session.
   - はしご stays a standalone mode, and it's also the engine for じっせん when a unit has a ladder line. アナウンス stays a track; its PA items also feed the たび units' じっせん.

### P1

4. **Hub card 2.** ⚑ The teacher wants the mixed quiz as the default, with the path opt-in. I agree on opt-in and keep the approved card, with one rule: card 2 is 「きょうの いっぽ」 (the next core lesson) **only once a unit has been started**. Before that, and after a unit is stamped until the next one is picked, it's 「きょうの クイズ」 at your stage. Once a lesson is a 2½-min game, the two cards feel the same anyway: one green button, about 6 questions.
5. **Nothing in the approved UX is the unit itself.** The path node goes straight to a frame. **Fix:** a new pushed page, `unit(id)` (sketch B). The stack is still at most three deep: hub › みち › unit.
6. **The mission (チェック).** The interim recipe is eng P0-2: a 6-question mixed check from held-out items, with ≥ 2 voices. **The stamp needs 5 of 6 right on the first listen** (83%). It can be retaken, and a bad attempt never locks the unit. Even before ようじ でんわ and たちぎき ship, frame it as a mission: an intro card 「ジュンから でんわ！ ようじを ききとろう」 with the host's art, then the check in the phone-band condition. When those games land, the check becomes the real mission (stamp `v` 2), and nobody gets re-stamped.
7. **Shared pass (user decision 2).** In a co-op チェック in きょうりょく, if the pair scores ≥ 5/6 together on first listens, **both are stamped**. A solo pass stamps only that player. The double stamp (both stamped) shows on the node, in ずかん and on results. This settles eng P1-2: `u` plus a stamped bit go into ListenSummary (relay first). It still never shows who missed what.

### P2

8. **Names.** Domain chips use the teacher's short set: ともだち · いえ · たべもの · かいもの · たび · しごと · イベント · まち · からだ. Units are named for what you can do, in hiragana with spaces (12 characters or fewer). Lessons go by their names only, never 「レッスン」 (this closes UX open question 5). The approved lesson names stay; drop フレーズ and はやい.
9. **No Duolingo score anywhere in the UI.** Can-dos appear in Japanese: 「ともだちの よていの へんこうが ききとれる」.
10. **Anchor units** (curriculum P1-7: introduce, invite, clarify, end) sit first in each stage, under a small 「はじめに おすすめ」 label. They're suggested, not required.

## Screens

**A. しまの みち (replaces §6.3)**
```
│ (‹)            しまの みち             (✕) │
│ [ぜんぶ][ともだち][たべもの][たび][しごと]→ │  filter chips, scroll; ぜんぶ default
│ かわ ★★   ✓ 3 / 10            🛶 いかだ    │
│  はじめに おすすめ                          │
│ ┌(ルル)👥 ともだちを しょうかい  ◉◉ ✓✓ ┐  │  double stamp
│      ┌(ジュディ)🗓 よていを かえる ●●○ ☆☆ › ┐│  3 core dots + 2 おまけ stars
│ ┌(ジュン)☕ カフェで ちゅうもん ●○○ [つづける]┐│  current: green edge
│ もり ★★★  ░ みみ チェックで ひらきます ░   │
```
The icon is the domain. A filtered-out node collapses to a dot, so the stage's shape doesn't jump around.

**B. Unit page (new, `unit(id)`)**
```
│ (‹)          カフェで ちゅうもん        (✕) │
│ [ scene: カフェ, ジュン            ] ☕ たべもの │
│ できるように なること                         │
│ 「ちゅうもんの かくにんや へんこうが ききとれる」│
│ ┌ ① であい   2ぷん   ✓              ┐ │
│ ┌ ② ばめん   3ぷん   [あそぶ]        ┐ │  the only primary
│ ┌ ③ チェック 2ぷん   🏅 5/6 で スタンプ ┐ │
│ おまけ  ☆ おと   ☆ じっせん (はしご)      │  optional, 2-col
│ フレーズ 8   No worries · gonna be… ›     │  → ずかん, filtered to this unit
│ [さそう]          [とばして チェック]      │
```

**C. Results after a lesson (adds a strip to §6.7)**
```
│ ┌ カフェで ちゅうもん  ●●○  つぎは チェック ┐ │
│ ┌ 🏅 スタンプ！ ふたりで ゲット            ┐ │  on a pass; + ジュンから てがみ 🎁
```

**D. Lobby (§6.5).** The game picker's first chip is 「しまの みち ›」. It opens a unit picker (open units on the host's side, with stamps), then a lesson. The host picks. Each phone plays its own tier on the same audio (`BuildCtx.tiers`). Both rows carry `u` and `l`, so each player's dots move.

## Stamps without かいがら

- **Unit stamp:** the host villager's letter in English with a furniture gift (present path), +なかよし, and the can-do stamp in ずかん › スタンプ.
- **Double stamp:** both of you have it. A shared photo frame at 5 double stamps.
- **Stage cleared unit by unit:** the landmark (no landmark if the stage was skipped by placement).
- **Stamped units come back once** at about 30 days as a 6-question 「おさらい チェック」 on menu card 1 (curriculum P1-10). It never takes a stamp away.

## Changes to docs/kikimimi-ux.md

- **§1:** new rows. Units: stage spine, domain tag. Lesson = one 6-question game. 3 core + 2 おまけ. Shared pass. No 「レッスン」.
- **§5:** add `unit(id)` to the IA tree and to the `nav` Page union.
- **§6.1 / §7.1:** card 2 rule (P1-4). Card 1 may hold a 30-day unit check.
- **§6.2:** the path card shows the current unit's name, domain icon and dots.
- **§6.3:** sketch A. Couple view: double stamp from the summary bit.
- **§6.3b (new):** sketch B.
- **§6.4:** drop the "unit-based modes" row and the UnitPicker. Units live on the path and in the lobby.
- **§6.5:** the みち chip in the lobby (D).
- **§6.6:** 「くわしく」 folded on the reveal. The mission intro card.
- **§6.7:** strip C.
- **§6.9 きろく:** the stage card counts stamps. A new 「できる こと」 list of stamped can-dos, with domain icons.
- **§6.10 ずかん:** ことば sections become the 9 domains. スタンプ is laid out by stage, with double stamps.
- **§7.5:** 48 units (curriculum P1-5). Each lesson is about 2½ min, so a unit's core is about 8 min, about a week at 3 days.
- **§10:** `path/UnitPage.svelte`, `path/DomainChips.svelte`. `today.ts` takes `units`.
- **§11:** U7 is after eng U3 (lesson builders) and needs eng U5 (8c) for co-op. The summary bit ships relay first in eng U0.
- **§12:** close questions 2 and 5.

## Restructuring the existing design

- Levels stay ばしょ.
- ひとこと クイズ is the mixed mode and the lesson engine.
- はしご is standalone, plus じっせん.
- アナウンス is a track, plus じっせん in the たび units.
- The ~290 items outside units stay quick-mode only.

## Sign-off

1. Stage spine, domain chips, no area map.
2. A lesson is one 6-question game. 3 core lessons. おまけ never gates.
3. Quick modes draw from the whole pool. Free play never moves lesson dots.
4. Card 2 shows a lesson only once a unit has been started.
5. The unit page and the mission intro card.
6. Shared pass in co-op with a privacy-safe summary bit.
7. No 「レッスン」, no score bands.
8. A prototype pass of sketches A–D at 393 px in WebKit before U7.
