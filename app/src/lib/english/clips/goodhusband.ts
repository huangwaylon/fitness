// “Chris' guide to being a good husband | Parks and recreation” (the official Parks and Recreation channel, Season 6):
// pregnant Ann unloads her complaints on Chris, then on the wine-and-cheese club, who push her out; Tom tells Chris to
// stop fixing her problems and just say "that sucks", and it works.
// Segments from the captions, words from whisper (2026-11-16). Chris names Ann (0.2 s), Ann names Donna (66 s), a friend
// names Chris ("Christopher", 144 s) and Ron names Tom (150 s). The club members at 70–88 s aren't named and no item
// names them; nt1 calls the man advising Chris at 153–176 s "the adviser", so no item rests on who it is. The
// captions have "Wen and cheese club" (134 s) and "that's okay" for "It's okay" (185 s), and both sources have "night
// job" (122 s); no key rests on those words. The nipple-kit stretch (33–60 s) and the bodily lines (112 s, 196–203 s)
// are left untested, and no line quotes them.
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
// REVIEW Q: "night job" (122 s, both sources) is probably "night jog"; p3 doesn't rest on it. Confirm if it matters.
// EAR CHECK: 85.3 s nt2 — in “I don't” right after “I feel bad”, is the stress on “I” (a contrast), not on “don't”? (both sources: “I don't”)
import type { Clip } from '../types.ts';

