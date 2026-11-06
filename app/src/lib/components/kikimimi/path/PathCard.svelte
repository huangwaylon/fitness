<script lang="ts">
  // The lobby's way onto しまの みち (docs/kikimimi-ux.md §6.2's path card, in the lobby until the hub is built; the UX
  // review's sketch D): the current unit's host, its name, domain icon and dots, › to the path. Lessons are solo until
  // co-op lessons (framework 8c): in a shared lobby the card stays, quiet, with that note.
  import type { Path } from '#lib/kikimimi/path.ts';
  import { DOMAINS, isDomain } from '#lib/kikimimi/path.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import LessonDots from './LessonDots.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName } from '../scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { path, solo, onopen }: { path: Path; solo: boolean; onopen: () => void } = $props();
  const stops = $derived(path.stages.flatMap((s) => s.stops));
  const cur = $derived(stops.find((s) => s.current) ?? null);
  const stamped = $derived(stops.filter((s) => s.state?.stamped).length);
</script>

<button type="button" class="pathcard" data-kiki-path-open aria-disabled={!solo} data-sfx="open" onclick={() => solo && onopen()}>
  <span class="face" aria-hidden="true">
    {#if cur}<OfficialArt key={villagerArt(cur.host, true)} alt="" size={52} eager />{:else}<span class="ico">🏝️</span>{/if}
  </span>
  <span class="txt">
    <b>{t('kiki.path.title')}</b>
    {#if !solo}<small>{t('kiki.path.soloOnly')}</small>
    {:else if cur}
      <small class="cur">{isDomain(cur.domain) ? DOMAINS[cur.domain].icon : ''} {cur.name}
        <LessonDots lessons={cur.lessons} done={cur.state?.done ?? []} next={cur.next} /></small>
    {:else}<small>{t('kiki.path.stamps', { k: stamped, n: stops.length })}</small>{/if}
  </span>
  <span class="chev" aria-hidden="true">›</span>
</button>

<style>
  .pathcard {
    appearance: none; border: 0; cursor: pointer; width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; min-height: 76px;
    border-radius: var(--r-card); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); font: inherit; text-align: left;
  }
  .pathcard:active:not([aria-disabled="true"]) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .pathcard[aria-disabled="true"] { cursor: default; background: var(--card); box-shadow: var(--sh-lip); }
  .face { flex: none; width: 52px; height: 52px; border-radius: 50%; background: color-mix(in srgb, var(--c-mint) 35%, var(--card)); display: grid; place-items: center; overflow: hidden; line-height: 0; }
  .ico { font-size: 28px; line-height: 1; }
  .txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
  b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  small { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .cur { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; color: var(--text); }
  .chev { font: 700 22px/1 var(--font-ui); color: var(--text-soft); }
  .pathcard[aria-disabled="true"] .chev { visibility: hidden; }
</style>
