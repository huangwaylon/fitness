<script lang="ts">
  // A saved place's floating card on a non-places map (docs/places.md "Map": the trail's, the trip's): its badge, name and
  // category, the hours line (no week view: the places page has it), 経路 (Google Maps' directions: S.route) and ✕.
  // Over the map, its foot `bottom` px up (8 px over what covers the map's bottom); `h` its height (the map pans the
  // square clear of it). The parent closes it (onclose) on ✕, a tap on empty map, Esc, the layer off, the sheet up.
  import type { Place } from '#lib/contract/places.ts';
  import Badge from './Badge.svelte';
  import HoursLine from './HoursLine.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Icon from '../ui/Icon.svelte';
  import { routeUrl } from '#lib/places/links.ts';
  import { S } from '#lib/places/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { onMount } from 'svelte';
  import { minuteTimer, now as clockNow } from '#lib/time/clock.ts';
  import { pick } from '../travel/text.ts';

  let { p, bottom, onclose, h = $bindable(0) }: { p: Place; bottom: number; onclose: () => void; h?: number } = $props();
  const L = $derived(i18n.locale);
  let now = $state(clockNow().getTime());
  onMount(() => minuteTimer(() => (now = clockNow().getTime())));
  // the hours: Google's (the row's details, the relay's), 営業時間は不明 without, 休業中かも for a week with no open day
  const hours = $derived(p.det?.hours ?? null);
</script>

<div class="pf" style:bottom="{bottom}px" data-place-float={p.id} role="dialog" aria-label={p.name} bind:offsetHeight={h}>
  <div class="hd">
    <Badge cat={p.cat} />
    <span class="tt"><span class="nm">{p.name}</span><span class="ct">{p.sub || p.cat}</span></span>
    <NavButton kind="close" label={pick(S.close, L)} onclick={onclose} />
  </div>
  <div class="ft">
    <HoursLine {hours} tz={p.tz} {now} week={false} closed={!!p.det?.shut} />
    <a class="btn small" href={routeUrl(p)} target="_blank" rel="noopener noreferrer" data-place-route data-sfx="open"><Icon name="arrow-up-right" size={18} />{pick(S.route, L)}</a>
  </div>
</div>

<style>
  .pf {
    position: absolute; z-index: 560; left: calc(12px + var(--safe-left)); right: calc(12px + var(--safe-right)); padding: 8px 8px 8px 12px; border-radius: var(--r-card); background: var(--c-cream);
    box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge), var(--sh-float); transition: bottom .32s var(--ease-soft);
  }
  .hd { display: flex; align-items: center; gap: 10px; }
  .tt { flex: 1; min-width: 0; display: grid; }
  .nm { font: 700 15px/1.3 var(--font-ui); color: var(--c-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ct { font: 600 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink-soft); }
  .ft { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: -4px; padding-left: 34px; }
  .ft .btn { width: auto; margin: 0 0 4px; flex: none; text-decoration: none; }
</style>
