<script lang="ts">
  // 聞き取りチャレンジ's one line (docs/english.md "Catch the line"; catch.ts): ▶ 聞く plays it with no text, then its
  // tiles (chunks and 1–2 distractors, seeded) are tapped in the order heard into the slots. A tile out of order bounces
  // back and the next chunk is placed for the learner (sky), the line again at 0.75×. Complete: the line at full speed,
  // its chunks lit in time (the reward), then its Japanese and `after`. Never "wrong", no red, no score. The player is
  // the caller's (the lesson's pinned one, or the shelf's); YouTube's captions are off while a line is caught, its
  // speed and captions put back after.
  import { onDestroy, untrack, type Snippet } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { catching, clean, done, howOf, litAt, SLOW, tap, type How } from '../catch.ts';
  import type { YtPlayer, CcMode } from '../player.svelte.ts';
  import type { CatchLine } from '../types.ts';
  import { s } from '../i18n.ts';

  interface Props {
    line: CatchLine;
    player: YtPlayer | undefined;
    seed: string;
    /** The card's head (its title, 1/2). */
    head: Snippet;
    /** The line's first words placed: how it was caught (once). */
    oncaught: (h: How) => void;
    /** Under the meaning, once caught. */
    after?: Snippet<[How]>;
  }
  let { line, player, seed, head, oncaught, after }: Props = $props();

  let c = $state.raw(untrack(() => catching(line, seed)));
  /** ▶ 聞く tapped once (the tiles shown from then: heard before read). */
  let heard = $state(false);
  /** The tile bouncing back (its index), for its shake. */
  let bounce = $state<number | null>(null);
  /** A tile was placed for them just now: the note. */
  let helped = $state(false);
  /** The reward's replay asked (the chunks lit by the player's time from then). */
  let reward = $state(false);
  const complete = $derived(done(c, line));
  const how = $derived(complete ? howOf(c) : null);
  const lit = $derived(reward && player ? (player.state === 'playing' || player.state === 'buffering' ? litAt(line, player.time) : player.time >= line.t[0] ? line.tiles.length - 1 : -1) : -1);

  /** The player's speed and captions as they were (put back at the end). */
  let was: { rate: number; cc: CcMode } | null = null;
  function play(rate: number): void {
    if (!player) return;
    was ??= { rate: player.rate, cc: player.captions };
    if (player.captions !== 'off') player.setCaptions('off');
    if (player.rate !== rate) player.setRate(rate);
    player.play(line.seg[0], line.seg[1]);
  }
  onDestroy(() => {
    if (!player || !was) return;
    if (player.rate !== was.rate) player.setRate(was.rate);
    if (was.cc !== 'off') player.setCaptions(was.cc);
  });

  function listen(): void {
    heard = true;
    play(c.slow ? SLOW : 1);
  }
  function pick(i: number): void {
    const r = tap(c, line, i);
    if (r.what === 'none') return;
    const missed = r.c.miss > c.miss;
    c = r.c;
    helped = missed;
    if (missed) {
      bounce = i;
      setTimeout(() => bounce === i && (bounce = null), 450);
    }
    if (r.what === 'hint') play(SLOW);
    if (r.what === 'done') {
      reward = true;
      oncaught(howOf(r.c));
      play(1);
    }
  }
  const placed = (k: number) => c.used[k];
</script>

