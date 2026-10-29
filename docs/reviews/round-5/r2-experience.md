# Round 5 · R2 · Experience + NH art (lead UX)

2026-10-29 · `b572caa` · `?demo`, `?demo=harvest`, `?date=` (04-05 10:00, 11-20 21:00, 10-29 23:30, 01-10 12:00), `/pair`, `/nope`, `/dev/characters` · 393×852×3, 375×667×2, 320×568×2 · OS dark, reduced motion · shots `.shots/r5/r2-*`.
**Idle runs:** 128 s / 169 s / 205 s at 393 / 375 / 320 with **0 errors**. 20–25 actions per 2 min, roughly every 5–9 s, 12 kinds: wiggle, hop, hum, turn, stroll, chat (nod + laugh), daydream, thought, surprise, curiosity, glee, inspiration.
**Tasks run end to end:** check-in, 筋トレ はい/いいえ, partner sheet + high-five, launcher (villager, language, privacy), Jar next trip, purse spend + undo, payday + undo, harvest to the end card, pair, error page.

## 1. Round-1 verification
| ID | Result | Evidence / note |
|---|---|---|
| A1 | **Partly** | On the island, villagers show floating marks and colour glyphs (`r2-393-after-yes`). The harvest overlay still floats cat faces (`pose-viva`, `joy`) over villagers (`r2-393-harvest2`) → N1 |
| A2 | Fixed | A plain `?demo` after `?date` previews loads autumn (`r2-393-osdark-noon`) |
| A3 | Fixed | OS dark at noon gives a day sky with dark chrome (`r2-393-osdark-noon`) |
| A4 | Fixed | 4/5 blossoms (`r2-393-0405`), red in late Oct, snow in Jan |
| A5 | Partly | The coconut moved to the palm. The oak still bears peach, pear and apple together (`r2-393-island`) |
| A6 | Fixed | See the idle log above |
| A7 | Fixed | Periwinkle sea, moon glint (`r2-393-1120-night`) |
| A8 | Fixed | Blue horizon, bigger clouds. The sky band is still a little empty at 393 |
| A9 | Fixed | Lean/tilt keyframes, no mirroring |
| A10 | Fixed | Rounder lobes |
| A11 | **Not fixed** | `oak-fall` 309 → 370 device px, `glyph-map` 96 → 119 (measured at 393×3) |
| A12 | Fixed | No leaves crossed a face in about 8 min |
| A13 | Fixed | Roses and pansies with snow caps (`r2-393-0110`) |
| A14 | **Not fixed** | Harvest is navy by day (`r2-393-harvest1b`) |
| U1 | Fixed | Tom Nook error page, bilingual (`r2-320-error`). No crash |
| U2 | Fixed | あなた chip. At 320 the partner pill becomes a blank dot → N6 |
| U3 | Fixed | 43 → 55 → 57, 「筋トレに入れました！」「食事の洋なしが育ちましたよ！」 (`r2-393-saved`) |
| U4 | Fixed | 「今夜のチェック · あと2つ」 |
| U5 | Partly | The end card shows 「¥9,580 入れました！ / まめさんの番です」 (`r2-393-harvest-end`). Back on 島, the jar still reads ¥146,200 and there is no turn hint |
| U6 | Fixed | 財布 +¥2,000 sits in the total line above つぎへ (`r2-320-harvest1`) |
| U7 | Fixed | 「ふたりで ★9」. The partner hero is a fruit, low rings are sand (`r2-393-partner`) |
| U8 | Fixed | Caption plus 「Show active minutes…」 (`r2-393-privacy-en`) |
| U9 | Fixed | 3 cards, new payday copy, undo works for spend and payday (`r2-393-purse-spent`, `r2-393-payday`) |
| U10 | Fixed | `r2-320-checkin`; the ladder uses 「ふたり」 |
| U11 | Fixed (copy) | です/ます throughout. It now truncates at 375 → N4 |
| U12 | Fixed | Close is 88×44, ✕ in the phone header (`r2-393-phone`) |
| U13 | Fixed | One banner: 「まめさんにハイタッチしました！」 (`r2-393-highfive`) |
| U14 | Not verifiable | Needs a real iOS keyboard |
| U15 | Fixed | Focus returns to the 村人 tile and the payday row. Purse price contrast not re-measured |
| P1 | Fixed | 0 errors across about 8 min of idle |
| P2/P3/P4 | Fixed (not observed) | No stuck facing or frozen しずえ |
| P5 | Partly | 36 animations running at idle (25 with a sheet open), against a budget of 24 |
| P7 | Partly | しずえ and palm fixed, oaks are not (A11) |
| P8 | Fixed | No hops at 21:00 |
| A1 (perf) | Fixed | Mine is announced once: 「もち 43/100」 |

