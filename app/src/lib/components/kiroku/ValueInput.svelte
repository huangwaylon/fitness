<script lang="ts">
  // Type a number for きろく: a weight (ADR 0020: decimal, 20–300 kg) or the Move goal (ADR 0021: whole kcal, 100–2,000).
  // A 16px+ field (iOS doesn't zoom) with the right keypad (`inputmode`), the old value grey, then NH's choice list
  // ▶ けってい / (目標をなくす) / やめる. `parse` turns the text into a value or null (shown as the hint in coral).
  import ChoiceList from '../ui/ChoiceList.svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    label: string;
    sub: string;
    /** The value now, shown grey (null = none yet). */
    old: number | null;
    /** The field's unit and keypad: kg (decimal) or kcal (numeric). */
    unit: 'kg' | 'kcal';
    parse: (text: string) => number | null;
    /** The allowed range, in words. */
    hint: string;
    onok: (v: number) => void;
    oncancel: () => void;
    /** An extra choice under けってい (目標をなくす). */
    extra?: { label: string; run: () => void } | null;
  }
  let { label, sub, old, unit, parse, hint, onok, oncancel, extra = null }: Props = $props();
  let text = $state('');
  let tried = $state(false);
  const v = $derived(parse(text));
  const bad = $derived(tried && v === null);
  const oldText = $derived(old === null ? null : unit === 'kg' ? old.toFixed(1) : String(old));
  let input: HTMLInputElement | undefined = $state();
  $effect(() => input?.focus());

  function ok() {
    tried = true;
    if (v !== null) onok(v);
  }
</script>

<form class="wi" onsubmit={(e) => { e.preventDefault(); ok(); }}>
  <div class="screen card">
    <label class="top" for="wi-v"><b>{label}</b>{#if sub}<span class="sub money">{sub}</span>{/if}{#if oldText !== null}<span class="old money">({oldText} {unit})</span>{/if}</label>
    <div class="field">
      <input id="wi-v" data-sfx="none" bind:this={input} bind:value={text} type="text" inputmode={unit === 'kg' ? 'decimal' : 'numeric'}
        autocomplete="off" enterkeyhint="done" placeholder={oldText ?? (unit === 'kg' ? '00.0' : '000')} aria-invalid={bad}
        aria-describedby="wi-hint" maxlength="6" size="6" />
      <span class="unit" aria-hidden="true">{unit}</span>
    </div>
    <p id="wi-hint" class="hint" class:bad>{hint}</p>
  </div>
  <div class="choose" class:off={v === null}>
    <ChoiceList choices={[
      { label: t('kiroku.ok'), run: ok },
      ...(extra ? [extra] : []),
      { label: t('kiroku.cancel'), run: oncancel, cancel: true }
    ]} />
  </div>
</form>

<style>
  .wi { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
  .screen { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; padding: 14px 16px 12px; min-width: 0; }
  .top { display: flex; align-items: baseline; gap: 10px; font-size: var(--fs-body); flex-wrap: wrap; }
  .sub { color: var(--text-soft); font-size: var(--fs-body); }
  .old { margin-left: auto; color: var(--text-soft); font-size: var(--fs-body); }
  .field { display: flex; align-items: baseline; gap: 8px; }
  input {
    flex: 1; min-width: 0; width: 100%; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); text-align: right;
    font: 700 max(var(--fs-input), var(--fs-hero))/1.1 var(--font-num); color: var(--text); background: var(--ctl);
    box-shadow: inset 0 0 0 2px var(--edge); font-variant-numeric: tabular-nums;
  }
  input::placeholder { color: color-mix(in srgb, var(--text-soft) 55%, transparent); }
  input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  input[aria-invalid='true'] { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .unit { font: 700 var(--fs-talk)/1 var(--font-num); color: var(--text-soft); }
  .hint { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .hint.bad { color: var(--text); }
  .hint.bad::before { content: '! '; color: var(--c-coral); }
  .choose { display: flex; justify-content: flex-end; }
  .choose.off :global(.choice:first-child) { opacity: .5; }
</style>