<article class="card pad cl" data-en-catch={line.q} data-state={complete ? 'done' : heard ? 'build' : 'ready'}>
  {@render head()}
  {#if !heard}
    <p class="how"><Phrases text={s('catchHow')} /></p>
    <button type="button" class="btn sky go" data-sfx="tick" disabled={!player || player.state === 'loading'} data-en-catch-play onclick={listen}>
      <Icon name="play" />{s('catchPlay')}
    </button>
  {:else}
    <!-- the slots: the chunks placed so far, in the line's order; lit in time in the reward -->
    <p class="slots" lang="en" aria-live="polite" data-en-catch-slots>
      {#each line.tiles as _, k (k)}
        {@const i = placed(k)}
        <span class="slot" class:filled={i !== undefined} class:given={c.given.includes(k)} class:lit={complete && k <= lit} data-en-slot={k}>{i !== undefined ? c.all[i] : ''}</span>
      {/each}
    </p>
    {#if !complete}
      {#if helped}<p class="note" data-en-catch-help><Phrases text={s('catchSlow')} /></p>{/if}
      <div class="tiles" lang="en">
        {#each c.order as i (i)}
          {@const used = c.used.includes(i)}
          <button type="button" class="chip big tile" class:used class:bounce={bounce === i} aria-disabled={used || undefined} data-sfx="tick" data-tile={c.all[i]} onclick={() => pick(i)}>{c.all[i]}</button>
        {/each}
      </div>
      <button type="button" class="btn small paper again" data-sfx="tick" data-en-catch-again onclick={listen}><Icon name="play" size={18} />{s('catchAgain')}</button>
    {:else if how}
      <div class="won" data-en-catch-done={clean(how) ? 'clean' : 'helped'}>
        <p class="rhead">{clean(how) ? s('catchClean') : s('catchCaught')}</p>
        <p class="ja" data-en-catch-ja><b>{s('catchMean')}</b>{line.ja}</p>
        <button type="button" class="btn small paper" data-sfx="tick" data-en-catch-replay onclick={() => ((reward = true), play(1))}><Icon name="play" size={18} />{s('catchDone')}</button>
      </div>
      {@render after?.(how)}
    {/if}
  {/if}
</article>

<style>
  .cl { display: grid; gap: 10px; flex: none; }
  p { margin: 0; }
  .how { font-size: var(--fs-body); }
  .go { margin: 0; }
  /* the slots: a sentence being built, one underline a chunk; filled, the chunk on cream; lit, yuzu (the karaoke) */
  .slots { display: flex; flex-wrap: wrap; gap: 8px 6px; min-height: 48px; padding: 8px 10px; border-radius: var(--r-row); background: var(--c-sunk); }
  .slot { display: inline-flex; align-items: center; min-width: 44px; min-height: 36px; padding: 0 10px; border-radius: 10px;
    font: 700 var(--fs-talk)/1.2 var(--font-ui); color: var(--c-ink); box-shadow: inset 0 -2.5px 0 color-mix(in srgb, var(--c-edge) 45%, transparent); }
  .slot.filled { background: var(--c-card); box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-edge) 50%, transparent); animation: drop 180ms var(--ease-out); }
  .slot.given { background: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); }
  .slot.lit { background: var(--c-yuzu); box-shadow: inset 0 0 0 1.5px var(--c-yuzu-lip), 0 2px 0 var(--c-yuzu-lip); transition: background 120ms; }
  .tiles { display: flex; flex-wrap: wrap; gap: 10px 8px; }
  .tile { font-size: var(--fs-talk); min-height: 48px; padding: 0 16px; }
  /* placed: its ghost stays, so the tray never reflows under the next tap */
  .tile.used { opacity: 0.3; box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--c-edge) 40%, transparent); color: transparent; pointer-events: none; }
  .tile.bounce { animation: nudge 420ms var(--ease-out); }
  .note { padding: 8px 12px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); font-size: var(--fs-s); }
  .btn { margin: 0; }
  .btn.small { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
  .won { display: grid; gap: 8px; padding: 12px; border-radius: var(--r-row); background: var(--ok-bg); box-shadow: inset 0 0 0 2px var(--ok-edge); }
  .rhead { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--leaf-text); }
  .ja { font-size: var(--fs-body); }
  .ja b { display: block; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  @keyframes drop { from { transform: translateY(-6px); opacity: 0.4; } }
  /* a tile out of order: a small hop back into the tray, never a shake of "no" */
  @keyframes nudge { 0% { transform: translateY(0); } 35% { transform: translateY(-10px); } 70% { transform: translateY(2px); } 100% { transform: none; } }
</style>
