<script lang="ts">
  // Speech bubble (style guide v4 §T.2): wobbly cream box, tilted nameplate that pops in after the box,
  // letter-by-letter reveal at 33 ms/char (tap to finish), amber ▼ only when another page follows
  // (tap = next). The box holds --talk-lines lines (2; 1 on compact screens) and never grows.
  // しずえ stands on the left with her feet on the bubble's baseline (official art by pose; the season
  // picks her outfit), the tail pointing at her. Reduced motion: text appears at once.
  // The real text lives in an aria-live node.
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import Host from './Host.svelte';
  import { hostTap } from './motion/director.svelte.ts';
  import type { HostPose } from '#lib/client/assets.ts';

  interface Props {
    /** One line, or several pages (tap to step through). */
    text: string | string[];
    /** Name on the tag; defaults to しずえ. */
    name?: string;
    /** Tag fill (CSS colour); defaults to しずえ's yuzu. */
    tag?: string;
    /** しずえ's pose ('wave' cheer, 'stand' calm, 'bow' thanks/sorry), or false for no host (no tail). */
    host?: Exclude<HostPose, 'icon' | 'winter'> | false;
    /** Host height: px or a CSS length (default var(--host-h): 84 / 64 compact / 56 tiny). */
    size?: number | string;
    /** Called once the last page has finished typing. */
    onfinish?: () => void;
    /** Extra content inside the bubble, under the text (lets the box grow; use sparingly). */
    actions?: Snippet;
  }
  let { text, name, tag = 'var(--tag-host)', host = 'wave', size = 'var(--host-h)', onfinish, actions }: Props = $props();
  const h = $derived(typeof size === 'number' ? `${size}px` : size);

  const pages = $derived(Array.isArray(text) ? text : [text]);
  let pageIdx = $state(0);
  let typing = $state(true);
  let timer: ReturnType<typeof setTimeout> | null = null;
  const current = $derived(pages[Math.min(pageIdx, pages.length - 1)] ?? '');
  const more = $derived(pageIdx < pages.length - 1);

  const TYPE_MS = 33;
  const PAUSE_MS = 180;
  const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Glyphs with their reveal delay (ms). */
  const glyphs = $derived.by(() => {
    let at = 0;
    return Array.from(current).map((ch) => {
      const g = { ch, at };
      at += TYPE_MS;
      if ('。！？!?'.includes(ch)) at += PAUSE_MS;
      else if ('、,…'.includes(ch)) at += PAUSE_MS / 2;
      return g;
    });
  });
  const total = $derived((glyphs.at(-1)?.at ?? 0) + 140);

  // Restart typing whenever the line (or page) changes.
  $effect(() => {
    void current;
    if (timer) clearTimeout(timer);
    if (reduced || !current) {
      typing = false;
      return;
    }
    typing = true;
    timer = setTimeout(() => {
      typing = false;
      if (!more) onfinish?.();
    }, total);
    return () => timer && clearTimeout(timer);
  });

  // New text from outside → back to page 1.
  let lastText = '';
  $effect(() => {
    const key = pages.join('\u0000');
    if (key !== lastText) {
      lastText = key;
      pageIdx = 0;
    }
  });

  function tap() {
    if (typing) {
      if (timer) clearTimeout(timer);
      typing = false;
      if (!more) onfinish?.();
    } else if (more) {
      pageIdx += 1;
    } else hostTap();
  }
</script>

