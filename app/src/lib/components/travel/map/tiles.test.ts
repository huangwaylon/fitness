import { describe, expect, it } from 'vitest';
import { loadViaPage, VIA, viaPage } from './tiles.ts';

describe("the basemap's tiles through the page (tiles.ts)", () => {
  const T = 'https://tiles.openfreemap.org/planet/20261101_080013_pt/9/504/312.pbf';
  it("OpenFreeMap's tiles under our protocol; the TileJSON and other hosts as they are", () => {
    const tr = viaPage('https://tiles.openfreemap.org');
    expect(tr(T, 'Tile' as never)).toEqual({ url: `${VIA}://tiles.openfreemap.org/planet/20261101_080013_pt/9/504/312.pbf` });
    expect(tr('https://tiles.openfreemap.org/planet', 'Source' as never)).toBeUndefined();
    expect(tr('https://example.com/1/2/3.pbf', 'Tile' as never)).toBeUndefined();
  });
  it('fetched by the page at its https URL; an empty tile an empty buffer, a refused one an error with its status', async () => {
    const asked: string[] = [];
    const get = (async (u: string) => (asked.push(u), u.endsWith('/404.pbf') ? new Response('', { status: 404 }) : new Response(u.endsWith('/e.pbf') ? null : 'pbf'))) as typeof fetch;
    const load = loadViaPage(get);
    const ctl = new AbortController();
    const via = (u: string) => ({ url: (viaPage('https://tiles.openfreemap.org')(u, 'Tile' as never) as { url: string }).url, type: 'arrayBuffer' as const });
    expect(new TextDecoder().decode((await load(via(T), ctl)).data as ArrayBuffer)).toBe('pbf');
    expect(((await load(via('https://tiles.openfreemap.org/p/w/1/0/e.pbf'), ctl)).data as ArrayBuffer).byteLength).toBe(0);
    await expect(load(via('https://tiles.openfreemap.org/p/w/1/0/404.pbf'), ctl)).rejects.toMatchObject({ status: 404 });
    expect(asked[0]).toBe(T);
  });
});
