<script lang="ts">
  // 3.4 Edit a number: the Nook Stop ATM keypad. The old value sits grey in brackets, the new one in Fredoka 44,
  // then NH's choice list ▶ けってい / やめる. Digits and Backspace on a keyboard work too.
  import ChoiceList from '../ChoiceList.svelte';
  import { num } from './fmt.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    label: string;
    sub: string;
    old: number | null;
    max: number;
    unit?: string;
    onok: (value: number) => void;
    oncancel: () => void;
  }
  let { label, sub, old, max, unit = '', onok, oncancel }: Props = $props();
  let digits = $state('');
  const value = $derived(digits === '' ? null : Number(digits));
  const valid = $derived(value !== null && value <= max && value !== old);

  function press(k: string) {
    if (k === 'del') digits = digits.slice(0, -1);
    else if (k === 'C') digits = '';
    else if (digits.length < String(max).length) digits = digits === '0' ? k : digits + k;
  }
  function keydown(e: KeyboardEvent) {
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Escape') { e.preventDefault(); oncancel(); }
    else if (e.key === 'Enter' && valid && value !== null) onok(value);
    else return;
    e.preventDefault();
  }
  const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'C'];
  let pad: HTMLElement | undefined = $state();
  $effect(() => pad?.focus());
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div class="atm" tabindex="0" bind:this={pad} onkeydown={keydown} role="group" aria-label="{label} {sub}">
  <div class="screen card">
    <div class="top"><b>{label}</b><span class="sub money">{sub}</span><span class="old money">({num(old)}{unit})</span></div>
    <output class="new hero-num" class:ph={value === null} class:over={value !== null && value > max} aria-live="polite">
      {num(value ?? old ?? 0)}<small>{unit}</small>
    </output>
  </div>
  <div class="row">
    <div class="keys">
      {#each KEYS as k (k)}
        <button type="button" class="key" class:fn={k === 'del' || k === 'C'} onclick={() => press(k)}
          aria-label={k === 'del' ? t('kiroku.del') : k === 'C' ? t('kiroku.clear') : k}>
          {#if k === 'del'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 H20 V19 H9 L3 12Z M12 9 L17 15 M17 9 L12 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" /></svg>{:else}{k}{/if}
        </button>
      {/each}
    </div>
    <div class="choose" class:off={!valid}>
      <ChoiceList choices={[
        { label: t('kiroku.ok'), run: () => valid && value !== null && onok(value) },
        { label: t('kiroku.cancel'), run: oncancel }
      ]} />
    </div>
  </div>
</div>

<style>
  /* The keys sit at the bottom of the phone, in the thumb zone, with the value right above them (round 7 F10): the
     pad fills the phone screen below its title bar (status + title ≈ 100px, the phone's padding ≈ 40px). */
  .atm {
    display: grid; align-content: end; gap: 16px; outline: none;
    min-height: calc(100dvh - var(--safe-top) - 12px - var(--pad-bottom) - 150px);
  }
  .screen { display: grid; gap: 4px; padding: 14px 16px 16px; }
  .top { display: flex; align-items: baseline; gap: 10px; font-size: var(--fs-body); }
  .sub { color: var(--text-soft); font-size: var(--fs-body); }
  .old { margin-left: auto; color: var(--text-soft); font-size: var(--fs-talk); }
  .new { text-align: right; font-size: var(--fs-hero); color: var(--text); min-height: 1.1em; }
  .new small { font-size: var(--fs-talk); margin-left: 4px; }
  .new.ph { color: color-mix(in srgb, var(--text-soft) 55%, transparent); }
  .new.over { color: var(--c-coral); }
  .row { display: flex; gap: 14px; align-items: flex-end; flex-wrap: wrap; justify-content: center; }
  .keys { display: grid; grid-template-columns: repeat(3, 60px); gap: 10px; }
  .key {
    appearance: none; border: 0; cursor: pointer; height: 54px; border-radius: var(--r-btn);
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    font: 700 var(--fs-title)/1 var(--font-num); display: grid; place-items: center;
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .key.fn { background: color-mix(in srgb, var(--c-mint) 45%, var(--c-cream)); font: 700 var(--fs-body)/1 var(--font-ui); }
  .key svg { width: 24px; height: 24px; }
  .key:active { transform: translateY(3px) scale(1.04, .94); box-shadow: 0 1px 0 var(--c-lip); transition-duration: var(--dur-tap); }
  .choose { flex: 1; min-width: 120px; display: flex; justify-content: flex-end; }
  .choose.off :global(.choice:first-child) { opacity: .5; }
  @media (max-width: 389px) {
    .keys { grid-template-columns: repeat(3, 1fr); width: 100%; }
    .key { height: 48px; }
    .choose { width: 100%; }
    .choose :global(.choices) { grid-auto-flow: column; width: 100%; }
  }
  @media (max-height: 700px) { .key { height: 46px; } .new { font-size: 2.25rem; } }
</style>
