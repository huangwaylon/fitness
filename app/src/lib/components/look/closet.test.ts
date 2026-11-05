import { describe, expect, it } from 'vitest';
import { DEFAULT_LOOKS, isPlayerLook } from '#lib/contract/look.ts';
import { closetFrom, hueOf, itemKey, stubCloset, wear, wornIn } from './closet.ts';

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

  it('groups variants into items by their id without the colour digits', () => {
    expect(itemKey('TopsTexTopOuterLAran3')).toBe('TopsTexTopOuterLAran');
    const aran = stubCloset.items('top').find((i) => i.key === 'TopsTexTopOuterLAran')!;
    expect(aran.variants.map((v) => v.id)).toEqual(['TopsTexTopOuterLAran3', 'TopsTexTopOuterLAran1']);
    expect(stubCloset.find('TopsTexTopOuterLAran1')?.item).toBe(aran);
    expect(stubCloset.find('TopsTexNope0')).toBeNull();
    // face parts and hair are one tile each (their digits are the shape, not a colour)
    expect(stubCloset.items('hair')).toHaveLength(37);
    const c = closetFrom({ eye: [['PlayerEye00', '#000000'], ['PlayerEye01', '#000000']] }, stubCloset.colours);
    expect(c.items('eye')).toHaveLength(2);
  });

  it('holds every part of both default looks', () => {
    for (const look of Object.values(DEFAULT_LOOKS))
      for (const id of [look.hair, look.eye, look.mouth, look.top, look.bottom, look.socks, look.shoes, look.glasses, look.ornament])
        if (id) expect(stubCloset.find(id), id).not.toBeNull();
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
  });
});
