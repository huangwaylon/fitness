// The service worker's cache generations, pure so it can be tested without a worker.

export const SHELL = 'island-shell-';

/** The map areas saved ahead (offline phase B, lib/offline/save.ts): one cache an area, `island-offline-<id>`, its
 *  tiles under their tileKey and its manifest (SAVED_MANIFEST). Kept until the phone deletes them: never a build's
 *  cleanup nor the seen tiles' bound. */
export const SAVED_PREFIX = 'island-offline-';
export const isSavedArea = (name: string): boolean => name.startsWith(SAVED_PREFIX);
/** An area's manifest's key in its cache (no tile's URL). */
export const SAVED_MANIFEST = 'https://island-fund.invalid/__manifest';
/** The page's own fetch of a tile to save (lib/offline/save.ts): the worker answers it from the network (USGS's and
 *  GSI's from the seen copy if there is one), never storing it among the seen tiles, and drops this header (a
 *  cross-origin request with it would need a preflight the tile hosts refuse). */
export const SAVE_HEADER = 'x-island-save';

/** What `activate` deletes: every cache but the current shell, the previous shell (the newest older one: a page
 *  still running the old build loads its lazy chunks from it), the long-lived runtime caches and the saved areas.
 *  `keys` is in creation order (CacheStorage.keys()). */
export function staleCaches(keys: readonly string[], current: string, keep: readonly string[]): string[] {
  const previous = keys.filter((k) => k.startsWith(SHELL) && k !== current).at(-1);
  return keys.filter((k) => k !== current && k !== previous && !keep.includes(k) && !isSavedArea(k));
}

/** The older shells a new install may copy its unchanged hashed chunks from, the newest first (`keys` in creation
 *  order). */
export function olderShells(keys: readonly string[], current: string): string[] {
  return keys.filter((k) => k.startsWith(SHELL) && k !== current).reverse();
}

/** The audio runtime cache (docs/design.md#engine-lifecycle). Every audio URL carries its file's content hash (`?v=`,
 *  lib/sound/manifest.ts), so a hit is never stale and is served without asking the network; a re-cut file is a new
 *  URL, and the old one ages out of its class's LRU. Three classes, each keeping its most recently used few: the music
 *  (the hours, the event music, the rooms: 0.1–1.1 MB each), K.K.'s songs (a song or two heard: they never push the
 *  hours out) and the rest (the effects and beds: small; a loose ききみみ clip from before the packs ages out with them).
 *  ききみみ's packs have a cache of their own (LISTEN_CACHE). */
export const AUDIO_CACHE = 'island-audio-v1';
export const isAudio = (path: string): boolean => path.includes('/audio/');
export const isMusic = (path: string): boolean => path.includes('/audio/music/') || path.includes('/audio/places/');
const isKK = (path: string): boolean => path.includes('/audio/kk/');
type AudioClass = 'music' | 'kk' | 'sfx';
const KEEP: Record<AudioClass, number> = { music: 3, kk: 2, sfx: 8 };
const classOf = (url: string): AudioClass => {
  const p = new URL(url, 'https://x/').pathname;
  return isMusic(p) ? 'music' : isKK(p) ? 'kk' : 'sfx';
};

/** Least recently used first out: `keys` in use order (oldest first: a hit is re-put at the end); which to delete so
 *  each class keeps at most its KEEP. */
export function lruEvict(keys: readonly string[]): string[] {
  return (Object.keys(KEEP) as AudioClass[]).flatMap((c) => {
    const of = keys.filter((k) => classOf(k) === c);
    return of.slice(0, Math.max(0, of.length - KEEP[c]));
  });
}

/** A hit that isn't its class's most recent yet (only then is it re-put to mark it used: not on every hit). */
export const staleUse = (keys: readonly string[], url: string): boolean => keys.filter((k) => classOf(k) === classOf(url)).at(-1) !== url;

export const isFont = (path: string): boolean => /\.(woff2?|ttf)$/.test(path);
export const isVillagerArt = (path: string): boolean => path.includes('/art/villagers/');
/** The island's scenery art: the catches (fish, bugs, junk), the beach finds (shells, fossils, fragments, the bottle),
 *  the balloon presents and the visitors' extras (shown only when one is about or in the ずかん), NH's ground
 *  textures (terrain/nh/: the layout's terrain) and ききみみ's scene backdrops (art/scene/, level 4 only, ~45 KB a scene
 *  at 3 scales: the phone's one): cached on first use, not at install. */
export const isCritterArt = (path: string): boolean =>
  path.includes('/art/critters/') || path.includes('/art/finds/') || path.includes('/art/presents/') || path.includes('/terrain/') || path.includes('/art/scene/');
