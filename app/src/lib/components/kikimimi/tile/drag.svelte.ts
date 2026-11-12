// The tile games' drag (ことば タイル's TilePlay, 音の へんしん's HenshinPlay; docs/kikimimi-engine.md "ことば タイル"),
// alongside the tap: a press on a pool tile or one of my filled slots that moves past SLOP px lifts it at once (no
// long-press); released before, it was a tap. One pointer only, a second finger ignored; pointercancel (a call, the
// system's edge swipe) cancels. The lifted tile is a copy drawn at the finger (Lift.svelte), raised over it, moved by
// transform in a frame loop, which also asks where it would land (`hit`) and scrolls the sheet near its edges. The click
// after a drag is swallowed. The board's side is drop.ts.
import { cue } from '#lib/sound/cues.ts';
import { EMPTY } from '#lib/kikimimi/games/listened.ts';
import { dropOn, type From, type To } from './drop.ts';

/** How far a press moves before it's a drag (px). */
const SLOP = 8;
/** The sheet scrolls while the finger is this near its top or bottom (px), at most STEP px a frame. */
const EDGE = 48;
const STEP = 8;
/** A cancelled drop's flight back (ms). */
const BACK_MS = 160;

/** The lifted copy: its word, the finger, its size, where it was held, and (`back`) flying home. */
export interface Lift {
  word: string;
  x: number;
  y: number;
  w: number;
  h: number;
  dx: number;
  dy: number;
  back: boolean;
}

/** The board's side: the sentence (its slots `[data-slot]`, the pool's tiles `[data-tile] > span` beside it), my slots a
 *  tile moves through, the drop done (false: nothing changed, the copy flies back). */
interface Board {
  sentence(): HTMLElement | null;
  mine(): readonly number[];
  drop(from: From, to: To): boolean;
}

export class TileDrag {
  /** The copy drawn at the finger (null: no drag). */
  lift = $state<Lift | null>(null);
  /** What's lifted, and where it would land now (the sentence's live preview). */
  from = $state.raw<From | null>(null);
  to = $state.raw<To>(null);
  /** Each slot's width as the drag began and each pool word's text width, kept while it lasts: the preview never
   *  reflows the sentence under the finger (what's let go onto is what was shown). */
  widths = $state.raw<Record<number, number>>({});
  #wordW: Record<number, number> = {};
  readonly #o: Board;
  #press: { id: number; x: number; y: number; from: From; el: HTMLElement; word: string } | null = null;
  #at = { x: 0, y: 0 };
  #raf = 0;
  #home = 0;

  constructor(o: Board) {
    this.#o = o;
  }

  /** A press on a tile or a filled slot of mine (the answer window open). */
  down(e: PointerEvent, from: From, word: string): void {
    if (this.#press || this.lift || !e.isPrimary || e.button !== 0) return;
    this.#press = { id: e.pointerId, x: e.clientX, y: e.clientY, from, el: e.currentTarget as HTMLElement, word };
    window.addEventListener('pointermove', this.#move, { passive: false });
    window.addEventListener('pointerup', this.#up);
    window.addEventListener('pointercancel', this.#cancelled);
  }

  /** The window closed or the reveal came mid-drag: the copy flies back before the board locks. */
  cancel(): void {
    if (this.lift) this.#flyHome();
    this.#end();
  }

  readonly #move = (e: PointerEvent): void => {
    const p = this.#press;
    if (!p || e.pointerId !== p.id) return;
    this.#at = { x: e.clientX, y: e.clientY };
    if (!this.lift) {
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) <= SLOP) return;
      const r = p.el.getBoundingClientRect();
      try {
        p.el.setPointerCapture(p.id);
      } catch {
        // (a pointer already gone)
      }
      const sentence = this.#o.sentence(), num = (el: HTMLElement, k: string) => Number(el.dataset[k]);
      this.widths = Object.fromEntries([...(sentence?.querySelectorAll<HTMLElement>('[data-slot]') ?? [])].map((el) => [num(el, 'slot'), el.getBoundingClientRect().width]));
      this.#wordW = Object.fromEntries([...(sentence?.parentElement?.querySelectorAll<HTMLElement>('[data-tile] > span') ?? [])].map((el) => [num(el.parentElement!, 'tile'), el.getBoundingClientRect().width]));
      this.from = p.from;
      this.lift = { word: p.word, x: e.clientX, y: e.clientY, w: r.width, h: r.height, dx: p.x - r.left, dy: p.y - r.top, back: false };
      cue('tick');
      this.#raf = requestAnimationFrame(this.#frame);
    }
    e.preventDefault();
  };

  readonly #frame = (): void => {
    const l = this.lift;
    if (!l || l.back || !this.from) return;
    const { x, y } = this.#at;
    if (l.x !== x || l.y !== y) this.lift = { ...l, x, y };
    this.to = this.hit(x, y);
    const sc = this.#o.sentence()?.closest<HTMLElement>('.kk-body');
    if (sc) {
      const r = sc.getBoundingClientRect();
      const d = y < r.top + EDGE ? -(r.top + EDGE - y) : y > r.bottom - EDGE ? y - (r.bottom - EDGE) : 0;
      if (d) sc.scrollTop += Math.max(-STEP, Math.min(STEP, d / 4));
    }
    this.#raf = requestAnimationFrame(this.#frame);
  };

