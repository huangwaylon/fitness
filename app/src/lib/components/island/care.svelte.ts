// Island care (docs/design.md "Island care"), after NH: weeds sprout on the lawn over the day (one every 30–60
// minutes, the newest three); a tap pulls one (it pops out of the ground with a puff of earth). The rock by the hedge
// answers a tap with a clonk (it jolts), 1 in 4 a sparkle, 1 in 8 a pill bug or a centipede crawls out from under it.
// (Watering a flower and the next day's hybrid live with the flowers: SceneTaps, flowers.svelte.ts.) No ベル, no find; a pulled
// weed goes into my pocket (NH's clump of weeds: the shop's しげん).
// The weeds derive from the Tokyo date (care.ts), so both phones see the same; a weed either of us pulls is gone on
// both (the shared day's `pick`, first wins; docs/backend.md#shared-world), and the partner's pulls and rock taps play
// here (their villager turns to it). The weeds stand on world.ts LAWN_SPOTS and the rock at world.ts ROCK; the 3D island
// draws them (world3d/things3.ts: their NH models; a sprouting weed pops up, a pulled one flies out of the ground) and
// every flourish (the puff of earth, the shovel's strike, the rock's sparkle: fx3d). No DOM of its own (R4 step 7).
// SceneTaps loads this chunk beside the 3D island and asks it about each tap after the finds (`tap`, client px).
import { timers } from './timers.ts';
import { recordGoods } from '#lib/store/actions.ts';
import { hookOneOf, islandSeed } from '#lib/world/devHooks.ts';
import type { World } from './camera.svelte.ts';
import { thing, things3 } from '../world3d/things3.ts';
import { jst, minuteNow } from '#lib/time/clock.ts';
import { islandDay } from './ambientClock.ts';
import { sceneSfx, shownNow } from './sceneTaps.ts';
import { NO_VILLAGER, clearAt, guardsU, stageGeo } from './placement.ts';
import { digSpots, findArt } from '#lib/world/beach.ts';
import { ROCK, rockTap, weedsAt, type Weed } from '#lib/world/care.ts';
import { weedArt } from '#lib/world/dayModels.ts';
import { take, takenOn } from '#lib/world/sceneDay.ts';
import { partnerTurnTo, turnTo } from './avatar.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { taken as takenBy, takenIds } from '#lib/sync/world-day.ts';
import { untrack } from 'svelte';
import { SHOWN, drawn3, hitRect, hitSources, pick, type Seen } from './hitbox.ts';
import { fx3d } from '#lib/world/fx3d.ts';
import { echo3d } from './echo3d.ts';
import { theme } from '#lib/ui-state/theme.svelte.ts';
import { site } from './site.svelte.ts';

/** A care thing as the e2e's hooks list it (things3 probes 'care'; Island3D adds `shown`): a weed (`sprout`: it popped
 *  up while the island was open) or the rock (uid `rock`), its thing's id, its foot (client px) and its box (its
 *  model's silhouette, till that's in a box round its foot). */
export interface CareRow {
  kind: string; uid: string; sprout: boolean; id3: string;
  foot: [number, number]; box: { left: number; top: number; width: number; height: number };
}
/** What SceneTaps asks of the care things. */
export type Care = {
  tap(px: number, py: number, seen?: Seen): boolean;
  claims(px: number, py: number, seen?: Seen): string | null;
};

/** A weed's tuft (u: the 2D art's), and how long one takes to sprout and to fly out of the ground (ms). */
const WEED_U = 24, SPROUT_MS = 420, PULL_MS = 650;

/** The weeds and the rock on island `w`: their effects in a root of their own (SceneTaps loads this chunk after the
 *  first load and calls this once it's in: `stop` with the scene). */
