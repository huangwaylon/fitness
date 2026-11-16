// “Halloween Contest - The Office US” (the official The Office channel, BEST OF SEASON 7): the office goes all out for
// a costume contest whose prize is a coupon book "worth over $15,000 in savings"; Pam's paired costume falls flat
// without Jim, Kelly is challenged for changing costumes, Oscar scoffs at the prize and wins it anyway.
// Segments from the captions, words from whisper (2026-11-16); whisper's timings drift after ~195 s, so the captions'
// are used there. Untested: 16–30 s ("Two seconds, McRobert/McGrubber" shouted over the talking head), 62–70 s
// (Dwight's jab at Pam), 78–79 s and 91.8 s ("I am Popeye", "No.": visual), 122–131 s (True Blood; "How many…"/"I'm
// any…" disagree), 138–143 s, 157–196 s (Michael's costume of a coworker: a race-based gag), 232–243 s (whose costume
// and why: visual), 246–253 s (Popeye: visual), 279–288 s (Nader, Edward James Olmos: world knowledge).
// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 2
//   Open: s1 stays about 55 % blind, because the title primes a Halloween pun on "help"; kept (the only sound item,
//   and the trap is the phone script).
// EAR CHECK: 12.9 s s1 — "haunt" (both sources), not the script's "help": confirm the vowel
// EAR CHECK: 47.5 s nt1 — "If I was the real" (both sources): confirm "was", not "were", and all five words
import type { Clip } from '../types.ts';

