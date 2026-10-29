# しまの貯金箱 · Island Fund 🏝️: Proposal v2.2

*A cozy two-player island where healthy habits, measured automatically by iPhone and Apple Watch, grow fruit, and every Sunday that fruit puts real yen into savings for trips you earn together.*

From the team (lead, software engineer, UI/UX designer, nutritionist, fitness coach, motivational coach).
Detail: [`decisions/`](decisions/README.md) 0001–0018 · [`design/design.md`](design/design.md) · [`profiles.md`](profiles.md). The role memos and review rounds 1–6 are in git history.
v1.0 (USD, more game systems) and v2.0 (Japan, yen, gyms) are in git history. v2.1 (round 4): ¥50/fruit, four fruits, no VPN. **v2.2** (round 8): the app as built: Google Sheet backend, step-derived minutes and 4 step days, official NH art, きろく, no privacy rules and no alerts.

---

## 1. The idea in one minute

> **Every fruit you grow is ¥50 in the trip jar. Grow them together for a team bonus.**
> 「果物ひとつ＝50円。ふたりで育てるとボーナス。」

| | |
|---|---|
| **Who** | **Partner A** (M, 29, 175 cm, 66 kg, Anytime Fitness) · **Partner B** (F, 26, 153 cm, 55 kg, personal trainer). Both are at a healthy weight, so the goal is **fitness, strength and eating habits**, not weight loss. Living in Tokyo. |
| **Effort** | **0 s** for activity and gym visits (automatic, from the iPhone alone or the Watch; no Watch at night, so sleep isn't scored). **≤ 10 s/day** for an evening 3-tap eating check-in. **~1 min on Sunday** for the harvest ceremony. |
| **Money** | **One currency: yen. No fixed goal: save as much as you can.** 1 fruit = **¥50**; up to 100 fruit/person/week. A realistic 85/week each ≈ **¥530,000/year**, and a perfect 100 = ¥624,000. Treat Purse **up to ¥104,000/year**. The jar shows the *next* trip it could buy. |
| **Team + accountability** | Each week: **your fruit × ¥50 + your partner's fruit × ¥50 + a team bonus of ¥20 × the *lower* score** (≈ 17%). Each partner's fruit is visible to the other. |
| **App** | Super simple: **the island, 旅の壺 and the NookPhone apps (きろく history + editing)**, plus a Sunday overlay; big numbers, little text. **Japanese UI**, switchable to English per person. Runs on a Google Sheet + Apps Script with the UI on GitHub Pages (no server of our own); on the phones it's just a home-screen web app (**no VPN app**). |
| **Year** | 52 weeks in 4 seasons (Nov–Jan · Feb–Apr · May–Jul · Aug–Oct) on the Japanese calendar. |

---

## 2. Health goals (realistic, personal, Japan-aligned)

Grounded in the **MHLW Physical Activity Guide 2023** (健康づくりのための身体活動・運動ガイド2023: ~8,000 steps/day, ≥ 60 min/week of exercise, strength 2–3 days/week), the CDC guidelines (150–300 min/week) and the **Dietary Reference Intakes for Japanese 2025** (日本人の食事摂取基準 2025年版).
Detail: [ADR 0017](decisions/0017-round-4-rule-changes-and-rule-versions.md) (round 4 rule changes; the coach and nutritionist memos are in git history).

### 2.1 Principles
1. **Reward behaviours, never body outcomes.** Weight, calories burned, the Move ring, HRV and VO2 max are never paid.
2. **Your own baseline.** Both partners earn identical yen for hitting *their own* targets. Body size and starting fitness don't matter.
3. **Weekly with slack** ("4 of 7 days"), so one bad day never ruins a week.
4. **More isn't better.** Category caps, a daily cap on active minutes, and strength paid only up to your own target (2 days in S1).
5. **Rest counts.** Easy weeks and rest days still pay.

### 2.2 Setup
The Shortcut's optional 84-day run ([shortcut-health-sync §6](ops/shortcut-health-sync.md#6-one-time-baseline-optional)) gives the baseline. Calibration is **the weeks of Nov 2 and Nov 9 2026**: a flat 60 fruit with Health data on ≥ 6 of 7 days ({R17}).

### 2.3 The year at a glance (placeholders until calibration)

| | S1 Planting 🌱 Nov–Jan | S2 Growing 🌸 Feb–Apr | S3 Harvest 🌻 May–Jul | S4 Celebration 🍁 Aug–Oct |
|---|---|---|---|---|
| **A** active min/wk | 135 → 150 | 160 | 175 | 185 |
| **B** active min/wk | 85 → 105 | 115 → 135 | **150** ✓ | 160 |
| **A** strength (Anytime, self-guided) | 2× full-body A/B | 2×, + intervals | **3×** A/B/C (opt-in) | 2–3×, retest |
| **B** strength (personal trainer) | PT sessions count automatically; **trainer owns the programming** | ← | ← | ← |
| **Steps** (4 of 7 days) | A 7,500 · B 6,250 | A 8,000 · B 6,750 | A 8,500 · B 7,250 | A 9,000 · B **8,000** (MHLW ✓) |
| **Eating** (3 habits each, personal) | **B:** 昼ごはんを食べる · おやつは果物・ナッツ・ヨーグルト · 野菜を2食で — **A:** ランチは定食スタイル · 減塩デー · 野菜を2食で | swap in 毎食たんぱく質 | B: swap in カルシウム食品 (bones) | keep your favourite three |
| **Japan calendar** | 忘年会 & 正月: two easy weeks; eating not scored Dec 29–Jan 3 | hanami walks | **Golden Week** = recovery week; Tokyo tsuyu (Jun 1–Jul 20): active minutes can count for the apple | **Obon** easy week; heat alerts → indoor; vacation = paused |
| **Together** | Nabe night | Hanami bento walk | Summer veg box | **5K or 紅葉 hike together** (Oct–Nov) |

- **Partner B and her trainer:** the app *defers* to the trainer. Season targets are agreed with the trainer, and B has a one-page "talk to your trainer" note on bone-density goals (progressive loading, short jump sets).
- **Partner A, self-guided at Anytime Fitness:** a concrete 12-month template. Full-body A/B (→ A/B/C) with double progression (+2.5 kg once every set hits the top of the rep range), deloads in the app's easy weeks, and a pain rule. He starts "Traditional Strength Training" on the Watch at the door.
- **Adaptive targets:** each 4-week block advances, holds, or steps back 10% ("re-tuned to fit your life"). In the MVP, targets are set by hand at each season start.
- **Japanese nutrition references** (used for tips only, never scored): salt **< 7.5 g (A) / < 6.5 g (B)**, the biggest lever in Japan. Calcium 800 / 650 mg. Protein 1.2–1.6 g/kg for strength training (≈ A 80–105 g, B 65–90 g). Iron and fibre values are pending a human check.
- **Personal eating habits** (from the participants' eating patterns in [profiles.md](profiles.md)): B works from home and sometimes skips lunch, so 「昼ごはんを食べる」 comes first (it's also the main under-fuelling risk with PT training), plus a snack swap (chips aren't banned). A eats lunch out 3 office days, so a teishoku-style lunch + salt-smart day. Neither drinks coffee or alcohol, so 休肝日 is dropped. Weekday home cooking is already a strength, so there's no dinner habit; weekend meals out are normal life, and the Treat Purse is for special outings.
- **Fuelling safeguard:** "refuel" tips after big training days, plus a monthly self-check (energy, sleep, cycle regularity). Weight is not tracked.
- **Sleep:** not scored (no Watch at night). There's an optional iPhone Sleep Focus bedtime reminder, unscored.

---

## 3. Rewards: fruit, jar, purse

Rules: [ADR 0006](decisions/0006-yen-single-currency-and-accountability.md), [0008](decisions/0008-open-ended-savings-per-fruit-rate.md), [0009](decisions/0009-no-sleep-four-fruits.md), [0017](decisions/0017-round-4-rule-changes-and-rule-versions.md) (these supersede parts of 0002/0003). Rationale: [ADR 0014](decisions/0014-simplify-no-promises-no-cozy.md). Values: `app/src/lib/config/rules.ts`, versioned by week, so a rule change never re-prices a past week (0017).

### 3.1 No intermediate currencies
| | What | Real money? |
|---|---|---|
| 🍎 **Fruit** (果物) | A weekly **score** out of 100, e.g. "72". Each one is worth ¥50, but you never spend fruit itself. | No |
| 🫙 **Trip Jar** (旅の壺) | Open-ended trip savings | **Yes, ¥** |
| 👛 **Treat Purse** (ごほうび財布) | Dates and small treats | **Yes, ¥** |

### 3.2 The weekly score (per person, max 100; four fruits)

| Fruit | Category | Pts | Measured by |
|---|---|---|---|
| 🍑 Peach | Active minutes vs. your weekly target (30) + ≥ 1 rest day (5) | 35 | max(Watch minutes, (steps − goal) / 100, workouts added in きろく), daily cap |
| 🥥 Coconut | Strength days: Strength/Functional/Pilates ≥ 15 min, a PT session, or a confirmed gym visit (≤ 2 paid/week); Core, HIIT or yoga with a one-tap "included strength?" | 25 | Watch + gym-visit detection |
| 🍎 Apple | Step goal on 4 of 7 days (in tsuyu: or ≥ 30 active min) | 15 | iPhone/Watch (auto) |
| 🍐 Pear | 3 eating habits, 15 of 21 ticks | 25 | Evening check-in |

Linear partial credit per category, capped at your own target, so training beyond the plan earns nothing extra. Any gym visit ≥ 30 min is a busy day, not a rest day. Daily active-minute cap `min(90, max(60, ½ weekly target))`. Targets are never prorated (ADR 0014).

### 3.3 The yen (weekly)

| Part | ¥ |
|---|---|
| A's fruit | **¥50 × A's score** (max ¥5,000) |
| B's fruit | **¥50 × B's score** (max ¥5,000) |
| **Team bonus** | **¥20 × the lower score** (max ¥2,000; a paused partner counts as 100) |
| **Treat Purse** | ¥1,000 per person who scores ≥ 60 (paused counts) |

Whole yen. Sunday 19:30 pays a provisional amount. **Wednesday 04:00** is the final pass and can only top up; after that the week locks.

**The year** (both partners at a steady score):

| Weekly score | Week | Year |
|---|---|---|
| 100 | ¥12,000 | ¥624,000 |
| 85 | ¥10,200 | **¥530,400** |
| 75 | ¥9,000 | ¥468,000 |
| 60 | ¥7,200 | ¥374,400 |

**No fixed goal; a trip ladder instead.** The Jar shows only the **next rung** and how far away it is, which keeps the goal-gradient effect going in the middle months. Reaching a rung is celebrated at Sunday harvest.
Rungs (editable): ¥30,000 日帰り温泉 · ¥80,000 箱根 · ¥150,000 沖縄 · ¥300,000 台湾 · ¥500,000 ハワイ · ¥700,000+ ヨーロッパ.

**Moving the real money:** from the 25th (給料日) an in-app banner on 旅の壺 shows last month's earned yen; you move it to savings yourself and one tap marks it ✓. A standing auto-transfer of ≈ ¥45,000/month is optional. There's no up-front pre-commitment.

### 3.4 Treat Purse ideas (at least half non-food; two people, approx.)
Super sento / onsen day ¥3,000–6,000 · karaoke ¥2,000–4,000 · movie ¥4,000 · massage ¥5,000–8,000 · day hike + train ¥3,000–6,000 · café date ¥1,500–2,500 · kaiten sushi ¥3,000–5,000 · yakiniku ¥8,000–12,000 · strawberry picking ¥4,000–6,000 · a nice sushi counter ¥15,000+ (save up).
Spending ≥ ¥5,000 needs both partners to tap OK. Treats are planned and guilt-free; they're never called "cheat meals".

### 3.5 Team effort + individual accountability
- **Your fruit is yours:** ¥50 each, depending only on your own score. That's the accountability.
- **The team bonus lifts together:** ¥20 × the lower score, so the person who's ahead is rewarded for *inviting* the other on a walk, not for out-performing them. The copy never says whose score set the rate.
- **The jar on 島 is the combined total.** Each person's layer is one tap deeper, drawn against their own maximum. It's not a leaderboard.
- After two rough weeks for one partner, the *other* gets a gentle "invite them to something" idea (v1).

### 3.6 Life happens
No excused days (Cozy Days were cut, ADR 0014): a sick or travel week just scores lower, cushioned by the weekly slack and linear partial credit.
The vacation and long illness count as paused weeks (v1).

### 3.7 What we deliberately cut (simplicity)
Cut: sleep scoring, Sunday promises, Cozy Days, a single fixed destination, the 85 threshold and shortfall bank, streaks and freeze tokens, critters and collections, monthly quests, tournaments, a cosmetic shop, outfits, lucky days, an extra NPC, and "+¥ today" chips.
Later (v1): season recap, quiet island upgrades, one milestone shelf, one seasonal event per season, widgets.

### 3.8 Tone
No notifications or reminders ([ADR 0016](decisions/0016-no-privacy-no-alerts.md)). Banned in both languages: failed/失敗, missed, lost, behind, lazy/サボり, cheat day/チートデイ, burn off, earn your food, good/bad food, guilty/罪悪感, detox, and any body comment (太る…).

---

## 4. Presentation: super simple, Japanese-first

Detail: [design.md](design/design.md) (the current design spec), [history-and-editing.md](design/history-and-editing.md) (きろく), [ADR 0007](decisions/0007-japanese-first-ui.md), [ADR 0018](decisions/0018-official-art-public-site.md) (official art).

**Simplicity budget:** two screens (島 and 旅の壺), the NookPhone, one overlay and one sheet. No tab bar. One primary action per screen, ≤ 40 Japanese characters of non-numeric text per screen, big numbers, icons over rows of text; explanations live in the 使い方 app.

| Screen | At a glance |
|---|---|
| 🏝️ **島 (Island)**, home | The island scene full bleed. A light HUD: the clock, the NookPhone button and the **今週 ribbon** (my week, the one focal point). Two villagers by their fruit trees, the jar on its plate (tap → 旅の壺). **One action: 今夜のチェック.** しずえ speaks only when she has news (a gym-visit question, harvest, payday, a fruit that grew); a pending 「筋トレでしたか？」 takes the action's slot as an NH choice list. Tap my villager → check-in; tap the partner → their week and ハイタッチ. |
| 🫙 **旅の壺 (Jar)** | `◀ 島へ`, then the jar and **one big total** with 今週 ≈ ¥. Two cards: the **trip** (次は 沖縄, a bar, あと ¥; tap → the whole ladder) and the **ごほうび財布** (Treat Purse, 使う). The 給料日 banner from the 25th. No しずえ here. |
| 📱 **NookPhone apps** | **きろく** (history: each week's fruit and yen, day detail, and editing of your own days in open weeks), **使い方** (help), **村人** (villager and name), **言語** (Japanese/English), **同期** (sync status, いま同期). |
| 🌙 **日曜の収穫 (Sunday harvest)**, overlay | ≤ 60 s: the tally (each villager's four fruit + ¥) → a trip rung, if one was reached → 「壺に入れる」 → the jar fills. |
| ✅ **Check-in sheet** | My three habits for today, or yesterday (48 h fill-in), as big toggles; each tap saves. Off over 正月. |

**Look:** official New Horizons renders (villagers, しずえ, trees, fruit, NookPhone tiles) on a Pocket Camp–style diorama: a gradient sky, sea and grass at NH tile scale, with the time-of-day and season theme of the games. Zen Maru Gothic (Japanese) and Fredoka/Nunito (numbers), SIL OFL. WCAG AA contrast, reduce-motion support, works down to 320 px.
**Cast:** each person picks a villager from the 10-villager roster; they are named **ウェイ (A)** and **うめ (B)**. The host is **しずえ** (Isabelle).
**Later (native companion, v1):** home/lock-screen widget (jar + this week's fruit + a check-in button) and a Watch complication.

---

## 5. Architecture

Detail: ADR [0015](decisions/0015-google-sheet-backend.md) (supersedes the hosting parts of 0005/0010/0012/0013), [sheets contract](design/sheets-architecture.md), [Google setup](ops/google-setup.md), [runbook](ops/runbook.md), [ADR 0012](decisions/0012-shortcuts-health-sync.md) (Shortcuts).

```
 iPhone A / iPhone B
 ├─ iPhone/Watch → Apple Health ─► Shortcuts health sync (auto POST) ┐
 ├─ Shortcuts: arrive/leave gym (runs locked, no prompt) ───────────┤  POST {key, action, …}
 └─ PWA (ja/en, GitHub Pages) ◄─► snapshot rows / events, きろく edits ┤
      computes scores + ¥ in the browser                            ▼
                                     Apps Script web app (bound, spreadsheets.currentonly)
                                     Google Sheet "Island Fund": append-only rows
```

| Area | Choice |
|---|---|
| Health data | **iOS Shortcuts** (built in, ¥0): an App-trigger automation reads Health samples and POSTs them when the phone is in use, at most hourly ([ADR 0012](decisions/0012-shortcuts-health-sync.md)). v1 option: native SwiftUI companion (HealthKit background), $99/yr dev program. |
| Gym visits | **Shortcuts Arrive/Leave automation** per gym, allowed to run while locked → `action: "presence"`. A visit ≥ 30 min with no Watch workout → the app asks 「筋トレとして記録する?」 → one tap. |
| Data + backend | A **Google Sheet** (one tab per row type, append-only) and the **Apps Script bound to it**, deployed as a web app. It is the only reader and writer, never hands out Google tokens, and answers `ingest`, `presence`, `event`, `snapshot`, `whoami`. ¥0. |
| History + editing | **きろく** writes edits as append-only events (`metric_set`, `workout_add`, `workout_edit`, …): your own data only, open weeks only (this week, and last week until Wednesday 04:00). The latest event wins on read; nothing is overwritten ([history-and-editing.md](design/history-and-editing.md)). |
| Compute | **Compute-on-read in the browser**: the PWA turns the rows into scores, yen, harvest and jar with the pure scoring code. Each week pays max(as of Sun 19:30, as of Wed 04:00) using the script's timestamps, so there is no ledger and no scheduler. Paints instantly from a local snapshot; writes are optimistic and queued. |
| UI hosting | Static SPA on **GitHub Pages** (¥0), strict CSP (only our origin and Apps Script). |
| Auth | Two per-person keys (Script Properties) sent in the request body; rotate by editing a property. The phone pastes its key once. |
| Money | Integer yen, recomputed from rows: `jar` and `purse`, treat spends ≥ ¥5,000 need the partner's OK. No bank APIs; there's a payday "moved ✓". |
| i18n | `ja.json` / `en.json` message catalogs from day one. `¥128,000` with a half-width ¥ sign. Dates as `10月28日(水)`. |
| Resilience | Nothing of ours to keep running. Google's version history plus a monthly `.xlsx` download. |

**Data:** both people see all of each other's data, including raw numbers and eating check-ins ([ADR 0016](decisions/0016-no-privacy-no-alerts.md)). The rows sit in one private sheet owned by the shared account. No third-party analytics and no cloud AI on health data.

---

## 6. Roadmap

| Phase | Effort | Scope | Done when |
|---|---|---|---|
| **0 · Spike** | 1 evening | Sheet + Apps Script deployed, keys pasted; Shortcuts health sync (App trigger); gym Arrive/Leave Shortcuts; test the Wallet-pass trigger at Anytime | Data from both phones and one gym visit land in the sheet |
| **1 · MVP** ✓ built | ~3 weekends | Ingest → 4-fruit weekly score → Sunday overlay → compute-on-read payouts; 島 + 旅の壺 + NookPhone (きろく) in ja/en; check-in | 2 weeks hands-off, ≤ 1 missed day per person |
| *Calibration* | weeks of Nov 2 and Nov 9 | Flat participation pay; baselines measured; B's targets agreed with her trainer | Season 1 starts |
| **2 · v1** | ~4–6 weekends | Season re-tune and recap, pause weeks, partner-invite idea, quiet island upgrades, **native companion** (HealthKit sync, widget with a check-in button, Watch complication) | Widget used daily |
| **3 · Later** | seasonal | One seasonal event per season, milestone shelf, year-end recap | Still opened weekly in month 12 |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Late or irregular Health data | Re-send yesterday on every run; D+2; Wednesday final top-up; native sync in v1 |
| Geofence misses a gym visit | Evening chip + Sunday "anything missed?" row |
| Novelty fades | Weekly ritual, seasons tied to the Japanese calendar, one event per season |
| Money crowds out intrinsic motivation | Mastery framing ("you're someone who lifts"), visible progress, and an option to fade the money in year 2 |
| Overtraining / injury | Caps, easy weeks, paid rest days, pain rule, trainer-led programming for B |
| Disordered eating | Habits not calories, no meal grading, guilt-free treats, banned-words list |
| Resentment between partners | Own baselines, team part at the lower score, no leaderboard, ○ not ✗ |
| A rule change re-prices old weeks | Rules are versioned by week ([ADR 0017](decisions/0017-round-4-rule-changes-and-rule-versions.md)) |
| Official art takedown | `<OfficialArt>` falls back to our drawings; make the repo private ([ADR 0018](decisions/0018-official-art-public-site.md)) |
| Google account / script problems | Keys only reach Island data; authorization-lapse check (google-setup §9); version history + monthly `.xlsx`; health data re-sendable from the phones |

---

## 8. Still open (defaults are assumed, so building can start)

*Answered so far:* no fixed destination (save as much as possible) · Tokyo · Google Sheet backend, no Mac (ADR 0015) · no Watch at night · no health conditions · no sweet drinks / coffee / alcohol · B = personal trainer, A = Anytime · Japanese UI · no VPN on the phones · villagers ウェイ (A) and うめ (B), host しずえ · official NH art, public repo for now (ADR 0018) · no privacy rules, no alerts (ADR 0016).

1. **Rate:** is a maximum of ≈ ¥624,000/yr savings + ¥104,000/yr treats comfortable? (One setting: ¥50/fruit.)
2. **Gyms:** which Anytime branch, and where is B's PT studio? OK to use location for gym detection? How many PT sessions a week? Would the trainer like a monthly summary?
3. **Costs:** ¥0 now (Shortcuts, Google Sheet + Apps Script, GitHub Pages; no Mac needed); $99/yr (Apple Developer) only if we build the v1 native companion?
4. **Trips:** any planned for 正月 / GW / Obon (these become paused or easy weeks)?