export function useCare(w: World, o: {
  scene: () => HTMLElement | undefined;
  enabled: () => boolean;
  /** A bug crawls out from under the rock (the critters; the rock's world x and z). */
  rockBug?: (x: number, z: number) => void;
}): Care & { stop: () => void } {
  const { enabled } = o;
  const mount = (fn: () => void | (() => void)) => {
    $effect(() => untrack(fn));
  };
  let api!: Care;
  const stop = $effect.root(() => {
    const seed = islandSeed();

    let pulled = $state(0);
    const clock = $derived(minuteNow());
    const date = $derived(islandDay());
    const weeds = $derived.by<Weed[]>(() => {
      void pulled;
      void site.rev;
      const { hour, minute } = jst(clock);
      // what was taken today: this phone's own record, and every claim in the shared day (mine too: world-day.ts takenIds)
      const gone = date === islandDay() ? takenOn(date).union(takenIds(shared.day)) : takenOn(date);
      const dug = new Set(digSpots(date, gone, seed).map((s) => `${s.x},${s.y}`));
      return weedsAt(date, (hour * 60 + minute) * 60_000, seed, dug).filter((w) => !gone.has(w.uid));
    });
    // A weed that sprouts while the island is open pops up out of the lawn; the ones already there when it opens just stand.
    let opened = false;
    const known = new Set<string>();
    /** Only where this screen's controls leave room (measured when the camera settles, two frames on;
     *  one off screen stays: it's checked once in view). The villagers walk about: they don't count. */
    let shown = $state<Weed[]>([]);
    $effect(() => {
      const list = weeds;
      void w.rest.z;
      void w.rest.vw;
      if (!w.rest.ready) return;
      let id = requestAnimationFrame(() => (id = requestAnimationFrame(() => {
        const g = stageGeo(o.scene());
        if (!g) return void (shown = []);
        // (the first measure: the weeds already there as the island opened just stand; what sprouts from now on pops up)
        if (!opened) (list.forEach((d) => known.add(d.uid)), (opened = true));
        // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over a tuft)
        const keep = guardsU(g, -5 * g.k, (el) => !shownNow(el), NO_VILLAGER);
        shown = list.filter((d) => {
          // anywhere it's drawn on screen, the horizon's sinking edge too (under the HUD on a short phone)
          const p = w.screenAt(d.x, d.y);
          if (!p.visible || p.sx < 0 || p.sx > w.view.vw || p.sy < 0 || p.sy > w.view.vh) return true;
          const k = w.scaleAt(d.x, d.y), [sx, sy] = w.screenU(d.x, d.y, 5);
          return clearAt(keep, sx, sy, 6 * k, 5 * k);
        });
      })));
      return () => cancelAnimationFrame(id);
    });

    let seq = 0;
    const { later, after, clear } = timers();
    $effect(() => clear);
    /** The weeds that sprouted while the island was open, and when each began to (performance.now()). */
    const sprouted = new Map<string, number>();
    const sprouts = (uid: string): void => {
      if (known.has(uid)) return;
      known.add(uid);
      if (!opened) return;
      sprouted.set(uid, performance.now());
      later(w.moveStart('other'), SPROUT_MS + 100);
    };
    /** A sprouting weed's size now: from nothing, past its size and back (NH's pop), else 1. */
    const sproutSize = (uid: string): number => {
      const t0 = sprouted.get(uid);
      if (t0 === undefined) return 1;
      const k = Math.min(1, (performance.now() - t0) / SPROUT_MS);
      return k < 0.7 ? (1.15 * k) / 0.7 : 1.15 - 0.15 * ((k - 0.7) / 0.3);
    };

    /** Pulled at world (x, z): a puff of earth, and the tuft flies up out of the ground, turning, and is gone. */
    function uproot(x: number, z: number, flip = false) {
      fx3d('dust', x, z, 0, { v: '#b48a5a' });
      const n = ++seq, t0 = performance.now(), key = weedArt(theme.season);
      const k = () => Math.min(1, (performance.now() - t0) / PULL_MS);
      // (up 12 u in its first 30 %, then off to the side and down a little, as the 2D tuft's)
      const at = (): readonly [number, number, number] => ((q) => q < 0.3 ? [x, z, 12 * (q / 0.3)] : [x + 10 * ((q - 0.3) / 0.7), z, 12 - 8 * ((q - 0.3) / 0.7)])(k());
      const off = thing(w, { x, z, h: 30, live: at, m3: { key, id: `pull-${n}`, get yaw() { return (flip ? Math.PI : 0) + 1.2 * k(); }, get size() { return 1 - 0.5 * Math.max(0, k() - 0.5); } } })();
      const moving = w.moveStart('other');
      later(() => (off(), moving()), PULL_MS);
    }

    function pull(weed: Weed) {
      // first wins: claimed at the tap
      if (!shared.share({ kind: 'pick', id: weed.uid, what: 'weed', at: [Math.round(weed.x), Math.round(weed.y)] }).fresh) return;
      if ((takenBy(shared.day, weed.uid)?.who ?? shared.me) !== shared.me) return; // the partner pulled it first
      turnTo(weed.x);
      take(date, weed.uid);
      pulled++;
      recordGoods('weeds', `pick:${weed.uid}`); // NH's clump of weeds, into my pocket (the shop's しげん)
      sceneSfx('weed');
      uproot(weed.x, weed.y, weed.flip);
    }
    /** `?rock=clonk|sparkle|bug` (dev or test mode): every rock tap has that outcome (the e2e's: no bug out from under it). */
    const forcedRock = hookOneOf('rock', ['clonk', 'sparkle', 'bug'] as const);
    function hitRock() {
      const what = forcedRock ?? rockTap(Math.random);
      // the partner's phone: my villager strikes the rock too (a bug out from under it comes on its own: the critters)
      shared.share({ kind: 'act', act: 'rock', pt: [ROCK.x, ROCK.y] });
      turnTo(ROCK.x);
      strike(() => clonk(what));
    }
    /** A shovel comes down on the rock with a puff of dust (the 3D island's), then the clonk. */
    function strike(then: () => void) {
      fx3d('dust', ROCK.x, ROCK.y, 0);
      fx3d('swing', ROCK.x, ROCK.y, 0, { v: 'shovel' });
      after(300, then);
    }
    /** `at`: the partner's tap (its sound by where the rock is). */
    function clonk(what: ReturnType<typeof rockTap>, at?: readonly [number, number]) {
      sceneSfx('clonk', at);
      // NH's tool strike on a rock: it squashes under the blow and bounces back
      echo3d('rock', 0.8);
      if (what === 'sparkle') {
        fx3d('sparkle', ROCK.x + 6, ROCK.y, ROCK.h);
        sceneSfx('glint', at);
      } else if (what === 'bug') o.rockBug?.(ROCK.x, ROCK.y);
    }

    // The partner's pulls and rock taps (the shared day's news): their villager turns to it and it plays where it is; the
    // weed is gone here already (the list re-derives), its puff of earth plays where it stood.
    mount(() =>
      shared.on(({ e, live }) => {
        if (!live || !enabled()) return;
        if (e.kind === 'pick' && e.what === 'weed' && e.at) {
          const [x, z] = e.at;
          partnerTurnTo(x, e.who, e.t);
          sceneSfx('weed', [x, z]);
          uproot(x, z);
        } else if (e.kind === 'act' && e.act === 'rock') {
          partnerTurnTo(ROCK.x, e.who, e.t);
          strike(() => clonk('clonk', [ROCK.x, ROCK.y]));
        }
      })
    );

    /** Where a thing's model is drawn on screen (client px): its silhouette (by its thing's id), or till its model is
     *  in, a box its size standing on its foot. */
    function drawnBox(x: number, z: number, id3: string, wd: number, ht: number) {
      const r = drawn3(w, id3);
      if (r) return { left: r.left, top: r.top, width: r.width, height: r.height };
      const [cx, cy] = w.clientAt(x, z), k = w.scaleAt(x, z) * w.view.s;
      return { left: cx - (wd * k) / 2, top: cy - ht * k, width: wd * k, height: ht * k };
    }
    interface Lying { kind: string; uid: string; x: number; z: number; id3: string; wd: number; ht: number; go: () => void }
    const lyingNow = (): Lying[] => [
      ...shown.map((d) => ({ kind: 'weed', uid: d.uid, x: d.x, z: d.y, id3: `weed-${d.uid}`, wd: WEED_U, ht: 14, go: () => pull(d) })),
      { kind: 'rock', uid: 'rock', x: ROCK.x, z: ROCK.y, id3: 'rock', wd: ROCK.h * 1.2, ht: ROCK.h, go: hitRock }
    ];
    const boxOf = (l: Lying) => drawnBox(l.x, l.z, l.id3, l.wd, l.ht);
    /** The weeds in view and the rock with their tap boxes (hitbox.ts: what each draws, at least 44px). */
    const targets = () => lyingNow().flatMap((l) => {
      if (!w.inView(l.x, l.z, 20)) return [];
      const b = boxOf(l);
      return [{ box: hitRect({ ...b, right: b.left + b.width, bottom: b.top + b.height }), x: l.x, z: l.z, kind: l.kind, uid: l.uid, go: l.go }];
    });
    $effect(() => {
      const list = () => targets().flatMap((t) => (t.box ? [{ box: t.box, kind: t.kind }] : []));
      hitSources.add(list);
      return () => void hitSources.delete(list);
    });
    /** A tap on the scene (client px), after the finds: the care thing it took (on its tap box; in front wins). */
    const hit = (px: number, py: number, seen: Seen) => (enabled() ? pick(targets().filter((t) => seen(t.x, t.z)), px, py) : null);
    /** The care thing a tap at client (px, py) is for (a weed's uid, `rock`), no side effect (SceneTaps' claims), or
     *  null. */
    const claims = (px: number, py: number, seen: Seen = SHOWN): string | null => hit(px, py, seen)?.uid ?? null;
    function tap(px: number, py: number, seen: Seen = SHOWN): boolean {
      const best = hit(px, py, seen);
      if (!best) return false;
      best.go();
      return true;
    }

    // ---------- the 3D island's things: the rock and each weed's NH model ----------
    $effect(() => {
      void site.rev;
      return thing(w, { x: ROCK.x, z: ROCK.y, h: ROCK.h, m3: { key: findArt('rock'), id: 'rock' } })();
    });
    $effect(() => {
      const key = weedArt(theme.season);
      const offs = shown.map((d) => {
        untrack(() => sprouts(d.uid));
        return thing(w, { x: d.x, z: d.y, h: 14, m3: { key, id: `weed-${d.uid}`, yaw: d.flip ? Math.PI : 0, get size() { return sproutSize(d.uid); } } })();
      });
      return () => offs.forEach((off) => off());
    });

    // The e2e's lists and boxes (things3 probes 'care', 'weeds'; boxes 'care': by kind or uid, its foot the point it
    // stands on), from the care's state and the 3D island.
    $effect(() => {
      const r = things3(w);
      const rows = (): CareRow[] => lyingNow().map((l) => ({ kind: l.kind, uid: l.uid, sprout: sprouted.has(l.uid), id3: l.id3, foot: [...w.clientAt(l.x, l.z)], box: boxOf(l) }));
      const all = () => weeds.map((d) => [d.x, d.y] as [number, number]);
      const box = (id: string) => ((c) => (c ? { ...c.box, foot: c.foot } : null))(rows().find((c) => c.kind === id || c.uid === id));
      r.probes.set('care', rows);
      r.probes.set('weeds', all);
      r.boxes.set('care', box);
      return () => {
        if (r.probes.get('care') === rows) r.probes.delete('care');
        if (r.probes.get('weeds') === all) r.probes.delete('weeds');
        if (r.boxes.get('care') === box) r.boxes.delete('care');
      };
    });

    api = { tap, claims };
  });
  return { ...api, stop };
}
