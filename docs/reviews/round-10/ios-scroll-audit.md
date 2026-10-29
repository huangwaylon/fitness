# Round 10: iOS Safari scroll and viewport audit

Scope: every overflow, fixed/sticky, vh/dvh, safe-area, overscroll, touch-action and keyboard path in `app/src`, plus measurements
of the built app (`?demo`) in Chrome (Playwright, `channel: 'chrome'`, isMobile/hasTouch, DPR 3, ja-JP) at 375x667, 390x844,
430x932 and 390x664 (Safari with toolbars). WebKit was not available, so the iOS-only behaviour (keyboard, toolbar resize,
scroll chaining from the backdrop, zoom on focus) is either simulated (a fake `visualViewport` that shrinks by 336px while the
layout viewport stays put, the way iOS behaves) or reasoned from the code. Each finding says which.

## Measurements (summary)

| Screen | 375x667 | 390x844 | 430x932 | 390x664 |
|---|---|---|---|---|
| Island (doc scrollHeight/innerHeight) | 667/667 | 844/844 | 932/932 | 664/664 |
| 旅の壺 /jar (doc) | **699/667** | 844/844 | 932/932 | **699/664** |
| Check-in / partner sheet (dialog sh/ch) | 423/423, 415/415 | 461/461, 431/431 | same | 423/423, 415/415 |
| Ladder / purse sheet | 625/625, 439/439 | 621/621, 417/417 | same | 625/625, 439/439 |
| しまフォン home / help / lang / sync | 647/647 | 824/824 | 912/912 | 644/644 |
| きろく からだ / お金 / week / day | 1446, 1066, 865, 881 (/647) | 1446, 1066, 865, 841 (/824) | -, -, 912, 912 | 1446, 1066, 865, 839 (/644) |
| きろく ワークアウトを追加 (dialog scrollWidth/clientWidth) | **413/359** | **413/374** | ok | **413/374** |
| NumberPad (phone dialog) | 647/647, last key bottom 629 | 824/824 | 912/912 | 644/644 |
| 村人 app: dialog / inner grid | **670/647 + 1228/307** | 824/824 + 1228/388 | 912/912 + 1228/400 | **669/644 + 1228/305** |
| Harvest overlay (after the tally) | 667/667 | 844/844 | 932/932 | 664/664 |

Every button/link/input in every surface was scrolled into view (`scrollIntoView({block:'nearest'})`) and hit-tested with
`elementFromPoint`: **none was unreachable or covered** at any size. Nothing is clipped by a fixed height; the grid layouts all
size from content (no flex/grid child that needs `min-height: 0`). Safe areas are applied everywhere they are needed (sheet
`.inner`/`.foot`, phone `margin-bottom`, jar, pair, harvest, island chrome, toasts).

So the reported "scrolling issues" are not clipping. They are the five iOS behaviours below.

## Findings (by severity)

### H1. The 村人 search field is 15px: iOS zooms the page on focus and leaves it zoomed
- `app/src/lib/components/phone/VillagerApp.svelte:88` `.search input { … font: 700 var(--fs-body) var(--font-ui) }`; `--fs-body`
  is `.9375rem` = 15px (`tokens.css:32`). The scoped rule beats the global 16px guard (`theme.css:27`).
- Measured: `getComputedStyle(input[type=search]).fontSize` = **15px** at every viewport (the name field and the pair key are 16px+).
- iOS: focusing an input under 16px zooms the page in. The viewport meta (`app.html:5`) does not block it (correctly: no
  `maximum-scale`), so after blur the user is left zoomed and every swipe pans the zoomed page sideways instead of scrolling the
  sheet. This is the classic "scroll is broken until I pinch out" report, on the phone sheet that is opened from both screens.
- Fix: `.search input { … font: 700 max(16px, var(--fs-body)) var(--font-ui); }` (visually +1px). The global guard (`theme.css:27`) loses to any
  scoped `font:` shorthand, so add a unit test next to `usage.test.ts` that greps component styles for `input`/`textarea` rules
  setting a `font`/`font-size` below 16px.

