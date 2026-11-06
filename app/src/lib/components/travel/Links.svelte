<script lang="ts">
  // A guide's outside links (Maps, a trail map, an operator): small hairline buttons that open in a new tab (Safari's
  // own, the app stays as it was). A private one (`{p:key}`) is locked, 🔒 by its label, until the trip note is in
  // (aria-disabled: a tap only boops). `attr`: a data attribute on each (a camp's `camp-maps`).
  import type { Link } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../quiet/Icon.svelte';
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
        <span>{label}</span><Icon name="external-link" size={14} />
      </a>
    {:else}
      <span class="lk off" role="link" aria-disabled="true" data-sfx="open" data-link-locked {...data} aria-label="{label} ({t('travel.lockedLink')})"><Icon name="lock" size={14} /><span>{label}</span></span>
    {/if}
  {/each}
</div>

<style>
  .links { display: flex; flex-wrap: wrap; gap: 8px; }
  .lk {
    position: relative; display: inline-flex; align-items: center; gap: 6px; height: 32px; margin: 6px 0; padding: 0 12px; box-sizing: border-box;
    border: 1px solid var(--q-hairline); border-radius: var(--q-r-chip); background: var(--q-surface); color: var(--q-accent-ink); text-decoration: none;
    font: var(--q-w-b) var(--q-fs-s)/1.2 var(--q-font); -webkit-tap-highlight-color: transparent;
  }
  .lk::after { content: ''; position: absolute; inset: -6px -2px; }
  .lk:active { opacity: .6; }
  .off { color: var(--q-muted); background: var(--q-sunken); }
  .off:active { opacity: 1; }
</style>
