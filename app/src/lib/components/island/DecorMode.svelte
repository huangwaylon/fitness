<script lang="ts">
  // The decorate mode (docs/design.md "Decorating"), NH's outdoor furniture placement, one-handed: a tray of the ten
  // items at the screen's foot with ✓ おわる; a tap on one puts it down as a ghost on fine ground in the middle of the
  // view, a drag moves it (snapped to the half-tile grid; the world doesn't scroll under the finger, a drag on empty
  // ground still does), a tap on the ground moves it there; its footprint shows green where it may stand, red where it
  // may not (and why, in the bar above the tray: turn, put away, cancel, place). A tap or a drag on a placed item picks
  // it up. Every change is one op (store/decor.svelte.ts): both phones see it. Its own chunk, loaded on the first use.
  // While a finger drags, the ghost is a moving world node (one transform a frame); nothing runs when still.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { art } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';
  import { decor } from '#lib/store/decor.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { DECOR_MAX } from '#lib/contract/decor.ts';
  import { OVER, useWorld } from './camera.svelte.ts';
  import { DECOR_ITEMS, decorArt, decorH, footOf, nearestSpot, newDecorId, placeWhy, snap, spotWhy, type DecorItem, type Facing, type Why } from './decor.ts';
  import { livePos } from '../motion/director.svelte.ts';
  import PLACES from './models.json';
  import { onMount } from 'svelte';

  interface Props {
    /** The scene (the tray stands at its foot, its taps are the mode's). */
    scene: HTMLElement;
    /** Leave the mode. */
    ondone: () => void;
  }
  let { scene, ondone }: Props = $props();
  const w = useWorld();

  /** What is being placed or moved (`id` null: a new one), where (`at`, mirrored from the ghost's plain position). */
  let sel = $state<{ id: string | null; item: DecorItem; f: Facing; p?: number; orig?: { x: number; z: number; f: Facing } } | null>(null);
  /** The ghost's spot: read every frame while a finger drags (plain, not reactive). */
  const g = { x: 0, z: 0 };
  let at = $state<[number, number]>([0, 0]);
  let why = $state<Why | null>(null);
  /** The item being moved, hidden among the placed ones (Decor). */
  export const moving = (): string | null => sel?.id ?? null;

  const avoid = () => [livePos('mine'), livePos('partner')].map(([x, z]) => [x, z] as [number, number]);
  const layout = () => decor.items;
  const P = PLACES as unknown as Record<string, { ax: number; ay: number }>;
  function look(item: DecorItem, f: Facing) {
    const key = decorArt(item, f), h = decorH(item, f), a = art(key), p = P[key];
    const wd = a ? (h * a.w) / a.h : h;
    return { key, h, wd, style: p ? `left:calc(${-p.ax * wd} * var(--u));bottom:calc(${-(1 - p.ay) * h} * var(--u))` : '' };
  }

  function moveTo(x: number, z: number, full: boolean) {
    if (!sel) return;
    const [sx, sz] = snap(sel.item, sel.f, x, z);
    const moved = sx !== g.x || sz !== g.z;
    g.x = sx;
    g.z = sz;
    if (moved) at = [sx, sz];
    const ctx = { id: sel.id ?? undefined, item: sel.item, x: sx, z: sz, f: sel.f };
    why = full ? placeWhy(layout(), ctx, avoid()) : spotWhy(sel.item, sel.f, sx, sz, layout(), sel.id ?? undefined, avoid());
    w.kick();
  }

  /** The world point in the middle of what the view shows of the ground (between the horizon and the tray). */
  function viewCentre(): { x: number; z: number } {
    const v = w.view, tray = trayEl?.getBoundingClientRect().height ?? 0;
    return w.worldAt(v.vw / 2, (v.horizon + v.vh - tray) / 2 + 20) ?? { x: 195, z: v.camZ };
  }

  /** A tap on the tray: that item, down on fine ground in the middle of the view (a new ghost). */
  function pickNew(item: DecorItem) {
    if (sel?.id) cancel();
    if (decor.room <= 0) {
      cue('boop');
      toasts.show(t('decor.full', { max: DECOR_MAX }), 2600);
      return;
    }
    const c = viewCentre();
    const f: Facing = sel && !sel.id ? sel.f : 0;
    const spot = nearestSpot(layout(), item, f, c.x, c.z, avoid()) ?? snap(item, f, c.x, c.z);
    sel = { id: null, item, f };
    g.x = NaN;
    moveTo(spot[0], spot[1], true);
    cue('tick');
  }

  /** A placed item picked up (a tap or the start of a drag on it, Decor's pointerdown). */
  export function pick(id: string, e: PointerEvent) {
    const p = decor.byId(id);
    if (!p) return;
    if (sel && sel.id !== id) cancel();
    if (sel?.id !== id) {
      sel = { id, item: p.item, f: p.f, p: p.p, orig: { x: p.x, z: p.z, f: p.f } };
      g.x = NaN;
      moveTo(p.x, p.z, true);
      cue('tick');
    }
    startDrag(e);
  }

  // ---- the drag: the finger keeps its offset from the item's feet; the ghost moves a cell at a time ----
  let drag: { id: number; dx: number; dz: number; stop: () => void; moved: boolean } | null = null;
  /** Where and when a drag ended: the click the browser sends after it is the drag's, not a tap. */
  let dropped = { t: 0, x: 0, y: 0 };
  function startDrag(e: PointerEvent) {
    const wp = w.worldAtClient(e.clientX, e.clientY);
    if (!wp || !sel) return;
    e.preventDefault();
    drag?.stop();
    drag = { id: e.pointerId, dx: g.x - wp.x, dz: g.z - wp.z, stop: w.moveStart(), moved: false };
  }
  function onMove(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    const wp = w.worldAtClient(e.clientX, e.clientY);
    if (!wp) return;
    const bx = g.x, bz = g.z;
    moveTo(wp.x + drag.dx, wp.z + drag.dz, false);
    if (g.x !== bx || g.z !== bz) drag.moved = true;
  }
  function onUp(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.id) return;
    drag.stop();
    if (drag.moved) dropped = { t: Date.now(), x: e.clientX, y: e.clientY };
    drag = null;
    moveTo(g.x, g.z, true);
  }

  // ---- the mode's taps: the tray and the bar are buttons; anything else on the island is the mode's ----
  function onClick(e: MouseEvent) {
    const el = e.target instanceof Element ? e.target : null;
    if (!el || el.closest('[data-decor-ui]') || !el.closest('.stage')) return;
    e.stopPropagation();
    e.preventDefault();
    const afterDrag = Date.now() - dropped.t < 400 && Math.hypot(e.clientX - dropped.x, e.clientY - dropped.y) < 12;
    if (afterDrag || el.closest('[data-decor], [data-ghost]')) return;
    const wp = w.worldAtClient(e.clientX, e.clientY);
    if (!sel || !wp) return;
    moveTo(wp.x, wp.z, true);
    cue('tick');
  }

  function turn() {
    if (!sel) return;
    sel.f = ((sel.f + 1) % 4) as Facing;
    moveTo(g.x, g.z, true);
    cue('tick');
  }

  function cancel() {
    sel = null;
    why = null;
    drag?.stop();
    drag = null;
  }

  function place(): boolean {
    if (!sel) return false;
    const s = sel;
    if (why) {
      cue('boop');
      return false;
    }
    if (s.id) {
      const o = s.orig;
      if (!o || o.x !== g.x || o.z !== g.z || o.f !== s.f) decor.set({ id: s.id, item: s.item, x: g.x, z: g.z, f: s.f, p: s.p });
    } else if (!decor.set({ id: newDecorId(Date.now()), item: s.item, x: g.x, z: g.z, f: s.f })) {
      toasts.show(t('decor.full', { max: DECOR_MAX }), 2600);
      return false;
    }
    cue('confirm');
    sel = null;
    why = null;
    return true;
  }

  function putAway() {
    if (!sel?.id) return;
    const p = decor.byId(sel.id);
    cancel();
    if (!p || !decor.remove(p.id)) return;
    cue('undo');
    const name = t(`decor.item.${p.item}`);
    toasts.show(t('decor.removed', { name }), 5000, {
      action: {
        label: t('common.undo'),
        // a removal is final: the undo puts a new one down where it stood (if the spot is still free)
        run: () => {
          if (!placeWhy(layout(), { item: p.item, x: p.x, z: p.z, f: p.f })) decor.set({ id: newDecorId(Date.now()), item: p.item, x: p.x, z: p.z, f: p.f, p: p.p });
        }
      }
    });
  }

  function done() {
    if (sel) {
      if (!place()) cancel();
    }
    ondone();
  }

  // the partner took away (or moved) the one I'm holding: let go of it
  onMount(() =>
    decor.on(({ e }) => {
      if (sel?.id && e.id === sel.id && e.rm) cancel();
    })
  );

  onMount(() => {
    scene.addEventListener('click', onClick, true);
    addEventListener('pointermove', onMove);
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (sel ? cancel() : ondone());
    addEventListener('keydown', esc);
    return () => {
      scene.removeEventListener('click', onClick, true);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
      removeEventListener('keydown', esc);
      drag?.stop();
    };
  });

  let trayEl = $state<HTMLElement>();
  /** The tray stands at the scene's foot, outside the scrolling world. */
  const toScene = (el: HTMLElement) => {
    scene.appendChild(el);
    return () => el.remove();
  };
  const live = () => [g.x, g.z] as const;
  const foot = $derived(sel ? footOf(sel.item, sel.f) : [0, 0]);
