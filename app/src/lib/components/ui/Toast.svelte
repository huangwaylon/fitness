<script lang="ts">
  // NH-style notification banner (a floating layer, so it alone gets --sh-float; cream at every time of day). Lives in the top layer (popover).
  // ToastHost renders it inside the open sheet's <dialog> when there is one: a popover outside a modal dialog is
  // inert. Slides down below the status row, holds (the store decides how long), slides up: the store
  // sets `leaving` for the slide-out and then drops it, so it never depends on a Svelte outro.
  // Left: a 36px icon on a pebble (partner's villager for partner events, a visitor's head for their words, しずえ for system ones). Right: one official reaction icon. Tap or swipe up to dismiss.
  import type { Who } from '#lib/types.ts';
  import Host from '../characters/Host.svelte';
  import Villager from '../characters/Villager.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import { lookOf } from '#lib/store/look.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';
  import Phrases from './Phrases.svelte';
  import NavButton from './NavButton.svelte';
  import { staticUrl } from '#lib/staticUrl.ts';

  /** What the snackbar stands over (`over`): mark a control docked at the screen's foot `data-toast-floor`. */
  const FLOOR = '.level-acts, [data-toast-floor]';

  interface Props {
    text: string;
    /** A partner event: show that person's villager icon. */
    person?: Who;
    /** A special character's words or gift: their head icon's file id (visitorRoles npcIcon). */
    npc?: string;
    /** Official reaction icon on the right (`reactions/<id>`). */
    reaction?: string;
    /** A button on the banner (e.g. 取り消す); replaces the reaction icon. */
    action?: { label: string; run: () => void; sfx?: string };
    /** A lasting banner (英語すごろく's invitation): high, no timeout, no tap-to-dismiss; it goes by its action or its ✕. */
    onclose?: () => void;
    /** Under a toast shown in the same slot. */
    below?: boolean;
    /** The snackbar, as an undo's, with no button (a popup's confirmation, kept off the level under the title bar). */
    low?: boolean;
    /** Hover / touch / focus on the banner holds it; leaving lets it time out again (WCAG 2.2.1). */
    onhold?: (on: boolean) => void;
    /** The person dismissed it (tap or swipe). */
    ondismiss?: () => void;
    /** Sliding out (the store drops it right after). */
    leaving?: boolean;
  }
  let { text, person, npc, reaction, action, onclose, below = false, low = false, onhold, ondismiss, leaving = false, ...rest }: Props & Record<`data-${string}`, unknown> = $props();
  /** The snackbar (an undo, a retry, a low confirmation): small, at the bottom over the floor; else the notice, high. */
  const snack = $derived((!!action || low) && !onclose);
  const face = $derived(snack ? 24 : 36);

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
  /** The snackbar's one place: bottom centre, 8 px over the floor, the highest of what is docked at the foot of the
   *  screen it shows on (FLOOR: a sheet level's actions, theme.css .level-acts, wherever a short level holds them; the
   *  island's say button, catch plates and partner face; the shop's bars and card). Its own sheet's when it's in one
   *  (ToastHost), else the page's. Measured while it shows: plates come and go under it (it glides, `bottom`'s transition). */
  let over = $state<number | null>(null);
  $effect(() => {
    if (!snack || !el) return;
    const scope: ParentNode = el.closest('dialog') ?? document;
    const place = () => {
      let top = innerHeight;
      for (const f of scope.querySelectorAll(FLOOR)) {
        if (scope === document && f.closest('dialog')) continue;
        const r = f.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && r.top > 0 && r.top < top) top = r.top;
      }
      over = top >= innerHeight ? null : innerHeight - top + 8;
    };
    place();
    const f = requestAnimationFrame(place); // the level under it may be rendered in the same update
    const tick = setInterval(place, 150);
    return () => { cancelAnimationFrame(f); clearInterval(tick); };
  });
  const hold = (on: boolean) => () => onhold?.(on);
  /** Focus leaving the banner altogether (not moving between its two buttons). */
  function blur(e: FocusEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node | null)) onhold?.(false);
  }
</script>

