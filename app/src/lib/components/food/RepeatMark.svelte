<script lang="ts">
  // いつもの's mark (🔁, drawn: no emoji, so it is the same on every phone and needs no font): two arrows chasing round,
  // in the text's colour. On a meal's repeat chip, a repeat's entries and the くりかえす control.
  let { size = 14 }: { size?: number } = $props();
</script>

<svg class="rep-mark" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
  <path d="M4.5 11 A7.5 7.5 0 0 1 17.6 6.4 M18.5 2.5 V7 H14 M19.5 13 A7.5 7.5 0 0 1 6.4 17.6 M5.5 21.5 V17 H10" />
</svg>

<style>
  .rep-mark {
    display: inline-block; flex: none; vertical-align: -2px;
    fill: none; stroke: currentColor; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round;
  }
</style>
