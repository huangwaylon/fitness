// Serves build-pages/ the way Cloudflare Pages does, for the e2e tests: the exact bytes CI deploys (the build job's
// artifact), under the base path, with 404.html (the SPA fallback) for any other path, and the headers Cloudflare Pages
// adds (build-pages/_headers, scripts/headers.ts: the CSP and the rest; not its Cache-Control: here nothing is cached).
// No dependencies, starts at once.
// `node scripts/serve-build.ts <port> [base]`.
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = Number(process.argv[2] ?? 4173);
const base = (process.argv[3] ?? process.env.BASE_PATH ?? '').replace(/\/$/, '');
const root = join(import.meta.dirname, '..', 'build-pages');

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg',
  '.wav': 'audio/wav',
  '.glb': 'model/gltf-binary',
  '.bin': 'application/octet-stream',
  '.pak': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.mjs': 'text/javascript; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

/** build-pages/_headers' rules (Pages' format: a path, `*` a wildcard, then indented `Name: value` lines). */
const RULES: { path: RegExp; headers: [string, string][] }[] = [];
try {
  for (const block of readFileSync(join(root, '_headers'), 'utf8').split(/\n(?=\S)/)) {
    const [head, ...lines] = block.trim().split('\n');
    if (!head) continue;
    const path = new RegExp(`^${head.trim().replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
    const headers = lines.map((l) => l.trim().split(/:\s*(.*)/s).slice(0, 2) as [string, string]).filter(([k]) => k && k.toLowerCase() !== 'cache-control');
    RULES.push({ path, headers });
  }
} catch {
  /* no _headers: a build from before them */
}
const headersFor = (path: string): Record<string, string> => Object.fromEntries(RULES.filter((r) => r.path.test(path)).flatMap((r) => r.headers));

async function file(path: string): Promise<string | undefined> {
  try {
    const s = await stat(path);
    if (s.isFile()) return path;
    if (s.isDirectory()) return file(join(path, 'index.html'));
  } catch {
    /* missing */
  }
  return undefined;
}

createServer((req, res) => {
  serve(req, res).catch((e: unknown) => {
    console.error(req.url, e);
    if (!res.headersSent) res.writeHead(500);
    res.end();
  });
}).listen(port, '127.0.0.1', () => console.log(`build-pages on http://127.0.0.1:${port}${base}/`));

/** The e2e's stand-in for a deploy (sw-update.spec): `/__e2e/deploy` changes the service worker's bytes from then on,
 *  as a deploy's new worker would (a browser fetches a worker's script itself: Playwright can't route it). */
let deploys = 0;

async function serve(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://x');
  const path = decodeURIComponent(url.pathname);
  if (path === '/__e2e/deploy') {
    res.writeHead(200, { 'content-type': 'text/plain' }).end(String(++deploys));
    return;
  }
  if (path === base) {
    res.writeHead(301, { location: `${base}/${url.search}` }).end();
    return;
  }
  const inBase = path.startsWith(`${base}/`);
  const rel = inBase ? normalize(path.slice(base.length)).replace(/^(\.\.[/\\])+/, '') : '';
  const hit = inBase ? await file(join(root, rel)) : undefined;
  const served = hit ?? join(root, '404.html');
  let body = await readFile(served);
  if (deploys && path.endsWith('/service-worker.js')) body = Buffer.concat([body, Buffer.from(`\n// e2e deploy ${deploys}\n`)]);
  const headers = { ...headersFor(path), 'content-type': TYPES[extname(served)] ?? 'application/octet-stream', 'cache-control': 'no-store', 'accept-ranges': 'bytes' };
  // WebKit's media elements ask for byte ranges (as Pages answers them)
  const range = hit && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, body.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    res.writeHead(206, { ...headers, 'content-range': `bytes ${start}-${end}/${body.length}` });
    res.end(req.method === 'HEAD' ? undefined : body.subarray(start, end + 1));
    return;
  }
  res.writeHead(hit ? 200 : 404, headers);
  res.end(req.method === 'HEAD' ? undefined : body);
}
