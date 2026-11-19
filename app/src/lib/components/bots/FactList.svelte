<script lang="ts" module>
  import type { Snippet } from 'svelte';
  /** A page's row at the bottom of くわしく: its id (the data-* key), heading, how many it lists, and body. */
  export interface MoreRow { id: string; label: string; n: number; body: Snippet }
</script>

<script lang="ts">
  // A bot's くわしく (docs/bots.md), the page's last row, folded: the secondary facts in two columns, a label
  // over its value (a link a full 44px target), the bot's mode, version and workflow among them (no foot); then the
  // page's `more` rows under them, each its heading over its body (ジム's アプリで変更, 保養所's 最近の動き, メニュー's
  // 前回の変更), each named with its count under くわしく while folded (最近の動き 5件). Mounted only while open. `attr`: the page's data-* prefix (data-its-fact="uptime", data-its-more, a
  // row's data-its-recent).
  import { t, formatNum } from '#lib/i18n/index.ts';
  import type { Fact } from '#lib/bots/types.ts';

  let { facts, attr, more = [] }: { facts: readonly Fact[]; attr: string; more?: readonly MoreRow[] } = $props();

  let open = $state(false);
  const data = (k: string, v: string = '') => ({ [`data-${attr}-${k}`]: v });
</script>

{#if facts.length || more.length}
  <details class="card more" bind:open {...data('more')}>
    <summary class="prow static"><span class="prl">{t('bots.more')}{#if more.length}<small {...data('more-sum')}>{more.map((m) => t('bots.moreN', { label: m.label, n: formatNum(m.n) })).join(' · ')}</small>{/if}</span><span class="chev" aria-hidden="true"></span></summary>
    {#if open}
      <dl class="facts">
        {#each facts as f (f.id)}
          <div {...data('fact', f.id)}><dt>{f.label}</dt><dd>{#if f.href}<a href={f.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{f.value}</a>{:else}{f.value}{/if}</dd></div>
        {/each}
      </dl>
      {#each more as m (m.id)}
        <section class="row" aria-labelledby="{attr}-more-{m.id}" {...data(m.id)}>
          <h3 id="{attr}-more-{m.id}" class="rowl">{m.label}</h3>
          {@render m.body()}
        </section>
      {/each}
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
  /* a page's row under the facts: its heading over its body, a dashed rule above */
  .row { display: grid; gap: 6px; margin: 0 14px; padding: 10px 0 12px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); }
  .rowl { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  /* (the chevron: theme.css, the bots' sheet) */
</style>
