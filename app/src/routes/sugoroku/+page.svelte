<script lang="ts">
  // 英語すごろく's own screen (docs/sugoroku.md "The 3D board"): a game started or resumed from English Study's すごろく
  // tab, its 3D board over the turn's panel, the island not drawn meanwhile (one WebGL context). ‹ (or the game's end
  // left) goes back to the island with the tab open. `?m=local` this phone's game, `?m=online` the shared one.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import SugorokuPlay from '#lib/sugoroku/components/SugorokuPlay.svelte';
  import { english } from '#lib/english/open.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { s } from '#lib/sugoroku/i18n.ts';
  import { withKeyboardInset } from '#lib/components/ui/keyboardInset.svelte.ts';

  const m = $derived(page.url.searchParams.get('m') === 'online' ? 'online' : 'local');
  const leave = () => {
    const q = new URLSearchParams(location.search);
    q.delete('m');
    void goto(`${resolve('/')}${q.size ? `?${q}` : ''}`).then(() => english.show('game'));
  };
</script>

<!-- (.kit: the unified kit's scope, as English Study's sheet gives the tab; withKeyboardInset: a typed sentence, 聞こえた文,
     and its これでOK kept above the keyboard) -->
<div class="screen kit" {@attach withKeyboardInset}>
  {#if week.view}{#key m}<SugorokuPlay screen={m} onclose={leave} />{/key}{:else}<p class="wait" data-sg-wait>{s('loading')}</p>{/if}
</div>

<style>
  .wait { margin: auto; font-size: var(--fs-s); color: var(--text-soft); }
  .screen { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
</style>
