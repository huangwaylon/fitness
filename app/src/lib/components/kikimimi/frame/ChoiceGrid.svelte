<script lang="ts">
  // A round's choices (docs/kikimimi.md "The game"; framework §5 ChoiceGrid): dimmed until the first play ends, then one
  // final tap; mine marked as picked; at the reveal ○ on the right one and × on my wrong pick (`onlyMarked`: only those
  // two, a dialogue's, so the transcript under them is never under the sticky つぎへ). Text, or pictures (art keys) in a
  // 2×2 grid, each named for VoiceOver (`label`: the English never given away). At the reveal each text choice's
  // Japanese (`ja`, the item's cja) under it, smaller.
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { choices, right, pics = false, label, english = true, ja, open, reveal, dim, picked, onlyMarked = false, onpick }: {
    choices: readonly string[];
    /** The right one (marked at the reveal). */
    right: number;
    /** Art keys, not text. */
    pics?: boolean;
    /** A choice's name for VoiceOver (a picture's), else its text is read. */
    label?: (c: string) => string;
    /** The text is English (else Japanese: a rung's questions, numbers). */
    english?: boolean;
    /** Each choice's Japanese, aligned to `choices` (shown at the reveal only). */
    ja?: readonly string[];
    /** The choices take a tap. */
    open: boolean;
    reveal: boolean;
    /** Dimmed (before the first play ends). */
    dim: boolean;
    /** My pick, or null. */
    picked: number | null;
    /** Only the marked ones (a dialogue's reveal). */
    onlyMarked?: boolean;
    onpick: (k: number) => void;
  } = $props();
  /** A choice's look: mine (picked, before the reveal), right (○), wrong (my pick, ×), or none. */
  function mark(k: number): 'mine' | 'right' | 'wrong' | null {
    if (reveal) return k === right ? 'right' : picked === k ? 'wrong' : null;
    return picked === k ? 'mine' : null;
  }
</script>

<div class="choices" class:pics class:dim role="group" aria-label={t('kiki.pick')}>
  {#each choices as c, k (k)}
    {@const m = mark(k)}
    {#if !onlyMarked || m}
    <button type="button" class="ch tile-btn" data-choice={k} data-mark={m ?? undefined} aria-pressed={picked === k}
      aria-disabled={!open} aria-label={label?.(c)} data-sfx={open ? 'choice-pick' : 'none'}
      onclick={() => open && onpick(k)}>
      {#if pics}<OfficialArt key={c} size="min(22vw, 92px)" eager />{:else}<span class="tx" lang={english ? 'en' : undefined}>{c}</span>{#if reveal && ja?.[k]}<span class="cja" lang="ja" data-kiki-cja={k}>{ja[k]}</span>{/if}{/if}
      {#if m === 'right'}<span class="sym ok" aria-hidden="true">○</span>{:else if m === 'wrong'}<span class="sym ng" aria-hidden="true">×</span>{/if}
    </button>
    {/if}
  {/each}
</div>

<style>
  .choices { display: grid; gap: 10px; transition: opacity var(--dur-quick); }
  .choices.pics { grid-template-columns: 1fr 1fr; }
  .choices.dim { opacity: .5; }
  .ch {
    position: relative; min-height: clamp(56px, 8vh, 72px); padding: 10px 16px; border-radius: var(--r-card);
    display: grid; place-items: center; font: 700 max(17px, var(--fs-body))/1.3 var(--font-ui); text-align: center;
  }
  .pics .ch { aspect-ratio: 1.15; padding: 8px; }
  .ch[aria-disabled='true'] { cursor: default; }
  .ch[data-mark='mine'] { background: var(--ctl-sel); color: var(--c-ink); }
  /* the marked ones on fixed cream (any time of day): the fixed leaf and coral text */
  .ch[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 55%, var(--c-card)); color: var(--c-ink); box-shadow: inset 0 0 0 3px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); }
  .ch[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 30%, var(--c-card)); color: var(--c-ink); }
  .choices:has([data-mark='right']) .ch:not([data-mark]) { opacity: .55; }
  .ch .sym { position: absolute; top: 4px; right: 10px; font: 700 26px/1 var(--font-ui); }
  .ch .sym.ok { color: var(--c-leaf-text); }
  .ch .sym.ng { color: var(--c-coral-text); }
  .tx { overflow-wrap: anywhere; }
  /* the Japanese under it: the choice's own colour (any tile, any time of day), quieter */
  .cja { display: block; margin-top: 2px; font: 700 var(--fs-s)/1.4 var(--font-ui); opacity: .78; }
  @media (prefers-reduced-motion: reduce) { .choices { transition: none; } }
</style>
