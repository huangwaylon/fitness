<script lang="ts">
  // キャンプ (Okinawa): the Evertrail directory's campsites (docs/travel.md "The sheet"), the intro, the filter chips
  // (one kind: すべて / むりょう / ゆうりょう; any amenities: ビーチ / トイレ / シャワー; each with the count it would
  // show), the cards (the photo, the name and where, our nights' chips first in yuzu, the road time and fee, the
  // description, Maps), an empty state when nothing passes, the source's foot.
  import type { Trip } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Txt from './Txt.svelte';
  import Photo from './Photo.svelte';
  import { pick } from './text.ts';
  import { fmtKm } from './units.ts';
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
    <div class="chips">
      {#each KINDS as k (k)}
        <button type="button" class="chip" aria-pressed={kind === k} data-camp-kind={k} data-sfx={kind === k ? 'none' : 'tick'} onclick={() => (kind = k)}>
          {t(`travel.camps.${k}`)}<span class="n money">{countWith(camps, { kind, has }, k)}</span>
        </button>
      {/each}
      <span class="sep" aria-hidden="true"></span>
      {#each AMENITIES as a (a)}
        <button type="button" class="chip" aria-pressed={has.includes(a)} data-camp-has={a} data-sfx={has.includes(a) ? 'toggle-off' : 'toggle-on'} onclick={() => toggle(a)}>
          {t(`travel.camps.${a}`)}<span class="n money">{countWith(camps, { kind, has }, a)}</span>
        </button>
      {/each}
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
    {@const picks = c.chips.filter((x) => x.pick)}
    {@const rest = c.chips.filter((x) => !x.pick)}
    <article class="camp card" data-camp={c.id} data-camp-pick={picks.length ? '' : undefined}>
      <div class="ph"><Photo photo={c.photo} fill /></div>
      <div class="cb guide">
        <h3 class="nm"><Txt l={c.name} {note} /></h3>
        <p class="sb"><Txt l={c.sub} {note} /></p>
        <ul class="tags" aria-label={pick(c.name, i18n.locale)}>
          {#each picks as x, i (i)}<li class="tg pick"><Txt l={x.text} {note} /></li>{/each}
          {#each rest as x, i (i)}<li class="tg"><Txt l={x.text} {note} /></li>{/each}
        </ul>
        <dl class="facts">
          <div><dt>{t('travel.hike.drive')}</dt><dd>{t('travel.camps.drive', { min: c.fromMin })} · <span class="money">{fmtKm(c.fromKm)}</span></dd></div>
          <div><dt>{t('travel.camps.fee')}</dt><dd><Txt l={c.fee} {note} /></dd></div>
        </dl>
        <p class="desc"><Txt l={c.desc} {note} /></p>
        <a class="lk" href={c.maps} target="_blank" rel="noopener noreferrer" data-sfx="open" data-camp-maps aria-label="{t('travel.camps.maps')} ({t('travel.opens')})">
          <span>{t('travel.camps.maps')}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3h7v7M13 3 4 12" /></svg>
        </a>
      </div>
    </article>
  {/each}

  {#if trip.campsFoot}<p class="foot guide"><Txt l={trip.campsFoot} {note} /></p>{/if}
</div>

<style>
  .camps { display: grid; gap: 12px; }
  p, h3 { margin: 0; }
  .intro { display: grid; gap: 0; padding: 12px 16px 0; }
  .intro p { font: 500 var(--fs-s)/1.6 var(--font-ui); display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden; }
  .intro.more p { display: block; }
  .more-b { justify-self: end; appearance: none; border: 0; background: none; min-height: var(--hit); margin-right: -6px; padding: 0 6px; cursor: pointer; color: var(--leaf-text); font: 700 var(--fs-s)/1 var(--font-ui); }
  .filter { display: grid; gap: 8px; }
  .chip .n { margin-left: 2px; font-size: var(--fs-xs); opacity: .75; }
  .sep { width: 2px; align-self: stretch; margin: 4px 2px; border-radius: 1px; background: var(--lip); }
  .count { margin: 0 4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .empty { display: grid; justify-items: center; gap: 10px; padding: 24px 16px; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .empty .ic { font-size: 2rem; line-height: 1; filter: grayscale(.4); }

  .camp { padding: 0; overflow: hidden; }
  .ph { position: relative; aspect-ratio: 720 / 360; background: var(--hl); }
  .cb { display: grid; gap: 8px; padding: 12px 14px 14px; }
  .nm { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .sb { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .tg { padding: 3px 10px; border-radius: var(--r-pill); background: var(--hl); font: 700 var(--fs-xs)/1.5 var(--font-ui); color: var(--text-soft); }
  .tg.pick { background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .facts { margin: 0; display: grid; gap: 4px; }
  .facts div { display: flex; gap: 8px; align-items: baseline; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .facts dt { flex: none; min-width: 4.6em; color: var(--text-soft); }
  .facts dd { margin: 0; }
  .desc { font: 500 var(--fs-s)/1.6 var(--font-ui); }
  .lk {
    justify-self: start; display: inline-flex; align-items: center; gap: 6px; min-height: var(--hit); padding: 0 14px; border-radius: var(--r-pill);
    background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); text-decoration: none; margin-bottom: var(--lip-h);
    font: 700 var(--fs-s)/1.2 var(--font-ui); -webkit-tap-highlight-color: transparent;
  }
  .lk:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .lk svg { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .foot { margin: 4px 4px 0; font: 500 var(--fs-xs)/1.5 var(--font-ui); color: var(--text-soft); }
</style>
