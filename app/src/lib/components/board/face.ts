// The bulletin board's face (docs/board.md "Posts"): the cork and its notes drawn on a canvas, the very canvas the 3D
// board's face shows (a CanvasTexture: face3d.ts) and the 2D sheet shows as is. Four notes a page in a 2 × 2 grid, the
// newest first, each NH's pinned paper: the author's villager head and name, the date, the text. Text is only ever
// drawn with fillText (never HTML). Pure but for the canvas it's handed.
import type { Post } from '#lib/contract/board.ts';
import type { Who } from '#lib/types.ts';
import { fnv1a as hash } from '#lib/random.ts';

/** The canvas (px): the face's 13.6 × 10 model units. */
export const FACE_W = 1360;
export const FACE_H = 1000;
export const PER_PAGE = 4;
/** The note being written, on the face as it's typed (BoardView's draft). */
export const DRAFT_ID = 'draft';
const PAD = 40, GAP = 36;
const NOTE_W = (FACE_W - 2 * PAD - GAP) / 2, NOTE_H = (FACE_H - 2 * PAD - GAP) / 2;
const FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", "Hiragino Sans", ui-rounded, system-ui, sans-serif';
/** NH's papers, and the pins in each author's colour (the app's yuzu, mint and lilac). */
const PAPER = ['#FFFDF2', '#FFF3C2', '#E1F4EA', '#FFE6E0', '#E6EEFF'];
const PIN: Record<Who, string> = { A: '#F2B632', B: '#4FBF94', G: '#A98BE0' };
const INK = '#5A4632', SOFT = '#9A8466';

/** The note `i` of a page (0…3): its box on the canvas (px). */
export function noteRect(i: number): { x: number; y: number; w: number; h: number } {
  return { x: PAD + (i % 2) * (NOTE_W + GAP), y: PAD + Math.floor(i / 2) * (NOTE_H + GAP), w: NOTE_W, h: NOTE_H };
}


/** Characters a line never starts with (Japanese kinsoku, the common ones). */
const NO_START = new Set([...'、。，．・：；？！ー」』）】〉》〕]})!?.,:;…‥ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮ']);

/** `text` broken into lines of at most `w` px (by character, Japanese style; a Latin word kept whole when it fits). */
function wrap(ctx: Pick<CanvasRenderingContext2D, 'measureText'>, text: string, w: number): string[] {
  const out: string[] = [];
  for (const para of text.split('\n')) {
    let line = '';
    const cps = Array.from(para);
    for (let i = 0; i < cps.length; i++) {
      const ch = cps[i], next = line + ch;
      if (!line || ctx.measureText(next).width <= w || NO_START.has(ch)) {
        line = next;
        continue;
      }
      // a Latin word: break at its start when the line has room before it
      const sp = line.lastIndexOf(' ');
      if (/\w/.test(ch) && sp > 0 && /\w$/.test(line)) {
        out.push(line.slice(0, sp));
        line = line.slice(sp + 1) + ch;
      } else {
        out.push(line);
        line = ch;
      }
    }
    out.push(line);
  }
  return out;
}

const waiting = new WeakMap<HTMLImageElement, () => void>();
const images = new Map<string, HTMLImageElement>();
/** An image, once it's loaded (null until then; `ready` runs when it is). */
function image(url: string | null, ready: () => void): HTMLImageElement | null {
  if (!url || typeof Image === 'undefined') return null;
  let im = images.get(url);
  if (!im) {
    const one = new Image();
    im = one;
    one.decoding = 'async';
    // who waits for it: the last redraw's only (each draw passes a new one; a listener each, an icon that never loads
    // kept every draw's), told once on its load, let go of on an error too
    one.onload = () => (waiting.get(one)?.(), waiting.delete(one));
    one.onerror = () => waiting.delete(one);
    one.src = url;
    images.set(url, one);
  }
  if (im.complete && im.naturalWidth) return im;
  waiting.set(im, ready);
  return null;
}

interface FaceOpts {
  /** The page's posts (≤ PER_PAGE). */
  posts: readonly Post[];
  author(who: Who): { name: string; icon: string | null };
  /** A post's date as shown (`11/2`). */
  date(p: Post): string;
  /** What an empty board says. */
  empty: string;
  /** The note picked (its id), outlined. */
  selected?: string | null;
  /** An image came in: draw again. */
  redraw(): void;
}

/** The cork (seeded speckles: the same every time). */
function cork(c: CanvasRenderingContext2D) {
  const g = c.createLinearGradient(0, 0, 0, FACE_H);
  g.addColorStop(0, '#C99A5E');
  g.addColorStop(1, '#B98950');
  c.fillStyle = g;
  c.fillRect(0, 0, FACE_W, FACE_H);
  let s = 7;
  const r = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < 2600; i++) {
    c.fillStyle = r() < 0.5 ? 'rgba(120, 78, 36, .22)' : 'rgba(236, 196, 140, .25)';
    c.beginPath();
    c.arc(r() * FACE_W, r() * FACE_H, 1.5 + r() * 4, 0, Math.PI * 2);
    c.fill();
  }
}

