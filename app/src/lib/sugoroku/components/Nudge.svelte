<script lang="ts">
  // A turn's note (「おしい！」, a check's note): a pill 8 px over the turn's sheet (the sheet is its containing block),
  // never a line of its own, so the panel never jumps.
  let { text }: { text: string } = $props();
</script>

<p class="toast" aria-live="polite" data-sg-nudge>{text}</p>

<style>
  .toast { position: absolute; left: 50%; bottom: calc(100% + 8px); translate: -50% 0; width: max-content; max-width: calc(100% - 24px); margin: 0;
    padding: 8px 14px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); text-align: center;
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); text-wrap: pretty; pointer-events: none; }
</style>
