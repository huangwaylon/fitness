<script lang="ts">
  // What my villager says (docs/design.md "Villager taps"): the say button at the island's bottom right (SayButton)
  // opens this small NH-style picker above it (the reactions wheel's spirit in the app's cream): only my own words (no
  // presets; the user: "get rid of all the default messages. only custom messages"), my last RECENT_MAX (kept on this
  // phone, world/say.ts, newest first) and 「じぶんで かく…」, a field of SAY_MAX characters with いう (Enter sends); with
  // ‹ (top-left) back to them; none kept yet it opens straight on the field, without ‹. A pick closes it and is said
  // (IslandScene: the balloon over my villager on both phones). ✕, Esc or a tap anywhere else closes it (on the ground
  // that tap only closes: it walks nobody; on the button again it only closes). It stands above the button, its right edge at the button's (inside the screen, EDGE
  // from its sides), above the keyboard while one is up; it sits outside the scroller, so focusing its field never
  // scrolls the island. Big targets (≥ 44 px), one column of thumbs.
  //   <SayPicker scene={el} anchor={buttonEl} onpick={(text) => …} onclose={(e) => …} />
  import { flushSync, onMount } from 'svelte';
  import { t } from '#lib/i18n/index.ts';
  import { cleanSay, SAY_MAX } from '#lib/contract/live-protocol.ts';
  import { onKeyboardInset, readKeyboardInset } from '../ui/keyboardInset.svelte.ts';
  import { EDGE } from './placement.ts';
  import { recentSays } from '../../world/say.ts';
  import NavButton from '../ui/NavButton.svelte';

  let { scene, anchor, onpick, onclose }: { scene: HTMLElement; anchor: Element; onpick: (text: string) => void; onclose: (e?: Event) => void } = $props();

  let el = $state<HTMLElement>();
  let field = $state<HTMLInputElement>();
  const recent = recentSays();
  // nothing of mine kept yet: straight to the field
  let writing = $state(recent.length === 0);
  let draft = $state('');
  let pos = $state<{ x: number; y: number } | null>(null);
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
    // on the field when it opens on it (still the button's tap: iOS shows the keyboard), else on the newest phrase
    (writing ? field : el?.querySelector<HTMLElement>('.phrase'))?.focus({ preventScroll: true });
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
    if (text) onpick(text);
  }
</script>

<div class="picker obj-cream" class:placed={!!pos} role="dialog" aria-label={t('say.title')} data-say-picker bind:this={el}
  style:left={pos ? `${pos.x}px` : null} style:top={pos ? `${pos.y}px` : null}>
  <div class="head">
    <!-- ‹ only with phrases to go back to (none kept: ✕ closes) -->
    {#if writing && recent.length}<NavButton kind="back" label={t('say.back')} onclick={() => (writing = false)} />{/if}
    <b class="title">{t('say.title')}</b>
    <span class="x" data-say-close><NavButton kind="close" onclick={() => onclose()} /></span>
  </div>
  {#if !writing}
    <div class="recent" role="group" aria-label={t('say.recent')}>
      {#each recent as r (r)}
        <button type="button" class="phrase own" data-sfx="choice-pick" data-say-recent onclick={() => onpick(r)}>{r}</button>
      {/each}
    </div>
    <button type="button" class="btn small paper write" data-sfx="tick" data-say-write onclick={write}>{t('say.own')}</button>
  {:else}
    <!-- Enter sends from the field itself (not the form's: an IME's Enter confirms the word, it doesn't send) -->
    <form class="form" onsubmit={(e) => e.preventDefault()}>
      <label class="sr" for="say-field">{t('say.field')}</label>
      <input id="say-field" class="field" data-sfx="none" bind:this={field} bind:value={draft} oninput={cap} oncompositionend={cap} onkeydown={enter} type="text" enterkeyhint="send"
        autocomplete="off" maxlength={SAY_MAX * 2} placeholder={t('say.placeholder')} data-say-field />
      <span class="count" class:full={count >= SAY_MAX} aria-hidden="true">{count}/{SAY_MAX}</span>
      <div class="row">
        <button type="button" class="btn small" data-sfx="choice-pick" data-say-send aria-disabled={!ready || undefined} onclick={send}>{t('say.send')}</button>
      </div>
    </form>
  {/if}
</div>

<style>
  /* NH's menu in the app's cream: a round card, the soft lip, pills inside. Unplaced it's see-through, not
     visibility: hidden (its field must take the focus as it opens, inside the button's tap: iOS's keyboard) */
  .picker {
    position: absolute; left: 50%; top: 50%; z-index: var(--z-popup); translate: -50% -50%; width: min(300px, calc(100vw - 24px));
    padding: 10px 12px 12px; border-radius: 24px; background: var(--c-cream, #FFF9E3); color: var(--c-ink, #4A3A2C);
    box-shadow: 0 4px 0 rgba(150, 110, 70, .3), 0 8px 24px rgba(60, 40, 20, .18); opacity: 0; pointer-events: none;
    -webkit-user-select: none; user-select: none; touch-action: manipulation;
  }
  .picker.placed { opacity: 1; pointer-events: auto; animation: pop .2s cubic-bezier(.3, 1.4, .5, 1) both; }
  .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .title { flex: 1; padding-left: 6px; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-ink-soft); }
  /* the app's ‹ ✕ (NavButton), as every sheet's */
  .x { display: flex; }
  .recent { display: flex; flex-direction: column; gap: 8px; }
  .phrase {
    appearance: none; border: 0; margin: 0; cursor: pointer; min-height: 48px; padding: 6px 10px; border-radius: 16px;
    background: #FFE9A8; color: var(--c-ink, #4A3A2C); font: 700 15px/1.3 var(--font-ui); word-break: keep-all; overflow-wrap: anywhere;
    box-shadow: 0 3px 0 rgba(170, 120, 60, .38); -webkit-tap-highlight-color: transparent;
  }
  .phrase:active { translate: 0 2px; box-shadow: 0 1px 0 rgba(170, 120, 60, .38); }
  .phrase:focus-visible, .field:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .phrase.own { background: #FFF3CC; }
  /* じぶんで かく… / いう: the app's buttons (theme.css .btn; いう sunk until there's something to say) */
  .write { width: 100%; margin-top: 8px; }
  .row .btn { width: 100%; margin-bottom: 0; }
  .form { display: grid; gap: 8px; }
  .field {
    width: 100%; min-height: 48px; padding: 8px 14px; border-radius: var(--r-btn); border: 0; box-shadow: inset 0 0 0 2px var(--c-edge); background: var(--c-card);
    color: var(--c-ink); font: 700 var(--fs-input)/1.3 var(--font-ui); -webkit-user-select: text; user-select: text;
  }
  .count { justify-self: end; margin-top: -4px; font: 700 var(--fs-s)/1 var(--font-num); color: var(--c-ink-soft); }
  .count.full { color: var(--c-ink); }
  .row { display: grid; }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @keyframes pop { from { transform: scale(.7); opacity: 0; } }
</style>
