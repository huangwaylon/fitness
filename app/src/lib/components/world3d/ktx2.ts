// The island's model textures as GPU-compressed KTX2 (docs/perf-plan.md C1): a GLTFLoader plugin that draws an
// embedded WebP from its KTX2 (static/room/tex/<hash>.ktx2, scripts/world3d-ktx2.ts) transcoded for this GPU
// (ktx2Format.ts: ASTC on an iPhone, a quarter of the WebP's RGBA in GPU memory, no decode, no mipmap pass). A warm
// start reads the transcoded mip levels from IndexedDB (texCache.ts): no fetch, no transcoder. A miss fetches the
// KTX2 (the service worker keeps it under /room/) and transcodes it in a worker (ktx2.worker.ts, three's Basis
// transcoder: its wasm from static/room/basis/, fetched on the first miss only). Anything amiss, and the model's own
// WebP is drawn, as before the plugin.
import { ClampToEdgeWrapping, CompressedTexture, LinearFilter, LinearMipmapLinearFilter, MirroredRepeatWrapping, NearestFilter, RGBAFormat, RGBA_ASTC_4x4_Format, RGBA_BPTC_Format, RGBA_ETC2_EAC_Format, RGBA_S3TC_DXT5_Format, RGB_ETC2_Format, RGB_S3TC_DXT1_Format, RepeatWrapping, UnsignedByteType, type CompressedPixelFormat, type PixelFormat, type Texture, type WebGLRenderer } from 'three';
import type { GLTFLoader, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import meta from './ktx2.json';
import { pickTarget, type Target, type Transcoded } from './ktx2Format.ts';
import type { Answer, Ask } from './ktx2.worker.ts';
import { readTex, writeTex } from './texCache.ts';
import { texHash } from './texHash.ts';

/** Bumped when what's kept changes shape or meaning (the encoder's settings and the transcoder are in the key anyway). */
const TEX_V = 1;
/** The cache's key prefix: this pipeline's (texCache.ts lets another's go). */
const PIPE = `${TEX_V}.${texHash(new TextEncoder().encode(meta.enc))}.${meta.wasm}.`;
/** The transcoder's worker is let go of this long after its last answer (ms): its wasm's memory back. */
const IDLE_MS = 10_000;

const FORMATS: Record<Target, [PixelFormat | CompressedPixelFormat, PixelFormat | CompressedPixelFormat]> = {
  etc: [RGB_ETC2_Format, RGBA_ETC2_EAC_Format],
  astc: [RGBA_ASTC_4x4_Format, RGBA_ASTC_4x4_Format],
  bptc: [RGBA_BPTC_Format, RGBA_BPTC_Format],
  dxt: [RGB_S3TC_DXT1_Format, RGBA_S3TC_DXT5_Format],
  rgba: [RGBAFormat, RGBAFormat]
};

/** This page's GPU format (set by the island's renderer: ktx2Target), or null: the plugin stands aside. */
let target: Target | null = null;
/** The island's renderer takes KTX2 textures (`on` false: `?ktx2=0`, the WebPs as before, for an A/B). */
export function ktx2Target(r: Pick<WebGLRenderer, 'extensions'>, on = true): void {
  target = on ? pickTarget((e) => r.extensions.has(e)) : null;
  ktx2Stats.target = target;
}

// ---- the transcoder's worker: made on the first miss, let go of when idle ----
let worker: Worker | null = null, idle: ReturnType<typeof setTimeout> | 0 = 0, stall: ReturnType<typeof setTimeout> | 0 = 0, seq = 0;
/** The worker failed (an error, or silent past STALL_MS): misses draw their WebPs from then on. */
let broken = false;
const asks = new Map<number, (t: Transcoded | null) => void>();
/** Waiting this long (ms) for the worker's next answer, it's given up on. */
const STALL_MS = 8000;
const fail = () => ((broken = true), stop());
function transcode(buf: ArrayBuffer, t: Target): Promise<Transcoded | null> {
  return new Promise((ok) => {
    if (broken) return ok(null);
    try {
      if (!worker) {
        worker = new Worker(new URL('./ktx2.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = ({ data }: MessageEvent<Answer>) => {
          asks.get(data.id)?.(data.tex);
          asks.delete(data.id);
          clearTimeout(stall);
          if (asks.size) stall = setTimeout(fail, STALL_MS);
          else idle = setTimeout(stop, IDLE_MS);
        };
        worker.onerror = fail;
      }
      clearTimeout(idle);
      if (!asks.size) stall = setTimeout(fail, STALL_MS);
      const id = ++seq;
      asks.set(id, ok);
      const wasm = new URL(`room/basis/basis_transcoder.wasm?v=${meta.wasm}`, new URL(document.baseURI)).href;
      worker.postMessage({ id, wasm, buf, target: t } satisfies Ask, [buf]);
    } catch {
      ok(null);
    }
  });
}
function stop() {
  clearTimeout(stall);
  clearTimeout(idle);
  worker?.terminate();
  worker = null;
  for (const f of asks.values()) f(null);
  asks.clear();
}

/** This page's textures so far: read back from the cache, transcoded, drawn from their WebP (no KTX2 for them, or
 *  none could be had); and the format (window.__world3d.ktx2: a spec's, a measure's). */
export const ktx2Stats = { kept: 0, made: 0, webp: 0, target: null as Target | null };

/** Texture `hash`'s mip levels for `t`: kept, or fetched and transcoded (then kept); null on any trouble. Asked twice
 *  at once, done once. */
const pending = new Map<string, Promise<Transcoded | null>>();
function levels(hash: string, t: Target): Promise<Transcoded | null> {
  const key = PIPE + t + '.' + hash;
  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      const kept = await readTex(key);
      if (kept?.target === t) return ktx2Stats.kept++, kept;
      if (broken) return null;
      const res = await fetch(new URL(`room/tex/${hash}.ktx2`, new URL(document.baseURI)).href).catch(() => null);
      if (!res?.ok) return null;
      const tex = await transcode(await res.arrayBuffer(), t);
      // (plain RGBA isn't kept: as much to read back as to transcode)
      if (tex && t !== 'rgba') writeTex(key, tex, PIPE);
      if (tex) ktx2Stats.made++;
      return tex;
    })().catch(() => null);
    pending.set(key, p);
    void p.finally(() => pending.delete(key));
  }
  return p;
}

