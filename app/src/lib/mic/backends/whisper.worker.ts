// ききみみ's whisper (docs/kikimimi-mic.md §3.2, §3.6), the worker half: transformers.js's speech recognition on
// whisper tiny.en q8, on WebGPU or the WASM runtime (single-threaded: the page isn't cross-origin isolated). Every file
// it reads comes from the STT cache the page filled (lib/mic/models.ts ensureStt): the model through transformers.js's
// custom cache, the runtime's wasm handed over as bytes, its script from `/stt/ort/<ver>/` (the service worker answers
// it from the same cache). Remote models are off and every fetch outside our `/stt/` is refused: nothing goes to
// Hugging Face or a CDN. Messages: `load` (a device; the last pipeline disposed), `run` (16 kHz mono PCM); each
// answered once with the ms it took, `run` with the text. The text goes back to the page only; errors carry a closed
// code, never what was heard. Its own chunk (`workers/stt.<hash>.js`: vite.config.ts stt-names).
import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import { STT_CACHE } from '../../../service-worker/caches.ts';
import { ORT, WHISPER } from '../models.ts';

export type Device = 'webgpu' | 'wasm';
export type WIn = { op: 'load'; root: string; device: Device } | { op: 'run'; pcm: Float32Array };
export type WOut = { ok: true; ms: number; text?: string } | { ok: false; err: 'oom' | 'timeout' | 'other' };

let ready: Promise<void> | null = null;
/** transformers.js and the runtime pointed at `root` (`https://…/stt/`), once. */
function configure(root: string): Promise<void> {
  return (ready ??= (async () => {
    const cache = await caches.open(STT_CACHE);
    const ours = (u: string) => new URL(u, root).href.startsWith(root);
    env.allowRemoteModels = false;
    env.remoteHost = root;
    env.remotePathTemplate = '{model}/';
    env.allowLocalModels = true;
    env.localModelPath = new URL(root).pathname;
    env.useBrowserCache = false;
    env.useWasmCache = false;
    env.useCustomCache = true;
    env.customCache = { match: (k: string) => cache.match(new URL(k, root).href), put: async () => {} };
    env.fetch = (u: string | URL, init?: RequestInit) => (ours(String(u)) ? fetch(u, init) : Promise.reject(new Error('stt: not ours')));
    const wasm = env.backends.onnx.wasm;
    if (!wasm) throw new Error('stt: no wasm backend');
    wasm.wasmPaths = `${root}${ORT.dir}/`;
    wasm.numThreads = 1;
    const bin = await cache.match(`${root}${ORT.dir}/ort-wasm-simd-threaded.asyncify.wasm`);
    if (!bin) throw new Error('stt: the runtime is not cached');
    wasm.wasmBinary = new Uint8Array(await bin.arrayBuffer());
  })().catch((e: unknown) => {
    ready = null;
    throw e;
  }));
}

let asr: AutomaticSpeechRecognitionPipeline | null = null;
const errOf = (e: unknown): 'oom' | 'other' => (e instanceof RangeError || /memory|alloc/i.test(e instanceof Error ? e.message : String(e)) ? 'oom' : 'other');

async function handle(m: WIn): Promise<WOut> {
  const t0 = performance.now();
  try {
    if (m.op === 'load') {
      await asr?.dispose();
      asr = null;
      await configure(m.root);
      asr = await pipeline('automatic-speech-recognition', `${new URL(m.root).pathname}${WHISPER.dir}`, { device: m.device, dtype: WHISPER.dtype });
      return { ok: true, ms: Math.round(performance.now() - t0) };
    }
    if (!asr) return { ok: false, err: 'other' };
    const out = await asr(m.pcm);
    const text = (Array.isArray(out) ? out[0]?.text : out.text) ?? '';
    return { ok: true, ms: Math.round(performance.now() - t0), text: text.trim() };
  } catch (e) {
    return { ok: false, err: errOf(e) };
  }
}

self.onmessage = (e: MessageEvent<WIn>) => void handle(e.data).then((r) => self.postMessage(r));
