<script lang="ts">
  // しまフォン launcher (style guide v4 §T.1, §R.5): a NookPhone-screen sheet with a status row (time · leaf),
  // the title and a 3-column grid of squircle app tiles: official NookPhone tiles (passport, rescue) or
  // official glyphs on our tile colours. Each app slides in from the right inside the phone, with a ‹ back.
  // Apps: help, villager (+ name), language, reminders (iOS Shortcuts), sync, sharing.
  import { onMount, tick as nextTick } from 'svelte';
  import type { FruitKey } from '#lib/types.ts';
  import Sheet from './Sheet.svelte';
  import Avatar from './Avatar.svelte';
  import Villager from './Villager.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import LeafCoin from './LeafCoin.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { fruitArt } from '#lib/client/assets.ts';
  import { setLanguage, setVillagerName, setVillager, setVisibility } from '#lib/client/actions.ts';
  import { ROSTER, ROSTER_IDS, resolveLook } from '#lib/villagers/roster.ts';
  import { t, i18n, formatSyncTime } from '#lib/i18n/index.ts';

  type AppId = 'help' | 'villager' | 'lang' | 'bell' | 'sync' | 'share';
  let { open = $bindable() }: { open: boolean } = $props();

  // `tile`: a full official NookPhone tile. Otherwise `glyph` (official) sits on our `fill`.
  const APPS: { id: AppId; tile?: string; glyph?: string; fill?: string }[] = [
    { id: 'help', glyph: 'phone/glyph-help', fill: 'var(--app-help)' },
    { id: 'villager', tile: 'phone/passport' },
    { id: 'lang', glyph: 'phone/glyph-chat', fill: 'var(--app-lang)' },
    { id: 'bell', glyph: 'phone/glyph-resident', fill: 'var(--app-bell)' },
    { id: 'sync', tile: 'phone/rescue' },
    { id: 'share', glyph: 'phone/glyph-friends', fill: 'var(--app-share)' }
  ];
  /** Raw numbers that can be shared. Eating answers are never shared. */
  const SHAREABLE: FruitKey[] = ['peach', 'coconut', 'apple'];

  let app = $state<AppId | null>(null);
  let clock = $state('');
  let name = $state('');

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  /** My current roster villager (prefs `villager`, else the per-person default). */
  const current = $derived(me && view ? resolveLook({ villager: me.villager, person: view.me }).id : null);
  const title = $derived(app ? t(`phone.app.${app}`) : t('phone.name'));
  const vName = (id: string) => (i18n.locale === 'ja' ? ROSTER[id as keyof typeof ROSTER].nameJa : ROSTER[id as keyof typeof ROSTER].nameEn);

  function tick() {
    clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  }

  onMount(() => {
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  });

  /** U15: もどる puts focus back on the app tile it came from. */
  async function back() {
    const from = app;
    app = null;
    await nextTick();
    document.querySelector<HTMLElement>(`.app[data-app="${from}"]`)?.focus();
  }

  $effect(() => {
    if (open) {
      tick();
      if (me) name = me.villagerName;
    } else app = null;
  });

  function saveName() {
    if (me && name.trim() && name.trim() !== me.villagerName) setVillagerName(name);
  }
</script>

