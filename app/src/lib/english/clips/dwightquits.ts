// REVIEW 2026-11-16: pass 5, fix 14, drop 1, new 0; ear checks 1
// Open: s1 kept although a fan of the show knows the "some of you" line; its four choices are honest near sounds.
// “Dwight Quits Dunder Mifflin - The Office US” (the official The Office channel, BEST OF SEASON 3): Dwight makes a
// grand resignation speech to the office, then coworkers and Dwight himself comment to the camera.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈109 s; after that only music (whisper
// loops one invented line from 109 s). Both sources drop the "I" in "May (I) have your attention" (5.3 s), so no item
// uses it. Left out on purpose: the talking head at 56–64 s (who is speaking is unclear, and its point is an insult),
// the hummed tune at 48 s and 64 s, the visual gag at 74–79 s, and "Dwight? From sales?" (92 s: the speaker, and
// whether the next line is the same person's, can't be settled from the words).
// EAR CHECK: 86.6 s nt2 — the stress in “Not by me so much” falls on “me” (contrast with the others), not “much”
//   (ship only once confirmed)
import type { Clip } from '../types.ts';

export const dwightquits: Clip = {
  id: 'dwightquits', video: 'HobCfJyEm9o', title: 'Dwight Quits Dunder Mifflin',
  dur: 151, wpm: 168, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): "meeting room" was a filler and the key held "listen" (≈ attention). Now the apology
    //   reading (お忙しいところすみません) and a request for help.
    // why: apology ← the Japanese frame: "This will only take a moment" read as sorry-for-interrupting; help ← "take a
    //   moment of your time" heard as asking for people's time to help
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'attention', reveals: ['moment'], seg: [4.8, 10.8],
      stem: 'What is Dwight doing with his first two lines?',
      choices: ['Quieting the whole room before he makes a speech', 'Apologizing for interrupting everyone’s work',
                'Asking people to stop and help him with a task'], a: 0,
      cue: '最初の please と、2文目の time。',
      line: '… *your attention*, please. This will only take *a moment of your time*.',
      said: '「ご注目ください。少しだけお時間をいただきます」と、皆に呼びかける。',
      mean: '発表の前の決まった前置き。皆の手を止めさせて、聞く態勢を作っている。',
      trap: 'お詫びや手伝いの頼みに聞こえやすいが、求めているのは注目だけ。前置きのあとに本題。',
      use: 'Could I have everyone’s attention, please?（皆さん、ご注目ください）' },

    // R fix: V2 (blind 60 %): "a short joke, then an angry complaint" was a filler. Now two near misses: the usual
    //   order (news, then a grand goodbye) and the right build-up with the wrong ending (tearful).
    // why: plain first ← "In other words, I'm quitting" is the line everyone remembers, so it seems to come first;
    //   tearful ← "It's been a pleasure… I will not forget" heard as the emotional close
    { id: 'g1', skill: 'gist', level: 'B2', point: 'speech', seg: [4.8, 46.3],
      stem: 'How does Dwight’s speech get to its point?',
      choices: ['A long, grand build-up, then plain words', 'Plain news first, then a long, grand goodbye',
                'A long, grand build-up, then a tearful goodbye'], a: 0,
      cue: '最後の短い一文と、その前の長さの違い。',
      said: '会社への愛、家族、未知への挑戦、別れの言葉と大げさに語り、最後に一言でまとめる。',
      mean: '長く芝居がかった前置きのあと、普通の言葉で用件を言い直す流れ。',
      trap: '最後の一言が印象に残るので、最初に言ったように思いやすい。順番を追って聞く。',
      use: 'Long story short, I’m moving.（要するに、引っ越すんだ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'moment', seg: [8.1, 10.8],
      stem: 'Type the end of his line: “This will only take ___.” (5 words)', answer: 'a moment of your time',
      cue: 'only take のあと、最後まで。',
      line: 'This will only take *a moment of your time*.',
      said: '「少しだけお時間を」と言う。moment of は「モーメンタヴ」。',
      mean: 'a moment of your time ＝ ほんの少しのお時間。前置きの決まった言い方。',
      trap: 'of と your が弱く、語数が少なく聞こえやすい。5語を数えて書く。',
      use: 'Do you have a moment?（ちょっといいですか）' },

    // R fix: K2: "a better job is lined up" isn't refuted by the clip's words. Now "glad to get away", the opposite
    //   direction, which "love this company" and "that dream was shattered" refute. Ear check removed: "today, that
    //   dream was shattered" ties the talking head to the man who left today.
    // why: family needs him ← the stated reason taken at face value; glad to go ← "I do not fear the unknown… I will
    //   succeed" heard as relief at leaving
    // anchor: 12.8–15.5 s "Although I love this company more than almost anything in the world"; 100.9–108.9 s "One of my
    //   life goals was to die right here, in my desk chair. And today, that dream was shattered."
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'family', reveals: ['chair'], seg: [12.3, 20.25], retired: true,
      stem: 'When Dwight says he will spend more time with family, what is he not saying?',
      choices: ['That he never wanted to leave at all', 'That his family really needs him at home',
                'That he is glad to get away from here'], a: 0,
      cue: '最初の Although の文と、のちのカメラへの一言。',
      line: 'Although I *love this company more than almost anything*… I have decided to step down… and spend more time with my family.',
      said: '「この会社を何より愛しているが、職を退いて家族と過ごす」と言う。',
      mean: '「家族との時間」は辞めるときの決まった口実。のちに「机で死ぬのが夢だった、それが砕けた」と本音が出る。',
      trap: '理由を言葉どおりに受け取りやすい。Although で始まる愛着と、のちの本音を合わせて聞く。',
      use: 'I’m leaving to pursue other interests.（ほかの道に進むため退職します）' },

    // R fix: V2 (blind 50 %): the key was the stock resignation reason beside two inventions. The distractors now use
    //   words he says next ("new challenges", "those who doubt me").
    // why: new challenges ← "my new challenges" said right after, heard as the reason; doubters ← "those who doubt me"
    //   heard as people he is escaping
    { id: 'd1', skill: 'detail', level: 'B1', point: 'family', seg: [15.7, 20.25],
      stem: 'What reason does Dwight give for leaving?',
      choices: ['To spend more time with his family', 'To take on new challenges elsewhere', 'To get away from those who doubt him'], a: 0,
      cue: '「my post」のあと、and に続く部分。',
      line: 'I have decided to step down from my post and *spend more time with my family*.',
      said: '「職を退き、家族と過ごす時間を増やすことにした」と言う。',
      mean: 'spend time with ～ ＝ 〜と過ごす。辞める理由として家族を挙げている。',
      trap: '後の new challenges で転職に聞こえやすい。理由は and の後に言っている。',
      use: 'I want to spend more time with my kids.（子どもともっと過ごしたい）' },

    // R drop: f1 (step down). V2/V1: the title "Dwight Quits" answers it (blind 70 %); a register rewrite would
    //   repeat g1's "grand build-up". Never shipped, deleted.

    // R fix: V2 (blind 65 %): the key said "prove people wrong", d4's distractor, and "sad, hoping to be stopped" is
    //   arguably true of him (the chair talking head). Now nervous / humble as the misreadings.
    // why: nervous ← a slow, careful delivery heard as nerves held in check; humble ← "It's been a pleasure working
    //   with…" comes next, heard as modest thanks
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'fear', seg: [20.0, 28.95],
      stem: 'As Dwight talks about what comes next, how does he present himself?',
      choices: ['Bold, as if nothing in the world could stop him', 'Nervous, but working hard to sound calm',
                'Humble, thankful to those who helped him'], a: 0,
      cue: 'I will で始まる文がいくつ続くか。',
      line: 'I do *not fear the unknown*. I will meet my new challenges head-on, and *I will succeed*',
      said: '「未知は恐れない。挑戦に立ち向かい、成功し、疑う者を笑ってやる」と続ける。',
      mean: 'I will を重ねて、強気で堂々とした自分を見せている。',
      trap: '話し方は緊張に、次の感謝は謙虚に聞こえやすい。中身は強気の宣言ばかり。',
      use: 'Bring it on.（かかってこい）' },

    // R fix: V2 (blind 65 %): "planning slowly" was a filler. Now both distractors read "head" literally (頭 / 先頭).
    // why: think it through ← "head" read as 頭, using his head; lead the way ← "head" read as 先頭・リーダー
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'headon', seg: [21.4, 24.45],
      stem: 'How does Dwight say he will meet his new challenges?',
      choices: ['By facing them straight on', 'By thinking them through first', 'By leading the way for others'], a: 0,
      cue: 'challenges のすぐあとの2語。',
      line: 'I will meet my new challenges *head-on*',
      said: '「新しい挑戦に、真正面から立ち向かう」と言う。',
      mean: 'head-on ＝ 真正面から、逃げずに。車の正面衝突（head-on crash）にも使う。',
      trap: 'head を「頭・トップ」と取ると「先頭に立つ」に聞こえる。head-on は向き合い方。',
      use: 'Let’s deal with it head-on.（正面から向き合おう）' },

    // why: prove wrong ← the usual "I'll prove them wrong" ending to a speech like this; forget ← "I will not forget"
    //   comes right after, so the verb slips forward
    { id: 'd4', skill: 'detail', level: 'B1', point: 'doubt', seg: [25.3, 28.95],
      stem: 'What does Dwight say he will do to those who doubt him?',
      choices: ['Laugh in their faces', 'Prove them all wrong', 'Forget them quickly'], a: 0,
      cue: 'and I will のあとの動詞。',
      line: 'and I will *laugh in the faces* of those who doubt me.',
      said: '「自分を疑う者たちを、面と向かって笑ってやる」と言う。',
      mean: 'laugh in someone’s face ＝ 相手の目の前であざ笑う。強い挑戦の言葉。',
      trap: 'この種の演説は「見返してやる」で終わることが多いが、実際の動詞は laugh。',
      use: 'They laughed in my face.（面と向かって笑われた）' },

    // why: all ← the set phrase "working with all of you" fills the gap; most / each ← short words before "of you" that
    //   blur at speed
    { id: 's1', skill: 'sound', level: 'B2', point: 'some', seg: [28.55, 31.6],
      stem: 'Fill the gap: “It’s been a pleasure working with ___.”',
      choices: ['some of you', 'all of you', 'most of you', 'each of you'], a: 0,
      cue: 'with の直後、of you まで。',
      line: 'It’s been a pleasure working with *some of you*',
      said: '「何人かとは楽しく働けた」と言う。some of は「サマヴ」とつながる。',
      mean: 'some of you ＝ 何人か。全員ではない、と言っている。',
      trap: 'all of you が決まり文句なので耳が引かれやすい。母音「ア」と m の音で判断。',
      use: 'Some of you have met Sarah.（何人かはサラに会ってますね）' },

    // R fix: V2 (blind 65 %): "people who have already left" was a filler. Now "the ones who doubted him", a phrase
    //   said just before, in the wrong relation.
    // why: doubters ← "those who doubt me" said just before, heard as the people he thanks; forgets names ← "I will not
    //   forget those of you" heard as a slip about names
    { id: 'h1', skill: 'humor', level: 'C1', point: 'some', seg: [28.55, 33.8],
      stem: 'Why does Dwight’s farewell thanks get a laugh?',
      choices: ['He thanks only part of his coworkers', 'He thanks the coworkers who doubted him', 'He mixes up his coworkers’ names'], a: 0,
      cue: 'working with のあと、of you の前の一語。',
      line: 'It’s been a pleasure working with *some of you*',
      said: '別れのあいさつで「何人かとは、楽しく働けました」と言う。',
      mean: '決まり文句は all of you。some にすると「ほかの人とは楽しくなかった」になる。',
      trap: '決まり文句を知っていると all と聞いてしまいやすい。小さな一語で意味が変わる。',
      use: 'Thanks, everyone. It’s been a pleasure.（皆さん、ありがとう。楽しかったです）' },

    // R fix: V2 (blind 55 %): "corrects something" was weak. Now "takes back the big claims" (a plain line after a grand
    //   one heard as backing down).
    // why: new reason ← "In other words" heard as adding another point; takes back ← "other" heard as "something else
    //   instead", and the plain line sounds like backing down from “we all shall fall”
    { id: 'm1', skill: 'marker', level: 'B2', point: 'words', seg: [33.8, 46.3],
      stem: 'After the line about everyone falling, what does Dwight’s next phrase do?',
      choices: ['It restates the news in plain words', 'It adds one more reason for leaving', 'It takes back the big claims he made'], a: 0,
      cue: '長い間のあと、文の最初の3語。',
      line: '*In other words*, I’m quitting.',
      said: '「今日は私だが、いずれ皆倒れる」のあと、「つまり、辞めます」と言う。',
      mean: 'In other words ＝ 言いかえると。大げさな話を一言の普通の言葉にまとめる。',
      trap: 'other を「別の」と取ると、新しい話や訂正に聞こえる。前の話を言い直す合図。',
      use: 'In other words, we’re out of time.（要するに、時間切れです）' },

    // R fix: V2 (blind 55 %): "not sure" was a filler. Now "happy for Dwight", the right word aimed at the wrong target.
    // why: sorry ← "gone" heard as sad news; happy for him ← "totally awesome" heard as about his new start, not his
    //   leaving
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'awesome', seg: [51.9, 56.5],
      stem: 'How does the first coworker feel about Dwight leaving?',
      choices: ['Openly happy to see him go', 'Quietly sorry to see him go', 'Happy for Dwight and his new start'], a: 0,
      cue: 'which is のあとの2語。',
      line: 'Dwight is now gone, which is *totally awesome*.',
      said: 'カメラに「Dwight はもういない。最高だね」と言う。',
      mean: 'totally awesome ＝ 最高。いなくなったことを喜んでいる。',
      trap: 'gone だけ聞くと寂しい知らせに思えやすい。which のあとに話し手の評価が来る。',
      use: 'No more meetings, which is great.（会議がなくなって最高）' },

    // R fix: V2/K6 (blind 65 %): the absolutes ("All", "Most… shocked") were only in the distractors. All three now
    //   say "most…; one…" and differ in direction.
    // why: most sad ← "Dwight will be missed" and "such a nice guy" heard as the main mood; most praise ← the one strong
    //   compliment ("most honorable and efficient") taken as everyone's view
    { id: 'g2', skill: 'gist', level: 'B2', point: 'react', seg: [51.9, 100.5],
      stem: 'Overall, how do the comments to the camera react to the news?',
      choices: ['Most are glad or cool; one praises him', 'Most are sad; one is glad he’s gone',
                'Most praise him; one is glad he’s gone'], a: 0,
      cue: '一人ずつ、喜んでいるか惜しんでいるか。',
      said: '「いなくなって最高」「惜しまれるだろう、私以外に」と続き、ほめる声は一つだけ。',
      mean: '辞めた同僚を惜しむ場面のはずが、ほとんど誰も惜しんでいない。',
      trap: '強いほめ言葉が一つあると、全体がそうだと思いやすい。一人ずつの評価を数える。',
      use: 'Nobody seemed too upset about it.（誰もそんなに気にしてなかった）' },

    // why: family ← "family" from the speech, the natural heir; the company ← the belongings sound like office property
    { id: 'd2', skill: 'detail', level: 'B1', point: 'belong', seg: [67.3, 74.5],
      stem: 'Who is to get the rest of Dwight’s belongings?',
      choices: ['Michael Scott', 'His family', 'The company'], a: 0,
      cue: 'belongings のあと、to に続く名前。',
      line: 'I would like to give the rest of my belongings *to Michael Scott*.',
      said: '「残りの持ち物は Michael Scott に譲りたい」と言う。',
      mean: 'belongings ＝ 持ち物。遺言のようなかしこまった言い方をしている。',
      trap: '演説で family と言ったので家族に聞こえやすい。to のあとの名前を聞く。',
      use: 'Please keep your belongings with you.（お荷物はお手元に）' },

    // R fix: V2 (blind 70 %): the key was the only two-part answer. Now a mirror pair (others more / the speaker more)
    //   plus "nobody". V5: B2 → C1 (the stance is implied by "not by me so much, but…", never stated).
    // why: speaker more ← "Dwight will be missed" heard alone, as a warm send-off; nobody ← "Not by me" heard as "not by
    //   anyone"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'missed', seg: [83.3, 91.2],
      stem: 'What does the speaker suggest about who will miss Dwight?',
      choices: ['Others will miss him more than the speaker', 'The speaker will miss him more than others',
                'Nobody, the speaker included, will miss him'], a: 0,
      cue: 'Not のあとの言葉と、but のあと。',
      line: 'Dwight will be missed. *Not by me so much*, *but he will be missed*.',
      said: '「Dwight は惜しまれるだろう。私はそれほどでもないが、惜しまれる」と言う。',
      mean: '自分は別だと言いつつ、ほかの誰かは惜しむだろう、と認めている。',
      trap: 'Not だけ拾うと「誰も惜しまない」に広げやすい。but のあとで他の人は惜しむと言う。',
      use: 'Not my favorite, but it’s okay.（好みではないけど、悪くない）' },

    // R fix: V2 (blind 70 %): "On missed: the loss is what matters" was weak. Now "not" (a flat no) and "much" (a little)
    //   are both real stress readings; only "me" fits the "but" that follows.
    // why: on "not" ← a flat denial is the usual stress for "not by…"; on "much" ← "not… so much" heard as a softener on
    //   the amount
    // anchor: 83.8–90.6 s "Dwight will be missed. Not by me so much, but he will be missed": the "but" sets the speaker
    //   against everyone else
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'missed', seg: [83.3, 91.2], retired: true,
      stem: 'Where is the stress in “Not by me so much”, and why?',
      choices: ['On “me”: others will miss him more than I', 'On “much”: I’ll miss him, just not a lot',
                'On “not”: I won’t miss him at all'], a: 0,
      cue: '短い句で、いちばん強く長く聞こえる語。',
      line: 'Dwight will be missed. Not by *me* so much, but he will be missed.',
      said: '「惜しまれるだろう。私はそれほどでもないけど」と言う。me が強く聞こえる。',
      mean: 'me を強めると「ほかの人は惜しむが、私は別」という対比。日本語の「私は」の「は」に近い。',
      trap: 'much を強めると「少しは惜しむ」の話になる。but の後で他の人と比べているので、対比の me。',
      use: 'You might like it. I don’t.（君は好きかもね。私は違う）' },

    // why: honest ← "honorable" and "honest" share the first sound; loyal ← the usual praise for a long-time employee
    { id: 'd3', skill: 'detail', level: 'B2', point: 'honor', seg: [95.3, 100.5],
      stem: 'How is Dwight described in the comment that praises him?',
      choices: ['Honorable and efficient', 'Honest and hard-working', 'Loyal and friendly'], a: 0,
      cue: 'the most のあとの2つの形容詞。',
      line: 'one of the most *honorable and efficient* employees this company has ever had.',
      said: '「この会社で最も立派で、仕事のできる社員の一人」とほめる。',
      mean: 'honorable ＝ 立派な。efficient ＝ 手際がよい、能率的。',
      trap: 'honorable と honest は出だしが同じで混ざりやすい。h は読まず「オナラブル」。',
      use: 'She’s one of the most efficient people I know.（彼女は一番手際のいい人の一人）' },

    // R fix: V2 (blind 65 %): "retire early" and "promoted" were weak beside a key h3's stem gave away. All three are now
    //   about this desk. The stem no longer names Dwight, so no speaker ear check is needed.
    // why: retire ← "life goals" heard as plans for the end of a career; move up ← "goals" heard as career goals
    { id: 'i2', skill: 'infer', level: 'C1', point: 'chair', seg: [100.4, 109.4],
      stem: 'From the comment about a desk chair, what had the speaker planned?',
      choices: ['To stay at this desk until the very end', 'To retire from this desk with honor', 'To move up from this desk someday'], a: 0,
      cue: 'to die のあと、どこで、と言っているか。',
      line: 'One of my life goals was *to die right here, in my desk chair*.',
      said: '「人生の目標の一つは、この机の椅子で死ぬことだった」と言う。',
      mean: '死ぬまでこの職場にいるつもりだった、ということ。辞めたくなかった気持ちが分かる。',
      trap: 'life goals から引退や昇進を想像しやすい。場所の言葉 right here が手がかり。',
      use: 'I could stay here forever.（ここにずっといられる）' },

    // R fix: V2 (blind 70 %): both distractors were weak. Now "quitting as a dream come true" (dream heard without
    //   "shattered") and the literal broken chair. The stem no longer names Dwight.
    // why: dream come true ← "life goals… today, that dream" heard without "shattered"; broken chair ← "shattered"
    //   taken literally, as the chair breaking
    { id: 'h3', skill: 'humor', level: 'C1', point: 'chair', seg: [100.4, 109.4],
      stem: 'What makes the comment about a desk chair funny?',
      choices: ['He speaks of dying at work as a lost dream', 'He speaks of quitting as a dream come true',
                'He speaks of his chair as if it had broken'], a: 0,
      cue: '前半の life goals と、最後の一語。',
      line: 'One of my *life goals* was to die right here, in my desk chair. And today, that *dream was shattered*.',
      said: '「この椅子で死ぬのが人生の目標だった。今日その夢が砕けた」と語る。',
      mean: '普通なら悪い話を「夢」と呼んでいる。仕事へのこだわりの強さがおかしい。',
      trap: 'shattered を文字どおり「割れた」と取ると椅子が壊れた話になる。夢が壊れた、の意味。',
      use: 'My dream of a quiet weekend was shattered.（静かな週末の夢が砕けた）' },
  ]
};
