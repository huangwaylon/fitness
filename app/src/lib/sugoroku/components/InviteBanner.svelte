<script lang="ts">
  // 英語すごろく's invitation (invite.svelte.ts; docs/sugoroku.md "Online"): 「Xが英語すごろくを始めたよ」 [参加] ✕,
  // the starter's head on its pebble, staying till 参加 (straight into the game's screen) or ✕: ui/Toast's lasting
  // banner (cream, the top layer, in the open sheet's <dialog> when there is one: ToastHost places it), its slot the
  // toasts' (`below`: under a toast shown there). Kanji, a sheet's banner (docs/design.md "Copy"). Not on the game's own
  // screen (/sugoroku?m=online: the game it asks to).
  import { page } from '$app/state';
  import { routeOf } from '#lib/ui-state/paths.ts';
  import Toast from '#lib/components/ui/Toast.svelte';
  import { answer, invite, join } from '../invite.svelte.ts';

  let { below = false }: { below?: boolean } = $props();
  const inGame = $derived(routeOf(page.url.pathname) === '/sugoroku' && page.url.searchParams.get('m') === 'online');
</script>

{#if invite.cur && !inGame}
  {@const c = invite.cur}
  {#key c.g}
    <Toast text={c.text} person={c.who} {below} action={{ label: c.join, run: join, sfx: 'open' }} onclose={() => answer(c.g)} data-sg-invite={c.g} />
  {/key}
{/if}
