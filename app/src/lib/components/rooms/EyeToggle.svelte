<script lang="ts">
  // The first-person view's switch (docs/design.md "First person"): a small round button at the bottom left of the
  // tent, the homes and the museum, the say button's mirror (its look: the app's cream disc, an eye in soft ink; yuzu
  // while on). Kept on this phone (store/firstPerson.svelte.ts); the room's engine glides to my villager's eyes and back.
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { firstPerson, setFirstPerson } from '#lib/store/firstPerson.svelte.ts';

  function toggle() {
    setFirstPerson(!firstPerson.on);
    cue(firstPerson.on ? 'toggle-on' : 'toggle-off');
  }
</script>

<button type="button" class="eye-btn" data-fpv={firstPerson.on ? 'on' : 'off'} data-sfx="self" aria-label={t('room.fpv')} aria-pressed={firstPerson.on}
  onclick={toggle}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.6 12c2.2-3.9 5.5-6 9.4-6s7.2 2.1 9.4 6c-2.2 3.9-5.5 6-9.4 6s-7.2-2.1-9.4-6Z" />
    <circle cx="12" cy="12" r="2.9" />
  </svg>
</button>

<style>
  /* the say button's measures: 44 px to the thumb, 36 px to the eye (::before draws the disc) */
  .eye-btn {
    appearance: none; border: 0; margin: 0; padding: 0; width: var(--hit, 44px); height: var(--hit, 44px); display: grid; place-items: center;
    background: none; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    color: #A88B68;
  }
  .eye-btn[aria-pressed='true'] { color: var(--c-ink, #4A3B2C); }
  .eye-btn::before {
    content: ''; position: absolute; left: 4px; top: 4px; width: 36px; height: 36px; border-radius: 50%;
    background: color-mix(in srgb, var(--c-cream, #FFF9E3) 90%, transparent); box-shadow: 0 3px 0 rgba(150, 110, 70, .28), 0 2px 8px rgba(60, 40, 20, .12);
    transition: translate .12s, box-shadow .12s, background-color .12s;
  }
  .eye-btn[aria-pressed='true']::before { background: var(--c-yuzu, #F7D94C); box-shadow: 0 3px 0 var(--c-yuzu-lip, #D9B21E), 0 2px 8px rgba(60, 40, 20, .12); }
  .eye-btn:active::before { translate: 0 2px; box-shadow: 0 1px 0 rgba(150, 110, 70, .28); }
  .eye-btn:focus-visible { outline: none; }
  .eye-btn:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  svg { position: relative; width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linejoin: round; }
  circle { fill: currentColor; stroke: none; }
  .eye-btn:active svg { translate: 0 2px; }
</style>
