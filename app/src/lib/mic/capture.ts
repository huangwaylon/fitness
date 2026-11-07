// The mic's capture (docs/kikimimi-mic.md §3.1, §3.7): getUserMedia, its stream into the voice's audio context (one
// clock for the clips and the mic: sound.svelte.ts audioCtx) through the capture worklet (capture.worklet.js), brought
// to 16 kHz mono, kept up to the take's cap, its level and the VAD (vad.ts) frame by frame. stop() releases the track
// at once (the orange dot goes off) and drops what was kept but what it returns. The browser half: session.ts owns
// when a capture opens and closes.
import workletUrl from './capture.worklet.js?url';
import { Pcm, SR, To16k, Vad, speechSpan, type VadState } from './vad.ts';

export interface Mic {
  /** The VAD's state, frame by frame (its level, speech, done). */
  readonly vad: VadState;
  /** The take's cap was reached. */
  readonly full: boolean;
  /** The track released and the graph torn down: the speech (16 kHz, with a little air; null: none was heard). */
  stop(): Float32Array | null;
}

const loaded = new WeakMap<BaseAudioContext, Promise<void>>();

/** The track's settings for speech: echo cancellation and the rest on (the clips may play while it records). */
const AUDIO: MediaTrackConstraints = { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 };

/** The mic opened on `ctx` (inside a tap, its context running): `frame` after each block (the VAD's state); at most
 *  `maxS` seconds kept. Rejects with getUserMedia's error (NotAllowedError: refused). */
export async function openMic(ctx: AudioContext, o: { maxS: number; frame?: (v: VadState) => void }): Promise<Mic> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: AUDIO });
  const tracks = () => stream.getTracks().forEach((t) => t.stop());
  try {
    if (!loaded.has(ctx)) loaded.set(ctx, ctx.audioWorklet.addModule(workletUrl));
    await loaded.get(ctx);
  } catch (e) {
    loaded.delete(ctx);
    tracks();
    throw e;
  }
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, 'mic-capture', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
  // pulled by the graph through a silent gain (nothing of the mic is heard)
  const mute = ctx.createGain();
  mute.gain.value = 0;
  src.connect(node).connect(mute).connect(ctx.destination);
  const to16 = new To16k(ctx.sampleRate), pcm = new Pcm(Math.ceil(o.maxS * SR)), vad = new Vad();
  let open = true;
  node.port.onmessage = (e: MessageEvent<Float32Array>) => {
    if (!open) return;
    const x = to16.push(e.data);
    pcm.push(x);
    o.frame?.(vad.push(x));
  };
  return {
    vad: vad.state,
    get full() {
      return pcm.full;
    },
    stop() {
      if (!open) return null;
      open = false;
      node.port.onmessage = null;
      node.port.postMessage('stop');
      src.disconnect();
      node.disconnect();
      mute.disconnect();
      tracks();
      const span = speechSpan(vad.state, pcm.length);
      return span ? pcm.slice(...span) : null;
    }
  };
}

export type Allowed = 'granted' | 'denied' | 'unsupported';

/** The permission asked (inside a tap): the mic opened and at once closed. */
export async function micAllowed(): Promise<Allowed> {
  if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
  try {
    (await navigator.mediaDevices.getUserMedia({ audio: AUDIO })).getTracks().forEach((t) => t.stop());
    return 'granted';
  } catch (e) {
    return e instanceof DOMException && e.name === 'NotFoundError' ? 'unsupported' : 'denied';
  }
}
