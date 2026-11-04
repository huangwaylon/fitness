// NH's villagers' faces (villager3d): NH swaps the eyes' and the mouth's textures for an expression; the converter
// (scripts/villagers3d-page.js) packs a villager's 16 eyes and 9 mouths into two atlases, cell i = NH's texture i. The
// cells are the same expressions for every villager (read off the files).
//   eyes:   0 open (resting) · 3 a little narrowed · 8 worried · 9 happy (closed, curved up) · 10 wide (surprised)
//           11 squeezed shut (> <) · 14 closed (asleep, a blink) · 15 cross
//   mouths: 0 resting · 1 a small "o" · 2 open "o" · 3 a frown · 5 open · 6 a wobbly frown · 7 a smile, tongue out
//           8 a big open smile
// Pure: the face for an expression and the blink at a time are unit-tested.

export const FACES = {
  neutral: [0, 0],
  happy: [9, 8],
  joy: [11, 7],
  surprised: [10, 2],
  sad: [8, 6],
  sleepy: [14, 0],
  cross: [15, 3],
  /** The sting (NH's swollen eye: a lump over the left eye, villager3d.ts adds it): pained. */
  sting: [3, 3]
} as const satisfies Record<string, readonly [eye: number, mouth: number]>;
export type Face = keyof typeof FACES;

/** A blink's closed cell and how long it stays shut (ms); blinks come every 2.4–5.4 s. */
export const BLINK = { eye: 14, ms: 110, every: [2400, 5400] } as const;

/** The eye cell at time t (ms) for an expression that keeps its eyes open, blinking on a schedule fixed by `seed` (each
 *  villager its own rhythm). Closed faces (asleep, happy, squeezed) never blink. */
export function eyeAt(face: Face, t: number, seed = 0): number {
  const [eye] = FACES[face];
  if (eye === 14 || eye === 9 || eye === 11) return eye;
  // the blink times: a deterministic jitter per period (no Math.random: the same seed blinks the same way)
  const [a, b] = BLINK.every;
  const span = (a + b) / 2;
  const n = Math.floor((t + seed * 997) / span);
  const jitter = frac(Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453);
  const at = n * span + jitter * (span - BLINK.ms) - seed * 997;
  return t >= at && t < at + BLINK.ms ? BLINK.eye : eye;
}
const frac = (x: number) => x - Math.floor(x);

/** How long (ms) from t till the face's eye or mouth cell next changes (eyeAt, mouthAt): a blink's start or end, a
 *  snore's; Infinity when it never does (a closed face, no snore). A room asks again then, not a few times a second. */
export function faceChangeIn(face: Face, t: number, seed = 0): number {
  let next = Infinity;
  const [eye] = FACES[face];
  if (eye !== 14 && eye !== 9 && eye !== 11) {
    const [a, b] = BLINK.every, span = (a + b) / 2;
    const n0 = Math.floor((t + seed * 997) / span);
    for (let n = n0; n <= n0 + 1 && next === Infinity; n++) {
      const at = n * span + frac(Math.sin(n * 12.9898 + seed * 78.233) * 43758.5453) * (span - BLINK.ms) - seed * 997;
      if (t < at) next = at - t;
      else if (t < at + BLINK.ms) next = at + BLINK.ms - t;
    }
  }
  if (face === 'sleepy') {
    // (sin(t / 900) crossing 0.55: up at asin, down at π − asin, each turn)
    const th = t / 900, a0 = Math.asin(0.55), turn = Math.PI * 2, k = Math.floor(th / turn);
    for (const c of [a0, Math.PI - a0, a0 + turn, Math.PI - a0 + turn].map((x) => x + k * turn)) {
      if (c > th) {
        next = Math.min(next, (c - th) * 900);
        break;
      }
    }
  }
  return next;
}

/** The mouth cell at time t: asleep, a slow snore (the small "o" now and then); otherwise the expression's. */
export function mouthAt(face: Face, t: number): number {
  if (face === 'sleepy') return Math.sin(t / 900) > 0.55 ? 1 : 0;
  return FACES[face][1];
}

/** The uv offset and scale that show cell i of a cols × rows atlas, over the texture's own transform (gltfpack's
 *  dequantisation: the uvs are stored as integers and scaled back by the texture's offset and repeat). */
export function cellTransform(i: number, cols: number, rows: number, base: { ox: number; oy: number; sx: number; sy: number }) {
  const c = i % cols, r = Math.floor(i / cols) % rows;
  return { ox: base.ox / cols + c / cols, oy: base.oy / rows + r / rows, sx: base.sx / cols, sy: base.sy / rows };
}
