// Where each villager render's head is, measured once from the art's alpha (npm run heads, after assets:fetch): the
// birthday hat and Jack's party glasses sit on it whatever the shape (tall ears, wide heads, small specials).
// Usage (from app/): node scripts/heads.ts → src/lib/villagers/heads.json (commit it). Needs dwebp (brew install webp).
//
// Per render, as fractions of the drawn figure (the canvas, or art.ts's BOX crop): [cx, hatY, eyeY, faceW]
// - the head's width: the longest run of opaque pixels in a row of the figure's top 55% (NH heads are bigger than the
//   body; runs, so two ears side by side or a tail beside the body don't count as one);
// - hatY: the first row from the top with a run at least 55% as long (so ears and antennae don't count);
// - eyeY: 42% of the way from hatY to the figure's middle (NH heads fill about the top half), cx that row's middle;
//   faceW: the head's width.
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

/** A PAM (RGB_ALPHA) file's width, height and alpha channel. */
function readPam(file: string): { w: number; h: number; a: (x: number, y: number) => number } {
  const buf = readFileSync(file);
  const end = buf.indexOf('ENDHDR\n') + 7;
  const head = buf.subarray(0, end).toString('latin1');
  const w = Number(/WIDTH (\d+)/.exec(head)![1]), h = Number(/HEIGHT (\d+)/.exec(head)![1]);
  return { w, h, a: (x, y) => buf[end + (y * w + x) * 4 + 3] };
}

const tmp = mkdtempSync(join(tmpdir(), 'heads-'));
const out: Record<string, [number, number, number, number]> = {};
const r3 = (v: number) => Math.round(v * 1000) / 1000;
try {
  for (const f of readdirSync(DIR).filter((n) => n.endsWith('.webp') && !n.endsWith('-icon.webp')).sort()) {
    const id = f.slice(0, -5);
    const pam = join(tmp, `${id}.pam`);
    execFileSync('dwebp', [join(DIR, f), '-pam', '-o', pam], { stdio: 'ignore' });
    const { w, h, a } = readPam(pam);
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
    out[id] = [r3(((er.l + er.r) / 2 - bx) / bw), r3(hy / bh), r3(eye / bh), r3(ws / bw)];
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(`wrote ${OUT}: ${Object.keys(out).length} renders`);
