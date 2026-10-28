# Nutritionist, Round 3: localizing the plan for Japan

**Context:** the couple lives in Japan and the currency is yen (ADR 0006). The core design doesn't change: 3 active habits, one evening check-in, the Pear at 15 of 21, no calories or weight, and eating answers kept private.

## 1. Japanese reference values (日本人の食事摂取基準 2025年版, MHLW)
**Source:** chapter PDFs and the full report linked from mhlw.go.jp/stf/newpage_44138.html, fetched 2026-10-28. The PDFs' Japanese text didn't extract (font encoding), so values were read from the numeric tables. ✔ means the number was confirmed in the extracted table. "≈" means it is partly confirmed and needs a human check against the summary table (概要表).

| Nutrient | Partner A (M, 29 → 18–29 band) | Partner B (F, 26 → 18–29 band) | US values used so far | Note |
|---|---|---|---|---|
| **Salt (食塩相当量), target** | **< 7.5 g/day** ✔ | **< 6.5 g/day** ✔ | Sodium < 2,300 mg (≈ 5.8 g salt) | Japan's target is *looser* than the US/WHO (< 5 g salt) because typical intake is far higher. Salt g = sodium mg × 2.54 ÷ 1000 |
| Potassium, target | ≥ 3,000 mg ✔ | ≥ 2,600 mg ✔ | — | More vegetables and fruit help offset salt |
| **Protein, RDA (推奨量)** | **65 g** ✔ | **50 g** ✔ | 1.2–1.6 g/kg (A 80–105, B 65–90) | The JP RDA is a *minimum*. The DRI target range is 13–20% of energy, and 1.2–1.6 g/kg for strength training sits inside it |
| **Calcium, RDA** | **800 mg** ✔ (EAR 650) | **650 mg** ✔ (EAR 550) | 1,000 mg both | Typical Japanese intake is low, so this is still a worthwhile habit for B's bones |
| **Iron, RDA** | ≈ 7.0 mg | ≈ **10.0 mg** (menstruating) / ≈ 6.0 mg (not) | 8 / 18 mg | The 2025 edition lowered these slightly from 2020 (7.5 / 10.5 / 6.5). Verify |
| **Fibre, target** | ≈ **≥ 20 g** (table: 20.27) | ≈ **≥ 18 g** (table: 17.30, rounding to confirm) | 30–38 / 25 g | The JP targets are interim steps up from current intake (~11–12 g at this age ✔). About 25 g is the aspirational level |
| Reference body weight (18–29) | 63.0 kg ✔ | 51.0 kg ✔ | — | A (66 kg) and B (55 kg) are close to the reference, so the bands apply directly |

**Recommendation: use the Japanese values** for tips, labels and any in-app numbers.
- They match Japanese food labels: every pre-packaged food shows 食塩相当量 in grams.
- The local doctor will use them, and they're realistic for the local food supply.
- Keep two exceptions:
  - **Protein:** stay at 1.2–1.6 g/kg because both partners are strength training, with the JP RDA as the floor.
  - **Fibre:** treat 25 g as the "nice to reach" level.
- Not fetched this round, so check before relying on them: Health Japan 21 (健康日本21) vegetable target 350 g/day, and the MHLW alcohol guideline's lifestyle-disease risk levels of ≥ 40 g pure alcohol/day for men and ≥ 20 g for women. The pure-alcohol formula *was* verified: ml × ABV × 0.8, so 500 ml of 5% beer = 20 g.

## 2. Japan-specific levers and swaps
**Salt is the biggest lever.** Typical intake is around 10 g/day, well above either target. Rough salt per serving (labels vary): ramen bowl 5–8 g (about half in the broth), udon/soba in broth 4–6 g, conbini bento often 3–4 g, soy sauce 1 tbsp ~2.5 g, umeboshi ~2 g, miso soup ~1.5 g, tsukemono 1–2 g.
Swaps: **leave the broth** (スープは残す); dip sushi fish-side, lightly, or use 減塩 shoyu; flavour with ponzu, citrus, sesame, dashi or shiso; one veg-loaded (具だくさん) miso soup a day; read 食塩相当量 on the label.

**Sweetened drinks are the second lever.** Vending machines and conbini make them effortless: canned coffee (even 微糖 has sugar), milk tea, fruit juice drinks, Calpis, energy drinks and sports drinks. A 500 ml bottle of a sugary drink is roughly 20–35 g of sugar; check 炭水化物 on the label. Swaps: mugicha, green tea, hojicha, unsweetened (無糖) coffee or tea, sparkling water (炭酸水).
- **Exception:** sports drinks are fine during long, sweaty sessions (over 60 min, or in summer heat). Salt targets relax on heavy-sweat days, and heatstroke (熱中症) prevention comes first.

**Conbini meal building ("3-part rule"):** a staple (onigiri or whole-grain bread) + a protein (サラダチキン, boiled egg, natto, tofu, grilled fish, unsweetened yogurt) + a vegetable (salad, ohitashi, 野菜スティック, veg-loaded soup). This counts as "balanced" for the dinner habit.

