// Balloon present (design.md "Balloon"), after NH: a balloon with a present on its string flies across the island in
// world space (balloonFlight.ts: one height well above the trees, from the sea off one side to the sea off the other,
// its lane across the view as it starts, biased to the front; world3d/balloon3d.ts draws it, its blob shadow on the
// ground under it). This is its flight's owner and its tap area (things3 Tap3 on its knot, the balloon and the present,
// ≥ 48 px: the canvas router's). A tap pops it (NH's slingshot shot, here a tap): a "pan!", a puff of confetti where it
// burst, and the present falls to a spot chosen first (presentLanding.ts: open sand or grass in the FRONT of the view,
// inside it, clear of every control and of what lies there), so it never lands where it can't be seen or tapped;
// SceneTaps draws the fall (this sends it `island:present`: where the present hung, where it lands, how long it takes).
// No points, no caption. Its clock runs in the island's frames: it holds while the page is hidden or covered. No 3D
// island (no WebGL) or no lane on screen: none this time. No DOM of its own (R4 step 7): IslandScene starts it while
// islandLife's `balloon` is up.
import { untrack } from 'svelte';
import { sceneSfx, shownNow } from './sceneTaps.ts';
import type { World } from './camera.svelte.ts';
import { surfaceAt } from '#lib/world/world.ts';
import { site } from './site.svelte.ts';
import { uiBoxes } from './placement.ts';
import { buildingZones } from '#lib/layout/clear.ts';
import { fx3d } from '#lib/world/fx3d.ts';
import { RIG, balloonModel, fallMs, flying, laneY, moveFlight, planFlight, popFlight, rigAt, setFlight, type Flight, type SkyView } from '#lib/world/balloonFlight.ts';
import { chooseLanding, footprints, openGround, type LandView } from '#lib/world/presentLanding.ts';
import { testHooks } from '#lib/ui-state/testMode.ts';
import { tap as tap3, things3 } from '../world3d/things3.ts';

/** What lies on the ground in view (by its things3 id): a find, a dig spot, a weed, the rock, a shaken drop, a nest, a
 *  pumpkin, the cake. */
const LYING = /^(find|gift|dig|mush|weed|drop|nest|pumpkin)-|^(rock|cake)$/;

/** A balloon's flight over island `w`, from now till it's popped, flown off or can't fly (`ondone`): its effects in a
 *  root of their own (the returned stop). */