export const goodHusband: Clip = {
  id: 'goodhusband', video: 'OdA8QNTqn-A', title: 'Chris\' guide to being a good husband', dur: 245, wpm: 177,
  band: 'mid', tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): the key was the only warning; one distractor is now a negative reading too
    // why: answer kindly ← "asked" read literally (you asked, so I'll answer); short with him ← "you asked for it" read as
    //   "you deserve it", so she's cross and curt
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'asked', seg: [1.8, 8.38],
      stem: 'Right before listing her pains, what is Ann telling Chris?',
      choices: ['He kept asking, so he has to hear all of it', 'He asked kindly, so she’ll answer him kindly',
                'He asked rudely, so she’ll be short with him'], a: 0,
      cue: '「all right, man」のあとの短い一言。',
      line: 'All right, man, *you asked for it*.',
      said: '「知りたくないよ」と止めたのに聞かれ、「じゃあ言うね」と前置き。',
      mean: 'you asked for it ＝ 自分で望んだんだから覚悟して。警告のあとの決まり文句。',
      trap: 'asked を「頼み方」と取ると丁寧さの話に聞こえる。警告のあとは「覚悟して」。',
      use: 'You asked for it: here’s the whole story.（聞きたいって言ったよね。全部話すよ）' },

    // why: legs ← "all the way" + her later "my legs really hurt"; stomach ← the very next sentence is about her stomach
    { id: 'd1', skill: 'detail', level: 'B1', point: 'pains', seg: [6.4, 10.95],
      stem: 'How far does Ann say her shooting pains go?',
      choices: ['All the way up to her neck', 'All the way down to her legs', 'All the way across her stomach'], a: 0,
      cue: '「all the way」のあと、上か下か、どこまでか。',
      line: 'shooting pains that go *all the way up*… *to my neck*.',
      said: '「首まで、ずっと上がってくる痛みがある」と言う。',
      mean: 'shooting pain ＝ 走るような鋭い痛み。下から首まで広がる感じ。',
      trap: '次にお腹の話が続くので、お腹を選びやすい。all the way のあとの up と to を聞く。',
      use: 'The line goes all the way to the corner.（列が角までずっと続いてる）' },

    // R fix: V2 (blind 65 %): "mixes up two medical words" was a filler; now a keyword trap on the book's author
    // why: from reading ← "read… book… now I have" heard as cause and effect, dropping "anxiety"; blames the author ←
    //   "Brooke Shields' book" heard as the cause she's pointing at
    { id: 'h1', skill: 'humor', level: 'C1', point: 'prepost', seg: [14.72, 20.7],
      stem: 'What is funny about the new condition Ann says she has?',
      choices: ['She frets over a depression that hasn’t come yet', 'She got a depression just from reading about it',
                'She blames a famous author for her low mood'], a: 0,
      cue: '「now I have」のあと、頭に付いた短い音と最後の語。',
      line: 'Now I have *pre*-postpartum depression *anxiety*.',
      said: '産後うつの本を読んで、「産後うつの前の不安」があると言う。',
      mean: '産後（postpartum）に pre-（前）を付け、まだ来ない病気の心配を病名にした言葉遊び。',
      trap: '本の話のあとなので、本でうつになったと取りやすい。最後の anxiety まで聞く。',
      use: 'I have pre-vacation stress.（休み前のストレスがある）' },

    // R fix: V2 (blind 70 %): reworded so the key isn't the stock "solve problems" phrase the scene's premise gives away
    // why: doctor ← Tylenol + "as nature intended" sound medical; play along ← "Never fear" sounds like a playful hero line
    { id: 'i2', skill: 'infer', level: 'C1', point: 'fix', seg: [20.7, 33.9],
      stem: 'What does Chris’s answer show about how he hears her complaints?',
      choices: ['As a to-do list he can work through', 'As warning signs for a doctor to check',
                'As teasing he should play along with'], a: 0,
      cue: '最後の質問「Is that…?」までの流れ。',
      line: 'Well, *never fear*. I will get you Tylenol… There, *it’s all good*. Is that better?',
      said: '痛み止め、お腹のクリーム、体の変化は自然なこと、と一つずつ答えて「これでいい？」と聞く。',
      mean: '不満の一つ一つに解決策を出して片付けている。',
      trap: '薬や「自然の通り」で医者の話に聞こえるが、答えを出しているのは Chris 自身。',
      use: 'Is that better? Let me know.（これでどう？教えてね）' },

    // R fix: V2 (blind 65 %): the key was the only choice sharing a part with both distractors; now a 2 × 2 grid, so
    //   every part appears twice (4 choices, all strong)
    // why: wine / soft cheese ← the club is a wine and cheese club (129 s), and both are known pregnancy rules
    { id: 'd3', skill: 'detail', level: 'B1', point: 'smoke', seg: [64.6, 72.1],
      stem: 'What does Ann remind Donna she can’t be around?',
      choices: ['Smoke or fatty tuna', 'Wine or fatty tuna', 'Smoke or soft cheese', 'Wine or soft cheese'], a: 0,
      cue: '「can’t be around」のあと、or でつながる2つ。',
      line: 'You know I *can’t be around smoke or fatty tuna*?',
      said: '「煙やトロのそばにはいられないって、知ってるでしょ」と抗議する。',
      mean: '妊娠中なので避けている物を、目の前に出されて怒っている。',
      trap: 'ワインとチーズの会なので wine や cheese を選びやすい。or の前と後を一つずつ聞く。',
      use: 'I can’t be around cats. I’m allergic.（猫のそばはダメ。アレルギーなの）' },

    // R fix: V2 (blind 60 %): "how to fix their work" was weak; distractors are now a keyword trap ("this was funny") and
    //   her own smoke/tuna rule heard as their grievance
    // why: jokes ← "At first, this was funny" heard as her jokes going stale; rules ← her protest about smoke and tuna
    //   heard as rules she imposes on them
    { id: 'g2', skill: 'gist', level: 'B2', point: 'club', reveals: ['vent'], seg: [64.6, 109.7],
      stem: 'Why are the club members fed up with Ann?',
      choices: ['Her complaints have taken over their meetings', 'Her pregnancy rules have changed their menu',
                'Her jokes about work have stopped being funny'], a: 0,
      cue: '「at first」のあとの言い分と、Ann の反論。',
      line: 'This was our chance to vent about work and *you’ve taken it over*.',
      said: '仕事の愚痴の場を Ann に乗っ取られた、と言われ、Ann は「みんな愚痴ってるのに」と返す。',
      mean: '集まりが Ann 一人の愚痴の場になったのが問題。',
      trap: '「面白かった」は Ann の愚痴、煙や魚は Ann の抗議。仲間の不満は場を取られたこと。',
      use: 'Sorry, I didn’t mean to take over.（ごめん、仕切るつもりじゃなかった）' },

    // R fix: V2 (blind 80 %): "celebrate a big day" was a filler; both distractors now come from words said nearby
    // why: liven up ← "At first, this was funny" heard as the old club getting dull; vent ← "our chance to vent about
    //   work" heard as the purpose of the change
    { id: 'i3', skill: 'infer', level: 'C1', point: 'sushi', reveals: ['smoke'], seg: [66.85, 79.7],
      stem: 'Why have the members suddenly turned it into a sushi and cigar club?',
      choices: ['To get Ann to leave without saying it outright', 'To liven up a club that had gotten boring',
                'To have a fresh place to vent about work'], a: 0,
      cue: '彼女の抗議と、「at first」からの言い分。',
      line: 'At first, this was funny, but *it’s gotten out of hand*. … *Sushi and cigar club* now.',
      said: '「最初は面白かったけど、度が過ぎた」と言い、「今は寿司と葉巻の会」と続ける。',
      mean: 'Ann が避ける物をわざと並べ、「来ないで」と言わずに追い出している。',
      trap: '「面白かった」は Ann の愚痴の話で、寿司の理由ではない。何が面白かったかを聞く。',
      use: 'Okay, I can take a hint.（はいはい、察しました）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'vent', seg: [73.35, 76.25],
      stem: 'Type the missing words: “This was our chance ___ about work.” (2 words)', answer: 'to vent',
      cue: '「chance」のすぐあと、短い2語。',
      line: 'This was our chance *to vent* about work',
      said: '「ここは仕事の愚痴を吐き出す場だったのに」。',
      mean: 'vent ＝ たまった不満を吐き出す。to は弱く「タ」、chance とつながる。',
      trap: 'v を b と聞くと bent に聞こえる。不満の話なら vent。下唇をかむ音を意識する。',
      use: 'I just need to vent for a minute.（ちょっと愚痴を聞いて）' },

    // R fix: V2 (blind 50 %): the key was the only negative feeling; "glad" → "sorry" (a Japanese frame), also negative
    // why: sorry ← "I see" read as the Japanese 分かりました、すみません (acceptance); amused ← "At first, this was funny"
    //   just before
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'seehow', reveals: ['sushi'], seg: [78.9, 83.4],
      stem: 'How does Ann sound when she answers the members?',
      choices: ['Hurt that they want her gone', 'Sorry that she spoiled their club', 'Amused by the joke they played'], a: 0,
      cue: '「wow, okay」のあとの短い一文。',
      line: 'Wow, okay. *I see how it is.*',
      said: '「へえ、そう。そういうことね」と返す。',
      mean: 'I see how it is ＝「よく分かったわ」。相手の冷たさに気づいた、すねた言い方。',
      trap: 'I see を「分かりました」と取ると反省に聞こえる。how it is が付くと、傷ついた皮肉。',
      use: 'Oh, I see how it is. Fine.（ああ、そういうこと。いいよ）' },

    // R fix: V2 (blind 55 %): the stem's "after one member says" set up a contrast, and only the key was "not sorry";
    //   neutral stem, and two choices are now "not sorry"
    // why: hiding it ← "I don't" heard as a brave front after "I feel bad"; worried ← "Not sorry" caught, then the
    //   words about the cigar and fish missed
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'amazing', seg: [83.95, 89.4],
      stem: 'Right after “I feel bad,” how does the other member feel?',
      choices: ['Not sorry at all; loving the cigar and fish', 'Not sorry, just worried Ann will come back',
                'Sorry too, but hiding it behind the cigar'], a: 0,
      cue: '短い返事のあと、手元の物の話と最後の一言。',
      line: 'I don’t. This is a Cuban. This is yellowtail. *I feel amazing*.',
      said: '「私は平気。キューバの葉巻にハマチ。最高の気分」と返す。',
      mean: '悪いと思うどころか楽しんでいる。I feel amazing がはっきり示す。',
      trap: '直前の I feel bad に流されて、本当は悪いと思っていると取りやすい。最後の一言が答え。',
      use: 'Tired? Not me. I feel great.（疲れた？私は平気、元気だよ）' },

    // C2 stress
    // R fix: V2 (blind 60 %): "a denial that anything was wrong" didn't fit the moment, so "I" won on logic alone; the
    //   "don't" reading is now a coherent polarity stress, so the ear has to decide
    // why: on "don't" ← polarity stress ("I DON'T feel bad") is a natural reply too; neither ← a short reply after
    //   someone's guilt heard as awkward (気まずい間)
    // anchor: 84.48–88.7 s "I feel bad" from one member, then "I don't", then "I feel amazing": the reply sets one
    //   person against another (I vs the one who feels bad); which word carries it is settled by the ear check
    // retired: the ear-check policy: a C2 stress item (the stress in “I don't” after “I feel bad”, 85.3 s); back after
    //   the ear check
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'amazing', seg: [83.95, 89.4], retired: true,
      stem: 'In the reply to “I feel bad,” which word is stressed, and why?',
      choices: ['“I”: a contrast with the one who feels bad', '“Don’t”: a flat no to feeling any guilt',
                'Neither: a quiet, half-sorry reply'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: '*I* don’t. This is a Cuban… I feel amazing.',
      said: '一人が「悪いことしたな」と言い、次の人が「私はしてない。葉巻にハマチで最高」と返す。',
      mean: 'I が強いと「あなたはそうでも、私は違う」という対比。日本語の「私は」の「は」に近い。',
      trap: 'don’t を強めると「悪く思わない」という否定の強調。ここは人と人の対比。強勢は何と比べるかを示す。',
      use: 'You can go home. I’m staying.（帰っていいよ。私は残る）' },

    // R fix: V2 (blind 50 %): the key was the only one where Chris is kind; "stop listening" → a near miss built on
    //   "I feel bad"
    // why: feel hurt ← "feel bad… feel even worse" heard as both of them hurting; too busy ← "too busy" is said about
    //   Chris later (138 s)
    { id: 'd4', skill: 'detail', level: 'B2', point: 'home', seg: [89.85, 103.05],
      stem: 'Why can’t Ann take her complaints home, as she explains it?',
      choices: ['Chris would try to help, and she’d feel bad', 'Chris would feel hurt, and she’d feel guilty',
                'Chris is too busy with work to hear them'], a: 0,
      cue: '「because Chris is」のあと、彼の性格と自分の気持ち。',
      line: 'I can’t take them home because Chris is the *most considerate person*… he *just wants to help me*',
      said: '愚痴を家に持ち帰れない。Chris は世界一思いやりがあって助けたがるので、悪いと感じる。',
      mean: '問題は冷たさではなく優しさ。',
      trap: 'feel bad から Chris も傷つく話に取りやすいが、悪く感じるのは Ann。because のあとを聞く。',
      use: 'He means well, but it’s a lot.（悪気はないんだけど、ちょっと重い）' },

    // C2 sincere reading
    // R fix: V2 (blind 60 %): the stem's "inside her biggest complaint" pointed at the key; neutral stem, choices tightened
    // why: mocking ← praise inside a complaint heard as sarcasm; soften ← the Japanese frame: praise as a cushion before
    //   the criticism (前置き)
    // anchor: 95.4–102.4 s "he just wants to help me and then I feel bad about that and then I get annoyed that he wants
    //   to help me": his kindness is the cause of each step, not a cushion before it
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'home', seg: [89.85, 103.05],
      stem: 'When Ann praises Chris to the club, does she mean it?',
      choices: ['Yes; his kindness is what bothers her', 'No; she’s mocking how he acts',
                'Yes; it softens what she says next'], a: 0,
      cue: 'ほめ言葉のあと、and then が何回続くか。',
      line: 'Chris is the *most considerate person in the world*… and then *I get annoyed* that he wants to help me',
      said: '「Chris は世界一思いやりがある。助けてくれて、悪いと感じて、いらついて、もっと落ち込む」。',
      mean: 'ほめ言葉がそのまま不満の中身。優しさに文句を言う自分にもいらつく、二重の気持ち。',
      trap: '日本語では、ほめてから本題に入ることが多い。ここは前置きでなく本題。and then を最後まで聞く。',
      use: 'You’re too nice. It makes me feel bad.（優しすぎて、こっちが申し訳ない）' },

    // why: yes for a bit ← "pass" read as 合格/通過, so it sounds like going along; maybe ← a short reply heard as the
    //   soft Japanese 保留 among friends
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'pass', seg: [119.8, 125.8],
      stem: 'When Chris invites his friends to join him, what does the reply mean?',
      choices: ['No, not a chance at all', 'Yes, but only for a bit', 'Maybe, if it’s a short one'], a: 0,
      cue: '誘いのすぐあと、2語の返事。',
      line: 'Would you like to join me? — *Hard pass.*',
      said: '「一緒に来る？」に2語で即答する。',
      mean: 'hard pass ＝ 絶対に遠慮する。pass（やめとく）を hard で強めた、くだけた断り方。',
      trap: 'pass を「通過」と取ると yes に、短い返事を遠回しな保留と取ると maybe に聞こえる。',
      use: 'Karaoke till 3 a.m.? Hard pass.（朝3時までカラオケ？絶対ムリ）' },
    // R fix: V2 (blind 80 %): "simply agreeing" was the only nuanced choice and matched the title's premise; all three
    //   are now "Chris telling her…", with a keyword trap from his first answer
    // why: normal ← his first answer, "as nature intended… it's all good"; sorry ← he does apologize at the end
    //   (212 s), but after her "Thanks", and she waves it off
    { id: 'g1', skill: 'gist', level: 'B2', point: 'lesson', reveals: ['fix', 'thanks'], seg: [119.8, 224],
      stem: 'By the end, what is it that makes Ann feel better?',
      choices: ['Chris telling her that it sounds awful', 'Chris telling her all of it is normal',
                'Chris telling her he’s sorry he tried'], a: 0,
      cue: '最後の会話で、Ann がお礼を言う前の一言。',
      said: '「解決せず、きついねと言え」という助言を Chris が実行すると、Ann はお礼を言う。',
      mean: '不満を言う人は、答えより共感を求めていることが多い。',
      trap: 'Chris は最後に謝るが、Ann は謝らないでと返す。気持ちが変わったのは、その前の共感の一言。',
      use: 'I don’t need advice. I just need you to listen.（アドバイスより、聞いてほしいの）' },

    // why: a hundred ← the weak "a" and the -sand ending, heard as the smaller round number; a million ← Ann's "a
    //   million things" earlier in the clip
    { id: 'n1', skill: 'number', level: 'B1', point: 'qs', seg: [129.55, 132.55], keep: true,
      stem: 'How many questions does Chris say he has?',
      choices: ['A hundred', 'A thousand', 'A million'], a: 1,
      cue: '「literally have」のすぐあと。',
      line: 'I literally have *1,000 questions*.',
      said: '「文字通り質問が千個ある」と言い、すぐ3つ聞く。',
      mean: '大げさに「聞きたいことだらけ」。literally は強調で、本当に千個ではない。',
      trap: 'Ann の a million things に引かれやすい。thousand の「サウ」を聞く。',
      use: 'I have a thousand things to do today.（今日はやることが山ほどある）' },

    // R fix: S4: the segment ended inside "Christopher" (144.06 s); now 144.6
    // why: repeat ← the rising question read as a real request (he didn't catch it); admits ← "You've fallen into a
    //   classic trap" right after sounds like his admission
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'upset', reveals: ['fix'], seg: [134.7, 144.6],
      stem: 'When Chris hears what Ann is complaining about, what does his reply do?',
      choices: ['Shows it makes no sense to him', 'Asks them to repeat what they said', 'Admits he has been in the wrong'], a: 0,
      cue: '「too busy」の説明のあと、Chris が聞き返す一文。',
      line: '*She’s upset that I’m trying to help her?*',
      said: '「解決しようとして、愚痴を言わせない」と言われ、「助けようとして怒られてるの？」と聞き返す。',
      mean: '言われたことをくり返す質問で、驚きと納得のいかなさを示す。',
      trap: '疑問の形なので、聞き取れなかったと取りやすい。相手の言葉をくり返す質問は驚きのサイン。',
      use: 'You’re mad that I cleaned up?（片付けたのに怒ってるの？）' },

    // R fix: V2 (blind 60 %): "can't" made no sense on paper, so "can" won on grammar; added "she'll", which fits as well
    // why: can't ← the t of "can't" is often unreleased, so can and can't blur; could ← the same meaning, only the
    //   vowel and the d differ; she'll ← weak "can" ≈ "kn" shrinks the two words to one syllable
    { id: 's1', skill: 'sound', level: 'B2', point: 'herself', seg: [152.2, 156.35],
      stem: 'Fill the gap: “If Ann needs Tylenol, ___ herself.”',
      choices: ['she can get it', 'she can’t get it', 'she could get it', 'she’ll get it'], a: 0,
      cue: '「Tylenol」のあと、she に続く語の母音の長さ。',
      line: 'if Ann needs Tylenol, *she can get it* herself.',
      said: '「痛み止めが要るなら、自分で取れる」と言う。',
      mean: 'can は弱く「クン」、get it は t が弾んで「ゲリッ」。',
      trap: 'can’t は母音が「キャン」とはっきり長く、t が消えても強い。弱く短いなら can。',
      use: 'You can get it yourself, right?（自分で取れるよね？）' },

    // C2 who is the joke on
    // R fix: V2 (blind 60 %): the stem's "how he knows all this" and the key's long gloss gave it away; neutral stem,
    //   parallel "X, for…" choices, and "the adviser" so no choice rests on who is speaking
    // why: Chris ← the speech is advice to Chris, so the joke seems to be his ignorance; women ← "trick women into liking
    //   me" heard as a jab at women
    // anchor: 165.18–169.9 s "I spent my entire life reading instructional books about relationships in order to trick
    //   women into liking me": the subject is "I", and the sad fact is offered as his qualification
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'books', seg: [164.6, 171.25],
      stem: 'Partway through the advice to Chris, who is the joke on?',
      choices: ['The adviser, for how he got his know-how', 'Chris, for needing to be taught the basics',
                'Women, for falling for tricks from books'], a: 0,
      cue: '文の主語と、本を読んだ目的。',
      line: '*I spent my entire life* reading instructional books… *in order to trick women* into liking me.',
      said: '「人生ずっと恋愛の指南書を読んできた。女性をだまして好かれるために」と助言の根拠にする。',
      mean: '自慢の資格のつもりで、自分の情けなさを打ち明けている。笑われているのは話す本人。',
      trap: 'Chris への助言の途中なので、Chris がからかわれていると聞きやすい。主語の I を追えば自分の話。',
      use: 'Trust me, I’ve failed at this a lot.（信じて、これは何度も失敗してきたから）' },

    // R fix: V2 (blind 65 %): the key was the stock "amazed by the ordinary" humor answer against two weak ones; now
    //   all three are a reaction to the device, one a keyword trap on Tom
    // why: annoyed ← "one right after the other" heard as "I can't choose"; impressed by Tom ← "Tom put all my records
    //   into this rectangle" (150 s)
    { id: 'h2', skill: 'humor', level: 'C1', point: 'rectangle', seg: [176.2, 181.6],
      stem: 'What makes Ron’s comment about his music funny?',
      choices: ['He’s wowed by what any music player does', 'He’s annoyed that he can’t choose the songs',
                'He’s impressed that Tom put in his records'], a: 0,
      cue: '曲の流れ方の説明と、最後のほめ言葉。',
      line: 'The songs just play *one right after the other*. This is an *excellent rectangle*.',
      said: '「曲が次々に流れる。素晴らしい長方形だ」と感心する。',
      mean: '当たり前の機能に本気で感動し、機械を「長方形」と呼ぶ��そのずれが笑い。',
      trap: 'one right after the other を不満と取りやすい。excellent で本気の感心と分かる。',
      use: 'This app is excellent. It does everything.（このアプリ最高、何でもできる）' },

    // why: headache ← "tension headache" is said, but as a comparison; neck ← her first complaint, "up… to my neck"
    { id: 'd6', skill: 'detail', level: 'B1', point: 'calves', seg: [184.75, 192.4],
      stem: 'When Chris asks about her day, what new pain does Ann mention?',
      choices: ['Her legs ache badly', 'Her head aches badly', 'Her neck aches badly'], a: 0,
      cue: '「now my」のあとと、「but in my」のあと。',
      line: 'Now *my legs really hurt*. It’s like I have a tension headache, but *in my calves*.',
      said: '「今度は脚が痛い。頭痛みたいなのが、ふくらはぎに来てる」。',
      mean: 'headache は例えで、痛いのは脚（calves ＝ ふくらはぎ）。',
      trap: 'headache がはっきり聞こえるので頭を選びやすい。It’s like は例え。but のあとを聞く。',
      use: 'It’s like a cold, but in my ears.（風邪みたいな感じが、耳に来てる）' },

    // R fix: V2 (blind 75 %): the key was the only positive reaction and the stem's "no more than" cued it; neutral
    //   stem, and "puzzled" → "amused", a second light reaction
    // why: lazy ← a two-word reply heard as careless (the Japanese frame: 冷たい返事); amused ← "sucks" from polite,
    //   upbeat Chris sounds out of character
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'thanks', seg: [202.95, 210.4],
      stem: 'How does Ann take Chris’s “That really sucks”?',
      choices: ['Grateful; it’s just what she needed', 'Annoyed; it sounds lazy and uncaring', 'Amused; it sounds odd from him'], a: 0,
      cue: '「Yeah, it does」のあと、少し間をおいた一語。',
      line: 'That really sucks. — Yeah, *it does*. … *Thanks.*',
      said: '「本当にきついね」とだけ言われ、「うん、そうなの」と答えて、少しして「ありがとう」と言う。',
      mean: '解決策のない共感が一番うれしかった。',
      trap: '短い返事は冷たく、または彼らしくなく聞こえるが、Ann は同意してお礼を言う。受け取り方は相手の返事で判断。',
      use: 'Ugh, that sucks. I’m sorry.（うわ、それはきついね）' },

    // R fix: V2 (blind 50 %): the key was the only two-part, friendly move; "drop the subject" → "accepts and thanks",
    //   also two-part and friendly
    // why: still upset ← refusing an apology heard as not forgiving (許さない); thanks ← her "Thanks" a few seconds
    //   earlier (209 s) heard as her answer
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'apology', seg: [211.8, 219.4],
      stem: 'When Chris says he’s sorry, what does Ann’s reply do?',
      choices: ['Waves it off and says sorry herself', 'Accepts it and says thanks for it', 'Refuses it because she’s still upset'], a: 0,
      cue: '「Oh God」のあと、2つの文の主語。',
      line: 'Oh God, *don’t apologize*. *I’m sorry* I was such a freak.',
      said: '謝る Chris に「謝らないで。こっちこそ、おかしくなっててごめん」と返す。',
      mean: '「謝る必要はない」と言い、すぐ自分も謝っている。',
      trap: '謝罪を断ると「許さない」に聞こえやすいが、すぐあとの I’m sorry が本心。次の一文まで聞く。',
      use: 'Don’t apologize. It’s my fault.（謝らないで、私のせいだから）' },

    // R fix: V2 (blind 55 %): choices made parallel, so the key is no longer the only superlative-shaped one
    // why: more than asked ← "ask for" read literally (頼む); other girls ← "a girl" heard as other women
    { id: 'p4', skill: 'phrase', level: 'B2', point: 'askfor', seg: [219.2, 223.9],
      stem: 'What does Ann’s last compliment say about Chris?',
      choices: ['No one could hope for a better one', 'He gives more than she asks him for', 'Any other girl would want him too'], a: 0,
      cue: '最上級のあとに続く「a girl…」の部分。',
      line: 'You’re the *nicest, most thoughtful* baby daddy *a girl could ask for*.',
      said: '「女の子が望める中で一番優しくて思いやりのある、赤ちゃんのパパ」と言う。',
      mean: '最上級＋a girl could ask for ＝ これ以上は望めない。',
      trap: 'ask for を「頼む」と取ると、頼んだ以上に優しい、に見える。最上級のあとなら「最高」。',
      use: 'Best roommate anyone could ask for.（これ以上ないルームメイト）' },
  ]
};
