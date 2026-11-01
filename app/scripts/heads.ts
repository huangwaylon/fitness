// Where each villager render's head and eyes are, measured once from the art (npm run heads, after assets:fetch): the
// birthday hat and Jack's party glasses sit on the head, a sting's swollen eye on an eye, whatever the shape (tall ears,
// wide heads, small specials, side-facing renders).
// Usage (from app/): node scripts/heads.ts → src/lib/villagers/heads.json (commit it). Needs dwebp (brew install webp).
//
// Per render, as fractions of the drawn figure (the canvas, or art.ts's BOX crop): [cx, hatY, eyeY, faceW, lx, ly, rx]
// - the head's width: the longest run of opaque pixels in a row of the figure's top 55% (NH heads are bigger than the
//   body; runs, so two ears side by side or a tail beside the body don't count as one);
// - hatY: the first row from the top with a run at least 55% as long (so ears and antennae don't count);
// - eyeY: 42% of the way from hatY to the figure's middle (NH heads fill about the top half), cx that row's middle;
//   faceW: the head's width;
// - lx, ly, rx: the eyes, the left one as drawn (or the only one a profile shows: rx null) and the right one's x, the
//   pair level. Found as NH eyes look: dark blobs in the head that catch the light (a highlight inside), round-ish, a
//   level pair of like size either side of the head's middle (brows are flatter, nostrils and mouths unlit or central);
//   EYES gives the renders where that misses (closed eyes, glasses, masks, goggles, profiles), read off the art by eye.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const APP = join(import.meta.dirname, '..');
const DIR = join(APP, 'static', 'art', 'villagers');
const OUT = join(APP, 'src', 'lib', 'villagers', 'heads.json');

/** art.ts's BOX crops (the figure's box in a padded canvas), read from its source. */
const BOX: Record<string, [number, number, number, number]> = {};
for (const [, k, x, y, w, h] of readFileSync(join(APP, 'src', 'lib', 'art.ts'), 'utf8').matchAll(/'villagers\/([\w-]+)': \[(\d+), (\d+), (\d+), (\d+)\]/g))
  BOX[k] = [Number(x), Number(y), Number(w), Number(h)];

/** Hand-checked eyes [lx, ly, rx] (fractions of the figure) where the detection below misses (a contact sheet with the
 *  lump drawn on every render, checked by eye: /tmp-only, not kept). */
