// “Chandler Drains His Savings Account | Friends” (the official Friends channel, Best of Season 4): Chandler has filled
// the apartment with new things for Joey; Joey, grateful, says he'll focus on Kathy, and Chandler keeps steering him to Casey.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 80 s; whisper's repeated "crush on you"
// lines after it are hallucinations. The opening (3–13 s, "locked myself out again… hang on, buddy") is untested:
// the speaker isn't clear. No predict item (no clean 0.3 s pause before a projected move).
// REVIEW 2026-11-16: pass 5, fix 14, drop 1, new 1; ear checks 1
//   Open: n1 is guessable by anyone who knows Chandler is 29 in season 4 (the clip's only number, so kept).
//   Open: h1 and a2 rest on Chandler not wanting Casey; the clip shows it (the sarcastic "falling into place"),
//   but a viewer who knows he likes Kathy gets it faster.
// EAR CHECK: 76.8 s a2 h1 — “all the pieces of my life are falling right into place” is sarcastic (tone); whisper ends it
//   at ≈ 79 s, captions put “place” at 88.8 s: check a2's segment (to 81.5 s) holds the whole line
import type { Clip } from '../types.ts';

export const savings: Clip = {
  id: 'savings', video: 'Xo9ZETYi9Vs', title: 'Chandler Drains His Savings Account', dur: 91, wpm: 203, band: 'fast',
  tags: ['友だち', '家'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: "Do you do all this?" didn't fit the walk-in moment, so the key was guessable; now two plural near-misses
    // why: you two ← ディジュドゥ heard as one more syllable (you two); Did they ← the weak "you" heard as another pronoun
    { id: 's1', skill: 'sound', level: 'B2', point: 'didyou', seg: [13.3, 18.4],
      stem: 'Fill the gap: “___ all this?”',
      choices: ['Did you do', 'Did you two do', 'Did they do'], a: 0,
      cue: '部屋を見て驚いた直後の、短い質問。',
      line: '*Did you do* all this? — I sure did.',
      said: '「これ全部、君が？」「そうさ」。',
      mean: 'Did you は d と y がつながって「ディジュ」。',
      trap: 'ディジュと縮むと、音が足りない気がして two や they を補いがち。返事が I なら相手は一人。',
      use: 'Did you do this all by yourself?（これ全部ひとりでやったの？）' },

    // R fix: the title ("Drains His Savings Account") gave away "bought new things" (85 % blind); now asks how Joey
    //   takes it, and all three choices fit the title
    // why: scolds ← "How did you afford all this stuff?" heard as a reproach; robbed ← "What happened here?" taken
    //   literally, before "Did you do all this?"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'gifts', reveals: ['best'], seg: [13.3, 49.9],
      stem: 'Over the first half, how does Joey take what he finds?',
      choices: ['He is thrilled and keeps praising Chandler', 'He is pleased but scolds Chandler about the cost',
                'He is alarmed and thinks they were robbed'], a: 0,
      cue: '驚いたあと、何度もほめ言葉が続く。',
      line: 'You’re *amazing*. … This is *amazing*. … You are the *best friend* anyone has ever had.',
      said: '部屋を見て驚き、amazing を重ね、「史上最高の友だち」とまで言う。お金のことも聞くが責めない。',
      mean: '前半は、チャンドラーの贈り物にジョーイが大喜びする場面。',
      trap: 'afford（お金の余裕）を聞くと叱っているようだが、答えを聞いてすぐほめに戻る。',
      use: 'You’re amazing, you know that?（ほんとすごいね）' },

    // why: cheer up ← "make me feel good" heard as "make you feel good" (weak me/you);
    //   pay back ← "for my friend" read as returning a favor
    { id: 'd1', skill: 'detail', level: 'B1', point: 'why', seg: [18.2, 23.8],
      stem: 'What reason does Chandler give for doing all this?',
      choices: ['He thought being nice to a friend would feel good', 'He thought it would cheer Joey up after a bad day',
                'He wanted to pay Joey back for a favor'], a: 0,
      cue: '「Why?」と聞かれた直後の答え。',
      line: 'I just thought it would *make me feel good* to do something nice for my friend.',
      said: '「友だちにいいことをしたら、自分がいい気分になると思って」。',
      mean: '理由は自分の気持ち。make me feel good ＝ 自分が気分よくなる。',
      trap: 'me は弱く、you と取ると「ジョーイを励ますため」になる。代名詞の音まで聞く。',
      use: 'It just makes me feel good.（なんだか気分がいいんだ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'afford', seg: [36.5, 38.5],
      stem: 'Type the question: “___ all this stuff?” (4 words)', answer: 'how did you afford',
      cue: '「That’s the dream」のすぐあと、質問の出だし。',
      line: '*How did you afford* all this stuff?',
      said: '「どうやってこんなに買えたの？」と聞いている。',
      mean: 'did you が「ディジュ」とつながる。afford ＝ 買うお金の余裕がある。',
      trap: 'afford は最初の a が弱く、a fort のように切れて聞こえやすい。お金の話なら afford。',
      use: 'I can’t afford a new phone.（新しいスマホを買う余裕はない）' },

    // why: 19 ← "-nine" is the clear part and "twenty-" is swallowed; 39 ← flapped "twenny" lost, thirty guessed
    { id: 'n1', skill: 'number', level: 'B1', point: 'age', reveals: ['savings'], seg: [36.5, 41.8], keep: true,
      stem: 'How old does Chandler say he is?',
      choices: ['19', '29', '39'], a: 1,
      cue: '「Well, you know」のあとの数字。',
      line: 'Well, you know, I’m *29*.',
      said: '「まあ、ほら、僕は29歳だし」と言う。',
      mean: '「まだ若いから」と、貯金を使い切った言い訳にしている。',
      trap: 'twenty は t が弱まり「トゥエニー」に近い。後ろの nine だけ拾うと19に聞こえやすい。',
      use: 'I’m twenty-nine, not ninety!（29だよ、90じゃない！）' },

    // R drop: i1 (how he paid): the title says it ("Drains His Savings Account"), 90 % blind (V1/V2); p1 keeps the line
    // R fix: the key was the only choice that fit a joke about the title (80 % blind); now joke / regret / real question
    // why: regrets ← spending everything sounds like a confession; asks Joey ← the question form taken as a real
    //   question (a Japanese reading of every ? as a question)
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'savings', reveals: ['age'], seg: [36.5, 41.8],
      stem: 'What does Chandler’s “who needs…?” question do?',
      choices: ['Jokes that losing his savings doesn’t matter', 'Admits he regrets losing all his savings',
                'Asks whether Joey keeps a savings account'], a: 0,
      cue: '質問の形だが、答えを待っているか。',
      line: 'I mean, *who needs* a savings account?',
      said: '「貯金なんて誰が要るの？」と、軽い調子で問いかける。',
      mean: '答えを求めない問いかけ（反語）。「要らない」と言い切って、お金の心配を笑い飛ばしている。',
      trap: '疑問文はつい本当の質問と取りやすい。返事を待たずに話が進むなら、反語のサイン。',
      use: 'Who needs sleep anyway?（睡眠なんて要らないよね）' },

    // R fix: the stem quoted the marker under test, and "means it seriously" was a filler (60 % blind)
    // why: takes back ← "I mean" as a self-repair (also common); new topic ← the jump from age to savings sounds
    //   like a change of subject
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['savings', 'age'], seg: [36.5, 41.8],
      stem: 'Right after giving his age, what does Chandler’s next short phrase do?',
      choices: ['Explains why his age is the answer', 'Takes back the age he just gave',
                'Moves on to a different topic'], a: 0,
      cue: '年齢のすぐあと、文頭の短いつなぎ。',
      line: 'I’m 29. *I mean*, who needs a savings account?',
      said: '「29だし。だってさ、貯金なんて要らないでしょ」と続ける。',
      mean: 'I mean ＝「つまり」「だってさ」。前の一言に理由を足している。訂正ではない。',
      trap: 'I mean は言い直しにも使うが、ここは29を取り消していない。前と後がつながっていれば補足。',
      use: 'It’s cheap. I mean, it’s only ten bucks.（安いよ。だって10ドルだし）' },

    // R fix: "dislikes the changes" and "wants more" were fillers (70 % blind); the words settle the tone (he insists
    //   and adds reasons), so its ear check is gone
    // why: teasing ← "best friend anyone has ever had" is over the top; politely ← a thank-you said because it's
    //   expected (the Japanese お礼の決まり文句 frame)
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'best', seg: [41.5, 51.5],
      stem: 'How does Joey mean his “best friend” line?',
      choices: ['Sincerely; he is grateful for all of it', 'Jokingly; he is teasing Chandler for overdoing it',
                'Politely; he is only saying what is expected'], a: 0,
      cue: 'Chandler が否定したあと、もう一度言い直すところ。',
      line: 'You are the *best friend anyone has ever had*. … No, no, no. *You are.*',
      said: '「君は史上最高の友だちだ」と言い、否定されると「いや、そうだよ。助言もくれるし」と重ねる。',
      mean: '本気で感謝している。',
      trap: '大げさな言い方は冗談や社交辞令にも聞こえる。否定されても言い張り、理由まで足すのは本気のサイン。',
      use: 'You’re the best. Seriously.（ほんと最高だよ）' },

    // R fix: the stem quoted the phrase whose meaning is the key, and "big compliment" pointed at it (70 % blind)
    // why: no answer ← "I don't know" read literally (分からない); doubts ← the money talk just before + "I don't
    //   know" as hesitation
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'dontknow', reveals: ['best'], seg: [41.5, 49.0],
      stem: 'What does Chandler’s short reply to Joey’s line do?',
      choices: ['Plays down Joey’s praise', 'Says he has no answer to that', 'Doubts that the gifts were wise'],
      a: 0,
      cue: 'ほめられた直後の、短い返事。',
      line: '*Oh, I don’t know.*',
      said: '最高の友だちと言われて、「いや、どうかな」と返す。',
      mean: 'ほめ言葉を受け流す決まった返し。直後にジョーイが「いや、そうだよ」と押し返す。',
      trap: 'I don’t know を「分からない」と文字通りに取りやすい。ほめられた直後なら、照れや遠慮の返事。',
      use: 'Oh, I don’t know about that.（いやあ、それはどうかな）' },

    // R fix: "when you said yesterday" isn't grammatical (no object), so it was out; 3 choices now
    // why: what he / what she ← the y of "you" melts into the t (ワチュ), so the pronoun blurs
    { id: 's2', skill: 'sound', level: 'B2', point: 'whatyou', reveals: ['advice'], seg: [51.0, 55.9],
      stem: 'Fill the gap: “I was thinking about ___ said yesterday.”',
      choices: ['what you', 'what he', 'what she'], a: 0,
      cue: '「thinking about」のすぐあと、つながる2語。',
      line: 'I was thinking about *what you* said yesterday about focusing on one woman.',
      said: '「昨日君が言った、一人の女性に絞るって話を考えてたんだ」。',
      mean: 'what you の t と y がつながって「ワチュ」になる。',
      trap: 'ワチュの「チュ」を you と結びつけにくく、he や she に聞こえやすい。t＋y は「チュ」と覚える。',
      use: 'I liked what you said earlier.（さっき言ってたこと、良かったよ）' },

    // R fix: the key was the only choice about choosing (60 % blind); "focus" now also in a distractor. The stem
    //   says Chandler gave the advice, so it reveals s2's "what you"
    // why: acting ← "focusing" in the wrong relation (focus on work); both women ← two names come up right after
    { id: 'd2', skill: 'detail', level: 'B1', point: 'advice', reveals: ['whatyou'], seg: [51.0, 57.3],
      stem: 'What advice did Chandler give Joey yesterday?',
      choices: ['To focus on just one woman', 'To focus on his acting for now', 'To be honest with both women'], a: 0,
      cue: '「yesterday」のすぐあと。',
      line: 'what you said yesterday about *focusing on one woman*',
      said: '昨日の助言は「一人の女性に絞れ」。ジョーイは「そうするよ」と言う。',
      mean: 'focus on ～ ＝ 〜に集中する、〜に絞る。',
      trap: 'このあと女性の名前が2つ出てくるので「二人とも」に引かれやすい。名前の前に助言の中身を聞く。',
      use: 'Let’s focus on one thing at a time.（一つずつやろう）' },

    // R fix: "focus" echoed the line and the key was the only choice about people (75 % blind); now three topics the
    //   first half sets up
    // why: repay ← "you give me the great advice" sounds like Joey wants to return the favor; save money ← the
    //   savings joke just before
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene2', reveals: ['whatyou', 'advice'], seg: [51.0, 81.5],
      stem: 'What is the second half of the scene mostly about?',
      choices: ['Which woman Joey will date', 'How Joey can repay Chandler',
                'How Chandler will save money again'], a: 0,
      cue: '「Hey, listen」から話題が変わるところ。',
      line: 'And, *hey, listen*, I was thinking about what you said yesterday…',
      said: '「ねえ、聞いて」と話題を変え、昨日の助言どおり一人に絞ると言う。',
      mean: '後半は、Kathy と Casey のどちらにするかのやり取り。',
      trap: '直前のお金の話が印象に残るが、hey, listen で話題が切り替わる。合図の言葉を聞く。',
      use: 'Hey, listen, about tomorrow…（ねえ、明日のことなんだけど）' },

    // R new: infer, to replace i1 (two adjacent lines tied: "focus on one woman" + "with Kathy")
    // why: only her ← "Casey" is the name in the question just before; now and then ← "see how things go" read as
    //   keeping options open
    { id: 'i3', skill: 'infer', level: 'B2', point: 'plan', reveals: ['advice'], seg: [51.2, 62.1],
      stem: 'From Joey’s plan, what will happen with Casey?',
      choices: ['He will stop seeing her', 'He will start dating only her', 'He will see her now and then'], a: 0,
      cue: '「一人に絞る」と、そのあとに出る名前。',
      line: 'about *focusing on one woman*. I’m gonna do that. … I’m gonna see how things go *with Kathy*.',
      said: '昨日の「一人に絞れ」を実行すると言い、相手は Kathy だと答える。',
      mean: 'Kathy に絞るなら Casey とは会わなくなる。口には出していない。',
      trap: 'Casey の名前に引かれやすい。No, no, no のあとの名前で絞る相手が決まる。',
      use: 'I’m going to focus on one thing.（一つに絞るよ）' },

    // R fix: the stem quoted the phrase whose meaning is the key (85 % blind); it now names the moment
    // why: ask her ← "how things go" heard as the greeting How's it going?; calls back ← "see" read as waiting to
    //   find out
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'seehow', reveals: ['plan'], seg: [57.0, 63.0],
      stem: 'After “No, no, no”, what does Joey say he’ll do with Kathy?',
      choices: ['Keep dating her and see what happens', 'Ask her how things are going lately',
                'Wait to see if she calls him back'], a: 0,
      cue: '「I think I’m gonna」のあとの言い方。',
      line: 'I think I’m gonna *see how things go* with Kathy.',
      said: '「Kathy とどうなるか様子を見る」。',
      mean: 'see how things go ＝ しばらく続けて成り行きを見る。',
      trap: 'how things go をあいさつの How’s it going と取るとずれる。全体で一つの表現。',
      use: 'Let’s just see how things go.（とりあえず様子を見よう）' },

    // R fix: "fairly cool" was the one odd paraphrase beside two clip words (50 % blind); all three are paraphrases now
    // why: very pretty ← "pretty" read as かわいい, not "fairly"; a bit cold ← cool/cold near sound
    { id: 'd3', skill: 'detail', level: 'B2', point: 'cool', seg: [57.0, 63.0],
      stem: 'What does Joey say about Kathy?',
      choices: ['She is quite nice', 'She is very pretty', 'She is a bit cold'], a: 0,
      cue: 'Kathy の名前のすぐあとの短い一言。',
      line: 'She’s *pretty cool*.',
      said: '「彼女、けっこういい感じなんだ」。',
      mean: 'pretty は形容詞の前で「けっこう・かなり」。cool ＝ いい感じ、感じがいい。',
      trap: 'pretty を「かわいい」と取りやすい。形容詞の前なら「けっこう」。cool と cold は母音で聞き分ける。',
      use: 'The hotel was pretty nice.（ホテル、けっこう良かったよ）' },

    // why: both ← the two names keep alternating; Kathy for good ← "Kathy" is the name repeated most
    { id: 'i2', skill: 'infer', level: 'C1', point: 'casey', seg: [57.0, 69.8],
      stem: 'Across this back-and-forth, what does Chandler want Joey to do?',
      choices: ['Choose Casey rather than Kathy', 'Keep seeing both Kathy and Casey', 'Settle down with Kathy for good'],
      a: 0,
      cue: 'Joey が名前を言うたびに、相手が何を足すか。',
      line: 'Or *Casey*. … Could be *Casey*. … *Consider Casey*.',
      said: 'Joey が Kathy と言うたびに、Chandler は「Casey もありかも」と返す。',
      mean: 'はっきり頼まずに、何度も Casey を勧めている。',
      trap: '名前が交互に聞こえるので「両方」と取りやすい。誰がどちらの名前を言うか、声で追う。',
      use: 'Have you considered the train instead?（電車って手もあるよ）' },

    // R fix: the seg stopped before Chandler's sarcastic answer, the only evidence against "seen through" (S4); it
    //   now runs to 80.8 (from 65.8, to stay ≤ 15 s) and reveals a2's point. Choices rebalanced (70 % blind)
    // why: sees what he's hiding ← "I think somebody's got a crush" sounds like Joey catching on;
    //   likes Casey himself ← "somebody" read as Joey talking about himself
    { id: 'h1', skill: 'humor', level: 'C1', point: 'crush', reveals: ['casey', 'fixup', 'pieces'], seg: [65.8, 80.8],
      stem: 'Why is Joey’s “You know what I think?” conclusion funny?',
      choices: ['He gets Chandler’s hints exactly backwards', 'He finally sees what Chandler is hiding',
                'He admits he likes Casey himself'], a: 0,
      cue: '「somebody’s got」の somebody が誰を指すか。',
      line: 'I think *somebody’s got a little crush on Casey*.',
      said: '「誰かさん、Casey に気があるな」と言い、二人をくっつけようと申し出る。',
      mean: 'Casey を勧める理由を、本人が好きだからだと読み違えている。',
      trap: 'somebody は目の前の相手をぼかして指す言い方。Joey 自身の話ではない。',
      use: 'Somebody’s in a good mood today.（誰かさん、今日はご機嫌だね）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'fixup', seg: [73.2, 75.6],
      stem: 'Type Joey’s offer: “How about I ___?” (4 words)', answer: 'fix you two up',
      cue: '「How about I」のあと、つながる4語。',
      line: 'How about I *fix you two up*?',
      said: '「二人を紹介してあげようか？」と聞いている。',
      mean: 'fix you がつながって「フィクシュー」、two up も「トゥーアップ」と一続きになる。',
      trap: 'two を to と取ると語数が合わなくなる。you two ＝「君たち二人」とまとめて聞く。',
      use: 'Let me introduce you two.（二人を紹介させて）' },

    // R fix: the stem quoted the phrase whose meaning is the key (85 % blind); it now names the moment
    // why: make up ← fix read as mending a relationship (仲直り); repair ← fix read literally (修理)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'fixup', reveals: ['crush'], seg: [73.2, 76.75],
      stem: 'What does Joey offer just before “What do you think?”',
      choices: ['To set the two of them up on a date', 'To help the two of them make up',
                'To repair something for both of them'], a: 0,
      cue: '「crush on Casey」と言った直後の提案。',
      line: 'How about I *fix you two up*?',
      said: '「二人の仲を取り持ってあげようか？」と申し出る。',
      mean: 'fix A up (with B) ＝ 恋人候補として紹介する、デートをセッティングする。',
      trap: 'fix を「直す・仲直りさせる」と取りやすい。恋愛の話で fix up と来たら「紹介する」。',
      use: 'Can you fix me up with someone?（誰か紹介してくれない？）' },

    // R fix: "likes the idea of a date" was the weak one (65 % blind); now a plain yes to meeting Casey
    // why: happy to meet her ← he answers Joey's offer, so it sounds like a yes; teasing back ← Joey has just teased
    //   him ("somebody's got a crush"), so a playful comeback is the sitcom script
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'pieces', reveals: ['savings', 'casey'], seg: [73.2, 81.5],
      stem: 'How does Chandler mean his answer to “What do you think?”',
      choices: ['Sarcastically; his plans are going badly', 'Sincerely; he is happy to meet Casey',
                'Playfully; he is teasing Joey right back'], a: 0,
      cue: '「What do you think?」への答えの言い方と中身。',
      line: 'That all the pieces of my life are *falling right into place*.',
      said: '「人生のピースが全部ぴたりとはまっていく感じだよ」と答える。',
      mean: '貯金はなく、Casey を勧めたのは裏目に出た。最悪の状況を「順調」と言う皮肉。',
      trap: '言葉だけなら前向きな返事。直前の流れと合わないほど良い言葉は、皮肉のサイン。',
      use: 'Oh, great. Just what I needed.（あーあ、最高だね）' },
  ]
};
