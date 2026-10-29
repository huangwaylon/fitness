<script lang="ts">
  // Pairing (ADR 0015): paste your key, or open `…/pair#key=…` once inside the installed PWA (storage is per-app on
  // iOS). `whoami` confirms the person; the key is kept in localStorage and sent in each request body.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { week } from '#lib/client/week.svelte.ts';
  import { keyFromHash, setKey, whoami } from '#lib/client/gas.ts';
  import { isStandalone } from '#lib/client/standalone.ts';
  import { onMount } from 'svelte';
  import { t, i18n, setLocale } from '#lib/i18n/index.ts';
  import Bubble from '#lib/components/Bubble.svelte';
  import Host from '#lib/components/Host.svelte';

  let code = $state('');
  let busy = $state(false);
  let msg = $state('');
  let standalone = $state(true);

  const ready = $derived(/^[0-9a-f]{16,128}$/.test(code));

  onMount(() => {
    standalone = isStandalone();
    const fromHash = keyFromHash(location.hash);
    if (fromHash) {
      history.replaceState(history.state, '', location.pathname + location.search); // don't leave the key in the URL
      code = fromHash;
      void pair();
    }
  });

  function onInput(e: Event) {
    code = (e.currentTarget as HTMLInputElement).value.replace(/[^0-9a-fA-F]/g, '').toLowerCase().slice(0, 128);
    msg = '';
  }

  async function pair() {
    if (!ready || busy) return;
    busy = true;
    const r = await whoami(code);
    busy = false;
    if (r.ok) {
      setKey(code, r.me);
      week.reset();
      void week.refresh();
      await goto(resolve('/'));
    } else {
      msg = r.error === 'unauthorized' || r.error === 'bad_request' ? t('pair.wrong') : t('pair.wait');
      if (r.error === 'unauthorized') code = '';
    }
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    void pair();
  }
</script>

<main class="pair">
  <button type="button" class="lang pill" onclick={() => setLocale(i18n.locale === 'ja' ? 'en' : 'ja')}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-globe" /></svg>{i18n.locale === 'ja' ? 'English' : '日本語'}
  </button>

  <div class="island" aria-hidden="true">
    <svg viewBox="0 0 240 120">
      <ellipse cx="120" cy="96" rx="116" ry="22" fill="var(--sea)" opacity=".5" />
      <ellipse cx="120" cy="88" rx="96" ry="22" fill="var(--beach)" stroke="var(--beach-edge)" stroke-width="3" />
      <ellipse cx="120" cy="82" rx="78" ry="15" fill="var(--grass)" />
      <path d="M150 82 Q144 52 160 28" stroke="var(--trunk)" stroke-width="6" fill="none" stroke-linecap="round" />
      <path d="M160 28 Q140 14 124 26 M160 28 Q182 10 200 22 M160 28 Q156 6 138 8 M160 28 Q176 36 180 54" stroke="var(--tree-leaf-2)" stroke-width="8" fill="none" stroke-linecap="round" />
    </svg>
    <span class="host"><Host size={96} /></span>
  </div>

  <Bubble text={t('pair.title')} host={false} />

  <form class="card" onsubmit={submit}>
    <span class="tape" style:--tape="var(--c-sky-soft)">{t('pair.code')}</span>
    <label class="sr-only" for="code">{t('pair.code')}</label>
    <input
      id="code"
      class="code money"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="••••••"
      value={code}
      oninput={onInput}
      aria-describedby="pair-msg"
    />
    <p id="pair-msg" class="msg" role="status">{msg}</p>
    <button type="submit" class="btn" disabled={!ready || busy}>{t('pair.go')}</button>
  </form>
  <p class="hint" class:strong={!standalone}>{t('pair.hint')}</p>
</main>

<style>
  .pair {
    max-width: 420px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; align-items: stretch; justify-content: center;
    gap: 14px; position: relative;
    padding: calc(var(--safe-top) + 56px) calc(20px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(20px + var(--safe-left));
  }
  .lang { position: absolute; top: calc(var(--safe-top) + 12px); right: calc(20px + var(--safe-right)); cursor: pointer; min-height: 44px; }
  .lang svg { width: 18px; height: 18px; }
  .island { position: relative; width: 240px; margin: 0 auto; }
  .island > svg:first-child { width: 240px; height: 120px; display: block; }
  .host { position: absolute; left: 52px; bottom: 24px; }
  form { display: grid; gap: 8px; padding: 26px 16px 12px; margin-top: 8px; }
  .code {
    width: 100%; min-height: 72px; text-align: center; font-size: 1.1rem !important; letter-spacing: .02em !important;
    border-radius: var(--r-lg); border: var(--bw) solid var(--edge); background: var(--bg); color: var(--text); box-shadow: var(--sh-inset);
  }
  .code::placeholder { color: var(--text-faint); opacity: .5; }
  .msg { min-height: 1.4em; margin: 0; color: var(--c-coral-ink); font-weight: 700; text-align: center; }
  :global(:root[data-theme="night"]) .msg { color: var(--c-coral); }
  .hint { margin: 0; text-align: center; color: var(--text-soft); padding: 10px 14px; font-weight: 700; font-size: var(--fs-caption); }
  .hint.strong { background: var(--c-sky-soft); color: var(--c-ink); border-radius: var(--r-sm); }
</style>
