<script lang="ts">
  // The editor's reset, asked first (the user, 2026-11-09: anyone may reset, the guest too, once 「リセット」 is typed):
  // the app's paper sheet (ui/Sheet: focus kept inside, Esc and the backdrop close it) saying what goes, a field that
  // turns リセットする on only at 「リセット」, and やめる focused, the default. Resetti (リセットさん, NH's own head icon:
  // visitorRoles.ts CAST) asks first, in his balloon.
  import Sheet from '../ui/Sheet.svelte';
  import { staticUrl } from '#lib/staticUrl.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    open: boolean;
    onconfirm: () => void;
  }
  let { open = $bindable(), onconfirm }: Props = $props();

  const WORD = 'リセット';
  let typed = $state('');
  const ok = $derived(typed.trim() === WORD);
  // each opening starts empty
  $effect(() => {
    if (open) typed = '';
  });

  function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!ok) return;
    open = false;
    onconfirm();
  }
</script>

<Sheet bind:open label="島のリセット" title="島のリセット">
  <form class="ask" data-reset-ask onsubmit={submit}>
    <div class="resetti" data-resetti>
      <img src={staticUrl('room/npc/resetti.webp')} alt={t('cast.name.resetti')} width="56" height="56" />
      <p class="kana">{t('chat.sp.resetti.reset')}</p>
    </div>
    <p>島のレイアウトを初期状態に戻します。置いたものはすべて元に戻ります。</p>
    <p class="soft">地形や木・家具の配置の変更が消えます（家の見た目は残ります）。</p>
    <label>
      <span>確認のため「{WORD}」と入力してください</span>
      <input type="text" bind:value={typed} autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" data-reset-word data-sfx="none" />
    </label>
    <div class="two">
      <button type="submit" class="btn danger" disabled={!ok} data-confirm-reset>リセットする</button>
      <button type="button" class="btn paper" data-sfx="back" data-reset-cancel {@attach (el) => queueMicrotask(() => el.focus())}
        onclick={() => (open = false)}>やめる</button>
    </div>
  </form>
</Sheet>

<style>
  .ask { display: grid; gap: 14px; padding: 0 0 8px; }
  .resetti { display: flex; align-items: center; gap: 10px; }
  .resetti img { flex: none; width: 56px; height: 56px; }
  .resetti p { white-space: pre-line; word-break: keep-all; padding: 8px 12px; border-radius: 16px; background: var(--ctl); box-shadow: var(--sh-ctl); font-size: var(--fs-body); }
  p { margin: 0; font: 700 var(--fs-talk)/1.45 var(--font-ui); }
  .soft { font: 400 var(--fs-body)/1.45 var(--font-ui); color: var(--text-soft); }
  label { display: grid; gap: 6px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  input {
    width: 100%; min-height: var(--hit); padding: 6px 12px; border: 0; border-radius: var(--r-btn);
    font: 700 max(var(--fs-input), var(--fs-talk))/1.1 var(--font-ui); color: var(--text); background: var(--ctl);
    box-shadow: inset 0 0 0 2px var(--edge);
  }
  input:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .two .btn { margin: 0; min-height: max(44px, var(--cta-h)); }
</style>
