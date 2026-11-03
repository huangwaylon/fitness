<script lang="ts">
  // The island's decorations (docs/design.md "Decorating"): the layout's objects of the decorations' kinds, each an
  // upright world node at its feet (its tap area over the 3D island's model, world3d/objects.ts), in the one depth
  // order; the walk has them already (layout/nav.ts). Outside the もようがえ (IslandEdit) a tap jiggles it where it
  // stands (my villager turns to it, no walk). The partner's change, just made, puffs where it lands.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { art } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { useWorld } from './camera.svelte.ts';
  import { decorArt, decorH, type DecorItem, type Facing } from './decor.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import PLACES from './models.json';
  import { onMount } from 'svelte';
  import { echo3d } from './echo3d.ts';
  import { site } from './site.svelte.ts';
  import { layout } from '#lib/store/layout.svelte.ts';
  import { objMid } from '#lib/layout/model.ts';
  import { castMe } from '#lib/ui-state/cast.ts';
  import { DECOR_ITEMS } from './decor.ts';

  interface Props {
    /** The もようがえ is on (IslandEdit's): a tap does nothing here. */
    editing?: boolean;
  }
  let { editing = false }: Props = $props();
  const w = useWorld();

  // The layout's objects of the decorations' kinds (the old もようがえ's moved in as `m-<id>`, the phone's
  // もようがえ's new ones).
  const KINDS: ReadonlySet<string> = new Set(DECOR_ITEMS);
  const items = $derived.by((): readonly { id: string; item: DecorItem; x: number; z: number; f: Facing }[] => {
    const l = site.layout;
    if (!l) return [];
    return [...l.objects.values()].filter((o) => KINDS.has(o.k)).map((o) => {
      const [x, z] = objMid(l, o);
      return { id: o.id, item: o.k as DecorItem, x: Math.round(x), z: Math.round(z), f: o.f as Facing };
    });
  });
  const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu?: [number, number] }>;
  /** A render stands on its feet point (models.json), its height decorH; its width the art's, else the model's box
   *  (models.json mu: the turned looks have no 2D art, only the 3D island draws them). */
  function look(item: DecorItem, f: Facing) {
    const key = decorArt(item, f), h = decorH(item, f), a = art(key), p = P[key];
    const wd = a ? (h * a.w) / a.h : p?.mu ? (h * p.mu[0]) / p.mu[1] : h;
    return { key, h, wd, style: p ? `left:calc(${-p.ax * wd} * var(--u));bottom:calc(${-(1 - p.ay) * h} * var(--u))` : '' };
  }

  function jiggle(el: Element) {
    echo3d(el);
    for (const a of el.getAnimations()) if (a.id === 'jiggle') a.cancel();
    el.animate([{ scale: '1 1' }, { scale: '1.08 .9', offset: 0.25 }, { scale: '.96 1.06', offset: 0.55 }, { scale: '1 1' }], { duration: 380, easing: 'ease-out', id: 'jiggle' });
  }
  function tap(e: MouseEvent, x: number) {
    if (editing) return;
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
    <button type="button" class="deco" class:editing data-nopan={editing || undefined} data-decor={p.id} data-item={p.item} data-x={p.x} data-z={p.z} data-f={p.f} data-sfx="self" aria-label={t(`decor.item.${p.item}`)}
      style={l.style} style:height="calc({l.h} * var(--u))" style:width="calc({l.wd} * var(--u))"
      onclick={(e) => tap(e, p.x)}>
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
  /* in the もようがえ the finger is IslandEdit's */
  .deco.editing { touch-action: none; }
  .puff {
    position: absolute; left: 0; top: 0; width: calc(50 * var(--u)); height: calc(50 * var(--u)); translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(closest-side, rgba(255, 255, 255, .9), rgba(255, 255, 255, .5) 55%, transparent); animation: puff .6s ease-out both;
  }
  @keyframes puff { from { transform: scale(.3); opacity: 1; } to { transform: scale(1.3); opacity: 0; } }
</style>
