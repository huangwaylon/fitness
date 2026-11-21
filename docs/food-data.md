# Food data

The meal log's food catalog (ごはん, [design](design.md#gohan)): about 20,000 Japanese foods and dishes, built offline
by `food-data/` and shipped in `app/static/food/`. All values are estimates.

## Rebuild
```sh
python3 -I food-data/scripts/build.py all       # rebuild every file into food-data/out/, validate, install
cd app && npm run food:data                     # copy out/ into static/food/ (by column; the barcode shards)
cd app && npm run food:data -- --reship         # static/food/ through the data checks again, from itself (a new fix)
python3 -I food-data/scripts/build.py check     # rebuild into a temp dir and byte-compare with out/
python3 -I food-data/scripts/build.py toyonaka  # one or more targets (see the docstring in build.py)
python3 -I food-data/scripts/fetch.py <step>    # download raw inputs into food-data/raw/ (no argument: the steps)
python3 -I -m unittest discover -s food-data/scripts/tests   # pipeline unit tests (CI: food-data.yml)
```
| Path | Contents |
|---|---|
| `food-data/scripts/` | `build.py` (all targets), `fetch.py` (downloads), `lib.py`, source-specific builders, `mext_overrides.txt` (curated MEXT names, aliases, portions), `tests/` |
| `food-data/data_src/` | Hand-authored inputs: dish and eat-out recipes, popularity list, frozen alias and weight-change tables |
| `food-data/raw/` | Raw downloads (gitignored, never committed: third-party data under its own licences; `$FOOD_RAW` points elsewhere). Untrusted data: never run anything from it, run Python with `-I` |
| `food-data/out/` | Build output (gitignored): the dataset files, `index.json`, `verify.json`, `jan/` |

