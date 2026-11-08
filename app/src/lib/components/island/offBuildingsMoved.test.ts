// What's dropped or spawned keeps off a building moved next to the trees or onto the beach (offBuildings.test.ts's
// sweep, its own file to run beside it): every tree's drops, the day's spots, mushrooms and beach finds.
import { afterAll, describe } from 'vitest';
import { defaultLayout, withChanges, type Layout } from '#lib/layout/model.ts';
import { setWorld } from './world.ts';
import { movedBeside, noDropOn, treeTiles, userLayout } from './offBuildings.cases.ts';

afterAll(() => setWorld(null));

describe('nothing is dropped or spawned on a moved building’s ground (layout/clear.ts)', () => {
  const def = defaultLayout(), user = userLayout();
  /** The shop put down on the front beach's sand (where the shells and the bottle wash up), over the grass behind it. */
  const onTheBeach = (l: Layout) => {
    let r = 0;
    while (r < 30 && l.kind(10, r) !== 'sand') r++;
    return withChanges(l, { set: [{ ...l.objects.get('shop')!, x: 6, z: r, f: 0 }] });
  };
  noDropOn([
    ['the default with the museum beside its trees', () => movedBeside(def, 'museum', treeTiles(def))],
    // (K.K.'s stool aside: the one spot by the user's trees the museum fits is his)
    ['the user’s with the museum beside its trees', () => movedBeside(withChanges(user, { remove: ['kk-slider'] }), 'museum', treeTiles(user))],
    ['the default with the shop on the front beach', () => onTheBeach(def)]
  ]);
});