/** The layout's pieces' 2D art (trees, bushes, flowers, the deco and decor, the bridges) and the world's winter and
 *  night looks: the 3D island draws their models (none of it drawn there: scripts/unused-probe.ts), so it is
 *  もようがえ's trays' and ききみみ's pictures, cached on first use, not at install (~400 KB). The birthday hats stay
 *  precached: the DOM draws them over the 3D villagers. */
export const isDecorArt = (path: string): boolean =>
  /\/art\/.+-(winter|lit)\.webp$/.test(path) || (/\/art\/(trees|bushes|flowers|deco|decor|bridges)\//.test(path) && !/\/art\/deco\/birthday-hat-/.test(path));
/** The tent's room (docs/design.md "The tent"): its models, wallpapers, floors and icons, fetched as the tent shows
 *  them and cached on first use in a cache of their own that outlives builds (a re-converted model has a new `?v=`). */
export const ROOM_CACHE = 'island-room-v1';
export const isRoomAsset = (path: string): boolean => path.includes('/room/');
/** The room cache's bound: its bytes past this, the least recently used go (the players' parts alone are ~30 MB, the
 *  villagers' models ~29 MB: grown whole, with the shell and the record's IndexedDB under one origin, WebKit may evict
 *  all of it at once). */
export const ROOM_CAP_BYTES = 40_000_000;
/** What was used within this is never evicted for the bound (what the island, the tent and the museum show now). */
export const ROOM_KEEP_MS = 3 * 24 * 3600_000;
/** The room cache's own index (beside its files, under this path in the scope): each URL's bytes and last use. */
export const ROOM_INDEX = '__room-index';
export type RoomIndex = Record<string, [bytes: number, usedAt: number]>;

/** Which of the room cache's entries go (`index` in any order): a file's older versions (the same path under another
 *  `?v=`, used less recently: a re-converted model, never asked for again), then, while the rest is over `cap`, the
 *  least recently used, never one used within `keepMs`. */
export function roomEvict(index: RoomIndex, now: number, cap = ROOM_CAP_BYTES, keepMs = ROOM_KEEP_MS): string[] {
  const urls = Object.keys(index);
  const pathOf = (u: string) => new URL(u, 'https://x/').pathname;
  const newest = new Map<string, string>();
  for (const u of urls) {
    const p = pathOf(u), n = newest.get(p);
    if (!n || index[u][1] >= index[n][1]) newest.set(p, u);
  }
  const out = new Set(urls.filter((u) => newest.get(pathOf(u)) !== u));
  let total = 0;
  for (const u of urls) if (!out.has(u)) total += index[u][0];
  const old = urls.filter((u) => !out.has(u) && now - index[u][1] > keepMs).sort((a, b) => index[a][1] - index[b][1]);
  for (const u of old) {
    if (total <= cap) break;
    out.add(u);
    total -= index[u][0];
  }
  return [...out];
}
/** ききみみ's audio packs (static/audio/listen/<pack>.<hash>.pak: lib/kikimimi/packing.ts, docs/kikimimi-engine.md "Audio"),
 *  fetched whole as a game needs them and cached on first use in a cache of their own that outlives builds: cache first,
 *  never revalidated (the hash is in the name: a re-spoken clip makes a new pack name), bounded by bytes like the room
 *  (an index of each pack's bytes and last use kept in the cache), so a few levels' and units' packs stay offline. */
export const LISTEN_CACHE = 'island-listen-v1';
export const isListenPack = (path: string): boolean => path.includes('/audio/listen/') && path.endsWith('.pak');
/** The listen cache's bound: past it, the least recently used packs go (the 144 packs are ~111 MiB: the games' 89.3,
 *  the stories' 21.4, bank.test's stopgap lines till W2-R moves them to R2; a level-4 game's eight ~9 MB). */
export const LISTEN_CAP_BYTES = 30_000_000;
/** A pack used within this is never evicted (a game in progress keeps its packs; a page still on the last build its
 *  packs' older versions). */
export const LISTEN_KEEP_MS = 10 * 60_000;
/** The listen cache's own index (beside its packs, under this path in the scope): each URL's bytes and last use. */
export const LISTEN_INDEX = '__listen-index';

/** Which of the listen cache's packs go (`index` in any order, RoomIndex's shape): a pack's older versions (the same
 *  name under another hash, used less recently) once unused for `keepMs`, then, while the rest is over `cap`, the least
 *  recently used, never one used within `keepMs`. */
export function listenEvict(index: RoomIndex, now: number, cap = LISTEN_CAP_BYTES, keepMs = LISTEN_KEEP_MS): string[] {
  const urls = Object.keys(index);
  const nameOf = (u: string) => new URL(u, 'https://x/').pathname.replace(/\.[0-9a-f]+\.pak$/, '');
  const newest = new Map<string, string>();
  for (const u of urls) {
    const n = nameOf(u), m = newest.get(n);
    if (!m || index[u][1] >= index[m][1]) newest.set(n, u);
  }
  const idle = (u: string) => now - index[u][1] > keepMs;
  const out = new Set(urls.filter((u) => newest.get(nameOf(u)) !== u && idle(u)));
  let total = 0;
  for (const u of urls) if (!out.has(u)) total += index[u][0];
  for (const u of urls.filter((u) => !out.has(u) && idle(u)).sort((a, b) => index[a][1] - index[b][1])) {
    if (total <= cap) break;
    out.add(u);
    total -= index[u][0];
  }
  return [...out];
}

/** The meal log's food data (static/food/, lib/food/load.ts): ~5 MB, fetched when the food sheet first opens and kept in
 *  a cache of its own that outlives builds. Its files carry the data's version (`?v=`); index.json, which names it,
 *  doesn't. */
export const FOOD_CACHE = 'island-food-v1';
export const isFoodData = (path: string): boolean => /\/food\/[\w-]+\.json$/.test(path);
/** ごはん's pictures (static/food-img/, lib/food/images.ts): content-hashed sprite sheets, cached on first use in a cache
 *  of their own that outlives builds; index.json, which names them, from the network first (its last copy offline).
 *  Once a new index is in, the sheets it no longer names go (foodImgStale). */
export const FOOD_IMG_CACHE = 'island-food-img-v1';
export const isFoodImg = (path: string): boolean => path.includes('/food-img/');
/** The cached sheets (`keys`: their URLs) that `index` (the index.json's text) no longer names. */
export function foodImgStale(keys: readonly string[], index: string): string[] {
  let sheets: unknown;
  try {
    sheets = (JSON.parse(index) as { sheets?: unknown }).sheets;
  } catch {
    return [];
  }
  if (!Array.isArray(sheets)) return [];
  const named = new Set(sheets);
  return keys.filter((k) => {
    const p = new URL(k, 'https://x/').pathname;
    return p.endsWith('.webp') && !named.has(p.slice(p.lastIndexOf('/') + 1));
  });
}
/** The cached food files of another data version than `v` (`keys`: their URLs). */
export const staleFood = (keys: readonly string[], v: string): string[] =>
  keys.filter((k) => {
    const kv = new URL(k, 'https://x/').searchParams.get('v');
    return kv !== null && kv !== v;
  });
/** index.json waits this long for the network (a basement, one bar), then its cached copy answers (NAV_TIMEOUT_MS's
 *  rule for the shell): every dataset waits behind it. */
const FOOD_INDEX_TIMEOUT_MS = 2500;
/** Where a newer index.json waits (beside the cached one) until every file it names is cached. */
const NEXT = '?next';

/** The files an index.json names (its datasets and verify.json), as the app fetches them: under its version, beside it. */
function foodFiles(index: unknown, indexUrl: string): { v: string; urls: string[] } | null {
  const x = index as { version?: unknown; datasets?: { file?: unknown }[] } | null;
  if (!x || typeof x.version !== 'string' || !Array.isArray(x.datasets)) return null;
  const files = [...x.datasets.map((d) => d.file), 'verify.json'];
  if (files.some((f) => typeof f !== 'string')) return null;
  return { v: x.version, urls: files.map((f) => new URL(`${f}?v=${encodeURIComponent(x.version as string)}`, indexUrl).href) };
}

type FoodCacheLike = Pick<Cache, 'match' | 'put' | 'delete'> & { keys(): Promise<readonly Request[]> };

/**
 * A newer index.json (waiting at NEXT) replaces the cached one once every file it names is cached, and only then are
 * the other versions' files dropped: going offline mid-update leaves the last whole version (the cached index.json
 * still names it), never a mix. The first index.json is kept at once (nothing to keep whole yet).
 */
async function promoteFood(cache: FoodCacheLike, indexUrl: string): Promise<void> {
  const next = await cache.match(indexUrl + NEXT);
  if (!next) return;
  const text = await next.text();
  const files = foodFiles(JSON.parse(text), indexUrl);
  const keep = () => new Response(text, { headers: { 'content-type': 'application/json' } });
  if (!files) return void (await cache.delete(indexUrl + NEXT));
  const have = await Promise.all(files.urls.map((u) => cache.match(u)));
  if (!have.every(Boolean)) {
    if (!(await cache.match(indexUrl))) await cache.put(indexUrl, keep());
    return;
  }
  await cache.put(indexUrl, keep());
  await cache.delete(indexUrl + NEXT);
  for (const old of staleFood((await cache.keys()).map((k) => k.url), files.v)) await cache.delete(old);
}

/**
 * The food data's answer (the worker's fetch handler, pure for tests): a versioned file from the cache, else the
 * network (stored after it answers: `after` is the event's waitUntil, called before the answer settles). index.json from the network unless it takes
 * longer than `timeoutMs`, then (or offline) its cached copy; a fresh one is stored whenever it comes.
 */
export async function foodFetch(req: Request, cache: FoodCacheLike, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, timeoutMs = FOOD_INDEX_TIMEOUT_MS): Promise<Response> {
  const url = new URL(req.url);
  const indexUrl = new URL('index.json', url).href;
  if (url.searchParams.get('v') === null) {
    // `after` (waitUntil) while the answer is still pending: the store may outlast it (a cached copy answered first)
    let copy: Response | null = null;
    const live = net(req).then((res) => {
      if (res.ok) copy = res.clone(); // before the page reads the body
      return res;
    });
    after(live.then(async () => {
      if (!copy) return;
      await cache.put(indexUrl + NEXT, copy);
      await promoteFood(cache, indexUrl);
    }).catch(() => {}));
    let timer: ReturnType<typeof setTimeout> | undefined;
    const late = new Promise<null>((ok) => (timer = setTimeout(ok, timeoutMs, null)));
    const first = await Promise.race([live.catch(() => null), late]);
    clearTimeout(timer);
    if (first?.ok) return first;
    return (await cache.match(indexUrl)) ?? first ?? live.catch(() => Response.error());
  }
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await net(req).catch(() => null);
  if (!res) return Response.error();
  if (res.ok) {
    const copy = res.clone();
    after((async () => {
      await cache.put(req, copy);
      await promoteFood(cache, indexUrl);
    })().catch(() => {}));
  }
  return res;
}
/**
 * ごはん's pictures' answer (pure for tests): a sheet from the cache, else the network, answered at once and stored
 * after (`after`: waitUntil; a failed store never costs the picture). index.json from the network unless it takes longer
 * than `timeoutMs`, then (or offline) its cached copy; a fresh one is stored whenever it comes, and the sheets it no
 * longer names are dropped.
 */
export async function foodImgFetch(req: Request, cache: FoodCacheLike, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, timeoutMs = FOOD_INDEX_TIMEOUT_MS): Promise<Response> {
  if (new URL(req.url).pathname.endsWith('.webp')) {
    const hit = await cache.match(req).catch(() => undefined);
    if (hit) return hit;
    const res = await net(req);
    if (res.ok) {
      const copy = res.clone();
      after(cache.put(req, copy).catch(() => {}));
    }
    return res;
  }
  let copy: Response | null = null;
  const live = net(req).then((res) => {
    if (res.ok) copy = res.clone();
    return res;
  });
  after(live.then(async () => {
    if (!copy) return;
    const text = await copy.clone().text();
    await cache.put(req, copy);
    const keys = await cache.keys();
    await Promise.all(foodImgStale(keys.map((k) => k.url), text).map((u) => cache.delete(u)));
  }).catch(() => {}));
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((ok) => (timer = setTimeout(ok, timeoutMs, null)));
  const first = await Promise.race([live.catch(() => null), late]);
  clearTimeout(timer);
  if (first?.ok) return first;
  return (await cache.match(req).catch(() => undefined)) ?? first ?? live.catch(() => Response.error());
}
/** The home-screen and install icons: the OS fetches them when the app is added, never the page offline (the favicon
 *  only needs the network). */
const isAppIcon = (path: string): boolean => path.includes('/icons/');
/** The trips' photos (static/travel/; docs/travel.md "Offline"): each trip's cover and hero precached, the rest in
 *  PHOTO_CACHE on first view. */
const isTravel = (path: string): boolean => path.includes('/travel/');
/** トレイル's photos and tracks (static/hiking/; docs/hiking.md "Offline"): the ten tracks precached (~70 KB), the photos
 *  in PHOTO_CACHE on first view. */
const isHiking = (path: string): boolean => path.includes('/hiking/');
const PRECACHED_TRIP_FILES = /\/travel\/[\w-]+\/(cover|hero)\.webp$|\/hiking\/tracks\/[\w-]+\.json$/;
/** The guides' photos the SW caches on first view (everything under travel/ and hiking/ but the precached). */
export const isGuidePhoto = (path: string): boolean => (isTravel(path) || isHiking(path)) && !PRECACHED_TRIP_FILES.test(path);
/** The maps' MapLibre: its chunk (`maplibre.*.js`, named so by vite.config.ts, with the maps' engines), its worker and
 *  its CSS (~1.8 MB raw, ~480 KB on the wire): not at install, but kept in the shell the first time a map draws, and
 *  carried by each install after that (copied when unchanged, fetched when changed: index.ts). */
const isMapLibre = (path: string): boolean => /\/_app\/immutable\/(chunks\/maplibre\.|workers\/maplibre-gl-worker-|assets\/maplibre\.)/.test(path);
/** ききみみ's content (pool.ts: each levels/parts/<part>.json its own chunk, `kiki-<part>.<hash>.js`, named so by
 *  vite.config.ts kiki-part-names; ~690 KB on the wire in all, the precache's biggest growth): not at install (a game's
 *  part is of no use offline without its audio pack, which LISTEN_CACHE keeps on first use too), but kept in the shell
 *  the first time a game loads it, and carried by each install after that (a changed part fetched by its name). */
export const isKikiPart = (path: string): boolean => /\/_app\/immutable\/chunks\/kiki-[\w-]+\.[\w-]+\.js$/.test(path);
/** A part's name (`kiki-<part>`) in a chunk's path or URL, else null. */
export const kikiPartOf = (path: string): string | null => /\/_app\/immutable\/chunks\/(kiki-[\w-]+)\.[\w-]+\.js$/.exec(path)?.[1] ?? null;
/** The build files kept in the shell on first use and carried by each install (MapLibre, ききみみ's parts): listed in
 *  the worker's manifest though not precached (vite.config.ts swPrecacheOnly). */
export const carried = (path: string): boolean => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return isMapLibre(p) || isKikiPart(p);
};

