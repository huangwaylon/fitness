<script lang="ts">
  // しずえの ニュース's results (docs/kikimimi-engine.md "しずえの ニュース"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
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
  import { Review } from '../frame/review.svelte.ts';
  import Why from '../frame/Why.svelte';
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
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

  // with misses, the list opens on them, the first one open
  const review = new Review(() => rows.filter((r) => !r.ok).map((r) => r.i));
  const shown = $derived(rows.filter((r) => !review.missedOnly || !r.ok));
  const ask = (c: NewsCard) => (c.news.q === 'detail' ? c.news.ask : t(`kiki.news.ask.${c.news.q}`));
  const playing = $derived(game.talk && game.talk.i === -1 && game.talk.at === news?.id ? game.talk.all : []);

  const again = () => playAgain(game, 'news', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} firsts={0} {line} {ondone} onagain={again}>
  <ReviewList {review} none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        <ReviewRow i={r.i} ok={r.ok} open={review.isOpen(r.i)} ontoggle={() => review.toggle(r.i)}>
          {#snippet summary()}{ask(r.c)}{/snippet}
          <p class="ans">{t('kiki.news.answer', { a: r.right ?? '' })}</p>
          {#if !r.ok}<p class="picked" data-kiki-news-mine>{t('kiki.news.mine', { a: r.mine ?? t('kiki.timeUp') })}</p>{/if}
          {#if r.c.why}<Why text={r.c.why} />{/if}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
  {#if news?.lines}
    <section class="script card" data-kiki-news-script>
      <div class="sh">
        <h3>{t('kiki.news.script')}</h3>
        <HearButton label={t('kiki.news.hearAll')} data-kiki-hear="news" onclick={() => game.hear(news)} />
      </div>
      {#if news.note}<Note text={news.note} />{/if}
      <Transcript it={{ ...news, lines: news.lines }} all={playing} clock={() => game.clock()} compact />
    </section>
  {/if}
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
  .script { display: grid; gap: 8px; padding: 12px; }
  /* the bulletin's head: its name, ▶︎ beside it (as a role-play's お手本) */
  .sh { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .sh h3 { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
