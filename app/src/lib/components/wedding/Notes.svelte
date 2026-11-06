<script lang="ts">
  // けっこんしき's メモ (docs/wedding.md "Notes"): the one shared note as an NH letter (cream stationery, ruled lines,
  // a pink heart stamp), rendered from its small markdown (Markdown.svelte). A member's ✎ かく opens the field with four
  // format buttons (みだし, リスト, ふとじ, ななめ: lib/wedding/markdown.ts' toggles, the selection kept) and ほぞん /
  // やめる; one save per edit, sent with the note's `at` it started from (the store's saveNote). When the store flags a
  // conflict (two saves crossed: the held one and the one it was saved over, `was`) both versions show instead, each
  // under its writer's name with これに する (saved from the held one: that settles it). The old Sheet's note wears
  // 「むかしの きろく」 until it's saved again. The guest reads only.
  import { tick } from 'svelte';
  import Markdown from './Markdown.svelte';
  import { toggleBold, toggleBullets, toggleHeading, toggleItalic, type Edit } from '#lib/wedding/markdown.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { WNOTE_CHARS } from '#lib/contract/wedding.ts';
  import type { Who } from '#lib/types.ts';
  import type { Board, WeddingActions } from './view.ts';

  interface Props {
    /** The held note (null: none yet). */
    note: Board['note'];
    conflict: Board['conflict'];
    canEdit: boolean;
    names: Record<Who, string>;
    actions?: WeddingActions;
    /** Editing (the board's levels: ‹ and ✕ ask nothing, ほぞん and やめる end it). */
    editing?: boolean;
  }
  let { note, conflict, canEdit, names, actions, editing = $bindable(false) }: Props = $props();
  let draft = $state('');
  /** The held note's `at` the edit began from (null: there was none). */
  let base: number | null = null;
  let area: HTMLTextAreaElement | undefined = $state();
  const md = $derived(note?.md ?? '');

  function write() {
    draft = md;
    base = note?.at ?? null;
    editing = true;
  }
  function save() {
    if (draft !== md && actions?.saveNote(draft, base)) toasts.show(t('wed.note.saved'), 2000);
    editing = false;
  }
  async function fmt(fn: (text: string, a: number, b: number) => Edit) {
    if (!area) return;
    const e = fn(draft, area.selectionStart, area.selectionEnd);
    draft = e.text;
    await tick();
    area.focus({ preventScroll: true });
    area.setSelectionRange(e.start, e.end);
  }
  const TOOLS = [
    { k: 'h', fn: toggleHeading, glyph: 'H' },
    { k: 'ul', fn: toggleBullets, glyph: '•' },
    { k: 'b', fn: toggleBold, glyph: 'B' },
    { k: 'i', fn: toggleItalic, glyph: 'I' }
  ] as const;
  function pick(text: string) {
    actions?.saveNote(text, conflict?.current.at);
    editing = false;
  }
</script>

