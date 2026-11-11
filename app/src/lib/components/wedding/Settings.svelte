<script lang="ts">
  // 結婚式's 設定 (members; the sheet's third tab), grouped dense cards: ふたり (the two names), 式 (the day, the
  // time, the venue; the board's today is Japan's: one wedding, in Japan, no zone to pick), カテゴリ (chips with ×: とりけす on the banner, which
  // says how many tasks wear it; a field to add one), 削除したやること (each with 戻す: a task, or a checklist item
  // removed on its own; one deleted with its task comes back with it) and 完全に削除 (for good, after an action
  // sheet's ask). A field saves as it's left (its change), each its own wconf row.
  import { untrack } from 'svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import { board } from './board.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { NAME_CHARS, VENUE_CHARS, WCATS_MAX, WTASK_CAT, type WedTask } from '#lib/contract/wedding.ts';
  import { restorable } from './view.ts';

  const config = $derived(board.config);
  const deleted = $derived(restorable(board.deleted));

  let f = $state(untrack(() => ({ p1: config.p1, p2: config.p2, date: config.date, time: config.time, venue: config.venue })));
  let cat = $state('');
  let asking = $state(false);

  /** The banners docked low: never over the title bar's ✕ (a field's save lands mid-tap when ✕ is what blurred it). */
  const LOW = { low: true };
  type Key = 'p1' | 'p2' | 'date' | 'time' | 'venue';
  /** One setting, saved as its field is left ('' clears it: the default again). */
  function one(k: Key) {
    const v = f[k].trim();
    if (v === config[k]) return;
    if (board.setConfig(k, v)) toasts.show(t('wed.set.saved'), 1600, LOW);
  }
  function addCat(e: SubmitEvent) {
    e.preventDefault();
    const c = cat.trim();
    if (!c || config.cats.includes(c) || config.cats.length >= WCATS_MAX) return void (cat = '');
    board.setConfig('cats', [...config.cats, c]);
    cat = '';
  }
  function dropCat(c: string) {
    const was = config.cats, n = board.tasks.filter((x) => x.category === c).length;
    board.setConfig('cats', was.filter((x) => x !== c));
    toasts.show(t(n ? 'wed.set.catGoneN' : 'wed.set.catGone', { cat: c, n }), 5000, { action: { label: t('common.undo'), run: () => void board.setConfig('cats', [...was]) } });
  }
  function restore(d: WedTask) {
    board.restore(d.id);
    toasts.show(t('wed.set.restored', { title: d.title }), 2000, LOW);
  }
  function purge() {
    board.purge();
    toasts.show(t('wed.set.purged'), 2000, LOW);
  }
  const ROWS: Record<'names' | 'ceremony', readonly { k: Key; icon: IconName; type: string; max?: number }[]> = {
    names: [{ k: 'p1', icon: 'heart', type: 'text', max: NAME_CHARS }, { k: 'p2', icon: 'heart', type: 'text', max: NAME_CHARS }],
    ceremony: [{ k: 'date', icon: 'calendar', type: 'date' }, { k: 'time', icon: 'clock', type: 'time' }, { k: 'venue', icon: 'church', type: 'text', max: VENUE_CHARS }]
  };
</script>

