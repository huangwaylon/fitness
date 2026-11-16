// “Ron hates accountant humour | Parks and Recreation” (the official Parks and Recreation channel, Season 7): the
// friends pitch April to Barney's accounting firm for its new consulting wing, plan a presentation, win a meeting,
// and then April turns the job down.
// Segments from the captions, words from whisper (2026-11-16). Ben and Barney are named in the audio; the other
// speakers never are, so stems say “one friend”, “the speaker” and no key rests on who they are. Untested on purpose:
// 26–29 s (“Dad” in the captions, “Ted!” in whisper), 65 s (“the summer off” in whisper, “the Summer's offices” in the
// captions), 82–90 s (“Huh? What do you say?… Oh, Ben. That was amazing.”: whisper only), 168–176 s (“anything Andy
// did”: backstory).
// EAR CHECK: 45.9–46.4 s nt1 — the six words “why don't you go ahead and” in about 0.6 s (both sources agree on the
//   words; the item claims they run together)
// EAR CHECK: 106.1–108.3 s x1 s1 — “give her” with the h dropped (“giver”), and the flapped t in “not as” (“nadas”)
// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 2
// REVIEW open: at1's segment ends at 28.2 s, between "They like me here" and "you gotta hear this" (0.5 s after
//   "here" would cut "gotta"); check that it doesn't end mid-word on the phone
import type { Clip } from '../types.ts';

