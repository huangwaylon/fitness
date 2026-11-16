// REVIEW 2026-11-16: pass 5, fix 13, drop 0, new 0; ear checks 1
// Open: d3 still leans on "birthday → age" for a blind reader (≈ 45 %); a2 and h1 start at 33.0 s so they don't
//   cut "drug" (the 29–33 s racial joke stays out of every segment).
// “It's Birthday Month - The Office US” (the official The Office channel, Best of Season 4): a coworker lists the
// month's birthdays, and Jim proposes one shared party, then explains to camera what Michael's parties are like.
// Segments from the captions, words from whisper (2026-11-16). Talk runs ≈ 0–62 s; whisper loops after 63 s. Untested:
// 1.8 s (a name: "Creed's is today" / "Cree insisted a"), 8.4 s ("You know what?" / "but"), 29–33 s (the second toast
// example, a racial joke), 39–42 s ("He only sings the" / "you only sing with a").
// EAR CHECK: 8.4 s — the man with the idea (and the talking head) is assumed Jim; stems name him, no key depends on it
import type { Clip } from '../types.ts';

export const birthdayMonth: Clip = {
  id: 'birthdaymnth', video: 'OkNeI9HwfHc', title: 'It\'s Birthday Month - The Office US',
  dur: 85, wpm: 203, band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind-guessable (V2): the distractors weren't about the office parties at all. Now built on "shared" and
    //   "Michael usually goes with…".
    // why: split the cost ← "shared" heard as sharing the bill; help Michael ← "Michael usually goes with…" + "I have
    //   an idea" heard as an offer to help him
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', reveals: ['shared'], seg: [0, 62.8],
      stem: 'What is Jim trying to do in this scene?',
      choices: ['Replace many parties with just one', 'Have everyone split the cost of parties',
                'Help Michael with the parties'], a: 0,
      cue: 'I have an idea のあとと、最後のまとめの一言。',
      said: '今月は誕生日が続くと聞き、まとめて一回のパーティーにしようと言う。',
      mean: '何度もある会を一回に減らして、仕事を進めたい。',
      trap: 'shared を「割り勘」と取りやすいが、ここは一回にまとめる意味。share が出たら何を分けるかを聞く。',
      use: 'Let’s do it all at once.（全部まとめて一度にやろう）' },

    // R fix: the title answered it (V2, GUIDE §9.4) and "Michael plans all the parties" was a filler. The new distractor
    //   is the office-wide monthly party that Jim only proposes later. The stem no longer assumes the speaker is a woman.
    // why: one party ← "birthday month" read as the office's monthly party (Jim's later idea); own birthday ← "birthday
    //   month" heard as "my birthday month"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'month', seg: [0, 6],
      stem: 'What does the opening line of the scene mean?',
      choices: ['Several birthdays come up this month', 'The office has one party for the month',
                'This month is the speaker’s own birthday'], a: 0,
      cue: '最初の一文のあとに続く、名前の並び。',
      line: '*It’s birthday month.*',
      said: '「誕生日の月よ」と言い、何人もの誕生日の日付を続けて挙げる。',
      mean: '誕生日がこの月に集中している、という意味。あとの名前の並びがその説明。',
      trap: 'birthday month だけだと自分の誕生月や月一回の会に聞こえるが、後ろで別々の日付を次々挙げている。',
      use: 'It’s wedding season again.（また結婚式シーズンだね）' },

    // why: week after next ← said just before, for someone else; today ← the first birthday on the list
    { id: 'd1', skill: 'detail', level: 'B1', point: 'meredith', seg: [1.45, 6],
      stem: 'When is Meredith’s birthday?',
      choices: ['At the end of the month', 'The week after next', 'Today'], a: 0,
      cue: '最後に挙がる名前のあと。',
      line: 'Meredith’s is *at the end of the month*.',
      said: '「Meredith のは月末」と言う。',
      mean: 'Meredith’s のあとに birthday が省かれている。誕生日は月末。',
      trap: '直前に week after next が別の人の分として出る。名前と日付をセットで聞く。所有の ’s のあとが省略。',
      use: 'Mine is at the end of the month.（私のは月末です）' },

    // R fix: "says he has an idea" in the stem gave the key away (V2/S1). The stem now names the moment, and the
    //   distractors are the literal "why" and Jim's later criticism.
    // why: never done ← "why" taken literally; complaint ← "why don't" heard as frustration about the parties
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'whydont', reveals: ['shared'], seg: [5.95, 12.25],
      stem: 'Right after the list of birthdays, what does Jim’s question do?',
      choices: ['It puts forward a new plan', 'It asks why it was never done', 'It complains about Michael'], a: 0,
      cue: 'I have an idea の直後、Why で始まる文。',
      line: 'I have an idea. *Why don’t we just* do one big shared party?',
      said: '「考えがある。みんなで一回、大きなパーティーをしない？」と言う。',
      mean: 'Why don’t we ～? は「～しようよ」という提案。理由を聞いているのではない。',
      trap: 'Why を文字通り取ると理由の質問になる。we が付いたら、まず誘いや提案と考える。',
      use: 'Why don’t we grab lunch?（お昼食べに行かない？）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'shared', reveals: ['whydont'], seg: [9.1, 12.25],
      stem: 'Type Jim’s idea: “Why don’t we just do ___?” (4 words)', answer: 'one big shared party',
      cue: 'just do のあと、最後の4語。',
      line: 'Why don’t we just do *one big shared party*?',
      said: '「みんなで一回、大きな合同パーティーをしない？」と言う。',
      mean: 'shared ＝ みんなで分け合う。全員分をまとめた一回のパーティー。',
      trap: 'big と shared がつながり、shared の d も消えやすい。「ビッシェアパーリィ」のように聞こえる。',
      use: 'Let’s get one big pizza to share.（大きいピザを1枚頼んで分けよう）' },

    // R fix: blind-guessable (V2). "Which coworkers…" was the other speaker's lines, not Jim's. The distractors are now
    //   a fond reading of his list and his own idea. Added `toasts` to reveals: the key also answers a2 (N7).
    // why: staff love them ← a calm list of cake, balloons and "a big believer" heard as praise; how it would work ←
    //   "one big shared party" from just before, taken as the topic
    { id: 'g2', skill: 'gist', level: 'B1', point: 'problem', reveals: ['thirteen', 'often', 'fault', 'toasts'],
      seg: [12.8, 62.8],
      stem: 'What is Jim mostly explaining to the camera?',
      choices: ['Why Michael’s parties are a problem', 'Why the staff love Michael’s parties',
                'How the shared party would work'], a: 0,
      cue: '13人の話から最後まで、全体の流れ。',
      said: '年13回の会、困った乾杯、歌、サプライズ好きを順に話す。',
      mean: 'Michael の誕生日会の困った点を説明している。',
      trap: 'cake や big believer で楽しい話に聞こえるが、horrible や to a fault で困りごととして挙げる。',
      use: 'Here’s the problem with that.（それの困ったところはね）' },
    // why: thirty ← -teen/-ty; three ← "thir-" caught without its ending
    { id: 'n1', skill: 'number', level: 'B1', point: 'thirteen', seg: [12.8, 16.1],
      stem: 'How many people work in the office?',
      choices: ['Three', 'Thirteen', 'Thirty'], a: 1, keep: true,
      cue: 'There are のすぐあと、people の前の数。',
      line: 'There are *thirteen people* working in this office',
      said: '「この職場には13人が働いている」と言う。',
      mean: '人数がそのまま一年のパーティーの数になる、という話の前置き。',
      trap: 'thirteen は後ろの teen が強く長い。thirty なら前が強く、ty は短く「ディ」に近い。',
      use: 'There are thirteen of us.（私たちは13人です）' },

    // R fix: blind-guessable (V2). The distractors (spending, forgetting) had no hook in the audio. They're now a kind
    //   reading of "13 times" and the head count.
    // why: cares ← a party for every one of the 13 heard as kindness; too big ← "13 people working in this office"
    //   taken as the point
    { id: 'i1', skill: 'infer', level: 'B2', point: 'often', reveals: ['thirteen'], seg: [12.8, 25],
      stem: 'Why does Jim point out how many times a year this happens?',
      choices: ['To show how often work stops for a party', 'To show how much Michael cares about everyone',
                'To show the office has grown too big'], a: 0,
      cue: 'so のあとに続く、毎回やることの並び。',
      line: 'so *thirteen times a year*, Michael gets a cake and balloons…',
      said: '13人いるから年に13回、ケーキや風船、冗談のプレゼントと乾杯がある、と話す。',
      mean: '回数を強調して、それだけ仕事が止まると言いたい。',
      trap: '全員を祝うので優しさの話にも聞こえるが、強調しているのは回数。数字の直後に注目。',
      use: 'That’s twelve meetings a year!（年に12回も会議だよ）' },

    // R fix: seg started 0.1 s before "some" (S4), now 0.5 s before. "makes his toast" swapped for the closer
    //   article sound "the".
    // why: makes toast ← the weak "a" lost (toast = bread); makes the toast ← the weak vowel filled in as "the"
    { id: 's1', skill: 'sound', level: 'B2', point: 'toast', seg: [20.6, 25],
      stem: 'Fill the gap: “…some sort of joke gift and ___.”',
      choices: ['makes a toast', 'makes toast', 'makes the toast'], a: 0,
      cue: 'joke gift のあと、文の最後の短い部分。',
      line: 'and some sort of joke gift and *makes a toast*.',
      said: '「冗談のプレゼントを渡して、乾杯のあいさつをする」と言う。',
      mean: 'a toast ＝ 乾杯のスピーチ。a が「ア」と弱く、makes にくっつく。',
      trap: 'a を落とすと makes toast ＝ パンを焼く、になる。弱い a の有無で意味が変わる。',
      use: 'Let’s make a toast to Ken!（ケンに乾杯しよう）' },

    // why: three ← "the other" heard as a third kind; one ← "a toast" taken as a single kind
    { id: 'n2', skill: 'number', level: 'B1', point: 'twotypes', seg: [24.9, 29],
      stem: 'How many kinds of toasts does Jim say Michael makes?',
      choices: ['One', 'Two', 'Three'], a: 1, keep: true,
      cue: 'And there are のあと、types の前。',
      line: 'And there are *two types* of toasts.',
      said: '「乾杯のあいさつには2種類ある」と言う。',
      mean: 'このあと One is ～ と the other is ～ で、2つを順に説明していく。',
      trap: 'two と to は同じ音で聞き流しやすい。One is と the other is も2つの印。',
      use: 'There are two kinds of people.（人には2種類いる）' },

    // R fix: "family" was a filler and "age" was common sense for a birthday (V2). The distractors are now a near
    //   reading of "how old" (time on the job) and a personal-teasing reading.
    // why: been there ← "how old" heard as "how long"; habits ← "a joke about… you" heard as personal teasing
    { id: 'd3', skill: 'detail', level: 'B1', point: 'agejoke', seg: [24.9, 29],
      stem: 'What is the first kind of toast about?',
      choices: ['How old the person is getting', 'How long the person has been there',
                'What bad habits the person has'], a: 0,
      cue: 'One is のあと、joke about に続く部分。',
      line: 'One is *a joke about how old you are*.',
      said: '「一つは、年齢をからかう冗談」と言う。',
      mean: 'how old you are ＝ 何歳か。誕生日に年齢をネタにする定番の冗談。',
      trap: 'how old を「どのくらい古い」と取ると意味がずれる。人について言えば年齢のこと。',
      use: 'No jokes about how old I am!（年の話はなしね）' },

    // R fix: "dryly" vs "angrily" rested on tone (GUIDE §9.7). The choices are now stances the words settle. The stem's
    //   "second kind" implies n2's key, so `twotypes` is in reveals (N7). seg started inside "drug" (S4).
    // why: amused ← a flat delivery and the "Or both" laugh line read as fun; unsure ← "inappropriate or horrible" heard
    //   as him not deciding
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'toasts', reveals: ['twotypes'], seg: [33, 38.6],
      stem: 'How does Jim feel about the second kind of toast?',
      choices: ['Critical; he finds them truly bad', 'Amused; he finds them harmless fun',
                'Unsure; he can’t decide on them'], a: 0,
      cue: 'the other is のあとに並ぶ形容詞。',
      line: 'And the other is *something inappropriate or horrible*.',
      said: '「もう一つは、不適切か、ひどいもの」と言う。',
      mean: '口調は淡々としているが、はっきり困りものだと言っている。',
      trap: '淡々とした言い方は楽しんでいるようにも見えるが、inappropriate も horrible も批判の語。',
      use: 'Honestly, it was kind of horrible.（正直、けっこうひどかった）' },

    // R fix: blind-guessable (V2). The distractors are now the two common misreadings of an afterthought (a softener, a
    //   self-correction). Added `twotypes` to reveals (stem). seg started inside "drug" (S4).
    // why: softens ← a tacked-on phrase read as a Japanese-style softener; corrects ← the pause heard as a speaker
    //   fixing his word
    { id: 'h1', skill: 'humor', level: 'C1', point: 'both', reveals: ['toasts', 'twotypes'], seg: [33, 38.6],
      stem: 'Why is the short add-on after the second kind of toast funny?',
      choices: ['It makes the toasts sound even worse', 'It softens what he just said about Michael',
                'It corrects a word he chose too quickly'], a: 0,
      cue: 'inappropriate or horrible のあと、少し間を置いた一言。',
      line: 'something inappropriate or horrible. *Or both.*',
      said: '「不適切か、ひどいもの」と言ったあと、少し置いて「または両方」と足す。',
      mean: '二択のはずが両方そろうこともある、と付け足して、さらに悪く聞こえるのが笑い。',
      trap: '間のあとの付け足しは、やわらげや言い直しに聞こえやすいが、ここは悪さを足すオチ。',
      use: 'Rain or snow. Or both.（雨か雪。または両方）' },

    // why: by mistake ← "fault" = ミス (katakana フォルト); blames ← "fault" = 責任
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'fault', reveals: ['hedge'], seg: [44.5, 50.9],
      stem: 'At the end of the line about surprise parties, what does Jim mean?',
      choices: ['Michael likes them more than he should', 'Michael gets the surprise wrong by mistake',
                'Michael blames others when they go wrong'], a: 0,
      cue: '並んだ言葉の最後、a のあとの名詞。',
      line: 'Maybe even, arguably, possibly *to a fault*.',
      said: '「もしかすると、度が過ぎるくらいに」と付け足す。',
      mean: 'to a fault ＝ 良いことでも、やりすぎて欠点になるほど。',
      trap: 'fault を「ミス」や「責任」と取ると、失敗や人のせいの話になる。to a fault で一つの句。',
      use: 'She’s generous to a fault.（彼女は気前が良すぎるくらい）' },

    // R fix: the key was the only nuanced, two-part choice (V2/K6), and "To…"/"Because…" weren't parallel (K5). The
    //   choices are now three reasons in one form, with a searching-for-words distractor.
    // why: unsure ← the hedges taken at face value (Japanese 「かもしれない」 as real doubt); searching ← three hedges in
    //   a row heard as hesitation
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'hedge', seg: [44.5, 50.9],
      stem: 'Why does Jim pile up several soft words before his last point?',
      choices: ['He wants a real criticism to sound mild', 'He isn’t sure it’s really a problem',
                'He is searching for the right word'], a: 0,
      cue: '最後の句の前に、似た言葉がいくつ続く？',
      line: '*Maybe even, arguably, possibly* to a fault.',
      said: '「たぶん、ひょっとすると、もしかすると度が過ぎる」とぼかす言葉を重ねる。',
      mean: 'ぼかしすぎて、かえって本音が強く伝わる。遠回しの批判。',
      trap: '日本語の「かもしれない」のように本当の迷いや言葉探しと取りやすい。3つも重ねるのは演技。',
      use: 'It’s maybe, possibly, a little expensive.（ちょっと、まあ、高いかもね）' },

    // R fix: "completely" was an absolute only in a distractor (K6); reworded all three.
    // why: result of the party ← "so" as "therefore" right after the "Happy birthday!" moment; new topic ← a pause and "so"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'so', seg: [57.2, 62.8],
      stem: 'After all his examples, what does Jim’s first word do?',
      choices: ['It wraps up the reasons he gave', 'It tells what the surprise led to',
                'It moves on to a new topic'], a: 0,
      cue: '例を言い終えたあと、最初の短い一語。',
      line: '*So*, I think, yeah.',
      said: '「というわけで、まあ、そういうこと」と言い、最後の意見に移る。',
      mean: 'この So は「だから結論は」。説明を締めくくる合図。',
      trap: 'So を「その結果」と取ると直前の場面の続きに聞こえる。間のあとの So は話のまとめが多い。',
      use: 'So, yeah, that’s my plan.（というわけで、それが僕の計画）' },

    // R fix: "Skip all of them" had an absolute only a distractor had (K6), and "push them later" had no hook. Now "out
    //   of the way" read as out of work's way.
    // why: skip them ← "out of the way" heard as removing the parties; out of work hours ← "out of the way" of work
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'outway', seg: [57.2, 62.8],
      stem: 'In Jim’s last sentence, what does he want to do with the birthdays?',
      choices: ['Deal with them and be done', 'Skip them for this year', 'Move them out of work hours'], a: 0,
      cue: 'getting these のあとに続く句。',
      line: 'I think *getting these out of the way* might be productive.',
      said: '「これを片付けてしまうのが効率的かも」と言う。',
      mean: 'get ～ out of the way ＝ 先に済ませて片付ける。',
      trap: 'out of the way を「どかす・なくす」と取ると中止や時間外の話になる。get ～ がつくと「済ませる」。',
      use: 'Let’s get the dishes out of the way.（先にお皿洗いを済ませよう）' },

    // R fix: "how firm" asked for a stance, not what the words do (V4), and the key was the only two-sided choice. Now
    //   asks what the softeners do.
    // why: change his mind ← "might" + "I think" taken as real doubt (Japanese frame); invite ideas ← a soft ending heard
    //   as an opening for others
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'productive', reveals: ['outway'], seg: [57.2, 62.8],
      stem: 'What do “I think” and “might” do in Jim’s last sentence?',
      choices: ['They soften a view he clearly holds', 'They show he may change his mind',
                'They invite the others to give ideas'], a: 0,
      cue: '提案の中身と、言い方の強さを分けて聞く。',
      line: 'I think getting these out of the way *might be productive*.',
      said: '「片付けてしまうのが、まあ効率的かもしれない」と締める。',
      mean: 'I think と might で柔らかくしているが、言いたいのははっきりした提案。',
      trap: 'might を本当の迷いと取りやすい。英語ではやわらげ言葉が意見の強さを隠すことが多い。',
      use: 'It might be smart to leave now.（もう出た方がいいかも）' },

  ]
};
