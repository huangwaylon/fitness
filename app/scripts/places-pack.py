#!/usr/bin/env python3
"""保存した場所's vendored details + photos packed for the app (docs/places.md): scripts/data/places-raw/'s staging
(scripts/places-details.ts fetch; gitignored, never committed) into app/static/places/ — 35 detail shards (a place's
shard fnv1a(id) % 35, the TS side's own hash over the ASCII id: lib/places/vendored.ts), 4×4 card sheets of 800×450
cells and 10×10 thumb sheets of 192×192 cells, every file name carrying its content hash. Id-only: Google's names,
addresses and coordinates never leave the fetch.

  python3 -I scripts/places-pack.py        (from app/; `node scripts/places-details.ts pack` is this)

PIL with libwebp, fixed settings (fi.py's precedent), no other non-stdlib part. This Mac's python3 has no PIL: when
the import fails the script re-execs itself with a uv tool's python that has it (mflux's does). STABLE cells: the
committed index.json and shards are read first and every existing place keeps its cells; only new photos take free
cells (freed ones reused), so an unchanged staging packs to a byte-identical tree (no git churn). Caps: a card cell
≤ 90 KB (q68 → q60 → q50, else the photo is dropped), a thumb ≤ 12 KB, a place's photos ≤ 274 KB in all, a card
sheet ≤ 900 KB, a thumb sheet ≤ 600 KB. Places without a fetchable photo still get their shard entry (details only).
"""
import glob, hashlib, io, json, os, re, subprocess, sys
from pathlib import Path

try:
    from PIL import Image
except ModuleNotFoundError:  # this Mac's python3 has no PIL: a uv tool's does (mflux's, fi.py's generator python)
    if not os.environ.get('PLACES_PACK_REEXEC'):
        for cand in sorted(glob.glob(str(Path.home() / '.local/share/uv/tools/*/bin/python'))):
            if subprocess.run([cand, '-I', '-c', 'import PIL'], capture_output=True).returncode == 0:
                os.execve(cand, [cand, '-I', str(Path(__file__).resolve()), *sys.argv[1:]], {**os.environ, 'PLACES_PACK_REEXEC': '1'})
    sys.exit('places-pack: PIL needed (no python with PIL found)')

APP = Path(__file__).resolve().parents[1]
RAW = APP / 'scripts' / 'data' / 'places-raw'
OUT = APP / 'static' / 'places'
SHARDS = 35
CARD_W, CARD_H, CARD_COLS = 800, 450, 4
THUMB_PX, THUMB_COLS = 192, 10
CARD_CAP, THUMB_CAP, PLACE_CAP = 90 * 1024, 12 * 1024, 274 * 1024
CARD_SHEET_CAP, THUMB_SHEET_CAP = 900 * 1024, 600 * 1024
CARD_Q, THUMB_Q = (68, 60, 50), (65, 50)  # the quality ladders under the caps (fi.py's fixed settings: method=4)
SHEET_Q = (68, 60, 50, 40, 30)  # the last rungs catch a busy sheet over the cap (degrade, never drop)
PAPER = (0xF5, 0xE4, 0xBC)  # an empty cell (freed, never displayed)
ENTRY_KEYS = ('at', 'hours', 'web', 'tel', 'desc', 'r', 'rn', 'kind')


def fnv1a(s):
    """The TS side's shard hash (lib/places/vendored.ts, vendored-data.test.ts pins them equal) over the ASCII id."""
    h = 0x811c9dc5
    for b in s.encode('ascii'):
        h = ((h ^ b) * 0x01000193) & 0xFFFFFFFF
    return h


def hash8(b):
    return hashlib.sha256(b).hexdigest()[:8]


def dumpj(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(',', ':'), sort_keys=True).encode()


def crop_to(im, tw, th):
    """Centre-cropped to the cell's aspect, then resized (deterministic: LANCZOS)."""
    w, h = im.size
    if w * th > h * tw:
        nw = round(h * tw / th)
        x = (w - nw) // 2
        im = im.crop((x, 0, x + nw, h))
    else:
        nh = round(w * th / tw)
        y = (h - nh) // 2
        im = im.crop((0, y, w, y + nh))
    return im.resize((tw, th), Image.LANCZOS)


def encode(im, qualities, cap):
    """im as webp bytes at the first quality under the cap, or None (dropped)."""
    for q in qualities:
        buf = io.BytesIO()
        im.save(buf, 'WEBP', quality=q, method=4)
        if buf.tell() <= cap:
            return buf.getvalue()
    return None


