<script lang="ts">
  // A campsite's card body (the site's camp .content): the photo, the description, its chips (our nights' in the second
  // accent), the stats (the road time from the office, the kind, the fee) and Maps. The list's card and the map's
  // sheet both show it.
  import type { Camp } from '#lib/travel/types.ts';
  import { t, type Locale } from '#lib/i18n/index.ts';
  import CText from './CText.svelte';
  import CLinks from './CLinks.svelte';
  import CPhoto from './CPhoto.svelte';
  import { fmtKm } from '../units.ts';

  let { camp, note, lang }: { camp: Camp; note: Record<string, string> | null; lang: Locale } = $props();
</script>

<CPhoto photo={camp.photo} />
<p class="desc"><CText l={camp.desc} {note} /></p>
<div class="cchips">{#each camp.chips as c, i (i)}<span class="cchip" class:pick={c.pick}><CText l={c.text} {note} /></span>{/each}</div>
<div class="stat-grid" lang={lang}>
  <div class="stat"><div class="k">{t('travel.classic.camp.office', undefined, lang)}</div><div class="v">{t('travel.classic.camp.drive', { min: camp.fromMin, km: fmtKm(camp.fromKm) }, lang)}</div></div>
  <div class="stat"><div class="k">{t('travel.classic.camp.type', undefined, lang)}</div><div class="v">{t(`travel.classic.camp.${camp.type}`, undefined, lang)}</div></div>
  <div class="stat"><div class="k">{t('travel.classic.camp.fee', undefined, lang)}</div><div class="v"><CText l={camp.fee} {note} /></div></div>
</div>
<CLinks links={[{ label: { [lang]: t('travel.classic.camp.maps', undefined, lang) }, href: camp.maps }]} {note} />
