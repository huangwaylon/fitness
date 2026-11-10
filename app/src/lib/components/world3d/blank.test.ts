import { describe, expect, it } from 'vitest';
import { Color, DoubleSide, MeshBasicMaterial, MeshLambertMaterial, MeshStandardMaterial, Texture } from 'three';
import { nhLambert, WHITE, withMaps } from './blank.ts';

describe('the stand-in white map (one program for textured and plain)', () => {
  it('fills a missing map and emissive map, keeps those a material has', () => {
    const own = new Texture();
    const plain = withMaps(new MeshLambertMaterial({ color: 0x336699 }));
    expect(plain.map).toBe(WHITE);
    expect(plain.emissiveMap).toBe(WHITE);
    const textured = withMaps(new MeshLambertMaterial({ map: own }));
    expect(textured.map).toBe(own);
    expect(textured.emissiveMap).toBe(WHITE);
    expect(withMaps(new MeshBasicMaterial()).map).toBe(WHITE);
  });

  it('is one opaque white pixel (a colour times it is the colour)', () => {
    expect([WHITE.image.width, WHITE.image.height]).toEqual([1, 1]);
    expect([...(WHITE.image.data as Uint8Array)]).toEqual([255, 255, 255, 255]);
  });
});

// NH's soft look on a model's material (nhLambert): what each surface asks of it.
const src = (o: ConstructorParameters<typeof MeshStandardMaterial>[0] = {}) => new MeshStandardMaterial({ name: 'm', color: 0x336699, alphaTest: 0.5, side: DoubleSide, transparent: true, opacity: 0.4, ...o });
const hex = (c: Color) => c.getHex();

describe('nhLambert', () => {
  it('lifted by its own map (white), else by its colour where asked; opaque unless see-through is kept', () => {
    const map = new Texture(), a = nhLambert(src({ map }), { lift: 0.32 });
    expect([a.name, a.map, a.emissiveMap, hex(a.emissive), a.emissiveIntensity, a.alphaTest, a.side, a.transparent, a.opacity]).toEqual(['m', map, map, 0xffffff, 0.32, 0.5, DoubleSide, false, 1]);
    const b = nhLambert(src(), { lift: 0.5, byColour: true });
    expect([b.map, hex(b.emissive), b.emissiveIntensity]).toEqual([null, 0x336699, 0.5]);
    const c = nhLambert(src(), { lift: 0.5, see: true });
    expect([hex(c.emissive), c.transparent, c.opacity]).toEqual([0xffffff, true, 0.4]);
  });
  it("a lamp's own emissive map glows instead; no lift, no self-light", () => {
    const glow = new Texture(), l = nhLambert(src({ emissiveMap: glow }), { lift: 0.32, lamp: { color: 0xffe2a8, at: 0 } });
    expect([l.emissiveMap, hex(l.emissive), l.emissiveIntensity]).toEqual([glow, 0xffe2a8, 0]);
    const n = nhLambert(src(), { lift: 0, lamp: { color: 0xffe2a8, at: 0.6 } });
    expect([n.emissiveMap, hex(n.emissive), n.emissiveIntensity]).toEqual([null, 0, 0]);
  });
});
