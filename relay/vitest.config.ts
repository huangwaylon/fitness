import { defineConfig } from 'vitest/config';

// The shared protocol lives in app/; its nearest tsconfig (app's) extends SvelteKit's generated one, which a relay-only
// checkout doesn't have. The relay's files need no tsconfig to transform.
export default defineConfig({
  oxc: { tsconfig: false } as never,
  // a heavy test (schema's month of hourly runs ~2.5 s, compact's year ~4.7 s alone) never times out on a busy machine:
  // the default 5 s made a run under load fail now and then
  test: { include: ['test/**/*.test.ts'], testTimeout: 30_000 }
});
