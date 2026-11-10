// The museum's NEW tags (docs/design.md "The museum"): a little gold 「NEW」 card with a sparkle over each exhibit found in
// the last day, drawn now and not yet looked at on this phone (hud.ts freshFinds), in the room drawn only; a tank with
// more than three, one 「NEW ×n」 over the tank (hud.ts tagsOf). Still: a sprite each, its texture drawn once (again once
// the font is in); it sits over its exhibit's point (Exhibit.where) as that is on each frame drawn for other reasons (a
// fish swimming: framed after the other exhibits, `late`, so it never trails a frame), and never asks for a frame of its
// own, so a room at rest stays at 0 frames. Depth-tested (never through a wall); hidden at my villager's eyes.
// An exhibit (engine.ts Exhibit) of the room drawn, nothing to tap.
import { CanvasTexture, Group, SRGBColorSpace, Sprite, SpriteMaterial } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { RoomId } from './plan.ts';
import { TANKS } from './tanks.ts';
import { SEA_TANKS } from './seaTanks.ts';

/** The card's height (u), how far over its exhibit's point it sits, over a tank's glass. */
const H = 5.5, LIFT = 6, OVER_TANK = 4;
const FONT = '"Zen Maru Gothic", system-ui, sans-serif';

/** A tag's card: 「NEW」, or 「NEW ×n」 for a tank's; its width over its height. */
function tagTex(n: number): { t: CanvasTexture; aspect: number } {
  const text = n > 1 ? `NEW ×${n}` : 'NEW', c = document.createElement('canvas');
  c.width = n > 1 ? 240 : 160;
  c.height = 80;
  const g = c.getContext('2d')!, w = c.width;
  const paint = () => {
    g.clearRect(0, 0, w, 80);
    g.fillStyle = '#b8862a';
    g.beginPath();
    g.roundRect(14, 18, w - 28, 54, 27);
    g.fill();
    g.fillStyle = '#f2c14e';
    g.beginPath();
    g.roundRect(14, 12, w - 28, 54, 27);
    g.fill();
    g.fillStyle = '#4a3210';
    g.font = `800 34px ${FONT}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, 41, w - 44);
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
    star(w - 20, 14, 13);
    star(22, 64, 7);
  };
  paint();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  void document.fonts?.load(`800 34px "Zen Maru Gothic"`, text).then(() => {
    paint();
    t.needsUpdate = true;
  }, () => {});
  return { t, aspect: w / 80 };
}

/** A tank's glass box (the aquarium's, the sea creatures'). */
const boxOf = (id: string | undefined) => (id ? (TANKS.find((t) => t.id === id) ?? SEA_TANKS.find((t) => t.id === id))?.box : undefined);

export interface NewTags extends Exhibit {
  /** The tags now (hud.ts tagsOf: an exhibit's id, or a tank's `case:<tank>` with its finds). */
  set(tags: readonly { key: string; room: RoomId; ids: readonly string[]; tank?: string }[]): void;
  /** The tags shown in the room drawn (the e2e's: their keys). */
  tagged(): string[];
}

export function buildNewTags(kit: Kit, o: { room: () => RoomId; where: (id: string) => [number, number, number] | null; hidden: () => boolean }): NewTags {
  const group = new Group();
  // (a material a label, shared: NEW, NEW ×4…)
  const mats = new Map<number, { m: SpriteMaterial; aspect: number }>();
  const matOf = (n: number) => {
    let x = mats.get(n);
    if (!x) {
      const { t, aspect } = tagTex(n);
      // (depth-tested, never through a wall; drawn after the glass and over the bones it sits above)
      mats.set(n, (x = { m: new SpriteMaterial({ map: t, depthWrite: false }), aspect }));
    }
    return x;
  };
  const tags = new Map<string, { room: RoomId; n: number; s: Sprite; tank?: string }>();
  // (one hidden from the start: the warm-up compiles its program)
  const spare = new Sprite(matOf(1).m);
  spare.visible = false;
  group.add(spare);
  /** A tag's point: over its exhibit; one in a tank over the glass's top (never behind its frame), a tank's own over
   *  its middle. */
  const pointOf = (key: string, tank?: string): [number, number, number] | null => {
    const b = boxOf(tank);
    if (key.startsWith('case:')) return b ? [(b.x0 + b.x1) / 2, b.y1 + OVER_TANK, (b.z0 + b.z1) / 2] : null;
    const p = o.where(key);
    return p ? [p[0], Math.max(p[1] + LIFT, b ? b.y1 + OVER_TANK : 0), p[2]] : null;
  };
  return {
    group,
    wing: 'hall',
    get room() {
      return o.room();
    },
    blocks: [],
    late: true,
    set(want) {
      const keys = new Set(want.map((w) => w.key));
      for (const [k, t] of tags) if (!keys.has(k) || t.n !== (want.find((w) => w.key === k)!.ids.length)) (t.s.removeFromParent(), tags.delete(k));
      for (const w of want) {
        if (tags.has(w.key)) continue;
        const n = w.key.startsWith('case:') ? w.ids.length : 1, { m, aspect } = matOf(n), s = new Sprite(m);
        s.scale.set(H * aspect, H, 1);
        s.renderOrder = 4;
        s.visible = false;
        group.add(s);
        tags.set(w.key, { room: w.room, n, s, tank: w.tank });
      }
      kit.invalidate();
    },
    frame() {
      const room = o.room(), off = o.hidden();
      for (const [k, t] of tags) {
        const p = !off && t.room === room ? pointOf(k, t.tank) : null;
        t.s.visible = !!p;
        if (p) t.s.position.set(p[0], p[1], p[2]);
      }
      return false;
    },
    pick: () => null,
    where: () => null,
    shown: () => [],
    night() {},
    tagged: () => [...tags].filter(([, t]) => t.s.visible).map(([k]) => k),
    dispose() {
      for (const { m } of mats.values()) (m.map?.dispose(), m.dispose());
      group.removeFromParent();
    }
  };
}
