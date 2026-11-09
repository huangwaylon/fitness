# Food data

The meal log's food catalog (ごはん, [design](design.md#gohan)): about 20,000 Japanese foods and dishes, built offline
by `food-data/` and shipped in `app/static/food/`. All values are estimates.

## Rebuild
```sh
python3 -I food-data/scripts/build.py all       # rebuild every file into food-data/out/, validate, install
cd app && npm run food:data                     # copy out/ into static/food/ (adds core search keys; not jan/)
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
`app/static/food/` whole, adds each core item's search keys (`keys`; a lazy dataset's, products' 239 KB gzipped, are
built on load in `db.ts`'s slices: about 90 ms more main thread at 4× CPU, ≤ 22 ms a slice) and drops a product's `jan`
when its id has it (`load.ts` puts it back). The
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
| `fib` `alc` | optional, per 100 g, 1 decimal (0–100), **absent when unknown**: `fib` = 食物繊維総量, `alc` = アルコール (pure alcohol, g). MEXT's own (FIB-, ALC); the recipe sets sum their MEXT ingredients' (as P/F/C: unknown only when every ingredient lacks it); the school lunches sum their 食物繊維 rows. `alc` only on a 酒 (`lib.tidy`: a dish's or a seasoning's みりん, 料理酒 or 奈良漬 mostly cooks off, and would read as drinking). Kurume, Tokyo, JBFD and the products have neither (their sources don't give them; the OFF Japan subset keeps no fibre) |
| `portions` | optional `[{label, g}]`; the first one is the default. The app always adds a 100 g option |
| `pop` | optional 1–3, a curated search-ranking boost (from `data_src/popular.json` and `scripts/mext_overrides.txt`); -1 ranks a rare form lower: MEXT's lab and rare forms (`mext_names.py` RARE: キャベツ カット 常法洗浄, 卵 素揚げ, a meat's 脂身 alone) and a school lunch named after a story (`build.py` STORY: 「かさこじぞう」の恩返し味噌汁) |
| `vg`, `st` | MEXT only, optional: one food in its states (豚ロース 脂身つき 生 · 焼き · ゆで; `mext_names.py` variant_groups): `vg` the group's default item's id, `st` the item's state as the app's chip says it (乾 生 ゆで 水煮 蒸し 焼き レンジ いため ソテー). The items whose official name differs only in its last word, a state; 2+ in distinct states, none named as the stem alone; fried ones and a state with a note stay apart. The default: the most popular, then 生, then ゆで. 281 groups, 647 items |
| `jan`, `brand` | packaged products only |
| `note` | how the value was derived, shown in the picker |
| `desc` | optional 「これは…」 line (≤ 40 characters, no final 。): what an unfamiliar food or dish is and what it looks like. See [Descriptions](#descriptions) |
| `gloss` | optional everyday Japanese name shown under the food's own (≤ 20 characters, Japanese only): リーキ → 西洋ねぎ, しらたき → 糸こんにゃく. From `data_src/glosses.json`, as `desc` (two sources each: MEXT 別名/備考, `mext_overrides.txt`, Wikidata labels/aliases, ja.wikipedia). Never a spelling or reading, a dish or use (とんかつ for 豚ロース), a broader category, or an archaic, botanical or regional name; most foods have none |

MEXT markers are converted as follows: `Tr`/`(Tr)` → 0, `(N)` → N, `-` → null (absent for `fib`/`alc`), a footnote mark
dropped (還元水あめ's fibre `14.0†`). kcal is MEXT's energy as given: it already holds alcohol's 7 kcal/g. Recipe datasets don't ship their ingredient lists.

**`index.json`**: `{ "version", "datasets": [{ "file", "source", "badge", "secondary", "lazy" }] }`. `version` is
the first 12 hex digits of the sha256 of every generated file (`jan/` included) in `out/`; in `static/food/`, of the
shipped files' names and bytes (`food-data.ts`: `verify.json`, then the datasets in index order). The app appends `?v=<version>` to
data URLs, and the service worker caches them cache-first under that key. `secondary` datasets rank slightly below the core ones
(mext, dishes, eatout) for equally good matches. `lazy` datasets (`products.json`) load only when asked for (`db.wantMore`:
the search's open, or a day with a product logged), never with the tab's open. Each is parsed in a worker that ends
once nothing is left to parse; a dataset that comes in later (the products, a failed one fetched again) calls
`db.onAdd`, and the search searches again.

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
| `eatout.json` | Own recipes × MEXT | 439 | as above | as above | `data_src/eatout/` (shared components), portion multipliers (size only: a stronger drink such as 濃いめハイボール is its own item). A few foods MEXT lacks (whey protein, Greek yogurt, protein bar) use typical values from `data_src/eatout/_typical.json`, and their note says so | Generic chain/konbini-style estimates, not any chain's numbers |
| `extra_maff_kyodo.json` | MAFF「うちの郷土料理」 | 1,123 | PDL1.0 (+ MEXT) | 「…のレシピを加工して作成」 | Free-text ingredient lines mapped to MEXT (`maff_ingredients.py`), converted to grams, summed. English names from MAFF's English site | Recipes are kept only if ≤ 5 % of the mass is unmapped, and not when the staple or the dish's own fish/meat is 適量 (not 「お好みで」), a serving weighs over 1.5 kg (no servings or pieces: the recipe over 10 kg; bulk festival recipes), or tofu is made from dry soybeans. 「16枚（1枚30g）」 = 16 × 30 g, a range's middle. A seasoning 適量 with no other salt: salt unknown (null). Water counts only for soups/doughs; dry foods gain water per MEXT 表12; frying oil = 10 % of fried parts |
| `extra_takatsuki.json` | 高槻市 学校給食レシピ (BODIK) | 54 | CC BY 4.0 (+ MEXT) | 「…を加工して作成」 | Same text-recipe mapper as MAFF | School recipes |
| `extra_kurume.json` | 久留米市 料理の栄養価一覧 (BODIK) | 230 | CC BY 2.1 JP | 「…を加工して作成（1人前値を100g当たりに換算）」 | Official per-serving values ÷ ingredient weight (+ water absorbed by rice and dry foods; soups, which list no dashi/water, weigh at least 150 g) | Uses 成分表2010 energy (staples ~3–8 % above 八訂). Seasonings, drinks, dairy and raw fruit are skipped |
| `extra_toyonaka.json` | 豊中市 小中学校給食献立 (BODIK) | 607 | CC BY 4.0 | 「…を加工して作成（料理ごとに集計し100g当たりに換算）」 | Ingredient rows (raw g + nutrients, MEXT 食品番号) summed per dish; cooking water added via 表12; soups weigh at least the stated cc or 160/180 g | Some rows use older table values. Adult default portion (below) |
| `extra_kumagaya.json` | 熊谷市 学校給食献立情報 2023–2026 (埼玉県 portal) | 773 | PDL1.0 | as Toyonaka | As Toyonaka. Its 食品ID are city-local codes that keep the MEXT group prefix, so raw-weight staples are detected by composition | Adult default portion (below) |
| `extra_tokyo_hokeniryo.json` | 東京都 島しょ保健所「一人でもできる簡単レシピ」 | 14 | CC BY | 「…を加工して作成」 | Official per-serving values ÷ serving weight estimated from the ingredient list (`data_src/tokyo_hokeniryo_recipes.json`) | Estimated weights |
| `jbfd.json` | JBFD v0.1 (Nakagawa & Yamamoto, RinCOM) | 66 | CC0 1.0 | courtesy credit | Mean label values of ≥ 3 private-brand products per food type with no MEXT item (カット野菜ミックス, ゼリー飲料 ...); boxes with SD > 0.5 × max(mean, 20) kcal (powder averaged with drinks) are skipped, and so are boxes whose kcal is over twice 4P+9F+4C + 30 (label bases mixed: レギュラーコーヒー粉) | Products vary; the SD is in `note` |
| `products.json`, `jan/` | Open Food Facts (Japan) | 13,916 (search) / 42,850 (barcodes) | ODbL 1.0 / DbCL 1.0 | 「© Open Food Facts contributors」 | Label values from the CSV dump + API pages; plausibility rules (below) | Crowd-entered. `products.json` collapses identical products and is capped at 3 MB (most-scanned first); the shards hold every valid product |

**School-lunch adult portions** (Toyonaka, Kumagaya): the default portion is 「1人前（目安）」, the median adult
portion of the same dish in dishes/eatout/Kurume/MEXT. When no such dish exists, it is 「1人前（目安・給食量から換算）」 =
the school portion × the measured adult/school ratio for the city and category (n ≥ 5; otherwise 1.2 for 主食, else
city-wide, else 1.3; at most 1.3 for a school portion ≥ 200 g), rounded to 10 g. 「給食1人分」 stays as the second portion.
A 丼/カレー/麺 dish with no ingredient row of MEXT group 01 (rice, noodles, bread; ≥ 5 % of the weight) is renamed
〜の具 / 〜（ごはんなし） / 〜（めんなし）. Rows that are physically impossible, or side dishes and soups above 250 kcal/100 g, are
dropped, and so are bread spreads (〜クリーム, ソース クラス, チルドチョコ, as ジャム and マーガリン). P/F/C are null when 4P+9F+4C
< 0.6 × kcal (blank cells in the source), or when a row's protein and fat alone exceed its energy (a typo). A blank cell is
a zero only where the row needs none (`build.py` `blank_null`): salt is null when rows with protein but a blank salt cell
hold ≥ 20 % of the dish's kcal and the rest adds up to no salt (さわらの西京焼); carbohydrate, when rows whose energy protein
and fat don't explain leave it blank (いかフライ); fibre, when plant rows (MEXT groups 01, 02, 04–09) with a blank 食物繊維 cell hold
≥ 20 % of the kcal (Kumagaya leaves meat, milk, oil and seasoning rows blank: those are none), or no row has one.

**Open Food Facts plausibility** (`scripts/off.py` `plausible`, all per 100 g):
- kJ entered as kcal (≈ 4.184 × (4P+9F+4C)) → divide by 4.184.
- kcal outside 0–900 (950 for oils) → drop the product.
- A macro outside 0–100 → null it. P+F+C > 105 → null P/F/C.
- kcal grossly off 4P+9F+4C (per-serving typos) → drop the product. Moderately off (> 1.35×+25 or < 0.65×−25; 酒, sweeteners, fibre foods and seaweed exempt) → null P/F/C, or drop a 菓子 under 100 kcal.
- Salt above the category cap (e.g. 飲料 1.5, 菓子 5, 魚介 6 g) → null it, unless the name matches a salty-food allow-list (塩, 漬, 昆布, みそ, 〜口, こしょう, キューブ ...). Salt above 60 g outside 調味料 → always null it.
- Protein supplements (プロテイン, ホエイ, whey, protein; not soups, noodles, snacks, meat dishes or pea protein) skip the allow-list and have their own salt caps: powder (≥ 250 kcal) 4 g, bar 3 g, drink/jelly 1.5 g.
- Fried chicken (からあげ, 唐揚, フライドチキン, ナゲット ...; not mixes, seasonings, flavoured snacks, fish/soy karaage or dishes) under 120 kcal holds per-piece values → drop the product.
- Category comes from OFF tags, else name keywords; the 酒 keywords (サワー, ビール ...) are ignored above 300 kcal (サワークリーム chips),
  and words that hold a keyword without being one are rewritten first (`NAME_FALSE_FRIENDS`: さば水煮 is no 水, 茶碗蒸し no 茶,
  出汁の唐揚げ no 汁, パンプキン no パン, だし巻き no だし); a bare 巻 means 寿司 only when nothing else matched (春巻, チーズ巻).
- An alcoholic drink at 0 kcal (ストロング, 檸檬堂, n % ...; not ノンアル) has lost its energy → drop the product.
- Creatine (クレアチン, not a protein powder with it): Japanese labels count its nitrogen as protein (5 g: P 4.4 g, 18 kcal);
  it is neither a protein nor an energy source → P 0 and kcal = 4C + 9F (a flavoured one's sugar), with a note saying so.

Our recipe sets name a dish once (`build.py` `qualify`): a name an earlier set (dishes, eatout, MAFF, Takatsuki) holds
at another kcal says what differs, エビマヨ（お店）, 麻婆豆腐（給食）, and a MAFF dish sharing a name takes its prefecture
(雑煮（三重県）). A name never carries its reading: MAFF's title reading (「味噌汁（麦味噌）（みそしる（むぎみそ)）」, `recipes_text.split_title`) and a
label's (豆板醤（トウバンジャン）, `lib.READINGS`) move to the aliases. Search aliases come from Wikidata (CC0) and ja.wikipedia (CC BY-SA, short names and readings only, no text), frozen
in `data_src/aliases_*.json`. MEXT's kana gives way to the everyday spelling where the dishes use it (`mext_names.py` EVERYDAY: ほうれん草,
芽キャベツ; the kana stays an alias). MEXT's rule-based aliases (`mext_names.py` TOKEN_ALIASES) give an animal's own names
(豚肉, 牛肉, 鶏肉) to its cuts, not to its processed meats or offal (`PROCESSED_MEAT`: 豚肉 found ベーコン first), and ライス only
to cooked rice (01088's override), not to every 米 food (米粉, おもゆ).

## Descriptions
`data_src/descriptions.json` holds our own one-line descriptions, `{"mext" | "dishes" | "eatout" | "maff_kyodo": {key:
{"d": line, "src": [source, ...]}}}`; the build sets an item's `desc` from them (`build.py` `attach_desc`). A MEXT key is
the food's group and the tokens of its official name, the class marks dropped (`10 しろさけ イクラ`; a generic first token
keeps its class: `06 なす 漬物 しば漬`); the longest key matching the start of a food's tokens wins, `*` stands for any one
token, so cuts and raw/boiled variants share a line. The other sections key by the item's local id. `"d": ""` gives no
line (also a narrower key's way to drop a broader one's), and a key matching no item fails the build.
- **Two sources per line.** Every fact in a line is stated by at least two independent sources, listed in `src`
  (build-time only, never shipped): `mext:<食品番号>` (the 成分表's 食品群別留意点, 備考 or 別名), `wp:<title>` (ja.wikipedia),
  `wd:<QID>` (the Wikidata description), `maff:<page>` (うちの郷土料理). A line the sources don't both confirm stays empty.
  Each batch is checked by an independent pass against the same sources before it ships.
- **Plain and factual.** No health or nutrition claims (`DESC_BANNED`), no Wikipedia sentence copied: the lines are
  ours, written from the facts. Everyday foods (ごはん, 牛乳) have none. The amount shows a line beside the food's name
  and `gloss`, so it never repeats them (`lib.validate`), and another name in it says so (「…。しなちくとも」, not 「…。しなちく」).
- **Everyday names** (`gloss`, `data_src/glosses.json`) work the same way, sources `mext:` (別名), `ov:` (`mext_overrides.txt`),
  `wd:` (labels/aliases) and `wp:`.
- **Credit.** MEXT's attribution says the descriptions are ours (「説明文は本アプリで加工・追加」); the MAFF dataset's covers
  its dishes'. Wikipedia and Wikidata are only sources of facts for our own wording (no text is shipped).

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
- Current build: 867 groups covering 1,266 items. 753 groups have n ≥ 2 (982 items), 104 have n ≥ 3 and 12 have n ≥ 4.

## Pictures
ごはん's food pictures are AI-generated イメージ (ours: Z-Image-Turbo, Apache-2.0, run locally) of generic foods and
dishes, in one style (coloured pencil and watercolour on the paper colour): 5,026 pictures cover all 6,185 generic foods
(907 sheets). Packaged products and custom foods keep their category's tile. `food-data/images/fi.py` (its docstring has the commands) does the following:
- **Table** (`food-data/images/table/*.json`, hand-written): one row per visual concept, `{key, ja, desc, items}`. Variants
  that look alike share a row (脂身つき / なし, 和牛 / 輸入牛, a dish's sizes, the same dish in dishes and eatout); states
  that look different get their own (生 / 焼き, 乾 / ゆで). `desc` is a short English description of what the food looks
  like. A name alone draws the wrong food (白和え as a potato, ほうとう as bread). `propose <phase>` drafts the groups,
  and `rows` turns `name|name = description` lines into rows.
- **Generation** (`gen`, the mflux tool's Python, about 15–50 s per image on a shared GPU): the prompt (`PROMPT`,
  `PROMPT_V`) with the row's `desc`, seed `crc32(key) % 100000 + roll`, 9 steps, 512 px. Images are cached in
  `$FOOD_IMG_RAW/gen/` (default ~/food-images-raw, outside the repo), so a re-run skips what exists and is resumable.
- **Checks** (optional; not run yet): the images ship unchecked, listed in `food-data/images/shipped.json`
  (each key's description, seed, prompt hash and `checked: false`). The checks, when run (`FI_CHECKS=1`), are
  (a) `verify`: a second vision model (qwen via ollama) compares each image with at least 2 vetted reference photos
  (`refs`: Commons, Wikidata P18, Wikipedia, the MAFF photos; look-only, kept outside the repo, never shipped);
  (b) a by-eye review of `checksheet` contact sheets, logged with `eye`. A wrong image is re-rolled (at most 2 times) and
  then goes back to the tile. Every verdict is appended to `verdicts.jsonl`.
- **Pack** (`pack`, PIL): it evens the background to the paper colour (#F5E4BC, a per-channel gain from the border's median), then
  writes webp q72 sprite sheets into `app/static/food-img/`. Thumbnail sheets hold 4 × 4 cells of 128 px (webp q65) (rows, 40–64 px
  at 3×). Detail sheets hold 3 × 3 cells of 384 px (the amount's 160 px picture: one open fetches ~100 KB and decodes 5.3 MB). Thumbnail sheets are per search
  neighbourhood (`FAMILY`: a row whose name holds a common search word, e.g. カレー or 卵, sits with that word's family,
  else with its category), so a common search's top 20 download about 100 KB of thumbnails; detail sheets go by category. Popular
  items come first. `slots.json` is append-only, so a full sheet never changes. The names carry the content hash (cached for a year, `scripts/headers.ts`).
  `index.json` maps each food id to its picture's two cells (`lib/food/images.ts` `imgOf`).
- **Budget** (`lib/food/images.test.ts`): ≤ 1,100 files and 90 MB in food-img/ (projected over the whole table, within static/'s file cap, `lib/static-budget.ts`: 18,000 = Pages' 20,000 less the build's ~1,000 and a 1,000 margin), a common search's top 20 ≤ 120 KB of thumbnails on average (350 at most), ≤ 400 KB a sheet, ≤ 19,000 files under
  static/ (Cloudflare Pages takes 20,000 a deploy), and every generic food in a table row (a new catalogue item fails the test until it has one). The service worker caches the sheets on first use (`FOOD_IMG_CACHE`),
  never at install.

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
