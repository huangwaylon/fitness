// ききみみ クイズ's state machine (docs/kikimimi.md "Sync"): pure (no I/O, no timers, no clock of its own). It folds
// the quiz intents heard (live.on), who is here (live status().here) and the relay's clock (live.serverNow(), passed in
// as `now` to every call) into a view: {phase, players, answers, scores, i, …}. The schedule is computed, not driven:
// from `go`'s `at` and each question's clip length every phone works out every question's start on its own; the host's
// `skip` re-bases it from a question on. Each call returns the intents to send (my taps, the host's skips and its
// re-sends when someone comes back), which the caller hands to live.send; the UI only renders `view(now)`.
// The deck comes in through an interface (QuizDeck), never the bank itself.
import type { Live } from '../sync/live.ts';
import { QUIZ_MAX_S, QUIZ_QS, type QuizLv, type QuizWire, type Relayed, type Who } from '../contract/live-protocol.ts';

/** Where a game is: none (`idle`, an invite perhaps), the lobby, the 3-2-1, a question's lead-in (the villager pops
 *  in), its clip playing, its answer window, its reveal, the results. */
export type QuizPhase = 'idle' | 'lobby' | 'countdown' | 'lead' | 'play' | 'answer' | 'reveal' | 'results';

/** What the session needs of a game's deck (kikimimi/deck.ts deck(seed, lv), its clips' lengths from clips.json): how
 *  many questions, each one's clip length (ms) and its right choice (after the deck's shuffle). */
export interface QuizDeck {
  count: number;
  dur(i: number): number;
  answer(i: number): number;
}
/** The deck every phone builds from an `open`'s seed and level. */
export type DeckOf = (seed: number, lv: QuizLv) => QuizDeck;

/** The schedule's windows (ms), the same on every phone (?kikimimi=fast: FAST_WINDOWS on all of them). */
export interface QuizWindows {
  /** `go`'s `at` is the host's now + this (the 3-2-1). */
  countdown: number;
  /** A question's lead-in before its clip. */
  lead: number;
  /** The time limit, from the clip's end. */
  answer: number;
  /** The reveal. */
  reveal: number;
  /** A `go` or `skip` heard at most this late plays at once (from when it's heard); later, the questions whose clip
   *  already began are sat out. */
  late: number;
  /** A lobby not started within this of its `open` is dropped. */
  openTtl: number;
  /** A lobby whose host has been away this long is dropped (a moment's reconnect keeps it). */
  hostGrace: number;
}
/** @public (UI, phase 2) */
export const WINDOWS: QuizWindows = { countdown: 4000, lead: 1500, answer: 15_000, reveal: 8000, late: 5000, openTtl: 600_000, hostGrace: 15_000 };
/** The `?kikimimi=fast` test hook's: shorter answer and reveal windows. @public (UI, phase 2) */
export const FAST_WINDOWS: QuizWindows = { ...WINDOWS, answer: 3000, reveal: 1500 };

/** A quiz intent to send (live.send), and one heard (live.on). */
export type QuizOut = { kind: 'quiz' } & QuizWire;
export type QuizIn = Extract<Relayed, { kind: 'quiz' }>;

/** A question's points (docs/kikimimi.md "Scoring"): right 100, and 30 more with no replay or slow play (「1かいで！」);
 *  wrong or timed out 0. 8 × 130 = QUIZ_MAX_S. */
export const points = (right: boolean, rp: boolean): number => (right ? 100 + (rp ? 0 : 30) : 0);

/** @public (UI, phase 2) An answer: the choice, whether the clip was replayed or slowed first, when it was given or heard (relay clock). */
export interface QuizAnswer {
  k: number;
  rp: boolean;
  t: number;
}

/** @public (UI, phase 2) A player in the game: here or away (a locked phone), whether they answered the current question (never what,
 *  until its reveal: `pick` then), their score. */
export interface QuizPlayer {
  who: Who;
  here: boolean;
  answered: boolean;
  /** Their choice for the current question, in its reveal only (and whether it was right). */
  pick?: { k: number; ok: boolean };
  score: number;
}

