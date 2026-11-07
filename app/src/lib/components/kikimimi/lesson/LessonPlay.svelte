<script lang="ts">
  // A round of a unit's lesson (docs/curriculum-units.md §3, §16): a quiz item on the quiz's page (Play.svelte), a
  // recipe-2 card on its listening game's (ことば タイル, ようじ でんわ, たちぎき: each its own chunk, loaded when the
  // first of its cards comes), shown the lesson's game at the card's place and my tier (board.ts cardGame).
  import type { Component } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { cardKind, type CardKind } from '#lib/kikimimi/games/lesson/recipe.ts';
  import Play from '../Play.svelte';
  import { cardGame } from './board.ts';

  let { game }: { game: QuizGame } = $props();
  const it = $derived(game.items[game.view.i]);
  const kind = $derived(it ? cardKind(it) : null);
  const card = $derived(cardGame(game));

  type Page = Promise<{ default: Component<{ game: QuizGame }> }>;
  const PAGES: Record<CardKind, () => Page> = {
    tile: () => import('../tile/TilePlay.svelte'),
    call: () => import('../call/CallPlay.svelte'),
    tachi: () => import('../tachi/TachiPlay.svelte')
  };
  /** Each page's chunk, one promise (the {#await} keeps it from round to round). */
  const LOADED = new Map<CardKind, Page>();
  const page = (k: CardKind): Page => {
    let p = LOADED.get(k);
    if (!p) LOADED.set(k, (p = PAGES[k]()));
    return p;
  };
</script>

{#if kind}
  {#await page(kind) then { default: Page }}<Page game={card} />{/await}
{:else}
  <Play {game} />
{/if}
