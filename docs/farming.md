# はたけ: the fields

NH 2.0's vegetables: a field each, 40 plants. Buy starts at the shop, plant, water, harvest; the plant grows back.
The produce sells for かいがら, never ベル. Code: `contract/farm.ts` (the rules, shared by the record and the phones), `contract/wet.ts` (rain),
`model/farm.ts`, `layout/field.ts`, `store/farm.svelte.ts` (the writes, the pick), `island/farm.ts` (the scene),
`world/farmTap.ts` (a plot's tap), `farmUi.svelte.ts`, `harvestPlate.ts`, `FarmPicker`, `FarmPop` (.svelte),
`world/farmPlan.ts` (free plots, stranded plants), `shop/Counter.svelte` (苗), `shop/pocket.ts` (うる's 野菜 and 苗),
`shop/stock.ts`, `world3d/objects.ts` (drawn); tests beside them, `relay/test/farm.test.ts`, `e2e/farm.spec.ts`.

## Decisions

1. **A field each.** A field is a layout object (kind `field`, `layout/field.ts`): its owner and size are its variant
   (`a-10x4`: ウェイ's, 10 tiles across and 4 deep). Placed, resized and owned in /editor only (its 野菜 → 畑 tab). Our island has a 10 × 4 field each
   for ウェイ and うめ on the lawn behind the shop; the default island (`default.json`) has none, so a layout reset drops
   them. The guest has none unless the editor gives one.
2. **Only the owner plants, harvests or digs** on a field; anyone waters anything (NH's visitors), the guest too.
3. **At most 40 plants each** (`FARM.cap`), whatever the field's size.
4. **Prices: NH ÷ 20,** as every shop price: a start costs 14 (280 Bells) and sells back for 4, a vegetable sells for
   18 (350). Balance comes from cadence, never the price.
5. **Cadence: a day** (2026-11-14; NH's was 3): planted today (stage 0), ripe from 00:00 Tokyo tomorrow; harvested, the
   plant grows back from stage 2 and is ripe again the next day (`FARM.growDays`, `FARM.regrowDays`). It yields 3 if
   watered (or rained on) the day before it ripens, the plant day or the harvest day, else 1 (NH's Lv3 and Lv1 models).
6. **Rain waters everything:** any wet hour of the Tokyo day (our winter snow is real rain) waters every plant.
7. **The can waters 3 × 3** the plants whose watering counts today (NH's golden can); planting and harvesting reach
   3 × 3 too: about 8 taps a full field. Effort, not balance (the same cadence and cap; you come daily).
   No button or menu: every farm action is a plot's tap (2026-11-14).
8. **Starts are sold at the shop's かう,** always in stock, all six crops at one price, any season. A vegetable can be
   planted too (buying a start, 14, beats replanting a vegetable worth 18, as in NH).
9. **Pumpkins ripen orange, yellow, white or green** (8:5:4:3, seeded by plot and ripe day, the same on both phones;
   visual only, the item is カボチャ).
10. **Not in P1:** a live relay intent for a partner's plant or harvest, flowers from seed, the editor's paint brush.
    No fruit trees (the goal trees' fruit means fitness).

## Balance

Per person, a full field watered daily: 40 plants × 3 vegetables × 18 かいがら = **2,160 かいがら a day**, for about 8
taps each of the can and the harvest. Unwatered it's 720 a day, watered twice a week ≈ 1,130. Tokyo has ~110 wet days a
year, which water for you. Setup: 40 starts cost 560, paid back by the first harvest.

For scale: a sea catch is worth ~60–100 (~150–250 a minute, uncapped), a 15-minute session ~2,000–3,000, the median
piece of furniture 190. A full field daily is worth about one fishing session (the user accepted ~3× NH's cadence's
income, 2026-11-14). The levers, if the live numbers drift (`npm run logs`, the sells): `FARM.regrowDays` and
`FARM.cap`, never a price.

## Rules (the record's)

- **`buy_starts`** `{crop, n, v}`: n 1–99, v exactly n × 14, covered by the sender's かいがら (else `wallet short`).
  The starts count into the pocket as `goods:<crop>-start`.
- **`farm`** `{d, ops}`: the sender's Tokyo day (yesterday to tomorrow), 1–40 ops, held 2 s on the phone for the next
  tap (a 3 × 3 planted and a dig 5 s, for 取り消す) and sent as one:
  - `{o: 'plant', p, c, src}` on an empty plot, under the cap, with a start (`src: 'start'`) or a vegetable (`'crop'`)
    in the pocket;
  - `{o: 'harvest', p, n}` of one's own plant, ripe on `d`: kept at the yield the record reckons, whatever `n` says;
  - `{o: 'dig', p}` of one's own plant: its start back.
  A refused op is dropped and the rest kept; none left: `farm refused`. The phone then shows the row as kept (a plant
  the partner got to first is gone and its start back).
- **The plot** is `fd:<fieldId>.<col>.<row>`. The record keeps a plant its planter's; whose field a plot is, the phones
  decide (the layout is theirs). A plant on a tile a field no longer covers is kept, not drawn, and counts toward the cap
  until the shop's 苗に戻す digs it (never automatically: both phones would race).
- **Watering** is the island day's `watered` list (the flowers' own), now up to 160 ids. It counts on the day
  before ripe (`wateringCounts`): the plant day, or the harvest day it grows back from. A rule change deploys the relay first, then the app.
- **Rain:** the record writes one `wet` row a wet day itself, from the room's weather cron: in the `real` mode a Tokyo
  day the timeline had a wet hour of, in the `game` mode the seeded wet day (`contract/wet.ts gameWet`, the island's
  seeded weather's own draw). A phone never writes one.
- **The pocket:** a person's tallies, plus what the fields put in (harvests, dug-up starts) and less what they took
  (plants), plus the starts bought, less what was sold. The record's running ledger and `model/shop.ts` fold it alike.

## Playing

- **A plot's tap** acts in place (`world/farmTap.ts`); P the tapped plot, its 3 × 3 the reach, in this order:
  1. P my ripe plant, or my plant picked today with ripe ones near: all my ripe plants there harvested, P first;
  2. P a plant (anyone's) or another's empty plot: the plants whose watering counts and isn't done watered;
  3. my ripe plants there harvested (a miss forgiven);
  4. P my empty plot (never the can): at the cap 「もう 40かぶ うえてる」; else my empty plots there planted, P first,
     then the nearest, up to what I hold and the cap, with 取り消す (「トマトを 9かぶ うえた（31/40）」);
  5. a word (「ニンジン・あした 3こ」, 「うめが みずを やってくれた」), with ほる (the quiet cream button) on my own plant.

  Planting says it once, on the 取り消す banner in world kana; a watering's word says what it earns
  (「みずやり・あした 3こ」); the shop's 苗 has the rule in one line (rain and anyone's watering count).

  So on a mixed 3 × 3 a tap on my empty plot harvests first, the next plants. A harvest is one pop a tap (a semitone up
  a tap in a row), a sparkle a plant, one plate per crop counting up.
- **The crop** (rule 4, decision 8): the picker's pick, kept for the planting run (each plant within 60 s of the last;
  取り消す ends it); else the one kind I hold if it's a start; a vegetable, two kinds or the run's crop gone (「…が もう
  ない」): the picker; nothing, 「なえが ない」. The picker (bottom
  left, the last pick first) shows starts (a seedling badge) and vegetables with counts; its pick runs the tap again
  with that crop. A tap on another plot while it's open re-targets it.
- **The word** pops over the plot for 1.2 s (「みずやり ずみ」), never in my villager's balloon.
- **ほる** digs my own growing plant up (its start back, 取り消す): a 44 pt button raised over its word, 3 s, held while
  touched. Up to 3 taps reach it, each useful: harvest, water, then the word. A ripe plant is harvested first.
- **Watered soil** stays dark for the day; a ripe plant shows its yield's model. Their plant or harvest shows on their
  next sync. **Who watered:** the partner's or guest's watering plays on my island at once (their villager turns,
  drops, a heart over mine).
- **The shop:** うる's 野菜 and 苗 (no 全部: held to plant); かう's 苗, the six starts, always in stock, first while my free
  plots want more than I hold (else after the stock, a 苗へ chip away); 「畑の外の株 N株」 with 苗に戻す (取り消す).

## おねがい

A visitor wants a vegetable (`world/vegRequest.ts`, `vegAsk.svelte.ts`, `Visitor.svelte`): the day's chat or cheer guest
(about every other day), Franklin on Turkey Day instead. At most one ask a day per farmer, its crop seeded by the date
and the person (any of the six: a reason to grow a mix); gone when the asker leaves, no timer. Now and then a caption
over their head, 「ニンジンが たべたいなあ」. A tap with it in my pocket hands it over in place: a `sell` of the one at
its price (no new rule: the かいがら rate is the shop's), their joy, hearts, and one ask in 3 (Franklin's always) a garden
piece, a find. Without it, a kind word. Done is this phone's (`scene-veg-ask`).
