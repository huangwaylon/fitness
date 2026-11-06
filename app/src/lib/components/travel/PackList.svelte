<script lang="ts">
  // 持ち物: a trip's shared packing list (docs/travel.md "Packing list (relay)"; docs/design.md §Trips), on the unified
  // kit. The head: my count 「12 / 35」, the bar, 編集. A dense card per category (its NH item on a cream disc, its
  // name, my 「N / M」), a row per item: the Tick is MY tick (each person ticks their own; the whole row is its tap),
  // the text and its note in the reader's language, and on the right who has packed it (each name by their colour's
  // dot). 編集 (once the phone knows who I am): no ticks on the rows; a row or a category tapped opens its actions
  // (ActionSheet: 名前を変更 · 上へ · 下へ · 削除), 「＋ 追加」 under each category, a new category, チェックをリセット
  // (mine only). An item's 削除 is at once with とりけす on the banner; a category's and the reset ask first, then
  // とりけす too. The guest adds, and changes only what it added. A trip that's over: a quiet count, no bar (ticking
  // still works). The name form: the kit's form sheet (ui/Sheet, 保存 in its footer; the return key saves too).
  //   <PackList trip={nz} />
  import Icon from '../ui/Icon.svelte';
  import ProgressBar from '../ui/ProgressBar.svelte';
  import Tick from '../ui/Tick.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import ActionSheet, { type Action } from '../ui/ActionSheet.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { packing } from './packing.svelte.ts';
  import { catIcon, clip, myProgress, packView, type PackCatView } from './packView.ts';
  import { phaseOf } from './when.ts';
  import { PACK_NAME } from '#lib/contract/pack.ts';
  import type { Trip } from '#lib/travel/types.ts';
  import type { Who } from '#lib/types.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { undoBanner, UNDO_MS } from '#lib/store/actions.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { i18n, t } from '#lib/i18n/index.ts';

  let { trip }: { trip: Trip } = $props();

  /** A name on the one-line undo banner at most (characters). */
  const BANNER_NAME = 12;
  /** Each person's dot (the guest's the soft ink). */
  const TONE: Record<Who, string> = { A: 'var(--person-a)', B: 'var(--person-b)', G: 'var(--text-soft)' };

  const locale = $derived(i18n.locale);
  const me = $derived(packing.me);
  const seed = $derived(trip.packing);
  const view = $derived(packView(packing.list(trip.id, seed), me, locale));
  const prog = $derived(myProgress(view));
  /** The trip is over: no bar; a quiet count. */
  const past = $derived(phaseOf(trip, minuteNow().getTime()).k === 'past');
  const nameOf = (w: Who): string => (week.view ? villagerNameOf(week.view, w) : w);

  let editing = $state(false);

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
  const can = $derived(!!form?.text.trim());
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
  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (can && save()) formOpen = false;
  }

  // ---- the confirmations: a category's 削除, リセット
  let ask = $state<{ kind: 'cat'; cat: PackCatView } | { kind: 'reset' } | null>(null);
  let asking = $state(false);
  const askTitle = $derived(!ask ? '' : ask.kind === 'cat' ? t('travel.pack.catAsk', { name: ask.cat.name }) : t('travel.pack.resetAsk'));
  const askNote = $derived(
    !ask ? undefined : ask.kind === 'cat' ? (ask.cat.total ? t('travel.pack.catAskItems', { n: ask.cat.total }) : undefined) : t('travel.pack.resetNote')
  );
  function yes(a: string) {
    const x = ask;
    if (a !== 'yes' || !x) return;
    if (x.kind === 'cat') remove(x.cat.id, x.cat.name);
    else undoBanner(t('travel.pack.resetDone'), packing.resetHeld(trip.id, UNDO_MS));
  }
</script>

