<script module lang="ts">
  export interface LayerRow {
    id: string;
    label: string;
    on: boolean;
    /** The swatch: a colour's dot, or 'square' (the saved places'). */
    swatch: string;
    /** The swatch a line in its colour, as the legend draws it, not a dot. */
    line?: 'solid';
    /** On by default: off, the disc's dot (something hidden). */
    def?: boolean;
  }
</script>

<script lang="ts">
  // A map's layers (docs/design.md "Maps"): one small disc (Icon layers; a coral dot while a layer on by default is
  // off: something hidden) and its panel under it (.card.dense): a row a layer, its swatch (a round colour, a line as
  // the legend draws it, or the saved places' ink square), its name and a ✓, each row its toggle. The trip's pane top-right; the trail's under ＋ −. Placed by its parent.
  import Icon from '../ui/Icon.svelte';

  let { rows, label, ontoggle, open = $bindable(false) }: { rows: readonly LayerRow[]; label: string; ontoggle: (id: string) => void; open?: boolean } = $props();
  const id = $props.id();
</script>

<div class="lyr">
  <button type="button" class="disc lb" aria-expanded={open} aria-controls={id} aria-label={label} data-map-layers data-sfx={open ? 'toggle-off' : 'toggle-on'}
    onclick={() => (open = !open)}><Icon name="layers" size={18} stroke={2.4} />{#if rows.some((r) => r.def && !r.on)}<span class="on" aria-hidden="true"></span>{/if}</button>
  {#if open}
    <div class="card dense panel" {id} role="group" aria-label={label}>
      {#each rows as r (r.id)}
        <button type="button" class="row" aria-pressed={r.on} data-map-layer={r.id} data-sfx={r.on ? 'toggle-off' : 'toggle-on'} onclick={() => ontoggle(r.id)}>
          <span class="sw {r.line ?? ''}" class:sq={r.swatch === 'square'} style:--k={r.swatch === 'square' ? null : r.swatch}></span><span class="ln">{r.label}</span>
          <span class="ck" aria-hidden="true">{#if r.on}<Icon name="check" size={16} stroke={2.6} />{/if}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* (the box round the disc and its panel not a tap target: what's beside the disc stays tappable) */
  .lyr { position: relative; pointer-events: none; }
  .lyr > * { pointer-events: auto; }
  /* (under the disc, out of the box: what's left of the disc stays clear; --lyr-max: the parent's room, then it scrolls) */
  .panel { position: absolute; top: calc(100% + 6px); right: 0; max-height: var(--lyr-max, none); overflow-y: auto; overscroll-behavior: contain; }
  .lb[aria-expanded='true']::before { background: var(--ctl-sel); }
  .on { position: absolute; top: 5px; right: 5px; width: 9px; height: 9px; border-radius: 50%; background: var(--c-coral); box-shadow: 0 0 0 2px var(--c-cream); }
  .panel { width: max-content; min-width: 160px; margin-right: 6px; box-sizing: border-box; }
  .panel .row { width: 100%; }
  .panel .row[aria-pressed='true'] { background: var(--hl); }
  .sw { width: 12px; height: 12px; flex: none; border-radius: 50%; background: var(--k); box-shadow: 0 0 0 2px #fff; }
  /* a line key (the trail legend's .k) */
  .sw.solid { width: 18px; height: 0; border-radius: 2px; background: none; box-shadow: none; border-top: 3px solid var(--k); }
  /* the saved places' square (map/places/badge.ts): ink, a cream rim */
  .sw.sq { border-radius: 3px; background: #4A3A2C; box-shadow: 0 0 0 1.5px #FFF9E3; }
  .ln { flex: 1; text-align: start; font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .ck { width: 16px; flex: none; display: flex; color: var(--leaf-text); }
</style>
