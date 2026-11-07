<script lang="ts">
  // まねっこ シャドーイング's end (docs/kikimimi-mic.md §2.1), its own chunk: しずえ's word (no score, no tally), the lines
  // I said, each with ▶︎ to hear it again and its Japanese, that only my minutes are kept, and おわる / もういっかい (4 new
  // lines at the same level, at once).
  import '#lib/i18n/kiki-mane.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { lineJa } from '#lib/kikimimi/games/mane/def.ts';
  import Bubble from '../../ui/Bubble.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);

  function again() {
    const lv = v.lv, timer = v.timer;
    onagain();
    game.setGame('mane', { lv, timer });
    game.go();
  }
</script>

<div class="results" data-kiki-results data-mane-results>
  <Bubble text={t('kiki.mane.host')} host="wave" size={64} />
  <section class="lines card" aria-labelledby="mane-lines">
    <h3 id="mane-lines" class="sec-label">{t('kiki.mane.lines')}</h3>
    <ul>
      {#each game.items as it (it.id)}
        <li data-mane-line={it.id}>
          <button type="button" class="play" aria-label={t('kiki.mane.hear')} data-sfx="tick" onclick={() => game.hear(it)}>▶︎</button>
          <span><b lang="en">{it.en}</b><small>{lineJa(it)}</small></span>
        </li>
      {/each}
    </ul>
  </section>
  <p class="hint">{t('kiki.mane.row')}</p>
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={again}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
  .lines { display: grid; gap: 8px; padding: 12px 14px; }
  .lines h3 { margin: 0; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
  li { display: grid; grid-template-columns: var(--hit) 1fr; align-items: center; gap: 10px; }
  .play { width: var(--hit); height: var(--hit); border: 0; border-radius: 50%; background: var(--ctl-off); color: var(--text); font: 700 var(--fs-body)/1 var(--font-ui); cursor: pointer; }
  li span { display: grid; gap: 2px; }
  li b { font: 700 var(--fs-body)/1.4 var(--font-ui); }
  li small { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .hint { margin: 0 4px; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
