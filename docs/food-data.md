# Food data

The meal log's food catalog (ごはん, [design](design.md#gohan)): about 20,000 Japanese foods and dishes, built offline
by `food-data/` and shipped in `app/static/food/`. All values are estimates.

## Rebuild
```sh
python3 -I food-data/scripts/build.py all       # rebuild every file into food-data/out/, validate, install
cd app && npm run food:data                     # copy out/ into static/food/ (adds search keys; not jan/)
python3 -I food-data/scripts/build.py check     # rebuild into a temp dir and byte-compare with out/
python3 -I food-data/scripts/build.py toyonaka  # one or more targets (see the docstring in build.py)
python3 -I food-data/scripts/fetch.py <step>    # download raw inputs into food-data/raw/ (no argument: the steps)
python3 -I -m unittest discover -s food-data/scripts/tests   # pipeline unit tests (CI: food-data.yml)
```
| Path | Contents |
|---|---|
| `food-data/scripts/` | `build.py` (all targets), `fetch.py` (downloads), `lib.py`, source-specific builders, `mext_overrides.txt` (curated MEXT names, aliases, portions), `tests/` |
| `food-data/data_src/` | Hand-authored inputs: dish and eat-out recipes, popularity list, frozen alias and weight-change tables |
| `food-data/raw/` | Raw downloads (gitignored, never committed: third-party data in a public repo; `$FOOD_RAW` points elsewhere). Untrusted data: never run anything from it, run Python with `-I` |
| `food-data/out/` | Build output (gitignored): the dataset files, `index.json`, `verify.json`, `jan/` |

