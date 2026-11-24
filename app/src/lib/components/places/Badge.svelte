<script lang="ts">
  // A category's badge in a row or a card (docs/places.md "Categories"): its family's colour and shape (circle, diamond,
  // square) with a cream rim and its glyph, as the map's badges (map/icons.ts) are drawn.
  import type { PlaceCat } from '#lib/contract/places.ts';
  import { CAT_STYLE } from '#lib/places/cats.ts';

  let { cat }: { cat: PlaceCat } = $props();
  const s = $derived(CAT_STYLE[cat]);
</script>

<span class="bd {s.shape}" style:--f={s.fill} style:--g={s.ink} aria-hidden="true"><span class="gl">{s.glyph}</span></span>

<style>
  .bd {
    --s: 22px;
    flex: none; position: relative; display: grid; place-items: center; width: var(--s); height: var(--s); box-sizing: border-box;
    background: var(--f); color: var(--g); border-radius: 50%; box-shadow: 0 0 0 2px #FFF9E3, 0 0 0 3px rgba(147, 112, 71, .55);
    font: 700 calc(var(--s) * .52)/1 var(--font-ui);
  }
  .square { border-radius: 30%; width: calc(var(--s) * .9); height: calc(var(--s) * .9); }
  .diamond { border-radius: 22%; width: calc(var(--s) * .78); height: calc(var(--s) * .78); rotate: 45deg; margin: 0 calc(var(--s) * .11); }
  .diamond .gl { rotate: -45deg; font-size: calc(var(--s) * .46); }
</style>
