<script lang="ts">
  // A round's verdict at its reveal (docs/kikimimi.md "The game"; framework §5 RevealFrame): sat out, ○ right (+its
  // points) or × wrong / time up, and the 「いっぱつ！」 stamp (a badge, no points); co-op, how many of us got it (never
  // who). A game may say its own line in place of ○ / × (`line`: スピード はしご's climb) and add under it (`extra`).
  // Solo, よみきき サンド's 「読んでから もう一度」 under it (`sand`: never in a game of several, it'd hold up their つぎへ).
  import type { Snippet } from 'svelte';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import type { SandPlayer } from './Sandwich.svelte';
  import SandButton from './SandButton.svelte';
  import FirstStamp from './FirstStamp.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { out, right, picked, pts, badge = false, coop, rightNow, line, extra, sand }: {
    /** I sat this round out. */
    out: boolean;
    right: boolean;
    /** I answered (else time ran out). */
    picked: boolean;
    /** A right answer's points (+100; 0: none shown, みみ チェック's). */
    pts: number;
    /** いっぱつ: right on the first listen (a stamp, no points). */
    badge?: boolean;
    coop: boolean;
    /** Co-op: how many got it right. */
    rightNow: number;
    line?: Snippet;
    extra?: Snippet;
    /** A solo game's item and clips: サンド offered. */
    sand?: { it: Item; player: SandPlayer };
  } = $props();
  const verdict = $derived(out ? 'out' : right ? 'right' : picked ? 'wrong' : 'none');
</script>

<div class="verdict" class:ok={right} data-kiki-verdict={verdict}>
  {#if out}<p>{t('kiki.out')}</p>
  {:else}
    {#if line}{@render line()}
    {:else}
      <p>
        {#if right}<span class="sym" aria-hidden="true">○</span>{t('kiki.right')}{#if pts} <b>+{pts}</b>{/if}
        {:else}<span class="sym" aria-hidden="true">×</span>{picked ? t('kiki.wrong') : t('kiki.timeUp')}{/if}
        {#if badge}<FirstStamp pop data-kiki-bonus />{/if}
      </p>
    {/if}
    {#if coop}<span class="team-now" data-kiki-team-now={rightNow}>{rightNow ? t('kiki.teamNow', { n: rightNow }) : t('kiki.teamNone')}</span>{/if}
    {@render extra?.()}
    {#if sand}<SandButton it={sand.it} player={sand.player} />{/if}
  {/if}
</div>

<style>
  .verdict { display: grid; justify-items: center; gap: 6px; }
  /* on the panel: the themed coral and leaf text (night's light ones); a game's own line (`line`) styles its own the same */
  .verdict p { margin: 0; display: flex; align-items: baseline; justify-content: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  .verdict.ok p { color: var(--leaf-text); }
  .verdict b { font-family: var(--font-num); }
  .verdict .sym { font-size: 1.2em; }
  /* 一発 (frame/FirstStamp) sits beside the +100, on its line: a row of its own left a gap over 解説 */
  /* co-op: how many of us got it (never who) */
  .team-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }
</style>
