// REVIEW 2026-11-17: pass 5, fix 19, drop 0, new 0; ear checks 2
// “Carly Throws A Murder Mystery Party! | iCarly | NickRewind” (NickRewind, Best of iCarly): a party game flops.
// The guests draw character cards, the murderer is revealed at once, Freddie tries to keep everyone from leaving, the
// cake is lost, nobody dances, and in the kitchen Millicent's grandma tries to get her off her phone.
// Segments from the captions, words from whisper (2026-11-17). Freddie is named ("I'm sorry, Freddie"; "Pearl and I" =
// the speaker is Pearl's partner, and "Freddie's relationship with Pearl"); Millicent and Grandma are named in the
// kitchen (240 s, 297 s, 312 s). Other speakers aren't named, so stems say "a guest" or "someone" and no key rests on
// who it is. Left out: the secretary card (50–59 s), the character-switch talk (105–113 s), "drink heavily", the
// wordless stretches (219–229 s, 260–273 s), and "flipping with Derek" (what "flip" means isn't said).
// EAR CHECK: 148.9 s r1 — the cut falls after "you tell them" and before "oh, uh"; "You do?" assumed to be a
//   surprised guest or Pearl, not Freddie (the key doesn't depend on which)
// EAR CHECK: 179.8–180.2 s s1 — "you've worked" in both sources: check the 've is audible as a v
import type { Clip } from '../types.ts';

