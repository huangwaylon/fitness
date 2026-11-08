<script lang="ts">
  // たちぎき's results (docs/kikimimi-engine.md "たちぎき"), its own chunk, in the frame's (frame/Results.svelte: しずえ's line,
  // the team's tally, how many I got right, おわる / もういっかい): co-op's 「ふたりで k / n」 counts the rounds both got right
  // (the session's `team.all`: the opinions round's two halves). Then the review list (frame/ReviewList.svelte), a card
  // per conversation, the ones with a miss first: its three rounds ○ / ×; tapped open, the whole transcript (three seats,
  // the karaoke as ▶︎ plays it, its bed under it), the note, and each round's question, the right answer, mine when it
  // was wrong, and 解説. もういっかい: the host a new deal of the same place (solo at once, shared re-invited).
  import type { QuizGame } from '../game.svelte.ts';
  import { EMPTY, rawOf } from '#lib/kikimimi/games/listened.ts';
  import type { TachiCard } from '#lib/kikimimi/games/tachi/def.ts';
  import { okFor } from './board.ts';
  import { isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import Why from '../frame/Why.svelte';
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
  import Transcript from '../Transcript.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as TachiCard[]);
  const coop = $derived(isCoop(v));
  /** Each round: right, the right answer and mine (as words), by conversation. */
  const rows = $derived(cards.map((c, i) => ({ c, i, ok: okFor(c, v.answers[i]), right: said(c, c.tachi.answer), mine: said(c, rawOf(v.answers[i])) })));
  const convs = $derived([...new Set(cards.map((c) => c.tachi.conv))].map((n) => {
    const rs = rows.filter((r) => r.c.tachi.conv === n);
    return { n, c: rs[0].c, rs, all: rs.every((r) => r.ok) };
  }));
  const tally = $derived(rows.filter((r) => r.ok).length);
  /** The team's rounds right together (co-op), else mine. */
  const made = $derived(coop ? v.team.all : tally);
  const line = $derived(t(made >= cards.length ? 'kiki.tachi.host.all' : made * 2 >= cards.length ? 'kiki.tachi.host.some' : 'kiki.tachi.host.few'));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  /** An answer in words: the claims' speakers, a face's name, a choice. */
  function said(c: TachiCard, a: readonly number[] | number | null): string | null {
    if (a === null) return null;
    const who = (f: number) => (f === EMPTY ? '—' : name(c.tachi.who[f]));
    if (Array.isArray(a)) return a.map((f, j) => `${c.tachi.claims?.[j]}: ${who(f)}`).join(' ／ ');
    return c.tachi.type === 'changed' ? who(a as number) : (c.cja?.[a as number] ?? c.choices[a as number] ?? null);
  }

  // with misses, the list opens on them, the first one open (the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(convs.some((c) => !c.all));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(convs.filter((c) => !c.all).slice(0, 1).map((c) => c.n));
  const toggle = (n: number) => (opened = opened.includes(n) ? opened.filter((x) => x !== n) : [...opened, n]);
  const shown = $derived(convs.filter((c) => !missedOnly || !c.all));
  const playing = (c: TachiCard) => (game.talk && game.talk.i === -1 && game.talk.at === c.id ? game.talk.all : []);

  const again = () => playAgain(game, 'tachi', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} firsts={0} {line} {ondone} onagain={again}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as cv (cv.n)}
        <ReviewRow i={cv.n} ok={cv.all} open={opened.includes(cv.n)} ontoggle={() => toggle(cv.n)} marks={cv.rs.map((r) => ({ i: r.i, ok: r.ok }))}>
          {#snippet summary()}{cv.c.ask ?? ''}{/snippet}
          {#snippet hear()}<HearButton label={t('kiki.tachi.hearAll')} data-kiki-hear={cv.n} onclick={() => game.hear(cv.c)} />{/snippet}
          <Transcript it={cv.c} all={playing(cv.c)} clock={() => game.clock()} compact />
          {#if cv.c.note}<Note text={cv.c.note} />{/if}
          {#each cv.rs as r (r.i)}
            <section class="round" data-kiki-review-round={r.i} data-ok={r.ok}>
              <h4><span class="sym" class:ok={r.ok} aria-hidden="true">{r.ok ? '○' : '×'}</span> {r.c.tachi.type === 'plan' ? r.c.tachi.ask : t(`kiki.tachi.ask.${r.c.tachi.type}`)}</h4>
              <p class="ans">{t('kiki.tachi.answer', { a: r.right ?? '' })}</p>
              {#if !r.ok}<p class="picked" data-kiki-tachi-mine>{t('kiki.tachi.mine', { a: r.mine ?? t('kiki.timeUp') })}</p>{/if}
              {#if r.c.why}<Why text={r.c.why} />{/if}
            </section>
          {/each}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .round { display: grid; gap: 4px; }
  .round h4 { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .sym { color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
</style>
