<script lang="ts">
  // A creature's card in the museum (docs/design.md "The museum"): NH's little plaque by an exhibit, as a tap on a fish
  // or a bug shows it: its icon, its names (Japanese and English), who found it first and when, and how many we've had
  // (the tallies, as the ずかん counts them). A tap anywhere else, ✕ or Esc closes it.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import ja from '#lib/i18n/catch.ja.json';
  import en from '#lib/i18n/catch.en.json';
  import { t } from '#lib/i18n/index.ts';
  import { findKey } from '#lib/model/finds.ts';
  import { countOf, type Totals } from '#lib/model/tally.ts';
  import { GUEST } from '#lib/config/rules.ts';
  import type { WeekView, Who } from '#lib/types.ts';
  import { bare } from '../kiroku/zukan.ts';
  import type { Specimen } from './species.ts';

  let { specimen, counts, view, onclose }: { specimen: Specimen; counts: Totals; view: WeekView; onclose: () => void } = $props();

  const key = $derived(`critter.name.${specimen.id}`);
  const nameJa = $derived((ja as Record<string, string>)[key] ?? specimen.id);
  const nameEn = $derived(bare((en as Record<string, string>)[key] ?? specimen.id));
  const names = $derived<Record<Who, string>>({ A: view.people.A.villagerName, B: view.people.B.villagerName, G: view.guest.villagerName });
  const villagers = $derived<Record<Who, string | null>>({ A: view.people.A.villager, B: view.people.B.villager, G: view.guest.villager });
  const who = $derived(specimen.found.person);
  const finder = $derived(who === 'G' && names.G !== GUEST.villager ? t('zukan.guestName', { name: names.G }) : names[who]);
  const date = $derived(`${Number(specimen.found.date.slice(5, 7))}/${Number(specimen.found.date.slice(8, 10))}`);
  const n = $derived(countOf(counts, findKey(specimen.kind, specimen.id), true));
  $effect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onclose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });
</script>

<div class="card" role="dialog" aria-label={nameJa} data-museum-card={specimen.id}>
  <span class="icon"><OfficialArt key={`critters/${specimen.id}`} size={52} eager /></span>
  <div class="txt">
    <b class="ja">{nameJa}</b>
    <span class="en" lang="en">{nameEn}</span>
    <span class="who" data-museum-finder={who}><Avatar person={who} villager={villagers[who]} size={18} />{t('zukan.foundBy', { date, name: finder })}</span>
    <span class="n" data-museum-times>{t('zukan.times', { n })}</span>
  </div>
  <button type="button" class="x" aria-label="とじる" data-sfx="back" onclick={onclose}>✕</button>
</div>

<style>
  .card {
    position: absolute; z-index: 4; left: 50%; top: calc(var(--ui-top, 0px) + 70px); transform: translateX(-50%);
    width: min(330px, calc(100% - 24px)); display: flex; gap: 10px; align-items: center; padding: 10px 12px 12px;
    border-radius: 18px; background: #FBF4DF; color: var(--c-ink); box-shadow: 0 3px 0 #D9C69A, 0 8px 18px rgba(0, 0, 0, .3);
    animation: pop .2s var(--ease-bounce) both;
  }
  .icon { flex: none; width: 58px; height: 58px; border-radius: 50%; background: #EEE2C2; display: grid; place-items: center; }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .ja { font-size: var(--fs-m, 16px); line-height: 1.2; }
  .en { color: var(--text-soft); font-size: var(--fs-s, 13px); text-transform: capitalize; }
  .who { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s, 13px); }
  .n { color: var(--text-soft); font-size: var(--fs-s, 13px); }
  .x { flex: none; align-self: flex-start; appearance: none; border: 0; background: none; font-size: 16px; width: 32px; height: 32px; cursor: pointer; color: var(--c-ink); }
  @keyframes pop { from { scale: .7; opacity: 0; } }
</style>
