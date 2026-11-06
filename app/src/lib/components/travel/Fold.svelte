<script lang="ts">
  // A trip's folding card (にってい's days, じゅんび's cards): its head a button (`head`: the lead, the title, the line
  // under it; the chevron), opening the body: `children`, then the headed lists, `tail`, the links out. Open, a
  // compact strip of it (`pin`) stays under the trip's tabs while the card scrolls past them (CSS sticky, in the
  // card: it goes with its end), so a long day says which it is; until then it hides under the head.
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Link, Section } from '#lib/travel/types.ts';
  import Txt from './Txt.svelte';
  import Rows from './Rows.svelte';
  import Links from './Links.svelte';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The body's id (the button's aria-controls). */
    id: string;
    open: boolean;
    ontoggle: () => void;
    note: Record<string, string> | null;
    head: Snippet;
    pin: Snippet;
    children: Snippet;
    sections?: readonly Section[];
    tail?: Snippet;
    links?: readonly Link[];
  }
  let { id, open, ontoggle, note, head, pin, children, sections = [], tail, links = [], class: cls = '', ...rest }: Props = $props();
</script>

<article class="fold card {cls}" class:open data-open={open || undefined} {...rest}>
  {#if open}<div class="pin guide" aria-hidden="true">{@render pin()}</div>{/if}
  <h3 class="head">
    <button type="button" class="tog" aria-expanded={open} aria-controls={id} data-sfx="page" onclick={ontoggle}>
      {@render head()}
      <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 6l4 4 4-4" /></svg>
    </button>
  </h3>
  {#if open}
    <div class="body guide" {id}>
      {@render children()}
      {#each sections as s, i (i)}
        <section class="sec">
          {#if s.head}<h4><Txt l={s.head} {note} /></h4>{/if}
          <Rows rows={s.rows} kind={s.kind} {note} />
        </section>
      {/each}
      {@render tail?.()}
      {#if links.length}<Links {links} {note} />{/if}
    </div>
  {/if}
</article>

<style>
  .fold { padding: 0; overflow: clip; isolation: isolate; }
  /* the head over the pin (it hides there till the head scrolls away), the pin over the body */
  .head { position: relative; z-index: 2; margin: 0; font: inherit; background: var(--card); border-radius: var(--r-card); }
  /* the head: lead | title, the line under it | ⌄ — the whole row the button (a 44px+ target) */
  .tog {
    appearance: none; border: 0; background: none; width: 100%; margin: 0; padding: 12px; cursor: pointer; text-align: left;
    display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 12px; min-height: 64px;
    color: var(--text); border-radius: var(--r-card); -webkit-tap-highlight-color: transparent;
  }
  .tog:active { background: var(--hl); }
  .chev { width: 18px; height: 18px; fill: none; stroke: var(--text-soft); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; transition: transform 200ms var(--ease-soft); }
  .open .chev { transform: rotate(180deg); }
  .pin {
    position: sticky; z-index: 1; top: calc(var(--tabs-h, 56px) - 6px); height: 36px; margin-bottom: -36px; box-sizing: border-box;
    display: flex; align-items: center; gap: 8px; padding: 0 14px; overflow: hidden; white-space: nowrap;
    background: var(--card); box-shadow: 0 2px 0 var(--lip); font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text);
  }
  .pin :global(.pt) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .body { display: grid; gap: 14px; padding: 2px 12px 14px; animation: in 220ms var(--ease-soft); }
  @keyframes in { from { opacity: 0; transform: translateY(-6px); } }
  .sec { display: grid; gap: 6px; }
  h4 { margin: 0 4px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .03em; }
  @media (prefers-reduced-motion: reduce) { .body { animation: none; } .chev { transition: none; } }
</style>