/** A three texture of `tex`'s levels (its sampler and colour space set by the loader, as for any glTF texture). */
function compressed(tex: Transcoded): CompressedTexture {
  const c = new CompressedTexture(tex.mips, tex.width, tex.height, FORMATS[tex.target][tex.alpha ? 1 : 0] as CompressedPixelFormat, UnsignedByteType);
  c.generateMipmaps = false;
  c.needsUpdate = true;
  return c;
}

type Json = { textures: { source?: number; sampler?: number; name?: string; extensions?: { EXT_texture_webp?: { source?: number } } }[]; images?: { bufferView?: number; mimeType?: string; name?: string }[]; samplers?: { magFilter?: number; minFilter?: number; wrapS?: number; wrapT?: number }[] };
type Parser = GLTFParser & { json: Json; textureLoader: unknown; loadTextureImage(i: number, source: number, loader: unknown): Promise<Texture | null> };

/** `loader`'s models' embedded WebPs drawn from their KTX2 (once the island's renderer said which format). It stands
 *  in for GLTFLoader's own EXT_texture_webp (the models' textures are WebPs by that extension; a plugin by its name
 *  takes its place, ahead of the loader's default), drawing the WebP as that one does when there's no KTX2. */
export function ktx2Plugin(loader: GLTFLoader): GLTFLoader {
  return loader.register((p) => {
    const parser = p as Parser;
    return {
      name: 'EXT_texture_webp',
      loadTexture(i: number) {
        const def = parser.json.textures[i], source = def?.extensions?.EXT_texture_webp?.source;
        const t = target, src = source === undefined ? undefined : parser.json.images?.[source];
        if (source === undefined || !src) return null;
        if (!t || src.bufferView === undefined || src.mimeType !== 'image/webp') return parser.loadTextureImage(i, source, parser.textureLoader);
        return parser.getDependency('bufferView', src.bufferView).then(async (buf: ArrayBuffer) => {
          const tex = await levels(texHash(new Uint8Array(buf)), t);
          if (!tex) return ktx2Stats.webp++, parser.loadTextureImage(i, source, parser.textureLoader);
          const c = compressed(tex);
          // (GLTFLoader's loadTextureImage's settings: glTF's UVs unflipped, its sampler's filters and wrapping)
          const s = parser.json.samplers?.[def.sampler ?? -1] ?? {};
          c.name = def.name || src.name || '';
          c.flipY = false;
          c.magFilter = s.magFilter === NEAREST ? NearestFilter : LinearFilter;
          c.minFilter = s.minFilter === NEAREST ? NearestFilter : s.minFilter === LINEAR ? LinearFilter : LinearMipmapLinearFilter;
          c.wrapS = WRAP[s.wrapS ?? 0] ?? RepeatWrapping;
          c.wrapT = WRAP[s.wrapT ?? 0] ?? RepeatWrapping;
          c.userData.mimeType = 'image/ktx2';
          parser.associations.set(c, { textures: i });
          return c;
        });
      }
    };
  });
}
/** glTF's sampler values (WebGL's enums): filters, and wrap modes → three's. */
const NEAREST = 9728, LINEAR = 9729;
const WRAP: Record<number, Texture['wrapS']> = { 10497: RepeatWrapping, 33071: ClampToEdgeWrapping, 33648: MirroredRepeatWrapping };
