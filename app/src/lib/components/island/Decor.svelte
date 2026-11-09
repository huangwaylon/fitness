<script lang="ts">
  // The island's decorations (docs/design.md "Decorating"): the layout's objects of the decorations' kinds, each an
  // upright world node at its feet (its tap area over the 3D island's model, world3d/objects.ts), in the one depth
  // order; the walk has them already (layout/nav.ts). They're arranged in /editor (docs/island-layout.md "The editor").
  // A tap jiggles it where it stands (my villager turns to it, no walk), but for a seat or a piece of the gym one uses (`sit`: IslandScene
  // sitOn, island/sitting.ts): my villager walks up to it and on. The partner's change, just made, puffs where it lands.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { art } from '#lib/art.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { kindDef } from '#lib/layout/catalog.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { useWorld } from './camera.svelte.ts';
  import { decorArt, decorH, decorPlace, DECOR_KINDS, type Facing } from './decor.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { onMount } from 'svelte';
  import { echo3d } from './echo3d.ts';
  import { site } from './site.svelte.ts';
  import { layout } from '#lib/store/layout.svelte.ts';
  import { objMid } from '#lib/layout/model.ts';
  import { castMe } from '#lib/ui-state/cast.ts';

  interface Props {
    /** A tap on a seat or a gym piece (its id): true when my villager went to it (IslandScene sitOn). */
    sit?: (id: string) => boolean;
  }
  let { sit }: Props = $props();
  const w = useWorld();

  // The layout's objects of the decorations' kinds (the old もようがえ's moved in as `m-<id>`, the editor's, the gym's).
  const KINDS: ReadonlySet<string> = new Set(DECOR_KINDS);
  const items = $derived.by((): readonly { id: string; item: string; x: number; z: number; f: Facing }[] => {
    const l = site.layout;
    if (!l) return [];
    return [...l.objects.values()].filter((o) => KINDS.has(o.k)).map((o) => {
      const [x, z] = objMid(l, o);
      return { id: o.id, item: o.k, x: Math.round(x), z: Math.round(z), f: o.f as Facing };
    });
  });
  /** A render stands on its feet point (decorPlace), its height decorH; its width the art's, else the model's box (the
   *  turned looks and a pack's kinds have no 2D art, only the 3D island draws them). */
  function look(item: string, f: Facing) {
    const key = decorArt(item, f), h = decorH(item, f), a = art(key), p = decorPlace(item, f);
    const wd = a ? (h * a.w) / a.h : p?.mu ? (h * p.mu[0]) / p.mu[1] : h;
    return { key, h, wd, style: p ? `left:calc(${-p.ax * wd} * var(--u));bottom:calc(${-(1 - p.ay) * h} * var(--u))` : '' };
  }

  /** Its name: NH's in the world's kana (decor.item), else the editor's (a pack's kinds: catalog.ts, the first load's bytes). */
  function nameOf(item: string): string {
    const n = t(`decor.item.${item}`), d = kindDef(item);
    return n !== `decor.item.${item}` || !d ? n : i18n.locale === 'ja' ? d.ja : d.en;
  }
  function jiggle(el: Element) {
    echo3d(el);
    for (const a of el.getAnimations()) if (a.id === 'jiggle') a.cancel();
    el.animate([{ scale: '1 1' }, { scale: '1.08 .9', offset: 0.25 }, { scale: '.96 1.06', offset: 0.55 }, { scale: '1 1' }], { duration: 380, easing: 'ease-out', id: 'jiggle' });
  }
  function tap(e: MouseEvent, id: string, x: number) {
    // a seat or a gym piece: walked up to and on (all taken: its boop)
    if (sit?.(id)) return;
    jiggle(e.currentTarget as Element);
    cue('tick');
    turnTo(x);
  }

  // the partner's change, just made: a puff where it stands, their villager turning to it
  let puffs = $state<{ n: number; x: number; z: number }[]>([]);
  let n = 0;
  onMount(() =>
    layout.on(({ diff, who, live }) => {
      // the partner's change on the layout, just made (any piece they put down or moved)
      if (!live || who === castMe()) return;
      const l = layout.current, o = [...diff.objects.add, ...diff.objects.move].at(-1);
      if (!o) return;
      const [x, z] = objMid(l, o), k = ++n;
      puffs = [...puffs.slice(-2), { n: k, x, z }];
      partnerTurnTo(x, who);
      setTimeout(() => (puffs = puffs.filter((p) => p.n !== k)), 700);
    })
  );
</script>

{#each items as p (p.id)}
  {@const l = look(p.item, p.f)}
  <div class="spr" data-decor-node={p.id} data-scenery-id={p.id} {@attach w.at({ x: p.x, z: p.z, h: l.h, inv: true })}>
    <button type="button" class="deco" data-decor={p.id} data-item={p.item} data-x={p.x} data-z={p.z} data-f={p.f} data-sfx="self" aria-label={nameOf(p.item)}
      style={l.style} style:height="calc({l.h} * var(--u))" style:width="calc({l.wd} * var(--u))"
      onclick={(e) => tap(e, p.id, p.x)}>
      <OfficialArt key={l.key} size="calc({l.h} * var(--u))" />
    </button>
  </div>
{/each}
{#each puffs as q (q.n)}
  <div class="spr" aria-hidden="true" {@attach w.at({ mode: 'flat', x: q.x, z: q.z, h: 4, zi: 9 })}><i class="puff"></i></div>
{/each}

<style>
  .spr { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .deco {
    position: absolute; left: 0; bottom: 0; display: flex; justify-content: center; align-items: flex-end; line-height: 0;
    appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; pointer-events: auto;
    -webkit-tap-highlight-color: transparent; transform-origin: 50% 100%;
  }
  .deco :global(.official) { max-width: none; }
  /* its tap target: its whole body, base included, at least 44px on screen (--inv: the node's 1 / scale) */
  .deco::after {
    content: ''; position: absolute; left: 50%; bottom: calc(-4 * var(--u)); translate: -50% 0;
    width: max(100%, calc(45px * var(--inv, 1))); height: max(calc(100% + 4 * var(--u)), calc(45px * var(--inv, 1)));
  }
  .deco:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .puff {
    position: absolute; left: 0; top: 0; width: calc(50 * var(--u)); height: calc(50 * var(--u)); translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 255, 255, .9), rgba(255, 255, 255, .5) 55%, transparent); animation: puff .6s ease-out both;
  }
  @keyframes puff { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
</style>
