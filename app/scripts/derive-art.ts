// The art NH has no render for, derived from the official renders (docs/design.md "World"): each building's snowy
// roof for winter and its lit windows for the night, the cedar under snow, and a lamp's glow (drawn). Usage (from app/):
//   npm run assets:derive [-- --only=deco/campsite --force --debug --out=/tmp/x]
// Writes static/art/<key>.webp and their entries in static/art/manifest.json (fetch-assets.ts's shape; their source
// says "derived", so fetch-assets keeps them). Run after assets:fetch. Needs cwebp/dwebp (brew install webp). The
// sources are read from Nookipedia at full resolution and cut exactly as fetch-assets.ts cuts the shipped art (alpha
// box + 2 px), so a variant lays over its original pixel for pixel.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

const APP = join(import.meta.dirname, '..');
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split('=')[1];
const OUT = arg('out') ? join(process.cwd(), arg('out')!) : join(APP, 'static', 'art');
const only = (arg('only') ?? '').split(',').filter(Boolean);
const force = process.argv.includes('--force');
const debug = process.argv.includes('--debug');
const API = 'https://nookipedia.com/w/api.php';
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const TMP = join(tmpdir(), `derive-art-${process.pid}`);
mkdirSync(TMP, { recursive: true });

// ---- image io (no image library: cwebp/dwebp and PAM) -----------------------------------------------------------------
interface Img { w: number; h: number; d: Uint8ClampedArray }
function readImg(src: string): Img {
  const ll = join(TMP, 'r.webp'), pam = join(TMP, 'r.pam');
  if (src.endsWith('.webp')) execFileSync('dwebp', ['-quiet', src, '-pam', '-o', pam]);
  else {
    execFileSync('cwebp', ['-quiet', '-lossless', '-exact', src, '-o', ll]);
    execFileSync('dwebp', ['-quiet', ll, '-pam', '-o', pam]);
  }
  const buf = readFileSync(pam);
  const head = buf.subarray(0, 200).toString('latin1');
  const end = head.indexOf('ENDHDR\n') + 7;
  const w = Number(/WIDTH (\d+)/.exec(head)![1]), h = Number(/HEIGHT (\d+)/.exec(head)![1]);
  return { w, h, d: new Uint8ClampedArray(buf.subarray(end, end + w * h * 4)) };
}
function writeImg(img: Img, dest: string, q = 86): number {
  const pam = join(TMP, 'w.pam');
  writeFileSync(pam, Buffer.concat([Buffer.from(`P7\nWIDTH ${img.w}\nHEIGHT ${img.h}\nDEPTH 4\nMAXVAL 255\nTUPLTYPE RGB_ALPHA\nENDHDR\n`, 'latin1'), Buffer.from(img.d.buffer, img.d.byteOffset, img.d.byteLength)]));
  mkdirSync(dirname(dest), { recursive: true });
  execFileSync('cwebp', ['-quiet', '-q', String(q), '-alpha_q', '100', '-m', '6', '-exact', pam, '-o', dest]);
  return readFileSync(dest).length;
}
const crop = (a: Img, [x0, y0, w, h]: number[]): Img => {
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) d.set(a.d.subarray(((y + y0) * a.w + x0) * 4, ((y + y0) * a.w + x0 + w) * 4), y * w * 4);
  return { w, h, d };
};
/** The alpha box + 2 px, as fetch-assets.ts trims. */
function alphaBox(a: Img): number[] {
  let x0 = a.w, y0 = a.h, x1 = -1, y1 = -1;
  for (let y = 0; y < a.h; y++) for (let x = 0; x < a.w; x++) if (a.d[(y * a.w + x) * 4 + 3] > 8) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return [0, 0, a.w, a.h];
  x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(a.w - 1, x1 + 2); y1 = Math.min(a.h - 1, y1 + 2);
  return [x0, y0, x1 - x0 + 1, y1 - y0 + 1];
}
/** Area-average downscale (the derived art ships at the source's size; flowers and icons may shrink). */
function resize(a: Img, w: number, h: number): Img {
  if (w === a.w && h === a.h) return a;
  const d = new Uint8ClampedArray(w * h * 4), sx = a.w / w, sy = a.h / h;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = 0, g = 0, b = 0, al = 0, n = 0;
    for (let yy = Math.floor(y * sy); yy < Math.min(a.h, Math.ceil((y + 1) * sy)); yy++) for (let xx = Math.floor(x * sx); xx < Math.min(a.w, Math.ceil((x + 1) * sx)); xx++) {
      const i = (yy * a.w + xx) * 4, A = a.d[i + 3];
      r += a.d[i] * A; g += a.d[i + 1] * A; b += a.d[i + 2] * A; al += A; n++;
    }
    const o = (y * w + x) * 4;
    if (al) { d[o] = r / al; d[o + 1] = g / al; d[o + 2] = b / al; }
    d[o + 3] = al / n;
  }
  return { w, h, d };
}

