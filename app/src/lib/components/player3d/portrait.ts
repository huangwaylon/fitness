// A player's head as a still (the 2D heads' portraits, the closet's tiles: docs/players.md "Portraits"), drawn
// by a renderer the page already has (the island's, the preview's) into a render target: never a second WebGL
// context. The player is borrowed for the shot (its group's parent, place and pose put back after).
import {
  AmbientLight, Box3, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, SRGBColorSpace, Vector3,
  WebGLRenderTarget, type WebGLRenderer
} from 'three';
import type { Villager3D } from '../villager3d/villager3d.ts';

/** The head and shoulders of `v` at `size` px square, on `bg` (null: see-through), as a 2D canvas (toDataURL /
 *  toBlob it for a cache). Its face as it is now (set one first: v.face('happy'), v.step(t)).
 *  @public (re-exported by player3d.ts) */
export function portrait(renderer: WebGLRenderer, v: Villager3D, size = 192, bg: string | null = null): HTMLCanvasElement {
  const g = v.group, parent = g.parent, pos = g.position.clone(), rot = g.rotation.clone();
  const scene = new Scene();
  if (bg) scene.background = new Color(bg);
  scene.add(new HemisphereLight(0xffffff, 0xb8c4b8, 1.5), new AmbientLight(0xffffff, 0.25));
  const key = new DirectionalLight(0xfff3e0, 1.2);
  key.position.set(-0.6, 1, 1.2);
  scene.add(key);
  g.position.set(0, 0, 0);
  g.rotation.set(0, 0, 0);
  scene.add(g);
  g.updateMatrixWorld(true);
  // the frame: from the eyes up to the head's top and down past the chin, a little turned
  const eye = v.eyes(new Vector3()) ?? new Box3().setFromObject(g).getCenter(new Vector3());
  const top = v.crown(new Vector3())?.y ?? eye.y * 1.2;
  const h = (top - eye.y) * 2.6, cy = top - h * 0.45;
  const cam = new PerspectiveCamera(22, 1, 1, 5000);
  const d = h / 2 / Math.tan((22 / 2) * Math.PI / 180);
  cam.position.set(d * Math.sin(-0.3), cy + d * 0.05, d * Math.cos(-0.3));
  cam.lookAt(0, cy, 0);
  const rt = new WebGLRenderTarget(size, size, { samples: 4 });
  rt.texture.colorSpace = SRGBColorSpace;
  const prev = renderer.getRenderTarget(), clear = renderer.getClearAlpha();
  renderer.setRenderTarget(rt);
  renderer.setClearAlpha(bg ? 1 : 0);
  renderer.clear();
  renderer.render(scene, cam);
  const px = new Uint8Array(size * size * 4);
  renderer.readRenderTargetPixels(rt, 0, 0, size, size, px);
  renderer.setRenderTarget(prev);
  renderer.setClearAlpha(clear);
  rt.dispose();
  // put back
  scene.remove(g);
  parent?.add(g);
  g.position.copy(pos);
  g.rotation.copy(rot);
  // the target's rows bottom up: flipped into the canvas
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!, img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) img.data.set(px.subarray((size - 1 - y) * size * 4, (size - y) * size * 4), y * size * 4);
  ctx.putImageData(img, 0, 0);
  return c;
}
