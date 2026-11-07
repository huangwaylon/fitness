# ききみみ UX: the hub, the menu, progression (design 2026-11-06, built 2026-11-07)

> **The user's decisions (2026-11-06):** approved for building. **No かいがら:** English practice pays nothing in the island economy; the rewards are the stamps, the ずかん, friendship, letters and landmarks. The weekly target defaults to **3 days**. A stage's reward comes **only when it's cleared unit by unit**, never by the placement.

The lead product designer's synthesis of the UI/UX round on the English-listening feature: the brief (the user: "overhaul the menu and UI design… make it intuitive and reorganize features", "take inspiration from Duolingo and other language-learning game apps"), the IA and wireframes, the game team's study of Duolingo and the island's loops, and the copy review (a UX writer with the ウェイ / うめ panel). It builds on docs/kikimimi.md (the game as built), docs/curriculum.md §3, §7, §11, §14 and docs/kikimimi-framework.md §5, §7. Settled choices are in docs/decisions.md. The mic's modes and their shelf are docs/kikimimi-mic.md's.

**Copy.** The wireframes keep the design's spaced kana. Since 2026-11-07 the sheet's strings are kanji Japanese and only the world and the HUD pill stay spaced kana (docs/decisions.md "Copy: spaced kana in the world, kanji in the sheets"); i18n/kikimimi.ja.json is the source of truth.

