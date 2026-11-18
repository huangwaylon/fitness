// R4 REVIEW 2026-11-18: keep 6, rewrite 8, retire 3, new 2, ctx 4, tx 3, qa 17
// A2 REVIEW 2026-11-17: keep 5, rewrite 12, retire 4, new 0
// “Everyone's Annoying Habits | Friends” (the official Friends channel, Best of Season 1): told off for his own habit,
// Chandler lists his friends' flaws (Joey's knuckle-cracking, Ross's over-pronouncing, Monica's snort) and asks to be
// accepted; the friends turn on one another instead (Joey, Phoebe's hair-chewing, Ross, Rachel's orders).
// Segments from the captions, words from whisper. 86–105 s is music (♪ lines). Retired in R4: d2 (Q1 density; h1 now
// carries Ross's habit), m1 (banned "Why say I mean" stem), a2 (same "accept" fact as g1; c1 tests the opening).
// EAR CHECK: 82 s p2 — whisper "The hair comes out"; speakers of 41 s, 55 s and 77 s are not named in the bank.
import type { Clip } from '../types.ts';

export const habits: Clip = {
  id: 'habits', video: 'vooZITJoPaQ', title: 'Everyone\'s Annoying Habits', dur: 105, wpm: 158, band: 'mid',
  tags: ['友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    { id: 'c1', skill: 'pragma', level: 'B1', point: 'unfair', ctx: true, seg: [0, 10],
      stem: 'What does Chandler do when told to stop?', ja: 'やめてと言われて、チャンドラーはどうする？',
      choices: ['He complains about it', 'He says sorry to them', 'He agrees to stop it'], a: 0,
      choicesJa: ['文句を言う', 'みんなに謝る', 'やめると約束する'],
      cue: '「don’t do that」への返事',
      line: '*Hey, don’t do that.* It’s worse than the thumb. / Chandler: Hey, this is *so unfair*.',
      said: '「それやめて」と言われ、「こんなの不公平だよ」と返す。',
      mean: 'unfair ＝ 不公平（fair の反対）。謝らずに言い返している。the thumb ＝ 前の話で缶ジュースに入っていた親指。',
      trap: 'それやめて、のあとなので謝ると考えがち。返事は so unfair という不満。',
      use: 'That’s not fair!（それはずるいよ）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'accept', seg: [0, 30],
      stem: 'Why does Chandler talk about his friends’ habits?', ja: 'チャンドラーはなぜ友だちの癖の話をする？',
      choices: ['Everyone has bad habits too', 'His habit is the smallest', 'They should all stop habits'], a: 0,
      choicesJa: ['みんなにも悪い癖がある', '自分の癖がいちばん小さい', 'みんな癖をやめるべき'],
      cue: 'リストの最後の一文',
      line: 'I *accept all those flaws*. Why… *accept me* for this?',
      said: '3人の癖を挙げ、「全部受け入れてるのに、なぜ僕のは受け入れない？」と言う。',
      mean: 'accept ＝ 受け入れる。癖を並べたのは責めるためでなく、「お互いさまだろ」と言うため。',
      trap: '比べているので「自分がいちばんまし」と聞こえるが、最後に言うのは accept me（僕も受け入れて）。',
      use: 'Can’t you just accept me as I am?（ありのままの僕を受け入れてよ）' },

    // R fix: V2 (blind 75 %): the key was the only natural trigger for a comeback. Now a second comeback reading
    //   ("so I have one too") competes, and the key no longer echoes "criticized … habits"
    // why: asked to name a flaw ← "flaw" heard as answering a question; owned up ← "So I have a flaw" heard as "so
    //   (like you) I have one too"

    { id: 'p1', skill: 'phrase', level: 'B1', point: 'bigdeal', seg: [8, 13],
      stem: 'What does Chandler mean by “Big deal”?', ja: 'チャンドラーの “Big deal” はどういう意味？',
      choices: ['It’s not important', 'It’s very serious', 'It’s a good thing'], a: 0,
      choicesJa: ['大したことない', 'とても深刻だ', 'いいことだ'],
      cue: '「flaw」のすぐあとの2語',
      line: 'So I have a flaw. *Big deal.*',
      said: '「そりゃ僕にも欠点はあるよ。だから何？」と開き直る。',
      mean: '文字どおりは「大ごと」。一言だけ投げると皮肉で逆になり「だから何？大したことない」。くだけた言い方。',
      trap: '字のまま「大ごと・深刻」と考えがち。flaw（欠点）を認めたすぐあとに言い放っている。',
      use: 'It’s no big deal, really.（ほんとに大したことないよ）' },

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

    { id: 'd1', skill: 'detail', level: 'B1', point: 'knuckle', seg: [12.98, 16.24],
      stem: 'Which habit of Joey’s does Chandler mention?', ja: 'チャンドラーが挙げるジョーイの癖は？',
      choices: ['Cracking his knuckles', 'Cracking his neck', 'Drumming his fingers'], a: 0,
      choicesJa: ['指の関節を鳴らす', '首を鳴らす', '指で机をたたく'],
      cue: '「Joey’s」のすぐあと',
      line: 'Like Joey’s constant *knuckle-cracking* isn’t annoying…',
      said: 'ジョーイがしょっちゅう指の関節を鳴らす、と挙げる。',
      mean: 'knuckle ＝ 指の関節。crack ＝ ポキッと鳴らす。constant ＝ いつもの、しょっちゅう。',
      trap: 'knuckle は短く速い。crack だけ拾うと、首など別の場所と迷いやすい。',
      use: 'Please stop cracking your knuckles.（指をポキポキ鳴らすのやめて）' },

    // R fix: V2 (blind 50 %): "isn't annoying" was an odd thing to complain about. The literal reading is now the
    //   natural complaint ("nobody minds Joey's, so why mine?"), and "worse" became "the one to fix first"
    // why: nobody minds ← "like" read as "for example" and the words taken literally; fix first ← the list heard as a
    //   ranking against his own flaw

    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'like', reveals: ['knuckle'], seg: [12.98, 16.4], retired: true,
      stem: 'What is Chandler really saying in his first example, about Joey?',
      choices: ['That Joey’s habit is just as annoying', 'That nobody seems to mind Joey’s habit',
                'That Joey’s habit is the one to fix first'], a: 0,
      cue: '文頭の短い一語と、文末の否定。',
      line: '*Like* Joey’s constant knuckle-cracking *isn’t annoying*…',
      said: '「ジョーイの指鳴らしは迷惑じゃないとでも？」と言う。',
      mean: '文頭の Like … isn’t ＝「まるで〜じゃないみたいに」。つまり「あれも迷惑だろ」。',
      trap: 'Like を「例えば」と取ると文字通りの意味になる。文頭の Like は反語を疑う。',
      use: 'Like you’ve never been late!（君だって遅刻したことあるくせに）' },

    { id: 'd2', skill: 'detail', level: 'B1', point: 'pronounce', seg: [12.98, 23.6], retired: true,
      stem: 'Which habit of Ross’s does Chandler name?', ja: 'チャンドラーが挙げるロスの癖は？',
      choices: ['Over-pronouncing every word', 'Mispronouncing every word', 'Over-explaining every word'], a: 0,
      choicesJa: ['一語一語はっきり言いすぎる', '一語一語発音をまちがえる', '一語一語説明しすぎる'],
      cue: '「Ross with his」のあと',
      line: 'and Ross with his *overpronouncing* every single word',
      said: 'ロスは一語一語を発音しすぎる、と挙げる。',
      mean: 'over ＋ pronounce ＝ 必要以上にはっきり発音すること。気取って聞こえる癖。',
      trap: 'every single word だけ拾うと、別の癖と迷いやすい。長い一語の頭の over を聞く。',
      use: 'Could you say that word slowly?（その単語、ゆっくり言って）' },

    { id: 'd3', skill: 'detail', level: 'B1', point: 'snort', seg: [17.92, 21.28],
      stem: 'What does Chandler say about Monica?', ja: 'チャンドラーはモニカについて何と言う？',
      choices: ['She snorts when she laughs', 'She sniffs when she laughs', 'She sneezes when she laughs'], a: 0,
      choicesJa: ['笑うと鼻を鳴らす', '笑うと鼻をすする', '笑うとくしゃみをする'],
      cue: '「Monica with that」のあと',
      line: 'and Monica with that *snort when she laughs*',
      said: 'モニカは笑うと鼻をブヒッと鳴らす、と挙げる。',
      mean: 'snort ＝ 鼻を「ブヒッ」と鳴らすこと。when she laughs で、いつ鳴るかを言っている。',
      trap: 'snort・sniff・sneeze はどれも「ス」で始まる鼻の音。sn のあとの「ノー」を聞く。',
      use: 'Sorry, I laugh really loudly.（ごめん、笑い声が大きくて）' },

    { id: 'm1', skill: 'marker', level: 'B1', point: 'imean', seg: [19.3, 24.3], retired: true,
      stem: 'Why does Chandler say “I mean” here?', ja: 'チャンドラーはなぜ、ここで「I mean」と言う？',
      choices: ['To say it more strongly', 'To fix a mistake', 'To explain which habit'], a: 0,
      choicesJa: ['もっと強く言うため', 'まちがいを直すため', 'どの癖か説明するため'],
      cue: 'snort の話のすぐあと',
      line: '*I mean*, what the hell is that thing?',
      said: '「つまりさ、あれ一体何なの？」と続ける。',
      mean: 'I mean ＝ つまり、だってさ。ここは言い直しではなく、本音をもっと強く言い足す合図。',
      trap: '「つまり」から、言い直しだと思いやすい。前と同じ向きで強まっている。',
      use: 'I mean, who does that?（だってさ、普通そんなことする？）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [23.3, 30],
      stem: 'Fill the gap: “Why ___ accept me for this?”', ja: '空所に入るのは？ “Why ___ accept me for this?”',
      choices: ['can’t you', 'don’t you', 'won’t you'], a: 0,
      choicesJa: ['〜できないの', '〜しないの', '〜してくれないの'],
      cue: 'Why のすぐあと',
      line: 'I accept all those flaws. Why *can’t you* accept me for this?',
      said: '「全部受け入れてる。なのに、なぜ受け入れられない？」と聞く。',
      mean: 'can’t you が「キャンチュ」のようにつながる。t は消えても母音は長め。',
      trap: 'don’t you は「ドンチュ」、won’t you は「ウォンチュ」。「キャ」で始まる「キャンチュ」なら can’t you。',
      use: 'Why can’t you just say yes?（なんで素直にイエスと言えないの）' },

    { id: 'a2', skill: 'attitude', level: 'B1', point: 'accept', reveals: ['cant'], seg: [23.3, 30], retired: true,
      stem: 'How does Chandler feel at the end of his list?', ja: 'リストの最後で、チャンドラーはどんな気持ち？',
      choices: ['Hurt that it’s unfair', 'Happy he isn’t worst', 'Sorry for his friends'], a: 0,
      choicesJa: ['不公平で傷ついている', '自分が最悪じゃなくてうれしい', '友だちに申し訳ない'],
      cue: '最後の質問',
      line: 'I accept all those flaws. Why *can’t you accept me* for this?',
      said: '「僕はみんなの欠点を受け入れてる。なぜ僕だけダメ？」と聞く。',
      mean: '自分は許しているのに許されない、という不公平への不満。謝ってはいない。',
      trap: '友だちの癖を並べたあとなので、謝っていると思いやすい。最後の Why can’t you に本音。',
      use: 'That’s not fair. Why just me?（ずるいよ。なんで僕だけ？）' },

    { id: 'd4', skill: 'detail', level: 'B1', point: 'everybody', reveals: ['knuckle'], seg: [34.1, 39.1],
      stem: 'What does Joey ask about his habit?', ja: 'ジョーイは自分の癖について何を聞く？',
      choices: ['Whether it annoys everyone', 'Whether everyone does it too', 'Whether it is really loud'], a: 0,
      choicesJa: ['みんな気になっているか', 'みんなもやっているか', '本当にうるさいか'],
      cue: '「knuckle-cracking」のあと',
      line: 'Does the knuckle-cracking *bother everybody* at this point?',
      said: '「指鳴らしって、もうみんな気になってる？」と聞く。',
      mean: 'bother ＝ 気にさわる、いやな気持ちにさせる。Does it bother you? ＝「気になる？」。',
      trap: '文の頭は弱く速いので聞き落としやすい。動詞 bother と最後の everybody を拾う。',
      use: 'Does the music bother you?（音楽、気にならない？）' },

    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'could', ctx: true, reveals: ['everybody'], seg: [34.1, 46],
      stem: 'What is the answer to Joey’s question?', ja: 'ジョーイの質問への答えは？',
      choices: ['It bothers them a bit', 'It doesn’t bother them', 'It bothers only Chandler'], a: 0,
      choicesJa: ['少し気になる', '気にならない', 'チャンドラーだけが気になる'],
      cue: '「Well」のあとの返事',
      line: 'Joey: Does the knuckle-cracking bother everybody? / *Well…* I *could live without it*.',
      said: '「指鳴らし、みんな気になってる？」に、少しためらって「まあ、なくても困らないかな」と答える。',
      mean: '文字どおりは「それなしでも生きていける」。＝なくなっても困らない→やめてくれたらうれしい、と遠回しに言う。',
      trap: 'live without を live with（平気）と混ぜやすい。Well… のためらいは、言いにくい本音の合図。',
      use: 'Honestly, I could live without the music.（正直、音楽はなくてもいいかな）' },

    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', seg: [41.0, 70.38],
      stem: 'What happens after Chandler’s speech?', ja: 'チャンドラーの話のあと、どうなる？',
      choices: ['They complain about each other', 'They agree his is the worst', 'They say sorry to each other'], a: 0,
      choicesJa: ['お互いの癖に文句を言う', '彼の癖が最悪だと認める', 'お互いに謝る'],
      cue: '後半は、誰の癖の話か',
      line: 'Well, I could live without it. — Oh, is it like *a little annoying*, or…? … there’s nothing wrong with *speaking correctly*.',
      said: '話はジョーイ、フィービー、ロスの癖へ移り、チャンドラーの欠点には戻らない。',
      mean: 'チャンドラーの「お互いさま」作戦で、みんなが互いの癖を言い始める。annoying ＝ うっとうしい。',
      trap: 'チャンドラーが「受け入れて」と頼んだので、謝り合うと考えがち。誰も謝らず、言い返している。',
      use: 'Let’s not make this about me.（僕の話にしないでよ）' },

    // C2: who is the joke on?
    // why: Joey ← the question is about his habit, and "a little annoying" sounds like a jab at him; Chandler ← his
    //   flaw started the whole argument
    // anchor: 47.2–51.2 s the "or" half names Phoebe's habit as the far end of the scale; 54.4–57.7 s the next speaker
    //   comforts her ("don't listen to him, Pheebs… I think it's endearing")
    // R fix: V2 (blind 50 %): "comparing levels" in the stem pointed at whoever was the comparison. The stem is now
    //   neutral, and the Joey distractor is stronger (his habit is the topic)

    { id: 'd5', skill: 'detail', level: 'B1', point: 'hair', seg: [46.5, 52],
      stem: 'Which habit of Phoebe’s comes up?', ja: '話に出るフィービーの癖は？',
      choices: ['Chewing her hair', 'Playing with her hair', 'Biting her nails'], a: 0,
      choicesJa: ['髪をかむ', '髪をいじる', '爪をかむ'],
      cue: '「or is it like when」のあと',
      line: 'Oh, is it like a little annoying, or is it like when *Phoebe chews her hair*?',
      said: '「ちょっとうっとうしい程度？それともフィービーが髪をかむくらい？」と聞く。',
      mean: 'chew ＝ かむ（chewing gum ＝ ガム）。chews her hair ＝ 髪の毛を口に入れてかむ。ひどい例として出している。',
      trap: 'hair だけ拾うと、髪をいじる癖と迷いやすい。前の動詞 chews（チューズ）を聞く。',
      use: 'Please chew with your mouth closed.（口を閉じてかんでね）' },

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

    { id: 's2', skill: 'sound', level: 'B2', point: 'him', seg: [53.2, 57.22],
      stem: 'Fill the gap: “Don’t listen ___, Pheebs.”', ja: '空所に入るのは？ “Don’t listen ___, Pheebs.”',
      choices: ['to him', 'to them', 'to me'], a: 0,
      choicesJa: ['彼の言うこと', '彼らの言うこと', '私の言うこと'],
      cue: '「listen」のあと',
      line: '…don’t *listen to him*, Pheebs, all right?',
      said: '「彼の言うことなんか聞かないで、フィービー」となだめる。',
      mean: 'listen to 〜 ＝ 〜の言うことを聞く。him の h が落ちて「リスントゥイム」とつながる。Pheebs ＝ フィービーの愛称。',
      trap: 'them なら th の「ゼ」、me なら「ミー」とはっきり。h が落ちた「トゥイム」なら to him。',
      use: 'Don’t listen to him. You look great.（彼の言うこと気にしないで。素敵だよ）' },

    { id: 'a1', skill: 'attitude', level: 'B2', point: 'endearing', seg: [53.9, 61.4],
      stem: 'How is Phoebe’s habit described here?', ja: 'ここで、フィービーの癖はどう言われる？',
      choices: ['Cute and sweet', 'Strange but okay', 'Annoying but fine'], a: 0,
      choicesJa: ['かわいくて好き', '変だけど大丈夫', 'うるさいけどいい'],
      cue: '文の最後の長めの形容詞',
      line: '…*I think it’s endearing*.',
      said: '「気にしないで、フィービー。かわいいと思う」とかばう。',
      mean: 'endearing ＝ 愛らしい、好感が持てる（dear ＝ 大切な、から）。欠点を魅力と言いかえてかばっている。',
      trap: 'かばう流れなので「うるさいけど許せる」と読みたくなるが、endearing ははっきりしたほめ言葉。',
      use: 'His accent is kind of endearing.（彼のなまり、ちょっとかわいい）' },

    { id: 'h1', skill: 'phrase', level: 'B2', point: 'indeed', ctx: true, seg: [65.6, 73.7],
      stem: 'What does “Indeed, there isn’t” mean?', ja: '“Indeed, there isn’t” はどういう意味？',
      choices: ['Yes, nothing is wrong', 'No, something is wrong', 'Only sometimes'], a: 0,
      choicesJa: ['そう、何も悪くない', 'いや、悪いところがある', 'ときどきだけ'],
      cue: '「speaking correctly」への返事',
      line: 'Ross: There’s nothing wrong with *speaking correctly*. / *Indeed, there isn’t.*',
      said: '「正しく話して何が悪い」に「まことに、悪くありませんね」と返す。',
      mean: 'Indeed ＝ まことに、そのとおり。とても堅い言葉。ロスの一語一語はっきりした話し方をまねて、からかっている。',
      trap: 'isn’t が聞こえて反対に聞こえるが、nothing wrong に isn’t で合わせた「そう、悪くない」。',
      use: 'Indeed, it’s a lovely day.（まことに、いい日ですね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'backwork', seg: [73.6, 76.5],
      stem: 'Type what Rachel says: “I should really ___.” (4 words)', ja: '書こう：“I should really ___.”（4語）',
      answer: 'get back to work',
      cue: '「really」のあと',
      line: 'I should really *get back to work*.',
      said: '「そろそろ仕事に戻らなきゃ」と言う。',
      mean: 'get back to 〜 ＝ 〜に戻る。get の t が消えて「ゲッバック」とつながる。',
      trap: 'get の t と back の k が消えやすい。4語でひとかたまりと覚える。',
      use: 'Sorry, I need to get back to work.（ごめん、仕事に戻らなきゃ）' },

    { id: 'i1', skill: 'infer', level: 'C1', point: 'ordered', ctx: true, reveals: ['backwork'], seg: [74.6, 80.6],
      stem: 'What does the reply say about Rachel’s work?', ja: 'この返事は、レイチェルの仕事について何を言っている？',
      choices: ['She often gets orders wrong', 'She takes orders too slowly', 'The café is busy without her'], a: 0,
      choicesJa: ['よく注文をまちがえる', '注文を取るのが遅い', '彼女がいないと店が忙しい'],
      cue: '「otherwise」のあと',
      line: 'Rachel: I should really get back to work. / Yeah, otherwise someone might get *what they actually ordered*.',
      said: '「仕事に戻らなきゃ」に「そうだね、じゃないと誰かが注文どおりの物を受け取っちゃう」と返す。',
      mean: 'otherwise ＝ そうしないと。本当は逆の意味の皮肉：「君が戻ると注文どおりの物が出ない」＝よくまちがえる。',
      trap: 'Yeah（うん）で始まるので応援に聞こえるが、決め手は actually ordered（本当に頼んだ物）。',
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

    { id: 'p2', skill: 'phrase', level: 'B2', point: 'gloves', reveals: ['hair'], seg: [80.5, 85.9],
      stem: 'What does “the gloves come off” mean?', ja: '“the gloves come off” はどういう意味？',
      choices: ['She will stop being nice', 'She will stop fighting', 'She is going back to work'], a: 0,
      choicesJa: ['もう遠慮しない', 'けんかをやめる', '仕事に戻る'],
      cue: '最後の一文の後半',
      line: 'Oh! The hair comes out and *the gloves come off*.',
      said: '「髪は口から出した。もう手加減しないよ」と宣言する。',
      mean: '文字どおりは「グローブが外れる」。ボクシングで手袋を外す＝素手で本気のけんか。→もう遠慮しない。',
      trap: 'come off（外れる）から、やめる話と勘違いしやすい。外すのは手袋で、本気になる合図。',
      use: 'Okay, now the gloves are off.（よし、ここからは本気だ）' },
  ]
};
