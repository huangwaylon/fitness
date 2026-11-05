import { describe, expect, it } from 'vitest';
import { Bone, BoxGeometry, BufferAttribute, Group, MeshBasicMaterial, Ray, Raycaster, Skeleton, SkinnedMesh, Vector3 } from 'three';
import { hitsSkinned } from './hit.ts';

/** An arm: a 1 × 4 × 1 box, its lower half on the shoulder joint, its upper half on the elbow (2 up), under `root`. */
function arm() {
  const root = new Group(), shoulder = new Bone(), elbow = new Bone();
  elbow.position.y = 2;
  shoulder.add(elbow);
  root.add(shoulder);
  const g = new BoxGeometry(1, 4, 1, 1, 4, 1).translate(0, 2, 0);
  const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    si[i * 4] = g.attributes.position.getY(i) > 2 ? 1 : 0;
    sw[i * 4] = 1;
  }
  g.setAttribute('skinIndex', new BufferAttribute(si, 4));
  g.setAttribute('skinWeight', new BufferAttribute(sw, 4));
  const m = new SkinnedMesh(g, new MeshBasicMaterial());
  root.add(m);
  root.updateMatrixWorld(true);
  m.bind(new Skeleton([shoulder, elbow]));
  return { root, elbow, m };
}

describe('a tap on a skinned outline (hit.ts)', () => {
  it('meets the arm where three’s skinned raycast does, bent, and misses beside it', () => {
    const { root, elbow, m } = arm();
    // the forearm bent to the side (+x), the whole moved
    elbow.rotation.z = -Math.PI / 2;
    root.position.set(10, 0, 0);
    root.updateMatrixWorld(true);
    const rc = new Raycaster();
    const tries: [Vector3, boolean][] = [
      [new Vector3(10, 1, 5), true], // the upper arm
      [new Vector3(11.5, 2, 5), true], // the forearm, out to the side
      [new Vector3(10, 3.5, 5), false], // where the forearm was, straight
      [new Vector3(14, 2, 5), false] // past its hand
    ];
    for (const [o, want] of tries) {
      const ray = new Ray(o, new Vector3(0, 0, -1));
      rc.ray.copy(ray);
      expect(rc.intersectObject(m).length > 0, `three at ${o.toArray()}`).toBe(want);
      expect(hitsSkinned(root, ray), `boxes at ${o.toArray()}`).toBe(want);
    }
  });
  it('sees nothing hidden', () => {
    const { root, m } = arm();
    m.visible = false;
    expect(hitsSkinned(root, new Ray(new Vector3(0, 1, 5), new Vector3(0, 0, -1)))).toBe(false);
  });
});
