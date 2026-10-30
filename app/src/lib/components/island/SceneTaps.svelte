<script lang="ts">
  // Scenery taps (docs/design/scene-interactions.md): the island's decorative scenery answers a tap with a ≤ 1 s
  // flourish after NH / Pocket Camp, and nothing else (no points, no state, no sheets). A bush rustles and sheds a few
  // leaves (petals in spring, maple leaves in autumn, a clump of snow in winter); a flower wiggles and drops a petal
  // with a sparkle (rarely a butterfly flutters off it; on a summer night, a firefly); a cloud squishes and puffs; the
  // sun glints; the moon bobs and sends a shooting star; a tap in the night sky lights a star (sometimes a shooting
  // star); the sea rings and splashes (rarely a fish shadow darts off); sand takes two footprints and a puff, grass a
  // dust puff (snow in winter). On a clear night a shooting star crosses now and then on its own.
  //   <SceneTaps scene={el} {season} {tod} enabled={() => live && !covered} />   (inside .stage, before the tint)
  // One pointerdown listener on the scene: anything inside a control (trees, fruit row, jar, villagers, balloon) is
  // theirs. The hit test is in stage units (sceneTaps.ts), the sky against the live boxes of the sun / moon / clouds.
  // Cheap: transforms and opacity only (the shakes are Web Animations on the art's own element), ≤ 4 flourishes at
  // once (≤ 6 nodes each), each removed after ≤ 1.1 s; nothing runs while idle but the night's shooting-star timer.
  // Reduced motion: a soft glow at the tap, no movement. Decorative and pointer-only (aria-hidden, no focus stops).
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { seasonArt, type SeasonItem } from '#lib/art.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { reducedMotion } from '#lib/time/clock.ts';
  import { BEDS, BED_X, BED_ROWS, BUSH_U, FLOWER_U, HEDGE_BASE, HEDGE_X, HORIZON_U, type Tod } from './scene.ts';
  import { PETAL, hitStage, sceneSfx } from './sceneTaps.ts';

  interface Props {
    /** The .if-scene element (the listener's home; the stage, orb and clouds are found inside it). */
    scene?: HTMLElement;
    season: Season;
    tod: Tod;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
    /** The pointerdown that just closed a tree's popup: that tap only closes it. */
    swallowed?: () => Event | null;
  }
  let { scene, season, tod, enabled, swallowed }: Props = $props();

  type Kind = 'bush' | 'flower' | 'cloud' | 'sun' | 'moon' | 'star' | 'shoot' | 'splash' | 'sand' | 'grass' | 'glow';
  interface Fx {
    id: number;
    kind: Kind;
    /** px from the stage's top-left (sky flourishes sit above it, at negative y). */
    x: number;
    y: number;
    /** bush: what it sheds; grass: 'snow' in winter. */
    v?: string;
    /** a rare extra: 'butterfly' | 'firefly' | 'fish'. */
    rare?: string;
    color?: string;
    /** mirror (a fish or butterfly heading left). */
    flip?: boolean;
    /** cloud: the side the puffs fly off (−1 / 1). */
    dir?: number;
  }
  const MAX_FX = 4;
  const LIFE_MS = 1100;
  const TAP_ID = 'scene-tap';
  let fx = $state<Fx[]>([]);
  let seq = 0;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const night = $derived(tod === 'night');
  const roll = (n: number) => Math.random() * n < 1;

  function later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }
  $effect(() => () => {
    for (const id of timers) clearTimeout(id);
    timers.clear();
  });

  function spawn(f: Omit<Fx, 'id'>, ms = LIFE_MS) {
    const id = ++seq;
    fx = [...fx.slice(-(MAX_FX - 1)), { ...f, id }];
    later(() => (fx = fx.filter((g) => g.id !== id)), ms);
  }

  /** A one-shot Web Animation on a scenery element (replacing the last tap's, so a quick re-tap restarts it). */
  function jiggle(el: Element | null | undefined, frames: Keyframe[], ms: number, origin?: string) {
    if (!el) return;
    for (const a of el.getAnimations()) if (a.id === TAP_ID) a.cancel();
    const f = origin ? frames.map((k) => ({ ...k, transformOrigin: origin })) : frames;
    el.animate(f, { duration: ms, easing: 'cubic-bezier(.3, .7, .4, 1)', id: TAP_ID });
  }
  const RUSTLE: Keyframe[] = [
    { rotate: '0deg', scale: '1' }, { rotate: '-5deg', scale: '1.05 .95', offset: 0.14 },
    { rotate: '4deg', scale: '.98 1.03', offset: 0.34 }, { rotate: '-2.4deg', scale: '1', offset: 0.56 },
    { rotate: '1.1deg', scale: '1', offset: 0.78 }, { rotate: '0deg', scale: '1' }
  ];
  const WIGGLE: Keyframe[] = [
    { rotate: '0deg', scale: '1' }, { rotate: '0deg', scale: '1.08 .9', offset: 0.12 },
    { rotate: '-9deg', scale: '.97 1.04', offset: 0.32 }, { rotate: '7deg', scale: '1', offset: 0.52 },
    { rotate: '-3deg', scale: '1', offset: 0.74 }, { rotate: '0deg', scale: '1' }
  ];
  const SQUISH: Keyframe[] = [
    { scale: '1' }, { scale: '1.1 .86', offset: 0.22 }, { scale: '.95 1.07', offset: 0.5 }, { scale: '1.02 .98', offset: 0.76 }, { scale: '1' }
  ];
  const POP: Keyframe[] = [{ scale: '1' }, { scale: '1.18', offset: 0.3 }, { scale: '.96', offset: 0.65 }, { scale: '1' }];
  /** The props are drawn at translate(−50%, −96%): this origin is their foot (the trunk of the bush / the stem). */
  const FOOT_ORIGIN = '0% 4%';

  const shed = (s: Season): string => (s === 'spring' ? 'petal' : s === 'autumn' ? 'maple-leaf' : s === 'winter' ? 'snow' : 'leaf');

  /** A box padded to ≥ 44px each way (shrunk to its middle 70% first: the sun's glow is wider than the sun). */
  function near(r: DOMRect, x: number, y: number, core = 1): boolean {
    const w = Math.max(44, r.width * core), h = Math.max(44, r.height * core);
    return Math.abs(x - (r.left + r.width / 2)) <= w / 2 && Math.abs(y - (r.top + r.height / 2)) <= h / 2;
  }

  function onDown(e: PointerEvent) {
    if (!e.isPrimary || e.button > 0 || !enabled() || e === swallowed?.()) return;
    const t = e.target;
    if (!(t instanceof Element) || t.closest('button, a, input, select, textarea, label, dialog, [role="button"], [tabindex]')) return;
    const stage = scene?.querySelector<HTMLElement>('.stage');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const k = 390 / r.width; // px → u (the stage keeps its 390 : 360 aspect)
    const x = e.clientX - r.left, y = e.clientY - r.top;
    const calm = reducedMotion();
    // the sky ends at the scene's horizon, which on a tall phone rises above the stage's own (open sea behind the island)
    if (y < horizonPx(stage, r)) return sky(e, r, x, y, calm);
    const hit = hitStage(x * k, Math.max(y * k, HORIZON_U));
    if (calm) return spawn({ kind: 'glow', x, y }, 450);
    switch (hit.kind) {
      case 'bush': {
        jiggle(stage.querySelector(`[data-bush="${hit.i}"]`), RUSTLE, 520, FOOT_ORIGIN);
        spawn({ kind: 'bush', x: HEDGE_X[hit.i] / k, y: (HEDGE_BASE - BUSH_U * 0.62) / k, v: shed(season) });
        return sceneSfx('bush');
      }
      case 'flower': {
        jiggle(stage.querySelector(`[data-flower="${hit.row}-${hit.col}"]`), WIGGLE, 620, FOOT_ORIGIN);
        const id = hit.row ? BEDS[season].front : BEDS[season].back;
        const fx0 = [...BED_X.left, ...BED_X.right][hit.col];
        // NH: butterflies by day among the flowers (not in winter); fireflies on summer nights
        const rare = night ? (season === 'summer' && roll(2) ? 'firefly' : undefined) : season !== 'winter' && roll(8) ? 'butterfly' : undefined;
        spawn({ kind: 'flower', x: fx0 / k, y: (BED_ROWS[hit.row] - FLOWER_U * 0.72) / k, color: PETAL[id], rare, flip: fx0 > 195 });
        sceneSfx('flower');
        if (rare === 'butterfly') sceneSfx('butterfly');
        return;
      }
      case 'sea': {
        const rare = roll(10) ? 'fish' : undefined;
        spawn({ kind: 'splash', x, y, rare, flip: roll(2) });
        return sceneSfx(rare ? 'fish' : 'splash');
      }
      case 'sand':
        spawn({ kind: 'sand', x, y, flip: roll(2) });
        return sceneSfx('sand');
      case 'grass': {
        const snow = season === 'winter';
        spawn({ kind: 'grass', x, y, v: snow ? 'snow' : undefined, flip: roll(2) });
        return sceneSfx(snow ? 'snow' : 'grass');
      }
    }
  }

  /** The horizon in stage px (Sea.svelte's top: --if-hy − --if-st, registered lengths resolved to px on the stage). */
  function horizonPx(stage: HTMLElement, r: DOMRect): number {
    const cs = getComputedStyle(stage);
    const hy = parseFloat(cs.getPropertyValue('--if-hy')), st = parseFloat(cs.getPropertyValue('--if-st'));
    return Number.isFinite(hy) && Number.isFinite(st) ? hy - st : HORIZON_U * (r.width / 390);
  }

  function sky(e: PointerEvent, r: DOMRect, x: number, y: number, calm: boolean) {
    const s = scene!;
    const orb = s.querySelector('.orb');
    const o = orb?.getBoundingClientRect();
    if (orb && o && near(o, e.clientX, e.clientY, 0.7)) {
      const ox = o.left + o.width / 2 - r.left, oy = o.top + o.height / 2 - r.top;
      if (calm) return spawn({ kind: 'glow', x: ox, y: oy }, 450);
      jiggle(orb, POP, 600);
      if (night) {
        spawn({ kind: 'moon', x: ox, y: oy });
        shootingStar(r);
        return sceneSfx('moon');
      }
      spawn({ kind: 'sun', x: ox, y: oy });
      return sceneSfx('sun');
    }
    for (const c of s.querySelectorAll('.cloud')) {
      const b = c.getBoundingClientRect();
      if (!near(b, e.clientX, e.clientY)) continue;
      if (calm) return spawn({ kind: 'glow', x, y }, 450);
      jiggle(c, SQUISH, 620);
      // the wisps break off the cloud's edge on the tapped side (white on white would vanish inside it)
      const dir = e.clientX < b.left + b.width / 2 ? -1 : 1;
      const ex = (dir < 0 ? b.left + b.width * 0.1 : b.right - b.width * 0.1) - r.left;
      spawn({ kind: 'cloud', x: ex, y: b.top + b.height * 0.55 - r.top, dir });
      return sceneSfx('cloud');
    }
    if (!night) return;
    if (calm) return spawn({ kind: 'glow', x, y }, 450);
    spawn({ kind: 'star', x, y });
    sceneSfx('star');
    if (roll(4)) shootingStar(r);
  }

  /** NH's shooting star: a quick white streak falling to the lower left through the upper night sky (no wish, no
   *  points; just the moment). */
  function shootingStar(r: DOMRect) {
    const stage = scene?.querySelector<HTMLElement>('.stage');
    const s = scene?.getBoundingClientRect();
    if (!s || !stage) return;
    const top = s.top - r.top; // the scene's top in stage px (negative: the sky is above the stage)
    const horizon = horizonPx(stage, r);
    const h = horizon - top;
    const y0 = top + h * (0.3 + Math.random() * 0.2);
    spawn({ kind: 'shoot', x: r.width * (0.55 + Math.random() * 0.35), y: Math.min(y0, horizon - 80) }, 1000);
    sceneSfx('shooting-star');
  }

  // The listener lives on the scene (no element of ours under the finger: the art keeps pointer-events: none).
  $effect(() => {
    const el = scene;
    if (!el) return;
    el.addEventListener('pointerdown', onDown);
    return () => el.removeEventListener('pointerdown', onDown);
  });

  // A clear night: now and then a shooting star on its own (45–120 s apart; not while covered / hidden).
  $effect(() => {
    if (!night || !enabled() || reducedMotion()) return;
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      id = setTimeout(() => {
        const r = scene?.querySelector('.stage')?.getBoundingClientRect();
        if (r && enabled()) shootingStar(r);
        arm();
      }, 45_000 + Math.random() * 75_000);
    };
    arm();
    return () => clearTimeout(id);
  });

  const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z';
