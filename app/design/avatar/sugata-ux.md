# すがた: one dresser with a shared stage (UX review and spec, 2026-11-05)

UX designer, after a round with the game designer, the UI engineer and the a11y/QA reviewer. The user asked: "make the
menu for customizing user and choosing villager more intuitive. maybe tabbed with shared preview of final form."

Mockups (static HTML in `/tmp/ux-sugata/mock.html`, 393×852 @3x, WebKit; the real tokens, fonts, item icons, villager
art and 3D renders of A's player):
- **Today:** `/tmp/ux-sugata/shots/cur-00-settings.png` … `cur-11-back-after-villager.png`
- **A (recommended):** `mock-A1-default.png`, `A2-wear-tops`, `A3-villager`, `A4-save`, `A5-coord-selected`, `A6-face`,
  `A7-acc`, `A8-wear-while-villager`, `A9-search-keyboard`, `A10-left-banner`
- **B:** `mock-B1-human.png`, `mock-B2-villager.png`
- **C:** `mock-C1-overview.png`, `mock-C2-slot-sheet.png`

## 1. What's wrong today (ranked)

1. **The villager switch is hard to find, and it's a separate world.** 「むらびとの すがたに する」 sits under the
   last grid row, below the fold on most categories (cur-05). It pushes a second level with its own head (a 76 px
   bust, its own よびな field, cur-09) instead of the すがた preview. Coming back (cur-11), the preview shows the
   villager, but the closet below still shows the human's garments as worn, ★いつもの is unselected and ＋ほぞん is
   greyed out. Nothing says which form you're in. Tapping a top silently turns you back into a human.
2. **Two commit models on one screen.** A garment change is sent when you leave. A villager pick is sent the moment
   you tap it (`VillagerPicker` → `setVillager`), but the villager *look* is only sent when you leave すがた. Nothing on
   screen says when anything is kept. There's no けってい, and ‹ and ✕ both quietly save. もどす appears and
   disappears, and only undoes the look, not the villager pref.
3. **The preview is far too small to judge an outfit.** It's 96×132 px, about 4 % of the screen (customization.md
   asked for ~40 %). A sock or a hair ornament can't be seen. The 3D figure, the selling point, reads as an icon.
4. **The page is one long scroll with four rows of look-alike pills.** コーデ portraits, 8 category chips, 10 colour
   chips, then the grid. The category row and the colour row have the same shape, size and yellow selection
   (cur-01), so the hierarchy is flat. Eight categories overflow the 393 px row (ワンピ… is cut off), and くつした,
   くつ and こもの are off screen with no cue.
5. **The colour row jumps.** The variant dots open *inside* the grid, under the tapped row. Everything below moves
   down 60 px (cur-02), and the target you were reaching for moves too. The dots are far from the figure, so a
   colour change is easy to miss.
6. **Saved looks hide their actions.** ⋯ only appears on the last-tapped chip, as a 32 px badge. うわがき is in a
   sheet. Nothing shows that the look on screen differs from the selected コーデ, so you can't tell saved from edited.
7. **かお is a 26-tile wall of numbers, then five more sections in one scroll** (cur-03, cur-04): め, めのいろ, くち,
   はだ, ほお, はな, all stacked.
8. **Thumb reach.** The primary controls (コーデ, categories) sit in the top half. The ways out (‹, ✕) and the
   villager switch are at the far ends. On an iPhone 15/16 held one-handed, the top third is the hardest reach.
9. **よびな takes the space beside the preview.** It's a setting for the person, not the look, and its keyboard
   pushes the page.

**What NH does** (and what we keep or drop):
- **Wardrobe:** one large figure, item-type icon tabs along the top (L/R to cycle), a grid, an item's colour
  variants in one row. Changes apply as you dress, and closing keeps them, with no confirm.
- **Mirror (face edit):** icon tabs, the face large, a choice applies at once.
- **Able Sisters fitting room:** asks on exit, but only because you're buying. Our closet is free, so we don't ask.

## 2. Alternatives

