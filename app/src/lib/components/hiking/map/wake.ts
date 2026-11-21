// 画面をつけたままにする (hike mode only, docs/hiking.md "In-hike map"): a screen wake lock while it is on. The system
// lets go of a lock whenever the page hides (and takes it back here when it shows again), and also on its own while
// shown (Low Power Mode): then the toggle reads off, as the screen will sleep. A locked screen means no position (no
// background location in a web app).
type Sentinel = { released: boolean; release(): Promise<void>; addEventListener(t: 'release', cb: () => void): void };
type WakeNav = { wakeLock?: { request(t: 'screen'): Promise<Sentinel> } };

export class Wake {
  /** The toggle: wanted (and held, or about to be). */
  on = false;
  private lock: Sentinel | null = null;
  private onchange: (w: Wake) => void;
  private nav: WakeNav;
  private shown: () => boolean;

  constructor(onchange: (w: Wake) => void, nav: WakeNav = typeof navigator === 'undefined' ? {} : (navigator as WakeNav), shown = () => typeof document === 'undefined' || document.visibilityState === 'visible') {
    this.onchange = onchange;
    this.nav = nav;
    this.shown = shown;
  }

  get supported(): boolean {
    return !!this.nav.wakeLock;
  }

  set(want: boolean): void {
    this.on = want && this.supported;
    if (this.on) this.take();
    else this.drop();
    this.onchange(this);
  }

  /** The page shown again: take it back if wanted. */
  visible(on: boolean): void {
    if (on && this.on && !this.lock) this.take();
  }

  private take(): void {
    if (this.lock || !this.nav.wakeLock || !this.shown()) return;
    this.nav.wakeLock.request('screen').then(
      (l) => {
        if (!this.on) return void l.release().catch(() => {});
        this.lock = l;
        l.addEventListener('release', () => {
          if (this.lock !== l) return;
          this.lock = null;
          // let go while shown (Low Power Mode, the system's own): the toggle tells the truth
          if (this.on && this.shown()) ((this.on = false), this.onchange(this));
        });
      },
      () => {
        if (this.on) ((this.on = false), this.onchange(this));
      }
    );
  }

  private drop(): void {
    const l = this.lock;
    this.lock = null;
    void l?.release().catch(() => {});
  }
}
