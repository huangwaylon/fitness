// REVIEW 2026-11-16: pass 10, fix 14, drop 0, new 0; ear checks 1
//   Open: none.
// “when the boss isn't in the office | Parks and Recreation” (the official Parks and Recreation channel, Season 4):
// with Leslie away, the parks department suddenly makes Ann's water-fountain hygiene project its top priority; the
// brainstorm runs through silly ideas, the department head blocks a plan to hire Leslie's stand-in by pointing to his
// "major project", and a simple fix wins them time.
// Segments from the captions, words from whisper (2026-11-16). Names said: Ann, Leslie, Andy, Jerry, Tom, April, Donna,
// Ben. The man who greets Ann and later says "my department", and the man hiring for Leslie's job, are never named, so
// stems describe them; so is whoever runs the brainstorm. No item depends on telling those voices apart.
// Untested on purpose: 40–45 s (the door: speakers unclear), 56–92 s (Andy tests the fountain: visual), 97–101 s
// (Tom's "let's not be surprised if she fixed my idea": the verb is odd in both), 119–120 s (whisper "I don't care",
// captions "we're gonna stay here"), 129–146 s and 160–178 s (sprays and a water fight: visual and shouting), 225–230 s
// ("Ben's already filling the Leslie void": innuendo; whisper loops from 230 s).
// EAR CHECK: 122.2–123.2 s t2 — whisper "Do I look like I drank water?", captions "…I drink water?" (the line has
//   "drink"; the key holds either way)
import type { Clip } from '../types.ts';

