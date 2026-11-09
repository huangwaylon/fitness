// A villager's model let go of (villager3d.ts animateModel dispose): its skeletons' bone textures too, three's float
// texture a skinned mesh's skeleton has on the GPU till the skeleton is disposed (~5 a villager left on the island's
// renderer at each swap or visitor gone).
import { describe, expect, it, vi } from 'vitest';
import { Bone, BufferAttribute, BufferGeometry, Group, MeshStandardMaterial, Skeleton, SkinnedMesh } from 'three';
import { animateModel } from './villager3d.ts';

describe('a villager let go of (animateModel dispose)', () => {
  it('disposes its skeletons', () => {
    const scene = new Group(), root = new Bone(), head = new Bone();
    root.name = 'Root';
    head.name = 'Head';
    root.add(head);
    scene.add(root);
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(3), 3));
    g.setAttribute('skinIndex', new BufferAttribute(new Uint16Array([0, 0, 0, 0]), 4));
    g.setAttribute('skinWeight', new BufferAttribute(new Float32Array([1, 0, 0, 0]), 4));
    const m = new SkinnedMesh(g, new MeshStandardMaterial());
    scene.add(m);
    scene.updateMatrixWorld(true);
    m.bind(new Skeleton([root, head]));
    const freed = vi.spyOn(m.skeleton, 'dispose');
    animateModel('bob', scene).dispose();
    expect(freed).toHaveBeenCalled();
  });
});
