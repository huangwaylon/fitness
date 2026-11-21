// A trail view's live map state (docs/hiking.md "In-hike map"): the location watch (travel/map/geo.ts LocWatch), the
// compass (compass.ts), the camera's mode (follow.ts), and hike mode (歩きはじめる … 終了: hike.ts's matching, the
// off-route hysteresis, the strip; junction.ts's fork ahead; the screen wake lock). Navigation only: nothing recorded,
// the position never leaves the phone. Call in a component's init; `visible` from its visibilitychange, `stop` at its end.
import { LocWatch } from '../../travel/map/geo.ts';
import type { Prepared } from '#lib/hiking/track.ts';
import { pointAt } from '#lib/hiking/track.ts';
import { forksFresh, type NetFile } from '#lib/hiking/net.ts';
import { Compass, coneHalf, inaccurate } from './compass.ts';
import { camToast, onPan, onRotate, tapLocate, type Cam } from './follow.ts';
import { Matcher, OFF, OffRoute, nearest, strip, effort, type Match } from './hike.ts';
import { headOf, nextJunction, type Junction } from './junction.ts';
import { Wake } from './wake.ts';
import type { Fix, Heading, Highlight, Loc } from './engine.ts';

type LL = [number, number];

export class Live {
  fix = $state.raw<Loc | null>(null);
  locDenied = $state(false);
  cam = $state.raw<{ c: Cam; keep: boolean }>({ c: 'off', keep: false });
  bearing = $state(0);
  heading = $state.raw<Heading | null>(null);
  /** The compass refused (the session's answer): heading mode skipped, the copy says where to allow it. */
  compassDenied = $state(false);
  /** The refusal's copy on screen (after a tap that wanted heading mode). */
  compassMsg = $state(false);
  calib = $state(false);
  /** The 1 s label after a tap (strings.ts key). */
  toast = $state<'camFollow' | 'camHeading' | 'camOff' | null>(null);

  hiking = $state(false);
  at = $state.raw<Match | null>(null);
  off = $state.raw<{ n: number; line: [Fix, Fix] } | null>(null);
  back = $state(false);
  now = $state(Date.now());
  wake = $state(false);
  wakeOk = $state(false);

  net = $state.raw<NetFile | null>(null);
  netShown = $state(true);

  private prep: () => Prepared | null;
  private std: () => number | null;
  private matcher: Matcher | null = null;
  private offr = new OffRoute();
  private eff: number[] | null = null;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private watch: LocWatch;
  private compass: Compass;
  private wakeLock: Wake;

  constructor(o: { prep: () => Prepared | null; std: () => number | null }) {
    this.prep = o.prep;
    this.std = o.std;
    this.watch = new LocWatch((w) => this.onFix(w));
    this.compass = new Compass((c) => {
      this.heading = c.state === 'on' && c.heading !== null ? { deg: c.heading, half: coneHalf(c.acc) } : null;
      this.calib = c.state === 'on' && inaccurate(c.acc);
      if (c.state === 'denied' || c.state === 'unsupported') {
        this.compassDenied = true;
        if (this.cam.c === 'heading') this.cam = { c: 'follow', keep: false };
        if (c.state === 'denied') this.flash('compassMsg', 6000);
      }
    });
    this.wakeLock = new Wake((w) => (this.wake = w.on));
    this.wakeOk = this.wakeLock.supported;
  }

  /** The location disc. The compass is asked FIRST, synchronously (iOS asks only inside the tap: no await before). */
  tap(): void {
    const toHeading = this.cam.c === 'follow' && !this.compassDenied;
    const answer = toHeading ? this.compass.start() : null;
    let next = tapLocate(this.cam.c, { hiking: this.hiking, compass: !this.compassDenied });
    if (toHeading && (answer === 'denied' || answer === 'unsupported')) next = this.hiking ? 'follow' : 'off';
    if (next === 'off') {
      this.watch.stop();
      this.compass.stop();
      this.fix = null;
    } else this.watch.start();
    this.cam = { c: next, keep: false };
    this.toast = camToast(next);
    this.flash('toast', 1000, () => (this.toast = null));
  }

  /** A one-finger pan: the camera let go. */
  pan(): void {
    const c = onPan(this.cam.c);
    if (c !== this.cam.c) this.cam = { c, keep: true };
  }
  /** A two-finger turn: heading mode back to follow, the turn kept. */
  rotate(): void {
    const c = onRotate(this.cam.c);
    if (c !== this.cam.c) this.cam = { c, keep: true };
  }
  /** The compass disc (north up): heading mode back to follow. */
  north(): void {
    const c = onRotate(this.cam.c);
    if (c !== this.cam.c) this.cam = { c, keep: false };
  }

