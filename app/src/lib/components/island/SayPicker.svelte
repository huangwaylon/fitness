<script lang="ts">
  // What my villager says (docs/design.md "Villager taps"): the say button at the island's bottom right (SayButton)
  // opens this small NH-style picker above it (the reactions wheel's spirit in the app's cream): six preset phrases
  // (greetings and cheer), my own last few (kept on this phone, island/say.ts) and 「じぶんで かく…」, a field of SAY_MAX
  // characters with いう (Enter sends). A pick closes it and is said (IslandScene: the balloon over my villager on both
  // phones). ✕, Esc or a tap anywhere else closes it (on the ground that tap only closes: it walks nobody; on the
  // button again it only closes). It stands above the button, its right edge at the button's (inside the screen, EDGE
  // from its sides), above the keyboard while one is up; it sits outside the scroller, so focusing its field never
  // scrolls the island. Big targets (≥ 44 px), one column of thumbs.
  //   <SayPicker scene={el} anchor={buttonEl} onpick={(text, own) => …} onclose={(e) => …} />
  import { flushSync, onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { cleanSay, SAY_MAX } from '#lib/sync/live-protocol.ts';
  import { onKeyboardInset, readKeyboardInset } from '../ui/keyboardInset.svelte.ts';
  import { EDGE } from './placement.ts';
  import { SAY_PRESETS, recentSays } from './say.ts';

  let { scene, anchor, onpick, onclose }: { scene: HTMLElement; anchor: Element; onpick: (text: string, own: boolean) => void; onclose: (e?: Event) => void } = $props();

  let el = $state<HTMLElement>();
  let field = $state<HTMLInputElement>();
  let writing = $state(false);
  let draft = $state('');
  let pos = $state<{ x: number; y: number } | null>(null);
  const recent = recentSays();
  const count = $derived(Array.from(draft).length);
  const ready = $derived(!!cleanSay(draft));

  /** Stand above the button, right-aligned with it and inside the screen; above the keyboard while one is up. */
  function place() {
    if (!el || !anchor.isConnected) return onclose();
    const w = el.offsetWidth, h = el.offsetHeight, a = anchor.getBoundingClientRect(), s = scene.getBoundingClientRect();
    const x = Math.max(s.left + EDGE + w / 2, Math.min(a.right - w / 2, s.right - EDGE - w / 2));
    // the keyboard's top (the visible part's foot, in client px: iOS scrolls the page to the field, so not
    // offsetTop + height; ui/keyboardInset.svelte.ts): the box stays above it
    const kb = readKeyboardInset(), foot = kb.height ? kb.clientTop + kb.height - 12 : Infinity;
    const y = Math.max(Math.max(s.top, kb.height ? kb.clientTop : -Infinity) + h / 2 + 8, Math.min(a.top - 8 - h / 2, foot - h / 2));
    pos = { x: x - s.left, y: y - s.top };
  }

  onMount(() => {
    place();
    // the box changes size (the field opens) and the keyboard comes and goes: placed again
    const ro = new ResizeObserver(() => place());
    if (el) ro.observe(el);
    const offKb = onKeyboardInset(place);
    // a tap anywhere else closes it (capture: before what's under it), as a tree's popup: on a control the tap still
    // does what it does (a flea is netted), on the scenery and the ground it only closes (onclose's event: SceneTaps
    // lets it be); on the button again it only closes (its click eaten)
    const away = (e: PointerEvent) => {
      if (e.target instanceof Node && el?.contains(e.target)) return;
      if (e.target instanceof Node && anchor.contains(e.target)) {
        const eat = (c: Event) => {
          c.stopPropagation();
          c.preventDefault();
        };
        document.addEventListener('click', eat, { capture: true, once: true });
        setTimeout(() => document.removeEventListener('click', eat, { capture: true }), 700);
      }
      onclose(e);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onclose();
    };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', esc);
    el?.querySelector<HTMLElement>('.phrase')?.focus({ preventScroll: true });
    return () => {
      ro.disconnect();
      offKb();
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('keydown', esc);
    };
  });

  function write() {
    // synchronously, inside the tap: iOS shows the keyboard only for a focus in the gesture
    flushSync(() => (writing = true));
    field?.focus({ preventScroll: true });
  }

  /** At most SAY_MAX characters (not while the IME composes: cutting under it breaks the word). */
  function cap(e: Event) {
    if ((e as InputEvent).isComposing) return;
    const cut = Array.from(draft).slice(0, SAY_MAX).join('');
    if (cut !== draft) draft = cut;
  }

  function enter(e: KeyboardEvent) {
    if (e.key !== 'Enter' || e.isComposing || e.keyCode === 229) return;
    e.preventDefault();
    send();
  }

  function send() {
    const text = cleanSay(draft);
    if (text) onpick(text, true);
  }
</script>

<div class="picker" class:placed={!!pos} role="dialog" aria-label={t('say.title')} data-say-picker bind:this={el}
  style:left={pos ? `${pos.x}px` : null} style:top={pos ? `${pos.y}px` : null}>
  <div class="head">
    <b class="title">{t('say.title')}</b>
    <button type="button" class="x" aria-label={t('common.close')} data-sfx="back" data-say-close onclick={() => onclose()}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4 L12 12 M12 4 L4 12" /></svg>
    </button>
  </div>
  {#if !writing}
    <div class="grid">
      {#each SAY_PRESETS as id (id)}
        <button type="button" class="phrase" data-sfx="choice-pick" data-say-preset={id} onclick={() => onpick(t(`say.${id}`), false)}>{t(`say.${id}`)}</button>
      {/each}
    </div>
    {#if recent.length}
      <div class="recent" role="group" aria-label={t('say.recent')}>
        {#each recent as r (r)}
          <button type="button" class="phrase own" data-sfx="choice-pick" data-say-recent onclick={() => onpick(r, true)}>{r}</button>
        {/each}
      </div>
    {/if}
    <button type="button" class="phrase write" data-sfx="tick" data-say-write onclick={write}>{t('say.own')}</button>
  {:else}
    <!-- Enter sends from the field itself (not the form's: an IME's Enter confirms the word, it doesn't send) -->
    <form class="form" onsubmit={(e) => e.preventDefault()}>
      <label class="sr" for="say-field">{t('say.field')}</label>
      <input id="say-field" class="field" data-sfx="none" bind:this={field} bind:value={draft} oninput={cap} oncompositionend={cap} onkeydown={enter} type="text" enterkeyhint="send"
        autocomplete="off" maxlength={SAY_MAX * 2} placeholder={t('say.placeholder')} data-say-field />
      <span class="count" class:full={count >= SAY_MAX} aria-hidden="true">{count}/{SAY_MAX}</span>
      <div class="row">
        <button type="button" class="phrase back" data-sfx="back" onclick={() => (writing = false)}>{t('say.back')}</button>
        <button type="button" class="phrase send" data-sfx="choice-pick" data-say-send aria-disabled={!ready || undefined} onclick={send}>{t('say.send')}</button>
      </div>
    </form>
  {/if}
</div>

<style>
  /* NH's menu in the app's cream: a round card, the soft lip, pills inside */
  .picker {
    position: absolute; left: 50%; top: 50%; z-index: var(--z-popup); translate: -50% -50%; width: min(300px, calc(100vw - 24px));
    padding: 10px 12px 12px; border-radius: 24px; background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C);
    box-shadow: 0 4px 0 rgba(150, 110, 70, .3), 0 8px 24px rgba(60, 40, 20, .18); visibility: hidden;
    -webkit-user-select: none; user-select: none; touch-action: manipulation;
  }
  .picker.placed { visibility: visible; animation: pop .2s cubic-bezier(.3, 1.4, .5, 1) both; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .title { padding-left: 6px; font: 700 14px/1.3 var(--font-ui); color: #8A6A48; }
  .x {
    appearance: none; border: 0; margin: -4px -4px 0 0; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center;
    background: transparent; cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .x svg { width: 18px; height: 18px; stroke: #8A6A48; stroke-width: 2.4; stroke-linecap: round; fill: none; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .recent { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
  .phrase {
    appearance: none; border: 0; margin: 0; cursor: pointer; min-height: 48px; padding: 6px 10px; border-radius: 16px;
    background: #FFE9A8; color: var(--c-ink, #4A3A2C); font: 700 15px/1.3 var(--font-ui); word-break: keep-all; overflow-wrap: anywhere;
    box-shadow: 0 3px 0 rgba(170, 120, 60, .38); -webkit-tap-highlight-color: transparent;
  }
  .phrase:active { translate: 0 2px; box-shadow: 0 1px 0 rgba(170, 120, 60, .38); }
  .phrase:focus-visible, .x:focus-visible, .field:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .phrase.own { background: #FFF3CC; }
  .phrase.write { width: 100%; margin-top: 8px; background: #CFEFD3; box-shadow: 0 3px 0 rgba(80, 140, 90, .38); }
  .phrase[aria-disabled] { opacity: .45; cursor: default; }
  .form { display: grid; gap: 8px; }
  .field {
    width: 100%; min-height: 48px; padding: 8px 14px; border-radius: 16px; border: 2px solid #E3CFA4; background: #FFFCF2;
    color: var(--c-ink, #4A3A2C); font: 700 16px/1.3 var(--font-ui); -webkit-user-select: text; user-select: text;
  }
  .count { justify-self: end; margin-top: -4px; font: 600 12px/1 var(--font-num, var(--font-ui)); color: #9A7F60; }
  .count.full { color: #C2683E; }
  .row { display: grid; grid-template-columns: 1fr 1.4fr; gap: 8px; }
  .phrase.send { background: #6ED07A; color: #fff; box-shadow: 0 3px 0 rgba(60, 130, 70, .45); }
  .phrase.back { background: #F1E6CC; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @keyframes pop { from { transform: scale(.7); opacity: 0; } }
</style>
