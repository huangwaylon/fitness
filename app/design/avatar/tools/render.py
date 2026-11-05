# Tiny software renderer for the dump's COLLADA files (bind pose, identity skins).
# usage: render.py out.png size yawdeg spec [spec...]
#  spec = path/to/file.dae[:skip=Name1,Name2][:tint=mat=#rrggbb,...][:tex=mat=/abs.png,...]
import sys, re, math, os
import numpy as np
from PIL import Image

def parse_dae(path):
    s = open(path, encoding='utf-8-sig').read()
    geoms = []
    for g in re.finditer(r'<geometry id="([^"]+)" name="([^"]+)">(.*?)</geometry>', s, re.S):
        gid, name, body = g.groups()
        arrs = {m.group(1): np.array(m.group(2).split(), dtype=np.float32)
                for m in re.finditer(r'<float_array id="([^"]+)"[^>]*>([^<]*)</float_array>', body)}
        tri = re.search(r'<triangles material="([^"]+)" count="(\d+)">(.*?)</triangles>', body, re.S)
        if not tri: continue
        mat, cnt, tb = tri.groups()
        inputs = re.findall(r'<input semantic="(\w+)" source="#([^"]+)" offset="(\d+)"', tb)
        stride = max(int(o) for _, _, o in inputs) + 1
        p = np.array(re.search(r'<p>([^<]*)</p>', tb).group(1).split(), dtype=np.int64).reshape(-1, stride)
        # resolve VERTEX -> positions
        def arr_for(src):
            for k, v in arrs.items():
                if k.startswith(src.replace('-vertex', '-position')) or k.startswith(src): return v
        pos = uv = col = None; pi = ui = ci = None
        for sem, src, off in inputs:
            off = int(off)
            if sem == 'VERTEX': pos = arrs[src.replace('-vertex', '-position') + '-array'].reshape(-1, 3); pi = p[:, off]
            if sem == 'COLOR': col = arrs[src + '-array'].reshape(-1, 4); ci = p[:, off]
            if sem == 'TEXCOORD' and uv is None:
                uv = arrs[src + '-array'].reshape(-1, 2); ui = p[:, off]
        geoms.append(dict(name=name, mat=mat, P=pos[pi].reshape(-1, 3, 3),
                          UV=(uv[ui].reshape(-1, 3, 2) if uv is not None else None), C=(col[ci].reshape(-1, 3, 4).mean(1) if col is not None else None)))
    imgs = dict(re.findall(r'<image id="([^"]+)">\s*<init_from>([^<]+)</init_from>', s))
    return geoms, imgs

def hexrgb(h): h = h.lstrip('#'); return np.array([int(h[i:i+2], 16) for i in (0, 2, 4)], np.float32) / 255

