<script module lang="ts">
  /** The one editor open, whichever card it's on: opening another closes it. */
  let openId = $state<number | null>(null);
  let nextId = 0;
  /** The sheet closed: no editor open at the next opening. */
  export function closeGoalEdit(): void {
    openId = null;
  }
</script>

<script lang="ts">
  // A goal at a card's upper right (docs/design.md "Kenkou"): 「- 目標 8,000歩 以上 ✎」, a small chip (its swatch the
  // chart's goal line) that opens its editor in place, a tray across the card under its header (so the chart moves
  // down, nothing is covered and Safari scrolls the field above the keyboard: `data-kb-scroll`): any note (活動's
  // 「今日から」), −/＋ by the spec's step around a 16px field with its keypad (nothing focused, so no keyboard until the
  // field is tapped), the range (coral after a refused 決定), then 目標を外す (a goal that may be cleared, once set),
  // キャンセル and 決定. No title: the card's heading and the open chip say whose goal it is. Esc, キャンセル or a tap
  // anywhere else close it unchanged; the focus goes back to the chip. Read-only (the guest's, a fixed goal): the
  // label alone. A goal that may be unwise (`warn`: the kcal goal under the person's resting energy or the safe floor)
  // gets a gentle note under the range as it's typed, and still saves ("warn, allow"). One shared control for every goal, けんこう's and ごはん's (`goals.ts` GOAL_SPECS).
  // Placed in a card's `header` (display: flex; flex-wrap: wrap): the chip and the tray are its items.
  import { tick } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import Glyph from '../kiroku/Glyph.svelte';
  import { goalField, nudge, type GoalSpec } from './goals.ts';

  interface Props {
    /** What it is and how it's typed (absent: read-only, as without `onsave`). */
    spec?: GoalSpec | null;
    /** The chip's words, the goal with its direction (goals.ts goalLabel: 「目標 8,000歩 以上」, 「目標 まだ」). */
    label: string;
    /** The goal in force now, what the field starts from (null: none). */
    value: number | null;
    /** Sets it (null: cleared); the caller says so (its toast). Absent: read-only. */
    onsave?: ((v: number | null) => void) | null;
    /** The solid swatch's colour: the bar charts' soft line, or the dot charts' yuzu. */
    tone?: 'soft' | 'yuzu';
    /** Where −/＋ start when none is set (the latest weigh-in, say); else the spec's. */
    start?: number | null;
    /** A gentle note on a value it still takes (goals.ts kcalWarn), null: none. */
    warn?: ((v: number) => string | null) | null;
    /** A hook for tests and the focus: `data-goal`. */
    id: string;
  }
  let { spec = null, label, value, onsave = null, tone = 'soft', start = null, warn = null, id }: Props = $props();

  const me = nextId++;
  const open = $derived(openId === me && !!onsave && !!spec);
  let field = $state('');
  let tried = $state(false);
  const v = $derived(spec?.parse(field) ?? null);
  const bad = $derived(tried && v === null);
  const note = $derived(v !== null && warn ? warn(v) : null);
  let chip: HTMLButtonElement | undefined = $state();
  let tray: HTMLFormElement | undefined = $state();

  async function show() {
    if (!spec) return;
    if (open) return close();
    field = value === null ? '' : goalField(spec, value);
    tried = false;
    openId = me;
    await tick();
    tray?.focus({ preventScroll: true });
  }
  function close(refocus = true) {
    if (openId === me) openId = null;
    if (refocus) chip?.focus({ preventScroll: true });
  }
  function step(dir: -1 | 1) {
    if (!spec) return;
    field = goalField(spec, nudge(spec, v ?? value ?? start ?? spec.start, dir));
    tried = false;
  }
  function ok() {
    tried = true;
    if (v === null) return;
    close();
    onsave?.(v);
  }
  function clear() {
    close();
    onsave?.(null);
  }
  /** A tap anywhere but the chip or the tray closes it, unchanged (the tap goes on to what it hit: on its click, not its
   *  pointerdown, so the tray folding away doesn't move what the finger is on before it lifts, another card's chip say). */
  $effect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      const n = e.target as Node | null;
      if (n && !chip?.contains(n) && !tray?.contains(n)) close(false);
    };
    /** Esc closes the editor, not the sheet. */
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopPropagation();
      close();
    };
    document.addEventListener('click', away, true);
    document.addEventListener('keydown', esc, true);
    return () => {
      document.removeEventListener('click', away, true);
      document.removeEventListener('keydown', esc, true);
    };
  });
</script>

