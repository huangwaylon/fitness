// The service worker's cache generations, pure so it can be tested without a worker.

export const SHELL = 'island-shell-';

/** What `activate` deletes: every cache but the current shell, the previous shell (the newest older one: a page
 *  still running the old build loads its lazy chunks from it) and the long-lived runtime caches. `keys` is in
 *  creation order (CacheStorage.keys()). */
export function staleCaches(keys: readonly string[], current: string, keep: readonly string[]): string[] {
  const previous = keys.filter((k) => k.startsWith(SHELL) && k !== current).at(-1);
  return keys.filter((k) => k !== current && k !== previous && !keep.includes(k));
}

/** The audio runtime cache (docs/design.md#engine-lifecycle): music files are 0.4–0.8 MB each, so only the most recently
 *  played few stay on the phone. */
export const AUDIO_CACHE = 'island-audio-v1';
const MUSIC_KEEP = 3;
export const isAudio = (path: string): boolean => path.includes('/audio/');
export const isMusic = (path: string): boolean => path.includes('/audio/music/');

/** Least recently used first out: `keys` in use order (oldest first: a hit is re-put at the end); which to delete so
 *  at most `keep` music files remain. Effects and ambience (small) are never evicted. */
export function lruEvict(keys: readonly string[]): string[] {
  const music = keys.filter((k) => isMusic(new URL(k, 'https://x/').pathname));
  return music.slice(0, Math.max(0, music.length - MUSIC_KEEP));
}

export const isFont = (path: string): boolean => /\.(woff2?|ttf)$/.test(path);
export const isVillagerArt = (path: string): boolean => path.includes('/art/villagers/');
/** The island's catches (fish, bugs, junk): shown only after a catch, so cached on first use, not at install. */
export const isCritterArt = (path: string): boolean => path.includes('/art/critters/');
/** The two default villagers' art is precached (lib/villagers/look.ts DEFAULT_VILLAGER); the rest is cached on use. */
const PRECACHED_VILLAGERS = /\/art\/villagers\/(goldie|anchovy)(-icon)?\.webp$/;

/** Whether a build file goes into the install-time precache. Paths come from `$app/manifest` relative to the base
 *  (`art/…`, `audio/…`), so they are matched with a leading slash. Not precached: font subsets (cached on first use),
 *  the bundled art and audio manifests, every villager but the defaults and every critter (both cached on first
 *  use), all audio (AUDIO_CACHE, on first play) and macOS litter. */
export function precachable(path: string): boolean {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (isFont(p) || isAudio(p) || isCritterArt(p) || p.endsWith('/art/manifest.json') || p.endsWith('.DS_Store')) return false;
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