export const costumePrize: Clip = {
  id: 'costumeprize', video: '7GXJroiTMMc', title: 'Halloween Contest', dur: 309, wpm: 150, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 + K5 (blind 70 %): the key was the only "X means…; Y means…" choice; now all three share that frame
    // why: political one ← Michael Moore's name heard as Kevin's political message; flipped ← "statement" said by
    //   both, so who means what is easy to swap
    { id: 'h1', skill: 'humor', level: 'C1', point: 'statement', seg: [0, 8.6],
      stem: 'Why is Kevin’s answer to Oscar funny?',
      choices: ['Oscar means a message; Kevin means a likeness', 'Oscar means a message; Kevin gives a political one',
                'Oscar means a likeness; Kevin gives a message'], a: 0,
      cue: 'statement を二人がどういう意味で使っているか。',
      line: 'what kind of *statement* are you making…? — The statement that I am making… is *I kind of look like* Michael Moore.',
      said: '「どんな主張を？」に「僕の主張は、ちょっと似てるってこと」と答える。',
      mean: 'make a statement ＝ 意見を表す。同じ語を返して、中身は「似ている」だけ。',
      trap: '有名人の名で政治の話に聞こえる。kind of look like が答えの中身。',
      use: 'That outfit really makes a statement.（その服、すごく主張してるね）' },

    // why: help ← the phone script "How can I help you?"; hunt ← haunt's long, round vowel heard as hunt's short one
    { id: 's1', skill: 'sound', level: 'B2', point: 'haunt', seg: [9.4, 13.95],
      stem: 'Fill the gap: “How can I ___ you today?”',
      choices: ['help', 'haunt', 'hunt'], a: 1,
      cue: 'Happy Halloween のあと、決まり文句の動詞。',
      line: 'Happy Halloween. How can I *haunt* you today?',
      said: '電話に「ハッピーハロウィン。どう取りつきましょう？」と出る。',
      mean: 'help you の help を haunt（取りつく）に替えたしゃれ。',
      trap: '決まり文句を知っていると help に聞こえる。haunt は口を丸めて長く、hunt は短い。',
      use: 'Thanks for calling. How can I help you?（お電話ありがとうございます。ご用件は？）' },

    // R fix: V2 (blind 90 %): the scaring filler went; a second prize-type reason (the usual office prize) replaces it
    // why: Pam's plans ← "Pam's got a lot of fun stuff planned" comes first; a day off ← the usual office-contest prize
    //   (broken script), and "prize" is said
    { id: 'g1', skill: 'gist', level: 'B2', point: 'why', reveals: ['dowith'], seg: [13.6, 43.4],
      stem: 'Why is the office so keen on the costume contest this year?',
      choices: ['A prize that sounds valuable is up for grabs', 'Pam has planned a lot of fun things around it',
                'The winner gets the rest of the day off work'], a: 0,
      cue: 'costume contest の話のあと、Might で始まる文。',
      line: 'People are really into the costume contest this year. *Might have something to do with the prize.*',
      said: '「今年はみんな仮装コンテストに夢中。賞品のせいかもね」と話し、その賞品を紹介する。',
      mean: '盛り上がりの理由は、高そうに聞こえる賞品。これがこのあとの騒ぎの中心になる。',
      trap: 'パムの企画の話が先に来るので、それが理由に聞こえる。理由は Might のあと。',
      use: 'Everyone’s really into it this year.（今年はみんなすごくハマってる）' },

    // R fix: V2 (blind 55 %): three parallel "It may…" choices, so the key isn't the only hedged one
    // why: a task ← "have something to do" read as having a job to do; not ready ← "do" heard as work still left
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'dowith', seg: [34.3, 37.3],
      stem: 'What does the speaker suggest about the prize?',
      choices: ['It may be part of why people care so much', 'It may come with something the winner must do',
                'It may still need some work before it’s ready'], a: 0,
      cue: 'Might have のあと、with まで一続き。',
      line: '*Might have something to do with* the prize.',
      said: '「賞品と関係があるかもね」と言う。',
      mean: 'have something to do with ～ ＝ ～と関係がある。理由をやんわり言う形。',
      trap: 'something to do を「やること」と取ると作業の話になる。with まで一続きで「関係」。',
      use: 'Maybe it has to do with the weather.（天気のせいかもね）' },

    // why: $1,500 ← "fifteen thousand" vs "fifteen hundred"; $50,000 ← fifteen/fifty
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifteen', seg: [37.1, 43.3], keep: true,
      stem: 'How much does the coupon book say it can save you?',
      choices: ['Over $1,500', 'Over $15,000', 'Over $50,000'], a: 1,
      cue: 'worth over のあと。',
      line: 'coupon book worth *over $15,000* in savings.',
      said: '「2011年版の地元の割引券の本。1万5千ドル以上お得」と紹介する。',
      mean: 'in savings ＝ 節約できる額。賞品の値段ではなく、全部使えばの話。',
      trap: 'fifteen は後ろが強く、fifty は前が強い。thousand の「サウ」も確かめる。',
      use: 'It’ll save you over fifty dollars.（50ドル以上お得です）' },

    // anchor: 47.5–48.0 s both sources have "If I was the real": five words in about half a second, with "was" where
    //   school grammar wants "were"
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'ifiwas', seg: [46.5, 50.5],
      stem: 'Type what he says: “___ Scranton Strangler, you’d be so strangled by now.” (5 words)',
      answer: 'if i was the real',
      cue: 'Too late のすぐあと。文法より、聞こえた音を。',
      line: 'Too late. *If I was the real* Scranton Strangler, you’d be so strangled by now.',
      said: '忍び寄って「俺が本物の絞殺魔なら、もう絞められてるぞ」と言う。5語が0.5秒ほどで流れる。',
      mean: '仮定の if I was は会話でふつうの形。文頭の5語は弱く短く、real だけが強い。',
      trap: '習った文法で If I were と書きたくなる。書き取りは正しい文でなく、言われた音を書く。',
      use: 'If I was you, I’d take the job.（私だったらその仕事を受けるね）' },

    // R fix: V2 (blind 80 %): three parallel "His big X makes/has…" choices; the contest filler went
    // why: brave ← "you will get caught. By me!" heard as the point of the reply; convinced ← "convince us" heard as
    //   having succeeded
    { id: 'i1', skill: 'infer', level: 'C1', point: 'convince', seg: [50.8, 58.75],
      stem: 'What does the reply beginning “Sounds like someone’s…” suggest?',
      choices: ['His big denial makes him look guilty', 'His big promise makes him look brave',
                'His big act has convinced everyone'], a: 0,
      cue: 'really trying to のあと、何を信じさせたいか。',
      line: 'you will get caught. By me! — Sounds like someone’s *really trying to convince us* that he’s *not* the Scranton Strangler.',
      said: '「必ず捕まえる。俺がな」に「必死に犯人じゃないと信じさせたいみたい」と返す。',
      mean: '「必死に否定する人ほど怪しい」という冗談で、からかっている。',
      trap: 'convince を「納得させた」と取ると疑いが晴れた話になる。really trying ＝ 必死。',
      use: 'Someone’s trying a little too hard.（誰かさん、ちょっと頑張りすぎ）' },

    // R fix: N6: the trap's word for "coward" used a kanji outside the trimmed font; it says 弱虫 now
    // why: scared chickens ← "to my chickens" heard as how his costume looks to them; cowards ← "chickens" as slang
    //   for cowards, aimed at the people teasing him
    { id: 'h2', skill: 'humor', level: 'C1', point: 'chickens', seg: [55.3, 61.2],
      stem: 'What does the answer about “my chickens” mean?',
      choices: ['He does kill chickens, and says so proudly', 'His costume would frighten his chickens',
                'He calls the people teasing him cowards'], a: 0,
      cue: 'To my chickens のあと、自分を何と呼ぶか。',
      line: '*To my chickens*, I’m the Scranton Strangler.',
      said: '「必死だね」とからかわれ、「うちの鶏にとっては、俺が絞殺魔だ」と返す。',
      mean: '農場で鶏をしめるので、鶏から見れば自分は絞殺魔。誇らしげに認めている。',
      trap: 'chicken には「弱虫」の意味もあり、悪口に聞こえやすい。my が付くので自分の鶏。',
      use: 'To my kids, I’m the bad guy.（子どもたちから見れば、私は悪者）' },

    // R fix: V2 (blind 85 % with the header): all three are now about Jim
    // why: not in yet ← "standing next to Popeye" heard as Jim simply not being there; another costume ← "Jim" and
    //   "costume" heard without "doesn't want to put… on"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'popeye', reveals: ['putcost'], seg: [70.35, 78.1],
      stem: 'Why doesn’t Pam’s costume quite work yet?',
      choices: ['Jim won’t put on the matching costume', 'Jim hasn’t come in to work yet today',
                'Jim chose a different costume to wear'], a: 0,
      cue: 'makes more sense when のあと、but 以下。',
      line: 'it makes more sense when I’m standing next to Popeye, *but Jim doesn’t want to put his costume on*.',
      said: '「オリーブ・オイルのつもり。ポパイの隣なら分かるけど、ジムが衣装を着ないの」と言う。',
      mean: '二人一組の仮装なので、相手がいないと誰だか伝わらない。',
      trap: 'Jim と costume だけ拾うと、別の衣装や不在の話に聞こえる。but のあとの動詞まで聞く。',
      use: 'It makes more sense with the photo.（写真があればもっと分かるよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'putcost', seg: [75.5, 78.0],
      stem: 'Type what Pam says: “Jim doesn’t ___ his costume on.” (3 words)', answer: 'want to put',
      cue: 'doesn’t のあと、つながった3語。',
      line: 'but Jim doesn’t *want to put* his costume on.',
      said: '「でもジムが衣装を着たがらないの」と言う。',
      mean: 'want to put は「ワナプッ」とつながり、t がほぼ消える。put ～ on ＝ 身につける。',
      trap: 'want to が「ワナ」に縮み、put の t も弱い。語の数を数えながら聞くと区切れる。',
      use: 'I don’t want to put a tie on.（ネクタイしたくない）' },

    // why: loved them once ← "when I was a kid" heard as the time he liked them; goes along ← "Pam hands me" heard as
    //   agreeing to wear whatever she picks
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'costumeguy', seg: [79.8, 89.6],
      stem: 'In his comment to the camera, how does Jim feel about costumes?',
      choices: ['He’s never liked them, even as a child', 'He loved them as a kid but grew out of it',
                'He’ll wear one if Pam picks it for him'], a: 0,
      cue: 'when I was a kid の前の一語と、そのあと。',
      line: 'I’ve *never really been a costume guy*. Even when I was a kid, it just felt like something I was *too old for*.',
      said: '「仮装は好きじゃない。子どもの頃でさえ、幼すぎる気がした」と話す。',
      mean: '一度も好きではなかった。too old for ＝ ～するには大人すぎる。',
      trap: 'when I was a kid で「昔は好きだった」と思いやすい。Even は「～でさえ」。',
      use: 'I’ve never really been a morning person.（朝はずっと苦手）' },

    // why: an entry number ← "number" heard as a contest number; a phone number ← "number" read literally
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'number', seg: [86.1, 89.4],
      stem: 'What has Pam handed Jim this morning?',
      choices: ['An outfit for him to wear', 'A number for the contest', 'A note with a phone number'], a: 0,
      cue: 'Pam hands me のあと、little の付いた言い方。',
      line: 'And then this morning, Pam hands me *this little number*.',
      said: '「そして今朝、パムがこの『一着』を渡してきた」と話す。',
      mean: 'a little number ＝ 目を引く一着のくだけた言い方。ここではポパイの衣装。',
      trap: 'number を数字や番号と取りやすい。this little number は服を指す。',
      use: 'Check out this little number I bought.（この服見て、買っちゃった）' },

    // why: same costume ← a common contest rule; voting for herself ← the rule announced later
    { id: 'd2', skill: 'detail', level: 'B2', point: 'kelly', seg: [96.3, 101.9],
      stem: 'Why does someone say Kelly should be out of the contest?',
      choices: ['She changed costumes partway through the day', 'She came in the same costume as someone',
                'She was caught voting for her own costume'], a: 0,
      cue: 'you cannot のあと、in the middle of。',
      line: 'Kelly, you *cannot change costumes in the middle of the day*. Pam, she’s out.',
      said: '「途中で衣装を変えちゃだめ。彼女は失格」と訴える。',
      mean: 'in the middle of the day ＝ 途中で。she’s out ＝ 失格。',
      trap: 'cannot の t は弱く can に聞こえる。can では she’s out と合わない。',
      use: 'You can’t change plans halfway through.（途中で予定は変えられないよ）' },

    // R fix: V2 (blind 60 %): the key was the only threat; a second threat (quitting, "this entire company") now sits
    //   next to it
    // why: quit ← "this entire company" plus a threat, heard without "sue"; asks first ← the opening "Um, if I'm out"
    //   heard as a question
    { id: 'r1', skill: 'pragma', level: 'B2', point: 'sue', seg: [100.3, 105.7],
      stem: 'What is Kelly doing with her reply?',
      choices: ['Threatening to take the company to court', 'Threatening to quit the company if she’s out',
                'Asking Pam to explain the rule first'], a: 0,
      cue: 'if I’m out のあと、I’m going to。',
      line: 'If I’m out, I’m going to *sue this entire company* for discrimination.',
      said: '「私を外すなら、差別で会社全体を訴える」と返す。',
      mean: 'if ～, I’m going to ～ は脅しの型。大げさな脅しで失格を取り消させたい。',
      trap: 'this entire company で「辞める」とも取れる。going to のあとの動詞を聞く。',
      use: 'If you cancel, I want a refund.（キャンセルするなら返金してね）' },

    // why: 1 in 6 ← -teen's ending missed; 1 in 60 ← sixteen/sixty
    { id: 'n2', skill: 'number', level: 'B1', point: 'odds', seg: [105.4, 108.5], keep: true,
      stem: 'What are their chances of winning, according to Oscar?',
      choices: ['1 in 6', '1 in 16', '1 in 60'], a: 1,
      cue: 'arguing over a のあと。',
      line: 'you’re arguing over *a 1 in 16 chance*',
      said: '「君たち、16分の1の確率で言い争ってる」と言う。',
      mean: '1 in 16 ＝ 16人に1人。勝てる見込みは小さいという指摘。',
      trap: 'sixteen は後ろの -teen が強く長い。sixty なら前が強く、終わりは短い「ティ」。',
      use: 'There’s a one in ten chance of rain.（雨の確率は10分の1）' },

    // R fix: V2 (blind 90 %): the "worth more" and "good chance" choices clashed with his tone; now a share-it reading
    //   and a better-odds reading of "1 in 16"
    // why: share it ← "1 in 16" heard as splitting the prize sixteen ways; better odds ← "chance" heard on its own
    { id: 'i2', skill: 'infer', level: 'C1', point: 'worth', reveals: ['forty', 'odds', 'fifteen'], seg: [105.4, 113.65],
      stem: 'What point is Oscar making to the others?',
      choices: ['The prize isn’t worth all this fighting', 'The prize should be shared among them',
                'The odds of winning are better than they think'], a: 0,
      cue: 'chance のあとの数字二つと、そのあとの言い返し。',
      line: 'a 1 in 16 chance, over a prize *worth 40 bucks*. — *15,000 bucks*, Oscar.',
      said: '「16分の1の確率で、40ドルの賞品を争ってる」に「1万5千ドルよ」と返される。',
      mean: '割引額の合計と実際に得する額は違う、という冷静な指摘。',
      trap: '1 in 16 を「分け合う」「勝ちやすい」と取りやすい。worth のあとの数字が言いたいこと。',
      use: 'It’s not worth fighting over.（取り合うほどのものじゃない）' },

    // why: $14 ← forty/fourteen; $400 ← the big numbers all around it ($15,000)
    { id: 'n3', skill: 'number', level: 'B2', point: 'forty', seg: [107.85, 111.05], keep: true,
      stem: 'How much does Oscar say the prize is really worth?',
      choices: ['$14', '$40', '$400'], a: 1,
      cue: 'a prize worth のあと。',
      line: 'over a prize *worth 40 bucks*.',
      said: '「40ドルの価値しかない賞品で」と言う。',
      mean: 'bucks ＝ ドルのくだけた言い方。1万5千ドルは全部使えばの額で、実際の価値は小さい。',
      trap: 'forty は前が強く、fourteen は後ろが強い。強いのがどこかで聞き分ける。',
      use: 'It cost me forty bucks.（40ドルかかった）' },

    // why: sarcastic ← "I don't even want to give Pam a compliment" heard as the real point; on her side ← praising the
    //   organizer heard as a tactic to win
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'grudge', seg: [113.4, 123.2],
      stem: 'In her comment to the camera, how does she feel about Pam?',
      choices: ['She dislikes Pam but admits she did well', 'She thinks Pam did a poor job, sarcastically',
                'She likes Pam and wants to stay on her side'], a: 0,
      cue: 'compliment のあと、話の向きが変わる所。',
      line: 'I don’t even want to give Pam a compliment… *but she did a good job*.',
      said: '「パムをほめたくもないけど、よくやった。あの本、本当に欲しい」と話す。',
      mean: '嫌いな相手でも、賞品が良いことは認めている。しぶしぶのほめ言葉。',
      trap: '前半だけ聞くと皮肉に聞こえる。but のあとが本音で、ここでは本当に認めている。',
      use: 'I hate to say it, you were right.（言いたくないけど、君が正しかった）' },

    // R fix: V2 (blind 85 %): three "His 'costume' is…" choices
    // why: a thinker ← "rational consumer" heard as a character's name; on sale ← "consumer" heard as shopping plans
    { id: 'h3', skill: 'humor', level: 'C1', point: 'rational', seg: [132.0, 136.6],
      stem: 'What does Oscar mean when he says he’s “still in costume”?',
      choices: ['His “costume” is just his sensible view of buying', 'His “costume” is a famous thinker on shopping',
                'His “costume” is one he’ll buy when it’s on sale'], a: 0,
      cue: 'I’m a のあと、自分を何と呼ぶか。',
      line: 'I guess you could say I’m *still in costume*. I’m a *rational consumer*.',
      said: '衣装なしで「まだ仮装中とも言える。合理的な消費者だ」と言う。',
      mean: 'rational consumer ＝ 冷静に買う人。割引券に飛びつかない自分が「仮装」。',
      trap: '人名や買い物の予定と取りがち。you could say ＝ 言ってみれば。',
      use: 'Let’s be rational about this.（ここは冷静に考えよう）' },

    // R fix: V2 (blind 75 %): all three are now about Oscar and the line
    // why: from Phyllis ← "say it to Phyllis" heard as hearing it from her; went down badly ← Phyllis is named, and the
    //   reply is flat
    { id: 'i3', skill: 'infer', level: 'B2', point: 'line', seg: [143.6, 148.3],
      stem: 'What does the reply about Phyllis tell us?',
      choices: ['Oscar keeps using the same line on people', 'Oscar first heard the line from Phyllis',
                'Oscar’s line went down badly with Phyllis'], a: 0,
      cue: 'I heard you のあと、誰に言ったか。',
      line: 'I’m a rational consumer. — Yeah, *I heard you say it to Phyllis*.',
      said: '「僕の衣装、見た？合理的な消費者」に「フィリスに言ってたね」と返される。',
      mean: 'オスカーが同じ決めゼリフを何人にも言って回っている、と分かる。',
      trap: 'Phyllis が最後に来るので、フィリスのセリフに聞こえる。say it to ＝「～に言う」。',
      use: 'I’ve heard that one before.（それ、前にも聞いたよ）' },

    // R fix: V2 (blind 70 %): three "You can('t) vote…" choices, one a can/can't near sound
    // why: just once ← can't heard as can (the t is barely there); own team ← the usual conflict-of-interest rule,
    //   with "yourself" missed
    { id: 'd3', skill: 'detail', level: 'B1', point: 'rule', seg: [148.3, 155.2],
      stem: 'What is the one rule for voting?',
      choices: ['You can’t vote for yourself', 'You can’t vote for your own team',
                'You can vote for yourself just once'], a: 0,
      cue: 'everyone has to vote のあと、and 以下。',
      line: 'everyone has to vote for who gets the coupon book, and *you can’t vote for yourself*.',
      said: '「ランウェイを歩いたら全員が投票。自分には投票できません」と説明する。',
      mean: '自分以外に入れる、というルール。これがこのあとの結果につながる。',
      trap: 'can と can’t は t がほぼ聞こえない。can’t は母音が長く強く、can は弱く短い。',
      use: 'Sorry, you can’t vote twice.（すみません、2回は投票できません）' },

    // R fix: V2 (blind 70 %): the polite-request filler went; "as you were" (a near sound) replaces it
    // why: as it was ← "were" read as a past form; as you were ← it/you are both weak, and "As you were" is a set phrase
    { id: 'p3', skill: 'phrase', level: 'C1', point: 'asitwere', seg: [214.3, 219.9],
      stem: 'When “the rational consumer” is presented, what do the last two words add?',
      choices: ['“So to speak,” since it isn’t a real costume', '“As it was,” since he wore it earlier too',
                '“As you were,” telling everyone to carry on'], a: 0,
      cue: 'consumer のあと、少し間をおいた2語。',
      line: 'I present to you the rational consumer. *As it were.*',
      said: 'ランウェイで「合理的な消費者をご紹介します。いわば、ですが」と言う。',
      mean: 'as it were ＝ いわば。本物の衣装ではないので、断りを入れている。',
      trap: 'were を過去と取ったり as you were と聞いたりしがち。決まり文句で覚える。',
      use: 'He’s our leader, as it were.（彼はいわば私たちのリーダー）' },

    // R fix: V2 (blind 60 %): three named winners now; the called-off filler went
    // why: Kelly �� the long fuss over her costume change; Kevin ← his costume opens the clip
    { id: 'g2', skill: 'gist', level: 'B1', point: 'winner', seg: [258.4, 288.0],
      stem: 'How does the costume contest end?',
      choices: ['Oscar wins without a real costume', 'Kelly wins in the costume she changed into',
                'Kevin wins with his Michael Moore look'], a: 0,
      cue: 'tallied the votes のあと、呼ばれる名前。',
      line: 'I’ve tallied the votes, and the winner… *Oscar Martinez*.',
      said: '「集計しました。優勝者は、オスカー・マルティネス」と発表する。',
      mean: '賞品をばかにして、ちゃんと仮装もしなかったオスカーが勝つ、という皮肉な結末。',
      trap: 'ケリーの衣装でもめた話が長いので、その結果に聞こえやすい。最後に呼ばれる名前で決める。',
      use: 'And the winner is…（そして優勝は…）' },

    // R fix: V2 (blind 55 %) + C4: the stem named Oscar's win (g2's key), so nt2 revealed `winner` and blocked a C2 in
    //   some play-3 draws; it now asks what the comments explain, without naming the winner
    // why: the idea ← "That's a good line" was said about his joke earlier; sympathy ← the winner had no real costume
    // anchor: 258.9–267.0 s Oscar is named the winner; then to camera 273.5–276.4 s "If I have to vote for someone, I
    //   don't want it to be someone who can beat me", and 278.2 s "Shake things up"
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'win', seg: [258.4, 279.5],
      stem: 'What do the comments to the camera after the result explain?',
      choices: ['Why votes went to someone who was no threat', 'Why votes went to the cleverest costume idea',
                'Why votes went to whoever people felt sorry for'], a: 0,
      cue: '結果のあと、カメラへの一言の理由づけ。',
      line: 'If I have to vote for someone, I *don’t want it to be someone who can beat me*.',
      said: '結果発表のあと、カメラに「誰かに入れるなら、自分に勝てそうな人は嫌」と話す人がいる。',
      mean: 'カメラへの本音が結果を書きかえる。自分には入れられないので、脅威にならない相手に票が流れた。',
      trap: '「いいセリフ」と言われていたので、アイデアが評価されたと思いやすい。カメラへの一言が答え合わせ。',
      use: 'I voted for the one who couldn’t win.（勝てなさそうな人に入れた）' },
  ]
};
