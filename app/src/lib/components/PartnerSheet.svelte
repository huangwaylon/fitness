<script lang="ts">
  // Partner sheet (style guide v3 §0, §B.1): tap the partner's villager on 島 → their head icon,
  // score, four fruit rings, last sync, and one action: ハイタッチ.
  import type { FruitKey } from '#lib/types.ts';
  import Sheet from './Sheet.svelte';
  import Avatar from './Avatar.svelte';
  import FruitRing from './FruitRing.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { t, formatSyncTime } from '#lib/i18n/index.ts';

  let { open = $bindable(), onhighfive }: { open: boolean; onhighfive: () => void } = $props();

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
  const view = $derived(week.view);
  const p = $derived(view ? view.people[view.partner] : null);

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
        <span class="sync">{t('partner.synced', { time: formatSyncTime(p.lastSyncAt, view.today) })}</span>
      </div>
      <span class="score"><b class="money">{p.score}</b><small class="money">/100</small></span>
    </div>
    <div class="fruits">
      {#each FRUITS as f (f)}<FruitRing fruit={f} view={p.fruits[f]} size="60px" showPct />{/each}
    </div>
    <button type="button" class="btn yuzu" onclick={five}>
      <svg viewBox="0 0 24 24" aria-hidden="true" style:color="var(--p-berry)"><use href="#i-heart" /></svg>{t('partner.highfive')}
    </button>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
  .who { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .who h2 { font-size: var(--fs-h2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sync { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .score { display: flex; align-items: baseline; gap: 2px; }
  .score b { font-size: var(--fs-hero); }
  .score small { font-size: 1rem; color: var(--text-soft); }
  .fruits { display: flex; justify-content: space-around; margin-bottom: 22px; }
</style>
