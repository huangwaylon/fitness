<script lang="ts">
  // Type a weight (ADR 0020): a decimal field (inputmode="decimal", 16px+ so iOS doesn't zoom), the old value grey,
  // then NH's choice list ▶ けってい / (目標をなくす) / やめる. Accepts 68.4, 68,4 and full-width digits; 20–300 kg.
  import ChoiceList from '../ui/ChoiceList.svelte';
  import { kgText, parseKgInput } from './fmt.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    label: string;
    sub: string;
    old: number | null;
    onok: (kg: number) => void;
    oncancel: () => void;
    /** An extra choice under けってい (目標をなくす). */
    extra?: { label: string; run: () => void } | null;
  }
  let { label, sub, old, onok, oncancel, extra = null }: Props = $props();
  let text = $state('');
  let tried = $state(false);
  const kg = $derived(parseKgInput(text));
  const bad = $derived(tried && kg === null);
  let input: HTMLInputElement | undefined = $state();
  $effect(() => input?.focus());

  function ok() {
    tried = true;
    if (kg !== null) onok(kg);
  }
</script>

<form class="wi" onsubmit={(e) => { e.preventDefault(); ok(); }}>
  <div class="screen card">
    <label class="top" for="wi-kg"><b>{label}</b><span class="sub money">{sub}</span>{#if old !== null}<span class="old money">({kgText(old)})</span>{/if}</label>
    <div class="field">
      <input id="wi-kg" bind:this={input} bind:value={text} type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done"
        placeholder={old !== null ? old.toFixed(1) : '00.0'} aria-invalid={bad} aria-describedby="wi-hint" maxlength="6" size="6" />
      <span class="unit" aria-hidden="true">kg</span>
    </div>
    <p id="wi-hint" class="hint" class:bad>{t('weight.range')}</p>
  </div>
  <div class="choose" class:off={kg === null}>
    <ChoiceList choices={[
      { label: t('kiroku.ok'), run: ok },
      ...(extra ? [extra] : []),
      { label: t('kiroku.cancel'), run: oncancel }
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
