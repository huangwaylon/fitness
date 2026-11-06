<script lang="ts">
  // A round's frame (docs/kikimimi.md "The game"; framework §5 RoundFrame): each player's chip (✓ as they answer; at the
  // reveal co-op only ✓, たいせん ○ / × and points), the game's stage (what's shown while it plays) and input (its
  // choices, or the verdict over them at the reveal), the answer window's bar when it's timed, the status line (しずえ's
  // word on the verdict, sat out, waiting for the others, listening), what follows (a transcript), and the foot: the
  // host's つぎへ (with how many tapped よみおわった), the others' よみおわった; the host gone, anyone's つぎへ. The round sits
  // mid-screen on a tall phone. Any game's.
  import type { Snippet } from 'svelte';
  import type { Who } from '#lib/types.ts';
  import type { RoundPhase } from '#lib/kikimimi/round/types.ts';
  import Host from '../../characters/Host.svelte';
  import PlayerChip from './PlayerChip.svelte';
  import { t } from '#lib/i18n/index.ts';

  /** What the frame reads of the view (round/session.ts RoundView, a game's view of it). */
  interface FrameView {
    i: number;
    phase: RoundPhase;
    vs: boolean;
    out: boolean;
    amHost: boolean;
    playEnd: number;
    limit: number;
    canNext: boolean;
    canReady: boolean;
    ready: { n: number; of: number };
    players: { who: Who; here: boolean; answered: boolean; ready: boolean; score: number; pick?: { ok: boolean } }[];
  }

  let { v, now, me, type, answered, verdict, stage, input, after, onnext, onready }: {
    v: FrameView;
    /** The relay's clock (the bar's place). */
    now: number;
    me: Who;
    /** What sort of round it is, on the element (`data-type`: the quiz's item type). */
    type: string;
    /** I answered this round. */
    answered: boolean;
    /** The reveal's verdict (しずえ's word on it): sat out, right, wrong or none (time up). */
    verdict: 'out' | 'right' | 'wrong' | 'none';
    stage: Snippet;
    input: Snippet;
    after?: Snippet;
    onnext: () => void;
    onready: () => void;
  } = $props();
  const reveal = $derived(v.phase === 'reveal');
  const solo = $derived(v.players.length <= 1);
  /** Co-op (a game of several, not たいせん): no one's score or right / wrong on the others' chips, only how many got it. */
  const coop = $derived(!solo && !v.vs);

  function chip(p: FrameView['players'][number]): 'answered' | 'right' | 'wrong' | 'away' | null {
    if (reveal) return coop ? (p.pick ? 'answered' : null) : p.pick ? (p.pick.ok ? 'right' : 'wrong') : null;
    if (p.answered) return 'answered';
    return p.here ? null : 'away';
  }
</script>

<div class="q" data-kiki-q={v.i} data-type={type} data-phase={v.phase}>
  {#if !solo}
    <div class="players">
      {#each v.players as p (p.who)}<PlayerChip who={p.who} state={chip(p)} ready={p.ready} note={coop ? null : t('kiki.points', { n: p.score })} size={36} />{/each}
    </div>
  {/if}

  {@render stage()}
  {@render input()}

  {#if v.phase === 'answer' && Number.isFinite(v.limit)}
    <span class="timer" aria-hidden="true">{#key `${v.i}:${v.playEnd}`}<i style:animation-duration="{Math.max(1, v.limit - v.playEnd)}ms" style:animation-delay="{-Math.max(0, now - v.playEnd)}ms"></i>{/key}</span>
  {/if}

  <p class="status" role="status">
    {#if reveal && !v.out}<span class="cheer"><Host head size={30} animate={false} eager />{t(`kiki.cheer.${verdict}`)}</span>
    {:else if v.out && !reveal}{t('kiki.out')}
    {:else if answered && !reveal && !solo}{t('kiki.answered')} {t('kiki.waitOthers')}
    {:else if v.phase === 'lead' || v.phase === 'play'}{t('kiki.listen')}{/if}
  </p>

  {@render after?.()}
</div>

{#if v.canNext}
  <div class="level-acts">
    <button type="button" class="btn" data-kiki-next data-kiki-ready-n={v.ready.n} data-sfx="confirm" onclick={onnext}>
      {v.amHost && v.ready.of ? t('kiki.nextReady', { n: v.ready.n, m: v.ready.of }) : t('kiki.next')}
    </button>
  </div>
{:else if v.canReady}
  {@const done = !!v.players.find((p) => p.who === me)?.ready}
  <div class="level-acts">
    <button type="button" class="btn" class:paper={done} data-kiki-ready aria-pressed={done} data-sfx={done ? 'none' : 'confirm'} onclick={() => !done && onready()}>
      {done ? t('kiki.readyWait') : `📖 ${t('kiki.readyTap')}`}
    </button>
  </div>
{/if}

<style>
  /* the round takes the scroller's room, its content centred: mid-screen on a tall phone, not a gap under it */
  .q { display: grid; gap: 12px; align-content: center; }
  :global(.kk-body) > .q { flex: 1 0 auto; }
  .players { display: flex; justify-content: center; gap: 14px; }
  .timer { display: block; height: 6px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .timer i { display: block; height: 100%; background: var(--c-yuzu); transform-origin: 0 50%; animation: shrink linear both; }
  .status { min-height: 1.4em; margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* the host's word on the verdict (しずえ's head) */
  .cheer { display: inline-flex; align-items: center; gap: 8px; font-size: var(--fs-body); color: var(--text); }
  /* つぎへ: the host's one action at the foot */
  .level-acts [data-kiki-next], .level-acts [data-kiki-ready] { min-height: var(--cta-h); font-size: var(--fs-talk); }
  .level-acts [data-kiki-ready][aria-pressed='true'] { font-size: var(--fs-body); }
  @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
</style>
