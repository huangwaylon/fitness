// A map screen's drag-up sheet (hiking/TrailView, places/PlacesView; drawn by MapSheet.svelte): low (the peek, or a
// level's own height: places' card) or full (REACH under the bar: a strip of the map over it, as an iOS sheet's large
// detent), or a drag's height. Sized by the layout viewport (documentElement.clientHeight: iOS's keyboard shrinks
// innerHeight, not it, so the full sheet stays full). The grip and the handles (a peek, a head: `handle`) are held from
// the first touch (a mouse's first move is already off the grip) and a tap toggles; their controls (a field, a button,
// a chip row) are theirs. A list at the low sheet (`list`: places' peek rows) drags it too, its rows' taps kept (held
// only once it drags). A drag let go: past FLICK px its way, else the nearer by MID of the screen; a drag's click is
// swallowed. The full sheet's scroller pulled down from its top folds it (`pull`, touch: iOS's sheets).

/** A drag past this goes its way. */
export const FLICK = 40;
/** A shorter one: full above this share of the screen, else low. */
export const MID = 0.45;
/** Held below the peek: this much of it (a little give). */
export const GIVE = 0.8;
/** A move under this is still a tap. */
export const SLOP = 6;
/** The grip's strip in the sheet (MapSheet.svelte: its 44 px hit: REACH over the map edge, 24 on the paper, then a px clear). */
export const STRIP = 25;
/** The grip's hit over the map's edge: the full sheet stops this far under the bar (the hit over the map, not under
 *  the bar), and the maps' credit sits this far over the sheet (TrailMap, PlacesMap: clear of the hit). */
export const REACH = 20;
/** Under these a press is the control's, never the sheet's. */
const OWN = 'input, textarea, select, button, a, .chip-row';

/** A drag from `from` let go at `at` (heights, px): full or low. */
export function snap(from: number, at: number, vh: number): 'full' | 'low' {
  const dy = at - from;
  return dy > FLICK ? 'full' : dy < -FLICK ? 'low' : at > vh * MID ? 'full' : 'low';
}
/** A drag's height: up to the full sheet, down to GIVE of the peek. */
export const held = (h: number, peek: number, full: number) => Math.min(full, Math.max(peek * GIVE, h));
/** A pull on the full scroller (`dy` down from its touch): 'wait' till SLOP, then the sheet's (down) or the list's (up). */
export const pullOf = (dy: number): 'wait' | 'sheet' | 'list' => (Math.abs(dy) < SLOP ? 'wait' : dy > 0 ? 'sheet' : 'list');

export interface SheetOpts<L extends string> {
  /** The peek's height. */
  peek: () => number;
  /** The bar's foot (the safe area, NavBar). */
  bar: () => number;
  /** The low state now (places: 'card' while a place is open). */
  low?: () => L;
  /** A low state's height (default the peek's). */
  height?: (l: L) => number;
  /** After each change (the list back to its top, ...). */
  onset?: (s: L | 'full') => void;
}
type Handlers = Record<'onpointerdown' | 'onpointermove' | 'onpointerup' | 'onpointercancel', (e: PointerEvent) => void>;

export class DragSheet<L extends string = 'peek'> {
  /** The layout viewport's height. */
  vh = $state(typeof document === 'undefined' ? 800 : document.documentElement.clientHeight || innerHeight);
  state = $state<L | 'full'>('peek' as L);
  /** A drag's height (null: at rest). */
  drag = $state<number | null>(null);
  #o: SheetOpts<L>;
  #y0 = 0;
  #h0 = 0;
  #pid: number | null = null;
  #dragged = false;
  #list = false;
  #eat = false;

