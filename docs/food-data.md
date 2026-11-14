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
| `food-data/raw/` | Raw downloads (gitignored, never committed: third-party data under its own licences; `$FOOD_RAW` points elsewhere). Untrusted data: never run anything from it, run Python with `-I` |
| `food-data/out/` | Build output (gitignored): the dataset files, `index.json`, `verify.json`, `jan/` |

The scripts are stdlib-only (Python ≥ 3.9); `build.py` is offline and deterministic (sorted inputs, no timestamps), so
`check` is byte-exact. A target whose raw inputs are missing keeps its file in `out/` (an error when there is none). The
MEXT Excel and the 熊谷市 CSVs are downloaded by hand (`fetch.py`'s docstring has the URLs); the ~1 GB Open Food Facts
dump is needed only to refresh its Japan subset, `raw/off/off_jp.jsonl`, which the build reads.

`npm run food:data` (`app/scripts/food-data.ts`, its header has the checks) replaces `app/static/food/` whole; `jan/`
is built but not shipped (no barcode scanning). The app fetches each file (`lib/food/load.ts`) under its own `?v=`
(index.json's `files`), so a refresh of one file (Kalori's) refetches that file alone. A meal keeps a per-100 g
snapshot, so a data refresh never rewrites one.

## Format

**Dataset file** (`foods.json`, `dishes.json`, `extra_*.json`, ...):
`{ "source", "label", "attribution", "license", "url", "items": [ITEM, ...] }` (OFF adds `dumped`: the dump's
newest `last_modified_t`). The credits read the five header fields as written.

**ITEM** (`food-data/scripts/lib.py` `validate`; type `Item` in `app/src/lib/food/types.ts`):

| Field | |
|---|---|
| `id` | `"<source>:<local id>"`, unique across all files (`mext:01088`, `off:4902705126558`) |
| `name` | short Japanese display name; `full` = official or original name (optional); `en` (optional) |
| `aliases` | optional search terms (readings, variants, Wikidata/Wikipedia names); never equal to `name` |
| `cat` | one of 主食 麺 丼・定食 主菜 副菜 汁物 寿司 パン 肉 魚介 卵 大豆・豆 野菜 果物 きのこ 海藻 乳製品 菓子・デザート 飲料 酒 調味料 油脂 ナッツ・種 いも コンビニ 外食 その他 |
| `kcal` `p` `f` `c` `salt` | **per 100 g** (100 ml of a drink counts as 100 g). `kcal` is an int; the others have 1 decimal or are `null` when unknown. `c` = total carbohydrate as on Japanese labels; `salt` = 食塩相当量 |
| `fib` `alc` | optional, per 100 g, 1 decimal, **absent when unknown**: 食物繊維総量, アルコール (g). MEXT's own; the recipe sets sum their ingredients'; `alc` only on a 酒 (`lib.tidy`: a dish's みりん or 料理酒 cooks off) |
| `portions` | optional `[{label, g}]`; the first one is the default. The app always adds a 100 g option |
| `pop` | optional 1–3, a curated search boost (`data_src/popular.json`, `mext_overrides.txt`); -1 ranks a rare form lower (`mext_names.py` RARE, `build.py` STORY; a discontinued [Kalori](#kalori) item) |
| `vg`, `st` | MEXT only, optional: one food in its states (豚ロース 生 · 焼き · ゆで; `mext_names.py` variant_groups): `vg` the group's default item's id, `st` the state the app's chip shows |
| `jan`, `brand` | packaged products only |
| `note` | how the value was derived, shown in the picker |
| `desc` | optional 「これは…」 line (≤ 40 characters, no final 。): what an unfamiliar food or dish is and what it looks like. See [Descriptions](#descriptions) |
| `gloss` | optional everyday Japanese name under the food's own (≤ 20 characters: リーキ → 西洋ねぎ), from `data_src/glosses.json`, two sources each as `desc`; never a spelling, a dish, a broader category or an archaic name |

MEXT markers: `Tr`/`(Tr)` → 0, `(N)` → N, `-` → null (absent for `fib`/`alc`), a footnote mark dropped. kcal is MEXT's
energy as given (alcohol's 7 kcal/g included). Recipe datasets don't ship their ingredient lists.

**`index.json`**: `{ "version", "files", "datasets": [{ "file", "source", "badge", "secondary", "lazy" }] }`. `files`:
each shipped file's own cache key (`?v=`), 12 hex digits of the sha256 of its bytes; `version`: the same over all of
them (`food-data.ts`), every file's key for an index without `files` (an older build's; the service worker reads both). `secondary` datasets rank
slightly below the core ones (mext, dishes, eatout) on equal matches. `lazy` ones (`products.json`, `kalori.json`) load only when asked
for (`db.wantMore`: the search open, or a day with a product logged), parsed in a worker; a late dataset calls
`db.onAdd` and the search runs again.

**`verify.json`**: `{ "sources": {src: { "label", "license", "url", "attribution" }}, "groups": [{ "n", "kcal": {src:
kcal per 100 g} }], "byId": {item id: group index} }`. `src` is a dataset `source` (the item id prefix) or `usda`; every
src used in a group is in `sources`. See [Verification](#verification).

**`jan/<k>.json`** (built, not shipped): `{ "<jan>": ITEM }`, `k` the code's last 3 digits. Keys are JAN/EAN-13 or
JAN-8 with a valid check digit (`lib.py` `norm_jan`); UPC-A is zero-padded to 13, UPC-E and GTIN-14 dropped.

## Sources

| File | Source | Items | License | Attribution | How values were derived | Caveats |
|---|---|---|---|---|---|---|
| `foods.json` | MEXT 日本食品標準成分表（八訂）増補2023年 (Excel, 2026-03-27 errata) | 2,538 | 公共データ利用規約1.0 (CC BY 4.0 compatible) | 「日本食品標準成分表（八訂）増補2023年から引用」 + modification notice | Official values. Display names, categories, aliases and portions are rule-based plus curated overrides | Per 100 g of edible portion; energy is composition-based (八訂) |
| `dishes.json` | Own recipes × MEXT | 341 | MEXT terms (values); recipes are our own | 「…をもとに算出（レシピは独自）」 | `data_src/dishes/`: MEXT food numbers + grams, summed to per 100 g; default portion = 1人前 | Home-style estimates |
| `eatout.json` | Own recipes × MEXT | 439 | as above | as above | `data_src/eatout/` (shared components), size multipliers; a few foods MEXT lacks use typical values (`_typical.json`), said in their note | Generic chain/konbini-style estimates |
| `extra_maff_kyodo.json` | MAFF「うちの郷土料理」 | 1,123 | PDL1.0 (+ MEXT) | 「…のレシピを加工して作成」 | Free-text ingredient lines mapped to MEXT (`maff_ingredients.py`), converted to grams, summed | Kept only if ≤ 5 % of the mass is unmapped and the servings are plausible (the filters: `maff_ingredients.py`) |
| `extra_takatsuki.json` | 高槻市 学校給食レシピ (BODIK) | 54 | CC BY 4.0 (+ MEXT) | 「…を加工して作成」 | Same text-recipe mapper as MAFF | School recipes |
| `extra_kurume.json` | 久留米市 料理の栄養価一覧 (BODIK) | 230 | CC BY 2.1 JP | 「…を加工して作成（1人前値を100g当たりに換算）」 | Official per-serving values ÷ ingredient weight (+ water absorbed) | 成分表2010 energy (staples ~3–8 % above 八訂) |
| `extra_toyonaka.json` | 豊中市 小中学校給食献立 (BODIK) | 607 | CC BY 4.0 | 「…を加工して作成（料理ごとに集計し100g当たりに換算）」 | Ingredient rows (MEXT 食品番号) summed per dish, cooking water via 表12 | Adult default portion (below) |
| `extra_kumagaya.json` | 熊谷市 学校給食献立情報 2023–2026 | 773 | PDL1.0 | as Toyonaka | As Toyonaka (city-local codes keeping the MEXT group prefix) | Adult default portion (below) |
| `extra_tokyo_hokeniryo.json` | 東京都 島しょ保健所「一人でもできる簡単レシピ」 | 14 | CC BY | 「…を加工して作成」 | Official per-serving values ÷ serving weight estimated from the ingredient list (`data_src/tokyo_hokeniryo_recipes.json`) | Estimated weights |
| `jbfd.json` | JBFD v0.1 (Nakagawa & Yamamoto, RinCOM) | 66 | CC0 1.0 | courtesy credit | Mean label values of ≥ 3 private-brand products per food type with no MEXT item; spread-out or mixed-basis boxes skipped | The SD is in `note` |
| `products.json`, `jan/` | Open Food Facts (Japan) | 13,917 (search) / 42,850 (barcodes) | ODbL 1.0 / DbCL 1.0 | 「© Open Food Facts contributors」 | Label values; plausibility rules (below) | Crowd-entered; `products.json` deduplicated, ≤ 3 MB (most-scanned first) |
| `kalori.json` | kalori.jp chain and konbini menus ([Kalori](#kalori)) | (per build) | kalori.jp 利用規約 | 「kalori.jp（各社の公表値と kalori.jp の AI 推定値）」 | Shops' published values and Kalori's AI estimates, per serving | `est` marks estimates; may-be-discontinued items kept, marked |

**School-lunch adult portions** (Toyonaka, Kumagaya): the default portion is 「1人前（目安）」, the median adult portion
of the same dish elsewhere, else the school portion × the city's measured adult/school ratio (「目安・給食量から換算」);
「給食1人分」 stays the second. A rice or noodle dish without its staple is renamed 〜の具 / 〜（ごはんなし）; impossible
rows are dropped, and a blank cell is a zero only where the row needs none. The rules: `build.py` (`blank_null`).

**Open Food Facts plausibility** (`scripts/off.py` `plausible`, per 100 g; its comments give each threshold): kJ
entered as kcal fixed; kcal out of range, grossly off 4P+9F+4C, per-piece fried chicken or a 0-kcal alcoholic drink:
the product dropped; a macro out of range or moderately off: P/F/C nulled; salt over its category's cap (a salty-food
allow-list, protein supplements' own caps) nulled; the category from OFF tags, else name keywords (`NAME_FALSE_FRIENDS`
first; a drink word ending the name beats a flavour); creatine's nitrogen not counted as protein.

Our recipe sets name a dish once (`build.py` `qualify`): a name an earlier set (dishes, eatout, MAFF, Takatsuki) holds
at another kcal says what differs (エビマヨ（お店）, 雑煮（三重県）). A name never carries its reading (it moves to the
aliases: `recipes_text.split_title`, `lib.READINGS`). Search aliases come from Wikidata (CC0) and ja.wikipedia (CC
BY-SA, short names and readings only), frozen in `data_src/aliases_*.json`; MEXT's everyday spellings and rule-based
aliases: `mext_names.py` (EVERYDAY, TOKEN_ALIASES, PROCESSED_MEAT).

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
one style (coloured pencil and watercolour on the paper colour): 5,123 pictures cover all 6,185 generic foods, and
8,944 of the 13,917 packaged products show a generic picture of the same food. Custom foods and the other products
keep their category's tile. The pipeline is `food-data/images/fi.py` (its docstring: the commands, the prompt, the
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
  (`lib/food/images.ts` `imgOf`); a products.json rebuild re-matches only at the next pack (needs PIL). The service
  worker caches sheets on first use, never at install.
- **Budget** (`lib/food/images.test.ts`): ≤ 1,100 files and 90 MB in food-img/, ≤ 400 KB a sheet, a common search's
  top 20 ≤ 128 KB of thumbnails on average, and every generic food in a table row.

## Kalori
Chain and konbini menus (すき家, セブン, スタバ ...) from kalori.jp, shipped as `kalori.json`, a lazy secondary dataset
like the products ([decisions](decisions.md#kalori-as-a-lazy-dataset)); public in git and on Pages by the owner's call,
knowingly over kalori.jp's terms (第8条), which had kept it out.

- **Source:** a release of this repo, `kalori-YYYY-MM-DD`, written by `food-data/scripts/kalori_scrape.py` in
  `kalori-scrape.yml` and pinned by `fetch.py`'s `KALORI_TAG`
  ([decisions](decisions.md#kaloris-raw-data-in-releases-the-scraper-in-food-data)). Its `shards/shard-0.jsonl` … `shard-19.jsonl` hold one line a product (compacted). Format v2 lines carry `nutrients`
  (only the rows the page shows, each `{v, est}`), `name`, `shop_name`, `shop_category`, `genre`, `ended`, `listed`,
  `image_id`, and from the scraper's move here `parser` (ignored), `table: false` (no nutrition table: every value the
  site's estimate, so `est` all true) and `gone: true` (the product left the site: as `listed: false`); v1 lines (no
  `nutrients`) are skipped. Per product (shop, id) the latest `fetched_at` wins.
- **Build:** `fetch.py kalori` (the pinned release's `kalori-data.tar.gz`, checked against its `SHA256SUMS`, refused
  unless its `coverage.json` is complete; the shards into `raw/kalori/`, the old ones removed), then `build.py kalori`
  (or `all`) → `out/kalori.json` (`kalori_convert.py`, its counts printed; alone: `python3 -I
  food-data/scripts/kalori_convert.py food-data/raw/kalori`), then `npm run food:data` (lazy: no search keys added). A
  partial input fails the build and writes nothing: one of `data_src/kalori_shops.json`'s shops with no items, or under
  45,000 items (the site lists ~54,000; a whole fetch ships ~53,800 after the drops); `KALORI_ALLOW_PARTIAL=1` writes
  it anyway, for a local or partial run. The steps: [runbook "Refresh Kalori"](ops/runbook.md#13-refresh-kalori).
- **A refresh** (`kalori-scrape.yml`, weekly and by hand): incremental, seeded from the accepted release's data and
  state (main's `KALORI_TAG`: a dated release whose update reached main; never a draft, a prerelease or one held).
  Every shop's listing is read (new products, a changed count, a product gone from it); a product is fetched again
  only when new, its sitemap `lastmod` changed, it failed before, an older `parser` wrote it (`PARSER_VERSION`) or it
  was fetched before `refetch_before`. One a site no longer has is written `gone`. The shard files are append-only
  during the run; `compact` keeps one line a product, and an unchanged site appends nothing. The diff against the
  accepted release gates publishing: over 15 % of products with changed values or 5 % missing refuses it (exit 6)
  unless `allow_big_diff`.
- **Cost:** ~2.5k listing requests a week plus the changed products, about 9k a month. kalori.jp allows ~1,000 requests
  an IP a day, so a refresh runs in rounds of 20 shards, each on a fresh runner (a new IP): the retry re-dispatches a
  shard that hit the limit, no cool-down. A full refetch (`refetch_before` today, or a `PARSER_VERSION` bump) is ~56k
  requests, 4-5 rounds.
- **Exit codes** (`kalori_scrape.py`): 0 done or out of budget, 1 a crash, 2 the 429 limit, 3 network errors (2, 3 and
  a shard job lost, timed out or cancelled alone are retried), 4 the pages no longer parse (never retried; no product
  marked as publishing no nutrition), 5 more new no-nutrition marks than max(25, 2 % of the fetches) (undone; never
  retried), 6 the diff over its limits. The **canary** runs first each round: the parsers on a few live pages; its exit 4 stops the round before
  a shard starts.
- **Releases:** `kalori-wip`, a prerelease while a refresh runs (`run.json` with its `since`, and per shard
  `state-N.json`, `shard-N.jsonl.gz`, each replaced by a newly named upload renamed after, never clobbered; deleted
  on publishing); `kalori-YYYY-MM-DD` (never "latest"):
  `kalori-data.tar.gz` (folders `shards`, `state`: `shard-N.jsonl`, `state-N.json`; `coverage.json`, `diff.json`,
  `run.json`) and `SHA256SUMS`, made a draft, its assets checked, then published (a failure deletes the draft). Only a
  run on main publishes; another `wip_tag` (`kalori-wip-<name>`), `only_shops` or `max_requests` is a test.
- **Into the app, no person:** `update-build` (read-only, no token: it runs npm) bumps `KALORI_TAG`, converts,
  ships kalori.json alone (`npm run food:data -- --only kalori`) and runs the tests. `update-merge` (no npm) takes
  none of it unchecked: its three files against BASE (the main it built on), kalori.json against its own conversion
  of the release, the gates from the report job's diff.json and coverage.json (digests checked) and the two
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
  `late` (no scheduled refresh in 8 days), `stuck` (a run over 2 days, a stale `running`).
- **The status:** `status.json` on the orphan branch `kalori-status` (one commit, force-pushed with a lease:
  `kalori_status.py` and `.github/scripts/kalori-status.sh`): the verdict, the reasons, the run, the accepted dataset,
  the diff, coverage, the merge, the alert and the last 12 runs; a round writes `running` at setup. The bots page's
  メニュー tab reads it: an alert shows as a dot there, no email. Each reason, pausing, undoing:
  [runbook "Refresh Kalori"](ops/runbook.md#13-refresh-kalori).
- **Lessons** (the first crawl: ~3.5 h, ~75-80k requests for 54k products): the site's cap
  is per IP a day, so rounds on fresh runners beat a slower rate; never change the record format mid-crawl (4.5k v1
  lines were fetched twice); anchor parsers on the data itself, not the page around it;
  a canary before each round turns a redesign into one red job, not 20 poisoned states; for the next full crawl, ask
  kalori.jp for a bulk export (their 429 page invites it).
- **The file:** a dataset (`source: kalori`) with `shops: {<id>: {name, aliases?}}` (the name: the shop's, else its
  id) and items `kal:<id>`: `shop` its id, values **per serving**, a value the page doesn't show `null` (`fib`
  absent), never 0; what every item would carry is the loader's (`db.ts withJan`): `sv: true` (one `1食` portion of a
  nominal 100 g, portionsOf's) and `brand` (its shop's name), so 53.8k items are 9.9 MB, not 14 (1.67 MB gzipped);
  `est` (`e`: kcal estimated, `p`: official kcal, estimated P, F or C, `s`: official kcal and PFC, estimated fibre or
  salt; absent: all official), `img` (the generated picture's id, hotlinked from `assets.kalori.jp`),
  `vg`/`st` for a trailing size or milk (牛丼 並盛 · 大盛, LL, ジャンボ, （Tall・豆乳）) and katakana aliases for
  Short/Tall/Grande/Venti. Our shop aliases (セブン, サイゼ ...) and display names (`{name}`, chawan) are
  `data_src/kalori_shops.json`.
- **Names:** half-width kana made full, newlines and doubled spaces folded, a trailing ` /` cut; then, each only where
  no two of the shop's names would meet, the shop's leading order code (`LEAD_CODES`: いかり's 【38】 and Ｓ/Ｏ/M,
  ビッグボーイ's and フライングガーデン's TO, コージーコーナー's 【1】; a letter code only before a space, TO also
  before 【 or Japanese), a ※ note (a bracketed (※2) anywhere,
  a trailing ※… with no space after it) or a trailing price (（税込…円）, 12,000円), and a name over 60 characters cut
  before its last bracket, comma or space.
- **Discontinued:** a page titled 販売終了かも？ (`ended`) or a product gone from the shop's listing (`listed: false`)
  stays, marked `ended: true` and `pop: -1` (ranked under the current menu; a current size is its variant group's default);
  its page shows no 推定 badges, so its values count as estimated (`est: e`), never official.
- **Categories:** the item's `genre` (`GENRE_CAT`; a pastry in a sweets shop, or a cake/tart one in a cafe, is
  菓子・デザート; an alcohol name (`ALCOHOL`: サワー, 酒, 緑茶ハイ ...) in a drink or soup genre is 酒); with no genre (or
  `other`), the name's (alcohol, sweets, drinks), else the shop's kind where it says (ramen/udon/soba, sushi,
  gyudon/teishoku, bread, sweets: `SHOP_CAT`), else その他.
- **Dropped:** no name or kcal; over the custom-food limits (5,000 kcal, 500 g, fibre 100 g); kcal off Atwater
  (4P+9F+4C) by over half and 50 kcal, alcohol aside, or 0 kcal with 10 kcal of protein and fat (`implausible`: 幸楽苑's
  47 kcal メガたんめん; a 0 kcal jelly or zero drink stays); an OFF product of
  the same name whose brand is the shop (the label wins; the same name by another maker stays); a near-duplicate (the
  shop's same name but for width or spaces: the current, then latest `lastmod`, then higher id stays); a long name that,
  cut, meets another. Never in `verify.json`: estimates get no ✓n.
- **On the phone:** ranked under the other secondary sets (`db.ts` KALORI_PENALTY), over the products; a shop's name
  or alias in the query scopes to its menu (`db.ts shopIn`); logged as an `sv` snapshot (whole servings, no grams).
- **Tests:** `food-data/scripts/tests/test_kalori_convert.py`, on invented rows; `test_fetch.py`, the release's
  checks on a local tarball; the scraper's own, on fixtures and a fake site (no network).

## Sources evaluated and not used
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
- **ODbL** (Open Food Facts): attribution; share-alike: `products.json` (and `jan/`, were it shipped) is offered under ODbL 1.0.
- **CC BY-SA** (Wikipedia-derived aliases): only short names and readings are kept.
- **Kalori**: the header's `label`, `attribution`, `license` and `url` are its credit line; its pictures stay on `assets.kalori.jp` (hotlinked, never copied).
- **CC0** (JBFD, MEXT↔USDA table, Wikidata) and USDA FoodData Central (public domain): no obligation; credit as a courtesy (`verify.json` `sources` carries the credit lines).
