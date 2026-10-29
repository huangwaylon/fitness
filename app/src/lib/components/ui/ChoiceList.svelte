<script lang="ts">
  // NH's choice list (v5 §3, F8): cream bubbles stacked at the right, in the one-action slot. Like the game, the
  // first option starts under a yuzu ▶ cursor (the default answer); hover, focus or ↑/↓ moves the cursor.
  interface Props {
    choices: { label: string; run: () => void }[];
  }
  let { choices }: Props = $props();
  let sel = $state(0);
  const btns: HTMLButtonElement[] = $state([]);

  function key(e: KeyboardEvent, i: number) {
    const d = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    sel = (i + d + choices.length) % choices.length;
    btns[sel]?.focus();
  }
</script>

<div class="choices" role="group">
  {#each choices as c, i (c.label)}
    <button type="button" class="choice" class:sel={i === sel} style:animation-delay="{i * 60}ms" bind:this={btns[i]}
      onpointerenter={() => (sel = i)} onfocus={() => (sel = i)} onkeydown={(e) => key(e, i)} onclick={c.run}>
      <span class="cur" aria-hidden="true"></span>{c.label}
    </button>
  {/each}
</div>

<style>
  .choices { display: grid; gap: 8px; justify-items: stretch; align-content: end; }
  .choice {
    position: relative; appearance: none; border: 0; cursor: pointer; min-height: var(--hit); min-width: clamp(112px, 30vw, 140px); padding: 0 22px 0 30px;
    border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink-soft); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    font: 700 var(--fs-talk)/1 var(--font-ui); animation: if-pop var(--dur-pop) var(--ease-bounce) both;
    transition: transform var(--dur-base) var(--ease-bounce), color var(--dur-quick);
  }
  .choice.sel { color: var(--c-ink); }
  /* The game's cursor: a yuzu ▶ that nudges beside the highlighted answer. */
  .cur {
    position: absolute; left: 11px; top: 50%; width: 12px; height: 14px; margin-top: -7px; background: var(--c-yuzu-lip);
    clip-path: polygon(0 0, 100% 50%, 0 100%); border-radius: 2px; opacity: 0; transform: scale(.4);
    transition: opacity var(--dur-quick), transform var(--dur-quick) var(--ease-bounce);
  }
  .sel .cur { opacity: 1; transform: none; animation: nudge 800ms var(--ease-idle) infinite; }
  @keyframes nudge { 0%, 100% { translate: 0; } 50% { translate: 3px; } }
  .choice:active { transform: translateY(3px) scale(1.04, .94); box-shadow: 0 1px 0 var(--c-lip); transition-duration: var(--dur-tap); }
  @media (prefers-reduced-motion: reduce) { .sel .cur { animation: none; } }
</style>