/** @public (UI, phase 2) A lobby or game someone else opened that I haven't joined: the invite banner's. */
export interface QuizInvite {
  g: string;
  host: Who;
  lv: QuizLv;
  same: boolean;
  /** It's already going (さんか joins at the next question). */
  started: boolean;
}

/** Why my game went away: the host cancelled it, the host left the lobby, or it was never started. */
export type QuizNotice = 'cancelled' | 'host-left' | 'stale';

export interface QuizView {
  phase: QuizPhase;
  /** My game (joined), else null. */
  g: string | null;
  host: Who | null;
  amHost: boolean;
  lv: QuizLv;
  same: boolean;
  seed: number;
  /** Whether this phone plays the clips (おなじへや: the host's only). */
  speaks: boolean;
  /** Who joined, A B G order. */
  players: QuizPlayer[];
  /** The current question (0-based), -1 before the first. */
  i: number;
  /** The game's questions. */
  n: number;
  /** The phase's span on the relay's clock (the lobby, idle and the results: `until` Infinity). */
  from: number;
  until: number;
  /** The current question's clip start and end, and its time limit (relay clock). */
  playAt: number;
  playEnd: number;
  limit: number;
  /** This question is sat out (its clip began before this phone was in: a late `go`, a rejoin, a join mid-game). */
  out: boolean;
  /** My answer to each question (null: none), for the reveal and the review list. */
  answers: (QuizAnswer | null)[];
  scores: Partial<Record<Who, number>>;
  /** The host may tap つぎへ (its reveal). */
  canNext: boolean;
  invite: QuizInvite | null;
  notice: QuizNotice | null;
}

interface Game {
  g: string;
  host: Who;
  seed: number;
  lv: QuizLv;
  same: boolean;
  deck: QuizDeck;
  n: number;
  /** When this phone first heard of it (the lobby's TTL). */
  opened: number;
  /** Who joined (the host too). */
  joined: Set<Who>;
  /** `go`'s `at` as sent (the host's re-send). */
  goAt?: number;
  /** Question starts this phone fixed (`go`: 0; a `skip`: its i), the rest follow from the one before. */
  starts: Map<number, number>;
  /** When this phone came into the schedule: questions whose clip began before are sat out. */
  inAt: number;
  answers: Map<Who, Map<number, QuizAnswer>>;
  /** Each other player's latest running total (`a`'s `s`): a lost `a` is made up by the next. */
  totals: Map<Who, { i: number; s: number }>;
  /** When everyone joined and here had answered question i (its early reveal). */
  allIn: Map<number, number>;
  /** The host's last skip (its re-send). */
  lastSkip?: { i: number; at: number };
  /** The last question's reveal cut short (the host's つぎへ): the results from then. */
  done?: number;
}

const ORDER: readonly Who[] = ['A', 'B', 'G'];
const GAME_ID = 'abcdefghijklmnopqrstuvwxyz0123456789';

export interface QuizSessionOptions {
  me: Who;
  deckOf: DeckOf;
  windows?: Partial<QuizWindows>;
  /** For the game id and seed (tests: a fixed one). */
  random?: () => number;
}

/** One phone's quiz: every game it hears of, the one it's in. */
export class QuizSession {
  readonly me: Who;
  readonly w: QuizWindows;
  private readonly deckOf: DeckOf;
  private readonly random: () => number;
  private games = new Map<string, Game>();
  /** The others here now, and since when each other has been away. */
  private here = new Set<Who>();
  private away = new Map<Who, number>();
  /** Joins heard before their game's `open` (a re-send's race). */
  private early = new Map<string, Set<Who>>();
  /** Games I left: their later messages are ignored. */
  private left = new Set<string>();
  private notice: QuizNotice | null = null;

  constructor(o: QuizSessionOptions) {
    this.me = o.me;
    this.deckOf = o.deckOf;
    this.w = { ...WINDOWS, ...o.windows };
    this.random = o.random ?? Math.random;
  }

