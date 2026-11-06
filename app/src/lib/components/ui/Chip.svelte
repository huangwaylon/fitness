<script lang="ts">
  // A small chip (docs/design.md "Unified kit"; theme.css `.chip.s`): 32px drawn in a 44px hit, the small edge; the
  // selected one yuzu. An optional colour dot (a day's; coral for 期限切れ) and count. Data attributes pass through
  // (`data-day`, what the specs read). A tap on the selected one is silent (it is already shown).
  //   <Chip label="1日目" dot={color} selected={day === 1} onclick={…} data-day="1" />
  interface Props {
    label: string;
    selected?: boolean;
    /** A small number after the label (すべて 26). */
    count?: number | string;
    /** A colour dot before the label (any CSS colour). */
    dot?: string;
    onclick: () => void;
    [attr: `data-${string}`]: string | number | boolean | undefined;
  }
  let { label, selected = false, count, dot, onclick, ...rest }: Props = $props();
</script>

<button type="button" class="chip s" aria-pressed={selected} {...rest} data-sfx={selected ? 'none' : 'tick'} {onclick}>
  {#if dot}<span class="dot" style:--dot={dot}></span>{/if}<span>{label}</span>{#if count !== undefined}<span class="n">{count}</span>{/if}
</button>
