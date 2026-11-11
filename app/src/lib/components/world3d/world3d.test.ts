import { describe, expect, it } from 'vitest';
import { bendPoint, maskedLights, unbendRay } from './bend.ts';

describe('the rolling log', () => {
  it('leaves the pivot where it is and drops the ground away from it', () => {
    expect(bendPoint(10, 0, -500, -500, 900)).toEqual([10, 0, -500]);
    const far = bendPoint(0, 0, -900, -500, 900);
    expect(far[1]).toBeLessThan(-80);
  });

  it('finds the ground under a ray through the bent world (the taps)', () => {
    const R = 900, pivot = -500, o = [195, 1400, 700];
    for (const z of [-300, -500, -800]) {
      const [bx, by, bz] = bendPoint(150, 3, z, pivot, R);
      const d = [bx - o[0], by - o[1], bz - o[2]], l = Math.hypot(...d);
      const hit = unbendRay(o, d.map((n) => n / l), 3, pivot, R)!;
      expect(hit[0]).toBeCloseTo(150, 3);
      expect(hit[1]).toBeCloseTo(z, 3);
    }
  });
});

describe('the point lights mask (bend.ts maskedLights)', () => {
  it('puts the point-light loop under uPointN and each light under its uPointOn, still unrolled; three as is with point-light shadows', () => {
    const src = 'void main() {\n#include <lights_fragment_begin>\n}';
    const out = maskedLights(src);
    expect(out).toContain('uniform float uPointOn[ NUM_POINT_LIGHTS ];');
    expect(out).toContain('if ( uPointN > 0 ) {');
    expect(out).toMatch(/if \( uPointOn\[ i \] > 0\.5 \) \{\s*pointLight = pointLights\[ i \];/);
    // (three unrolls it: the body to the first `}` before the pragma's end, the light's `if` closed inside it)
    expect(out).toMatch(/RE_Direct\([^;]*\);\s*\}\s*\}\s*#pragma unroll_loop_end/);
    expect(out).toContain('#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0');
    expect(out.split('{').length).toBe(out.split('}').length);
    expect(maskedLights('void main() { gl_FragColor = vec4(1.0); }')).toBe('void main() { gl_FragColor = vec4(1.0); }');
  });
});
