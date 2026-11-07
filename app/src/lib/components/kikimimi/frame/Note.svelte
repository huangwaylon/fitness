<script lang="ts">
  // The trap's note (an item's `note`: what to listen out for), the same yuzu strip at a reveal and in a review row. Any
  // game's.
  let { text }: { text: string } = $props();
</script>

<p class="note obj-cream" data-kiki-note>{text}</p>

<style>
  /* a yuzu tint on cream with the day ink, readable at any time of day (in the bubble, on the panel at night) */
  .note {
    margin: 0; position: relative; padding: 6px 10px; border-radius: 10px; color: var(--c-ink);
    background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); font: 700 var(--fs-s)/1.5 var(--font-ui);
  }
</style>
