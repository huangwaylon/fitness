// REVIEW 2026-11-16: pass 6, fix 17, drop 0, new 0; ear checks 1
// OPEN: i1 kept as is. My blind 70 % came from knowing Ron hates government, not from the choices; a learner who
//   doesn't know the show should be near chance.
// “Ron Writes a Will | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Ben asks Ron to
// witness his will, finds Ron's own one-sentence will, and takes him to a lawyer, Trevor, where Ron's secrecy and
// Ben's puns get in the way.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 179 s. Untested on purpose: 6.9–10.9 s
// (who holds the folder and the bow), 36.9–40.5 s (the "weird symbols" line rests on what's on the page), 84–88 s
// ("good will hunting" is a film title; "drop" / "draw up a new will"), 89.3–90.7 s ("Mr. Wyatt" vs "yes, do I"),
// 73.8–74.7 s ("a little more (a) bad boy"), 144–146 s (bleeped), 153.3 s ("a state" in both sources for "an estate";
// no line quotes it). Ben is never named; "Wyatt" (118.4 s) and "Leslie and I" settle him. Trevor and "Mr. Swanson"
// are named in the audio.
// EAR CHECK: 176.7 s nt2 — “I was right not to be threatened by you” is Ben's, said to Trevor (no name is said;
//   Ron has left with “Good day”)
import type { Clip } from '../types.ts';

