# Round 7: experience review (game designer + UI/UX lead)

Build `f3e68e5`, `?demo` / `?demo&as=B` / `?demo=harvest` / `?date=` (noon, 17:55 dusk, 22:00 night, Jan dawn snow, Apr harvest). Viewports 393×852, 375×667, 320×568. Screenshots in `.shots/r7/exp-*`.


## 1. Visual consistency

| Element | Verdict |
|---|---|
| Sky | **Pass.** The 3-stop gradients read as NH at noon, dusk, night and dawn. |
| Sun / moon | **Pass, one small issue.** Glow and placement work. At 375 dusk the sun is drawn on top of a cloud (it should sit behind it). |
| Clouds | **Pass.** Same soft-underside style for the floating clouds and the horizon bank. |
| Sea | **Pass.** NH blue with glints. At night it stays quite bright next to the navy sky; acceptable. |
| Shallows / foam | **Pass.** The turquoise ring and two foam lines are close to `PC_Campsite_Summer`. |
| Sand | **Pass.** The crescent and wet band are warm and cohesive, and the winter pinks under the dawn tint read correctly. |
| Cliff | **Pass.** The terracotta lip and the winter scallops are subtle and in style. |
| Grass | **Pass.** The radial highlight and flecks lift the old flat green. |
| Shadows | **Pass.** Soft, surface-coloured contact shadows under trees, jar and villagers. |
| Trees | **Pass.** One tree per person, with fruit on the ground. The autumn, winter and spring canopies all match. |
| Characters | **Pass.** Official renders. |
| Jar | **Pass.** It is the focal point. |
| UI chrome | **Mostly passes.** The ribbon, plates and dialogue are consistent. Clock contrast and the browser bar colour still need fixing (F12, F13). |

Overall, the scene finally reads as one Pocket Camp diorama at every time of day. One focal point (the jar), no big empty sky. Jar ⇄ 旅の壺 is smooth: 55 frames in 900 ms, worst frame 19 ms, no jank, and state survives the round trip.

## 2. きろく usability

- **Findability: good.** It is the first app on the phone. The ribbon opens this week's detail and the 旅の壺 total opens お金, both as the design specifies. 
- **Locked vs open: clear on the week screen, weak on the day screen.** The week screen has a green "✎ あと5日 修正できます" for open weeks and "この週はしめきり済み。見るだけです" for locked ones; list cards show 🔒✓. On a locked day, though, my check-in chips look exactly like the tappable ones (F5).
- **Partner data: correct.** It is view-only with a 見るだけ badge, and their edits appear in my change log with their face.
- **Keypad: works.** ATM digits, the old value in grey, and ▶けってい/やめる all behave. But it sits at the top with about 40% empty below it, far from the thumb (F10).
- **Change log: clear.** Strikethrough of the old value → new value, with time and face. Edits show ✎ in the table, but the ✎ sits after the check-in dots, so you can't tell which value changed (F8).
- **Undo: the biggest problem.** The undo banner appears but cannot be tapped while the phone is open (F1), and then it never goes away (F2).
- **Small screens: fine.** At 320 the bars, table and pills fit with no overflow.

## 3. Findings

