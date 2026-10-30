<script lang="ts">
  // Partner sheet (v5 §3, §4): tap the partner's villager on 島 → their head icon, name, today's ベル, their progress
  // today (four fruit rings against the daily goal, with the real numbers; tap → the week's badge progress),
  // today's eating check-ins (both players see everything) and one action: ハイタッチ.
  import type { FruitKey } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import FruitRing from './FruitRing.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { fruitDetail, todayAmount, todayPct } from '../island/progress.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';

  let { open = $bindable(), onhighfive }: { open: boolean; onhighfive: () => void } = $props();

  const view = $derived(week.view);
  const p = $derived(view ? view.people[view.partner] : null);
  let pick = $state<FruitKey>('peach');
  const ticked = $derived(view && p ? new Set(p.habits.ticksByDate[view.today] ?? []) : new Set<string>());

  function five() {
    open = false;
    onhighfive();
  }
</script>

<Sheet bind:open label={p?.villagerName ?? ''}>
  {#if view && p}
    <div class="head">
      <Avatar person={p.person} villager={p.villager} size={64} />
      <div class="who">
        <h2>{p.villagerName}</h2>
        <span class="bells money">{t('partner.todayBells', { bells: formatBells(p.today.bells, { signed: true }) })}</span>
        <span class="sync">{p.lastSyncAt ? t('partner.synced', { time: formatSyncTime(p.lastSyncAt, view.today) }) : t('partner.never')}</span>
      </div>
    </div>
    <div class="fruits card">
      {#each FRUITS as f (f)}
        {@const [a, g] = todayAmount(f, p.fruits[f]).split('/')}
        <span class="fr"><FruitRing fruit={f} pct={todayPct(p.fruits[f])} label={fruitDetail(f, p.fruits[f])} size="var(--ring)"
          picked={pick === f} onpick={() => (pick = f)} /><small class="money">{a}{#if g !== undefined}<wbr />/{g}{/if}</small></span>
      {/each}
      <p class="cap" aria-live="polite">{fruitDetail(pick, p.fruits[pick])}</p>
    </div>
    <ul class="ticks card" aria-label={t('partner.today')}>
      {#each p.habits.keys as k (k)}
        <li class:on={ticked.has(k)}><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t(`habit.${k}`)}</li>
      {/each}
    </ul>
    <button type="button" class="btn yuzu" data-sfx="confirm" onclick={five}>
      <OfficialArt key="reactions/encouraging" size={30} />{t('partner.highfive')}
    </button>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .who { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .who h2 { font-size: var(--fs-title); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bells { font-size: var(--fs-body); }
  .sync { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .fruits { --ring: 64px; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); justify-items: center; gap: 10px 4px; padding: 14px 6px; margin-bottom: 12px; background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); }
  .fr { display: grid; justify-items: center; gap: 4px; min-width: 0; }
  .fr small { font-size: var(--fs-s); line-height: 1.25; color: var(--c-ink-soft); text-align: center; max-width: 100%; }
  .cap { grid-column: 1 / -1; margin: 2px 4px 0; text-align: center; font-size: var(--fs-s); font-weight: 700; color: var(--c-ink-soft); text-wrap: balance; }
  .ticks { list-style: none; margin: 0 0 20px; padding: 10px 14px; display: grid; gap: 6px; background: var(--c-cream); color: var(--c-ink-soft); box-shadow: 0 var(--lip-h) 0 var(--c-lip); }
  .ticks li { display: flex; align-items: center; gap: 8px; font-weight: 700; }
  .ticks svg { width: 18px; height: 18px; flex: none; color: var(--c-lip); }
  .ticks li.on { color: var(--c-ink); }
  .ticks li.on svg { color: var(--c-leaf-lip); }
  /* four rings in one row at every width (4 × 60 + 3 × 2 fits 320: sizing #12) */
  @media (max-width: 359px) { .fruits { --ring: 60px; gap: 10px 2px; padding: 12px 4px; } }
  @media (max-height: 700px), (max-width: 359px) {
    .head :global(.av) { --s: 56px !important; }
  }
</style>
