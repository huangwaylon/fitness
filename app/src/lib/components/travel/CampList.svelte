<script lang="ts">
  // キャンプ場 (docs/design.md §Trips): one line of filter chips (すべて with the count, 候補, 無料 / 有料, ビーチ ·
  // トイレ · シャワー; each with the count it would show), how the list is ordered, then a card of compact rows: the
  // photo, the name with our night's tag, where · the road time · the kind, the amenities' icons, ★ on the
  // shortlist. A row opens its sheet (CampSheet). An empty state when nothing passes, the guide's intro and foot.
  import type { Camp, Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { asset } from '$app/paths';
  import Icon from '../quiet/Icon.svelte';
  import Chip from '../quiet/Chip.svelte';
  import ChipRow from '../quiet/ChipRow.svelte';
  import Txt from './Txt.svelte';
  import CampSheet from './CampSheet.svelte';
  import { pick } from './text.ts';
  import { AMENITIES, campsFor, countWith, isPicked, type Amenity, type CampKind } from './camps.ts';

  let { trip, note, onmap }: { trip: Trip; note: Record<string, string> | null; onmap?: (id: string) => void } = $props();
  let kind = $state<CampKind>('all');
  let has = $state<Amenity[]>([]);
  let picks = $state(false);
  const camps = $derived(trip.camps ?? []);
  const f = $derived({ kind, has, picks });
  const shown = $derived(campsFor(camps, f));
  const none = $derived(kind === 'all' && !has.length && !picks);
  const toggle = (a: Amenity) => (has = has.includes(a) ? has.filter((x) => x !== a) : [...has, a]);
  const reset = () => {
    kind = 'all';
    has = [];
    picks = false;
  };
  const ICON = { beach: 'beach', toilet: 'toilet', shower: 'shower' } as const;
  /** Our night's own tag (1泊目, 2泊目): the picked chips but the plain 候補. */
  const tagOf = (c: Camp) => c.chips.find((x) => x.pick && pick(x.text, 'ja') !== '候補');
  /** Where it is: the guide's line's last part (「野営地 · 恩納村」 → 恩納村). */
  const areaOf = (c: Camp) => pick(c.sub, i18n.locale).split(' · ').at(-1) ?? '';
  let openId = $state<string | null>(null);
  let sheet = $state(false);
  const camp = $derived(openId ? camps.find((c) => c.id === openId) : undefined);
</script>

<div class="camps" data-camps>
  <div class="bar">
    <ChipRow label={t('travel.camps.filter')}>
      <Chip label={t('travel.camps.all')} count={camps.length} selected={none} data-camp-kind="all" onclick={reset} />
      <Chip label={t('travel.camps.picks')} count={countWith(camps, f, 'picks')} selected={picks} data-camp-picks onclick={() => (picks = !picks)} />
      {#each AMENITIES as a (a)}
        <Chip label={t(`travel.camps.${a}`)} count={countWith(camps, f, a)} selected={has.includes(a)} data-camp-has={a} onclick={() => toggle(a)} />
      {/each}
      {#each ['wild', 'paid'] as const as k (k)}
        <Chip label={t(`travel.camps.${k}`)} count={countWith(camps, f, k)} selected={kind === k} data-camp-kind={k} onclick={() => (kind = kind === k ? 'all' : k)} />
      {/each}
    </ChipRow>
  </div>
  <p class="count" aria-live="polite" data-camp-count={shown.length}>{t('travel.camps.order')} · {t('travel.camps.count', { n: shown.length })}</p>

  {#if !shown.length}
    <div class="q-card empty" data-camps-empty>
      <Icon name="tent" size={28} />
      <p>{t('travel.camps.none')}</p>
      <button type="button" class="q-btn" data-camps-reset data-sfx="back" onclick={reset}>{t('travel.camps.reset')}</button>
    </div>
  {:else}
    <div class="q-card list">
      {#each shown as c (c.id)}
        {@const tag = tagOf(c)}
        <button type="button" class="q-row cr" data-camp={c.id} data-camp-pick={isPicked(c) ? '' : undefined} data-sfx="open" onclick={() => ((openId = c.id), (sheet = true))}>
          <img class="cth" src={asset(c.photo.src as Parameters<typeof asset>[0])} alt="" width="56" height="56" loading="lazy" decoding="async" />
          <span class="tx">
            <span class="nm guide"><span class="q-ell"><Txt l={c.name} {note} /></span>{#if tag}<span class="pk"><Txt l={tag.text} {note} /></span>{/if}</span>
            <span class="sb">{areaOf(c)} · {t('travel.camps.drive', { min: c.fromMin })} · {t(`travel.camps.${c.type}`)}</span>
            <span class="am">{#each AMENITIES as a (a)}{#if c[a]}<Icon name={ICON[a]} size={14} />{/if}{/each}</span>
          </span>
          {#if isPicked(c)}<span class="star" aria-label={t('travel.camps.picks')}><Icon name="star" size={18} fill /></span>{/if}
        </button>
      {/each}
    </div>
  {/if}

  {#if trip.campsIntro}<p class="foot guide"><Txt l={trip.campsIntro} {note} /></p>{/if}
  {#if trip.campsFoot}<p class="foot guide"><Txt l={trip.campsFoot} {note} /></p>{/if}
  {#if camp}<CampSheet bind:open={sheet} {camp} {note} {onmap} />{/if}
</div>

<style>
  .camps { display: grid; grid-template-columns: minmax(0, 1fr); }
  p { margin: 0; }
  .bar { margin: -8px -16px 0; }
  .count { margin: 4px 4px 8px; font-size: var(--q-fs-s); color: var(--q-muted); }
  .cr { min-height: 76px; padding: 10px 14px 10px 12px; gap: 12px; }
  .cth { width: 56px; height: 56px; border-radius: 12px; object-fit: cover; flex: none; background: var(--q-sunken); }
  .tx { flex: 1; min-width: 0; display: grid; }
  .nm { display: flex; align-items: center; gap: 6px; min-width: 0; font: var(--q-w-b) var(--q-fs-body)/1.35 var(--q-font); }
  .pk { flex: none; font: var(--q-w-b) var(--q-fs-xs)/1.4 var(--q-font); color: var(--q-accent-ink); background: var(--q-accent-soft); padding: 1px 6px; border-radius: 6px; }
  .sb { font-size: var(--q-fs-s); color: var(--q-muted); }
  .am { display: flex; gap: 6px; color: var(--q-muted); margin-top: 4px; min-height: 14px; }
  .star { color: var(--q-accent); flex: none; display: flex; }
  .empty { display: grid; justify-items: center; gap: 10px; padding: 24px 16px; text-align: center; color: var(--q-muted); }
  .foot { margin: 14px 4px 0; font-size: var(--q-fs-s); line-height: 1.6; color: var(--q-muted); }
</style>
