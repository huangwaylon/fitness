#!/usr/bin/env python3
"""保存した場所's vendored details + photos packed for the app (docs/places.md): scripts/data/places-raw/'s staging
(scripts/places-details.ts fetch; gitignored, never committed) into app/static/places/ — 35 detail shards (a place's
shard fnv1a(id) % 35, the TS side's own hash over the ASCII id: lib/places/vendored.ts) and 2×3 sprite sheets of
600×338 cells: one place's ≤ 3 photos one block of 3 cells, two places a sheet (the map-review's E1: a card open
fetches ~360 KB, not a 16-cell sheet; 4.9 MB decoded, not 23; no place spans sheets). Every file name carries its
content hash. Id-only: Google's names, addresses and coordinates never leave the fetch.

  python3 -I scripts/places-pack.py        (from app/; `node scripts/places-details.ts pack` is this)

PIL with libwebp, fixed settings (fi.py's precedent), no other non-stdlib part. This Mac's python3 has no PIL: when
the import fails the script re-execs itself with a uv tool's python that has it (mflux's does). STABLE cells: the
committed index.json and shards are read first (an old format's = no old) and every existing place keeps its cells;
only new photos take free blocks (freed ones reused), so an unchanged staging packs to a byte-identical tree (no git
churn). Caps: a cell ≤ 70 KB (q68 → q60 → q50, else the photo is dropped), a place's photos ≤ 210 KB in all, a sheet
≤ 600 KB. Places without a fetchable photo still get their shard entry (details only).
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
CARD_W, CARD_H = 600, 338
COLS, ROWS = 2, 3  # a sheet's grid; a place's block 3 cells (block 0 cells 0-2, block 1 cells 3-5)
CELL_CAP, PLACE_CAP, SHEET_CAP = 70 * 1024, 210 * 1024, 600 * 1024
CARD_Q = (68, 60, 50)  # the quality ladders under the caps (fi.py's fixed settings: method=4)
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
    """The committed tree's cell assignments: id -> [[sheet,col,row],…] (an old format's index = no old)."""
    ix_p = OUT / 'index.json'
    if not ix_p.exists():
        return {}
    ix = json.loads(ix_p.read_text())
    if ix.get('card') != [CARD_W, CARD_H] or ix.get('grid') != [COLS, ROWS]:
        return {}
    out = {}
    for f in ix.get('d', []):
        p = OUT / 'd' / f
        if not p.exists():
            continue
        for pid, e in json.loads(p.read_text()).get('p', {}).items():
            if e.get('pics'):
                out[pid] = [list(c) for c in e['pics']]
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


BLOCKS = ((0, 1, 2), (3, 4, 5))  # a sheet's two place blocks, each its 3 cell indices (col = i % 2, row = i // 2)


def cell_of(i):
    """A cell index 0-5 as (col, row)."""
    return (i % COLS, i // COLS)


class Cells:
    """The sheets' cell assignment: used cells per sheet, the lowest free 3-cell block for a new place."""

    def __init__(self):
        self.used = {}  # sheet ix -> set of cell indices

    def add(self, sheet, i):
        self.used.setdefault(sheet, set()).add(i)

    def is_free(self, sheet, col, row):
        return (row * COLS + col) not in self.used.get(sheet, set())

    def block_free(self, sheet, block):
        return all(i not in self.used.get(sheet, set()) for i in BLOCKS[block])

    def take_block(self):
        """The lowest sheet with a free block, as its 3 (sheet, col, row) cells."""
        for s in range(max(self.used, default=-1) + 2):
            for b, block in enumerate(BLOCKS):
                if self.block_free(s, b):
                    for i in block:
                        self.add(s, i)
                    return [[s, *cell_of(i)] for i in block]
        raise AssertionError('unreachable')


def main():
    places = staged()
    old = existing()
    cards = Cells()
    entries, card_imgs = {}, {}  # (sheet, col, row) -> RGB cell
    for pid in sorted(places):
        meta, photos = places[pid]
        entry = {k: meta[k] for k in ENTRY_KEYS if k in meta}
        # the photos: centre-cropped cells under their caps (a cell over 70 KB at q50 is dropped); the place's
        # ≤ 210 KB in all (the last photos go first)
        kept = []
        for ph in photos:
            try:
                im = Image.open(ph).convert('RGB')
            except Exception:
                continue
            cell_im = crop_to(im, CARD_W, CARD_H)
            b = encode(cell_im, CARD_Q, CELL_CAP)
            if b is not None:
                kept.append((cell_im, b))
        total = sum(len(b) for _, b in kept)
        while total > PLACE_CAP and len(kept) > 1:
            total -= len(kept.pop()[1])
        if kept:
            old_pics = old.get(pid, [])
            # the old block reused whole (every cell free), else the lowest free block
            block = None
            if len(old_pics) >= len(kept) and all(cards.is_free(*c) for c in old_pics):
                block = old_pics
                for c in block:
                    cards.add(c[0], c[2] * COLS + c[1])
            if block is None:
                block = cards.take_block()
            pics = [list(c) for c in block[: len(kept)]]
            for c, (cell_im, _) in zip(pics, kept):
                card_imgs[tuple(c)] = cell_im
            entry['pics'] = pics
        entries[pid] = entry
    write_tree(entries, card_imgs)


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


def write_tree(entries, card_imgs):
    card_sheets = compose(card_imgs, COLS, CARD_W, CARD_H, SHEET_CAP)
    cell_lists = [[c for c in e['pics']] for e in entries.values() if e.get('pics')]
    card_sheets = renumber(card_sheets, cell_lists)
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
             'd': d_names, 'sheets': sheets, 'card': [CARD_W, CARD_H], 'grid': [COLS, ROWS]}
    (OUT / 'index.json').write_bytes(dumpj(index) + b'\n')
    for sub in ('d', 'img'):
        for f in (OUT / sub).iterdir():
            if f.name not in keep:
                f.unlink()
    total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
    print(f'places-pack: {len(entries)} places ({sum(1 for e in entries.values() if e.get("pics"))} with photos), '
          f'{len(sheets)} sheets (2 places each), {total / 1e6:.2f} MB -> {OUT}')


if __name__ == '__main__':
    main()
