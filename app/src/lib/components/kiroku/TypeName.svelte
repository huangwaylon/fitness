<script lang="ts">
  // A workout type's label that wraps only at its word joints (fmt.ts typeParts): each piece is one unbreakable run
  // and the line may break between pieces. A label with no known joint keeps the normal line breaking.
  import { typeParts } from './fmt.ts';

  let { type }: { type: string } = $props();
  const p = $derived(typeParts(type));
</script>

{#if p.parts.length < 2}{p.parts.join(' ')}{:else}{#each p.parts as part, i (i)}{#if i}{#if p.spaced}{' '}{:else}<wbr />{/if}{/if}<span class="ph">{part}</span>{/each}{/if}

<style>
  .ph { white-space: nowrap; }
</style>
