// The layout's distance fields computed off the main thread (fields.worker.ts, fieldsPrime.ts): the worker's rasters,
// structured-cloned as a worker's message is, are the main thread's own, bit for bit, on the default island and the
// user's; an adopted set is what fieldsOf hands out, to any layout with the same tiles and bridges (the island's layout
// object is replaced as its store attaches), so the main thread never builds them again.
import { describe, expect, it, vi } from 'vitest';
import RECORD from './record-2026-11-03.json' with { type: 'json' };
import { layoutOpOf, type LayoutEntry } from '#lib/contract/layout.ts';
import { Ch, adoptFields, computeFields, fieldsOf, hasFields, type RawFields } from './fields.ts';
import { codeOf, idx } from './grid.ts';
import { Layout, defaultLayout, layoutOf } from './model.ts';
import { fieldsSoon, primeFields } from './fieldsPrime.ts';

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
  it('a late answer is dropped: it never pushes out the set the island has now', () => {
    const now = altered(record(), 6), stale = altered(record(), 7);
    const f = fieldsOf(now);
    adoptFields(stale, computeFields(stale));
    expect(hasFields(stale)).toBe(false);
    expect(fieldsOf(new Layout(now.codes.slice(), new Map(now.objects), now.homes))).toBe(f);
  });
  it('the mount waits for the prime in flight, at most its cap; nothing to wait for without one', async () => {
    const m = altered(defaultLayout(), 8);
    expect(fieldsSoon(m, 300)).toBeNull();
    // a worker that never answers: the cap, then the main thread
    class Mute { onmessage = null; onerror = null; onmessageerror = null; postMessage() {} terminate() {} }
    vi.stubGlobal('Worker', Mute);
    try {
      void primeFields(m, 60_000);
      const t = Date.now();
      await fieldsSoon(m, 50);
      expect(Date.now() - t).toBeGreaterThanOrEqual(45);
      expect(Date.now() - t).toBeLessThan(1000);
      expect(hasFields(m)).toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it('resolves at once with no worker (the main thread then builds them)', async () => {
    const m = altered(defaultLayout(), 5);
    await primeFields(m);
    expect(hasFields(m)).toBe(false);
  });
});
