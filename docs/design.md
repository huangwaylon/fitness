# Island Fund: design

What the app is and how it behaves. The backend is in [backend.md](backend.md), the reasons in
[decisions.md](decisions.md). Numbers come from `app/src/lib/config/rules.ts`, which wins if they disagree.

## Product

A two-player Animal Crossing–style island for a couple in Tokyo (ウェイ = A, うめ = B), each with an iPhone and an
Apple Watch. Their activity, measured automatically, grows fruit and earns **ベル** (play money, a stamp card: +1 per
daily goal) into one shared wallet, spent on two treats: おやつ and 外食. Japanese first, English per person.

- **Data in:** an iOS Shortcut posts Health's daily totals (steps, exercise minutes, active energy, stand minutes,
  weight, body fat %, BMI, lean body mass) several times a day. **Apple Health is the source of truth:** no health number is entered or fixed in the
  app ([Health data](#health-data)).
- **Data out:** the PWA (SvelteKit, static on Cloudflare Pages) fetches the raw rows and computes every number on the
  phone (`lib/model/`, pure functions).
- **Principles:** zero required taps a day; both people see all data; no notifications (the app is opened by choice;
  [decisions](decisions.md#no-notifications-2026-11-02)); everything always animates
  (no reduced-motion variants).

Modules: `contract/` (shared with the script) · `config/rules.ts` · `scoring/` · `model/` · `sync/` · `store/` ·
`ui-state/` · `sound/` · `components/`, `routes/`. `deps.test.ts` enforces the import direction.

## Simplicity rules

- No tab bar: 島 (the island), the health popup (tap the dumbbell: けんこう), the meal log (tap the bowl: ごはん), and
  behind the HUD menu's leaf the one panel for the ベル (its 「ベル 121」 row: ごほうび, no tabs), the ずかん, えいご
  ききとり (ききみみ クイズ) and せってい, each its own sheet.
- One focal point per screen (島: the island itself, the sky clean, the leaf the door to the rest; ごほうび: the
  balance, today's ベル under it).
- A number is shown in full in one place; elsewhere it is only a doorway to it.
- Per screen at most 40 Japanese characters of non-numeric text, 3 cards, 5 rows a card; one しずえ line (≤ 16
  characters), only with news.

## Screens

### Island

Top to bottom: the HUD row, one cluster in the sky's top-right corner (the health button, the meal button and the
menu's leaf, whose 「ベル」 row opens [the panel](#panel), ごほうび, where today's ベル are); a sync chip only when sync isn't ok; the scene;
しずえ's box only with news; the say button at the bottom right. The island is in 3D under them ([World](#world)): one finger
scrolls it from まえ (home, the health lawn) back to おく, two pinch the zoom, a tap on empty ground walks my villager there.

- **Trees:** one per person, today's four fruits in the canopy ([Trees](#trees)). A tap opens a popup: per goal (🍎
  steps first, then Move, Exercise, Stand) today's amount against the goal (「14,164 / 8,000歩」), ✓ once met and a yuzu
  「がんばり」 chip at 1.5× ([Goals](#goals)); no ベル on the rows. Until then each holds its place faintly: a dashed
  ring where the ✓ comes and a dashed ghost of the chip (gone once the day's がんばり cap is paid), so an early morning's
  popup shows what will fill in. Then the ledger, always all three lines, a zero faint: 「もくひょう +3」, 「がんばり +1」
  (「がんばり（上限 2） +2」 when three or four were reached) and this person's total 「うめの きょう +6 ベル」; then
  ふたりでぜんぶ (「ふたりで ぜんぶ まで：あと 2つ」 or 「ふたりで ぜんぶ！ +2 ふたりに」), outside either total, so both
  totals plus it make today's total (ごほうび's 「きょう +N ベル」). The last line says when that person's data last arrived (「15:24 に とどいた」), with
  a dot once it is over 6 hours old.
- **HUD row:** [the health button] [the meal button] [the menu], one cluster right-aligned in the top-right corner,
  the leaf at the very right (2026-11-03, the user: "move the leaf drop down button to the very right … kenkou, gohan,
  then finally dropdown menu"; [decisions](decisions.md#the-jar-goes-into-the-leaf-ごほうび-is-the-panel-2026-11-03)),
  at `--hud-top` (10px under the safe area: clear of iOS 27's top-edge blur, the Dynamic Island clear above it), inset
  14px or the safe area's side, 6px apart. The dumbbell and the bowl are the same width (60px, `--hud-side`), the menu
  a 44px disc. No jar and no ribbon in the sky: NH's island view keeps its sky clear and its UI tucked away, and the
  sky's left (a third of it from 393px up) stays free for the sun, the moon and the stars. Every target
  is 44px or more. No View Transition anywhere in it (the stripes bug); day and night are the same art (the buttons
  cream with their lip), both reading on either sky.
- **Menu** (`island/HudMenu.svelte`, `e2e/hud-menu.spec.ts`): the cluster's right end, at the screen's side, a 40px
  cream disc with the lip in a 44px target, NH's leaf mark in it (drawn inline: two greens either side of a pale vein, a dark outline, a curled stem; NH's art has no flat one, `money/leaf` is the 3D item); `aria-expanded`, `aria-controls` its
  pills. Folded by default: the sky shows only the dumbbell, the bowl and the menu. A tap unfolds it: the disc turns
  NH's yellow, the leaf tips (−40°, as if it flicked the menu down) and four cream pills drop out of it, one after
  the other (a 380ms spring, 55ms apart), right-aligned under the leaf (along the screen's side), the same width:
  **ベル 121** (the shared wallet's balance in the app's number font, no icon: the number is the picture) →
  [the panel](#panel) (ごほうび; `aria-expanded` while it's open), **ずかん** (NH's agrias butterfly) →
  [the ずかん](#zukan), **えいご ききとり** (しずえ's head) → [ききみみ クイズ](#ききみみ-クイズ) (「さそわれています！」 under
  its name, and a coral dot on the folded leaf, while someone's invite is live) and **せってい** (a gear in the say
  button's soft brown: NH has no settings icon) →
  [せってい](#panel). Each pill is 44px tall, its name then its icon or number (a word as well as a picture: an icon
  alone would be a guess). The ベル row's label carries today's ベル too (「ごほうび · ふたりのベル 129 ベル · きょう
  12 ベル」: on the island only a screen reader hears today's total; it's shown in full in ごほうび). No permanent
  "+N" badge on the leaf (a badge reads as a notification to clear). The guest has the ベル row too: ごほうび is
  view-only there, the same balance. It folds back up
  quicker (160ms, the last pill first) on a second tap of the leaf, a tap anywhere else (that tap still does what it
  would: no swallowed tap), Esc (focus back on the leaf), any sheet opening or もようがえ, and a pick: a pill's tap
  is a press squash, the villagers glance up (R18) and its sheet grows out of the pill's icon (Sheet's `pop`, as
  けんこう); once that sheet has closed, the focus goes back to the leaf (`preventScroll`; the pill is inert by then,
  so the dialog's own return would drop it to the page's top). Folded, the pills are `visibility: hidden` and `inert`: no focus, no taps, out of placement.ts' guards (a
  balloon may stand there). The column is out of the row's flow, so the HUD's box (`.ribbon-wrap`, which the 3D
  island measures for the sky) stays the row. Reduced motion: the pills fade in and out where they stand, the leaf
  doesn't tip.
  - Why (the design pass, 2026-11-03): a game UI view (NH's island view keeps its corners to a few objects; a
    phone-style drawer, not a second row), an iOS HIG view (one cluster at the thumb's reach of the top, ≥ 44pt
    targets, the safe area, a disclosure that says so with `aria-expanded`, labels beside icons, outside tap and
    Esc to dismiss) and an accessibility view (focus order = reading order: the dumbbell, the bowl, the leaf, then
    its pills; nothing hidden reachable; reduced motion honoured; text on cream, never on the sky).
    The pills drop down rather than slide left: sliding left would cover the sky's middle (the sun, the moon) and
    put the pills before the leaf in the reading order; under the leaf they're over the island for a moment only.
    The ベル row is first (the most used: the wallet), the rarer one (せってい) the furthest.
- **Health button** (`island/HudHealth.svelte`): a small cream pill 44px tall with the cream lip, 60px wide, NH's red
  dumbbell (`items/dumbbell`, NH's catalogue icon) across it, its plates a little over the ends; no number (the numbers
  live in the popup), the cluster's left end. Tap → the villagers glance up at it
  (R18, to the right) and [けんこう](#kenkou) grows out of the dumbbell (`health/HealthSheet.svelte`, Sheet's `pop`: a live CSS zoom
  about the button, no View Transition: its snapshot of the banded ground striped on iPhone).
- **Meal button** (`island/HudFood.svelte`): the health button's pill with NH's ramen bowl (`items/dinner`), between
  the dumbbell and the leaf. Tap → the villagers glance up at it (R18) and [ごはん](#gohan) grows out of
  the bowl (`food/FoodSheet.svelte`, Sheet's `pop`).
- **Coins** (`island/HudCoins.svelte`): each newly met goal flies up as a +1 coin from its fruit into the leaf (+2 with
  its がんばり; `CoinFlow`), the leaf squashing as each lands (the menu open: into the ベル row's number, which squashes
  instead); the ベル row's number holds while coins are in the air (`coinsInFlight`) and counts up by each one as it
  lands. As each lands, today's ベル so far pop up just under the leaf, right-aligned to the screen's side, in a small
  yuzu bubble (「+3」, counting up with the coins; the menu open: left of the ベル row), hold ~1 s and fade (reduced
  motion: a plain fade; aria-hidden: the label says it); only coins landing flash it, never a とりけす's refund. All of
  it waits while something covers the scene. The leaf, not the bowl or the dumbbell: it is where the ベル live now,
  and the corner it sits in is where NH's own bells pickup flies (up to the phone's corner).
- **Centre stage:** the plaza (`world.ts` `CENTRE_STAGE`, ひろば: `layout/spots.ts` `stageOf`, where the members put
  the visitors' spot in the もようがえ, else a clear patch of lawn behind the villagers' spots, in view as the island
  opens), where visitors stand.
- **Villagers:** a tap on mine is a squish; a tap on the partner's is a high-five ([Villager taps](#villager-taps)).
  Neither opens a sheet.
- **Say button** (`island/SayButton.svelte`): a small round cream button at the scene's bottom right, NH's chat glyph
  (a speech bubble with three dots, soft ink), 36px drawn in a 44px target, 12px in from the side and above the home
  indicator; over しずえ's box while she speaks. It opens the phrase picker above it (a phrase shows over my villager
  on both phones). Hidden under a sheet, the panel or the harvest, a tree's popup, and in もようがえ. The guest has it
  too, and the tent and the homes have it ([The tent](#the-tent) "Phrases"). Nothing else lives at the bottom right (the partner's edge face and the catch plates' stack are centred; the stack keeps the button's room on both sides).
- Controls are real buttons with `aria-label`, ≥ 44px (villagers 64px); focus order = visual order.

### Wallet

ごほうび, the island panel (`wallet/Wallet.svelte`, `wallet/Shop.svelte`), top to bottom:

- **The header row:** the jar at the left (`Jar.svelte`, 58–76px wide, filling as the wallet grows: `walletFill`); to
  its right the balance, big, and under it, smaller, today's ベル in a soft yuzu pill with the Bells bag (「きょうの ベル
  +6」: both of us, がんばり and ふたりでぜんぶ included, the number the trees' popups add up to), at 0 a faint cream one
  (shown, not hidden: nothing jumps when the first coin lands). The two as one group centred in the row.
- **The rewards:** two tiles with NH item art (6px under the tile's top: the art has its own air), its name and its price: 🍦 おやつ 40 ベル and 🍜 外食 70 ベル. One the
  wallet can't cover is sunk (a tap boops). At each tile's top-right a small round ⓘ (a 24px soft-brown disc, a 44px
  target by its `::after`, `aria-expanded`) shows what counts as that reward (「たこやき・アイス・あんみつ…」) in a little
  cream speech bubble hanging from it over the tiles' art, as wide as the two tiles (a tile's width broke the list after
  every ・ at 320px; its tail under the disc, NH's bounce in); ⓘ again, a tap
  anywhere else or Esc (only the bubble: the panel stays) folds it, one at a time. No examples and no 「あと N ベル」 on
  the tiles (2026-11-03, the user: "remove the example items - replace with a small circle info button … to save
  space. remove the ato x bell text"). 買う！ asks first, applies at once and waits 5 s with とりけす before it is sent.
- **ためた ベル:** the ベル ledger ([Kiroku](#kiroku)), under the rewards; a day pushes a level.
- **かいもの きろく** (`wallet/Purchases.svelte`), at the very bottom, folded by default: its heading is a 44px
  disclosure (「かいもの きろく 3件」, a chevron that turns, `aria-expanded`) and the list grows open under it (a
  280ms grid-row ease, WebKit animates it; reduced motion: at once), folded again on every opening of the panel.

The buys list newest first (art, name, day, who, price), ten at a time
(「もっと見る」). 🗑 on any line (either of us, any buy; ✕ is only ever a close) asks NH-style (「このかいものを けしますか？ 40 ベル もどります」);
はい sends a `spend_void`, the ベル go back, and the banner carries とりけす for 5 s. The old `/jar` page redirects to the
island with the panel open on ごほうび (`?panel=rewards`, dropped from the URL once read).

### Panel

The HUD menu's 「ベル」 row → the island panel slides down from the top (`panel/IslandPanel.svelte`): title 「ごほうび」,
full height, no tabs: [the wallet](#wallet) (the jar and the balance, today's ベル, the rewards, the ベル ledger, the
buys). Every opening starts at its top. Its own chunk, loaded on the first tap. The goals are けんこう's
([Kenkou](#kenkou)), the ずかん the HUD menu's.

A day of the ledger pushes a level with ‹ (the wallet stays mounted under it, hidden, so ‹ comes back to it as it was,
scrolled where it was); ✕, the backdrop and Esc close the panel.

**せってい** (`panel/SettingsSheet.svelte`): the HUD menu's せってい pill → its own sheet, full height, grown out of the
pill (Sheet's `pop`), title せってい: **すがた** (the look's portrait, the よびな and what's worn: いつもの, a コーデ's name
or the villager's; かえる → [the すがた level](#sugata): the closet and the villagers in one dresser), **プロフィール** ([Profile](#profile)), **サウンド** ([Sound settings](#sound-settings)), **ことば** (日本語 /
English), **きせつ** ([Seasonal preview](#seasonal-preview)), **てんき** (ほんもの / ゲーム: [Weather](#weather)), **フレームレート** (30 / 60: [Frame rate](#frame-rate)), **つうしん** (when each of us last synced; いま つうしん; not the guest's), and **もようがえ** (one row with its
はじめる; not the guest's). すがた pushes a level with ‹; ✕, the backdrop and Esc close it,
and the next opening starts at its top. Its own chunk, loaded on the first tap.

<a id="sugata"></a>**すがた** (`look/LookPage.svelte`, `look/LookStage.svelte`, `look/tabs.ts`, `look/ClosetGrid.svelte`,
`look/VillagerGrid.svelte`, `look/closet.ts`, `store/look.ts`, `e2e/look.spec.ts`, `e2e/picker.spec.ts`;
[design/avatar/sugata-ux.md](../app/design/avatar/sugata-ux.md), the redesign of 2026-11-05, after
[customization.md](../app/design/avatar/customization.md) §3): one dresser, NH's wardrobe layout. Each person's NH human
player or a villager, the whole closet free (no ベル, no shop, no unlocks), for A, B and the guest alike. One pushed level,
no foot bar: the stage and the tabs hold still, the panel under them scrolls to the screen's foot.
- **The stage** (262 px): the final form, always: the 3D player filling it (drag turns, tap hops; 「↔ まわせるよ」 until
  the session's first drag) or the villager's official render. Top-left the **status pill**, in words (`role=status`):
  「★いつもの」, a コーデ's name when what's worn is exactly it, 「ふゆ · アレンジちゅう」 when started from one and changed,
  「コーデなし」, or 「むらびと · ことの」 (the guest's: 「★いつもの · ことの」). Under it **もどす** once anything changed this
  visit: the look and the villager as they were on opening. Top-right the nameplate 「ウェイ ✎」 (yuzu): the よびな sheet.
  Along its bottom the **colour dots** of the item last tapped (else the one worn in that grid), or めのいろ (かお → め),
  かみのいろ (かみ): one row of 44 px targets, radios named by their hue (「あか」, numbered when two share one); the figure
  shrinks to make room, the grid never moves. Hidden on コーデ and むらびと and for a one-colour item. Once the panel
  scrolls past 8 px the stage eases to 150 px (back at the top, back to 262); while the villager search has the keyboard
  it's a 76 px strip (the head, the name, its kind). The figure scales by a transform (the canvas keeps its size).
- **Six tabs** (`role=tablist`, icon and name, the picked one yuzu with the edge and lip; ←/→ move): **コーデ · かお ·
  かみ · ふく · こもの · むらびと**. It opens on コーデ when any is saved, else ふく. A sub-row (segmented, 44 px) where a tab
  has one: かお め · くち · はな · ほお · はだ; ふく トップス · ボトムス · ワンピース · くつした · くつ · ぼうし; こもの めがね ·
  かみかざり.
- **コーデ**: a 4-column grid of 64 px portraits: **★いつもの** first (the signed-off default, never stored; the guest's is
  its villager), the saved ones newest first, **＋ ほぞん** (a name, 「コーデ 3」 by default, 1–12 characters; at 20 it's sunk
  and says 「コーデは 20こまで。いっぱいだよ」; a villager worn: 「むらびとの すがたは ほぞん できないよ」). The one picked has the
  leaf ring, and a coral dot once what's worn differs from it. A saved one picked shows its actions inline: 「「ふゆ」と
  ちょっと ちがうよ」 with **いまので うわがき** (only when edited) · **なまえ** · **けす** (「この コーデを けしますか？」, then
  とりけす on the banner for 5 s: sent after).
- **The closet** (かお, かみ, ふく, こもの): NH's wardrobe grid, five a row, a tile per item showing its variant worn or last
  chosen; a tap wears it and puts its colours on the stage; the worn tile again does nothing (only なし takes a thing
  off). なし first for くつした, くつ, ぼうし, めがね, かみかざり. ふく has a colour filter (すべて, then nine hue dots, sideways,
  per sub for the visit). A ワンピース clears the bottoms, a bottom the ワンピース; a hat and a hair ornament are one at a
  time. はな, ほお: three chips; はだ: the skin dots in the panel. No names: a tile is 「トップス 3、いろ 4しゅるい」 to
  VoiceOver.
- **むらびと**: the search (held at the panel's top), then とくべつ (23) and the 417 villagers, the heads lazy (one
  IntersectionObserver on the panel), built a slice per frame on the tab's first opening and kept after. A tap wears
  that villager on the stage. With a villager worn, the human tabs carry a yuzu strip 「いまは ことのの すがた。ふくを
  えらぶと にんげんに もどるよ」; the first human pick wears the player again with this visit's human edits.
- **Sending:** what's tapped is the draft on the stage. Leaving the level (‹, ✕, Esc, the backdrop, or the app going to
  the background) keeps it, sent once and only if it changed: one `look` pref, and a picked villager's `villager` pref
  first (the guest: `villager`, then `look: null`, its いつもの). A member's いつもの is sent as null. Leaving with a change
  shows 「すがたを かえたよ」 with **とりけす** for 5 s (it re-sends the look and the villager as they were on opening).
  No けってい (✕ keeps, as NH's wardrobe). コーデ edits go out as they're made, the whole `savedLooks` list
  ([backend](backend.md#events)).
- **The closet is the part table's** ([Players](#players): `player3d/parts.json`, through `look/closet.ts`'s `Closet`
  interface): every hairstyle, eye and mouth, and each garment line a tile with its colours as dots, in the table's
  order. The table has no colours, so `scripts/look-swatches.ts` (`npm run look:swatches`, after `players3d`; dwebp)
  measures them into `look/swatches.json`: per item its texture's dominant colour over the pixels its own among its
  line's colours (a loafer's sole, a shirt's buttons are every colour's; a sock's foot, not its cuff), lifted a little
  (gamma 0.85: the textures are albedo); per catalogue icon its own. The dots and the colour filter use them. A tile is
  the line's catalogue icon (`static/art/finds/items/<icon>.webp`, one per line, drawn in one of its colours): on the
  colour nearest the icon's it shows as it is; on the others it's tinted (grey, brightened so its main colour reads near
  white, times the swatch, masked to its shape; a tube sock's stripes tint with its leg). A face part's or hairstyle's
  tile is its number. closet.test keeps both いつもの looks' parts, every grid non-empty and every swatch measured.
- **The preview in 3D** (`look/LookPreview.svelte`, `look/preview3d.ts`): the look as NH's human player
  (`createPlayer`, [Players](#players)) on the stage's canvas (a ResizeObserver re-frames it when its box changes:
  `setSize`, the camera's aspect, never a new renderer), idling and blinking; every edit is `dress()`ed on
  in place; a drag turns it (a flick spins a little, it stays turned 2.5 s, then eases back to the front), a tap hops it.
  Its renderer, made when the level opens and let go of when it closes (the player, the portraits' player, the
  renderer, `forceContextLoss`), is the level's one WebGL context (the island's sleeps under the sheet, as for the
  tent). Frames on demand, at most 30 a second: only while the player moves (a step or a blink says so) or turns; none
  hidden. three.js and the player come in their own chunk on opening; until they're up (or with no WebGL, or a part
  missing) the flat stand-in (`look/PlayerFigure.svelte`) stands there. A villager is its official render (the 3D kept,
  hidden, for the portraits). The logic mode builds it and draws nothing.
- **Portraits** (`look/portraits.svelte.ts`, `look/LookPortrait.svelte`): a player's round head (the コーデ chips, the
  せってい row) is `portrait()` through the preview's renderer (a second player kept for the shots, never a second
  context), 128 px, kept by the look's hash in localStorage, each head its own entry (`look.portrait.<hash>`;
  `look.portraits` the hashes, the latest 24; quota: fewer, never the user's data's room; the old one-list format split
  on first use), and in memory only as a head is asked for (24 at most, the least recently asked for let go). Nothing
  is read as the module loads. Asked for as a chip shows, and the look being edited 0.7 s after its last edit,
  so the せってい row has it once the level is closed (outside すがた nothing draws them: a look never drawn shows the
  stand-in). iOS Simulator (iPhone 17 Pro, iOS 26.5, a local build's demo, すがた open over the island): idle 59 fps,
  frame p95 17 ms, 1 long frame in 5 s, no errors.

<a id="profile"></a>**プロフィール** (`panel/ProfileSection.svelte`, `model/profile.ts`, `e2e/profile.spec.ts`; the user: "store the
user's gender and birthdate so that the calculations and recommendations can account for that"): one card. Whose, in
けんこう's dropdown (the two members, this phone's first; the guest has no dropdown: its own only) with the age at the
right (「29さい」, by the Tokyo day); せいべつ (おとこ · おんな · ひみつ: unset), たんじょうび (a native date field,
1900 … 10 years ago) and BMIの めやす (アジア, the default · WHO; not the guest's: no body data). Under them, a member's:
「身長 … cm（体重と BMI から）・基礎代謝 … kcal・1日 約… kcal」 and ごはん's suggested goals (kcal, protein with 1食 a
third, salt), or what is still missing; then who sees it (「ふたりだけに みえるよ」 / the guest's 「じぶんだけに」).
Prefs on the record ([backend](backend.md#events) `sex`, `birth`, `bmiStd`): either member sets either's; private to the
two members (the guest's to the guest), enforced by the record. What it feeds (decisions: *Profile*):
- **Height:** from Health's own BMI: √(weight ÷ BMI) of the latest day with both (the Shortcut sends both; no height pref).
- **Energy:** resting by Mifflin–St Jeor (10 × kg + 6.25 × cm − 5 × age, + 5 a man, − 161 a woman), the latest
  weigh-in; daily = resting + the average Move (Apple's active kcal) of the last 28 days with a Move and the Watch worn
  (at least 7; a day with Move, Exercise and Stand all 0 is a day without the Watch, not one at rest: `model/health.ts`
  `activityOn`), else resting × 1.4; kept within 1.2–2.2 × resting.
- **ごはん's defaults** ([Gohan](#gohan)), only while no goal is set: kcal the daily energy, less 15 % while the goal weight is
  more than 0.5 kg under the latest weigh-in, never under the resting energy nor 1,500 (a man) / 1,200 (a woman), up to
  a 50; salt 日本人の食事摂取基準（2025年版）'s ceiling, 7.5 g a man, 6.5 g a woman (from 15); protein 1.6 g × the
  weigh-in, at least the 推奨量 (65 g a man, 60 from 65; 50 g a woman). Registered as the goals' `derived` defaults
  (`contract/goals.ts`).
- **BMI's category** on the BMI card ([Kenkou](#kenkou)).

### Kiroku

The ベル ledger (`model/history.ts`, `components/kiroku/*`), read-only, in [ごほうび](#wallet) under the rewards
(「ためた ベル」):

- **ベル:** by week (earnings only; the all-time total isn't repeated here: the wallet is ごほうび's) one line per day under the two avatars: each person's four
  fruits (bright = met), a star on a ふたりでぜんぶ day, the day's ベル (tap → the day); on a がんばり day a smaller second
  line with each person's がんばり ベル.
- **Day:** ふたりでぜんぶ (+2 or —), then each person: the day's ベル and per goal its value (green when met, the
  「がんばり」 chip at 1.5×) and +1, then any がんばり row, like the tree's popup.

### Kenkou

けんこう (`model/health.ts`, `components/health/*`, `e2e/health.spec.ts`): the health popup (the HUD's dumbbell; full
height like the panel, title けんこう and ✕; ✕, the backdrop and Esc close it): the
Health data over time for the personal trainer, one person at a time, computed on read, each card with its goal. Its code and strings load with the first opening.

- **The selectors** (the user: "move the user selector to the left of the title in the same row … move the time
  period selector to the same row as katsudou and karada"). Whose data sits in the title bar, left of けんこう
  (NavBar's `lead`: the title stays centred, ✕ at the right): one native
  `<select>` (iOS's own picker; a cream pill ≥ 44px with a chevron, 16px type so Safari doesn't zoom; 「だれの データ」),
  compact (`Pick` `compact`: the avatar, the name, a stroke of their colour; at 320 the name without the avatar).
  The two members, this phone's person first and chosen on opening, kept for the session. Then one row: かつどう ·
  からだ, two pills, each with an NH icon (`art.ts` GROUP_ART: the cute sneakers, the dreamy bear toy), and the
  period beside them, a dropdown as wide as its longest option (「きかん」: 1週 · 1か月 · 3か月 · 1年). 1週 and
  かつどう on every opening; switching either keeps the other, the range and whose data; the guest has no switch
  (かつどう only), the period alone at the row's right end.
- **Then** a sticky row: ‹ the visible range (「10/2–10/31」; 「1日ごと」 / 「1週ごとの 1日平均」 / 「1か月ごとの 1日平均」
  under it) › and きょう.
- **Cards, per group** (`model/health.ts` GROUPS and CARDS, the user's "activity metrics and body metrics"): かつどう
  🍎 歩数, 🍐 ムーブ, 🍑 エクササイズ, 🍒 スタンド (then the footnote); からだ 体重, 体脂肪率, BMI, 除脂肪体重 (what a
  scale writes at one weigh-in). As each activity card has its fruit, each からだ card has a catalogue icon
  (`art.ts` BODY_ART, 24px, decorative: the heading names it): 体重 the red kitchen scale (a scale, but NH's, and
  readable on the cream and the night cards), 体脂肪率 the protein shaker, BMI the exercise bike, 除脂肪体重 the
  weight bench (muscle): the user's picks.
- **One card for every chart** (`ChartCard`: the icon, the name, the goal chip at the upper right: [Goals in place](#goals-in-place);
  with nothing recorded yet, 「まだ きろくが ないよ」 under it). **A card per activity metric** (`BarCard`): 1日の平均 with 前の期間より ↑/↓ %;
  目標 n/N日（%）, ベスト and 記録なし n日; the chart; a one-line key.
- **No Health data yet** (a new couple, `?demo&health=none`): every card is still there with its goal chip (set from it),
  over one line, 「まだ きろくが ないよ」: no numbers, chart or footnote.
- **Chart** (`BarChart` in `ChartFrame`, SVG; the frame is every chart's: the grid, the dates, the goal line and its words, the
  slide and drag, the picked bucket's band and callout): a bar per day (1週, 1か月), per week (3か月: 13) or per calendar month (1年), each
  the bucket's daily average, in the person's colour (ウェイ blue `--person-a`, うめ orange `--person-b`); solid when
  the goal was met the goal's way (at least / at most / near: [Goal directions](#goal-directions)), paler the fewer of its days did; today outlined; a finished bucket with no row gets a short hatched stub (記録なし).
  The goal dashed (stepped when it changed) with its words over its right end, as the chip reads them (「目標 8,000歩 以上」); the axis always reaches it. On 1週 each bar carries its value. A tap shows one value; a
  horizontal drag turns the page (right = older); vertical drags scroll the panel.
- **体重 · 体脂肪率 · BMI · 除脂肪体重** (`BodyCard`, `DotChart` in `ChartFrame`; one card for the four): each its own goal at the upper
  right (`goalWeight`, `goalBodyFat`, `goalBmi`, `goalLean`, each optional), 平均 (n回の記録; BMI's with its category by the
  person's standard, 「普通体重（アジア基準）」: under 18.5 低体重, then アジア 23 過体重 and 25 肥満 (JASSO, WHO's Asian
  cut-offs) or WHO 25 and 30; [Profile](#profile)), 期間の変化 ([Weight](#weight): the
  plain change in the card's unit, `−0.4%`, `+0.2`, `−0.3 kg`) and per week, the dot chart on an axis fitted to the values (at
  least 2 kg or 2 points of body fat, 1 of BMI; 2–5 grid lines at a round step) with the goal dashed yuzu and its words
  (「目標 66.0 kg 前後」), or at that edge with ↑/↓ when far off, and the goal month at that pace (only when the period ends today;
  the goal's way: reached once under a ceiling, over a floor, or near a value). A day with no measurement has no dot; 記録なし when the
  period has none. Never earns, no good / bad colours on the dots.
- <a id="goals-in-place"></a>**Goals in place** (`GoalEdit`, `health/goals.ts` GOAL_SPECS over the registry `contract/goals.ts`
  GOALS; the user: "for every single graph that we show in gohan and kenkou, I want to be able to set a goal"): every
  chart's card has its goal at the upper right as a chip, 「- - 目標 8,000歩 以上 ✎」: the value with its direction (以上 /
  以下 / 前後; "at least" / "at most" / "about"), the swatch the chart's goal line (soft on the bar charts, yuzu on the dot charts);
  「目標 まだ」 when none. A tap opens its editor in place: a tan
  tray across the card under the header, its notch under the chip (the chart moves down; nothing is covered, and Safari
  scrolls the field above the keyboard): the goal's title (with きょうから for the goals a day keeps), −/＋ by the goal's
  step around a 16px field with its keypad (nothing focused on opening, so no keyboard until the field is tapped; −/＋
  start from the goal, else the period's average for the からだ goals), the range in words (「10〜600分、10分ずつで入れてね」,
  coral after a refused けってい), then 目標をなくす (once set, for the goals that may be cleared), やめる and けってい (dimmed until the field
  holds a goal). One open at a time; Esc, やめる or a tap anywhere else close it unchanged, the focus back on the chip;
  saved, a banner says so (「エクササイズの目標を かえました」). The same control sets ごはん's goals ([Gohan](#gohan)). The goals, per person, for whose data is shown (either
  person sets either person's):
  - かつどう, each from today on (a day keeps its own; the chip shows the goal at the period's end, the editor starts from
    today's): 🍎 歩数 1,000–30,000 in 500s (8,000 until set), 🍐 ムーブ 100–2,000 kcal (−/＋ by 10; ウェイ 600, うめ 400
    until set), 🍑 エクササイズ 5–300 min in 5s (60 until set), 🍒 スタンド 10–600 min in 10s (120 until set). The ベル keep
    Exercise and Stand at the fixed 60 / 120 ([Goals](#goals)): their editor says so (「きょうから · ベルは 60分のまま」).
  - からだ, one decimal in a decimal field, clearable, shown only, never earn (±0.5): 体重 20–300 kg, 体脂肪率 3–60 %,
    BMI 15–40, 除脂肪体重 10–150 kg.
  - The guest's phone: the chips read-only (and no からだ card, so no からだ goal: the record never sends it one).
- <a id="goal-directions"></a>**Goal directions** (`contract/goals.ts` GOALS `dir`, why: [decisions](decisions.md#goal-directions)):
  at least: 歩数, ムーブ, エクササイズ, スタンド, 除脂肪体重, たんぱく質, 食物繊維; at most: 体脂肪率, 脂質, 塩分, アルコール; near a value
  (前後, met within a band): 体重 (±1.5 %), BMI (±4 %), カロリー (±10 %), 炭水化物 (±15 %). The chip, the chart's line
  words, the bar shading, 目標 n/N日, ごはん's tiles and the goal month all follow it.
- **Rules:** a day's value is Health's latest, as reported: every day with a row counts, whatever its value; 記録なし is
  a day with no row (counted from the first activity record); today is drawn but not counted; the previous period is
  the same length just before. The footnote says so.
- **A day without the Watch** (the user, 2026-11-05: "treat as missing"; [decisions](decisions.md#no-watch-days)): the
  Shortcut sends `0` when Health has no samples, so such a day arrives as Move 0, Exercise 0, Stand 0 with the phone's
  steps. A day whose three watch metrics are all 0 or absent is read as no data for them (`model/health.ts` `noWatch`,
  `activityOn`: the one reader of a day's activity, for the series, bars, averages, goal days and the TDEE's Move): the
  stub and 記録なし, as a day with no row; steps stay (the phone's). Any of the three above 0 (Stand 9) is a worn day,
  its zeros real. Read-time only: the stored rows stay. The ベル, the tree popups and the stretch need no such rule (a 0
  and a missing value earn and show no fruit alike: `scoring/bells.ts`). `?demo&health=zero` sends the demo's no-watch
  days as 0/0/0.
- **Cost:** the tab's code and strings (`i18n/kenkou.*.json`) load with the tab; the daily series is memoised per
  model and day. `?demo&weeks=60` makes a longer history with some missing Watch days.

### Gohan

ごはん, the meal log (`model/food.ts`, `components/food/*`, `lib/food/`, `e2e/food.spec.ts`; the data in
`static/food/`, built by `food-data/`: [food data](food-data.md)): the HUD's bowl button (NH's ramen bowl,
`items/dinner`, set 3px below the pill's centre so the bowl, not its nori, sits mid-pill) grows it out
of the bowl like けんこう (full height; whose day, title ごはん and ✕; ‹ in whose place while a level is open). What each of us ate, typed in by hand; it never earns ベル.
Everyone sees everyone's meals, the guest's phone too; only the owner changes an entry. Its code, its strings
(`i18n/food.*.json`) and the food data load with the first opening (the data with the first search, or a moment after my day shows a catalogue entry: 最新の値にする).

- **Tabs:** first, right under the title bar (stable across tabs), けんこう's group switch (`ui/Segmented`, a list
  of tabs: `Food.svelte` TABS): きろく (on each opening; its icon NH's rice cooker, `art.ts` FOOD_TAB_ART) · グラフ (`FoodChart`). Under it, per tab: きろく the day row, グラフ the range row
  with the period at its right end, beside きょう. Switching whose keeps the tab. Recipes and custom foods have no tab: a meal's search is the way in.
- **Whose day (きろく, グラフ):** in the title bar left of ごはん, as けんこう's (the same compact pill): this phone's
  person first, then the others (the guest once it has logged a meal, or on its own phone); kept for the session.
  Then (きろく) a sticky row: ‹ the day (「11/4(水)」) › and きょう; › goes past today only to tomorrow, and only when a
  いつもの fills it (read-only: a look at what comes).
- **Summary card:** この日の カロリー, the day's kcal large; the person's kcal goal at the upper right (「- - 目標 2,200
  kcal 前後 ✎」, set there on my day: けんこう's [goals in place](#goals-in-place)) and, with one, a bar in the person's
  colour and, today, あと N kcal / N kcal オーバー, a past day 目標より N kcal 少なめ / 多め; coral only past 20 % over
  (the lifter's surplus is no fault). Then たんぱく質 · 脂質 · 炭水化物 · 塩分 in grams, each with its goal and direction when there is
  one (「目標 110 g 以上」, 「目標 60 g 以下」, 「目標 250 g 前後」, 「目標 7.0 g 以下」; set on グラフ; it wraps only after 目標) and a small bar, coral once past
  a ceiling (an at-most goal, or a near-a-value one past its band: `goalOver`); then 食物繊維 (「–」 データなし while no entry
  knows its fibre: an older entry, most products) and, on a day with any, アルコール. Under them the **PFC balance**
  (`PfcBar`, `model/food.ts` pfcShare): protein, fat and carbohydrate as shares of the energy (their Atwater kcal 4/9/4 over
  their sum, alcohol at 7 a share of its own, so the bar is whole), one bar (leaf, yuzu, mint; alcohol lilac), each
  share's % with the 食事摂取基準 2025's 目標量 (13–20 %, 20–30 %, 50–65 %: `PFC_RANGES`): within it ✓ and the range in
  leaf text, else ひくめ / たかめ（range） (never coral: a day off balance is no error). A day with nothing logged: no tiles; a past one 「きろく なし」 (not 0 kcal).
- **Goals** (the registry `contract/goals.ts` GOALS, prefs per person, as the health goals: [backend](backend.md#events)): kcal
  1,200–5,000 by 50 (the record takes 1,000+), protein, fat and carbs in g by 5 (10–400, 10–300, 20–800), salt 1–20 g
  by 0.5, fibre 5–60 g and alcohol 1–100 g by 1 (−/＋ by 1 and 5); each set and cleared (目標をなくす) with けんこう's control (`health/GoalEdit`, `health/goals.ts`
  GOAL_SPECS) on my own cards only, anyone else's shown read-only (the guest has its own). Directions: kcal near a value
  (±10 %: a low day is no win, the lifter's surplus no fault), protein at least, fat at most, carbs near a value (±15 %), salt at most
  ([Goal directions](#goal-directions)), fibre at least, alcohol at most. **Defaults:** protein
  1.6 g × the latest weigh-in (a lifter's usual aim; a member with a weight, until set, and again once cleared:
  「なしなら 体重×1.6 g」; at least the 推奨量 with a profile); with a profile ([Profile](#profile)) kcal from the daily
  energy and salt the 食事摂取基準's ceiling by sex (「なしなら からだと 活動からの めやす」, 「なしなら 食事摂取基準の めやす」);
  fibre the 食事摂取基準 2025's 目標量 by sex and age (men 20 g, 22 from 30 to 64; women 18; 「なしなら 食事摂取基準の めやす」);
  alcohol 20 g for everyone (厚労省's 節度ある適度な飲酒: [decisions](decisions.md#fibre-and-alcohol-2026-11-05)); none for fat and
  carbs (they depend on the plan). A default never overrides a goal that's set.
  **Warn, allow** (the user, 2026-11-05; [decisions](decisions.md#low-kcal-goals-warn-allow)): a kcal goal typed under my resting energy (with a profile,
  [Profile](#profile)) gets a gentle note under the field, 「きそたいしゃ（約1,630 kcal）より ひくい めやす です。きんにくが
  へりやすく なります」; else under the safe floor (1,500 a man, 1,200 a woman or unknown), 「1日 1,500 kcal より ひくい
  めやす です…」 (`model/profile.ts` `lowKcal`, `health/goals.ts` `kcalWarn`, GoalEdit `warn`: on the summary's and
  グラフ's kcal chip). Never coral, never blocking: けってい still saves it. No note for the other goals.
- **Meals:** 朝ごはん · 昼ごはん · 夜ごはん · おやつ, a card each with its kcal, under its header (with entries) its protein as
  a chip (「たんぱく質 28g」, the leaf's once at the per-meal aim: `profile.ts` mealProteinTarget, a third of the day's
  protein goal, at least 20 g; 25 g with none; the aim in its spoken words), and a row per entry (the food, its
  amount in one format, a weight once: 「茶碗1杯（150g）」, 「1パック（110g）」, 「中ジョッキ×2（700ml）」; kcal). On my
  day ＋ → the search (its field focused in the same tap, so the iPhone's keyboard comes up), an entry → its amount
  at once (from its snapshot: its own portion; the catalog's portions swapped in when they come); anyone else's day is
  read-only. Levels slide in (240 ms, as けんこう's); ‹ comes back where the day was scrolled, the focus on what
  opened it. Confirmations are short (「夜ごはんに ついかしました」) and docked low, never over the level they land on.
  **最新の値にする** (the user approved, 2026-11-05; `fresh.ts`): an entry keeps its food as logged, so a data fix (or
  an edit of its recipe or custom food) never changes it. On my day, an entry of mine (not a いつもの's) whose food is
  now otherwise beyond rounding (the catalogue item with its id, its recipe or custom food now: kcal past ½, a nutrient
  past 0.05 g or become known or unknown; fibre and alcohol only when both know them, so an entry from before them isn't
  flagged for that alone; not when it now logs by the serving or by weight instead) has a small leaf-text link under its
  row, 「最新の値にする（729→765 kcal）」: a tap re-snapshots it (its day, meal, grams and portion kept: an ordinary edit,
  `refreshFood`), 「「…」を 最新の値に しました」. Nothing is ever updated by itself; anyone else's day never offers it. The
  catalogue loads for it a moment after my day shows an entry of it (it is the search's data too; the products when
  they come).
  **Several foods a trip** (the user approved, 2026-11-05): a new entry logged from a meal's search (its amount's
  ついか, a recipe's or a custom food's) comes back to that search, not the day: the field cleared and focused in the
  same tap (the keyboard stays up), and under it 「ついかした もの（n）」, this trip's entries (each with ✕: removed at
  once, it was only just logged) and おわり (the day). Each food row of a meal's search (the catalog's, さいきん's,
  マイ食品's) has its own ＋ beside it (FoodMeal's ＋ object): one tap logs it as it comes, its default portion (a recent
  one as I had it; a custom food by its serving), no amount level.
  **Copy a meal** (the user approved, 2026-11-05): on my day an empty meal offers, as small links under its header
  (いつものに する's weight), 「きのうと おなじ」 (my own the day before; 「前の日と おなじ」 on a past day) and 「〇〇と おなじ」 for
  each other person whose same meal that day has something (the partner, the guest: everyone sees every meal), each
  with what it holds (「2品 322 kcal」; `model/food.ts` copySources). One tap copies it in: each item (a いつもの's too) a
  new entry of mine, its snapshot as logged (`store/actions.ts` copyMeal: ordinary `food` ops, nothing new on the
  record); its banner (「昼ごはんに 2品 コピーしました」) has とりけす.
  **クイック** (quick add, the user approved 2026-11-05: eating out, kcal is all you know): in a meal's search, ⚡ クイック
  ついか（カロリーだけ） under the つくる row (hidden while typing, as they are) opens the form, its kcal field focused in
  the tap: なまえ (blank: 「クイック」), カロリー (needed) and the nutrients (each optional), then ついか: one entry by the
  serving (「1食」), back to the search's trip. A kcal typed in the search (「650」, 「６５０kcal」: foodUi.ts typedKcal)
  offers itself above the catalog's rows as 「クイック 650 kcal」: the row opens the form with it, its ＋ logs it at
  once. Nothing is saved as a マイ食品: the entry's snapshot is a custom food's form with an id of its own
  (`quick:<id>`, `sv`: foodUi.ts quickSnap), so the record takes it as it is (no relay change).
  **Tap counts** from the open sheet (e2e food.spec, Playwright WebKit as an iPhone 15; before → now): the same meal as
  yesterday 3 a food from さいきん → 1; a new 3-item breakfast (ご飯 · みそ汁 · 卵) 9 + 7 characters → 5 + 7; a konbini
  lunch (おにぎり ×2 · サラダチキン) 8 + 10 → 6 + 10; a 650 kcal meal out 4 + 8 (a new マイ食品) → 3 + 3.
- **The week** (`FoodWeek`, `model/food.ts` foodWeek), after the four meals: さいきん 7日の 平均, the 7 finished days to the
  day shown (to yesterday on today: today is never finished; 「10/28〜11/3 · 記録 n日」), a day with nothing logged left out
  as グラフ's averages: the average day's kcal against the goal (目標の はんい within its band, else 目標より N kcal 少なめ /
  多め, so one big day reads against the week), its protein, fat, carbs, salt and fibre a day, and its PFC balance. None
  when those days hold no meal.
- **Search:** a 16px field (no search mid-IME composition), its ✕ the app's 44px lipped round button; under it, side
  by side (half the row each, on 393 px too), ＋ レシピを つくる (a meal's search only) and ＋ 食品を つくる, hidden once
  something is typed (room for the results over the keyboard; nothing found, its card has じぶんで つくる); empty,
  さいきん (my latest entry of each food, as I had it); typed, the best matches: the name, 「✓n 一致」 when n independent
  sources agree on its kcal (in words on the row: an iPhone never shows a title), a product's brand and kcal per 100 g, and its default portion (with its weight) and kcal;
  the same name, brand and kcal shown once. ー counts (カレー is not かれい). Offline: 「データを よみこめませんでした
  （オフライン？）」, もういちど, and さいきん still under it (a recent pick keeps its portion). **Ranking** (`food/search.ts`
  tierOf, each curated pop level worth 0.6 of a tier): the name exact, or its head (up to a bracket or space: 水 finds
  水（ミネラルウォーター）, ごはん finds ごはん（精白米）); then its prefix, level with an alias exact (a hair under it: たまご
  finds 卵 first, 鶏むね finds 鶏むね肉 before サラダチキン, whose alias it is); a substring of the name; an alias's prefix,
  a substring of one; any other field. A secondary dataset's items rank 1.5 tiers lower, a packaged product's (Open Food
  Facts, JBFD) 2. `food/load.test.ts`'s golden queries (55 common ones: ご飯 · みそ汁 · 卵 · 納豆 · 鶏むね · サラダチキン ·
  プロテイン · おにぎり · ラーメン · うどん · 水 …) pin the first result, and no product above a generic food in the top
  three. A keystroke's search over the 20k items takes ~0.7 ms in Playwright's WebKit on a Mac (expect 2–3× on an iPhone).
- **Amount:** the food's values per 100 g; its portions as chips (100 g last), −/＋ by a whole portion for the things
  counted (本 · 個 · 杯 · 缶 · 枚 · 切れ · 貫 · パック · ジョッキ …, and the 1人前 of a food eaten by the piece: おにぎり,
  むすび, ゆで卵, 目玉焼き, ハンバーグ …: foodUi.ts PIECE) and by half for 茶碗, 人前 and weights (±10 g once
  grams are typed), a grams field (ml for a drink; typing grams leaves the portions); kcal and P/F/C/salt live; which
  meal; ついか, or ほぞん / けす for my entry (けす at once, its banner's とりけす logs it again).
- **A level's actions** (the amount, マイ食品, マイレシピ, いつもの; theme.css `.level-acts`): at its end, held at the
  sheet's foot while the level runs past the screen and over the keyboard while a field is typed in; the action (leaf)
  takes the row's room, the cream ones (けす, レシピを ひらく, コピーして へんしゅう) their own.
- **いつもの (a repeat):** a meal eaten the same way on set weekdays. Its items fill each day it covers, marked with
  the drawn 🔁 (`RepeatMark`, not an emoji) on each row, and count like any entry; everyone sees them. Its days sit in
  the meal's header as a chip (毎日 · 平日 · 週末 · 月水金…), on my day a tap → the repeat level (`FoodRepeat`):
  the weekdays (毎日 · 平日 · 週末, then 月〜日 one by one; one stays on), what it holds with the kcal sum, and
  いつものを やめる (asked twice: ほんとうに やめる？; past days keep theirs), この日の内容を いつものに する (when that
  day's foods or amounts differ, not its entries' ids) and 曜日を ほぞん (both from tomorrow). On my today a meal with
  entries and no repeat ends with a small 「いつものに する」 link → the same level, 毎日 first, 「いつものに する」 (the
  day looks the same, its items now the repeat's). One name, いつもの, for the title, the chip, the marks and the
  verbs. Tapping one of its items opens it; ほぞん or けす changes that day only: the day leaves the repeat then (its
  items become its own, in one go; unmarked under the same chip); ‹ changes nothing.
- **グラフ (the グラフ tab;** what was eaten only; the calories burned are けんこう's 🍐 ムーブ card**):** its range row (`health/RangeNav`, `RangeLabel`, `RangePager`: けんこう's paging, swipe included) with けんこう's period dropdown (`health/Pick`) after きょう (the
  range's unit wraps in the narrower middle), then たべた カロリー (けんこう's `BarCard`, `BarChart` and `ChartCard`; `model/food.ts` foodSeries, one pass over the record up to today, read by
  health.ts's bucket and stat rules): a bar per day (foodDay's total, repeats included) or per week / month (the daily
  average of its days with a meal), in the person's colour, solid when the goal was met its way (as けんこう's; every bar
  solid without a goal); today outlined and uncounted; a day with nothing logged is
  記録なし (the stub, never a 0). 1日の平均（n日分） and 期間の合計 over the finished days with a meal; 目標 n/N日 (with a goal) · 記録 n日 ·
  記録なし m日; the goal at the upper right (GoalEdit) and dashed on the chart with its words, the average a flat solid line (「平均」 in
  the key). Then the same card for たんぱく質, 脂質, 炭水化物, 塩分, 食物繊維 and アルコール (grams, one decimal; foodSeries per
  nutrient from the same pass; salt's bars one decimal; a day whose entries none knows the fibre of is 記録なし on the
  fibre card, alcohol unknown counts as none), each with its catalogue icon (`art.ts` NUTRIENT_ART: the barbecue, the
  cream and sugar, the sticky rice, the spice rack, the veggie plate, the green bottles) and its goal; with nothing logged yet, each card its goal chip over 「まだ きろくが ないよ」
  (so the goals are set before the first meal).
- **マイレシピ:** everyone's recipes (`food_recipe`), in a meal's search: all after さいきん (the latest changed first),
  the matching ones above the catalog's; a row: its name, who set it and how many servings, a serving's kcal. One →
  the amount for the recipe as a food (1人前 first, ぜんぶ, 100 g; the search's meal), logging an ordinary entry of mine
  on the day shown; its 「レシピを ひらく」 (left of ついか) opens it. ＋ レシピを つくる (under the search's field) opens a
  new one. Mine opens in the editor (`FoodRecipe`): the name, なん人前 (−/＋, 1–20), the ingredients (each a row like a
  meal's; a tap → the amount: ほぞん / けす), ＋ ざいりょうを ついか (the search and the amount, no meal: ついか puts it in
  the recipe), 1人前あたり and ぜんぶで live, then けす (asked twice: ほんとうに けす？) and ほぞん (waiting until something
  changed); both go back to the meal's search. Anyone else's: the same read-only, 「〇〇の レシピ」, with 「コピーして
  へんしゅう」 (a recipe of mine, opened in the editor) and 「ごはんに ついか」 (back to its amount).
- **マイ食品 (the user: "create my own food and record its calories for future use in case there's a food not in the
  existing database"):** everyone's custom foods (`food_custom`, contract/food.ts `customSnap`), a food typed in as one
  serving. Both searches (a meal's and a recipe's ingredient) list them under マイ食品 (all after さいきん / マイレシピ,
  the matching ones above the catalog's); ＋ 食品を つくる under the field, and when nothing matches a card saying so with
  a line on what it is for and 「＋ じぶんで つくる」, open the editor, the typed text its name. The editor (`FoodCustom`): なまえ, 1食の めやす (「1食」 its
  placeholder, not a value: typing 1杯 gives 1杯; blank logs as 1食) and その重さ g (may stay blank: then it logs by the serving), カロリー kcal (needed) and P/F/C/塩分/食物繊維/アルコール g (only
  what is known), all per serving, full-width digits welcome; a weight too light for its values (denser than any food:
  `customDensityOk`) is refused before ほぞん. A new one made from a meal's search saves and logs one serving in one
  tap, 「ほぞんして ついか」 (back to the search's trip); one made for a recipe's ingredient goes on to its amount; a custom food's amount (from the search) has 「マイ食品を ひらく」: mine in the editor (ほぞん and けす,
  asked twice, go back to the search), anyone else's read-only with 「コピーして へんしゅう」 and 「ごはんに ついか」 (back to
  its amount). With no weight the amount steps whole servings, no grams field and no weight shown anywhere (the
  entry's snapshot says `sv`: 「1食」, 「1食×2」, a nominal 100 g a serving underneath; a recipe with such an ingredient
  logs by 1人前 alike).
- **データの出典** at the foot: each dataset's label, attribution and license (the data's licenses ask for it).
- Food names come from the data, so their kanji are not all in the trimmed Zen Maru subset: those fall back to the
  system font (the copy's own strings are covered: `npm run fonts:subset`).

### Sheets and harvest

- One sheet skin (`ui/Sheet.svelte`, a native `<dialog>`): tan paper, cream cards (navy at night), sticky title bar,
  one CTA in a sticky footer above the keyboard.
- **Harvest** (`sheets/HarvestOverlay.svelte`): from Sunday 19:30 until both have tapped, the week's recap: each
  person's ベル, the ふたりでぜんぶ days and the total; 受け取る → the coins fall into the jar (ceremony only). ✕ = あとで.
- **Pair** (`routes/pair`): paste the key, or open a `#key=` link in the installed app.

### Navigation

✕ top-right closes the whole sheet from any level; ‹ top-left only when there is a level to go up to; a full page has
‹ 島へ. Backdrop tap and Esc also close. `ui/NavBar.svelte` + `ui/NavButton.svelte`; `ui/nav.test.ts` fails on a
modal without them. Sheets rise and levels slide in over 240 ms.

## Economy

A stamp card with small numbers. Rule `scoring/bells.ts`, economy on read `model/bells.ts`, values `config/rules.ts`
(`RULES`, `STRETCH`, `SHOP`); pinned by their tests, `model/properties.test.ts` and the golden fixtures. Earnings are
recomputed from the rows.

### Goals

Lists follow Apple's ring order, Move, Exercise, Stand, then steps (`RING_FRUITS`), except けんこう and the tree's popup
(steps first). Per person per Tokyo day, all or nothing: **+1 ベル for each goal met**.

| Fruit | Metric (Shortcut field → stored) | Daily goal |
|---|---|---|
| 🍐 Move | active kcal (`calories` → `move_kcal`) | per person `pref` moveGoal, 100–2,000 (default ウェイ 600, うめ 400) |
| 🍑 Exercise | Watch exercise minutes (`exercise_minutes` → `exercise_min`) | 60 min |
| 🍒 Stand | Stand Time (`stand_minutes` → `stand_min`) | 120 min |
| 🍎 Steps | `steps` (max of `steps`, `steps_watch`) | per person `pref` stepsGoal, 1,000–30,000 in 500s (default 8,000 for both) |

The Move and steps goals on a day are the last ones set on or before that Tokyo date (a change never re-prices an
earlier day). Everything that reads a goal reads that day's: the ベル, the tree's popup, けんこう's goal
line and goal days. The ベル price Exercise and Stand at the fixed 60 / 120 min (`RULES.goals`) whatever is set in けんこう:
there `exerciseGoal` / `standGoal` (per person, per day like Move) only draw its line and its goal days, 60 / 120 until set.

**がんばり (stretch):** +1 more for each goal reached at 1.5× (`STRETCH.multiplier`): 🍐 1.5 × that day's Move goal,
🍑 90 min, 🍒 180 min, 🍎 1.5 × that day's steps goal (12,000 for 8,000); at most **+2 a person a day** (`STRETCH.cap`, paid to the first in
`RING_FRUITS` order). A person earns 0–4 + 0–2 a day.

**ふたりでぜんぶ:** +2 shared when both meet all four goals the same Tokyo day (がんばり doesn't enter it). A day pays
0–14 for the pair.

### Numbers check

`scoring/bells.test.ts` asserts these (the pair, one week):

| Week | How | ベル |
|---|---|---|
| Most | every goal every day, both, two at 1.5× every day | (4 + 2) × 7 × 2 + 2 × 7 = **98** |
| Perfect | every goal every day, both, no がんばり | 4 × 7 × 2 + 2 × 7 = **70** |
| Typical | each goal on 5 of 7 days, both perfect on 3 days with one at 1.5× | 23 × 2 + 3 × 2 = **52** |
| Lazy | two easy goals a day, never all four | 2 × 7 × 2 = **28** |

### Rewards

Exactly two, one shared wallet (`SHOP`): 🍦 **おやつ 40 ベル** (`snack`) and 🍜 **外食 70 ベル** (`dinner`). A buy is
`spend {spendId, item, bells}` with `bells` exactly the item's price (the server refuses anything else). Either person
buys; either person undoes any buy (`spend_void`).

Against the numbers check, each is something to save for (`scoring/bells.test.ts` pins it):

| Week | ベル | Buys |
|---|---|---|
| Most | 98 | one 外食 (28 left) or two おやつ (18 left); never both (110) |
| Perfect | 70 | exactly one 外食, or one おやつ (30 left) |
| Typical | 52 | one おやつ (12 left); a 外食 takes about a week and a half. Three typical weeks (156): a 外食 and two おやつ, 6 left |
| Lazy | 28 | nothing: an おやつ takes about a week and a half |

So a typical pair has two おやつ and one 外食 every three weeks. (Before 2026-11-02: おやつ 8, 外食 15, two
or three of each a week; a buy at the old prices is refused.)

### The first week

The economy starts with the data: its first week is the first one with an activity row stamped by that week's lock
(`firstWeek`). A baseline of old days synced after their weeks locked never earns.

### Harvest and lock

- **Sunday 19:30 JST:** the harvest recap opens (nothing lands then: the week's ベル came in day by day).
- **The following Wednesday 04:00 JST:** the week locks. Until then its earnings move with late syncs; after, they are
  computed as of the lock. The lock is internal: nothing shows it.

### Wallet and buys

A day's ベル count in the wallet from that day. Buys and voids replay in server order.

- **Coverage:** a buy counts only if covered (everything earned up to its date minus earlier accepted buys); an
  uncovered buy is ignored, so the balance never goes negative.
- **Voids:** either of us, any buy, once; the ベル return. Buys and voids never lock.

## Health data

Steps, exercise, Move, Stand, weight and the body metrics (body fat %, BMI, lean body mass) come only from the
Shortcut's `metrics` rows; a day's value is its latest row,
so each sync replaces it with Health's current total (a locked week's earnings stay as of its lock). Nothing in the
app enters or fixes them.

What the app sends ([backend.md](backend.md#events)): the goals (`pref` `moveGoal`, `stepsGoal`, `goalWeight`, `goalBodyFat`, either person's
via `data.person`), buys and voids, harvest taps, the sender's `locale`, `villagerName` and `villager`, and
the ずかん's finds (`find`, the first of each). A buy and its とりけす wait 5 s before they are sent (touching the banner
holds it, ≤ 2 min).

## Weight

`model/weight.ts`, for けんこう's 期間の変化 and goal month; never earns (`deps.test.ts`). Plain arithmetic, no
smoothing: over the visible period, the first week's average weigh-in → the last week's when the weigh-ins span 14
days or more, else the first weigh-in → the last; under two, none (–). Per week: that change over the days between the
two weeks' middles, shown from 7 days apart. Goal month: from the last week's average at that pace, only when it heads
to the goal at ≥ 0.05 kg a week within 156 weeks (else 「あせらず、ゆっくり いこうね」; at the goal 「目標に届いています」).

The body metrics (`body_fat_pct` %, `bmi`, `lean_kg` kg; `State.body`, apart from the activity rows like weight) are
read the same way: a day's latest row, one decimal, within their bounds (body fat 2–70 %, BMI 10–60, lean 10–150 kg);
けんこう's 期間の変化 is the same plain change. Each has a goal (`goalBodyFat` 3–60 %, `goalBmi` 15–40, `goalLean` 10–150 kg; one decimal, per person,
the latest only: the registry, `contract/goals.ts`), its goal month worked out as weight's, the goal's way. They never earn: bells.ts reads only the activity metrics, and
the cache keeps only their newest row per day once the week has locked, like weight.

## Island scene

`lib/components/island/*` and `lib/components/world3d/*`: NH's island in 3D on the editable layout, NH's own models in
three.js, with the DOM island over the canvas as its tap areas, marks, balloons and popups ([World](#world)). What comes only on its days
(a visitor, the tape deck, the cake, the weather, the fireworks, Halloween's, a birthday's and the wedding's decorations)
is loaded the first time it's due (`ui-state/lazyComponent.svelte.ts`), so the first load carries none of it. Light from the upper left;
each surface one fill, one gradient, one soft shade; no strokes on scenery. Only `transform` and `opacity` animate;
everything pauses while hidden (`data-paused`), and a sheet pauses particles, critters and idle life
(`data-covered`); under a full-height sheet (the panel, けんこう, ごはん) every animation in the scene holds too
(`data-sheet`) and the 3D island draws nothing, so nothing behind the sheet asks for a frame (`e2e/sheet-idle.spec.ts`).
Nothing on the island pays ベル.

### World

`island/world.ts` (every coordinate: the layout's once applied, `island/site.svelte.ts`), `island/camera.svelte.ts`
(the projector), `island/IslandScene.svelte`, `world3d/Island3D.svelte` (the canvas), `world3d/engine.ts` (the scene,
the camera, the frames), `island/Scenery.svelte`, `e2e/world.spec.ts`, `e2e/world3d.spec.ts`, `e2e/world-perf.spec.ts`
(on demand: `WORLD_PERF=1`).

- **Units:** world units (an 80u villager); x across (centre 195), z into the island (bigger = further back; the front
  shoreline is SHORE_Z). The live island reads the editable layout (`site.svelte.ts`: world.ts's values are the
  layout's, docs/island-layout.md); world.ts's own values are the old fixed island's, read before the layout is
  applied and by the unit tests and the layout scripts.
- **No WebGL** (never on the users' iPhone 15 / 16 Safari): instead of the island a line in the middle of the scene,
  「この端末では しまを 表示できません」 / 「ごほうびや けんこうは いつもどおり つかえます」 (`[data-no3d]`); the HUD, the
  panel, the health popup and ごほうび work as ever (`e2e/world3d.spec.ts`).
- **The 3D island** (docs/decisions.md "The island in 3D"): `Island3D.svelte` puts a canvas under the stage's nodes
  (over the DOM sky: the sun and the moon stay behind the world) and hands the projector its camera (`World.useThree`);
  the engine (`engine.ts`) runs the World's step in its own frame ([the frame rate](#frame-rate) while anything moves, 30 while only the
  water does; a model's or a critter's move slower than 60 px/s on screen, or off it, is ambience: `world3d/pace.ts`), and the World steps itself on the game's own clock when no frame has (camera.svelte.ts `simTick`). The
  ground and the water are the layout's (`terrain.ts` buildGround with NH's textures, on `water.ts`'s shared uniforms); the objects
  `objects.ts` placeObjects from the layout and the day's scenery and decor pieces (a card of today's art for what has
  no model yet); the villagers and the day's visitor NH's models (`villagers.ts`, villager3d/: a villager with none
  is its render's card, a visitor never is); the lights `lights.ts`; the finger `gestures.ts`. The camera's ends come from the
  layout's extent (the shoreline at まえ, the far end at ウェイ's door). `window.__world3d` (stats, view, go, client,
  ground, where, focus, xRoom, strays, alphaBlends, away, lamps) for the e2e (`e2e/world3d.spec.ts`): `stats().why` names
  the parts that wanted the last frame (`~`: ambience only), `stats().paused` is true under a sheet (no frames drawn),
  `lamps()` the lamps lit now (lights.ts `lit()`; none by day).
  - **The camera** (the user, 2026-11-02): the default zoom (1) is the widest it rests at, x centred, and one finger
    only scrolls along the island (its sideways movement ignored). Zoomed in past it, one finger pans sideways too (a
    free 2D pan with its fling), x held over the land plus 24 u of sea either side (`xRoom`: growing in over the first
    0.3 of zoom, so it's exactly centred at the default). A pinch zooms about its middle (the ground under it stays
    put, its x as far as the room lets it); pinching back toward the default eases x to the middle; past the default
    it gives with rubber-band resistance and, on release, springs back to the default over 350 ms, eased out (the
    user's approved automatic move). In: up to 1.8. A gesture is one kind from start to end. No native scroll: the
    island's viewport never scrolls.
  - **What comes and goes** is drawn from the DOM island's own nodes (`camera.svelte.ts`): a node with an `m3` art key
    stands as NH's model where the node is (its live position too; a move eases over `ms` as its sprite's CSS
    transition; `drop` falls in from above; `y` an absolute height: a fish's shadow under the sea), and one with a
    `v3` is a character's model (the visitor: world3d/villagers.ts, posed by its actor as the villagers are); their DOM art goes invisible (`.m3on`, IslandScene's
    `[data-r3]` rules) and stays as the tap box, its image never downloaded (`characters/artGate.ts`) unless the 3D
    island has no model for its key (`m3off`). Finds, weeds, the rock, decorations, the tape deck, the events' pieces,
    the critters (the bugs at their flight height, the fish shadows turned the way they swim: under the water, above its
    bed (a pond put down: its own), drawn after the water so it never washes them out: `things.ts` UNDER_WATER), the goal trees' fruit
    (greyed until grown, falling as the same model), a shaken tree's drops; the stream's petals and leaves
    (`floats3d.ts`); the seasonal fall (petals, leaves, snow: `ambient3d.svelte.ts`).
  - **Flourishes** (`effects.ts`, `island/fx3d.ts`): a tap's dust and splash, a bush's leaves, sparks, drops, sparkles,
    a rearing bug's 「！」: a few particles of NH's fx/* models in world space, depth-tested, fading (the bite's 「！」 is
    `biteMark.ts`'s, on the angler's head, over everything); the DOM's own
    `.in3d`, invisible. The sparkles, a villager's ✦ and the high five's flying star are one star in code
    (`effects.ts` starGeometry: Fx.svelte's path, gold with a white heart and a warm rim, no texture: sharp at any size and
    zoom), warmed with the island; a character's sparkles start round the top of its head, a step toward the camera
    (from the head's middle the 3D head hid them). The high five's star is a flourish (`zap`) that follows its arc
    every frame, not a model of the island's things: as one it came lit and black (no normals, its colours ignored),
    and the first after opening never showed (its model loaded on first use, after the 0.5 s flight). A DOM reaction on art the canvas draws (a jiggle, a rustle, a shake) moves the model too
    (`island/echo3d.ts`).
  - **The board's focus** (docs/board.md): `world.three.focus(rect)` / `unfocus()` / `attach(id, obj)`.
  - On a software renderer (CI's headless Chromium) it draws at its lightest (half the pixels, no shadow map); the
    e2e's logic mode (`E2E_RENDER=none`) runs the frames and draws nothing.
- **The projector** (`camera.svelte.ts` `World`): every world thing is a DOM node at its feet (`{@attach world.at(…)}`)
  placed through the 3D camera by one step: an upright node (translate + scale; a modelled thing's squashed upright as
  the model's height is foreshortened), a flat mark (also squashed by the ground's foreshortening) or a ground quad (a
  matrix3d). Nothing is placed until the 3D camera is up. **One depth order** for the DOM: the z-index from the feet
  (nearer in front, ties by x); a tree is two nodes, its canopy 14u nearer than its trunk. Overlays anchored in the
  world (a tree's popup, a bite's 「！」) stand over everything at their true size. Only nodes in
  [camZ − 600, camZ + 900] are shown.
- **The ground and the water** are the layout's, built on the phone (`world3d/terrain.ts` buildGround: NH's ground
  textures in `static/terrain/nh/`, its looks by the season and the blossom and foliage weeks; `world3d/water.ts`: the
  sea, the rivers' flow, the falls, the ponds), docs/island-layout.md.
  - **The sea's wash** (the user, 2026-11-03: "add a wave animation - be faithful to the original animal crossing
    game, waves washing ashore onto the beach"; `layout/swash.ts`, drawn by `terrain.ts`): NH's gentle waves on every
    sea shore of the layout, round its smoothed coast. Every 5 s a wave's white foam line rolls in over the shallows,
    runs up the sand (easing out, 11–22u up: its reach varies wave to wave), a thin sheet of water behind its lacy
    front with the sea's turquoise showing through it deeper down and a fainter foam line inside it; then it drains
    back, faster as it goes, its foam thinning, into the water, and the sand it covered stays dark and wet, drying in a
    second or two. The waves are out of step along the coast (each point's phase is its nearest shoreline point's, so a
    front stays a line along the coast) and travel along a beach a little. Lit like the ground: dim and moonlit at
    night, warm at dusk, nothing switched. Cheap: a shader on the ground's own material and the sea's (no geometry),
    on the water's clock (the ambient 30 fps when nothing else moves).
- **Layout** (`world.ts`: the old fixed island's, which the editable layout's default was drawn from: `npm run
  layout:default`; the live island reads the layout, docs/island-layout.md): まえ: the wide front beach with the island's only palms (three, out of the way: one at each of its outer corners and a
  young one by the water on the left; the palm beetles keep to them), plumeria at the
  grass edge, the villagers' homes A (132, 214, ウェイ) and B (262, 214, うめ) on both phones (never mirrored per phone) with the goal trees on their outer sides (60 / 332,
  216), the tape deck between them, the rock, the dig spots, a cedar (34, 442) and an oak (328, 494) behind the lawn on
  either side, set back so their canopies leave the hedge in view, the hedge at z 600 with
  streetlamps at the bridge's front corners. One dirt path runs up the middle from the beach to the campsite's
  clearing, and on to the stairs. The stream rises at the spring on the upper tier, falls through the cliff (x
  351…393), meanders down the east side, bends west at z ≈ 700 and crosses the island between the health lawn and おく
  (z ≈ 645, its width breathing 29–33u), under the stone bridge where the path crosses it (`BRIDGE`: x 195, z
  622…670, 35.5u wide: NH's 30.2 × 40.8 model units at 1.18u each), out to its mouth on the west beach (fishing: the
  river along both reaches, the mouth's wide water, the falls' pool). おく: the month's bushes either side of the path, the pond (74, 772) with a
  flat rock on its east shore, the bamboo grove by the stream's bend (forward of the campfire, so the clearing's east
  side isn't one heap), the campsite's tent (196, 984) in its worn clearing with its sign, hollies
  and garden lanterns, white lanterns at the stairs' foot, the cliff (z 1040…1080) with its stairs (x 36…84), a cedar
  forest on the upper tier.
  **Balance** (`scripts/layout.ts`, `npm run layout` → `island/scatter.json`): the trees, the bushes, the props and the
  decor's spots are composed by hand in focal groups (the goal trees at the homes, the pond's corner, the campsite's
  clearing, the bamboo by the stream, the bridge with its lamps and the hedge), each section's mass balanced across the
  path; what fills between them is scattered: the wild flowers' clumps and the weeds' lawn spots by seeded
  best-candidate sampling (a Poisson-disk sampler: each pick the open-lawn candidate farthest from everything there,
  the picks taking turns either side of the path), every kind keeping its own gap (a clump 76u from a clump, 52u from a
  trunk, 72u from the bamboo, 34u from a prop; a weed spot 64u from the next), none under a canopy, behind a villager's
  spot, where a goal tree's fruit falls, in the villagers' stage in front of the homes or off the screen's edge.
  `scenery.test` checks the gaps and that no open lawn is more than 90u from anything (no dead zones). Rerun it after
  moving a composed piece.
  **Wild flowers** (`world.ts` FLOWERS, `Flowers.svelte`): NH's flowers in seven clumps of 2–5 of one kind over the
  open lawn (four small ones on the front lawn, three round おく's ground), never on sand or a path; the season's
  kinds in turn (`scene.ts` WILD: tulips and hyacinths, lilies and roses, cosmos and mums, pansies and windflowers
  blooming on under the snow), 30u (pansies, windflowers, mums lower, lilies taller).
  Each flower's id is where it stands (`fl:<x>:<z>`): watering, hybrids and the flower bugs key on it.
  **Decor** (NH's models and catalog icons): streetlamps, garden lanterns, garden and flat rocks, the month's bushes, a
  bamboo grove, and the campfire on the clearing's east side (262, 944; NH's `FtrCampfire`) with two log stools at it,
  clear of centre stage and the tent's door. Unlit by day; from dusk (.7) and at night three tongues of flame flicker
  over the logs (the DOM's, untinted, in the fire's depth) and the 3D island's flame cards, glow, halo, pool and point
  light burn, still while covered or hidden.
  **The fixed decor** (`world.ts` DECOR_SLOTS, `island/fixedDecor.ts`, `e2e/fixed-decor.spec.ts`): NH's outdoor
  furniture at one scale (world.ts DECOR_U, 3u a model unit, the decorations' too: a bench 40u beside an 80u villager;
  the campfire 47u, the stools 19u), each in its own spot with a footprint. For good: まえ's one bench at the left grass
  edge facing the sea (`FtrParkbenche`, 40, 130); おく's hammock by the pond's front (98, 700), the log bench on its back
  bank (`FtrLogSofaL`) with the rod stand by the casting spot, the pump (250, 806), the shishi-odoshi at the bamboo's
  foot, the pull-up bar stand on the east lawn by the stream (`FtrPullupstand`, 330, 902) and the firewood by the tent
  (`FtrFirewood`). The seasons, never a new spot (a seasonal piece takes its own spot or the place of what stands
  there): the blossom days (Apr 1–10) the picnic set in the log bench's place and the cherry-blossom pond stone in the
  flat rock's; the young bamboo's window (Feb 25 – May 21) the bamboo-shoot lamp for the clearing's east lantern; the
  summer (Jun 1 – Sep 15) the beach chair and the sandcastle on the east beach (the castle from 05:00 until the tide
  takes it at 18:00); acorns' window (Sep 1 – Dec 10) the tree's-bounty lamp for the west lantern, the mushroom lamp in
  November; the foliage (Oct 16 – Dec 10) the maple-leaf pond stone; Dec 15 – Jan 6 the illuminated tree in the
  hammock's place; Dec 26 – Jan 7 kadomatsu for the stairs' white lanterns; a snowboy on the front lawn on a snow day
  (NH's snowball and its face), melting through NH's three stages over the next three days; Bunny Day's egg arch on the
  arch's spot. The seasonal lamps and the illuminated tree light at dusk like the lanterns. All from the date, the hour
  and the seed: the same on both phones. Every spot is a walk obstacle all year and a spot a decoration can't take
  ([Decorating](#decorating)), so a seasonal piece never lands on one. Their shadows are the 3D island's. A tap answers where it stands (nobody walks, my villager turns to it), but for a seat (it
  sits: below; the pull-up bar is the gym's: a tap walks up to it and does pull-ups, [Decorating](#decorating)): the pump gushes (`pump`), the sandcastle and the snowboy puff, the
  rest knock softly. The shishi-odoshi tips (NH's model posed: `deco/shishiodoshi-tip`) every 15–25 s while it's in
  view and on a tap, and knocks back on its stone: `kon` (local, cosmetic). The new sounds are synthesized
  (`sound/synth.ts`).
  **The decor's life** (ambient life's beats, `island/ambient.ts`, `IslandScene`): an outing now and then stops at the
  front bench and sits 20–40 s; on a day a sit on the pond's bench (each its own seat); in the evening (19–22) a
  villager goes to sit at the campfire on its own stool (A west, B east) for 30–60 s; on a day its person met the
  exercise goal (🍑) a villager goes to the pull-up bar now and then and does pull-ups there (standing on its spot is
  on it, the gym's way: the 3D villager's `pullup`); when both met every goal
  today, at dusk (17:00–19:00, each quarter hour both are home) they set off together for the front bench and sit side
  by side facing the sea for 90 s. A villager standing still on a seat's spot (`world.ts` SEATS: `layout/nav.ts`
  seatsOf, a step in front of the seat, where the room's walk to a chair ends) is on it: the 3D villager turns and sits
  down on the piece's own seat (`villager3d` sitAt on its `seats3d.json` anchor, as in the tent), or lies in the
  hammock (asleep, it naps there); both on one bench: a ♥ each. Like every outing, each phone sends its own villager's
  walk (villagerSync) and plays the partner's from the slot only while they're away; seated, the pull-ups and the ♥
  follow from where the villagers stand, so both phones draw the same (`e2e/sync-harness.spec.ts`: A seated on the
  front bench is seated on B).
  **Sitting on a tap** (`island/sitting.ts`, IslandScene `sitOn`, `e2e/sit-outdoors.spec.ts`; the user: "similar to
  when they're inside a home, have them sit/sleep on that object - be consistent"): a tap on a seat (the park bench and
  the log bench, two each; a log stool; an iron garden chair; the hammock and, in its summer, the beach chair, lain in)
  walks my villager up to its free seat nearest it and on, as in the tent: the second exception, with the doors and the
  board, to "a tap on something acts in place". Taken by another villager: the other seat, else a `boop`; two on one
  seat (got there second, or two phones took it at the same moment, each before it heard the other): the earlier sit
  keeps it (a walk's end, `s` + `ms`, the same numbers on every phone), an exact tie by who (A, then B, then G), and the
  other gets up for the other seat, else a step aside (`sitting.ts` yieldsSeat, as the tent's `outsat`). On it a tap
  on the ground gets it up and walks it; a tap on another seat moves it there; a tap on it is its squish. Only a seat that's there today sits (the illuminated tree in the
  hammock's spot, the picnic set on the pond's bench don't). Nothing new goes over the relay: the walk ends on the
  seat's spot, so the partner's and the guest's phones see it sit, and a phone opening later finds it seated, however
  long its phone has been gone.
  The pump waters every wild flower within 70u (each the shared `watered` op, as a tap's watering). The snowboy says a
  line in its voice on a tap (「さむいって いいね〜」…; melting: 「すこし ちいさく なっちゃった…」).
  `fixedDecor.test` holds the plan's rules: まえ one piece for good and two seasonal at most,
  nothing over the finds or the sea view, nothing over 40u in front of z 300, 40u from Gulliver and Daisy Mae; every
  spot 20u off a path, 24u off the dig, weed and flower spots, 30u off trunks, 60u off centre stage, the cake and the
  arch, 12u off the water.
  `scenery.test` keeps every piece off the water, the paths, the footprints and the features' spots, and the walk
  reaching every door; bamboo and rocks are obstacles like the trees.
- **Winter and night looks:** NH's snowy models and the models' emissive light (the campsite's lantern and door, the
  lamps' glass), lit at dusk (.7) and night by the 3D island's lights (`world3d/lights.ts`).
- **Sizes** (`scene.ts`), NH's proportions against an 80u villager (≈ 45 × 76px at the front on a 393px screen): hardwood
  120u · cedar 140–150u · palm ~110u · bush 34–40u · flower 30u · hanging fruit 20u · ground fruit 24u · a shell 32u
  (its art, ≈ 22px drawn) · a star fragment 24u · the bottle 28u · a mushroom 26u · a dig spot 26u · a weed 24u · a
  branch 36u, a coconut 28u · a present ≥ 30u · the bugs 1.6× their drawn sizes (a butterfly ≈ 29u, a beetle ≈ 18–24u,
  a ladybug ≈ 14u, the tarantula ≈ 27u) · fish shadows 20–64u by NH's size 1–6 (an eel 44u; fresh water 0.65×).
  Every tap target is at least 44px ([Scene interactions](#scene-interactions)).
- **Fixed over the island:** the sky (to the horizon), the HUD, the weather, the fireworks and the shooting stars.
- **The tint at the source** (IslandScene): what the DOM still draws over the canvas (a mark, a card with no model, a
  flourish) takes the time of day's multiply as an SVG colour-matrix filter on what it draws (each image, svg and
  drawn bit; a wrapper's ::before / ::after), never on a wrapper; a light (a lamp's, a firefly) takes none. A leaf's
  own filter takes the tint first (`var(--leaf-tint,)`). The 3D island's light is its own scene's.
- **Cost:** nothing runs when still: a camera move, a walk or a change places what moved (the engine's frames, the
  game clock's steps while something moves); style writes only when a value changes. Measured at 4× CPU throttling: see `docs/decisions.md`.

### Startup

What a launch waits for, and what it doesn't (the startup review, 2026-11-05; measured on a production build served
with gzip at Fast 4G, Chromium 393 × 852 at 4× CPU, `?demo`):
- **The shell:** a second visit's page is the service worker's cached shell at once (docs/backend.md "Service worker").
- **The players:** drawn from the bundled part table; the whole one (~1.1 MB) only for a part it lacks
  ([Players](#players)). Not fetched (offline, or a reply that isn't ok): the bundled one for now, asked for again
  the next time a look needs it (a 404 or 5xx was kept for the page's life).
- **The island page's chunks:** `index.html` (the SPA shell every route opens with) modulepreloads the island page's
  chunk and its static imports (`scripts/headers.ts`, after the build: Kit's fallback page preloads only the root
  layout's), and `+layout.ts` load() starts the 3D island's import (three.js and its scene) on `/` while the page
  reads the week from IndexedDB (IslandScene imports it only once the week is in): only when the launch opens the
  island (`ui-state/boot.ts opensIsland`: the demo, or a key on a build that is set up, and no `#key=` link), so a
  phone going to /pair downloads 592 KB, not 837 KB (brotli), 114 requests, not 136. Not preloaded from `index.html`
  (the startup review's B1, tried: an inline script adding its 22 chunks as modulepreload for such a launch): over
  HTTP/2 at ~Fast 4G, 4× CPU the cold first frame was no sooner (1,848-1,935 → 1,866-1,896 ms, within the noise) and
  the first paint ~100 ms later (916-936 → 1,040 ms; low fetch priority the same), the bandwidth shared with what the
  first paint waits for; load() asks for it soon enough.
- **The ground's fields:** the layout's distance fields in a worker from `+layout.ts` load()
  ([island-layout](island-layout.md): the distance fields); the river stems' field with `Math.sqrt`, not
  `Math.hypot`, in its hot loop (the same numbers). The 3D island's mount waits for the worker's answer, 300 ms at
  most (`fieldsSoon`), before it builds the ground: its mount is one long task, and the answer (a task of its own) was
  only read after it, when the ground had built the fields on the main thread already (~230 ms at 4× CPU). Not in
  the e2e's logic mode (nothing drawn; its tests read the projection as the HUD shows). A late answer (the fields
  built here meanwhile, or the tiles changed) is dropped, never kept over the current layout's set (~8 MB each).
  Measured (HTTP/2 brotli at ~Fast 4G, 4× CPU, `?demo`, medians): first frame warm 1,175 → 877 ms, cold 2,201 →
  1,949 ms; no fields built on the main thread. The same worker builds the ground's chunks (`layout/mesh.ts
  chunkMesh`: the top, the walls, the falls, the water, ~160 ms at 4× CPU), sent back as transferred buffers and
  handed out once each to the ground's first build (`adoptChunks`, by the layout's tiles, pieces and homes; dropped
  with a late answer's fields): first frame cold 1,962 → 1,856 ms, warm ~880 → 805 ms; no chunk built on the main
  thread. The engine sizes its drawing buffer only when the size changed (the ResizeObserver's first call repeated
  createIsland's: a canvas's buffer is reallocated even for the same width), 3 → 2 allocations before the first frame.
- **The 2D heads' stand-in figure:** its colours from `look/swatches.json` (each bundled item's swatch, ~10 KB,
  written by `npm run players3d` beside the part table) through `look/swatch.ts`; the closet and the part table
  (~80 KB) load with すがた. `contract/partIds.json` (~39 KB) stays in the first load: it decides whether a kept look
  draws as it is or as いつもの's parts at the first paint.
- **A failed load tries again** at its next chance (`ui-state/retry.ts nextChance`: the next `online`, the page back
  to the front, or a backoff of 2 s doubling to a minute): a lazy component (`lazyComponent.svelte.ts`: whoever asked
  sees it then; 5 loads a page at most), a food dataset (`food/load.ts`, a few times, added when it comes), the
  villagers' birthdays chunk.
- **A chunk that fails reloads the page** (`ui-state/reload.ts reloadUnlessLeaving`) only into a newer build: when
  `_app/version.json` names another version than the running one, once that version a session (sessionStorage
  `island.chunkReloadFor`), and only once its service worker controls the page. A chunk of the running build that
  keeps failing reloads nothing (it reloaded every 30-60 s for good: each retry's failure, and Vite's
  `vite:preloadError` again). Only a chunk not fetched (`isChunkError`: the browsers' module-load TypeErrors, Vite's
  CSS preload's): the preload helper reports every lazy import that rejects, a module that threw as it ran too (the
  sound's renderer, the birthdays, K.K.'s songs), which a reload doesn't cure.
- **Static files keep Pages' default cache** (revalidated): `/room/*`, `/terrain/*` and `/art/*` are not
  content-hashed by name (a `?v=` on some, none on the tent's walls and floors, the terrain's strata, the art), and
  `_headers` can't match a query string.
- **three.js:** imported by name everywhere (`world3d/threePreview.ts` for the editor's preview and the home picker: a
  whole-module `import('three')` kept all of three in the shared chunk, 680 → 526 KB raw, 171 → 131 KB gzipped).

### Frame rate

せってい → **フレームレート**: **30** (the default) or **60**, kept on this phone only (`store/frameRate.svelte.ts`,
localStorage `island.fps`; `?fps=` for a tab). It is the full rate of every 3D engine (the island, the rooms, the
museum; the shop has none) while something moves, a finger's gesture included; the ambience stays at ≤ 30 and a still
scene draws nothing, either way. At 30 on the phones' 60 Hz screens each engine draws every other display frame
(`due()`: the rAF's vsync time against the last drawn, half a vsync's slack: an even 33 ms, never a 2-3 mix); the
skipped frames cost a callback. One pacer runs the island's and the museum's frames (world3d/pace.ts `pacer`): the
ambience's next frame is a timer to just before it's due, then the display frame it's due on, each due time
1000/rate after the last one's due time, not after the frame drawn: a page with nothing else drawing has its rAF at
once, not at a vsync, so frames timed from the last drawn came early (the Simulator: the island at rest drew 36–38 a
second, the museum's exhibits and the curator 33.5; 30 now, the hall, the aquarium, the bug wing and at the eyes). The simulation runs on real time (walks, flings, springs by `dt`), so nothing moves
slower at 30. A touch moves the camera on its event and the next due frame draws it: at most one vsync (17 ms) later.

Measured on the iOS Simulator (iPhone 16, iOS 26.5, the Mac's GPU; `?demo`, a local build; Nov 2026, the Mac's load
average 25–120): frames drawn a second, and the CPU of the Simulator's WebKit processes (% of a core: WebContent / GPU,
`ps` over 5–8 s). A frame's own CPU is 2–3 ms either way (Safari's timer is 1 ms; Chrome's: 1.5 / 2 ms p50 / p95):

| Scene | 60: fps | 60: CPU | 30: fps | 30: CPU |
|---|---|---|---|---|
| Island at rest (the ambience) | 30 | 10 / 6 | 30 | 11 / 6 |
| Scrolling (a finger, a frame's step each vsync) | 60 | 42 / 19 | 30 | 23 / 9 |
| Pinching | 44 (the page drops to 49) | 46 / 18 | 30 | 33 / 12 |
| Walking (taps on the lawn) | 45–60 | 21 / 11 | 30 | 17 / 7 |
| Fishing (the float out) | 59 | 23 / 13 | 30 | 14 / 7 |
| Museum, walking | 60 | 9 / 6 | 30 | 6 / 3 |
| Tent, walking | 60 | 7 / 6 | 30 | 6 / 3 |
| Museum, tent at rest | 0 | 2 / 0 | 0 | 2 / 0 |

At 30 the drawn gaps were 33 ms in 97–100 % of frames (no 50s beyond the odd one); Chromium (iPhone 13 profile, Chrome
on the Mac's GPU) agrees: scrolling 58 → 30 fps, its main thread 22 → 15 %. The GPU's work halves with the frames;
the page's (the World placing the DOM, three's matrices) falls by a third to a half. The Simulator draws on the Mac,
so the battery and heat are estimates: on the phone the GPU's and the display pipeline's energy scale roughly with
the frames drawn, so 30 is about half the island's drawing power while anything moves, and the same at rest.

Every frame the canvas draws, the screen's compositor (the render server: the Simulator's backboardd) recomposites
every layer over it, so the DOM island over the canvas keeps as few as it can: the art the canvas draws instead is
hidden (opacity 0) and carries no filter (the night's tint, a drop shadow) and none of its own endless animations (a
campfire's flames) under the 3D island (IslandScene's `[data-r3]` rules). With them, the island at rest at night cost
the render server 60–70 % of a core against 17 by day; without, 20 (iOS Simulator, nothing else running frames).

A gesture stays at the setting's rate: the measured cost of a gesture at 60 is the highest of all (scrolling and
pinching), the added latency at 30 is under a vsync, NH itself runs at 30, and 60 then means 60 everywhere (a switch
whose difference shows where one looks for it, a scroll). 60 is there for whoever prefers smoothness to battery.

### Buildings

`island/buildings.ts`, `island/doorOut.ts`, `island/Scenery.svelte`, `e2e/tapwalk.spec.ts`, `e2e/positions.spec.ts`. The
campsite, the homes, the museum ([The museum](#the-museum)) and the shop ([The shop](#the-shop)): a tap on one walks my
villager up to its door and goes in (the tent's inside: [The tent](#the-tent); a home's room; the museum's and the shop's
own screens). ‹ 島へ comes out of the door, NH's way: my villager stands just in front of it, facing out (`layout/nav.ts`
exitOf: 30u out from the door node, A to the left and B to the right of a door facing us, the guest a step further out
between; the nearest whole point there that stands in the island's main region), on every phone at once (the room
says the put as it leaves: the others see me come out there). Inside any of them (the tent, a home, the museum, the
shop) my villager is nowhere on the others' islands. The partner's presence
is their villager and the edge face, not a character of its own (`partnerOnline`: the relay's presence, never in the
demo).

### Environment

- **Seasons** (`ui-state/season.ts`): winter (snow) Dec 11 – Feb 24, spring to May 31, summer to Sep 15, autumn to Dec
  10. Oaks: blossom Apr 1–10, fall leaves Oct 16 – Dec 10.
- **Time of day**, Tokyo clock only: dawn 05–07, day 07–16, dusk 16–19, night 19–05; it sets the sky and one tint.
  Night is soft periwinkle, never black; the windows and lamps light up from dusk.
- **Hedge:** one species a month (Apr–May azalea, Jun hydrangea, Jul–Aug hibiscus, Sep–Oct tea olive, Nov–Dec holly,
  Jan–Mar camellia). The wild flowers by season (`scene.ts` WILD).

### Particles and events

≤ 3 particles (petals, maple leaves, snowflakes on a snow day, summer fireflies but not in the rain). Snow lies on every
roof and on the cedars while it lies on the ground; petals float on the pond and down the river in cherry-blossom week
and maple leaves in maple week. Events (`eventsAt`): cherry blossom Apr 1–10, maple week Nov 16–25, Toy Day Dec 24, the balloon present.

### Weather

`island/weather.ts` (pure), `island/weatherNow.svelte.ts`, `island/Weather.svelte`, `world3d/precip.ts`, `island/wxFixtures.ts`,
`sync/wx.ts`, `panel/WeatherSection.svelte`, relay `src/weather.ts`; `e2e/weather.spec.ts`, `e2e/realweather.spec.ts`.
The island has **Tokyo's real weather by the hour** (the user: "We are based in Tokyo, Japan. Can we get the game
weather to sync with the real weather?"), or the game's own seeded days. Both phones and the guest show the same sky
at the same hour. The skies are NH's: **fine**, **cloudy** (曇り), **rain**, **a downpour**, **snow**, with **fog** as
an hour's extra.

- **ほんもの (the default):** the relay fetches Open-Meteo's forecast from JMA's models for central Tokyo on its
  15-minute cron and keeps a 48-hour timeline, one sky an hour (the 12 past hours and the next 36: backend.md
  [The real weather](backend.md#the-real-weather)). Each phone gets it after the welcome and whenever it changes, and
  caches it (`island.wx`), so a phone opening offline still has the next hours. An hour is locked once it begins, so
  the sky changes at most once an hour, at :00, on both phones together. The mapping has dead bands, so there's no
  one-hour flicker: rain from 0.5 mm/h (it stays rain down to 0.2), a downpour from 4 mm/h or thunder (it stays one
  down to 2.5), cloudy from 85 % cloud cover (it stays cloudy down to 60 %), snow by a snow code or when it's wet at
  1 °C. A lone hour between two alike takes theirs.
- **Fallbacks:** the cached timeline while it covers the hour and was fetched within 36 hours; otherwise (and in
  ゲーム) the seeded day. Each hour comes whole from one or the other. A `?date=` preview moves the clock off the real
  hours, so it shows the seeded day.
- **On the phone, as NH:** from December 11 to February 24 (the snowy ground's season), real rain falls as **snow**.
  The event nights stay fine whatever Tokyo is doing: the August Sunday fireworks (19:00–24:00), New Year's
  (23:00–01:00), a meteor shower's night (20:00–04:00) and our wedding night (from 19:00). Their days are real. The
  seeded treats stay on real fine hours: the 07:00 **fog** (October–March, 1 in 8) and the **aurora** (winter nights,
  1 in 10, never a shower's). Real fog (a fog code, or under 1 km while dry) shows at any hour. The **rainbow** is the
  first fine hour 07:00–17:00 right after rain or a downpour, once a day. It builds to its peak at half past and is
  double 1 day in 8 (by the date). There's no dry-spell rescue for the rain-only critters (the user's choice):
  Tokyo's ~100 wet days a year bring them in shorter spells.
- **ゲーム (the seeded days):** seeded by the date (a weather day runs 05:00 → 05:00). About one day in six is wet: rain
  all day (light, or a downpour), a wet morning, or heavy rain that clears at 16:00 and leaves a rainbow 16:00–17:00.
  In December–February a wet day snows instead (about one in four). Fog and the aurora come on fine days only.
  Fireworks days and meteor shower nights are always fine.
- **The switch:** せってい → **てんき**: **ほんもの** (「とうきょうの いまの てんき」) or **ゲーム**. It's one setting for the
  whole island (`pref weatherMode`, the last a member set, kept in the record), so the two phones never disagree on
  the rain-only critters. Under it is what the island has now (「いま: とうきょう あめ」, the fetch's time when it's
  over 2 h old, or 「ほんものの てんきが とれません（ゲームの てんき）」), and the credit 「天気: Open-Meteo（気象庁モデル）」.
  On the guest's phone it's read-only. The きせつ preview's weather still overrides the look on one phone, and
  `?weather=` both the look and the critters.
- **Look:** a grey sky and a darker tint on a wet day; a cloudy day's at about half, with nothing falling. Fog a haze
  with two drifting banks, the rainbow soft arcs low on the right, the aurora three swaying curtains: over the tint,
  under every control. A change of sky on screen fades: the grey sky, the tint and what falls ease in and out over a
  minute (CSS transitions; what falls by its own level, below). The island's darkening (the sprites' tint and the 3D
  lights) eases in twelve steps, and the rain bed over ~10 s. The sky the page opens to is there at once.
- **Rain and snow fall in the 3D world** (`world3d/precip.ts`; the user: "instead of just a 2D texture on the screen,
  actually make it more like a subtle, beautiful 3D splash, drop, falling effect. Not overly done, subtle. Similar to
  the original game"). NH's: rain is thin, faint, pale streaks (alpha 0.32, ~1 px) falling at a slight slant, near ones
  and far ones sliding past at their own depths as the camera scrolls, with small soft rings where drops land on flat
  ground and on the water (a wider double one on the water; none on slopes or cliff edges); a downpour is denser
  (1500 streaks against 900), quicker, longer, more slanted and its rings twice as many. Snow is soft round flakes
  (680) drifting down slowly with a sway, of mixed sizes, the big ones blurrier and fainter (a depth blur); nothing
  settles (the ground is snowy already). Bluer and dimmer at night. Indoors nothing falls. How, battery first: one
  draw call an effect (the streaks, the rings, the flakes: an instanced quad each, set up once), all motion in the
  vertex shader from a time uniform, nothing per particle or per frame on the CPU but a few uniforms. Each particle's
  seed is its place in a box that follows the view, wrapped there and anchored in the world (the box moving changes
  only which copy shows at its faded edges), bent with the island (bend.ts). Three boxes: the view's, a smaller one
  round the near and middle ground (always), and a smallest one fading in from zoom 2.1 to 2.7, so zoomed in the
  screen keeps a rain's worth; ones near the camera fade out, far ones into the haze. A light rain draws a share of the
  set count (the shader drops the rest outside the clip). The rings' heights come from a small float texture of the
  layout's surface (8u cells: the ground's or the water's height, flat, water), built once a layout when rain first
  needs it (~15 ms on the Simulator). The fade is its own level (0 … 1 over a minute, Weather.svelte's rules: from
  rain to snow at once, the opening sky at once). The island draws at its ambient rate meanwhile, as it already does
  for the water. `__world3d.precip()` (dev and ?demo) says what falls, its level, the meshes drawn and the rings'
  surface; `precipHide(on)` for a draw-call count with and without (`e2e/weather.spec.ts`).
  Measured on the iOS Simulator (own iPhone 16, iOS 26.5, a local build, the island at rest, 8 s a sample, two
  rounds; load average 15-40): the engine at 30.0 fps and a frame's CPU 2 ms (p95) in every case; the draw calls
  176 → 178 in rain (the streaks, the rings), the winter island's 188 → 189 in snow; WebContent / GPU % of a core:

  | Zoom 1 / 3 | WebContent | GPU | Frame gap p95 |
  |---|---|---|---|
  | Fine | 10.1-10.2 / 10.2-11.0 | 6.0-6.5 / 5.8-6.0 | 34 ms |
  | Rain | 9.7-10.2 / 9.9-10.5 | 5.5-6.2 / 6.2-6.4 | 34 ms |
  | A downpour | 9.8-10.7 / 10.4-10.5 | 6.4-7.1 / 6.2-6.9 | 34 ms |
  | Winter, fine / snow / snow hidden (zoom 3) | 9.9-18.0 / 18.0-18.3 / 16.8-17.1 | 5.7-7.9 / 7.4-8.0 / 7.6-7.8 | 34 ms |

  Within the noise: the rain's cost is its two draws on the GPU. (The winter island's own scene costs more than the
  summer's on a loaded Mac, snow or not.) Before, rain was one tiled screen layer of streaks moved by transform and
  snow two.
- **Sound:** the hour's rain or snow arrangement when there is one (cloudy: the sunny one), the rain bed, footsteps
  splash.
- **Critters:** cloudy counts as fine. The coelacanth comes only in rain or snow, the snail only in rain, and NH's "any
  except rain" bugs stay away while it rains. Shooting stars (and their showers) come only on a fine night, not
  through clouds.

### Trees

`island/FruitTree.svelte`, `island/fruitDay.ts`, `e2e/trees.spec.ts`. A tree's fruit through one Tokyo day (a quick run of canopy taps shakes it: [Shaking a tree](#shaking-a-tree)):

- **Hanging:** each goal's fruit, 🍐 🍑 🍒 🍎 left to right, grey at 0 and filling with colour toward the goal
  (grayscale = 1 − share, washed lighter while grey).
- **Falling:** met, the tree shakes and the fruit drops to the ground in front of the trunk with a thud and a puff;
  once per phone, the first time the island shows it met; a reload finds it lying there.
- **Picking up:** a tap on a fallen fruit picks it up (a hop, a sparkle, a pop), gone on both phones until the next
  Tokyo day (the shared day's `fr:<person>:<fruit>`; our villager picks it up on the other). Either person may pick up
  either tree's fruit; into my pocket for the shop (no ベル). The fruit row is one button: a tap within 22u of a fallen fruit picks up the
  nearest, else it opens the popup.
- **All four met:** four warm glints twinkle on the canopy over a soft gold pulse (NH's money tree).
- **The popup** stands in screen space over every tint, in the middle of the band between the HUD and the screen's
  foot, over its own tree as far as the screen's edges allow (above the canopies when they leave room; else beside
  the other tree's canopy, which stays tappable); a tail toward the tree when the tree is above or below it.
- `fruit-day` in localStorage (`{ date, dropped, picked }`, ids `A:pear`): losing it only drops a fruit again.

### Shaking a tree

`island/treeShake.ts`, `island/TreeShakes.svelte`, `e2e/shake.spec.ts`, `e2e/shared-world.spec.ts`. Every tree on the
island shakes: the two goal trees and every oak, cedar and palm of the scenery (`sceneryTrees()`; bamboo doesn't, as in
NH).

- **Tap or shake:** on a goal tree one tap on it (its canopy or its trunk) opens or closes the popup; on any other
  tree a tap on its leaves or its trunk (Scenery's `data-tree` hit areas, down to its base: the ground further round it
  stays the ground's; [Tap targets](#scene-interactions)) rustles it. The third tap
  within 1.2 s (and each quick tap after) is a shake (on a goal tree its fruit row, lying over the trunk's base, counts
  too when the tap isn't on a fallen fruit: a tap there is the trunk's, 2026-11-05): a goal tree's popup closes, the tree shakes where it stands and
  rustles (`tree-shake`), my villager turning to it (no walk).
- **What falls, by the kind of tree (NH's):** a hardwood (an oak, a goal tree) or a cedar: 1 in 8 a wasp nest, else 1
  in 7 a dangling bug, else 1 in 5 a branch (it lies beside the trunk until a tap picks it up, into my pocket). A palm:
  its two coconuts the first time it's shaken in a Tokyo day (they lie round its foot; a tap picks one up into my
  pocket, NH's 「ヤシのみを ひろった！」), after that only, 1 in 8, a nest (NH: no branches or bagworms from a palm). At most one nest per tree an
  hour, on both phones. No fruit from a goal tree: its fruit falls when its goal is met.
- **Wood** (NH's axe, without one: `treeShake.ts woodFall`): besides that, any tree's shake knocks a piece of wood out
  1 in 2 times (木材, やわらかい木材 or かたい木材, alike), three a tree a Tokyo day at most, none while its present lies
  under it. Seeded by the date, the tree and the shake's place among the day's shakes of it, so both phones say the
  same; it crosses as a `put` (`wd:<tree>:<k>`, first wins) and lies in front of the trunk (behind it where the front is the sea; never on a building's ground beside the tree: [Tap
  targets](#scene-interactions)) until a tap picks it
  up into my pocket. `?shake=wood` forces one.
- **A tree's present** (`island/treeGifts.ts`, `e2e/tree-gifts.spec.ts`; NH's furniture from the trees): each Tokyo
  day two of the oaks and cedars (`GIFT_TREES`: not a palm, which has its coconuts, nor a goal tree, which has its fruit
  and its popup) hold a piece of furniture, and the first shake of one drops it before anything else, once. It falls
  out of the canopy wrapped, as a balloon's present (our presents are wrapped, and a present to open reads as the
  moment the user asked for), in front of the trunk, and a tap opens it where it lies like one: the confetti, the
  fanfare and 「システムキッチンを てにいれた！」. Inside is that tree's piece of the day (`catalog.ts` treeItem): the balloon
  presents' furniture (every piece as likely, the shops' season stock only in season) that the tent has a model of, so
  it's always placeable (みつけた). Which trees and what they hold come from the date and the island's seed (`dayRand`),
  the same on every phone with no messages. Furniture only, never ベル (NH's bag of bells from one tree left out:
  scenery never pays). While it lies unopened, a shake of its tree only rustles. Shared: the drop is a `put` of a
  `present` by the tree's id (`tf:<tree>`; the shake itself crosses as `none`), first wins at the relay, so it lies on
  every phone and in the day row; opening it is the present's `pick`, and the ずかん's カタログ credits whoever opened it
  (A, B or the guest).
- **Shared** ([Shared world](#shared-world)): a shake's outcome goes to the partner; on their phone my villager turns to
  the tree, it shakes and the same thing falls; their wasps charge their villager (only they can net
  them). What lies (branches, coconuts) is the shared day's: a reload or the other phone finds it there, and a pick-up
  by either of us takes it on both (first wins). `?shake=nest|branch|bagworm|spider|coconut` forces the next drop.
- **The nest:** three wasps buzz out and charge the villager who shook it for 1.5 s; a tap in time nets one (NH's catch
  line, a ずかん find). Too late, they sting: a 「！」, a sweat drop, and they fly off; NH's swollen eye (a pink lump on
  the villager's own eye, the near one on a render drawn looking right) stays for a minute. The wasp is weight 0 in the
  bug table: it only ever comes from a nest. The chase and sting have their own music ([Event music](#event-music)).
- **A dangling bug:** a bagworm, or in the spider's hours (19:00–08:00) a spider 3 times in 8, drops on its thread and
  sways for 10 s; a tap nets it, left alone it climbs back up.

### Scene interactions

`island/SceneTaps.svelte`, `island/sceneTaps.ts`, `e2e/scenery.spec.ts`. Every part of the island answers a tap softly
and counts for nothing (no ベル, state, navigation or writes); one `click` listener (a drag scrolls, so it never
reaches it); ≤ 4 flourishes at once, drawn as world nodes where the tap landed; taps on controls are ignored; nothing
while covered or hidden; decorative, `aria-hidden`, pointer-only. What nothing else took is a walk ([Walking](#walking));
a seat (its tap area's `data-sit`, or the ground at its foot) is sat on ([World](#world), "Sitting on a tap").

A bush jiggles and sheds seasonal leaves (1 in 10 a bug flies out; on the partner's phone our villager shakes it too,
the same bug: [Shared world](#shared-world)); a tree's leaves rustle (three quick taps shake it: [Shaking a
tree](#shaking-a-tree)); a flower is watered ([Island care](#island-care));
any water casts the line there ([Fishing](#critters): from anywhere; the sea's ripple only where nothing can cast, 1 in
10 a fish shadow); sand leaves footprints; grass puffs dust (snow in winter); a cloud squishes;
the sun glints; the moon bobs; the night sky twinkles (and grants a wish while a shooting star crosses: [Shooting
stars](#shooting-stars)); the campfire is poked where it is (its logs shift, five embers rise, a soft
crackle: `crackle`, synthesized).

**Tap targets** (`island/hitbox.ts`, `e2e/hits.spec.ts`): everything tappable answers on its whole visible body,
base included, at least 44 × 44px about its middle; in front wins. What's exactly under the finger wins over a
character's loose reach: a visitor's figure answers first, then the small things' own boxes (a weed, a find, a present),
and only then the visitor's reach (a finger's slack round it, its spot: SceneTaps, 2026-11-05). A tree is its leaves (Scenery's `.hit`, the canopy
button) and its trunk down to a little below its foot (`.hit-trunk`, a goal tree's `.trunk-btn`; ≥ 44px wide on
screen: `--inv`); a building (the campsite, a home, the museum, the shop) its model's silhouette as the camera sees it
now (camera.svelte.ts `body`: the hull of its model's outermost points, `things.ts` outline; a house built of parts,
or before its model is in, its footprint up to its height), nothing past it, nowhere once behind the horizon: a tap on
the river beside the shop fishes (`e2e/building-taps.spec.ts`, on the user's island); what a module tests by position
in front of a building's area (a tree's present lying before it, a fish in the pond before it, a bug) is that thing's
(SceneTaps: hitbox.ts `notBehind`; one behind it only where some of it shows past the building's outline). **Nothing
lies on a building's ground** (`layout/clear.ts`, `island/offBuildings.test.ts`, `e2e/present-taps.spec.ts`): its
footprint (the walk grid's box: its tiles, the museum's steps on its front row), its door's step, and the strip behind
it its model hides from the camera (0.65 × its height: 58° down). Drawn there a thing was lost: in the walls or behind
them unseen, on the steps behind the front line, so the building's tap area took the tap. One rule both ways, a
function of the layout and the point alone (every phone puts it in the same place): what's dropped or spawned takes a
spot off it (a tree's present, wood, branch, coconuts, a nest's and a bug's spot, mushrooms, the beach's shells,
fragments and bottles, a balloon's landing, the day's weeds and dig spots: `openGrass` leaves those tiles out), and
what lies there already (put before the rule, or a building placed or moved in the もようがえ over it since) is drawn and
tapped at the nearest free spot `offBuildings` gives it: rings 6u apart from the camera's side round, walkable, at its
level, off the trees' and bushes' tap areas where it can be; its put (`at`) stays as it was, and a layout change moves it
at once. A goal tree's fruit row moves as one. We move the thing rather than test what the camera sees at a tap: a find
inside the walls or behind them would still be unseen, and the footprint test (`notBehind`) stays true for everything;
a flower's `::after` grows it to 44px; what a module hit-tests itself (a shell, a fragment, the
bottle, a dig spot, a mushroom, a present, a weed, the rock, a bug, the tape deck, the cake) is the box of what it
draws (its img / svg: a node's anchor is a 0 × 0 point at its foot) grown to 44px (`hitOf`), the one in front (the
smaller world z) when two overlap (`pick`); on water only on what it draws (3px round it: `bareOf`), its 44px margin
over the water the water's, so a tap on the sea beside a dig spot by the back beach casts. `?hit` draws them all ([Dev params](#dev-params)).
A touch decides by the point under the finger (`ui-state/exactTaps.ts`, `e2e/exact-taps.spec.ts`): WebKit's touch
adjustment (Blink has one too) moves a touch's click, when the point under the finger is no clickable element of its
own (the island's stage, a room's canvas), onto the nearest element within the finger's radius that answers clicks
(a button, a click listener, `cursor: pointer`, a `:hover` / `:active` rule), its point moved onto it: at the camera's
far stop the sea off the back beach lies high on the screen a few px from the shop's and the museum's doors, and a
tap there opened the shop (or with the line out went through the door); in the tent and the museum a tap on the floor
under the back button left the room. A touch's own pointer events are never adjusted, so inside `data-exact-taps`
(the island's `.stage`, the tent's and the museum's `<main>`) a window capture listener, the first to see a click,
drops a touch's click that was moved (another element, or its point a px or more off its pointerup's) and sends the
click to what's under the finger at the finger's point, from inside the native click (its user activation, the
sound's unlock); a click moved onto the island from the HUD goes back to the HUD the same way. A mouse's, a keyboard's
or VoiceOver's click (no tap just before it), a drag's, and the HUD's own fat-finger help outside those places are as
they were. The doors, the trees and the villagers stay buttons for VoiceOver and the keyboard.

### Balloon

NH's balloon present: by day every 45–90 s of on-screen time (the first after 20–40 s). It flies over the island in
3D (`island/balloonFlight.ts`, drawn by `world3d/balloon3d.ts`): NH's balloon with the present swinging on a short
string under it, at one height (165u over the highest ground under its lane: well above the tallest trees), from the
sea off one side to the sea off the other in about 22 s, bobbing, swaying in depth and rocking gently, its soft blob
shadow on the ground right under it; bent with the rolling log like everything else. Its lane is picked from the view
as it starts, at any scroll and zoom: across the screen a little under the HUD (and the horizon), biased to the front,
its shadow in view; none when the sky under the HUD is too short, with reduced motion, or with no 3D island. Its tap
area is a world node on it (`island/Balloon.svelte`: the balloon and its present, 48px at least, never through a
control over the island). A tap pops it (a "pan!", confetti and a sparkle where it burst): the balloon and the present
on its string go at once, and the present falls along a short floaty arc (a little hop, a slow start, a sway that
settles; 1.6–3 s, longer the further it drifts) to a spot chosen before it falls (`island/presentLanding.ts`): open
sand or grass (the layout's walk grid all round it, one level: not the sea, a river or a pond, a cliff's edge, the
stairs or under any object's footprint), clear of what lies there, in the lower part of the view (the front, near
the camera), inside it and clear of every control (the HUD, the bottom controls, the catch stack); popped over the
back of the island it drifts forward to the front. Each rule gives way a little before none is found; with no open
ground in view at all nothing falls. It lands with a sparkle and stays until tapped, put on the island for both phones
(the landing spot is sent: `put`; not kept across a reload). The flight's clock is the island's frames (the
ambience's rate): it holds while the page is hidden or a sheet covers the island. A tap
opens it where it lies: the wrapping pops (confetti, sparkles, the catch fanfare) and its plate
reads 「カエルのチェアを てにいれた！」 (`island/catalog.ts`, its own chunk with its names, fetched when a present
lands). What's inside follows NH (Nookipedia, Balloon: the item drop rates, Bells and materials left out): furniture 35 :
clothing 20 : a season's DIY recipe 15 while a recipe season is on, else 50 : 25. The pool is NH's shop stock, 1,836
base items (no colour variants): orderable, sold by Nook's Cranny or the Able Sisters, no event, never DIY items, Nook
Miles exclusives or special characters'; the shops' season stock only in season (a kotatsu Dec–Feb), clothing twice as
likely in its style's season. The 126 recipes balloons carry, each in its NH window (northern hemisphere): cherry
blossoms Apr 1–10, young spring bamboo Feb 25–May 21, summer shells Jun–Aug, acorns and pine cones Sep 1–Dec 10, maple
Nov 16–25, mushrooms November, ornaments Dec 15–Jan 6, snowflakes Dec 11–Feb 24, Halloween October, Shamrock Day
Mar 10–17, Bunny Day's egg balloons on its days; a recipe shows NH's recipe card. Never Bells, nothing kept, but counted
in the ずかん (カタログ, レシピ: a first one gets the plate's second page). On Bunny Day a sky egg instead. The catalogue is built by `npm run catalog:build` (`scripts/catalog.ts`: the ACNH spreadsheet's
JSON for the rules and the game's ja/en names, Nookipedia for the icons; 96 px webp under `static/art/finds/items|recipes/`,
~1.8 KB each, cached by the service worker on first use).

### Shared world

`store/world.svelte.ts`, `sync/world-day.ts`, `island/partnerNews.ts`, `island/PartnerNews.svelte`,
`e2e/shared-world.spec.ts` ([backend](backend.md#shared-world)). Both phones show the same island: what's caught or
picked up is gone on both, what a shake drops lies on both, each villager stands where its person sent it.

- **The villagers move as one:** each of us moves our own villager; the other phone plays the very same walk (from
  the same spot, at the same time, along the same way, facing the same way at its end), catching up when a message
  is late and walking off a small gap, so both phones have each villager at the same point (a two-tab check: within
  a step under way, the same point at the end). While the partner has the island open their villager follows only
  their phone (`island/villagerSync.ts`, [backend](backend.md#shared-world)). Asleep and awake too: both doze off at
  22:00 and wake at 05:00 at the same moment; a villager woken on one phone is awake on both for the same 10 s, and
  Gulliver woken by either of us is up on both for the day.
- **One layout, not mirrored:** A (ウェイ) lives on the left and B (うめ) on the right on both phones, whichever of us
  holds it: the homes, the goal trees, the meeting spots are by person, never by "mine / the partner's", and every
  shared id is by person or by where the thing stands (a flower's `fl:<x>:<z>`); `?demo` and `?demo&as=B` show the
  same island.

- **Fishing, seen by everyone** (`e2e/fish-sync.spec.ts`; the user: "we know who's actively trying to catch a
  fish"): each step of a line goes to the others' phones as it happens (`fish {ph, id?, pt?, from?, s?}`, presence only:
  `cast`, `nibble`, `bite`, `reel`, `off`), so every phone shows it: their villager's rod (however far off its
  float), the line out to their float where it landed, its bob, each nibble's dip and
  ring, the bite's plunge and splash, the reel. The shadow it's cast at swims up to their float and is theirs while the
  line is out: a tap on it here casts nothing, a soft boop says so (Critters' `__fish.why()`: the partner's); a catch
  is their `catch` as ever (the plate), and the line clears. A phone that comes while a line is out hears its step
  again (its angler's phone sends it when it sees them come); an angler whose phone goes is no longer fishing, nor
  one who goes through a door with the line out (its `off` as the island goes); a line cast again elsewhere frees
  the shadow the old one was at; and back from a room, the others' villagers hold no rod till their next step. The
  guest's line too.
- **The partner's doings, played here:** when their change arrives (within 12 s of it), their villager turns to it
  where it stands (no run over, as on their phone) and it plays at the target (the net or the shovel there, a splash,
  a shake, a pick-up); a catch or a find is its plate (「うめが スズキを つかまえた！」, `world.partner.*`) in the
  bottom stack as mine are, nothing held over their head: its icon pops up from their villager when it's in view (out
  of view it comes in from the edge on their side). Heard on opening (older),
  it only changes the island.
- **First wins:** of two people tapping the same thing, the relay's first claim is it; the other phone sees it taken
  by them (their plate in the stack) and its own tap does nothing more.
- **Late and alone:** a phone opening later hears the day from the relay (and keeps it: a reload needs only what's
  new); with the relay unreachable each phone keeps its own and they catch up when it's back.

### The guest

`contract/guest.ts`, `ui-state/cast.ts`, `ui-state/viewer.ts`, `e2e/guest.spec.ts` ([backend](backend.md#the-guest),
[decisions](decisions.md#a-guest-not-a-third-member-2026-11-02)). A third person, 「おきゃくさん」: a visitor to our island,
NH's way, with its own key (pairing: [runbook §4b](ops/runbook.md#4b-the-guest)). `?demo&as=G` is its phone.

- **What it sees:** our island, the trees and their popups, the HUD menu's ベル row, ごほうび (to look at: the balance, today's ベル (the members') and the
  buys, 「ちょきんばこは ふたりの もの。」 in place of the shop, no ×; the ledger), the ずかん and
  けんこう's かつどう (whose data: either member; no からだ switch) with its goals read-only (no chip to tap). Never a からだ figure: no からだ switch, no weight or body card, no weight or body fat goal (its snapshot holds
  none: the record leaves them out). せってい: its すがた and name (the same closet and picker, its own prefs and コーデ), the sound, the
  language and きせつ; no もようがえ or つうしん, and a line saying it's visiting.
- **What it does:** walks, catches, digs, picks up and shakes like us (the shared world's claims, first wins), its
  finds and counts its own in the shared ずかん (each entry credited to its first finder, the guest's
  name with 「（おきゃくさん）」 once it has one of its own; per-person counts, and a row of who found how many of the page
  once three share it); phrases over its villager, high-fives with either of us, and the tent: walking, sitting and
  arranging it. It earns and spends nothing, sets no goal, waters no flower and wishes on no star (the room would
  refuse those, so its phone doesn't try).
- **Its villager on the island:** there only while its app is open (the relay's presence), like an NH visitor. Each
  time the app opens it comes ashore at the front beach's right end and strolls up to its spot by the campsite, on
  every phone (its walk goes over the relay). It has no home and no tree. It moves only when the guest moves it
  (taps, the tent, a seat): no phone's idle life walks it, on its own phone or ours, no outing, no follow; in place it bobs and
  blinks like anyone. It dozes 22:00–05:00 on the relay's clock with
  everyone. Closing the app takes it off our islands.
- **On our phones:** drawn like the partner's villager (the same billboard, its walks played the same way, lilac name
  tag); a tap on it is a high-five (to the guest), its phrases show over it, its catches play there (its villager turns
  to it, the plate says its name). A banner says it came: 「おきゃくさんが あそびに きたよ！」.
- **Who counts as "the partner"** (each "both of us" rule, said once): the guest never does.
  - The edge face (「うめの ほうへ」), `peer`: the other member only; on the guest's phone either
    member for `peer`, A for the edge face.
  - ふたりでぜんぶ, the goal walks, the evening meet-up and the bench gathering, the follow, the partner meeting a
    visitor: the members' own, on their own phones; the guest's phone plays none of them (A's and B's fruit still
    ripens on their trees there).
  - Ambient life (`ambient.ts`): the two members' villagers only, on every phone; the guest's villager is never in it
    (on the guest's phone A's and B's take their beats as on ours).
  - Group stretching: the members' two villagers; the guest's stands where it is.
  - Sleep: everyone, by the relay's clock; a wake is said with whose villager woke (`act wake`, `id` A, B or G).
  - High-fives: one at a time per pair, each with its `to`; the room holds the last one per (sender, recipient) pair.

### The island's layout

`layout/` (grid, catalog, model, height, nav, validate, diff), `store/layout.svelte.ts`, `scripts/layout-default.ts`
([the layout's contract](island-layout.md), decisions: *The island's layout is data on NH's tile grid*). The outdoors
is a layout anyone of us can change: NH's 30u tiles (20 × 46), each grass, sand, a path (dirt, stone, brick, plank), a
river, a pond or the sea, on cliff tiers 0–3; every tree, bush, flower, rock, lamp and piece of furniture, the bridge,
the stairs and the three homes an object on its tiles. Today's island is the default (`npm run layout:default`), its
objects on the grid near where they stood, made long (20 × 60): まえ at the front, おく at the back, and between them a
new middle, open grass for building, the stream running down its east side, the path through it, うめ's and the
guest's houses with paths to their doors. Corners are round (NH's), cliffs are steps of 40u with NH's strata, a river
stepping down a tier falls, stairs are stone steps; the 3D ground is built and baked from the layout on the phone
(world3d/terrain.ts). Each home is its owner's: its look
(いえを かえる: NH's player house or a villager's, wall, roof and door in their colours, the move-in tents, the campsite's
tent) and its room (the tent's room system: うめ's house, the guest's), anyone welcome in. On the phone the members
arrange the island's things the tent's way (layoutEdit/IslandEdit: a tray of every kind, a ghost green or red, drag a
tile at a time, turn, put away); the terrain is the desktop editor's. The members change the outdoors (the
desktop editor, then the phone); each person changes only their own home's look and room (the guest: its own house
and the tent).

### Decorating

`layoutEdit/IslandEdit.svelte`, `island/Decor.svelte`, `island/decor.ts`, `e2e/decor.spec.ts`, docs/island-layout.md
"Phone editing". Either of us puts NH's outdoor furniture on the island, moves it, turns it and takes it away; both
phones show the same island, kept for good: the decorations are the layout's objects of their kinds (the old
decorations' map, `contract/decor.ts`, moved into the layout once as `m-<id>`: layout/migrate.ts).

- **The items** (ten, NH's models): いしどうろう (stone lantern), バードバス, ガーデンワゴン, アイアンガーデンテーブル and チェア,
  レンガのいど, たぬきのおきもの, モンステラ, みちしるべ (signpost), いちりんしゃ (wheelbarrow), with the layout's other kinds in
  IslandEdit's tray tabs.
- **The gym** (the tray's ジム tab, `layout/catalog.ts` group `gym`; the user: "I want to build a gym"): NH's fitness
  furniture under its official names, the decorations' pipeline (scripts/models.ts and world3d-assets.ts `DECOR`: the
  icon `decor/<kind>-0`, the model `decor/<kind>`, its first colour), NH's footprints (catalog.ts; they turn), the same
  checks, ops and members-only もようがえ as every outdoor piece: けんすいスタンド (the pull-up bar, the default island's
  own stand among them), プレスベンチ, エクササイズバイク, ランニングマシン, サンドバッグ, バランスボール, バーベル, ケトルベル,
  プロテインシェイカー, ウォーターサーバー, たいじゅうそくていき, クライミングウォール, ロッカー. NH has no dumbbells, medicine ball,
  rowing machine, ab roller, stepper, stretch board or jump rope, and the yoga mats and exercise mats aren't in the model
  files. **Used, NH's way** (the six NH lets one use): a tap walks my villager up to it and on, a seat of sitting.ts
  (`layout/nav.ts` SEAT_ON, `villager3d/seats3d.json` `use`: the weight bench a bed from its model, the rest a point by hand,
  `scripts/seat-anchors.ts` USE), and there it uses it in a loop while it stays (poses.ts `press`, `pedal`, `run`,
  `punch`, `bounce`, `pullup`: lying on the bench pressing, pedalling the bike side on, running on the treadmill's belt,
  jabbing at the bag from its side, bouncing on the ball, pull-ups at the bar, its chin over the bar at the top); a tap
  on the ground gets it off. One villager a piece (taken: a `boop`), the earlier on it keeping it, and nothing new on the
  relay: as a seat, standing still on its spot is on it, so every phone draws the same (`e2e/gym.spec.ts`). Asleep on one
  it dozes. **The bench's bar is pressed** (the user: "can we make them bench-press the barbell?"): NH's bench has its
  barbell baked into its one mesh, but as pieces of their own, so the conversion lifts them out as the GLB's `bar` node
  (docs/world3d-assets.md "Parts split out"); lain down (420 ms), the bar leaves the rack for the hands (GRAB_MS 520),
  rides them each frame (its middle the two hand bones' middle, its length along them: villager3d `hands()`,
  world3d/benchBar.ts, no allocation) through poses.ts `press` (1.8 s a rep: up 0.72 s, a pause at the top, down 0.81 s,
  the elbows bending on the way down), and goes back onto the rack as it gets up (RACK_MS 420) or dozes off. Villagers
  and human players alike (the same Hand_L / Hand_R bones). Nothing new on the relay: the use is the seat's, so both
  phones draw the same; nobody on it, the bar is on the rack as before. **What's pressed is the gym's barbell** (the
  user: "use the larger barbell model, and just hide the small included barbell when we're benching"): as it lies down
  the bench's small bar leaves the rack and the gym's standalone barbell (catalogue `barbell`, NH's, benchBar.ts HELD)
  is on the rack in its place, its middle the small bar's and along it; it's lifted from there and put back there, and
  once it's up (RACK_MS) the barbell goes and the small bar is back. A swap on the rack, not in mid-air: the lift-off
  and the return keep their blend, and the swap is hidden in the lying down and the getting up. Its size 1.25 × NH's
  (HELD_SCALE): at NH's own, its 36 u grip fits a villager's hands (23–28 u apart pressing) but not a human player's
  (32–39 u, in the plates); at 1.25 the grip is 45 u, every presser's hands on it and the plates outside them and
  outside the rack's uprights. Its model loaded once a mount (things.ts lift `held`: its geometry and the things' bent
  materials, shared by every bench's; till it's in, the small bar stays on the rack). Cost: while one presses, +1 draw
  call (the barbell on its own, no shadow; Chromium: 208 calls with it drawn, 207 with it hidden), one matrix a frame; at rest none (the
  small bar is the bench's instanced part: +1 draw for all benches). e2e/gym.spec.ts (a human player and a villager:
  the barbell at the hands over a rep, the small bar off the rack, the hands on the grip, on both phones; up, the small
  bar racked and no barbell); benchBar.test.ts (the split's node and bounds, the blend, the barbell in the bar's frame,
  its grip). iOS Simulator (own iPhone 16, iOS 26.5, local build): the barbell at the hands' middle (0 u off) through
  the rep, player and villager, the small bar back on the rack once up; 206–212 calls, CPU p50 2 ms. The rest are to look at
  (a tap jiggles them). **Cost:** a piece is the decorations' instanced model (a
  repeated one adds no draw); its use is the villager's own pose, stepped at the island's ambient rate (the frames it
  draws anyway while a villager shows: `villager3d` `looping()`), never the full one. iOS Simulator (own iPhone 16, iOS
  26.5, local build, the demo island at noon, the camera on the gym): ten pieces placed (two bikes, two treadmills, the
  bench, the bag, the ball, a barbell, a kettlebell, a water cooler) draw calls 180 → 193, triangles 246k → 259k, the
  frame's CPU p50/p95 1/4 → 2/3 ms, idle 60 fps either way and 30 frames a second drawn (the ambient rate), my villager
  running on a treadmill the same (193 calls, 2/3 ms, 30 a second; seated side on it stays at the ambient rate:
  villagers.ts turns to the anchor's own way). `npm run ios:check -- --seed --then` (docs/ops/testing.md).
- **How many:** the layout's objects are capped by the record at 1,500 standing (`contract/layout.ts` LAYOUT_MAX; a removed one's row is kept, never counted;
  the default island's ~100 among them), not by `contract/decor.ts` DECOR_MAX (30: the old もようがえ's decorations' map,
  moved into the layout once; nothing places by it now). A gym of 10–20 pieces fits.
- **In:** せってい → もようがえ → はじめる (the sheet closes; no new HUD control on the island): IslandEdit over the 3D
  camera, the tent's way: a tray of every kind, a ghost green or red, a drag a tile at a time, a tap on the ground
  puts it there, ↻ まわす, ✕, 🗑, ✓ (island-layout.md "Phone editing"). Its おきゃくさん tab: where the visitors stand
  and where Gulliver washes up (a mark each, seen only in the mode; "Visitors").
- **Out of the mode** a placed item is a world thing: NH's model on the 3D island, its DOM node the tap area (its 2D
  art hidden under the model), an obstacle the walk goes round (layout/nav.ts), and a tap jiggles it where it stands
  (my villager turns to it: no walk). The partner's change, just made, puffs where it lands and their villager turns
  to it.

### The bulletin board

`components/board/`, `contract/board.ts`, `e2e/board.spec.ts` ([board.md](board.md), [backend](backend.md#events) `board`).
NH's island board (`EvtobjBbs`, its bird `BbsBirdDay` / `BbsBirdNight` on top in 3D) stands on the front beach at the lawn's
edge, by the path behind the shells' sand (clear of Gulliver's spot), facing the sea (the layout's `board` object once the layout has it: movable in the editor). A tap on
it walks my villager up beside it (the tent door's exception to "interactables act in place"), then it opens: on the 3D
island the camera dollies to its face (≈600 ms) and back to exactly where it was (the one automatic camera move, the
user's: the engine's `focus`, board.md), else a sheet showing the same face. The face is a canvas (the 3D
board's texture): NH's pinned notes, four a page, newest first, each with its author's villager head and name and the
date; ‹ › and a swipe page. A tap on a note reads it whole, with かきなおす (its author) and はがす (its author, or ウェイ
and うめ for anyone's: a second tap confirms). 「かきこむ」 opens a field above the keyboard: plain text, at most 4 lines and
100 characters (NH's board takes more; four short lines read at a glance on the zoomed board). A 「！」 bobs over the board
when someone else wrote since I last looked. Everyone, the guest too, writes; the record enforces who may change what.

### The tent

`routes/tent/+page.svelte`, `tent/TentRoom.svelte`, `tent/TentEdit.svelte`, `tent/engine.ts` (three.js), `tent/grid.ts`,
`tent/items.ts`, `tent/dragLink.ts`, `store/tent.svelte.ts`, `contract/tent.ts`, `ui-state/doorTransition.ts`,
`scripts/room-models.ts`, `scripts/room-surfaces.ts`, `store/where.svelte.ts`, `e2e/tent.spec.ts`, `e2e/tent-surfaces.spec.ts`, `e2e/tent-hold.spec.ts`, `e2e/sync-harness.spec.ts`. A tap on the
campsite's tent walks my villager up to its door (the one exception to "a tap on something acts in place", the user's:
"we have to walk up to it before we enter it"; the walk goes over the relay like any, so the partner sees me walk up
and vanish inside; within 36u of the door it goes straight in; a tap on anything else on the way is the end of going
in), then goes inside: its own screen, truly 3D, behind NH's door (a black iris closes on the tent's door, stays black
while the room's chunk and first frame come, opens out of the room's door; the way out the same, opening on the tent
on the island, the camera where it was). Out of the door my villager stands just in front of the tent (A a step to the
left of the door, B to the right, both 30u in front, so the tent stays tappable), facing out, on both phones (the put
goes with the leaving).

- **One place at a time:** each villager is on the island or in the tent, on both phones (`store/where.svelte.ts`:
  presence over the relay, the tent screen's `tent {in}` as it opens and closes, said again whenever the partner joins
  or the socket comes back; the island says `{in: false}` to a partner who arrives). A villager in the tent is nowhere
  on the partner's island (hidden, its life there, outings, follows and meet-ups leave it alone, no high-five or
  phrase can reach it); inside, the partner's villager is there only while the partner is. The museum and the shop
  are the same (`sc` `m`, `s`). A phone that goes quiet inside (closed, offline) has its villager leave 3 minutes after
  the relay saw it go: back on the island where it went in, and there it stays ([Walking](#walking) "A phone gone").

- **The room:** NH's largest, the main room fully expanded: 8 × 8 tiles (Nookipedia's upgrade table: the main room
  6 × 6 → 8 × 8, the second floor and basement 10 × 6 = 60 tiles, so 8 × 8 = 64 is the most floor), NH's own grid (a tile
  10 model units: RoomMdlFloor8x8 is −40…40), four walls four tiles high (RoomMdlWall) on a dark base, the front one with
  the door (two tiles wide, three high) and NH's doormat inside it; its two tiles stay clear.
- **The camera** starts as NH's room camera (perspective, 47° down, a long 32° lens, from the front), fitted so the whole
  room shows above the edit tray's room; then it's the player's: a drag on the room turns it round the room's middle and
  tilts it (28°–78°), a pinch (or the wheel) zooms it (0.55–1.35 ×), the 🏠 button (shown once it moved) eases it back.
  A corner-on view steps back to keep the square in; the walls between the camera and the room are cut away (Happy
  Home Paradise's look), so the room shows from any side. A tap walks, a drag turns (in the edit mode a drag that
  starts on a piece moves the piece instead). Or at my villager's eyes: [First person](#first-person).
- **The light:** warm interior light (a soft sky over a warm floor bounce, a key from the upper front left casting the
  room's one small shadow map, 1024², redrawn only when a piece changes, a fill from the camera's side); at dusk and
  night dimmer and warmer, the lamps' emissive on and up to four warm point lights at the lamps (a tap turns a lamp on
  or off).
- **The villagers** are billboards of their official renders (NH's 3D villagers would mean converting all 417: too much
  to ship), standing at their feet, turned to the camera about the up axis only (leaning back 45 % of the camera's tilt
  so a steep view doesn't squash them), cut out by alpha test (depth sorted with the furniture: behind a table it hides
  them, in front of it they cover it), 16 model units tall (a bed is 20 long), each with a soft round shadow, mirrored
  to face the way they walk on screen. The renders have no walk frames: the walk is NH's trot, a bob and a squash a
  step. A tap on the floor walks mine there (A* on half tiles round the furniture, rugs walkable, the corners pulled
  straight; 45 units a second); a tap on a villager hops it (only where it's drawn, its alpha); a tap on a piece acts
  in place (my villager turns to it, it jiggles, a lamp switches); the doormat or ‹ 島へ goes back out.
- **Stereos** (`tent/stereo.ts`, `tent/StereoPicker.svelte`, e2e `tent.spec.ts`): NH's music players in any room (the
  hi-fi, high-end and retro stereos, the jukebox, the phonograph, the record and cassette players, the pro tape recorder,
  the tape deck, the skull radio) play K.K.'s songs as NH's do. A tap opens the song list (おまかせ: any but the last
  one; or one by name); the song is his **aircheck** (manifest `kkAircheck.<id>`; a song with none yet plays its live
  file), through `playKK(id, 'aircheck')`, the same cut-in as K.K.'s own, so the room's music stops for it and comes back
  after; Now Playing says 「♪ いまは「…」（ステレオ）」. A tap on the one playing stops it; leaving the room, or putting
  the player away, stops it too. This phone's music only (the partner's phone hears its own).
- **The partner's villager** is theirs to move while they're in the tent (each walk of mine goes over the relay as the
  `tent` intent, the very walk: from, the way, when, how long; a join hears where I am); while they're away (not on the
  relay) their villager rests in the room where it last stood; while they're on the island it isn't here.
- **もようがえ** (the foot's green button) arranges the room: the grid on the floor and the tray in the thumb's reach:
  tabs かぐ (the starter set), ラグ, みつけた (every furniture either of us found in a balloon's present that NH has a model
  of: the ずかん's カタログ, newest first), ジム (the gym's pieces of those found or bought, gathered: tent/items.ts GYM; the rooms' pieces stay the balloons' and the shop's, and a bike or a treadmill in a room acts in place, the bench is lain on), かべがみ, ゆか, over NH's own icons in two rows that scroll sideways (60 px), and
  ✓ おわる with the count (「3/60」). A tap on a piece's icon puts it down as a ghost on the free spot nearest my villager,
  lifted, its footprint on the floor green where it may stand and red where not, the bar above saying why
  (「でいりぐちは あけて おこう」, 「ほかの かぐと かさなります」, 「むらびとが いるよ」…); a finger on it (or on a placed piece,
  which picks it up) drags it a tile at a time; a tap on the floor moves it there (Holding, below); ↻ まわす turns it a quarter (about
  its middle); ✓ おく places it (greyed while red); 🗑 しまう takes a placed one back to the storage (とりけす on the banner
  for 5 s); ✕ やめる puts it back. A wallpaper or a floor is on at once. **Where:** on its whole tiles inside the room,
  off the door's two tiles, not over another piece or a villager; a rug lies under the furniture (and may cover the
  door's tiles), never over another rug. At most 60 pieces a room, shared (the wallpaper and the floor don't count): 64 tiles
  (rugs under and small things on tables add room) and the phone's draw budget. Measured full (iOS Simulator, own iPhone
  16, iOS 26.5, `npm run ios:indoor -- --room 60 [--varied]`, against 40): draw calls 80 → 112 (the starter set's
  30 models repeated; 77 → 114 with every piece its own), triangles 45k → 66–68k, the GPU's geometries and textures
  59/54 either way (73/72 → 104/106 varied), frame cost p95 2 ms at rest and walking (2 → 3 ms walking, varied), 30 fps
  walking and orbiting, the first load of the models (a fresh Safari) 1.2–1.6 → 1.8–2.0 s (2.1 → 2.2 s varied), Web
  Content ~510–590 MB either way. No batching: a repeated model isn't instanced, the room draws only when something moves.
- **Loading:** the furniture's models are kept page-wide as loaded (tent/engine.ts `loadModel`: fetched, decoded,
  without the loader's parser, as the island's models are: release.ts `lean`), so a room comes back with no fetch,
  meshopt or image decode; each room's GPU copies go with its renderer (disposed with it: three's listeners else hold
  it). Its models' textures are plain images on WebKit (world3d/gltf.ts, as the museum's). The wallpaper and the
  flooring start as a 1×1 map of their colour, so their arrival swaps a map (the same program; a map added later
  compiled another). Once the room's in and still, what it hasn't drawn yet (the first person's ceiling and door, the
  edit mode's grid and footprints: in the scene, hidden) is compiled a program a timer tick (engine.ts `warm`; WebKit
  compiles every program made so far at the first query that waits on the GPU, so one at a time), so turning them on
  compiles nothing. iOS Simulator (own iPhone 16, iOS 26.5, the starter set's 40 placed, back from the shop, local
  builds A/B, load average 7–85): 40 model requests → 0, everything in 545–631 → 365–402 ms; the way in's long frames
  (the room's ~14 programs, ~275 ms of compiling either way) 62–100, 51–68, 194–264, 64–100 ms as the models came →
  one of 337–354 ms; programs compiled turning the first person on 0–1 → 0, the edit mode 0–1 → 0 (22 made, 14–16
  before).
- **At rest** the room draws only a blink: a timer to the next time a villager's face changes (a blink's start or
  end, a snore: villager3d `nextBlink`, faces.ts `faceChangeIn`), not a check 8 times a second (iOS Simulator, the
  tent and うめ's home still: timer fires 8.3–8.5 → 1.0–1.3 a second, the frames the same 0.7–1).
- **Turning:** ↻ or a tap on the piece I hold turns it a quarter clockwise (a tap: under 8 px and 450 ms; a drag
  moves it), easing round.
- **Holding** (NH's decorating: one thing held at a time; `TentEdit.svelte`): with nothing held a tap or a press on a
  piece takes it up. While I hold one, the finger is for it alone: a press on it, or a near miss (its drawn shape on
  screen and 14 px round it), drags it; a tap on the floor puts it there if it may stand there, else it stays where it
  was and the spot flashes red, the bar saying why; a tap on another piece doesn't take that one (what I hold shakes
  its head, and the first three times on this phone the bar says 「いまの かぐを おいてね」), except where what I hold goes
  there (a small thing onto a table's top, a piece over a rug, a rug under a piece); a drag that starts on another
  piece turns the camera; a long press (400 ms, the finger still) on another piece puts what I hold down (where it is
  when it may stand there, else back where it was) and takes that one, with a pop, the finger dragging it on; a tap off
  the room (a wall, the dark round it) puts what I hold down. The held piece has a yellow handle over it. A tap near a
  small thing on a table (10 px round it) is the small thing, not the table.
- **Table tops** (NH's surfaces): which pieces are surfaces and which things go on them come from the ACNH spreadsheet
  (Norviah/animal-crossing's JSON; the game files have no params for it), never a hand list. NH's rules: a piece with
  the spreadsheet's `surface` = true holds things (Housewares: tables, low tables, desks, counters, kitchens, chests,
  dressers, wardrobes, low and open shelves, the bookshelves flagged, TV stands, stools, the fireplace; a few
  Miscellaneous too: the cardboard box, the record box); a piece without it holds nothing however flat it looks (the
  wooden bookshelf, the bamboo shelf, the vanities, the dining tables a few are). Only Miscellaneous things go on a
  surface (lamps, the kettle, the tea set, a 2 × 1 one like the 50-inch TV on two tiles), one a tile, on its TOP only
  (no inner shelves: NH has none), never on a thing that's itself on a table. Wall-mounted things are never surfaces
  (the spreadsheet's Wall-mounted sheet has no surface column; NH's wall shelves hold nothing). 60 of the pieces here
  (12 of the starter set) are surfaces, 126 small. **The top** is found from each surface's converted model, not its
  bounds (`scripts/room-surfaces.ts`, `npm run room-models -- --surfaces`): rays straight down every half unit over
  the footprint; the highest flat level that covers enough of it is the top (a vase or tool standing on it is no
  level: the log shelves' top is 7.4, its bounds 11; the tool shelf's 18.8, not 23.1), a tile holds a thing where the
  top covers its middle (the throwback hat table's brim and the open-frame kitchen's sink hold none), and a top
  that's a roof over a working level open in front and clear above (the system kitchen's cabinets over its counter, the
  loft bed over its desk) has its things on that level. items.json keeps each one's `sy` (height), `st` (the top's
  rectangle) and `sl` (its tiles that hold); a thing stands at `sy`, its middle kept on the rectangle. A small thing
  held over a surface goes on it (dragged over a tall one, it follows the finger on the top); its op names the piece
  (`on`) and its slot there, so moving or turning the table carries what's on it (the ghost carries them) in one op.
  NH's rule for putting away: not with things on it (「うえの ものを さきに しまってね」). A thing on a table blocks neither
  the floor nor a walk. A race (one of us puts the table away as the other puts a lamp on it) leaves the lamp on the
  floor at its slot's tile, the same on both phones.
- **On the walls** (NH's wall-mounted things: the ACNH spreadsheet's Wall-mounted, 54 with a model here; ten in the
  starter set: the log, cuckoo, pendulum and ironwood clocks, the iron wall lamp and rack, the tool board, the
  corkboard, two wreaths): the かべかけ tab; a piece hangs on a wall's grid (a tile across, a 5-unit step up, never
  over the door or another), lands on the first free spot of the back wall, goes where a wall is tapped or dragged
  along the walls; its facing is its wall's (no ↻). Its op: x the tile across, z the step, f the wall. A wall cut away
  takes its things with it.
- **Sit, lie and switch** (`tent/seats.ts`; the flow, shared with the museum's benches: `rooms/seating.ts`): NH's own interaction from the ACNH spreadsheet (`interact`: a Chair is sat
  on, a Bed lain on: 38 and 20 of the pieces); a sofa seats one a tile across, a double bed two. Outside the edit mode a
  tap on one walks my villager up to it (a step in front: physical, like the door) and it sits facing the piece's front,
  or lies on the bed; a tap on the floor gets it up and walks it. The renders have no sitting or lying art: sitting, the
  billboard sinks into the seat to the hips; lying, it lies back along the bed facing up. One villager a seat, the first
  to sit keeps it (presence: the `tent` intent's `seat`). A light (NH's lighting type, the fireplace: 37 pieces) switches
  on or off with a tap, kept with the piece (its op's `l`) on both phones; it glows (its emissive) while on, and in the
  dark lights the room round it (up to four point lights). NH's room light switch (💡, top right) dims the room's own
  light; at night, or with it off, the room is lit by whatever is on.
- **Phrases** (as on the island, [Villager taps](#villager-taps)): the island's say button at the room's bottom right,
  just above the foot's buttons (いえを かえる and もようがえ fill the foot's width), in the tent and every home, the guest's
  too; hidden in もようがえ, under a sheet and ハニワくん's letter. The same picker above it; a tap on the room while it's
  open only closes it (nobody walks). The phrase shows in the island's balloon (`island/Says.svelte`) over the speaker's
  villager in the room, by its head as the room's camera sees it (the tent engine's `headPoint(who)`: the top of its
  card for now, the 3D model's head bone once switched), by the island's placement rule (never over the room's
  controls); it follows a walk, stays whole by its head while the camera turns or zooms ([Dialogue](#dialogue)), 4 s, a newer one replacing it. It goes out as
  `say {text, sc}` with the room's scope (`t` the tent, `u` うめ's, `v` the guest's) and shows only on a phone whose
  villager is in that room; one said on the island (no `sc`) only on the island (one place at a time). `e2e/say-rooms.spec.ts`.
- **The Happy Home Academy** (`tent/hha.ts`, `HhaLetter.svelte`): the first time someone comes in through the door
  after the room was changed that day (Tokyo's), ハニワくん's letter rates it, once a day on each phone; the ハニワ button
  (top right) shows the rating as the room is now. Worked out from the shared room alone, so both phones agree: NH's
  HHA base points from the spreadsheet (a second of the same thing half, a third nothing; the wallpaper and floor
  too), a series of 3 or more (120 each, 600 more from 6: まるた, ラタン…), a theme and a colour that 4 or more and half the
  pieces share (NH's concepts and catalogue colours: 80 and 60 each), the lights on (250, then 100 each up to four), the
  space (the floor 30–65 % used 700, near it 300; something on a table, something on a wall, 200 each) and the kinds
  of thing (60 each, up to 600). どうの ハニワ from 3,000, ぎん from 6,000, きん from 10,000 (a starter camp ≈ 1,900, a log
  room ≈ 4,700, the log room grown and lit ≈ 8,500). One remark: what would help (empty, sparse, crowded, dark) or the
  best of what's there, its series, theme or colour named. The numbers are their own chunk (`hha.json`, from
  `npm run room-models`), fetched only for a rating. No ベル.
- **Shared and kept:** the room is both of ours, live on both phones: each change is one op (the island's `decor` op
  with the room's scope, last writer wins, the sheet keeps each piece's latest: `contract/tent.ts`,
  [backend](backend.md#events)). While I hold a piece, the partner's phone sees it move as I move it (`drag`, ≤ 10 a
  second, presence only): lifted where my finger has it, eased between the updates, a yellow footprint where it would
  land, and not theirs to pick up (「ウェイが うごかしているよ」); if we grab one at once the earlier hold keeps it; silent
  for 2 s (or the partner gone) it drops back where the room has it; the drop is the op, which lands before the drag's
  end, so it never jumps back.
- **Cost:** three.js and the room's code are their own chunk, fetched only when the tent opens (the island never loads
  them: `e2e/tent.spec.ts`); no MSAA; the device pixel ratio capped at 2, 1.5 while the camera moves; frames are drawn
  on demand (a walk, a gesture, a piece popping in, the partner's held piece), none while still; everything is disposed
  on the way out (the WebGL context too). A full room (35 starter pieces and rugs): 71 draw calls, 49 k triangles; a
  full turn of the camera at 1.5×: a frame's own cost p50 0.3 ms / p95 0.5 ms (Chrome, M-series), p50 2.8 / p95 4.2 ms
  with 4× CPU throttling, frames 16.7 / 18.5 ms apart; Playwright's WebKit p95 1 ms, 17 ms apart (2026-11-02).
- **The models** (`npm run room-models`, NH_MODELS=~/Downloads/Model): NH's furniture, rugs, wallpapers and floors
  converted from the game files to files the app serves (`static/room/`): each piece a glTF with NH's materials baked
  into one WebP texture each (≤ 256 px; NH's gray albedo × its gradient, a little of its ambient occlusion, its
  opacity as alpha; the emissive kept for lamps), quantised and meshopt-compressed by gltfpack, ≤ 40 KB aimed for
  (≈ 18 KB on average); its footprint from the model's bounds, NH's catalogue size winning where they differ;
  wallpapers 256 × 512 (two tiles across, the wall's height), floors 512² (four tiles); NH's own catalogue icons.
  Cached by the service worker on first use (`island-room-v1`, a model's URL carrying its content hash), never at
  install.

### Critters

`island/Critters.svelte` (its shapes `critterTypes.ts`, its 3D moves frame by frame `critterMotion3d.ts`), `island/critters.ts`, `island/critterPath.ts`, `e2e/critters.spec.ts`. NH species on the Tokyo
clock, for fun and frequent, and the same on both phones (ambient life's 10-second slots, `island/ambient.ts`,
docs/backend.md "Ambient life"): the sea holds a shadow off every stretch of the coast most of the time (NH's all round
the island: `island/coast.ts` cuts the sea within 3 tiles of the shore that the camera can show into one stretch per
450u of coastline, the front beach's 15 tiles' worth, each a sector round the island's middle from the layout's tiles,
so both phones cut the same; the front's is 1 turn in 4 bubbles instead), each fresh water
(the pond, the river, its mouth, the clifftop) its own shadow most of the time too ([Pond](#pond)), and a bug comes by every so often, each of the same kind and species on both phones and
leaving at the same boundary. **Where it is, is the world's** ([Shared world](#shared-world)): its seed picks the swim
patch (a pond's on the island's ponds, painted or put down), the trunk, the flower head or the patch of grass, and every glide, hop, dart, rest and landing
at its time after it came (`critterPath.ts`), so both phones have it at the same spot doing the same thing, and a phone
opening mid-stay finds it where the other shows it; each phone shows it when its camera sees that spot (covered or
hidden, the critters leave; back, those still staying are there); ≤ 1 off each stretch of coast, 1 in each fresh water and 1 bug. A catch or an escape
is shared by the critter's id (first wins): it's gone on both phones, and on the partner's their villager turns to it
and it's netted, reeled in, dived for or dug there, its plate in the stack. A bug out of a shaken bush, from under the rock or off my
villager is put on the island for both (`put`), its moves from its id. **Seasons are a flavour, not a gate:** any species in any month, 3× likelier in its NH
northern-hemisphere months; hours still hold.

- **Fishing** (NH's: `island/fishing.ts`, my line's state machine, pure and unit-tested; Critters.svelte plays its
  steps; `critters.ts` waterAt / landing: the water is the island's own tiles, `world.ts` surfaceAt, the sea or a fresh
  water by NH's locations, the one answer for casts, swims and the walk). A tap on any water, however far from my villager
  (the user: "I want to be able to fish from anywhere"), casts there from where it stands, turning to it (smoothly, and it keeps facing the float; seated or lying
  it stays as it is, the rod pointed ahead); dozing, the cast wakes it; walking, it stops where it is and casts. The
  float lands on the water tapped, or the nearest within a finger's slack (12u: a narrow stream's bank, a shadow drawn
  over the coast), drawn in off the bank; the line as long as it takes (sagging by its length, clear of the island: docs/world3d-assets.md "Fishing"). No
  walk to the water (the user, 2026-11-01:
  walking to a pond got in the way; tap the shore to go there). A canopy, a bush, a find or a visitor over the water
  keeps its tap. A shadow (NH sizes 1–6) on that water within `NOTICE_U` (180u) of the float (my villager's distance doesn't
  matter), with open water between, notices the float, closes in over 2–3 darts, nibbles 1–4 times (each a small dip and a ring: it's coming), then bites: the float
  is yanked under with a splash and NH's 「！」 (on the 3D island over the angler's head, as posed: standing, seated
  or lying, at every zoom, on the others' phones too: docs/world3d-assets.md "Fishing"). While the line is out any tap on the island but a building's door is the reel (NH's A button: my villager,
  a tree, the water alike): on the bite it catches the fish; earlier, with a fish at the float, it scares it off; with
  none, it just comes in. `BITE_WINDOW_MS` (1 s) from when the bite shows (a late timer never shortens it); missed, the
  fish darts off and the float stays out, bobbing, for the next. Walking reels in first (NH: you reel in to move): a tap on
  the ground with the line out is the reel, the next tap walks. The line ends by itself only when my villager goes
  through a door (the island hidden), the island is covered, or the day turns; it never nods off with the line out
  (the night nap waits: director's `holdNaps`, asked again every 5 s). Nobody near:
  the float waits as long as it takes; a shadow swimming by later notices it. 1 in 14 a boot, tire or can. Every tap on
  water answers (`e2e/fishing-taps.spec.ts`: each water on both islands at 30 and 60 frames a second; every water
  point on screen casts, near or far; a cast from across the island caught, its line from the rod's tip to the float;
  a tap right after a scroll).
  On the 3D island (`island/glide.ts`, `world3d/things.ts`) nothing pops: a shadow or a bug fades in (0.6 s, a slight
  scale-up) where it comes and out where it goes; a shadow moves by its eased glides, smooth from wherever it is,
  turning as it goes; the fish at my float turns to it, each nibble its nose bumping the float with the float's dip,
  the bite a lunge onto it; scared, it turns tail and darts off with a quick tail wiggle, fading as it goes
  (`e2e/critters3d.spec.ts`). A bug follows its itinerary's own curve (`critterPath.ts` bugAt: a cubic in time through
  its legs' ends, slowing only where it rests, sits or hops), turned the way it flies. The 3D frame reads each one's
  fields from a plain mirror (Critters' `mirrorFish` / `mirrorBug`: an attachment re-run as they change; the
  itinerary a snapshot), not through Svelte's state proxy, whose every read boxed a number: the critters' frame
  22.0 → 6.4 KB allocated a frame, the island's 158.6 → 141.6 (Chromium heap sampling, the demo at rest).
- **How the bugs move** (`critterPath.ts` bugPath, NH's paces; `FLY_UPS`, u/s, against a villager's 90 stroll and 200
  run): a butterfly or a moth flutters at 14–26 in a meander of 12–26u steps, its heading wandering a little each
  step and turned back in at its clump's edge, now and then hanging a moment in the air, bobbing with its wingbeats
  (2.5u), and every 3–5 turns lands on a flower of its clump for 2.5–5 s; a bee the same at 22–36, never landing; a
  dragonfly darts 24–56u at 60–100 and hovers 0.9–2.2 s; a firefly drifts at 5–11, bobbing slowly; a beetle flies in
  to its trunk at 40–55; hoppers hop, crawlers crawl at their own pace (`PACE`). A flier comes in from 60u off on the
  island's nearer side. None goes faster than a running villager (`critterPath.test.ts`: speed bounds, curvature).
  The moves after its way in are `bugLegs` (its ground, pace, landings, rests and hops as `Ways`), shared with the
  museum's bug wing (`museum/bugLife.ts`), and its wings' beat `world3d/wings.ts` wingBeat.
  A clump is the flowers within 60u of each other (`critters.ts` beds), not the layout's clump tag (those repeat
  across the island: one patch by them spanned half of it). **Wings** (`world3d/wings.ts` FLAPS, `things.ts`): the butterflies',
  the moths', the bee's and the dragonflies' wings turn in the vertex shader by the instance's angle (`flap`, Critters'
  bug3 each frame it's drawn) about a hinge each model's own geometry gives (`wingHinge`: along the body, its +z the
  head, at the wings' plane, from the body's edge or the wing mesh's root; the bee's and the dragonflies' wing meshes
  alone, a butterfly or moth whole, the atlas moth's two wing layers together; `wings.test.ts` checks every model's:
  body still, roots on it, tips up). Seen on the iOS Simulator: heads lead, the roots stay on the body: a butterfly's beat 4–8 Hz by its speed, slow and now and then
  held half closed on its flower; a bee's and a dragonfly's a buzz.
- **Fish** (all 34 of NH's sea and pier fish, `FISH`): NH's shadows by size (20–64u, the eels long and thin; a fin for
  the sharks, the ocean sunfish and the suckerfish); the coelacanth only in rain or snow.
- **Bugs** (74 of NH's 80, `BUGS`), each where NH keeps it: butterflies and moths in flight and landing on the flowers
  (the moth round the lamps); the ladybug and mantises on a flower's head; dragonflies and fireflies near water;
  cicadas, beetles and the walking stick on the oaks' and cedars' trunks (NH's stump bugs too: the island has no
  stumps); NH's palm beetles on the palms (the cyclommatus and golden stags, the horned atlas and elephant, the goliath
  beetle); grasshoppers, crickets, the pill bug
  and the centipede in the grass; the hermit crab and the wharf roach on the beach; the mole cricket under a chirping
  mound (a tap digs it up); the tarantula and the scorpion at night, gentle: the first tap makes one rear up (on the
  3D island its front lifts under NH's 「！」 till it settles), a second while reared makes it charge off, and once it
  settles a tap nets it; a flea hops off my villager 1 in 10 taps
  (Apr–Nov); the pondskater, diving beetle and giant water bug on the pond and the river's still reach. A tap nets one,
  judged where the 3D island draws it (its model's spot, not its invisible sprite's: a percher flying in to its trunk
  is 30–110 px off its sprite), even over my villager, a canopy or a door in front of which it flies (`e2e/bug-taps.spec.ts`);
  a tap within 30px (or its size) nets it, one just past it (within 56px) startles it away (on both phones), and so does
  my villager running at a flier, a percher or a hopper within 70u (NH: they keep still for one creeping up;
  `critters.ts` fleesFrom). A bug a dev hook brings keeps clear of every control; one of ambient
  life's sits where its seed puts it (a tap on it comes first, before a control under it). Left out: the blue weevil beetle, the giraffe stag
  and the horned hercules (no icons), the dung beetle, the ant and the fly
  ([decisions.md](decisions.md#the-rest-of-nhs-bugs-what-the-island-can-hold)).
- **Diving** (`island/sea.ts`, NH's 40 sea creatures, loaded with the first bubble spot; `e2e/dive.spec.ts`): 1 turn in
  4 the sea holds a spot of bubbles instead of a shadow (gone after 30 s). A tap dives: still and slow creatures are
  caught at once; a medium one half the time, else, like a fast one, its shadow darts off and a second tap on it in
  time (1.6 / 1.3 / 1.0 s) catches it; a very fast one gets clean away 1 time in 3. 1 spot in 25 is a pearl (a shell
  in the ずかん).
- **The catch:** the official icon pops out of the catch onto a plate with NH's catch line (`island/catchLines.ts`:
  English from Nookipedia, Japanese from the game), loaded with the first critter. Every catch's and find's plate
  (fish, bugs, sea creatures, shells, fossils, a dig, a bottle, fragments, mushrooms, a tree's bugs and coconut, a
  balloon present, the partner's and the guest's) goes in one stack at the bottom centre (`island/catchStack.svelte.ts`,
  `island/CatchStack.svelte`): above the home indicator and しずえ's box, clear of the say button (its room kept on
  both sides) and over the partner's edge face. The newest enters at the bottom and the older slide up; each fades out
  on its own timer (the pager's) or a tap, and the ones above slide down into its room. At most 3 show: a fourth
  fades the oldest out early. Reduced motion: no slide, a quick fade. The plate is the whole of it: nothing is held up
  over a villager's head (the stack says it, its icon from the catch).
- **Cost:** each critter is a world node; it moves by CSS transitions inside it between waypoints a timer picks (no
  rAF), one wing or fin loop each; one timer between visits; art on first need. World cues `scene-<kind>`, quiet and jittered ([Cues](#cues)).

### Beach finds

`island/Finds.svelte`, `island/beach.ts`, `island/sceneDay.ts`, `e2e/finds.spec.ts`. The day's items derive from the
Tokyo date and time plus a seed, so both phones agree; what either of us picks up, digs or opens is gone on both
([Shared world](#shared-world): a `pick`, claimed at the tap, first wins; this phone keeps its own in `scene-day` too),
the next dig spot is the same on both, and on the other phone our villager turns to it, it's picked up (or dug) where
it lies, its plate in the bottom stack (nothing held over the head). The first of each shell, fossil and fragment is a ずかん `find`, written when it's picked up (and still ours).

- **Seashells** (NH's eight; the summer shell rare, likelier June–September): one washes up every 60–120 s, the newest
  three lie on the sand. A tap picks it up: 「タカラガイを ひろった！」.
- **Washing in** (the user, 2026-11-03: "instead of suddenly appearing, can we animate them fading in and moving up
  the beach like they're being swept up onto the beach"; `layout/swash.ts`): a shell, the bottle or a fragment that
  turns up while the island is open waits for the next wave at its stretch of the coast ([The sea's wash](#world)),
  then rides it in: from just past the waterline straight up the beach (the shore's normal, from the land field) to
  where it lies, ~1–1.5 s easing out, fading in (its model's own opacity, things.ts; its tap area moves with it).
  What lies there as the island opens just lies; reduced motion: it fades in where it lies. Taking it is as ever.
  `?find=washed`: a bottle washes in 1.5 s after the island opens (`e2e/finds.spec.ts`).
- **Where things lie** (`beachSpot`): shells, fragments and the bottle keep 34u apart (`BEACH_GAP`), each taking a
  spot that far from everything there in a seeded order; worked out once per date and seed, so nothing moves.
- **Fossils** (all 73 of NH's: the standalone ones and every dinosaur piece, `FOSSIL_SETS`): NH's star-shaped dig
  spot, 2–4 at a time on six lawn spots (`world.ts` `DIG_SPOTS`: four on the front lawn, two behind the trees), each
  shown only where it's clear of every control on this screen. A tap digs it up (the shovel, a burst of earth, an open
  hole that fades): 「化石を ほりだした！ アンモナイトだ！」. The next turns up 20–40 s later.
- **Mushrooms** (`island/mushrooms.ts`): every November day 1–2 beside the trunks (1 in 8 October and December days
  one), NH's weights; a tap picks one up. 1 in 20 November dig spots hold the rare mushroom. Cosmetic: no `find`.
- **Message bottle:** every 8–14 minutes one rocks at the water's edge for 6; a tap reads its note (16 kind notes).
- **Star fragments:** each wish on a shooting star, either of ours (`wished`, kept by the store past its day and in
  the sheet's day row), is one fragment on the beach the next morning (from 05:00, at most 8), now and then a large one
  or the season's zodiac fragment (twice as likely after a meteor shower), twinkling now and then.
- **A balloon's present:** where it lands it's put on the island for both (`put`; the balloon itself is each phone's
  own); either opens it, what's inside decided at the tap and shown on the other phone too (「うめが ○○を てにいれた！」).
  A tree's present is the same put, by its tree's id ([Shaking a tree](#shaking-a-tree)).

### Island care

`island/Care.svelte`, `island/care.ts`, `e2e/care.spec.ts` (no ベル, no find):

- **Weeds** sprout every 30–60 minutes on the lawn's free spots (`LAWN`), the newest three at a time; a tap pulls one
  (`scene-weed`), gone on both phones (our villager pulls it on the other).
- **Watering:** a flower tap is NH's watering can (a tilt, drops, a glint; `scene-water`); a flower watered today, by
  either of us, glitters for the day on both phones (`wateredOn` and the shared day's `watered`, by the flower's id `fl:<x>:<z>`,
  from where it stands). The flowers watered yesterday, both people's, have a 1 in 4 chance of a hybrid colour on one
  of them today, the same one on both phones (NH's hybrids by kind, simplified: `care.ts` hybridsOf; `scene-garden`).
- **The rock** (on the health lawn behind the left tree): a tap clonks it with the shovel (on both phones); 1 in 4 a
  sparkle, 1 in 8 a pill bug or a centipede crawls out (on both: a `put`).
- Weeds, dig spots and the rock are measured clear of the controls on each screen (a covered spot isn't shown).

### Pond

`island/pondFish.ts`, `island/critters.ts` (`freshWhere`, `freshAreas`), `e2e/pond.spec.ts`. NH's pond at the plaza's
left (`world.ts` `POND`, an oval 80 × 44u baked into the ground with lily pads and a slow ripple live on it), the river
and its mouth, and the spring and the river above the cliff.

- **Fresh water by where you cast** (NH's locations, `freshWhere`): the pond's 12, the river's 27, the river mouth's 3
  (salmon, king salmon, sturgeon) and the clifftop's 4 (char, cherry salmon, golden trout, stringfish); as in NH the
  river's own also come to the mouth and the clifftop. `FRESH`, its own chunk fetched with the first freshwater shadow.
  Season weights the odds, hours hold, rare = low weight.
- **Visits:** as often as the sea's (their own slot), one shadow per water, to the water and reach its seed picks
  (the same on both phones, in view or not: `critterPath.ts` freshWater), 45 s if nobody fishes (it stays while a line
  holds it), drawn at 0.65 of the sea's size; each patch and every point of a swim on that water's own tiles, clear of
  its banks (`critters.ts` waterAt: a pond's oval no longer puts one over the grass at a put-down pond's corners, nor a
  river reach out at sea). My villager fishes from wherever it stands on the bank ([Critters](#critters), Fishing).
- **Its bugs:** the pondskater and diving beetle by day in summer, the giant water bug at night.
- **The catch:** a ずかん `find` of kind `fish`, like the sea's.

### Zukan

`kiroku/Zukan.svelte`, `kiroku/ZukanCard.svelte`, `kiroku/zukan.ts`, `model/finds.ts`, `model/tally.ts`,
`e2e/zukan.spec.ts`. The ずかん is its own sheet (`kiroku/ZukanSheet.svelte`: the HUD menu's ずかん pill, grown out of it,
Sheet's `pop`): first one row per kind with how many either of us has found (`ZukanCard`), a row → that kind's page
with ‹ (titled with the kind: a level's title is its own name, the ledger's day its date); the next opening starts on the rows. Shared (the first `find` of either of us): さかな 80 (the sea's 34 and the pond's
46), むし 74, うみのさち 40, かせき 73 (laid out like NH's museum: the standalone ones, then each dinosaur with
「Tレックス 1 / 3」), かいがら 9 (the pearl last), and a balloon's presents: カタログ 1,836 (by NH's categories: かぐ,
こもの, かべかけ, てんじょう, トップス... かさ) and レシピ 126 (by season). Every catch and pick-up counts: each found tile shows
「×12」 and the picked entry's head the total and each of us (the day tallies, `tally`, backend.md#tally); a find from
before the tallies counts 1. カタログ and レシピ load their names with the page (`i18n/catalog.ts`, the language on screen)
and build their grid a slice per frame, as the むらびと picker. A kind's page: every entry in the game's order, the official icon and name for found ones, a silhouette and
？？？ for the rest, 「コンプリート！」 when all are in. The page's head is pinned: the kind and its count, and the picked
entry (icon, name, 「7/4 ウェイが 見つけた」 and NH's catch line, two lines, ▼ for more); the grid scrolls under it.
Names of everything catchable live in their own catalog (`i18n/catch.ts`), loaded with the ずかん or the first catch.

### The museum

`museum/` (`MuseumRoom.svelte`, `engine.ts`, `plan.ts`, `species.ts`, `exhibits.ts`, `MuseumCard.svelte`),
`routes/museum`, `e2e/museum.spec.ts`. NH's museum (はくぶつかん) is a building on the layout
(docs/island-layout.md "The island's buildings"): NH's own model (StrcMuseumA02, the built-up museum with its banners),
7 × 4 tiles, one to an island, at the back on the clifftop behind the campsite by default; the members move and turn it
in the editor and on the phone's もようがえ, never take it away. A tap on it walks my villager up to its door and goes in
(the door's iris, as a home's) to its own screen; ‹ 島へ or the doormat comes back out, just out of its door.

- **Inside** (plan.ts, model units, the rooms' scale: a tile 10, a villager 16): one floor, NH's layout: the entrance
  hall in the middle (NH's lobby: its marble floor, its stone walls with a gold cornice, the red carpets from the door to
  the owl's medallion and on to each wing, red banners, Blathers at his desk, NH's model; no pillars), the
  bug wing to the left (こんちゅう), the aquarium to the right (さかな), each through an opening in the hall's side wall.
  NH's own museum floors and walls (scripts/world3d-models.ts `--museum`: static/room/museum/tex/), lit warm; a little
  dimmer at night.
- **No surfaces fighting:** no two faces share a plane. The walls' slabs meet at each joint with one running over its
  square (the tallest, the one in its own line first) and the others stopping at it (plan.ts wallEnds), the cornice the
  same; what lies flat on another (the carpets, the medallion, the doormat, the shadows, the garden's paths, soil and
  pond, a tank's caustics) is drawn a layer over it in depth (geometry.ts decal: polygonOffset); the glass of the tanks
  and the cases is open below (its floor the sand's or the soil's top); their frames' posts and rails never overlap
  (geometry.ts frameOf), a case's posts' feet a little under its soil; every tank's top well under the first person's
  ceiling (the great tank's glass top was the ceiling's plane at 52: a stair-stepped fight from below, so it's 48 like
  the deep's); the wings' ceilings start at the hall wall's far face (the lintels' undersides lie at their height too:
  a dashed seam over each opening); the garden's paths one mesh in the world's tiling, its pieces never overlapping.
  surfaces.test: no two faces of a tank's or a case's pieces, the floor and the ceiling within 0.05 u in one plane
  over the same spot facing a same way. The depth range is the museum's only: the near plane just over its tallest top
  (the cornice), the far one past its farthest corner (at the default view ~40× the precision of a fixed near of 4).
- **Like the rooms:** a tap on the floor walks my villager there (plan.ts walkPath: a half-tile grid, A* with its corners
  pulled straight, round the walls and what stands on the floor); a drag turns the camera, a pinch zooms, ⌂ puts it
  back; the camera is NH's room view following my villager through the rooms (kept over the floors near the door), the
  walls cut away (engine.ts cutaway, each stable as one walks: it changes only as the camera turns past a wall or one
  passes one): a wall whose line runs between the camera and where it looks and that faces the camera (the front walls,
  as NH cuts them; whichever ones face it once it turns), and a wall that would hide my villager (a jamb as one walks
  through an opening, gone a fade's walk ahead of it, back once clear by a margin). At my villager's eyes none is cut ([First person](#first-person)). A wall going or coming fades in
  220 ms (dithered: alphaHash, so it stays opaque and unsorted; its programs compiled with the rest). The say button says a phrase in here only (`say` `sc: 'm'`).
- **The curator** (`curator.ts`, `lines.ts`): フータ (Blathers) behind his desk (plan.ts `DESK`, its top 8.6 high; he
  stands 8.5 behind its back, his own back 0.8 off the hall's back wall: no pose of his reaches into it, curator.test
  posing his model in every mood against the desk's box grown by 0.25; at 2 behind it, as he first stood, his belly and
  wings went through its top) is the villagers' skinned model
  (villagers3d/blathers.glb: NH's skeleton; NH's files have no clips), posed on his bones every frame by curator.ts
  `mind()`: breathing (his chest, a little bob), an owl's quick glances about with now and then a curious tilt, his
  blinks, a wing gesture every 5–12 s (a ruffle, a wing raised to his cheek in thought, a stretch); with my villager in the hall
  in front of him he watches it. Alone for half a minute or so he nods off on his feet (a yawn, his head drooping to one
  side, eyes shut, slow breaths, the little nod as he catches himself) and wakes with a start when my villager comes up
  or taps him. A tap perks him up (eyes wide, a hop, his tufts up) and is his line in NH's balloon (island/Talk.svelte,
  his name on a brown tag): his welcome first in a visit, then one of six (museum.curator.*, ja/en: what's on show
  counted, the fish tanks, his dread of bugs, the ずかん…), never the same twice running; a wing raised as he explains,
  his beak moving while it types, till it closes; my villager turns to him. The cost: while he's on screen the hall
  draws at the exhibits' 30 a second (his pose only, no allocation; the iOS Simulator, iPhone 16: 29.9 frames a second,
  ~1 ms a frame, 96 draw calls, Safari's WebContent and GPU processes ~3.5 % of a core each); off screen he's not stepped
  and asks for no frame. Every joint he poses keeps to its natural range (curator.ts `RANGE`; curator.test holds every
  frame of every mood to it, and poses his model in node: no vertex flung off, no edge stretched, no wing edge-on):
  his wings move in their own plane (raised, the elbow bent up) with a little forward swing at most, since swung
  forward or folded they showed the camera their edge, a black needle; his head turns 0.4 at most (further, NH's brow
  spots, the dotted V from his tufts to his beak, ran across a side-on face as a dotted line); his tufts −0.25 to 0.6.
- **Who else is in:** the rooms' presence, the museum's own scope (`tent` with `sc: 'm'`, its points within the
  museum's ±320; live-protocol.ts): the others' villagers are here while they are, walking as they walk, and nowhere on
  the island meanwhile (store/where.svelte.ts `home` `M`). The guest comes in like anyone.
- **What's on show** (species.ts): one of each fish and bug in the ずかん's first finds (anyone's, the guest's too), as
  it's found (the fish seven a tank at a time: the hour's fish, below); nothing else (the guest visits too, and its finds are on show under its name). The ずかん's alone, never the
  pockets': selling every one caught takes nothing out (NH's donation, not a catch kept). A tap on one: its card (MuseumCard: NH's icon, its Japanese and English names, 「7/4 ウェイが
  見つけた」, ×n from the tallies as the ずかん counts).
- **The aquarium** (`aquarium.ts`, `tanks.ts`, `boids.ts`): NH's three tanks (species.ts tankOf): the great sea tank
  along the back wall (the sea's fish, the rays and sharks), the deep-sea tank on the far wall across from the opening
  (dark: the oarfish, the coelacanth, the barreleye, the football fish, the squid, the sea butterfly), the river tank as an
  island in front (the fresh water's: the river's and the pond's fish, the turtles, the frog), its middle in line with
  the great tank's; between them an aisle from the opening to the deep's glass, NH's two park benches in it facing the
  great tank, a plant in three corners. Each tank with NH's own props along its back (kelp on its rocks, coral, the
  deep's dark rocks, the river's stones, logs and water plants), the fish swimming in front of them. No diver (NH's
  diver and little submarine model read as a person standing in the tank: left out). The tanks and benches are there
  with nothing found yet (empty water).
- **The benches** (`seats.ts`, `rooms/seating.ts`; the user: "I should be able to sit on seats and benches"): the
  island's park bench at 1.2× (`dmbench1`, `dmbench2`), two seats each, its own seat anchors (`seats3d.json`
  `park-bench`, scripts/seat-anchors.ts) facing the great tank. As in the tent: a tap on a bench (its box on the tap's
  ray, before a fish behind it) walks my villager to its nearest free seat's step and it sits down there (villager3d
  sitAt: the engine's `sit`); a tap on the floor gets it up and walks; both seats taken: a `boop`. The others see it
  through the rooms' presence (`tent` with `sc: 'm'` and the seat: `seat`, `n`, `s`), a phone opening later too; two
  on one seat, the earlier sit keeps it (`outsat`), the other gets up. Seated, the eyes are at its seated head, the
  head turns but the body stays, and the eye may be over its own bench. Seated at rest: the exhibits' 30 a second, no
  more. `e2e/museum.spec.ts`, `e2e/first-person.spec.ts`.
- **The hour's fish** (species.ts onDisplay; the user: "let's increase to at most 7"): each tank shows at most seven
  (PER_TANK) of its own species (the feeders not counted), only those the ずかん says were caught, none twice; a shuffle
  seeded by (Tokyo's date and hour, the tank), so every phone shows the same seven and a new seven each hour. **The great
  tank always has a hunter** (the user: "in the largest tank, always include at least one predator"): its first is the
  shuffle's first caught predator (feeding.ts PREDATORS: the great white, hammerhead and saw sharks, the giant
  trevally, tuna, blue marlin, mahi-mahi), the rest in the shuffle's order, so its feeders come every hour. Caught-only
  still: with no sea predator caught yet there's none (and no feeders there). The deep and river tanks have no such
  rule (their predators come and go with the shuffle). A tank with none of its own caught is empty water. The hour turning while one's inside:
  the outgoing fade out and the new fade in (1.6 s, dithered: alphaHash only while fading), at once off screen. The fading program is compiled in the warm-up with the walls' (engine.ts warm, the exhibit's `dither`): the swap compiles nothing mid-fade.
- **Nothing clips** (tanks.ts bodyIn, propsOf; boids.ts reachOf): a fish's reach is its model's box, turned any way,
  pitched up to 0.35 rad and banked up to 0.22, its tail's sway added; its middle keeps to the water less that reach (the sand's top to the
  water's surface), so all of it stays inside the glass. A big one is scaled till its reach fits 68% of its water's
  narrowest side (tanks.ts FIT: room to turn and for six others; 80% with five a tank: seven of the biggest at 0.85 of
  that overlap pairwise about as often as five did), a little one drawn at least 6 long. The props keep to a back strip (tanks.ts backOf:
  the back 40% of the narrow side, the far wall's for the deep tank), each scaled to fit it and moved in from the glass;
  the fish (the walkers too) keep to the open water in front of it (openOf), so none ever swims into a rock or lies on
  a log. tanks.test samples every species' corners in the open water for two minutes of swimming, seven at a time, and
  every prop's in its back strip.
- **Swimming** (boids.ts stepSchool, NH's calm): long, gently curving passes along the tank's long side, a leg at a
  time to a spot near the far end (a quarter of legs stop partway), turning round only near the ends. Its turn is
  bounded by its size (turnOf: ~1.5 rad/s for a little one, ~0.85 for a shark or a whale shark), eased in and out,
  banked a little into it (up to 0.22 rad); it slows as the glass ahead nears and while turning round, so it never
  whips round in a corner. Its pace is its own: cruising, a slow drift, now and then a pause hovering then a glide off;
  a big fish slower for its length (cruiseOf). Each species at its depth (bandOf: the flatfish, rays, eels, catfish
  and turtles low, the sunfish, the arowana, the gar and the killifish high, the rest mid), drifting up and down a
  little. A soft look-ahead off the glass (inset by its turning room), a light separation off the others, no schooling
  (a tank's fish are one of a kind). Its tail (the vertex shader: one program for every fish) beats quicker and wider
  the faster it goes. boids.test (every species, seven a tank, two minutes): no turn faster than its size's bound, no
  turn of 135° in 1.5 s (100° for a big one), under 5% of its time in a corner and 6% against an end, from near one
  end to the other, its speed varying (slow 2–45% of the time, cruising over 20%), the bottom and surface fish at their
  depths. The bottom walkers walk the river tank's sand (boids.ts stepWalker: a walk to a spot about a patch of its own, a
  rest, keeping off each other's way): the mitten crab sideways, its claws forward, the crawfish ahead (NH's). The water
  is one shader (NH's blue to its depth, caustics shimmering on its back and floor, rays from the surface), its glass
  tinted its water's colour (the glass and the floor's caustics one pass each: forceSinglePass, not three's back-then-front
  two for a transparent DoubleSide), the three tanks' bubbles one Points risen in the shader. A species is one
  InstancedMesh, culled by its tank's bounds; a tank off screen rests (each tank's frustum test once a frame); the wing
  off screen, nothing at all; nothing allocated in a frame. iOS Simulator (iPhone 17 Pro, a full museum):
  the aquarium at rest 177 → 81 draw calls, 123k → 58k triangles, 285 → 193 geometries, by the three tanks and their
  fifteen fish in place of nineteen tanks and every fish.
- **Feeding time** (`feeding.ts`, pure; the user: "sharks and other large fish should be able to eat smaller fish"):
  in a tank with a predator on show (PREDATORS: NH's big fish that eat little ones, the sharks but the whale shark, a
  filter feeder; the giant trevally, tuna, blue marlin, mahi-mahi; the river's arapaima, pike, gar, dorado, stringfish,
  black bass, giant snakehead, arowana; the deep's coelacanth and football fish), a few little **feeder fish** come in
  from the top: generic silvery fish (the three tanks' one tiny low-poly InstancedMesh: one draw call and one material,
  FEEDERS slots a tank, the gone ones scaled to nothing, hidden while none's in; each matrix written straight into its
  array; the fish shader's tail), never a ずかん species (the caught-only rule stands). The first school 5–12 s after
  the tank comes on screen, then every 30–90 s, 6–10 at a time (the user: "increase the number of school fish by 2×"),
  at most 12 (FEEDERS) in a tank; they fade in and swim as a loose school, cheaply: each to its own spot about the
  school's middle (a sunflower spiral turned the way the school heads: together, the same way, apart, O(n), no pair
  compared), off the glass; after 80 s, or with no predator left (the hour's pick), they swim up and fade away. A
  hunt: the predator (looking four times a second) notices the nearest feeder within ~30 u (and one it can reach: not one up by the glass, where its
  body can't go), **stalks** it (slow, straight at it, up to 4 s), then **chases** it (quicker, up to 7 s; its turn
  bounded by its size as always, so a little one jinks away), the school **scattering** from it (a feeder's dash spent in
  ~2.5 s, back in ~6); close and just ahead, a **lunge** (a burst, 1.6 of its cruise and of its turn, up to 1.2 s;
  straight to its prey's depth); at its nose a **bite**: its head dips and back, a small puff
  of bubbles, the feeder gone in 0.4 s. A miss, a feeder slipped off to the glass or the time out: an escape, and it
  cruises off on a new leg, resting 8–18 s before the next. About four hunts in ten end in a bite (a feeder that jinks
  aside as it lunges gets away), roughly one a minute. Cosmetic and local (each phone its own seed), stepped only while the tank's on screen,
  nothing allocated in a step; a bite's puff one Points a tank, reused (its uniforms), hidden between bites. feeding.test (a shark's, a hammerhead's, a giant trevally's, a pike's, a dorado's and the
  football fish's tank, ten minutes, two seeds): every hunt over in 12.2 s, over a fifth each bites and escapes, schools of
  6–10, never over 12, every feeder and fish inside its water; none in the whale shark's or the koi's tank; the predator
  gone, its feeders leave. aquarium.test (the aquarium built with a stub kit): the feeders one InstancedMesh for the
  three tanks, each tank's slots its own feeders, never over 12, inside its water; the bubbles one Points; no
  transparent DoubleSide drawn in two passes.
- **The bug wing** (`garden.ts`): NH's garden under glass (its sky and palms on the walls, dusk-blue at night): stone
  paths, a pond (NH's museum water, one small opaque shader: clear aqua at its rim deepening to blue, a soft net of
  light drifting over it, a thin pale wavering edge at the stones; moving only while it's on screen, at the exhibits'
  30 a second), NH's oaks and a palm (the island's models), NH's flowers in rows, the museum's own garden props
  (flower beds, bushes, a fallen log with its autumn leaves, ferns, cacti, the mangroves), and five glass display
  cases on stands along the back. Each bug found lives there as it lives (species.ts habitatOf, from island/critters.ts)
  and moves as the island's do (`bugLife.ts`, pure: the island's own `critterPath.ts` bugLegs and bugAt, NH's paces,
  meanders, landings, hops, crawls and rests, and `world3d/wings.ts` wingBeat and flapGlsl, the per-model hinge; no
  copy), each kept to its enclosure (a box of air over a row of flowers or the pond, a patch of grass or soil, a
  trunk's bark, a bush's top, the pond's water, its case's floor) shrunk by its own size and its wings' reach, so it
  never meets a prop, a trunk, a canopy, a flower, the glass or the ground: the butterflies and moths meander over the
  flowers and land on one now and then for 2.5–5 s, their wings slowly opening and closing; the bee buzzes from flower
  to flower, a moment over each; a dragonfly darts and hovers over the pond; the firefly drifts low over it, glowing
  (brighter at night); a ladybug or a mantis sits on a bloom, turning, the stink bugs amble over the row's heads; a
  grasshopper or a cricket hops in the grass and sits; a beetle or a stag crawls its trunk's bark (head up within 0.5
  rad, backing down) with now and then a short hop, a cicada clings and shuffles, shivering as it sings in bouts; the
  snail and the walking leaf creep on the bushes; the ground crawlers (the spider down from its tree too) crawl the soil
  with pauses; the pondskater glides on the pond, the diving beetle and the giant water bug a little under it; the case
  bugs walk their case's floor clear of its agave (the hermit crab sideways, the tarantula and the scorpion still a
  long while, turning to watch); the bagworm hangs on its thread. Its itinerary is drawn a minute at a time from its
  seed and played on from where the last ended. Drawn a little bigger than NH's (1.9×, the island's way), one
  InstancedMesh a species (its parts merged, one material a part: a bee's or a dragonfly's wings their own, flapping),
  culled by the room its enclosure takes: off screen it rests (nothing of it worked out), on screen it steps at the
  exhibits' 30 a second with nothing allocated a frame. Tests: bugLife.test (every species two simulated minutes at 30
  fps: never out of its enclosure or case nor in a solid; none faster than NH's pace; the fliers fly, the crawlers and
  hoppers go and rest; the butterflies and moths land, the bee hovers, every flapping model's wings open and close).
  iOS Simulator (own iPhone 16, iOS 26.5, a full museum, local builds), the bug wing at rest: 30 frames a second
  before and after, frame cost p50 1 ms, 87 → 117 draw calls (each bug's every part now drawn: a bee's and a
  dragonfly's wings were missing).
- **Performance:** the wings' exhibits are built only once the finds are in (exhibits.ts: a wing rebuilt only when its
  own list changes), their models loaded per species (the museum chunk, its props and textures under /room/: cached on
  first use); every frame moves only the tanks and bugs on screen (each culled by its own bounds, so the hall draws no
  wing's fish or bugs); 60 a second while something moves (a walk, the camera), the exhibits' 30 while only they do,
  nothing while nothing on screen does (the hall at rest: 30 a second while the curator is on screen, his idle). The tanks' and the cases' stands, bases, water, glass
  and frames are one mesh a material (geometry.ts batcher). Measured on the iOS Simulator (`npm run ios:indoor`, a
  museum with every fish and bug): the hall at rest 30 → 0 frames a second, 258 → 93 draw calls; the aquarium 335 →
  170, the bug wing 250 → 84; the way in's longest frame 301 → 79 ms. Once everything is in, what isn't on screen yet
  is made ready while the hall is still (its textures up eight at a time, its programs compiled: engine.ts warm), so a
  wing's first sight is no hitch (walking into the aquarium: its longest frame ~100 → 36 ms); the cost, every wing's
  textures on the GPU whether visited or not (~300 small ones, a few MB). On WebKit its models' textures are plain
  images, not ImageBitmaps (world3d/gltf.ts `plainImages`; three's GLTFLoader makes ImageBitmaps on Safari 17+): WebKit
  uploads an ImageBitmap at ~1.5–2 ms a texture against ~0.17 for an image (iOS Simulator, the critters' 196: 280–340
  against 34 ms), the same pixels; the museum's uploads on a visit 406–502 → 83–95 ms of the main thread. The island
  keeps its ImageBitmaps (an earlier try of plain images there froze it up to 913 ms in a frame). A wing rebuilt (a new find while one is
  inside) keeps its programs: the old wing leaves the scene at once but is disposed only once the warm-up has compiled
  the new one's materials (engine.ts `retired`), which then find their programs made; disposed first, three freed the
  programs with their last materials and the new wing compiled them again in a frame, its fading ones at the next
  hour's swap (iOS Simulator, the aquarium rebuilt three times: programs 31 → 22, then 9 compiled mid-swap; now 31
  throughout, none; `museum.spec`'s "keeps its programs", `npm run leak -- rebuild`).
- **Never a blank frame:** a resize of the canvas's buffer (a drag's lighter pixel ratio, 2 → 1.5 and back; a new
  size) clears it, and WebKit shows it cleared (the museum's dark) until the next draw, so it's resized only just before
  a draw, in the same task (engine.ts draw; `museum.spec`'s "never shows blank"). Resized after a frame's draw, each
  drag's start and end flashed black on the phone for 60–85 ms (iOS Simulator, a screen recording: 5 flashes in 6
  drags → 0).
- No music of its own: the app has no NH museum track (NH's museum is quiet ambience); the island's hour plays on.

### First person

`rooms/firstPerson.ts` (the shared math and the camera's glide), `rooms/gesture.ts`, `rooms/EyeToggle.svelte`,
`store/firstPerson.svelte.ts`, the tent's and the museum's engines (`firstPerson`, `look`), `e2e/first-person.spec.ts`.
In the tent, the homes and the museum the eye button (bottom left, the say button's mirror; yuzu while on) puts the
camera at my villager's eyes, and back. Kept on this phone (localStorage `island.fpv`; `?fpv=1|0` for a tab); local
only: the others see my villager as ever. Off during もようがえ (the room's camera arranges), back after.

- **The eyes:** the model's own eyes (villager3d `eyes()`: the eye mesh's middle on the face's front, riding the head
  bone, so a seat or a bed takes them along; a card's: 0.7 of its height), followed closely across and with its walk's
  bob damped (140 ms up and down). Standing or seated, the eye follows the head for 0.9 s after it last moved (a walk's
  end, a turn, a sit), then holds there (`headAnchor`): the idle's breath and sway never move the camera, so at rest
  the eyes draw nothing (the museum: only its exhibits' 30 a second). The eye is kept 3 u off the walls (4 in the rooms: what hangs on them), out of what
  stands taller than it (a tent's piece, a museum tank's or case's block), within the floors and the openings
  (`clampEye`). My villager's body is hidden once the camera is near its head (its blob shadow stays).
- **The lens:** 70° (the rooms' 32° is a long lens from afar), the near plane 1 u (the eye is ≥ 3 u off anything), the
  far one as before: no fighting at the museum's 600 u.
- **The glide:** 450 ms both ways, the camera eased from the room's view to the eye, what it looks at from the room's
  middle to where the eyes look (the room stays in view), the lens and the near plane with it. In the eyes come at once
  (through the door, the first frame already there).
- **Closed rooms:** at the eyes every wall stands (the cutaway is the room's camera's: the walls it cut stay cut down
  the glide, and come back once in), and the first person's own pieces show: a ceiling over each room facing down (seen
  from above, its back: culled, so the glide down shows none), unlit (the lights all shine down: a lit ceiling was a
  muddy brown) and dimmed at night and with the room's light: the tent's plaster and beams, the hall's coffers under its
  gold cornice, the aquarium's dark blue, the bug wing's glass roof (dusk blue at night); a lintel over each wing's
  opening (from the wings' height up to the hall's) and over the front door; a closed door in each doorway (a tap on it
  goes out, as the doormat). The tanks' glass and water and the cases are open only below: seen from the side as from
  above.
- **The finger** (`rooms/gesture.ts`, the tent's and the museum's one rule, at the eyes and off them): a tap is a
  finger lifted within 10 px (CSS px: iOS points at any pixel ratio) under 500 ms, acting where it lifts: on a
  villager, a piece, a seat, a door, the curator or an exhibit it acts; else on the floor it walks there; else (a wall,
  the ceiling, the dark) a soft boop. Past 10 px it's a drag from then until the finger lifts: the camera only, never a
  walk, never a tap at its end (back where it began included). Held still longer than 500 ms: nothing. A second finger
  makes a pinch (never a tap; at the eyes it does nothing), the finger left drags on; a cancelled pointer is nothing.
- **The head:** the player's alone: only a drag turns it (the world follows the finger, a canvas's width the lens's 70°,
  0.18° a px on a phone: right turns left, down looks up), the pitch within ±60°, eased 45 ms, no inertia. It starts
  where my villager faces (its walk's way, or what it turned to), a little down; after that a walk never turns it, with
  a finger down or not: the eye rides along, a drag mid-walk turns the head while the walk goes on to its spot, and a
  new tap re-aims the walk. The body faces its walk; standing, it turns to where I look (hidden, so unseen: it keeps
  the eye on its face's front where I look, and the way back out facing it; never the other way round); seated (a
  museum bench), only the head, and a tap on the floor gets up and walks.
  No pinch, no zoom, no ⌂ (the lens is the head's). A tap walks to the floor under it from the eyes' own camera (as
  turned now); the museum's taps stop at the first wall,
  cornice, lintel or ceiling on the ray (a wall's foot walks up to the wall; a fish behind a wall isn't tapped);
  villagers, pieces, the curator and the exhibits as ever, not my own villager. My balloon stands at the view's foot;
  another's goes once its speaker is out of view.
- **Cost:** frames only while the glide, the head, the eye or a walk moves (no allocation in a frame). At the eyes a
  wing's exhibits are drawn and moved only while its opening is in view (or one is in it); the hall alone, 55 draw
  calls (93 from above). The aquarium seen from inside has every tank in view: 387 calls at rest (170 from above), a
  frame's own cost p50 2–3 ms (iOS Simulator, iPhone 16, iOS 26.5, a full museum, `npm run ios:indoor -- --fpv`); the
  tent 9–13. The ceilings' programs compile with the rest (the museum's warm-up: they're in the scene, hidden).

### The shop

`shop/ShopRoom.svelte`, `routes/shop`, `contract/shop.ts`, `contract/shopPrices.ts` (`npm run shop:prices`),
`model/shop.ts`, `store/actions.ts` (sell, buyPiece), `e2e/shop.spec.ts`. NH's Nook's Cranny (タヌキ商店) with its own
money, かいがら (shells, NH's cowrie for its mark), never ベル ([decisions](decisions.md#the-shops-かいがら-2026-11-04)):
the island's catches sell for them and buy furniture for the rooms. Each person's own pocket and かいがら, the guest's
too.

- **Inside:** a screen, not a 3D room (decisions: the shop is a counter, its work lists and prices; a walking room adds
  nothing to them and would cost another three.js scene on the phone): honey wood walls, the green sign, a window (the
  sky's: day blue, night navy with a star), NH's render of まめきち and つぶきち (Timmy and Tommy) behind a wooden counter
  with its register, their line in a cream balloon on the counter (「いらっしゃいませだも〜！」, the offer, 「まいど
  ありがとうだも〜！」, 「かいがらが たりないだも…」…), and under it NH's counter menu, a fixed-cream panel (ink, at every
  time of day). At dusk and night the wood warms under a lamp's glow. My かいがら top right; ‹ 島へ top left goes back out
  (just out of the shop's door). While I'm in here the others' islands show my villager nowhere, as in the museum and
  the rooms ([The tent](#the-tent) "One place at a time": `tent {in, sc: 's'}`); coming out, they see it at the door.
- **うる** (sell): my pocket, everything I caught, found or picked up (my day tallies, model/tally.ts) less what I sold,
  in sections (むし, さかな, うみのさち, かいがら, しげん, くだもの, かせき, そのた: `shop/pocket.ts`), each dearest first:
  its icon, name, price and ×n. A tap picks one more (past the pocket: none again), − one less, ぜんぶ all; the bar
  says 「3こで 120 かいがら」 and うる sells them (one `sell` a kind). Selling never takes anything out of the ずかん or
  the museum. A present's furniture or recipe never sells (it's もようがえ's), nor a message bottle.
- **What a pocket holds** (`contract/pocket.ts`, one table: kind, id, names, icon, price): the fish, bugs and sea
  creatures; the beach's shells (the pearl and coral among them), fossils and star fragments (the ずかん's, counted in
  the tallies since they first turned up); and the goods, `goods:<id>` tally keys with no ずかん page: a tree's wood
  ([Shaking a tree](#shaking-a-tree)) and branch, a pulled weed, the goal trees' fruit and a palm's coconuts, the
  mushrooms, Bunny Day's eggs, junk off the line.
- **かう** (buy): today's stock (きょうの しなもの: 8 pieces of NH furniture a Tokyo day, the same on every phone, from the
  date alone) and the basics always (いつもの: a cardboard box, a zen cushion, a mini cactus set), each with its NH icon,
  name and price; one picked, かう buys it. A piece I own says もってる; too dear or owned, かう boops and the twins say
  why. A bought piece is mine for good in もようがえ (TentEdit's かった tab, and the かべかけ tab for a wall piece) in
  every room I arrange.
- A sell or a buy shows at once with とりけす for 5 s (the banner up over the counter here, clear of the bar), then
  goes to the record, which checks it (the pocket, the wallet, the stock, the price: [backend](backend.md#events)).
- **Prices:** NH's Bells ÷ 20 both ways, NH's own ratio (a sell at least 3): a sea bass 20, a koi 200, a whale shark
  650, wood 3, a coral 25, a T. rex skull 300; a median piece 110, one or two catches ([decisions](decisions.md#the-shops-かいがら-2026-11-04)).
- **The building:** NH's Nook's Cranny with its タヌキ商店 sign, 7 × 4, one to an island, moved and turned in the editor
  and もようがえ, never deleted ([island-layout.md](island-layout.md#the-islands-buildings)); a tap walks up to its door
  and goes in, ‹ 島へ comes out of it. It is the only way in (one goes to the shop to buy and sell, as in NH).

### Dialogue

`island/pager.ts`, `island/Talk.svelte`, `island/Plate.svelte`, `e2e/dialogue.spec.ts`. The speech balloon and the catch
plate read like NH's box: 33 ms a glyph, two lines a page (split at the text's line breaks). A tap finishes the page,
the next turns it, the last closes it; an orange ▼ bobs while another page follows. Left alone a page turns after 6 s
and the last closes after a read's length. The balloon's name tag is tilted on its top-left in the speaker's NH
colour. No voices. Multi-page: some villager lines go on (`<key>.more`), a visitor's first tap is their introduction,
a first find adds 「ずかんに のったよ！」. A line may end on NH's answers (Jack, K.K.).

Where it stands, one rule for every speaker (my villager, the visitors; `placement.ts` `placeBy`,
`e2e/bubbles.spec.ts`): by the speaker, its tail pointing at them, at most 40px off: above the head when there's room,
else beside it, else below the feet, sliding along so the tail still reaches. Room gives way step by step, nearness
doesn't: clear of every control, else over the museum (both within 16px); else over the island's things (trees, fruit
rows) but not the villagers; else over them too. Never over the HUD, しずえ's box, a popup or another overlay, the
speaker, or off the scene. It follows a speaker who moves (a move lasting 0.6 s) and closes if they go. While the
camera moves (a scroll, a pinch, a room's turn) every balloon stays whole, its box, tail and text, carried with its
speaker each of the camera's frames by a transform (`island/balloonFollow.ts`: the speaker's point from the camera, the
island's world node's map, `World.frameOf`, or a room's projected head; no layout read in the frame), and once the
camera settles it is placed again by the rule (`e2e/balloon.ts`; the bug: it hid while the camera moved, and its page's
text, `visibility: visible` of its own, stayed alone on screen). Captions
(`place`: the wish, K.K.'s caption) keep clear of every control, nearest first; the catch plates stand in their stack
at the bottom centre ([Critters](#critters) "The catch"). Every balloon,
plate and caption keeps 12px (`EDGE`) from the screen's sides and foot, above the home indicator. The catch plate is one
plate for every discovery (catches, finds, a present, its first-find page): the icon at its start, two lines a page, the
▼ in its own room at the right; the captions (the wish, K.K.'s song, Gulliver's sleep talk) share one pill
(`.if-caption`: the plate's colours, 13px).

### Villager taps

A tap on my villager is a squish and the tap sound (R9; no ♪; seated, it squishes where it sits, as in the tent), and in NH's flea months now and then a flea hops off
it ([Critters](#critters)); nothing opens. The say button at the scene's bottom right ([Island](#island): 「ひとこと いう」)
opens the phrase picker above it (`island/SayButton.svelte`, `island/SayPicker.svelte`, `island/say.ts`,
`e2e/say.spec.ts`), never a sheet. The picker is a small cream card in the reactions wheel's spirit, standing above the
button, its right edge at the button's (inside the screen; above the keyboard while one is up; outside the scroller, so its
field never scrolls the island): 「なにを いう？」 and ✕, my own last four, newest first (kept on this phone,
`island.says`; a quick pick said again goes first; a list kept when it was three reads as it is), and 「じぶんで かく…」:
a field of at most 20 characters (cut only when the IME isn't composing; a counter), もどる and いう; Enter sends. No
presets: only my own words (the user: "get rid of all the default messages. only custom messages"). With nothing kept
yet it opens straight on the field (no lone button, no もどる; ✕ closes). Every target ≥ 44px. ✕, Esc or a tap elsewhere closes it, as a tree's popup: on the ground that tap
only closes (nobody walks), on a control it still acts (the flea is netted), on the button it only closes; ✕ and Esc
give the focus back to the button. My villager stays put while it's open. A pick
closes it, hops my villager and shows the phrase in its balloon for 4 s (`island/Says.svelte`: Talk's cream balloon,
the name on a tag in the person's colour, its tail at the villager, clear of its emote and the other villager's; it
follows a walk, stays whole by it while the camera moves; text, never markup; taps go through it). A newer phrase replaces
it. On the partner's phone the same balloon shows over my villager there, which hops too (the relay's `say`, presence
only: a phone that is closed simply never sees it, one opening later doesn't either; at most one per 1.5 s, the newer
waiting). No sound beyond the UI cues, no ベル. The speech balloon (`island/Talk.svelte`) is for the island's other
speakers: the visitors, and the museum's curator. One balloon at a time.

A tap on the partner's villager is a **ハイタッチ** straight away (no card), in place: the tap sound, they stop where
they are (either woken first if asleep), a sparkle flies in an arc from my villager to them, and both turn to each
other and hop with the sparkles and one joyful sound (R4, which never waits behind another reaction); hearts on them
as it lands. The banner 「うめさんに ハイタッチ！」 on this phone. It goes over the relay only (`highfive {at}`, the tap's
relay time; never the sheet): their phone plays the same moment from the same start (~50–65 ms later via the test
relay): their villager, which is theirs to move, stops where it is (and says so), turns to mine, my sparkle flies to
it, both hop, hearts on theirs, and 「ウェイさんからハイタッチ！」. Closed, their phone hears it when it opens (the room
holds the last one for them, a day at most): the banner and R5's hearts. Each one is heard once (`island/highFives.ts`:
today's heard ones on that phone, by their tap's time). A tap while one is under way adds nothing, and both tapping at
once plays one (each phone its own). Relay down: the moment plays here, the partner hears nothing. Their numbers and when their data last arrived are on their tree's popup. Off screen, the edge chip by the screen's side (「うめの ほうへ」) still brings the camera to them.

### Players

`scripts/players3d-models.ts` (+ `players3d-page.js`), `components/player3d/parts.json`, `contract/partIds.json`,
`design/avatar/` (tech-notes.md, closet/feasibility.md). A and B are NH's human players by default (`contract/look.ts`
DEFAULT_LOOKS, the signed-off looks), assembled at runtime from parts converted from the game files the user supplied:
- **The body** (`static/room/player/body.glb`, 57 KB, 3.6k tris: NH's player skeleton, skin, legs, the three face
  patches, ears, the three noses) loads once per page. Its skin and face patches carry their tint mask in the
  texture's alpha: the skin colour, like the hair colour, is a tint, never bytes.
- **Faces:** each eye type's 16 frames and each mouth type's 9 as one atlas (`face/<PlayerEyeNN|PlayerMouthNN>.webp`,
  ~12 KB), swapped by texture offset as the villagers' are; the three blush shapes `face/cheek<n>.webp`.
- **Parts:** one GLB per mesh (`mesh/<key>.glb`: each hairstyle with its greyscale texture, each top's and bottom's
  shape, each shoe's, glasses' and ornament's geometry, their colours sharing it), bound to the body's joints by name;
  the body's ten meshes and every part on one skeleton per player (`player3d/skin.ts`: one bone texture computed and
  uploaded a frame, not one a mesh; a mesh whose rest isn't the body's keeps its own); one WebP per item (`tex/<id>.webp`, its colour baked, ~1 KB). A colour change of a part is a texture swap.
- **The part table:** per item its slot, mesh, textures (per material: file, cutout or see-through, tinted by the hair
  or the skin), colour line (its id without the digit), swatch `sw` (its texture's own dominant colour: the closet's
  dot and colour filter, the pixels shared by its line's other colours left out) and closet icon (the catalogue's
  `static/art/finds/items/<icon>.webp`, by the community's item names: `scripts/players3d-map.json`; `icons` each
  icon's own colour). Two of it: the whole table beside the parts (`static/room/player/parts.json`, ~1 MB: fetched
  once, only when a look wears a part the bundled table hasn't: `parts.ts covers`, `loadParts`; createPlayer and
  dress() draw from the bundled one otherwise, so the island never waits for it), and the first closet's in the bundle
  (`components/player3d/parts.json`, 72 KB: what the closet lists now, with the whole one's hash).
  `contract/partIds.json` is every id the app has (compact: an id ending in a digit by its line), given to
  `usePartTable` by `store/look.ts`, so a look naming another part (a newer app's) reads as いつもの's part. The relay
  keeps the form check only (an older relay keeps a newer phone's part).
- **What's converted:** every hairstyle (37, with NH's 16 under-a-hat cuts), eye (26, each with its iris mask) and
  mouth (4), and every top, bottom, shoe, sock, pair of glasses, hat and hair ornament the closet sweep wore cleanly
  (4,338 items: 376 meshes 3.9 MB, textures 13.2 MB, ~17 MB with the faces and the table, all under `/room/player/`,
  lazy). The first closet (the bundled table) is every colour of the art scout's lines and four hat lines (259 items).
  An outfit is ~60 KB over the body.
- **Hats (ぼうし):** at NH's brim; the hair goes under it as NH's cut-down version where the style has one, else away.
  A hat and a hair ornament are both headwear: wearing one takes the other off (closet.ts `wear`).
- **Eye colour:** a tint, as the hair's and the skin's: each eye type's iris mask (`face/<PlayerEyeNN>.iris.webp`, the
  atlas's cells: the iris and, darker, the pupil) takes `eyeColor`.
- **Hair ornaments:** at each hairstyle's top or left side as the pipeline measures them (rays from far out toward the
  head's middle, the hair's first surface: parts.json `hair.<id>.spot`): crowns, wreaths, headbands and horns on top, the
  L ones (hairpins, side bows) on the left side standing out of the hair; B's bow at her ponytail's tie, as signed off
  (player3d.ts `ORNAMENT_ON`).

**The runtime** (`components/player3d/`: `player3d.ts`, `tune.ts`, `parts.ts`, `portrait.ts`):
- `createPlayer(id, look, asset('/room/player'), seed)` → a `Player3D`: villager3d's `Villager3D` (the same
  interface the island, the tent and the museum use: `group`, `set(state)`, `act(action)`, `face(f)`, `step`,
  `blink`/`nextBlink`, `sitAt`, `grip`/`aim`/`tip`/`hand` (the rod), `wear` (a hat), `eyes()` (first person),
  `crown()`, `show`, `lift`, `opacity`, `dispose`) plus `dress(look)` and `look()`. It rejects if a part isn't there
  (keep the stand-in).
  - **Body once a page:** the body's GLB, each mesh, each texture are cached page-wide; a player clones the body.
  - **Swapping:** `await p.dress(next)` changes in place what differs: a tint (skin, hair) is a colour, an eye or a
    mouth type an image under the same texture, a colour of the same garment a texture, a new shape a mesh (bound by
    joint name; a one-piece clears the bottoms; a hat swaps the hair for NH's cut where the style has one).
  - **Faces:** `p.face('happy' | … | null)` takes faces.ts's expressions; tune.ts maps them onto the player's frames
    (PLAYER_EYE, PLAYER_MOUTH), resting on the look's own `mouthFrame`; blinks run as the villagers'.
  - **Poses:** poses.ts's, unforked: villager3d's `animateModel(id, model, seed, kind)` takes a Kind (rig.ts
    `RigOpts`: the hands on Wrist_*, an `after` hook for the cloth, the ponytail, the hands kept out of the head;
    sitOn's reach; the torso's depths for lying; the sting's and the cast's overrides). The villagers' path is
    `createVillager(id, url, seed)` as before (`animateModel` with no Kind).
- `portrait(renderer, player, size, bg)` (`portrait.ts`): the head as a canvas, drawn by a renderer the page already
  has into a render target (never a second context); the player is borrowed and put back.
- `partUrls(look, dir)`: what a look fetches (for a prefetch, or a test).
- `design/avatar/player3d/check.ts`: the runtime drawn off the app's own modules in headless Chrome (A and B in their
  states, faces, a swap, a portrait), for a quick look before the phone.

**Who draws a person** (`components/person3d/person3d.ts`, `e2e/players.spec.ts`): `person3(who, look, villagerPref,
dirs)` is the one seam between the look a person wears (`store/look.ts` `lookOf`) and the model a scene stands up: a
player look → `createPlayer` (its villager as the stand-in if a part can't be had), a villager look → the roster
villager. It's keyed by the look: the island (`world3d/villagers.ts`), the tent and homes and the museum keep a model
while its key stays and swap it in place when it changes (on leaving すがた, or the partner's phone): the island keeps
the old one drawn till the new one is in, the rooms keep the walker (its spot, seat, walk, first person). A player
shows no villager card while it loads (the island draws nothing, the tent's card is its tap area only). Its models'
`dispose()` also disposes their skeletons (three's bone textures, else left on the island's renderer at each swap or
visitor gone). The island's tap area for a player is its core from its crown (0.88 of the crown's height, half that
wide). **The 2D heads** (`characters/Avatar.svelte` `worn`: the sync rows, きろく, ずかん, the museum's finder, けんこう's
select, ごはん's owner, the purchases, the harvest, the toasts, the edge chip) show the look the person wears: a
player's portrait (`look/portraits.svelte.ts`, by the look's hash), the flat stand-in till it's drawn, or the villager's
icon. Besides the すがた preview, the island's renderer draws missing portraits when it's idle or paused under a sheet
(`person3d` `createPainter`, `useIdlePainter`): one player kept for the shots, let go of 5 s after the last. `npm run leak -- look`
swaps looks on the island. The fishing specs fish as a villager (`fishing3d.spec` seeds the look); a player's rod
line-up is the 3D engine's to tune (the spec's fixme).

### Visitors

`island/Visitor.svelte`, `island/visitors.ts`, `e2e/visitors.spec.ts`. NH's visitors, one at a time, each NH's own 3D
model (the user: "only 3D models; no model, not included": a character with none never comes),
seeded by the date, so a visitor comes most days as in NH: **Daisy
Mae** on Sunday mornings 05:00–12:00, and Monday to Saturday one of NH's weekday visitors (`ROTATION`, each at most
once a week, drawn by the week's Monday, with about one quiet day in ten): **Kicks**, **Label**, **Saharah**,
**Leif**, **Redd**, **C.J.** and **Flick** 06:00–22:00, **Gulliver** 06:00–18:00, **Wisp** that night 20:00–04:00
(none on a Saturday night, and nobody at all on Saturday from 18:00: K.K.'s show, the plaza's; K.K. himself is no
visitor now, he lives on the island: [K.K. on his stool](#kk-on-his-stool)); **Jack** on Halloween night, **Celeste** on a meteor shower's night, the holiday hosts on
their days, the wedding couple on its days. Priority (`visitorAt`): the event's host (Jack included), the wedding
couple, Celeste, (Saturday evening: nobody), Daisy Mae, then the day's. `?visitor=none`: nobody. They stand on centre stage in the plaza
(ひろば: `stageOf`, the layout's: where we put **おきゃくさんの ばしょ** in the もようがえ's おきゃくさん tab, else derived; it
moves with a もようがえ, a visitor out then on the new spot at once), its skinned model converted as the villagers'
are (`scripts/villagers3d-models.ts`: the special characters, and `VISITOR_ONLY` for the hosts, Jack and the wedding's
pair) and drawn and posed by the same code and materials (`world3d/villagers.ts`, slot `visitor`; Cyrus `visitor:b`),
at NH's proportions to them, with the same blob shadow; as in NH, **Gulliver washes up on the front beach** (`washedUp`:
where we put **ジョニーの ばしょ**, else a new stretch of sand some days; one plaza and his beach cover every visitor:
island-layout.md "The visitors' spots"), lying face down on the sand, his head to the left (villager3d's `prone`). A tap (while they're on screen): my villager turns to
them where it stands, then their introduction the first time, then one of their lines. No trading, no ベル.

### K.K. on his stool

`island/KKSlider.svelte`, `island/kkSlider.ts`, `e2e/visitors.spec.ts`, `e2e/visitor-life.spec.ts`. The user: "make
kkrider a permanent addition to the island - also make him movable/placeable via the editor". K.K. Slider (とたけけ) lives here,
on his **stool**: a piece of the layout (`kk-stool`, id `kk-slider`; [island-layout.md](island-layout.md): one on the
island, never deleted, moved and turned in the editor and もようがえ, synced as any piece; its front tile kept clear
and reachable for his listeners). The default stool stands on まえ's lawn west of the main path (tile 6 × 22), behind the
visitors' stage and off to its side, a clump of flowers before him, facing the camera, nothing tall in front of him,
off the villagers' ways between their home spots; an island arranged before him
(the record's, with the museum and the shop where the user put them) has him there too, with no op (his tile and its
front free there); where an island's own pieces take that tile, the editor flags it and he's moved by hand, as the
museum and the shop are. He's no visitor any more (`visitors.ts`: not in the schedule, so never
twice), and he's there every day, NH's own model (the visitors' GLB, 58 KB, loaded the first time he's in view, then
kept, hidden out of view) sitting on NH's log stool and facing its way (`world3d/villagers.ts` slot `kk`, the
director's actor `kk`; posed only while something moves, as the villagers are). What he's up to goes by the Tokyo
clock (`kkMode`; `?kk=show|day|asleep` in dev or `?demo`):
- **His show, Saturday 18:00–24:00** (NH's concert; the plaza has no visitor then): a tap is his
  greeting with NH's choice box, **リクエスト** (two songs, or ほかの 曲) or **おまかせ**. The island's music stops for
  the song ([K.K. Slider](#kk-slider): his live file), he strums harder, ♪ float up, the villagers sway and a
  「♪ けけボッサ」 caption sits by him. A tap mid-song offers ストップ / つづけて. At its end his sign-off (「また 来週の
  土曜に な」) and the island's music returns.
- **By day** (06:00–24:00 the rest of the week): he strums quietly to himself, no sound (a nod to the beat on idle
  life's beat, an emote now and then). NH's K.K. only plays on Saturdays; here he lives on the island, so a tap is a
  chat that offers a song all the same (「なにか 一曲 どうだい？」, リクエスト / おまかせ, the same song flow; his
  sign-off 「また いつでも 来いよ」). Decided so: a resident who never played but once a week would just be scenery.
- **Asleep, 00:00–06:00** (after the show too): nodded off on his stool (villager3d's `nap`, a sleepy face, zzz); a
  tap wakes him groggily and he offers one all the same (「…ん…？ ムニャ… リクエスト かい？ ふぁ～… いいぜ、 一曲
  やろう」, the same song flow; awake while it plays, his sign-off 「…ふぁ～ サンキュー… じゃ、 おやすみ…」, then back
  to sleep). The clock reaching midnight mid-song (the show's last one) still stops it.
- **Anyone, any time** (the user, 2026-11-06: "everyone should be able to request songs at any time"): A, B and the
  guest alike, whatever ミュージック is: with it off, picking a song turns it on (the tap that asked for a song wants
  to hear it); with the volume at 0 he says the sound isn't getting through. The song is each phone's own (a cut-in
  on this phone, as a stereo's: nothing of it goes through the relay). Usage counters `act:kk.tap.<mode>`,
  `act:kk.song.<mode>`, `act:kk.mute` (the log's `use`). With no song files he's tuning his guitar (asleep a mumble).
  A tap turns my villager to him where it stands (he's an interactable: no walk). Leaving the island stops his song
  (`stopKK('live')`: never a stereo's).

### Visitors: life

`island/visitorLife.ts` (pure), `island/Visitor.svelte`, `island/avatar.ts` (`meetVisitor`, `visitorRoute`),
`e2e/visitor-life.spec.ts`. The visitor is the stage director's fourth actor (`'visitor'`): its walks, motions,
emotes, fx and facing use the villagers' calls, and idle life gives it a beat on every slot (awake or asleep), drawn from the slot's PRNG.

- **Always:** the villagers' idle pose (villager3d `idle`: breathing, a look about), held still when nothing moves as
  theirs is; the director's motions are its actions (a hop, a wave, NH's three stretches with the villagers).
- **Signatures (NH):** Wisp floats a little off the ground in his glow; Jack twirls with a spooky
  glint; Daisy Mae hums; Franklin flaps and looks about; Jingle hops with a sparkle; Zipper hops; Celeste looks up and
  points (a wave) when a shooting star crosses (`island:star`); Reese and Cyrus side by side, hearts; Kicks and Flick
  nod, Label strikes a pose, Saharah hums, Leif sways, Redd looks about, C.J. hops.
- **Gulliver** sleeps face down on the front beach (zzz, a twitch of his feet and a wing). A tap is a nudge: a twitch and his sleep talk
  (「…ムニャムニャ…」, a small caption); the **fifth** wakes him: a start, a 「！」, he gets up and introduces himself
  (awake for the day).
- **A beat** (`pickAct`): the signature, an emote (never the same twice running), a look at the nearest villager, a
  stroll for those who roam, home when away, or at most every 45 s **the partner comes over** when the visitor is within
  600u of their home (beside them, they face each other, a nod and emotes, then home; one walker at a time). Nothing
  while their line is in the balloon.
- **Strolls:** Daisy Mae, Leif, C.J., Flick, Franklin, Zipper and Celeste amble to a walkable spot around theirs (level or in front, clear
  of every control and the villagers) and back 4–7 s later; the others stay put. The villagers route around them.
- **A tap:** my villager turns to them where it stands; the visitor walks back to its spot if it strolled, turns to
  my villager with a little hop and speaks, standing still until the balloon closes. A tap elsewhere now and then draws a glance.
- **Arriving and leaving:** when a visit starts or ends with the island open: walkers come from the campsite along
  the paths (and go back there, fading at the door), Wisp floats down, Celeste flies down (`liftNow`), Gulliver
  appears, Jack in his spooky puff; they leave the same way (up again, or fading). On a page's first paint they're simply there.
- **Cost:** one more skinned character on the villagers' code and materials (its GLB ≤ 100 KB, loaded on its first
  visit and cached), its spec written over each frame (no allocation); the director's timers; paused with the scene.

### Halloween

`island/events.ts`, `island/Halloween.svelte`, `island/Visitor.svelte`, `e2e/halloween.spec.ts`. NH's Halloween on Oct
31 (Tokyo):

- **All day:** NH's pumpkins on the lawn (`Halloween.svelte`'s `SPOTS`, each only where clear of every control).
- **17:00–24:00:** they become lit jack-o'-lanterns under a purple-to-orange wash, and **Jack** comes instead of anyone
  else. His ask, 「トリック オア トリート！」, ends on NH's answers: 「キャンディを あげる」 delights him (the candy pops up
  over his head); 「なにも あげない」 is his trick: my villager wears party nose glasses for a minute (not kept across a
  reload). Unanswered it closes after 15 s.
- **Villagers:** three Halloween day lines join their chats in the evening.

### Holiday hosts

`island/events.ts`, `island/visitors.ts` (`HOSTS`), `island/eggs.ts`, `e2e/holidays.spec.ts`. Each NH holiday is one date
rule in `events.ts` (`nthWeekday`, `easter`); its host takes the visitor slot from the hour its main part starts, with
an introduction, four lines and two villager day lines:

- **Franklin**, Turkey Day (the fourth Thursday of November, 09:00–24:00): his introduction asks for a fish; the next
  fish caught that day (`island:catch`) makes him happy and he thanks you by its name. Kept for the day on this phone
  (`scene-franklin`).
- **Jingle**, Toy Day (Dec 24, from 05:00), beside the Toy Day decorations.
- **Zipper**, Bunny Day (Easter Sunday; the seven days before are the celebration, and he comes on the first and the
  last). All week NH's eggs turn up as captions: a balloon drops a sky egg 1 in 3, a dig spot holds an earth egg 1 in
  4, a fish on the line is a water egg 1 in 6.

### Birthdays

`island/birthday.ts`, `island/Birthday.svelte`, `island/Cake.svelte`, `villagers/birthdays.ts`, `e2e/birthday.spec.ts`.
Ours come from `PEOPLE` in `config/rules.ts` (ウェイ `10-06`, うめ `03-04`; null turns one off; Feb 29 falls on Feb 28).
On one: both villagers wear NH's birthday hat; NH's cake stands in front of centre stage (else behind it), its candles
lit; confetti over both villagers the first time that day on this phone (`scene-birthday`); しずえ's 「うめさん、
おたんじょうび おめでとう！」. A tap on the cake plays a music box and blows the candles out for the day. Each goal the
birthday person meets that day pops NH's party popper over their villager. An NH villager's own birthday (Nookipedia's
dates, a small module of their own) puts the hat on that villager.

### Wedding countdown

`island/wedding.ts`, `island/Wedding.svelte`, `e2e/wedding.spec.ts`. Our wedding is 2027-10-08 (Tokyo). On the
milestone days (365, 200, 100, 50, 30, 7 and 1 days to go, and the day) Reese and Cyrus are the visitor from 06:00 to
midnight, side by side under a heart float; Reese's introduction ends on the count (「けっこんしき まで あと 100日！」, on
the day 「ごけっこん おめでとう！」), then they take turns. On the day the villagers bow and glow with hearts, confetti
bursts the first time that day (`scene-wedding`) and fireworks from 19:00. Every June Sunday NH's wedding arch stands
behind centre stage.

### Celeste and meteor showers

`island/meteor.ts`, `island/visitors.ts`, `e2e/celeste.spec.ts`. About one night in ten, at most one a week (a week has
one with a 0.7 chance, seeded by its Monday): Celeste is the visitor 20:00–04:00 and shooting stars cross every 3–8 s.
Her lines explain wishing, the fragments and the season's sign (`zodiac.<sign>`). Each wish is a fragment the next
morning, the zodiac fragment twice as likely.

### Shooting stars

`island/stars.ts`, `island/SceneTaps.svelte`, `e2e/sky.spec.ts`. On a clear night in NH's hours (19:00–04:00):

- **Showers:** every 3–8 minutes of on-screen night (the first after 30–90 s), 1–3 streaks; 1 in 6 a bigger shower of
  5–8. The countdown holds while covered or hidden. A meteor shower's night: one every 3–8 s.
- **The streak:** a quick white streak falling to the lower left, its whole path in the sky and clear of every control
  (a short sky beside the HUD gets a shorter one, or none).
- **A wish:** a tap in the sky while one crosses, once a star: sparkles, a chime (`scene-wish`) and 「ながれぼしに
  おねがい！」. Each is a fragment the next morning (`scene-wish`: `{ <morning>: n }`, older mornings dropped).

### Fireworks

`island/fireworks.ts`, `island/Fireworks.svelte`, `e2e/sky.spec.ts`.

- **When:** every Sunday in August 19:00–24:00; New Year's countdown, Dec 31 23:00, a volley at midnight and the show
  until 01:00; our wedding night from 19:00; and a volley of 3–5 the evening both of us meet all four goals (once a day
  per phone, from 18:00; `fireworks-day`).
- **The look:** a shell rises from behind the island and bursts (peony, ring, willow, heart, star, now and then a little
  pixel pattern), NH's colours, sparks drifting down (2.7 s).
- **Where:** the night sky and the open sea behind the island, each burst's whole circle clear of every control; a tap
  in the sky during a show sends one more there. Villagers cheer now and then.
- **Cost:** one transform/opacity keyframe per spark, ≤ 4 bursts at once, one timer between them.

### Group stretching

`island/stretching.ts`, `island/TapeDeck.svelte`, `motion/stretch.svelte.ts`, `e2e/radio.spec.ts`. NH's tape deck comes
out on a day either of us met 🍑 Exercise, or when the island is opened 06:00–08:00 (`scene-stretch`), on the lawn clear
of every control. A tap plays its tape (an original ~6 s march) and both villagers, and an awake visitor, do three of
NH's stretches together (`if-warmup`, `if-sidebend`, `if-leap`); event reactions wait (`holdEvents`). Then the deck
goes for the day. On the island's layout the deck is a fixed piece there every day, NH's boom box at the villagers'
scale (about half a villager tall): on its day a tap plays the tape (the 3D villagers do NH's three: villager3d poses
`warmup`, `sidebend`, `jump`); any other time a tap says when it plays, or that today's is done, and no ♪ floats.

### ききみみ クイズ
An English listening game for the players (A, B and the guest), for Japanese speakers learning English; the full spec
is [kikimimi.md](kikimimi.md). The HUD menu's pill 「えいご ききとり」, above せってい (the guest's too), opens its full-height sheet
(`components/kikimimi/KikimimiSheet.svelte`, its own chunk with the bank, the deck, the session and its strings
`i18n/kikimimi.*.json`); the tap itself starts the voice session (`invite.svelte.ts` wakeQuizVoice → sound `voiceSession(true)`, before the pill's
press beat; openQuiz after it), so
the clips play with the silent switch on. The always-loaded part is `KikimimiHost.svelte` in the island scene: a listener
on the scene's one Live (`relay ?? demoRelay`, never a second) that keeps the quiz intents heard lately (handed to the
sheet's session as it opens: a host re-sends only when someone comes back) and shows another's new lobby as a banner
through the one toast host, 「ウェイが ききとりクイズに さそっています」 [さんか] (that game joined).
- **Lobby** (`Lobby.svelte`): しずえ's welcome, the level (★ やさしい / ★★ ふつう / ★★★ むずかしい; the host's pick, the last
  kept on the phone), 「おなじへや」 (only the host's phone speaks), who's here and who joined, 🔊 「きこえる？」 (a clip from no
  game; 音量 0 says so), the host's はじめる (the others wait for it). Opening it with someone's lobby waiting shows that
  invite and 「じぶんで はじめる」 instead.
- **A question** (`Play.svelte`): 「よーい」 then 3-2-1 once, then each question's speaker pops in with a little pop, bobbing while
  their clip plays, their bubble an empty 「♪…」 with a bar the clip's length; under it the item's `ask` (a word item: its
  line with the blank). The choices (pic: 2 × 2 NH art, VoiceOver labels from PIC_JA; else text ≥ 17 px) stay dimmed
  until the first play ends; one tap is final. 🔁 もういちど and 🐢 ゆっくり (levels 1-2) after the first play, on a phone
  that speaks; each player's chip gets ✓ as they answer. The reveal: ○ on the right choice, × on a wrong pick, the
  English in the bubble (its `focus` marked yuzu), the Japanese and the accent chip, the clip again, the speaker's and
  each chip's ✨ / 💦, the sparkle or oops cue; the host's つぎへ cuts it short.
- **Results** (`Results.svelte`): しずえ's line (the winner, a tie, or the solo score), the ranking, then the review list
  (every sentence's English and Japanese, ○ / ×, ▶︎ and 🐢, 「まちがえた だけ」), おわる / もういちど.
- **Closing**: mid-game a backdrop tap or Esc keeps the sheet (Sheet's `ondismiss`) and ✕ asks 「やめる？」; the lobby
  closes at once (the host's lobby is cancelled for everyone). Closing ends the voice session and drops every clip. While
  the voice is on but suspended (a lock, an app switch) a 「タップして つづける」 card wakes it.
- **The island** is covered (`IslandScene` covered: the 3D island paused, its life still) while the sheet is open.
- `game.svelte.ts` wires the pure `kikimimi/session.ts` to the Live (or to nothing, solo without a relay): the view at
  each phase's end and each message; each question's clip at its start on the relay's clock (`playVoice` relayAt), the
  next one decoded meanwhile, the deck's clips fetched into the cache in the lobby. `?kikimimi=fast` (hooks on) shortens
  the answer and reveal windows on every phone; `window.__kiki` (hooks on) is the e2e's view and right answer.

### Seasonal preview

`ui-state/preview.ts` (pure: `resolvePreview`), `ui-state/preview.svelte.ts`, `panel/SeasonSection.svelte`,
`island/PreviewPill.svelte`, `e2e/preview.spec.ts`. せってい's **きせつ** shows the island another day's look on this
phone: an event, a season (はる / なつ / あき / ふゆ), the weather (はれ / あめ / ゆき) and the time of day (あさ / ひる /
ゆうがた / よる), each おまかせ (the real day's) by default. Folded to one row by default: what's showing (おまかせ, or
「ハロウィン · ふゆ」) and a chevron that opens the four chip groups; もどす sits in that row while a preview is on. One resolution feeds every seasonal look, with two inputs:
the dev params below (they win, field by field) and the setting; then what the event implies.

- **Events:** うめの たんじょうび, イースター (Zipper), さくら (petals, blossom), はなび, ウェイの たんじょうび,
  けっこんしき (Reese and Cyrus, the wedding pose, fireworks), ハロウィン (Jack, the lit pumpkins), もみじ, ハーベスト
  フェスティバル (Franklin), せいなる よる (Jingle, the presents), りゅうせいぐん (Celeste, the shower's stars). An event's
  main part is on at once, and it brings its day's look (its season, foliage and hedges: `EVENT_DAY`) and, for the
  evening ones (Halloween, fireworks, the wedding, a shower), the night sky; fireworks and a shower a clear sky.
- **What follows it:** the theme (`<html>` data-tod/-season/-foliage, the sky, the chrome), the weather's look and its
  music, `eventAt` for the scene (pumpkins, hosts, lines), the visitor, the fireworks, the shooting-star shower,
  birthdays (hats, cake, しずえ), the wedding, cherry/maple/Toy Day's particles and decorations, the hedges' month.
- **What never does:** the scene clock (`?date=` only), the days records and the scene's keys are by, and whatever the
  island yields: critters come by the real month and weather (`yieldSky`), Bunny Day's eggs and the mushrooms by the
  real day, and a wish on a star brings no fragment while it's on. Nothing is synced or sent: it's `island.preview`
  (`{ day, event, season, weather, tod }`) on this phone, for the Tokyo day it was set on; the next day it's off.
- **On screen:** while it's on, a chip under the HUD row says what (「きせつ: ハロウィン」); a tap on it, or もどす in
  きせつ, goes back to the real day. The event music stays the real day's.

### Dev params

Read on each call by `island/devHooks.ts` (the seasonal ones by `ui-state/preview.ts`: the same resolution as せってい's
きせつ, above). The island's hooks work in dev builds or with `?demo`; `?date`, `?theme` and `?season` work everywhere:

| Param | Effect |
|---|---|
| `?demo` (`=harvest`, `&as=B\|G`, `&weeks=60`, `&health=none`) | Made-up data, no backend; the harvest recap; play as B or the guest; a longer history; no Health rows yet |
| `?date=YYYY-MM-DDTHH:mm` | The scene clock (Tokyo), this page load only (it moves the shared day too) |
| `?theme=dawn\|day\|dusk\|night`, `?season=` | Preview a time of day or a season |
| `?seed=` | The island's seed (finds, weather, visitors) |
| `?weather=clear\|cloudy\|rain\|heavy\|snow\|fog\|aurora\|rainbow` | Force the weather (the critters' too) |
| `?wx=real\|game` | The island's weather mode for this load ([Weather](#weather)) |
| `?wx=rain-pm\|clears\|typhoon\|snow\|fog\|cloudy\|stale` | A canned real-weather timeline on the scene clock's hours (`island/wxFixtures.ts`): rain 12:00–18:00; rain until 14:00 then fine (a rainbow); a downpour; snow; foggy mornings; overcast; one fetched 37 h ago (the seeded day) |
| `?event=<id>` | Show an event (the preview's ids: `halloween`, `cherry`, `birthday-A`, `wedding`…; its main part on; Bunny Day's eggs too) |
| `?visitor=<id>\|none`, `?arrive`, `?leave=<ms>`, `?stroll`, `?meet` | A visitor; its arrival; its departure; a stroll; the partner's hello |
| `?kk=show`, `?kk=day`, `?kk=asleep` | K.K. on his stool: his show, his day, asleep (whatever the clock) |
| `?critter=fish\|pond\|<fish>\|<pond fish>\|<bug>\|none`, `&coast=front\|back\|left\|right`, `?sea=<id>\|pearl`, `?flea` | A critter now (kept until caught; ambient visits off), a sea fish off that side; a dive spot; a flea on every villager tap |
| `?shake=nest\|branch\|bagworm\|spider` | The next shake drops that |
| `?rock=clonk\|sparkle\|bug` | Every rock tap has that outcome |
| `?find=bottle\|fragment\|mushroom\|rare-mushroom\|earth-egg` | A beach find now / every dig spot that |
| `?balloon`, `?fireworks`, `?shower`, `?stretch`, `?hybrid`, `?wander` | A balloon; a show (`?event=fireworks`); a meteor shower's night at any hour (`?event=shower`); the tape deck; a hybrid flower; the partner wanders |
| `?hit` | Every tap target drawn over the island (magenta: the scene's elements; cyan: the boxes a module tests) |
| `?fps=30\|60` | The 3D scenes' frame rate for the tab, not kept (the e2e pin 60 in storage: `playwright.config.ts`) |
| `?fpv=1\|0` | The rooms' first-person view for the tab, not kept ([First person](#first-person)) |
| `?awake` | The villagers never doze (22:00–05:00 otherwise) |
| `?relay=<wss url>&key=<key>` | The demo over a real relay (the island and the rooms; `e2e/sync-harness.spec.ts`, the test relay) |
| `?quietafter=<ms>` | How long a phone gone quiet inside a room stays shown there (the harness's) |
| `?render=none` | The 3D engines run but draw nothing (the e2e's logic mode: `ui-state/testMode.ts`) |

Anywhere (no hooks needed): `?panel=rewards` opens ごほうび at once (the param is then dropped); the 3D island's
renderer takes `?dpr=<ratio>`, `?aa=0\|1`, `?shadows=0\|1` (a software renderer's lightest defaults overridden) and
`?ambient=<fps>` (the ambience's frame rate). The editor's (`?view`, `?edit`, `?cam`, `?check`, `?preview=0`, `?eye`,
`?at`): [island-layout.md](island-layout.md).

The live island also sets `window.__world` (`cam()`, `go(z)`: the camera there at once; `at(x, z)`: a world point's
client px; `put(x, z)`: my villager there; `idle()`; `quiet()`: no opening beat or line queued; `perf`; `stops()`: the
camera's two ends; `mine()`, `partner()`, `geo()`, `site()`, …) for the e2e and the console (e2e/island.ts wraps them).

## Motion

- **Rig** (`Villager.svelte`, `Host.svelte`): `.actor` › `.face` (facing) › `.body` (one motion) › the art; emotes and
  fx sit beside `.face`, so they never squash or mirror. What sits on the head (the birthday hat, Jack's party glasses)
  goes where each render's head is, a sting's swollen eye on its eye: `villagers/heads.json`, measured from the art by
  `npm run heads` (`scripts/heads.ts`: the head from the alpha, the eyes as lit dark blobs, a level pair, with a
  hand-checked table where that misses), loaded only when one is worn. The director (`motion/director.svelte.ts`) holds one state per
  actor (mine, the partner's, しずえ, the visitor); `holdEvents(ms)` queues event reactions behind a routine.
- **Primitives:** `if-` keyframes in `tokens.css`; durations in `MOTION_MS` (`motion/reactions.ts`) must match.
- **Marks:** villagers get floating marks (`Mark.svelte`) or official glyphs; しずえ the cream bubble (`Emote.svelte`).
  Effects (`Fx.svelte`) remove themselves.
- **Reactions** (`REACTIONS`, R1–R19): first open, the partner's day growing, high-fives, a goal met, all four met,
  taps, waking, a low week (Thu–Sat), a sync problem, the harvest. Never on first render; pages `emit(…)`
  (`motion/bus.svelte.ts`).
- **Idle life** (`motion/idleLife.svelte.ts`): on ambient life's 10-second slots (`island/ambient.ts`, the relay's
  clock), so both phones play the same: each slot one villager does one small thing or sets off on an outing, or both
  chat or dance, and the visitor takes its beat from the slot's PRNG (しずえ now and then), no emotes or fx; one slot in
  three after 3 min idle, stopped after 10 min; paused while hidden or covered. Only a villager whose person isn't on
  the island (the relay's presence) goes on outings; one its person just walked is left alone 2 min.

### Walking

`island/walkGraph.ts`, `island/nav.ts`, `island/tapWalk.ts`, `island/wander.ts` (pure), `island/avatar.ts`,
`motion/director.svelte.ts` `walkTo`, `e2e/movement.spec.ts`, `e2e/world.spec.ts`, `e2e/tapwalk.spec.ts`.

- **My villager is me, and only empty ground walks it:** a tap on something to do (a tree, a bush, a flower, the rock,
  a weed, a dig spot, a shell or a find, a fallen fruit, branch, coconut, mushroom or present, a bug, a fish shadow,
  the bubbles, the water, the tape deck, a building, a visitor, the partner) acts in place (the exceptions: the tent's
  door, the board, and a seat, walked up to and sat or lain on: [World](#world), "Sitting on a tap"): my villager turns to it
  where it stands and the action plays at the target, its tool there (NH's floating can, shovel and net; a cast's line
  from the bank). A catch or a find is its plate in the bottom stack; my villager stays where it stood. A flea is tapped off my
  villager itself.
- **Tap-to-walk** (a tap on grass or sand that nothing else took; `tapWalk.ts planTap` over `nav.ts`): my villager runs
  there (300 u/s), over the bridge and up the stairs. A tap on ground it can't stand on snaps to the nearest walkable
  point within 40u; ground nobody can reach to the nearest reachable point, facing it. Water never walks (it ripples), and a building's footprint knocks at its door in place.
  The partner's relayed walks replay the same planner (their softer ring where they tapped). A cream ring marks the
  spot and shrinks away (NH has none: the least feedback). It rests there, and so does it on the partner's phone: the
  relay keeps each person's last walk, so a phone opening later puts their villager where they sent it ([Shared
  world](#shared-world)).
- **Where my villager is, kept** (`avatar.ts` startAt, `e2e/positions.spec.ts`): the island opens with it where it
  last stood (the end of its latest move, kept per person in localStorage, `island-stay.<who>`, with where it rests):
  back from a room or another screen, a reload, the app reopened, the next day, however long after. Only a player
  never placed starts at home (a spot a layout change has since covered snaps to the nearest standable ground).
- **Never a teleport on another phone:** their phone plays my walks; a big gap between where it has my villager and
  where my walk has it (a phone that had it elsewhere, a put) glides off at the run within 1.5 s while it's in view
  (villagerSync `playPartner`); only a phone opening, or the island hidden, puts it there.
- **The camera never moves for a walk** (nor for the partner or a visitor): only the finger scrolls.
- **No hold-up:** a catch or a find lifts nothing over a villager's head and plays no pose (the bottom stack's plate,
  its icon popping up from where it happened, says it: [Critters](#critters)).
- **A phone gone** (closed, hidden, offline, for a minute or a week): its villager stays where its last walk ended,
  on every phone (the user: "spot persists"). The relay keeps each person's last walk and
  carries it into each new day, so a phone opening later puts it there; the island's own life gives it its idle beats
  in place. Not the guest's: it shows only while its app is open ([The guest](#the-guest)).
- **Sheets and hiding:** a sheet stops everyone where they are; uncovered, the outings wander back; hidden over 30 s,
  they're back on return (mine where it rests). A balloon opens only over a villager standing still, and is carried with it while the camera
  scrolls or zooms ([Dialogue](#dialogue)).
- **Walk mask** (`walkGeo`): land, the bridge's deck (inside its rails) and the stairs; not the sea, the river, the pond, the spring,
  the cliff face, building footprints, trunks, the rock, bushes or props. Rasterised once on a 4u grid; named
  nodes (homes, the trees, the shore, both ends of the bridge and of the stairs, every door, the pondside, the river's
  casting spots, centre stage) and the obstacles' padded corners make a visibility graph built once (~15 ms); a
  straight segment when clear, else Dijkstra through it. Outings, goal walks and the meet-up use it.
- **Navigation for taps** (`layout/nav.ts` navOf, the layout's walk grid; `island/nav.ts walkNav` adds the island's
  named spots, the walk mask's names, so a relayed node id means the same): a tap's snap (`snapTap`), its way
  (`findPath`) and each spot's connected region, so a tap never aims at a pocket nobody can reach. The old fixed
  island's polygon navigation is gone (2026-11-05): the island reads its layout from IslandScene's first line, and
  off it (the unit tests' fixed island only) the walk is the default layout's grid.
- **Footsteps** by the ground under the walker (`tapWalk.ts stepCue` over `world.ts surfaceAt`): grass, sand, snow
  (grass and dirt in winter), the stairs' and the stone bridge's stone; a rainy day splashes.
- **Rendering:** the feet are a world node whose position is read each frame from the director (`livePos`: along the
  current segment by the clock) while anyone walks, the one rAF; depth from the feet's z every frame. Facing by
  direction (`LOOKS_RIGHT`; `NO_MIRROR` renders lean instead of flipping). The walk cycle is `if-walkbounce`, a dust
  puff every other step.
- **The villagers' own outings:** the partner's villager walks to 1–3 points of interest within 600u of home (beside a
  tree, the rock, the shore, the pondside), then home; mine does the same only after 2 min without input. One villager
  away at a time; nothing after 10 min without input.
- **Follow and chat:** when mine has been away over 8 s (and within 600u) the partner comes over; two villagers within
  64u chat.
- **The partner over the relay** (`LIVE_V` 2): my tap-to-walk sends `walk` with the world point; their villager on my
  phone runs there along the same graph from where it stands (no positions are sent). Off screen, a round face of
  their villager is pinned at the top or bottom edge; a tap scrolls to them.
- **Goals:** a newly met fruit walks that person's villager to their tree, where the reaction plays; ふたりでぜんぶ
  brings both to the middle of the lawn for a high-five.
- **Footsteps:** a quiet step by the ground under the walker (`world.ts` `surfaceAt`: `footstep-grass`, `-sand`,
  `-snow`, `-splash`), ≤ 1 per 320 ms; world cues.

## Chrome and tokens

- **Dialogue** (`ui/Bubble.svelte`): cream box, yuzu nameplate, 33 ms a glyph, tap to finish, `aria-live` mirror.
  **Banner** (`ui/Toast.svelte`, one at a time).
- **Buttons:** every tappable has an edge (2px outline + 4px lip); static cards only a soft lip. Primary leaf,
  secondary cream, selected yuzu, disabled sunk. "Can't now" = `aria-disabled` ([Taps](#taps)).
  Shared skins in `styles/theme.css`: `.btn` (`.paper`, `.small`; `.off`: sunk but still takes the tap to say why),
  `.chip` / `.chips` (a choice among a few: 36px in a 44px target, yuzu when chosen), `.edit-tray` (both もようがえ
  editors' bar and tray), `.hcard` (けんこう's and グラフ's chart cards), `.sec-label` (a section's small heading),
  `.level-acts` (a level's action row); the ‹ / ✕ are always `NavButton`.
- **Focus:** no ring after a pointer input (`ui/modality.ts`); focus is restored for keyboard and VoiceOver.
- **Type:** Zen Maru Gothic (UI, Japanese) and Fredoka (numbers); `word-break: keep-all` for Japanese.
- **Tokens** (`styles/tokens.css`): ink `#4A3A2C`, cream `#FFF9E3`, paper `#F5E4BC`, card `#FFFCF2`, edge `#937047`,
  leaf `#6ED07A`, yuzu `#FFD84D`, mint `#7BD7C1`, coral `#FF8F7A` (errors only), the chart pair `--person-a`
  `#2F86BD` / `--person-b` `#D2701F` (night `#7EC8F0` / `#FFB066`; CVD-checked); one `--z-*` stacking scale.
- **Theme:** `data-tod` comes only from the Tokyo clock (`prefers-color-scheme` ignored); night chrome `#3A4886`. The
  HUD, plate, dialogue and choices stay cream/yellow.

## Small screens

Compact = `(max-height: 700px) or (max-width: 359px)`, tiny = `(max-width: 339px)`; portrait; wider screens centre a
480px column. No horizontal scroll at 320, inputs ≥ 16px (`inputs.test.ts`), targets ≥ 44px; the keyboard from
`visualViewport` (`ui/keyboardInset.svelte.ts`: the `keyboardInset` store, the visible part above it, for any text
field; `withKeyboardInset` sets `--kb`; never `innerHeight`, which iOS shrinks with the keyboard). Safe areas only through the tokens (`--safe-*`; `--ui-top` for a top control, `--pad-foot` under a bottom action
row), never `env()` in a component. Short screens scale the island down. Check at 393×852, 375×667 and
320×568, day, dusk, night and winter.

## Official art

Official NH renders only from `static/art/` through `<OfficialArt>`, with a fallback so a missing file never breaks a
screen; WebP, never upscaled. Manifest and helpers `lib/art.ts` (the build packs the manifest's sizes per folder: `vite.config.ts` `slimArtManifest`); files from
`scripts/fetch-assets.ts`. Groups: villagers (all 417 + 23 special characters; roster `lib/villagers/roster.ts`, loaded
with the picker; `lib/villagers/look.ts`: ids, facing, defaults goldie and anchovy), host (しずえ, たぬきち), fruit,
trees, bushes, flowers, particles, reactions, money, deco, critters, finds, presents. Ours: sky, sea, ground, the jar,
effects, marks, UI sprites. Names follow the Japanese game; no Nintendo fonts.

**The 3D renders** (`scripts/models.ts`, `scripts/models-page.js`, `npm run models`): what NH has a model of is drawn
from it rather than from a Nookipedia icon: the campsite (its tent and deck; the door's foot on world.ts's door
line), the trees (the oak in its four looks: spring is NH's cherry-blossom model, summer and fall are the same model
tinted by its gradient's rows for the time of year, winter NH's snowy model; the cedar, palm and bamboo with their
snowy models), the hedge's eleven bushes in bloom (the colour a row of the flowers' gradient; winter NH's snowy bush),
the streetlamp and the garden lanterns (with `-lit`: the glass alone, lit, for dusk and night) and the garden and flat
rocks. Each is rendered by
three.js in the installed Chrome from the world's view (orthographic, 30° down), lit NH-style (a soft sky, a warm key
from the upper left with soft shadows, a cool fill), its materials rebuilt from the model's textures (albedo or gray
albedo × gradient, two-channel normals, the _Mix map's roughness and occlusion, per-material emissive weights), at
about 3 px per world unit of the height it's drawn at. Every look of one thing shares one crop, so they lay over one
another. Outputs keep the scene's art keys (`trees/oak-summer`, `bushes/holly`, `deco/campsite`…) plus their looks:
`-winter` (the scene picks it in winter when it exists), `-lit`, and the oak's `-trunk` / `-canopy` layers (its two
nodes, a villager between them). `island/models.json` holds where each stands (its feet or door point as fractions of
the image, `Scenery`'s anchor) and its size in model units. NH has no model of the plumeria or the campsite sign: those stay catalog icons. The stone
bridge is rendered twice: its deck from straight above (`bridges/stone-deck`, the terrain bake's texture, never shown
or precached by the app) and its near end seen level (`bridges/stone-front`, an upright piece). The decorations
([Decorating](#decorating), `decor/<item>-<f>`) are rendered in their four facings (a quarter turn each about the up
axis) at one scale (`ppu`, px per model unit) rather than one height, so every facing stands the same size.

## Sound

`lib/sound/`. Off by default, kept per phone. Nothing sounds without a visible reason (idle life is silent). The music
is the user's own files; every effect is an original placeholder (`synth.ts`), replaceable by a file.

### Hourly music

One track per **Tokyo hour** (`hourly.ts`) in sunny / rain / snow arrangements (`sound.weather`; a missing variant falls
back to sunny). A 3 s crossfade on the hour; the next file is fetched a minute early. Each file is a loop period plus a
3 s copy of its start; two `<audio>` decks hand over inside the copy, so the loop has no gap. Turning ミュージック on
plays the opening theme first. Under a sheet, the panel or the harvest the music is low-passed at 900 Hz.

### Event music

On NH's event days its track replaces the hour's (`events.ts eventMusicAt`, one table over the shared dates of
`time/holidays.ts`, which the island's events, fireworks and wedding read too), with the hour's crossfade at the
boundaries. The boundaries inside an hour (the countdown's) get one timer each (`msToNextEdge`), never a poll. A
track without its file is the hour's music (or its `alt`):

| When (Tokyo) | Track |
| --- | --- |
| Festivale: the Monday before Ash Wednesday (Easter − 48) 05:00–24:00 | カーニバル (Festivale) |
| Bunny Day: Easter Sunday 05:00–24:00 (not the celebrations before it) | イースター (Bunny Day) |
| Aug Sundays 19:00–24:00 | 花火大会 (Fireworks Show) |
| Our wedding day (2027-10-08) 06:00–19:00, 19:00–24:00 | ウエディング, then ウエディングパーティー (each the other's `alt`) |
| Oct 31 17:00–24:00 | ハロウィン (Halloween) |
| 4th Thursday of Nov 09:00–24:00 | サンクスギビングデー (Turkey Day) |
| Dec 24 05:00–24:00 | クリスマス (Toy Day); in snow クリスマス（雪） (NH's snowy northern arrangement) |
| Dec 31 23:00 / 23:30 / 23:50 / 23:55 | カウントダウン (Countdown), four tracks, each to the next |
| Jan 1 00:00 | ニューイヤー（Happy New Year）, once, within 2 minutes of midnight |
| Jan 1 00:00–02:00 | ニューイヤー（午前0時）, the fireworks |
| Jan 1 02:00–05:00 | ニューイヤー（午前2時） |
| Jan 1 05:00 – Jan 2 05:00 | 元日 (New Year's Day) |

**Cut-ins** (`sound.svelte.ts`) swap at once over the island's music and hand back to it: the wasps (`waspMusic`):
the nest's fall only fetches Chased by Bees ahead; it cuts in and loops as the wasps come out (`chase`; 6 s at most if
the scene never ends it); a net brings the island's music back; a sting plays Stung by Bees once (kept fetched during
the chase). K.K.'s songs are cut-ins too, and the island's own (`eventJingle(id | ids, loopMs?)`, `events.ts
CutInId`, only with ミュージック on and the file there, else the moment's effect plays): the tape deck's stretch plays
ラジオ体操 (aerobics) for its ~6 s, then the music crossfades back (else the tape's `stretch-song`; a stretch cut short or
the deck leaving stops it: `stopJingle`); the birthday cake plays ハッピーバースデー (else the music box); Franklin, fed
his fish on Turkey Day, cooks: the cooking jingle, then the dish's (fetched under the first). A cut-in ends at its end,
when its file can't play (`onfailed`: offline, undecodable, never silence for good), at 音量 0, or when ミュージック goes
off; one asked for during the opening theme ends the opening. Under a cut-in the track it interrupted (indoors the
room's and the island's) stays fetched (`choose.ts pinsFor`). The settings' note and the Now Playing tile (and the
Media Session, `mediaSession.ts`) name the event track or song, NH's titles in ja/en (`sound.title.<id>`). The midnight
Happy New Year! is remembered by its Tokyo date on the phone (`island.newYearIntro`): a reload doesn't replay it.

### Place music

As in NH, a building's room plays its own track in place of the island's (`places.ts`, `sound.svelte.ts setPlace`),
with a short fade under the door's black going in and coming back out (`hourly.ts` DOOR: 0.65 s), the hour's 3 s
crossfade between a building's rooms. What sounds, first there wins (`choose.ts pickMusic`): the opening
theme, a cut-in (K.K., the wasps), the room's track, the island's (the event's on its day, else the hour's). So indoors
on an event day the room's music plays, as in NH; a cut-in still plays over a room.

| Where | Track (`places.<id>`) |
| --- | --- |
| The museum's hall / bug wing / aquarium | `museum-hall` 博物館（エントランス） / `museum-bugs` / `museum-fish` |
| The shop | `shop` タヌキ商店 |
| The tent and the homes | none: NH's houses play the hour's music |

The museum's room is my villager's, read on the frames drawn (none while nothing moves): it changes once the villager is
6 units through an opening (`plan.ts wingHeld`) and has stayed 0.6 s (`Settle`), so a doorway never flaps. `PlaceId` is
only the rooms the app has (the museum's three, the shop); NH's others (its shop's variants, the fossil and art wings,
the Able Sisters, Resident Services, Redd, dreaming) have no room here. A room without a file keeps the island's music.
Tapping the museum's or the shop's door fetches its track while the villager walks up (`prefetchPlace`), and the
museum fetches its two wings' 4 s after the hall opens; indoors the island's file stays in memory (pinned) so leaving
starts it at once, and the room's is released on the way out. Nothing is fetched while ミュージック is off. The settings' note and the Now Playing
tile name the room's track (`sound.title.<id>`, NH's names).

### K.K. Slider

`kk.ts loadKK()`: K.K.'s songs from `static/audio/kk.json` (its `kk` list, `{ id, ja, en, file, gain, v }`, NH's
official titles; one-shots under `audio/kk/`; their airchecks, NH's stereo versions, at `kkAircheck.<id>`), a chunk of
its own loaded the first time K.K. or a stereo's list shows, or a song is asked for (13 KB the first load doesn't
carry). `playKK(id, source)` plays one over the island's (or a room's) music: `live` K.K. on his stool, `aircheck` a
room's stereo ([the tent's stereos](#the-tent): its aircheck, else the live file, `kkTrack`); `stopKK(source?)` ends
it (only a song from that source); `sound.kk` is `{ id, from }` while one plays; `kkPick` never repeats the last one;
`kkTitle` is the title in the app's language. The two songs K.K.'s リクエスト offers are fetched as he offers them
(`prefetchKK`), a stereo's on the press of its row. One cut-in path for both: the room's or the island's music stops
for it and comes back after.

### Ambience

`ambientFor(hour, month, weather, { heavy })` on the music bus, crossfaded (0.5 s): waves always; birds 05–17 on fine
days (the season's: the bush warbler in spring, the bulbul in autumn); cicadas 08–17 Jul–Aug; higurashi 04–08 and 16–19
Jul–Aug; crickets 17–05 Sep–Nov; nothing alive in rain or snow; wind Dec–Feb; rain.

The beds are **procedural** (`ambientSynth.ts`, its own chunk): original loops rendered once into buffers when the main
thread is idle, deterministic, 12–40 s each, starting at a random point. Hidden: stopped, nothing renders. A file at
`ambient.<id>` in the manifest replaces a bed.

### UI sounds

Soft mallets and bells for the panel, cursor, confirm and cancel. Dialogue is silent.

### Cues

`cues.ts CUES` maps moments to sounds, levels and delays; nothing calls `play()` directly. Reactions name a cue per
step, taps in `data-sfx`, outcomes call `cue()` (tree tap → rustle, fruit lands → thud, each coin → a climbing
pentatonic run, 受け取る and a present → NH's get fanfare, both of us meeting all four goals (the celebration's
fireworks) → the complete fanfare, buy → purchase, scenery → `scene-<kind>`). The first open of the day (しずえ's
`announce`, its own path: `sound.svelte.ts announce`, waiting up to 15 s for the first tap) plays the **radio jingle**
that opens NH's island broadcast (`radio.ts radioJingleAt`): morning 05–11,
noon 11–17, evening 17–05, one of six picked by the Tokyo date's seed (both phones hear the same), or the holiday's own
all its date (Bunny Day, Halloween, Turkey Day, Toy Day, the countdown on Dec 31, the carnival on Festivale). A sound
without its file borrows a `like`'s (`ids.ts`): a radio jingle the PA chime's; the fanfares the fanfare's. **World
cues** (the island's own sounds) are skipped while a sheet, the panel or the harvest covers the scene; UI cues always
play.

### Taps

Every tappable names its sound in `data-sfx`; one capture listener (`taps.ts`) plays it on the click. `self`: the
handler plays the outcome's cue; `none`: silent. A control with `aria-disabled="true"` has its click swallowed and
plays `boop`. Enforced by `taps.test.ts`, walked by `e2e/sound.spec.ts`.

### Mix

Buses: music 0.30, ambience 0.28, effects 0.90, voice 1.0 (ききみみ's clips: 音量 alone, not the toggles; they duck the
music as a jingle does); master 音量 squared (default 0.8). ≤ 6 voices and a cap per sound
(`ids.ts`); jingles (the fanfares, miles, the radio jingles) never overlap and duck the music to 25%. Effects decode
on the unlock (only while 効果音 is on), except the `lazy` ones (the 24 radio jingles, the complete fanfare): fetched
at their first play (it waits up to 2.5 s for the file, then plays the placeholder: never nothing) and kept decoded
two at most (1.5–2.8 MB of PCM each at 48 kHz). Effects jitter pitch.

### Engine lifecycle

`sound.svelte.ts` drives `engine.ts`; the rules are pure in `session.ts`; `engine.test.ts` uses a fake context.

- **Unlock:** no context until a setting is on. `pointerup`, `touchend`, `click` or `keydown` creates and resumes it
  and unlocks both decks; `pointerdown` only wakes it. With ミュージック on, the hour's file is fetched 1 s after launch,
  so the first tap starts it inside the gesture.
- **Nothing queues:** a cue on a context that isn't running is dropped; a tap's own sound may run within 250 ms of its
  resume.
- **Idle suspend:** with only effects on the context sleeps 10 s after the last sound.
- **Background:** hidden → decks paused, ambience stopped, context suspended, the hour clock stopped; back in front the
  hour fades in over 0.8 s.
- **Music off:** the fade-out, then every music file in memory and its object URL let go, the decks' media too
  (`Engine.release`); the next on fetches again (from the service worker's cache).
- **iOS session:** `ambient`: it mixes with other apps' audio and follows the Ring/Silent switch. The Media
  Session tile names the tune (`mediaSession.ts`).
- **Voice session (ききみみ, [kikimimi.md](kikimimi.md#audio)):** `voiceSession(true)` inside a game's tap creates or
  wakes the context even with sound set silent (no decks, no effects loaded), holds it awake (no idle suspend, no
  sleep on everything off; the background still suspends it and stops its clips), and sets the session to `playback`
  (plays with the switch on); `false` stops the clips, drops the decoded ones (an LRU of 4), restores the type and
  hands back to the settings. `voice.state` not running while on → the game's 「タップして つづける」 card; any real tap
  resumes it. `playVoice(buf, {relayAt, now})` schedules at `currentTime + (relayAt − now())/1000`; a past time plays
  whole from now.

### Audio files

`static/audio/manifest.json` (bundled by `manifest.ts`): `sfx.<id>` = `{file, v}`, `music.<weather>.<00–23>` = `{file,
start, end?, gain?, v}`, `opening`, `ambient.<id>`, `events.<id>`, `places.<id>` (the same shape); K.K.'s `kk[]` and
`kkAircheck.<id>` in `static/audio/kk.json` (`kk.ts`, loaded when first needed). `v` is the file's content hash
(written by the build, `npm run audio:music -- --hashes` alone after a file is replaced by hand; `sound.test.ts`
checks every one): the app fetches `file?v=`, so `/audio/*` is immutable to the browser and the service worker
([backend.md](backend.md#service-worker)). Add a file and its entry, no code change; a missing effect keeps its placeholder, missing ambience its procedural bed, missing
music is silence. `npm run audio:music -- <dir> [--only <key regex>]` (`scripts/music.ts`, ffmpeg) builds every entry
from the user's MP3s by its track number (`CATALOGUE`): loops (finds the period, cuts it where both passes are the same
samples, appends the copy), one-shots (silence trimmed), AAC 64 kbps, `gain` to −16 LUFS. Rips too short to find the
period in loop with a known one: the rain and snow hours (one pass and a few seconds of the next) their sunny hour's,
the museum's hall its 23.2 s. Where the rip's second pass is a variation, not the same samples, the wrap is a 2 s
blend: rain and snow at 4 PM, the museum's fish and insect rooms (a texture, looped at three of the hall's phrases),
Bunny Day at 0.98. Reese & Cyrus's wedding loop is 128 s, at 56 kbps to stay under 1 MB; the GameCube's ラジオ体操
(`aerobics`) doesn't loop in its rip and loops whole. Jingles (`sfx/`: the fanfares, the radio jingles) are mono,
trimmed, faded, their loudness in the file (an effect has no `gain`; a mono file is measured as heard, from both
speakers); the fanfares end where their OST track's bed begins (1.7–1.8 s). K.K.: the nine NH live songs kept; the other 64 live songs from the GameCube and e+ rip (150–207,
517–531; e+'s Señor K.K. is NH's K.K. Mariachi; the "Not My Bag" tracks are one song each: My Place … Wandering) and 70
airchecks (208–262, 532–546; e+'s Marine Song 2001 cut to its first 214 s pass; Stale Cupcakes, Spring Blossoms and
Wandering have none in the rip), with NH's titles from the game's text. The rip is all but mono (side −26 dB under mid
live), so they are mono AAC at 40 kbps (measured as close to the source as stereo at 48). Not built (no moment or room in
the app): Kimedance, the island broadcast's own jingle (the radio jingles open it), the museum's fossil and art rooms,
the shop's big and closing, the Able Sisters, Resident Services, the tent, Redd, dreaming. `sound.test.ts`: every path in the manifest exists and every file is named; each folder under its budget
(one file / all): `music/` 1 / 64 MB, `places/` 1 / 6 MB, `sfx/` 0.25 / 4 MB, `kk/` 1.2 / 60 MB, `kk/aircheck/` 1.2 /
36 MB. Audio is never precached; the worker's audio cache keeps its few per class (music 3, K.K. 2, ききみみ 24, the
rest 8)
([backend.md](backend.md#service-worker)).

### Sound settings

The panel's サウンド: **ミュージック** (music, ambience), **効果音** (effects, jingles), **音量** 0–10; both off at first;
turning one on previews it. In localStorage (`island.sound`), never synced.
