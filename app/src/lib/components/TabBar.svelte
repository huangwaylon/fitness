<script lang="ts">
  // しまフォン dock (style guide v3 §4.2): a floating phone slab with two half-width tabs,
  // each a squircle app tile with its label beside it.
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { routeOf } from '#lib/client/paths.ts';
  import { t } from '#lib/i18n/index.ts';

  const tabs = [
    { route: '/', href: resolve('/'), glyph: 'app-island', fill: 'var(--app-island)', key: 'tab.island' },
    { route: '/jar', href: resolve('/jar'), glyph: 'app-jar', fill: 'var(--app-jar)', key: 'tab.jar' }
  ];
  const path = $derived(routeOf(page.url.pathname));
</script>

<nav class="dock" aria-label={t('tab.label')}>
  {#each tabs as tab (tab.href)}
    {@const on = tab.route === '/' ? path === '/' : path.startsWith(tab.route)}
    <a class="tab" class:on href={tab.href} aria-current={on ? 'page' : undefined}>
      <span class="tile" style:--fill={tab.fill}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{tab.glyph}" /></svg>
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
    display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 6px; padding: 0 6px;
  }
  .tab {
    display: flex; align-items: center; justify-content: center; gap: 10px; min-height: 60px; border-radius: 24px;
    color: var(--text-soft); font: 700 var(--fs-body-lg)/1 var(--font-ui); text-decoration: none;
    user-select: none; -webkit-user-select: none; transition: background-color var(--dur-quick);
  }
  .tab:focus-visible { outline-offset: -3px; border-radius: 24px; }
  .tile {
    width: 44px; height: 44px; border-radius: var(--r-squircle); display: grid; place-items: center; flex: none;
    background: var(--fill); box-shadow: 0 3px 0 color-mix(in srgb, var(--fill) 72%, #000 28%), inset 0 2px 0 rgba(255, 255, 255, .4);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .tile svg { width: 28px; height: 28px; color: var(--c-ink); }
  .tab:active .tile { transform: translateY(2px) scale(1.08, .9); transition-duration: var(--dur-tap); }
  .tab.on { color: var(--text); background: color-mix(in srgb, var(--c-leaf-soft) 70%, transparent); }
  .tab.on .tile { transform: translateY(-3px) scale(1.06); }
  :global(:root[data-theme="night"]) .tab.on { background: rgba(246, 231, 176, .16); }
</style>
