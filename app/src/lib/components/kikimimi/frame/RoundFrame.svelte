<script lang="ts">
  // A round's frame (docs/kikimimi.md "The game"; kikimimi-engine.md "Shared UI" RoundFrame): each player's chip (✓ as they answer; at the
  // reveal co-op only ✓, たいせん ○ / × and points), the game's stage (what's shown while it plays) and input (its
  // choices, or the verdict over them at the reveal), the answer window's bar when it's timed, the status line (しずえ's
  // word on the verdict, sat out, waiting for the others, listening), what follows (a transcript), and the foot: the
  // round's one action (`action`: ことば タイル's できた) and at the reveal, in its place, the host's 次へ (with how many
  // tapped 読み終わった), the others' 読み終わった; the host gone, anyone's 次へ. Those two are armed ARM_MS after the reveal
  // shows (sunk till then, and a tap whose press began before never counts: a double tap on できた never skips the
  // reveal). The round sits mid-screen on a tall phone (`top`: at the top, so the reveal doesn't jump). Any game's.
  import type { Snippet } from 'svelte';
  import { hook, hookFlag } from '../../island/devHooks.ts';
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

  let { v, now, me, type, answered, verdict, stage, input, after, action, top = false, onnext, onready }: {
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
    /** The round's one action in the foot (できた) while there's no 次へ / 読み終わった. */
    action?: Snippet;
    top?: boolean;
    onnext: () => void;
    onready: () => void;
  } = $props();
  const reveal = $derived(v.phase === 'reveal');
  const solo = $derived(v.players.length <= 1);
  /** Co-op (a game of several, not たいせん): no one's score or right / wrong on the others' chips, only how many got it. */
  const coop = $derived(!solo && !v.vs);

  /** 次へ / 読み終わった wait this long after the reveal shows (the e2e's `?kikimimi=fast` none, unless `&arm`). */
  const ARM_MS = hook('kikimimi') === 'fast' && !hookFlag('arm') ? 0 : 1200;
  const foot = $derived(v.canNext ? `n${v.i}` : v.canReady ? `r${v.i}` : '');
  let armedFor = $state('');
  const armed = $derived(!!foot && armedFor === foot);
  $effect(() => {
    const k = foot;
    if (!k) return;
    if (!ARM_MS) return void (armedFor = k);
    const h = setTimeout(() => (armedFor = k), ARM_MS);
    return () => clearTimeout(h);
  });
  /** The press began armed (a keyboard's click has none: detail 0). */
  let pressed = false;
  const tap = (e: MouseEvent, f: () => void) => {
    if (armed && (pressed || e.detail === 0)) f();
    pressed = false;
  };

  function chip(p: FrameView['players'][number]): 'answered' | 'right' | 'wrong' | 'away' | null {
    if (reveal) return coop ? (p.pick ? 'answered' : null) : p.pick ? (p.pick.ok ? 'right' : 'wrong') : null;
    if (p.answered) return 'answered';
    return p.here ? null : 'away';
  }
</script>

<div class="q" class:top data-kiki-q={v.i} data-type={type} data-phase={v.phase}>
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
    {#if reveal && !v.out}<span class="cheer kana"><Host head size={30} animate={false} eager />{t(`kiki.cheer.${verdict}`)}</span>
    {:else if v.out && !reveal}{t('kiki.out')}
    {:else if answered && !reveal && !solo}{t('kiki.answered')} {t('kiki.waitOthers')}
    {:else if v.phase === 'lead' || v.phase === 'play'}{t('kiki.listen')}{/if}
  </p>

  {@render after?.()}
</div>

{#if v.canNext}
  <div class="level-acts">
    <button type="button" class="btn" class:armed data-kiki-next data-kiki-ready-n={v.ready.n} aria-disabled={!armed} data-sfx="confirm"
      onpointerdown={() => (pressed = armed)} onclick={(e) => tap(e, onnext)}>
      {v.amHost && v.ready.of ? t('kiki.nextReady', { n: v.ready.n, m: v.ready.of }) : t('kiki.next')}
    </button>
  </div>
{:else if v.canReady}
  {@const done = !!v.players.find((p) => p.who === me)?.ready}
  <div class="level-acts">
    <button type="button" class="btn" class:paper={done} class:armed={armed && !done} data-kiki-ready aria-pressed={done} aria-disabled={!armed} data-sfx={done ? 'none' : 'confirm'}
      onpointerdown={() => (pressed = armed)} onclick={(e) => tap(e, () => !done && onready())}>
      {done ? t('kiki.readyWait') : `📖 ${t('kiki.readyTap')}`}
    </button>
  </div>
{:else if action}
  <div class="level-acts">{@render action()}</div>
{/if}

<style>
  /* the round takes the scroller's room, its content centred: mid-screen on a tall phone, not a gap under it */
  .q { display: grid; gap: 12px; align-content: center; }
  :global(.kk-body) > .q { flex: 1 0 auto; }
  .q.top { align-content: start; }
  .players { display: flex; justify-content: center; gap: 14px; }
  .timer { display: block; height: 6px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .timer i { display: block; height: 100%; background: var(--c-yuzu); transform-origin: 0 50%; animation: shrink linear both; }
  .status { min-height: 1.4em; margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  /* the host's word on the verdict (しずえ's head) */
  .cheer { display: inline-flex; align-items: center; gap: 8px; font-size: var(--fs-body); color: var(--text); }
  /* つぎへ: the host's one action at the foot */
  .level-acts [data-kiki-next], .level-acts [data-kiki-ready] { min-height: var(--cta-h); font-size: var(--fs-talk); }
  .level-acts [data-kiki-ready][aria-pressed='true'] { font-size: var(--fs-body); }
  /* armed: up from sunk with a pop */
  .level-acts .armed { animation: arm 150ms var(--ease-bounce); }
  @keyframes arm { from { transform: translateY(4px) scale(.96); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .level-acts .armed { animation: none; } }
  @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
</style>
