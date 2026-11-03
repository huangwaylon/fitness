// The service worker's cache generations, pure so it can be tested without a worker.

export const SHELL = 'island-shell-';

/** What `activate` deletes: every cache but the current shell, the previous shell (the newest older one: a page
 *  still running the old build loads its lazy chunks from it) and the long-lived runtime caches. `keys` is in
 *  creation order (CacheStorage.keys()). */
export function staleCaches(keys: readonly string[], current: string, keep: readonly string[]): string[] {
  const previous = keys.filter((k) => k.startsWith(SHELL) && k !== current).at(-1);
  return keys.filter((k) => k !== current && k !== previous && !keep.includes(k));
}

/** The older shells a new install may copy its unchanged hashed chunks from, the newest first (`keys` in creation
 *  order). */
export function olderShells(keys: readonly string[], current: string): string[] {
  return keys.filter((k) => k.startsWith(SHELL) && k !== current).reverse();
}

/** The audio runtime cache (docs/design.md#engine-lifecycle): music files (the hours, the event music, K.K.'s songs)
 *  are 0.1–1.1 MB each, so only the most recently played few stay on the phone. */
export const AUDIO_CACHE = 'island-audio-v1';
const MUSIC_KEEP = 3;
export const isAudio = (path: string): boolean => path.includes('/audio/');
export const isMusic = (path: string): boolean => path.includes('/audio/music/') || path.includes('/audio/kk/');

/** Least recently used first out: `keys` in use order (oldest first: a hit is re-put at the end); which to delete so
 *  at most `keep` music files remain. Effects and ambience (small) are never evicted. */
export function lruEvict(keys: readonly string[]): string[] {
  const music = keys.filter((k) => isMusic(new URL(k, 'https://x/').pathname));
  return music.slice(0, Math.max(0, music.length - MUSIC_KEEP));
}

export const isFont = (path: string): boolean => /\.(woff2?|ttf)$/.test(path);
export const isVillagerArt = (path: string): boolean => path.includes('/art/villagers/');
/** The island's scenery art: the catches (fish, bugs, junk), the beach finds (shells, fossils, fragments, the bottle),
 *  the balloon presents and the visitors' extras (shown only when one is about or in the ずかん), and NH's ground
 *  textures (terrain/nh/: the layout's terrain): cached on first use, not at install. */
export const isCritterArt = (path: string): boolean =>
  path.includes('/art/critters/') || path.includes('/art/finds/') || path.includes('/art/presents/') || path.includes('/terrain/');
/** The world's dressing for a season or the night and its decor (island/scene.ts, world.ts): the buildings' and the
 *  cedar's winter looks, the lit windows, the fences, lanterns, rocks, bamboo and the wild flowers (a season's kinds
 *  and their hybrids): cached on first use, not at install. */
export const isDecorArt = (path: string): boolean =>
  /\/art\/.+-(winter|lit)\.webp$/.test(path) ||
  /\/art\/(deco\/(fence-(wooden|corral|bamboo)|garden-(lantern|lantern-white|rock)|flat-rock)|trees\/bamboo)\.webp$/.test(path) ||
  /\/art\/flowers\/[a-z-]+\.webp$/.test(path);
/** The tent's room (docs/design.md "The tent"): its models, wallpapers, floors and icons, fetched as the tent shows
 *  them and cached on first use in a cache of their own that outlives builds (a re-converted model has a new `?v=`). */
export const ROOM_CACHE = 'island-room-v1';
export const isRoomAsset = (path: string): boolean => path.includes('/room/');
/** The meal log's food data (static/food/, lib/food/load.ts): ~5 MB, fetched when the food sheet first opens and kept in
 *  a cache of its own that outlives builds. Its files carry the data's version (`?v=`); index.json, which names it,
 *  doesn't. */
export const FOOD_CACHE = 'island-food-v1';
export const isFoodData = (path: string): boolean => /\/food\/[\w-]+\.json$/.test(path);
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
/** The home-screen and install icons: the OS fetches them when the app is added, never the page offline (the favicon
 *  only needs the network). */
const isAppIcon = (path: string): boolean => path.includes('/icons/');
/** The two default villagers' art is precached (lib/villagers/look.ts DEFAULT_VILLAGER); the rest is cached on use. */
const PRECACHED_VILLAGERS = /\/art\/villagers\/(goldie|anchovy)(-icon)?\.webp$/;

/** Whether a build file goes into the install-time precache. Paths come from `$app/manifest` relative to the base
 *  (`art/…`, `audio/…`), so they are matched with a leading slash. Not precached: font subsets (cached on first use),
 *  the bundled art and audio manifests, every villager but the defaults, every critter, find and present (all cached
 *  on first use), all audio (AUDIO_CACHE, on first play), the tent's room (ROOM_CACHE, on first use), the food data (FOOD_CACHE, on first use), the app icons and macOS litter. */
export function precachable(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (isFont(p) || isAudio(p) || isCritterArt(p) || isDecorArt(p) || isRoomAsset(p) || isFoodData(p) || isAppIcon(p) || p.endsWith('/art/manifest.json') || p.endsWith('.DS_Store')) return false;
  return !isVillagerArt(p) || PRECACHED_VILLAGERS.test(p);
}

/**
 * A navigation's response becomes this version's offline shell only if the version has none yet (offline at
 * install). Never over one: right after a deploy the old worker still answers navigations, and the new build's
 * HTML in the old cache would point at chunks no cache holds, a blank screen offline if the new worker's install
 * then fails. Each version's install caches its own shell.
 */
export async function keepShell(cache: Pick<Cache, 'match' | 'put'>, scope: string, res: Response): Promise<void> {
  if (res.ok && !(await cache.match(scope))) return cache.put(scope, res);
  await res.body?.cancel().catch(() => {}); // the unused copy: don't buffer it
}