  // ---------- what's heard ----------

  /** A quiz intent from another phone. */
  receive(m: QuizIn, now: number): QuizOut[] {
    if (m.who === this.me || this.left.has(m.g)) return [];
    this.prune(now);
    const gm = this.games.get(m.g);
    switch (m.op) {
      case 'open': {
        if (gm) {
          // the host's re-send, or its lobby's level or おなじへや changed
          if (gm.host === m.who && gm.goAt === undefined && (gm.seed !== m.seed || gm.lv !== m.lv || gm.same !== m.same)) this.setup(gm, m.seed, m.lv, m.same);
          return [];
        }
        // a host has one lobby: an older one of theirs not started goes
        for (const o of this.games.values()) if (o.host === m.who && o.goAt === undefined) this.drop(o, 'cancelled');
        const fresh = this.game(m.g, m.who, m.seed, m.lv, m.same, now);
        for (const w of this.early.get(m.g) ?? []) fresh.joined.add(w);
        this.early.delete(m.g);
        return [];
      }
      case 'join':
        if (gm) gm.joined.add(m.who);
        else {
          if (this.early.size > 8) this.early.clear();
          this.early.set(m.g, (this.early.get(m.g) ?? new Set()).add(m.who));
        }
        return [];
      case 'leave':
        if (!gm) return [];
        gm.joined.delete(m.who);
        if (m.who === gm.host && gm.goAt === undefined) {
          this.drop(gm, 'host-left');
          return [];
        }
        return this.checkNow(gm, now);
      case 'end':
        if (gm && m.who === gm.host && !this.over(gm, now)) this.drop(gm, 'cancelled');
        return [];
      case 'go':
        if (gm && m.who === gm.host && gm.goAt === undefined) {
          gm.goAt = m.at;
          this.anchor(gm, 0, m.at, now);
        }
        return [];
      case 'skip':
        // a question not started here yet (a re-send of one that has: nothing)
        if (gm && m.who === gm.host && gm.goAt !== undefined && m.i < gm.n && now < this.start(gm, m.i)) this.anchor(gm, m.i, m.at, now);
        return [];
      case 'a': {
        if (!gm || m.i >= gm.n) return [];
        gm.joined.add(m.who);
        const mine = gm.answers.get(m.who) ?? new Map<number, QuizAnswer>();
        gm.answers.set(m.who, mine);
        if (!mine.has(m.i)) mine.set(m.i, { k: m.k, rp: m.rp, t: now });
        const was = gm.totals.get(m.who);
        if (!was || m.i >= was.i) gm.totals.set(m.who, { i: m.i, s: m.s });
        return this.check(gm, m.i, now);
      }
    }
  }

  /** Who else is here (live status().here). Someone back: the host re-sends its `open` (and once started `go` and
   *  its last `skip`), a player its `join`, so a phone back from a lock rejoins the schedule. Someone gone: they no
   *  longer hold up the early reveal. */
  presence(here: readonly Who[], now: number): QuizOut[] {
    const next = new Set(here.filter((w) => w !== this.me));
    const back = [...next].filter((w) => !this.here.has(w));
    const gone = [...this.here].filter((w) => !next.has(w));
    for (const w of gone) this.away.set(w, now);
    for (const w of back) this.away.delete(w);
    this.here = next;
    this.prune(now);
    const out: QuizOut[] = [];
    const gm = this.mine();
    if (!gm || this.over(gm, now)) return out;
    if (back.length) {
      if (gm.host === this.me) {
        out.push({ kind: 'quiz', g: gm.g, op: 'open', seed: gm.seed, lv: gm.lv, same: gm.same });
        if (gm.goAt !== undefined) out.push({ kind: 'quiz', g: gm.g, op: 'go', at: gm.goAt });
        if (gm.lastSkip) out.push({ kind: 'quiz', g: gm.g, op: 'skip', ...gm.lastSkip });
      } else out.push({ kind: 'quiz', g: gm.g, op: 'join' });
    }
    if (gone.length) out.push(...this.checkNow(gm, now));
    return out;
  }

