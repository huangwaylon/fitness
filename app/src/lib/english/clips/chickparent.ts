// “Joey and Chandler Co-Parent a Chick | Friends” (the official Friends channel, Best of Season 3): Joey wants a night
// out with the cast, Chandler has been home with the chick all day, and they fight like new parents, then give up.
// Segments from the captions, words from whisper (2026-11-16). Caption word times lag on the last word of a line, so
// edges are padded there (the last line's "back" sits at 118.8 s, over music, so ends use 116.5 s; whisper has the
// line ending by 113 s, then loops "I'll take her back tomorrow"). Untested: 12–35 s (whether the chick
// is a she, and "whatever it was went back in too quickly"), and who says "Hey, who was up…" and "Oh, here it comes"
// (stems don't name those speakers). Joey/Chandler are named only where the words settle it (rehearsal/cast = Joey;
// stayed home from work = Chandler).
// EAR CHECK: 60.75 s r1 — the cut falls after “Yes, yes, here it comes” (captions “comes” 60.28) and before “I'm stuck” (61.08)
// REVIEW 2026-11-16: pass 5, fix 17, drop 0, new 0; ear checks 1
//   Open: g1 and c2 still lean on the co-parent premise the title gives away; the distractors now sit inside that
//   frame, but a test-wise reader may still pick the "parent at home" reading.
import type { Clip } from '../types.ts';

