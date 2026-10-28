# しまの貯金箱 · Island Fund 🏝️: Proposal v2.0

*A cozy two-player island where healthy habits, measured automatically by Apple Watch, grow fruit, and every Sunday that fruit puts real yen into the trip you earned together.*

From the team (lead, software engineer, UI/UX designer, nutritionist, fitness coach, motivational coach).
Detail: [`team/`](team/) memos (round 1 + round 3 Japan updates) · [`reviews/`](reviews/) · [`decisions/`](decisions/) 0001–0007 · [`design/mockup.html`](design/mockup.html) · [`profiles.md`](profiles.md).
v1.0 (USD, more game systems) is in git history. v2.0 reflects the Japan, yen, gym and simplicity input.

![Mockup preview](design/mockup-preview.png)

---

## 1. The idea in one minute

> **Healthy habits grow fruit; every Sunday your fruit puts yen in the trip jar and the treat purse.**
> 「がんばると果物が実る。日曜日、果物が旅の壺とごほうび財布に円を入れてくれる。」

| | |
|---|---|
| **Who** | **Partner A** (M, 29, 175 cm, 66 kg, Anytime Fitness) · **Partner B** (F, 26, 153 cm, 55 kg, personal trainer). Both are at a healthy weight, so the goal is **fitness, strength, sleep and eating habits**, not weight loss. Living in Japan. |
| **Effort** | **0 s** for activity, sleep and gym visits (automatic). **≤ 10 s/day** for an evening 3-tap eating check-in. **~1 min on Sunday** for the ceremony and next week's promise. |
| **Money** | **One currency: yen.** Trip Jar **¥10,000/week = ¥520,000/year**. Treat Purse **up to ¥104,000/year**. Steady effort at ~85% of plan unlocks the **whole trip**. Unearned yen is never lost; it stays in savings. |
| **Team + accountability** | Each week: **¥4,000 your part + ¥4,000 partner's part + ¥2,000 team part**, which pays at the *lower* of your two scores. Each person sets one **Sunday promise**, visible to the other. |
| **App** | Super simple: **3 pages + a Sunday overlay**, big numbers, little text. **Japanese UI**, switchable to English per person. Private, self-hosted iPhone web app (PWA), with a native companion for widgets later. |
| **Year** | 52 weeks in 4 seasons (Nov–Jan · Feb–Apr · May–Jul · Aug–Oct) on the Japanese calendar. |

---

## 2. Health goals (realistic, personal, Japan-aligned)

Grounded in the **MHLW Physical Activity Guide 2023** (健康づくりのための身体活動・運動ガイド2023: ~8,000 steps/day, ≥ 60 min/week of exercise, strength 2–3 days/week), the CDC guidelines (150–300 min/week) and the **Dietary Reference Intakes for Japanese 2025** (日本人の食事摂取基準 2025年版).
Detail: [fitness-coach.md](team/fitness-coach.md), [fitness-coach-round3.md](team/fitness-coach-round3.md), [nutritionist.md](team/nutritionist.md), [nutritionist-round3.md](team/nutritionist-round3.md).

### 2.1 Principles
1. **Reward behaviours, never body outcomes.** Weight, calories burned, the Move ring, HRV and VO2 max are never paid.
2. **Your own baseline.** Both partners earn identical yen for hitting *their own* targets. Body size and starting fitness don't matter.
3. **Weekly with slack** ("5 of 7 days"), so one bad day never ruins a week.
4. **More isn't better.** Category caps, a daily cap on active minutes, and at most 3 paid strength days.
5. **Rest counts.** Easy weeks, rest days and Cozy Days (のんびりデー) still pay.

### 2.2 Setup
One ~1-minute history export per phone gives the baseline: the median of 12 weeks. Then a 2-week calibration, and a short safety questionnaire.

### 2.3 The year at a glance (placeholders until calibration)