</script>

{#if sel}
  {@const l = look(sel.item, sel.f)}
  <!-- the footprint on the ground: green where it may stand, red where not, over everything (a villager in front never
       hides it); arrows say it can be dragged -->
  <div class="spr" aria-hidden="true" {@attach w.at({ mode: 'flat', x: g.x, z: g.z, h: 4, zi: OVER - 10, live })}>
    <i class="foot" class:bad={!!why} data-foot={why ? 'bad' : 'ok'} style:width="calc({foot[0] + 8} * var(--u))" style:height="calc({foot[1] + 8} * var(--u))">
      <b class="ar n"></b><b class="ar s"></b><b class="ar e"></b><b class="ar w"></b>
    </i>
  </div>
  <!-- what's held stands over everything while it's held (a tree or a villager in front never hides it) -->
  <div class="spr" data-ghost={sel.id ?? 'new'} data-item={sel.item} data-x={at[0]} data-z={at[1]} data-f={sel.f} {@attach w.at({ x: g.x, z: g.z, h: l.h + 6, live, inv: true, zi: OVER - 5 })}>
    {#key `${sel.item}-${sel.f}-${sel.id}`}
      <button type="button" class="ghost" data-sfx="self" aria-label={t(`decor.item.${sel.item}`)} style={l.style}
        style:height="calc({l.h} * var(--u))" style:width="calc({l.wd} * var(--u))" onpointerdown={startDrag}>
        <OfficialArt key={l.key} size="calc({l.h} * var(--u))" eager />
      </button>
    {/key}
  </div>
{/if}

<div class="dm" data-decor-ui {@attach toScene}>
  {#if sel}
    <div class="bar" role="toolbar" aria-label={t(`decor.item.${sel.item}`)}>
      <span class="say" class:bad={!!why} data-why={why ?? ''} aria-live="polite">{why ? t(`decor.why.${why}`) : t(`decor.item.${sel.item}`)}</span>
      <button type="button" class="act" data-act="turn" data-sfx="self" aria-label={t('decor.turn')} onclick={turn}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" /><path d="M19 4v4h-4" /></svg>
      </button>
      {#if sel.id}
        <button type="button" class="act" data-act="remove" data-sfx="self" aria-label={t('decor.remove')} onclick={putAway}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
        </button>
      {/if}
      <button type="button" class="act" data-act="cancel" data-sfx="self" aria-label={t('decor.cancel')} onclick={() => (cancel(), cue('tick'))}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
      </button>
      <button type="button" class="act ok" data-act="place" data-sfx="self" aria-label={t('decor.place')} aria-disabled={!!why} onclick={place}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>
      </button>
    </div>
  {:else}
    <div class="bar hint" data-decor-hint>{t(decor.items.length ? 'decor.hintMove' : 'decor.hint')}</div>
  {/if}
  <div class="tray" bind:this={trayEl}>
    <div class="items" role="group" aria-label={t('decor.tray')}>
      {#each DECOR_ITEMS as it (it)}
        <button type="button" class="it" data-tray={it} data-sfx="self" aria-label={t(`decor.item.${it}`)} aria-pressed={!!sel && !sel.id && sel.item === it}
          class:full={decor.room <= 0} onclick={() => pickNew(it)}>
          <OfficialArt key={decorArt(it, 0)} size={40} eager />
        </button>
      {/each}
    </div>
    <button type="button" class="done" data-decor-done data-sfx="confirm" onclick={done}>
      <span class="count" data-decor-count>{decor.items.length}/{DECOR_MAX}</span>
      <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg><span>{t('decor.done')}</span>
    </button>
  </div>
</div>

<style>
  .spr { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .ghost {
    position: absolute; left: 0; bottom: 0; display: flex; justify-content: center; align-items: flex-end; line-height: 0;
    appearance: none; border: 0; padding: 0; margin: 0; background: none; pointer-events: auto; cursor: grab; touch-action: none;
    -webkit-tap-highlight-color: transparent; transform-origin: 50% 100%; animation: lift .32s var(--ease-bounce) both;
    filter: drop-shadow(0 calc(6 * var(--u)) calc(3 * var(--u)) rgba(60, 40, 10, .25));
  }
  .ghost :global(.official) { max-width: none; }
  /* a finger's hold on it: its whole body, at least 52px on screen */
  .ghost::after {
    content: ''; position: absolute; left: 50%; bottom: calc(-6 * var(--u)); translate: -50% 0;
    width: max(110%, calc(52px * var(--inv, 1))); height: max(calc(100% + 6 * var(--u)), calc(52px * var(--inv, 1)));
  }
  /* picked up: it hops and stays lifted a little (no loop: nothing runs when still) */
  @keyframes lift { 0% { translate: 0 0; scale: 1 1; } 45% { translate: 0 calc(-10 * var(--u)); scale: .95 1.06; } 100% { translate: 0 calc(-5 * var(--u)); scale: 1 1; } }
  .foot {
    position: absolute; left: 0; top: 0; translate: -50% -50%; border-radius: calc(6 * var(--u));
    background: rgba(120, 220, 120, .38); box-shadow: inset 0 0 0 calc(2.5 * var(--u)) rgba(255, 255, 255, .9);
  }
  .foot.bad { background: rgba(240, 90, 80, .42); }
  .ar { position: absolute; width: calc(10 * var(--u)); height: calc(10 * var(--u)); border: solid #fff; border-width: calc(3 * var(--u)) calc(3 * var(--u)) 0 0; opacity: .95; }
  .ar.n { left: 50%; top: calc(-12 * var(--u)); translate: -50% 0; rotate: -45deg; }
  .ar.s { left: 50%; bottom: calc(-12 * var(--u)); translate: -50% 0; rotate: 135deg; }
  .ar.e { right: calc(-12 * var(--u)); top: 50%; translate: 0 -50%; rotate: 45deg; }
  .ar.w { left: calc(-12 * var(--u)); top: 50%; translate: 0 -50%; rotate: -135deg; }

  .dm {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 5; display: flex; flex-direction: column; align-items: stretch; gap: 8px;
    padding: 0 10px calc(var(--safe-bottom, 0px) + 10px); pointer-events: none; font: 700 var(--fs-s, 14px)/1.2 var(--font-ui);
  }
  .bar, .tray { pointer-events: auto; background: var(--plate); color: var(--plate-ink); border-radius: 22px; box-shadow: 0 3px 0 var(--plate-lip), 0 6px 16px rgba(40, 30, 10, .18); }
  .bar { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 16px; align-self: center; max-width: 100%; animation: up .2s var(--ease-soft) both; }
  .hint { padding: 12px 18px; color: var(--c-ink-soft, #7A6A50); }
  .say { flex: 1; min-width: 0; padding-right: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .say.bad { color: #C2412F; }
  .tray { display: flex; align-items: center; gap: 6px; padding: 6px; }
  /* all ten at once, two rows of five, in the thumb's reach */
  .items { flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 4px; }
  .it, .act, .done {
    appearance: none; border: 0; margin: 0; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent;
    display: grid; place-items: center; flex: none;
  }
  .it { width: 100%; height: 52px; border-radius: 16px; background: var(--c-card, #FFFCF2); box-shadow: inset 0 0 0 2px var(--c-edge, #E8DCC0); }
  .it :global(.official) { max-width: 90%; }
  .it[aria-pressed='true'] { box-shadow: inset 0 0 0 3px var(--c-leaf-edge, #6DBE5A); background: #F1FBE6; }
  .it.full { opacity: .45; }
  .it:active, .act:active, .done:active { scale: .94; }
  .count { font: 700 12px/1 var(--font-num, inherit); color: var(--c-ink-soft, #7A6A50); }
  .act { width: var(--hit, 44px); height: var(--hit, 44px); border-radius: 50%; background: var(--c-card, #FFFCF2); box-shadow: inset 0 0 0 2px var(--c-edge, #E8DCC0); }
  .act svg, .done svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .act.ok { background: var(--c-leaf, #7CC860); color: #fff; box-shadow: 0 2px 0 var(--c-leaf-lip, #4F9A3C); }
  .act.ok[aria-disabled='true'] { background: #CFC6B0; box-shadow: none; }
  .done { align-self: stretch; width: 68px; padding: 6px 4px; gap: 2px; display: flex; flex-direction: column; justify-content: center; border-radius: 16px; background: var(--c-yuzu, #F7D94C); box-shadow: 0 2px 0 var(--c-yuzu-lip, #D9B21E); }
  .it:focus-visible, .act:focus-visible, .done:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  @keyframes up { from { translate: 0 8px; opacity: 0; } to { translate: 0 0; opacity: 1; } }
</style>
