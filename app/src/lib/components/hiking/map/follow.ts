// The location button's camera modes (docs/hiking.md "In-hike map"), pure: one disc, a loop off → 追従 (follow: the
// dot kept centred, north up) → 進行方向 (heading: the map turned to the phone's heading) → off. `free`: the dot shown
// but the camera let go (a pan drops follow, as Google Maps does; the disc hollow). In hike mode the position is
// needed, so the loop never goes off: 追従 → 進行方向 → 追従. No compass (refused, or none): heading is skipped.
export type Cam = 'off' | 'free' | 'follow' | 'heading';

export interface CamCtx { hiking: boolean; compass: boolean }

/** The disc tapped. */
export function tapLocate(c: Cam, x: CamCtx): Cam {
  if (c === 'off' || c === 'free') return 'follow';
  if (c === 'follow') return x.compass ? 'heading' : x.hiking ? 'follow' : 'off';
  return x.hiking ? 'follow' : 'off';
}

/** A one-finger pan: the camera let go. */
export const onPan = (c: Cam): Cam => (c === 'follow' || c === 'heading' ? 'free' : c);
/** A two-finger rotate, or the compass disc (north up): heading mode back to follow. */
export const onRotate = (c: Cam): Cam => (c === 'heading' ? 'follow' : c);

/** The 1 s toast after a tap: 追従中 / 進行方向 / 現在地オフ (strings.ts keys); `free` never follows a tap. */
export const camToast = (c: Cam): 'camFollow' | 'camHeading' | 'camOff' | null => (c === 'follow' ? 'camFollow' : c === 'heading' ? 'camHeading' : c === 'off' ? 'camOff' : null);
