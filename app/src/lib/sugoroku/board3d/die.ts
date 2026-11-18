// 英語すごろく's die in 3D (engine.ts): a cube, its pips one canvas atlas (3 × 2 faces; the 1 a big red pip, as a
// Japanese die has it), opposite faces adding to 7 (plan.ts DIE_FACES), and a soft shadow under it.
import { BoxGeometry, CanvasTexture, CircleGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, SRGBColorSpace } from 'three';
import { DIE_FACES, DIE_SIZE } from './plan.ts';

const PX = 128;
/** Where each value's pips are (fractions of a face). */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.26, 0.26], [0.5, 0.5], [0.74, 0.74]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
  6: [[0.28, 0.24], [0.72, 0.24], [0.28, 0.5], [0.72, 0.5], [0.28, 0.76], [0.72, 0.76]]
};

function faces(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = PX * 3;
  c.height = PX * 2;
  const g = c.getContext('2d')!;
  DIE_FACES.forEach((n, i) => {
    const x = (i % 3) * PX, y = Math.floor(i / 3) * PX;
    g.fillStyle = '#e9dcc0';
    g.fillRect(x, y, PX, PX);
    g.fillStyle = '#fffaf0';
    g.beginPath();
    g.roundRect(x + 5, y + 5, PX - 10, PX - 10, 22);
    g.fill();
    for (const [px, py] of PIPS[n]) {
      g.fillStyle = n === 1 ? '#e0483e' : '#4a3a2c';
      g.beginPath();
      g.arc(x + px * PX, y + py * PX, n === 1 ? 20 : 11, 0, Math.PI * 2);
      g.fill();
    }
  });
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The die: `group` (moved and turned by the engine), its `cube` and its `shadow` (on the ground, under it). */
export function buildDie(): { group: Group; cube: Mesh; shadow: Mesh } {
  const geo = new BoxGeometry(DIE_SIZE, DIE_SIZE, DIE_SIZE);
  // each face's uv into its cell of the 3 × 2 atlas (BoxGeometry: 4 vertices a face, in DIE_FACES' order)
  const uv = geo.getAttribute('uv');
  for (let k = 0; k < uv.count; k++) {
    const i = Math.floor(k / 4), col = i % 3, row = Math.floor(i / 3);
    uv.setXY(k, (col + uv.getX(k)) / 3, 1 - (row + 1 - uv.getY(k)) / 2);
  }
  const cube = new Mesh(geo, new MeshLambertMaterial({ map: faces(), emissive: 0xffffff, emissiveIntensity: 0.08 }));
  const shadow = new Mesh(new CircleGeometry(DIE_SIZE * 0.75, 20).rotateX(-Math.PI / 2), new MeshBasicMaterial({ color: 0x3a2a1a, transparent: true, opacity: 0.22, depthWrite: false }));
  shadow.renderOrder = 1;
  shadow.position.y = 0.6;
  const group = new Group();
  group.add(cube, shadow);
  group.visible = false;
  return { group, cube, shadow };
}
