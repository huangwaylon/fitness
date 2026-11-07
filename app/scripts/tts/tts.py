"""ききみみ TTS helper for scripts/kikimimi-audio.ts (docs/kikimimi.md "Audio"). Silent: it writes files, never plays one.

Each subcommand reads a JSON job list and writes a JSON result; the heavy imports are per subcommand, so each runs in
its own venv (the TS side picks the python: KIKIMIMI_TTS_PY, KIKIMIMI_PHONON_PY, KIKIMIMI_KOKORO_PY, KIKIMIMI_QA_PY,
KIKIMIMI_SV_PY).

  synth --engine qwen3|qwen3-design|voxcpm2|kokoro|phonon --model <repo> --jobs <in.json> --result <out.json>
        jobs: [{out, text, seed, ref_audio?, ref_text?, instruct?, voice?}] -> {out: {gen, dur}}
  wer   --jobs <in.json> --result <out.json>      jobs: [{wav, refs: [text, ...]}] -> {wav: {hyp, wer, content}}
  mos   --jobs <in.json> --result <out.json>      jobs: [wav, ...] -> {wav: utmos}
  sv    --jobs <in.json> --result <out.json>      jobs: [{wav, ref}] -> {wav: cosine}
"""
import argparse, json, os, re, subprocess, sys, tempfile, time


def load(p):
    with open(p) as f:
        return json.load(f)


def save(p, x):
    with open(p, 'w') as f:
        json.dump(x, f, indent=1)


FFMPEG = os.environ.get('FFMPEG', 'ffmpeg')  # kikimimi-audio.ts passes tools.ts's FFMPEG and WHISPER_MODEL


def written(out, write):
    """write(tmp) to a temp file beside `out` (x.tmp.wav: the extension kept for the writer), then renamed to `out`: the
    raw takes are cached by their file's existence, so a crash mid-write must never leave half a take under its name."""
    root, ext = os.path.splitext(out)
    tmp = f'{root}.tmp{ext}'
    try:
        r = write(tmp)
        os.replace(tmp, out)
        return r
    finally:
        if os.path.exists(tmp):
            os.remove(tmp)


# ---- synthesis ------------------------------------------------------------------------------------------------------

def synth(a, jobs):
    res = {}
    if a.engine == 'phonon':  # its venv has ptts (and numpy) only: ptts writes the WAV
        import ptts
        tts = ptts.TTS(lang='en')
        tts.synth('Warm up.', voice=jobs[0]['voice'], seed=1)
        for j in jobs:
            t = time.perf_counter()
            dur = written(j['out'], lambda tmp: tts.save(tmp, j['text'], voice=j['voice'], seed=int(j['seed'])))
            res[j['out']] = dict(gen=round(time.perf_counter() - t, 3), dur=round(dur, 3))
            print(f"  {os.path.basename(j['out'])} {dur:.2f}s", flush=True)
        return res

    import numpy as np, soundfile as sf
    import mlx.core as mx
    from mlx_audio.tts.utils import load_model
    t0 = time.perf_counter()
    model = load_model(a.model)
    print(f'  {a.model} loaded in {time.perf_counter() - t0:.1f}s', flush=True)

    def kw(j):
        if a.engine == 'qwen3-design':
            return dict(instruct=j['instruct'], lang_code='english')
        if a.engine == 'qwen3':
            return dict(ref_audio=j['ref_audio'], ref_text=j['ref_text'], lang_code='english')
        if a.engine == 'voxcpm2':
            return dict(ref_audio=j['ref_audio'], ref_text=j['ref_text'])
        if a.engine == 'kokoro':
            return dict(voice=j['voice'], lang_code=j['voice'][0])
        raise SystemExit(f'unknown engine {a.engine}')

    def run(text, j):
        pieces = [np.array(r.audio, dtype=np.float32) for r in model.generate(text=text, **kw(j))]
        return np.concatenate(pieces) if pieces else np.zeros(1, np.float32)

    mx.random.seed(1); np.random.seed(1)
    run('Warm up.', jobs[0])  # compile and fill caches: the first timed clip is fair
    for j in jobs:
        mx.random.seed(int(j['seed'])); np.random.seed(int(j['seed']))
        t = time.perf_counter()
        audio = run(j['text'], j)
        res[j['out']] = dict(gen=round(time.perf_counter() - t, 3), dur=round(len(audio) / model.sample_rate, 3))
        written(j['out'], lambda tmp: sf.write(tmp, audio, model.sample_rate, subtype='FLOAT'))
        r = res[j['out']]
        print(f"  {os.path.basename(j['out'])} {r['dur']:.2f}s in {r['gen']:.2f}s", flush=True)
    return res


# ---- whisper: what's heard ------------------------------------------------------------------------------------------

