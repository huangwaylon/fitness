<script lang="ts">
  // A bot's くわしく (docs/design.md "Bots"), the page's last row, folded: the secondary facts in two columns, a label
  // over its value (a link a full 44px target), the bot's mode, version and workflow among them (no foot). Mounted only
  // while open. `attr`: the page's data-* prefix (data-its-fact="uptime", data-its-more).
  import { t } from '#lib/i18n/index.ts';

  interface Fact { id: string; label: string; value: string; href?: string }
  let { facts, attr }: { facts: readonly Fact[]; attr: string } = $props();

  let open = $state(false);
  const data = (k: string, v: string = '') => ({ [`data-${attr}-${k}`]: v });
</script>

{#if facts.length}
  <details class="card more" bind:open {...data('more')}>
    <summary class="prow static"><span class="prl">{t('bots.more')}</span><span class="chev" aria-hidden="true"></span></summary>
    {#if open}
      <dl class="facts">
        {#each facts as f (f.id)}
          <div {...data('fact', f.id)}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>
        {/each}
      </dl>
    {/if}
  </details>
{/if}

<style>
  .more { padding: 0; }
  .more > summary { list-style: none; box-shadow: none; background: none; cursor: pointer; }
  .more > summary::-webkit-details-marker { display: none; }
  .facts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 12px; margin: 0; padding: 0 14px 12px; }
  .facts div { min-width: 0; display: grid; gap: 1px; align-content: start; }
  .facts dt { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .facts dd { margin: 0; font-size: var(--fs-body); font-weight: 700; line-height: 1.3; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
  /* a link: a full 44px target, without pushing its cell apart */
  .facts a { color: var(--sky-text); display: inline-flex; align-items: center; min-height: var(--hit); margin: -12px 0; }
  /* (the chevron: theme.css, the bots' sheet) */
</style>
