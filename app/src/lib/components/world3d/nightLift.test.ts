import { describe, expect, it } from 'vitest';
import { MeshLambertMaterial } from 'three';
import { nightLift, nightTag } from './nightLift.ts';

describe('the night lift', () => {
  it('lifts the finds and the critters at night, a fish shadow denser; nothing by day, nothing else', () => {
    const find = new MeshLambertMaterial(), bug = new MeshLambertMaterial(), tree = new MeshLambertMaterial();
    const shadow = new MeshLambertMaterial({ transparent: true, opacity: 0.45 });
    expect(nightTag(find, 'finds/dig-spot')).toBe(true);
    expect(nightTag(find, 'finds/dig-spot')).toBe(false);
    expect(nightTag(bug, 'critters/bugs/moth')).toBe(true);
    expect(nightTag(shadow, 'critters/shadows/sea-3')).toBe(true);
    expect(nightTag(tree, 'trees/hardwood')).toBe(false);
    expect(nightLift(find, 0)).toBe(0);
    expect(nightLift(find, 1)).toBeGreaterThan(0.2);
    expect(nightLift(bug, 1)).toBeGreaterThan(0.2);
    expect(nightLift(tree, 1)).toBe(0);
    expect(nightLift(shadow, 1)).toBe(0);
    expect(shadow.opacity).toBeGreaterThan(0.6);
    nightLift(shadow, 0);
    expect(shadow.opacity).toBe(0.45);
  });
});
