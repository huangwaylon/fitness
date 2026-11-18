<script lang="ts">
  // A line with its key words underlined in the leaf: a quote's *starred* words (`text`, phrases.ts keyed), or parts
  // already marked (`parts`: a phrase's words that are its line's, phrases.ts markedIn). The one markup for them all:
  // the question's stem, the reveal's line, まとめ's rows, この動画のセリフと解説 and the phrase cards.
  import { keyed, type Parts } from '../phrases.ts';

  let { text = '', parts }: { text?: string; parts?: Parts } = $props();
  const all = $derived(parts ?? keyed(text));
</script>

{#each all as p, i (i)}{#if p.key}<u>{p.t}</u>{:else}{p.t}{/if}{/each}

<style>
  /* (upright and bold in an italic line too) */
  u { font-style: normal; font-weight: 700; text-decoration: underline 2px var(--c-leaf); text-underline-offset: 3px; text-decoration-skip-ink: none; }
</style>
