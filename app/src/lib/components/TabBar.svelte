<script lang="ts">
  // しまフォン dock (style guide §4.2): a floating phone slab with three squircle app tiles.
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { t } from '#lib/i18n/index.ts';

  // Builder A ships flat app-tile glyphs (#app-*); until then fall back to the line icons (#i-*).
  const tabs = [
    { href: '/', app: 'app-island', icon: 'i-island', fill: 'var(--app-island)', key: 'tab.island' },
    { href: '/jar', app: 'app-jar', icon: 'i-jar', fill: 'var(--app-jar)', key: 'tab.jar' },
    { href: '/us', app: 'app-us', icon: 'i-us', fill: 'var(--app-us)', key: 'tab.us' }
  ];
  let hasApp = $state(false);
  onMount(() => (hasApp = !!document.getElementById('app-island')));
  const path = $derived(page.url.pathname);
</script>

<nav class="dock" aria-label={t('tab.label')}>
  {#each tabs as tab (tab.href)}
    {@const on = tab.href === '/' ? path === '/' : path.startsWith(tab.href)}
    <a class="tab" class:on href={tab.href} aria-current={on ? 'page' : undefined}>
      <span class="tile" style:--fill={tab.fill}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{hasApp ? tab.app : tab.icon}" /></svg>
      </span>
      <span class="lbl">{t(tab.key)}</span>
    </a>
  {/each}
</nav>

<style>
  .dock {
    position: fixed; z-index: 40; left: 0; right: 0; margin: 0 auto; width: calc(min(100vw, var(--col)) - 24px);
    bottom: calc(var(--safe-bottom) + 8px); height: var(--tabbar-h);
    background: var(--phone-bg); border: var(--bw) solid var(--phone-edge); border-radius: 30px;
    box-shadow: var(--sh-float), inset 0 2px 0 rgba(255, 255, 255, .45);
    display: grid; grid-template-columns: repeat(3, 1fr); align-items: center; padding: 0 6px;
  }
  .tab {
    display: flex; flex-direction: column; align-items: center; gap: 3px; min-height: 64px; justify-content: center;
    color: var(--text-faint); font: 700 var(--fs-micro)/1 var(--font-ui); text-decoration: none; position: relative;
    user-select: none; -webkit-user-select: none;
  }
  .tile {
    width: 44px; height: 44px; border-radius: var(--r-squircle); display: grid; place-items: center;
    background: var(--fill); box-shadow: 0 3px 0 color-mix(in srgb, var(--fill) 72%, #000 28%), inset 0 2px 0 rgba(255, 255, 255, .4);
    transition: transform var(--dur-base) var(--ease-bounce); filter: saturate(.7);
  }
  .tile svg { width: 26px; height: 26px; color: var(--c-ink); }
  .tab:active .tile { transform: translateY(2px) scale(1.08, .9); transition-duration: var(--dur-tap); }
  .tab.on { color: var(--text); }
  .tab.on .tile { transform: translateY(-6px) scale(1.08); filter: none; }
  .tab.on .lbl { transform: translateY(-4px); }
  .tab.on .lbl::after {
    content: ''; display: block; width: 5px; height: 5px; margin: 3px auto 0; border-radius: 50%; background: currentColor;
  }
  .lbl { transition: transform var(--dur-base) var(--ease-bounce); }
</style>
