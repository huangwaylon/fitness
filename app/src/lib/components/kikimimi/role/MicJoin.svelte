<script lang="ts">
  // A mic game's さんか (docs/kikimimi-mic.md "Consent", "The privacy rule"): before joining another's ロールプレイ, what it asks of
  // this phone. With the mic on: 「マイクを使います」, that my voice never goes to the partner's phone, 参加する / やめる
  // (joining is the consent: nothing more on the wire). With the mic off: it says so and how to turn it on, 閉じる; no
  // join. Its own chunk (the sheet's veil, loaded at the tap).
  import '#lib/i18n/kiki-role.ts';
  import { t } from '#lib/i18n/index.ts';

  let { on, onjoin, oncancel }: { on: boolean; onjoin: () => void; oncancel: () => void } = $props();
</script>

<div class="veil" role="alertdialog" aria-modal="true" aria-labelledby="kk-micjoin" data-kiki-mic-join={on ? 'ask' : 'off'}>
  <div class="ask card">
    <p class="ic" aria-hidden="true">🎤</p>
    <h3 id="kk-micjoin">{t(on ? 'kiki.role.join.title' : 'kiki.role.join.offTitle')}</h3>
    <p>{t(on ? 'kiki.role.join.body' : 'kiki.role.join.offBody')}</p>
    <div class="row">
      {#if on}
        <button type="button" class="btn paper small" data-kiki-mic-join-no data-sfx="back" onclick={oncancel}>{t('kiki.role.join.no')}</button>
        <button type="button" class="btn small" data-kiki-mic-join-yes data-sfx="confirm" onclick={onjoin}>{t('kiki.role.join.yes')}</button>
      {:else}
        <button type="button" class="btn small" data-kiki-mic-join-no data-sfx="back" onclick={oncancel}>{t('kiki.role.join.close')}</button>
      {/if}
    </div>
  </div>
</div>

<style>
  .veil { position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 24px; background: var(--scrim); }
  .ask { display: grid; justify-items: center; gap: 10px; width: min(100%, 320px); box-sizing: border-box; padding: 20px 18px 16px; text-align: center; color: var(--text); }
  .ic { margin: 0; font: 700 32px/1 var(--font-ui); }
  h3 { margin: 0; font: 700 var(--fs-title)/1.3 var(--font-ui); color: var(--text); }
  p { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); color: var(--text-soft); }
  .row { display: flex; gap: 10px; width: 100%; }
  .row .btn { flex: 1; min-height: var(--hit); }
</style>
