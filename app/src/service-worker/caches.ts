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

/** The older shells kept besides the current one: the newest (a page one build behind, the next install's copies:
 *  copyChunks) and the shell of each open page's build (`live`: a page left running a few deploys behind, no reload
 *  while the app is in front: ui-state/update.ts, ~15-30 deploys a day, loads its lazy chunks from its own). ~3 MB and
 *  ~550 entries each: a cold worker's first cache read grows with the origin's entries (review c1 r3 W1: 4 shells
 *  were ~half of them). A page whose build isn't known (not said yet): SHELLS_UNSURE, the newest older one alone (3 till
 *  the launch review 11-21: ~1,100 entries more); a page further behind whose chunks went loads them from the network,
 *  else its chunk.fail reloads it once into the deployed build (ui-state/reload.ts reloadUnlessLeaving). */
export const SHELLS_KEPT = 1;
export const SHELLS_UNSURE = 1;

/** What `activate` deletes: every cache but the current shell, the newest older one and the open pages' (`live`: their
 *  shells, null when one's build isn't known: the SHELLS_UNSURE newest older ones), the long-lived runtime caches and
 *  the saved areas. `keys` is in creation order (CacheStorage.keys()). */
export function staleCaches(keys: readonly string[], current: string, keep: readonly string[], live: readonly string[] | null = null): string[] {
  const previous = new Set([...keys.filter((k) => k.startsWith(SHELL) && k !== current).slice(-(live ? SHELLS_KEPT : SHELLS_UNSURE)), ...(live ?? [])]);
  return keys.filter((k) => k !== current && !previous.has(k) && !keep.includes(k) && !isSavedArea(k));
}

/** The key, in a shell, of the open pages' builds as each said them to its worker (the app's `live` message:
 *  ui-state/swLate.ts): `{[client id]: version}`. */
export const LIVE_KEY = '__live';
/** The open pages' shells (`open`: their client ids; `said`: LIVE_KEY's), or null when one of them hasn't said its
 *  build (a page from before the message, or one still starting). */