  readonly #up = (e: PointerEvent): void => {
    const p = this.#press;
    if (!p || e.pointerId !== p.id) return;
    if (this.lift && this.from) {
      const from = this.from, to = this.hit(e.clientX, e.clientY);
      // (the click this release makes is the drag's, not a tap: swallowed till the next press)
      const off = () => {
        window.removeEventListener('click', swallow, true);
        window.removeEventListener('pointerdown', off, true);
      };
      const swallow = (c: Event) => (c.stopPropagation(), c.preventDefault(), off());
      window.addEventListener('click', swallow, true);
      window.addEventListener('pointerdown', off, true);
      setTimeout(off, 400);
      if (this.#o.drop(from, to)) {
        cue(to === 'back' ? 'back' : 'choice-pick');
        this.lift = null;
      } else this.#flyHome();
    }
    this.#end();
  };

  /** Where a point lands: one of my slots (its 44 px target and half the gap round it), another slot or a gap in the
   *  sentence (nowhere), else back to the pool. */
  hit(x: number, y: number): To {
    const near = (r: DOMRect, m: number) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
    const sentence = this.#o.sentence();
    for (const el of sentence?.querySelectorAll<HTMLElement>('[data-slot]') ?? []) {
      if (!near(el.getBoundingClientRect(), 4)) continue;
      const j = Number(el.dataset.slot);
      return this.#o.mine().includes(j) ? { slot: j } : null;
    }
    return sentence && near(sentence.getBoundingClientRect(), 4) ? null : 'back';
  }

  /** What the sentence shows: while a tile is held, what letting go would make (the slot it left empty). */
  shown(placed: readonly number[]): readonly number[] {
    const f = this.from;
    if (!f || !this.lift) return placed;
    const a = dropOn(placed, this.#o.mine(), f, this.to);
    if (a) return a;
    return 'slot' in f ? placed.map((x, j) => (j === f.slot ? EMPTY : x)) : placed;
  }

  /** Slot j's width as the drag began (px; none: no drag). */
  width = (j: number): string | undefined => (this.lift && this.widths[j] ? `${this.widths[j]}px` : undefined);

  /** Pool word k's size previewed in slot j (em), when it wouldn't fit there (the slot's padding: 10 px a side), rather
   *  than cut off. */
  fit(j: number, k: number): string | undefined {
    if (!this.lift) return undefined;
    const room = (this.widths[j] ?? 0) - 20, need = this.#wordW[k] ?? 0;
    return room > 0 && need > room ? `${Math.max(0.7, room / need).toFixed(3)}em` : undefined;
  }

  /** A press on a tile or one of my slots, when the answer window is open. */
  press = (open: boolean, e: PointerEvent, from: From, word: string): void => void (open && this.down(e, from, word));

  readonly #cancelled = (e: PointerEvent): void => {
    if (this.#press?.id === e.pointerId) this.cancel();
  };

  /** The copy back over where it came from, then gone. */
  #flyHome(): void {
    const l = this.lift, el = this.#press?.el;
    if (!l) return;
    const r = el?.isConnected ? el.getBoundingClientRect() : null;
    this.lift = { ...l, back: true, ...(r && { x: r.left + l.dx, y: r.top + l.dy }) };
    clearTimeout(this.#home);
    this.#home = window.setTimeout(() => (this.lift = null), BACK_MS);
  }

  #end(): void {
    cancelAnimationFrame(this.#raf);
    window.removeEventListener('pointermove', this.#move);
    window.removeEventListener('pointerup', this.#up);
    window.removeEventListener('pointercancel', this.#cancelled);
    this.#press = null;
    this.from = null;
    this.to = null;
  }
}
