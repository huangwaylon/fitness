<script lang="ts">
  // みみ チェック's result (docs/kikimimi.md "First run"; curriculum.md "Placement and spaced repetition"), no score: しずえ's 「〇〇から はじめましょう」 over
  // the five places with the placed one lit, the strongest skill (とくい) and the one to grow (これから), that it's mine
  // alone, and ききみみへ (the hub). Its own chunk: the check's results view (games/check/lane.ts).
  import type { QuizGame } from '../game.svelte.ts';
  import { PLACES } from '#lib/kikimimi/catalog.ts';
  import Host from '../../characters/Host.svelte';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '../../ui/Icon.svelte';

  let { game, onhub }: { game: QuizGame; onhub: () => void } = $props();
  const placement = $derived(game.placement);
  const stage = $derived(placement ? t(`kiki.stage.${placement.place}`) : '');
</script>

<div class="placed card" data-kiki-page="placed" data-kiki-placed={placement?.place} data-kiki-placed-lv={placement?.lv}>
  <Host pose="wave" size={104} />
  {#if placement}
    <p class="say kana" data-kiki-placed-say>{t('kiki.placed.say', { stage })}</p>
    <ol class="places" aria-label={t('kiki.level')}>
      {#each PLACES as p (p.id)}
        <li class:on={p.id === placement.place} class:obj-cream={p.id === placement.place} data-stage={p.id}>
          <span class="stars" aria-hidden="true">{'★'.repeat(p.stars)}</span>
          <span>{t(`kiki.stage.${p.id}`)}</span>
        </li>
      {/each}
    </ol>
    {#if placement.strong && placement.weak}
      <div class="skills">
        <span class="chip big good" data-kiki-strong={placement.strong}><small>{t('kiki.placed.strong')}</small>{t(`kiki.checkSkill.${placement.strong}`)}</span>
        <span class="chip big grow" data-kiki-weak={placement.weak}><small>{t('kiki.placed.weak')}</small>{t(`kiki.checkSkill.${placement.weak}`)}</span>
      </div>
    {/if}
    <p class="hint">{t('kiki.placed.change')}</p>
  {/if}
  <p class="mine"><Icon name="lock" size={14} stroke={2.4} /> {t('kiki.placed.mine')}</p>
</div>

<div class="level-acts">
  <button type="button" class="btn" data-kiki-placed-done data-sfx="confirm" onclick={onhub}>{t('kiki.placed.done')}</button>
</div>

<style>
  .placed { display: grid; justify-items: center; gap: 12px; padding: 18px 16px 20px; text-align: center; }
  .say { margin: 0; font: 700 var(--fs-title)/1.35 var(--font-ui); }
  .places { list-style: none; margin: 0; padding: 0; width: 100%; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .places li {
    min-height: 56px; border-radius: var(--r-card); display: grid; place-content: center; gap: 2px; background: var(--ctl-off);
    font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft);
  }
  .places li.on { background: var(--ctl-sel); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .stars { color: var(--coral-text); font-size: var(--fs-xs); line-height: 1; }
  .skills { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .skills .chip { display: grid; gap: 2px; padding: 8px 14px; cursor: default; }
  .skills small { font-size: var(--fs-s); color: var(--text-soft); }
  .good { box-shadow: inset 0 0 0 2px var(--c-leaf); }
  .grow { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .hint, .mine { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
