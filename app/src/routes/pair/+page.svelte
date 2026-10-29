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
  import OfficialArt from '#lib/components/OfficialArt.svelte';

  let code = $state('');
  let busy = $state(false);
  let msg = $state('');
  let standalone = $state(true);
  /** On-screen keyboard height (style guide §R): the button rides above it. */
  let kb = $state(0);

  const ready = $derived(/^[0-9a-f]{16,128}$/.test(code));

  onMount(() => {
    const vv = window.visualViewport;
    const onVV = () => vv && (kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)));
    vv?.addEventListener('resize', onVV);
    vv?.addEventListener('scroll', onVV);
    standalone = isStandalone();
    const fromHash = keyFromHash(location.hash);
    if (fromHash) {
      history.replaceState(history.state, '', location.pathname + location.search); // don't leave the key in the URL
      code = fromHash;
      void pair();
    }
    return () => {
      vv?.removeEventListener('resize', onVV);
      vv?.removeEventListener('scroll', onVV);
    };
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

<!-- Style guide v4 §R.7: the dodo airport brings you to the island; しずえ greets you; paste the key. -->
<main class="pair" style:--kb="{kb}px">
  <button type="button" class="lang pill" onclick={() => setLocale(i18n.locale === 'ja' ? 'en' : 'ja')}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-globe" /></svg>{i18n.locale === 'ja' ? 'English' : '日本語'}
  </button>

  <div class="port" aria-hidden="true"><OfficialArt key="deco/airport" width="100%" eager /></div>

  <Bubble text={t('pair.title')} host="wave" size="var(--pair-host)" />

  <form class="miles" style:--card="var(--card-teal)" onsubmit={submit}>
    <label class="lbl" for="code">{t('pair.code')}</label>
    <input
      id="code"
      class="code money"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      inputmode="text"
      enterkeyhint="go"
      placeholder="••••••"
      value={code}
      oninput={onInput}
      onfocus={(e) => {
        const el = e.currentTarget;
        const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
        setTimeout(() => el.scrollIntoView({ block: 'center', behavior }), 300);
      }}
      aria-describedby="pair-msg"
    />
    <p id="pair-msg" class="msg" role="status">{msg}</p>
    <div class="go"><button type="submit" class="btn" disabled={!ready || busy}>{t('pair.go')}</button></div>
  </form>
  <p class="hint" class:strong={!standalone}>{t('pair.hint')}</p>
</main>

<style>
  .pair {
    --pair-host: 72px;
    max-width: 420px; margin: 0 auto; min-height: 100dvh; display: flex; flex-direction: column; align-items: stretch; justify-content: center;
    gap: 14px; position: relative;
    padding: calc(var(--safe-top) + 60px) calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 20px) calc(var(--side) + var(--safe-left));
  }
  .lang { position: absolute; top: calc(var(--safe-top) + 8px); right: calc(var(--side) + var(--safe-right)); cursor: pointer; min-height: 44px; padding: 0 14px; }
  .lang svg { width: 18px; height: 18px; }
  .port { width: 220px; margin: 0 auto; filter: drop-shadow(0 6px 0 rgba(74, 58, 44, .1)); }
  .pair :global(.talk) { height: calc(var(--pair-host) + 4px); }
  form { display: grid; gap: 8px; padding: 14px 16px 10px; }
  .lbl { font-weight: 900; font-size: var(--fs-h2); text-align: center; }
  .code {
    width: 100%; min-height: 56px; text-align: center; font-size: 1.1rem !important; letter-spacing: .02em !important;
    border-radius: var(--r-sm); border: var(--bw) solid color-mix(in srgb, var(--card) 70%, #000 30%); background: var(--c-bubble); color: var(--c-ink); box-shadow: var(--sh-inset);
  }
  .code::placeholder { color: var(--c-ink-soft); opacity: .5; }
  .msg { min-height: 1.4em; margin: 0; color: var(--c-coral-ink); font-weight: 700; text-align: center; }
  /* The button rides above the keyboard. */
  .go { position: sticky; bottom: calc(var(--safe-bottom) + 8px); transform: translateY(calc(-1 * var(--kb))); }
  .hint { margin: 0; text-align: center; color: var(--text-soft); padding: 10px 14px; font-weight: 700; font-size: var(--fs-caption); }
  .hint.strong { background: var(--c-sky-soft); color: var(--c-ink); border-radius: var(--r-sm); }
  @media (max-height: 700px), (max-width: 359px) {
    .pair { --pair-host: 56px; gap: 10px; }
    .port { width: 160px; }
  }
  @media (max-height: 599px) { .port { display: none; } }
</style>
