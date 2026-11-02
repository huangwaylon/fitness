<script lang="ts">
  // The tent's edit mode (docs/design.md "The tent"): NH's furniture arranging, one-handed. The tray at the foot, in
  // the thumb's reach: its tabs (かぐ, ラグ, みつけた: what the balloons brought, かべがみ, ゆか) over NH's icons in a row
  // that scrolls sideways, and ✓ おわる with the count. A tap on an icon puts that piece down as a ghost on the free
  // spot nearest my villager (lifted, its footprint green or red on the floor); a finger on it (or on a placed piece:
  // it's picked up) drags it a tile at a time; a tap on the floor moves it there; ↻ まわす turns it a quarter; ✓ おく
  // places it (greyed while red, the bar saying why); 🗑 しまう takes a placed one away (とりけす on the banner); ✕ やめる
  // puts it back. A wallpaper or a floor is on the walls at once. While I hold a piece the partner's phone sees it move
  // (dragLink.ts); what the partner holds, I can't pick up. Every change is one op (store/tent.svelte.ts).
  import { onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { tent as room } from '#lib/store/tent.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { TENT_MAX } from '#lib/contract/tent.ts';
  import { DEFAULT_FLOOR, DEFAULT_WALL, FLOORS, ITEMS, STARTER, WALLS, footprint, iconUrl } from './items.ts';
  import { HALF, TILE, centreOf, nearestFree, placeWhy, snapTo, type Facing, type Spot, type Why } from './grid.ts';
  import type { Tent } from './engine.ts';
  import type { DragLink } from './dragLink.ts';

  interface Props {
    eng: () => Tent | null;
    link: DragLink;
    /** What the balloons brought that the tent can hold (codes, newest first). */
    finds: readonly string[];
    /** Where the villagers stand (a piece never lands on one). */
    villagers: () => readonly (readonly [number, number])[];
    /** The relay's clock (the hold's start: two people grabbing one piece). */
    relayNow: () => number;
    partnerName: string;
    ondone: () => void;
  }
  let { eng, link, finds, villagers, relayNow, partnerName, ondone }: Props = $props();

  type Tab = 'recent' | 'furniture' | 'rugs' | 'finds' | 'wall' | 'floor';
  /** The pieces I picked last (this phone's, newest first): NH's quick access to what's at hand. */
  const RECENT_MAX = 12;
  let recent = $state<string[]>(((r) => (Array.isArray(r) ? r.filter((c): c is string => typeof c === 'string' && !!ITEMS[c]) : []))(readJson<unknown>(localKV(), DEVICE.tentRecent)));
  const TABS = $derived<Tab[]>([...(recent.length ? ['recent' as const] : []), 'furniture', 'rugs', 'finds', 'wall', 'floor']);
  let tab = $state<Tab>('furniture');
  const list = $derived(
    tab === 'recent' ? recent : tab === 'furniture' ? STARTER.filter((c) => !ITEMS[c].rug) : tab === 'rugs' ? STARTER.filter((c) => ITEMS[c].rug) : tab === 'finds' ? finds : tab === 'wall' ? WALLS : FLOORS
  );
  /** How many of each piece stand in the room (the icons' counts). */
  const counts = $derived(room.pieces.reduce((m, p) => m.set(p.item, (m.get(p.item) ?? 0) + 1), new Map<string, number>()));
  /** An icon pressed: its name in the bar a moment (NH's name on a held icon). */
  let peek = $state<string | null>(null);
  let peekTimer: ReturnType<typeof setTimeout> | undefined;
  function peekAt(code: string) {
    clearTimeout(peekTimer);
    peek = code;
    peekTimer = setTimeout(() => (peek = null), 1600);
  }
  function used(code: string) {
    recent = [code, ...recent.filter((c) => c !== code)].slice(0, RECENT_MAX);
    writeJson(localKV(), DEVICE.tentRecent, recent);
  }

  /** What I hold: a new piece or a placed one (`orig`: where it stood). */
  let sel = $state<{ id: string; fresh: boolean; item: string; f: Facing; p?: number; orig?: { x: number; z: number; f: Facing } } | null>(null);
  let at = $state<[number, number]>([0, 0]);
  let why = $state<Why | 'villager' | null>(null);

  const others = (): Spot[] => room.pieces.map((p) => ({ id: p.id, item: p.item, x: p.x, z: p.z, f: p.f }));
  function check(): void {
    if (!sel) return void (why = null);
    const s: Spot = { id: sel.fresh ? undefined : sel.id, item: sel.item, x: at[0], z: at[1], f: sel.f };
    why = placeWhy(others(), s);
    if (!why && !ITEMS[sel.item]?.rug) {
      const [w, d] = footprint(sel.item, sel.f), x0 = -HALF + at[0] * TILE, z0 = -HALF + at[1] * TILE;
      if (villagers().some(([x, z]) => x > x0 - 2 && x < x0 + w * TILE + 2 && z > z0 - 2 && z < z0 + d * TILE + 2)) why = 'villager';
    }
  }
  /** The ghost, what's hidden, and the partner's view of what I hold. */
  function show(): void {
    const e = eng();
    if (!e) return;
    e.ghost(sel ? { item: sel.item, x: at[0], z: at[1], f: sel.f, ok: !why } : null);
    e.hide([...(sel && !sel.fresh ? [sel.id] : []), ...link.theirs().map((h) => h.id)]);
    if (sel) {
      const [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
      link.hold({ id: sel.id, item: sel.item, fresh: sel.fresh, x: cx, z: cz, f: sel.f }, relayNow());
    }
  }
  function moveTo(x: number, z: number): boolean {
    if (!sel) return false;
    const n = snapTo(sel.item, sel.f, x, z);
    if (n[0] === at[0] && n[1] === at[1]) return false;
    at = n;
    check();
    show();
    return true;
  }

  const newId = (t0: number) => `d${t0.toString(36)}${Math.floor(Math.random() * 36 ** 3).toString(36).padStart(3, '0')}`;

  function pickNew(code: string) {
    if (sel) cancel(false);
    if (room.room <= 0) {
      cue('boop');
      toasts.show(t('tent.full', { max: TENT_MAX }), 2600);
      return;
    }
    const me = villagers()[0] ?? [0, 0];
    const f: Facing = 0;
    const spot = nearestFree(others(), code, f, me[0], me[1] - 12) ?? snapTo(code, f, 0, 0);
    sel = { id: newId(Date.now()), fresh: true, item: code, f };
    at = spot;
    check();
    show();
    cue('tick');
    // (the recent list moves on only once this tab's grid is left alone: an icon never jumps under the finger)
    if (tab !== 'recent') used(code);
  }
  /** A placed piece picked up (a tap or the start of a drag on it): false when the partner holds it. */
  export function pickPlaced(id: string): boolean {
    const p = room.byId(id);
    if (!p) return false;
    if (link.heldThere(id)) {
      cue('boop');
      toasts.show(t('tent.heldThere', { name: partnerName }), 2000);
      return false;
    }
    if (sel?.id === id) return true;
    if (sel) cancel(false);
    sel = { id, fresh: false, item: p.item, f: p.f, p: p.p, orig: { x: p.x, z: p.z, f: p.f } };
    at = [p.x, p.z];
    check();
    show();
    cue('tick');
    return true;
  }

  // ---- the finger: on the ghost (or a placed piece) it drags; the screen hands its pointer events here ----
  let drag: { id: number; dx: number; dz: number; moved: boolean } | null = null;
  /** A pointer went down on the room: true when the mode takes it (a drag). */
  export function down(e: PointerEvent): boolean {
    const g = eng();
    if (!g) return false;
    const p = g.floorAt(e.clientX, e.clientY);
    const onGhost = (): boolean => {
      if (!sel || !p) return false;
      const [w, d] = footprint(sel.item, sel.f), [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
      return Math.abs(p[0] - cx) <= (w * TILE) / 2 + 4 && Math.abs(p[1] - cz) <= (d * TILE) / 2 + 4;
    };
    if (!onGhost()) {
      const id = g.pick(e.clientX, e.clientY);
      if (!id || !pickPlaced(id)) return false;
    }
    if (!sel || !p) return true;
    const [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
    drag = { id: e.pointerId, dx: cx - p[0], dz: cz - p[1], moved: false };
    return true;
  }
  export function move(e: PointerEvent): void {
    if (!drag || e.pointerId !== drag.id) return;
    const p = eng()?.floorAt(e.clientX, e.clientY);
    if (p && moveTo(p[0] + drag.dx, p[1] + drag.dz)) drag.moved = true;
  }
  export function up(e: PointerEvent): boolean {
    if (!drag || e.pointerId !== drag.id) return false;
    const moved = drag.moved;
    drag = null;
    if (moved) cue('tick');
    else {
      // a tap on the ghost (no drag): it goes where the finger was
      const p = eng()?.floorAt(e.clientX, e.clientY);
      if (p) tapFloor(p[0], p[1]);
    }
    return true;
  }
  /** A tap on the floor (no drag): the held piece goes there. */
  export function tapFloor(x: number, z: number): void {
    if (sel && moveTo(x, z)) cue('tick');
  }
  /** The partner began holding a piece: if it's mine and they took it first, I let go of it. */
  export function partnerHolds(id: string, since: number): void {
    if (sel?.id !== id || since >= link.since) return;
    cancel(false);
    toasts.show(t('tent.heldThere', { name: partnerName }), 2000);
  }
  /** The partner moved or took away the one I hold: let go of it. */
  export function changedThere(id: string, rm: boolean): void {
    if (sel?.id === id && rm) cancel(false);
  }

  function turn() {
    if (!sel) return;
    const [cx, cz] = centreOf({ item: sel.item, x: at[0], z: at[1], f: sel.f });
    sel.f = ((sel.f + 1) % 4) as Facing;
    at = snapTo(sel.item, sel.f, cx, cz);
    check();
    show();
    cue('tick');
  }
  function cancel(sound = true) {
    sel = null;
    why = null;
    drag = null;
    link.release();
    show();
    if (sound) cue('tick');
  }
  function place(): boolean {
    if (!sel) return false;
    if (why) {
      cue('boop');
      return false;
    }
    const s = sel;
    let ok = true;
    if (s.fresh) ok = room.set({ id: s.id, item: s.item, x: at[0], z: at[1], f: s.f });
    else if (!s.orig || s.orig.x !== at[0] || s.orig.z !== at[1] || s.orig.f !== s.f) ok = room.set({ id: s.id, item: s.item, x: at[0], z: at[1], f: s.f, p: s.p });
    if (!ok) {
      toasts.show(t('tent.full', { max: TENT_MAX }), 2600);
      cancel(false);
      return false;
    }
    cue('confirm');
    // the op went first: the partner's phone has the piece where it lands before the drag ends
    sel = null;
    why = null;
    link.release();
    show();
    return true;
  }
  function putAway() {
    if (!sel || sel.fresh) return;
    const p = room.byId(sel.id);
    cancel(false);
    if (!p || !room.remove(p.id)) return;
    cue('undo');
    toasts.show(t('tent.removed', { name: t(`tent.item.${p.item}`) }), 5000, {
      action: {
        label: t('common.undo'),
        // a removal is final: the undo puts a new one down where it stood (if the spot is still free)
        run: () => {
          if (!placeWhy(others(), { item: p.item, x: p.x, z: p.z, f: p.f })) room.set({ id: newId(Date.now()), item: p.item, x: p.x, z: p.z, f: p.f, p: p.p });
        }
      }
    });
  }
  function surface(kind: 'wall' | 'floor', code: string) {
    if (room.surface(kind, code)) cue('confirm');
  }
  function done() {
    if (sel && !place()) cancel(false);
    ondone();
  }
  const current = $derived(tab === 'wall' ? (room.wall ?? DEFAULT_WALL) : tab === 'floor' ? (room.floor ?? DEFAULT_FLOOR) : null);
  const nameOf = (code: string) => t(code[0] === 'w' ? `tent.wall.${code}` : code[0] === 'g' ? `tent.floor.${code}` : `tent.item.${code}`);

  onMount(() => {
    eng()?.grid(true);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && (sel ? cancel() : done());
    addEventListener('keydown', esc);
    return () => {
      removeEventListener('keydown', esc);
      sel = null;
      link.release();
      const g = eng();
      g?.ghost(null);
      g?.grid(false);
      g?.hide(link.theirs().map((h) => h.id));
    };
  });

  /** The e2e's view of the mode. */
  export const snapshot = () => ({ sel: sel ? { ...sel, x: at[0], z: at[1] } : null, why, tab });
</script>

<div class="te" data-tent-edit>
  {#if sel}
    <div class="bar" role="toolbar" aria-label={nameOf(sel.item)}>
      <span class="say" class:bad={!!why} data-why={why ?? ''} aria-live="polite">{why ? t(`tent.why.${why}`) : nameOf(sel.item)}</span>
      <button type="button" class="act" data-act="turn" data-sfx="self" aria-label={t('decor.turn')} onclick={turn}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12a7 7 0 1 1-2.05-4.95" /><path d="M19 4v4h-4" /></svg>
      </button>
      {#if !sel.fresh}
        <button type="button" class="act" data-act="remove" data-sfx="self" aria-label={t('decor.remove')} onclick={putAway}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></svg>
        </button>
      {/if}
      <button type="button" class="act" data-act="cancel" data-sfx="self" aria-label={t('decor.cancel')} onclick={() => cancel()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg>
      </button>
      <button type="button" class="act ok" data-act="place" data-sfx="self" aria-label={t('decor.place')} aria-disabled={!!why} onclick={place}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>
      </button>
    </div>
  {:else}
    <div class="bar hint" data-tent-hint>{peek ? nameOf(peek) : t(room.pieces.length ? 'tent.hintMove' : 'tent.hint')}</div>
  {/if}
  <div class="tray">
    <div class="tabs" role="tablist" aria-label={t('tent.edit')}>
      {#each TABS as k (k)}
        <button type="button" role="tab" class="tab" data-tab={k} data-sfx="self" aria-selected={tab === k} onclick={() => ((tab = k), cue('tick'))}>{t(`tent.tab.${k}`)}</button>
      {/each}
    </div>
    <div class="row">
      <!-- a grid that scrolls up and down under the thumb (no snapping: a tap is a tap, never the start of a jump) -->
      <div class="items" role="group" aria-label={t(`tent.tab.${tab}`)} data-tent-items>
        {#each list as code (code)}
          {@const n = counts.get(code) ?? 0}
          <button type="button" class="it" data-tent-item={code} data-sfx="self" aria-label={n ? `${nameOf(code)} ×${n}` : nameOf(code)}
            aria-pressed={current ? current === code : !!sel?.fresh && sel.item === code} class:full={!current && room.room <= 0}
            onpointerdown={() => peekAt(code)}
            onclick={() => (current ? surface(tab as 'wall' | 'floor', code) : pickNew(code))}>
            <img src={iconUrl(code)} alt="" width="48" height="48" loading="lazy" decoding="async" draggable="false" />
            {#if n}<span class="n" aria-hidden="true">{n}</span>{/if}
          </button>
        {:else}
          <p class="empty" data-tent-empty>{t('tent.findsEmpty')}</p>
        {/each}
      </div>
      <button type="button" class="done" data-tent-done data-sfx="confirm" onclick={done}>
        <span class="count" data-tent-count>{room.pieces.length}/{TENT_MAX}</span>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg><span>{t('decor.done')}</span>
      </button>
    </div>
  </div>
</div>

<style>
  .te {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 3; display: flex; flex-direction: column; align-items: stretch; gap: 8px;
    padding: 0 10px calc(var(--safe-bottom, 0px) + 10px); pointer-events: none; font: 700 var(--fs-s, 14px)/1.2 var(--font-ui);
  }
  .bar, .tray { pointer-events: auto; background: var(--plate); color: var(--plate-ink); border-radius: 22px; box-shadow: 0 3px 0 var(--plate-lip), 0 6px 16px rgba(20, 10, 0, .3); }
  .bar { display: flex; align-items: center; gap: 6px; padding: 6px 6px 6px 16px; align-self: center; max-width: 100%; animation: up .2s var(--ease-soft) both; }
  .hint { padding: 12px 18px; color: var(--c-ink-soft, #7A6A50); }
  .say { flex: 1; min-width: 0; padding-right: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .say.bad { color: #C2412F; }
  .tray { display: flex; flex-direction: column; gap: 6px; padding: 8px; }
  .tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; }
  .tab {
    flex: 1 0 auto; min-height: 44px; padding: 0 9px; border-radius: 14px; border: 0; font: inherit; color: inherit; cursor: pointer;
    background: transparent; -webkit-tap-highlight-color: transparent; white-space: nowrap; color: var(--c-ink, #4A3A2C);
  }
  .tab[aria-selected='true'] { background: var(--c-yuzu, #F7D94C); box-shadow: 0 2px 0 var(--c-yuzu-lip, #D9B21E); }
  .row { display: flex; gap: 6px; align-items: stretch; }
  /* NH's grid: rows of icons, two and a bit in view (the next row peeking: there's more), scrolled up and down; no
     snapping and no sideways pan, so a tap is never taken for the start of a scroll that jumps the list */
  .items {
    flex: 1; min-width: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); grid-auto-rows: 60px; gap: 6px;
    max-height: calc(60px * 2.4 + 12px); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; touch-action: pan-y;
    scrollbar-width: none; padding: 2px; -webkit-overflow-scrolling: touch;
  }
  .items::-webkit-scrollbar, .tabs::-webkit-scrollbar { display: none; }
  .it, .act, .done {
    appearance: none; border: 0; margin: 0; font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent;
    display: grid; place-items: center; flex: none;
  }
  .it { position: relative; width: 100%; height: 60px; border-radius: 16px; background: var(--c-card, #FFFCF2); box-shadow: inset 0 0 0 2px var(--c-edge, #E8DCC0); touch-action: pan-y; }
  .it img { width: 48px; height: 48px; object-fit: contain; pointer-events: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  /* how many already stand in the room */
  .n {
    position: absolute; right: 4px; top: 4px; min-width: 18px; height: 18px; padding: 0 4px; border-radius: 9px; display: grid; place-items: center;
    font: 700 11px/1 var(--font-num, inherit); color: #fff; background: var(--c-leaf-lip, #4F9A3C);
  }
  .it[aria-pressed='true'] { box-shadow: inset 0 0 0 3px var(--c-leaf-edge, #6DBE5A); background: #F1FBE6; }
  .it.full { opacity: .45; }
  .empty { grid-column: 1 / -1; margin: 0; align-self: center; padding: 12px 8px; color: var(--c-ink-soft, #7A6A50); font-weight: 700; white-space: normal; text-align: center; }
  .it:active, .act:active, .done:active { scale: .94; }
  .count { font: 700 12px/1 var(--font-num, inherit); color: var(--c-ink-soft, #7A6A50); }
  .act { width: var(--hit, 44px); height: var(--hit, 44px); border-radius: 50%; background: var(--c-card, #FFFCF2); box-shadow: inset 0 0 0 2px var(--c-edge, #E8DCC0); }
  .act svg, .done svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  .act.ok { background: var(--c-leaf, #7CC860); color: #fff; box-shadow: 0 2px 0 var(--c-leaf-lip, #4F9A3C); }
  .act.ok[aria-disabled='true'] { background: #CFC6B0; box-shadow: none; }
  .done { width: 68px; padding: 6px 4px; gap: 2px; display: flex; flex-direction: column; justify-content: center; border-radius: 16px; background: var(--c-yuzu, #F7D94C); box-shadow: 0 2px 0 var(--c-yuzu-lip, #D9B21E); }
  .it:focus-visible, .act:focus-visible, .done:focus-visible, .tab:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  @keyframes up { from { translate: 0 8px; opacity: 0; } to { translate: 0 0; opacity: 1; } }
</style>
