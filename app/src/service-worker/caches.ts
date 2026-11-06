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

/** The audio runtime cache (docs/design.md#engine-lifecycle). Every audio URL carries its file's content hash (`?v=`,
 *  lib/sound/manifest.ts), so a hit is never stale and is served without asking the network; a re-cut file is a new
 *  URL, and the old one ages out of its class's LRU. Four classes, each keeping its most recently used few: the music
 *  (the hours, the event music, the rooms: 0.1–1.1 MB each), K.K.'s songs (a song or two heard: they never push the
 *  hours out), ききみみ's spoken clips (~18 KB each; 40 hold any one game: 8 clips and 8 slow ones at levels 1-2, level 4's dialogues
 *  up to 4 lines each, にがて れんしゅう's 8 items all dialogues at worst 32; never pushing the effects out) and the rest
 *  (the effects and beds: small). */
export const AUDIO_CACHE = 'island-audio-v1';
export const isAudio = (path: string): boolean => path.includes('/audio/');
export const isMusic = (path: string): boolean => path.includes('/audio/music/') || path.includes('/audio/places/');
const isKK = (path: string): boolean => path.includes('/audio/kk/');
const isKiki = (path: string): boolean => path.includes('/audio/kikimimi/');
type AudioClass = 'music' | 'kk' | 'kiki' | 'sfx';
const KEEP: Record<AudioClass, number> = { music: 3, kk: 2, kiki: 40, sfx: 8 };
const classOf = (url: string): AudioClass => {
  const p = new URL(url, 'https://x/').pathname;
  return isMusic(p) ? 'music' : isKK(p) ? 'kk' : isKiki(p) ? 'kiki' : 'sfx';
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
/** The trips' photos (static/travel/; docs/travel.md): fetched as a trip is read, never at install. */
const isTravel = (path: string): boolean => path.includes('/travel/');
/** The trip map's MapLibre: its chunk (`maplibre.*.js`, named so by vite.config.ts), its worker and its CSS (~1.8 MB
 *  in all): online only, like the tiles, so fetched when a map is drawn and never at install. */
const isMapLibre = (path: string): boolean => /\/_app\/immutable\/(chunks\/maplibre\.|workers\/maplibre-gl-worker-|assets\/maplibre\.)/.test(path);
/** The two default villagers' art is precached (lib/villagers/look.ts DEFAULT_VILLAGER); the rest is cached on use. */
const PRECACHED_VILLAGERS = /\/art\/villagers\/(goldie|anchovy)(-icon)?\.webp$/;

/** Whether a build file goes into the install-time precache. Paths come from `$app/manifest` relative to the base
 *  (`art/…`, `audio/…`), so they are matched with a leading slash. Not precached: font subsets (cached on first use),
 *  the bundled art and audio manifests, every villager but the defaults, every critter, find and present (all cached
 *  on first use), all audio (AUDIO_CACHE, on first play), the tent's room (ROOM_CACHE, on first use), the food data (FOOD_CACHE, on first use), the trips' photos (travel/), the trip map's MapLibre, the app icons and macOS
 *  litter. */
export function precachable(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (isFont(p) || isAudio(p) || isCritterArt(p) || isDecorArt(p) || isRoomAsset(p) || isFoodData(p) || isTravel(p) || isMapLibre(p) || isAppIcon(p) || p.endsWith('/art/manifest.json') || p.endsWith('.DS_Store')) return false;
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
