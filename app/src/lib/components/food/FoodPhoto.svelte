<script lang="ts">
  // A food's picture enlarged (docs/design.md "Gohan" Amount): a small modal over the amount (its own <dialog>, so Esc
  // closes it, not the sheet): the picture square (min(100vw − 64, 360) px), the イメージ badge, the name large, its
  // 「これは…」 line (`desc`), and that the picture is generated. ✕, Esc and a tap outside close it; the focus goes back
  // to what opened it (FoodAmount's picture).
  import { t } from '#lib/i18n/index.ts';
  import type { Item } from '#lib/food/index.ts';
  import type { FoodImg } from '#lib/food/images.ts';
  import NavButton from '../ui/NavButton.svelte';
  import FoodThumb from './FoodThumb.svelte';

  interface Props {
    item: Item;
    img: FoodImg | null;
    /** A chain menu's picture, hotlinked (FoodThumb `src`). */
    src?: string | null;
    onclose: () => void;
  }
  let { item, img, src = null, onclose }: Props = $props();

  let dlg: HTMLDialogElement | undefined = $state();
  const size = Math.round(Math.min(window.innerWidth - 64, 360));

  $effect(() => {
    dlg?.showModal();
  });
  /** A tap outside the card (on the dialog's own backdrop area) closes it. */
  function outside(e: MouseEvent) {
    if (e.target === dlg) dlg?.close();
  }
</script>

<dialog bind:this={dlg} class="photo" data-food-photo data-sfx="back" aria-label={t('food.img.alt', { name: item.name })} onclose={onclose} onclick={outside}>
  <div class="card in">
    <span class="x"><NavButton kind="close" onclick={() => dlg?.close()} /></span>
    <div class="pic">
      <FoodThumb cat={item.cat} {size} {img} {src} alt={t('food.img.alt', { name: item.name })} />
      <span class="badge">{t('food.img.badge')}</span>
    </div>
    <h3>{item.name}</h3>
    {#if item.desc}<p data-desc>{item.desc}</p>{/if}
    <p class="credit" data-photo-credit>{t('food.img.credit')}</p>
  </div>
</dialog>

<style>
  .photo {
    border: 0; padding: 0; margin: auto; background: none; max-width: calc(100vw - 32px); max-height: calc(100dvh - 32px); overflow: visible;
  }
  .photo::backdrop { background: color-mix(in srgb, var(--c-ink) 55%, transparent); }
  :global(:root[data-tod='night']) .photo::backdrop { background: rgba(30, 36, 80, 0.8); }
  .in { position: relative; display: grid; gap: 6px; justify-items: start; padding: 16px; border-radius: 24px; background: var(--card); color: var(--text); }
  .pic { position: relative; justify-self: center; margin-bottom: 6px; }
  .badge {
    position: absolute; top: 8px; left: 8px; padding: 3px 8px; border-radius: var(--r-pill); font: 700 var(--fs-xs)/1.1 var(--font-ui);
    color: var(--c-ink); background: color-mix(in srgb, var(--c-card) 92%, transparent);
  }
  h3 { margin: 0; font-size: var(--fs-talk); font-weight: 700; overflow-wrap: anywhere; }
  p { margin: 0; font-size: var(--fs-s); font-weight: 700; line-height: 1.4; overflow-wrap: anywhere; }
  .credit { font-size: var(--fs-xs); color: var(--text-soft); }
  .x { position: absolute; top: -10px; right: -10px; z-index: 2; display: flex; }
</style>