export const ronWill: Clip = {
  id: 'ronwill', video: '_YsUOCt22fU', title: 'Ron Writes a Will', dur: 200, wpm: 165, band: 'slow',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): "should" was ruled out by sense alone; all three are now negatives that fit
    // why: couldn't ← the same -n't shape, only the onset differs; can't ← same sense, and "-dn't" blurs to a short
    //   nasal
    { id: 's1', skill: 'sound', level: 'B2', point: 'shouldnt', seg: [0.9, 4.5],
      stem: 'Fill the gap: “I am pretty sure you ___ have a weapon at work.”',
      choices: ['shouldn’t', 'couldn’t', 'can’t'], a: 0,
      cue: '「you」のすぐあと、短く弱い語。',
      line: 'I am pretty sure you *shouldn’t* have a weapon at work.',
      said: '弓を持つロンに「職場に武器はまずいと思うよ」と言う。',
      mean: 'shouldn’t の t はほぼ消え、「シュドゥン」のように聞こえる。',
      trap: 'couldn’t も can’t も意味は通るので、意味では選べない。最初の「シュ」の音を聞き分ける。',
      use: 'You shouldn’t park here.（ここに停めちゃだめだよ）' },

    // why: help write it ← "putting together our will" heard as still in progress; meet their lawyer ← "our lawyer"
    //   comes up later
    { id: 'd1', skill: 'detail', level: 'B1', point: 'witness', seg: [12.35, 18.3],
      stem: 'What does Ben come to ask Ron to do?',
      choices: ['Witness the will he and Leslie wrote', 'Help him and Leslie write their will',
                'Meet the lawyer who wrote their will'], a: 0,
      cue: '「she wants you to be」のあと。',
      line: 'she wants you to be *the witness*. You mind signing it?',
      said: 'レスリーと遺言書を作ったので、証人としてサインしてほしいと頼む。',
      mean: 'witness ＝ 証人。書いたのは二人で、ロンはサインするだけ。',
      trap: 'putting together から「手伝い」と取りやすい。just finished ＝ もう書き終えた。',
      use: 'Would you be a witness for us?（証人になってもらえる？）' },

    // R fix: the "?" moved outside the stars, so the starred words equal the answer
    { id: 'x1', skill: 'dict', level: 'B1', point: 'witness', seg: [16.75, 19.5],
      stem: 'Type Ben’s short question right after “the witness”. (4 words)', answer: 'you mind signing it',
      cue: '「witness」のすぐあと。最初の Do は言っていない。',
      line: '…the witness. *You mind signing it*?',
      said: '「サインしてもらえる？」と軽く頼んでいる。',
      mean: 'Do you mind の Do を省いたくだけた形。signing it は「サイニンギッ」とつながる。',
      trap: '文法どおり Do を足したくなるが、言っていない。it の t も消えるので語数で確かめる。',
      use: 'You mind closing the window?（窓、閉めてもらえる？）' },

    // R fix: V2 (blind 50 %): "not signed by Leslie" was weak; it's now a content complaint built on "to my wife"
    // why: nothing for the kids ← "give my stuff to my wife" heard as leaving others out; too much to the wife ← the
    //   same words heard as Ron objecting to what it says
    { id: 'd4', skill: 'detail', level: 'B1', point: 'pages', seg: [18.35, 22.45],
      stem: 'What does Ron find wrong with Ben’s will?',
      choices: ['It is far too long for what it says', 'It leaves nothing to Ben’s children',
                'It gives too much away to his wife'], a: 0,
      cue: '「That’s your will?」のあとの質問。',
      line: 'You need *that many pages* to say give my stuff to my wife?',
      said: '「妻に財産をやる、と言うだけにそんなにページが要るのか」とあきれる。',
      mean: '中身は一言で済むのに長すぎる、という批判を質問の形で言っている。',
      trap: 'give my stuff to my wife から中身への不満と取りやすいが、問題にしているのは長さ。',
      use: 'You need ten pages to say no?（ノーと言うのに10ページも要る？）' },

    // why: eighteen ← -teen/-ty, and "eight" runs into "years"; twenty-eight ← "the same will since…" heard as since
    //   he was an adult
    { id: 'n1', skill: 'number', level: 'B1', point: 'eight', seg: [25.18, 29.4], keep: true,
      stem: 'Since what age has Ron had the same will?',
      choices: ['eight', 'eighteen', 'twenty-eight'], a: 0,
      cue: '「since I was」のあとの数。',
      line: 'I’ve had the same will *since I was eight* years old.',
      said: '「8歳のときから同じ遺言書を持っている」と言う。',
      mean: '子どもの頃に書いたものを今も使っている。ロンらしい頑固さ。',
      trap: 'eight years が続くと eighteen に聞こえやすい。-teen なら「ティーン」と長く強く伸びる。',
      use: 'I’ve lived here since I was eight.（8歳からここに住んでる）' },

    // R fix: V2 (blind 60 %): the key was the only odd, Ron-like choice; "the state" is now a second odd heir
    // why: his family ← the usual will, and "a wife and kids" is said soon after; whoever finds his body ← "upon my
    //   death… who has killed me" heard as being about his death scene, not who caused it
    { id: 'd2', skill: 'detail', level: 'B2', point: 'killer', seg: [30.94, 36.7],
      stem: 'Under Ron’s will, who gets his belongings when he dies?',
      choices: ['The person or animal that kills him', 'His wife and the children they have',
                'Whoever happens to find his body'], a: 0,
      cue: '「shall transfer to」のあと。',
      line: 'all of my belongings shall transfer to *the man or animal who has killed me*.',
      said: '「死んだら、全財産は自分を殺した人間か動物に渡る」と書いてある。',
      mean: '家族ではなく「自分を倒した者」に譲る、という一文だけの遺言。',
      trap: '遺言なら家族、という型で選びやすい。killed me まで聞くと、受け取るのは殺した相手。',
      use: 'All my stuff goes to my sister.（持ち物は全部妹に）' },

    // R fix: V2 (blind 70 %): "hidden money" was off-topic; it's now "notarize the one-liner", built on Ben's own
    //   "not even notarized"
    // why: witness ← that was Ben's first request, before Ron's will came out; notarize it ← "It's not even
    //   notarized" heard as the whole fix, missing "more than one sentence long"
    { id: 'g1', skill: 'gist', level: 'B1', point: 'push', seg: [41, 66],
      stem: 'After reading Ron’s will, what does Ben push him to do?',
      choices: ['Get a proper will drawn up', 'Get his one-line will notarized', 'Witness Ben and Leslie’s will'],
      a: 0,
      cue: '「you should really have」のあと。',
      line: 'you should really have *a will that’s more than one sentence long*.',
      said: '「一文より長い遺言書を持つべきだ。うちの弁護士を紹介するよ」と勧める。',
      mean: '場面全体の目的は、ロンにちゃんとした遺言書を作らせること。',
      trap: '最初は証人を頼みに来たが、話はロンの遺言に移っている。目的は話の流れで判断。',
      use: 'You should really see a doctor.（本当に医者に診てもらったほうがいい）' },

    // R fix: V2/K5 (blind 55 %): choices made parallel ("X, he'll…"), so the key's form no longer stands out
    // why: pass it on ← pass = 渡す, the literal reading with a document in the scene; go along ← "pass" as in
    //   passing a test (合格 = OK)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'pass', seg: [46.95, 55.15],
      stem: 'What does Ron mean by the one word after his list of jobs?',
      choices: ['No thanks, he won’t meet the lawyer', 'Sure, he’ll pass his will to the lawyer',
                'Fine, he’ll go along and meet him'], a: 0,
      cue: '職業を3つ並べたあとの一語。',
      line: 'lawyer, congressman, and doctor. *Pass*.',
      said: '「世界で役に立たない仕事は、順に弁護士、議員、医者。パス」と答える。',
      mean: 'Pass ＝ 遠慮しておく、断る。弁護士を紹介する話を断っている。',
      trap: 'pass を「渡す」や「合格」と取りやすい。誘いへの返事の Pass は「やめとく」。',
      use: 'Karaoke tonight? I’ll pass.（今夜カラオケ？私はパス）' },

    // why: wife and kids ← Ben's earlier reason, heard as the one that works; not notarized ← the legal fault is
    //   named first in the same turn
    { id: 'i1', skill: 'infer', level: 'B2', point: 'govt', reveals: ['speakof'], seg: [55.1, 66],
      stem: 'What finally makes Ron ask where the lawyer is?',
      choices: ['The idea of the government getting his things', 'The reminder that he has a wife and kids now',
                'The news that his will is not notarized'], a: 0,
      cue: '質問の直前、ベンの文の最後の語。',
      line: 'most of what you own will go to *the government*. — Where’s this lawyer you speak of?',
      said: '「遺言がないと財産の大半は政府に行く」と聞き、すぐ弁護士の居場所を聞く。',
      mean: '家族の話では動かなかったロンが、政府に取られると聞いて急に乗り気になる。',
      trap: 'notarized も同じ流れで出るが、ロンが反応したのは最後の government の直後。',
      use: 'Okay, where do I sign?（よし、どこにサインすればいい？）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'speakof', seg: [63.5, 66.1],
      stem: 'Type the end of Ron’s question: “Where’s this lawyer ___?” (3 words)', answer: 'you speak of',
      cue: '「lawyer」のすぐあと、文の終わり。',
      line: 'Where’s this lawyer *you speak of*?',
      said: '「その、君の言う弁護士とやらはどこだ」と聞く。',
      mean: 'you speak of ＝ 君が話していた。少し古風で大げさな言い方が、ロンの口調らしい。',
      trap: 'of は弱く、speak に吸収されやすい。文末の小さな前置詞まで書く。',
      use: 'Is this the café you spoke of?（これが話してたカフェ？）' },

    // R fix: V2 (blind 50 %): "nervous about the lawyer" was weak; it's now a worry about Ben
    // why: worried Ben will embarrass him ← "let me do the talking… bad boy" heard as Ron dreading the meeting;
    //   curious how long ← "When will this be over?" taken as a real question about time
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'over', seg: [66, 78.75],
      stem: 'How does Ron feel when he answers Ben’s talk about accountants?',
      choices: ['Tired of listening to Ben', 'Worried Ben will embarrass him', 'Curious how long it will take'], a: 0,
      cue: 'ベンの長い話のすぐあと、短い質問。',
      line: 'there’s a respect there. — *When will this be over?*',
      said: 'ベンが「会計士の方がちょっとワル」と語り続けたあと、ロンは「いつ終わるんだ」と言う。',
      mean: '時間を聞いているのではなく、「もううんざりだ」という気持ち。',
      trap: 'When will… を本当の質問と取りやすい。長話の直後の短い質問は、退屈のサインが多い。',
      use: 'How much longer is this going to take?（あとどれくらいかかるの？）' },

    // R fix: V2 (blind 65 %): "stop calling him" was weak; it's now the reading that misses "before"
    // why: worked with Ron ← "As I've said before" heard as about Ron, who is the client; first meeting ← the formal
    //   "Mr. Wyatt… Thank you" heard as strangers, with "before" lost
    { id: 'i2', skill: 'infer', level: 'C1', point: 'puns', seg: [79.9, 92.75],
      stem: 'What does Trevor’s reply to Ben’s “good… will hunting” tell us?',
      choices: ['Ben has tried this kind of joke on him before', 'Trevor has already worked with Ron before',
                'Trevor and Ben are meeting for the first time'], a: 0,
      cue: '「As I’ve said」で始まる文。',
      line: '*As I’ve said before*, I just don’t like *puns*.',
      said: 'ベンが will のしゃれを言うと、弁護士は「前にも言ったが、しゃれは嫌いだ」と返す。',
      mean: '前にも言った ＝ ベンはいつもこの手の冗談を言う、と分かる。',
      trap: 'before をロンの話と結びつけやすい。何を前に言ったか、文の後半で確かめる。',
      use: 'As I said before, I can’t make it.（前にも言ったけど、行けないんだ）' },

    // R fix: V2 (blind 55 %): "praises Trevor" was weak; it's now a second refusal with the modesty reason
    // why: nothing to list ← the refusal heard as ���遜 (a small sum kept private); fills it in after all ← a joking
    //   start, then cooperation, is the usual script
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'nicetry', seg: [99.75, 103.7],
      stem: 'When Trevor asks him to list his assets, how does Ron respond?',
      choices: ['He refuses, as if it were a trick', 'He refuses, since he has nothing to list',
                'He jokes, then starts to fill it in'], a: 0,
      cue: '最初の短い二語と、そのあとの文。',
      line: '*Nice try*. I’m not telling you how much money I have',
      said: '財産を書く用紙を出され、「そうはいかない。いくらあるかは言わない」と言う。',
      mean: 'Nice try ＝ その手には乗らない。頼みを、探りのわなのように扱う。',
      trap: 'nice try を文字通り「いい試み」と取りやすい。断りの前の Nice try は皮肉。',
      use: 'Nice try, but I’m not paying.（その手には乗らないよ、払わない）' },

    // anchor: 101.5–109.2 s "I'm not telling you how much money I have, where it's hidden, or which precious metals
    //   and/or gemstones it may or may not take the form of": the refusal itself names hidden metals and gems;
    //   146–156.6 s the lawyer's "Holy…" and "your children would never have to work a day" confirm it
    // R fix: V2 (blind 70 %): all three now say "he has … wealth", so "fortune" and the clip words no longer single
    //   out the key; the bank choice is now the "where it's hidden" → "where it is" near miss
    // why: little wealth ← the refusal heard as modesty or embarrassment (遠慮, 謙遜: a small sum kept private); in a
    //   bank he won't name ← "where it's hidden" heard as "where it is", so the secret is only which bank
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'hidden', seg: [99.75, 109.55],
      stem: 'In refusing to list his assets, what does Ron actually give away?',
      choices: ['That he has hidden wealth, maybe in metals or gems', 'That he has little wealth, and is shy about it',
                'That he has wealth, but in a bank he won’t name'], a: 0,
      cue: '「I’m not telling you」に続く、言わない物のリスト。',
      line: 'I’m not telling you… *where it’s hidden, or which precious metals and/or gemstones*…',
      said: '「いくら持っているか、どこに隠しているか、どんな貴金属や宝石かは言わない」と断る。',
      mean: '言わないと言いつつ、隠し場所や金・宝石があることを自分で並べている。断り方が答えになっている。',
      trap: '言いたがらない＝少ない、と謙遜のように取りやすい。言わない物のリストの中身を聞く。',
      use: 'I won’t say where I hid the cookies.（クッキーを隠した場所は言わないよ）' },

    // R fix: V2 (blind 50 %): "wait by the door" was weak; it's now the coat-check idiom with real objects
    // why: look over the accounts ← check = 確認する, and "accountant" heard as "accounts" (the captions even have
    //   "account and"); papers outside ← "check… at the door" right, but "crap" taken as actual stuff
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'checkdoor', seg: [116.7, 120.38],
      stem: 'What does Trevor tell Ben to do, in plain words?',
      choices: ['Leave his accountant act outside', 'Leave his accounting papers outside',
                'Check the accounts by the door'], a: 0,
      cue: '「one last time」のあとの命令。',
      line: '*Check the accountant crap at the door*.',
      said: '「最後に言う。会計士のノリは入口で置いてこい」と言う。',
      mean: 'check ～ at the door ＝ 入口で預ける。ここでは「その話はここに持ちこむな」。',
      trap: 'check を「確認する」と取ると別の意味になる。コートを預ける check と同じ。',
      use: 'Check your ego at the door.（プライドは置いてきて）' },

    // R fix: V2 (blind 70 %): the key was the only "his words sounded like…" choice; one distractor now is too
    // why: "Yes, sir" as mockery ← right mechanism (his words misheard), wrong words; made Trevor angry ←
    //   "Unintentional" read as about Trevor's scolding
    { id: 'h2', skill: 'humor', level: 'C1', point: 'unintent', seg: [116.7, 123.95],
      stem: 'Why does Ben add “Unintentional” after answering Trevor?',
      choices: ['His “I will” sounded like one more pun', 'His “Yes, sir” sounded like mockery',
                'He didn’t mean to make Trevor angry'], a: 0,
      cue: '「Yes, sir」のあとの2語と、何の話をしていたか。',
      line: 'Yes, sir. *I will*. — Unintentional.',
      said: '「はい、そうします（I will）」と答え、「わざとじゃない」と足す。',
      mean: '遺言（will）の話の最中の I will が、またしゃれに聞こえた。その言い訳。',
      trap: '「怒らせるつもりはなかった」と取りやすい。直前の自分の言葉と、話題の will を結ぶ。',
      use: 'No pun intended.（しゃれのつもりじゃないよ）' },

    // R fix: S1/V2 (blind 70 %): "instead of an exact number" in the stem gave the key away; the stem is neutral and
    //   the choices are parallel tasks
    // why: where it's kept ← "ballpark" heard as a place (球場), and "where it's hidden" was just refused; the
    //   biggest items ← "not an exact number" heard as "skip the small stuff"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'ballpark', seg: [123.65, 127.6],
      stem: 'To get started, what does Trevor ask Ron to do?',
      choices: ['Give a rough guess at the total', 'Say roughly where it is kept', 'List only the biggest items'], a: 0,
      cue: '「exact number」のあとの短い言い方。',
      line: 'I don’t even need an exact number. Just *ballpark it*.',
      said: '「正確な数字じゃなくていい。だいたいでいい」と言う。',
      mean: 'ballpark ＝ だいたいの数を言う。',
      trap: 'ballpark を「球場」と取ると場所の話になる。exact number と対になっていることに注目。',
      use: 'Can you give me a ballpark figure?（だいたいの金額を教えてもらえる？）' },

    // R fix: V2 (blind 55 %): "complain about taxes" was off-target; it's now a moral push aimed at Ron
    // why: a good cause ← "build a library" heard as a nice use of money; shame him ← "use your money" heard as a
    //   dig at Ron sitting on it
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'library', reveals: ['govt'], seg: [127.62, 134.5],
      stem: 'Why does Ben bring up bureaucrats and a library?',
      choices: ['To scare Ron into giving a number', 'To suggest a good cause for the money',
                'To shame Ron for hoarding his money'], a: 0,
      cue: '「state government」の文と、ロンの返事。',
      line: 'the state government would love to use your money to *hire more bureaucrats, maybe build a library*. — *Fine*.',
      said: '「州政府があなたのお金で役人を増やし、図書館でも建てる」と言うと、ロンは折れる。',
      mean: 'ロンが嫌がる使い道をわざと並べて、数字を言わせている。図書館も、ロンには脅し。',
      trap: '図書館は良い使い道に聞こえる。誰に向けた言葉か、相手の嫌いな物を考えて聞く。',
      use: 'Fine, you win.（分かった、君の勝ち）' },

    // R fix: V2 (blind 50 %): only the key named the old will; "refuses" now keeps it too, and storms out
    // why: trusts for his kids ← "trusts" and "children" are the lawyer's plan, heard as agreed; storms out with it ←
    //   "That's enough… Good day" heard as leaving with nothing done
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [133.1, 172.3],
      stem: 'How does the meeting with Trevor end up?',
      choices: ['Ron hands over his old will to make it official', 'Ron agrees to set up trusts for his children',
                'Ron storms out and keeps his old will as it is'], a: 0,
      cue: '最後のロンの長い一言。',
      said: 'ロンは手続きの話をさえぎり、昔の遺言書を渡して「正式にすればサインする」と言う。',
      mean: '結局、中身は一文の遺言のまま。弁護士は形だけ整える役になった。',
      trap: 'trusts や children は弁護士の提案で、ロンは途中で打ち切る。最後の指示が結末。',
      use: 'Just make it official.（正式な形にしておいて）' },

    // R fix: V2 (blind 65 %): "never jokes during work" was weak; it's now "doesn't find Trevor funny"
    // why: insulted ← "I do not lie" heard as offence taken; not funny ← "I do not joke" heard as being about
    //   humour (笑えない), not truth
    { id: 'i3', skill: 'infer', level: 'C1', point: 'joke', seg: [143.8, 152],
      stem: 'When Trevor asks “Is this a joke?”, what is Ron really telling him?',
      choices: ['The number he wrote is real', 'He is insulted to be doubted', 'He doesn’t find Trevor funny'], a: 0,
      cue: '「therefore」の前後の理屈。',
      line: 'Another word for jokes is lies. I do not lie, *therefore I do not joke*.',
      said: '「冗談の別名はうそ。私はうそをつかない。ゆえに冗談も言わない」と答える。',
      mean: '理屈っぽい言い方で、「その数字は本物だ」と言っている。',
      trap: 'I do not lie を怒りと取りやすい。問いは「冗談か？」。その答えなら「本当だ」になる。',
      use: 'I’m not joking. It’s true.（冗談じゃない、本当だよ）' },

    // R fix: V2 (blind 55 %): "wait years" was weak; it's now the "never" near miss
    // why: huge taxes ← "tax shelters" comes right after; have to work ← the weak "never" lost, leaving "have to
    //   work a day"
    { id: 'd3', skill: 'detail', level: 'B2', point: 'children', reveals: ['hidden'], seg: [151.95, 157.1],
      stem: 'What does Trevor say the size of Ron’s estate means?',
      choices: ['His kids would never need a job', 'His kids would have to work for it', 'His kids would pay huge taxes'],
      a: 0,
      cue: '「your children would」のあと。',
      line: 'your children would *never have to work a day in their lives*.',
      said: '「この規模なら、子どもたちは一生働かなくていい」と言う。',
      mean: '一生働く必要がない ＝ 財産がとても大きい。',
      trap: 'never を聞き落とすと逆の意味になる。すぐあとの tax shelters にも引かれやすい。',
      use: 'She’s never worked a day in her life.（彼女は一日も働いたことがない）' },

    // anchor: 168.5–170.9 s both sources have "you have to to make it official": two "to"s back to back, at ≈ 250 wpm
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'haveto', seg: [167.15, 170.86],
      stem: 'Type the words: “Do whatever lawyer nonsense ___ make it official.” (4 words)', answer: 'you have to to',
      cue: '「nonsense」のあと。文法より、聞こえた音を。',
      line: 'Do whatever lawyer nonsense *you have to to* make it official',
      said: '「正式にするのに要る弁護士のあれこれは何でもやれ」と言う。to が2回続く。',
      mean: 'have to の to と、目的の to make の to が並ぶ。どちらも文法上必要で、省けない。',
      trap: '同じ音が続くと1つに聞こえ、to を1回だけ書きやすい。意味から2つ要ると確かめる。',
      use: 'Do what you have to to get there.（着くためにやるべきことをやって）' },

    // anchor: 176.7–178.8 s "I was right not to be threatened by you": you only say you were right not to feel
    //   threatened if you'd wondered; it comes as Trevor is stuck on Ron's symbols, after Trevor's "Check the
    //   accountant crap at the door, Wyatt" (118–120 s)
    // why: lawyers are useless ← Ron's list (49–54 s) heard as what Ben now agrees with (right target, wrong claim);
    //   sorry for the puns ← the Japanese frame: after being told off, a closing line read as making peace
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'threat', seg: [172.7, 179.5],
      stem: 'With his last line to Trevor, what is Ben trying not to say?',
      choices: ['That Trevor had in fact made him feel small', 'That he agrees lawyers are useless, like Ron',
                'That he is sorry for his puns about wills'], a: 0,
      cue: '「I was right not to」のあとの語と、言うタイミング。',
      line: 'Wait, what are all these symbols? — *I was right not to be threatened by you*.',
      said: '弁護士が記号に困るのを見て、ベンが「君を脅威に感じなくて正解だった」と言う。',
      mean: 'わざわざ「感じなくて正解」と言うのは、実は感じていた証拠。弁護士が困った今になって強がっている。',
      trap: '言葉どおり「最初から平気」と取りやすい。否定をわざわざ口にする時は、その逆を気にしていたことが多い。',
      use: 'I was never worried. Not even a little.（全然心配してなかったよ、少しも）' },
  ]
};