function round(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rr: number) {
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function note(c: CanvasRenderingContext2D, i: number, p: Post, o: FaceOpts) {
  const r = noteRect(i), h = hash(p.id), tilt = (((h % 1000) / 1000) - 0.5) * 0.045;
  const sel = o.selected === p.id;
  c.save();
  c.translate(r.x + r.w / 2, r.y + r.h / 2);
  c.rotate(tilt);
  c.translate(-r.w / 2, -r.h / 2);
  // the paper, its shadow on the cork
  c.shadowColor = 'rgba(60, 36, 12, .35)';
  c.shadowBlur = 14;
  c.shadowOffsetY = 6;
  c.fillStyle = PAPER[h % PAPER.length];
  round(c, 0, 0, r.w, r.h, 10);
  c.fill();
  c.shadowColor = 'transparent';
  if (sel) {
    c.strokeStyle = '#F08A3C';
    c.lineWidth = 8;
    round(c, 4, 4, r.w - 8, r.h - 8, 8);
    c.stroke();
  }
  // the head and the name, the date
  const a = o.author(p.who), icon = image(a.icon, o.redraw);
  const ix = 30, iy = 30, is = 84;
  c.fillStyle = PIN[p.who];
  c.globalAlpha = 0.35;
  c.beginPath();
  c.arc(ix + is / 2, iy + is / 2, is / 2, 0, Math.PI * 2);
  c.fill();
  c.globalAlpha = 1;
  if (icon) {
    c.save();
    c.beginPath();
    c.arc(ix + is / 2, iy + is / 2, is / 2, 0, Math.PI * 2);
    c.clip();
    c.drawImage(icon, ix + 4, iy + 4, is - 8, is - 8);
    c.restore();
  }
  c.fillStyle = INK;
  c.textBaseline = 'middle';
  c.font = `700 42px ${FONT}`;
  const date = o.date(p);
  c.font = `500 34px ${FONT}`;
  const dw = c.measureText(date).width;
  c.fillStyle = SOFT;
  c.fillText(date, r.w - 30 - dw, iy + is / 2);
  c.font = `700 42px ${FONT}`;
  c.fillStyle = INK;
  let name = a.name;
  const nmax = r.w - (ix + is + 18) - dw - 50;
  while (name && c.measureText(name).width > nmax) name = Array.from(name).slice(0, -1).join('');
  c.fillText(name === a.name ? name : `${name}…`, ix + is + 18, iy + is / 2);
  // a dashed line under the header
  c.strokeStyle = 'rgba(154, 132, 102, .45)';
  c.setLineDash([10, 10]);
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(28, iy + is + 18);
  c.lineTo(r.w - 28, iy + is + 18);
  c.stroke();
  c.setLineDash([]);
  // the text: as big as fits (52 … 36 px), the rest cut with …
  const top = iy + is + 36, tw = r.w - 60, th = r.h - top - 22;
  let size = 52, lines: string[] = [];
  for (; size >= 36; size -= 2) {
    c.font = `500 ${size}px ${FONT}`;
    lines = wrap(c, p.t, tw);
    if (lines.length * size * 1.28 <= th) break;
  }
  size = Math.max(size, 36);
  c.font = `500 ${size}px ${FONT}`;
  const fit = Math.max(1, Math.floor(th / (size * 1.28)));
  if (lines.length > fit) {
    lines = lines.slice(0, fit);
    let last = lines[fit - 1];
    while (last && c.measureText(`${last}…`).width > tw) last = Array.from(last).slice(0, -1).join('');
    lines[fit - 1] = `${last}…`;
  }
  c.fillStyle = INK;
  c.textBaseline = 'top';
  lines.forEach((l, k) => c.fillText(l, 30, top + k * size * 1.28));
  c.restore();
  // the pin, in its author's colour
  c.save();
  c.translate(r.x + r.w / 2, r.y + 10);
  c.fillStyle = 'rgba(40, 24, 8, .3)';
  c.beginPath();
  c.ellipse(4, 10, 15, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = PIN[p.who];
  c.beginPath();
  c.arc(0, 0, 16, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = 'rgba(255, 255, 255, .6)';
  c.beginPath();
  c.arc(-5, -5, 5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

/** Draw the face: the cork and the page's notes (or, empty, what an empty board says). */
export function drawFace(canvas: HTMLCanvasElement, o: FaceOpts): void {
  const c = canvas.getContext('2d');
  if (!c) return;
  canvas.width = FACE_W;
  canvas.height = FACE_H;
  cork(c);
  if (!o.posts.length) {
    c.fillStyle = 'rgba(255, 253, 242, .9)';
    round(c, FACE_W / 2 - 360, FACE_H / 2 - 110, 720, 220, 14);
    c.fill();
    c.fillStyle = SOFT;
    c.font = `700 48px ${FONT}`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(o.empty, FACE_W / 2, FACE_H / 2);
    c.textAlign = 'start';
    return;
  }
  o.posts.slice(0, PER_PAGE).forEach((p, i) => note(c, i, p, o));
}

/** Make sure the font is in before drawing (the page's own glyphs; a user's kanji outside the subset fall back). */
export function fontReady(text: string): Promise<unknown> {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.all([document.fonts.load(`500 40px "Zen Maru Gothic"`, text || 'あ'), document.fonts.load(`700 40px "Zen Maru Gothic"`, text || 'あ')]).catch(() => {});
}
