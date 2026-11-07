<script lang="ts">
  // すうじ ラッシュ's results (docs/curriculum-wave2.md §2.4), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, co-op's 「ふたりで k / n」 the customers served, how many of mine I got right, my いっぱつ, おわる / もういっかい),
  // the best combo, then the review list (frame/ReviewList.svelte), the misses first: each customer's question and the
  // right chip; tapped open, ▶︎, what they said and its Japanese, the pick when it was wrong (co-op the register's), the
  // trap's note and 解説. もういっかい: the host a new queue at the same place.
  import type { QuizGame } from '../game.svelte.ts';
  import { PASS, type RushCard } from '#lib/kikimimi/games/rush/def.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { authoredPick, comboBest, myTurn, othersAt, roundFor } from './board.ts';
  import { isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import Why from '../frame/Why.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as RushCard[]);
  const coop = $derived(isCoop(v));
  /** Each customer: mine or the partner's, right, the pick as authored (the register's), a first listen. */
  const rows = $derived(cards.map((c, i) => {
    const turn = myTurn(v, game.me, i), a = v.answers[i];
    const other = turn ? undefined : (othersAt(v, game.me, i) ?? [])[0];
    const k = turn ? (a && a.k !== PASS ? a.k : null) : (other?.k ?? null);
    const ok = turn ? k !== null && k === roundFor(v, c).answer : !!other?.ok;
    const pick = turn ? authoredPick(v, c, k) : other ? authoredPick(v, c, other.k, other.who) : null;
    return { c, i, turn, ok, pick, first: turn && firstListen(ok, !!a?.rp, v.same) };
  }));
  const mineRows = $derived(rows.filter((r) => r.turn));
  const tally = $derived(mineRows.filter((r) => r.ok).length);
  const firsts = $derived(mineRows.filter((r) => r.first).length);
  const served = $derived(coop ? v.team.right : tally);
  const best = $derived(comboBest(v, cards, game.me));
  const line = $derived(t(served >= cards.length ? 'kiki.rush.host.all' : served * 2 >= cards.length ? 'kiki.rush.host.some' : 'kiki.rush.host.few'));
  const frameV = $derived({ ...v, team: { ...v.team, all: 0 } });

  // with misses, the list opens on them, the first one open (the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(rows.some((r) => !r.ok));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(rows.filter((r) => !r.ok).slice(0, 1).map((r) => r.i));
  const toggle = (i: number) => (opened = opened.includes(i) ? opened.filter((x) => x !== i) : [...opened, i]);
  const shown = $derived(rows.filter((r) => !missedOnly || !r.ok));
</script>

{#snippet top()}
  <p class="strip" data-kiki-rush-best={best}>
    <span class="served" data-kiki-rush-served={served}>{t('kiki.rush.served', { k: served, n: cards.length })}</span>
    {#if best >= 2}<span class="best obj-cream">{t('kiki.rush.best', { n: best })}</span>{/if}
  </p>
{/snippet}

<ResultsFrame v={frameV} {tally} of={mineRows.length} {firsts} {line} {top} {ondone} onagain={() => playAgain(game, 'rush', onagain)}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        {@const open = opened.includes(r.i)}
        <li class="item card" data-review={r.i} data-ok={r.ok} data-open={open}>
          <button type="button" class="head" aria-expanded={open} data-kiki-row={r.i} data-sfx="tick" onclick={() => toggle(r.i)}>
            <span class="sym" class:ok={r.ok}><span aria-hidden="true">{r.ok ? '○' : '×'}</span><span class="sr-only">{r.ok ? t('kiki.right') : t('kiki.wrong')}</span></span>
            <span class="sum">{r.c.rush.ask} <b>{r.c.choices[r.c.answer]}</b></span>
            {#if r.first}<span class="stamp obj-cream">{t('kiki.firstTry')}</span>{/if}
            <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
          </button>
          {#if open}
            <div class="txt" data-kiki-detail={r.i}>
              <div class="hear"><button type="button" class="btn small paper" data-kiki-hear={r.i} data-sfx="tick" onclick={() => game.hear(r.c)}>▶︎ {t('kiki.rush.hear')}</button></div>
              <p class="en" lang="en">{r.c.en}</p>
              <p class="ja">{r.c.ja}</p>
              {#if !r.ok}
                <p class="picked" data-kiki-rush-picked>{r.turn ? t('kiki.rush.mineWas', { a: r.pick !== null ? r.c.choices[r.pick] : t('kiki.timeUp') }) : t('kiki.rush.partner', { a: r.pick !== null ? r.c.choices[r.pick] : t('kiki.timeUp') })}</p>
              {/if}
              {#if r.c.note}<p class="note" data-kiki-note>{r.c.note}</p>{/if}
              {#if r.c.why}<Why text={r.c.why} />{/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .strip { margin: 0; display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; }
  .served { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .best { padding: 3px 10px; border-radius: var(--r-pill); color: var(--c-ink); background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; gap: 8px; padding: 0; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .sum { min-width: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text); }
  .sum b { font: 700 var(--fs-body)/1.3 var(--font-num); margin-left: 4px; }
  .chev { font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .stamp {
    display: inline-block; padding: 2px 6px; border-radius: 8px; rotate: -4deg; white-space: nowrap; color: var(--coral-text);
    background: color-mix(in srgb, var(--c-yuzu) 45%, var(--c-card)); box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui);
  }
  .txt { min-width: 0; display: grid; gap: 6px; padding: 0 14px 12px 46px; }
  .hear { display: flex; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .ja, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
</style>
