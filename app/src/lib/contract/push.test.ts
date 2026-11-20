// やること's push routes (contract/push.ts): one path each, all under /api/push (the relay's pushRoute.ts matches on
// these, the app's lib/push posts to them), none shared.
import { describe, expect, it } from 'vitest';
import { PUSH_PATHS } from './push.ts';

describe('PUSH_PATHS', () => {
  it('the state route is /api/push and the rest are under it, each its own', () => {
    expect(PUSH_PATHS.status).toBe('/api/push');
    const paths = Object.values(PUSH_PATHS);
    expect(new Set(paths).size).toBe(paths.length);
    for (const p of paths) expect(p).toMatch(/^\/api\/push(\/[a-z]+)?$/);
  });
});
