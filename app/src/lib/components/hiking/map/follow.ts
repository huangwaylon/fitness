// The location button's camera modes (docs/hiking.md "In-hike map"), pure: one disc, a loop off → 追従 (follow: the
// dot kept centred) → off. `free`: the dot shown but the camera let go (a pan drops follow, as Google Maps does; the
// disc hollow). In hike mode the position is needed, so the loop never goes off: a tap re-centres (追従 again). The
// compass never turns the map: it only draws the cone (decided 2026-11-22).
export type Cam = 'off' | 'free' | 'follow';

/** The disc tapped. */
export const tapLocate = (c: Cam, x: { hiking: boolean }): Cam => (c === 'follow' && !x.hiking ? 'off' : 'follow');

/** A one-finger pan: the camera let go. */
export const onPan = (c: Cam): Cam => (c === 'follow' ? 'free' : c);

/** The 1 s toast after a tap: 追従中 / 現在地オフ (strings.ts keys); `free` never follows a tap. */
export const camToast = (c: Cam): 'camFollow' | 'camOff' | null => (c === 'follow' ? 'camFollow' : c === 'off' ? 'camOff' : null);
