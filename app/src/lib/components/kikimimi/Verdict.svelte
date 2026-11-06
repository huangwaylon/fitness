<script lang="ts">
  // A quiz question's verdict at its reveal (docs/kikimimi.md "The game"): the frame's (frame/RevealFrame.svelte: sat
  // out, ○ +100 or ×, いっぱつ, co-op's count), a スピード はしご rung's climb in place of ○ / × (climbed +100, right but
  // held, or stopped), and a missed picture's name.
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { PIC_JA } from '#lib/kikimimi/bank.ts';
  import { RUNG_POINTS, SPEEDS, type rungState } from '#lib/kikimimi/ladder.ts';
  import { sx } from './look.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import { t } from '#lib/i18n/index.ts';
  import RevealFrame from './frame/RevealFrame.svelte';

  let { it, out, right, picked, replayed, same, rs, climbed, coop, rightNow, plain = false }: {
    it: Item;
    /** I sat this question out. */
    out: boolean;
    right: boolean;
    /** I picked a choice (else time ran out). */
    picked: boolean;
    /** I replayed or slowed it before answering (no いっぱつ). */
    replayed: boolean;
    /** おなじへや (no いっぱつ for anyone). */
    same: boolean;
    /** A ladder rung's state (ladder.ts rungState), else null. */
    rs: ReturnType<typeof rungState> | null;
    climbed: boolean;
    coop: boolean;
    /** Co-op: how many got it right. */
    rightNow: number;
    /** No points shown (みみ チェック). */
    plain?: boolean;
  } = $props();
</script>

{#snippet climb()}
  <!-- a rung: climbed (+100), or right but not climbed (a replay, or the ladder stopped under it), or missed -->
  <p class="line" class:ok={right} data-kiki-climb={climbed ? 'up' : right ? 'held' : 'stop'}>
    {#if right}<span class="sym" aria-hidden="true">○</span>{t('kiki.right')}{#if climbed} <b>+{RUNG_POINTS}</b>{/if}
    {:else}<span class="sym" aria-hidden="true">×</span>{picked ? t('kiki.wrong') : t('kiki.timeUp')}{/if}
  </p>
  <span class="climb" class:up={climbed}>
    {#if climbed}{t(rs!.n === rs!.of ? 'kiki.rung.top' : 'kiki.rung.up', { x: sx(SPEEDS[rs!.n - 1]) })}
    {:else if right && rs!.open}{t('kiki.rung.replayed')}
    {:else if rs!.open}{t('kiki.rung.stop', { x: sx(SPEEDS[rs!.n - 1]) })}
    {:else}{t('kiki.rung.held')}{/if}
  </span>
{/snippet}
{#snippet missedPic()}
  {#if !right && it.type === 'pic'}<span class="answer-is">{t('kiki.answerIs', { a: PIC_JA[it.choices[it.answer]] ?? '' })}</span>{/if}
{/snippet}

<RevealFrame {out} {right} {picked} pts={plain ? 0 : RIGHT} badge={!rs && firstListen(right, replayed, same)} {coop} {rightNow} line={rs ? climb : undefined} extra={missedPic} />

<style>
  /* a rung's line: the frame's ○ / × line (frame/RevealFrame.svelte), the themed coral and leaf text */
  .line { margin: 0; display: flex; align-items: baseline; justify-content: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  .line.ok { color: var(--leaf-text); }
  .line b { font-family: var(--font-num); }
  .line .sym { font-size: 1.2em; }
  .answer-is { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .climb { padding: 4px 12px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text); font: 700 var(--fs-s)/1.3 var(--font-ui); text-align: center; }
  .climb.up { background: var(--c-yuzu); color: var(--c-ink); animation: pop-in 320ms var(--ease-bounce) 200ms both; }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .climb.up { animation: none; } }
</style>