/**
 * What an install does with this build's carried files (`files`, as the manifest lists them) given what the older
 * shells hold (`held`: their URLs or paths): `copy` the ones they hold as they are; `fetch` the changed ones a phone
 * uses: all of MapLibre's once a map has drawn (any of its files held), and a ききみみ part whose name is held (another
 * build's copy). The rest wait for first use.
 */
export function carryPlan(files: readonly string[], held: readonly string[]): { copy: string[]; fetch: string[] } {
  const path = (u: string) => (/^https?:/.test(u) ? new URL(u).pathname : u.startsWith('/') ? u : `/${u}`);
  const have = new Set(held.map(path));
  const names = new Set([...have].map(kikiPartOf).filter((n) => n !== null));
  const map = [...have].some(isMapLibre);
  const copy: string[] = [], fetch: string[] = [];
  for (const f of files) {
    const p = path(f);
    if ([...have].some((h) => h.endsWith(p))) copy.push(f);
    else if (isMapLibre(p) ? map : names.has(kikiPartOf(p) ?? '')) fetch.push(f);
  }
  return { copy, fetch };
}
/** The key, in a shell, of its static files' hashes (installStatics: what the next install compares). */
export const STATIC_HASHES = '__static-hashes';
/** A static file the worker precaches and its content hash (the build's: vite.config.ts swPrecacheOnly). */
export type StaticFile = { path: string; hash: string };
/** A file's content hash as the build writes it and an install checks it: SHA-256's first 8 bytes, hex. */
export async function contentHash(buf: BufferSource): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
  return Array.from(d.subarray(0, 8), (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * An install's static files (the art, the manifest, the trails' tracks: ~300, unhashed names): one an older shell holds
 * at the build's hash (that shell's STATIC_HASHES) is copied, the rest fetched (`net`: past the HTTP cache), each on its
 * own (one that fails costs that file, not the install). It revalidated all ~300 with each deploy, ~220 requests at an
 * app open, competing with the island's load. The hashes recorded are of the bytes stored (a fetch the server answered
 * with another build's file is fetched again next time), under `key` (STATIC_HASHES in the scope). The newest shell
 * first in `olds`; one from before the hashes has none, so its files are fetched once.
 */
