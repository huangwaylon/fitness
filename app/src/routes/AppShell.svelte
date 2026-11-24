<script lang="ts">
  // The app's shell around every route but the bare pages (routes/+layout.svelte loads it lazily, so 共有リンク's and
  // ジム's first load never holds the week, the world, the sound, the log nor the harvest): the week's states, the
  // harvest, the toasts, the deploy's updates, the sound, the log.
  import { routeOf } from '#lib/ui-state/paths.ts';
  import { onMount, type Snippet } from 'svelte';
  import type { HarvestView } from '#lib/types.ts';
  import { page, updated } from '$app/state';
  import Sprites from '#lib/components/ui/Sprites.svelte';
  import Bubble from '#lib/components/ui/Bubble.svelte';
  import ToastHost, { hostBanner } from '#lib/components/ui/ToastHost.svelte';
  import { toastPersonFace } from '#lib/components/ui/Toast.svelte';
  import PersonFace from '#lib/components/characters/PersonFace.svelte';
  import { bindHostVillagers } from '#lib/components/characters/hostWho.ts';
  // (a room's chrome hidden for a screenshot: the toasts too)
  import { shot } from '#lib/components/rooms/shot.svelte.ts';
  import NookScreen from '#lib/components/ui/NookScreen.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { startTheme } from '#lib/ui-state/theme.svelte.ts';
  import { startWeather } from '#lib/components/island/weatherNow.svelte.ts';
  import { startViewport } from '#lib/ui-state/viewport.ts';
  import { doorTransition } from '#lib/ui-state/doorTransition.ts';
  import { deployedInfo, isChunkError, lazy, newWorker, safeReload } from '#lib/ui-state/reload.ts';
  import { claimed } from '#lib/ui-state/claims.ts';
  import { DEVICE, localKV } from '#lib/sync/storage.ts';
  import { replaceState } from '$app/navigation';
  import { registerLate, releaseWorker } from '#lib/ui-state/swLate.ts';
  import { opensIsland } from '#lib/ui-state/boot.ts';
  import { musicNow, startSound } from '#lib/sound/sound.svelte.ts';
  import { acked, bindStage, hear, hush, request, stage } from '#lib/sound/stage.svelte.ts';
  import { hooksOn } from '#lib/ui-state/preview.ts';
  import { bindLook } from '#lib/ui-state/preview.svelte.ts';
  import { setSeasonLook } from '#lib/store/actions.ts';
  import { world } from '#lib/store/world.svelte.ts';
  import { startTaps } from '#lib/sound/taps.ts';
  import { startExactTaps } from '#lib/ui-state/exactTaps.ts';
  import { startModality } from '#lib/components/ui/modality.ts';
  import { count, noteHiddenReload, startLog } from '#lib/sync/log.ts';
  import { logUrl } from '#lib/sync/transport.ts';
  import { queued } from '#lib/sync/queue.ts';
  import { version } from '$app/env';
  import { t } from '#lib/i18n/index.ts';

  let { children }: { children: Snippet } = $props();

  const route = $derived(routeOf(page.url.pathname));
  const onPair = $derived(route.startsWith('/pair'));
  const pageKind = $derived(route.startsWith('/tent') ? 'tent' : 'island');

  let laterFor = $state<string | null>(null);
  /** The harvest being finished: kept through the end card even after confirming drops it from the view. */
  let kept = $state<HarvestView | null>(null);
  const harvest = $derived(kept ?? week.view?.harvest ?? null);
  const showHarvest = $derived(
    !onPair && !page.error && !!week.view && week.view.viewer !== 'G' && !!harvest && (!!kept || (!harvest.confirmedBy.includes(week.view.me) && laterFor !== harvest.weekKey))
  );
  // Pages hold their toasts while the harvest is up.
  ui.provideOverlay(() => showHarvest);
  /** The overlay is loaded the first time a harvest opens (Sunday evening), not on every route. */
  const loadHarvest = lazy(() => import('#lib/components/sheets/HarvestOverlay.svelte'));
  let Harvest = $state<typeof import('#lib/components/sheets/HarvestOverlay.svelte').default | null>(null);
  // Loaded in script, so the page goes inert only once the overlay can show; a failed load (and no reload) leaves the
  // island usable and treats it as あとで, instead of an inert page with nothing on it.
  $effect(() => {
    if (!showHarvest || Harvest) return;
    const wk = harvest?.weekKey ?? null;
    loadHarvest().then((m) => (Harvest = m.default), () => (laterFor = wk));
  });

  // A new deploy (Kit checks _app/version.json when the app comes back to the front): taken at a safe moment once the
  // new build's service worker controls the page (newWorker: it serves the reload its own shell): the app shown again
  // after a while away, before its first touch, nothing in hand; a build this one can't work with, or a chunk lost, as
  // it hides too (ui-state/update.ts). Its install failed or can't be had now: asked again as the app comes back.
  let workerReady = $state(false);
  /** The deployed build's compatibility epoch (version.json `compat`, as askWorker last read it). */
  let deployedCompat = $state<unknown>(undefined);
  /** A chunk this page asked for in the background wasn't fetched (a deploy removed it): taken like an incompatible build. */
  let chunkLost = $state(false);
  /** Until when this return is a safe moment (update.ts freshUntil); 0 once touched. */
  let freshTill = $state(0);
  /** The update's rules (ui-state/update.ts), loaded after the mount: off the first load. */
  let U = $state<typeof import('#lib/ui-state/update.ts') | null>(null);
  /** The deployed version (version.json's, as askWorker last read it): each reload's once-a-version guard. */
  let deployedV = '?';
  function askWorker() {
    if (!updated.current) return;
    if (!workerReady) void newWorker().then((ok) => (workerReady = ok));
    void deployedInfo().then((d) => {
      if (typeof d?.version === 'string') deployedV = d.version;
      deployedCompat = d?.compat;
    });
  }
  $effect(askWorker);
  const inHand = (u: NonNullable<typeof U>) =>
    u.inUse({ open: onPair || showHarvest || ui.sheets.length > 0, route, hike: (localKV()?.getItem(DEVICE.hikeNow) ?? null) !== null, typing: u.typingIn(document.activeElement), queued: queued().length });
  /** Whether to reload into the deployed build now (update.ts takeUpdate). */
  const takeNow = (hidden: boolean) =>
    !!U && U.takeUpdate({ updated: updated.current, ready: workerReady, incompatible: U.incompatible(deployedCompat) || chunkLost, busy: inHand(U), hidden, fresh: !hidden && freshTill > 0 });
  /** The send queue empty (every row acked), or DRAIN_MS passed. */
  const DRAIN_MS = 1500;
  const drained = (t0 = Date.now()) =>
    new Promise<void>((ok) => {
      const look = () => (queued().length === 0 || Date.now() - t0 >= DRAIN_MS ? ok() : void setTimeout(look, 100));
      look();
    });
  /** Reloads into the deployed build for `why`, once a deployed version a session (update.ts doneFor). */
  function take(key: string, why: 'update' | 'stale', before?: () => void) {
    if (!U || U.doneFor(key, deployedV)) return;
    before?.();
    if (safeReload(Date.now(), why)) U.markDone(key, deployedV);
  }
  $effect(() => {
    if (takeNow(false)) take('island.updateFor', 'update');
  });

  // the service worker once the island is up (ui-state/swLate.ts); a screen with no island coming releases it
  $effect(() => {
    if (week.status === 'unconfigured' || (!week.view && week.status === 'error')) releaseWorker();
  });

  // the log's coarse usage: which routes are opened (sync/log.ts `use`)
  $effect(() => {
    count(`route:${route.split('/')[1] || 'island'}`);
  });

  // 英語すごろく's online games heard on every screen once the week's in (an invitation comes wherever the phone is: the
  // banner in ToastHost's slot, bound here so the kit imports no feature), its small part fetched then; the banner's
  // own chunk out of the first load (an invitation can't come before the week and the live socket are in)
  void import('#lib/sugoroku/components/InviteBanner.svelte').then((m) => hostBanner(m.default), () => {});
  // a person's toast: their look or villager (bound here, so the bare pages' toasts load neither)
  toastPersonFace(PersonFace);
  // the island's host follows the players' villagers (characters/hostWho.ts: bound here, so <Host> needs no store)
  bindHostVillagers(() => {
    const people = week.view?.people;
    return people ? [people.A?.villager, people.B?.villager] : [];
  });
  let sgListening = false;
  $effect(() => {
    if (!week.view || onPair || sgListening) return;
    sgListening = true;
    void import('#lib/sugoroku/online.svelte.ts').then((m) => m.listen(true)).catch(() => {});
  });

  // 島 ⇄ テント: NH's door, a black iris on the door we go through.
  doorTransition();

  onMount(() => {
    registerLate(route === '/' && opensIsland());
    void import('#lib/ui-state/update.ts').then((m) => (U = m), () => {});
    // the island's look (設定 → 季節) is the record's: every phone's scene follows it
    bindLook({ read: () => week.model?.state.seasonLook, write: (look) => void setSeasonLook(look) });
    const stopTheme = startTheme();
    const stopWeather = startWeather();
    week.init();
    if (!routeOf(location.pathname).startsWith('/pair')) week.refresh();
    const onVisible = () => {
      if (document.visibilityState === 'hidden') {
        freshTill = 0;
        U?.noteHidden();
        // (the hide's own keepalive send just took the queue's rows: their ack waited for, DRAIN_MS at most, so the
        // reload never cuts it off and the next open resends nothing; rows still unacked keep the page: inUse)
        if (U && (U.incompatible(deployedCompat) || chunkLost)) void drained().then(() => document.visibilityState === 'hidden' && takeNow(true) && take('island.staleFor', 'stale', noteHiddenReload));
      }
      if (document.visibilityState === 'visible') {
        const till = U?.freshUntil() ?? 0;
        if (till) {
          freshTill = till;
          // (asked each second too: what isn't reactive, a queue row sent or a keyboard down, can free the moment)
          const tick = setInterval(() => {
            if (freshTill !== till || Date.now() >= till) return void (clearInterval(tick), freshTill === till && (freshTill = 0));
            if (takeNow(false)) take('island.updateFor', 'update');
          }, 1000);
        }
        askWorker();
      }
      if (document.visibilityState === 'visible' && !routeOf(location.pathname).startsWith('/pair')) week.refresh({ background: true });
    };
    document.addEventListener('visibilitychange', onVisible);
    // a newer worker's claim before this mount (+layout.ts watchClaims): Kit asked again now it surely can
    if (claimed()) void updated.check().catch(() => {});
    // the boot watchdog's reload (ui-state/bootWatch.ts) came at `?shell=cache`: the param goes (the log counts it)
    const rescued = new URLSearchParams(location.search).get('shell') === 'cache';
    if (rescued) {
      const q = location.search.replace(/([?&])shell=cache(&|$)/, (_, a: string, b: string) => (b ? a : '')).replace(/^\?$/, '');
      replaceState(location.pathname + q + location.hash, page.state);
    }
    // Any other chunk that fails to load (Vite's preload helper reports it): a stale build, reload once (not as we leave).
    // Only a chunk not fetched: the helper reports every lazy import that rejects, a module that threw as it ran too
    // (the sound's renderer, the villagers' birthdays, K.K.'s songs), which a reload doesn't cure.
    // Taken at a safe moment (a background import's failure reloaded the island in front, 11-24 19:44); a tap's own
    // failure still reloads at once (reload.ts lazy).
    const onStale = (e: Event) => {
      if (!isChunkError((e as Event & { payload?: unknown }).payload)) return;
      chunkLost = true;
      void updated.check().catch(() => {});
    };
    window.addEventListener('vite:preloadError', onStale);
    // the first touch or key ends a fresh return: from then on the player is using the app
    const touched = () => void (freshTill = 0);
    window.addEventListener('pointerdown', touched, { capture: true, passive: true });
    window.addEventListener('keydown', touched, { capture: true });
    const stopViewport = startViewport();
    // a touch's click where the finger was, over the island and in the rooms (no snapping onto a door nearby)
    const stopExactTaps = startExactTaps();
    // Sound (all off by default): unlocks on the first tap, muffles the music under a sheet, the panel or the harvest.
    const stopSound = startSound({ muffled: () => ui.sheets.length > 0 || showHarvest });
    // the shared music stages (K.K., the stereos: sound/stage.svelte.ts) over the shared world's relay; the e2e's look
    bindStage({ send: (i) => i.kind === 'music' && world.tell(i), serverNow: () => world.serverNow(), me: () => world.me });
    const offStage = [world.hear((m) => m.kind === 'music' && hear(m)), world.onAck(acked)];
    if (week.demo || hooksOn(new URLSearchParams(location.search))) window.__music = { now: musicNow, stage: () => $state.snapshot(stage), request, hush };
    // every tap's sound (data-sfx) and the "can't" boop (aria-disabled): after startSound, so its unlock runs first
    const stopTaps = startTaps();
    // no focus ring after a touch (focus is still restored for keyboard and VoiceOver users)
    const stopModality = startModality();
    // the log (sync/log.ts, docs/ops/observability.md): errors, the lifecycle, the island's load and frames
    const stopLog = startLog({
      build: version, url: logUrl(), demo: !!week.demo, route: () => routeOf(location.pathname), rescued,
      ready: () => !!document.querySelector('canvas[data-w3d][data-loaded]'),
      readyOn: (changed) => {
        const mo = new MutationObserver(changed);
        mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-loaded'] });
        return () => mo.disconnect();
      },
      queue: () => {
        const q = queued();
        return { n: q.length, ageMs: q.length ? Date.now() - Math.min(...q.map((e) => e.queuedAt)) : 0 };
      }
    });
    return () => {
      stopLog();
      stopModality();
      stopTaps();
      stopSound();
      offStage.forEach((f) => f());
      stopViewport();
      stopExactTaps();
      stopTheme();
      stopWeather();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('vite:preloadError', onStale);
      window.removeEventListener('pointerdown', touched, { capture: true });
      window.removeEventListener('keydown', touched, { capture: true });
    };
  });
