// English Study's data on the phone (docs/english.md "Data"): the library's index, in the sheet's chunk (catalog.ts:
// built from clips/ by vite.config.ts english-data), and a clip's bank, fetched when its lesson opens or home
// prefetches it (the service worker keeps it: caches.ts ENGLISH_CACHE). A fetch that fails is forgotten, so もう一度
// asks again (and the lesson reloads into the newer build when that fails online too: a page from an older build asks
// for a file the deploy took away). A failure is logged (english.fail `bank`: its HTTP status, none for no answer).
import INDEX, { DECK } from './clips/index.ts?english-index';
import { staticUrl } from '#lib/staticUrl.ts';
import { log } from '#lib/sync/log.ts';
import { bankPath, shardPath, type ClipMeta, type PhraseEntry } from './catalog.ts';
import type { Bank } from './types.ts';

/** Every clip with a lesson, in the order they're offered (the shared plan: plan.ts). */
export const LIBRARY: readonly ClipMeta[] = INDEX;
const byId = new Map(LIBRARY.map((m) => [m.id, m]));
export const metaById = (id: string): ClipMeta | undefined => byId.get(id);

/** One fetch at a time of each file, its JSON checked; a failure forgotten (asked again next time) and logged
 *  (english.fail: `fail`, with its HTTP status, none for no answer; `bad` an answer that wasn't the file). */
function cachedJson<T>(cache: Map<string, Promise<T>>, path: string, check: (x: unknown) => x is T, fail: Record<string, string | number>): Promise<T> {
  let p = cache.get(path);
  if (!p) {
    let http: number | undefined;
    p = fetch(staticUrl(path)).then(async (res) => {
      http = res.status;
      if (!res.ok) throw new Error(`english ${path}: ${res.status}`);
      const x: unknown = await res.json();
      if (!check(x)) throw new Error(`english ${path}: not the file`);
      return x;
    });
    p.catch(() => {
      cache.delete(path);
      const on = navigator.onLine;
      log('english.fail', { ...fail, ...(http !== undefined && { http }), ...(http !== undefined && http < 300 && { bad: true }), on }, on ? 2 : 1);
    });
    cache.set(path, p);
  }
  return p;
}

const banks = new Map<string, Promise<Bank>>();
/** The banks fetched this session (a lesson opened on one starts with it, no wait). */
const loaded = new Map<string, Bank>();
export const bankNow = (m: ClipMeta): Bank | undefined => loaded.get(bankPath(m));

/** A clip's bank. Rejects offline or on a failed fetch (asked again next time). */
export function loadBank(m: ClipMeta): Promise<Bank> {
  const path = bankPath(m);
  const isBank = (x: unknown): x is Bank => (x as Bank | null)?.id === m.id && Array.isArray((x as Bank).questions);
  return cachedJson(banks, path, isBank, { what: 'bank', clip: m.id }).then((b) => (loaded.set(path, b), b));
}

/** Fetch these banks ahead (home, while idle), quietly. */
export function prefetch(ms: readonly (ClipMeta | undefined)[]): void {
  for (const m of ms) if (m) loadBank(m).catch(() => {});
}

const shards = new Map<string, Promise<PhraseEntry[]>>();
/** フレーズ's deck file `n` (catalog.ts shardsOf). Rejects offline or on a failed fetch (asked again next time; logged:
 *  english.fail `deck`). */
export const loadShard = (n: number): Promise<PhraseEntry[]> =>
  cachedJson(shards, shardPath(n, DECK[n]), (x): x is PhraseEntry[] => Array.isArray(x), { what: 'deck', n });
