// A texture's name in static/room/tex/ (docs/perf-plan.md C1): a 64-bit hash of the image as the model carries it (its
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
