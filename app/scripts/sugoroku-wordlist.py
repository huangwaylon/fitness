# 英語すごろく's curated word lists (docs/sugoroku.md "Words"): ENABLE (2–8 letters) cross-referenced with SCOWL v2,
# wordfreq 3.1.1's data (Zipf), Norvig's count_1w (pytudes), NGSL 1.01 + NGSL-Spoken 1.2 and CEFR-J 1.5, each fetched
# by hand into /tmp/wordlist/src/<name>/ (the paths below), run with a venv that has msgpack:
#   python -I scripts/sugoroku-wordlist.py   → /tmp/wordlist/accept.txt, common.txt, stats.json
# then `SUGOROKU_LISTS=/tmp/wordlist npm run sugoroku:words`. ACCEPT: an ENABLE word in SCOWL ≤ 60, or (4+ letters)
# Zipf ≥ 2.5 or in 2 of 3 open frequency sources; SCOWL's forms of those; learner lists, months and days, modern
# words in SCOWL ≤ 50; minus SCOWL's vulgar/offensive flags and a block list. COMMON: NGSL, NGSL-Spoken, CEFR-J A1–B1
# and everyday.json with their forms (Zipf ≥ 2.5), plus Zipf ≥ 4 words of 4+ letters that aren't names.
import re, json, gzip, csv, random, sys
from collections import defaultdict
import msgpack
S='/tmp/wordlist/src/'; REPO='/Users/waylonhuang/Documents/other/fitness/app/src/lib/sugoroku/'
ok=re.compile(r'^[a-z]{2,8}$')
enable={w.strip() for w in open('/tmp/enable/enable1.txt') if ok.match(w.strip())}
# --- SCOWL (ESDB scowl-pre.txt): min size per lowercase form, US/GB spellings; lemma -> forms; flagged usage
size={}; forms=defaultdict(set); flagged=set(); pos={}; caps=set()
REAL={'n','v','m','aj','av','a','i','n_v','aj_av','pn','c','pp','d','s'}
lemma=None; lpos=''
for line in open(S+'scowl/scowl-pre.txt',encoding='utf8'):
    line=line.rstrip('\n')
    if not line or line.startswith('#'): continue
    line=line.split('#')[0]
    parts=line.split(': ')
    info=parts[0]; nums=[int(x) for x in re.findall(r'(?<![\w\[])(\d+)(?![\w\]])',info)]
    if not nums: continue
    s=nums[0]
    reg=re.findall(r'\b(US|GB|CA|AU)\b',info)
    if reg and not ({'US','GB'}&set(reg)): continue
    rest=parts[1:]
    if rest and re.fullmatch(r'(?:[ABZCD_][.=?v~V\-@x]?\s*)+(\{\d+\})?|\+',rest[0].strip()):
        if not re.search(r'[ABZ_]',rest[0]): continue
        rest=rest[1:]
    if not rest: continue
    lm=rest[0].strip()
    tok=re.split(r' <| \{| \(',lm)[0].strip()
    if ' ' in tok: lemma=None; continue
    pm=re.search(r'<([a-z_]+)',lm); p=pm.group(1) if pm else ''
    bad='(vulgar-1)' in lm or 'offensive' in lm
    word=tok.lstrip('-@!').rstrip('*-@~!†')
    if tok=='-':
        if lemma is None: continue
        word=lemma
    else: lemma=word
    if not word: continue
    derived=[t.strip().rstrip('*-@~!†') for t in re.split(r'[,|()]',' '.join(rest[1:])) ]
    derived=[re.sub(r'^[ABZCD_]?[.=?v~V\-@x]?:\s*','',d).strip() for d in derived]
    for w in [word]+derived:
        if not re.fullmatch(r'[A-Za-z]+',(w or '').strip()): continue
        w=w.strip()
        if w!=w.lower(): caps.add(w.lower()); continue
        if s<size.get(w,99): size[w]=s; pos[w]=p
        forms[word].add(w)
        if bad: flagged.add(w)
# --- wordfreq large_en (cB pack): zipf = 9 - i/100
pk=msgpack.unpackb(gzip.open(S+'wordfreq/x/wordfreq/data/large_en.msgpack.gz').read(),raw=False)
assert pk[0].get('format')=='cB'
zipf={}
for i,b in enumerate(pk[1:]):
    for w in b:
        if ok.match(w) and w not in zipf: zipf[w]=9-i/100
# --- SUBTLEX-US (lowercased in file): contexts
sub={}
for r in csv.DictReader(open(S+'subtlexus/SUBTLEXus74286wordstextversion.txt',encoding='latin-1'),delimiter='\t'):
    w=r['Word'].lower()
    if ok.match(w): sub[w]=max(sub.get(w,0),int(r['CDcount']))
# --- Norvig count_1w rank
nrank={}
for i,l in enumerate(open(S+'norvig/count_1w.txt')):
    w=l.split('\t')[0]
    if ok.match(w) and w not in nrank: nrank[w]=i+1
