// The quiz family's lobby on a round session (docs/kikimimi.md "UI"): the quiz's sheet opens and configures a lobby in
// its own terms (a level, おなじへや, たいせん, スピード はしご, こたえる じかん; a unit's lesson dealt into my lobby kept
// alone), answers with a choice, and reads the quiz's view; underneath it's a RoundSession over the quiz, スピード はしご
// and lesson GameDefs. Pure.
import type { Who } from '../../../contract/live-protocol.ts';
import type { QuizLv } from '../../../contract/live-protocol.ts';
import type { QuizTimer } from '../../seed.ts';
import type { Wired } from '../../round/link.ts';
import { RoundSession, type RoundSessionOptions } from '../../round/session.ts';
import type { RoundIn, RoundOut } from '../../round/wire.ts';
import { lessonOpts } from '../lesson/def.ts';
import type { Lesson, Tier } from '../../lesson.ts';
import { quizOpts } from './def.ts';
import { quizView, type QuizView } from './view.ts';

/** A quiz lobby's settings (each optional in `configure`). */
export interface QuizSettings {
  lv: QuizLv;
  same?: boolean;
  vs?: boolean;
  /** スピード はしご (the game `ladder`). */
  ladder?: boolean;
  timer?: QuizTimer;
}

export class QuizRounds implements Wired {
  readonly round: RoundSession;

  constructor(o: RoundSessionOptions) {
    this.round = new RoundSession(o);
  }

  get me(): Who {
    return this.round.me;
  }

  receive(m: RoundIn, now: number): RoundOut[] {
    return this.round.receive(m, now);
  }
  presence(here: readonly Who[] | null, now: number): RoundOut[] {
    return this.round.presence(here, now);
  }
  tick(now: number): RoundOut[] {
    return this.round.tick(now);
  }

  /** Open a lobby of mine (the quiz at `lv`, or スピード はしご), on this phone only until `invite`. */
  open(o: QuizSettings, now: number): RoundOut[] {
    return this.round.open({ gm: o.ladder ? 'ladder' : 'quiz', o: quizOpts.encode({ lv: o.lv, timer: o.timer ?? 30 }), same: o.same, vs: o.vs }, now);
  }

  /** The host changes its lobby's level, おなじへや, たいせん, the mode (スピード はしご) or こたえる じかん (a lesson's
   *  stays a lesson, its level and timer the lobby's). */
  configure(p: Partial<QuizSettings>, now: number): RoundOut[] {
    const v = this.round.view(now);
    const cur = quizOpts.decode(v.o);
    if (!v.gm || !cur) return [];
    const gm = p.ladder === true ? 'ladder' : p.ladder === false && v.gm === 'ladder' ? 'quiz' : v.gm;
    const q = { lv: p.lv ?? cur.lv, timer: p.timer ?? cur.timer };
    const ls = gm === 'lesson' ? lessonOpts.decode(v.o) : null;
    const o = ls ? lessonOpts.encode({ ...ls, ...q }) : quizOpts.encode(q);
    return this.round.configure({ gm, o, same: p.same, vs: p.vs }, now);
  }

  /** A unit's lesson dealt into my lobby (lesson.ts lessonDeck by the lobby's seed, at my tier): the game `lesson`,
   *  its seed kept. Nothing on the wire (a lobby kept alone). */
  lesson(o: { u: string; lesson: Lesson; tier?: Tier }, now: number): RoundOut[] {
    const v = this.round.view(now);
    const q = quizOpts.decode(v.o);
    if (!v.gm || !q) return [];
    return this.round.configure({ gm: 'lesson', o: lessonOpts.encode({ ...q, lesson: o.lesson, ...(o.tier && { tier: o.tier }) }), u: o.u, seed: v.seed }, now);
  }

  /** Back from a lesson to the quiz at the lobby's level (its seed kept). */
  unlesson(now: number): RoundOut[] {
    const v = this.round.view(now);
    const q = quizOpts.decode(v.o);
    if (v.gm !== 'lesson' || !q) return [];
    return this.round.configure({ gm: 'quiz', o: quizOpts.encode(q), seed: v.seed }, now);
  }

  invite(now: number): RoundOut[] {
    return this.round.invite(now);
  }
  join(now: number, g?: string): RoundOut[] {
    return this.round.join(now, g);
  }
  leave(now: number): RoundOut[] {
    return this.round.leave(now);
  }
  go(now: number): RoundOut[] {
    return this.round.go(now);
  }
  /** My choice `k` (one tap, final). `rp`: I replayed or slowed it first (or how many times). */
  answer(k: number, rp: boolean | number, now: number): RoundOut[] {
    return this.round.answer(k, Number(rp), now);
  }
  next(now: number): RoundOut[] {
    return this.round.next(now);
  }
  ready(now: number): RoundOut[] {
    return this.round.ready(now);
  }
  close(now: number): void {
    this.round.close(now);
  }

  view(now: number): QuizView {
    return quizView(this.round.view(now));
  }
}