  constructor(o: SheetOpts<L>) {
    this.#o = o;
  }
  /** The window resized (the keyboard doesn't change it). */
  layout = () => void (this.vh = document.documentElement.clientHeight || innerHeight);
  get full() { return this.vh - this.#o.bar() - REACH; }
  get low(): L { return this.#o.low?.() ?? ('peek' as L); }
  get height() {
    const s = this.state;
    return this.drag ?? (s === 'full' ? this.full : (this.#o.height?.(s) ?? this.#o.peek()));
  }
  /** Full and at rest. */
  get raised() { return this.state === 'full' && this.drag === null; }

  set(s: L | 'full') {
    this.state = s;
    this.#o.onset?.(s);
  }
  toggle = () => this.set(this.state === 'full' ? this.low : 'full');
  #settle() {
    this.set(snap(this.#h0, this.drag!, this.vh) === 'full' ? 'full' : this.low);
    this.drag = null;
  }
  #move(y: number) {
    this.drag = held(this.#h0 + this.#y0 - y, this.#o.peek(), this.full);
  }

  #down(e: PointerEvent, list: boolean) {
    if (list ? this.state === 'full' : (e.target as Element).closest(OWN)) return;
    this.#pid = e.pointerId;
    this.#y0 = e.clientY;
    this.#h0 = this.height;
    this.#dragged = false;
    this.#list = list;
    if (!list) (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  #pmove = (e: PointerEvent) => {
    if (this.#pid !== e.pointerId) return;
    if (!this.#dragged && Math.abs(e.clientY - this.#y0) > SLOP) {
      this.#dragged = true;
      if (this.#list) (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    }
    if (this.#dragged) this.#move(e.clientY);
  };
  #up = (e: PointerEvent) => {
    if (this.#pid !== e.pointerId) return;
    this.#pid = null;
    if (this.#dragged && this.drag !== null) ((this.#eat = true), this.#settle());
    else if (e.type !== 'pointercancel' && !this.#list) this.toggle();
    this.drag = null;
  };
  /** The grip, a peek, a head. */
  readonly handle: Handlers = { onpointerdown: (e) => this.#down(e, false), onpointermove: this.#pmove, onpointerup: this.#up, onpointercancel: this.#up };
  /** A list: the low sheet's (its rows' taps kept). */
  readonly list: Handlers = { ...this.handle, onpointerdown: (e) => this.#down(e, true) };
  /** The sheet's root (capture): a new press starts clean; a drag's click isn't a tap. */
  fresh = () => void (this.#eat = false);
  swallow = (e: MouseEvent) => {
    if (!this.#eat) return;
    this.#eat = false;
    e.stopPropagation();
    e.preventDefault();
  };
  key = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    this.toggle();
  };

  /** {@attach sheet.pull} on the full sheet's scroller: a touch that starts with it at its top and first moves down
   *  drags the sheet instead of the rubber band; one that starts mid-list, first goes up, or lands on something that
   *  takes its own drags (touch-action none: the elevation chart) is the scroller's (touch events: a scroll's pointer
   *  is cancelled as it starts). */
  pull = (el: HTMLElement) => {
    let y0 = 0, mode: 'wait' | 'sheet' | 'list' = 'list';
    const own = (t: EventTarget | null) => {
      for (let n = t instanceof Element ? t : null; n && n !== el; n = n.parentElement) if (getComputedStyle(n).touchAction === 'none') return true;
      return false;
    };
    const start = (e: TouchEvent) => {
      mode = this.state === 'full' && el.scrollTop <= 0 && e.touches.length === 1 && !own(e.target) ? 'wait' : 'list';
      y0 = e.touches[0]?.clientY ?? 0;
    };
    const move = (e: TouchEvent) => {
      if (mode === 'list') return;
      const y = e.touches[0]?.clientY ?? y0;
      if (mode === 'wait') {
        mode = pullOf(y - y0);
        if (mode !== 'sheet') return;
        ((this.#h0 = this.height), (this.#y0 = y0));
      }
      e.preventDefault();
      this.#move(y);
    };
    const end = () => {
      if (mode === 'sheet' && this.drag !== null) ((this.#eat = true), this.#settle());
      mode = 'list';
    };
    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: false });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  };
}
