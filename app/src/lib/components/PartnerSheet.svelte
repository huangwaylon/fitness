<script lang="ts">
  // Partner sheet (v5 §3, §4): tap the partner's villager on 島 → their head icon, name, their progress (four
  // fruit rings with their real numbers on the one card skin; not a /100 score: no scoreboard, round 5 U7),
  // today's eating check-ins (both players see everything) and one action: ハイタッチ.
  import { FRUITS } from '#lib/config/rules.ts';
  import Sheet from './Sheet.svelte';
  import Avatar from './Avatar.svelte';
  import FruitRing from './FruitRing.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { t, formatSyncTime } from '#lib/i18n/index.ts';

  let { open = $bindable(), onhighfive }: { open: boolean; onhighfive: () => void } = $props();

  const view = $derived(week.view);
  const p = $derived(view ? view.people[view.partner] : null);
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
        <span class="sync">{p.lastSyncAt ? t('partner.synced', { time: formatSyncTime(p.lastSyncAt, view.today) }) : t('partner.never')}</span>
      </div>
    </div>
    <div class="fruits card">
      {#each FRUITS as f (f)}
        <span class="fr"><FruitRing fruit={f} view={p.fruits[f]} size="64px" /><small class="money">{p.fruits[f].actual}/{p.fruits[f].target}</small></span>
      {/each}
    </div>
    <ul class="ticks card" aria-label={t('partner.today')}>
      {#each p.habits.keys as k (k)}
        <li class:on={ticked.has(k)}><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t(`habit.${k}`)}</li>
      {/each}
    </ul>
    <button type="button" class="btn yuzu" onclick={five}>
      <OfficialArt key="reactions/encouraging" size={30} />{t('partner.highfive')}
    </button>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
  .who { flex: 1; min-width: 0; display: grid; gap: 4px; }
  .who h2 { font-size: var(--fs-title); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sync { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .fruits { display: grid; grid-template-columns: repeat(4, 1fr); justify-items: center; gap: 10px 4px; padding: 14px 6px; margin-bottom: 12px; background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); }
  .fr { display: grid; justify-items: center; gap: 4px; }
  .fr small { font-size: var(--fs-s); color: var(--c-ink-soft); }
  .ticks { list-style: none; margin: 0 0 20px; padding: 10px 14px; display: grid; gap: 6px; background: var(--c-cream); color: var(--c-ink-soft); box-shadow: 0 var(--lip-h) 0 var(--c-lip); }
  .ticks li { display: flex; align-items: center; gap: 8px; font-weight: 700; }
  .ticks svg { width: 18px; height: 18px; flex: none; color: var(--c-lip); }
  .ticks li.on { color: var(--c-ink); }
  .ticks li.on svg { color: var(--c-leaf-lip); }
  @media (max-width: 359px) { .fruits { grid-template-columns: repeat(2, 1fr); } }
  @media (max-height: 700px), (max-width: 359px) {
    .head :global(.av) { --s: 56px !important; }
  }
</style>
