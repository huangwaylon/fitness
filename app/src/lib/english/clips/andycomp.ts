// “The Case of Andy's Missing Computer | Parks and Recreation” (the official Parks and Recreation channel, Season 5):
// Andy, studying for the police exam, takes his missing computer for the practice theft he asked the office to stage;
// he grills Gary and Chris, a second theft shows it's real, and a police officer deflates him with a report form.
// Segments from the captions, words from whisper (2026-11-16). Named: Andy, Gary ("Jerry"), Chris. The speakers at
// 112–125 s and 139–145 s and the last line aren't named, so stems don't name them.
// Untested on purpose: 14.6 s ("A game is the foot": the joke needs the original saying), 30–37 s (who lost glasses,
// who was in Miami), 37.7 s ("took my talents to South Beach": a sports reference), 82.7–84.7 s (the "No… Okay… Yeah"
// exchange), 110 s ("as guilty as you are sexy"), 132.4–138.6 s (the explosives plan), 147–152.6 s.
// EAR CHECK: 142.3 s r1 — the cut falls after "enthusiasm" and before "but" (captions 142.4, whisper 142.5); moved from 142.15, which may clip "enthusiasm"
// EAR CHECK: 129.6 s c2 — both sources have "We gonna set up", but ASR rarely keeps a weak 're: is there no "we're"/"are"?
// REVIEW 2026-11-16: pass 8, fix 18, drop 0, new 0; ear checks 2
// Open: c2 ships only if the ear confirms no "'re"; if one is there, change the answer to "we're gonna set up" and drop the C2 framing.
import type { Clip } from '../types.ts';

