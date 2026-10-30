import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// CI installs from the public registry. A lockfile written behind a private npm mirror bakes in hosts the
// GitHub runner can't reach, and `npm ci` fails with no useful message.
describe('package-lock.json', () => {
  it('resolves every package from registry.npmjs.org', () => {
    const lock = readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8');
    // any scheme (http://, git+ssh://, …), not just https://: each must be the public registry over https
    const hosts = new Set([...lock.matchAll(/"resolved": "([a-z+]+:\/\/[^/"]+)/g)].map((m) => m[1]));
    expect([...hosts]).toEqual(['https://registry.npmjs.org']);
  });
});
