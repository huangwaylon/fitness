<script lang="ts">
  // あそぶ (docs/kikimimi-ux.md §6.2): しまの みち's card on top, then the playable modes grouped by situation (さくっと,
  // まちで・でんわで, じっくり, ねる まえに), a 2-column grid per group: each mode's name, its one-line subtitle, its
  // minutes and 👥 when it can be shared. Only what this build can play shows; an empty group is hidden. Its own chunk.
  import type { Path } from '#lib/kikimimi/path.ts';
  import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
  import { shelves, type ModeId } from '#lib/kikimimi/catalog.ts';
  import { currentReport } from '../progress.svelte.ts';
  import PathCard from '../path/PathCard.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { path, onpath, onmode }: { path: Path | null; onpath: () => void; onmode: (m: ModeId) => void } = $props();
  const report = $derived(currentReport());
  const groups = $derived(shelves({ levels: LEVELS, ladder: LADDER_OK, review: !!report?.games.length }));
  const ICON: Record<ModeId, string> = { quiz: '💬', ladder: '🪜', review: '🔁', announce: '📢' };
</script>

<div class="asobu" data-kiki-page="asobu">
  {#if path && path.stages.some((s) => s.stops.length)}<PathCard {path} onopen={onpath} />{/if}
  {#each groups as g (g.group)}
    <section class="shelf" aria-labelledby="kk-g-{g.group}" data-kiki-group={g.group}>
      <h3 id="kk-g-{g.group}" class="sec-label">{t(`kiki.group.${g.group}`)}<small>{t(`kiki.groupSub.${g.group}`)}</small></h3>
      <div class="grid">
        {#each g.modes as m (m.id)}
          <button type="button" class="mode tile-btn" data-kiki-mode-tile={m.id} data-sfx="open" onclick={() => onmode(m.id)}>
            <span class="ic" aria-hidden="true">{ICON[m.id]}</span>
            <b>{t(`kiki.mode.${m.id}`)}</b>
            <small>{t(`kiki.modeSub.${m.id}`)}</small>
            <span class="meta">{t('kiki.chip.mins', { n: m.mins })}{#if m.coop}<span aria-label={t('kiki.chip.coop')}> · 👥</span>{/if}</span>
          </button>
        {/each}
      </div>
    </section>
  {/each}
</div>

<style>
  .asobu { display: grid; gap: 14px; }
  .shelf { display: grid; gap: 8px; }
  .sec-label small { margin-left: 8px; font-size: var(--fs-xs); letter-spacing: 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .mode { min-height: 112px; padding: 12px; border-radius: var(--r-card); display: grid; align-content: start; justify-items: start; gap: 4px; text-align: left; }
  .ic { font-size: 22px; line-height: 1.1; }
  .mode b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .mode small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .meta { margin-top: auto; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
</style>