| | Idea | For | Against |
|---|---|---|---|
| **A** | **One dresser:** a large shared stage on top, six icon tabs (コーデ · かお · かみ · ふく · こもの · むらびと), a second-level segmented row, the grid; the villager grid is a tab whose pick swaps the stage | WYSIWYG for both forms; NH's wardrobe layout; one level, no push; every control in one place | the villager is a form, not a category (handled: §3.5); the stage takes room (collapses: §3.2) |
| B | **Mode switch:** 「にんげん｜むらびと」 segmented over the shared stage; にんげん is today's page tidied (strip + 4 chips + sub-row) | makes the two forms explicit; least change | still one long scroll with stacked pill rows; the switch makes the villager a separate mode with its own page; the page under it is still crowded |
| C | **What's worn, slot by slot:** stage + a list (かお·かみ / トップス / ボトムス / くつ / こもの), each row opens a half-sheet grid with the stage visible above | shows the whole outfit at a glance | needs item names (the closet has none: names were ruled out); a tap more per change; form-like, not NH |

All three share the same stage, status and commit model (§3.3). The team picked **A** (the game designer and the UI
engineer agreed; QA's fixes are folded in).

## 3. The recommendation: A, specified

### 3.1 Layout (one pushed level, title すがた, ‹ ✕)

```
┌ titlebar ‹  すがた  ✕ ┐
│ STAGE (262 px; 150 compact; 76 search)  │  status pill (top-left), もどす under it when changed,
│   3D player / villager render, drag to turn │  nameplate 「ウェイ ✎」 (top-right, yuzu .plate)
│   [variant dots of the last-tapped item]  │  bottom edge, 44 px targets
├ TABS  コーデ かお かみ ふく こもの むらびと ┤  icon + 13 px label, cream tray, selected = yuzu + edge
│ PANEL (scrolls)                            │  sub-row (segmented, 44 px) · colour filter · grid
└────────────────────────────────────────────┘
```

No foot bar (see 3.3). The panel scrolls to the screen's bottom edge (`--body-pad`).

### 3.2 The stage (`LookStage.svelte`, new; wraps `LookPreview`)

- **The final form, always.** A player look is the 3D player, filling the stage (preview3d resized, DPR cap 2). A
  villager look is its official full render (`Villager`, `head={false}`). Drag turns and tap hops (as today); a
  small 「↔ まわせるよ」 hint shows bottom-right until the first drag of the session.
- **Status pill** (`role="status"`, polite; announces on a change of state, not on every tap):
  - 「★ いつもの」 / 「ふゆ」: what's worn is exactly that look (saved).
  - 「いつもの · アレンジちゅう」 / 「ふゆ · アレンジちゅう」: started from it, changed this visit.
  - 「コーデなし」: a player look matching nothing saved.
  - 「むらびと · きぬよ」: a villager look.

  Always words, never only the star or a coloured dot.
- **もどす** (a small cream button under the pill, 40 px + its hit area to 44): shown once anything changed this
  visit. It restores the look *and* the villager pref as they were when the level opened. `data-look-revert` kept.
- **Nameplate** 「ウェイ ✎」 (top-right): a tap opens the small name sheet (the コーデ name card's form: field, やめる /
  けってい). `aria-label="なまえを かえる"`. よびな leaves the head.
- **Variant dots** along the stage's bottom edge: the colours of the item last tapped (or, in かお/かみ, the colour
  attribute of the sub-tab: めのいろ, かみのいろ, はだ). One row, 44×44 targets (a 28 px dot), `radiogroup` named
  「トップスの いろ」 etc., each radio named by its hue (「あか」…, from the swatch's hue bucket, numbered if two
  share one). The figure lifts by 60 px while they show. They never move the grid (fixes issue 5). Hidden for a
  single-colour item and on the コーデ / むらびと tabs.