g10k={l.strip() for l in open(S+'google10k/google-10000-english-usa.txt') if ok.match(l.strip())}
dwyl={l.strip() for l in open(S+'dwyl/words_alpha.txt') if ok.match(l.strip())}
# --- NGSL 1.01 (with SFI ranks) + NGSL-Spoken 1.2
ngsl=set(); sfirank={}
for r in csv.reader(open(S+'ngsl/ngsl.csv')):
    if r[0]=='Lemma' or not r[0]: continue
    w=r[0].strip().lower()
    if r[1] and r[1][0] in '12': ngsl.add(w)
    try: sfirank.setdefault(w,int(float(r[2])))
    except: pass
spoken={l.strip().lower() for l in open(S+'ngsl-spoken/NGSL-Spoken_1.2_alphabetized_description.txt',encoding='utf-8-sig') if l.strip() and not l.startswith('#')}
cefr={}
for r in csv.DictReader(open(S+'cefrj/cefrj-vocabulary-profile-1.5.csv',encoding='utf-8')):
    for h in r['headword'].split('/'):
        h=h.strip().lower()
        if re.fullmatch('[a-z]+',h): cefr[h]=min(cefr.get(h,'Z'),r['CEFR'])
words_txt={l.strip() for l in open(REPO+'words.txt') if l.strip()}
everyday={k for k in json.load(open(REPO+'everyday.json')) if ok.match(k)}
# --- inflection expansion: SCOWL forms of a lemma, plus simple suffix rules, kept to ENABLE
END=[('s',''),('es',''),('ies','y'),('ed',''),('ed','e'),('ied','y'),('ing',''),('ing','e'),('er',''),('er','e'),('est',''),('est','e'),('ier','y'),('iest','y')]
def stems(w):
    for e,p in END:
        if w.endswith(e) and len(w)>len(e)+1:
            st=w[:-len(e)]; yield st+p
            if len(st)>2 and st[-1]==st[-2]: yield st[:-1]
def expand(base):
    out=set(base)
    for b in base: out|=forms.get(b,set())
    return out&enable|(base&enable)
# --- blocklist: SCOWL vulgar-1/offensive + curated slurs/vulgar
CUR='''fag fags faggot faggots faggy dyke dykes spic spics spik kike kikes chink chinks gook gooks wetback wetbacks tranny trannies
twat twats wank wanks wanked wanker wankers wanking jizz cum cums dildo dildos pussy pussies cock cocks slut sluts slutty whore whores
bitch bitches bitchy bitched bitching jap japs paki pakis dago dagos wop wops gyp gyps gypped homo homos spaz spazz coon coons honky
honkies squaw squaws darky darkie darkies redskin redskins hymie kraut krauts retard retards retarded nigger niggers nigga niggas
cunt cunts fuck fucks fucked fucker fuckers fucking shit shits shitty bullshit asshole assholes arse arses arsehole tits titty titties
boner boners blowjob handjob clit clits dick dicks dickhead prick pricks skank skanky negro negroes golliwog shemale milf milfs niggaz hos jew jewed jewing jews wog wogs yid yids'''.split()
# the 2026-11-28 review's: slurs, insults about bodies and minds, sexual and vulgar words SCOWL doesn't flag
CUR2='''poof poofs poofter poofters dagoes honkey honkeys honkie spazzes spastic spastics sambo sambos mulatto papist papists
coolie coolies shylock shylocks pommy pommies limey limeys mongol mongols mongo mongos mongoes gypsy gypsies gypsied gypsying
gypper gyppers gypping gypster gypsters negroid negroids spick spicks nazi nazis midget midgets cretin cretins imbecile moron
morons moronic fatso fatsos gimp gimps gimped gimpier gimpiest gimping gimpy cripple cripples crippler niggard niggards niggle
niggled niggler nigglers niggles niggling welsh welshed welshes welshing floozy hussy harlot harlotry harlots strumpet trollop
trollops jezebel jezebels whored sluttier sluttish bitchier bitchily bimbo bimbos slag slags slagged slagging wench hooker hookers
bawd bawds bawdier bawdies bawdiest bawdily bawdy cuckold cuckolds piss pissed pisser pissers pisses pissing pissoir pissoirs
bastard bastards bastardy boob boobs boobie boobies boobed boobing tit turd turds tosser bugger buggered buggers buggery sodomy
sodomies sodomite sodomize sodom sodoms sodding shag shagged bollocks crap crapped crapper crappers crapping crappy dong dongs poon
poons pecker peckers weenie weiner spunk spunked spunks spunking spunkies goddamn frig frigging bonk bonked bonking bonks nympho
porn porno pornos porns orgasm orgasms orgasmic orgy orgies erotic erotica horny smut smutty pimp pimps pimped pimping nob nobs
rapist rapists raper rapers'''.split()
block=(flagged|set(CUR)|set(CUR2))
# accepted but never a hint or a rack's seed (common.txt): UK spellings (the table's English is American), names, unpleasant hints
NOHINT=set('''centre centres centred colour coloured colours favour favoured favours flavour flavours grey greys harbour harbours
honour honoured honours humour labour laboured labours litre litres memorise metre metres minimise organise realise realised
realises rumour rumoured rumours theatre theatres cheque cheques defence licence practise analyse paralyse gaol lorry lorries petrol
mum mums john maria peter harry jimmy terry roger matt tony rick mike chile amazon penis rape raped sex sexy damn damned idiot
idiots'''.split())
# Japan loanwords a table types and plurals the lists lack (sugoroku-words.ts LOAN has the rest)
EXTRA=set('onsen ryokan yukata sensei otaku emojis vlogs'.split())
# --- tiers
def freqsrc(w):
    # (openly licensed sources only: no SUBTLEX, no Google 10k)
    return sum([zipf.get(w,0)>=2.0, nrank.get(w,10**9)<=100000, sfirank.get(w,10**9)<=30000])
