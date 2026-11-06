// ききみみ's audio packs (packing.ts, scripts/kikimimi-packs.ts): the plan's stability (a changed clip changes its own
// part only, a new one the last), the bounds, and the committed packs round-tripped: every clip in clips.json sliced
// from its pack is the clip whose hash clips.json names (a slice is the file's own bytes: the 9a spike decoded each to
// the standalone file's samples in WebKit and the iOS Simulator), every pack's hash its file's.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Clip } from './clips.ts';
import clipsJson from './clips.json';
import { readPacks } from './compile.ts';
import { PACK_MAX, SLOW_PACK_MAX, clipPlaces, packFile, partName, planHome } from './packing.ts';

const CLIPS: Readonly<Record<string, Clip>> = clipsJson;
const LISTEN = join(import.meta.dirname, '../../../static/audio/listen');
const sha8 = (b: Buffer) => createHash('sha256').update(b).digest('hex').slice(0, 8);

describe('kikimimi packs: the plan', () => {
  const clips = (n: number, bytes = 300) => Array.from({ length: n }, (_, i) => ({ id: `c${i}`, bytes }));

  it('fills parts in order up to the bound, the first part named as its home', () => {
    const plan = planHome('lv4', clips(10), 1000);
    expect([...plan.keys()]).toEqual(['lv4', 'lv4-2', 'lv4-3', 'lv4-4']);
    expect(plan.get('lv4')).toEqual(['c0', 'c1', 'c2']);
    expect(plan.get('lv4-4')).toEqual(['c9']);
    expect(partName('u-gl-clarify', 2)).toBe('u-gl-clarify-2');
  });

  it('keeps the last plan’s parts: a new clip goes into the last part, a grown one moves out of its part alone', () => {
    const prev = Object.fromEntries(planHome('lv4', clips(7), 1000));
    // a new clip (c7) between the old ones in the bank's order: only the last part changes
    const more = [...clips(3), { id: 'c7', bytes: 300 }, ...clips(7).slice(3)];
    const plan = planHome('lv4', more, 1000, prev);
    expect(plan.get('lv4')).toEqual(prev.lv4);
    expect(plan.get('lv4-2')).toEqual(prev['lv4-2']);
    expect(plan.get('lv4-3')).toEqual(['c6', 'c7']);
    // c1 re-spoken longer: it leaves its part (what fits stays), the parts after untouched, it goes last
    const grown = clips(7).map((c) => (c.id === 'c1' ? { ...c, bytes: 600 } : c));
    const g = planHome('lv4', grown, 1000, prev);
    expect(g.get('lv4')).toEqual(['c0', 'c1']);
    expect(g.get('lv4-2')).toEqual(prev['lv4-2']);
    expect(g.get('lv4-3')).toEqual(['c6', 'c2']);
  });

  it('a removed clip leaves its part; an emptied part drops out; a clip past the bound has a part of its own', () => {
    const prev = Object.fromEntries(planHome('x', clips(4, 500), 1000));
    const plan = planHome('x', clips(4, 500).filter((c) => c.id !== 'c2' && c.id !== 'c3'), 1000, prev);
    expect([...plan]).toEqual([['x', ['c0', 'c1']]]);
    expect([...planHome('y', [{ id: 'big', bytes: 2000 }, { id: 'a', bytes: 10 }], 1000)]).toEqual([['y', ['big']], ['y-2', ['a']]]);
  });
});

describe('kikimimi packs: as committed', () => {
  const packs = readPacks();
  const { normal, slow } = clipPlaces(packs);

  it('every clip and slow take is in exactly one pack, a slice whose bytes are the clip clips.json names', () => {
    const files = new Map<string, Buffer>();
    const read = (f: string) => files.get(f) ?? files.set(f, readFileSync(join(LISTEN, f))).get(f)!;
    let n = 0;
    for (const [id, c] of Object.entries(CLIPS)) {
      for (const [ref, hash] of [[normal.get(id), c.hash], [c.slow ? slow.get(id) : undefined, c.slow]] as const) {
        if (!hash) continue;
        expect(ref, id).toBeDefined();
        const [stem, offset, bytes] = ref!;
        const b = read(`${stem}.pak`).subarray(offset, offset + bytes);
        expect(sha8(b), `${id} in ${stem}`).toBe(hash);
        expect(b.subarray(4, 8).toString('latin1'), id).toBe('ftyp'); // a whole m4a
        n++;
      }
    }
    const listed = Object.values(packs).reduce((s, e) => s + e.clips.length, 0);
    expect(listed).toBe(n);
    expect(normal.size + slow.size).toBe(n);
  });

  it('each pack is its file (its hash, its clips end to end), within its bound unless one clip alone; nothing else ships', () => {
    for (const [name, e] of Object.entries(packs)) {
      const f = join(LISTEN, packFile(name, e));
      expect(existsSync(f), f).toBe(true);
      const b = readFileSync(f);
      expect(sha8(b), name).toBe(e.hash);
      let at = 0;
      for (const [id, offset, bytes] of e.clips) {
        expect(offset, `${name} ${id}`).toBe(at);
        at += bytes;
      }
      expect(at, name).toBe(b.length);
      if (e.clips.length > 1) expect(b.length, name).toBeLessThanOrEqual(e.slow ? SLOW_PACK_MAX : PACK_MAX);
    }
    expect(readdirSync(LISTEN).sort()).toEqual(Object.entries(packs).map(([name, e]) => packFile(name, e)).sort());
  });
});
