<script lang="ts">
  // The すがた level's preview slot (customization.md §3.1): the look being edited, full body. A player is NH's human
  // player in 3D (look/preview3d.ts: its own small renderer, made on mount and let go of on unmount, the level's one
  // WebGL context, which also draws the portraits: portraits.svelte.ts), idling and blinking; a drag turns it, a tap
  // hops it, each edit is dressed on in place. Until it's built (or if it can't be) the flat stand-in figure stands
  // there. A villager is its official render (the 3D player kept, hidden, for the portraits). A tap hops either.
  import { onMount, untrack } from 'svelte';
  import { asset } from '$app/paths';
  import type { Who } from '#lib/types.ts';
  import { playerOf, type Look } from '#lib/contract/look.ts';
  import Villager from '../characters/Villager.svelte';
  import PlayerFigure from './PlayerFigure.svelte';
  import { portraitOf, usePainter } from './portraits.svelte.ts';
  import type { Preview3D } from './preview3d.ts';

  let { who, look }: { who: Who; look: Look } = $props();
  let hop = $state(0);
  let canvas: HTMLCanvasElement;
  let p3 = $state<Preview3D | null>(null);
  const player = $derived(playerOf(look, who));

  onMount(() => {
    let gone = false;
    void import('./preview3d.ts')
      .then(({ createPreview }) => createPreview(canvas, untrack(() => player), asset('room/player/' as Parameters<typeof asset>[0]), who === 'B' ? 2 : 1))
      .then((p) => {
        if (gone) return p.dispose();
        p3 = p;
        usePainter((l, px) => p.portrait(l, px));
      })
      .catch(() => {
        /* no 3D here (no WebGL, a part missing): the stand-in stays */
      });
    return () => {
      gone = true;
      usePainter(null);
      p3?.dispose();
      p3 = null;
    };
  });

  // every edit dressed on as it's made (in place: only what changed)
  $effect(() => {
    const l = player;
    if (p3) void p3.dress(l).catch(() => {});
  });

  // the look's portrait drawn a moment after the last edit (once this level closes there's no renderer to draw it: the
  // せってい row has it kept)
  $effect(() => {
    const l = player, on = !!p3 && look.kind === 'player';
    if (!on) return;
    const id = setTimeout(() => untrack(() => portraitOf(l)), 700);
    return () => clearTimeout(id);
  });

  // a drag turns it, a tap (barely moved) hops it
  let from: { x: number; id: number; moved: number } | null = null;
  function down(e: PointerEvent) {
    from = { x: e.clientX, id: e.pointerId, moved: 0 };
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }
  function move(e: PointerEvent) {
    if (!from || e.pointerId !== from.id) return;
    const dx = e.clientX - from.x;
    from.x = e.clientX;
    from.moved += Math.abs(dx);
    if (from.moved > 6) p3?.turn(dx);
  }
  function up(e: PointerEvent) {
    if (!from || e.pointerId !== from.id) return;
    const tap = from.moved <= 6;
    from = null;
    p3?.release();
    if (tap && e.type === 'pointerup') {
      hop++;
      p3?.hop();
    }
  }
  const in3d = $derived(!!p3 && look.kind === 'player');
</script>

<button type="button" class="lpv" data-look-preview={look.kind} data-look-3d={in3d ? 'on' : 'off'} aria-hidden="true" tabindex="-1" data-sfx="none"
  onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}
  onclick={(e) => e.detail === 0 && (hop++, p3?.hop())}>
  <canvas bind:this={canvas} class="gl" class:on={in3d} width="96" height="132"></canvas>
  {#if !in3d}
    {#key hop}
      <span class="fig">
        {#if look.kind === 'villager'}
          {#key look.villager}<Villager person={who} villager={look.villager} size={112} head={false} expression="cheer" eager />{/key}
        {:else}
          <PlayerFigure look={player} />
        {/if}
      </span>
    {/key}
  {/if}
</button>

<style>
  .lpv {
    appearance: none; border: 0; padding: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent;
    width: 96px; height: 132px; flex: none; display: grid; place-items: end center; position: relative;
    touch-action: pan-y; user-select: none; -webkit-user-select: none;
  }
  .gl { position: absolute; inset: 0; width: 100%; height: 100%; visibility: hidden; pointer-events: none; }
  .gl.on { visibility: visible; }
  .fig { width: 88px; height: 128px; display: grid; place-items: end center; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
</style>
