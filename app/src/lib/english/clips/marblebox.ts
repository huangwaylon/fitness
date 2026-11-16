// “Time to put a marble in the box - The Office US” (the official The Office channel, BEST OF SEASON 5): Michael tries
// to get the warehouse guys, Andy and Dwight to back or join the paper company he's starting; nobody does, the new boss
// Charles has him walked out, and the office says goodbye in talking heads.
// Segments from the captions, words from whisper (2026-11-16). Untested: 31–34 s (Michael's answer: "Yeah" in the
// captions, "No" in whisper), 42–44 s ("It doesn't sound like a sure thing" / "It'll sound like…"), 67–69 s (the pet:
// "It's a gecko" in whisper, "I have to get go" in the captions), 264–281 s (Michael singing, mostly visual),
// 307–313 s (innuendo about the new guy), and 321–344 s (whisper loops "Time to put a marble in the box").
// EAR CHECK: 158.7 s r1 — the cut must fall after "…a part of the opportunity" and before "Um… Location is hard"
// EAR CHECK: 315.5–317.0 s i5 — the captions "Old Critty outlives yet another boss", whisper "Old Creedy out, Liz. Yet
//   another boss.": confirm "outlives" (the key rests on "yet another boss", which both have)
// REVIEW 2026-11-16: pass 6, fix 16, drop 2, new 2; ear checks 2
// Q: none open. Literal coverage was 3 (< 4) before the review; d3 (new) fills it.
import type { Clip } from '../types.ts';