export async function installStatics(files: readonly StaticFile[], cache: Pick<Cache, 'put'>, olds: readonly Pick<Cache, 'match'>[], net: (path: string) => Promise<Response>, key: string): Promise<{ copied: number; fetched: number }> {
  const recorded = await Promise.all(olds.map(async (c) => {
    try {
      return ((await (await c.match(key))?.json()) ?? null) as Record<string, string> | null;
    } catch {
      return null;
    }
  }));
  const stored: Record<string, string> = {};
  let copied = 0, fetched = 0;
  await Promise.allSettled(files.map(async ({ path, hash }) => {
    for (let i = 0; i < olds.length; i++) {
      if (recorded[i]?.[path] !== hash) continue;
      const hit = await olds[i].match(path);
      if (!hit) continue;
      await cache.put(path, hit);
      stored[path] = hash;
      copied++;
      return;
    }
    const res = await net(path);
    if (!res.ok) return;
    const got = await contentHash(await res.clone().arrayBuffer());
    await cache.put(path, res);
    stored[path] = got;
    fetched++;
  }));
  await cache.put(key, new Response(JSON.stringify(stored), { headers: { 'content-type': 'application/json' } }));
  return { copied, fetched };
}

/** The font slices precached (Zen Maru Gothic's 500 and 700, src/lib/styles/fonts.css; Fredoka's Latin): the ones
 *  holding ~99% of the characters the app's own strings show (scripts/font-subsets.ts's count), ~0.7 MB. The other
 *  slices (rare kanji, the map's labels) are cached on first use (FONTS). */
