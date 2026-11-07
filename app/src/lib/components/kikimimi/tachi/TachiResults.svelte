<script lang="ts">
  // たちぎき's results (docs/curriculum-wave2.md §2.2), its own chunk, in the frame's (frame/Results.svelte: しずえ's line,
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
        {@const open = opened.includes(cv.n)}
        <li class="item card" data-review={cv.n} data-ok={cv.all} data-open={open}>
          <button type="button" class="head" aria-expanded={open} data-kiki-row={cv.n} data-sfx="tick" onclick={() => toggle(cv.n)}>
            <span class="marks">{#each cv.rs as r (r.i)}<span class="sym" class:ok={r.ok} data-kiki-round={r.i}><span aria-hidden="true">{r.ok ? '○' : '×'}</span><span class="sr-only">{r.ok ? t('kiki.right') : t('kiki.wrong')}</span></span>{/each}</span>
            <span class="sum">{cv.c.ask ?? ''}</span>
            <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
          </button>
          {#if open}
            <div class="txt" data-kiki-detail={cv.n}>
              <div class="hear">
                <button type="button" class="btn small paper" data-kiki-hear={cv.n} data-sfx="tick" onclick={() => game.hear(cv.c)}>▶︎ {t('kiki.tachi.hearAll')}</button>
              </div>
              <Transcript it={cv.c} all={playing(cv.c)} clock={() => game.clock()} compact />
              {#if cv.c.note}<p class="note" data-kiki-note>{cv.c.note}</p>{/if}
              {#each cv.rs as r (r.i)}
                <section class="round" data-kiki-review-round={r.i} data-ok={r.ok}>
                  <h4><span class="sym" class:ok={r.ok} aria-hidden="true">{r.ok ? '○' : '×'}</span> {r.c.tachi.type === 'plan' ? r.c.tachi.ask : t(`kiki.tachi.ask.${r.c.tachi.type}`)}</h4>
                  <p class="ans">{t('kiki.tachi.answer', { a: r.right ?? '' })}</p>
                  {#if !r.ok}<p class="picked" data-kiki-tachi-mine>{t('kiki.tachi.mine', { a: r.mine ?? t('kiki.timeUp') })}</p>{/if}
                  {#if r.c.why}<Why text={r.c.why} />{/if}
                </section>
              {/each}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; gap: 8px; padding: 0; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .marks { display: inline-flex; gap: 4px; }
  .sym { font: 700 20px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .sum { min-width: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text); }
  .chev { font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .txt { min-width: 0; display: grid; gap: 8px; padding: 0 12px 12px; }
  .hear { display: flex; justify-content: center; }
  .round { display: grid; gap: 4px; }
  .round h4 { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
</style>
