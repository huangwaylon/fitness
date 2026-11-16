// “Ron vs Chris's Parenting | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Chris
// condemns Ron's handmade crib and takes him to the store that sold his own "safest" crib, which turns out to be
// recalled; Chris then asks Ron to teach him woodworking, hunts every remark for a parenting metaphor, and Ron ends by
// giving him the crib and telling him that worrying this much means he'll be a great father.
// Segments from the captions, words from whisper (2026-11-16). The captions garble 2 s ("look around mate"), 23 s (the
// book title), 49 s ("and found" for "Ann found"), 65 s ("you can run" for "could you show my friend Ron"), 68 s ("say
// forever" for "safe forever"), 74 s (the chemical), 104.6 s ("a bit exciting" vs whisper's "but exciting"), 133.7 s
// (whisper's "exudes" missing) and 165–169 s (the athletes' names); no key rests on those words, and a1's line trims
// "but". Ron is named at 15.3, 83.1, 116.9 and 224.8 s, Chris at 57.1 and 186.0 s. Whisper ends on a profanity
// (267 s); nothing quotes it.
// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 1
// Open: h3's segment is now only the "100" moment (8.6 s); the rule it calls back to (87–91 s) is outside it, as
//   S4's 15 s cap forces. Its cue points back to the rule. Keep it, or make it a C2 callback item?
// EAR CHECK: 190.6 s nt2 — both sources have “I know you’re not consciously teaching me anything”; is the stress on
//   “consciously”? (captions start the line with “oh”, whisper with “No”; nt2 doesn't quote that word)
import type { Clip } from '../types.ts';

