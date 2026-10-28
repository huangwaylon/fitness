<script lang="ts">
  // しまフォン launcher (style guide §4.2): a phone-shaped sheet with a status row, the focused
  // app's title and a 3-column grid of squircle apps. Each app opens its panel inside the phone.
  // Settings live here (moved out of ふたり): help, villager, language, notifications, sync, sharing.
  import { onMount } from 'svelte';
  import type { FruitKey } from '#lib/types.ts';
  import Sheet from './Sheet.svelte';
  import Villager from './Villager.svelte';
  import Juniper from './Juniper.svelte';
  import LeafCoin from './LeafCoin.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { theme } from '#lib/client/theme.svelte.ts';
  import { setLanguage, setVillagerName, setVillagerLook, setVisibility } from '#lib/client/actions.ts';
  import { pushState, enablePush, type PushState } from '#lib/client/push.ts';
  import { SPECIES, SPECIES_IDS, resolveVillager } from '#lib/villagers/species.ts';
  import { t, i18n, formatSyncTime } from '#lib/i18n/index.ts';

  type AppId = 'help' | 'villager' | 'lang' | 'bell' | 'sync' | 'share';
  interface Props {
    open: boolean;
    topic: 'island' | 'jar' | 'us';
  }
  let { open = $bindable(), topic }: Props = $props();

  // Builder A's flat app glyphs (#app-*), with line-icon fallbacks until they land.
  const APPS: { id: AppId; glyph: string; fb: string; fill: string }[] = [
    { id: 'help', glyph: 'app-help', fb: 'i-info', fill: 'var(--app-help)' },
    { id: 'villager', glyph: 'app-villager', fb: 'i-pencil', fill: 'var(--app-villager)' },
    { id: 'lang', glyph: 'app-lang', fb: 'i-globe', fill: 'var(--app-lang)' },
    { id: 'bell', glyph: 'app-bell', fb: 'i-bell', fill: 'var(--app-bell)' },
    { id: 'sync', glyph: 'app-sync', fb: 'i-sync', fill: 'var(--app-sync)' },
    { id: 'share', glyph: 'app-share', fb: 'i-eye', fill: 'var(--app-share)' }
  ];
  /** Raw numbers that can be shared. Eating answers are never shared. */
  const SHAREABLE: FruitKey[] = ['peach', 'coconut', 'apple'];

  let app = $state<AppId | null>(null);
  let has = $state<Record<string, boolean>>({});
  let clock = $state('');
  let push = $state<PushState>('off');
  let pushBusy = $state(false);
  let name = $state('');

  const view = $derived(week.view);
  const me = $derived(view ? view.people[view.me] : null);
  const look = $derived(me && view ? resolveVillager(me.villagerSpecies, me.villagerColor, view.me) : null);
  const title = $derived(app ? t(`phone.app.${app}`) : t('phone.name'));

  function tick() {
    clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date());
  }

  onMount(() => {
    for (const a of APPS) has[a.glyph] = !!document.getElementById(a.glyph);
    tick();
    const id = setInterval(tick, 20_000);
    pushState().then((s) => (push = s));
    return () => clearInterval(id);
  });

  $effect(() => {
    if (open) {
      tick();
      if (me) name = me.villagerName;
    } else app = null;
  });

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

  function pickSpecies(id: string) {
    if (!view || !me) return;
    const cw = resolveVillager(id, me.villagerColor, view.me).colourway.id;
    setVillagerLook(id, cw);
  }
</script>