### H2. No background scroll lock: 旅の壺 scrolls behind its sheets
- `app/src/lib/components/ui/Sheet.svelte:45-51` opens a native modal `<dialog>`; nothing locks the document. `showModal()` makes the
  page inert to clicks, not to scrolling.
- Measured (375x667, purse sheet open on /jar): a touch swipe on the backdrop above the sheet scrolled the page behind from
  `scrollY 0 → 32` (the page is 699/667 tall on SE and 390x664; with Safari's toolbars up it is ~110px taller than the visible area).
  A swipe inside the non-overflowing sheet did not chain in Chrome; on iOS WebKit, `overscroll-behavior: contain` (`Sheet.svelte:83`)
  only contains a scroller that actually overflows, so swipes on short sheets (purse 439px, ladder, check-in, partner) chain to the
  page too.
- iOS: the jar page slides under the sheet, Safari's toolbars collapse/expand (changing `100dvh`, so the sheet's `max-height` and the
  phone's `height` jump, `Sheet.svelte:80,107`), and on close the page is somewhere else.
- Fix (Sheet.svelte, one place for every sheet):
  ```ts
  // lock the page while any sheet is open (iOS 16+ honours overflow:hidden on the root for touch scrolling)
  $effect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.classList.add('sheet-open');
    return () => { if (!document.querySelector('dialog[open]')) root.classList.remove('sheet-open'); };
  });
  ```
  ```css
  /* theme.css */
  :root.sheet-open { overflow: hidden; }
  dialog { overscroll-behavior: contain; }
  ```
  If iOS 15 must be supported, use the body-fixed lock instead: on open `body.style.cssText = 'position:fixed;inset:0;top:-'+scrollY+'px'`,
  on close clear it and `scrollTo(0, y)`. Also apply the same class from HarvestOverlay (`HarvestOverlay.svelte:96`).

### H3. Pair: the つなぐ button jumps up over the airport art when the keyboard opens
- `app/src/routes/pair/+page.svelte:120` `.go { position: sticky; bottom: …; transform: translateY(calc(-1 * var(--kb))) }`. The
  transform is applied whether or not the sticky is engaged; on this page the button sits in flow right under the field (the page is
  exactly `min-height: 100dvh`, `:96`, so it is not scrollable and the sticky never sticks).
- Measured with an iOS-style keyboard (layout viewport unchanged, `visualViewport.height` −336, `--kb` = 336px): at 375x667 the
  field is at y 394–450 (under the keyboard, visible area ends at 331) while the button is lifted to **y 147–199, on top of the
  airport illustration**; at 390x844 field 509–565 vs visible bottom 508, button at 262–322. Screenshot: the button floats over the
  art with an empty hole in the card. On a real iPhone Safari also pans the visual viewport (`offsetTop` > 0), which shrinks `--kb`
  but leaves the button detached from the form.
- Fix: let the page scroll above the keyboard and let sticky do the lifting, no transform:
  ```css
  .pair { padding-bottom: calc(var(--safe-bottom) + 20px + var(--kb, 0px)); }
  .go { position: sticky; bottom: calc(var(--safe-bottom) + 8px + var(--kb, 0px)); }  /* drop the transform */
  ```
  The same pattern is safer in `Sheet.svelte:101`: `.foot { bottom: var(--kb, 0px); }` instead of `transform: translateY(-kb)`
  (a transform can push the footer above the top of a short sheet and out of the dialog's clip; `bottom` cannot).

### M1. きろく 「ワークアウトを追加」 overflows sideways; the whole phone pans horizontally
- `app/src/lib/components/kiroku/Kiroku.svelte:222` `.types { grid-template-columns: repeat(2, 1fr) }` with `word-break: auto-phrase`
  (`:226`). `1fr` is `minmax(auto, 1fr)`, so the longest label (高強度インターバルトレーニング) sets a min-content column.
- Measured: phone dialog `scrollWidth 413 / clientWidth 359` (375) and 413/374 (390, 390x664); the right column (ピラティス,
  屋外ウォーキング, サイクリング, ダンス) is cut off at the phone's edge. The dialog is `overflow: auto` in both axes
  (`Sheet.svelte:83`), so it becomes a 2-D scroller: vertical swipes on iOS lock to diagonal pans and the screen slides left.
  (Chrome implements `auto-phrase`; Safari ignores it and may break the katakana, but the `1fr` minimum still applies to any
  long Latin word in the English locale.)
- Fix: `.types { grid-template-columns: repeat(2, minmax(0, 1fr)); }` and on every sheet `dialog { overflow: hidden auto; }`
  (`Sheet.svelte:83`) so a stray wide child can never make a sheet pan sideways. Same `minmax(0,1fr)` for `.shelf`
  (`jar/+page.svelte:272`) and `.layers` (`:266`).

### M2. 村人 app: a scroller inside a scroller, and the inner one traps the swipe
- `app/src/lib/components/phone/VillagerApp.svelte:92` `.scroll { max-height: min(46dvh, 400px); overflow-y: auto; overscroll-behavior: contain }`
  inside the phone dialog, which itself scrolls.
- Measured: at 375x667 the dialog is 670/647 and the grid 1228/307 starting at y 353, its bottom at 660 (past the dialog's visible
  bottom at 659); same at 390x664. The grid covers the whole lower half, so nearly every swipe lands in it; at its end, `contain`
  stops the swipe, and the last 23px of the dialog can only be scrolled from the 280px strip above the grid. With the keyboard up
  (simulated) the grid is 152px tall and almost entirely under the keyboard.
- Fix: one scroller. Make the phone a flex column whose app body scrolls (see the architecture below) and let the grid flow in it
  (drop `max-height`/`overflow-y` on `.scroll`), or make `.scroll` `flex: 1; min-height: 0` inside a non-scrolling phone. If the inner
  scroller stays, drop `overscroll-behavior: contain` there so it chains to the phone.

### M3. Root `overscroll-behavior: none` makes the scrolling pages feel dead
- `app/src/lib/styles/theme.css:13` `html, body { … overscroll-behavior: none; }`.
- iOS 16+: no rubber band on /jar, /pair and the error page; the edge is a hard stop, which reads as "it won't scroll" on a page
  that only scrolls 32-110px (/jar on SE). The island does not need it (it is exactly 100dvh, `+page.svelte:168`, and does not scroll).
- Fix: remove it from the root; with H2 in place the background no longer moves behind sheets. If the island must never bounce,
  scope it: `html:has(.island) { overscroll-behavior: none; }`.

### L1. きろく loses the list position on ◀
- `Kiroku.svelte:66-76`: `go()` scrolls the dialog to the top, `back()` restores nothing. Measured: the week list scrolled to 218,
  open a day, ◀ back → scrollTop **0**. After each edit the user scrolls back down.
- Fix: store `scrollTop` with each stack entry in `go()` and restore it after `tick()` in `back()`.

### L2. The undo banner swallows scrolls that start on it
- `app/src/lib/components/ui/Toast.svelte:93` `.hit { … touch-action: none }` over the whole 56px banner, which sits at the bottom of
  the scrolling /jar page and the phone (`:103`). A swipe starting on it scrolls nothing.
- Fix: `touch-action: pan-x` (vertical drag still reaches the pointermove dismiss for the undo banner) or `pan-y` for the top banner,
  whose dismiss is swipe-up; or keep `none` only on a smaller handle.

### L3. `100dvh` on scrolling pages, and no fallback
- `/jar` (`jar/+page.svelte:198`), `.page` (`+layout.svelte:124`), `.state` (`:131`), `/pair` (`pair/+page.svelte:96`), the root
  (`theme.css:13`) use `min-height: 100dvh`. In Safari (not standalone) `dvh` changes as the toolbars collapse while the user scrolls,
  so the min-height recomputes mid-scroll (layout work and small jumps). `svh` is the stable value for a min-height on a page that
  scrolls. The island (`+page.svelte:167-168`) and the phone (`Sheet.svelte:107`) do want `dvh` (they must fill the visible area).
- There is no `vh` fallback: on Safari < 15.4 `height: 100dvh` is invalid and `.island` collapses to 0 (all children are absolute).
- Fix: `min-height: 100svh` on the scrolling pages; `height: 100vh; height: 100dvh;` on `.island`.

### L4. NumberPad height is a magic number tied to the phone's chrome
- `NumberPad.svelte:71` `min-height: calc(100dvh - safe-top - 12px - pad-bottom - 150px)`. It fits today (SE: dialog 647/647, last key
  bottom 629), but any change to the status row, title bar or phone padding makes the phone scroll by a few px with the keys at the
  bottom. With the flex-column phone below it becomes `flex: 1` with `align-content: end`.

Not issues (checked): no `wheel`/`touchmove` `preventDefault` anywhere; the island's `touch-action: manipulation` is on buttons only;
`-webkit-overflow-scrolling` is not needed (momentum is default since iOS 13); the island sea/tint (`Sea.svelte:20,26`,
`IslandScene.svelte:195`) overflow by ±100vw/100vh but are clipped by `.top { overflow: hidden }` (`+page.svelte:170`), so the
document never widens (scrollWidth = innerWidth everywhere); the harvest overlay (`HarvestOverlay.svelte:168-180`) is a
full-screen scroller that fits at every size; `keyboardInset.ts:9` computes the keyboard from `innerHeight − vv.height − vv.offsetTop`,
which is right for things anchored to the layout-viewport bottom.

## Recommended scroll architecture

1. **One scroller per surface.**
   - Island: not scrollable. `.island { height: 100vh; height: 100dvh; overflow: hidden; }` (as now, plus the fallback).
   - /jar, /pair, error: the document scrolls. `min-height: 100svh`; no `overflow` on html/body except `overflow-x: clip` on `html`
     (instead of `overflow-x: hidden` on body, `theme.css:18`; `clip` does not create a scroll container and does not break sticky).
     No root `overscroll-behavior`.
   - Paper sheets: the `<dialog>` is the scroller: `max-height: calc(100dvh - var(--safe-top) - 24px); overflow: hidden auto;
     overscroll-behavior: contain;` footer `position: sticky; bottom: var(--kb, 0px)`.
   - しまフォン: the dialog does not scroll; it is a flex column (`display: flex; flex-direction: column; overflow: hidden;
     height: calc(100dvh - …)`), the status row and title bar are fixed at its top, and the app body
     (`.page`/`.grid` wrapper) is the only scroller: `flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain;
     padding-bottom: calc(var(--safe-bottom) + 22px + var(--kb, 0px))`. Kiroku's `go()`/`back()` scroll that element.
     Inner lists (villager grid) are not scrollers.
   - Harvest: the full-screen dialog scrolls (as now).
2. **Background lock while any dialog is open:** `:root.sheet-open { overflow: hidden; }` toggled by Sheet and HarvestOverlay
   (H2); body-fixed fallback only if iOS 15 matters.
3. **Viewport units:** `dvh` only for things that must fill the visible screen and never scroll themselves (island, phone height,
   sheet max-height); `svh` for min-heights of scrolling pages; always a `vh` line before a `dvh` line on fixed heights.
4. **Keyboard:** iOS does not resize the layout viewport, so `dvh` ignores the keyboard. Keep `--kb` from `keyboardInset`, and use it
   only as extra bottom padding of the active scroller plus the `bottom` offset of sticky actions; never as a `transform`.
5. **Inputs:** every `input`/`textarea`/`select` at 16px or more, enforced by a test (H1). Do not add `maximum-scale`.