const EYES: Record<string, [number, number, number | null]> = {
  ace: [0.24, 0.245, 0.7], admiral: [0.27, 0.2, 0.74], 'agent-s': [0.19, 0.415, 0.56], agnes: [0.18, 0.275, 0.72],
  alli: [0.4, 0.045, 0.68], amelia: [0.51, 0.14, null], ankha: [0.235, 0.4, 0.76], apollo: [0.4, 0.1, null],
  astrid: [0.5, 0.21, null], audie: [0.34, 0.31, 0.67], aurora: [0.2, 0.16, 0.67], avery: [0.5, 0.09, null],
  bam: [0.3, 0.31, 0.7], barold: [0.31, 0.29, 0.68], bianca: [0.32, 0.24, 0.72], bill: [0.26, 0.34, 0.71],
  billy: [0.33, 0.18, 0.69], blathers: [0.29, 0.27, 0.56], bluebear: [0.25, 0.32, 0.76], bob: [0.25, 0.4, 0.72],
  boomer: [0.3, 0.23, 0.67], boone: [0.43, 0.21, 0.59], brewster: [0.53, 0.165, 0.665], broccolo: [0.35, 0.52, 0.65],
  buck: [0.57, 0.15, null], bud: [0.33, 0.27, 0.63], bunnie: [0.33, 0.41, 0.68], cally: [0.26, 0.21, 0.52],
  camofrog: [0.24, 0.09, 0.75], carmen: [0.25, 0.405, 0.71], caroline: [0.2, 0.345, 0.59],
  cashmere: [0.44, 0.065, 0.58], cece: [0.29, 0.4, null], celeste: [0.39, 0.245, 0.77],
  cephalobot: [0.21, 0.3, 0.78], cheri: [0.23, 0.325, 0.76], cherry: [0.31, 0.225, 0.7], chops: [0.23, 0.3, 0.79],
  chow: [0.28, 0.185, 0.7], cj: [0.44, 0.32, 0.62], cleo: [0.52, 0.165, null], clyde: [0.23, 0.13, 0.49],
  cobb: [0.31, 0.245, 0.69], cole: [0.27, 0.44, 0.72], cookie: [0.25, 0.195, 0.7], cousteau: [0.29, 0.13, 0.78],
  croque: [0.24, 0.11, 0.76], cube: [0.22, 0.23, 0.77], curly: [0.34, 0.25, 0.65], curt: [0.33, 0.185, 0.65],
  'daisy-mae': [0.125, 0.535, 0.33], derwin: [0.28, 0.31, 0.72], diva: [0.21, 0.12, 0.75],
  dobie: [0.36, 0.295, 0.69], dora: [0.44, 0.405, 0.54], drift: [0.25, 0.14, 0.77], ed: [0.53, 0.155, null],
  erik: [0.27, 0.335, 0.71], etoile: [0.4, 0.16, 0.59], eugene: [0.33, 0.29, 0.66], fang: [0.52, 0.355, null],
  flick: [0.37, 0.27, null], frank: [0.5, 0.13, null], frett: [0.32, 0.24, 0.68], frita: [0.38, 0.095, 0.61],
  frobert: [0.24, 0.06, 0.73], gala: [0.22, 0.3, 0.81], gaston: [0.31, 0.355, 0.68], gigi: [0.25, 0.13, 0.75],
  gladys: [0.38, 0.21, null], gloria: [0.245, 0.335, 0.74], graham: [0.32, 0.39, 0.67], greta: [0.37, 0.51, 0.61],
  gruff: [0.33, 0.26, 0.7], gulliver: [0.73, 0.29, null], hamphrey: [0.29, 0.41, 0.71], harvey: [0.32, 0.235, 0.62],
  hazel: [0.22, 0.35, 0.56], hippeux: [0.68, 0.27, null], huck: [0.23, 0.125, 0.75], ione: [0.63, 0.415, 0.94],
  jack: [0.31, 0.31, 0.61], jacques: [0.21, 0.29, 0.78], judy: [0.24, 0.33, 0.73], julian: [0.67, 0.18, null],
  kappn: [0.25, 0.265, 0.67], katt: [0.37, 0.4, 0.62], keaton: [0.5, 0.15, null], kevin: [0.26, 0.25, 0.71],
  kicks: [0.3, 0.29, 0.7], kitty: [0.23, 0.41, 0.74], klaus: [0.37, 0.2, 0.64], kody: [0.25, 0.325, 0.77],
  leonardo: [0.31, 0.245, 0.69], leopold: [0.33, 0.255, 0.66], lily: [0.24, 0.105, 0.74], lopez: [0.29, 0.375, 0.69],
  lucha: [0.27, 0.23, 0.72], lucky: [0.7, 0.185, null], lucy: [0.26, 0.23, 0.73], mac: [0.34, 0.205, 0.66],
  marcel: [0.31, 0.21, 0.67], margie: [0.42, 0.27, null], marina: [0.26, 0.3, 0.71], marlo: [0.36, 0.42, 0.62],
  mathilda: [0.56, 0.26, null], megan: [0.33, 0.18, 0.67], merry: [0.2, 0.4, 0.76], mira: [0.25, 0.415, 0.74],
  moe: [0.2, 0.4, 0.8], monique: [0.31, 0.415, 0.69], mott: [0.36, 0.23, 0.68], olaf: [0.63, 0.15, null],
  olivia: [0.25, 0.4, 0.75], orville: [0.45, 0.195, null], ozzie: [0.31, 0.215, 0.68], pancetti: [0.25, 0.305, 0.8],
  paolo: [0.57, 0.27, null], pascal: [0.23, 0.31, 0.82], patty: [0.33, 0.125, 0.65], pave: [0.37, 0.225, 0.61],
  peaches: [0.49, 0.135, null], peanut: [0.17, 0.4, 0.49], peck: [0.21, 0.24, 0.78], peewee: [0.42, 0.17, 0.59],
  peggy: [0.23, 0.285, 0.76], pekoe: [0.26, 0.32, 0.74], petri: [0.33, 0.49, 0.68], phil: [0.21, 0.2, 0.75],
  piper: [0.21, 0.26, 0.79], portia: [0.31, 0.21, 0.7], prince: [0.23, 0.1, 0.76], puck: [0.35, 0.23, 0.62],
  puddles: [0.25, 0.1, 0.75], quinn: [0.6, 0.155, null], raddle: [0.26, 0.135, 0.74], raymond: [0.27, 0.43, 0.72],
  redd: [0.24, 0.32, 0.52], reneigh: [0.64, 0.21, null], ribbot: [0.24, 0.09, 0.77], ricky: [0.25, 0.29, 0.65],
  rocket: [0.41, 0.175, 0.59], rodeo: [0.31, 0.13, 0.61], rooney: [0.53, 0.23, null], roswell: [0.32, 0.075, 0.7],
  rudy: [0.25, 0.4, 0.75], sally: [0.18, 0.35, 0.61], samson: [0.44, 0.425, 0.54], sasha: [0.28, 0.415, 0.72],
  savannah: [0.54, 0.16, null], shep: [0.3, 0.25, 0.7], shino: [0.28, 0.37, 0.65], spork: [0.33, 0.25, 0.66],
  sprocket: [0.26, 0.175, 0.71], stinky: [0.28, 0.415, 0.73], stitches: [0.18, 0.33, 0.82], tad: [0.28, 0.1, 0.78],
  tammy: [0.24, 0.32, 0.76], tangy: [0.27, 0.43, 0.77], tank: [0.71, 0.385, null], tasha: [0.2, 0.375, 0.59],
  tiffany: [0.24, 0.4, 0.73], tipper: [0.31, 0.18, 0.67], 'tom-nook': [0.22, 0.31, 0.68],
  truffles: [0.3, 0.245, 0.7], tucker: [0.36, 0.22, null], tulin: [0.27, 0.26, 0.67], twiggy: [0.26, 0.22, 0.72],
  ursala: [0.32, 0.215, 0.68], velma: [0.37, 0.26, 0.62], vesta: [0.6, 0.18, null], vic: [0.37, 0.17, 0.62],
  viche: [0.5, 0.35, 0.82], 'wart-jr': [0.23, 0.105, 0.76], wilbur: [0.28, 0.245, 0.52], winnie: [0.54, 0.155, null],
  zipper: [0.35, 0.37, 0.7]
};

