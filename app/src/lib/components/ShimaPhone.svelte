<script lang="ts">
  // しまフォン launcher (style guide v3 §B.6): a phone-shaped sheet with a status row, a title and a
  // 3-column grid of app tiles: official NookPhone icons where their meaning fits (help, villager),
  // our own flat squircle tiles in the same style for the rest (U10). Each app opens in-phone with a ‹ back.
  // Settings live here: help, villager, language, reminders (a Shortcuts hint), sync, sharing.
  import { onMount } from 'svelte';
  import type { FruitKey } from '#lib/types.ts';
  import Sheet from './Sheet.svelte';
  import Bubble from './Bubble.svelte';
  import Avatar from './Avatar.svelte';
  import Villager from './Villager.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import LeafCoin from './LeafCoin.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import { theme } from '#lib/client/theme.svelte.ts';
  import { fruitArt, phoneArt } from '#lib/client/assets.ts';
  import { setLanguage, setVillagerName, setVillager, setVisibility } from '#lib/client/actions.ts';
  import { ROSTER, ROSTER_IDS, resolveLook } from '#lib/villagers/roster.ts';
  import { t, i18n, formatSyncTime } from '#lib/i18n/index.ts';

  type AppId = 'help' | 'villager' | 'lang' | 'bell' | 'sync' | 'share';
  let { open = $bindable(), topic }: { open: boolean; topic: 'island' | 'jar' } = $props();

  // Official icon via phoneArt() when there is one; `glyph` = our tile glyph otherwise (or if the art is missing).
  const APPS: { id: AppId; glyph: string; fill: string }[] = [
    { id: 'help', glyph: 'app-help', fill: 'var(--app-help)' },
    { id: 'villager', glyph: 'app-villager', fill: 'var(--app-villager)' },
    { id: 'lang', glyph: 'app-lang', fill: 'var(--app-lang)' },
    { id: 'bell', glyph: 'app-bell', fill: 'var(--app-bell)' },
    { id: 'sync', glyph: 'app-sync', fill: 'var(--app-sync)' },
    { id: 'share', glyph: 'app-lock', fill: 'var(--app-share)' }
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
    <LeafCoin kind="leaf" size={18} />
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
      <button type="button" class="back" aria-label={t('common.back')} onclick={() => (app = null)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </button>
    {/if}
    <h2>{title}</h2>
  </div>

  {#if !app}
    <div class="grid">
      {#each APPS as a, i (a.id)}
        {@const key = phoneArt(a.id)}
        <button type="button" class="app" style:animation-delay="{i * 40}ms" onclick={() => (app = a.id)}>
          <span class="tile" class:bare={!!key} style:--fill={a.fill}>
            <OfficialArt {key} size={64} eager>
              {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{a.glyph}" /></svg>{/snippet}
            </OfficialArt>
          </span>
          <span class="lbl">{t(`phone.app.${a.id}`)}</span>
        </button>
      {/each}
    </div>
  {:else if app === 'help'}
    <div class="panel">
      <Bubble text={t(`help.${topic}`)} host="stand" />
    </div>
  {:else if app === 'villager' && view && me && current}
    <div class="panel">
      <div class="preview">
        {#key current}
          <span class="pv">
            <Villager person={view.me} villager={current} size={96} head={false} expression="cheer" emote eager />
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
            <Avatar person={view.me} villager={id} size={52} />
            {#if current === id}<svg class="ck" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{/if}
          </button>
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
      <span class="tile big" style:--fill="var(--app-bell)"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#app-bell" /></svg></span>
      <!-- No web push (ADR 0015): reminders are iOS Shortcuts automations. -->
      <p class="state">{t('phone.pushHint')}</p>
    </div>
  {:else if app === 'sync' && view}
    <div class="panel rows">
      {#each [view.people[view.me], view.people[view.partner]] as p (p.person)}
        <div class="row static">
          <Avatar person={p.person} villager={p.villager} size={40} />
          <span class="rl">{p.villagerName}</span>
          <span class="money when">{formatSyncTime(p.lastSyncAt, view.today)}</span>
        </div>
      {/each}
      <button type="button" class="btn paper" disabled={week.syncing} onclick={() => week.refresh()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-sync" /></svg>{week.syncing ? t('sync.syncing') : t('phone.syncNow')}
      </button>
    </div>
  {:else if app === 'share' && view}
    <div class="panel rows">
      <p class="cap">{t('help.share')}</p>
      {#each SHAREABLE as m (m)}
        {@const on = view.visibility?.[m] ?? false}
        <button type="button" class="row" role="switch" aria-checked={on} onclick={() => setVisibility(m, !on)}>
          <OfficialArt key={fruitArt(m)} size={32}>
            {#snippet fallback()}<svg class="fruit" viewBox="0 0 24 24" aria-hidden="true"><use href="#f-{m}" /></svg>{/snippet}
          </OfficialArt>
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
    font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft);
  }
  .status .money { font-size: .95rem; }
  .season { width: 18px; height: 18px; }
  .titlebar { position: relative; display: flex; justify-content: center; align-items: center; min-height: 48px; margin-bottom: 14px; }
  .titlebar h2 { font-size: var(--fs-h2); font-weight: 700; text-align: center; }
  .back {
    position: absolute; left: 0; top: 2px; width: 44px; height: 44px; border-radius: 50%; border: var(--bw) solid var(--edge); cursor: pointer;
    background: var(--surface); box-shadow: 0 3px 0 var(--lip); color: var(--text); display: grid; place-items: center; padding: 0;
  }
  .back svg { width: 22px; height: 22px; }
  .back:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--lip); }
  .grid { display: grid; grid-template-columns: repeat(3, 72px); justify-content: center; gap: 20px 30px; padding: 8px 0 18px; }
  .app {
    appearance: none; background: none; border: 0; padding: 0; cursor: pointer; display: grid; justify-items: center; gap: 8px;
    animation: if-pop var(--dur-pop) var(--ease-bounce) both; border-radius: 18px;
  }
  /* Flat squircle like the official NookPhone icons (which fill it edge to edge and cover our fill). */
  .tile {
    width: 64px; height: 64px; border-radius: 30%; background: var(--fill); display: grid; place-items: center; overflow: hidden;
    filter: drop-shadow(0 4px 0 rgba(74, 58, 44, .22));
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .tile.bare { background: none; }
  .tile.big { width: 80px; height: 80px; }
  .tile.big svg { width: 44px; height: 44px; }
  .app:active .tile { transform: translateY(3px) scale(1.06, .9); transition-duration: var(--dur-tap); }
  .tile svg { width: 36px; height: 36px; color: var(--c-ink); }
  .lbl { font: 700 var(--fs-caption)/1.1 var(--font-ui); color: var(--text); white-space: nowrap; }

  .panel { display: grid; gap: 14px; animation: rise var(--dur-base) var(--ease-soft); }
  @keyframes rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .preview { display: flex; align-items: flex-end; gap: 14px; }
  .vn { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .pv { width: 96px; display: grid; gap: 4px; justify-items: center; flex: none; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .namefield { flex: 1; min-width: 0; display: grid; gap: 6px; padding-bottom: 6px; }
  .namefield span { font-size: var(--fs-caption); font-weight: 700; color: var(--text-soft); }
  .name {
    width: 100%; min-height: 52px; border-radius: var(--r-sm); border: var(--bw) solid var(--edge);
    background: var(--surface); color: var(--text); padding: 0 14px; font-weight: 700; box-shadow: var(--sh-inset);
  }
  .roster { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; justify-items: center; max-height: 40dvh; overflow: auto; padding: 4px 2px 8px; }
  .rv {
    appearance: none; cursor: pointer; border: 0; padding: 0; background: none; border-radius: var(--r-blob); position: relative;
    box-shadow: 0 0 0 3px transparent; transition: transform var(--dur-base) var(--ease-bounce), box-shadow var(--dur-quick);
  }
  .rv:active { transform: scale(1.06, .92); transition-duration: var(--dur-tap); }
  .rv[aria-checked='true'] { box-shadow: 0 0 0 3px var(--c-leaf), 0 3px 0 3px var(--c-leaf-lip); }
  .ck {
    position: absolute; right: -4px; bottom: -4px; width: 22px; height: 22px; padding: 3px; border-radius: 50%;
    background: var(--c-leaf); color: var(--c-ink); box-shadow: 0 2px 0 var(--c-leaf-lip);
  }

  .rows { gap: 10px; }
  .row {
    appearance: none; cursor: pointer; display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px;
    border-radius: var(--r-card); border: var(--bw) solid var(--edge); background: var(--surface); color: var(--text);
    box-shadow: var(--sh-lip); text-align: left; width: 100%;
  }
  .row:not(.static):active { transform: translateY(2px); }
  .row.static { cursor: default; }
  .rl { flex: 1; font-weight: 700; font-size: var(--fs-body-lg); }
  .when { font-size: 1rem; color: var(--text-soft); }
  .radio { width: 26px; height: 26px; border-radius: 50%; border: 3px solid var(--edge); flex: none; }
  .row[aria-checked='true'] .radio { border-color: var(--c-leaf-lip); background: radial-gradient(circle, var(--c-leaf) 0 6px, transparent 7px); }
  .fruit { width: 32px; height: 32px; flex: none; }
  .cap { margin: 0 4px 4px; font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); text-align: center; }
  .center { justify-items: center; text-align: center; padding-top: 8px; }
  .state { margin: 0; font-weight: 700; font-size: var(--fs-body-lg); color: var(--text-soft); }
</style>
