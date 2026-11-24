# Food data

The meal log's food catalog (ごはん, [design](design.md#gohan)): about 20,000 Japanese foods and dishes plus packaged
products and chain menus, built offline by `food-data/` and shipped in `app/static/food/`. All values are estimates.

## Rebuild
```sh
python3 -I food-data/scripts/build.py all       # rebuild every target into food-data/out/, validate, install
python3 -I food-data/scripts/build.py check     # rebuild into a temp dir and byte-compare with out/
python3 -I food-data/scripts/build.py toyonaka  # one or more targets (build.py's docstring lists them)
python3 -I food-data/scripts/fetch.py <step>    # raw inputs into food-data/raw/ (no argument: the steps)
python3 -I -m unittest discover -s food-data/scripts/tests   # pipeline tests (CI: food-data.yml)
cd app && npm run food:data                     # copy out/ into static/food/ through the data checks
cd app && npm run food:data -- --only kalori    # ship one file (kalori|products) into the committed static/food/
cd app && npm run food:data -- --reship         # static/food/ through the checks again from itself (a new fix)
```
`food-data/scripts/` holds the stdlib-only Python (3.9+; `mext_overrides.txt` the curated MEXT names, aliases,
portions), `food-data/data_src/` the hand-authored inputs, `food-data/raw/` the raw downloads (`$FOOD_RAW`;
gitignored, third-party licences, untrusted: run nothing from it, Python with `-I`), `food-data/out/` the gitignored
output. `build.py` is offline and deterministic, so `check` is byte-exact; a target whose raw inputs are missing keeps
its `out/` file. The MEXT Excel and 熊谷市 CSVs are fetched by hand (URLs in `fetch.py`).
The raw inputs are backed up as `assets-*` releases (`app/scripts/assets-release.sh`).

`app/scripts/food-data.ts` (its header has the checks) replaces `app/static/food/` whole. The app fetches each file
(`lib/food/load.ts`) under its own `?v=`. A meal keeps a per-100 g snapshot, so a refresh never rewrites one.

## Format

**Dataset file** (`foods.json`, `dishes.json`, `extra_*.json`, ...): `{ "source", "label", "attribution", "license",
"url", "items": [ITEM, ...] }` (OFF adds `dumped`, Kalori `shops`). **Shipped** (schema 3, `db.ts FOOD_SCHEMA`) every
dataset is by column: the header, `"idPrefix": "<source>:"`, `"cols": {field: [value per item]}` (`db.ts toColumns`,
`decodeItems`); `null` only in `p f c salt` (unknown); `kalori.json` has `"delta": ["id", "img"]` (each the difference
from the one before: `db.ts deltaCode`). An index whose `schema` is past the app's is refused (`load.ts`: asks for the
deployed build). The service worker's food cache is `island-food-v2`. A null value shows 「–」, a day's total missing one
「≥」.

**ITEM** (`lib.py` `validate`; `Item` in `app/src/lib/food/types.ts`):