- **Compact:** when the panel scrolls past 8 px, the stage eases to 150 px (the figure scales; the pill stays; the
  dots stay). Back at the top, it eases back. While the search field has focus, it's a 76 px strip (A9: a head,
  name, kind), so the grid shows above the keyboard. Animate `height` with `--dur-base` and `--ease-soft`; no
  scroll snapping, no scroll-driven camera (the user's no-auto-scroll rule).

### 3.3 One commit model: dress as you go, kept when you leave (no けってい)

- What you tap is worn on the stage (the draft). **Leaving keeps it** (‹, ✕, Esc, the backdrop, the app hidden),
  sent once as today: `look` (and `villager` when a villager was picked). This is NH's wardrobe, and today's
  contract.
- **No けってい button.** With autosave, an extra けってい suggests that ✕ throws the changes away (QA and the game
  designer both flagged this).
- **Undo is visible twice:** もどす on the stage while you're in, and on leaving with a change, the せってい banner
  「すがたを かえたよ」 with **とりけす** (5 s; the `undoBanner` pattern: it re-sends the opening look and villager)
  (A10).
- The villager pick joins the draft: no immediate `setVillager`. The member sends `wearVillager(id)` on leave (both
  prefs, in order; `begun` updates only when both are ok). The guest sends `setVillager(id)` then `wearUsual()`,
  because its いつもの is its villager.
- コーデ edits (save, うわがき, rename, delete) still go out as they're made (`savedLooks`), as today.

### 3.4 The tabs (`role="tablist"`, each `role="tab"` + `aria-selected`, `aria-controls` → `role="tabpanel"`)

`roving` across the six; ←/→ move and select. Selected: yuzu fill, the 2 px edge outline and lip (not colour alone).
Opening the level: **コーデ** if any コーデ is saved, else **ふく**. The guest: the same six.

| Tab | Sub-row (segmented `radiogroup`, 44 px, `data-look-sub`) | Panel |
|---|---|---|
| **コーデ** | none | ★いつもの, saved looks newest first, ＋ほぞん: a 4-column grid of 68 px portraits, names under them. The worn one has the leaf ring. If edited since, a small coral dot, plus the status pill's words. Selecting a saved look shows an **inline action card** under the grid: 「「ふゆ」と ちょっと ちがうよ」 + **いまので うわがき** (leaf, only when edited) · **なまえ** · **けす** (A5). Unedited: 「ふゆ」 · なまえ · けす. けす keeps its confirm sheet and とりけす. ＋ほぞん: the name card as today (A4). At 20 it's sunk and still says 「いっぱいだよ」. A villager look: ＋ほぞん sunk, with the reason 「むらびとの すがたは ほぞん できないよ」 on tap. |
| **かお** | め · くち · はな · ほお · はだ | め/くち: numbered tiles (VoiceOver 「め 3」); めのいろ on the stage's dots while め is selected. はな/ほお: three big chips. はだ: the skin dots in the panel (no grid). |
| **かみ** | none | the hairstyle grid; かみのいろ on the stage's dots |
| **ふく** | トップス · ボトムス · ワンピース · くつした · くつ | colour filter, then the grid. なし first for くつした, くつ. ワンピース clears ボトムス and the other way round, as today. |
| **こもの** | ぼうし · めがね · かみかざり | なし first; ぼうし when the hat work lands (hide the segment until then) |
| **むらびと** | none | the search field, then とくべつ and むらびと groups (today's picker grid). A tap wears that villager on the stage. The worn one has the ring and ✓. |

- **Colour filter** (ふく only): a sideways scroller of 44 px chips, すべて then the nine hue dots (each with a
  1.5 px ink ring so しろ and きいろ show on cream; named 「あか」…; `radiogroup` 「いろで しぼる」). The end fades
  out when there's more. Kept per sub-tab for the visit. An empty result shows 「この いろは ないよ」.
- **Grid tiles** drop the in-grid colour dots. A tile is 「トップス 3、いろ 4しゅるい」 to VoiceOver. A tap wears it and
  shows its colours on the stage. Tapping the worn tile again does nothing (no toggle-off except なし).

### 3.5 The villager as a tab (the form question)

- A villager worn + a human tab open (かお … こもの): a yuzu strip on top of the panel, 「いまは きぬよの すがた。
  ふくを えらぶと にんげんに もどるよ」 (A8). The grid still shows the human's last look as worn.
- The first human pick switches back to the player look and keeps every human edit made this visit. The stage and
  the pill change.
- The むらびと tab carries no badge (colour-only cues are out). The pill says the form.
- The villager isn't repeated in コーデ (one home: the tab). Switching back to it is one tap on the tab's ringed head.
- **The guest:** its ★いつもの *is* its villager. The コーデ tab's ★いつもの tile shows the villager head, and
  picking it is the same as picking its villager in むらびと. Its saved コーデ are human looks.

### 3.6 Keyboard and VoiceOver details

- Search field: 16 px, `enterkeyhint="search"`. Enter blurs it. The stage compacts on `:focus-within` (3.2).
- Rotation has an alternative for VoiceOver: the stage is `role="img"` named by the status
  (「ウェイ、いつもの」). The turn stays pointer-only, since it's decoration and the front view is the canonical one.
- Focus after a tab change stays on the tab, not the panel. After ＋ほぞん, it goes to the new コーデ tile.

## 4. Implementation plan (UI engineer)

PRs, each green on its own:
1. **Stage.** `preview3d.ts`: drop the fixed 96×132 (`LookPreview.svelte` canvas attrs), add a ResizeObserver →
   `renderer.setSize`, `camera.aspect`, re-fit, never re-create (the portrait painter borrows this renderer). Keep
   DPR ≤ 2 and 30 fps on demand. New `look/LookStage.svelte`: preview + pill + もどす + nameplate + variant-dots slot +
   compact states.
2. **VillagerGrid.** Extract the search, the lazy heads and `roving` from `panel/VillagerPicker.svelte` into
   `look/VillagerGrid.svelte` (props `current`, `onpick`, `root`: the IntersectionObserver root is the panel that
   scrolls). Mount it the first time its tab opens, then keep it `hidden`. VillagerPicker uses it meanwhile, so the e2e
   stays green.
3. **Draft villager.** `LookPage` holds `{ kind: 'villager', villager: id }` in the draft. `commit()` sends
   `wearVillager(id)` (a member) or `setVillager(id)` + `wearUsual()` (the guest). もどす restores both. Leaving with a
   change shows the せってい banner with とりけす (`undoBanner`, re-sending the opening look and villager). The name
   sheet replaces the よびな field.
4. **Tabs.** `LookPage` becomes stage + tablist + panels (`look/tabs/*.svelte` if it grows past ~400 lines). The
   segmented sub-rows, the filter scroller, variant dots moved to the stage (`ClosetGrid` emits the tapped item; it no
   longer renders the dot row), the inline コーデ action card (the ⋯ and its menu sheet go; the confirm and name sheets
   stay). Remove the `villager` push from `SettingsSheet` and the foot button.
5. **e2e and docs.** design.md すがた, customization.md §3, decisions (the commit model).

**Selectors.**
- **Keep:** `data-push=look`, `data-look-row`, `data-look-worn`, `data-look-page`, `data-look-chip`,
  `data-look-revert`, `data-look-save`, `data-look-name`, `data-look-ok`, `data-look-confirm`,
  `data-look-preview=player|villager`, `data-cat=*` (now on the sub-row and tabs), `data-closet`, `data-item`,
  `data-part`, `data-colours` (now on the stage's dots).
- **Add:** `data-look-tab=coord|face|hair|wear|acc|villager`, `data-look-sub=<cat>`, `data-look-status`,
  `data-look-name-edit`.
- **Move:** `data-look-overwrite`, `data-look-rename`, `data-look-delete` go onto the inline card's buttons.
- **Gone:** `data-push=villager` (look, picker, players, guest, demo and sound specs), `data-look-more`,
  `data-look-card=menu`.

**e2e to update or add.**
- `look.spec`: tabs and sub-rows reach every category; a colour dot on the stage changes `data-part` and the grid
  doesn't move (compare a tile's box before and after); the status pill goes いつもの → アレンジちゅう → after
  ＋ほぞん the new name; inline うわがき only when edited; leave → one `look` pref; reopen keeps it; とりけす on the
  banner re-sends the opening look.
- `picker.spec` → the むらびと tab: search, pick → the stage shows `data-look-preview=villager`, **nothing sent until
  leaving**, then `villager` + `look` in that order; もどす before leaving sends nothing.
- Round trip: villager → ふく shows the strip → a top → player again with the earlier human edits intact.
- `guest.spec`: the guest's ★いつもの is its villager; picking a villager sends `villager` then `look: null`; its コーデ
  are its own.
- `players.spec`, `demo.spec`, `sound.spec`: replace the `data-push=villager` steps with `data-look-tab=villager`.
- WebKit: the stage compacts with the search focused, and the grid's first row is above the keyboard (393×852,
  `--kb`).
- An a11y pass (the repo's checks): every radio named, tabs wired to panels, targets ≥ 44.
- iOS Simulator: すがた idle and turning at the 262 px stage. Expect p95 ≤ 17 ms as today, no long frames when
  switching tabs; the villager tab's first open builds a slice per frame.

## 5. Not doing (and why)

- A swipe on the grid to change tab (NH's L/R): it fights the vertical scroll and the no-snap rule. The tabs are one
  tap.
- A confirm on exit: the closet is free; the banner's とりけす covers the regret case.
- Saving villager looks as コーデ: the contract's SavedLook is a player look, and one villager pref is enough.
