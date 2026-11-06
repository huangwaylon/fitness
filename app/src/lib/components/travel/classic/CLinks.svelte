<script lang="ts">
  // A classic card's links out (the site's a.outlink: the first a filled pill, the rest its plain .alt; a private
  // address not in yet a dimmed pill, no link).
  import type { L } from '#lib/travel/types.ts';
  import CText from './CText.svelte';
  import CIcon from './CIcon.svelte';
  import { hrefOf } from '../text.ts';

  let { links, note, alt = false }: { links: readonly { label: L; href: string }[]; note: Record<string, string> | null; alt?: boolean } = $props();
</script>

{#each links as k, i (i)}
  {@const href = hrefOf(k.href, note)}
  {#if href}
    <a class="outlink" class:alt={alt || i > 0} {href} target="_blank" rel="noopener" data-sfx="tick" data-outlink><CText l={k.label} {note} /> <CIcon name="arrow-up-right" /></a>
  {:else}
    <span class="outlink off" class:alt={alt || i > 0}><CText l={k.label} {note} /> <CIcon name="arrow-up-right" /></span>
  {/if}
{/each}
