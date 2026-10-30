<script lang="ts">
  // Pairing (ADR 0015): paste your key, or open `…/pair#key=…` once inside the installed PWA (storage is per-app on
  // iOS). `whoami` confirms the person; the key is kept in localStorage and sent in each request body.
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { week } from '#lib/store/week.svelte.ts';
  import { keyFromHash, setKey } from '#lib/sync/pairing.ts';
  import { whoami } from '#lib/sync/transport.ts';
  import { isStandalone } from '#lib/ui-state/standalone.ts';
  import { onMount } from 'svelte';
  import { t, i18n, setLocale } from '#lib/i18n/index.ts';
  import Bubble from '#lib/components/ui/Bubble.svelte';
  import OfficialArt from '#lib/components/characters/OfficialArt.svelte';
  import { keyboardInset } from '#lib/components/ui/keyboardInset.ts';

  let code = $state('');
  let busy = $state(false);
  let msg = $state('');
  let standalone = $state(true);

  const ready = $derived(/^[0-9a-f]{32,128}$/.test(code));

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

<!-- Style guide v4 §R.7: the dodo airport brings you to the island; しずえ greets you; paste the key. -->
<!-- The key field and the button ride above the on-screen keyboard (--kb, keyboardInset): the page gains --kb of
     bottom padding so it can scroll, and on focus the whole form (field + つなぐ) scrolls to just above the keyboard
     (data-kb-scroll). Round 10 H3: no transform and no sticky lift, which moved the button over the art or the field. -->
<main class="pair" {@attach keyboardInset}>
  <button type="button" class="lang" onclick={() => setLocale(i18n.locale === 'ja' ? 'en' : 'ja')}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-globe" /></svg>{i18n.locale === 'ja' ? 'English' : '日本語'}
  </button>

  <div class="port" aria-hidden="true"><OfficialArt key="deco/airport" width="100%" eager /></div>

  <Bubble text={t('pair.title')} host="wave" size="var(--pair-host)" />

  <form class="card" onsubmit={submit} data-kb-scroll>
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
      aria-describedby="pair-msg"
    />
    <!-- A key that can't be right yet (too short) says what a key looks like, instead of a silent grey button (N8). -->
    <p id="pair-msg" class="msg" class:info={!msg} role="status">{msg || (code && !ready ? t('pair.keyHint') : '')}</p>
    <button type="submit" class="btn" disabled={!ready || busy}>{t('pair.go')}</button>
  </form>
  <p class="hint" class:strong={!standalone}>{t('pair.hint')}</p>
</main>

<style>
  .pair {
    --pair-host: 72px;
    max-width: 420px; margin: 0 auto; min-height: var(--vh-page); display: flex; flex-direction: column; align-items: stretch; justify-content: center;
    gap: 14px; position: relative;
    padding: calc(var(--safe-top) + 60px) calc(var(--side) + var(--safe-right)) calc(var(--safe-bottom) + 20px + var(--kb, 0px)) calc(var(--side) + var(--safe-left));
  }
  .lang {
    position: absolute; top: calc(var(--safe-top) + 8px); right: calc(var(--side) + var(--safe-right)); cursor: pointer; min-height: 44px; padding: 0 14px;
    display: inline-flex; align-items: center; gap: 6px; border: 0; border-radius: var(--r-btn); background: var(--c-card); color: var(--c-ink);
    box-shadow: var(--sh-obj); font: 700 var(--fs-body)/1 var(--font-ui);
  }
  .lang svg { width: 18px; height: 18px; }
  .port { width: 220px; margin: 0 auto; }
  /* しずえ's only instruction here: always room for 2 lines, also on compact screens (N4 / C33). */
  .pair :global(.talk) { --talk-lines: 2; min-height: calc(var(--pair-host) + 4px); }
  form { display: grid; gap: 8px; padding: 14px 16px 10px; }
  .lbl { font-weight: 700; font-size: var(--fs-talk); text-align: center; }
  .code {
    width: 100%; min-height: 56px; text-align: center; font-size: max(var(--fs-input), 1.1rem) !important; letter-spacing: .02em !important;
    border-radius: var(--r-btn); border: 0; background: var(--c-card); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), inset 0 4px 0 var(--c-lip);
  }
  .code::placeholder { color: var(--c-ink-soft); opacity: .5; }
  .msg { min-height: 1.4em; margin: 0; font-weight: 700; text-align: center; }
  .msg:not(.info):not(:empty) { background: var(--c-coral); color: var(--c-ink); border-radius: var(--r-chip); padding: 4px 8px; }
  .msg.info { color: var(--text-soft); font-size: var(--fs-s); }
  .hint { margin: 0; text-align: center; color: var(--text-soft); padding: 10px 14px; font-weight: 700; font-size: var(--fs-s); }
  .hint.strong { background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-btn); }
  @media (max-height: 700px), (max-width: 359px) {
    .pair { --pair-host: 56px; gap: 10px; }
    .port { width: 160px; }
  }
  @media (max-height: 599px) { .port { display: none; } }
</style>
