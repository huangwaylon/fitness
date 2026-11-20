// A custom food's picture (マイ食品's 写真, docs/backend.md `food_custom` `img`): a 384×384 JPEG or WebP the phone made
// (app lib/food/photo.ts), kept in the record's `food_img` table and named by the first 128 bits of its SHA-256.
// - `POST /img?id=<id>` (imgRoute): a person's key or the guest's in `Authorization: Bearer`; CORS for our origins;
//   at most IMG_MAX bytes; JPEG or WebP by its magic; IMG_DAY_MAX uploads a role a UTC day (the log object's caps).
//   The record then checks the rest (imgCheck: exactly IMG_PX square, no Exif/XMP/IPTC; the id its bytes' hash; at
//   most IMG_LIVE_MAX a person). Idempotent: an id held is `{ok: true, dup: true}`.
// - `GET /img/<id>`: no key (the id is a capability: unguessable, only in the key-gated record; never logged), the
//   bytes with a year's private immutable cache.
// - The 03:00 backup drops the rows no live custom food names that are older than IMG_GC_MS (imgGc).
// Free of the Workers runtime (test/img.test.ts).
import { bearerOf, corsOf, corsRoute } from './auth.ts';
import { readCapped } from './body.ts';
import type { RelayEvent } from './log.ts';
import type { Who } from '../../app/src/lib/contract/api.ts';
import type { Sql as ImgSql } from './store.ts';
import { CUSTOM_IMG, foodCustomOp } from '../../app/src/lib/contract/food.ts';

export const IMG_MAX = 65_536;
const IMG_PX = 384;
/** A person's pictures kept at most (live or not yet swept), and uploads a role a UTC day (`IMG_DAY_MAX` overrides). */
export const IMG_LIVE_MAX = 100;
export const IMG_DAY_MAX = 30;
/** An unnamed picture is swept only this old (one uploaded before its op synced is named a moment later). */
export const IMG_GC_MS = 3_600_000;

export type ImgType = 'image/jpeg' | 'image/webp';
export type ImgErr = 'unauthorized' | 'bad_request' | 'too_large' | 'bad_type' | 'bad_dims' | 'exif' | 'bad_id' | 'cap' | 'unavailable';

/** The type its magic bytes say (JPEG `FF D8 FF`, WebP `RIFF….WEBP`), or null. */
function imgKind(b: Uint8Array): ImgType | null {
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length > 16 && ascii(b, 0, 4) === 'RIFF' && ascii(b, 8, 4) === 'WEBP') return 'image/webp';
  return null;
}

const ascii = (b: Uint8Array, at: number, n: number): string => String.fromCharCode(...b.subarray(at, at + n));
const u16be = (b: Uint8Array, i: number): number => (b[i] << 8) | b[i + 1];
const u16le = (b: Uint8Array, i: number): number => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number): number => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32le = (b: Uint8Array, i: number): number => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;

/** JPEG's start-of-frame markers (the frame's size): SOF0-3, 5-7, 9-11, 13-15. */
const SOF = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

/** A JPEG's size from its frame header, its segments read up to the scan; `exif` on any APP1 (Exif, XMP) or APP13 (IPTC). */
function jpegDims(b: Uint8Array): { w: number; h: number } | 'exif' | null {
  let i = 2, dims: { w: number; h: number } | null = null;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const m = b[i + 1];
    if (m === 0xff) { i++; continue; }
    if (m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    if (m === 0xd9 || m === 0xda) return dims;
    const len = u16be(b, i + 2);
    if (len < 2 || i + 2 + len > b.length) return null;
    if (m === 0xe1 || m === 0xed) return 'exif';
    if (SOF.has(m) && len >= 7) dims = { h: u16be(b, i + 5), w: u16be(b, i + 7) };
    i += 2 + len;
  }
  return null;
}

/** A WebP's size (VP8X's canvas, else the bitstream's); `exif` on an EXIF or XMP chunk (or VP8X's flags for them);
 *  null for an animation or anything unreadable. */
function webpDims(b: Uint8Array): { w: number; h: number } | 'exif' | null {
  let i = 12, canvas: { w: number; h: number } | null = null, frame: { w: number; h: number } | null = null;
  while (i + 8 <= b.length) {
    const tag = ascii(b, i, 4), n = u32le(b, i + 4), d = i + 8;
    if (d + n > b.length) return null;
    if (tag === 'EXIF' || tag === 'XMP ') return 'exif';
    if (tag === 'ANIM' || tag === 'ANMF') return null;
    if (tag === 'VP8X' && n >= 10) {
      if (b[d] & 0x0c) return 'exif';
      if (b[d] & 0x02) return null;
      canvas = { w: u24le(b, d + 4) + 1, h: u24le(b, d + 7) + 1 };
    }
    if (tag === 'VP8 ' && n >= 10 && b[d + 3] === 0x9d && b[d + 4] === 0x01 && b[d + 5] === 0x2a) frame = { w: u16le(b, d + 6) & 0x3fff, h: u16le(b, d + 8) & 0x3fff };
    if (tag === 'VP8L' && n >= 5 && b[d] === 0x2f) {
      const bits = u32le(b, d + 1);
      frame = { w: (bits & 0x3fff) + 1, h: ((bits >>> 14) & 0x3fff) + 1 };
    }
    i = d + n + (n & 1);
  }
  return frame && (canvas ?? frame);
}

