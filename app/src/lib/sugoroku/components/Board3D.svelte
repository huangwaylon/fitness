<script lang="ts">
  // 英語すごろく's 3D board on its own screen (docs/sugoroku.md "The 3D board"): the engine (components/sugoroku3d, its
  // own chunk with three) on a canvas filling the screen's top, the players as their own characters (store/look.ts
  // lookOf, their villager pref). It follows the game: a stone of `shown` reached → a hop to it; whose `turn` → the
  // camera to them; `roll` (a new key) → the die tumbling onto its face; `cheer` (a new key) → their joy. No WebGL
  // (refused twice): `fallback` (the 2D board) in its place.
  import { onMount, untrack, type Snippet } from 'svelte';
  import type { Player } from '../game.ts';
  import type { Board3D, Celebration } from '#lib/components/sugoroku3d/engine.ts';
  import { madeGL } from '#lib/components/rooms/madeGL.ts';
  import { lookOf } from '#lib/store/look.ts';
  import { week } from '#lib/store/week.svelte.ts';

  interface Props {
    players: readonly Player[];
    shown: readonly number[];
    turn: number;
    roll: { n: number; key: number } | null;
    cheer: { k: number; kind: Celebration; key: number } | null;
    fallback: Snippet;
  }
  let { players, shown, turn, roll, cheer, fallback }: Props = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let board: Board3D | null = $state.raw(null);
  let failed = $state(false);
  let alive = true;
  const villagerOf = (w: Player['who']) => (w === 'G' ? week.view?.guest?.villager : week.view?.people[w].villager) ?? null;

  onMount(() => {
    const el = canvas;
    if (!el) return;
    import('#lib/components/sugoroku3d/engine.ts')
      .then((m) => madeGL(() => m.createBoard3D(el), () => alive))
      .then((b) => {
        if (!alive) return b.dispose();
        board = b;
        b.setPlayers(untrack(() => players.map((p) => ({ who: p.who, look: lookOf(p.who), villager: villagerOf(p.who) }))));
        untrack(() => shown.forEach((s, k) => b.place(k, s)));
        b.focus(untrack(() => turn));
      })
      .catch(() => (failed = true));
    const onResize = () => board?.resize();
    addEventListener('resize', onResize);
    return () => {
      alive = false;
      removeEventListener('resize', onResize);
      board?.dispose();
      board = null;
    };
  });

  // a stone reached: a hop to it (the sheet walks `shown` a stone at a time)
  let last: number[] = [];
  $effect(() => {
    const b = board, now = [...shown];
    if (!b) return;
    untrack(() => {
      now.forEach((s, k) => {
        if (last[k] === undefined || last[k] === s) return;
        void b.walk(k, [s]);
      });
      last = now;
    });
  });
  $effect(() => void board?.focus(turn));
  let rollKey = 0;
  $effect(() => {
    const r = roll, b = board;
    if (b && r && r.key !== rollKey) (rollKey = r.key), void b.roll(r.n);
  });
  let cheerKey = 0;
  $effect(() => {
    const c = cheer, b = board;
    if (b && c && c.key !== cheerKey) (cheerKey = c.key), b.celebrate(c.k, c.kind);
  });
</script>

{#if failed}
  {@render fallback()}
{:else}
  <div class="b3" data-sg-board3d><canvas bind:this={canvas}></canvas></div>
{/if}

<style>
  .b3 { position: relative; flex: 1; min-height: 0; border-radius: 22px; overflow: hidden; box-shadow: 0 3px 0 var(--c-edge); }
  canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; }
</style>
