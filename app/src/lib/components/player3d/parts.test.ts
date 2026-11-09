import { describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { playerFiles } from '../../../../scripts/player-packs.ts';
import { entries } from '../world3d/ktx2Pack.ts';
import { looseTextures } from '../world3d/texHash.ts';
import homes from '#lib/layout/homes.json' with { type: 'json' };
import structures from '#lib/layout/structures.json' with { type: 'json' };
import { EVERYDAY, homeMax, ktx2Of, lookPaths, tableFiles } from './packing.ts';
import PARTS from './parts.json' with { type: 'json' };
import PART_IDS from '#lib/contract/partIds.json' with { type: 'json' };
import { DEFAULT_LOOKS, PART_SLOTS, isOnepiece } from '#lib/contract/look.ts';
import { PARTS as BUNDLED, covers, loadParts, type PartTable } from './parts.ts';

/** Every id partIds.json holds (its lines unpacked). */
const IDS = [...PART_IDS.exact, ...Object.entries(PART_IDS.lines as Record<string, string>).flatMap(([l, ds]) => [...ds].map((d) => l + d))];
const DIR = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'player');
/** Every packed file (path under room/player/ → bytes). */
const FILES = playerFiles(DIR);
const existsSync = (f: string) => FILES.has(f.slice(DIR.length + 1));
type Tex = { file?: string; v?: string; kb?: number; color?: string; cut?: boolean; glass?: number; tint?: string };
const T = PARTS as unknown as {
  body: { v: string; kb: number; tris: number }; cheek: { v: string; kb: number }[];
  face: Record<string, { v: string; kb: number }>;
  mesh: Record<string, { v: string; kb: number; tris: number; rigid: boolean; mats: string[] }>;
  hair: Record<string, { mesh: string; cap: string | null }>;
  items: Record<string, { slot: string; mesh?: string; onepiece?: boolean; tex: Record<string, Tex>; line: string; icon: string | null }>;
};

describe('the player parts (scripts/players3d-models.ts)', () => {
  it('keeps the whole table beside the parts, its hash in the bundle', () => {
    const full = JSON.parse(readFileSync(join(DIR, 'parts.json'), 'utf8')) as typeof T;
    expect(createHash('sha256').update(readFileSync(join(DIR, 'parts.json'))).digest('hex').slice(0, 8)).toBe((PARTS as unknown as { full: { v: string } }).full.v);
    expect(Object.keys(full.items).length).toBe((PARTS as unknown as { full: { items: number } }).full.items);
    for (const id of Object.keys(T.items)) expect(full.items[id], id).toBeTruthy();
    expect(new Set(IDS)).toEqual(new Set([...Object.keys(full.hair), ...Object.keys(full.face), ...Object.keys(full.items)]));
    for (const [id, it] of Object.entries(full.items)) {
      if (it.slot !== 'socks') expect(full.mesh[it.mesh!], `${id}'s mesh`).toBeTruthy();
      for (const t of Object.values(it.tex)) if (t.file) expect(existsSync(join(DIR, 'tex', t.file)), t.file).toBe(true);
    }
  });
  it('has every part of both いつもの looks', () => {
    for (const look of Object.values(DEFAULT_LOOKS)) {
      for (const k of ['hair', 'eye', 'mouth', 'top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament'] as const) {
        const id = look[k];
        if (id) expect(IDS, `${k} ${id}`).toContain(id);
      }
    }
  });
  it("names every file it lists, and each id's slot is its prefix's", () => {
    expect(existsSync(join(DIR, 'body.glb'))).toBe(true);
    T.cheek.forEach((_, i) => expect(existsSync(join(DIR, 'face', `cheek${i}.webp`))).toBe(true));
    for (const id of Object.keys(T.face)) expect(existsSync(join(DIR, 'face', `${id}.webp`)), id).toBe(true);
    for (const id of Object.keys(T.mesh)) expect(existsSync(join(DIR, 'mesh', `${id}.glb`)), id).toBe(true);
    for (const [id, h] of Object.entries(T.hair)) {
      expect(T.mesh[h.mesh], id).toBeTruthy();
      if (h.cap) expect(T.mesh[h.cap], h.cap).toBeTruthy();
    }
    for (const [id, it] of Object.entries(T.items)) {
      expect(id.startsWith(PART_SLOTS[it.slot as keyof typeof PART_SLOTS]), id).toBe(true);
      if (it.slot !== 'socks') expect(T.mesh[it.mesh!], `${id}'s mesh`).toBeTruthy();
      expect(!!it.onepiece, id).toBe(isOnepiece(id));
      for (const t of Object.values(it.tex)) if (t.file) expect(existsSync(join(DIR, 'tex', t.file)), t.file).toBe(true);
    }
    // (the bundle's table is the first closet's: every id it lists is known; the whole table's are all known too)
    for (const id of [...Object.keys(T.hair), ...Object.keys(T.face), ...Object.keys(T.items)]) expect(IDS, id).toContain(id);
  });
  it('keeps a look within the budget (customization.md §5: the body once, ~60 KB an outfit)', () => {
    const kb = (f: string) => FILES.get(f)!.length / 1024;
    expect(kb('body.glb')).toBeLessThan(70);
    for (const look of Object.values(DEFAULT_LOOKS)) {
      let total = T.face[look.eye].kb + T.face[look.mouth].kb + T.mesh[T.hair[look.hair].mesh].kb;
      for (const k of ['top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament'] as const) {
        const it = look[k] ? T.items[look[k]!] : null;
        if (!it) continue;
        if (it.mesh) total += T.mesh[it.mesh].kb;
        for (const t of Object.values(it.tex)) total += t.kb ?? 0;
      }
      expect(total).toBeLessThan(110);
    }
    for (const [id, m] of Object.entries(T.mesh)) expect(m.kb, id).toBeLessThan(40);
  });
  it('draws the いつもの looks from the bundled table, the whole one only for a part it lacks (covers)', () => {
    const full = JSON.parse(readFileSync(join(DIR, 'parts.json'), 'utf8')) as PartTable;
    const B = PARTS as unknown as PartTable;
    // (the bundled entries are the whole table's own: one may stand for the other)
    for (const k of ['items', 'mesh', 'hair', 'face'] as const) for (const [id, e] of Object.entries(B[k])) expect(e, id).toEqual(full[k][id]);
    for (const look of Object.values(DEFAULT_LOOKS)) expect(covers(look, B)).toBe(true);
    const missing = Object.keys(full.items).find((id) => !B.items[id] && full.items[id].slot === 'top')!;
    expect(covers({ ...DEFAULT_LOOKS.A, top: missing }, B)).toBe(false);
    expect(covers({ ...DEFAULT_LOOKS.A, top: missing }, full)).toBe(true);
    expect(covers({ ...DEFAULT_LOOKS.A, hair: 'PlayerHairNone' }, full)).toBe(false);
  });
});