<div class="notes" data-wed-notes>
  {#if conflict && canEdit}
    <p class="ask" data-wed-conflict>{t('wed.note.conflict')}</p>
    {#each [['current', conflict.current], ['other', conflict.other]] as const as [k, v] (k)}
      <article class="letter small" data-wed-version={k} data-wed-who={v.who}>
        <h4 class="whose">{t('wed.note.whose', { name: names[v.who] })}</h4>
        <Markdown text={v.md} />
        <button type="button" class="btn small" data-wed-pick={k} data-sfx="confirm" onclick={() => pick(v.md)}>{t('wed.note.pick')}</button>
      </article>
    {/each}
  {:else if editing}
    <div class="tools" role="toolbar" aria-label={t('wed.note.fmt')}>
      {#each TOOLS as tl (tl.k)}
        <button type="button" class="chip big tool {tl.k}" aria-label={t(`wed.note.${tl.k}`)} data-wed-fmt={tl.k} data-sfx="tick"
          onpointerdown={(e) => e.preventDefault()} onclick={() => fmt(tl.fn)}><span aria-hidden="true">{tl.glyph}</span><small>{t(`wed.note.${tl.k}`)}</small></button>
      {/each}
    </div>
    <textarea bind:this={area} bind:value={draft} maxlength={WNOTE_CHARS} aria-label={t('wed.note.field')} data-wed-note-field data-sfx="none"></textarea>
    <div class="acts">
      <button type="button" class="btn small paper" data-wed-note-cancel data-sfx="back" onclick={() => (editing = false)}>{t('wed.cancel')}</button>
      <button type="button" class="btn small" data-wed-note-save data-sfx="confirm" onclick={save}>{t('wed.save')}</button>
    </div>
  {:else}
    <article class="letter" data-wed-letter>
      <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.1C4.5 7.6 6.6 5.5 9.2 5.5c1.3 0 2.2.6 2.8 1.5.6-.9 1.5-1.5 2.8-1.5 2.6 0 4.7 2.1 4.7 4.9 0 5.5-7.5 10.1-7.5 10.1z" /></svg></span>
      <h4 class="whose">{t('wed.note.title')}{#if note?.imported}<span class="old" data-wed-imported>{t('wed.imported')}</span>{/if}</h4>
      {#if md.trim()}
        <Markdown text={md} />
      {:else}
        <p class="none" data-wed-note-empty>{t('wed.note.empty')}</p>
      {/if}
      {#if canEdit}
        <button type="button" class="btn small paper write" data-wed-note-edit data-sfx="open" onclick={write}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4" /></svg>{t('wed.note.write')}</button>
      {/if}
    </article>
  {/if}
</div>

<style>
  .notes { display: grid; gap: 12px; }
  /* NH's letter: cream stationery ruled every 32px (the text's own line height, so lines sit on the rules), a pink
     band at its head, a heart stamp tilted in the corner; a game object (cream at every time of day) */
  .letter {
    --doc-lh: 32px;
    position: relative; display: grid; gap: 0; padding: 18px 20px 20px; border-radius: 18px 22px 20px 24px;
    color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 8px 18px rgb(80 50 30 / .10);
    background:
      linear-gradient(#FBD3E0 0 10px, transparent 10px) top / 100% 100% no-repeat,
      #FFF8EC;
  }
  /* the rules under the text itself: every line of it is 32px (Markdown.svelte), so each sits on its rule */
  .letter :global(.doc) { background: repeating-linear-gradient(transparent 0 30px, color-mix(in srgb, #E9B9C9 60%, transparent) 30px 32px); }
  .whose { margin: 6px 0 14px; font: 700 var(--fs-body)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .04em; }
  .old { margin-left: 8px; padding: 3px 8px 2px; border-radius: var(--r-pill); background: rgba(0, 0, 0, .06); font: 700 var(--fs-xs)/1 var(--font-ui); letter-spacing: 0; vertical-align: 2px; }
  .stamp {
    position: absolute; top: 18px; right: 16px; width: 38px; height: 44px; display: grid; place-items: center; transform: rotate(8deg);
    background: #FFEFF4; border-radius: 4px; box-shadow: 0 0 0 2px #F3B5CA, 0 0 0 4px #FFEFF4, 0 0 0 5px #F3B5CA;
  }
  .stamp svg { width: 24px; height: 24px; fill: #F07AA2; }
  .none { margin: 0; color: var(--c-ink-soft); font-weight: 700; line-height: var(--doc-lh); }
  .write { justify-self: end; margin: 16px 0 var(--lip-h); gap: 6px; }
  .write svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .letter.small { padding-top: 16px; background: #FFF8EC; }
  /* each version scrolls on its own: both choices in reach */
  .letter.small :global(.doc) { max-height: 34dvh; overflow: auto; overscroll-behavior: contain; }
  .letter.small .btn { margin: 14px 0 var(--lip-h); }
  .ask { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .tools { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .tool { flex-direction: column; gap: 2px; padding: 4px 0 2px; min-height: 52px; }
  .tool span { font: 700 var(--fs-talk)/1 var(--font-num); }
  .tool.b span { font-weight: 800; }
  .tool.i span { font-style: italic; }
  .tool small { font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  textarea {
    width: 100%; box-sizing: border-box; min-height: max(280px, 46dvh); resize: vertical; padding: 12px 14px; border: 0; border-radius: 16px;
    font: 500 var(--fs-input)/1.6 var(--font-ui); color: var(--c-ink); background: #FFF8EC; box-shadow: inset 0 0 0 2px var(--c-edge);
  }
  textarea:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .acts { display: flex; justify-content: flex-end; gap: 8px; }
  .acts .btn { margin: 0 0 var(--lip-h); }
</style>
