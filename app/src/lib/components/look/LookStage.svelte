<script lang="ts" module>
  /** The 「↔ まわせるよ」 hint shows until the first drag of the session. */
  let turned = $state(false);
</script>

<script lang="ts">
  // すがた's stage (design/avatar/sugata-ux.md §3.2): the final form, always (the 3D player or the villager's official
  // render: LookPreview), with the status pill (top-left, in words), もどす under it once anything changed this visit, the
  // nameplate 「ウェイ ✎」 (top-right: the name sheet), and along its bottom edge the colour dots of what was tapped last
  // (the level's snippet; they never move the grid). Three heights: 262 (full), 150 when the panel under it scrolls
  // (compact), and a 76 px strip (a head, the name, what it is) while the villager search has the keyboard. The figure
  // scales with a transform (the canvas keeps its size: no new frame buffer as it eases).
  import type { Snippet } from 'svelte';
  import type { Who } from '#lib/types.ts';
  import type { Look } from '#lib/contract/look.ts';
  import LookPreview from './LookPreview.svelte';
  import LookPortrait from './LookPortrait.svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    who: Who;
    /** The look shown (a villager look names its villager). */
    look: Look;
    /** The status pill's words, and whether it's いつもの (its star). */
    status: string;
    star: boolean;
    /** The person's name (the nameplate). */
    name: string;
    /** What the strip says: its title (the villager's name, else the person's) and under it (the villager's kind, or
     *  the status). */
    title: string;
    kind: string;
    mode: 'full' | 'compact' | 'strip';
    changed: boolean;
    onrevert: () => void;
    onname: () => void;
    /** The colour dots (none: hidden). */
    dots?: Snippet;
  }
  let { who, look, status, star, name, title, kind, mode, changed, onrevert, onname, dots }: Props = $props();

  const H = { full: 262, compact: 150, strip: 76 } as const;
  /** The figure's box (unscaled), and the room it gets: under the pill when full, the dots' 56 px off the bottom. */
  const FIG = 214;
  const top = $derived(mode === 'full' ? 40 : 6);
  const room = $derived(H[mode] - top - 8 - (dots ? 56 : 0));
  const scale = $derived(Math.max(0.2, Math.min(1, room / FIG)));
</script>

<div class="stage" class:strip={mode === 'strip'} style:--h="{H[mode]}px" data-look-stage={mode}>
  <div class="figure" role="img" aria-label={t('look.stageLabel', { name, status })} style:--top="{top}px" style:--k={scale}>
    <LookPreview {who} {look} onturn={() => (turned = true)} />
  </div>
  {#if mode === 'strip'}
    <div class="row" aria-hidden="true">
      <LookPortrait {who} {look} size={56} />
      <span class="who"><b>{title}</b><small>{kind}</small></span>
    </div>
  {:else}
    <p class="status" role="status" data-look-status>{#if star}<span class="star" aria-hidden="true">★</span>{/if}{status}</p>
    {#if changed}
      <button type="button" class="btn small paper revert" data-look-revert aria-label={t('look.revertLabel')} data-sfx="back" onclick={onrevert}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 4 9l5 5M4.5 9H14a6 6 0 0 1 0 12h-2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
        {t('look.revert')}
      </button>
    {/if}
    <button type="button" class="plate" data-look-name-edit aria-label={t('look.nameEdit')} data-sfx="open" onclick={onname}>
      <span class="pn">{name}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l4-1L19 8l-3-3L5 16z" /></svg>
    </button>
    {#if !turned && !dots && mode === 'full' && look.kind === 'player'}
      <span class="hint" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4" /></svg>{t('look.turnHint')}</span>
    {/if}
    {#if dots}<div class="dots">{@render dots()}</div>{/if}
  {/if}
</div>

<style>
  .stage {
    flex: none; position: relative; height: var(--h); border-radius: var(--r-card); background: var(--c-cream);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); overflow: hidden; transition: height var(--dur-base) var(--ease-soft);
  }
  /* the figure's box keeps its size; it's scaled into the room it has (a transform: no new frame buffer) */
  .figure {
    position: absolute; left: 0; right: 0; top: var(--top); height: 214px; transform: scale(var(--k)); transform-origin: top center;
    transition: transform var(--dur-base) var(--ease-soft), top var(--dur-base) var(--ease-soft), opacity var(--dur-quick);
  }
  .strip .figure { opacity: 0; pointer-events: none; }
  .row { position: absolute; inset: 0; display: flex; align-items: center; gap: 12px; padding: 0 14px; }
  .who { display: grid; gap: 4px; min-width: 0; }
  .who b { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--c-ink); }
  .who small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .status {
    position: absolute; left: 10px; top: 10px; margin: 0; max-width: calc(100% - 150px); display: inline-flex; align-items: center; gap: 4px;
    padding: 6px 12px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-lip);
    font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .star { color: var(--c-yuzu-lip); }
  .revert { position: absolute; left: 10px; top: 46px; margin: 0; min-height: 40px; }
  .revert::after { content: ''; position: absolute; inset: -2px; }
  .revert svg { width: 18px; height: 18px; }
  .plate {
    appearance: none; border: 0; cursor: pointer; position: absolute; right: 10px; top: 8px; max-width: 140px; min-height: 40px;
    display: inline-flex; align-items: center; gap: 6px; padding: 0 12px; border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--c-ink); background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip);
    transform: rotate(-3deg);
  }
  .plate::after { content: ''; position: absolute; inset: -4px -2px; }
  .plate:active { transform: rotate(-3deg) translateY(2px); box-shadow: 0 1px 0 var(--c-yuzu-lip); }
  .plate:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .pn { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .plate svg { width: 14px; height: 14px; flex: none; fill: none; stroke: var(--c-ink); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .hint {
    position: absolute; right: 12px; bottom: 10px; display: flex; align-items: center; gap: 4px; pointer-events: none;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); opacity: .8;
  }
  .hint svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .dots {
    position: absolute; left: 10px; right: 10px; bottom: 8px; min-height: 48px; display: flex; align-items: center; justify-content: center;
    border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-card) 94%, transparent); box-shadow: inset 0 0 0 2px var(--c-lip);
    overflow: auto hidden; scrollbar-width: none;
  }
  .dots::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) {
    .stage, .figure { transition: none; }
  }
</style>
