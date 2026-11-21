// A trail view's live map state (docs/hiking.md "In-hike map"): the location watch (travel/map/geo.ts LocWatch), the
// compass (compass.ts), the camera's mode (follow.ts), and hike mode (歩きはじめる … 終了: hike.ts's matching, the
// off-route hysteresis, the strip; junction.ts's fork ahead; the screen wake lock; resume.ts's place kept for a
// relaunch). Navigation only: nothing recorded, the position never leaves the phone (the counters say what was used,
// never where). Call in a component's init; `visible` from its visibilitychange, `stop` at its end.
import { LocWatch } from '../../travel/map/geo.ts';
import type { Prepared } from '#lib/hiking/track.ts';
import { pointAt } from '#lib/hiking/track.ts';
import { forksFresh, type NetFile } from '#lib/hiking/net.ts';
import { clearHike, readHike, writeHike, type HikeNow } from '../resume.ts';
import type { KV } from '#lib/sync/storage.ts';
import { count } from '#lib/sync/log.ts';
import { Compass, coneHalf, inaccurate, type CompassSource } from './compass.ts';
import { camToast, onPan, onRotate, tapLocate, type Cam } from './follow.ts';
import { Matcher, OFF, OffRoute, strip, effort, type Match } from './hike.ts';
import { headOf, nextJunction, type Junction } from './junction.ts';
import { Wake, type WakeNav } from './wake.ts';
import type { Fix, Heading, Highlight, Loc } from './engine.ts';

type LL = [number, number];
type Geo = ConstructorParameters<typeof LocWatch>[1];
export type Slot = 'off' | 'toRoute' | 'fork' | 'back' | 'loc' | 'compass' | 'calib';

