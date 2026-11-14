<script lang="ts">
  // The rooms' screen (the tent's and the homes', the museum's, the shop's): the room's canvas filling it, the top row
  // (‹ back to the island; `wide`: the row the screen's width, `end` at its right, as the shop's かいがら), the camera's
  // reset (NH's view again, once turned), the two-finger hint (PanHint), the room's own layers (`children`; `under`: just
  // over the canvas, under everything, as the museum's doorway dip) and the failure's line. The room keeps its engine,
  // its finger and its foot; it is told of the canvas's size (`onresize`).
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import NavButton from '../ui/NavButton.svelte';
  import PanHint from './PanHint.svelte';
  import RecentreIcon from './RecentreIcon.svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props extends HTMLAttributes<HTMLElement> {
    room: 'tent' | 'museum' | 'shop';
    /** The heading (read out only), the canvas's name and its data attribute (the e2e's handle), the failure's line. */
    title: string;
    label: string;
    mark: string;
    failText: string;
    failed: boolean;
    /** The finger on the canvas, and the camera's wheel and pinch guard (rooms/gesture.ts roomCamera). */
    finger: Record<'down' | 'move' | 'up' | 'cancel', (e: PointerEvent) => void>;
    camera: { wheel: (e: WheelEvent) => void; attach: (el: HTMLElement) => void };
    /** ‹'s words, and whether it's shown (not in もようがえ). */
    back: string;
    backShown?: boolean;
    onback: () => void;
    wide?: boolean;
    end?: Snippet;
    /** The reset shown (the camera turned), and PanHint's `on` and `untilPan`. */
    reset: boolean;
    onreset: () => void;
    hint: boolean;
    untilPan?: boolean;
    onresize: () => void;
    under?: Snippet;
    children: Snippet;
    canvas?: HTMLCanvasElement;
    top?: HTMLElement;
    el?: HTMLElement;
  }
  let { room, title, label, mark, failText, failed, finger, camera, back, backShown = true, onback, wide = false, end, reset, onreset, hint, untilPan = false,
    onresize, under, children, canvas = $bindable(), top = $bindable(), el = $bindable(), ...rest }: Props = $props();

  $effect(() => {
    if (!canvas) return;
    const ro = new ResizeObserver(() => onresize());
    ro.observe(canvas);
    return () => ro.disconnect();
  });
</script>

<main class="room-shell" bind:this={el} data-exact-taps {...rest}>
  <h1 class="sr-only">{title}</h1>
  <canvas bind:this={canvas} class="room" {...{ [mark]: '' }} onpointerdown={finger.down} onpointermove={finger.move} onpointerup={finger.up}
    onpointercancel={finger.cancel} onwheel={camera.wheel} {@attach camera.attach} aria-label={label}></canvas>
  {@render under?.()}
  <div class="top obj-cream" class:wide bind:this={top}>
    {#if backShown}<NavButton kind="back" text={back} onclick={onback} sfx="self" />{/if}
    {@render end?.()}
  </div>
  {#if reset}
    <button type="button" class="reset" class:low={wide} {...{ [`data-${room}-reset`]: '' }} data-sfx="tick" aria-label={t('tent.resetView')} onclick={onreset}>
      <RecentreIcon />
    </button>
  {/if}
  <PanHint {room} on={hint} {untilPan} />
  {@render children()}
  {#if failed}<p class="fail" role="alert">{failText}</p>{/if}
</main>

<style>
  .room-shell { position: relative; max-width: var(--col); margin: 0 auto; height: var(--vh-fill); overflow: hidden; background: #2a1f17; touch-action: none; }
  .room { position: absolute; inset: 0; width: 100%; height: 100%; display: block; touch-action: none; -webkit-tap-highlight-color: transparent; }
  .top { position: absolute; left: calc(var(--side) + var(--safe-left)); top: calc(var(--ui-top) + 8px); z-index: 2; min-height: var(--hit); }
  .top.wide {
    z-index: 3; right: calc(var(--side) + var(--safe-right)); min-height: 0;
    display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; pointer-events: none;
  }
  .top.wide > :global(*) { pointer-events: auto; }
  .reset {
    position: absolute; right: calc(var(--side) + var(--safe-right)); top: calc(var(--ui-top) + 8px); z-index: 2;
    width: 52px; height: 52px; border-radius: 50%; border: 0; display: grid; place-items: center; cursor: pointer;
    color: var(--c-ink); background: var(--c-card); box-shadow: var(--sh-obj); -webkit-tap-highlight-color: transparent;
    animation: pop .22s var(--ease-bounce) both;
  }
  /* (under a wide top row) */
  .reset.low { top: calc(var(--ui-top) + 64px); }
  .reset:active { transform: translateY(2px); box-shadow: var(--sh-obj-press); }
  .reset:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  @keyframes pop { from { scale: .6; opacity: 0; } }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
</style>
