<script lang="ts">
  // Next week's promise: day chips Mon–Sun (bitmask Mon=1 … Sun=64), a kind, an optional short note.
  import type { PromiseKind } from '#lib/types.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    daysMask: number;
    kind: PromiseKind;
    note: string;
    /** Night-styled (Sunday overlay). */
    night?: boolean;
  }
  let { daysMask = $bindable(), kind = $bindable(), note = $bindable(), night = false }: Props = $props();

  const KINDS: PromiseKind[] = ['gym', 'pt', 'walk', 'any'];
  const DAYS = [1, 2, 3, 4, 5, 6, 7];

  function toggleDay(d: number) {
    daysMask ^= 1 << (d - 1);
  }
</script>

<div class="pe" class:night>
  <div class="days" role="group" aria-label={t('promise.next')}>
    {#each DAYS as d (d)}
      {@const on = (daysMask & (1 << (d - 1))) !== 0}
      <button type="button" class="day" aria-pressed={on} onclick={() => toggleDay(d)}>{t('weekday.' + d)}</button>
    {/each}
  </div>
  <div class="kinds" role="radiogroup" aria-label={t('promise.title')}>
    {#each KINDS as k (k)}
      <button type="button" class="chip" role="radio" aria-checked={kind === k} onclick={() => (kind = k)}>{t('promise.kind.' + k)}</button>
    {/each}
  </div>
  <input class="note" type="text" maxlength="24" placeholder={t('promise.note')} aria-label={t('promise.note')} bind:value={note} enterkeyhint="done" />
</div>

<style>
  .pe { display: grid; gap: 10px; }
  .days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 5px; }
  .day {
    appearance: none; cursor: pointer; min-height: 44px; border-radius: var(--r-sm); border: 2px solid var(--edge);
    background: var(--surface); color: var(--text-soft); font-weight: 700; font-size: var(--fs-caption); padding: 0;
  }
  .day[aria-pressed='true'] { background: var(--sky-pale); border-color: var(--sky); color: var(--ink); }
  .kinds { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .kinds .chip { padding: 0 6px; font-size: var(--fs-caption); }
  .note {
    min-height: 48px; border-radius: var(--r-sm); border: 2px solid var(--edge); background: var(--surface); color: var(--text);
    padding: 0 14px; width: 100%;
  }
  .note::placeholder { color: var(--text-faint); }
  .night .day, .night .chip, .night .note { background: rgba(51, 69, 107, .9); border-color: var(--night-edge); color: var(--night-ink); }
  .night .day[aria-pressed='true'], .night .chip[aria-checked='true'] { background: var(--moon); border-color: var(--moon); color: var(--ink); }
</style>
