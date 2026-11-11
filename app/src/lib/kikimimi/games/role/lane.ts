// ふたりで ロールプレイ's lane (round/registry.ts, its own chunk): the lobby's scene (its options' third) dealt from its
// unit's chunk (pool.ts unitPart: the dialogues and the unit's phrases), every phone the same. The scene is the host's
// pick on the lobby page (`pickScene`, kept while the app is open), else the first at the place's stage. My row is
// minutes only (record: none; contract/listen.ts minutesOnly): nothing heard or said is in it. Its pages:
// components/kikimimi/role/views.ts.
import type { Level } from '../../bank.ts';
import { PLACES } from '../../catalog.ts';
import { INDEX, unitPart, type Unit } from '../../pool.ts';
import type { Lane, Phone } from '../../round/registry.ts';
import { TIMERS } from '../../seed.ts';
import { BUILD_V } from '../versions.ts';
import { roleCv, roleDeal, roleGame, roleOpts, type RoleCard, type RoleOpts, type RoleSource } from './def.ts';
import { SCENES, type Scene } from './scenes.ts';

const OPTS = roleOpts(SCENES.length);
const sceneOf = (o: readonly number[]): Scene | undefined => {
  const d = OPTS.decode(o);
  return d ? SCENES[d.scene] : undefined;
};

/** A unit's place's level (かわ 3, もり 4: the quiz family's view reads it), from the index's path line. */
function levelOfUnit(unit: string): Level {
  const stage = INDEX.paths.find((p) => p[0] === unit)?.[2];
  return (PLACES.find((p) => p.id === stage)?.lvs[0] ?? 3) as Level;
}

/** The scenes this build can deal (their units in the index), by number. */
export const playableScenes = (): number[] => SCENES.flatMap((s, k) => (INDEX.units[s.unit] ? [k] : []));

/** The host's pick on the lobby page (null: none yet). */
let picked: number | null = null;
export const pickScene = (k: number): void => void (picked = k);

/** The scene a lobby opens on: the pick, else the first at the place of `lv` (else the first). */
function sceneFor(lv: number): number {
  const ok = playableScenes();
  if (picked !== null && ok.includes(picked)) return picked;
  return ok.find((k) => levelOfUnit(SCENES[k].unit) === lv) ?? ok[0] ?? 0;
}

const source = (phone: Phone): RoleSource => ({
  scenes: SCENES.length,
  cards: (seed, o) => phone.items({ gm: 'role', seed, o: OPTS.encode(o) }) as RoleCard[],
  cv: (o) => {
    const s = SCENES[o.scene];
    return s && roleCv(s, phone.cv('lesson', s.unit as Unit), BUILD_V.role);
  }
});

export const lane: Lane<RoleOpts> = {
  id: 'role',
  def: (phone) => roleGame(source(phone)),
  chunks: ({ o }) => {
    const s = sceneOf(o);
    return s ? [s.unit as Unit] : [];
  },
  deal: (d) => {
    const s = sceneOf(d.o), part = s && unitPart(s.unit);
    return s && part ? roleDeal(s, part) : [];
  },
  opts: ({ lv }) => {
    const scene = sceneFor(lv);
    return OPTS.encode({ lv: levelOfUnit(SCENES[scene]?.unit ?? ''), timer: TIMERS[3], scene });
  },
  // (minutes only: the recorder keeps the row without answers)
  record: () => [],
  title: { game: 'kiki.mode.role', lobby: 'kiki.mode.role' }
};
