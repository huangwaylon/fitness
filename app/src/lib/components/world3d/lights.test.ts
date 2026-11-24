import { describe, expect, test } from 'vitest';
import { PointLight, Scene } from 'three';
import { createLights, type LampSpot } from './lights.ts';

// The real point lights go to the lamps nearest the view's centre (lights.ts frame's ranking), ranked again only
// when the centre moves: a still night frame keeps them, a scroll hands them on.
const lamp = (k: number, x: number, z: number): LampSpot => ({ id: `l${k}`, x, z, y: 20, gy: 0, kind: 'lamp', colour: 0xffcc88, glow: 30, pool: 20 });
/** The lit point lights' x (the lamps here differ by x: bendPoint keeps it). */
const litXs = (scene: Scene) =>
  scene.children.filter((c): c is PointLight => c instanceof PointLight && c.intensity > 0).map((l) => Math.round(l.position.x)).sort((a, b) => a - b);
function night(spots: LampSpot[]) {
  const scene = new Scene(), l = createLights(scene);
  l.set(spots);
  l.level(1);
  let t = 0;
  const run = (cx: number, cz: number, ms = 3000) => {
    for (const end = t + ms; t < end; t += 33) l.frame(t, cx, cz, 4000, 0);
  };
  return { scene, l, run };
}

describe('the night lights', () => {
  // two rows of 5: x 0..40 at z 0, x 1000..1040 at z 600
  const spots = [...[0, 10, 20, 30, 40].map((x, k) => lamp(k, x, 0)), ...[1000, 1010, 1020, 1030, 1040].map((x, k) => lamp(k + 5, x, 600))];
  test('the 4 nearest the centre within 700 u get a light, and keep it while the view is still', () => {
    const n = night(spots);
    n.run(5, 0);
    expect(litXs(n.scene)).toEqual([0, 10, 20, 30]);
    n.run(5.5, 0.5);
    expect(litXs(n.scene)).toEqual([0, 10, 20, 30]);
  });
  test('a scroll hands them on: the far row lit, the near one faded out', () => {
    const n = night(spots);
    n.run(0, 0);
    n.run(1045, 600);
    expect(litXs(n.scene)).toEqual([1010, 1020, 1030, 1040]);
  });
  test('nothing within 700 u: none lit; new lamps rank again', () => {
    const n = night(spots.slice(0, 2));
    n.run(5000, 5000);
    expect(litXs(n.scene)).toEqual([]);
    n.l.set([lamp(9, 4990, 5000)]);
    n.run(5000, 5000);
    expect(litXs(n.scene)).toEqual([4990]);
  });
  test('by day none', () => {
    const n = night(spots);
    n.run(5, 0);
    n.l.level(0);
    n.run(5, 0);
    expect(litXs(n.scene)).toEqual([]);
  });
});
