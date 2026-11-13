<script lang="ts">
  // A bot's facts (docs/design.md "Bots"), one layout for both tabs: label left, value right (a link a full 44px target),
  // and the rest folded under くわしく (`more`), mounted only while open. `attr`: the page's data-* prefix
  // (data-its-fact="last", data-its-more).
  interface Fact { id: string; label: string; value: string; href?: string; more?: boolean }
  let { facts, more, attr }: { facts: readonly Fact[]; more: string; attr: string } = $props();

  let open = $state(false);
  const data = (k: string, v: string = '') => ({ [`data-${attr}-${k}`]: v });
</script>

{#snippet rows(list: readonly Fact[])}
  <dl class="facts">
    {#each list as f (f.id)}
      <div {...data('fact', f.id)}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>
    {/each}
  </dl>
{/snippet}

{@render rows(facts.filter((f) => !f.more))}
{#if facts.some((f) => f.more)}
  <details class="more" bind:open {...data('more')}>
    <summary><span>{more}</span><span class="chev" aria-hidden="true"></span></summary>
    {#if open}{@render rows(facts.filter((f) => f.more))}{/if}
  </details>
{/if}

<style>
  .facts { display: grid; gap: 8px; margin: 0; }
  .facts div { display: flex; justify-content: space-between; gap: 12px; font-size: var(--fs-body); }
  .facts dt { flex: none; color: var(--text-soft); font-weight: 700; }
  .facts dd { margin: 0; min-width: 0; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  /* the run's link: a full 44px target, without pushing its row apart */
  .facts a { color: var(--sky-text); display: inline-flex; align-items: center; min-height: var(--hit); margin: -10px 0; }
  .more > summary { list-style: none; display: flex; align-items: center; justify-content: space-between; min-height: var(--hit); margin-top: 4px; font-weight: 700; color: var(--text-soft); cursor: pointer; }
  .more > summary::-webkit-details-marker { display: none; }
  .more[open] > summary { margin-bottom: 4px; }
  /* (the chevron: theme.css, the bots' sheet) */
</style>
