<script lang="ts">
  // Speech bubble (style guide v3 §4.1, §A): wobbly cream box, tilted name tag, letter-by-letter
  // reveal (tap to finish), amber ▼ when another page follows (tap = next). しずえ stands on the
  // left (official art by pose, fan-art fallback), tail pointing at her.
  // Reduced motion: text appears at once. The real text lives in an aria-live node.
  import { t } from '#lib/i18n/index.ts';
  import Juniper from './Juniper.svelte';
  import { theme } from '#lib/client/theme.svelte.ts';
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
    /** Host height in px (96 on 島, 72 elsewhere). */
    size?: number;
    /** Called once the last page has finished typing. */
    onfinish?: () => void;
  }
  let { text, name, tag = 'var(--tag-juniper)', host = 'wave', size = 72, onfinish }: Props = $props();
  /** Dec–Feb: the winter outfit replaces the calm pose. */
  const pose = $derived<HostPose | false>(host === 'stand' && theme.season === 'winter' ? 'winter' : host);

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

<div class="talk">
  {#if pose}
    <span class="spk" style:--h="{size}px">
      <Juniper {pose} {size} eager />
    </span>
  {/if}
  <button type="button" class="bubble" class:tail={!!pose} onclick={tap} aria-label={more ? t('common.next') : undefined}>
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
</div>

<style>
  .talk { display: flex; align-items: flex-end; gap: 6px; }
  .bubble {
    appearance: none; border: 0; font: inherit; cursor: pointer; text-align: left;
    position: relative; flex: 1; min-width: 0; min-height: 64px; margin: 14px 0 6px;
    background: var(--bubble); color: var(--c-ink-talk); border-radius: var(--r-bubble);
    padding: 18px 20px 16px; box-shadow: 0 4px 0 var(--c-paper-2), var(--sh-soft);
    font-size: var(--fs-talk); font-weight: var(--fw-bold); line-height: var(--lh-talk);
    text-wrap: pretty; word-break: auto-phrase;
    transform-origin: 0 100%; animation: open var(--dur-pop) var(--ease-bounce) both;
  }
  .bubble:focus-visible { outline-offset: 4px; border-radius: var(--r-bubble); }
  :global(:root[data-theme="night"]) .bubble { box-shadow: 0 4px 0 #CFC4AA, var(--sh-soft); }
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
    content: ''; position: absolute; left: -9px; bottom: 18px; width: 22px; height: 18px; background: var(--bubble);
    clip-path: polygon(100% 0, 0 55%, 100% 100%); border-radius: 4px;
  }
  .next {
    position: absolute; left: 50%; bottom: -6px; margin-left: -7px; width: 14px; height: 10px; background: var(--c-amber);
    clip-path: polygon(0 0, 100% 0, 50% 100%); border-radius: 3px; animation: if-nudge 700ms var(--ease-idle) infinite;
  }
  /* しずえ: feet on the bubble's baseline (Juniper floats gently by itself). */
  .spk { flex: none; display: grid; justify-items: center; min-height: var(--h); align-items: end; margin-bottom: 4px; }
  :global(:root[data-theme="night"]) .spk :global(img) { filter: brightness(.9); }
  @media (prefers-reduced-motion: reduce) {
    .bubble, .who, .next { animation: none; }
  }
</style>
