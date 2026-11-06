<script lang="ts">
  // A question's verdict at its reveal (docs/kikimimi.md "The game"): sat out, ○ right (+100) or × wrong / time up, and
  // the 「いっぱつ！」 stamp (a badge, no points); a スピード はしご rung's climb instead (climbed +100, right but held, or
  // stopped); co-op, how many of us got it (never who); a missed picture's name.
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { PIC_JA } from '#lib/kikimimi/bank.ts';
  import { RUNG_POINTS, SPEEDS, sx, type rungState } from '#lib/kikimimi/ladder.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import { t } from '#lib/i18n/index.ts';

  let { it, out, right, picked, replayed, same, rs, climbed, coop, rightNow }: {
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
  } = $props();
  const verdict = $derived(out ? 'out' : right ? 'right' : picked ? 'wrong' : 'none');
</script>

<div class="verdict" class:ok={right} data-kiki-verdict={verdict}>
  {#if out}<p>{t('kiki.out')}</p>
  {:else}
    {#if rs}
      <!-- a rung: climbed (+100), or right but not climbed (a replay, or the ladder stopped under it), or missed -->
      <p data-kiki-climb={climbed ? 'up' : right ? 'held' : 'stop'}>
        {#if right}<span class="sym" aria-hidden="true">○</span>{t('kiki.right')}{#if climbed} <b>+{RUNG_POINTS}</b>{/if}
        {:else}<span class="sym" aria-hidden="true">×</span>{picked ? t('kiki.wrong') : t('kiki.timeUp')}{/if}
      </p>
      <span class="climb" class:up={climbed}>
        {#if climbed}{t(rs.n === rs.of ? 'kiki.rung.top' : 'kiki.rung.up', { x: sx(SPEEDS[rs.n - 1]) })}
        {:else if right && rs.open}{t('kiki.rung.replayed')}
        {:else if rs.open}{t('kiki.rung.stop', { x: sx(SPEEDS[rs.n - 1]) })}
        {:else}{t('kiki.rung.held')}{/if}
      </span>
    {:else}
      <p>
        {#if right}<span class="sym" aria-hidden="true">○</span>{t('kiki.right')} <b>+{RIGHT}</b>
        {:else}<span class="sym" aria-hidden="true">×</span>{picked ? t('kiki.wrong') : t('kiki.timeUp')}{/if}
      </p>
      {#if firstListen(right, replayed, same)}<span class="bonus" data-kiki-bonus>{t('kiki.firstTry')}</span>{/if}
    {/if}
    {#if coop}<span class="team-now" data-kiki-team-now={rightNow}>{rightNow ? t('kiki.teamNow', { n: rightNow }) : t('kiki.teamNone')}</span>{/if}
    {#if !right && it.type === 'pic'}<span class="answer-is">{t('kiki.answerIs', { a: PIC_JA[it.choices[it.answer]] ?? '' })}</span>{/if}
  {/if}
</div>

<style>
  .verdict { display: grid; justify-items: center; gap: 6px; }
  /* on the panel: the themed coral and leaf text (night's light ones) */
  .verdict p { margin: 0; display: flex; align-items: baseline; justify-content: center; gap: 6px; flex-wrap: wrap; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  .verdict.ok p { color: var(--leaf-text); }
  .verdict b { font-family: var(--font-num); }
  .verdict .sym { font-size: 1.2em; }
  /* 「いっぱつ！」: a stamp beside the +100 (a badge, no points), tilted like a rubber stamp; a cream sticker at any time
     of day, so its coral is the fixed one */
  .bonus {
    padding: 4px 12px; border-radius: 8px; rotate: -6deg; background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); color: var(--c-coral-text);
    box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui); animation: pop-in 320ms var(--ease-bounce) 200ms both;
  }
  /* co-op: how many of us got it (never who) */
  .team-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .answer-is { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .climb { padding: 4px 12px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text); font: 700 var(--fs-s)/1.3 var(--font-ui); text-align: center; }
  .climb.up { background: var(--c-yuzu); color: var(--c-ink); animation: pop-in 320ms var(--ease-bounce) 200ms both; }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .bonus, .climb.up { animation: none; } }
</style>
