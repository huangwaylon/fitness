// The installed app asks once that its storage be kept (docs/backend.md "Service worker" › Offline): WebKit may
// otherwise evict a site's caches and IndexedDB after weeks unused, and with them the guides, the tiles and the
// record's offline copy. Asked after the first sync that worked (the app is in use, its data worth keeping), only in
// the Home Screen app (a Safari tab's answer is no); the answer logged, no PII.
import { DEVICE, localKV, readJson, writeJson, type KV } from './storage.ts';
import { log } from './log.ts';
import { tokyoDay } from '#lib/contract/live-protocol.ts';
import { quiet } from '#lib/quiet.ts';

const standalone = (): boolean =>
  (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) || (globalThis.navigator as { standalone?: boolean } | undefined)?.standalone === true;
const mb = (n: number | undefined) => Math.round((n ?? 0) / 1048576);

export async function persistOnce(kv: KV | null = localKV(), storage: StorageManager | undefined = globalThis.navigator?.storage, installed = standalone()): Promise<void> {
  if (!installed || !storage?.persist || readJson(kv, DEVICE.persistAsked)) return;
  writeJson(kv, DEVICE.persistAsked, 1);
  const was = await storage.persisted().catch(() => false);
  const ok = was || (await storage.persist().catch(() => false));
  const est = await storage.estimate?.().catch(() => undefined);
  log('storage.persist', { ok, was, useMb: mb(est?.usage), quotaMb: mb(est?.quota) });
}

/** How long after the sync that asks for it storage.use waits: past the launch (its cache reads off the launch's own). */
const STORAGE_WAIT_MS = 15_000;
/** A day's storage.use under way (the syncs that come meanwhile ask again: one only). */
let measuring = false;

/** The site's storage in use, once a Tokyo day (after a sync that worked, Safari tab or installed app, `wait` ms on):
 *  its growth over days, whether it's kept from eviction, and what each of the service worker's caches holds
 *  (cacheSizes.ts: MB a cache, the recogniser there or not) (the log's storage.use, MB only). The day is marked done
 *  only once it's logged: the app hidden or closed meanwhile (the launch's first sync, mid-launch), the next sync tries
 *  again (marked first, storage.use stopped on 11-12). */
export async function storageDaily(kv: KV | null = localKV(), storage: StorageManager | undefined = globalThis.navigator?.storage, now = Date.now(), sizes: () => Promise<Record<string, number | boolean>> = () => import('./cacheSizes.ts').then((m) => m.cacheSizes()), wait = STORAGE_WAIT_MS): Promise<void> {
  const day = tokyoDay(now);
  if (measuring || !storage?.estimate || readJson(kv, DEVICE.storageDay) === day) return;
  measuring = true;
  try {
    if (wait > 0) await new Promise((ok) => setTimeout(ok, wait));
    // (hidden meanwhile: the timer ran late or the page is going; the next sync's)
    if (typeof document !== 'undefined' && document.hidden) return;
    const est = await quiet(storage.estimate(), 'storage.estimate');
    if (!est) return;
    const persisted = await storage.persisted?.().catch(() => false) ?? false;
    const by = await quiet(sizes(), 'storage.caches', {});
    log('storage.use', { useMb: mb(est.usage), quotaMb: mb(est.quota), persisted, ...by });
    writeJson(kv, DEVICE.storageDay, day);
  } finally {
    measuring = false;
  }
}