export const andyComputer: Clip = {
  id: 'andycomp', video: 'er2IUxCT30U', title: 'The Case of Andy\'s Missing Computer', dur: 191, wpm: 145,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, "a newer computer" was a filler; now practice vs the real exam. S4: the end cut "Let's do this"
    // why: needs a cop ← "police academy" + "investigating a crime" heard as his case for a cop; the real exam ←
    //   "entrance exam is investigating a crime" heard without "so I could practice"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'practice', reveals: ['steal'], seg: [4.3, 29.6],
      stem: 'Why does Andy seem pleased that his computer is gone?',
      choices: ['He thinks it’s the practice crime he set up', 'He thinks it proves the office needs a cop',
                'He thinks it’s a part of his entrance exam'], a: 0,
      cue: 'police academy の話のあと、皆に頼んでいたこと。',
      line: 'I told everyone… they should *steal something from my desk so I could practice*.',
      said: '警察学校の試験には捜査がある。だから前に、机から何か盗んでくれと皆に頼んでいた。',
      mean: 'なくなったのは練習用の「事件」だと思い、張り切っている。',
      trap: 'Aha! や Let’s do this は困った声ではなく、待っていた合図。不満と取らない。',
      use: 'Okay, let’s do this.（よし、やるぞ）' },

    // R fix: V2/S1, "explanation" in the stem gave the key; the stem now names the moment, and a "See?" = ね？ distractor
    //   replaces "surprised"
    // why: look ← see = 見る, and the empty desk is on screen; agree ← "See?" read as a tag (ね？) asking for agreement
    { id: 'm1', skill: 'marker', level: 'B2', point: 'see', seg: [14, 22.1],
      stem: 'What does the short word before “part of the police academy” do?',
      choices: ['Leads into why he’s so excited', 'Tells us to look at his empty desk',
                'Asks the others to agree with him'], a: 0,
      cue: '説明の文の、最初の短い一語。',
      line: '*See*, part of the police academy entrance exam is investigating a crime.',
      said: '「ほら、警察学校の入学試験には、事件の捜査があってね」と説明を始める。',
      mean: 'See, は「つまりね」と説明を始める合図。見て、の意味ではない。',
      trap: 'see を「見る」や「ね？」と取りやすい。文頭でひと息置いて説明が続けば、前置き。',
      use: 'See, the thing is, I’m new here.（というのも、ここは初めてで）' },

    // why: a week ← "weekend" comes up soon after; a year ← the short vowel of "month" blurred after "about a"
    // R fix: S4, the segment started inside "crime"
    { id: 'd1', skill: 'number', level: 'B1', point: 'month', reveals: ['steal'], seg: [21.35, 27.6],
      stem: 'When did Andy ask the office to steal from him?',
      choices: ['About a week ago', 'About a month ago', 'About a year ago'], a: 1, keep: true,
      cue: 'So のすぐあと、期間を表す語。',
      line: 'So *about a month ago*, I told everyone in the office…',
      said: '「1か月くらい前、オフィスの皆に頼んだ」と話す。',
      mean: 'about a month ago ＝ 1か月ほど前。だから今日盗まれても練習と思える。',
      trap: 'month の th は弱く聞き取りにくい。短い母音「ア」で week や year と分ける。',
      use: 'I booked it about a month ago.（1か月くらい前に予約しました）' },

    // why: report ← "investigating a crime" heard as the office's job; keep an eye ← "from my desk" + practice heard as
    //   guarding it
    // R fix: S4, the segment started inside "crime" and ended inside "Let's do this"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'steal', seg: [21.35, 27.9],
      stem: 'What had Andy asked everyone in the office to do?',
      choices: ['Steal something from his desk', 'Report anything stolen to him', 'Keep an eye on his desk'], a: 0,
      cue: 'at some point のあと、何をするべきか。',
      line: 'they should *steal something from my desk* so I could practice.',
      said: '「いつか机から何か盗んでくれ、練習できるから」と頼んでおいた。',
      mean: '捜査の練習のため、自分の物をわざと盗ませる約束。',
      trap: 'investigating（捜査）が先に聞こえるので「報告」と取りやすい。should のあとの動詞を聞く。',
      use: 'Feel free to borrow something from my desk.（机の物、自由に借りてね）' },

    // R fix: V2, "covering for someone" was a filler; now "took it as a prank", since Andy asked the office to steal.
    //   S4: start after "South Beach"
    // why: owning up ← "Yes, I took your…" taken at face value, as Andy does; a prank ← Andy asked the office to steal
    //   from him, so "I took it" sounds like the practice theft
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'confess', reveals: ['bucks'], seg: [40, 53.5],
      stem: 'When Gary answers the Miami question, is he serious?',
      choices: ['No; he’s mocking the question', 'Yes; he’s owning up at last', 'Half; he took it as a prank'], a: 0,
      cue: '答えに並ぶ、細かすぎる話。',
      line: '*Yes, I took your government computer* from Indiana to Miami to sell it on the black market for 150 bucks.',
      said: '「ああ、役所のパソコンをマイアミまで運んで、闇市場で150ドルで売ったよ」と答える。',
      mean: '疑いがばかげているので、もっとばかげた「自白」で返す皮肉。本気ではない。',
      trap: 'Yes で始まると自白に聞こえる。話が大げさで細かすぎるときは、からかいの合図。',
      use: 'Yes, I’m secretly a spy. Happy now?（そう、実はスパイ。満足？）' },

    // why: "So you admit it" ← the sincere reading (Andy's own: "you just gave yourself away"); "Since when?" ← "Miami"
    //   heard as news, though Andy raised it himself
    // anchor: 43.8–52.5 s the "confession" piles absurd detail (Indiana to Miami, the black market, 150 bucks) onto a
    //   question about a weekend trip; 80.7 s "It wasn't me"
    // R fix: S4, start after "South Beach"
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'confess', reveals: ['bucks'], seg: [40, 53.5],
      stem: 'Which reply from Andy would show he caught what Gary meant?',
      choices: ['Okay, okay. Bad question.', 'Ha! So you admit it, then.', 'Wait, Miami? Since when?'], a: 0,
      cue: '答えの大げささと、質問の中身の差。',
      line: '*Yes, I took your government computer* from Indiana to Miami to sell it on the black market for 150 bucks.',
      said: '「マイアミで盗品を売った？」と聞かれ、「ああ、闇市場で150ドルで売ったよ」と返される。',
      mean: 'ばかげた疑いに、さらにばかげた自白で返す皮肉。分かったなら「悪い質問だった」と引くのが自然。',
      trap: 'Yes の形に返すと、本気の自白と受け取ったことになる。返事は言葉の形でなく、相手のしたことに返す。',
      use: 'Okay, fair. Dumb question.（そうだね、ばかな質問だった）' },

    // why: $115 ← fifty/fifteen; $50 ← the "one" lost before "fifty"
    { id: 'd3', skill: 'number', level: 'B1', point: 'bucks', seg: [43.3, 53.5],
      stem: 'For how much does Gary say he sold the computer?',
      choices: ['$50', '$115', '$150'], a: 2, keep: true,
      cue: 'black market のあと、bucks の前の数。',
      line: 'to sell it on the black market for *150 bucks*.',
      said: '「闇市場で150ドルで売った」と言う。もちろん冗談。',
      mean: 'bucks ＝ ドルのくだけた言い方。150 は one fifty とも言う。',
      trap: 'fifty と fifteen は強く言う位置で分かれる。-ty は前、-teen は後ろが強い。',
      use: 'I got it for twenty bucks.（20ドルで買ったよ）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'giveaway', seg: [53.5, 57.7],
      stem: 'Type what Andy says: “You don’t know it, but you just ___.” (3 words)', answer: 'gave yourself away',
      cue: 'but you just のあと、3語。',
      line: 'You don’t know it, but you just *gave yourself away*.',
      said: '「気づいてないだろうが、今ボロを出したな」と言う。',
      mean: 'give yourself away ＝ うっかり正体をばらす。gave yourself は「ゲイヴョセル」。',
      trap: 'yourself と away がつながり、一語に聞こえやすい。3語を数える。',
      use: 'Your smile gave you away.（笑顔でバレバレだよ）' },

    // why: Jerry again ← Gary/Jerry near sound; apologizes ← "Well" heard as the start of a sorry
    { id: 'h1', skill: 'humor', level: 'C1', point: 'realname', seg: [58, 70.8],
      stem: 'After Gary corrects his name, why is Andy’s next line funny?',
      choices: ['He doubts the new name with the same line', 'He goes right back to calling him Jerry',
                'He apologizes, then gets the name wrong'], a: 0,
      cue: 'Well のあとの名前と、それに続く言葉。',
      line: '*Jerry*, if that even is your real name. — It’s not. My real name is *Gary*. — Well, Gary, *if that even is your real name*…',
      said: '「ジェリー、本名ならな」「違う、ゲイリーだ」「じゃあゲイリー、本名ならな」。',
      mean: '刑事ドラマの決まり文句が偶然当たったのに、正された名前にも同じ文句を使う。',
      trap: 'Gary と Jerry は似た音。最初の g と j の音で分かれる。',
      use: 'Sorry, is it Gary or Jerry?（ゲイリーとジェリー、どっちだっけ？）' },

    // R fix: V2, two real legal rights next to the absurd claim made the key the sitcom answer; now an "entrapment"
    //   keyword trap
    // why: stay quiet ← "legally" heard as a suspect's real right; can't be tricked ← "entrapment" caught as the rule
    //   itself
    { id: 'd6', skill: 'detail', level: 'B2', point: 'legally', seg: [70.6, 78.7],
      stem: 'What does Andy claim the law says?',
      choices: ['A criminal must tell him if asked', 'A criminal can stay quiet until charged',
                'A criminal can’t be tricked into confessing'], a: 0,
      cue: 'look at me のあと、have to に続く部分。',
      line: 'You *have to tell me legally*, or else it’s considered entrapment.',
      said: '「法律上、僕に言わなきゃいけない。でなきゃおとり捜査だ」と言う。',
      mean: '犯人には白状する義務がある、と思い込んでいる。決まりが逆さま。',
      trap: 'entrapment が耳に残り、それが決まりだと取りやすい。have to のあとの tell が主張。',
      use: 'Tell me if it’s too spicy.（辛すぎたら言ってね）' },

    // why: admits ← "sorry" heard as the opener of a confession (すみません、私が); stop ← sorry as "excuse me, enough"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'sorry', reveals: ['letdown'], seg: [78.7, 83.4],
      stem: 'What does Gary’s “I’m sorry, Andy” do here?',
      choices: ['Softens a no that Andy won’t like', 'Admits that he’s the one who took it',
                'Asks Andy to stop the questioning'], a: 0,
      cue: 'I’m sorry のあとに続く短い文。',
      line: '*I’m sorry*, Andy. *It wasn’t me.* — Oh, man. Really?',
      said: '「ごめん、アンディ。僕じゃない」と言うと、アンディは「えー、本当？」と返す。',
      mean: '犯人を見つけたいアンディには、無実は悪い知らせ。sorry はそれを和らげている。',
      trap: '日本語の「すみません」は自白の前置きにもなるが、ここはすぐ「僕じゃない」と続く。',
      use: 'Sorry, we’re all sold out.（すみません、売り切れです）' },

    // R fix: V2, distractors reworded so the key isn't the only feeling tied to a reason
    // why: relieved ← the usual reaction to a friend's innocence; doubtful ← "Really?" heard as doubt
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'letdown', seg: [78.7, 83.4],
      stem: 'How does Andy take Gary’s answer?',
      choices: ['Let down that Gary isn���t the thief', 'Relieved that his friend is in the clear',
                'Doubtful, as if Gary might be lying'], a: 0,
      cue: 'Oh, man のため息のような言い方。',
      line: 'It wasn’t me. — *Oh, man. Really?*',
      said: '「僕じゃない」と言われ、「あーあ、本当に？」と返す。',
      mean: 'Oh, man ＝ がっかりした声。捕まえる練習がしたいので、無実はうれしくない。',
      trap: 'Really? は疑いにも聞こえるが、Oh, man と並べば落胆。友人の無実を喜ぶ、という型で選ばない。',
      use: 'Oh, man. Really? It’s closed?（えー、本当？閉まってるの？）' },

    // R fix: V2/K6, the key was the only nuanced choice; each distractor now has its own reason. S4: start after "yeah"
    // why: Gary ← "unless he was lying to me" puts Gary in the frame just before; police work ← "lying" + "police work"
    //   heard as a jab at the job
    // anchor: 89.2–94.0 s the subject is "I" and "my" throughout ("I can never tell…", "my police work"): the flaw is
    //   his own, and it's the core skill of the job he wants
    // retired: the bank was 26, over 24; still near 50 % on the review's own read (c1, c2 remain)
    { id: 'c3', skill: 'humor', level: 'C2', point: 'lying', reveals: ['comeup'], seg: [84.85, 94.8], retired: true,
      stem: 'In Andy’s comment about lying, who is the joke on?',
      choices: ['Andy himself, though he doesn’t see it', 'Gary, who may have fooled him after all',
                'Police work, for being so full of liars'], a: 0,
      cue: '文の主語と、彼がなりたい仕事。',
      line: 'I can never tell when people are lying to me. *Hopefully that doesn’t come up in my police work.*',
      said: '「人のうそが全然見抜けない。警察の仕事で困らないといいけど」と、さらりと言う。',
      mean: 'うそを見抜くのは警察の基本。その弱点を「出てこないといいな」で片づける。笑われているのは本人。',
      trap: '直前にゲイリーのうその話があるので、彼が的に聞こえやすい。主語の I と my を追えば自分の話。',
      use: 'I hate blood. Hopefully that’s fine for nursing.（血が苦手。看護師で大丈夫だといいけど）' },

    // R fix: the answer's straight apostrophe didn't match the line's starred words
    { id: 'x1', skill: 'dict', level: 'B2', point: 'comeup', seg: [91.9, 94.8],
      stem: 'Type what Andy says: “Hopefully that ___ in my police work.” (3 words)', answer: "doesn't come up",
      cue: 'Hopefully that のあと、短い3語。',
      line: 'Hopefully that *doesn’t come up* in my police work.',
      said: '「警察の仕事でそれが問題にならないといいけど」と言う。',
      mean: 'come up ＝ 問題が出てくる。come up は「カマップ」とつながる。',
      trap: 'doesn’t が弱く「ダズン」程度になる。否定が抜けると逆の意味。「ン」を聞く。',
      use: 'If it comes up, I’ll let you know.（その話が出たら知らせるね）' },

    // R fix: V2, the key was the only anticlimax; now two real-theft choices
    // why: a practice test ← his opening plan, and he accuses Chris of staging it; Chris caught ← Andy's accusation
    //   heard as the outcome
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['robbed', 'writing'], seg: [95, 170],
      stem: 'How does Andy’s case end up, by the close of the clip?',
      choices: ['A real theft, and just a report to fill out', 'A real theft, with Chris caught as the thief',
                'A practice test that Andy solves himself'], a: 0,
      cue: '後半、警官が言う「警察の仕事の大半」。',
      said: 'もう一台盗まれ、本物の盗難と分かる。でも警官は報告書を書くだけで、大きな捜査はしない。',
      mean: '張り切るアンディの期待と、地味な現実の差がこの場面の流れ。',
      trap: '冒頭の「練習の事件」の話が強く残る。後半の another と report で流れが変わる。',
      use: 'Less exciting than I hoped.（思ったより地味だった）' },

    // R fix: V2/S1, quoting "Did what?" in the stem gave "pretending not to know"
    // why: goofing ← "stupid" read as acting silly (ふざける); his looks ← "handsome" heard as Chris using his charm
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'playstupid', seg: [98, 109.6],
      stem: 'When Andy accuses Chris, what does he tell Chris to stop doing?',
      choices: ['Pretending he doesn’t know', 'Goofing around instead of helping',
                'Using his looks to get out of it'], a: 0,
      cue: 'Don’t のあとの動詞と、続く形容詞。',
      line: '*Don’t play stupid* and handsome with me.',
      said: '「とぼけるな、ハンサムぶるのもやめろ」と、刑事のように迫る。',
      mean: 'play stupid ＝ 知らないふりをする、とぼける。handsome はおまけのほめ言葉。',
      trap: 'stupid から「ふざける」と取りやすい。play ＋形容詞は「～のふりをする」。',
      use: 'Don’t play dumb. You knew.（とぼけないで。知ってたでしょ）' },

    // why: found ← "the other side of the courtyard" heard as where his turned up; Chris's ← Chris was just accused, so
    //   the news seems to be about him
    // R fix: S4, the segment started inside "sexy"
    { id: 'd4', skill: 'detail', level: 'B1', point: 'another', seg: [111.95, 117.3],
      stem: 'What new report comes in?',
      choices: ['Another computer was stolen nearby', 'Andy’s computer was found nearby',
                'Chris’s computer was stolen too'], a: 0,
      cue: 'Andy と呼びかけたあと、最初の名詞。',
      line: '*another computer* was reported *stolen* from the offices on the other side of the courtyard.',
      said: '「中庭の向こうのオフィスからも、パソコンが盗まれたと届けがあった」と伝える。',
      mean: 'another ＝ もう一台別の。アンディの分とは別に、盗難がもう一件。',
      trap: 'courtyard など場所の語が長く、気を取られやすい。文の頭の主語を聞く。',
      use: 'Another bag was left on the train.（電車にもう一つ、かばんの忘れ物が）' },

    // R fix: V2, "just got much harder" was weak; distractor reworded. S4: start after "sexy", end after "Really?"
    // why: Chris took both ← Chris is the suspect in the scene; a bigger test ← "part of your police training" heard
    //   without "don't think"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'robbed', reveals: ['another'], seg: [111.95, 124.7],
      stem: 'Why does the second report change how Andy should see his own loss?',
      choices: ['His computer was likely really stolen', 'Chris likely took both of the computers',
                'The office set up a bigger test for him'], a: 0,
      cue: 'police training の否定と、そのあとの一文。',
      line: 'I don’t think this is *part of your police training*. I think *City Hall was robbed*.',
      said: '「これは訓練の一部じゃないと思う。市役所が本当に泥棒に入られたんだ」と言う。',
      mean: 'もう一台盗まれたので、アンディの分も本物の盗難らしい。',
      trap: 'training が聞こえると練習の続きと取りやすい。don’t think の否定がかかっている。',
      use: 'I don’t think this is a drill.（これは訓練じゃないと思う）' },

    // R fix: V2, "scared" was a filler for Andy; now his own "I can't tell if you're lying" in the segment
    // why: unsure ← his "I can't tell if you're lying to me" just before; upset ← his practice plan is off, so a letdown
    //   seems next
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'better', seg: [122.6, 128.1],
      stem: 'Once Andy believes the theft is real, how does he feel?',
      choices: ['Thrilled to have a real case', 'Unsure whether he’s being lied to', 'Upset that his test is ruined'],
      a: 0,
      cue: 'crime と聞き返したあとの一言。',
      line: 'Like a *real crime*? *That’s even better.*',
      said: '「本物の事件ってこと？それならもっといい」と言う。',
      mean: 'even better ＝ さらに良い。練習より本物の事件の方がうれしい、という場違いな喜び。',
      trap: '直前の「うそか分からない」に引かれやすい。そのあとの even better が気持ちを決める。',
      use: 'Free parking? Even better.（駐車無料？もっといいね）' },

    // why: a game ← play read as 遊び・ゲーム; a joke ← "play" heard as "playing around", right after "are you lying?"
    { id: 'p2', skill: 'phrase', level: 'C1', point: 'play', seg: [128.1, 132.25],
      stem: 'When Andy turns to the officer, what is he asking for?',
      choices: ['The plan for catching the thief', 'The rules of the game they’re in',
                'A sign that this is all a joke'], a: 0,
      cue: 'officer と呼ぶ前の短い問い。',
      line: '*What’s the play here*, officer?',
      said: '「で、作戦は？包囲網を張って、電話を盗聴するとか？」と警官に詰め寄る。',
      mean: 'the play ＝ スポーツや犯罪映画の「作戦・次の手」。すぐ具体案を並べるのが証拠。',
      trap: 'play を「遊び」と取ると冗談の確認に聞こえる。直後に作戦の案が続く。',
      use: 'So what’s the play tonight?（で、今夜の作戦は？）' },

    // anchor: 129.6–130.2 s both sources have "We gonna set up", with no "are" or "'re" before "we"
    { id: 'c2', skill: 'dict', level: 'C2', point: 'wegonna', seg: [128.1, 132.25],
      stem: 'Type how Andy goes on: “___ a perimeter, maybe bug a few phones.” (4 words)',
      answer: 'we gonna set up',
      cue: 'officer のすぐあと。文法より、聞こえた音を。',
      line: '*We gonna set up* a perimeter, maybe bug a few phones.',
      said: '「包囲網を張る？盗聴とか」と続ける。are は言わず We gonna で始まる。',
      mean: 'Are we going to の are が落ちた、会話によくある形。set up は「セラップ」。',
      trap: '文法に合わせて are や we’re を足したくなる。正しい文でなく、言われた音を書く。',
      use: 'You coming tonight or not?（今夜来るの、来ないの？）' },

    // R fix: V2 (blind 85 %), "I love your enthusiasm" made the only "but" choice the key; now two "but" choices. S4/S5:
    //   the cut moved to 142.3 so it doesn't clip "enthusiasm"
    // predict: the segment stops after "enthusiasm"; the reveal plays the "but"
    // why: a smaller job ← "love your enthusiasm, but" often leads to "you could help with…"; a yes ← "love" heard as
    //   agreement
    // retired: the bank was 26, over 24; its cut at 142.3 s awaits an ear check
    { id: 'r1', skill: 'predict', level: 'B2', point: 'enthusiasm', seg: [139, 142.3], then: [142.3, 145.6], retired: true,
      stem: 'Right after “Andy, I love your enthusiasm”, what kind of line comes next?',
      choices: ['A “but”, and why they can’t do it', 'A “but”, and a smaller job for Andy',
                'A yes, and a plan to start right now'], a: 0,
      cue: 'ほめる前置きのあとには、何が来やすい？',
      line: 'Andy, I love your enthusiasm, *but* we don’t really have the kind of money to launch a massive investigation.',
      said: '「アンディ、その熱意はいいね。でも大がかりな捜査をするお金はない」と続く。',
      mean: 'I love your ～ は、断る前のクッションになることが多い。ほめたあと but で本題。',
      trap: 'love で賛成と取りやすい。but のあとは代案でなく、無理な訳。',
      use: 'Love the idea, but no budget.（いい案だけど、予算がない）' },

    // why: chasing ← "down" kept, "writing" lost, and "superhero" suggests action; waiting ← "it's not superhero time"
    //   heard as "nothing happens"
    // R fix: S4, the segment started inside "go"
    { id: 'd5', skill: 'detail', level: 'B1', point: 'writing', seg: [152.3, 160.1],
      stem: 'According to the officer, what is most police work?',
      choices: ['Writing things down', 'Chasing people down', 'Waiting around for calls'], a: 0,
      cue: 'Just のあと、stuff down の前の動詞。',
      line: 'this is what most police work is. *Just writing stuff down.*',
      said: '「警察の仕事のほとんどは、書き留めるだけ」と言う。',
      mean: 'writing stuff down ＝ 書類を書くこと。派手な捜査とは逆の現実。',
      trap: 'down だけ残ると「追いかける」に聞こえやすい。writing の t は弾んで「ライディン」。',
      use: 'Most of my job is just email.（仕事のほとんどはメールだよ）' },

    // why: an exciting unit ← "superhero" + "something else" heard as other police work; leave it ← "do something else"
    //   heard as "go do something else right now"
    // R fix: S4, the segment started inside "down"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'boring', reveals: ['oughta'], seg: [157.9, 164.3],
      stem: 'At the end of the officer’s speech, what is he suggesting?',
      choices: ['Andy may not be cut out for this job', 'Andy should aim for a more exciting unit',
                'Andy should leave the report to him'], a: 0,
      cue: 'If it sounds boring のあとの提案。',
      line: 'If it sounds boring, maybe you *ought to do something else*.',
      said: '「退屈に聞こえるなら、何か別のことをした方がいいかもな」と言う。',
      mean: '警察の仕事が退屈なら、警官には向かないかも、という遠回しな忠告。',
      trap: '今この場を離れろの意味に取りやすいが、直前の「仕事の大半は書類」から職業の話。',
      use: 'Maybe this job isn’t for you.（この仕事、向いてないのかも）' },

    // why: got to ← "oughta" ≈ "auda", a flap like "gotta"; want to ← the "wanna" shape; have to ← the same advice group
    { id: 's1', skill: 'sound', level: 'B2', point: 'oughta', reveals: ['boring'], seg: [159.9, 164.3],
      stem: 'Fill the gap: “If it sounds boring, maybe you ___ do something else.”',
      choices: ['ought to', 'got to', 'want to', 'have to'], a: 0,
      cue: 'maybe you のあと、短くつながる2語。',
      line: 'maybe you *ought to* do something else.',
      said: '「別のことをした方がいいかもね」と言う。',
      mean: 'ought to は「オーラ」のようにつながり、t は弾む。should に近い、やわらかい助言。',
      trap: 'got to なら「しなきゃ」と強くなる。ought は母音「オー」で始まり、g の音はない。',
      use: 'You ought to try the soup here.（ここのスープ、食べてみるといいよ）' },

    // why: really took ← "stole" taken literally; too cheerful ← "positive attitude" heard as the target of the jab
    { id: 'h4', skill: 'humor', level: 'C1', point: 'attitude', seg: [165.8, 170],
      stem: 'Why is the last comment about Andy funny?',
      choices: ['It treats his lost cheer as one more theft', 'It means someone really took his things',
                'It makes fun of him for being too cheerful'], a: 0,
      cue: 'stole のあと、盗まれた「物」。',
      line: 'Maybe we should *find the person who stole* his *positive attitude*.',
      said: '「彼の前向きな気持ちを盗んだ犯人を探すべきかもね」と言う。',
      mean: '警官に現実を言われてしょげたアンディを、盗難事件の言葉で言い表したしゃれ。',
      trap: 'stole を文字どおり取ると本当の盗難に聞こえる。盗まれたのは物ではなく気持ち。',
      use: 'Who stole your smile today?（今日は元気ないね、どうしたの？）' },
  ]
};
