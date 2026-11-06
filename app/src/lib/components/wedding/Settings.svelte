<script lang="ts">
  // けっこんしき's 設定 (members; a level behind the band's ⚙), a grouped list: ふたり (the two names), 式 (the day, the
  // time, the venue, the time zone the board's today is read in), カテゴリ (chips with ×: とりけす on the banner, which
  // says how many tasks wear it; a field to add one), 削除したやること (each with もどす: a task, or a checklist item
  // removed on its own; one deleted with its task comes back with it) and ぜんぶ けす (for good, after an action
  // sheet's ask). A field saves as it's left (its change), each its own wconf row.
  import ActionSheet from '../quiet/ActionSheet.svelte';
  import Icon, { type IconName } from '../quiet/Icon.svelte';
  import { board } from './board.svelte.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { NAME_CHARS, VENUE_CHARS, WCATS_MAX, WTASK_CAT, type WedTask } from '#lib/contract/wedding.ts';
  import { restorable } from './view.ts';

  const config = $derived(board.config);
  const deleted = $derived(restorable(board.deleted));

  // svelte-ignore state_referenced_locally
  let f = $state({ p1: config.p1, p2: config.p2, date: config.date, time: config.time, venue: config.venue, tz: config.tz });
  let cat = $state('');
  let asking = $state(false);
  const ZONES = ['Asia/Tokyo', 'Asia/Seoul', 'Asia/Taipei', 'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Honolulu', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Paris', 'UTC'];
  const zones = $derived(ZONES.includes(config.tz) || !config.tz ? ZONES : [config.tz, ...ZONES]);

  /** The banners docked low: never over the title bar's ‹ (a field's save lands mid-tap when ‹ is what blurred it). */
  const LOW = { low: true };
  type Key = 'p1' | 'p2' | 'date' | 'time' | 'venue' | 'tz';
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
  <label class="q-row">
    <span class="gi"><Icon name={r.icon} size={16} /></span>
    <span class="k">{t(`wed.set.${r.k}`)}</span>
    <input class="v" type={r.type} maxlength={r.max} bind:value={f[r.k]} onchange={() => one(r.k)} data-wed-set={r.k} data-sfx="none" />
  </label>
{/snippet}

<div class="set">
  <h3 class="q-sec">{t('wed.set.names')}</h3>
  <div class="q-card">{#each ROWS.names as r (r.k)}{@render field(r)}{/each}</div>

  <h3 class="q-sec">{t('wed.set.ceremony')}</h3>
  <div class="q-card">
    {#each ROWS.ceremony as r (r.k)}{@render field(r)}{/each}
    <label class="q-row">
      <span class="gi"><Icon name="globe" size={16} /></span>
      <span class="k">{t('wed.set.tz')}</span>
      <select class="v" bind:value={f.tz} onchange={() => one('tz')} data-wed-set="tz" data-sfx="none">{#each zones as z (z)}<option value={z}>{z.replace('_', ' ')}</option>{/each}</select>
    </label>
  </div>

  <h3 class="q-sec">{t('wed.set.cats')}</h3>
  <div class="q-card">
    {#if config.cats.length}
      <ul class="cats">
        {#each config.cats as c (c)}
          <li class="cchip" data-wed-cat={c}>{c}<button type="button" class="x" aria-label={t('wed.set.removeCat', { cat: c })} data-wed-cat-remove={c} data-sfx="tick" onclick={() => dropCat(c)}><Icon name="close" size={14} /></button></li>
        {/each}
      </ul>
    {/if}
    <form class="q-row add" class:q-hl={config.cats.length > 0} onsubmit={addCat}>
      <span class="gi"><Icon name="tag" size={16} /></span>
      <input class="v start" type="text" maxlength={WTASK_CAT} bind:value={cat} placeholder={t('wed.set.catPlaceholder')} aria-label={t('wed.set.catPlaceholder')} data-wed-cat-field data-sfx="none" />
      {#if cat.trim()}<button type="submit" class="q-btn text" data-wed-cat-add data-sfx="confirm">{t('wed.set.addCat')}</button>{/if}
    </form>
  </div>

  <h3 class="q-sec">{t('wed.set.deleted')}</h3>
  <div class="q-card">
    {#each deleted as d (d.id)}
      <div class="q-row" data-wed-deleted={d.id}>
        <span class="lbl"><span class="q-ell">{d.title}</span>{#if d.due}<small>{formatDate(d.due)}</small>{/if}</span>
        <button type="button" class="q-btn text" data-wed-restore={d.id} data-sfx="undo" onclick={() => restore(d)}>{t('wed.set.restore')}</button>
      </div>
    {:else}
      <p class="q-row none">{t('wed.set.noneDeleted')}</p>
    {/each}
    {#if deleted.length}
      <button type="button" class="q-row purge" data-wed-purge data-sfx="open" onclick={() => (asking = true)}><Icon name="trash" size={16} />{t('wed.set.purge')}</button>
    {/if}
  </div>
  <p class="foot">{t('wed.set.shared')}</p>
</div>

<ActionSheet bind:open={asking} title={t('wed.set.purgeAsk', { n: deleted.length })} groups={[[{ id: 'purge', label: t('wed.set.purgeYes'), icon: 'trash', danger: true }]]}
  onpick={(id) => id === 'purge' && purge()} />

<style>
  .set { padding: 0 16px 24px; }
  .q-row { padding: 0 16px; min-height: 48px; }
  .gi { width: 28px; height: 28px; border-radius: 8px; flex: none; display: grid; place-items: center; color: var(--q-accent-ink); background: var(--q-accent-soft); }
  .k { flex: none; font-size: var(--q-fs-body); }
  /* a value: right-aligned, muted until focused, 16px (no iOS zoom), no box of its own */
  .v {
    flex: 1; min-width: 0; min-height: 44px; border: 0; padding: 0; background: none; text-align: end; color: var(--q-muted);
    font: 400 16px/1.3 var(--q-font); -webkit-appearance: none; appearance: none;
  }
  .v:focus { outline: none; color: var(--q-ink); }
  .v.start { text-align: start; color: var(--q-ink); }
  .v.start::placeholder { color: var(--q-muted); }
  input[type='date'].v, input[type='time'].v { display: flex; justify-content: flex-end; }
  input.v::-webkit-date-and-time-value { text-align: end; }
  select.v { direction: rtl; text-align-last: end; cursor: pointer; }
  .cats { list-style: none; margin: 0; padding: 10px 12px 10px 14px; display: flex; flex-wrap: wrap; gap: 6px; }
  .cchip { display: inline-flex; align-items: center; height: 30px; padding-left: 10px; border-radius: 15px; background: var(--q-sunken); font-size: var(--q-fs-s); color: var(--q-ink-2); }
  .x { appearance: none; border: 0; background: none; cursor: pointer; width: 30px; height: 30px; display: grid; place-items: center; color: var(--q-muted); position: relative; }
  .x::after { content: ''; position: absolute; inset: -7px -2px; }
  .lbl { flex: 1; min-width: 0; display: grid; gap: 1px; padding: 8px 0; }
  .lbl small { font-size: var(--q-fs-s); color: var(--q-muted); }
  .none { margin: 0; color: var(--q-muted); }
  .purge { gap: 8px; color: var(--q-coral); }
  .foot { margin: 10px 4px 0; font-size: var(--q-fs-s); line-height: 1.5; color: var(--q-muted); }
</style>