<Sheet bind:open label={t('phone.name')} variant="phone">
  <div class="status" aria-hidden="true">
    <span class="money">{clock}</span>
    <LeafCoin kind="leaf" size={16} />
    <span></span>
  </div>

  <div class="titlebar">
    {#if app}
      <button type="button" class="back icon-btn" aria-label={t('common.back')} onclick={back}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    {/if}
    <h2>{title}</h2>
    <!-- U12: a visible 44px close on the phone, not only the grabber -->
    <button type="button" class="close icon-btn" aria-label={t('common.close')} onclick={() => (open = false)}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" /></svg>
    </button>
  </div>

  {#if !app}
    <div class="grid">
      {#each APPS as a, i (a.id)}
        <button type="button" class="app" data-app={a.id} style:animation-delay="{i * 40}ms" onclick={() => (app = a.id)}>
          <span class="tile" class:full={!!a.tile} style:--fill={a.fill ?? 'var(--c-sky)'}>
            <OfficialArt key={a.tile ?? a.glyph} size={a.tile ? '100%' : '69%'} eager>
              {#snippet fallback()}<span class="fb"></span>{/snippet}
            </OfficialArt>
          </span>
          <span class="lbl">{t(`phone.app.${a.id}`)}</span>
        </button>
      {/each}
    </div>
    <span class="mark" aria-hidden="true"><LeafCoin kind="leaf" size={96} /></span>
  {:else}
    <div class="page">
      {#if app === 'help' && view}
        <ul class="howto">
          <li class="miles" style:--card="var(--card-lime)">
            <span class="hi"><Avatar person={view.me} villager={me?.villager} size={44} /></span>{t('help.row.checkin')}
          </li>
          <li class="miles" style:--card="var(--card-butter)">
            <span class="hi"><OfficialArt key={fruitArt('peach')} size={36} /></span>{t('help.row.fruit')}
          </li>
          <li class="miles" style:--card="var(--card-pink)">
            <span class="hi"><Avatar person={view.partner} villager={view.people[view.partner].villager} size={44} /></span>{t('help.row.partner')}
          </li>
          <li class="miles" style:--card="var(--card-lilac)">
            <span class="hi"><OfficialArt key="money/bells" size={36} /></span>{t('help.row.harvest')}
          </li>
        </ul>
      {:else if app === 'villager' && view && me && current}
        <div class="preview">
          {#key current}
            <span class="pv">
              <Villager person={view.me} villager={current} size={88} head={false} expression="cheer" eager />
              <span class="vn">{vName(current)}</span>
            </span>
          {/key}
          <label class="namefield">
            <span>{t('phone.name.label')}</span>
            <input class="name" type="text" maxlength="12" bind:value={name} onblur={saveName}
              onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
          </label>
        </div>
        <div class="roster" role="radiogroup" aria-label={t('phone.app.villager')}>
          {#each ROSTER_IDS as id (id)}
            <button type="button" class="rv" role="radio" aria-checked={current === id} aria-label={vName(id)} onclick={() => setVillager(id)}>
              <Avatar person={view.me} villager={id} size={64} />
              {#if current === id}<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
            </button>
          {/each}
        </div>
      {:else if app === 'lang'}
        <div class="rows" role="radiogroup" aria-label={t('phone.app.lang')}>
          {#each [{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }] as l (l.id)}
            <button type="button" class="row" role="radio" lang={l.id} aria-checked={i18n.locale === l.id} onclick={() => setLanguage(l.id as 'ja' | 'en')}>
              <span class="rl">{l.label}</span><span class="radio" aria-hidden="true"></span>
            </button>
          {/each}
        </div>
      {:else if app === 'bell'}
        <!-- No web push (ADR 0015): reminders are iOS Shortcuts automations. -->
        <div class="rows">
          <div class="row static">
            <span class="ri"><svg viewBox="0 0 48 48" aria-hidden="true"><use href="#i-bowl" /></svg></span>
            <span class="rl">{t('island.checkin')}</span><span class="money when">20:00</span>
          </div>
          <div class="row static">
            <span class="ri"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-jar" /></svg></span>
            <span class="rl">{t('harvest.title')}</span><span class="money when">{t('weekday.7')} 19:30</span>
          </div>
          <p class="cap">{t('phone.remindHow')}</p>
        </div>
      {:else if app === 'sync' && view}
        <div class="rows">
          {#each [view.people[view.me], view.people[view.partner]] as p (p.person)}
            <div class="row static">
              <Avatar person={p.person} villager={p.villager} size={40} />
              <span class="rl">{p.villagerName}</span>
              <span class="money when">{formatSyncTime(p.lastSyncAt, view.today)}</span>
            </div>
          {/each}
          <button type="button" class="btn sky" disabled={week.syncing} onclick={() => week.refresh()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-sync" /></svg>{week.syncing ? t('sync.syncing') : t('phone.syncNow')}
          </button>
        </div>
      {:else if app === 'share' && view}
        <div class="rows">
          <p class="cap">{t('help.share')}</p>
          {#each SHAREABLE as m (m)}
            {@const on = view.visibility?.[m] ?? false}
            <button type="button" class="row" role="switch" aria-checked={on} onclick={() => setVisibility(m, !on)}>
              <OfficialArt key={fruitArt(m)} size={32} />
              <span class="rl">{t('share.' + m)}</span>
              <span class="switch" aria-hidden="true"></span>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</Sheet>

<style>
  .status {
    display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; margin: -4px 4px 4px;
    font: 600 15px/1 var(--font-num); color: var(--text);
  }
  .titlebar { position: relative; display: flex; justify-content: center; align-items: center; min-height: 48px; margin-bottom: 14px; }
  .titlebar h2 { font-size: var(--fs-h2); font-weight: 900; text-align: center; }
  .back { position: absolute; left: 0; top: 2px; }
  .back svg { width: 22px; height: 22px; }
  .close { position: absolute; right: 0; top: 2px; }
  .close svg { width: 20px; height: 20px; }
  .titlebar h2 { padding: 0 48px; }

  .grid {
    display: grid; grid-template-columns: repeat(3, minmax(var(--tile), 1fr)); justify-items: center;
    gap: calc(var(--tile-gap) + 4px) var(--tile-gap); padding: 10px 0 18px;
  }
  .app {
    appearance: none; background: none; border: 0; padding: 0; cursor: pointer; display: grid; justify-items: center; gap: 8px;
    min-width: var(--tile); animation: if-pop var(--dur-pop) var(--ease-bounce) both; border-radius: 18px; color: var(--text);
  }
  .tile {
    width: var(--tile); height: var(--tile); border-radius: var(--r-squircle); background: var(--fill); display: grid; place-items: center; overflow: hidden;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--fill) 85%, #000 15%), inset 0 2px 0 rgba(255, 255, 255, .45);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  /* Official full tiles bring their own squircle and colour. */
  .tile.full { background: none; box-shadow: none; filter: drop-shadow(0 4px 0 rgba(74, 58, 44, .2)); }
  .fb { width: 50%; height: 50%; border-radius: 30%; background: rgba(255, 255, 255, .6); }
  .app:active .tile { transform: translateY(2px) scale(1.08, .9); transition-duration: var(--dur-tap); }
  .lbl { font: 700 12px/1.1 var(--font-ui); white-space: nowrap; }
  /* NookPhone home screen: the leaf, faint, low on the empty screen. */
  .mark { display: flex; justify-content: center; margin-top: max(24px, 12dvh); opacity: .14; filter: grayscale(.2); }

  .page { display: grid; gap: 14px; animation: slide var(--dur-base) var(--ease-soft); }
  @keyframes slide { from { opacity: 0; transform: translateX(40%); } to { opacity: 1; transform: none; } }

  .howto { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
  .howto li { display: flex; align-items: center; gap: 14px; min-height: 64px; padding: 8px 14px; font-weight: 700; font-size: var(--fs-body-lg); line-height: 1.3; }
  .hi { width: 44px; display: grid; place-items: center; flex: none; }

  .preview { display: flex; align-items: flex-end; gap: 14px; }
  .vn { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .pv { width: 88px; display: grid; gap: 4px; justify-items: center; flex: none; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .namefield { flex: 1; min-width: 0; display: grid; gap: 6px; padding-bottom: 20px; }
  .namefield span { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .name {
    width: 100%; min-height: 52px; border-radius: var(--r-sm); border: var(--bw) solid var(--edge);
    background: var(--c-bubble); color: var(--c-ink); padding: 0 14px; font-weight: 700; box-shadow: var(--sh-inset);
  }
  .roster { display: grid; grid-template-columns: repeat(5, 64px); justify-content: space-between; row-gap: 12px; padding: 4px 4px 8px; }
  @media (max-width: 374px) {
    .roster { grid-template-columns: repeat(4, 56px); }
    .rv :global(.av) { --s: 56px !important; }
  }
  .rv {
    appearance: none; cursor: pointer; border: 0; padding: 0; background: none; border-radius: var(--r-blob); position: relative;
    box-shadow: 0 0 0 3px transparent; transition: transform var(--dur-base) var(--ease-bounce), box-shadow var(--dur-quick);
  }
  .rv:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .rv[aria-checked='true'] { box-shadow: 0 0 0 3px var(--c-leaf), 0 3px 0 3px var(--c-leaf-lip); }
  .ck {
    position: absolute; right: -4px; bottom: -4px; width: 20px; height: 20px; padding: 3px; border-radius: 50%;
    background: var(--c-leaf); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-leaf-lip);
  }

  .rows { display: grid; gap: 10px; }
  .row {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px;
    border-radius: var(--r-card); border: var(--bw) solid var(--edge); background: var(--surface); color: var(--text);
    box-shadow: var(--sh-lip); text-align: left; width: 100%; font: inherit;
  }
  .row:not(.static):active { transform: translateY(2px); box-shadow: var(--sh-lip-pressed); }
  .row.static { cursor: default; }
  .ri { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: var(--r-squircle); background: var(--app-bell); color: var(--c-ink); }
  .ri svg { width: 28px; height: 28px; }
  .rl { flex: 1; min-width: 0; font-weight: 700; font-size: var(--fs-body-lg); word-break: auto-phrase; text-wrap: balance; line-height: 1.3; }
  .when { font-size: 1rem; color: var(--text-soft); white-space: nowrap; }
  .radio { width: 26px; height: 26px; border-radius: 50%; border: 3px solid var(--edge); flex: none; }
  .row[aria-checked='true'] .radio { border-color: var(--c-leaf-lip); background: radial-gradient(circle, var(--c-leaf) 0 6px, transparent 7px); }
  .cap { margin: 0 4px; font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); text-align: center; text-wrap: balance; }
</style>
