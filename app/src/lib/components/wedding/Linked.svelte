<script lang="ts">
  // Text with its http/https URLs as links (lib/wedding/links.ts: the one gate), opening in a new tab with no opener
  // and no referrer; anything else stays the characters typed.
  import { splitLinks } from '#lib/wedding/links.ts';
  let { text }: { text: string } = $props();
  const runs = $derived(splitLinks(text));
</script>

{#each runs as r, i (i)}{#if r.href}<a href={r.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{r.text}</a>{:else}{r.text}{/if}{/each}

<style>
  a { color: var(--q-accent-ink); text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }
</style>
