<script lang="ts">
  // A quiet sheet's title bar (docs/design.md "Quiet sheets"; the one navigation model, ui/NavBar's rules): 44px, the
  // title on the left (17/600 Zen Maru Gothic) with an optional quiet subtitle after it, a bare ✕ on the right (it
  // closes the whole sheet, from any level), ‹ before the title when there is a level to go back to. Built on
  // NavButton (its quiet look), so back and close stay the app's one button. `over`: laid over a photo (a trip's hero):
  // no ground, no title, the two buttons on smoked discs. `trailing`: a control before ✕ (編集, 保存).
  //   <SheetHeader title="りょこう" onclose={…} />   <SheetHeader title="沖縄" sub="10月10日 – 12日" onback={…} onclose={…} />
  import type { Snippet } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';

  interface Props {
    title: string;
    sub?: string;
    onback?: (() => void) | null;
    onclose?: (() => void) | null;
    /** `self`: the handlers play their own cues. */
    sfx?: 'back' | 'self';
    over?: boolean;
    trailing?: Snippet;
  }
  let { title, sub, onback = null, onclose = null, sfx = 'back', over = false, trailing }: Props = $props();
</script>

<header class="q-hdr" class:over class:backed={!!onback}>
  {#if onback}<span class="lead"><NavButton kind="back" onclick={onback} {sfx} look={over ? 'photo' : 'quiet'} /></span>{/if}
  <h2 class="t" class:sr-only={over}>{title}{#if sub}<span class="sub">{sub}</span>{/if}</h2>
  {#if trailing}{@render trailing()}{/if}
  {#if onclose}<span class="end"><NavButton kind="close" onclick={onclose} {sfx} look={over ? 'photo' : 'quiet'} /></span>{/if}
</header>

<style>
  .q-hdr { flex: none; height: 44px; display: flex; align-items: center; gap: 4px; padding: 0 4px 0 16px; position: relative; z-index: 5; background: var(--q-bg); }
  .q-hdr.backed { padding-left: 4px; }
  .lead { margin-right: -6px; display: flex; }
  .t {
    flex: 1; min-width: 0; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    font: 700 var(--q-fs-head)/1.2 var(--q-font-title); letter-spacing: .01em; color: var(--q-ink);
  }
  .sub { margin-left: 8px; font: var(--q-w) var(--q-fs-s)/1.2 var(--q-font); color: var(--q-muted); letter-spacing: 0; }
  .end { margin-left: auto; display: flex; }
  .q-hdr.over { background: none; padding: 0 4px; justify-content: space-between; }
  .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
</style>
