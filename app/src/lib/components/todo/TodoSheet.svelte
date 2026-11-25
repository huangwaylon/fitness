<script lang="ts">
  // やること (docs/todo.md "The sheet"): the one shared list, its own chunk with its strings, full height (Sheet's
  // `full`, the unified kit), over the list's store (todo.svelte.ts). Under one title bar (NavBar): a row per item, the
  // Tick its shared done (anyone's tick is everyone's), the text (and its note's first lines, soft) tapped opens its
  // actions (ActionSheet: 編集 · 上へ · 下へ · 削除); the field at the foot adds one (the return key too, the keyboard
  // stays up for the next); 「完了した項目を削除」 under them; this phone's 「この端末に通知」 (TodoNotify) last. A removal
  // is at once with 取り消す on the snackbar. Anyone (the guest too) does all of it. Item text isn't `.selectable` (a
  // tap acts; 編集's fields have the text to copy).
  // Due dates: while the add field is focused, quick chips over it (今日 · 明日 · 日付…: the next items added get that
  // date, the pick held while the keyboard stays up and shown in the placeholder, gone on a blur); a dated row's chip
  // after its text (「今日 15:00」 in leaf text, 「明日」, 「11/24（月）」, a past undone one in coral text; a bell when
  // the reminder names me) opens 編集 at 期限; 編集's form holds the text, the メモ, 期限 and 通知 (DueFields). The relay's
  // push state read on each opening (push.svelte.ts). `todoSheet.show({item})` (the HUD's peek, a reminder's tap) opens
  // with the item in view and flashed 1 s. Kept mounted between openings (Sheet's `keep`).
  import '#lib/i18n/todo.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Tick from '../ui/Tick.svelte';
  import Icon from '../ui/Icon.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import ActionSheet, { type Action } from '../ui/ActionSheet.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Chip from '../ui/Chip.svelte';
  import DueFields from './DueFields.svelte';
  import TodoNotify from './TodoNotify.svelte';
  import { todo } from './todo.svelte.ts';
  import { todoSheet } from './open.svelte.ts';
  import { readPushState, todoPush } from './push.svelte.ts';
  import { dayLabel, dueLabel } from './dueLabel.ts';
  import { TODO_NOTE, TODO_TEXT, type TodoItemView } from '#lib/contract/todo.ts';
  import { dayOf, type Rem } from '#lib/contract/todoDue.ts';
  import { addDays } from '#lib/contract/tokyo.ts';
  import type { Who } from '#lib/types.ts';
  import { tick, untrack } from 'svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { undoBanner, UNDO_MS } from '#lib/store/actions.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  /** A name on the one-line snackbar at most (characters). */
  const BANNER_NAME = 12;
  const clip = (s: string): string => ((cs) => (cs.length > BANNER_NAME ? `${cs.slice(0, BANNER_NAME - 1).join('')}…` : s))([...s]);

  const items = $derived(todo.items);
  const doneN = $derived(items.filter((i) => i.done).length);
  let body: HTMLElement | undefined = $state();
  let draft = $state('');
  let field: HTMLInputElement | undefined = $state();
  const today = $derived(dayKey(minuteNow()));
  const me = $derived<Who>(week.view?.viewer ?? 'A');

  // ---- the quick chips over the add field: the next items' date, held while the keyboard stays up
  let quick = $state<string | null>(null);
  let typing = $state(false);
  let quickEl: HTMLElement | undefined = $state();
  const quickDay = $derived(quick === today ? t('todo.today') : quick === addDays(today, 1) ? t('todo.tomorrow') : quick ? dayLabel(quick) : '');
  const quickOther = $derived(quick && quick !== today && quick !== addDays(today, 1) ? quick : null);
  /** When a finger last came down on the chips or 追加 (WebKit still blurs the field for a tap there: the tap's click
   *  focuses it again, so a blur just after one waits for that before the chips go). */
  let heldAt = 0;
  const refocus = () => field?.focus({ preventScroll: true });
  function pickQuick(d: string) {
    quick = quick === d ? null : d;
    refocus();
  }
  /** Focus left the field and its chips (a blur, the picker closed): the chips go, the pick with them. */
  function leftField() {
    setTimeout(() => {
      const a = document.activeElement;
      if (a === field || (a && quickEl?.contains(a))) return;
      typing = false;
      quick = null;
    }, performance.now() - heldAt < 1000 ? 400 : 0);
  }
  /** A tap on the chips or 追加 keeps the focus (and the keyboard) on the field; the date's input takes it (its picker). */
  function keepFocus(e: Event) {
    if ((e.target as Element).closest('input')) return;
    heldAt = performance.now();
    // (a touch's pointerdown or touchstart cancelled, WebKit sends no click: only the mouse's down is held back)
    if (e.type === 'mousedown') e.preventDefault();
  }
  function holdFocus(el: HTMLElement) {
    for (const k of ['pointerdown', 'mousedown']) el.addEventListener(k, keepFocus);
    return () => ['pointerdown', 'mousedown'].forEach((k) => el.removeEventListener(k, keepFocus));
  }

  // the relay's push state, read at each opening (the form's presence; this phone's subscription kept fresh)
  $effect(() => {
    if (!open) return;
    untrack(() => void readPushState().then((s) => s && todoPush.refresh(s.vapidPublic, i18n.locale === 'en' ? 'en' : 'ja')));
  });

  // ---- opened at an item (todoSheet.show({item})): the item in view (not scrolled if it already is), flashed 1 s;
  // waits for the items (a cold start from a reminder's tap)
  let want = $state<string | null>(null);
  let flash = $state<string | null>(null);
  $effect(() => {
    const a = todoSheet.ask;
    if (a) untrack(() => (want = a.arg?.item ?? null));
  });
  $effect(() => {
    const w = want;
    if (!w || !open || !items.some((i) => i.id === w)) return;
    untrack(() => {
      want = null;
      void tick().then(() => flashItem(w));
    });
  });
  function flashItem(id: string) {
    const el = body?.querySelector<HTMLElement>(`[data-todo-item="${id}"]`);
    if (!el || !body) return;
    const r = el.getBoundingClientRect(), b = body.getBoundingClientRect();
    if (r.top < b.top || r.bottom > b.bottom) el.scrollIntoView({ block: 'center' });
    flash = id;
    setTimeout(() => flash === id && (flash = null), 1000);
  }

  function closed() {
    draft = '';
    quick = null;
    want = null;
    form.open = false;
    body?.scrollTo({ top: 0 });
  }

  function add(e: SubmitEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    if (todo.add(draft, quick ?? undefined)) draft = '';
    field?.focus({ preventScroll: true });
  }

  // ---- 編集: an item's text, note, due and reminder
  type Form = { id: string | null; text: string; note: string; open: boolean; due: string | null; rem: Rem | null; to: Who[]; atDue?: boolean };
  let form = $state<Form>({ id: null, text: '', note: '', open: false, due: null, rem: null, to: [] });
  const can = $derived(!!form.text.trim());
  /** 編集 for an item; `atDue`: opened from its date chip, 期限 in view and no keyboard. */
  function openItem(it: TodoItemView, atDue = false) {
    form = { id: it.id, text: it.text, note: it.note ?? '', open: true, due: it.due ?? null, rem: it.rem ?? null, to: [...(it.to ?? [])], atDue };
    if (atDue) void tick().then(() => document.getElementById('todo-due-h')?.scrollIntoView({ block: 'start' }));
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!can || !form.id) return;
    todo.edit(form.id, form.text, form.note, { due: form.due, rem: form.rem, to: form.to });
    form.open = false;
  }

  // ---- an item's actions
  let target = $state<{ item: TodoItemView; i: number } | null>(null);
  let acting = $state(false);
  const itemActs = $derived<Action[][]>(target ? [
    [
      { id: 'edit', label: t('todo.editItem'), icon: 'edit' },
      { id: 'up', label: t('todo.up'), icon: 'up', off: target.i === 0 },
      { id: 'down', label: t('todo.down'), icon: 'down', off: target.i === items.length - 1 }
    ],
    [{ id: 'del', label: t('todo.delete'), icon: 'trash', danger: true }]
  ] : []);
  function pickItem(a: string) {
    const x = target;
    if (!x) return;
    if (a === 'edit') openItem(x.item);
    else if (a === 'up') todo.move(x.item.id, x.i - 1);
    else if (a === 'down') todo.move(x.item.id, x.i + 1);
    else if (a === 'del') undoBanner(t('todo.removed', { name: clip(x.item.text) }), todo.removeHeld(x.item.id, UNDO_MS));
  }
  function clearDone() {
    undoBanner(t('todo.cleared', { n: doneN }), todo.clearDoneHeld(UNDO_MS));
  }
