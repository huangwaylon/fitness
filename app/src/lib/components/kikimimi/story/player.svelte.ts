// おやすみ ものがたり's player (docs/kikimimi.md "おやすみ ものがたり"): a chapter's segments one after another through the voice
// path (packs.ts voiceClip → sound.svelte.ts playVoice), each started when the one before ends plus a natural gap
// (bedtime.ts gapAfter), the next one decoded meanwhile. It moves on by the clips' lengths (a clip that can't sound —
// no voice yet, offline — is waited for up to 3 s, then its length passes in silence), so the story keeps its place
// whatever the audio does. ⏮ / ⏭ by segment, ⏸ / ▶ (▶ starts the segment again), the sleep timer (listening time:
// a pause stops it) fading the voice over its last 20 s (fadeVoice), the music held down under the whole run
// (holdVoiceDuck: no swell in the gaps). A chapter ended: finished; a timed story goes on into the next chapter
// after a pause (paused in it, ▶ goes straight on), else it ends there. The timer run out: finished when in the
// chapter's last third, else its place kept (つづき). Loaded with StoryFrame only.
import type { Chapter } from '#lib/kikimimi/story.ts';
import { clipDur } from '#lib/kikimimi/clips.ts';
import { FADE_MS, NEXT_CHAPTER_MS, fadeCurve, finishesOnTimer, gapAfter, timeline, timerLeft, type SleepTimer } from '#lib/kikimimi/bedtime.ts';
import { fadeVoice, holdVoiceDuck, playVoice } from '#lib/sound/sound.svelte.ts';
import { prefetchClips, voiceClip } from '../packs.ts';

/** How long a segment's clip is waited for before its length passes in silence (ms). */
const DECODE_WAIT = 3_000;
const TICK_MS = 250;

export interface PlayerHooks {
  /** A chapter finished (reached its end, or the timer ran out in its last third). */
  finished(ch: number): void;
  /** Where I stopped (つづき). */
  place(ch: number, seg: number): void;
  /** The next chapter's chunk (a timed story going on), or null at the serial's end. */
  next(ch: number): Promise<Chapter | null>;
}

export class StoryPlayer {
  chapter = $state.raw<Chapter>(null!);
  seg = $state(0);
  playing = $state(false);
  /** The sounding segment's start (the clock's ms; the karaoke's) and length (s); null while paused. */
  from = $state<number | null>(null);
  /** The clock now (ticks while playing: the bar, the timer). */
  now = $state(0);
  timer = $state<SleepTimer>(0);
  /** Listening since the timer was set (ms). */
  spent = $state(0);
  /** How it stopped: at the chapter's (and the story's) end, or by the timer. */
  ended = $state<'end' | 'timer' | null>(null);
  /** Between two chapters of a timed story (the next one's title shows). */
  between = $state(false);
  /** Listening in all (ms: the `listen` row's minutes). */
  heard = 0;

  readonly #clock: () => number;
  readonly #hooks: PlayerHooks;
  #token = 0;
  #mark = 0;
  #fading = false;
  /** Paused in the wait between two chapters: ▶ goes on into the next one. */
  #onward = false;
  #disposed = false;
  #handle: { stop(): void } | null = null;
  #step: ReturnType<typeof setTimeout> | undefined;
  #tick: ReturnType<typeof setInterval> | undefined;

  constructor(chapter: Chapter, seg: number, timer: SleepTimer, hooks: PlayerHooks, clock: () => number = () => performance.now()) {
    this.chapter = chapter;
    this.seg = Math.max(0, Math.min(seg, chapter.segments.length - 1));
    this.timer = timer;
    this.#hooks = hooks;
    this.#clock = clock;
    this.now = clock();
  }

  /** Each segment's length (s): its clip's (the chunk's), 2 s for one missing. */
  get durs(): number[] {
    return this.chapter.segments.map((s) => clipDur(s.clip) ?? 2);
  }
  get line(): { starts: number[]; total: number } {
    const d = this.durs;
    return timeline(this.chapter.segments.map((s, k) => ({ who: s.who, dur: d[k] })));
  }
  /** Where the story is (s from the chapter's start). */
  get pos(): number {
    const tl = this.line, at = tl.starts[this.seg] ?? 0;
    if (this.from === null) return at;
    return Math.min(at + Math.max(0, (this.now - this.from) / 1000), tl.starts[this.seg + 1] ?? tl.total);
  }
  /** The timer's time left (ms), null for ぜんぶ. */
  get left(): number | null {
    return timerLeft(this.timer, this.spent);
  }

