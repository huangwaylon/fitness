<script lang="ts">
  // Speech bubble (style guide §4.1): wobbly cream box, tilted speaker-coloured name tag,
  // letter-by-letter reveal (tap to finish), amber ▼ when another page follows (tap = next).
  // Reduced motion: text appears at once. The real text lives in an aria-live node.
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import Juniper from './Juniper.svelte';
  import type { Expression } from '#lib/villagers/species.ts';

  interface Props {
    /** One line, or several pages (tap to step through). */
    text: string | string[];
    /** Name on the tag; defaults to Juniper. */
    name?: string;
    /** Tag fill (CSS colour); defaults to Juniper's yuzu. */
    tag?: string;
    /** Side the speaker stands on (tail points there). 'none' hides the tail. */
    side?: 'left' | 'right' | 'none';
    /** Show Juniper beside the bubble (default true). Pass `speaker` to draw someone else. */
    juniper?: boolean;
    /** The host's expression (style guide §7.4). */
    expression?: Expression;
    speaker?: Snippet;
    /** Called once the last page has finished typing. */
    onfinish?: () => void;
  }
  let { text, name, tag = 'var(--tag-juniper)', side = 'right', juniper = true, expression = 'happy', speaker, onfinish }: Props = $props();

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
    }
  }
</script>

<div class="talk" class:left={side === 'left'}>
  <button type="button" class="bubble" class:tail={side !== 'none'} onclick={tap} aria-label={more ? t('common.next') : undefined}>
    <span class="who" style:--tag={tag}>{name ?? t('juniper.name')}</span>
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
    {#if more && !typing}<span class="next" aria-hidden="true"></span>{/if}
  </button>
  {#if speaker}
    <span class="spk">{@render speaker()}</span>
  {:else if juniper}
    <span class="spk juni"><Juniper {expression} size={84} /></span>
  {/if}
</div>

<style>
  .talk { display: flex; align-items: flex-end; gap: 8px; }
  .talk.left { flex-direction: row-reverse; }
  .bubble {
    appearance: none; border: 0; font: inherit; cursor: pointer; text-align: left;
    position: relative; flex: 1; min-width: 0; min-height: 64px; margin: 14px 0 10px;
    background: var(--bubble); color: var(--c-ink-talk); border-radius: var(--r-bubble);
    padding: 18px 20px 16px; box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-soft);
    font-size: var(--fs-talk); font-weight: var(--fw-bold); line-height: var(--lh-talk);
    transform-origin: 100% 100%; animation: open var(--dur-pop) var(--ease-bounce) both;
  }
  :global(:root[data-theme="night"]) .bubble { box-shadow: 0 4px 0 #CFC4AA, var(--sh-soft); }
  .left .bubble { transform-origin: 0 100%; }
  @keyframes open { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  .who {
    position: absolute; top: -14px; left: 18px; padding: 5px 12px; border-radius: var(--r-pill);
    font: 700 var(--fs-tag)/1 var(--font-ui); color: var(--c-ink); background: var(--tag);
    box-shadow: 0 2px 0 color-mix(in srgb, var(--tag) 85%, #000 15%);
    transform: rotate(-4deg); animation: tag var(--dur-pop) var(--ease-bounce) 120ms both;
  }
  @keyframes tag { from { transform: rotate(-4deg) scale(0); } to { transform: rotate(-4deg) scale(1); } }
  /* Overlay the animated glyphs on an invisible copy so the box never reflows while typing. */
  .txt { display: grid; }
  .live, .ghost { grid-area: 1 / 1; }
  .ghost { visibility: hidden; }
  .g { opacity: 0; display: inline-block; animation: if-letter 120ms var(--ease-soft) forwards; white-space: pre; }
  .tail::after {
    content: ''; position: absolute; right: -9px; bottom: 18px; width: 22px; height: 18px; background: var(--bubble);
    clip-path: polygon(0 0, 100% 55%, 0 100%); border-radius: 4px;
  }
  .left .tail::after { right: auto; left: -9px; clip-path: polygon(100% 0, 0 55%, 100% 100%); }
  .next {
    position: absolute; left: 50%; bottom: -6px; margin-left: -7px; width: 14px; height: 10px; background: var(--c-amber);
    clip-path: polygon(0 0, 100% 0, 50% 100%); border-radius: 3px; animation: if-nudge 700ms var(--ease-idle) infinite;
  }
  .spk { flex: none; display: block; }
  .juni { width: 72px; display: grid; justify-items: center; margin-bottom: 4px; }
  @media (prefers-reduced-motion: reduce) {
    .bubble, .who, .next { animation: none; }
  }
</style>
