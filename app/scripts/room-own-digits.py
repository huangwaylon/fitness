# Our own room pieces' digits (scripts/room-own.ts): a balloon digit as a mesh, for NH's 2021 celebratory arch's
# last digit (its 1) made a 6 or a 7. NH's digits are pillows: a flat outline, puffed out in front and less behind.
# Here: the glyph in Futura Bold (macOS's; its 6 open, read at a glance where a rounder font's closes up into an 8),
# its corners rounded and its strokes thickened to NH's, its signed distance field puffed: the outline sampled, a
# lattice inside, Delaunay triangles, front and back. Written as JSON in the
# digit's own plane (x right, y up, z out of the front, NH's units: the arch is ~26 high), centred on its box;
# room-own.ts puts it where the base's digit was. Run with a venv that has pillow, numpy and scipy:
#   python -I scripts/room-own-digits.py mesh 6 design/room/f90002.json
#   python -I scripts/room-own-digits.py icon 6 <icon.png> design/room/f90002-icon.png
# (the icon: the arch's own, room-own.ts --base writes it to /tmp/room-own/; its 1 painted over with the new digit.)
import json, sys
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from scipy import ndimage
from scipy.spatial import Delaunay

FONT, BOLD = '/System/Library/Fonts/Supplemental/Futura.ttc', 2
HEIGHT = 4.7  # NH's digits, top to bottom (its 2s 4.6, its 0 5.1)
STROKE = 0.34  # NH's stroke (its 0's sides) over its height, Futura Bold's ~0.3
ROUND = 0.08  # its corners' radius over its height (NH's are all round)
FRONT, BACK = 0.9, 0.45  # how far the pillow stands out in front and behind (NH's: ~0.9, 0.35–0.55)
GRID = 0.2
WIDE = 3.3  # at most NH's 2s' width (narrowed to it)


def field(ch: str, px: int = 600) -> tuple[np.ndarray, float]:
    """The glyph's signed distance (negative inside, in units), rounded and thickened to NH's stroke; units per pixel."""
    f = ImageFont.truetype(FONT, px, index=BOLD)
    bb = f.getbbox(ch)
    pad = px // 4
    im = Image.new('L', (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), 0)
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), ch, font=f, fill=255)
    inside = np.array(im) > 127
    h = inside.any(1).sum()
    grow = max(0.0, STROKE * h / 2 - ndimage.distance_transform_edt(inside).max())
    # (shrunk by the corners' radius and grown back by it: its corners round)
    r = ROUND * h
    core = ndimage.distance_transform_edt(inside) > r
    sdf = ndimage.distance_transform_edt(~core) - ndimage.distance_transform_edt(core) - r
    unit = HEIGHT / (h + 2 * grow)
    return (sdf - grow) * unit, unit


def sample(sdf: np.ndarray, x: np.ndarray, y: np.ndarray) -> np.ndarray:
    return ndimage.map_coordinates(sdf, [y, x], order=1, mode='nearest')


