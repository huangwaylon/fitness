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
  // A goal at a card's upper right (docs/design.md "Kenkou"): 「- - 目標 8,000歩 ✎」, a chip that opens its editor in
  // place, a tray across the card under its header (so the chart moves down, nothing is covered and Safari scrolls
  // the field above the keyboard: `data-kb-scroll`): the goal's title, −/＋ by the spec's step around a 16px field
  // with its keypad (nothing focused, so no keyboard until the field is tapped), the range (coral after a refused
  // けってい), then 目標をなくす (a goal that may be cleared, once set), やめる and けってい. Esc, やめる or a tap
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
  /** A tap anywhere but the chip or the tray closes it, unchanged (the tap goes on to what it hit). */
  $effect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
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
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', esc, true);
    return () => {
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('keydown', esc, true);
    };
  });
</script>

{#if onsave && spec}
  <button type="button" class="gchip" class:open data-goal={id} data-sfx={open ? 'back' : 'page'} aria-expanded={open} aria-controls="goal-{id}"
    aria-label={t('goal.change', { what: spec.head(), g: value === null ? t('goal.notSet') : label })} bind:this={chip} onclick={show}>
    <span class="pill"><i class="gl {tone}" aria-hidden="true"></i><span>{label}</span><Glyph kind="pen" size={14} /></span>
  </button>
{:else}
  <span class="gchip ro" data-goal={id}><i class="gl {tone}" aria-hidden="true"></i>{label}</span>
{/if}

{#if open && spec}
  <form class="tray" id="goal-{id}" data-kb-scroll tabindex="-1" aria-label={spec.head()} bind:this={tray}
    onsubmit={(e) => { e.preventDefault(); ok(); }}>
    <p class="th"><b>{spec.head()}</b>{#if spec.note}<small>{spec.note()}</small>{/if}</p>
    <div class="row">
      <button type="button" class="nb" data-sfx="tick" data-goal-step="-1" aria-label={t('goal.less')} onclick={() => step(-1)}>−</button>
      <label class="fld">
        <span class="sr-only">{spec.head()}</span>
        <input type="text" inputmode={spec.decimals ? 'decimal' : 'numeric'} data-sfx="none" autocomplete="off" enterkeyhint="done" maxlength="7" size="6"
          placeholder={goalField(spec, start ?? spec.start)} bind:value={field} aria-invalid={bad} aria-describedby="goal-{id}-hint" oninput={() => (tried = false)} />
        <span class="u" aria-hidden="true">{spec.unit()}</span>
      </label>
      <button type="button" class="nb" data-sfx="tick" data-goal-step="1" aria-label={t('goal.more')} onclick={() => step(1)}>＋</button>
    </div>
    <p id="goal-{id}-hint" class="hint" class:bad>{spec.hint()}</p>
    {#if note}<p class="warn" data-goal-warn role="status">{note}</p>{/if}
    <div class="acts">
      {#if spec.clearable && value !== null}<button type="button" class="clr" data-sfx="undo" onclick={clear}>{t('weight.clearGoal')}</button>{/if}
      <button type="button" class="btn paper small" data-sfx="back" onclick={() => close()}>{t('common.cancel')}</button>
      <button type="submit" class="btn small" class:off={v === null} data-sfx="confirm">{t('kiroku.ok')}</button>
    </div>
  </form>
{/if}

<style>
  /* the chip: the card's goal line as it was (the swatch, 「目標 …」), on a control's skin when it can be changed */
  .gchip {
    margin-left: auto; position: relative; display: inline-flex; align-items: center; gap: 6px; flex: none;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap;
  }
  /* 44px to the touch (its box), a 32px pill to the eye; the header keeps its height (the margins) */
  button.gchip {
    appearance: none; border: 0; background: none; padding: 0; cursor: pointer; min-height: var(--hit); margin-block: -6px;
    color: var(--text);
  }
  .pill {
    display: inline-flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 10px 0 9px; border-radius: var(--r-pill);
    background: var(--ctl); box-shadow: var(--sh-ctl); transition: transform var(--dur-tap) var(--ease-squash);
  }
  button.gchip:active .pill { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  button.gchip.open .pill { background: var(--ctl-sel); color: var(--c-ink); }
  button.gchip :global(svg) { color: var(--text-soft); }
  button.gchip.open :global(svg) { color: inherit; }
  .gl { width: 14px; border-top: 2px solid var(--text-soft); }
  .gl.yuzu { border-top-color: var(--c-yuzu-lip); }

  /* the tray: the panel's tan under the card's header, its notch under the chip */
  .tray {
    flex: 1 0 100%; position: relative; display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; margin-top: 2px;
    padding: 10px 12px 12px; border-radius: 16px; background: var(--surface); outline: none;
    transform-origin: 100% 0; animation: tray-in var(--dur-base) var(--ease-bounce);
  }
  .tray::before {
    content: ''; position: absolute; top: -7px; right: 22px; width: 14px; height: 14px; border-radius: 3px;
    background: inherit; transform: rotate(45deg);
  }
  @keyframes tray-in { from { opacity: 0; transform: translateY(-6px) scale(.96); } to { opacity: 1; transform: none; } }
  .th { position: relative; display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; margin: 0; font-size: var(--fs-body); }
  .th small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .row { display: flex; align-items: center; gap: 8px; }
  .nb {
    appearance: none; border: 0; cursor: pointer; width: var(--hit); min-height: var(--hit); flex: none; border-radius: var(--r-pill);
    font: 700 var(--fs-talk)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .nb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .fld { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 6px; }
  input {
    flex: 1; min-width: 0; width: 100%; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn); text-align: right;
    font: 700 max(var(--fs-input), var(--fs-talk))/1.1 var(--font-num); color: var(--text); background: var(--ctl);
    box-shadow: inset 0 0 0 2px var(--edge); font-variant-numeric: tabular-nums;
  }
  input::placeholder { color: color-mix(in srgb, var(--text-soft) 55%, transparent); }
  input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  input[aria-invalid='true'] { box-shadow: inset 0 0 0 2px var(--c-coral); }
  .u { flex: none; font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
  .hint { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
  .hint.bad { color: var(--text); }
  .hint.bad::before { content: '! '; color: var(--c-coral); }
  /* the gentle note: the panel's ink on a soft yuzu wash, never coral (the goal is still allowed) */
  .warn {
    margin: 0; padding: 6px 10px; border-radius: 10px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text);
    background: color-mix(in srgb, var(--c-yuzu-lip) 22%, transparent);
  }
  .acts { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 2px; }
  .acts .btn { margin: 0; width: auto; padding: 0 16px; }
  /* 目標をなくす: a quiet text button at the left, 44px tall */
  .clr {
    appearance: none; border: 0; background: none; cursor: pointer; margin-right: auto; min-height: var(--hit); padding: 0 4px;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); text-decoration: underline; text-underline-offset: 3px;
  }
</style>
