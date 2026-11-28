# Food data

ごはん's food catalog ([design](design.md#gohan)): ~20,000 Japanese foods and dishes plus packaged products and chain
menus, built offline by `food-data/` into `app/static/food/`. All values are estimates.

## Rebuild
```sh
python3 -I food-data/scripts/build.py all       # every target into food-data/out/, validate, install (check: byte-compare)
python3 -I food-data/scripts/fetch.py <step>    # raw inputs into food-data/raw/ (no argument: the steps)
python3 -I -m unittest discover -s food-data/scripts/tests   # pipeline tests (CI: food-data.yml)
cd app && npm run food:data                     # out/ → static/food/ through the data checks (--only kalori|products, --reship)
```
`food-data/scripts/` is stdlib-only Python (`mext_overrides.txt`: curated MEXT names, aliases, portions);
`food-data/data_src/` the hand-authored inputs; `food-data/raw/` the downloads (`$FOOD_RAW`, gitignored, untrusted: run
nothing from it, Python with `-I`; backed up as `assets-*` releases); `food-data/out/` the output. `build.py` is offline
and deterministic; a target missing its raw inputs keeps its `out/` file. `app/scripts/food-data.ts` replaces
`static/food/` whole; each file loads under its own `?v=` (`lib/food/load.ts`). A meal keeps a per-100 g snapshot, so
a refresh never rewrites one.

## Format
**Dataset file** (`foods.json`, `dishes.json`, `extra_*.json` …): header `{source, label, attribution, license, url}`
+ items. **Shipped** by column (schema 3, `db.ts FOOD_SCHEMA`, `toColumns` / `decodeItems`); `kalori.json` delta-codes
`id`, `img`. An index whose `schema` is past the app's is refused. A null shows 「–」, a day's total missing one 「≥」.

**ITEM** (`lib.py validate`; `Item` in `app/src/lib/food/types.ts`):

