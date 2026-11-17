// “Jerry Knows His Place | Parks and Recreation” (the official Parks and Recreation channel, Season 4): asked about
// Nick Newport on camera, Leslie calls him a jerk without knowing he died that day; Jen calls on her to cancel her
// events, and at an emergency meeting Ben, Ann, April and Andy split before Leslie decides to campaign on, "in a classy
// and respectful way".
// Segments from the captions, words from whisper (2026-11-16). Names in the audio: Leslie, Jen, Ben, April, Andy, Ann.
// Ann is never named in her own turn (113.5–120.2 s); April's "I strongly disagree with Ann" and Leslie's "Ann…
// saying no to your beautiful face… No" settle it, so stems call her "a teammate" until w2.
// EAR CHECK: 136.8 s p1 — captions "Who wants a panini?", whisper "Who went to Panini?" (the key, a jump to lunch, holds
//   on the captions' words)
// Untested on purpose: 30–36.6 s ("I… sad" / "I said": the sources split), 45–55 s (rally crowd, garbled), 75–79.4 s
// (Jen's simile: sexual), 100.5–101.8 s ("mistresses"), 110.8–113.4 s ("Great body"), 151–153.8 s (captions "get animal
// from our backs", whisper "get Ann off of our backs"), the title's gag (who stands where: on screen only).
// REVIEW 2026-11-16: pass 9, fix 13, drop 0, new 0; ear checks 1
// REVIEW 2026-11-17 (2nd): pass 15, fix 6, drop 1, new 0; ear checks 1
// REVIEW open: f1 (rewritten 2026-11-17) still tests a set phrase ("Not with that attitude"); a cold read put it at 75 %
//   from the choices alone. Kept: it is the bank's only phrase item, and knowing the idiom is the skill.
// REVIEW open: c2 (C2) and g1 were still 60 % on a cold read after the rewrite.
import type { Clip } from '../types.ts';

