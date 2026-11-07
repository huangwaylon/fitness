<script lang="ts">
  // くりかえし チャレンジ's results (docs/kikimimi-mic.md §2.2), its own chunk: しずえ's line, how far the run got
  // (「ここまで 14語！」: the longest sentence said) and how many sentences came through, shown only to you; then the run's
  // sentences, each with ○ / × (– skipped), its Japanese and ▶︎. What was heard isn't here: it went with the round. もういっかい: a new run at the same level, at once.
  import type { QuizGame } from '../game.svelte.ts';
  import { answerOf, reached, saidOk } from '#lib/kikimimi/games/kuri/def.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { jaOf } from './board.ts';
  import Bubble from '../../ui/Bubble.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const rows = $derived(game.items.map((it, i) => {
    const a = answerOf(rawOf(v.answers[i]));
    return { it, i, mark: !a || !a.heard ? 'skip' : saidOk(a) ? 'ok' : 'miss' };
  }));
  const words = $derived(reached(game.items, v.answers.map(rawOf)));
  const said = $derived(rows.filter((r) => r.mark === 'ok').length);
  const line = $derived(t(words >= 12 ? 'kiki.kuri.host.long' : words ? 'kiki.kuri.host.some' : 'kiki.kuri.host.none'));

  /** もういっかい: a new run at this level (solo: it starts at once). */
  function again() {
    const lv = v.lv, timer = v.timer;
    onagain();
    game.setGame('kuri', { lv, timer });
    game.go();
  }
</script>

<div class="results" data-kiki-results data-kuri-results>
  <Bubble text={line} host="wave" size={64} />
  <div class="far card" data-kuri-reached={words}>
    <b>{words ? t('kiki.kuri.reached', { n: words }) : t('kiki.kuri.reachedNone')}</b>
    <span>{t('kiki.kuri.sentences', { k: said, n: rows.length })}</span>
    <small>🔒 {t('kiki.kuri.private')}</small>
  </div>

  <section class="sec" aria-labelledby="kk-kuri-list">
    <h3 id="kk-kuri-list" class="sec-label">{t('kiki.kuri.list')}</h3>
    <ol class="list">
      {#each rows as r (r.i)}
        <li class="row card" data-kuri-row={r.i} data-mark={r.mark}>
          <span class="sym" aria-hidden="true">{r.mark === 'ok' ? '○' : r.mark === 'miss' ? '×' : '–'}</span>
          <div class="txt">
            <p class="en" lang="en">{r.it.en}</p>
            <p class="ja">{jaOf(r.it)}</p>
          </div>
          <button type="button" class="btn small paper hear" aria-label={t('kiki.kuri.hear')} data-kuri-hear={r.i} data-sfx="tick" onclick={() => game.hear(r.it)}>▶︎</button>
        </li>
      {/each}
    </ol>
  </section>
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={again}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
  .far { display: grid; justify-items: center; gap: 4px; padding: 14px 16px; text-align: center; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  .far b { font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--text); }
  .far span { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .far small { font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .sec { display: grid; gap: 8px; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .row { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 10px; padding: 10px 12px; }
  .sym { font: 700 20px/1.2 var(--font-ui); color: var(--coral-text); }
  .row[data-mark='ok'] .sym { color: var(--leaf-text); }
  .row[data-mark='skip'] .sym { color: var(--text-soft); }
  .txt { display: grid; gap: 2px; min-width: 0; }
  .en { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text); overflow-wrap: anywhere; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hear { min-width: var(--hit); min-height: var(--hit); padding: 0 10px; }
</style>
