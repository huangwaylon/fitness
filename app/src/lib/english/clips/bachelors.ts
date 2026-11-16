// REVIEW 2026-11-16: pass 3, fix 20, drop 0, new 0; ear checks 3
// OPEN: a cold reader got 22/22 right, 16 at ≥ 50 % (ph1 65 %; h1, h3 60 %). ph1 tests "raise a glass", so anyone
//   who knows the idiom gets it; that's the skill.
// “Three Bachelors, One Party | Parks and Recreation” (the official Parks and Recreation channel, Season 5): the
// guys tease Jerry and toast him with ice-cream cones, Chris turns Andy's "impossible" dream into a visit to the Colts,
// they phone Anne to brag, and at the steakhouse Ron admits he likes Diane and a former business partner of Tom's pays.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–10 s (Gail's looks: "big breasts"/"big
// brass"; "Not my type at all" in whisper only), 18.8 s ("temporarily blonde"/"temporary"), 42.8 s ("Annie" in both
// sources; no item turns on the name), 55.5 s ("Hi, little baby"/"a little baby"), 115–118 s ("I'm a big fan, Mr.
// Luck. — Okay, guy. Settle down": speakers unclear), 132–153 s (the catch, then a music montage), 178–182 s (Donna and
// the stripper), 185–190 s ("Can I take a break?… dig for an hour": unclear), 191–197 s ("I want meat"), 209–216 s
// ("I wonder if we're related"), 265–273 s (Hibbert arrives; "devil shot").
// EAR CHECK: 90.2 s s1 — "can't": confirm the long vowel of "can't" against "can" (both sources say "can't")
// EAR CHECK: 240.4 s nt2 — the reaction to "I like her": whisper has a cheer ("Oh!") at 240.3 s, the captions only
//   "okay" at 244.4 s. The key also rests on the build-up ("very candid", then a ~2.5 s gap in both sources) and on the
//   toast ("so many things that I could say about Ron… to Ron")
// EAR CHECK: 278.2 s s2 — "owes me a lot of" run together (≈"owzmi-alotta"); both sources agree on the words
import type { Clip } from '../types.ts';

