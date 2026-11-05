<script lang="ts">
  // ききみみ クイズ's results (docs/kikimimi.md "Results"): しずえ reads them out like the morning broadcast (the ranking,
  // with reactions), then the review list, the game's main learning moment: every sentence's English (its key words
  // marked) and Japanese, ▶︎ and 🐢 (levels 1-2), ○ / × for my answer, and 「まちがえた だけ」 to show only the missed.
  import type { QuizGame } from './game.svelte.ts';
  import type { Who } from '#lib/types.ts';
  import { PIC_JA, type Item } from '#lib/kikimimi/bank.ts';
  import Bubble from '../ui/Bubble.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const items = $derived(game.items);
  /** Highest first; ties share a rank. */
  const ranking = $derived.by(() => {
    const rows = [...v.players].sort((a, b) => b.score - a.score);
    return rows.map((p) => ({ ...p, rank: rows.findIndex((q) => q.score === p.score) + 1 }));
  });
  const nameOf = (w: Who) => {
    const view = week.view;
    return !view ? '' : w === 'G' ? view.guest.villagerName : view.people[w].villagerName;
  };
  const line = $derived.by(() => {
    if (ranking.length <= 1) return t('kiki.hostSolo', { score: ranking[0]?.score ?? 0 });
    const top = ranking.filter((r) => r.rank === 1);
    return top.length > 1 ? t('kiki.hostTie') : t('kiki.hostTop', { name: nameOf(top[0].who) });
  });
  const ok = (i: number) => !!v.answers[i] && v.answers[i]!.k === items[i]?.answer;
  let missedOnly = $state(false);
  const rows = $derived(items.map((it, i) => ({ it, i, ok: ok(i) })).filter((r) => !missedOnly || !r.ok));
  const answerText = (it: Item) => (it.type === 'pic' ? (PIC_JA[it.choices[it.answer]] ?? '') : it.choices[it.answer]);
  function split(it: Item) {
    const f = it.focus, at = f ? it.en.indexOf(f) : -1;
    return at < 0 || !f ? [it.en, '', ''] : [it.en.slice(0, at), f, it.en.slice(at + f.length)];
  }
</script>

<div class="results" data-kiki-results>
  <Bubble text={line} host="wave" size={64} />

  {#if ranking.length > 1}
    <ol class="rank card">
      {#each ranking as r (r.who)}
        <li data-rank={r.rank}>
          <span class="no" class:top={r.rank === 1}>{t('kiki.rank', { n: r.rank })}</span>
          <PlayerChip who={r.who} state={r.rank === 1 ? 'right' : null} size={44} />
          <b class="pts">{t('kiki.points', { n: r.score })}</b>
        </li>
      {/each}
    </ol>
  {/if}

  <section class="sec" aria-labelledby="kk-review">
    <div class="rev-head">
      <h3 id="kk-review" class="sec-label">{t('kiki.review')}</h3>
      <button type="button" class="chip" aria-pressed={missedOnly} data-kiki-missed data-sfx="tick" onclick={() => (missedOnly = !missedOnly)}>{t('kiki.missedOnly')}</button>
    </div>
    {#if !rows.length}<p class="none">{t('kiki.allRight')}</p>{/if}
    <ul class="review">
      {#each rows as r (r.i)}
        {@const [pre, focus, post] = split(r.it)}
        <li class="item card" data-review={r.i} data-ok={r.ok}>
          <span class="sym" class:ok={r.ok} aria-label={r.ok ? t('kiki.right') : t('kiki.wrong')}>{r.ok ? '○' : '×'}</span>
          <div class="txt">
            <p class="en" lang="en">{pre}{#if focus}<mark>{focus}</mark>{/if}{post}</p>
            <p class="ja">{r.it.ja}</p>
            {#if r.it.type === 'pic' || r.it.type === 'num'}<p class="ans">→ {answerText(r.it)}</p>{/if}
          </div>
          <div class="hear">
            <button type="button" class="ib" aria-label={t('kiki.play')} data-kiki-hear={r.i} data-sfx="tick" onclick={() => game.hear(r.it)}>▶︎</button>
            {#if r.it.lv <= 2}<button type="button" class="ib" aria-label={t('kiki.playSlow')} data-sfx="tick" onclick={() => game.hear(r.it, true)}>🐢</button>{/if}
          </div>
        </li>
      {/each}
    </ul>
  </section>
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={onagain}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .rank { list-style: none; margin: 0; padding: 8px 14px; display: grid; gap: 4px; }
  .rank li { display: grid; grid-template-columns: 3em auto 1fr; align-items: center; gap: 10px; }
  .no { font: 700 var(--fs-body)/1 var(--font-num, var(--font-ui)); color: var(--text-soft); }
  .no.top { color: var(--c-coral); font-size: var(--fs-title); }
  .rank :global(.pc) { grid-auto-flow: column; justify-items: start; align-items: center; max-width: none; gap: 10px; }
  .pts { justify-self: end; font: 700 var(--fs-talk)/1 var(--font-num, var(--font-ui)); }
  .sec { display: grid; gap: 8px; }
  .rev-head { display: flex; align-items: center; justify-content: space-between; }
  .none { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--leaf-text); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; grid-template-columns: auto 1fr auto; align-items: start; gap: 10px; padding: 12px 10px 12px 14px; }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--c-coral); }
  .sym.ok { color: var(--leaf-text); }
  .txt { min-width: 0; display: grid; gap: 4px; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en mark { background: linear-gradient(transparent 55%, color-mix(in srgb, var(--c-yuzu) 85%, transparent) 55%); color: inherit; }
  .ja, .ans { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hear { display: flex; gap: 6px; }
  .ib {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center;
    background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); font: 700 18px/1 var(--font-ui);
  }
  .ib:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
</style>
