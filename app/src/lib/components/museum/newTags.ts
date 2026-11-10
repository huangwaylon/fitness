// The museum's NEW tags (docs/design.md "The museum"): a little gold 「NEW」 card with a sparkle over each exhibit found in
// the last day (hud.ts freshFinds), in the room drawn only. Still: a sprite each, its texture drawn once; it sits over its
// exhibit's point (Exhibit.where) as that is on each frame drawn for other reasons (a fish swimming), and never asks for
// a frame of its own, so a room at rest stays at 0 frames.
// An exhibit (engine.ts Exhibit) of the room drawn, nothing to tap.
import { CanvasTexture, Group, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { RoomId } from './plan.ts';

/** The card's size (u: across) and how far over its exhibit's point it sits. */
const W = 11, LIFT = 6;

function tagTex(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 160;
  c.height = 80;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b8862a';
  g.beginPath();
  g.roundRect(14, 18, 132, 54, 27);
  g.fill();
  g.fillStyle = '#f2c14e';
  g.beginPath();
  g.roundRect(14, 12, 132, 54, 27);
  g.fill();
  g.fillStyle = '#4a3210';
  g.font = '800 34px "Zen Maru Gothic", system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('NEW', 80, 41);
  // (its sparkle: a four-pointed star at the top right)
  const star = (x: number, y: number, r: number) => {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4, d = i % 2 ? r * 0.32 : r;
      g.lineTo(x + Math.sin(a) * d, y - Math.cos(a) * d);
    }
    g.closePath();
    g.fill();
  };
  g.fillStyle = '#fffbe8';
  star(140, 14, 13);
  star(22, 64, 7);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export interface NewTags extends Exhibit {
  /** The finds to tag now (ids, each with its room). */
  set(fresh: readonly { id: string; room: RoomId }[]): void;
  /** The tags shown in the room drawn (the e2e's: their ids). */
  tagged(): string[];
}

export function buildNewTags(kit: Kit, o: { room: () => RoomId; where: (id: string) => [number, number, number] | null }): NewTags {
  const group = new Group();
  const map = tagTex();
  // (over what it tags, never hidden in it: a skull's bones, a case)
  const mat = new SpriteMaterial({ map, depthWrite: false, depthTest: false });
  const tags = new Map<string, { room: RoomId; s: Sprite }>();
  // (one hidden from the start: the warm-up compiles its program)
  const spare = new Sprite(mat);
  spare.visible = false;
  group.add(spare);
  return {
    group,
    wing: 'hall',
    get room() {
      return o.room();
    },
    blocks: [],
    set(fresh) {
      const want = new Map(fresh.map((f) => [f.id, f.room]));
      for (const [id, t] of tags) if (!want.has(id)) (t.s.removeFromParent(), tags.delete(id));
      for (const [id, room] of want) {
        if (tags.has(id)) continue;
        const s = new Sprite(mat);
        s.scale.set(W, W / 2, 1);
        s.renderOrder = 4;
        s.visible = false;
        group.add(s);
        tags.set(id, { room, s });
      }
      kit.invalidate();
    },
    frame() {
      const room = o.room();
      for (const [id, t] of tags) {
        const p = t.room === room ? o.where(id) : null;
        t.s.visible = !!p;
        if (p) t.s.position.set(p[0], p[1] + LIFT, p[2]);
      }
      return false;
    },
    pick: () => null,
    where: () => null,
    shown: () => [],
    night() {},
    tagged: () => [...tags].filter(([, t]) => t.s.visible).map(([id]) => id),
    dispose() {
      map.dispose();
      mat.dispose();
      group.removeFromParent();
    }
  };
}
