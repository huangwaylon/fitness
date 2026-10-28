<script lang="ts">
  // ふたり Us: partner's fruit + %, promises (応援する) and Cozy Day. Settings live in しまフォン.
  import type { FruitKey, PromiseKind, PromiseView } from '#lib/types.ts';
  import FruitRing from '#lib/components/FruitRing.svelte';
  import Villager from '#lib/components/Villager.svelte';
  import Sheet from '#lib/components/Sheet.svelte';
  import PromiseEditor from '#lib/components/PromiseEditor.svelte';
  import HelpButton from '#lib/components/HelpButton.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { cheer, cozyDay, cozyLeft, setPromise, blocker } from '#lib/client/actions.ts';
  import { t } from '#lib/i18n/index.ts';

  const FRUITS: FruitKey[] = ['peach', 'coconut', 'apple', 'pear'];

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const partner = $derived(view ? view.people[view.partner] : null);

  let cozyMsg = $state('');
  let editOpen = $state(false);
  let daysMask = $state(0);
  let kind = $state<PromiseKind>('any');
  let note = $state('');
  let blockerText = $state('');
  let blockerSent = $state(false);

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

  const tagOf = (who: 'A' | 'B') => (who === 'A' ? 'var(--tag-apricot)' : 'var(--tag-plum)');
</script>

