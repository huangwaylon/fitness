<script module lang="ts">
  /** A reopening this soon after the close shows the list it closed on (docs/todo.md "The sheet"). */
  const RESUME_MS = 10 * 60_000;
  /** The list a close left (module-level: kept when the sheet's content is let go while closed). */
  let left: { at: string; ms: number } | null = null;
</script>

<script lang="ts">
  // やること (docs/todo.md): shared to-do lists, its own chunk with its strings, full height (Sheet's `full`,
  // the unified kit), over the lists' store (todo.svelte.ts). Two levels under one title bar (NavBar): the lists (a card
  // row each: its title and 「3 / 5」; 「＋ 新しいリスト」), and a list (‹ back, ⋯: 名前を変更 · リストを削除). In a list: a row
  // per item, the Tick its shared done (anyone's tick is everyone's), the text tapped opens its actions (ActionSheet:
  // 編集 · 上へ · 下へ · 削除); the field at the foot adds one (the return key too, the keyboard stays up for the next);
  // 「完了した項目を削除」 under them. A removal is at once with 取り消す on the banner; a list's asks first (Sheet confirm).
  // Anyone (the guest too) does all of it. Item text isn't `.selectable` (a tap acts; 編集's field has the text to copy).
  // Due dates (docs/todo.md "The sheet"): while the add field is focused, quick chips over it (今日 · 明日 · 日付…: the
  // next items added get that date, the pick held while the keyboard stays up and shown in the placeholder, gone on a
  // blur or leaving the list); a dated row's chip after its text (「今日 15:00」 in leaf text, 「明日」, 「11/24（月）」, a
  // past undone one soft: never red; a bell when the reminder names me) opens 編集 at 期限; 編集's form holds the text,
  // 期限 and 通知 (DueFields). The lists' foot: this phone's 「この端末に通知」 (TodoNotify); the relay's push state read
  // on each opening (push.svelte.ts). `todoSheet.show({list, item})` (the menu's panel, a reminder's tap) opens on that
  // list with the item in view and flashed 1 s.
  // Kept mounted between openings (Sheet's `keep`). A reopening within 10 min (RESUME_MS) of the close shows the list it
  // closed on (the shopping list again, as Keep and Reminders do), later ones the lists.
  import '#lib/i18n/todo.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Icon from '../ui/Icon.svelte';
  import Tick from '../ui/Tick.svelte';
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
  import { TODO_TEXT, TODO_TITLE, type TodoItemView } from '#lib/contract/todo.ts';
  import { dayOf, type Rem } from '#lib/contract/todoDue.ts';
  import { addDays } from '#lib/contract/tokyo.ts';
  import type { Who } from '#lib/types.ts';
  import { tick, untrack } from 'svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { undoBanner, UNDO_MS } from '#lib/store/actions.ts';
  import { t } from '#lib/i18n/index.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  /** A name on the one-line undo banner at most (characters). */
  const BANNER_NAME = 12;
  const clip = (s: string): string => ((cs) => (cs.length > BANNER_NAME ? `${cs.slice(0, BANNER_NAME - 1).join('')}…` : s))([...s]);

  const lists = $derived(todo.lists);
  /** The list shown (null: the lists). */
  let at = $state<string | null>(null);
  const cur = $derived(at ? (lists.find((l) => l.id === at) ?? null) : null);
  const doneN = $derived(cur ? cur.items.filter((i) => i.done).length : 0);
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
  /** A tap on the chips or 追加 keeps the focus (and the keyboard) on the field; the date's input takes it (its picker).
   */
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

  // ---- opened at an item (todoSheet.show({list, item})): its list, the item in view (not scrolled if it already is),
  // flashed 1 s; waits for the lists (a cold start from a reminder's tap)
  let want = $state<{ list?: string; item?: string } | null>(null);
  let flash = $state<string | null>(null);
  $effect(() => {
    const a = todoSheet.ask;
    if (a) untrack(() => (want = a.arg));
  });
  $effect(() => {
    const w = want;
    if (!w || !open) return;
    if (!w.list) return void (want = null);
    if (!lists.some((l) => l.id === w.list)) return;
    untrack(() => {
      want = null;
      show(w.list!);
      if (w.item) void tick().then(() => flashItem(w.item!));
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

  // a reopening soon after the close: the list it closed on (an opening at an item has its own list)
  $effect(() => {
    if (!open) return;
    untrack(() => {
      const l = left;
      left = null;
      if (l && !want && Date.now() - l.ms < RESUME_MS && lists.some((x) => x.id === l.at)) show(l.at);
    });
  });

  // a list gone from under it (removed on another phone): back to the lists
  $effect(() => {
    if (at && !cur) at = null;
  });
  function show(id: string | null) {
    at = id;
    draft = '';
    quick = null;
    body?.scrollTo({ top: 0 });
  }
  // the close's time as it's asked (open false), not the dialog's close event, a task later
  let shutAt = 0;
  $effect(() => {
    if (!open) untrack(() => (shutAt = Date.now()));
  });
  function closed() {
    left = at ? { at, ms: shutAt || Date.now() } : null;
    show(null);
    want = null;
    form.open = false;
  }

  function add(e: SubmitEvent) {
    e.preventDefault();
    if (!cur || !draft.trim()) return;
    if (todo.addItem(cur.id, draft, quick ?? undefined)) draft = '';
    field?.focus({ preventScroll: true });
  }

  // ---- the form sheet: a new list, a list's new name, an item's text
  type Form = { kind: 'list' | 'rename' | 'item'; id: string | null; text: string; open: boolean; due: string | null; rem: Rem | null; to: Who[]; atDue?: boolean };
  let form = $state<Form>({ kind: 'list', id: null, text: '', open: false, due: null, rem: null, to: [] });
  const formTitle = $derived(form.kind === 'list' ? t('todo.newList') : form.kind === 'rename' ? t('todo.rename') : t('todo.editItem'));
  const can = $derived(!!form.text.trim());
  function openForm(kind: Form['kind'], id: string | null = null, text = '') {
    form = { kind, id, text, open: true, due: null, rem: null, to: [] };
  }
  /** 編集 for an item; `atDue`: opened from its date chip, 期限 in view and no keyboard. */
  function openItem(it: TodoItemView, atDue = false) {
    form = { kind: 'item', id: it.id, text: it.text, open: true, due: it.due ?? null, rem: it.rem ?? null, to: [...(it.to ?? [])], atDue };
    if (atDue) void tick().then(() => document.getElementById('todo-due-h')?.scrollIntoView({ block: 'start' }));
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!can) return;
    if (form.kind === 'list') {
      const id = todo.addList(form.text);
      if (!id) return;
      show(id);
    } else if (form.kind === 'rename' && form.id) todo.renameList(form.id, form.text);
    else if (form.id) todo.editItem(form.id, form.text, { due: form.due, rem: form.rem, to: form.to });
    form.open = false;
  }

  // ---- an item's actions
  let target = $state<{ item: TodoItemView; i: number } | null>(null);
  let acting = $state(false);
  const n = $derived(cur?.items.length ?? 0);
  const itemActs = $derived<Action[][]>(target ? [
    [
      { id: 'edit', label: t('todo.editItem'), icon: 'edit' },
      { id: 'up', label: t('todo.up'), icon: 'up', off: target.i === 0 },
      { id: 'down', label: t('todo.down'), icon: 'down', off: target.i === n - 1 }
    ],
    [{ id: 'del', label: t('todo.delete'), icon: 'trash', danger: true }]
  ] : []);
  function pickItem(a: string) {
    const x = target;
    if (!x) return;
    if (a === 'edit') openItem(x.item);
    else if (a === 'up') todo.move(x.item.id, x.i - 1);
    else if (a === 'down') todo.move(x.item.id, x.i + 1);
    else if (a === 'del') undoBanner(t('todo.removed', { name: clip(x.item.text) }), todo.removeItemHeld(x.item.id, UNDO_MS));
  }

  // ---- the list's ⋯, its removal asked first
  let listActs = $state(false);
  let asking = $state(false);
  function pickList(a: string) {
    if (!cur) return;
    if (a === 'rename') openForm('rename', cur.id, cur.title);
    else if (a === 'del') asking = true;
  }
  function removeList() {
    const l = cur;
    if (!l) return;
    const r = todo.removeListHeld(l.id, UNDO_MS);
    if (r.ok) show(null);
    undoBanner(t('todo.listRemoved', { name: clip(l.title) }), r);
  }
  function clearDone() {
    if (cur) undoBanner(t('todo.cleared', { n: doneN }), todo.clearDoneHeld(cur.id, UNDO_MS));
  }
</script>

{#snippet more()}<NavButton kind="tool" icon="more" popup sfx="open" label={t('todo.listActs')} data-todo-more onclick={() => (listActs = true)} />{/snippet}

<Sheet bind:open tunes label={t('todo.title')} variant="full" onclose={closed} timed="todo" keep ondismiss={() => (cur ? (show(null), false) : true)}>
  <div class="td">
    <NavBar title={cur?.title ?? t('todo.title')} onback={cur ? () => show(null) : null} onclose={() => (open = false)} trailing={cur ? more : null} />
    <div class="td-body sheet-scroll" bind:this={body} data-todo data-todo-at={cur?.id}>
      {#if !cur}
        {#if lists.length}
          <div class="card dense">
            {#each lists as l (l.id)}
              {@const done = l.items.filter((i) => i.done).length}
              <button type="button" class="row" data-todo-open={l.id} data-sfx="open" onclick={() => show(l.id)}>
                <span class="ttl">{l.title}</span>
                <span class="cnt" aria-label={t('todo.countLabel', { n: done, m: l.items.length })}>{done} / {l.items.length}</span>
                <Icon name="chevron-right" size={18} />
              </button>
            {/each}
          </div>
        {:else}
          <p class="empty" data-todo-empty><Phrases text={t('todo.empty')} /></p>
        {/if}
        <div class="card dense">
          <button type="button" class="row add" data-todo-new data-sfx="open" aria-disabled={todo.ready ? undefined : 'true'} onclick={() => todo.ready && openForm('list')}><Icon name="plus" size={18} />{t('todo.newList')}</button>
        </div>
        <TodoNotify />
      {:else}
        <div class="card dense">
          {#each cur.items as it, i (it.id)}
            <div class="row item" class:done={it.done} class:hl={flash === it.id} data-todo-item={it.id} data-done={it.done || undefined}>
              <Tick checked={it.done} label={it.text} onchange={(v) => todo.tick(it.id, v)} />
              <button type="button" class="txt" class:sel={acting && target?.item.id === it.id} aria-label={t('todo.acts', { name: it.text })} data-todo-acts={it.id} data-sfx="open"
                onclick={() => ((target = { item: it, i }), (acting = true))}>{it.text}</button>
              {#if it.due}
                {@const day = dayOf(it.due, today)}
                {@const when = dueLabel(it.due, today)}
                <button type="button" class="due" data-todo-due={it.id} data-day={day} data-sfx="open" aria-label={t('todo.dueChip', { when })} onclick={() => openItem(it, true)}>
                  <span class="tag" class:now={day === 'today' && !it.done} class:soft={it.done || day === 'past'}>{#if it.rem && it.to?.includes(me)}<Icon name="bell" size={14} /><span class="sr-only">{t('todo.bell')}</span>{/if}{when}</span>
                </button>
              {/if}
            </div>
          {:else}
            <p class="row none" data-todo-none><Phrases text={t('todo.listEmpty')} /></p>
          {/each}
          <form class="row addf" data-kb-scroll onsubmit={add} {@attach holdFocus}>
            <div class="addrow">
              <input class="input" type="text" bind:this={field} bind:value={draft} maxlength={TODO_TEXT} enterkeyhint="done" autocomplete="off" data-sfx="none" data-todo-field
                placeholder={quick ? t('todo.addFor', { day: quickDay }) : t('todo.addItem')} aria-label={quick ? t('todo.addFor', { day: quickDay }) : t('todo.addItem')}
                onfocus={() => (typing = true)} onblur={leftField} />
              <button type="submit" class="btn small press" aria-disabled={draft.trim() ? undefined : 'true'} data-todo-add data-sfx="confirm">{t('todo.add')}</button>
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
      {/if}
    </div>
  </div>

  <ActionSheet name="todo.acts" bind:open={acting} title={target?.item.text ?? ''} groups={itemActs} onpick={pickItem} />
  <ActionSheet name="todo.list" bind:open={listActs} title={cur?.title ?? ''} onpick={pickList}
    groups={[[{ id: 'rename', label: t('todo.rename'), icon: 'edit' }], [{ id: 'del', label: t('todo.deleteList'), icon: 'trash', danger: true }]]} />
  <Sheet name="todo.ask" bind:open={asking} title={t('todo.deleteAsk', { name: cur?.title ?? '' })}
    confirm={{ verb: t('todo.delete'), danger: true, focusNo: true, onyes: () => ((asking = false), removeList()) }}>
    {#if cur?.items.length}<p class="note"><Phrases text={t('todo.deleteNote', { n: cur.items.length })} /></p>{/if}
  </Sheet>
  <Sheet name="todo.form" bind:open={form.open} title={formTitle} focusField={!form.atDue}>
    <form id="todo-form" onsubmit={submit}>
      <input class="input" type="text" bind:value={form.text} maxlength={form.kind === 'item' ? TODO_TEXT : TODO_TITLE} enterkeyhint="done" autocomplete="off" data-sfx="none" data-todo-form-field
        aria-label={formTitle} placeholder={form.kind === 'item' ? t('todo.addItem') : t('todo.listName')} />
      {#if form.kind === 'item'}<DueFields bind:due={form.due} bind:rem={form.rem} bind:to={form.to} {me} />{/if}
    </form>
    {#snippet footer()}
      <button type="submit" form="todo-form" class="btn" aria-disabled={can ? undefined : 'true'} data-todo-save data-sfx="confirm">{form.kind === 'list' ? t('todo.create') : t('common.save')}</button>
    {/snippet}
  </Sheet>
</Sheet>

<style>
  /* the sheet's column (Sheet's full: edge to edge), the title bar under the safe area */
  .td { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: var(--ui-top) var(--safe-right) 0 var(--safe-left); }
  .td > :global(.navbar) { margin-inline: 6px; }
  .td-body { display: grid; grid-template-columns: minmax(0, 1fr); align-content: start; gap: 12px; padding: 4px 16px calc(24px + var(--safe-bottom)); }
  /* the typed texts break as normal Japanese, never wider than their card */
  .ttl, .txt { word-break: normal; overflow-wrap: anywhere; }
  .ttl { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); text-align: start; }
  .cnt { flex: none; font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; color: var(--text-soft); }
  .row :global(svg) { flex: none; }
  .add { color: var(--leaf-text); font-weight: 700; gap: 8px; }
  .add[aria-disabled="true"] { opacity: .55; }
  .empty { margin: 0; padding: 24px 12px 4px; text-align: center; color: var(--text-soft); }
  .item { padding-block: 0; padding-right: 0; }
  .txt {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; font-size: var(--fs-body); line-height: 1.35; text-align: start; cursor: pointer;
    -webkit-tap-highlight-color: transparent; flex: 1; min-width: 0; min-height: var(--hit); padding: 10px 12px 10px 0;
  }
  .txt:active, .sel { background: var(--hl); }
  .txt:focus-visible { outline-offset: -3px; }
  .done .txt { color: var(--text-soft); text-decoration: line-through; text-decoration-thickness: 1.5px; }
  .none { margin: 0; font-size: var(--fs-s); color: var(--text-soft); }
  .addf { flex-direction: column; align-items: stretch; gap: 4px; }
  .addrow { display: flex; align-items: center; gap: 8px; }
  .addrow .input { flex: 1; min-width: 0; }
  .quick { margin: 0 -12px; }
  .date { position: relative; }
  .date.on { background: var(--ctl-sel); color: var(--c-ink); }
  /* the native picker's input over the chip's whole 44px hit, unseen (a direct tap opens WebKit's picker) */
  .date input { position: absolute; inset: -6px -3px; width: calc(100% + 6px); height: calc(100% + 12px); margin: 0; padding: 0; border: 0; opacity: 0; font-size: 16px; cursor: pointer; }
  /* a row's date: the tag in a 44px-tall hit at the row's end; today in leaf text, a later day plain, past or done soft */
  .due { appearance: none; border: 0; background: none; margin: 0; padding: 0 10px 0 4px; min-height: var(--hit); flex: none; display: flex; align-items: center; cursor: pointer; -webkit-tap-highlight-color: transparent; }
  .due .tag { color: var(--text); font-family: var(--font-num); font-weight: 600; }
  .due .tag.now { color: var(--leaf-text); }
  .due .tag.soft { color: var(--text-soft); }
  .due:active .tag { background: var(--hl); }
  .item { transition: background-color 600ms var(--ease-soft); }
  .item.hl { background: var(--hl); transition: none; }
  .clear { justify-self: start; }
  .note { margin: 0; color: var(--text-soft); }
  form#todo-form { display: grid; gap: 8px; padding-top: 4px; }
</style>
