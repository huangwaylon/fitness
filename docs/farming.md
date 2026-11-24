# はたけ: the fields

NH 2.0's vegetables: a field each, 40 plants. Buy starts at the shop, plant, water, harvest; the plant grows back. Produce
sells for かいがら, never ベル. Code: `contract/farm.ts` (rules, shared by record and phones), `contract/wet.ts` (rain),
`model/farm.ts`, `layout/field.ts`, `store/farm.svelte.ts` (writes), `island/farm.ts` (scene), `world/farmTap.ts` (a
plot's tap), `world/farmPlan.ts`, `shop/Counter.svelte` (苗), `shop/pocket.ts`; tests `relay/test/farm.test.ts`,
`e2e/farm.spec.ts`.

## Balance
`FARM` in `contract/farm.ts`: a start costs 14 かいがら, a vegetable sells for 18 (NH ÷ 20); cap 40 plants a person
(`FARM.cap`); ripe the next Tokyo day and again the day after a harvest (`growDays`, `regrowDays` 1); yield 3 if watered
or rained on the day before ripening, else 1. A full field watered daily: 40 × 3 × 18 = 2,160 かいがら a day. Tune with
`regrowDays` and `cap`, never a price.

Binding: a field is a layout object (kind `field`, variant `a-10x4` = owner and size) placed only in /editor; only its
owner plants, harvests or digs; anyone (guest too) waters; rain waters everything; the can, planting and harvest reach
3 × 3; every action is a plot's tap (no buttons); starts always in stock; pumpkin colour is visual only; no fruit trees
(the goal trees' fruit means fitness).

## Rules (the record's)
- **`buy_starts`** `{crop, n, v}`: n 1–99, v = n × 14, covered by the wallet (else `wallet short`); starts go to the
  pocket as `goods:<crop>-start`.
- **`farm`** `{d, ops}`: the sender's Tokyo day (35 days back to tomorrow), 1–40 ops batched on the phone (2 s, 4 s for
  undoable ones): `{o: 'plant', p, c, src: 'start'|'crop'}` on an empty plot under the cap; `{o: 'harvest', p, n}` of
  one's own ripe plant (the record reckons the yield); `{o: 'dig', p}` (start back). Refused ops are dropped; none left:
  `farm refused`.
- **Plots** `fd:<fieldId>.<col>.<row>`; a plant stays its planter's. A plant off any field is kept, not drawn, counts
  toward the cap until the shop's 苗に戻す digs it (never automatic: phones would race).
- **Watering**: the island day's `watered` list; the record copies it to the plot (`farm_water`). Rule changes: relay first.
- **Rain**: the record writes one `wet` row a wet day from the room's weather cron (`real` mode: a wet hour in the
  timeline; `game` mode: `contract/wet.ts gameWet`). Phones never write it.
- **The pocket** folds tallies, harvests, digs, plants, buys and sells alike in the record's ledger and `model/shop.ts`.

## Playing
A plot's tap acts in place (`world/farmTap.ts`), over the tapped plot P and its 3 × 3, first match wins: harvest my ripe
plants; water plants that need it; plant my empty plots from the held crop (up to the cap, with 取り消す); else a word
over the plot (with ほる on my own growing plant: dig it up). The crop picker (`FarmPicker.svelte`) opens when the crop
is ambiguous. Empty plots of mine show a faint ＋ while I hold starts. A partner's watering plays on my island at once;
their plant or harvest on the next sync. The shop: うる's 野菜 and 苗, かう's 苗, 「畑の外の株」 with 苗に戻す.

## おねがい
A visitor wants a vegetable (`world/vegRequest.ts`, `island/vegAsk.svelte.ts`): the day's chat or cheer guest, Franklin on
Turkey Day; at most one ask a day per farmer, crop seeded by date and person, gone when the asker leaves. A tap with it in
the pocket is a `sell` of one at the shop price, plus sometimes a garden piece. Done is per phone (`scene-veg-ask`).
