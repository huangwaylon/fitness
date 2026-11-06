<script lang="ts">
  // A question's choices (docs/kikimimi.md "The game"): dimmed until the first play ends, then one final tap; mine
  // marked as picked; at the reveal ○ on the right one and × on my wrong pick (a dialogue's: only those two, so the
  // transcript under them is never under the sticky つぎへ). Pictures in a 2×2 grid (named in Japanese for VoiceOver).
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { PIC_JA } from '#lib/kikimimi/bank.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { it, open, reveal, dim, picked, onlyMarked = false, onpick }: {
    it: Item;
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
    if (reveal) return k === it.answer ? 'right' : picked === k ? 'wrong' : null;
    return picked === k ? 'mine' : null;
  }
</script>

<div class="choices" class:pics={it.type === 'pic'} class:dim role="group" aria-label={t('kiki.pick')}>
  {#each it.choices as c, k (k)}
    {@const m = mark(k)}
    {#if !onlyMarked || m}
    <button type="button" class="ch tile-btn" data-choice={k} data-mark={m ?? undefined} aria-pressed={picked === k}
      aria-disabled={!open} aria-label={it.type === 'pic' ? (PIC_JA[c] ?? '') : undefined} data-sfx={open ? 'choice-pick' : 'none'}
      onclick={() => open && onpick(k)}>
      {#if it.type === 'pic'}<OfficialArt key={c} size="min(22vw, 92px)" eager />{:else}<span class="tx" lang={it.type === 'num' || (it.rung && it.type !== 'word') ? undefined : 'en'}>{c}</span>{/if}
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
  @media (prefers-reduced-motion: reduce) { .choices { transition: none; } }
</style>