export const chickParent: Clip = {
  id: 'chickparent', video: 'pOot9CE39BY', title: 'Joey and Chandler Co-Parent a Chick', dur: 124, wpm: 130,
  band: 'slow', tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 55 %): the key was the only plain gloss and the only one naming "his plans"; all three are now
    //   discourse moves of the same shape
    // why: waves off ← anyway = とにかく, read as "no matter what you say" (nobody has objected yet); earlier point ←
    //   anyway also resumes a topic, and the talk did start elsewhere
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', seg: [30.5, 39.2],
      stem: 'Before Joey says he has to go change, what does his “anyway” do?',
      choices: ['Drops a question with no answer and moves on', 'Waves off an objection before Chandler makes it',
                'Returns to something he started to say earlier'], a: 0,
      cue: '「I can’t tell」のあと、文頭の短い一語。',
      line: 'I can’t tell. … Well, *anyway*, I…',
      said: '「よく分からない」と言ったあと、「まあとにかく」と自分の予定の話に移る。',
      mean: 'anyway ＝ その話はここまで。答えの出ない話を切り上げて、自分の用事に移る合図。',
      trap: '「とにかく」から「何を言われても」と取りやすいが、まだ誰も反対していない。',
      use: 'Anyway, I should get going.（まあとにかく、そろそろ行くね）' },

    // R fix: V2 (blind 50 %): "wanna go change" was the odd one out; "have to go" (h vs g, same meaning) replaces it
    // why: better go ← the t of "better" flaps to ラ just like "gotta"; have to go ← "hafta" has the same rhythm and
    //   meaning, only the first consonant differs
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [31.5, 39.2],
      stem: 'Fill the gap: “Well, anyway, I ___ change.”',
      choices: ['gotta go', 'better go', 'have to go'], a: 0,
      cue: '「anyway, I」のすぐあと、change の前。',
      line: 'Well, anyway, I *gotta go* change.',
      said: '「まあとにかく、着替えに行かなきゃ」と言う。',
      mean: 'got to が「ガラ」と弾んで gotta になる。「〜しなきゃ」の決まった言い方。',
      trap: 'gotta も better も t が弾んで「ラ」に近い。最初の子音 g・b・h で聞き分ける。',
      use: 'I gotta go. See you later.（もう行かなきゃ、またね）' },

    // R fix: V2 (blind 60 %): "buy food for the chick" was a filler; "for dinner" (dr-/d-, the same evening plan)
    //   replaces it. p1's stem no longer says "drinks"
    // why: rehearsal ← "rehearsal" is said a few seconds later, by Chandler, and "cast" sounds like work; dinner ←
    //   "for drinks" and "for dinner" both open on d and name a night out
    { id: 'd1', skill: 'detail', level: 'B1', point: 'drinks', seg: [35.5, 40],
      stem: 'Why does Joey need to go and change?',
      choices: ['He’s meeting some of the cast for drinks', 'He has a late rehearsal with the cast',
                'He’s meeting some of the cast for dinner'], a: 0,
      cue: '「go change」のすぐあとの文。',
      line: 'I’m, uh, meeting some of the *cast for drinks*.',
      said: '着替えに行く。劇の仲間と飲みに行くから、と言う。',
      mean: 'cast ＝ 劇の出演者たち。for drinks ＝ 飲みに。夜の予定を告げている。',
      trap: 'rehearsal はこのあと相手が言う語。for のあとの dr- の音で dinner と分ける。',
      use: 'I’m meeting some friends for drinks.（友だちと飲みに行くんだ）' },

    // R fix: V2 (blind 65 %): "the chick will miss Joey" was weak; "not invited along" (the friends reading of "us")
    //   replaces it, so the gist now reveals `us` too
    // why: night shift ← "who was up from 2…" makes nights the topic, but Chandler never asks for tonight; not invited
    //   ← "spend two seconds with us… with your friends" heard as being left out, but "us" is him and the chick at home
    { id: 'g1', skill: 'gist', level: 'B2', point: 'object', reveals: ['stayhome', 'us'], seg: [35.5, 73.3],
      stem: 'Why does Chandler object to Joey’s plans for the evening?',
      choices: ['He feels he’s doing more than his share', 'He wants Joey to do tonight’s night shift',
                'He’s hurt that Joey didn’t invite him along'], a: 0,
      cue: '前半の「仕事を休んだ」と、後半の長い文句。',
      said: '飲みに行くと聞いて、自分は仕事を休んで世話をし、一日中家にいたと不満をぶつける。',
      mean: '世話の負担が自分にばかり来ている、という不満。新米の親のけんかの形。',
      trap: '夜中の話や your friends に引かれるが、頼みも誘いの話もない。文句の主語は I。',
      use: 'I feel like I’m doing everything here.（私ばかりやってる気がする）' },

    // R fix: V2 (blind 75 %) and a cross-item leak: the stem named d1's key ("drinks"), and "says sorry" was a filler.
    //   The stem now names the moment; "can he come along" replaces "sorry"
    // why: repeat ← Excuse me? as a real "pardon?"; come too ← a rising Excuse me? read as eager interest, but a
    //   complaint about staying home follows
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'excuse', seg: [35.5, 47.4],
      stem: 'When Joey says where he’s going, what does Chandler’s two-word reply do?',
      choices: ['Objects, as if he can’t believe it', 'Asks Joey to repeat what he said', 'Asks, half-joking, if he can come too'], a: 0,
      cue: '飲みの話の直後の返事と、そのあと続く文。',
      line: '…for drinks. — *Excuse me?* — What?',
      said: '飲みに行くと聞いて「はあ？」と返し、続けて自分は仕事を休んだと言う。',
      mean: '上がり調子の Excuse me? は「今なんて？」という抗議。聞き返しではない。',
      trap: '聞き返しや「僕も？」に取りやすい。あとに不満が続けば、とがめる Excuse me?。',
      use: 'Excuse me? You’re going out now?（は？今から出かけるの？）' },

    // R fix: V2 (blind 75 %): "to watch the rehearsal" was absurd for a day at home, and the key echoed the line;
    //   "the chick seemed unwell" (a parent's usual reason) replaces it, and the key is reworded
    // why: sleep ← the night waking comes up right after; unwell ← the usual reason a parent stays home, but the
    //   reason given is "so somebody could be here"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'stayhome', seg: [41, 47.4],
      stem: 'Why did Chandler stay home from work today?',
      choices: ['So the chick had someone with her', 'So he could catch up on his sleep', 'Because the chick seemed unwell'], a: 0,
      cue: '「stayed home」の文の後半、so のあと。',
      line: 'I stayed home from work today… *so somebody could be here with our chick*.',
      said: '「君がリハーサル中も、誰かがひよこといられるように」休んだと言う。',
      mean: 'so (that) ～ could ＝ ～できるように。休んだ目的を述べている。',
      trap: '親が休む理由なら「具合が悪い」が浮かぶが、ここは言っていない。目的は so のあとに来る。',
      use: 'I stayed home so someone could be here.（誰かがいられるよう家にいた）' },

    // why: 4 ← "four" and "five" both open on f; 9 ← "five" and "nine" share the アイ vowel
    { id: 'n1', skill: 'number', level: 'B1', point: 'night', seg: [47.2, 54.2], keep: true,
      stem: 'Between which hours was someone up, trying to get her back to sleep?',
      choices: ['From 2 to 4', 'From 2 to 5', 'From 2 to 9'], a: 1,
      cue: '「until」のあと、二つ目の時刻。',
      line: 'who was up from *2 o’clock* this morning until *5 o’clock* this morning',
      said: '「今朝の2時から5時まで、寝かしつけてたのは誰だ」と言い返す。',
      mean: 'this morning は「今朝」だが、ここでは真夜中。夜の番をしていたという主張。',
      trap: 'five と four は出だしが同じ f。最後の v と「アイ」の母音で聞き分ける。',
      use: 'I was up until three last night.（昨夜は3時まで起きてた）' },

    // R fix: K1 + leak: "He was the one up from 2 to 5 himself" was defensible (he says he was up too) and gave n1's
    //   key away. A negation trap replaces it; reveals `night` dropped (nothing in the item now gives the hours)
    // why: sleeps through ← the negative question "You don't think I get up…" heard as "I don't get up"; earlier ←
    //   get up = 朝起きる, the literal reading
    { id: 'i1', skill: 'infer', level: 'B2', point: 'getup', seg: [47.2, 57.4],
      stem: 'Right after the complaint about the night, what does the reply claim?',
      choices: ['He gets up each time the other one does', 'He sleeps through it when the other gets up',
                'He gets up in the morning before the other'], a: 0,
      cue: '「You don’t think」で始まる返事、when の前後。',
      line: '*You don’t think I get up when you get up?*',
      said: '「お前が起きるとき、俺も起きてるって思わないのか？」と返す。',
      mean: '自分も毎回起きている、という反論。否定の疑問で「分かるだろ」と迫る。',
      trap: '否定の疑問を「起きない」と取りやすい。get up は朝の起床でもない。when 以下とセットで「そのたびに」。',
      use: 'You don’t think I worry too?（僕だって心配してないと思う？）' },

    // R fix: V2 (blind 70 %): the key was the only negative choice. "Excited" becomes "Guilty" (negative, refuted by
    //   his own counter-attack about the night, now inside the segment: 47.2 s)
    // why: guilty ← "here it comes" heard as bracing for blame he deserves, but he has just claimed the night shift;
    //   pleased ← "Yes, here it comes" read as both sides welcoming an honest talk
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'herecomes', seg: [47.2, 60.75],
      stem: 'When one of them says “Oh, here it comes”, how does he feel?',
      choices: ['Fed up: he can guess the speech that’s coming', 'Guilty: he knows he deserves what’s coming',
                'Pleased: the other is finally opening up'], a: 0,
      cue: '言い返しの直後の短い一言と、その返事。',
      line: 'Oh, *here it comes*.',
      said: '「ほら来た」と言うと、相手も「そうだ、来たぞ」と受けて文句を始める。',
      mean: 'Here it comes. は「お決まりのが始まるぞ」。また同じ文句か、とうんざりしている。',
      trap: '身構える＝後ろめたい、と取りやすいが、直前に自分から言い返している。',
      use: 'Here we go again.（また始まった）' },

    // R fix: V2 (blind 70 %): only the key matched "here it comes"; a denial (the natural answer to "here it comes")
    //   replaces the joke, so the "Yes" has to be heard
    // why: apology ← after a sharp exchange, the expected move is to back down; denial ← the usual reply to "Oh, here
    //   it comes" is "No, it doesn't", but he says "Yes"
    { id: 'r1', skill: 'predict', level: 'B2', point: 'list', reveals: ['herecomes'], seg: [54, 60.75], then: [60.75, 70.75],
      stem: 'After “Yes, here it comes”, what kind of thing is about to follow?',
      choices: ['The complaint he has been saving up', 'An apology for raising his voice', 'A denial that he always complains'], a: 0,
      cue: '「ほら来た」をそのまま認めて受ける、その言い方。',
      line: 'Yes, here it comes. *I’m stuck here all day*…',
      said: '「そうだ、来たぞ」と受けて、「一日中ここに缶詰めで…」と不満を並べ始める。',
      mean: '相手の「ほら来た」をあえて認め、ためていた文句の前置きにしている。',
      trap: '謝るか「そんなことない」と否定する、と予想しやすい。Yes で受けたら、その中身が来る。',
      use: 'Yes, I’m going to say it.（ええ、言わせてもらうわ）' },

    // R fix: V2 (blind 80 %): "two roommates" was outside the co-parent frame the title sets up. The new near miss is
    //   inside it ("him and Joey, the couple"), refuted because "you" is outside "us"
    // why: friends ← the last word of the line, so "us" sounds like the group he's left out of; couple ← the scene plays
    //   them as a couple, so "us" sounds like the two of them
    // anchor: 61.1–70.8 s "I'm stuck here all day and then you come in and spend 2 seconds with us… with your friends":
    //   "you" is outside "us", and the friends are "your" friends, so "us" is him and the chick at home
    // retired: g1 reveals its point, so play 3+ under g1 drew no C2
    { id: 'c2', skill: 'humor', level: 'C2', point: 'us', reveals: ['list'], seg: [60.6, 71.1], retired: true,
      stem: 'In “spend two seconds with us”, who is “us”, and what does that make him?',
      choices: ['Him and the chick: a parent home with the baby', 'Him and their friends: left out of the night',
                'Him and Joey: a couple who never get time alone'], a: 0,
      cue: '「you」「us」「your friends」が、それぞれ誰か。',
      line: 'I’m stuck here all day… spend two seconds *with us*… with *your friends*?',
      said: '「俺は一日中ここ。お前は二秒だけ俺たちといて、友だちと遊びに行く気か」と言う。',
      mean: 'us は自分とひよこ。家で子を見る親が、外で働く相手に言う決まり文句。自分を「家を守る側」に置いている。',
      trap: 'friends から仲間、夫婦役から二人と取りやすい。you を含まない us は家にいる者。',
      use: 'You never spend time with us anymore.（最近ちっとも家族と過ごさないね）' },

    // R fix: V2 (blind 80 %): "a long trip" was weak; "show off" (gallivant ≈ gallant) replaces it
    // why: work ← "working all day" comes right after, and the cast was mentioned; show off ← gallivant sounds like
    //   gallant (派手に格好をつける), and he's going to change clothes
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'gallivant', seg: [62.5, 71],
      stem: 'What does Chandler mean by Joey going off “gallivanting”?',
      choices: ['Going out to have fun, free of cares', 'Going off to work late with the cast', 'Going off to show off in front of people'], a: 0,
      cue: '「with your friends」と一緒に使っている点。',
      line: 'and then expect to *go off gallivanting with your friends*?',
      said: '「それで友だちと遊び歩きに行くつもり？」と責めている。',
      mean: 'gallivant ＝ 気ままに遊び回る。責任を放って楽しむ、という非難の響き。',
      trap: '知らない語は文脈の別の語で埋めがち。with your friends と責める口調から遊び。',
      use: 'Off gallivanting again, are we?（また遊び歩き？）' },

    // R fix: V2 (blind 70 %): the key was the only firm choice. "Polite and formal" becomes "Playful, pretending to be
    //   strict", refuted by Joey's serious reply, now in the segment (to 76.0 s)
    // why: unsure ← I don't think so = 〜とは思わない, a soft hedge in Japanese; playful ← the mock-wife "mister" sounds
    //   like a bit, but it caps a real list of grievances and Joey answers it seriously
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'mister', seg: [62.5, 76],
      stem: 'At the end of his complaint, how does Chandler sound?',
      choices: ['Firm, like a spouse putting a foot down', 'Unsure, as if he’s still thinking it over',
                'Playful, like a friend pretending to be strict'], a: 0,
      cue: '文句の最後、短い否定と呼びかけ。',
      line: 'Well, *I don’t think so, mister*.',
      said: '「そうはさせないわよ、ミスター」と締めくくる。',
      mean: 'I don’t think so は強い拒否。mister は叱る時の呼び方。夫婦げんかの妻の口ぶり。',
      trap: '控えめな「〜と思わない」や、おふざけと取りがち。相手が本気で言い返すのが答え合わせ。',
      use: 'Oh no you don’t, mister.（そうはいかないわよ）' },

    // why: cast ← the cast was named as who he's meeting; stuck ← "stuck here all day" is Chandler's line, just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'relax', seg: [73, 78.2],
      stem: 'What reason does Joey give for going out?',
      choices: ['He needs to unwind after a day at work', 'He promised the cast he would come', 'He has been stuck at home all day too'], a: 0,
      cue: '「Hey」で始まる返事の、二つの文。',
      line: 'Hey, *I need to relax*, okay? *I was working all day*.',
      said: '「リラックスしたいんだ。一日中働いてたんだから」と返す。',
      mean: '仕事で疲れたから息抜きが要る、という言い分。',
      trap: 'stuck here all day は相手の言葉。それぞれの「一日中」が何だったかを区別する。',
      use: 'I need to unwind after work.（仕事のあとは息抜きしたい）' },

    // R fix: V2 (blind 75 %): "should go back to work" was weak; a who-thinks-what reversal ("Chandler thinks acting
    //   isn't real work") replaces it
    // why: acting ← "working" vs his office job, a real comparison between them; reversal ← "don't think… is work" heard
    //   with the roles swapped, Joey's acting as the thing called not-work
    { id: 'i2', skill: 'infer', level: 'C1', point: 'work', seg: [75.4, 89.9],
      stem: 'What does Chandler accuse Joey of thinking?',
      choices: ['That caring for the chick isn’t real work', 'That acting is harder than an office job',
                'That Chandler thinks acting isn’t real work'], a: 0,
      cue: '「working all day」への返事。',
      line: '*And you don’t think taking care of our chick is work?*',
      said: '「ひよこの世話は仕事じゃないって言うのか」と返し、相手は「そうは言ってない」と否定。',
      mean: '「俺は働いてた」を「家の世話は仕事じゃない」の意味に取って責めている。',
      trap: 'work が何度も出て、誰の何が仕事か入れ替わりやすい。主語 you を押さえる。',
      use: 'Taking care of a baby is work too.（赤ちゃんの世話も仕事だよ）' },

    // R fix: V2 (blind 65 %) and the C2 rule on two distractors with one misreading: "accepts" and "admits" were both
    //   climb-downs. "Admits" becomes "waves off an apology" (he does cut Joey off, but it isn't an apology)
    // why: accepts ← 分かってる read as understanding, and the next lines are calm; apology ← "I just meant" heard as the
    //   start of a sorry, so cutting it off sounds like 'no need'
    // anchor: 86.1–88.8 s "I just meant—" is cut off by "I know what you meant": no explanation got through, so there is
    //   nothing to accept or to have misread; he keeps his reading of "working all day"
    // retired: one C2 alone is under 2 (c2 retired)
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'meant', seg: [83.6, 94.8], retired: true,
      stem: 'What does the cut-off “I know what you meant” show about the fight?',
      choices: ['He won’t hear the excuse; he’s sure of the insult', 'He accepts the explanation, so the fight is over',
                'He waves off an apology he thinks is coming'], a: 0,
      cue: '「I just meant」のあと、言葉が切れたところ。',
      line: 'That’s not what I said, okay? I just meant— *I know what you meant*.',
      said: '「そうは言ってない。ただ…」と言いかけたところを、「分かってる」とさえぎる。',
      mean: '説明を聞かずに言う「分かってる」は、「どうせそういう意味だろう」という決めつけ。',
      trap: '理解や「謝らなくていい」と取りやすい。I just meant は謝罪でなく説明。それを切るのは聞く気がない印。',
      use: 'Oh, I know exactly what you meant.（何が言いたいか、よく分かってる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'meant', seg: [85.4, 90],
      stem: 'Type the reply: “___.” (5 words)', answer: 'i know what you meant',
      cue: '「I just meant」で切れたすぐあと。',
      line: 'I just meant— *I know what you meant*.',
      said: '言いかけた説明をさえぎって「言いたいことは分かってる」と言う。',
      mean: 'what you が「ワッチュ」とつながる。meant の t は弱い。',
      trap: 'what you が一語に聞こえ、語数を数えにくい。I know what you ～ の型で拾う。',
      use: 'I know what you mean.（言いたいこと、分かるよ）' },

    // why: take turns ← the compromise script after "stayed home"/"up from 2"; stop fighting ← "fighting a lot more" is
    //   said, but as the problem, not the plan
    { id: 'g2', skill: 'gist', level: 'B1', point: 'ending', seg: [94.5, 116.5],
      stem: 'Once the fight cools down, what do they decide?',
      choices: ['To return the chick where they got her', 'To take turns staying home with her',
                'To stop fighting in front of the chick'], a: 0,
      cue: '最後の、短い二つの文。',
      said: '「けんかが増えた」「準備ができてなかったのかも」と話し、「明日返す」と決める。',
      mean: '子育てに疲れた夫婦のような会話の末、ひよこを返すことにする。',
      trap: 'fighting が聞こえるので「けんかをやめる」に引かれる。決めたことは I’ll の文に出る。',
      use: 'I’ll take it back tomorrow.（明日返品してくる）' },

    // R fix: V2 (blind 85 %): "the chick was too young" was weak; slang chick = a girl (have a chick = a girlfriend)
    //   replaces it
    // why: too young for pets ← ready read as age or maturity; girlfriend ← slang "chick" = a young woman, but "this
    //   chick" is the one they got
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ready', seg: [95, 108.4],
      stem: 'Why does the audience laugh at “Maybe we weren’t ready…”?',
      choices: ['They talk like a couple who just had a baby', 'He means the two of them are too young for pets',
                'He’s using “chick” to mean a girlfriend'], a: 0,
      cue: '「ever since」から始まる二人のやりとり全体。',
      line: 'we’ve been *fighting a lot more* than we used to… Maybe *we weren’t ready to have a chick*.',
      said: '「ひよこが来てからけんかが増えた」「準備がまだだったのかも」と話す。',
      mean: '子どもが生まれた夫婦の悩み相談そのもの。相手がひよこなので、そのずれが笑い。',
      trap: 'ready を年齢、chick を「女の子」と取りやすい。this chick は家の一羽。',
      use: 'Maybe we weren’t ready for a dog.（犬を飼う準備ができてなかったのかも）' },

    // R fix: V2 (blind 70 %): "sell the chick to make money" was weak; the literal worry about the refund replaces it
    // why: refund worry ← the question taken at face value, but the laugh is the drop from “baby” to $3; sad ← giving
    //   her back read as a sad farewell
    { id: 'h2', skill: 'humor', level: 'C1', point: 'bucks', reveals: ['ending'], seg: [103.3, 116.5],
      stem: 'Why does the very last question get a laugh?',
      choices: ['After all that, the “baby” was a cheap buy', 'He worries the shop won’t give the money back',
                'He is sad to be giving the little chick away'], a: 0,
      cue: '「返す」と決めた直後の、質問の中身。',
      line: 'I’ll take her back tomorrow. — You think we’ll get our *three bucks back*?',
      said: '「明日返してくる」に「3ドル戻ってくると思う？」と聞く。',
      mean: '親のような悩みのあと、ひよこが3ドルの買い物に戻る。重い話を急にお金に落とす笑い。',
      trap: '返金の心配と文字通りに取りやすいが、笑いは「わが子」が3ドルの買い物に落ちる落差。',
      use: 'Can I get my money back?（返金してもらえますか）' },

    // why: $13 ← "three bucks" runs together like "thir-teen"; $30 ← three/thirty share "thr-"
    { id: 'n2', skill: 'number', level: 'B1', point: 'bucks', seg: [110.9, 116.5], keep: true,
      stem: 'What did they pay for the chick?',
      choices: ['$3', '$13', '$30'], a: 0,
      cue: '「get our」のすぐあと。',
      line: 'You think we’ll get our *three bucks* back?',
      said: '「3ドル戻ってくるかな」と言っている。',
      mean: 'bucks ＝ dollars のくだけた言い方。ひよこは3ドルで買ったと分かる。',
      trap: 'three のあと bucks が速く続き、thirteen にも聞こえる。-teen なら長く強い「ティーン」。',
      use: 'It’s only five bucks.（たった5ドルだよ）' },

    // why: we ← the dark l of "we'll" barely sounds; we'd ← "we'd get" is just as natural, and the d drops before g
    // R fix: C5: the stem quotes "get our three bucks back", which gives g2's outcome away; reveals `ending` added
    { id: 's2', skill: 'sound', level: 'B2', point: 'well', reveals: ['bucks', 'ending'], seg: [110.9, 116.5],
      stem: 'Fill the gap: “You think ___ get our three bucks back?”',
      choices: ['we’ll', 'we', 'we’d'], a: 0,
      cue: '「think」のすぐあと、とても短い一語。',
      line: 'You think *we’ll* get our three bucks back?',
      said: '「3ドル戻ってくると思う？」と、明日返すときのことを聞いている。',
      mean: 'we’ll は「ウィル」より短く「ウォ」に近い。暗い l が次の get に流れる。',
      trap: 'we’ll の l は舌が離れず、消えたように聞こえる。明日のことなら will が入る。',
      use: 'Do you think we’ll make it?（間に合うと思う？）' },
  ]
};
