<script lang="ts">
  // NookPhone-style notification banner (style guide v4 §T.3). Lives in the top layer (popover) so it sits
  // above an open sheet. Slides down below the status row, holds (the store decides how long), slides up.
  // Left: a 36px icon on a pebble (partner's villager for partner events, しずえ for system ones, the Miles
  // ticket for milestones). Right: one official reaction icon. Tap or swipe up to dismiss.
  import type { PersonId } from '#lib/types.ts';
  import Host from './Host.svelte';
  import Villager from './Villager.svelte';
  import OfficialArt from './OfficialArt.svelte';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    text: string;
    /** A partner event: show that person's villager icon. */
    person?: PersonId;
    /** Milestone banner: the Nook Miles icon instead of しずえ. */
    miles?: boolean;
    /** Official reaction icon on the right (`reactions/<id>`). */
    reaction?: string;
    /** Another banner is up: sit one row lower. */
    second?: boolean;
  }
  let { text, person, miles = false, reaction, second = false }: Props = $props();

  let gone = $state(false);
  let startY = 0;

  function topLayer(node: HTMLElement) {
    try {
      node.showPopover?.();
    } catch {
      /* no popover support: stays a fixed element */
    }
  }

  /** Slide back up when the store drops the banner (or on dismiss). */
  function up(_: Element) {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return { duration: reduced ? 120 : 220, css: (t: number) => (reduced ? `opacity:${t}` : `transform:translateY(${(t - 1) * 120}%);opacity:${t}`) };
  }

  function dismiss() {
    gone = true;
  }
</script>

{#if !gone}
  <div class="banner" class:second role="status" out:up|global popover="manual" use:topLayer>
    <button type="button" class="hit" aria-label={t('common.close')} onclick={dismiss}
      onpointerdown={(e) => (startY = e.clientY)} onpointermove={(e) => e.clientY - startY < -12 && dismiss()}></button>
    <span class="pebble" aria-hidden="true">
      {#if person}<Villager {person} size={36} head animate={false} eager />
      {:else if miles}<OfficialArt key="money/miles" size={34} eager />
      {:else}<Host head size={36} animate={false} eager />{/if}
    </span>
    <span class="txt">{text}</span>
    {#if reaction}<span class="re" aria-hidden="true"><OfficialArt key="reactions/{reaction}" size={28} eager /></span>{/if}
  </div>
{/if}

<style>
  .banner {
    position: fixed; inset: auto 0; margin: 0 auto; z-index: 90; overflow: hidden;
    top: calc(var(--safe-top) + 56px); height: 52px; width: min(100% - 24px, 420px);
    display: flex; align-items: center; gap: 10px; padding: 0 12px 0 6px; border-radius: var(--r-pill);
    background: var(--c-bubble); color: var(--c-ink-talk); border: 2px solid #EADBB8; box-shadow: 0 4px 0 rgba(74, 58, 44, .12), var(--sh-float);
    font: 700 var(--fs-body)/1.2 var(--font-ui);
    animation: in 320ms var(--ease-bounce) both;
  }
  .banner:popover-open { inset: auto 0; top: calc(var(--safe-top) + 56px); }
  .banner.second, .banner.second:popover-open { top: calc(var(--safe-top) + 116px); }
  .hit { position: absolute; inset: 0; z-index: 1; appearance: none; border: 0; padding: 0; background: none; cursor: pointer; touch-action: none; border-radius: inherit; }
  .pebble {
    width: 40px; height: 40px; flex: none; border-radius: var(--r-blob); display: grid; place-items: center; overflow: hidden;
    background: var(--c-yuzu-soft);
  }
  .txt { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .re { flex: none; line-height: 0; }
  @keyframes in { from { transform: translateY(-120%); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .banner { animation: fade 120ms both; }
    @keyframes fade { from { opacity: 0; } to { opacity: 1; } }
  }
</style>
