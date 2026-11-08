<script lang="ts">
  // ようじ でんわ's results (docs/kikimimi-engine.md "ようじ でんわ"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
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
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
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

{#snippet more()}<span class="sub" data-kiki-call-errands={errands}>📞 {t('kiki.call.errands', { k: errands, n: calls.length })}</span>{/snippet}

<ResultsFrame v={frameV} {tally} of={cards.length} {firsts} {line} {more} {ondone} onagain={again}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as x (x.i)}
        <ReviewRow i={x.i} ok={x.ok} open={opened.includes(x.i)} ontoggle={() => (opened = toggle(opened, x.i))}>
          {#snippet lead()}<span class="who"><OfficialArt key={villagerArt(x.c.speaker, true)} alt="" size={32} /></span>{/snippet}
          {#snippet summary()}<b>{name(x.c.speaker)}</b>{#if x.c.ctx}<span class="ctx">{x.c.ctx}</span>{/if}{/snippet}
          {#snippet hear()}
            <HearButton data-kiki-hear={x.i} onclick={() => game.hear(x.c)} />
            <button type="button" class="btn small paper" aria-expanded={logs.includes(x.i)} data-kiki-call-log-btn data-sfx="tick" onclick={() => (logs = toggle(logs, x.i))}>
              {logs.includes(x.i) ? t('kiki.call.logClose') : t('kiki.call.log')}
            </button>
          {/snippet}
          {#if logs.includes(x.i)}<CallLog info={x.c.call.info} />{/if}
          <Basket tags={x.tags} />
          {#if x.wrong.length}
            <p class="picked" data-kiki-call-heard>{t('kiki.call.heard', { w: x.wrong.map((w) => `${w.put ?? '—'} → ${w.right}`).join('、') })}</p>
          {/if}
          {#if x.c.note}<Note text={x.c.note} />{/if}
          {#each x.whys as w (w)}<Why text={w} />{/each}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .who { line-height: 0; }
  .review b { font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .ctx { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--coral-text); }
</style>
