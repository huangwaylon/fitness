<script lang="ts">
  // A game's results (docs/kikimimi.md "Results"; framework §5 Results), in the shell every game's results share
  // (frame/ResultsShell: しずえ reads them out like the morning broadcast, 終わる / もう一度遊ぶ): the headline card
  // (frame/ScoreCard: solo how many I got right; co-op, the default with several players, the team's 「ふたりで 7/8」 and
  // 「そろって正解」 over mine, no ranking, no one's points; a game's own lines in it, `more`; my 一発 stamp), a game's
  // strip (`top`: a lesson's), たいせん's ranking (the winner's row with 🏆; しずえ names the winner, or a tie), then the
  // game's sections (`children`: feedback, the review list). Any game's.
  import type { Snippet } from 'svelte';
  import type { Who } from '#lib/types.ts';
  import type { Team } from '#lib/kikimimi/round/tally.ts';
  import ResultsShell from './ResultsShell.svelte';
  import ScoreCard from './ScoreCard.svelte';
  import FirstStamp from './FirstStamp.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  let { v, tally, of, firsts, line, top, more, children, ondone, onagain }: {
    v: { players: { who: Who; score: number }[]; vs: boolean; n: number; team: Team };
    /** My rounds right, of how many. */
    tally: number;
    of: number;
    /** My first listens (一発). */
    firsts: number;
    /** しずえ's line, when the game has its own (スピード はしご's climb). */
    line?: string;
    /** A game's strip under the headline card (a lesson's, the trophy). */
    top?: Snippet;
    /** A game's own lines in the headline card (the customers served, the errands done). */
    more?: Snippet;
    children: Snippet;
    ondone: () => void;
    onagain: () => void;
  } = $props();
  /** Highest first; ties share a rank. */
  const ranking = $derived.by(() => {
    const rows = [...v.players].sort((a, b) => b.score - a.score);
    return rows.map((p) => ({ ...p, rank: rows.findIndex((q) => q.score === p.score) + 1 }));
  });
  /** Co-op (several players, not たいせん): the team's tally, no ranking and no one's points. */
  const coop = $derived(v.players.length > 1 && !v.vs);
  const teamKey = $derived(v.players.length >= 3 ? 'kiki.team.3' : 'kiki.team.2');
  const said = $derived.by(() => {
    if (line) return line;
    if (ranking.length <= 1) return t('kiki.hostSolo');
    if (coop) return t(v.team.right >= v.n ? 'kiki.hostTeam.all' : v.team.right * 4 >= v.n * 3 ? 'kiki.hostTeam.good' : 'kiki.hostTeam.try');
    const first = ranking.filter((r) => r.rank === 1);
    return first.length > 1 || !week.view ? t('kiki.hostTie') : t('kiki.hostTop', { name: villagerNameOf(week.view, first[0].who) });
  });
</script>

<ResultsShell line={said} {ondone} {onagain}>
  <ScoreCard data-kiki-team={coop ? v.team.right : undefined}>
    {#if coop}
      <b class="big">{t(teamKey, { k: v.team.right, n: v.n })}</b>
      {#if v.team.all}<span class="sub" data-kiki-team-all={v.team.all}>{t('kiki.teamAll', { k: v.team.all })}</span>{/if}
      <span class="sub" data-kiki-tally={tally}>{t('kiki.tallyMine', { n: of, k: tally })}</span>
    {:else}<b class="big" data-kiki-tally={tally}>{t('kiki.tally', { n: of, k: tally })}</b>{/if}
    {@render more?.()}
    {#if firsts}<FirstStamp text={t('kiki.firstCount', { k: firsts })} data-kiki-firsts={firsts} />{/if}
  </ScoreCard>

  {@render top?.()}

  <!-- たいせん: the ranking first (the game's outcome), then my feedback -->
  {#if ranking.length > 1 && !coop}
    <ol class="rank card">
      {#each ranking as r (r.who)}
        <li data-rank={r.rank} class:first={r.rank === 1}>
          <span class="no" class:top={r.rank === 1}>{#if r.rank === 1}<span class="cup" aria-hidden="true">🏆</span>{/if}{t('kiki.rank', { n: r.rank })}</span>
          <PlayerChip who={r.who} state={r.rank === 1 ? 'right' : null} size={44} />
          <b class="pts">{t('kiki.points', { n: r.score })}</b>
        </li>
      {/each}
    </ol>
  {/if}

  {@render children()}
</ResultsShell>

<style>
  .rank { list-style: none; margin: 0; padding: 8px 14px; display: grid; gap: 4px; }
  .rank li { display: grid; grid-template-columns: 4.2em auto 1fr; align-items: center; gap: 10px; }
  /* the winner's row: a ribbon of yuzu behind it, the cup by the rank */
  .rank li.first { margin: 0 -8px; padding: 2px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 40%, transparent); }
  .cup { margin-right: 2px; font-size: .85em; }
  .no { font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); white-space: nowrap; }
  .no.top { color: var(--coral-text); font-size: var(--fs-title); }
  .rank :global(.pc) { grid-auto-flow: column; justify-items: start; align-items: center; max-width: none; gap: 10px; }
  .pts { justify-self: end; font: 700 var(--fs-talk)/1 var(--font-num); }
</style>
