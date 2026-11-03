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
 *  the balloon presents and the visitors' extras (shown only when one is about or in the ずかん), and the baked terrain
 *  (one season of four shows; its URLs carry a content version, terrain.json): cached on first use, not at install. */
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
/** The bridge's deck seen from above: the terrain bake's input (scripts/terrain.ts), never shown by the app. */
const isBakeArt = (path: string): boolean => /\/art\/bridges\/[a-z-]+-deck(-winter)?\.webp$/.test(path);
/** The home-screen and install icons: the OS fetches them when the app is added, never the page offline (the favicon
 *  only needs the network). */
const isAppIcon = (path: string): boolean => path.includes('/icons/');
/** The two default villagers' art is precached (lib/villagers/look.ts DEFAULT_VILLAGER); the rest is cached on use. */
const PRECACHED_VILLAGERS = /\/art\/villagers\/(goldie|anchovy)(-icon)?\.webp$/;

/** Whether a build file goes into the install-time precache. Paths come from `$app/manifest` relative to the base
 *  (`art/…`, `audio/…`), so they are matched with a leading slash. Not precached: font subsets (cached on first use),
 *  the bundled art and audio manifests, every villager but the defaults, every critter, find and present (all cached
 *  on first use), all audio (AUDIO_CACHE, on first play), the tent's room (ROOM_CACHE, on first use), the bake's input art, the app icons and macOS litter. */
export function precachable(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (isFont(p) || isAudio(p) || isCritterArt(p) || isDecorArt(p) || isRoomAsset(p) || isBakeArt(p) || isAppIcon(p) || p.endsWith('/art/manifest.json') || p.endsWith('.DS_Store')) return false;
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
