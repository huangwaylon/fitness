<script lang="ts">
  // A round of しずえの ニュース (docs/kikimimi-engine.md "しずえの ニュース"; games/news/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte). しずえ at her desk (NewsStage) reads the bulletin before the first question: an island or
  // seasonal story, a Tokyo one, today's weather; nothing to answer while it plays. Then a question a round, one tap
  // on an English choice (ChoiceGrid; easy, the answer and its trap only): the gist, a detail, 「傘は いる？」 (only with
  // the weather). After the first play each story replays on its chip. The reveal: ○ / ×, each choice's Japanese, 解説;
  // the last one adds the trap's note and the whole bulletin.
  import Note from '../frame/Note.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import type { NewsCard } from '#lib/kikimimi/games/news/def.ts';
  import { RIGHT } from '#lib/kikimimi/score.ts';
  import { okFor, segAt, segItem, shownFor } from './board.ts';
  import { isCoop } from '../listenView.ts';
  import NewsStage from './NewsStage.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import ChoiceGrid from '../frame/ChoiceGrid.svelte';
  import Why from '../frame/Why.svelte';
  import Transcript from '../Transcript.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as NewsCard[]);
  const it = $derived(cards[v.i] as NewsCard | undefined);
  /** The bulletin (the first card: its lines). */
  const news = $derived(cards[0]);
  const segs = $derived(news?.news.segs ?? []);
  const reveal = $derived(v.phase === 'reveal');
  const coop = $derived(isCoop(v));
  const sent = $derived(v.answers[v.i] ?? null);
  const raw = $derived(rawOf(sent));
  /** The bulletin playing: nothing to answer yet. */
  const listening = $derived(it?.news.q === 'gist' && (v.phase === 'lead' || v.phase === 'play'));
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const shown = $derived(it ? shownFor(v, it) : []);
  const pick = (k: number) => open && game.answer(shown[k]);
  const ok = $derived(!!it && okFor(it, sent));
  const verdict = $derived(v.out ? 'out' : ok ? 'right' : sent ? 'wrong' : 'none');

  const bar = $derived(listening && v.phase === 'play' ? { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` } : null);
  /** The story read now: the first play's line, or a story replaying. */
  const reading = $derived(game.talk && game.talk.i === 0 && listening ? segAt(segs, game.talk.k) : -1);
  const hearing = $derived(game.sounding && game.sounding.i === -1 ? segs.findIndex((s) => game.sounding?.at === `${news?.id}-s${s.from}`) : -1);
  const canHear = $derived(v.speaks && !v.out && !listening && !!news);
  const hear = (k: number) => news && game.hear(segItem(news, segs[k]));
  const ask = $derived(it ? (it.news.q === 'detail' ? it.news.ask : t(`kiki.news.ask.${it.news.q}`)) : '');
  const last = $derived(reveal && v.i === cards.length - 1);
  const pickedAt = $derived(typeof raw === 'number' ? shown.indexOf(raw) : -1);
</script>

{#if it && news}
{#snippet stage()}
  <div class="stage">
    <NewsStage {segs} {bar} now={game.now} {reading} {hearing} {canHear} onhear={hear} />
    {#if listening && it.ctx}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
  </div>
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} right={ok} picked={!!sent} pts={RIGHT} {coop} rightNow={v.rightNow} />
  {:else if listening}
    <p class="ask" data-kiki-news-wait>{t('kiki.news.wait')}</p>
  {:else if !v.out}
    <p class="ask" data-kiki-news-ask={it.news.q}>{ask}</p>
  {/if}
  {#if !listening && !v.out}
    <ChoiceGrid choices={shown.map((k) => it.choices[k])} right={shown.indexOf(it.answer)} ja={it.cja && shown.map((k) => it.cja![k])} {open} {reveal} dim={false}
      picked={pickedAt >= 0 ? pickedAt : null} onpick={pick} />
  {/if}
  {#if reveal && it.why}<Why text={it.why} />{/if}
{/snippet}

{#snippet after()}
  {#if last && !v.out}
    {#if it.note}<Note text={it.note} />{/if}
    <h3 class="script">{t('kiki.news.script')}</h3>
    <Transcript it={{ ...news, lines: news.lines ?? [] }} clock={() => game.clock()} compact />
  {/if}
{/snippet}

<RoundFrame {game} {v} now={game.now} me={game.me} type="news-{it.news.q}" answered={!!sent} {verdict} {stage} {input} {after} peek={false} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 8px; }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .script { margin: 4px 0 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
