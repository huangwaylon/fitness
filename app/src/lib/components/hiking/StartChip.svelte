<script lang="ts">
  // A hike's start time (docs/hiking.md "Start time"): 「出発 7:00 ✎」, a chip over the native time picker (iOS's wheel,
  // 5-minute steps); moved, the plan's own beside it (予定 7:00 → 8:30) and 元に戻す back to it. A registered hike has no
  // start of its own (`from` null): 出発時刻 till one is set, then its finish from its time (`end`). Anyone's, seen by
  // all (hikes.setStart: the record's `hike_start`).
  import Icon from '../ui/Icon.svelte';
  import { S } from '#lib/hiking/strings.ts';
  import { fmtHm, inputHm, toMin } from '#lib/hiking/start.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';
  import { hikes } from './hikes.svelte.ts';

  let { slug, from, end = null }: { slug: string; from: string | null; end?: string | null } = $props();
  const L = $derived(i18n.locale);
  const hm = $derived(hikes.start(slug));
  const shown = $derived(hm ?? from);

  function change(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    if (!input.value) return void (input.value = shown ? inputHm(shown) : '');
    const next = fmtHm(toMin(input.value));
    // (the plan's own start again: back to it, no override kept)
    if (!hikes.setStart(slug, next === from ? null : next)) input.value = shown ? inputHm(shown) : '';
  }
</script>

<div class="start" data-start>
  <label class="chip big" data-start-chip>
    <Icon name="clock" size={16} />
    <span data-start-hm>{shown ? `${pick(S.startAt, L)} ${shown}` : pick(S.startNone, L)}</span>
    <Icon name="edit" size={16} />
    <input type="time" step="300" value={shown ? inputHm(shown) : ''} aria-label={pick(S.startAria, L)} data-start-input data-sfx="tick" onchange={change} />
  </label>
  {#if hm !== null && from !== null}<span class="was" data-start-was>{pick(S.startWas, L)} <s>{from}</s> → {hm}</span>{/if}
  {#if hm !== null && end}<span class="was" data-start-end>{pick(S.startEnd, L).replace('{t}', end)}</span>{/if}
  {#if hm !== null}
    <button type="button" class="btn small paper reset" data-start-reset data-sfx="back" onclick={() => hikes.setStart(slug, null)}><Icon name="undo" size={18} />{pick(S.startReset, L)}</button>
  {/if}
</div>

<style>
  .start { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 10px; margin: 2px 0 10px; }
  .chip { font-family: var(--font-num); }
  /* the picker over the whole chip, unseen: a tap opens iOS's wheel (16px: no zoom on focus) */
  input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; font-size: 16px; cursor: pointer; appearance: none; -webkit-appearance: none; border: 0; padding: 0; margin: 0; }
  .chip:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* (under the chip and 元に戻す: the three in one row overflow 393px) */
  .was { order: 1; flex-basis: 100%; font: 600 var(--fs-s)/1.3 var(--font-num); color: var(--text-soft); }
  .was s { text-decoration-thickness: 1.5px; }
  .reset { margin: 0 0 0 auto; min-height: 44px; padding: 0 12px; font-size: var(--fs-s); }
</style>
