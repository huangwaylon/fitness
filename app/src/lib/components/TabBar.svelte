<script lang="ts">
  // しまフォン dock (style guide v4 §T.1): a floating phone slab with two tabs, each an app tile with its
  // label beside it. 島 = the official map glyph on teal; 旅の壺 = our jar glyph on yellow.
  // Active tab: the tile lifts and a leaf pill sits behind. Sizes follow §R (72 / 60 compact / 56 tiny).
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { routeOf } from '#lib/client/paths.ts';
  import OfficialArt from './OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';

  const tabs = [
    { route: '/', href: resolve('/'), art: 'phone/glyph-map', glyph: 'app-island', fill: 'var(--app-island)', key: 'tab.island' },
    { route: '/jar', href: resolve('/jar'), art: null, glyph: 'app-jar', fill: 'var(--app-jar)', key: 'tab.jar' }
  ];
  const path = $derived(routeOf(page.url.pathname));
</script>

<nav class="dock" aria-label={t('tab.label')}>
  {#each tabs as tab (tab.href)}
    {@const on = tab.route === '/' ? path === '/' : path.startsWith(tab.route)}
    <a class="tab" class:on href={tab.href} aria-current={on ? 'page' : undefined}>
      <span class="tile" style:--fill={tab.fill}>
        <OfficialArt key={tab.art} size="78%" eager>
          {#snippet fallback()}<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{tab.glyph}" /></svg>{/snippet}
        </OfficialArt>
      </span>
      <span class="lbl">{t(tab.key)}</span>
    </a>
  {/each}
</nav>

<style>
  .dock {
    position: fixed; z-index: 40; left: 0; right: 0; margin: 0 auto;
    width: calc(min(100vw, var(--col)) - 2 * var(--side) + 8px);
    bottom: var(--dock-bottom); height: var(--dock-h);
    background: var(--phone-bg); border: var(--bw) solid var(--phone-edge); border-radius: calc(var(--dock-h) / 2.4);
    box-shadow: 0 4px 0 color-mix(in srgb, var(--phone-edge) 80%, #000 20%), var(--sh-float), inset 0 2px 0 rgba(255, 255, 255, .5);
    display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 6px; padding: 0 6px;
  }
  .tab {
    display: flex; align-items: center; justify-content: center; gap: 10px; min-height: calc(var(--dock-h) - 12px);
    border-radius: calc(var(--dock-h) / 3); color: var(--text-soft); font: 700 var(--dock-fs)/1 var(--font-ui); text-decoration: none;
    user-select: none; -webkit-user-select: none; transition: background-color var(--dur-quick);
  }
  .tab:focus-visible { outline-offset: -3px; }
  .tile {
    width: var(--dock-tile); height: var(--dock-tile); border-radius: var(--r-squircle); display: grid; place-items: center; flex: none;
    background: var(--fill); box-shadow: 0 3px 0 color-mix(in srgb, var(--fill) 75%, #000 25%), inset 0 2px 0 rgba(255, 255, 255, .45);
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .tile svg { width: 62%; height: 62%; color: var(--c-ink); }
  .tab:active .tile { transform: translateY(2px) scale(1.08, .9); transition-duration: var(--dur-tap); }
  .tab.on { color: var(--text); background: color-mix(in srgb, var(--c-leaf-soft) 80%, transparent); }
  .tab.on .tile { transform: translateY(-4px) scale(1.06); }
  :global(:root[data-theme="night"]) .tab.on { background: rgba(255, 243, 196, .18); }
</style>
