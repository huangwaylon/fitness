<script lang="ts">
  // The lobby's way onto しまの みち (docs/kikimimi-ux.md §6.2's path card, in the lobby until the hub is built; the UX
  // review's sketch D): the current unit's host, its name, domain icon and dots, › to the path. In a shared lobby the
  // host picks a unit's lesson there for everyone (a co-op lesson, docs/curriculum-units.md §4).
  import type { Path } from '#lib/kikimimi/path.ts';
  import { domainIcon } from '../look.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import LessonDots from './LessonDots.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { path, onopen }: { path: Path; onopen: () => void } = $props();
  const stops = $derived(path.stages.flatMap((s) => s.stops));
  const cur = $derived(stops.find((s) => s.current) ?? null);
  const stamped = $derived(stops.filter((s) => s.state?.stamped).length);
</script>

<button type="button" class="pathcard tile-btn" data-kiki-path-open data-sfx="open" onclick={onopen}>
  <span class="face" aria-hidden="true">
    {#if cur}<OfficialArt key={villagerArt(cur.host, true)} alt="" size={52} eager />{:else}<span class="ico">🏝️</span>{/if}
  </span>
  <span class="txt">
    <b>{t('kiki.path.title')}</b>
    {#if cur}
      <small class="cur">{domainIcon(cur.domain)} {cur.name}
        <LessonDots lessons={cur.lessons} done={cur.state?.done ?? []} next={cur.next} /></small>
    {:else}<small>{t('kiki.path.stamps', { k: stamped, n: stops.length })}</small>{/if}
  </span>
  <span class="chev" aria-hidden="true">›</span>
</button>

<style>
  .pathcard { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 14px; min-height: 76px; border-radius: var(--r-card); text-align: left; }
  .face { flex: none; width: 52px; height: 52px; border-radius: 50%; background: color-mix(in srgb, var(--c-mint) 35%, var(--card)); display: grid; place-items: center; overflow: hidden; line-height: 0; }
  .ico { font-size: 28px; line-height: 1; }
  .txt { flex: 1; min-width: 0; display: grid; gap: 4px; }
  b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  small { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .cur { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; color: var(--text); }
  .chev { font: 700 22px/1 var(--font-ui); color: var(--text-soft); }
</style>
