// The recogniser's files (docs/kikimimi-mic.md §3.6): whisper tiny.en int8 at a pinned Hugging Face revision and the
// ONNX runtime's WebAssembly at the pinned onnxruntime-web, each file's bytes and sha256. They're served same-origin
// under `/stt/<dir>/` (never git: scripts/stt-models.ts fetches them, checks them and writes them for the deploy or
// R2), each file over Pages' 25 MiB in parts of ≤ 20 MiB (`<path>.<sha8>.p0…`), `/stt/manifest.json` beside them.
// The page fetches them only on the probe's tap (opted in), assembles and checks each, and keeps it whole in the
// service worker's STT cache (ensureStt), from which the worker's transformers.js reads it. Pure but for the Cache
// and fetch it's handed: the unit tests drive it with fakes.

/** A part's most bytes (Pages takes ≤ 25 MiB a file). */
export const PART_BYTES = 20 * 1024 * 1024;

export interface SttFile {
  readonly path: string;
  readonly bytes: number;
  readonly sha256: string;
  /** Served in this many parts, or 0: whole, at its own path (the runtime's script, which is imported by its URL). */
  readonly parts: number;
}
export interface SttSet {
  /** Under `/stt/`: carries the revision or version, so a path's bytes never change (served immutable). */
  readonly dir: string;
  readonly files: readonly SttFile[];
}

/** onnx-community/whisper-tiny.en, its q8 files (transformers.js's `_quantized`: an int8 decoder, a uint8 encoder). */
export const WHISPER = {
  model: 'tiny.en',
  repo: 'onnx-community/whisper-tiny.en',
  rev: '2575352d61be1bf7225cf8f8b268a4678025fc58',
  dtype: 'q8',
  dir: 'whisper-tiny.en@2575352d',
  files: [
    { path: 'config.json', bytes: 2197, sha256: '251ea843b5901a99efa58c0b99b8052c6019aa3e7d2baf46693a1128ff606233', parts: 1 },
    { path: 'generation_config.json', bytes: 1646, sha256: '7b2e8451ed5f118e75fdd991409d72119d21d2fef1eba9723f68fb9c57fe5dc9', parts: 1 },
    { path: 'preprocessor_config.json', bytes: 339, sha256: 'a6a76d28c93edb273669eb9e0b0636a2bddbb1272c3261e47b7ca6dfdbac1b8d', parts: 1 },
    { path: 'tokenizer.json', bytes: 2405679, sha256: '5eb60cec1e77aeeb6869a2bb5a8e01a84c3fe5d072d75369343021fe6f5310d0', parts: 1 },
    { path: 'tokenizer_config.json', bytes: 282662, sha256: '93879c3dccdd4b976f709acd85b44778873f30c275e67026f30ca1e4c975230c', parts: 1 },
    { path: 'onnx/encoder_model_quantized.onnx', bytes: 10124993, sha256: 'e93ec822f16a8fd264e7de972ad17d615ea7334b75a52d54c50c2e18dd503a25', parts: 1 },
    { path: 'onnx/decoder_model_merged_quantized.onnx', bytes: 30718858, sha256: 'c0592d0749413c960569e1c7fb806b060d5d18f3ebad4a95cbf9a77dc6e9be52', parts: 2 }
  ]
} as const satisfies SttSet & Record<string, unknown>;

/** onnxruntime-web's WebGPU build's runtime (the asyncify one transformers.js picks on Safari 26+), from its npm
 *  package; the same version package.json's overrides pin (the JS half is bundled into the worker). */
export const ORT = {
  pkg: 'onnxruntime-web',
  version: '1.31.0-dev.20260914-8d85527a0',
  dir: 'ort/1.31.0-dev.20260914-8d85527a0',
  files: [
    { path: 'ort-wasm-simd-threaded.asyncify.mjs', bytes: 53057, sha256: '0966b6105cd936744498aa60df7a22cbd47af3374dbc64a9ab561c08a71e3611', parts: 0 },
    { path: 'ort-wasm-simd-threaded.asyncify.wasm', bytes: 26861777, sha256: '49871f5a4409519797e127440868a6d1923339d9185907f301a5b2a1d90af082', parts: 2 }
  ]
} as const satisfies SttSet & Record<string, unknown>;

export const STT_SETS: readonly SttSet[] = [WHISPER, ORT];
/** What `/stt/manifest.json` names: the probe offers the download only when the site serves these. */
export const STT_ID = STT_SETS.map((s) => s.dir).join(' ');
/** The bytes the download takes (the model and the runtime), in whole MB (10⁶: what the screen says). */
export const sttMB = (): number => Math.round(STT_SETS.flatMap((s) => s.files).reduce((a, f) => a + f.bytes, 0) / 1e6);

/** A file's names as served, under its set's dir. */
export const partNames = (f: SttFile): string[] =>
  f.parts ? Array.from({ length: f.parts }, (_, i) => `${f.path}.${f.sha256.slice(0, 8)}.p${i}`) : [f.path];