// ---- nookipedia -------------------------------------------------------------------------------------------------------
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function get(url: string): Promise<Response> {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(120_000) });
      if (r.ok) return r;
      if (r.status < 500 && r.status !== 429) throw new Error(`${r.status} ${url}`);
    } catch (e) { if (i >= 4) throw e; }
    await sleep(1500 * i);
  }
}
const srcCache = join(tmpdir(), 'derive-art-sources');
/** An official file at full resolution (cached across runs). */
async function source(title: string): Promise<string> {
  mkdirSync(srcCache, { recursive: true });
  const file = join(srcCache, title.replace(/[^\w.()-]/g, '_'));
  if (existsSync(file)) return file;
  const q = await (await get(`${API}?action=query&format=json&prop=imageinfo&iiprop=url&titles=${encodeURIComponent('File:' + title)}`)).json() as { query: { pages: Record<string, { imageinfo?: { url: string }[] }> } };
  const url = Object.values(q.query.pages)[0].imageinfo?.[0].url;
  if (!url) throw new Error(`no such file: ${title}`);
  writeFileSync(file, Buffer.from(await (await get(url)).arrayBuffer()));
  await sleep(400);
  return file;
}
/** The official art cut as the shipped key is (fetch-assets' trim and fit). */
async function official(title: string, max: number): Promise<Img> {
  const a = readImg(await source(title));
  const c = crop(a, alphaBox(a));
  const s = Math.min(1, max / Math.max(c.w, c.h));
  return resize(c, Math.round(c.w * s), Math.round(c.h * s));
}

// ---- masks ------------------------------------------------------------------------------------------------------------
type Mask = Float32Array;
const hsv = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), c = mx - mn;
  let h = 0;
  if (c) h = mx === r ? ((g - b) / c) % 6 : mx === g ? (b - r) / c + 2 : (r - g) / c + 4;
  return [(h * 60 + 360) % 360, mx ? c / mx : 0, mx];
};
interface Pick { seeds: [number, number][]; hue?: [number, number]; sat?: [number, number]; val?: [number, number]; box?: [number, number, number, number] }
/** The connected pixels from the seeds whose colour falls in the ranges (hue may wrap: [340, 20]). */
function region(a: Img, p: Pick): Mask {
  const m = new Float32Array(a.w * a.h);
  const ok = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= a.w || y >= a.h) return false;
    if (p.box && (x < p.box[0] || y < p.box[1] || x > p.box[2] || y > p.box[3])) return false;
    const i = (y * a.w + x) * 4;
    if (a.d[i + 3] < 100) return false;
    const [h, s, v] = hsv(a.d[i], a.d[i + 1], a.d[i + 2]);
    if (p.hue && !(p.hue[0] <= p.hue[1] ? h >= p.hue[0] && h <= p.hue[1] : h >= p.hue[0] || h <= p.hue[1])) return false;
    if (p.sat && (s < p.sat[0] || s > p.sat[1])) return false;
    if (p.val && (v < p.val[0] || v > p.val[1])) return false;
    return true;
  };
  const st: number[] = [];
  for (const [x, y] of p.seeds) if (ok(x, y)) st.push(y * a.w + x);
  while (st.length) {
    const k = st.pop()!;
    if (m[k]) continue;
    m[k] = 1;
    const x = k % a.w, y = (k / a.w) | 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (ok(x + dx, y + dy) && !m[(y + dy) * a.w + x + dx]) st.push((y + dy) * a.w + x + dx);
  }
  // close the pinholes (anti-aliased seams between shingles)
  for (let pass = 0; pass < 2; pass++) for (let y = 1; y < a.h - 1; y++) for (let x = 1; x < a.w - 1; x++) {
    const k = y * a.w + x;
    if (!m[k] && m[k - 1] + m[k + 1] + m[k - a.w] + m[k + a.w] >= 3) m[k] = 1;
  }
  return m;
}
function blur(m: Mask, w: number, h: number, r: number): Mask {
  const out = new Float32Array(m.length), tmp = new Float32Array(m.length);
  const k: number[] = [];
  const R = Math.ceil(r * 2.5);
  for (let i = -R; i <= R; i++) k.push(Math.exp(-(i * i) / (2 * r * r)));
  const ks = k.reduce((a, b) => a + b, 0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -R; i <= R; i++) s += k[i + R] * m[y * w + Math.min(w - 1, Math.max(0, x + i))]; tmp[y * w + x] = s / ks; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0; for (let i = -R; i <= R; i++) s += k[i + R] * tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x]; out[y * w + x] = s / ks; }
  return out;
}
const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
/** A seeded hash in 0..1. */
const hash = (n: number) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
/** Smooth 1D value noise, period ~`cell` px. */
const noise1 = (x: number, cell: number, seed: number) => { const t = x / cell, i = Math.floor(t), f = t - i, u = f * f * (3 - 2 * f); return hash(i * 31 + seed) * (1 - u) + hash((i + 1) * 31 + seed) * u; };

