<script lang="ts">
  // The rooms' screenshot pair (docs/design.md "The tent"), over the eye button at the bottom left (its look, smaller):
  // カメラめせん (a face: every character's head turned to the camera, kept on this phone; yuzu while on) and the chrome
  // hidden (a camera: the scene alone till a tap anywhere, RoomShell). rooms/shot.svelte.ts holds both.
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { setFaceCam, shot } from './shot.svelte.ts';

  function face() {
    setFaceCam(!shot.faceCam);
    cue(shot.faceCam ? 'toggle-on' : 'toggle-off');
  }
  function bare() {
    shot.bare = true;
    cue('toggle-on');
  }
</script>

<button type="button" class="mini" data-face-cam={shot.faceCam ? 'on' : 'off'} data-sfx="self" aria-label={t('room.faceCam')} aria-pressed={shot.faceCam} onclick={face}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.2" /><circle class="dot" cx="9.2" cy="11" r="1.5" /><circle class="dot" cx="14.8" cy="11" r="1.5" /><path d="M9.4 15.2c1.5 1.2 3.7 1.2 5.2 0" /></svg>
</button>
<button type="button" class="mini" data-room-bare data-sfx="self" aria-label={t('room.bare')} onclick={bare}>
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.5h3l1.6-2.3h6.8L17 8.5h3v10H4Z" /><circle cx="12" cy="13.2" r="3.1" /></svg>
</button>

<style>
  /* the eye button's disc, 30 px to the eye, 40 px to the thumb */
  .mini {
    appearance: none; border: 0; margin: 0; padding: 0; width: 44px; height: 40px; display: grid; place-items: center;
    background: none; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; touch-action: manipulation; color: #A88B68;
  }
  .mini[aria-pressed='true'] { color: var(--c-ink, #4A3B2C); }
  .mini::before {
    content: ''; position: absolute; left: 7px; top: 5px; width: 30px; height: 30px; border-radius: 50%;
    background: color-mix(in srgb, var(--c-cream, #FFF9E3) 82%, transparent); box-shadow: 0 2px 0 rgba(150, 110, 70, .28), 0 2px 6px rgba(60, 40, 20, .12);
    transition: translate .12s, box-shadow .12s, background-color .12s;
  }
  .mini[aria-pressed='true']::before { background: var(--c-yuzu, #F7D94C); box-shadow: 0 2px 0 var(--c-yuzu-lip, #D9B21E), 0 2px 6px rgba(60, 40, 20, .12); }
  .mini:active::before { translate: 0 2px; box-shadow: 0 0 0 rgba(150, 110, 70, .28); }
  .mini:focus-visible { outline: none; }
  .mini:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  svg { position: relative; width: 19px; height: 19px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .dot { fill: currentColor; stroke: none; }
  .mini:active svg { translate: 0 2px; }
</style>
