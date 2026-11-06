<script lang="ts">
  // 持ち物: a trip's shared packing list (docs/travel.md "Packing list (relay)"; docs/design.md §Trips), in the quiet
  // kit. The head: my count 「12 / 35」, the bar, 編集. A card per category (its icon, its name, my 「N / M」), a row
  // per item: the circle is MY tick (each person ticks their own; the whole row is the tap), the text and its note in
  // the reader's language, and on the right who has packed it 「うめ ✓」. 編集 (once the phone knows who I am): no
  // buttons on the rows; a row or a category tapped opens its actions (名前を変更 · 上へ · 下へ · 削除), 「＋ 追加」
  // under each category, a new category, チェックをリセット (mine only). An item's 削除 is at once with とりけす on the
  // banner; a category's and the reset ask first, then とりけす too. The guest adds, and changes only what it added. A
  // trip that's over: a quiet count, no bar (ticking still works).
  //   <PackList trip={nz} />
  import '#lib/i18n/travel.ts';
  import Icon from '../quiet/Icon.svelte';
  import ProgressBar from '../quiet/ProgressBar.svelte';
  import ActionSheet, { type Action } from '../quiet/ActionSheet.svelte';
  import BottomSheet from '../quiet/BottomSheet.svelte';
  import { packing } from './packing.svelte.ts';
  import { catIcon, clip, myProgress, packView, type PackCatView } from './packView.ts';
  import { phaseOf } from './when.ts';
  import { PACK_NAME } from '#lib/contract/pack.ts';
  import type { Trip } from '#lib/travel/types.ts';
  import type { Who } from '#lib/types.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { i18n, t } from '#lib/i18n/index.ts';

  let { trip }: { trip: Trip } = $props();

  /** A removal's and a reset's とりけす window (the banner's life; sent after it). */
  const UNDO_MS = 5000;
  /** A name on the one-line undo banner at most (characters). */
  const BANNER_NAME = 12;

  const locale = $derived(i18n.locale);
  const me = $derived(packing.me);
  const seed = $derived(trip.packing);
  const view = $derived(packView(packing.list(trip.id, seed), me, locale));
  const prog = $derived(myProgress(view));
  /** The trip is over: no bar; a quiet count. */
  const past = $derived(phaseOf(trip, minuteNow().getTime()).k === 'past');
  const nameOf = (w: Who): string => (week.view ? villagerNameOf(week.view, w) : w);

  let editing = $state(false);

  // ---- my tick
  function toggle(id: string, on: boolean) {
    packing.tick(trip.id, id, on);
  }

  // ---- 編集: a row's (or a category's) actions
  type Target = { kind: 'item'; id: string; name: string; i: number; n: number } | { kind: 'cat'; cat: PackCatView; i: number; n: number };
  let target = $state<Target | null>(null);
  let acting = $state(false);
  function act(x: Target) {
    target = x;
    acting = true;
  }
  const actions = $derived<Action[][]>(
    target
      ? [
          [
            { id: 'rename', label: t('travel.pack.renameAct'), icon: 'edit' },
            { id: 'up', label: t('travel.pack.upAct'), icon: 'up', off: target.i === 0 },
            { id: 'down', label: t('travel.pack.downAct'), icon: 'down', off: target.i === target.n - 1 }
          ],
          [{ id: 'del', label: t('travel.pack.delAct'), icon: 'trash', danger: true }]
        ]
      : []
  );
  const targetName = $derived(target ? (target.kind === 'cat' ? target.cat.name : target.name) : '');
  function picked(a: string) {
    const x = target;
    if (!x) return;
    const id = x.kind === 'cat' ? x.cat.id : x.id;
    if (a === 'up') packing.move(trip.id, seed, id, x.i - 1);
    else if (a === 'down') packing.move(trip.id, seed, id, x.i + 1);
    else if (a === 'rename') openForm({ kind: 'rename', id, text: targetName });
    else if (a === 'del') {
      if (x.kind === 'cat') {
        ask = { kind: 'cat', cat: x.cat };
        asking = true;
      } else remove(id, x.name);
    }
  }
  function remove(id: string, name: string) {
    undoBanner(t('travel.pack.removed', { name: clip(name, BANNER_NAME) }), packing.removeHeld(trip.id, seed, id, UNDO_MS));
  }

  // ---- the form sheet: a rename, an item added to a category, a new category
  type Form = { kind: 'rename'; id: string; text: string } | { kind: 'add'; cat: string; catName: string; text: string } | { kind: 'cat'; text: string };
  let form = $state<Form | null>(null);
  let formOpen = $state(false);
  const formTitle = $derived(
    !form ? '' : form.kind === 'rename' ? t('travel.pack.renameAct') : form.kind === 'add' ? t('travel.pack.addItemIn', { cat: form.catName }) : t('travel.pack.addCat')
  );
  function openForm(f: Form) {
    form = f;
    formOpen = true;
  }
  function save(): boolean {
    const f = form;
    if (!f || !f.text.trim()) return false;
    if (f.kind === 'rename') packing.rename(trip.id, seed, f.id, f.text, locale);
    else if (f.kind === 'add') return !!packing.addItem(trip.id, seed, f.cat, f.text, locale);
    else return !!packing.addCat(trip.id, seed, f.text, locale);
    return true;
  }

  // ---- the confirmations: a category's 削除, リセット
  let ask = $state<{ kind: 'cat'; cat: PackCatView } | { kind: 'reset' } | null>(null);
  let asking = $state(false);
  const askTitle = $derived(
    !ask
      ? ''
      : ask.kind === 'cat'
        ? `${t('travel.pack.catAsk', { name: ask.cat.name })}${ask.cat.total ? ` ${t('travel.pack.catAskItems', { n: ask.cat.total })}` : ''}`
        : `${t('travel.pack.resetAsk')} ${t('travel.pack.resetNote')}`
  );
  function yes(a: string) {
    const x = ask;
    if (a !== 'yes' || !x) return;
    if (x.kind === 'cat') remove(x.cat.id, x.cat.name);
    else undoBanner(t('travel.pack.resetDone'), packing.resetHeld(trip.id, UNDO_MS));
  }
