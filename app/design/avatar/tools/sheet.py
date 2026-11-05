# usage: sheet.py list.tsv out.png [tile] [cols] [bg]
# list.tsv: label<TAB>png path per line
import sys
from PIL import Image, ImageDraw, ImageFont
lst, out = sys.argv[1], sys.argv[2]
tile = int(sys.argv[3]) if len(sys.argv) > 3 else 128
cols = int(sys.argv[4]) if len(sys.argv) > 4 else 8
bg = sys.argv[5] if len(sys.argv) > 5 else "#c8c8c8"
rows = [l.rstrip("\n").split("\t") for l in open(lst) if l.strip()]
try:
    font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial.ttf", 11)
except Exception:
    font = ImageFont.load_default()
lh = 28
n = len(rows); r = (n + cols - 1) // cols
W, H = cols * tile, r * (tile + lh)
sheet = Image.new("RGBA", (W, H), bg)
d = ImageDraw.Draw(sheet)
for i, (label, path) in enumerate(rows):
    x, y = (i % cols) * tile, (i // cols) * (tile + lh)
    try:
        im = Image.open(path).convert("RGBA")
        im.thumbnail((tile - 4, tile - 4))
        sheet.alpha_composite(im, (x + (tile - im.width) // 2, y + (tile - im.height) // 2))
    except Exception as e:
        d.text((x + 4, y + 4), "ERR", fill="red", font=font)
    # wrap label in 2 lines
    s = label; cut = max(1, (tile - 4) // 6)
    d.text((x + 2, y + tile), s[:cut], fill="black", font=font)
    if len(s) > cut: d.text((x + 2, y + tile + 13), s[cut:cut * 2], fill="black", font=font)
sheet.convert("RGB").save(out)
print(out, n)
