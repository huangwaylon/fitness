// The location dot's watch (docs/travel.md "Maps"): the phone's position only after the locate button is tapped, watched
// only while the map is on screen (the sheet open, the tab shown), stopped the moment it isn't. The position goes to the
// map and nowhere else: never logged, never sent, never kept.
import type { Fix } from './overlay.ts';
import type { LocState } from './types.ts';

type Geo = Pick<Geolocation, 'watchPosition' | 'clearWatch'>;

export class LocWatch {
  state: LocState = 'off';
  fix: Fix | null = null;
  /** The fix's time (epoch ms: the hike's matcher reads a silence from it). */
  at = 0;
  private id: number | null = null;
  private wanted = false;
  private shown = true;
  /** maximumAge (ms): a cached fix up to 15 s old will do for a dot; a hike's map wants a fresh one (fresh()). */
  private maxAge = 15_000;

  private onchange: (w: LocWatch, fresh: boolean) => void;
  private geo: Geo | undefined;

  constructor(onchange: (w: LocWatch, fresh: boolean) => void, geo: Geo | undefined = typeof navigator === 'undefined' ? undefined : navigator.geolocation) {
    this.onchange = onchange;
    this.geo = geo;
  }

  /** The locate button: start asking (the permission prompt, the first time), or, already on, nothing new (the caller
   *  re-centres). */
  start(): void {
    if (!this.geo) return this.set('unavailable');
    this.wanted = true;
    if (this.state === 'off' || this.state === 'denied' || this.state === 'unavailable') this.set('asking');
    this.watch();
  }

  /** Whether the map is on screen: off pauses the watch, on resumes it if the user had asked. */
  visible(on: boolean): void {
    this.shown = on;
    if (on) this.watch();
    else this.clear();
  }

  /** A hike's map (docs/hiking.md "In-hike map"): fixes no older than 2 s, the watch restarted to take it. */
  fresh(on: boolean): void {
    const age = on ? 2_000 : 15_000;
    if (age === this.maxAge) return;
    this.maxAge = age;
    if (this.id !== null) (this.clear(), this.watch());
  }

  stop(): void {
    this.wanted = false;
    this.clear();
  }

  private watch(): void {
    if (!this.wanted || !this.shown || this.id !== null || !this.geo) return;
    this.id = this.geo.watchPosition(
      (p) => {
        const first = this.fix === null;
        this.fix = { lon: p.coords.longitude, lat: p.coords.latitude, acc: p.coords.accuracy };
        this.at = Date.now(); // (the page's clock, not the fix's own: one clock for the hike's timing)
        this.state = 'on';
        this.onchange(this, first);
      },
      (e) => {
        if (e.code === 1) {
          // refused (the prompt, or Settings): stop asking until the button is tapped again
          this.wanted = false;
          this.clear();
          this.fix = null;
          this.set('denied');
        } else if (!this.fix) this.set('unavailable'); // no fix yet (indoors, a timeout): the watch keeps trying
      },
      { enableHighAccuracy: true, maximumAge: this.maxAge, timeout: 30_000 }
    );
  }

  private clear(): void {
    if (this.id !== null) this.geo?.clearWatch(this.id);
    this.id = null;
  }

  private set(s: LocState): void {
    this.state = s;
    this.onchange(this, false);
  }
}
