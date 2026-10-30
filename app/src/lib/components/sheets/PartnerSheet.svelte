<script lang="ts">
  // Partner sheet (v5 §3, round 17 IA §4.3): tap the partner's villager on 島 → a villager card, the way talking to a
  // villager works in NH: their face and name, when their data last arrived (it explains low numbers right where
  // you'd ask) and one action, ハイタッチ. Their numbers live on their tree (the popup), not here.
  import Sheet from '../ui/Sheet.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';

  let { open = $bindable(), onhighfive }: { open: boolean; onhighfive: () => void } = $props();

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
      <Avatar person={p.person} villager={p.villager} size={72} />
      <div class="who">
        <h2>{p.villagerName}</h2>
        <span class="sync">{p.lastSyncAt ? t('partner.synced', { time: formatSyncTime(p.lastSyncAt, view.today) }) : t('partner.never')}</span>
      </div>
    </div>
    <button type="button" class="btn yuzu" data-sfx="confirm" onclick={five}>
      <OfficialArt key="reactions/encouraging" size={30} />{t('partner.highfive')}
    </button>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .who { flex: 1; min-width: 0; display: grid; gap: 6px; }
  .who h2 { font-size: var(--fs-title); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sync { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  @media (max-height: 700px), (max-width: 359px) {
    .head :global(.av) { --s: 60px !important; }
  }
</style>