def core(w):
    short=len(w)<=3
    if size.get(w,99)<=60: return 'scowl'
    if short: return None   # 2-3 letters: frequency alone is fooled by abbreviations/names (AA, XU, KA, JO)
    if zipf.get(w,0)>=2.5: return 'zipf'
    if freqsrc(w)>=2: return 'freq2'
    return None
base={w for w in enable if core(w)}
learner=(ngsl|spoken|{w for w,l in cefr.items() if l<='B1'})
CAL=set('monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december'.split())
realw=lambda w,n: size.get(w,99)<=n and pos.get(w) in REAL
modern={w for w in size if ok.match(w) and w not in enable and len(w)>=3 and realw(w,50) and zipf.get(w,0)>=2.5}
modern=(modern|{f for w in modern for f in forms.get(w,()) if ok.match(f)})-enable
def keep_txt(w): return w in base or realw(w,70) or w in CAL or w in modern or (len(w)>=4 and zipf.get(w,0)>=3 and w not in caps)
txt_kept={w for w in words_txt if keep_txt(w)}
accept=(expand(base)|txt_kept|everyday|CAL|modern|expand(learner&enable)|EXTRA|NOHINT)-block
accept={w for w in accept if ok.match(w)}
lexp={f for w in learner|everyday for f in forms.get(w,set())|{w}}
common=({w for w in lexp if w in learner or w in everyday or zipf.get(w,0)>=2.5}|{w for w in enable if zipf.get(w,0)>=4 and len(w)>3 and (w not in caps or size.get(w,99)<=50)}|everyday)&accept-NOHINT
open('/tmp/wordlist/accept.txt','w').write('\n'.join(sorted(accept))+'\n')
open('/tmp/wordlist/common.txt','w').write('\n'.join(sorted(common))+'\n')
info=lambda w: f"{w} (scowl {size.get(w,'-')}, zipf {zipf.get(w,0):.2f}, freq-src {freqsrc(w)})"
checks='mingle mingled cats zoo box jam quiz okay yes hi email pizza'.split()
junk='aa ai qat zax xu za ka oe jo qi'.split()
R=random.Random(7)
dropped=sorted(enable-accept); extra=sorted(accept-common)
stat=dict(enable=len(enable),accept=len(accept),common=len(common),accept_from_enable=len(accept&enable),accept_not_enable=sorted(accept-enable)[:50],n_not_enable=len(accept-enable),
  base_by_rule={k:sum(1 for w in base if core(w)==k) for k in ['scowl','zipf','freq2']},
  checks={w:(w in accept, w in common, info(w)) for w in checks}, junk={w:(w in accept, info(w)) for w in junk},
  blocked_in_enable=len(enable&block), words_txt_not_common=len(words_txt-common), words_txt=len(words_txt), everyday=len(everyday),
  dropped_sample=[info(w) for w in sorted(R.sample(dropped,40))], extra_sample=[info(w) for w in sorted(R.sample(extra,40))],
  dwyl_size=len(dwyl), dwyl_overlap_accept=len(accept&dwyl), sizes=dict(scowl=len(size),zipf=len(zipf),subtlex=len(sub),norvig=len(nrank),g10k=len(g10k),ngsl=len(ngsl),spoken=len(spoken),cefr=len(cefr),cefr_a1b1=sum(1 for l in cefr.values() if l<='B1')))
json.dump(stat,open('/tmp/wordlist/stats.json','w'),indent=1)
print(json.dumps(stat,indent=1))
print('TXT dropped',sorted(words_txt-txt_kept)); print('MODERN',len(modern),sorted(modern)); print('KA', 'ka' in words_txt, 'ka' in everyday, 'ka' in learner, cefr.get('ka'))
wn=sorted(words_txt-enable); print('words.txt not in ENABLE', len(wn), [ (w,size.get(w,'-'),round(zipf.get(w,0),1)) for w in wn])
mod=sorted(w for w in size if ok.match(w) and size[w]<=50 and w not in enable and w not in block)
print('SCOWL<=50 not ENABLE', len(mod), mod[:400])