| ID | Sev | What | Viewport | Evidence | Fix |
|---|---|---|---|---|---|
| F1 | P1 | The undo banner (`取り消す`) shows over the phone but can't be tapped. It is a popover outside the modal `<dialog>`, so the page treats it as blocked: `elementFromPoint` at the button's centre returns the dialog, and the button isn't in the accessibility tree. That makes every きろく undo (metric, check-in, workout, void, transfer) unreachable, and it covers the last list row. | all | `exp-393-after-edit`, `exp-393-undo-blocked`, `exp-393-void` | Render the toast inside the open dialog (or have Toast mount into `dialog[open]` when there is one). Add bottom padding to the phone scroller equal to the banner height. |
| F2 | P1 | Ghost banner. After the 5 s window the banner turns `inert` but is never removed. It stayed for minutes, survived closing the phone, and covered 今夜のチェック on the island. Reproduced from a fresh reload with no pointer near it. | 393 | `exp-393-ghost-banner`, `exp-393-day-locked` | Hide the popover and drop the node when the toast ends, instead of relying on the Svelte outro. Verify on a real iPhone. |
| F3 | P2 | Adding a workout doesn't change 活動. 45 min of ピラティス left 54/135 and the score at 55; manual workouts only count toward strength. For "I forgot my Watch" this looks broken. | 393 | `exp-393-workout-added` | Count manual minutes into the day's minutes, or say so in the add screen ("筋トレの日に数えます"). |
| F4 | P2 | After けってい, focus drops to `<body>`, outside the modal. | all | `activeElement` = body | Return focus to the edited row's ✎. |
| F5 | P2 | Locked day: my 定食ランチ / 減塩デー chips look identical to the editable ones. | 393 | `exp-393-day-locked` vs `exp-393-day-open` | Give my card a 見るだけ badge in locked weeks and use flat, lipless chips. |
| F6 | P2 | 取り消し (voided badge), 取り消す (void button) and 取り消す (toast undo, including "undo the undo") are near-identical words for three things. | 393 | `exp-393-money`, `exp-393-transfer-undo` | Badge "取り消し済み", row action "なかったことに", toast "もとに戻す". |
| F7 | P2 | A void takes effect on a single tap with no confirmation, and the only safety net is F1's unreachable undo. | 393 | `exp-393-void` | Use an NH choice list (取り消す / やめる), or fix F1 first. |
| F8 | P3 | The week table has no column labels (steps, minutes, ★, meals) and no names over the two halves. The ✎ position is ambiguous. | 393/320 | `exp-393-week-open` | Add a one-line header and put ✎ right after the edited number. |
| F9 | P3 | The 内訳 (breakdown) doesn't add up: ¥4,500 + ¥4,700 + ¥1,800 = ¥11,000, then 財布 ¥2,000 on top. | 393 | locked week 10/19 | Label it "財布へ ¥2,000（別）" on its own line. |
| F10 | P3 | The keypad is anchored high, leaving about 40% of the phone empty below it. | 393 | `exp-393-keypad` | Anchor the keys to the bottom, with the value above them. |
| F11 | P3 | Empty areas: about 35% blank cream at the bottom of 旅の壺, and about 150 px of empty cream on the one-row harvest card. | 393 | `exp-393-jar-mid`, `exp-393-spring-harvest` | 旅の壺: show the last 3 money-log rows. Harvest: size the card to its content. |
| F12 | P3 | Clock contrast is about 3.9:1 on the day sky (known). | 393 | `exp-393-noon` | **Fix now:** darker ink or a 1 px cream halo, to reach ≥4.5:1. It's cheap. |
| F13 | P3 | The browser bar `theme-color` is stale (known): `#69B8F0` at noon is lighter than the sky top, and `#FF9E7A` at dusk clashes with the violet sky top. | 375/393 | `exp-375-B-dusk` | **Fix:** use the time of day's top sky stop and update it when the time of day changes. |
| F14 | P3 | About 59 px of open sea at 393 when there's no dialogue (known). | 393 | `exp-393-tree` | **Accept.** It is diorama sea with glints, consistent with the PC refs, not dead space. Optionally carry the outer foam line down into it. |
| F15 | P3 | The dusk sun is drawn over a cloud; the list's week stamps have no weekday labels. | 375/393 | `exp-375-B-dusk`, `exp-393-kiroku-list` | Put the sun behind the clouds; add tiny 月…日 labels above the first card's stamps. |

## 4. Sign-off

- **Environment (v7): signed off.** Cohesive Pocket Camp style across all times of day and seasons. Only F12–F15 polish remains.
- **きろく: not signed off.** Browsing, permissions and the locked/open model are right and easy to find. **F1 and F2 must be fixed**: undo is the product's safety net for one-tap edits and voids, and right now it is both unreachable and leaves a stuck banner. I'd also like F3 decided and F5–F7 cleaned up. I'll re-verify after the fixes.
