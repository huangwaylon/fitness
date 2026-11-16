// English Study's data on the phone (docs/english.md "Data"): the library's index, in the sheet's chunk (catalog.ts:
// built from clips/ by vite.config.ts english-data), and a clip's bank, fetched when its lesson opens or home
// prefetches it (the service worker keeps it: caches.ts ENGLISH_CACHE). A fetch that fails is forgotten, so もう一度
// asks again (and the lesson reloads into the newer build when that fails online too: a page from an older build asks
// for a file the deploy took away). A failure is logged (english.fail `bank`: its HTTP status, none for no answer).
import INDEX from './clips/index.ts?english-index';
import { staticUrl } from '#lib/staticUrl.ts';
import { log } from '#lib/sync/log.ts';
import { bankPath, type ClipMeta } from './catalog.ts';
import type { Bank } from './types.ts';

/** Every clip with a lesson, in the order they're offered (the shared plan: plan.ts). */
export const LIBRARY: readonly ClipMeta[] = INDEX;
const byId = new Map(LIBRARY.map((m) => [m.id, m]));
export const metaById = (id: string): ClipMeta | undefined => byId.get(id);

const keyOf = (m: ClipMeta) => `${m.id}.${m.v}${m.sv ?? ''}${m.tv ?? ''}`;
const banks = new Map<string, Promise<Bank>>();
/** The banks fetched this session (a lesson opened on one starts with it, no wait). */
const loaded = new Map<string, Bank>();
export const bankNow = (m: ClipMeta): Bank | undefined => loaded.get(keyOf(m));

/** A clip's bank. Rejects offline or on a failed fetch (asked again next time). */
export function loadBank(m: ClipMeta): Promise<Bank> {
  const key = keyOf(m);
  let p = banks.get(key);
  if (!p) {
    let http: number | undefined;
    p = fetch(staticUrl(bankPath(m))).then(async (res) => {
      http = res.status;
      if (!res.ok) throw new Error(`english bank ${key}: ${res.status}`);
      const clip = (await res.json()) as Bank;
      if (clip.id !== m.id || !Array.isArray(clip.questions)) throw new Error(`english bank ${key}: not its clip`);
      loaded.set(key, clip);
      return clip;
    });
    p.catch(() => {
      banks.delete(key);
      const on = navigator.onLine;
      log('english.fail', { what: 'bank', clip: m.id, ...(http !== undefined && { http }), ...(http !== undefined && http < 300 && { bad: true }), on }, on ? 2 : 1);
    });
    banks.set(key, p);
  }
  return p;
}

/** Fetch these banks ahead (home, while idle), quietly. */
export function prefetch(ms: readonly (ClipMeta | undefined)[]): void {
  for (const m of ms) if (m) loadBank(m).catch(() => {});
}