export function liveShells(open: readonly string[], said: Readonly<Record<string, unknown>>): string[] | null {
  const out = new Set<string>();
  for (const id of open) {
    const v = said[id];
    if (typeof v !== 'string') return null;
    out.add(SHELL + v);
  }
  return [...out];
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
 *  hours out) and the rest (the effects and beds: small). */
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
 *  textures (terrain/nh/: the layout's terrain): cached on first use, not at install. */
export const isCritterArt = (path: string): boolean =>
  path.includes('/art/critters/') || path.includes('/art/finds/') || path.includes('/art/presents/') || path.includes('/terrain/');
/** The layout's pieces' 2D art (trees, bushes, flowers, the deco and decor, the bridges, the birthday hats) and the
 *  world's winter and night looks: the 3D island draws their models (none of it drawn there: scripts/unused-probe.ts;
 *  the hats too since R4 step 8), so it is もようがえ's trays' pictures, cached on first use, not at install (~400 KB). */
export const isDecorArt = (path: string): boolean =>
  /\/art\/.+-(winter|lit)\.webp$/.test(path) || /\/art\/(trees|bushes|flowers|deco|decor|bridges)\//.test(path);
/** The tent's room (docs/design.md "The tent"): its models, wallpapers, floors and icons, fetched as the tent shows
 *  them and cached on first use in a cache of their own that outlives builds (a re-converted model has a new `?v=`);
 *  the players' parts' packs too (static/room/player/<home>.<hash>.pak: player3d/parts.ts, fetched whole). */
export const ROOM_CACHE = 'island-room-v1';
export const isRoomAsset = (path: string): boolean => path.includes('/room/');
/** The room cache's bound: its bytes past this, the least recently used go (the players' parts alone are ~23 MB in
 *  their packs, the villagers' models ~29 MB). 100 MB since 2026-11-13 (the user's call, review 11-13 N3): at 40 MB a
 *  phone sat at its cap and the shop's and museum's packs went after 3 days unused; both phones' origins are persisted
 *  (not evicted under storage pressure), a 39 GB quota. */
export const ROOM_CAP_BYTES = 100_000_000;
/** And by count: the phones held ~1,600 files of ~22 KB (38 MB, far under the bytes) on 2026-11-21, a third of the
 *  origin's entries, every model, texture and icon ever shown (a cold worker's first cache read grows with them:
 *  SHELLS_KEPT); what was used within ROOM_KEEP_MS is never let go for it. */
export const ROOM_CAP_N = 1000;
/** What was used within this is never evicted for the bound (what the island, the tent and the museum show now). */
export const ROOM_KEEP_MS = 3 * 24 * 3600_000;
/** The room cache's own index (beside its files, under this path in the scope): each URL's bytes and last use. */
export const ROOM_INDEX = '__room-index';
export type RoomIndex = Record<string, [bytes: number, usedAt: number]>;

/** A pack's slice (`?s=<from>-<to>`), as an older worker kept them: never asked for again (a pack is fetched whole),
 *  let go at once. */
const isSlice = (u: string): boolean => new URL(u, 'https://x/').searchParams.has('s');

/** A pack unused this long goes whatever the bound (room/pack/, room/player/: `<group>.<hash>.pak`, so a repack's
 *  new names left the old packs behind, never asked for again, up to ~35 MB a phone till the bound; a pack still in
 *  use but not asked for this long is 64 KB to 1.2 MB fetched again). */
export const PAK_UNUSED_MS = 7 * 24 * 3600_000;
/** Any other room file unused this long goes whatever the bound (a visitor's model, a tray's icons seen once): fetched
 *  again at its next use. */
export const ROOM_UNUSED_MS = 14 * 24 * 3600_000;

/** Which of the room cache's entries go (`index` in any order): a file's older versions (the same path under another
 *  `?v=`, used less recently: a re-converted model, never asked for again), a pack's old slices, a pack unused for
 *  PAK_UNUSED_MS and any other file unused for ROOM_UNUSED_MS, then, while the rest is over `cap` bytes or `maxN`
 *  files, the least recently used, never one used within `keepMs`. Offline (`online` false) only the bytes' bound
 *  and the stale versions: a file let go then can't be had again till the network is back (the museum, the shop). */
export function roomEvict(index: RoomIndex, now: number, cap = ROOM_CAP_BYTES, keepMs = ROOM_KEEP_MS, maxN = ROOM_CAP_N, online = true): string[] {
  const urls = Object.keys(index);
  const pathOf = (u: string) => new URL(u, 'https://x/').pathname;
  const newest = new Map<string, string>();
  for (const u of urls) {
    const p = pathOf(u), n = newest.get(p);
    if (!isSlice(u) && (!n || index[u][1] >= index[n][1])) newest.set(p, u);
  }
  const unused = (u: string) => online && now - index[u][1] > (pathOf(u).endsWith('.pak') ? PAK_UNUSED_MS : ROOM_UNUSED_MS);
  const gone = urls.filter((u) => newest.get(pathOf(u)) !== u || unused(u));
  return [...gone, ...bytesEvict(without(index, gone), now, cap, keepMs, online ? maxN : Infinity)];
}
/** The meal log's food data (static/food/, lib/food/load.ts): ~14 MB (3 MB of the core, the
 *  lazy products' 4 and chain menus' 7), fetched when the food sheet first opens and kept in
 *  a cache of its own that outlives builds; a barcode shard (jan/, ~5 KB gzipped) only once a scan asks for it, a chain
 *  menu's id shard (kal/, ~11 KB, made at the build) once a day or さいきん shows one of its foods, each kept while the
 *  index names its version (`jan`; kalori.json's). Each file carries its own version (`?v=`: index.json's `files`), so a refresh
 *  of one (Kalori's, weekly) refetches that one; index.json, which names them, doesn't. v2 since schema 2 (every file by
 *  column): the activate's sweep deletes v1, so this build never meets a file of the old layout. */
export const FOOD_CACHE = 'island-food-v2';
export const isFoodData = (path: string): boolean => /\/food\/((jan|kal)\/)?[\w-]+\.json$/.test(path);
/** A shard's folder (jan/, kal/) in a food file's path, its index.json the folder's above; none for the rest. */
const SHARD_DIR = /\/food\/(jan|kal)\/[^/]+$/;
/** English Study's banks (`english/c/<id>.<v>.json`, written by the build: lib/english/data.ts, catalog.ts bankPath):
 *  ~12 KB on the wire, ~35 KB as stored (the Cache API keeps the decoded body), fetched when a lesson opens or home prefetches it, never precached; served cache first in a cache of
 *  their own that outlives builds (the name carries the clip's version, so a copy is never stale). フレーズ's deck files
 *  (`english/p/<n>.<v>.json`, catalog.ts shardPath, ~28 KB gzipped each) the same way. */
export const ENGLISH_CACHE = 'island-english-v1';
const ENGLISH_BANK = /\/english\/c\/([\w-]+)\.[0-9a-z]+\.json$/;
const ENGLISH_SHARD = /\/english\/p\/(\d+)\.[0-9a-z]+\.json$/;
export const isEnglishData = (path: string): boolean => ENGLISH_BANK.test(path) || ENGLISH_SHARD.test(path);
/** The banks kept (the library's 400: ~14 MB stored): past it, the first stored go (the deck's files aren't counted: one each). */
const ENGLISH_KEEP = 400;
/** Which files go (`keys` in the order stored): a clip's (or a deck file's) older versions once a newer one is stored,
 *  then the first banks stored past `keep`. */
export function englishEvict(keys: readonly string[], keep = ENGLISH_KEEP): string[] {
  const idOf = (u: string) => {
    const path = new URL(u, 'https://x/').pathname, c = ENGLISH_BANK.exec(path)?.[1];
    return c ? `c/${c}` : `p/${ENGLISH_SHARD.exec(path)?.[1]}`;
  };
  const last = new Map(keys.map((k, i) => [idOf(k), i]));
  const older = keys.filter((k, i) => last.get(idOf(k)) !== i);
  const rest = keys.filter((k, i) => last.get(idOf(k)) === i && idOf(k).startsWith('c/'));
  return [...older, ...rest.slice(0, Math.max(0, rest.length - keep))];
}
/** A bank's answer (pure for tests): the cached copy, else the network's, stored after (`after`: waitUntil). */
export async function englishFetch(req: Request, cache: FoodCacheLike, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void): Promise<Response> {
  const hit = await cache.match(req).catch(() => undefined);
  if (hit) return hit;
  const res = await net(req);
  if (res.ok) {
    const copy = res.clone();
    after((async () => {
      await cache.put(req, copy);
      for (const old of englishEvict((await cache.keys()).map((k) => k.url))) await cache.delete(old);
    })().catch(() => {}));
  }
  return res;
}
/** ごはん's pictures (static/food-img/, lib/food/images.ts): content-hashed sprite sheets (and the products' part of the
 *  index, off.json, under its version), cached on first use in a cache
 *  of their own that outlives builds; index.json, which names them, from the network first (its last copy offline).
 *  Once a new index is in, the sheets it no longer names go (foodImgStale). */
export const FOOD_IMG_CACHE = 'island-food-img-v1';
export const isFoodImg = (path: string): boolean => path.includes('/food-img/');
/** The pictures' bound (of ~75 MB of sheets in all, 2026-11-10): past it the least recently used sheets go (never
 *  index.json; index.ts boundedCache). */
export const FOOD_IMG_CAP_BYTES = 40_000_000;
/** And by count (the origin's entries: SHELLS_KEPT; ~75 KB a sheet, the phones held 50-110 on 2026-11-20). */
export const FOOD_IMG_CAP_N = 300;
/** Which of the picture cache's sheets go: bytesEvict over the sheets alone (index.json is never let go). */
export const foodImgEvict = (index: RoomIndex, now: number, cap = FOOD_IMG_CAP_BYTES, maxN = FOOD_IMG_CAP_N): string[] =>
  bytesEvict(Object.fromEntries(Object.entries(index).filter(([u]) => new URL(u, 'https://x/').pathname.endsWith('.webp'))), now, cap, 0, maxN);
/** The on-use art cache's bound (index.ts VILLAGERS: the villagers' renders and icons, the critters, the finds, the
 *  ground's textures, the decor's pictures; static/art is ~23 MB with more villagers than anyone sees): past it the least
 *  recently used go, never one used within ART_KEEP_MS (what the island shows now). Before 2026-11-10 it was unbounded,
 *  and renamed art stayed for good. */
export const ART_CAP_BYTES = 30_000_000;
/** And by count (~9 KB a file: the phones held ~500-650, 4.4-6 MB, on 2026-11-20; the island shows ~150-250). */
export const ART_CAP_N = 500;
export const ART_KEEP_MS = 24 * 3600_000;
/** The ずかん's icon packs and their index (static/art/finds/pack/<name>.<hash>.pak|json: lib/artPack/artPack.ts): a name's
 *  file under another hash (a repack) never asked for again. */
const ART_PACK = /\/art\/finds\/pack\/([\w-]+)\.[0-9a-f]{8}\.(?:pak|json)$/;
/** Which of the art cache's entries go (`index` in any order): a pack (or the packs' index) whose name has a newer hash
 *  used since, at once; then, while the rest is over `cap`, the least recently used, never one used within `keepMs`. */
export function artEvict(index: RoomIndex, now: number, cap = ART_CAP_BYTES, keepMs = ART_KEEP_MS, maxN = ART_CAP_N): string[] {
  const nameOf = (u: string) => ART_PACK.exec(new URL(u, 'https://x/').pathname)?.[1];
  const newest = new Map<string, string>();
  for (const u of Object.keys(index)) {
    const n = nameOf(u), m = n && newest.get(n);
    if (n && (!m || index[u][1] >= index[m][1])) newest.set(n, u);
  }
  const gone = Object.keys(index).filter((u) => {
    const n = nameOf(u);
    return n !== undefined && newest.get(n) !== u;
  });
  return [...gone, ...bytesEvict(without(index, gone), now, cap, keepMs, maxN)];
}
/** The cached sheets (`keys`: their URLs) that `index` (the index.json's text) no longer names, and the products' ids
 *  (off.json, the build's cut) of another version than its `off`. */
export function foodImgStale(keys: readonly string[], index: string): string[] {
  let x: { sheets?: unknown; off?: unknown };
  try {
    x = JSON.parse(index) as typeof x;
  } catch {
    return [];
  }
  if (!Array.isArray(x.sheets)) return [];
  const named = new Set(x.sheets);
  return keys.filter((k) => {
    const u = new URL(k, 'https://x/'), p = u.pathname;
    return p.endsWith('.webp') ? !named.has(p.slice(p.lastIndexOf('/') + 1)) : p.endsWith('/off.json') && u.searchParams.get('v') !== x.off;
  });
}
/** The cached food files (`keys`: their URLs) that are not one of `keep` (the URLs a whole index names: foodFiles): a
 *  file's other versions, a dataset dropped; a shard (jan/, kal/: cached on use) unless under its folder's version
 *  (`shards`: the index's `jan`, kalori.json's for kal/). index.json (no `?v=`) never. */
export function staleFood(keys: readonly string[], keep: readonly string[], shards: { jan?: unknown; kal?: unknown } = {}): string[] {
  const named = new Set(keep);
  return keys.filter((k) => {
    const u = new URL(k, 'https://x/');
    const v = u.searchParams.get('v');
    const dir = SHARD_DIR.exec(u.pathname)?.[1] as 'jan' | 'kal' | undefined;
    return v !== null && !named.has(k) && !(dir && v === shards[dir]);
  });
}
/** index.json waits this long for the network (a basement, one bar), then its cached copy answers (NAV_TIMEOUT_MS's
 *  rule for the shell): every dataset waits behind it. */
const FOOD_INDEX_TIMEOUT_MS = 2500;
/** Where a newer index.json waits (beside the cached one) until every file it names is cached. */
const NEXT = '?next';

/** The files an index.json names (its datasets and verify.json), as the app fetches them (load.ts fileV): each under
 *  its own version (`files`), beside it; null for an index short of one. */
function foodFiles(index: unknown, indexUrl: string): string[] | null {
  const x = index as { files?: unknown; datasets?: { file?: unknown }[] } | null;
  if (!x || !x.files || typeof x.files !== 'object' || !Array.isArray(x.datasets)) return null;
  const own = x.files as Record<string, unknown>;
  const files = [...x.datasets.map((d) => d.file), 'verify.json'];
  if (files.some((f) => typeof f !== 'string' || typeof own[f] !== 'string')) return null;
  return (files as string[]).map((f) => new URL(`${f}?v=${encodeURIComponent(own[f] as string)}`, indexUrl).href);
}

type FoodCacheLike = Pick<Cache, 'match' | 'put' | 'delete'> & { keys(): Promise<readonly Request[]> };

/**
 * A newer index.json (waiting at NEXT) replaces the cached one once every file it names is cached, and only then are
 * the files it doesn't name (their older versions) dropped: going offline mid-update leaves the last whole version (the cached index.json
 * still names it), never a mix. The first index.json is kept at once (nothing to keep whole yet).
 */
async function promoteFood(cache: FoodCacheLike, indexUrl: string): Promise<void> {
  const next = await cache.match(indexUrl + NEXT);
  if (!next) return;
  const text = await next.text();
  const files = foodFiles(JSON.parse(text), indexUrl);
  const keep = () => new Response(text, { headers: { 'content-type': 'application/json' } });
  if (!files) return void (await cache.delete(indexUrl + NEXT));
  const have = await Promise.all(files.map((u) => cache.match(u)));
  if (!have.every(Boolean)) {
    if (!(await cache.match(indexUrl))) await cache.put(indexUrl, keep());
    return;
  }
  await cache.put(indexUrl, keep());
  await cache.delete(indexUrl + NEXT);
  const x = JSON.parse(text) as { jan?: unknown; files: Record<string, unknown> };
  for (const old of staleFood((await cache.keys()).map((k) => k.url), files, { jan: x.jan, kal: x.files['kalori.json'] })) await cache.delete(old);
}

/**
 * The food data's answer (the worker's fetch handler, pure for tests): a versioned file from the cache, else the
 * network (stored after it answers: `after` is the event's waitUntil, called before the answer settles). index.json from the network unless it takes
 * longer than `timeoutMs`, then (or offline) its cached copy; a fresh one is stored whenever it comes.
 */
export async function foodFetch(req: Request, cache: FoodCacheLike, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, timeoutMs = FOOD_INDEX_TIMEOUT_MS): Promise<Response> {
  const url = new URL(req.url);
  // (a shard's index is the folder's above)
  const indexUrl = new URL(SHARD_DIR.test(url.pathname) ? '../index.json' : 'index.json', url).href;
  if (url.searchParams.get('v') === null && url.href.split('?')[0] !== indexUrl) return net(req);
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
export async function foodImgFetch(req: Request, cache: FoodCacheLike, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, timeoutMs = FOOD_INDEX_TIMEOUT_MS, used?: (url: string, bytes?: number) => void): Promise<Response> {
  if (new URL(req.url).pathname.endsWith('.webp')) {
    const hit = await cache.match(req).catch(() => undefined);
    if (hit) {
      used?.(req.url);
      return hit;
    }
    const res = await net(req);
    if (res.ok) {
      const copy = res.clone(), sized = res.clone();
      after((async () => {
        await cache.put(req, copy);
        used?.(req.url, (await sized.blob()).size);
      })().catch(() => {}));
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
/** The trips' photos (static/travel/; docs/travel.md "Offline"): each trip's cover precached, the rest (its hero too) in
 *  PHOTO_CACHE on first view. */
const isTravel = (path: string): boolean => path.includes('/travel/');
/** けっこんしき's banner photo (static/wedding/hero.webp): in PHOTO_CACHE on first view, as the trips' heroes (the
 *  precache's 3 MiB: docs/ops/perf.md); offline before that, the banner's plain photo fallback (ui/photoFallback.ts). */
const isWeddingPhoto = (path: string): boolean => /^(\/[\w-]+)?\/wedding\/[\w-]+\.webp$/.test(path);
/** トレイル's photos and tracks (static/hiking/; docs/hiking.md "Offline"): the tracks precached (~80 KB), the photos and
 *  the Japan trails' reference trails (hiking/net/, ~30 KB gz: lib/hiking/net.ts) in PHOTO_CACHE on first view. */
const isHiking = (path: string): boolean => path.includes('/hiking/');
const PRECACHED_TRIP_FILES = /\/travel\/[\w-]+\/cover\.webp$|\/hiking\/tracks\/[\w-]+\.json$/;
/** The guides' photos the SW caches on first view (everything under travel/ and hiking/ but the precached, and the
 *  wedding's banner). */
export const isGuidePhoto = (path: string): boolean => ((isTravel(path) || isHiking(path)) && !PRECACHED_TRIP_FILES.test(path)) || isWeddingPhoto(path);
/** The maps' MapLibre: its chunk (`maplibre.*.js`, named so by vite.config.ts, with the maps' engines), its worker and
 *  its CSS (~1.8 MB raw, ~480 KB on the wire): not at install, but kept in the shell the first time a map draws, and
 *  carried by each install after that (copied when unchanged, fetched when changed: index.ts). */
const isMapLibre = (path: string): boolean => /\/_app\/immutable\/(chunks\/maplibre\.|workers\/maplibre-gl-worker-|assets\/maplibre\.)/.test(path);
/** What a phone may never open (vite.config.ts feature-names): the English catalogs' chunks (`en`, `en-<part>`: only
 *  with English on), the wedding board's (`wedding`), ごはん's barcode decoder (`scan`, its wasm beside it, ~400 KB
 *  on the wire) and 英語すごろく's word lists (`sg`, ~150 KB: a game first opened offline has no words). Not precached
 *  (the English ones change with every string): kept once used, and carried by each install after that. */
const isFeatureChunk = (path: string): boolean => /\/_app\/immutable\/(chunks\/(en(-[\w-]+)?|wedding|scan|sg)\.[\w-]+\.js|assets\/zxing_reader\.[\w-]+\.wasm)$/.test(path);
/** A carried chunk's name (`en-<part>`; `wedding`, `sg`: one name for all the feature's chunks; `scan`, its
 *  wasm's too) in its path or URL, else null. */
export const carriedNameOf = (path: string): string | null =>
  /(?:^|\/)_app\/immutable\/assets\/zxing_reader\.[\w-]+\.wasm$/.test(path) ? 'scan'
  : (/(?:^|\/)_app\/immutable\/chunks\/(en(?:-[\w-]+)?|wedding|scan|sg)\.[\w-]+\.js$/.exec(path)?.[1] ?? null);
/** The build files kept in the shell on first use and carried by each install (MapLibre and the features above): listed in the worker's manifest though not precached (vite.config.ts swPrecacheOnly). */
export const carried = (path: string): boolean => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return isMapLibre(p) || isFeatureChunk(p);
};

/**
 * What an install does with this build's carried files (`files`, as the manifest lists them) given what the older
 * shells hold (`held`: their URLs or paths): `copy` the ones they hold as they are; `fetch` the changed ones a phone
 * uses: all of MapLibre's once a map has drawn (any of its files held), and a feature's chunk whose
 * name is held (another build's copy). The rest wait for first use.
 */
export function carryPlan(files: readonly string[], held: readonly string[]): { copy: string[]; fetch: string[] } {
  const path = (u: string) => (/^https?:/.test(u) ? new URL(u).pathname : u.startsWith('/') ? u : `/${u}`);
  const have = new Set(held.map(path));
  const names = new Set([...have].map(carriedNameOf).filter((n) => n !== null));
  const map = [...have].some(isMapLibre);
  const copy: string[] = [], fetch: string[] = [];
  for (const f of files) {
    const p = path(f);
    if ([...have].some((h) => h.endsWith(p))) copy.push(f);
    else if (isMapLibre(p) ? map : names.has(carriedNameOf(p) ?? '')) fetch.push(f);
  }
  return { copy, fetch };
}
/** An install's hashed chunks (`paths`, resolved against `base`): one this shell holds already kept (a worker
 *  reinstalled under the same version), one an older shell holds copied (a hashed name: the very same file), the rest
 *  returned, to fetch. Each cache's keys read once, the copies at once: it was a match against this shell, then each
 *  older one, one after another for each of ~650 chunks (~2,800 lookups in a row at a launch after a deploy). */
export async function copyChunks(paths: readonly string[], cache: Pick<Cache, 'keys' | 'put'>, olds: readonly Pick<Cache, 'keys' | 'match'>[], base: string): Promise<string[]> {
  const [own, ...held] = await Promise.all([cache, ...olds].map(async (c) => new Set((await c.keys()).map((r) => r.url))));
  const missing = new Set<string>();
  await Promise.all(paths.map(async (p) => {
    const u = new URL(p, base).href;
    if (own.has(u)) return;
    const i = held.findIndex((h) => h.has(u));
    const hit = i < 0 ? undefined : await olds[i].match(u);
    if (hit) await cache.put(p, hit);
    else missing.add(p);
  }));
  return paths.filter((p) => missing.has(p));
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

/** The font cache's entries (`keys`, URLs) this build's style sheets (`css`: the shell's, all of them) don't name: a
 *  re-subset's old slices (hashed names: never asked for again), ~3.6 MB a generation. None when the sheets name no
 *  font at all (something else is wrong: keep everything). */
export function staleFonts(keys: readonly string[], css: string): string[] {
  if (!/\.woff2?\b/.test(css)) return [];
  return keys.filter((u) => !css.includes(new URL(u, 'https://x/').pathname.split('/').pop()!));
}

/** The font slices precached (Zen Maru Gothic's 500 and 700, src/lib/styles/fonts.css; Fredoka's Latin): the ones
 *  holding ~99% of the characters the app's own strings show (scripts/font-subsets.ts's count), ~0.7 MB. The other
 *  slices (rare kanji, the map's labels) are cached on first use (FONTS). */
export const PRECACHED_FONT_SLICES = ['119', '117', '116', '115', '114', '113', '112', '111', '110', '109', '108', '118', '107', '106', '105', '104', '103', '102', '101', '100', '99', '98', '97', '96', '95', '94', '92', 'latin'];
const PRECACHED_FONT = new RegExp(`/(zen-maru-gothic-(${PRECACHED_FONT_SLICES.join('|')})-[57]00-normal|fredoka-latin-[67]00-normal)\\.[\\w-]+\\.woff2$`);
/** The two default villagers' art is precached (lib/villagers/look.ts DEFAULT_VILLAGER); the rest is cached on use. */
const PRECACHED_VILLAGERS = /\/art\/villagers\/(goldie|anchovy)(-icon)?\.webp$/;

/** Whether a build file goes into the install-time precache. Paths come from `$app/manifest` relative to the base
 *  (`art/…`, `audio/…`), so they are matched with a leading slash. Not precached: the font slices but the common ones
 *  (PRECACHED_FONT_SLICES; the rest cached on first use),
 *  the bundled art and audio manifests, every villager but the defaults, every critter, find and present (all cached
 *  on first use), all audio (AUDIO_CACHE, on first play), the tent's room (ROOM_CACHE, on first use), the food data (FOOD_CACHE, on first use), the food pictures (FOOD_IMG_CACHE, on first use), English Study's banks (ENGLISH_CACHE, on first use), the guides' photos but the trips' covers and the trails' tracks, and the wedding's banner (PHOTO_CACHE), the maps' MapLibre and the features a phone may never open (carried: kept once used), the app icons and macOS
 *  litter. */
export function precachable(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  if ((isFont(p) && !PRECACHED_FONT.test(p)) || isAudio(p) || isCritterArt(p) || isDecorArt(p) || isRoomAsset(p) || isFoodData(p) || isEnglishData(p) || isFoodImg(p) || isGuidePhoto(p) || isMapLibre(p) || isFeatureChunk(p) || isAppIcon(p) || p.endsWith('/art/manifest.json') || p.endsWith('.DS_Store')) return false;
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

/** A launch online races the network for the shell this long (ms), the page's whole HTML, to learn whether this build
 *  is still the deployed one (FRESH_KEY); the page is this version's cached shell whatever it says. Past the phones'
 *  version.json ask (median 191 ms, p90 300). */
export const RACE_MS = 400;
/** No race at all when the network said this build was the deployed one this recently (ms; FRESH_KEY): the network's
 *  round trip saved on a quick relaunch (a third of cold opens come within minutes of a hide), a deploy in between taken
 *  at the next hide. */
export const FRESH_MS = 5 * 60_000;
/** The shell cache's entry saying when the network last named this build the deployed one (ms since the epoch). */
export const FRESH_KEY = '__fresh';
/** Where a navigation's page came from, always this version's cached shell: `new` the network's page another build's
 *  (taken at the next hide: ui-state/update.ts); `same` the network's page this build's (confirmed); `skip` confirmed
 *  within FRESH_MS (no race); `cache` the network late, failed or offline (or the boot watchdog's `?shell=cache`).
 *  Till the launch review 11-21 a newer build's page in time booted (`net`) under this worker, which missed its own
 *  cache for each of the new build's chunks while the new worker installed: 48 % of launches, shown 2,343 vs 1,695 ms.
 *  Only a worker from before then still says `net` (boot.ts reads it). */
type ShellFrom = 'new' | 'same' | 'skip' | 'cache';

/** Whether a navigation's network answer is a page of ours: HTML, our origin, and either the page or the SPA
 *  fallback (404.html is index.html: build script). */
const bootable = (res: Response): boolean => (res.ok || res.status === 404) && res.type === 'basic' && (res.headers.get('content-type') ?? '').includes('text/html');

export interface Raced {
  res: Response;
  from: ShellFrom;
  /** The race's ms from the navigation's fetch event (`t0`) to the network's whole page, or to the race lost (0: no
   *  race). The network's page is the navigation preload's, asked as the navigation starts: it is often in before the
   *  race begins (the cache's shell looked up first), and the race's own wait is then ~0. */
  ms: number;
}

/** A navigation's answer when this version has a cached shell (`own`): `own`, and what the network's page (`net`: null
 *  offline) says if all of it is in within `raceMs` of the race's start: this build (`same`) or another (`new`); a
 *  late or unusable answer is let go (`cache`). */
export async function raceShell(own: Response, net: Promise<Response | null | undefined> | null, version: string, raceMs = RACE_MS, now: () => number = Date.now, t0 = now()): Promise<Raced> {
  if (!net) return { res: own, from: 'cache', ms: 0 };
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<null>((r) => (timer = setTimeout(r, raceMs, null)));
  // (the whole body within the race: a page whose headers came in time but its body didn't waited on it, the cache's
  // copy at hand: review 11-14 #1)
  const read = net.then(async (r) => {
    if (!r) return null;
    if (!bootable(r)) return void r.body?.cancel().catch(() => {}), null;
    return await r.text();
  }).catch(() => null);
  const html = await Promise.race([read, late]);
  clearTimeout(timer);
  const ms = Math.round(now() - t0);
  if (html === null) return { res: own, from: 'cache', ms };
  return { res: own, from: isShellOf(html, version) ? 'same' : 'new', ms };
}

/** Whether the network named this build the deployed one within FRESH_MS (FRESH_KEY's time, `at`). */
export const freshNow = (at: number | null, now = Date.now()): boolean => at !== null && now - at >= 0 && now - at < FRESH_MS;

/** A navigation's steps in the worker (ms): from its start to the fetch event (`up`), from the event to the shell's
 *  lookup (`own`) and FRESH_KEY's (`fresh`), each once it's over. */
export type Steps = { up?: number; own?: number; fresh?: number };
/** A shell's answer saying where it came from and the race's ms (Server-Timing `shell`: perf.boot's, world3d/boot.ts
 *  shellFrom); with `at`, its fetch event's clock (ms since the epoch: `t0`, `desc` 1 when the worker had just started
 *  for it), the page's `pre`: on WebKit the page's clock starts only once this answer is in; and its steps (`sw`:
 *  `up`, `own`, `fresh` and `ans`, the answer made, ms from the event: perf.boot swUp, swOwn, swFresh, swAns). */
export function marked({ res, from, ms }: Raced, at?: { t0: number; cold: boolean; steps?: Steps }, now = Date.now()): Response {
  const headers = new Headers(res.headers);
  headers.append('Server-Timing', `shell;desc=${from};dur=${ms}`);
  if (at) headers.append('Server-Timing', `t0;desc=${at.cold ? 1 : 0};dur=${at.t0}`);
  if (at?.steps) for (const [k, v] of [...Object.entries(at.steps), ['ans', now - at.t0]] as const) if (v !== undefined) headers.append('Server-Timing', `sw;desc=${k};dur=${Math.max(0, Math.round(v))}`);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

/** The worker's own network fetches lately (perf.boot's `swNet`, `swRoom`, `swKB`: the page's resource timings read a
 *  transfer size of 0 for every answer the worker gives, one it fetched too): when each started, a room file or not,
 *  its bytes: its Content-Length, else the size its cache's index takes (`sized`: the room's, the art's;
 *  Pages sends the models brotli'd, with none), else 0 (never a copy of the body read for it); the last `keep`. The
 *  navigation preload isn't one (the browser's). */
export function netLog(keep = 600) {
  const rows: [t: number, room: boolean, bytes: number, url: string][] = [];
  return {
    track(res: Promise<Response>, url: string, t = Date.now()): Promise<Response> {
      const row: [number, boolean, number, string] = [t, isRoomAsset(url), 0, url];
      if (rows.push(row) > keep) rows.shift();
      return res.then((r) => ((row[2] = Number(r.headers.get('content-length')) || 0), r));
    },
    /** `url`'s newest fetch without a Content-Length is `bytes` long (the size its index was given). */
    sized(url: string, bytes: number): void {
      for (let i = rows.length - 1; i >= 0; i--) if (rows[i][3] === url) return void (rows[i][2] ||= bytes);
    },
    since(t0: number): { swNet: number; swRoom: number; swKB: number } {
      let n = 0, room = 0, b = 0;
      for (const [t, r, x] of rows) if (t >= t0) (n++, (room += +r), (b += x));
      return { swNet: n, swRoom: room, swKB: Math.round(b / 1024) };
    }
  };
}

/** Older shells' copy of a request, newest first (`keys` in creation order: caches.match would answer the oldest). */
export async function fromOlder(store: Pick<CacheStorage, 'keys' | 'open'>, current: string, req: Request | string): Promise<Response | undefined> {
  for (const k of olderShells(await store.keys(), current)) {
    const hit = await (await store.open(k)).match(req);
    if (hit) return hit;
  }
  return undefined;
}

// ---- offline guides and maps (docs/backend.md "Service worker" › Offline): kept as they are seen, never prefetched

/** マイ食品's own pictures (the relay's `/img/<id>`, lib/food/customPics.svelte.ts): an id is its bytes' hash, so a
 *  hit is never stale. Kept once seen, at most OWN_PHOTO_MAX (the least recently used out); one taken on this phone and
 *  not uploaded yet waits in OWN_PHOTO_PENDING (never bounded: lib/food/photoUpload.ts moves it here once the relay
 *  has it). */
export const OWN_PHOTO_CACHE = 'island-food-photo-v1';
export const OWN_PHOTO_PENDING = 'island-food-photo-pending-v1';
export const OWN_PHOTO_MAX = 300;
/** A relay's `/img/<id>` (another origin's: the page's own never). */
export const isOwnPhotoUrl = (url: URL, self: string): boolean => url.origin !== self && /^\/img\/[0-9a-f]{32}$/.test(url.pathname);
/** Which own pictures go: past OWN_PHOTO_MAX, the least recently used. */
export function ownPhotoEvict(index: RoomIndex, max = OWN_PHOTO_MAX): string[] {
  const urls = Object.keys(index).sort((a, b) => index[a][1] - index[b][1]);
  return urls.slice(0, Math.max(0, urls.length - max));
}
/** An own picture: the one waiting to upload, else the kept one, else the network's (a CORS answer, kept when ok). */
export async function ownPhotoFetch(req: Request, pending: Pick<Cache, 'match'>, cache: Pick<Cache, 'match' | 'put'>, net: (r: Request) => Promise<Response>, after: (p: Promise<unknown>) => void, used?: (url: string, bytes?: number) => void): Promise<Response> {
  const wait = await pending.match(req.url).catch(() => undefined);
  if (wait) return wait;
  const hit = await cache.match(req.url).catch(() => undefined);
  if (hit) {
    used?.(req.url);
    return hit;
  }
  const res = await net(req);
  if (res.ok && res.type !== 'opaque') {
    const copy = res.clone();
    after((async () => {
      const b = await copy.blob();
      await cache.put(req.url, new Response(b, { headers: { 'content-type': copy.headers.get('content-type') ?? 'image/jpeg' } }));
      used?.(req.url, b.size);
    })().catch(() => {}));
  }
  return res;
}

/** The guides' photos (isGuidePhoto) once seen: a cache that outlives builds, revalidated in the background. */
export const PHOTO_CACHE = 'island-photos-v1';
/** All the guides' photos are ~3.7 MB: the bound is for what a new trip adds. */
export const PHOTO_CAP_BYTES = 20_000_000;
/** A seen photo is served from the cache and checked again in the background once it is older than this. */
export const PHOTO_FRESH_MS = 24 * 3600_000;
/** The maps' tiles once seen (OpenFreeMap's vector tiles, USGS's and GSI's raster topo): only what a map drew. */
export const TILE_CACHE = 'island-tiles-v1';
export const TILE_CAP_BYTES = 30_000_000;
/** And by count (the origin's entries: SHELLS_KEPT; ~20-60 KB a tile; 800 and 60 MB till 2026-11-21, when a phone held
 *  498, 23 MB): a trail's or a city's few views; a trip or a trail kept whole offline is a saved area, never bounded. */
export const TILE_CAP_N = 300;
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

/** `index` less the URLs `gone`. */
const without = (index: RoomIndex, gone: readonly string[]): RoomIndex => {
  const rest = { ...index };
  for (const u of gone) delete rest[u];
  return rest;
};

/**
 * A bounded cache's entries (any order: [bytes, last use]) to delete so the rest is within `cap` bytes and `maxN`
 * entries: the least recently used first, never one used within `keepMs`. Every bounded cache's evictor ends in it,
 * after its own stale rule:
 *
 * | cache | cap | kept (used within) | stale at once |
 * |---|---|---|---|
 * | room (models, packs) | ROOM_CAP_BYTES 100 MB, ROOM_CAP_N 1,000 | ROOM_KEEP_MS 3 d: the island, tent and museum now | a path's older `?v=`, a pack's slices, a pack unused PAK_UNUSED_MS 7 d, any other file ROOM_UNUSED_MS 14 d |
 * | art (on use) | ART_CAP_BYTES 30 MB, ART_CAP_N 500 | ART_KEEP_MS 24 h: what the island shows now | a ずかん pack's older hash (artEvict) |
 * | food-img (sheets) | FOOD_IMG_CAP_BYTES 40 MB, FOOD_IMG_CAP_N 300 | 0 | the sheets a new index no longer names (foodImgStale) |
 * | photos, tiles | PHOTO_CAP_BYTES 20 MB, TILE_CAP_BYTES 30 MB, TILE_CAP_N 300 | 0 | refetched past PHOTO_FRESH_MS 24 h / TILE_FRESH_MS 14 d |
 */
export function bytesEvict(index: RoomIndex, now: number, cap: number, keepMs = 0, maxN = Infinity): string[] {
  let total = 0, n = 0;
  for (const u in index) (total += index[u][0]), n++;
  const out: string[] = [];
  for (const u of Object.keys(index).filter((u) => now - index[u][1] > keepMs).sort((a, b) => index[a][1] - index[b][1])) {
    if (total <= cap && n <= maxN) break;
    out.push(u);
    total -= index[u][0];
    n--;
  }
  return out;
}

type SwrCache = Pick<Cache, 'match' | 'put'>;
interface SwrOptions {
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
/** One fetch at a time per URL (`flying`: those on their way): a second ask while the first is on its way (two tabs,
 *  a page's prefetch and its play) shares its answer, each its own copy. */
export function fetchShared(flying: Map<string, Promise<Response>>, url: string, get: () => Promise<Response>): Promise<Response> {
  let p = flying.get(url);
  if (!p) {
    const mine = (p = get());
    flying.set(url, mine);
    const done = () => void (flying.get(url) === mine && flying.delete(url));
    mine.then(done, done);
  }
  return p.then((r) => r.clone());
}

export async function fetchKeep(req: Request, get: (r: Request) => Promise<Response>, keep: (res: Response) => Promise<unknown>, waitUntil: (p: Promise<unknown>) => void): Promise<Response> {
  const res = await get(req);
  if (res.ok) waitUntil(keep(res.clone()).catch(() => {}));
  return res;
}

/** The most files a first launch's warm-up keeps (a cold launch to the island asks for ~370, ~250 of them these). */
export const WARM_MAX = 800;
/** The room's files of a page's `used` message (world3d/ktx2.ts usedFile: KTX2s read back from its own cache): ours,
 *  under /room/, each once, at most WARM_MAX. */
export function roomFiles(urls: readonly unknown[], origin: string): string[] {
  const out = new Set<string>();
  for (const u of urls) {
    if (typeof u !== 'string' || out.size >= WARM_MAX) continue;
    try {
      const url = new URL(u);
      if (url.origin === origin && isRoomAsset(url.pathname)) out.add(url.href);
    } catch {
      /* not a URL */
    }
  }
  return [...out];
}
/** A first launch's files the worker keeps once it's in (the page's, fetched before it was: ui-state/swLate.ts, the
 *  `warm` message): the room's (models, KTX2 packs, the players' packs, the transcoder) and the art cached on first
 *  use, ours only, each once, at most WARM_MAX. Not the precached villager art (the install has it). */
export function warmable(urls: readonly unknown[], origin: string): string[] {
  const out = new Set<string>();
  for (const u of urls) {
    if (typeof u !== 'string' || out.size >= WARM_MAX) continue;
    let url: URL;
    try {
      url = new URL(u);
    } catch {
      continue;
    }
    const p = url.pathname;
    if (url.origin !== origin || PRECACHED_VILLAGERS.test(p)) continue;
    if (isRoomAsset(p) || isVillagerArt(p) || isCritterArt(p) || isDecorArt(p)) out.add(url.href);
  }
  return [...out];
}

