# Enumerate player-wearable items in the NH dump (names, file lists, dae joints/materials, dae md5). Reads only.
import os, re, sys, json, hashlib, xml.etree.ElementTree as ET
ROOT=os.path.expanduser('~/Downloads/Model'); SUF='.Nin_NX_NVN'
ns={'c':'http://www.collada.org/2005/11/COLLADASchema'}
names=sorted(n[:-len(SUF)] for n in os.listdir(ROOT) if n.endswith(SUF))
S=set(names)
def files(n):
    try: return sorted(os.listdir(os.path.join(ROOT,n+SUF)))
    except Exception: return []
daecache={}
def daeinfo(n):
    if n in daecache: return daecache[n]
    p=os.path.join(ROOT,n+SUF,n+'.dae')
    if not os.path.exists(p): daecache[n]=None; return None
    b=open(p,'rb').read()
    try:
        r=ET.fromstring(b)
        joints=[x.get('name') for x in r.iterfind('.//c:node',ns) if x.get('type')=='JOINT']
        mats=sorted({m.get('id') for m in r.iterfind('.//c:library_materials/c:material',ns)})
        tris=0
        for tr in r.iterfind('.//c:library_geometries//c:mesh/*',ns):
            if tr.tag.endswith(('triangles','polylist')) and tr.get('count'): tris+=int(tr.get('count'))
        # geometry-only hash (positions arrays), to find meshes shared by colour variants
        g=hashlib.md5()
        for fa in r.iterfind('.//c:library_geometries//c:float_array',ns): g.update((fa.text or '').encode())
        info={'joints':joints,'mats':mats,'tris':tris,'geo':g.hexdigest()[:10],'bytes':len(b)}
    except Exception as e:
        info={'error':str(e)[:80]}
    daecache[n]=info; return info
topsMeshes=sorted([n for n in names if n.startswith('PlayerTops')], key=len, reverse=True)
botMeshes=sorted([n for n in names if n.startswith('PlayerBottoms')], key=len, reverse=True)
items=[]
def add(cat,n,mesh,**k):
    fl=files(n)
    it={'cat':cat,'id':n,'mesh':mesh,'files':fl,**k}
    items.append(it)
for n in names:
    if n.startswith('TopsTex'):
        rest=n[7:]; m=next((x for x in topsMeshes if rest.startswith(x[10:])),None)
        add('tops',n,m,variant=('mydesign' in rest))
    elif n.startswith('BottomsTex'):
        rest=n[10:]; m=next((x for x in botMeshes if rest.startswith(x[13:])),None)
        add('bottoms',n,m,apron=rest.startswith('Apron'))
    elif n.startswith('SocksTex'): add('socks',n,'PlayerBody')
    elif n.startswith('Shoes'): add('shoes',n,n)
    elif n.startswith('AccessoryGlassmouth'): add('glassmouth',n,n,underwater='UnderWater' in n)
    elif n.startswith('AccessoryGlass'): add('glasses',n,n,underwater='UnderWater' in n)
    elif n.startswith('AccessoryMouth'): add('mouthacc',n,n)
    elif n.startswith('AccessoryPlt'): add('accplt',n,n)
    elif n.startswith('Cap'):
        sub=re.match(r'Cap([A-Z][a-z]+)',n).group(1); add('cap'+sub.lower(),n,n)
    elif n.startswith('Bag'): add('bag',n,n)
    elif n.startswith('Umbrella'): add('umbrella',n,n)
for it in items:
    if it['mesh'] and it['mesh']!='PlayerBody':
        it['dae']=daeinfo(it['mesh'])
    fl=it['files']
    it['alb']=next((f for f in fl if re.search(r'_Alb(Gry)?(\.0)?\.png$',f)),None)
    it['op']=any(f.endswith('_OP.png') for f in fl)
json.dump(items,open('/tmp/avatar-ta/closet/items.json','w'))
from collections import Counter
c=Counter(it['cat'] for it in items); print(c)
print('tops no mesh', [i['id'] for i in items if i['cat'] in('tops','bottoms') and not i['mesh']][:20])
print('no alb', Counter(i['cat'] for i in items if not i['alb']))
print('no dae', Counter(i['cat'] for i in items if i['mesh'] and i['mesh']!='PlayerBody' and not i.get('dae')))
