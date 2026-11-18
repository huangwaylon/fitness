<script lang="ts">
  // 英語すごろく's invitation (invite.svelte.ts; docs/sugoroku.md "Online"): 「Xが英語すごろくを始めました」 [参加] ✕,
  // the starter's head on its pebble, staying till 参加 (straight into the game's screen) or ✕. The banner's look
  // (ui/Toast.svelte: cream, the top layer, in the open sheet's <dialog> when there is one: ToastHost places it), its
  // slot the toasts' (`below`: under a toast shown there). Kanji, a sheet's banner (docs/design.md "Copy"). Not on the
  // game's own screen (/sugoroku?m=online: the game it asks to).
  import { page } from '$app/state';
  import { routeOf } from '#lib/ui-state/paths.ts';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Villager from '#lib/components/characters/Villager.svelte';
  import { lookOf } from '#lib/store/look.ts';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { answer, invite, join } from '../invite.svelte.ts';

  let { below = false }: { below?: boolean } = $props();
  const inGame = $derived(routeOf(page.url.pathname) === '/sugoroku' && page.url.searchParams.get('m') === 'online');

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
</script>

{#if invite.cur && !inGame}
  {@const c = invite.cur}
  {#key c.g}
    <div class="invite obj-cream" class:below role="status" popover="manual" use:topLayer data-sg-invite={c.g}>
      <span class="pebble" aria-hidden="true">
        {#if lookOf(c.who).kind === 'player'}<Avatar worn person={c.who} size={36} />{:else}<Villager person={c.who} size={36} head animate={false} eager />{/if}
      </span>
      <span class="txt"><Phrases text={c.text} /></span>
      <button type="button" class="act" data-sfx="open" data-sg-invite-join onclick={join}>{c.join}</button>
      <NavButton kind="close" data-sg-invite-close onclick={() => answer(c.g)} />
    </div>
  {/key}
{/if}

<style>
  .invite {
    position: fixed; inset: auto 0; margin: 0 auto; z-index: var(--z-toast); overflow: hidden;
    top: calc(var(--ui-top) + 56px); min-height: 56px; width: min(100% - 2 * var(--side), 420px);
    display: flex; align-items: center; gap: 8px; padding: 6px 4px 6px 6px; border-radius: var(--r-pill);
    background: var(--c-card); color: var(--c-ink); border: 0; box-shadow: 0 var(--lip-h) 0 var(--c-lip), var(--sh-float);
    font: 700 var(--fs-body)/1.25 var(--font-ui);
    animation: in 320ms var(--ease-bounce) both;
  }
  .invite:popover-open { inset: auto 0; top: calc(var(--ui-top) + 56px); }
  /* 島: below the HUD row (and the sync chip under it), as a toast */
  :global(:root:has(.island)) .invite { top: calc(var(--hud-top) + var(--hit) + var(--lip-h) + 12px); }
  :global(:root:has(.island .chip)) .invite { top: calc(var(--hud-top) + var(--hit) + var(--lip-h) + 56px); }
  /* a toast in the same slot: this one under it */
  .invite.below { translate: 0 68px; }
  .pebble {
    width: 40px; height: 40px; flex: none; border-radius: 50%; display: grid; place-items: center; overflow: hidden;
    background: color-mix(in srgb, var(--c-yuzu) 40%, var(--c-cream));
  }
  .txt { flex: 1; min-width: 0; }
  .act {
    flex: none; appearance: none; cursor: pointer; min-height: 44px; padding: 0 14px;
    border-radius: var(--r-pill); border: 0; background: var(--c-leaf); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge);
    font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .act:focus-visible { outline: 3px solid var(--c-ink); outline-offset: 2px; }
  @keyframes in { from { transform: translateY(-120%); opacity: 0; } to { transform: none; opacity: 1; } }
</style>