<div class="pack" data-pack={trip.id} data-pack-editing={editing || undefined} data-pack-mine={prog.mine} data-pack-total={prog.total}>
  <div class="prog" class:past>
    {#if editing}
      <span class="eh" data-pack-editbar>{t('travel.pack.editing')}{#if me === 'G'}<small>{t('travel.pack.guestNote')}</small>{/if}</span>
    {:else}
      <span class="big">{prog.mine}<span class="of"> / {prog.total}</span></span>
      {#if past}<span class="pastl" data-pack-past>{t('travel.pack.past')}</span>{:else}<ProgressBar value={prog.mine} max={prog.total} label={t('travel.pack.mine')} />{/if}
    {/if}
    {#if me}
      <button type="button" class="chip s ed" aria-pressed={editing} data-pack-edit data-sfx={editing ? 'toggle-off' : 'toggle-on'} onclick={() => (editing = !editing)}>
        {#if !editing}<Icon name="edit" size={16} />{/if}{editing ? t('common.done') : t('common.edit')}
      </button>
    {/if}
  </div>

  {#if !view.length}<p class="card dense empty" data-pack-empty>{t('travel.pack.empty')}</p>{/if}

  {#each view as c, ci (c.id)}
    <section class="card dense cat" data-pack-cat={c.id} aria-labelledby="pc-{c.id}">
      {#snippet catHead()}
        {@const ic = catIcon(c.icon)}
        <span class="ci" aria-hidden="true">
          {#if 'emoji' in ic}{ic.emoji}{:else if 'art' in ic}<OfficialArt key={ic.art} size={26}>{#snippet fallback()}<Icon name="shopping-bag" size={18} />{/snippet}</OfficialArt>{:else}<Icon name={ic.icon} size={18} />{/if}
        </span>
        <span class="cn" id="pc-{c.id}">{c.name}</span>
        {#if editing}{#if c.editable}<span class="mo"><Icon name="more" size={20} /></span>{/if}{:else}<span class="cc" data-pack-cat-mine={c.mine}>{t('travel.pack.count', { n: c.mine, m: c.total })}</span>{/if}
      {/snippet}
      {#if editing}
        <button type="button" class="row ch" class:sel={acting && target?.kind === 'cat' && target.cat.id === c.id} aria-disabled={c.editable ? undefined : 'true'} aria-label={t('travel.pack.actsOf', { name: c.name })} data-pack-acts={c.id} data-sfx="open"
          onclick={() => act({ kind: 'cat', cat: c, i: ci, n: view.length })}>{@render catHead()}</button>
      {:else}
        <h3 class="row ch">{@render catHead()}</h3>
      {/if}

      {#each c.rows as r, ri (r.id)}
        <div class="row pr" class:mine={r.mine} class:er={editing} data-pack-item={r.id} data-mine={r.mine || undefined} data-ticks={r.item.ticks.join('')}>
          {#if !editing}
            <Tick checked={r.mine} onchange={(v) => packing.tick(trip.id, r.id, v)}
              label={r.item.ticks.length ? `${r.text} ${t('travel.pack.packedBy', { names: r.item.ticks.map(nameOf).join(locale === 'ja' ? '、' : ', ') })}` : r.text} />
            <span class="tx"><span class="it">{r.text}</span>{#if r.note}<small>{r.note}</small>{/if}</span>
            {#if r.item.ticks.length}
              <span class="by" aria-hidden="true">{#each r.item.ticks as w (w)}<span class="who" data-chip={w} style:--who={TONE[w]}>{nameOf(w)}</span>{/each}</span>
            {/if}
          {:else}
            <button type="button" class="eb" class:sel={acting && target?.kind === 'item' && target.id === r.id} aria-disabled={r.editable ? undefined : 'true'} aria-label={t('travel.pack.actsOf', { name: r.text })} data-pack-acts={r.id} data-sfx="open"
              onclick={() => act({ kind: 'item', id: r.id, name: r.text, i: ri, n: c.rows.length })}>
              <span class="grip" aria-hidden="true"><Icon name="grip" size={20} stroke={2.6} /></span>
              <span class="tx"><span class="it">{r.text}</span></span>
              {#if r.editable}<span class="mo"><Icon name="more" size={20} /></span>{/if}
            </button>
          {/if}
        </div>
      {:else}
        <p class="row none">{t('travel.pack.emptyCat')}</p>
      {/each}

      {#if editing}
        <button type="button" class="row add" data-pack-add={c.id} data-sfx="open" onclick={() => openForm({ kind: 'add', cat: c.id, catName: c.name, text: '' })}>
          <Icon name="plus" size={18} />{t('travel.pack.add')}
        </button>
      {/if}
    </section>
  {/each}

  {#if editing}
    <div class="card dense">
      <button type="button" class="row add" data-pack-addcat data-sfx="open" onclick={() => openForm({ kind: 'cat', text: '' })}><Icon name="plus" size={18} />{t('travel.pack.addCat')}</button>
      {#if prog.mine > 0}
        <button type="button" class="row reset" data-pack-reset data-sfx="open" onclick={() => ((ask = { kind: 'reset' }), (asking = true))}><Icon name="refresh" size={18} />{t('travel.pack.reset')}</button>
      {/if}
    </div>
  {/if}
</div>

<ActionSheet bind:open={acting} title={targetName} groups={actions} onpick={picked} />
<ActionSheet bind:open={asking} title={askTitle} note={askNote} label={ask?.kind === 'cat' ? t('travel.pack.catAsk', { name: ask.cat.name }) : t('travel.pack.reset')}
  groups={[[{ id: 'yes', label: ask?.kind === 'reset' ? t('travel.pack.resetAct') : t('travel.pack.delAct'), icon: ask?.kind === 'reset' ? 'refresh' : 'trash', danger: true }]]} onpick={yes} />
<Sheet bind:open={formOpen} label={formTitle} title={formTitle} focusField>
  {#if form}
    <form id="pack-form" onsubmit={submit}>
      <input class="field" type="text" data-sfx="none" data-pack-field maxlength={PACK_NAME} enterkeyhint="done" autocomplete="off" aria-label={formTitle}
        placeholder={form.kind === 'cat' ? t('travel.pack.addCat') : t('travel.pack.addItem')} bind:value={form.text} />
    </form>
  {/if}
  {#snippet footer()}
    <button type="submit" form="pack-form" class="btn" aria-disabled={can ? undefined : 'true'} data-pack-save data-sfx="confirm">{t('common.save')}</button>
  {/snippet}
</Sheet>

<style>
  .pack { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  /* the typed names break as normal Japanese (docs/design.md §Trips), never wider than their card */
  .tx, .cn { word-break: normal; overflow-wrap: anywhere; }
  .prog { display: flex; align-items: center; gap: 12px; min-height: var(--hit); padding: 0 0 0 4px; }
  .big { font: 600 var(--fs-title)/1 var(--font-num); font-variant-numeric: tabular-nums; white-space: nowrap; }
  /* (svelte trims the span's leading space) */
  .of { padding-left: .2em; font-size: var(--fs-body); color: var(--text-soft); }
  .pastl { flex: 1; font-size: var(--fs-s); color: var(--text-soft); }
  .eh { flex: 1; display: grid; font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .eh small { font: 400 var(--fs-s)/1.35 var(--font-body); }
  .ed { margin-left: auto; }
  .empty { margin: 0; padding: 18px 16px; text-align: center; color: var(--text-soft); }
  .cat { display: grid; }
  .ch { margin: 0; font: inherit; }
  .ci {
    width: 32px; height: 32px; border-radius: 50%; flex: none; display: grid; place-items: center; overflow: hidden; line-height: 1; font-size: 17px;
    background: var(--c-cream); color: var(--c-ink); box-shadow: inset 0 0 0 1.5px var(--stitch);
  }
  .cn { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .cc { flex: none; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .mo { flex: none; color: var(--text-soft); display: flex; }
  /* an item: my Tick (its hit the whole row), the text, who has packed it */
  .pr { align-items: flex-start; padding-block: 9px; }
  .pr :global(.tick) { position: static; }
  .pr :global(button.tick)::after { inset: 0; }
  .tx { flex: 1; min-width: 0; display: grid; gap: 1px; padding-top: 2px; }
  .it { font-size: var(--fs-body); line-height: 1.35; }
  .tx small { font-size: var(--fs-s); color: var(--text-soft); line-height: 1.35; }
  .mine .it { color: var(--text-soft); }
  .by { flex: none; max-width: 40%; display: flex; gap: 8px; padding-top: 5px; overflow: hidden; }
  .who { display: inline-flex; align-items: center; gap: 4px; font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  .who::before { content: ''; width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--who); }
  /* 編集: the row is one button (its actions) */
  .pr.er { padding: 0; align-items: stretch; }
  .eb {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: start; cursor: pointer; -webkit-tap-highlight-color: transparent;
    flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; min-height: var(--hit); padding: 10px 12px;
  }
  .eb:active { background: var(--hl); }
  .eb:focus-visible { outline-offset: -3px; }
  .eb[aria-disabled='true'], .ch[aria-disabled='true'] { opacity: .55; }
  .grip { color: var(--edge); display: flex; flex: none; margin-right: -2px; }
  /* the row (or category) whose actions are open */
  .sel { background: var(--hl); }
  .add { color: var(--leaf-text); font-weight: 700; gap: 8px; }
  .reset { color: var(--text-soft); gap: 8px; }
  .none { margin: 0; font-size: var(--fs-s); color: var(--text-soft); }
  form { display: grid; padding-top: 4px; }
  .field {
    width: 100%; box-sizing: border-box; min-height: var(--hit); padding: 10px 12px; border: 0; border-radius: var(--r-chip);
    background: var(--card); color: var(--text); box-shadow: inset 0 0 0 1.5px var(--edge); font: 400 var(--fs-input)/1.4 var(--font-body);
  }
  .field:focus { outline: 3px solid var(--focus); outline-offset: 1px; }
</style>
