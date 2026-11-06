# けっこんしき UI: visual QA notes (2026-11-06)

Branch `wedding-ui`. WebKit (Playwright's iPhone 15 profile) at 393×852, day and night (`?theme=night`), as A and as the
guest, on the dev page `/dev/wedding?demo` (invented board: ハル & ミオ, はなぞの テラス, the day 225 days out) and the
island's menu. Shots: `/tmp/wedding-ui-shots/` (`r0-*` first pass, `r1-*`, `r2-*`, `r3-*` after the fixes).

## Choices

- **⚙ in the title bar, not a third segment.** せってい is rare (names and the day set once, a restore now and then); a
  third tab would give the members and the guest different tab bars and put a seldom-used page on equal footing with
  the plan. The NavBar's lead slot is the app's place for a top-level control (けんこう's whose-data pill); it's a level
  with ‹, as Navigation asks. The guest has no ⚙.
- **A task opens as a level**, not an accordion: one card per screen to read, the checklist and the edit fields get the
  width, ‹ comes back to the same scroll (levels don't reset the plan's filter).
- **Delete = 🗑 inside ✎** (not on the page face: the face is for reading and ticking) with the banner's とりけす; ぜんぶ
  けす asks NH-style in its own small sheet.
- **パニエル's line** only on the day's first opening on that phone (Simplicity: one host line, only with news); the
  guest never gets the 期限切れ nudge (it can't act on it).
- **The head is a game object** (cream / blush at every time of day, like the dialogue box); the cards follow the
  chrome's theme.

## Round 1 (r0 → r1)

- A task's page ran 48px past the sheet (a grid's `auto` track sized by a long URL's min-content; the edit page then
  scrolled sideways on focus): `minmax(0, 1fr)` columns.
- The big ✓ drew a black filled path (no stroke styles on the button's svg).
- The filter chips wrapped 完了 alone onto a second row: tighter padding, the five fit one row at 393 (asserted in
  the e2e); English may wrap.
- The note's ruled lines didn't meet the text: the rules moved onto the document itself (every line 32px).
- Writing the note left the head, the line and the tabs above the field (and a tab switch would drop the draft): they
  hide while writing.
- The empty board: a 0% ring showed a dot; the bouquet row, the chips and the ＋ / ⚙ hide with nothing to act on;
  パニエル's head over the empty line.
- The two start / due date fields side by side cut the date off: one under the other, in the order they happen.

## Round 2 (r2 → r3)

- Category chips were a muddy grey-brown at night (a lip mix over navy): the themed sunk tone (`--ctl-off`).
- The wedding day's own card now wears blush and a heart (the plan counts down to it; the month plate alone was easy
  to miss).

## Open

- The demo board's kanji (招待客, 式場…) aren't in the font subset; the users' own kanji fall back to the system rounded
  font, as elsewhere.
- Long months of one task each make a tall list; collapsing far-off months could come later if the real board feels long.
- iPhone check of the date inputs and the textarea with the keyboard up (`--kb`) is for the phone, not SwiftShader.

## Integration (2026-11-06, branch `wedding`)

- The sheet runs on the store (board.svelte.ts) over the record's rows; the dev page and its fixture are gone: the demo's
  invented board (`?demo`: たろう & はなこ, 架空チャペル, the day 160 days out) drives the e2e from the menu, the
  guest's as `?demo&as=G`, and a conflict comes from two tabs' crossed saves (the demo's taps are both players').
- One rule each: the percent, the states, こんげつ and the due days are progress.ts' (view.ts' copies deleted); the
  board's day words are i18n's (time.ts' unused Intl formatters deleted).
- A conflict's two versions are labelled by their writers' names (じぶんの / もう ひとりの could both be one person's
  two phones). せってい gained the wedding's time (`time`, the old board's), shown after the day in the head.
- Shots: `/tmp/wedding-int-shots/`.
