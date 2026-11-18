<script lang="ts">
  // English Study's progress block (docs/english.md "Progress"), one component so it can change alone: this week's
  // three dots (k/3日, then 「今週の3日、達成」), Monday's 「新しい週です」, the run of 3-day weeks or their count, the
  // clips finished, this week's minutes (information only), the partner's line and 「今週はふたりとも達成」. Never a 0日,
  // a break or a miss.
  import type { WeekView } from '../progress.ts';
  import { WEEK_TARGET } from '../progress.ts';
  import { s } from '../i18n.ts';
  import Icon from '#lib/components/ui/Icon.svelte';

  let { view }: { view: WeekView } = $props();
  const dots = (k: number) => Array.from({ length: WEEK_TARGET }, (_, i) => i < k);
  const met = $derived(view.days >= WEEK_TARGET);
</script>

<section class="card pad wk" data-en-week={view.days} aria-label={s('week')}>
  <p class="row">
    <b>{s('week')}</b>
    <span class="dots" aria-hidden="true">{#each dots(view.days) as on, i (i)}<i class:on></i>{/each}</span>
    {#if view.days > WEEK_TARGET}<span class="n" data-en-week-n>{s('weekMore', { k: view.days })}</span>
    {:else if view.days > 0 && !met}<span class="n" data-en-week-n>{s('weekDays', { k: view.days })}</span>{/if}
  </p>
  {#if met}<p class="line met" data-en-met>{s('weekMet')}</p>
  {:else if view.fresh}<p class="line" data-en-fresh>{s('weekNew')}</p>{/if}
  {#if view.run >= 2}<p class="line" data-en-run>{s('run', { n: view.run })}</p>
  {:else if view.ever > 0}<p class="line" data-en-run>{s('runEver', { n: view.ever })}</p>{/if}
  {#if view.clips > 0}<p class="line" data-en-clips>{s('clips', { n: view.clips })}</p>{/if}
  {#if view.minutes > 0}<p class="soft" data-en-minutes>{s('minutes', { n: view.minutes })}</p>{/if}
  {#if view.partner && (view.partner.today || view.partner.days > 0)}
    <p class="partner" data-en-partner>
      {#if view.partner.today}{s('partnerDone', { name: view.partner.name })}<Icon name="check" size={14} stroke={2.6} />
      {:else}<span>{s('partnerWeek', { name: view.partner.name })}</span><span class="dots s" aria-label={s('weekDays', { k: Math.min(view.partner.days, WEEK_TARGET) })}>{#each dots(view.partner.days) as on, i (i)}<i class:on></i>{/each}</span>{/if}
    </p>
  {/if}
  {#if view.both}<p class="line met" data-en-both>{s('both')}</p>{/if}
</section>

<style>
  .wk { display: grid; gap: 4px; }
  .wk p { margin: 0; }
  .row { display: flex; align-items: center; gap: 10px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .dots { display: inline-flex; gap: 6px; }
  .dots i { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .dots i.on { background: var(--c-leaf); }
  .dots.s i { width: 10px; height: 10px; }
  .n { font: 600 var(--fs-body)/1 var(--font-num); }
  .line { font-size: var(--fs-body); }
  .met { color: var(--c-leaf-text); font-weight: 700; }
  .soft { font-size: var(--fs-s); color: var(--text-soft); }
  .partner { display: flex; align-items: center; gap: 8px; font-size: var(--fs-s); color: var(--text-soft); margin-top: 4px !important; }
</style>
