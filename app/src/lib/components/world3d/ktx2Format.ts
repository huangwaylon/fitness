// The GPU formats the island's KTX2 textures become: shared by the page (ktx2.ts) and the
// transcoding worker (ktx2.worker.ts), no three.js here (the worker stays small).

/** What this GPU takes, best first for UASTC: ASTC 4x4 (an iPhone; near lossless from UASTC, 1 byte a pixel), BC7,
 *  ETC2, BC1/BC3, else plain RGBA (4 bytes a pixel: never kept, texCache.ts). */
export type Target = 'astc' | 'bptc' | 'etc' | 'dxt' | 'rgba';

/** The Basis transcoder's format for each target (its transcoder_texture_format): [opaque, with alpha]. */
export const TRANSCODE: Record<Target, [number, number]> = { astc: [10, 10], bptc: [6, 6], etc: [0, 1], dxt: [2, 3], rgba: [13, 13] };

/** A texture transcoded: its mip levels, largest first. */
export type Transcoded = { width: number; height: number; alpha: boolean; target: Target; mips: { width: number; height: number; data: Uint8Array }[] };

/** The first target whose WebGL extensions this context has (`has`: the renderer's extensions.has). */
export function pickTarget(has: (ext: string) => boolean): Target {
  if (has('WEBGL_compressed_texture_astc')) return 'astc';
  if (has('EXT_texture_compression_bptc')) return 'bptc';
  if (has('WEBGL_compressed_texture_etc')) return 'etc';
  if (has('WEBGL_compressed_texture_s3tc') && has('WEBGL_compressed_texture_s3tc_srgb')) return 'dxt';
  return 'rgba';
}