{#if view && me && partner}
  <main class="screen us">
    <div class="screen-head">
      <h1><span class="tile" style:--tile="var(--app-us)"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#app-us" /></svg></span>{t('us.title')}</h1>
      <HelpButton topic="us" />
    </div>

    <!-- Partner -->
    <section class="card partner">
      <span class="tape" style:--tape={tagOf(view.partner)}>{partner.villagerName}</span>
      <div class="who">
        <span class="av"><Villager person={view.partner} size={64} /></span>
        <span class="score"><span class="hero-num">{partner.score}</span><small class="money">/100</small></span>
      </div>
      <div class="fruits">
        {#each FRUITS as f (f)}<FruitRing fruit={f} view={partner.fruits[f]} size="56px" showPct />{/each}
      </div>
    </section>

    <!-- Promises -->
    <section class="card proms">
      <span class="tape" style:--tape="var(--c-leaf-soft)">{t('promise.title')}</span>
      <div class="prom">
        <Villager person={view.me} size={40} />
        <button type="button" class="ptxt edit" onclick={openEdit}>
          {#if me.promise}
            <span>{summary(me.promise)}</span>
            {#if me.promise.cheered}<span class="gotyou"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-heart" /></svg>{t('promise.cheeredBy', { name: partner.villagerName })}</span>{/if}
          {:else}
            <span class="none"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-pencil" /></svg>{t('promise.edit')}</span>
          {/if}
        </button>
        {#if me.promise}<span class="mk {me.promise.result}" aria-label={t('promise.result.' + me.promise.result)}>{#if me.promise.result === 'kept'}✓{:else if me.promise.result === 'paused'}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg>{:else}○{/if}</span>{/if}
      </div>
      <div class="prom">
        <Villager person={view.partner} size={40} />
        <span class="ptxt">{partner.promise ? summary(partner.promise) : t('promise.none')}</span>
        {#if partner.promise}
          <button type="button" class="chip cheer" aria-pressed={partner.promise.cheered} disabled={partner.promise.cheered} onclick={() => cheer()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-heart" /></svg>
            {partner.promise.cheered ? t('promise.cheered') : t('promise.cheer')}
          </button>
        {/if}
      </div>
    </section>

    <!-- Cozy Day -->
    <section class="card cozy">
      <button type="button" class="toggle-row" role="switch" aria-checked={me.isCozyToday} onclick={toggleCozy}>
        <span class="cz-ic"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-cozy" /></svg></span>
        <span class="tl">{t('us.cozy')}<small>{cozyMsg || t('us.cozyLeft', { n: cozyLeft(view) })}</small></span>
        <span class="switch" aria-hidden="true"></span>
      </button>
    </section>
  </main>

  <Sheet bind:open={editOpen} label={t('promise.edit')}>
    <h2 class="sh-t">{t('promise.next')}</h2>
    <PromiseEditor bind:daysMask bind:kind bind:note />
    <button type="button" class="btn sh-b" disabled={daysMask === 0} onclick={savePromise}>{t('promise.set')}</button>
    <!-- Ask "what got in the way?" only once the week is over (harvest open), never mid-week. -->
    {#if me.promise?.result === 'open' && view.harvest}
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
  .us { display: flex; flex-direction: column; gap: 22px; }
  .partner { padding: 24px 16px 14px; }
  .partner .who { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
  .av { width: 76px; height: 76px; border-radius: var(--r-blob); background: color-mix(in srgb, var(--p-apricot) 30%, var(--surface)); display: grid; place-items: center; flex: none; }
  .score { display: flex; align-items: baseline; gap: 2px; }
  .score small { font-size: 1rem; color: var(--text-faint); }
  .fruits { display: flex; justify-content: space-between; }

  .proms { padding: 18px 14px 6px; }
  .prom { display: flex; align-items: center; gap: 10px; min-height: 60px; }
  .prom + .prom { border-top: 2px dashed var(--stitch); }
  .ptxt { flex: 1; min-width: 0; font-weight: 700; display: grid; gap: 3px; text-align: left; }
  .edit { appearance: none; background: none; border: 0; padding: 6px 0; cursor: pointer; color: var(--text); min-height: 44px; font: inherit; font-weight: 700; }
  .none {
    display: inline-flex; align-items: center; gap: 6px; width: max-content; padding: 6px 14px; border-radius: var(--r-pill);
    background: var(--c-sky-soft); color: var(--c-sky-ink); box-shadow: 0 3px 0 var(--c-sky);
  }
  .none svg { width: 18px; height: 18px; }
  .gotyou { display: inline-flex; align-items: center; gap: 4px; width: max-content; padding: 2px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--p-berry) 22%, transparent); font-size: var(--fs-micro); color: var(--text); }
  .gotyou svg { width: 14px; height: 14px; color: var(--p-berry); }
  .mk { width: 32px; height: 32px; border-radius: 50%; display: grid; place-items: center; font-weight: 700; flex: none; background: var(--c-leaf-soft); color: var(--c-leaf-ink); }
  .mk.open { background: var(--c-paper-2); color: var(--c-ink-soft); }
  .mk.paused { background: var(--c-sky-soft); }
  .mk svg { width: 18px; height: 18px; }
  .cheer { min-height: 44px; font-size: var(--fs-caption); }
  .cheer svg { width: 18px; height: 18px; color: var(--p-berry); }
  .cheer:disabled { cursor: default; background: color-mix(in srgb, var(--p-berry) 20%, var(--surface)); border-color: var(--p-berry); color: var(--text); box-shadow: none; }

  .cozy { padding: 4px 8px; }
  .toggle-row {
    appearance: none; background: none; border: 0; cursor: pointer; width: 100%; display: flex; align-items: center; gap: 12px;
    min-height: 68px; padding: 6px 8px; color: var(--text); text-align: left; font: inherit;
  }
  .cz-ic { width: 44px; height: 44px; border-radius: var(--r-squircle); background: var(--c-sky-soft); display: grid; place-items: center; flex: none; }
  .cz-ic svg { width: 28px; height: 28px; color: var(--c-ink); }
  .tl { flex: 1; font: 900 var(--fs-body-lg) var(--font-ui); display: grid; }
  .tl small { font: 700 var(--fs-caption) var(--font-ui); color: var(--text-faint); }

  .sh-t { margin-bottom: 12px; }
  .sh-b { margin-top: 14px; }
  .blocker { display: flex; gap: 8px; margin-top: 16px; align-items: center; }
  .blocker input { flex: 1; min-height: 44px; border-radius: var(--r-sm); border: 2px solid var(--edge); background: var(--bg); color: var(--text); padding: 0 12px; }
  .blocker p { margin: 0; font-weight: 700; color: var(--text-soft); }
</style>
