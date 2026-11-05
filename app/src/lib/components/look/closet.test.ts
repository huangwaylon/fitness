import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOKS, isOnepiece, isPlayerLook, type PlayerLook } from '#lib/contract/look.ts';
import PARTS from '../player3d/parts.json' with { type: 'json' };
import SWATCHES from './swatches.json' with { type: 'json' };
import { swatchOf } from './swatch.ts';
import { closet, closetFrom, GARMENT_KINDS, hueOf, HUES, itemKey, wear, wornIn, type ClosetKind } from './closet.ts';

const KINDS: ClosetKind[] = ['eye', 'mouth', 'hair', 'top', 'onepiece', 'bottom', 'socks', 'shoes', 'hat', 'glasses', 'ornament'];
const ITEMS = PARTS.items as Record<string, { slot: string; line: string; onepiece?: boolean; icon: string | null }>;

describe('the closet adapter', () => {
  it('buckets colours as the filter row does', () => {
    expect(hueOf('#e23030')).toBe('red');
    expect(hueOf('#f2a9bf')).toBe('pink');
    expect(hueOf('#3f6b45')).toBe('green');
    expect(hueOf('#4c6c9a')).toBe('blue');
    expect(hueOf('#b9a6d6')).toBe('purple');
    expect(hueOf('#e8c020')).toBe('yellow');
    expect(hueOf('#7a5634')).toBe('brown');
    expect(hueOf('#f4f4f0')).toBe('white');
    expect(hueOf('#ece2c8')).toBe('white');
    expect(hueOf('#222222')).toBe('black');
  });

  it('groups variants into items by their colour line, the face parts and hair one tile each', () => {
    expect(itemKey('TopsTexTopOuterLAran3')).toBe('TopsTexTopOuterLAran');
    const c = closetFrom({
      top: [{ id: 'TopsTexTopOuterLAran3', swatch: '#004f28' }, { id: 'TopsTexTopOuterLAran1', swatch: '#d2cda0' }],
      eye: [{ id: 'PlayerEye00', swatch: '#000000' }, { id: 'PlayerEye01', swatch: '#000000' }]
    }, closet().colours);
    const aran = c.items('top')[0];
    expect(aran.variants.map((v) => v.id)).toEqual(['TopsTexTopOuterLAran3', 'TopsTexTopOuterLAran1']);
    expect(c.find('TopsTexTopOuterLAran1')?.item).toBe(aran);
    expect(c.find('TopsTexNope0')).toBeNull();
    expect(c.items('eye')).toHaveLength(2);
  });

  it('shows a line’s icon as it is on its nearest colour and tints it on the others', () => {
    const icon = { url: '/i.webp', colour: '#f5f2d3' };
    const c = closetFrom({
      top: [{ id: 'TopsTexA0', swatch: '#891f1f', icon }, { id: 'TopsTexA1', swatch: '#d2cda0', icon }, { id: 'TopsTexA2', swatch: '#004f28', icon }]
    }, closet().colours);
    const [red, cream, green] = c.items('top')[0].variants;
    expect(cream.tint).toBeNull();
    expect(red.tint).toBeGreaterThanOrEqual(1);
    expect(green.tint).toBe(red.tint);
    expect([red, cream, green].every((v) => v.icon === '/i.webp')).toBe(true);
  });

  it('wears by NH’s rules: a one-piece clears the bottoms, a bottom clears a one-piece', () => {
    const a = DEFAULT_LOOKS.A;
    const dress = wear(a, 'onepiece', 'TopsTexOnepieceAlineHLinen0');
    expect(dress.bottom).toBeNull();
    expect(isPlayerLook(dress)).toBe(true);
    expect(wornIn(dress, 'onepiece')).toBe('TopsTexOnepieceAlineHLinen0');
    expect(wornIn(dress, 'top')).toBeNull();
    const back = wear(dress, 'bottom', 'BottomsTexSkirtLongDenim3');
    expect(back.top).toBeNull();
    expect(isPlayerLook(back)).toBe(true);
    expect(wear(a, 'glasses', null).glasses).toBeNull();
    expect(wear(a, 'top', null)).toBe(a); // a top isn't taken off by the grid
    // a hat and a hair ornament are both headwear: one at a time
    const b = { ...a, ornament: 'CapOrnamentLRibbon7' };
    const hatted = wear(b, 'hat', 'CapHatBeret0');
    expect([hatted.hat, hatted.ornament]).toEqual(['CapHatBeret0', null]);
    expect([wear(hatted, 'ornament', 'CapOrnamentLRibbon7').hat, wear(hatted, 'hat', null).hat]).toEqual([null, null]);
  });
});

