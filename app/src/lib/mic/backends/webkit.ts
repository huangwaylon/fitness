// ききみみ's Safari recogniser (docs/kikimimi-mic.md "The Recogniser"): webkitSpeechRecognition, en-US, final results only, one
// utterance. It runs its own capture (not ours) and may send the audio to Apple, so it's used only when picked by hand
// in せってい, after its disclosure. No level meter, no word times. Ends on its own at the utterance's end, on stop (the
// result so far), cancel (aborted), or 15 s.
import { sttErr, type SttErr } from '../probe/steps.ts';
import type { Miss, Recogniser, Take } from '../stt.ts';

type Sr = {
  lang: string; interimResults: boolean; maxAlternatives: number; continuous: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((e: { results: { 0: { transcript: string } }[] }) => void) | null; onerror: ((e: { error: string }) => void) | null;
  onspeechstart: (() => void) | null; onspeechend: (() => void) | null; onend: (() => void) | null;
};

const CAP_MS = 15_000;

/** One utterance's outcome: its text, the ms from the speech's end to the result, the speech's length (s); or the
 *  error's code. */
export type Once = { text: string; ms: number; audS: number } | { err: SttErr };

/** One utterance through webkitSpeechRecognition (started now: inside a tap). */
export function webkitOnce(): { done: Promise<Once>; stop(): void; abort(): void } {
  const SR = (globalThis as unknown as { webkitSpeechRecognition?: new () => Sr }).webkitSpeechRecognition;
  if (!SR) return { done: Promise.resolve({ err: 'other' }), stop() {}, abort() {} };
  const r = new SR();
  Object.assign(r, { lang: 'en-US', interimResults: false, maxAlternatives: 1, continuous: false });
  let finish!: (o: Once) => void, settled = false, spoke = 0, ended = 0;
  const done = new Promise<Once>((res) => (finish = res));
  const t0 = performance.now();
  const end = (o: Once) => void (settled || ((settled = true), clearTimeout(cap), finish(o)));
  const cap = setTimeout(() => (r.abort(), end({ err: 'timeout' })), CAP_MS);
  r.onspeechstart = () => (spoke = performance.now());
  r.onspeechend = () => (ended = performance.now());
  r.onresult = (e) => {
    const now = performance.now();
    end({ text: e.results[0]?.[0]?.transcript ?? '', ms: Math.round(now - (ended || t0)), audS: Math.round(((ended || now) - (spoke || t0)) / 100) / 10 });
  };
  r.onerror = (e) => end({ err: sttErr(e.error) });
  r.onend = () => end({ err: 'no-speech' });
  try {
    r.start();
  } catch {
    end({ err: 'other' });
  }
  return { done, stop: () => r.stop(), abort: () => (r.abort(), end({ err: 'aborted' })) };
}

const missOf = (e: SttErr): Miss => (e === 'no-speech' ? 'none' : e === 'not-allowed' ? 'denied' : e === 'audio-capture' ? 'other' : e);

export function webkitRecogniser(): Recogniser {
  return {
    be: 'webkit',
    ready: async () => 'webkitSpeechRecognition' in globalThis,
    listen(): Take {
      const u = webkitOnce();
      const heard = u.done.then((o) => ('err' in o ? { miss: missOf(o.err), be: 'webkit' as const } : { text: o.text, ms: o.ms, be: 'webkit' as const }));
      return { level: 0, heard, stop: () => (u.stop(), heard), cancel: () => u.abort() };
    },
    dispose() {}
  };
}
