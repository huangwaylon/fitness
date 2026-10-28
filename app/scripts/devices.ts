// Usage: npx tsx scripts/devices.ts            → list devices
//        npx tsx scripts/devices.ts revoke <id> → revoke a device (session or token)
import { openDb } from '#lib/server/db/index.ts';
import { device } from '#lib/server/db/schema.ts';
import { revokeDevice } from '#lib/server/auth.ts';

const db = openDb();
const [cmd, id] = process.argv.slice(2);
if (cmd === 'revoke') {
  console.log(revokeDevice(db, Number(id)) ? `revoked #${id}` : `no active device #${id}`);
} else {
  for (const d of db.select().from(device).all()) {
    console.log(`#${d.id}\t${d.person}\t${d.kind}\t${d.label}\tlast seen ${d.lastSeenAt ?? '-'}\t${d.revokedAt ? `REVOKED ${d.revokedAt}` : 'active'}`);
  }
}
