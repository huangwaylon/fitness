# Round 17: information architecture and content review

**Team:** UI designer · game designer (NH / Pocket Camp) · UX designer (information architecture, apps for kids and
young adults). **Scope:** what every screen *says*: each number, label and line, where it lives and how often it
repeats. Report only: no app code was changed (other engineers are editing components right now).

**Method.** `npm run build`, then a static copy of `build-pages` served on `127.0.0.1:4192`, because `vite preview` was
killed twice mid-run by parallel work. Playwright with the installed Chrome (`channel: 'chrome'`), iPhone touch
emulation, `ja-JP`, `Asia/Tokyo`, `?demo&date=2026-10-30T12:10` and `?demo=harvest`. 186 screenshots: 62 screens and
states each at 390×844 ja, 390×844 en and 320×568 ja. Each screen's visible text was dumped next to its PNG and checked
by eye. The script and shots are in `/tmp/r17-ia/` (`walk.mjs`, `shots/`); they are not committed. Sources read:
`docs/design/design.md`, ADR 0019 (with both amendments), ADR 0020, `routes/+page.svelte`, `routes/jar/+page.svelte`,
`components/{island,pots,sheets,kiroku,phone}/*`, `lib/types.ts`, `i18n/{ja,en}.json`.

The demo numbers below come from those shots (Fri 10/30, before → after tonight's check-in): today 140 → 440 ベル, pots
7,364 + 57,456 = 64,820, this week 5,090.

> **Addendum: ADR 0021 landed while this review was being written** (Activity Rings + steps + gym, five fruits with 🍒
> added, no manual check-ins). The walk was done on the build before it. What changes here:
> - §4.4 and rank 10 (the check-in sheet) fall away.
> - The habit ticks drop out of the matrix: island button, partner sheet, week dots, day chips.
> - The tree popup becomes five rows.
> - Three things get *stronger*:
>   1. **The partner sheet loses its habit list.** That leaves avatar, name, sync time, rings and ハイタッチ, and the
>      rings are exactly the partner's tree popup (§4.3: make it a villager card, or remove the partner popup).
>   2. **The island's one action slot is empty.** Don't fill it with a number. Candidates are the NH-style ハイタッチ
>      (it moves from the partner sheet) or nothing, letting しずえ's box take the slot.
>   3. **One word per ring.** Use Apple's ja terms: 🍑 **エクササイズ**, 🍐 **ムーブ**, 🍒 **スタンド**, 🍎 歩数,
>      🥥 ジム (en Exercise / Move / Stand / Steps / Gym). This replaces the 運動 / Exercise row of §5.1; never mix
>      them with 活動 / 運動 / 食事.
> - The Move goal (per person, editable) needs a home. It belongs in きろく からだ, next to the weight goal: one
>   「目標」 place for both, not a new app.
> - The week pips in §4.2 suit the ring fruits even better (5 of 7 days closed).

---

## 0. Verdict in one paragraph

The **island is right**: one focal number, one action, a calm scene. It follows NH. The trouble starts one tap
away:
- **Money numbers are shown in too many places.** ふたりの壺 shows nine ベル figures before its first buy button.
  Today's ベル shows on three screens, and twice on ふたりの壺 itself. Week totals show on five screens, and the pot
  balances on three.
- **History is told twice.** きろく has two parallel week histories (the からだ week cards and the ベル ledger), and
  they repeat each other's totals.
- **Key progress has no home.** The thing that decides the Sunday bonus, *my* progress toward each weekly badge, is
  never shown to me. Only my partner's shows, one fruit at a time, in a caption.
- **Words drift.** The same idea gets two or three words: 活動/運動, 今日/きょう, 修正/へんしゅう/直す,
  もとに戻す/なかったことに, jar/pot, and three names for the Sunday bonus.

Fixing this is mostly **removing** things, which is cheap.

---

## 1. Inventory: what each screen shows today

Each data point is listed as **label → value (source)**. "≡" marks a repeat inside the same screen.

### 1.1 島 Island (`+page.svelte`, `Hud.svelte`, `JarSpot.svelte`, `FruitTree.svelte`)
| # | Shown | Value | Source |
|---|---|---|---|
| I1 | Ribbon 「きょう +140 ベル」 (tap → きろく ベル tab) | today, both people | `pots.todayBells` |
| I2 | Jar nameplate 「64,520 ベル ▶」 (tap → ふたりの壺) | pots total | `treat.balance + trip.balance` |
| I3 | Ground fruit under each tree, 0–3 per kind | **today's** % of the daily goal, in thirds | `fruitCount(todayPct)` |
| I4 | Villagers (me left, partner right), しずえ only with news | — | — |
| I5 | Action 「今夜のチェック」 / 「· あと2つ」 / 「✓ チェック済み」 | my habit ticks today | `habits.ticksByDate` |
| I6 | NookPhone button; the sync chip only when offline | — | — |
| I7 | しずえ's lines: 「ヨガは筋トレでしたか？」, 「食事の洋なしが育ちましたよ！」, 「収穫の時間ですよ！」 | — | `news` |

Clean. One problem: the ribbon and the plate are two unlabelled-looking ベル numbers ten centimetres apart. The ribbon
says きょう; the plate says nothing. And design.md §S.3 says the ground fruit is *the week's* fruit, while the code
draws *today's* (`FruitTree.svelte:57`).

### 1.2 Tree popup (tap a canopy, `FruitTree.svelte` `.detail`)
Four rows: icon · 活動 / 筋トレ / 歩数 / 食事 · today/goal (3/45分, 0/1, 4,647/8,000歩, 0/3) · ベル earned (+15 ベル,
0 ベル …). The same component is used for the partner's tree. At 320 the word labels are dropped, leaving the icon only
(`320-day-ja-04`).
- The week's badge progress isn't here. It lives only in each tree's `aria-label`.
- 「0 ベル」 is printed three times in a row on a slow day: noise.

### 1.3 Partner sheet (`PartnerSheet.svelte`)
- Avatar · name (うめ) · 「きょう +125 ベル」 · 「15:24 同期」.
- Four fruit rings, each labelled today/goal (25/45分, 0/1, 3,898/8,000歩, 0/3).
- **≡** A caption under the rings repeats the picked ring: 「活動 きょう 25/45分 · 今週 0/5日」.
- Three habit rows (ticked or not) · ハイタッチ.
- Cross-screen: the rings, today/goal and today's ベル are **exactly** what the partner's tree popup shows (1.2), minus
  the per-fruit ベル.

### 1.4 今夜のチェック (`CheckinSheet.svelte`)
- Title 「今夜のチェック」 · 「10月30日(金)」 · the switch 昨日 | 今日 (**≡** the date and the switch both say which day).
- 「ぜんぶできた！」 · three habit rows (name + hint) · 「保存」.
- Each tap already saves, so 保存 only closes the sheet. The label promises something that has already happened.

### 1.5 ふたりの壺 (`routes/jar/+page.svelte`, `PotCard`, `TreatShelf`, `TripList`)
Top to bottom at 390 (`390-day-ja-50/51`):

| # | Shown | Value |
|---|---|---|
| J1 | Hero: 「ふたりの きょう +440 ベル」 | today, both (= I1) |
| J2 | Hero: 「今週 +5,090 ベル」 | week, both (= きろく ×3) |
| J3 | おやつの壺: balance **7,364 ベル** | |
| J4 | おやつの壺: 「きょう +88 ベル 今週 +1,018 ベル」 | 20% of J1 and J2 |
| J5 | Six buy tiles: name + price (+ 「あと N」 when short) | |
| J6 | 旅の壺: balance **57,456 ベル** | |
| J7 | 旅の壺: 「きょう +352 ベル 今週 +4,072 ベル」 | 80% of J1 and J2 |
| J8 | Trip rows: name · price · 「行けます！」 **and** a 「行く！」 button (**≡**), or a bar + 「あと 72,544 ベル」 | |
| J9 | 「さいきんのベル」: **「10月30日(金)のベル +440」** (**≡ J1**), 10/29 +1,320, 10/28 +490 | history |
| J10 | Two 「へんしゅう」 buttons, each as big as a buy tile | |

So nine ベル figures come before the first buy button. J1 shows twice on this screen (J1 and J9). The total on the
island plate (I2), the number you tapped to get here, appears **nowhere** on this screen. The ≤ 40-character budget in
design.md §0 is exceeded about fourfold.

### 1.6 Buy confirm (`BuyConfirm.svelte`)
Title (pot name) · icon · item · price · 「壺の残り 7,364 ベル → 5,864 ベル」 · 買う！ / 行く！. Fine: every number is
new and needed for the decision.

### 1.7 日曜の収穫 (`HarvestOverlay.svelte`)
- **Tally:** per person, avatar + name + four badge fruits (lit/✓) + 「+1,000 ベル」. Then ふたりボーナス +250 with the
  line 「ふたりでそろえたバッジのぶん！」 (it breaks as 「ぶ / ん！」 at 390). Then 「今週のボーナス **+1,750 ベル**」
  and 「今週ぜんぶで 10,555 ベル」 (= the きろく week total).
- **End card:** 「+1,750 ベル ふたりの壺に入りました！」 (**≡** the tally's big number) · per pot 「+350 ベル」 and the
  counted-up balance 7,364 / 57,456 · 「うめさんの番です」 · 島へもどる.

### 1.8 しまフォン home
Status row (12:10 · leaf · デモ) · 6 tiles: きろく · あそびかた · 村人 · 言語 · 同期 · サウンド. Good: one job each.

### 1.9 きろく (`Kiroku.svelte`, two pills: からだ | ベル)
- **からだ tab** (`21`):
  - 体重のながれ card: per person, the trend kg + 「今週 −0.3 kg」 + a sparkline.
  - Week cards: range · **week ベル** (5,090) · 🔒 · ✓, then per person the **ベル** (2,705 / 2,385) and 7 day stamps
    (★ = strength day, ● = 8,000 steps **or ≥ 20 min**, ○ = neither).
  - The stamps have no legend. Their ● rule (`DAILY.activeDayMin = 20`, `history.ts:117-127`) matches no ベル rule and
    no badge (the badges count 45-minute days and 8,000-step days). So the "body" tab leads with ベル.
- **Week detail** (`30/31`):
  - 「今週 10/26–11/1 **5,090 ベル**」 · 「あと4日 修正できます」.
  - People card: per person **2,705 ベル / 2,385 ベル** + four badges (all grey mid-week, with no progress shown).
  - 7-day table (steps · minutes · ★ · meal dots, both people).
  - **≡** 「内訳 ウェイ 2,705 ベル うめ 2,385 ベル」 repeats the people card word for word.
  - へんこう履歴.
- **Day detail** (`32/33`): date · 「あと4日 修正できます」 (≡ week detail), then per person:
  - 「この日のベル +1,025 ベル」 and the per-fruit ベル;
  - steps ✎, 運動 ✎ (Watch), workouts, habit chips, ＋ワークアウトを追加;
  - the partner's card is marked 見るだけ.
- **Weight detail** (`23/24`):
  - 「いまのながれ 68.7 kg」 · boxes 今週 −0.3 kg / はじめから −3.9 kg.
  - 「1週間に −0.3 kg」 (≈ the 今週 box: two different measures that read alike and here show the same value).
  - Chart with 目標 66.0 · legend (毎朝の記録 · ながれ · 目標).
  - 「目標 66.0 kg このペースなら 2026年12月ごろ 目標に届きそう」: 目標 three times in one card.
  - 体重を記録 · 目標を変える · a note · さいきんの記録 table (日 · 体重 · ながれ).
- **ベル tab** (`17/18/28/29`):
  - Card: **おやつの壺 7,364 / 旅の壺 57,456** (= ふたりの壺 J3/J6) and 「これまでにふたりで 86,820 ベル」.
  - Then per week: range · **week total** (= the からだ week card and the week detail).
  - Rows: spends (avatar, label, pot, time, なかったことに); the bonus; every day with a total and **per person the
    per-fruit ベル chips** (= the day detail's 「この日のベル」 row, for every day back to 8/31).

### 1.10 あそびかた, 同期, 村人, 言語, サウンド
- **あそびかた:** five cards of rules (earn rates, badge thresholds, the pot split, island taps). This is reference
  text, so repeating rule values is fine here.
- **同期:** per person, avatar + name + last sync time (15:24) · いま同期. The partner's sync time is also on the
  partner sheet.
- **村人 / 言語 / サウンド:** settings, with no data overlap.

---

## 2. Duplication matrix

Columns: **島** (ribbon / plate / scene) · **木** tree popup · **相** partner sheet · **チ** check-in · **壺** ふたりの壺 ·
**収** harvest · **か** きろく からだ list · **週** week detail · **日** day detail · **ベ** きろく ベル ledger · **同** 同期
app · **他** other.
● = shown · ●● = shown twice on that screen · ○ = shown in an aria-label only.

| Data point | 島 | 木 | 相 | チ | 壺 | 収 | か | 週 | 日 | ベ | 同 | 他 | Count |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Today's ベル, both | ● ribbon | | | | **●●** hero + recent | | | | | ● today's row | | | **4 (2 on 壺)** |
| Today's ベル, one person | ○ villager label | | ● partner | | | | | | ● 「この日のベル」 | ● | | | 3 |
| Today per fruit: amount/goal | ● ground fruit (thirds) | ● | **●●** ring + caption | | | | | | ● raw rows | | | | 4 |
| Today per fruit: ベル | | ● | | | | | | | ● | ● chips | | | 3 |
| Week ベル, both | | | | | ● hero | ● 今週ぜんぶで | ● card | ● header | | ● section | | | **5** |
| Week ベル, per person | | | | | | | ● card | **●●** card + 内訳 | | | | | 3 (2 on 週) |
| Pot balances (treat, trip) | | | | | ● | ● end card | | | | ● top card | | ● buy confirm (before → after) | **3 + confirm** |
| Pots total | ● plate | | | | ✗ (missing) | | | | | | | | 1 |
| Per-pot today / week flow | | | | | ● ×2 pots | ● end +350 / +1,400 | | | | | | | 2 |
| Lifetime earned | | | | | | | | | | ● | | | 1 |
| Weekly badge met (lit fruit) | | | | | | ● | | ● | | | | | 2 |
| Weekly badge **progress** (3/5 days) | ○ tree label | ○ | ● partner, 1 fruit at a time | | | | | | | | | | **0 for me** |
| Day stamps ★ / ● / ○ | | | | | | | ● | ● ★ column | | | | | 2 (two vocabularies) |
| Harvest bonus (per person, duo, total) | | | | | | **●●** tally + end | | | | ● bonus row | | | 2 (2 on 収) |
| Habit ticks today | ● button count | ● 🍐 0/3 | ● partner | ● mine | | | | ● dots | ● chips | | | | 5 (different jobs) |
| Last sync | ● chip when offline | | ● partner | | | | | | | | ● | | 3 |
| Edit window (あと4日) | | | | | | | 🔒 | ● | ● | | | | 2 |
| Weight trend / week change | | | | | | | ● | | | | | ● weight detail ●● (今週 + pace) | 2 |
| Menus and prices | | | | | ● | | | | | | | ● buy confirm | 2 |
| Rule values (45分, 8,000歩, +500) | | ● goal denominator | ● | | | | | | | | | ● あそびかた | OK (reference) |

### 2.1 The top duplication problems (ranked)
1. **ふたりの壺 is three screens stacked:** today's flow (J1, J2), the pots (J3–J8) and history (J9).
   - It repeats today's ベル twice on one screen (J1 and J9).
   - It repeats the week total from きろく and splits both again per pot (J4, J7), so 9 numbers come before one buy
     button.
   - The pot screen should be about the **pots**.
2. **Two parallel histories in きろく.**
   - The からだ week cards and the ベル ledger both list every week with its ベル total.
   - The ledger then prints each day's per-fruit chips, which is the day detail again.
   - The からだ ("body") tab leads with ベル figures, and the ベル tab leads with the pot balances (a third copy).
3. **Partner sheet = the partner's tree popup.** Same four amounts against the same goals, and the sheet repeats its
   own picked ring in a caption.
4. **Week detail says each person's ベル twice** (people card + 内訳), under a header that already gives the total.
5. **The harvest says +1,750 twice** and adds the week total (10,555), which is a history number.
6. **The total you tap on the island (64,520) isn't on the screen it opens.** This is inconsistency rather than
   duplication, but it's the same root cause: no rule for which number lives where.
7. **Missing datum:** my weekly badge progress, the driver of the +500s, has no visible home at all.

---

## 3. Information architecture proposal: one home per datum

### 3.1 The map

| Datum | **Home** (the one full display) | Allowed glance elsewhere (and why) |
|---|---|---|
| Today's ベル, both | **島 ribbon** | none. (The ledger's today row is history, which is a different job: it updates as the day closes) |
| Today's ベル per person + per fruit (amount/goal and ベル) | **Tree popup**, one per person (mine left, partner right) | none |
| My / partner's **weekly badge progress** | **Tree popup**, a second line of pips per fruit (●●●○○ = 3/5 days) | the ground fruit: the pile *is* the week (see §3.3); lit = badge met |
| Badges met for a finished week | **きろく week detail** | harvest tally (the ceremony moment) |
| Pots total | **ふたりの壺 hero** (the jar + one number) | 島 plate: a doorway label, and the morph target of the jar transition |
| Each pot's balance | **ふたりの壺 pot card** | buy confirm 「before → after」 (needed to decide); harvest end card (the item-get beat, transient) |
| Menus, prices, "あと N" | **ふたりの壺** | none |
| Spends, bonuses, every day's ベル (one line per day) | **きろく ベル** | none. (Undo after 5 s happens here) |
| A day's ベル per fruit + its raw data + edits | **きろく day detail** | none |
| Week's activity table (steps, minutes, ★, meals) | **きろく week detail** | none |
| Week's ベル total | **きろく ベル** week header | week detail header (the drill-down title, one number) |
| Weight trend, week change, goal | **きろく からだ** weight card → weight detail | none. (Never on the island, per ADR 0020) |
| Habit ticks: mine today | **今夜のチェック** | 島 action label 「あと2つ」 (it *is* the button, not a restatement) |
| Habit ticks: partner today | **Partner sheet** | none |
| Last sync | **同期 app** | partner sheet, one small line: it explains "why are their numbers low?" right where you'd ask |
| Sync failure | **sync chip** (state, not data) | — |
| Lifetime earned | **きろく ベル** header | none |
| Rules and values | **あそびかた** | the goal denominators in the tree popup |

### 3.2 Screen hierarchy (one primary, then secondary, then behind a tap)

| Screen | Primary | Secondary | Behind a tap |
|---|---|---|---|
| 島 | today's ベル (ribbon) | the jar plate (total); the trees' fruit piles (the week at a glance) | tree → today + week per fruit; jar → pots; me → check-in; partner → partner sheet; ribbon → ベル ledger |
| Tree popup | the four fruits today (amount/goal) | ベル per fruit; week pips | — |
| Partner sheet | ハイタッチ | name, today's meal ticks, 「15:24 にとどいた」 | their tree for numbers |
| 今夜のチェック | the three toggles + ぜんぶできた！ | which day (one control) | — |
| ふたりの壺 | the two balances | buy tiles / trip bars | ✎ menu (quiet), confirm sheet |
| 収穫 | this week's bonus (one big number) | per person badges + bonus; ふたりボーナス | end card: the two pots counting up |
| きろく ベル | the list of weeks | lifetime header | day → day detail; spend → とりけす |
| きろく からだ | the weight trend | weeks of badges | week → table → day |

### 3.3 Game-design notes (NH / Pocket Camp)
- **Make the ground fruit the week, as design.md already says.** In NH, fruit grows over days, not minutes.
  - Today the pile shows today's thirds, so it empties at midnight and repeats what the popup says.
  - Proposal: the pile shows *the week's badge progress*, in thirds of `weekGoalDays`. The badge being met makes that
    kind **ripe** (full colour + sparkle, the existing ripeness stages). A single new earning still shakes the tree.
  - Then the island carries both the day (ribbon) and the week (fruit) without a word, and the Sunday harvest
    literally harvests that fruit.
  - Change `fruitCount(todayPct(...))` to the week's ratio in `FruitTree.svelte:57`.
- **NookPhone apps each do one job.** きろく is NH's Nook Miles+ / Passport hybrid, so its tabs should split by *kind of
  record*:
  - からだ = what our bodies did (weight, activity, badges);
  - ベル = where the ベル came from and went (the passbook, like NH's ATM statement).
- **Partner sheet = talking to a villager**: a social beat (their face, a line, ハイタッチ), not a stats panel. The
  stats are on their tree, like inspecting a neighbour's tree in NH.
- **ふたりの壺 = Nook's Cranny / ABD**: balance, items, buy. Nook's Cranny doesn't show your daily income.

### 3.4 Kid-friendly principles applied
- **Icons plus a few words.** Every fruit keeps its art plus one short word. At 320 the tree popup should keep a
  2-character word (うんどう is too long; use 運動 / 歩数 / 筋トレ / ごはん) instead of dropping it.
- **Big readable numbers, one per card.**
  - ふたりの壺 pot cards: one balance each.
  - Week detail: one number in the header.
  - Harvest: one big bonus.
- **One word per concept**, in ja and en (§5).
- **Predictable navigation.**
  - Every drill-down uses the phone's ‹, and ふたりの壺 uses ◀ 島へ.
  - The ribbon should land on its own number: after the change, the top row of the ベル ledger is today.
- **No jargon:** 同期, 内訳, なかったことに, Void, しめきり済み, 筋力トレーニング (§5).
- **Progressive disclosure:**
  - per-fruit detail behind the tree;
  - raw numbers behind week → day;
  - menu editing behind a quiet ✎.
- **Fewer, larger controls.** The two へんしゅう buttons are as loud as the buy tiles. Make them a small ✎ in the card
  header (as at 320), or move them to the bottom of each card.

---

## 4. Per-screen recommendations

### 4.1 島 Island: keep
- **Keep:** the ribbon, the plate, one action, しずえ only with news.
- **Change:**
  - The ground fruit shows the week (§3.3).
  - Give the plate its pot glyph or 「つぼ」 so the two numbers aren't read as the same kind of thing. Optional: a
    tiny jar icon, no words.
- **Remove:** nothing.

### 4.2 Tree popup
- **Add:** a pip row per fruit for the week (●●●○○); a lit badge shows as ✓.
- **Change:** print 「—」 instead of 「0 ベル」; keep a short word at 320.
- **Remove:** nothing.

```
BEFORE                                   AFTER
┌──────────────────────────────────┐     ┌──────────────────────────────────┐
│🍑 活動     3/45分     +15 ベル   │     │🍑 運動   3/45分   +15   ●○○○○ │
│🥥 筋トレ     0/1       0 ベル    │     │🥥 筋トレ  0/1      —    ●●○   │
│🍎 歩数 4,647/8,000歩   0 ベル    │     │🍎 歩数 4,647/8,000 —    ●●○○  │
│🍐 食事       0/3       0 ベル    │     │🍐 ごはん  0/3      —    9/15  │
└──────────────────────────────────┘     │          きょう   ベル   こんしゅう │
                                         └──────────────────────────────────┘
```
(🍐's weekly goal is 15 ticks: show 「9/15」 or 15 tiny pips in 3 rows of 5. Column heads are a single faint line.)

### 4.3 Partner sheet: from stats panel to villager card
- **Remove:** the four rings, their amounts, the caption, and 「きょう +125 ベル」 (all live in their tree popup).
- **Keep:** avatar, name, their meal ticks today, ハイタッチ.
- **Rename:** 「15:24 同期」 → 「15:24 にとどいた」 / "Updated 15:24".
- **Add:** a one-line villager greeting from their state (e.g. 「きょうは 歩いたよ！」 when 🍎 is met). This is an NH
  beat; it is optional, and it must replace a number, not add one.

```
BEFORE                          AFTER
┌───────────────────────────┐   ┌───────────────────────────┐
│ (av) うめ                  │   │ (av) うめ                  │
│      きょう +125 ベル      │   │      15:24 にとどいた       │
│      15:24 同期            │   │                           │
│ (🍑)(🥥)(🍎)(🍐)           │   │ きょうの ごはん             │
│ 25/45分 0/1 3,898/8,000 0/3│   │  ✓ 毎食たんぱく質           │
│ 活動 きょう25/45分·今週0/5日│   │  ○ 間食は計画どおり          │
│ ✓ 毎食たんぱく質            │   │  ○ 野菜 2食                │
│ ✓ 間食は計画どおり          │   │                           │
│ ✓ 野菜 2食                 │   │ [   🙌  ハイタッチ    ]     │
│ [     ハイタッチ      ]     │   └───────────────────────────┘
└───────────────────────────┘
```
*Alternative, if the couple prefers the stats here:* keep the rings and make tapping the partner's **tree** open this
sheet (so there is one partner stats view). Do not keep both.

### 4.4 今夜のチェック
- **Rename:** title → 「ごはんチェック」 / "Meal check". It only holds the three eating habits, and "tonight" is
  wrong at lunch. The island button becomes 「ごはんチェック」 / 「ごはんチェック · あと2つ」 / 「✓ チェックずみ」.
- **Merge:** the date line into the switch: 「きのう 10/29 | きょう 10/30」. Remove the separate 「10月30日(金)」.
- **Rename:** footer 「保存」 → 「とじる」 / "Done" (each tap already saved).

### 4.5 ふたりの壺: the biggest change
- **Hero:** jar + **the pots total** (64,520 ベル: the number on the island plate, the morph target). Remove
  「ふたりの きょう」 and 「今週」.
- **Pot cards:** name + balance + content. Remove each card's 「きょう / 今週」 line.
- **Trips:** when the 「行く！」 button shows, drop 「行けます！」 (the button says it).
- **Remove:** the 「さいきんのベル」 card. History lives in きろく ベル, and the undo banner covers a mistake right
  after a buy.
- **✎ menu:** a small icon button in the card header at every width (it already is at 320), with
  `aria-label` 「おやつメニューをかえる」.

```
BEFORE (390, first screen)                 AFTER
┌─────────────────────────────────┐        ┌─────────────────────────────────┐
│ [◀ 島へ]                   [📱] │        │ [◀ 島へ]                   [📱] │
│  (jar)  ふたりの きょう          │        │        (jar)                    │
│         +440 ベル               │        │      64,820 ベル                │
│         今週 +5,090 ベル         │        │                                 │
│┌───────────────────────────────┐│        │┌───────────────────────────────┐│
││🛒 おやつの壺      [✎ へんしゅう]││        ││🛒 おやつのつぼ             [✎]││
││💰 7,364 ベル                   ││        ││   7,364 ベル                   ││
││きょう +88 ベル 今週 +1,018 ベル ││        ││ [おやつ 800] [アイス 1,000]     ││
││[おやつ 1,500] [アイス 2,000]   ││        ││ [カフェ 2,000][パフェ 2,000]    ││
││[カフェ 2,000] [パフェ 2,500]   ││        ││ [外ごはん 5,000]               ││
││[デザート 3,000][外ごはん 5,000]││        │└───────────────────────────────┘│
│└───────────────────────────────┘│        │┌───────────────────────────────┐│
│┌───────────────────────────────┐│        ││🎫 旅のつぼ                 [✎]││
││🎫 旅の壺          [✎ へんしゅう]││        ││   57,456 ベル                  ││
││💰 57,456 ベル                  ││        ││ ⛰ 日帰り   10,000     [行く！] ││
││きょう +352 ベル 今週 +4,072 ベル││        ││ 🧳 週末旅行 28,000     [行く！] ││
││⛰ 日帰り 10,000 行けます！[行く！]│       ││ ♨ 温泉     36,000     [行く！] ││
││ …                             ││        ││ ✈ 海外旅行 130,000 ▓▓▓░░ あと72,544││
│└───────────────────────────────┘│        │└───────────────────────────────┘│
│ さいきんのベル ›                 │        └─────────────────────────────────┘
│  10月30日(金)のベル  +440        │
│  10月29日(木)のベル +1,320       │
└─────────────────────────────────┘
```
That's 9 money figures before the first tile → 2. The demo menu prices are still stale (round 16 #9): fix them in the
same pass.

### 4.6 日曜の収穫
- **Tally:**
  - Label the fruit row 「バッジ」 once (the word in あそびかた and in the duo hint has to point at something).
  - Remove 「今週ぜんぶで 10,555 ベル」.
  - Shorten the duo line to 「ふたりでそろえたバッジ 1つ +250」 (no wrap).
- **End card:**
  - Drop the repeated 「+1,750 ベル」 headline; keep 「ふたりのつぼに入りました！」.
  - Show each pot as name + its balance counting up, with a 「+350」 pop that fades (the item-get beat), so there is
    one resting number per pot.

### 4.7 きろく: split by kind of record, one line per day
**ベル tab (the passbook):**
- Header: 「これまでに ためた ベル 86,820」. Remove the two pot balances (they live in ふたりの壺).
- Per week: range + total (**the** home of the week total).
- Rows: one line per day, 「10/30(金)  ウェイ 315 · うめ 125  +440」 (tap → day detail); the bonus row (with its
  per-person breakdown); spends with 「とりけす」.
- Remove the per-fruit chips (they live in day detail).

**からだ tab (what we did):**
- Weight card unchanged.
- Week cards: range + 🔒, then per person the avatar + **the four badge fruits** (lit = met; in the current week a
  small n/goal under each).
- Remove the ベル figures and the ★/●/○ stamps: their ● rule (20 min) matches no goal, and they are a second icon
  language for the same idea.

**Week detail:**
- Header: range + one ベル total.
- People card: badges **with progress** (🍑 3/5 · 🍎 2/4 · 🥥 1/3 · 🍐 9/15). Remove the per-person ベル.
- Table unchanged.
- Remove 「内訳」 (duplicate). Put ふたりボーナス as a line in the people card when it's > 0.
- Move 「あと4日 なおせます」 to the day detail only (where the ✎ are); the week header keeps 🔒 when locked.

```
WEEK DETAIL BEFORE                        AFTER
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│今週 10/26–11/1        5,090 ベル │      │こんしゅう 10/26–11/1  5,090 ベル │
│✎ あと4日 修正できます              │      │┌──────────────┬───────────────┐│
│┌──────────────┬───────────────┐ │      ││(av) ウェイ    │(av) うめ       ││
││(av) ウェイ    │(av) うめ       │ │      ││🍑3/5 🍎0/4    │🍑1/5 🍎0/4     ││
││2,705 ベル     │2,385 ベル      │ │      ││🥥2/3 🍐9/15   │🥥1/3 🍐11/15   ││
││(○)(○)(○)(○)  │(○)(○)(○)(○)   │ │      │└──────────────┴───────────────┘│
│└──────────────┴───────────────┘ │      │[ 7-day table, unchanged ]        │
│[ 7-day table ]                   │      │へんこう履歴                       │
│内訳 ウェイ 2,705 ベル うめ 2,385 ベル│      └──────────────────────────────────┘
│へんこう履歴                       │
└──────────────────────────────────┘
```
(The badge numbers here are illustrative; they come from `fruits[f].weekDays/weekGoalDays`, which
`weekDetail()` would need to return per person.)

**Weight detail:**
- Rename the pace line to 「4週間の平均: 1週間に −0.3 kg」 (or drop it when it equals the 今週 box), so it doesn't
  read like the 今週 box.
- Say 目標 once: the legend and a single line 「12月ごろ 66.0 kg に届きそう」.

**Day detail:**
- Show 「筋トレ」 rather than the long Health type name 「筋力トレーニング」 as the row label (keep the type in
  small text).

### 4.8 しまフォン apps
- **同期:** rename to 「つうしん」 / "Updates" (the code comment already calls it 通信); the times become
  「15:24 にとどいた」.
- **あそびかた:** fine as reference. Shorten 「help.pots.use」 to two short sentences. Point the 「島でできること」
  tree line at the new week pips.

---

## 5. Copy and terminology

### 5.1 One word per concept

| Concept | Now (ja) | Now (en) | **Use (ja)** | **Use (en)** |
|---|---|---|---|---|
| today / yesterday | きょう (ribbon, pots) · 今日 / 昨日 (check-in) | Today / Yesterday | **きょう / きのう** | Today / Yesterday |
| this week | 今週 | This week | 今週 (fine; a grade-2 kanji) | This week |
| the pots | 壺 (ふたりの壺, おやつの壺, 壺の残り) | jar (island help) · pot · "Our pots" | **つぼ** in hiragana (壺 isn't 常用; a 10-year-old can't read it) | **pot** everywhere ("Tap the pot on the island", "The pot → our pots") |
| play money | ベル · 「お金」 in design.md's きろく tab | Bells | ベル | Bells |
| 🍑 minutes | 活動 (fruit, help) · 運動 (きろく) | Active · Exercise | **運動** | **Exercise** |
| 🍐 habits | 食事 · 食事チェック · 今夜のチェック | Meals · Eating check-ins · Tonight's check-in · Tonight's check | **ごはん** · **ごはんチェック** | **Meals** · **Meal check** |
| weekly badge | バッジ (text) · unlabelled fruits | badge | バッジ, and label the fruit rows with it | badge |
| bonus | 日曜のボーナス · 今週のボーナス | Sunday bonus · This week's bonus | **日曜ボーナス** (the money) · **収穫** (the event) | **Sunday bonus** · **harvest** |
| duo bonus | ふたりボーナス | Duo bonus | ふたりボーナス | **Together bonus** |
| fix a record | 修正 · 直せます · 修正あり | fix · fixed · Edited · Change log | **なおす** (なおせます · なおした) | **Fix** (fixed · Fix log) |
| edit a menu | へんしゅう | Edit | **メニューをかえる** (✎) | **Change menu** (✎) |
| undo a spend | もとに戻す (banner) · なかったことに (ledger) · 取り消し済み | Undo · Void · Voided | **とりけす** · とりけしずみ | **Undo** · Undone |
| locked week | しめきり済み · 🔒 | Closed | **しめきり** (+🔒) | **Locked** |
| last sync | 同期 · 15:24 同期 | Sync · Synced 15:24 | **つうしん** · 15:24 に とどいた | **Updates** · Updated 15:24 |
| split | 内訳 | Split | (remove) | (remove) |
| trend | ながれ · いまのながれ | trend · Trend now | ながれ | trend |
| go on a trip | 行けます！ · 行く！ (tile) · 行く！ (confirm) | You can go! · Go! · Let's go! | **行く！** (button, both places) | **Let's go!** (button, both places) |

### 5.2 Inconsistent or awkward strings
- **`island.checkinLeft`:** en "Tonight's check · {n} left" doesn't match "Tonight's check-in". With §5.1 both become
  "Meal check · {n} left".
- **`pots.todayBoth`:** 「ふたりの きょう」 / "Today, both of you". It goes away with §4.5.
- **`kiroku.harvested`:** "Harvested✓" lacks a space (and so does 「収穫✓」).
- **`kiroku.voidAsk`:** en "Undo {label} ({bells})?", but its button is "Void it". Use "Undo" for both.
- **`harvest.done`:** en "went into your pots!" is a sentence fragment that leans on the number above. After §4.6:
  "Into your pots!"
- **`host.grew`:** ja 「{activity}の{fruit}が育ちましたよ！」 (「食事の洋なしが…」) reads oddly. Use
  「洋なしが 育ちましたよ！」, the fruit alone (en already does this).
- **`pending.ask`:** en "Count {label} as strength?" vs ja 「{label}は筋トレでしたか？」: fine, keep.
- **`fruit.*.detail`:** 「活動 きょう 25/45分 · 今週 0/5日」 crams two measures. With §4.3 it is only an aria-label.
- **design.md drift:**
  - §1.1 still draws the corner clock and §R mentions 「今週」 on the ribbon (the user removed the clock; the ribbon
    has no 今週).
  - §1.3 says 使い方 (the tile says あそびかた) and 79 villagers (the roster has 158).
  - §1.1 / §1.3 call the きろく tab お金 (it says ベル).
  - §S.3 says the ground fruit is the week's (the code draws today's).

### 5.3 Over-long labels (≥ 2 lines at 390, or a wrap at 320)
- `help.pots.use` (3 lines): 「つぼをタップ → 「買う！」。まちがえたら「とりけす」。」
- `weight.note` (2 lines): 「ベルとは関係なし。毎日の上下より ながれを見よう」
- `weight.projected`: 「12月ごろ 届きそう」 (the goal kg is already on the chart)
- `harvest.duoGot` (breaks inside 「ぶん」): 「ふたりでそろえたバッジ +250」
- `habit.no_sweets.hint` (2 lines at 390): 「おやつは つぼで買ったときだけ」
- `kiroku.addNote` (2 lines): 「運動の分にも入ります」
- `sound.silentNote` (4 lines): two sentences
- the 「デザート・パフェ」 tile wraps at 320: rename the menu item 「パフェ」 (the demo already has one) or let the tile
  wrap at the ・

### 5.4 Wording a 10-year-old understands (samples)
| Where | Now | Proposed |
|---|---|---|
| Island action | 今夜のチェック | ごはんチェック |
| Done state | チェック済み | チェックずみ ✓ |
| Partner sync | 15:24 同期 | 15:24 に とどいた |
| Edit window | あと4日 修正できます | あと4日 なおせます |
| Locked | この週はしめきり済み。見るだけです | この週は しめきり。見るだけだよ |
| Undo a buy | なかったことに / なかったことにする | とりけす |
| Short of ベル | ベルが足りませんでした | ベルが たりないよ |
| Pot left after buy | 壺の残り | のこり |
| Ledger header | これまでにふたりで 86,820 ベル | これまでに ためた ベル 86,820 |
| Week table head | 運動 | 運動 (unchanged; now the same word as the fruit) |

---

## 6. Prioritised change list

Impact: H/M/L for clarity to the couple (and a young reader). Effort: S (≤ 1 h), M (half a day), L (a day or more).

| Rank | Change | Impact | Effort | Files |
|---|---|---|---|---|
| 1 | ふたりの壺: remove the hero's today/week, each pot's today/week line and the 「さいきんのベル」 card; hero = pots total | H | S | `routes/jar/+page.svelte`, `components/pots/PotCard.svelte`, delete `components/pots/recent.ts` (+ its use), `i18n/{ja,en}.json` (`pots.todayBoth`, `pots.today`, `pots.week`, `kiroku.recent`, `pots.recent.*`) |
| 2 | Week detail: remove 「内訳」; people card shows badges with n/goal instead of ベル | H | M | `components/kiroku/WeekDetail.svelte`, `model/history.ts` (`weekDetail`: per-person `weekDays/weekGoalDays`) |
| 3 | きろく ベル: remove the pot balances card; one line per day (drop per-fruit chips) | H | S | `components/kiroku/BellsLog.svelte` |
| 4 | Partner sheet: villager card (remove rings, caption and today's ベル; 「15:24 にとどいた」) | H | S | `components/sheets/PartnerSheet.svelte`, `i18n` (`partner.synced`, `partner.todayBells`) |
| 5 | Tree popup: add week pips; 「—」 for 0; keep a short word at 320 | H | M | `components/island/FruitTree.svelte`, `components/island/progress.ts` |
| 6 | Terminology pass (§5.1): きょう/きのう, つぼ / pot, 運動 / Exercise, ごはんチェック / Meal check, なおす / Fix, とりけす / Undo, しめきり / Locked, つうしん / Updates | H | M | `i18n/ja.json`, `i18n/en.json`, `e2e/*.spec.ts` (text selectors), `components/phone/ShimaPhone.svelte` (tile label length) |
| 7 | からだ week cards: four badge fruits per person instead of ベル + ★/●/○ stamps | M | M | `components/kiroku/WeekList.svelte`, `model/history.ts` (`historyWeeks`: badges / progress per person; drop `stampsFor`) |
| 8 | Ground fruit = the week's badge progress, ripe = badge met (design.md §S.3 as written) | M | M | `components/island/FruitTree.svelte:57`, `components/island/scene.ts` (`fruitCount`), `components/sheets/ripeness.ts`, `components/motion/*` diff events (R6/R7 fire on week thirds) |
| 9 | Harvest: label 「バッジ」, remove 「今週ぜんぶで」, end card without the repeated +1,750 | M | S | `components/sheets/HarvestOverlay.svelte`, `i18n` (`harvest.weekTotal`, `harvest.duoGot`) |
| 10 | Check-in: rename, merge the date into the switch, 保存 → とじる | M | S | `components/sheets/CheckinSheet.svelte`, `routes/+page.svelte` (button labels), `i18n` |
| 11 | ふたりの壺: drop 「行けます！」 beside 行く！; quiet ✎ in the card header | M | S | `components/pots/TripList.svelte`, `components/pots/PotCard.svelte` |
| 12 | Weight detail: rename the pace line, 目標 once | L | S | `components/kiroku/WeightDetail.svelte`, `i18n` (`weight.pace`, `weight.projected`) |
| 13 | Edit window only on day detail | L | S | `components/kiroku/WeekDetail.svelte` |
| 14 | Over-long strings (§5.3); demo menu prices (round 16 #9) | L | S | `i18n/*`, `store/demo/rows.ts` |
| 15 | design.md refresh: §0 focal points, §1.1 clock, §1.2 pots, §1.3 tiles, §S.3 fruit, a "one home per datum" table | M | S | `docs/design/design.md` |

### Batches
- **Batch A: remove the repeats** (ranks 1, 3, 4, 9, 10, 11, 13). All S, all deletions or relabels.
  - Files: `routes/jar/+page.svelte`, `pots/PotCard.svelte`, `pots/TripList.svelte`, `pots/recent.ts`,
    `kiroku/BellsLog.svelte`, `kiroku/WeekDetail.svelte` (内訳, edit note), `sheets/PartnerSheet.svelte`,
    `sheets/HarvestOverlay.svelte`, `sheets/CheckinSheet.svelte`, `routes/+page.svelte`.
  - Update the e2e selectors that click 保存 or read the removed texts (`e2e/demo.spec.ts`).
  - Expected: ふたりの壺 drops from 9 money figures to 2; no screen repeats a number.
- **Batch B: give each datum its home** (ranks 2, 5, 7, 12 + the §5 terminology pass, rank 6).
  - Needs small model additions: `weekDetail()` / `historyWeeks()` return per-person badge progress.
  - The tree popup gains week pips; きろく からだ speaks in badges; ja/en use one word per concept. Ship the copy pass
    in one commit so ja and en change together.
- **Batch C: the game-design move and the docs** (ranks 8, 14, 15).
  - Ground fruit = the week (with the reaction diffs re-pointed).
  - String trims, the demo menu, and design.md rewritten around the one-home table, so later rounds don't re-add
    glances.

---

## Appendix: screenshot index (`/tmp/r17-ia/shots/`, `<w>-day-<lang>-<step>.png`)
01 island + question · 02 island · 04 / 05 tree popups · 06 partner sheet · 09–14 check-in · 16 after check-in · 17 / 18
ribbon → ベル ledger · 20 phone · 21 / 22 きろく からだ · 23 / 24 weight detail · 28 / 29 ベル tab · 30 / 31 week detail ·
32 / 33 day detail · 40 / 41 あそびかた · 46 同期 · 50–52 ふたりの壺 · 53 buy confirm · 56 menu editor · 59 trips · 70 / 72
harvest tally / end.
