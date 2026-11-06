<script lang="ts">
  // A guide's outside links (Maps, a trail map, an operator): chips that open in a new tab (Safari's own, the app
  // stays as it was). A private one (`{p:key}`) is locked, 🔒 by its label, until the trip note is in (aria-disabled:
  // a tap only boops). `attr`: a data attribute on each (a camp's `camp-maps`).
  import type { Link } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { hrefOf, pick } from './text.ts';

  let { links, note, attr }: { links: readonly Link[]; note: Record<string, string> | null; attr?: string } = $props();
  const data = $derived(attr ? { [`data-${attr}`]: '' } : {});
</script>

<div class="links">
  {#each links as l, i (i)}
    {@const href = hrefOf(l.href, note)}
    {@const label = pick(l.label, i18n.locale)}
    {#if href}
      <a class="lk" {href} target="_blank" rel="noopener noreferrer" data-sfx="open" data-link {...data} aria-label="{label} ({t('travel.opens')})">
        <span>{label}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
      </a>
    {:else}
      <span class="lk off" role="link" aria-disabled="true" data-sfx="open" data-link-locked {...data} aria-label="{label} ({t('travel.lockedLink')})"><span aria-hidden="true">🔒</span><span>{label}</span></span>
    {/if}
  {/each}
</div>

<style>
  .links { display: flex; flex-wrap: wrap; gap: 8px; }
  .lk {
    display: inline-flex; align-items: center; gap: 6px; min-height: var(--hit); padding: 0 14px; border-radius: var(--r-pill); box-sizing: border-box;
    background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); text-decoration: none; margin-bottom: var(--lip-h);
    font: 700 var(--fs-s)/1.2 var(--font-ui); -webkit-tap-highlight-color: transparent;
  }
  .lk:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .lk svg { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .off { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; }
  .off:active { transform: none; box-shadow: none; }
</style>
