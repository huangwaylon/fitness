<script lang="ts">
  // A campsite's card (キャンプ's list, and the sheet a camp pin on ちず opens): the photo, the name and where, our
  // nights' chips first in yuzu, the road time and fee, the description, Maps (Links).
  import type { Camp } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import Txt from './Txt.svelte';
  import Photo from './Photo.svelte';
  import Links from './Links.svelte';
  import { pick } from './text.ts';
  import { fmtKm } from './units.ts';

  let { camp, note }: { camp: Camp; note: Record<string, string> | null } = $props();
  const picks = $derived(camp.chips.filter((x) => x.pick));
  const rest = $derived(camp.chips.filter((x) => !x.pick));
</script>

<article class="camp card" data-camp={camp.id} data-camp-pick={picks.length ? '' : undefined}>
  <div class="ph"><Photo photo={camp.photo} fill /></div>
  <div class="cb guide">
    <h3 class="nm"><Txt l={camp.name} {note} /></h3>
    <p class="sb"><Txt l={camp.sub} {note} /></p>
    <ul class="tags" aria-label={pick(camp.name, i18n.locale)}>
      {#each picks as x, i (i)}<li class="tg pick"><Txt l={x.text} {note} /></li>{/each}
      {#each rest as x, i (i)}<li class="tg"><Txt l={x.text} {note} /></li>{/each}
    </ul>
    <dl class="facts">
      <div><dt>{t('travel.hike.drive')}</dt><dd>{t('travel.camps.drive', { min: camp.fromMin })} · <span class="money">{fmtKm(camp.fromKm)}</span></dd></div>
      <div><dt>{t('travel.camps.fee')}</dt><dd><Txt l={camp.fee} {note} /></dd></div>
    </dl>
    <p class="desc"><Txt l={camp.desc} {note} /></p>
    <Links links={[{ label: { [i18n.locale]: t('travel.camps.maps') }, href: camp.maps }]} {note} attr="camp-maps" />
  </div>
</article>

<style>
  p, h3 { margin: 0; }
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
</style>
