import { describe, expect, it, vi } from 'vitest';
import { makeRenderer, NoWebGL } from './stage.ts';

/** A canvas WebGL refuses (WebKit under load): its listeners kept to be fired by hand. */
class Refusing {
  on = new Map<string, Set<EventListener>>();
  addEventListener(type: string, fn: EventListener) {
    (this.on.get(type) ?? this.on.set(type, new Set()).get(type)!).add(fn);
  }
  removeEventListener(type: string, fn: EventListener) {
    this.on.get(type)?.delete(fn);
  }
  setAttribute() {}
  getContext() {
    return null;
  }
  fire(type: string) {
    for (const fn of this.on.get(type) ?? []) fn(new Event(type));
  }
}

describe('makeRenderer', () => {
  it('a refused context: NoWebGL, and none of three’s listeners left on the canvas (a later restore ran the dead one: "info.autoReset" of undefined)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const c = new Refusing();
    expect(() => makeRenderer(c as unknown as HTMLCanvasElement)).toThrow(NoWebGL);
    expect([...c.on.values()].reduce((n, s) => n + s.size, 0)).toBe(0);
    expect(() => c.fire('webglcontextrestored')).not.toThrow();
    // (its own method again, not the wrapper)
    expect(Object.hasOwn(c, 'addEventListener')).toBe(false);
  });
});
