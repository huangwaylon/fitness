import { describe, expect, it } from 'vitest';
import { Bone, BufferAttribute, BufferGeometry, Group, Matrix4, MeshBasicMaterial, Skeleton, SkinnedMesh, Vector3 } from 'three';
import { sharedSkin } from './skin.ts';

/** A chain of joints (Root → Hips → Spine → Head), each 2 up from the last, under `root`. */
function chain(root: Group, names = ['Root', 'Hips', 'Spine', 'Head']) {
  const bs = names.map((n) => Object.assign(new Bone(), { name: n }));
  bs.forEach((b, i) => {
    if (i) b.position.y = 2;
    (i ? bs[i - 1] : root).add(b);
  });
  return bs;
}
/** A mesh skinned to `bones` the way gltfpack writes one: its positions quantised (×1000), the inverse binds taking the
 *  scale; its vertices each on joint `on[i]`. */
function part(bones: Bone[], at: number[][], on: number[]) {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(new Float32Array(at.flat().map((v) => v * 1000)), 3));
  g.setAttribute('skinIndex', new BufferAttribute(new Uint8Array(on.flatMap((j) => [j, 0, 0, 0])), 4));
  g.setAttribute('skinWeight', new BufferAttribute(new Float32Array(on.flatMap(() => [1, 0, 0, 0])), 4));
  const m = new SkinnedMesh(g, new MeshBasicMaterial());
  bones[0].parent!.updateMatrixWorld(true);
  const dq = new Matrix4().makeScale(0.001, 0.001, 0.001);
  m.bind(new Skeleton(bones, bones.map((b) => b.matrixWorld.clone().invert().multiply(dq))), new Matrix4());
  return m;
}
/** Each vertex where the skinning puts it (world). */
function skinned(m: SkinnedMesh) {
  m.updateMatrixWorld(true);
  m.skeleton.update();
  const out: number[][] = [];
  for (let i = 0; i < m.geometry.attributes.position.count; i++) {
    const v = new Vector3().fromBufferAttribute(m.geometry.attributes.position as BufferAttribute, i);
    m.applyBoneTransform(i, v);
    out.push(v.applyMatrix4(m.matrixWorld).toArray().map((x) => +x.toFixed(4)));
  }
  return out;
}

describe('a player’s one skeleton (skin.ts)', () => {
  it('binds the body’s meshes and a part with its own joint to one skeleton, posed exactly as on their own', () => {
    const model = new Group();
    const body = chain(model);
    const skin = sharedSkin(model);
    // the body: two meshes, their joints in different orders
    const a = part(body, [[0, 2, 0], [0, 4, 1]], [1, 2]), b = part([body[3], body[0]], [[0, 6, 0], [1, 0, 0]], [0, 1]);
    // a part: a ponytail's joint, its own, grafted under the head
    const tail = Object.assign(new Bone(), { name: 'Hair_1' });
    tail.position.set(0, 0, -1);
    body[3].add(tail);
    skin.graft(tail);
    const c = part([body[3], tail], [[0, 6, -1], [0, 5, -2]], [0, 1]);
    for (const m of [a, b, c]) model.add(m);
    // posed, then each as its own skeleton draws it
    body[1].rotation.z = 0.4;
    body[2].rotation.x = -0.3;
    tail.rotation.x = 0.7;
    model.position.set(5, 0, 2);
    const own = [a, b, c].map(skinned);
    skin.bind(a, a.skeleton.bones);
    skin.bind(b, b.skeleton.bones);
    skin.bind(c, c.skeleton.bones);
    expect([a, b, c].map((m) => m.skeleton === skin.skeleton)).toEqual([true, true, true]);
    expect([a, b, c].map(skinned)).toEqual(own);
    expect(skin.skeleton.bones.length).toBe(5);
    // the body's numbers are every player's (one copy), the part's own joint this player's
    expect(skin.uses(c)).toEqual([body[3], tail]);
  });
  it('lets a part’s joints go when it’s taken off, the others renumbered', () => {
    const model = new Group();
    const body = chain(model);
    const skin = sharedSkin(model);
    const j1 = Object.assign(new Bone(), { name: 'Skirt_1' }), j2 = Object.assign(new Bone(), { name: 'Hair_1' });
    body[1].add(j1);
    skin.graft(j1);
    body[3].add(j2);
    skin.graft(j2);
    const skirt = part([body[1], j1], [[0, 1, 1]], [1]), hair = part([body[3], j2], [[0, 6, -1], [0, 5, -2]], [0, 1]);
    model.add(skirt, hair);
    skin.bind(skirt, skirt.skeleton.bones);
    skin.bind(hair, hair.skeleton.bones);
    j2.rotation.x = 0.5;
    const before = skinned(hair);
    expect(skin.skeleton.bones.length).toBe(6);
    // the skirt off: its joint and mesh go
    skirt.removeFromParent();
    skin.drop(skirt);
    j1.removeFromParent();
    skin.compact([hair]);
    expect(skin.skeleton.bones.length).toBe(5);
    expect(skinned(hair)).toEqual(before);
  });
  it('keeps a mesh whose rest isn’t the player’s on a skeleton of its own', () => {
    const model = new Group();
    const body = chain(model);
    const skin = sharedSkin(model);
    // modelled with its spine 3 up, not 2: no one bind difference fits both its joints
    const other = new Group(), alt = chain(other);
    alt[2].position.y = 3;
    const m = part([alt[1], alt[2]], [[0, 2, 0], [0, 5, 0]], [0, 1]);
    skin.bind(m, [body[1], body[2]]);
    expect(m.skeleton).not.toBe(skin.skeleton);
    expect(skin.shares(m)).toBe(false);
    expect(skin.uses(m)).toEqual([body[1], body[2]]);
  });
});
