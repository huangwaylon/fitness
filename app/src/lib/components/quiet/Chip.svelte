<script lang="ts">
  // A quiet chip (docs/design.md "Quiet sheets"): 32px to the eye, a 44px hit; hairline on a card, the selected one
  // filled with the accent. An optional colour dot (a day's) and count. Data attributes pass through (`data-day`,
  // what the specs read). A tap on the selected one is silent (it is already shown).
  //   <Chip label="1日目" dot={color} selected={day === 1} onclick={…} data-day="1" />
  interface Props {
    label: string;
    selected?: boolean;
    /** A small number after the label (すべて 26). */
    count?: number | string;
    /** A colour dot before the label (a day's map colour); white on the selected chip. */
    dot?: string;
    onclick: () => void;
    [attr: `data-${string}`]: string | number | boolean | undefined;
  }
  let { label, selected = false, count, dot, onclick, ...rest }: Props = $props();
</script>

<button type="button" class="q-chip" class:on={selected} aria-pressed={selected} {...rest} data-sfx={selected ? 'none' : 'tick'} {onclick}>
  {#if dot}<span class="dot" style:background={selected ? 'var(--q-on-accent)' : dot}></span>{/if}
  <span>{label}</span>
  {#if count !== undefined}<span class="n">{count}</span>{/if}
</button>

<style>
  .q-chip {
    appearance: none; cursor: pointer; position: relative; flex: none; height: 32px; margin: 6px 0; padding: 0 12px;
    display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
    border: 1px solid var(--q-hairline); border-radius: var(--q-r-chip); background: var(--q-surface); color: var(--q-ink-2);
    font: var(--q-w) var(--q-fs-s)/1 var(--q-font); -webkit-tap-highlight-color: transparent;
  }
  /* the 44px hit around the 32px chip */
  .q-chip::after { content: ''; position: absolute; inset: -6px -4px; }
  .q-chip.on { background: var(--q-accent); border-color: var(--q-accent); color: var(--q-on-accent); font-weight: var(--q-w-b); }
  .q-chip:active { opacity: .7; }
  .q-chip:focus-visible { outline: 2px solid var(--q-accent); outline-offset: 2px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; flex: none; }
  .n { color: var(--q-muted); }
  .on .n { color: rgb(255 255 255 / .8); }
</style>
