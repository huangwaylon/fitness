<script lang="ts">
  // 設定 → メニュー → 並び順's level (docs/design.md "Settings"): the leaf menu's pills in my order, one dense card;
  // ベル first and 設定 last stay put (soft, no handle), the others each with a grip handle (44px, touch-action none: a
  // drag there never scrolls the sheet). A drag moves the row under the finger, the rows between make room, and the
  // drop sends my order at once (store/menu.ts setMenuOrder); ↑ / ↓ on a focused handle move it one place. 元に戻す
  // (only once it isn't the default) puts the default back at once, 取り消す on its banner. No haptics.
  import { tick } from 'svelte';
  import Icon from '../ui/Icon.svelte';
  import { botTabs } from '../bots/open.svelte.ts';
  import { myMenuOrder, resetMenuOrder, setMenuOrder } from '#lib/store/menu.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { MENU_LABEL, menuDefaults, moved } from '#lib/ui-state/menuOrder.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';

  const bots = $derived(botTabs().length > 0);
  const order = $derived(myMenuOrder(bots));
  const isDefault = $derived(order.join() === menuDefaults(bots).join());

  /** The row being dragged: where it started, how far the finger has gone, a row's pitch (px). */
  let drag = $state<{ from: number; y0: number; dy: number; pitch: number; pointer: number } | null>(null);
  /** Where the dragged row would drop. */
  const to = $derived(drag ? Math.max(0, Math.min(order.length - 1, drag.from + Math.round(drag.dy / drag.pitch))) : -1);
  /** The frame after a drop: the rows take their new places without sliding there again. */
  let settle = $state(false);
  /** A polite line after a move (「旅行：2番目」) for VoiceOver. */
  let said = $state('');

  /** How far row `i` sits from its place while a drag is on. */
  function shift(i: number): number {
    if (!drag) return 0;
    if (i === drag.from) return drag.dy;
    if (drag.from < to && i > drag.from && i <= to) return -drag.pitch;
    if (drag.from > to && i >= to && i < drag.from) return drag.pitch;
    return 0;
  }

  function down(e: PointerEvent, i: number) {
    if (drag || e.button > 0) return;
    const row = (e.currentTarget as HTMLElement).closest<HTMLElement>('[data-menu-row]');
    if (!row) return;
    e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* a pointer already gone */
    }
    drag = { from: i, y0: e.clientY, dy: 0, pitch: row.offsetHeight, pointer: e.pointerId };
  }
  function move(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    // (held inside the movable rows: never over ベル or 設定)
    drag.dy = Math.max(-drag.from * drag.pitch, Math.min((order.length - 1 - drag.from) * drag.pitch, e.clientY - drag.y0));
  }
  function up(e: PointerEvent) {
    if (!drag || e.pointerId !== drag.pointer) return;
    const from = drag.from, at = to;
    settle = true;
    drag = null;
    if (at !== from) put(from, at);
    requestAnimationFrame(() => requestAnimationFrame(() => (settle = false)));
  }
  function key(e: KeyboardEvent, i: number) {
    const by = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0;
    if (!by || i + by < 0 || i + by >= order.length) return;
    e.preventDefault();
    const id = order[i];
    put(i, i + by);
    // (the keyed row moved in the DOM, which drops its focus: back on its grip)
    void tick().then(() => document.querySelector<HTMLElement>(`[data-menu-grip="${id}"]`)?.focus({ preventScroll: true }));
  }
  function put(from: number, at: number) {
    const id = order[from];
    setMenuOrder(moved(order, from, at), bots);
    cue('tick');
    said = t('panel.menuMoved', { name: t(MENU_LABEL[id]), n: at + 2 });
  }
  function reset() {
    if (isDefault) return;
    undoBanner(t('panel.menuResetDone'), resetMenuOrder());
    said = '';
  }
</script>

<div class="card dense" data-menu-order class:dragging={drag !== null} class:settle>
  <div class="row fixed" data-menu-fixed="bells">{t('island.bellsRow')}</div>
  {#each order as id, i (id)}
    <div class="row" class:lift={drag?.from === i} data-menu-row={id} style:transform={drag ? `translateY(${shift(i)}px)` : null}>
      <span class="name">{t(MENU_LABEL[id])}</span>
      <button type="button" class="grip" aria-label={t('panel.menuMove', { name: t(MENU_LABEL[id]) })} aria-describedby="menu-order-hint" data-menu-grip={id} data-sfx="self"
        onpointerdown={(e) => down(e, i)} onpointermove={move} onpointerup={up} onpointercancel={() => (drag = null)} onkeydown={(e) => key(e, i)}>
        <Icon name="grip" size={22} stroke={2.6} />
      </button>
    </div>
  {/each}
  <div class="row fixed" data-menu-fixed="settings">{t('island.settings')}</div>
</div>
<p class="hint" id="menu-order-hint">{t('panel.menuHint')}</p>
<div class="foot">
  <button type="button" class="btn small paper" data-menu-reset aria-disabled={isDefault ? 'true' : undefined} data-sfx="tick" onclick={reset}>{t('panel.menuReset')}</button>
</div>
<p class="sr-only" aria-live="polite">{said}</p>

<style>
  .card.dense { overflow: visible; }
  .row { background: var(--card); border-radius: var(--r-row); transition: transform 160ms var(--ease-soft); }
  .dragging .row { touch-action: none; }
  .settle .row { transition: none; }
  .fixed { color: var(--text-soft); }
  .name { flex: 1; min-width: 0; font-weight: 700; }
  /* the dragged row: over the others, lifted, following the finger (no easing) */
  .lift { z-index: 1; transition: none; box-shadow: var(--sh-lip); }
  .lift::before { display: none; }
  .lift + .row::before { display: none; }
  .grip {
    flex: none; display: grid; place-items: center; width: var(--hit); height: var(--hit); margin: -10px -8px -10px 0;
    appearance: none; border: 0; background: none; color: var(--text-soft); cursor: grab; touch-action: none;
    -webkit-tap-highlight-color: transparent; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none;
  }
  .lift .grip { cursor: grabbing; color: var(--text); }
  .grip:focus-visible { outline-offset: -4px; border-radius: var(--r-row); }
  .hint { margin: -6px 4px 0; font-size: var(--fs-s); color: var(--text-soft); line-height: var(--lh); text-wrap: pretty; }
  .foot { display: flex; justify-content: flex-end; }
</style>