// ---- snow -------------------------------------------------------------------------------------------------------------
/** One snowy surface: the region it lies on, how deep it covers it from each top edge (px; Infinity = all of it), how
 *  far it piles above the edge into the air, and its drips over the region's lower edge. */
interface Snow extends Pick { cover?: number; pile?: number; drip?: number; lip?: boolean }
function addSnow(a: Img, parts: Snow[], seed: number): Img {
  const { w, h } = a;
  const S = new Float32Array(w * h);   // snow coverage (binary, then softened)
  const lipShade = new Float32Array(w * h);
  for (const [n, p] of parts.entries()) {
    const m = region(a, p);
    const cover = p.cover ?? Infinity, pile = p.pile ?? 2, drip = p.drip ?? 0;
    for (let x = 0; x < w; x++) {
      // per column: each run of the region from its top edge
      let y = 0;
      while (y < h) {
        if (!m[y * w + x]) { y++; continue; }
        const top = y;
        while (y < h && m[y * w + x]) y++;
        const bot = y; // exclusive
        const depth = cover + 1.2 * (noise1(x, 9, seed + n * 7) - 0.5) * Math.min(cover, 6);
        const end = Math.min(bot, top + Math.max(1, Math.round(depth)));
        for (let yy = top; yy < end; yy++) S[yy * w + x] = 1;
        // the pile above the edge: only into the air (never over a wall the surface meets)
        const ph = Math.round(pile * (0.65 + 0.7 * noise1(x, 11, seed + n * 13)));
        for (let k = 1; k <= ph && top - k >= 0; k++) { if (a.d[((top - k) * w + x) * 4 + 3] > 120 && !m[(top - k) * w + x]) break; S[(top - k) * w + x] = 1; }
        // drips: rounded lumps hanging over the lower edge, where the cover reached it
        if (end === bot && drip > 0) {
          const lump = Math.max(0, Math.sin((x + hash(seed + n) * 50) / 3.1) * 0.5 + 0.5) ** 0.6;
          const dh = Math.round(drip * (0.35 + 0.65 * lump * noise1(x, 5, seed + n * 17)));
          for (let k = 0; k < dh && bot + k < h; k++) S[(bot + k) * w + x] = 1;
          for (let k = dh; k < dh + 3 && bot + k < h; k++) lipShade[(bot + k) * w + x] = Math.max(lipShade[(bot + k) * w + x], 1 - (k - dh) / 3);
        }
      }
    }
  }
  const soft = blur(S, w, h, 0.9);
  const out = new Uint8ClampedArray(a.d);
  // the snow's own depth from its top edge (for its shading): distance down to the last air/non-snow pixel above
  for (let x = 0; x < w; x++) {
    let fromTop = 0;
    for (let y = 0; y < h; y++) {
      const k = y * w + x, i = k * 4;
      fromTop = S[k] ? fromTop + 1 : 0;
      // its depth to the bottom edge of the snow
      let toBot = 0;
      if (S[k]) while (y + toBot + 1 < h && S[(y + toBot + 1) * w + x] && toBot < 8) toBot++;
      const al = smooth(0.3, 0.7, soft[k]);
      if (al > 0) {
        const o = [a.d[i], a.d[i + 1], a.d[i + 2]];
        const lum = (0.299 * o[0] + 0.587 * o[1] + 0.114 * o[2]) / 255;
        // white, cool in the lip's underside, a whisper of the surface beneath (its rows read through)
        let r = 250, g = 252, b = 255;
        const under = smooth(3.5, 0.0, toBot);                 // the lower rim of the snow
        r -= 44 * under; g -= 30 * under; b -= 10 * under;
        const crest = smooth(2.5, 0.0, fromTop - 1);           // the lit top edge
        r += 5 * crest; g += 3 * crest;
        const through = a.d[i + 3] > 100 ? (0.5 - lum) * 26 : 0;
        r -= through; g -= through; b -= through * 0.5;
        // left lit, right a touch cooler (light from the upper left)
        const lr = (x / w - 0.5) * 10;
        r -= lr; g -= lr * 0.7;
        const na = Math.max(a.d[i + 3] / 255, al);
        out[i] = o[0] * (1 - al) + r * al; out[i + 1] = o[1] * (1 - al) + g * al; out[i + 2] = o[2] * (1 - al) + b * al;
        if (a.d[i + 3] < 8) { out[i] = r; out[i + 1] = g; out[i + 2] = b; }
        out[i + 3] = na * 255;
      } else if (lipShade[k] > 0 && a.d[i + 3] > 0) {
        const f = 1 - 0.2 * lipShade[k];
        out[i] = a.d[i] * f; out[i + 1] = a.d[i + 1] * f; out[i + 2] = Math.min(255, a.d[i + 2] * (f + 0.06));
      }
    }
  }
  return { w, h, d: out };
}

