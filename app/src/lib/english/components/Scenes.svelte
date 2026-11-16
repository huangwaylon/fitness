<script lang="ts">
  // 場面のあらすじ (docs/english.md "Scene summaries"): one calm line under the player and its controls, the scene at
  // the playhead (scenes.ts sceneAt), following it as it plays. `paired` (字幕 英語 on): directly under the video, on its
  // black, centred like a caption line, so YouTube's English and our Japanese gist read as a pair. Tapped: every scene in a sheet, its time then its line,
  // the one on now marked; a scene tapped plays from there. Our own outline (scenes/<video>.json), never the lines.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { sceneAt } from '../scenes.ts';
  import { clock, s } from '../i18n.ts';
  import type { Scene } from '../types.ts';

  let { scenes, time, onplay, paired = false }: { scenes: readonly Scene[]; time: number; onplay: (from: number) => void; paired?: boolean } = $props();
  const at = $derived(sceneAt(scenes, time));
  let open = $state(false);
  const pick = (sc: Scene) => ((open = false), onplay(sc.t[0]));
</script>

<button type="button" class="strip" class:paired data-sfx="open" aria-label={s('sceneOpen')} data-en-scene={at} onclick={() => (open = true)}>
  <span class="ja">{scenes[at].ja}</span><Icon name="chevron-right" size={16} />
</button>

<Sheet bind:open title={s('scenesTitle')} name="english-scenes">
  <div class="list" data-en-scenes>
    <p class="note">{s('scenesNote')}</p>
    {#each scenes as sc, i (i)}
      <button type="button" class="prow" data-sfx="tick" aria-current={i === at || undefined} data-en-scene-row={i} onclick={() => pick(sc)}>
        <span class="t">{clock(Math.floor(sc.t[0]))}</span><span class="prl">{sc.ja}</span>
      </button>
    {/each}
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
  .list { display: grid; gap: 8px; padding-bottom: calc(var(--safe-bottom) + 8px); }
  .note { margin: 0 4px 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .prow { min-height: var(--hit); }
  .prow[aria-current='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .t { flex: none; min-width: 2.6em; font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .prow[aria-current='true'] .t { color: var(--c-ink-soft); }
  .prl { font-weight: 500; text-wrap: pretty; }
</style>