{#if !gone}
  <div bind:this={el} class="banner" class:snack class:lasting={!!onclose} class:below class:leaving style:bottom={over === null ? undefined : `max(var(--snack-bottom), ${over}px)`} role="status" popover="manual" use:topLayer
    onpointerenter={hold(true)} onpointerleave={hold(false)} onfocusin={hold(true)} onfocusout={blur} {...rest}>
    <!-- With a button, a tap only holds the banner (so it can be read and undone: a near miss on 取り消す never sends it);
         a swipe down (toward where the snackbar sits) ends it. A swipe: a move while pressed, never a mouse passing
         over a banner that slid in under it. Then this layer is pointer-only (no "close" that does nothing for a screen
         reader or the keyboard): 取り消す is the one control, and the banner ends by itself. -->
    {#if !onclose}<button type="button" class="hit" data-sfx={action ? 'none' : 'back'} aria-label={action ? undefined : t('common.close')} aria-hidden={action ? true : undefined}
      tabindex={action ? -1 : undefined} onclick={() => !action && dismiss()}
      onpointerdown={(e) => (startY = e.clientY)} onpointermove={(e) => e.buttons > 0 && (snack ? e.clientY - startY > 12 : e.clientY - startY < -12) && dismiss()}></button>{/if}
    <span class="pebble" aria-hidden="true">
      {#if person && lookOf(person).kind === 'player'}<Avatar worn {person} size={face} />
      {:else if person}<Villager {person} size={face} head animate={false} eager />
      {:else if npc}<img src={staticUrl(`room/npc/${npc}.webp`)} alt="" width={face} height={face} decoding="async" />
      {:else}<Host head size={face} animate={false} eager />{/if}
    </span>
    <span class="txt"><Phrases {text} /></span>
    {#if action}<button type="button" class="{snack ? 'snack-act' : 'btn small'} act" data-sfx={action.sfx ?? 'undo'} data-toast-act onclick={() => { action.run(); dismiss(); }}>{action.label}</button>
    {:else if reaction && !snack}<span class="re" aria-hidden="true"><OfficialArt key="reactions/{reaction}" size={28} eager /></span>{/if}
    {#if onclose}<NavButton kind="close" data-toast-close onclick={() => { onclose(); dismiss(); }} />{/if}
  </div>
{/if}

<style>
  .banner {
    position: fixed; inset: auto 0; margin: 0 auto; z-index: var(--z-toast); overflow: hidden;
    top: calc(var(--ui-top) + 56px); min-height: 52px; width: min(100% - 2 * var(--side), 420px);
    display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: var(--r-pill);
    background: var(--c-card); color: var(--c-ink); border: 0; box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    font: 700 var(--fs-body)/1.2 var(--font-ui);
    animation: in 320ms var(--ease-bounce) both;
  }
  .banner:popover-open { inset: auto 0; top: calc(var(--ui-top) + 56px); }
  /* 島: below the HUD row, so a banner never covers the dumbbell, the bowl or the leaf menu. */
  :global(:root:has(.island)) .banner:not(.snack) { top: calc(var(--hud-top) + var(--hit) + var(--lip-h) + 12px); }
  /* the sync chip sits under the HUD row (Hud.svelte), so the banner goes under it */
  :global(:root:has(.island .chip)) .banner:not(.snack) { top: calc(var(--hud-top) + var(--hit) + var(--lip-h) + 56px); }
  .hit { position: absolute; inset: 0; z-index: 1; appearance: none; border: 0; padding: 0; background: none; cursor: pointer; touch-action: none; border-radius: inherit; }
  .pebble {
    width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
    background: color-mix(in srgb, var(--c-yuzu) 40%, var(--c-cream));
  }
  /* The whole message, wrapped by phrase (a long one grows the banner): at its spaces and <wbr>s only (i18n/phrases.ts),
     a number never cut */
  .txt { flex: 1; min-width: 0; }
  /* The snackbar (undo, retry, a low confirmation; docs/design.md "Banner"): one line or two of small type, a 24 px
     face, sized to its words; bottom centre, in the thumb zone by the tap it answers, over the floor (`over`). */
  .banner.snack, .banner.snack:popover-open {
    --snack-bottom: calc(var(--pad-bottom) + 12px);
    top: auto; bottom: var(--snack-bottom); width: max-content; max-width: min(100% - 2 * var(--side), 360px);
    min-height: 44px; gap: 8px; padding: 4px 4px 4px 8px; font-size: var(--fs-s); line-height: 1.25;
    box-shadow: inset 0 0 0 1.5px var(--c-lip), 0 var(--lip-s) 0 var(--c-lip), var(--sh-drop);
    animation: up-in 200ms var(--ease-soft) both; transition: bottom 200ms var(--ease-soft);
  }
  .snack:not(:has(.act)) { padding-right: 14px; }
  .snack .pebble { width: 28px; height: 28px; background: none; }
  .snack .txt { overflow-wrap: anywhere; }
  /* its button: a leaf-tinted pill, 36 tall, its hit the bar's whole 44 */
  .snack-act {
    appearance: none; border: 0; cursor: pointer; height: 36px; padding: 0 14px; border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--c-leaf) 22%, var(--c-card)); color: var(--c-leaf-text);
    box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--c-leaf) 70%, var(--c-card));
    font: 700 var(--fs-s)/1 var(--font-ui); white-space: nowrap;
  }
  .snack-act::before { content: ''; position: absolute; inset: -4px -4px -4px 0; }
  @keyframes up-in { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
  .re { flex: none; line-height: 0; }
  /* the action (取り消す, 参加): the kit's small leaf button above the dismiss layer, 44 tall, on the right */
  .act { position: relative; z-index: 2; flex: none; width: auto; min-height: 44px; margin: 0 -6px 0 0; padding: 0 14px; }
  .act.snack-act { min-height: 0; margin: 0; }
  /* a lasting banner: its ✕ after the action */
  .lasting { gap: 8px; padding-right: 4px; }
  .lasting .act { margin-right: 0; }
  .banner.below { translate: 0 68px; }
  .banner.leaving { pointer-events: none; animation: out 220ms var(--ease-soft) both; }
  .banner.snack.leaving { animation: down-out 160ms var(--ease-soft) both; }
  @keyframes out { to { transform: translateY(-120%); opacity: 0; } }
  @keyframes down-out { to { transform: translateY(8px); opacity: 0; } }
  @keyframes in { from { transform: translateY(-120%); opacity: 0; } to { transform: none; opacity: 1; } }
</style>
