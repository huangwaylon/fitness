// “Michael's Blast From the Past - The Office US” (the official The Office channel, BEST OF SEASON 6): Michael shows
// the office a tape of "Fundle Bundle", the kids' show he was on; another boy wanted to be on TV and now is, young
// Michael wanted to marry and have a hundred kids so he'd have a hundred friends, and the office's questions about how
// that turned out send him off with a slice of pizza.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Michael (18.1, 83.5, 110.5 s), Ryan
// (25.4 s), Miss Trudy (31.6, 112.0 s). The other boy is "Chet" in whisper and "Chad" in the captions: no item uses the
// name (stems say "the boy before him"). The office voices asking the questions (116–137 s) are unnamed: stems say
// "the office". The captions push each line's last word late, so segment ends come from whisper where the two agree.
// Untested: 0–14 s is Michael to camera (h1 asks only what his words do); 30–52 s (office remarks over the tape, the
// host's "amazing body", "Edward R. Meow"); 60–66 s (captions "colorologist… doppers", whisper "meteorologist… Doppler's
// up"); 84.6 s ("I'm Ed" in both, likely "I'm eight"); 116–119 s (the tape's host talks over the office); 127.5 s
// ("I do okay": "I do. Okay." or "I do okay"?); 129.8 s ("Even I have a girlfriend", speaker unknown).
// EAR CHECK: 136.7 s a2 nt1 — “I guess not”, after a ≈ 2.5 s pause, is quiet and deflated, not annoyed or joking (tone)
// EAR CHECK: 72.7–74.3 s nt2 — the main stress in “And he is on TV now” falls on “is” (ship only once confirmed)
// EAR CHECK: 89.0 s d2 — whisper “Recess” (twice), captions “re… J say”: confirm the boy says “Recess”
// REVIEW 2026-11-16: pass 11, fix 10, drop 0, new 0; ear checks 3
// Open: g1 and g2 stay near 55 % blind (the Office mood and the title give the arc); s1 is a set phrase ("what do you
//   want to be when you grow up"), so its blind rate stays near 50 %.
import type { Clip } from '../types.ts';

