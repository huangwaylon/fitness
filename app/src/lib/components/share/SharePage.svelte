<script lang="ts">
  // 共有リンク's page (`/s#<token>`, docs/travel.md "Sharing"): the link read from the relay (sync/shareRead.ts) once the
  // page is visible (a preview or a prerender that never shows isn't a visit), `self` when this phone is paired (our own
  // tap: not counted; the key itself is never sent), then the trip's guide from the bundle (TripShare). No sync, no
  // island, no sound, no service worker (the root layout's bare branch). Its states, one paper card each: expired (with
  // the date), unusable (a turned-off link and an unknown token alike: no oracle), busy, offline (もう一度).
  import { onMount } from 'svelte';
  import '#lib/i18n/link.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { tokenFromHash } from '#lib/contract/share.ts';
  import { getKey } from '#lib/sync/storage.ts';
  import { shareRead } from '#lib/sync/shareRead.ts';
  import { loadTrip } from '#lib/travel/trips/index.ts';
  import type { Trip, TripId } from '#lib/travel/types.ts';
  import Icon from '../ui/Icon.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import LangSwitch, { startLang } from './LangSwitch.svelte';
  import { untilDate } from './until.ts';
  import { pick } from '../travel/text.ts';

  type View =
    | { k: 'loading' }
    | { k: 'trip'; trip: Trip; exp: string }
    | { k: 'gone'; why: 'off' | 'expired'; exp?: string }
    | { k: 'busy' }
    | { k: 'offline' };
  let view = $state<View>({ k: 'loading' });
  let busy = $state(false);

  let token: string | null = null;
  async function read() {
    if (!token) return void (view = { k: 'gone', why: 'off' });
    busy = true;
    const r = await shareRead(token, !!getKey());
    if (r.ok) {
      try {
        view = { k: 'trip', trip: await loadTrip(r.ref as TripId), exp: r.exp };
      } catch {
        view = { k: 'offline' };
      }
    } else if (r.error === 'gone') view = { k: 'gone', why: r.why, ...(r.exp ? { exp: r.exp } : {}) };
    else view = { k: r.error };
    busy = false;
  }

  onMount(() => {
    startLang();
    token = tokenFromHash(location.hash);
    // (once visible: Safari's prerender and a tab opened in the background read nothing until they are shown)
    if (document.visibilityState === 'visible') return void read();
    const shown = () => {
      if (document.visibilityState !== 'visible') return;
      document.removeEventListener('visibilitychange', shown);
      void read();
    };
    document.addEventListener('visibilitychange', shown);
    return () => document.removeEventListener('visibilitychange', shown);
  });
</script>

<svelte:head>
  <title>{view.k === 'trip' ? `${pick(view.trip.title, i18n.locale)} · ${t('link.title')}` : t('link.title')}</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="no-referrer" />
</svelte:head>

<main class="share sheet-copy" data-share={view.k}>
  {#if view.k === 'trip'}
    <div class="top"><LangSwitch /></div>
    <div class="state"><div class="card pad gone" data-share-trip={view.trip.id}><h1>{pick(view.trip.title, i18n.locale)}</h1><p data-share-foot>{t('link.foot', { date: untilDate(view.exp, i18n.locale) })}</p></div></div>
  {:else}
    <div class="top"><LangSwitch /></div>
    <div class="state">
      {#if view.k === 'loading'}
        <p class="soft" aria-busy="true"><Phrases text={t('link.loading')} /></p>
      {:else if view.k === 'gone'}
        <div class="card pad gone" data-share-gone={view.why}>
          <span class="ic" aria-hidden="true"><Icon name="lock" size={28} /></span>
          <h1>{t(view.why === 'expired' ? 'link.expired' : 'link.off')}</h1>
          {#if view.why === 'expired' && view.exp}<p>{t('link.expiredOn', { date: untilDate(view.exp, i18n.locale) })}</p>{/if}
          <p class="soft"><Phrases text={t('link.offSub')} /></p>
        </div>
      {:else}
        <div class="card pad gone" data-share-gone={view.k}>
          <LoadError text={t(view.k === 'busy' ? 'link.busy' : 'link.offline')} {busy} onretry={read} data-share-retry />
        </div>
      {/if}
    </div>
  {/if}
</main>

<style>
  .share { min-height: var(--vh-page); background: var(--bg); display: flex; flex-direction: column; }
  .top { display: flex; justify-content: flex-end; padding: calc(var(--ui-top) + 8px) calc(12px + var(--safe-right)) 0 12px; }
  .state { flex: 1; display: grid; place-items: center; padding: 16px calc(16px + var(--safe-right)) calc(var(--safe-bottom) + 48px) calc(16px + var(--safe-left)); }
  .gone { width: min(360px, 100%); display: grid; justify-items: center; gap: 8px; text-align: center; padding: 22px 18px; }
  .gone h1 { font-size: var(--fs-talk); }
  .gone p { margin: 0; }
  .gone :global(.load-error) { width: 100%; }
  .ic { color: var(--text-soft); }
  .soft { color: var(--text-soft); font-size: var(--fs-s); margin: 0; }
</style>
