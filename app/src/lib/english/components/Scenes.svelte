<script lang="ts">
  // 場面のあらすじ (docs/english.md "Scene summaries"): one calm line directly under the video, on its black (one height,
  // two lines' worth), following the playhead (scenes.ts atTime): the beat on now with its category in front (a clip
  // with beats: finer steps), else the scene. `strip` false (a question open, or あらすじ off): no line, the list still
  // there for ツール. Tapped (or `open` from ツール): a sheet of every scene, its time then its line, and its beats under
  // it (time, category, line), the one on now marked; a chip row filters the beats by category; one tapped plays from
  // there; opened from ツール, its ‹ goes back there (`onback`). Our own outline (scenes/<video>.json), never the lines.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { atTime, BEAT_KINDS, beatsByScene } from '../scenes.ts';
  import { clock, s } from '../i18n.ts';
  import type { Beat, BeatKind, Scene } from '../types.ts';

  type Props = { scenes: readonly Scene[]; beats?: readonly Beat[]; time: number; onplay: (from: number) => void; strip: boolean; open: boolean; onback?: (() => void) | null };
  let { scenes, beats, time, onplay, strip, open = $bindable(), onback = null }: Props = $props();
  const at = $derived(atTime(scenes, time));
  const bAt = $derived(beats ? atTime(beats, time) : -1);
  const beat = $derived(beats?.[bAt]);
  /** Each scene's beats (indexes), and the categories present, in BEAT_KINDS' order. */
  const by = $derived(beats ? beatsByScene(scenes, beats) : null);
  const kinds = $derived(beats ? BEAT_KINDS.filter((k) => beats.some((b) => b.k === k)) : []);
  let kind = $state<BeatKind | null>(null);
  const pick = (from: number) => ((open = false), onplay(from));
  const label = (k: BeatKind) => s(`beat.${k}`);
</script>

{#if strip}<button type="button" class="strip" data-sfx="open" aria-label={`${beat ? `${label(beat.k)}：` : ''}${beat?.ja ?? scenes[at].ja}（${s('sceneOpen')}）`} data-en-scene={at} data-en-beat={beat ? bAt : undefined} onclick={() => (open = true)}>
  {#if beat}<span class="kind" data-en-beat-k={beat.k}>{label(beat.k)}</span>{/if}
  <span class="ja">{beat?.ja ?? scenes[at].ja}</span><Icon name="chevron-right" size={16} />
</button>{/if}

<Sheet bind:open title={s('scenesTitle')} {onback} name="english-scenes">
  <div class="list" data-en-scenes>
    <p class="note">{s('scenesNote')}</p>
    {#if beats && by}
      <div class="kinds" role="radiogroup" aria-label={s('beatFilter')}>
        <button type="button" class="chip big" role="radio" aria-checked={kind === null} data-sfx="none" data-en-beat-filter="all" onclick={() => (kind = null)}>{s('beatAll')}</button>
        {#each kinds as k (k)}
          <button type="button" class="chip big" role="radio" aria-checked={kind === k} data-sfx="none" data-en-beat-filter={k} onclick={() => (kind = k)}>{label(k)}</button>
        {/each}
      </div>
      {#each scenes as sc, i (i)}
        {@const mine = by[i].filter((j) => !kind || beats[j].k === kind)}
        {#if !kind || mine.length}
          <section class="group" data-en-scene-group={i}>
            <button type="button" class="head" data-sfx="tick" aria-current={i === at || undefined} data-en-scene-row={i} onclick={() => pick(sc.t[0])}>
              <span class="t">{clock(Math.floor(sc.t[0]))}</span><span class="hl">{sc.ja}</span>
            </button>
            {#each mine as j (j)}
              {@const b = beats[j]}
              <button type="button" class="prow beat" data-sfx="tick" aria-current={j === bAt || undefined} data-en-beat-row={j} data-k={b.k} onclick={() => pick(b.t[0])}>
                <span class="t">{clock(Math.floor(b.t[0]))}</span><span class="kind">{label(b.k)}</span><span class="prl">{b.ja}</span>
              </button>
            {/each}
          </section>
        {/if}
      {/each}
    {:else}
      {#each scenes as sc, i (i)}
        <button type="button" class="prow" data-sfx="tick" aria-current={i === at || undefined} data-en-scene-row={i} onclick={() => pick(sc.t[0])}>
          <span class="t">{clock(Math.floor(sc.t[0]))}</span><span class="prl">{sc.ja}</span>
        </button>
      {/each}
    {/if}
  </div>
</Sheet>

<style>
  .strip { appearance: none; flex: none; display: flex; align-items: center; gap: 8px; width: 100%; margin: 0; border: 0;
    /* one height, two lines' worth: the band never moves what's under it as the playhead goes on */
    height: calc(2 * 1.35em + 12px); padding: 0 calc(12px + var(--safe-right)) 0 calc(16px + var(--safe-left)); background: #000; color: rgb(255 255 255 / .92);
    font: 700 var(--fs-body)/1.35 var(--font-ui); text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .strip:active { color: #fff; }
  .strip :global(svg) { flex: none; color: rgb(255 255 255 / .5); }
  .ja { flex: 1; min-width: 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; overflow: hidden; text-wrap: pretty; }
  /* a beat's category: a small sunk pill (the kit's tag), before the line */
  .kind { flex: none; padding: 2px 8px; border-radius: var(--r-pill); white-space: nowrap; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); background: var(--ctl-off); }
  .strip .kind { color: rgb(255 255 255 / .8); background: rgb(255 255 255 / .16); }
  .list { display: grid; gap: 8px; padding-bottom: calc(var(--safe-bottom) + 8px); }
  .note { margin: 0 4px 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .kinds { display: flex; gap: 6px; overflow-x: auto; margin: 0 -12px; padding: 2px 12px 6px; scrollbar-width: none; }
  .kinds .chip { flex: none; white-space: nowrap; }
  .group { display: grid; gap: 6px; }
  .head { appearance: none; display: flex; align-items: baseline; gap: 10px; min-height: var(--hit); margin: 6px 0 0; padding: 10px 4px 4px; border: 0; background: none;
    color: var(--text); font: 700 var(--fs-body)/1.35 var(--font-ui); text-align: left; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .head:active { color: var(--text-soft); }
  .hl { text-wrap: pretty; }
  /* the scene on now: its time on a yuzu pill */
  .head[aria-current='true'] .t { margin: -4px 0; padding: 4px 6px; border-radius: var(--r-pill); background: var(--ctl-sel); color: var(--c-ink); text-align: center; }
  .prow { min-height: var(--hit); }
  .prow[aria-current='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .prow[aria-current='true'] .kind { color: var(--c-ink-soft); background: rgb(0 0 0 / .06); }
  .beat { gap: 8px; }
  .t { flex: none; min-width: 2.6em; font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .prow[aria-current='true'] .t { color: var(--c-ink-soft); }
  .prl { font-weight: 500; text-wrap: pretty; }
</style>
