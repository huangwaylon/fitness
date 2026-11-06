<script lang="ts">
  // スピード はしご's four speeds as steps rising left to right (docs/kikimimi.md "スピード はしご"): the lobby's (what the
  // mode is: soft leaf, the top full; `big`), a rung's over the stage (climbed leaf, this one yuzu, stopped coral, ahead
  // off; `mid`) and each ladder's on the results (climbed leaf; `small`). `label` says it in words; without one it's
  // decorative (the caller says it).
  import { SPEEDS } from '#lib/kikimimi/ladder.ts';
  import { sx } from './look.ts';

  let { step, size = 'mid', label = '' }: {
    /** A step's look: climbed, this one, stopped, ahead, or the lobby's soft leaf. */
    step: (k: number) => 'up' | 'now' | 'off' | 'ahead' | 'soft';
    size?: 'big' | 'mid' | 'small';
    label?: string;
  } = $props();
</script>

<ol class="steps {size}" aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
  {#each SPEEDS as x, k (k)}<li data-step={step(k)} style:--h="{40 + k * 20}%"><span>{sx(x)}×</span></li>{/each}
</ol>

<style>
  .steps { list-style: none; margin: 0; padding: 0; display: grid; align-items: end; }
  .mid { grid-template-columns: repeat(4, 46px); gap: 4px; height: 44px; }
  .small { grid-template-columns: repeat(4, 40px); gap: 3px; height: 36px; }
  .big { grid-template-columns: repeat(4, 1fr); gap: 6px; height: 52px; }
  li {
    height: var(--h); border-radius: 8px 8px 4px 4px; display: grid; align-items: end; justify-items: center; padding-bottom: 2px;
    background: var(--ctl-off); color: var(--text-soft); font: 700 11px/1 var(--font-num);
  }
  .small li { border-radius: 6px 6px 3px 3px; font-size: 10px; }
  .big li { border-radius: 10px 10px 4px 4px; padding-bottom: 3px; font-size: var(--fs-s); }
  li[data-step='up'] { background: var(--c-leaf); color: var(--c-ink); }
  li[data-step='now'] { background: var(--c-yuzu); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge); }
  li[data-step='off'] { background: color-mix(in srgb, var(--c-coral) 35%, var(--card)); color: var(--c-ink); }
  li[data-step='soft'] { background: color-mix(in srgb, var(--c-leaf) 45%, var(--card)); color: var(--c-ink); }
</style>
