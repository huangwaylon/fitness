<script lang="ts">
  // けっこんしき's せってい (members; a level behind the title bar's ⚙): the two names, the day, the venue, the time zone
  // the board's today is read in, the categories (chips with ×, a field to add one), and the deleted tasks with もどす;
  // ぜんぶ けす removes them for good after an NH ask (its own small sheet: はい / いいえ). A field saves as it's left
  // (its change), each its own wconf row.
  import Sheet from '../ui/Sheet.svelte';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import type { Config, Deleted, WeddingActions } from './view.ts';

  interface Props {
    config: Config;
    deleted: Deleted[];
    actions?: WeddingActions;
  }
  let { config, deleted, actions }: Props = $props();

  // svelte-ignore state_referenced_locally
  let f = $state({ p1: config.p1, p2: config.p2, date: config.date, venue: config.venue, tz: config.tz });
  let cat = $state('');
  let asking = $state(false);
  const ZONES = ['Asia/Tokyo', 'Asia/Seoul', 'Asia/Taipei', 'Asia/Shanghai', 'Asia/Singapore', 'Australia/Sydney', 'Pacific/Honolulu', 'America/Los_Angeles', 'America/New_York', 'Europe/London', 'Europe/Paris', 'UTC'];
  const zones = $derived(ZONES.includes(config.tz) || !config.tz ? ZONES : [config.tz, ...ZONES]);

  const saved = () => toasts.show(t('wed.set.saved'), 1600);
  function names() {
    const p1 = f.p1.trim(), p2 = f.p2.trim();
    if (p1 === config.p1 && p2 === config.p2) return;
    actions?.onconfig('names', { p1, p2 });
    saved();
  }
  function one(k: 'date' | 'venue' | 'tz') {
    const v = f[k].trim();
    if (v === config[k]) return;
    actions?.onconfig(k, v);
    saved();
  }
  function addCat(e: SubmitEvent) {
    e.preventDefault();
    const c = cat.trim();
    if (!c || config.cats.includes(c)) return void (cat = '');
    actions?.onconfig('cats', [...config.cats, c]);
    cat = '';
  }
  function dropCat(c: string) {
    actions?.onconfig('cats', config.cats.filter((x) => x !== c));
  }
  function restore(d: Deleted) {
    actions?.onrestore(d.id);
    toasts.show(t('wed.set.restored', { title: d.title }), 2000);
  }
  function purge() {
    asking = false;
    actions?.onpurge();
    toasts.show(t('wed.set.purged'), 2000);
  }
</script>

