<script lang="ts">
  // けっこんしき's note, rendered (lib/wedding/markdown.ts): elements, never markup (no {@html} here or anywhere: the
  // note is written by the members and read by everyone); h4 / h5 under the sheet's own headings; a link's anchor is
  // http/https only (the parser's allowlist), a new tab with no opener and no referrer; consecutive spans of one link
  // one anchor.
  import { groupLinks, parseMarkdown, type Span } from '#lib/wedding/markdown.ts';
  let { text }: { text: string } = $props();
  const blocks = $derived(parseMarkdown(text));
</script>

{#snippet runs(spans: Span[])}
  {#each groupLinks(spans) as g, i (i)}
    {#if g.href}<a href={g.href} target="_blank" rel="noopener noreferrer" data-sfx="open">{@render marks(g.spans)}</a>{:else}{@render marks(g.spans)}{/if}
  {/each}
{/snippet}
{#snippet marks(spans: Span[])}
  {#each spans as s, i (i)}{#if s.bold && s.italic}<strong><em>{s.text}</em></strong>{:else if s.bold}<strong>{s.text}</strong>{:else if s.italic}<em>{s.text}</em>{:else}{s.text}{/if}{/each}
{/snippet}

<div class="doc" data-wed-doc>
  {#each blocks as b, i (i)}
    {#if b.kind === 'heading'}
      {#if b.level === 1}<h4>{@render runs(b.spans)}</h4>{:else}<h5>{@render runs(b.spans)}</h5>{/if}
    {:else if b.kind === 'bullets'}
      <ul>{#each b.items as it, j (j)}<li>{@render runs(it)}</li>{/each}</ul>
    {:else if b.kind === 'numbers'}
      <ol>{#each b.items as it, j (j)}<li>{@render runs(it)}</li>{/each}</ol>
    {:else}
      <p>{#each b.lines as ln, j (j)}{#if j}<br />{/if}{@render runs(ln)}{/each}</p>
    {/if}
  {/each}
</div>

<style>
  .doc { display: grid; gap: 0; font: 500 var(--fs-body)/var(--doc-lh, 32px) var(--font-ui); color: var(--c-ink); overflow-wrap: anywhere; }
  h4, h5 { margin: 0; font: 700 var(--fs-talk)/var(--doc-lh, 32px) var(--font-ui); color: #B44E77; }
  h5 { font-size: var(--fs-body); color: var(--c-ink); }
  p, ul, ol { margin: 0 0 var(--doc-lh, 32px); }
  p:last-child, ul:last-child, ol:last-child { margin-bottom: 0; }
  ul, ol { padding-left: 1.4em; }
  ul { list-style: none; }
  ul li { position: relative; }
  /* a pink petal dot for a bullet (a flower glyph would pull another font slice in) */
  ul li::before { content: ''; position: absolute; left: -1.05em; top: calc(var(--doc-lh, 32px) / 2 - 4px); width: 8px; height: 8px; border-radius: 50% 50% 50% 0; background: #E583A6; transform: rotate(-45deg); }
  ol li::marker { font-family: var(--font-num); font-weight: 700; color: #B44E77; }
  strong { font-weight: 700; }
  em { font-style: normal; background: linear-gradient(transparent 60%, color-mix(in srgb, var(--c-yuzu) 70%, transparent) 60%); }
  a { color: var(--c-leaf-text); text-decoration: underline; text-underline-offset: 3px; }
</style>
