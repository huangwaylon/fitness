<script lang="ts">
  // 6 数字キャッチ (mini/numbers.ts): each seat's own stream (seeded by its seat and level: the same on every phone), a
  // number, a time or a price in words, and four big choices. Right counts and moves on; a miss shows the answer a
  // moment (「おしい！答えは 45」, the right choice lit, never a lost point) and moves on. The team's total live on every
  // phone (online: each seat's `mini` frame `nu<n>`, at most one a second); the count played as the time is up
  // (`over`), once: the first counts. Passed round, a 20 s turn each behind the cover (MiniTurn), as なかま分け.
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { numberStream, type NumbersState } from '../../mini/numbers.ts';
  import type { Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';
  import { raceView } from './raceView.svelte.ts';

  interface Props {
    s: NumbersState; seat: Who | null; live: boolean; over: boolean; play: (p: Play, who?: Who) => void;
    views: Partial<Record<Who, string>>; onview?: (v: string) => void;
  }
  let { s, seat, live, over, play, views, onview }: Props = $props();

  const stream = $derived(seat ? numberStream(s, seat) : []);
  const race = raceView('nu', { get s() { return s; }, get seat() { return seat; }, get over() { return over; }, get play() { return play; }, get views() { return views; }, get onview() { return onview; } });
  let at = $state(0);
  /** A miss's answer shown (its choice lit) till the next prompt. */
  let missed = $state<number | null>(null);
  let okAt = $state<number | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));
  // (a new seat at the phone: its own stream from the start)
  $effect(() => {
    void seat;
    at = 0;
    missed = null;
  });
  const item = $derived(stream.length ? stream[at % stream.length] : null);
  function pick(k: number) {
    if (!live || !item || missed !== null) return;
    clearTimeout(timer);
    if (k === item.a) {
      race.add();
      okAt = k;
      at++;
      timer = setTimeout(() => (okAt = null), 180);
      return;
    }
    missed = item.a;
    timer = setTimeout(() => ((missed = null), at++), 900);
  }
</script>

<div class="nu" data-sg-numbers={race.count}>
  <p class="team" data-sg-nu-team={race.team}>{tr('nuTeam', { n: race.team })}{#if seat}<small>{' · '}{tr('nuMine', { n: race.count })}</small>{/if}</p>
  {#if seat && item}
    <div class="card" class:ok={okAt !== null} data-sg-nu-text={item.text}>
      <span class="tag kind">{tr(`nuKind.${item.kind}`)}</span>
      <b lang="en">{item.text}</b>
    </div>
    <p class="note" aria-live="polite"><Phrases text={missed !== null ? tr('nuAnswer', { a: item.choices[missed] }) : tr('nuAsk')} /></p>
    <div class="choices">
      {#each item.choices as c, k (`${at}:${k}`)}
        <button type="button" class="choice press" class:hint={missed === k} disabled={!live || (missed !== null && missed !== k)} data-sfx="tick" data-sg-nu-choice={c} data-right={k === item.a ? '' : undefined} onclick={() => pick(k)}>{c}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .nu { display: flex; flex-direction: column; gap: 8px; }
  .nu > :global(*) { flex-shrink: 0; }
  .team { margin: 0; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-ink); }
  .team small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .card { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; min-height: 92px; padding: 10px 12px;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); text-align: center; transition: scale 120ms; }
  .card.ok { scale: 1.03; }
  .kind { background: color-mix(in srgb, var(--c-sky) 30%, var(--c-cream)); color: var(--c-ink); }
  .card b { font: 600 24px/1.25 var(--font-body); color: var(--c-ink); text-wrap: balance; }
  .note { margin: 0; min-height: 1.3em; text-align: center; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .choices { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .choice { min-height: 64px; margin: 0 0 3px; appearance: none; border: 0; cursor: pointer; border-radius: var(--r-card);
    background: color-mix(in srgb, var(--c-mint) 30%, var(--c-card)); box-shadow: var(--sh-ctl); color: var(--c-ink);
    font: 600 24px/1 var(--font-num); touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  .choice:nth-child(2), .choice:nth-child(3) { background: color-mix(in srgb, var(--c-sky) 25%, var(--c-card)); }
  .choice:disabled { opacity: .35; }
  .choice.hint { opacity: 1; outline: 3px solid var(--c-yuzu-lip); background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); }
</style>
