<script lang="ts">
  // Pairing: a one-time 6-digit code, entered inside the installed PWA (cookies are per-app on iOS).
  import { goto } from '$app/navigation';
  import { postJSON } from '#lib/client/api.ts';
  import { week } from '#lib/client/week.svelte.ts';
  import { isStandalone } from '#lib/client/push.ts';
  import { onMount } from 'svelte';
  import { t, i18n, setLocale } from '#lib/i18n/index.ts';

  let code = $state('');
  let busy = $state(false);
  let msg = $state('');
  let standalone = $state(true);

  onMount(() => {
    standalone = isStandalone();
  });

  const ready = $derived(/^\d{6}$/.test(code));

  function onInput(e: Event) {
    code = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
    msg = '';
  }

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    busy = true;
    const r = await postJSON('/api/pair', { code });
    busy = false;
    if (r.ok) {
      await week.refresh();
      await goto('/');
    } else {
      msg = r.status === 429 ? t('pair.wait') : t('pair.wrong');
      code = '';
    }
  }
</script>

<main class="pair">
  <button type="button" class="lang pill" onclick={() => setLocale(i18n.locale === 'ja' ? 'en' : 'ja')}>
    {i18n.locale === 'ja' ? 'English' : '日本語'}
  </button>
  <svg class="juni" viewBox="0 0 100 100" aria-hidden="true"><use href="#v-juni" /></svg>
  <h1>{t('pair.title')}</h1>
  <p class="hint" class:strong={!standalone}>{t('pair.hint')}</p>

  <form onsubmit={submit}>
    <label class="sr-only" for="code">{t('pair.code')}</label>
    <input
      id="code"
      class="code money"
      inputmode="numeric"
      autocomplete="one-time-code"
      pattern="[0-9]*"
      maxlength="6"
      placeholder="••••••"
      value={code}
      oninput={onInput}
      aria-describedby="pair-msg"
    />
    <p id="pair-msg" class="msg" role="status">{msg}</p>
    <button type="submit" class="btn" disabled={!ready || busy}>{t('pair.go')}</button>
  </form>
</main>

<style>
  .pair {
    max-width: 420px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; text-align: center; position: relative;
    padding: calc(var(--safe-top) + 24px) calc(24px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(24px + var(--safe-left));
  }
  .lang { position: absolute; top: calc(var(--safe-top) + 12px); right: calc(20px + var(--safe-right)); cursor: pointer; min-height: 44px; }
  .juni { width: 110px; height: 110px; animation: breathe 3.2s ease-in-out infinite; transform-origin: 50% 100%; }
  h1 { font-size: var(--fs-h1); }
  .hint { margin: 0; color: var(--text-soft); font-weight: 700; }
  .hint.strong { background: var(--sky-pale); color: var(--ink); border-radius: var(--r-sm); padding: 10px 14px; }
  form { width: 100%; display: grid; gap: 10px; margin-top: 12px; }
  .code {
    width: 100%; min-height: 72px; text-align: center; font-size: 2.4rem !important; letter-spacing: .3em !important;
    border-radius: var(--r-lg); border: 2.5px solid var(--edge); background: var(--surface); color: var(--text); box-shadow: var(--sh-inset);
  }
  .code::placeholder { color: var(--text-faint); opacity: .5; }
  .msg { min-height: 1.4em; margin: 0; color: var(--coral-ink); font-weight: 700; }
  :global(:root[data-theme="night"]) .msg { color: var(--coral); }
</style>
