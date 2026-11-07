// `/stt/*` from R2 (docs/kikimimi-mic.md §3.6): ききみみ's recogniser files (the model's parts, the ONNX runtime,
// manifest.json), uploaded under `stt/` by `node scripts/stt-models.ts --r2 <bucket>`, served same-origin and immutable
// (every path carries its revision or version; manifest.json is revalidated). Inert until the Pages project has the
// bucket bound as STT_BUCKET (W2-R's bucket, the user's Cloudflare step): without the binding, or for a key R2 hasn't
// got, the request goes on to the static files, where the deploy's stopgap puts the same files (pages.yml: from an
// Actions cache). So moving to R2 is a binding, then dropping the deploy's copy step. Only GET and HEAD; no Range.
interface R2Object {
  body: ReadableStream;
  size: number;
  httpEtag: string;
}
interface Env {
  STT_BUCKET?: { get(key: string): Promise<R2Object | null> };
}
interface Ctx {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
  next(): Promise<Response>;
}

const TYPES: Record<string, string> = { json: 'application/json', mjs: 'text/javascript' };

export async function onRequest({ request, env, params, next }: Ctx): Promise<Response> {
  const path = ([] as string[]).concat(params.path ?? []).join('/');
  const immutable = path !== 'manifest.json';
  if (!env.STT_BUCKET || (request.method !== 'GET' && request.method !== 'HEAD') || !path || path.split('/').includes('..')) return headed(await next(), immutable);
  const obj = await env.STT_BUCKET.get(`stt/${path}`);
  if (!obj) return headed(await next(), immutable);
  const ext = path.slice(path.lastIndexOf('.') + 1);
  const h = new Headers({ 'Content-Type': TYPES[ext] ?? 'application/octet-stream', 'Content-Length': String(obj.size), ETag: obj.httpEtag, 'X-Content-Type-Options': 'nosniff' });
  h.set('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
  return new Response(request.method === 'HEAD' ? null : obj.body, { headers: h });
}

/** A static file's answer with the cache rule (a Function's responses don't get _headers'); an error left as it is. */
function headed(res: Response, immutable: boolean): Response {
  if (!res.ok) return res;
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', immutable ? 'public, max-age=31536000, immutable' : 'no-cache');
  return out;
}