export const PRECACHED_FONT_SLICES = ['119', '117', '116', '115', '114', '113', '112', '111', '110', '109', '108', '118', '107', '106', '105', '104', '103', '102', '101', '100', '99', '98', '97', '96', '95', '94', '92', 'latin'];
const PRECACHED_FONT = new RegExp(`/(zen-maru-gothic-(${PRECACHED_FONT_SLICES.join('|')})-[57]00-normal|fredoka-latin-[67]00-normal)\\.[\\w-]+\\.woff2$`);
/** ききみみ's recogniser (docs/kikimimi-mic.md "Hosting and the service worker"): the model and the ONNX runtime under `/stt/`, and the worker that
 *  runs them (`_app/immutable/workers/stt.<hash>.js` and its chunks, named so by vite.config.ts stt-names): never
 *  precached (~67 MB; only a phone that opted in fetches any of it). The page fills STT_CACHE itself on the probe's
 *  tap (lib/mic/models.ts ensureStt: the parts assembled and checked); the worker serves `/stt/` and the chunk from it
 *  first and never stores, so a deploy never fetches it again and a phone that never opted in has 0 bytes of it. */
export const STT_CACHE = 'island-stt-v1';
export const isStt = (path: string): boolean => /^(\/[\w-]+)?\/stt\/|\/_app\/immutable\/workers\/(chunks\/)?stt\./.test(path);
/** The two default villagers' art is precached (lib/villagers/look.ts DEFAULT_VILLAGER); the rest is cached on use. */
const PRECACHED_VILLAGERS = /\/art\/villagers\/(goldie|anchovy)(-icon)?\.webp$/;

