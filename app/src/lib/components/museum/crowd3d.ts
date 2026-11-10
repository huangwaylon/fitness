// The museum's visitors drawn (docs/design.md "The museum": visitors.ts plans them): NH's villagers' own models
// (villager3d), the players' size, in the room I'm in only. Each pose is the day's plan's at the synced clock (the same
// on every phone): walking its path, standing at an exhibit, sitting on a bench's seat (villager3d sitAt), chatting,
// talking to me after a tap; fading in at the room's door and out again (dithered, alphaHash: the warm-up compiles it).
// A model is fetched the first time its visitor is in the room drawn and kept for the visit. Its emote (the plan's ♪ ! 💡
// …) a still bubble over its head. Frames only while one moves (a walk, a fade, an act, a talk's turn); else a timer for
// the plan's next change (Crowd.nextChange: an emote's coming and going too), so a room with seated or looking visitors
// stays at 0 frames. A tap's box at least a finger's (44 px) round each.
// An exhibit (engine.ts Exhibit, `people`: a tap on one is a visitor's, after the players', before the creatures).
import { Box3, CanvasTexture, CircleGeometry, Group, Mesh, MeshBasicMaterial, SRGBColorSpace, Sprite, SpriteMaterial, Vector3, type Material } from 'three';
import type { Exhibit, Kit } from './engine.ts';
import type { RoomId } from './plan.ts';
import type { Crowd, Emote, VisitorPose } from './visitors.ts';
import type { Pt } from './plan.ts';
import { createVillager, type Villager3D } from '../villager3d/villager3d.ts';
import { url3d } from '../villager3d/manifest.ts';
import type { Anchor } from '../villager3d/seats3d.ts';
import { VILLAGER_H } from '../rooms/view.ts';
import { softDisc } from '../world3d/cards.ts';
import { decal } from './geometry.ts';
import { ROSTER } from '#lib/villagers/roster.ts';

/** The players' scale (engine.ts V3_SCALE). */
const SCALE = VILLAGER_H / 80;
/** The longest sleep between frames (ms): a wake now and then, whatever the plan says. */
const NAP = 60_000;
/** A finger's reach (px): a visitor's tap box is at least this wide and tall. */
const FINGER = 44;
/** An emote bubble's size (u) and its glyphs. */
const BUBBLE = 11;
const GLYPH: Readonly<Record<Emote, string>> = { note: '♪', bang: '！', idea: '💡', dots: '…' };
/** An emote's bubble (NH's: white, a tail down to the head, the glyph inside). */
function bubbleTex(e: Emote): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffdf6';
  g.strokeStyle = '#8a6f52';
  g.lineWidth = 4;
  g.beginPath();
  g.roundRect(8, 6, 80, 66, 26);
  g.moveTo(40, 72);
  g.lineTo(48, 90);
  g.lineTo(56, 72);
  g.fill();
  g.stroke();
  g.fillStyle = '#fffdf6';
  g.fillRect(41, 66, 14, 8);
  g.fillStyle = e === 'bang' ? '#e0533a' : e === 'note' ? '#3f8fd8' : '#6b5440';
  g.font = '700 46px system-ui, "Apple Color Emoji", sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(GLYPH[e], 48, 41);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

export interface Crowd3D extends Exhibit {
  /** The visitors drawn now (the e2e's): id, where, doing what, faded how far, its emote, its last act played (a hop,
   *  a wave…). */
  drawn(): { id: string; x: number; z: number; state: string; fade: number; emote: string | null; act: string | null }[];
  /** A visitor's names and NH colour (its balloon's tag: the roster's, in this chunk, never the first load's). */
  nameOf(id: string): { ja: string; en: string; colour: string } | null;
}

interface Body {
  v: Villager3D | null;
  shadow: Mesh<CircleGeometry, MeshBasicMaterial>;
  mats: Material[];
  /** Its height (u) and last place (the walk cycle's distance). */
  h: number;
  was: [number, number];
  seat: Anchor | null;
  fade: number;
  busy: boolean;
  bubble: Sprite;
}

