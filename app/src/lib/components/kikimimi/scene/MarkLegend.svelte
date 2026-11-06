<script lang="ts">
  // The sound marks' key (docs/kikimimi.md "Visuals"): one chip per kind the revealed text shows, in the order they're
  // authored (marks.ts markKinds).
  import type { SoundMark } from '#lib/kikimimi/bank.ts';
  import { markKinds } from '#lib/kikimimi/marks.ts';
  import { t } from '#lib/i18n/index.ts';

  let { marks }: { marks: readonly SoundMark[] } = $props();
  const kinds = $derived(markKinds(marks));
</script>

{#if kinds.length}
  <span class="legend" data-kiki-legend={kinds.join(' ')}>
    {#each kinds as k (k)}
      <span class="k">
        {#if k === 'say'}<i class="say obj-cream" aria-hidden="true">abc</i>{:else if k === 'link'}<i class="arc" aria-hidden="true"></i>{:else if k === 'drop'}<i class="drop" aria-hidden="true">t</i>{:else}<i class="dot" aria-hidden="true">●</i>{/if}
        {t(`kiki.mark.${k}`)}
      </span>
    {/each}
  </span>
{/if}

<style>
  /* the theme's soft text: the day ink-soft in a cream bubble (.obj-cream), night's light one on a review card */
  .legend { display: flex; flex-wrap: wrap; gap: 4px 12px; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .k { display: inline-flex; align-items: center; gap: 4px; }
  i { font-style: normal; }
  .say { font: italic 700 11px/1 var(--font-ui); padding: 1px 4px; border-radius: 6px; background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); color: var(--leaf-text); }
  .arc { display: inline-block; width: 9px; height: 5px; border: 2px solid var(--c-leaf-edge); border-top: 0; border-radius: 0 0 6px 6px; }
  .drop { color: color-mix(in srgb, currentColor 45%, transparent); text-decoration: line-through 2px color-mix(in srgb, var(--c-coral) 70%, transparent); }
  .dot { font-size: 9px; color: var(--text); }
</style>
