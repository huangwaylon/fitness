// Framework step 8b's parity check (docs/kikimimi-framework.md §9): every session.test scenario's intent script fed to
// the old QuizSession and to the round session over the quiz's GameDefs (on the `quiz` wire) side by side, their
// outputs and their views compared at every step. QuizSession goes once this holds.
import { expect } from 'vitest';
import { mulberry32 } from '#lib/random.ts';
import { QuizSession, quizLink, wireQuiz } from '../session.ts';
import { roundMaker, scenarios, type Maker, type Sess } from './session.scenarios.ts';
import type { QuizView } from '../games/quiz/view.ts';
import type { Live } from '../../sync/live.ts';

/** The view as the old session had it (the new one adds its game, options and unit). */
const asOld = ({ gm: _gm, o: _o, u: _u, ...v }: QuizView) => v;

/** Where each call's `now` is. */
const NOW: Record<keyof Sess, number> = {
  receive: 1, presence: 1, tick: 0, open: 1, invite: 0, configure: 1, join: 0, leave: 0, go: 0, answer: 2, next: 0, ready: 0, close: 0, view: 0
};

let steps = 0;

/** Both sessions, every call to each, the outputs and then the views compared. */
function twin(a: QuizSession, b: Sess, who: string): Sess {
  const call = (k: keyof Sess) => (...args: unknown[]) => {
    const x = (a[k] as (...z: unknown[]) => unknown)(...args);
    const y = (b[k] as (...z: unknown[]) => unknown)(...args);
    const now = args[NOW[k]] as number;
    const at = `${who}.${k} #${++steps}`;
    if (k === 'view') {
      expect(asOld(y as QuizView), at).toEqual(x);
      return x;
    }
    expect(y, `${at}: outputs`).toEqual(x);
    expect(asOld(b.view(now)), `${at}: view`).toEqual(a.view(now));
    return x;
  };
  return Object.fromEntries((Object.keys(NOW) as (keyof Sess)[]).map((k) => [k, call(k)])) as unknown as Sess;
}

/** Each pair the same random sequence (Math.random's, where a scenario gives none, would differ). */
let pairs = 0;
const both: Maker = {
  make: (o) => {
    const k = ++pairs, random = o.random ?? (() => mulberry32(k));
    return twin(new QuizSession({ me: o.me, deckOf: o.deckOf, windows: o.windows, random: random() }), roundMaker.make({ ...o, random }), o.me);
  },
  wired(o, live, changed) {
    // the old one on the Live itself; the new one on a shadow of it whose sends are compared with the old's
    const old = new QuizSession({ me: o.me, deckOf: o.deckOf });
    const sent: unknown[] = [], shadowed: unknown[] = [];
    const real: Pick<Live, 'send' | 'on' | 'onStatus' | 'serverNow'> = { ...live, send: (m) => (sent.push(m), live.send(m)) };
    const shadow: Pick<Live, 'send' | 'on' | 'onStatus' | 'serverNow'> = { ...live, send: (m) => shadowed.push(m) > 0 };
    const ow = wireQuiz(old, quizLink(real), changed);
    const n = roundMaker.wired(o, shadow, () => expect(shadowed).toEqual(sent));
    const s = twin(old, n.s, o.me);
    return {
      s,
      w: {
        act: (f) => {
          ow.act((x, now) => f(x as unknown as Sess, now) as never);
          n.w.act((x, now) => f(x, now));
          expect(shadowed).toEqual(sent);
        },
        tick: () => {
          ow.tick();
          n.w.tick();
          expect(shadowed).toEqual(sent);
        },
        stop: () => {
          ow.stop();
          n.w.stop();
        }
      }
    };
  }
};

scenarios(both);