export const jerryPlace: Clip = {
  id: 'jerryplace', video: 'aDDecDFkVdA', title: 'Jerry Knows His Place', dur: 175, wpm: 155, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: clean it up ← "contaminants… river" caught, "stop… from dumping" lost; buying land ← "the Newports" plus the
    //   later "buy this election"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'river', seg: [0, 8.4],
      stem: 'What does Leslie promise to do if she is elected?',
      choices: ['Stop companies dumping waste in the river', 'Pay to clean the waste out of the river',
                'Stop the Newports buying land by the river'], a: 0,
      cue: 'promise to stop のあと、from に続く動詞。',
      line: 'I promise to stop the Newports… from *blatantly dumping contaminants* into the Pawnee River.',
      said: '当選したら川に汚染物質を捨てさせない、と約束する。',
      mean: 'dump ＝ 捨てる。contaminants ＝ 汚染物質。掃除ではなく、捨てるのを止める約束。',
      trap: '川と汚染だけ拾うと「掃除」に聞こえる。stop A from ～ing ＝ Aに～させない。',
      use: 'Please stop dumping trash here.（ここにゴミを捨てないで）' },

    // R fix: V2 (the key was the only sensible choice). All three now start "She attacks Nick", and the near misses
    //   come from "Bobby's father" and the reporter's "Sorry, I meant".
    // R fix (2nd review): V2 (blind 70 %: the death was the only twist on offer). All three are now "not knowing…";
    //   "calls her rude" → "gravely ill", from the progressive "dying". 'jerk' left with i1.
    // why: gravely ill ← "Nick Newport dying" heard as "is dying", "earlier today" lost; about Bobby ← "Bobby's father,
    //   Nick Newport" heard as a question about the son
    { id: 'g2', skill: 'gist', level: 'B2', point: 'interview', reveals: ['died'], seg: [9.3, 44.4],
      stem: 'What goes wrong for Leslie in the interview?',
      choices: ['She attacks Nick, not knowing he died that day', 'She attacks Nick, not knowing the question meant Bobby',
                'She attacks Nick, not knowing he is gravely ill'], a: 0,
      cue: '記者の Sorry, I meant のあと、質問の本当の中身。',
      line: 'Sorry, I meant can you comment on Nick Newport *dying earlier today*?',
      said: '記者がニックについて聞くと悪口を並べ、記者は「今日亡くなった件です」と言い直す。',
      mean: '質問は死去への一言だった。知らずに故人を攻撃してしまった。',
      trap: 'Bobby の名が先に出て、息子の話に聞こえやすい。Sorry, I meant のあとが本題。',
      use: 'Sorry, I meant the other one.（すみません、もう一方のことです）' },

    // R fix: V2 ("just a guess" was easy to rule out). It's now "soften the insult", the 正直言って softener frame.
    // why: soften ← "to be honest" openers used as a cushion (the Japanese 正直言って frame); lighter point ← a new
    //   sentence start read as a turn away from the list
    { id: 'm1', skill: 'marker', level: 'B2', point: 'frankly', seg: [17.6, 22.55],
      stem: 'What does the one-word start of Leslie’s “he’s a real jerk” line signal?',
      choices: ['She is about to say it bluntly', 'She is about to soften the insult',
                'She is moving on to a lighter point'], a: 0,
      cue: '悪口のリストのあと、文の頭の一語。',
      line: '*Frankly*, he’s a real jerk, and if he thinks he can buy this election…',
      said: 'ひどい行いを並べたあと、「はっきり言って、最低なやつ」と続ける。',
      mean: 'Frankly ＝ 率直に言うと。遠慮なく本音を言う合図で、悪口をむしろ強めている。',
      trap: '「正直言って」を和らげる前置きと取りやすい。Frankly のあとは強い本音が来る。',
      use: 'Frankly, I liked the first hotel better.（正直、最初のホテルの方がよかった）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'died', seg: [22.55, 26.9],
      stem: 'Type what the reporter says: “comment on Nick Newport ___ today?” (2 words)', answer: 'dying earlier',
      cue: 'Sorry, I meant のあと。名前のすぐ後ろ。',
      line: 'Sorry, I meant can you comment on Nick Newport *dying earlier* today?',
      said: '記者が「今日亡くなったことについてです」と言い直す。',
      mean: 'dying earlier today ＝ 今日、先ほど亡くなったこと。この一言で場面が変わる。',
      trap: 'dying の g はほぼ消え、earlier とつながって「ダイイナーリア」に近い。',
      use: 'Can you comment on the delay?（遅れについて一言いただけますか）' },

    // why: glad ← "bummer" unknown, and the earlier "jerk" carried over; grander ← "My official statement is…" sounds
    //   like the start of a speech
    { id: 'h1', skill: 'humor', level: 'C1', point: 'bummer', seg: [36.9, 44.4],
      stem: 'Why does Leslie’s second try at an official statement get a laugh?',
      choices: ['Its words are far too casual for a death', 'It still sounds glad that the man has died',
                'It is far grander than the moment needs'], a: 0,
      cue: '「公式声明」という前置きと、最後の2語の差。',
      line: 'No. My official statement is, that is, overall, *a bummer*.',
      said: '「公式声明は…総じて、がっかりなことです」と、たどたどしく言う。',
      mean: 'bummer は「がっかり」「ついてない」の軽い口語。人の死への公式声明には軽すぎる。',
      trap: '前置きが堅いので中身も立派だと思いやすい。笑いは、形式と言葉の軽さのずれから来る。',
      use: 'The rain is a bit of a bummer.（雨はちょっとがっかりだね）' },

    // R fix: V2 (only the key had two parts). All three now start "He notes the harsh words, then…".
    // why: condemns ← "Harsh words" caught, the "but" lost; mocks ← "T-shirt cannons" heard as a dig at a cheap rally
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'cannons', seg: [55.8, 61.75],
      stem: 'After the clip of Leslie’s insult airs, what is the reporter’s stance?',
      choices: ['He notes the harsh words, then enjoys the rally', 'He notes the harsh words, then condemns them',
                'He notes the harsh words, then mocks the rally'], a: 0,
      cue: 'きつい言葉への一言のあと、逆接と強めの一語。',
      line: 'Harsh words, *but* this reporter *does love* those T-shirt cannons.',
      said: '「きつい言葉だが、この記者はTシャツ大砲が大好きだ」とニュースが締める。',
      mean: '悪口には軽く触れるだけで、楽しい話に流す。does love は「本当に好き」の強め。',
      trap: 'Harsh words だけで非難と取りやすい。but のあとが言いたいこと。',
      use: 'Pricey, but I do love this place.（高いけど、この店は本当に好き）' },

    // R fix: N6 (notes 126 → ≤ 120). V2 ("really doing" flagged a hidden motive, and the key was the only cynical choice). The stem is plain, and
    //   "nothing more" → a second pressure on Leslie (an apology).
    // R fix (2nd review): V2 (blind 60 %: the key was still the only cynical reading). The apology choice is now
    //   cynical too ("Shaming Leslie into an apology"), so the choice turns on what she asks for and of whom.
    // why: both campaigns ← "not a time for politics" heard as a rule for everyone (scope shift); apology ← "out of
    //   respect for the Newport family" heard as a demand for amends, the right mechanism (a dig) on the wrong ask
    // anchor: 64.0–72.1 s "This is not a time for politics" then "cancel all of *her* campaign events": only Leslie is
    //   to stop; 72.5 s "Anything else would be a classless move" labels the rival, not the moment
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'jen', seg: [61.75, 74.8],
      stem: 'When Jen says politics should wait, what is her call doing?',
      choices: ['Scoring a point on Leslie while sounding respectful', 'Asking both campaigns to pause out of respect',
                'Shaming Leslie into an apology while sounding respectful'], a: 0,
      cue: '「政治の時ではない」と、誰に何を求めているか。',
      line: 'This is *not a time for politics*. I am calling on Leslie Knope to cancel all of *her* campaign events…',
      said: 'ジェンは「今は政治の時ではない」と、レスリーにだけ活動の中止を求める。',
      mean: '政治を休もうと言いつつ、相手陣営だけを止める。弔意の形をした選挙の一手。',
      trap: 'respect を本心と取りやすい。求めているのは謝罪でなく中止、それも her の分だけ。',
      use: 'Out of respect, let’s skip the speeches.（敬意を込めて、スピーチはなしで）' },

    // R fix: V2 (only the key had a "but"). The near miss now joins "keep campaigning" to Ann's condition; it shows
    //   d3's key, so it reveals 'apologize' too.
    // R fix (2nd review): V2 (blind 70 %: only the key was moderate). "hit harder" → "pause, then come back classy",
    //   the right manner on the wrong timing; trap rewritten to match.
    // why: after an apology ← Ann's "at least until you apologize" merged with the "keep campaigning" decision; pause
    //   ← "No" after "saying no to your beautiful face" heard as "no campaigning", "classy and respectful" kept
    { id: 'g1', skill: 'gist', level: 'C1', point: 'call', reveals: ['ann', 'apologize'], seg: [80.5, 155.4],
      stem: 'How does Leslie settle her team’s split over the campaign?',
      choices: ['Keep going, but in a classy and respectful way', 'Keep going, but only after saying sorry to Bobby',
                'Pause a while, then come back classy and respectful'], a: 0,
      cue: '最後の No のあと、付け加えた条件。',
      line: 'No, we’re going to keep campaigning, okay? *But*… in a *classy and respectful way*…',
      said: '意見が分かれたあと、レスリーは「続ける。ただし上品に、敬意を持って」と決める。',
      mean: '止めない、でも故人への配慮は見せる。両方の声を半分ずつ取った結論。',
      trap: 'No を「やめる」と取ると休止に聞こえる。No はアンへの返事。結論は keep のあと。',
      use: 'We’ll go ahead, but quietly.（進めるけど、静かにね）' },

    // why: 88 ← "ninety" heard as "eighty"; 90 ← "-ty" caught, "eight" lost; 99 ← "ninety-" plus a guess
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', seg: [87.4, 93.25], keep: true,
      stem: 'How old was the man who died?',
      choices: ['88', '90', '98', '99'], a: 2,
      cue: 'that man is のあと、数字の後ろ半分。',
      line: 'But that man is *98 years old* and he’s an awful man.',
      said: '「でもその男は98歳で、ひどい男だ」とレスリーが状況をまとめる。',
      mean: 'ninety-eight と言う。高齢だった、という事実を「でも」で持ち出している。',
      trap: 'ninety と eighty は母音が似て聞こえる。数字は頭の音と後ろの音を両方聞く。',
      use: 'My grandmother is ninety-eight.（祖母は98歳です）' },

    // R fix: V2 (the key was the only balanced reading). "takes back 'jerk'" → "so I'm sorry", the same balance
    //   with one step too far, refuted by "However, he was a jerk".
    // why: hardly matters ← stops at the first "but" ("98 years old… awful man"); I'm sorry ← "he is a man and he died"
    //   heard as regret
    // anchor: 87.8–94.4 s "But… 98 years old… an awful man. However, he is a man and he died." then 96.6 s "However, he
    //   was a jerk": each "but/however" swings back, so neither side wins and "jerk" stands
    // R fix (also): S4/N6 (the segment was 15.9 s, the notes 140). It now starts at 88.6, 0.5 s before "a man has
    //   died", for 14.7 s; the notes are ≤ 120.
    { id: 'c1', skill: 'infer', level: 'C2', point: 'however', reveals: ['age'], seg: [88.6, 103.3],
      stem: 'Which plain-English version keeps what Leslie means in her “situation” summary?',
      choices: ['“He was awful, but a death is a death, so I’m torn.”', '“He was old and awful, so his death hardly matters.”',
                '“He was awful, but a death is a death, so I’m sorry.”'], a: 0,
      cue: '逆接の語のたびに、話がどちらへ戻るか。',
      line: 'But that man is 98 years old and he’s an awful man. *However, he is a man and he died.*',
      said: '「98歳でひどい男。でも人間で、死んだ」。さらに「でも最低なやつだった」と続く。',
      mean: 'but と however を往復して決めきれない。迷いをそのまま口にするおかしさ。',
      trap: '途中の逆接で結論や謝罪と取りやすい。逆接が続くなら、最後まで聞いて決める。',
      use: 'It’s pricey. However, it’s really good.（高い。とはいえ、本当においしい）' },

    // R drop (2nd review): i1, why calling "the dead man" a jerk is a problem. Common sense answers it (V1), and it was
    //   70 % blind. Never shipped, so deleted; infer keeps i2 and c1.
    // why: cheated savings ← "a lot of people" plus "tons of" heard without the verb; bought votes ← "buy this election"
    //   from the interview
    { id: 'd2', skill: 'detail', level: 'B1', point: 'work', seg: [96.5, 103.3],
      stem: 'In Leslie’s list of Nick’s wrongs, what did he do to people?',
      choices: ['Put a lot of them out of work', 'Cheated a lot of them out of savings', 'Bought a lot of their votes'], a: 0,
      cue: 'a lot of people のあと、短い3語。',
      line: 'He *put a lot of people out of work*. … He polluted this town.',
      said: '「多くの人を失業させた。町を汚染した」と悪い行いを並べる。',
      mean: 'put A out of work ＝ Aを失業させる。工場の閉鎖などを思わせる言い方。',
      trap: 'a lot of people だけだと中身を想像で埋めやすい。out of のあとを聞く。',
      use: 'The storm put the shop out of business.（嵐で店がつぶれた）' },

    // why: Ann ← she argues next and is the other strong voice; April, Andy ← they speak later in the meeting
    { id: 'w1', skill: 'who', level: 'B1', point: 'ben', seg: [103.2, 110.75],
      stem: 'Who does Leslie turn to first for advice on what to do?',
      choices: ['Ben', 'Ann', 'April', 'Andy'], a: 0,
      cue: 'Okay のすぐあと、呼びかけの名前。',
      line: 'Okay, *Ben*, what do we do?',
      said: 'レスリーが「ベン、どうする？」と最初に意見を求める。',
      mean: '呼びかけの名前で、次に誰が答えるかが分かる。この会議は名指しで順に意見を聞いている。',
      trap: 'Ben は短く、Okay のすぐあとで聞き落としやすい。呼びかけは文の頭か終わりに来る。',
      use: 'Okay, Maya, what do you think?（じゃあマヤ、どう思う？）' },

    // R fix: V2 (only the key had the "sorry, but" shape). The near miss is now "sorry, but unsure", and "glad" is hidden.
    // why: unsure ← "unfortunate" heard as real grief, the "We stop, we lose" missed; glad ← "the stakes are too high"
    //   heard as seeing a chance
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'unfortunate', reveals: ['ben', 'cant'], seg: [103.2, 110.75],
      stem: 'How does Ben sound about Nick’s death when he answers?',
      choices: ['Sorry it happened, but firm that they go on', 'Sorry it happened, but unsure what to do next',
                'Quietly glad, though careful not to show it'], a: 0,
      cue: '最初の一言のあと、逆接で何が来るか。',
      line: 'Okay, it’s *unfortunate, but* the stakes are too high.',
      said: 'ベンは「不運だが、かかっているものが大きすぎる。やめたら負けだ」と言う。',
      mean: 'unfortunate で一応の弔意を示し、but のあとで「続けるべき」と言い切っている。',
      trap: '弔意の語だけで動揺と取りやすい。but のあとの短く強い文が本当の立場。',
      use: 'It’s unfortunate, but we have to go.（気の毒だけど、行かなきゃ）' },

    // R fix: V2 ("can't still" isn't idiomatic, so the set chunk stood out). It's now "can't", with "just" lost.
    // why: can just ← the t of "can't" drops before "just"; could just ← "can" with a weak vowel heard as "could";
    //   can't ← the short "just" lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [105.6, 110.75],
      stem: 'Fill the gap: “We ___ stop campaigning.”',
      choices: ['can’t just', 'can just', 'could just', 'can’t'], a: 0,
      cue: 'too high のあと、短い2語のつながり。',
      line: 'We *can’t just* stop campaigning. We stop, we lose.',
      said: '「ただやめるわけにはいかない。やめたら負けだ」とベン。',
      mean: 'can’t の t は just の前でほぼ消える。母音が長く強いのが否定の目印。',
      trap: 'can なら「やめてもいい」で、次の「やめたら負け」と合わない。後ろの文で確かめる。',
      use: 'We can’t just leave it here.（ここに置いていくわけにはいかない）' },

    // R fix: V2/S1 (two weak near misses; the stem named Leslie, whom only the voice settles). The choices are parallel
    //   "You…" lines, and the stem asks about "the reply".
    // R fix (2nd review): V2 (blind 70 %, the open question from the first review). The katakana near miss now has the
    //   key's shape ("You could win if…"), so knowing the set phrase is what decides it.
    // why: nicer to Ben ← "attitude" as the katakana word (態度が悪い); don't bother ← "not" heard as agreeing with "I'm not"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'attitude', seg: [110.75, 116.1],
      stem: 'When a teammate says “I’m not gonna beat him”, what does the reply mean?',
      choices: ['You could win if you believed you could', 'You could win if you were nicer to Ben',
                'You’re right, so don’t bother trying'], a: 0,
      cue: '「勝てない」への短い返し。何が足りないと言っている？',
      line: 'I’m not gonna beat him. — *Not with that attitude.*',
      said: '「彼には勝てない」に、「その姿勢じゃね」と返す。',
      mean: '「そう思っていたら無理。やる気を出せばできる」という決まった励まし。軽いからかいも入る。',
      trap: 'attitude をカタカナの「態度が悪い」と取りやすい。ここは「気の持ちよう」。',
      use: 'You’ll never win? Not with that attitude!（勝てない？そんな弱気じゃね！）' },

    // R fix: V2 ("giving-up, then nothing" was easy to rule out). All three are now "a giving-in, then…", the new near
    //   miss a promise to try (from “Not with that attitude”).
    // why: backs Ben ← "Okay" read as accepting his case; try harder ← "Okay, fine" heard as taking up "Not with that
    //   attitude"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'fine', seg: [113.4, 120.25],
      stem: 'After Leslie’s push, what does the teammate’s “Okay, fine” lead into?',
      choices: ['A giving-in, then a view that goes against Ben’s', 'A giving-in, then a view that backs up Ben’s',
                'A giving-in, then a promise to try harder'], a: 0,
      cue: '短い2語のあと、誰と違う意見が出るか。',
      line: '*Okay, fine.* I think you should stop.',
      said: '励まされた人が「分かった、じゃあ言う。やめるべきだと思う」と続ける。',
      mean: 'Okay, fine は「そこまで言うなら」。押されて、本音を言う前置き。',
      trap: 'fine を同意や「やってみる」と取りやすい。直後の文がベンと逆なので本音の前置き。',
      use: 'Okay, fine. I’ll tell you what happened.（分かった、何があったか話すよ）' },

    // why: April ← she speaks in the segment and says "strongly"; Ben ← he gave the last full argument before this
    { id: 'w2', skill: 'who', level: 'C1', point: 'ann', reveals: ['april'], seg: [116.05, 123.65],
      stem: 'Who thinks Leslie should stop, at least for now?',
      choices: ['Ann', 'April', 'Ben'], a: 0,
      cue: 'あとの人が「誰に反対」と言っているか。',
      line: 'I think you should stop. … — I wasn’t listening, but I strongly disagree with *Ann*.',
      said: '一人が「やめるべき」と言い、エイプリルが「アンには大反対」と続ける。',
      mean: '反対される相手として名前が出るので、止めるべきと言ったのはアン。',
      trap: 'strongly が耳に残り、エイプリルの意見と思いやすい。with のあとの名前を聞く。',
      use: 'I strongly disagree with that.（それには強く反対です）' },

    // why: the funeral ← "out of respect for the Newport family" from Jen; the press ← the news clip earlier
    { id: 'd3', skill: 'detail', level: 'B2', point: 'apologize', seg: [116.05, 120.25],
      stem: 'Until when does the person urging a pause want Leslie to stop?',
      choices: ['Until she says sorry to Bobby face to face', 'Until the Newport family has held the funeral',
                'Until the news has stopped playing the clip'], a: 0,
      cue: 'at least until のあと、誰に何をするか。',
      line: 'I think you should stop. *At least until you apologize to Bobby in person.*',
      said: '「やめるべき。少なくともボビーに直接謝るまでは」。',
      mean: 'in person ＝ 本人に会って直接。手紙や声明ではなく、顔を合わせて謝るという条件。',
      trap: 'ジェンの family という語から葬儀の話と結びつけやすい。until のあとが条件。',
      use: 'I’d like to thank you in person.（直接お礼を言いたいです）' },

    // R fix (2nd review): V2 (blind 70 %: only the key was a joke). "Ben's case" → "backs Ann without hearing her",
    //   the same joke with the direction flipped; "disagree" refutes it.
    // why: backs Ann ← "Ann" caught at the end, "dis-" lost (it's short); dodging ← "I wasn't listening" heard as
    //   a polite way out of giving a view (the Japanese frame)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'april', reveals: ['ann'], seg: [120.25, 123.65],
      stem: 'Why does April’s answer get a laugh?',
      choices: ['She takes a strong side in a debate she didn’t hear', 'She backs Ann without having heard what Ann said',
                'She dodges giving a view by saying she missed it'], a: 0,
      cue: '前半の告白と、後半の強い意見のずれ。',
      line: '*I wasn’t listening*, but I *strongly disagree* with Ann.',
      said: 'エイプリルは「聞いてなかった」と認め、それでも「アンには大反対」と言う。',
      mean: '中身を聞かずに反対するのは、意見ではなく「アンに逆らいたいだけ」だから。そのずれが笑い。',
      trap: 'but のあとを正式な意見と取りやすい。前半とセットで、理由のない反対と分かる。',
      use: 'I didn’t read it, but I love it.（読んでないけど、気に入った）' },

    // R fix: V2 ("drops the big speech" echoed the stem and signalled the joke). The key is now plain.
    // R fix (2nd review): V2 (blind 70 %: only the key was a jump). "polls the room" → a jump to the schedule (Leslie's
    //   "What's next on the schedule?" comes soon after); "panini" refutes it.
    // why: schedule ← a topic jump caught, the word "panini" lost; comfort ← food offered after
    //   "certain death" read as cheering Leslie up
    // retired: the ear check on its own words: “Who wants a panini?” (captions) / “Who went to Panini?” (whisper)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'panini', seg: [135.05, 139.7],
      stem: 'Right after Andy’s speech, what does his next question do?',
      choices: ['Jumps from his speech to lunch orders', 'Jumps from his speech to the day’s schedule',
                'Offers Leslie food to cheer her up'], a: 0,
      cue: 'certain death のすぐあと、話題がどこへ飛ぶか。',
      line: '…stopping is certain death. *Who wants a panini?* Anyone? Everyone?',
      said: '「止まることは死だ」と熱弁したあと、「パニーニ欲しい人？」と聞く。',
      mean: '生死の話から昼ごはんへ、いきなり話題を変える。熱弁の重さが一気に消えるおかしさ。',
      trap: 'Anyone? Everyone? を賛成の確認と聞きやすい。何が欲しいかを聞いている文。',
      use: 'Okay, enough of that. Who wants coffee?（その話はもういい。コーヒー欲しい人？）', retired: true },

    // R fix: V2 (the key alone named a "no"). All three now start "Uses praise to…". B1: the line shows Ann was the one
    //   for stopping, so it reveals 'ann' too.
    // why: persuading ← flattery heard as a tactic to bring Ann around; agreeing ← a warm preface read as agreement
    //   (the Japanese 前置き frame)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'face', reveals: ['call', 'ann'], seg: [142.75, 149.05],
      stem: 'Before her decision, what does Leslie’s line to Ann do?',
      choices: ['Uses praise to cushion turning Ann down', 'Uses praise to win Ann over to her side',
                'Uses praise to lead into agreeing with Ann'], a: 0,
      cue: '長いほめ言葉のあと、but で何が来るか。',
      line: 'nothing harder… than *saying no to your beautiful face*, *but I’m going to*.',
      said: '「あなたの美しい顔にノーと言うほどつらいことはない。でも言う」とレスリー。',
      mean: '大げさなほめ言葉は、断る前のクッション。but のあとで、はっきり断っている。',
      trap: '温かい前置きは同意に聞こえやすい。but I’m going to で断りと分かる。',
      use: 'I hate to say no, but I must.（断りたくないけど、断らなきゃ）' }
  ]
};
