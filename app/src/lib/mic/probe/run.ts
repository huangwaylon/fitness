// ききみみ's mic probe, the browser half (docs/kikimimi-mic.md §1.1): what the page can do, the permission, a capture on
// the probe's own context (one clock for a click, a clip and the mic), the play-and-record measurement per earphone
// route, Safari's recogniser, the relay's `/stt`. Each returns numbers and closed sets for the log's `mic.*` events;
// the heard text is returned only to the screen (the WER is computed there and nothing of it is kept). A take lives in
// memory until its step ends.
import { applySession } from '#lib/sound/engine.ts';
import { postWav } from '../backends/relay.ts';
import { webkitOnce as webkitUtterance } from '../backends/webkit.ts';
import { dbfs, inputClass, onset, silenceAfterSpeech, type Inp, type SttErr } from './steps.ts';

export { relayReady } from '../backends/relay.ts';

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const TAKE_MAX_MS = 10_000;

// ---- 1. the page --------------------------------------------------------------------------------------------------

type Gpu = { requestAdapter(): Promise<{ features: Set<string>; info?: { architecture?: string } } | null> };

/** Whether a dedicated Worker sees WebGPU (an adapter), within 3 s. */
function gpuInWorker(): Promise<boolean> {
  return new Promise((done) => {
    try {
      const w = new Worker(new URL('./gpu.worker.ts', import.meta.url), { type: 'module' });
      const end = (v: boolean) => (w.terminate(), done(v));
      const t = setTimeout(() => end(false), 3000);
      w.onmessage = (e) => (clearTimeout(t), end(e.data === true));
      w.onerror = () => (clearTimeout(t), end(false));
    } catch {
      done(false);
    }
  });
}

export async function probeEnv() {
  const nav = navigator as Navigator & { gpu?: Gpu; standalone?: boolean; audioSession?: unknown };
  const adapter = await nav.gpu?.requestAdapter().catch(() => null) ?? null;
  const arch = (adapter?.info?.architecture ?? '').replace(/[^\w.-]/g, '').slice(0, 24);
  const mr = typeof MediaRecorder === 'undefined' ? 'none' : MediaRecorder.isTypeSupported('audio/mp4') ? 'mp4' : MediaRecorder.isTypeSupported('audio/webm') ? 'webm' : 'none';
  return {
    pwa: matchMedia('(display-mode: standalone)').matches || nav.standalone === true,
    coi: globalThis.crossOriginIsolated === true,
    gpu: !!adapter,
    gpuW: nav.gpu ? await gpuInWorker() : false,
    f16: !!adapter?.features.has('shader-f16'),
    ...(arch ? { arch } : {}),
    wks: 'webkitSpeechRecognition' in window,
    ses: 'audioSession' in nav,
    mr: mr as 'mp4' | 'webm' | 'none',
    wl: typeof AudioWorkletNode !== 'undefined'
  };
}

// ---- 2. the permission ------------------------------------------------------------------------------------------------

export type PermSt = 'granted' | 'denied' | 'prompt' | 'unsupported';

export async function permState(): Promise<PermSt> {
  try {
    const s = (await navigator.permissions.query({ name: 'microphone' as PermissionName })).state;
    return s === 'granted' || s === 'denied' ? s : 'prompt';
  } catch {
    return 'unsupported';
  }
}

/** The mic opened once and closed (inside a tap): how long it took, the state after, the track's settings. */
export async function askMic(): Promise<{ st: PermSt; ms: number; ec?: boolean; sr?: number; inp?: Inp; err?: string }> {
  const t0 = performance.now();
  if (!navigator.mediaDevices?.getUserMedia) return { st: 'unsupported', ms: 0 };
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true } });
    const ms = Math.round(performance.now() - t0);
    const tr = s.getAudioTracks()[0];
    const set = tr?.getSettings() ?? {};
    const out = { st: 'granted' as const, ms, ec: set.echoCancellation === true, ...(set.sampleRate ? { sr: set.sampleRate } : {}), inp: inputClass(tr?.label ?? '') };
    s.getTracks().forEach((t) => t.stop());
    return out;
  } catch (e) {
    const st = await permState();
    return { st: st === 'granted' ? 'denied' : st, ms: Math.round(performance.now() - t0), err: e instanceof Error ? e.name : 'Error' };
  }
}

