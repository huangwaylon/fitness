<script lang="ts">
  // ようじ でんわ's results (docs/curriculum-wave2.md §2.3), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, the team's tally, my rounds right, my いっぱつ, おわる / もういっかい), with the errands done over it (a call's
  // basket all caught: co-op, the team's memo). Then the review list (frame/ReviewList.svelte), the misses first: each
  // call, tapped open, with its basket, the rows I heard wrong, the trap's note, 解説, ▶︎ and its transcript.
  // もういっかい: the host a new deal of the same place (solo at once, shared re-invited), another back to the invite.
  import type { QuizGame } from '../game.svelte.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { callOk, rowOk, type CallCard } from '#lib/kikimimi/games/call/def.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { basketOf, myRows, roundFor, whyOf } from './board.ts';
  import Basket from './Basket.svelte';
  import CallLog from './CallLog.svelte';
  import { playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import Why from '../frame/Why.svelte';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName as name } from '../scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as CallCard[]);
  /** Each round: right, its rows I put wrong (the chip and the right one), a first listen. */
  const rounds = $derived(cards.map((c, i) => {
    const a = v.answers[i], given = a && Array.isArray(a.a) ? (a.a as readonly number[]) : null, r = roundFor(v, c);
    const ok = !!given && callOk(r, given);
    const wrong = given ? myRows(v, game.me, r.rows.length).filter((j) => !rowOk(r, given, j)).map((j) => ({ put: given[j] === EMPTY ? null : r.rows[j].chips[given[j]], right: r.rows[j].chips[r.rows[j].answer] })) : [];
    return { ok, wrong, first: firstListen(ok, !!a?.rp, v.same) };
  }));
  /** Each call: its first round, both rounds right (mine), its basket (the team's), done when all of it was caught. */
  const calls = $derived(cards.flatMap((c, i) => {
    if (c.call.part) return [];
    const tags = basketOf(v, cards, i, game.me), both = [rounds[i], rounds[i + 1]].filter(Boolean);
    return [{ c, i, ok: both.every((r) => r.ok), wrong: both.flatMap((r) => r.wrong), tags, done: tags.every((x) => x.state === 'caught'), whys: [whyOf(c), cards[i + 1] && whyOf(cards[i + 1])].filter((w): w is string => !!w) }];
  }));
  const tally = $derived(rounds.filter((r) => r.ok).length);
  const firsts = $derived(rounds.filter((r) => r.first).length);
  const errands = $derived(calls.filter((x) => x.done).length);
  const line = $derived(t(errands >= calls.length ? 'kiki.call.host.all' : errands * 2 >= calls.length ? 'kiki.call.host.some' : 'kiki.call.host.few'));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  // with misses, the list opens on them, the first one open (the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(calls.some((x) => !x.ok));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(calls.filter((x) => !x.ok).slice(0, 1).map((x) => x.i));
  let logs = $state<number[]>([]);
  const toggle = (list: number[], i: number) => (list.includes(i) ? list.filter((x) => x !== i) : [...list, i]);
  const shown = $derived(calls.filter((x) => !missedOnly || !x.ok));

  const again = () => playAgain(game, 'call', onagain);
</script>

{#snippet top()}
  <p class="errands"><span class="pill" data-kiki-call-errands={errands}>📞 {t('kiki.call.errands', { k: errands, n: calls.length })}</span></p>
{/snippet}

<ResultsFrame v={frameV} {tally} of={cards.length} {firsts} {line} {top} {ondone} onagain={again}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as x (x.i)}
        {@const open = opened.includes(x.i)}
        <li class="item card" data-review={x.i} data-ok={x.ok} data-open={open}>
          <button type="button" class="head" aria-expanded={open} data-kiki-row={x.i} data-sfx="tick" onclick={() => (opened = toggle(opened, x.i))}>
            <span class="sym" class:ok={x.ok}><span aria-hidden="true">{x.ok ? '○' : '×'}</span><span class="sr-only">{x.ok ? t('kiki.right') : t('kiki.wrong')}</span></span>
            <span class="who"><OfficialArt key={villagerArt(x.c.speaker, true)} alt="" size={32} /></span>
            <span class="sum"><b>{name(x.c.speaker)}</b>{#if x.c.ctx}<span class="ctx">{x.c.ctx}</span>{/if}</span>
            <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
          </button>
          {#if open}
            <div class="txt" data-kiki-detail={x.i}>
              <Basket tags={x.tags} />
              {#if x.wrong.length}
                <p class="picked" data-kiki-call-heard>{t('kiki.call.heard', { w: x.wrong.map((w) => `${w.put ?? '—'} → ${w.right}`).join('、') })}</p>
              {/if}
              {#if x.c.note}<p class="note" data-kiki-note>{x.c.note}</p>{/if}
              {#each x.whys as w (w)}<Why text={w} />{/each}
              <div class="hear">
                <button type="button" class="ib tile-btn" aria-label={t('kiki.play')} data-kiki-hear={x.i} data-sfx="tick" onclick={() => game.hear(x.c)}>▶︎</button>
                <button type="button" class="btn small paper" aria-expanded={logs.includes(x.i)} data-kiki-call-log-btn data-sfx="tick" onclick={() => (logs = toggle(logs, x.i))}>
                  {logs.includes(x.i) ? t('kiki.call.logClose') : t('kiki.call.log')}
                </button>
              </div>
              {#if logs.includes(x.i)}<CallLog info={x.c.call.info} />{/if}
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .errands { margin: 0; text-align: center; }
  .pill { display: inline-block; padding: 6px 14px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; gap: 8px; padding: 0; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: auto auto 1fr auto; align-items: center; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .who { line-height: 0; }
  .sum { min-width: 0; display: grid; gap: 2px; font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .ctx { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .chev { font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .txt { min-width: 0; display: grid; gap: 8px; padding: 0 14px 12px; }
  .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--coral-text); }
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
  .hear { display: flex; align-items: center; gap: 8px; }
  .ib { width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center; font: 700 18px/1 var(--font-ui); }
</style>
