// The specs ask the island by kind and id (window.__world3d: island/probe.ts), never by the hidden DOM island's
// selectors (docs/ops/testing.md "The test API"; the R4 plan: the DOM island goes, its nodes with it). Each family moved
// off the DOM lists its selectors here; only the hook layer (probe.ts, e2e/island.ts, e2e/probe.spec.ts) may name them,
// and a line marked `// r4-dom: <why>` (what only a later step can move: the 3D pick, the canvas router).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const E2E = join(import.meta.dirname, '../../../../e2e');
const SCRIPTS = join(import.meta.dirname, '../../../../scripts');
/** The hook layer: what reads the DOM island for the specs, for now. */
const HOOKS = new Set(['island.ts', 'probe.spec.ts']);

/** The DOM island's selectors by family (what replaced them: `__world3d`'s hook, e2e/island.ts's helper). */
const FORBIDDEN: Record<string, RegExp[]> = {
  // actor(slot): walking, act, fx, hat, stung, swollen, tricked, inside, seat, gym, who, v3; box('villager', slot);
  // tapOn/tapBox; feetOf, walking, villager, slotOf; watchComings' and watchFor's { actor, is }; controls()
  villagers: [/data-actor(?![\w-])/, /\.vil(?![\w-])/, /\.actor[[:.\s'"]/, /data-(stung|swollen|tricked|hat|inside|gym|seat|v3)(?![\w-])/, /\.body\[data-act/, /\.fxa?\.(confetti|hearts|sparkles)/],
  // pick(x, y)'s kind 'building' and box('building', id) (its door's tap area); the ids from __world.geo().BUILDINGS
  buildings: [/data-building(?![\w-])/, /(?<!dataset)\.door(?![\w-])/],
  // goal(tree): its popup open, its glints; fruit(tree): stage, up, dropping, grey; box('goal' | 'row' | 'trunk' |
  // 'fruit' | 'tree', id); pick's 'goal', 'row', 'tree'; pointOn, canopyAt. (The popup, .detail, is an overlay: it stays.)
  trees: [/(?<!__world3d|\?)\.(canopy|glints?|fruit)(?![\w-])/, /(trunk|row)-btn|hit-trunk/, /data-tree(-node|-row|-part)?(?![\w-])/, /data-fruit(?![\w-])/, /data-stage="(tree|fall|ground)"/],
  // scenery(id): look, sit, fixture, tipped, lit, watered (piece, watered); drawn(kind, id) what it draws; pick's and
  // box's 'bush' | 'campfire' | 'sit' | 'fixture' | 'flower' | 'decor'; tapOn, pointOn. (The sheets' data-look-* stay.)
  // critters(): id, place, flight, stalk, sat, water, pool, shape, box (critter, isOut, mid); box('critter' | 'bobber' |
  // 'bubbles' | 'chase'); dive(): bubbles, dive (diveNow); my float off __fish.line() (float), the others' __fish.lines()
  critters: [/data-(critter|place|water|pool|shadow-of|stalk|bobber|bubbles|dive|angler|flight)(?![\w-])/, /is-fin|\.fin(?![\w-])/, /\]\.sat(?![\w-])/, /data-line="?(bite|wait|cast)/],
  scenery: [/data-(bush|campfire|sit|fixture|tipped|flower|watered|lit|scenery-id|decor)(?![\w-])/, /data-part="(canopy|trunk|body)"/, /\] \[data-look\]/, /'data-look', 'deco\//, /\.tongue|\.deco(?![\w-])/],
  // finds(): kind, id, uid, tree, fall, shown, foot, box (findsOut, findCount); care(): the weeds (uid, sprout), the rock
  // (careOut); spots(): the day's digs and weeds (daySpots); box('find' | 'care', id); the balloon box('balloon')
  finds: [/data-(find|care|digs|weeds|tree-gift|uid)(?![\w-])/, /\.item\.(spot|weed|rock|mush|gift|shell|frag|bottle)/, /\.if-scene \.balloon|'\.balloon'/],
  // visitors(): slot, phase, way, stage, asleep, motion, vegAsk, walking, K.K.'s mode and playing; shown, card, emote, fx,
  // treat, heart (visitorOut, visitorsOut; watchFor's { visitor, is }); props(): the cake, the arch, the toys, Halloween
  // and its pumpkins, the tape deck (propsOut); box('visitor' | 'kk' | 'cake' | 'arch' | 'toy' | 'deck'). (The mumble,
  // [data-mumble], and K.K.'s caption are overlays: they stay. Kiroku's data-stretch and data-stretched aren't these.)
  visitors: [
    /data-(visitor|kk|cake|arch|toy|veg-ask|veg-want|treat|heart-float|halloween|pumpkin|asleep|way|popper|motion|slot)(?![\w-])/,
    /data-stretch="(on|ready|idle)"|\[data-stretch\]( \.|:not)/, /data-phase="(arrive|here|leave)"/,
    /\.(pumpkin|candy|radio)(?![\w-])/, /\.fxa\.zzz/, /\] \.art(?![\w-])/, /\.(emote|glow)['"`\s:]/
  ]
};

const files = [
  ...readdirSync(E2E).filter((f) => /\.ts$/.test(f) && !HOOKS.has(f)).map((f) => join(E2E, f)),
  join(SCRIPTS, 'leak-probe.ts')
];

describe('the specs never select the hidden DOM island', () => {
  for (const [family, res] of Object.entries(FORBIDDEN))
    it(family, () => {
      const hits = files.flatMap((f) =>
        readFileSync(f, 'utf8').split('\n').flatMap((line, i) => (!line.includes('r4-dom:') && res.some((re) => re.test(line)) ? [`${f.split('/').slice(-2).join('/')}:${i + 1}: ${line.trim().slice(0, 120)}`] : []))
      );
      expect(hits).toEqual([]);
    });
});
