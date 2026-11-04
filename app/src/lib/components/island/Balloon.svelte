<script lang="ts">
  // Balloon present (design.md "Balloon"), after NH: a balloon with a present on its string flies across the island in
  // world space (balloonFlight.ts: one height well above the trees, from the sea off one side to the sea off the other,
  // its lane across the view as it starts, biased to the front; world3d/balloon3d.ts draws it, its blob shadow on the
  // ground under it). This is its tap area (a world node on its knot, the balloon and the present, ≥ 44px) and its
  // flight's owner. A tap pops it (NH's slingshot shot, here a tap): a "pan!", a puff of confetti where it burst, and
  // the present falls to a spot chosen first (presentLanding.ts: open sand or grass in the FRONT of the view, inside it,
  // clear of every control and of what lies there), so it never lands where it can't be seen or tapped; SceneTaps
  // draws the fall (this sends it `island:present`: where the present hung, where it lands, how long it takes). No
  // points, no caption. Its clock runs in the island's frames: it holds while the page is hidden or covered. Reduced
  // motion, no 3D island (no WebGL) or no lane on screen: none this time. The parent mounts it.
  import { onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { sceneSfx, shownNow } from './sceneTaps.ts';
  import { useWorld } from './camera.svelte.ts';
  import { uiBoxes } from './placement.ts';
  import { surfaceAt } from './world.ts';
  import { site } from './site.svelte.ts';
  import { fx3d } from './fx3d.ts';
  import { RIG, balloonModel, fallMs, flying, laneY, moveFlight, planFlight, popFlight, rigAt, setFlight, type Flight, type SkyView } from './balloonFlight.ts';
  import { chooseLanding, footprints, openGround, type LandView } from './presentLanding.ts';

  interface Props {
    ondone?: () => void;
  }
  let { ondone }: Props = $props();
  const w = useWorld();

  /** NH's balloon of a colour (1 in 20: gold). */
  const model = balloonModel();

  let flight = $state.raw<Flight | null>(null);
  let popped = false, ended = false;
  const end = () => {
    if (ended) return;
    ended = true;
    ondone?.();
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
      vw: v.vw, top: hudFoot(), bottom: v.vh, horizon: v.horizon, cx: mid?.x ?? 195, z0, z1
    };
  }

  /** The knot now (world x, z, and its lift over the ground there): its node's live position. Its flight over, it goes. */
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
    scene()?.dispatchEvent(new CustomEvent('island:present', { detail: { from, to, ms: to ? fallMs(from, to) : 0 } }));
    end();
  }
  const scene = () => document.querySelector<HTMLElement>('.if-scene[data-live]');

  /** Where the present lands (world x, z): open ground in the front of the view (presentLanding.ts), under the burst
   *  (`sx`: its screen x) if it can be; null with no open ground in view at all. */
  function landing(sx: number): readonly [number, number] | null {
    const v = w.view, nav = site.nav, lay = site.layout, [z0, z1] = w.zRange();
    // the controls on screen (scene px): the HUD, the bottom controls, the catch stack, a visitor (a tap there is theirs), the trees' and the rest's tap
    // areas (the villagers only pass by: it lies behind them)
    const extra = [...document.querySelectorAll('.ribbon-wrap, [data-catch-stack], [data-visitor] .art')].filter(shownNow).map((el) => el.getBoundingClientRect()).filter((b) => b.width && b.height)
      .map((b) => ({ x0: b.left, x1: b.right, y0: b.top, y1: b.bottom }));
    const guards = [...uiBoxes((el) => !!el.closest('[data-actor]')), ...extra].map((b) => ({ x0: b.x0 - v.left, x1: b.x1 - v.left, y0: b.y0 - v.top, y1: b.y1 - v.top }));
    const view: LandView = {
      screen: (x, z) => {
        const p = w.screenAt(x, z);
        return p.visible ? [p.sx, p.sy] : null;
      },
      box: { x0: 0, x1: v.vw, y0: Math.max(hudFoot(), v.horizon + 8), y1: v.vh },
      guards, xs: [-90, 510], zs: [z0, Math.min(z1, z0 + 900)]
    };
    // what lies on the ground (its anchor's foot, on the ground there)
    const lying = [...document.querySelectorAll('.if-scene :is([data-care], [data-find], [data-branch], [data-nest], [data-pumpkin], [data-cake])')].filter(shownNow).flatMap((el) => {
      const b = el.getBoundingClientRect(), g = w.worldAtClient(b.left + b.width / 2, b.bottom);
      return g ? [[g.x, g.z] as const] : [];
    });
    const open = nav && lay ? openGround(nav, surfaceAt, footprints(lay)) : (x: number, z: number) => surfaceAt(x, z) === 'grass' || surfaceAt(x, z) === 'sand';
    return chooseLanding(view, open, lying, sx);
  }

  onMount(() => {
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return end();
    // the 3D camera up (it may still be coming as the island opens): the flight across the view now
    const start = () => {
      if (flight || ended) return;
      if (!w.three) return;
      const f = planFlight(skyView());
      if (!f) return end();
      setFlight(f, model);
      flight = f;
      // (its frames are the island's ambience: a slow drift, world3d/Island3D)
      w.kick();
    };
    const wait = setInterval(start, 200);
    start();
    // (no 3D island: never)
    const give = setTimeout(() => !flight && end(), 10_000);
    // the island's camera takes the finger over the world nodes: a tap on the balloon reaches the scene first
    // (capture), checked against its tap area, ≥ 44px (the button stays for the keyboard)
    const el = scene();
    const onClick = (e: MouseEvent) => {
      const b = btn && shownNow(btn) ? btn.getBoundingClientRect() : null, at = e.target instanceof Element ? e.target : null;
      if (popped || !b || !b.width || at?.closest('.balloon')) return;
      // (never through a control over the island: the HUD, the say button, a plate)
      if (at?.closest('button, a, input, [role="button"], dialog') && !at.closest('.stage')) return;
      const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
      if (Math.abs(e.clientX - cx) > Math.max(22, b.width / 2) || Math.abs(e.clientY - cy) > Math.max(22, b.height / 2)) return;
      e.stopPropagation();
      tap();
    };
    el?.addEventListener('click', onClick, true);
    // the e2e's: where it is, a pop, and the flight moved over a spot (a pop over the back of the island)
    const W = window as unknown as { __balloon?: unknown };
    W.__balloon = {
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
      el?.removeEventListener('click', onClick, true);
      setFlight(null);
      delete W.__balloon;
    };
  });
  let btn = $state<HTMLButtonElement | null>(null);
