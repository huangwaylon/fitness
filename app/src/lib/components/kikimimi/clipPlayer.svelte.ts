// A ききみみ game's clips on this phone (docs/kikimimi.md "Audio"; game.svelte.ts): each question's played at its start
// on the relay's clock (playVoice's relayAt), the next one fetched meanwhile, the reveal's replay, the player's 🔁 / 🐢
// and a review row's ▶︎. A dialogue's lines are a sequence of clips (playSequence: each line scheduled on the relay's
// clock after the one before, LINE_GAP apart; the session's schedule has their summed length, clips.ts itemDur), and
// `talk` follows its turns on every phone.
import { clipIds, isDialogue, type Item } from '#lib/kikimimi/bank.ts';
import { clipDur, sequenceStarts } from '#lib/kikimimi/clips.ts';
import type { QuizView } from '#lib/kikimimi/session.ts';
import { TEST_CLIP } from '#lib/kikimimi/pool.ts';
import { playVoice } from '#lib/sound/sound.svelte.ts';
import { prefetchClips, voiceClip } from './packs.ts';
import { preloadStage } from './scene/stage.ts';

type Handle = { stop(): void };

/** A dialogue's lines' lengths (s, clips.json; 2 s while one has no clip). */
const lineDurs = (it: Item): number[] => clipIds(it).map((id) => clipDur(id) ?? 2);

export class ClipPlayer {
  /** A replay sounding (🔁, 🐢, the reveal's, a review row's: i -1), on the relay's clock: the bubble's bar, the
   *  karaoke (`at` the item's id). */
  sounding = $state.raw<{ i: number; at: string; from: number; until: number; slow: boolean } | null>(null);
  /** A dialogue's line being spoken (its speaker bobs, its karaoke runs): question i (-1: a review row), line k of item
   *  `at`, started at `from` (the relay's clock); on every phone, from the schedule (おなじへや's others hear the host's). */
  talk = $state.raw<{ i: number; k: number; at: string; from: number } | null>(null);

  readonly #now: () => number;
  readonly #question: () => number;
  #handles = new Set<Handle>();
  /** The first play planned: its question and start (a `skip` moving it plans it again). */
  #planned: { i: number; at: number; h: Handle | null } | null = null;
  /** The question whose reveal replay was played, the deck whose clips were fetched, the first play whose lines'
   *  turns were planned (its question and start). */
  #revealed = -1;
  #fetched = '';
  #talked = '';
  #gone = false;
  #soundingTimer: ReturnType<typeof setTimeout> | undefined;
  #talkTimers: ReturnType<typeof setTimeout>[] = [];

  /** `now`: the relay's clock; `question`: the game's current question (a replay over the next one's is dropped). */
  constructor(now: () => number, question: () => number) {
    this.#now = now;
    this.#question = question;
  }

