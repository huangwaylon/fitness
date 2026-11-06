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
  /* a document: 16/1.65 in the system font, headings 17/600 with room over them, quiet dots for bullets */
  .doc { display: grid; gap: 0; font: var(--q-w) 16px/1.65 var(--q-font); color: var(--q-ink); overflow-wrap: anywhere; }
  h4, h5 { margin: 20px 0 4px; font: var(--q-w-b) var(--q-fs-head)/1.4 var(--q-font); color: var(--q-ink); }
  h5 { font-size: 16px; }
  h4:first-child, h5:first-child { margin-top: 0; }
  p, ul, ol { margin: 0 0 4px; }
  p:last-child, ul:last-child, ol:last-child { margin-bottom: 0; }
  ul, ol { padding-left: 16px; }
  ul { list-style: none; }
  ul li { position: relative; }
  ul li::before { content: ''; position: absolute; left: -13px; top: .75em; width: 5px; height: 5px; border-radius: 50%; background: var(--q-faint); }
  ol li::marker { color: var(--q-muted); }
  strong { font-weight: var(--q-w-b); }
  em { font-style: italic; }
  a { color: var(--q-accent-ink); text-decoration: underline; text-underline-offset: 3px; }
</style>