def staged():
    """The staging's places: id -> (meta, [original image paths])."""
    out = {}
    if not RAW.is_dir():
        return out
    for d in sorted(RAW.iterdir()):
        meta_p = d / 'meta.json'
        if d.name.startswith('_') or not meta_p.exists():
            continue
        meta = json.loads(meta_p.read_text())
        pid = meta.get('id')
        if not isinstance(pid, str) or not re.match(r'^(\d+|f:0x[0-9a-f]+:0x[0-9a-f]+)$', pid):
            continue
        photos = [d / p['file'] for p in meta.get('photos', []) if (d / p['file']).exists()][:3]
        out[pid] = (meta, photos)
    return out


def existing():
    """The committed tree's cell assignments: id -> {'pics': [[sheet,col,row],…], 't': [sheet,col,row]}."""
    ix_p = OUT / 'index.json'
    if not ix_p.exists():
        return {}
    ix = json.loads(ix_p.read_text())
    out = {}
    for f in ix.get('d', []):
        p = OUT / 'd' / f
        if not p.exists():
            continue
        for pid, e in json.loads(p.read_text()).get('p', {}).items():
            a = {}
            if e.get('pics'):
                a['pics'] = [list(c) for c in e['pics']]
            if e.get('t'):
                a['t'] = list(e['t'])
            if a:
                out[pid] = a
    return out


def skipped_count():
    p = RAW / '_ledger.json'
    if not p.exists():
        return 0
    try:
        l = json.loads(p.read_text())
        return int(l.get('kpins', 0)) + len(l.get('stale', [])) + len(l.get('mismatch', [])) + len(l.get('failed', {}))
    except Exception:
        return 0


