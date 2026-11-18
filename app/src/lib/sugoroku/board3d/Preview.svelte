<script lang="ts">
  // Dev-only preview of 英語すごろく's 3D board (engine.ts; /dev/sugoroku3d under `vite dev`): the three of us in their
  // いつもの looks on the board (?layout=<seed>: that game's board; none: the classic), and buttons for each of the engine's moves.
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import { defaultLook } from '#lib/contract/look.ts';
  import { CLASSIC, stepFrom } from '#lib/sugoroku/board.ts';
  import { boardOf, layoutKey } from '#lib/sugoroku/layout.ts';
  import type { Who } from '#lib/types.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import { createBoard3D, type Board3D, type Celebration } from './engine.ts';

  const WHO: Who[] = ['A', 'B', 'G'];
  let canvas: HTMLCanvasElement | undefined = $state();
  let board: Board3D | null = null;
  let k = $state(0), n = $state(3), branch = $state(0), face = $state(0), busy = $state(false);
  let at = $state([0, 0, 0]);

  const seed = typeof location === 'undefined' ? null : new URLSearchParams(location.search).get('layout');
  const plan = (seed && boardOf(layoutKey(seed))) || CLASSIC;
  const BOARD = plan.spaces;
  onMount(() => {
    if (!canvas) return;
    board = createBoard3D(canvas, plan);
    board.setPlayers(WHO.map((who) => ({ who, look: defaultLook(who) })));
    if (testHooks()) (window as { __sg3dPreview?: Board3D }).__sg3dPreview = board;
    return () => {
      board?.dispose();
      board = null;
    };
  });

  const read = () => (at = WHO.map((_, i) => board?.at(i) ?? 0));
  /** The `steps` spaces ahead of player k (every fork as `branch`). */
  function ahead(from: number, steps: number): number[] {
    const out: number[] = [];
    for (let i = from, s = 0; s < steps; s++) {
      const next = stepFrom(plan, i, new Proxy({}, { get: () => branch }));
      if (next === null) break;
      out.push((i = next));
    }
    return out;
  }
  async function run(p: Promise<void>) {
    busy = true;
    await p;
    busy = false;
    read();
  }
  const walk = () => run(board?.walk(k, ahead(board.at(k), n)) ?? Promise.resolve());
  async function rollWalk() {
    if (busy) return;
    if (!board) return;
    const r = 1 + Math.floor(Math.random() * 6);
    face = r;
    board.focus(k);
    busy = true;
    await board.roll(r);
    await board.walk(k, ahead(board.at(k), r));
    board.celebrate(k, r >= 5 ? 'joy' : 'small');
    busy = false;
    read();
    k = (k + 1) % WHO.length;
    board.focus(k);
  }
  const roll = () => {
    face = 1 + Math.floor(Math.random() * 6);
    void run(board?.roll(face) ?? Promise.resolve());
  };
  const celebrate = (c: Celebration) => board?.celebrate(k, c);
</script>

<!-- the models' textures are found from the document's base (world3d/ktx2.ts site): the site's root, not /dev/ -->
<svelte:head><base href={resolve('/')} /></svelte:head>

<main>
  <canvas bind:this={canvas} data-sg3d></canvas>
  <div class="panel">
    <div class="row">
      {#each WHO as w, i (w)}
        <button data-sfx="tick" class:on={k === i} onclick={() => ((k = i), board?.focus(i))}>{w} · {at[i]}{BOARD[at[i]]?.kind === 'goal' ? ' あがり' : ''}</button>
      {/each}
    </div>
    <div class="row">
      <button data-sfx="tick" onclick={rollWalk} aria-disabled={busy} data-act="play">ふる＋あるく</button>
      <button data-sfx="tick" onclick={roll} aria-disabled={busy} data-act="roll">ふる{face ? ` (${face})` : ''}</button>
      <label>歩 <input data-sfx="tick" type="number" min="1" max="12" bind:value={n} /></label>
      <button data-sfx="tick" onclick={walk} aria-disabled={busy} data-act="walk">あるく</button>
    </div>
    <div class="row">
      <button data-sfx="tick" onclick={() => (branch = 1 - branch)}>分かれ道: {branch ? '1' : '0'}</button>
      <button data-sfx="tick" onclick={() => celebrate('joy')} data-act="joy">joy</button>
      <button data-sfx="tick" onclick={() => celebrate('small')}>small</button>
      <button data-sfx="tick" onclick={() => celebrate('sad-free')}>sad-free</button>
      <button data-sfx="tick" onclick={() => (board?.place(k, 0), read())}>ふりだしへ</button>
    </div>
  </div>
</main>

<style>
  main { position: fixed; inset: 0; display: flex; flex-direction: column; background: #bfe6f4; }
  canvas { flex: 1; min-height: 0; width: 100%; display: block; touch-action: none; }
  .panel { padding: 8px 8px calc(8px + env(safe-area-inset-bottom)); background: #fff9e3; border-top: 2px solid #937047; display: grid; gap: 6px; }
  .row { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  button { font: 600 14px system-ui; padding: 6px 10px; border-radius: 10px; border: 2px solid #937047; background: #fff; color: #4a3a2c; }
  button.on { background: #ffd84d; }
  button:disabled { opacity: 0.5; }
  input { width: 3.2em; font: 16px system-ui; }
  label { font: 600 14px system-ui; color: #4a3a2c; }
</style>
