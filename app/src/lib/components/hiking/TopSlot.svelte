<script lang="ts">
  // The trail view's one top slot (docs/hiking.md "In-hike map"), under ‹ ✕ and the save pill (`top` px), clear of ＋ −
  // (`h`: its height, the map's notes go under it): off the route (coral, an
  // alert), else a hike begun far off (ルートまで…, a note), the fork on the way walked, or a note (back on the route, the
  // location or the compass refused, the compass's calibration). Both live regions are always there, empty when nothing
  // shows, so a screen reader hears each change: role="alert" for off the route, role="status" for the rest; the fork's
  // distance is read at a new fork and every 50 m (the screen's figure moves by 10 m).
  import Phrases from '../ui/Phrases.svelte';
  import type { Live } from './map/live.svelte.ts';
  import type { Dir, Junction } from './map/junction.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';
  import { MS } from '../map/strings.ts';

  let { live, full, top, h = $bindable(0) }: { live: Live; full: boolean; top: number; h?: number } = $props();
  const L = $derived(i18n.locale);
  const slot = $derived(live.slot);
  const DIR: Record<Dir, keyof typeof S> = { right: 'dirRight', left: 'dirLeft', straight: 'dirStraight' };
  const fill = (s: string, k: string, v: string | number) => s.replace(`{${k}}`, String(v));
  /** A distance off the route: metres to 10, from 1,000 m km to a tenth. */
  const away = (m: number) => {
    const sp = L === 'en' ? ' ' : '';
    return m < 1000 ? `${m}${sp}m` : `${(m / 1000).toFixed(1)}${sp}km`;
  };
  /** The fork's line: its distance (to `step` m), the way to go (or the map's thick line when no word stands clear). */
  const forkLine = (j: Junction, step: number) =>
    `${j.to <= 10 ? pick(S.fork, L) : fill(pick(S.forkIn, L), 'n', Math.max(step, Math.round(j.to / step) * step))} · ${j.dir ? fill(pick(S.forkDir, L), 'dir', pick(S[DIR[j.dir]], L)) : pick(S.forkHl, L)}`;
  const shown = $derived(live.junction ? forkLine(live.junction, 10) : '');
  const said = $derived(live.junction ? forkLine(live.junction, 50) : '');
</script>

<div class="top-slot" inert={full} style:top="{top}px" bind:offsetHeight={h}>
  <div class="slot alert" class:shown={slot === 'off'} role="alert" data-top-slot={slot === 'off' ? 'off' : undefined}>
    {#if slot === 'off' && live.off}<p class="big" data-off-route><Phrases text={fill(pick(S.offRoute, L), 'n', away(live.off.n))} /></p>{/if}
  </div>
  <div class="slot" class:shown={slot && slot !== 'off'} class:fork={slot === 'fork'} role="status" data-top-slot={slot && slot !== 'off' ? slot : undefined}>
    {#if slot === 'toRoute' && live.off}
      <p class="big" data-to-route><Phrases text={fill(pick(S.toRoute, L), 'n', away(live.off.n))} /></p>
    {:else if slot === 'fork' && live.junction}
      {@const j = live.junction}
      {@const named = j.br.filter((b) => b.name || b.take)}
      <div class="big" data-junction aria-hidden="true">{shown}</div>
      <span class="sr-only">{said}</span>
      {#if named.length}
        <div class="names" data-junction-names>{#each named as b, k (k)}{#if k}<span class="sep">{' / '}</span>{/if}<span class:take={b.take}>{#if b.take}<i class="mark" aria-hidden="true"></i>{#if b.name}<span class="sr-only">{pick(S.thisRoute, L)}：</span>{/if}{/if}{#if b.dir}{pick(S[DIR[b.dir]], L)}：{/if}{b.name ?? pick(S.thisRoute, L)}</span>{/each}</div>
      {/if}
    {:else if slot === 'back'}
      <p class="big" data-back-on-route><Phrases text={pick(S.backOnRoute, L)} /></p>
    {:else if slot === 'loc'}
      {@const [what, where] = MS.refused[L].split('\n')}
      <p data-loc-denied><Phrases text={what} /></p>
      <p class="where"><Phrases text={where} /></p>
    {:else if slot === 'compass'}
      <p data-compass-denied><Phrases text={pick(S.compassDenied, L)} /></p>
      <p class="where"><Phrases text={pick(S.compassWhere, L)} /></p>
    {:else if slot === 'calib'}
      <p data-calib><Phrases text={pick(S.compassCalib, L)} /></p>
    {/if}
  </div>
</div>

<style>
  .top-slot { position: absolute; z-index: 560; left: calc(10px + var(--safe-left)); right: calc(62px + var(--safe-right)); pointer-events: none; }
  /* (an empty region takes no room and draws nothing; one showing is the card) */
  .slot.shown {
    pointer-events: auto; padding: 10px 14px; background: var(--c-card); color: var(--c-ink); border-radius: var(--r-row); box-shadow: inset 0 0 0 2px var(--c-ink-soft), var(--sh-float);
    font: 600 var(--fs-body)/1.45 var(--font-ui);
  }
  .slot p, .slot div { margin: 0; }
  .slot .big { font: 700 20px/1.3 var(--font-ui); }
  .slot.alert.shown { background: var(--c-coral-text); color: #fff; box-shadow: var(--sh-float); }
  .slot .where { margin-top: 4px; font-size: var(--fs-s); color: var(--c-ink-soft); }
  .slot .names { margin-top: 4px; font-size: var(--fs-body); }
  .slot .names .take { font-weight: 800; color: var(--c-coral-text); }
  .slot .mark { display: inline-block; width: 16px; height: 5px; margin: 0 5px 3px 0; border-radius: 3px; background: var(--c-coral-text); vertical-align: middle; }
  .slot .sep { color: var(--c-ink-soft); }
</style>
