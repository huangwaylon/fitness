# はたけ: the fields

NH 2.0's vegetables: a field each, 40 plants. Buy starts at the shop, plant, water, harvest; the plant grows back.
The produce sells for かいがら, never ベル. Code: `contract/farm.ts` (the rules, shared by the record and the phones), `contract/wet.ts` (rain),
`model/farm.ts`, `layout/field.ts`, `store/farm.svelte.ts` (the writes, the pick), `island/farm.ts` (the scene),
`island/farmTap.ts` (a plot's tap), `farmUi.svelte.ts`, `harvestPlate.ts`, `FarmButton`, `FarmPicker`, `FarmPop` (.svelte),
`farm/FarmSheet.svelte`, `farm/FieldMap.svelte`, `farm/sheet.ts` (the sheet's batches), `shop/Counter.svelte` (苗),
`shop/pocket.ts` (うる's 野菜 and 苗), `shop/stock.ts`, `world3d/objects.ts` (drawn);
tests beside them, `relay/test/farm.test.ts`, `e2e/farm.spec.ts`, `e2e/farm-sheet.spec.ts`.

## Decisions

1. **A field each.** A field is a layout object (kind `field`, `layout/field.ts`): its owner and size are its variant
   (`a-10x4`: ウェイ's, 10 tiles across and 4 deep). Placed, resized and owned in /editor only (its 野菜 → 畑 tab). Our island has a 10 × 4 field each
   for ウェイ and うめ on the lawn behind the shop; the default island (`default.json`) has none, so a layout reset drops
   them. The guest has none unless the editor gives one.
2. **Only the owner plants, harvests or digs** on a field; anyone waters anything (NH's visitors), the guest too.
3. **At most 40 plants each** (`FARM.cap`), whatever the field's size.
4. **Prices: NH ÷ 20,** as every shop price: a start costs 14 (280 Bells) and sells back for 4, a vegetable sells for
   18 (350). Balance comes from cadence, never the price.
5. **Cadence (NH):** ripe 3 days after planting through 4 stages (0, 1, 2, ripe); harvested, the plant grows back from
   stage 2 and is ripe again 3 days on (`FARM.regrowDays`). It yields 1, plus 1 for each of the two days before it
   ripens that it was watered: 1, 2 or 3 (NH's Lv1–3 models).
6. **Rain waters everything:** any wet hour of the Tokyo day (our winter snow is real rain) waters every plant.
7. **The can waters 3 × 3:** a tap on a plant waters it and its neighbours (NH's golden can). The 畑 sheet's 水やり
   waters every plant whose watering counts today: effort, not balance (the same cadence and cap; you still come daily).
8. **Starts are sold at the shop's かう,** always in stock, all six crops at one price, any season. A vegetable can be
   planted too (buying a start, 14, beats replanting a vegetable worth 18, as in NH).
9. **Not in P1:** pumpkin colours (orange only), a live relay intent for a partner's plant or harvest, flowers from
   seed, the editor's paint brush. No fruit trees (the goal trees' fruit means fitness).

## Balance

Per person, a full field watered on its two days: 40 plants × 3 vegetables × 18 かいがら ÷ 3 days ≈ **720 かいがら a
day**, for a few taps (the sheet's 水やり and 収穫). Unwatered it's 240 a day; on one day's watering 480. Tokyo has ~110 wet days a year, which water for you. Setup: 40 starts cost
560, paid back by the first harvest.

For scale: a sea catch is worth ~60–100 (~150–250 a minute, uncapped), a 15-minute session ~2,000–3,000, the median
piece of furniture 190. Farming is a daily habit worth ~25 % of a full player's かいがら, never the main source. The
levers, if the live numbers drift (`npm run logs`, the sells): `FARM.regrowDays` and `FARM.cap`, never a price.

## Rules (the record's)

- **`buy_starts`** `{crop, n, v}`: n 1–99, v exactly n × 14, covered by the sender's かいがら (else `wallet short`).
  The starts count into the pocket as `goods:<crop>-start`.
- **`farm`** `{d, ops}`: the sender's Tokyo day (yesterday to tomorrow), 1–40 ops, held 2 s on the phone for the next
  tap (the sheet's batches and digs 5 s, for 取り消す) and sent as one:
  - `{o: 'plant', p, c, src}` on an empty plot, under the cap, with a start (`src: 'start'`) or a vegetable (`'crop'`)
    in the pocket;
  - `{o: 'harvest', p, n}` of one's own plant, ripe on `d`: kept at the yield the record reckons, whatever `n` says;
  - `{o: 'dig', p}` of one's own plant: its start back.
  A refused op is dropped and the rest kept; none left: `farm refused`. The phone then shows the row as kept (a plant
  the partner got to first is gone and its start back).
- **The plot** is `fd:<fieldId>.<col>.<row>`. The record keeps a plant its planter's; whose field a plot is, the phones
  decide (the layout is theirs). A plant on a tile a field no longer covers is kept, not drawn, and counts toward the cap
  until the sheet's 苗に戻す digs it (never automatically: both phones would race).
- **Watering** is the island day's `watered` list (the flowers' own), now up to 160 ids.
- **Rain:** the record writes one `wet` row a wet day itself, from the room's weather cron: in the `real` mode a Tokyo
  day the timeline had a wet hour of, in the `game` mode the seeded wet day (`contract/wet.ts gameWet`, the island's
  seeded weather's own draw). A phone never writes one.
- **The pocket:** a person's tallies, plus what the fields put in (harvests, dug-up starts) and less what they took
  (plants), plus the starts bought, less what was sold. The record's running ledger and `model/shop.ts` fold it alike.

## Playing

- **The はたけ pill** (bottom left) opens the 畑 sheet; badges: the held crop (top left) and my
  ripe count (yuzu). Shown while I have a plot or any field has a plant; hidden with the say button.
- **A plot's tap** acts in place, forgiving a row's miss: my nearest ripe plant in its 3 × 3 is harvested
  (the catch plate); else its 3 × 3's unwatered plants are watered; my empty plot gets the held crop (at the cap 「もう
  40かぶ うえてる」; none held or left: the picker, whose pick plants it); else a word. No digging in the world.
- **The word** pops over the plot for 1.2 s (「トマトを うえた」, 「みずやり ずみ」), never in my villager's balloon.
- **The picker:** the starts (a seedling badge) and vegetables I hold, with counts; kept on this phone.
- **Watered soil** stays dark for the day; a ripe plant shows its yield's model. The
  partner's watering shows at once (the shared day); their plant or harvest on their next sync.
- **The 畑 sheet:** today's harvest and its かいがら (else 「明日収穫できる 9株」, 「次の収穫まであと2日」), 「12/40株」;
  実ったものを収穫 (one event; then 収穫済み till the sheet closes), 水やり (every plant on any field in its
  two days before ripe, not watered today: one shared-day change, to the relay 15 a second; else 水やり済み or from
  when: 「水やりは明日から」), 植える with a crop I hold (the pick, else my first start; a vegetable only once picked; my
  empty plots as the map reads them, the back row first), each with 取り消す. The map as the island shows the field
  (row 0 at the bottom): a tap selects: 「トマト・あと2日・見込み2〜3個」 with 収穫 / 植える / 掘り起こす.
  「畑の外の株 N株」 with 苗に戻す; the others' fields a line each (the guest: 「畑の水やりを手伝えます」). While
  the pill shows, the catch plates (「×3・54かいがら」) stand over the bottom buttons' row.
- **The shop:** うる's 野菜 and 苗 (no 全部: held to plant); かう's 苗, the six starts, always in stock, first while my free
  plots want more than I hold (else after the stock, a 苗へ chip away).
