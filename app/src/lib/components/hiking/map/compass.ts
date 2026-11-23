// The compass behind the location dot's cone (docs/hiking.md "In-hike map"; it never turns the map): the phone's
// heading, asked for only inside a tap (the location disc into 追従, 歩きはじめる), on while the location is, read on the
// phone and never sent or kept (decisions.md "Compass"). iOS Safari's `webkitCompassHeading` is degrees clockwise from
// MAGNETIC north (measured on the device's top edge, so the screen's rotation is added); the map's bearings are true,
// so the local declination is added (`declination`: approximate).
// Smoothed on the circle (the shortest way round, 359° → 1° is 2°, never 358°), at most ~5 changes a second (one per
// frame at most, none under 5°), and nothing at all while the page is hidden. The source is injectable (the unit
// tests'; the e2e fakes the events themselves).

/** Degrees into [0, 360). */
export const norm = (a: number): number => ((a % 360) + 360) % 360;
/** The signed shortest turn from `a` to `b`, in (-180, 180]. */
export const turn = (a: number, b: number): number => {
  const d = norm(b - a);
  return d > 180 ? d - 360 : d;
};

/** One low-pass step on the circle: `s` moved the fraction `k` of the shortest turn toward `raw`. */
export const smooth = (s: number | null, raw: number, k = 0.3): number => (s === null ? norm(raw) : norm(s + k * turn(s, raw)));

/** Magnetic declination (degrees, east positive: true = magnetic + this), approximate (a small table by place, not a
 *  geomagnetic model): Japan's is west and grows with latitude, ~5° in Okinawa, ~7.5° in Kanto, ~9.5° in Hokkaido
 *  (GSI's 磁気図 2020.0), taken as linear in latitude, within about half a degree; Washington State ~15° E; elsewhere 0
 *  (no trails there). Half a degree is well inside the cone's own width. */
export function declination(lat: number, lon: number): number {
  if (lat > 20 && lat < 47 && lon > 122 && lon < 155) return -(7.4 + 0.27 * (lat - 35));
  if (lat > 44 && lat < 50 && lon > -125 && lon < -116) return 15;
  return 0;
}

/** A reading as the phone gives it: magnetic heading (deg), its accuracy (deg, −1 unreliable; null not given). */
export interface Reading { heading: number; acc: number | null }
export type Permission = 'granted' | 'denied' | 'unsupported';
export interface CompassSource {
  /** Must be called synchronously inside the tap's handler (iOS asks only from a user gesture). */
  request(): Promise<Permission>;
  listen(cb: (r: Reading) => void): () => void;
}

type DOE = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<'granted' | 'denied'> };
type OrientationEv = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };

/** The phone's own: iOS's webkitCompassHeading (+ the screen's rotation); elsewhere an absolute alpha. */
function deviceSource(): CompassSource {
  return {
    request() {
      const D = (typeof DeviceOrientationEvent === 'undefined' ? undefined : DeviceOrientationEvent) as DOE | undefined;
      if (!D) return Promise.resolve('unsupported');
      if (typeof D.requestPermission !== 'function') return Promise.resolve('granted');
      return D.requestPermission().then((r) => (r === 'granted' ? 'granted' : 'denied'), () => 'denied' as const);
    },
    listen(cb) {
      const on = (e: Event) => {
        const o = e as OrientationEv;
        // the screen's rotation, only when it is landscape (a portrait page reading an angle is no rotation: WebKit's
        // iPhone emulation reports 90 upright; check on a phone held sideways)
        const rot = typeof screen !== 'undefined' && innerWidth > innerHeight ? (screen.orientation?.angle ?? 0) : 0;
        if (typeof o.webkitCompassHeading === 'number' && o.webkitCompassHeading >= 0) cb({ heading: norm(o.webkitCompassHeading + rot), acc: typeof o.webkitCompassAccuracy === 'number' ? o.webkitCompassAccuracy : null });
        else if (o.absolute && typeof o.alpha === 'number') cb({ heading: norm(360 - o.alpha + rot), acc: null });
      };
      addEventListener('deviceorientation', on);
      return () => removeEventListener('deviceorientation', on);
    }
  };
}

/** How wide the heading cone draws (half-angle, deg) for an accuracy: unknown 25, unreliable 60, else 15–60. */
export const coneHalf = (acc: number | null): number => (acc === null ? 25 : acc < 0 ? 60 : Math.max(15, Math.min(60, acc)));
/** Whether the calibration hint shows (方位が不正確です…): unreliable or worse than 30°. */
export const inaccurate = (acc: number | null): boolean => acc !== null && (acc < 0 || acc > 30);