/** Whether a build file goes into the install-time precache. Paths come from `$app/manifest` relative to the base
 *  (`art/…`, `audio/…`), so they are matched with a leading slash. Not precached: the font slices but the common ones
 *  (PRECACHED_FONT_SLICES; the rest cached on first use),
 *  the bundled art and audio manifests, every villager but the defaults, every critter, find and present (all cached
 *  on first use), all audio (AUDIO_CACHE, on first play; ききみみ's packs LISTEN_CACHE, on first use), the tent's room (ROOM_CACHE, on first use), the food data (FOOD_CACHE, on first use), the food pictures (FOOD_IMG_CACHE, on first use), the guides' photos but the trips' covers and heroes and the trails' tracks (PHOTO_CACHE), the maps' MapLibre and ききみみ's parts (carried: kept once used), the recogniser (stt/, STT_CACHE), the app icons and macOS
 *  litter. */
export function precachable(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  if ((isFont(p) && !PRECACHED_FONT.test(p)) || isAudio(p) || isCritterArt(p) || isDecorArt(p) || isRoomAsset(p) || isFoodData(p) || isFoodImg(p) || isGuidePhoto(p) || isMapLibre(p) || isKikiPart(p) || isStt(p) || isAppIcon(p) || p.endsWith('/art/manifest.json') || p.endsWith('.DS_Store')) return false;
  return !isVillagerArt(p) || PRECACHED_VILLAGERS.test(p);
}

/** Whether a shell's HTML is `version`'s build (Kit writes the version into its inline bootstrap): a shell served from a
 *  version's cache must be the one its cached chunks were built with. */
export const isShellOf = (html: string, version: string): boolean => html.includes(`version: ${JSON.stringify(version)}`);

/**
 * A navigation's response becomes this version's shell only if the version has none yet (offline at install) and it
 * is this version's own HTML (isShellOf). Never over one, nor another build's: right after a deploy the old worker
 * still answers a navigation from the network, and the new build's HTML in the old cache would point at chunks no
 * cache holds (navigations are served from the cache first: a blank screen offline, the old build's chunks never
 * matching). Each version's install caches its own shell.
 */
