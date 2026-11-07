// ききみみ's whisper (docs/kikimimi-mic.md §3.2, §3.6), the worker half: transformers.js's speech recognition on
// whisper tiny.en q8, on WebGPU or the WASM runtime (single-threaded: the page isn't cross-origin isolated). Every file
// it reads comes from the STT cache the page filled (lib/mic/models.ts ensureStt): the model through transformers.js's
// custom cache, the runtime's wasm handed over as bytes, its script from `/stt/ort/<ver>/` (the service worker answers
// it from the same cache). Remote models are off and every fetch outside our `/stt/` is refused: nothing goes to
// Hugging Face or a CDN. Messages: `load` (a device; the last pipeline disposed), `run` (16 kHz mono PCM); each
// answered once with the ms it took, `run` with the text. `cand` (はつおん): each candidate word's score given the audio
// by forced decoding (the mean log-probability of its tokens after the start and no-timestamps tokens; the encoder run
// once), not a transcript. The text goes back to the page only; errors carry a closed code, never what was heard. Its own chunk (`workers/stt.<hash>.js`: vite.config.ts stt-names).
import { Tensor, env, pipeline, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';
import { STT_CACHE } from '../../../service-worker/caches.ts';
import { ORT, WHISPER } from '../models.ts';

export type Device = 'webgpu' | 'wasm';
export type WIn = { op: 'load'; root: string; device: Device } | { op: 'run'; pcm: Float32Array } | { op: 'cand'; pcm: Float32Array; cand: readonly string[] };
export type WOut = { ok: true; ms: number; text?: string; cand?: number[] } | { ok: false; err: 'oom' | 'timeout' | 'other' };

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

type Model = { generation_config: { decoder_start_token_id: number; no_timestamps_token_id: number } | null;
  _encode_input(session: string, inputs: Record<string, unknown>, out: string): Promise<unknown>;
  (inputs: Record<string, unknown>): Promise<{ logits: Tensor }> };

/** The log-probability of token `id` in a row of logits (log-softmax at one position). */
function logProb(row: ArrayLike<number>, from: number, n: number, id: number): number {
  let max = -Infinity, sum = 0;
  for (let i = 0; i < n; i++) max = Math.max(max, row[from + i]);
  for (let i = 0; i < n; i++) sum += Math.exp(row[from + i] - max);
  return row[from + id] - max - Math.log(sum);
}

/** Each candidate's score given the audio: the best of its spellings (` rice`, ` Rice`), the mean log-probability of
 *  its tokens decoded after <|startoftranscript|><|notimestamps|>. */
async function scores(p: AutomaticSpeechRecognitionPipeline, pcm: Float32Array, cands: readonly string[]): Promise<number[]> {
  const model = p.model as unknown as Model, gc = model.generation_config;
  if (!gc) throw new Error('stt: no generation config');
  const { input_features } = (await p.processor(pcm)) as { input_features: Tensor };
  const encoder_outputs = await model._encode_input('model', { input_features }, 'last_hidden_state');
  const prefix = [gc.decoder_start_token_id, gc.no_timestamps_token_id];
  const out: number[] = [];
  for (const c of cands) {
    let best = -Infinity;
    for (const v of new Set([` ${c.trim()}`, ` ${c.trim()[0]?.toUpperCase() ?? ''}${c.trim().slice(1)}`])) {
      const ids = p.tokenizer.encode(v, { add_special_tokens: false });
      if (!ids.length) continue;
      const all = [...prefix, ...ids];
      const { logits } = await model({ encoder_outputs, decoder_input_ids: new Tensor('int64', BigInt64Array.from(all, BigInt), [1, all.length]) });
      const f = logits.type === 'float32' ? logits : logits.to('float32'), n = f.dims[2], row = f.data as Float32Array;
      let s = 0;
      for (let k = 0; k < ids.length; k++) s += logProb(row, (prefix.length - 1 + k) * n, n, ids[k]);
      best = Math.max(best, s / ids.length);
    }
    out.push(Math.round(best * 1000) / 1000);
  }
  return out;
}

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
    if (m.op === 'cand') return { ok: true, cand: await scores(asr, m.pcm, m.cand), ms: Math.round(performance.now() - t0) };
    const out = await asr(m.pcm);
    const text = (Array.isArray(out) ? out[0]?.text : out.text) ?? '';
    return { ok: true, ms: Math.round(performance.now() - t0), text: text.trim() };
  } catch (e) {
    return { ok: false, err: errOf(e) };
  }
}

self.onmessage = (e: MessageEvent<WIn>) => void handle(e.data).then((r) => self.postMessage(r));