type Px = { w: number; h: number; a: (x: number, y: number) => number; l: (x: number, y: number) => number };

/** A PAM (RGB_ALPHA) file's width, height, alpha and luminance. */
function readPam(file: string): Px {
  const buf = readFileSync(file);
  const end = buf.indexOf('ENDHDR\n') + 7;
  const head = buf.subarray(0, end).toString('latin1');
  const w = Number(/WIDTH (\d+)/.exec(head)![1]), h = Number(/HEIGHT (\d+)/.exec(head)![1]);
  const at = (x: number, y: number) => end + (y * w + x) * 4;
  return { w, h, a: (x, y) => buf[at(x, y) + 3], l: (x, y) => buf[at(x, y)] * 0.3 + buf[at(x, y) + 1] * 0.59 + buf[at(x, y) + 2] * 0.11 };
}

interface Blob { n: number; x: number; y: number }

/** The eyes in a figure (its box: bx, by, bw, bh), given its head box: [lx, ly, rx] in the box's fractions. */
function findEyes(p: Px, [bx, by, w, h]: readonly number[], [cx, hatY, eyeY, faceW]: readonly number[]): [number, number, number | null] {
  const A = (x: number, y: number) => p.a(bx + x, by + y), L = (x: number, y: number) => p.l(bx + x, by + y);
  const fw = faceW * w;
  // the band from the head's top to a little under the guessed eye line, and its median luminance
  const y0 = Math.max(0, Math.floor(hatY * h)), y1 = Math.floor(Math.min(0.58, eyeY + 0.2) * h);
  const ls: number[] = [];
  for (let y = y0; y < y1; y += 2) for (let x = 0; x < w; x += 2) if (A(x, y) > 200) ls.push(L(x, y));
  ls.sort((a, b) => a - b);
  const med = ls[ls.length >> 1] ?? 128;
  let best: { s: number; a: Blob; b: Blob } | null = null;
  const singles: Blob[] = [];
  // three darkness levels: black pupils, dark brown ones, coloured irises
  for (const thr of [Math.min(70, med * 0.45), Math.min(100, med * 0.55), Math.min(130, med * 0.65)]) {
    const dark = new Uint8Array(w * h), seen = new Uint8Array(w * h);
    for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) if (A(x, y) > 200 && L(x, y) < thr) dark[y * w + x] = 1;
    const ok: Blob[] = [];
    for (let y = y0; y < y1; y++) for (let x = 0; x < w; x++) {
      const i0 = y * w + x;
      if (!dark[i0] || seen[i0]) continue;
      const st = [i0];
      seen[i0] = 1;
      let n = 0, sx = 0, sy = 0, l = x, r = x, t = y, b = y, edge = false;
      while (st.length) {
        const i = st.pop()!, X = i % w, Y = (i / w) | 0;
        n++; sx += X; sy += Y;
        l = Math.min(l, X); r = Math.max(r, X); t = Math.min(t, Y); b = Math.max(b, Y);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const XX = X + dx, YY = Y + dy;
          if (XX < 0 || YY < 0 || XX >= w || YY >= h) { edge = true; continue; }
          if (A(XX, YY) < 100) edge = true; // touches the outline: an ear, a tail, a sleeve
          const j = YY * w + XX;
          if (dark[j] && !seen[j]) { seen[j] = 1; st.push(j); }
        }
      }
      const bw = r - l + 1, bh = b - t + 1;
      let hi = 0; // NH eyes catch the light: bright pixels inside the blob's box
      for (let Y = t; Y <= b; Y++) for (let X = l; X <= r; X++) if (A(X, Y) > 200 && L(X, Y) > 190) hi++;
      const c = { n, x: sx / n, y: sy / n };
      if (Math.abs(c.x - cx * w) < 0.5 * fw && !edge && n >= (0.012 * w) ** 2 && bw <= 0.22 * fw && bh <= 0.22 * h && n / (bw * bh) > 0.3 &&
        hi / (bw * bh) > 0.01 && bw / bh <= 2.2 && bh / bw <= 4) ok.push(c);
    }
    // the best level pair of like size either side of the head's middle, higher up preferred (a nose or mouth is lower)
    for (let i = 0; i < ok.length; i++) for (let j = i + 1; j < ok.length; j++) {
      const [a, b] = ok[i].x < ok[j].x ? [ok[i], ok[j]] : [ok[j], ok[i]];
      const dx = b.x - a.x, dy = Math.abs(a.y - b.y), ratio = a.n / b.n;
      if (dy > 0.04 * h || dx < 0.12 * fw || dx > 0.75 * fw || ratio < 0.35 || ratio > 2.9) continue;
      const s = dy / h + Math.abs(Math.log(ratio)) * 0.02 + Math.abs((a.x + b.x) / 2 / w - cx) * 0.3 + ((a.y + b.y) / 2 / h) * 0.15;
      if (!best || s < best.s) best = { s, a, b };
    }
    singles.push(...ok);
  }
  if (best) return [r3(best.a.x / w), r3(best.a.y / h), r3(best.b.x / w)];
  // one eye (a profile): the blob nearest the guessed eye, off the middle (where the nose and mouth are)
  const cost = (q: Blob) => Math.hypot(q.x / w - cx, q.y / h - eyeY) + (Math.abs(q.x - cx * w) < 0.1 * fw ? 1 : 0);
  const one = singles.sort((p1, p2) => cost(p1) - cost(p2))[0];
  if (one) return [r3(one.x / w), r3(one.y / h), null];
  return [r3(cx - faceW * 0.2), eyeY, r3(cx + faceW * 0.2)];
}