</script>

<Sheet bind:open tunes label={t('todo.title')} variant="full" onclose={closed} timed="todo" keep>
  <div class="td">
    <NavBar title={t('todo.title')} onclose={() => (open = false)} />
    <div class="td-body sheet-scroll" bind:this={body} data-todo>
      {#if !items.length}<p class="empty" data-todo-empty><Phrases text={t('todo.empty')} /></p>{/if}
      <div class="card dense">
        {#each items as it, i (it.id)}
          <div class="row item" class:done={it.done} class:hl={flash === it.id} data-todo-item={it.id} data-done={it.done || undefined}>
            <Tick checked={it.done} label={it.text} onchange={(v) => todo.tick(it.id, v)} />
            <button type="button" class="txt" class:sel={acting && target?.item.id === it.id} aria-label={t('todo.acts', { name: it.text })} data-todo-acts={it.id} data-sfx="open"
              onclick={() => ((target = { item: it, i }), (acting = true))}>
              <span class="t">{it.text}</span>
              {#if it.note}<span class="note" data-todo-note>{it.note}</span>{/if}
            </button>
            {#if it.due}
              {@const day = dayOf(it.due, today)}
              {@const when = dueLabel(it.due, today)}
              <button type="button" class="due" data-todo-due={it.id} data-day={day} data-sfx="open" aria-label={t('todo.dueChip', { when })} onclick={() => openItem(it, true)}>
                <span class="tag" class:now={day === 'today' && !it.done} class:over={day === 'past' && !it.done} class:soft={it.done}>{#if it.rem && it.to?.includes(me)}<Icon name="bell" size={14} /><span class="sr-only">{t('todo.bell')}</span>{/if}{when}</span>
              </button>
            {/if}
          </div>
        {/each}
        <form class="row addf" data-kb-scroll onsubmit={add} {@attach holdFocus}>
          <div class="addrow">
            <input class="input" type="text" bind:this={field} bind:value={draft} maxlength={TODO_TEXT} enterkeyhint="done" autocomplete="off" data-sfx="none" data-todo-field
              placeholder={quick ? t('todo.addFor', { day: quickDay }) : t('todo.addItem')} aria-label={quick ? t('todo.addFor', { day: quickDay }) : t('todo.addItem')}
              onfocus={() => (typing = true)} onblur={leftField} />
            <button type="submit" class="btn small press" aria-disabled={draft.trim() && todo.ready ? undefined : 'true'} data-todo-add data-sfx="confirm">{t('todo.add')}</button>
          </div>
          {#if typing}
            <div class="quick" bind:this={quickEl} onfocusout={leftField} data-todo-quick>
              <ChipRow label={t('todo.quick')}>
                <Chip label={t('todo.today')} selected={quick === today} onclick={() => pickQuick(today)} data-todo-quick-pick="today" />
                <Chip label={t('todo.tomorrow')} selected={quick === addDays(today, 1)} onclick={() => pickQuick(addDays(today, 1))} data-todo-quick-pick="tomorrow" />
                <span class="chip s date" class:on={!!quickOther} data-todo-quick-pick="date">
                  <span aria-hidden="true">{quickOther ? dayLabel(quickOther) : t('todo.pickDate')}</span>
                  <input type="date" value={quickOther ?? ''} min="2024-01-01" max="2099-12-31" aria-label={t('todo.pickDateLabel')} data-sfx="tick" data-todo-quick-date
                    onchange={(e) => { if (e.currentTarget.value) quick = e.currentTarget.value; refocus(); }} />
                </span>
              </ChipRow>
            </div>
          {/if}
        </form>
      </div>
      {#if doneN}
        <button type="button" class="text-link clear" data-todo-clear data-sfx="confirm" onclick={clearDone}>{t('todo.clearDone', { n: doneN })}</button>
      {/if}
      <TodoNotify />
    </div>
  </div>

  <ActionSheet name="todo.acts" bind:open={acting} title={target?.item.text ?? ''} groups={itemActs} onpick={pickItem} />
  <Sheet name="todo.form" bind:open={form.open} title={t('todo.editItem')} focusField={!form.atDue}>
    <form id="todo-form" onsubmit={submit}>
      <input class="input" type="text" bind:value={form.text} maxlength={TODO_TEXT} enterkeyhint="done" autocomplete="off" data-sfx="none" data-todo-form-field
        aria-label={t('todo.editItem')} placeholder={t('todo.addItem')} />
      <textarea class="input note-f" rows="3" bind:value={form.note} maxlength={TODO_NOTE} aria-label={t('todo.note')} placeholder={t('todo.notePh')} data-sfx="none" data-todo-form-note></textarea>
      <DueFields bind:due={form.due} bind:rem={form.rem} bind:to={form.to} {me} />
    </form>
    {#snippet footer()}
      <button type="submit" form="todo-form" class="btn" aria-disabled={can ? undefined : 'true'} data-todo-save data-sfx="confirm">{t('common.save')}</button>
    {/snippet}
  </Sheet>
</Sheet>

<style>
  /* the sheet's column (Sheet's full: edge to edge), the title bar under the safe area */
  .td { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: var(--ui-top) var(--safe-right) 0 var(--safe-left); }
  .td > :global(.navbar) { margin-inline: 6px; }
  .td-body { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 12px; padding: 4px 16px calc(24px + var(--safe-bottom)); }
  .row :global(svg) { flex: none; }
  .empty { margin: 0; padding: 16px 12px 0; text-align: center; color: var(--text-soft); }
  .item { padding-block: 0; padding-right: 0; }
  .txt {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; font-size: var(--fs-body); line-height: 1.35; text-align: start; cursor: pointer;
    -webkit-tap-highlight-color: transparent; flex: 1; min-width: 0; min-height: var(--hit); padding: 10px 12px 10px 0;
    display: flex; flex-direction: column; justify-content: center; gap: 2px;
  }
  /* the typed texts break as normal Japanese, never wider than their card; a note's first 3 lines, soft */
  .t, .note { word-break: normal; overflow-wrap: anywhere; }
  .note {
    font-size: var(--fs-s); line-height: 1.4; color: var(--text-soft); white-space: pre-line;
    display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; overflow: hidden;
  }
  .txt:active, .sel { background: var(--hl); }
  .txt:focus-visible { outline-offset: -3px; }
  .done .t { color: var(--text-soft); text-decoration: line-through; text-decoration-thickness: 1.5px; }
  .addf { flex-direction: column; align-items: stretch; gap: 4px; }
  .addrow { display: flex; align-items: center; gap: 8px; }
  .addrow .input { flex: 1; min-width: 0; }
  .quick { margin: 0 -12px; }
  .date { position: relative; }
  .date.on { background: var(--ctl-sel); color: var(--c-ink); }
  /* the native picker's input over the chip's whole 44px hit, unseen (a direct tap opens WebKit's picker) */
  .date input { position: absolute; inset: -6px -3px; width: calc(100% + 6px); height: calc(100% + 12px); margin: 0; padding: 0; border: 0; opacity: 0; font-size: 16px; cursor: pointer; }
  /* a row's date: the tag in a 44px-tall hit at the row's end; today in leaf text, overdue in coral text, done soft */
  .due { appearance: none; border: 0; background: none; margin: 0; padding: 0 10px 0 4px; min-height: var(--hit); flex: none; display: flex; align-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .due .tag { color: var(--text); font-family: var(--font-num); font-weight: 600; }
  .due .tag.now { color: var(--leaf-text); }
  .due .tag.over { color: var(--coral-text); }
  .due .tag.soft { color: var(--text-soft); }
  .due:active .tag { background: var(--hl); }
  .item { transition: background-color 600ms var(--ease-soft); }
  .item.hl { background: var(--hl); transition: none; }
  .clear { justify-self: start; }
  form#todo-form { display: grid; gap: 8px; padding-top: 4px; }
  .note-f { resize: vertical; min-height: 84px; font: 400 var(--fs-input)/1.45 var(--font-body); }
</style>
