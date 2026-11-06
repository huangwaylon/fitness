<script lang="ts">
  // A guide string on screen (text.ts): the reader's side of the pair (else the other, marked with its lang), its
  // measures in the phone's units, its private values from the trip note, each one 🔒 ・・・ until the note is in, its
  // Japanese with a <wbr> between words (the guides' text is keep-all: a line breaks there, never inside a word).
  //   <Txt l={row.text} {note} />
  import type { L } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { otherLang, pick, pieces, render } from './text.ts';

  let { l, note }: { l: L | undefined; note: Record<string, string> | null } = $props();
  const parts = $derived(render(pick(l, i18n.locale), note));
  const lang = $derived(otherLang(l, i18n.locale));
</script>

<span lang={lang ?? undefined}>{#each parts as p, i (i)}{#if p.k === 'text'}{#each pieces(p.s) as w, j (j)}{#if j}<wbr />{/if}{w}{/each}{:else}<span class="lock" role="img" aria-label={t('travel.locked')} data-locked={p.key}>🔒 ・・・</span>{/if}{/each}</span>

<style>
  /* a private value not in yet: a soft pill in the text's own line, never wider than its few dots */
  .lock {
    display: inline-block; padding: 0 6px; margin: 0 1px; border-radius: 6px; white-space: nowrap;
    background: var(--ctl-off); color: var(--text-soft); font-size: .9em; line-height: 1.4; letter-spacing: .08em;
  }
</style>
