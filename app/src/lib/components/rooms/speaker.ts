// What the rooms' shells (TentRoom, MuseumRoom) share of their scene on the page: a villager as a balloon's speaker
// (island/Says), and how dark the room is at the hour.
import type { SaySpeaker } from '../../world/say.ts';

/** What a room's engine says of a villager's place (tent/engine.ts, museum/engine.ts). */
interface Room<W> {
  at(w: W): [number, number] | null;
  headPoint(w: W): [number, number, number] | null;
  inView(x: number, y: number, z: number): boolean;
  client(x: number, y: number, z: number): [number, number];
}

/** `w`'s box on screen as the room's camera has it now (Says asks it again as it follows): from the top of its head
 *  down to its feet; gone with the villager. At my villager's eyes (`fpv`) mine stands by the middle of the view's
 *  foot (`bottom`: the inset under it), as one's own voice, and another's goes once it's out of view. */
export function roomSpeaker<W>(w: W, me: W, now: () => { eng: Room<W> | null; fpv: boolean; canvas: HTMLCanvasElement | undefined; bottom: number }): SaySpeaker {
  return {
    get isConnected() {
      const { eng, fpv } = now();
      const h = eng?.at(w) && eng.headPoint(w);
      return !!h && (w === me || !fpv || eng!.inView(h[0], h[1], h[2]));
    },
    getBoundingClientRect() {
      const { eng, fpv, canvas, bottom } = now();
      const h = eng?.headPoint(w), at = eng?.at(w);
      if (!eng || !h || !at) return new DOMRect();
      if (w === me && fpv && canvas) {
        const r = canvas.getBoundingClientRect();
        return new DOMRect(r.left + r.width / 2 - 20, r.bottom - bottom - 70, 40, 40);
      }
      const [hx, hy] = eng.client(h[0], h[1], h[2]), [, fy] = eng.client(at[0], 0, at[1]);
      const tall = Math.max(12, fy - hy), wide = tall * 0.55;
      return new DOMRect(hx - wide / 2, hy, wide, tall);
    }
  };
}

/** The room's night (0 day … 1 night) at the island's time of day. */
export const nightOf = (tod: string) => (tod === 'night' ? 1 : tod === 'dusk' ? 0.55 : tod === 'dawn' ? 0.3 : 0);
