// Writes build-pages/_headers, the response headers Cloudflare Pages serves the site with (docs/ops/runbook.md §1). `npm run build` runs it after `vite build`.
// - The Content-Security-Policy is the one SvelteKit wrote into index.html's <meta> (vite.config.ts `csp`: the relay's
//   origins, data:/blob: images and media, the hash of its inline bootstrap script, inline styles), plus what a <meta>
//   can't carry: frame-ancestors 'none'. The <meta> stays (the same policy; both apply).
// - Hashed files (`_app/immutable/`) are cached for a year; everything else keeps Pages' default (revalidated).
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'build-pages');
const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const csp = /<meta http-equiv="content-security-policy" content="([^"]+)"/.exec(html)?.[1];
if (!csp) throw new Error('headers: no content-security-policy <meta> in build-pages/index.html');

const permissions = ['camera', 'microphone', 'geolocation', 'payment', 'usb', 'serial', 'bluetooth', 'hid', 'midi', 'accelerometer', 'gyroscope', 'magnetometer', 'display-capture', 'browsing-topics']
  .map((f) => `${f}=()`)
  .join(', ');

const headers = `${base}/*
  Content-Security-Policy: ${csp.replace(/&#39;/g, "'").replace(/&quot;/g, '"')}; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  Referrer-Policy: no-referrer
  Permissions-Policy: ${permissions}
  X-Frame-Options: DENY
  Cross-Origin-Opener-Policy: same-origin
  Strict-Transport-Security: max-age=31536000; includeSubDomains

${base}/_app/immutable/*
  Cache-Control: public, max-age=31536000, immutable
`;
writeFileSync(join(root, '_headers'), headers);
console.log(`build-pages/_headers: ${headers.split('\n').length} lines`);
