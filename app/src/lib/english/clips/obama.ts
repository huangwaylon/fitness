// “Leslie Meets Michelle Obama | Parks and Recreation” (the official Parks and Recreation channel, Season 5): Grant
// introduces Leslie, who is considering a job running a new Midwest bureau, to Michelle Obama; Leslie gets more and
// more starstruck, and Michelle encourages her to take the job.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈59.3 s. Untested: 15.8 s ("need" in the
// captions, "meet" in whisper), 44.5–48.3 s ("can I high-five you?" is in whisper only; the captions drop it).
// EAR CHECK: 12.2 s nt1 — "Yeah, you are from Chicago, so you like it!" is taken as Leslie's (no name is said;
//   Grant has just introduced her). Only nt1's key names the speaker; f1 and a3 hold either way.
// EAR CHECK: 35.6 s x1 — "getting" with a flapped t ("gedding") linking into "kids‿outside"
// EAR CHECK: 42.1 s s1 — "louder now" running together; both sources have "louder now"
// REVIEW 2026-11-16: pass 8, fix 9, drop 0, new 0; ear checks 3
// REVIEW open: nt1 needs the speaker at 12.2 s to be Leslie (one ear check settles it; else retire nt1).
import type { Clip } from '../types.ts';

export const leslieObama: Clip = {
  id: 'obama', video: '1jTs121jq0Y', title: 'Leslie Meets Michelle Obama', dur: 70, wpm: 159, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 50 %): "visit the parks" was weak. Now "work on her own team", a broken script (meeting the
    //   First Lady = a job offer from her), refuted by "take the job" (Grant's bureau, 6–9.8 s).
    // why: program ← "Let's Move program", her big project, comes up in the middle; her team ← she's the one
    //   meeting Leslie, so the hope sounds like her own offer
    { id: 'g1', skill: 'gist', level: 'B1', point: 'takejob', reveals: ['job'], seg: [0, 59.6],
      stem: 'By the end, what does Michelle hope Leslie will do?',
      choices: ['Take the job she’s been offered', 'Join her program for active kids', 'Come and work on her own team'],
      a: 0,
      cue: '最後のほう、「I hope you」のあと。',
      line: 'Yeah, well, *I hope you take the job*.',
      said: '仕事を考えているレスリーに、最後に「ぜひ引き受けて」と言って別れる。',
      mean: 'この面会は新しい仕事への後押し。最後の一言が目的をまとめている。',
      trap: '本人と会っているので、彼女の取り組みやチームへの誘いに思える。最後の hope のあとを聞く。',
      use: 'I hope you take the offer.（その話、受けてくれるといいな）' },

    // R fix: V2 (blind 65 %): "grows quiet and unsure" was the easy reject. Now "warms up and pitches her own ideas",
    //   a keyword trap from the job talk; she never pitches anything.
    // why: calms down ← broken script: nerves fade once the talk turns to work (Let's Move); pitches ← the job
    //   offer + "great work" heard as her selling herself
    { id: 'g2', skill: 'gist', level: 'B2', point: 'starstruck', reveals: ['loud'], seg: [0, 59.6],
      stem: 'How does Leslie behave as the meeting goes on?',
      choices: ['She gets more and more carried away', 'She calms down once they talk about work',
                'She warms up and pitches her own ideas'], a: 0,
      cue: '後半、自分の声について何と言うか。',
      line: 'I’m *getting louder now and I can’t stop*',
      said: '黙ってうなずく所から、最後は声が大きくて止まらないと謝るほど興奮していく。',
      mean: '憧れの人の前で、どんどん舞い上がる。緊張がほぐれるのではなく、加速していく。',
      trap: '仕事の話になると落ち着く、というよくある流れを予想しやすい。後半の自分への実況が答え。',
      use: 'Sorry, I’m a little starstruck.（すみません、ちょっと舞い上がってて）' },

    // why: her program ← "Let's Move program" comes later, and Chicago is said here; park ← "national parks" comes
    //   right after
    { id: 'd1', skill: 'detail', level: 'B1', point: 'job', seg: [3.8, 9.9],
      stem: 'What job is Leslie thinking about taking?',
      choices: ['Running a new office in the Midwest', 'Running Michelle’s program in Chicago',
                'Running a national park near Chicago'], a: 0,
      cue: '「considering a job」のあと、running のあと。',
      line: 'She’s *considering a job* with us *running the new Midwest Bureau* in Chicago.',
      said: '「彼女は、シカゴにできる中西部支局を率いる仕事を検討中です」と紹介する。',
      mean: 'run ＝ 運営する、率いる。bureau は役所の「局・支局」。',
      trap: 'Chicago が聞こえるので、あとのシカゴの話と混ざりやすい。running のすぐあとを聞く。',
      use: 'I’m considering a job in Boston.（ボストンの仕事を考えてる）' },

    // R fix: V1/V2 (blind 55 %): knowing she's from Chicago gives "fond" away. "Knows it better than he does" is the
    //   other reading of "you know how I feel"; "so you like it! — That's right" settles it.
    // why: knows it ← "you know how I feel" heard as "you know I'm the expert"; not discuss ← "you know how I feel"
    //   heard as "let's not go there" (察して)
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'feel', reveals: ['thatsright'], seg: [9.35, 15.05],
      stem: 'When Grant mentions Chicago, what does Michelle’s reply suggest?',
      choices: ['That she’s very fond of the city', 'That she knows it better than he does',
                'That she’d rather not talk about it'], a: 0,
      cue: '返事のあと、次の人の言葉と「That’s right」。',
      line: '*you know how I feel* about Chicago. — …you are from Chicago, so you like it! — That’s right',
      said: '「シカゴへの思いは知ってるでしょ」と言い、返事に「そう」。',
      mean: 'you know how I feel about ～ ＝ 言うまでもない。ここでは「大好き」。',
      trap: '「察して」に似て、話したくない意味にも取れる。That’s right で決まる。',
      use: 'You know how I feel about pizza.（私がピザ好きなの知ってるでしょ）' },

    // C2: who is the joke on? (cf. f1)
    // anchor: 9.9–11.3 s "you know how I feel about Chicago" already says it; 12.2–13.7 s the reply "you are from
    //   Chicago, so you like it!" tells Michelle her own background and feelings; 13.7 s "That's right": she just
    //   agrees, and takes no jab
    // why: Chicago ← "so you like it" can sound like "only because you're from there", a dig at the city; Michelle ←
    //   "you know how I feel" heard as a boast that the reply pokes at
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'feel', reveals: ['thatsright'], seg: [9.35, 15.05],
      stem: 'In the reply about Chicago, who is the joke on?',
      choices: ['Leslie, for explaining Michelle to herself', 'Chicago, as a city only locals could like',
                'Michelle, for being so proud of her city'], a: 0,
      cue: '相手が言ったことと、返事が足したこと。',
      line: 'you know how I feel about Chicago. — Yeah, *you are from Chicago, so you like it!*',
      said: '「シカゴへの気持ちは知ってるでしょ」に「シカゴ出身だから好きですよね！」と返す。',
      mean: '本人が分かっていることを、本人に説明している。クイズの答えのようで、笑われるのは答えた側。',
      trap: 'so you like it を街への皮肉と取りやすいが、相手は That’s right と素直に受ける。',
      use: 'You’d know better than me.（私より君のほうが詳しいよね）' },

    // R fix: V2 (blind 60 %): the key was the only gracious choice. "Lets it go and turns back to Grant" is a
    //   gracious near miss, refuted by "people like you" (said to Leslie).
    // why: corrects ← a Japanese-style polite correction (そうですね、ただ…) expected after an odd remark; Grant ←
    //   ignoring an awkward remark is the polite script, and Grant was the one she spoke to
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'thatsright', reveals: ['feel', 'passionate'], seg: [9.35, 18.55],
      stem: 'How does Michelle handle the odd reply about Chicago?',
      choices: ['She agrees and turns it into praise', 'She politely corrects what was said',
                'She lets it go and turns back to Grant'], a: 0,
      cue: '「That’s right」のあと、話をどこへつなぐか。',
      line: '*That’s right*, and we… *passionate people like you*…',
      said: '「その通り」と受け、すぐ「あなたのように情熱的な人」とほめる話につなぐ。',
      mean: '変な返事を正さず、受けてほめ言葉に変える。相手を楽にする対応。',
      trap: '変な返事には訂正か聞き流しを予想しやすい。and のあとの you が誰に向くかを聞く。',
      use: 'That’s right, and speaking of which…（そうそう、それで言うと…）' },

    // why: hikers ← "national parks" and later "hiking"; from Chicago ← "Chicago" is said three times just before
    { id: 'd2', skill: 'detail', level: 'B1', point: 'passionate', seg: [12.85, 18.55],
      stem: 'What kind of people does Michelle bring up next?',
      choices: ['Passionate people like Leslie', 'Young people who love hiking', 'People from Chicago like her'], a: 0,
      cue: '「That’s right, and」のあと、people の前。',
      line: 'we… *passionate people like you* in our national parks.',
      said: '「あなたのような情熱的な人」と言って、国立公園の話を始める。',
      mean: 'passionate ＝ 情熱的な。レスリーのことをほめつつ、仕事の話へ移っている。',
      trap: 'Chicago が3回聞こえた直後なので、シカゴの人の話に思える。people の前の語を聞く。',
      use: 'We need passionate people like you.（あなたのような情熱的な人が必要です）' },

    // why: thousands ← "hundreds of" heard, then the m lost; millions ← "hundreds of" lost; billions ← "-llions" heard
    { id: 'n1', skill: 'number', level: 'B1', point: 'visitors', seg: [18.55, 21.75], keep: true,
      stem: 'How many visitors a year do the parks get, says Michelle?',
      choices: ['Hundreds of thousands', 'Millions', 'Hundreds of millions', 'Billions'], a: 2,
      cue: '「they get」のあと、visitors の前。',
      line: 'they get *hundreds of millions* of visitors each year.',
      said: '「国立公園には毎年、何億人もの人が来る」と話す。',
      mean: 'hundreds of millions ＝ 何億。英語に「億」はなく、百万がいくつかで数える。',
      trap: 'millions の前の hundreds of は弱く速い。数字は前から順に組み立てて聞く。',
      use: 'Millions of people visit every year.（毎年何百万人もの人が訪れる）' },

    // why: the figure ← the question comes right after a big number; stop ← "Are you nodding…?" heard as a
    //   complaint (なぜうなずくの)
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'nodding', seg: [18.55, 25.15],
      stem: 'What is Michelle doing with her question about the nodding?',
      choices: ['Gently getting Leslie to speak up', 'Checking that Leslie followed the figure',
                'Asking Leslie to stop nodding at her'], a: 0,
      cue: '質問のあと、相手が何をし始めるか。',
      line: '*Are you nodding because you agree with me?* — Yes, I do agree with you.',
      said: '黙ってうなずき続けるレスリーに、「うなずいてるのは、賛成だから？」と聞く。',
      mean: '黙ったままの相手に、話すきっかけを渡す軽い問いかけ。からかい半分のやさしさ。',
      trap: '「なぜうなずくの」と責めているように取りやすい。質問のあと、相手が話し出すかを聞く。',
      use: 'Is that a yes?（それって、イエスってこと？）' },

    // R fix: V2 (blind 55 %): "a question nobody had asked" was refuted by the question itself. Now the eager-fan
    //   misreading (she agrees before hearing the point); she nodded through it and answers after the question.
    // why: history ← "throughout history" heard as the parks' history; too soon ← the nodding read as agreeing
    //   before Michelle had finished
    { id: 'h1', skill: 'humor', level: 'C1', point: 'forever', seg: [21.75, 28.8],
      stem: 'What makes Leslie’s answer to that question funny?',
      choices: ['She stretches a simple yes to all of time', 'She brings in the long history of the parks',
                'She agrees before hearing the whole point'], a: 0,
      cue: '最初の短い返事のあと、範囲が広がる。',
      line: 'I agree with you *on all things throughout history and until the end of time forever*.',
      said: '「賛成です。歴史上のすべてのことに、時の終わりまで永遠に賛成です」と答える。',
      mean: '一つの意見への賛成を、すべての事・永遠にまで広げる。憧れが強すぎる大げさな返事。',
      trap: 'history を公園の歴史と取ると話がずれる。同意の範囲がどこまで広がるかを聞く。',
      use: 'I couldn’t agree more.（大賛成です）' },

    // C2: a plain-English paraphrase (cf. h1)
    // anchor: 23.8–25.1 s "Yes, I do agree with you" answers one question; 25.2–28.8 s "on all things throughout history
    //   and until the end of time forever" stretches it past the parks to everything, ever
    // R fix: V2 + K5 (blind 50 %): "such a fan" was the only choice with feeling in it. All three are now flat
    //   statements of agreement that differ only in scope.
    // why: the parks ← scope shift: the agreement heard as about the point just made; a long time ← "throughout
    //   history" taken as the past only, a long-time supporter
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'forever', seg: [21.75, 28.8],
      stem: 'Which plain-English version keeps what Leslie means by her answer?',
      choices: ['“I’d agree with anything you ever say.”', '“I agree with every word about the parks.”',
                '“I’ve agreed with you for a very long time.”'], a: 0,
      cue: '「agree with you」のあと、何まで広がるか。',
      line: 'Yes, I do agree with you. I agree with you *on all things*…',
      said: '「賛成です」のあと、「すべてのことに、歴史を通して、時の終わりまで」と付け足す。',
      mean: '今の話への同意でなく、相手の言うことなら何でも、という宣言。伝えているのは憧れの大きさ。',
      trap: '最初の I do agree だけなら公園の話への賛成。続く on all things で範囲が変わる。',
      use: 'Whatever you say, I’m in.（あなたが言うなら何でも乗るよ）' },

    // R fix: V1/V2 + S3 (blind 50 %): "kids’" in the key gave away what Let's Move is (world knowledge), and the cue's
    //   "program" was a word only the key had. The key is now "her program into the parks"; the cue no longer names it.
    // why: move ← "Let's Move" + Chicago and the new bureau; schools ← a kids' program usually goes into schools,
    //   and "kids" is said right after
    { id: 'd3', skill: 'detail', level: 'B2', point: 'letsmove', seg: [28.8, 38.5],
      stem: 'What has Grant helped Michelle do?',
      choices: ['Bring her program into the parks', 'Move her program to Chicago', 'Take her program into schools'], a: 0,
      cue: '「He’s helped me」のあと、動詞と into のあと。',
      line: 'He’s helped me *integrate the Let’s Move program into our national parks*.',
      said: '「Let’s Move の取り組みを国立公園に取り入れるのを手伝ってくれた」と話す。',
      mean: 'integrate A into B ＝ AをBに組み込む。子どもの運動を公園で。',
      trap: 'Let’s Move の move を「移転」と取りやすい。ここは名前。',
      use: 'Let’s fit it into our schedule.（予定に組み込もう）' },

    // why: checks ← "you know" taken as a real question (知ってる?); unsure ← a filler heard as hesitation
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', reveals: ['outside'], seg: [31.85, 38.5],
      stem: 'Right after naming the program, how does Michelle go on?',
      choices: ['She fills in what it means with examples', 'She checks whether Leslie has heard of it',
                'She pauses, unsure how to describe it'], a: 0,
      cue: '「national parks」のあと、文頭の2語とその後。',
      line: '*You know*, getting kids outside, rock climbing, hiking.',
      said: '「ほら、子どもを外に連れ出したり、ロッククライミングやハイキングをしたり」と続ける。',
      mean: 'you know ＝ ほら。質問ではなく、具体例で中身を補う前置き。',
      trap: '「知ってる？」と取ると質問に聞こえるが、答えを待たずに例が続く。あとに並ぶ語を聞く。',
      use: 'You know, small stuff, like dishes.（ほら、皿洗いみたいな細かいこと）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'outside', seg: [35.25, 38.5],
      stem: 'Type what Michelle says: “You know, ___, rock climbing, hiking.” (3 words)', answer: 'getting kids outside',
      cue: '「You know」のあと。最初の語の t は弾む。',
      line: 'You know, *getting kids outside*, rock climbing, hiking.',
      said: '「子どもを外へ、ロッククライミング、ハイキング」と例を挙げる。',
      mean: 'get ＋ 人 ＋ outside ＝ 人を外に出す。取り組みの中身を一言で。',
      trap: 'getting の t は弾んで「ゲリン」、kids‿outside は「キッザウ」とつながる。',
      use: 'Let’s get the kids outside.（子どもたちを外に出そう）' },

    // R fix: V2 + K5 (blind 55 %): the key was the only one not starting "She thinks…", and "can't hear her" was
    //   refuted by "so loud". Now three readings of why she says sorry; "I can't stop" settles it.
    // why: cut in ← "my apologies" heard as an apology for interrupting; offended ← a Japanese-style apology read
    //   as sensing the other person is upset
    { id: 'i2', skill: 'infer', level: 'B2', point: 'loud', seg: [38.45, 44],
      stem: 'What does Leslie’s apology show?',
      choices: ['She knows she’s loud but can’t help it', 'She thinks she cut in on Michelle', 'She thinks Michelle is upset with her'],
      a: 0,
      cue: '「I’m getting」のあと、何ができないか。',
      line: 'I’m sorry I’m talking so loud. I’m getting louder now *and I can’t stop*…',
      said: '「声が大きくてごめん。どんどん大きくなって止まらない」と謝る。',
      mean: '興奮を自分で実況している。分かっていても抑えられないほど舞い上がる。',
      trap: 'sorry から相手を気にした謝罪に思える。自分の声の実況で、can’t stop が気持ちの強さ。',
      use: 'Sorry, I get loud when I’m excited.（ごめん、興奮すると声が大きくなるの）' },

    // why: lower ← an /l/ start and the same "-er", the opposite meaning; loud enough ← "loud" + a weak "-er n-" heard
    //   as "enough"
    { id: 's1', skill: 'sound', level: 'B2', point: 'loud', seg: [40.45, 44],
      stem: 'Fill the gap: “I’m getting ___ and I can’t stop.”',
      choices: ['louder now', 'lower now', 'loud enough'], a: 0,
      cue: '謝ったあとの2文目、getting のあと。',
      line: 'I’m getting *louder now* and I can’t stop',
      said: '「どんどん声が大きくなって、止まらない」と言う。',
      mean: 'get louder ＝ もっと大きくなる。louder‿now がつながり、「ラウダナウ」と聞こえる。',
      trap: 'lower（低く）は逆の意味。直前の「声が大きくてごめん」と向きが合う語を選ぶ。',
      use: 'It’s getting colder now.（だんだん寒くなってきた）' },

    // R fix: K6 + V2 (blind 65 %): the key was the only choice without "but", and the only wholly positive one. All
    //   three are now "X, and Y".
    // why: wrap up ← "Yeah, well" and "Good to meet you" sound like a polite exit; doubtful ← "change happens one
    //   person at a time" heard as a warning about the job
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'warm', reveals: ['takejob'], seg: [43.95, 57.8],
      stem: 'How does Michelle seem to feel about Leslie at the end?',
      choices: ['Warm, and keen to have her on board', 'Polite, and eager to wrap things up',
                'Amused, and doubtful she’s a good fit'], a: 0,
      cue: '最後の3つの文の中身。',
      line: 'I hope you take the job. *Change happens one person at a time.*',
      said: '「ぜひ仕事を受けてね。変化は一人から」と言い、「会えてよかった」と締める。',
      mean: '仕事を勧め、相手を「変化を起こす一人」として励ましている。社交辞令以上の好意。',
      trap: 'Yeah, well は切り上げの合図にも聞こえるが、続く言葉は励まし。最後まで聞く。',
      use: 'Change starts with one person.（変化は一人から始まる）' },
  ]
};
