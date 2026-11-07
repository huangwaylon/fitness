// Saving a map area ahead (offline phase B, docs/backend.md "Service worker" › Offline): the page fetches a plan's tiles
// (plan.ts) itself, as the maps do (WebKit's service worker never sees MapLibre's worker's fetches: one code path), into
// the area's own cache, `island-offline-<id>`, with its manifest. The worker serves those first (index.ts serveTile).
// Polite: OpenFreeMap 4 at a time, USGS and GSI 2 with a pause after each tile. Resumable: a tile already in the cache is
// skipped. Whole or said so: the tiles that failed are asked again up to 3 times, then the manifest says `done: false`
// (「一部のみ」, a retry). Pure but for the injected fetch and caches (save.test.ts runs it on fakes).
import { OPENFREEMAP, SAVED_MANIFEST, SAVED_PREFIX, SAVE_HEADER, tileKey } from '../../service-worker/caches.ts';
import type { Plan, Source } from './plan.ts';

/** An area's record, in its cache (SAVED_MANIFEST) and mirrored in localStorage (registry.ts: an area Safari evicted
 *  is still listed, 「消えました」). */
export interface Manifest {
  id: string;
  source: Source;
  /** OpenFreeMap's weekly build the tiles are (`20261101_080013_pt`); null for USGS and GSI (unversioned). */
  tileVersion: string | null;
  /** The plan's tiles. */
  tiles: number;
  /** Those stored, and those the host had none of (a 404 or an empty 204: done, nothing to keep). */
  stored: number;
  empty: string[];
  /** Bytes stored. */
  bytes: number;
  done: boolean;
  /** When it was (last) saved, ms. */
  at: number;
}

export const cacheOf = (id: string): string => `${SAVED_PREFIX}${id}`;

const TILE_URL: Record<Source, string> = {
  ofm: '', // the TileJSON's (its week's build)
  usgs: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}',
  gsi: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png'
};
export const TILEJSON_URL = `https://${OPENFREEMAP}/planet`;
/** At once, per host (OpenFreeMap's ask: ≤ 4; the agencies' servers 2, a pause after each). */
const PARALLEL: Record<Source, number> = { ofm: 4, usgs: 2, gsi: 2 };
const PAUSE_MS: Record<Source, number> = { ofm: 0, usgs: 150, gsi: 150 };
/** Passes over the tiles that failed, after the first, with a wait before each. */
const RETRY_WAITS = [1000, 3000, 8000];

const fill = (tpl: string, k: string) => {
  const [z, x, y] = k.split('/');
  return tpl.replace('{z}', z).replace('{x}', x).replace('{y}', y);
};
/** The week's build in OpenFreeMap's tile URL template. */
const buildOf = (tpl: string): string | null => /\/planet\/([\w.-]+)\/\{z\}/.exec(tpl)?.[1] ?? null;

type Store = Pick<CacheStorage, 'open' | 'delete' | 'has'>;
export interface SaveDeps {
  fetch: typeof fetch;
  caches: Store;
  /** The worker controls the page: the save header is answered there (else the page's fetch goes as it is). */
  controlled: boolean;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}
export interface Progress {
  done: number;
  total: number;
  bytes: number;
}

export async function readManifest(store: Store, id: string): Promise<Manifest | null> {
  if (!(await store.has(cacheOf(id)))) return null;
  const res = await (await store.open(cacheOf(id))).match(SAVED_MANIFEST);
  return res ? ((await res.json()) as Manifest) : null;
}
const writeManifest = (cache: Cache, m: Manifest) => cache.put(SAVED_MANIFEST, new Response(JSON.stringify(m), { headers: { 'content-type': 'application/json' } }));

/** The TileJSON's tile template and its build (through the worker, which keeps a copy: tileJsonFetch). */
async function tileJson(d: SaveDeps): Promise<{ tpl: string; build: string; res: Response }> {
  const res = await d.fetch(TILEJSON_URL, { credentials: 'omit' });
  if (!res.ok) throw new Error(`tilejson ${res.status}`);
  const copy = res.clone();
  const tpl = ((await res.json()) as { tiles?: string[] }).tiles?.[0] ?? '';
  const build = buildOf(tpl);
  if (!build) throw new Error('tilejson: no build');
  return { tpl, build, res: copy };
}

