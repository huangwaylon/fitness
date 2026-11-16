// “The only time Ron fought against nature | Parks and Recreation” (the official Parks and Recreation channel,
// Season 5): with Jerry retired, Ron says the office will pick a new person to tease; Tom's stumble over words makes
// it him, his intern plan brings in someone nobody can tease, and Ron, after saying Tom can look after himself, brings
// Jerry back once a week.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈303 s. Untested on purpose: 0–9 s (the
// "making out" opening), 48–56 s (Tom's tangle: whisper “pile-of-piles”, captions “Philo Pilots”), 59–61 s (whisper
// “the new Jerry is”, captions “ninja areas”), 107–119 s (Andy's ink: captions “Zink”, speakers unclear), 121 s
// (“Barking up the wrong tree”: whisper “Parking”, captions “marking”), 137 s (a book title), 170–180 s (Donna's
// innuendo), 200–202 s (who proposes to Taylor), 221 s (whisper “is whining going to”, captions “is wine ain't
// gonna”), 236–239 s and 289–293 s (crude lines), 270–276 s (“I object… noted”: the objector isn't named).
// REVIEW 2026-11-16: pass 8, fix 16, drop 0, new 0; ear checks 0
// Open: a1, g1, nt3 and g2 still lean on the sitcom reading (the teasing, the twist); a show-savvy reader may get them.
// No EAR CHECK lines: every key's words agree in whisper and the captions; no who, predict or stress items, and no key
// rests on tone alone (Ron is named or addressed in each of his items: “Ron, ask me…”, “I don't know, Ron.”).
import type { Clip } from '../types.ts';

