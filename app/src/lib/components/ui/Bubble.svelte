<script lang="ts">
  // NH dialogue box: wobbly cream box (a game object: cream at every time of day), tilted yuzu nameplate that pops in after the box,
  // letter-by-letter reveal at 33 ms/char (tap to finish). The box holds --talk-lines lines (2; 1 on compact screens)
  // and never grows. しずえ stands on the left with her feet on the bubble's baseline (official art by pose; the season
  // picks her outfit), the tail pointing at her. Reduced motion: text appears at once.
  // The real text lives in an aria-live node. The typing is silent (the villagers don't speak).
  import { t } from '#lib/i18n/index.ts';
  import Host from '../characters/Host.svelte';
  import { hostIsNook } from '../characters/hostWho.ts';
  import { hostTap } from '../motion/director.svelte.ts';
  import { reducedMotion } from '#lib/time/clock.ts';
  import type { HostPose } from '#lib/art.ts';

  interface Props {
    text: string;
    /** Name on the tag; defaults to the host (しずえ, or たぬきち). */
    name?: string;
    /** しずえ's pose ('wave' cheer, 'stand' calm, 'bow' thanks/sorry), or false for no host (no tail). */
    host?: Exclude<HostPose, 'icon' | 'winter'> | false;
    /** Host height: px or a CSS length (default 72). */
    size?: number | string;
  }
  let { text, name, host = 'wave', size = 72 }: Props = $props();
  const h = $derived(typeof size === 'number' ? `${size}px` : size);
  /** しずえ, or たぬきち when a player is しずえ (hostWho.ts). */
  const hostName = $derived(t(hostIsNook() ? 'host.nook' : 'host.name'));

  let typing = $state(true);

  const TYPE_MS = 33;
  const PAUSE_MS = 180;
  /** Live: turning reduced motion on mid-line finishes the line at once. */
  const reduced = $derived(reducedMotion());

  /** Glyphs with their reveal delay (ms). */
  const glyphs = $derived.by(() => {
    let at = 0;
    return Array.from(text).map((ch) => {
      const g = { ch, at };
      at += TYPE_MS;
      if ('。！？!?'.includes(ch)) at += PAUSE_MS;
      else if ('、,…'.includes(ch)) at += PAUSE_MS / 2;
      return g;
    });
  });
  const total = $derived((glyphs.at(-1)?.at ?? 0) + 140);

  // Restart typing whenever the line changes.
  $effect(() => {
    if (reduced || !text) {
      typing = false;
      return;
    }
    typing = true;
    const timer = setTimeout(() => (typing = false), total);
    return () => clearTimeout(timer);
  });

  function tap() {
    if (typing) typing = false;
    else hostTap();
  }
</script>

<div class="talk">
  {#if host}
    <button type="button" class="spk" style:--h={h} aria-label={hostName} data-sfx="self" onclick={tap}>
      <Host pose={host} size={h} talking={typing} eager />
    </button>
  {/if}
  <div class="bubble" class:tail={!!host}>
    <span class="who">{name ?? hostName}</span>
    <button type="button" class="tap" data-sfx="self" onclick={tap}>
      <span class="sr-only" aria-live="polite">{text}</span>
      <span class="txt" aria-hidden="true">
        <span class="live">
          {#if typing}
            {#key text}
              {#each glyphs as g, i (i)}<span class="g" style:animation-delay="{g.at}ms">{g.ch}</span>{/each}
            {/key}
          {:else}
            {text}
          {/if}
        </span>
        <span class="ghost">{text}</span>
      </span>
    </button>
  </div>
</div>

<style>
  .talk { display: flex; align-items: flex-end; gap: 4px; min-width: 0; }
  .bubble {
    position: relative; flex: 1; min-width: 0; margin: 14px 0 4px;
    background: var(--c-cream); color: var(--c-ink); border-radius: 24px 30px 26px 28px / 28px 24px 30px 26px;
    padding: 10px 18px; box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    font-size: var(--fs-talk); font-weight: 700; line-height: 1.5;
    text-wrap: pretty;
    /* Fixed box: --talk-lines lines of text (2; 1 compact), so the layout never jumps between lines. */
    min-height: calc(var(--talk-lines) * var(--fs-talk) * 1.5 + 20px);
    display: flex; flex-direction: column; justify-content: center;
    transform-origin: 0 100%; animation: open var(--dur-pop) var(--ease-bounce) both;
  }
  .tap {
    appearance: none; border: 0; padding: 0; margin: 0; background: none; font: inherit; color: inherit; cursor: pointer;
    text-align: left; display: flex; align-items: center; min-height: 44px;
    /* the whole box is the tap target */
    margin: -10px -18px; padding: 10px 18px; width: calc(100% + 36px); border-radius: inherit;
  }
  .tap:focus-visible { outline-offset: 4px; }
  .txt { display: grid; flex: 1; min-width: 0; }
  .live, .ghost {
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--talk-lines); line-clamp: var(--talk-lines); overflow: hidden;
  }
  @keyframes open { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  .who {
    position: absolute; top: -15px; left: 18px; padding: 5px 12px; border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--c-ink); background: var(--c-yuzu);
    transform: rotate(-4deg); animation: tag var(--dur-pop) var(--ease-bounce) 120ms both;
  }
  @keyframes tag { from { transform: rotate(-4deg) scale(0); } to { transform: rotate(-4deg) scale(1); } }
  .live, .ghost { grid-area: 1 / 1; }
  .ghost { visibility: hidden; }
  .g { opacity: 0; animation: if-letter 120ms var(--ease-soft) forwards; white-space: pre-wrap; }
  .tail::after {
    content: ''; position: absolute; left: -9px; bottom: 16px; width: 22px; height: 18px; background: var(--c-cream);
    clip-path: polygon(100% 0, 0 55%, 100% 100%); border-radius: 4px;
  }
  /* しずえ: feet on the box's baseline (Host floats gently by itself). */
  .spk {
    flex: none; display: grid; justify-items: center; align-items: end; height: var(--h); min-width: 56px; margin-bottom: 4px;
    appearance: none; border: 0; padding: 0; background: none; cursor: pointer; border-radius: var(--r-btn);
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble, .who { animation: none; }
  }
</style>