/** How many parts a file of `bytes` takes. */
export const partsFor = (bytes: number): number => Math.max(1, Math.ceil(bytes / PART_BYTES));

/** Bytes cut into parts of PART_BYTES (the last one shorter). */
export function split(b: Uint8Array): Uint8Array[] {
  const out: Uint8Array[] = [];
  for (let at = 0; at < b.length || !out.length; at += PART_BYTES) out.push(b.subarray(at, at + PART_BYTES));
  return out;
}

export async function sha256(b: Uint8Array): Promise<string> {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', b as Uint8Array<ArrayBuffer>));
  return Array.from(h, (x) => x.toString(16).padStart(2, '0')).join('');
}

/** Parts put back together; null unless they make `f` (its length and sha256). */
export async function assemble(f: SttFile, parts: readonly Uint8Array[]): Promise<Uint8Array | null> {
  const n = parts.reduce((a, p) => a + p.length, 0);
  if (n !== f.bytes) return null;
  const out = new Uint8Array(n);
  let at = 0;
  for (const p of parts) out.set(p, at), (at += p.length);
  return (await sha256(out)) === f.sha256 ? out : null;
}

const TYPES: Record<string, string> = { json: 'application/json', onnx: 'application/octet-stream', wasm: 'application/wasm', mjs: 'text/javascript' };
const typeOf = (path: string) => TYPES[path.slice(path.lastIndexOf('.') + 1)] ?? 'application/octet-stream';

/** Each file's URL as the cache keeps it (whole, at its own path: what transformers.js and the runtime ask for). */
export const fileUrls = (root: string): string[] => STT_SETS.flatMap((s) => s.files.map((f) => `${root}${s.dir}/${f.path}`));

type CacheLike = Pick<Cache, 'match' | 'put' | 'delete'> & { keys(): Promise<readonly Request[]> };

/** A response's body read whole, its bytes counted as they come. */
async function readAll(res: Response, got: (n: number) => void): Promise<Uint8Array> {
  if (!res.body) {
    const b = new Uint8Array(await res.arrayBuffer());
    got(b.length);
    return b;
  }
  const chunks: Uint8Array[] = [], reader = res.body.getReader();
  let n = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    n += value.length;
    got(value.length);
  }
  const out = new Uint8Array(n);
  let at = 0;
  for (const c of chunks) out.set(c, at), (at += c.length);
  return out;
}

/**
 * Every file in `cache`, whole and checked: only what's missing is fetched (its parts from `root`, e.g.
 * `https://…/stt/`), assembled, checked (a file that fails is thrown away: the error names its path) and put; `extra`
 * (the worker's script: our own hashed build file) is fetched as it is. Entries of other versions are deleted first.
 * `progress`: bytes got and of (what's missing). Returns the bytes fetched (0: all cached).
 */
export async function ensureStt(o: { root: string; cache: CacheLike; fetch: (url: string) => Promise<Response>; extra?: readonly string[]; progress?: (got: number, of: number) => void }): Promise<number> {
  const want = new Set([...fileUrls(o.root), ...(o.extra ?? [])]);
  const have = new Set<string>();
  for (const k of await o.cache.keys()) {
    if (want.has(k.url)) have.add(k.url);
    else await o.cache.delete(k);
  }
  const missing = STT_SETS.flatMap((s) => s.files.map((f) => ({ s, f, url: `${o.root}${s.dir}/${f.path}` }))).filter((m) => !have.has(m.url));
  const extra = (o.extra ?? []).filter((u) => !have.has(u));
  const of = missing.reduce((a, m) => a + m.f.bytes, 0);
  let got = 0;
  const count = (n: number) => o.progress?.((got += n), of);
  for (const { s, f, url } of missing) {
    const parts: Uint8Array[] = [];
    for (const name of partNames(f)) {
      const res = await o.fetch(`${o.root}${s.dir}/${name}`);
      if (!res.ok) throw new Error(`stt: ${s.dir}/${name} ${res.status}`);
      parts.push(await readAll(res, count));
    }
    const whole = await assemble(f, parts);
    if (!whole) throw new Error(`stt: ${s.dir}/${f.path} failed its check`);
    await o.cache.put(url, new Response(whole as Uint8Array<ArrayBuffer>, { headers: { 'content-type': typeOf(f.path), 'content-length': String(f.bytes) } }));
  }
  for (const u of extra) {
    const res = await o.fetch(u);
    if (!res.ok) throw new Error(`stt: ${u} ${res.status}`);
    await o.cache.put(u, res);
  }
  return got;
}

/** Whether every file is in `cache` (the probe can go on offline). */
export async function sttCached(root: string, cache: Pick<Cache, 'match'>): Promise<boolean> {
  for (const u of fileUrls(root)) if (!(await cache.match(u))) return false;
  return true;
}
