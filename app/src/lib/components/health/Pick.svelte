<script lang="ts" generics="T extends string">
  // One native dropdown pill (けんこう's row 1, ごはん's whose day and グラフ's period): iOS's own picker, a cream pill
  // ≥ 44px with a chevron, 16px type so Safari doesn't zoom. `kind` names it (`.dd.who`, `data-pick="who"`, `data-who`
  // the value: what the specs read). With `person` it is whose data: their avatar and a stroke of their colour.
  // `compact`: the title bar's (NavBar's lead, left of けんこう / ごはん): a smaller avatar, the name as wide as it is.
  import type { Who } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';

  interface Props {
    kind: 'who' | 'period';
    value: T;
    options: readonly { id: T; label: string }[];
    /** The accessible name (「だれの データ」, 「きかん」). */
    label: string;
    onpick: (v: T) => void;
    /** Whose data: the avatar and the swatch. */
    person?: { p: Who; villager: string | null } | null;
    compact?: boolean;
  }
  let { kind, value, options, label, onpick, person = null, compact = false }: Props = $props();
</script>

<label class="dd {kind}" class:compact {...{ [`data-${kind}`]: value }}>
  <span class="sr-only">{label}</span>
  {#if person}<span class="av" aria-hidden="true"><Avatar worn person={person.p} villager={person.villager} size={compact ? 24 : 28} /></span>{/if}
  <select data-pick={kind} class:withav={!!person} {value} data-sfx="none" onchange={(e) => onpick(e.currentTarget.value as T)}>
    {#each options as o (o.id)}<option value={o.id}>{o.label}</option>{/each}
  </select>
  {#if person}<i class="sw p{person.p}" aria-hidden="true"></i>{/if}
  <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 L8 10.5 L12.5 6" /></svg>
</label>

<style>
  .dd {
    position: relative; display: flex; align-items: center; min-width: 0; min-height: var(--hit);
    border-radius: var(--r-pill); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl);
  }
  .dd:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .dd:has(select:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the native select fills the pill (its whole face is the tap target); the avatar, the swatch and the chevron are
     drawn over it and let taps through */
  select {
    appearance: none; -webkit-appearance: none; border: 0; margin: 0; background: transparent; color: inherit; cursor: pointer;
    width: 100%; min-width: 0; height: var(--hit); padding: 0 34px 0 16px; border-radius: inherit;
    font: 700 var(--fs-input)/1 var(--font-ui); text-overflow: ellipsis; white-space: nowrap; outline: none;
  }
  select.withav { padding-left: 46px; }
  .av { position: absolute; left: 10px; top: 50%; translate: 0 -50%; display: flex; pointer-events: none; }
  .chev { position: absolute; right: 12px; top: 50%; translate: 0 -50%; width: 16px; height: 16px; pointer-events: none;
    fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  /* the person's colour (their bars), a short stroke under the name */
  .sw { position: absolute; left: 46px; bottom: 6px; width: 24px; height: 3px; border-radius: 2px; pointer-events: none; }
  .sw.pA { background: var(--person-a); }
  .sw.pB { background: var(--person-b); }
  .sw.pG { background: var(--c-lilac); }
  /* the title bar's: as wide as the name (up to its side of the bar), the avatar and the chevron tighter */
  .compact { max-width: 100%; }
  .compact select { width: auto; max-width: 100%; padding: 0 28px 0 12px; }
  .compact select.withav { padding-left: 38px; }
  .compact .av { left: 8px; }
  .compact .chev { right: 9px; width: 14px; height: 14px; }
  .compact .sw { left: 38px; width: 20px; }
  /* a narrow phone (320): the name before the avatar (the stroke still says whose colour) */
  @container navbar (max-width: 340px) {
    .compact .av { display: none; }
    .compact select.withav { padding: 0 24px 0 12px; }
    .compact .sw { left: 12px; }
    .compact .chev { right: 8px; }
  }
</style>