</script>

<div class="taps" aria-hidden="true">
  {#each fx as f (f.id)}
    <span class="fx {f.kind}" class:flip={f.flip} class:snow={f.v === 'snow'} data-fx={f.kind} style:left="{f.x}px" style:top="{f.y}px"
      style:--c={f.color} style:--dir={f.dir}>
      {#if f.kind === 'bush'}
        {#each [-1, 0.3, 1] as dx, i (i)}
          <span class="bit" style:--dx={dx} style:--i={i}>
            {#if f.v === 'leaf'}<i class="leaf"></i>
            {:else if f.v === 'snow'}<i class="clump"></i>
            {:else}<OfficialArt key={seasonArt(f.v as SeasonItem)} size="calc(15 * var(--su))" eager />{/if}
          </span>
        {/each}
      {:else if f.kind === 'flower'}
        <i class="petal" style:--dx="-1"></i><i class="petal two" style:--dx="1"></i>
        <svg class="spark" viewBox="0 0 24 24"><path d={STAR} /></svg>
        {#if f.rare === 'butterfly'}
          <span class="bfly"><svg viewBox="-12 -10 24 20">
            <g class="wing"><path d="M0 0 C-4 -9 -12 -9 -11 -2 C-10 2 -4 2 0 0 Z M0 0 C-3 3 -9 6 -7 9 C-5 10 -1 5 0 0 Z" /></g>
            <g class="wing r"><path d="M0 0 C4 -9 12 -9 11 -2 C10 2 4 2 0 0 Z M0 0 C3 3 9 6 7 9 C5 10 1 5 0 0 Z" /></g>
            <ellipse rx="1" ry="4.5" fill="#5B4636" />
          </svg></span>
        {:else if f.rare === 'firefly'}
          <i class="firefly"></i>
        {/if}
      {:else if f.kind === 'splash'}
        <i class="ring"></i><i class="ring late"></i>
        {#each [-1, 0, 1] as dx, i (i)}<i class="drop" style:--dx={dx} style:--i={i}></i>{/each}
        {#if f.rare === 'fish'}<i class="fish"></i>{/if}
      {:else if f.kind === 'sand' || f.kind === 'grass'}
        {#if f.kind === 'sand' || f.v === 'snow'}<i class="print"></i><i class="print r"></i>{/if}
        {#each [-1, 0, 1] as dx, i (i)}<i class="puff" style:--dx={dx} style:--i={i}></i>{/each}
      {:else if f.kind === 'cloud'}
        {#each [-0.6, 0.2, 1] as dy, i (i)}<i class="wisp" style:--dy={dy} style:--i={i}></i>{/each}
      {:else if f.kind === 'sun'}
        <i class="halo"></i>
        <svg class="glint" viewBox="0 0 24 24"><path d={STAR} /></svg>
        <i class="flare"></i><i class="flare far"></i>
      {:else if f.kind === 'moon' || f.kind === 'star'}
        <svg class="twinkle" viewBox="0 0 24 24"><path d={STAR} /></svg>
      {:else if f.kind === 'shoot'}
        <span class="streak"><i></i></span>
      {:else}
        <i class="dot"></i>
      {/if}
    </span>
  {/each}
</div>

<style>
  /* inside the stage, over the time-of-day tint (z 80) with the fireflies (z 82), so the sky's sparkles and a firefly
     glow; at night the ground's flourishes are dimmed instead (the tint would only grey them) */
  .taps { position: absolute; inset: 0; z-index: 82; pointer-events: none; --su: calc(100cqw / 390); }
  :global(.if-scene[data-tod='night']) :is(.bush, .splash, .sand, .grass, .flower .petal, .flower .spark) { opacity: .55; }
  :global(.if-scene[data-tod='dusk']) :is(.bush, .splash, .sand, .grass, .flower .petal) { opacity: .85; }
  .fx { position: absolute; width: 0; height: 0; }
  .fx > * { position: absolute; }
  .fx i { display: block; }
  .flip { scale: -1 1; }

  /* bush: three leaves pop up off the top and flutter down to either side */
  .bit {
    left: 0; top: 0; width: calc(16 * var(--su)); height: calc(16 * var(--su)); translate: -50% -50%; line-height: 0;
    display: grid; place-items: center; animation: bit .95s cubic-bezier(.25, .6, .45, 1) calc(var(--i) * 45ms) both; }
  @keyframes bit {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; }
    12% { opacity: 1; }
    34% { transform: translate(calc(var(--dx) * 13 * var(--su)), calc(-15 * var(--su))) rotate(calc(var(--dx) * 70deg + 20deg)); }
    75% { opacity: 1; }
    100% { transform: translate(calc(var(--dx) * 26 * var(--su)), calc(16 * var(--su))) rotate(calc(var(--dx) * 170deg + 80deg)); opacity: 0; }
  }
  .bit :global(img) { max-width: none; }
  .bit .leaf {
    width: calc(13 * var(--su)); height: calc(7.5 * var(--su)); border-radius: 0 80% 0 80%;
    background: linear-gradient(135deg, #8FD16A, #4FA644);
  }
  .bit .clump {
    width: calc(11 * var(--su)); height: calc(8 * var(--su)); border-radius: 50% 50% 45% 45%;
    background: #fff; box-shadow: 0 1px 0 #D5E2F2;
  }

  /* flower: two petals drift down and a sparkle pops at the bloom */
  .petal {
    left: 0; top: 0; width: calc(8 * var(--su)); height: calc(5.5 * var(--su)); margin: calc(-2.75 * var(--su)) 0 0 calc(-4 * var(--su));
    border-radius: 60% 40% 60% 40%; background: var(--c); box-shadow: 0 0 0 .5px rgba(120, 80, 60, .25);
    animation: petal .95s ease-out both;
  }
  .petal.two { animation-delay: 70ms; }
  @keyframes petal {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; }
    15% { opacity: 1; transform: translate(calc(var(--dx) * 5 * var(--su)), calc(-6 * var(--su))) rotate(40deg); }
    100% { transform: translate(calc(var(--dx) * 15 * var(--su)), calc(14 * var(--su))) rotate(calc(var(--dx) * 200deg)); opacity: 0; }
  }
  .spark, .twinkle, .glint { fill: #FFF8D8; overflow: visible; }
  .spark {
    left: calc(4 * var(--su)); top: calc(-12 * var(--su)); width: calc(10 * var(--su)); height: calc(10 * var(--su));
    animation: twinkle .7s ease-out both;
  }
  @keyframes twinkle {
    0% { transform: scale(0) rotate(0); opacity: 0; } 35% { transform: scale(1.1) rotate(45deg); opacity: 1; }
    100% { transform: scale(0) rotate(90deg); opacity: 0; }
  }
  /* NH's common butterfly (white, a little yellow at the base): it lifts off the bloom and away, flapping */
  .bfly { left: 0; top: 0; width: calc(18 * var(--su)); margin: calc(-7.5 * var(--su)) 0 0 calc(-9 * var(--su)); line-height: 0; animation: bfly 1.05s ease-in both; }
  .bfly svg { width: 100%; height: auto; overflow: visible; }
  .bfly .wing { fill: #FFFDF3; stroke: #E4C979; stroke-width: .7; transform-origin: 0 0; animation: flap .14s ease-in-out infinite alternate; }
  .bfly .wing.r { animation-delay: 0s; }
  @keyframes flap { to { scale: .25 1; } }
  @keyframes bfly {
    0% { transform: translate(0, 0) rotate(-8deg); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(calc(12 * var(--su)), calc(-22 * var(--su))) rotate(10deg); }
    70% { transform: translate(calc(6 * var(--su)), calc(-40 * var(--su))) rotate(-6deg); opacity: 1; }
    100% { transform: translate(calc(24 * var(--su)), calc(-62 * var(--su))) rotate(12deg); opacity: 0; }
  }
  /* a firefly rising out of the bed, blinking (summer nights; above the tint like the scene's own fireflies) */
  .firefly {
    left: 0; top: 0; width: 4.4px; height: 4.4px; margin: -2.2px; border-radius: 50%;
    background: var(--firefly, #F6FF9E); box-shadow: 0 0 7px var(--firefly-glow, #EFFF7A); animation: firefly 1.05s ease-out both;
  }
  @keyframes firefly {
    0% { transform: translate(0, 0); opacity: 0; } 25% { opacity: 1; } 45% { opacity: .35; } 65% { opacity: 1; }
    100% { transform: translate(calc(-10 * var(--su)), calc(-34 * var(--su))); opacity: 0; }
  }

  /* sea: two foreshortened rings and three droplets; rarely a fish shadow slips away */
  .ring {
    left: 0; top: 0; width: calc(30 * var(--su)); height: calc(10 * var(--su)); margin: calc(-5 * var(--su)) 0 0 calc(-15 * var(--su));
    border: 1.6px solid rgba(255, 255, 255, .9); border-radius: 50%; animation: ring .8s ease-out both;
  }
  .ring.late { animation-delay: .16s; animation-duration: .75s; }
  @keyframes ring { 0% { transform: scale(.15); opacity: 1; } 100% { transform: scale(1.35); opacity: 0; } }
  .drop {
    left: 0; top: 0; width: calc(3 * var(--su)); height: calc(3.6 * var(--su)); margin: calc(-1.8 * var(--su)) 0 0 calc(-1.5 * var(--su));
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: #fff;
    animation: drop .55s cubic-bezier(.3, .8, .6, 1) calc(var(--i) * 30ms) both;
  }
  @keyframes drop {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 6 * var(--su)), calc((-13 + var(--dx) * var(--dx) * 4) * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 11 * var(--su)), 0); opacity: 0; }
  }
  .fish {
    left: 0; top: 0; width: calc(22 * var(--su)); height: calc(8 * var(--su)); margin: calc(-2 * var(--su)) 0 0 calc(-2 * var(--su));
    background:
      radial-gradient(closest-side, rgba(18, 52, 92, .55), rgba(18, 52, 92, .3) 60%, transparent) 0 0 / 78% 100% no-repeat,
      radial-gradient(closest-side, rgba(18, 52, 92, .4), transparent) 100% 50% / 30% 70% no-repeat;
    animation: fish 1.05s ease-in-out both;
  }
  @keyframes fish {
    0% { transform: translate(calc(-6 * var(--su)), calc(6 * var(--su))) rotate(-4deg); opacity: 0; }
    30% { opacity: 1; } 55% { transform: translate(calc(-14 * var(--su)), calc(7 * var(--su))) rotate(4deg); opacity: 1; }
    100% { transform: translate(calc(-36 * var(--su)), calc(10 * var(--su))) rotate(-3deg); opacity: 0; }
  }

  /* ground: footprints (sand, snow) and a little dust / snow puff, as NH's running leaves */
  .print {
    left: calc(-8 * var(--su)); top: calc(-1 * var(--su)); width: calc(5.5 * var(--su)); height: calc(3.6 * var(--su));
    border-radius: 50%; background: rgba(150, 105, 55, .32); animation: print 1.05s ease-out both;
  }
  .print.r { left: calc(2.5 * var(--su)); top: calc(-6.5 * var(--su)); animation-delay: .1s; }
  .snow .print { background: rgba(110, 140, 190, .45); }
  @keyframes print { 0% { opacity: 0; } 15% { opacity: 1; } 60% { opacity: .9; } 100% { opacity: 0; } }
  .puff {
    left: 0; top: 0; width: calc(8.5 * var(--su)); height: calc(8.5 * var(--su)); margin: calc(-7 * var(--su)) 0 0 calc(-4.25 * var(--su));
    border-radius: 50%; background: rgba(255, 248, 228, .92); animation: puff .6s ease-out calc(var(--i) * 35ms) both;
  }
  .grass .puff { background: rgba(255, 255, 255, .88); }
  .snow .puff { background: #fff; box-shadow: 0 1px 2px rgba(110, 140, 190, .5); }
  @keyframes puff {
    0% { transform: translate(0, 0) scale(.3); opacity: 0; } 25% { opacity: 1; }
    100% { transform: translate(calc(var(--dx) * 12 * var(--su)), calc((-6 + var(--dx) * var(--dx) * 3) * var(--su))) scale(1.25); opacity: 0; }
  }

  /* cloud: three soft wisps break off the side you tapped and dissolve */
  .wisp {
    --s: calc(15px - var(--i) * 3px);
    left: 0; top: 0; width: var(--s); height: var(--s); margin: calc(var(--s) / -2); border-radius: 50%; background: var(--cloud-top, #fff);
    box-shadow: inset 0 -3px 3px var(--cloud-mid, #E3F0FB); opacity: calc(.95 * var(--cloud-op, 1)); animation: wisp .7s ease-out calc(var(--i) * 50ms) both;
  }
  @keyframes wisp {
    0% { transform: translate(0, 0) scale(.9); opacity: 0; } 20% { opacity: .95; }
    100% { transform: translate(calc(var(--dir, 1) * (18px + var(--i) * 8px)), calc(var(--dy) * 12px)) scale(.35); opacity: 0; }
  }

  /* sun: a soft halo, a turning four-point glint and two lens flecks down-right (light from the upper left) */
  .halo {
    left: 0; top: 0; width: 44px; height: 44px; margin: -22px; border-radius: 50%; border: 2px solid rgba(255, 250, 215, .9);
    animation: ring .65s ease-out both;
  }
  .glint { left: -15px; top: -15px; width: 30px; height: 30px; animation: twinkle .75s ease-out both; }
  .flare {
    left: 18px; top: 15px; width: 7px; height: 7px; margin: -3.5px; border-radius: 50%; background: rgba(255, 255, 240, .75);
    animation: print .7s ease-out .08s both;
  }
  .flare.far { left: 34px; top: 28px; width: 4px; height: 4px; margin: -2px; animation-delay: .16s; }

  /* moon / night sky: a star twinkles where you tapped */
  .twinkle { left: -8px; top: -8px; width: 16px; height: 16px; animation: twinkle .7s ease-out both; }
  .moon .twinkle { left: 12px; top: -22px; width: 12px; height: 12px; }

  /* shooting star: NH's quick white streak falling to the lower left */
  .streak { left: 0; top: 0; transform-origin: 0 0; animation: shoot .85s cubic-bezier(.45, 0, .8, .6) both; }
  .streak i {
    position: absolute; right: 0; top: -1px; width: 64px; height: 2px; border-radius: 2px;
    background: linear-gradient(to left, #FFFBEA, rgba(255, 251, 234, 0));
  }
  .streak::after {
    content: ''; position: absolute; left: -2.5px; top: -2.5px; width: 5px; height: 5px; border-radius: 50%;
    background: #FFFDF0; box-shadow: 0 0 6px 2px rgba(255, 246, 200, .7);
  }
  @keyframes shoot {
    0% { transform: rotate(152deg) translateX(0); opacity: 0; } 12% { opacity: 1; } 75% { opacity: 1; }
    100% { transform: rotate(152deg) translateX(150px); opacity: 0; }
  }

  /* reduced motion: a soft glow where you tapped, nothing moves */
  .dot {
    left: 0; top: 0; width: 22px; height: 22px; margin: -11px; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 255, 240, .75), transparent); animation: print .45s ease-out both;
  }
  @media (prefers-reduced-motion: reduce) {
    .fx * { animation-name: print !important; transform: none !important; }
  }
</style>
