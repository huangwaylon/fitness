<script lang="ts">
  // ジム's half-hour slot chips, 10:00…21:30 in a 6 × 4 grid (the day editor's 時間指定 and the select mode's): ■ watched
  // (inside `range`), ✓ announced; a tap is the caller's (lib/gym/calendar.ts pickSlot), 44px each.
  import Icon from '../ui/Icon.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { SLOTS, slotState } from '#lib/gym/calendar.ts';
  import type { Clock } from '#lib/gym/contract.ts';

  let { range, announced = [], onpick }: { range: readonly [Clock, Clock] | null; announced?: readonly Clock[]; onpick: (slot: Clock) => void } = $props();
</script>

<div class="slots" role="group" aria-label={t('gym.editor.slotsLabel')} data-gym-slots>
  {#each SLOTS as s (s)}
    {@const st = slotState(s, range, announced)}
    <button type="button" class="slot" class:on={st.watched} aria-pressed={st.watched} data-gym-slot={s} data-sfx="tick"
      aria-label={st.announced ? t('gym.editor.slotAnnounced', { time: s }) : s} onclick={() => onpick(s)}>
      {s}{#if st.announced}<span class="ok" aria-hidden="true"><Icon name="check" size={11} stroke={3} /></span>{/if}
    </button>
  {/each}
</div>

<style>
  .slots { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; }
  .slot {
    appearance: none; border: 0; cursor: pointer; position: relative; min-height: var(--hit); padding: 0; border-radius: var(--r-chip);
    font: 700 var(--fs-xs)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl-s);
  }
  .slot.on { background: color-mix(in srgb, var(--c-mint) 75%, var(--card)); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge); }
  .slot .ok { position: absolute; top: 2px; right: 2px; width: 14px; height: 14px; border-radius: 50%; display: grid; place-items: center; background: var(--c-gold); color: var(--c-ink); }
  .slot:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .slot:active { transform: translateY(2px); box-shadow: var(--sh-ctl-s-press); }
  @media (prefers-reduced-motion: reduce) { .slot:active { transform: none; } }
</style>