export function useBalloon(w: World, ondone: () => void): () => void {
  return $effect.root(() => {
    /** NH's balloon of a colour (1 in 20: gold). */
    const model = balloonModel();
    let flight = $state.raw<Flight | null>(null);
    let popped = false, ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      ondone();
    };

    /** The HUD's foot (scene px). */
    const hudFoot = () => Math.max(0, (document.querySelector('.ribbon-wrap')?.getBoundingClientRect().bottom ?? 0) - w.view.top);
    /** The camera as the flight sees it. */
    function skyView(): SkyView {
      const v = w.view, [z0, z1] = w.zRange(), mid = w.worldAt(v.vw / 2, (v.horizon + v.vh) / 2);
      return {
        at: (x, z, y) => {
          const p = w.screenAt(x, z, y - w.feetAt(x, z));
          return p.visible ? [p.sx, p.sy] : null;
        },
        feet: (x, z) => w.feetAt(x, z),
        vw: v.vw, top: hudFoot(), bottom: v.vh, horizon: v.horizon, cx: mid?.x ?? site.midX, z0, z1
      };
    }

    /** The knot now (world x, z, and its lift over the ground there). Its flight over, it goes. */
    function knot(): readonly [number, number, number] {
      const fl = flying();
      if (!fl) return [0, 0, 0];
      if (fl.age >= fl.f.ms) queueMicrotask(end);
      const [x, y, z] = rigAt(fl.f, fl.age).knot;
      return [x, z, y - w.feetAt(x, z)];
    }

    function tap() {
      const fl = flying();
      if (popped || !fl || fl.popped) return;
      popped = true;
      const r = rigAt(fl.f, fl.age), [bx, by, bz] = r.balloon;
      popFlight();
      sceneSfx('balloon');
      fx3d('confetti', bx, bz, by - w.feetAt(bx, bz) - 26);
      fx3d('sparkle', bx, bz, by - w.feetAt(bx, bz), { size: 1.4 });
      const from = r.gift, land = landing(w.clientAt(bx, bz, by - w.feetAt(bx, bz))[0] - w.view.left);
      const to = land ? ([land[0], w.feetAt(land[0], land[1]), land[1]] as const) : null;
      document.querySelector('.if-scene[data-live]')?.dispatchEvent(new CustomEvent('island:present', { detail: { from, to, ms: to ? fallMs(from, to) : 0 } }));
      end();
    }

    function lyingNow(): (readonly [number, number])[] {
      const out: (readonly [number, number])[] = [];
      for (const [id, t] of things3(w).map) {
        const p = t.live?.(), x = p ? p[0] : t.x, z = p ? p[1] : t.z;
        if (LYING.test(id) && w.inView(x, z)) out.push([x, z]);
      }
      return out;
    }
    /** Where the present lands (world x, z): open ground in the front of the view (presentLanding.ts), under the burst
     *  (`sx`: its screen x) if it can be; null with no open ground in view at all. */
    function landing(sx: number): readonly [number, number] | null {
      const v = w.view, nav = site.nav, lay = site.layout, [z0, z1] = w.zRange();
      // the controls on screen (scene px): the HUD, the bottom controls, the catch stack, the island's controls by their
      // tap areas (placement.ts areaGuards: the villagers' too, a tap there is theirs), a visitor (their art from their
      // spot), the tape deck and the cake (padded to their tap reach: the scene's chain's first)
      const reg = things3(w);
      const props = (['deck', 'cake'] as const).flatMap((k) => ((b) => (b && b.left + b.width > 0 && b.left < innerWidth && b.top + b.height > 0 && b.top < innerHeight ? [new DOMRect(b.left - 12, b.top - 12, b.width + 24, b.height + 24)] : []))(reg.boxes.get(k)?.('')));
      const extra = [...document.querySelectorAll('.ribbon-wrap, [data-catch-stack]')].filter(shownNow).map((el) => el.getBoundingClientRect()).concat(props)
        .concat([...reg.arts.values()].flatMap((f) => ((r) => (r ? [new DOMRect(r.left, r.top, r.right - r.left, r.bottom - r.top)] : []))(f())))
        .filter((b) => b.width && b.height).map((b) => ({ x0: b.left, x1: b.right, y0: b.top, y1: b.bottom }));
      const guards = [...uiBoxes(), ...extra].map((b) => ({ x0: b.x0 - v.left, x1: b.x1 - v.left, y0: b.y0 - v.top, y1: b.y1 - v.top }));
      const view: LandView = {
        screen: (x, z) => {
          const p = w.screenAt(x, z);
          return p.visible ? [p.sx, p.sy] : null;
        },
        box: { x0: 0, x1: v.vw, y0: Math.max(hudFoot(), v.horizon + 8), y1: v.vh },
        guards, xs: [-90, 510], zs: [z0, Math.min(z1, z0 + 900)]
      };
      const open = nav && lay ? openGround(nav, surfaceAt, [...footprints(lay), ...buildingZones(nav)]) : (x: number, z: number) => surfaceAt(x, z) === 'grass' || surfaceAt(x, z) === 'sand';
      return chooseLanding(view, open, lyingNow(), sx);
    }

    // its tap area while it flies (the balloon over the knot, the string and the present under it, a little round; at
    // least 48 px each way on screen): the canvas router's
    $effect(() => {
      const f = flight;
      if (!f) return;
      const bw = RIG.balloon * 0.6 + 10, bh = RIG.balloon + RIG.string + RIG.gift + 8, mid = (RIG.balloon - RIG.string - RIG.gift) / 2;
      return untrack(() => tap3(w, [{ kind: 'balloon', id: '', x: f.x0, z: f.z, h: RIG.balloon + RIG.string + RIG.gift, live: knot, always: true, l: -bw / 2, r: bw / 2, b: mid - bh / 2, t: mid + bh / 2, min: [48, 48, 'mid'], act: tap }])());
    });

    $effect(() => untrack(() => {
      // the 3D camera up (it may still be coming as the island opens): the flight across the view now
      const start = () => {
        if (flight || ended || !w.three) return;
        const f = planFlight(skyView());
        if (!f) return end();
        setFlight(f, model);
        flight = f;
        // (flying: no more looks, 5 a second for the whole flight)
        clearInterval(wait);
        // (its frames are the island's ambience: a slow drift, world3d/Island3D)
        w.kick();
      };
      const wait: ReturnType<typeof setInterval> = setInterval(start, 200);
      start();
      // (no 3D island: never)
      const give = setTimeout(() => !flight && end(), 10_000);
      // the e2e's: where it is, a pop, and the flight moved over a spot (a pop over the back of the island; testHooks:
      // never on a live phone)
      if (testHooks()) window.__balloon = {
        flight: () => flying(),
        pop: () => tap(),
        move: (x: number, z: number) => moveFlight(x, z, laneY(skyView(), z)),
        /** A new flight across the view as it is now (the camera moved: zoomed right in). */
        replan: () => {
          const f = planFlight(skyView());
          if (f && !popped) setFlight((flight = f), model);
        }
      };
      return () => {
        clearInterval(wait);
        clearTimeout(give);
        setFlight(null);
        delete window.__balloon;
      };
    }));
  });
}
