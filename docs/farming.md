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
   stage 2 and is ripe again 3 days on (`FARM.regrowDays`). It yields 1, plus 1 for each of the three days before it
   ripens that it was watered, at most 3 (1, 2 or 3: NH's Lv1–3 models); the plant day and the harvest day count.
6. **Rain waters everything:** any wet hour of the Tokyo day (our winter snow is real rain) waters every plant.
7. **The can waters 3 × 3** the plants whose watering counts today (NH's golden can). The 畑 sheet's 水やり
   waters every plant whose watering counts today: effort, not balance (the same cadence and cap; you still come daily).
8. **Starts are sold at the shop's かう,** always in stock, all six crops at one price, any season. A vegetable can be
   planted too (buying a start, 14, beats replanting a vegetable worth 18, as in NH).
9. **Pumpkins ripen orange, yellow, white or green** (8:5:4:3, seeded by plot and ripe day, the same on both phones;
   visual only, the item is カボチャ).
10. **Not in P1:** a live relay intent for a partner's plant or harvest, flowers from seed, the editor's paint brush.
    No fruit trees (the goal trees' fruit means fitness).

## Balance

Per person, a full field watered on 2 of its 3 days: 40 plants × 3 vegetables × 18 かいがら ÷ 3 days ≈ **720 かいがら a
day**, for a few taps (the sheet's 水やり and 収穫). Unwatered it's 240 a day, on one day's watering 480, watered
twice a week ≈ 390. Tokyo has ~110 wet days a year, which water for you. Setup: 40 starts cost 560, paid back by the
first harvest.

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
- **Watering** is the island day's `watered` list (the flowers' own), now up to 160 ids. It counts on the 3 days
  before ripe (`wateringCounts`). A rule change deploys the relay first, then the app.
- **Rain:** the record writes one `wet` row a wet day itself, from the room's weather cron: in the `real` mode a Tokyo
  day the timeline had a wet hour of, in the `game` mode the seeded wet day (`contract/wet.ts gameWet`, the island's
  seeded weather's own draw). A phone never writes one.
- **The pocket:** a person's tallies, plus what the fields put in (harvests, dug-up starts) and less what they took
  (plants), plus the starts bought, less what was sold. The record's running ledger and `model/shop.ts` fold it alike.

## Playing

- **The はたけ pill** (bottom left) opens the 畑 sheet; badges: the held crop (top left) and my
  ripe count (yuzu). Shown while I have a plot or any field has a plant; hidden with the say button.
- **A plot's tap** acts in place (`island/farmTap.ts`); the tapped plot decides, its 3 × 3 is the reach:
  1. my ripe plant: all my ripe plants there are harvested, it first, then the nearest;
  2. any plant, or an empty plot not mine: the plants whose watering counts and isn't done are watered;
  3. else my ripe plants there are harvested (a miss forgiven);
  4. my empty plot: the held crop (at the cap 「もう 40かぶ うえてる」; none held: the picker);
  5. else a word (「うめが みずを やってくれた」 when someone else watered it). No digging in the world.

  A harvest is one pop a tap (a semitone up a tap in a row), a sparkle a plant, one plate per crop counting up.
- **The word** pops over the plot for 1.2 s (「トマトを うえた」, 「みずやり ずみ」), never in my villager's balloon.
- **The picker:** the starts (a seedling badge) and vegetables I hold, with counts; kept on this phone.
  The held-crop badge is its own 44 px button: a tap opens the picker in place, its pick only changes what I hold.
- **Watered soil** stays dark for the day; a ripe plant shows its yield's model. Their plant or harvest shows on their
  next sync. **Who watered:** the partner's or guest's watering plays on my island at once (their villager
  turns, drops, a heart over mine); the sheet notes 「今日はうめが水やりしてくれました（4株）」.
- **The 畑 sheet:** today's harvest and its かいがら (else 「明日収穫できる 9株」, 「次の収穫まであと2日」), 「12/40株」;
  実ったものを収穫 (one event, its banner naming the crops, three then ほか, and their かいがら; 収穫済み till the
  sheet closes), 水やり (every plant whose watering counts, not watered today: one
  shared-day change, to the relay 15 a second; else 水やり済み, or 「収穫のあとで水やりできます」 all ripe), 植える
  with a crop I hold (the pick, else my first start; a vegetable only once picked; my empty plots as the map reads
  them, the back row first), each with 取り消す. Its close plays ≤ 8 sparkles on the island over the plots harvested
  (else drops over those watered; an undone 収穫, none). The map as the island shows the field
  (row 0 at the bottom): a tap selects: 「トマト・あと2日・見込み2〜3個」 with 収穫 / 植える / 掘り起こす.
  「畑の外の株 N株」 with 苗に戻す; the others' fields a line each (the guest: 「畑の水やりを手伝えます」). While
  the pill shows, the catch plates (「×3・54かいがら」) stand over the bottom buttons' row.
- **The shop:** うる's 野菜 and 苗 (no 全部: held to plant); かう's 苗, the six starts, always in stock, first while my free
  plots want more than I hold (else after the stock, a 苗へ chip away).

## おねがい

A visitor wants a vegetable (`island/vegRequest.ts`, `vegAsk.svelte.ts`, `Visitor.svelte`): the day's chat or cheer guest
(about every other day), Franklin on Turkey Day instead. At most one ask a day per farmer, its crop seeded by the date
and the person (any of the six: a reason to grow a mix); gone when the asker leaves, no timer. Now and then a caption
over their head, 「ニンジンが たべたいなあ」. A tap with it in my pocket hands it over in place: a `sell` of the one at
its price (no new rule: the かいがら rate is the shop's), their joy, hearts, and one ask in 3 (Franklin's always) a garden
piece, a find. Without it, a kind word. Done is this phone's (`scene-veg-ask`).
