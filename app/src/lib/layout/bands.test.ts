// The ground's bands (bands.ts): the top's normals the same numbers as three's computeVertexNormals (the bands are
// built in the fields' worker, without three, and drawn as three built them before), and the rasters' bytes taken
// from the worker only when they fit the fields.
import { describe, expect, it } from 'vitest';
import { BufferGeometry, Float32BufferAttribute, Uint32BufferAttribute } from 'three';
import { adoptSdf, buildBand, sdfBytes, vertexNormals } from './bands.ts';
import { fieldsOf } from './fields.ts';
import { CHUNKS_Z } from './grid.ts';
import { defaultLayout } from './model.ts';

describe('the ground\'s bands', () => {
  it('the top\'s normals are three\'s computeVertexNormals\', bit for bit', () => {
    const l = defaultLayout();
    let n = 0;
    for (let row = 0; row < CHUNKS_Z; row++) {
      const b = buildBand(l, row);
      if (!b) continue;
      const g = new BufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute(b.top.pos, 3));
      g.setIndex(new Uint32BufferAttribute(b.top.index, 1));
      g.computeVertexNormals();
      const three = g.getAttribute('normal').array as Float32Array;
      expect(Buffer.from(b.top.normal.buffer).equals(Buffer.from(three.buffer)), `band ${row}`).toBe(true);
      n++;
    }
    expect(n).toBeGreaterThan(4);
  });
  it('a degenerate face adds nothing, a lone vertex stays (0, 0, 0)', () => {
    const pos = new Float32Array([0, 0, 0, 1, 0, 0, 0, 0, -1, 2, 2, 2]);
    const nrm = vertexNormals(pos, new Uint32Array([0, 1, 2, 0, 0, 1]));
    expect([...nrm.slice(0, 3)]).toEqual([0, 1, 0]);
    expect([...nrm.slice(9)]).toEqual([0, 0, 0]);
  });
  it('the rasters\' bytes from elsewhere taken only when they fit the fields', () => {
    const f = fieldsOf(defaultLayout()), own = sdfBytes(f);
    expect(sdfBytes(f)).toBe(own);
    const wrong = { a: new Uint8Array(4), b: new Uint8Array(4) };
    adoptSdf(f, wrong);
    expect(sdfBytes(f)).toBe(own);
    const copy = structuredClone(own);
    adoptSdf(f, copy);
    expect(sdfBytes(f)).toBe(copy);
  });
});