/**
 * Save `plan` (or go on with it: the tiles stored are skipped). An OpenFreeMap area saved at another week's build is
 * started again whole (an area never mixes builds: 更新 is this). Resolves with the manifest (done or not); rejects
 * only if the TileJSON can't be had or the signal aborts.
 */
export async function saveArea(plan: Plan, d: SaveDeps, onProgress: (p: Progress) => void = () => {}, signal?: AbortSignal): Promise<Manifest> {
  const sleep = d.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const now = d.now ?? Date.now;
  let tpl = TILE_URL[plan.source], build: string | null = null;
  let meta: Response | null = null;
  if (plan.source === 'ofm') ({ tpl, build, res: meta } = await tileJson(d));
  const old = await readManifest(d.caches, plan.id);
  if (old && (old.source !== plan.source || old.tileVersion !== build)) await d.caches.delete(cacheOf(plan.id));
  const cache = await d.caches.open(cacheOf(plan.id));
  if (meta) await cache.put(TILEJSON_URL, meta);
  const prev = old && old.source === plan.source && old.tileVersion === build ? old : null;
  const m: Manifest = { id: plan.id, source: plan.source, tileVersion: build, tiles: plan.tiles.length, stored: 0, empty: prev?.empty ?? [], bytes: 0, done: false, at: now() };

  // what's in already (a resume): counted, skipped
  const keyOf = (k: string) => tileKey(new URL(fill(tpl, k)))!;
  const have = new Set((await cache.keys()).map((r) => r.url));
  for (const r of await cache.keys()) {
    if (r.url === SAVED_MANIFEST || r.url === TILEJSON_URL) continue;
    m.stored++;
    m.bytes += Number((await cache.match(r))?.headers.get('x-island-bytes') ?? 0);
  }
  const empty = new Set(m.empty);
  let todo = plan.tiles.filter((k) => !have.has(keyOf(k)) && !empty.has(k));
  const report = () => onProgress({ done: m.stored + empty.size, total: m.tiles, bytes: m.bytes });
  report();
  await writeManifest(cache, m);

  let sinceWrite = 0;
  /** One tile: true once it's stored (or the host has none), false to ask again. */
  async function one(k: string): Promise<boolean> {
    const url = fill(tpl, k);
    let res: Response;
    try {
      res = await d.fetch(url, { credentials: 'omit', signal, headers: d.controlled ? { [SAVE_HEADER]: '1' } : undefined });
    } catch (e) {
      if (signal?.aborted) throw e;
      return false;
    }
    if (res.status === 404 || res.status === 204) {
      empty.add(k);
      return true;
    }
    if (!res.ok || res.type === 'opaque') return false;
    const body = await res.blob();
    const headers = new Headers({ 'content-type': res.headers.get('content-type') ?? 'application/octet-stream', 'x-island-bytes': String(body.size) });
    await cache.put(keyOf(k), new Response(body, { status: 200, headers }));
    m.stored++;
    m.bytes += body.size;
    if (++sinceWrite >= 25) ((sinceWrite = 0), (m.empty = [...empty]), await writeManifest(cache, m));
    return true;
  }
  async function pass(keys: string[]): Promise<string[]> {
    const failed: string[] = [];
    let i = 0;
    await Promise.all(Array.from({ length: PARALLEL[plan.source] }, async () => {
      while (i < keys.length) {
        if (signal?.aborted) throw signal.reason ?? new Error('aborted');
        const k = keys[i++];
        if (!(await one(k))) failed.push(k);
        report();
        if (PAUSE_MS[plan.source]) await sleep(PAUSE_MS[plan.source]);
      }
    }));
    return failed;
  }
  try {
    todo = await pass(todo);
    for (const wait of RETRY_WAITS) {
      if (!todo.length) break;
      await sleep(wait);
      todo = await pass(todo);
    }
  } finally {
    m.empty = [...empty];
    m.done = todo.length === 0 && m.stored + empty.size >= m.tiles;
    if (!signal?.aborted) m.at = now();
    await writeManifest(cache, m).catch(() => {});
  }
  return m;
}

/** The area's cache gone (its tiles and manifest). */
export const deleteArea = (store: Store, id: string): Promise<boolean> => store.delete(cacheOf(id));
