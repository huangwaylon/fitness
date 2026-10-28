<script lang="ts">
  // ふたり Us: partner's fruit + %, promises (応援する), Cozy Day, and settings.
  import { onMount } from 'svelte';
  import type { FruitKey, PromiseKind, PromiseView } from '#lib/types.ts';
  import FruitRing from '#lib/components/FruitRing.svelte';
  import Villager from '#lib/components/Villager.svelte';
  import Sheet from '#lib/components/Sheet.svelte';
  import PromiseEditor from '#lib/components/PromiseEditor.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { cheer, cozyDay, cozyLeft, setPromise, blocker, setLanguage, setVillagerName, setVisibility } from '#lib/client/actions.ts';
  import { pushState, enablePush, type PushState } from '#lib/client/push.ts';
  import { t, i18n, formatSyncTime } from '#lib/i18n/index.ts';

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];
  /** Metrics whose raw numbers can be shared. Eating answers are never shared. */
  const SHAREABLE: FruitKey[] = ['peach', 'coconut', 'apple'];

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const partner = $derived(view ? view.people[view.partner] : null);

  let cozyMsg = $state('');
  let push = $state<PushState>('off');
  let pushBusy = $state(false);
  let name = $state('');
  let editOpen = $state(false);
  let daysMask = $state(0);
  let kind = $state<PromiseKind>('any');
  let note = $state('');
  let blockerText = $state('');
  let blockerSent = $state(false);

  onMount(() => {
    pushState().then((s) => (push = s));
  });

  $effect(() => {
    if (me && !name) name = me.villagerName;
  });

  function days(mask: number): string {
    const out: string[] = [];
    for (let d = 1; d <= 7; d++) if (mask & (1 << (d - 1))) out.push(t('weekday.' + d));
    return out.join('・');
  }

  function summary(p: PromiseView): string {
    return p.note?.trim() || `${days(p.daysMask)} ${t('promise.kind.' + p.kind)}`;
  }

  function openEdit() {
    daysMask = me?.promise?.daysMask ?? 0;
    kind = me?.promise?.kind ?? 'any';
    note = me?.promise?.note ?? '';
    editOpen = true;
  }

  async function savePromise() {
    if (daysMask === 0) return;
    await setPromise(daysMask, kind, note);
    editOpen = false;
  }

  async function sendBlocker() {
    if (!blockerText.trim()) return;
    const r = await blocker(blockerText.trim());
    if (r.ok) {
      blockerSent = true;
      blockerText = '';
    }
  }

  async function toggleCozy() {
    if (!view || !me) return;
    cozyMsg = '';
    const r = await cozyDay(view.today, !me.isCozyToday);
    if (typeof r === 'object') cozyMsg = t(r.message);
  }

  async function turnOnPush() {
    pushBusy = true;
    try {
      push = await enablePush();
    } finally {
      pushBusy = false;
    }
  }

  function saveName() {
    if (me && name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
</script>

{#if view && me && partner}
  <main class="screen us">
    <div class="screen-head">
      <h1><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-us" /></svg>{t('us.title')}</h1>
      <HelpButton topic="us" />
    </div>

    <!-- Partner -->
    <section class="card partner">
      <div class="who">
        <span class="av"><Villager person={view.partner} size={44} /></span>
        <h2>{partner.villagerName}</h2>
        <span class="big score">{partner.score}<small>/100</small></span>
      </div>
      <div class="fruits">
        {#each FRUITS as f (f)}<FruitRing fruit={f} view={partner.fruits[f]} size="54px" showPct />{/each}
      </div>
    </section>

    <!-- Promises -->
    <section class="card">
      <h3 class="ttl">{t('promise.title')}</h3>
      <div class="prom">
        <Villager person={view.me} size={34} />
        <button type="button" class="ptxt edit" onclick={openEdit}>
          {#if me.promise}
            <span>{summary(me.promise)}</span>
            {#if me.promise.cheered}<span class="gotyou"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-heart" /></svg>{t('promise.cheeredBy', { name: partner.villagerName })}</span>{/if}
          {:else}
            <span class="none">{t('promise.edit')}</span>
          {/if}
        </button>
        {#if me.promise}<span class="mk {me.promise.result}" aria-label={t('promise.result.' + me.promise.result)}>{#if me.promise.result === 'kept'}✓{:else if me.promise.result === 'paused'}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>{:else}○{/if}</span>{/if}
      </div>
      <div class="prom">
        <Villager person={view.partner} size={34} />
        <span class="ptxt">{partner.promise ? summary(partner.promise) : t('promise.none')}</span>
        {#if partner.promise}
          <button type="button" class="chip cheer" aria-pressed={partner.promise.cheered} disabled={partner.promise.cheered} onclick={() => cheer()}>
            <svg viewBox="0 0 24 24" aria-hidden="true" style="color:#F28BA8;width:18px;height:18px"><use href="#i-heart" /></svg>
            {partner.promise.cheered ? t('promise.cheered') : t('promise.cheer')}
          </button>
        {/if}
      </div>
    </section>

    <!-- Cozy Day -->
    <section class="card row-card">
      <button type="button" class="toggle-row" role="switch" aria-checked={me.isCozyToday} onclick={toggleCozy}>
        <svg viewBox="0 0 24 24" class="ic" aria-hidden="true"><use href="#i-cozy" /></svg>
        <span class="tl">{t('us.cozy')}<small>{cozyMsg || t('us.cozyLeft', { n: cozyLeft(view) })}</small></span>
        <span class="sw" aria-hidden="true"></span>
      </button>
    </section>

    <!-- Settings -->
    <section class="card settings">
      <div class="set">
        <svg viewBox="0 0 24 24" class="si" aria-hidden="true"><use href="#i-globe" /></svg>
        <span class="sl">{t('us.lang')}</span>
        <div class="seg" role="radiogroup" aria-label={t('us.lang')}>
          <button type="button" role="radio" aria-checked={i18n.locale === 'ja'} onclick={() => setLanguage('ja')} lang="ja">日本語</button>
          <button type="button" role="radio" aria-checked={i18n.locale === 'en'} onclick={() => setLanguage('en')} lang="en">English</button>
        </div>
      </div>
      <label class="set">
        <svg viewBox="0 0 24 24" class="si" aria-hidden="true"><use href="#i-pencil" /></svg>
        <span class="sl">{t('us.name')}</span>
        <input class="name" type="text" maxlength="12" bind:value={name} onblur={saveName} onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
      </label>
      <div class="set share">
        <svg viewBox="0 0 24 24" class="si" aria-hidden="true"><use href="#i-eye" /></svg>
        <span class="sl">{t('us.share')}</span>
        <div class="shares">
          {#each SHAREABLE as m (m)}
            {@const on = view.visibility?.[m] ?? false}
            <button type="button" class="chip" role="switch" aria-checked={on} aria-label="{t('us.share')}: {t('fruit.' + m)}" onclick={() => setVisibility(m, !on)}>
              <svg viewBox="0 0 24 24" aria-hidden="true" style="width:20px;height:20px"><use href="#f-{m}" /></svg>
            </button>
          {/each}
        </div>
      </div>
      <div class="set">
        <svg viewBox="0 0 24 24" class="si" aria-hidden="true"><use href="#i-bell" /></svg>
        <span class="sl">{t('us.push')}</span>
        {#if push === 'on'}
          <span class="val ok">✓ {t('us.pushOn')}</span>
        {:else if push === 'install' || push === 'unsupported'}
          <span class="val">{t('us.pushInstall')}</span>
        {:else if push === 'denied'}
          <span class="val">{t('us.pushDenied')}</span>
        {:else}
          <button type="button" class="btn small" disabled={pushBusy} onclick={turnOnPush}>{t('us.pushEnable')}</button>
        {/if}
      </div>
      <div class="set sync">
        <svg viewBox="0 0 24 24" class="si" aria-hidden="true"><use href="#i-sync" /></svg>
        <span class="sl">{t('us.sync')}</span>
        <span class="syncs">
          {#each [me, partner] as p (p.person)}
            <span class="sy"><Villager person={p.person} size={22} label={p.villagerName} /><span class="money">{formatSyncTime(p.lastSyncAt, view.today)}</span></span>
          {/each}
        </span>
      </div>
    </section>
  </main>

  <Sheet bind:open={editOpen} label={t('promise.edit')}>
    <h2 class="sh-t">{t('promise.next')}</h2>
    <PromiseEditor bind:daysMask bind:kind bind:note />
    <button type="button" class="btn sh-b" disabled={daysMask === 0} onclick={savePromise}>{t('promise.set')}</button>
    {#if me.promise?.result === 'open'}
      <div class="blocker">
        {#if blockerSent}
          <p>{t('promise.blockerThanks')}</p>
        {:else}
          <input type="text" maxlength="80" placeholder={t('promise.blocker')} aria-label={t('promise.blocker')} bind:value={blockerText} />
          <button type="button" class="btn small quiet" disabled={!blockerText.trim()} onclick={sendBlocker}>{t('promise.blockerSend')}</button>
        {/if}
      </div>
    {/if}
  </Sheet>
{/if}

<style>
  .us { display: flex; flex-direction: column; gap: 12px; }
  .card { padding: 14px 16px; }
  .partner .who { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .av { width: 48px; height: 48px; border-radius: var(--r-blob); background: #FFE6D6; display: grid; place-items: center; flex: none; }
  .partner h2 { font-size: 1.25rem; }
  .score { margin-left: auto; font-size: 2.6rem; }
  .score small { font-size: 1rem; color: var(--text-faint); }
  .fruits { display: flex; justify-content: space-between; }

  .ttl { font-size: 1rem; color: var(--text-soft); margin-bottom: 4px; }
  .prom { display: flex; align-items: center; gap: 10px; min-height: 52px; }
  .prom + .prom { border-top: 2px dashed var(--edge); }
  .ptxt { flex: 1; min-width: 0; font-weight: 700; display: grid; gap: 2px; text-align: left; }
  .edit { appearance: none; background: none; border: 0; padding: 6px 0; cursor: pointer; color: var(--text); min-height: 44px; }
  .none { color: var(--sky-deep); text-decoration: underline; text-underline-offset: 3px; }
  :global(:root[data-theme="night"]) .none { color: var(--moon); }
  .gotyou { display: inline-flex; align-items: center; gap: 4px; width: max-content; padding: 2px 8px; border-radius: var(--r-pill); background: rgba(242, 139, 168, .22); font-size: 11px; color: var(--text); }
  .gotyou svg { width: 14px; height: 14px; color: #F28BA8; }
  .mk { width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; flex: none; background: var(--leaf-soft); color: var(--leaf-ink); }
  .mk.open { background: var(--sand); color: var(--ink-soft); }
  .mk.paused { background: #E3E6FA; }
  .mk svg { width: 18px; height: 18px; }
  .cheer { min-height: 44px; font-size: var(--fs-caption); }
  .cheer:disabled { cursor: default; background: rgba(242, 139, 168, .18); border-color: #F28BA8; color: var(--text); }

  .row-card { padding: 4px 8px; }
  .toggle-row {
    appearance: none; background: none; border: 0; cursor: pointer; width: 100%; display: flex; align-items: center; gap: 12px;
    min-height: 64px; padding: 6px 8px; color: var(--text); text-align: left;
  }
  .toggle-row .ic { width: 34px; height: 34px; flex: none; }
  .tl { flex: 1; font: 600 1.1rem var(--font-display); display: grid; }
  .tl small { font: 700 var(--fs-caption) var(--font-body); color: var(--text-faint); }
  .sw { width: 60px; height: 36px; border-radius: var(--r-pill); background: var(--sand); position: relative; flex: none; box-shadow: var(--sh-inset); transition: background var(--dur-base); }
  .sw::after { content: ''; position: absolute; top: 3px; left: 3px; width: 30px; height: 30px; border-radius: 50%; background: #fff; box-shadow: 0 2px 0 var(--sand-deep); transition: left var(--dur-base) var(--ease-bounce); }
  .toggle-row[aria-checked='true'] .sw { background: #9FA8E8; }
  .toggle-row[aria-checked='true'] .sw::after { left: 27px; }

  .settings { display: grid; padding: 4px 14px; }
  .set { display: flex; align-items: center; gap: 10px; min-height: 58px; flex-wrap: wrap; }
  .set + .set { border-top: 2px dashed var(--edge); }
  .si { width: 22px; height: 22px; color: var(--text-soft); flex: none; }
  .sl { font-weight: 700; flex: 1; min-width: 5em; }
  .seg { display: inline-flex; border: 2px solid var(--edge); border-radius: var(--r-pill); overflow: hidden; }
  .seg button { appearance: none; border: 0; background: transparent; color: var(--text-soft); min-height: 40px; padding: 0 14px; font-weight: 700; cursor: pointer; }
  .seg button[aria-checked='true'] { background: var(--leaf); color: var(--ink); }
  .name { width: 9.5em; min-height: 44px; border-radius: var(--r-sm); border: 2px solid var(--edge); background: var(--bg); color: var(--text); padding: 0 12px; text-align: right; }
  .shares { display: flex; gap: 6px; }
  .shares .chip { width: 48px; padding: 0; }
  .val { font-size: var(--fs-caption); font-weight: 700; color: var(--text-faint); }
  .val.ok { color: var(--leaf-ink); font-size: var(--fs-body); }
  :global(:root[data-theme="night"]) .val.ok { color: var(--leaf-soft); }
  .syncs { display: flex; gap: 12px; }
  .sy { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-caption); }

  .sh-t { font-size: 1.4rem; margin-bottom: 12px; }
  .sh-b { margin-top: 14px; }
  .blocker { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
  .blocker input { flex: 1; min-height: 44px; border-radius: var(--r-sm); border: 2px solid var(--edge); background: var(--surface); color: var(--text); padding: 0 12px; }
  .blocker p { margin: 0; font-weight: 700; color: var(--text-soft); }
</style>
