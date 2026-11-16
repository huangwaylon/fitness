<script module lang="ts">
  export type Tile = 'asobu' | 'record';
</script>

<script lang="ts">
  // ききみみ's hub, the sheet's root (docs/kikimimi.md "The hub"): the hour's hello and the two entry tiles (あそぶ, with
  // how many modes it has, and きろく). Every place is one tap from here; ⚙ is the title bar's. Its own chunk.
  import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
  import { shelves } from '#lib/kikimimi/catalog.ts';
  import { LANES } from '#lib/kikimimi/round/registry.ts';
  import { STORY_OK } from '../story/serials.svelte.ts';
  import { currentReport } from '../progress.svelte.ts';
  import { jst } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';

  let { ontile }: { ontile: (k: Tile) => void } = $props();
  const TILES: readonly { k: Tile; icon: string }[] = [
    { k: 'asobu', icon: '🎧' },
    { k: 'record', icon: '🌱' }
  ];

  const report = $derived(currentReport());
  const hour = jst().hour;
  const hello = t(hour < 5 || hour >= 18 ? 'kiki.hub.evening' : hour < 11 ? 'kiki.hub.morning' : 'kiki.hub.day');
  const ctx = $derived({ levels: LEVELS, ladder: LADDER_OK, review: !!report?.games.length, story: STORY_OK, games: (gm: string) => LANES.ready(gm) });
  const modes = $derived(shelves(ctx).reduce((n, s) => n + s.modes.length, 0));
  const lines = $derived<Record<Tile, string>>({ asobu: t('kiki.tile.asobuLine', { n: modes }), record: t('kiki.tile.recordLine') });
</script>

<div class="hub" data-kiki-page="hub">
  <p class="hello kana" data-kiki-hello>{hello}</p>
  <nav class="tiles" aria-label={t('kiki.title')}>
    {#each TILES as tile (tile.k)}
      <button type="button" class="tile tile-btn" data-kiki-tile={tile.k} data-sfx="open" onclick={() => ontile(tile.k)}>
        <span class="ic" aria-hidden="true">{tile.icon}</span>
        <b>{t(`kiki.tile.${tile.k}`)}</b>
        <small>{lines[tile.k]}</small>
      </button>
    {/each}
  </nav>
</div>

<style>
  .hub { display: grid; gap: 14px; }
  .hello { margin: 0; padding: 4px 6px; font: 700 var(--fs-body)/1.45 var(--font-ui); }
  /* the entry tiles: one row in the thumb's arc */
  .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
  .tile {
    min-height: 96px; padding: 10px 4px 8px; border-radius: var(--r-card); display: grid; justify-items: center; align-content: start; gap: 4px;
    text-align: center;
  }
  .ic {
    width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; line-height: 1;
    background: color-mix(in srgb, var(--c-mint) 35%, var(--card));
  }
  .tile b { font: 700 var(--fs-body)/1.15 var(--font-ui); }
  .tile small { font: 700 var(--fs-s)/1.25 var(--font-ui); color: var(--text-soft); overflow-wrap: anywhere; }
</style>
