import { defineConfig } from 'vitest/config';

// The contract lives in app/ and the key check in relay/; app's nearest tsconfig extends SvelteKit's generated one,
// which an its-only checkout doesn't have. Those files need no tsconfig to transform (as relay/vitest.config.ts).
export default defineConfig({ oxc: { tsconfig: false } as never, test: { include: ['test/**/*.test.ts'], setupFiles: ['test/setup.ts'] } });