## 2. Checklist (37 pass · 4 fail · 4 not verified)
| # | | Note |
|---|---|---|
| C1–C2 | ✓ | The plate stays constant and only the sky shrinks. Everything is visible at 320 |
| C3 | ✓ | CLS 0 in R1, not re-run |
| C4 | ✓ | |
| C5 | ✓ | Spec drift: §S.8 should say "3 on the oak + coconut on the palm" |
| C6–C7 | ✓ | |
| C8 | ✗ | At 375/320 the clouds sit behind the status pill, so 0 are visible at 320 |
| C9–C15 | ✓ | Bonfire on autumn night, night star fragment, mushrooms + acorns |
| C16 | ✓ | 6 stars per P5, so update §S.11 |
| C17–C18 | ✓ | |
| C19 | n/v | Balloon not seen in 8 min |
| C20 | ✓ | R1–R19 buttons |
| C21 | ✓ | Spec drift: villagers use marks, しずえ bubble is 48px. Update §M.5 |
| C22–C23 | ✓ | |
| C24 | ✓ | Against the new 5–9 s cadence (update the spec) |
| C25 | ✓ | Reduced motion: 0 animations. Sheet pauses idle. "Slow after 3 min" not verified |
| C26–C27 | ✓ | Dozing with zzz at 23:30 (`r2-393-2330`) |
| C28 | ✗ | Outfit swaps between poses, winter render is mis-scaled (N2, N3) |
| C29 | ✓ | Sheet opens in 211 ms |
| C30 | ✓ | Fruit % bubble (`r2-320-tree-tap`) |
| C31–C32 | ✓ | 52px tiles at 320, no ellipsis |
| C33 | ✗ | Pair line ellipsised at 375 (N4) |
| C34–C36 | ✓ | |
| C37 | ✓ | Rows show no stars, by design per U7. Update spec |
| C38–C40 | ✓ | No horizontal scroll; island 568/667 tall; min font 11px |
| C41–C42 | n/v | Need a device |
| C43 | ✓ | |
| C44 | ✗ | Oak and palm canopy buttons share a label (N9) |
| C45 | n/v | Deferred to perf R2 |

## 3. New findings
| ID | Sev | What | VP | Evidence | Fix |
|---|---|---|---|---|---|
| N1 | Should | Harvest villagers float player cat-face icons, which undoes A1 | all | `r2-393-harvest2`, `HarvestOverlay.svelte:166-167` | Use `<Mark>` heart/sparkle or `glee`/`love` glyphs |
| N2 | Should | `isabelle-bow.webp` is a standing render in the autumn cardigan, so しずえ changes clothes (aloha on 島, cardigan on harvest/bow) and never bows | all | `r2-393-harvest2` vs `r2-393-island` | Use same-outfit bow art, or `stand` + a CSS bow |
| N3 | Med | The winter しずえ is about 1.4× bigger than the other poses and cropped at the waist | 393 | `r2-393-0110` | Normalise the canvas and feet baseline to the stand pose |
| N4 | Med | Pair: しずえ's only instruction shows as 「ようこそ！キーを…」 even though there is spare height | 375 | `r2-375-pair2` | Allow 2 lines here, or say 「キーを貼りつけてください」 |
| N5 | Low | The undo banner covers the Jar's ¥ total, and 「楽しんでくださいね！」 doesn't say what was spent | all | `r2-393-purse-spent` | Banner text 「映画 ¥4,000 使いました」. Keep the total visible |
| N6 | Low | The partner pill at 320 is a blank pink dot | 320 | `r2-320-island` | Show the first kana (「ま」) |
| N7 | Low | The payday row sits 15px under the dock until you scroll | 320 | `r2-320-jar` | Bottom padding = dock height |
| N8 | Low | Pair: a non-hex or short key leaves つなぐ disabled with no hint | all | `pair/+page.svelte:21` | Helper text: 「16文字以上の英数字キーです」 |
| N9 | Low | 4 canopy buttons have only 2 names (oak and palm duplicate) | all | snapshot | Label the palm 「ココナッツ」 or hide it from AT |
| N10 | Nice | Clouds hide behind the status pill in compact/tiny | 375/320 | `r2-375-island` | Lower the cloud lane below the status row |
| N11 | Nice | The focus ring is browser blue (payday row) | all | `r2-393-payday` | `:focus-visible` outline in `--leaf` |

## 4. Sign-off
**Approve with changes.** The core loop now lands (know it's me → act → see the fruit move), the island is lively and NH-true, and nothing crashed. Fix N1–N4, A14 and A11 before calling v4 done. Fold spec drift into v4.1.
