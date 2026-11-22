<script lang="ts">
  // The rooms' screen (the tent's and the homes', the museum's, the shop's): the room's canvas filling it, the top row
  // (‹ back to the island; `wide`: the row the screen's width, `end` at its right, as the shop's かいがら), the camera's
  // reset (NH's view again, once turned), the two-finger hint (PanHint), the room's own layers (`children`; `under`: just
  // over the canvas, under everything, as the museum's doorway dip) and the failure's line. The room keeps its engine,
  // its finger and its foot; it is told of the canvas's size (`onresize`). Bare (shot.svelte.ts: ShotTools' button), all
  // of it but the canvas, the speech balloons and `under` hides (and the toasts: the layout's), the fingers still turning
  // and zooming the camera; a tap anywhere (or Esc) brings it back, a tap that's nothing else; leaving, it's back.
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import NavButton from '../ui/NavButton.svelte';
  import PanHint from './PanHint.svelte';
  import RecentreIcon from './RecentreIcon.svelte';
  import { isTap } from './gesture.ts';
  import { shot } from './shot.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/rooms.ts'; // its strings, loaded with it

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

  // bare: one finger's tap (no other down meanwhile) brings the chrome back, the room told it was cancelled (no walk)
  const ptrs = new Set<number>();
  let tapOf: { id: number; x: number; y: number; t: number } | null = null;
  const fingerOf = {
    down(e: PointerEvent) {
      if (e.isPrimary) ptrs.clear();
      ptrs.add(e.pointerId);
      tapOf = shot.bare && ptrs.size === 1 ? { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp } : null;
      finger.down(e);
    },
    move: (e: PointerEvent) => finger.move(e),
    up(e: PointerEvent) {
      ptrs.delete(e.pointerId);
      const tp = tapOf;
      tapOf = null;
      if (tp?.id === e.pointerId && shot.bare && isTap(e.clientX - tp.x, e.clientY - tp.y, e.timeStamp - tp.t)) {
        shot.bare = false;
        return finger.cancel(e);
      }
      finger.up(e);
    },
    cancel(e: PointerEvent) {
      ptrs.delete(e.pointerId);
      tapOf = null;
      finger.cancel(e);
    }
  };
  /** 「タップで もどるよ」 for a moment once bare. */
  let backHint = $state(false);
  $effect(() => {
    if (!shot.bare) return void (backHint = false);
    backHint = true;
    const tm = setTimeout(() => (backHint = false), 1600);
    return () => clearTimeout(tm);
  });
  $effect(() => () => void (shot.bare = false));

  $effect(() => {
    if (!canvas) return;
    const ro = new ResizeObserver(() => onresize());
    ro.observe(canvas);
    return () => ro.disconnect();
  });
</script>

<svelte:window onkeydown={(e) => void (shot.bare && e.key === 'Escape' && (shot.bare = false))} />
<main class="room-shell" class:bare={shot.bare} bind:this={el} data-exact-taps data-bare={shot.bare || undefined} {...rest}>
  <h1 class="sr-only">{title}</h1>
  <canvas bind:this={canvas} class="room" {...{ [mark]: '' }} onpointerdown={fingerOf.down} onpointermove={fingerOf.move} onpointerup={fingerOf.up}
    onpointercancel={fingerOf.cancel} onwheel={camera.wheel} {@attach camera.attach} aria-label={label}></canvas>
  {@render under?.()}
  {#if backHint}<div class="bare-hint" role="status" data-bare-hint>{t('room.bareBack')}</div>{/if}
  <div class="chrome">
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
  </div>
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
  @keyframes pop { from { scale: .6; opacity: 0; } }
  .chrome { display: contents; }
  /* bare: the chrome hidden but kept in place (the room's insets unchanged: no camera move), the balloons left */
  .bare .chrome > :global(:not(.says)) { visibility: hidden; }
  .bare-hint {
    position: absolute; left: 50%; bottom: calc(var(--safe-bottom, 0px) + 28px); z-index: 4; transform: translateX(-50%); margin: 0; padding: 6px 14px;
    border-radius: 999px; background: color-mix(in srgb, var(--c-cream, #FFF9E3) 88%, transparent); color: var(--c-ink); font-weight: 700;
    font-size: var(--fs-s, 13px); white-space: nowrap; pointer-events: none; animation: hint 1.6s ease both;
  }
  @keyframes hint { 0% { opacity: 0; } 12%, 70% { opacity: 1; } 100% { opacity: 0; } }
  .fail { position: absolute; left: 16px; right: 16px; top: 40%; text-align: center; color: #F5E4BC; font-weight: 700; }
</style>
