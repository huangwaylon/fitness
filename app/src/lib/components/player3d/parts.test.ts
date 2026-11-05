import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import PARTS from './parts.json' with { type: 'json' };
import PART_IDS from '#lib/contract/partIds.json' with { type: 'json' };
import { DEFAULT_LOOKS, PART_SLOTS, isOnepiece } from '#lib/contract/look.ts';

/** Every id partIds.json holds (its lines unpacked). */
const IDS = [...PART_IDS.exact, ...Object.entries(PART_IDS.lines as Record<string, string>).flatMap(([l, ds]) => [...ds].map((d) => l + d))];
const DIR = join(import.meta.dirname, '..', '..', '..', '..', 'static', 'room', 'player');
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
    const kb = (f: string) => statSync(join(DIR, f)).size / 1024;
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
});