describe('the part table’s closet (components/player3d/parts.json)', () => {
  const c = closet();

  it('holds every part of both default looks', () => {
    for (const look of Object.values(DEFAULT_LOOKS))
      for (const k of ['hair', 'eye', 'mouth', 'top', 'bottom', 'socks', 'shoes', 'glasses', 'ornament'] as const)
        if (look[k]) expect(c.find(look[k]), `${k} ${look[k]}`).not.toBeNull();
  });

  it('has something in every grid, every hairstyle, eye and mouth, and every garment once', () => {
    for (const k of KINDS) expect(c.items(k).length, k).toBeGreaterThan(0);
    expect(c.items('hair')).toHaveLength(Object.keys(PARTS.hair).length);
    expect(c.items('eye').length + c.items('mouth').length).toBe(Object.keys(PARTS.face).length);
    const listed = KINDS.filter((k) => GARMENT_KINDS.has(k)).flatMap((k) => c.items(k).flatMap((i) => i.variants.map((v) => v.id)));
    expect(new Set(listed).size).toBe(listed.length);
    expect(new Set(listed)).toEqual(new Set(Object.keys(ITEMS)));
  });

  it('measured every garment’s colour and every icon’s (the pipeline’s sw and icons: npm run players3d)', () => {
    const icons = (PARTS as { icons: Record<string, string> }).icons;
    for (const [id, it] of Object.entries(ITEMS) as [string, { sw?: string; icon: string | null }][]) {
      expect(it.sw, id).toMatch(/^#[0-9a-f]{6}$/);
      if (it.icon) expect(icons[it.icon], it.icon).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('the stand-in figure’s swatches (swatches.json, swatch.ts) are the closet’s own, for every garment', () => {
    for (const id of Object.keys(ITEMS)) expect(swatchOf(id, '#000001'), id).toBe(c.find(id)!.variant.swatch);
    expect(Object.keys(SWATCHES.sw).sort()).toEqual(Object.keys(ITEMS).sort());
    expect(swatchOf('TopsTexNotAThing0', '#000001')).toBe('#000001');
    expect(swatchOf(null, '#000002')).toBe('#000002');
  });

  it('groups a line’s colours in one tile with its icon, and keeps one-pieces apart from tops', () => {
    for (const k of KINDS.filter((x) => GARMENT_KINDS.has(x)))
      for (const item of c.items(k)) {
        for (const v of item.variants) {
          expect(ITEMS[v.id].line, v.id).toBe(item.key);
          expect(v.icon, v.id).toMatch(new RegExp(`/art/finds/items/${ITEMS[v.id].icon}\\.webp$`));
          expect(HUES).toContain(v.hue);
        }
        expect(item.variants.filter((v) => v.tint === null), item.key).toHaveLength(1);
      }
    expect(c.items('onepiece').every((i) => i.variants.every((v) => isOnepiece(v.id)))).toBe(true);
    expect(c.items('top').some((i) => i.variants.some((v) => isOnepiece(v.id)))).toBe(false);
  });

  it('spreads the closet over the colour filter (no garment grid all one bucket)', () => {
    const hues = new Set(KINDS.filter((k) => GARMENT_KINDS.has(k)).flatMap((k) => c.items(k).flatMap((i) => i.variants.map((v) => v.hue))));
    expect(hues.size).toBe(HUES.length);
    for (const k of ['top', 'bottom', 'shoes'] as const) expect(new Set(c.items(k).flatMap((i) => i.variants.map((v) => v.hue))).size, k).toBeGreaterThan(4);
  });

  it('dresses and undresses by the rule with the table’s own parts', () => {
    const dressId = c.items('onepiece')[0].variants[0].id;
    for (const look of Object.values(DEFAULT_LOOKS) as PlayerLook[]) {
      const dress = wear(look, 'onepiece', dressId);
      expect(dress.bottom).toBeNull();
      expect(isPlayerLook(dress)).toBe(true);
      const pants = wear(dress, 'bottom', c.items('bottom')[0].variants[0].id);
      expect(pants.top).toBeNull();
      expect(isPlayerLook(pants)).toBe(true);
      const top = wear(pants, 'top', c.items('top')[0].variants[0].id);
      expect(top.bottom).toBe(pants.bottom);
    }
  });
});
