<script lang="ts">
  // The live water (docs/design.md "World"): the only moving parts of the ground, each a light world node over the
  // baked terrain, CSS-animated (transform and opacity only; no timers, no rAF), held still under a sheet and while
  // hidden. The shore's foam wash along the front beach (ShoreWash, a ground quad), the waterfall through the cliff
  // (Waterfall, upright, over the cliff's upright face), glints twinkling on the open sea (a fixed pool, a few in view at a time), short flow streaks
  // drifting down the river, and the pond's lily pads with one slow ripple (petals or maple leaves afloat in their
  // weeks, on the pond and riding the river). The bridges' and the dock's upright front faces stand at their near edges, so they read raised.
  import { asset } from '$app/paths';
  import { useWorld } from './camera.svelte.ts';
  import { BRIDGES, CLIFF, DOCK, POND, RIVER } from './world.ts';
  import ShoreWash from './ShoreWash.svelte';
  import Waterfall from './Waterfall.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { seasonArt } from '#lib/art.ts';

  let { floating = null, night = false, winter = false }: { floating?: 'petal' | 'maple' | null; night?: boolean; winter?: boolean } = $props();
  const w = useWorld();

  /** Glints on the open sea: in front of the beach, along both sides and behind the island. [x, z] */
  const GLINTS: [number, number][] = [
    [40, -90], [170, -150], [290, -70], [-120, -40], [430, -180], [110, -260],
    [-150, 420], [540, 520], [-160, 980], [550, 1120], [-150, 1560], [545, 1700],
    [60, 2300], [300, 2260], [-80, 2380], [470, 2340]
  ];
  /** Flow streaks: along the river every ~60u, alternately either side of its middle, heading downstream. */
  const STREAKS = (() => {
    const out: { x: number; z: number; a: number; d: number }[] = [];
    let k = 0;
    for (let i = 0; i < RIVER.length - 1; i++) {
      const [ax, az, aw] = RIVER[i], [bx, bz] = RIVER[i + 1];
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 60));
      // the plan's local frame: x across, y toward the camera (−z)
      const a = (Math.atan2(-(bz - az), bx - ax) * 180) / Math.PI;
      for (let j = 0; j < n; j++, k++) {
        const t = (j + 0.5) / n, side = (k % 2 ? 1 : -1) * aw * 0.22;
        const nx = -(bz - az) / len, nz = (bx - ax) / len;
        const x = ax + (bx - ax) * t + nx * side, z = az + (bz - az) * t + nz * side;
        // the waterfall's drop has its own sheet
        if (z > CLIFF.z0 - 10 && z < CLIFF.z1 + 10) continue;
        out.push({ x, z, a, d: -((k * 0.53) % 2.5) });
      }
    }
    return out;
  })();
  /** Petals or maple leaves riding the river in their weeks (NH's official petal and leaf icons): one every ~50u along
   *  the east reach and the crossing below the plaza, each drifting 36u downstream over 15 s, turning slowly, then the
   *  next lap from its spot (the cycles out of step). Above the falls the spring's reach has none. */
  const FLOATS = (() => {
    const out: { x: number; z: number; a: number; d: number; spin: number }[] = [];
    let k = 0;
    for (let i = 3; i < 13; i++) {
      const [ax, az] = RIVER[i], [bx, bz] = RIVER[i + 1];
      const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(len / 50));
      const a = (Math.atan2(-(bz - az), bx - ax) * 180) / Math.PI;
      for (let j = 0; j < n; j++, k++) {
        const t = (j + 0.3) / n, side = (((k * 7) % 5) - 2) * 2.4;
        const nx = -(bz - az) / len, nz = (bx - ax) / len;
        out.push({ x: ax + (bx - ax) * t + nx * side, z: az + (bz - az) * t + nz * side, a, d: -((k * 3.7) % 15), spin: k % 2 ? 1 : -1 });
      }
    }
    return out;
  })();
  /** The bake's version (its chunks' byte counts summed): a new bake is a new URL (the art cache outlives builds). */
  const BAKE = Object.values(import.meta.glob<{ bytes?: Record<string, number[]> }>('./terrain.json', { eager: true, import: 'default' }))[0];
  const V = Object.values(BAKE?.bytes ?? {}).flat().reduce((a, b) => a + b, 0);
  const sprite = (name: string) => `${asset(`terrain/sprites/${name}${winter ? '-winter' : ''}.webp` as Parameters<typeof asset>[0])}?v=${V}`;
  /** The bridges' and the dock's front faces (terrain.ts bakes them, 3 px a unit): their size in units, the bottom edge
   *  at the near edge of the deck (the dock's at the waterline). */
  const FRONTS = [
    { id: 'bridge-stone', x: BRIDGES[0].x, z: BRIDGES[0].z0, w: 52, h: 12 },
    { id: 'bridge-log', x: BRIDGES[1].x, z: BRIDGES[1].z0, w: 34, h: 7.14 },
    { id: 'dock-front', x: (DOCK.x0 + DOCK.x1) / 2, z: DOCK.z0, w: DOCK.x1 - DOCK.x0, h: 11 }
  ];
