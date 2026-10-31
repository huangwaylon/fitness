<script lang="ts">
  // NookPhone-style notification banner (a floating layer, so it alone gets --sh-float; cream at every time of day). Lives in the top layer (popover).
  // ToastHost renders it inside the open sheet's <dialog> when there is one: a popover outside a modal dialog is
  // inert. Slides down below the status row, holds (the store decides how long), slides up: the store
  // sets `leaving` for the slide-out and then drops it, so it never depends on a Svelte outro.
  // Left: a 36px icon on a pebble (partner's villager for partner events, しずえ for system ones). Right: one official reaction icon. Tap or swipe up to dismiss.
  import type { PersonId } from '#lib/types.ts';
  import Host from '../characters/Host.svelte';
  import Villager from '../characters/Villager.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    text: string;
    /** A partner event: show that person's villager icon. */
    person?: PersonId;
    /** Official reaction icon on the right (`reactions/<id>`). */
    reaction?: string;
    /** A button on the banner (e.g. 取り消す); replaces the reaction icon. */
    action?: { label: string; run: () => void };
    /** Hover / touch / focus on the banner holds it; leaving lets it time out again (WCAG 2.2.1). */
    onhold?: (on: boolean) => void;
    /** The person dismissed it (tap or swipe). */
    ondismiss?: () => void;
    /** Sliding out (the store drops it right after). */
    leaving?: boolean;
  }
  let { text, person, reaction, action, onhold, ondismiss, leaving = false }: Props = $props();

  let gone = $state(false);
  let startY = 0;

  function topLayer(node: HTMLElement) {
    try {
      node.showPopover?.();
    } catch {
      /* no popover support: stays a fixed element */
    }
    return {
      destroy() {
        try {
          if (node.matches(':popover-open')) node.hidePopover();
        } catch {
          /* already gone */
        }
      }
    };
  }

  let el: HTMLElement | undefined = $state();
  function dismiss() {
    // Focus was on the banner (取り消す): keep it inside the sheet it lives in, not on <body>.
    if (el?.contains(document.activeElement)) el.closest('dialog')?.focus();
    gone = true;
    ondismiss?.();
  }
  const hold = (on: boolean) => () => onhold?.(on);
  /** Focus leaving the banner altogether (not moving between its two buttons). */
  function blur(e: FocusEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) onhold?.(false);
  }
</script>

{#if !gone}
  <div bind:this={el} class="banner" class:undo={!!action} class:leaving role="status" popover="manual" use:topLayer
    onpointerenter={hold(true)} onpointerleave={hold(false)} onfocusin={hold(true)} onfocusout={blur}>
    <!-- With an undo, a tap only holds the banner (so it can be read and undone); a vertical swipe scrolls the page. Then
         this layer is pointer-only (no "close" that does nothing for a screen reader or the keyboard): 取り消す is the
         one control, and the banner ends by itself. -->
    <button type="button" class="hit" data-sfx={action ? 'none' : 'back'} aria-label={action ? undefined : t('common.close')} aria-hidden={action ? true : undefined}
      tabindex={action ? -1 : undefined} onclick={() => !action && dismiss()}
      onpointerdown={(e) => (startY = e.clientY)} onpointermove={(e) => (action ? e.clientY - startY > 12 : e.clientY - startY < -12) && dismiss()}></button>
    <span class="pebble" aria-hidden="true">
      {#if person}<Villager {person} size={36} head animate={false} eager />
      {:else}<Host head size={36} animate={false} eager />{/if}
    </span>
    <span class="txt">{text}</span>
    {#if action}<button type="button" class="act" data-sfx="undo" onclick={() => { action.run(); dismiss(); }}>{action.label}</button>
    {:else if reaction}<span class="re" aria-hidden="true"><OfficialArt key="reactions/{reaction}" size={28} eager /></span>{/if}
  </div>
{/if}

<style>
  .banner {
    position: fixed; inset: auto 0; margin: 0 auto; z-index: var(--z-toast); overflow: hidden;
    top: calc(var(--safe-top) + 56px); height: 52px; width: min(100% - 24px, 420px);
    display: flex; align-items: center; gap: 10px; padding: 0 12px 0 6px; border-radius: var(--r-pill);
    background: var(--c-card); color: var(--c-ink); border: 0; box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    font: 700 var(--fs-body)/1.2 var(--font-ui);
    animation: in 320ms var(--ease-bounce) both;
  }
  .banner:popover-open { inset: auto 0; top: calc(var(--safe-top) + 56px); }
  /* 島: below today's ベル ribbon, so a banner never covers the focal point. */
  :global(:root:has(.island)) .banner:not(.undo) { top: calc(var(--safe-top) + 76px); }
  /* the sync chip sits under the ribbon (Hud.svelte), so the banner goes under it */
  :global(:root:has(.island .chip)) .banner:not(.undo) { top: calc(var(--safe-top) + 120px); }
  .hit { position: absolute; inset: 0; z-index: 1; appearance: none; border: 0; padding: 0; background: none; cursor: pointer; touch-action: none; border-radius: inherit; }
  /* The undo banner sits over the scrolling ごほうび page and the phone: a vertical swipe that starts on it scrolls
     what is under it. It ends by itself; the swipe-down dismiss stays best effort. */
  .undo .hit { touch-action: pan-y; }
  .pebble {
    width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
    background: color-mix(in srgb, var(--c-yuzu) 40%, var(--c-cream));
  }
  .txt { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* An undo banner: low, in the thumb zone, so it never covers the Jar's total; its text (what was done:
     「アイス 1,000 ベル つかいました！」) may take two lines next to the button. */
  .banner.undo, .banner.undo:popover-open { top: auto; bottom: calc(var(--pad-bottom) + 16px); height: 56px; animation-name: up-in; }
  .undo .txt { white-space: normal; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; font-size: var(--fs-s); line-height: 1.25; }
  @keyframes up-in { from { transform: translateY(120%); opacity: 0; } to { transform: none; opacity: 1; } }
  .re { flex: none; line-height: 0; }
  /* Undo: above the dismiss layer, a 44px-tall button on the right. */
  .act {
    position: relative; z-index: 2; flex: none; appearance: none; cursor: pointer; min-height: 44px; margin-right: -6px; padding: 0 14px;
    border-radius: var(--r-pill); border: 0; background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge);
    font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .act:focus-visible { outline: 3px solid var(--c-ink); outline-offset: 2px; }
  .banner.leaving { pointer-events: none; animation: out 220ms var(--ease-soft) both; }
  .banner.undo.leaving { animation-name: down-out; }
  @keyframes out { to { transform: translateY(-120%); opacity: 0; } }
  @keyframes down-out { to { transform: translateY(120%); opacity: 0; } }
  @keyframes in { from { transform: translateY(-120%); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .banner { animation: fade 120ms both; }
    .banner.leaving, .banner.undo.leaving { animation: fade-out 120ms both; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes fade-out { to { opacity: 0; } }
  }
</style>
