import { describe, expect, it } from 'vitest';
import { MeshBasicMaterial, MeshLambertMaterial, Texture } from 'three';
import { WHITE, withMaps } from './blank.ts';

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