// ---- capture -------------------------------------------------------------------------------------------------------

/** A capture on `ctx`: its frames so far, the context time of the first sample, the input's class; stop releases the
 *  track (the orange dot goes off). */
export interface Rec {
  sr: number;
  inp: Inp;
  /** The context time of frame 0 (−1 before the first). */
  t0: number;
  frames(): Float32Array;
  stop(): void;
}

let ctx: AudioContext | null = null;
/** The probe's own audio context (inside a tap: created or resumed). */
export function probeCtx(): AudioContext {
  ctx ??= new AudioContext();
  void ctx.resume();
  return ctx;
}
/** The probe's over: its context closed. */
export function closeProbe(): void {
  void ctx?.close();
  ctx = null;
}

export async function openRec(o: { aec: boolean; deviceId?: string; level?: (db: number, ms: number) => void }): Promise<Rec> {
  const c = probeCtx();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: o.aec, noiseSuppression: o.aec, autoGainControl: o.aec, ...(o.deviceId ? { deviceId: { exact: o.deviceId } } : {}) } });
  const src = c.createMediaStreamSource(stream);
  const SIZE = 2048;
  // (ScriptProcessor: the probe's few seconds need no worklet file; M1's capture has one)
  const proc = c.createScriptProcessor(SIZE, 1, 1);
  const mute = c.createGain();
  mute.gain.value = 0;
  const chunks: Float32Array[] = [];
  const rec: Rec = {
    sr: c.sampleRate, inp: inputClass(stream.getAudioTracks()[0]?.label ?? ''), t0: -1,
    frames() {
      const n = chunks.reduce((a, b) => a + b.length, 0), out = new Float32Array(n);
      let at = 0;
      for (const ch of chunks) out.set(ch, at), (at += ch.length);
      return out;
    },
    stop() {
      proc.onaudioprocess = null;
      src.disconnect();
      proc.disconnect();
      stream.getTracks().forEach((t) => t.stop());
    }
  };
  proc.onaudioprocess = (e) => {
    const x = new Float32Array(e.inputBuffer.getChannelData(0));
    // the input block was captured one block before the output it feeds plays
    if (rec.t0 < 0) rec.t0 = e.playbackTime - SIZE / c.sampleRate;
    chunks.push(x);
    o.level?.(dbfs(x), (SIZE / c.sampleRate) * 1000);
  };
  src.connect(proc).connect(mute).connect(c.destination);
  return rec;
}

/** A sentence spoken (`secs`: how long so far): recording until the speech ends (1.2 s quiet after it), `stop()` or 10 s. */
export async function takeSpeech(secs?: (s: number) => void): Promise<{ stop(): void; done: Promise<{ x: Float32Array; sr: number; s: number }> }> {
  let finish = () => {};
  const ended = new Promise<void>((r) => (finish = r));
  const quiet = silenceAfterSpeech();
  let s = 0;
  const rec = await openRec({ aec: true, level: (db, ms) => (secs?.((s += ms / 1000)), quiet(db, ms) && finish()) });
  const cap = setTimeout(finish, TAKE_MAX_MS);
  const done = ended.then(() => {
    clearTimeout(cap);
    const x = rec.frames();
    rec.stop();
    return { x, sr: rec.sr, s: x.length / rec.sr };
  });
  return { stop: finish, done };
}

// ---- 3. play and record ----------------------------------------------------------------------------------------------

/** Bytes (a clip's) decoded on the probe's context (null: none, or undecodable). */
export async function decode(bytes: ArrayBuffer | null): Promise<AudioBuffer | null> {
  return bytes ? probeCtx().decodeAudioData(bytes).catch(() => null) : null;
}

/** Play a buffer now on the probe's context; resolves when it ends. */
export function playBuf(buf: AudioBuffer): Promise<void> {
  const c = probeCtx(), s = c.createBufferSource();
  s.buffer = buf;
  s.connect(c.destination);
  return new Promise((r) => ((s.onended = () => r()), s.start()));
}

