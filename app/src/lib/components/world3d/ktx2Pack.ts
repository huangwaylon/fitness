// A pack of KTX2 files: what's drawn together in one file, so static/ stays under Cloudflare
// Pages' file cap (src/lib/static-files.test.ts): a model's embedded textures (static/room/tex/<id>.ktx2p, its id
// from its images' hashes: packId), a home's colour (its materials' albedos); the WebP fallbacks (room/tex/webp-*.pak,
// ~1 MB each). The build script writes them (scripts/world3d-ktx2.ts), the island reads an entry out (ktx2.ts).
//   'KTXP', u32 n, then n × (u8 id length, the id's ASCII, u32 offset, u32 length), then the files (little-endian)
import { texHash } from './texHash.ts';

const MAGIC = 0x5058544b; // 'KTXP'

/** A pack of `files` (id → bytes); with `dedupe`, files of the same bytes stored once, their entries one place. */
export function pack(files: [string, Uint8Array][], dedupe = false): Uint8Array {
  const ids = files.map(([id]) => new TextEncoder().encode(id));
  let head = 8;
  for (const id of ids) head += 1 + id.length + 8;
  // each file's place: its bytes' first file's, deduped
  const first = new Map<string, number>(), place: number[] = [];
  let off = head;
  files.forEach(([, b], i) => {
    const k = dedupe ? texHash(b) + b.length : String(i), j = first.get(k);
    if (j !== undefined && sameBytes(files[j][1], b)) return void place.push(place[j]);
    first.set(k, i);
    place.push(off);
    off += b.length;
  });
  const out = new Uint8Array(off), dv = new DataView(out.buffer);
  dv.setUint32(0, MAGIC, true);
  dv.setUint32(4, files.length, true);
  let at = 8;
  files.forEach(([, b], i) => {
    out[at++] = ids[i].length;
    out.set(ids[i], at);
    at += ids[i].length;
    dv.setUint32(at, place[i], true);
    dv.setUint32(at + 4, b.length, true);
    at += 8;
    out.set(b, place[i]);
  });
  return out;
}
const sameBytes = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((x, i) => x === b[i]);

/** The entries of a pack: id → [offset, length]; null if it isn't one. */
export function entries(buf: ArrayBuffer | Uint8Array): Map<string, [number, number]> | null {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  if (b.length < 8 || dv.getUint32(0, true) !== MAGIC) return null;
  const n = dv.getUint32(4, true), out = new Map<string, [number, number]>();
  let at = 8;
  for (let i = 0; i < n; i++) {
    const l = b[at++];
    const id = new TextDecoder().decode(b.subarray(at, at + l));
    at += l;
    out.set(id, [dv.getUint32(at, true), dv.getUint32(at + 4, true)]);
    at += 8;
  }
  return out;
}

/** A model's pack's id: its images' hashes (in its `images` order). */
export const packId = (hashes: string[]): string => texHash(new TextEncoder().encode(hashes.join(',')));