  /** 歩きはじめる: hike mode on (follow, fresh fixes). */
  startHike(): void {
    const p = this.prep();
    if (!p) return;
    this.matcher = new Matcher(p);
    this.eff = effort(p);
    this.offr.reset();
    this.hiking = true;
    this.watch.fresh(true);
    this.watch.start();
    if (this.cam.c === 'off' || this.cam.c === 'free') this.cam = { c: 'follow', keep: false };
    if (this.fix) this.onFix(this.watch);
  }

  /** 終了. */
  endHike(): void {
    this.hiking = false;
    this.watch.fresh(false);
    this.wakeLock.set(false);
    this.matcher = null;
    this.at = null;
    this.off = null;
    this.back = false;
  }

  setWake(on: boolean): void {
    this.wakeLock.set(on);
  }

  visible(on: boolean): void {
    this.watch.visible(on);
    this.compass.visible(on);
    this.wakeLock.visible(on);
  }

  stop(): void {
    this.watch.stop();
    this.compass.stop();
    this.wakeLock.set(false);
    for (const t of this.timers.values()) clearTimeout(t);
  }

  /** Whether the forks in the net file are this track's (else lines only). */
  get forksOk(): boolean {
    const p = this.prep();
    return !!(this.net && p && forksFresh(this.net, p.pts));
  }

  /** The fork ahead (hike mode, on the route, the reference layer shown and its forks this track's). */
  get junction(): Junction | null {
    if (!this.hiking || !this.at || this.off || !this.net || !this.netShown || !this.forksOk) return null;
    return nextJunction(this.net, this.at.d);
  }

  /** The fork ahead drawn: the route's way out thick, the other ways' first metres grey. */
  highlight(j: Junction | null): Highlight | null {
    const p = this.prep(), net = this.net;
    if (!j || !p || !net) return null;
    const f = net.forks[j.fork], take = j.br.find((b) => b.take)!;
    const at = j.to + (this.at?.d ?? 0);
    const routeOut: LL[] = Array.from({ length: 9 }, (_, k) => {
      const q = pointAt(p, at + k * 10);
      return [q.lon, q.lat];
    });
    return {
      take: take.line >= 0 ? headOf(net.lines[take.line].c, f.p) : routeOut,
      others: j.br.filter((b) => !b.take && b.line >= 0).map((b) => headOf(net.lines[b.line].c, f.p))
    };
  }

  /** The strip's figures (hike mode, once placed). */
  get strip() {
    const p = this.prep();
    return p && this.at ? strip(p, this.at.d, this.std(), this.now, this.eff ?? undefined) : null;
  }

  private onFix(w: LocWatch): void {
    this.fix = w.fix ? { lon: w.fix.lon, lat: w.fix.lat, acc: w.fix.acc } : null;
    this.locDenied = w.state === 'denied';
    if (!w.fix) return;
    this.compass.place(w.fix.lat, w.fix.lon);
    const p = this.prep();
    if (!this.hiking || !p || !this.matcher) return;
    const t = w.at || Date.now();
    this.now = t;
    const g = nearest(p, w.fix);
    // progress only from fixes on the route (off it, walked holds where it was)
    if (g.dist <= Math.max(OFF.minM, OFF.accK * w.fix.acc)) this.at = this.matcher.match({ lon: w.fix.lon, lat: w.fix.lat, t });
    else this.at ??= this.matcher.match({ lon: w.fix.lon, lat: w.fix.lat, t });
    const ev = this.offr.update(g.dist, w.fix.acc, t);
    this.off = this.offr.off ? { n: Math.max(10, Math.round(g.dist / 10) * 10), line: [{ lon: w.fix.lon, lat: w.fix.lat }, { lon: g.lon, lat: g.lat }] } : null;
    if (ev === 'back') this.flash('back', 4000);
  }

  /** A flag on for `ms` (or `done` after it). */
  private flash(key: 'compassMsg' | 'back' | 'toast', ms: number, done?: () => void): void {
    clearTimeout(this.timers.get(key));
    if (key !== 'toast') this[key] = true;
    this.timers.set(key, setTimeout(done ?? (() => (this[key as 'compassMsg' | 'back'] = false)), ms));
  }
}
