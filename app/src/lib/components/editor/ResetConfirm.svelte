<script lang="ts">
  // The editor's reset, asked first (the user, 2026-11-09: anyone may reset, the guest too, once 「リセット」 is typed):
  // the app's paper sheet (ui/Sheet: focus kept inside, Esc and the backdrop close it) saying what goes, a field that
  // turns リセットする on only at 「リセット」, and やめる focused, the default.
  import Sheet from '../ui/Sheet.svelte';

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
