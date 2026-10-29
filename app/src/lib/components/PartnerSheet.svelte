<script lang="ts">
  // Partner sheet (style guide v4 §R.4): tap the partner's villager on 島 → their head icon, name, their ripest
  // fruit (not a /100 score: no scoreboard, round 5 U7), four fruit rings on a Nook Miles+ card, and one action:
  // ハイタッチ (the scene reacts once the sheet closes).
  import { FRUITS } from '#lib/config/rules.ts';
  import Sheet from './Sheet.svelte';
  import Avatar from './Avatar.svelte';
  import FruitRing from './FruitRing.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { fruitArt } from '#lib/client/assets.ts';
  import { t, formatSyncTime } from '#lib/i18n/index.ts';

  let { open = $bindable(), onhighfive }: { open: boolean; onhighfive: () => void } = $props();

  const view = $derived(week.view);
  const p = $derived(view ? view.people[view.partner] : null);
  const best = $derived(p ? FRUITS.reduce((a, b) => (p.fruits[b].pct > p.fruits[a].pct ? b : a)) : null);

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
        <span class="sync">{p.lastSyncAt ? t('partner.synced', { time: formatSyncTime(p.lastSyncAt, view.today) }) : t('partner.never')}</span>
      </div>
      {#if best}<span class="best" aria-hidden="true"><OfficialArt key={fruitArt(best)} size={52} /></span>{/if}
    </div>
    <div class="fruits miles" style:--card="var(--card-teal)">
      {#each FRUITS as f (f)}<FruitRing fruit={f} view={p.fruits[f]} size="64px" showPct />{/each}
    </div>
    <button type="button" class="btn yuzu" onclick={five}>
      <OfficialArt key="reactions/encouraging" size={30} />{t('partner.highfive')}
    </button>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .who { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .who h2 { font-size: var(--fs-h2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sync { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .best { flex: none; line-height: 0; filter: drop-shadow(0 3px 0 rgba(74, 58, 44, .14)); }
  .fruits { display: grid; grid-template-columns: repeat(4, 1fr); justify-items: center; gap: 10px 4px; padding: 14px 6px; margin-bottom: 20px; }
  @media (max-width: 359px) { .fruits { grid-template-columns: repeat(2, 1fr); } }
  @media (max-height: 700px), (max-width: 359px) {
    .head :global(.av) { --s: 56px !important; }
  }
</style>
