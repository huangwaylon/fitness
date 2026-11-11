<script lang="ts">
  // 結婚式's メモ (docs/wedding.md "Notes"): the one shared note as a letter (cream paper with grain, a rose band at
  // its head, rules every 30px under the text, a tilted heart stamp; a game object: cream at every time of day),
  // rendered from its small markdown (Markdown.svelte), 「ふたりのメモ」 over it and who saved it last
  // (「11月4日に はなこ が更新」; the old Sheet's note says so instead). A member's 編集 (on the letter) opens the field
  // with the format tools at its foot, over the keyboard (見出し, 太字, リスト, リンク: lib/wedding/markdown.ts' toggles, the
  // selection kept), キャンセル and 保存; the draft and its save are notepad.svelte.ts'. When the store flags a conflict (two saves
  // crossed) both versions show instead, each a small letter under its writer (mine marked), with これにする (とりけす
  // on its banner) and ふたつを合わせる (the editor with both). The guest reads only.
  import { tick } from 'svelte';
  import Markdown from './Markdown.svelte';
  import Icon, { type IconName } from '../ui/Icon.svelte';
  import { board } from './board.svelte.ts';
  import { cancel, merge, pad, pick, save, write } from './notepad.svelte.ts';
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
      <textarea class="field" bind:this={area} bind:value={pad.draft} maxlength={WNOTE_CHARS} aria-label={t('wed.note.field')} data-wed-note-field data-sfx="none"></textarea>
    </div>
    <div class="tools" role="toolbar" aria-label={t('wed.note.fmt')}>
      {#each TOOLS as tl (tl.k)}
        <button type="button" class="tool" aria-label={t(`wed.note.${tl.k}`)} data-wed-fmt={tl.k} data-sfx="tick"
          onpointerdown={(e) => e.preventDefault()} onclick={() => fmt(tl.fn)}><Icon name={tl.icon} size={20} /></button>
      {/each}
      <button type="button" class="btn small paper done" data-wed-note-cancel data-sfx="back" onclick={cancel}>{t('common.cancel')}</button>
      <button type="button" class="btn small" data-wed-note-save data-sfx="confirm" onclick={save}>{t('common.save')}</button>
    </div>
  </div>
{:else if versions.length}
  <div class="pad">
    <p class="ask" data-wed-conflict>{t('wed.note.conflict')}</p>
    {#each versions as [k, v] (k)}
      <article class="letter small grain" data-wed-version={k} data-wed-who={v.who}>
        <h4 class="whose">{t('wed.note.whose', { name: names[v.who] })}{#if v.who === board.me}<span class="sticker leaf" data-wed-mine>{t('wed.note.mine')}</span>{/if}</h4>
        <div class="vdoc"><Markdown text={v.md} /></div>
        <button type="button" class="btn small" data-wed-pick={k} data-sfx="confirm" onclick={() => pick(v.md)}>{t('wed.note.pick')}</button>
      </article>
    {/each}
    {#if versions.length === 2}
      <button type="button" class="btn small paper both" data-wed-merge data-sfx="open" onclick={merge}>{t('wed.note.merge')}</button>
    {/if}
  </div>
{:else}
  <div class="pad">
    <article class="letter grain" data-wed-letter>
      <span class="stamp" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 20.5s-7.5-4.6-7.5-10.1C4.5 7.6 6.6 5.5 9.2 5.5c1.3 0 2.2.6 2.8 1.5.6-.9 1.5-1.5 2.8-1.5 2.6 0 4.7 2.1 4.7 4.9 0 5.5-7.5 10.1-7.5 10.1z" /></svg></span>
      <h4 class="whose">{t('wed.note.title')}</h4>
      {#if note?.imported && pad.picked === null}<p class="by" data-wed-imported>{t('wed.imported.note')}</p>{:else if updated}<p class="by">{updated}</p>{/if}
      {#if md.trim()}
        <Markdown text={md} />
      {:else}
        <p class="none">{t('wed.note.empty')}</p>
      {/if}
      {#if board.canEdit && !board.conflict}
        <button type="button" class="btn small paper write" data-wed-note-edit data-sfx="open" onclick={write}><Icon name="edit" size={18} />{t('common.edit')}</button>
      {/if}
    </article>
  </div>
{/if}

<style>
  .pad { padding: 10px 12px 16px; display: flex; flex-direction: column; gap: 10px; }
  /* the letter: a game object, cream at every time of day (the day's ink and controls inside it), a rose band at its
     head, the hand-cut corners, the lip; the rules are Markdown's lines (30px each, so the text sits on them) */
  .letter, .field {
    --text: var(--c-ink); --text-soft: var(--c-ink-soft); --leaf-text: var(--c-leaf-text); --coral-text: var(--c-coral-text);
    --card: var(--c-card); --ctl: var(--c-card); --edge: var(--c-edge); --lip: var(--c-lip); --focus: var(--c-ink); --hl: color-mix(in srgb, var(--c-yuzu) 30%, transparent);
    --rose-soft: color-mix(in srgb, var(--c-rose) 30%, var(--c-cream));
    --rose-ink: color-mix(in srgb, var(--c-rose) 40%, var(--c-ink));
    color: var(--text); background-color: var(--c-cream);
  }
  .letter {
    position: relative; display: grid; padding: 22px 18px 18px; border-radius: 18px 22px 20px 24px; overflow: hidden;
    box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 8px 18px rgb(80 50 30 / .1);
  }
  .letter::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 10px; background: var(--c-rose); }
  .letter :global(.doc) { background: repeating-linear-gradient(transparent 0 28.5px, var(--rose-soft) 28.5px 30px); }
  .whose { margin: 4px 0 6px; display: flex; align-items: center; gap: 8px; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }
  .by { margin: 0 0 8px; font-size: var(--fs-s); line-height: 1.4; color: var(--text-soft); }
  .stamp {
    position: absolute; top: 20px; right: 16px; width: 38px; height: 44px; display: grid; place-items: center; transform: rotate(8deg);
    background: color-mix(in srgb, var(--c-rose) 12%, var(--c-cream)); border-radius: 4px;
    box-shadow: 0 0 0 2px var(--rose-soft), 0 0 0 4px var(--c-cream), 0 0 0 5px var(--rose-soft);
  }
  .stamp svg { width: 24px; height: 24px; fill: var(--c-rose); }
  .letter:not(.small) .whose, .letter:not(.small) .by { padding-right: 52px; }
  .none { margin: 0; color: var(--text-soft); line-height: 30px; }
  .write { justify-self: end; margin: 14px 0 var(--lip-h); gap: 6px; }
  .ask { margin: 4px 4px 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .letter.small { padding-top: 18px; gap: 8px; }
  /* each version scrolls on its own: both choices in reach */
  .vdoc { max-height: 30dvh; overflow: auto; overscroll-behavior: contain; }
  .letter.small .btn { justify-self: end; margin: 4px 0 var(--lip-h); }
  .both { align-self: center; margin: 0 0 var(--lip-h); }
  /* writing: the field (the letter's paper, ruled) takes the room, the tools at its foot over the keyboard */
  .editor { flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .editor .pad { flex: 1; min-height: 0; padding-bottom: 10px; }
  textarea {
    flex: 1; min-height: 160px; width: 100%; box-sizing: border-box; resize: none; padding: 14px 16px; border: 0; border-radius: var(--r-row);
    font: 400 var(--fs-input)/30px var(--font-body); box-shadow: inset 0 0 0 2px var(--edge), 0 var(--lip-s) 0 var(--c-lip);
    background-image: repeating-linear-gradient(transparent 0 28.5px, var(--rose-soft) 28.5px 30px); background-origin: content-box; background-attachment: local;
  }
  textarea:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the tools: the tab bar's dock plate in its place */
  .tools {
    flex: none; position: relative; display: flex; align-items: center; gap: 2px; min-height: 56px; margin-bottom: var(--kb, 0px);
    padding: 4px calc(8px + var(--safe-right)) max(calc(var(--safe-bottom) - var(--kb, 0px)), 4px) calc(6px + var(--safe-left));
    background: var(--card); box-shadow: 0 -2px 0 var(--lip);
  }
  .tools::before { content: ''; position: absolute; top: 3px; left: 12px; right: 12px; border-top: 1.5px dashed var(--stitch); pointer-events: none; }
  .tool {
    appearance: none; border: 0; background: none; cursor: pointer; width: var(--hit); height: var(--hit); display: grid; place-items: center;
    color: var(--text); border-radius: var(--r-chip); -webkit-tap-highlight-color: transparent;
  }
  .tool:active { background: var(--hl); }
  .tool:focus-visible { outline-offset: -4px; }
  .tools .btn { margin: 0 0 var(--lip-h); padding: 0 14px; }
  .done { margin-left: auto; }
</style>
