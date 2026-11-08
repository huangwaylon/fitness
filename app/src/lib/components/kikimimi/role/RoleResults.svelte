<script lang="ts">
  // ふたりで ロールプレイ's results (docs/kikimimi-mic.md "ふたりで ロールプレイ"), its own chunk: しずえ's line; the team's phrases
  // (「ふたりで k / n フレーズ」: the players' running totals added up, never one person's), with the row's privacy line;
  // the scene's key phrases, each ✓ where it came through on the turn this phone saw (mine as I said them, the
  // partner's at their reveals), with its Japanese; then お手本, each part's dialogue by the villagers (▶︎, its karaoke:
  // Transcript). おわる / もういっかい (the host: the same scene again; another back to the invite).
  import type { QuizGame } from '../game.svelte.ts';
  import { phrasesIn, roundsOf, saidOf, teamSaid, type RoleCard } from '#lib/kikimimi/games/role/def.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { partsOf, saidAt } from './board.ts';
  import { playAgain } from '../listenView.ts';
  import Transcript from '../Transcript.svelte';
  import ResultsShell from '../frame/ResultsShell.svelte';
  import ScoreCard from '../frame/ScoreCard.svelte';
  import LineRow from '../frame/LineRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as RoleCard[]);
  const of = $derived(phrasesIn(roundsOf(cards)));
  const said = $derived(teamSaid(v.scores, of));
  /** Each turn's key phrases, ✓ where seen said: my own answer (a listener's ack says nothing), else as seen at its
   *  reveal (null: this phone didn't see it). */
  const rows = $derived(cards.flatMap((c, i) => {
    const m = saidOf(rawOf(v.answers[i]))?.mask ?? saidAt(v.g ?? '', i);
    return c.turn.keys.map((k, j) => ({ k, i, ok: m === null ? null : (m & (1 << j)) !== 0 }));
  }));
  const line = $derived(t(of && said >= of ? 'kiki.role.host.all' : said * 2 >= of ? 'kiki.role.host.some' : 'kiki.role.host.few'));
  const parts = $derived(partsOf(cards));
  const again = () => playAgain(game, 'role', onagain);
</script>

<ResultsShell {line} {ondone} onagain={again} data-role-results>
  <ScoreCard data-role-team={said} data-role-of={of} note={t('kiki.role.rowNote')}>
    <b class="big">{of ? t('kiki.role.team', { k: said, n: of }) : t('kiki.role.teamNone')}</b>
  </ScoreCard>

  {#if rows.length}
    <section class="sec" aria-labelledby="kr-list">
      <h3 id="kr-list" class="sec-label">{t('kiki.role.list')}</h3>
      <ul class="list">
        {#each rows as r (`${r.i}:${r.k.ph}`)}
          <LineRow data-role-said={r.k.ph} data-ok={r.ok} sym={r.ok ? '✓' : '・'} tone={r.ok ? 'ok' : 'soft'} en={r.k.en} ja={r.k.ja} />
        {/each}
      </ul>
    </section>
  {/if}

  <section class="sec" aria-labelledby="kr-model">
    <h3 id="kr-model" class="sec-label">{t('kiki.role.model')}<small>{t('kiki.role.modelSub')}</small></h3>
    {#each parts as p, j (p.card.id)}
      <div class="model card" data-role-model={j}>
        <div class="mh">
          <span>{t('kiki.role.part', { k: j + 1 })}{p.card.ctx ? `・${p.card.ctx}` : ''}</span>
          <HearButton data-role-hear={j} onclick={() => game.hear(p.card)} />
        </div>
        <Transcript it={p.card} talk={game.talk?.i === -1 && game.talk.at === p.card.id ? game.talk.k : -1} from={game.talk?.from ?? null} clock={() => game.clock()} compact />
      </div>
    {/each}
  </section>
</ResultsShell>

<style>
  .sec { display: grid; gap: 8px; }
  .sec-label small { display: block; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .model { display: grid; gap: 8px; padding: 10px 12px; }
  .mh { display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
