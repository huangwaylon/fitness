// ききみみ's test recogniser (docs/kikimimi-mic.md "Tests"): what it "hears" is scripted in `localStorage['e2e.stt']`, a
// JSON list, one entry a take, taken in turn (the list rotates): a string (the text heard), or `{ text?, cand?, miss? }`
// (whisper's candidate scores; a Miss such as 'capped'). Inert without it (recogniser() picks it only then). A take still
// opens the mic and ends as any other (the fake device's clip, the VAD, stop, cancel), so the flow is the real one;
// whatever the capture got, the script answers, but a cancel is `aborted`. Nothing is fetched, no Worker runs.
import { stubNext } from '../pick.ts';
import { isMiss, type Capture, type Miss, type Outcome, type Recogniser } from '../stt.ts';

type Line = string | { text?: string; cand?: number[]; miss?: Miss };

/** The script's next entry as an outcome (the list rotated), or a miss when there's none. */
function next(): Outcome {
  try {
    const l = stubNext() as Line | undefined;
    if (l === undefined) return { miss: 'other', be: 'stub' };
    if (typeof l === 'string') return { text: l, ms: 1, be: 'stub' };
    if (l?.miss) return { miss: l.miss, be: 'stub' };
    return { text: String(l?.text ?? ''), ...(Array.isArray(l?.cand) ? { cand: l.cand.map(Number) } : {}), ms: 1, be: 'stub' };
  } catch {
    return { miss: 'other', be: 'stub' };
  }
}

export function stubRecogniser(cap: Capture): Recogniser {
  return {
    be: 'stub',
    ready: async () => true,
    listen(h = {}) {
      let line: Outcome | null = null;
      const answer = () => (line ??= next());
      const t = cap('stub', h, async () => answer());
      const heard = t.heard.then((o) => (isMiss(o) && o.miss === 'aborted' ? o : answer()));
      return { get level() { return t.level; }, heard, stop: () => (t.stop(), heard), cancel: () => t.cancel() };
    },
    dispose() {}
  };
}
