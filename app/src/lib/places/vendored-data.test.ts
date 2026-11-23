// The vendored 保存した場所 tree (static/places/, scripts/places-details.ts + places-pack.py) as a CI guard: absent
// whole before the first scrape (a clean checkout ships nothing), else valid whole — every file the index names
// present and content-hashed, every shard entry past vendored.ts's guards and the scraper's own rules (id-only: no
// Google names/addresses/coordinates, no reviews/authors/HTML anywhere; ≤3 cells in the 2×3 grid and all in one
// sheet — E1's no-span rule), every sheet's webp dims the grid's exact multiples and its bytes under the cap.
// validateVendoredTree is the same check `node scripts/places-details.ts check` runs (the vitest block registers
// only under the runner, so the script can import this file plain).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { shardOf, vendoredIndexOf, vendoredShardOf } from './vendored.ts';

const APP = join(import.meta.dirname, '..', '..', '..');
const STATIC_PLACES = join(APP, 'static', 'places');
/** The staging dir (scripts/places-details.ts fetch) — gitignored raw Google data; never under static/. */
const STAGING = join(APP, 'scripts', 'data', 'places-raw');

const SHARDS = 35;
const CARD_W = 600, CARD_H = 338, COLS = 2, ROWS = 3;
const SHEET_CAP = 600 * 1024;
/** Keys Google's payload holds that must never be vendored (compared lower case, at any depth). */
const BANNED = new Set(['reviews', 'author', 'authorattribution', 'profilephoto', 'html', 'embed']);

export interface VendoredReport { fails: string[]; places: number; files: number; bytes: number }

const sha8 = (b: Buffer): string => createHash('sha256').update(b).digest('hex').slice(0, 8);

/** A webp's dims from its RIFF header (VP8 lossy, VP8L lossless, VP8X extended), or null when unreadable. */
export function webpDims(buf: Buffer): { w: number; h: number } | null {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fourcc = buf.toString('ascii', 12, 16);
  if (fourcc === 'VP8 ') {
    if (buf[23] !== 0x9d || buf[24] !== 0x01 || buf[25] !== 0x2a) return null; // the frame's start code
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    if (buf[20] !== 0x2f) return null; // the signature byte
    const w = 1 + (((buf[22] & 0x3f) << 8) | buf[21]);
    const h = 1 + (((buf[24] & 0x0f) << 10) | (buf[23] << 2) | ((buf[22] & 0xc0) >> 6));
    return { w, h };
  }
  if (fourcc === 'VP8X') return { w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) };
  return null;
}

/** Banned keys at any depth of a parsed shard (paths of the hits, for the failure message). */
function bannedIn(v: unknown, path: string, hits: string[]): void {
  if (Array.isArray(v)) v.forEach((x, i) => bannedIn(x, `${path}[${i}]`, hits));
  else if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) {
      if (BANNED.has(k.toLowerCase())) hits.push(`${path}.${k}`);
      bannedIn(x, `${path}.${k}`, hits);
    }
  }
}

/** static/places whole-checked: the failures (empty: valid), with the tree's counts for the caller's summary. An
 *  absent index.json is valid only when the whole dir is absent (the pre-scrape state). */