</script>

<Sprites />

<!-- The harvest is a real modal, so everything behind it is inert. -->
<div class="page" data-page={onPair ? 'pair' : pageKind} inert={showHarvest && !!Harvest}>
{#if week.status === 'unconfigured'}
  <NookScreen><h1><span lang="ja">{t('state.notSetUp', undefined, 'ja')}</span><small lang="en">{t('state.notSetUp', undefined, 'en')}</small></h1></NookScreen>
{:else if onPair}
  {@render children()}
{:else if !week.view && week.status === 'error'}
  <NookScreen>
    <Bubble text={t('state.error')} host={false} name={t('host.nook')} />
    <button type="button" class="btn" data-sfx="sync" onclick={() => week.refresh()}>{t('state.retry')}</button>
  </NookScreen>
{:else if !week.view}
  <NookScreen busy><p>{t('state.loading')}</p></NookScreen>
{:else}
  {@render children()}
{/if}
</div>

{#if showHarvest && week.view && harvest && Harvest}
  <Harvest view={week.view} {harvest} onlater={() => (laterFor = harvest.weekKey)}
    onkeep={() => (kept = $state.snapshot(harvest))} ondone={() => (kept = null)} />
{/if}

<!-- Inside the open sheet when there is one (Sheet.svelte): outside a modal dialog it would be inert. -->
{#if !showHarvest && !ui.sheets.length && !shot.bare}<ToastHost />{/if}

<style>
  .page { min-height: var(--vh-page); background: var(--bg); }
  /* 島: the island floats in the flat map sea, which runs on under the dialogue box and the action. */
  .page[data-page='island'] { background: var(--sea-flat); }
  .page[data-page='tent'] { background: #2a1f17; }
  /* the state screens (ui/NookScreen) but loading's, and a route's error: on the tan panel, not the sea (the soft ink
     line is only 2.1:1 on the sea blue) */
  .page[data-page='island']:has(> :global(.nook-screen:not([aria-busy]))) { background: var(--bg); }
</style>
