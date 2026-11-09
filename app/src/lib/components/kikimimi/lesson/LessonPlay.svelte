<script lang="ts">
  // A round of a unit's lesson (docs/curriculum.md "Lessons", "Recipe 2"): a quiz item on the quiz's page (Play.svelte), a
  // recipe-2 card on its listening game's (ことば タイル, ようじ でんわ, たちぎき: each its own chunk, loaded when the
  // first of its cards comes), shown the lesson's game at the card's place and my tier (board.ts cardGame).
  import type { Component } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { cardKind, type CardKind } from '#lib/kikimimi/games/lesson/recipe.ts';
  import Lazy from '#lib/components/ui/Lazy.svelte';
  import Play from '../Play.svelte';
  import { cardGame } from './board.ts';

  let { game }: { game: QuizGame } = $props();
  const it = $derived(game.items[game.view.i]);
  const kind = $derived(it ? cardKind(it) : null);
  const card = $derived(cardGame(game));

  const PAGES: Record<CardKind, () => Promise<{ default: Component<{ game: QuizGame }> }>> = {
    tile: () => import('../tile/TilePlay.svelte'),
    call: () => import('../call/CallPlay.svelte'),
    tachi: () => import('../tachi/TachiPlay.svelte')
  };
</script>

{#if kind}
  {#key kind}<Lazy load={PAGES[kind]}>{#snippet children(Page)}<Page game={card} />{/snippet}</Lazy>{/key}
{:else}
  <Play {game} />
{/if}
