// A skeleton's bone texture uploaded only when its bones moved. three's Skeleton.update (run for each skeleton drawn,
// once a frame: WebGLObjects) writes every bone's matrix and marks the texture for upload each frame whether or not
// anything changed: a resting island re-sent ~24 bone textures a frame (texSubImage2D, the villagers' and players'
// skeletons standing still, review 2026-11-13 perf #6). Here the same matrices are written, and the texture marked only
// when one of them changed (as a float32: what the texture holds). Installed once, for every renderer (stage.ts).
// bones.test pins three's own (r170): a three bump fails it till this is read against the new Skeleton.update.
import { Matrix4, Skeleton } from 'three';

const off = new Matrix4(), I = new Matrix4();
let installed = false;

/** Skeleton.update as three's, but the bone texture marked for upload only when a bone's matrix changed. */
function update(this: Skeleton): void {
  const { bones, boneInverses, boneMatrices: out, boneTexture } = this;
  let changed = false;
  for (let i = 0; i < bones.length; i++) {
    off.multiplyMatrices(bones[i] ? bones[i].matrixWorld : I, boneInverses[i]);
    const e = off.elements, o = i * 16;
    for (let k = 0; k < 16; k++) {
      const v = Math.fround(e[k]);
      if (out[o + k] !== v) (out[o + k] = v), (changed = true);
    }
  }
  if (changed && boneTexture) boneTexture.needsUpdate = true;
}

export function lazyBones(): void {
  if (installed) return;
  installed = true;
  Skeleton.prototype.update = update;
}
