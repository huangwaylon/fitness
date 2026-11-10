// The editors' icon of an outdoor catalogue piece (layout/outdoor.ts: its kind's icon `room:<code>`, NH's own in
// static/room/icons, the rooms' file).
import { staticUrl } from '#lib/staticUrl.ts';

/** A `room:<code>` icon's URL, or null for another key. */
export const roomIconUrl = (key: string): string | null => (key.startsWith('room:') ? staticUrl(`room/icons/${key.slice(5)}.webp`) : null);