const tmp = mkdtempSync(join(tmpdir(), 'heads-'));
const out: Record<string, (number | null)[]> = {};
function r3(v: number): number {
  return Math.round(v * 1000) / 1000;
}
try {
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.webp') && !n.endsWith('-icon.webp')).sort()) {
    const id = f.slice(0, -5);
    const pam = join(tmp, `${id}.pam`);
    execFileSync('dwebp', [join(DIR, f), '-pam', '-o', pam], { stdio: 'ignore' });
    const px = readPam(pam);
    const { w, h, a } = px;
    const [bx, by, bw, bh] = BOX[id] ?? [0, 0, w, h];
    // per row: its longest run of opaque pixels (two ears side by side, or a tail beside the body, are separate runs)
    const rows: { n: number; l: number; r: number }[] = [];
    for (let y = by; y < by + bh; y++) {
      let best = { n: 0, l: -1, r: -1 }, start = -1;
      for (let x = bx; x <= bx + bw; x++) {
        const on = x < bx + bw && a(x, y) > 128;
        if (on && start < 0) start = x;
        if (!on && start >= 0) {
          if (x - start > best.n) best = { n: x - start, l: start, r: x - 1 };
          start = -1;
        }
      }
      rows.push(best);
    }
    const top = rows.findIndex((row) => row.n > 0);
    let wy = top;
    for (let y = top; y < bh * 0.55; y++) if (rows[y].n > rows[wy].n) wy = y;
    const ws = rows[wy].n;
    const hy = rows.findIndex((row, y) => y >= top && row.n >= ws * 0.55);
    // NH heads fill about the figure's top half: the eyes sit a little above the middle of that, wherever the widest row
    // is (a tail, a shell or flippers can be wider than the face)
    const eye = hy + (bh * 0.5 - hy) * 0.42;
    const er = rows[Math.round(eye)];
    const head = [r3(((er.l + er.r) / 2 - bx) / bw), r3(hy / bh), r3(eye / bh), r3(ws / bw)];
    out[id] = [...head, ...(EYES[id] ?? findEyes(px, [bx, by, bw, bh], head))];
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`wrote ${OUT}: ${Object.keys(out).length} renders`);