</script>

<div class="water" aria-hidden="true" data-world-water>
  <div class="node" {@attach w.at({ mode: 'quad', x: 0, z: 0, box: { x0: 70, x1: 320, z0: -24, z1: 16 } })}>
    <ShoreWash x0={70} x1={320} />
  </div>
  <!-- the cliff's upright face (rock strata, the grass lip, the stairs carved in, the falls' wet niche) and the falls
       over it -->
  <div class="node up" {@attach w.at({ x: (CLIFF.x0 + CLIFF.x1) / 2, z: CLIFF.z0, h: 30 })}>
    <img class="front" src={sprite('cliff-face')} alt="" draggable="false" style:width="calc({CLIFF.x1 - CLIFF.x0} * var(--u))" style:height="calc(30 * var(--u))" />
  </div>
  <div class="node up" {@attach w.at({ x: (CLIFF.fall[0] + CLIFF.fall[1]) / 2, z: CLIFF.z0, h: 34, dz: -0.5 })}>
    <div class="fall"><Waterfall {night} /></div>
  </div>
  {#each FRONTS as f (f.id)}
    <div class="node up" {@attach w.at({ x: f.x, z: f.z, h: f.h, dz: 6 })}>
      <img class="front" src={sprite(f.id)} alt="" draggable="false" style:width="calc({f.w} * var(--u))" style:height="calc({f.h} * var(--u))" />
    </div>
  {/each}

  {#each GLINTS as [x, z], i (i)}
    <div class="node" {@attach w.at({ x, z, h: 10, zi: 5 })}>
      <svg class="glint" viewBox="0 0 24 24" style:animation-delay="{-(i * 1.37) % 4.8}s"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
    </div>
  {/each}
  {#each STREAKS as st, i (i)}
    <div class="node" {@attach w.at({ mode: 'flat', x: st.x, z: st.z, h: 4, zi: 6 })}>
      <i class="flow" style:rotate="{st.a}deg" style:animation-delay="{st.d}s"></i>
    </div>
  {/each}

  {#if floating}
    {#each FLOATS as f, i (i)}
      <div class="node" data-river-float={floating} {@attach w.at({ mode: 'flat', x: f.x, z: f.z, h: 6, zi: 7 })}>
        <i class="float" style:rotate="{f.a}deg" style:animation-delay="{f.d}s">
          <span class="leaf" style:--spin={f.spin} style:animation-delay="{f.d}s"><OfficialArt key={seasonArt(floating === 'petal' ? 'petal' : 'maple-leaf')} size="calc({floating === 'petal' ? 7 : 8} * var(--u))" /></span>
        </i>
      </div>
    {/each}
  {/if}

  <!-- the pond: lily pads (one in bloom), a slow ripple; petals or maple leaves afloat in their weeks -->
  <div class="node" {@attach w.at({ mode: 'flat', x: POND.x, z: POND.z, h: 4, zi: 7 })}>
    <svg class="pond" viewBox="-40 -22 80 44" style:width="calc(80 * var(--u))" style:height="calc(44 * var(--u))">
      <ellipse class="ripple" cx="6" cy="1" rx="15" ry="9" />
      <g class="pads">
        <path d="M18 5 m-6 0 a6 4 0 1 0 12 0 a6 4 0 0 0 -4.8 -3.9 l-1.2 3.9 l-1.6 -3.7 a6 4 0 0 0 -4.4 3.7 z" fill="#5DB65A" />
        <path d="M-14 11 m-4.4 0 a4.4 3 0 1 0 8.8 0 a4.4 3 0 0 0 -3.5 -2.9 l-.9 2.9 l-1.2 -2.7 a4.4 3 0 0 0 -3.2 2.7 z" fill="#6CC468" />
        <path d="M-22 -6 m-3.6 0 a3.6 2.4 0 1 0 7.2 0 a3.6 2.4 0 0 0 -2.9 -2.3 l-.7 2.3 l-1 -2.2 a3.6 2.4 0 0 0 -2.6 2.2 z" fill="#58AE55" />
        <g transform="translate(19.5 3)">
          <ellipse cx="-1.6" cy="0" rx="1.9" ry="1.2" fill="#FF9EC2" /><ellipse cx="1.6" cy="0" rx="1.9" ry="1.2" fill="#FF9EC2" />
          <ellipse cx="0" cy="-1" rx="1.4" ry="1.8" fill="#FFB7D2" /><circle cx="0" cy="-.1" r=".7" fill="#FFE07A" />
        </g>
      </g>
      {#if floating}
        <g class="floating" data-floating={floating}>
          {#each [[-26, 2, 20], [-10, 9, -35], [3, -6, 70], [12, 8, 140], [27, 0, -60]] as [fx, fy, turn], i (i)}
            <g transform="translate({fx} {fy}) rotate({turn}) scale(1.4 1)">
              {#if floating === 'petal'}
                <path d="M0 -2.2 C1.5 -2.2 1.9 -.4 0 1.6 C-1.9 -.4 -1.5 -2.2 0 -2.2 Z" fill="#FFC6D9" />
              {:else}
                <path d="M0 -2.6 L.6 -1 L2.2 -1.5 L1.2 -.1 L2.4 .8 L.7 .7 L.4 2 L0 1 L-.4 2 L-.7 .7 L-2.4 .8 L-1.2 -.1 L-2.2 -1.5 L-.6 -1 Z" fill={['#E8572E', '#F08A2E', '#D9442B'][i % 3]} />
              {/if}
            </g>
          {/each}
        </g>
      {/if}
    </svg>
  </div>
</div>

<style>
  .water { display: contents; }
  .node { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .node.up .fall { position: absolute; left: 0; bottom: 0; translate: -50% 0; }
  .front { position: absolute; left: 0; bottom: 0; translate: -50% 0; display: block; max-width: none; }
  /* a four-point glint twinkling on the sea: 1.6 s of a 4.8 s cycle, each out of step */
  .glint {
    position: absolute; left: 0; bottom: 0; width: calc(12 * var(--u)); height: calc(12 * var(--u)); translate: -50% 0; fill: #FFFFFF;
    opacity: 0; filter: drop-shadow(0 0 2px rgba(255, 255, 255, .9)); animation: sea-glint 4.8s ease-in-out infinite;
  }
  @keyframes sea-glint {
    0%, 66% { transform: scale(0) rotate(0); opacity: 0; } 76% { transform: scale(1) rotate(30deg); opacity: .95; }
    86% { transform: scale(.55) rotate(60deg); opacity: .6; } 100% { transform: scale(0) rotate(90deg); opacity: 0; }
  }
  /* a short white streak drifting 10u downstream over 1.4 s, fading in and out (a 2.5 s cycle) */
  .flow {
    position: absolute; left: 0; top: 0; width: calc(9 * var(--u)); height: calc(1.6 * var(--u)); border-radius: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, .85) 40%, transparent); transform-origin: 0 50%;
    translate: -50% -50%; opacity: 0; animation: flow 2.5s linear infinite;
  }
  @keyframes flow {
    0% { transform: translateX(0); opacity: 0; } 12% { opacity: .8; } 50% { opacity: .8; }
    56% { transform: translateX(calc(10 * var(--u))); opacity: 0; } 100% { transform: translateX(calc(10 * var(--u))); opacity: 0; }
  }
  /* a petal or a leaf riding the current: 36u downstream over 15 s, fading in and out, turning round */
  .float { position: absolute; left: 0; top: 0; transform-origin: 0 0; opacity: 0; animation: ride 15s linear infinite; }
  .leaf {
    position: absolute; left: 0; top: 0; translate: -50% -50%; line-height: 0; display: block;
    filter: drop-shadow(.6px .9px 0 rgba(20, 60, 110, .35)); animation: turn 15s ease-in-out infinite;
  }
  .leaf :global(.official) { max-width: none; }
  @keyframes ride {
    0% { transform: translateX(0); opacity: 0; } 8% { opacity: .95; } 88% { opacity: .95; }
    100% { transform: translateX(calc(36 * var(--u))); opacity: 0; }
  }
  @keyframes turn { 0% { rotate: 0deg; } 50% { rotate: calc(var(--spin) * 140deg); } 100% { rotate: calc(var(--spin) * 260deg); } }
  .pond { position: absolute; left: 0; top: 0; translate: -50% -50%; overflow: visible; }
  .ripple {
    fill: none; stroke: rgba(255, 255, 255, .75); stroke-width: .8; transform-box: fill-box; transform-origin: center;
    animation: pond-ripple 4.6s ease-out infinite;
  }
  .floating { animation: pond-drift 26s ease-in-out infinite alternate; }
  @keyframes pond-drift { from { transform: translateX(-2.5px); } to { transform: translateX(2.5px); } }
  @keyframes pond-ripple { 0% { transform: scale(.15); opacity: 0; } 12% { opacity: .9; } 70%, 100% { transform: scale(1.25); opacity: 0; } }
  :global(.if-scene:is([data-covered], [data-paused])) :is(.glint, .flow, .ripple, .floating, .float, .leaf) { animation-play-state: paused; }
</style>