<Sheet bind:open label={t('phone.name')} variant="phone">
  <div class="status" aria-hidden="true">
    <span class="money">{clock}</span>
    <LeafCoin size={18} />
    <svg class="season" viewBox="0 0 24 24">
      {#if theme.season === 'spring'}
        {#each [0, 72, 144, 216, 288] as r (r)}<ellipse cx="12" cy="7" rx="3.4" ry="4.6" fill="#FFC2D4" transform="rotate({r} 12 12)" />{/each}<circle cx="12" cy="12" r="2.4" fill="#FFD66B" />
      {:else if theme.season === 'summer'}
        <circle cx="12" cy="12" r="5" fill="#FFD66B" />{#each [0, 45, 90, 135, 180, 225, 270, 315] as r (r)}<rect x="11" y="1.5" width="2" height="4" rx="1" fill="#F5A623" transform="rotate({r} 12 12)" />{/each}
      {:else if theme.season === 'autumn'}
        <path d="M12 2c4 3 7 6 7 10a7 7 0 0 1-14 0c0-4 3-7 7-10z" fill="#E8643C" /><path d="M12 6v16" stroke="#9A4A2A" stroke-width="1.6" stroke-linecap="round" />
      {:else}
        {#each [0, 60, 120] as r (r)}<rect x="11" y="2" width="2" height="20" rx="1" fill="#8FD3F4" transform="rotate({r} 12 12)" />{/each}<circle cx="12" cy="12" r="2.6" fill="#DDF2FB" />
      {/if}
    </svg>
  </div>

  <div class="titlebar">
    {#if app}
      <button type="button" class="back" aria-label={t('common.back')} onclick={() => (app = null)}>‹</button>
    {/if}
    <h2>{title}</h2>
  </div>

  {#if !app}
    <div class="grid">
      {#each APPS as a, i (a.id)}
        <button type="button" class="app" style:--fill={a.fill} style:animation-delay="{i * 40}ms" onclick={() => (app = a.id)}>
          <span class="tile"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{has[a.glyph] ? a.glyph : a.fb}" /></svg></span>
          <span class="lbl">{t(`phone.app.${a.id}`)}</span>
        </button>
      {/each}
    </div>
  {:else if app === 'help'}
    <div class="panel help">
      <span class="juni"><Juniper size={84} /></span>
      <p class="talk">{t(`help.${topic}`)}</p>
    </div>
  {:else if app === 'villager' && view && me && look}
    <div class="panel">
      <div class="preview">
        <Villager person={view.me} species={look.species.id} colourway={look.colourway.id} size={96} expression="cheer" />
        <input class="name" type="text" maxlength="12" aria-label={t('us.name')} bind:value={name} onblur={saveName}
          onkeydown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()} enterkeyhint="done" />
      </div>
      <div class="species" role="radiogroup" aria-label={t('phone.species')}>
        {#each SPECIES_IDS as id (id)}
          <button type="button" class="sp" role="radio" aria-checked={look.species.id === id} aria-label={i18n.locale === 'ja' ? SPECIES[id].nameJa : SPECIES[id].nameEn} onclick={() => pickSpecies(id)}>
            <Villager person={view.me} species={id} size={40} head />
          </button>
        {/each}
      </div>
      <div class="colours" role="radiogroup" aria-label={t('phone.colour')}>
        {#each look.species.colourways as cw (cw.id)}
          <button type="button" class="cw" role="radio" aria-checked={look.colourway.id === cw.id} aria-label={i18n.locale === 'ja' ? cw.nameJa : cw.nameEn}
            style:--base={cw.base} style:--shade={cw.shade} onclick={() => setVillagerLook(look.species.id, cw.id)}></button>
        {/each}
      </div>
    </div>
  {:else if app === 'lang'}
    <div class="panel rows" role="radiogroup" aria-label={t('phone.app.lang')}>
      {#each [{ id: 'ja', label: '日本語' }, { id: 'en', label: 'English' }] as l (l.id)}
        <button type="button" class="row" role="radio" lang={l.id} aria-checked={i18n.locale === l.id} onclick={() => setLanguage(l.id as 'ja' | 'en')}>
          <span class="rl">{l.label}</span><span class="radio" aria-hidden="true"></span>
        </button>
      {/each}
    </div>
  {:else if app === 'bell'}
    <div class="panel center">
      <svg class="hero-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-bell" /></svg>
      {#if push === 'on'}
        <p class="state ok">✓ {t('us.pushOn')}</p>
      {:else if push === 'install' || push === 'unsupported'}
        <p class="state">{t('us.pushInstall')}</p>
      {:else if push === 'denied'}
        <p class="state">{t('us.pushDenied')}</p>
      {:else}
        <p class="state">{t('phone.pushHint')}</p>
        <button type="button" class="btn" disabled={pushBusy} onclick={turnOnPush}>{t('us.pushEnable')}</button>
      {/if}
    </div>
  {:else if app === 'sync' && view}
    <div class="panel rows">
      {#each [view.people[view.me], view.people[view.partner]] as p (p.person)}
        <div class="row static">
          <Villager person={p.person} species={p.villagerSpecies} colourway={p.villagerColor} size={36} head />
          <span class="rl">{p.villagerName}</span>
          <span class="money when">{formatSyncTime(p.lastSyncAt, view.today)}</span>
        </div>
      {/each}
      <p class="cap">{t('us.sync')} · {week.offline ? t('sync.offline', { time: week.lastSync ? formatSyncTime(week.lastSync) : '' }) : week.syncing ? t('sync.syncing') : t('sync.last', { time: week.lastSync ? formatSyncTime(week.lastSync) : '' })}</p>
      <button type="button" class="btn paper small" disabled={week.syncing} onclick={() => week.refresh()}>{t('phone.syncNow')}</button>
    </div>
  {:else if app === 'share' && view}
    <div class="panel rows">
      <p class="cap">{t('help.us')}</p>
      {#each SHAREABLE as m (m)}
        {@const on = view.visibility?.[m] ?? false}
        <button type="button" class="row" role="switch" aria-checked={on} onclick={() => setVisibility(m, !on)}>
          <svg class="fruit" viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{m}" /></svg>
          <span class="rl">{t('fruit.' + m)}</span>
          <span class="switch" aria-hidden="true"></span>
        </button>
      {/each}
    </div>
  {/if}
</Sheet>

<style>
  .status {
    display: flex; justify-content: center; align-items: center; gap: 10px; margin: -2px 0 6px;
    font-size: var(--fs-caption); font-weight: 700; color: var(--text-faint);
  }
  .status .money { font-size: .95rem; }
  .season { width: 18px; height: 18px; }
  .titlebar { position: relative; display: flex; justify-content: center; align-items: center; min-height: 48px; margin-bottom: 14px; }
  .titlebar h2 { font-size: var(--fs-h2); font-weight: 900; text-align: center; }
  .back {
    position: absolute; left: 0; top: 2px; width: 44px; height: 44px; border-radius: 50%; border: 0; cursor: pointer;
    background: var(--surface); box-shadow: 0 3px 0 var(--lip); font: 700 1.7rem/1 var(--font-num); color: var(--text-soft);
    display: grid; place-items: center; padding-bottom: 4px;
  }
  .grid { display: grid; grid-template-columns: repeat(3, 64px); justify-content: center; gap: 22px 28px; padding: 8px 0 18px; }
  .app { appearance: none; background: none; border: 0; padding: 0; cursor: pointer; display: grid; justify-items: center; gap: 7px; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .tile {
    width: 64px; height: 64px; border-radius: var(--r-squircle); background: var(--fill); display: grid; place-items: center;
    box-shadow: 0 4px 0 color-mix(in srgb, var(--fill) 72%, #000 28%), inset 0 3px 0 rgba(255, 255, 255, .35);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .app:active .tile { transform: translateY(3px) scale(1.06, .9); transition-duration: var(--dur-tap); }
  .tile svg { width: 34px; height: 34px; color: var(--c-ink); }
  .lbl { font: 700 var(--fs-caption)/1.1 var(--font-ui); color: var(--text); white-space: nowrap; }

  .panel { display: grid; gap: 14px; animation: rise var(--dur-base) var(--ease-soft); }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .help { grid-template-columns: 72px 1fr; align-items: start; }
  .juni { width: 72px; display: grid; justify-items: center; }
  .talk {
    margin: 0; background: var(--bubble); color: var(--c-ink-talk); border-radius: var(--r-bubble); padding: 16px 18px;
    font-size: var(--fs-talk); font-weight: 700; line-height: var(--lh-talk); box-shadow: 0 4px 0 var(--c-paper-2);
  }
  .preview { display: flex; align-items: center; gap: 14px; justify-content: center; }
  .name {
    flex: 1; max-width: 12em; min-height: 48px; border-radius: var(--r-sm); border: var(--bw) solid var(--edge);
    background: var(--surface); color: var(--text); padding: 0 14px; font-weight: 700; box-shadow: var(--sh-inset);
  }
  .species { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
  .sp {
    appearance: none; cursor: pointer; aspect-ratio: 1; border-radius: var(--r-squircle); border: var(--bw) solid var(--edge);
    background: var(--surface); display: grid; place-items: center; box-shadow: 0 3px 0 var(--lip); padding: 0;
  }
  .sp[aria-checked='true'] { border-color: var(--c-leaf); background: var(--c-leaf-soft); box-shadow: 0 3px 0 var(--c-leaf-lip); }
  .colours { display: flex; justify-content: center; gap: 16px; }
  .cw {
    appearance: none; cursor: pointer; width: 48px; height: 48px; border-radius: 50%; padding: 0;
    background: radial-gradient(circle at 50% 70%, var(--shade) 0 30%, var(--base) 31%);
    border: 3px solid var(--edge); box-shadow: 0 3px 0 var(--lip);
  }
  .cw[aria-checked='true'] { border-color: var(--c-ink); transform: scale(1.1); }
  :global(:root[data-theme="night"]) .cw[aria-checked='true'] { border-color: var(--c-moon); }

  .rows { gap: 8px; }
  .row {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px;
    border-radius: var(--r-card); border: var(--bw) solid var(--edge); background: var(--surface); color: var(--text);
    box-shadow: var(--sh-lip); text-align: left; width: 100%;
  }
  .row.static { cursor: default; }
  .rl { flex: 1; font-weight: 700; font-size: var(--fs-body-lg); }
  .when { font-size: 1rem; color: var(--text-soft); }
  .radio { width: 26px; height: 26px; border-radius: 50%; border: 3px solid var(--edge); flex: none; }
  .row[aria-checked='true'] .radio { border-color: var(--c-leaf-lip); background: radial-gradient(circle, var(--c-leaf) 0 6px, transparent 7px); }
  .fruit { width: 32px; height: 32px; flex: none; }
  .cap { margin: 2px 4px 4px; font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); text-align: center; }
  .rows .btn { justify-self: center; }
  .center { justify-items: center; text-align: center; padding-top: 8px; }
  .hero-ic { width: 56px; height: 56px; color: var(--text-soft); }
  .state { margin: 0; font-weight: 700; font-size: var(--fs-body-lg); color: var(--text-soft); }
  .state.ok { color: var(--c-leaf-ink); }
  :global(:root[data-theme="night"]) .state.ok { color: var(--c-leaf-soft); }
</style>
