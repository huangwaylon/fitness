import { defineConfig } from 'vitest/config';

// The shared protocol lives in app/; its nearest tsconfig (app's) extends SvelteKit's generated one, which a relay-only
// checkout doesn't have. The relay's files need no tsconfig to transform.
export default defineConfig({
  oxc: { tsconfig: false } as never,
  test: { include: ['test/**/*.test.ts'] }
});
