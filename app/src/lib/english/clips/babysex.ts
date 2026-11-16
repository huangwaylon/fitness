// “Ann and Chris Are Having a... | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Ann and
// Chris can't read the doctor's note with their baby's sex on it, track him down at home at dawn, and get the answer.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: Ann's list at 7–12 s ("acorn"
// line), Jean-Ralphio's come-ons (67–87 s) and the TV-bill lines (105–117 s). The misread note at 31–38 s ("Smurf",
// "11-joule toilet") differs in every word between the two transcripts, so nothing is built on it. Nothing turns on
// "Yes!" (143 s) or "Me too" (148 s), which only whisper has.
// REVIEW 2026-11-16: pass 6, fix 14, drop 0, new 0; ear checks 0
// REVIEW open: no C2 (native-tier) items yet; GUIDE-v2 §10 asks for 2–4 per bank (an author task).
// REVIEW open: "Me too" at 148.3 s (whisper; captions "hey") decides whether both admit wanting a boy. g1's key says
// "their 'no preference' falls apart", which holds either way, so it isn't an ear check.
// REVIEW: the two ear checks went (x1 and s1: both transcripts agree on the words).
import type { Clip } from '../types.ts';

export const babySex: Clip = {
  id: 'babysex', video: '5KuiOGNpa-0', title: 'Ann and Chris Are Having a...', dur: 172, wpm: 173, band: 'fast',
  tags: ['家', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: S4 — seg ended inside "Toy trucks" (captions 6.96 s); now 7.1.
    // why: sports ← the usual dad-and-son script; his name ← "pass that on" read as passing on a name
    { id: 'd1', skill: 'detail', level: 'B1', point: 'shave', seg: [0, 7.1],
      stem: 'Why would Chris be thrilled to have a boy?',
      choices: ['He could teach him how to shave', 'He could teach him to play sports', 'He could pass his name on to him'],
      a: 0,
      cue: '「I have perfected」のあと。', line: 'I have perfected the art of *shaving the human face*… pass that on.',
      said: '男の子なら嬉しい。ひげそりの技をきわめたので、それを伝えたいと言う。',
      mean: 'pass on ＝ 次の世代に伝える。何を伝えるかは前の文にある。',
      trap: 'pass that on を「名前を継ぐ」と取りやすい。that が指すのは直前の技。',
      use: 'My dad passed his recipe on to me.（父がレシピを伝えてくれた）' },

    // R fix: V2 — "forgot to send them the result" was easy to strike (blind 60 %); new B keeps the note in the story.
    // why: lost it ← the note is talked about, then they're at his door; told to come ← a home visit read as planned
    { id: 'g2', skill: 'gist', level: 'B1', point: 'writing', seg: [19.0, 62.2],
      stem: 'Why do Ann and Chris end up going to the doctor that morning?',
      choices: ['They can’t make out what he wrote', 'They lost the note he gave them',
                'He told them to come by for it'], a: 0,
      cue: '紙を読もうとする場面と、朝の玄関での説明。',
      said: '医者のメモが読めず、本人は今日休み。翌朝早く家まで行って事情を話す。',
      mean: '問題は結果がないことではなく、字がひどくて読めないこと。',
      trap: '医者の家に行くので「呼ばれた」と取りやすい。couldn’t read your writing が理由。',
      use: 'I can’t read your handwriting.（あなたの字が読めない）' },

    // R fix: V2 — "the wrong page of notes" was a filler (blind 65 %); new C is the nerves the scene is full of.
    // why: wrong word ← "distributions" said twice, read as what was written; nerves ← "are you ready" + the build-up read as the cause
    { id: 'i1', skill: 'infer', level: 'B2', point: 'distrib', reveals: ['writing'], seg: [19.0, 30.8],
      stem: 'Why does the first reading of the note come out so oddly?',
      choices: ['The scrawl makes one word look like another', 'The doctor wrote down the wrong word by mistake',
                'They are too nervous to read it properly'], a: 0,
      cue: '最初の読みと、もう一人が読み直した語。',
      line: 'We are having a… *distributions*. — Let me see that. — It says *congratulations*, I think.',
      said: '一人が distributions と読み、もう一人が congratulations だと読み直す。',
      mean: '字が崩れて、似た形の別の語に見えている。',
      trap: '2回くり返すので書いてある語だと思いやすい。直後の読み直しで判断。',
      use: 'I think it says “Main Street”?（「Main Street」って書いてあるのかな）' },

    // R fix: N/B — the choices said "He", but the audio doesn't settle who calls Domino's; now no speaker is named.
    // why: doctor's office / home ← "restaurant" missed, so pizza is sent somewhere ordinary
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dominos', seg: [42.0, 46.7],
      stem: 'Why is the call to Domino’s funny?',
      choices: ['The pizza is to come to a restaurant', 'The pizza is to come to the doctor’s office',
                'The pizza is to come to their home'], a: 0,
      cue: '「I think Domino’s delivers」のあと。', line: 'I’m calling Domino’s. I think Domino’s delivers… *this restaurant*. I hope so.',
      said: '一人が医者に電話し、もう一人はピザを頼む。「このレストランにも届けてくれると思う」。',
      mean: '食事の店にいるのにピザを頼む。ストレスでおかしな行動に出ている。',
      trap: 'Domino’s で配達先を家と思いやすい。this restaurant が今いる場所。',
      use: 'Do you deliver to this address?（この住所に配達できますか）' },

    // why: week ← day/week both end the phrase; this morning ← "out" read as "out right now"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'out', reveals: ['writing'], seg: [46.0, 49.6],
      stem: 'What do they learn when they call the doctor?',
      choices: ['He is out for the rest of the day', 'He is out for the rest of the week',
                'He is out until later this morning'], a: 0,
      cue: '「Oh no」のあと、最後の一語。', line: 'Oh no, he’s *out for the rest of the day*.',
      said: '電話すると、先生は今日はもう戻らないと言われる。',
      mean: 'be out ＝ 不在。the rest of the day ＝ 今日の残り全部。',
      trap: 'day と week は最後の一語だけの差。rest of the のあとを聞く。',
      use: 'She’s out for the rest of the day.（彼女は今日はもう戻りません）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'stressed', seg: [49.1, 53.8],
      stem: 'Type the end: “I have literally never been more ___.” (2 words)', answer: 'stressed out',
      cue: '「never been more」のあと、最後の2語。', line: 'I have literally never been more *stressed out*.',
      said: '「本当に、こんなにストレスを感じたことはない」と言う。',
      mean: 'stressed out ＝ ひどく参っている。stressed だけより強い。',
      trap: 'stressed の d は out とつながり「ストレスタウ」に聞こえる。2語で1つと覚える。',
      use: 'I’m so stressed out about work.（仕事でかなり参ってる）' },

    // R fix: V2 — "Happy to help them at any hour" was easy to strike (blind 65 %); new C reads the question as amused.
    // why: worried ← a doctor at the door at dawn suggests bad news; amused ← "possibly" read as playful
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'early', reveals: ['could'], seg: [55.3, 59.0],
      stem: 'How does the doctor greet Ann and Chris at his door?',
      choices: ['Annoyed at being bothered so early', 'Worried something is wrong with the baby',
                'Amused that they are so eager to know'], a: 0,
      cue: '最初の質問の、強く言う語と時間。', line: 'What could you *possibly* need at *six in the morning*?',
      said: '「朝6時にいったい何の用だ」と聞く。',
      mean: 'possibly を強めて、迷惑だという気持ちを出している。質問の形の文句。',
      trap: '医者なので心配していると取りやすい。possibly と時間の強調でいら立ちが分かる。',
      use: 'What could you possibly want now?（今度はいったい何？）' },

    // why: would ← "could" and "would" differ in one weak sound; can ← present-tense reading of the same question
    // R fix: B1 — the stem's "at six in the morning" backs a1's key; now reveals 'early'.
    { id: 's1', skill: 'sound', level: 'B2', point: 'could', reveals: ['early'], seg: [55.3, 59.0],
      stem: 'Fill the gap: “What ___ need at six in the morning?”',
      choices: ['could you possibly', 'would you possibly', 'can you possibly'], a: 0,
      cue: 'What のあと、とても短い2語。', line: 'What *could you possibly* need at six in the morning?',
      said: '朝早く来た2人に、いったい何の用かと聞いている。',
      mean: 'could you は「クッジュ」とつながる。possibly と組むと「いったい」。',
      trap: 'could と would は最初の音しか違わず、can は母音が違う。出だしを聞く。',
      use: 'Who could possibly be calling now?（今ごろいったい誰から？）' },

    // R fix: V2 — "the note must be fake" was a filler (blind 60 %); new C turns the joke on the couple.
    // why: nurse ← blaming someone else is the usual move; teases them ← "Just read that" read as the target of his joke
    { id: 'h2', skill: 'humor', level: 'C1', point: 'chicken', reveals: ['writing'], seg: [87.0, 93.8],
      stem: 'Why is the doctor’s comment on the note funny?',
      choices: ['He mocks the writing as if it weren’t his', 'He blames a nurse for the messy note',
                'He teases them for not being able to read'], a: 0,
      cue: '「Wow」のあと、だれが書いたかの言い方。',
      line: 'It looks like *the chicken that wrote this* had a stroke on the paper.',
      said: 'メモを見て、「書いたニワトリが紙の上で倒れたみたいだ」と言う。',
      mean: '書いたのは本人なのに、人ごとのようにけなしているのがおかしい。',
      trap: '他の人のせいにしていると取りやすいが、だれの名前も出していない。',
      use: 'Sorry, my handwriting is terrible.（ごめん、字が汚くて）' },

    // why: office ← "We'll go down to my office" read as the reason; surprise ← a doctor keeping the result for a reveal
    { id: 'i2', skill: 'infer', level: 'B2', point: 'remember', seg: [93.7, 98.4],
      stem: 'Why doesn’t the doctor just tell them the answer?',
      choices: ['He isn’t sure and doesn’t want to get it wrong', 'He wants them to hear it at his office',
                'He wants to keep it a surprise a bit longer'], a: 0,
      cue: '「kind of」と、but のあと。',
      line: 'I *kind of* remember, *but I don’t want to say anything that’s wrong*.',
      said: '「なんとなく覚えてるけど、違うことを言いたくない」と言う。',
      mean: 'kind of ＝ はっきりではない。確かめてから言いたい。',
      trap: 'このあと office の話が出るが、それは確かめに行くため。理由は but のあと。',
      use: 'I kind of remember, but I’m not sure.（なんとなく覚えてるけど自信ない）' },

    // R fix: V2 — the key was the middle of three (blind 50 %); a fourth, "1 minute", comes from the stock "give me a
    // minute".
    // why: 1 ← the stock "give me a minute"; 5 ← "fifteen" heard without "fif-"; 50 ← -teen/-ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifteen', seg: [98.2, 102.3],
      stem: 'How long does the doctor ask them to wait?',
      choices: ['1 minute', '5 minutes', '15 minutes', '50 minutes'], a: 2, keep: true,
      cue: '「Give me」のあとの数。', line: 'Give me *15 minutes*. I will get dressed.',
      said: '「15分くれ。着替えて、診療所に行こう」と言う。',
      mean: 'Give me ＋ 時間 ＝ それだけ待って。すぐ動くという返事。',
      trap: 'fifteen は後ろの teen を強く、fifty は前を強く言う。強い所で聞き分ける。',
      use: 'Give me ten minutes to get ready.（準備に10分ちょうだい）' },

    // why: that's all ← literal "this is all there is"; right one ← "it" read as an object being pointed at
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'thisisit', seg: [117.0, 120.6],
      stem: 'In the office, how does the doctor open the big moment?',
      choices: ['By saying the moment has come', 'By saying that is all he knows', 'By saying he found the right file'],
      a: 0,
      cue: '「Well」のあと、短い3語。', line: 'Well, *this is it*, the final moment.',
      said: '「さあ、いよいよだ。最後の瞬間」と言う。',
      mean: 'this is it ＝ いよいよその時が来た。大事な瞬間の前の決まり文句。',
      trap: '「これだけ」「これがそれ」と文字通りに取りやすい。続く final moment が手がかり。',
      use: 'This is it, guys. Good luck!（いよいよだ。みんな頑張って）' },

    // R fix: V2 — the key was the only twist (blind 60 %); B now has a twist too, and C is the calm the couple promised.
    // why: girl ← the title's cliffhanger, with "wanted it to be a boy" heard; calm ← the earlier "happy either way" taken at its word
    { id: 'g1', skill: 'gist', level: 'B2', point: 'reveal', reveals: ['preference'], seg: [117.0, 160.6],
      stem: 'How does the big moment in the office go?',
      choices: ['It’s a boy, and their “no preference” falls apart', 'It’s a girl, and one admits wanting a boy',
                'It’s a boy, and both stay as calm as they promised'], a: 0,
      cue: '発表の前の約束と、発表直後のやりとり。',
      said: '2人とも「どちらでもいい」と言うが、男の子と聞くと、本当は男の子を望んでいたと分かる。',
      mean: '建前と本音のずれが笑いになる場面。',
      trap: '発表前の言葉だけを信じると「気にしない」になる。発表後の反応で判断。',
      use: 'So much for not caring!（気にしないって言ってたのに！）' },

    // R fix: S4 — seg ended inside "Me too" (whisper 126.2 s); now 126.1.
    { id: 'x2', skill: 'dict', level: 'B1', point: 'either', seg: [120.6, 126.1],
      stem: 'Type the end: “I will honestly be happy ___.” (2 words)', answer: 'either way',
      cue: '「happy」のあと、最後の2語。', line: 'I will honestly be happy *either way*.',
      said: '何を望むかと聞かれ、「正直、どっちでも嬉しい」と答える。',
      mean: 'either way ＝ どちらになっても。男の子でも女の子でも、の意味。',
      trap: 'either は「イーザー」とも「アイザー」とも言う。どちらも同じ語と覚えておく。',
      use: 'Tea or coffee? Either way is fine.（紅茶でもコーヒーでもいいよ）' },

    // R fix: V2 — "a little bored by the wait" was easy to strike (blind 55 %); new C is the "final moment" read as relief.
    // why: nervous ← "it doesn't matter" read as worry about health; relieved ← "the final moment" read as the end of a wait
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'greatest', seg: [126.2, 134.2],
      stem: 'How does the second one to answer feel about the baby?',
      choices: ['Thrilled and sure it will be amazing', 'Nervous that it might not be healthy',
                'Relieved that the wait is finally over'], a: 0,
      cue: '「Boy or girl」のあと、because から。',
      line: 'it doesn’t matter because it will *literally be the greatest child who’s ever lived*.',
      said: '「男でも女でも関係ない。史上最高の子になるんだから」と言う。',
      mean: '大げさな言い方で、期待でいっぱいなのが分かる。',
      trap: 'doesn’t matter を「関心がない」と取りやすい。because のあとが本当の気持ち。',
      use: 'Either way, it’s going to be great.（どっちにしても最高になるよ）' },

    // R fix: V2 — the key was the only dodge (blind 50 %); "By swearing there is none" is now a second dodge, laughing it
    // off, so the choice turns on the one-word "You?".
    // why: laughs it off ← Japanese frame: a dodge by laughing; admits ← the ending read back into this moment
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'you', seg: [134.0, 139.3],
      stem: 'When asked to swear there’s no preference, how does the other reply first?',
      choices: ['By turning the question back', 'By laughing the question off', 'By admitting a wish for a boy'],
      a: 0,
      cue: '「preference」のすぐあと、一語だけの返事。',
      line: 'You swear you have no preference? — *You?* — Not at all.',
      said: '「本当に希望はないって誓える？」と聞かれ、答えずに「そっちは？」と返す。',
      mean: '質問を返すのは、答えたくないときのよくあるかわし方。',
      trap: '答えをかわすなら笑ってごまかすとも考えやすい。最初の返事は一語の You? で、質問を返している。',
      use: 'What about you?（あなたはどうなの？）' },

    // why: neither cared ← the earlier "happy either way" taken at face value; a girl ← "preference" heard, "boy" missed
    { id: 'i3', skill: 'infer', level: 'B2', point: 'preference', seg: [142.3, 148.0],
      stem: 'What does the exchange right after the result show?',
      choices: ['One had been hiding a wish for a boy', 'Neither had really cared either way',
                'One had been hoping for a girl'], a: 0,
      cue: '「I thought」で始まる文と、その答え。',
      line: 'I thought you didn’t have a preference. — … I just *really wanted it to be a boy*.',
      said: '「希望はないって言ったよね」と言われ、「本当は男の子がよかった」と認める。',
      mean: 'さっきの「どっちでもいい」は建前だった、と分かる。',
      trap: '前の either way をそのまま信じると「気にしていない」になる。結果のあとの本音を聞く。',
      use: 'Honestly, I really wanted to win.（正直、本当に勝ちたかった）' },

    // R fix: V2/K6 — the key was the only one with quote marks and two parts (blind 55 %); now three parallel offers.
    // seg ended inside "I ask all my patients"; now 160.5.
    // why: baby ← "adopting" read as a baby; more than one ← "children" read as the couple wanting more
    { id: 'h3', skill: 'humor', level: 'C1', point: 'adopt', reveals: ['twenties'], seg: [150.3, 160.5],
      stem: 'Why is the doctor’s offer funny?',
      choices: ['He tries to hand off his grown kids, whom he dislikes', 'He offers them a baby that needs a good home',
                'He hints that they should have more than one child'], a: 0,
      cue: '「adopting」のあとの2つの短い文。',
      line: 'Would you be interested in *adopting my children*? They’re in their late 20s. *They’re terrible.*',
      said: '「うちの子を養子にどう？20代後半で、ひどいんだ」と言う。',
      mean: '養子といえば赤ちゃんなのに、大人で手を焼いている子を押しつけようとしている。',
      trap: 'adopt から赤ちゃんを思い浮かべやすい。年齢と terrible で中身が分かる。',
      use: 'Would you be interested in joining us?（一緒にどうですか）' },

    // why: late teens ← "late" heard, "20s" lost; early 20s ← "20s" heard, "late" missed
    { id: 'n2', skill: 'number', level: 'B1', point: 'twenties', seg: [151.5, 156.6],
      stem: 'How old does the doctor say his children are?',
      choices: ['In their late teens', 'In their early 20s', 'In their late 20s'], a: 2, keep: true,
      cue: '「They’re in their」のあと。', line: 'They’re in their *late 20s*. They’re terrible.',
      said: '自分の子を養子にしないかと聞き、「20代後半で、ひどいんだ」と付け足す。',
      mean: 'late 20s ＝ 27〜29歳くらい。もう大人だと分かる。',
      trap: 'late と early は最初の語、teens と 20s は最後の語。両方を聞く。',
      use: 'She’s in her early thirties.（彼女は30代前半だよ）' },

    // R fix: V2 — "Shall we go now, then?" was easy to strike (blind 50 %); new C is a polite deferral. seg ended inside
    // "I ask all my patients"; now 160.5.
    // why: don't want to go ← "go" read literally; too soon ← Japanese frame: a no read as "not yet"
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'nogo', seg: [155.6, 160.5],
      stem: 'After they both say “No,” what does the doctor’s short reply mean?',
      choices: ['So that’s a no, then?', 'You don’t want to go?', 'Too soon to say, then?'], a: 0,
      cue: '2人の No のすぐあと、短い2語。', line: '— No. — *No go?*',
      said: '2人に断られ、「だめ？」と軽く確かめる。',
      mean: 'no go ＝ だめ、うまくいかない。場所に行く話ではない。',
      trap: 'go を「行く」と取りやすい。No のあとの確かめなので、断りの確認。',
      use: 'I asked for a discount. No go.（値引きを頼んだけどだめだった）' },
  ]
};
