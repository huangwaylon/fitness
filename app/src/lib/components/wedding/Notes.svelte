<script lang="ts">
  // けっこんしき's メモ (docs/wedding.md "Notes"): the one shared note as an NH letter (cream stationery, ruled lines,
  // a pink heart stamp), rendered from its small markdown (Markdown.svelte). A member's ✎ かく opens the field with the
  // format buttons (みだし, リスト, ふとじ, ななめ: lib/wedding/markdown.ts' toggles, the selection kept; リンク) and
  // やめる / ほぞん pinned at the scroller's foot (over the keyboard). The draft and its save are notepad.svelte.ts'.
  // When the store flags a conflict (two saves crossed: the held one and the one it was saved over) both versions
  // show instead, each under its writer (mine marked), with これに する (とりけす on its banner) and ふたつ あわせる (the
  // editor with both). The old Sheet's note says so in a soft line until it's saved again. The guest reads only.
  import { tick } from 'svelte';
  import Markdown from './Markdown.svelte';
  import Icon from './Icon.svelte';
  import { board } from './board.svelte.ts';
  import { cancel, merge, pad, pick, save, write } from './notepad.svelte.ts';
  import { toggleBold, toggleBullets, toggleHeading, toggleItalic, type Edit } from '#lib/wedding/markdown.ts';
  import { t } from '#lib/i18n/index.ts';
  import { WNOTE_CHARS } from '#lib/contract/wedding.ts';
  import type { Who } from '#lib/types.ts';

  let { names }: { names: Record<Who, string> } = $props();
  let area: HTMLTextAreaElement | undefined = $state();
  const note = $derived(board.note);
  const md = $derived(pad.picked ?? note?.md ?? '');
  /** The crossed versions worth choosing between (a blank one never is). */
  const versions = $derived(
    board.conflict && board.canEdit && pad.picked === null
      ? (['current', 'other'] as const).map((k) => [k, board.conflict![k]] as const).filter(([, v]) => v.md.trim())
      : []
  );

  /** `[label](https://)`, the URL selected to paste over. */
  function toggleLink(text: string, a: number, b: number): Edit {
    const label = text.slice(a, b) || t('wed.note.link'), head = `${text.slice(0, a)}[${label}](`;
    return { text: `${head}https://)${text.slice(b)}`, start: head.length, end: head.length + 8 };
  }
  async function fmt(fn: (text: string, a: number, b: number) => Edit) {
    if (!area) return;
    const e = fn(pad.draft, area.selectionStart, area.selectionEnd);
    pad.draft = e.text;
    await tick();
    area.focus({ preventScroll: true });
    area.setSelectionRange(e.start, e.end);
  }
  const TOOLS = [
    { k: 'h', fn: toggleHeading, glyph: 'H' },
    { k: 'ul', fn: toggleBullets, glyph: '•' },
    { k: 'b', fn: toggleBold, glyph: 'B' },
    { k: 'i', fn: toggleItalic, glyph: 'I' },
    { k: 'link', fn: toggleLink, glyph: '' }
  ] as const;
</script>

