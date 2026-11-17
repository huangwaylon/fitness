// A2 REVIEW 2026-11-17: keep 4, rewrite 13, retire 7, new 0
// “when the boss isn't in the office | Parks and Recreation” (the official Parks and Recreation channel, Season 4):
// with Leslie away, the parks department suddenly makes Ann's water-fountain hygiene project its top priority; the
// brainstorm runs through silly ideas, the department head blocks a plan to hire Leslie's stand-in by pointing to his
// "major project", and a simple fix wins them time.
// Segments from the captions, words from whisper (2026-11-16). Names said: Ann, Leslie, Andy, Jerry, Tom, April, Donna,
// Ben. The man who greets Ann and the man hiring for Leslie's job are never named, so stems describe them.
// Untested on purpose: 40–45 s, 56–92 s (visual), 92–101 s (Tom's disclosure), 115–121 s (the reply to April differs
// in the sources), 129–146 s and 160–188 s (sprays and a water fight), 225–230 s (innuendo; whisper loops from 230 s).
// EAR CHECK: 122.2–123.2 s t2 — whisper "Do I look like I drank water?", captions "…I drink water?" (the key holds either way)
import type { Clip } from '../types.ts';

export const bossAway: Clip = {
  id: 'bossaway', video: 'w2VT6fsg-_g', title: 'when the boss isn’t in the office', dur: 251, wpm: 158,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    { id: 'i1', skill: 'infer', level: 'B2', point: 'name', seg: [0, 7],
      stem: 'What does Ann’s reply to the greeting tell us?', ja: 'あいさつへのアンの返事から、何が分かる？',
      choices: ['He usually gets her name wrong', 'They have never met before', 'He usually uses her first name'], a: 0,
      choicesJa: ['いつも名前をまちがえる', '初めて会った', 'いつもは下の名前で呼ぶ'],
      cue: '「entire name」のあとの一語',
      line: 'It’s the first time you’ve said my entire name *correctly*.',
      said: 'フルネームで呼ばれ、「私の名前を正しく全部言えたのは初めてね」と返す。',
      mean: 'correctly ＝ 正しく。今までは名前を言いまちがえていた、と分かる。',
      trap: 'first time から初対面だと思いやすい。初めてなのは「正しく言えたこと」。',
      use: 'That’s the first time you’ve gotten it right.（ちゃんとできたの初めてだね）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'spouts', seg: [13, 21],
      stem: 'What is the local habit with water fountains?', ja: '水飲み場での、この町の人の癖は？',
      choices: ['They put their mouths over it', 'They put their hands over it', 'They drink from underneath it'], a: 0,
      choicesJa: ['水の出る口に口をかぶせる', '水の出る口に手をかぶせる', '下から飲む'],
      cue: '「they put their」のあと',
      line: 'they put their *mouths completely over the spouts*.',
      said: '「なぜかポーニーの人は、水飲み場の口に口をすっぽりかぶせて飲む」と説明する。',
      mean: 'spout ＝ 水の出る口。そこに直接口をつけるのが問題。',
      trap: 'mouths と hands、over と under は取りちがえやすい。名詞と前置詞を聞く。',
      use: 'Please don’t touch the spout.（注ぎ口にさわらないでください）' },

    // why: kiss hello ← "kissing everyone" taken literally, as a local greeting; one fountain ← "one water fountain"
    //   heard as there being only one in town
    { id: 'i2', skill: 'infer', level: 'B2', point: 'kiss', seg: [20.0, 28.5], retired: true,
      stem: 'What does Ann mean with her line about kissing?',
      choices: ['Sharing a spout passes germs between everyone', 'People in Pawnee greet each other with a kiss',
                'Everyone in town drinks from the same fountain'], a: 0,
      cue: '「local quirk」のあと、kiss の文の前半と後半。',
      line: '*Kiss one water fountain drinker*, you’re *kissing everyone in Pawnee*.',
      said: '「水飲み場の利用者一人にキスすれば、町の全員にキスしたことになる」と言う。',
      mean: 'みんなが同じ口に口をつけるので、ばい菌が町中に回る、というたとえ。',
      trap: 'kiss を文字どおりのあいさつと取りやすい。後半の everyone がたとえの要。',
      use: 'Share a cup, share a cold.（コップを回せば、風邪も回る）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'tomorrow', seg: [30.4, 35.5], keep: true,
      stem: 'When should the project be done?', ja: 'この計画は、いつまでに終わらせる？',
      choices: ['By tonight', 'By tomorrow', 'By next week'], a: 1,
      choicesJa: ['今夜までに', '明日までに', '来週までに'],
      cue: '「complete this project」のあと',
      line: 'I’d like to complete this project *by tomorrow*.',
      said: '「この計画は明日までに終わらせたい」と言う。',
      mean: 'by 〜 ＝ 〜までに。期限を言う言い方。',
      trap: 'tonight なら最後が「ナイト」、next week なら「ネクスト」で始まる。「トゥモロウ」なら明日。',
      use: 'Can you finish it by Friday?（金曜までに終わる？）' },

    { id: 'f1', skill: 'phrase', level: 'B2', point: 'shop', seg: [34.7, 39],
      stem: 'What does “Set up shop in our office” mean?', ja: '“Set up shop in our office” はどういう意味？',
      choices: ['Work in our office for now', 'Open a store in our office', 'Run our office for us'], a: 0,
      choicesJa: ['しばらくうちの部屋で仕事して', 'うちの部屋に店を開いて', 'うちの部屋を仕切って'],
      cue: '「Oh」のあと',
      line: '*Set up shop* in our office. In fact, take Leslie’s desk.',
      said: '「うちの部屋を仕事場にしていい。なんならレスリーの机を使って」と言われる。',
      mean: 'set up shop ＝ 仕事の場所をかまえる。本当の店の話ではない。',
      trap: 'shop を「店」と思いやすい。続く take Leslie’s desk（机を使って）も、仕事場のこと。',
      use: 'You can set up shop in the kitchen.（台所を作業場にしていいよ）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'goal', seg: [46, 70],
      stem: 'What is the meeting trying to make?', ja: 'この会議では、何を作ろうとしている？',
      choices: ['A fountain mouths can’t touch', 'A fountain that cleans itself', 'Posters about disease'], a: 0,
      choicesJa: ['口をつけられない水飲み場', '自分できれいになる水飲み場', '病気のポスター'],
      cue: '「the idea is to」のあと',
      line: 'the idea is to make a fountain that *he can’t do that to*.',
      said: 'ポスターの話のあと、「口をつけられない水飲み場を作る」のが目的だと言う。',
      mean: 'the idea is to 〜 ＝ ねらいは〜すること。ポスターは保健課の別の取り組み。',
      trap: '最初に出る poster campaign に引かれやすい。Now のあとが本題。',
      use: 'The idea is to keep it simple.（ねらいはシンプルにすること）' },

    { id: 'd2', skill: 'detail', level: 'B1', point: 'cage', seg: [72, 81.5],
      stem: 'What does Jerry suggest?', ja: 'ジェリーの提案は？',
      choices: ['Putting a cage around the fountain', 'Putting a sign above the fountain', 'Putting cups next to the fountain'], a: 0,
      choicesJa: ['水飲み場のまわりにかごをつける', '水飲み場の上に注意書きをつける', '水飲み場の横にコップを置く'],
      cue: '「any ideas, Jerry?」のあと',
      line: 'we could put this *cage thing around it*.',
      said: '「この、かごみたいなのを周りにつけたら」と提案し、「それはいけるかも」と返される。',
      mean: 'cage ＝ おり、かご。口が近づけないように囲う案。we could 〜 ＝ 〜してもいいかも。',
      trap: '衛生対策でよくある「注意書き」を選びやすい。thing の前の名詞 cage を聞く。',
      use: 'We could put a cover over it.（上にカバーをかけてもいいかも）' },

    // why: stepping aside ← "full disclosure" is the formula before recusing oneself (the fair-play script); sorry ←
    //   the Japanese frame: owning up to a relationship at work as an apology
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'disclose', seg: [92.0, 106.0], retired: true,
      stem: 'What is Tom really doing when he mentions Ann before his idea?',
      choices: ['Showing off that he and Ann are a couple', 'Stepping aside so the choice will stay fair',
                'Saying sorry for keeping their secret'], a: 0,
      cue: '前置きのあと、Tom は案を出すかどうか。',
      line: 'Full disclosure, *Ann and I are romantically intertwined*. — Oh, God.',
      said: '「念のため、Ann と僕は恋愛関係」と言い、そのまま案を話す。',
      mean: '公平のための前置きの形で、交際を自慢している。Oh, God はあきれた反応。',
      trap: 'full disclosure は辞退の前置きにも使うが、Tom は案を出す。あとの行動を聞く。',
      use: 'Full disclosure: I already ate one.（先に言っておくと、もう1個食べた）' },

    // R fix: V2 (80 % blind): only the key named a product. All three now start "He drops the fountain…".
    // why: mocking ← right that he drops the fountain, missing that he then sells something; Ann will pick it ← his
    //   "let's not be surprised if she…" line just before, put in the wrong relation
    { id: 'h1', skill: 'humor', level: 'C1', point: 'butler', reveals: ['price'], seg: [101.0, 112.4], retired: true,
      stem: 'Why is Tom’s idea funny?',
      choices: ['He drops the fountain to sell a fancy water product', 'He drops the fountain to make fun of the whole project',
                'He drops the fountain since Ann will pick his idea anyway'], a: 0,
      cue: '「How about」の文のあと、何を紹介するか。',
      line: 'How about *no water fountain*? This is the *Voss Water Butler*… at only $600 a bag.',
      said: '「水飲み場なしでどう？ こちら1袋たった600ドルの高級水」と売りこむ。',
      mean: '無料の公共設備の話に、高級品の宣伝で答えている。そのずれが笑い。',
      trap: 'no water fountain だけ聞くと投げやりな答えに聞こえる。そのあとの商品紹介まで聞く。',
      use: 'How about we just order pizza?（いっそピザを頼むのはどう？）' },

    { id: 'n2', skill: 'number', level: 'B1', point: 'price', seg: [104, 112.4], keep: true,
      stem: 'What price does Tom give for the Water Butler?', ja: 'トムが言うウォーターバトラーの値段は？',
      choices: ['$60 a bag', '$600 a bag', '$6,000 a bag'], a: 1,
      choicesJa: ['1袋60ドル', '1袋600ドル', '1袋6,000ドル'],
      cue: '「at only」のあと',
      line: 'This is the Voss Water Butler… at only *$600* a bag.',
      said: '「1袋たった600ドル」と売りこむ。',
      mean: 'six hundred ＝ 600。only を付けて安く聞かせるのは、宣伝の言い方。',
      trap: '60 なら「シックスティ」で終わる。6,000 なら「サウザンド」。「シックス・ハンドレッド」なら600。',
      use: 'Only twenty dollars a month!（月たったの20ドル！）' },

    { id: 't1', skill: 'attitude', level: 'B1', point: 'book', seg: [111.3, 118.3],
      stem: 'What does April’s answer show?', ja: 'エイプリルの答えから、何が分かる？',
      choices: ['She’d rather just read', 'She wants ideas from a book', 'She needs a quiet room'], a: 0,
      choicesJa: ['ただ本を読んでいたい', '本からアイデアを得たい', '静かな部屋が必要'],
      cue: '「What’s your idea?」への答え',
      line: 'To go in that room and *finish this book*.',
      said: '案を聞かれて「あっちの部屋でこの本を読み終えること」と答える。',
      mean: '案を出す気がない、という返事。会議に加わる気がない。',
      trap: 'room や book を、案のための場所や資料だと思いやすい。するのは読書。',
      use: 'My plan is to stay in bed.（私の予定は、寝てること）' },

    // R fix: V2 (55 % blind): only the key had two steps, and "gets angry" was weak. "Ignores it and moves on" (he
    //   does turn to Donna next) is the new near miss.
    // why: lets her go ← "Oh, really? Is it good?" taken as real interest; moves on ← "Donna?" comes right after, and
    //   the short replies sound like a brush-off
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'help', reveals: ['book'], seg: [115.4, 121.3], retired: true,
      stem: 'How does the meeting’s leader handle April’s plan?',
      choices: ['Plays along briefly, then says she must help', 'Takes an interest, then lets her go and read',
                'Ignores the plan, then moves on to Donna'], a: 0,
      cue: '本の質問のあと、文の最後の語。',
      line: 'Oh, really? Is it good? — Yeah. — … and *you’re gonna help*.',
      said: '「へえ、そう？ 面白い？」と聞き、「うん」と返ると「でも手伝ってもらうから」と言う。',
      mean: '興味のふりで受け流してから、はっきり却下している。',
      trap: 'Is it good? を本当の興味と取りやすい。最後の you’re gonna help が結論。',
      use: 'Sounds fun, but you’re helping me.（楽しそうだけど、手伝ってね）' },

    { id: 't2', skill: 'attitude', level: 'B2', point: 'drink', seg: [121, 124.25],
      stem: 'What does Donna mean by “Do I look like I drink water?”', ja: 'ドナの “Do I look like I drink water?” はどういう意味？',
      choices: ['No, I never drink it', 'Yes, I’m very thirsty', 'I’m not really sure'], a: 0,
      choicesJa: ['いや、水なんて飲まない', 'うん、のどがかわいた', 'よく分からない'],
      cue: '「Donna?」のあとの答え',
      line: 'Do I look like I *drink water*?',
      said: '名前を呼ばれ、「私が水なんか飲むように見える？」と返す。',
      mean: 'Do I look like 〜? ＝ 私が〜に見える？（見えないでしょ）。答えを求めない質問で、断っている。',
      trap: '字のまま「のどがかわいて見える？」と思いやすい。Do I look like 〜? は「そんなわけない」。',
      use: 'Do I look like a chef?（私が料理人に見える？）' },

    { id: 'd3', skill: 'detail', level: 'B1', point: 'pressure', seg: [123, 128],
      stem: 'Why change the water pressure?', ja: 'なぜ水の勢いを変える？',
      choices: ['So mouths can stay away', 'So the spout stays clean', 'So people don’t bend down'], a: 0,
      choicesJa: ['口を離していられるように', '口がきれいなままになるように', 'かがまなくていいように'],
      cue: '「That way」のあと',
      line: 'That way you *don’t have to put your mouth so close*.',
      said: '「水の勢いを上げれば、口をそんなに近づけなくていい」と提案する。',
      mean: 'that way ＝ そうすれば。don’t have to 〜 ＝ 〜しなくていい。',
      trap: '水の勢いから、洗う話や姿勢の話を思いやすい。理由は mouth so close。',
      use: 'Leave early. That way you won’t be late.（早く出なよ。そうすれば遅れない）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'pressure', seg: [123, 127.6],
      stem: 'Fill the gap: “Why don’t we just ___ the pressure?”', ja: '空所に入るのは？ “Why don’t we just ___ the pressure?”',
      choices: ['turn up', 'turn down', 'tune up'], a: 0,
      choicesJa: ['強くする', '弱くする', '調整する'],
      cue: '「just」のあと',
      line: 'Why don’t we just *turn up* the pressure?',
      said: '「水の勢いを上げたら？」と言う。',
      mean: 'turn up ＝ 強くする、上げる。turn と up がつながり「ターナップ」に近い。',
      trap: 'turn down なら「ダウン」、tune up なら「チューン」。「ターナップ」と聞こえれば turn up。',
      use: 'Can you turn up the heat?（暖房を強くしてくれる？）' },

    // why: wants Ann to fill in ← "fill in for Leslie" + Ann at Leslie's desk (right target, wrong direction); more urgent
    //   ← "major project" taken sincerely
    // anchor: 154.8–159.5 s "you will not be hiring anyone, because my department is just finishing up a major project":
    //   the fountain is his reason to block the hire; 220.9–224.8 s the plan works ("hold off on filling the Leslie void")
    { id: 'c1', skill: 'infer', level: 'C2', point: 'project', seg: [146.5, 160.0], retired: true,
      stem: 'What does the answer to the hiring plan reveal about the fountain project?',
      choices: ['It was taken on to keep any new hire out', 'It honestly matters more right now than hiring',
                'It is a way to make Ann the one who fills in'], a: 0,
      cue: '「because」のあと、何を理由にするか。',
      line: 'you will *not be hiring anyone*, because my department is just finishing up *a major project*.',
      said: 'レスリーの代わりを雇いたい相手に「大きな計画の仕上げ中だから誰も雇わせない」と返す。',
      mean: '水飲み場の改良を「大きな計画」と呼び、雇わない理由にする。急に Ann に親切だった訳もここで分かる。',
      trap: 'major project を本気と取りやすい。大げさな言葉が断る理由になったら口実を疑う。',
      use: 'Sorry, I’m swamped with a big project.（ごめん、大きな仕事で手いっぱいで）' },

    { id: 'n3', skill: 'number', level: 'B1', point: 'candidates', seg: [148, 155.3], keep: true,
      stem: 'How many candidates would he like to hire?', ja: '彼は何人の候補者を雇いたい？',
      choices: ['2', '5', '7'], a: 1,
      choicesJa: ['2人', '5人', '7人'],
      cue: '「I have found」のあと',
      line: 'I have found *five candidates* I’d like to hire, and two…',
      said: '「雇いたい候補を5人見つけた」と言い、別に2人の話を足す。',
      mean: 'candidate ＝ 候補者。あとの two は、雇う人数ではない。',
      trap: '2 なら「トゥー」、7 は「セヴン」と2拍。「ファイヴ」なら5。最後の two は別の話。',
      use: 'We have three people for the job.（その仕事の候補は3人です）' },

    // R fix: V2 (55 % blind): the key was the only abstract, clever-sounding choice. All three are now "He wants two
    //   of them…".
    // why: old friends ← "friends" heard, in the wrong relation; more than the five ← "and two" heard as a ranking of
    //   the candidates
    { id: 'h2', skill: 'humor', level: 'C1', point: 'friends', reveals: ['candidates'], seg: [148.0, 155.3], retired: true,
      stem: 'Why is the line about the job candidates funny?',
      choices: ['He wants two of them as friends, not as staff', 'He wants two of them, who are already his friends',
                'He wants two of them more than the other five'], a: 0,
      cue: '「and two」のあと、何をしたいと言うか。',
      line: 'five candidates I’d like to hire, and two *I’d like to be lifelong friends with*.',
      said: '「雇いたい候補が5人、それと一生の友だちになりたい人が2人」と言う。',
      mean: '面接の報告に「親友候補」が混ざる。仕事と友だち作りを同じ熱さで話すのが笑い。',
      trap: 'friends が聞こえて「友だちを雇った」と取りやすい。2人は雇う話とは別の数。',
      use: 'I made a new best friend at the gym.（ジムで新しい親友ができた）' },

    // R fix: V2 (65 % blind): "teasing; the water fight was fun" was weak. "Break up this one fight" is the scope shift
    //   (this fight vs the department).
    // why: a bit of structure ← "a little" read as real modesty (遠慮); this one fight ← scope shift: the shouting just
    //   before taken as all he means
    // anchor: 168.5–175 s the shouting ("Everything I'm wearing is suede!") drowns out "Excuse me, everybody. Attention!";
    //   146.5–153.5 s the same man had come in wanting to hire Leslie's stand-in
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'leadership', seg: [168.0, 184.0], retired: true,
      stem: 'After the shouting, what does “could use a little leadership” really mean?',
      choices: ['They’re out of control and badly need a boss', 'They need someone to break up this one fight',
                'They need a bit more structure in their meetings'], a: 0,
      cue: '呼びかけが聞いてもらえない状況と、a little。',
      line: 'I think you’ll agree that this department *could use a little leadership*.',
      said: '叫び声の中で「注目！」と言ったあと、「この部署には少しリーダーシップが要るね」と言う。',
      mean: 'a little は控えめな言い方で、実際は「上に立つ人がいない」。前の雇う話につながる。',
      trap: 'a little を「少しだけ」、今のけんかの話と取りやすい。主語は this department。',

      use: 'This room could use a little cleaning.（この部屋、ちょっと掃除が要るね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'important', seg: [189.9, 192.6],
      stem: 'Type what he asks: “Hey, guys. ___?” (3 words)', ja: '書こう：“Hey, guys. ___?”（3語）',
      answer: "what's so important",
      cue: '「Hey, guys」のすぐあと',
      line: 'Hey, guys. *What’s so important*?',
      said: '「やあ、みんな。何がそんなに大事なの？」と呼ばれた理由を聞く。',
      mean: 'what’s の s と so の s が一つにつながり、「ワッソウ」に近い。',
      trap: 's が一つに聞こえるので、what so と書きやすい。what’s ＝ what is。',
      use: 'What’s so funny?（何がそんなにおかしいの？）' },

    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [190, 225.6],
      stem: 'How does the fountain project turn out?', ja: '水飲み場の計画は、どうなる？',
      choices: ['A simple fix works well', 'A simple fix costs too much', 'A simple fix fails'], a: 0,
      choicesJa: ['簡単な工夫がうまくいく', '簡単な工夫だが高すぎる', '簡単な工夫が失敗する'],
      cue: '最後の場面のほめ言葉',
      said: '最後に出た案が成功し、「シンプルで上品で安上がり」とほめられる。',
      mean: 'cost-effective ＝ 安上がりで効果がある。部品を外すだけの手軽な解決で決着する。',
      trap: 'cost が聞こえて「高すぎる」と思いやすい。cost-effective は「安上がり」。',
      use: 'Simple and cheap. I love it.（シンプルで安い。最高）' },

    { id: 'h3', skill: 'phrase', level: 'B1', point: 'balloon', seg: [192.4, 198.2],
      stem: 'What does “Fair enough” mean here?', ja: 'ここでの “Fair enough” はどういう意味？',
      choices: ['Okay, that’s true', 'That’s not fair', 'That’s way too much'], a: 0,
      choicesJa: ['まあ、そうだね', 'それはずるい', 'それはやりすぎ'],
      cue: '「Water balloon fight」への返事',
      line: 'after yesterday’s hands-on brainstorming session… — Water balloon fight. — *Fair enough.*',
      said: '「昨日の体験型の案出し会のあと」に「水風船合戦ね」と返され、「まあね」と認める。',
      mean: 'Fair enough ＝ まあ、そうだね、もっともだ。相手の言い分を認めるときの返事。',
      trap: 'fair から「公平・ずるくない」の話だと思いやすい。ひとまとまりで「一理ある」。',
      use: 'Fair enough. Let’s do it your way.（一理あるね。君のやり方でやろう）' },

    { id: 'd4', skill: 'detail', level: 'B2', point: 'guard', seg: [206, 211.3],
      stem: 'What did they change to make the new fountain?', ja: '新しい水飲み場を作るために、何を変えた？',
      choices: ['They took the splash guard off', 'They put a splash guard on', 'They took the whole spout out'], a: 0,
      choicesJa: ['はね防止の部品を外した', 'はね防止の部品を付けた', '水の出る口ごと外した'],
      cue: '「We just」のあとの動詞',
      line: 'We just *removed the splash guard*, because if it’s not there, you can’t put your mouth on it.',
      said: '「はね防止の部品を外しただけ。それがなければ口をつけられない」と言う。',
      mean: 'remove ＝ 取り外す。部品を足すのではなく、減らした案。',
      trap: 'spoutless（口なし）という名前から、口ごと外したと思いやすい。removed のあとを聞く。',
      use: 'Just remove the lid.（ふたを外すだけでいい）' },

    { id: 'f3', skill: 'phrase', level: 'B2', point: 'holdoff', seg: [217.4, 225.6],
      stem: 'What does “hold off on filling” Leslie’s spot mean?', ja: 'レスリーの席について “hold off on filling” はどういう意味？',
      choices: ['Wait for now', 'Never do it', 'Do it today'], a: 0,
      choicesJa: ['今は待つ', '絶対にしない', '今日する'],
      cue: '「If your team keeps this up」のあと',
      line: 'If your team keeps this up, I think we can *hold off on* filling the Leslie void.',
      said: '「この調子なら、レスリーの穴を埋めるのは先送りにできそうだ」と言う。',
      mean: 'hold off on 〜 ＝ 〜を先に延ばす。やめるわけではない。',
      trap: 'off から「やめる」と思いやすい。hold off は「待つ」で、いずれはする。',
      use: 'Let’s hold off on dinner for now.（夕食はちょっと待とう）' },
  ]
};