  /**
   * The clips a view calls for, at each refresh: the lobby's deck fetched, the first play planned on the relay's clock
   * (planned again when a `skip` moves it), a dialogue's turns, the reveal's replay; outside a game, silence.
   * `hidesLine`: a スピード はしご rung below the top (no replay at its reveal).
   */
  follow(v: QuizView, items: readonly Item[], now: number, hidesLine: (it: Item) => boolean): void {
    // the lobby: the deck's packs fetched (packs.ts: the first question's alone, then the rest; a level-1 deck's one
    // pack, ~0.7 MB, a level-4 deck's up to eight), the first clip decoded
    if (v.g && (v.phase === 'lobby' || v.phase === 'countdown') && this.#fetched !== `${v.seed}:${v.lv}` && items.length) {
      this.#fetched = `${v.seed}:${v.lv}`;
      prefetchClips(items.flatMap((it) => clipIds(it)));
      if (v.speaks) void voiceClip(clipIds(items[0])[0]);
      preloadStage(items[0]);
    }
    if (v.phase === 'idle' || v.phase === 'lobby' || v.phase === 'results') {
      if (this.#planned || this.#handles.size) this.#stopAll();
      this.#planned = null;
      this.#revealed = -1;
      this.#untalk();
      return;
    }
    const it = items[v.i];
    if (!it || v.i < 0) return;
    if (this.#planned && this.#planned.i !== v.i) {
      this.#stopAll();
      this.#planned = null;
    }
    // (untimed, a phone that came in after the clip: its first play now, once, not counted as a replay)
    const late = v.phase === 'answer' && !Number.isFinite(v.limit) && !v.answers[v.i] && this.#planned?.i !== v.i;
    const first = v.phase === 'lead' || v.phase === 'play' || late;
    if (first && v.speaks && !v.out && (!this.#planned || (this.#planned.at !== v.playAt && now < this.#planned.at) || late)) {
      this.#planned?.h?.stop();
      const plan: { i: number; at: number; h: Handle | null } = { i: v.i, at: v.playAt, h: null };
      this.#planned = plan;
      void this.#playSequence(it, late ? null : plan.at, () => this.#planned === plan).then((h) => (plan.h = h));
      // the next question's (first) clip decoded meanwhile (the engine keeps the last 4)
      const after = items[v.i + 1];
      if (after) void voiceClip(clipIds(after)[0]);
      // and its scene card's art (one question ahead: one backdrop on screen, the next in the image cache)
      preloadStage(after);
    }
    // a dialogue's turns (the speaker who bobs), from the schedule, on every phone
    if (first && !v.out && isDialogue(it) && this.#talked !== `${v.i}:${v.playAt}`) {
      this.#talked = `${v.i}:${v.playAt}`;
      this.#turns(it, v.i, v.playAt);
    }
    if (v.phase === 'reveal' && this.#revealed !== v.i) {
      this.#revealed = v.i;
      // (a スピード はしご rung below the top: no replay, the next rung's listen is the next, faster one)
      if (v.speaks && !v.out && !hidesLine(it)) void this.playNow(it, v.i, false);
    }
  }

  /** The deck was replaced (a practice deck, a lesson's, a solo game's): its clips fetched again in the lobby. */
  refetch(): void {
    this.#fetched = '';
  }

  /** An item's clips now (question i's, or -1: a review row's), over what sounds; `slow` but never a dialogue's. */
  async playNow(it: Item, i: number, slow: boolean): Promise<void> {
    const at = this.#question();
    // gone, or the game moved on while it loaded (a replay of the last question over the next one's clip: dropped)
    const h = await this.#playSequence(it, null, () => i < 0 || this.#question() === at, { slow: slow && !isDialogue(it), before: () => this.#stopAll(true) });
    if (!h) return;
    if (isDialogue(it)) this.#turns(it, i, h.from);
    const s = { i, at: it.id, from: h.from, until: h.from + h.ms, slow };
    this.sounding = s;
    clearTimeout(this.#soundingTimer);
    this.#soundingTimer = setTimeout(() => this.sounding === s && (this.sounding = null), h.ms + 50);
  }

  /** The lobby's 🔊 「きこえる？」: whether a clip could play (false: no voice session, interrupted). */
  async test(): Promise<boolean> {
    const buf = await voiceClip(TEST_CLIP);
    if (!buf || this.#gone) return false;
    this.#stopAll();
    return !!this.#track(playVoice(buf));
  }

  /** The game's over: every clip stops, nothing more plays. */
  dispose(): void {
    this.#gone = true;
    clearTimeout(this.#soundingTimer);
    this.#untalk();
    this.#stopAll();
  }

  /**
   * An item's clips played as one, from `at` on the relay's clock: a single clip, or a dialogue's lines each after the
   * one before with LINE_GAP between (sequenceStarts: heard late, a line over is skipped and the one under way plays
   * whole from now). Each line through playVoice; the buffers decoded first (all held here, whatever the engine's LRU
   * drops). `at` null: now, once decoded. `still()`: false once it's no longer wanted (the plan moved); `before()` runs
   * as it starts (a replay stops what sounds). One handle stops them all, with its start and length (ms).
   */
  async #playSequence(it: Item, at: number | null, still: () => boolean, o: { slow?: boolean; before?: () => void } = {}): Promise<(Handle & { from: number; ms: number }) | null> {
    const bufs = await Promise.all(clipIds(it).map((id) => voiceClip(id, o.slow)));
    if (bufs.some((b) => !b) || this.#gone || !still()) return null;
    o.before?.();
    const now = this.#now;
    const from = at ?? now();
    const starts = sequenceStarts(bufs.map((b) => b!.duration), from, now());
    const hs = bufs.flatMap((b, k) => (starts[k] < 0 ? [] : [this.#track(playVoice(b!, { relayAt: starts[k], now }))])).filter((h) => !!h);
    if (!hs.length) return null;
    const last = starts.length - 1;
    return { stop: () => hs.forEach((h) => h.stop()), from, ms: Math.max(0, starts[last] + bufs[last]!.duration * 1000 - from) };
  }

  /** A dialogue's turns from `from` (relay clock): `talk` follows its lines (clips.json lengths), then clears. */
  #turns(it: Item, i: number, from: number): void {
    this.#untalk();
    const now = this.#now();
    const durs = lineDurs(it), starts = sequenceStarts(durs, from, from); // the schedule as planned (none heard late)
    const ends = starts.map((start, k) => start + durs[k] * 1000);
    starts.forEach((start, k) => {
      if (ends[k] > now) this.#talkTimers.push(setTimeout(() => !this.#gone && (this.talk = { i, k, at: it.id, from: start }), Math.max(0, start - now)));
    });
    this.#talkTimers.push(setTimeout(() => !this.#gone && (this.talk = null), Math.max(0, ends.at(-1)! - now)));
  }

  #untalk(): void {
    for (const h of this.#talkTimers) clearTimeout(h);
    this.#talkTimers = [];
    this.talk = null;
  }

  #track(h: { stop(): void } | null): Handle | null {
    if (!h) return null;
    this.#handles.add(h);
    return h;
  }

  /** Every clip of mine stops (`keepPlan`: but the first play planned, when it's a replay over it: never, the
   *  replay buttons wait for its end). */
  #stopAll(keepPlan = false): void {
    for (const h of this.#handles) h.stop();
    this.#handles.clear();
    if (!keepPlan) this.#planned = this.#planned ? { ...this.#planned, h: null } : null;
    this.sounding = null;
  }
}