class Cells:
    """One sheet class's cell assignment: used cells per sheet and the lowest free cell for a new photo."""

    def __init__(self, cols):
        self.cols = cols
        self.used = {}  # sheet ix -> set of (col, row)

    def add(self, sheet, col, row):
        self.used.setdefault(sheet, set()).add((col, row))

    def is_free(self, sheet, col, row):
        return (col, row) not in self.used.get(sheet, set())

    def take(self):
        for s in sorted(self.used):
            free = [i for i in range(self.cols * self.cols) if (i % self.cols, i // self.cols) not in self.used[s]]
            if free:
                i = free[0]
                cell = (s, i % self.cols, i // self.cols)
                self.add(*cell)
                return cell
        s = min(set(range(max(self.used, default=-1) + 2)) - set(self.used))
        cell = (s, 0, 0)
        self.add(*cell)
        return cell


def main():
    places = staged()
    old = existing()
    cards, thumbs = Cells(CARD_COLS), Cells(THUMB_COLS)
    entries, card_imgs, thumb_imgs = {}, {}, {}  # (sheet, col, row) -> RGB cell
    for pid in sorted(places):
        meta, photos = places[pid]
        entry = {k: meta[k] for k in ENTRY_KEYS if k in meta}
        # the photos: centre-cropped cells under their caps (a card over 90 KB at q50 is dropped), the thumb of
        # the first kept photo; the place's photos ≤ 274 KB in all (the thumb goes first, then the last cards)
        kept = []
        for ph in photos:
            try:
                im = Image.open(ph).convert('RGB')
            except Exception:
                continue
            b = encode(crop_to(im, CARD_W, CARD_H), CARD_Q, CARD_CAP)
            if b is not None:
                kept.append((im, crop_to(im, CARD_W, CARD_H), b))
        thumb = None
        if kept:
            tb = encode(crop_to(kept[0][0], THUMB_PX, THUMB_PX), THUMB_Q, THUMB_CAP)
            if tb is not None:
                thumb = (crop_to(kept[0][0], THUMB_PX, THUMB_PX), tb)
        total = sum(len(b) for _, _, b in kept) + (len(thumb[1]) if thumb else 0)
        if total > PLACE_CAP and thumb:
            total -= len(thumb[1])
            thumb = None
        while total > PLACE_CAP and len(kept) > 1:
            total -= len(kept.pop()[2])
        if kept:
            a = old.get(pid, {})
            old_pics, old_t = a.get('pics', []), a.get('t')
            pics = []
            for i, (im, cell_im, b) in enumerate(kept):
                cell = None
                if i < len(old_pics):  # a kept cell: reused only if nothing claimed it this run already
                    cand = list(old_pics[i])
                    if cards.is_free(*cand):
                        cell = cand
                        cards.add(*cell)
                if cell is None:
                    cell = list(cards.take())
                pics.append(cell)
                card_imgs[tuple(cell)] = cell_im
            entry['pics'] = pics
            if thumb:
                if old_t and old_pics and thumbs.is_free(*old_t):
                    t = list(old_t)
                    thumbs.add(*t)
                else:
                    t = list(thumbs.take())
                entry['t'] = t
                thumb_imgs[tuple(t)] = thumb[0]
        entries[pid] = entry
    write_tree(entries, card_imgs, thumb_imgs)


def compose(cell_imgs, cols, cw, ch, cap):
    """The sheets of one class: sheet ix -> (file bytes), the canvas the used rows tall (fi.py's partial sheets)."""
    by_sheet = {}
    for (s, c, r), im in cell_imgs.items():
        by_sheet.setdefault(s, {})[(c, r)] = im
    out = {}
    for s in sorted(by_sheet):
        cells = by_sheet[s]
        rows_n = max(r for _, r in cells) + 1
        sheet = Image.new('RGB', (cols * cw, rows_n * ch), PAPER)
        for (c, r), im in cells.items():
            sheet.paste(im, (c * cw, r * ch))
        b = encode(sheet, SHEET_Q, cap)
        if b is None:
            sys.exit(f'places-pack: sheet {s} over {cap} bytes at q{SHEET_Q[-1]} (never expected: raise the cap)')
        out[s] = b
    return out


def renumber(sheets_bytes, cells_iter):
    """Compact sheet numbering (a sheet whose cells all freed leaves no hole): old ix -> new ix, cells remapped."""
    order = sorted(sheets_bytes)
    remap = {old: new for new, old in enumerate(order)}
    for cells in cells_iter:
        for cell in cells:
            cell[0] = remap[cell[0]]
    return {remap[old]: sheets_bytes[old] for old in order}


def write_tree(entries, card_imgs, thumb_imgs):
    card_sheets = compose(card_imgs, CARD_COLS, CARD_W, CARD_H, CARD_SHEET_CAP)
    thumb_sheets = compose(thumb_imgs, THUMB_COLS, THUMB_PX, THUMB_PX, THUMB_SHEET_CAP)
    cell_lists = [[c for c in e['pics']] for e in entries.values() if e.get('pics')]
    t_lists = [[e['t']] for e in entries.values() if e.get('t')]
    card_sheets = renumber(card_sheets, cell_lists)
    thumb_sheets = renumber(thumb_sheets, t_lists)
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / 'd').mkdir(exist_ok=True)
    (OUT / 'img').mkdir(exist_ok=True)
    keep = {'index.json'}
    sheets = []
    for s in sorted(card_sheets):
        b = card_sheets[s]
        name = f'c{s}.{hash8(b)}.webp'
        (OUT / 'img' / name).write_bytes(b)
        keep.add(name)
        sheets.append(name)
    tsheets = []
    for s in sorted(thumb_sheets):
        b = thumb_sheets[s]
        name = f't{s}.{hash8(b)}.webp'
        (OUT / 'img' / name).write_bytes(b)
        keep.add(name)
        tsheets.append(name)
    shards = [dict() for _ in range(SHARDS)]
    for pid, entry in entries.items():
        shards[fnv1a(pid) % SHARDS][pid] = entry
    d_names = []
    for n, p in enumerate(shards):
        b = dumpj({'v': 1, 'p': {pid: p[pid] for pid in sorted(p)}})
        name = f'{n}.{hash8(b)}.json'
        (OUT / 'd' / name).write_bytes(b)
        keep.add(name)
        d_names.append(name)
    index = {'v': 1, 'n': len(entries), 'skipped': skipped_count(), 'at': max((m.get('at', 0) for m, _ in staged().values()), default=0),
             'd': d_names, 'sheets': sheets, 'tsheets': tsheets, 'card': [CARD_W, CARD_H], 'thumb': [THUMB_PX, THUMB_PX]}
    (OUT / 'index.json').write_bytes(dumpj(index) + b'\n')
    for sub in ('d', 'img'):
        for f in (OUT / sub).iterdir():
            if f.name not in keep:
                f.unlink()
    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print(f'places-pack: {len(entries)} places ({sum(1 for e in entries.values() if e.get("pics"))} with photos), '
          f'{len(sheets)} card sheets, {len(tsheets)} thumb sheets, {total / 1e6:.2f} MB -> {OUT}')


if __name__ == '__main__':
    main()