// ---- lit windows ------------------------------------------------------------------------------------------------------
/** A window or doorway that glows at night: the dark (or glass-coloured) pixels inside the box. */
interface Lit extends Pick { glow?: number }
function litOverlay(a: Img, parts: Lit[]): Img {
  const { w, h } = a;
  const L = new Float32Array(w * h);
  for (const p of parts) { const m = region(a, p); for (let k = 0; k < m.length; k++) if (m[k]) L[k] = 1; }
  const halo = blur(L, w, h, 5), core = blur(L, w, h, 0.6);
  const d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const k = y * w + x, i = k * 4;
    const lum = (0.299 * a.d[i] + 0.587 * a.d[i + 1] + 0.114 * a.d[i + 2]) / 255;
    // the pane: warm lamplight, brighter where the glass was lighter (the shapes behind it still read), a little
    // brighter at the top
    const c = smooth(0.2, 0.8, core[k]) * (a.d[i + 3] / 255);
    const t = Math.min(1, lum * 1.6 + 0.15);
    const pr = 255, pg = 196 + 50 * t, pb = 92 + 110 * t * t;
    // the halo spills onto the wall around it
    const g = Math.min(1, halo[k] * 1.6) * 0.55 * (a.d[i + 3] > 8 ? 1 : 0.6);
    const A = Math.max(c * 0.96, g * (1 - c));
    if (A <= 0.003) continue;
    const mixC = c * 0.96 / A;
    d[i] = pr * mixC + 255 * (1 - mixC); d[i + 1] = pg * mixC + 186 * (1 - mixC); d[i + 2] = pb * mixC + 90 * (1 - mixC);
    d[i + 3] = A * 255;
  }
  return { w, h, d };
}
/** A lamp's soft glow (drawn by us: a warm radial light with a hot core), for streetlamps and lanterns at night. */
function lampGlow(size: number): Img {
  const d = new Uint8ClampedArray(size * size * 4), c = (size - 1) / 2;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const r = Math.hypot(x - c, y - c) / c, i = (y * size + x) * 4;
    const a = Math.max(0, 1 - r) ** 2.2 * 0.75 + smooth(0.25, 0.0, r) * 0.25;
    d[i] = 255; d[i + 1] = 214 + 30 * smooth(0.4, 0.0, r); d[i + 2] = 130 + 90 * smooth(0.3, 0.0, r); d[i + 3] = Math.min(255, a * 255);
  }
  return { w: size, h: size, d };
}