export async function keepShell(cache: Pick<Cache, 'match' | 'put'>, scope: string, res: Response, version: string): Promise<void> {
  if (res.ok && !(await cache.match(scope)) && isShellOf(await res.clone().text(), version)) return cache.put(scope, res);
  await res.body?.cancel().catch(() => {}); // the unused copy: don't buffer it
}

// ---- offline guides and maps (docs/backend.md "Service worker" › Offline): kept as they are seen, never prefetched

/** The guides' photos (isGuidePhoto) once seen: a cache that outlives builds, revalidated in the background. */
export const PHOTO_CACHE = 'island-photos-v1';
/** All the guides' photos are ~3.7 MB: the bound is for what a new trip adds. */
export const PHOTO_CAP_BYTES = 20_000_000;
/** A seen photo is served from the cache and checked again in the background once it is older than this. */
export const PHOTO_FRESH_MS = 24 * 3600_000;
/** The maps' tiles once seen (OpenFreeMap's vector tiles, USGS's and GSI's raster topo): only what a map drew. */
export const TILE_CACHE = 'island-tiles-v1';
export const TILE_CAP_BYTES = 60_000_000;
/** Tiles change seldom (OpenFreeMap rebuilds weekly, the topo maps yearly): a seen one is refetched past this. */
export const TILE_FRESH_MS = 14 * 24 * 3600_000;
/** OpenFreeMap's TileJSON (it names the week's tile URLs): its own small cache, never evicted. */
export const MAP_META_CACHE = 'island-map-meta-v1';
/** Within this the cached TileJSON answers without asking; past it, the network first (MAP_META_TIMEOUT_MS), else the
 *  cached copy. */
const TILEJSON_TTL_MS = 3600_000;
const MAP_META_TIMEOUT_MS = 2500;
/** When a copy was stored (ms), on the stored copy itself (a header of ours). */
const STORED_AT = 'x-island-stored';

export const OPENFREEMAP = 'tiles.openfreemap.org';
const TILE_HOSTS = new Set([OPENFREEMAP, 'basemap.nationalmap.gov', 'cyberjapandata.gsi.go.jp']);
/** OpenFreeMap's TileJSON (style.ts BASEMAP's url). */
export const isTileJson = (u: URL): boolean => u.hostname === OPENFREEMAP && /^\/[\w-]+\/?$/.test(u.pathname);
/**
 * A map tile's key in TILE_CACHE, or null for any other URL. OpenFreeMap's tile URLs carry the week's build
 * (`/planet/20261101_080013_pt/12/3629/1612.pbf`): keyed without it, so a tile seen under last week's build still
 * answers offline under this week's TileJSON (and is refetched under the new one when due).
 */
export function tileKey(u: URL): string | null {
  if (!TILE_HOSTS.has(u.hostname) || isTileJson(u)) return null;
  if (u.hostname !== OPENFREEMAP) return u.href;
  const m = /^\/([\w-]+)\/[\w.-]+\/(\d+\/\d+\/\d+\.pbf)$/.exec(u.pathname);
  return m ? `${u.origin}/${m[1]}/_/${m[2]}` : null;
}

/** A tile from the saved areas (`names`), else undefined. `match` with a cacheName never creates the cache (an area
 *  deleted a moment ago stays deleted). */
export async function savedTile(store: Pick<CacheStorage, 'match'>, names: readonly string[], key: string): Promise<Response | undefined> {
  for (const cacheName of names) {
    const hit = await store.match(key, { cacheName }).catch(() => undefined);
    if (hit) return hit;
  }
  return undefined;
}

/** The answer to the page's fetch of a tile to save (SAVE_HEADER): a raster tile's seen copy (USGS's and GSI's have no
 *  versions), else the network without the header; never stored here (the page puts it into the area's cache).
 *  OpenFreeMap's always from the network: a seen copy may be another week's build, and an area never mixes builds. */
export async function saveFetch(req: Request, seen: Pick<Cache, 'match'>, key: string, net: (r: Request) => Promise<Response>): Promise<Response> {
  if (new URL(req.url).hostname !== OPENFREEMAP) {
    const hit = await seen.match(key).catch(() => undefined);
    if (hit) return hit;
  }
  return net(new Request(req.url, { mode: 'cors', credentials: 'omit', signal: req.signal }));
}

/** A response worth keeping: a whole 200, readable (an opaque one, a no-cors answer, would count ~7 MB of quota
 *  whatever its size in WebKit, and can't be checked). */