/** Whether the bytes are a picture the record keeps: its type, or why not. */
export function imgCheck(b: Uint8Array): { type: ImgType } | { err: 'bad_type' | 'bad_dims' | 'exif' | 'too_large' } {
  if (b.length > IMG_MAX) return { err: 'too_large' };
  const type = imgKind(b);
  if (!type) return { err: 'bad_type' };
  const d = type === 'image/jpeg' ? jpegDims(b) : webpDims(b);
  if (d === 'exif') return { err: 'exif' };
  if (!d) return { err: 'bad_type' };
  return d.w === IMG_PX && d.h === IMG_PX ? { type } : { err: 'bad_dims' };
}

/** The picture's id: the first 128 bits of its SHA-256, as hex. */
export async function imgId(b: Uint8Array): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', b as Uint8Array<ArrayBuffer>));
  return Array.from(d.subarray(0, 16), (x) => x.toString(16).padStart(2, '0')).join('');
}

const isImgId = (v: unknown): v is string => typeof v === 'string' && CUSTOM_IMG.test(v);

// ---------------------------------------------------------------- the record's table

type ImgRow = { id: string; who: string; at: string; type: string; bytes: ArrayBuffer | Uint8Array };

export const IMG_TABLE = 'CREATE TABLE IF NOT EXISTS food_img (id TEXT NOT NULL PRIMARY KEY, who TEXT NOT NULL, at TEXT NOT NULL, type TEXT NOT NULL, bytes BLOB NOT NULL)';

/** The bytes as their own ArrayBuffer (what Durable Objects' SQLite binds as a BLOB). */
const blob = (b: Uint8Array): ArrayBuffer => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** Keep `who`'s picture `id` (checked: its bytes, its hash, their cap): `dup` when held already. */
export async function imgPut(sql: ImgSql, who: Who, id: string, b: Uint8Array, at: string): Promise<{ ok: true; dup?: true } | { ok: false; error: ImgErr }> {
  const c = imgCheck(b);
  if ('err' in c) return { ok: false, error: c.err };
  if (!isImgId(id) || (await imgId(b)) !== id) return { ok: false, error: 'bad_id' };
  if (sql.exec('SELECT 1 AS x FROM food_img WHERE id = ?', id).toArray().length) return { ok: true, dup: true };
  if (Number(sql.exec<{ n: number }>('SELECT count(*) AS n FROM food_img WHERE who = ?', who).toArray()[0]?.n ?? 0) >= IMG_LIVE_MAX) return { ok: false, error: 'cap' };
  sql.exec('INSERT INTO food_img (id, who, at, type, bytes) VALUES (?, ?, ?, ?, ?)', id, who, at, c.type, blob(b));
  return { ok: true };
}

/** A picture's type and bytes, or null. */
export function imgGet(sql: ImgSql, id: string): { type: string; bytes: Uint8Array } | null {
  const r = sql.exec<{ type: string; bytes: ArrayBuffer | Uint8Array }>('SELECT type, bytes FROM food_img WHERE id = ?', id).toArray()[0];
  return r ? { type: r.type, bytes: new Uint8Array(r.bytes) } : null;
}

/** The pictures the live custom foods name (each one's latest op: its slot's row). */
function imgNamed(sql: ImgSql): Set<string> {
  const out = new Set<string>();
  for (const r of sql.exec<{ data: string }>("SELECT data FROM events WHERE type = 'food_custom'").toArray()) {
    let d: unknown;
    try { d = JSON.parse(r.data); } catch { continue; }
    const op = foodCustomOp(d);
    if (op && !op.rm && op.img) out.add(op.img);
  }
  return out;
}

/** The sweep: the rows nothing names that are older than IMG_GC_MS deleted; `dangling`: names with no row. */
export function imgGc(sql: ImgSql, now: number): { imgDel: number; imgLive: number; imgDangling: number } {
  const named = imgNamed(sql), cut = new Date(now - IMG_GC_MS).toISOString();
  const rows = sql.exec<{ id: string; at: string }>('SELECT id, at FROM food_img').toArray();
  let del = 0;
  for (const r of rows) {
    if (named.has(r.id) || r.at >= cut) continue;
    sql.exec('DELETE FROM food_img WHERE id = ?', r.id);
    del++;
  }
  const held = new Set(rows.map((r) => r.id));
  return { imgDel: del, imgLive: rows.length - del, imgDangling: [...named].filter((id) => !held.has(id)).length };
}