// ---- the derived art's recipes (pixel coordinates in the shipped, trimmed art) ----------------------------------------
const BUILDING_SRC: Record<string, string> = { campsite: 'Campsite_NH_Map_Icon.png' };
const ART_KEY: Record<string, string> = { campsite: 'campsite' };
const SNOW: Record<string, Snow[]> = {
  campsite: [
    { seeds: [[150, 8], [150, 20], [90, 50], [210, 50]], hue: [20, 62], sat: [0.0, 0.85], val: [0.6, 1], box: [30, 0, 255, 150], cover: 26, pile: 3 },
    { seeds: [[17, 20], [266, 18]], hue: [0, 40], val: [0.2, 0.5], box: [10, 10, 275, 40], cover: 2, pile: 2 },
    { seeds: [[230, 113], [215, 115]], hue: [0, 30], val: [0.3, 0.75], box: [205, 108, 252, 125], cover: 3, pile: 2 }
  ]
};
const LIT: Record<string, Lit[]> = {
  campsite: [{ seeds: [[30, 65], [30, 55], [30, 80]], hue: [0, 50], sat: [0.3, 1], val: [0.6, 1], box: [18, 38, 46, 92] }]
};
const CEDAR_SNOW: Snow[] = [
  { seeds: [[107, 30], [107, 100], [107, 160], [107, 220], [107, 280], [60, 300], [150, 300], [80, 240], [135, 240], [70, 180], [145, 180]], hue: [100, 190], sat: [0.15, 1], val: [0.36, 1], box: [0, 0, 215, 345], cover: 6, pile: 1, drip: 2 }
];

interface Entry { path: string; w: number; h: number; source: string }
async function main() {
  const manifestFile = join(OUT, 'manifest.json');
  const man: { version: number; files: Record<string, Entry> } = existsSync(manifestFile) ? JSON.parse(readFileSync(manifestFile, 'utf8')) : { version: 1, files: {} };
  const want = (k: string) => (!only.length || only.some((o) => k.startsWith(o))) && (force || only.length > 0 || !man.files[k] || !existsSync(join(OUT, man.files[k].path)));
  const sizes: [string, number, number, number][] = [];
  const put = (key: string, img: Img, title: string, q = 86) => {
    const n = writeImg(img, join(OUT, `${key}.webp`), q);
    man.files[key] = { path: `${key}.webp`, w: img.w, h: img.h, source: title.startsWith('derived') ? title : `https://nookipedia.com/wiki/File:${title}` };
    sizes.push([key, img.w, img.h, n]);
    console.log(`  ✓ ${key} ${img.w}×${img.h} ${(n / 1024).toFixed(1)} KB`);
  };
  for (const [id, title] of Object.entries(BUILDING_SRC)) {
    const k = `deco/${ART_KEY[id]}`;
    if (!want(`${k}-winter`) && !want(`${k}-lit`)) continue;
    const a = await official(title, 320);
    if (want(`${k}-winter`)) put(`${k}-winter`, addSnow(a, SNOW[id], id.length * 97), `derived from https://nookipedia.com/wiki/File:${title} (snow: scripts/derive-art.ts)`);
    if (want(`${k}-lit`)) put(`${k}-lit`, litOverlay(a, LIT[id]), `derived from https://nookipedia.com/wiki/File:${title} (lit windows: scripts/derive-art.ts)`, 82);
    if (debug) {
      const dbg = { ...a, d: new Uint8ClampedArray(a.d) };
      for (const p of [...SNOW[id], ...LIT[id]]) { const m = region(a, p); for (let i = 0; i < m.length; i++) if (m[i]) { dbg.d[i * 4] = 255; dbg.d[i * 4 + 1] *= 0.4; dbg.d[i * 4 + 2] *= 0.4; } }
      writeImg(dbg, join(OUT, 'debug', `${ART_KEY[id]}-masks.webp`), 90);
    }
  }
  if (want('trees/cedar-winter')) put('trees/cedar-winter', addSnow(await official('Cedar_Tree_NH.png', 420), CEDAR_SNOW, 7), 'derived from https://nookipedia.com/wiki/File:Cedar_Tree_NH.png (snow: scripts/derive-art.ts)');
  if (want('deco/lamp-glow')) put('deco/lamp-glow', lampGlow(64), 'derived (drawn: scripts/derive-art.ts)', 80);
  man.files = Object.fromEntries(Object.entries(man.files).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(manifestFile, JSON.stringify(man, null, 2) + '\n');
  rmSync(TMP, { recursive: true, force: true });
  const total = Object.values(man.files).reduce((s, e) => s + readFileSync(join(OUT, e.path)).length, 0);
  console.log(`${Object.keys(man.files).length} files, ${(total / 1024).toFixed(0)} KB in ${OUT}`);
}
await main();
