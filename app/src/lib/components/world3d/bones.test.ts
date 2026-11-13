// A skeleton's bone texture marked for upload only when a bone moved (bones.ts), with three's own matrices.
import { describe, expect, test } from 'vitest';
import { Bone, Matrix4, REVISION, Skeleton } from 'three';
import { lazyBones } from './bones.ts';

// (three's own, before lazyBones replaces it)
const threes = Skeleton.prototype.update.toString().replace(/\/\/.*$/gm, '').replace(/\s+/g, ' ').trim();

const make = () => {
  const root = new Bone(), arm = new Bone();
  root.add(arm);
  arm.position.set(0, 1.3, 0.1);
  root.rotation.set(0.2, 0.7, 0);
  root.updateMatrixWorld(true);
  const s = new Skeleton([root, arm]);
  s.computeBoneTexture();
  return { s, root };
};

describe('lazyBones', () => {
  // bones.ts replaces three's Skeleton.update outright: a three that changes it (batched skinning, another layout) would
  // be overridden in silence. Bumping three: read its Skeleton.update, bring bones.ts's in line, then these two.
  test("three's Skeleton.update is still the one bones.ts copies (three r170)", () => {
    expect(REVISION).toBe('170');
    expect(threes).toBe(
      'update() { const bones = this.bones; const boneInverses = this.boneInverses; const boneMatrices = this.boneMatrices; const boneTexture = this.boneTexture; ' +
        'for ( let i = 0, il = bones.length; i < il; i ++ ) { const matrix = bones[ i ] ? bones[ i ].matrixWorld : _identityMatrix; ' +
        '_offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] ); _offsetMatrix.toArray( boneMatrices, i * 16 ); } ' +
        'if ( boneTexture !== null ) { boneTexture.needsUpdate = true; } }'
    );
  });

  test('the same bone matrices as three, the texture marked only when they change', () => {
    const ref = make();
    ref.root.rotation.z = 0.4;
    ref.root.updateMatrixWorld(true);
    ref.s.update();
    const want = Array.from(ref.s.boneMatrices.slice(0, 32));

    lazyBones();
    const { s, root } = make();
    // (its first: the matrices written, the texture sent; again, as it stands: not)
    s.update();
    const v0 = s.boneTexture!.version;
    s.update();
    expect(s.boneTexture!.version).toBe(v0);
    root.rotation.z = 0.4;
    root.updateMatrixWorld(true);
    s.update();
    expect(s.boneTexture!.version).toBe(v0 + 1);
    expect(Array.from(s.boneMatrices.slice(0, 32))).toEqual(want);
    s.update();
    s.update();
    expect(s.boneTexture!.version).toBe(v0 + 1);
    // (a bone gone: the identity, as three's)
    s.bones[1] = undefined as unknown as Bone;
    s.update();
    expect(s.boneTexture!.version).toBe(v0 + 2);
    expect(Array.from(s.boneMatrices.slice(16, 32))).toEqual(Array.from(new Matrix4().multiply(s.boneInverses[1]).elements).map(Math.fround));
  });
});
