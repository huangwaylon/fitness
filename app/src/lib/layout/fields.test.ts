// The layout's distance fields computed off the main thread (fields.worker.ts, fieldsPrime.ts): the worker's rasters,
// structured-cloned as a worker's message is, are the main thread's own, bit for bit, on the default island and the
// user's; an adopted set is what fieldsOf hands out, to any layout with the same tiles and bridges (the island's layout
// object is replaced as its store attaches), so the main thread never builds them again.
import { describe, expect, it, vi } from 'vitest';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, type LayoutEntry } from '#lib/contract/layout.ts';
import { Ch, FAR, adoptFields, computeFields, fieldsOf, hasFields, rasterRows, type RawFields } from './fields.ts';
import { CHUNKS_X, GRID, SEA, codeOf, idx } from './grid.ts';
import { resizedCodes, withTiles } from './resize.ts';
import { Layout, defaultLayout, layoutOf } from './model.ts';
import { primeFields } from './fieldsPrime.ts';
import { configureFieldsCache, fieldsKey, fieldsWriter, readFields } from './fieldsCache.ts';
import { IDBFactory } from 'fake-indexeddb';
import { CHUNK_COUNT, adoptChunks, chunkMesh, noChunk, openSeaRow } from './mesh.ts';

const record = () =>
  layoutOf((RECORD as Record<string, unknown>[]).map((r) => {
    const { who, ...d } = r;
    const op = layoutOpOf(d);
    return op ? ({ ...op, who } as LayoutEntry) : null;
  }).filter((e): e is LayoutEntry => !!e));
/** The layout with one more tile turned (a new set of fields), `n` telling them apart. */
const altered = (l: Layout, n: number) => {
  const codes = l.codes.slice();
  codes[idx(1 + n, 1)] = codeOf('grass', 0);
  return new Layout(codes, new Map(l.objects), l.homes);
};
const same = (a: Float32Array, b: Float32Array) => Buffer.from(a.buffer, a.byteOffset, a.byteLength).equals(Buffer.from(b.buffer, b.byteOffset, b.byteLength));
/** What the worker answers for `l` (its fields and chunks). */
const primedOf = (l: Layout) => {
  const raw = computeFields(l);
  const wl = new Layout(l.codes, l.objects, l.homes);
  adoptFields(wl, raw);
  return { raw, chunks: Array.from({ length: CHUNK_COUNT }, (_, i) => chunkMesh(wl, i)) };
};
/** A launch's modules (nothing built or primed yet: a set is adopted only while none is held). */
const fresh = async () => {
  vi.resetModules();
  return { fp: await import('./fieldsPrime.ts'), ff: await import('./fields.ts') };
};

describe('the fields as deep as the island (fields.ts rasterRows: the grid has 156 rows since 2026-11-10)', () => {
  /** The longest island: its back grown to the grid's edge less the sea (152 rows of land). */
  const longest = () => withTiles(defaultLayout(), resizedCodes(defaultLayout(), 'back', 95)!);
  it('the raster reaches the land\'s back and 4 rows of sea, to a whole chunk: the default 64 rows, the longest 156', () => {
    expect(rasterRows(defaultLayout().codes)).toBe(64);
    expect(rasterRows(longest().codes)).toBe(GRID.rows);
    expect(rasterRows(new Uint8Array(GRID.cols * GRID.rows).fill(SEA))).toBe(8);
  });
  it('the same numbers as the whole grid\'s raster where both reach, bit for bit (behind it, every channel at its clamp)', async () => {
    const l = record(), part = computeFields(l), whole = computeFields(l, GRID.rows);
    const n = part.ch[0].length;
    expect(n).toBeLessThan(whole.ch[0].length);
    part.ch.forEach((c, i) => expect(same(c, whole.ch[i].subarray(0, n)), `channel ${i}`).toBe(true));
    if (part.sf && whole.sf) for (const k of ['d', 'fx', 'fz', 's', 'across'] as const) expect(same(part.sf[k], whole.sf[k].subarray(0, n)), k).toBe(true);
    // (the whole grid's rows behind the land: each channel's clamp, what at() reads off the raster)
    const tail = (k: number) => whole.ch[k].subarray(whole.ch[k].length - 240 * 12);
    expect(tail(Ch.land).every((d) => d === FAR)).toBe(true);
    expect(tail(Ch.sandy).every((d) => d === -FAR)).toBe(true);
    // (a launch's modules: this module's own set stays unbuilt for the adoption tests below)
    const f = (await fresh()).ff.fieldsOf(l);
    for (const z of [2000, 3000, 4500]) for (const x of [0, 200, 400]) {
      expect(f.at(Ch.land, x, z)).toBe(FAR);
      expect(f.at(Ch.sandy, x, z)).toBe(-FAR);
      expect(f.at(Ch.tier1, x, z)).toBe(FAR);
    }
  });
  it('the longest island\'s build: the whole grid deep, its far back land and coast as the front\'s', { timeout: 30_000 }, async () => {
    const l = longest(), raw = computeFields(l);
    expect(raw.ch[0].length).toBe(240 * GRID.rows * 12);
    for (const c of raw.ch) expect(c.every(Number.isFinite)).toBe(true);
    const f = (await fresh()).ff.fieldsOf(l);
    // the land to its new back row (153: z 4500…4530), the sea past it
    expect(f.at(Ch.land, 200, 4400)).toBe(-FAR);
    expect(f.at(Ch.land, 200, 4530)).toBeGreaterThan(-20);
    expect(f.at(Ch.land, 200, 4580)).toBeGreaterThan(20);
    // the worker builds no chunk of the open sea's rows: the default's 12 behind it, none of the longest's
    const rows = (x: Layout) => Array.from({ length: CHUNK_COUNT / CHUNKS_X }, (_, r) => r).filter((r) => openSeaRow(x.codes, r)).length;
    expect(rows(defaultLayout())).toBe(12);
    expect(rows(l)).toBe(0);
    expect(noChunk(CHUNK_COUNT - 1).box.z1).toBe(GRID.z0 + GRID.rows * 30);
  });
});

