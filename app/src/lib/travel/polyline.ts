// A line of [lon, lat] points as a polyline string (Google's encoding, five decimals: each point its step from the
// last, five bits a character), the way the guides' legs ship (vite.config.ts trip-lines: ~45 % less gzip than the
// numbers). Pure: the build encodes, the guide's chunk decodes as it loads.

const SCALE = 1e5;

/** `line` as a string; it throws for a point finer than five decimals (the string would round it). */
export function encodeLine(line: readonly (readonly [number, number])[]): string {
  let out = '', px = 0, py = 0;
  const put = (d: number) => {
    let v = d < 0 ? ~(d << 1) : d << 1;
    while (v >= 0x20) {
      out += String.fromCharCode((0x20 | (v & 0x1f)) + 63);
      v >>= 5;
    }
    out += String.fromCharCode(v + 63);
  };
  for (const [lon, lat] of line) {
    const x = Math.round(lon * SCALE), y = Math.round(lat * SCALE);
    if (x / SCALE !== lon || y / SCALE !== lat) throw new Error(`encodeLine: [${lon}, ${lat}] is finer than five decimals`);
    put(y - py);
    put(x - px);
    px = x;
    py = y;
  }
  return out;
}

export function decodeLine(s: string): [number, number][] {
  const out: [number, number][] = [];
  let i = 0, x = 0, y = 0;
  const take = () => {
    let v = 0, shift = 0, b: number;
    do {
      b = s.charCodeAt(i++) - 63;
      v |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    return v & 1 ? ~(v >> 1) : v >> 1;
  };
  while (i < s.length) {
    y += take();
    x += take();
    out.push([x / SCALE, y / SCALE]);
  }
  return out;
}