</script>

{#if flight}
  <div class="flier" {@attach w.at({ x: flight.x0, z: flight.z, h: RIG.balloon + RIG.string + RIG.gift, live: knot, always: true, inv: true })}>
    <button type="button" class="balloon" data-sfx="self" aria-label={t('island.balloon')} bind:this={btn} onclick={tap}
      style:--bh={RIG.balloon} style:--hang={RIG.string + RIG.gift}></button>
  </div>
{/if}

<style>
  /* its tap area, in u on the node (at its knot, scaled with the camera): the balloon over it, the string and the
     present under it, a little round; at least 48px each way on screen (a thumb's 44 and a margin) (--inv: 1 / the node's scale) */
  .flier { pointer-events: none; }
  .balloon {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; display: block; position: absolute;
    pointer-events: auto; -webkit-tap-highlight-color: transparent;
    --w: max(calc(48px * var(--inv, 1)), calc((var(--bh) * .6 + 10) * var(--u)));
    --h: max(calc(48px * var(--inv, 1)), calc((var(--bh) + var(--hang) + 8) * var(--u)));
    width: var(--w); height: var(--h); left: calc(var(--w) / -2);
    /* centred on the rig's middle (the balloon's top to the present's foot) */
    top: calc((var(--hang) - var(--bh)) / 2 * var(--u) - var(--h) / 2);
  }
</style>
