<script lang="ts">
  // ふたりで ロールプレイ's results (docs/kikimimi-mic.md §2.5), its own chunk: しずえ's line; the team's phrases
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
  import Bubble from '../../ui/Bubble.svelte';
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

<div class="results" data-kiki-results data-role-results>
  <Bubble text={line} host="wave" size={64} />
  <div class="team card" data-role-team={said} data-role-of={of}>
    <b>{of ? t('kiki.role.team', { k: said, n: of }) : t('kiki.role.teamNone')}</b>
    <small>🔒 {t('kiki.role.rowNote')}</small>
  </div>

  {#if rows.length}
    <section class="sec" aria-labelledby="kr-list">
      <h3 id="kr-list" class="sec-label">{t('kiki.role.list')}</h3>
      <ul class="list">
        {#each rows as r (`${r.i}:${r.k.ph}`)}
          <li class="row card" data-role-said={r.k.ph} data-ok={r.ok}>
            <span class="sym" aria-hidden="true">{r.ok ? '✓' : '・'}</span>
            <span class="txt"><b lang="en">{r.k.en}</b><small>{r.k.ja}</small></span>
          </li>
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
          <button type="button" class="ib tile-btn" aria-label={t('kiki.role.hear')} data-role-hear={j} data-sfx="tick" onclick={() => game.hear(p.card)}>▶︎</button>
        </div>
        <Transcript it={p.card} talk={game.talk?.i === -1 && game.talk.at === p.card.id ? game.talk.k : -1} from={game.talk?.from ?? null} clock={() => game.clock()} compact />
      </div>
    {/each}
  </section>
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={again}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
  .team { display: grid; justify-items: center; gap: 4px; padding: 14px 16px; text-align: center; background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); }
  .team b { font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--text); }
  .team small { font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .sec { display: grid; gap: 8px; }
  .sec-label small { display: block; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .row { display: grid; grid-template-columns: auto minmax(0, 1fr); align-items: center; gap: 10px; padding: 8px 12px; }
  .sym { font: 700 20px/1.2 var(--font-ui); color: var(--text-soft); }
  .row[data-ok='true'] .sym { color: var(--leaf-text); }
  .txt { display: grid; gap: 1px; min-width: 0; }
  .txt b { font: 700 var(--fs-body)/1.35 var(--font-ui); color: var(--text); }
  .txt small { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .model { display: grid; gap: 8px; padding: 10px 12px; }
  .mh { display: flex; align-items: center; justify-content: space-between; gap: 8px; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .ib { flex: none; width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center; font: 700 18px/1 var(--font-ui); }
</style>