<div class="set" data-wed-settings>
  <h4 class="sec-label">{t('wed.set.names')}</h4>
  <div class="card grid two">
    <label class="f"><span class="lbl">{t('wed.set.p1')}</span><input type="text" maxlength="40" bind:value={f.p1} onchange={names} data-wed-set="p1" data-sfx="none" /></label>
    <label class="f"><span class="lbl">{t('wed.set.p2')}</span><input type="text" maxlength="40" bind:value={f.p2} onchange={names} data-wed-set="p2" data-sfx="none" /></label>
  </div>

  <div class="card grid">
    <label class="f"><span class="lbl">{t('wed.set.date')}</span><input type="date" bind:value={f.date} onchange={() => one('date')} data-wed-set="date" data-sfx="none" /></label>
    <label class="f"><span class="lbl">{t('wed.set.venue')}</span><input type="text" maxlength="80" bind:value={f.venue} onchange={() => one('venue')} data-wed-set="venue" data-sfx="none" /></label>
    <label class="f"><span class="lbl">{t('wed.set.tz')}</span>
      <select bind:value={f.tz} onchange={() => one('tz')} data-wed-set="tz" data-sfx="none">{#each zones as z (z)}<option value={z}>{z.replace('_', ' ')}</option>{/each}</select>
    </label>
  </div>

  <h4 class="sec-label">{t('wed.set.cats')}</h4>
  <div class="card cats">
    <ul class="chips">
      {#each config.cats as c (c)}
        <li class="cchip" data-wed-cat={c}>{c}<button type="button" class="x" aria-label={t('wed.set.removeCat', { cat: c })} data-wed-cat-remove={c} data-sfx="tick" onclick={() => dropCat(c)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7 7 17" /></svg></button></li>
      {/each}
    </ul>
    <form class="add" onsubmit={addCat}>
      <input type="text" maxlength="30" bind:value={cat} placeholder={t('wed.set.catPlaceholder')} aria-label={t('wed.set.catPlaceholder')} data-wed-cat-field data-sfx="none" />
      <button type="submit" class="btn small" aria-disabled={!cat.trim() ? 'true' : undefined} data-wed-cat-add data-sfx="confirm">{t('wed.set.addCat')}</button>
    </form>
  </div>

  <h4 class="sec-label">{t('wed.set.deleted')}</h4>
  <div class="card del">
    {#if deleted.length}
      <ul class="rows">
        {#each deleted as d (d.id)}
          <li data-wed-deleted={d.id}>
            <span class="lbl2"><b>{d.title}</b>{#if d.due}<small>{formatDate(d.due)}</small>{/if}</span>
            <button type="button" class="btn small paper" data-wed-restore={d.id} data-sfx="undo" onclick={() => restore(d)}>{t('wed.set.restore')}</button>
          </li>
        {/each}
      </ul>
      <button type="button" class="btn small paper purge" data-wed-purge data-sfx="open" onclick={() => (asking = true)}>{t('wed.set.purge')}</button>
    {:else}
      <p class="none">{t('wed.set.noneDeleted')}</p>
    {/if}
  </div>
</div>

<Sheet bind:open={asking} label={t('wed.set.purgeTitle')} title={t('wed.set.purgeTitle')}>
  <div class="ask" data-wed-purge-ask>
    <p>{t('wed.set.purgeAsk', { n: deleted.length })}<br /><small>{t('wed.set.purgeBody')}</small></p>
  </div>
  {#snippet footer()}
    <div class="two-btn">
      <button type="button" class="btn paper" data-wed-purge-no data-sfx="back" onclick={() => (asking = false)}>{t('wed.set.purgeNo')}</button>
      <button type="button" class="btn" data-wed-purge-yes data-sfx="confirm" onclick={purge}>{t('wed.set.purgeYes')}</button>
    </div>
  {/snippet}
</Sheet>

<style>
  .set { display: grid; gap: 10px; }
  .grid { display: grid; gap: 12px; padding: 14px; }
  .grid.two { grid-template-columns: 1fr 1fr; }
  .f { display: grid; gap: 5px; min-width: 0; }
  .lbl { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); padding-left: 4px; }
  input, select {
    width: 100%; min-width: 0; min-height: var(--hit); padding: 8px 12px; border-radius: 14px; border: 0; box-sizing: border-box;
    font: 500 var(--fs-input)/1.3 var(--font-ui); color: var(--c-ink); background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge);
    -webkit-appearance: none; appearance: none;
  }
  input[type='date'] { display: block; text-align: left; }
  select { background-image: linear-gradient(45deg, transparent 50%, var(--c-ink-soft) 50%), linear-gradient(135deg, var(--c-ink-soft) 50%, transparent 50%);
    background-position: calc(100% - 20px) 55%, calc(100% - 14px) 55%; background-size: 6px 6px; background-repeat: no-repeat; padding-right: 34px; }
  .cats { display: grid; gap: 12px; padding: 14px; }
  .cats .chips { list-style: none; margin: 0; padding: 0; }
  .cchip {
    display: inline-flex; align-items: center; gap: 0; min-height: 36px; padding: 0 0 0 12px; border-radius: var(--r-pill);
    background: var(--ctl-off); font: 700 var(--fs-s)/1 var(--font-ui);
  }
  .x { appearance: none; border: 0; background: none; cursor: pointer; width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; color: var(--text-soft); position: relative; }
  .x::after { content: ''; position: absolute; inset: -4px; }
  .x svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; }
  .add { display: flex; gap: 8px; align-items: center; }
  .add input { flex: 1; }
  .add .btn { margin: 0 0 var(--lip-h); flex: none; }
  .del { padding: 6px 14px 12px; display: grid; gap: 8px; }
  .rows { list-style: none; margin: 0; padding: 0; display: grid; }
  .rows li { display: flex; align-items: center; gap: 10px; min-height: var(--row-obj); }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .rows .btn { margin: 0 0 var(--lip-h); flex: none; }
  .lbl2 { flex: 1; min-width: 0; display: grid; gap: 2px; padding: 6px 0; }
  .lbl2 b { font-size: var(--fs-body); overflow-wrap: anywhere; }
  .lbl2 small { font-size: var(--fs-s); color: var(--text-soft); font-weight: 700; }
  .purge { justify-self: end; color: var(--coral-text); margin: 4px 0 var(--lip-h); }
  .none { margin: 8px 0 4px; font-weight: 700; color: var(--text-soft); text-align: center; }
  .ask { text-align: center; padding: 4px 0 8px; }
  .ask p { margin: 0; font-weight: 700; line-height: 1.6; }
  .ask small { color: var(--text-soft); font-size: var(--fs-s); }
  .two-btn { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two-btn .btn { margin: 0; }
  @media (max-width: 359px) { .grid.two { grid-template-columns: 1fr; } }
</style>
