<script lang="ts">
  // 3.4 Edit a number: the Nook Stop ATM keypad. The old value sits grey in brackets, the new one in Fredoka 44,
  // then NH's choice list ▶ けってい / やめる. Digits and Backspace on a keyboard work too.
  import ChoiceList from '../ui/ChoiceList.svelte';
  import { num } from './fmt.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

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

  /** A key, tapped or typed: NH's soft keyboard click (⌫ and C a little lower). */
  function press(k: string) {
    cue(k === 'del' || k === 'C' ? 'key-fn' : 'key');
    if (k === 'del') digits = digits.slice(0, -1);
    else if (k === 'C') digits = '';
    else if (digits.length < String(max).length) digits = digits === '0' ? k : digits + k;
  }
  function keydown(e: KeyboardEvent) {
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('del');
    else if (e.key === 'Escape') { e.preventDefault(); cue('back'); oncancel(); }
    else if (e.key === 'Enter' && valid && value !== null) { cue('choice-pick'); onok(value); }
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
        <button type="button" class="key" class:fn={k === 'del' || k === 'C'} data-sfx="self" onclick={() => press(k)}
          aria-label={k === 'del' ? t('kiroku.del') : k === 'C' ? t('kiroku.clear') : k}>
          {#if k === 'del'}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 H20 V19 H9 L3 12Z M12 9 L17 15 M17 9 L12 15" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" /></svg>{:else}{k}{/if}
        </button>
      {/each}
    </div>
    <div class="choose" class:off={!valid}>
      <ChoiceList choices={[
        { label: t('kiroku.ok'), run: () => valid && value !== null && onok(value), disabled: !valid },
        { label: t('kiroku.cancel'), run: oncancel, cancel: true }
      ]} />
    </div>
  </div>
</div>

<style>
  /* The keys sit at the bottom of the phone, in the thumb zone, with the value right above them (round 7 F10). The
     phone's scrolling body stretches this screen to its own height (ShimaPhone .phone-body), so the pad needs no
     height of its own (round 10: the old `100dvh − … − 150px` broke whenever the phone's chrome changed). */
  .atm { display: grid; align-content: end; gap: 16px; }
  /* The pad takes the typed digits (it is focused on open): with keyboard focus, its screen shows the ring (WCAG 2.4.7). */
  .atm:focus { outline: none; }
  .atm:focus-visible .screen { outline: 3px solid var(--focus); outline-offset: 3px; }
  .screen { display: grid; gap: 4px; padding: 14px 16px 16px; }
  .top { display: flex; align-items: baseline; gap: 10px; font-size: var(--fs-body); }
  .sub { color: var(--text-soft); font-size: var(--fs-body); }
  .old { margin-left: auto; color: var(--text-soft); font-size: var(--fs-talk); }
  .new { text-align: right; font-size: var(--fs-hero); color: var(--text); min-height: 1.1em; }
  .new small { font-size: var(--fs-talk); margin-left: 4px; }
  .new.ph { color: color-mix(in srgb, var(--text-soft) 55%, transparent); }
  .new.over { color: var(--c-coral); }
  /* Full-width keys at every width (sizing #4: they used to be 60×54 at 390+ and 101×46 at 375), the height
     fluid with the screen, then ▶ けってい / やめる side by side under them. */
  .row { display: grid; gap: 14px; }
  .keys { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
  .key {
    appearance: none; border: 0; cursor: pointer; height: var(--key-h); border-radius: var(--r-btn);
    background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
    font: 700 var(--fs-title)/1 var(--font-num); display: grid; place-items: center;
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  /* C in the keys' own bold Fredoka (round 21: a thin 15px UI-font C beside the 24px digits) */
  .key.fn { background: color-mix(in srgb, var(--c-mint) 45%, var(--c-card)); font: 700 var(--fs-talk)/1 var(--font-num); }
  .key svg { width: 24px; height: 24px; }
  .key:active { transform: translateY(3px) scale(1.04, .94); box-shadow: var(--sh-obj-press); transition-duration: var(--dur-tap); }
  .choose { display: flex; }
  .choose :global(.choices) { grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); width: 100%; }
  .choose.off :global(.choice:first-child) { opacity: .5; }
  @media (max-height: 700px) { .new { font-size: 2.25rem; } }
</style>
