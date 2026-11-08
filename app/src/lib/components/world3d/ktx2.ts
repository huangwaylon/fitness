// The island's model textures as GPU-compressed KTX2 (docs/perf-plan.md C1): a GLTFLoader plugin that draws an
// embedded WebP from its KTX2 (in its model's pack, static/room/tex/<id>.ktx2p: scripts/world3d-ktx2.ts) transcoded for this GPU
// (ktx2Format.ts: ASTC on an iPhone, a quarter of the WebP's RGBA in GPU memory, no decode, no mipmap pass). A warm
// start reads the transcoded mip levels from IndexedDB (texCache.ts): no fetch, no transcoder. A miss fetches the
// KTX2 (the service worker keeps it under /room/) and transcodes it in a worker (ktx2.worker.ts, three's Basis
// transcoder: its wasm from static/room/basis/, fetched on the first miss only). Anything amiss, and the model's own
// WebP is drawn, as before the plugin. The loose WebPs the models wear (a home's other colours, a player's face and
// garments: loadTexture) likewise.
import { ClampToEdgeWrapping, CompressedTexture, LinearFilter, LinearMipmapLinearFilter, MirroredRepeatWrapping, NearestFilter, RGBAFormat, RGBA_ASTC_4x4_Format, RGBA_BPTC_Format, RGBA_ETC2_EAC_Format, RGBA_S3TC_DXT5_Format, RGB_ETC2_Format, RGB_S3TC_DXT1_Format, RepeatWrapping, TextureLoader, UnsignedByteType, type CompressedPixelFormat, type PixelFormat, type Texture, type WebGLRenderer } from 'three';
import type { GLTFLoader, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';
import meta from './ktx2.json';
import { pickTarget, type Target, type Transcoded } from './ktx2Format.ts';
import type { Answer, Ask } from './ktx2.worker.ts';
import { hasTex, readTex, writeTex } from './texCache.ts';
import { texHash } from './texHash.ts';
import { entries, packId } from './ktx2Pack.ts';

/** Bumped when what's kept changes shape or meaning (the encoder's settings and the transcoder are in the key anyway). */
const TEX_V = 1;
/** The encoder's settings' hash. */
const ENC = texHash(new TextEncoder().encode(meta.enc));
/** The cache's key prefix: this pipeline's (texCache.ts lets another's go). */
const PIPE = `${TEX_V}.${ENC}.${meta.wasm}.`;
/** `path` under the site. */
const site = (path: string) => new URL(path, new URL(document.baseURI)).href;
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
/** The island's renderer takes KTX2 textures (`on` false: `?ktx2=0`, the WebPs as before, for an A/B). The cache is
 *  opened now, ahead of the models' textures; none kept (a first launch, a new pipeline), the transcoder starts too,
 *  while the models download. */
export function ktx2Target(r: Pick<WebGLRenderer, 'extensions'>, on = true): void {
  target = on ? pickTarget((e) => r.extensions.has(e)) : null;
  ktx2Stats.target = target;
  if (target && !worker) void hasTex(PIPE).then((kept) => kept || post());
}

// ---- the transcoder's worker: made on the first miss (or ahead, on a first launch), let go of when idle ----
let worker: Worker | null = null, idle: ReturnType<typeof setTimeout> | 0 = 0, stall: ReturnType<typeof setTimeout> | 0 = 0, seq = 0;
/** The worker failed (an error, or silent past STALL_MS): misses draw their WebPs from then on. */
let broken = false;
const asks = new Map<number, (t: Transcoded | null) => void>();
/** Waiting this long (ms) for the worker's next answer, it's given up on. */
const STALL_MS = 8000;
const fail = () => ((broken = true), stop());
/** To the worker (made if need be): a file to transcode, or with none its transcoder loaded (no answer). */
function post(buf?: ArrayBuffer, t?: Target, ok?: (t: Transcoded | null) => void) {
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
  const wasm = site(`room/basis/basis_transcoder.wasm?v=${meta.wasm}`);
  if (!buf || !t || !ok) {
    if (!asks.size) idle = setTimeout(stop, IDLE_MS);
    return worker.postMessage({ id: 0, wasm } satisfies Ask);
  }
  if (!asks.size) stall = setTimeout(fail, STALL_MS);
  const id = ++seq;
  asks.set(id, ok);
  worker.postMessage({ id, wasm, buf, target: t } satisfies Ask, [buf]);
}
function transcode(buf: ArrayBuffer, t: Target): Promise<Transcoded | null> {
  return new Promise((ok) => {
    if (broken) return ok(null);
    try {
      post(buf, t, ok);
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

/** Where a texture's KTX2 is: a file under the site, or `entry` in that pack (ktx2Pack.ts). */
type Where = { path: string; entry?: string };
/** A texture's mip levels for `t` (`id`: its WebP's hash, or a loose file's address), kept, or fetched (`where`, asked
 *  only then) and transcoded (then kept); null on any trouble. Asked twice at once, done once. */
const pending = new Map<string, Promise<Transcoded | null>>();
function levels(id: string, where: () => Promise<Where>, t: Target): Promise<Transcoded | null> {
  const key = PIPE + t + '.' + id;
  let p = pending.get(key);
  if (!p) {
    p = (async () => {
      const kept = await readTex(key);
      if (kept?.target === t) return ktx2Stats.kept++, kept;
      if (broken) return null;
      const buf = await fetchKtx2(await where());
      const tex = buf && (await transcode(buf, t));
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
/** The files fetched lately (a pack's entries are asked for one by one, about together: one fetch). */
const files = new Map<string, Promise<ArrayBuffer | null>>();
/** A KTX2's bytes (a copy: the worker takes them), a file's or a pack entry's; null on any trouble. */
async function fetchKtx2(w: Where): Promise<ArrayBuffer | null> {
  let f = files.get(w.path);
  if (!f) {
    // (the encoder's settings in the address: a new encoding is never an old one from the service worker's cache)
    f = fetch(site(`${w.path}${w.path.includes('?') ? '&' : '?'}e=${ENC}`)).then((r) => (r.ok ? r.arrayBuffer() : null), () => null);
    files.set(w.path, f);
    void f.then(() => setTimeout(() => files.delete(w.path), 5000));
  }
  const buf = await f;
  if (!buf || w.entry === undefined) return buf && buf.slice(0);
  const at = entries(buf)?.get(w.entry);
  return at ? buf.slice(at[0], at[0] + at[1]) : null;
}

/** A loose WebP texture of the island's models (`url`: under room/, its content's hash or its model's in `?v=`): a
 *  home's other colour, a player's face or garment. With `ktx2` and a GPU format, drawn from its KTX2 (texHash.ts
 *  looseTextures): `true` a file beside it, or `<pack>#<entry>` (a pack beside it); else, or on any trouble, the WebP
 *  as TextureLoader draws it (`flipY`: how it's drawn, the KTX2 encoded so: a compressed texture isn't flipped on
 *  upload). The caller sets its colour space, wrapping and the rest. */
export async function loadTexture(url: string, o: { flipY: boolean; ktx2: boolean | string }): Promise<Texture> {
  const t = target;
  if (t && o.ktx2) {
    const u = new URL(url, document.baseURI), room = u.pathname.indexOf('/room/'), name = u.pathname.slice(u.pathname.lastIndexOf('/') + 1);
    if (room >= 0 && name.endsWith('.webp')) {
      const dir = u.pathname.slice(room + 1, -name.length), v = `?v=${u.searchParams.get('v') ?? ''}`;
      const [file, entry] = o.ktx2 === true ? [`${name.slice(0, -5)}.ktx2`] : o.ktx2.split('#');
      const tex = await levels(`${dir}${file}${v}${entry ? `#${entry}` : ''}`, async () => ({ path: dir + file + v, entry }), t);
      if (tex) {
        const c = compressed(tex);
        c.name = name;
        c.userData.mimeType = 'image/ktx2';
        return c;
      }
      ktx2Stats.webp++;
    }
  }
  const w = await (plain ??= new TextureLoader()).loadAsync(url);
  w.flipY = o.flipY;
  return w;
}
let plain: TextureLoader | null = null;

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
          const hash = texHash(new Uint8Array(buf));
          const tex = await levels(hash, async () => ({ path: `room/tex/${await packOf(parser)}.ktx2p`, entry: hash }), t);
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
/** A model's pack (ktx2Pack.ts packId: its images' hashes, as scripts/world3d-ktx2.ts names it), asked on a miss. */
const packIds = new WeakMap<Parser, Promise<string>>();
function packOf(parser: Parser): Promise<string> {
  let p = packIds.get(parser);
  if (!p) {
    const views: number[] = (parser.json.images ?? []).flatMap((im: { bufferView?: number }) => (im.bufferView === undefined ? [] : [im.bufferView]));
    p = Promise.all(views.map((v: number) => parser.getDependency('bufferView', v) as Promise<ArrayBuffer>)).then((bs) => packId(bs.map((b) => texHash(new Uint8Array(b)))));
    packIds.set(parser, p);
  }
  return p;
}
/** glTF's sampler values (WebGL's enums): filters, and wrap modes → three's. */
const NEAREST = 9728, LINEAR = 9729;
const WRAP: Record<number, Texture['wrapS']> = { 10497: RepeatWrapping, 33071: ClampToEdgeWrapping, 33648: MirroredRepeatWrapping };
