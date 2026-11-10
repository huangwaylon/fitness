# はたけ: the fields

NH 2.0's vegetables on the island (decided 2026-11-10; the user's changes the same day: a field each, 40 plants). Buy
starts at the shop, plant them on your field, water, harvest, and the plant grows back. The produce sells for かいがら,
never ベル. Code: `contract/farm.ts` (the rules, shared by the record and the phones), `contract/wet.ts` (rain),
`model/farm.ts`, `layout/field.ts`, `store/farm.svelte.ts` (the writes, たね), `island/farm.ts` (the scene),
`island/farmTap.ts` (a plot's tap), `island/FarmMenu.svelte`, `farm/FarmSheet.svelte`, `world3d/objects.ts` (drawn);
tests `contract/farm.test.ts`, `island/farmTap.test.ts`, `relay/test/farm.test.ts`, `e2e/farm.spec.ts`.

## Decisions

1. **A field each.** A field is a layout object (kind `field`, `layout/field.ts`): its owner and size are its variant
   (`a-10x4`: ウェイ's, 10 tiles across and 4 deep). It's placed, moved, resized and given an owner in /editor only (the
   editor-only rule; the 畑 tab of 野菜). Our island has a 10 × 4 field for ウェイ and one for うめ, one behind the
   other on the open lawn behind the shop (laid as editor ops on 2026-11-10). The default island (`default.json`) has
   none: no 10 tiles across are free beside its path, and 4 × 10 on the front lawn pushed the visitors' stage and
   K.K. off it; a layout reset drops them (place them again in the editor). The guest has none; the editor can give
   it one.
2. **Only the owner plants, harvests or digs** on a field; anyone waters anything (NH's visitors), the guest too.
3. **At most 40 plants each** (`FARM.cap`), whatever the field's size.
4. **Prices: NH ÷ 20,** as every shop price: a start costs 14 (280 Bells) and sells back for 4, a vegetable sells for
   18 (350). Balance comes from cadence, never the price.
5. **Cadence (NH):** ripe 3 days after planting through 4 stages (0, 1, 2, ripe); harvested, the plant grows back from
   stage 2 and is ripe again 3 days on (`FARM.regrowDays`). It yields 1, plus 1 for each of the two days before it
   ripens that it was watered: 1, 2 or 3 (NH's Lv1–3 models).
6. **Rain waters everything:** any wet hour of the Tokyo day (our winter snow is real rain) waters every plant.
7. **The can waters 3 × 3:** a tap on a plant waters it and its neighbours (NH's golden can).
8. **Starts are sold at the shop's かう,** always in stock, all six crops at one price, any season. A vegetable can be
   planted too (buying a start, 14, beats replanting a vegetable worth 18, as in NH).
9. **Not in P1:** pumpkin colours (orange only), a live relay intent for a partner's plant or harvest, flowers from
   seed, the editor's paint brush. No fruit trees (the goal trees' fruit means fitness).

## Balance

Per person, a full field watered on its two days: 40 plants × 3 vegetables × 18 かいがら ÷ 3 days ≈ **720 かいがら a
day**, for a minute or two of taps (5–8 waterings with the 3 × 3 can, ~13 harvests a day on a staggered field). Unwatered
it's 240 a day; on one day's watering 480. Tokyo has ~110 wet days a year, which water for you. Setup: 40 starts cost
560, paid back by the first harvest.

For scale: a sea catch is worth ~60–100 (~150–250 a minute, uncapped), a 15-minute session ~2,000–3,000, the median
piece of furniture 190. Farming is a daily habit worth ~25 % of a full player's かいがら, never the main source. The
levers, if the live numbers drift (`npm run logs`, the sells): `FARM.regrowDays` and `FARM.cap`, never a price.

## Rules (the record's)

- **`buy_starts`** `{crop, n, v}`: n 1–99, v exactly n × 14, covered by the sender's かいがら (else `wallet short`).
  The starts count into the pocket as `goods:<crop>-start`.
- **`farm`** `{d, ops}`: the sender's Tokyo day (yesterday to tomorrow), 1–40 ops, held 2 s on the phone and sent as one:
  - `{o: 'plant', p, c, src}` on an empty plot, under the cap, with a start (`src: 'start'`) or a vegetable (`'crop'`)
    in the pocket;
  - `{o: 'harvest', p, n}` of one's own plant, ripe on `d`: kept at the yield the record reckons, whatever `n` says;
  - `{o: 'dig', p}` of one's own plant: its start back.
  A refused op is dropped and the rest kept; none left: `farm refused`. The phone then shows the row as kept (a plant
  the partner got to first is gone and its start back).
- **The plot** is `fd:<fieldId>.<col>.<row>`. The record keeps a plant its planter's; whose field a plot is, the phones
  decide (the layout is theirs). A plant on a tile a field no longer covers is kept, not drawn, and counts toward the cap.
- **Watering** is the island day's `watered` list (the flowers' own), now up to 160 ids.
- **Rain:** the record writes one `wet` row a wet day itself, from the room's weather cron: in the `real` mode a Tokyo
  day the timeline had a wet hour of, in the `game` mode the seeded wet day (`contract/wet.ts gameWet`, the island's
  seeded weather's own draw). A phone never writes one.
- **The pocket:** a person's tallies, plus what the fields put in (harvests, dug-up starts) and less what they took
  (plants), plus the starts bought, less what was sold. The record's running ledger and `model/shop.ts` fold it alike.

## Playing

- **The farm button** (bottom left, the say button's mirror, NH's seed bag): たね (pick what to plant: each start and
  vegetable I have, kept on this phone), スコップ (armed for one dig, 取り消す 5 s) and はたけ (the 畑 sheet). Only on
  the island while it has a field, hidden with the say button.
- **A tap on a plot** (its tile under the finger, before a weed's or a find's finger slack) acts in place (never a
  walk; my villager turns to it), in order: the shovel armed on my plant
  digs it; my ripe plant is harvested (the catch plate 「トマトを しゅうかく！ ×3」); a plant not watered today is watered
  with its neighbours; my empty plot is planted with the picked crop (none picked: the picker opens); else a bubble
  (「うめの ニンジン・あと 1にち」, 「みずやり ずみ」).
- **Watered soil** is dark for the rest of the day (the soil's instance colour); a ripe plant shows its yield's model.
  The partner's watering shows at once (the shared world's day, the flowers' own); their plant or harvest on their
  next sync (a few seconds: a batch waits 2 s for the next tap).
- **The 畑 sheet:** my plants (収穫できる, 育成中 with days left, 空き区画), today's harvest and its かいがら, 「12/40株」,
  the partner's and the guest's plants folded, the rule line and 「苗はタヌキ商店で買えます」.
- **The shop:** うる's 野菜 section (vegetables and starts); かう's 「なえ」 row of the six starts with a count.
