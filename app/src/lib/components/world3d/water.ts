// The 3D island's water uniforms, one set for every water shader (the layout's ground, terrain.ts; the ponds put down,
// pond.ts; the editor's preview): the water's clock, the time of day's tint and the scene's fog.
import { Color, type Fog } from 'three';

export const waterU = {
  uTime: { value: 0 },
  uTint: { value: new Color(1, 1, 1) },
  uFog: { value: new Color(0xcfeaff) },
  uFogNear: { value: 1200 },
  uFogFar: { value: 3000 }
};

/** The water's fog follows the scene's. */
export function waterFog(f: Fog) {
  waterU.uFog.value.copy(f.color);
  waterU.uFogNear.value = f.near;
  waterU.uFogFar.value = f.far;
}
