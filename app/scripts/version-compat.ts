// After `vite build` (npm run build runs it): Kit's build-pages/_app/version.json gets this build's compatibility
// epoch (`compat`: src/lib/contract/compat.ts), which the pages of older builds read (ui-state/update.ts).
//   node scripts/version-compat.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { COMPAT } from '../src/lib/contract/compat.ts';

const file = join(import.meta.dirname, '..', 'build-pages', '_app', 'version.json');
const v = JSON.parse(readFileSync(file, 'utf8')) as { version: string };
writeFileSync(file, JSON.stringify({ ...v, compat: COMPAT }));
console.log(`_app/version.json: ${v.version}, compat ${COMPAT}`);
