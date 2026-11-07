import { describe, expect, it } from 'vitest';
import { SAVED_MANIFEST, SAVE_HEADER } from '../../service-worker/caches.ts';
import type { Plan } from './plan.ts';
import { cacheOf, deleteArea, readManifest, saveArea, TILEJSON_URL, type SaveDeps } from './save.ts';

/** CacheStorage on Maps (what save.ts uses of it). */
function memCaches() {
  const all = new Map<string, Map<string, Response>>();
  const cache = (m: Map<string, Response>) => ({
    match: async (k: RequestInfo | URL) => m.get(String(k instanceof Request ? k.url : k))?.clone(),
    put: async (k: RequestInfo | URL, r: Response) => void m.set(String(k instanceof Request ? k.url : k), r.clone()),
    keys: async () => [...m.keys()].map((u) => new Request(u)),
    delete: async (k: RequestInfo | URL) => m.delete(String(k))
  }) as unknown as Cache;
  return {
    all,
    store: {
      open: async (n: string) => cache(all.get(n) ?? (all.set(n, new Map()), all.get(n)!)),
      has: async (n: string) => all.has(n),
      delete: async (n: string) => all.delete(n)
    } as unknown as SaveDeps['caches']
  };
}

const TPL = (build: string) => `https://tiles.openfreemap.org/planet/${build}/{z}/{x}/{y}.pbf`;
const plan = (source: Plan['source'], n: number): Plan => ({ id: `t-${source}`, source, tiles: Array.from({ length: n }, (_, i) => `14/${i}/7`), byZoom: { 14: n }, bytes: n * 100 });

/** A host: the TileJSON at `build`, each tile 100 bytes, `fail(url, nth)` refusing some. */
function host(o: { build?: string; fail?: (url: string, nth: number) => boolean; status?: (url: string) => number } = {}) {
  const asked: { url: string; headers: Record<string, string> }[] = [];
  const nth = new Map<string, number>();
  let live = 0, peak = 0;
  const f = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    asked.push({ url, headers: (init?.headers ?? {}) as Record<string, string> });
    if (url === TILEJSON_URL) return Response.json({ tiles: [TPL(o.build ?? '20261101_080013_pt')] });
    const k = (nth.get(url) ?? 0) + 1;
    nth.set(url, k);
    live++;
    peak = Math.max(peak, live);
    await new Promise((r) => setTimeout(r, 1));
    live--;
    if (o.fail?.(url, k)) throw new TypeError('network');
    const status = o.status?.(url) ?? 200;
    return new Response(status === 200 ? new Uint8Array(100) : null, { status });
  }) as typeof fetch;
  return { f, asked, peak: () => peak, tiles: () => asked.filter((a) => a.url !== TILEJSON_URL) };
}
const deps = (h: ReturnType<typeof host>, store: SaveDeps['caches'], controlled = true): SaveDeps => ({ fetch: h.f, caches: store, controlled, sleep: async () => {}, now: () => 1_000 });

describe('saving an area', () => {
  it("OpenFreeMap's: 4 at a time, under the versionless keys, the TileJSON kept, the manifest whole", async () => {
    const { all, store } = memCaches();
    const h = host();
    const seen: number[] = [];
    const m = await saveArea(plan('ofm', 30), deps(h, store), (p) => seen.push(p.done));
    expect(m).toMatchObject({ id: 't-ofm', source: 'ofm', tileVersion: '20261101_080013_pt', tiles: 30, stored: 30, bytes: 3000, done: true, at: 1000 });
    expect(h.peak()).toBe(4);
    const keys = [...all.get(cacheOf('t-ofm'))!.keys()];
    expect(keys).toContain('https://tiles.openfreemap.org/planet/_/14/0/7.pbf');
    expect(keys).toContain(TILEJSON_URL);
    expect(keys).toContain(SAVED_MANIFEST);
    expect(h.tiles()[0].url).toBe('https://tiles.openfreemap.org/planet/20261101_080013_pt/14/0/7.pbf');
    expect(h.tiles()[0].headers[SAVE_HEADER]).toBe('1');
    expect(seen.at(-1)).toBe(30);
    expect(await readManifest(store, 't-ofm')).toEqual(m);
  });

  it('USGS and GSI: 2 at a time with a pause after each; no worker, no save header', async () => {
    const { store } = memCaches();
    const h = host();
    const pauses: number[] = [];
    const m = await saveArea(plan('usgs', 6), { ...deps(h, store, false), sleep: async (ms) => void pauses.push(ms) });
    expect(m.done).toBe(true);
    expect(h.peak()).toBe(2);
    expect(pauses).toEqual([150, 150, 150, 150, 150, 150]);
    expect(h.tiles()[0].url).toBe('https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/14/7/0');
    expect(h.tiles()[0].headers).toEqual({});
  });

  it('resumes: the tiles stored are skipped and counted', async () => {
    const { store } = memCaches();
    const ctl = new AbortController();
    const h1 = host();
    let n = 0;
    await expect(saveArea(plan('gsi', 10), deps(h1, store), () => ++n === 5 && ctl.abort(), ctl.signal)).rejects.toThrow();
    const part = await readManifest(store, 't-gsi');
    expect(part?.done).toBe(false);
    expect(part!.stored).toBeGreaterThan(0);
    const h2 = host();
    const m = await saveArea(plan('gsi', 10), deps(h2, store));
    expect(m).toMatchObject({ stored: 10, bytes: 1000, done: true });
    expect(h2.tiles().length).toBe(10 - part!.stored);
  });

  it('a tile that fails is asked again (3 more passes), then 一部のみ; a 404 is none there, done', async () => {
    const { store } = memCaches();
    const h = host({ fail: (u, k) => u.endsWith('/14/3/7.pbf') && k < 3, status: (u) => (u.endsWith('/14/4/7.pbf') ? 404 : 200) });
    const m = await saveArea(plan('ofm', 6), deps(h, store));
    expect(m).toMatchObject({ stored: 5, empty: ['14/4/7'], done: true });
    const bad = host({ fail: (u) => u.endsWith('/14/2/7.pbf') });
    const { store: s2 } = memCaches();
    const m2 = await saveArea(plan('ofm', 6), deps(bad, s2));
    expect(m2).toMatchObject({ stored: 5, done: false });
    expect(bad.tiles().filter((a) => a.url.endsWith('/14/2/7.pbf')).length).toBe(4);
  });

  it("another week's build starts the area again whole (never two builds in one area)", async () => {
    const { all, store } = memCaches();
    await saveArea(plan('ofm', 4), deps(host({ build: 'old_pt' }), store));
    const h = host({ build: 'new_pt' });
    const m = await saveArea(plan('ofm', 4), deps(h, store));
    expect(m).toMatchObject({ tileVersion: 'new_pt', stored: 4, bytes: 400, done: true });
    expect(h.tiles().length).toBe(4);
    expect(all.get(cacheOf('t-ofm'))!.size).toBe(4 + 2);
  });

  it('deleted: its cache gone', async () => {
    const { all, store } = memCaches();
    await saveArea(plan('usgs', 2), deps(host(), store));
    await deleteArea(store, 't-usgs');
    expect(all.has(cacheOf('t-usgs'))).toBe(false);
    expect(await readManifest(store, 't-usgs')).toBeNull();
  });
});