The scripts are stdlib-only (Python ≥ 3.9); `build.py` is offline and deterministic (sorted inputs, no timestamps), so
`check` is byte-exact. A target whose raw inputs are missing keeps its file in `out/` (an error when there is none). The
MEXT Excel and the 熊谷市 CSVs are downloaded by hand (`fetch.py`'s docstring has the URLs); the ~1 GB Open Food Facts
dump is needed only to refresh its Japan subset, `raw/off/off_jp.jsonl`, which the build reads.

`npm run food:data` (`app/scripts/food-data.ts`, its header has the checks) replaces `app/static/food/` whole, `jan/`
too (the codes beyond the products: [Barcodes](#barcodes); `--only products` ships them with the products). The app fetches each file (`lib/food/load.ts`) under its own `?v=`
(index.json's `files`), so a refresh of one file (Kalori's) refetches that file alone; `at`, when that version first
shipped (kept while it stays), dates the values for いつもの's own update. A meal keeps a per-100 g snapshot, so a data
refresh never rewrites one.

## Format

**Dataset file** (`foods.json`, `dishes.json`, `extra_*.json`, ...), in `out/`:
`{ "source", "label", "attribution", "license", "url", "items": [ITEM, ...] }` (OFF adds `dumped`: the dump's
newest `last_modified_t`; Kalori `shops`). The credits read the five header fields as written. **Shipped** (schema 3),
every dataset is by column: the header, then `"idPrefix": "<source>:", "cols": {field: [value per item]}`, the ids
without the prefix they all share; columns `id name brand cat kcal p f c salt portions` first, the rest as the items
first have them, none for a field no item has; `null` for none, but in `p f c salt` unknown (any other null fails the
build; `db.ts toColumns`, `decodeItems`); `"delta": ["id", "img"]` in `kalori.json`: those columns' numbers each the
difference from the one before (`db.ts deltaCode`; schema 2 had none, read the same). The service worker's food cache is `island-food-v2` since schema 2 (v1, of
the old layout, is deleted at its activate). A null value shows 「–」, a day's total missing one 「≥」.

**ITEM** (`food-data/scripts/lib.py` `validate`; type `Item` in `app/src/lib/food/types.ts`):

| Field | |
|---|---|
| `id` | `"<source>:<local id>"`, unique across all files (`mext:01088`, `off:4902705126558`) |
| `name` | short Japanese display name; `full` = official or original name (optional); `en` (optional) |
| `aliases` | optional search terms (readings, variants, Wikidata/Wikipedia names); never equal to `name` |
| `cat` | one of 主食 麺 丼・定食 主菜 副菜 汁物 寿司 パン 肉 魚介 卵 大豆・豆 野菜 果物 きのこ 海藻 乳製品 菓子・デザート 飲料 酒 調味料 油脂 ナッツ・種 いも コンビニ 外食 その他 |
| `kcal` `p` `f` `c` `salt` | **per 100 g** (100 ml of a drink counts as 100 g). `kcal` is an int; the others have 1 decimal or are `null` when unknown. `c` = total carbohydrate as on Japanese labels; `salt` = 食塩相当量 |
| `fib` | optional, per 100 g, 1 decimal, **absent when unknown**: 食物繊維総量 (g). MEXT's own (a known zero filled, below); the recipe sets sum their ingredients'. Alcohol is not tracked |
| `portions` | optional `[{label, g}]`; the first one is the default. The app always adds a 100 g option |
| `pop` | optional 1–3, a curated search boost (`data_src/popular.json`, `mext_overrides.txt`); -1 ranks a rare form lower (`mext_names.py` RARE, `build.py` STORY; a discontinued [Kalori](#kalori) item) |
| `vg`, `st` | MEXT only, optional: one food in its states (豚ロース 生 · 焼き · ゆで; `mext_names.py` variant_groups): `vg` the group's default item's id, `st` the state the app's chip shows |
| `jan`, `brand` | packaged products only |
| `note` | how the value was derived, shown in the picker |
| `desc` | optional 「これは…」 line (≤ 40 characters, no final 。): what an unfamiliar food or dish is and what it looks like. See [Descriptions](#descriptions) |
| `gloss` | optional everyday Japanese name under the food's own (≤ 20 characters: リーキ → 西洋ねぎ), from `data_src/glosses.json`, two sources each as `desc`; never a spelling, a dish, a broader category or an archaic name |

MEXT markers: `Tr`/`(Tr)` → 0, `(N)` → N, `-` → null (absent for `fib`), a footnote mark dropped. A `-` fibre that is a
known zero is 0 (`lib.mext_values`): no carbohydrate (炭水化物 counts the fibre), an animal food or fat (groups 10-14, as
MEXT's `(0)` siblings) with no coating or plant part (フライ, 天ぷら, から揚げ, 昆布 stay unknown), honey and the clear
sodas: 44 foods; coffee, tea, wine and the like stay unknown (some soluble fibre). `_typical.json` gives `fib` only so
(whey, strained yogurt, ginger ale). kcal is MEXT's
energy as given (alcohol's 7 kcal/g included). Recipe datasets don't ship their ingredient lists.

**`index.json`**: `{ "version", "datasets": [{ "file", "source", "badge", "secondary", "lazy" }], "files", "jan", "schema" }`.
`schema`: the layout (3: by column, `delta` columns; `db.ts FOOD_SCHEMA`), and an app that reads an older one refuses the index (no
fetch; it asks for the deployed build). `files` (required):
each shipped file's own cache key (`?v=`), 12 hex digits of the sha256 of its bytes; `version`: the same over all of
them (`food-data.ts`). `secondary` datasets rank
slightly below the core ones (mext, dishes, eatout) on equal matches. `lazy` ones (`products.json`, `kalori.json`) load only when asked
for (`db.wantMore`: the search's first keystroke, or a day with a product logged), parsed in a worker; a late dataset calls
`db.onAdd` and the search runs again. A day's (or さいきん's) chain menu comes from its id shard instead (`db.wantIds`).
No file ships search keys: the parsing worker builds them (`search.ts keysOf`), and keeps a core dataset's in IndexedDB
(`island-food-keys`, `keysCache.ts`: by the file's path, under its `?v=` and the worker's hashed URL) for the next open.

**`verify.json`**: `{ "sources": {src: { "label", "license", "url", "attribution" }}, "groups": [{ "n", "kcal": {src:
kcal per 100 g} }], "byId": {item id: group index} }`. `src` is a dataset `source` (the item id prefix) or `usda`; every
src used in a group is in `sources`. See [Verification](#verification).

**`jan/<k>.json`**, in `out/`: `{ "<jan>": ITEM }`, `k` the code's last 3 digits; shipped regrouped by the last 2
(100 files: `lib/food/jan.ts` `janShard`), by column (as a dataset,
`source: off`, no aliases) with only the codes beyond `products.json`, no store code (GS1 02, 20–29) or name under 2
letters (`lib/food/jan.ts`), under index.json's `jan` (one `?v=` for every shard; ODbL 1.0 as the products). Keys are JAN/EAN-13 or
JAN-8 with a valid check digit (`lib.py` `norm_jan`); UPC-A is zero-padded to 13, UPC-E and GTIN-14 dropped.

**`kal/<n>.json`**, made at each build from the shipped `kalori.json` (`scripts/food-shards.ts`, `lib/food/kal.ts`;
never committed): its items in id order cut into 100 runs, the build's kal/at.json each run's first id, by column without
aliases, its shops' names in `shops`; an item of a `vg` group sits in its group's shard, named in its own shard's
`with` (id → group id). ~11 KB brotli each, under kalori.json's `?v=`: a day's chain menu without the 1.2 MB file.

## Sources

| File | Source | Items | License | Attribution | How values were derived | Caveats |
|---|---|---|---|---|---|---|
| `foods.json` | MEXT 日本食品標準成分表（八訂）増補2023年 (Excel, the `2026-03-27` errata) | 2,538 | 公共データ利用規約1.0 (CC BY 4.0 compatible) | 「日本食品標準成分表（八訂）増補2023年から引用」 + modification notice | Official values. Display names, categories, aliases and portions are rule-based plus curated overrides | Per 100 g of edible portion; energy is composition-based (八訂) |
| `dishes.json` | Own recipes × MEXT | 349 | MEXT terms (values); recipes are our own | 「…をもとに算出（レシピは独自）」 | `data_src/dishes/`: MEXT food numbers + grams, summed to per 100 g; default portion = 1人前 (a big soup's `lead` 1杯（お椀） 250 g first) | Home-style estimates |
| `eatout.json` | Own recipes × MEXT | 448 | as above | as above | `data_src/eatout/` (shared components), size multipliers; a few foods MEXT lacks use typical values (`_typical.json`), said in their note | Generic chain/konbini-style estimates |
| `extra_maff_kyodo.json` | MAFF「うちの郷土料理」 | 1,123 | PDL1.0 (+ MEXT) | 「…のレシピを加工して作成」 | Free-text ingredient lines mapped to MEXT (`maff_ingredients.py`), converted to grams, summed | Kept only if ≤ 5 % of the mass is unmapped and the servings are plausible (the filters: `maff_ingredients.py`) |
| `extra_takatsuki.json` | 高槻市 学校給食レシピ (BODIK) | 54 | CC BY 4.0 (+ MEXT) | 「…を加工して作成」 | Same text-recipe mapper as MAFF | School recipes |
| `extra_kurume.json` | 久留米市 料理の栄養価一覧 (BODIK) | 230 | CC BY 2.1 JP | 「…を加工して作成（1人前値を100g当たりに換算）」 | Official per-serving values ÷ ingredient weight (+ water absorbed) | 成分表2010 energy (staples ~3–8 % above 八訂) |
| `extra_toyonaka.json` | 豊中市 小中学校給食献立 (BODIK) | 607 | CC BY 4.0 | 「…を加工して作成（料理ごとに集計し100g当たりに換算）」 | Ingredient rows (MEXT 食品番号) summed per dish, cooking water via 表12 | Adult default portion (below) |
| `extra_kumagaya.json` | 熊谷市 学校給食献立情報 2023–2026 | 773 | PDL1.0 | as Toyonaka | As Toyonaka (city-local codes keeping the MEXT group prefix) | Adult default portion (below) |
| `extra_tokyo_hokeniryo.json` | 東京都 島しょ保健所「一人でもできる簡単レシピ」 | 14 | CC BY | 「…を加工して作成」 | Official per-serving values ÷ serving weight estimated from the ingredient list (`data_src/tokyo_hokeniryo_recipes.json`) | Estimated weights |
| `jbfd.json` | JBFD v0.1 (Nakagawa & Yamamoto, RinCOM) | 66 | CC0 1.0 | courtesy credit | Mean label values of ≥ 3 private-brand products per food type with no MEXT item; spread-out or mixed-basis boxes skipped; serving portions `data_src/jbfd_portions.json` | The SD is in `note` |
| `products.json`, `jan/` | Open Food Facts (Japan) | 30,007 (search) / 42,750 (barcodes) | ODbL 1.0 / DbCL 1.0 | 「© Open Food Facts contributors」 | Label values; plausibility rules (below) | Crowd-entered; searched: a Japanese name, P/F/C, deduplicated |
| `kalori.json` | kalori.jp chain and konbini menus ([Kalori](#kalori)) | (per build) | kalori.jp 利用規約 | 「kalori.jp（各社の公表値と kalori.jp の AI 推定値）」 | Shops' published values and Kalori's AI estimates, per serving | `est` marks estimates; may-be-discontinued items kept, marked |

**School-lunch adult portions** (Toyonaka, Kumagaya): the default portion is 「1人前（目安）」, the median adult portion
of the same dish elsewhere, else the school portion × the city's measured adult/school ratio (「目安・給食量から換算」);
「給食1人分」 stays the second. A rice or noodle dish without its staple is renamed 〜の具 / 〜（ごはんなし）; impossible
rows are dropped, and a blank cell is a zero only where the row needs none. The rules: `build.py` (`blank_null`).

**Open Food Facts plausibility** (`scripts/off.py` `plausible`, per 100 g; its comments give each threshold): kJ
entered as kcal fixed; kcal out of range, grossly under 4P+9F+4C (not sweeteners, fibre), per-piece fried chicken, a dry
snack (not sold by ml) or rice ball under its floor, all-0 values on a food, a serving in cups or kcal, a 0-kcal
alcoholic drink: dropped; a macro out of range or off (kcal grossly over it: kcal kept): P/F/C nulled; a 1食分 only in g or ml; salt over its category's cap (a salty-food
allow-list, protein supplements' own caps) nulled; the category from OFF tags, else name keywords (`NAME_FALSE_FRIENDS`
first; a drink word ending the name beats a flavour); creatine's nitrogen not counted as protein. Its rules shared with the app, the reviewed fixes and the CI guard: [Data checks](#data-checks).

Our recipe sets name a dish once (`build.py` `qualify`): a name an earlier set (dishes, eatout, MAFF, Takatsuki) holds
at another kcal says what differs (エビマヨ（お店）, 雑煮（三重県）). A name never carries its reading (it moves to the
aliases: `recipes_text.split_title`, `lib.READINGS`). Search aliases come from Wikidata (CC0) and ja.wikipedia (CC
BY-SA, short names and readings only), frozen in `data_src/aliases_*.json`; MEXT's everyday spellings and rule-based
aliases: `mext_names.py` (EVERYDAY, TOKEN_ALIASES, PROCESSED_MEAT); a rule's alias inside another is pruned, a curated
one (`mext_overrides.txt`) kept, as an exact alias ranks higher (焼き芋 beside 石焼き芋). A cooked MEXT form with no
portion takes its raw form's × 表12's weight change (`cooked_portions`; not spoons, sizes, 刺身 or （乾）).

## Data checks
What ships passes three layers (`app/src/lib/food/plausible.ts`, its tests `plausible.test.ts`):
- **Rules** (`plausible`), automatic, at ship time in `food-data.ts` on every item of every file, the shards too (its
  output line counts each), and on a live OFF answer; `off.py plausible` mirrors them for builds, and
  `data_src/plausible_cases.json` holds cases both test (`test_lib.py` `test_shared_cases`). kJ typed as kcal (P, F, C
  known: ≈ 4.184 × 4P+9F+4C; one unknown: more energy than the rest of the 100 g could hold) → ÷ 4.184; P+F+C over
  105 g, energy grossly or (a product's) moderately off 4P+9F+4C → P, F, C null; a product's salt ≥ 5 g copying C or P
  (×0.96–1.02) that 100 g can't hold or over its category's cap in no seasoning → null; a product's 1食分 of ≥ 300 g
  equal to its kcal → removed; a chain menu over 9.1 kcal a gram its name states (「ペペロンチーノソース 30g」 at 520
  kcal; `kalori_convert.py` too) → dropped. Tuned on all 102,941 shipped rows to fire on none by chance (when added:
  kJ 10, salt 89, portion 10, density 9 fixed).
- **Fixes** (`data_src/food_fixes.json`), reviewed corrections by item id: `{"set": {per-100 g fields, portions,
  name, cat}}` (`"portions": []` removes them, `null` makes a value unknown) or `{"drop": true}`, each with `why`
  and `src` (the label, the maker's page, or the reasoning). Applied before the rules, by `food-data.ts` (every
  dataset) and `off.py` (the products' ids). Only on solid evidence (a per-pack value ÷ its grams, a decimal slip
  Atwater confirms); otherwise the bad field null or the row dropped.
- **Suspect checks** (`suspect`), the CI guard (`plausible.test.ts`, in the deploy gate's vitest, ~0.4 s): every
  shipped row against the rules (none may fire: they ran) and stricter checks: energy over 25 % and 30 kcal off
  4P+9F+4C (`atwater25`, as `off.py`'s `off_review.tsv` lists each build), protein over 35 % of a sweet's, drink's
  or staple's energy not named a protein food (`protein35`), a default portion over 1,500 kcal (`portion1500`). A hit
  fails unless `data_src/suspect_ok.json` lists the id with those checks and a reason; an entry no longer hit fails
  too. Every fix must be what ships. `off.py` drops a product whose fields are part per serving (salt/sodium or
  kJ/kcal at the serving factor ±4 % and energy > 12 % off: `partial_scaling`, the Giant Cone's class).

**A correction**: add the id to `food_fixes.json` (and remove it from `suspect_ok.json` if listed), then `npm run
food:data -- --reship` (only the rows a fix or rule touches change; index versions recomputed) and the tests. A
suspect hit that is genuine goes to `suspect_ok.json` instead.

## Descriptions
`data_src/descriptions.json` holds our own one-line descriptions, `{"mext" | "dishes" | "eatout" | "maff_kyodo": {key:
{"d": line, "src": [source, ...]}}}`; the build sets an item's `desc` from them (`build.py` `attach_desc`: a MEXT key is
its group and name tokens, the longest match wins, `*` any one token; the others key by local id; `"d": ""` gives no
line; a key matching no item fails the build).
- **Two sources per line.** Every fact in a line is stated by at least two independent sources, listed in `src`
  (build-time only, never shipped): `mext:<食品番号>` (the 成分表's 食品群別留意点, 備考 or 別名), `wp:<title>` (ja.wikipedia),
  `wd:<QID>` (the Wikidata description), `maff:<page>` (うちの郷土料理). A line the sources don't both confirm stays empty.
  Each batch is checked by an independent pass before it ships.
- **Plain and factual.** No health or nutrition claims (`DESC_BANNED`), no Wikipedia sentence copied: the lines are
  ours, written from the facts. Everyday foods (ごはん, 牛乳) have none. The amount shows a line beside the food's name
  and `gloss`, so it never repeats them (`lib.validate`), and another name in it says so (「…。しなちくとも」, not 「…。しなちく」).
- **Everyday names** (`gloss`, `data_src/glosses.json`) work the same way, sources `mext:` (別名), `ov:` (`mext_overrides.txt`),
  `wd:` (labels/aliases) and `wp:`.
- **Credit.** MEXT's attribution says the descriptions are ours (「説明文は本アプリで加工・追加」); the MAFF dataset's covers
  its dishes'. No Wikipedia or Wikidata text is shipped.

## Verification

`verify.json` groups items that describe the same food across sources and lists each source's kcal per 100 g.
- **Dishes**: items with the same normalised name (`lib.name_key`: NFKC, kana/kanji variants, qualifiers and units
  dropped) form a group. A name equal to an alias of exactly one anchored group joins that group (aliases with brackets,
  or broader than the anchor's own name, are ignored). MEXT group 18 prepared foods and staples take part.
- **Foods**: MEXT foods get second values from JBFD label means (boxes with ≥ 2 products) and the MEXT↔USDA FoodData
  Central correspondence table (CC0; kJ-as-kcal rows fixed; only pairs that agree with MEXT are kept). School-lunch
  ingredient rows are MEXT values × grams, so they are not a second source.
- **Independence**: `n` counts families, not files: our recipe sets (dishes, eatout, MAFF, Takatsuki) are one; MEXT,
  Kurume, Toyonaka, Kumagaya, Tokyo, JBFD and USDA each one. The city sets reuse MEXT ingredient values, so they count
  for dishes, never for single foods.
- **Agreement**: the reference is MEXT for foods; for dishes it is the value the most families agree with. Values
  outside ±max(15 %, 10 kcal) of it are left out of the group (their items get no `byId` entry), so each member's own
  kcal agrees with its source's value. `n` = agreeing families, or 1 when the kept values spread more than 1.5×.
  **n ≥ 2 = confirmed**: the app's search shows ✓n beside the name.

## Pictures
ごはん's food pictures are AI-generated イメージ (Z-Image-Turbo, Apache-2.0, run locally) of generic foods and dishes in
one style (coloured pencil and watercolour on the paper colour): 5,136 pictures cover all 6,202 generic foods, and
18,807 of the 30,007 packaged products show a generic picture of the same food. Custom foods show their own photo or
illustration, the other products their category's tile; Kalori's chain menus Kalori's own picture, hotlinked
(`images.ts kaloriImg`: every row and the amount, never in these sheets). The pipeline is `food-data/images/fi.py` (its docstring: the commands, the prompt, the
sheet layout):
- **Table** (`food-data/images/table/*.json`, hand-written): one row per visual concept, `{key, ja, desc, items}`;
  variants that look alike share a row, states that look different get their own. `desc` says what it looks like (a
  name alone draws the wrong food).
- **Products** (`food-data/images/pmatch.py`, rules in `products.txt`, tests `food-data/scripts/tests/test_pmatch.py`;
  never a package photo): a product borrows the picture of the food its name ends with or of a dish it is named like,
  corrected by context rules and its Open Food Facts tags; a doubtful match keeps the tile.
- **Generation:** a fixed seed per row and roll, cached outside the repo (`$FOOD_IMG_RAW`), resumable.
- **Checks** (not run yet; the owners' call): the images ship unchecked (`food-data/images/shipped.json`);
  `FI_CHECKS=1` runs a vision model against vetted reference photos, then a by-eye contact sheet.
- **Pack:** webp sprite sheets in `app/static/food-img/` (thumbnails per search neighbourhood, details per category),
  append-only and content-hashed (cached for a year); `index.json` maps each food id to its cells
  (`lib/food/images.ts` `imgOf`); a products.json rebuild re-matches only at the next pack (needs PIL). The build
  cuts the products' ids out of it into `off.json` (`scripts/food-shards.ts`; the index's `off` its `?v=`), fetched
  once a product's row is drawn (`loadProductImages`). The service worker caches sheets on first use, never at install.
- **Budget** (`lib/food/images.test.ts`): ≤ 1,100 files and 90 MB in food-img/, ≤ 400 KB a sheet, a common search's
  top 20 ≤ 128 KB of thumbnails on average, and every generic food in a table row.
- **マイ食品's own picture** (`food_custom` `img`, since 2026-11-20; `relay/src/img.ts`): a photo anyone adds in the
  editor (counted against the uploader's cap), cropped square and re-encoded on the phone to 384 px JPEG/WebP ≤ 64 KB, with no metadata (WebKit's own Exif
  segment cut: `lib/food/photo.ts`; the relay refuses
  Exif/XMP/IPTC, any other size, a hash that isn't its id). Kept in the record's `food_img` table, served at
  `/img/<id>` (the id is the bytes' SHA-256's first 128 bits, a capability: never logged), in the daily dump; the 03:00
  backup sweeps the ones no custom food names. A deleted photo stays in recovery (30 days) and the dumps (90 days), as
  all data. `ig` marks an illustration (the イメージ badge): the 8 made for person B's foods (`record.ts img-set`).

## Kalori
Chain and konbini menus (すき家, セブン, スタバ ...) from kalori.jp, shipped as `kalori.json`, a lazy secondary dataset
like the products, public in git and on Pages (why: [decisions](decisions.md#kalori-as-a-lazy-dataset)). Operating
it (alerts, pausing, a held update, undoing): [runbook "Refresh Kalori"](ops/runbook.md#13-refresh-kalori).

- **Source:** a release of this repo, `kalori-YYYY-MM-DD`, written by `food-data/scripts/kalori_scrape.py` in
  `kalori-scrape.yml` and pinned by `fetch.py`'s `KALORI_TAG`
  ([decisions](decisions.md#kaloris-raw-data-in-releases-the-scraper-in-food-data)). Its `shards/shard-N.jsonl` (0-19) hold one line a product. Format v2 lines carry `nutrients`
  (only the rows the page shows, each `{v, est}`), `name`, `shop_name`, `shop_category`, `genre`, `ended`, `listed`,
  `image_id`, `parser` (ignored), `table: false` (no nutrition table: `est` all true), `gone: true` (left the site: as
  `listed: false`), `gone_since` / `ended_since` (the first fetch that saw it so); v1 lines are skipped. Per product (shop, id) the latest `fetched_at` wins.
- **Build:** `fetch.py kalori` (the pinned release's tarball, checked against `SHA256SUMS`, refused unless
  `coverage.json` is complete, into `raw/kalori/`), then `build.py kalori`
  (or `all`) → `out/kalori.json` (`kalori_convert.py`, its counts printed; alone: `python3 -I
  food-data/scripts/kalori_convert.py food-data/raw/kalori`), then `npm run food:data`. A
  partial input fails the build and writes nothing: one of `data_src/kalori_shops.json`'s shops with no items, or under
  45,000 items (a whole fetch ships ~54,000); `KALORI_ALLOW_PARTIAL=1` writes it anyway.
- **A refresh** (`kalori-scrape.yml`, weekly and by hand): incremental, seeded from the accepted release's data and
  state (main's `KALORI_TAG`; never a draft, prerelease or held one).
  Every shop's listing is read (new products, a changed count, a product gone from it); a product is fetched again
  only when new, its sitemap `lastmod` changed, its listing flag flipped, it failed before (a newer
  `PARSER_VERSION` retries failures and no-nutrition marks), a parser before `RECORDS_FROM` wrote it, or it was
  fetched before `refetch_before`. One a site no longer has is written `gone`. Shards are append-only; `compact`
  keeps one line a product. The diff against the
  accepted release gates publishing: over 15 % of products with changed values or 5 % missing refuses it (exit 6)
  unless `allow_big_diff`.
- **Cost:** ~3k listing requests a week (measured: 2,954 over 20 shards, ≤ 214 a shard) plus the changed products,
  ~13k a month. kalori.jp blocked at ~1,000 requests an IP a day (the first crawl): rounds of 20 shards, each on a
  fresh runner (a new IP), at most 8 at a time (`max-parallel`: Actions' 20 jobs at once are account-wide, shared
  with the ITS runner's 1 and suumo's 8, and the ITS runner's successor and the deploys need room), the rest queued
  in later waves; a shard's rate is `total_rate`/20, so 8/20 of it runs at once; one that hit the limit re-dispatched. A full refetch (`refetch_before` today, or
  `RECORDS_FROM` raised with `PARSER_VERSION`): ~56k requests, 4-5 rounds. Before the next one: ask kalori.jp for a bulk export.
- **Exit codes** (`kalori_scrape.py`): 0 done, out of budget or nothing to do (no shop of `only_shops` in the shard), 1 a crash, 2 the 429 limit, 3 network errors (2, 3 and
  a lost, timed-out or cancelled shard job are retried), 4 the pages no longer parse (never retried; no product marked
  no-nutrition), 5 more new no-nutrition marks than max(25, 2 % of the fetches) (undone; never retried), 6 the diff
  over its limits. The **canary** runs first each round (the parsers on a few live pages); any failure of it stops the round (exit 4:
  `drift`).
- **Releases:** `kalori-wip`, a prerelease while a refresh runs (`run.json` with its `since`, and per shard
  `state-N.json`, `shard-N.jsonl.gz`, replaced by a new upload renamed after, never clobbered; deleted on publishing); `kalori-YYYY-MM-DD` (marked Latest; past the newest 3, deleted after a publish, never the pinned one: `kalori_prune.py`):
  `kalori-data.tar.gz` (folders `shards`, `state`: `shard-N.jsonl`, `state-N.json`; `coverage.json`, `diff.json`,
  `run.json`) and `SHA256SUMS`, made a draft, its assets checked, then published (a failure deletes the draft). Only a
  run on main publishes; another `wip_tag` (`kalori-wip-<name>`), `only_shops` or `max_requests` is a test.
- **Into the app, no person:** `update-build` (read-only, no token: it runs npm) bumps `KALORI_TAG`, converts,
  ships kalori.json alone (`npm run food:data -- --only kalori`) and runs the tests. `update-merge` (no npm) takes
  none of it unchecked: its three files against BASE (the main it built on), kalori.json against its own conversion
  of the release (shipped by BASE's `food-data.ts --only kalori` on node alone: `lib/food/nodeAlone.test.ts` keeps its imports `node:`
  and relative), the gates from the report job's diff.json and coverage.json (digests checked) and the two
  kalori.json. Within every band: the commit `Kalori: <tag> (auto)` onto main (re-applied while main's
  food files are BASE's, else held: `main_moved`); the status written, then `pages.yml` and `food-data.yml`
  dispatched (a workflow-token push runs no workflow). Outside a band: held, the branch `kalori-update/<tag>` and
  a PR with the gate table. It commits its own conversion's bytes (update-build's must match).

  | gate (shares of the accepted release's products) | band |
  |---|---|
  | added · gone | ≤ 2.5 % · ≤ 1.5 % |
  | values changed (renamed counts here, ≤ 1 %) · est changed · ended changed | ≤ 1 % · ≤ 0.5 % · ≤ 1 % |
  | kalori.json's items, new − old | ≤ 2 % |
  | shops lost · new | ≤ 2 · ≤ 10 |
  | converter drops, each reason | ≤ the accepted release's + 0.5 % of the items (skipped until status.json has them) |
  | tests, coverage complete, a default run (no `allow_big_diff`) | required |

  The bands are update-merge's env (`kalori_status.py` mirrors them). With 4+ merged runs in the history, added,
  gone, values and ended become max(band, 3× the median of the last 8 merged), at most 2× the band.
- **The deploy check** (`.github/scripts/kalori-deploy.sh`; a token's dispatch fires no `workflow_run`): polls
  70 min for the dispatched runs on `merge.sha`. Food data checks failed: the `(auto)` commit reverted, redeployed
  (`reverted`); Deploy UI failed: re-run once, then `deploy_failed`; both green: `ok`; a run unseen:
  `deploy_failed`. **The watch** (`kalori-watch.yml`, 6-hourly): the same for a deploy pending 160 min;
  `late` and `stuck` (the runbook).
- **The status:** `status.json` on the orphan branch `kalori-status` (one commit, force-pushed with a lease:
  `kalori_status.py`, `.github/scripts/kalori-status.sh`): verdict, reasons, `at`, `next` (the next scheduled run),
  run, accepted dataset, diff (`tripped`: the failed gates), coverage, merge, alert, the last 12 runs; a round writes
  `running` at setup. ボット → メニュー reads it ([bots.md](bots.md)); its reasons: the runbook.
- **The file:** a dataset (`source: kalori`) with `shops: {<id>: {name, aliases?}}` (the name: the shop's, else its
  id) and items `kal:<id>`: `shop` its id, values **per serving**, a value the page doesn't show `null` (`fib`
  absent), never 0; `sv: true` (one `1食` portion of a nominal 100 g) and `brand` (the shop's name) are the loader's
  (`db.ts fillIn`; a packaged good whose 1食分 is its whole pack ships that one portion, `1袋（全量）`, see Whole packs): 54k items, shipped by column as the products are (`kal:` the ids' `idPrefix`), 7.4 MB (1.19 MB gzipped; 10 MB and 1.6 MB by item);
  `est` (`e`: kcal estimated, `p`: official kcal, estimated P, F or C, `s`: official kcal and PFC, estimated fibre or
  salt; absent: all official), `img` (the generated picture's id, hotlinked from `assets.kalori.jp`),
  `vg`/`st` for trailing size, milk and temperature words (牛丼 並盛 · 大盛, ライス中, （ICED・Tall・豆乳）; default: current,
  regular, plain, ICED) or a takeout / 食べ放題 copy (店内 · 持ち帰り; with the same values dropped,
  `takeout_twin`), katakana aliases for Short/Tall/Grande/Venti; a smaller size with 5 % more kcal than a larger one:
  `est: e` (`reversed`). Our shop aliases (セブン, カルディ; never a food word: `db.ts addShops` refuses it) and
  display names are `data_src/kalori_shops.json`.
- **Names:** half-width kana made full, control characters, line breaks and doubled spaces, a trailing ` /`, Kaldi's
  【賞味期限…】/【アウトレット】 and IKEA's certification cut; then, each only where no two of the shop's names would meet,
  the shop's leading order code (`LEAD_CODES`: いかり's 【38】 and Ｓ/Ｏ/M, ビッグボーイ's and フライングガーデン's TO,
  コージーコーナー's 【1】), decorations (★…★, ♡, NEW！, 旧：; a half-bracket label 日替） moved to the end), a ※ note
  (bracketed anywhere, trailing, or before a last size bracket) or a trailing price, and a name over 60 characters cut
  before its last bracket, comma or space.
- **Discontinued:** 販売終了かも？ (`ended`), off the listing (`listed: false`) or 旧： stays, `ended: true`, `pop: -1`,
  `est: e` (no 推定 badges). **Retention** (`retired`): gone over 90 days, ended over 180 (an official kcal not
  marked 販売終了かも: 180, 360), to the data's latest fetch (undated: the line's).
- **Categories:** the `genre`'s (`GENRE_CAT`; a sweets shop's or a cafe's cake/tart pastry 菓子・デザート; alcohol
  (`ALCOHOL`) in a drink or soup genre 酒; `snack` a sweet only in a sweets shop or by name, else the name's いも, 大豆・豆,
  魚介, 肉, 乳製品, ナッツ・種, 果物, 海藻, else 副菜 (a konbini's or supermarket's: 菓子); in soup, ice and dessert genres a
  drink name 飲料 (not an ice shop's flavour), 雑炊/粥... 主食, グラタン 主菜, ゼリー 菓子; a rice-bowl's plain ライス 主食); with
  no genre, the name's (alcohol, sweets, drinks; then `name_cat`, not in a sweets or bread shop: the shop's names cut,
  いかり's いか no squid, the dish it names, 貫 寿司, バーガー パン, スープ 汁物, うどん 麺, 丼/膳 丼・定食, ごはん/カレー 主食,
  餃子/グラタン 主菜, たれ/の素 (a packaged ソース too) 調味料, else the one food it names, a vegetable alone 野菜, cooked
  or pickled 副菜 as dishes.json's きんぴら, しいたけ きのこ, a sushi shop's fish 寿司; two foods or none: no answer), else
  the shop's kind (`SHOP_CAT`), else その他 (674 → 114 of 54k).
- **Whole packs** (a `RETAIL`/`OFF_RETAIL` shop's, the pack's grams ending the name before its brackets, `pack_of`):
  a 1食分 at 2 kcal a gram and more than any 100 g holds (900 kcal or P+F+C 100 g: not ライフ's per-100 g labels nor a
  smaller serving), from 150 g, is the pack (成城石井's 無塩クルミ大袋 280g at 1,867 kcal): its portion `1袋（全量）` (缶, 瓶,
  箱 by the name, else パック; the grams are in the name, and a serving's `g` is 100), still a serving (`sv`), so a log says a bag. Under 2 kcal a gram a pack is a single
  serving's (rice, curry) or a label's 100 g: left as 1食. 142 items.
- **Dropped:** no name or kcal; over the custom-food limits (5,000 kcal, 500 g, fibre 100 g); a platter for N (５人前,
  3名様; not a 福袋, gift or kilo item, nor a share under 150 kcal) ships per person, …（1人前）; a packaged good's
  values its pack can't hold (`over_pack`: P+F+C over 1.05× the grams its name states, a ready-to-drink drink, no
  base or syrup, over 2 kcal a ml; an official kcal with estimated P, F, C ships, P, F, C null); kcal off Atwater
  (4P+9F+4C) by over half and 50 kcal (alcohol aside: a スパークリング far over it is 酒), or 0 kcal with 10 kcal of P
  and F (`implausible`; an official kcal ships, P, F, C null); an OFF product of the same name by the shop, in a
  retail kind (`OFF_RETAIL`), its label's serving agreeing (kcal, P, F, C within 1.35×); a near-duplicate (the same
  name but for width, spaces, a 旧：, ※ notes or a price, `near_key`, detection only: the current, official, latest,
  higher id stays; both listed, official, over 10 % apart, or two prices that differ: both);
  a long name that, cut, meets another. Never in `verify.json`.
- **On the phone:** ranked under the other secondary sets (`db.ts` KALORI_PENALTY), over the products; a shop's name
  or alias in the query scopes to its menu (`db.ts shopIn`); logged as an `sv` snapshot (whole servings, no grams).
- **Tests:** `food-data/scripts/tests/test_kalori_convert.py` (invented rows), `test_fetch.py` (a local tarball), the
  scraper's (fixtures, a fake site); `load.test.ts` (every alias names its shop).

## Sources evaluated and not used
- Commercial recipe sites (Cookpad, Kikkoman, Ajinomoto) and 女子栄養大学 calorie guides: no reuse license.
- GS1 Japan (GEPIR closed; Verified by GS1 forbids redistribution) and JICFS (paid): no nutrition data either.
- FatSecret: Japanese data only in the paid tier. Yahoo/Rakuten product APIs: product name only.
- USDA FDC API: English-only US foods. Only the CC0 correspondence table is used, for verification.
- NIBN 重量目安表: the PDF forbids reproduction. スマートミール: no open license.
- Other municipal datasets (横須賀, 堺, 豊田, 中野区, 直方, 福岡, 生駒, 東京都 糖尿病対策レシピ ...): only per-meal or per-day totals, missing nutrients, or names only.
- MAFF 食事バランスガイド: SV counts in an image PDF, no kcal.

## Barcodes
ごはん's scanner (`components/food/FoodScan.svelte`, `lib/scan/`; [design](design.md#gohan)) reads EAN-13, EAN-8, UPC-A
and UPC-E live from the camera with zxing-wasm's reader (MIT; zxing-cpp Apache-2.0): a 37 KB chunk (13 KB gzipped)
and a 947 KB wasm (Cloudflare serves it as 391 KB brotli, 408 KB gzip). The scanner's level is a chunk of its own too
(FoodScan, scan.ts, lib/scan/: 12 KB, 5 KB gzipped; `components/food/scanner.ts`). All are the build's own files
(never the package's CDN), fetched on the press of the barcode button (else as the level opens), and kept by the
service worker once used (`caches.ts` carried, the name `scan`: never precached, so the first open needs the network).
- **Lookup** (`components/food/scan.ts`): the code normalised (`lib/scan/barcode.ts`: the check digit, UPC-A
  zero-padded to 13, UPC-E expanded, a GTIN-14's pack digit 0 dropped), then `off:<code>` in `products.json`
  (lazy: asked for when the scanner opens, and waited for till indexed, 読み込み中 past 0.3 s; past 20 s the lookup
  goes on without it, and an answer OFF can't give is `late`: 「データの読み込み中のため確認できません」, never offline),
  then its barcode shard (`load.ts janItem`: `jan/<last 2>.json`, ~5 KB gzipped, cached on use: 12,268 codes in
  100 files, 1.4 MB, 0.5 MB gzipped; counter `found.jan`; past 6 s unanswered, on to OFF).
- **Online fallback** (`lib/scan/off.ts`): a code we lack goes to Open Food Facts' API v2
  (`/api/v2/product/<code>.json`, a few fields; CORS open; CSP `connect-src` names that path only). Only the
  number is sent: no cookies, no referrer, no image. Its answer becomes an item per 100 g (kcal from kJ if needed; a
  value out of a snapshot's range is null; then the [data checks](#data-checks)' rules, never dropping it), with 1食分
  from `serving_quantity`. Its name and brand cleaned as
  the record cleans a food's name (`cleanLine`, 60 characters); a product with no name left or no energy counts as not
  found. Its id is `off:<code>`, as one of ours would be (a later `products.json` holding it matches
  it), and its `note` 「Open Food Factsの値（オンライン）」 is the amount's trust line. The products' ODbL credit in
  データの出典 covers it.
- **Stored** as any food: the `food` op's snapshot carries the name and the values inline (`contract/food.ts`
  FoodSnap), so the entry shows the same on every phone and offline. There was no contract change.
- **Blocked and mine**: a code `food_fixes.json` drops (index.json `drop`, written by `food-data.ts`; the guard
  checks it lists every drop) is not found at once, never asked of OFF; a live answer part per serving
  (`off.ts partialScaling`, `off.py`'s rule) is not found either. A マイ食品 made from a product by 表示値を確認's 直す
  keeps its barcode (`food_custom` `jan`): its owner's scan opens it first, and their search shows it in that product's row.
- **Logged** as one usage counter per outcome: `act:scan.mine` · `found` · `found.jan` · `fallback` · `miss` · `dropped` · `offline` · `late` (`create`: この商品を登録), and
  once a scanner session `perf.scan` (open → first frame and → read, decode p50/max, band grab p50, ms; how it ended),
  never the code or the name.

## Licensing obligations
The app's credits (データの出典, `components/food/FoodCredits.svelte`) show each dataset's header and the `verify.json`
sources as built; keep both when a source is added or changed. The raw downloads are never committed.
- **MEXT** (foods, and the values in dishes/eatout/MAFF/Takatsuki): cite 「日本食品標準成分表（八訂）増補2023年から引用」 and say what was modified (names, aliases and portions are ours; dish values are computed).
- **PDL1.0 / CC BY** (MAFF, Kumagaya, Kurume, Toyonaka, Takatsuki, Tokyo): attribution plus a 「加工して作成」 notice. Each file's `attribution` carries it.
- **ODbL** (Open Food Facts): attribution; share-alike: `products.json` and `jan/` are offered under ODbL 1.0.
- **CC BY-SA** (Wikipedia-derived aliases): only short names and readings are kept.
- **Kalori**: the header's `label`, `attribution`, `license` and `url` are its credit line; its pictures stay on `assets.kalori.jp` (hotlinked, never copied).
- **CC0** (JBFD, MEXT↔USDA table, Wikidata) and USDA FoodData Central (public domain): no obligation; credit as a courtesy (`verify.json` `sources` carries the credit lines).
