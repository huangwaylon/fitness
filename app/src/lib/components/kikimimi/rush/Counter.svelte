<script lang="ts">
  // すうじ ラッシュ's stage (RushPlay): the counter's sign, the combo meter, the line of customers (served ○, missed,
  // this one, still waiting; co-op, whose register each comes to), and this customer at the counter, bobbing while they
  // talk, their bubble the clip's bar until the reveal shows what they said (the Japanese under it).
  import type { RushCard } from '#lib/kikimimi/games/rush/def.ts';
  import ClipBar from '../scene/ClipBar.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import Mark from '../../ui/Mark.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { it, i, served, mine, combo, bar, now, pop, reveal, right, out }: {
    it: RushCard;
    /** This customer's place in the line. */
    i: number;
    /** Each customer: served (true), missed (false), to come (null). */
    served: readonly (boolean | null)[];
    /** Co-op: which customers come to my register (solo: all). */
    mine: readonly boolean[];
    combo: number;
    bar: { from: number; until: number; key: string } | null;
    now: number;
    /** The customer stepping up (the lead-in). */
    pop: boolean;
    reveal: boolean;
    /** The ticket was right (the reveal's face). */
    right: boolean;
    out: boolean;
  } = $props();
  const SIGN: Record<RushCard['rush']['at'], string> = { cafe: '☕', konbini: '🏪', ticket: '🎫', deli: '🥪', taxi: '🚕', pharmacy: '💊' };
  /** The meter's five cups: full up to the combo (past five, all full and glowing). */
  const CUPS = 5;
</script>

<div class="counter">
  <div class="top">
    <span class="sign" data-kiki-rush-at={it.rush.at}><span aria-hidden="true">{SIGN[it.rush.at]}</span> {t(`kiki.rush.at.${it.rush.at}`)}</span>
    <span class="combo" class:hot={combo >= 3} data-kiki-rush-combo={combo} aria-label={t('kiki.rush.combo', { n: combo })}>
      <span class="cups" aria-hidden="true">{#each Array.from({ length: CUPS }, (_, k) => k) as k (k)}<i class:on={k < combo}></i>{/each}</span>
      {#if combo >= 2}<b>{t('kiki.rush.combo', { n: combo })}</b>{/if}
    </span>
  </div>

  <ol class="line" aria-label={t('kiki.rush.queue')}>
    {#each served as s, k (k)}
      <li class="dot" class:now={k === i} class:theirs={!mine[k]} data-state={s === true ? 'served' : s === false ? 'missed' : k === i ? 'now' : 'wait'}>
        <span class="sr-only">{k + 1}</span>
      </li>
    {/each}
  </ol>

  <div class="at">
    <span class="who" class:pop class:talk={!!bar}>
      <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={reveal ? 56 : 64} eager />
      {#if reveal && !out}<span class="react" aria-hidden="true"><Mark id={right ? 'sparkle' : 'sweat'} /></span>{/if}
    </span>
    <div class="bubble obj-cream" class:open={reveal} aria-live="polite">
      {#if reveal}
        <p class="en" lang="en" data-kiki-en>{it.en}</p>
        <p class="ja">{it.ja}</p>
      {:else}
        <p class="notes"><span aria-hidden="true">♪…</span><span class="sr-only">{t('kiki.listen')}</span></p>
        <ClipBar {bar} {now} height={8} />
      {/if}
    </div>
  </div>
</div>

<style>
  .counter { display: grid; gap: 8px; }
  .top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .sign {
    padding: 4px 12px; border-radius: var(--r-pill); background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
    font: 700 var(--fs-s)/1.3 var(--font-ui); white-space: nowrap;
  }
  .combo { display: inline-flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text); }
  .cups { display: inline-flex; gap: 3px; }
  .cups i { width: 12px; height: 16px; border-radius: 3px 3px 6px 6px; background: color-mix(in srgb, var(--c-edge) 30%, transparent); transition: background var(--dur-quick); }
  .cups i.on { background: var(--c-yuzu); }
  .combo.hot .cups i.on { background: var(--c-coral); box-shadow: 0 0 6px color-mix(in srgb, var(--c-coral) 60%, transparent); }
  .combo.hot b { color: var(--coral-text); }

  /* the line: eight customers, this one larger; co-op, the partner's set back with a dashed ring */
  .line { list-style: none; margin: 0; padding: 0; display: flex; justify-content: center; gap: 8px; }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: color-mix(in srgb, var(--c-edge) 35%, transparent); }
  .dot.theirs { box-shadow: inset 0 0 0 2px var(--edge); background: transparent; }
  .dot[data-state='served'] { background: var(--c-leaf); }
  .dot[data-state='missed'] { background: var(--c-coral); }
  .dot.now { transform: scale(1.35); box-shadow: 0 0 0 2px var(--c-yuzu); }

  .at { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 2px; }
  .who { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .who.pop { animation: step-up 420ms var(--ease-bounce) both; }
  .who.talk { animation: bob 520ms ease-in-out infinite alternate; }
  .react { position: absolute; right: -10px; top: -12px; width: 34px; height: 34px; animation: step-up 320ms var(--ease-bounce) both; }
  .react :global(svg) { width: 100%; height: 100%; }
  .bubble {
    position: relative; min-height: 64px; display: grid; align-content: center; gap: 6px; padding: 12px 16px;
    border-radius: 28px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
  }
  .bubble::before { content: ''; position: absolute; left: -9px; top: 50%; width: 20px; height: 20px; margin-top: -10px; rotate: 45deg; background: var(--c-card); border-radius: 4px; }
  .notes { margin: 0; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }
  .en { margin: 0; font: 700 max(17px, var(--fs-talk))/1.4 var(--font-ui); position: relative; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--c-ink-soft); position: relative; word-break: normal; line-break: strict; }

  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes step-up { from { transform: translateX(-24px) scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .who.pop, .who.talk, .react { animation: none; } }
</style>