</script>

<div class="pack" data-pack={trip.id} data-pack-editing={editing || undefined}>
  <div class="prog" class:past>
    {#if editing}
      <span class="eh" data-pack-editbar>{t('travel.pack.editing')}{#if me === 'G'}<small>{t('travel.pack.guestNote')}</small>{/if}</span>
    {:else}
      <span class="big q-title" data-pack-mine={prog.mine} data-pack-total={prog.total}>{prog.mine}<span class="of"> / {prog.total}</span></span>
      {#if past}<span class="pastl" data-pack-past>{t('travel.pack.past')}</span>{:else}<ProgressBar value={prog.mine} max={prog.total} label={t('travel.pack.mine')} />{/if}
    {/if}
    {#if me}
      <button type="button" class="q-btn text ed" aria-pressed={editing} data-pack-edit data-sfx={editing ? 'toggle-off' : 'toggle-on'} onclick={() => (editing = !editing)}>
        {editing ? t('common.done') : t('common.edit')}
      </button>
    {/if}
  </div>

  {#if !view.length}<p class="q-card empty" data-pack-empty>{t('travel.pack.empty')}</p>{/if}

  {#each view as c, ci (c.id)}
    <section class="q-card cat" data-pack-cat={c.id} aria-labelledby="pc-{c.id}">
      {#snippet catHead()}
        {@const ic = catIcon(c.icon)}
        <span class="ci">{#if 'emoji' in ic}{ic.emoji}{:else}<Icon name={ic.icon} size={18} />{/if}</span>
        <span class="cn" id="pc-{c.id}">{c.name}</span>
        {#if editing}{#if c.editable}<span class="mo"><Icon name="more" size={22} /></span>{/if}{:else}<span class="cc" data-pack-cat-mine={c.mine}>{t('travel.pack.count', { n: c.mine, m: c.total })}</span>{/if}
      {/snippet}
      {#if editing}
        <button type="button" class="ch" aria-disabled={c.editable ? undefined : 'true'} aria-label={t('travel.pack.actsOf', { name: c.name })} data-pack-acts={c.id} data-sfx="open"
          onclick={() => act({ kind: 'cat', cat: c, i: ci, n: view.length })}>{@render catHead()}</button>
      {:else}
        <h3 class="ch">{@render catHead()}</h3>
      {/if}

      {#each c.rows as r, ri (r.id)}
        <div class="li" data-pack-item={r.id} data-mine={r.mine || undefined} data-ticks={r.item.ticks.join('')}>
          {#if !editing}
            <button type="button" class="q-row pr" class:done={r.item.ticks.length > 0} role="checkbox" aria-checked={r.mine} data-sfx={r.mine ? 'toggle-off' : 'toggle-on'} onclick={() => toggle(r.id, !r.mine)}>
              <span class="tick" class:on={r.mine} aria-hidden="true">{#if r.mine}<Icon name="check" size={14} stroke={2.6} />{/if}</span>
              <span class="tx"><span class="it">{r.text}</span>{#if r.note}<small>{r.note}</small>{/if}</span>
              {#if r.item.ticks.length}
                <span class="by" aria-hidden="true">{#each r.item.ticks as w (w)}<span data-chip={w}>{nameOf(w)}</span>{/each} ✓</span>
                <span class="sr-only">{t('travel.pack.packedBy', { names: r.item.ticks.map(nameOf).join(locale === 'ja' ? '、' : ', ') })}</span>
              {/if}
            </button>
          {:else}
            <button type="button" class="q-row pr er" aria-disabled={r.editable ? undefined : 'true'} aria-label={t('travel.pack.actsOf', { name: r.text })} data-pack-acts={r.id} data-sfx="open"
              onclick={() => act({ kind: 'item', id: r.id, name: r.text, i: ri, n: c.rows.length })}>
              <span class="grip" aria-hidden="true"><Icon name="grip" size={20} stroke={2.6} /></span>
              <span class="tx"><span class="it">{r.text}</span></span>
              {#if r.editable}<span class="mo"><Icon name="more" size={22} /></span>{/if}
            </button>
          {/if}
        </div>
      {:else}
        <p class="none">{t('travel.pack.emptyCat')}</p>
      {/each}

      {#if editing}
        <button type="button" class="q-row add" data-pack-add={c.id} data-sfx="open" onclick={() => openForm({ kind: 'add', cat: c.id, catName: c.name, text: '' })}>
          <Icon name="plus" size={20} />{t('travel.pack.add')}
        </button>
      {/if}
    </section>
  {/each}

  {#if editing}
    <div class="q-card">
      <button type="button" class="q-row add" data-pack-addcat data-sfx="open" onclick={() => openForm({ kind: 'cat', text: '' })}><Icon name="plus" size={20} />{t('travel.pack.addCat')}</button>
      {#if prog.mine > 0}
        <button type="button" class="q-row reset" data-pack-reset data-sfx="open" onclick={() => ((ask = { kind: 'reset' }), (asking = true))}><Icon name="refresh" size={18} />{t('travel.pack.reset')}</button>
      {/if}
    </div>
  {/if}
</div>

<ActionSheet bind:open={acting} title={targetName} groups={actions} onpick={picked} />
<ActionSheet bind:open={asking} title={askTitle} label={ask?.kind === 'cat' ? t('travel.pack.catAsk', { name: ask.cat.name }) : t('travel.pack.reset')}
  groups={[[{ id: 'yes', label: ask?.kind === 'reset' ? t('travel.pack.resetAct') : t('travel.pack.delAct'), icon: ask?.kind === 'reset' ? 'refresh' : 'trash', danger: true }]]} onpick={yes} />
<BottomSheet bind:open={formOpen} title={formTitle} onsave={save} can={!!form?.text.trim()}>
  {#if form}
    <input class="q-field" type="text" data-sfx="none" data-pack-field maxlength={PACK_NAME} enterkeyhint="done" autocomplete="off" aria-label={formTitle}
      placeholder={form.kind === 'cat' ? t('travel.pack.addCat') : t('travel.pack.addItem')} bind:value={form.text} />
  {/if}
</BottomSheet>

<style>
  .pack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
  /* the typed names break as normal Japanese (docs/design.md §Trips), never wider than their card */
  .tx, .cn { word-break: normal; overflow-wrap: anywhere; }
  .prog { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 0 0 4px; margin-top: -4px; }
  .big { font-size: var(--q-fs-title); line-height: 1; white-space: nowrap; }
  .of { font: var(--q-w) var(--q-fs-body)/1 var(--q-font-title); color: var(--q-muted); }
  .pastl { flex: 1; font-size: var(--q-fs-s); color: var(--q-muted); }
  .eh { flex: 1; display: grid; color: var(--q-ink-2); }
  .eh small { font-size: var(--q-fs-s); color: var(--q-muted); }
  .ed { margin-right: -12px; }
  .empty { margin: 0; padding: 18px 16px; text-align: center; color: var(--q-muted); }
  .cat { display: grid; }
  .ch {
    appearance: none; border: 0; background: none; width: 100%; margin: 0; font: inherit; text-align: start; color: var(--q-ink-2);
    display: flex; align-items: center; gap: 10px; min-height: 44px; padding: 12px 16px 10px;
  }
  button.ch { cursor: pointer; -webkit-tap-highlight-color: transparent; }
  button.ch:active { background: var(--q-sunken); }
  .ci { display: flex; flex: none; font-size: 17px; line-height: 1; }
  .cn { flex: 1; min-width: 0; font: var(--q-w-b) var(--q-fs-body)/1.3 var(--q-font); color: var(--q-ink); }
  .cc { flex: none; font-size: var(--q-fs-s); color: var(--q-muted); }
  .mo { flex: none; color: var(--q-muted); display: flex; }
  .li { border-top: 1px solid var(--q-hairline); }
  .pr { align-items: flex-start; padding: 11px 16px 11px 14px; }
  .tick {
    width: 24px; height: 24px; margin-top: -1px; border-radius: 50%; border: 1.5px solid var(--q-faint); box-sizing: border-box; flex: none;
    display: flex; align-items: center; justify-content: center; color: #fff; transition: background-color 140ms, border-color 140ms;
  }
  .tick.on { background: var(--q-accent); border-color: var(--q-accent); }
  .tx { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .it { font-size: var(--q-fs-body); line-height: 1.4; }
  .tx small { font-size: var(--q-fs-s); color: var(--q-muted); line-height: 1.4; }
  .pr[aria-checked='true'] .it { color: var(--q-muted); }
  .by { flex: none; max-width: 40%; font-size: var(--q-fs-s); color: var(--q-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-top: 1px; }
  .by span + span::before { content: '・'; }
  .er { align-items: center; }
  .er[aria-disabled='true'] { opacity: .55; }
  .grip { color: var(--q-faint); display: flex; flex: none; margin-right: -2px; }
  .add { color: var(--q-accent-ink); font-weight: var(--q-w-b); gap: 8px; padding: 11px 16px 11px 14px; border-top: 1px solid var(--q-hairline); }
  .q-card > .add:first-child { border-top: 0; }
  .reset { color: var(--q-ink-2); gap: 8px; border-top: 1px solid var(--q-hairline); }
  .none { margin: 0; padding: 10px 16px 12px; border-top: 1px solid var(--q-hairline); font-size: var(--q-fs-s); color: var(--q-muted); }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