export const keepable = (res: Response): boolean => res.ok && res.status === 200 && res.type !== 'opaque';

/** A bounded cache's entries (any order: [bytes, last use]) to delete so the rest is within `cap`: the least recently
 *  used first, never one used within `keepMs`. */
export function bytesEvict(index: RoomIndex, now: number, cap: number, keepMs = 0): string[] {
  let total = 0;
  for (const u in index) total += index[u][0];
  const out: string[] = [];
  for (const u of Object.keys(index).filter((u) => now - index[u][1] > keepMs).sort((a, b) => index[a][1] - index[b][1])) {
    if (total <= cap) break;
    out.push(u);
    total -= index[u][0];
  }
  return out;
}

type SwrCache = Pick<Cache, 'match' | 'put'>;
export interface SwrOptions {
  /** The cache's key for the request (tileKey), its URL by default. */
  key?: string;
  freshMs: number;
  now?: () => number;
  /** A copy stored (its key and bytes) or used (no bytes): the bounded cache's index (index.ts boundedCache). */
  used?: (key: string, bytes?: number) => void;
}

/** A readable copy of `res` with when it was stored (the answer's own headers that a page can read: a CORS answer's
 *  are the safelisted ones). */
async function stamped(res: Response, at: number): Promise<{ copy: Response; bytes: number }> {
  const body = await res.blob();
  const headers = new Headers(res.headers);
  headers.set(STORED_AT, String(at));
  return { copy: new Response(body, { status: 200, statusText: res.statusText, headers }), bytes: body.size };
}

/**
 * Stale-while-revalidate (the guides' photos, the tiles; pure for tests): a stored copy at once, fetched again in the
 * background (`after`: waitUntil) once older than `freshMs`; nothing stored: the network, its answer stored after it
 * is answered (a failed or opaque one never). Offline with nothing stored: the network's error (the page's
 * placeholder, the map's offline note).
 */
export async function swrFetch(req: Request, cache: SwrCache, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, o: SwrOptions): Promise<Response> {
  const key = o.key ?? req.url, now = o.now ?? Date.now;
  const store = (res: Response) =>
    (async () => {
      if (!keepable(res)) return void (await res.body?.cancel().catch(() => {}));
      const { copy, bytes } = await stamped(res, now());
      await cache.put(key, copy);
      o.used?.(key, bytes);
    })().catch(() => {});
  const hit = await cache.match(key).catch(() => undefined);
  if (hit) {
    const at = Number(hit.headers.get(STORED_AT));
    o.used?.(key);
    if (!(now() - at < o.freshMs)) after(net(req).then(store, () => {}));
    return hit;
  }
  const res = await net(req);
  if (keepable(res)) after(store(res.clone()));
  return res;
}

/**
 * OpenFreeMap's TileJSON (pure for tests): the stored copy within `ttlMs`; else the network within `timeoutMs`, stored
 * when it comes; slower, or offline, the stored copy (the tiles it names are the ones cached: tileKey).
 */
export async function tileJsonFetch(req: Request, cache: SwrCache, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, o: { ttlMs?: number; timeoutMs?: number; now?: () => number } = {}): Promise<Response> {
  const now = o.now ?? Date.now;
  const hit = await cache.match(req.url).catch(() => undefined);
  if (hit && now() - Number(hit.headers.get(STORED_AT)) < (o.ttlMs ?? TILEJSON_TTL_MS)) return hit;
  let copy: Response | null = null;
  const live = net(req).then((res) => {
    if (keepable(res)) copy = res.clone();
    return res;
  });
  after(live.then(async () => {
    if (copy) await cache.put(req.url, (await stamped(copy, now())).copy);
  }).catch(() => {}));
  if (!hit) return live;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((ok) => (timer = setTimeout(ok, o.timeoutMs ?? MAP_META_TIMEOUT_MS, null)));
  const first = await Promise.race([live.catch(() => null), late]);
  clearTimeout(timer);
  return first?.ok ? first : hit;
}

/**
 * A cache-first miss: fetched, and a good answer kept in the background (`keep`, through `waitUntil`): storage full
 * (cache.put's quota error) costs only the copy, never the answer (2026-11-08: awaited, it failed the asset). Pure but
 * for its three functions, so it's tested without a worker.
 */
export async function fetchKeep(req: Request, get: (r: Request) => Promise<Response>, keep: (res: Response) => Promise<unknown>, waitUntil: (p: Promise<unknown>) => void): Promise<Response> {
  const res = await get(req);
  if (res.ok) waitUntil(keep(res.clone()).catch(() => {}));
  return res;
}