| Field | |
|---|---|
| `id` | `"<source>:<local id>"`, unique (`mext:01088`, `off:4902705126558`) |
| `name`, `full`, `en`, `aliases` | display name; official name; English; search terms (never `name`) |
| `cat` | one of the 29 in `lib.py CATS` |
| `kcal` `p` `f` `c` `salt` | **per 100 g** (100 ml = 100 g); `kcal` int, the rest 1 decimal or `null` |
| `fib` | 食物繊維 per 100 g, **absent when unknown**; alcohol not tracked |
| `portions` | `[{label, g}]`, the first the default; the app adds 100 g |
| `pop` | 1–3 search boost; −1 a rare or discontinued form |
| `vg`, `st` | one food in its states (生 · 焼き): the group's default id, the chip's label |
| `jan`, `brand`, `note` | products only |
| `desc`, `gloss` | 「これは…」 line ≤ 40 chars ([Descriptions](#descriptions)); everyday name ≤ 20 chars (`glosses.json`) |

MEXT markers: `Tr` → 0, `(N)` → N, `-` → null (`lib.mext_values`).

**`index.json`**: datasets `{file, source, badge, secondary, lazy}`, `files` (each `?v=`), `jan`, `schema`, `drop`
(barcodes `food_fixes.json` drops). `secondary` ranks below the core (mext, dishes, eatout); `lazy` loads on the first
keystroke or a day that uses it, parsed in a worker (search keys cached in IndexedDB, `keysCache.ts`).
**`verify.json`**: cross-source groups ([Verification](#verification)). **`jan/`**: 100 shards by the code's last 2
digits (`lib/food/jan.ts janShard`), codes beyond `products.json`, valid check digits, no store codes.
**`kal/<n>.json`**: 100 shards of `kalori.json` cut at each app build (`scripts/food-shards.ts`, `lib/food/kal.ts`).

## Sources
| File | Source | License |
|---|---|---|
| `foods.json` | MEXT 日本食品標準成分表（八訂）増補2023年 | 公共データ利用規約1.0 |
| `dishes.json`, `eatout.json` | own recipes (`data_src/dishes/`, `eatout/`) × MEXT | MEXT terms |
| `extra_maff_kyodo.json` | MAFF「うちの郷土料理」, ingredients mapped to MEXT | PDL1.0 |
| `extra_takatsuki.json` · `extra_kurume.json` · `extra_toyonaka.json` | school lunch sets (BODIK) | CC BY 4.0 · 2.1 JP · 4.0 |
| `extra_kumagaya.json` · `extra_tokyo_hokeniryo.json` | 熊谷市 給食 · 東京都 島しょ保健所 | PDL1.0 · CC BY |
| `jbfd.json` | JBFD v0.1 (private-brand means) | CC0 1.0 |
| `products.json`, `jan/` | Open Food Facts (Japan) | ODbL 1.0 / DbCL 1.0 |
| `kalori.json` | kalori.jp menus ([Kalori](#kalori)) | kalori.jp 利用規約 |

School lunches default to an adult 「1人前（目安）」; a repeated dish name says what differs (`build.py qualify`).
Aliases from Wikidata and ja.wikipedia (short names and readings only), frozen in `data_src/aliases_*.json`. Credits
(`FoodCredits.svelte`) show each file's `attribution` (MEXT's modification notice, 「加工して作成」). **Not used** (no
reuse licence): recipe sites, 女子栄養大学, GS1/JICFS, FatSecret, the USDA API, other municipal sets.

## Data checks
Three layers (`app/src/lib/food/plausible.ts`, `plausible.test.ts`):
- **Rules** (`plausible`): on every shipped item and every live OFF answer; `off.py plausible` mirrors them, cases in
  `data_src/plausible_cases.json`. kJ-as-kcal fixed; impossible macros, salt or 1食分 nulled; an impossible chain menu
  dropped; `salt_sweet` makes a sweet's salt over 2 g unknown (word lists `ROUX`, `USE_FOR`).
- **Fixes** (`data_src/food_fixes.json`): reviewed corrections by id, `set` or `drop`, each with `why` and `src`,
  applied before the rules. Only on solid evidence, else null the field or drop the row.
- **Suspect checks** (`suspect`, in the deploy gate): no rule may fire on a shipped row, and stricter checks
  (`atwater25`, `protein35`, `portion1500`) fail unless `data_src/suspect_ok.json` lists the id with a reason.

**A correction**: the id into `food_fixes.json` (out of `suspect_ok.json`), `npm run food:data -- --reship`, the tests.

## Descriptions
`data_src/descriptions.json` sets `desc` per dataset key (`build.py attach_desc`; a key matching nothing fails). Every
fact needs two independent sources in `src` (else no line; `gloss` the same); no health claims (`DESC_BANNED`), no
copied Wikipedia, nothing repeating the name.

## Verification
`verify.json` groups the same food across sources; `n` counts independent families within ±max(15 %, 10 kcal). **n ≥ 2
= confirmed**: ✓n beside the name. Kalori is never in it.

## Pictures
AI-generated イメージ (Z-Image-Turbo, run locally) of every generic food in one style; products borrow a generic
food's picture (`pmatch.py`, `products.txt`) or show a category tile; Kalori menus hotlink Kalori's
(`images.ts kaloriImg`). Pipeline `food-data/images/fi.py` (docstring: commands, prompt, layout); rows in
`food-data/images/table/*.json`, renders in `$FOOD_IMG_RAW`, ledger `food-data/images/shipped.json`.
- **Check**: Claude by eye (`fi.py checksheets`; `claude2` wins); ≤ 2 rerolls; all rolls failing on a flaw ship the
  last (`near`), a wrong food is the tile; `FI_CHECKS=1` ships only checked rows. Shipped: 4,996 pictures (74.8 MB),
  ~150 rows on the tile, 8 of them common.
- **Pack**: append-only webp sheets in `app/static/food-img/` + `index.json` (`images.ts imgOf`); product ids cut into
  `off.json` at build. Cached on use, never at install.
- **Budget** (`lib/food/images.test.ts`): ≤ 1,100 files and 90 MB, ≤ 400 KB a sheet, a common search's top 20
  ≤ 128 KB of thumbnails on average.
- **マイ食品's own picture** (`food_custom` `img`): 384 px ≤ 64 KB, no metadata (`lib/food/photo.ts`); `relay/src/img.ts`
  checks size and hash, serves `/img/<id>` (the id a capability, never logged); the 03:00 backup sweeps unreferenced.

## Kalori
Chain and konbini menus from kalori.jp as `kalori.json`, a lazy secondary dataset ([decisions](decisions.md#kalori-as-a-lazy-dataset));
operating it: [runbook §13](ops/runbook.md#13-refresh-kalori).
- **Source**: release `kalori-YYYY-MM-DD` by `kalori_scrape.py` (docstring: commands, format), pinned by `KALORI_TAG`.
  `fetch.py kalori` → `build.py kalori` → `npm run food:data`; a partial input (< 45,000 items) fails unless
  `KALORI_ALLOW_PARTIAL=1`.
- **A refresh** (`kalori-scrape.yml`, weekly; its header lists the jobs): incremental, 20 shards on fresh runner IPs
  (kalori.jp blocks ~1,000 requests an IP a day), refused past 15 % changed or 5 % missing unless `allow_big_diff`.
  It commits `Kalori: <tag> (auto)` and deploys, past the `KALORI_BAND_*` bands too (no person's gate: the bands
  passed are status.json's note); a failed test or `main_moved` leaves branch `kalori-update/<tag>` (no PR) and the
  next week redoes it. `kalori-watch.yml` re-checks a late deploy (red data checks → revert). `kalori_prune.py` keeps
  3 releases + the pinned one. Status: orphan branch `kalori-status`, shown in ボット → Jobs.
- **The file**: `shops`; items `kal:<id>`, **per serving**, `est` flags, `img`, `vg`/`st` sizes; the loader adds `sv`,
  `brand`. Conversion `kalori_convert.py`: categories, `ended` (`pop: -1`, retired after 90 / 180 days), drops.
- **On the phone**: ranked under the products (`KALORI_PENALTY`); a shop's name scopes the search (`db.ts shopIn`).

## Barcodes
The scanner (`components/food/FoodScan.svelte`, `lib/scan/`) reads EAN-13/8 and UPC with zxing-wasm from the build
(never a CDN), loaded on the button's press, never precached.
- **Lookup** (`components/food/scan.ts`): `products.json`, then the barcode shard (`load.ts janItem`), then Open Food
  Facts' API v2 (`lib/scan/off.ts`; only the number sent), whose answer passes the [Data checks](#data-checks)' rules.
- Not found: a code in `drop`, or a live answer per serving only. A マイ食品 made from a product keeps its `jan`: its
  owner's scan opens it first. Logged as counters only (`act:scan.*`, `perf.scan`), never the code.