{#if onsave && spec}
  <button type="button" class="gchip" class:open data-goal={id} data-sfx={open ? 'back' : 'page'} aria-expanded={open} aria-controls="goal-{id}"
    aria-label={t('goal.change', { what: spec.head(), g: value === null ? t('goal.notSet') : label })} bind:this={chip} onclick={show}>
    <span class="pill"><i class="gl {tone}" aria-hidden="true"></i><span>{label}</span><Glyph kind="pen" size={12} /></span>
  </button>
{:else}
  <span class="gchip ro" data-goal={id}><i class="gl {tone}" aria-hidden="true"></i>{label}</span>
{/if}

{#if open && spec}
  <form class="tray" id="goal-{id}" data-kb-scroll tabindex="-1" aria-label={spec.head()} bind:this={tray}
    onsubmit={(e) => { e.preventDefault(); ok(); }}>
    {#if spec.note}<p class="th">{spec.note()}</p>{/if}
    <div class="row">
      <button type="button" class="btn-step" data-sfx="tick" data-goal-step="-1" aria-label={t('goal.less')} onclick={() => step(-1)}>−</button>
      <label class="fld">
        <span class="sr-only">{spec.head()}</span>
        <input class="input num" type="text" inputmode={spec.decimals ? 'decimal' : 'numeric'} data-sfx="none" autocomplete="off" enterkeyhint="done" maxlength="7" size="6"
          placeholder={goalField(spec, start ?? spec.start)} bind:value={field} aria-invalid={bad} aria-describedby="goal-{id}-hint" oninput={() => (tried = false)} />
        <span class="u" aria-hidden="true">{spec.unit()}</span>
      </label>
      <button type="button" class="btn-step" data-sfx="tick" data-goal-step="1" aria-label={t('goal.more')} onclick={() => step(1)}>＋</button>
    </div>
    <p id="goal-{id}-hint" class="hint" class:bad>{spec.hint()}</p>
    {#if note}<p class="warn" data-goal-warn role="status">{note}</p>{/if}
    <div class="acts">
      {#if spec.clearable && value !== null}<button type="button" class="text-link clr" data-sfx="undo" onclick={clear}>{t('weight.clearGoal')}</button>{/if}
      <button type="button" class="btn paper small" data-sfx="back" onclick={() => close()}>{t('common.cancel')}</button>
      <button type="submit" class="btn small" class:off={v === null} data-sfx="confirm">{t('kiroku.ok')}</button>
    </div>
  </form>
{/if}

<style>
  /* the chip: the card's goal line (the swatch, 「目標 …」), a quiet sunk pill (the stat line's chip's skin) with ✎ when
     it can be changed, yuzu while its tray is open */
  .gchip {
    margin-left: auto; position: relative; display: inline-flex; align-items: center; gap: 5px; flex: none;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  /* 44px to the touch (its box), a 28px pill to the eye; the header keeps its height (the margins) */
  button.gchip {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; min-height: var(--hit); margin-block: -8px;
  }
  .pill {
    display: inline-flex; align-items: center; gap: 5px; min-height: 28px; padding: 0 8px; border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--lip) 35%, transparent); transition: transform var(--dur-tap) var(--ease-squash);
  }
  button.gchip:active .pill { transform: translateY(1px); }
  button.gchip.open .pill { background: var(--ctl-sel); color: var(--c-ink); }
  button.gchip :global(svg) { color: var(--text-soft); }
  button.gchip.open :global(svg) { color: inherit; }
  .gl { width: 10px; border-top: 2px solid var(--text-soft); }
  .gl.yuzu { border-top-color: var(--c-yuzu-lip); }

  /* the tray: the panel's tan under the card's header, its notch under the chip */
  .tray {
    flex: 1 0 100%; position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 6px; margin-top: 2px;
    padding: 8px 10px; border-radius: 14px; background: var(--surface); outline: none;
    transform-origin: 100% 0; animation: tray-in var(--dur-base) var(--ease-bounce);
  }
  .tray::before {
    content: ''; position: absolute; top: -7px; right: 22px; width: 14px; height: 14px; border-radius: 3px;
    background: inherit; transform: rotate(45deg);
  }
  @keyframes tray-in { from { opacity: 0; transform: translateY(-6px) scale(.96); } to { opacity: 1; transform: none; } }
  .th { position: relative; margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .row { display: flex; align-items: center; gap: 8px; }
  .fld { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 6px; }
  input { flex: 1; }
  .u { flex: none; white-space: nowrap; font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
  .hint { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .hint.bad { color: var(--text); }
  .hint.bad::before { content: '! '; color: var(--coral-text); }
  /* the gentle note: the panel's ink on a soft yuzu wash, never coral (the goal is still allowed) */
  .warn {
    margin: 0; padding: 6px 10px; border-radius: 10px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text);
    background: color-mix(in srgb, var(--c-yuzu-lip) 22%, transparent);
  }
  .acts { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
  .acts .btn { margin: 0; width: auto; padding: 0 16px; }
  /* 目標をなくす: a quiet text button at the left, 44px tall */
  .clr { margin-right: auto; }
</style>
