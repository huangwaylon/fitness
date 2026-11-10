<script lang="ts" module>
  import type { FirstFind } from '#lib/model/finds.ts';
  /** What's shown: its kind, its id, its first find; a fossil's skeleton (its pieces found of how many). */
  export interface Shown { kind: 'fish' | 'bug' | 'sea' | 'fossil' | 'art'; id: string; found: FirstFind; set?: { id: string; n: number; of: number } }
</script>

<script lang="ts">
  // An exhibit's card in the museum (docs/design.md "The museum"): NH's little plaque by an exhibit, as a tap on a fish,
  // a bug, a sea creature, a fossil or an artwork shows it: its icon, its names (Japanese and English), a fossil's
  // skeleton (its pieces in, 「コンプリート！」 once whole, as the ずかん says) or an artwork's real title and artist, who found it first
  // and when, and how many we've had (the tallies, as the ずかん counts them). A tap anywhere else, ✕ or Esc closes it.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import ja from '#lib/i18n/catch.ja.json';
  import en from '#lib/i18n/catch.en.json';
  import { t } from '#lib/i18n/index.ts';
  import NavButton from '../ui/NavButton.svelte';
  import { findKey } from '#lib/model/finds.ts';
  import '#lib/i18n/catch.ts'; // a skeleton's name, an artwork's real title (t: in the language on screen)
  import { countOf, type Totals } from '#lib/model/tally.ts';
  import { GUEST } from '#lib/config/rules.ts';
  import type { WeekView, Who } from '#lib/types.ts';
  import { bare } from '../kiroku/zukan.ts';

  let { shown, counts, view, onclose }: { shown: Shown; counts: Totals; view: WeekView; onclose: () => void } = $props();

  const NAME = { fish: 'critter.name', bug: 'critter.name', sea: 'sea.name', fossil: 'beach.name', art: 'art.name' } as const;
  const ICON = { fish: 'critters', bug: 'critters', sea: 'critters', fossil: 'finds', art: 'finds/art' } as const;
  const name = (cat: Record<string, string>, k: string) => cat[k] ?? shown.id;
  const key = $derived(`${NAME[shown.kind]}.${shown.id}`);
  const nameJa = $derived(name(ja, key));
  const nameEn = $derived(bare(name(en, key)));
  /** A fossil's skeleton line, or an artwork's real title and artist. */
  const more = $derived(
    shown.set
      ? shown.set.n === shown.set.of
        ? `${t(`fossil.set.${shown.set.id}`)} ${t('zukan.complete')}`
        : t('museum.card.set', { set: t(`fossil.set.${shown.set.id}`), n: shown.set.n, of: shown.set.of })
      : shown.kind === 'art'
        ? t(`art.real.${shown.id}`)
        : null
  );
  const names = $derived<Record<Who, string>>({ A: view.people.A.villagerName, B: view.people.B.villagerName, G: view.guest.villagerName });
  const villagers = $derived<Record<Who, string | null>>({ A: view.people.A.villager, B: view.people.B.villager, G: view.guest.villager });
  const who = $derived(shown.found.person);
  const finder = $derived(who === 'G' && names.G !== GUEST.villager ? t('zukan.guestName', { name: names.G }) : names[who]);
  const date = $derived(`${Number(shown.found.date.slice(5, 7))}/${Number(shown.found.date.slice(8, 10))}`);
  const n = $derived(countOf(counts, findKey(shown.kind === 'art' ? 'item' : shown.kind, shown.id), true));
  $effect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onclose();
    addEventListener('keydown', k);
    return () => removeEventListener('keydown', k);
  });
</script>

<div class="card" role="dialog" aria-label={nameJa} data-museum-card={shown.id}>
  <span class="icon"><OfficialArt key={`${ICON[shown.kind]}/${shown.id}`} size={52} eager /></span>
  <div class="txt">
    <b class="ja">{nameJa}</b>
    <span class="en" lang="en">{nameEn}</span>
    {#if more}<span class="more" data-museum-more>{more}</span>{/if}
    <span class="who" data-museum-finder={who}><Avatar worn person={who} villager={villagers[who]} size={18} />{t('zukan.foundBy', { date, name: finder })}</span>
    <span class="n" data-museum-times>{t('zukan.times', { n })}</span>
  </div>
  <span class="x"><NavButton kind="close" onclick={onclose} /></span>
</div>

<style>
  .card {
    position: absolute; z-index: 4; left: 50%; top: calc(var(--ui-top, 0px) + 70px); transform: translateX(-50%);
    width: min(420px, calc(100% - 2 * var(--side))); display: flex; gap: 10px; align-items: center; padding: 12px 12px 12px 14px;
    border-radius: var(--r-card); background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    animation: pop .2s var(--ease-bounce) both;
  }
  .icon { flex: none; width: 58px; height: 58px; border-radius: 50%; background: color-mix(in srgb, var(--c-lip) 45%, var(--c-cream)); display: grid; place-items: center; }
  .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  /* a fixed-cream game card at every hour: the ink pair, never the night chrome's text tokens */
  .ja { font-size: var(--fs-talk); line-height: 1.2; }
  .en { color: var(--c-ink-soft); font-size: var(--fs-s); text-transform: capitalize; }
  .more { font-size: var(--fs-s); line-height: 1.3; }
  .who { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-s); }
  .n { color: var(--c-ink-soft); font-size: var(--fs-s); }
  /* the app's ✕ (NavButton) */
  .x { flex: none; align-self: flex-start; display: flex; }
  @keyframes pop { from { scale: .7; opacity: 0; } }
</style>