describe('loadParts (the whole table)', () => {
  it('a reply that isn\'t ok is the bundled table for now, and asked for again the next time (as a network error)', async () => {
    const whole = { ...PARTS, items: {} } as unknown as PartTable;
    const replies = [new Response('', { status: 503 }), new Response(JSON.stringify(whole), { status: 200 })];
    const fetch = vi.fn(async () => replies.shift()!);
    vi.stubGlobal('fetch', fetch);
    try {
      expect(await loadParts('/room/player/')).toBe(BUNDLED);
      const got = await loadParts('/room/player/');
      expect(got).not.toBe(BUNDLED);
      expect(got.items).toEqual({});
      expect(await loadParts('/room/player/')).toBe(got);
      expect(fetch).toHaveBeenCalledTimes(2);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('the packs (scripts/player-packs.ts: npm run player:packs when this fails)', () => {
  const full = JSON.parse(readFileSync(join(DIR, 'parts.json'), 'utf8')) as PartTable;
  const packs = readdirSync(DIR).filter((f) => f.endsWith('.pak'));
  const bytesAt = (t: PartTable, at: [number, number, number]) => readFileSync(join(DIR, `${t.packs![at[0]]}.pak`)).subarray(at[1], at[1] + at[2]);
  const sha8 = (b: Uint8Array) => createHash('sha256').update(b).digest('hex').slice(0, 8);

  it('are a few dozen files, each named by its hash, each listed, none past its bound but by one file', () => {
    expect(readdirSync(DIR, { recursive: true }).length).toBeLessThanOrEqual(60);
    expect(new Set(packs)).toEqual(new Set(full.packs!.map((s) => `${s}.pak`)));
    expect(BUNDLED.packs).toEqual(full.packs);
    for (const f of packs) {
      const b = readFileSync(join(DIR, f));
      expect(f, f).toBe(`${f.replace(/\.[0-9a-f]{8}\.pak$/, '')}.${sha8(b)}.pak`);
      const es = [...entries(b)!.values()];
      if (es.length > 1) expect(es.reduce((n, [, l]) => n + l, 0) - Math.max(...es.map(([, l]) => l)), f).toBeLessThan(homeMax(f.replace(/(-\d+)?\.[0-9a-f]{8}\.pak$/, '')));
    }
  });

  it('place every file each table names: its bytes there are the file (its hash, v), a texture the bundled table lists with its KTX2 (k)', () => {
    const ktx2 = new Set(looseTextures(homes, structures, PARTS as never).filter((l) => l.path.startsWith('player/')).map((l) => l.out.slice(7)));
    for (const t of [full, BUNDLED]) {
      for (const { path, spec, tex } of tableFiles(t)) {
        expect(spec.at, path).toBeTruthy();
        const b = bytesAt(t, spec.at!);
        expect(sha8(b), path).toBe((spec as { v: string }).v);
        expect(b.equals(Buffer.from(FILES.get(path)!)), path).toBe(true);
        if (tex) expect(!!spec.k, path).toBe(ktx2.has(ktx2Of(path)));
        if (spec.k) expect(bytesAt(t, spec.k).equals(Buffer.from(FILES.get(ktx2Of(path))!)), path).toBe(true);
      }
    }
  });

  it('hold both いつもの looks, as drawn (a KTX2 where there is one), in the everyday pack, ~330 KB', () => {
    const every = BUNDLED.packs![BUNDLED.everyday!];
    expect(every).toMatch(new RegExp(`^${EVERYDAY}\\.`));
    const inside = new Set(entries(readFileSync(join(DIR, `${every}.pak`)))!.keys());
    for (const look of Object.values(DEFAULT_LOOKS))
      for (const p of lookPaths(look, BUNDLED)) expect(inside.has(FILES.has(ktx2Of(p)) && p.endsWith('.webp') ? ktx2Of(p) : p), p).toBe(true);
    expect(statSync(join(DIR, `${every}.pak`)).size).toBeLessThan(400_000);
  });
});
