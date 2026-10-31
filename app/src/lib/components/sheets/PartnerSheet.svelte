<script lang="ts">
  // Partner sheet (v5 §3, round 17 IA §4.3): tap the partner's villager on 島 → a villager card, the way talking to a
  // villager works in NH: their name (the title bar), their face, one line they say about their day (picked from their rings: an NH
  // beat that replaces the numbers, never adds one), when their data last arrived (it explains low numbers right
  // where you'd ask) and one action, ハイタッチ. Their numbers live on their tree (the popup), not here.
  import type { PersonWeekView, RingFruit } from '#lib/types.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import Sheet from '../ui/Sheet.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';

  let { open = $bindable(), onhighfive }: { open: boolean; onhighfive: () => void } = $props();

  const view = $derived(week.view);
  const p = $derived(view ? view.people[view.partner] : null);

  /** What they say: all four met, else the proudest ring met today (Exercise first), else a cheer. */
  const SAY_ORDER: RingFruit[] = ['peach', 'apple', 'pear', 'cherry'];
  function say(person: PersonWeekView): string {
    if (RING_FRUITS.every((f) => person.rings[f].met)) return t('partner.say.all');
    const f = SAY_ORDER.find((k) => person.rings[k].met);
    return t(f ? `partner.say.${f}` : 'partner.say.none');
  }

  function five() {
    open = false;
    onhighfive();
  }
</script>

<Sheet bind:open label={p?.villagerName ?? ''} title={p?.villagerName ?? ''}>
  {#if view && p}
    <div class="head">
      <Avatar person={p.person} villager={p.villager} size={72} />
      <div class="who">
        <p class="say">{say(p)}</p>
        <span class="sync">{p.lastSyncAt ? t('partner.synced', { time: formatSyncTime(p.lastSyncAt, view.today) }) : t('partner.never')}</span>
      </div>
    </div>
    <button type="button" class="btn" data-sfx="confirm" onclick={five}>
      <OfficialArt key="reactions/encouraging" size={30} />{t('partner.highfive')}
    </button>
  {/if}
</Sheet>

<style>
  .head { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
  .who { flex: 1; min-width: 0; display: grid; gap: 6px; }
  /* flush with the bubble's left edge (round 21: 6px left of it) */
  .sync { margin-left: 6px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  /* their line: a small cream speech bubble with its tail toward the face */
  .say {
    position: relative; justify-self: start; margin: 2px 0 2px 6px; padding: 7px 12px; border-radius: var(--r-chip);
    background: var(--c-cream); color: var(--c-ink); font: 700 var(--fs-body)/1.35 var(--font-ui); box-shadow: 0 3px 0 var(--c-lip);
    text-wrap: balance;
  }
  .say::before {
    content: ''; position: absolute; left: -6px; top: 50%; margin-top: -6px; border: 6px solid transparent; border-left: 0;
    border-right-color: var(--c-cream);
  }
  @media (max-height: 700px), (max-width: 359px) {
    .head :global(.av) { --s: 60px !important; }
  }
</style>
