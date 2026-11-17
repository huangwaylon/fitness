// REVIEW 2026-11-17: pass 9, fix 14, drop 1, new 1; ear checks 3
// REVIEW open: the blind pass was helped by this header, which tells the whole scene; the "with the header" figures
//   are noted per item. g3's twist and f1's "fix up" (she's a matchmaker) may still be guessed at about 50 %.
// “Mrs. Benson Crashes Freddie's Date 😭 iCarly Full Scene | NickRewind” (NickRewind, Best of iCarly): three cuts.
// Carly, feeling guilty about Spencer's love life, has hired McKenna, a TV matchmaker, who checks Spencer against her
// three "red flags" (0–168 s); Freddie's dinner with his girlfriend Pearl goes badly because his mother sides with
// Millicent (173–250 s); next morning Spencer has met "the lady of his dreams", and it seems to be McKenna (254–287 s).
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Carly, Spencer, Harper, McKenna,
// Pearl, Millicent ("Millie"). Freddie and his mother aren't named in the clip (the title names them); stems call her
// "his mother". The opener's second voice (10–28 s, "Your brother's an idiot… Best sister ever!") isn't named, so no
// item rests on who it is.
// Untested on purpose: 10–13.5 s (unnamed speaker), 39.6–40.8 s (whisper "She obsessed", captions "she's
// obsessed"; speaker unclear), 109.6–113 s (whisper ends the height rule with an expletive the captions lack, so
// the 5′9″ number is left out), 212.8–216 s (an insult), 220–231 s, 254–271 s (sexual lines).
// EAR CHECK: 126.9–129.2 s x1 — "not even a maybe" (both sources): the t of "not" flaps and the four words run together
// EAR CHECK: 161.9–163.8 s s1 — "I'll go out" (both sources): the 'll really shrinks to a dark l
// EAR CHECK: 186.3–196 s a2 — "Lamb chops it is" taken as Freddie's mother's line (no one is named; "bully my
//   girlfriend" answers it, and her later "Babykins" line is the same voice)
import type { Clip } from '../types.ts';

