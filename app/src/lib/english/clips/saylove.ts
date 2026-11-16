// “The First Time Ross & Rachel Say "Love" | Friends” (the official Friends channel, Best of Season 2): Rachel tells
// Ross she doesn't want everything planned for her; he fires back that he will keep planning, and the fight ends in
// “I love you”.
// Segments from the captions, words from whisper (2026-11-16). Whisper and the captions agree word for word.
// REVIEW 2026-11-16: pass 6, fix 11, drop 0, new 0; ear checks 1
// EAR CHECK: 34.4 s h1 — “Good, cause I love you” keeps the same hard, arguing tone as “tough” (key rests partly on tone); the laugh follows it
import type { Clip } from '../types.ts';

export const saylove: Clip = {
  id: 'saylove', video: 'xmaFIlnrzsQ', title: 'The First Time Ross & Rachel Say "Love"', dur: 53, wpm: 186,
  band: 'mid', tags: ['恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: the key was the only choice about both of them; "scared to commit" was weak. A title-led distractor now (V2/K3)
    // why: Barry ← his name is said, read as the topic; who says it first ← the title, "love" read as the fight's topic
    { id: 'g1', skill: 'gist', level: 'B2', point: 'clash', reveals: ['planning'], seg: [0.3, 34],
      stem: 'What are Rachel and Ross really disagreeing about?',
      choices: ['How much to plan their future', 'Whether Rachel misses Barry',
                'Who should say “I love you” first'], a: 0,
      cue: '二人とも同じ形の言い方で、自分の考えを言う。',
      said: 'レイチェルは先のことを決められたくないと言い、ロスは二人の将来を考え続けると言い返す。',
      mean: '関係そのものではなく、先の予定をどこまで決めるかのぶつかり合い。',
      trap: '元カレの名前や scares が聞こえると、その話に見える。話の芯は何度も出る言葉で見る。',
      use: 'I don’t like having everything planned.（全部決められているのは苦手）' },

    // R fix: the key was the only positive choice (K6/V2); a second "happy" choice now, refuted by "everything decided"
    // why: ending it ← "but" after praise, read as a breakup preface; ready to plan ← "amazing" read as wanting more of it
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'amazing', reveals: ['clash'], seg: [0.3, 7.9],
      stem: 'How does Rachel feel about the relationship itself?',
      choices: ['Happy with it, but wants room', 'Unsure, and thinking of ending it',
                'Happy with it, and ready to plan'], a: 0,
      cue: '「listen」のあと、最初にほめる言葉。そのあとの but。',
      line: 'what we have is *amazing*, but…',
      said: '「今の関係は最高。でも…」と始めて、全部決められるのは嫌だと言う。',
      mean: '関係には満足していて、不満は決められ方だけ。ほめてから本題に入る形。',
      trap: 'ほめ言葉＋but は別れ話の前置きに聞こえやすい。but のあとの中身まで聞いて判断する。',
      use: 'I love it here, but I need space.（ここは好き。でも少し一人の時間が要る）' },

    // why: no plans ← the opposite complaint, "decided" missed; scared ← "scares you" said a few lines later
    { id: 'd1', skill: 'detail', level: 'B2', point: 'barry', seg: [4.6, 12.5],
      stem: 'What does Rachel say was one reason she left Barry?',
      choices: ['Everything was decided for her', 'He never made any plans', 'He was scared of the future'], a: 0,
      cue: '「Barry」の前、自分の人生をどう言うか。',
      line: 'I do not want to have *everything decided for me*… it’s what I had with Barry',
      said: '全部決められるのは嫌、バリーともそうだったから別れた、と言う。',
      mean: 'it’s what I had の it が前の文を指す。二つの文をつなぐと理由が分かる。',
      trap: '名前の近くだけ聞くと理由がつかめない。指す言葉は一つ前の文に戻って考える。',
      use: 'That’s one of the reasons I moved.（それが引っ越した理由の一つ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'wholelife', seg: [7.3, 9.7],
      stem: 'Type what she says: “I spent my ___.” (4 words)', answer: 'whole life like that',
      cue: '「I spent my」のあと、最後の2語はつながる。', line: 'I spent my *whole life like that*.',
      said: '「ずっとそういう人生だった」と過去を言う。',
      mean: 'whole life ＝ これまでの人生全部。like that は前の話を指す。',
      trap: 'like と that がつながり「ライクザッ」と一続きになる。最後の t はほぼ消える。',
      use: 'I’ve lived here my whole life.（生まれてからずっとここに住んでいる）' },

    // why: knowing ← "not" is short and weak before "knowing"; on her own ← "right now" read as "for a while, alone"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'notknowing', seg: [11.8, 14.85],
      stem: 'What does Rachel say she likes right now?',
      choices: ['Not knowing what comes next', 'Knowing where things are going', 'Being on her own for a while'],
      a: 0,
      cue: '「I like」のすぐあと、短い一語に注意。', line: 'I like *not knowing* right now.',
      said: '「今は、先が分からないのがいい」と言う。',
      mean: '先が決まっていない状態を楽しみたい、という気持ち。',
      trap: 'not が短く弱いので knowing だけが耳に残りやすい。動詞の前の小さな否定を聞き落とさない。',
      use: 'I like not having a plan.（予定がないのが好き）' },

    // R fix: the key was the only "stay together" choice and the third was off-topic (V2/K6); both distractors rebuilt
    // why: breaking up ← "if" heard as doubt about the relationship; only if he plans ← "be with me" + Ross's side, reversed
    { id: 'i2', skill: 'infer', level: 'C1', point: 'terms', reveals: ['amazing', 'deal'], seg: [11.9, 19],
      stem: 'What does “if you want to be with me…” suggest Rachel wants?',
      choices: ['To stay together, but on her terms', 'To break up before it gets serious',
                'To stay together if he plans more'], a: 0,
      cue: '「if you want」の文の最後まで聞く。',
      line: 'if you want to be with me, you’re going to have to deal with that.',
      said: '「一緒にいたいなら、受け入れて」と、条件の形で言う。',
      mean: '別れたいのではなく、自分のやり方のまま続けたい、という意味になる。',
      trap: 'if で始まると相手の気持ちを疑っているように聞こえる。if の文のあとに何を求めるかで決める。',
      use: 'If you’re coming, be ready by six.（来たいなら6時までに準備して）' },

    // why: deal ← katakana ディール = 取引; sort it out ← "deal with" = 処理する from the dictionary
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'deal', seg: [14.3, 19],
      stem: 'At the end of that turn, what is Rachel telling Ross he must do?',
      choices: ['Accept it as it is', 'Make a deal with her', 'Sort it out for her'], a: 0,
      cue: '「if you want to be with me」のあと。',
      line: 'if you want to be with me, you’re going to have to *deal with that*.',
      said: '「一緒にいたいなら、それを受け入れて」と言う。',
      mean: 'deal with it ＝ 気に入らなくても受け入れる、という強めの言い方。',
      trap: 'deal を「取引」、deal with を「処理する」と取りやすい。相手が人の性格なら「受け入れる」。',
      use: 'No Wi-Fi? We’ll have to deal with it.（Wi-Fi なし？ 仕方ないね）' },

    // R fix: "gently" made the key the only nuanced choice (K6); each distractor now carries a manner word too
    // why: taking it back ← Japanese すみません read as backing down; asking ← "if" heard as "whether"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'sorry', seg: [14.3, 19],
      stem: 'What is Rachel doing with “I’m sorry if…”?',
      choices: ['Holding her ground, gently', 'Backing down a little, politely', 'Checking, kindly, if he is scared'],
      a: 0,
      cue: '「sorry」のあと、but で何が続くか。',
      line: 'and *I’m sorry if that scares you, but*…',
      said: '「怖がらせたならごめん。でも…」と前置きする。',
      mean: '相手の気持ちに触れつつ、主張は通す形。本当の謝罪ではない。',
      trap: '日本語の「すみません」と同じに聞くと謝っているように取れる。if と but がセットなら主張が来る。',
      use: 'Sorry if that sounds rude, but I’m busy.（失礼に聞こえたらごめん、でも忙しいの）' },

    // R fix: "Ross agrees to stop planning" was the mirror of the other distractor, so the odd one out was the key (V2)
    // why: Rachel plans ← "Fine. I will." heard as agreeing to plan; drop it ← "we're not done" read as a pause in the fight
    { id: 'g2', skill: 'gist', level: 'B2', point: 'accept', reveals: ['planning'], seg: [14.3, 35.55],
      stem: 'How is the disagreement settled?',
      choices: ['Each accepts how the other is', 'Rachel gives in and agrees to plan', 'They agree to drop it for now'],
      a: 0,
      cue: '二人とも、短い同じ一語で相手の条件に答える。',
      line: 'Okay, fine. … *Fine. I will.*',
      said: 'ロスは彼女の条件に「分かった」、彼女はロスの条件に「いいよ」と答える。',
      mean: 'どちらも自分のやり方は変えず、相手のやり方を受け入れて終わる。',
      trap: 'I will を「計画する」と取りやすいが、何を will するのかは直前の文にある。省略は前を見る。',
      use: 'Fine, we’ll do it your way.（いいよ、君のやり方でやろう）' },

    // R fix: "explain her side again" was a filler (K3); now "agreeing, with a small request", from “Okay” + “understand”
    // why: giving in ← "Okay" read as agreement; small request ← "Okay" heard as a yes, "you're going to have to" missed
    { id: 'i1', skill: 'infer', level: 'C1', point: 'mirror', reveals: ['deal'], seg: [23.2, 33.35],
      stem: 'When Ross answers with “Okay, then…”, what is he doing?',
      choices: ['Turning her own words back on her', 'Giving in, so the fight can end',
                'Agreeing, but adding a small request'], a: 0,
      cue: 'レイチェルが少し前に使った言い方と比べる。',
      line: 'Okay, then *you’re going to have to* understand… …you’re going to have to *deal with that*.',
      said: 'ロスは「それなら、君も分かってもらわないと」と、同じ形で自分の条件を言う。',
      mean: '相手の決めぜりふをそのまま返して、対等な立場に立っている。',
      trap: 'Okay を聞くと受け入れたように思えるが、then のあとが反撃の合図。同じ言い方の繰り返しに気づく。',
      use: 'Okay, then here’s my side.（じゃあ、こっちの言い分も聞いて）' },

    // R fix: g1's theme made "planning" the only on-topic choice (V2); a distractor now shares "plan" in the wrong relation
    // why: telling her ← "understand" heard as him explaining feelings; asking her to plan ← "with you" in the wrong relation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'planning', seg: [23.2, 30.1],
      stem: 'What does Ross say he isn’t going to stop doing?',
      choices: ['Planning his future with her', 'Telling her how he feels', 'Asking her to plan with him'], a: 0,
      cue: '「stop」のすぐあとの動詞。',
      line: 'a guy who’s not going to stop *planning his future* with you',
      said: '「将来の計画をやめない男なんだ」と自分のことを言う。',
      mean: 'a guy who’s… は自分のことを外から言う形で、強く言い切るときに使う。',
      trap: 'not going to stop の否定が二重に聞こえて混乱しやすい。stop のあとの動詞を確かめる。',
      use: 'I’m not going to stop trying.（あきらめないよ）' },

    // why: afraid of breaking up ← "end" heard alone as 終わる; she wants it ← he plans, so it must please her
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'endup', reveals: ['planning'], seg: [25.6, 30.15],
      stem: 'What reason does Ross give for planning ahead?',
      choices: ['He’s sure they’ll be together in the end', 'He’s afraid they’ll break up in the end',
                'He thinks Rachel wants him to plan'], a: 0,
      cue: '「because he knows」のあと。',
      line: 'because he knows we’re going to *end up together*',
      said: '「最後は一緒になるって分かってるから」と理由を言う。',
      mean: 'end up ＝ 結局〜になる。end（終わる）とは違い、行き着く先を言う。',
      trap: 'end が聞こえると「終わる、別れる」と取りやすい。end up のあとの語で行き先が決まる。',
      use: 'We ended up staying an extra night.（結局もう一泊した）' },

    // why: sorry ← Japanese frame (scaring someone calls for an apology); hurt ← "tough" read literally as 大変・厳しい
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'tough', seg: [29.6, 33.4],
      stem: 'When Ross says “if that scares you…”, how does he sound?',
      choices: ['Firm: it’s her problem to handle', 'Sorry: he doesn’t want to scare her',
                'Hurt: he thinks she’s being harsh'], a: 0,
      cue: '「scares you」のすぐあとの一語。',
      line: 'and if that scares you, *tough*',
      said: '「それで怖いなら、知らないよ」と強く言い切る。',
      mean: 'tough ＝ お気の毒さま、こっちは変えない。相手の不満を受け流す強い一言。',
      trap: 'tough を「大変、つらい」と取ると傷ついているように聞こえる。文の頭に一語で来たら突き放し。',
      use: 'You don’t like it? Tough.（嫌でも仕方ないね）' },

    // R fix: the title made the only "love" choice the key (V2); a second choice now names “I love you”. reveals accept: its line shows "Fine. I will."
    // why: admits she was right ← "Fine, I will" read as the fight ending in a win; a joke ← the angry tone heard as not meaning it
    { id: 'h1', skill: 'humor', level: 'C1', point: 'love', reveals: ['accept'], seg: [31.3, 35.55],
      stem: 'Why does the audience laugh at the end of this exchange?',
      choices: ['A love confession comes out like a threat', 'He gives up and admits she was right',
                'He says “I love you” as a joke'], a: 0,
      cue: '「Good」で始まる一言。言い方の強さはどうか。',
      line: 'Fine. I will. — Good, cause *I love you*.',
      said: '「いいよ」「よし、だって愛してるから」と、けんかの調子のまま言う。',
      mean: '告白なのに、けんかの決めぜりふと同じ強い言い方。そのずれが笑いになる。',
      trap: 'Good や Fine は話の終わりに聞こえやすい。笑いの前の一言が、どんな調子で何を言うかを聞く。',
      use: 'Good, because I need your help.（よかった、手を貸してほしいんだ）' },

    // R fix: its line shows "I'm gonna kiss you", d4's key (N7); reveals kiss
    // why: unsure ← "well" as Japanese えーと; disagreeing ← "well" as an objection marker
    { id: 'm1', skill: 'marker', level: 'C1', point: 'well', reveals: ['kiss'], seg: [35.9, 41.8],
      stem: 'Near the end, both keep starting lines with the same word. Why?',
      choices: ['Each line sounds like a comeback', 'Each one is unsure what to say',
                'Each one is still disagreeing'], a: 0,
      cue: '最後の数行の、文頭の短い一語。',
      line: '*Well*, I love you too. … *Well*, I’m gonna kiss you.',
      said: '「じゃあ私も愛してる」「じゃあキスする」と言い返す形で続ける。',
      mean: 'この well は「それならこっちも」の言い返し。言い合いの形で気持ちを伝える。',
      trap: 'well を「えーと」と取ると迷っているように聞こえる。強く短い well は言い返しの合図。',
      use: 'Well, I think you’re wrong.（いや、それは違うと思う）' },

    // R fix: the title ("Ross & Rachel Say Love") gave away "we" (V2); "we're saying" now tests the weak 've and the verb
    // why: we're saying ← "we" kept, the weak 've heard as 're, "said" missed; you've ← "we" and "you" both weak before 've
    { id: 's1', skill: 'sound', level: 'B2', point: 'firsttime', seg: [36.35, 39.65],
      stem: 'Fill the gap: “Well, that’s the first time ___ that.”',
      choices: ['we’ve said', 'we’re saying', 'you’ve said'], a: 0,
      cue: '「first time」のあと、とても弱い短い音。',
      line: 'Well, that’s the first time *we’ve said* that.',
      said: '「これ、二人が初めて言ったね」と気づく。',
      mean: 'we’ve の ’ve はほぼ聞こえず「ウィ」だけに近い。二人とも言ったので we。',
      trap: '弱い ’ve は「ヴ」がほぼ消え、’re と区別しにくい。動詞が said か saying かで時制を決める。',
      use: 'That’s the first time I’ve been here.（ここに来たのは初めて）' },

    // R fix: "Call her" was a filler (K3); "Hug her" is as plausible as the key from the scene alone
    // why: miss ← /k/ and /m/ both short before "you"; hug ← what follows "I love you too" in the usual script
    { id: 'd4', skill: 'detail', level: 'B1', point: 'kiss', seg: [38.6, 41.6],
      stem: 'What does Ross say he’s going to do, at the very end?',
      choices: ['Kiss her', 'Miss her', 'Hug her'], a: 0,
      cue: '最後の「I’m gonna」のあとの動詞。',
      line: 'Well, I’m gonna *kiss you*.',
      said: '「じゃあ、キスするよ」と、これも言い返す調子で言う。',
      mean: 'I’m gonna ＝ これからすぐすること。宣言のように言っている。',
      trap: '短い動詞は最初の音で決まる。kiss の k は息が強く出る。miss の m は口を閉じた音から入る。',
      use: 'I’m gonna grab a coffee.（ちょっとコーヒー買ってくる）' },

  ]
};