**Teishoku and eating out:** the 一汁三菜 / 主食・主菜・副菜 pattern (staple + main + side) is already a balanced plate. Good choices: grilled-fish teishoku (Ootoya, Yayoi-ken), ramen with 野菜増し (leave the broth), sushi and sashimi, and izakaya plates like edamame, hiyayakko, salads and grilled fish.

**Drinking culture (nomikai, bonenkai, shinnenkai, kangeikai):** never pressure anyone and never treat a nomikai as a failure; the alcohol-free-day habit just isn't ticked that day. Tips: a water chaser (和らぎ水 / チェイサー) between drinks, non-alcoholic beer, pacing at 飲み放題 (all-you-can-drink), and eating as you drink. **休肝日 ("liver rest day") is already a familiar concept**, so use the word in the habit name.

## 3. Habit menu for Japan (still exactly 3 active; swap one each season)
| Habit (EN / JP label) | Logged as | Why it matters here |
|---|---|---|
| Vegetables at 2 meals / 野菜を2食で | 1 tap | Fibre and potassium; most adults fall short of the 350 g/day target |
| No sweetened drinks / 甘い飲み物なし | 1 tap | Vending machines and conbini are the main added-sugar source |
| Salt-smart day / 減塩デー ("left the broth, light on soy, ≤ 1 miso soup") | 1 tap | Biggest single lever toward < 7.5 / < 6.5 g |
| Balanced dinner / 主食・主菜・副菜 (home-cooked, teishoku or 3-part conbini) | 1 tap | Replaces "home-cooked dinner": balance is the goal, not who cooked |
| Palm of protein each meal / 毎食たんぱく質 | 1 tap | Supports strength training (PT and Anytime Fitness) |
| Calcium food today / カルシウム食品 (milk, yogurt, tofu, small fish, komatsuna) | 1 tap | Supports B's bones; typical intake is low |
| 休肝日 (alcohol-free day) | 1 tap | Only if drinking is part of their week (ask) |

**Suggested starters (Season 1, Nov–Jan):** Vegetables at 2 meals · No sweetened drinks · Salt-smart day.

## 4. Treat Purse ideas (¥8,000/month default; at least half non-food)
| Non-food | ¥ (for two, approx.) | Food experience | ¥ (for two, approx.) |
|---|---|---|---|
| Super sento / onsen day | 3,000–6,000 | Café date | 1,500–2,500 |
| Karaoke (2 h) | 2,000–4,000 | Kaiten sushi | 3,000–5,000 |
| Movie date | ~4,000 | Yakiniku dinner | 8,000–12,000 |
| Museum or garden visit | 2,000–4,000 | Couples cooking class (trial) | 2,000–8,000 |
| Massage / 整体 | 5,000–8,000 | Michi-no-eki / farmers-market haul | 2,000–3,000 |
| Day hike + train trip | 3,000–6,000 | Nice sushi counter (a saving-up goal) | 15,000+ |
| New donabe / Seki knife / plant | 3,000–10,000 | Seasonal fruit picking (ichigo-gari) | 4,000–6,000 |

## 5. Japan calendar by season (plus seasonal foods to celebrate, not restrict)
| Season | Events (auto-suggest Cozy Days / no eating score) | Seasonal foods to feature |
|---|---|---|
| **S1 Nov–Jan** | Bonenkai (Dec), Christmas, 正月 (Dec 29–Jan 3: no eating score), shinnenkai | **Nabe** (vegetable- and tofu-heavy; go easy on the broth), mikan, daikon, hakusai, buri |
| **S2 Feb–Apr** | Setsubun, Valentine's / White Day, hanami, April kangeikai | Nanohana, takenoko, spring cabbage, sansai, strawberries |
| **S3 May–Jul** | **Golden Week** (travel: Cozy Days), tsuyu, early heat | Edamame, tomato, cucumber, goya, mugicha; **heat-safe hydration** content |
| **S4 Aug–Oct** | **Obon** (family and travel), summer matsuri, Silver Week, likely the vacation (paused) | **Sanma, kinoko, kuri, satsumaimo, kaki, shinmai** (new-crop rice) |

Seasonal quests can follow the calendar: *Nabe Night* (S1), *Hanami Bento* (S2), *Summer Veg Box* (S3), *Autumn Harvest Teishoku* (S4).

## Questions for the user
1. Do you cook at home most nights, or rely on conbini, teishoku or eating out? This decides "balanced dinner" vs "home-cooked".
2. How often do you have nomikai or drink at home? Should 休肝日 be on the menu?
3. Do you drink canned coffee, milk tea or sports drinks daily?
4. Do you want the app's habit labels in Japanese, English or both?
5. Has a doctor ever mentioned blood pressure, anaemia or bone density at a 健康診断 (health check-up)?
