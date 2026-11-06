// TrailMap's props into its engine (map/engine.ts): the track, the scrub's dot, the location dot and the sheet's
// peek, once the engine is made and at each change. The engine is $state: an effect that read only a null engine
// (`engine?.setTrack(prep)` short-circuits before `prep`) had no dependency and never ran again, so a trail whose
// track came after its map (every trail after the first: the map's chunk already loaded) showed no route (2026-11-07).
import type { Prepared } from '#lib/hiking/track.ts';
import type { Engine, Fix } from './engine.ts';

/** The props, each read on its own (getters over the component's props: a scrub's move redraws the dot, not the
 *  track, whose redraw refits the camera). */
export interface Feed { readonly prep: Prepared | null; readonly scrub: Fix | null; readonly fix: Fix | null; readonly bottom: number }

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
    $effect(() => {
      const f = feed.fix, e = this.engine;
      if (!e) return;
      e.setFix(f, this.flyNext && !!f);
      if (f) this.flyNext = false;
    });
    $effect(() => {
      const b = feed.bottom;
      this.engine?.fit(b);
    });
  }
}
