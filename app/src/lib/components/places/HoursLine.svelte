<script lang="ts">
  // A place's hours line (docs/places.md "Hours"): 営業中 · 21:00まで (leaf), まもなく閉店 (coral, within the hour),
  // 営業時間外 / 本日定休 and when it opens, 営業時間は不明; Google's week with no open day at all (`[]`, not null: 49
  // places, mostly restaurants and bars, Google showing them closed for now or for good) 休業中かも, and one Google marks
  // 閉業 (`closed`: det.shut) 閉業, closed's tone; a tap opens the week view under it (月 to 日, today's row
  // yuzu, 定休日 coral) when the hours are known; unknown (most places) said quietly, no dot. `now` is the caller's minute (the clock's).
  import type { Period } from '#lib/contract/places.ts';
  import { dayIn, hoursNow, weekRows } from '#lib/places/hours.ts';
  import { S, hoursLine, weekday } from '#lib/places/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';

  const SHUT = { ja: '休業中かも · 営業日の表示なし', en: 'Maybe closed · no open days listed' };
  const GONE = { ja: '閉業 · Google の表示', en: 'Permanently closed (Google)' };

  let { hours, tz, now, week = true, closed = false }: { hours: Period[] | null; tz: string; now: number; week?: boolean; closed?: boolean } = $props();
  const L = $derived(i18n.locale);
  /** Google's week shown, not one day open in it (null is no week shown: 不明); or Google marks it 閉業 (`closed`). */
  const shut = $derived(closed || (!!hours && !hours.length));
  const line = $derived(shut ? { text: pick(closed ? GONE : SHUT, L), tone: 'closed' as const } : hoursLine(hoursNow(hours, tz, now), L));
  let open = $state(false);
  const today = $derived(dayIn(now, tz));
</script>

{#if hours?.length && week && !closed}
  <button type="button" class="hl hit44 {line.tone}" aria-expanded={open} data-hours={line.tone} data-sfx="tick" onclick={() => (open = !open)}>
    <span class="dot" aria-hidden="true"></span><span class="txt">{line.text}</span>
    <svg class="chev" class:up={open} viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
  </button>
  {#if open}
    <table class="wk" data-week aria-label={pick(S.week, L)}>
      <tbody>
        {#each weekRows(hours) as r (r.d)}
          <tr class:today={r.d === today} class:off={!r.spans.length} data-day={r.d}>
            <th scope="row">{weekday(r.d, L)}</th>
            <td>{r.spans.length ? r.spans.join('  ') : pick(S.dayOff, L)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{:else}
  <p class="hl {line.tone}" data-hours={closed ? 'gone' : shut ? 'shut' : line.tone}>{#if line.tone !== 'unknown'}<span class="dot" aria-hidden="true"></span>{/if}<span class="txt">{line.text}</span></p>
{/if}

<style>
  .hl {
    appearance: none; margin: 0; padding: 0; border: 0; background: none; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft);
    display: inline-flex; align-items: center; gap: 6px; min-height: 32px; text-align: start; cursor: default; -webkit-tap-highlight-color: transparent;
  }
  button.hl { cursor: pointer; }
  button.hl:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: 6px; }
  /* (unknown: no hours in its Google details, or none looked up yet) quiet: no dot, the soft text, lighter */
  .unknown { font-weight: 600; }
  .dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--stitch); }
  .open { color: var(--leaf-text); }
  .open .dot { background: var(--c-leaf); }
  .soon { color: var(--coral-text); }
  .soon .dot { background: var(--c-coral); }
  .chev { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; transition: rotate .2s var(--ease-soft); }
  .chev.up { rotate: 180deg; }
  .wk { width: 100%; border-collapse: collapse; margin: 2px 0 4px; font: 600 var(--fs-s)/1.35 var(--font-ui); font-variant-numeric: tabular-nums; }
  .wk th { width: 4em; white-space: nowrap; padding: 3px 8px; text-align: start; font-weight: 700; color: var(--text-soft); }
  .wk td { padding: 3px 8px; color: var(--text); white-space: pre-wrap; }
  .wk tr.today { background: color-mix(in srgb, var(--c-yuzu) 45%, transparent); }
  .wk tr.today th, .wk tr.today td { color: var(--text); }
  .wk tr.today th { border-radius: 8px 0 0 8px; }
  .wk tr.today td { border-radius: 0 8px 8px 0; }
  .wk tr.off td { color: var(--coral-text); }
</style>
