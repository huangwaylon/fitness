// The installed app asks once that its storage be kept (docs/backend.md "Service worker" › Offline): WebKit may
// otherwise evict a site's caches and IndexedDB after weeks unused, and with them the guides, the tiles and the
// record's offline copy. Asked after the first sync that worked (the app is in use, its data worth keeping), only in
// the Home Screen app (a Safari tab's answer is no); the answer logged, no PII.
import { DEVICE, localKV, readJson, writeJson, type KV } from './storage.ts';
import { log } from './log.ts';
import { tokyoDay } from '#lib/contract/live-protocol.ts';

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

/** The site's storage in use, once a Tokyo day (after a sync that worked, Safari tab or installed app): its growth over
 *  days, and whether it's kept from eviction (the log's storage.use, MB only). */
export async function storageDaily(kv: KV | null = localKV(), storage: StorageManager | undefined = globalThis.navigator?.storage, now = Date.now()): Promise<void> {
  const day = tokyoDay(now);
  if (!storage?.estimate || readJson(kv, DEVICE.storageDay) === day) return;
  writeJson(kv, DEVICE.storageDay, day);
  const est = await storage.estimate().catch(() => undefined);
  if (!est) return;
  const persisted = await storage.persisted?.().catch(() => false) ?? false;
  log('storage.use', { useMb: mb(est.usage), quotaMb: mb(est.quota), persisted });
}