**Built** (each step's detail is in its section; screenshots under /tmp/kikimimi-shots/{ux,story,taikai,check,path,zukan}/):
- **U0 (2026-11-06), the naming** of §3 in the strings.
- **U1 (2026-11-06), the hub and the one stack** (§5, §6.1-§6.5): `components/kikimimi/nav.ts`, `kikimimi/catalog.ts`, `hub/Hub.svelte`, `asobu/Asobu.svelte`, `mode/ModeDetail.svelte`, the lobby as みんなで. e2e kikimimi-hub, every spec through the hub (`e2e/kikimimi-nav.ts`).
- **U2 (2026-11-06), the daily menu** (§7.1): `kikimimi/today.ts`. The recommendations left きろく (advice.ts still words the results' 「つぎは…」).
- **U4 (2026-11-06), the week and せってい** (§6.11, §7.3, §7.4): `kikimimi/week.ts`, `hub/WeekCard.svelte`, `settings/KikiSettings.svelte`.
- **G-おやすみ (2026-11-07), おやすみ ものがたり** (§6.8): `kikimimi/bedtime.ts`, `story/`.
- **U5 (2026-11-07), the full ずかん** (§6.10, §7.7).
- **G-たいかい (2026-11-07), しずえの しゅうまつ たいかい** (§6.4; the logic: kikimimi-framework.md "G-たいかい logic as built").
- **U6 (2026-11-07), the first run and みみ チェック** (§6.12, §4's おまかせ).
- **U7 (2026-11-07), しまの みち's polish, letters and landmarks** (§6.3, §7.5).

**Not built:** U3 (かいがら, dropped by the user's decision), the couple quest's 30 / 90 setting (needs the relay), the ずかん tile's count of new entries and the partner's 「ふたりとも しってる」 line, きろく's skill pages and recent games (§6.9), the hours-heard meter and K.K. songs, villager gifts and the tent's trophy and landmark items (wait for a present path for English), and the modes in §6.2's last table.

---

## 1. Decisions and the conflicts they settle

| Question | IA (UX) | Game team | Copy team | **Decision** |
|---|---|---|---|---|
| The feature's name | 「ききみみ」 | — | 「ききみみ」; the old quiz becomes a mode | **「ききみみ」** everywhere (the pill, the sheet, the invite). The HUD pill reads 「ききみみ」 with a small 「えいご」 sub-label. The old quiz is the mode **「ひとこと クイズ」** |
| Home structure | hub + push/pop stack, no tab bar | 4 bottom tabs: きょう · みち · ずかん · きろく | 4 tabs: きょう · あそぶ · ずかん · きろく | **Hub + one push/pop stack.** The root is きょう. Under the menu, **four entry tiles**: あそぶ · みんなで · ずかん · きろく. No tab bar (§2) |
| Where the path lives | — | its own tab, みち | — | **「しまの みち」 is pushed** from the top of あそぶ and from the menu's きょうの いっぽ card. It's where lessons come from, not a fifth destination |
| The stage ladder | open | §3 names | §3 names, label 「ばしょ」 | **はまべ → かわ → もり → やま → ほし**, labelled 「ばしょ」 (§4) |
| Mode grouping | 3 shelves by length/kind | ささっと / じっくり / ゆったり | 5 groups by situation | **4 groups by situation**: さくっと · まちで・でんわで · じっくり · ねる まえに (the mic's 声に出す shelf came later). Co-op-only modes sit in the みんなで picker, the tournament on the hub |
| Shelves | horizontal 96×112 tiles | — | — | **A 2-column grid per group, scrolling vertically.** At 393 px, horizontal shelves hide two thirds of each group and are hard to scan with VoiceOver |
| おさらい | the today card only | menu card 1 | in さくっと | **Both**: menu card 1 every day, and a tile in さくっと. Nobody should hunt for review |
| アナウンス | a pack inside the quiz | — | a mode | **A mode** (`lv` 5 is this mode, not a stage) |
| よみきき サンド | an action on review rows | — | a reveal button | **A button on review rows**: 「読んでから もう一度」 (frame/SandButton; curriculum-wave2.md §2.0) |
| Daily rhythm | one today card | 3 menu cards | one soft goal | **3 menu cards** (§7.1). Any one card means 「きょうは OK」 |
| Rewards | stamps, ずかん | かいがら, capped | stamps, no XP | **Stamps, ずかん, friendship, letters, landmarks; no かいがら** (the user, §7.2) |
| Streak | none | weekly days | a stamp card | **A weekly stamp card.** No streak, ever |
| たいせん | shown only when `modes.vs` | opt-in | 「きょうりょく ／ しょうぶ」 | **A two-way switch 「きょうりょく ／ しょうぶ」, defaulting to きょうりょく**, shown only for games that support しょうぶ |
| 「おなじへや」 | settings default + lobby | — | 「おとを 1だいに まとめる」 | **「おとを 1だいに まとめる」**, sub-label 「おなじ へやで ハモらない ように」; a lobby toggle with its default in せってい |
| しずえ's voice | — | — | polite | **です／ます** (「おみごとです！」, 「おつかれさまでした！」). Casual cheers belong to the villagers |
| Kanji | — | — | rule set | Was: kana with spaces in the chrome, kanji-kana in translations and notes. **Superseded 2026-11-07:** the sheet is kanji Japanese throughout (the Copy note above) |

**Ruled out:** hearts or lives, XP, leagues, rankings outside しょうぶ, streak counters or freezes, missed-day counts, push notifications and nagging copy (「さみしかった」), payouts per correct answer.

## 2. Why hub tiles, not a tab bar

The sheet is a full-height bottom sheet (`Sheet` variant `pop`), 393 px wide, about 780 px of usable height on an iPhone 15/16.

1. **The foot is already taken.** Mode detail, the lobby, the game frame and results each need a sticky action row (はじめる, つぎへ, おわる / もういっかい). A tab bar would stack under it (about 140 px of chrome out of 780) or vanish on push, and a bar that comes and goes reads as broken.
2. **The use isn't balanced.** Most opens are "do today's thing" (one green button). ずかん and きろく are weekly visits. Tabs promise four equal places and spend permanent chrome on the rare ones.
3. **One back model.** Tabs with a push stack mean one stack per tab, and ‹ becomes ambiguous. The app's sheets already use one stack (SettingsSheet `stack`), and the invite deep link is simple with one.
4. **Reach and size.** The four tiles sit mid-sheet, in the thumb's arc, each with art, a name and a live line, so they say more than a tab label could.
5. **The cost is small.** Every place is one tap from the root; ✕ / おわる always lands on the hub.

## 3. Naming: old → new

| Before | New | Note |
|---|---|---|
| pill 「えいご ききとり」 | 「ききみみ」 with the sub-label 「えいご」 | while an invite waits, the sub-label is 「さそわれています！」 |
| sheet title 「ききみみ クイズ」 | 「ききみみ」 at the root; the page's name on pushes; the mode's name in a game | |
| 「ききとりクイズに さそっています」 | 「{name}が ききみみに さそっています」 + the mode on the second line | |
| ききみみ クイズ (the game) | **ひとこと クイズ** | subtitle 「ひとことを きいて えらぶ」 |
| レベル | **ばしょ** | never やさしい / むずかしい |
| ★ はまべ / ★★ いりえ / ★★★ かわぐち / ★★★★ かわ・もり | はまべ (1, 2) / かわ / もり / やま / ほし (§4) | いりえ, かわぐち and かわ・もり are dropped |
| L5 (the アナウンス mix) | the mode **アナウンス** | 「えき・くうこう・るすでん」 |
| にがて れんしゅう | **おさらい** | にがて stays only as a private word in きろく |
| 「つぎは これを れんしゅう しよう」 (きろく) | the menu's cards | |
| 「おなじ へやで あそぶ」 | **「おとを 1だいに まとめる」** | |
| 「たいせん」 | **「きょうりょく ／ しょうぶ」** | |
| ひとりで はじめる / みんなを さそう | **はじめる** (primary) / **さそう** (second) | |
| やめる？ | **「ここで やめる？」** + 「ここまでの きろくは のこります」 | |
| 「せいかい！ +100」 / 「いっぱつ せいかい！ +30」 | 「せいかい！」 + a **いっぱつ** badge (no number) | the user's decision 2026-11-06 |
| 「1いは …さん！」, 「1040てん」 (co-op) | co-op: 「ふたりで 7 / 8 です。」; ranks only in しょうぶ | |
| 「8もん中 6もん」 | 「じぶんは 6 / 8」 | |
| 「ホストが …」 | 「{name}が おわりに しました」 / 「{name}との つながりが きれました」 / 「しばらく うごきが なかったので おわりました」 | |
| skill labels にた ぼいん / にた しいん / だいじな ところ / うけこたえ | **ship と sheep / b・v・th / こまかい じょうほう / へんじ** | L と R, つながる おと, すうじ, ほんね stay. One list for the bars and the trip chips |
| たんしゅくけい / しょうりゃく (chips) | 「I'd / I'll」 / 「はぶかれる ことば」 | |
| 1かいで せいかい | いっぱつ | |
| placement test | **みみ チェック** | |
| ふたりで ジグソー / ディクトグロス | **はんぶんこ** / ~~ふたりで タイル~~ | ふたりで タイル was cut in wave 2 (curriculum-wave2.md sign-off) |
| トーン あて / かいぎの ぎじろく / フータ／ラジオ | **きもち あて / かいぎ メモ / フータの おはなし** | not built (§6.2) |

Words never used in the UI: べんきょう, テスト, しけん, レッスン (a unit's lessons go by their names: であい, おと, ばめん, じっせん, チェック), ノルマ, ミス, やさしい / むずかしい.

## 4. One ladder: ばしょ

| Stage | ★ | CEFR (private, under くわしく) | Content | Note |
|---|---|---|---|---|
| **S0 はまべ** | ★ | A2–B1 | **L1 → はまべ 1, L2 → はまべ 2** | two sub-steps (chips under the row); one stage to the user |
| **S1 かわ** | ★★ | B1+ | **L3** | |
| **S2 もり** | ★★★ | B2 | **L4** (the former かわ・もり bank) | the L4 bank is S1/S2 material (curriculum §3); it lives at もり because its `mean` / dialogue items are its core |
| **S3 やま** | ★★★★ | B2+ | **L6** | |
| **S4 ほし** | ★★★★★ | C1 | **L7** | |
| — | | | **L5 → the アナウンス mode** | a mode, not a stage (its PA/voicemail items keep their S1/S2 tags) |

- **The mapping is a UI table** (catalog.ts `PLACES`, `placeOfLv`, `lvOfPlace`), so the wire and the `listen` row keep plain `lv` (1-8, docs/kikimimi.md "Sync"). A place this build has no level for is sunk (`aria-disabled`).
- **The comfortable stage** (stages.ts `stageAt` over progress.ts's level: each stage's rank ± half a step) prints 「いまの ばしょ：かわ ★★」 and the next step 「つぎは もり が ちょうど いい ころ」.
- **おまかせ** is the ばしょ row's default (catalog.ts `omakaseLv`): the latest みみ チェック's level, else きろく's comfortable level, else はまべ 2. It drives the hub's quiz card, しまの みち's soft stages and ひとこと クイズ's row. A tap is an override kept per mode (`DEVICE.kikiStage[gm]`); 「おまかせに もどす」 clears it.

## 5. IA and navigation

```
pill ─▶ sheet 「ききみみ」
hub (きょう) ─┬─ ⚙ せってい
              ├─ menu card ───────────────▶ [game frame] ─▶ results
              ├─ あそぶ ─┬─ しまの みち ─ unit ─▶ [frame]
              │          ├─ ねる まえに ─ StoryList ─▶ StoryFrame
              │          └─ mode detail ─┬─▶ [frame] ─▶ results
              │                          └─ みんなで (game preselected)
              ├─ みんなで (lobby) ─▶ [frame on every phone] ─▶ results
              ├─ ずかん
              ├─ きろく
              └─ たいかい banner (Fri 18:00 – Mon 05:00) ─▶ TaikaiLobby
first open: welcome ─ sound check ─ みみ チェック ─ result ─▶ hub
```

**Rules** (as built: nav.ts, KikimimiSheet.svelte)
- **One stack** over the hub (`Page`: asobu, mode, lobby, record, settings, path, unit, zukan, story, taikai), at most 4 deep above it (`MAX_DEPTH`). ‹ pops one.
- **✕ closes the sheet from any page.** With others in my lobby it asks first (「部屋を閉じますか？」 / 「みんなの部屋がなくなります」).
- **In a game** (countdown → reveal) there is no ‹. ✕, a backdrop tap or Esc asks 「ここで やめる？」.
- **Results:** おわる goes to the hub (it doesn't close). もういっかい restarts the same mode (and re-invites in a shared game).
- **Backdrop tap / Esc** on a page pops, and closes at the hub.
- **Deep links:** the invite gives `[lobby]` (`inviteStack`), the たいかい banner `[taikai]` (`taikaiStack`), a mode `[asobu, mode]`. ‹ always lands on the hub.
- **The night:** StoryFrame is a game page (no ‹; a backdrop tap or Esc does nothing). Its sleep timer ends it, and the sheet closes itself (fading over 2 s).
- **The invite** is a card at the top of the hub (and the banner on the island). さんか pushes the lobby, joined.

## 6. Screens

Sizes are the app's tokens: cards `--r-card` 24, buttons 16, taps ≥ 44 px, the 4 px lip, cream cards on the tan panel. A clickable static prototype of these screens was made alongside the design (not in the repo); the wireframes are the reference.

### 6.1 Hub (きょう)

```
┌───────────────────────────────────────────┐
│ (⚙)            ききみみ               (✕) │
├───────────────────────────────────────────┤
│ ┌ invite (only while one waits) ────────┐ │
│ │ (うめ) うめが さそっています  [さんか]│ │
│ └───────────────────────────────────────┘ │
│ (しずえ) こんばんは！ きょうの メニューです。│
│ ┌ すみ  おさらい · 6もん               ✓ ┐ │  done: folded, a coral ✓
│ ┌ (ジュン) きょうの いっぽ · かわ ③      ┐ │  green-edged: the next one
│ │ カフェで ちゅうもん                    │ │
│ │ であい · 6ふん               [つづける] │ │  the only primary
│ ┌ (マスター) きまぐれ                    ┐ │
│ │ すうじ ラッシュ · 3ふん                │ │
│ 1つで きょうは OK。のこりは おまけです     │
│ (👂 みみ チェック: until a check row)      │
│ [あそぶ] [みんなで] [ずかん] [きろく]      │  4 entry tiles
│ ┌ しずえの しゅうまつ たいかい   › ┐ yuzu │  Fri 18:00 – Mon 05:00
│ ┌ こんしゅう きいた ひ        3 / 5 にち ┐ │
│ │ (月)(火)(水)(木)[金](土)(日)            │ │
│ │ ふたりの クエスト  ふたりで 42 / 60 ぷん│ │
│ │ ━━━━━━━━━━━━░░░░░                    │ │
└───────────────────────────────────────────┘
```

- **しずえ's line** changes with the hour (おはよう / こんにちは / こんばんは) and, once the menu is done, 「きょうは ここまでで じゅうぶんです！」. Never a count of missed days.
- **The menu** (§7.1): three cards; a done card folds to a coral ✓; the first undone card is green-edged with the only green はじめる; a card plays at once (actions.ts `menu`).
- **The entry tiles** carry one live line: あそぶ 「{n}のゲーム」, みんなで the first villager here or 「ひとりでも OK」, ずかん 「言葉を集める」 (a count of new entries is not built), きろく the comfortable stage.
- **The week card** (`hub/WeekCard.svelte`, §7.3, §7.4) is the stamp card and the quest. By day after a bedtime chapter, `hub/MorningCard.svelte` sits under the menu (§6.8).

### 6.2 あそぶ

```
┌───────────────────────────────────────────┐
│ (‹)              あそぶ               (✕) │
├───────────────────────────────────────────┤
│ ┌ (ジュン) しまの みち            › ┐     │
│ │ かわ ★★ · ユニット 3 / 10  ●●◉○○○ │     │
│ さくっと  3ぷんで できる                   │
│ ┌ ひとこと クイズ ┐ ┌ スピード はしご ┐   │  2-col tiles: art, name,
│ │ ひとことを きいて│ │ ゆっくり → はやい│   │  one-line subtitle,
│ │ えらぶ  4ふん 👥 │ │ 3ふん 👥         │   │  mins, 👥 if shareable
│ ┌ すうじ ラッシュ  ┐ ┌ おさらい        ┐   │
│ まちで・でんわで  ばめんで きく            │
│ [アナウンス] [ようじ でんわ] [たちぎき]    │
│ じっくり  ながめに きく                    │
│ [しずえの ニュース]                        │
│ ねる まえに  てんすう なし                 │
│ ┌ (ジョニー) おやすみ ものがたり     › ┐  │  night-navy tile 🌙
│ 声に出す  マイクを使う  (mic on only)      │
└───────────────────────────────────────────┘
```

As built (catalog.ts `MODES`, `shelves`; the later games add theirs from round/registry.ts):

| Group | Modes |
|---|---|
| **さくっと**（3ぷんで できる） | ひとこと クイズ, スピード はしご, おさらい, ことば タイル, すうじ ラッシュ |
| **まちで・でんわで**（ばめんで きく） | アナウンス, ようじ でんわ, たちぎき |
| **じっくり**（ながめに きく） | しずえの ニュース (きまぐれ picks it 05:00-11:00 only) |
| **ねる まえに**（てんすう なし） | おやすみ ものがたり |
| **声に出す**（マイクを使う） | the mic modes, shown only while the mic is on (docs/kikimimi-mic.md §2.6) |
| みんなで picker only | ふたりで ロールプレイ (mic) |
| hub only | しずえの しゅうまつ たいかい (the banner), みみ チェック (first run; again from ⚙) |

Designed, **not built**: きもち あて (curriculum-wave2.md §2.6: only if the clone can act), かいぎ メモ, ざつだん パーティ, うわさの でんごん, めいたんてい フータ, フータの おはなし, ジョニーの たび, はんぶんこ. Cut: ふたりで タイル (wave 2's sign-off).

- **Only playable modes show** (a mode's content and gate). There's never a 「もうすぐ」 wall; an empty group is hidden.
- **No filter UI.** Labelled groups are faster than filters at this count.
- Dropped: the ✨ 「あたらしい」 pill (not needed with modes landing playable).

### 6.3 しまの みち (the island path) — built (U4, 2026-11-06)

```
│ (‹)            しまの みち             (✕) │
│ (しずえ) すきな ところから どうぞ。1かい 2ぷんで おわります。│
│ ┌ おさらい チェック 「…」30にち たったよ   [あそぶ] ┐ │  only when a recheck is due
│ [ぜんぶ][👥 ともだち][✈️ たび][💼 しごと][🎉 …] →   │  chips, one row, scrolls sideways
│ はまべ ★                                          │
│        ┌ (しずえ) はまべ 1・2 · ひとこと クイズ  › ┐ │  the quick quiz at はまべ (no units)
│ ▾ かわ ★★  ここから  🛶            ✓ 0 / 4     │  a stage folds under its head
│  はじめに おすすめ                                 │  the anchors (glue) first
│ ┌(💬 マスター) ききかえす      [つづける] ┐          │  current: green edge
│ │ マスター · きほん  ◉○○ ☆☆             │          │  3 core dots (next ringed yuzu) + 2 extras
│        ┌(💬 キャラメル) でんわを おえる  › ┐        │  zig-zag
│ ▸ もり ★★★  すこし はやいかも。でも あそべます ✓ 1 / 4│  soft: striped, still tappable
│ ┌(✈️ ナタリー ✓) ホテルで こまった ○○● › ┐          │  ✓ my stamp; ✓✓ both; outline ✓ the partner's
│ [📖 ことば ずかん                        ›]       │
```

- **Where it lives:** あそぶ's first card and the menu's きょうの いっぽ; the lobby's `path/PathCard.svelte` for co-op lessons. Pages `path`, `unit(id)`, `zukan(unit?)`. A lesson's intro card and its game sit over the stack; its おわる comes back to the page it was started from. `path/IslandPath.svelte`, its own chunk, as are the unit page and the ずかん (scripts/kikimimi-budget.ts: ≤ 15 KB gzipped each).
- **The model** is `kikimimi/path.ts` (pure, path.test): `pathOf({units, states, level, played, filter, placed})`. Stages in order; in a stage the anchors (`glue`) first under 「はじめに おすすめ」, then the index's order. **The current unit** is the last one I played a lesson of that isn't stamped, else the first unstamped from my comfortable stage up, else the first unstamped anywhere. `nextLesson`: the first core lesson not played to the end; the チェック until stamped; stamped, an extra not played, else the チェック again.
- **Domains** are tags (`DOMAINS`: an emoji badge over the host's face and a tint). The chips are ぜんぶ plus the domains the units carry. A filter collapses other domains' stops to a dot so the stage keeps its shape; the anchors stay under every filter, and a unit's `also` counts.
- **Every stage stays playable, never locked.** With a みみ チェック, every stage above the placed one is soft (striped, 「すこし はやいかも。でも あそべます」) and the placed one's head says 「ここから」; before one, a stage more than a step above my comfortable level is soft. A stage with no units is mist.
- **Folding (U7):** each stage folds under a head button (its name, ★, 「ここから」, the landmark, a stamps bar and ✓ k / n); open by default: the current unit's stage, the placed one, a stage with a celebration, every stage a filter shows; hand toggles are kept while a page or lesson is over the path. Opening the path scrolls smoothly to the current stop (at once under reduced motion); back from a page it's where it was. A stop with both stamps adds 「ふたりで スタンプ！」.
- **Landmarks (U7):** a stage whose units are all stamped by me is cleared (`landmarksOf`; never by the placement or the partner's stamps; はまべ has no units, so none yet): its head carries the landmark (📻 はまべ ラジカセ, 🛶 かわ いかだ, 🏮 もり ツリーハウスの ランプ, 🔭 やま てんぼうだい, 🌌 ほし てんたいぼうえんきょう), and the first time a celebration card (「かわを クリア！ いかだが できました」; once per player, `DEVICE.kikiLandmarks`). Cosmetic.
- **Drafts:** a unit with `status: draft` shows only with the dev hooks on (a dev build or `?demo`).
- **「つづける」** on the current stop opens its next lesson's intro card; a tap elsewhere on a stop opens the unit's page.
- **Couple view:** the double stamp (✓ ✓, fanned) from the partner's summary bit; the partner's alone an outlined ✓. Never their answers.
- **The 30-day recheck** (`rechecksDue`) is a yuzu banner on top of the path with its own あそぶ, and takes menu card 1 when due (§7.1).
- Tests: path.test, lesson.test, units.test; e2e kikimimi-path.

### 6.3b A unit's page — built (U4)

```
│ (‹)          ホテルで こまった          (✕) │
│ [ scene backdrop (or the domain's tint), the host standing, ナタリー tag ] ✈️ たび │
│ できるように なること                        │
│ ホテルの もんだいを ききとれる               │  the can-do's one line (cando.short), large
│ ▸ くわしく                                   │  folds the template's full sentence
│ ( ○ じぶん ) ( ○ うめ )  チェックで いっぱつ 5もん せいかい → スタンプ │  🏅 when stamped; ふたりで スタンプ！
│ ✉ (folded) the villager's letter, once stamped │
│ ┌ (1) であい  かいわを まるごと · 6もん・2ぷん  [あそぶ] ┐ │  the next: green edge, the only green
│ ┌ (2) ばめん  いろんな こえ・へんじ · 6もん・2ぷん       ┐ │
│ ┌ (3) チェック でんわの ようじ · 6もん・2ぷん            ┐ │  ✓ once played to the end
│ おまけ（スタンプには ひつようなし）  [☆ おと] [☆ じっせん] │  only the extras the unit has
│ ┌ フレーズ つかまえた 0 / 8          ›  ┐ │  → ずかん on this unit
│ [              飛ばしてチェック              ]  │  until the チェック is next or it's stamped
```

- The can-do's one line (`cando.short`, ≤ 25 characters) is the headline, on the lesson intro card too and as a path stop's subtitle; the full sentence folds under 「くわしく」.
- `path/UnitPage.svelte` loads the unit's chunk (pool.ts `load`); the lessons shown are those with playable items (`playIds`); my tally under the stamp line (stamps.ts). Co-op: the host opens it from a shared lobby's card (framework 8c).
- **The letter (U7):** a unit's YAML may carry `letter: {en, ja}` (40-60 words of American English using one of its phrases; units.ts checks it), compiled into `parts/letters.json` (pool.ts `loadLetters`; `kikimimi/letters.ts lettersOf`: one per unit I stamped, never for the partner's stamp alone). `path/VillagerLetter.svelte` arrives open on the results of the チェック that first stamped the unit (`UnitState.stampedIn`), sits folded on the unit's page, and `path/LetterShelf.svelte` lists them in ずかん › スタンプ. Text only, no gift. The 7 wave-1 letters are written.

### 6.4 Mode detail

```
│ (‹)          ひとこと クイズ           (✕) │
│ [ scene backdrop with the cast           ] │  150 px, art/scene/*
│ ひとことを きいて えらぶ                    │
│ しまの みんなの ひとこと。きこえた ことば、│
│ へんじ、ほんねを えらびます。               │
│ (8もん) (4ふん) (👥 ふたりで できる)        │
│ ┌ ばしょ                       (おまかせ) ┐ │
│ │ [★ はまべ][★★ かわ][★★★ もり][やま][ほし] │  radiogroup; places without content sunk
│ │   [1] [2]  (はまべ's sub-steps)           │
│ │ いまの あなたに ちょうど いい ばしょ です。 │
│ ┌ こたえる じかん  20 / 30 / 60 / なし     ┐ │  TimerRow
│ [さそう]  [        はじめる         ]       │  sticky foot
```

- **The stage row** (`mode/StageRow.svelte`): five places with ★, the selected one yuzu, the empty ones sunk (`aria-disabled`); はまべ's sub-steps are chips under the row while it's picked. A tap sets an override (§4's おまかせ). A lane's game offers only the places its listened files cover (catalog.ts `contentLevels`).
- **No unit picker here:** units live on the path and in the lobby's しまの みち card.
- **The volume-0 line** shows inline when the volume is 0 (「おとが 0 です。せってい で あげてね」 with 🔊).
- Not built: the 「このごろ」 row of my last results.
- **The tournament's page (G-たいかい)** is its own lobby, `taikai/TaikaiLobby.svelte` (Page `taikai`): しずえ's welcome, the three rules, who's in with how many misses each offered (never which), きょうりょく ／ しょうぶ (co-op default), then 「ひとりで はじめる」 or 「さそう」 (the primary when someone's on the island) and the host's 「はじめる（Nにん）」. The hub's yuzu banner shows while `taikaiOpen` (Fri 18:00 – Mon 05:00, the scene clock; `?date=` previews it): 「こんしゅうの まちがいから 7もん ＋ かけの もんだい」, or once played this weekend's best trophy and 「もういちど ちょうせん できます」. The show (`TaikaiPlay.svelte` over Play's `show` / `gate` snippets): しずえ's bar (だい N もん / 7, かけの もんだい), co-op's team against her target or しょうぶ's chips; the wager's bet chips 10–100 first (the choices stay closed till one is picked); a confident miss (≥ 70) is a coral 「おしい！ これは わすれませんね」 card with the answer large and the clip once more. Results (`TaikaiResults.svelte`): the medal, her target and gold lines, 「トロフィーは きろくの たなに かざりました」, then the feedback and the misses. きろく and ずかん › スタンプ show the trophy shelf. The chips are round-only, never kept (§7.2). e2e kikimimi-taikai.

### 6.5 みんなで (lobby)

```
│ (‹)              みんなで              (✕) │
│ あそぶ ゲーム                               │
│ [ひとこと クイズ✓][はしご][すうじ][たちぎき] → │  scrolls; co-op-only included
│ ┌ しまの みち: the current unit ›      ┐   │  co-op lessons
│ さんかする ひと                             │
│ ┌ (ウェイ✓) さんか (うめ✓) さんか (？) おきゃくさん しまに いない ┐ │
│ ┌ [ きょうりょく ][ しょうぶ ]                 ┐ │  Segmented, default きょうりょく
│ │ ふたりで ひとつの スコア。だれが まちがえたかは でません。│
│ ┌ おとを 1だいに まとめる                [○  ]┐ │
│ │ おなじ へやで ハモらない ように               │ │
│ [          はじめる（2にん）              ]  │  before さそう: [さそう]
```

- **Getting here:** the hub tile, a mode's さそう (the game preselected) or an invite (joined; controls read-only, foot 「ウェイが はじめるのを まっています」).
- **しまの みち's card** (`PathCard`): the host picks a unit and a lesson, in a shared lobby for everyone (co-op lessons, framework 8c: the others see its intro card with the players; a チェック's card adds the team's way to the stamp).
- **An invite of content this build hasn't** (its `cv`) shows 「アプリを こうしんしてね」 with こうしんする instead of さんか.
- **きょうりょく／しょうぶ** shows only when the picked game supports しょうぶ. Each phone's tier is its own (`join.tr`) and never shown next to anyone else's.
- **Alone:** 「ひとりでも はじめられます」; さそう still works. **Leaving:** ✕ with others joined asks first; when the host leaves, the notice shows and ‹ goes to the hub.

### 6.6 In-game frame (RoundFrame / RevealFrame)

```
question                                  reveal
│ (ウェイ)(うめ✓)  ひとこと クイズ  (✕) │  │ (ウェイ)(うめ)  ひとこと クイズ  (✕) │
│                  ●●▬○○○○○            │  │                 ●●▬○○○○○             │
│ ┌ scene: カフェ ─────────────────┐   │  │        ◯ せいかい！                   │
│ │ (ジュン) ♪… ━━━━━░░░            │   │  │  [★ いっぱつ] (2にん せいかい！)      │
│ [🔁 もういちど] [🐢]                  │  │ ┌ No worries, I'm not in a rush. ◯ ┐  │
│ なんて こたえる？                     │  │ (ジュン) Sorry, the oat latte's gonna │
│ [ No worries, I'm not in a rush. ]    │  │   be a few more minutes. That OK?     │
│ [ Sure, I'll have it here.       ]    │  │   すみません、オーツラテはもう少し…   │
│ [ Yes, it's on the house.        ]    │  │ [解説] gonna = going to。「待てますか」…│
│ ━━━━━━━━━━━━░░░ (time)               │  │ (しずえ) おみごとです！                │
│                                       │  │ [            つぎへ             ]     │
```

- **The bar:** the players' chips at the left (✓ when answered), the mode's name with the round dots (the current one a yuzu pill), ✕ at the right.
- **The frame owns** the countdown, the bar, the replay row (🔁 / 🐢, listen-only on the other phones with おとを 1だいに), the timer, the foot and ✕; a game supplies its stage, input and reveal (frame/RoundFrame, RevealFrame; framework §5).
- **The reveal:** ○ / × with 「せいかい！」 or the answer; the いっぱつ badge without a number; 「2にん せいかい！」 in co-op, never who; the Japanese, each choice's Japanese and the 解説 (docs/kikimimi.md "Japanese help"); しずえ's polite word.

### 6.7 Results

```
│                  けっか                (✕) │
│ (しずえ) おつかれさまでした！ ふたりで 7 / 8 です。│
│          じぶんは 6 / 8 · いっぱつ 4          │
│ ┌ つまずいた ところ  (I'd / I'll ×1) (つながる おと) ┐ │
│ ふりかえり                       まちがえた だけ │
│ ┌ × I'd grab a table if I were you.        ┐ │
│ │   私なら席を取っておくよ。 えらんだ: I'll ×  │ │
│ │   (▶︎) (🐢) [読んでから もう一度]          │ │
│ [おわる]  [       もういっかい        ]       │
```

- As built: docs/kikimimi.md "Results" (frame/Results.svelte, ReviewList); しょうぶ adds the ranking (by points: expectation scoring waits for per-player stages, curriculum §11).
- **A lesson's strip** (U4): the host's face, the unit's name and its dots; after であい / ばめん a green 「つぎは「ばめん」 ›」; after a チェック the stamp (🏅 dropping in, two for ふたりで スタンプ！; reduced motion: still) with my first-listen tally (and the team's in co-op), or 「あと すこし！」, and the letter the first time (§6.3b). おわる goes back to the page it came from; もういっかい deals it again.
- Dropped with かいがら: the 「きょうの ごほうび」 card (かいがら, the cap line, quest minutes). Not built: the 「きょうの ひとこと」 card and a friendship level-up line here (ずかん › なかま announces level-ups).

### 6.8 おやすみ ものがたり (StoryFrame)

```
│        おやすみ ものがたり             (✕) │  night palette (data-kiki-night)
│        ジョニーの たび · だい 3わ           │
│ ┌ dimmed scene (art/scene/living, 42 %) ☾ ┐ │
│ │             (ジョニー)                   │ │
│ The Lighthouse Keeper's Cat                 │
│ ジョニーが とうだいの ねこの はなしを します │
│ ━━━━━━━━━░░░░░░░░░  4:12 / 9:30            │
│          ⏮      ( ⏸ )      ⏭               │  92 px
│              おやすみ タイマー               │
│ [10ぷん] [20ぷん] [30ぷん] [ぜんぶ]          │
│ ほんぶんを みる · くわしく                   │
```

As built (G-おやすみ, 2026-11-07):
- **The model** (`kikimimi/bedtime.ts`, pure, bedtime.test): the chapter's timeline (a 0.6 s gap when the same voice goes on, 0.9 s at a change of speaker), the sleep timer (10 / 20 / 30 ぷん of listening, a pause stops it; ぜんぶ: to the chapter's end) and its fade (`fadeCurve`, equal-power over the last 20 s), chapters unlocked one by one (finished = played to the end, or the timer ran out in its last third), つづき (`nextOf`: the segment left at), `pickSerial` and the morning card.
- **Playing** (`story/player.svelte.ts`): each segment through packs.ts `voiceClip` → `playVoice` (a clip that can't sound passes after 3 s), the music held down for the whole run (engine.ts `holdDuck`) and the timer's fade on the voice bus (`fadeVoice`); a timed story goes on into the next chapter after 4 s, ぜんぶ stops at the end card. Controls are silent; reduced motion drops the fades.
- **The frame** (`story/StoryFrame.svelte`, its own chunk): a game page in the night palette whatever the hour; the scene dimmed to 42 % with the heads of who's in it (the speaker softly ringed, nothing bobs); ⏮ ⏯ ⏭, the timer chips with 「のこり m:ss」, ほんぶんを みる (the words with a karaoke underline, hidden by default) and くわしく (the summary and the chapter's phrases). The end card: 「だい Nわ おしまい」, the morning's guess revealed, 「つぎの おはなしが ひらきました」 with もくじ / つぎの おはなし. The timer's end fades the sheet over 2 s and closes it.
- **The list** (`story/StoryList.svelte`, あそぶ › ねる まえに): each serial's chapters, ✓ heard, the next green-edged (きく / つづきから), later ones locked. A serial shows once past `draft` (story/serials.svelte.ts).
- **The hub:** 21:00-04:00 (today.ts `isNight`) きまぐれ is the story, playing the picked serial's next chapter at once; by day `hub/MorningCard.svelte` asks 「きのうの つづき、どうなると おもう？」 the day after a chapter (its three `predict` choices; あとで hides it for the day).
- **Minutes, no score:** a `listen` row `{gm: 'story', u: <serial>, lv 4, n 1, r: []}` of the time heard at each stop (≥ 10 s), one game id per sitting: きろく's minutes, the quest, a week stamp and a menu tick at ≥ 3 min. Progress and the last timer per player on the phone (`DEVICE.kikiStory`).
- **Limit: no playback with the screen locked.** The voice is Web Audio and the page hidden pauses the engine (iOS suspends the context anyway): the story pauses, keeps its place, and 「タップして つづける」 resumes it. Lock-screen audio would need a media-element path with a Media Session; not done (no native hacks).
- e2e kikimimi-story.

### 6.9 きろく

```
│ (‹)               きろく               (✕) │
│ ┌ いまの ばしょ  ★★ かわ                  ┐ │
│ │ ━━━━━━░░░░░░░░                          │ │
│ │ つぎは もり が ちょうど いい ころ         │ │
│ │                                 くわしく › │ │  CEFR, tables
│ とくい・にがて                              │
│ ┌ L と R ━━━░░ 38% … ほんね ━━━░░ 47%     ┐ │  8 bars, one list
│ ┌ トロフィーの たな  🥈 🥇                  ┐ │
│ ┌ ふたりで こんしゅう: いっしょに 2かい · 42ふん ┐ │
```

- As built: `Progress.svelte` (docs/kikimimi.md "Progress & feedback") plus the trophy shelf; an empty きろく says 「まだ まっしろ…」 with あそぶ. The recommendations moved to the menu. The couple line is minutes only, never a level.
- Not built: a skill row pushing its own page with 「れんしゅう」, the recent games with their ReviewList, the hours-heard meter.

### 6.10 ずかん

**Built (U5, 2026-11-07), no かいがら:** `zukan/KikiZukan.svelte` (from the hub's tile, the path's 「ことば ずかん」, and a unit page's phrases on that unit) is a Segmented of four sections, each its own chunk, over `zukan/data.svelte.ts` (the units' chunks, every bedtime chapter's, the levels of my answered items loaded once; a sample clip through packs.ts `voiceClip`, one at a time; `DEVICE.kikiZukan`: the levels announced, the caught phrases seen). The folds are pure: `kikimimi/zukan.ts`, `kikimimi/friendship.ts`, week.ts `weekStamps`.
- **ことば** (`Words`): every unit's key phrases by domain, then each bedtime serial's (🌙), a section's caught count and bar; ぜんぶ / つかまえた / まだ. Caught (srs.ts `phrasesOf`) shows the phrase, its Japanese, its ★ (`phraseBook`: ★ caught, +★ first listens in 2 accents, +★ one on a phone, a PA or in noise) and a coral NEW until seen; heard, a silhouette with 「Nかい きいた」; never, ？. A story's phrases are seen once its chapter is begun and caught once it's heard to the end (no ★). The entry: the phrase, the trap, the scene and register, who said it, the last day, ▶︎ a clip with it (`phraseClip`: heard phrases only, never a spoiler).
- **こえ** (`Voices`): the 18 cast voices (speech.ts `CAST_IDS`): the voice's first villager's face, the accent and a one-line kind, the items heard in it and a bar to caught (10 understood: `voicesOf`), unheard a silhouette; a tap plays a sample (`sampleClip`) and shows who speaks with it.
- **なかま** (`Friends`): §7.7; the villagers I've heard, closest first, five hearts (the level only) and 「つぎ：てがみ」; a level reached since last shown is announced once (a coral card with a heart: `levelUps`). Villagers not met yet are silhouettes.
- **スタンプ** (`Stamps`): the units' can-do stamps in the path's order (mine with its day; the double stamp ringed mint with 「ふたりで」; the partner's alone 「{name}は もってる」; a dashed blank), the villagers' letters (`LetterShelf`), the week stamps (weeks that met my target), いっぱつ (my first-listen rights, badges at 10 / 50 / 100 / 300 / 1000: `ippatsuOf`), the tournament's trophies and the bedtime chapters heard to the end.
- Owner-only. Not built: the partner's 「ふたりとも しってる」 line in きろく, the hub tile's count of new entries. e2e kikimimi-zukan.

### 6.11 せってい (⚙)

As built (`settings/KikiSettings.svelte`): 🔊 「きこえる？」; 「おとを 1だいに まとめる」 as a new lobby's default (`DEVICE.kikiSame`); にほんごやく いつも / まちがえたら / みない (`DEVICE.kikiJa`: hides `.ja` at a right reveal and on right review rows, or always); こんしゅうの めあて 3 / 5 / 7 にち (`DEVICE.kikiWeekGoal`, 3 by default); 「みみ チェックを もういちど」 with 「いまの ばしょ：もり ★★★」 under it; the mic's switch (docs/kikimimi-mic.md). Not built: the quest's 30 / 60 / 90 shared setting (needs the relay; 60 fixed).

### 6.12 First run

As built (U6, 2026-11-07):
1. **Welcome** (`onboarding/Welcome.svelte`, in the hub's place, no ⚙; shown to a player with no games on a phone where `DEVICE.kikiOnboarded` lacks them): しずえ's hello and three points (1にち 3ぷんから · ふたりで いっしょに · まず みみ チェック（3ぷん）), [あとで] / [はじめる].
2. **The sound check** (🔊, the volume-0 line); [みみ チェックへ].
3. **みみ チェック**, the `check` GameDef (`kikimimi/games/check/`, framework §7 #11): solo, nothing on the wire, rounds dealt one at a time through `GameDef.next`. It starts at かわ, goes up a band after 2 right and down after 1 wrong, and stops after two reversals (at least 8 items) or at 12. The skills take turns (すうじ, つながる おと, へんじ・ほんね, にた おと, one gist) over the places' voiced items (`TAIKAI_IDS`). A progress bar, no score, no +100.
4. **The result** (`onboarding/Placed.svelte`): 「もりから はじめましょう！」 on the five-place strip, とくい / これから chips, 「🔒 この けっかは あなただけに みえます。」, [ききみみへ]. Kept as a `listen` row `{gm: 'check', lv: <placed level>, u: <a digit a skill, x unsampled>}`; it sets おまかせ (§4).

Either way the welcome is marked seen. あとで lands on the hub, which shows a quiet 👂 みみ チェック card (above the tiles, never the green button) for anyone without a check row, so players from before it are offered it too, without the welcome. The guest gets the same flow with its own data. e2e kikimimi-check (other specs open past the welcome: `e2e/fixtures.ts` `kikiFirstRun`).

## 7. Progression and rewards

### 7.1 The daily menu (`today.ts`, pure)

Picked from the Tokyo day (the same day key as the `listen` rows and the week dots), the report and the SRS fold. Same inputs, same menu, on every phone of mine.

| Card | Content | Length |
|---|---|---|
| 1 **おさらい** | due SRS cards, capped at 8 (「しずえが 6もん えらびました」, never "14 overdue"); a due 30-day recheck takes its place. None due: 「おさらいは ぜんぶ おわり！」, folded as done | ≤ 3 min |
| 2 **きょうの いっぽ** | the current unit's next lesson on the path; before units, ひとこと クイズ at my place | 5–8 min |
| 3 **きまぐれ** | one playable mode in turn by the day, never yesterday's (not the quiz when card 2 is one; a mode with hours only then: ニュース in the morning); 21:00-04:00 **おやすみ ものがたり** | 3–10 min |

- **The tournament** (Fri 18:00 – Mon 05:00) is a banner under the tiles, not a card; playing it ticks a card like any session.
- **Any one finished session means 「きょうは OK」** and stamps the day. A session ticks the first undone card it matches, else the first undone card, so free play is never "off menu".
- **After all three:** 「きょうは ここまでで じゅうぶんです！」. Free play stays open and moves the ずかん, friendship and the path.
- **A finished session** = a `listen` row with ≥ 4 answers, or a story heard ≥ 3 min.

### 7.2 かいがら (never ベル)

**Dropped (the user, 2026-11-06): English practice pays no かいがら.** The design had paid 20 a finished session (cap 80 a day), 150 each for the couple quest, 200 a unit and 1,000 a stage through a `listenIncome` fold in the shop's ledger; none of it was built (U3). ベル stays the fitness wallet; English never touches either currency. The たいかい's wager chips (10–100, a right answer pays the bet ×2, a wrong one loses it) are round-only, never kept or converted.

### 7.3 The weekly stamp card (never a streak)

As built (`week.ts`, `WeekCard`): each person picks a target of **3, 5 or 7 days** a week (default **3**); a day is stamped by one finished session. The card shows 「こんしゅう きいた ひ 2 / 3 にち」 and 月…日 dots (today ringed, a coral ✓ for a stamped day); met, 「こんしゅうの めあて たっせい！」. A new card each Monday, nothing said of the last, never a "0 days". A week that met the target is a week stamp in ずかん › スタンプ. Not built: the gifts at 10 / 20 / 30 / 40 week stamps (wait for a present path).

### 7.4 ふたりの クエスト (minutes)

As built: Monday to Sunday, one shared bar of **minutes heard**, 60 (fixed; the 30 / 90 setting needs the relay). Minutes, not correct answers, so each person adds the same per minute at any level. 「ふたりで 42 / 60 ぷん」 sums both members' `ms` from my rows and the partner's summaries, never who added what and never the guest's; met, 「クエスト たっせい！」; missed, nothing is said. **The guest** has its own solo quest (30 min), never inside the couple bar. No payout (§7.2).

### 7.5 The island path

As built (U4, U7): a unit's stamp needs 5 of 6 right on the first listen in the チェック (curriculum-units.md §3), retakeable; a stamp brings the host villager's letter (§6.3b), and a stage cleared unit by unit its landmark (§6.3); the placement clears nothing. Wave 1 and wave 2 are 21 units, each a 3-lesson core (~8 min) plus extras. The plan is 47 units over five stages (curriculum §13), in any order inside a stage. Not built: villager furniture gifts and landmark items for the tent (no present path for English yet), the hours-heard meter and K.K. songs at 1, 5, 10, 25 and 50 hours.

### 7.6 ずかん

The design: ことば みた (heard: a silhouette) → つかまえた (the full entry), ★ for a first listen, two accents and a condition; こえ caught after 10 items understood from a voice; スタンプ for units, shared stamps, weeks, いっぱつ and trophies (bronze for taking part, silver ≥ 70 % at your tier, gold ≥ 85 %). As built: §6.10 (phrases come from the units' key phrases and the stories'). Not built: a completed section's display case for the tent.

### 7.7 なかよし (friendship that never drops)

As built (`friendship.ts`, from my answers): +2 an item of a villager's understood on the first listen, +1 after a replay, a miss nothing; a dialogue counts each villager in it. Points never drop and are never shown; hearts show levels at **10 / 30 / 70 / 150 / 300** (`FRIEND_LEVELS`). Each person's own. The rewards are cosmetic in ずかん › なかま: L1 their English greeting on the card, L2 a short letter (Japanese a tap away), L3 a でんわ ともだち badge 📞, L4 a silver frame, L5 their photo in a gold frame. The design's L3 call, L4 furniture gift and L5 tent photo, and a shared photo when both reach L5, wait for a present path.

## 8. Empty and edge states

| Where | State |
|---|---|
| Hub, first open | the welcome (§6.12) |
| Hub, no check yet | the quiet 👂 みみ チェック card above the tiles; the menu as normal |
| Menu, none due | 「おさらいは ぜんぶ おわり！」, folded |
| Menu, all done | three ✓, 「きょうは ここまでで じゅうぶんです！」, tiles as normal |
| After a gap | the hour's greeting; the due cap holds (≤ 8), no count of missed days |
| きろく, empty | しずえ 「まだ まっしろ。1かい きくと ここに あしあとが つきます。」 + [あそぶ] |
| A group in あそぶ with no playable mode | hidden |
| Lobby, alone | 「ひとりでも はじめられます」; さそう still works |
| Lobby, host left | 「{name}が おわりに しました」; ‹ to the hub |
| Offline, pack not cached | the game can't start its clips (docs/kikimimi.md "Loading": a chunk that won't load drops what waited); cached packs play. The design's dimmed tile (「オフラインでは まだ」) isn't built |
| `cv` mismatch | 「アプリを こうしんしてね」 (framework §4.2) |
| Volume 0 | the inline 🔊 line in mode detail |
| Night (21:00-04:00) | きまぐれ = おやすみ; StoryFrame in the night palette whatever the island's time |
| Guest | no couple quest (its solo one), no partner lines, its own stage, ずかん and きろく |

Not built: 「うめは もう きいたよ」 on the みんなで tile, ずかん's empty-state silhouettes line.

## 9. What's removed or merged

| Before | Becomes |
|---|---|
| the あそぶ / きろく tabs | the hub + a pushed きろく |
| the level grid (4 buttons) | the ばしょ row with おまかせ in mode detail |
| 🎯 にがて れんしゅう | おさらい (menu card 1, a さくっと tile) |
| three stacked lobby buttons | mode detail: さそう / はじめる |
| 🔊 in the lobby | せってい, first run, and inline only at volume 0 |
| recommendations in きろく | the menu |
| +100 / +30 いっぱつ pills | 「せいかい！」 + the いっぱつ badge |
| the 「3 / 4」 game title | the mode's name + round dots |
| たいせん always shown | 「きょうりょく ／ しょうぶ」, only for games that support it |
| 「けっか はっぴょう」 + ranks in co-op | 「けっか」; ranks only in しょうぶ |
| `DEVICE.kikimimiLv` alone | kept as the level last played; `DEVICE.kikiStage[gm]` holds each mode's override (§4) |

## 10. Components and files

As built (framework §2, §5 for the round engine and frame):

```
app/src/lib/kikimimi/
  catalog.ts        pure: MODES {id, group, icon, mins, qs, coop, game?, places?, hours?, window?, ok, gate?, requires?},
                    shelves, whims, sharable; PLACES, placeOfLv, lvOfPlace, contentLevels, omakaseLv
  today.ts          pure: the 3 cards, matching sessions, isNight
  week.ts           pure: the stamp card, the quest, weekStamps
  path.ts, letters.ts, stamps.ts, stages.ts, lesson.ts   the path, letters, stamps, stages and lessons
  bedtime.ts        pure: the story's timeline, timer and unlocks
  friendship.ts, zukan.ts   pure: なかま and ずかん
  progress.ts, srs.ts, advice.ts, report.ts   docs/kikimimi.md "Progress & feedback"
app/src/lib/components/kikimimi/
  nav.ts            the stack: Page, push / pop, inviteStack, taikaiStack, modeStack, MAX_DEPTH
  KikimimiSheet.svelte, KikimimiHost.svelte, invite.svelte.ts, actions.ts, prefs.ts
  hub/              Hub (greeting, invite, menu, tiles, banners), WeekCard, MorningCard
  asobu/            Asobu
  mode/             ModeDetail, StageRow, TimerRow
  path/             IslandPath, PathCard, UnitPage, LessonDots, VillagerLetter, LetterShelf     (lazy)
  frame/            RoundFrame, RevealFrame, Results, ReviewList, ChoiceGrid, PlayerChip, Why, SandButton, Sandwich
  Lobby.svelte, Play.svelte, Results.svelte, Progress.svelte (きろく), LessonIntro.svelte
  zukan/            KikiZukan, Words, Voices, Friends, Stamps (each lazy), data.svelte.ts
  story/            StoryFrame, StoryList, player.svelte.ts, serials.svelte.ts                  (lazy)
  taikai/           TaikaiLobby, TaikaiPlay, TaikaiResults                                       (lazy)
  settings/         KikiSettings                                                                 (lazy)
  onboarding/       Welcome, Placed                                                              (lazy)
  (each later game: its own folder: tile/, call/, tachi/, rush/, news/, and the mic's mane/, kuri/, pair/, role/)
app/src/lib/sync/storage.ts   DEVICE: kikimimiLv, kikiStage, kikiSame, kikiJa, kikiWeekGoal, kikiOnboarded, kikiStory,
                              kikiZukan, kikiLandmarks
app/src/lib/i18n/kikimimi.*.json   the strings (§3)
```

- **Budgets** (scripts/kikimimi-budget.ts, run by `npm run build`): the hub ≤ 25 KB gzipped, every other page and game ≤ 15 KB; they are `{#await import()}` chunks (most 1-5 KB as built).
- **e2e:** the `data-kiki-*` hooks; specs through the hub (`e2e/kikimimi-nav.ts`): hub, story, taikai, check, path, zukan.

## 11. Build plan (each step small, shippable and green)

All built on main by 2026-11-07 (the Built list above), in the order U0 → framework 8b → U1 → U2 → G-たいかい → U4 → G-おやすみ → U5 (with U8's こえ) → U6 → U7. U3 (かいがら) was dropped by the user's decision.

Still open:
- the hours-heard meter and K.K. songs (U8's rest);
- villager gifts, the tent's trophy and landmark items, week-stamp gifts: wait for a present path that carries English rewards;
- the quest's 30 / 60 / 90 setting (a relay change);
- the ずかん tile's new-entry count and the partner's 「ふたりとも しってる」 line;
- きろく's skill pages and recent games;
- the modes in §6.2's not-built list.

## 12. Open questions for the user

Settled: かいがら amounts (none: no かいがら), the placement windfall (only stages cleared unit by unit), the weekly target (3 days), 「レッスン」 (dropped: the lessons go by their five names).

1. **The 「えいご」 sub-label** on the pill: keep it for good, or drop it after a few weeks as the copy team suggested?
2. **ジョニーの たび / フータの おはなし** (not built): fine to use Gulliver and Blathers as hosts (both are in the art set), or keep hosts to island villagers?
