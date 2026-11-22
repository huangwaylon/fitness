# Our own room pieces' pictures (scripts/room-own.ts): NH's birthday sign's letters painted over, its model's albedo
# and its icon, so the wedding sign reads HAPPY WEDDING♥ where NH's reads HAPPY BIRTHDAY. NH's letter tiles keep
# their colours; each old letter is filled with its tile's colour and the new one drawn in its middle at its height,
# in Rockwell Bold (macOS's: the nearest to NH's slab letters), its colour the old letter's. On the model's albedo the
# letters are flipped top to bottom (NH's UVs: its P reads as a b). Run with a venv that has pillow, numpy and scipy:
#   python -I scripts/room-own-letters.py tex  <albedo.png> design/room/f90001.png
#   python -I scripts/room-own-letters.py icon <icon.png>   design/room/f90001-icon.png
# (the inputs: the birthday sign's, cut from its pack; room-own.ts --base writes them to /tmp/room-own/).
import sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
from scipy import ndimage

FONT = '/System/Library/Fonts/Supplemental/Rockwell.ttc'  # index 2: Bold
HEART = '/System/Library/Fonts/Supplemental/Arial Unicode.ttf'
LIGHT = lambda t, lo, spread: (t.min(2) > lo) & (t.max(2) - t.min(2) < spread)


def glyph(ch: str, px: float, stroke: int, fit_w: float | None = None) -> Image.Image:
    """A letter's mask, px high (at most fit_w wide)."""
    f = ImageFont.truetype(HEART, 100) if ch == '♥' else ImageFont.truetype(FONT, 100, index=2)
    bb = f.getbbox(ch, stroke_width=stroke)
    g = Image.new('L', (bb[2] - bb[0] + 40, bb[3] - bb[1] + 40), 0)
    ImageDraw.Draw(g).text((20 - bb[0], 20 - bb[1]), ch, font=f, fill=255, stroke_width=stroke, stroke_fill=255)
    g = g.crop(g.getbbox())
    s = px / g.height
    if fit_w and g.width * s > fit_w:
        s = fit_w / g.width
    return g.resize((max(1, round(g.width * s)), max(1, round(g.height * s))), Image.LANCZOS)


def tex(a: np.ndarray) -> None:
    """The albedo (256 px): BIRTHDAY's tiles (x0, y0, x1, y1) in order, each with its new letter."""
    tiles = [((149, 69, 175, 98), 'W'), ((176, 69, 201, 98), 'E'), ((202, 69, 228, 98), 'D'), ((229, 69, 256, 98), 'D'),
             ((197, 38, 227, 67), 'I'), ((228, 38, 256, 67), 'N'), ((197, 8, 226, 37), 'G'), ((227, 8, 256, 37), '♥')]
    ss = 8
    for (x0, y0, x1, y1), ch in tiles:
        t = a[y0:y1, x0:x1, :3]
        letter = LIGHT(t, 150, 70)
        # (a light seam on the tile's edge isn't its letter)
        lab, n = ndimage.label(letter)
        edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
        letter = np.isin(lab, [i for i in range(1, n + 1) if i not in edge])
        ys, xs = np.nonzero(letter)
        cy, cx = (ys.min() + ys.max()) / 2, (xs.min() + xs.max()) / 2
        col = t[letter].mean(0)
        bg = np.median(t[~ndimage.binary_dilation(letter, iterations=2)], 0)
        fill = ndimage.binary_dilation(LIGHT(t, 115, 95) & ndimage.binary_dilation(letter, iterations=2), iterations=2)
        smooth = ndimage.gaussian_filter(np.where(fill[..., None], bg, t), (1.2, 1.2, 0))
        t[fill] = smooth[fill]
        g = glyph(ch, (12 if ch == '♥' else 13.5) * ss, 2, (x1 - x0 - 6) * ss).transpose(Image.FLIP_TOP_BOTTOM)
        canvas = Image.new('L', ((x1 - x0) * ss, (y1 - y0) * ss), 0)
        canvas.paste(g, (round((cx + 0.5) * ss - g.width / 2), round((cy + 0.5) * ss - g.height / 2)))
        m = np.array(canvas.resize((x1 - x0, y1 - y0), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.35))).astype(float)[..., None] / 255
        a[y0:y1, x0:x1, :3] = t * (1 - m) + col * m


def icon(a: np.ndarray) -> None:
    """The icon (96 px): each BIRTHDAY tile's letter middle (x, y), the banner's slope there (degrees), the new letter."""
    tiles = [((27.4, 45.6), -30, 'W'), ((32.5, 49.5), -30, 'E'), ((38.0, 53.2), -20, 'D'), ((44.0, 55.6), -12, 'D'),
             ((49.9, 56.9), -5, 'I'), ((55.4, 57.3), 0, 'N'), ((62.1, 56.8), 12, 'G'), ((68.3, 53.7), 25, '♥')]
    h, w = a.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    light = LIGHT(a[..., :3], 150, 90)
    ss = 16
    for (cx, cy), ang, ch in tiles:
        near = (xx - cx) ** 2 + (yy - cy) ** 2
        patch = near <= 3.2 ** 2
        bg = np.median(a[(near <= 4.5 ** 2) & ~light & (a[..., 3] > 200)][:, :3], 0)
        a[ndimage.binary_dilation(patch & light) & patch, :3] = bg
        g = glyph(ch, 4.6 * ss, 4).rotate(ang, expand=True, resample=Image.BICUBIC)
        canvas = Image.new('L', (w * ss, h * ss), 0)
        canvas.paste(g, (round((cx + 0.5) * ss - g.width / 2), round((cy + 0.5) * ss - g.height / 2)))
        m = np.array(canvas.resize((w, h), Image.LANCZOS)).astype(float)[..., None] / 255
        a[..., :3] = a[..., :3] * (1 - m) + np.array([236, 234, 236]) * m


kind, src, out = sys.argv[1:4]
img = np.array(Image.open(src).convert('RGBA')).astype(float)
(tex if kind == 'tex' else icon)(img)
Image.fromarray(img.clip(0, 255).astype(np.uint8), 'RGBA').save(out)