def mesh(ch: str) -> dict:
    sdf, unit = field(ch)
    inside = sdf < 0
    ys, xs = np.nonzero(inside)
    cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
    step = GRID / unit
    at = lambda p: sample(sdf, p[:, 0], p[:, 1]) / unit  # (pixels)
    # the rim: points along the outline about a grid step apart, each moved onto it (Newton steps on the field)
    edge = np.argwhere(inside & ndimage.binary_dilation(~inside))[:, ::-1].astype(float)
    np.random.default_rng(0).shuffle(edge)
    rim, cells, r = [], {}, 0.8 * step
    for p in edge:
        i, j = int(p[0] // r), int(p[1] // r)
        near = [q for a in (-1, 0, 1) for b in (-1, 0, 1) for q in cells.get((i + a, j + b), ())]
        if all(np.hypot(*(p - q)) >= r for q in near):
            rim.append(p)
            cells.setdefault((i, j), []).append(p)
    rim = np.array(rim)
    gy, gx = np.gradient(sdf)
    for _ in range(5):
        g = np.stack([sample(gx, rim[:, 0], rim[:, 1]), sample(gy, rim[:, 0], rim[:, 1])], 1)
        rim -= at(rim)[:, None] * g / (np.linalg.norm(g, axis=1, keepdims=True) + 1e-9)
    # the inside: a triangular lattice, kept clear of the rim
    X, Y = np.meshgrid(np.arange(xs.min(), xs.max(), step), np.arange(ys.min(), ys.max(), step * 0.866))
    X = X + (np.arange(X.shape[0])[:, None] % 2) * step / 2
    lat = np.stack([X.ravel(), Y.ravel()], 1)
    lat = lat[at(lat) < -0.55 * step]
    P = np.concatenate([rim, lat])
    tris = Delaunay(P).simplices
    # (only triangles inside the outline: none across the 6's hole or the 7's corner)
    mid = lambda a, b: (P[tris[:, a]] + P[tris[:, b]]) / 2
    keep = (at(P[tris].mean(1)) < 0) & (at(mid(0, 1)) < 0.2 * step) & (at(mid(1, 2)) < 0.2 * step) & (at(mid(0, 2)) < 0.2 * step)
    tris = tris[keep]
    depth = np.concatenate([np.zeros(len(rim)), -at(lat) * unit])
    R = depth.max() * 0.9
    prof = np.sqrt(np.clip(1 - (1 - np.minimum(depth / R, 1)) ** 2, 0, 1))
    sx = min(1.0, WIDE / ((xs.max() - xs.min()) * unit))
    xy = np.stack([(P[:, 0] - cx) * unit * sx, -(P[:, 1] - cy) * unit], 1)
    n = len(P)
    pos = [[round(x, 4), round(y, 4), round(z, 4)] for (x, y), z in zip(np.concatenate([xy, xy]), np.concatenate([FRONT * prof, -BACK * prof]))]
    # (counter-clockwise seen from the front, flipped behind; image rows run down, so y was flipped)
    e1, e2 = xy[tris[:, 1]] - xy[tris[:, 0]], xy[tris[:, 2]] - xy[tris[:, 0]]
    ccw = e1[:, 0] * e2[:, 1] - e1[:, 1] * e2[:, 0] > 0
    tris = np.where(ccw[:, None], tris, tris[:, [0, 2, 1]])
    out = [list(map(int, t)) for t in tris] + [[int(a) + n, int(c) + n, int(b) + n] for a, b, c in tris]
    return {'glyph': ch, 'pos': pos, 'tris': out, 'w': round((xs.max() - xs.min()) * unit * sx, 3), 'h': round((ys.max() - ys.min()) * unit, 3)}


def icon(ch: str, a: np.ndarray) -> None:
    """The arch's icon (96 px): its green 1 (right of x 52, top half) filled from round about, the new digit drawn in
    its place, at its height and lean, shaded as a pillow in the 1's own greens."""
    rgb, al = a[..., :3], a[..., 3]
    h, w = al.shape
    yy, xx = np.mgrid[0:h, 0:w]
    one = (rgb[..., 1] > rgb[..., 0] + 15) & (rgb[..., 1] > rgb[..., 2] + 5) & (al > 60) & (xx >= 52) & (yy < 48)
    ys, xs = np.nonzero(one)
    greens = rgb[one & (rgb[..., 1] - rgb[..., [0, 2]].max(2) > 40)]  # (its own green, not where it blends)
    dark, light = np.percentile(greens, 5, 0), np.percentile(greens, 90, 0)
    cy, cx, tall = (ys.min() + ys.max() + 1) / 2, (xs.min() + xs.max() + 1) / 2, ys.max() - ys.min() + 1
    # the 1 filled: each of its pixels the mean of its known neighbours, inward (premultiplied, so the edge's alpha too)
    hole = ndimage.binary_dilation(one)
    pm = np.concatenate([rgb * al[..., None] / 255, al[..., None]], 2)
    known = ~hole
    while not known.all():
        acc, n = np.zeros_like(pm), np.zeros((h, w))
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (1, 1), (-1, 1), (1, -1)):
            k = np.roll(known, (dy, dx), (0, 1))
            acc += np.roll(pm, (dy, dx), (0, 1)) * k[..., None]
            n += k
        fill = ~known & (n > 0)
        pm[fill] = acc[fill] / n[fill][:, None]
        known = known | fill
    # the digit, 16× over: its field puffed (the mesh's profile), lit from the upper left, turned to the 1's lean
    sdf, unit = field(ch, 400)
    inside = sdf < 0
    gy0, gx0 = np.nonzero(inside)
    sdf = sdf[gy0.min() - 4:gy0.max() + 5, gx0.min() - 4:gx0.max() + 5]
    depth = np.clip(-sdf, 0, None)
    z = np.sqrt(np.clip(1 - (1 - np.minimum(depth / (depth.max() * 0.9), 1)) ** 2, 0, 1)) * FRONT
    dzy, dzx = np.gradient(z, unit)
    nrm = np.stack([-dzx, dzy, np.ones_like(z)], 2)
    nrm /= np.linalg.norm(nrm, axis=2, keepdims=True)
    lit = np.clip(0.1 + 0.65 * (nrm @ (np.array([-0.45, 0.55, 0.7]) / np.linalg.norm([-0.45, 0.55, 0.7]))), 0, 1)
    ss = 16
    sx = min(1.0, WIDE / (sdf.shape[1] * unit))
    size = (max(1, round(sdf.shape[1] * sx * tall * ss / sdf.shape[0])), round(tall * ss))
    def big(img: np.ndarray) -> Image.Image:
        return Image.fromarray(img).resize(size, Image.LANCZOS).rotate(-LEAN, expand=True, resample=Image.BICUBIC)
    mask = big((inside[gy0.min() - 4:gy0.max() + 5, gx0.min() - 4:gx0.max() + 5] * 255).astype(np.uint8))
    shade = big((lit * 255).astype(np.uint8))
    cm, cs = Image.new('L', (w * ss, h * ss), 0), Image.new('L', (w * ss, h * ss), 0)
    at = (round(cx * ss - mask.width / 2), round(cy * ss - mask.height / 2))
    cm.paste(mask, at), cs.paste(shade, at)
    m = np.array(cm.resize((w, h), Image.LANCZOS)).astype(float)[..., None] / 255
    t = np.array(cs.resize((w, h), Image.LANCZOS)).astype(float)[..., None] / 255
    col = dark + np.clip(t / np.maximum(m, 1e-3), 0, 1) * (light - dark)
    out_a = pm[..., 3:] * (1 - m) + 255 * m
    out_rgb = (pm[..., :3] * (1 - m) + col * m) / np.maximum(out_a / 255, 1e-3)
    a[..., :3] = np.where(out_a > 0, out_rgb, 0)
    a[..., 3] = out_a[..., 0]


LEAN = 18  # the 1's lean in the icon (degrees, clockwise)


if __name__ == '__main__':
    kind, ch = sys.argv[1:3]
    if kind == 'mesh':
        m = mesh(ch)
        json.dump(m, open(sys.argv[3], 'w'), separators=(',', ':'))
        print(f"{ch}: {len(m['pos'])} vertices, {len(m['tris'])} triangles, {m['w']} × {m['h']}")
    else:
        img = np.array(Image.open(sys.argv[3]).convert('RGBA')).astype(float)
        icon(ch, img)
        Image.fromarray(img.clip(0, 255).astype(np.uint8), 'RGBA').save(sys.argv[4])