export const bossAway: Clip = {
  id: 'bossaway', video: 'w2VT6fsg-_g', title: 'when the boss isn’t in the office', dur: 251, wpm: 158,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: first name only ← "entire name" heard without "correctly", as if he usually shortens it; just met ← "first
    //   time" heard as their first meeting
    { id: 'i1', skill: 'infer', level: 'B2', point: 'name', seg: [0, 7.0],
      stem: 'What does Ann’s reply to the greeting suggest?',
      choices: ['He has usually got her name wrong', 'He usually calls her by her first name',
                'They are meeting for the very first time'], a: 0,
      cue: '「entire name」のすぐあとの一語。',
      line: 'It’s the first time you’ve said my entire name *correctly*.',
      said: 'フルネームで呼ばれ、「私の名前を正しく全部言えたのは初めてね」と返す。',
      mean: 'correctly があるので、今までは名前を言いまちがえていたと分かる。',
      trap: 'first time で初対面と取りやすい。初めてなのは「正しく言えたこと」。',
      use: 'That’s the first time you’ve gotten it right.（ちゃんとできたの初めてだね）' },

    // R fix: V2 (60 % blind): "without cleaning them" was the odd one out. All three now name a body part and a
    //   place, so "mouths" and "over" both have to be heard.
    // why: hands ← "put their… over the spouts" with the body part lost; under ← over/under, and mouth-under-spout is
    //   how a fountain is normally used
    { id: 'd1', skill: 'detail', level: 'B1', point: 'spouts', seg: [13.0, 21.0],
      stem: 'What is the local habit with water fountains?',
      choices: ['People put their mouths right over the spout', 'People put their hands right over the spout',
                'People drink with their mouths under the spout'], a: 0,
      cue: '「they put their」のあと、何をどこに。',
      line: 'they put their *mouths completely over the spouts*.',
      said: '「なぜか Pawnee の人は、水飲み場の口に口をすっぽりかぶせて飲む」と説明する。',
      mean: 'spout ＝ 水の出る口。そこに直接口をつけるのが問題。',
      trap: 'mouths と hands、over と under は取り違えやすい。名詞と前置詞を聞く。',
      use: 'Please don’t touch the spout.（注ぎ口にさわらないでください）' },

    // why: kiss hello ← "kissing everyone" taken literally, as a local greeting; one fountain ← "one water fountain"
    //   heard as there being only one in town
    { id: 'i2', skill: 'infer', level: 'B2', point: 'kiss', seg: [20.0, 28.5],
      stem: 'What does Ann mean with her line about kissing?',
      choices: ['Sharing a spout passes germs between everyone', 'People in Pawnee greet each other with a kiss',
                'Everyone in town drinks from the same fountain'], a: 0,
      cue: '「local quirk」のあと、kiss の文の前半と後半。',
      line: '*Kiss one water fountain drinker*, you’re *kissing everyone in Pawnee*.',
      said: '「水飲み場の利用者一人にキスすれば、町の全員にキスしたことになる」と言う。',
      mean: 'みんなが同じ口に口をつけるので、ばい菌が町中に回る、というたとえ。',
      trap: 'kiss を文字どおりのあいさつと取りやすい。後半の everyone がたとえの要。',
      use: 'Share a cup, share a cold.（コップを回せば、風邪も回る）' },

    // why: tonight ← the first syllables of "tomorrow" and "tonight" match; next week ← a project usually takes longer
    { id: 'n1', skill: 'number', level: 'B1', point: 'tomorrow', seg: [30.4, 35.5], keep: true,
      stem: 'What deadline is set for the project?',
      choices: ['By tonight', 'By tomorrow', 'By next week'], a: 1,
      cue: '「complete this project」のすぐあと。',
      line: 'I’d like to complete this project *by tomorrow*.',
      said: '「この計画は明日までに終わらせたい」と言う。',
      mean: 'by ～ ＝ ～までに。期限を表す。',
      trap: 'tonight と tomorrow は出だしが同じ「トゥ」。最後まで聞いて区別する。',
      use: 'Can you finish it by Friday?（金曜までに終わる？）' },

    // R fix: V2 (60 % blind): "tidy it up" was weak. "Take over running it for Leslie" reads "take Leslie's desk" as
    //   taking her job.
    // why: open a store ← shop = 店, taken literally; run it ← "take Leslie's desk" heard as stepping into her role
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'shop', seg: [34.7, 39.0],
      stem: 'What is Ann invited to do in their office?',
      choices: ['Start working out of it for now', 'Open a small store inside it',
                'Take over running it for Leslie'], a: 0,
      cue: '「Oh」のあと、office の前の3語。',
      line: '*Set up shop* in our office. In fact, take Leslie’s desk.',
      said: '「うちの部屋を仕事場にしていい。なんならレスリーの机を使って」と言われる。',
      mean: 'set up shop ＝ 仕事の拠点を構える。本当の店の話ではない。',
      trap: 'shop を「店」と、机の話を「代わりに仕切る」と取りやすい。続く机の話も作業場のこと。',
      use: 'You can set up shop in the kitchen.（台所を作業場にしていいよ）' },

    // R fix: V2 (60 % blind): "a person to test every fountain" was weak. A self-cleaning fountain (the hygiene
    //   script) is now the near miss.
    // why: posters ← "poster campaign" is said first, but it is the health department's other work; self-cleaning ←
    //   "a better water fountain" + hygiene, filled in with the usual fix
    { id: 'g1', skill: 'gist', level: 'B2', point: 'goal', seg: [46.0, 70.0],
      stem: 'What is the brainstorm meant to produce?',
      choices: ['A fountain no one can put a mouth on', 'A fountain that cleans its own spout',
                'A set of posters warning about disease'], a: 0,
      cue: '「the idea is to」のあと。',
      line: 'the idea is to make a fountain that *he can’t do that to*.',
      said: 'ポスターの話のあと、「口をつけられない水飲み場を作る」のが目的だと言う。',
      mean: 'ポスターは別の取り組み。この会議は水飲み場の案を出す場。',
      trap: '先に出る poster campaign に引かれやすい。Now のあとが本題。',
      use: 'The idea is to make it simple.（ねらいはシンプルにすること）' },

    // why: sign ← a common hygiene fix (a script); cup ← "put this… around it" heard without the noun
    { id: 'd2', skill: 'detail', level: 'B1', point: 'cage', seg: [72.0, 81.5],
      stem: 'What does Jerry suggest?',
      choices: ['Putting a cage around the fountain', 'Putting a sign above the fountain',
                'Putting cups next to the fountain'], a: 0,
      cue: '「any ideas, Jerry?」のあと。',
      line: 'we could put this *cage thing around it*.',
      said: '「この、かごみたいなのを周りにつけたら」と提案し、「それはいけるかも」と返される。',
      mean: 'cage ＝ おり、かご。口が近づけないように囲う案。',
      trap: '衛生対策の定番で「注意書き」を選びやすい。thing の前の名詞を聞く。',
      use: 'Put a cover over it.（上にカバーをかけて）' },

    // why: stepping aside ← "full disclosure" is the formula before recusing oneself (the fair-play script); sorry ←
    //   the Japanese frame: owning up to a relationship at work as an apology
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'disclose', seg: [92.0, 106.0],
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
    { id: 'h1', skill: 'humor', level: 'C1', point: 'butler', reveals: ['price'], seg: [101.0, 112.4],
      stem: 'Why is Tom’s idea funny?',
      choices: ['He drops the fountain to sell a fancy water product', 'He drops the fountain to make fun of the whole project',
                'He drops the fountain since Ann will pick his idea anyway'], a: 0,
      cue: '「How about」の文のあと、何を紹介するか。',
      line: 'How about *no water fountain*? This is the *Voss Water Butler*… at only $600 a bag.',
      said: '「水飲み場なしでどう？ こちら1袋たった600ドルの高級水」と売りこむ。',
      mean: '無料の公共設備の話に、高級品の宣伝で答えている。そのずれが笑い。',
      trap: 'no water fountain だけ聞くと投げやりな答えに聞こえる。そのあとの商品紹介まで聞く。',
      use: 'How about we just order pizza?（いっそピザを頼むのはどう？）' },

    // why: $60 ← "six hundred" with a weak -dred sounds short; $6,000 ← "luxury" invites a bigger number
    { id: 'n2', skill: 'number', level: 'B1', point: 'price', seg: [104.0, 112.4], keep: true,
      stem: 'What price does Tom give for the Water Butler?',
      choices: ['$60 a bag', '$600 a bag', '$6,000 a bag'], a: 1,
      cue: '「at only」のあとの数字。',
      line: 'This is the Voss Water Butler… at only *$600* a bag.',
      said: '「1袋たった600ドル」と言う。only は皮肉ではなく、売りこみの口調。',
      mean: 'six hundred ＝ 600。only を付けて安く聞かせる宣伝の型。',
      trap: 'hundred の後半が弱いと短い数に聞こえる。only に引かれて小さい数を選びやすい。',
      use: 'Only twenty dollars a month!（月たったの20ドル！）' },

    // R fix: V2 (70 % blind): "too shy" was weak. "A book will give her an idea" puts "book" in the wrong relation.
    // why: book for ideas ← "book" heard, tied to the brainstorm; quiet room ← "go in that room" heard as a place to
    //   think an idea through
    { id: 't1', skill: 'attitude', level: 'B2', point: 'book', seg: [111.3, 118.3],
      stem: 'When asked for her idea, what does April’s answer show?',
      choices: ['She would rather read than take part', 'She hopes a book will give her an idea',
                'She needs a quiet room to think one up'], a: 0,
      cue: '「What’s your idea?」への答えの最後の語。',
      line: 'To go in that room and *finish this book*.',
      said: '案を聞かれて「あっちの部屋でこの本を読み終えること」と答える。',
      mean: '案を出す気がない、という返事。会議に加わる気がない。',
      trap: 'room や book を案のための場所や資料と取りやすいが、するのは読書。最後の語まで聞く。',
      use: 'My plan is to stay in bed.（私の予定は、寝てること）' },

    // R fix: V2 (55 % blind): only the key had two steps, and "gets angry" was weak. "Ignores it and moves on" (he
    //   does turn to Donna next) is the new near miss.
    // why: lets her go ← "Oh, really? Is it good?" taken as real interest; moves on ← "Donna?" comes right after, and
    //   the short replies sound like a brush-off
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'help', reveals: ['book'], seg: [115.4, 121.3],
      stem: 'How does the meeting’s leader handle April’s plan?',
      choices: ['Plays along briefly, then says she must help', 'Takes an interest, then lets her go and read',
                'Ignores the plan, then moves on to Donna'], a: 0,
      cue: '本の質問のあと、文の最後の語。',
      line: 'Oh, really? Is it good? — Yeah. — … and *you’re gonna help*.',
      said: '「へえ、そう？ 面白い？」と聞き、「うん」と返ると「でも手伝ってもらうから」と言う。',
      mean: '興味のふりで受け流してから、はっきり却下している。',
      trap: 'Is it good? を本当の興味と取りやすい。最後の you’re gonna help が結論。',
      use: 'Sounds fun, but you’re helping me.（楽しそうだけど、手伝ってね）' },

    // why: thirsty ← the question taken literally, about how she looks; offended ← the mouths-on-spouts topic heard as
    //   aimed at her
    { id: 't2', skill: 'attitude', level: 'C1', point: 'drink', seg: [121.0, 124.25],
      stem: 'When Donna is asked for an idea, what does her answer show?',
      choices: ['She won’t join in; water is beneath her', 'She looks thirsty and would like a drink',
                'She feels the topic is aimed at her'], a: 0,
      cue: '「Donna?」のあと、質問の形の答え。',
      line: 'Do I look like I *drink water*?',
      said: '名前を呼ばれ、「私が水なんか飲むように見える？」と返す。',
      mean: '答えを求めない疑問文。「水なんて私には関係ない」と断っている。',
      trap: '文字どおり「のどが渇いて見える？」と取りやすい。Do I look like ～? は「そんなわけない」。',
      use: 'Do I look like a chef?（私が料理人に見える？）' },

    // R fix: V2 (70 % blind): "more people at once" was weak. "Bend down" is the near miss on "put your mouth so close".
    // why: washes the spout ← hygiene is the topic, and strong water sounds like cleaning; bend down ← "don't have to"
    //   heard, the "mouth so close" lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'pressure', seg: [123.0, 128.0],
      stem: 'Why does someone suggest changing the water pressure?',
      choices: ['So mouths don’t need to get close', 'So the water washes the spout clean',
                'So people don’t need to bend down'], a: 0,
      cue: '「That way」のあと。',
      line: 'That way you *don’t have to put your mouth so close*.',
      said: '「水の勢いを上げれば、口をそんなに近づけなくていい」と提案する。',
      mean: 'that way ＝ そうすれば。提案の理由を続けている。',
      trap: '水の勢いで「洗う」や姿勢の話を想像しやすい。理由は mouth so close。',
      use: 'Leave early. That way you won’t be late.（早く出なよ。そうすれば遅れない）' },

    // R fix: V2 (50 % blind): "turn off the pressure" made no sense. "tune up" (turn/tune) is the near sound.
    // why: down ← the opposite particle, weak in fast speech; tune up ← turn/tune, the r lost in American speech, and
    //   "up" heard right
    { id: 's1', skill: 'sound', level: 'B2', point: 'pressure', seg: [123.0, 127.6],
      stem: 'Fill the gap: “Why don’t we just ___ the pressure?”',
      choices: ['turn up', 'turn down', 'tune up'], a: 0,
      cue: 'just のあと、turn に続く短い音。',
      line: 'Why don’t we just *turn up* the pressure?',
      said: '「水圧を上げたら？」。turn と up がつながり「ターナップ」に近い。',
      mean: 'turn up ＝ 強くする。離れても飲めるようにする案。',
      trap: 'up は n とつながって短い。turn の r を聞き、勢いを弱めたら口が近づく点で筋も確かめる。',
      use: 'Can you turn up the heat?（暖房を強くしてくれる？）' },

    // why: wants Ann to fill in ← "fill in for Leslie" + Ann at Leslie's desk (right target, wrong direction); more urgent
    //   ← "major project" taken sincerely
    // anchor: 154.8–159.5 s "you will not be hiring anyone, because my department is just finishing up a major project":
    //   the fountain is his reason to block the hire; 220.9–224.8 s the plan works ("hold off on filling the Leslie void")
    { id: 'c1', skill: 'infer', level: 'C2', point: 'project', seg: [146.5, 160.0],
      stem: 'What does the answer to the hiring plan reveal about the fountain project?',
      choices: ['It was taken on to keep any new hire out', 'It honestly matters more right now than hiring',
                'It is a way to make Ann the one who fills in'], a: 0,
      cue: '「because」のあと、何を理由にするか。',
      line: 'you will *not be hiring anyone*, because my department is just finishing up *a major project*.',
      said: 'レスリーの代わりを雇いたい相手に「大きな計画の仕上げ中だから誰も雇わせない」と返す。',
      mean: '水飲み場の改良を「大きな計画」と呼び、雇わない理由にする。急に Ann に親切だった訳もここで分かる。',
      trap: 'major project を本気と取りやすい。大げさな言葉が断る理由になったら口実を疑う。',
      use: 'Sorry, I’m swamped with a big project.（ごめん、大きな仕事で手いっぱいで）' },

    // R fix: V2 (55 % blind): the key was the only abstract, clever-sounding choice. All three are now "He wants two
    //   of them…".
    // why: old friends ← "friends" heard, in the wrong relation; more than the five ← "and two" heard as a ranking of
    //   the candidates
    { id: 'h2', skill: 'humor', level: 'C1', point: 'friends', reveals: ['candidates'], seg: [148.0, 155.3],
      stem: 'Why is the line about the job candidates funny?',
      choices: ['He wants two of them as friends, not as staff', 'He wants two of them, who are already his friends',
                'He wants two of them more than the other five'], a: 0,
      cue: '「and two」のあと、何をしたいと言うか。',
      line: 'five candidates I’d like to hire, and two *I’d like to be lifelong friends with*.',
      said: '「雇いたい候補が5人、それと一生の友だちになりたい人が2人」と言う。',
      mean: '面接の報告に「親友候補」が混ざる。仕事と友だち作りを同じ熱さで話すのが笑い。',
      trap: 'friends が聞こえて「友だちを雇った」と取りやすい。2人は雇う話とは別の数。',
      use: 'I made a new best friend at the gym.（ジムで新しい親友ができた）' },

    // why: two ← the second number, said last; seven ← the two numbers added up
    { id: 'n3', skill: 'number', level: 'B1', point: 'candidates', seg: [148.0, 155.3], keep: true,
      stem: 'How many candidates does he say he would like to hire?',
      choices: ['Two', 'Five', 'Seven'], a: 1,
      cue: '「I have found」のあとの数。',
      line: 'I have found *five candidates* I’d like to hire, and two…',
      said: '「雇いたい候補を5人見つけた」と言い、別に2人の話を足す。',
      mean: 'five candidates ＝ 候補5人。あとの2人は雇う人数ではない。',
      trap: '最後に聞こえる two に引かれやすい。何の数かを名詞で確かめる。',
      use: 'We have three people for the job.（その仕事の候補は3人です）' },

    // R fix: V2 (65 % blind): "teasing; the water fight was fun" was weak. "Break up this one fight" is the scope shift
    //   (this fight vs the department).
    // why: a bit of structure ← "a little" read as real modesty (遠慮); this one fight ← scope shift: the shouting just
    //   before taken as all he means
    // anchor: 168.5–175 s the shouting ("Everything I'm wearing is suede!") drowns out "Excuse me, everybody. Attention!";
    //   146.5–153.5 s the same man had come in wanting to hire Leslie's stand-in
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'leadership', seg: [168.0, 184.0],
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
      stem: 'Type what he asks: “Hey, guys. ___?” (3 words)', answer: "what's so important",
      cue: '「Hey, guys」のすぐあと。',
      line: 'Hey, guys. *What’s so important*?',
      said: '「やあ、みんな。何がそんなに大事なの？」と呼ばれた理由を聞く。',
      mean: 'what’s の s と so の s が一つにつながり、「ワッソウ」に近い。',
      trap: 's が一つに聞こえるので what so と書きやすい。what’s ＝ what is。',
      use: 'What’s so funny?（何がそんなにおかしいの？）' },

    // R fix: V2 (70 % blind) + C5: the key was the only success, and "The cage idea" gave away d2's key. All three
    //   now start "A simple fix…".
    // why: costs too much ← "cost-effective" heard as cost; fails ← the "Huh? What?" before the test, and the long
    //   build-up, read as a flop
    { id: 'g2', skill: 'gist', level: 'B2', point: 'outcome', seg: [190.0, 225.6],
      stem: 'How does the fountain project turn out?',
      choices: ['A simple fix works, and he is pleased with it', 'A simple fix works, but it costs far too much',
                'A simple fix fails, so they go back to the start'], a: 0,
      cue: '最後の場面の、ほめ言葉の中身。',
      said: '最後に出た案が成功し、「シンプルで上品で安上がり」とほめられる。',
      mean: '大がかりな案ではなく、部品を外すだけの手軽な解決で決着する。',
      trap: 'cost が聞こえて「高すぎる」と取りやすいが、cost-effective は「安上がり」。最後の評価で判断。',
      use: 'Simple and cheap. I love it.（シンプルで安い。最高）' },

    // R fix: V2 (75 % blind): the key's quoted "session" and "grand" flagged the irony. No quotes now, and all three
    //   are plain.
    // why: new test idea ← "water balloon" heard as a way to test fountains (keyword); blame ← a short interruption read
    //   as a complaint about who started it
    { id: 'h3', skill: 'humor', level: 'C1', point: 'balloon', seg: [192.4, 198.2],
      stem: 'Why does the interruption “Water balloon fight” get a laugh?',
      choices: ['It puts the meeting in plain, honest words', 'It offers a fun way to test the next fountain',
                'It points out who started all the trouble'], a: 0,
      cue: '大げさな言い方のすぐあとの、短い一言。',
      line: 'after yesterday’s *hands-on brainstorming session*… — *Water balloon fight.* — Fair enough.',
      said: '「昨日の体験型の案出し会のあと」に「水風船合戦ね」と返され、「まあね」と認める。',
      mean: 'もっともらしい名前を、実際の中身で言いかえている。',
      trap: 'water balloon を新しい案と取りやすい。前の大げさな言い方との差が笑い。',
      use: 'Fair enough. You’ve got a point.（まあね。一理ある）' },

    // R fix: V2 (50 % blind): a fourth strong choice. "Made the guard taller" is how a guard could stop mouths.
    // why: added a guard ← "splash guard" heard, "removed" lost; whole spout ← the name "spoutless" taken literally;
    //   taller ← "if it's not there, you can't put your mouth on it" heard as a guard that blocks mouths
    { id: 'd4', skill: 'detail', level: 'B2', point: 'guard', seg: [206.0, 211.3],
      stem: 'What did they change to make the new fountain?',
      choices: ['They took the splash guard off', 'They put a splash guard on it',
                'They took the whole spout out', 'They made the splash guard taller'], a: 0,
      cue: '「We just」のあとの動詞。',
      line: 'We just *removed the splash guard*, because if it’s not there, you can’t put your mouth on it.',
      said: '「はね防止の部品を外しただけ。それがなければ口をつけられない」と言う。',
      mean: 'remove ＝ 取り外す。部品を足すのではなく、減らした案。',
      trap: 'spoutless（口なし）の名前で、口ごと外したと取りやすい。動詞 removed と目的語を聞く。',
      use: 'Just remove the lid.（ふたを外すだけでいい）' },

    // R fix: V2 (55 % blind): "fill it faster" was weak. "Someone from the team" reads "your team keeps this up" as
    //   where the hire comes from.
    // why: stop looking ← "hold off" read as giving up for good; from the team ← "If your team keeps this up" heard as
    //   the source of the stand-in
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'holdoff', reveals: ['project'], seg: [217.4, 225.6],
      stem: 'After praising the fountain, what does he say they can do about Leslie’s spot?',
      choices: ['Wait for now before filling it', 'Give up on filling it for good',
                'Fill it with someone from the team'], a: 0,

      cue: '「If your team keeps this up」のあと。',
      line: 'If your team keeps this up, I think we can *hold off on* filling the Leslie void.',
      said: '「この調子なら、レスリーの穴を埋めるのは先送りにできそうだ」と言う。',
      mean: 'hold off on ～ ＝ ～を先に延ばす。やめるわけではない。',
      trap: 'off で「やめる」と取りやすい。hold off は「待つ」で、いずれはする。',
      use: 'Let’s hold off on dinner for now.（夕食はちょっと待とう）' }
  ]
};