CULL = float(os.environ.get('CULL', '0'))
def main():
    out, size, yaw = sys.argv[1], int(sys.argv[2]), math.radians(float(sys.argv[3]))
    tris = []
    for spec in sys.argv[4:]:
        parts = spec.split(':'); path = parts[0]; opts = {}
        for o in parts[1:]:
            k, v = o.split('=', 1); opts[k] = v
        skip = set(opts.get('skip', '').split(',')) - {''}
        only = set(opts.get('only', '').split(',')) - {''}
        tint = {}; tex = {}
        for kv in opts.get('tint', '').split(','):
            if kv: m, c = kv.split('='); tint[m] = hexrgb(c)
        for kv in opts.get('tex', '').split(','):
            if kv: m, t = kv.split('=', 1); tex[m] = t
        geoms, imgs = parse_dae(path); d = os.path.dirname(path)
        off = np.array([float(x) for x in opts.get('off', '0,0,0').split(',')], np.float32)
        for g in geoms: g['P'] = g['P'] + off
        for g in geoms:
            if g['name'] in skip or g['mat'] in skip: continue
            if only and g['name'] not in only and g['mat'] not in only: continue
            if 'dropc' in opts and g['C'] is not None:
                cen = g['P'].mean(1)
                k = ~((g['C'][:, int(opts['dropc'])] > 0.5) & (np.abs(cen[:, 0]) < 2.75) & (cen[:, 2] > 0.3))
                g['P'] = g['P'][k]; g['UV'] = g['UV'][k] if g['UV'] is not None else None; g['C'] = g['C'][k]
            if 'vc' in opts and g['C'] is not None: g['VC'] = True
            texpath = tex.get(g['mat'])
            if texpath is None:
                for key in (g['mat'] + '_Alb', g['mat'] + '_AlbGry', g['mat'] + '_AlbOry'):
                    if key in imgs: texpath = os.path.join(d, imgs[key]); break
            T = None
            if texpath and os.path.exists(texpath):
                T = np.asarray(Image.open(texpath).convert('RGBA'), np.float32) / 255
            tris.append((g, T, tint.get(g['mat'], np.ones(3, np.float32)))); g['frame'] = 'frame' in opts; g['cull'] = float(opts.get('cull', '0'))
    fr = [g for g, _, _ in tris if g['frame']] or [g for g, _, _ in tris]
    allP = np.concatenate([g['P'].reshape(-1, 3) for g in fr])
    c, s_ = math.cos(yaw), math.sin(yaw)
    R = np.array([[c, 0, s_], [0, 1, 0], [-s_, 0, c]], np.float32)
    lo, hi = allP.min(0), allP.max(0); ctr = (lo + hi) / 2
    ext = max(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]) * float(os.environ.get('PAD', '1.08'))
    scale = size / ext
    img = np.zeros((size, size, 3), np.float32) + np.array([0.86, 0.88, 0.84], np.float32)
    zb = np.full((size, size), -1e9, np.float32)
    L = np.array([0.4, 0.6, 0.7], np.float32); L /= np.linalg.norm(L)
    for g, T, tint in tris:
        P = (g['P'] - ctr) @ R.T
        X = P[..., 0] * scale + size / 2; Y = size / 2 - P[..., 1] * scale; Z = P[..., 2]
        n = np.cross(P[:, 1] - P[:, 0], P[:, 2] - P[:, 0]); nl = np.linalg.norm(n, axis=1, keepdims=True) + 1e-9; n /= nl
        shade = 0.55 + 0.45 * np.abs(n @ L)
        for t in range(len(P)):
            x0, y0, x1, y1, x2, y2 = X[t, 0], Y[t, 0], X[t, 1], Y[t, 1], X[t, 2], Y[t, 2]
            minx, maxx = int(max(0, math.floor(min(x0, x1, x2)))), int(min(size - 1, math.ceil(max(x0, x1, x2))))
            miny, maxy = int(max(0, math.floor(min(y0, y1, y2)))), int(min(size - 1, math.ceil(max(y0, y1, y2))))
            if minx > maxx or miny > maxy: continue
            den = (y1 - y2) * (x0 - x2) + (x2 - x1) * (y0 - y2)
            if abs(den) < 1e-9: continue
            if g['cull'] and den * g['cull'] < 0: continue
            xs, ys = np.meshgrid(np.arange(minx, maxx + 1) + 0.5, np.arange(miny, maxy + 1) + 0.5)
            a = ((y1 - y2) * (xs - x2) + (x2 - x1) * (ys - y2)) / den
            b = ((y2 - y0) * (xs - x2) + (x0 - x2) * (ys - y2)) / den
            cc = 1 - a - b
            m = (a >= 0) & (b >= 0) & (cc >= 0)
            if not m.any(): continue
            z = a * Z[t, 0] + b * Z[t, 1] + cc * Z[t, 2]
            zs = zb[miny:maxy + 1, minx:maxx + 1]
            m &= z > zs
            if not m.any(): continue
            col = np.broadcast_to(tint, xs.shape + (3,)).copy(); alpha = np.ones(xs.shape, np.float32)
            if T is not None and g['UV'] is not None:
                uv = g['UV'][t]
                u = a * uv[0, 0] + b * uv[1, 0] + cc * uv[2, 0]
                v = a * uv[0, 1] + b * uv[1, 1] + cc * uv[2, 1]
                h, w = T.shape[:2]
                tx = (np.mod(u, 1) * w).astype(int).clip(0, w - 1); ty = (np.mod(1 - v, 1) * h).astype(int).clip(0, h - 1)
                s = T[ty, tx]; col = s[..., :3] * tint; alpha = s[..., 3]
            if g.get('VC'): col = np.broadcast_to(g['C'][t, :3], xs.shape + (3,))
            m &= alpha > 0.3
            if not m.any(): continue
            img[miny:maxy + 1, minx:maxx + 1][m] = (col * shade[t])[m]
            zs[m] = z[m]
    Image.fromarray((img.clip(0, 1) * 255).astype(np.uint8)).save(out)
main()
