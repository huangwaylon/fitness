// The museum's procedural textures (engine.ts draws them on canvases, once a visit): the owl's medallion, the doorways'
// plaques and glows, the first person's glass roof, coffered ceiling and door, the garden's grass.
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import type { Wing } from './plan.ts';

/** NH's lobby medallion (the owl's emblem in its ring of gold), drawn once. */
export function medallion(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d')!;
  const R = 250;
  g.translate(256, 256);
  const ring = (r: number, w: number, col: string) => {
    g.beginPath();
    g.arc(0, 0, r, 0, Math.PI * 2);
    g.lineWidth = w;
    g.strokeStyle = col;
    g.stroke();
  };
  g.beginPath();
  g.arc(0, 0, R, 0, Math.PI * 2);
  // (a warm walnut inlay: a near-black disc read as a hole in the floor)
  g.fillStyle = '#6a4632';
  g.fill();
  ring(R - 8, 12, '#c9a24a');
  ring(R - 40, 4, '#c9a24a');
  // the compass's points
  g.fillStyle = '#7c2a2c';
  for (let k = 0; k < 8; k++) {
    g.save();
    g.rotate((k * Math.PI) / 4);
    g.beginPath();
    g.moveTo(0, -(R - 46));
    g.lineTo(k % 2 ? 22 : 34, 0);
    g.lineTo(k % 2 ? -22 : -34, 0);
    g.closePath();
    g.fill();
    g.restore();
  }
  // the owl: a round face, its eyes, its brows (the museum's emblem)
  g.beginPath();
  g.arc(0, 0, 92, 0, Math.PI * 2);
  g.fillStyle = '#c9a24a';
  g.fill();
  g.fillStyle = '#2f2a2a';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(s * 34, -8, 22, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(s * 10, -40);
    g.lineTo(s * 70, -64);
    g.lineTo(s * 58, -36);
    g.closePath();
    g.fill();
  }
  g.fillStyle = '#c9a24a';
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(s * 34, -8, 9, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = '#2f2a2a';
  g.beginPath();
  g.moveTo(-10, 16);
  g.lineTo(10, 16);
  g.lineTo(0, 36);
  g.closePath();
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** A doorway's plaque (NH's lobby plaques: the room beyond's name, cream on walnut in a gold rim), PLAQUE_W × PLAQUE_H
 *  model units (plan.ts plaqueAt: where it hangs); drawn again once the app's font is in (`then`: a frame for it). */
const PLAQUE_FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", system-ui, sans-serif';
export function plaque(text: string, then: () => void): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 480;
  c.height = 128;
  const g = c.getContext('2d')!;
  const paint = () => {
    g.clearRect(0, 0, 480, 128);
    g.fillStyle = '#5b3f2a';
    g.beginPath();
    g.roundRect(3, 3, 474, 122, 22);
    g.fill();
    g.strokeStyle = '#d5ad55';
    g.lineWidth = 7;
    g.stroke();
    g.fillStyle = '#fbf2dc';
    g.font = `700 70px ${PLAQUE_FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, 240, 68, 430);
  };
  paint();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  void document.fonts?.load(`700 70px "Zen Maru Gothic"`, text).then(() => {
    paint();
    t.needsUpdate = true;
    then();
  }, () => {});
  return t;
}

/** A doorway's glow (times its room's mood): full at the floor, deeper toward the top, and a glimpse of the room
 *  beyond in a deeper tone (the garden's fronds, a tank's ripples, a skeleton, a hung frame; the hall none). */
export function portalGlow(wing: Wing): CanvasTexture {
  const c = document.createElement('canvas'), W = 64, H = 96;
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!, v = g.createLinearGradient(0, 0, 0, H);
  v.addColorStop(0, '#7a7a7a');
  v.addColorStop(0.7, '#ececec');
  v.addColorStop(1, '#ffffff');
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  g.fillStyle = g.strokeStyle = 'rgba(70, 60, 50, 0.24)';
  g.lineCap = 'round';
  if (wing === 'bug') {
    // fronds up from either side
    for (const [x0, k] of [[2, 1], [62, -1]] as const) {
      for (let i = 0; i < 4; i++) {
        g.beginPath();
        g.ellipse(x0 + k * (4 + i * 5), 70 - i * 12, 5, 13, k * (0.5 + i * 0.25), 0, Math.PI * 2);
        g.fill();
      }
    }
  } else if (wing === 'fish') {
    // a tank's ripples
    g.lineWidth = 2.5;
    for (let y = 30; y < 80; y += 11) {
      g.beginPath();
      for (let x = 0; x <= W; x += 4) g.lineTo(x, y + Math.sin(x * 0.2 + y) * 2.5);
      g.stroke();
    }
  } else if (wing === 'fossil') {
    // a long-necked skeleton: its spine, ribs and legs
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(10, 34);
    g.quadraticCurveTo(18, 30, 22, 50);
    g.lineTo(46, 52);
    g.quadraticCurveTo(56, 54, 62, 66);
    g.stroke();
    for (let x = 26; x <= 42; x += 4) (g.beginPath(), g.moveTo(x, 51), g.lineTo(x, 60), g.stroke());
    for (const x of [26, 42]) (g.beginPath(), g.moveTo(x, 52), g.lineTo(x - 2, 80), g.stroke());
  } else if (wing === 'art') {
    // a hung frame
    g.lineWidth = 4;
    g.strokeRect(18, 30, 28, 22);
    g.fillRect(22, 34, 20, 14);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** The garden's glass roof from under it (the first person's): a pale sky through panes in white frames, tiled. */
export function glassRoof(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const sky = g.createLinearGradient(0, 0, 64, 64);
  sky.addColorStop(0, '#cfeaf2');
  sky.addColorStop(1, '#b4dbe9');
  g.fillStyle = sky;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#f4f1e6';
  g.fillRect(0, 0, 64, 3);
  g.fillRect(0, 0, 3, 64);
  g.fillRect(0, 31, 64, 1.5);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** The hall's ceiling from below (the first person's): plaster coffers in a stone frame, a thread of gold, tiled. */
export function coffers(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#cdbd9e';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#efe5d2';
  g.fillRect(6, 6, 52, 52);
  g.strokeStyle = '#c9a24a';
  g.lineWidth = 1.5;
  g.strokeRect(11, 11, 42, 42);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}

/** NH's museum door from inside (the first person's): two wooden leaves, their panels, brass handles. */
export function doorTex(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 96;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#6b4630';
  g.fillRect(0, 0, 96, 128);
  g.fillStyle = '#5a3a27';
  for (const x of [8, 54]) for (const y of [10, 70]) g.fillRect(x, y, 34, 48);
  g.fillStyle = '#3b261a';
  g.fillRect(47, 0, 2, 128);
  g.fillStyle = '#d5ad55';
  for (const x of [40, 52]) g.fillRect(x, 64, 4, 10);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

/** NH's grass under the garden's glass, a little mottled (one canvas, tiled). */
export function grass(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#7fbf58';
  g.fillRect(0, 0, 128, 128);
  let s = 7;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(96,160,70,0.5)' : 'rgba(160,214,110,0.45)';
    g.beginPath();
    g.ellipse(rnd() * 128, rnd() * 128, 2 + rnd() * 5, 1 + rnd() * 3, rnd() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.wrapS = t.wrapT = RepeatWrapping;
  return t;
}
