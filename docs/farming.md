# はたけ: the fields

NH 2.0's vegetables on shared fields: anyone (A, B, the guest) plants, waters, harvests or digs any plot. Buy starts
at the shop, plant, water, harvest; the plant grows back. Produce sells for かいがら, never ベル. Code:
`contract/farm.ts` (rules, record and phones), `contract/wet.ts`, `model/farm.ts`, `layout/field.ts`,
`store/farm.svelte.ts`, `island/farm.ts`, `world/farmTap.ts`, `world/farmPlan.ts`, `shop/Counter.svelte`,
`shop/pocket.ts`; tests `relay/test/farm.test.ts`, `e2e/farm.spec.ts`.

## Balance
`FARM` (`contract/farm.ts`): a start 14 かいがら, a vegetable sells 18 (NH ÷ 20); ripe 6 h after planting or a harvest
(`growMs`); yield 3 if watered or it rained the day it started or ripened, else 1. No cap; tune `growMs` or the
fields, never a price. A field is a layout object (kind `field`, variant `f-10x4` = size; an old owner is ignored),
placed only in /editor. Reach 3 × 3; starts always in stock; pumpkin colour is visual only; no fruit trees.

## Rules (the record's)
- **`buy_starts`** `{crop, n, v}`: n 1–99, v = n × 14 from the wallet (else `wallet short`); into the pocket as
  `goods:<crop>-start`.
- **`farm`** `{ops}` (old `{d, ops}`: `d` dropped), 1–40 ops batched (2 s, 4 s if undoable): `plant {p, c, src:
  'start'|'crop'}` on an empty plot from the sender's pocket; `water {p}` a growing unwatered plant; `harvest {p, n}` a
  ripe one (the record reckons the yield); `dig {p}` (its start to the digger). Time = the row's `at`. Refused ops
  drop (`farm.refused`); none left: `farm <reason>`.
- **Plots** `fd:<fieldId>.<col>.<row>`, a plant `{c, t, r?, w?, by?}` (ripe-at, growing back, watered, last
  harvester). A plant off every field is kept, undrawn, until someone's 苗に戻す (shop) digs it; /editor asks before an
  edit leaves any (`farmPlan.ts plantsLeft`).
- **The stored field** is folded on the record (`fieldJson`); phones show it plus unsent rows; sent in a snapshot when
  its `fseq` changed and in every farm ack.
- **A refusal** replaces the phone's field and pocket from the ack and says はたけが かわってた (or なえが もう なかった);
  the next tap acts on the record's field (`e2e/farm-record.spec.ts`).
- **Rain**: one `wet` row a wet day, written by the record from the weather cron (`real`: a wet hour; `game`:
  `gameWet`). Phones never write it.
- **The pocket** folds tallies, harvests, digs, plants, buys and sells in the record's ledger and `model/shop.ts`.

## Playing
A plot's tap acts in place (`world/farmTap.ts`) over P and its 3 × 3, first match: harvest ripe plants (P first);
water growing unwatered ones; plant the held crop on an empty plot (取り消す); else a word over the plant (crop, last
harvester, time to ripe, watered: `aboutLine`) with ほる. `FarmPicker.svelte` opens when the crop is ambiguous; empty
plots show ＋ while I hold starts. Stages 0–2 by thirds of a growth, the ripe plant by yield, wet soil while watered;
one timer to the next stage. A partner's watering shows at once (live `act` `water`, `island/farmLive.svelte.ts`);
their plants and harvests on the next sync. Shop: うる 野菜 / 苗, かう 苗 (fills free plots), 「畑の外の株」 with 苗に戻す.

## おねがい
A visitor wants a vegetable (`world/vegRequest.ts`, `island/vegAsk.svelte.ts`): the day's plaza, chat or cheer
character (Franklin on Turkey Day) while there is a field or a vegetable in my pocket; one ask a day per person, crop
seeded by date and person. A tap with it in the pocket sells one at the shop price, sometimes plus a garden piece.
Done is per phone (`scene-veg-ask`).