  play(): void {
    if (this.playing || this.ended === 'timer' || this.#disposed) return;
    this.ended = null;
    this.playing = true;
    this.#mark = this.#clock();
    holdVoiceDuck(true);
    clearInterval(this.#tick);
    this.#tick = setInterval(() => this.#onTick(), TICK_MS);
    if (this.#onward) void this.#nextChapter(0);
    else void this.#sound();
  }

  pause(): void {
    if (!this.playing) return;
    this.#account();
    this.#onward = this.between;
    this.between = false;
    this.#halt();
    this.#hooks.place(this.chapter.chapter, this.seg);
  }

  toggle(): void {
    if (this.playing) this.pause();
    else this.play();
  }

  /** ⏮: the segment again when it's been going a while, else the one before. */
  back(): void {
    const into = this.from === null ? 0 : (this.now - this.from) / 1000;
    this.seek(this.playing && into > 2.5 ? this.seg : this.seg - 1);
  }
  /** ⏭: the next segment (the last one stays). */
  forward(): void {
    this.seek(Math.min(this.seg + 1, this.chapter.segments.length - 1));
  }
  /** (in the wait between two chapters too: this chapter's segment, the wait and its ▶'s onward dropped) */
  seek(k: number): void {
    this.#account();
    this.between = false;
    this.#onward = false;
    this.#stopSound();
    this.seg = Math.max(0, Math.min(k, this.chapter.segments.length - 1));
    if (this.playing) void this.#sound();
    else this.#hooks.place(this.chapter.chapter, this.seg);
  }

  /** The sleep timer set (anew: its time counts from now). */
  setTimer(t: SleepTimer): void {
    this.timer = t;
    this.spent = 0;
    if (this.#fading) fadeVoice([]);
    this.#fading = false;
  }

  /** Another chapter (the end card's つぎの おはなし, a timed story's next), played at once. */
  open(chapter: Chapter, seg = 0): void {
    if (this.#disposed) return;
    this.#account();
    this.#stopSound();
    this.chapter = chapter;
    this.seg = seg;
    this.ended = null;
    this.between = false;
    this.#onward = false;
    if (this.playing) void this.#sound();
    else this.play();
  }

  /** The sheet closed: it stops for good, keeping its place when it hadn't ended (a chapter still loading never plays). */
  dispose(): void {
    this.#disposed = true;
    const was = this.playing || this.between;
    this.#account();
    this.#halt();
    this.between = false;
    this.#onward = false;
    if (was && !this.ended) this.#hooks.place(this.chapter.chapter, this.seg);
  }

  // ---- inside -------------------------------------------------------------------------------------------------------

  async #sound(): Promise<void> {
    const token = ++this.#token, k = this.seg, segs = this.chapter.segments, seg = segs[k];
    // (the chapter's pack: its segments are all in it)
    prefetchClips(segs.slice(k).map((s) => s.clip));
    const buf = await Promise.race([voiceClip(seg.clip), new Promise<null>((r) => setTimeout(() => r(null), DECODE_WAIT))]);
    if (token !== this.#token || !this.playing) return;
    const dur = buf?.duration ?? clipDur(seg.clip) ?? 2;
    this.#handle = buf ? playVoice(buf) : null;
    this.from = this.now = this.#clock();
    this.#fade();
    const next = segs[k + 1];
    if (next) void voiceClip(next.clip);
    this.#step = setTimeout(() => token === this.#token && this.#advance(), (dur + gapAfter(seg.who, next?.who)) * 1000);
  }

  #advance(): void {
    this.#account();
    if (this.seg + 1 < this.chapter.segments.length) {
      this.seg++;
      void this.#sound();
    } else this.#chapterEnd();
  }

  #chapterEnd(): void {
    this.#stopSound();
    this.#hooks.finished(this.chapter.chapter);
    const left = this.left;
    if (left !== null && left > 0) return void this.#nextChapter(NEXT_CHAPTER_MS);
    this.#halt();
    this.ended = 'end';
  }

  /** A timed story on into the next chapter after `wait` ms (0: ▶ after a pause in the wait), or ended at the serial's end. */
  async #nextChapter(wait: number): Promise<void> {
    this.#onward = false;
    this.between = true;
    const token = this.#token;
    const [next] = await Promise.all([this.#hooks.next(this.chapter.chapter).catch(() => null), new Promise((r) => setTimeout(r, wait))]);
    if (token !== this.#token) return;
    if (next) {
      this.#mark = this.#clock(); // (the pause between chapters isn't listening)
      this.open(next);
      return;
    }
    this.#halt();
    this.between = false;
    this.ended = 'end';
  }

  #onTick(): void {
    if (!this.playing) return;
    this.#account();
    const left = this.left;
    if (left === null) return;
    if (left <= 0) this.#timerEnd();
    else this.#fade();
  }

  /** The fade begun once the timer is within its last 20 s (from the level it has, over what's left). */
  #fade(): void {
    const left = this.left;
    if (left === null || this.#fading || left > FADE_MS || this.between) return;
    this.#fading = true;
    fadeVoice(fadeCurve(left));
  }

  #timerEnd(): void {
    const ch = this.chapter.chapter, done = !this.between && finishesOnTimer(this.pos, this.line.total);
    this.#halt();
    if (done) this.#hooks.finished(ch);
    else if (!this.between) this.#hooks.place(ch, this.seg);
    this.between = false;
    this.ended = 'timer';
  }

  /** The time since the last mark added to what's been heard (and to the timer) while playing. */
  #account(): void {
    const t = this.#clock();
    if (this.playing && !this.between) {
      const d = Math.max(0, t - this.#mark);
      this.heard += d;
      if (this.timer) this.spent += d;
    }
    this.#mark = t;
    this.now = t;
  }

  #stopSound(): void {
    this.#token++;
    clearTimeout(this.#step);
    this.#handle?.stop();
    this.#handle = null;
    this.from = null;
  }

  /** Everything stopped: no clip, no tick, the voice back at full, the music let up. */
  #halt(): void {
    this.#stopSound();
    clearInterval(this.#tick);
    this.playing = false;
    if (this.#fading) fadeVoice([]);
    this.#fading = false;
    holdVoiceDuck(false);
  }
}
