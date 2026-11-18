// A ぶん or 絵 turn's two tries (docs/sugoroku.md "Rules"): a first miss shows 「おしい！」 a moment (the wrong order or
// spelling left in view), then the tiles go back for one more go; a second miss is 答えはこれ. Over the turn's view
// (view.ts), whatever object it is now (a watching phone's is replaced by the player's).
import type { Stage } from './view.ts';

/** How long 「おしい！」 shows the miss before the tiles go back. */
const MISS_MS = 900;
/** A turn's stage from the misses kept (a sheet reopened mid-turn). */
export const stageOf = (misses: number): Stage => (misses >= 2 ? 'answer' : 'try');

export function tries(view: () => { stage: Stage; misses: number }) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return {
    /** A miss: `ontry` keeps the misses; after the first, `again` sets the tiles back once 「おしい！」 has shown. */
    miss(ontry: (misses: number) => void, again: () => void): void {
      const v = view();
      if (v.misses >= 1) return void ((v.misses = 2), (v.stage = 'answer'), ontry(2));
      v.misses = 1;
      v.stage = 'miss';
      ontry(1);
      timer = setTimeout(() => (again(), (view().stage = 'try')), MISS_MS);
    },
    stop: (): void => clearTimeout(timer)
  };
}
