import { existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import catalog from '../island/catalog.json';
import ja from '#lib/i18n/tent.ja.json';
import en from '#lib/i18n/tent.en.json';
import { DEFAULT_FLOOR, DEFAULT_WALL, FLOORS, ITEMS, STARTER, WALLS, codeOfFind, iconUrl } from './items.ts';

const STATIC = join(import.meta.dirname, '..', '..', '..', '..', 'static');
const JA = ja as Record<string, string>, EN = en as Record<string, string>;

describe('the tent’s catalogue (scripts/room-models.ts)', () => {
  it('a starter set of about thirty pieces and a few rugs for a campsite tent', () => {
    const rugs = STARTER.filter((c) => ITEMS[c].rug);
    expect(STARTER.length - rugs.length).toBeGreaterThanOrEqual(28);
    expect(rugs.length).toBeGreaterThanOrEqual(4);
  });

  it('every item has its model within the byte budget, a footprint in whole tiles and its names', () => {
    let total = 0;
    for (const [code, m] of Object.entries(ITEMS)) {
      expect(code).toMatch(/^f\d+$/);
      const f = join(STATIC, 'room', 'models', `${code}.glb`);
      expect(existsSync(f), f).toBe(true);
      const bytes = statSync(f).size;
      total += bytes;
      expect(bytes, code).toBeLessThanOrEqual(120_000);
      expect(Number.isInteger(m.w) && m.w >= 1 && m.w <= 8 && Number.isInteger(m.d) && m.d >= 1 && m.d <= 8, code).toBe(true);
      expect(m.v).toMatch(/^[0-9a-f]{8}$/);
      expect(JA[`tent.item.${code}`], code).toBeTruthy();
      expect(EN[`tent.item.${code}`], code).toBeTruthy();
      const icon = m.icon || !m.cat ? join(STATIC, 'room', 'icons', `${code}.webp`) : join(STATIC, 'art', 'finds', 'items', `${m.cat}.webp`);
      expect(existsSync(icon), icon).toBe(true);
    }
    // the whole set stays a few megabytes
    expect(total).toBeLessThan(12_000_000);
  });

  it('every wallpaper and floor has its texture, its icon and its names; the tent’s own come first', () => {
    expect(WALLS[0]).toBe(DEFAULT_WALL);
    expect(FLOORS[0]).toBe(DEFAULT_FLOOR);
    for (const [list, dir, k] of [[WALLS, 'wall', 'wall'], [FLOORS, 'floor', 'floor']] as const) {
      expect(list.length).toBeGreaterThanOrEqual(30);
      for (const c of list) {
        expect(existsSync(join(STATIC, 'room', dir, `${c}.webp`)), c).toBe(true);
        expect(existsSync(join(STATIC, 'room', 'icons', `${c}.webp`)), c).toBe(true);
        expect(JA[`tent.${k}.${c}`], c).toBeTruthy();
      }
    }
  });

  it('every surface (NH’s, the spreadsheet’s flag) has its top from its model: under its bounds, inside its footprint', () => {
    const surfaces = Object.entries(ITEMS).filter(([, m]) => m.s);
    expect(surfaces.length).toBeGreaterThanOrEqual(60);
    for (const [code, m] of surfaces) {
      expect(m.sy, code).toBeGreaterThan(0);
      expect(m.sy!, code).toBeLessThanOrEqual(m.h + 0.1);
      expect(m.sl!.length, code).toBeGreaterThan(0);
      for (const [sx, sz] of m.sl!) expect(sx >= 0 && sx < m.w && sz >= 0 && sz < m.d, code).toBe(true);
      const [x0, z0, x1, z1] = m.st!;
      expect(x0 < x1 && z0 < z1 && x0 >= -m.w * 5 - 0.1 && x1 <= m.w * 5 + 0.1 && z0 >= -m.d * 5 - 0.1 && z1 <= m.d * 5 + 0.1, code).toBe(true);
      expect(m.rug || m.wl, code).toBeFalsy();
    }
    // nothing else has one; a wall thing is never a surface nor goes on one (NH's Wall-mounted sheet has no surface)
    for (const [code, m] of Object.entries(ITEMS)) if (!m.s) expect(m.sy ?? m.sl, code).toBeUndefined();
    for (const [code, m] of Object.entries(ITEMS)) if (m.wl) expect(m.sm, code).toBeUndefined();
  });

  it('a ずかん find with an NH model maps to its piece; the rest of the カタログ has none', () => {
    const furniture = catalog.items.map((r) => r.split(' ')).filter(([, c]) => c === 'housewares' || c === 'misc').map(([id]) => id);
    const mapped = furniture.filter((id) => codeOfFind(id));
    expect(mapped.length).toBeGreaterThan(300);
    for (const id of mapped) expect(ITEMS[codeOfFind(id)!].cat).toBe(id);
    expect(codeOfFind('no-such-thing')).toBeNull();
    // its icon is the ずかん's (already on the phone), NH's own where the ずかん has none
    expect(iconUrl(codeOfFind(mapped[0])!)).toMatch(/art\/finds\/items\//);
    expect(iconUrl(WALLS[0])).toMatch(/room\/icons\/w\d+\.webp$/);
  });
});