/** Base64 of bytes, in slices. */
export function b64(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}
export const unb64 = (s: string): Uint8Array => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** The table's rows as a dump carries them (`[at, who, id, type, base64]`), `limit` after `after` (by id). */
export function imgRows(sql: ImgSql, after = '', limit = 1e9): unknown[][] {
  return sql.exec<ImgRow>('SELECT id, who, at, type, bytes FROM food_img WHERE id > ? ORDER BY id LIMIT ?', after, limit).toArray()
    .map((r) => [r.at, r.who, r.id, r.type, b64(new Uint8Array(r.bytes))]);
}

/** A dump's row into the table (checked as an upload is, its owner's cap aside): `added`, `had` or `skipped`. */
export async function imgLoad(sql: ImgSql, r: unknown[], isWho: (v: unknown) => v is Who): Promise<'added' | 'had' | 'skipped'> {
  const [at, who, id, , data] = r;
  if (typeof at !== 'string' || !isWho(who) || !isImgId(id) || typeof data !== 'string') return 'skipped';
  if (sql.exec('SELECT 1 AS x FROM food_img WHERE id = ?', id).toArray().length) return 'had';
  let b: Uint8Array;
  try { b = unb64(data); } catch { return 'skipped'; }
  const c = imgCheck(b);
  if ('err' in c || (await imgId(b)) !== id) return 'skipped';
  sql.exec('INSERT INTO food_img (id, who, at, type, bytes) VALUES (?, ?, ?, ?, ?)', id, who, at, c.type, blob(b));
  return 'added';
}

// ---------------------------------------------------------------- the Worker's routes

export interface ImgEnv {
  allowed: string;
  roleOf(key: string): Who | null;
  /** One of the role's uploads today (log.ts spend), or false when spent. */
  spend(role: Who): Promise<boolean>;
  put(role: Who, id: string, b: Uint8Array): Promise<{ ok: true; dup?: true } | { ok: false; error: ImgErr }>;
  log(evs: RelayEvent[]): void;
  now(): number;
}

/** `POST /img?id=`: an upload (above). Logged: its size, time and outcome (never the id). */
export async function imgPostRoute(req: Request, env: ImgEnv): Promise<Response> {
  const headers = corsRoute(req, env.allowed, 'Authorization, Content-Type');
  if (headers instanceof Response) return headers;
  const t0 = env.now();
  const json = (status: number, o: object) => new Response(JSON.stringify(o), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
  const role = env.roleOf(bearerOf(req));
  if (!role) return json(401, { ok: false, error: 'unauthorized' });
  const done = (status: number, inB: number, err?: ImgErr, dup?: boolean) => {
    env.log([{ e: 'img', l: err && err !== 'cap' ? 2 : 1, role, d: { ms: env.now() - t0, inB, ok: !err, ...(err ? { err } : {}), ...(dup ? { dup } : {}) } }]);
    return json(status, err ? { ok: false, error: err } : { ok: true, ...(dup ? { dup } : {}) });
  };
  const id = new URL(req.url).searchParams.get('id');
  if (!isImgId(id)) return done(400, 0, 'bad_id');
  const ct = (req.headers.get('Content-Type') ?? '').split(';')[0].trim();
  if (ct !== 'image/jpeg' && ct !== 'image/webp') return done(415, 0, 'bad_type');
  const b = await readCapped(req, IMG_MAX);
  if (!b) return done(413, IMG_MAX + 1, 'too_large');
  if (imgKind(b) !== ct) return done(415, b.length, 'bad_type');
  if (!(await env.spend(role).catch(() => false))) return done(429, b.length, 'cap');
  try {
    const r = await env.put(role, id, b);
    if (!r.ok) return done(r.error === 'cap' ? 429 : r.error === 'too_large' ? 413 : 400, b.length, r.error);
    return done(200, b.length, undefined, r.dup);
  } catch {
    return done(503, b.length, 'unavailable');
  }
}

/** `GET /img/<id>`: the bytes (no key), cached a year by the browser alone; 404 when gone. Unlogged. */
export async function imgGetRoute(req: Request, id: string, env: { allowed: string; get(id: string): Promise<{ type: string; bytes: Uint8Array } | null> }): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), env.allowed) ?? {};
  const base = { ...cors, Vary: 'Origin', 'X-Content-Type-Options': 'nosniff' };
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('method not allowed', { status: 405, headers: { ...base, Allow: 'GET' } });
  if (!isImgId(id)) return new Response('not found', { status: 404, headers: base });
  const r = await env.get(id).catch(() => undefined);
  if (r === undefined) return new Response('unavailable', { status: 503, headers: { ...base, 'Cache-Control': 'no-store' } });
  if (!r) return new Response('not found', { status: 404, headers: { ...base, 'Cache-Control': 'no-store' } });
  return new Response(req.method === 'HEAD' ? null : (r.bytes as Uint8Array<ArrayBuffer>), {
    headers: { ...base, 'Content-Type': r.type, 'Content-Length': String(r.bytes.length), 'Cache-Control': 'private, max-age=31536000, immutable' }
  });
}