export function buildCrowd(kit: Kit, o: {
  crowd: Crowd;
  /** The synced clock (ms: the relay's, ?date's shift in it). */
  clock: () => number;
  /** The room drawn (engine.room): the exhibit is always the current room's. */
  room: () => RoomId;
  /** The seats players sit on (`<bench>:<n>`): a visitor stands by one instead. */
  blocked: () => ReadonlySet<string>;
  /** A seat point's anchor (seats.ts). */
  anchor: (pointId: string) => Anchor | null;
  /** My villager's place (a visitor near it waves). */
  me?: () => Pt | null;
  dir: string;
}): Crowd3D {
  const group = new Group();
  const bodies = new Map<string, Body>();
  const disc = softDisc('40,24,14', 4, false);
  const shadowGeo = new CircleGeometry(4.6, 20);
  // (the emotes' bubbles: one material each, shared; one hidden from the start, so the warm-up compiles their program)
  const bubbles = new Map((['note', 'bang', 'idea', 'dots'] as const).map((e) => [e, new SpriteMaterial({ map: bubbleTex(e), depthWrite: false })]));
  const bubbleOf = () => {
    const s = new Sprite(bubbles.get('note'));
    s.scale.set(BUBBLE, BUBBLE, 1);
    s.renderOrder = 3;
    s.visible = false;
    group.add(s);
    return s;
  };
  bubbleOf();
  let disposed = false, wake: ReturnType<typeof setTimeout> | undefined, seq = 0;
  let poses: readonly VisitorPose[] = [];
  const acted = new Map<string, string>();
  const box = new Box3(), v3 = new Vector3();

  function bodyOf(id: string): Body {
    let b = bodies.get(id);
    if (b) return b;
    const mat = decal(new MeshBasicMaterial({ map: disc, transparent: true, depthWrite: false }), 5);
    const shadow = new Mesh(shadowGeo, mat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.renderOrder = 2;
    group.add(shadow);
    bodies.set(id, (b = { v: null, shadow, mats: [], h: VILLAGER_H, was: [0, 0], seat: null, fade: 1, busy: true, bubble: bubbleOf() }));
    const url = url3d(id, o.dir);
    const body = b;
    if (url) void createVillager(id, url, ++seq * 1.3).then((v) => {
      if (disposed) return v.dispose();
      body.v = v;
      v.group.scale.setScalar(SCALE);
      v.lift(0.32);
      v.group.traverse((n) => {
        const m = (n as Mesh).material;
        if (m) body.mats.push(...([] as Material[]).concat(m));
      });
      body.h = box.setFromObject(v.group).getSize(v3).y || VILLAGER_H;
      v.group.visible = false;
      group.add(v.group);
      kit.warm();
      kit.invalidate();
    }, () => {});
    return b;
  }

  /** Its materials `a` in: dithered only while it fades (the warm-up's program), solid again after. */
  function fadeTo(b: Body, a: number) {
    if (b.fade === a) return;
    b.fade = a;
    const hashed = a < 1;
    for (const m of b.mats) {
      if (m.alphaHash !== hashed) (m.alphaHash = hashed), (m.needsUpdate = true);
      m.opacity = a;
    }
    b.shadow.material.opacity = a;
  }

  function pose(p: VisitorPose, t: number): boolean {
    const b = bodyOf(p.id), v = b.v;
    b.shadow.visible = true;
    const sit = p.state === 'sit' && p.point ? o.anchor(p.point.id) : null;
    const moved = Math.hypot(p.x - b.was[0], p.z - b.was[1]);
    b.was = [p.x, p.z];
    let busy = p.state === 'walk' || p.fade < 1 || p.state === 'talk';
    if (sit) {
      const out = sit.depth * 0.45;
      b.shadow.position.set(sit.x + Math.sin(sit.yaw) * out, 0.15, sit.z + Math.cos(sit.yaw) * out);
    } else b.shadow.position.set(p.x, 0.15, p.z);
    if (!v) return busy;
    v.group.visible = true;
    fadeTo(b, p.fade);
    if (sit !== b.seat) {
      b.seat = sit;
      v.sitAt(sit);
      busy = true;
    }
    if (!sit) {
      v.group.position.set(p.x, 0, p.z);
      v.group.rotation.set(0, p.yaw, 0);
    }
    // (its emote: a still bubble over its head, only while it's all there)
    b.bubble.visible = !!p.emote && p.fade === 1;
    if (p.emote) {
      b.bubble.material = bubbles.get(p.emote)!;
      b.bubble.position.set(b.shadow.position.x, (sit ? b.h * 0.8 : b.h) + BUBBLE * 0.55, b.shadow.position.z);
    }
    v.set(sit ? (sit.lie ? 'lie' : 'sit') : p.state === 'walk' ? 'walk' : 'idle');
    v.face(p.state === 'talk' || p.state === 'chat' ? 'happy' : null);
    if (busy || b.busy) {
      b.busy = v.step(t, moved / SCALE, p.state === 'walk' ? p.speed / SCALE : 0) || busy;
      return b.busy;
    }
    v.blink(t);
    return false;
  }

  return {
    group,
    wing: 'hall',
    get room() {
      return o.room();
    },
    blocks: [],
    people: true,
    frame(t) {
      clearTimeout(wake);
      if (disposed) return false;
      const now = o.clock(), room = o.room();
      const step = o.crowd.step(now, room, o.blocked(), o.me?.());
      poses = step.poses;
      const here = new Set(poses.map((p) => p.id));
      for (const [id, b] of bodies) {
        if (here.has(id)) continue;
        b.shadow.visible = b.bubble.visible = false;
        if (b.v) b.v.group.visible = false;
      }
      let busy = false;
      for (const p of poses) if (pose(p, t)) busy = true;
      for (const a of step.acts) {
        const b = bodies.get(a.id);
        if (b?.v) (b.v.act(a.act), (b.busy = true), (busy = true), acted.set(a.id, a.act));
      }
      if (busy) return true;
      // (still: asleep till the plan's next change)
      const next = o.crowd.nextChange(now, room);
      if (next === 0) return true;
      if (Number.isFinite(next)) wake = setTimeout(() => kit.invalidate(), Math.min(NAP, Math.max(50, next)));
      return false;
    },
    pick(project, cx, cy) {
      let best: { id: string; d: number } | null = null;
      for (const p of poses) {
        const b = bodies.get(p.id);
        if (!b?.v?.group.visible || p.fade < 0.5) continue;
        const [x, z] = [b.shadow.position.x, b.shadow.position.z];
        const top = project(x, b.h, z), foot = project(x, 0, z);
        if (!top || !foot) continue;
        const half = Math.max(FINGER / 2, (foot[1] - top[1]) * 0.32 + 4), y1 = foot[1] + 6, y0 = Math.min(top[1] - 10, y1 - FINGER);
        if (cx < foot[0] - half || cx > foot[0] + half || cy < y0 || cy > y1) continue;
        const d = Math.hypot(cx - foot[0], cy - (top[1] + foot[1]) / 2);
        if (!best || d < best.d) best = { id: p.id, d };
      }
      return best;
    },
    where(id) {
      const b = bodies.get(id);
      if (!b?.v?.group.visible) return null;
      return [b.shadow.position.x, b.h, b.shadow.position.z];
    },
    shown: () => [],
    night() {},
    dither(on) {
      for (const b of bodies.values()) if (b.fade === 1) for (const m of b.mats) if (m.alphaHash !== on) (m.alphaHash = on), (m.needsUpdate = true);
    },
    nameOf(id) {
      const r = ROSTER[id as keyof typeof ROSTER];
      return r ? { ja: r.nameJa, en: r.nameEn, colour: r.colour } : null;
    },
    drawn: () => poses.filter((p) => bodies.get(p.id)?.v?.group.visible).map((p) => ({ id: p.id, x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10, state: p.state, fade: p.fade, emote: p.emote, act: acted.get(p.id) ?? null })),
    dispose() {
      disposed = true;
      clearTimeout(wake);
      for (const b of bodies.values()) (b.v?.dispose(), b.shadow.material.dispose());
      shadowGeo.dispose();
      disc.dispose();
      for (const m of bubbles.values()) (m.map?.dispose(), m.dispose());
      group.removeFromParent();
    }
  };
}
