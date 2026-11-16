<script lang="ts">
  // 場面のあらすじ (docs/english.md "Scene summaries"): one calm line under the player and its controls, following the
  // playhead (scenes.ts sceneAt): the beat on now with its category in front (a clip with beats: finer steps), else the
  // scene. `paired` (字幕 英語 on): directly under the video, on its black, centred like a caption line, so YouTube's
  // English and our Japanese gist read as a pair. Tapped: a sheet of every scene, its time then its line, and its beats
  // under it (time, category, line), the one on now marked; a chip row filters the beats by category; one tapped plays
  // from there. Our own outline (scenes/<video>.json), never the lines.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { BEAT_KINDS, beatsByScene, sceneAt } from '../scenes.ts';
  import { clock, s } from '../i18n.ts';
  import type { Beat, BeatKind, Scene } from '../types.ts';

  type Props = { scenes: readonly Scene[]; beats?: readonly Beat[]; time: number; onplay: (from: number) => void; paired?: boolean };
  let { scenes, beats, time, onplay, paired = false }: Props = $props();
  const at = $derived(sceneAt(scenes, time));
  const bAt = $derived(beats ? sceneAt(beats, time) : -1);
  const beat = $derived(beats?.[bAt]);
  /** Each scene's beats (indexes), and the categories present, in BEAT_KINDS' order. */
  const by = $derived(beats ? beatsByScene(scenes, beats) : null);
  const kinds = $derived(beats ? BEAT_KINDS.filter((k) => beats.some((b) => b.k === k)) : []);
  let open = $state(false);
  let kind = $state<BeatKind | null>(null);
  const pick = (from: number) => ((open = false), onplay(from));
  const label = (k: BeatKind) => s(`beat.${k}`);
</script>

<button type="button" class="strip" class:paired data-sfx="open" aria-label={s('sceneOpen')} data-en-scene={at} data-en-beat={beat ? bAt : undefined} onclick={() => (open = true)}>
  {#if beat}<span class="kind" data-en-beat-k={beat.k}>{label(beat.k)}</span>{/if}
  <span class="ja">{beat?.ja ?? scenes[at].ja}</span><Icon name="chevron-right" size={16} />
</button>

<Sheet bind:open title={s('scenesTitle')} name="english-scenes">
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
  .strip { appearance: none; flex: none; display: flex; align-items: center; gap: 6px; min-height: var(--hit); width: 100%; margin: 0; border: 0;
    padding: 0 calc(12px + var(--safe-right)) 0 calc(16px + var(--safe-left)); background: none; color: var(--text-soft); font: 500 var(--fs-s)/1.3 var(--font-ui);
    text-align: left; cursor: pointer; border-bottom: 1.5px dashed var(--stitch); -webkit-tap-highlight-color: transparent; }
  .strip:active { color: var(--text); }
  .strip.paired { justify-content: center; text-align: center; border-bottom: 0; padding-left: calc(12px + var(--safe-left) + 22px); background: #000; color: rgb(255 255 255 / .92);
    font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .strip.paired :global(svg) { color: rgb(255 255 255 / .5); }
  .strip.paired .ja { flex: 0 1 auto; padding: 6px 0; white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; text-wrap: balance; }
  .ja { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .strip :global(svg) { flex: none; }
  /* a beat's category: a small sunk pill (the kit's tag), before the line */
  .kind { flex: none; padding: 2px 8px; border-radius: var(--r-pill); white-space: nowrap; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); background: var(--ctl-off); }
  .strip.paired .kind { color: rgb(255 255 255 / .8); background: rgb(255 255 255 / .16); }
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