| Field | |
|---|---|
| `id` | `"<source>:<local id>"`, unique across all files (`mext:01088`, `off:4902705126558`) |
| `name` | short Japanese display name; `full` official name, `en` (optional) |
| `aliases` | optional search terms; never equal to `name` |
| `cat` | one of 主食 麺 丼・定食 主菜 副菜 汁物 寿司 パン 肉 魚介 卵 大豆・豆 野菜 果物 きのこ 海藻 乳製品 菓子・デザート 飲料 酒 調味料 油脂 ナッツ・種 いも コンビニ 外食 その他 |
| `kcal` `p` `f` `c` `salt` | **per 100 g** (100 ml counts as 100 g); `kcal` int, the rest 1 decimal or `null`; `c` total carbohydrate, `salt` 食塩相当量 |
| `fib` | optional 食物繊維総量 per 100 g, **absent when unknown**. Alcohol is not tracked |
| `portions` | optional `[{label, g}]`, the first the default; the app adds 100 g |
| `pop` | optional 1-3 search boost; -1 ranks a rare or discontinued form lower |
| `vg`, `st` | one food in its states (豚ロース 生 · 焼き): `vg` the group's default id, `st` the chip's label |
| `jan`, `brand`, `note` | packaged products only; how the value was derived (shown) |
| `desc` | optional 「これは…」 line (≤ 40 characters, no final 。): [Descriptions](#descriptions) |
| `gloss` | optional everyday name under the food's own (≤ 20 characters: リーキ → 西洋ねぎ), `data_src/glosses.json` |

MEXT markers: `Tr`/`(Tr)` → 0, `(N)` → N, `-` → null (absent for `fib`; a known-zero fibre is 0: `lib.mext_values`).
kcal is MEXT's energy as given. Recipe datasets don't ship their ingredient lists.

**`index.json`**: `{ "version", "datasets": [{ "file", "source", "badge", "secondary", "lazy" }], "files", "jan",
"schema", "drop", "at" }`. `files` each file's `?v=` (a hash of its bytes), `version` over all, `at` when it first
shipped, `drop` the barcodes `food_fixes.json` drops. `secondary` sets rank below the core (mext, dishes, eatout);
`lazy` ones load on the first keystroke or a day with one logged (`db.wantMore`, then `db.onAdd`), parsed in a worker
that builds the search keys (`search.ts keysOf`; the core's cached in IndexedDB `island-food-keys`, `keysCache.ts`).

**`verify.json`**: `{ "sources": {src: credit}, "groups": [{ "n", "kcal": {src: kcal} }], "byId": {id: group} }`.

**`jan/`**: in `out/` `jan/<last 3 digits>.json` `{ "<jan>": ITEM }`; shipped regrouped into 100 shards by the last 2
(`lib/food/jan.ts` `janShard`), by column, only codes beyond `products.json`, no store codes (GS1 02, 20-29), under
index.json's `jan` version. Keys are JAN/EAN-13 or JAN-8 with a valid check digit (`lib.py` `norm_jan`).

**`kal/<n>.json`**: 100 id-ordered shards of `kalori.json` made at each app build (`scripts/food-shards.ts`,
`lib/food/kal.ts`; never committed); a day's chain menu loads its shard (`db.wantIds`), not the whole file.

## Sources

| File | Source | License | Derivation |
|---|---|---|---|
| `foods.json` | MEXT 日本食品標準成分表（八訂）増補2023年 | 公共データ利用規約1.0 | Official values; names, aliases, portions ours |
| `dishes.json`, `eatout.json` | Own recipes × MEXT | MEXT terms | `data_src/dishes/`, `data_src/eatout/`: MEXT numbers + grams |
| `extra_maff_kyodo.json` | MAFF「うちの郷土料理」 | PDL1.0 (+ MEXT) | Ingredient text mapped to MEXT (`maff_ingredients.py`) |
| `extra_takatsuki.json` | 高槻市 学校給食レシピ (BODIK) | CC BY 4.0 (+ MEXT) | Same mapper |
| `extra_kurume.json` | 久留米市 料理の栄養価一覧 (BODIK) | CC BY 2.1 JP | Per-serving values ÷ ingredient weight (成分表2010 energy) |
| `extra_toyonaka.json` | 豊中市 小中学校給食献立 (BODIK) | CC BY 4.0 | MEXT 食品番号 rows summed per dish, cooking water via 表12 |
| `extra_kumagaya.json` | 熊谷市 学校給食献立情報 | PDL1.0 | As Toyonaka |
| `extra_tokyo_hokeniryo.json` | 東京都 島しょ保健所 recipes | CC BY | Per-serving values ÷ estimated weight |
| `jbfd.json` | JBFD v0.1 (Nakagawa & Yamamoto, RinCOM) | CC0 1.0 | Private-brand label means for types MEXT lacks |
| `products.json`, `jan/` | Open Food Facts (Japan) | ODbL 1.0 / DbCL 1.0 | Label values through `off.py` `plausible` |
| `kalori.json` | kalori.jp menus | kalori.jp 利用規約 | Per serving ([Kalori](#kalori)) |

School lunches default to an adult 「1人前（目安）」 (`build.py`), except a side-sized noodle or rice dish (under 250 kcal
scaled: their school serving). A repeated dish name says what differs (`build.py`
`qualify`: エビマヨ（お店）). Aliases: Wikidata (CC0) and ja.wikipedia (CC BY-SA, short names and readings only), frozen
in `data_src/aliases_*.json`, plus `mext_names.py` rules.

**Licensing**: the credits (データの出典, `components/food/FoodCredits.svelte`) show each dataset's header and
`verify.json`'s sources as built: each file's `attribution` carries its obligation (MEXT's citation and modification
notice, 「加工して作成」 for PDL/CC BY). `products.json` and `jan/` are offered under ODbL 1.0. Kalori's pictures are
hotlinked, never copied.

**Not used** (no reuse licence or no per-dish data): recipe sites, 女子栄養大学, GS1/JICFS, FatSecret, the USDA API,
NIBN 重量目安表, スマートミール, other municipal sets.

## Data checks
What ships passes three layers (`app/src/lib/food/plausible.ts`, tests `plausible.test.ts`):
- **Rules** (`plausible`): at ship time in `food-data.ts` on every item of every file (counts printed) and on a live
  OFF answer; `off.py plausible` mirrors them for builds, and `data_src/plausible_cases.json` holds cases both test.
  kJ typed as kcal fixed; impossible macros, salt or 1食分 nulled; an impossible chain menu dropped. `salt_sweet`: a
  product named as a sweet or sweet drink (no salty, savoury or protein word) with salt over 2 g/100 g gets salt
  unknown (sodium mg or a serving's salt read as per 100 g). Salt words match as words: a roux only as カレールー or
  ルー alone (`ROUX`, not フルーツ), 用 only as "for" (焼肉用, not 使用 or 業務用: `USE_FOR`), めん not in もめん.
- **Fixes** (`data_src/food_fixes.json`): reviewed corrections by item id, `{"set": {fields, portions, name, cat}}`
  (`"portions": []` removes, `null` makes unknown) or `{"drop": true}`, each with `why` and `src`. Applied before the
  rules by `food-data.ts` and `off.py`. Only on solid evidence; otherwise null the field or drop the row.
- **Suspect checks** (`suspect`), the CI guard in the deploy gate's vitest: every shipped row against the rules (none
  may fire) and stricter checks (`atwater25`, `protein35`, `portion1500`). A hit fails unless
  `data_src/suspect_ok.json` lists the id, checks and a reason; an entry no longer hit fails too.

**A correction**: add the id to `food_fixes.json` (remove it from `suspect_ok.json` if listed), `npm run food:data --
--reship`, run the tests. A genuine suspect goes to `suspect_ok.json` instead.

## Descriptions
`data_src/descriptions.json`, `{"mext" | "dishes" | "eatout" | "maff_kyodo": {key: {"d": line, "src": [...]}}}`, sets
`desc` (`build.py` `attach_desc`: a MEXT key is group and name tokens, longest match wins, `*` any token; others by
local id; `"d": ""` none; a key matching nothing fails the build).
Rules: every fact stated by two independent sources in `src` (`mext:`, `wp:`, `wd:`, `maff:`; build-time only), else
no line; `gloss` the same. Plain and factual: no health claims (`DESC_BANNED`), no copied Wikipedia sentence, nothing
repeating the name (`lib.validate`). MEXT's attribution says the lines are ours (「説明文は本アプリで加工・追加」).

## Verification
`verify.json` groups the same food across sources (dishes by `lib.name_key`; MEXT foods against JBFD and the CC0
MEXT↔USDA table). `n` counts independent families agreeing within ±max(15 %, 10 kcal) of the reference. **n ≥ 2 =
confirmed**: the search shows ✓n beside the name. Kalori is never in it.

## Pictures
AI-generated イメージ (Z-Image-Turbo, Apache-2.0, run locally) of every generic food in one style; products borrow a
generic food's picture or show a category tile; Kalori menus hotlink Kalori's (`images.ts kaloriImg`). Pipeline:
`food-data/images/fi.py` (docstring: commands, prompt, layout).
- **Inputs**: `food-data/images/table/*.json` (one row per visual concept, `{key, ja, desc, items}`);
  `food-data/images/pmatch.py` + `products.txt` match products by name and OFF tags (doubtful: the tile). Renders
  cached in `$FOOD_IMG_RAW`. Checks (`FI_CHECKS=1`, a vision model) not run yet; `food-data/images/shipped.json`.
- **Pack**: webp sprite sheets in `app/static/food-img/`, append-only, content-hashed; its `index.json` maps ids to
  cells (`lib/food/images.ts` `imgOf`); the app build cuts product ids into `off.json` (`scripts/food-shards.ts`,
  `loadProductImages`). The service worker caches sheets on use, never at install.
- **Budget** (`lib/food/images.test.ts`): ≤ 1,100 files and 90 MB in food-img/, ≤ 400 KB a sheet, a common search's
  top 20 ≤ 128 KB of thumbnails on average, every generic food in a table row.
- **マイ食品's own picture** (`food_custom` `img`): 384 px JPEG/WebP ≤ 64 KB without metadata, made on the phone
  (`lib/food/photo.ts`); `relay/src/img.ts` refuses other sizes, metadata or a hash that isn't its id. Table
  `food_img`, served at `/img/<id>` (128 bits of SHA-256, a capability: never logged), per-uploader cap; the 03:00
  backup sweeps unreferenced ones. `ig` marks an illustration (イメージ badge).

## Kalori
Chain and konbini menus (すき家, セブン, スタバ ...) from kalori.jp as `kalori.json`, a lazy secondary dataset, public in
git and on Pages ([decisions](decisions.md#kalori-as-a-lazy-dataset)). Operating it (alerts, pausing, held updates,
undo): [runbook "Refresh Kalori"](ops/runbook.md#13-refresh-kalori).

- **Source**: a release `kalori-YYYY-MM-DD` (`kalori-data.tar.gz`, `SHA256SUMS`) written by
  `food-data/scripts/kalori_scrape.py` (docstring: commands, record format, exit codes), pinned by `fetch.py`'s
  `KALORI_TAG` ([decisions](decisions.md#kaloris-raw-data-in-releases-the-scraper-in-food-data)).
- **Build**: `fetch.py kalori` (checksums, complete coverage) → `build.py kalori` → `npm run food:data`. A partial input
  (a `kalori_shops.json` shop with no items, or under 45,000 items) fails unless `KALORI_ALLOW_PARTIAL=1`.
- **A refresh** (`kalori-scrape.yml`, weekly, its header describes every job): incremental from the accepted
  release; canary, 20 shards (`max-parallel: 8` on fresh runner IPs: kalori.jp blocks ~1,000 requests an IP a day),
  retry, report (over 15 % changed or 5 % missing refuses publishing unless `allow_big_diff`), update, status, deploy
  check. `kalori-wip` holds a running refresh; `kalori_prune.py` keeps the newest 3 releases and the pinned one. Only
  main publishes. ~3k requests a week; a full refetch ~56k (ask kalori.jp for a bulk export first).
- **Into the app, no person**: `update-build` (no token) bumps `KALORI_TAG` and ships kalori.json alone;
  `update-merge` (no npm: `lib/food/nodeAlone.test.ts` keeps `food-data.ts` node-only) re-converts, checks index.json
  (`.github/scripts/kalori-index.sh`) and the diff against the `KALORI_BAND_*` bands (`kalori_status.py` mirrors
  them). Within: commit `Kalori: <tag> (auto)` on main, dispatch `pages.yml` and `food-data.yml`. Outside: held on
  branch `kalori-update/<tag>` with a PR.
- **Deploy check** (`.github/scripts/kalori-deploy.sh`; `kalori-watch.yml` 6-hourly for a late one): data checks red
  → the commit reverted; Deploy UI red → one re-run, then `deploy_failed`.
- **Status**: `status.json` on the orphan branch `kalori-status` (`kalori_status.py`,
  `.github/scripts/kalori-status.sh`); ボット → 定期処理's メニューの更新 shows it ([bots.md](bots.md)).
- **The file**: `shops: {<id>: {name, aliases?}}`; items `kal:<id>`, values **per serving** (`null` when not shown),
  `est` (`e` kcal estimated, `p` P/F/C, `s` fibre or salt), `img` (`assets.kalori.jp`), `vg`/`st` sizes. The loader
  adds `sv: true` and `brand` (`db.ts fillIn`). Shop aliases: `data_src/kalori_shops.json` (never a food word).
- **Conversion** (`kalori_convert.py`, tests `test_kalori_convert.py`): name cleaning, categories (`GENRE_CAT`,
  `SHOP_CAT`), discontinued (`ended`, `pop: -1`; retired after 90 days gone, 180 ended), whole packs (`pack_of`:
  `1袋（全量）`), drops (`over_pack`, `implausible`, OFF duplicates, `near_key`).
- **On the phone**: ranked over the products only (`db.ts` KALORI_PENALTY); a shop's name scopes the search to its
  menu (`db.ts shopIn`); logged by the serving.

## Barcodes
The scanner (`components/food/FoodScan.svelte`, `lib/scan/`) reads EAN-13/8 and UPC-A/E with zxing-wasm (MIT), the
build's own files (never a CDN), fetched on the barcode button's press and cached once used, never precached
(sizes: [perf](ops/perf.md)).
- **Lookup** (`components/food/scan.ts`): normalised (`lib/scan/barcode.ts`), then `products.json`, then the barcode
  shard (`load.ts janItem`), with timeouts (20 s, 6 s) before going on.
- **Online fallback** (`lib/scan/off.ts`): Open Food Facts' API v2 (`/api/v2/product/<code>.json`; CSP `connect-src`
  names that path only), only the number sent (no cookies, referrer or image). The answer becomes a per-100 g item
  through the [data checks](#data-checks)' rules, id `off:<code>`.
- **Stored** as any food: the `food` op's snapshot (`contract/food.ts` FoodSnap) carries name and values.
- **Blocked and mine**: a code in index.json's `drop`, or a live answer part per serving (`off.ts partialScaling`),
  is not found. A マイ食品 made from a product keeps its barcode (`food_custom` `jan`): its owner's scan opens it first.
- **Logged**: one `act:scan.*` usage counter per outcome and one `perf.scan` per session
  ([observability](ops/observability.md)); never the code or the name.
