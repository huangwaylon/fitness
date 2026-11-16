// REVIEW 2026-11-16: pass 6, fix 16, drop 0, new 0; ear checks 1
// Open: none.
// “Ron Helps Slash the Budget | Parks and Recreation” (the official Parks and Recreation channel, Season 2): at a
// budget-cutting meeting Ron pushes for deep cuts until the cuts reach Leslie; then he argues for her, offers himself
// instead, is overruled, and lets drop that she is putting on a concert for the city's kids.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 130.3 s (whisper loops "Bye" from
// 131 s). Ron is named at 26.4, 60.0, 95.6 and 114.2 s, Ben at 118.1 s; the man who proposes the massage train is never
// named, so i3 calls him that. Untested on purpose: 17–19 s (the talking head's "gave me a semi": sexual), 36.5–45 s
// (a ringtone and someone leaving: mostly visual), 129.3 s (who asks for someone else to massage). The captions have
// "sell the zoo animals" (80.6 s; whisper "sell to zoo animals") and "It's the second highest salary" (90.0 s; whisper
// "she makes the second highest salary", the captions garble 89.6 s): no key rests on the words that differ.
// EAR CHECK: 54.3 s i3 — "it's not that I want a massage" (captions) vs "I want to massage" (whisper); the key needs "a massage"
import type { Clip } from '../types.ts';

