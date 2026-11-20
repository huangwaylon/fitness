// A fake GitHub for the backups' tests (archive.test.ts, objects.test.ts): a release's assets and the calls made
// (never the token in a URL).
import { expect } from 'vitest';

export const TOKEN = 'github_pat_' + 'x'.repeat(40);

/** A release's assets on a fake GitHub, and the calls made (never the token in a URL). */
export function fakeGitHub(o: { release?: boolean; fail?: { method: string; status: number } } = {}) {
  let id = 100, release: { id: number; tag: string } | null = o.release === false ? null : { id: 7, tag: 'dumps' };
  const assets = new Map<number, { name: string; size: number; body?: Uint8Array }>();
  const calls: string[] = [];
  const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } });
  const fetch = async (url: string, init: RequestInit): Promise<Response> => {
    const method = init.method ?? 'GET';
    const u = new URL(url);
    calls.push(`${method} ${u.host === 'uploads.github.com' ? 'upload' : u.pathname.replace('/repos/o/r', '')}${u.searchParams.get('name') ? ` ${u.searchParams.get('name')}` : ''}`);
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${TOKEN}`);
    expect(url).not.toContain(TOKEN);
    if (o.fail && o.fail.method === method) return new Response('nope', { status: o.fail.status });
    const p = u.pathname.replace('/repos/o/r', '');
    if (method === 'GET' && p.startsWith('/releases/tags/')) return release && p.endsWith(`/${release.tag}`) ? json({ id: release.id, upload_url: `https://uploads.github.com/repos/o/r/releases/${release.id}/assets{?name,label}` }) : json({}, 404);
    if (method === 'POST' && p === '/releases') {
      const b = JSON.parse(String(init.body)) as { tag_name: string };
      release = { id: 8, tag: b.tag_name };
      return json({ id: 8, upload_url: 'https://uploads.github.com/repos/o/r/releases/8/assets{?name,label}' }, 201);
    }
    if (method === 'GET' && p.endsWith('/assets')) {
      const page = Number(u.searchParams.get('page')), all = [...assets].map(([i, a]) => ({ id: i, name: a.name }));
      return json(all.slice((page - 1) * 100, page * 100));
    }
    if (method === 'POST' && u.host === 'uploads.github.com') {
      const name = u.searchParams.get('name')!;
      if ([...assets.values()].some((a) => a.name === name)) return json({}, 422);
      assets.set(++id, { name, size: (init.body as Uint8Array).length, body: init.body as Uint8Array });
      return json({ id, name }, 201);
    }
    const m = /^\/releases\/assets\/(\d+)$/.exec(p);
    if (m && method === 'DELETE') return assets.delete(Number(m[1])) ? new Response(null, { status: 204 }) : json({}, 404);
    if (m && method === 'PATCH') {
      assets.get(Number(m[1]))!.name = (JSON.parse(String(init.body)) as { name: string }).name;
      return json({ id: Number(m[1]) });
    }
    return json({}, 400);
  };
  const names = () => [...assets.values()].map((a) => a.name).sort();
  const add = (name: string) => assets.set(++id, { name, size: 1 });
  return { fetch, calls, names, add, assets, release: () => release };
}
