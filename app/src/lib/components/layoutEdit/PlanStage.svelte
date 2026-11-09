<script lang="ts">
  // The island top-down at a phone's size (plan.ts's drawing), a stage for the island's もようがえ (IslandEdit) where
  // there's no 3D: the editor's phone view with `?preview=0` (the e2e: CI draws WebGL in software). The camera's z at
  // the screen's middle; one finger drags it along the island.
  import { onMount } from 'svelte';
  import type { Layout } from '#lib/layout/model.ts';
  import { GRID, TILE } from '#lib/layout/grid.ts';
  import { draw, toScreen, toWorld, type View } from '../editor/plan.ts';
  import type { EditStage } from './IslandEdit.svelte';

  let { layout, camZ = $bindable(300), stage = $bindable() }: { layout: Layout; camZ?: number; stage?: EditStage } = $props();
  let wrap = $state<HTMLDivElement>();
  let canvas = $state<HTMLCanvasElement>();
  let W = $state(393), H = $state(852);
  /** The grid's width across the screen (as the phone's 3D camera shows it). */
  const view = $derived.by((): View => {
    const s = W / (GRID.cols * TILE * 0.78);
    const z1 = GRID.z0 + GRID.rows * TILE;
    return { s, ox: (W - GRID.cols * TILE * s) / 2, oy: H / 2 - (z1 - camZ) * s };
  });
  $effect(() => {
    const c = canvas, ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = devicePixelRatio || 1;
    c.width = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(ctx, { layout, view, w: W, h: H, grid: true, selected: new Set(), hover: null, issues: [], icon: () => null });
  });
  /** What follows the camera (IslandEdit's: EditStage moved). */
  const movers = new Set<() => void>();
  $effect(() => {
    void view;
    for (const f of movers) f();
  });
  onMount(() => {
    const ro = new ResizeObserver(() => {
      const r = wrap!.getBoundingClientRect();
      W = r.width;
      H = r.height;
    });
    ro.observe(wrap!);
    stage = {
      host: wrap!,
      toScreen: (x, z) => toScreen(view, x, z),
      toGround: (sx, sy) => toWorld(view, sx, sy),
      size: () => [W, H],
      moved: (fn) => (movers.add(fn), () => void movers.delete(fn))
    };
    // one finger along the island (the mode takes the taps that are its own first)
    let drag: { y: number; z: number } | null = null;
    const down = (e: PointerEvent) => (drag = { y: e.clientY, z: camZ });
    const move = (e: PointerEvent) => drag && (camZ = Math.max(0, Math.min(GRID.z0 + GRID.rows * TILE, drag.z + (e.clientY - drag.y) / view.s)));
    const up = () => (drag = null);
    wrap!.addEventListener('pointerdown', down);
    wrap!.addEventListener('pointermove', move);
    wrap!.addEventListener('pointerup', up);
    return () => ro.disconnect();
  });
</script>

<div class="ps" bind:this={wrap} data-plan-stage><canvas bind:this={canvas}></canvas></div>

<style>
  .ps { position: fixed; inset: 0; touch-action: none; background: #2f74b8; }
  canvas { display: block; width: 100%; height: 100%; }
</style>
