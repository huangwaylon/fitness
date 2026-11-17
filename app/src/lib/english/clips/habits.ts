// A2 REVIEW 2026-11-17: keep 5, rewrite 12, retire 4, new 0
// “Everyone's Annoying Habits | Friends” (the official Friends channel, Best of Season 1): told off for his own habit,
// Chandler lists his friends' flaws (Joey's knuckle-cracking, Ross's over-pronouncing, Monica's snort) and asks to be
// accepted; the friends turn on one another instead.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–10 s (whisper only; needs the show's
// backstory), 46–53 s (the Phoebe comparison), 58–60 s, and 86–105 s (music; whisper loops invented lines).
// OPEN: d1–d3 stay blind-guessable from show knowledge; the distractors are near sounds, so only the audio settles them.
// EAR CHECK: 82 s p2 — whisper "The hair comes up", captions "comes out"; the key needs only "the gloves come off"
import type { Clip } from '../types.ts';

export const habits: Clip = {
  id: 'habits', video: 'vooZITJoPaQ', title: 'Everyone\'s Annoying Habits', dur: 105, wpm: 158, band: 'mid',
  tags: ['友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    { id: 'p1', skill: 'phrase', level: 'B1', point: 'bigdeal', seg: [9.6, 13.3],
      stem: 'What does Chandler mean by “Big deal”?', ja: 'チャンドラーの “Big deal” はどういう意味？',
      choices: ['It’s not important', 'It’s very serious', 'It’s a good price today'], a: 0,
      choicesJa: ['大したことない', 'とても深刻だ', '今日はお買い得だ'],
      cue: '「flaw」のすぐあとの2語',
      line: 'So I have a flaw. *Big deal.*',
      said: '「だから何、欠点くらいあるよ。大したことない」と開き直る。',
      mean: 'Big deal. だけで言うと「だから何？大したことない」。flaw ＝ 欠点。',
      trap: '字のまま「大ごと」と思いやすい。一言だけ言い放つ Big deal はその逆。',
      use: 'It’s no big deal, really.（ほんとに大したことないよ）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'accept', seg: [9.6, 28.7],
      stem: 'Why does Chandler talk about his friends’ habits?', ja: 'チャンドラーはなぜ友だちの癖の話をする？',
      choices: ['They should accept each other', 'His habit is the smallest', 'They should all stop habits'], a: 0,
      choicesJa: ['お互いを受け入れるべき', '自分の癖がいちばん小さい', 'みんな癖をやめるべき'],
      cue: 'リストの最後の一文',
      line: 'I *accept all those flaws*. Why… *accept me* for this?',
      said: '3人の癖を挙げ、「全部受け入れてるのに、なぜ僕のは受け入れない？」と言う。',
      mean: 'accept ＝ 受け入れる。癖を並べたのは責めるためでなく、「お互いさま」と言うため。',
      trap: '比べているので「自分がいちばんまし」と思いやすい。最後に言うのは accept me。',
      use: 'Can’t you just accept me as I am?（ありのままの僕を受け入れてよ）' },

    // R fix: V2 (blind 75 %): the key was the only natural trigger for a comeback. Now a second comeback reading
    //   ("so I have one too") competes, and the key no longer echoes "criticized … habits"
    // why: asked to name a flaw ← "flaw" heard as answering a question; owned up ← "So I have a flaw" heard as "so
    //   (like you) I have one too"
    { id: 'i2', skill: 'infer', level: 'B2', point: 'flaw', reveals: ['bigdeal'], seg: [9.6, 13.3], retired: true,
      stem: 'What does Chandler’s opening, “So I have a flaw”, tell us just happened?',
      choices: ['Someone objected to something he does', 'Someone asked him to name his worst flaw',
                'Someone owned up to a flaw of their own'], a: 0,
      cue: '文頭の So の言い方。返事か、言い返しか。',
      line: '*So I have a flaw.* Big deal.',
      said: '「だから何、欠点くらいあるよ。大したことない」と開き直る。',
      mean: '文頭の So は、責められた直後の言い返し。直前に注意されたと分かる。',
      trap: 'flaw だけ拾うと「欠点を聞かれた」と取りやすい。返事の勢いを聞く。',
      use: 'So I was late. Big deal.（遅れたからって、何？）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'knuckle', seg: [12.5, 16.4],
      stem: 'Which habit of Joey’s does Chandler mention?', ja: 'チャンドラーが挙げるジョーイの癖は？',
      choices: ['Cracking his knuckles', 'Cracking his neck', 'Drumming his knuckles'], a: 0,
      choicesJa: ['指の関節を鳴らす', '首を鳴らす', '指で机をたたく'],
      cue: '「Joey’s」のすぐあと',
      line: 'Like Joey’s constant *knuckle-cracking* isn’t annoying…',
      said: 'ジョーイがしょっちゅう指の関節を鳴らす、と挙げる。',
      mean: 'knuckle ＝ 指の関節。crack ＝ ポキッと鳴らす。constant ＝ いつもの。',
      trap: 'knuckle は短く速い。crack だけ拾うと、首など別の場所と迷いやすい。',
      use: 'Please stop cracking your knuckles.（指をポキポキ鳴らすのやめて）' },

    // R fix: V2 (blind 50 %): "isn't annoying" was an odd thing to complain about. The literal reading is now the
    //   natural complaint ("nobody minds Joey's, so why mine?"), and "worse" became "the one to fix first"
    // why: nobody minds ← "like" read as "for example" and the words taken literally; fix first ← the list heard as a
    //   ranking against his own flaw
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'like', reveals: ['knuckle'], seg: [12.5, 16.4], retired: true,
      stem: 'What is Chandler really saying in his first example, about Joey?',
      choices: ['That Joey’s habit is just as annoying', 'That nobody seems to mind Joey’s habit',
                'That Joey’s habit is the one to fix first'], a: 0,
      cue: '文頭の短い一語と、文末の否定。',
      line: '*Like* Joey’s constant knuckle-cracking *isn’t annoying*…',
      said: '「ジョーイの指鳴らしは迷惑じゃないとでも？」と言う。',
      mean: '文頭の Like … isn’t ＝「まるで〜じゃないみたいに」。つまり「あれも迷惑だろ」。',
      trap: 'Like を「例えば」と取ると文字通りの意味になる。文頭の Like は反語を疑う。',
      use: 'Like you’ve never been late!（君だって遅刻したことあるくせに）' },

    { id: 'd2', skill: 'detail', level: 'B1', point: 'pronounce', seg: [15.8, 19],
      stem: 'Which habit of Ross’s does Chandler name?', ja: 'チャンドラーが挙げるロスの癖は？',
      choices: ['Over-pronouncing every word', 'Mispronouncing every word', 'Over-explaining every word'], a: 0,
      choicesJa: ['一語一語はっきり言いすぎる', '一語一語発音をまちがえる', '一語一語説明しすぎる'],
      cue: '「Ross with his」のあと',
      line: 'and Ross with his *overpronouncing* every single word',
      said: 'ロスは一語一語を発音しすぎる、と挙げる。',
      mean: 'over ＋ pronounce ＝ 必要以上にはっきり発音すること。気取って聞こえる癖。',
      trap: 'every single word だけ拾うと、別の癖と迷いやすい。長い一語の頭の over を聞く。',
      use: 'Could you say that word slowly?（その単語、ゆっくり言って）' },

    { id: 'd3', skill: 'detail', level: 'B1', point: 'snort', seg: [18.2, 21.6],
      stem: 'What does Chandler say about Monica?', ja: 'チャンドラーはモニカについて何と言う？',
      choices: ['She snorts when she laughs', 'She sniffs when she laughs', 'She snores when she naps'], a: 0,
      choicesJa: ['笑うと鼻を鳴らす', '笑うと鼻をすする', '昼寝でいびきをかく'],
      cue: '「Monica with that」のあと',
      line: 'and Monica with that *snort when she laughs*',
      said: 'モニカは笑うと鼻を鳴らす、と挙げる。',
      mean: 'snort ＝ 鼻を「フゴッ」と鳴らすこと。when she laughs で、いつ鳴るかを言う。',
      trap: 'snort と sniff は出だしが同じ。when のあとの laughs まで聞く。',
      use: 'Sorry, I laugh really loudly.（ごめん、笑い声が大きくて）' },

    { id: 'm1', skill: 'marker', level: 'B1', point: 'imean', seg: [20.3, 23.3],
      stem: 'What does “I mean” do here?', ja: 'ここでの “I mean” は何をしている？',
      choices: ['Says it more strongly', 'Fixes a mistake', 'Explains which habit he means'], a: 0,
      choicesJa: ['もっと強く言う', 'まちがいを直す', 'どの癖のことか説明する'],
      cue: 'snort の話のすぐあと',
      line: '*I mean*, what the hell is that thing?',
      said: '「つまりさ、あれ一体何なの？」と続ける。',
      mean: 'I mean ＝ つまり、だってさ。ここは言い直しではなく、本音をもっと強く言い足す合図。',
      trap: '「つまり」から、言い直しだと思いやすい。前と同じ向きで強まっている。',
      use: 'I mean, who does that?（だってさ、普通そんなことする？）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [24.3, 28.7],
      stem: 'Fill the gap: “Why ___ accept me for this?”', ja: '空所に入るのは？ “Why ___ accept me for this?”',
      choices: ['can’t you', 'can you', 'won’t you'], a: 0,
      choicesJa: ['〜できないの', '〜できるの', '〜してくれないの'],
      cue: 'Why のすぐあと',
      line: 'I accept all those flaws. Why *can’t you* accept me for this?',
      said: '「全部受け入れてる。なのに、なぜ受け入れられない？」と聞く。',
      mean: 'can’t you が「キャンチュ」のようにつながる。t は消えても母音は長め。',
      trap: 'can you なら「キャニュ」と短く弱い。won’t you は「ウォンチュ」。強く長い「キャンチュ」なら can’t you。',
      use: 'Why can’t you just say yes?（なんで素直にイエスと言えないの）' },

    { id: 'a2', skill: 'attitude', level: 'B1', point: 'accept', reveals: ['cant'], seg: [24.3, 28.7],
      stem: 'How does Chandler feel at the end of his list?', ja: 'リストの最後で、チャンドラーはどんな気持ち？',
      choices: ['Hurt that it’s unfair', 'Happy he isn’t worst', 'Sorry for his friends'], a: 0,
      choicesJa: ['不公平で傷ついている', '自分が最悪じゃなくてうれしい', '友だちに申し訳ない'],
      cue: '最後の質問',
      line: 'I accept all those flaws. Why *can’t you accept me* for this?',
      said: '「僕はみんなの欠点を受け入れてる。なぜ僕だけダメ？」と聞く。',
      mean: '自分は許しているのに許されない、という不公平への不満。謝ってはいない。',
      trap: '友だちの癖を並べたあとなので、謝っていると思いやすい。最後の Why can’t you に本音。',
      use: 'That’s not fair. Why just me?（ずるいよ。なんで僕だけ？）' },

    { id: 'd4', skill: 'detail', level: 'B1', point: 'everybody', seg: [34.8, 38.6],
      stem: 'What does Joey ask about his habit?', ja: 'ジョーイは自分の癖について何を聞く？',
      choices: ['Whether it bothers everybody', 'Whether everybody does it too', 'Whether it is really loud'], a: 0,
      choicesJa: ['みんな気になっているか', 'みんなもやっているか', '本当にうるさいか'],
      cue: '「knuckle-cracking」のあと',
      line: '…knuckle-cracking *bother everybody*?',
      said: '「指鳴らしって、みんな気になってるの？」と聞く。',
      mean: 'bother ＝ 気になる、いやな気持ちにさせる。everybody で「全員が？」と驚いている。',
      trap: '文の頭は弱く速いので聞き落としやすい。動詞 bother と最後の everybody を拾う。',
      use: 'Does the music bother you?（音楽、気にならない？）' },

    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'could', seg: [34.8, 44.7],
      stem: 'What does “I could live without it” mean here?', ja: 'ここでの “I could live without it” はどういう意味？',
      choices: ['It bothers him a bit', 'It doesn’t bother him', 'He really loves it'], a: 0,
      choicesJa: ['少し気になる', '気にならない', 'すごく好き'],
      cue: '「Well」のあとの返事',
      line: '*Well*… I, I *could live without it*.',
      said: '少しためらって「まあ、なくても生きていけるかな」と答える。',
      mean: 'could live without 〜 ＝ 〜がなくても困らない。やめてくれたらうれしい、と遠回しに言っている。',
      trap: 'live without を live with（平気）と混ぜやすい。Well とためらいは、言いにくい本音の合図。',
      use: 'Honestly, I could live without the music.（正直、音楽はなくてもいいかな）' },

    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', seg: [41.0, 86.0],
      stem: 'What happens after Chandler’s speech?', ja: 'チャンドラーの話のあと、どうなる？',
      choices: ['They pick on each other’s habits', 'They agree his is the worst', 'They say sorry to each other'], a: 0,
      choicesJa: ['お互いの癖を言い合う', '彼の癖が最悪だと認める', 'お互いに謝る'],
      cue: '後半は、誰の癖の話か',
      line: 'is it like a little annoying, or is it like when *Phoebe*…? … someone might get *what they actually ordered*.',
      said: '話はジョーイ、フィービー、ロスの癖へ移り、チャンドラーの欠点には戻らない。',
      mean: 'pick on 〜 ＝ 〜をとがめる。話をそらす作戦が当たり、みんなが互いの癖を言い始める。',
      trap: 'タイトルから、みんなが謝ると思いやすい。誰も謝らず、言い返している。',
      use: 'Let’s not make this about me.（僕の話にしないでよ）' },

    // C2: who is the joke on?
    // why: Joey ← the question is about his habit, and "a little annoying" sounds like a jab at him; Chandler ← his
    //   flaw started the whole argument
    // anchor: 47.2–51.2 s the "or" half names Phoebe's habit as the far end of the scale; 54.4–57.7 s the next speaker
    //   comforts her ("don't listen to him, Pheebs… I think it's endearing")
    // R fix: V2 (blind 50 %): "comparing levels" in the stem pointed at whoever was the comparison. The stem is now
    //   neutral, and the Joey distractor is stronger (his habit is the topic)
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'phoebe', seg: [46.7, 58.2], retired: true,
      stem: 'In the question about just how annoying it is, who is the joke on?',
      choices: ['Phoebe, whose habit is brought in as the worst', 'Joey, whose habit turns out to annoy everyone',
                'Chandler, whose own habit started the fight'], a: 0,
      cue: 'or のあとの比べる相手と、次の人の返事。',
      line: '…a little annoying, or is it like *when Phoebe chews her hair*?',
      said: '「ちょっとうるさい程度？それともフィービーの髪かみくらい？」と聞く。',
      mean: 'ジョーイの癖を聞くふりで、フィービーの癖を最悪の例に使う。次の人が彼女をかばうのが証拠。',
      trap: '話題がジョーイなので、的も彼と取りやすい。比べる物に出された人が本当の的。',
      use: 'Is it bad, or Mike’s-singing bad?（まずい？それともマイクの歌くらい？）' },

    { id: 'a1', skill: 'attitude', level: 'B2', point: 'endearing', seg: [53.9, 58.2],
      stem: 'How does he describe Phoebe’s habit?', ja: 'フィービーの癖を、彼はどう言う？',
      choices: ['Cute and sweet', 'Strange but okay', 'Annoying but fine'], a: 0,
      choicesJa: ['かわいくて好き', '変だけど大丈夫', 'うるさいけどいい'],
      cue: '文の最後の長めの形容詞',
      line: '…*I think it’s endearing*.',
      said: '「気にしないで、フィービー。かわいいと思う」とかばう。',
      mean: 'endearing ＝ 愛らしい、好感が持てる。欠点を魅力と言いかえてかばっている。',
      trap: 'かばう流れなので、「うるさいけど許せる」と思いやすい。endearing ははっきりほめ言葉。',
      use: 'His accent is kind of endearing.（彼のなまり、ちょっとかわいい）' },

    { id: 's2', skill: 'sound', level: 'B2', point: 'him', seg: [53.9, 57],
      stem: 'Fill the gap: “Don’t listen ___, Pheebs.”', ja: '空所に入るのは？ “Don’t listen ___, Pheebs.”',
      choices: ['to him', 'to them', 'to me'], a: 0,
      choicesJa: ['彼の言うこと', '彼らの言うこと', '私の言うこと'],
      cue: '「listen」のあと',
      line: '…don’t *listen to him*, Pheebs, all right?',
      said: '「彼の言うことなんか聞かないで、フィービー」となだめる。',
      mean: 'listen to 〜 ＝ 〜の言うことを聞く。him の h が落ちて「リスントゥイム」とつながる。',
      trap: 'them なら th の「ゼ」、me なら「ミー」とはっきり。h が落ちた「トゥイム」なら to him。',
      use: 'Don’t listen to him. You look great.（彼の言うこと気にしないで。素敵だよ）' },

    { id: 'h1', skill: 'phrase', level: 'B2', point: 'indeed', seg: [65.6, 72.4],
      stem: 'What does “Indeed, there isn’t” mean?', ja: '“Indeed, there isn’t” はどういう意味？',
      choices: ['Yes, nothing is wrong', 'No, there is a problem', 'I’m not sure'], a: 0,
      choicesJa: ['そう、何も悪くない', 'いや、問題がある', 'よく分からない'],
      cue: '「speaking correctly」への返事',
      line: 'there’s nothing wrong with speaking correctly. — *Indeed, there isn’t.*',
      said: '「正しく話して何が悪い」に「いかにも、悪くない」と返す。',
      mean: 'Indeed ＝ まさに、そのとおり。堅い言葉で、話題の「きっちりした話し方」を見せているのが笑い。',
      trap: 'isn’t が聞こえて、反対していると思いやすい。「悪くない」に isn’t で「そう、悪くない」と同意。',
      use: 'Indeed, it’s a lovely day.（まことに、いい日ですね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'backwork', seg: [74.6, 76.9],
      stem: 'Type what she says: “I should really ___.” (4 words)', ja: '書こう：“I should really ___.”（4語）',
      answer: 'get back to work',
      cue: '「really」のあと',
      line: 'I should really *get back to work*.',
      said: '「そろそろ仕事に戻らなきゃ」と言う。',
      mean: 'get back to 〜 ＝ 〜に戻る。get の t が消えて「ゲッバック」とつながる。',
      trap: 'get の t と back の k が消えやすい。4語でひとかたまりと覚える。',
      use: 'Sorry, I need to get back to work.（ごめん、仕事に戻らなきゃ）' },

    { id: 'i1', skill: 'infer', level: 'C1', point: 'ordered', seg: [74.6, 79.7],
      stem: 'What does the reply say about her work?', ja: 'この返事は、彼女の仕事について何を言っている？',
      choices: ['Her orders often come out wrong', 'She takes orders too slowly', 'The café is busy without her'], a: 0,
      choicesJa: ['注文をよくまちがえる', '注文を取るのが遅い', '彼女がいないと店が忙しい'],
      cue: '「otherwise」のあと',
      line: 'Yeah, otherwise someone might get *what they actually ordered*.',
      said: '「そうだね、じゃないと誰かが注文どおりの物を受け取っちゃう」と返す。',
      mean: 'otherwise ＝ そうしないと。裏返すと「いつもは注文とちがう物が出る」。仕事ぶりへの軽いからかい。',
      trap: '仕事の話なので「遅い」と思いやすい。actually ordered（本当に頼んだ物）に注目。',
      use: 'Did you get what you actually ordered?（ちゃんと頼んだ物が来た？）' },

    // C2: which reply would show she understood?
    // R fix: V2 (blind 55 %): "not that busy" was off-topic. Now a "hurry up" reading competes
    // why: thanks ← "Yeah" heard as support (the お礼 frame); be quick ← "get back to work" + "otherwise" heard as
    //   "hurry, people are waiting"
    // anchor: 77.5–79.2 s "otherwise… what they actually ordered": with her away, orders come out right; her answer
    //   (79.6 s) is a stung "Well…", not thanks
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'ordered', reveals: ['backwork'], seg: [74.6, 81.0], retired: true,
      stem: 'Which reply from her would show she got the point?',
      choices: ['Hey! I’m not that bad at it.', 'Thanks, I’ll make sure they do.', 'Right, I’d better be quick, then.'],
      a: 0,
      cue: 'otherwise が何を裏返しているか。',
      line: 'I should really get back to work. — Yeah, otherwise someone might get *what they actually ordered*. — *Well…*',
      said: '「仕事に戻らなきゃ」に「でないと注文どおりの物が届く」と返され、詰まる。',
      mean: '応援の形の皮肉。気づいたなら「そこまで下手じゃない」と返すはず。お礼は気づかない返事。',
      trap: 'Yeah で始まるので賛成に聞こえやすい。返事は言葉の形でなく中身に返す。',
      use: 'Hey, I’m not that bad at this!（ちょっと、そこまで下手じゃないよ）' },

    { id: 'p2', skill: 'phrase', level: 'B2', point: 'gloves', seg: [81, 85.8],
      stem: 'What does “the gloves come off” mean?', ja: '“the gloves come off” はどういう意味？',
      choices: ['She will stop being nice', 'She is going home', 'She feels very hurt and sad'], a: 0,
      choicesJa: ['もう遠慮しない', '家に帰る', 'とても傷ついて悲しい'],
      cue: '最後の一文の後半',
      line: 'Oh, the hair comes out and *the gloves come off*.',
      said: '「髪は口から出した。もう手加減しない」と宣言する。',
      mean: 'the gloves come off ＝ 遠慮をやめて本気でやり合う。手袋を外して素手で勝負、というたとえ。',
      trap: 'come off を「帰る」と思いやすい。手袋を外す＝本気の勝負。',
      use: 'Okay, now the gloves are off.（よし、ここからは本気だ）' },
  ]
};
