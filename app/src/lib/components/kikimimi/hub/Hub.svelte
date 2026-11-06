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
  // invite of content this build hasn't offers こうしんする instead), しずえ's line, today's menu (today.ts: おさらい ·
  // きょうの いっぽ · きまぐれ; a done card folds to a stamp, the first undone one has the only green button; any one
  // means 「きょうは OK」), then the four entry tiles (あそぶ · みんなで · ずかん · きろく, each with one live line), the
  // weekend's しずえの しゅうまつ たいかい banner while it's on (Fri 18:00 – Mon 05:00: this weekend's trophy once won; its
  // lobby) and the week card.
  // Every place is one tap from here; ⚙ is the title bar's. Its own chunk.
  import type { Who } from '#lib/types.ts';
  import Host from '../../characters/Host.svelte';
  import { LADDER_OK, LEVELS } from '#lib/kikimimi/deck.ts';
  import { MODE_IDS, placeOfLv, playable, shelves, PLACES } from '#lib/kikimimi/catalog.ts';
  import { stageAt } from '#lib/kikimimi/stages.ts';
  import { isLadderGame } from '#lib/kikimimi/progress.ts';
  import { rechecksDue } from '#lib/kikimimi/stamps.ts';
  import { finished, finishedStory, isNight, pickMenu, type Act, type Card } from '#lib/kikimimi/today.ts';
  import { nextOf, pickSerial } from '#lib/kikimimi/bedtime.ts';
  import { SERIALS, STORY_OK, serialOf, storyProgress } from '../story/serials.svelte.ts';
  import MorningCard from './MorningCard.svelte';
  import { currentOmakase, currentPath, currentPlacement, currentReport, currentUnits } from '../progress.svelte.ts';
  import { weekCard } from '#lib/kikimimi/week.ts';
  import { weekGoal } from '../prefs.ts';
  import WeekCard from './WeekCard.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { jst, now } from '#lib/time/clock.ts';
  import { taikaiAt } from '#lib/kikimimi/games/taikai/window.ts';
  import { trophiesOf } from '#lib/kikimimi/games/taikai/def.ts';
  import { MEDAL } from '../look.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** Who else has the island open (みんなで's line). */
    here: readonly Who[];
    me: Who;
    invite?: HubInvite | null;
    onjoin: (g: string) => void;
    onupdate: () => void;
    ontile: (k: Tile) => void;
    /** A menu card's play. */
    onact: (a: Act) => void;
    /** The たいかい banner: its lobby. */
    ontaikai: () => void;
    /** The みみ チェック card: the check, at once. */
    oncheck: () => void;
  }
  let { here, me, invite = null, onjoin, onupdate, ontile, onact, ontaikai, oncheck }: Props = $props();
  const TILES: readonly { k: Tile; icon: string }[] = [
    { k: 'asobu', icon: '🎧' },
    { k: 'together', icon: '👥' },
    { k: 'zukan', icon: '📖' },
    { k: 'record', icon: '🌱' }
  ];

  const report = $derived(currentReport());
  const hour = jst().hour;
  const greet = t(hour < 5 || hour >= 18 ? 'kiki.hub.evening' : hour < 11 ? 'kiki.hub.morning' : 'kiki.hub.day');
  const stage = $derived(report?.stats.level == null ? null : stageAt(report.stats.level));
  /** Today's quiz: おまかせ's level (みみ チェック's placed one, else my comfortable one, else はまべ 2). */
  const lv = $derived(currentOmakase());
  /** No みみ チェック yet: its card (the first run put off, or a player from before it). */
  const unplaced = $derived(!!report && !currentPlacement());
  const placeOf = (x: number) => PLACES.find((p) => p.id === placeOfLv(x));
  const path = $derived(currentPath());
  const stops = $derived(path.stages.flatMap((s) => s.stops));
  const cur = $derived(stops.find((s) => s.current) ?? null);
  const ctx = $derived({ levels: LEVELS, ladder: LADDER_OK, review: !!report?.games.length, story: STORY_OK });
  /** After 21:00 きまぐれ is おやすみ ものがたり (today.ts isNight); by day the morning card may ask about last night's. */
  const night = isNight(hour) && STORY_OK;
  /** Tonight's story: the serial to go on with and its chapter (bedtime.ts pickSerial, nextOf). */
  const tonight = $derived.by(() => {
    const progress = storyProgress(me), unit = pickSerial(progress, SERIALS.map((s) => ({ unit: s.unit, chapters: s.chapters.length })));
    const s = unit ? serialOf(unit) : undefined;
    return s ? { name: s.name, ch: nextOf(progress[s.unit], s.chapters.length).ch } : null;
  });
  const menu = $derived(
    report
      ? pickMenu({
          day: report.today, due: report.due, recheck: rechecksDue(currentUnits(), report.today)[0] ?? null,
          next: cur ? { unit: cur.id, lesson: cur.next } : null, lv,
          whims: MODE_IDS.filter((m) => m !== 'review' && m !== 'story' && m !== 'taikai' && playable(m, ctx)), night,
          sessions: [
            ...report.games.filter((g) => g.d === report.today && finished(g.r.length)).map((g) => ({ at: g.at, p: g.p, u: g.u, ladder: isLadderGame(g), lv: g.lv })),
            ...report.stories.filter((s) => s.d === report.today && finishedStory(s.ms)).map((s) => ({ at: s.at, p: false, ladder: false, lv: 4, story: true }))
          ].sort((a, b) => a.at - b.at)
        })
      : null
  );
  const weekly = $derived(
    report
      ? weekCard({
          today: report.today, me, goal: weekGoal(), others: report.others,
          mine: [...report.games.map((g) => ({ d: g.d, n: g.r.length, ms: g.ms })), ...report.stories.map((s) => ({ d: s.d, n: 0, ms: s.ms, story: true }))]
        })
      : null
  );
  /** The weekend's tournament (window.ts: on Fri 18:00 – Mon 05:00) and the trophy I've won in it (my best). */
  const weekend = taikaiAt(now().getTime());
  const won = $derived(weekend.open && report ? (trophiesOf(report.games).get(weekend.fri) ?? null) : null);
  const hello = $derived(menu?.all ? t('kiki.hub.enough') : greet);
  const firstOpen = $derived(menu?.cards.find((c) => !c.done) ?? null);
  const unitName = (id: string) => stops.find((s) => s.id === id)?.name ?? '';
  /** A card's title and line. */
  function words(c: Card): { title: string; line: string } {
    const a = c.act;
    if (!a) return { title: t('kiki.menu.allDone'), line: '' };
    switch (a.k) {
      case 'review': return { title: t('kiki.review.picked', { n: a.n }), line: t('kiki.chip.mins', { n: 3 }) };
      case 'recheck': return { title: t('kiki.lesson.recheck'), line: `${unitName(a.unit)}・${t('kiki.chip.mins', { n: 2 })}` };
      case 'lesson': return { title: unitName(a.unit), line: `${t(`kiki.lesson.${a.lesson}`)}・${t('kiki.chip.mins', { n: 2 })}` };
      case 'quiz': {
        const p = placeOf(a.lv);
        return { title: t('kiki.mode.quiz'), line: `${p ? `${t(`kiki.stage.${p.id}`)} ${'★'.repeat(p.stars)}・` : ''}${t('kiki.chip.qs', { n: 8 })}・${t('kiki.chip.mins', { n: 4 })}` };
      }
      case 'mode': return { title: t(`kiki.mode.${a.m}`), line: t(`kiki.modeSub.${a.m}`) };
      case 'story': return { title: t('kiki.mode.story'), line: tonight ? `${tonight.name}・${t('kiki.story.chapter', { n: tonight.ch })}` : t('kiki.modeSub.story') };
    }
  }
  const others = $derived(here.filter((w) => w !== me));
  const modes = $derived(shelves(ctx).reduce((n, s) => n + s.modes.length, 0));
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
  {#if menu}
    <ol class="menu" data-kiki-menu data-kiki-ok={menu.ok ? 'true' : undefined}>
      {#each menu.cards as c (c.slot)}
        {@const w = words(c)}
        <li class="mc card" class:done={c.done} class:next={c === firstOpen} data-kiki-card={c.slot} data-kiki-done={c.done || undefined}>
          <span class="txt">
            <small class="slot">{t(`kiki.menu.${c.slot}`)}</small>
            <b>{w.title}</b>
            {#if w.line && !c.done}<small>{w.line}</small>{/if}
          </span>
          {#if c.done}<span class="stamp" aria-label={t('kiki.menu.doneLabel')}>✓</span>
          {:else if c.act}
            <button type="button" class="btn small" class:paper={c !== firstOpen} data-kiki-card-go={c.slot} data-sfx="confirm" onclick={() => onact(c.act!)}>{t('kiki.startSolo')}</button>
          {/if}
        </li>
      {/each}
    </ol>
    {#if !night}<MorningCard {me} today={report!.today} />{/if}
    <p class="ok" data-kiki-ok-line>{t(menu.all ? 'kiki.menu.all' : menu.ok ? 'kiki.menu.ok' : 'kiki.menu.hint')}</p>
  {/if}
  {#if unplaced}
    <div class="check card" data-kiki-check-card>
      <span class="ear" aria-hidden="true">👂</span>
      <span class="ctxt"><b>{t('kiki.check.title')}</b><small>{t('kiki.check.card')}</small></span>
      <button type="button" class="btn small paper" data-kiki-check-start data-sfx="confirm" onclick={oncheck}>{t('kiki.startSolo')}</button>
    </div>
  {/if}
  <nav class="tiles" aria-label={t('kiki.title')}>
    {#each TILES as tile (tile.k)}
      <button type="button" class="tile tile-btn" data-kiki-tile={tile.k} data-sfx="open" onclick={() => ontile(tile.k)}>
        <span class="ic" aria-hidden="true">{tile.icon}</span>
        <b>{t(`kiki.tile.${tile.k}`)}</b>
        <small>{lines[tile.k]}</small>
      </button>
    {/each}
  </nav>
  {#if weekend.open && LEVELS.some((x) => x !== 5)}
    <button type="button" class="taikai tile-btn" data-kiki-taikai={won ?? 'open'} data-sfx="open" onclick={ontaikai}>
      <span class="cup" aria-hidden="true">{won ? MEDAL[won] : '🏆'}</span>
      <span class="ttxt">
        <b>{t('kiki.mode.taikai')}</b>
        <small>{won ? t('kiki.taikai.won', { trophy: t(`kiki.trophy.${won}`) }) : t('kiki.taikai.open')}</small>
        <small class="until">{won ? t('kiki.taikai.again') : t('kiki.taikai.until')}</small>
      </span>
      <span class="chev" aria-hidden="true">›</span>
    </button>
  {/if}
  {#if weekly}<WeekCard card={weekly} />{/if}
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
  .menu { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .mc { display: flex; align-items: center; gap: 12px; padding: 12px 14px; min-height: 76px; box-sizing: border-box; }
  /* the next one: green-edged; a done one folds to a line and its stamp */
  .mc.next { box-shadow: var(--sh-lip), inset 0 0 0 2px var(--c-leaf); }
  .mc.done { min-height: 52px; padding: 8px 14px; background: color-mix(in srgb, var(--card) 70%, transparent); box-shadow: none; }
  .mc .txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .mc b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .mc.done b { font-size: var(--fs-body); color: var(--text-soft); }
  .mc small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .mc .slot { font-size: var(--fs-xs); letter-spacing: .04em; }
  .mc .btn { flex: none; margin-bottom: var(--lip-h); }
  .stamp {
    flex: none; width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; transform: rotate(-8deg);
    font: 700 20px/1 var(--font-ui); color: var(--c-coral-text); box-shadow: inset 0 0 0 2px var(--c-coral);
  }
  .ok { margin: -4px 6px 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* みみ チェック not taken yet: a small card, never the green button (the menu's) */
  .check { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
  .ear { flex: none; font-size: 24px; line-height: 1; }
  .ctxt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .ctxt b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .ctxt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .check .btn { flex: none; margin-bottom: var(--lip-h); }
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
  /* しずえの しゅうまつ たいかい: the weekend's yuzu banner (a ribbon of the show), its trophy once won */
  .taikai {
    display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: var(--r-card); text-align: left; width: 100%;
    background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-yuzu) 80%, var(--c-lip)), 0 var(--lip-h) 0 var(--c-lip);
  }
  .cup {
    flex: none; width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; font-size: 28px; line-height: 1;
    background: var(--c-card); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-yuzu) 70%, var(--c-lip));
  }
  .ttxt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .ttxt b { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ttxt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink-soft); }
  .ttxt .until { font-size: var(--fs-xs); }
  .chev { flex: none; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); }
</style>
