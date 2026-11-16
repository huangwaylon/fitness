// “Conflict Resolution Pranks - The Office US” (the official The Office channel, Best of Season 2): Jim's pranks on
// Dwight (a joint ID photo, a doctored ID card), Dwight's ultimatum to Michael and his offer to get Jim a job in
// Stamford, then Michael's conflict-resolution meeting, where Dwight lists the pranks and Jim owns up to each one
// to camera; Creed explains his smell.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈237 s. Untested: 25–30 s, 33–43 s (the ID
// card's wording, “Kurt, not Fart”, “What did I write?”), 56–59 s (no captions), 62–81 s (the captions garble most of
// it: “malfeasance unreported” vs “malfeasant son reported”, “Either he goes or I go” vs “maybe he goes all right”, “out
// of here by the end of today” vs “already in there today”), 97.8 s (who says “your ID says you're a security
// threat”), 168–174 s (the women's room line) and 192–200 s (the macro).
// REVIEW 2026-11-16: pass 8, fix 15, drop 1, new 1; ear checks 0
// (i2's ear check is gone: its key rests on "took … all out", which both sources have. nt1's went with the item.)
import type { Clip } from '../types.ts';

export const conflictPranks: Clip = {
  id: 'pranks', video: 'lqLv4AT1_ps', title: 'Conflict Resolution Pranks', dur: 259, wpm: 158, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: money ← "saves" heard with a company in mind; friendlier ← "together" and "walking together" heard as the
    //   point of the photo
    { id: 'd1', skill: 'detail', level: 'B1', point: 'together', seg: [0.3, 11.1],
      stem: 'What reason does Jim give for a joint ID photo?',
      choices: ['It would save the two of them time', 'It would save the company some money',
                'It would make the ID look friendlier'], a: 0,
      cue: '「That doesn’t make any sense」への返事。最初の動詞。',
      line: 'Well, *saves time*, you know, … we could just meet in the parking lot every morning',
      said: '「時間の節約になるよ。毎朝駐車場で会って、一緒に歩けるし」と説明する。',
      mean: 'saves time ＝ 時間が省ける。理由になっていない理由で、からかっている。',
      trap: 'together が何度も出るので仲良しの話に聞こえるが、口にした理由は時間。',
      use: 'Let’s go together. It saves time.（一緒に行こう、時間の節約になる）' },

    // R fix: V2 (blind 55 %): "his teeth look bad" and "told not to" were weak beside the key. Now teeth as a threat
    //   display (the reverse) and an ID-photo reason.
    // why: threat ← the popular idea that bared teeth mean aggression, the reverse of what he says; silly ← the
    //   ID photo context, with his "No" heard as about the card
    { id: 'd2', skill: 'detail', level: 'B1', point: 'smile', seg: [12.0, 23.5],
      stem: 'Why does Dwight say he refuses to smile?',
      choices: ['He thinks showing teeth signals giving in', 'He thinks a smile makes an ID look silly',
                'He thinks showing teeth makes him look like a threat'], a: 0,
      cue: '「Showing one’s teeth is a」のあとの2語。',
      line: 'Showing one’s teeth is a *submission signal* in primates.',
      said: '「歯を見せるのは、霊長類では服従のサイン」と説明する。',
      mean: 'submission ＝ 服従、負けを認めること。笑顔は弱さのしるしだと考えている。',
      trap: '歯を見せる＝おどし、と取ると逆になる。submission は服従。is a のあとが彼の理由。',
      use: 'Smile for the camera!（カメラに向かって笑って！）' },

    // R fix: K3 (blind 55 %): "someone helps him to do it" was a filler. Now "someone smiles at him first", from the
    //   next line.
    // why: helps him ← "help" read literally (役に立つ); smiles first ← "When someone smiles at me" comes right after
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'helpit', seg: [12.0, 15.65],
      stem: 'When Dwight says he never smiles “if…”, what does the rest mean?',
      choices: ['Unless he really has no choice', 'Unless it’s useful to him somehow', 'Unless someone smiles at him first'], a: 0,
      cue: '「never smile」のあとの4語。help の目的語は it。',
      line: 'I never smile *if I can help it*.',
      said: '「なるべくなら、絶対に笑わない」と言う。',
      mean: 'if I can help it ＝ 避けられるなら。help はここで「避ける」の意味。',
      trap: 'help を「助ける」と取りやすい。can’t help it（仕方ない）とセットで覚える。',
      use: 'I don’t fly if I can help it.（できれば飛行機は避けたい）' },

    // why: Jim has it ← "Jim's permanent file" is said just before; Dwight ← he is the one asking, and "What box?"
    //   shows he didn't know of it
    { id: 'd4', skill: 'detail', level: 'B1', point: 'box', seg: [45.6, 53.4],
      stem: 'Who has the complaint box now, according to the reply Dwight gets?',
      choices: ['Michael', 'Jim', 'Dwight'], a: 0,
      cue: '「Talk to」のあとの名前と、そのあとの一文。',
      line: '*Talk to Michael. I gave him the box.* — What box?',
      said: '苦情を持って行くと「マイケルに言って。箱は彼に渡した」と返される。',
      mean: 'him は直前の Michael。苦情の箱は、もうマイケルの手元にある。',
      trap: 'Jim’s file が先に聞こえるので、ジムに結びつけやすい。him は直前の名前を指す。',
      use: 'Talk to the front desk. They have it.（フロントで聞いて、預かってるから）' },

    // why: say sorry ← "Do the right thing" heard as an apology demand; his own move ← "Stamford" and "transfer"
    //   heard as Dwight's own plan
    // R fix: N7/B1: the line shows s1's answer ("’cause I’ll"), so it now also reveals `stillhere`.
    { id: 'g1', skill: 'gist', level: 'B2', point: 'ultimatum', reveals: ['stamford', 'deadline', 'stillhere', 'goodword'], seg: [83.7, 126.1],
      stem: 'In the middle of the clip, what is Dwight pushing for?',
      choices: ['For Jim to leave the office for good', 'For Jim to say sorry in front of everyone',
                'For himself to move to the Stamford office'], a: 0,
      cue: '「You have till five」と、そのあとのジムへの話。',
      line: 'I could put in a good word for you, *’cause I’ll still be working here*. … Transfer.',
      said: '期限を切ってマイケルに迫り、ジムにはスタンフォードの職を勧める。',
      mean: 'ジムを追い出したい、が全部の行動の目的。自分は残るつもり。',
      trap: 'Stamford や transfer は彼自身の転勤に聞こえやすい。誰が残るかを聞く。',
      use: 'It’s either him or me.（彼か私か、どっちかだ）' },

    // R new: C2, to replace nt1. It tracks the stand-in "do" at speed, with a "do" in "Do the right thing" as the near
    //   miss. Blind 40 %.
    // why: served ← "served you loyally" is the longer clause just before (but it takes "have", not "do"); the right
    //   thing ← "Do the right thing" holds the same "do"
    // anchor: 90.0–95.6 s “Do the right thing here, Michael. … I have served you loyally for years. I deserve this. You
    //   know I do.”: "do" stands in for the verb just before it, "deserve this"
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'iknowido', seg: [89.5, 96.5],
      stem: 'In Dwight’s “You know I do,” what is he saying Michael knows?',
      choices: ['That he deserves what he’s asking for', 'That he has served Michael loyally',
                'That he always does the right thing'], a: 0,
      cue: '直前の文の動詞。do が何の代わりか。',
      line: 'Do the right thing here, Michael. … I have served you loyally for years. *I deserve this. You know I do.*',
      said: '「正しい判断を。長年仕えた。僕には資格がある。分かってるでしょ」と迫る。',
      mean: 'do は直前の deserve this の代わり。「資格があるのは分かってるはず」と念押しする。',
      trap: 'do の音で Do the right thing に結びつけやすい。代わりの do は直前の動詞を受ける。',
      use: 'I earned this. You know I did.（これは自分で勝ち取った。分かってるよね）' },

    // R fix: K8: the times are now `keep: true`, in ascending order.
    // why: nine ← "five" and "nine" share the long vowel; Friday ← "till Fri-" heard in "till five"
    { id: 'n1', skill: 'number', level: 'B1', point: 'deadline', seg: [97.3, 103.5],
      stem: 'What deadline does Dwight give Michael?',
      choices: ['Until five o’clock', 'Until nine o’clock', 'Until Friday'], a: 0, keep: true,
      cue: '最後の短い一文。till のあと。',
      line: 'You have *till five*.',
      said: '「5時までに決めて」と期限を切る。',
      mean: 'till five ＝ 5時まで。今日中に、ジムか自分かを選べという最後通告。',
      trap: 'five と nine は母音が同じで紛れやすい。最初の子音 f と n を聞き分ける。',
      use: 'You have till noon to decide.（お昼までに決めてね）' },

    // R fix: V2/K3 (blind 50 %): "get the job for himself" was contradicted by the offer. Now "make peace with Jim".
    // why: promotion ← "sales manager position" and "a good word" taken at face value; peace ← the friendly offer heard
    //   as a peace sign after the ultimatum
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'stamford', reveals: ['stillhere', 'goodword'], seg: [105.3, 119.6],
      stem: 'When Dwight offers to call Jan for Jim, what is he really doing?',
      choices: ['Trying to get Jim out of the office', 'Trying to help Jim get a better job',
                'Trying to make peace with Jim'], a: 0,
      cue: '親切な申し出のあと、’cause で始まる理由。',
      line: 'I could put in a good word for you, *’cause I’ll still be working here*.',
      said: '「スタンフォードに空きがあるよ。推薦してあげる。僕はここに残るからね」と言う。',
      mean: '親切な形の申し出だが、理由の一言で、ジムを追い出したいだけだと分かる。',
      trap: '推薦の申し出は好意に聞こえる。親切な言葉のあとの理由に、本当の目的が出る。',
      use: 'Happy to help. Honestly, it helps me too.（喜んで。正直、こっちも助かるし）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'goodword', seg: [112.45, 119.6],
      stem: 'Type the words: “I could ___ for you.” (5 words)', answer: 'put in a good word',
      cue: '「I could」のすぐあと。短い語がつながる。',
      line: 'I could *put in a good word* for you',
      said: '「君のことを推薦しておける」。put in a がつながる。',
      mean: 'put in a good word for ＝ 人のことを上の人によく言っておく、口添えする。',
      trap: 'put の t がはじかれ「プティナ」に近い。a を落として書きやすい。',
      use: 'Could you put in a good word?（よく言っておいてくれる？）' },

    // R fix: GUIDE §9.5: "because I still be working" isn't grammatical, so grammar picked against it. Now "so I’ll",
    //   a real near sound (the captions themselves write this speaker's ’cause as "so" at 7.6 s).
    // why: so I'll ← the reduced ’cause heard as "so"; I'd ← the dark l in "I'll still" heard as a d
    { id: 's1', skill: 'sound', level: 'B2', point: 'stillhere', reveals: ['goodword'], seg: [112.45, 119.6],
      stem: 'Fill the gap: “…a good word for you, ___ still be working here.”',
      choices: ['’cause I’ll', 'so I’ll', '’cause I’d'], a: 0,
      cue: '「for you」のすぐあと。短く速い2語。',
      line: 'I could put in a good word for you, *’cause I’ll* still be working here.',
      said: '「僕は残るからね」。because が縮む。',
      mean: '’cause I’ll ＝ because I will。会話では because の頭が落ちる。',
      trap: 'I’ll の l は暗く、still とつながって消えやすい。I’d なら仮定の話になる。',
      use: 'Go ahead, ’cause I’ll be late.（先に行って、遅れるから）' },

    // R fix: V2/K3 (blind 70 %): "exercise together" and "do the numbers" were absurd in a conference room. Now
    //   "work" read literally, and a meeting script.
    // why: finish work ← "work" heard as their jobs; training ← "conference room… nobody leaves" heard as a long session
    { id: 'ph3', skill: 'phrase', level: 'B1', point: 'workout', seg: [125.95, 132.3],
      stem: 'What does Michael want before anybody leaves the conference room?',
      choices: ['For them to settle the problem', 'For them to finish their work', 'For them to sit through a training'], a: 0,
      cue: '「Nobody leaves until we」のあと。',
      line: 'Nobody leaves until we *work this out*.',
      said: '「この件が片づくまで、誰も部屋を出ない」と言う。',
      mean: 'work this out ＝ 問題を解決する、話をつける。',
      trap: 'work だけ聞くと仕事の話に聞こえる。work this out は「この件を片づける」。this が問題を指す。',
      use: 'I’m sure we can work this out.（きっと話し合いで解決できる）' },

    // R fix: K3: "lock himself in with the two of them" was a filler. Now the reverse logic, from a missed "didn't".
    // why: says they fail ← "How could they not work?" heard as "they could not work"; peace stays ← "If they didn't
    //   work" heard without its "didn't"
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cage', seg: [132.3, 140.95],
      stem: 'Why is Michael’s case for cage matches funny?',
      choices: ['Leaving a cage doesn’t prove people made peace', 'He says cage matches fail, then uses one anyway',
                'He says people who make peace stay in the cage'], a: 0,
      cue: '「If they didn’t work」以下の理屈。',
      line: 'How could they not work? *If they didn’t work, everybody would still be in the cage.*',
      said: '「だめなら、みんなまだおりの中にいるはずだろ」と言う。',
      mean: 'おりから出たことを、仲直りの証拠にしている。理屈になっていない理屈が笑い。',
      trap: 'How could they not work? は「うまくいかないはずがない」。否定の意見ではない。',
      use: 'How could it not work?（うまくいかないわけがない）' },

    // R fix: V2/K3 (blind 50 %): "surprised by Dwight" was a filler. Now "so" heard as asking for agreement.
    // why: result ← "so" as だから, a conclusion; agree ← "so" + a name heard as a tag (そうだよね、ドワイト)
    { id: 'mk1', skill: 'marker', level: 'B2', point: 'so', seg: [140.95, 145.95],
      stem: 'In the meeting, what does Michael’s short word before “Dwight” do?',
      choices: ['It moves the meeting on to its next step', 'It gives the result of what was just said',
                'It asks Dwight to agree with him'], a: 0,
      cue: '「Okay」のすぐあと、名前の前の一語。',
      line: 'Okay, *so* Dwight, in your own words.',
      said: '「よし、じゃあドワイト、君の言葉で話して」と始める。',
      mean: 'Okay, so… は話を次の段階へ進める合図。「では」「さて」に近い。',
      trap: 'so を「だから」と取ると前の話の結論に聞こえる。文頭の so は、話の切り替えが多い。',
      use: 'Okay, so, who wants to start?（さて、誰から始める？）' },

    // R fix: V2 (blind 55 %): "denies and blames others" was a filler. Now "jokes his way out", since he does joke.
    //   N7: the line shows n2's "Five bucks", so it also reveals `bucks`.
    // why: jokes his way out ← he jokes ("totally worth it"), with the "Yes" missed; says sorry ← the meeting's purpose
    //   (resolving a conflict) taken as its outcome
    { id: 'g2', skill: 'gist', level: 'B2', point: 'admits', reveals: ['worthit', 'deserve', 'bucks'], seg: [140.95, 219.1],
      stem: 'As Dwight lists his complaints, how does Jim respond to them?',
      choices: ['He owns up to each prank without shame', 'He jokes his way out of answering them',
                'He says sorry and promises to stop'], a: 0,
      cue: 'ドワイトの訴えのあとの、ジムの短い答え。',
      line: 'Yes. Five bucks each, and it was totally worth it. … *But he does deserve it, though.*',
      said: 'ドワイトが被害を並べるたびに、ジムはやり方まで説明して、悪びれずに認める。',
      mean: '仲直りの会議のはずが、ジムの自慢話の場になっている。',
      trap: '会議の目的から、謝って終わる流れを予想しやすい。ジムの短い答えを一つずつ聞く。',
      use: 'Guilty as charged.（おっしゃる通り、私がやりました）' },

    // why: markers ← another pen-like item; chalk ← "cr-" heard as the start of "chalk"
    { id: 'd5', skill: 'detail', level: 'B1', point: 'crayons', seg: [142.6, 148.3],
      stem: 'What were Dwight’s pens and pencils swapped for?',
      choices: ['Crayons', 'Markers', 'Chalk'], a: 0,
      cue: '「pens and pencils with」のあと。',
      line: 'Someone replaced all my pens and pencils with *crayons*.',
      said: '「誰かがペンと鉛筆を全部クレヨンに替えた」と訴える。',
      mean: 'replace A with B ＝ AをBに替える。with のあとが新しい物。',
      trap: 'クレヨンとは音がかなり違い、英語では「クレイアンズ」に近い。カタカナで待たない。',
      use: 'They replaced the chairs with sofas.（いすがソファーに替わった）' },

    // why: fifteen/fifty ← -teen/-ty and "five" heard inside them; nine ← the shared long vowel
    { id: 'n2', skill: 'number', level: 'B1', point: 'bucks', seg: [147.95, 158.55],
      stem: 'How much did each person get for calling Dwight by the wrong name?',
      choices: ['$5', '$9', '$15', '$50'], a: 0, keep: true,
      cue: '「Yes」のあと、each の前の数。',
      line: 'Yes. *Five bucks each*, and it was totally worth it.',
      said: '「そう。一人5ドル。払う価値は十分あった」と認める。',
      mean: 'bucks ＝ ドルのくだけた言い方。each ＝ 一人あたり。',
      trap: 'fifty（フィフティ）と five は始まりが同じ。語尾に「ティ」があるかを聞く。',
      use: 'Tickets are ten bucks each.（チケットは一人10ドル）' },

    // R fix: K5/K3: "He denies it, but jokes about a price" didn't hang together. Now all three admit it.
    // why: a bit sorry ← an admission heard as an apology (the Japanese frame); blames Dwight ← the cornered
    //   prankster's usual defence
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'worthit', reveals: ['bucks'], seg: [147.95, 158.55],
      stem: 'What does the short reply to the wrong-name complaint show?',
      choices: ['He admits it, and he has no regrets', 'He admits it, but he feels a bit sorry',
                'He admits it, and blames Dwight for it'], a: 0,
      cue: '最初の一語と、最後の「totally」以下。',
      line: 'Yes. Five bucks each, and *it was totally worth it*.',
      said: '「そう。一人5ドル。払う価値は十分あった」と認める。',
      mean: 'worth it ＝ その価値がある。悪びれずに、むしろ満足している。',
      trap: '認めたら謝る流れ、と思いやすい。認めたあとに何を足すかで気持ちが分かる。',
      use: 'It was expensive, but totally worth it.（高かったけど、その価値はあった）' },

    // why: knows it's a prank ← "tried to convince me" heard as seeing through it; did it himself ← "I committed
    //   murder" heard as his own belief
    { id: 'i1', skill: 'infer', level: 'C1', point: 'glove', seg: [158.55, 168.0],
      stem: 'What does Dwight’s last remark about the glove suggest he still thinks?',
      choices: ['That a murder may really have happened', 'That the glove was only part of Jim’s prank',
                'That he himself may have killed someone'], a: 0,
      cue: '「I think he may be the」のあとの語。',
      line: 'Jim Halpert tried to convince me I committed murder. *I think he may be the real murderer.*',
      said: '「本当の殺人犯はジムかもしれない」と言う。',
      mean: 'real murderer と言うのは、殺人はあったと思っているから。いたずらだと分かっていない。',
      trap: 'tried to convince me で見抜いたように聞こえるが、最後の一文で分かる。',
      use: 'I think he may be the real winner.（本当の勝者は彼かも）' },

    // R fix: S4: seg 176.5–192.0 (15.5 s) → 182.6–192.0. Jim's explanation holds the evidence; the stem gives the hit.
    // why: heavier ← "more and more nickels" is the last image heard; ringing ← "phone" heard as a loud call
    { id: 'i2', skill: 'infer', level: 'C1', point: 'nickels', seg: [182.6, 192.0],
      stem: 'From Jim’s explanation, why did Dwight hit himself with the phone?',
      choices: ['It was suddenly far lighter than he expected', 'It was suddenly far heavier than he expected',
                'It rang far louder than he expected'], a: 0,
      cue: '「until he got used to the weight」のあと。',
      line: 'more and more nickels into his handset until he got used to the weight, and then *I just took them all out*.',
      said: '「受話器に少しずつ硬貨を足して重さに慣れさせ、全部抜いた」と説明する。',
      mean: '重さに慣れた手で、急に軽い受話器を持ち上げ、勢いで頭に当てた。',
      trap: 'more and more が耳に残ると「重い」を選びやすい。決め手は最後の一文。',
      use: 'I got used to the noise.（騒音に慣れた）' },

    // why: secret ← actually read as 実は, a confession; corrects ← "actually" heard as disagreeing with Dwight's
    //   account
    { id: 'mk2', skill: 'marker', level: 'B2', point: 'actually', seg: [182.6, 192.0],
      stem: 'In Jim’s first comment about the phone, what does his second word add?',
      choices: ['That it was more work than you’d think', 'That he is sharing a secret for the first time',
                'That Dwight’s version of it is wrong'], a: 0,
      cue: '「That」のすぐあと。そのあと何が続くか。',
      line: 'That *actually* took a while.',
      said: '「これ、意外と時間がかかったんだ」と話し始める。',
      mean: 'actually は「思ったより」。簡単に見えるいたずらに、手間がかかったと言っている。',
      trap: '実は＝秘密の告白、と取りやすい。ここは予想との違いを示す actually。',
      use: 'It actually took a while to fix.（直すのに意外と時間がかかった）' },

    // R fix: K6/V2 (blind 60 %): the key was the only two-part, nuanced choice. All three are now "They sound… and/but
    //   he…".
    // why: regrets them ← "don't sound that funny" heard as regret; great and proud ← "actually" and "one after
    //   another" heard as praise of the list
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'deserve', seg: [195.75, 206.15],
      stem: 'Looking back on his pranks, how does Jim feel about them?',
      choices: ['They sound weak in a list, but he stands by them', 'They sound weak in a list, and he regrets them',
                'They sound great in a list, and he’s proud of them'], a: 0,
      cue: '「You know, these…」の一文と、But 以下。',
      line: 'these actually don’t sound that funny one after another. *But he does deserve it, though.*',
      said: '「続けると面白くないね。でも、あいつは当然」と言う。',
      mean: '出来は認めつつ、やったこと自体は悪いと思っていない。',
      trap: 'don’t sound that funny を反省と取りやすい。but … though のあとに、変わらない立場が来る。',
      use: 'It wasn’t perfect, but it worked, though.（完ぺきじゃないけど、うまくいったよ）' },

    // R drop: nt1 (C2 stress on "does"), V2/V3: blind 55 %. Emphatic do is a grammar rule, so the item tests the rule,
    //   not the ear, as with the dropped "What I *do* like" in another bank. Deleted (never shipped). nt3 replaces it.

    // why: an inch ← Jim's "an inch" is the number heard last; two inches ← "two" heard with the wrong unit
    { id: 'n3', skill: 'number', level: 'B2', point: 'desk', seg: [206.15, 215.2],
      stem: 'How much closer to the copier was Dwight’s desk by the end of the day?',
      choices: ['An inch', 'Two inches', 'Two feet', 'Ten feet'], a: 2, keep: true,
      cue: 'ドワイトの一文、closer の前。',
      line: 'my desk was about *two feet* closer to the copier. — … I just moved it an inch every time…',
      said: 'ドワイトは「机が2フィート近づいた」と言い、ジムは「トイレのたびに1インチ動かした」と言う。',
      mean: '1回1インチを1日くり返して、合計2フィート（約60cm）。',
      trap: 'inch はジムの言う1回分。合計はドワイトの文の方にある。単位まで聞く。',
      use: 'Move it a foot to the left.（左に30cmほど動かして）' },

    // R fix: K1 (C2, a fresh read ≈ 65 %): "Dwight, who didn't notice until the end" was defensible, since the trick
    //   relies on his not noticing. Now "never noticed", which Dwight's own "by the end of the day" refutes.
    // why: Dwight ← the pranks' usual target, and the inch-at-a-time trick is about his not noticing; Michael ← a boss who
    //   lets an employee do this all day
    // anchor: 215.5–218.5 s “And that's how I spent my entire day that day”: the subject is "I", and "entire day"
    //   is Jim's own time, used up an inch at a time
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'wholeday', seg: [206.15, 219.1],
      stem: 'In Jim’s last remark about the desk, who is the joke on?',
      choices: ['Jim, who used up his whole day on it', 'Dwight, who never noticed his desk moving',
                'Michael, who let Jim waste a whole day'], a: 0,
      cue: '最後の文の主語と、entire day が誰の時間か。',
      line: 'I just moved it an inch every time… *And that’s how I spent my entire day that day.*',
      said: '「トイレのたびに1インチずつ動かした。その日は丸一日それで終わった」と話す。',
      mean: '自慢のようで、自分の一日を丸ごといたずらに使ったと認めている。笑われているのは話し手自身。',
      trap: 'いたずらの的はドワイトなので、彼が笑いの的と思いやすい。最後の文の主語 I と my を追う。',
      use: 'And that’s how I spent my weekend.（で、週末はそれで終わった）' },

    // R fix: V2 (blind 50 %) and S4: "gets angry" was a filler, and the seg (17.1 s) ran over 15 s. It's now
    //   223.85–237.7, from “Creed has a distinct old man smell”. All three choices are now "He admits/denies…, and
    //   blames…".
    // why: denies, blames Ryan ← the reply to a complaint heard as a defence; blames his age ← "I know exactly what
    //   he's talking about" taken as agreement with Ryan's reason
    { id: 'h3', skill: 'humor', level: 'C1', point: 'creed', seg: [223.85, 237.7],
      stem: 'Why is Creed’s answer about the smell funny?',
      choices: ['He admits the smell, but blames his beans', 'He admits the smell, and blames his age',
                'He denies the smell, and blames Ryan'], a: 0,
      cue: '「I know exactly」のあと、何のせいにするか。',
      line: 'I know exactly what he’s talking about. I *sprout mung beans*… but they smell like death.',
      said: '「分かる。引き出しで豆を育てていて、ひどい臭いなんだ」と話す。',
      mean: '臭いは認めるが、原因は豆だと信じ込んでいる。「年寄りの臭い」という指摘には触れない。',
      trap: 'I know exactly を同意と取りやすい。認めたのは臭いの存在だけで、理由は別。',
      use: 'I know exactly what you mean.（言いたいこと、よく分かる）' },
  ]
};