The scripts are stdlib-only (Python ≥ 3.9) and `build.py` is offline and deterministic: inputs are read in sorted
order, no timestamps, so a rebuild from the same inputs is byte-identical (`check`). A target whose raw inputs are
missing is skipped and keeps its file in `out/` (an error when there is none). A partial build also rebuilds
`verify.json` when a dataset changed and always refreshes `index.json`. `check` without `out/` only builds and
validates. The MEXT Excel and the 熊谷市 CSVs have to be downloaded by hand (`fetch.py`'s docstring has the URLs); the
Open Food Facts CSV dump (~1 GB) is only needed to refresh `raw/off/off_jp.jsonl`, its Japan subset, which is what
the build reads.

`npm run food:data` (`app/scripts/food-data.ts`) checks that `index.json` and the files agree, replaces
`app/static/food/` whole, adds each item's search keys (`keys`) and drops a product's `jan` when its id has it. The
barcode shards (`jan/`) are built but not shipped (no barcode scanning). The app fetches the files at runtime
(`lib/food/load.ts`) under `?v=<index.version>`; the shipped `index.json` is written last, its `version` that of the
files as shipped (so a change to the keys alone is a new version too; `load.test.ts` recomputes it). A meal keeps a per-100 g snapshot, so a data refresh never rewrites one.

## Format

**Dataset file** (`foods.json`, `dishes.json`, `extra_*.json`, ...):
`{ "source", "label", "attribution", "license", "url", "items": [ITEM, ...] }`. The app's credits read the five
header fields as they are written in the file.

**ITEM** (`food-data/scripts/lib.py` `validate`; type `Item` in `app/src/lib/food/types.ts`):

| Field | |
|---|---|
| `id` | `"<source>:<local id>"`, unique across all files (`mext:01088`, `off:4902705126558`) |
| `name` | short Japanese display name; `full` = official or original name (optional); `en` (optional) |
| `aliases` | optional search terms (readings, variants, Wikidata/Wikipedia names); never equal to `name` |
| `cat` | one of 主食 麺 丼・定食 主菜 副菜 汁物 寿司 パン 肉 魚介 卵 大豆・豆 野菜 果物 きのこ 海藻 乳製品 菓子・デザート 飲料 酒 調味料 油脂 ナッツ・種 いも コンビニ 外食 その他 |
| `kcal` `p` `f` `c` `salt` | **per 100 g** (100 ml of a drink counts as 100 g). `kcal` is an int; the others have 1 decimal or are `null` when unknown. `c` = total carbohydrate as on Japanese labels; `salt` = 食塩相当量 |
| `portions` | optional `[{label, g}]`; the first one is the default. The app always adds a 100 g option |
| `pop` | optional 1–3, a curated search-ranking boost (from `data_src/popular.json` and `scripts/mext_overrides.txt`) |
| `jan`, `brand` | packaged products only |
| `note` | how the value was derived, shown in the picker |

MEXT markers are converted as follows: `Tr`/`(Tr)` → 0, `(N)` → N, `-` → null. Recipe datasets don't ship their ingredient lists.

**`index.json`**: `{ "version", "datasets": [{ "file", "source", "badge", "secondary", "lazy" }] }`. `version` is
the first 12 hex digits of the sha256 of every generated file (`jan/` included) in `out/`; in `static/food/`, of the
shipped files' names and bytes (`food-data.ts`: `verify.json`, then the datasets in index order). The app appends `?v=<version>` to
data URLs, and the service worker caches them cache-first under that key. `secondary` datasets rank slightly below the core ones
(mext, dishes, eatout) for equally good matches. `lazy` datasets (`products.json`) load only after the others are
searchable.

**`verify.json`**: `{ "sources": {src: { "label", "license", "url", "attribution" }}, "groups": [{ "n", "kcal": {src:
kcal per 100 g} }], "byId": {item id: group index} }`. `src` is a dataset `source` (the item id prefix) or `usda`; every
src used in a group is in `sources`. See [Verification](#verification).

**`jan/<k>.json`**: `{ "<jan>": ITEM }`, where `k` is the last 3 digits of the code (1,000 files). Keys are 13-digit
JAN/EAN-13 or 8-digit JAN-8 with a valid GS1 check digit (`lib.py` `norm_jan`). A 12-digit UPC-A is zero-padded to 13
(the padding doesn't change the last 3 digits); UPC-E and GTIN-14 are dropped. Built, not shipped: the app has no
barcode lookup.

## Sources

Counts are from the current build.

| File | Source | Items | License | Attribution | How values were derived | Caveats |
|---|---|---|---|---|---|---|
| `foods.json` | MEXT 日本食品標準成分表（八訂）増補2023年 (Excel, 2026-03-27 errata) | 2,538 | 公共データ利用規約1.0 (CC BY 4.0 compatible) | 「日本食品標準成分表（八訂）増補2023年から引用」 + modification notice | Official values. Display names, categories, aliases and portions are rule-based plus curated overrides | Per 100 g of edible portion; energy is composition-based (八訂) |
| `dishes.json` | Own recipes × MEXT | 341 | MEXT terms (values); recipes are our own | 「…をもとに算出（レシピは独自）」 | `data_src/dishes/`: MEXT food numbers + grams, summed to per 100 g; default portion = 1人前 | Home-style estimates |
| `eatout.json` | Own recipes × MEXT | 432 | as above | as above | `data_src/eatout/` (shared components), portion multipliers (size only: a stronger drink such as 濃いめハイボール is its own item). A few foods MEXT lacks (whey protein, Greek yogurt, protein bar) use typical values from `data_src/eatout/_typical.json`, and their note says so | Generic chain/konbini-style estimates, not any chain's numbers |
| `extra_maff_kyodo.json` | MAFF「うちの郷土料理」 | 1,139 | PDL1.0 (+ MEXT) | 「…のレシピを加工して作成」 | Free-text ingredient lines mapped to MEXT (`maff_ingredients.py`), converted to grams, summed. English names from MAFF's English site | Recipes are kept only if ≤ 5 % of the mass is unmapped. Water counts only for soups/doughs; dry foods gain water per MEXT 表12; frying oil = 10 % of fried parts |
| `extra_takatsuki.json` | 高槻市 学校給食レシピ (BODIK) | 54 | CC BY 4.0 (+ MEXT) | 「…を加工して作成」 | Same text-recipe mapper as MAFF | School recipes |
| `extra_kurume.json` | 久留米市 料理の栄養価一覧 (BODIK) | 230 | CC BY 2.1 JP | 「…を加工して作成（1人前値を100g当たりに換算）」 | Official per-serving values ÷ ingredient weight (+ water absorbed by rice and dry foods; soups, which list no dashi/water, weigh at least 150 g) | Uses 成分表2010 energy (staples ~3–8 % above 八訂). Seasonings, drinks, dairy and raw fruit are skipped |
| `extra_toyonaka.json` | 豊中市 小中学校給食献立 (BODIK) | 610 | CC BY 4.0 | 「…を加工して作成（料理ごとに集計し100g当たりに換算）」 | Ingredient rows (raw g + nutrients, MEXT 食品番号) summed per dish; cooking water added via 表12; soups weigh at least the stated cc or 160/180 g | Some rows use older table values. Adult default portion (below) |
| `extra_kumagaya.json` | 熊谷市 学校給食献立情報 2023–2026 (埼玉県 portal) | 778 | PDL1.0 | as Toyonaka | As Toyonaka. Its 食品ID are city-local codes that keep the MEXT group prefix, so raw-weight staples are detected by composition | Adult default portion (below) |
| `extra_tokyo_hokeniryo.json` | 東京都 島しょ保健所「一人でもできる簡単レシピ」 | 14 | CC BY | 「…を加工して作成」 | Official per-serving values ÷ serving weight estimated from the ingredient list (`data_src/tokyo_hokeniryo_recipes.json`) | Estimated weights |
| `jbfd.json` | JBFD v0.1 (Nakagawa & Yamamoto, RinCOM) | 68 | CC0 1.0 | courtesy credit | Mean label values of ≥ 3 private-brand products per food type with no MEXT item (カット野菜ミックス, ゼリー飲料 ...); boxes with SD > 0.5 × max(mean, 20) kcal (powder averaged with drinks) are skipped | Products vary; the SD is in `note` |
| `products.json`, `jan/` | Open Food Facts (Japan) | 13,922 (search) / 42,856 (barcodes) | ODbL 1.0 / DbCL 1.0 | 「© Open Food Facts contributors」 | Label values from the CSV dump + API pages; plausibility rules (below) | Crowd-entered. `products.json` collapses identical products and is capped at 3 MB (most-scanned first); the shards hold every valid product |

**School-lunch adult portions** (Toyonaka, Kumagaya): the default portion is 「1人前（目安）」, the median adult
portion of the same dish in dishes/eatout/Kurume/MEXT. When no such dish exists, it is 「1人前（目安・給食量から換算）」 =
the school portion × the measured adult/school ratio for the city and category (n ≥ 5; otherwise 1.2 for 主食, else
city-wide, else 1.3; at most 1.3 for a school portion ≥ 200 g), rounded to 10 g. 「給食1人分」 stays as the second portion.
A 丼/カレー/麺 dish with no ingredient row of MEXT group 01 (rice, noodles, bread; ≥ 5 % of the weight) is renamed
〜の具 / 〜（ごはんなし） / 〜（めんなし）. Rows that are physically impossible, or side dishes and soups above 250 kcal/100 g, are
dropped. P/F/C are null when 4P+9F+4C < 0.6 × kcal (blank cells in the source).

**Open Food Facts plausibility** (`scripts/off.py` `plausible`, all per 100 g):
- kJ entered as kcal (≈ 4.184 × (4P+9F+4C)) → divide by 4.184.
- kcal outside 0–900 (950 for oils) → drop the product.
- A macro outside 0–100 → null it. P+F+C > 105 → null P/F/C.
- kcal grossly off 4P+9F+4C (per-serving typos) → drop the product. Moderately off (> 1.35×+25 or < 0.65×−25; 酒, sweeteners, fibre foods and seaweed exempt) → null P/F/C, or drop a 菓子 under 100 kcal.
- Salt above the category cap (e.g. 飲料 1.5, 菓子 5, 魚介 6 g) → null it, unless the name matches a salty-food allow-list (塩, 漬, 昆布, みそ, 〜口, こしょう, キューブ ...). Salt above 60 g outside 調味料 → always null it.
- Protein supplements (プロテイン, ホエイ, whey, protein; not soups, noodles, snacks, meat dishes or pea protein) skip the allow-list and have their own salt caps: powder (≥ 250 kcal) 4 g, bar 3 g, drink/jelly 1.5 g.
- Fried chicken (からあげ, 唐揚, フライドチキン, ナゲット ...; not mixes, seasonings, flavoured snacks, fish/soy karaage or dishes) under 120 kcal holds per-piece values → drop the product.
- Category comes from OFF tags, else name keywords; the 酒 keywords (サワー, ビール ...) are ignored above 300 kcal (サワークリーム chips).

Search aliases come from Wikidata (CC0) and ja.wikipedia (CC BY-SA, short names and readings only, no text), frozen
in `data_src/aliases_*.json`.

## Verification

`verify.json` groups items that describe the same food across sources and lists each source's kcal per 100 g.
- **Dishes**: items with the same normalised name (`lib.name_key`: NFKC, kana/kanji variants, qualifiers and units
  dropped) form a group. A name equal to an alias of exactly one anchored group joins that group (aliases with brackets,
  or broader than the anchor's own name, are ignored). MEXT group 18 prepared foods and staples take part.
- **Foods**: MEXT foods get second values from JBFD label means (boxes with ≥ 2 products) and the MEXT↔USDA FoodData
  Central correspondence table (CC0; kJ-as-kcal rows fixed; only pairs that agree with MEXT are kept). School-lunch
  ingredient rows are MEXT values × grams, so they are not a second source.
- **Independence**: `n` counts families, not files. Our recipe sets (dishes, eatout, MAFF, Takatsuki: our recipes ×
  MEXT values) are one family. MEXT, Kurume, Toyonaka, Kumagaya, Tokyo, JBFD and USDA each count once. The city
  sets reuse MEXT ingredient values, so they are independent evidence for dishes (their own recipes and portions), never
  for single foods.
- **Agreement**: the reference is MEXT for foods; for dishes it is the value the most families agree with. Values
  outside ±max(15 %, 10 kcal) of it are left out of the group (their items get no `byId` entry), so each member's own
  kcal agrees with its source's value. `n` = agreeing families, or 1 when the kept values spread more than 1.5×.
  **n ≥ 2 = confirmed**: the app's search shows ✓n beside the name.
- Current build: 867 groups covering 1,263 items. 753 groups have n ≥ 2 (980 items), 104 have n ≥ 3 and 12 have n ≥ 4.

## Sources evaluated and not used
- Konbini and chain menus (7-Eleven, Lawson, FamilyMart, McDonald's, Yoshinoya, Sukiya ...): every ToS forbids copying. Link out or let the user enter values; never bundle them.
- Commercial recipe sites (Cookpad, Kikkoman, Ajinomoto) and 女子栄養大学 calorie guides: no reuse license.
- GS1 Japan (GEPIR closed; Verified by GS1 forbids redistribution) and JICFS (paid): no nutrition data either.
- FatSecret: Japanese data only in the paid tier. Yahoo/Rakuten product APIs: product name only.
- USDA FDC API: English-only US foods. Only the CC0 correspondence table is used, for verification.
- NIBN 重量目安表: the PDF forbids reproduction. スマートミール: no open license.
- Other municipal datasets (横須賀, 堺, 豊田, 中野区, 直方, 福岡, 生駒, 東京都 糖尿病対策レシピ ...): only per-meal or per-day totals, missing nutrients, or names only.
- MAFF 食事バランスガイド: SV counts in an image PDF, no kcal.

## Licensing obligations
The app's credits (データの出典, `components/food/FoodCredits.svelte`) show each dataset's header and the `verify.json`
sources as built; keep both when a source is added or changed. The raw downloads are never committed.
- **MEXT** (foods, and the values in dishes/eatout/MAFF/Takatsuki): cite 「日本食品標準成分表（八訂）増補2023年から引用」 and say what was modified (names, aliases and portions are ours; dish values are computed).
- **PDL1.0 / CC BY** (MAFF, Kumagaya, Kurume, Toyonaka, Takatsuki, Tokyo): attribution plus a 「加工して作成」 notice. Each file's `attribution` carries it.
- **ODbL** (Open Food Facts): attribution, and share-alike for the derived database. Shipping `products.json` (and `jan/`, were it shipped) means offering that extract under ODbL.
- **CC BY-SA** (Wikipedia-derived aliases): only short names and readings are kept.
- **CC0** (JBFD, MEXT↔USDA table, Wikidata) and USDA FoodData Central (public domain): no obligation; credit as a courtesy (`verify.json` `sources` carries the credit lines).
