// “Carly & Freddie Go PUBLIC As A Couple 🥰 | Full Scene | iCarly” (NickRewind, Best of Carly & Freddie): stuck on a
// roof with only napkins for a picnic, Freddie asks Carly why she won't go public; she tells how her ex Beau dumped her
// on a livestream, he says he can take whatever comes, and they say "I love you". His mom texts that the camera is on:
// they've been streaming all along. Carly says "I want the world to know"; the drones draw a picture; a late friend
// arrives with champagne.
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Carly ("Carly, why don't you…",
// "I love you, Carly"), Freddie ("I love you, Freddie Benson"), Beau, Spencer. The opener's two voices (0–31 s) and the
// late arrival (248–266 s) aren't named, so no item rests on who they are.
// Untested on purpose: 182–241 s (the drones' picture: innuendo, "throbbing"), 89.9–91.4 s (whisper "I'll do it
// forever forever", captions "keep keep it a secret forever"), 131–143 s (the captions hold "forgot" to 142.9 s;
// whisper has it at 131.9 s; d4 uses only 129.2–131 s, before the disputed word), 157–172 s ("the bubble" is the show's backstory).
// REVIEW 2026-11-17: pass 3, fix 20, drop 1, new 1; ear checks 2
//   Open: d1 now tests sad/glad/mad on "I was sad" (both sources agree); if the s really doesn't link, it's still a
//   fair B1 detail. s1's choices now include the full "Because I'm".
//   Open: a cold blind re-read after the fixes still got d2/f1 (fixed since: f1's stem leaked d2), g1, d3, f3 and
//   pr2 at 65–75 %, mostly from the stock meaning of the phrase under test; the audio settles them.
// EAR CHECK: 67.6–68.1 s nt2 — "you planning on" (both sources): no "are" before it, not even a reduced 're
// EAR CHECK: 61.7 s s1 — "'Cause I'm" (whisper "'Cause I'm", captions "cuz I'm"): the m of I'm really merges into
//   "just"; whisper starts the line at 59.8 s, the captions at 61.7 s (the segment covers both)
import type { Clip } from '../types.ts';

export const goPublic: Clip = {
  id: 'gopublic', video: 'mK8xcYHlmw8', title: 'Carly & Freddie Go PUBLIC As A Couple', dur: 276, wpm: 114,
  band: 'slow', tags: ['恋愛'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %, right: the key was the only joke-shaped choice); all three now read the reply, and the
    //   cue no longer leaks "picnic" (only the key had it)
    // why: waved ← "Help!" is shouted right after, so the napkins seem to be for waving; blames ← "no picnic!" heard as
    //   an accusation the reply answers; "Not no picnic. I brought the napkins" presents napkins as her whole case
    { id: 'h1', skill: 'humor', level: 'C1', point: 'napkins', seg: [0, 10.5],
      stem: 'Why does the audience laugh at the napkins at the start?',
      choices: ['The reply treats napkins alone as a picnic', 'The reply means napkins can be waved for help',
                'The reply blames the other for forgetting food'], a: 0,
      cue: '「何もない」と嘆いたあとの、言い返し。',
      line: 'We’re stuck on a roof with *no picnic*! — Not no picnic. *I brought the napkins*.',
      said: '「ピクニックなしで閉じ込められた」に「なしじゃない、ナプキンは持ってきた」と返す。',
      mean: 'ナプキンだけでピクニックと言い張るのがおかしい。相手も「ならいいか」と皮肉で返す。',
      trap: '直後の Help! と結びつけやすいが、これは「ある・なし」の言い合い。',
      use: 'Not nothing. I brought snacks.（何もないわけじゃない。おやつはある）' },

    // R fix: V2 (blind 70 %, right: the "you didn't have to" script made the key the only sensible one); all three are
    //   now ways of saying it without words, so only "with your eyes" settles it
    // why: tone ← "said it" + the "No!" between the denials heard as a voice giving it away; under your breath ←
    //   "said it" taken literally (a mumble); "with your eyes" names a look
    { id: 'i1', skill: 'infer', level: 'B2', point: 'eyes', seg: [15, 27.1],
      stem: 'After the second “I didn’t say anything”, what does the reply claim?',
      choices: ['Your look gave away what you were thinking', 'Your tone of voice gave away what you meant',
                'You said it under your breath just now'], a: 0,
      cue: '2回目の否定のあと、何で「言った」のか。',
      line: 'I didn’t say anything. — You *said it with your eyes*.',
      said: '「何も言ってない」に「目で言ってた」と返している。',
      mean: 'said it with your eyes ＝ 目つきで気持ちが伝わっていた。口には出していない。',
      trap: 'said it から「声・口調」と取りやすい。with のあとの語を聞く。',
      use: 'No need to say it. I can tell.（言わなくても分かるよ）' },

    // R fix: V2 (blind 65 %, right: the key was the only upbeat choice and the only one without a reason); each choice
    //   now gives a stance plus its reason, and the key no longer holds "best" (cue leak)
    // why: comfort ← "picnic" + "still do" heard as still having the food; complaint ← "sitting on the ground" heard as
    //   grumbling about the roof; the "best part" she names is the least special part, so it's a joke
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'ground', seg: [27.1, 33.8],
      stem: 'How is the line about “the best part of a picnic” meant?',
      choices: ['As a joke: sitting down is nobody’s favorite part', 'As comfort: they can still share the food they have',
                'As a complaint: the roof is a bad place to sit'], a: 0,
      cue: '「一番いいところ」として何を挙げるか。',
      line: 'We can still do *the best part of a picnic*. *Sitting on the ground*.',
      said: '「ピクニックの一番いいところはまだできる。地面に座ること」と言う。',
      mean: '地面に座るのは一番いいところではない。わざと言って、困った状況を笑いに変えている。',
      trap: 'still do を「まだ食べられる」と取りやすい。挙げているのは食べ物ではなく座ること。',
      use: 'Look on the bright side: free parking.（いい方に考えよう。駐車はタダだ）' },

    // R drop: w1 (who, 'askwhy'): blind 60 %, right; g1's stem ("What worries Carly about telling people?") already
    //   says who is holding back, and with two leads the "who wants it known" answer follows the scene's setup, not
    //   the voices. Replaced by d4 (literal count stays at 4).

    // R fix: K7 (key 3 letters against 11 and 8); now three short rhyming feelings, so the last word's onset decides
    // why: glad ← "was sad" links into one word and the s is heard as gl-, and a hat flying off could be a jab at his
    //   style; mad ← the same rhyme, and a lost hat heard as annoying; "I'm obsessed with you" before it makes it "sad"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'fedora', seg: [44.5, 52.2],
      stem: 'What does Carly say she felt when his hat flew off?',
      choices: ['Sad', 'Glad', 'Mad'], a: 0,
      cue: '帽子の話の最後の一語。',
      line: 'When that fedora flew off your head, *I was sad*.',
      said: '「あの帽子が頭から飛んでいったとき、悲しかった」と言う。',
      mean: '小さな出来事まで覚えているほど夢中、という例。「恥ずかしくなんかない」の証拠として出している。',
      trap: 'was とつながり、頭の音がぼやけやすい。「夢中」の流れに合う気持ちで確かめる。',
      use: 'When you left, I was sad.（あなたが帰ったとき、さみしかった）' },

    // R fix: V2 (blind 55 %, right: the key was the only choice not about Beau); a distractor also gave away d2's key
    //   ("dump her online, like Beau"). Now the choices turn on whom the Internet would hurt.
    // why: her again ← "the Internet piled on" was about her, so the worry seems to be for herself; ashamed ←
    //   Freddie's "embarrassed to be with me?" turned around; "opening you up to that kind of pain" and "I just really
    //   want to protect you" put the hurt on Freddie
    { id: 'g1', skill: 'gist', level: 'B2', point: 'worry', reveals: ['beau', 'piledon'], seg: [52, 84.2],
      stem: 'What worries Carly about telling people?',
      choices: ['That people online will go after Freddie', 'That people online will go after her again',
                'That Freddie is ashamed to be seen with her'], a: 0,
      cue: '「worried that」のあと、誰が傷つくのか。',
      line: 'if we go public, I’ll be *opening you up to that kind of pain*.',
      said: 'ネットで叩かれた経験から、公表すれば彼も同じ目にあうと心配している。',
      mean: '自分より彼を守りたい。protect you とも言う。',
      trap: '叩かれたのは彼女なので自分の心配に見えるが、opening you の you は彼。',
      use: 'I just don’t want you to get hurt.（あなたに傷ついてほしくないだけ）' },

    // R fix: V2 (blind 60 %, right: g1's old distractor named it, and "dumped" was the only sitcom-ex move); now three
    //   bad-ex moves, all in front of viewers, so only the verb decides
    // why: made fun ← "the Internet piled on" heard as Beau mocking her; secrets ← "livestream" + "public
    //   relationship" heard as him leaking things; the verb is "dumped"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'beau', seg: [52, 60.4],
      stem: 'What did Beau do, as Carly tells it?',
      choices: ['Broke up with her in front of viewers', 'Made fun of her in front of viewers',
                'Showed her secrets in front of viewers'], a: 0,
      cue: '「and then he」のあとの動詞。',
      line: 'he *dumped me during that livestream*, and the Internet piled on.',
      said: '「ボーとは公の交際だったけど、配信中にふられた」と話している。',
      mean: 'dump ＝ 恋人をふる。くだけた言い方で、一方的に別れるイメージ。',
      trap: 'piled on から「からかわれた」と取りやすい。まず he のあとの動詞を聞く。',
      use: 'She dumped him by text.（彼女はメールで彼をふった）' },

    // R fix: S1/N7: the stem said "After the breakup", which gave away d2's key (a cold reader used it); now "After the
    //   livestream". The item itself passed the blind read (wrong pick).
    // why: her side ← pile = 積み重なる, a crowd gathering heard as support; lost interest ← "that kind of pain" heard as
    //   a hit to her channel; she calls it pain she'd be "opening you up to", so the crowd attacked
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'piledon', seg: [55.3, 60.6],
      stem: 'After the livestream, what did the Internet do, in her words?',
      choices: ['Lots of people joined in to criticize her', 'Lots of people came to her side against him',
                'Lots of people lost interest in her channel'], a: 0,
      cue: '「Internet」のあとの短い動詞句。',
      line: 'and the Internet *piled on*.',
      said: '「そしてネットのみんなが寄ってたかって」と続ける。',
      mean: 'pile on ＝ 弱っている人に大勢で追い打ちをかける。ネットの炎上によく使う。',
      trap: 'pile は「積み重なる」。人が集まるイメージから味方と取りやすいが、集まって攻める意味。',
      use: 'Don’t pile on him. He feels bad already.（寄ってたかって責めないで）' },

    // R fix: V2 (blind 60 %, right: "Because we're" clashed with "I'll be" and fell out on grammar); it's now the full
    //   "Because I'm", so the reduction itself is tested
    // why: I was ← the m of I'm merges into "just"; Of course ← the reduced "'cause" heard as "course"; Because ← the
    //   written form a learner expects; both sources have the short "'cause"/"cuz"
    { id: 's1', skill: 'sound', level: 'B2', point: 'cause', seg: [58.2, 64.4],
      stem: 'Fill the gap: “___ just worried that if we go public…”',
      choices: ['’Cause I’m', '’Cause I was', 'Of course I’m', 'Because I’m'], a: 0,
      cue: '「piled on」のあと、文頭の短く弱い2語。',
      line: '*’Cause I’m* just worried that if we go public…',
      said: '「だって、公表したら…って心配なの」と言う。',
      mean: 'because が ’cause（コズ）に縮む。I’m の m は just とつながる。',
      trap: '書き言葉の Because を予想しやすい。音節の数を数える。m が消えても I was ではない。',
      use: '’Cause I’m not ready yet.（だって、まだ準備できてないから）' },

    // R fix: V2 (blind 50 %, right: the only choice that tied back to Beau); the distractors are now the two sincere
    //   readings a learner takes (anxiety, a request for a promise)
    // why: fears ← a yes/no question taken at face value (日本語の「捨てないでね」); promise ← "anytime soon?" heard as
    //   asking for a vow; the light, Are-less question right after her Beau story, and her instant "Of course not",
    //   make it a point he's making: no dumping, no Beau-style pain
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'dumping', seg: [67, 74.4],
      stem: 'When Freddie asks if she plans on dumping him, what is he doing?',
      choices: ['Showing her the Beau story needn’t repeat', 'Letting her know he fears she’ll leave him',
                'Asking her to promise she’ll never leave him'], a: 0,
      cue: '前の恋人の話のすぐあと。返事の速さ。',
      line: '*You planning on dumping me* anytime soon? — No. *Of course not.*',
      said: '「近いうちに僕をふる予定でも？」と聞き、彼女は「まさか」と即答する。',
      mean: '答えの分かっている質問で、「ふられないなら、あの痛みは起きない」と気づかせている。',
      trap: '疑問文なので本気の不安と取りやすい。答えが決まっている軽い質問は、何かを示すための問い。',
      use: 'Are you planning on quitting? No? Then relax.（辞めるつもり？ないなら安心して）' },

    // anchor: 67.6–68.1 s both sources begin the question with "you planning on"; neither has an "are"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'dumping', seg: [67.1, 70.6],
      stem: 'Type the start: “___ dumping me anytime soon?” (3 words)', answer: 'you planning on',
      cue: '前の恋人の話のすぐあと。文法より、聞こえた音を。',
      line: '*You planning on* dumping me anytime soon?',
      said: '「近いうちに僕をふる予定でも？」。文頭に Are がなく、you から始まる。',
      mean: '会話では Are you … ? の Are をよく落とす。省いた分だけ軽く、からかうような口調になる。',
      trap: '習った疑問文の形に合わせて Are を足したくなる。書き取りは、正しい文でなく言われた音を書く。',
      use: 'You coming tonight?（今夜来る？）' },

    // R fix: V2 + K6 (blind 50 %, right: the key was the only nuanced, joking choice); now three readings of the
    //   preface and the hedge, the same length and kind
    // why: surprise him ← "I don't know if you know this" taken literally; at times ← "can be" + "kind of" heard as
    //   a real hedge (ときどき・少し); she has just told her own story of the Internet piling on, so it isn't news
    { id: 'i3', skill: 'attitude', level: 'C1', point: 'mean', reveals: ['piledon'], seg: [74.4, 84.2],
      stem: 'What is Carly doing when she warns him about the Internet?',
      choices: ['Stating the obvious as if it were news', 'Breaking news she expects will surprise him',
                'Hinting the Internet is mean only at times'], a: 0,
      cue: '前置きの言い方と、自分がさっき話した体験。',
      line: 'I don’t know if you know this, but the Internet can be *kind of mean*.',
      said: '「知ってるか分からないけど、ネットってちょっと意地悪なの」と言う。',
      mean: '叩かれた話の直後なので、知らないはずがない。わざと控えめに言う、乾いた冗談。',
      trap: '前置きを文字通りに取ると「情報を教えている」になる。kind of も、ここでは控えめのふり。',
      use: 'Not to state the obvious, but it’s raining.（言うまでもないけど、雨だよ）' },

    // R fix: V2 (blind 60 %, right: "catch" was a filler); also S1: the stem's "doesn't need protecting" gave away
    //   g1's key, so it now names the moment instead. The new distractor is the other real sense of take (I can
    //   take him = 勝てる), so each choice is a real reading of the words
    // why: hit back ← "I can take…" heard as "I can beat them" (take someone on); take down ← "take" + online talk
    //   heard as removing posts; it answers "You don't have to protect me", so he means enduring it
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'take', seg: [84, 89.2],
      stem: 'When Freddie answers her warning about the Internet, what does he claim?',
      choices: ['He can put up with anything people say about them', 'He can hit back at anything people say about them',
                'He can take down anything people post about them'], a: 0,
      cue: '「protect me」を断ったあとの一文。',
      line: 'I can *take whatever they throw at us*.',
      said: '「守らなくていい。何を言われても平気だ」と言う。',
      mean: 'take ＝ 耐える、受け止める。throw は物ではなく、悪口や批判のたとえ。',
      trap: 'take には「やり返す・勝つ」の意味もある。守らなくていい、のあとなら「耐える」の take。',
      use: 'I can take it. Tell me the truth.（大丈夫、受け止める。本当のことを言って）' },

    // R fix: V2 (blind 55 %, right: the only warm choice); the new distractor is a calm preference for secrecy, which
    //   only "It doesn't matter" rules out
    // why: safer ← "keep it a secret forever" heard as his own preference after her worry; giving up ← "forever"
    //   heard as a sulky retreat; "It doesn't matter. I just want to be with you" makes either one fine
    { id: 'i4', skill: 'infer', level: 'B2', point: 'forever', reveals: ['with'], seg: [88.8, 96.4],
      stem: 'What does Freddie’s second option, keeping it secret, show?',
      choices: ['He’s happy either way, as long as they’re together', 'He now thinks keeping it secret is the safer choice',
                'He’s giving up on going public, since she won’t'], a: 0,
      cue: '2つ目の案のあと、「matter」で終わる一言。',
      line: 'Or we can *keep it a secret forever*… *It doesn’t matter*. I just want to be with you.',
      said: '「ずっと秘密でもいい。どっちでも。君といたいだけ」と言う。',
      mean: '公表か秘密かより、一緒にいることが大事。心配を軽くしている。',
      trap: 'forever の強さで「すねて引いた」と取りやすいが、It doesn’t matter がどちらでもいいという合図。',
      use: 'Either way is fine with me.（どっちでもいいよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'with', seg: [93.6, 96.5],
      stem: 'Type what he says: “I just ___ you.” (4 words)', answer: 'want to be with',
      cue: '「It doesn’t matter」のあと。',
      line: 'I just *want to be with* you.',
      said: '「ただ君と一緒にいたいんだ」と言う。',
      mean: 'be with ＝（恋人として）一緒にいる。この場面の気持ちを一言でまとめている。',
      trap: 'be と with が短くつながり、一語に聞こえやすい。4語を数えて確かめる。',
      use: 'I just want to be with my family.（家族と一緒にいたいだけ）' },

    // R fix: V2 (blind 60 %, right: "the whole time" echoed the setup); also "Freddie's mom" rested on the show (the
    //   audio says only "It's my mom"). Now three cameras; the line also gives away d4, so reveals 'whystream'.
    // why: drone ← "to show the drones" heard as the drones filming; street ← they're on a roof and someone outside
    //   seems the likeliest camera; "your camera's on" and "I started streaming… and completely forgot" make it theirs
    { id: 'g2', skill: 'gist', level: 'B2', point: 'stream', reveals: ['whystream'], seg: [115.5, 172],
      stem: 'How does their private talk end up public?',
      choices: ['Their own camera was streaming it live', 'A drone had been filming them from above',
                'Someone on the street had filmed them'], a: 0,
      cue: '母からのメッセージと、そのあとの言い訳。',
      line: '*your camera’s on*… — I *started streaming* to show the drones and completely forgot.',
      said: '母の連絡で、ドローンを見せる配信をつけたまま忘れていたと分かる。',
      mean: '屋上の話は、最初から全部ネットに流れていた。秘密にする相談が意味をなくす。',
      trap: 'ドローンが撮ったと思いやすい。your camera と、started の主語を聞く。',
      use: 'Wait, is my mic on?（待って、マイク入ってる？）' },

    // R fix: V2 (blind 70 %, right: the key was the only choice about the chin); all three are now a remark tacked onto
    //   the warning, so "not", "flattering" and "Carly's" decide
    // why: praise ← flatter = ほめる, so "flattering" sounds like praise (the "not" is weak); her own ← "for Carly's" is
    //   quick and the chin heard as the mom's own; the "and" adds a jab after the warning
    { id: 'h2', skill: 'humor', level: 'C1', point: 'chin', reveals: ['stream'], seg: [123.5, 129.1],
      stem: 'What makes the mom’s message funny?',
      choices: ['A jab at Carly’s chin tacked onto her warning', 'Praise for Carly’s chin tacked onto her warning',
                'A complaint about her own chin on the stream'], a: 0,
      cue: '「camera’s on」のあと、and に続く部分。',
      line: 'FYI, your camera’s on, and it’s *not a flattering angle* for Carly’s chin.',
      said: '「カメラがついてる。それと、カーリーのあごが映えない角度よ」と送ってくる。',
      mean: '大事な知らせのついでに、見た目に一言。心配と小さな意地悪が一緒なのがおかしい。',
      trap: 'flattering は「ほめる」から来た語だが、not が付いて「写りが悪い」。',
      use: 'That’s not a flattering photo of me.（その写真、写りが悪いな）' },

    // R new: replaces w1 (literal count). Blind read, fresh: about 35 % (help and the picnic both fit a roof).
    // why: help ← they're stuck on a roof and shouted "Help!", so a stream to call for help fits; picnic ← the picnic
    //   talk at the start; "I started streaming to show the drones" gives the reason
    { id: 'd4', skill: 'detail', level: 'B1', point: 'whystream', reveals: ['stream'], seg: [128.7, 133],
      stem: 'Why was the stream started in the first place?',
      choices: ['To show off the drones', 'To ask viewers for help', 'To show their rooftop picnic'], a: 0,
      cue: '「started streaming」のあと、to に続く部分。',
      line: 'I started streaming *to show the drones*…',
      said: '「ドローンを見せようと配信を始めて、すっかり忘れてた」と言う。',
      mean: 'to show ～ ＝ ～を見せるために。目的を to で続けている。',
      trap: '屋上で困っているので「助けを呼ぶため」と取りやすい。to のあとを聞く。',
      use: 'I came early to get a good seat.（いい席を取るために早く来た）' },

    // R fix: V2 (blind 60 %, right: with "surprisingly" in every choice, only "nice" could surprise someone braced for
    //   mean); the choices now say it in other words, so the learner has to catch the adjective
    // why: as mean ← Carly's fear ("kind of mean") primes it; funnier ← the comments that follow are jokes (a2)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'comments', seg: [143.3, 146.6],
      stem: 'How are the comments at first, as they read them?',
      choices: ['Nicer than they expected', 'As mean as they expected', 'Funnier than they expected'], a: 0,
      cue: '「comments are」のあとの2語。',
      line: 'These comments are *surprisingly nice*.',
      said: '「このコメント、意外と優しい」と読み上げる。',
      mean: 'surprisingly ＝ 思ったより。意地悪だと心配していたので、予想が外れた驚き。',
      trap: '前の kind of mean から mean を予想しやすい。surprisingly は予想と逆の合図。',
      use: 'The food was surprisingly good.（料理が意外とおいしかった）' },

    // R fix: V2 (blind 70 %, right: the only choice a nice comment would say); the new distractor is a nice comment too
    //   (タイミング), so the idiom's meaning decides
    // why: right moment ← "time" heard as タイミング, "good timing"; matter of time ← "about time" mixed up with "a matter
    //   of time" (いずれそうなる); it's read out as one of the "surprisingly nice" comments
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'abouttime', reveals: ['comments'], seg: [144.3, 148.1],
      stem: 'What does the first comment they read out mean?',
      choices: ['Finally; it took them long enough', 'Perfect timing; it’s the right moment',
                'Careful; it’s only a matter of time'], a: 0,
      cue: '「surprisingly nice」の直後の一言。',
      line: '*It’s about time*.',
      said: '1つ目のコメントは「やっとか」。',
      mean: 'It’s about time ＝「遅いくらいだ、やっとだね」。待っていたことが起きたときに言う。',
      trap: 'time から「いいタイミング」と取りやすい。about time は「もっと早く」の気持ち。',
      use: 'You’re here! It’s about time.（来た！遅いよ）' },

    // why: can't stop ← "blowing my mind" just before, and "definitely" heard as real enthusiasm; like ← "clicking"
    //   heard as liking; "not… as fast as humanly possible" only makes sense as the opposite
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'sarcastic', seg: [148, 153.55],
      stem: 'What does the last comment in this stretch really mean?',
      choices: ['The viewer is leaving the stream as fast as they can', 'The viewer can’t stop watching, it’s so exciting',
                'The viewer is clicking “like” again and again'], a: 0,
      cue: 'definitely と、そのあとの大げさな言い方。',
      line: 'I’m *definitely not clicking away as fast as humanly possible*.',
      said: '「絶対に、全速力で画面を閉じたりしてないよ」と書かれている。',
      mean: 'definitely not ＋大げさな表現は反対の意味。実は全力で逃げている皮肉。',
      trap: '直前の blowing my mind に引かれて喜びと取りやすい。強すぎる否定は、皮肉を疑う。',
      use: 'Oh, I’m definitely not bored.（いや全然、退屈なんかしてないよ）' },

    // R fix: V2 (blind 65 %, right: the stem's "After the drone talk" cued a topic move, and only the key was one);
    //   now all three are about the talk, and the stem no longer names the drones
    // why: go back on ← "go back" + "telling me" heard as "go back on what you told me" (撤回); drones ← the picture
    //   was the last topic; "to you telling me you love me" names the earlier topic, and "I love you" follows
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'goback', seg: [222.3, 227.1],
      stem: 'What does “Can we just go back to…” do here?',
      choices: ['Steers the talk back to their “I love you”s', 'Asks him to go back on what he said before',
                'Asks to talk more about the drones’ picture'], a: 0,
      cue: '話題がドローンの絵に移ったあと、文頭の4語。',
      line: '*Can we just go back to* you telling me you love me? — Yeah, I thought you’d never ask.',
      said: 'ドローンの話をやめて「愛してるって言ってくれたところに戻らない？」と言う。',
      mean: 'go back to ～ ＝ 話を～に戻す。気まずい話題から大事な話へ。',
      trap: 'go back on（撤回する）と混ざりやすい。to のあとが話の中身なら、話題を戻す。',
      use: 'Can we go back to the budget?（予算の話に戻ってもいい？）' },

    // R fix: V2 (blind 75 %, right: "made him ill" was a filler); the new distractors are the other common senses of
    //   sick (気持ち悪い) and a guess (crazy = 値段)
    // why: gross ← sick = 気持ち悪い, "a sick sight"; expensive ← sick heard as "crazy", like a crazy price; he's
    //   asking after a hat he misses, and "We'll get you a new one" comforts him
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'sick', seg: [249.7, 255.9],
      stem: 'How does he describe his lost hat?',
      choices: ['As a really cool-looking hat', 'As a kind of gross-looking hat', 'As a pretty expensive hat'], a: 0,
      cue: '帽子の前の形容詞。くだけた若者言葉。',
      line: 'You didn’t happen to see a *sick fedora* on the street, did you?',
      said: '「道で、イケてる帽子を見かけなかったよね？」と聞いている。',
      mean: 'sick はくだけた若者言葉で「すごくいい・かっこいい」。ここは自分の帽子の自慢。',
      trap: 'sick ＝ 病気・気持ち悪いと取りやすい。物や技をほめる sick は、ほめ言葉。',
      use: 'Those are some sick shoes!（その靴、めっちゃいいね！）' },

    // R fix: V2 (blind 60 %, right: "all night" and "lost" were weak); the distractors now are the two misses a
    //   learner makes on "didn't hear my phone" (whose calls, and why unanswered)
    // why: called first ← "my phone" heard as the speaker's own calls; died ← "didn't hear my phone" heard as a dead
    //   phone; "finally rescuing us" + "sorry I didn't hear" = they called and got no answer
    { id: 'i5', skill: 'infer', level: 'B2', point: 'rescue', seg: [255.8, 261.85],
      stem: 'What does the apology about the phone tell us?',
      choices: ['They had tried calling and got no answer', 'This person had tried calling them first',
                'This person’s phone had died on the way over'], a: 0,
      cue: '「finally」と、そのあとのおわび。',
      line: 'thanks for *finally* rescuing us. — Sorry I *didn’t hear my phone*.',
      said: '「やっと助けてくれてありがとう」に「電話に気づかなくてごめん」と返す。',
      mean: '2人は何度も電話した。finally に待たされた気持ちが出る。',
      trap: 'my phone から、この人がかけたと取りやすい。didn’t hear は鳴ったのに気づかないこと。',
      use: 'Sorry, my phone was on silent.（ごめん、マナーモードだった）' },

    // R fix: V2 (blind 50 %, right: the key was the only choice linking the possum to the phone); its one rewrite. The
    //   new near miss links them too, but wrongly (lost vs didn't hear)
    // why: lost ← right link, wrong mechanism: the possum business heard as how the phone went missing, but "didn't
    //   hear my phone" says it rang; separate ← "Unrelated" taken at its word
    // anchor: 259.1–264.9 s "Sorry I didn't hear my phone. It was for totally normal reasons. Unrelated, …": an unasked
    //   denial, then "unrelated" put in front of the possum ties the two together
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'possum', seg: [258.2, 266.4],
      stem: 'What do “totally normal reasons” and “Unrelated” together suggest?',
      choices: ['The possum kept them too busy to hear the phone', 'The phone got lost while dealing with the possum',
                'The possum is a separate problem from the phone'], a: 0,
      cue: '頼まれていない言い訳と、そのあとの「関係ない」。',
      line: 'It was for *totally normal reasons*. *Unrelated*, does anyone know where I can dump a giant possum…?',
      said: '電話に出なかったのは「普通の理由」と言い、「関係ないけど、オポッサムの死体どこに捨てられる？」と聞く。',
      mean: '聞かれてもいないのに「普通の理由」と言い、わざわざ「関係ない」と前置き。それが白状。',
      trap: 'Unrelated を新しい話題と取りやすい。わざわざ否定する言葉は、つながりの合図。',
      use: 'Unrelated, but has anyone seen my keys?（関係ないけど、誰か私の鍵見た？）' },
  ]
};
