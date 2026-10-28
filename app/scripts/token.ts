// Usage: npm run token -- A hae|shortcut <label>   → prints a bearer token ONCE (only its hash is stored).
import { openDb } from '#lib/server/db/index.ts';
import { createDeviceToken } from '#lib/server/auth.ts';

const [person, kind, ...labelParts] = process.argv.slice(2);
const label = labelParts.join(' ');
if ((person !== 'A' && person !== 'B') || (kind !== 'hae' && kind !== 'shortcut') || !label) {
  console.error('usage: npm run token -- A|B hae|shortcut <label>');
  process.exit(1);
}
const { token, deviceId } = createDeviceToken(openDb(), person, kind, label);
console.log(`device #${deviceId} (${person}, ${kind}, "${label}")`);
console.log(`Authorization: Bearer ${token}`);
console.log('Store it in Health Auto Export / the Shortcut now; it cannot be shown again.');