  // ---------- my taps ----------

  /** Open a lobby (せってい's あそぶ, then the level): I'm its host. Leaves the game I was in. */
  open(o: { lv: QuizLv; same?: boolean }, now: number): QuizOut[] {
    const out = this.leave(now);
    this.notice = null;
    let g = '';
    do {
      g = '';
      for (let n = 0; n < 6; n++) g += GAME_ID[Math.floor(this.random() * GAME_ID.length) % GAME_ID.length];
    } while (this.games.has(g));
    const seed = Math.floor(this.random() * 2 ** 32) >>> 0;
    const gm = this.game(g, this.me, seed, o.lv, o.same ?? false, now);
    gm.joined.add(this.me);
    out.push({ kind: 'quiz', g, op: 'open', seed, lv: gm.lv, same: gm.same });
    return out;
  }

  /** The host changes its lobby's level or おなじへや (sent again as an `open`). */
  configure(o: { lv?: QuizLv; same?: boolean }, now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || gm.goAt !== undefined) return [];
    this.setup(gm, gm.seed, o.lv ?? gm.lv, o.same ?? gm.same);
    return [{ kind: 'quiz', g: gm.g, op: 'open', seed: gm.seed, lv: gm.lv, same: gm.same }];
  }

  /** Join the invite (さんか; a game already going: from its next question). Leaves the game I was in. */
  join(now: number, g?: string): QuizOut[] {
    this.prune(now);
    const gm = g !== undefined ? this.games.get(g) : this.offer(now);
    if (!gm || gm.joined.has(this.me) || this.over(gm, now)) return [];
    const out = this.leave(now);
    this.notice = null;
    gm.joined.add(this.me);
    gm.inAt = now;
    out.push({ kind: 'quiz', g: gm.g, op: 'join' });
    return out;
  }

  /** Leave my game (✕): the host's lobby is cancelled (`end`); a game going goes on for the others, the host's too. */
  leave(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm) return [];
    this.games.delete(gm.g);
    this.left.add(gm.g);
    if (this.over(gm, now)) return [];
    return [{ kind: 'quiz', g: gm.g, op: gm.host === this.me && gm.goAt === undefined ? 'end' : 'leave' }];
  }

  /** The host cancels the game for everyone. */
  end(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me) return [];
    this.games.delete(gm.g);
    this.left.add(gm.g);
    return this.over(gm, now) ? [] : [{ kind: 'quiz', g: gm.g, op: 'end' }];
  }

  /** The host starts the game (はじめる): the 3-2-1, then question 0 at now + the countdown. */
  go(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me || gm.goAt !== undefined) return [];
    const at = now + this.w.countdown;
    gm.goAt = at;
    gm.starts.set(0, at);
    return [{ kind: 'quiz', g: gm.g, op: 'go', at }];
  }

  /** My answer to the current question (one tap, final; in its answer window only). `rp`: I replayed or slowed it. */
  answer(k: number, rp: boolean, now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || !Number.isInteger(k) || k < 0 || k > 3) return [];
    const at = this.at(gm, now);
    if (at.phase !== 'answer' || at.out) return [];
    const mine = gm.answers.get(this.me) ?? new Map<number, QuizAnswer>();
    gm.answers.set(this.me, mine);
    if (mine.has(at.i)) return [];
    mine.set(at.i, { k, rp, t: now });
    const s = Math.min(QUIZ_MAX_S, this.myScore(gm));
    return [{ kind: 'quiz', g: gm.g, op: 'a', i: at.i, k, rp, s }, ...this.check(gm, at.i, now)];
  }

  /** The host's つぎへ in a reveal: the next question now (the last's: the results). */
  next(now: number): QuizOut[] {
    this.prune(now);
    const gm = this.mine();
    if (!gm || gm.host !== this.me) return [];
    const at = this.at(gm, now);
    if (at.phase !== 'reveal') return [];
    if (at.i === gm.n - 1) {
      gm.done = now;
      return [];
    }
    return this.skip(gm, at.i + 1, now);
  }

  /** Done with the results or a notice: back to idle. */
  close(now: number): void {
    this.prune(now);
    this.notice = null;
    const gm = this.mine();
    if (gm && this.over(gm, now)) this.games.delete(gm.g);
  }

  // ---------- the view ----------

  view(now: number): QuizView {
    this.prune(now);
    const gm = this.mine();
    const none: QuizView = {
      phase: 'idle', g: null, host: null, amHost: false, lv: 1, same: false, seed: 0, speaks: true, players: [], i: -1, n: 0, from: 0, until: Infinity,
      playAt: 0, playEnd: 0, limit: 0, out: false, answers: [], scores: {}, canNext: false, invite: null, notice: this.notice
    };
    if (!gm) {
      const o = this.offer(now);
      return o ? { ...none, invite: { g: o.g, host: o.host, lv: o.lv, same: o.same, started: o.goAt !== undefined } } : none;
    }
    const at = this.at(gm, now);
    const scores: Partial<Record<Who, number>> = {};
    for (const w of gm.joined) scores[w] = this.scoreOf(gm, w);
    const reveal = at.phase === 'reveal' || at.phase === 'results';
    const players = ORDER.filter((w) => gm.joined.has(w)).map((who): QuizPlayer => {
      const a = at.i >= 0 ? gm.answers.get(who)?.get(at.i) : undefined;
      return {
        who, here: who === this.me || this.here.has(who), answered: !!a, score: scores[who] ?? 0,
        ...(a && reveal ? { pick: { k: a.k, ok: a.k === gm.deck.answer(at.i) } } : {})
      };
    });
    const mine = gm.answers.get(this.me);
    return {
      ...none, phase: at.phase, g: gm.g, host: gm.host, amHost: gm.host === this.me, lv: gm.lv, same: gm.same, seed: gm.seed,
      speaks: !gm.same || gm.host === this.me, players, i: at.i, n: gm.n, from: at.from, until: at.until, playAt: at.playAt, playEnd: at.playEnd,
      limit: at.limit, out: at.out, answers: Array.from({ length: gm.n }, (_, i) => mine?.get(i) ?? null), scores,
      canNext: gm.host === this.me && at.phase === 'reveal'
    };
  }

  // ---------- inside ----------

  private game(g: string, host: Who, seed: number, lv: QuizLv, same: boolean, now: number): Game {
    const gm: Game = {
      g, host, seed, lv, same, deck: this.deckOf(seed, lv), n: 0, opened: now, joined: new Set([host]), starts: new Map(), inAt: now,
      answers: new Map(), totals: new Map(), allIn: new Map()
    };
    gm.n = Math.max(0, Math.min(QUIZ_QS, gm.deck.count));
    this.games.set(g, gm);
    return gm;
  }

  private setup(gm: Game, seed: number, lv: QuizLv, same: boolean): void {
    if (seed !== gm.seed || lv !== gm.lv) {
      gm.deck = this.deckOf(seed, lv);
      gm.n = Math.max(0, Math.min(QUIZ_QS, gm.deck.count));
    }
    Object.assign(gm, { seed, lv, same });
  }

  /** The game I'm in. */
  private mine(): Game | undefined {
    for (const gm of this.games.values()) if (gm.joined.has(this.me)) return gm;
    return undefined;
  }

  /** The newest game someone here opened that I'm not in and that's still going. */
  private offer(now: number): Game | undefined {
    let best: Game | undefined;
    for (const gm of this.games.values())
      if (!gm.joined.has(this.me) && this.here.has(gm.host) && !this.over(gm, now) && (!best || gm.opened >= best.opened)) best = gm;
    return best;
  }

  private drop(gm: Game, why: QuizNotice): void {
    this.games.delete(gm.g);
    if (gm.joined.has(this.me)) this.notice = why;
  }

  /** A lobby never started (10 min) or whose host is gone goes; a game over that I'm not in goes. */
  private prune(now: number): void {
    for (const gm of [...this.games.values()]) {
      if (gm.goAt === undefined) {
        const gone = gm.host !== this.me && !this.here.has(gm.host) && now - (this.away.get(gm.host) ?? gm.opened) >= this.w.hostGrace;
        if (gone) this.drop(gm, 'host-left');
        else if (now - gm.opened >= this.w.openTtl) this.drop(gm, 'stale');
      } else if (!gm.joined.has(this.me) && this.over(gm, now)) this.games.delete(gm.g);
    }
  }

  /** Question i starts at `at` (a `go`'s 0, a `skip`'s i), heard at `now`: on time as it says; at most `late` late, at
   *  once (from now); later, as it says, and the questions whose clip began before now are sat out. */
  private anchor(gm: Game, i: number, at: number, now: number): void {
    const late = now - at;
    let start = at;
    if (late > this.w.late) gm.inAt = Math.max(gm.inAt, now);
    else if (late > 0) start = now;
    gm.starts.set(i, start);
    for (const j of [...gm.starts.keys()]) if (j > i) gm.starts.delete(j);
  }

  /** The host's skip to question i at `at` (applied here, sent to the others) when it's sooner than the schedule. */
  private skip(gm: Game, i: number, at: number): QuizOut[] {
    if (i >= gm.n || at >= this.start(gm, i)) return [];
    gm.starts.set(i, at);
    for (const j of [...gm.starts.keys()]) if (j > i) gm.starts.delete(j);
    gm.lastSkip = { i, at };
    return [{ kind: 'quiz', g: gm.g, op: 'skip', i, at }];
  }

  /** A full question: lead-in, clip, answer window, reveal. */
  private full(gm: Game, i: number): number {
    return this.w.lead + Math.max(0, gm.deck.dur(i)) + this.w.answer + this.w.reveal;
  }

  /** When question i starts on this phone (i = n: the end of the schedule, without the last reveal cut short). */
  private start(gm: Game, i: number): number {
    let s = gm.starts.get(0) ?? gm.goAt ?? Infinity;
    for (let j = 1; j <= i; j++) s = gm.starts.get(j) ?? s + this.full(gm, j - 1);
    return s;
  }

  /** Question i's times: its start, clip, limit, reveal and end (the next's start; the last's: its reveal's end). */
  private times(gm: Game, i: number) {
    const start = this.start(gm, i);
    const playAt = start + this.w.lead;
    const playEnd = playAt + Math.max(0, gm.deck.dur(i));
    const limit = playEnd + this.w.answer;
    const last = i === gm.n - 1;
    const nextAt = last ? Infinity : this.start(gm, i + 1);
    const reveal = Math.max(playEnd, Math.min(limit, gm.allIn.get(i) ?? Infinity, nextAt - this.w.reveal));
    const end = last ? Math.min(gm.done ?? Infinity, reveal + this.w.reveal) : nextAt;
    return { start, playAt, playEnd, limit, reveal, end };
  }

  /** Where the game is at `now`. */
  private at(gm: Game, now: number): { phase: QuizPhase; i: number; from: number; until: number; playAt: number; playEnd: number; limit: number; out: boolean } {
    const base = { i: -1, from: gm.opened, until: Infinity, playAt: 0, playEnd: 0, limit: 0, out: false };
    if (gm.goAt === undefined || gm.n === 0) return { ...base, phase: gm.n === 0 && gm.goAt !== undefined ? 'results' : 'lobby' };
    const s0 = this.start(gm, 0);
    if (now < s0) return { ...base, phase: 'countdown', from: s0 - this.w.countdown, until: s0 };
    let i = 0;
    while (i < gm.n - 1 && this.start(gm, i + 1) <= now) i++;
    const t = this.times(gm, i);
    const q = { i, playAt: t.playAt, playEnd: t.playEnd, limit: t.limit, out: t.playAt < gm.inAt };
    if (now >= t.end) return { ...base, phase: 'results', i: gm.n, from: t.end };
    if (now < t.playAt) return { ...q, phase: 'lead', from: t.start, until: t.playAt };
    if (now < t.playEnd) return { ...q, phase: 'play', from: t.playAt, until: t.playEnd };
    if (now < t.reveal) return { ...q, phase: 'answer', from: t.playEnd, until: t.reveal };
    return { ...q, phase: 'reveal', from: t.reveal, until: t.end };
  }

  private over(gm: Game, now: number): boolean {
    return gm.goAt !== undefined && this.at(gm, now).phase === 'results';
  }

  /** The current question's early reveal, when someone gone or leaving was the one not in. */
  private checkNow(gm: Game, now: number): QuizOut[] {
    if (gm.goAt === undefined) return [];
    const at = this.at(gm, now);
    return at.i >= 0 && at.i < gm.n ? this.check(gm, at.i, now) : [];
  }

  /** Everyone joined and here has answered question i: its reveal starts now (here), and the host skips the next
   *  question to the reveal's end. */
  private check(gm: Game, i: number, now: number): QuizOut[] {
    if (gm.allIn.has(i) || !gm.joined.has(this.me) || gm.goAt === undefined) return [];
    const players = [...gm.joined].filter((w) => w === this.me || this.here.has(w));
    if (!players.every((w) => gm.answers.get(w)?.has(i))) return [];
    gm.allIn.set(i, now);
    if (gm.host !== this.me || i >= gm.n - 1) return [];
    return this.skip(gm, i + 1, this.times(gm, i).reveal + this.w.reveal);
  }

  private myScore(gm: Game): number {
    let s = 0;
    for (const [i, a] of gm.answers.get(this.me) ?? []) s += points(a.k === gm.deck.answer(i), a.rp);
    return s;
  }

  /** Mine counted here; another's their latest running total (else what I heard of theirs). */
  private scoreOf(gm: Game, w: Who): number {
    if (w === this.me) return this.myScore(gm);
    const t = gm.totals.get(w);
    if (t) return t.s;
    let s = 0;
    for (const [i, a] of gm.answers.get(w) ?? []) s += points(a.k === gm.deck.answer(i), a.rp);
    return s;
  }
}