WHISPER_MODEL = os.environ.get('WHISPER_MODEL', os.path.expanduser('~/.cache/whisper/ggml-large-v3-turbo.bin'))
# reductions spelled as said (bank4 `tts`) and as whisper writes them, folded to one spelling before comparing
FOLD = [(r"\bgonna\b", 'going to'), (r"\bwanna\b", 'want to'), (r"\bgotta\b", 'got to'), (r"\blemme\b", 'let me'),
        (r"\bgimme\b", 'give me'), (r"\bdunno\b", "don't know"), (r"\bkinda\b", 'kind of'), (r"\blotta\b", 'lot of'),
        (r"\bshoulda\b", 'should have'), (r"\bwoulda\b", 'would have'), (r"\bcoulda\b", 'could have'),
        (r"\bdidja\b", 'did you'), (r"\bd'you\b", 'do you'), (r"\bya\b", 'you'), (r"\b'em\b", 'them'),
        (r"\b'n'\b", 'and'), (r"(?<=\w)in'(?=\s|$|[,.?!])", 'ing'), (r"\bwouldn't've\b", "wouldn't have"),
        (r"\benquir", 'inquir'),
        # the bedtime stories' names and spellings as whisper writes them (Pekoe heard as Pico, Redd as Red), the
        # merged ferry/fairy, and their respellings (hun, lil, mee-kahn, what'dja, don'tcha)
        (r"\bpicoe?\b", 'pekoe'), (r"\bredd\b", 'red'), (r"\bbunnie\b", 'bunny'), (r"\bkix\b", 'kicks'),
        (r"\bgoodnight\b", 'good night'), (r"\bfairy\b", 'ferry'), (r"\bhun\b", 'hon'), (r"\blil\b", 'little'),
        (r"\bmee-?kahn\b|\bmekon\b", 'mikan'), (r"\bmissing tea\b", 'missing t'), (r"\btwo teas\b", "two t's"), (r"\bwhat'dja\b", 'what did you'), (r"\bwhat'd\b", 'what did'),
        (r"\bdon'tcha\b", "don't you"), (r"\bopen in a\b", 'opening a'),(r"\badviser", 'advisor'), (r"\bkm/h\b", 'kilometres an hour'), (r"\bkm\b", 'kilometres'),
        (r"\bholden\b", 'holding'),  # holdin' as whisper writes it
        # wave 2's respellings (ta, fer, yer, meetcha, aboutcha) and names whisper spells its own way (Marshall, Kid
        # for Kidd, wait list)
        (r"\bta\b", 'to'), (r"\bfer\b", 'for'), (r"\byer\b", 'your'), (r"\bmeetcha\b", 'meet you'),
        (r"\baboutcha\b", 'about you'), (r"\bmarshall\b", 'marshal'), (r"\bkidd\b", 'kid'), (r"\bwait list\b", 'waitlist'),
        # the rush's and the news's: Nikko, しずえ's Isabelle, flower beds, heatstroke, coworkers as whisper writes them
        (r"\bnic?k?o\b", 'nikko'), (r"\bisabel\b", 'isabelle'), (r"\bflowerbeds\b", 'flower beds'),
        (r"\bheat stroke\b", 'heatstroke'), (r"\bco-workers?\b", lambda m: m.group(0).replace('-', '')),
        # st-tokyo's Gayle and wasshoi as whisper writes them, and its g'morning / g'night
        (r"\bg(?:ail|ale|ayle)\b", 'gayle'), (r"\bwa(?:sh|ssh|s)oy\b", 'wasshoi'), (r"\bg'morning\b", 'good morning'),
        (r"\bg'night\b|\bg(?:ee,?)?[ -]night\b", 'good night'),
        # wave 2b's: Cyd and Kid Cat as whisper writes them, and the respellings couldja, whaddaya, tanight, sharea,
        # 'e, 'is, 'im, 'er
        (r"\bsid\b", 'cyd'), (r"\bki[dt][ -]?kat\b", 'kid cat'), (r"\bcouldja\b", 'could you'), (r"\bwhaddaya\b", 'what do you'),
        (r"\btanight\b", 'tonight'), (r"\bsharea\b", 'share a'), (r"(?<![\w'])'e\b", 'he'), (r"(?<![\w'])'is\b", 'his'),
        (r"(?<![\w'])'im\b", 'him'), (r"(?<![\w'])'er\b", 'her'), (r"\br s v p\b", 'rsvp'), (r"\ba c\b", 'ac'),
        (r"\bninth\b", '9th'),  # (the normaliser makes every other ordinal a figure, "ninth" it misses)
        (r"\bbells\b", 'bell'), (r"\bokay\b", 'ok')]
# not "content": articles and fillers (a dropped "the" or an added "oh" isn't a mishearing of the line)
MINOR = {'a', 'an', 'the', 'um', 'uh', 'er', 'ah', 'aw', 'oh', 'hm', 'hmm', 'mm', 'so', 'well'}