/** The calibration hint counted once a session (a page load). */
let calibCounted = false;

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
  /** Off the route: metres to it (to 10 m) and the line to its nearest point; `approach` while the hike has not reached
   *  the route yet and began over 1 km from it (the trailhead still ahead: a neutral note, never the alert). */
  off = $state.raw<{ n: number; line: [Fix, Fix]; approach: boolean } | null>(null);
  back = $state(false);
  now = $state(Date.now());
  wake = $state(false);
  wakeOk = $state(false);

  net = $state.raw<NetFile | null>(null);
  netShown = $state(true);
  /** The fork ahead (hike mode, on the route, the reference layer shown and its forks this track's), and its drawing. */
  junction = $state.raw<Junction | null>(null);
  hl = $state.raw<Highlight | null>(null);

  private prep: () => Prepared | null;
  private std: () => number | null;
  private slug: () => string;
  private kv: KV | null | undefined;
  private matcher: Matcher | null = null;
  private offr = new OffRoute();
  private eff: number[] | null = null;
  /** A fix on the route since 歩きはじめる (before it, a start far off is an approach). */
  private reached = false;
  private approach = false;
  private saved: { d: number; dir: 1 | -1; t: number } | null = null;
  private forks: { net: NetFile | null; p: Prepared | null; ok: boolean } = { net: null, p: null, ok: false };
  private hlKey = '';
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private watch: LocWatch;
  private compass: Compass;
  private wakeLock: Wake;

  constructor(o: { prep: () => Prepared | null; std: () => number | null; slug: () => string; geo?: Geo; compass?: CompassSource; wake?: WakeNav; kv?: KV | null }) {
    this.prep = o.prep;
    this.std = o.std;
    this.slug = o.slug;
    this.kv = o.kv;
    this.watch = new LocWatch((w) => this.onFix(w), ...(o.geo !== undefined ? [o.geo] : []));
    this.compass = new Compass((c) => {
      this.heading = c.state === 'on' && c.heading !== null ? { deg: c.heading, half: coneHalf(c.acc) } : null;
      this.calib = c.state === 'on' && inaccurate(c.acc);
      if (this.calib && !calibCounted) ((calibCounted = true), count('act:hike.compass.calib'));
      if (c.state === 'denied' || c.state === 'unsupported') {
        if (!this.compassDenied) count(`act:hike.compass.${c.state}`);
        this.compassDenied = true;
        if (this.cam.c === 'heading') this.cam = { c: 'follow', keep: false };
        // (the tap's label said 進行方向 before the answer came)
        if (this.toast === 'camHeading') this.toast = camToast(this.cam.c);
        if (c.state === 'denied') this.flash('compassMsg', 6000);
      }
    }, o.compass ? { source: o.compass } : {});
    this.wakeLock = new Wake((w, lost) => {
      this.wake = w.on;
      if (lost) count('act:hike.wake.lost');
    }, ...(o.wake ? [o.wake] : []));
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
      this.fix = null;
    } else this.watch.start();
    this.setCam(next, false);
    this.toast = camToast(next);
    this.flash('toast', 1000, () => (this.toast = null));
  }

  /** A one-finger pan: the camera let go. */
  pan(): void {
    this.setCam(onPan(this.cam.c), true);
  }
  /** A two-finger turn: heading mode back to follow, the turn kept. */
  rotate(): void {
    this.setCam(onRotate(this.cam.c), true);
  }
  /** The compass disc (north up): heading mode back to follow. */
  north(): void {
    this.setCam(onRotate(this.cam.c), false);
  }

  /** The camera's mode: the compass listens only in 進行方向 (asked again on the next tap in: the session's answer). */
  private setCam(c: Cam, keep: boolean): void {
    if (c !== 'heading') this.compass.stop();
    if (c !== this.cam.c) this.cam = { c, keep };
  }

  /** 歩きはじめる: hike mode on (follow, fresh fixes); `resumed`, the place a relaunch kept (resume.ts). */
  startHike(resumed: HikeNow | null = null): void {
    const p = this.prep();
    if (!p || this.hiking) return;
    this.matcher = new Matcher(p, resumed);
    this.eff = effort(p);
    this.offr.reset();
    this.reached = !!resumed;
    this.approach = false;
    this.saved = resumed;
    this.hiking = true;
    count(resumed ? 'act:hike.resume' : 'act:hike.start');
    if (!resumed) this.save(0, 1, Date.now());
    this.watch.fresh(true);
    this.watch.start();
    if (this.cam.c === 'off' || this.cam.c === 'free') this.setCam('follow', false);
    if (this.fix && !this.watch.stale) this.onFix(this.watch);
  }

  /** A hike under way on this trail when the app was killed: hike mode back on, from where it was. */
  resumeHike(): void {
    if (this.hiking || !this.prep()) return;
    const h = readHike(this.slug(), Date.now(), this.kv);
    if (h) this.startHike(h);
  }

  /** 終了. */
  endHike(): void {
    if (this.hiking) count('act:hike.end');
    this.hiking = false;
    this.watch.fresh(false);
    this.wakeLock.set(false);
    this.matcher = null;
    this.saved = null;
    clearHike(this.kv);
    this.at = null;
    this.off = null;
    this.back = false;
    this.findJunction();
  }

  setWake(on: boolean): void {
    this.wakeLock.set(on);
    if (on && this.wake) count('act:hike.wake.on');
  }

  /** 参考ルート: the reference layer's file (loaded) and its toggle. */
  setNet(n: NetFile | null): void {
    this.net = n;
    this.findJunction();
  }
  toggleNet(): void {
    this.netShown = !this.netShown;
    this.findJunction();
  }

  visible(on: boolean): void {
    // (hidden, the system may end the page: the place kept now)
    if (!on && this.hiking && this.matcher?.at) this.save(this.matcher.at.d, this.matcher.dir, this.now, true);
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

  /** Whether the forks in the net file are this track's (else lines only): hashed once a file and track. */
  get forksOk(): boolean {
    const p = this.prep(), f = this.forks;
    if (f.net !== this.net || f.p !== p) this.forks = { net: this.net, p, ok: !!(this.net && p && forksFresh(this.net, p.pts)) };
    return this.forks.ok;
  }

  /** The strip's figures (hike mode, once placed). */
  get strip() {
    const p = this.prep();
    return p && this.at ? strip(p, this.at.d, this.std(), this.now, this.eff ?? undefined) : null;
  }

  /** The one top slot's content: off the route wins (an approach is a note), then the fork ahead, then the notes. */
  get slot(): Slot | null {
    if (this.off) return this.off.approach ? 'toRoute' : 'off';
    return this.junction ? 'fork' : this.back ? 'back' : this.locDenied ? 'loc' : this.compassMsg ? 'compass' : this.calib && this.cam.c === 'heading' ? 'calib' : null;
  }

  /** The fork on the way walked, and its drawing (made again only for another fork). */
  private findJunction(): void {
    const ok = this.hiking && this.at && !this.off && this.net && this.netShown && this.forksOk;
    const j = ok ? nextJunction(this.net!, this.at!.d, this.matcher?.dir ?? 1) : null;
    const key = j ? `${j.fork}.${j.pass}.${j.rev}` : '';
    if (key !== this.hlKey) {
      this.hlKey = key;
      this.hl = j ? this.highlight(j) : null;
      if (j) count('act:hike.fork');
    }
    this.junction = j;
  }

  /** A fork drawn: the way to go thick (the route's own way out: its next 80 m along the way walked), the other ways'
   *  first metres grey. */
  private highlight(j: Junction): Highlight | null {
    const p = this.prep(), net = this.net;
    if (!p || !net) return null;
    const f = net.forks[j.fork], at = f.pass[j.pass].at, step = j.rev ? -10 : 10;
    return {
      take: Array.from({ length: 9 }, (_, k): LL => {
        const q = pointAt(p, at + k * step);
        return [q.lon, q.lat];
      }),
      others: j.br.filter((b) => !b.take && b.line >= 0).map((b) => headOf(net.lines[b.line].c, f.p))
    };
  }

  /** The place kept for a relaunch: every 10 m along, a turn, a minute, or now (`force`: the page hiding). */
  private save(d: number, dir: 1 | -1, t: number, force = false): void {
    const s = this.saved;
    if (!force && s && Math.abs(s.d - d) < 10 && s.dir === dir && t - s.t < 60_000) return;
    this.saved = { d, dir, t };
    writeHike({ slug: this.slug(), d, dir, t }, this.kv);
  }

  private onFix(w: LocWatch): void {
    this.fix = w.fix ? { lon: w.fix.lon, lat: w.fix.lat, acc: w.fix.acc, ...(w.stale ? { stale: true } : {}) } : null;
    const denied = w.state === 'denied';
    if (denied && !this.locDenied) count('act:hike.loc.denied');
    this.locDenied = denied;
    if (!w.fix || w.stale) return;
    this.compass.place(w.fix.lat, w.fix.lon);
    const m = this.matcher;
    if (!this.hiking || !this.prep() || !m) return;
    const t = w.at || Date.now();
    this.now = t;
    const { at, g } = m.fix({ lon: w.fix.lon, lat: w.fix.lat, acc: w.fix.acc, t });
    this.at = at;
    if (at) this.save(at.d, m.dir, t);
    const on = w.fix.acc <= OFF.worstAcc && g.dist <= Math.max(OFF.minM, OFF.accK * w.fix.acc);
    if (on) this.reached = true;
    // a start far off (the drive, the station): a neutral note till the route is reached
    if (!this.reached && w.fix.acc <= OFF.worstAcc && g.dist > OFF.farM) this.approach = true;
    if (this.approach && !this.reached) {
      this.off = { n: Math.round(g.dist / 10) * 10, line: [{ lon: w.fix.lon, lat: w.fix.lat }, { lon: g.lon, lat: g.lat }], approach: true };
    } else {
      const ev = this.offr.update(g.dist, w.fix.acc, t);
      this.off = this.offr.off ? { n: Math.max(10, Math.round(g.dist / 10) * 10), line: [{ lon: w.fix.lon, lat: w.fix.lat }, { lon: g.lon, lat: g.lat }], approach: false } : null;
      if (ev === 'off') count('act:hike.offroute');
      if (ev === 'back') this.flash('back', 4000);
    }
    this.findJunction();
  }

  /** A flag on for `ms` (or `done` after it). */
  private flash(key: 'compassMsg' | 'back' | 'toast', ms: number, done?: () => void): void {
    clearTimeout(this.timers.get(key));
    if (key !== 'toast') this[key] = true;
    this.timers.set(key, setTimeout(done ?? (() => (this[key as 'compassMsg' | 'back'] = false)), ms));
  }
}
