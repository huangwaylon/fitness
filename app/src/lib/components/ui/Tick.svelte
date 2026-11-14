<script lang="ts">
  // A tick (docs/design.md "Unified kit"): a 24px circle in the edge's ring (a 44px hit); ticked = a leaf fill and a
  // white ✓ with a small pop. Who ticked it beside it (`who`: a person's dot, --person-a / -b, and name). Without
  // `onchange` it only shows (a role="img" with its label).
  //   <Tick checked={done} label="パスポート" onchange={(v) => …} who={[{ name: 'うめ', tone: 'b' }]} />
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    checked: boolean;
    /** The accessible name (what is ticked). */
    label: string;
    onchange?: (next: boolean) => void;
    who?: readonly { name: string; tone: 'a' | 'b' }[];
  }
  let { checked, label, onchange, who = [] }: Props = $props();
</script>

{#snippet ring()}<span class="ring" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M6.5 12.5 10.5 16.5 17.5 8" /></svg></span>{/snippet}

<span class="tick-wrap">
  {#if onchange}
    <button type="button" class="tick" class:on={checked} role="checkbox" aria-checked={checked} aria-label={label}
      data-sfx={checked ? 'toggle-off' : 'toggle-on'} onclick={() => onchange(!checked)}>{@render ring()}</button>
  {:else}
    <span class="tick" class:on={checked} role="img" aria-label={checked ? `${label}: ${t('common.done')}` : label}>{@render ring()}</span>
  {/if}
  {#each who as w (w.name)}<span class="who" style:--who="var(--person-{w.tone})">{w.name}</span>{/each}
</span>

<style>
  .tick-wrap { display: inline-flex; align-items: center; gap: 6px; flex: none; }
  .tick {
    position: relative; flex: none; display: grid; place-items: center; width: 24px; height: 24px; padding: 0; border: 0;
    background: none; color: inherit; -webkit-tap-highlight-color: transparent;
  }
  button.tick { cursor: pointer; }
  /* the 44px hit */
  button.tick::after { content: ''; position: absolute; inset: -10px; }
  .ring {
    width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center;
    background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge);
    transition: background-color var(--dur-quick), box-shadow var(--dur-quick);
  }
  svg { width: 16px; height: 16px; fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; opacity: 0; }
  .on .ring { background: var(--c-leaf-lip); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); animation: pop var(--dur-pop) var(--ease-bounce); }
  .on svg { opacity: 1; }
  button.tick:focus-visible { outline-offset: 2px; border-radius: 50%; }
  .who {
    display: inline-flex; align-items: center; gap: 4px; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); white-space: nowrap;
  }
  .who::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--who); }
  @keyframes pop { 0% { transform: scale(.8); } 60% { transform: scale(1.12); } 100% { transform: none; } }
</style>
