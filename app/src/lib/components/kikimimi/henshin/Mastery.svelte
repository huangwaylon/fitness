<script lang="ts">
  // 音の へんしん's page section (mode/ModeDetail.svelte, its own chunk; docs/kikimimi.md "音の へんしん"): each phenomenon in the
  // order taught, how far I've got with it (a bar, the share right on the first listen, recency-weighted: henshin.ts
  // phenomenaOf; outlined while unmeasured), 習得 once mastered, today's marked. A tap plays that one instead (its lobby's
  // option, till 「今日の音に戻す」 or the sheet closes). Mine alone: nothing of it reaches the partner.
  import { PHENOMENA } from '#lib/kikimimi/henshin.ts';
  import { currentHenshin, pickHenshin } from '../progress.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import './round.ts';

  let { onpick }: { onpick: () => void } = $props();
  const h = $derived(currentHenshin());
  function pick(k: number | null) {
    pickHenshin(k);
    onpick();
  }
</script>

<section class="mastery card" aria-labelledby="kk-hs" data-kiki-henshin-mastery>
  <h3 id="kk-hs" class="sec-label">{t('kiki.henshin.mastery')}</h3>
  {#if h.picked}
    <p class="picked">{t('kiki.henshin.picked', { ph: t(`kiki.henshin.ph.${PHENOMENA[h.focus]}`) })}
      <button type="button" class="btn small paper" data-kiki-henshin-today-back data-sfx="back" onclick={() => pick(null)}>{t('kiki.henshin.backToday')}</button></p>
  {/if}
  <ol class="list">
    {#each h.states as s, k (s.id)}
      <li>
        <button type="button" class="row tile-btn" data-kiki-henshin-ph={s.id} aria-pressed={h.focus === k} data-sfx="tick" onclick={() => pick(k === h.today ? null : k)}>
          <span class="name"><b>{t(`kiki.henshin.ph.${s.id}`)}</b><small lang="en">{t(`kiki.henshin.eg.${s.id}`)}</small></span>
          <span class="tags">
            {#if k === h.today}<span class="tag today">{t('kiki.henshin.todayTag')}</span>{/if}
            {#if s.mastered}<span class="tag done" data-kiki-henshin-mastered>✓ {t('kiki.henshin.mastered')}</span>{/if}
          </span>
          <span class="bar" class:none={s.m === null} aria-hidden="true"><span style:width="{Math.round((s.m ?? 0) * 100)}%"></span></span>
          <span class="val">{s.m === null ? t('kiki.henshin.unmeasured') : `${Math.round(s.m * 100)}%`}</span>
        </button>
      </li>
    {/each}
  </ol>
</section>

<style>
  .mastery { display: grid; gap: 8px; padding: 12px 14px; }
  .sec-label { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .picked { margin: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .row {
    width: 100%; min-height: var(--hit); padding: 8px 12px; border-radius: 14px; display: grid; grid-template-columns: 1fr auto; gap: 4px 10px; align-items: center;
    text-align: left;
  }
  .row[aria-pressed='true'] { box-shadow: inset 0 0 0 3px var(--c-leaf); }
  .name { display: grid; gap: 1px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .name small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tags { display: flex; gap: 4px; justify-self: end; }
  .tag { padding: 2px 8px; border-radius: var(--r-pill); font: 700 var(--fs-s)/1.3 var(--font-ui); background: var(--ctl-off); }
  .tag.today { background: var(--c-yuzu, var(--ctl-sel)); }
  .tag.done { background: color-mix(in srgb, var(--c-leaf) 45%, var(--card)); }
  .bar { height: 8px; border-radius: 4px; background: var(--ctl-off); overflow: hidden; }
  .bar.none { background: transparent; box-shadow: inset 0 0 0 1.5px var(--edge); }
  .bar span { display: block; height: 100%; background: #3e9e4c; border-radius: 4px; }
  .val { justify-self: end; font: 700 var(--fs-s)/1.2 var(--font-num); color: var(--text-soft); }
</style>