{#snippet field(r: { k: Key; icon: IconName; type: string; max?: number })}
  <label class="row">
    <span class="gi"><Icon name={r.icon} size={18} /></span>
    <span class="k">{t(`wed.set.${r.k}`)}</span>
    <input class="v" type={r.type} maxlength={r.max} bind:value={f[r.k]} onchange={() => one(r.k)} data-wed-set={r.k} data-sfx="none" />
  </label>
{/snippet}

<div class="set">
  <h3 class="sec-label head">{t('wed.set.names')}</h3>
  <div class="card dense">{#each ROWS.names as r (r.k)}{@render field(r)}{/each}</div>

  <h3 class="sec-label head">{t('wed.set.ceremony')}</h3>
  <div class="card dense">
    {#each ROWS.ceremony as r (r.k)}{@render field(r)}{/each}
  </div>

  <h3 class="sec-label head">{t('wed.set.cats')}</h3>
  <div class="card dense">
    {#if config.cats.length}
      <ul class="cats">
        {#each config.cats as c (c)}
          <li class="cchip" data-wed-cat={c}>{c}<button type="button" class="x" aria-label={t('wed.set.removeCat', { cat: c })} data-wed-cat-remove={c} data-sfx="tick" onclick={() => dropCat(c)}><Icon name="close" size={16} /></button></li>
        {/each}
      </ul>
    {/if}
    <form class="row add" onsubmit={addCat}>
      <span class="gi"><Icon name="tag" size={18} /></span>
      <input class="v start" type="text" maxlength={WTASK_CAT} bind:value={cat} placeholder={t('wed.set.catPlaceholder')} aria-label={t('wed.set.catPlaceholder')} data-wed-cat-field data-sfx="none" />
      {#if cat.trim()}<button type="submit" class="chip s" data-wed-cat-add data-sfx="confirm">{t('wed.set.addCat')}</button>{/if}
    </form>
  </div>

  <h3 class="sec-label head">{t('wed.set.deleted')}</h3>
  <div class="card dense">
    {#each deleted as d (d.id)}
      <div class="row" data-wed-deleted={d.id}>
        <span class="lbl"><span class="ell">{d.title}</span>{#if d.due}<small>{formatDate(d.due)}</small>{/if}</span>
        <button type="button" class="chip s" data-wed-restore={d.id} data-sfx="undo" onclick={() => restore(d)}>{t('wed.set.restore')}</button>
      </div>
    {:else}
      <p class="row none">{t('wed.set.noneDeleted')}</p>
    {/each}
    {#if deleted.length}
      <button type="button" class="row purge" data-wed-purge data-sfx="open" onclick={() => (asking = true)}><Icon name="trash" size={20} />{t('wed.set.purge')}</button>
    {/if}
  </div>
  <p class="foot">{t('wed.set.shared')}</p>
</div>

<ActionSheet bind:open={asking} title={t('wed.set.purgeAsk')} note={t('wed.set.purgeNote', { n: deleted.length })} groups={[[{ id: 'purge', label: t('wed.set.purgeYes'), icon: 'trash', danger: true }]]}
  onpick={(id) => id === 'purge' && purge()} />

<style>
  .set { padding: 0 12px 24px; }
  .set > .sec-label.head:first-child { margin-top: 8px; }
  .gi { width: 28px; height: 28px; border-radius: var(--r-chip); flex: none; display: grid; place-items: center; color: var(--leaf-text); background: color-mix(in srgb, var(--c-leaf) 28%, var(--card)); }
  .k { flex: none; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  /* a value: right-aligned, soft until focused, 16px (no iOS zoom), no box of its own */
  .v {
    flex: 1; min-width: 0; min-height: var(--hit); border: 0; padding: 0; background: none; text-align: end; color: var(--text-soft);
    font: 400 var(--fs-input)/1.3 var(--font-body); -webkit-appearance: none; appearance: none;
  }
  .v:focus { outline: none; color: var(--text); }
  .v.start { text-align: start; color: var(--text); }
  .v.start::placeholder { color: var(--text-soft); }
  input[type='date'].v, input[type='time'].v { display: flex; justify-content: flex-end; }
  input.v::-webkit-date-and-time-value { text-align: end; }
  .row { padding-block: 4px; }
  .cats { list-style: none; margin: 0; padding: 10px 12px; display: flex; flex-wrap: wrap; gap: 6px; }
  .cchip { display: inline-flex; align-items: center; height: 32px; padding-left: 12px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-s)/1 var(--font-ui); }
  .x { appearance: none; border: 0; background: none; cursor: pointer; width: 32px; height: 32px; display: grid; place-items: center; color: var(--text-soft); position: relative; }
  .x::after { content: ''; position: absolute; inset: -6px -2px; }
  .cats + .add::before { content: ''; position: absolute; top: 0; left: 12px; right: 12px; border-top: 1.5px dashed var(--stitch); }
  .lbl { flex: 1; min-width: 0; display: grid; gap: 1px; padding: 4px 0; }
  .ell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .lbl small { font-size: var(--fs-s); color: var(--text-soft); }
  .none { margin: 0; color: var(--text-soft); }
  .purge { gap: 8px; color: var(--coral-text); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .foot { margin: 10px 4px 0; font-size: var(--fs-s); line-height: 1.5; color: var(--text-soft); }
</style>
