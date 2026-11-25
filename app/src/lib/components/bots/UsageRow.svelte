<script lang="ts">
  // A Cloudflare free-tier row (JobsPage's section, docs/bots.md "Jobs"; English, as the page): one button the card's
  // width, as JobRow's: the dot (green under 60 %, yuzu from it, coral from 85 %: status.ts usageTone; a sunk disc for
  // a reading from an earlier UTC day), the limit's name, 「325k / 5M · 7%」 at the right, then a bar of the share used.
  // A tap unfolds what the limit is, who used it (a Worker or a Durable Object class, the most first) and when it was
  // read.
  import { scoped } from '#lib/i18n/index.ts';
  import type { UsageRowView } from '#lib/jobs/status.ts';
  import Phrases from '../ui/Phrases.svelte';
  import StatusDot from './StatusDot.svelte';

  let { row, asOf, open, ontoggle }: { row: UsageRowView; asOf: string | null; open: boolean; ontoggle: () => void } = $props();

  // (JobsPage pins English)
  const { t } = scoped();
  const label = $derived(t('jobs.cf.label', { name: row.name, pct: row.pct, of: row.of }));
</script>

<li class="job cf" class:open data-jobs-cf={row.k} data-jobs-tone={row.tone}>
  <button type="button" class="head" aria-expanded={open} aria-controls="jobs-d-cf-{row.k}" aria-label={label} data-sfx="tick" onclick={ontoggle}>
    <span class="l1">
      <StatusDot tone={row.tone} size={10} />
      <b class="name">{row.name}</b>
      <span class="age" data-jobs-cf-of>{row.of}<b class="pct {row.tone}" data-jobs-cf-pct>{row.pct}</b></span>
      <span class="chev" aria-hidden="true"></span>
    </span>
    <span class="bar" aria-hidden="true"><i class="fill {row.tone}" style:width="{Math.max(row.share > 0 ? 1.5 : 0, row.share * 100)}%"></i></span>
  </button>
  {#if open}
    <div class="detail" id="jobs-d-cf-{row.k}" data-jobs-detail="cf-{row.k}">
      <p class="about"><Phrases text={t('jobs.cf.about')} /></p>
      <dl class="kv">
        {#each row.by as b (b.name)}<div data-jobs-cf-by={b.name}><dt>{b.name}</dt><dd>{b.n} · {b.pct}</dd></div>{/each}
        {#if asOf}<div data-jobs-cf-read><dt>{t('jobs.cf.read')}</dt><dd>{asOf}</dd></div>{/if}
      </dl>
    </div>
  {/if}
</li>

<style>
  /* JobRow's row, a bar in its strip's place */
  .job + :global(.job), :global(.job) + .job { border-top: 1.5px dashed var(--stitch); }
  .head {
    appearance: none; display: grid; gap: 6px; width: 100%; min-height: var(--hit); margin: 0; padding: 10px 12px;
    border: 0; background: none; color: var(--text); font: inherit; text-align: left; cursor: pointer;
  }
  .head:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; border-radius: var(--r-card); }
  .l1 { display: flex; align-items: center; gap: 8px; min-width: 0; }
  .name { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .age { flex: none; display: inline-flex; align-items: baseline; gap: 8px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .pct { min-width: 3.2ch; text-align: right; color: var(--text); }
  .pct.bad { color: var(--coral-text); }
  .l1 .chev { margin-right: 0; }
  .open .l1 .chev { rotate: 225deg; margin-top: 4px; }

  .bar { display: block; height: 8px; margin: 0 0 2px 18px; border-radius: 4px; background: var(--ctl-off); box-shadow: inset 0 0 0 1px var(--edge); overflow: hidden; }
  .fill { display: block; height: 100%; border-radius: 4px; box-shadow: inset 0 0 0 1px var(--edge); }
  .fill.good { background: var(--c-leaf); }
  .fill.warn { background: var(--c-yuzu); }
  .fill.bad { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .fill.idle { background: color-mix(in srgb, var(--edge) 45%, var(--ctl-off)); }

  .detail { display: grid; gap: 8px; padding: 0 12px 12px 30px; }
  .about { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); text-wrap: pretty; }
  .kv { display: grid; grid-template-columns: max-content minmax(0, 1fr); gap: 4px 12px; margin: 0; }
  .kv div { display: contents; }
  .kv dt { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .kv dd { margin: 0; min-width: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
</style>