export const ronChrisCrib: Clip = {
  id: 'roncrib', video: 'PXUsf9c6yoY', title: 'Ron vs Chris\'s Parenting', dur: 289, wpm: 165, band: 'mid',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %, right): only the key had the sitcom twist. Now three "who learns what" outcomes, two of
    //   them twists too.
    // why: store cribs safer ← Chris's opening complaint about safety standards stays in the ear; Ron wants one ←
    //   Ron's "Counteroffer" heard as a bargain he then accepts, plus the store setting
    { id: 'g1', skill: 'gist', level: 'B2', point: 'store', reveals: ['deathtrap', 'standard'], seg: [0, 81.5],
      stem: 'How does the trip to the store turn out?',
      choices: ['Chris learns his own crib is the dangerous one', 'Ron learns store cribs are safer than his own',
                'Ron ends up wanting a crib from the store'], a: 0,
      cue: '店員の最初の一言と、それに続く文。',
      said: '一番安全だと自慢していた店のベッドが、危険で回収中だと店員に言われる。',
      mean: '安全を説いた Chris のほうが危ない物を買っていた。立場が逆になる。',
      trap: '冒頭の安全基準の話が残ると、Ron のベッドの話に聞こえる。誰の物が問題になったかを追う。',
      use: 'Well, that backfired.（あーあ、裏目に出た）' },

    // R fix: V2 (blind 55 %, right): only the key was about safety. The "no plans" distractor is now a keyword trap on
    //   "the parenting book I'm reading".
    // why: cure ← "left it to cure" from Ron's talking head just before; the book ← "It's all covered in the parenting
    //   book" heard as the book's design being ignored
    { id: 'd1', skill: 'detail', level: 'B1', point: 'standard', seg: [14.85, 22.4],
      stem: 'Why does Chris say Ron cannot use his crib?',
      choices: ['It ignores every known safety standard', 'The wood hasn’t had time to cure yet',
                'It goes against the design in his book'], a: 0,
      cue: 'Ron の名前を呼んだ直後の文。',
      line: 'You’re *ignoring every known crib safety standard*.',
      said: 'Ron の手作りベッドは、知られている安全基準をすべて無視していると言う。',
      mean: 'every known で「どの基準も守っていない」と強めている。',
      trap: '直前の cure（木を乾かす）が残りやすい。理由は ignoring のあとに来る。',
      use: 'That ignores every safety rule.（それは安全ルールを全部無視してる）' },

    // R fix: V2 (blind 70 %, right): only the key carried "deal-making". Now a no, a yes and a maybe, each with a
    //   condition.
    // why: a yes ← "you take me… I talk to no one" heard as "you drive, you do the talking"; a maybe ← a counteroffer
    //   usually asks for something back (the literal reading of the word)
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'counter', seg: [34.7, 47.3],
      stem: 'When Chris offers to take Ron to the store, what is Ron’s answer?',
      choices: ['A flat no, put as if it were a deal', 'A yes, if Chris does all the talking',
                'A maybe, if Chris gives him something back'], a: 0,
      cue: 'counteroffer のあと、行き先と話す相手。',
      line: 'Counteroffer: you take me *nowhere* and I talk to *no one*.',
      said: '「対案：君は私をどこにも連れて行かず、私は誰とも話さない」と返す。',
      mean: '交渉の言葉を借りた、完全な断り。対案の形だが中身は「行かない」だけ。',
      trap: 'counteroffer は普通「代わりにこうしよう」なので、条件付きの話に聞こえる。中身の否定語を聞く。',
      use: 'Counteroffer: we stay home.（対案：家にいよう）' },

    // why: forty ← "four" plus the next sound heard as -ty; one hour ← "four hour" heard as "for an hour"
    { id: 'n1', skill: 'number', level: 'B1', point: 'meeting', seg: [40.62, 47.3],
      stem: 'How long is the meeting Chris threatens Ron with?',
      choices: ['Forty minutes', 'One hour', 'Four hours'], a: 2, keep: true,
      cue: 'attend a のすぐあと、数字と単位。',
      line: 'or I make you attend a *four-hour* fax cover sheet protocol meeting.',
      said: '「来ないなら、4時間のファクス送付状の手順会議に出てもらう」と言う。',
      mean: 'Ron が嫌う長くて退屈な会議を、脅しとして使っている。',
      trap: 'four hour はつながり、for an hour にも聞こえる。数字のあとの単位まで聞く。',
      use: 'It’s a four-hour drive from here.（ここから車で4時間）' },

    // R fix: V2 (blind 85 %, right): only the key had "for free". All three now turn on the window.
    // why: opens a window ← "replicates an open window" taken literally; admires ← sincerity flip: the flat
    //   "replicates" heard as admiration
    { id: 'h2', skill: 'humor', level: 'C1', point: 'window', seg: [48.6, 56.4],
      stem: 'Why does Ron’s comment on the nature machine get a laugh?',
      choices: ['He hints they paid for what a window gives them', 'He thinks the machine opens a window for them',
                'He admires that a machine can copy a window'], a: 0,
      cue: 'machine のあと、何をまねる機械だと言うか。',
      line: 'You bought a machine that *replicates an open window*.',
      said: '「窓を開けたときの音をまねる機械を買ったのか」と言う。',
      mean: '窓を開ければ自然の音はただで聞ける。わざわざ機械を買ったことを皮肉っている。',
      trap: '平らな声なので感心とも取れるが、「わざわざ買った」が要点。物の言い換えに皮肉がないか聞く。',
      use: 'You paid for something that’s free?（ただの物にお金を払ったの？）' },

    // R fix: V2 (blind 70 %, right): the distractors were odd uses of a crib. Now a near miss on the bright "Oh
    //   yeah" and a literal "trap".
    // why: a hit ← "Oh yeah, that thing is a…" said brightly, with "death" lost (the sales script); hard to assemble ←
    //   "trap" taken literally (わな), plus a store setting
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'deathtrap', seg: [64.6, 73.85],
      stem: 'What does the salesperson say about the crib Chris bought?',
      choices: ['It’s dangerous enough to hurt a baby', 'It’s a hit that keeps selling out',
                'It’s a pain for parents to put together'], a: 0,
      cue: 'oh yeah のあと、短い名詞句。',
      line: 'Oh yeah, that thing is a *death trap*.',
      said: '「ああ、あれは命取りですよ」とすぐに答え、回収中だと続ける。',
      mean: 'death trap ＝ 命にかかわるほど危ない物や場所。車や建物にもよく使う。',
      trap: 'Oh yeah が明るく、人気商品に聞こえやすい。death trap で一語、「危険な物」。',
      use: 'That old bridge is a death trap.（あの古い橋は本当に危ない）' },

    // why: twenty ← "I have used 20" right after the rule; a thousand ← hundred/thousand
    { id: 'n2', skill: 'number', level: 'B1', point: 'limit', seg: [82.6, 95.2],
      stem: 'By Ron’s first rule, how long can a conversation last?',
      choices: ['Twenty words', 'A hundred words', 'A thousand words'], a: 1, keep: true,
      cue: 'first rule のあと、数字と words。',
      line: 'No conversation lasts longer than *100 total words*.',
      said: '第一のルールは「会話は合計100語まで」。続けて使った語数を数える。',
      mean: 'Ron の「話は短く」という考えを、数字のルールにしている。',
      trap: 'すぐあとに 20 が聞こえるので、それを上限と取りやすい。ルールの数字と、使った数を分けて聞く。',
      use: 'Rule one: no phones at dinner.（ルールその1、夕食中はスマホ禁止）' },

    // R fix: V2 (blind 75 %, right): "impress Ann" was a filler. Now a near miss: "my own two hands" heard as going it
    //   alone.
    // why: save money ← "recall" plus building it yourself sounds cheaper; going it alone ← "my own two hands" heard
    //   as independence, though he is asking Ron to teach him
    { id: 'i1', skill: 'infer', level: 'B2', point: 'hands', seg: [95.4, 103.8],
      stem: 'What does Chris’s reason for building his own crib show?',
      choices: ['He has taken on Ron’s way of thinking', 'He wants to save money after the recall',
                'He wants to show Ron he can do it alone'], a: 0,
      cue: 'because のあと。Ron が冒頭で言った言葉と比べて。',
      line: 'Because I no longer trust anything other than *my own two hands*.',
      said: '「もう自分の手以外は何も信じられない」と答える。',
      mean: '冒頭の Ron の言葉と同じ。Chris が Ron の考えに近づいた。',
      trap: '回収の直後なので、お金や見栄の話を想像しやすい。理由の文が誰の口ぐせを借りているかを聞く。',
      use: 'I made it with my own two hands.（自分の手で作ったんだ）' },

    // R fix: V2 (blind 70 %, right): the key's "at the same time" stood out. Three parallel "X by it, yet Y too".
    // why: ashamed ← "debilitating" heard as a weakness being confessed; unsure ← a hedge reading of the second half
    //   (the captions' "a bit"; Japanese frame: ちょっと = doubt)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'debil', reveals: ['hands'], seg: [95.4, 106.1],
      stem: 'How does Chris say he feels about trusting only his own hands?',
      choices: ['Worn down by it, yet excited too', 'Ashamed of it, yet relieved too', 'Unsure of it, yet hopeful too'],
      a: 0,
      cue: '文の後半、二つの形容詞の並び。',
      line: 'It is *debilitating*… *exciting*.',
      said: '「身動きがとれないほどつらい、…でもわくわくする」と言う。',
      mean: 'debilitating ＝ 力を奪うほどつらい。逆の気持ちが同時にある。',
      trap: '難しい語なので恥や不安と想像しやすい。あとの exciting で気持ちの向きが決まる。',
      use: 'It’s scary, but exciting.（こわいけど、わくわくする）' },

    // R fix: S4: the segment was 29.4 s. It now starts at "Look at us" (8.6 s), and the cue sends the learner back to
    //   the rule at 87–91 s, which n2 (same reveals) tests. V2 (blind 80 %, right): "heartfelt speech… just a number"
    //   framed the cut-off. The stem now names the moment, and the choices are three readings of "100".
    // why: a score ← a bare number after a speech heard as a rating; a hundred percent ← "100" as slang for full
    //   agreement
    { id: 'h3', skill: 'humor', level: 'C1', point: 'hundred', reveals: ['limit'], seg: [107.2, 115.8],
      stem: 'When Chris starts to open up, why does Ron’s reply get a laugh?',
      choices: ['He means the talk has used up all its words', 'He means the speech gets a perfect score',
                'He means he agrees a hundred percent'], a: 0,
      cue: '数字だけの返事。最初のルールを思い出して。',
      line: 'I know we haven’t spent a lot of time together, but… — *100.*',
      said: 'Chris が心のこもった話を始めると、Ron は「100」とだけ言って打ち切る。',
      mean: '最初に決めた「会話は100語まで」に達した、という合図。話はここで終わり。',
      trap: '数字だけだと点数や「100%賛成」に聞こえる。前に出た数字のルールとつなげて聞く。',
      use: 'Okay, that’s my limit for today.（よし、今日はここまで）' },

    // R fix: V2 (blind 55 %, right): "already good fathers" was a weak filler. Now "fathers at heart", the romantic
    //   reading of "standing on". The clip's "upcoming child" still helps; the item is kept for "on the cusp of".
    // why: scared ← Chris's anxiety runs through the clip; at heart ← "fatherhood" heard without "on the cusp of", and
    //   "standing" as a solemn stance
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'cusp', seg: [107.6, 111.6],
      stem: 'When Chris says “Look at us”, what does he say they both are?',
      choices: ['They’re both about to become fathers', 'They’re both scared of being fathers',
                'They’re both fathers at heart already'], a: 0,
      cue: 'fatherhood の前の、場所を表す言い方。',
      line: 'Look at us, both *standing on the cusp of fatherhood*.',
      said: '「見てよ、二人とも父親になる一歩手前に立っている」と言う。',
      mean: 'on the cusp of ＝ まさに〜の直前。少し大げさな言い方。',
      trap: 'cusp を知らないと fatherhood だけが残り、もう父親だと聞こえる。',
      use: 'We’re on the cusp of something big.（大きなことの一歩手前にいる）' },

    // R fix: V2 (blind 75 %, right): only the key was about the answer's content. Now three readings of who sleeps
    //   and how; the near miss puts the baby, not the parent, to sleep.
    // why: cry it out ← "Swanson method" said right after Ferber and Sears, like a third school; lulling the baby ←
    //   "close your eyes and fall asleep" heard as instructions for the baby (wrong target)
    { id: 'h4', skill: 'humor', level: 'C1', point: 'sleep', seg: [116.4, 131.4],
      stem: 'When Chris asks about sleep methods, why does Ron’s answer get a laugh?',
      choices: ['His method is the parent simply going to sleep', 'His method is leaving the baby to cry it out',
                'His method is gently lulling the baby to sleep'], a: 0,
      cue: '二つの名前のあと、Ron の方法の中身。',
      line: '*Swanson method*, where you *close your eyes and fall asleep*.',
      said: '専門家の名前が並んだあと、「スワンソン式：目を閉じて眠る」と答える。',
      mean: '寝かしつけの質問を、ただ「眠る」話にしてかわしている。',
      trap: '赤ちゃんを寝かせる話と取りやすいが、you は親。目を閉じて眠るのは親自身、が笑いどころ。',
      use: 'My method? I just wing it.（私のやり方？ぶっつけ本番だよ）' },

    // R fix: V2 (blind 70 %, right): the key was the only "simply". Now a near miss on "I really wish Ron would
    //   engage" and a listening one.
    // why: open up ← "I really wish Ron would engage" heard as what happens; stories ← the usual mentor script (the
    //   wise old man who tells tales)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'presence', seg: [130.8, 142.15],
      stem: 'In his talk to the camera, how does Chris say he learns from Ron?',
      choices: ['Just by being around him', 'By getting him to open up', 'By listening to his stories'], a: 0,
      cue: 'learn parenting tips のあと。',
      line: 'I can learn parenting tips *simply by being in his presence*.',
      said: 'Ron は話してくれないが、一緒にいるだけで子育てのコツが学べる、と言う。',
      mean: 'presence ＝ その場にいること。教わらなくても学べる、と信じている。',
      trap: 'engage だけ拾うと、話してもらって学ぶと取りやすい。wish は「実際は違う」。',
      use: 'I learn a lot just by watching.（見ているだけで学べる）' },

    // C2 infer: the talking head's last line rewrites what came before it
    // R fix: V2 (blind 60 %, right): the key was the only clip-specific choice. Three parallel "As a…" readings now.
    // why: sincere tribute ← the talk taken at face value (its tone is warm and sure); a tease ← right mechanism
    //   (irony), wrong target
    // anchor: 143.3–146.3 s "My anxiety has kept me up for over 50 hours" closes the talking head; 142.2 s "Does that
    //   make sense?" shows he isn't sure of it himself
    // retired: one C2 alone is under 2 (nt2 retired)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'presence', reveals: ['hours'], seg: [130.8, 147.3], retired: true,
      stem: 'After Chris’s last remark to the camera, how should we take his claim about Ron?',
      choices: ['As a sleep-starved man’s shaky reasoning', 'As a sincere tribute to how Ron teaches',
                'As a gentle tease about how little Ron talks'], a: 0,
      cue: '話の最後に足された一言と、その前の質問。',
      line: 'Someone like Ron is teaching even when they’re not teaching. *Does that make sense?* … *kept me up for over 50 hours*.',
      said: '「Ron は教えていない時も教えている。分かる？」と言い、50時間寝ていないと付け足す。',
      mean: '最後の一言が前の話を書きかえる。深い気づきに聞こえた言葉は、寝不足で不安な頭の理屈だと分かる。',
      trap: '温かい口調なので、素直に受け取りやすい。カメラへの最後の一言で、前の話を聞き直す。',
      use: 'Does that make sense? I haven’t slept.（分かる？寝てないんだ）' },

    // why: fifteen ← -teen/-ty; five ← only the first syllable caught
    { id: 'n3', skill: 'number', level: 'B1', point: 'hours', seg: [142.15, 147.3],
      stem: 'How long does Chris say his anxiety has kept him awake?',
      choices: ['Over five hours', 'Over fifteen hours', 'Over fifty hours'], a: 2, keep: true,
      cue: 'kept me up for over のあと。',
      line: 'My anxiety has kept me up for *over 50 hours*.',
      said: '「不安で50時間以上寝ていない」と、さらっと付け足す。',
      mean: 'keep me up ＝ 眠らせない。50時間は2日以上。',
      trap: 'fifty と fifteen は似ている。-ty は最初を強く短く、-teen は後ろを強く長く言う。',
      use: 'The noise kept me up all night.（騒音で一晩中眠れなかった）' },

    // R fix: V2 (blind 85 %, right): the distractors didn't fit a man looking for lessons. Now three lessons drawn
    //   from “a subtle hand… than a strong one”.
    // why: his grip ← "a subtle hand… than a strong one" heard as about his own woodworking; people at work ← "a strong
    //   hand" as a boss's style (wrong target)
    { id: 'i2', skill: 'infer', level: 'B2', point: 'joint', seg: [147.3, 162.3],
      stem: 'What does Chris do with Ron’s tip about fitting the wood joint?',
      choices: ['He takes it as a tip about parenting', 'He takes it as a tip about his own grip',
                'He takes it as a tip about managing people'], a: 0,
      cue: 'what I get from that のあと、話題が何に変わるか。',
      line: 'What I get from that is when parenting, *sometimes a subtle hand is more effective* than a strong one.',
      said: '木工のこつを「子育てでは優しい手が効くこともある」と受け取る。',
      mean: 'Ron は組み方を言っただけ。Chris は何でも子育ての教えにする。',
      trap: 'subtle hand だけだと木工や仕事の話にも取れる。when parenting が向きを決める。',
      use: 'What I get from that is: slow down.（つまり、急ぐなってことだね）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'guide', seg: [152.3, 156],
      stem: 'Type the end of Ron’s tip: “all you need to do is ___.” (4 words)', answer: 'guide it into place',
      cue: 'is のあと、文の終わりまで。',
      line: 'All you need to do is *guide it into place*.',
      said: '「あとは所定の位置へ導くだけ」。guide it into はつながる。',
      mean: 'guide ＝ 手を添えて導く。継ぎ目が正しければ力は要らない、の意味。',
      trap: 'it は弱く、guide と into の間に消えやすい。動詞のあとの小さな it を聞く。',
      use: 'Just guide it into the slot.（そのまま差し込み口へ入れて）' },

    // C2 sound: contrastive stress in a reply that repeats the other speaker's words
    // why: "teaching" ← the reply heard as simply agreeing with Ron (sincerity flip); "me" ← scope shift onto the
    //   person
    // anchor: 186.6–189.1 s Ron "I'm not teaching you anything. We're just building a crib."; 189.5–191.8 s Chris
    //   repeats it and adds only "consciously", then 192–196 s "I'm just trying to siphon off… your wisdom"
    // retired: C2 stress item, until the ear check (the stress on “consciously”)
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'consciously', seg: [185.98, 196.72], retired: true,
      stem: 'Where does Chris’s stress fall in his “I know you’re not…” reply, and why?',
      choices: ['On “consciously”: Ron teaches, just not on purpose', 'On “teaching”: Ron is only building, not teaching',
                'On “me”: Ron may teach others, but not Chris'], a: 0,
      cue: '相手の文をくり返すとき、強く言うのはどこか。',
      line: 'I know you’re not *consciously* teaching me anything.',
      said: 'Ron の「教えてない」を受けて、「意識して教えてないのは分かってる」と返す。consciously が強い。',
      mean: '対比の強勢。一語足して強めると「そこは認めるが、教わっているのは本当」となる。',
      trap: '相手の文をくり返す返事は同意に聞こえやすい。くり返しの中で強い語が、話し手の言い分のありか。',
      use: 'I wasn’t trying to be rude.（わざと失礼にしたわけじゃない）' },

    // R fix: V2 (blind 70 %, right): the stem's "speech about his favorite book" pointed at the metaphors, and only the
    //   key ended the day. Neutral stem; three reasons to end it.
    // why: the crib is done ← "That's enough for today" heard as a job finished; sleep ← Chris's "50 hours" awake
    //   (keyword from earlier)
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'enough', seg: [197.25, 209.4],
      stem: 'In the wood shop, what is Ron doing with his last line?',
      choices: ['Ending the day to stop the metaphor talk', 'Ending the day because the crib is done',
                'Ending the day so Chris can get some sleep'], a: 0,
      cue: '本の話のあと、最後の一文。',
      line: 'Metaphors? I *hate metaphors*. … *That’s enough for today*, I think.',
      said: '「比喩？比喩は大嫌いだ」と言い、本の話のあと「今日はこのへんで」と切り上げる。',
      mean: '今日は終わり、の合図。比喩探しにうんざりしている。',
      trap: 'enough を「完成した」と取りやすい。理由は直前の hate metaphors。',
      use: 'That’s enough for today, I think.（今日はこのへんにしよう）' },

    // R fix: V2 (blind 60 %, right): only the key named what follows. All three now lead into a reply.
    // why: taking it gladly ← "Well!" as delighted surprise, and he does praise the crib a moment later; a moment ←
    //   "Well" as a pause filler (Japanese えーと)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'well', seg: [219, 226.72],
      stem: 'When Ron offers him the crib, what does Chris’s first word do?',
      choices: ['It leads into turning the gift down', 'It leads into taking the gift gladly',
                'It gives him a moment to decide'], a: 0,
      cue: 'Ron の名前の前、文頭の短い一語。',
      line: '*Well*, Ron, I can’t accept. This is for your baby.',
      said: '「でもね、Ron、受け取れないよ。君の赤ちゃんのためだ」。',
      mean: '文頭の Well は、相手の期待と違う返事の前置き。断りをやわらげる。',
      trap: '「えーと」のような迷いの声と取りやすいが、すぐ I can’t が続く。Well のあとは反対の話が多い。',
      use: 'Well, I’d love to, but I can’t.（うーん、行きたいけど無理なんだ）' },

    // R fix: V2 (blind 65 %, right): only the key was about lessons. Now a direction flip on "lesson" as well.
    // why: a lesson on sharing ← "lesson" heard without "not" (the weak negative lost); guilt ← the forest line itself
    //   is said to ease Chris's worry (right words, wrong part)
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'lesson', seg: [224, 233.6],
      stem: 'Why does Ron add a remark right after his line about the forest?',
      choices: ['To stop Chris turning it into a lesson', 'To turn it into a lesson about sharing',
                'To make sure Chris doesn’t feel guilty'], a: 0,
      cue: 'by the way の前後、何ではないと言うか。',
      line: 'There’s more than one crib tree in a forest. *That’s not a lesson*, by the way.',
      said: '「森に木は一本じゃない。ちなみに教訓じゃない、木材の話だ」と言う。',
      mean: '何でも教訓に変える Chris を先回りして止めている。',
      trap: 'not が弱く消えると「教訓だ」に聞こえる。森の一文は気まずさを消すが、足した一言は教訓探しを止める。',
      use: 'No hidden meaning, just a fact.（深い意味はない、ただの事実）' },

    // why: trust his gut ← "nobody has all the right answers" read as "ignore the experts"; learn from mistakes ←
    //   "won't be the last mistake" plus the usual pep-talk script, but Ron says caring is all that matters
    { id: 'g2', skill: 'gist', level: 'B2', point: 'advice', reveals: ['mistake'], seg: [233.6, 257.5],
      stem: 'What is the main thing Ron wants Chris to take away?',
      choices: ['Worrying this much shows he’ll be a good father', 'He should stop reading books and trust his gut',
                'Mistakes are fine as long as he learns from them'], a: 0,
      cue: '最後の励ましの直前の but のあと。',
      line: 'But a man who is this worried about making all the right choices *cares very much*.',
      said: '正解を全部知る人はいない。でもこれほど悩む人は深く気にかけている、と言う。',
      mean: '心配性を、良い父親の証として返している。',
      trap: '前半の「誰にも正解はない」だけだと、本は捨てろという話に聞こえる。but のあとが結論。',
      use: 'The fact that you worry shows you care.（心配するのは大事に思っている証拠）' },

    // R fix: V2 (blind 85 %, right): the "promise" distractor was a filler. Now a Ron-like tease, refuted by
    //   "including me".
    // why: a warning ← "won't be the last mistake you make" heard as a prediction of failure (Japanese frame: 嫌味); a
    //   tease ← Ron built his own crib, so "you bought" heard as a dig at store cribs
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'mistake', reveals: ['wont'], seg: [238.75, 251.6],
      stem: 'When Ron brings up the toxic crib, how does he mean it?',
      choices: ['As comfort: every parent gets things wrong', 'As a warning: Chris will keep getting it wrong',
                'As a tease: Chris should have asked him first'], a: 0,
      cue: 'toxic crib の文と、すぐあとの but。',
      line: 'that toxic crib you bought *won’t be the last mistake you make*. But a man who is this worried…',
      said: '「あのベッドが最後の失敗にはならない」と言い、but で続ける。',
      mean: '失敗はこれからもする、それが普通だという慰め。Ron も正解は知らないと言う。',
      trap: '日本語で「また失敗するよ」は嫌味に聞こえやすい。but のあとが本音で、前半は安心させる前置き。',
      use: 'Everyone makes mistakes. That’s okay.（誰でも失敗する。大丈夫）' },

    // R fix: V2 (blind 70 %, right): "wouldn't" fits the idiom worse than "won't". Now "would", which keeps the
    //   sentence grammatical and differs only in the vowel and the lost final consonant.
    // why: will ← the final t of won't drops; would ← /wʊd/ with the d swallowed sounds close to a clipped "won't"
    { id: 's1', skill: 'sound', level: 'B2', point: 'wont', seg: [238.75, 243.35],
      stem: 'Fill the gap: “that toxic crib you bought ___ be the last mistake…”',
      choices: ['won’t', 'will', 'would'], a: 0,
      cue: 'bought のすぐあと、短い助動詞。',
      line: 'that toxic crib you bought *won’t* be the last mistake you make.',
      said: '「最後の失敗にはならない」。won’t の t はほぼ聞こえない。',
      mean: 'will なら「最後の失敗になる」で意味が逆。won’t の母音は「オウ」。',
      trap: 't が消えても won’t の「オウ」と鼻音は残る。will や would と母音で分ける。',
      use: 'Don’t worry, it won’t take long.（心配しないで、すぐ終わるよ）' },
  ]
};
