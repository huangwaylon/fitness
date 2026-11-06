<script lang="ts">
  // キャンプ (Okinawa): the Evertrail directory's campsites (docs/travel.md "The sheet"), the intro, the filter chips
  // in two labelled rows (しゅるい, one of すべて / むりょう / ゆうりょう: a radio group; せつび, any of ビーチ / トイレ /
  // シャワー: toggles, ✓ when on; each 44px, with the count it would show), the cards (the photo, the name and where, our nights' chips first in yuzu, the road time and fee, the
  // description, Maps), an empty state when nothing passes, the source's foot.
  import type { Trip } from '#lib/travel/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import Txt from './Txt.svelte';
  import CampCard from './CampCard.svelte';
  import { roving } from '../ui/roving.ts';
  import { AMENITIES, KINDS, campsFor, countWith, type Amenity, type CampKind } from './camps.ts';

  let { trip, note }: { trip: Trip; note: Record<string, string> | null } = $props();
  let kind = $state<CampKind>('all');
  let has = $state<Amenity[]>([]);
  /** The intro read in full (folded to three lines). */
  let more = $state(false);
  const camps = $derived(trip.camps ?? []);
  const shown = $derived(campsFor(camps, { kind, has }));
  const toggle = (a: Amenity) => (has = has.includes(a) ? has.filter((x) => x !== a) : [...has, a]);
  const reset = () => {
    kind = 'all';
    has = [];
  };
</script>

<div class="camps" data-camps>
  <div class="filter" role="group" aria-label={t('travel.camps.filter')}>
    <div class="row">
      <span class="rl" id="camps-kind">{t('travel.camps.kind')}</span>
      <div class="chips" role="radiogroup" aria-labelledby="camps-kind" {@attach roving}>
        {#each KINDS as k (k)}
          <button type="button" class="chip big" role="radio" aria-checked={kind === k} tabindex={kind === k ? 0 : -1} data-camp-kind={k} data-sfx={kind === k ? 'none' : 'tick'} onclick={() => (kind = k)}>
            {t(`travel.camps.${k}`)}<span class="n money">{countWith(camps, { kind, has }, k)}</span>
          </button>
        {/each}
      </div>
    </div>
    <div class="row">
      <span class="rl" id="camps-has">{t('travel.camps.has')}</span>
      <div class="chips" role="group" aria-labelledby="camps-has">
        {#each AMENITIES as a (a)}
          {@const on = has.includes(a)}
          <button type="button" class="chip big" class:on aria-pressed={on} data-camp-has={a} data-sfx={on ? 'toggle-off' : 'toggle-on'} onclick={() => toggle(a)}>
            <span class="ck" aria-hidden="true">{on ? '✓' : '+'}</span>{t(`travel.camps.${a}`)}<span class="n money">{countWith(camps, { kind, has }, a)}</span>
          </button>
        {/each}
      </div>
    </div>
    <p class="count" aria-live="polite" data-camp-count={shown.length}>{t('travel.camps.count', { n: shown.length })}</p>
  </div>

  {#if trip.campsIntro}
    <div class="intro card" class:more>
      <p class="guide" id="camps-intro"><Txt l={trip.campsIntro} {note} /></p>
      <button type="button" class="more-b" aria-expanded={more} aria-controls="camps-intro" data-sfx="page" onclick={() => (more = !more)}>{t(more ? 'travel.less' : 'travel.more')}</button>
    </div>
  {/if}

  {#if !shown.length}
    <div class="empty card" data-camps-empty>
      <span class="ic" aria-hidden="true">⛺</span>
      <p>{t('travel.camps.none')}</p>
      <button type="button" class="btn small paper" data-camps-reset data-sfx="back" onclick={reset}>{t('travel.camps.reset')}</button>
    </div>
  {/if}

  {#each shown as c (c.id)}
    <CampCard camp={c} {note} />
  {/each}

  {#if trip.campsFoot}<p class="foot guide"><Txt l={trip.campsFoot} {note} /></p>{/if}
</div>

<style>
  .camps { display: grid; gap: 12px; }
  p { margin: 0; }
  .intro { display: grid; gap: 0; padding: 12px 16px 0; }
  .intro p { font: 500 var(--fs-s)/1.6 var(--font-ui); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; }
  .intro.more p { display: block; }
  .more-b { justify-self: end; appearance: none; border: 0; background: none; min-height: var(--hit); margin-right: -6px; padding: 0 6px; cursor: pointer; color: var(--leaf-text); font: 700 var(--fs-s)/1 var(--font-ui); }
  .filter { display: grid; gap: 8px; }
  .row { display: grid; grid-template-columns: 4.2em minmax(0, 1fr); align-items: center; gap: 8px; }
  .rl { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .chip { padding: 0 12px; font-size: var(--fs-s); }
  .chip .n { margin-left: 2px; font-size: var(--fs-xs); opacity: .75; }
  .ck { width: 1em; text-align: center; font-weight: 700; opacity: .6; }
  .on .ck { opacity: 1; }
  .count { margin: 0 4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .empty { display: grid; justify-items: center; gap: 10px; padding: 24px 16px; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .empty .ic { font-size: 2rem; line-height: 1; filter: grayscale(.4); }

  .foot { margin: 4px 4px 0; font: 500 var(--fs-xs)/1.5 var(--font-ui); color: var(--text-soft); }
</style>
