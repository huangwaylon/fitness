<script lang="ts">
  // A round's verdict at its reveal (docs/kikimimi.md "The game"; framework §5 RevealFrame): sat out, ○ right (+its
  // points) or × wrong / time up, and the 「いっぱつ！」 stamp (a badge, no points); co-op, how many of us got it (never
  // who). A game may say its own line in place of ○ / × (`line`: スピード はしご's climb) and add under it (`extra`).
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';

  let { out, right, picked, pts, badge = false, coop, rightNow, line, extra }: {
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
        {#if badge}<span class="bonus obj-cream" data-kiki-bonus>{t('kiki.firstTry')}</span>{/if}
      </p>
    {/if}
    {#if coop}<span class="team-now" data-kiki-team-now={rightNow}>{rightNow ? t('kiki.teamNow', { n: rightNow }) : t('kiki.teamNone')}</span>{/if}
    {@render extra?.()}
  {/if}
</div>

<style>
  .verdict { display: grid; justify-items: center; gap: 6px; }
  /* on the panel: the themed coral and leaf text (night's light ones); a game's own line (`line`) styles its own the same */
  .verdict p { margin: 0; display: flex; align-items: baseline; justify-content: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  .verdict.ok p { color: var(--leaf-text); }
  .verdict b { font-family: var(--font-num); }
  .verdict .sym { font-size: 1.2em; }
  /* 「いっぱつ！」: a stamp beside the +100, on its line (a row of its own left a gap over 解説); a badge, no points, tilted
     like a rubber stamp; a cream sticker at any time of day (.obj-cream: the day coral) */
  .bonus {
    align-self: center; padding: 4px 12px; border-radius: 8px; rotate: -6deg; background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); color: var(--coral-text);
    box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui); animation: pop-in 320ms var(--ease-bounce) 200ms both;
  }
  /* co-op: how many of us got it (never who) */
  .team-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .bonus { animation: none; } }
</style>