export const threeBachelors: Clip = {
  id: 'bachelors', video: 'mveGQHMMpR8', title: 'Three Bachelors, One Party', dur: 302, wpm: 154, band: 'mid',
  tags: ['友だち', '店・レストラン'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): both distractors were off the scene; now the order flipped, and the dropped cone
    // why: toast first ← the order flipped: the toast is the loudest moment; until he drops it ← the dropped cone
    //   and "No worries" come right after the toast
    { id: 'g2', skill: 'gist', level: 'B2', point: 'jerry', reveals: ['ill', 'toast', 'cone'], seg: [10.6, 42.4],
      stem: 'How do the others treat Jerry in the opening scene?',
      choices: ['They tease him, then toast him anyway', 'They toast him, then tease him about Gail',
                'They tease him until he drops his cone'], a: 0,
      cue: '質問の連続のあと、you know what からの流れ。',
      line: 'Was she ill? … All that matters is you got married and you’re happy. … I suggest we *raise a cone to Jerry Gergich*.',
      said: '妻とのなれそめを「病気だった？」とからかい、最後は「ジェリーに乾杯」とアイスを掲げる。',
      mean: 'からかわれ役のジェリーだが、仲間はずれではない。からかったあとで、ちゃんと祝っている。',
      trap: 'からかいだけ聞くと冷たい扱いに見える。最後の乾杯までがひとつの流れ。',
      use: 'We tease him, but we love him.（からかうけど、みんな彼が好き）' },

    // R fix: V2 (blind 65 %): "romantic story" and "saved her" were fillers; now two other "why her?" readings
    // why: money ← a stock "why would she marry him" reason, but none of the three is money; family pushed her ←
    //   "her father committing a crime" taken alone, as a forced marriage (ill and blonde don't fit it)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ill', seg: [10.8, 20.5],
      stem: 'What do the questions about how Jerry and Gail hit it off suggest?',
      choices: ['Only something strange could make her pick him', 'They suspect Gail married him for his money',
                'They think her family pushed her into it'], a: 0,
      cue: 'Was she… で始まる問いが、何を前提にしているか。',
      line: 'what was it exactly that led to you two hitting it off? *Was she ill?* Or did your father *witness her father committing a crime*?',
      said: '「きっかけは？彼女が病気だった？父親が彼女の父親の犯罪を目撃した？」と聞く。',
      mean: 'どの「理由」も、普通なら彼女がジェリーを選ぶはずがない、という前提。からかいの質問。',
      trap: '質問の形でも、答えを知りたいのではない。挙げる理由がどれも不幸なら、からかい。',
      use: 'What led to you two hitting it off?（二人はどうして意気投合したの？）' },

    // R fix: V2 (blind 65 %): "agrees with the teasing" was a filler; now a deadpan reading of the same line
    // why: one last dig ← "All that matters is you got married" heard as deadpan (nothing else about it is good);
    //   how they met ←
    //   every question just before was about how they met
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'toast', seg: [20.5, 28.6],
      stem: 'What does the line about what “all that matters” is do?',
      choices: ['It stops the teasing and turns to a toast', 'It caps the teasing with one last dig',
                'It asks Jerry to tell how they met'], a: 0,
      cue: 'you know what のあと、話の向きが変わるところ。',
      line: 'You know what? *All that matters is you got married and you’re happy.*',
      said: '「まあいい。大事なのは結婚して幸せだってこと」と言い、乾杯に移る。',
      mean: 'All that matters is ～ ＝ 大事なのは～だけ。からかいを打ち切っている。',
      trap: '皮肉の締めと取りやすいが、続くのは本気の乾杯。話の向きが変わる合図。',
      use: 'All that matters is you’re safe.（無事でよかった、それが一番）' },

    // R fix: V2 (blind 65 %): "a cheer to start eating" was a filler; now "raise" as a show of hands
    // why: another round ← "cone" heard as an order, and a backup cone comes next; a vote ← "I suggest we raise…"
    //   heard as a formal motion, put to a show of hands
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'cone', seg: [20.5, 28.6],
      stem: 'What does the best man’s “raise a cone” play on?',
      choices: ['The usual toast, but with ice cream', 'An order for another round of cones',
                'A show of hands, as in a vote'], a: 0,
      cue: 'I suggest we raise a… のあと、ふつう何が来る？',
      line: 'I suggest we *raise a cone* to Jerry Gergich.',
      said: '「ベストマンとして、ジェリーにコーンを掲げよう」。',
      mean: 'raise a glass to ～（～に乾杯）の glass を、アイスのコーンに替えた言い方。',
      trap: 'cone を注文、raise を挙手と取りやすい。raise ～ to 人 は乾杯の型。',
      use: 'Let’s raise a glass to the happy couple.（お二人に乾杯しましょう）' },

    // R fix: V2 (blind 60 %): "asked for two" was a filler; now a cone meant for someone else
    // why: free spare ← "I always make a backup cone" heard as shop policy; meant for someone else ← "backup"
    //   missed, so the cone seems to be one already made for another person
    { id: 'd1', skill: 'detail', level: 'B1', point: 'backup', seg: [35.8, 42.4],
      stem: 'Why was a new cone ready so fast?',
      choices: ['Jerry drops his about half the time', 'A spare comes free with every cone',
                'One was already made for someone else'], a: 0,
      cue: 'backup cone のあと、he で始まる理由。',
      line: 'I always make a *backup cone*. *He drops it about half the time.*',
      said: '「どうしてそんなに早く？」「いつも予備を作ってるの。彼、半分は落とすから」。',
      mean: 'backup ＝ 予備。ジェリーがよく落とすのを知っていて、先に用意していた。',
      trap: 'always だけ聞くと店の決まりに聞こえる。理由は次の文の he（ジェリー）にある。',
      use: 'I always bring a backup charger.（予備の充電器をいつも持ってる）' },

    // R fix: V2 (blind 55 %): "another weekend" was a filler; now a near miss (a game, not a visit)
    // why: never happen ← "mine's impossible" and "a very specific dream" sound like the last word on it; into a game ← the
    //   stadium heard as a game day, but "this is where they play the games" means none is on
    { id: 'g1', skill: 'gist', level: 'B2', point: 'dream', reveals: ['heaven'], seg: [42.4, 76.0],
      stem: 'What becomes of the dream activity called “impossible”?',
      choices: ['A friend’s phone call makes part of it real', 'Everyone agrees it could never happen',
                'A friend’s phone call gets them into a game'], a: 0,
      cue: '夢の話のあとの電話と、次の場所。',
      line: 'Well, *mine’s impossible*. … Hey, Jim… *I need a favor*.',
      said: '「僕のは無理」という夢を聞き、クリスが「ジム、頼みがある」と電話。次は試合会場。',
      mean: '無理なはずの夢の一部（コルツ）が、クリスの電話一本でかなう。',
      trap: 'very specific dream で話が終わったように聞こえるが、直後の電話が展開の合図。',
      use: 'I need a favor. Are you free tonight?（頼みがあるんだ。今夜空いてる？）' },

    // why: 19–0 ← -teen/-ty: "forty-nine" against "nineteen"; 40–9 ← "forty-nine" split in two, and "nothing" not
    //   caught as a zero
    { id: 'n1', skill: 'number', level: 'B1', point: 'score', seg: [47.5, 52.0],
      stem: 'By what score does he want the Colts to beat the Patriots?',
      choices: ['19–0', '40–9', '49–0'], a: 2, keep: true,
      cue: 'Patriots のすぐあと、数字と、ゼロの言い方。',
      line: 'I want to see the Colts beat the Patriots *49–nothing*',
      said: '「コルツがペイトリオッツに49対0で勝つのが見たい」と言う。',
      mean: 'nothing ＝ スコアの 0。forty-nine は最初が強い。',
      trap: 'nineteen は後ろの「ティーン」が強い。-ty か -teen かは強さの位置で聞き分ける。',
      use: 'We won three to nothing.（3対0で勝った）' },

    // R fix: K5/K6 (blind 50 %): the key was the only two-part "Dry, amused…"; all three now have one form
    // why: impressed ← "very" heard as praise; annoyed ← a wish that long, and "son" heard as a put-down
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'specific', seg: [57.0, 61.0],
      stem: 'How does the reply to the dream sound?',
      choices: ['Amused by how detailed it is', 'Impressed by how bold it is', 'Annoyed by how long it is'],
      a: 0,
      cue: 'very のあとの形容詞と、最後の呼びかけ。',
      line: 'That’s a *very specific* dream, son.',
      said: '長い夢の話を聞いて、「ずいぶん具体的な夢だな」と返す。',
      mean: 'specific ＝ 具体的。ほめでも怒りでもなく、細かすぎる夢を淡々と面白がっている。',
      trap: 'very はほめ言葉の前に来やすいが、specific は中立の語。何がほめられているかを聞く。',
      use: 'That’s a very specific question.（ずいぶん細かい質問だね）' },

    // R fix: V1/V2 (blind 70 %): "a fan at the stadium is happy" was common sense; the stem now names "I'm dead", and the distractors are its two slang senses
    // why: worn out ← "I'm dead" as everyday slang for exhausted; in trouble ← "I'm dead" as "I'm dead meat"
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'heaven', seg: [65.0, 71.2],
      stem: 'How does Andy feel when he says “I’m dead”?',
      choices: ['As happy as he could ever be', 'Worn out from getting there',
                'Sure he’s in big trouble'], a: 0,
      cue: 'dead のあと、どこにいると言うか。',
      line: '*I’m dead.* I am dead. And *this is what heaven is like*. I knew it.',
      said: '「僕は死んだ。ここが天国なんだ。やっぱりね」と言う。',
      mean: 'うれしすぎて天国にいるようだ、という大げさな喜び。',
      trap: 'I’m dead は「疲れた」「まずい」にも使う。直後の heaven で、最高の気分だと分かる。',
      use: 'I’m in heaven.（最高に幸せ）' },

    // R fix: K6 (blind 60 %): the key was the only hedged, two-part choice; the distractors are now two-part too
    // why: takes it as praise ← "I hope you're not" heard without "I can't tell"; takes it as a dig ← "joking"
    //   heard as a jab he has already caught
    { id: 'i2', skill: 'infer', level: 'C1', point: 'joking', seg: [85.5, 94.6],
      stem: 'What does Andy’s answer to the remark about his size show?',
      choices: ['He hopes it’s praise, yet suspects a dig', 'He takes it as praise and thanks him for it',
                'He takes it as a dig and is hurt by it'], a: 0,
      cue: 'joking の前と、but のあと。',
      line: '*I can’t tell if you’re joking*, but *I hope you’re not*.',
      said: '「フットボールができそうな体格だ」に「冗談か分からないけど、本気だといいな」。',
      mean: 'ほめ言葉にも、太っているというからかいにも取れる。ほめ言葉であってほしい。',
      trap: 'hope だけ聞くと素直に喜んでいるように聞こえる。前の can’t tell も聞く。',
      use: 'I can’t tell if you’re serious.（本気か冗談か分からないよ）' },

    // R fix: V2 (blind 70 %): "but I hope you're not" in the stem left only "can't"; the stem stops at "joking…", and "couldn't" replaces "could"
    // why: can ← the t of "can't" is barely there in American English; couldn't ← the past tense a listener
    //   expects after a remark already made, with the same lost t
    { id: 's1', skill: 'sound', level: 'B2', point: 'joking', seg: [89.5, 94.6],
      stem: 'Fill the gap: “I ___ tell if you’re joking…”',
      choices: ['can’t', 'can', 'couldn’t'], a: 0,
      cue: 'I のすぐあと、短い一語の母音の長さ。',
      line: 'I *can’t* tell if you’re joking',
      said: '「冗談か分からないけど、本気だといいな」。',
      mean: 'アメリカ英語の can’t は t がほぼ消え「キャーン」と長め。can は弱く「クン」と短い。',
      trap: 't が聞こえないので can と思いやすい。母音が長く強ければ can’t。',
      use: 'I can’t tell the difference.（違いが分からない）' },

    // why: Statehouse ← "tours of the Statehouse" comes right after; coaching ← the Colts and teens together sound
    //   like football coaching
    { id: 'd4', skill: 'detail', level: 'B1', point: 'friends', seg: [94.4, 101.2],
      stem: 'How did Chris and Jim Irsay become friends?',
      choices: ['Volunteering together to mentor teens', 'Working on a project at the Statehouse',
                'Coaching a youth football team together'], a: 0,
      cue: 'became friends while のあと。',
      line: 'Jim Irsay and I became friends *while volunteering to mentor Indianapolis teens*.',
      said: '「ジムとは、十代の若者を指導するボランティアで友だちになった」と話す。',
      mean: 'mentor ＝ 若い人の相談役になる。volunteering ＝ 無償で。',
      trap: 'Statehouse はツアーの場所で、出会いの場ではない。while のあとが答え。',
      use: 'We met while volunteering at a shelter.（保護施設のボランティアで知り合った）' },

    // R fix: V2 (blind 50 %): the key reworded off "could never compete", which spelled out the joke
    // why: the teens ← "They preferred Jim" heard as a dig at greedy kids (right mechanism, wrong target); Jim ←
    //   tickets and jerseys heard as buying the kids' affection
    // anchor: 99.5–105 s "I gave them tours of the Statehouse. Jim gave them Colts tickets and autographed jerseys":
    //   he sets his own gift beside a far better one himself, so "They preferred Jim" lands on him
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'mentor', reveals: ['friends'], seg: [94.4, 106.4],
      stem: 'In Chris’s story about mentoring teens, who is the joke on?',
      choices: ['Chris, for thinking his tour could compete', 'The teens, for caring only about free stuff',
                'Jim, for buying the teens’ affection'], a: 0,
      cue: '2人の贈り物を並べたあとの、短い一言。',
      line: 'I gave them *tours of the Statehouse*. Jim gave them *Colts tickets and autographed jerseys*. — *They preferred Jim.*',
      said: '「僕は議事堂の見学ツアー。ジムはコルツのチケットとサイン入りジャージ」。そして「みんなジムを選んだ」。',
      mean: '並べた時点で勝負は見えている。当然の結果を真顔で報告し、自分を笑いものにしている。',
      trap: 'preferred の主語が若者なので、彼らへの皮肉に聞こえやすい。負けたのは話し手の贈り物。',
      use: 'I brought salad. They preferred the pizza.（私はサラダ。みんなピザがよかった）' },

    // R fix: S3/cue leak: the cue's "but" was in the key only; it now points at what follows "weird"
    // why: honor ← "respect" heard as warm thanks; making it up ← "That's no joke" heard as "Is that a joke?"
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'jersey', seg: [110.2, 115.5],
      stem: 'How does the player react to the wedding-jersey story?',
      choices: ['He finds it odd, but he respects it', 'He’s touched and calls it an honor', 'He thinks Andy is making it up'],
      a: 0,
      cue: 'weird と、そのあとの一言。',
      line: 'I got married in your jersey. That’s no joke. — *That’s weird. But I respect that.*',
      said: '「あなたのジャージで結婚式を挙げたんです」「変だね。でも、尊重するよ」。',
      mean: 'weird（変）と正直に言ったうえで、but で相手の気持ちは認めている。',
      trap: 'respect だけ聞くと感激に聞こえる。but の前の weird と合わせて一つの反応。',
      use: 'Odd choice, but I respect it.（変わった選択だけど、いいと思う）' },

    // R fix: V2 (blind 70 %): "can't really throw" was a filler; now the star mocking him, after "Settle down"
    // why: the star warning the fan ← the line heard as the thrower's instruction, but "I'll try" answers it; the
    //   star mocking ← "Okay, guy. Settle down" a moment before, so the next joke seems his too
    { id: 'h3', skill: 'humor', level: 'C1', point: 'spiral', seg: [119.4, 128.4],
      stem: 'Why does “Keep the spiral tight” get a laugh?',
      choices: ['A fan coaches a top quarterback on throwing', 'The star warns the fan to catch it cleanly',
                'The star mocks how nervous the fan sounds'], a: 0,
      cue: 'let’s do it のあとの一言と、その返事。',
      line: 'it’s every groom’s dream to catch a touchdown pass *thrown by you*. … *Keep the spiral tight.* — *I’ll try.*',
      said: '「あなたのパスを受けるのが夢」と頼み、「回転はしっかりね」。相手は「がんばるよ」。',
      mean: 'spiral ＝ ボールの回転。プロのクォーターバックに素人が投げ方を指示する。',
      trap: 'I’ll try は投げる側の返事。誰が誰に言ったかは返事で分かる。',
      use: 'Could you do me the honor?（お願いできますか）' },

    // R fix: V2 (blind 60 %): "invite" and "miss her" were fillers; now the opposite direction, and "What are you doing?"
    // why: feel part of it ← the right target, the wrong direction: sharing the fun to include her; check on her ←
    //   "What are you doing?" comes a moment later
    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'rubit', seg: [159.4, 163.8],
      stem: 'Why is the group calling Anne?',
      choices: ['To brag so she feels left out', 'To share the fun so she feels part of it', 'To check how her own night is going'],
      a: 0,
      cue: 'calling you to のあと、短い3語。',
      line: '…the time of our lives, and I’m calling you to *rub it in*.',
      said: '「最高の夜を過ごしてて、それを自慢したくて電話してる」と言う。',
      mean: 'rub it in ＝ わざと見せつけて悔しがらせる。傷に塩をすり込むイメージ。',
      trap: '楽しい報告の電話は「おすそ分け」に聞こえやすいが、rub it in ははっきり「自慢」。',
      use: 'You won. No need to rub it in.（勝ったのは分かったから、見せつけないで）' },

    // R fix: K6/V2 (blind 65 %): the key was the only hedged choice; now duller/wilder in one form
    // why: even wilder ← the hot guys and Donna's stunt taken at face value; who is on the phone ← "who are you… to?"
    //   heard as a plain question about the caller
    { id: 'i3', skill: 'infer', level: 'C1', point: 'lying', seg: [170.6, 185.4],
      stem: 'What does the question “who are you lying to?” reveal about Anne’s night?',
      choices: ['Her night is duller than she makes it sound', 'Her night is wilder than she makes it sound',
                'Someone near her wants to know who’s calling'], a: 0,
      cue: '電話の向こうで聞こえる、別の人の質問。',
      line: 'We’re *surrounded by hot guys*. … Anne, *who are you lying to?*',
      said: '「イケメンに囲まれてる」と話すアンに、そばの誰かが「誰にうそついてるの？」。',
      mean: '自慢返しは作り話。そばの人の一言で、実際は盛り上がっていないと分かる。',
      trap: '派手な話をそのまま信じやすい。lying to は相手を聞く質問ではなく、うその指摘。',
      use: 'Who are you kidding?（誰をだますつもり？）' },

    // R fix: V2 (blind 50 %): "the waiter pointed him wrong" was vague; now Jerry's own claim, refuted by "No, no. I said…"
    // why: set for four ← "only four settings" is said, but as a reason to doubt it; the waiter mixed it up ←
    //   Jerry's own claim, "I thought you said the Gergich party", which "No, no. I said…" refutes
    { id: 'd2', skill: 'detail', level: 'B1', point: 'table', seg: [198.6, 208.3],
      stem: 'Why did Jerry think the table was theirs?',
      choices: ['He misheard another name as his own', 'The table was set for exactly four',
                'The waiter mixed his name up with another'], a: 0,
      cue: 'I thought you said のあとと、No, no のあと。',
      line: 'I thought you said the Gergich party. — No, no. I said the *Gingrich party*.',
      said: '「ゲーギッチ様のお席と言いましたよね」「いえ、ギングリッチ様です」。',
      mean: '似た名前を自分の名前と聞きちがえて、他人の予約席に座りかけた。',
      trap: 'four settings は「4人分しかない」という疑いの理由。席を取りちがえた原因ではない。',
      use: 'I thought you said Tuesday.（火曜って言ったと思ったけど）' },

    // R fix: V2 (blind 50 %): the key reworded to match the distractors' form; the cue no longer says "liquid", now in the key
    // why: far more than four ← "four more glasses" heard as what would surprise; wrong one ← "specify" heard as
    //   being careful about the brand
    { id: 'h5', skill: 'humor', level: 'C1', point: 'liquid', seg: [221.9, 232.5],
      stem: 'Why does “You’d be surprised” get a laugh?',
      choices: ['He has had it in forms other than liquid', 'He can drink a lot more than four glasses',
                'He doubts the waiter will bring the right one'], a: 0,
      cue: '注文の最後の言い方と、「言う必要ない」への返事。',
      line: 'four more glasses of Lagavulin *in liquid form*. — That’s not something you really need to specify. — *You’d be surprised.*',
      said: '「ラガヴーリンを液体で4杯」「わざわざ言わなくても」「意外とそうでもない」。',
      mean: 'ウイスキーは液体に決まっている。言う必要があるなら、液体以外でも口にしてきたことになる。',
      trap: '量への驚きではない。返事は specify（わざわざ言う）に対するもの。',
      use: 'You’d be surprised how often that happens.（それ、意外とよくあるんだよ）' },

    // R fix: C2 rule (blind 50 %): two "Small:" distractors made the key the odd one out; now two Big, one Small
    // why: dodging ← a big build-up for three plain words heard as a mock-solemn joke (sincerity flip); propose ←
    //   the right size, the wrong content: the build-up heard as leading to news he never gives
    // anchor: 237.6 s "I'm gonna be very candid with you all", a ~2.5 s gap, then 240.4 s just "I like her"; the toast
    //   that follows (246.4–255.7 s) calls him a groom whose speech should be "to Ron" and nothing more
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'candid', reveals: ['speech'], seg: [232.6, 243.0],
      stem: 'For the man asked about Diane, how big is “I like her”?',
      choices: ['Big: for him, it’s a heartfelt confession', 'Small: he’s dodging the question with a joke',
                'Big: he’s hinting that he plans to propose'], a: 0,
      cue: '大げさな前置きと、短い答えのあいだの間。',
      line: 'I’m gonna be *very candid* with you all. … *I like her.*',
      said: '「ダイアンとはどう？」に「正直に言おう」と間を置き、「彼女が好きだ」とだけ言う。',
      mean: '口数の少ない人には、「好きだ」は精いっぱいの告白。大きな前置きは本人の中の重さで、ふざけていない。',
      trap: '前置きと答えの差を冗談と取りやすい。続く乾杯の「山ほどあるが一言」で、口数の少ない人だと分かる。',
      use: 'I’ll be honest with you. I’m nervous.（正直に言うと、緊張してる）' },

    // R fix: V2 (blind 50 %): "save it for later" was a filler; now "so many things" read as the reason
    // why: nothing nice ← "so many things that I could say… but" heard as hiding bad things; too much to pick ←
    //   "so many things that I could say" heard as the reason itself
    { id: 'i4', skill: 'infer', level: 'C1', point: 'speech', reveals: ['candid'], seg: [246.0, 260.6],
      stem: 'Why does the best man keep his toast to two words?',
      choices: ['A short speech suits a groom of few words', 'He can’t think of anything nice to say',
                'He has too much to say to pick just one'], a: 0,
      cue: 'should represent のあと、誰に合わせるか。',
      line: 'the best man’s speech should *represent the groom*. So I will just say: *to Ron*. … — *Just perfect.*',
      said: '「言いたいことは山ほどあるが、新郎らしく一言。ロンに」。',
      mean: 'represent ＝ ～らしさを表す。口数の少ない新郎に合わせ、わざと一言に。',
      trap: 'so many things … but は悪口の前置きではない。理由は新郎に合わせること。',
      use: 'I’ll keep it short, like the man himself.（本人らしく、手短にします）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'paid', seg: [260.9, 266.6],
      stem: 'Type it: “Your meal has already been ___ by Mr. Hibbert.” (3 words)', answer: 'taken care of',
      cue: 'already been のあと、by の前の3語。',
      line: 'your meal has already been *taken care of* by Mr. Hibbert.',
      said: '「お食事代は、ヒバート様からいただいております」と告げられる。',
      mean: 'take care of は会計では「支払う」。taken care of ＝ 支払い済み。',
      trap: '「世話をする」の意味で考えると話が通らない。お店で聞いたら「支払い済み」。',
      use: 'Don’t worry, the bill’s taken care of.（心配しないで、会計は済んでるから）' },

    // R fix: V2 (blind 50 %): "lots of" was easy to rule out; now "a load of", one vowel off
    // why: owed ← the s of "owes" runs into "me" and can pass for a d; a load of ← lot/load differ
    //   only in the vowel and a final flap at this speed
    { id: 's2', skill: 'sound', level: 'B2', point: 'owes', seg: [275.3, 280.3],
      stem: 'Fill the gap: “I am not paying for that guy. He ___ money.”',
      choices: ['owes me a lot of', 'owed me a lot of', 'owes me a load of'], a: 0,
      cue: 'He のあと、money の前の短い語のつながり。',
      line: 'He *owes me a lot of* money.',
      said: '「トムの分は払わない。あいつには大金を貸してる」と言う。',
      mean: 'owe ＝ 借りがある。a lot of は「アラダ」のようにつながる。',
      trap: 'owes の s と me がつながり owed に聞こえやすい。直後の It’s true も手がかり。',
      use: 'You owe me a coffee.（コーヒー1杯おごりね）' },
  ]
};
