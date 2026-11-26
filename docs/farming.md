# はたけ: the fields

NH 2.0's vegetables on fields everyone shares: anyone (A, B, the guest) plants, waters, harvests or digs any plot. Buy
starts at the shop, plant, water, harvest; the plant grows back. Produce sells for かいがら, never ベル. Code:
`contract/farm.ts` (rules, shared by record and phones), `contract/wet.ts` (rain), `model/farm.ts`, `layout/field.ts`,
`store/farm.svelte.ts` (writes), `island/farm.ts` (scene), `world/farmTap.ts` (a plot's tap), `world/farmPlan.ts`,
`shop/Counter.svelte` (苗), `shop/pocket.ts`; tests `relay/test/farm.test.ts`, `e2e/farm.spec.ts`.

## Balance
`FARM` in `contract/farm.ts`: a start costs 14 かいがら, a vegetable sells for 18 (NH ÷ 20); ripe 6 hours after
planting and again 6 hours after each harvest (`growMs`); yield 3 if watered while growing or it rained the day it
started or ripened, else 1. No cap: the fields' size is the limit. Tune with `growMs` or the fields, never a price.

Binding: a field is a layout object (kind `field`, variant `f-10x4` = size; an older `a-10x4`'s owner is ignored) placed
only in /editor; the can, planting and harvest reach 3 × 3; every action is a plot's tap (no buttons); starts always in
stock; pumpkin colour is visual only; no fruit trees (the goal trees' fruit means fitness).

## Rules (the record's)
- **`buy_starts`** `{crop, n, v}`: n 1–99, v = n × 14, covered by the wallet (else `wallet short`); starts go to the
  pocket as `goods:<crop>-start`.
- **`farm`** `{ops}` (an older build's `{d, ops}`: `d` dropped), 1–40 ops batched on the phone (2 s, 4 s for undoable
  ones): `plant {p, c, src: 'start'|'crop'}` on an empty plot, paid from the sender's pocket; `water {p}` on a growing,
  unwatered plant; `harvest {p, n}` of a ripe plant (the record reckons the yield, to the harvester); `dig {p}` (its
  start to the digger). Time is the row's `at`. Refused ops are dropped (logged `farm.refused`); none left: `farm <reason>` (`farm taken`, `farm seed`, …).
- **Plots** `fd:<fieldId>.<col>.<row>`, a plant `{c, t, r?, w?, by?}`: ripe-at ms, growing back, watered this growth,
  its last harvester. A plant off any field is kept, not drawn, until anyone's 苗に戻す (shop) digs it (never automatic:
  phones race); /editor asks before an edit leaves any (`farmPlan.ts plantsLeft`).
- **The stored field**: the record keeps the field folded (`fieldJson`); the phones show it plus their unsent rows. It
  reaches every phone: a snapshot's when it changed or isn't the `seq` the phone holds (`fseq`), and every farm ack's.
- **A refusal** (someone's plant there, my other phone's planting): the ack's field and pocket replace the phone's at
  once (else a fetch), and a word, はたけが かわってた (なえが もう なかった for a start gone), never the generic
  "try again"; the next tap acts on the record's field (`e2e/farm-record.spec.ts`).
- **Rain**: the record writes one `wet` row a wet day from the room's weather cron (`real` mode: a wet hour in the
  timeline; `game` mode: `contract/wet.ts gameWet`). Phones never write it.
- **The pocket** folds tallies, harvests, digs, plants, buys and sells alike in the record's ledger and `model/shop.ts`.

## Playing
A plot's tap acts in place (`world/farmTap.ts`), over the tapped plot P and its 3 × 3, first match wins: harvest ripe
plants (P first, then the nearest); on a plant, water the growing unwatered ones; on an empty plot, plant the held crop
(with 取り消す); else a word over the plant (its crop, its harvester while it grows back, time to ripe, watered or not: `aboutLine`) with ほる. The
crop picker (`FarmPicker.svelte`) opens when the crop is ambiguous. Empty plots show a faint ＋ while I hold starts. The
scene draws stages 0–2 by thirds of a growth and the ripe plant by its yield, wet soil while watered or on a wet day, and
redraws at the next stage change (one timer, never a poll). A partner's watering plays at once (one live `act` `water` a tap: drops, and
the 3 × 3 reads watered here until the synced field has their ops, `island/farmLive.svelte.ts`); their plants and
harvests come on the next sync. The shop: うる's 野菜 and 苗, かう's 苗 (a row's tap fills the free plots), 「畑の外の株」 with 苗に戻す.

## おねがい
A visitor wants a vegetable (`world/vegRequest.ts`, `island/vegAsk.svelte.ts`): the day's plaza visitor or chat or cheer
character, Franklin on Turkey Day, while the island has a field or my pocket a vegetable; at most one ask a day per
person, crop seeded by date and person, gone when the asker leaves. A tap with it in the pocket is a `sell` of one at the shop price, plus sometimes a
garden piece. Done is per phone (`scene-veg-ask`).
