// Usage: npm run pair -- A   → prints a single-use 6-digit code (10 min). Enter it inside the installed PWA.
import { openDb } from '#lib/server/db/index.ts';
import { PAIRING_MAX_ATTEMPTS, createPairingCode } from '#lib/server/auth.ts';

const person = process.argv[2];
if (person !== 'A' && person !== 'B') {
  console.error('usage: npm run pair -- A|B');
  process.exit(1);
}
const { code, expiresAt } = createPairingCode(openDb(), person);
console.log(`Pairing code for ${person}: ${code.slice(0, 3)} ${code.slice(3)}  (expires ${expiresAt}, ${PAIRING_MAX_ATTEMPTS} attempts)`);