export const ronSlash: Clip = {
  id: 'ronslash', video: 'abhlj4Pfftc', title: 'Ron Helps Slash the Budget', dur: 151, wpm: 157, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): the title says Ron is for cutting, so "opposes the cuts" was out before listening. All
    //   three now start "He wants deep cuts"; the near miss is the "locomotive" line.
    // why: own job at risk ← "you should lay me off" heard as the turning point (it comes later, inside his defence of
    //   Leslie); put at the front ← "Ron Swanson is the locomotive" (the massage train) heard as
    //   him being made leader
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', seg: [0, 131],
      stem: 'Across the meeting, how does Ron’s view of the cuts change?',
      choices: ['He wants deep cuts, until they reach Leslie', 'He wants deep cuts, until his own job is at risk',
                'He wants deep cuts, until he’s put at the front'], a: 0,
      cue: '前半の勢いと、ある名前が出たあとの反応を比べて。',
      said: '最初は「もっと切れ」と乗り気。Leslie の名前が出たとたん、強く反対しはじめる。',
      mean: '削減は大歓迎だが、Leslie だけは別。場面の流れはそこで変わる。',
      trap: '解雇しろと言うのも Leslie を守る話の中。locomotive は列の先頭のこと。',
      use: 'I’m all for it, except that part.（大賛成。ただ、そこだけは別）' },

    // why: 40% ← Ron's "an even 40" is the last number heard; 23% ← the digits swapped (thirty-two / twenty-three)
    { id: 'n1', skill: 'number', level: 'B1', point: 'pct', seg: [2.4, 7.3], keep: true,
      stem: 'By how much do they say spending must be cut?',
      choices: ['23%', '32%', '40%'], a: 1,
      cue: '「expenditures by」のあと。',
      line: 'we need to cut expenditures by *32%*. — Let’s make it an even 40.',
      said: '支出を32%減らす必要があると言い、Ron が「きりよく40に」と返す。',
      mean: 'thirty-two percent。an even 40 ＝ きりのいい40。',
      trap: '最後に聞こえる40に引かれやすい。基準の数字と Ron の上乗せを分けて聞く。',
      use: 'Let’s make it an even ten.（きりよく10にしよう）' },

    // R fix: S2/V2 (blind 90 %): the stem quoted the idiom under test and "a joke" was weak. It now names the moment.
    // why: a wild guess ← bat = a baseball bat, a "swing at it" picture (literal); a joke ← the absurd plan (a gas
    //   station or a TJ Maxx) heard as not meant
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'bat', seg: [19.3, 26.2],
      stem: 'How does Ron put forward his City Hall idea?',
      choices: ['As the very first step', 'As a wild guess worth a try', 'As a joke to warm the room up'], a: 0,
      cue: '「we sell City Hall」の前の、決まった言い回し。',
      line: '*Right off the bat*, we sell City Hall.',
      said: '「まず手始めに、市役所を売る」と言う。',
      mean: 'right off the bat ＝「いきなり・最初に」。野球で打球が飛び出す様子から。',
      trap: 'bat から「当てずっぽう」と取りやすいが、ここは順番の話。本人は大まじめ。',
      use: 'Right off the bat, I liked it.（最初からすぐ気に入った）' },

    // R fix: V2/K6 (blind 65 %): the key was the only nuanced reading. Three "praise, then…" moves now, each a real
    //   way to hear the reply.
    // why: one condition ← "but we don't want to sell any of our major assets" heard as "as long as…" (a condition, not
    //   a no); mocks ← praise for an absurd idea heard as sarcasm (a common sitcom move)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'creative', seg: [25.9, 32.55],
      stem: 'When Ron’s City Hall idea gets its first reply, what does the praise do?',
      choices: ['Softens a no that comes right after', 'Backs the idea, then adds one condition',
                'Mocks the idea, then explains why'], a: 0,
      cue: 'ほめ言葉のすぐあとの、短い接続の一語。',
      line: 'Ron, that is a *very creative idea*, *but* we don’t want to sell…',
      said: '「面白い発想だ。でも大きな資産は売りたくない」と、理由を添えて断る。',
      mean: 'ほめてから but で断る、角を立てない断り方。',
      trap: 'but のあとを条件と取ると、検討中に聞こえる。we don’t want は条件ではなく、はっきりした断り。',
      use: 'That’s a creative idea, but maybe not today.（面白い案だけど、今日はやめておこう）' },

    // R fix: V2 (blind 55 %): the key was the only money reason. All three are now about what selling would cost.
    // why: too little ← "major assets" + "sell" heard as a price worry; a building it needs ← "major assets" taken as
    //   "we still use it"
    { id: 'd1', skill: 'detail', level: 'B2', point: 'revenue', seg: [27.8, 32.55],
      stem: 'What reason is given for not selling City Hall?',
      choices: ['They’d lose money it could earn them later', 'They’d get too little for such a big asset',
                'They’d lose a building the city still needs'], a: 0,
      cue: '「because」のあと、お金に関する言葉。',
      line: 'we don’t want to *lose out on any future revenue streams*.',
      said: '将来の収入源を失いたくないので、大きな資産は売らないと説明する。',
      mean: 'lose out on ～ ＝ ～を逃す。revenue streams ＝ 収入源。',
      trap: 'major assets から値段や使い道の話と取りやすい。理由は because の後。',
      use: 'Don’t lose out on the discount.（割引を逃さないで）' },

    // R fix: V2 (blind 55 %): two of three choices were negative feelings, so "unbothered" stood out. Now two
    //   "unbothered" readings and one hidden hurt.
    // why: dropping it ← "I hear that" heard as accepting and letting the subject go; hurt behind a joke ← the Japanese
    //   frame: a turned-down idea means losing face, covered with a light line
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'tons', seg: [32.1, 35.8],
      stem: 'How does Ron take it when his first idea is turned down?',
      choices: ['Unbothered, and ready with more', 'Unbothered, and letting the subject go',
                'Hurt, but covering it with a joke'], a: 0,
      cue: '短い返事のあと、「Don’t worry」に続く言葉。',
      line: '*I hear that.* Don’t worry, *I have tons more ideas*.',
      said: '「なるほど。心配するな、アイデアは山ほどある」とすぐ次へ進む。',
      mean: 'I hear that ＝「分かった」。気にせず、むしろ張り切っている。',
      trap: 'I hear that だけなら引き下がるようにも聞こえる。Don’t worry で続ける気だと分かる。',
      use: 'Don’t worry, I have plenty more.（心配しないで、まだたくさんあるから）' },

    // R fix: V2/K5 (blind 50 %): the key alone named the concert, a detail. Three "Ron's offer…" outcomes now.
    // why: accepted ← "you should lay me off" taken as the deal that was made; Leslie kept ← "we need to keep you"
    //   heard as being about Leslie, and Ron's long defence as winning
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['keep'], seg: [45, 131],
      stem: 'How does the talk about Parks and Rec end?',
      choices: ['Ron’s offer is refused, and they move on', 'Ron’s offer is accepted, and Leslie stays',
                'Ron’s offer is refused, and Leslie is kept'], a: 0,
      cue: '「moving on」のあとの短いやりとり。',
      said: '申し出は「だから残す」と返され、「次へ行こう」と打ち切られる。',
      mean: '反論は通らず、Leslie をどうするかも決まらないまま話が進む。',
      trap: 'keep you は Ron を残す話。Leslie を残すとは誰も言っていない。',
      use: 'Okay, we’re moving on.（はい、次に行きましょう）' },

    // R fix: V2 (blind 70 %): "the best massage" was easy to rule out. The near miss is now the train's direction
    //   (getting from everyone ahead).
    // why: watch over everyone ← the caboose (last car) heard as the one keeping an eye on the train; gets from those
    //   ahead ← the train's direction flipped, and "I want a massage" heard without "it's not that"
    // retired: ear check (the key needs “a massage”, captions; whisper has “to massage”)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'caboose', seg: [52.2, 59.1], retired: true,
      stem: 'Why does the man suggesting the massage train say he’ll be the caboose?',
      choices: ['So he only gives, and gets none', 'So he gets one from everyone ahead', 'So he can keep an eye on everyone'],
      a: 0,
      cue: '「it’s not that」のあと、自分について言うこと。',
      line: 'it’s *not that I want a massage*, I’ll be the *caboose*.',
      said: '「もまれたいわけじゃない。僕は最後尾をやる」と言い、Ron を先頭にする。',
      mean: '最後尾は前の人をもむだけで、誰にももまれない。',
      trap: 'it’s not that ～（～というわけではない）を聞き落とすと「もまれたい」に聞こえる。',
      use: 'It’s not that I’m hungry, but…（お腹がすいてるわけじゃないけど…）' },

    // R fix: V2 (blind 70 %): "rather cut it entirely" was the only Ron-free reading left; now it's the literal one,
    //   phrased like the others.
    // why: staff walk out ← "get rid of the department" heard as people leaving with her; glad to cut it ← Ron's love of
    //   cuts + "just get rid of" read as a wish (literal)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'mightas', seg: [68.3, 73.8],
      stem: 'When Leslie’s name comes up for cuts, what does Ron’s reply imply?',
      choices: ['She’s the one who keeps it all running', 'The staff would all leave if she went',
                'He’d be glad to cut the department too'], a: 0,
      cue: '何度も「no」と言ったあとの、if で始まる文。',
      line: 'If you fire Leslie, you *might as well just get rid of the department*.',
      said: '「Leslie を切るなら、部署ごとなくしたほうがましだ」と反対する。',
      mean: 'might as well ～ ＝ ～したも同然。彼女なしでは部署が回らない。',
      trap: '削減好きの Ron なので本気と取りやすい。直前の no の連続が反対のサイン。',
      use: 'Then we might as well stay home.（それなら家にいたほうがいいね）' },

    // why: run ← 've vanishes, leaving a bare "we run"; ran ← the same with the vowel misheard (æ/ʌ); running ← the
    //   "out of options" situation heard as still going on
    { id: 's1', skill: 'sound', level: 'B2', point: 'runout', seg: [73.6, 77.05],
      stem: 'Fill the gap: “But ___ options.”',
      choices: ['we run out of', 'we’ve run out of', 'we ran out of', 'we’re running out of'], a: 1,
      cue: '「but」のすぐあと、短く弱い音。',
      line: 'But *we’ve run out of* options.',
      said: '「でも、もう選択肢がない」。’ve はほぼ聞こえない。',
      mean: 'have run out ＝ もう使い切った。we’ve run out of がひと続きになる。',
      trap: '’ve が消えると ran と聞き分けにくい。ran なら母音が「ア」に近く開く。',
      use: 'Sorry, we’ve run out of milk.（すみません、牛乳を切らしています）' },

    // R fix: V2 (blind 60 %): the key was the only odd answer among two sensible ones. All three are now odd buyers.
    // why: circuses ← "zoo animals" makes a show the obvious use; farms and other zoos ← animals + "sell" make a
    //   rehoming picture
    { id: 'd2', skill: 'detail', level: 'B1', point: 'zoo', seg: [79.5, 86.3],
      stem: 'When asked who would buy, which buyers does Ron name?',
      choices: ['Labs and odd restaurants', 'Circuses and rich collectors', 'Farms and other zoos'], a: 0,
      cue: '「to whom?」と聞かれた直後。',
      line: 'Okay, to whom? — *Cosmetics labs*. *Weird restaurants*.',
      said: '動物園の動物を売ろうと言い、「誰に？」と聞かれて「化粧品のラボ、変わったレストラン」と答える。',
      mean: '売り先を二つ、まじめな顔で挙げている。',
      trap: 'zoo animals と聞くと、サーカスやほかの動物園を思い浮かべやすい。答えは質問の直後に来る。',
      use: 'Okay, and who would pay for that?（で、それは誰が払うの？）' },

    // R fix: V2 (blind 70 %): "no idea what a zoo is for" was weak. All three now say what the buyers would do.
    // why: on display ← "weird restaurants" heard as a themed place with animals to look at; can't afford ← "weird
    //   restaurants" heard as small, odd customers, not as kitchens
    { id: 'h1', skill: 'humor', level: 'C1', point: 'zoo', seg: [79.5, 86.3],
      stem: 'Why does the audience laugh at Ron’s list of buyers?',
      choices: ['The buyers would test on or eat them', 'The buyers would put them on display',
                'The buyers could never afford them'], a: 0,
      cue: '売り先が、動物を何に使う場所か考えて。',
      line: 'Okay, to whom? — *Cosmetics labs*. *Weird restaurants*.',
      said: '動物の売り先に、化粧品のラボと「変わったレストラン」を平然と挙げる。',
      mean: 'ラボなら動物実験、レストランなら食材。言わずにほのめかすブラックな冗談。',
      trap: '店の名前として聞くとただの変な答え。動物を何に使うかを想像すると分かる。',
      use: 'Let’s just say it wouldn’t end well.（まあ、ろくなことにはならないね）' },

    // R fix: S2/V2 (blind 90 %): the stem quoted the phrase, and "other people's ideas" was a filler. It now names the
    //   moment; "saved up" calls back to "tons more ideas".
    // why: jokes ← "just" heard as "only kidding"; saved up ← his earlier "I have tons more ideas" heard as a list ready
    //   in advance
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'spitball', seg: [84.9, 89.5],
      stem: 'Right after naming the buyers, what does Ron say about his ideas?',
      choices: ['They’re rough, first-thought ideas', 'They’re jokes, not meant seriously', 'They’re ideas he has saved up'],
      a: 0,
      cue: '売り先を二つ挙げた直後の、短い一言。',
      line: 'Weird restaurants. *I’m just spitballing here*.',
      said: '売り先を挙げたあと「思いつきで言ってるだけだ」と付け足す。',
      mean: 'spitball ＝ 練る前の案を次々に出す、という口語。',
      trap: 'just から「冗談だよ」と取りやすいが、本人は案として出している。前の「山ほどある」とも別の話。',
      use: 'I’m just spitballing, but what about Friday?（思いつきだけど、金曜はどう？）' },

    // why: the highest ← "second" is short and weak before "highest"; second-newest ← "second" caught, "salary" lost
    //   (the last-in, first-out script)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'salary', seg: [89.0, 93.0],
      stem: 'What fact about Leslie makes cutting her worth it, money-wise?',
      choices: ['Hers is the second-highest pay in the department', 'Hers is the highest pay in the whole department',
                'She is the second-newest person in the department'], a: 0,
      cue: '「in the department」の前、順位を表す言葉。',
      line: '…the *second highest salary* in the department. It’ll go a long way.',
      said: '「部署で2番目に高い給料だ。削れば効果は大きい」と言う。',
      mean: 'second highest ＝ 2番目に高い。go a long way ＝ 大いに役立つ。',
      trap: 'second は短く弱く、highest だけが残りやすい。最上級の前の順位を聞く。',
      use: 'It’s the second-biggest city in Japan.（日本で2番目に大きい都市です）' },

    // R fix: V2/K3 (blind 80 %): "fears Leslie will replace him" was easy to rule out. The near miss is now the
    //   principle he does say out loud (said, so not withheld).
    // why: wants out ← "proud to be a casualty in this righteous war" heard as a wish to leave; any job, even his own ←
    //   his libertarian reason, which is said openly, taken as the hidden one
    // anchor: 93.3–94.9 s "it's just not an option" (cutting Leslie); 97.1 s "Just give me a sec" (he looks for a way
    //   out); 98.3–104.1 s the reason he gives is Leslie's workload, ending "So you should lay me off"
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'layoff', reveals: ['share'], seg: [93.1, 107.6],
      stem: 'When Ron offers to be laid off, what is he trying not to say?',
      choices: ['That he’s doing it to keep Leslie', 'That he’s been wanting out for a while',
                'That he’d cut any job, even his own'], a: 0,
      cue: '直前に何を「not an option」と言ったか。',
      line: 'it’s just *not an option*. … So you should *lay me off*.',
      said: '「Leslie を切るのは論外」と言い、少し考えて「仕事は彼女がやってる。だから俺を切れ」と申し出る。',
      mean: '理由は主義の話だが、狙いは Leslie を残すこと。代わりに自分を差し出している。',
      trap: '「名誉の戦死」から辞めたかったと取りやすい。主義は口に出している。何を守っていたかを聞く。',
      use: 'Take me instead. I’ll go.（代わりに私が行きます）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'sec', seg: [95.2, 98.25],
      stem: 'Type what Ron says: “Just ___.” (4 words)', answer: 'give me a sec',
      cue: '「focus up」と言われた直後。',
      line: 'Just *give me a sec*.',
      said: '「集中しろ」と言われ、「ちょっと待ってくれ」と返す。',
      mean: 'give me は「ギミ」とつながり、a sec（a second の略）まで一息で言う。',
      trap: 'give me が「ギミ」に縮むので、一語に聞こえやすい。間の a も弱く、落としやすい。',
      use: 'Give me a sec, I’ll be right there.（ちょっと待って、すぐ行く）' },

    // why: 90% ← "five" is short after "ninety"; 59% ← the digits swapped; 5% ← only "five" caught (Ron's own share)
    { id: 'n2', skill: 'number', level: 'B1', point: 'share', seg: [97.8, 102.3], keep: true,
      stem: 'How much of the department’s work does Ron say Leslie does?',
      choices: ['5%', '59%', '90%', '95%'], a: 3,
      cue: '「Leslie does」のすぐあと。',
      line: 'Leslie does *95%* of the work.',
      said: '自分の主義のせいで、仕事の95%は Leslie がやっている、と言う。',
      mean: 'ninety-five。ほぼ全部を彼女一人がこなしている。',
      trap: 'ninety のあとの five が短く、90に聞こえやすい。-ty のあとに一桁が続くかを最後まで聞く。',
      use: 'She does ninety percent of the cooking.（料理の9割は彼女がしている）' },

    // R fix: V2/K6 (blind 65 %): the key was the only nuanced choice. Each target now comes with its own reason.
    // why: Leslie ← the 95% fact heard as her being taken advantage of (right mechanism, wrong target); government ←
    //   "libertarian" heard as a dig at government waste, Ron's usual target
    // anchor: 98.3–104.1 s the subject is Ron's own ("Because of my libertarian beliefs") and the conclusion is "lay me
    //   off": the flaw is his, said as a principle
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'share', seg: [97.8, 104.6],
      stem: 'In Ron’s reason for laying him off, who is the joke on?',
      choices: ['Ron, proudly owning that he barely works', 'Leslie, too eager to take on extra work',
                'Government, which pays for doing nothing'], a: 0,
      cue: '理由の文の主語と、最後の me。',
      line: 'Because of *my* libertarian beliefs, Leslie does 95% of the work. So you should lay *me* off.',
      said: '「俺の主義のおかげで、仕事の95%は Leslie がやってる。だから俺を切れ」と、胸を張って言う。',
      mean: '働かないことを信念として誇っている。笑われているのは話している本人。',
      trap: '政府ぎらいの Ron なので、市への皮肉と聞きやすい。主語の my と me を追えば、ずっと自分の話。',
      use: 'Thanks to my cooking, we eat out.（私の料理のおかげで外食が多い）' },

    // why: does more work ← "keep you" read as praise of his work (the usual script); firing would look bad ← "because
    //   of your beliefs" heard without what follows
    { id: 'i4', skill: 'infer', level: 'C1', point: 'keep', seg: [107.2, 112.4],
      stem: 'What reason is given for keeping Ron on?',
      choices: ['He would keep spending low once they leave', 'He does more of the work than he admits',
                'His beliefs would make firing him look bad'], a: 0,
      cue: '理由のあと、二つ目の文。いなくなったあとの話。',
      line: 'You would *maintain fiscal responsibility after we’re gone*.',
      said: '「その信念こそ残す理由だ。我々が去ったあとも、むだ使いさせないだろう」と返す。',
      mean: 'fiscal responsibility ＝ 財政の健全さ。節約主義を逆手に取っている。',
      trap: 'keep you をほめ言葉と取りやすい。理由は二つ目の文にある。',
      use: 'That’s exactly why we need you.（だからこそ君が必要なんだ）' },

    // R fix: V2 (blind 50 %): "quietly accepts" became "reluctantly accepts" (the 渋々 frame), so a no is no longer the
    //   only reading with any edge.
    // why: reluctantly accepts ← "strenuously" unfamiliar, so "object" is lost too, and staying sounds like a grudging
    //   yes; thanks ← the Japanese frame: keeping your job is good news, so the reply should be thanks
    // retired: B2 was 10/18 (55.6 %) with i3 retired, and its key was strictly shortest (7/17)
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'object', seg: [107.2, 115.6], retired: true,
      stem: 'How does Ron react to being told he must stay?',
      choices: ['He firmly objects to it', 'He reluctantly accepts it', 'He politely thanks them for it'], a: 0,
      cue: '返事の最後の語と、その前の長い副詞。',
      line: 'I *strenuously object*.',
      said: '残ってもらうと言われ、「断固として異議を唱える」と堅い言い方で返す。',
      mean: 'strenuously ＝ 強く、激しく。法廷のような言い方で、本気で反対している。',
      trap: '仕事が残るのは良い知らせと聞くと、感謝や渋々の了承に取りやすい。Ron には逆。',
      use: 'I object. That’s not fair.（異議あり。それはずるい）' },

    // R fix: V2 (blind 60 %): "so we lose the most" added a claim Ron doesn't make, and the others were loose. Three
    //   tight readings of "has one".
    // why: each has its own ← Ben's own view, which Ron's "they are not" denies (speaker flip); no one cutting a star ←
    //   "has one" heard as "has a cut" (scope shift)
    // anchor: 115.8–117.4 s Ben uses "a Leslie Knope" as a type (each department's star); 119.5–121.4 s Ron's "one"
    //   points back to it, and "to begin with" = in the first place
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'unique', seg: [114.0, 121.9],
      stem: 'Which plain-English version keeps Ron’s point in his reply to Ben?',
      choices: ['“She’s one of a kind; nobody else has her.”', '“Every department has its own Leslie to lose.”',
                '“No other department is cutting a star yet.”'], a: 0,
      cue: '直前の文の名前を、Ron が何で受けるか。',
      line: 'Every department’s losing *a Leslie Knope*. — No… *No other department has one* to begin with.',
      said: '「どの部署も“Leslie”を失う」に、「そもそも他にはそんな人はいない」と返す。',
      mean: 'Ben は名前を「大事な人」の意味で使い、Ron は one で受けて「唯一無二だ」と返す。',
      trap: '「どこも同じ」は Ben の言い分。one を削減の話と取ると別の意味になる。',
      use: 'There’s only one of her.（彼女の代わりはいない）' },

    // R fix: V2 (blind 55 %): "forgets what it's for" was weak. All three are now "praises X but calls Y lousy", so the
    //   learner has to hear what "lousy" attaches to.
    // why: the kids ← "lousy" heard as going with "this city's kids" (scope); calls her lousy ← the praise and the
    //   put-down both heard as about her
    { id: 'h2', skill: 'humor', level: 'C1', point: 'lousy', seg: [121.55, 127.9],
      stem: 'What is funny about how Ron describes Leslie’s current project?',
      choices: ['He praises her effort but calls the concert lousy', 'He praises the concert but calls the kids lousy',
                'He praises the concert but calls her lousy'], a: 0,
      cue: '「single-handedly」と、concert の直前の一語。',
      line: 'she’s *single-handedly* putting up some *lousy concert* for this city’s kids.',
      said: '「今、彼女は一人きりで子ども向けのしょぼいコンサートを準備している」と言う。',
      mean: '働きぶりはほめつつ、コンサートは lousy と切り捨てる。',
      trap: 'lousy は concert に付く。彼女や子どもではない。ほめているのは働きぶり。',
      use: 'She did it all single-handedly.（彼女が一人で全部やった）' },
  ]
};
