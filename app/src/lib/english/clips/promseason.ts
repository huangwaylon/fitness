// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
// “Prom Season | Parks and Recreation” (the official Parks and Recreation channel, Season 6): the Parks staff run a high
// school prom; three of them recall their own proms to camera, Leslie and Ron compete for a student helper, and Andy
// tries to talk April into enjoying it.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 264 s; whisper's lines after that are a
// loop. Untested: who speaks the opening complaints (0–15 s; no names in the audio), Andy's "bloom of youth" line at
// 123 s (garbled in both), April's reason at 153–156 s (a dark joke; only her last clause is used), the DJ stretch at
// 161–199 s (crowd overlap; "Grizzledum" garbled in both), "Run, Allison, run" at 226 s (speaker unclear), and
// "Congratulations, Ron. You've ruined prom" at 261 s (whose line it is decides whether it's praise). The stories to
// camera are named by their content, never by who is on screen. Nothing turns on "Yes!" at 64 s (whisper only).
// EAR CHECK: 40 s a2 — whisper "but I looked fly as hell", captions "but uh I would fly as hell" (assumed "looked";
//   the key, pleased with his look, rests on it)
import type { Clip } from '../types.ts';

export const promSeason: Clip = {
  id: 'promseason', video: 'oGUp36qcueM', title: 'Prom Season', dur: 289, wpm: 174, band: 'fast',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind pass 50 % ("really doing" flagged a hidden meaning; "offering to get rid of them" was weak); the
    //   stem is neutral, and a distractor now carries over the "Tell me about it" agreement just before
    // why: real tip ← "I have an idea" sounds like a helpful offer; joining in ← "Tell me about it" a few seconds
    //   earlier was agreement, so this reply can sound like more of the same
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'garbage', seg: [11.5, 17.6],
      stem: 'When someone offers “an idea” about the albums, what is he doing?',
      choices: ['Telling the man to quit complaining', 'Giving him a real tip for storing them',
                'Joining in his complaint about the gear'], a: 0,
      cue: '「I have an idea」のあと、何をすすめるか。',
      line: 'Hey, I have an idea. *Why don’t you throw them in the garbage?*',
      said: 'レコードの保管に文句を言う人に、「ゴミ箱に捨てたら？」と返す。',
      mean: 'Why don’t you ～? は提案の形だが、ここは「文句はやめろ」という皮肉。',
      trap: 'I have an idea で親切な提案や同意と取りやすい。提案の中身が乱暴なら皮肉を疑う。',
      use: 'Here’s an idea: why not ask her?（いい考えがある。彼女に聞いたら？）' },

    // why: grounded ← "my parents" comes right after; his job ← "impeached" points to an office he held
    { id: 'd2', skill: 'detail', level: 'B1', point: 'egged', seg: [17.5, 26.4],
      stem: 'In the first story to camera, why couldn’t he leave the house?',
      choices: ['People would throw eggs at him', 'His parents had grounded him', 'He had to stay and do his job'], a: 0,
      cue: '「couldn’t leave the house without」のあと。',
      line: 'I couldn’t leave the house *without being egged*.',
      said: '「だんがいされたばかりで、外に出れば卵をぶつけられた」と言う。',
      mean: 'egg は動詞で「卵をぶつける」。出れば必ず卵をぶつけられた。',
      trap: 'すぐあとに parents が出るので「外出禁止」と取りやすい。-ed で動詞と分かる。',
      use: 'I can’t go out without being recognized.（外に出ると必ず気づかれる）' },

    // R fix: blind pass 75 % (the key was the only hedged, two-part choice; "best night" was a filler); the
    //   distractors now each take one story's detail and lay it on all three
    // why: date who left ← "my date was pretty pissed" and "I left early" mixed into one pattern; grow up fast ← Ron's
    //   "felt like I had outgrown it" laid on all three
    { id: 'g2', skill: 'gist', level: 'B2', point: 'pastproms', seg: [17.5, 113.0],
      stem: 'What do the stories told to the camera have in common?',
      choices: ['None of them got a normal prom night', 'Each was let down by a date who left',
                'Each says prom made them grow up fast'], a: 0,
      cue: '3人がカメラに話す、自分のプロムの話。',
      said: '3人がそれぞれ自分のプロムを語る。どれも普通の楽しい一夜ではなかった。',
      mean: '高校のプロムを手伝う場面に、大人たちのほろ苦いプロムの思い出が差しこまれる構成。',
      trap: '一人の話（怒った相手、卒業した気分）を全員に広げやすい。3人に共通する点だけを残す。',
      use: 'My prom was a total disaster.（私のプロムは散々だった）' },

    // R fix: blind pass 50 % ("gets the details wrong" was weak); a distractor now reads the parents' kindness as
    //   guilt (申し訳ない)
    // why: mess ← "messed up" taken literally, as a mess to clear; feels bad ← "my parents threw me a prom" heard as a
    //   debt he can't repay
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'messedup', seg: [22.4, 29.0],
      stem: 'What does he mean when he sums up the living-room prom?',
      choices: ['It still bothers him, even today', 'He still has a mess to clean up', 'He still feels bad for his parents'],
      a: 0,
      cue: '「I think I’m still」のあと。',
      line: 'my parents threw me a prom in our living room… *I’m still messed up from it*.',
      said: '親が居間でプロムを開いてくれて「いまだに引きずってる」と言う。',
      mean: 'messed up ＝ 心に傷が残る。親の優しさが、かえってつらい思い出に。',
      trap: 'mess を「散らかす」や親への遠慮と取りやすい。messed up from ～ は傷が残ること。',
      use: 'That movie messed me up for weeks.（あの映画、何週間も引きずった）' },

    // why: Five ← the -teen ending is missed; Fifty ← -teen/-ty, told apart by stress
    { id: 'n1', skill: 'number', level: 'B1', point: 'fifteen', seg: [28.9, 36.2], keep: true,
      stem: 'In the second story to camera, how long was he at his prom?',
      choices: ['Five minutes', 'Fifteen minutes', 'Fifty minutes'], a: 1,
      cue: '「I was actually only」のあと、minutes の前。',
      line: 'I was actually only… for *15 minutes*.',
      said: '「実はプロムにいたのは15分だけ」と言う。',
      mean: '身じたくに時間をかけすぎた、という話の始まり。',
      trap: 'fifteen は -teen を強く長く言う。fifty なら前の FIF が強い。強さの位置を聞く。',
      use: 'I was only there for fifteen minutes.（15分しかいなかった）' },

    // R fix: K6/V2 (blind 50 %): the key was the only two-part choice ("Pleased; …"); all three are now one clause
    // why: sorry ← "my date was pretty pissed" heard as regret; embarrassed ← a listener's own verdict on the story,
    //   laid on him
    // retired: the ear-check policy: the key rests on “looked” (whisper “I looked fly as hell”, captions “I would fly
    //   as hell”, 40 s); back after the ear check
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'worthit', seg: [35.9, 42.4], retired: true,
      stem: 'Looking back, how does he feel about missing most of his prom?',
      choices: ['Pleased that he looked so good', 'Sorry that he let his date down', 'Embarrassed that he was so vain'],
      a: 0,
      cue: '「My date was pretty…」のあと、but に続く部分。',
      line: 'My date was pretty pissed, *but I looked fly as hell*.',
      said: '「相手はかなり怒ってた。でも俺は最高にキマってた」と言う。',
      mean: 'but のあとが本音。fly は「かっこいい」の俗語。相手の怒りより見た目、と満足している。',
      trap: '相手が怒った話で反省と取りやすい。but のあとに本人の評価が来る。',
      use: 'It was expensive, but it looked amazing.（高かったけど、最高だった）' },

    // R fix: blind pass 70 % (two fillers); a distractor is now the "put it in writing = I don't trust you" reading
    // why: doubt ← "get that in writing" is also what you say when you don't trust a promise; a letter ← "Thank you,
    //   Principal Russell" just before
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'writing', seg: [43.0, 52.3],
      stem: 'After the principal’s praise, what does Leslie’s request show?',
      choices: ['She wants the A-plus on record, like a grade', 'She doubts he really means the A-plus',
                'She wants him to sign a formal thank-you letter'], a: 0,
      cue: '「Thank you, Principal Russell」のあとの質問。',
      line: 'A-plus? Thank you, Principal Russell. *Can I get that in writing?*',
      said: '「A＋？ありがとうございます。それ、書面でもらえます？」と聞く。',
      mean: 'ほめ言葉を成績のように残したい、半分本気の頼み。優等生の顔が出ている。',
      trap: 'in writing を「信用しない」の合図と取りやすいが、直前に Thank you と喜んでいる。',
      use: 'Could you put that in an email?（それ、メールでもらえる？）' },

    // R pass: blind pass 65 %, but only through p1's stem (the praise) and line, which i2 already reveals (`writing`)
    // why: young ← "haven't changed" is often about looks; dances ← the prom setting suggests the old habit was
    //   planning parties
    { id: 'i2', skill: 'infer', level: 'B2', point: 'changed', reveals: ['writing'], seg: [47.0, 55.7],
      stem: 'What does “you haven’t changed since high school” suggest about Leslie back then?',
      choices: ['She cared a lot about grades then too', 'She looked just as young as she does now',
                'She was already planning school dances then'], a: 0,
      cue: '「Can I get that in writing?」のすぐあと。',
      line: 'Oh, Leslie, *you haven’t changed since high school*.',
      said: '成績を書面でほしがる姿を見て、「高校のころと変わらないね」と言う。',
      mean: 'A＋を喜び、書面でほしがるのは昔から。成績にこだわる生徒だったと分かる。',
      trap: 'haven’t changed は見た目の話にも使うが、ここは直前の言動を受けている。',
      use: 'You haven’t changed a bit.（全然変わってないね）' },

    // R fix: K6/V2 (blind 70 %): the key was the only nuanced "X, though Y" choice; a distractor now has the same shape
    // why: missed it ← "I didn't even notice" taken at face value, with "no bigs" as quiet pleasure; annoyed ← "no
    //   bigs" read as brushing someone off
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'nobigs', reveals: ['writing'], seg: [49.4, 59.7],
      stem: 'When someone mentions her A-plus, how is Leslie acting?',
      choices: ['Acting cool, though she clearly cares', 'Pleased, though she missed hearing it',
                'Annoyed that people keep bringing it up'], a: 0,
      cue: '数秒前の「書面で」と、今の返事を比べる。',
      line: '*I didn’t even notice. No bigs.*',
      said: '「気づかなかった。大したことないよ」と返す。',
      mean: '数秒前に「書面でほしい」と言ったばかり。気にしないふりで、内心は大喜び。no bigs ＝ no big deal。',
      trap: '言葉どおりなら「知らなかった」になる。直前の言動と食い違う返事は、ふりを疑う。',
      use: 'Oh, that? No big deal.（ああ、あれ？大したことないよ）' },

    // R fix: blind pass 50 % ("can't believe" is the stock phrase); "don't", just as idiomatic and also ending in a
    //   lost -n't, is added as a fourth
    // why: can ← the t of "can't" drops, so only the vowel decides; couldn't ← "gave" (past) pulls toward a past form;
    //   don't ← "I don't believe…" is as common, and both -n't endings fade to a nasal
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [52.3, 57.4],
      stem: 'Fill the gap: “I ___ believe he gave you an A-plus.”',
      choices: ['can’t', 'can', 'couldn’t', 'don’t'], a: 0,
      cue: '「haven’t changed」の次の文、最初の2語。',
      line: 'I *can’t* believe he gave you an A-plus.',
      said: '「彼が君にA＋をあげたなんて信じられない」と言う。',
      mean: 'can’t は母音が強く長い「キャーン」、肯定の can は弱く短い「クン」。',
      trap: 't はほぼ聞こえない。強く長い「キャー」なら can’t、「ドウ」なら don’t。母音で決める。',
      use: 'I can’t believe it’s Friday already.（もう金曜なんて信じられない）' },

    // R fix: blind pass 70 % ("meant for Ron" was a filler); a distractor now puts the laugh on Allison's grand reply,
    //   which comes after the laugh
    // why: no idea ← "orchestrate" is a big word, so the job sounds strange to her; Allison's honor ← "it would be my
    //   honor" is grand too, but the laugh (67.8 s) comes before it
    { id: 'h2', skill: 'humor', level: 'C1', point: 'balloon', seg: [59.3, 73.4],
      stem: 'Why does the audience laugh at Leslie’s question for Allison?',
      choices: ['The solemn build-up leads to a small job', 'Allison has no idea what a balloon drop is',
                'Allison treats a small job as an honor'], a: 0,
      cue: '前置きの重さと、実際の質問の中身。',
      line: 'a question… that’s *very important and very serious*… *Will you help me orchestrate the balloon drop?*',
      said: '「とても大事で真剣な質問」と前置きし、「風船を落とす係を手伝って」と頼む。',
      mean: '重々しい前置きと、小さな頼みの落差が笑い。orchestrate も大げさな語。',
      trap: '難しい語や my honor に引かれやすいが、笑いは返事の前。前置きと中身を比べる。',
      use: 'Can I ask you something serious?（真剣な話してもいい？）' },

    // why: Allison ← the letdown script (big build-up, small ask) makes the listener the butt; Ron ← he steps in right
    //   after to win her over
    // anchor: 60.6–63.9 s "very important and very serious… listen to me closely" said in earnest; 69.8–72.5 s "it
    //   would be my honor" — "Oh, hooray!": nobody is let down, and Leslie celebrates a job she truly rates
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'balloon', seg: [59.3, 73.4],
      stem: 'In the balloon-drop request, who is the joke on?',
      choices: ['Leslie, who truly thinks it’s a grand honor', 'Allison, who hoped for something much bigger',
                'Ron, who has been left out of the plan'], a: 0,
      cue: '頼んだあとの、二人の反応。',
      line: 'very important and very serious… — *It would be my honor.* — *Oh, hooray!*',
      said: '大げさな前置きで風船係を頼み、アリソンは「光栄です」、レスリーは「やった！」と喜ぶ。',
      mean: 'からかいではなく、本人は本気で大役だと思っている。小さな仕事に全力な人柄そのものが笑いの的。',
      trap: 'がっかり役を探してアリソンと取りやすいが、彼女は快く受ける。笑われるのは本気すぎる側。',
      use: 'I take my snack duty very seriously.（おやつ係は本気でやってるの）' },

    // why: $14 ← -teen/-ty; $400 ← a government job ("subcontracted by the government") makes a bigger sum seem likely
    { id: 'n3', skill: 'number', level: 'B1', point: 'forty', seg: [78.0, 84.4], keep: true,
      stem: 'How much does Ron offer Allison to help him?',
      choices: ['$14', '$40', '$400'], a: 1,
      cue: '「I’ll give you」のあと。',
      line: 'I’ll give you *$40*.',
      said: '「手伝ってくれたら40ドル払う」と持ちかける。',
      mean: '仕事の中身を説明してから、報酬の額をはっきり言う。',
      trap: 'forty は前の FOR が強く短い。fourteen なら後ろの -teen が強く長い。',
      use: 'I’ll give you twenty bucks.（20ドルあげるよ）' },

    // R fix: blind pass 60 % ("punishing her for the helium" was a filler); a distractor now reads the offer as Ron
    //   just wanting cheap labor
    // why: helping ← both are adults running the prom, so it reads as teamwork; cheap help ← "screw some angle irons
    //   onto some two-by-fours" for $40 sounds like a chore he wants off his hands
    { id: 'i3', skill: 'infer', level: 'B2', point: 'poach', reveals: ['forty'], seg: [78.0, 90.9],
      stem: 'What is Ron doing when he offers Allison the job?',
      choices: ['Luring her away from Leslie with pay', 'Getting cheap help for a dull job',
                'Helping Leslie by keeping her busy'], a: 0,
      cue: 'アリソンが受けたあと、レスリーが言う一言。',
      line: '*I know what you’re doing, Ron, and I will defeat you.*',
      said: 'お金を出すと彼女は即OK。レスリーは「狙いは分かってる、負けない」と言う。',
      mean: 'お金で手伝いから引き抜いている。宣戦布告で、張り合いだと分かる。',
      trap: '協力や安い手伝い集めに見えやすい。I will defeat you は、相手を敵と見ている言い方。',
      use: 'I know what you’re up to.（何たくらんでるか分かってるよ）' },

    // R fix: blind pass 50 % (the key was the only specific choice); a distractor is now as specific, built from a
    //   name said in the segment
    // why: truck ← "picked her up in my truck" said just before; Merle Haggard ← the singer's name comes right before
    //   "left early", so it sounds like where he went
    { id: 'd3', skill: 'detail', level: 'B1', point: 'quarry', seg: [98.4, 105.9],
      stem: 'Why did the man who took Susan Hoffler leave the prom early?',
      choices: ['To work a shift at the quarry', 'To drive his date home in his truck', 'To see Merle Haggard play that night'],
      a: 0,
      cue: '「left early to go to」のあと。',
      line: 'then I left early *to go to my shift at the quarry*.',
      said: '「トラックで迎えに行き、スローダンスを踊って、採石場のシフトで早く帰った」と話す。',
      mean: 'shift ＝ 勤務の時間帯。プロムの途中で仕事に行った、という話。',
      trap: '直前の truck や歌手名に引かれやすい。to go to のあとの行き先を聞く。',
      use: 'I have an early shift tomorrow.（明日は早番なんだ）' },

    // R fix: blind pass 60 % ("lost interest in Susan" was a target shift nobody hears); it is now a scope shift:
    //   "never went again" read as having had enough proms. S4: the segment ran 17.9 s; it now starts at "and then I
    //   left early" (10.8 s)
    // why: too tall ← "outgrown" is first learned for clothes and size; enough proms ← "never went again" heard as
    //   being full up, though he went once
    // anchor: 104–113 s "shift at the quarry. I was 12 years old. Never went again. Felt like I had outgrown it":
    //   after a work shift, at twelve, prom is outgrown as a stage of life, not a size
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'twelve', reveals: ['quarry'], seg: [102.7, 113.5],
      stem: 'Taken seriously, what does his last remark say about him at twelve?',
      choices: ['He already saw himself as a grown man', 'He had grown too tall for the dances',
                'He had been to enough proms by then'], a: 0,
      cue: '12歳、仕事、そして最後の一言をつなげる。',
      line: 'I was 12 years old. Never went again. *Felt like I had outgrown it.*',
      said: '「12歳だった。二度と行かなかった。もう卒業した気がした」と言う。',
      mean: 'outgrow ＝ 成長して合わなくなる。12歳で採石場に勤め、プロムを子どもの遊び扱い。本気に取るほどおかしい。',
      trap: 'outgrow を服のサイズの意味で取りやすい。直前の仕事の話とつなげると、心の成長の意味になる。',
      use: 'I think I’ve outgrown video games.（もうゲームは卒業したかな）' },

    // why: Seventeen ← the usual prom age; Twenty ← "twelve" and "twenty" both start with "tw-"
    { id: 'n4', skill: 'number', level: 'B1', point: 'twelve', reveals: ['quarry'], seg: [102.9, 108.6], keep: true,
      stem: 'How old was he at that prom, he says?',
      choices: ['Twelve', 'Seventeen', 'Twenty'], a: 0,
      cue: '「quarry」のあと、I was に続く数。',
      line: '*I was 12 years old.*',
      said: '「そのとき12歳だった」と言う。',
      mean: 'プロムは高校の行事なのに12歳。しかも採石場で働いていた、という大げさな話。',
      trap: 'プロムの年齢を知っていると17歳を選びやすい。twelve は最後の lve まで聞く。',
      use: 'I was twelve when we moved here.（ここに越してきたのは12歳のとき）' },

    // R fix: blind pass 55 % ("saw it only once or twice" contradicts the list of viewings); a distractor is now the
    //   ending the story was set up for
    // why: name wrong ← "Expendables 2" might sound like a slip; took ten viewings ← "the third time, it was OK" and
    //   "I realized something" set up a happy ending that never comes
    { id: 'h4', skill: 'humor', level: 'C1', point: 'expendables', seg: [133.6, 148.6],
      stem: 'Why does Andy’s movie example get a laugh?',
      choices: ['His example ends up proving the opposite', 'He gets the name of the movie wrong',
                'He says it took ten viewings to like it'], a: 0,
      cue: '何回も見た結果、最後に気づいたこと。',
      line: 'tenth time I watched it, I realized something. *It’s not a good movie.*',
      said: '「1回目も2回目も嫌い、10回見て気づいた。いい映画じゃない」と言う。',
      mean: '「見続ければ好きになる」の例のはずが、つまらないで終わる。説得が逆の証拠になる。',
      trap: 'OK や I realized で好きになる流れに聞こえる。結論が主張と合うかを聞く。',
      use: 'Give it a few tries.（何回か試してみて）' },

    // R fix: blind pass 50 % ("one song" didn't fit any words said); a distractor now reads the errand as a short
    //   break before joining him
    // why: join after ← "I'm gonna go to the girls' bathroom" heard as "back in a minute"; hated ← "I hate teenagers"
    //   earlier, carried over to dancing
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'excuse', seg: [150.4, 159.8],
      stem: 'How does April answer Andy’s invitation to dance?',
      choices: ['She finds an excuse and lets him go alone', 'She says she’ll join him after a quick break',
                'She tells him she has always hated dancing'], a: 0,
      cue: '「go dance」のあと、but で終わる返事。',
      line: 'I’m gonna go to the girls’ bathroom… *but you can dance if you want*.',
      said: '「女子トイレを見回ってくる。踊りたければどうぞ」と返し、アンディは大喜び。',
      mean: '用事を作って自分は踊らず、相手には許可を出す。断りと気づかいを一度にしている。',
      trap: 'トイレのあとで合流、と取りやすい。you だけが主語なので、彼女は踊らない。',
      use: 'I’ll sit this one out. You go ahead.（今回はパス、どうぞ行って）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'trick', seg: [203.6, 207.9],
      stem: 'Type what Leslie says: “There’s ___.” (5 words)', answer: 'a little trick to it',
      cue: '「cord before?」のあと。',
      line: 'There’s *a little trick to it*.',
      said: '「ちょっとしたコツがあるのよ」と教え始める。',
      mean: 'little の t は弾み「リル」に近い。trick to it もひと続き。',
      trap: 'a と to が弱く、聞き落としやすい。trick to it は「それのコツ」で、to は前置詞。',
      use: 'There’s a trick to opening this jar.（このビンを開けるにはコツがある）' },

    // R fix: blind pass 70 % ("the rope will snap" was a filler); a distractor now puts the laugh on the handshake
    //   simile, a real part of the lesson
    // why: wrong way ← "not too tight" and "towards the ground" sound like tips that might be off; handshake ← the
    //   simile is the oddest phrase in the lesson, but the laugh lands on "So just pull the rope?"
    { id: 'h5', skill: 'humor', level: 'C1', point: 'cord', reveals: ['trick'], seg: [203.6, 218.4],
      stem: 'Why does Leslie’s lesson on the cord get a laugh?',
      choices: ['She makes a simple pull sound like a skill', 'She gives Allison the wrong way to pull it',
                'She likens pulling a rope to a handshake'], a: 0,
      cue: '長い説明のあと、アリソンの短い確認。',
      line: '…*in a rope-pulling motion*. — *So just pull the rope?* — That’s right.',
      said: '握り方や引く動きを細かく説明し、「つまり引くだけ？」「その通り」。',
      mean: '誰でもできることを技のように語り、相手の一言で「引くだけ」とばれる。そのずれが笑い。',
      trap: '説明が細かいので本当のコツと取りやすい。聞き手の要約が、説明の中身をあばいている。',
      use: 'So basically, just push the button?（要するに、ボタンを押すだけ？）' },

    // R fix: blind pass 60 % ("a prize later" was a filler); a distractor is now the Japanese 「仕事ですから」 frame
    // why: pays well ← "reward" taken as money; only her duty ← "you don't have to thank me" heard as 「仕事ですから」,
    //   duty rather than joy
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'reward', seg: [218.0, 225.9],
      stem: 'When Allison thanks her, what does Leslie mean by her reply?',
      choices: ['Doing the job is thanks enough for her', 'The government pays its workers very well',
                'She was only doing what her job requires'], a: 0,
      cue: '「お礼はいい」と言ったあと。',
      line: 'Working for the government *is its own reward*.',
      said: '「お礼はいい。行政の仕事は、それ自体がご褒美」と返す。',
      mean: 'A is its own reward ＝ Aをすること自体が報い。見返りはいらない、という意味。',
      trap: 'reward を報酬、前半を「仕事ですから」と取りやすい。its own＝それ自体。',
      use: 'Helping out is its own reward.（手伝えること自体がうれしい）' },

    // R fix: blind pass 75 % (the key was the only abstract, two-part choice); the distractors are now questions of
    //   the same kind, each built on words said
    // why: whose idea ← "for making prom happen in the first place" heard as the point in dispute; credit ← "I
    //   assembled that cage" heard as a fight over who gets thanked
    { id: 'g1', skill: 'gist', level: 'B2', point: 'rivalry', reveals: ['reward', 'cage'], seg: [218.0, 257.0],
      stem: 'What are Leslie and Ron really arguing about as the balloons are set to drop?',
      choices: ['What really makes a job worth doing', 'Whose idea the prom was in the first place',
                'Who gets the credit for the balloon drop'], a: 0,
      cue: '「faces」と「cage」、二人が見ろと言うもの。',
      said: 'レスリーは仕事自体がご褒美、ロンは稼ぎが大事と、顔を見ろ、おりを見ろと競う。',
      mean: '仕事の価値は人の笑顔か、自分の稼ぎか。アリソンを前に、二人の考えがぶつかる。',
      trap: 'おりや in the first place から手柄争いと取りやすい。中心は働く理由。',
      use: 'For me, it’s not about the money.（私にとってはお金じゃないの）' },

    // R fix: blind pass 65 % ("warning that the cage could give way" was a filler); a near miss now has the right
    //   mechanism (echoing her) and the wrong purpose. S4: the segment ran 24.4 s; it now holds her second "Look at
    //   the faces" (with "that's what government is about") through his "fuel and medicine" (12.1 s)
    // why: just a laugh ← echoing someone's line is often mockery; credit ← "I assembled that cage" heard as a bid for
    //   credit, though he claims only the cage, and stresses the pay
    // anchor: 240.2–242.2 s "That's what government is about. Look at the faces"; 242.9–251.3 s "No, look at that
    //   cage… I assembled that cage and was paid for my labor": the same "look at" frame, with pay in place of faces
    // retired: g1 reveals its point (cage), so play 4 under g1 drew no C2
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'cage', seg: [239.8, 251.9], retired: true,
      stem: 'What is Ron doing with “No, look at that cage”?',
      choices: ['Copying her pitch to make the opposite point', 'Mocking her line just to get a laugh',
                'Taking credit for the whole balloon drop'], a: 0,
      cue: 'レスリーの「Look at the faces」と同じ形に注目。',
      line: 'Look at the faces… — *No, look at that cage*… I assembled that cage and *was paid for my labor*',
      said: 'レスリーの「人の顔を見て」に、ロンは「いや、おりを見ろ。組み立てて報酬をもらった」と返す。',
      mean: '同じ「～を見ろ」の型を借りて、価値は笑顔でなく労働の対価だと言い返す。型をまねた反論。',
      trap: 'まねをからかいと、おりを手柄と取りやすい。要は paid for my labor。同じ型の返しは反論。',
      use: 'No, look at the price tag.（いや、値札を見てよ）' },
  ]
};
