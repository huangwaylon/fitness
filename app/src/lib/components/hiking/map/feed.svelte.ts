// TrailMap's props into its engine (map/engine.ts): the track, the scrub's dot, the location dot, its heading and the
// camera's mode, hike mode's walked part and off-route line, the reference trails and the fork's highlight, and the
// sheet's peek, once the engine is made and at each change. The engine is $state: an effect that read only a null engine
// (`engine?.setTrack(prep)` short-circuits before `prep`) had no dependency and never ran again, so a trail whose
// track came after its map (every trail after the first: the map's chunk already loaded) showed no route (2026-11-07).
import type { Prepared } from '#lib/hiking/track.ts';
import type { NetFile } from '#lib/hiking/net.ts';
import type { Engine, Fix, Heading, Highlight, Loc, TrailPlace } from './engine.ts';
import type { Cam } from './follow.ts';

/** The reference layer: the file, whether its forks are this track's, whether it shows (参考ルート). */
export interface NetView { net: NetFile | null; forks: boolean; shown: boolean }

/** The props, each read on its own (getters over the component's props: a scrub's move redraws the dot, not the
 *  track, whose redraw refits the camera). The in-hike ones optional (none: nothing of theirs drawn). */
export interface Feed {
  readonly prep: Prepared | null;
  readonly scrub: Fix | null;
  readonly fix: Loc | null;
  readonly bottom: number;
  readonly top: number;
  readonly heading?: Heading | null;
  /** The camera's mode. */
  readonly cam?: Cam;
  readonly walked?: number | null;
  readonly off?: [Fix, Fix] | null;
  readonly net?: NetView;
  readonly hl?: Highlight | null;
  /** The trail's area saved (the topo capped at z16). */
  readonly saved?: boolean;
  /** The saved places near the track, the layer's toggle, hike mode's smaller squares. */
  readonly places?: { pts: readonly TrailPlace[]; shown: boolean; small: boolean };
}

/** Call in a component's init (its effects end with it). */
export class EngineFeed {
  engine = $state.raw<Engine | null>(null);
  /** The next fix brings the map to it (the locate button before there is one). */
  flyNext = false;

  constructor(feed: Feed) {
    $effect(() => {
      const p = feed.prep;
      this.engine?.setTrack(p);
    });
    $effect(() => {
      const s = feed.scrub;
      this.engine?.setScrub(s);
    });
    // (the camera's mode before the fix: a fix that comes with follow on is followed)
    $effect(() => {
      const c = feed.cam;
      if (c) this.engine?.setCam(c);
    });
    $effect(() => {
      const f = feed.fix, e = this.engine;
      if (!e) return;
      e.setFix(f, this.flyNext && !!f);
      if (f) this.flyNext = false;
    });
    $effect(() => {
      const h = feed.heading ?? null;
      this.engine?.setHeading(h);
    });
    $effect(() => {
      const w = feed.walked ?? null;
      this.engine?.setWalked(w);
    });
    $effect(() => {
      const o = feed.off ?? null;
      this.engine?.setOff(o);
    });
    $effect(() => {
      const n = feed.net;
      this.engine?.setNet(n?.net ?? null, !!n?.forks, n?.shown ?? true);
    });
    $effect(() => {
      const h = feed.hl ?? null;
      this.engine?.setHighlight(h);
    });
    $effect(() => {
      const s = !!feed.saved;
      this.engine?.setSaved(s);
    });
    $effect(() => {
      const p = feed.places;
      this.engine?.setPlaces(p?.pts ?? [], p?.shown ?? false, !!p?.small);
    });
    $effect(() => {
      const b = feed.bottom, t = feed.top;
      this.engine?.fit(b, t);
    });
  }
}
