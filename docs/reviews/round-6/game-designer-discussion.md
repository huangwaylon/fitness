# Round 6: game-designer discussion of the user's concerns

Senior mobile game designer, 2026-10-29 ~17:05 JST. Dev server at 393×852 dusk, mid-edit (`.shots/v6/gd-*`). At 320 the page showed the error screen mid-edit, so for 320/375 I used the lead's `island-noon-*`. **Lens: be faithful to the Animal Crossing games** (the user's rule).

**What I saw:** 7 interactive things (2 orchards, 2 palm coconuts (the left one starts off-screen at x = −1), the jar, 2 villagers, the phone). About 12 decorative ones (Resident Services, road, pine, campfire, 4 bushes, 4 flowers, islet, clouds/sun, leaves). 31 animations at load. A ~235px empty sky.

## The user's concerns

| # | Concern | Verdict | Reasoning | Recommendation |
|---|---|---|---|---|
| 1 | Too much decoration | **Agree.** Placement matters more than count | *Everything you can see is either usable or terrain*: that's NH's own rule. Decoration sits in the centre lane, right behind the jar | ≤ 2 decorative groups, kept at the edges |
| 2 | Remove the islet | **Agree** | Its palm looks like my coconut palm, so it looks tappable | Remove it; the ▲ sea is enough |
| 3 | One tree per person | **Agree.** I endorse the lead's ground-fruit plan (below) | In AC a tree bears one kind of fruit, so four kinds on one tree is off-model | One plain tree per person, fruit on the ground |
| 4 | Building and road distract | **Strongly agree** | In NH, Resident Services is the most-entered building, so a door that doesn't open breaks a promise. | Remove both. **The jar becomes the plaza centrepiece** (where NH puts the plaza), 1.25× (~75px), on a round sand patch |
| 5 | Smoother jar animation | **Agree, top priority** | Today: a `scale(.95)` press, a **450ms dead wait**, a hard cut, then a **different jar** (F6). That's lag, not juice | **Press:** 0.92 over 80ms. **Release:** spring to 1.06, then 1.0 over 220ms `cubic-bezier(.34,1.56,.64,1)`, with 2–3 coins hopping 10px. **Then right away** a shared-element morph into the hero jar (View Transitions via `onNavigate`), 320ms `cubic-bezier(.4,0,.2,1)`, cards rise 16px, 40ms stagger. **Back:** 280ms. Tap to content ≤ 400ms; the villager reacts *during* the morph. One jar drawing everywhere. Reduced motion = a 150ms fade |
| 6 | Longer flower row | **Agree, as one continuous border** | NH players edge their islands with flower and hedge borders; one line reads as one background unit | Front border across the island width minus 16px, ≤ 24px tall, 2 colours, static. The 4 bushes become one low hedge at the back |
| 7 | Too much empty space in one area | **Agree** | The empty sky (~235px, 28%), the centre lane once the building goes, and a ~45px sand strip. Pocket Camp frames the campsite tightly | Table below |

### Fruit on the ground: evaluation and alternatives

**The lead's choice (plain tree, fruit as items on the ground around the trunk) is the most faithful option.** In NH, shaking a tree drops **3 fruit** that lie around the trunk. Encode progress as **0–3 of each fruit = thirds of that category's target**, in a fixed arc in front of the trunk (🍑 🥥 🍎 🍐 from left to right), sized like NH ground items (~18px at 393). The check-in feedback is NH's own: **the tree shakes** (±4°, 3 swings, 500ms) **and a fruit drops** with a little bounce (250ms). Tapping the tree or the fruit opens my breakdown. Risks: villagers covering the fruit (keep them inside), and 12 fruit per person reading as clutter at 320 (there, show at most 1 fruit per category once it's ripe).

Faithful alternatives: **(a)** each person's tree bears their *native fruit*, and only the three other kinds go on the ground; **(b)** NH's **fruit-basket** style display beside the trunk (one object, cleaner at 320, but static); **(c)** Pocket Camp: one tree with 3 of one fruit, plus the weekly fruit as a "gift" pile.

### Proportions per viewport (bottom-anchored stage; the dialogue overlays a fixed slot, which also fixes F1)

| Band | 393×852 | 375×667 | 320×568 |
|---|---|---|---|
| HUD over the sky | 0–100 | 0–92 | 0–84 |
| Sky below the ribbon | 100–180 (9%) | 92–140 (7%) | 84–110 (5%) |
| Sea | 180–300 (14%) | 140–210 (10%) | 110–150 (7%) |
| Island | 300–690 (46%) | 210–530 (48%) | 150–440 (51%) |
| Dialogue/CTA slot | 690–852 (19%) | 530–667 (21%) | 440–568 (23%) |

Trees at the back left and right, the plaza jar ~55% down the island, the villagers on the inside, the flower border at the front.

## Not faithful today, and what the games do instead

| Today | AC does |
|---|---|
| The jar is a custom flat drawing among 3D renders, with 3 versions | One object in item-render style, the same everywhere (the way NH reuses item icons) |
| The harvest uses a tailed bubble (F5) | One dialogue box: wobbly cream, tilted nameplate, text typed out, ▼ to advance |
| はい/いいえ have no cursor (F8) | A ▶ cursor on the highlighted choice |
| Confetti | No confetti. **Item-get beat**: the character holds the item overhead + a sparkle + a jingle (~1.2s) |
| Bottom sheets (radius 32) | NookPhone apps that take over the screen with the phone frame. Nook Miles-style banners for achievements |
| A green app-style CTA bar | No permanent buttons in NH; keep the bar, styled as an NH prompt |
| The NookPhone icon top-right | OK; keep it small |
| The ribbon is static | Fine (map banner); tap → breakdown |
| Silent | Animalese, a UI click, a bell chime, the item-get fanfare. **Opt-in sound**, 3 synthesized SFX (not ripped audio) |

The **time-of-day tint, clock top-left, emotes, choice list and nameplate box are faithful.**

## What the user hasn't raised

1. **Core loop.** Open → ribbon + tree → check in (3 taps) → **one beat** (the tree shakes and a fruit drops, then the ribbon counts up over 600ms) → leave. Session 15–30s (Sunday 60–90s), ≤ 3s of forced animation.
2. **The harvest climax is hidden.** The card covers the island jar. Instead, as in NH: the fruit on the ground hops into the island jar (8–12 sprites, 700ms, 60ms stagger), the jar pops (1→1.12→1, 250ms), the plate counts up (900ms), the item-get beat plays, *then* the breakdown card appears.
3. **Interactive vs background.** Interactive things react within 100ms; background never does. Hit areas ≥ 44×44, on-screen.
4. **Thumb zones.** CTA bottom ✓, choices right ✓, jar mid-screen ✓, phone top-right (rarely used) is acceptable.
5. **Onboarding.** The first check-in must drop a visible fruit. Three one-at-a-time しずえ lines (ribbon → tree → jar), each dismissed by tapping the thing she points at.
6. **Delight vs noise.** Idle ≤ 10 animations, ≤ 3 particles.

## Prioritized recommendations

1. **P0** Jar: spring press, no dead wait, ≤ 400ms morph, one jar.
2. **P0** Remove the building, road and islet; the jar goes to the plaza centre.
3. **P0** One plain tree per person + 0–3 ground fruit per category; shake + drop on check-in.
4. **P1** Layout proportions + fixed dialogue slot.
5. **P1** Harvest on the island: fruit into the jar, the item-get beat, then the card. No confetti.
6. **P1** One dialogue box + ▶ cursor everywhere.
7. **P2** Flower border + back hedge only; opt-in SFX; tapping the ribbon opens the breakdown.
