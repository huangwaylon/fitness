// The room's admission ticket (contract/ticket.ts, relay/src/auth.ts admission: relay review O3, the server half): a
// ticket among a socket's subprotocols names its person, signed under their key; the Worker marks the request with
// it, refuses a bad one or none (required since 2026-11-10); the room's answer names a subprotocol offered.
import { describe, expect, it } from 'vitest';
import { admission, subprotocolOf, TICKET_HEADER } from '../src/auth.ts';
import { makeTicket, ROOM_PROTOCOL, TICKET_MAX_MS, TICKET_TTL_MS, ticketIn, ticketOwner } from '../../app/src/lib/contract/ticket.ts';

const KEY_A = 'a1'.repeat(16), KEY_B = 'b2'.repeat(16), KEY_C = 'c3'.repeat(16);
const keys = { KEY_A, KEY_B, KEY_C };
const NOW = 1_793_000_000_000;
const up = (protocols?: string, extra: Record<string, string> = {}) =>
  new Request('https://relay.example/room', { headers: { Upgrade: 'websocket', ...(protocols ? { 'Sec-WebSocket-Protocol': protocols } : {}), ...extra } });

describe('the ticket', () => {
  it('names its person, signed under their key, until its exp', async () => {
    const t = await makeTicket(KEY_A, 'A', NOW + TICKET_TTL_MS);
    expect(t).toMatch(/^tk\.A\.[0-9a-z]+\.[0-9a-f]{64}$/);
    expect(await ticketOwner(t, keys, NOW)).toBe('A');
    expect(await ticketOwner(await makeTicket(KEY_C.toUpperCase(), 'G', NOW + 1000), keys, NOW)).toBe('G'); // keys compare in lower case
    // past its exp, too far ahead, another's key, another's name, tampered, junk: nobody
    expect(await ticketOwner(t, keys, NOW + TICKET_TTL_MS)).toBeNull();
    expect(await ticketOwner(await makeTicket(KEY_A, 'A', NOW + TICKET_MAX_MS + 1), keys, NOW)).toBeNull();
    expect(await ticketOwner(await makeTicket(KEY_B, 'A', NOW + 1000), keys, NOW)).toBeNull();
    expect(await ticketOwner(t.replace('tk.A.', 'tk.B.'), keys, NOW)).toBeNull();
    expect(await ticketOwner(t.slice(0, -1) + (t.endsWith('0') ? '1' : '0'), keys, NOW)).toBeNull();
    expect(await ticketOwner('tk.A.zz.00', keys, NOW)).toBeNull();
    // no guest key: no guest ticket
    expect(await ticketOwner(await makeTicket(KEY_C, 'G', NOW + 1000), { KEY_A, KEY_B }, NOW)).toBeNull();
  });

  it('is found among the subprotocols', () => {
    expect(ticketIn(`${ROOM_PROTOCOL}, tk.A.x.ab`)).toBe('tk.A.x.ab');
    expect(ticketIn(ROOM_PROTOCOL)).toBeNull();
    expect(ticketIn(null)).toBeNull();
    expect(subprotocolOf(`tk.A.x.ab, ${ROOM_PROTOCOL}`)).toBe(ROOM_PROTOCOL);
    expect(subprotocolOf('other')).toBe('other');
    expect(subprotocolOf(null)).toBeNull();
  });
});

describe('the admission', () => {
  it('marks a ticketed socket with its person, refuses a bad ticket or none (it never reaches the room), and never trusts a client’s mark', async () => {
    const t = await makeTicket(KEY_B, 'B', NOW + TICKET_TTL_MS);
    const ok = await admission(up(`${ROOM_PROTOCOL}, ${t}`, { [TICKET_HEADER]: 'A' }), keys, NOW);
    expect(ok?.headers.get(TICKET_HEADER)).toBe('B');
    expect(ok?.headers.get('Sec-WebSocket-Protocol')).toBe(`${ROOM_PROTOCOL}, ${t}`);
    expect(await admission(up(`${ROOM_PROTOCOL}, ${t}`), keys, NOW + TICKET_TTL_MS)).toBeNull();
    expect(await admission(up(undefined, { [TICKET_HEADER]: 'A' }), keys, NOW)).toBeNull();
    expect(await admission(up(ROOM_PROTOCOL), keys, NOW)).toBeNull();
  });
});
