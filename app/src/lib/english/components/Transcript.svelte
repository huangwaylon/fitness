<script lang="ts">
  // セリフ (docs/english.md "Transcripts"): a level of the lesson, under its pinned player. Every line of the clip's
  // transcript, in time order: its m:ss, the English, and under it in smaller grey our Japanese when the clip's
  // translation is in (the bank's lines carry it; a translation landing is a new bank file, so a row never grows under
  // the reader). The line at the playhead follows playback (transcripts.ts lineAt), on the yuzu fill the scenes list
  // marks "the one on now" with, and is scrolled into view on a line change — never over the user's own scrolling: a
  // touch or a wheel on the list holds the follow for a few seconds. A line tapped plays from its start.
  import { lineAt } from '../transcripts.ts';
  import { clock, s } from '../i18n.ts';
  import type { TranscriptLine } from '../types.ts';

  let { lines, time, onplay }: { lines: readonly TranscriptLine[]; time: number; onplay: (from: number) => void } = $props();
  const at = $derived(lineAt(lines, time));
  let list: HTMLElement | undefined = $state();
  /** The user's own scrolling (a touch or a wheel on the list): the follow holds off this long after (ms). */
  let held = 0;
  const HOLD = 6000;
  const hold = () => (held = Date.now());
  $effect(() => {
    const el = list;
    if (!el) return;
    el.addEventListener('touchstart', hold, { passive: true });
    el.addEventListener('wheel', hold, { passive: true });
    return () => (el.removeEventListener('touchstart', hold), el.removeEventListener('wheel', hold));
  });
  $effect(() => {
    const el = list?.querySelector(`[data-en-line="${at}"]`);
    if (!el || Date.now() - held < HOLD) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
</script>

<div class="lvl" data-en-transcript data-en-at={at} bind:this={list}>
  <p class="note">{s('transcriptNote')}</p>
  {#each lines as l, i (i)}
    <button type="button" class="prow line" aria-current={i === at || undefined} data-sfx="tick" data-en-line={i} onclick={() => onplay(l.t[0])}>
      <span class="t">{clock(Math.floor(l.t[0]))}</span>
      <span class="tx">
        <span class="en" lang="en">{l.en}</span>
        {#if l.ja}<span class="ja">{l.ja}</span>{/if}
      </span>
    </button>
  {/each}
</div>

<style>
  .lvl { display: flex; flex-direction: column; gap: 8px; animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .note { margin: 0 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .line { min-height: var(--hit); align-items: baseline; }
  /* the line on now: the scenes list's yuzu */
  .line[aria-current='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .t { flex: none; min-width: 2.6em; font: 600 var(--fs-s)/1.4 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .line[aria-current='true'] .t { color: var(--c-ink-soft); }
  .tx { display: grid; gap: 2px; min-width: 0; }
  .en { font-size: var(--fs-body); line-height: 1.45; text-wrap: pretty; }
  .ja { font-size: var(--fs-s); line-height: 1.4; color: var(--text-soft); text-wrap: pretty; }
  .line[aria-current='true'] .ja { color: var(--c-ink-soft); }
</style>