export const mysteryParty: Clip = {
  id: 'mysteryparty', video: 'Dcb95rHOvuw', title: 'Carly Throws A Murder Mystery Party!', dur: 348, wpm: 112,
  band: 'slow', tags: ['家', '友だち'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: 1967 / 1987 ← sixty / seventy / eighty differ only in the first syllable
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', seg: [5.0, 8.1], keep: true,
      stem: 'What year is the game’s story set in?',
      choices: ['1967', '1977', '1987'], a: 1,
      cue: '最初のひと言。',
      line: 'It’s *1977*.',
      said: '「時は1977年」と、ゲームの設定を読み上げている。',
      mean: 'nineteen seventy-seven と2けたずつ読む。年号の決まった読み方。',
      trap: 'seventy、sixty、eighty は最初の音で分かれる。「セ」で始まれば70年代。',
      use: 'It’s 1999, and everyone has a pager.（時は1999年、みんなポケベルを持っている）' },

    // R fix: V2 (blind 55 %): "voting" was a filler; now the host handing out roles, the usual way the game is run
    // why: names from a hat ← "draw" is heard, and drawing names is the usual party way; host hands out ← how a murder
    //   mystery party usually assigns roles (the script trap)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'draw', seg: [24.9, 29.9],
      stem: 'How will everyone find out their characters?',
      choices: ['By each drawing a character card', 'By pulling names out of a hat', 'By having the host hand out roles'],
      a: 0,
      cue: '「time to」のあと。',
      line: 'it’s time to *draw cards* to find out which characters we all play',
      said: '「さあ、カードを引いて誰がどの役か決めよう」と言う。',
      mean: 'draw cards ＝ カードを引く。draw は「描く」以外に「引く」。',
      trap: 'draw が聞こえると名前を引くくじも思い浮かぶが、引くのは cards。名詞まで聞く。',
      use: 'Let’s draw straws to decide.（くじで決めよう）' },

    // why: can't solve it ← the usual way a mystery game fails (the script trap); fight over a role ← the "why don't
    //   we just switch" talk just before the end
    { id: 'g2', skill: 'gist', level: 'B2', point: 'game', seg: [24.9, 122.8],
      stem: 'What goes wrong with the murder mystery game?',
      choices: ['It ends almost as soon as it starts', 'Nobody can work out who the killer is',
                'Two players fight over the same role'], a: 0,
      cue: 'カードを引き終わった直後の一言。',
      line: 'let’s see… *I’m the murderer*. … the murder mystery’s *over*',
      said: '役のカードを順に読み上げ、最後の人が「私が犯人」と読んだところで、ゲームが終わる。',
      mean: '犯人さがしのゲームなのに、配役の時点で犯人が分かってしまった。',
      trap: 'switch の話でもめているように聞こえるが、断られて終わり。問題はそのあとのカード。',
      use: 'Well, that was over fast.（あっという間に終わったね）' },

    // why: his wife ← the "detective's wife" card is read soon after; found the body ← "police arrived to discover"
    //   in the opening
    { id: 'd2', skill: 'detail', level: 'B1', point: 'brother', seg: [69.5, 84.4],
      stem: 'What is the detective’s link to the case?',
      choices: ['The victim is his brother', 'The victim is his wife', 'He found the body himself'], a: 0,
      cue: '役名のあと、「whose」で始まる説明。',
      line: 'the detective… *whose brother is the victim*',
      said: '刑事は「被害者の兄弟」という設定で、犯人を見つけると宣言する。',
      mean: 'whose brother ＝ その人の兄弟。',
      trap: 'このあと「刑事の妻」の役が出るので wife に引かれやすい。',
      use: 'my friend whose sister lives in Osaka（姉が大阪に住んでいる友だち）' },

    // R fix: V2 (blind 65 %): both distractors were about the game, which is plainly over; now the guests' shared ride
    //   and the switch argument with Pearl. Broken characters in said repaired
    // why: a shared ride ← "you want to share an Uber" is said, but by the guests; Pearl ← the "why don't we just
    //   switch" spat just before
    { id: 'g1', skill: 'gist', level: 'B2', point: 'stay', seg: [119.8, 199.0],
      stem: 'After the game ends, what does Freddie try to do?',
      choices: ['Keep his guests from going home', 'Get his guests to share a ride home', 'Smooth things over with Pearl'],
      a: 0,
      cue: '帰ろうとする人たちへの返事。',
      said: '「ゲームが終わったから帰る」という客を、予定がある、ケーキもある、と引き止める。',
      mean: 'ゲームが終わっても、会は続けたい。',
      trap: 'share an Uber は帰る側の言葉。予定やケーキを並べるのは引き止める側。',
      use: 'Stay a little longer, please?（もう少しいてよ）' },

    // why: thirteen / thirty ← -teen/-ty; "three" here has no unit, so the longer words are easy to hear into it
    { id: 'n2', skill: 'number', level: 'B1', point: 'three', seg: [126.3, 130.3], keep: true,
      stem: 'When will the shared ride be out front?',
      choices: ['In three minutes', 'In thirteen minutes', 'In thirty minutes'], a: 0,
      cue: '「out front in」のあと。',
      line: 'Jennifer R will be out front *in three*.',
      said: '「Jennifer R（運転手）があと3分で表に来る」と言う。',
      mean: 'in three ＝ 3分後。配車アプリの話なので minutes を省いている。',
      trap: 'thirteen や thirty なら「ティーン」「ティ」が付く。',
      use: 'Dinner’s ready in five.（あと5分でごはんだよ）' },

    // R fix: V2 (blind 50 %, right): "didn't know the theme" was a filler; now the polite-agreement frame
    // why: mocks the name ← "name" heard as a complaint about it; keeps the peace ← the reply agrees, and agreeing
    //   to smooth things over is the Japanese frame
    { id: 'h2', skill: 'humor', level: 'C1', point: 'name', seg: [132.0, 139.85],
      stem: 'Why does the reply “It’s right there in the name” get a laugh?',
      choices: ['It answers a question meant to get a “no”', 'It mocks the host for picking a silly name',
                'It agrees with the host to keep the peace'], a: 0,
      cue: '直前の問いが、どんな答えを期待していたか。',
      line: 'You think a murder mystery party is all about the murder mystery? — *It’s right there in the name.*',
      said: '「この会がゲームだけだと思う？」に「名前にそう書いてあるでしょ」と返される。',
      mean: '「まさか」と言わせたい問いに、まじめに「そう」と答えて相手の勢いをくじいている。',
      trap: 'name を「名前がおかしい」と取りやすいが、名前を根拠に「その通り」と言っている。',
      use: 'It’s called a sleepover. You sleep over.（お泊まり会だよ、泊まるんだよ）' },

    // R fix: V2 (blind 60 %): the refusal was a weak move; now a joke at the host's expense, the guests' mood so far
    // why: a list of games ← "so many more things planned" taken at face value; a joke at the host ← the guests have
    //   been needling Freddie and Pearl
    { id: 'r1', skill: 'predict', level: 'B2', point: 'plans', seg: [140.4, 148.9], then: [148.9, 157.6],
      stem: 'After “Yeah, you tell them,” what is most likely to come next?',
      choices: ['A stall: nothing is really ready', 'A list of the games still to come', 'A joke at the host’s expense'],
      a: 0,
      cue: '「You do?」の驚き方と、話を振る速さ。',
      line: 'so many more things planned. — You do? — Yeah, *you tell them*. — Oh, uh…',
      said: '「まだ予定がある」に「そうなの？」と返され、「君から話して」と振るが、相手は詰まる。',
      mean: '予定は出まかせ。振られた側も知らないので、別の人が助け舟を出す。',
      trap: 'planned と言い切るが、「You do?」の驚きが何もない合図。',
      use: 'Um, why don’t you explain?（えっと、説明してあげて）' },

    // R fix: V2 (blind 65 %): "caught trying to" in the stem pointed at sneaking; neutral stem
    // why: over and over ← a long, many-hug farewell is another "national" goodbye joke; one last drink ← the
    //   country name calls up pubs and toasts
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'irish', seg: [157.4, 164.3],
      stem: 'What does someone say the two guests are trying to do?',
      choices: ['Slip out without saying goodbye', 'Say goodbye over and over again', 'Have one last drink before leaving'],
      a: 0,
      cue: '「where do you two think」のあと、帰り方の呼び名。',
      line: 'you’re trying to do an *Irish goodbye*',
      said: '「ちょっと、どこ行くの。黙って帰るつもり？」と呼び止める。',
      mean: 'Irish goodbye ＝ あいさつせずにこっそり帰ること。',
      trap: '国の名前から乾杯や長いお別れを想像しやすいが、ここは出口に向かう二人を止める場面。',
      use: 'Sorry I left without saying bye.（あいさつしないで帰ってごめん）' },

    // R fix: V2 (blind 55 %): "Freddie set up" was weak; now a met-once near miss on "never met"
    // why: longtime partner ← "my relationship" suggests someone already known; met once ← "met" is caught but the
    //   "never" before it is lost
    { id: 'i3', skill: 'infer', level: 'B2', point: 'date', seg: [168.0, 176.6],
      stem: 'What kind of date is the guest leaving for?',
      choices: ['A first date with someone new', 'A date with a woman he’s met only once', 'A dinner with a longtime partner'],
      a: 0,
      cue: '「a woman」のあとの3語。',
      line: 'my relationship with *a woman I’ve never met*',
      said: '「この会が Freddie たちに大事なら、このデートも僕の恋に大事」と言う。',
      mean: 'never met ＝ 会ったことがない。初めて会う人とのデート。',
      trap: 'relationship から長い付き合いを想像しやすい。弱い never を聞き落とさない。',
      use: 'I have a blind date tonight.（今夜、初対面の人とデートなの）' },

    // R fix: V2 (blind 70 %): the key alone held "relationship" in quotes; all three now pair a person with a reason
    // why: Freddie ← the line is a comeback to the Freddie-and-Pearl argument, so it sounds aimed at him (right
    //   mechanism, wrong target); the woman ← "never met" heard as her taking a risk
    // anchor: 170.3–175.8 s "Freddie's relationship with Pearl" set against "my relationship with a woman I've never
    //   met": the same words, but there's no relationship yet
    { id: 'c3', skill: 'humor', level: 'C2', point: 'date', seg: [168.0, 176.6],
      stem: 'In the line about “a woman I’ve never met”, who is the joke on?',
      choices: ['The speaker, whose romance is with a stranger', 'Freddie, whose romance needs a party to work',
                'The woman, who agreed to date a stranger'], a: 0,
      cue: '二つの「relationship」を並べて比べて。',
      line: 'this party is to *Freddie’s relationship* with Pearl… this date is to *my relationship* with a woman I’ve never met',
      said: '「Freddie たちの仲にこの会が大事なように、僕の恋にはこのデートが大事」と言い返す。',
      mean: '相手の言い方をなぞったせいで、自分の恋がまだ始まってもいないと自分で言ってしまう。',
      trap: 'Freddie への皮肉に聞こえるが、オチは最後の never met。矛先は本人に向いている。',
      use: 'It matters to my future wife.（未来の奥さんのためなの）' },

    // R fix: V2 (blind 70 %) and S1: "but face it" in the stem announced a contrast, and "the food" was a filler; the
    //   stem quotes the preface now, with a backing-down reading. Its line quotes s1's key: reveals 'worked'
    // why: promising to stay ← "we want to be here for Freddie" heard alone; taking back ← the kind preface heard as
    //   retracting the date line just before
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'face', reveals: ['worked'], seg: [176.8, 187.0],
      stem: 'What is the guest doing with “we want to be here for Freddie…”?',
      choices: ['Softening what is coming next', 'Promising to stay for Freddie', 'Taking back what was said before'], a: 0,
      cue: '「but」の前に並ぶ、相手を思いやる言葉。',
      line: '*we want to be here for Freddie and we know how hard you’ve worked* on this, but face it…',
      said: '「Freddie のためにいたいし、頑張ったのも分かる。でも正直…」と続ける。',
      mean: '先に努力を認め、but のあとで本音を言う、角の立たない言い方。',
      trap: 'want to be here だけ聞くと「残る」約束に聞こえる。but のあとが本音。',
      use: 'I know you tried, but honestly…（頑張ったのは分かるけど、正直…）' },

    // R fix: K4: "you'd work" was the weak fourth (it doesn't fit "we know how hard… on this"); cut to 3
    // why: you worked ← 've nearly vanishes before w; you work ← both the v and the -ed are lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'worked', seg: [178.7, 182.2],
      stem: 'Fill the gap: “we know how hard ___ on this”',
      choices: ['you’ve worked', 'you worked', 'you work'], a: 0,
      cue: '「how hard」と「on this」の間、弱い音を含む2語。',
      line: 'we know how hard *you’ve worked* on this',
      said: '「どれだけ頑張って準備したか、分かってる」。',
      mean: 'you’ve は「ユーv」と短く、v が次の worked に溶けこむ。今までの努力を表す現在完了。',
      trap: '’ve はほぼ聞こえず you worked に取りやすい。v の唇の音が残っているかを聞く。',
      use: 'You’ve worked so hard this year.（今年はほんとに頑張ったね）' },

    // R fix: V2 (blind 65 %): "all love that show" was a filler; now the literal-praise reading
    // why: life of the party ← "highlight" taken as plain praise for the mom; too long ← "recapping an episode" heard as a
    //   complaint about a long story
    { id: 'i1', skill: 'infer', level: 'C1', point: 'yellowstone', seg: [180.0, 187.4],
      stem: 'What does the remark about Freddie’s mom’s TV recap say about the party?',
      choices: ['Nothing else so far has been much fun', 'Freddie’s mom was the life of the party',
                'Her recap ran far too long for them'], a: 0,
      cue: '「highlight」が何を一番に選んだか。',
      line: 'Freddie’s mama *recapping an episode* of Yellowstone was *the highlight* of the night',
      said: '「Freddie のママのドラマのあらすじ話が、今夜一番よかった」と言う。',
      mean: 'それが一番なら、ほかは全部それ以下。ほめる形で、会がつまらないと伝えている。',
      trap: 'recap を長話への文句と取りやすいが、言っているのは「一番よかった」。',
      use: 'Honestly, the snacks were the highlight.（正直、おやつが一番よかった）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'outta', seg: [195.3, 198.85],
      stem: 'Type the end: “but after that we are ___.” (3 words)', answer: 'out of here',
      cue: '「after that we are」のあと、文の終わり。',
      line: 'but after that we are *out of here*.',
      said: '「でもそのあとは帰るから」。out of here が「アウダヒア」とつながる。',
      mean: 'out of here ＝ もう帰る。くだけた決まり文句。',
      trap: 'of がほぼ消えて outta に聞こえるが、書き取りでは入れる。',
      use: 'Okay, I’m out of here. Bye!（じゃ、帰るね。バイバイ！）' },

    // R fix: V2 (blind 70 %) and K5: the key alone was a "To…" purpose; all three are now purposes
    // why: honest view ← "I have always thought" taken as a real, old opinion; livelier ← speeding up a song to
    //   liven up a flat party
    { id: 'i2', skill: 'infer', level: 'C1', point: 'slow', seg: [202.4, 214.6],
      stem: 'Why does someone say the birthday song was always “too slow”?',
      choices: ['To get the cake part over with sooner', 'To make the old song feel more lively',
                'To give an honest view they’ve long held'], a: 0,
      cue: '少し前の「no time」と、歌い方の速さ。',
      line: '*no time*, everybody sing… I have always thought that song was *too slow*',
      said: '「時間がない、歌って」と急がせ、途中で「この歌、前から遅いと思ってた」と言う。',
      mean: 'ケーキが済めば帰れるので、早く終わらせたい。「前から」は口実。',
      trap: 'always thought を本当の好みと取りやすい。直前の no time と合わせて聞く。',
      use: 'No time—let’s skip to the good part.（時間ないから、いいとこまで飛ばそう）' },

    // R fix: V2 (blind 60 %) and S1: "handed to the women" in the stem set up the key's complaint; neutral stem
    // why: pleased ← "take on" heard as gladly taking on a job; worried ← "a whole new cake" sounds like a lot of work
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'labor', seg: [238.8, 251.9],
      stem: 'When it’s suggested Millicent and Freddie’s mom bake a cake, what’s the reaction?',
      choices: ['Annoyed that the women get the job again', 'Pleased to be trusted with the baking',
                'Worried she can’t bake a cake in time'], a: 0,
      cue: 'すぐあとの、「once」で始まる一言。',
      line: '*Once again* the women take on the emotional labor.',
      said: '「女の人たちで焼けばいい」と言われ、「またしても女が気づかいの係」と言う。',
      mean: 'once again ＝ またしても。不満を込め、仕事を別の人に回している。',
      trap: 'take on を「喜んで引き受ける」と取りやすいが、once again は「またか」。',
      use: 'Once again, I’m doing the dishes.（またしても私が皿洗い）' },

    // R fix: V2 (blind 55 %): "real danger" was a filler; now a tired-guests reading
    // why: tired out ← the long silence after "everybody"; the playlist ← "awesome playlist that Pearl obviously
    //   made" just before
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'alone', seg: [266.6, 275.3],
      stem: 'After “I said everybody,” what does the next line show?',
      choices: ['Gloom that nobody will join in', 'Embarrassment over Pearl’s playlist', 'Worry that the guests are tired out'],
      a: 0,
      cue: '呼びかけのあとの沈黙と、次の短い一言。',
      line: 'I said *everybody*. … We’re gonna *die alone*.',
      said: '「全員」と言っても誰も踊らず、「僕たち、ひとりで死ぬんだ」とつぶやく。',
      mean: 'die alone ＝「一生ひとりぼっち」という大げさな嘆き。',
      trap: 'playlist の直後なので選曲の話に取りやすいが、誰も踊らない沈黙のあとの大げさな嘆き。',
      use: 'Nobody came. I’m going to die alone.（誰も来ない。一生ひとりだ）' },

    // R fix: V2 (blind 70 %): "clean up the mess" was a filler; now a payback reading
    // why: a confession ← "I flushed your fish" taken as a real admission; payback ← she is being ignored, and the
    //   news is cruel
    { id: 'i4', skill: 'infer', level: 'C1', point: 'fish', seg: [281.6, 290.2],
      stem: 'Why does Millicent’s grandma say she flushed the fish away?',
      choices: ['To check whether Millicent is listening', 'To own up to something she felt bad about',
                'To get back at Millicent for ignoring her'], a: 0,
      cue: '前後の「uh-huh」の返事。',
      line: '*I flushed your fish* Donut down the toilet. — *Uh-huh.*',
      said: '「卵が多すぎ」「うん」、「魚をトイレに流した」「うん」と同じ返事が続く。',
      mean: 'わざとひどいことを言い、上の空かどうか確かめている。',
      trap: '告白や仕返しと取りやすいが、ポイントは同じ uh-huh。反応のなさを試している。',
      use: 'Are you even listening to me?（ちゃんと聞いてる？）' },

    // R fix: V2 (blind 85 %): naming "dope" made it a vocabulary question; the stem now asks how she describes him
    // why: goofy ← the older slang "dope" = a fool (dopey); easygoing ← "dope" heard through "doped up" = mellow
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'dope', seg: [296.3, 302.4],
      stem: 'How does Millicent describe Derek to her grandma?',
      choices: ['As kind and really cool', 'As kind but a bit goofy', 'As kind and very easygoing'], a: 0,
      cue: '「kind and」のあとの一語。',
      line: 'someone as *kind and dope* as Derek',
      said: '「いつか Derek みたいに優しくてイケてる人が見つかりますように」。',
      mean: 'dope ＝（若者言葉で）最高、かっこいい。',
      trap: 'dope は古くは「まぬけ」の意味もある。並んだ kind と同じ向きのほめ言葉。',
      use: 'That concert was dope!（あのライブ最高だった！）' },

    // R fix: V2 (blind 55 %): "stop baking" was a filler; now a topic switch back to the eggs
    // why: grants the point ← "I understand" heard as agreement; the eggs ← "too many eggs" came up just before
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'understand', seg: [302.2, 309.8],
      stem: 'What does Grandma do with her reply “Oh, I understand…”?',
      choices: ['Turns the word into an order', 'Grants Millicent’s point at last', 'Steers the talk back to the eggs'], a: 0,
      cue: '「understand that」のあとに続く中身。',
      line: 'you just don’t understand. — Oh, *I understand* that you’re gonna *put that phone down*',
      said: '「分からないのよ」に「分かってるよ、あんたが電話を置いて手伝うってことはね」。',
      mean: '相手の understand を受けて、中身を命令にすり替える切り返し。',
      trap: 'I understand を同意と取りやすいが、that のあとが本題。',
      use: 'Oh, I understand—you’re doing the dishes.（分かってるよ、あんたが皿洗いね）' },

    // R fix: V2 (blind 75 %): "calming down" was vague; now "about to give in", the reading "I'm sorry" invites
    // why: see her phone ← look = 見て; give in ← "I'm sorry" right after sounds like backing down
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [318.6, 327.6],
      stem: 'What does “look” do as Millicent starts her reply?',
      choices: ['Signals she’s about to push back', 'Signals she’s about to give in', 'Asks Grandma to look at her phone'],
      a: 0,
      cue: '返事の最初の一語と、そのあとの調子。',
      line: '*Look*, I’m sorry if I’m focused on the best thing in my life',
      said: '「ねえ、人生最高のものに夢中でケーキどころじゃないなら、悪いけど」と言い返す。',
      mean: '文頭の look ＝「いい？」「あのね」。言い分を通す前置き。',
      trap: 'すぐ I’m sorry が続くので折れたように聞こえるが、文頭の look は言い返す前の合図。',
      use: 'Look, I just need a minute.（ねえ、ちょっと時間ちょうだい）' },

    // R fix: V2 (blind 60 %): the key was the only "No"; now two "No" readings and a scoped "Partly"
    // why: a joke to calm her ← "dumb cake… way too many eggs" heard as teasing; partly ← sorry for ignoring the
    //   cake but not for Derek (scope: she belittles the cake itself)
    // anchor: 324.6–330.8 s "and not some dumb cake…", then "Derek's gonna flip me back right now": she belittles the
    //   task and goes straight back to Derek
    { id: 'c4', skill: 'pragma', level: 'C2', point: 'look', seg: [318.6, 331.0],
      stem: 'Is Millicent’s “I’m sorry if…” a real apology?',
      choices: ['No: it defends what she is doing', 'No: it’s a joke to calm Grandma down',
                'Partly: sorry for the cake, not Derek'], a: 0,
      cue: '「sorry if」のあとに続く中身と、最後の一言。',
      line: 'I’m *sorry if* I’m focused on the best thing in my life… and not some *dumb cake*',
      said: '「最高のものに夢中で、くだらないケーキどころじゃなくて悪いけど」と言い、Derek に戻る。',
      mean: 'sorry if ～ は謝る形で相手を責める言い方。dumb cake で本心が分かる。',
      trap: 'sorry があれば謝罪と取りやすい。if のあとに自分の正しさが続けば形だけ。',
      use: 'Sorry if I care about being on time.（時間を守りたくて悪かったね）' },

    // R fix: the answer's curly apostrophe fails the dict rule (straight now, in the line too)
    // anchor: 322.9–323.7 s "that'll ever be" in both sources, after "the best thing in my life", run together
    { id: 'c5', skill: 'dict', level: 'C2', point: 'everbe', seg: [319.6, 324.35],
      stem: 'Type the end: “the best thing in my life ___” (3 words)', answer: "that'll ever be",
      cue: '「in my life」のすぐあと、「and」の前。',
      line: "the best thing in my life *that'll ever be*",
      said: '「人生で最高のもの」に続く部分。that’ll ever be がひと続きで、that’ll は「ザロ」に近い。',
      mean: 'ever happen と言うところを ever be で終える崩れた形。熱くなって文が流れている。',
      trap: '文法に合わせて語を補いたくなるが、聞こえた3語をそのまま書く。',
      use: 'Best pizza that’ll ever exist, honestly.（史上最高のピザだよ、ほんと）' },
  ]
};
