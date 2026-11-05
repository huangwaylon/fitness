# Prints an NH Collada file's joint tree and each skin's joints (read-only; run with python3 -I joints.py <file.dae>).
import sys, xml.etree.ElementTree as ET
ns={'c':'http://www.collada.org/2005/11/COLLADASchema'}
t=ET.parse(sys.argv[1]); r=t.getroot()
def walk(n,d):
    for c in n.findall('c:node',ns):
        if c.get('type')=='JOINT' or True:
            m=c.find('c:matrix',ns)
            tr=''
            if m is not None:
                v=[float(x) for x in m.text.split()]
                tr='t=(%.2f,%.2f,%.2f)'%(v[3],v[7],v[11])
            print('  '*d+(c.get('name') or c.get('id')), c.get('type'), tr)
        walk(c,d+1)
for vs in r.iter('{%s}visual_scene'%ns['c']):
    walk(vs,0)
for ctl in r.iter('{%s}controller'%ns['c']):
    s=ctl.find('c:skin',ns)
    names=None
    for src in s.findall('c:source',ns):
        na=src.find('c:Name_array',ns)
        if na is not None: names=na.text.split()
    print('CTRL',ctl.get('id'),s.get('source'),len(names or []),' '.join(names or []))
