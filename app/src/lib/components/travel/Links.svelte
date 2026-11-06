<script lang="ts">
  // A guide's outside links (Maps, a trail map, an operator): the kit's small chips that open in a new tab (Safari's
  // own, the app stays as it was). A private one (`{p:key}`) is locked, 🔒 by its label, until the trip note is in
  // (aria-disabled: a tap only boops).
  import type { Link } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Icon from '../ui/Icon.svelte';
  import { hrefOf, pick } from './text.ts';

  let { links, note }: { links: readonly Link[]; note: Record<string, string> | null } = $props();
</script>

<div class="links">
  {#each links as l, i (i)}
    {@const href = hrefOf(l.href, note)}
    {@const label = pick(l.label, i18n.locale)}
    {#if href}
      <a class="chip s lk" {href} target="_blank" rel="noopener noreferrer" data-sfx="open" data-link aria-label="{label} ({t('travel.opens')})">
        <span>{label}</span><Icon name="external-link" size={14} />
      </a>
    {:else}
      <span class="chip s lk off" role="link" aria-disabled="true" data-sfx="open" data-link-locked aria-label="{label} ({t('travel.lockedLink')})"><Icon name="lock" size={14} /><span>{label}</span></span>
    {/if}
  {/each}
</div>

<style>
  .links { display: flex; flex-wrap: wrap; gap: 6px 8px; padding: 4px 0; }
  .lk { color: var(--leaf-text); text-decoration: none; -webkit-tap-highlight-color: transparent; }
  .off { color: var(--text-soft); background: var(--ctl-off); box-shadow: none; }
  .off:active { transform: none; }
</style>
