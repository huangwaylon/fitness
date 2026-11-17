// A2 REVIEW 2026-11-17: keep 4, rewrite 11, retire 8, new 2
// “Three Bachelors, One Party | Parks and Recreation” (the official Parks and Recreation channel, Season 5): the
// guys tease Jerry and toast him with ice-cream cones, Chris turns Andy's "impossible" dream into a visit to the Colts,
// they phone Anne to brag, and at the steakhouse Ron admits he likes Diane and a former business partner of Tom's pays.
// Segments from the captions, words from whisper (2026-11-16). Untested: 0–10 s, 18.8 s, 42.8 s, 55.5 s, 115–118 s,
// 132–153 s (the catch and a montage), 170–197 s (Anne's end of the call, the stripper, "I want meat"), 209–232 s,
// 245–260 s (the toast), 265–273 s.
// EAR CHECK: 90.2 s s1 — "can't": confirm the long vowel of "can't" against "can" (both sources say "can't")
// EAR CHECK: 278.2 s s2 — "owes me a lot of" run together (≈"owzmi-alotta"); both sources agree on the words
import type { Clip } from '../types.ts';

export const threeBachelors: Clip = {
  id: 'bachelors', video: 'mveGQHMMpR8', title: 'Three Bachelors, One Party', dur: 302, wpm: 154, band: 'mid',
  tags: ['友だち', '店・レストラン'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    { id: 'g2', skill: 'gist', level: 'B1', point: 'jerry', seg: [10.6, 42.4],
      stem: 'What do the guys do for Jerry at the start?', ja: '最初の場面で、みんなはジェリーに何をする？',
      choices: ['Tease him, then toast him', 'Toast him, then leave him alone', 'Give him a big gift'], a: 0,
      choicesJa: ['からかってから乾杯する', '乾杯してから置いていく', '大きなプレゼントをあげる'],
      cue: '「You know what?」のあと',
      line: 'Was she ill? … All that matters is you got married and you’re happy. … I suggest we *raise a cone to Jerry Gergich*.',
      said: '妻とのなれそめを「病気だった？」とからかい、最後は「ジェリーに乾杯」とアイスを掲げる。',
      mean: 'tease ＝ からかう。toast ＝ 乾杯する。からかったあとで、ちゃんと祝っている。',
      trap: 'からかいだけ聞くと、冷たい扱いだと思いやすい。最後の乾杯まで聞く。',
      use: 'Let’s make a toast to Ken!（ケンに乾杯しよう！）' },

    // R fix: V2 (blind 65 %): "romantic story" and "saved her" were fillers; now two other "why her?" readings
    // why: money ← a stock "why would she marry him" reason, but none of the three is money; family pushed her ←
    //   "her father committing a crime" taken alone, as a forced marriage (ill and blonde don't fit it)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ill', seg: [10.8, 20.5], retired: true,
      stem: 'What do the questions about how Jerry and Gail hit it off suggest?',
      choices: ['Only something strange could make her pick him', 'They suspect Gail married him for his money',
                'They think her family pushed her into it'], a: 0,
      cue: 'Was she… で始まる問いが、何を前提にしているか。',
      line: 'what was it exactly that led to you two hitting it off? *Was she ill?* Or did your father *witness her father committing a crime*?',
      said: '「きっかけは？彼女が病気だった？父親が彼女の父親の犯罪を目撃した？」と聞く。',
      mean: 'どの「理由」も、普通なら彼女がジェリーを選ぶはずがない、という前提。からかいの質問。',
      trap: '質問の形でも、答えを知りたいのではない。挙げる理由がどれも不幸なら、からかい。',
      use: 'What led to you two hitting it off?（二人はどうして意気投合したの？）' },

    { id: 'pr1', skill: 'phrase', level: 'B2', point: 'toast', seg: [19.2, 23.6],
      stem: 'What does “All that matters is…” mean?', ja: '“All that matters is…” はどういう意味？',
      choices: ['The important thing is…', 'The only problem is…', 'The funny thing is…'], a: 0,
      choicesJa: ['大事なのは〜だ', 'ただ一つの問題は〜だ', '面白いのは〜だ'],
      cue: '「You know what?」のあと',
      line: 'You know what? *All that matters is you got married and you’re happy.*',
      said: '「まあいい。大事なのは、結婚して幸せだってことだ」と言う。',
      mean: 'All that matters is 〜 ＝ 大事なのは〜だけ。ほかのことはどうでもいい、という言い方。',
      trap: 'matter を「問題」と思うと「ただ一つの問題」に聞こえやすい。matter は動詞で「大事だ」。',
      use: 'All that matters is you’re safe.（無事なのが一番だよ）' },

    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'cone', seg: [22.4, 28.6],
      stem: 'What does “raise a cone to Jerry” mean?', ja: '“raise a cone to Jerry” はどういう意味？',
      choices: ['Toast Jerry with ice cream', 'Buy Jerry more ice cream', 'Vote for Jerry'], a: 0,
      choicesJa: ['アイスでジェリーに乾杯する', 'ジェリーにアイスを買う', 'ジェリーに投票する'],
      cue: '「I suggest we」のあと',
      line: 'I suggest we *raise a cone* to Jerry Gergich.',
      said: '「ベストマンとして、ジェリーにコーンを掲げよう」と言う。',
      mean: 'raise a glass to 〜（〜に乾杯）の glass を、アイスのコーンに替えた言い方。',
      trap: 'raise から「手を挙げる（投票）」と思いやすい。raise 〜 to 人 は乾杯の決まり文句。',
      use: 'Let’s raise a glass to the happy couple.（お二人に乾杯しましょう）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'backup', seg: [35.8, 42.4],
      stem: 'Why was a new cone ready so fast?', ja: '新しいコーンがすぐ出てきたのはなぜ？',
      choices: ['Jerry often drops his', 'Every cone comes with a spare', 'It was for someone else'], a: 0,
      choicesJa: ['ジェリーがよく落とすから', 'どのコーンにも予備が付くから', 'ほかの人の分だったから'],
      cue: '「backup cone」のあと',
      line: 'I always make a *backup cone*. *He drops it about half the time.*',
      said: '「どうしてそんなに早く？」「いつも予備を作ってるの。彼、半分は落とすから」。',
      mean: 'backup ＝ 予備。half the time ＝ 2回に1回。よく落とすのを知っていて、先に用意していた。',
      trap: 'always から、店の決まりだと思いやすい。理由は次の文の He（ジェリー）にある。',
      use: 'I always bring a backup charger.（予備の充電器をいつも持ってる）' },

    { id: 'g1', skill: 'gist', level: 'B2', point: 'dream', seg: [42.4, 76],
      stem: 'What happens to Andy’s “impossible” dream?', ja: 'アンディの「無理な」夢はどうなる？',
      choices: ['Chris makes part of it real', 'Everyone laughs at it', 'Andy gives up on it for now'], a: 0,
      choicesJa: ['クリスが一部をかなえる', 'みんなが笑う', 'アンディがひとまずあきらめる'],
      cue: '夢の話のあとの電話',
      line: 'Well, *mine’s impossible*. … Hey, Jim… *I need a favor*.',
      said: '「僕のは無理」という夢を聞き、クリスが「ジム、頼みがある」と電話。次はコルツの会場。',
      mean: 'I need a favor ＝ 頼みがある。電話一本で、無理なはずの夢の一部がかなう。',
      trap: 'very specific dream で話が終わったと思いやすい。そのあとの電話と、次の場所を聞く。',
      use: 'I need a favor. Are you free tonight?（頼みがあるんだ。今夜空いてる？）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'score', seg: [47.5, 52], keep: true,
      stem: 'What score does Andy want for the Colts?', ja: 'アンディが見たいコルツのスコアは？',
      choices: ['19–0', '40–9', '49–0'], a: 2,
      choicesJa: ['19対0', '40対9', '49対0'],
      cue: '「Patriots」のすぐあと',
      line: 'I want to see the Colts beat the Patriots *49–nothing*',
      said: '「コルツがペイトリオッツに49対0で勝つのが見たい」と言う。',
      mean: 'nothing ＝ スコアの 0。forty-nine は前の「フォー」を強く言う。',
      trap: 'nineteen なら後ろの「ティーン」が強い。forty-nine のあとの nothing が 0。',
      use: 'We won three to nothing.（3対0で勝った）' },

    { id: 'a1', skill: 'phrase', level: 'B1', point: 'specific', seg: [56.3, 61],
      stem: 'What is “a very specific dream”?', ja: '“a very specific dream” とは？',
      choices: ['A dream full of details', 'A very special dream', 'A very short dream'], a: 0,
      choicesJa: ['細かいところまである夢', 'とても特別な夢', 'とても短い夢'],
      cue: '夢の話への返事',
      line: 'That’s a *very specific* dream, son.',
      said: '長い夢の話を聞いて、「ずいぶん具体的な夢だな」と返す。',
      mean: 'specific ＝ 具体的な、細かい。点数や人の名前まで決まっている夢だから。',
      trap: 'specific と special は似た音なので「特別な」と思いやすい。「スペシフィック」は「具体的」。',
      use: 'Can you be more specific?（もっと具体的に言ってくれる？）' },

    { id: 'a2', skill: 'attitude', level: 'B1', point: 'heaven', seg: [65, 71.2],
      stem: 'How does Andy feel when he says “I’m dead”?', ja: '“I’m dead” と言うとき、アンディはどんな気持ち？',
      choices: ['Very, very happy', 'Very tired from the trip', 'In big trouble'], a: 0,
      choicesJa: ['最高にうれしい', '移動ですごく疲れている', '大ピンチ'],
      cue: '「dead」のあと',
      line: '*I’m dead.* I am dead. And *this is what heaven is like*. I knew it.',
      said: '「僕は死んだ。ここが天国なんだ。やっぱりね」と言う。',
      mean: 'heaven ＝ 天国。うれしすぎて天国にいるようだ、という大げさな喜び。',
      trap: 'I’m dead は「疲れた」「まずい」にも使うので、そう思いやすい。直後の heaven で最高の気分と分かる。',
      use: 'This cake is so good. I’m in heaven.（このケーキおいしすぎ。天国だ）' },

    // R fix: K6 (blind 60 %): the key was the only hedged, two-part choice; the distractors are now two-part too
    // why: takes it as praise ← "I hope you're not" heard without "I can't tell"; takes it as a dig ← "joking"
    //   heard as a jab he has already caught
    { id: 'i2', skill: 'infer', level: 'C1', point: 'joking', seg: [85.5, 94.6], retired: true,
      stem: 'What does Andy’s answer to the remark about his size show?',
      choices: ['He hopes it’s praise, yet suspects a dig', 'He takes it as praise and thanks him for it',
                'He takes it as a dig and is hurt by it'], a: 0,
      cue: 'joking の前と、but のあと。',
      line: '*I can’t tell if you’re joking*, but *I hope you’re not*.',
      said: '「フットボールができそうな体格だ」に「冗談か分からないけど、本気だといいな」。',
      mean: 'ほめ言葉にも、太っているというからかいにも取れる。ほめ言葉であってほしい。',
      trap: 'hope だけ聞くと素直に喜んでいるように聞こえる。前の can’t tell も聞く。',
      use: 'I can’t tell if you’re serious.（本気か冗談か分からないよ）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'joking', seg: [89.5, 94.6],
      stem: 'Fill the gap: “I ___ tell if you’re joking…”', ja: '空所に入るのは？ “I ___ tell if you’re joking…”',
      choices: ['can’t', 'can', 'couldn’t'], a: 0,
      choicesJa: ['〜できない', '〜できる', '〜できなかった'],
      cue: 'I のすぐあと',
      line: 'I *can’t* tell if you’re joking, but I hope you’re not.',
      said: '「冗談か分からないけど、本気だといいな」と言う。',
      mean: 'can’t tell ＝ 分からない、見分けられない。アメリカ英語の can’t は t がほぼ消え「キャーン」と長め。',
      trap: 'can は「クン」と短く弱い。couldn’t は「クドゥン」。「キャーン」と長く強ければ can’t。',
      use: 'I can’t tell the difference.（違いが分からない）' },

    { id: 'd4', skill: 'detail', level: 'B1', point: 'friends', seg: [94.4, 101.2],
      stem: 'How did Chris and Jim Irsay become friends?', ja: 'クリスとジム・アーセイはどうやって友だちになった？',
      choices: ['Helping teens as volunteers', 'Working at the Statehouse', 'Coaching a youth football team'], a: 0,
      choicesJa: ['ボランティアで十代を助けて', '州議会で働いて', '少年フットボールチームを教えて'],
      cue: '「became friends while」のあと',
      line: 'Jim Irsay and I became friends *while volunteering to mentor Indianapolis teens*.',
      said: '「ジムとは、十代の若者の相談役になるボランティアで友だちになった」と話す。',
      mean: 'volunteer ＝ ボランティアをする。mentor ＝ 若い人の相談役になる。',
      trap: 'Statehouse（州議会）はツアーの場所で、出会いの場ではない。while のあとが答え。',
      use: 'We met while volunteering at a shelter.（保護施設のボランティアで知り合った）' },

    // R fix: V2 (blind 50 %): the key reworded off "could never compete", which spelled out the joke
    // why: the teens ← "They preferred Jim" heard as a dig at greedy kids (right mechanism, wrong target); Jim ←
    //   tickets and jerseys heard as buying the kids' affection
    // anchor: 99.5–105 s "I gave them tours of the Statehouse. Jim gave them Colts tickets and autographed jerseys":
    //   he sets his own gift beside a far better one himself, so "They preferred Jim" lands on him
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'mentor', reveals: ['friends'], seg: [94.4, 106.4], retired: true,
      stem: 'In Chris’s story about mentoring teens, who is the joke on?',
      choices: ['Chris, for thinking his tour could compete', 'The teens, for caring only about free stuff',
                'Jim, for buying the teens’ affection'], a: 0,
      cue: '2人の贈り物を並べたあとの、短い一言。',
      line: 'I gave them *tours of the Statehouse*. Jim gave them *Colts tickets and autographed jerseys*. — *They preferred Jim.*',
      said: '「僕は議事堂の見学ツアー。ジムはコルツのチケットとサイン入りジャージ」。そして「みんなジムを選んだ」。',
      mean: '並べた時点で勝負は見えている。当然の結果を真顔で報告し、自分を笑いものにしている。',
      trap: 'preferred の主語が若者なので、彼らへの皮肉に聞こえやすい。負けたのは話し手の贈り物。',
      use: 'I brought salad. They preferred the pizza.（私はサラダ。みんなピザがよかった）' },

    { id: 'a3', skill: 'attitude', level: 'B1', point: 'jersey', seg: [110.2, 115.5],
      stem: 'How does Reggie Wayne react to the jersey story?', ja: 'ジャージの話に、レジー・ウェインはどう反応する？',
      choices: ['It’s weird, but okay', 'He feels very honored', 'He thinks it’s a lie'], a: 0,
      choicesJa: ['変だけど、いいと思う', 'とても光栄に思う', 'うそだと思う'],
      cue: 'ジャージの話への返事',
      line: 'I got married in your jersey. That’s no joke. — *That’s weird. But I respect that.*',
      said: '「あなたのジャージで結婚式を挙げたんです」「変だね。でも、いいと思うよ」。',
      mean: 'weird ＝ 変な。I respect that ＝ その気持ちは認める。正直に言ってから、but で認めている。',
      trap: 'respect から、とても感激したと思いやすい。前の weird と合わせて一つの反応。',
      use: 'Odd choice, but I respect it.（変わった選び方だけど、いいと思う）' },

    { id: 'pr2', skill: 'pragma', level: 'B1', point: 'honor', seg: [119.4, 126.4],
      stem: 'What is Andy doing with “Could you do me the honor?”', ja: '“Could you do me the honor?” で、アンディは何をしている？',
      choices: ['Asking politely', 'Saying thank you', 'Saying sorry'], a: 0,
      choicesJa: ['ていねいに頼んでいる', 'お礼を言っている', '謝っている'],
      cue: '「pass thrown by you」のあと',
      line: 'it’s every groom’s dream to catch a touchdown pass thrown by you. *Could you do me the honor?* — Yeah, let’s do it.',
      said: '「あなたのパスを受けるのが夢です。お願いできますか？」と頼み、「いいよ」と返事がくる。',
      mean: 'do me the honor ＝ 光栄なことをしてくれる。とてもていねいに頼む言い方。',
      trap: 'honor（名誉）から、お礼を言っていると思いやすい。Could you…? は頼む形。',
      use: 'Could you take our picture, please?（写真を撮っていただけますか）' },

    // R fix: V2 (blind 70 %): "can't really throw" was a filler; now the star mocking him, after "Settle down"
    // why: the star warning the fan ← the line heard as the thrower's instruction, but "I'll try" answers it; the
    //   star mocking ← "Okay, guy. Settle down" a moment before, so the next joke seems his too
    { id: 'h3', skill: 'humor', level: 'C1', point: 'spiral', seg: [119.4, 128.4], retired: true,
      stem: 'Why does “Keep the spiral tight” get a laugh?',
      choices: ['A fan coaches a top quarterback on throwing', 'The star warns the fan to catch it cleanly',
                'The star mocks how nervous the fan sounds'], a: 0,
      cue: 'let’s do it のあとの一言と、その返事。',
      line: 'it’s every groom’s dream to catch a touchdown pass *thrown by you*. … *Keep the spiral tight.* — *I’ll try.*',
      said: '「あなたのパスを受けるのが夢」と頼み、「回転はしっかりね」。相手は「がんばるよ」。',
      mean: 'spiral ＝ ボールの回転。プロのクォーターバックに素人が投げ方を指示する。',
      trap: 'I’ll try は投げる側の返事。誰が誰に言ったかは返事で分かる。',
      use: 'Could you do me the honor?（お願いできますか）' },

    { id: 'ph2', skill: 'phrase', level: 'B2', point: 'rubit', seg: [159.4, 163.8],
      stem: 'What does “rub it in” mean?', ja: '“rub it in” はどういう意味？',
      choices: ['Brag to make her jealous', 'Share the fun with her', 'Check on her night'], a: 0,
      choicesJa: ['自慢してうらやましがらせる', '楽しさを分けてあげる', '彼女の夜の様子を聞く'],
      cue: '「calling you to」のあと',
      line: '…the time of our lives, and I’m calling you to *rub it in*.',
      said: '「最高の夜を過ごしてて、それを自慢したくて電話してる」と言う。',
      mean: 'rub it in ＝ わざと見せつけて悔しがらせる。傷に塩をすり込むイメージ。',
      trap: '楽しい報告の電話なので「おすそ分け」と思いやすい。rub it in ははっきり「自慢」。',
      use: 'Okay, you won. Don’t rub it in.（分かった、君の勝ち。見せつけないで）' },

    // R fix: K6/V2 (blind 65 %): the key was the only hedged choice; now duller/wilder in one form
    // why: even wilder ← the hot guys and Donna's stunt taken at face value; who is on the phone ← "who are you… to?"
    //   heard as a plain question about the caller
    { id: 'i3', skill: 'infer', level: 'C1', point: 'lying', seg: [170.6, 185.4], retired: true,
      stem: 'What does the question “who are you lying to?” reveal about Anne’s night?',
      choices: ['Her night is duller than she makes it sound', 'Her night is wilder than she makes it sound',
                'Someone near her wants to know who’s calling'], a: 0,
      cue: '電話の向こうで聞こえる、別の人の質問。',
      line: 'We’re *surrounded by hot guys*. … Anne, *who are you lying to?*',
      said: '「イケメンに囲まれてる」と話すアンに、そばの誰かが「誰にうそついてるの？」。',
      mean: '自慢返しは作り話。そばの人の一言で、実際は盛り上がっていないと分かる。',
      trap: '派手な話をそのまま信じやすい。lying to は相手を聞く質問ではなく、うその指摘。',
      use: 'Who are you kidding?（誰をだますつもり？）' },

    { id: 'd2', skill: 'detail', level: 'B1', point: 'table', seg: [198.6, 208.3],
      stem: 'Why did Jerry think the table was theirs?', ja: 'ジェリーはなぜ、その席を自分たちの席だと思った？',
      choices: ['He misheard a name', 'It had four seats', 'He booked it last week'], a: 0,
      choicesJa: ['名前を聞きまちがえた', '席が4つあった', '先週予約した'],
      cue: '「I thought you said」のあと',
      line: 'I thought you said the Gergich party. — No, no. I said the *Gingrich party*.',
      said: '「ゲーギッチ様のお席と言いましたよね」「いえ、ギングリッチ様です」。',
      mean: 'I thought you said 〜 ＝ 〜って言ったと思った。似た名前を自分の名前と聞きちがえた。',
      trap: 'four settings（4人分）は、席がおかしいと思う理由。取りちがえた原因ではない。',
      use: 'Sorry, I thought you said Tuesday.（すみません、火曜って聞こえました）' },

    // R fix: V2 (blind 50 %): the key reworded to match the distractors' form; the cue no longer says "liquid", now in the key
    // why: far more than four ← "four more glasses" heard as what would surprise; wrong one ← "specify" heard as
    //   being careful about the brand
    { id: 'h5', skill: 'humor', level: 'C1', point: 'liquid', seg: [221.9, 232.5], retired: true,
      stem: 'Why does “You’d be surprised” get a laugh?',
      choices: ['He has had it in forms other than liquid', 'He can drink a lot more than four glasses',
                'He doubts the waiter will bring the right one'], a: 0,
      cue: '注文の最後の言い方と、「言う必要ない」への返事。',
      line: 'four more glasses of Lagavulin *in liquid form*. — That’s not something you really need to specify. — *You’d be surprised.*',
      said: '「ラガヴーリンを液体で4杯」「わざわざ言わなくても」「意外とそうでもない」。',
      mean: 'ウイスキーは液体に決まっている。言う必要があるなら、液体以外でも口にしてきたことになる。',
      trap: '量への驚きではない。返事は specify（わざわざ言う）に対するもの。',
      use: 'You’d be surprised how often that happens.（それ、意外とよくあるんだよ）' },

    { id: 'd5', skill: 'detail', level: 'B1', point: 'likeher', seg: [232.6, 241.5],
      stem: 'What does Ron say about Diane?', ja: 'ロンはダイアンについて何と言う？',
      choices: ['He likes her', 'He misses her', 'He will marry her'], a: 0,
      choicesJa: ['彼女が好き', '彼女に会いたい', '彼女と結婚する'],
      cue: '「very candid」のあと',
      line: 'So, bachelor boy, how’s it going with Diane? — I’m gonna be *very candid* with you all. *I like her.*',
      said: '「ダイアンとはどう？」に「正直に言おう」と間を置き、「彼女が好きだ」とだけ言う。',
      mean: 'candid ＝ 正直な。I’m gonna be candid ＝ 正直に言うよ。本音の前置き。',
      trap: '大げさな前置きなので、結婚の話だと思いやすい。言うのは短い I like her だけ。',
      use: 'I’ll be honest with you. I like it.（正直に言うと、気に入ってる）' },

    // R fix: C2 rule (blind 50 %): two "Small:" distractors made the key the odd one out; now two Big, one Small
    // why: dodging ← a big build-up for three plain words heard as a mock-solemn joke (sincerity flip); propose ←
    //   the right size, the wrong content: the build-up heard as leading to news he never gives
    // anchor: 237.6 s "I'm gonna be very candid with you all", a ~2.5 s gap, then 240.4 s just "I like her"; the toast
    //   that follows (246.4–255.7 s) calls him a groom whose speech should be "to Ron" and nothing more
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'candid', reveals: ['speech'], seg: [232.6, 243.0], retired: true,
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
    { id: 'i4', skill: 'infer', level: 'C1', point: 'speech', reveals: ['candid'], seg: [246.0, 260.6], retired: true,
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
      stem: 'Type it: “Your meal has already been ___ by Mr. Hibbert.” (3 words)', ja: '書こう：“Your meal has already been ___ by Mr. Hibbert.”（3語）',
      answer: 'taken care of',
      cue: '「already been」のあと',
      line: 'your meal has already been *taken care of* by Mr. Hibbert.',
      said: '「お食事代は、ヒバート様からいただいております」と言われる。',
      mean: 'take care of は会計では「支払う」。taken care of ＝ 支払い済み。',
      trap: '「世話をする」の意味で考えると話が通らない。お店で聞いたら「支払い済み」。',
      use: 'Don’t worry, the bill’s taken care of.（心配しないで、会計は済んでるから）' },

    { id: 's2', skill: 'sound', level: 'B2', point: 'owes', seg: [275.3, 280.3],
      stem: 'Fill the gap: “I am not paying for that guy. He ___ money.”', ja: '空所に入るのは？ “He ___ money.”',
      choices: ['owes me a lot of', 'owed me a lot of', 'owes me a load of'], a: 0,
      choicesJa: ['私にたくさん借りがある', '私にたくさん借りがあった', '私に山ほど借りがある'],
      cue: '「He」のあと',
      line: 'He *owes me a lot of* money.',
      said: '「あいつの分は払わない。私に大金の借りがあるんだ」と言う。',
      mean: 'owe ＝ 借りがある。a lot of は「アラダ」のようにつながる。',
      trap: 'owed なら「オウドゥ」と d が入る。load は「ロウド」と伸びる。「オウズミアラダ」なら owes me a lot of。',
      use: 'You owe me a coffee.（コーヒー1杯おごりね）' },
  ]
};
