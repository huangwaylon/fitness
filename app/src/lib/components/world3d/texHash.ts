// A texture's name in static/room/tex/: a 64-bit hash of the image as the model carries it (its
// WebP's bytes), the same in the build script (scripts/world3d-ktx2.ts) and on the phone (ktx2.ts). Synchronous and
// the same everywhere (no SubtleCrypto: none on a LAN address): two 32-bit lanes of a multiply-xorshift (cyrb53's).
export function texHash(b: Uint8Array): string {
  let h1 = 0xdeadbeef ^ b.length, h2 = 0x41c6ce57 ^ b.length;
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0');
}

/** A GLB's embedded images, in its `images` order (each its bufferView's bytes): the build script's and its test's. */
export function glbImages(b: Uint8Array): Uint8Array[] {
  const jl = new DataView(b.buffer, b.byteOffset, b.byteLength).getUint32(12, true);
  const j = JSON.parse(new TextDecoder().decode(b.subarray(20, 20 + jl))) as { images?: { bufferView?: number }[]; bufferViews: { byteOffset?: number; byteLength: number }[] };
  const bin = b.subarray(28 + jl);
  return (j.images ?? []).flatMap((im) => {
    const bv = im.bufferView === undefined ? null : j.bufferViews[im.bufferView];
    return bv ? [bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength)] : [];
  });
}

type Families = { families: Record<string, { colours: Record<string, string[]> }> };
type Parts = { face: Record<string, { v: string; iris?: unknown }>; cheek: unknown[]; items: Record<string, { tex: Record<string, { file?: string }> }> };
/** A loose WebP texture with a KTX2: its `path` under static/room (a player's: in its pack, player3d/packing.ts), drawn y-flipped (`flip`: TextureLoader's default,
 *  the players', so encoded flipped: a compressed texture can't be flipped on upload), and where its KTX2 is: `out`
 *  (under static/room), as `entry` in that pack (ktx2Pack.ts) or, with none, a file of its own. */
export interface Loose { path: string; flip: boolean; out: string; entry?: string }
/** The loose WebP textures with a KTX2: the homes' and the bridges' other colours (layout/homes.json,
 *  structures.json: a colour's albedos in one pack, homes/<family>.<colour>.ktx2p, by material), and the players'
 *  faces and the bundled closet's garments (player3d/parts.json: each a KTX2 beside it, in the players' packs; a part
 *  only the whole table has keeps its WebP). The build script's and its test's. */
export function looseTextures(homes: Families, structures: Families, parts: Parts): Loose[] {
  const out: Loose[] = [];
  for (const [dir, m] of [['homes', homes], ['structures', structures]] as const)
    for (const [fam, f] of Object.entries(m.families))
      for (const [c, mats] of Object.entries(f.colours)) for (const mat of mats) out.push({ path: `${dir}/${fam}.${c}.${mat}.webp`, flip: false, out: `${dir}/${fam}.${c}.ktx2p`, entry: mat });
  const beside = (path: string): Loose => ({ path, flip: true, out: path.replace(/\.webp$/, '.ktx2') });
  for (const [id, f] of Object.entries(parts.face)) {
    out.push(beside(`player/face/${id}.webp`));
    if (f.iris) out.push(beside(`player/face/${id}.iris.webp`));
  }
  parts.cheek.forEach((_, i) => out.push(beside(`player/face/cheek${i}.webp`)));
  for (const it of Object.values(parts.items)) for (const t of Object.values(it.tex)) if (t.file) out.push(beside(`player/tex/${t.file}`));
  return [...new Map(out.map((o) => [o.path, o])).values()];
}
