<script lang="ts">
  // けっこんしき's メモ (docs/wedding.md "Notes"): the one shared note as a document (16/1.65 in a card), rendered from its
  // small markdown (Markdown.svelte), who saved it last over it (「11月4日に はなこ が更新」; the old Sheet's note says
  // so instead). A member's 編集 (in the title bar) opens the field with the format tools at its foot, over the
  // keyboard (見出し, 太字, リスト, リンク: lib/wedding/markdown.ts' toggles, the selection kept) and 完了; the draft and
  // its save are notepad.svelte.ts'. When the store flags a conflict (two saves crossed) both versions show instead,
  // each under its writer (mine marked), with これに する (とりけす on its banner) and ふたつ あわせる (the editor with
  // both). The guest reads only.
  import { tick } from 'svelte';
  import Markdown from './Markdown.svelte';
  import Icon, { type IconName } from '../quiet/Icon.svelte';
  import { board } from './board.svelte.ts';
  import { merge, pad, pick, save } from './notepad.svelte.ts';
  import { toggleBold, toggleBullets, toggleHeading, type Edit } from '#lib/wedding/markdown.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { t } from '#lib/i18n/index.ts';
  import { todayIn } from '#lib/time/zone.ts';
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
  const updated = $derived(note && !note.imported && pad.picked === null ? t('wed.note.updated', { date: formatDate(todayIn(board.config.tz, note.at)), name: names[note.who] }) : '');

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
  const TOOLS: readonly { k: string; fn: (text: string, a: number, b: number) => Edit; icon: IconName }[] = [
    { k: 'h', fn: toggleHeading, icon: 'heading' },
    { k: 'b', fn: toggleBold, icon: 'bold' },
    { k: 'ul', fn: toggleBullets, icon: 'list' },
    { k: 'link', fn: toggleLink, icon: 'link' }
  ];
</script>

{#if pad.editing}
  <div class="editor">
    <div class="pad">
      <textarea class="q-card" bind:this={area} bind:value={pad.draft} maxlength={WNOTE_CHARS} aria-label={t('wed.note.field')} data-wed-note-field data-sfx="none"></textarea>
    </div>
    <div class="tools" role="toolbar" aria-label={t('wed.note.fmt')}>
      {#each TOOLS as tl (tl.k)}
        <button type="button" class="tool" aria-label={t(`wed.note.${tl.k}`)} data-wed-fmt={tl.k} data-sfx="tick"
          onpointerdown={(e) => e.preventDefault()} onclick={() => fmt(tl.fn)}><Icon name={tl.icon} size={20} /></button>
      {/each}
      <button type="button" class="q-btn text done" data-wed-note-save data-sfx="confirm" onclick={save}>{t('common.done')}</button>
    </div>
  </div>
{:else if versions.length}
  <div class="pad">
    <p class="ask" data-wed-conflict>{t('wed.note.conflict')}</p>
    {#each versions as [k, v] (k)}
      <article class="q-card ver" data-wed-version={k} data-wed-who={v.who}>
        <h4 class="whose">{t('wed.note.whose', { name: names[v.who] })}{#if v.who === board.me}<span class="q-badge mine" data-wed-mine>{t('wed.note.mine')}</span>{/if}</h4>
        <div class="vdoc"><Markdown text={v.md} /></div>
        <button type="button" class="q-btn primary" data-wed-pick={k} data-sfx="confirm" onclick={() => pick(v.md)}>{t('wed.note.pick')}</button>
      </article>
    {/each}
    {#if versions.length === 2}
      <button type="button" class="q-btn both" data-wed-merge data-sfx="open" onclick={merge}>{t('wed.note.merge')}</button>
    {/if}
  </div>
{:else}
  <div class="pad">
    {#if note?.imported && pad.picked === null}<p class="by" data-wed-imported>{t('wed.imported.note')}</p>{:else if updated}<p class="by">{updated}</p>{/if}
    <article class="q-card doc" data-wed-letter>
      {#if md.trim()}
        <Markdown text={md} />
      {:else}
        <p class="none">{t('wed.note.empty')}</p>
      {/if}
    </article>
  </div>
{/if}

<style>
  .pad { padding: 4px 16px 16px; display: flex; flex-direction: column; gap: 10px; }
  .by { margin: 0 4px; font-size: var(--q-fs-s); color: var(--q-muted); }
  .doc { padding: 20px; }
  .none { margin: 0; color: var(--q-muted); }
  .ask { margin: 4px 4px 0; font-size: var(--q-fs-body); line-height: 1.5; }
  .ver { padding: 16px 18px; display: grid; gap: 10px; }
  .whose { margin: 0; display: flex; align-items: center; gap: 8px; font: var(--q-w-b) var(--q-fs-s)/1.3 var(--q-font); color: var(--q-muted); }
  /* each version scrolls on its own: both choices in reach */
  .vdoc { max-height: 30dvh; overflow: auto; overscroll-behavior: contain; }
  .ver .q-btn { justify-self: end; }
  .both { align-self: center; }
  /* writing: the field takes the room, the tools at its foot over the keyboard */
  .editor { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .editor .pad { flex: 1; min-height: 0; padding-bottom: 10px; }
  textarea {
    flex: 1; min-height: 160px; width: 100%; box-sizing: border-box; resize: none; padding: 18px 20px; border-color: var(--q-accent);
    box-shadow: 0 0 0 3px var(--q-accent-soft); font: 400 16px/1.65 var(--q-font); color: var(--q-ink); background: var(--q-surface);
  }
  textarea:focus { outline: none; }
  .tools {
    flex: none; display: flex; align-items: center; gap: 2px; height: 48px; padding: 0 8px 0 6px; margin-bottom: var(--kb, 0px);
    border-top: 1px solid var(--q-hairline); background: var(--q-tabbg);
  }
  .tool { appearance: none; border: 0; background: none; cursor: pointer; width: 44px; height: 44px; display: grid; place-items: center; color: var(--q-ink); border-radius: 10px; }
  .tool:active { background: var(--q-sunken); }
  .tool:focus-visible { outline: 2px solid var(--q-accent); outline-offset: -4px; }
  .done { margin-left: auto; }
</style>
