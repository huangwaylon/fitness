<script module lang="ts">
  export type Tile = 'asobu' | 'together' | 'zukan' | 'record';
  /** The invite card's: the game, who asks, what (the mode or a unit's lesson), whether this build can't play it. */
  export interface HubInvite {
    g: string;
    name: string;
    what: string;
    blocked: boolean;
  }
</script>

<script lang="ts">
  // ききみみ's hub, the sheet's root (docs/kikimimi-ux.md §6.1): an invite on top while one waits (さんか joins it; an
  // invite of content this build hasn't offers こうしんする instead), しずえ's line, today's card, then the four entry
  // tiles (あそぶ · みんなで · ずかん · きろく, each with one live line). Every place is one tap from here; ⚙ is the title
  // bar's. Its own chunk.
  import type { Who } from '#lib/types.ts';
  import Host from '../../characters/Host.svelte';
  import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
  import { levelAt } from '#lib/kikimimi/bank.ts';
  import { placeOfLv, shelves, PLACES } from '#lib/kikimimi/catalog.ts';
  import { stageAt } from '#lib/kikimimi/stages.ts';
  import { currentReport } from '../progress.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { jst } from '#lib/time/clock.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** Who else has the island open (みんなで's line). */
    here: readonly Who[];
    me: Who;
    invite?: HubInvite | null;
    onjoin: (g: string) => void;
    onupdate: () => void;
    ontile: (k: Tile) => void;
    /** Today's card: the quiz at my place. */
    onquiz: (lv: number) => void;
  }
  let { here, me, invite = null, onjoin, onupdate, ontile, onquiz }: Props = $props();
  const TILES: readonly { k: Tile; icon: string }[] = [
    { k: 'asobu', icon: '🎧' },
    { k: 'together', icon: '👥' },
    { k: 'zukan', icon: '📖' },
    { k: 'record', icon: '🌱' }
  ];

  const report = $derived(currentReport());
  const hour = jst().hour;
  const hello = t(hour < 5 || hour >= 18 ? 'kiki.hub.evening' : hour < 11 ? 'kiki.hub.morning' : 'kiki.hub.day');
  const stage = $derived(report?.stats.level == null ? null : stageAt(report.stats.level));
  /** Today's quiz: my comfortable level (はまべ 1 before any data), one this build offers. */
  const lv = $derived.by(() => {
    const want = levelAt(Math.min(6, Math.max(1, Math.round(report?.stats.level ?? 1))));
    return LEVELS.includes(want) ? want : (LEVELS.find((x) => x !== 5) ?? 1);
  });
  const place = $derived(PLACES.find((p) => p.id === placeOfLv(lv)));
  const others = $derived(here.filter((w) => w !== me));
  const modes = $derived(shelves({ levels: LEVELS, ladder: LADDER_OK, review: !!report?.games.length }).reduce((n, s) => n + s.modes.length, 0));
  const lines = $derived<Record<Tile, string>>({
    asobu: t('kiki.tile.asobuLine', { n: modes }),
    together: others.length && week.view ? t('kiki.tile.togetherHere', { name: villagerNameOf(week.view, others[0]) }) : t('kiki.tile.togetherAlone'),
    zukan: t('kiki.tile.zukanLine'),
    record: stage ? `${t(`kiki.stage.${stage.id}`)} ${'★'.repeat(stage.stars)}` : t('kiki.tile.recordNone')
  });
</script>

<div class="hub" data-kiki-page="hub">
  {#if invite}
    <div class="invite card" data-kiki-invite={invite.g} data-kiki-blocked={invite.blocked ? 'update' : undefined}>
      <p class="say">{t('kiki.invited', { name: invite.name })}<small>{invite.what}</small></p>
      {#if invite.blocked}
        <!-- newer content than this build's (its cv): the update, through the app's reload path -->
        <p class="update" data-kiki-update-note>{t('kiki.update')}</p>
        <button type="button" class="btn small" data-kiki-update data-sfx="confirm" onclick={onupdate}>{t('kiki.update.now')}</button>
      {:else}
        <button type="button" class="btn small" data-kiki-join data-sfx="confirm" onclick={() => onjoin(invite.g)}>{t('kiki.join')}</button>
      {/if}
    </div>
  {/if}
  <div class="hello">
    <span class="host" aria-hidden="true"><Host head size={48} animate={false} eager /></span>
    <p data-kiki-hello>{hello}</p>
  </div>
  <div class="card today" data-kiki-today>
    <span class="txt">
      <small>{t('kiki.hub.today')}</small>
      <b>{t('kiki.mode.quiz')}</b>
      <small>{#if place}{t(`kiki.stage.${place.id}`)} {'★'.repeat(place.stars)}{' · '}{/if}{t('kiki.chip.qs', { n: 8 })}・{t('kiki.chip.mins', { n: 4 })}</small>
    </span>
    <button type="button" class="btn small" data-kiki-today-go data-sfx="confirm" onclick={() => onquiz(lv)}>{t('kiki.startSolo')}</button>
  </div>
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
  .invite { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px 12px; padding: 12px 14px; box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-coral); }
  .invite .update { grid-column: 1 / -1; margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--coral-text); }
  .say { margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .say small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .hello { display: flex; align-items: center; gap: 12px; padding: 4px 6px; }
  .hello p { margin: 0; font: 700 var(--fs-body)/1.45 var(--font-ui); }
  .host { flex: none; line-height: 0; }
  .today { display: flex; align-items: center; gap: 12px; padding: 12px 14px; box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-leaf); }
  .today .txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .today b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .today small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  /* the four entry tiles: one row in the thumb's arc, each ≥ 84 × 92 */
  .tiles { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
  .tile {
    min-height: 96px; padding: 10px 4px 8px; border-radius: var(--r-card); display: grid; justify-items: center; align-content: start; gap: 4px;
    text-align: center;
  }
  .ic {
    width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-size: 20px; line-height: 1;
    background: color-mix(in srgb, var(--c-mint) 35%, var(--card));
  }
  .tile b { font: 700 var(--fs-body)/1.15 var(--font-ui); }
  .tile small { font: 700 var(--fs-xs)/1.25 var(--font-ui); color: var(--text-soft); overflow-wrap: anywhere; }
</style>
