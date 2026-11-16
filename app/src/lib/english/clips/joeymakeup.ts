// REVIEW 2026-11-16: pass 4, fix 15, drop 1, new 0; ear checks 1
// OPEN: n1 (December) is partly guessable from world knowledge (a month question about Thanksgiving hints the month
// moved); it's the clip's only number and the audio settles it, so it's kept.
// “Joey Is Wearing Makeup | Friends” (the official Friends channel, Best of Season 1): Joey turns up in makeup with
// news of a modeling job, and then Monica offers to cook Thanksgiving dinner and checks everyone's plans.
// Segments from the captions, words from whisper (2026-11-16). Whisper's timings here come in 4 s blocks, so every
// time is from the captions (which read as hand-made). Only Joey, Chandler and Phoebe are named in the audio; stems
// name Monica where the title and the scene settle it. Left out: the opening “And this from the … department” (whisper
// “crime for help”, captions “guy for health”), and “How can they do this to us?”, which needs backstory.
// EAR CHECK: 63.1 s pr1 — the cut falls after "supposed to…" (62.7 s) and before "I'll work on the lumps" (63.6 s)
import type { Clip } from '../types.ts';

export const joeymakeup: Clip = {
  id: 'joeymakeup', video: 'vjpdPeVFW2M', title: 'Joey Is Wearing Makeup', dur: 96, wpm: 172, band: 'slow',
  tags: ['友だち', '家'],
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: blind 50 % — only the key had a coherent second half; both distractors now follow the real first half
    // and a real line of the second (V2/K3). Reveals `offer` now, since its key says Monica sorts the holiday out
    // why: "trip home" ← "Joey, you're going home, right?" + the holiday talk; "complain" ← "How can they do this to us?"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'scene', reveals: ['offer'], seg: [0, 83.3],
      stem: 'What happens over the course of this clip?',
      choices: ['Joey brings job news, then Monica sorts out the holiday',
                'Joey brings job news, then the friends plan a trip home',
                'Joey gets teased, then the friends complain about the holiday'], a: 0,
      cue: '前半はジョーイの話、後半はだれが何を提案するか。',
      said: '前半はジョーイのモデルの仕事の話。後半は感謝祭をどうするか、一人ずつ確かめていく。',
      mean: '二つの話題の場面。後半はモニカの提案から、みんなの予定の確認に移る。',
      trap: '帰る人の話や不満の一言が耳に残りやすいが、話はモニカの提案と予定の確認に進む。',
      use: 'So, what are your plans for the holidays?（で、休みの予定は？）' },

    // R fix: blind 60 % — "sharply" was a filler; it's now "calmly, nothing special", the opposite misreading of a
    // short "Yes, I am" (V2/K3)
    // why: "shyly" ← the usual reaction to being caught in makeup; "calmly" ← "Yes, I am" read as a flat, plain answer
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'proud', seg: [7.7, 17.7],
      stem: 'When a friend asks about his makeup, how does Joey answer?',
      choices: ['Proudly, as if it were big news', 'Shyly, as if he had been caught out',
                'Calmly, as if it were nothing special'], a: 0,
      cue: '「Yes, I am」のあと、続けて何を名乗るか。',
      line: 'Yes, I am. *As of today, I am officially* Joey Tribbiani, actor/model.',
      said: '「そうだよ。今日から正式に、俳優兼モデルのジョーイ・トリビアーニだ」と答える。',
      mean: 'officially と肩書きを名乗り、メイクを誇らしく思っている。',
      trap: 'メイクを指摘されたら照れるか、さらっと流すと考えやすい。肩書きを名乗る言い方で判断。',
      use: 'As of today, I’m officially on vacation.（今日から正式に休暇です）' },

    // R drop: f1 ("as of today"; deleted, as the bank shows no sign of having shipped). Without the quote in the stem,
    // common sense answers it (a new title holds from today); with it, it's a known phrase (V1/V2/S2). a2 keeps the
    // line; f2 keeps the phrase quota.

    // R fix: blind 55 % — the stem quoted "That's so funny", and the distractors didn't fit the moment; they're now a
    // compliment reading and a laugh at the news (V2/K3/S2). Ear check gone: the man/woman twist is in the words
    // why: "looks the part" ← "you look more like Joey Tribbiani" heard, the "man/woman" missed; "odd news" ← "That's so
    // funny" taken at face value
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'funny', seg: [17.6, 23.5],
      stem: 'When a friend answers Joey’s new title, what is he doing?',
      choices: ['Setting up a joke about how Joey looks', 'Telling Joey he really looks the part now',
                'Laughing at how odd the job news sounds'], a: 0,
      cue: '「cause」のあと、肩書きをどう言い換えるか。',
      line: 'That’s so funny, ’cause I was thinking you look more like Joey Tribbiani, *man/woman*.',
      said: '「面白いね、僕には『男／女』に見えたから」と返す。',
      mean: 'actor/model の形をまねて、メイクをからかう前振り。本気の笑いではない。',
      trap: 'That’s so funny を文字通りに取りやすい。cause のあとにオチが来る形に注意。',
      use: 'That’s funny, because I heard the opposite.（おかしいな、逆の話を聞いたよ）' },

    // R fix: blind 60 % — the stem quoted the marker under test; it now names the moment (S2/§9.2)
    // why: "checks they follow" ← you know heard as 分かる？; "buys time" ← you know as a pause-filler, its usual job
    { id: 'm1', skill: 'marker', level: 'B2', point: 'youknow', reveals: ['clinic'], seg: [24.5, 29.3],
      stem: 'When Joey starts to explain the modeling job, what does his opening do?',
      choices: ['It points to something they’ve all probably seen', 'It checks that they’re following what he says',
                'It buys him time to think of an answer'], a: 0,
      cue: '「you know」のすぐあとの名詞と、最後の上がる調子。',
      line: 'Well, *you know those posters* for the City Free Clinic?',
      said: '「ほら、無料診療所のポスター、あるでしょ」と切り出す。',
      mean: 'you know those ～? ＝「〜ってあるじゃない」。相手も見たことがある物を指す。',
      trap: 'you know は間つなぎにも使うが、ここは those ～ で物を指している。',
      use: 'You know that café on the corner?（角のカフェ、知ってるでしょ）' },

    // why: "health department ads" ← the opening "department" line and "health"; "magazine" ← model = 雑誌 (katakana frame)
    { id: 'd1', skill: 'detail', level: 'B1', point: 'clinic', seg: [24.5, 32],
      stem: 'What is Joey modeling for?',
      choices: ['Posters for the city’s free clinic', 'Ads for the city health department', 'A magazine about healthy living'], a: 0,
      cue: '「Well, you know those」のあと。', line: 'you know those *posters for the City Free Clinic*?',
      said: '「市の無料診療所のポスター、知ってるでしょ」と説明している。',
      mean: 'モデルといってもポスターの仕事。病院系の広告だと分かる。',
      trap: 'モデルと聞くと雑誌を思い浮かべやすい。healthy が聞こえても、それは友だちの言葉。',
      use: 'Is there a free clinic nearby?（近くに無料の診療所はありますか）' },

    // R fix: blind 55 % — "warns about a bad clinic" was a filler; it's now "a doctor from the clinic", a natural guess
    // for clinic posters (V2/K3)
    // why: "healthy guys" ← the friend's "healthy, healthy, healthy" guess; "a doctor" ← clinic posters usually show staff
    { id: 'i2', skill: 'infer', level: 'C1', point: 'posters', reveals: ['lyme'], seg: [28.75, 40.8],
      stem: 'From what is said after the “healthy… guys?” guess, what are the posters like?',
      choices: ['Each one shows a person with an illness', 'Each one shows a healthy, fit young man',
                'Each one shows a doctor from the clinic'], a: 0,
      cue: '「healthy」の予想のあと、病名がいくつ出るか。',
      line: 'the *asthma guy*’s really cute … *Lyme disease* is open',
      said: '「ぜんそくの人がかわいい」「ライム病の役が空いてる」と病名が出てくる。',
      mean: 'ポスターは病気ごとのモデル。「健康な人」という予想とは逆。',
      trap: 'healthy が三回も聞こえるので引かれやすいが、それは友だちの予想。後の病名で確かめる。',
      use: 'Which one are you supposed to be?（どれの役なの？）' },

    // R fix: blind 55 % — "you're going to" was the default reading; a fourth near-sound (gotta) makes all four strong
    // (V2/K4). Ear check gone: whisper's "gonna" and the captions' "going to" are the same words
    // why: "you want to" ← gonna and wanna sound alike; "you were going to" ← you're and you were blur; "you got to" ←
    // gotta, the third -a reduction
    { id: 's1', skill: 'sound', level: 'B2', point: 'which', seg: [34.6, 37.75],
      stem: 'Fill the gap: “Do you know which one ___ be?”',
      choices: ['you’re going to', 'you want to', 'you were going to', 'you got to'], a: 0,
      cue: '「which one」のあと、短くつながる部分。',
      line: 'Do you know which one *you’re gonna* be?',
      said: '「どれの役になるか分かってるの？」と聞いている。',
      mean: 'you’re going to が「ヨガナ」のように縮まる。これからのことを聞く形。',
      trap: 'gonna と wanna は似て聞こえる。you’re の r も弱く、were と取りやすい。',
      use: 'What are you gonna order?（何を頼むつもり？）' },

    // R fix: the seg stopped before "Good luck, man. I hope you get it", the evidence against "rather avoid" (S4); it now
    // runs to 43.4
    // why: "has Lyme disease" ← the disease name read as his own health; "rather avoid" ← a disease role sounds unwelcome,
    // so "open" read as a warning
    { id: 'i1', skill: 'infer', level: 'C1', point: 'lyme', reveals: ['posters'], seg: [35, 43.4],
      stem: 'What does Joey suggest when he says it’s “open”?',
      choices: ['He hopes to get the Lyme disease poster', 'He is afraid he may have Lyme disease',
                'He would rather avoid the Lyme disease one'], a: 0,
      cue: '「No」のあと、「so…」で言いよどむ部分。',
      line: 'But I hear *Lyme disease is open*, so…',
      said: '「まだ分からない。でもライム病の役が空いてるらしいから…」と言う。',
      mean: 'open ＝ 枠が空いている。病気の役でもいいから取りたい、という含み。',
      trap: '病名を本人の体調と取ると話がずれる。open は仕事の空きにも使う。',
      use: 'Is this seat open?（この席、空いてますか）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'luck', seg: [40.6, 43.4],
      stem: 'Type what he says: “Good luck, man. I ___.” (4 words)', answer: 'hope you get it',
      cue: '「Good luck, man」のすぐあと。', line: 'Good luck, man. I *hope you get it*.',
      said: '「頑張って。取れるといいね」と励ましている。',
      mean: 'get it ＝ その役（仕事）を取る。オーディションや面接の前によく言う。',
      trap: 'get it がつながって「ゲリッ」に近く、t もほぼ消える。you も弱く短い。',
      use: 'Good luck! I hope you get it.（頑張って、受かるといいね）' },

    // R fix: blind 60 % — both distractors were off the scene's path; they're now built on two lines that are said
    // ("going home", "How can they do this to us?") (V2/K3)
    // why: "who'll come home with her" ← "Joey, you're going home, right?"; "complains, then calls it off" ← "How can they
    // do this to us? It's Thanksgiving."
    { id: 'g2', skill: 'gist', level: 'B1', point: 'offer', seg: [47.9, 83.3],
      stem: 'What is the second half of the clip mainly about?',
      choices: ['Monica offers to host dinner and checks everyone’s plans',
                'Monica asks who will come home with her for the holiday',
                'Monica complains about the holiday, then calls it off'], a: 0,
      cue: '「I’ll tell you what」のあと、提案と質問の流れ。',
      said: 'モニカが「うちで夕食を作る」と言い、ジョーイ、チャンドラー、フィービーの予定を聞く。',
      mean: '家に帰れない仲間で感謝祭をする、という話の始まり。',
      trap: 'going home や不満の一言が耳に残ると、ほかの話に見える。提案のあとの質問の流れを追う。',
      use: 'How about dinner at my place?（うちで夕食はどう？）' },

    // R fix: blind 85 % — the stem quoted the phrase under test; it now names the moment, and "complaint" is now "bad
    // news", a coherent reading of the phrase (S2/V2)
    // why: "something she knows" ← "tell you" taken literally; "bad news" ← "I'll tell you what" heard as a warning
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'tellyou', reveals: ['offer'], seg: [52.2, 56.8],
      stem: 'Right after the Thanksgiving complaint, what does Monica’s opening phrase do?',
      choices: ['It brings in a plan she is about to suggest', 'It warns them that some bad news is coming',
                'It leads into something she knows and they don’t'], a: 0,
      cue: 'このすぐあとに来る文の形（How about…?）。',
      line: 'Okay, *I’ll tell you what*. How about if I cook dinner at my place?',
      said: '「よし、こうしよう。うちで夕食を作るのはどう？」と提案している。',
      mean: 'I’ll tell you what ＝「じゃあ、こうしよう」。提案の前置き。',
      trap: 'tell を文字通り「話す・明かす」と取りやすい。すぐ後が How about なら提案の合図。',
      use: 'Tell you what, I’ll pay this time.（じゃあ、今回は僕が払うよ）' },

    // R fix: blind 60 % — only the key had the odd "lumps" detail; a no-lumps version of the same dish now competes (V2)
    // why: "no lumps" ← "with the lumps" heard as "without", and Monica says they're not supposed to have them; "gravy" ←
    // another classic side, with the lumps word kept
    { id: 'd2', skill: 'detail', level: 'B1', point: 'potatoes', seg: [55.15, 60.7],
      stem: 'What does a friend ask Monica to make?',
      choices: ['Mashed potatoes with the lumps', 'Mashed potatoes with no lumps', 'Gravy without any lumps'], a: 0,
      cue: '「just like Mom」のすぐあとの質問。', line: 'Will you make the *mashed potatoes with the lumps*?',
      said: '「ダマのあるマッシュポテト、作ってくれる？」と頼んでいる。',
      mean: 'lumps ＝ ダマ。母の作り方を、ダマまでそのまま再現してほしい。',
      trap: 'ダマは普通ないほうがいいので「なし」を選びやすい。with the か without かを聞く。',
      use: 'Can you make it without onions?（玉ねぎ抜きで作れますか）' },

    // why: "Would you" ← the more polite form many learners expect; "Won't you" ← an n't caught in "make"
    { id: 's2', skill: 'sound', level: 'B2', point: 'willyou', reveals: ['potatoes'], seg: [56.6, 60.7],
      stem: 'Fill the gap: “___ make the mashed potatoes with the lumps?”',
      choices: ['Will you', 'Would you', 'Won’t you', 'Can you'], a: 0,
      cue: '質問の最初、短い二語。', line: '*Will you* make the mashed potatoes with the lumps?',
      said: '「ダマのあるマッシュポテト、作ってくれる？」と頼んでいる。',
      mean: 'Will you は「ウィリュ」とつながる。家族や友だちへの気軽な頼み方。',
      trap: 'would の d、won’t の t は聞こえにくい。w の後の母音が「イ」か「ウ」かで聞き分ける。',
      use: 'Will you grab me a water?（お水取ってくれる？）' },

    // R fix: blind 55 % — "explains how to make them smooth" didn't fit the cut; it's now "finishes her point", the
    // move she was starting (V2/K3)
    // why: "finishes her point" ← the sentence she has begun; "make them himself" ← "not supposed to" read as a refusal
    { id: 'pr1', skill: 'predict', level: 'B2', point: 'lumps', reveals: ['potatoes'], seg: [56.6, 63.1],
      then: [63.1, 65.5],
      stem: 'After Monica’s “they’re not actually supposed to…”, what kind of move comes next?',
      choices: ['She drops her point and goes along with him', 'She finishes her point that lumps are a mistake',
                'She tells him to make them himself, then'], a: 0,
      cue: '途中で言葉を切った、その切り方と間。',
      line: 'You know they’re not actually supposed to… *I’ll work on the lumps*.',
      said: '「本当はダマはないほうが…」と言いかけてやめ、「ダマも頑張る」と言う。',
      mean: '言いかけた正論を引っこめて、相手に合わせている。work on ＝ 取り組む。',
      trap: 'not supposed to を断りと取りやすい。途中で切るのは、言うのをやめたサイン。',
      use: 'Okay, I’ll work on it.（分かった、やってみる）' },

    // R fix: blind 50 % — "usually hosts" was a filler; it's now a work reason, a common script for skipping holidays (V2/K3)
    // why: "just decided" ← "boycotting" heard, "still" lost; "has to work" ← skipping a holiday for work
    { id: 'i3', skill: 'infer', level: 'B2', point: 'boycott', seg: [68.3, 76.3],
      stem: 'What does Monica’s question to Chandler tell us about him?',
      choices: ['He has skipped these holidays for a while', 'He has only now decided to skip them',
                'He has to work through them this year'], a: 0,
      cue: '「you’re」のすぐあと、短い副詞。',
      line: 'And I assume, Chandler, you’re *still* boycotting all the pilgrim holidays.',
      said: '「チャンドラーは相変わらず、その祝日はボイコット中よね」と聞く。',
      mean: 'still ＝ 前から続いている。毎年参加しないのを、皆知っている。',
      trap: 'boycotting に気を取られると still を落としやすい。前からかは still で決まる。',
      use: 'Are you still working there?（まだそこで働いてるの？）' },

    // R fix: blind 85 % — the stem quoted the word under test; it now names the moment (S2/§9.2)
    // why: "works through them" ← skipping a holiday because of work, a common script; "with family" ← the usual holiday plan
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'boycott', seg: [68.3, 76.3],
      stem: 'What does Monica assume Chandler is doing about these holidays?',
      choices: ['Refusing to take part in them', 'Working all through them', 'Spending them with his family'], a: 0,
      cue: '答えの「every single one」も合わせて。',
      line: 'you’re still *boycotting* all the pilgrim holidays. — Yes, every single one of them.',
      said: 'ピルグリムに関係する祝日は全部参加しない、と本人も認める。',
      mean: 'boycott ＝ 抗議として参加しない。祝日に使うのは大げさで、冗談めいた言い方。',
      trap: 'ボイコットは日本語では「不買」の意味が強い。ここは行事に加わらないこと。',
      use: 'I’m boycotting that store.（あの店には行かないことにしてる）' },

    // R fix: blind 55 % — "the rest of the family" was a filler; it's now "her grandma's husband", a near word (V2/K3)
    // why: "her own boyfriend" ← "her" taken as Phoebe herself; "husband" ← a grandma's partner expected to be a husband
    { id: 'd4', skill: 'detail', level: 'B2', point: 'grandma', seg: [76.2, 83.3],
      stem: 'Who will Phoebe spend the holiday with?',
      choices: ['Her grandma and her grandma’s boyfriend', 'Her grandma and her own new boyfriend',
                'Her grandma and her grandma’s new husband'], a: 0,
      cue: '「Yeah, and」のあと、だれのことか。', line: 'with your grandma? — Yeah, and… *her boyfriend*.',
      said: '「おばあちゃんと？」「うん、それとおばあちゃんの彼氏」と答えている。',
      mean: 'her は直前の grandma を指す。おばあちゃんに彼氏がいるのが少し意外な点。',
      trap: '自分の彼氏なら my と言うはず。her は直前の女性。夫でなく boyfriend。',
      use: 'I’m staying with my aunt and her husband.（おばとその夫の家に泊まります）' },

    // R fix: blind 50 % — "forgotten when the holiday is" didn't explain a laugh; it's now a mix-up with Christmas, built
    // on "December" (V2/K3)
    // why: "mixes it up with Christmas" ← "December" heard, the reason lost; "much older" ← a grandma's boyfriend
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lunar', reveals: ['december', 'grandma'], seg: [76.2, 83.3],
      stem: 'Why does the audience laugh at Phoebe’s last line?',
      choices: ['Her reason for moving the date is a strange one', 'She mixes Thanksgiving up with Christmas',
                'She hints that the boyfriend is a lot older'], a: 0,
      cue: '最後の「’cause」のあとの一語。',
      line: 'we’re celebrating Thanksgiving in December *’cause he’s lunar*',
      said: '「彼が太陰暦で動く人だから、感謝祭は12月」と、当然のように言う。',
      mean: '月の暦で動く彼氏、という変わった理由をさらっと言うのが笑い。',
      trap: '12月と聞いてクリスマスと混同したと取りやすいが、わざと動かしている。lunar がオチ。',
      use: 'She’s a vegetarian, so we’re having pasta.（彼女はベジタリアンだから、パスタにする）' },

    // why: November ← when Thanksgiving usually falls; January ← "lunar" + the lunar new year
    { id: 'n1', skill: 'number', level: 'B1', point: 'december', reveals: ['grandma'], seg: [78.15, 83.3], keep: true,
      stem: 'When will Phoebe’s group celebrate Thanksgiving?',
      choices: ['In November', 'In December', 'In January'], a: 1,
      cue: '「celebrating Thanksgiving」のあとの月。',
      line: 'we’re celebrating Thanksgiving *in December* ’cause he’s lunar',
      said: '「彼が太陰暦だから、感謝祭は12月にやるの」と言っている。',
      mean: '普通の時期とは違う月に祝う。理由はおばあちゃんの彼氏。',
      trap: '感謝祭はふつう11月なので、知識で選びやすい。lunar から旧正月の1月も浮かびやすい。',
      use: 'We’re celebrating my birthday next week.（誕生日は来週お祝いするの）' },
  ]
};
