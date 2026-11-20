<script lang="ts">
  // やること (docs/todo.md): shared to-do lists, its own chunk with its strings, full height (Sheet's `full`,
  // the unified kit), over the lists' store (todo.svelte.ts). Two levels under one title bar (NavBar): the lists (a card
  // row each: its title and 「3 / 5」; 「＋ 新しいリスト」), and a list (‹ back, ⋯: 名前を変更 · リストを削除). In a list: a row
  // per item, the Tick its shared done (anyone's tick is everyone's), the text tapped opens its actions (ActionSheet:
  // 編集 · 上へ · 下へ · 削除); the field at the foot adds one (the return key too, the keyboard stays up for the next);
  // 「完了した項目を削除」 under them. A removal is at once with 取り消す on the banner; a list's asks first (Sheet confirm).
  // Anyone (the guest too) does all of it. Item text isn't `.selectable` (a tap acts; 編集's field has the text to copy).
  // Kept mounted between openings (Sheet's `keep`): a reopening shows the lists.
  import '#lib/i18n/todo.ts';
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import Icon from '../ui/Icon.svelte';
  import Tick from '../ui/Tick.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import ActionSheet, { type Action } from '../ui/ActionSheet.svelte';
  import { todo } from './todo.svelte.ts';
  import { TODO_TEXT, TODO_TITLE, type TodoItemView } from '#lib/contract/todo.ts';
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

  // a list gone from under it (removed on another phone): back to the lists
  $effect(() => {
    if (at && !cur) at = null;
  });
  function show(id: string | null) {
    at = id;
    draft = '';
    body?.scrollTo({ top: 0 });
  }
  function closed() {
    show(null);
    form.open = false;
  }

  function add(e: SubmitEvent) {
    e.preventDefault();
    if (!cur || !draft.trim()) return;
    if (todo.addItem(cur.id, draft)) draft = '';
    field?.focus({ preventScroll: true });
  }

  // ---- the form sheet: a new list, a list's new name, an item's text
  type Form = { kind: 'list' | 'rename' | 'item'; id: string | null; text: string; open: boolean };
  let form = $state<Form>({ kind: 'list', id: null, text: '', open: false });
  const formTitle = $derived(form.kind === 'list' ? t('todo.newList') : form.kind === 'rename' ? t('todo.rename') : t('todo.editItem'));
  const can = $derived(!!form.text.trim());
  function openForm(kind: Form['kind'], id: string | null = null, text = '') {
    form = { kind, id, text, open: true };
  }
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!can) return;
    if (form.kind === 'list') {
      const id = todo.addList(form.text);
      if (!id) return;
      show(id);
    } else if (form.kind === 'rename' && form.id) todo.renameList(form.id, form.text);
    else if (form.id) todo.editItem(form.id, form.text);
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
    if (a === 'edit') openForm('item', x.item.id, x.item.text);
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
      {:else}
        <div class="card dense">
          {#each cur.items as it, i (it.id)}
            <div class="row item" class:done={it.done} data-todo-item={it.id} data-done={it.done || undefined}>
              <Tick checked={it.done} label={it.text} onchange={(v) => todo.tick(it.id, v)} />
              <button type="button" class="txt" class:sel={acting && target?.item.id === it.id} aria-label={t('todo.acts', { name: it.text })} data-todo-acts={it.id} data-sfx="open"
                onclick={() => ((target = { item: it, i }), (acting = true))}>{it.text}</button>
            </div>
          {:else}
            <p class="row none" data-todo-none><Phrases text={t('todo.listEmpty')} /></p>
          {/each}
          <form class="row addf" data-kb-scroll onsubmit={add}>
            <input class="input" type="text" bind:this={field} bind:value={draft} maxlength={TODO_TEXT} enterkeyhint="done" autocomplete="off" data-sfx="none" data-todo-field
              placeholder={t('todo.addItem')} aria-label={t('todo.addItem')} />
            <button type="submit" class="btn small press" aria-disabled={draft.trim() ? undefined : 'true'} data-todo-add data-sfx="confirm">{t('todo.add')}</button>
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
  <Sheet name="todo.form" bind:open={form.open} title={formTitle} focusField>
    <form id="todo-form" onsubmit={submit}>
      <input class="input" type="text" bind:value={form.text} maxlength={form.kind === 'item' ? TODO_TEXT : TODO_TITLE} enterkeyhint="done" autocomplete="off" data-sfx="none" data-todo-form-field
        aria-label={formTitle} placeholder={form.kind === 'item' ? t('todo.addItem') : t('todo.listName')} />
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
  .item :global(.tick) { position: static; }
  .txt {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; font-size: var(--fs-body); line-height: 1.35; text-align: start; cursor: pointer;
    -webkit-tap-highlight-color: transparent; flex: 1; min-width: 0; min-height: var(--hit); padding: 10px 12px 10px 0;
  }
  .txt:active, .sel { background: var(--hl); }
  .txt:focus-visible { outline-offset: -3px; }
  .done .txt { color: var(--text-soft); text-decoration: line-through; text-decoration-thickness: 1.5px; }
  .none { margin: 0; font-size: var(--fs-s); color: var(--text-soft); }
  .addf { gap: 8px; }
  .addf .input { flex: 1; min-width: 0; }
  .clear { justify-self: start; }
  .note { margin: 0; color: var(--text-soft); }
  form#todo-form { display: grid; padding-top: 4px; }
</style>