<div class="notes">
  {#if pad.editing}
    <div class="tools" role="toolbar" aria-label={t('wed.note.fmt')}>
      {#each TOOLS as tl (tl.k)}
        <button type="button" class="chip big tool {tl.k}" aria-label={t(`wed.note.${tl.k}`)} data-wed-fmt={tl.k} data-sfx="tick"
          onpointerdown={(e) => e.preventDefault()} onclick={() => fmt(tl.fn)}>{#if tl.glyph}<span aria-hidden="true">{tl.glyph}</span>{:else}<Icon name="link" />{/if}<small>{t(`wed.note.${tl.k}`)}</small></button>
      {/each}
    </div>
    <textarea bind:this={area} bind:value={pad.draft} maxlength={WNOTE_CHARS} aria-label={t('wed.note.field')} data-wed-note-field data-sfx="none"></textarea>
    <div class="level-acts">
      <button type="button" class="btn small paper" data-sfx="back" onclick={cancel}>{t('wed.cancel')}</button>
      <button type="button" class="btn small" data-wed-note-save data-sfx="confirm" onclick={save}>{t('wed.save')}</button>
    </div>
  {:else if versions.length}
    <p class="ask" data-wed-conflict>{t('wed.note.conflict')}</p>
    {#each versions as [k, v] (k)}
      <article class="letter small" data-wed-version={k} data-wed-who={v.who}>
        <h4 class="whose">{t('wed.note.whose', { name: names[v.who] })}{#if v.who === board.me}<span class="mine" data-wed-mine>{t('wed.note.mine')}</span>{/if}</h4>
        <Markdown text={v.md} />
        <button type="button" class="btn small" data-wed-pick={k} data-sfx="confirm" onclick={() => pick(v.md)}>{t('wed.note.pick')}</button>
      </article>
    {/each}
    {#if versions.length === 2}
      <button type="button" class="btn small paper both" data-wed-merge data-sfx="open" onclick={merge}>{t('wed.note.merge')}</button>
    {/if}
  {:else}
    <article class="letter" data-wed-letter>
      <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.1C4.5 7.6 6.6 5.5 9.2 5.5c1.3 0 2.2.6 2.8 1.5.6-.9 1.5-1.5 2.8-1.5 2.6 0 4.7 2.1 4.7 4.9 0 5.5-7.5 10.1-7.5 10.1z" /></svg></span>
      <h4 class="whose">{t('wed.note.title')}</h4>
      {#if note?.imported && pad.picked === null}<p class="old" data-wed-imported>{t('wed.imported.note')}</p>{/if}
      {#if md.trim()}
        <Markdown text={md} />
      {:else}
        <p class="none">{t('wed.note.empty')}</p>
      {/if}
      {#if board.canEdit && pad.picked === null}
        <button type="button" class="btn small paper write" data-wed-note-edit data-sfx="open" onclick={write}><Icon name="pen" />{t('wed.note.write')}</button>
      {/if}
    </article>
  {/if}
</div>

<style>
  .notes { display: flex; flex-direction: column; gap: 12px; }
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
  .mine { margin-left: 8px; padding: 3px 8px 2px; border-radius: var(--r-pill); background: var(--c-leaf); color: var(--c-ink); font: 700 var(--fs-xs)/1 var(--font-ui); letter-spacing: 0; vertical-align: 2px; }
  .old { margin: -8px 0 10px; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink-soft); }
  .stamp {
    position: absolute; top: 18px; right: 16px; width: 38px; height: 44px; display: grid; place-items: center; transform: rotate(8deg);
    background: #FFEFF4; border-radius: 4px; box-shadow: 0 0 0 2px #F3B5CA, 0 0 0 4px #FFEFF4, 0 0 0 5px #F3B5CA;
  }
  .stamp svg { width: 24px; height: 24px; fill: #F07AA2; }
  .none { margin: 0; color: var(--c-ink-soft); font-weight: 700; line-height: var(--doc-lh); }
  .write { justify-self: end; margin: 16px 0 var(--lip-h); gap: 6px; }
  .letter.small { padding-top: 16px; background: #FFF8EC; }
  /* each version scrolls on its own: both choices in reach */
  .letter.small :global(.doc) { max-height: 34dvh; overflow: auto; overscroll-behavior: contain; }
  .letter.small .btn { margin: 14px 0 var(--lip-h); }
  .both { align-self: center; margin: 0 0 var(--lip-h); }
  .ask { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .tools { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .tool { flex-direction: column; gap: 2px; padding: 4px 0 2px; min-height: 52px; }
  .tool span { font: 700 var(--fs-talk)/1 var(--font-num); }
  .tool.b span { font-weight: 800; }
  .tool.i span { font-style: italic; }
  .tool small { font: 700 var(--fs-xs)/1 var(--font-ui); color: var(--text-soft); }
  /* the field takes the room left (the head and the tabs are away while writing), never under 160px */
  textarea {
    flex: 1 0 160px; width: 100%; box-sizing: border-box; resize: none; padding: 12px 14px; border: 0; border-radius: 16px;
    font: 500 var(--fs-input)/1.6 var(--font-ui); color: var(--c-ink); background: #FFF8EC; box-shadow: inset 0 0 0 2px var(--c-edge);
  }
  textarea:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .level-acts { margin-top: -12px; }
</style>
