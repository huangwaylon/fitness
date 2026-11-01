<script lang="ts">
  // The ground (docs/design.md "World"): the island's plan baked into raster chunks at build time (scripts/terrain.ts:
  // the sea's rings, the beach, the grass, paths, the plaza, the river, the pond, the cliff, the bridges' decks and the
  // still things' contact shadows), one set per season, drawn by 40 bands bent onto the log: each band is a slice of its
  // chunk, squashed into a trapezoid by one matrix3d (roll.ts band + quadMatrix; 1px overlap hides the seams). Only
  // the bands in view are shown. Chunks 0–3 (まえ and ひろば) load at once, 4–7 (おく, the tier above, the back sea)
  // when the camera nears them or the browser is idle after the first paint. Nothing animates in here: the live water
  // is its own layer (WorldWater).
  import { asset } from '$app/paths';
  import { onMount } from 'svelte';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { band, quadMatrix } from './roll.ts';
  import { BANDS, BAND_D, PLAN } from './world.ts';
  import { useWorld } from './camera.svelte.ts';

  let { season, lazyFrom = 500 }: { season: Season; lazyFrom?: number } = $props();

  interface Terrain { px: number; chunkD: number; chunks: number; seasons: string[]; bytes?: Record<string, number[]> }
  /** The bake's manifest (absent before the first bake: the bands then show plain colours). */
  const TERRAIN = Object.values(import.meta.glob<Terrain>('./terrain.json', { eager: true, import: 'default' }))[0] ?? null;
  const W = PLAN.x1 - PLAN.x0;
  const PER = TERRAIN ? Math.round(TERRAIN.chunkD / BAND_D) : 5;
  const CHUNK_D = TERRAIN?.chunkD ?? BAND_D * 5;
  /** The front chunks load at once; the back ones when the camera nears them. */
  const EAGER = 4;

  const w = useWorld();
  /** Far first: a nearer band paints over its 1px overlap. */
  const order = Array.from({ length: BANDS }, (_, i) => BANDS - 1 - i);
  let back = $state(false);
  /** A season's chunk: its URL carries the bake's byte count, so a new bake is a new URL (the art cache outlives builds). */
  const src = (c: number) => {
    if (!TERRAIN) return null;
    const ss = TERRAIN.seasons.includes(season) ? season : 'summer';
    return `${asset(`terrain/${ss}/${c}.webp` as Parameters<typeof asset>[0])}?v=${TERRAIN.bytes?.[ss]?.[c] ?? 0}`;
  };

  let els: HTMLElement[] = [];
  const st = Array.from({ length: BANDS }, () => ({ shown: false, tf: '' }));
  const keep = (i: number) => (el: HTMLElement) => {
    els[i] = el;
  };

  function placeBands() {
    const v = w.view, s = v.s, Wp = W * s, Hp = BAND_D * s;
    if (!back && v.camZ > lazyFrom) back = true;
    const xc = v.vw / 2 + (PLAN.x0 + W / 2 - w.P.cx) * s;
    for (let i = 0; i < BANDS; i++) {
      const el = els[i], b = st[i];
      if (!el) continue;
      const z0 = PLAN.z0 + i * BAND_D;
      const q = band(z0, z0 + BAND_D, v.camZ, w.P);
      const y0 = v.pivot + q.y * s, top = y0 - q.span * s;
      if (!q.visible || top > v.vh + 1 || y0 < v.horizon - 2) {
        if (b.shown) {
          el.style.visibility = 'hidden';
          b.shown = false;
        }
        continue;
      }
      if (!b.shown) {
        el.style.visibility = '';
        b.shown = true;
      }
      const hn = (Wp / 2) * q.scaleNear, hf = (Wp / 2) * q.scaleFar;
      const m = quadMatrix(Wp, Hp, [xc - hf, top - 1, xc + hf, top - 1, xc + hn, y0, xc - hn, y0]);
      const tf = `matrix3d(${m.map((n) => +n.toFixed(6)).join(',')})`;
      if (tf !== b.tf) {
        el.style.transform = b.tf = tf;
        w.perf.writes++;
      }
    }
  }

  onMount(() => {
    w.onGround(placeBands);
    const idle = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const t = idle ? idle(() => (back = true), { timeout: 4000 }) : setTimeout(() => (back = true), 2500);
    return () => {
      w.onGround(null);
      if (!idle) clearTimeout(t);
    };
  });
  $effect(() => {
    void season;
    for (const b of st) b.tf = '';
    w.invalidate();
  });
</script>

<div class="ground" aria-hidden="true" data-world-ground>
  {#each order as i (i)}
    {@const c = Math.floor(i / PER)}
    {@const url = c < EAGER || back ? src(c) : null}
    <div class="gband" data-i={i} style:visibility="hidden" {@attach keep(i)} style:width="calc({W} * var(--u))" style:height="calc({BAND_D} * var(--u))">
      {#if url}
        <img src={url} alt="" draggable="false" decoding="async" fetchpriority={c < 2 ? 'high' : 'low'}
          style:height="calc({CHUNK_D} * var(--u))" style:top="calc({-(CHUNK_D - (i - c * PER + 1) * BAND_D)} * var(--u))" />
      {/if}
    </div>
  {/each}
</div>

<style>
  .ground { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
  /* the plan's plain colours under the images (before a chunk loads, or before the first bake) */
  .gband {
    position: absolute; left: 0; top: 0; overflow: hidden; transform-origin: 0 0; will-change: transform;
    background: linear-gradient(90deg, #3A8EDF 0 17%, #F3D493 17% 21%, var(--grass) 21% 70%, #F3D493 70% 74%, #3A8EDF 74%);
  }
  .gband img { position: absolute; left: 0; width: 100%; display: block; max-width: none; user-select: none; -webkit-user-drag: none; }
</style>