export const marbleBox: Clip = {
  id: 'marblebox', video: 'wPtS9WYTxDo', title: 'Time to put a marble in the box - The Office US', dur: 344, wpm: 152,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 — "talk the new boss into letting him stay" isn't in the segment at all; now "say goodbye", which the
    //   clip's ending makes tempting (blind 55 % → ~40 %)
    // why: bigger company ← "paper company" and the warehouse questions heard as job hunting; goodbye ← the clip ends
    //   with farewells and "I'm out of here", so the whole clip can be filed as a send-off
    { id: 'g1', skill: 'gist', level: 'B1', point: 'recruit', seg: [3.0, 173.6],
      stem: 'Across the clip, what is Michael trying to do?',
      choices: ['Get people to join or back his new company', 'Find work at another, bigger paper company',
                'Say goodbye to everyone before he leaves'], a: 0,
      cue: '倉庫、Andy、Dwight と、相手を変えて頼む中身。',
      said: '倉庫の人たちに広さを聞き、出資や参加の話をし、Andy や Dwight も誘う。',
      mean: '自分で紙の会社を始めるため、仲間と支援を集めて回っている。',
      trap: 'paper company が何度も出るので転職に、最後の別れで送別に聞こえる。頼みの中身を追う。',
      use: 'I’m starting my own business.（自分で事業を始めるんだ）' },

    // why: invest ← "Can I invest?" comes right after; work for him ← the recruiting script of the rest of the clip
    { id: 'd1', skill: 'detail', level: 'B1', point: 'space', seg: [16.8, 30.6],
      stem: 'What does Michael ask the warehouse guys?',
      choices: ['How much room a small paper company needs', 'Whether they would invest in his company',
                'Whether they would come and work for him'], a: 0,
      cue: '「warehouse space」のあたり、何の広さを聞いているか。',
      line: 'How much *warehouse space* do you think a paper company *would need*…?',
      said: '「紙の会社なら倉庫はどのくらい要ると思う？」と聞き、最後は「ガレージくらい？」と言う。',
      mean: '倉庫で働く二人に、新しい会社に必要な広さを相談している。',
      trap: 'すぐあとに invest が出るので出資の話に聞こえやすい。最初の質問は広さ。',
      use: 'How much space do you think we need?（どのくらいの広さが要ると思う？）' },

    // why: 20 ← "-five" swallowed before "clients"; 35 ← the flapped t of "twenty" heard as the "th" of "thirty"
    { id: 'n1', skill: 'number', level: 'B1', point: 'clients', seg: [18.6, 27.4], keep: true,
      stem: 'How many clients does Michael imagine the company having?',
      choices: ['20', '25', '35'], a: 1,
      cue: '「clients」の直前の数字。',
      line: 'if it had, like, *25* clients?',
      said: '「客が25社くらいなら」と仮定し、いずれ広げたいと付け加える。',
      mean: 'like は「〜くらい」。正確な数ではなく、だいたいの見積もり。',
      trap: 'twenty の t は弱く、five も clients の前で短くなる。数字の後半まで聞く。',
      use: 'There were, like, thirty people there.（30人くらいいたよ）' },

    // R fix: V2 — "a little; a small amount" was a filler; now "would invest if it were safer", from “It doesn't sound
    //   like a sure thing”
    // why: want a share ← "Can I invest?" taken at face value, twice; if safer ← "doesn't sound like a sure thing" heard
    //   as a real condition
    { id: 't1', skill: 'attitude', level: 'B1', point: 'tease', seg: [35.9, 50.4],
      stem: 'When the warehouse guys ask “Can I invest?”, how serious are they?',
      choices: ['Not at all; they are teasing him', 'Very; they want a share of it',
                'Somewhat; they’d invest if it were safer'], a: 0,
      cue: '少しあとの「I need you to know something」の続き。',
      line: 'I need you to know something. *I’m messing with you.*',
      said: '二人とも「出資したい」と言ってすぐ「金がない」と引き、最後に「からかってるだけ」と明かす。',
      mean: 'mess with ＝ からかう。出資の話は最初から冗談。',
      trap: 'sure thing じゃないと引くのも冗談の流れ。最後のひと言で確かめて。',
      use: 'Relax, I’m just messing with you.（落ち着いて、からかっただけ）' },

    // R fix: V2 — "locked away in a bank safe" was a filler (blind 70 %); now "all gone", the other man's "tapped out"
    // why: all gone ← "tapped out" right after, by the other man, heard as the same excuse; owes it ← "money's tied up"
    //   heard as money promised to someone
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'tiedup', seg: [38.2, 41.5],
      stem: 'What does “My money’s tied up” mean here?',
      choices: ['It is all in other things right now', 'It is all gone; he has none left',
                'It is all owed to somebody else'], a: 0,
      cue: '直後のもう一人の短い言い訳とセットで。',
      line: 'My money’s *tied up*. — I’m tapped out.',
      said: '一人は「金は動かせない」、もう一人は「すっからかん」と言う。',
      mean: 'tied up ＝ ほかに使っていて今は動かせない。ないとは言っていない。',
      trap: 'tapped out（すっからかん）と同じに聞こえやすい。tied up は使い道がふさがっているだけ。',
      use: 'Sorry, I’m tied up all afternoon.（ごめん、午後はずっとふさがってる）' },

    // R fix: V2 — "a boast" was the odd one out (blind 60 %); now "modest" (right target, wrong direction)
    // why: argued hard ← "honestly tried" taken at face value; modest ← the Japanese frame: a short "I tried" heard as
    //   謙遜, more done than said
    // anchor: 34–50 s two fake offers, then "I'm messing with you"; 50.9 s a single "This doesn't sound like a good
    //   idea"; 63.2 s Michael: "This will work. It has to work."
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'tried', reveals: ['dissuade', 'tease'], seg: [41.0, 65.9],
      stem: 'After seeing the scene, how should we hear “I honestly tried”?',
      choices: ['As a stretch: one line after a lot of teasing', 'As true: he argued hard, but Michael ignored him',
                'As modest: he did even more than he says here'], a: 0,
      cue: '倉庫での会話で、反対らしい言葉は何回あったか。',
      line: 'I was just trying to dissuade him. I tried. *I honestly tried.*',
      said: 'カメラには「本当に止めようとした」。だが場面では、冗談の出資話のあとに反対を1回言っただけ。',
      mean: 'カメラへの一言が場面と食い違う。honestly を重ねるほど、言い訳らしく聞こえる。',
      trap: '言葉をそのまま、または謙遜と取りやすい。場面の反対は1回だけ。カメラの前の言葉は場面と比べる。',
      use: 'I tried. Well, sort of.（やってはみたよ。まあ、一応ね）' },

    // R fix: V2 — "wish Michael luck" was a filler; now "stay out of the plan" (dis- heard as “away from”)
    // why: persuade ← dissuade / persuade differ by one sound; stay out ← dis- heard as "keep away", about himself
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'dissuade', seg: [54.3, 58.4],
      stem: 'What was he “just trying” to do, in his talking head?',
      choices: ['Talk Michael out of the plan', 'Talk Michael into the plan', 'Stay out of Michael’s plan himself'], a: 0,
      cue: '「trying to」のあとの動詞、その最初の音。',
      line: 'He wants to start his own company, and I was just trying to *dissuade* him.',
      said: '「会社を始めたいと言うので、思いとどまらせようとしただけ」と言う。',
      mean: 'dissuade ＝ 説得してやめさせる。persuade（説得してやらせる）の反対。',
      trap: 'dis- の音が弱いと persuade に聞こえ、意味が逆になる。最初の音に注意。',
      use: 'I tried to talk her out of it.（やめるように説得したんだけど）' },

    // R new: d3 — the bank had 3 literal items (C2 needs ≥ 4). Blind read: 40 % ("a mouth to feed" is a strong pull).
    //   The pet's name in the audio is disputed (gecko / "get go"), so the item never names it.
    // why: something to feed ← "I have a mouth to feed" said just before, in the wrong relation (it's why the company
    //   has to work); company ← the usual reason to get a pet, the broken script
    { id: 'd3', skill: 'detail', level: 'B1', point: 'pet', seg: [64.3, 75.9],
      stem: 'Why does Michael say he got his pet?',
      choices: ['To give people something to talk about', 'To have someone at home to feed and care for',
                'To keep himself company in the evenings'], a: 0,
      cue: '「stupidly got it because」のあと。',
      line: 'I thought it would be a great *conversation starter*. It has yet to start a conversation.',
      said: '「会話のきっかけになると思った。まだ一度もならない」と言う。',
      mean: 'conversation starter ＝ 話のきっかけ。期待外れを自分で認めている。',
      trap: '直前の a mouth to feed で世話に聞こえるが、理由は because のあと。',
      use: 'It’s a great conversation starter.（話のきっかけになるよ）' },

    // R fix: S4 — the start cut into "starter"; B1 — the stem names the pet aside, d3's point → reveals pet
    // why: new subject ← "anyway" often moves on; one more pet fact ← the pet aside goes on just before
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', reveals: ['pet'], seg: [73.0, 80.5],
      stem: 'After the “conversation starter” aside, what does Michael’s next word do?',
      choices: ['Brings him back to whether the company will work', 'Starts a new subject: how much money he has',
                'Adds one more joke about the pet he bought'], a: 0,
      cue: 'ペットの話が終わった直後、文頭の一語。',
      line: '*Anyway*, I have no reason to believe that I can’t do this.',
      said: 'ペットの話をしたあと、「とにかく、できないと思う理由はない」と言う。',
      mean: 'Anyway ＝ 話を戻す合図。脱線の前の「うまくいくはず」に戻っている。',
      trap: 'anyway は話題を変えるときにも使うが、ここは元の話に戻る使い方。',
      use: 'Anyway, where was I?（とにかく、どこまで話したっけ）' },

    // R fix: V2 — the key named the pun outright ("climate as weather, not the economy"); it now describes the answer
    // why: worldwide ← the next sentence; times are bad ← "In this climate?" heard as a warning that he accepts
    { id: 'h1', skill: 'humor', level: 'C1', point: 'climate', seg: [82.4, 92.5],
      stem: 'Why does Michael’s reply to “In this climate?” get a laugh?',
      choices: ['He answers as if it were about the weather', 'He means the company will sell around the world',
                'He admits times are bad but says he doesn’t care'], a: 0,
      cue: '質問の climate がどちらの意味か。返事の all がヒント。',
      line: 'In this *climate*? — Yeah. *In all climates.*',
      said: '「この（不景気な）時期に？」に「ああ、どんな気候でも」と返す。',
      mean: 'climate はここで「経済の状況」。Michael は天気の気候だと取り違えている。',
      trap: '次の worldwide で世界の話に聞こえるが、笑いは climate の取り違え。',
      use: 'In this economy?（このご時世に？）' },

    // R fix: V2 — "the French" was close to absurd; now his family (the subject of his sentence: right words, wrong
    //   target)
    // why: Michael ← Andy is turning Michael down, so the joke seems aimed at the plan; his family ← "the Bernards" is
    //   the subject, so they seem to be the butt
    // anchor: 101.6 s "the Bernards have always maintained…" (his own family), then "cowardice" (an English word, about
    //   himself) and "There's no word for it in English"
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'coward', seg: [99.0, 116.6],
      stem: 'In Andy’s talking head about “self-preservation”, who is the joke on?',
      choices: ['Andy, who dresses up his own fear', 'Michael, for thinking people will join him',
                'His own family, whom he is making fun of'], a: 0,
      cue: '主語の「the Bernards」は誰の家族か。',
      line: 'the *Bernards* have always maintained a rare quality of *self-preservation*.',
      said: '「バーナード家は代々、自分を守る資質を持つ」と家を持ち上げ、それを cowardice と言いかえる。',
      mean: '自分のこわがりを立派に言いかえ、英単語をフランス語扱い。笑われているのは本人。',
      trap: '断る相手や主語の家族への皮肉に聞こえるが、家族はほめている。的は話し手。',
      use: 'I’m not scared. I’m just careful.（怖くないよ。慎重なだけ）' },

    // R drop: h2 (never shipped) — V2 (blind 70 %: "cowardice is an ordinary English word" is plain to any reader) and
    //   the same point as nt3, which covers the same joke at C2
    // R fix: S2/V2 — the stem quoted "just… right now", which answers it (blind 85 %); it now quotes "nugget" only, and
    //   "nearly ready" becomes the gold-nugget reading
    // why: valuable ← a nugget of gold, plus "lots of potential" right after; joke ← nugget = a fried chicken nugget,
    //   read literally
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'nugget', seg: [134.0, 141.6],
      stem: 'What does Michael mean by calling the company a “nugget” of an idea?',
      choices: ['It is only a small, early idea so far', 'It is a really valuable idea already',
                'It is a joke he isn’t serious about'], a: 0,
      cue: '「just」と「right now」にはさまれた言い方。',
      line: 'it’s just a *nugget of an idea* right now.',
      said: '「今はまだ、アイデアのかけらにすぎない」と言う。',
      mean: 'a nugget of ～ ＝ 小さなかたまり。「まだ始まったばかり」の案。',
      trap: 'nugget を金塊と取ると「価値ある案」に聞こえる。前後の just と right now が「まだ」の合図。',
      use: 'It’s just a rough idea for now.（今はまだざっくりした案だけ）' },

    // R fix: V2 — "a question about pay" was the odd one out (blind 60 %); now a question about the office's location
    // why: happy yes ← the warm "courageous venture… amazing opportunity" just before; where ← a new company's first
    //   practical question
    // EAR CHECK: the cut at 158.7 s
    { id: 'r1', skill: 'predict', level: 'B2', point: 'farm', seg: [149.4, 158.7], then: [158.7, 168.2],
      stem: 'Right after Michael invites Dwight to be part of it, what kind of reply comes?',
      choices: ['A careful excuse that avoids a yes', 'A quick, happy yes to the offer',
                'A question about where the office will be'], a: 0,
      cue: '誘われる直前まで、Dwight はほめるだけで何を約束したか。',
      line: '…to ask you to be a part of the opportunity. — *Um…* Location is hard for me…',
      said: '「すばらしいチャンスだ」とほめた Dwight は、誘われると「うーん、場所がね」。',
      mean: 'ほめ言葉だけで約束はしていない。誘われた瞬間に間が空き、断りの理由が始まる。',
      trap: 'ほめ言葉が続くと yes を期待しやすいが、自分のことは何も言っていない。',
      use: 'Um, let me think about it.（うーん、ちょっと考えさせて）' },

    // R fix: V2 — the distractors now share the key's form (a move on the offer), not just a topic
    // why: near the farm ← "location" and "farm" heard as a request about where the office goes; later ← "the
    //   responsibilities" heard as a busy season that will end
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'farm', seg: [158.6, 168.2],
      stem: 'What does Dwight’s answer about “location” do?',
      choices: ['Turns the offer down without saying no', 'Sets a condition: an office near his farm',
                'Puts off a yes until farm work slows down'], a: 0,
      cue: '最初の間と、そのあと並べる理由。',
      line: '*Um…* Location is hard for me, with the *farm* and the *responsibilities*.',
      said: '少し間を置いて、「農場や責任があるから、場所が難しい」と言う。',
      mean: '理由を並べて、はっきり no と言わずに断っている。',
      trap: '場所の条件を出しているように聞こえるが、条件ではなく、断るための理由。',
      use: 'It’s a bit hard for me right now.（今はちょっと難しいかな）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'pin', seg: [169.1, 174.0],
      stem: 'Type the words: “Yeah, let’s ___ for now.” (5 words)', answer: 'put a pin in it',
      cue: '「think about it」のすぐあと。同じ言い方がもう一度出る。',
      line: 'So think about it. — Yeah, let’s *put a pin in it* for now.',
      said: '「考えておいて」「うん、いったん保留にしよう」と言う。',
      mean: 'put a pin in it ＝ いったん保留。全部つながり「プラピニニッ」に近い。',
      trap: 'a と it は弱く、ほとんど聞こえない。5語を手がかりに区切る。',
      use: 'Let’s put a pin in that.（その話はいったん保留で）' },

    // why: stay at his side ← the first, longer picture (cradle him, sing him into death) heard as Dwight's choice;
    //   captain himself ← "new captain" heard as Dwight taking over
    { id: 'i3', skill: 'infer', level: 'B2', point: 'battle', seg: [173.8, 187.6],
      stem: 'In Dwight’s battlefield story, which choice is he making about Michael?',
      choices: ['Let him go and follow the new boss', 'Stay at his side until the very end',
                'Take over as the new boss himself'], a: 0,
      cue: '2つの道の、後のほう。「Or」のあと。',
      line: '*Or* you can *write him off*, *salute your new captain*…',
      said: '「倒れた隊長を抱いて看取る道もあれば、見切って新しい隊長に敬礼する道もある」と言う。',
      mean: 'Michael を見切り、新しい上司につく宣言。write off ＝ 見切る。',
      trap: '前半が長く感動的なので、そちらを選ぶように聞こえる。結論は Or の後。',
      use: 'I’ve written that idea off.（その案はもうあきらめた）' },

    // R fix: V1/K2 — "no one goes with him" is told by the picture, not the words; the key is now the order to leave. S4:
    //   the segment starts at Dwight's battlefield talk, so the evidence against "with Dwight" is inside it
    // why: two weeks ← "It's my two weeks" heard as Michael getting his way; with Dwight ← the earlier invitation
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['twoweeks', 'battle'], seg: [173.8, 282.0],
      stem: 'How does Michael’s last day end?',
      choices: ['He is told to leave right away, not in two weeks', 'He finishes his two weeks and leaves on good terms',
                'He walks out with Dwight as his first salesman'], a: 0,
      cue: '新しい上司の「stand up」と、その返事。',
      said: 'Dwight は新しい上司につき、Michael は「立って出ていって」と言われて去る。',
      mean: '2週間を待たず、その場で追い出される終わり方。',
      trap: 'two weeks や Dwight への誘いを覚えていると穏やかな終わりを想像しやすい。',
      use: 'I’m out of here.（もう帰るね）' },

    // R drop: s2 (never shipped) — V1: "I can't pretend I have seen that" makes no sense, so meaning alone picks
    //   "haven't" (blind 65 %); a sound item has to be settled by the sound. Replaced by s3.
    // R fix: V2 — the key was the clip's main fact against two outside reasons (blind 70 %); "rude" becomes "going to
    //   work for a rival" (the "-ing… paper company" heard, "starting" missed)
    // why: took things ← "you can't take anything" heard as the reason; work for a rival ← "competing paper company"
    //   heard, "starting" missed
    { id: 'd2', skill: 'detail', level: 'B1', point: 'twoweeks', seg: [199.5, 211.8],
      stem: 'Why does Charles say Michael can’t stay for his two weeks?',
      choices: ['He is starting a rival paper company', 'He is going to work for a rival company',
                'He has taken things from the office'], a: 0,
      cue: '「Not if」で始まる、Charles の返事。',
      line: '*Not if you’re starting a competing paper company*, Michael.',
      said: '「競合する紙の会社を始めるなら、話は別だ」と言う。',
      mean: 'competing ＝ 競合する。ライバル会社を作る人を残すわけにはいかない。',
      trap: 'can’t take anything が聞こえるので持ち出しが理由に聞こえるが、それは出ていく条件。',
      use: 'Not if it rains.（雨なら話は別だよ）' },

    // why: two weeks' pay ← "my two weeks" heard as vacation or money owed; keep things ← "you can't take anything"
    //   just before, so immunity seems to be about his desk
    { id: 'i4', skill: 'infer', level: 'C1', point: 'twoweeks', seg: [205.0, 211.9],
      stem: 'What does Michael mean by “I have immunity”?',
      choices: ['He thinks they can’t make him leave yet', 'He thinks he is owed two weeks of pay',
                'He thinks he can keep things from his desk'], a: 0,
      cue: 'すぐあとの「It’s my two weeks」とつなげて。',
      line: 'I have *immunity*. *It’s my two weeks.*',
      said: '「僕には免除がある。辞めるまでの2週間なんだから」と言う。',
      mean: 'two weeks ＝ 辞める前の2週間。その間は追い出されないと思っている。',
      trap: 'two weeks を休みや給料と取りやすい。immunity は「手出しできない」立場のこと。',
      use: 'I gave my two weeks’ notice.（2週間前に退職を伝えたよ）' },

    // R fix: V2 — "politely thanks Hank" was a filler; now "begs Hank to let him stay" (the "loyal to you?" line read as
    //   pleading)
    // why: name mix-up ← "Hank?" said as a question, as if unsure of the name; begs ← "Hank… please" heard as Michael
    //   pleading for himself
    { id: 'h3', skill: 'humor', level: 'C1', point: 'hank', seg: [212.2, 221.8],
      stem: 'Why is Michael’s last line to Hank funny?',
      choices: ['He turns the order around onto the boss', 'He mixes up the guard’s name with Charles’s',
                'He begs Hank to let him stay a while'], a: 0,
      cue: '最後の文で、escort される人は誰か。',
      line: 'You really think Hank is going to be loyal to you? *Hank, please escort Charles*…',
      said: '「Hank が君に従うと思う？」と言って、Hank に「Charles を連れ出して」と頼む。',
      mean: '追い出される側が、追い出す側を逆に追い出そうとしている。',
      trap: 'please が付くので自分のための頼みに聞こえる。escort の目的語の名前を聞く。',
      use: 'Nice try.（うまくやったつもりでしょ）' },

    // R fix: V2/K6 — the key was the only concrete choice ("walk across the room", blind 60 %); the distractors are
    //   concrete now too
    // why: find him later ← "run into him at the mall" taken as a real plan; too shy ← the Japanese frame: holding back
    //   out of 遠慮
    { id: 't2', skill: 'attitude', level: 'C1', point: 'mall', seg: [235.5, 245.9],
      stem: 'In the talking head about telling Michael, how much does the speaker care?',
      choices: ['Not enough to walk across the room', 'Enough to look for him at the mall later',
                'A lot, but too shy to walk over and say it'], a: 0,
      cue: '「tell him」と言ったあとの、行かない理由。',
      line: '*He’s all the way over there.* Maybe I’ll *run into him at the mall* someday.',
      said: '伝えようかと言うが、「遠くにいるし、いつかモールで会うかも」で終わる。',
      mean: 'all the way over there は大げさな言い訳。偶然任せ＝伝える気はほぼない。',
      trap: 'mall で会う話を予定と取りやすいが、run into は偶然会うこと。',
      use: 'Maybe I’ll run into her someday.（いつかばったり会うかもね）' },

    // R fix: V2 — parallel wording; the key read as the only pointed choice (blind 55 %)
    // why: too sad ← the pause read as being moved; not allowed ← "would like to" read as asking permission
    // anchor: 291.9 s "I would like to say that I will miss him" → pause → 295.6 s "I would like to say that." (the wish
    //   repeated, "I will miss him" never said as his own)
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'miss', seg: [291.3, 299.4],
      stem: 'In the talking head “I would like to say that…”, what is left unsaid?',
      choices: ['That he won’t really miss Michael at all', 'That he will miss him too much to say',
                'That he isn’t allowed to say it on camera'], a: 0,
      cue: '2回目は1回目より短い。何が落ちたか。',
      line: 'I would like to say that I will miss him. … *I would like to say that.*',
      said: '「彼がいなくなって寂しいと言いたい」と言い、間を置いて「そう言いたいね」とだけくり返す。',
      mean: '「言いたい」をくり返すだけで、本当に寂しいとは言わない。言えない＝寂しくない。',
      trap: '間を感情がこみ上げたと取りやすい。願いの形のくり返しは、本心と逆のことが多い。',
      use: 'I’d love to say yes, but…（イエスと言いたいけど…）' },

    // R new: s3 replaces s2. Blind read: 35 % (all four fit the gap; "I'd" and "I'll… them" are real sentences).
    // why: I miss ← the weak 'll vanishes before m; I'd ← 'll and 'd are both one dark sound; them ← "him" and "'em"
    //   are both weak and short
    { id: 's3', skill: 'sound', level: 'B2', point: 'dies', seg: [299.4, 304.4],
      stem: 'Fill the gap: “___ when he dies.”',
      choices: ['I’ll miss him', 'I miss him', 'I’d miss him', 'I’ll miss them'], a: 0,
      cue: '文の最初、I のあとの弱い音。',
      line: '*I’ll miss him* when he dies.',
      said: '「死んだら寂しく思う」と言い、今は寂しがる気はないと続ける。',
      mean: 'I’ll の ll は暗い l で「アウ」に近く、miss の前で消えかける。未来の話。',
      trap: 'll が消えると I miss に聞こえる。when ＋現在形の主節は will が多い。',
      use: 'I’ll call you when I get there.（着いたら電話するね）' },

    // why: quit ← "another boss" heard as people leaving the company; retire ← an old man counting down
    { id: 'i5', skill: 'infer', level: 'C1', point: 'marble', seg: [314.9, 320.5],
      stem: 'In the last talking head, what does each marble in the box stand for?',
      choices: ['A boss he has outlasted at work', 'A coworker who left to join Michael',
                'A day closer to when he can retire'], a: 0,
      cue: 'marble の前の文の終わり、2語。',
      line: 'Old Creedy outlives *yet another boss*. Time to put a *marble in the box*.',
      said: '自分を名前で呼び、「またボスより長生きした。箱にビー玉を入れる時間だ」と言う。',
      mean: 'yet another ＝ また一人。去った上司を数えるために、ビー玉を足している。',
      trap: 'Michael と一緒に辞めた人を数えるように聞こえるが、数えているのはボス。',
      use: 'Yet another delay.（また遅れか）' },
  ]
};