export const michaelBlastPast: Clip = {
  id: 'blastpast', video: 'kAp0syGmyW8', title: 'Michael\'s Blast From the Past', dur: 165, wpm: 147, band: 'slow',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // why: blames parents ← "complaining" heard as his criticism of how they raise kids; admits it's tough ← "how tough
    //   it is" is said, heard as his own conclusion
    // R fix: V2 (blind 60 %): "real children scare him" was weak; "admits it's tough" uses a word he does say.
    { id: 'h1', skill: 'humor', level: 'C1', point: 'adults', seg: [2.8, 14.6],
      stem: 'What makes the last line of Michael’s point about raising kids funny?',
      choices: ['He’s been talking about grown-ups all along', 'He says it’s easy, then admits it’s tough',
                'He blames parents for spoiling their kids'], a: 0,
      cue: '最後の「for God’s sake」の直前の一語。',
      line: 'you give them pizza, you give them candy… *They’re adults*, for God’s sake.',
      said: '「子育てが大変なんて分からない。ピザやお菓子をあげて好きにさせれば…大人だろ」と話す。',
      mean: '子育ての話のはずが、相手は大人。部下を子ども扱いしていると最後で分かる。',
      trap: 'complaining で親への批判に聞こえる。最後の一語が前提をひっくり返す。',
      use: 'It’s easy. They’re adults, after all.（簡単だよ。もう大人なんだし）' },

    // R fix: V2 (blind 65 %): "a story about his future" contradicted "past"; a fan's-eye reading replaces it.
    // why: loud surprise ← blast = 爆発, a bang; a show he loved ← "a show that you might remember" heard as one he watched
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'blast', seg: [13.9, 21],
      stem: 'When he introduces the tape, what is Michael promising?',
      choices: ['A look back at his own early days', 'A loud surprise from his old days', 'A funny clip from a show he loved'], a: 0,
      cue: '「give you a little」のあと、past で終わる言い方。',
      line: 'I’m going to give you a little *blast from the past*',
      said: '「ちょっと昔を懐かしむものを見せよう」と言っている。',
      mean: 'a blast from the past ＝ 昔を思い出させるもの。古い曲や写真にも使う。',
      trap: 'blast は「爆発」なので派手な驚きに聞こえるが、この形では「懐かしいもの」。',
      use: 'This song is a blast from the past.（この曲、すごく懐かしい）' },

    // why: fan ← "a show that you might remember" heard as one he watched; sang ← kids' shows suggest singing
    { id: 'd1', skill: 'detail', level: 'B1', point: 'star', seg: [17.3, 24.2],
      stem: 'How does Michael describe his younger self as he sets up the tape?',
      choices: ['A child star on a TV show', 'A big fan of a kids’ TV show', 'A kid who sang on TV shows'], a: 0,
      cue: '「when he was a」のあとの2語。',
      line: 'when he was a *child star* and a show that you might remember',
      said: '「子役スターだったころの自分と、覚えているかもしれない番組」と紹介する。',
      mean: 'child star ＝ 人気の子役。自分を三人称で呼び、大げさに紹介している。',
      trap: 'might remember で「見ていた番組」に聞こえやすいが、出ていた側の話。',
      use: 'She was a child star in the nineties.（彼女は90年代の子役スターだった）' },

    // R fix: V2 (blind 70 %): "Ryan should explain" didn't fit the words; "one more thing" plays on "further".
    // why: sorry it took long ← the Japanese preface 「前置きが長くなりましたが」; one more thing ← "further" heard as
    //   "more to come"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'ado', seg: [23.6, 28],
      stem: 'Right before he calls Ryan’s name, what is Michael signaling?',
      choices: ['He’s done talking; the tape starts', 'He’s sorry his intro ran so long',
                'He has one more thing to add first'], a: 0,
      cue: '「Okay」のあと、Ryan の名前の直前。',
      line: 'Okay, *without further ado*, Ryan.',
      said: '「では早速」と言ってライアンを呼び、テープを流させる。',
      mean: 'without further ado ＝ これ以上前置きせずに。始める合図で、司会の決まり文句。',
      trap: '日本語の「前置きが長くなりましたが」に近く聞こえるが、謝ってはいない。始める合図。',
      use: 'So without further ado, let’s eat!（では早速、いただきましょう！）' },

    // R pass: blind 50 %, at the line; both distractors are literal readings the segment refutes.
    // why: watching now ← "on TV now" read literally (the tape is playing on a TV); still a child actor ← the tape shows
    //   him as a boy
    { id: 'i2', skill: 'infer', level: 'C1', point: 'chet', seg: [66.6, 74.8],
      stem: 'After the boy before Michael answers, what does the next line point out?',
      choices: ['His childhood wish has come true', 'He is watching this show right now', 'He is still a child actor today'],
      a: 0,
      cue: '男の子の答えのすぐあと、「now」で終わる一言。',
      line: 'I want to be on TV. — And *he is on TV now*.',
      said: '男の子が「テレビに出たい」と答え、続けて「で、今テレビに出てる」と言う。',
      mean: '子どものころの夢が本当にかなったと伝えている。あとの話との対比の前ぶれ。',
      trap: 'テープもテレビに映っているので「今見ている」と取りやすい。now は大人になった今。',
      use: 'She wanted to fly, and now she does.（空を飛びたくて、今そうしてる）' },

    // anchor: 70.5–74.3 s the boy's "I want to be on TV" just before: the line confirms the wish, so the weight goes on
    //   the verb that says it happened
    // why: on "he" ← a contrast with the other kids (and Michael), which the clip does build later; on "now" ← the time
    //   word, heard as "at this moment, live"
    { id: 'nt2', skill: 'sound', level: 'C2', point: 'chet', seg: [69.8, 74.8], retired: true,
      stem: 'In “And he is on TV now”, where is the main stress, and why?',
      choices: ['On “is”: his wish really did come true', 'On “he”: he made it, unlike the other kids',
                'On “now”: he is on the air at this moment'], a: 0,
      cue: '男の子の答えのあと、いちばん強く長く聞こえる語。',
      line: 'I want to be on TV. — And he *is* on TV now.',
      said: '男の子が「テレビに出たい」と言い、すぐに「で、本当に今テレビに出てる」と続く。',
      mean: 'is が強いと「言ったとおり本当に」という確認。ふだん弱い be 動詞を強めると、事実だと念を押す。',
      trap: '英語は文末の now が強く聞こえやすい。どの語が長く高いかで、何を言いたいかが変わる。',
      use: 'You said you’d come, and you did!（来るって言って、本当に来たね！）' },

    // R fix: V2 (blind 70 %): "talk about the boy" didn't fit "so you don't miss it"; the new near miss does.
    // why: sound too low ← "please" twice heard as a request to turn it up; the boy grown up ← "he is on TV now" just
    //   before, heard as the tape cutting to him today
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'shush', seg: [74.5, 83.3],
      stem: 'Right after the boy’s part, why is the room told to be quiet?',
      choices: ['Young Michael’s turn comes next', 'The boy’s grown-up clip is next',
                'The tape’s sound is too low to hear'], a: 0,
      cue: '「so you don’t」のあと、次に誰が映るか。',
      line: 'Would everybody please shut up, please? *So you don’t miss it.*',
      said: '「みんな静かにして、見逃さないように」と言い、次の子が「それ僕だ」と分かる。',
      mean: 'it は次に出てくる子どものマイケル。自分の番を見てほしい気持ち。',
      trap: 'please が2回あるので音量の頼みに聞こえるが、静かにさせたいのは自分の番のため。',
      use: 'Quiet, everyone, this is the good part!（静かに、ここがいいところ！）' },

    // R fix: K7 tell (key strictly longest) and V2 (blind 75 %): the key is trimmed to the distractors' length.
    // why: bragging ← "child star" and "on TV" set up a boast; quarrel ← "work" at the end heard as a fight over it
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['hopes'], seg: [79.5, 151],
      stem: 'How does the mood shift once young Michael’s part has played?',
      choices: ['From fun to an awkward look at how his life went',
                'From fun to Michael bragging about where he is now',
                'From fun to a quarrel about getting back to work'], a: 0,
      cue: '子どものマイケルの答えのあと、部屋の反応と質問。',
      said: '子どもの答えのあと、結婚や子どもについて聞かれ、マイケルは仕事を口実に出ていく。',
      mean: '懐かしい楽しいテープが、今の自分を突きつける鏡になる流れ。',
      trap: '最初は自慢げに見せていたので、最後も自慢と思いやすい。後半は質問に押されている。',
      use: 'That got awkward fast.（急に気まずくなったね）' },

    // R pass, ear check: the captions garble the answer ("re… J say"); whisper has "Recess" twice.
    // why: reading ← "Re-" is all that's caught at the start; science ← a school subject a kid might name
    { id: 'd2', skill: 'detail', level: 'B1', point: 'recess', seg: [85.2, 90.5], retired: true,
      stem: 'What does young Michael name as his favorite subject?',
      choices: ['Recess', 'Reading', 'Science'], a: 0,
      cue: '「in school」と聞かれた直後の一語。',
      line: 'what’s your favorite subject in school? — *Recess.*',
      said: '好きな教科を聞かれ、「休み時間」と答える。',
      mean: 'recess ＝ 学校の休み時間。教科ではないところが子どもらしい答え。',
      trap: '最初の「リ」だけで reading と取りやすい。後ろが「セス」と短く切れるかで聞き分ける。',
      use: 'My favorite part of the day is lunch.（一日でいちばん好きなのはお昼）' },

    // R pass (open): blind 50 %, a set phrase; the near sounds are real and the tense settles it.
    // why: what did ← "do" shrinks to a schwa, close to a weak "did"; what would ← the hypothetical "when you grow up"
    { id: 's1', skill: 'sound', level: 'B2', point: 'whaddaya', seg: [90.6, 94.7],
      stem: 'Fill the gap: “So, tell me, ___ want to be when you grow up?”',
      choices: ['what do you', 'what did you', 'what would you'], a: 0,
      cue: '「tell me」のあと、want の前の短いかたまり。',
      line: 'So, tell me, *what do you* want to be when you grow up?',
      said: '「大きくなったら何になりたい？」と聞いている。',
      mean: 'what do you が「ワダヤ」のように一つにつながる。do はほぼ「ダ」。',
      trap: 'did も弱いと「ディ」程度で似る。when you grow up は未来の話なので、時制も手がかり。',
      use: 'What do you want for dinner?（夕飯、何がいい？）' },

    // why: on TV ← the last boy's wish, heard as repeated; teacher ← "friends" later heard as a school setting
    { id: 'd3', skill: 'detail', level: 'B1', point: 'wish', reveals: ['hundred'], seg: [90.6, 102.3],
      stem: 'When asked what he wants to be, what does young Michael say?',
      choices: ['Married, with a really big family', 'On TV, just like the boy before him',
                'A teacher, with lots of friends'], a: 0,
      cue: '「I want to be」のすぐあとの一語。',
      line: 'I want to be *married and have a hundred kids*',
      said: '「結婚して、子どもを100人ほしい」と答える。',
      mean: '職業ではなく家族を答えている。この答えが、あとの質問につながる。',
      trap: '直前の子が「テレビ」と答えたので同じに聞こえやすい。want to be のすぐあとを聞く。',
      use: 'I want to settle down someday.（いつか落ち着きたい）' },

    // why: ten ← "a hundred" with weak "-dred" sounds short; a dozen ← a big family, in a more usual size
    { id: 'n1', skill: 'number', level: 'B1', point: 'hundred', reveals: ['wish'], seg: [94.4, 102.3], keep: true,
      stem: 'How many kids does young Michael say he wants?',
      choices: ['Ten', 'A dozen', 'A hundred'], a: 2,
      cue: '「have a」のあと、kids の直前。',
      line: 'have *a hundred* kids so I can have *a hundred* friends',
      said: '子どもを100人、そうすれば友だちが100人、と言う。',
      mean: '同じ数を2回言うので、ここは聞き取りやすい。大きすぎる数が子どもらしい。',
      trap: 'a が弱く hundred の語尾も短いので、短い数に聞こえることがある。2回目で確かめる。',
      use: 'I’ve told you a hundred times!（何回も言ったでしょ！）' },

    // why: quiet house ← a big family = a lively home; on TV ← the boy before him wanted TV
    // R fix: B1/N7: the line shows "a hundred", n1's key; 'hundred' added to reveals.
    { id: 'd4', skill: 'detail', level: 'B2', point: 'friends', reveals: ['wish', 'hundred'], seg: [94.4, 102.3],
      stem: 'What reason does he give for wanting so many kids?',
      choices: ['So nobody could turn down being his friend', 'So the house would never feel too quiet',
                'So they could all be on TV with him'], a: 0,
      cue: '「so I can」から最後まで。',
      line: 'so I can have a hundred friends and *no one can say no to being my friend*',
      said: '「そうすれば友だちが100人。誰も友だちになるのを断れない」と言う。',
      mean: '子どもなら必ず友だちでいてくれる、という理屈。家族より友だちが目的。',
      trap: '大家族はにぎやかさのため、と考えやすいが、本人が言う理由は「断られない友だち」。',
      use: 'No one can say no to free pizza.（タダのピザは誰も断れない）' },

    // why: center of attention ← the TV setting and the big number; busy family ← the literal "married… kids"
    { id: 'i3', skill: 'infer', level: 'C1', point: 'friends', reveals: ['wish'], seg: [94.4, 102.3],
      stem: 'What does his reason suggest about young Michael?',
      choices: ['He already worried about having friends', 'He already loved being the center of attention',
                'He already pictured a busy family life'], a: 0,
      cue: '最後の「say no」の部分。何を心配しているか。',
      line: 'and *no one can say no* to being my friend',
      said: '「誰も友だちになるのを断れない」と言う。',
      mean: '断られる心配が、子どものころからあったと分かる。笑いの中に寂しさがある。',
      trap: '結婚や子どもの話だけ聞くと家庭的に見えるが、理由の部分に本音がある。',
      use: 'I just don’t want to be left out.（仲間外れになりたくないだけ）' },

    // why: charmed ← "nice talking with you" taken at face value; annoyed ← a sudden handover heard as cutting him off
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'host', seg: [100.8, 113],
      stem: 'How does the show’s host react to young Michael’s answer?',
      choices: ['Thrown, and quick to move on', 'Charmed, and keen to hear more', 'Annoyed, and quick to scold him'], a: 0,
      cue: '答えのあとの間と、つなぎの声の多さ。',
      line: '*Uh, okay, well, uh*, nice talking with you, Michael. *Back to you*, Miss Trudy.',
      said: '間があき、「えー、まあ、話せてよかった。ではトゥルーディに」と返す。',
      mean: 'uh や well の多さは返事に困ったしるし。すぐ相手に戻して終える。',
      trap: 'nice talking with you は言葉だけなら好意的。決まり文句で話を切り上げている。',
      use: 'Well, uh, okay! Moving on.（えーと、はい！次に行こう）' },

    // R fix: V2 (blind 70 %): "paid him well" had no hook in the questions; "misses being on TV" uses the tape itself.
    // why: misses TV ← the tape and "child star" pull toward his TV days; keeps in touch ← the Chet question at 128 s
    { id: 'g2', skill: 'gist', level: 'B2', point: 'hopes', seg: [115.8, 140],
      stem: 'What do the office’s questions after the tape keep coming back to?',
      choices: ['Whether his life matched what he wished for', 'Whether he keeps in touch with the other kids',
                'Whether he misses being on a TV show'], a: 0,
      cue: '結婚、子ども、恋人…と続く質問の共通点。',
      said: '結婚した？子どもは？恋人は？と聞き、最後に「なりたいものになれなかったね」とまとめる。',
      mean: '子どものころの答えと、今の生活を一つずつ比べている。',
      trap: '昔の番組や共演者の話も一瞬出るが、質問の大半は今のマイケルの生活。',
      use: 'So, did it turn out as planned?（で、計画どおりになった？）' },

    // R fix: V2 (blind 50 %): "hurry up" was weak; "so" as a filler (「えーと」) is the likelier misreading.
    // why: new topic ← "so" as a topic shift; a moment to think ← "so" heard as a filler, like 「えーと」
    { id: 'm1', skill: 'marker', level: 'B2', point: 'so', reveals: ['hopes'], seg: [131.8, 137.4],
      stem: 'What does the first word of the last question do?',
      choices: ['Sums up what the answers have shown', 'Moves the talk on to a brand-new topic',
                'Gives him a moment to think first'], a: 0,
      cue: '質問の最初の短い一語と、それまでの答え。',
      line: '*So*, you didn’t get to be what you wanted to be.',
      said: '「つまり、なりたいものにはなれなかったんだね」と言う。',
      mean: 'この so は「ということは」。それまでの答えをまとめて結論を出している。',
      trap: 'so は話題を変えるときにも使うが、ここは前の答えから結論を引き出している。',
      use: 'So, you’re not coming, then?（じゃあ、来ないってこと？）' },

    // R fix: V2 (blind 70 %): the key was the only hurt choice; "stung" is a near miss that "I guess not" refutes.
    // why: stung, about to snap ← hurt read as anger building; laughing it off ← "I guess" heard as casual
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'guessnot', reveals: ['hopes'], seg: [131.8, 140],
      stem: 'How does Michael sound when he answers the last question?',
      choices: ['Deflated, and quietly admitting it', 'Stung, and about to snap back at them',
                'Relaxed, and laughing it off'], a: 0,
      cue: '質問のあとの長い間と、答えの短さ。',
      line: 'So, you didn’t get to be what you wanted to be. — *I guess not.*',
      said: '「なりたいものになれなかったね」と言われ、間をおいて「そうみたいだね」と答える。',
      mean: '長い間のあとの短い答えは、認めたくない事実を認めるしるし。',
      trap: 'I guess は軽く聞こえるが、ここは反論も冗談もない。間の長さが気持ちの重さ。',
      use: 'I guess not. Oh well.（そうみたいだね。まあいいか）' },

    // anchor: 131.8–146.6 s the question "you didn't get to be what you wanted to be", a long pause, "I guess not", then at
    //   once the excuse: the work comes up only after the question lands
    // R fix: V2 (blind 80 %) and K3: "watch the tape alone" was a filler; "the tape embarrasses him" is the near miss,
    //   which the timing (the excuse comes after the question, not after the tape) refutes.
    // why: only for the pizza ← he does take a slice, heard as the real reason; tape embarrasses him ← the silly tape and
    //   the room's remarks over it
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'exit', reveals: ['guessnot', 'hopes'], seg: [131.8, 146.6], retired: true,
      stem: 'When Michael says he has work to do, what is he trying not to say?',
      choices: ['That the last question has hurt him', 'That he came in only for the pizza',
                'That the old tape now embarrasses him'], a: 0,
      cue: '最後の質問から、仕事の話が出るまでの流れ。',
      line: 'I guess not. — You know, I have *a load of work to do*',
      said: '「なりたいものになれなかった」と認めた直後、「仕事が山ほどある」と言い出す。',
      mean: '急な仕事の話は、その場を離れる口実。傷ついたと言わずに済ませる大人の逃げ方。',
      trap: 'ピザを取るので食べ物が目的に見えるが、仕事の話が出たタイミングに注目。直前の質問が引き金。',
      use: 'Oh, look at the time! I should go.（あ、もうこんな時間！行かなきゃ）' },

    // R pass: blind 55 %; "work" said twice makes "back to work" a real trap, which the subject I settles.
    // why: share the pizza ← "slice of this delish pizza" heard as an offer; back to work ← "work" said twice, heard as an order
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'exit', seg: [139.8, 151],
      stem: 'What is Michael doing with his last lines?',
      choices: ['Finding a way out of the room', 'Offering everyone some of the pizza',
                'Telling everyone to get back to work'], a: 0,
      cue: '「You know」から「Bye」まで。主語は誰か。',
      line: 'I have a load of work to do… *I’m going to go do my work. Bye.*',
      said: '「仕事が山ほどあるから、ピザを1切れ取って仕事に行く。じゃあ」と言う。',
      mean: '自分が抜けるための説明。主語はずっと I で、皆に指示してはいない。',
      trap: 'work が2回聞こえるので「仕事に戻れ」の指示に聞こえやすい。主語が I か you かを聞く。',
      use: 'Anyway, I should get going. Bye!（とにかく、そろそろ行くね。じゃあ！）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'slice', seg: [141, 146.4],
      stem: 'Type what he says: “I am going to ___ of this delish pizza.” (3 words)', answer: 'grab a slice',
      cue: '「going to」のあと、of の前。',
      line: 'so I am going to *grab a slice* of this delish pizza',
      said: '「このおいしいピザを1切れもらっていく」。',
      mean: 'grab ＝ さっと取る。a slice はピザやケーキの1切れ。',
      trap: 'grab a がつながって「グラバ」に聞こえる。a を落とさずに書く。',
      use: 'Let’s grab a coffee.（ちょっとコーヒーでも）' },
  ]
};