export const jerryBack: Clip = {
  id: 'jerryback', video: 'Lm_SCbOzxJs', title: 'The only time Ron fought against nature', dur: 323, wpm: 160,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): grief and regret left the ironic key as the only sitcom reading; now "made them laugh"
    //   ("make fun" without "of") and "the dull jobs".
    // why: made them laugh ← "make fun" heard without the weak "of": a funny coworker missed; dull jobs ← what a
    //   Jerry is usually kept around for, read into "sad day"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'sadday', seg: [9.7, 14.1],
      stem: 'When Jerry’s leaving is called a sad day, what is the sadness about?',
      choices: ['Losing the one they all made fun of', 'Losing the one who made them all laugh',
                'Losing the one who did the dull jobs'], a: 0,
      cue: '「sad day」のすぐあとの質問。',
      line: 'This is a *sad day*. Who are we gonna *make fun of* now?',
      said: '「悲しい日だ。これから誰をからかえばいいの？」と言う。',
      mean: '寂しいのはジェリー本人ではなく、からかう相手がいなくなったこと。',
      trap: 'make fun of の of は弱く、落とすと「笑わせてくれる人」に聞こえる。of のあとの相手が、笑われる側。',
      use: 'Who am I going to talk to now?（これから誰と話せばいいの？）' },

    // R fix: V2 (blind 60 %): only the key fit "Ah, nature"; now three outcomes Ron could mean: one of them / a new
    //   hire / the teasing fades.
    // why: a new hire ← "fill that role" heard as a job opening; fades away ← "naturally" heard as "it'll sort
    //   itself out"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'nature', reveals: ['one'], seg: [11.4, 30.6],
      stem: 'Asked who they’ll make fun of now, why is Ron not worried?',
      choices: ['One of them will slip into Jerry’s role', 'A new hire will be brought in for that role',
                'The teasing will just fade away by itself'], a: 0,
      cue: '「Every place I’ve ever worked」から最後まで。',
      line: 'the office *naturally selects a new Jerry*… Soon, *one of you* will be ridiculed mercilessly.',
      said: '「一人去れば、職場が自然に次のジェリーを選ぶ」と話す。',
      mean: '弱い者がいじられる役は自然に生まれる、という考え。次はこの中の誰か、と予告している。',
      trap: 'fill that role を求人と取りやすいが、選ぶのは「職場」で、人を雇う話ではない。',
      use: 'Every office has one of those.（どの職場にもそういう人はいる）' },

    // why: month ← the same kind of time word, a near miss if the last word is lost; animal ← "animal control
    //   reports" just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'year', seg: [43.1, 47.6],
      stem: 'How did Leslie want the reports organized?',
      choices: ['In order of year', 'In order of month', 'In order of animal'], a: 0,
      cue: '「Leslie said」のあと、文の最後の語。',
      line: 'I believe Leslie said to *organize these by year*.',
      said: '「レスリーは年ごとに整理しろと言ってた」と、資料の扱いを確かめる。',
      mean: 'organize ～ by year ＝ 年ごとに分けて並べる。',
      trap: '直前の animal control が耳に残ると、動物ごとに思える。by のあとの語が分け方を決める。',
      use: 'Can you sort these by date?（これ日付順に並べてくれる？）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'ahead', seg: [43.55, 48.25],
      stem: 'Type Tom’s reply to the reminder: “___.” (4 words)', answer: 'way ahead of you',
      cue: '指示の直後の返事。4語がひと続き。',
      line: '*Way ahead of you*. I made two…',
      said: '「とっくにやってるよ」と返す。',
      mean: 'way ahead of you ＝ 君よりずっと先、もう済んでる。way は「ずっと」の強め。',
      trap: 'ahead‿of‿you がつながり「アヘダヴユ」に。of は弱く「ア」程度で、聞き落としやすい。',
      use: 'Way ahead of you, it’s booked.（もう予約済みだよ）' },

    // why: admits it ← "said it wrong" is heard, but after "barely"; blames them ← "Are you broken?" just before,
    //   heard as the others' fault
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'barely', seg: [58.93, 66.0],
      stem: 'When the others jump on his slip, how does Tom react?',
      choices: ['He insists it was hardly a mistake at all', 'He laughs and admits he got it wrong',
                'He says the others rushed him into it'], a: 0,
      cue: '「No, it doesn’t.」のあとの一文。',
      line: 'No, it doesn’t. I *barely even said it wrong*.',
      said: '「そんなことない。ほぼちゃんと言えてた」と打ち消す。',
      mean: 'barely ＝ ほとんど〜ない。小さく言って、失敗をなかったことにしたい。',
      trap: 'said it wrong だけ拾うと、認めたように聞こえる。前の barely が意味をひっくり返す。',
      use: 'I barely touched it!（ほとんど触ってないって！）' },

    // why: 13 ← thirteen/thirty, the -teen/-ty pair; 3 ← "three" heard inside "thirty"; 50 ← a "whole lifetime"
    //   guess from the sad picture he paints
    // R fix: S4: the end fell 0.06 s after "vests", inside "and listening"; it now runs to the sentence's end.
    { id: 'n1', skill: 'number', level: 'B1', point: 'thirty', seg: [67.6, 78.9], keep: true,
      stem: 'How many years later does Tom picture himself in sweater vests?',
      choices: ['3 years', '13 years', '30 years', '50 years'], a: 2,
      cue: '「And」のあと、years の前の数。',
      line: 'And *30 years* later, I’m wearing aquamarine sweater vests…',
      said: '「そして30年後、ぼくは水色のセーターベストを着てる」と想像する。',
      mean: 'たった一つの失敗から、30年後のさえない自分まで一気に飛ぶ。',
      trap: 'thirty は前が強く、ty は弾んで「サーディ」。thirteen なら後ろの「ティーン」が強く長い。',
      use: 'Thirty years later, still friends.（30年後も、まだ友だち）' },

    // R fix: V2 (blind 60 %): "little slip" in the stem invited the big reading, and the Andy choice was weak; now an
    //   "old man" reading and a one-day tease.
    // why: old man ← "30 years later… sweater vests" heard as being about age; for a day ← "one screwed up
    //   sentence" heard as a small, passing slip
    { id: 'i3', skill: 'infer', level: 'C1', point: 'slip', reveals: ['thirty', 'one'], seg: [67.6, 78.9],
      stem: 'In Tom’s comment to the camera, what does he make of the slip?',
      choices: ['The start of a lifetime as the office joke', 'A sign he is already turning into an old man',
                'A slip they’ll tease him about for a day'], a: 0,
      cue: '「This is how it begins」から、話がどこまで飛ぶか。',
      line: 'This is *how it begins*. The next Jerry. One screwed up sentence. And 30 years later…',
      said: '「こうして始まる。一つの失敗で、30年後には…」と語る。',
      mean: 'begins が鍵。小さなミスを、いじられ役の人生の入口と見ている。',
      trap: '30年後やセーターから「老け込む」話と取りやすい。The next Jerry が、何の始まりかを決める。',
      use: 'This is how it starts.（こうやって始まるんだよ）' },

    // R fix: V2 (blind 55 %), S2: the chess choice quoted the word under test, and "sizes up… note" pointed at a list.
    // why: take a look ← "check" as in "check this out"; being watched ← "check" as in "check on someone"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'check', seg: [89.15, 94.2],
      stem: 'When Tom names Andy as the next Jerry, what does his repeated word do?',
      choices: ['Ticks off each trait on a mental list', 'Asks the others to go take a look',
                'Warns Andy that he’s being watched'], a: 0,
      cue: '「Big guy,」「Goofy,」のあとの同じ一語。',
      line: 'It’s Andy. Big guy, *check*. Goofy, *check*.',
      said: '「でかい、当てはまる。間抜け、当てはまる」と照らす。',
      mean: 'check ＝ リストに印をつける「チェック済み」。ジェリーの条件を一つずつ確かめている。',
      trap: 'check を「見て」や「見張る」と取りやすい。特徴のあとに一語で置くと、リストの確認。',
      use: 'Passport, check. Tickets, check.（パスポートよし、チケットよし）' },

    // why: 12 ← twelve/twenty start alike ("twe-"); 2 ← "two" heard, "-enty" lost; 30 ← "30 years" from Tom's
    //   comment just before
    { id: 'n2', skill: 'number', level: 'B1', point: 'twenty', seg: [94.2, 99.25], keep: true,
      stem: 'How often does Tom say Andy usually messes up like that?',
      choices: ['Every 2 minutes', 'Every 12 minutes', 'Every 20 minutes', 'Every 30 minutes'], a: 2,
      cue: '「usually happens」のあと。',
      line: 'which usually happens *every 20 minutes*.',
      said: '「アンディの失敗は、だいたい20分おきに起きる」と待つ。',
      mean: 'every 20 minutes ＝ 20分ごと。からかい半分の見積もり。',
      trap: 'twenty の nt は t が消えて「トゥエニー」に近い。twelve は最後の「ルヴ」で聞き分ける。',
      use: 'The bus comes every 20 minutes.（バスは20分おきに来る）' },

    // why: too big ← "Big guy" from Tom's list and "giant puppy" here; liked ← "puppy" heard as cute and loved
    { id: 'd3', skill: 'detail', level: 'B2', point: 'shame', seg: [123.8, 129.0],
      stem: 'Why can’t Andy be the new Jerry, in the speaker’s view?',
      choices: ['Teasing just doesn’t bother him', 'He’s too big for anyone to pick on',
                'Everyone likes him way too much'], a: 0,
      cue: '「never be the new Jerry」のあとの二文。',
      line: '*Nothing embarrasses him*. He’s like a giant puppy *with no shame*.',
      said: '「何をしても恥ずかしがらない。恥知らずの子犬だ」と言う。',
      mean: 'いじられ役は、からかわれて困る人。恥ずかしがらない人は、からかっても面白くない。',
      trap: 'giant puppy から「大きい」「かわいい」を拾いやすい。理由は no shame の方。',
      use: 'Nothing embarrasses her.（彼女は何があっても動じない）' },

    // R fix: V2 (blind 55 %): "Says nobody is teasing him" was a filler; now a grudging yes and a pass-the-buck.
    // why: grudging yes ← "Yeah" heard as はい, "no" as a sigh; someone else ← a two-word reply read as a dodge
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'yeahno', seg: [129.0, 135.3],
      stem: 'When Tom says they could just stop teasing him, what does the reply do?',
      choices: ['Turns it down without a second thought', 'Goes along with it, though not happily',
                'Says that it’s up to someone else'], a: 0,
      cue: '二語だけの返事。どちらの語が答えか。',
      line: 'Or you guys could just stop making fun of me. — *Yeah, no.*',
      said: '「からかうのをやめればいいだけじゃない？」に、「うん、ないね」と即答。',
      mean: 'Yeah, no ＝ 「分かるけど、それはない」。答えは no の方。',
      trap: 'Yeah を「はい」と取ると賛成に聞こえる。二語の返事は、最後の語が答え。',
      use: 'Yeah, no, that’s not happening.（うん、それはないね）' },

    // R fix: V2 (blind 60 %): "done by a machine" was absurd; "part-time help" replaces it.
    // why: part-time ← "not a person" heard as "not a full staff member"; someone else pays ← "cost nothing to the
    //   taxpayer" comes right after
    { id: 'h2', skill: 'humor', level: 'C1', point: 'intern', seg: [142.1, 149.3],
      stem: 'Why does Tom’s answer to “A new person in the office?” get a laugh?',
      choices: ['He talks as if an intern isn’t really a person', 'He means the intern would only be part-time help',
                'He means someone else would pay the new hire'], a: 0,
      cue: '「新しい人？」への、短い二つの答え。',
      line: 'A new person in the office? — *Not a person. An intern.*',
      said: '「新しい人を入れるのか？」に、「人じゃない。インターンだ」と答える。',
      mean: 'インターンを人の数に入れない言い方。ひどい理屈を真顔で言うのが笑い。',
      trap: 'Not a person を「正規の人員ではない」程度に取りやすい。言葉どおり人扱いしていない所を聞く。',
      use: 'Not a meeting. A quick chat.（会議じゃないよ、ちょっと話すだけ）' },

    // C2: a plain-English paraphrase (cf. s1)
    // anchor: 154.8–158.2 s "more importantly, they're usually stupid and terrible, so they get no work done";
    //   159.9–161.9 s Ron is won over by exactly that; 164.1–166.3 s "after all": wrecking the government is what he
    //   has hoped for all along
    // R fix: V2 (blind 70 %): "Be careful…" broke the frame, so the hopeful key stood out; all three now open "Good
    //   work. With luck…", and only "destroy" and "after all" decide.
    // why: fix it ← "destroy" missed and "Keep it up" heard as praise for reform (the sincerity flip); run it ← "Keep
    //   it up… one day" heard as praise for Tom's future
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'argument', seg: [154.7, 166.8],
      stem: 'Which plain-English version keeps what Ron means by his last line?',
      choices: ['“Good work. With luck, this government may fall apart yet.”',
                '“Good work. With luck, we may fix this government yet.”',
                '“Good work. With luck, you may run this government one day.”'], a: 0,
      cue: '「no work done」への反応と、最後の after all。',
      line: 'they’re usually stupid and terrible, so they *get no work done*. … We may *destroy this government* one day *after all*.',
      said: '「仕事をしない」と聞いて感心し、「結局いつか政府を壊せるかもな」と言う。',
      mean: '仕事が進まないことを長所として喜ぶ。after all は「前からの願いがついに」という含み。',
      trap: 'destroy を聞き逃すと、ほめ言葉の続きで「立て直す」「出世する」に聞こえる。何に感心したかを先に聞く。',
      use: 'We might pull this off after all.（結局うまくいくかもね）' },

    // why: a ← the usual article, and the word is quick here; such a ← a common pattern before an adjective; some ←
    //   "some" + noun as praise ("that's some argument")
    { id: 's1', skill: 'sound', level: 'B2', point: 'one', reveals: ['argument'], seg: [158.2, 162.5],
      stem: 'Fill the gap: “That is ___ compelling argument.”',
      choices: ['a', 'one', 'some', 'such a'], a: 1,
      cue: '「That is」のあと、短い一語。',
      line: 'Damn, son. That is *one* compelling argument.',
      said: '「おいおい、そいつは実に説得力のある話だ」と感心する。',
      mean: 'one＋形容詞＋名詞 ＝ 「実に〜な」。a より強く、本気で感心したときの言い方。',
      trap: 'one は w で始まり「ワン」と聞こえる。a なら「ア」だけ。文法で予想せず、音の始まりを聞く。',
      use: 'That is one good burger.（こいつは実にうまいバーガーだ）' },

    // R fix: V2 (blind 60 %): three "Something…" choices; the 実は frame (a confession) replaces "a new subject".
    // why: backs it up ← "Actually" heard as "in fact, yes"; private ← 実は read as the start of a confession
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [187.4, 194.55],
      stem: 'When Taylor replies to Tom’s guess, what does his first word set up?',
      choices: ['Something that goes against Tom’s guess', 'Something that backs up Tom’s guess',
                'Something private he’s about to share'], a: 0,
      cue: '相手の決めつけのあと、返事の最初の一語。',
      line: '…jock type, huh? — *Actually*, I quit football senior year…',
      said: '「脳筋だろ」に、「実は、フットボールはやめた」と返す。',
      mean: 'Actually ＝ 相手の思い込みをやんわり正す前置き。予想と逆の話が来る。',
      trap: '日本語の「実は」は打ち明け話にも使うので、同意の続きに聞こえやすい。Actually は訂正の合図。',
      use: 'Actually, I’m from Osaka, not Tokyo.（実は東京じゃなくて大阪出身です）' },

    // R fix: V2 (blind 75 %, helped by nt2's old stem): "pastor" ≈ "pasture" gives a farm near sound in place of the
    //   intern choice.
    // why: farm ← "my pastor" heard as "pasture"; Natalie ← "my sister, Natalie" said just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'shelter', seg: [190.75, 194.55],
      stem: 'Why did Taylor quit football in his senior year?',
      choices: ['To help run a homeless shelter', 'To help out on his family farm', 'To spend more time with Natalie'],
      a: 0,
      cue: '「so I could」のあと。',
      line: 'I quit football senior year so I could help my pastor *run a homeless shelter*.',
      said: '「牧師さんのホームレス施設を手伝うため、フットボールをやめた」と話す。',
      mean: 'so I could ～ ＝ 〜できるように。立派すぎる理由。',
      trap: 'pastor（牧師）は pasture（牧草地）に似た音。理由は so I could のあとで聞く。',
      use: 'I left early so I could rest.（休めるように早めに出た）' },

    // C2: who is the joke on? (cf. m1)
    // anchor: 197.9–200.2 s "Anybody would be lucky to marry him." answers Tom's dig at once; 202.2–207.0 s Taylor's
    //   reply, then 208.2–208.9 s "He gets it.": the room takes Taylor's side each time, and Tom is left alone
    // R fix: V2 (blind 55 %), N7: the stem named "love for the homeless" (d2's key); the Taylor choice is now the
    //   dig's literal effect; reveals shelter (the line).
    // why: Taylor ← the dig's literal target: right mechanism, wrong target (the room's reply praises him); the proposer ← the laugh after the
    //   turn-down heard as on the one turned down
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'backfire', reveals: ['shelter'], seg: [194.55, 211.0],
      stem: 'After Tom’s dig at Taylor, who does the joke end up on?',
      choices: ['Tom, whose dig gets turned into praise', 'Taylor, whom the dig makes look foolish',
                'The one who proposes and gets turned down'], a: 0,
      cue: '悪口のすぐあと、周りが何と言うか。',
      line: 'this guy loves the homeless so much… — *Anybody would be lucky to marry him.* … *He gets it.*',
      said: 'トムが「そんなに好きなら結婚しろ」とけなすと、周りは「彼と結婚できたら誰でも幸せ」「分かってる」とほめる。',
      mean: 'けなしたつもりが、ほめる流れを作ってしまう。笑われるのは、悪口が空振りしたトムの方。',
      trap: '悪口の対象＝笑いの対象と取りやすい。誰が味方を得て、誰が浮いたかで決める。',
      use: 'Well, that backfired.（あーあ、裏目に出たね）' },

    // why: not sad ← "No" heard as the answer to "am I sad?"; didn't catch it ← the bare reply read as a mishearing
    { id: 'h3', skill: 'humor', level: 'C1', point: 'askme', seg: [214.4, 220.9],
      stem: 'When Tom tells Ron what to ask him, why does Ron’s answer get a laugh?',
      choices: ['He simply refuses to ask the question', 'He’s telling Tom he isn’t sad at all',
                'He didn’t catch what Tom wanted to know'], a: 0,
      cue: '頼まれた事と、返事の一語。',
      line: 'Ron, *ask me* if I’m sad. — *No.*',
      said: '「ロン、悲しいかって聞いて」に、ロンは「いやだ」とだけ返す。',
      mean: '慰めてほしい前ふりを、一語で断る。相手の期待を平然と無視するのが笑い。',
      trap: 'No を「悲しくない」と取りやすいが、頼まれたのは「聞くこと」。何への No かを確かめる。',
      use: 'Ask me how my day was.（今日どうだったか聞いてよ）' },

    // why: back to work ← "stand up" read literally (立ち上がる); accept it ← "is whining going to do anything"
    //   heard as "nothing can be done"
    // R fix: N6: notes were 122 characters; "泣き言より行動を" cut from mean.
    { id: 'f3', skill: 'phrase', level: 'B1', point: 'standup', seg: [220.9, 226.6],
      stem: 'What does Ron tell Tom to do about being the new Jerry?',
      choices: ['Push back and defend himself', 'Get up and get back to work', 'Stop complaining and accept it'], a: 0,
      cue: '最後の短い命令文。',
      line: 'You don’t want to be a whipping boy. *Stand up for yourself.*',
      said: '「いじられ役は嫌だろ。自分のために立ち向かえ」と言う。',
      mean: 'stand up for yourself ＝ 自分を守って言い返す。',
      trap: 'stand up を「立ち上がる」と取ると、仕事に戻れに聞こえる。for yourself まで聞く。',
      use: 'You have to stand up for yourself.（自分の身は自分で守らなきゃ）' },

    // R fix: V2 (blind 65 %): a nickname reading replaces "close friend".
    // why: nickname ← "was Jerry" taken as a name he was called; Jerry's job ← "was Jerry" taken as the same post
    { id: 'i2', skill: 'infer', level: 'B2', point: 'already', seg: [226.6, 233.3],
      stem: 'What does Tom mean when he says he already was Jerry?',
      choices: ['He was the one picked on growing up', 'He was called Jerry as a nickname once',
                'He once had the job Jerry just left'], a: 0,
      cue: '次の文で、いつ、どこの話をするか。',
      line: 'I *already was Jerry*. I was a skinny… kid in South Carolina and *it sucked*.',
      said: '「ぼくはもうジェリーだった。やせっぽちの子で、最悪だった」と言う。',
      mean: 'Jerry が「いじられ役」という意味で使われている。子どものころ、からかわれる側だった。',
      trap: '名前をそのまま取ると、あだ名や仕事の話に聞こえる。次の子どもの話で役の名と分かる。',
      use: 'I was the new kid once too.（ぼくも昔は転校生だった）' },

    // why: fight it ← Ron's "Stand up for yourself" just before; start over ← "I reinvented myself" heard as his
    //   plan again
    // R fix: N7: the trap names f3's key (「立ち向かえ」), so it reveals standup.
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'lean', reveals: ['standup'], seg: [239.2, 249.4],
      stem: 'In the end, what does Tom decide to do about being a Jerry?',
      choices: ['Go along with it all the way', 'Fight it until people stop', 'Leave and start over again'], a: 0,
      cue: '最後の文、Might as well のあと。',
      line: 'I’m gonna go buy some sweatpants… *Might as well lean into it.*',
      said: '「いっそ受け入れるか」と、スウェットと恋愛小説を買いに行く。',
      mean: 'lean into it ＝ 逆らわず乗っかる。might as well は「どうせなら」。',
      trap: '直前の「立ち向かえ」から「戦う」を期待しやすい。lean into は逆らわない方向。',
      use: 'It’s raining. Might as well relax.（雨だし、のんびりしよう）' },

    // C2: the talking head against the scene (cf. g2)
    // anchor: 250.2–252.7 s "Tom can take care of himself", then 265.7–270.6 s "I asked Jerry to come in… so I got
    //   rid of him": the intern nobody could tease goes, and the old target is back, on Ron's own call
    // R fix: V2 (blind 60 %): "quietly… after all" made the key the only nuanced choice; now three parallel say/do
    //   pairs.
    // why: and he doesn't ← the comment to the camera taken at face value (the sincerity flip); he'll help ← "Tom can
    //   take care of himself" missed, and the Jerry move heard as a promise kept
    { id: 'nt3', skill: 'attitude', level: 'C2', point: 'plan', seg: [249.4, 270.7], retired: true,
      stem: 'How do Ron’s comment to the camera and his next moves fit together?',
      choices: ['He says he won’t help Tom, yet he does', 'He says he won’t help Tom, and he doesn’t',
                'He says he’ll help Tom, and he does'], a: 0,
      cue: 'カメラへの一言と、そのあとロンがしたこと。',
      line: 'Tom can *take care of himself*. … *I asked Jerry to come in*. That new intern wasn’t working out, so *I got rid of him*.',
      said: 'カメラには「トムは自分で何とかできる」と言うが、そのあとインターンを辞めさせ、ジェリーを呼び戻す。',
      mean: 'カメラへの言葉と行動が逆。口では突き放し、裏ではトムからいじられ役を外す手を打っている。',
      trap: 'カメラへの一言をそのまま信じやすい。この形式では、言ったことより次にしたことが本音。',
      use: 'I didn’t do it for you, okay?（別に君のためじゃないからね）' },

    // why: glad he retired ← "all" heard as everyone agreeing; all want to ← "they all say" read as everyone wishing
    //   to retire
    { id: 'h4', skill: 'humor', level: 'C1', point: 'retired', seg: [258.9, 265.65],
      stem: 'When Jerry says he retired, what does the reply suggest?',
      choices: ['That he was fired and is just saying that', 'That everyone is happy he got to retire',
                'That everyone here would love to retire too'], a: 0,
      cue: '「I retired.」への返事。they は誰のことか。',
      line: 'I wasn’t fired. I retired. — *That’s what they all say.*',
      said: '「クビじゃない、引退したんだ」に、「みんなそう言うんだよ」と返す。',
      mean: 'クビの人はみんな「引退」と言う、という決めつけ。言い分を言い訳扱いするいじり。',
      trap: 'all を「みんな賛成」と取りやすい。they は「クビになった人たち」のこと。',
      use: 'That’s what they all say.（みんなそう言うんだよね）' },

    // R fix: V2 (blind 50 %): "treat him better" was weak; a kind reading now shares the weekly frame. ("Until we
    //   find a permanent replacement" is not a distractor: Ron does say it.)
    // why: full-time ← "until we find a permanent replacement" heard as filling the intern's job; lonely ←
    //   "Welcome back, Jerry" and the visits heard as a kindness
    { id: 'g2', skill: 'gist', level: 'B2', point: 'plan', reveals: ['one'], seg: [265.65, 293.9],
      stem: 'What is Ron’s plan for Jerry, as he explains it to the staff?',
      choices: ['Bring him in weekly so there’s someone to tease', 'Bring him back full-time to cover the intern’s work',
                'Bring him in weekly so he isn’t lonely in retirement'], a: 0,
      cue: '「Are you hearing me, son?」のあとの説明。',
      line: 'Jerry will come in *once a week* and *everyone will get to watch him eat*…',
      said: 'ジェリーを週に数時間呼び、不満の声に「みんなで眺めてネタにできる」と説明する。',
      mean: '目的は、からかう相手を戻すこと。これでいじられ役がトムから離れる。',
      trap: 'permanent replacement から正式な後任に聞こえるが、来るのは週に数時間。',
      use: 'Are you hearing me? This is good news.（分かる？いい知らせなんだよ）' },
  ]
};