export const ronHumour: Clip = {
  id: 'ronhumour', video: 'f2n5sDlImNg', title: 'Ron hates accountant humour', dur: 242, wpm: 143, band: 'slow',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — the key was the only specific choice ("consulting wing"); all three now name a concrete ask
    // why: Ben rehired ← the staff greet Ben like a returning star; April's money ← "finances" is said, about
    //   the Grizzle deal
    { id: 'g1', skill: 'gist', level: 'B2', point: 'pitch', seg: [4.3, 41.6],
      stem: 'Why have they all come to see Barney at the firm?',
      choices: ['To get April hired for a new part of the firm', 'To get Ben rehired at his old desk there',
                'To get the firm to handle April’s money'], a: 0,
      cue: '終わりの「we just think that」のあと。',
      line: 'we just think that *April would be a great hire*.',
      said: 'April を新しい相談部門で雇ってほしいと、Barney に頼みに来た。',
      mean: 'hire ＝ 採用する人。訪問の目的は April の売りこみ。',
      trap: 'Ben が大歓迎されるので Ben の話に聞こえやすい。目的は we just think のあと。',
      use: 'I think she’d be a great hire.（彼女はきっといい人材です）' },

    // R fix: V2 + tone — the key was the only warm choice; now "tense" (the shout read as a warning) and "unsure"
    //   (the name mix-up) compete, and the segment runs on to "They like me here", which settles it in words
    // why: tense ← "Ben is here!" shouted to the back sounds like a warning that the boss has come; unsure ← the
    //   staff call him by the wrong name ("Ted!/Dad") in between
    { id: 'at1', skill: 'attitude', level: 'B1', point: 'welcome', seg: [13.4, 28.2],
      stem: 'How do the people at the firm react when Ben walks in?',
      choices: ['Thrilled, like a favorite is back', 'Tense, like a boss has walked in',
                'Unsure, like they half know him'], a: 0,
      cue: '名前を何回、誰に向かって呼んでいるか。',
      line: '*Ben! Ben is here.* Hi, Ben. … *Ben is here!* … *They like me here.*',
      said: 'Ben に気づいて名前を呼び、奥の同僚にも「Ben が来た！」と知らせる。',
      mean: '何度も呼んで周りに知らせるのは、大歓迎のしるし。',
      trap: '奥へ叫ぶのは警告にも聞こえるが、Hi, Ben と明るく続き、本人も They like me here と言う。',
      use: 'Hey, everyone! Mike is here!（みんな、マイクが来たよ！）' },

    // R fix: V2 — the key named "actually", the very word the pun bends; all three now describe a move, none
    //   quotes it
    // why: mocks accountants ← the title says Ron hates this humor, so it can sound like a dig; keeps a distance ←
    //   the Japanese frame: stiff, formal words read as 距離を置く
    { id: 'h1', skill: 'humor', level: 'C1', point: 'pun1', seg: [18.8, 24.0],
      stem: 'In the reply to the welcome, what is the odd word choice doing?',
      choices: ['Bending an everyday word into an accounting one', 'Mocking the dull, fussy way accountants talk',
                'Using a stiff, formal word to keep his distance'], a: 0,
      cue: '「very good」の直前の、長くて聞きなれない一語。',
      line: 'Hey, it is *actuarially* very good to see you guys.',
      said: '「やあ、会えて actuarially とてもうれしい」とあいさつする。',
      mean: 'actually を会計の専門語（保険数理的に）に変えたしゃれ。',
      trap: '堅い語は距離の印に聞こえやすいが、相手は会計士。相手の業界の言葉は親しみの冗談。',
      use: 'It’s statistically likely I’ll be late.（統計的に見て、遅れる可能性大）' },

    // why: internship ← the visit is about a job, so an earlier application seems likely; consulting ← "consulting
    //   wing" is said right after
    { id: 'd1', skill: 'detail', level: 'B2', point: 'grizzle', seg: [30.5, 41.6],
      stem: 'How is April already connected to the firm?',
      choices: ['She worked on a deal the firm handled the money for', 'She once applied for an internship at the firm',
                'She did consulting work for the firm on a deal'], a: 0,
      cue: 'April のフルネームのすぐあと。',
      line: 'She *worked on the Grizzle deal* that *you guys did the finances for*.',
      said: 'April が関わった Grizzle の案件で、この事務所がお金まわりを担当した。',
      mean: 'did the finances for ＝ 資金面を引き受けた。',
      trap: 'すぐあとの consulting につられやすい。that 以下が事務所のした仕事。',
      use: 'We worked on the same project last year.（去年、同じ案件をやったんです）' },

    // R fix: V2 — "inviting him" was the only sensible choice; the item now turns on the face-saving move (we
    //   know, they don't), which is what the turn does; notes and line rewritten
    // why: admits ← the request sounds like an honest "please explain", if "obviously very familiar" is missed;
    //   tests Barney ← an accountant asked to explain his own field sounds like a quiz
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'whydont', seg: [41.0, 48.8],
      stem: 'How does the speaker get Barney to explain consulting?',
      choices: ['He claims to know and says it’s for his friends', 'He admits he doesn’t know and asks for help',
                'He tests whether Barney can explain it well'], a: 0,
      cue: 'but の前後、we と they の使い分け。',
      line: '*We’re obviously very familiar* with what consulting is, but … tell *my friends here*',
      said: '「僕らは当然知ってるけど、友だちに説明してあげて」と頼む。',
      mean: '自分も知らないのを、友だちのためという形でごまかしている。',
      trap: 'obviously を聞き逃すと素直な質問に聞こえる。we と they の使い分けを聞く。',
      use: 'Why don’t you go first?（先にどうぞ）' },

    // anchor: 45.9–46.4 s six words inside about half a second, right after "what consulting is, but"; both sources
    //   have "why don't you go ahead and tell my friends here"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'whydont', seg: [45.2, 48.5],
      stem: 'Type the start of the request: “___ tell my friends here” (6 words)', answer: "why don't you go ahead and",
      cue: '「but」のすぐあと。6語が一気に流れる。',
      line: 'but *why don’t you go ahead and* tell my friends here',
      said: '「友だちに説明してあげてよ」の前半。6語が半秒ほどに詰まっている。',
      mean: 'don’t you は「ドンチュ」、ahead and は「アヘッダン」。go ahead は背中を押す語。',
      trap: 'why don’t you tell と書きやすい。音の数を数え、短い go ahead and を探す。',
      use: 'Go ahead and take a seat.（どうぞ座ってください）' },

    // R fix: V2 — "worried/unsure" were weak; "shocked" (Holy crap as shock) and "doubtful" (She'll take it heard as
    //   a question) now compete
    // why: shocked ← "Holy crap" right after "firing" sounds like dismay; doubtful ← "She'll take it" heard as
    //   "Will she take it?"
    { id: 'at2', skill: 'attitude', level: 'B1', point: 'excited', seg: [55.0, 64.4],
      stem: 'Hearing that consultants often fire people, how does one friend react?',
      choices: ['Thrilled; he’s sure it suits her', 'Shocked; he thinks it’s too harsh for her',
                'Doubtful; he isn’t sure she’ll take it'], a: 0,
      cue: '「Holy crap」のあとの短い文の連続。',
      line: '*Holy crap. This is the job for her.* I can feel it.',
      said: '「クビも多く嫌われがち」と聞き、「これは彼女の仕事だ」と言う。',
      mean: '嫌われる仕事こそ彼女向きだと大喜びしている。',
      trap: 'Holy crap は驚きの声なので「ひどい」にも聞こえる。直後の This is the job で向きが決まる。',
      use: 'This is the one. I can feel it.（これだ、そんな気がする）' },

    // why: economics / accounting ← both are said, as Barney's guesses, right before her real major
    { id: 'd2', skill: 'detail', level: 'B1', point: 'major', seg: [66.8, 74.8],
      stem: 'What did April study in college?',
      choices: ['Her own made-up subject', 'Economics and business', 'Accounting and math'], a: 0,
      cue: '質問のあとの2つの推測、そのあとの答え。',
      line: 'Economics? Accounting? — She *designed her own major*. Halloween studies.',
      said: '「経済？会計？」と聞かれ、「自分で専攻を作った。ハロウィン学」と答える。',
      mean: 'design one’s own major ＝ 専攻を自分で組み立てる。',
      trap: '先に聞こえた2つは Barney の推測。答えは返事の側にある。',
      use: 'What did you major in?（専攻は何でしたか）' },

    // R fix: V2 — the key quoted "interest you", the pun itself; a second word-play reading (a fumble after "uh")
    //   now competes with it
    // why: growing salary ← "compound interest" is money that grows, the literal reading; garbles it ← the "uh"
    //   before it heard as a slip
    { id: 'h2', skill: 'humor', level: 'C1', point: 'compound', seg: [74.5, 82.5],
      stem: 'Why is the pitch’s closing question meant to be funny?',
      choices: ['It works a banking phrase into the pitch on purpose', 'It garbles a banking phrase he only half knows',
                'It hints she’ll want her salary to grow fast'], a: 0,
      cue: '最後の質問。「uh」のあとの2語に注目。',
      line: 'She’s brilliant and a very fast learner. Does that, uh, *compound your interest*?',
      said: '「優秀で覚えも早い。これで、uh、興味が複利で増えた？」としめくくる。',
      mean: 'compound interest（複利）と「興味」の interest をかけたしゃれ。',
      trap: '文字通りだとお金の話。uh は言いよどみでなく、しゃれの前の「ため」。',
      use: 'Does that pique your interest?（ちょっと興味わいた？）' },

    // why: not qualified ← the friends say so later (107 s), so it feels like Barney's reason; apply right away ←
    //   "too late" heard as "hurry"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'toolate', reveals: ['qualified'], seg: [89.8, 96.6],
      stem: 'What is Barney’s answer to their request for April?',
      choices: ['A no, because applications are closed', 'A no, because she isn’t qualified enough',
                'A yes, if she can apply right away'], a: 0,
      cue: '「I’m sorry, but」の前とあとの理由。',
      line: 'But it’s *too late for her to apply*. I’m sorry, but we’re *not really taking any more applicants*.',
      said: '「応募にはもう遅い。悪いけど、これ以上は受け付けていない」と言う。',
      mean: 'I’m sorry, but ＝ 断りの前置き。理由は締め切りで、彼女の力ではない。',
      trap: 'あとで仲間が「資格不足」と話すので、それが理由に聞こえやすい。',
      use: 'I’m sorry, but we’re fully booked.（申し訳ありませんが、満席です）' },

    // why: lesser job / later start ← "exception" heard as a softer deal for April; "someone else" is what says it
    //   isn't her
    { id: 'i1', skill: 'infer', level: 'C1', point: 'exception', seg: [95.0, 102.6],
      stem: 'What does the quick “Not interested” turn down?',
      choices: ['A job offered to him instead', 'A lesser job offered for April', 'A later start date for April'], a: 0,
      cue: '「exception」のあとの2語と、短い返事。',
      line: 'Though I could make an exception *for someone else*. — *Not interested.*',
      said: '「ほかの誰かなら例外にしてもいい」と言われ、すぐ「興味ない」と返す。',
      mean: 'someone else は売りこみ役の本人。April でなく本人が誘われ、断った。',
      trap: 'exception を April への特別扱いと聞きやすい。for のあとを聞く。',
      use: 'Thanks, but I’m not interested.（ありがとう、でも興味ないです）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'shot', seg: [104.0, 107.65],
      stem: 'Type the plan: “We just have to convince Barney to ___.” (4 words)', answer: 'give her a shot',
      cue: '「convince Barney to」のあと。her の h に注意。',
      line: 'We just have to convince Barney to *give her a shot*.',
      said: '「Barney を説得して、彼女にチャンスをあげてもらおう」と言う。',
      mean: 'give ～ a shot ＝ 試しにやらせる。her の h が落ちて「ギヴァ」。',
      trap: 'give it a shot に聞こえやすい。誰に、が抜けていないか語数で確かめる。',
      use: 'Just give me a shot.（一度だけやらせてみて）' },

    // R fix: V2 — "First problem" in the stem settled the gap by meaning; the stem now starts at "she's"
    // why: just as ← the flapped t in "not as" (ナラズ) blurs the n-word; nearly as ← both start with n and end in
    //   "as"
    { id: 's1', skill: 'sound', level: 'B2', point: 'qualified', seg: [106.0, 110.4],
      stem: 'Fill the gap: “She’s ___ qualified as the other applicants.”',
      choices: ['not as', 'just as', 'nearly as'], a: 0,
      cue: '「first problem」のあと、短い2語。',
      line: 'first problem, she’s *not as* qualified as the other applicants.',
      said: '「まず問題は、ほかの応募者ほど資格がないこと」と言う。',
      mean: 'not as の t が弾んで「ナラズ」。not as ～ as ＝ ～ほどではない。',
      trap: 't が「ラ」になると just as と逆に取りやすい。音節が2つか3つかも数える。',
      use: 'It’s not as hard as it looks.（見た目ほど難しくないよ）' },

    // why: study accounting ← "college" + "accounting" heard as a plan to go back to school; college writes ← "her
    //   college" heard as a reference letter
    { id: 'd3', skill: 'detail', level: 'B1', point: 'degree', seg: [109.4, 114.6],
      stem: 'What “simple solution” does one friend come up with?',
      choices: ['Break in and change her degree', 'Send her back to study accounting',
                'Get her college to write to Barney'], a: 0,
      cue: '「Simple solution」のあとの2つの動作。',
      line: 'I *break into her college*, and I *change her degree* to accounting.',
      said: '「簡単さ。大学に忍びこんで、専攻を会計に書きかえる」と言う。',
      mean: 'break into ＝ 不法に入りこむ。記録を変える無茶な案。',
      trap: 'college と accounting で学び直しに聞こえやすい。動詞の break into を聞く。',
      use: 'Simple solution: we leave early.（簡単な解決策：早く出よう）' },

    // anchor: 117.5–122.1 s "Impossible math equation? I solve it. X equals Y, obviously.": an "answer" that says
    //   nothing, called obvious, inside his own story, which then rewards him (126.1 s "50 years", 130.2 s "math trophy")
    // R fix: K5 — the choices are now parallel ("X: reason"), and the professor's choice no longer states the 50
    //   years n1 asks
    // why: the professor ← right mechanism, wrong target: on its surface the story makes the professor look slow;
    //   math ← "impossible math equation" heard as a dig at math
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'equation', reveals: ['fifty'], seg: [114.2, 134.4],
      stem: 'In the friend’s college story, who is the joke on?',
      choices: ['The teller: his genius answer means nothing', 'The professor: decades stuck on an easy sum',
                'Math itself: it makes simple things hard'], a: 0,
      cue: '解いた答えの中身と、そのあとの「obviously」。',
      line: 'Impossible math equation? I solve it. *X equals Y, obviously.*',
      said: '黒板の難問を「X イコール Y、当然」と解き、50年悩んだ教授に感謝される空想。',
      mean: '表向きは教授を出しぬく話だが、答えは何も言っていない。笑われるのは天才気取りの本人。',
      trap: '主役の目線だと教授が笑われ役に見える。答えの中身を確かめてから、誰がおかしいかを決める。',
      use: 'Trust me, I’m basically a genius.（任せて、ほぼ天才だから）' },

    // why: 15 ← -teen vs -ty: "fifty" can sound like "fifteen"; 5 ← only "fif-" is caught
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifty', seg: [122.6, 127.6],
      stem: 'How long has the professor been working on the equation?',
      choices: ['5 years', '15 years', '50 years'], a: 2, keep: true,
      cue: '「working on that for」のあとの数。',
      line: 'I’ve been working on that for *50 years*.',
      said: '空想の中で、教授が「その問題に50年取り組んできた」と言う。',
      mean: 'fifty は前を強く「フィフティ」。fifteen なら後ろの teen が強く長い。',
      trap: '-teen と -ty は聞き分けにくい。強勢の位置と、最後の音で決める。',
      use: 'I’ve been waiting for 50 minutes.（50分待ってるんだけど）' },

    // R fix: V2 + V4 — "isn't a real resume" was the only sitcom-shaped choice, and the fact is stated, not implied
    //   (skill infer → detail); all three are now odd "resumes" told apart by the words
    // why: photo with April ← "photograph" + "puppet" caught, the relation lost; autograph ← "signed" caught,
    //   "photograph" lost
    { id: 'i2', skill: 'detail', level: 'B2', point: 'resume', seg: [136.5, 147.9],
      stem: 'What was the “resume” April applied to parks with?',
      choices: ['A signed photo of a puppet named Alf', 'A photo of April with a puppet named Alf',
                'A puppet’s autograph on a blank page'], a: 0,
      cue: '「applied to parks with」のあと、just で始まる説明。',
      line: 'It’s *just a signed photograph of a puppet* named Alf. — Okay, so we make her an *actual resume*',
      said: '前の履歴書は、人形のサイン入り写真だけ。「本物を作ろう」となる。',
      mean: 'just ＝ ただの～。actual resume ＝ ちゃんとした履歴書。',
      trap: 'signed や puppet だけ拾うと組み合わせを取りちがえる。of のつながりを聞く。',
      use: 'Let’s make you an actual plan.（ちゃんとした計画を立てよう）' },

    // R fix: V2 — "every person pitching in" was the only natural ask; "hand-picked" (hands + most importantly)
    //   now competes
    // why: best people ← "most importantly" right after, heard as picking a few; good with hands ← "hands" taken
    //   literally (craft work)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'hands', seg: [146.0, 154.3],
      stem: 'For the presentation, what kind of help is going to be needed?',
      choices: ['Everybody they can get, all at once', 'A few of their best people, hand-picked',
                'People who are good with their hands'], a: 0,
      cue: '「presentation」のあと、need に続く4語。',
      line: 'Gonna need *all hands on deck*. That’s Craig, Donna, and most importantly—',
      said: '発表会のために「総出でいく」と言い、Craig、Donna…と名前を挙げる。',
      mean: 'all hands on deck ＝ 船の「全員甲板へ」から、全員で取りかかる。',
      trap: 'hands を「手」と取ると手作業の話になる。すぐあとに人の名前が並ぶ。',
      use: 'Big order today. All hands on deck!（今日は大口注文、全員集合！）' },

    // R fix: V2 — the key was the only choice where Gary loses; all three now start "Gary gets…"
    // why: most important ← "most importantly" was the last thing said before the names broke off; credit ← a name
    //   called out at the end sounds like being honored
    { id: 'h3', skill: 'humor', level: 'C1', point: 'gary', seg: [154.0, 166.5],
      stem: 'Why does the call for Gary Gergich get a laugh?',
      choices: ['Gary gets the job nobody else wants', 'Gary gets the credit for the whole idea',
                'Gary gets saved for the most important role'], a: 0,
      cue: '単純作業のくだりと、そのあとの呼び出し。',
      line: 'You guys want to do all the *mindless work*? Yeah, I didn’t think so. — *Get me Gary Gergich.*',
      said: '嫌がる二人に「単純作業したい？だよね」と言い、Gary を呼ばせる。',
      mean: '誰もやりたくない雑用が、その場にいない Gary に即決で回される。',
      trap: '直前の most importantly で重要な役に聞こえやすい。雑用の行き先を追う。',
      use: 'Dishes, anyone? Didn’t think so.（皿洗いしたい人？だよね）' },

    // R fix: V2 — "take the blame" was the only idiomatic offer; the distractors are now offers of the same size
    // why: cover money ← "account" heard as money; keep an eye ← an accounting firm, so "accountable" heard as
    //   auditing her
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'accountable', seg: [183.0, 190.2],
      stem: 'What is the speaker offering if April disappoints Barney?',
      choices: ['To take the blame for it himself', 'To cover any money she loses', 'To keep an eye on her work himself'],
      a: 0,
      cue: '「disappoints you」のあと、hold me のあとの語。',
      line: 'And if she disappoints you, you can *hold me accountable*.',
      said: '「期待はずれなら、僕の責任にしてくれていい」と言う。',
      mean: 'hold ～ accountable ＝ ～の責任にする。会計事務所だけに account のしゃれも。',
      trap: 'account を「口座・会計」と取るとお金の話に聞こえる。決まり形で覚える。',
      use: 'If it fails, hold me responsible.（失敗したら私の責任にして）' },

    // why: the presentation ← "that presentation we put together says it all" was said just before; the promise ←
    //   "hold me accountable" was the last thing said to him
    { id: 'i3', skill: 'infer', level: 'B2', point: 'meet', reveals: ['accountable'], seg: [189.0, 197.2],
      stem: 'What finally makes Barney agree to meet April?',
      choices: ['How hard her friends are trying', 'What the presentation shows about her',
                'The promise to take the blame for her'], a: 0,
      cue: '「You know what?」のあと、If で始まる理由。',
      line: 'You know what? *If her friends are trying this hard*, there must be something amazing about her.',
      said: '「仲間がここまで頑張るなら、彼女にはすごい何かがあるはず。明日会おう」と言う。',
      mean: '決め手は資料や約束でなく、仲間の熱意。',
      trap: '直前の presentation や accountable が理由に聞こえやすい。If 以下が結論の理由。',
      use: 'If you say so, it must be good.（君がそう言うなら、きっといいんだね）' },

    // R fix: V2 + K6 — "After all their work" set up a twist and "herself" marked the key; both are gone
    // why: Barney backs out ← "I see" and "this is uncomfortable" heard as Barney's; gets the job ← "good news" is
    //   said on the call
    { id: 'g2', skill: 'gist', level: 'B1', point: 'outcome', seg: [189.0, 221.0],
      stem: 'How does the effort to get April the job end?',
      choices: ['April turns the job down', 'Barney refuses to meet her', 'April is offered the job'], a: 0,
      cue: '電話のあと、伝えられた April の返事。',
      line: 'Tell her I’ll meet with her tomorrow. … *She doesn’t want the job.* — I see.',
      said: '明日会うと決まったのに、電話の April は「その仕事は要らない」と答える。',
      mean: '仲間の努力が実った瞬間に、本人が断るというオチ。',
      trap: '最後の I see や uncomfortable で Barney の取り消しに聞こえやすい。断ったのは誰か。',
      use: 'Thanks, but I’ll pass.（ありがとう、でも遠慮しとく）' },

    // why: going well ← "oh boy!" can be glee, and "good news" was just said; happy surprise ← "oh" heard as
    //   pleased surprise
    { id: 'm1', skill: 'marker', level: 'B2', point: 'ohboy', reveals: ['outcome'], seg: [200.4, 212.8],
      stem: 'After “we got some good news”, what does the next short reaction signal?',
      choices: ['That the call is going badly', 'That the news is going over well', 'That April has a happy surprise'],
      a: 0,
      cue: '「good news」のあとの短い声と、数秒後の報告。',
      line: 'We got some good news. … *Oh, boy.* … Okay. … *She doesn’t want the job.*',
      said: '「いい知らせ」と電話で切り出すが、Oh, boy、Okay と続き、「仕事は要らないって」と伝える。',
      mean: 'Oh, boy ＝ あちゃー、まずい。',
      trap: '喜びにも使うので、good news と合わせて明るく取りやすい。続く報告で決める。',
      use: 'Oh, boy. Here we go again.（あーあ、またか）' },

    // R fix: V2 — the key was the only neutral choice; reworded so all three are plain acts of the same size
    // why: apologizes ← the Japanese frame: an awkward moment calls for すみません; blames April ← "uncomfortable"
    //   heard as a complaint about her
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'awkward', reveals: ['outcome'], seg: [212.0, 221.4],
      stem: 'What does the closing line do after April’s answer is passed on?',
      choices: ['Admits out loud how awkward it is', 'Says sorry to Barney for his trouble',
                'Blames April for letting them all down'], a: 0,
      cue: '「I see」のあと、Well で始まる一言。',
      line: 'I see. — *Well, this is uncomfortable.*',
      said: '「そうですか」のあと、「さて、気まずいね」とだけ言う。',
      mean: '気まずさをわざと口に出して、場の空気を認める言い方。謝罪でも非難でもない。',
      trap: '日本語では気まずい場面で謝りやすいが、sorry はない。言葉にない謝罪や責めを足さずに聞く。',
      use: 'Well, this is awkward.（えーと、気まずいね）' },
  ]
};
