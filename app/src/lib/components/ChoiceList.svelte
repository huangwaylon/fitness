<script lang="ts">
  // NH's choice list (v5 §3): cream bubbles stacked at the right, in the one-action slot.
  interface Props {
    choices: { label: string; run: () => void }[];
  }
  let { choices }: Props = $props();
</script>

<div class="choices" role="group">
  {#each choices as c, i (c.label)}
    <button type="button" class="choice" style:animation-delay="{i * 60}ms" onclick={c.run}>{c.label}</button>
  {/each}
</div>

<style>
  .choices { display: grid; gap: 8px; justify-items: stretch; align-content: end; }
  .choice {
    appearance: none; border: 0; cursor: pointer; min-height: 44px; min-width: 104px; padding: 0 22px;
    border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-lip);
    font: 700 var(--fs-talk)/1 var(--font-ui); animation: if-pop var(--dur-pop) var(--ease-bounce) both;
    transition: transform var(--dur-base) var(--ease-bounce);
  }
  .choice:active { transform: translateY(2px) scale(1.04, .94); box-shadow: 0 1px 0 var(--c-lip); transition-duration: var(--dur-tap); }
</style>