| | S1 Planting 🌱 Nov–Jan | S2 Growing 🌸 Feb–Apr | S3 Harvest 🌻 May–Jul | S4 Celebration 🍁 Aug–Oct |
|---|---|---|---|---|
| **A** active min/wk | 135 → 150 | 160 | 175 | 185 |
| **B** active min/wk | 85 → 105 | 115 → 135 | **150** ✓ | 160 |
| **A** strength (Anytime, self-guided) | 2× full-body A/B | 2×, + intervals | **3×** A/B/C (opt-in) | 2–3×, retest |
| **B** strength (personal trainer) | PT sessions count automatically; **trainer owns the programming** | ← | ← | ← |
| **Steps** (5 of 7 days) | A 7,500 · B 6,250 | A 8,000 · B 6,750 | A 8,500 · B 7,250 | A 9,000 · B **8,000** (MHLW ✓) |
| **Sleep** | 7 h asleep, 5 of 7 nights | → | → | → |
| **Eating** (always 3 habits) | 野菜を2食で · 甘い飲み物なし · 減塩デー | swap in 毎食たんぱく質 | swap in カルシウム食品 (B's bones) | keep your favourite three |
| **Japan calendar** | 忘年会 & 正月: two easy weeks; eating not scored Dec 29–Jan 3 | hanami walks | **Golden Week** = recovery week; tsuyu: active minutes can count for the apple | **Obon** easy week; heat alerts → indoor; vacation = paused |
| **Together** | Nabe night | Hanami bento walk | Summer veg box | **5K or 紅葉 hike together** (Oct–Nov) |

- **Partner B and her trainer:** the app *defers* to the trainer. Season targets are agreed with the trainer, and B has a one-page "talk to your trainer" note on bone-density goals (progressive loading, short jump sets).
- **Partner A, self-guided at Anytime Fitness:** a concrete 12-month template. Full-body A/B (→ A/B/C) with double progression (+2.5 kg once every set hits the top of the rep range), deloads in the app's easy weeks, and a pain rule. He starts "Traditional Strength Training" on the Watch at the door.
- **Adaptive targets:** each 4-week block advances, holds, or steps back 10% ("re-tuned to fit your life"). In the MVP, targets are set by hand at each season start.
- **Japanese nutrition references** (used for tips only, never scored): salt **< 7.5 g (A) / < 6.5 g (B)**, the biggest lever in Japan. Calcium 800 / 650 mg. Protein 1.2–1.6 g/kg for strength training (≈ A 80–105 g, B 65–90 g). Iron and fibre values are pending a human check.
- **Fuelling safeguard:** "refuel" tips after big training days, plus a private monthly self-check (energy, sleep, cycle regularity). Weight is not tracked.

---

## 3. Rewards: fruit, jar, purse

Rules: [ADR 0002](decisions/0002-one-scoring-model.md), [0003](decisions/0003-economy.md), [0006](decisions/0006-yen-single-currency-and-accountability.md). Rationale: [motivational-coach.md](team/motivational-coach.md), [motivational-coach-round3.md](team/motivational-coach-round3.md).

### 3.1 No intermediate currencies
| | What | Real money? |
|---|---|---|
| 🍎 **Fruit** (果物) | A weekly **score**, e.g. "57 / 85". Never spent or saved up. | No |
| 🫙 **Trip Jar** (旅の壺) | The vacation fund | **Yes, ¥** |
| 👛 **Treat Purse** (ごほうび財布) | Dates and small treats | **Yes, ¥** |

### 3.2 The weekly score (per person, max 100; 85 = full)

| Fruit | Category | Pts | Measured by |
|---|---|---|---|
| 🍑 Peach | Active minutes vs. your weekly target | 30 | Watch (auto) |
| 🥥 Coconut | Strength days: Strength/Core/Pilates ≥ 15 min, a PT session, or a confirmed gym visit; yoga or HIIT with a one-tap "included strength?" | 20 | Watch + gym-visit detection |
| 🍎 Apple | Step goal on 5 of 7 days (in tsuyu: or ≥ 30 active min) | 10 | Watch (auto) |
| 🫐 Moon-plum | Sleep target on 5 of 7 nights (12) + ≥ 1 rest day (3) | 15 | Watch (auto) |
| 🍐 Pear | 3 eating habits, 15 of 21 ticks | 25 | Evening check-in |

Linear partial credit per category. Daily active-minute cap `min(90, max(60, ½ weekly target))`. Cozy Days prorate targets.
Fruit above 85 only recovers **your own** earlier shortfall (the shortfall bank), never beyond the plan.

### 3.3 The yen (weekly)

| Part | ¥ | Paid at |
|---|---|---|
| A's own part | 4,000 | `min(A/85, 1)` |
| B's own part | 4,000 | `min(B/85, 1)` |
| **Team part** | 2,000 | the lower partner's ratio (a paused partner counts as 1.0) |
| **Treat Purse** | 1,000 per person | that person scores ≥ 60 (paused counts) |

Whole yen, rounded down per entry, with the remainder left in savings. Sunday 19:30 pays a provisional amount. **Wednesday 04:00** is the final pass and can only top up; after that the week locks.

**The year** (steady weekly scores):

| Weekly score | Trip Jar after 52 weeks |
|---|---|
| ≥ 85 | **¥520,000**, the full trip |
| 75 | ¥458,744 |
| 60 | ¥366,964 |
| 40 | ¥244,660 |

### 3.4 Treat Purse ideas (at least half non-food; two people, approx.)
Super sento / onsen day ¥3,000–6,000 · karaoke ¥2,000–4,000 · movie ¥4,000 · massage ¥5,000–8,000 · day hike + train ¥3,000–6,000 · café date ¥1,500–2,500 · kaiten sushi ¥3,000–5,000 · yakiniku ¥8,000–12,000 · strawberry picking ¥4,000–6,000 · a nice sushi counter ¥15,000+ (save up).
Spending ≥ ¥5,000 needs both partners to tap OK. Treats are planned and guilt-free; they're never called "cheat meals".

### 3.5 Team effort + individual accountability
- **Your part is yours:** it depends only on your own score. That's the accountability.
- **The team part lifts together:** it pays at the lower score, so the person who's ahead is rewarded for *inviting* the other on a walk, not for out-performing them. The copy never says whose score set the rate.
- **Sunday promise (約束):** in the ceremony each person sets **one** when/where/what plan, e.g. B 「水曜 PT＋土曜ヨガ」, A 「エニタイム 火・木・土 7時」. The partner can tap 「応援する」 (I've got you).
  The app checks it automatically against Watch workouts and gym visits: kept = ✓, not kept = ○ (never ✗). Only the promiser is asked "what got in the way?". Promises carry no money and no streak.
- **The jar on Home is the combined total.** Each person's layer is one tap deeper, drawn against their own maximum. It's not a leaderboard.
- After two rough weeks for one partner, the *other* gets a gentle "invite them to something" idea (v1).

### 3.6 Life happens
**Cozy Day (のんびりデー)**, one tap: sick, travel or low energy, and that week's targets prorate. 4 a month need no explanation.
Any one warning sign (resting HR up ≥ 7 bpm, low HRV, two short nights) makes Juniper *suggest* one.
The vacation and long illness count as paused weeks (v1).

### 3.7 What we deliberately cut (simplicity)
Cut: streaks and freeze tokens, critters and collections, monthly quests, tournaments, a cosmetic shop, outfits, lucky days, an extra NPC, and "+¥ today" chips.
Later (v1): season recap, quiet island upgrades, one milestone shelf, one seasonal event per season, widgets.

### 3.8 Tone
At most one notification a day, sleep-aware, celebratory. Banned in both languages: failed/失敗, missed, lost, behind, lazy/サボり, cheat day/チートデイ, burn off, earn your food, good/bad food, guilty/罪悪感, detox, and any body comment (太る…).

---

## 4. Presentation: super simple, Japanese-first

Detail: [ui-ux-designer.md](team/ui-ux-designer.md), [style-guide.md](design/style-guide.md), [mockup.html](design/mockup.html), [ADR 0007](decisions/0007-japanese-first-ui.md).

**Simplicity budget:** ≤ 3 pages + 1 overlay; one primary action per screen; ≈ 20–25 English words / 40–50 Japanese characters of non-numeric text per screen; big numbers; icons over rows of text; explanations live in a one-time onboarding and a "?" sheet.

| Page | At a glance |
|---|---|
| 🏝️ **島 (Island)**, home | Two villagers and two trees. Each tree shows this week's 5 fruits ripening, plus a big **57/85**. The combined jar total. One Juniper line. **One button: 今夜のチェック (evening check-in).** Tap your partner's tree to send a high-five. |
| 🫙 **旅の壺 (Jar)** | A boat on a simple route to the destination (e.g. Okinawa), with real milestones (flights, hotel). Per-person and team layers, the Treat Purse, and a short yen treat list. A quiet "≈ ¥ this week" line. A monthly "moved ✓" button for the real bank transfer. |
| 💞 **ふたり (Us)** | Partner view (fruit and %), promise history, goals, Cozy Day / pause, Health sync status. Settings live here: 言語/Language, villager (species, colour, name), privacy, gym locations. |
| 🌙 **日曜の収穫 (Sunday harvest)**, overlay | ≤ 60 s: each person's score → yen into the jar → team part → purse → set next week's promise → both tap 「壺に入れる」. |
| ✅ Check-in sheet | Three big toggles (e.g. 野菜を2食で · 甘い飲み物なし · 減塩デー), plus a neutral 「おやつ OK」 chip, a for-partner-too option and a 48 h fill-in. |

**Look:** a cozy island scrapbook, original and Animal Crossing–*inspired*. Cream paper, leaf green, sky blue, sand and coral. Zen Maru Gothic / M PLUS Rounded 1c (Japanese) and Fredoka/Nunito (numbers), all SIL OFL. Night palette 19:00–06:00. WCAG AA contrast, reduce-motion support.
**Cast:** each partner picks a villager (placeholders: Mochi the cat, Bean the dog). Juniper the capybara with a yuzu on her head hosts.
**Later (native companion):** home/lock-screen widget (jar + this week's fruit + a check-in button) and a Watch complication.

---

## 5. Architecture

Detail: [software-engineer.md](team/software-engineer.md), [software-engineer-round3.md](team/software-engineer-round3.md), [research/apple-health-ingestion.md](research/apple-health-ingestion.md), ADRs [0001](decisions/0001-health-data-ingestion.md), [0005](decisions/0005-client-and-hosting.md).

```
 iPhone A / iPhone B
 ├─ Apple Watch → Apple Health ─► Health Auto Export (auto REST)  ──┐
 ├─ Shortcuts: arrive/leave gym (runs locked, no prompt) ───────────┤  Tailscale (private)
 └─ PWA (ja/en) ◄── web push ───────────────────────────────────────┤
                                                                    ▼
                                         Home server (Mac mini, UPS, auto-restart)
                                         SvelteKit + SQLite · Asia/Tokyo jobs
                                         ingest → daily metrics → weekly score → ¥ ledger
                                         encrypted off-site backup (outside Kantō)
```

| Area | Choice |
|---|---|
| Health data | **Health Auto Export** (~¥4,000 one-time, Family Sharing) → automatic REST. v1: native SwiftUI companion (HealthKit background), $99/yr dev program. |
| Gym visits | **Shortcuts Arrive/Leave automation** per gym (Anytime branch for A; the PT studio for B), allowed to run while locked → `POST /api/presence`. A visit ≥ 30 min with no Watch workout → push 「筋トレとして記録する?」 → one tap. Fallbacks: an evening chip, then a Sunday "anything we missed?" row. (Anytime Fitness Japan has no API; the Wallet-pass trigger gets tested in Phase 0.) |
| Server | SvelteKit (node) + SQLite + Drizzle in Docker. Rules in a TypeScript config + a `recompute --dry-run` CLI (no admin UI in the MVP). |
| Network | Tailscale only, with no port forwarding (Japanese fibre is often MAP-E / DS-Lite anyway). Identity comes from Tailscale, so there's no login screen. |
| Money | Integer-yen ledger, append-only, with idempotency keys (`earn`, `topup`, `recover`) and buckets `jar` and `purse`. No bank APIs; there's a monthly "moved ✓". |
| i18n | `ja.json` / `en.json` message catalogs from day one. `¥128,000` with a half-width ¥ sign. Dates as `10月28日(水)`. |
| Resilience | UPS + auto-restart; Litestream/restic client-side-encrypted to a bucket outside Kantō; monthly restore drill. A Mac mini rather than a Pi, because of summer heat. |

**MVP API (9 endpoints):** `POST /ingest/hae/:person` · `POST /api/presence` · `GET /api/week` · `POST /api/checkin` · `POST /api/cozy-day` · `POST /api/promise` · `POST /api/purse/spend` · `POST /api/transfer/done` · `POST /api/push/subscribe`.

**Privacy:** the partner sees fruit and % only. Raw numbers are opt-in. Eating answers are never shared. All of this is enforced server-side. No third-party analytics and no cloud AI on health data.

---

## 6. Roadmap

| Phase | Effort | Scope | Done when |
|---|---|---|---|
| **0 · Spike** | 1 evening | Tailscale; HAE automations + the one-time 12-week export; gym Arrive/Leave Shortcuts; test the Wallet-pass trigger at Anytime; save real payloads | Data from both phones and one gym visit land on the server |
| **1 · MVP** | ~3 weekends | Ingest → 5-fruit weekly score → Sunday overlay + promise → ¥ ledger; 3 pages in ja/en; check-in; Cozy Day; web push; backups | 2 weeks hands-off, ≤ 1 missed day per person |
| *Calibration* | 2 weeks | Flat participation pay; baselines measured; B's targets agreed with her trainer | Season 1 starts |
| **2 · v1** | ~4–6 weekends | Season re-tune and recap, pause weeks, partner-invite idea, quiet island upgrades, **native companion** (HealthKit sync, widget with a check-in button, Watch complication) | HAE retired; widget used daily |
| **3 · Later** | seasonal | One seasonal event per season, milestone shelf, year-end recap | Still opened weekly in month 12 |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| Late or irregular Health data | Re-send yesterday on every run; D+2; Wednesday final top-up; native sync in v1 |
| Geofence misses a gym visit | Evening chip + Sunday "anything missed?" row |
| Novelty fades | Weekly ritual, promises, seasons tied to the Japanese calendar, one event per season |
| Money crowds out intrinsic motivation | Mastery framing ("you're someone who lifts"), visible progress, and an option to fade the money in year 2 |
| Overtraining / injury | Caps, easy weeks, paid rest days, pain rule, trainer-led programming for B |
| Disordered eating | Habits not calories, no meal grading, private answers, guilt-free treats, banned-words list |
| Resentment between partners | Own baselines, team part at the lower score, no leaderboard, ○ not ✗ |
| Power cut / earthquake | UPS, auto-restart, off-region encrypted backups, data re-sendable from the phones |

---

## 8. Still open (defaults are assumed, so building can start)

1. **Destination** and target month (the sample is Okinawa, Oct 2027).
2. **Pre-commitment:** move the ¥520,000 to a separate account up front, or set up a monthly standing transfer (〜¥43,000/month)?
3. **Unclaimed yen at year-end:** stays in savings (default), rolls over, or is donated?
4. **Eating:** how often do you cook vs. eat conbini, teishoku or out? Daily canned coffee or sports drinks? Drinking frequency (should 休肝日 be a habit option)?
5. **Health:** injuries, conditions, check-up findings (blood pressure, anaemia, bone density), history of disordered eating?
6. **Gyms:** which Anytime branch, and where B's PT studio is; OK to use location for gym detection? How many PT sessions a week? Would the trainer like a monthly summary?
7. **Sleep:** will you both wear the Watch to bed?
8. **Hosting:** is there an always-on Mac at home? OK to keep Tailscale on permanently?
9. **Costs:** ~¥4,000 one-time (Health Auto Export) now; $99/yr (Apple Developer) for the v1 native companion?
10. **Villagers:** animal, colour and name for each of you.
11. **Region** of Japan (for the rainy-season and heat timing) and any trips planned for 正月 / GW / Obon.