def normaliser():
    from whisper_normalizer.english import EnglishTextNormalizer
    norm = EnglishTextNormalizer()

    def n(t):
        t = t.lower().replace('’', "'").replace('—', ', ').replace('…', '. ').replace('...', '. ')
        for a, b in FOLD:
            t = re.sub(a, b, t)
        t = norm(re.sub(r'\b(\d{1,2})[:.](\d{2})\b', r'\1\2', t))  # 2:15 and "two fifteen" both 215
        t = re.sub(r'(?<=\d) (?=\d)', '', t)  # "four seven oh nine two" -> 4 7 0 9 2 -> 47092
        t = re.sub(r'\+(?=\d)', 'plus ', t)  # "plus one percent" comes out +1%
        t = re.sub(r'\b(hm+|mm+)\b', '', t)
        for a, b in FOLD[-2:]:
            t = re.sub(a, b, t)
        return ' '.join(t.split())
    return n


def transcribe(wavs):
    out = {}
    with tempfile.TemporaryDirectory() as td:
        for i, w in enumerate(wavs):  # whisper-cli writes <input>.txt: 16 kHz copies in a scratch dir
            subprocess.run([FFMPEG, '-loglevel', 'error', '-y', '-i', w, '-ar', '16000', '-ac', '1', f'{td}/{i}.wav'], check=True)
        for k in range(0, len(wavs), 64):
            args = ['whisper-cli', '-m', WHISPER_MODEL, '-l', 'en', '-np', '-nt', '-otxt']
            for i in range(k, min(k + 64, len(wavs))):
                args += ['-f', f'{td}/{i}.wav']
            subprocess.run(args, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for i, w in enumerate(wavs):
            with open(f'{td}/{i}.wav.txt') as f:
                out[w] = ' '.join(f.read().split())
    return out


def wer(a, jobs):
    import jiwer
    n = normaliser()
    hyps = transcribe([j['wav'] for j in jobs])
    res = {}
    for j in jobs:
        hyp = n(hyps[j['wav']])
        best = None
        for ref in j['refs']:
            r = n(ref)
            # a currency whisper guessed for a bare number (¥380,000 said "three hundred eighty thousand": $380000)
            h = hyp if '$' in r else hyp.replace('$', '')
            o = jiwer.process_words(r, h or '-')
            content = 0
            for c in o.alignments[0]:
                if c.type == 'equal':
                    continue
                rw = o.references[0][c.ref_start_idx:c.ref_end_idx]
                hw = o.hypotheses[0][c.hyp_start_idx:c.hyp_end_idx]
                content += sum(w not in MINOR for w in rw) if rw else sum(w not in MINOR for w in hw)
            cand = dict(hyp=hyps[j['wav']], wer=round(o.wer, 3), content=content, ref=r)
            if best is None or (cand['content'], cand['wer']) < (best['content'], best['wer']):
                best = cand
        res[j['wav']] = best
    return res


# ---- UTMOS, speaker similarity --------------------------------------------------------------------------------------

def load16k(path):
    """Any audio file (m4a too) as 16 kHz mono float32, decoded by ffmpeg."""
    import numpy as np
    pcm = subprocess.run([FFMPEG, '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).copy()


def mos(a, jobs):
    import torch
    m = torch.hub.load('tarepan/SpeechMOS:v1.2.0', 'utmos22_strong', trust_repo=True).eval()
    res = {}
    for w in jobs:
        y = load16k(w)
        with torch.no_grad():
            res[w] = round(float(m(torch.from_numpy(y).unsqueeze(0), 16000).item()), 3)
    return res


def sv(a, jobs):
    import numpy as np, torch
    from speechbrain.inference.speaker import EncoderClassifier
    save_dir = os.environ.get('KIKIMIMI_ECAPA', os.path.join(os.path.dirname(__file__), '../../.cache/tts/ecapa'))
    enc = EncoderClassifier.from_hparams(source='speechbrain/spkrec-ecapa-voxceleb', savedir=save_dir, run_opts={'device': 'cpu'})
    cache = {}

    def emb(p):
        if p not in cache:
            y = load16k(p)
            with torch.no_grad():
                e = enc.encode_batch(torch.from_numpy(y).unsqueeze(0)).squeeze().cpu().numpy()
            cache[p] = e / np.linalg.norm(e)
        return cache[p]
    return {j['wav']: round(float(emb(j['wav']) @ emb(j['ref'])), 3) for j in jobs}


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['synth', 'wer', 'mos', 'sv'])
    ap.add_argument('--engine'); ap.add_argument('--model')
    ap.add_argument('--jobs', required=True); ap.add_argument('--result', required=True)
    a = ap.parse_args()
    jobs = load(a.jobs)
    if not jobs:
        save(a.result, {}); sys.exit(0)
    save(a.result, {'synth': synth, 'wer': wer, 'mos': mos, 'sv': sv}[a.cmd](a, jobs))