export const mrsBensonCrashes: Clip = {
  id: 'bensondate', video: '_ULfAv8EgIw', title: 'Mrs. Benson Crashes Freddie\'s Date', dur: 301, wpm: 141,
  band: 'slow', tags: ['恋愛', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: asked her ← the usual "brother asks his sister for help" script; she names her own guilt, and "already
    //   hired" shows she acted unasked. fan ← the fan talk right after (39–46 s); Carly booked her before anyone
    //   knew who she was ("apparently she's on this show")
    // R fix: blind about 50 % (90 % with the file's header, which tells the scene): the key was the only choice
    //   about a feeling. It's now a plain reason like the others.
    { id: 'g1', skill: 'gist', level: 'B1', point: 'guilt', seg: [5.5, 34.4],
      stem: 'Why did Carly hire a matchmaker for Spencer?',
      choices: ['She blames herself for his being single', 'Spencer asked her to find him someone',
                'Her friend is a big fan of the host'], a: 0,
      cue: '最初のセリフ、Spencer について何と言うか。',
      line: 'I feel so *guilty* knowing that I *held Spencer back* from finding true love.',
      said: '「Spencer が本当の恋を見つけるのをじゃましてきた」と罪悪感を口にし、仲人の話を出す。',
      mean: '兄への埋め合わせとしての仲人。自分のせい、という気持ちが出発点。',
      trap: 'すぐあとにファンの話が続くが、雇ったのはその前。理由は最初のセリフで言っている。',
      use: 'I feel so guilty about yesterday.（昨日のこと、すごく悪いと思ってる）' },

    // why: a yes first ← "What if…?" is how a plan is floated for approval; "already hired" makes it done.
    //   cheaper plan ← the first "What if" got "terrible idea", so a second idea sounds like a new offer; it's the
    //   same "really expensive matchmaker"
    // R fix: blind 65 %: "really doing" in the stem pointed at the hidden move, and "a cheaper plan" was refuted by
    //   "really expensive" in the same line. The stem is neutral; the new distractor is the same pitch, put more gently.
    // why (new): pitching gently ← a second "What if" after "terrible idea" sounds like a softer second try
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'whatif', seg: [19.7, 28.1],
      stem: 'What is Carly doing with her second “What if…”?',
      choices: ['Confessing it’s a done deal', 'Asking for a yes before booking', 'Pitching the same idea more gently'], a: 0,
      cue: '2回目の What if の中、時を表す一語。',
      line: 'What if I *already hired* a really expensive matchmaker… and I *can’t get my deposit back*?',
      said: '「もう高い仲人を雇っていて、手付金も戻らないとしたら？」と聞く。',
      mean: '仮定の形だが、実はもう済んだことの告白。反対されにくい打ち明け方。',
      trap: 'what if は提案に使うので「許可」「言い直し」と取りやすい。already なら、もう起きたこと。',
      use: 'What if I already said yes?（もうOKしちゃってたら、どうする？）' },

    // why: twice ← said just before, as the first, modest count; 7 ← the -teen is lost; 70 ← -teen/-ty swap
    { id: 'n1', skill: 'number', level: 'B1', point: 'tapes', seg: [42.8, 47.4], keep: true,
      stem: 'How many times was the audition tape sent, in the end?',
      choices: ['Twice', '7 times', '17 times', '70 times'], a: 2,
      cue: '「once or twice」のあと、言い直す数。',
      line: 'I even submitted an audition tape once or twice or *17 times*.',
      said: '「オーディションのテープを1、2回…いや17回送った」と言う。',
      mean: '軽く言ってから本当の数を足す。かなり熱心なファン。',
      trap: '-teen は長く強い。seventy なら前が強い。7 は -teen の聞き落とし。',
      use: 'I called once or twice. Okay, ten times.（1、2回電話した。いや10回）' },

    // R fix: blind 80 %: the key was the only "doesn't". The near sound (does / does not) is now a choice.
    // why: speaks well ← "does not" with the weak "not" lost; learning ← "language" heard without the negation,
    //   and learning one is the sensible story
    { id: 'd1', skill: 'detail', level: 'B1', point: 'coolguy', seg: [55.4, 63.2],
      stem: 'In the list for a “Mr. Cool Guy,” what are the tattoos like?',
      choices: ['In a language he can’t speak', 'In a language he speaks well', 'In a language he’s learning'], a: 0,
      cue: '完璧な男の条件、最後の一つ。',
      line: 'Frosted tips, tasteful choker, and *tattoos in a language he does not speak*.',
      said: '理想の男は「毛先を明るく染め、上品なチョーカー、話せない言語のタトゥー」。',
      mean: '読めない言葉のタトゥーまで「理想」に入れる。かなり表面的な条件。',
      trap: 'not が弱いと「話せる」に聞こえる。does のあとの not を待つ。',
      use: 'It’s in a language I don’t speak.（それ、私が話せない言語なんだ）' },

    // R fix: blind 60 %: the key was the only witty choice. "A yes, said as a joke" is now the tempting reading.
    // why: a joking yes ← the last words "you can" heard as permission, said lightly; maybe later ← the Japanese
    //   曖昧 frame, a soft no read as "not now"; "in your mind" limits it to imagining
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'shoes', seg: [72.4, 77.9],
      stem: 'When Harper asks about the shoes, what is McKenna’s answer?',
      choices: ['A yes, said as a joke', 'A no, dressed up as a yes', 'A maybe, for some other day'], a: 1,
      cue: '「you can」の前に付いた言葉。',
      line: 'Can I try on your shoes? — *In your mind*, you can.',
      said: '靴を履いてみてもいいかと聞かれ、「頭の中でならね」と答える。',
      mean: '想像の中だけ OK ＝ 実際はダメ。冗談めかした断り方。',
      trap: '最後の you can だけ聞くと許可に聞こえる。前に付く条件で意味が逆になる。',
      use: 'In your dreams.（夢の中でならね＝ありえない）' },

    // R fix: blind 85 % with the header (she's a matchmaker, so "find him a date" was common sense) and the
    //   apartment choice answered a different question (K5). The distractors are now things done *to him*: a makeover
    //   (fix up = 手を入れる, and it's a TV show) and fixing his habits.
    // why: new look ← fix up = 手を入れる, the makeover-show script; habits ← fix = 直す, and the red flags that
    //   follow are about his habits; "fix up" + a person = set up with a date
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'fixup', reveals: ['visit'], seg: [78.8, 85.3],
      stem: 'What does McKenna say she will do for Carly’s brother?',
      choices: ['Set him up with a woman', 'Give him a whole new look', 'Sort out his bad habits'], a: 0,
      cue: '「before I」のあと、brother の前の動詞。',
      line: 'before I *fix up* your brother, I need to make sure there are no red flags.',
      said: '「お兄さんに相手を紹介する前に、危険信号がないか確かめる」と言う。',
      mean: 'fix up ＝ 人に恋人候補を紹介する（fix someone up）。直す意味ではない。',
      trap: 'fix を「直す」と取ると、癖や見た目の話に聞こえる。目的語が人なら紹介を疑う。',
      use: 'Can you fix me up with someone?（誰か紹介してくれない？）' },

    // R fix: blind about 70 %: g1 says she was hired for Spencer, so the two choices about others fell away. Both
    //   distractors now fit what she's seen doing: telling Carly her rules, and being a TV host.
    // why: coaching Carly ← she tells the rules to Carly, one by one; filming ← she hosts "Code Red Flags", and
    //   Harper's a fan; "before I fix up your brother… no red flags" and "one for one" make it a check on Spencer
    { id: 'g2', skill: 'gist', level: 'B2', point: 'visit', seg: [79, 129.3],
      stem: 'What is McKenna doing during her visit?',
      choices: ['Testing Spencer against her red flags', 'Coaching Carly on her dating rules', 'Filming an episode of her TV show'], a: 0,
      cue: '訪問の最初と、数を挙げて並べる話。',
      said: '紹介の前に、Spencer に危険信号がないか、条件を一つずつ確かめる。',
      mean: '紹介の前の「審査」。Carly がその場で答えていく。',
      trap: 'Carly に話すので Carly 向けの助言、番組の司会なので撮影にも見えるが、中心は Spencer の条件。',
      use: 'Let’s make sure there are no red flags.（問題がないか確認しておこう）' },

    // why: parents ← the classic "lives at home" red flag (and "mother's roof" later); rent late ← "rent" is said,
    //   but the problem is splitting it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'roommates', seg: [90, 96.8],
      stem: 'What is McKenna’s first red flag?',
      choices: ['Having roommates', 'Living with his parents', 'Paying his rent late'], a: 0,
      cue: '「number one」のすぐあと。',
      line: 'Red flag number one, *no roommates*. If he still *splits the rent*…',
      said: '1つ目は「ルームメイトなし」。家賃を折半しているならダメ、と言う。',
      mean: '大人の男は一人で住むべき、という基準。split the rent ＝ 家賃を分ける。',
      trap: 'rent が聞こえると支払いの話に取りやすいが、問題は誰かと住むこと。',
      use: 'We split the rent three ways.（家賃は3人で割ってる）' },

    // R new: replaces nt2 to keep the C2 tier at 2. A fresh blind read: about 40 %.
    // anchor: 114.6 s "Be tall", 115.8–117.0 s "It seems like a hard rule to follow", then 117.8–118.4 s "But Spencer
    //   does": "does" stands for "follow", and "but" turns against "hard"
    // why: finds it hard ← "does" heard as standing for "seems hard"; breaks it ← "hard rule" + "but" heard as the
    //   exception; "but" contrasts with "hard to follow", so he follows it (he's tall)
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'tall', seg: [114, 118.9],
      stem: 'In “But Spencer does,” what is Spencer said to do?',
      choices: ['Meet the height rule', 'Find the height rule hard', 'Break the height rule'], a: 0,
      cue: '直前の文の動詞と、but の向き。',
      line: 'Be tall. … It seems like a *hard rule to follow*. … *But Spencer does.*',
      said: '「背が高いこと」に「守るのは難しそう」と言われ、「でも Spencer は守ってる」。',
      mean: 'does は直前の follow の代わり。Spencer は背が高く、2つ目の条件も合格。',
      trap: 'does を seems の代わりと取ると「彼も難しい」になる。but のあとは逆の内容。',
      use: 'Most people don’t, but I do.（たいていの人はしないけど、私はする）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'maybe', seg: [126.4, 129.7],
      stem: 'Type the end: “If he acts like a baby, it’s ___.” (4 words)', answer: 'not even a maybe',
      cue: '「it’s」のあと、4語がつながる部分。',
      line: 'If he acts like a baby, it’s *not even a maybe*.',
      said: '「子どもみたいなら『もしかして』もない」＝論外、と言う。',
      mean: '検討の余地もない、の意味。not の t が弾み、4語がひと続きになる。',
      trap: 'not even は「ナーリーヴン」に近い。a も消えやすいので語数を数える。',
      use: 'It’s not even close.（比べものにならない）' },

    // R fix: blind 70 %: only the key tied the line to the rule. All three are now the same shape of noun phrase.
    // why: compliment ← "your bonnet" heard as praise he's returning; missed hint ← "your bonnet" is a hint to take
    //   it off, and he doesn't; neither is the laugh: a jab that copies her words, just after "If he acts like a baby"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'bonnet', reveals: ['maybe'], seg: [126.4, 136.8],
      stem: 'Why does Spencer’s first exchange with Carly get a laugh?',
      choices: ['A childish comeback, just after the baby rule', 'A compliment on the bonnet, taken wrongly',
                'A hint to lose the bonnet, missed entirely'], a: 0,
      cue: '名前を呼び合うやりとりと、直前のルール。',
      line: 'Spencer, *your bonnet*. — Carly, *your face?*',
      said: '「Spencer、そのボンネット」と言われ、「Carly、その顔？」と返す。',
      mean: '子どもっぽい男はダメ、と聞いた直後に、子どものような言い返し。',
      trap: '形をまねただけで、ほめても認めてもいない。直前の話とのつながりで笑いを探す。',
      use: 'Very mature.（大人だこと＝子どもっぽいね）' },

    // why: none ← Harper "has no cars" right after; one ← "owner of" runs into "four" and the number is lost
    { id: 'n2', skill: 'number', level: 'B1', point: 'cars', seg: [137.3, 144.7], keep: true,
      stem: 'How many cars does McKenna say she owns?',
      choices: ['None', 'One', 'Four'], a: 2,
      cue: '自己紹介の最後、cars の直前。',
      line: 'professional matchmaker with an extremely high success rate and owner of *four cars*.',
      said: '「プロの仲人で成功率はとても高く、車を4台持っている」と自己紹介する。',
      mean: '実績に車の数まで並べる。車はステータスの印。',
      trap: 'このあと「車がない」という話が出るので None に引かれやすい。of four は「オヴフォー」とつながる。',
      use: 'I’m the proud owner of one bike.（自転車1台の持ち主です）' },

    // R fix: blind 50 %: the key was the longest and the only two-sided one. All three are now "<feeling>, <reason>".
    // why: only to please ← "if it makes you happy" is the giving-in formula; unsure ← "I don't really have
    //   trouble getting ladies" heard as a no; "I'll go out on multiple dates with beautiful women" settles both
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'favor', reveals: ['illgo'], seg: [155.9, 165.7],
      stem: 'How does Spencer take Carly’s gift of a matchmaker?',
      choices: ['Happy to go, while acting like it’s for her', 'Willing to go, but only to please her',
                'Unsure, since he can find dates himself'], a: 0,
      cue: 'but のあとの条件と、デートの数の言い方。',
      line: 'I don’t really have trouble getting ladies, *but if it makes you happy*… *multiple dates with beautiful women*.',
      said: '「女性に困ってないけど、君がうれしいなら美人と何回もデートする」。',
      mean: '妹のための我慢のように言うが、恩を着せつつ喜んでいる。',
      trap: '「仕方なく」の言い方だが、続く multiple と beautiful が本音。',
      use: 'If it makes you happy, I’ll drive.（君がいいなら運転するよ）' },

    // why: I go ← the 'll shrinks to a dark l and vanishes; I'd ← "I'd" is the polite conditional after "if it
    //   makes you happy"; I've gone ← "go out" heard as a past habit, matching "I don't have trouble"
    { id: 's1', skill: 'sound', level: 'B2', point: 'illgo', seg: [161.3, 165.6],
      stem: 'Fill the gap: “___ on multiple dates…”',
      choices: ['I go out', 'I’ll go out', 'I’d go out', 'I’ve gone out'], a: 1,
      cue: 'Carly と呼んだすぐあと、文頭の短い音。',
      line: 'if it makes you happy, Carly, *I’ll go out* on multiple dates',
      said: '「（君がうれしいなら）何回もデートに行くよ」と約束している。',
      mean: 'I’ll は短く、go につながる。これからの約束なので will。',
      trap: '’ll は弱く、ほぼ l だけになるので I go に聞こえやすい。約束なら will を補う。',
      use: 'I’ll go out and grab some coffee.（ちょっとコーヒー買ってくる）' },

    // why: one ex ← the plural s is lost, leaving one Caitlyn; a friend ← a name in a request is often someone in
    //   the room's circle ("don't bring Caitlyn")
    { id: 'i1', skill: 'infer', level: 'B2', point: 'caitlyns', seg: [165.3, 168.9],
      stem: 'What does Spencer’s last request suggest about his past?',
      choices: ['Dates with several Caitlyns went badly', 'One ex called Caitlyn still upsets him',
                'His sister has a friend called Caitlyn'], a: 0,
      cue: '名前の最後の音と、so done の強さ。',
      line: 'Just *no Caitlyns*. I’m *so done* with Caitlyns.',
      said: '「ただしケイトリンはなし。ケイトリンはもうこりごり」と付け足す。',
      mean: '複数形なので、同じ名前の相手と何度もうまくいかなかったと分かる。',
      trap: '名前の最後の s は弱く消えやすい。s を落とすと一人の元恋人の話に聞こえる。',
      use: 'I’m so done with group chats.（グループチャットはもうこりごり）' },

    // R fix: blind 50 %: "episodes they've missed" spelled out the show sense. The key now says "the show they're
    //   behind on", and the distractors are reworded to match it.
    // why: fight ← "The Good Fight" heard as a real fight; news ← "catch up" = 近況を話す, its commonest sense;
    //   the next question ("any episodes without me?") makes it a show
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'catchup', seg: [172.9, 178.2],
      stem: 'In the first line after the cut, what can they finally do?',
      choices: ['Watch the show they’re behind on', 'Talk over the fight they had', 'Hear each other’s news at last'], a: 0,
      cue: '「Finally」のあとの動詞と、次の質問。',
      line: 'Finally, we can *catch up on* The Good Fight.',
      said: '「やっと The Good Fight の続きが見られる」と言う。',
      mean: 'catch up on ＋ 番組 ＝ 見逃した分に追いつく。',
      trap: 'catch up は「近況を話す」、fight は「けんか」にもなる。episodes で番組と分かる。',
      use: 'I need to catch up on my emails.（たまったメールを片づけなきゃ）' },

    // why: dreamed it ← the dream taken literally; read online ← the usual spoiler story; "the exact plot of the
    //   next three episodes" and "worst liar" leave only watching
    { id: 'i2', skill: 'infer', level: 'B2', point: 'dream', seg: [175.2, 184.9],
      stem: 'After “No,” what does the rest of the answer really admit?',
      choices: ['Watching the next episodes alone', 'Dreaming the plot by pure chance', 'Reading the plot somewhere online'], a: 0,
      cue: 'No のあと but で続く部分と、相手の返し。',
      line: 'No. *But I might have had a dream* with the exact plot of the next three episodes. — You’re the *worst liar*.',
      said: '「見てない。でも次の3話と同じ筋の夢を見たかも」と言い、「うそが下手」と返される。',
      mean: '夢のふりをした白状。筋を全部知っている ＝ 先に見た、ということ。',
      trap: '夢の話を文字どおり取りやすい。No のあとに but が来たら、本当のことが続くと考える。',
      use: 'I might have had a little cake.（ちょっとケーキ食べちゃったかも）' },

    // R fix: blind 70 % (the title makes her the villain): "shut out" was the only hostile word and "forgetting" a
    //   weak filler. The new distractors use the menu's own words: the spaghetti as an offer, and not hearing.
    // why: pasta too ← "lamb chops or spaghetti" was the question, so a host might cook both; not hearing ← the
    //   reply cuts Freddie off; the instant reply and "bully my girlfriend" make it deliberate
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'lambchops', seg: [185.8, 196.5],
      stem: 'When dinner is decided, what is Freddie’s mother doing?',
      choices: ['Picking meat to spite Pearl', 'Not hearing what Freddie said', 'Picking meat but saving Pearl pasta'], a: 0,
      cue: '「doesn’t eat meat」の直後の返事と、次の文句。',
      line: 'Pearl doesn’t eat meat, so— *Lamb chops it is.* — so now you’re gonna *bully my girlfriend*, too?',
      said: '「Pearl は肉を食べないから…」と言いかけると、すぐ「じゃ、ラムチョップね」。',
      mean: 'わざと Pearl が食べられない方を選ぶ。だから「彼女までいじめるの？」。',
      trap: '聞いていないだけにも見えるが、直後の即答と次の文句がわざとだと示す。',
      use: 'Pizza it is, then.（じゃあ、ピザで決まり）' },

    // why: won't eat her cooking ← the meat talk just before; rude ← the usual mother-in-law story; she gives
    //   Millicent's distrust as her only reason
    { id: 'd3', skill: 'detail', level: 'B2', point: 'millie', reveals: ['lookout'], seg: [197.8, 204.15],
      stem: 'Why doesn’t Freddie’s mother trust Pearl, from what she says?',
      choices: ['Millicent doesn’t trust her', 'Pearl won’t eat her cooking', 'Pearl has been rude to her'], a: 0,
      cue: '「Yep」のあと、if で始まる条件の部分。',
      line: 'Yep, and *if our little Millie Vanille doesn’t trust Pearl*, then *neither do I*.',
      said: '「Millie が Pearl を信用しないなら、私もしない」と言う。',
      mean: 'neither do I ＝「私もしない」。Millicent の気持ちに合わせている。',
      trap: '肉の話のすぐあとなので料理の理由に取りやすい。理由は if の中。',
      use: 'If you’re not going, neither am I.（君が行かないなら、私も行かない）' },

    // R fix: blind about 50 % (75 % with the header): only the key had the "X, not Y" shape. All three are now
    //   "protecting <someone>".
    // why: Pearl ← "her" right after "She's the first woman" seems to be Pearl, and that's Freddie's hope ("Who,
    //   Pearl?"); Freddie ← a mother "looking out" for her son; "No, Millicent" settles it
    { id: 'i3', skill: 'infer', level: 'B2', point: 'lookout', seg: [203.9, 212.6],
      stem: 'When Freddie asks who she’s looking out for, what does her answer show?',
      choices: ['She’s protecting Millicent’s feelings', 'She’s protecting Pearl from getting hurt',
                'She’s protecting Freddie from Pearl'], a: 0,
      cue: '「Who, Pearl?」への短い答え。',
      line: 'I’m just *looking out for her*. — Who, Pearl? — *No, Millicent.*',
      said: '「あの子のためよ」と言い、Pearl のこと？と聞かれて「いいえ、Millicent」。',
      mean: 'her は Millicent。Pearl を守る気はない、とはっきりさせる。',
      trap: 'her を直前の女性と思いやすい。代名詞に迷ったら、次の言い直しを待つ。',
      use: 'I’m just looking out for you.（あなたのためを思って言ってるの）' },

    // R fix: blind 65 %: the key named "his mother", the only choice tied to the remark. All three are now about the
    //   remark's force. The line skipped whisper's word at 236 s (not in the captions): now marked with "…".
    // why: guessing ← the Japanese 「〜だけど」 read as doubt; inviting ← "opinion" heard as a request for his, and he
    //   does argue back; she has just said it flatly ("she's gonna treat you like a child")
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'opinion', seg: [232, 239.6],
      stem: 'Why does Pearl add “Just my opinion” after her remark?',
      choices: ['To take the edge off a blunt point', 'To show she’s only guessing', 'To invite Freddie to argue back'], a: 0,
      cue: '長い意見のあとの、短い付け足し。',
      line: 'as long as you’re living *under your mother’s roof*, she’s gonna treat you like a child. … *Just my opinion.*',
      said: '「母親の家にいる限り子ども扱いされる。まあ、私の意見」と言う。',
      mean: '相手の家族への厳しい一言を和らげる。言い分は引っこめていない。',
      trap: '自信のなさと取りやすいが、角を立てないためのクッション。',
      use: 'Just my two cents.（あくまで私の意見だけど）' },

    // R fix: blind 70 %: "proves Pearl right" was the only choice that tied to the denial. All three are now
    //   readings of the mother's line.
    // why: agrees ← "Babykins" heard as warmth for him, on his side; orders ← the question heard as his own order;
    //   "like always" and the babying make it the very thing he just denied
    { id: 'h2', skill: 'humor', level: 'C1', point: 'babykins', seg: [239.5, 249.9],
      stem: 'Why does the audience laugh right after Freddie’s denial?',
      choices: ['His mother babies him the moment he denies it', 'His mother backs him up a bit too warmly',
                'He orders his dinner like a little boy'], a: 0,
      cue: '否定のすぐあと、母親の呼びかけと質問の中身。',
      line: 'She does not treat me like a child. — *Babykins*, you want your lamb chops *cubed*… *like always*?',
      said: '「子ども扱いされてない」の直後、母が「坊や、いつもどおり肉は角切り？」。',
      mean: '否定した瞬間に子ども扱いの場面。言葉と現実のずれが笑い。',
      trap: '優しい呼びかけは気づかいに聞こえやすい。like always が「いつも」と示す。',
      use: 'Case in point.（まさにその例だね）' },

    // anchor: 241.8 s "Babykins", 243.7 s "cubed", 244.2 s "not touching anything else": three babyings; 248.2 s
    //   "My food can touch" answers only the third
    // why: nothing ← any comeback heard as a full rejection; only the meat ← he seems to protest the food, so the
    //   name looks like what he minds; he says nothing about the name, and nothing about the cubes
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'babykins', seg: [239.5, 249.9],
      stem: 'When Freddie replies “My food can touch,” what does he let pass?',
      choices: ['Both the pet name and the cubed meat', 'Nothing at all; he rejects every part',
                'Only the cubed meat; he hates the name'], a: 0,
      cue: '母の質問に入っていた3つと、返事の中身。',
      line: '*Babykins*, you want your lamb chops *cubed* and *not touching* anything else…? — My food *can touch*.',
      said: '「坊や、肉は角切りで、ほかと触れないように？」に「触れてもいい」とだけ返す。',
      mean: '「坊や」も角切りも認めたまま、小さな一点だけ否定する。大人ぶるつもりが、子ども扱いを受け入れている。',
      trap: '反論したので全部断ったと聞きやすい。言い返しは、何に返していないかまで聞く。',
      use: 'Fine, but I’m cutting my own steak.（いいけど、肉は自分で切る）' },

    // why: from her list ← the matchmaking script (she was hired to find him someone); Harper ← she's the one who
    //   speaks about the robe, and Spencer called her single earlier; "Morning" and "Oh, hey McKenna" name the guest
    // R fix: blind 90 % with the header, about 50 % without: "By the end… seems" flagged a twist. The stem is plain.
    { id: 'g3', skill: 'gist', level: 'C1', point: 'twist', seg: [271.7, 287],
      stem: 'Who is the woman Spencer says he has met?',
      choices: ['McKenna, the matchmaker herself', 'A woman from McKenna’s list', 'Harper, Carly’s roommate'], a: 0,
      cue: '「future sister-in-law」の質問のあと、誰があいさつするか。',
      line: 'So, who’s my future sister-in-law? — *Morning.* — Oh, *hey McKenna*.',
      said: '「仲人を雇って正解」の直後、McKenna が「おはよう」と現れる。',
      mean: '夢の相手は、紹介された女性ではなく仲人本人だった、というオチ。',
      trap: '流れから「紹介された人」を選びやすい。朝そこにいる人で判断する。',
      use: 'Morning! Sleep well?（おはよう、よく眠れた？）' },

    // R drop: nt2 (C2). Its key, "truer than he meant", fails K1: Spencer spent the night with McKenna, so he knows
    //   who she is, and "exactly as he means" is just as defensible. The irony is Carly's, not his. Never shipped, so
    //   deleted. Replaced by nt3 (after d2).
  ]
};
