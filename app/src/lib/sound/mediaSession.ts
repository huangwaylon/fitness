// The Media Session (docs/design.md#engine-lifecycle): the lock screen's and Control Center's Now Playing tile. iOS
// may show one for the music deck. Its ▶ and ⏸ are the app's (sound.svelte.ts): ▶ only resumes while the app is in
// front (never music from a pocket), ⏸ holds the track until the next tap in the app. The tile is named after the
// tune with the app's icon, so it isn't a bare URL; no seeking or skipping.
import { t } from '#lib/i18n/index.ts';
import { asset } from '$app/paths';

const session = (): MediaSession | null => (typeof navigator !== 'undefined' && 'mediaSession' in navigator ? navigator.mediaSession : null);

/** Wire ▶ and ⏸ (and ⏹, as ⏸); seeking and skipping are off. */
export function initMediaSession(o: { play: () => void; hold: () => void }): void {
  const ms = session();
  if (!ms) return;
  const handle = (a: MediaSessionAction, f: MediaSessionActionHandler | null) => {
    try {
      ms.setActionHandler(a, f);
    } catch {
      /* this action isn't supported */
    }
  };
  handle('play', o.play);
  handle('pause', o.hold);
  handle('stop', o.hold);
  for (const a of ['seekbackward', 'seekforward', 'seekto', 'previoustrack', 'nexttrack'] as const) handle(a, null);
}

/** The tile shows paused (the app hidden, muted, a ⏸): only when there is a tile. */
export function tilePaused(): void {
  const ms = session();
  if (ms?.metadata && ms.playbackState !== 'none') ms.playbackState = 'paused';
}

/** What the tile says (null: no music, no tile). */
export function nowPlaying(title: string | null): void {
  const ms = session();
  if (!ms) return;
  if (!title) {
    ms.metadata = null;
    ms.playbackState = 'none';
    return;
  }
  const name = title.replace(/^♪\s*/, '');
  if (ms.metadata?.title !== name && typeof MediaMetadata === 'function') {
    ms.metadata = new MediaMetadata({ title: name, artist: t('app.name'), artwork: [{ src: asset('icons/icon-512.webp'), sizes: '512x512', type: 'image/webp' }] });
  }
  ms.playbackState = document.hidden ? 'paused' : 'playing';
}
