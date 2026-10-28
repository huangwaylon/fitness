// CORS for the GitHub Pages build of the UI (another origin than the API on the Mac). Only origins listed in
// CORS_ORIGINS (comma-separated, e.g. https://huangwaylon.github.io) get access, and only to /api/*.

export function allowedOrigins(env = process.env): Set<string> {
  return new Set((env.CORS_ORIGINS ?? '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean));
}

/** The request's Origin if it's an allowed cross-origin caller of /api/*, else null. */
export function corsOrigin(request: Request, pathname: string, env = process.env): string | null {
  if (!(pathname === '/api' || pathname.startsWith('/api/'))) return null;
  const origin = request.headers.get('origin');
  return origin && allowedOrigins(env).has(origin) ? origin : null;
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type, accept',
    'access-control-max-age': '600',
    vary: 'Origin'
  };
}

export function withCors(res: Response, origin: string | null): Response {
  if (!origin) return res;
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(corsHeaders(origin))) out.headers.set(k, v);
  return out;
}