<div class="talk">
  {#if host}
    <button type="button" class="spk" style:--h={h} aria-label={t('host.name')} onclick={tap}>
      <Host pose={host} size={h} talking={typing} eager />
    </button>
  {/if}
  <div class="bubble" class:tail={!!host} class:grow={!!actions}>
    <span class="who" style:--tag={tag}>{name ?? t('host.name')}</span>
    <button type="button" class="tap" onclick={tap} aria-label={more ? t('common.next') : undefined}>
      <span class="sr-only" aria-live="polite">{current}</span>
      <span class="txt" aria-hidden="true">
        <span class="live">
          {#if typing}
            {#key current}
              {#each glyphs as g, i (i)}<span class="g" style:animation-delay="{g.at}ms">{g.ch}</span>{/each}
            {/key}
          {:else}
            {current}
          {/if}
        </span>
        <span class="ghost">{current}</span>
      </span>
    </button>
    {#if actions}<div class="acts">{@render actions()}</div>{/if}
    {#if more && !typing}<span class="next" aria-hidden="true"></span>{/if}
  </div>
</div>

<style>
  .talk { display: flex; align-items: flex-end; gap: 4px; }
  .bubble {
    position: relative; flex: 1; min-width: 0; margin: 12px 0 4px;
    background: var(--bubble); color: var(--c-ink-talk); border-radius: var(--r-bubble);
    padding: 8px 16px; box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-soft);
    font-size: var(--fs-talk); font-weight: var(--fw-bold); line-height: var(--lh-talk);
    text-wrap: pretty; word-break: auto-phrase;
    /* Fixed box: --talk-lines lines of text (2; 1 compact), so the layout never jumps between lines. */
    min-height: max(var(--bubble-min), calc(var(--talk-lines) * var(--fs-talk) * var(--lh-talk) + 16px));
    display: flex; flex-direction: column; justify-content: center;
    transform-origin: 0 100%; animation: open var(--dur-pop) var(--ease-bounce) both;
  }
  .tap {
    appearance: none; border: 0; padding: 0; margin: 0; background: none; font: inherit; color: inherit; cursor: pointer;
    text-align: left; display: flex; align-items: center; min-height: 44px;
    /* the whole box is the tap target */
    margin: -8px -16px; padding: 8px 16px; width: calc(100% + 32px); border-radius: inherit;
  }
  .tap:focus-visible { outline-offset: 6px; border-radius: 18px; }
  .txt { display: grid; flex: 1; min-width: 0; }
  .bubble:not(.grow) .live, .bubble:not(.grow) .ghost {
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: var(--talk-lines); line-clamp: var(--talk-lines); overflow: hidden;
  }
  .acts { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 10px; }
  :global(:root[data-theme="night"]) .bubble { box-shadow: 0 4px 0 #D9CFB4, var(--sh-soft); }
  @keyframes open { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  .who {
    position: absolute; top: -14px; left: 18px; padding: 5px 12px; border-radius: var(--r-pill);
    font: 700 var(--fs-tag)/1 var(--font-ui); color: var(--c-ink); background: var(--tag);
    box-shadow: 0 2px 0 color-mix(in srgb, var(--tag) 85%, #000 15%);
    transform: rotate(-4deg); animation: tag var(--dur-pop) var(--ease-bounce) 120ms both;
  }
  @keyframes tag { from { transform: rotate(-4deg) scale(0); } to { transform: rotate(-4deg) scale(1); } }
  .live, .ghost { grid-area: 1 / 1; }
  .ghost { visibility: hidden; }
  .g { opacity: 0; animation: if-letter 120ms var(--ease-soft) forwards; white-space: pre-wrap; }
  .tail::after {
    content: ''; position: absolute; left: -9px; bottom: 16px; width: 22px; height: 18px; background: var(--bubble);
    clip-path: polygon(100% 0, 0 55%, 100% 100%); border-radius: 4px;
  }
  .next {
    position: absolute; left: 50%; bottom: -6px; margin-left: -7px; width: 14px; height: 10px; background: var(--c-amber);
    clip-path: polygon(0 0, 100% 0, 50% 100%); border-radius: 3px; animation: if-nudge 700ms var(--ease-idle) infinite;
  }
  /* しずえ: feet on the bubble's baseline (Host floats gently by itself). */
  .spk {
    flex: none; display: grid; justify-items: center; align-items: end; height: var(--h); min-width: 56px; margin-bottom: 4px;
    appearance: none; border: 0; padding: 0; background: none; cursor: pointer; border-radius: 18px;
  }
  @media (prefers-reduced-motion: reduce) {
    .bubble, .who, .next { animation: none; }
  }
</style>
