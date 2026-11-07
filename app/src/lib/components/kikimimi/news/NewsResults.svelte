<script lang="ts">
  // しずえの ニュース's results (docs/curriculum-wave2.md §2.5), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, the team's tally, how many I got right, おわる / もういっかい): co-op's 「ふたりで k / n」 counts the questions both
  // got (the session's `team.all`). Then the review list (frame/ReviewList.svelte), a row per question, the misses first
  // open: the right answer and mine in Japanese, 解説; and the whole bulletin under them with ▶︎ (the karaoke as it
  // plays). もういっかい: the host the same day's bulletin again (solo at once, shared re-invited).
  import type { QuizGame } from '../game.svelte.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import type { NewsCard } from '#lib/kikimimi/games/news/def.ts';
  import { okFor } from './board.ts';
  import { isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import Why from '../frame/Why.svelte';
  import Transcript from '../Transcript.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as NewsCard[]);
  const news = $derived(cards[0]);
  const coop = $derived(isCoop(v));
  /** A choice in Japanese (its `cja`), else as said. */
  const said = (c: NewsCard, k: number | null): string | null => (k === null ? null : (c.cja?.[k] ?? c.choices[k] ?? null));
  const rows = $derived(cards.map((c, i) => {
    const mine = rawOf(v.answers[i]);
    return { c, i, ok: okFor(c, v.answers[i]), right: said(c, c.answer), mine: said(c, typeof mine === 'number' ? mine : null) };
  }));
  const tally = $derived(rows.filter((r) => r.ok).length);
  /** The team's questions right together (co-op), else mine. */
  const made = $derived(coop ? v.team.all : tally);
  const line = $derived(t(made >= cards.length ? 'kiki.news.host.all' : made * 2 >= cards.length ? 'kiki.news.host.some' : 'kiki.news.host.few'));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  // with misses, the list opens on them, the first one open (the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(rows.some((r) => !r.ok));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(rows.filter((r) => !r.ok).slice(0, 1).map((r) => r.i));
  const toggle = (i: number) => (opened = opened.includes(i) ? opened.filter((x) => x !== i) : [...opened, i]);
  const shown = $derived(rows.filter((r) => !missedOnly || !r.ok));
  const ask = (c: NewsCard) => (c.news.q === 'detail' ? c.news.ask : t(`kiki.news.ask.${c.news.q}`));
  const playing = $derived(game.talk && game.talk.i === -1 && game.talk.at === news?.id ? game.talk.all : []);

  const again = () => playAgain(game, 'news', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} firsts={0} {line} {ondone} onagain={again}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        {@const open = opened.includes(r.i)}
        <li class="item card" data-review={r.i} data-ok={r.ok} data-open={open}>
          <button type="button" class="head" aria-expanded={open} data-kiki-row={r.i} data-sfx="tick" onclick={() => toggle(r.i)}>
            <span class="sym" class:ok={r.ok}><span aria-hidden="true">{r.ok ? '○' : '×'}</span><span class="sr-only">{r.ok ? t('kiki.right') : t('kiki.wrong')}</span></span>
            <span class="sum">{ask(r.c)}</span>
            <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
          </button>
          {#if open}
            <div class="txt" data-kiki-detail={r.i}>
              <p class="ans">{t('kiki.news.answer', { a: r.right ?? '' })}</p>
              {#if !r.ok}<p class="picked" data-kiki-news-mine>{t('kiki.news.mine', { a: r.mine ?? t('kiki.timeUp') })}</p>{/if}
              {#if r.c.why}<Why text={r.c.why} />{/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </ReviewList>
  {#if news?.lines}
    <section class="script card" data-kiki-news-script>
      <h3>{t('kiki.news.script')}</h3>
      <div class="hear"><button type="button" class="btn small paper" data-kiki-hear="news" data-sfx="tick" onclick={() => game.hear(news)}>▶︎ {t('kiki.news.hearAll')}</button></div>
      {#if news.note}<p class="note" data-kiki-note>{news.note}</p>{/if}
      <Transcript it={{ ...news, lines: news.lines }} all={playing} clock={() => game.clock()} compact />
    </section>
  {/if}
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; gap: 8px; padding: 0; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .sym { font: 700 20px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .sum { min-width: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text); }
  .chev { font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .txt { min-width: 0; display: grid; gap: 6px; padding: 0 12px 12px; }
  .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
  .script { display: grid; gap: 8px; padding: 12px; }
  .script h3 { margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .hear { display: flex; justify-content: center; }
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
</style>