export function validateVendoredTree(root: string): VendoredReport {
  const fails: string[] = [];
  const out = { fails, places: 0, files: 0, bytes: 0 };
  if (STAGING.includes(`${join(APP, 'static')}/`)) fails.push('the staging dir (places-raw) is under app/static');
  if (existsSync(root)) {
    for (const f of readdirSync(root, { recursive: true })) {
      if (String(f).includes('places-raw')) fails.push(`places-raw under static/places: ${String(f)}`);
    }
  }
  if (!existsSync(join(root, 'index.json'))) {
    if (existsSync(root)) fails.push('static/places exists without its index.json (a partial tree)');
    return out;
  }
  const fileOf = (sub: string, name: string): Buffer | null => {
    const p = join(root, sub, name);
    if (!existsSync(p)) {
      fails.push(`${sub}/${name}: named by the index, missing`);
      return null;
    }
    out.files++;
    const b = readFileSync(p);
    out.bytes += b.length;
    return b;
  };
  const ix = vendoredIndexOf(JSON.parse(readFileSync(join(root, 'index.json'), 'utf8')));
  if (!ix) {
    fails.push('index.json: refused by vendoredIndexOf');
    return out;
  }
  out.files++;
  out.bytes += statSync(join(root, 'index.json')).size;
  if (ix.d.length !== SHARDS) fails.push(`index.json: ${ix.d.length} shards, the packer writes ${SHARDS}`);
  /** A name's check: `<prefix><ix>.<hash8>.<ext>` of its class, the hash the file's own. */
  const nameOk = (name: string, i: number, cls: 'shard' | 'c' | 't', bytes: Buffer): void => {
    const want = cls === 'shard' ? `${i}.${sha8(bytes)}.json` : `${cls}${i}.${sha8(bytes)}.webp`;
    if (name !== want) fails.push(`${name}: should be ${want} (position and content hash)`);
  };
  // the shards: every entry guarded, on its own shard (shardOf), free of Google's payload keys
  let places = 0;
  const cells: [number, number, number][] = [];
  for (let i = 0; i < ix.d.length; i++) {
    const b = fileOf('d', ix.d[i]);
    if (!b) continue;
    nameOk(ix.d[i], i, 'shard', b);
    let json: unknown;
    try {
      json = JSON.parse(b.toString('utf8'));
    } catch {
      fails.push(`d/${ix.d[i]}: not JSON`);
      continue;
    }
    const hits: string[] = [];
    bannedIn(json, ix.d[i], hits);
    for (const h of hits) fails.push(`${h}: a Google payload key, never vendored`);
    const shard = vendoredShardOf(json, ix.grid);
    if (!shard) {
      fails.push(`d/${ix.d[i]}: refused by vendoredShardOf`);
      continue;
    }
    for (const [id, e] of Object.entries(shard)) {
      places++;
      if (shardOf(id, ix.d.length) !== i) fails.push(`${id}: on shard ${i}, its own is ${shardOf(id, ix.d.length)}`);
      if ((e as { t?: unknown }).t !== undefined) fails.push(`${id}: a thumb cell (the format has none since the 2×3 pack)`);
      const pics = e.pics ?? [];
      if (new Set(pics.map((c) => c[0])).size > 1) fails.push(`${id}: its photos span sheets (a place's block is one sheet — E1)`);
      for (const c of pics) {
        if (c[0] >= ix.sheets.length) fails.push(`${id}: pics cell in sheet ${c[0]}, only ${ix.sheets.length} sheets`);
        else cells.push(c);
      }
    }
  }
  out.places = places;
  if (places !== ix.n) fails.push(`index.json: n ${ix.n}, the shards hold ${places}`);
  // the sheets: dims the grid's exact multiples (a partial sheet its used rows), bytes under the cap; the exact
  // per-cell (70 KB) and per-place (210 KB) caps are the packer's, not estimable here
  const dims: { w: number; h: number }[] = [];
  for (let i = 0; i < ix.sheets.length; i++) {
    const b = fileOf('img', ix.sheets[i]);
    if (!b) continue;
    nameOk(ix.sheets[i], i, 'c', b);
    if (b.length > SHEET_CAP) fails.push(`img/${ix.sheets[i]}: ${(b.length / 1024).toFixed(1)} KB (≤ ${SHEET_CAP / 1024} KB)`);
    const d = webpDims(b);
    if (!d) {
      fails.push(`img/${ix.sheets[i]}: no readable webp dims`);
      continue;
    }
    dims[i] = d;
    if (d.w % CARD_W !== 0 || d.h % CARD_H !== 0 || d.w > COLS * CARD_W || d.h > ROWS * CARD_H) {
      fails.push(`img/${ix.sheets[i]}: ${d.w}×${d.h}, not the ${COLS}×${ROWS} grid's multiples of ${CARD_W}×${CARD_H}`);
    }
  }
  // every referenced cell inside its sheet's real dims
  for (const [s, col, row] of cells) {
    const d = dims[s];
    if (d && ((col + 1) * CARD_W > d.w || (row + 1) * CARD_H > d.h)) fails.push(`img/${ix.sheets[s]}: a cell [${col},${row}] outside its ${d.w}×${d.h}`);
  }
  return out;
}

if (process.env.VITEST) {
  describe('the vendored places tree (static/places)', () => {
    it('is absent whole before the first scrape, else valid whole', () => {
      expect(validateVendoredTree(STATIC_PLACES).fails).toEqual([]);
    });
  });

  describe('webpDims', () => {
    const riff = (fourcc: string, payload: (b: Buffer) => void): Buffer => {
      const b = Buffer.alloc(40);
      b.write('RIFF', 0, 'ascii');
      b.write('WEBP', 8, 'ascii');
      b.write(fourcc, 12, 'ascii');
      payload(b);
      return b;
    };
    it('reads a VP8 (lossy) header', () => {
      const b = riff('VP8 ', (x) => {
        x[23] = 0x9d;
        x[24] = 0x01;
        x[25] = 0x2a; // the start code, in byte order
        x.writeUInt16LE(3200, 26);
        x.writeUInt16LE(1800, 28);
      });
      expect(webpDims(b)).toEqual({ w: 3200, h: 1800 });
    });
    it('reads a VP8L (lossless) header', () => {
      const b = riff('VP8L', (x) => {
        const w = 1920 - 1, h = 960 - 1;
        x[20] = 0x2f;
        x[21] = w & 0xff;
        x[22] = ((w >> 8) & 0x3f) | ((h & 3) << 6);
        x[23] = (h >> 2) & 0xff;
        x[24] = (h >> 10) & 0x0f;
      });
      expect(webpDims(b)).toEqual({ w: 1920, h: 960 });
    });
    it('reads a VP8X (extended) header and refuses non-webp bytes', () => {
      const b = riff('VP8X', (x) => {
        x.writeUIntLE(800 - 1, 24, 3);
        x.writeUIntLE(450 - 1, 27, 3);
      });
      expect(webpDims(b)).toEqual({ w: 800, h: 450 });
      expect(webpDims(Buffer.from('not a webp file at all........'))).toBeNull();
    });
  });
}