// ---------- the wiring (the UI's) ----------

/** What the session needs of the island's Live (relay ?? demoRelay, IslandScene: never a second one). */
export interface QuizLink {
  /** The relay's clock. */
  now(): number;
  send(m: QuizOut): boolean;
  /** Quiz intents heard. */
  on(fn: (m: QuizIn) => void): () => void;
  /** Who else is here (called at once). */
  onHere(fn: (here: readonly Who[]) => void): () => void;
}

/** A Live as a QuizLink. @public (UI, phase 2) */
export function quizLink(live: Pick<Live, 'send' | 'on' | 'onStatus' | 'serverNow'>): QuizLink {
  return {
    now: () => live.serverNow(),
    send: (m) => live.send(m),
    on: (fn) => live.on((m) => void (m.kind === 'quiz' && fn(m))),
    onHere: (fn) => {
      let was = '';
      return live.onStatus((st) => {
        const key = st.connected ? st.here.join() : '-';
        if (key === was) return;
        was = key;
        fn(st.connected ? st.here : []);
      });
    }
  };
}

/** Wire a session to a link: what's heard and who's here go in (their outputs sent), `changed` after each. The UI's
 *  taps go through `act` (`act((s, now) => s.answer(k, rp, now))`). @public (UI, phase 2) */
export function wireQuiz(session: QuizSession, link: QuizLink, changed: () => void): { act(f: (s: QuizSession, now: number) => QuizOut[] | void): void; stop(): void } {
  const send = (out: QuizOut[] | void) => {
    for (const m of out ?? []) link.send(m);
    changed();
  };
  const offs = [link.on((m) => send(session.receive(m, link.now()))), link.onHere((here) => send(session.presence(here, link.now())))];
  return {
    act: (f) => send(f(session, link.now())),
    stop: () => {
      for (const off of offs) off();
    }
  };
}