describe('the fields off the main thread (fieldsPrime.ts)', () => {
  for (const [name, mk] of [['the default island', defaultLayout], ['the user’s island', record]] as const) {
    it(`gives the main thread's numbers bit for bit: ${name}`, () => {
      const l = mk();
      const main = computeFields(l);
      // (as the worker gets the layout and sends its rasters back: structured clones)
      const off: RawFields = structuredClone(computeFields(structuredClone({ codes: l.codes, objects: l.objects })));
      expect(off.ch).toHaveLength(main.ch.length);
      off.ch.forEach((c, i) => expect(same(c, main.ch[i]), `channel ${i}`).toBe(true));
      expect(!!off.sf).toBe(!!main.sf);
      if (off.sf && main.sf) for (const k of ['d', 'fx', 'fz', 's', 'across'] as const) expect(same(off.sf[k], main.sf[k]), k).toBe(true);
    });
  }
  it('an adopted set is what fieldsOf gives, to a layout alike too; never over one built here', () => {
    const l = altered(record(), 3);
    expect(hasFields(l)).toBe(false);
    adoptFields(l, structuredClone(computeFields(l)));
    expect(hasFields(l)).toBe(true);
    const f = fieldsOf(l);
    // (the store's next layout object, the same tiles)
    expect(fieldsOf(new Layout(l.codes.slice(), new Map(l.objects), l.homes))).toBe(f);
    adoptFields(l, computeFields(l));
    expect(fieldsOf(l)).toBe(f);
    const main = fieldsOf(altered(record(), 4));
    for (let x = -100; x < 520; x += 37.3) for (let z = -100; z < 1720; z += 41.7) expect(typeof main.at(Ch.fresh, x, z)).toBe('number');
  });
  it('the ground\'s chunks from the worker\'s inputs are the main thread\'s, bit for bit; each handed out once', () => {
    const l = altered(record(), 9);
    // (as the worker builds them: a clone of the codes, pieces and homes, its own fields)
    const w = structuredClone({ codes: l.codes, objects: l.objects, homes: l.homes });
    const wl = new Layout(w.codes, w.objects, w.homes);
    const off = Array.from({ length: CHUNK_COUNT }, (_, i) => structuredClone(chunkMesh(wl, i)));
    const main = Array.from({ length: CHUNK_COUNT }, (_, i) => chunkMesh(l, i));
    for (let i = 0; i < CHUNK_COUNT; i++)
      for (const p of ['top', 'walls', 'falls', 'water'] as const)
        for (const [k, a] of Object.entries(main[i][p])) expect(same(a as Float32Array, (off[i][p] as unknown as Record<string, Float32Array>)[k]), `chunk ${i} ${p}.${k}`).toBe(true);
    // adopted: the next layout alike takes them, once; another layout's are its own
    const next = new Layout(l.codes.slice(), new Map(l.objects), l.homes);
    adoptChunks(next, off);
    expect(chunkMesh(next, 3)).toBe(off[3]);
    expect(chunkMesh(next, 3)).not.toBe(off[3]);
    const other = altered(record(), 10);
    expect(chunkMesh(other, 4)).not.toBe(off[4]);
    expect(chunkMesh(next, 4)).not.toBe(off[4]);
  });
  it('a late answer is dropped: it never pushes out the set the island has now', () => {
    const now = altered(record(), 6), stale = altered(record(), 7);
    const f = fieldsOf(now);
    adoptFields(stale, computeFields(stale));
    expect(hasFields(stale)).toBe(false);
    expect(fieldsOf(new Layout(now.codes.slice(), new Map(now.objects), now.homes))).toBe(f);
  });
  it('one job a layout: a second caller (the mount after the launch, or before it) shares the first\'s worker', async () => {
    const m = altered(defaultLayout(), 8);
    const made: Answering[] = [];
    class Answering {
      onmessage: ((e: { data: unknown }) => void) | null = null;
      onerror = null;
      onmessageerror = null;
      constructor() {
        made.push(this);
      }
      postMessage(d: Pick<Layout, 'codes' | 'objects' | 'homes'>) {
        setTimeout(() => this.onmessage?.({ data: primedOf(new Layout(d.codes, d.objects, d.homes)) }), 20);
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', Answering);
    try {
      const { fp, ff } = await fresh();
      const a = fp.primeFields(m, 'test'), b = fp.primeFields(new Layout(m.codes.slice(), new Map(m.objects), m.homes), 'test');
      expect(b).toBe(a);
      await b;
      expect(made).toHaveLength(1);
      expect(ff.hasFields(m)).toBe(true);
      expect(fp.fieldsFrom(m)).toBe('worker');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('a worker that fails: the main thread builds them, once (no worker tried again)', async () => {
    const m = altered(defaultLayout(), 14);
    let made = 0;
    class Failing {
      onmessage = null;
      onerror: (() => void) | null = null;
      onmessageerror = null;
      constructor() {
        made++;
      }
      postMessage() {
        setTimeout(() => this.onerror?.(), 10);
      }
      terminate() {}
    }
    vi.stubGlobal('Worker', Failing);
    try {
      const { fp, ff } = await fresh();
      await fp.primeFields(m, 'test');
      expect(ff.hasFields(m)).toBe(false);
      await fp.primeFields(m, 'test');
      expect(made).toBe(1);
      ff.fieldsOf(m);
      expect(fp.fieldsFrom(m)).toBe('main');
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('a worker that never answers: given up at the timeout, then the main thread', async () => {
    const m = altered(defaultLayout(), 15);
    class Mute { onmessage = null; onerror = null; onmessageerror = null; postMessage() {} terminate() {} }
    vi.stubGlobal('Worker', Mute);
    // (the timers faked: given up at its 50 ms, not the wall clock's say on a loaded runner)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    try {
      let out = false;
      void primeFields(m, 'test', 50).then(() => (out = true));
      await vi.advanceTimersByTimeAsync(49);
      expect(out).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(out).toBe(true);
      expect(hasFields(m)).toBe(false);
    } finally {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    }
  });
  it('resolves at once with no worker (the main thread then builds them)', async () => {
    const m = altered(defaultLayout(), 5);
    await primeFields(m, 'test');
    expect(hasFields(m)).toBe(false);
  });
});

describe('the fields kept for the next launch (fieldsCache.ts)', () => {
  it('keyed by the layout and the build: another tile, piece or build is another key', () => {
    const l = altered(defaultLayout(), 11);
    const k = fieldsKey(l, 'b1');
    expect(fieldsKey(new Layout(l.codes.slice(), new Map(l.objects), l.homes), 'b1')).toBe(k);
    expect(fieldsKey(l, 'b2')).not.toBe(k);
    expect(fieldsKey(altered(defaultLayout(), 12), 'b1')).not.toBe(k);
    const moved = new Map(l.objects);
    const [id, o] = [...moved][0];
    moved.set(id, { ...o, x: o.x + 1 });
    expect(fieldsKey(new Layout(l.codes, moved, l.homes), 'b1')).not.toBe(k);
  });
  it('written once, read back for its key only; a launch with it adopts them with no worker', async () => {
    const idb = new IDBFactory();
    configureFieldsCache({ indexedDB: idb });
    try {
      const l = altered(record(), 13);
      const key = fieldsKey(l, 'b1');
      expect(await readFields(key)).toBeNull();
      const write = await fieldsWriter();
      await write!(key, primedOf(l));
      const back = await readFields(key);
      expect(back?.chunks).toHaveLength(CHUNK_COUNT);
      expect(same(back!.raw.ch[0], computeFields(l).ch[0])).toBe(true);
      expect(await readFields(fieldsKey(l, 'b2'))).toBeNull();
      // the launch (fresh modules: nothing built yet): from the cache, no worker made
      vi.resetModules();
      const fc = await import('./fieldsCache.ts'), fp = await import('./fieldsPrime.ts'), ff = await import('./fields.ts');
      fc.configureFieldsCache({ indexedDB: idb });
      vi.stubGlobal('Worker', class { constructor() { throw new Error('no worker on a hit'); } });
      const next = new Layout(l.codes.slice(), new Map(l.objects), l.homes);
      expect(ff.hasFields(next)).toBe(false);
      await fp.primeFields(next, 'b1');
      expect(ff.hasFields(next)).toBe(true);
      expect(fp.fieldsFrom(next)).toBe('cache');
    } finally {
      vi.unstubAllGlobals();
      configureFieldsCache({ indexedDB: null });
    }
  });
  it('anything odd read back is a miss', async () => {
    configureFieldsCache({ indexedDB: new IDBFactory() });
    try {
      const write = await fieldsWriter();
      await write!('k', { raw: { ch: [], sf: null }, chunks: [] } as unknown as Parameters<NonNullable<typeof write>>[1]);
      expect(await readFields('k')).toBeNull();
    } finally {
      configureFieldsCache({ indexedDB: null });
    }
  });
});