export type CompassState = 'off' | 'on' | 'denied' | 'unsupported';

/** This page's answer so far: asked once per session (a page load), a denial kept for the session (iOS won't ask again
 *  until Safari restarts anyway; the copy explains Settings). */
const session: { asked: boolean; answer: Permission | null } = { asked: false, answer: null };
/** (tests) */
export const resetSession = () => ((session.asked = false), (session.answer = null));

export class Compass {
  state: CompassState = 'off';
  /** The smoothed TRUE heading last told (deg), null before the first reading. */
  heading: number | null = null;
  acc: number | null = null;
  private s: number | null = null;
  private stopListen: (() => void) | null = null;
  private wanted = false;
  private shown = true;
  private decl = 0;
  private frame = 0;
  private lastAt = -Infinity;
  /** An accuracy change not told yet (kept across the readings of a frame, cleared as the frame tells it). */
  private dirtyAcc = false;
  private onchange: (c: Compass) => void;
  private src: CompassSource;
  private raf: (cb: () => void) => number;
  private caf: (id: number) => void;
  private now: () => number;

  constructor(onchange: (c: Compass) => void, o: { source?: CompassSource; raf?: (cb: () => void) => number; caf?: (id: number) => void; now?: () => number } = {}) {
    this.onchange = onchange;
    this.src = o.source ?? deviceSource();
    this.raf = o.raf ?? ((cb) => requestAnimationFrame(cb));
    this.caf = o.caf ?? ((id) => cancelAnimationFrame(id));
    this.now = o.now ?? (() => performance.now());
  }

  /** The tap into 追従 or 歩きはじめる: asks (the session's first time, synchronously: no await before this), then listens.
   *  Returns the answer known now (null: being asked). */
  start(): Permission | null {
    this.wanted = true;
    if (session.answer === 'granted') return (this.listen(), 'granted');
    if (session.answer) return (this.set(session.answer === 'denied' ? 'denied' : 'unsupported'), session.answer);
    if (session.asked) return null;
    session.asked = true;
    void this.src.request().then((r) => {
      session.answer = r;
      if (r === 'granted') {
        if (this.wanted) this.listen();
      } else this.set(r === 'denied' ? 'denied' : 'unsupported');
    });
    return null;
  }

  stop(): void {
    this.wanted = false;
    this.unlisten();
    if (this.state === 'on') this.set('off');
  }

  /** The page shown or hidden: no readings while hidden. */
  visible(on: boolean): void {
    this.shown = on;
    if (on && this.wanted && session.answer === 'granted') this.listen();
    else if (!on) this.unlisten();
  }

  /** Where the phone is (for the declination). */
  place(lat: number, lon: number): void {
    this.decl = declination(lat, lon);
  }

  /** A raw reading in (the source's; public for the tests). */
  read(r: Reading): void {
    this.s = smooth(this.s, r.heading + this.decl);
    if (inaccurate(r.acc) !== inaccurate(this.acc) || Math.abs(coneHalf(r.acc) - coneHalf(this.acc)) >= 5) ((this.dirtyAcc = true), (this.lastAt = -Infinity));
    this.acc = r.acc;
    if (this.frame) return;
    this.frame = this.raf(() => {
      this.frame = 0;
      const t = this.now();
      // (~5 a second at most, none under 5°: each told is a GL frame or more, and the cone is ±15° wide at its
      // narrowest; the smoothing goes on with every reading, so the cone is told the heading as it is now)
      if (t - this.lastAt < 200 || this.s === null) return;
      if (this.heading !== null && Math.abs(turn(this.heading, this.s)) < 5 && !this.dirtyAcc) return;
      this.heading = Math.round(this.s * 10) / 10;
      this.lastAt = t;
      this.dirtyAcc = false;
      this.onchange(this);
    });
  }

  private listen(): void {
    if (this.stopListen || !this.shown) return;
    this.stopListen = this.src.listen((r) => this.read(r));
    if (this.state !== 'on') this.set('on');
  }

  private unlisten(): void {
    this.stopListen?.();
    this.stopListen = null;
    if (this.frame) (this.caf(this.frame), (this.frame = 0));
    this.s = null;
  }

  private set(s: CompassState): void {
    this.state = s;
    this.onchange(this);
  }
}