/**
 * One route's measurement (play-and-record on): the noise floor, then (speaker only) a click's round trip, then the
 * clip played while the mic listens: how far above the floor it came back (dB), with echo cancellation on and off.
 * The session type is put back after; `restored`: it was.
 */
export async function duplex(clip: AudioBuffer, o: { click: boolean; deviceId?: string }): Promise<{ rows: { aec: boolean; bleed: number; rtl?: number; inp: Inp }[]; restored?: boolean }> {
  const was = applySession('play-and-record');
  const c = probeCtx();
  const out: { aec: boolean; bleed: number; rtl?: number; inp: Inp }[] = [];
  try {
    for (const aec of [true, false]) {
      const rec = await openRec({ aec, deviceId: o.deviceId });
      await wait(600);
      const floor = dbfs(rec.frames());
      let rtl: number | undefined;
      if (o.click && aec) {
        const at = c.currentTime + 0.05, osc = c.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1000;
        osc.connect(c.destination);
        osc.start(at);
        osc.stop(at + 0.004);
        await wait(700);
        const x = rec.frames(), i = onset(x, Math.round((at - rec.t0) * rec.sr), floor);
        if (i >= 0) rtl = Math.round((rec.t0 + i / rec.sr - at) * 1000);
      }
      const from = rec.frames().length;
      await playBuf(clip);
      const x = rec.frames();
      rec.stop();
      out.push({ aec, bleed: Math.round((dbfs(x, from) - floor) * 10) / 10, ...(rtl !== undefined ? { rtl } : {}), inp: rec.inp });
    }
  } finally {
    if (was !== null) applySession(was);
  }
  return { rows: out, ...(was !== null ? { restored: sessionType() === was } : {}) };
}

/** The audio session's type now (WebKit), or null. */
const sessionType = (): string | null => (navigator as { audioSession?: { type: string } }).audioSession?.type ?? null;

/** With Bluetooth earphones on: the built-in mic's device id, if the page may pick it. */
export async function builtinMic(): Promise<string | undefined> {
  const ds = await navigator.mediaDevices.enumerateDevices().catch(() => []);
  return ds.find((d) => d.kind === 'audioinput' && inputClass(d.label) === 'builtin' && d.deviceId && d.deviceId !== 'default')?.deviceId;
}

// ---- 5. Safari's recogniser (the e2e's stub: localStorage['e2e.stt'], a JSON list of what it "hears") -----------------

export type Heard = { text: string; ms: number; audS: number } | { err: SttErr };

function stubbed(): string | null {
  try {
    const list = JSON.parse(localStorage.getItem('e2e.stt') ?? 'null') as string[] | null;
    if (!Array.isArray(list) || !list.length) return null;
    localStorage.setItem('e2e.stt', JSON.stringify([...list.slice(1), list[0]]));
    return String(list[0]);
  } catch {
    return null;
  }
}

/** One utterance through Safari's recogniser (backends/webkit.ts): its text, ms from the speech's end to the result,
 *  the speech's length; or its error code. `withCapture`: our own capture open meanwhile (do both work at once?). */
export async function webkitOnce(withCapture: boolean): Promise<Heard> {
  const stub = stubbed();
  if (stub !== null) return { text: stub, ms: 1, audS: 1 };
  if (!('webkitSpeechRecognition' in window)) return { err: 'other' };
  const cap = withCapture ? await openRec({ aec: true }).catch(() => null) : null;
  try {
    return await webkitUtterance().done;
  } finally {
    cap?.stop();
  }
}

// ---- 6. the relay ----------------------------------------------------------------------------------------------------

/** A take as WAV to the relay's Workers AI (backends/relay.ts): the text and the round trip (ms); or the error. */
export async function relayOnce(body: Uint8Array): Promise<Heard> {
  const r = await postWav(body);
  if (r.ok) return { text: r.text, ms: r.ms, audS: Math.round(((body.length - 44) / 32000) * 10) / 10 };
  return { err: r.miss === 'timeout' ? 'timeout' : r.miss === 'network' ? 'network' : 'other' };
}
