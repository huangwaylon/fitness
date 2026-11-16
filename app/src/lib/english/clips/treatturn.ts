// “Parks and Recreation | Treat Yo Self Turnabout (Episode Highlight)” (the official Parks and Recreation channel,
// Season 7): at a sushi bar whose fish once belonged to celebrities, Donna gives Tom her gift: advice to stop checking
// his phone over Lucy and ask her out. Then she adds the shoes he wanted, and a celebrity eats his own sushi.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈82 s (music after). Untested: the
// celebrity names and “Bogdano-delish” at 6–18 s (captions garble them), “son of a Hitch” at 39.7 s, the order at
// 73–77 s (“the me… soft shell crab”: speaker and words unclear), and “balling” vs “baller” at 80.4 s. Also 65.5 s:
// whisper “I did get you them shoes from Hitch 2”, captions “them some hits, too” (no key rests on it since review).
// REVIEW 2026-11-16: pass 6, fix 15, drop 0, new 0; ear checks 0
// REVIEW open: n1 and s1 stay near 50 % blind (the idiomatic “every five minutes” / “won’t know until you ask”);
//   h1 and i2 lean on the opening premise (fish once owned by stars), which a blind reader of d1 also learns.
import type { Clip } from '../types.ts';

export const treatTurnabout: Clip = {
  id: 'treatturn', video: 'q99FZO5JXV4', title: 'Treat Yo Self Turnabout (Episode Highlight)', dur: 105, wpm: 154,
  band: 'slow', tags: ['友だち', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 75 %: only the key was an odd "celebrity" idea; all three now pair famous people with the fish.
    //   Cue no longer hints at possession (誰の).
    // why: caught ← "owned by" misheard, and celebrity fishing sounds plausible; chose ← "Charlize Theron's
    //   Yellowtail" heard as a star's pick or recommendation
    { id: 'd1', skill: 'detail', level: 'B1', point: 'fish', seg: [0, 6.4],
      stem: 'At the start, what makes this restaurant’s sushi special?',
      choices: ['Famous people used to own the fish', 'Famous people caught the fish themselves',
                'Famous people picked out the fish'], a: 0,
      cue: '「made from fish」のあと、セレブとの関係。',
      line: 'All the sushi is made from fish, *previously owned by celebrities*.',
      said: '店のすしは「以前セレブが持っていた魚」で作る、と紹介する。',
      mean: 'previously owned ＝ 前の持ち主がいた。中古品の言い方を魚に使う冗談。',
      trap: 'made from を「誰かが作った」と取ると料理人の話になる。owned by は持ち主。',
      use: 'It’s a previously owned car.（中古車です）' },

    // R fix: V2, blind 70 %: "bad mood" and "coming down with something" were off-topic fillers; the new distractors
    //   come from the phone-checking and from his "I'm sorry" right after.
    // why: guilty ← "bad" plus his "I'm sorry" right after; habit ← "checking your phone every five minutes" heard as
    //   the point of "got it bad"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'gotbad', reveals: ['often'], seg: [19.7, 25.25],
      stem: 'When Donna starts with “Man, you…”, what is she saying about Tom?',
      choices: ['He has strong feelings for someone', 'He feels guilty about something', 'He has a habit he can’t break'],
      a: 0,
      cue: '最初の一言と、そのあとのスマホの話をつなげて。',
      line: 'Man, *you got it bad*. I know you’re checking your phone every five minutes…',
      said: '「重症だね」と言い、返事を待って何度もスマホを見ているのを指摘する。',
      mean: 'have/got it bad ＝ 恋にどっぷりはまっている。病気のような言い方で恋心をからかう。',
      trap: 'bad と sorry から「罪悪感」と取りやすい。スマホは恋の証拠。',
      use: 'Wow, you’ve got it bad for her.（彼女にぞっこんだね）' },

    // R fix: V2, blind 70 %: "give up" and "stop checking his phone" didn't fit a friend's advice; the distractors are
    //   now two other ways Donna could have helped. Reveals `upfront` (said: 気持ちを隠さず) and the key's "tell Lucy".
    // why: wait ← "Hey, I understand" and the phone-checking suggest "relax, she'll answer"; keep it to himself ←
    //   "She works for me" is Tom's own worry, not Donna's view
    { id: 'g1', skill: 'gist', level: 'B2', point: 'goal', reveals: ['problem', 'askout', 'upfront'], seg: [20, 61.2],
      stem: 'Over the whole talk, what is Donna trying to get Tom to do?',
      choices: ['Tell Lucy how he feels and ask her out', 'Relax and wait for Lucy to text him back',
                'Keep his feelings for Lucy to himself'], a: 0,
      cue: 'Donna の「My advice」からあとの提案。',
      said: 'ドナはルーシーへの気持ちを隠さず、デートに誘えと勧める。トムは迷っている。',
      mean: '贈り物は「助言」。恋の相談に乗り、背中を押すのがこの場面の目的。',
      trap: '待てば返事が来る、という慰めではない。「部下だから」はトムの不安。誰の言葉かを分けて聞く。',
      use: 'Just go for it.（思い切ってやってみなよ）' },

    // R fix: V2, blind 60 %: the key was the only "scared" problem and "Donna thinks it's a bad idea" was weak; the
    //   choices are now three parallel "He likes Lucy, but…" problems. Reveals `boss` (cue and said quote "works for me").
    // why: leaving Pawnee ← "move to Pawnee for this job" heard as moving away; someone else ← "the only one that caught
    //   feelings" heard as a rival
    { id: 'g2', skill: 'gist', level: 'B2', point: 'problem', reveals: ['fear', 'boss'], seg: [20, 56.2],
      stem: 'What is Tom’s problem in this scene?',
      choices: ['He likes Lucy, but he’s afraid to say so', 'He likes Lucy, but she’s leaving Pawnee',
                'He likes Lucy, but she likes someone else'], a: 0,
      cue: 'トムが「She works for me」から並べる心配。',
      said: 'ルーシーが気になるが、部下だし断られたらと思うと誘えない。',
      mean: '好きなのに踏み出せない、というのが悩み。ドナはそこを押している。',
      trap: 'Pawnee には引っ越して「来た」。the only one は恋敵の話ではなく、自分だけが好きかもという不安。',
      use: 'I like him, but I can’t tell him.（好きだけど、言えない）' },

    // why: every minute ← "five" is short and swallowed between "every" and "minutes"; fifteen ← -teen/five, the
    //   shared "fi-" start
    { id: 'n1', skill: 'number', level: 'B1', point: 'often', seg: [21.3, 25.25], keep: true,
      stem: 'How often does Donna say Tom checks his phone?',
      choices: ['Every minute', 'Every five minutes', 'Every fifteen minutes'], a: 1,
      cue: '「phone」のすぐあと、minutes の前の数。',
      line: 'checking your phone *every five minutes*',
      said: '「5分おきにスマホを見てる」と指摘する。',
      mean: 'every five minutes ＝ 5分ごと。そわそわして何度も確かめている。',
      trap: 'five は短く、every と minutes の間で埋もれやすい。fifteen なら「ティーン」が長く残る。',
      use: 'The bus comes every ten minutes.（バスは10分おきに来ます）' },

    // why: stay in Pawnee ← "move to Pawnee for this job" comes later; the gift ← "I got you something" follows
    { id: 'd2', skill: 'detail', level: 'B1', point: 'wedding', seg: [21.3, 25.25],
      stem: 'What is Tom waiting to hear from Lucy?',
      choices: ['If she will go with him to Donna’s wedding', 'If she will stay in Pawnee for her job',
                'If she liked the gift he gave her'], a: 0,
      cue: '「to see if Lucy」のあと。',
      line: 'to see if Lucy will *come with you to my wedding*.',
      said: 'ルーシーが結婚式に一緒に来てくれるか、返事を待っている。',
      mean: 'come with you to ～ ＝ ～に一緒に行く。結婚式に連れて行く相手の話。',
      trap: 'Pawnee や gift はあとで出てくる語。to see if のあとが、待っている答え。',
      use: 'Will you come with me to the party?（パーティーに一緒に来てくれる？）' },

    // R fix: V2, blind 55 %: "can't make it to her wedding" was a filler. V5: two adjacent lines tied together is B2,
    //   not C1. N7: the line shows "to my wedding", so it reveals `wedding`.
    // why: inviting Lucy ← "come with you to my wedding" heard as an unasked plus-one; going on about Lucy ← "Lucy" is
    //   the topic, and "you got it bad" sounds like he talks of nothing else
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'sorry', reveals: ['wedding'], seg: [21.3, 27.4],
      stem: 'When Tom says “I’m sorry,” what is he apologizing for?',
      choices: ['Checking his phone while they’re out', 'Inviting Lucy along without asking her',
                'Going on about Lucy all day long'], a: 0,
      cue: 'Donna の指摘のすぐあと。何を指摘されたか。',
      line: 'I know you’re *checking your phone*… to my wedding. — *I’m sorry.* — Hey, I understand.',
      said: 'スマホばかり見ていると言われ、トムは「ごめん」と謝る。ドナは「分かるよ」と返す。',
      mean: '二人で過ごす日に気が散っていたことへの謝罪。ドナはそれを責めずに受け止める。',
      trap: 'Lucy や wedding につられやすい。謝罪は直前に指摘された行動に向く。',
      use: 'Sorry, I’m a little distracted today.（ごめん、今日ちょっと上の空で）' },

    // why: bigger gift ← "get me anything" heard as fishing for more; forgot his day ← "your" is weak and heard as
    //   "my special day"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'protest', seg: [27.2, 33.7],
      stem: 'When Donna says she got Tom something, what does his reply do?',
      choices: ['Protests that she shouldn’t give gifts today', 'Hints that he wanted a much bigger gift',
                'Complains that she forgot his special day'], a: 0,
      cue: '「Hey」のあと、誰の特別な日と言っているか。',
      line: 'Hey, *you’re not supposed to* get me anything. This is *your special day*.',
      said: '「僕に何かくれることないよ。今日は君の特別な日だよ」と言う。',
      mean: 'not supposed to ＝「～するものじゃない」。遠慮して贈り物を断る、軽い抗議。',
      trap: 'your は弱く my と紛れやすい。誰の日かを取り違えると、不満の意味になってしまう。',
      use: 'You shouldn’t have! It’s your birthday.（そんなのいいのに！君の誕生日だよ）' },

    // R fix: V2, blind 65 %: only the key named a concrete wish; each choice now names what he'd hoped for, and the
    //   "relieved" distractor comes from his own protest just before.
    // why: touched ← "secretly hoping" sounds warm; relieved ← he had just said she shouldn't get him anything
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'shoes', seg: [33.7, 40.5],
      stem: 'How does Tom react when he learns what the gift is?',
      choices: ['Let down: he’d hoped for some shoes', 'Touched: he’d hoped for her advice',
                'Relieved: he’d asked for no gift'], a: 0,
      cue: '「a piece of advice」の直後、最初の短い一言。',
      line: '*Aw, damn.* I was *secretly hoping* you got me the shoes…',
      said: '「ちぇっ。実は靴を期待してたのに」とがっかりしてみせる。',
      mean: 'Aw, damn ＝「あーあ」。半分は冗談だが、物を期待していたのは本音。',
      trap: 'secretly hoping は温かく聞こえるが、望んでいたのは靴。何を hoping したかまで聞く。',
      use: 'Aw, man. I was hoping for pizza.（あーあ、ピザがよかったなあ）' },

    // R fix: V2, blind 65 %: "quicker than anyone" and "patient until she speaks" read as fillers; rebuilt as two
    //   readings of "up front" (ahead of others / wait your turn) against "open".
    // why: ahead of others ← "up front" read as "in front / first"; patient ← "with her about it" heard as waiting for
    //   her side
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'upfront', seg: [40.2, 46.45],
      stem: 'What does Donna’s first piece of advice ask Tom to be?',
      choices: ['Open with Lucy about what he wants', 'Ahead of anyone else who likes Lucy',
                'Patient and wait for Lucy to be ready'], a: 0,
      cue: '「if you want to be with Lucy」のあと。',
      line: 'you have to be *upfront* with her about it.',
      said: '「付き合いたいなら、そのことを正直に伝えなきゃ」と言う。',
      mean: 'upfront ＝ 隠さず率直に。気持ちを先に打ち明けること。',
      trap: 'up front を「前に・先に」と取ると「先手を打つ」になる。with her about it とセットで「率直に」。',
      use: 'Let me be upfront with you.（率直に言わせてください）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'askout', seg: [44.2, 46.45],
      stem: 'Type what Donna says: “Be a man and ___.” (3 words)', answer: 'ask her out',
      cue: '「Be a man and」のあと。h は聞こえないことが多い。',
      line: 'Be a man and *ask her out*.',
      said: '「男らしく、デートに誘いなさい」と言う。',
      mean: 'ask … out ＝ デートに誘う。her の h が落ちて「アスカラウ(t)」のようにつながる。',
      trap: 'her が弱く、ask out だけに聞こえやすい。動詞と out の間に代名詞が入る形。',
      use: 'He finally asked her out.（彼がついに彼女をデートに誘った）' },

    // R fix: V2, blind 50 %: "leaving Pawnee" was refuted by i1's stem, and "works with Donna" was a weak filler;
    //   now a for/with near sound and a "for" in the wrong relation.
    // why: works with him ← "for" is weak and short, close to "with" in "works for me"; moved for him ← "move to Pawnee
    //   for this job" comes next, with "for" again
    { id: 'd3', skill: 'detail', level: 'B1', point: 'boss', seg: [46.0, 51.6],
      stem: 'What is the first reason Tom gives for not asking?',
      choices: ['She works for him', 'She works with him', 'She moved for him'], a: 0,
      cue: 'ドナの助言のすぐあと、最初の短い一文。',
      line: '*She works for me.* She uprooted her whole life…',
      said: '「僕の部下なんだ」。続けて「この仕事のために人生ごと越してきた」。',
      mean: 'work for ～ ＝ ～の下で働く。上司と部下なので誘いにくい、という理由。',
      trap: 'for は弱く短く、with と紛れやすい。越してきたのは彼のためではなく仕事のため。',
      use: 'I work for a small company.（小さな会社に勤めています）' },

    // R fix: V2, blind 55 %: the key was the only conditional, tied-to-dating choice; all three now link the move to
    //   dating, at equal length.
    // why: no time ← "this job" heard as a workload point; may not stay ← "uprooted her whole life" heard as homesick
    { id: 'i1', skill: 'infer', level: 'C1', point: 'uproot', seg: [46.0, 51.6],
      stem: 'Why does Tom mention that Lucy moved to Pawnee for the job?',
      choices: ['A bad date could ruin the job she moved for', 'A new job leaves her little time for dating',
                'A big move like that means she may not stay'], a: 0,
      cue: '引っ越しの話の直後、何を避けたいと言うか。',
      line: 'She *uprooted her whole life* to move to Pawnee for this job. I don’t want to *make it weird*.',
      said: '「人生ごと移ってきたんだ。気まずくしたくない」と言う。',
      mean: '失敗すれば職場が気まずくなり、彼女が選んだ仕事を壊しかねない、という心配。',
      trap: 'whole life から「ホームシック」や「多忙」を想像しやすい。直後の make it weird が理由。',
      use: 'I don’t want to make things weird.（気まずくしたくないんだ）' },

    // R fix: V2, blind 65 %: "a plan for asking" and "a hope she likes him" were off; the choices are now three fears
    //   with one frame, so only the words of the two "what if" lines settle it.
    // why: quit ← "uprooted… for this job" and "make it weird" suggest she'd leave; seeing someone ← "the only one that
    //   caught feelings" heard as a rival
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'fear', reveals: ['caught'], seg: [51.1, 54.52],
      stem: 'When Tom goes on with “And what if…”, how do his worries change?',
      choices: ['From work to fear she’ll turn him down', 'From work to fear she’ll quit her job',
                'From work to fear she’s seeing someone'], a: 0,
      cue: 'And のあと、文の主語が誰になるか。',
      line: 'And *what if she says no*? What if I’m *the only one* that caught feelings?',
      said: '「断られたら？好きなのが僕だけだったら？」と続ける。',
      mean: '前半は彼女の立場、And からは自分が傷つく不安。本音は後半に出ている。',
      trap: '前の make it weird から「辞める」心配と取りやすい。And のあとは says no の不安。',
      use: 'What if it rains tomorrow?（明日雨だったらどうしよう）' },

    // R fix: V2, blind 75 %, S2: the stem quoted "the only one", which carries most of the key; it now names the
    //   moment, and the distractors read "caught" as caught out and "the only one" in the wrong relation. S4: the
    //   segment was 2.1 s; it now starts before "And what if".
    // why: blamed ← "caught" = caught out (捕まる), with the boss worry before; only one who knows ← "the only one"
    //   heard with the wrong verb
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'caught', seg: [51.45, 54.52],
      stem: 'What does Tom fear in his second “what if” question?',
      choices: ['That he has fallen for her, but she hasn’t for him', 'That he’ll be the one blamed if it goes wrong',
                'That he’ll be the only one at work who knows'], a: 0,
      cue: '「the only one that」のあとの2語。',
      line: 'What if I’m the only one that *caught feelings*?',
      said: '「好きになったのが僕だけだったら？」と不安を言う。',
      mean: 'catch feelings ＝（友だちや同僚に）恋心を抱いてしまう。風邪をひくような言い方。',
      trap: 'caught を「捕まる・責められる」と取りやすい。feelings と組むと「好きになる」。',
      use: 'I think I’m catching feelings for him.（彼のこと好きになってきたかも）' },

    // R fix: S4: the segment was 1.9 s; it now starts before "What if I'm the only one" (3.2 s). Ear check removed
    //   (addendum): both sources have "won't", and a dropped t before "know" is the normal pattern.
    // why: don't ← w and d are both short before "know"; wouldn't ← the linking in "won't‿know" heard as an extra
    //   syllable
    { id: 's1', skill: 'sound', level: 'B2', point: 'wont', seg: [52.85, 56.03],
      stem: 'Fill the gap: “You ___ until you ask.”',
      choices: ['won’t know', 'don’t know', 'wouldn’t know'], a: 0,
      cue: '文の最初、You のすぐあとの短い音。',
      line: 'You *won’t know* until you ask.',
      said: '「聞いてみなきゃ分からないよ」と、トムの不安に答える。',
      mean: 'won’t は「ウォウン」と長めの「オウ」。t はほぼ消えて know につながる。',
      trap: 'don’t でも意味は近いが、音は「ドウン」。最初の子音 w と d を聞き分ける。',
      use: 'You won’t know unless you try.（やってみないと分からない）' },

    // R fix: V2, blind 70 %: only the key was an action; the distractors are now "treat" aimed at her (spoil her) and
    //   "treat yourself" as comfort, so all three read the slogan.
    // why: spoil the one you like ← "treat" = treat someone (ごちそうする), missing "yourself"; be good to yourself if it
    //   hurts ← "what if she says no" just before, so the line sounds like comfort for a rejection
    // anchor: 54.56–60.6 s "You won't know until you ask. Basically… when it comes to matters of the heart, I say treat
    //   yourself": the slogan sums up "ask", so the treat is going after Lucy (both sources agree)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'treat', seg: [54.1, 60.9],
      stem: 'Which plain-English version keeps what Donna means by her last line?',
      choices: ['“In matters of love, go for what you want.”',
                '“In matters of love, spoil the one you like.”',
                '“In matters of love, be good to yourself if it hurts.”'], a: 0,
      cue: '直前の「聞いてみなきゃ」と、合言葉のつながり。',
      line: 'when it comes to *matters of the heart*, I say… *treat yourself*.',
      said: '「恋のことなら、トリート・ユアセルフ」。直前に「聞かなきゃ分からない」と言っている。',
      mean: '自分へのごほうびの合言葉を恋に当てはめる。欲しいものは遠慮せず取りに行け、つまり彼女を誘え。',
      trap: 'treat を「ごちそうする」と取ると彼女を甘やかす話、「いたわる」なら慰め。前の ask とつなげる。',
      use: 'Life’s short. Order the dessert.（人生短いよ。デザート頼みなよ）' },

    // why: a bit simple ← "basic" heard as plain or modest (ベーシック); new topic ← a fresh sentence with "Tommy"
    //   sounds like a new start
    { id: 'mk1', skill: 'marker', level: 'B2', point: 'basically', seg: [55.6, 60.9],
      stem: 'When Donna starts her last piece of advice, what does her first word do?',
      choices: ['Sums up her advice in a few words', 'Admits her advice is a bit simple', 'Moves on to a whole new topic'],
      a: 0,
      cue: '「until you ask」の直後の一語。',
      line: '*Basically*, Tommy, when it comes to matters of the heart…',
      said: '「要するにね、トミー、恋のことなら…」と、まとめに入る。',
      mean: 'basically ＝ 要するに。それまでの話を一言にまとめる合図。',
      trap: 'ベーシック＝「初歩的」の連想で、謙遜と取りやすい。文頭なら「まとめ」の合図。',
      use: 'Basically, we need more time.（要するに、もっと時間が必要なんだ）' },

    // R fix: V2, blind 60 %: the key was the only two-sided choice; all three are now two-sided, and the key names
    //   "her second gift", not the shoes, because the sources disagree on that gift's words (65.5 s).
    // why: advice highest ← "great gift" taken at face value (the お礼 frame) and "even better" missed; politely,
    //   useless ← "Aw, damn" earlier, so the thanks sounds like 建前
    // anchor: 61.52–63.1 s "Thanks, Donna. It's a great gift.", then 67.52–69.4 s "That's an even better gift." (both
    //   sources): "even better" grants the advice was good, but ranks the next gift above it
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'shoes', seg: [61.0, 69.5],
      stem: 'Looking back from “That’s an even better gift,” how did Tom mean “great gift”?',
      choices: ['Sincerely, but her second gift ranked higher', 'Sincerely, and he ranked the advice highest',
                'Politely, though he found the advice useless'], a: 0,
      cue: 'あとの「even better」が、前の一言をどう位置づけるか。',
      line: 'Thanks, Donna. It’s a *great gift*. … Oh, snap. That’s an *even better gift*.',
      said: '助言に「いい贈り物だ」と礼を言い、次の贈り物には「もっといい！」と喜ぶ。',
      mean: 'even better は前の贈り物も良いと認めつつ、次の物を上に置く。お礼は本心、でも一番は物の方。',
      trap: 'お礼はそのまま最高の評価と取りやすく、前の「ちぇっ」から建前にも聞こえる。あとの比較が答え合わせ。',
      use: 'That’s nice, but this is even better!（それもいいけど、こっちはもっといい！）' },

    // R fix: V2, blind 65 %: "someone they know is listening" was weak; replaced by a surprise arrival tied to "my
    //   wedding" and "That's not all".
    // why: Lucy ← the whole talk is about Lucy, so "look behind you" sounds like she's arrived; fiancé ← "my wedding"
    //   earlier and "That's not all" heard as one more surprise
    { id: 'i2', skill: 'infer', level: 'B2', point: 'behind', reveals: ['groban'], seg: [69.2, 78.2],
      stem: 'Why does Donna tell Tom not to be obvious when he looks?',
      choices: ['Someone famous is behind them, and staring is rude', 'Lucy has just come in, and he should play it cool',
                'Her fiancé has come in, and it’s meant as a surprise'], a: 0,
      cue: '振り返ったあと、トムが叫ぶ名前。',
      line: 'Look behind you, but *don’t be obvious*. … *Josh Groban!*',
      said: '「後ろを見て。でもさりげなく」。振り向くと有名人がいて、名前を叫ぶ。',
      mean: 'don’t be obvious ＝ 気づかれないように。有名人をじろじろ見ない配慮。',
      trap: 'ルーシーの話が続いていたので、本人が来たと思いやすい。振り向いたあとの叫びで判断。',
      use: 'Don’t look now, but…（今は見ないで、でもね…）' },

    // why: made it himself ← "his own sushi" read as home-made; another star's fish ← the restaurant's idea, without
    //   the "own"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'groban', reveals: ['fish'], seg: [72.9, 81.8],
      stem: 'Why does Tom find the diner behind them so amazing?',
      choices: ['The fish on his plate used to be his', 'He made the sushi on his plate himself',
                'He’s eating fish that another star owned'], a: 0,
      cue: '店の最初の説明と「his own」をつなげて。',
      line: 'He’s eating *his own sushi*!',
      said: '有名人が来ていて、トムが「自分の寿司を食べてる！」と叫ぶ。',
      mean: '魚は元セレブのもの。彼は昔の自分の魚を食べている。冒頭の設定が戻る笑い。',
      trap: 'his own を「自分で作った」と取りやすい。冒頭の previously owned とつなげる。',
      use: 'He’s buying back his own old car.（昔の自分の車を買い戻してる）' },
  ]
};
