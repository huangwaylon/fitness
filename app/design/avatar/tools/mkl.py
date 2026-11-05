# usage: mkl.py out.tsv Name1 Name2 ... -> label/path rows for every colour variant of each closet item
import sys, os, re
M = os.path.expanduser('~/Downloads/Model')
names = sorted(os.listdir(M))
out = open(sys.argv[1], 'w')
for n in sys.argv[2:]:
    pat = re.compile(r'^Layout_ClosetIcon_' + re.escape(n) + r'(\d*)\.Nin_NX_NVN$')
    hits = sorted([(int(m.group(1) or 0), d) for d in names for m in [pat.match(d)] if m])
    if not hits: print('MISSING', n, file=sys.stderr)
    for _, d in hits:
        pngs = [f for f in os.listdir(os.path.join(M, d)) if f.endswith('.png')]
        if pngs: out.write(d[len('Layout_ClosetIcon_'):-len('.Nin_NX_NVN')] + '\t' + os.path.join(M, d, pngs[0]) + '\n')
