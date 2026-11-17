// “Spencer Roasts Carly w/ His Art?! 📺🔥 New iCarly | NickRewind” (NickRewind, Best of Carly Shay ❤️): Carly reviews
// Spencer's "Museum of Influence" on her Insta live, brings on Willow, finds the show mocks her too, and tells Spencer
// her content still has value; meanwhile Freddie learns Millicent faked being hurt to get a keyboard, takes it back,
// and gives it to her again after her thank-you.
// Segments from the captions, words from whisper (2026-11-17). Named in the audio: Carly (72 s, 134 s), Willow
// (75 s), Spencer (150 s), Freddie (223.9 s), Millicent (204 s, 253 s, 295 s). The speakers of 0–70 s are taken as
// Carly's live (her review); "Mission accomplished" (156 s, 171 s) answers "Spencer, what is this place?".
// Untested on purpose: 26 s (handle "@jocknessmonster"/"@jacknessmonster"), 53 s (whisper "the phone says", captions
// "the foam says"), 83 s (whisper "I'm really charismatic", captions "I'm Merly Cosmetics"), 113–120 s (captions only:
// "product placement"), 143–147 s ("nemesister": show backstory), 204–212 s (who says "Just my sales spike"), 230 s
// (whisper "This is the part where…", captions "where's the part where…"), 279–282 s (the "male celebrity" joke:
// world knowledge).
// REVIEW 2026-11-17: pass 15, fix 7, drop 1, new 0; ear checks 0
//   Open: g1, p1, h1, g2, i2 and p2 stay near 50 % blind with parallel choices; the audio settles each.
import type { Clip } from '../types.ts';

export const spencerRoastsCarly: Clip = {
  id: 'nemesister', video: '09aZIX0DmFw', title: 'Spencer Roasts Carly w/ His Art?! New iCarly', dur: 313, wpm: 119,
  band: 'slow', tags: ['友だち', '家'],
  show: 'iCarly',
  credit: 'iCarly (NickRewind, official YouTube channel)',
  questions: [
    // why: in charge ← board heard as 取締役会 (the board that runs things); fed up ← "in a really big way" heard as
    //   too much of it
    { id: 'ph1', skill: 'phrase', level: 'B2', point: 'board', seg: [5.8, 13.4],
      stem: 'In the opening line, how is the artist said to feel about the meme?',
      choices: ['He’s all in on it', 'He’s in charge of it', 'He’s fed up with it'], a: 0,
      cue: '冒頭、「he’s」のあとの言い方。',
      line: 'Well, he’s *on board with* the meme. In a really big way.',
      said: '作者は「そのミームに、すごく乗っかっている」と紹介する。',
      mean: 'on board with ＝ 賛成して加わる。in a really big way が本気度を強める。',
      trap: 'board を「取締役会」と取ると「仕切る」に聞こえる。ここは「乗る」側。',
      use: 'Are you on board with the plan?（その計画、乗る？）' },

    // R fix: the stem quoted "constipated", which flags the comment as an insult and points at "dry" (S2, V2 60 %)
    // why: warm ← "Love" taken at face value; puzzled ← "amplifying" heard as a hard word she can't place
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'amplify', seg: [28.6, 36.8],
      stem: 'When Carly reacts to the comment in the slideshow, what’s her tone?',
      choices: ['Dry: she means the opposite of her words', 'Warm: she admires how bold the piece is',
                'Puzzled: she can’t tell what the piece means'], a: 0,
      cue: '「Love」の前に読み上げた言葉の中身。',
      line: 'I’d rather be constipated for a month than read your blog. … *Love that he’s amplifying that.*',
      said: 'ブログへの悪口を読み上げ、「それを広めてるの、最高」と言う。',
      mean: '悪口を広めることを love と言う。言葉と中身が逆の皮肉。',
      trap: 'Love を文字通り取ると「ほめている」になる。直前が悪口なら、ほめ言葉は逆を疑う。',
      use: 'Oh great, love that for me.（あーあ、最高だね）' },

    // why: Doesn't ← a complaint reading ("doesn't this…?"); Did ← only the d is caught; Would ← the weak vowel of
    //   "does" heard as the w-less "would"
    { id: 's1', skill: 'sound', level: 'B2', point: 'soul', seg: [39.9, 44.3],
      stem: 'Fill the gap: “___ make your empty soul feel better?”',
      choices: ['Does this', 'Doesn’t this', 'Did this', 'Would this'], a: 0,
      cue: '「Like, like, like」のあと、質問の最初の2語。',
      line: '*Does this* make your empty soul feel better?',
      said: '展示の言葉「これで空っぽの心は満たされる？」を読み上げる。',
      mean: 'Does this が「ダzディス」と短くつながる。いいね好きへのからかい。',
      trap: 'does は母音がほぼ消える。Doesn’t なら「ン」が残るので、そこで聞き分ける。',
      use: 'Does this look okay on me?（これ、似合ってる？）' },

    // why: want more ← "a lot of comments coming in" heard as excitement, "don't" lost; too hard on it ← "a more
    //   nuanced take" heard as viewers asking her to be fairer
    { id: 'd1', skill: 'detail', level: 'B1', point: 'comments', seg: [60.8, 71.7],
      stem: 'Why does Carly decide to talk to some art fans?',
      choices: ['Most viewers don’t seem to like the show', 'Most viewers want to see more of the show',
                'Most viewers think she’s too hard on it'], a: 0,
      cue: '「comments」のあと、視聴者の反応。',
      line: 'Most of you *don’t seem to be loving it*, but why don’t we talk to some true art aficionados…',
      said: '「コメントが来てる。みんな気に入ってないみたい。美術通に聞こう」。',
      mean: 'don’t seem to be loving it ＝ 気に入っていない様子。だから別の意見を探す。',
      trap: 'don’t は弱く短い。コメントの多さを好評と取ると逆になる。',
      use: 'They don’t seem to be loving it.（あまりウケてないみたい）' },

    // R fix: "wins Carly over" was the weakest choice (V2 50 %); now Willow staying on as a fan, as she started
    // why: laughs it off ← Willow was brought on enjoying the show as a "true art aficionado"; storms off ← Carly does
    //   say "a little too personally" to her
    { id: 'g1', skill: 'gist', level: 'B2', point: 'willow', reveals: ['together'], seg: [72, 140.6],
      stem: 'How does Carly’s chat with Willow end up?',
      choices: ['Willow takes Carly’s side and goes to find others', 'Willow laughs it off and stays to enjoy the show',
                'Willow storms off after being called too touchy'], a: 0,
      cue: '後半、ウィローが最後に言う一言。',
      line: 'Us influencers, we have to *stick together*. I’ll go find *more people to be mad with us*.',
      said: 'ウィローは展示に怒り、「仲間を集めてくる」と言って去る。',
      mean: 'インフルエンサー同士で団結しよう、という流れ。二人が同じ側で終わる。',
      trap: '美術通として呼ばれたので「展示の味方」と思いやすい。最後の一言で、誰が組んだかを聞く。',
      use: 'Let’s go find more people.（もっと人を集めに行こう）' },

    // why: the very piece ← "opposite of art" and "opposite directions" blur together; a way to eat it ← "two
    //   Pringles in your mouth" heard as eating
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pringle', seg: [87, 99.2],
      stem: 'Why does the audience laugh at Willow’s idea of real art?',
      choices: ['It’s even sillier than the piece she rejects', 'It’s the very piece she says isn’t art',
                'It’s really just a way to eat the piece'], a: 0,
      cue: '「Everyone knows」のあと、「本物の芸術」の中身。',
      line: 'A single Pringle is the opposite of art. … real art is putting *two Pringles in your mouth*… so you look like a *potato chip duck*.',
      said: '「チップ1枚は芸術じゃない。本物は2枚をくわえてポテチのアヒルになること」。',
      mean: '展示をけなしたのに、もっとばかばかしいものを「本物」と言い切るずれが笑い。',
      trap: 'in your mouth で「食べる」と取りやすい。狙いはアヒルの見た目。',
      use: 'Everyone knows the best part is the crust.（いちばんおいしいのは耳だって常識）' },

    // anchor: 100.1–100.7 s both sources have "I, for one hand,": a blend of "I, for one" and "on the one hand"
    { id: 'nt3', skill: 'dict', level: 'C2', point: 'forone', seg: [99.6, 103.4],
      stem: 'Type Willow’s opening: “I, ___, am personally offended.” (3 words)', answer: 'for one hand',
      cue: '「I」と「am」の間。文法より、聞こえた音を。',
      line: 'I, *for one hand*, am personally offended.',
      said: '「私は、ひとつの手として、不快です」。I, for one と on the one hand が混ざっている。',
      mean: '気取って決まり文句を使おうとして、二つを混ぜてしまったおかしさ。',
      trap: 'I, for one に合わせて hand を消したくなる。書き取りは、正しい形でなく聞こえた音を書く。',
      use: 'I, for one, love this idea.（私としては、この案大好き）' },

    // why: agreeing ← the Japanese そうですね frame: naming her view sounds like a yes; asking for more ← "one way
    //   to look at it" heard as an invitation to explain
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'oneway', seg: [99.6, 109.3],
      stem: 'After Willow says she’s offended, what is Carly’s first reply doing?',
      choices: ['Holding back agreement, politely', 'Agreeing with her point, warmly', 'Asking her to say more, gently'],
      a: 0,
      cue: '最初の一言と、そのあとに続く質問。',
      line: 'That’s *one way to look at it*. But…',
      said: '「そういう見方もあるね。でも…」と受けてから、気にしすぎでは、と聞く。',
      mean: '「一つの見方」と認めるだけで、賛成はしていない。反対をやわらげる前置き。',
      trap: '日本語の「そうですね」と同じく同意に聞こえやすい。英語では、このあと But が来ることが多い。',
      use: 'That’s one way to see it, sure.（まあ、そういう見方もあるね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'personally', seg: [105.5, 109.3],
      stem: 'Type what Carly asks: “But don’t you think you’re ___ personally?” (5 words)',
      answer: 'taking this a little too',
      cue: '「you’re」のあと、「personally」の前まで。',
      line: 'But don’t you think you’re *taking this a little too* personally?',
      said: '「ちょっと気にしすぎじゃない？」と聞く。',
      mean: 'take it personally ＝ 自分への攻撃と取る。a little too でやわらげている。',
      trap: 'taking this と a little がひと続きに聞こえる。語数を数えて書く。',
      use: 'Don’t take it personally.（気にしないで。あなたのせいじゃない）' },

    // why: Carly, to Willow ← Carly runs the live and is the influencer; Carly, to her viewers ← she has been talking
    //   to her viewers all along
    { id: 'w1', skill: 'who', level: 'B1', point: 'together', seg: [133.4, 140.6],
      stem: 'Who says that influencers have to stick together, and to whom?',
      choices: ['Willow, to Carly', 'Carly, to Willow', 'Carly, to her viewers'], a: 0,
      cue: '最初の呼びかけの名前。',
      line: 'Listen, *Carly*. Us influencers, we have to stick together.',
      said: '「ねえカーリー、インフルエンサー同士、団結しなきゃ」と呼びかける。',
      mean: '呼びかけの名前が聞き手。カーリー本人ではなく、ウィローが話している。',
      trap: '配信の主はカーリーなので、彼女の言葉と思いやすい。文頭の呼びかけで、話し手と聞き手が決まる。',
      use: 'Listen, Tom, we’re in this together.（ねえトム、僕らは一緒だよ）' },

    // R fix: "never meant to hurt her" was the key's plain opposite and easy to rule out (V2 60 %); now a goal of
    //   pleasing her, in the key's shape
    // why: win her over ← "mission" heard as his aim of pleasing her, with the warm "Hello, sister" just before;
    //   finished in time ← "accomplished" taken as 完成 (the work is done)
    { id: 'i1', skill: 'infer', level: 'B2', point: 'mission', seg: [149.5, 157.2],
      stem: 'What does Spencer’s two-word reply tell Carly?',
      choices: ['That the show was meant to be mean', 'That the show was meant to win her over',
                'That the show was finished just in time'], a: 0,
      cue: 'カーリーの文句への、短い返事。',
      line: 'It’s really mean. To me, and to lattes. — *Mission accomplished.*',
      said: '「ひどい展示。私にも、ラテにも」と言われ、「任務完了」と返す。',
      mean: '「意地悪」に「狙いどおり」と返し、わざとそう作ったと認めている。',
      trap: 'accomplished を「完成した」とだけ取ると時間の話になる。何への返事かを押さえる。',
      use: 'You laughed? Mission accomplished.（笑った？作戦成功）' },

    // why: a second show ← "The Sequel" taken literally as the exhibit's 続編; sorry ← Carly's complaint heard as
    //   landing, and the reply as a cover-up
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sequel', reveals: ['mission'], seg: [159.6, 173.5],
      stem: 'When Carly says Willow doesn’t get it, why is the reply funny?',
      choices: ['He counts her anger as a second win', 'He’s planning a second show to top this',
                'He’s sorry, but hides it behind a joke'], a: 0,
      cue: '最初の「任務完了」と比べて。',
      line: 'she doesn’t even understand that you’re *mocking her*… — *Mission accomplished: The Sequel.*',
      said: 'ウィローはからかわれているのも分かっていない、と聞いて「任務完了・パート2」。',
      mean: '怒らせたのも、気づかれないのも狙いどおり。続編ふうに2回目の成功を喜んでいる。',
      trap: 'Sequel を本当の続編と取ると「次の展示」になる。繰り返しは同じ狙いの重ね。',
      use: 'Round two, here we go.（第2ラウンド、始めよう）' },

    // why: just as much art ← her list (sculpture, flower, Pringle) heard as a claim to the same rank; a joke people
    //   need ← "everything online is just some big joke" taken as her own view
    { id: 'g2', skill: 'gist', level: 'B2', point: 'value', seg: [174, 200.5],
      stem: 'In her speech to Spencer, what is Carly’s main point?',
      choices: ['Her posts have value, though they aren’t fine art', 'Her posts are art, just as much as his work is',
                'Her posts are a joke, but one that people need'], a: 0,
      cue: '「Maybe I’ve never…」のあとの but。',
      line: 'Maybe I’ve never made a fancy sculpture… but my content *still has value*.',
      said: '「彫刻も絵も作ってないけど、私の発信にも価値がある」と言う。',
      mean: '芸術と同じとは言わず、別のものとして価値を認めてほしいと主張している。',
      trap: '作品を並べるので「私も芸術家」と聞こえやすい。Maybe I’ve never… は、まず譲る形。',
      use: 'It’s not perfect, but it still has value.（完璧じゃないけど、価値はある）' },

    // R fix: "asks whether Spencer knows" was a filler and the key the only "Flags…" pair member left (V2 55 %); now
    //   a summing-up near miss. reveals 'likes' removed with nt2.
    // why: sum up ← it comes right after her main point, so it's heard as a wrap-up; new topic ← it opens a new
    //   sentence, so it's heard as a change of subject
    { id: 'm1', skill: 'marker', level: 'B2', point: 'knowwhat', seg: [189.5, 200.5],
      stem: 'Before Carly’s line about likes, what does her short question do?',
      choices: ['Flags that a frank admission is coming', 'Flags that she’s about to sum up',
                'Flags that she’s moving to a new topic'], a: 0,
      cue: '「has value」のあとの短い問いかけ。',
      line: 'And *you know what*? Likes do make my empty soul feel better.',
      said: '「それにね、いいねで空っぽの心は満たされるの」と続ける。',
      mean: 'you know what? は答えを求めない前置きで、言いにくい本音や意外な一言の合図。',
      trap: '文の頭に来るので話題の切り替えやまとめと取りやすい。直後に言いにくい本音が来たら、その前置き。',
      use: 'You know what? Let’s just order pizza.（ねえ、もうピザ頼もうよ）' },

    // R drop: nt2 (stress on "do"). An affirmative with "do" is emphatic in the text itself, so the key needs no
    //   audio (V1, 60 % blind); never shipped, so deleted. C2 stays at 2 (nt3, nt1).

    // R fix: "birthday" was the only choice not built on "starting a new…" (V2 50 %); now an online channel
    // why: new school ← "starting a new…" with the noun lost; channel ← the noun lost and filled from the online
    //   talk around it
    { id: 'd2', skill: 'detail', level: 'B1', point: 'business', seg: [212.5, 225.3],
      stem: 'What reason does Freddie give for the gift?',
      choices: ['She’s starting a new business', 'She’s starting at a new school', 'She’s starting a new channel'], a: 0,
      cue: '「since you’re」のあと。',
      line: 'since you’re *starting a new business*, I’d buy you a new keyboard.',
      said: '「新しく商売を始めるから、新しいキーボードを買ってきた」と渡す。',
      mean: 'since ＝ 〜だから。贈り物の理由をはっきり言っている。',
      trap: 'starting a new のあとの名詞を落とすと、学校など別の始まりを補ってしまう。最後の名詞まで聞く。',
      use: 'Since you’re here, want some coffee?（せっかく来たし、コーヒーどう？）' },

    // why: showing off ← "museum" heard as a hall of fame; collecting ← skewer = 串に刺して並べる (things lined up
    //   on a stick)
    { id: 'ph2', skill: 'phrase', level: 'C1', point: 'skewer', seg: [225.3, 233.2],
      stem: 'Right after the keyboard thanks, how is the exhibit summed up?',
      choices: ['As making fun of things online', 'As showing off the best things online',
                'As collecting things posted online'], a: 0,
      cue: '「Just」のあとの動詞。',
      line: 'So, this place is what? Just *skewering things* on the internet?',
      said: '「で、ここは何？ネットのものをこき下ろしてるだけ？」と聞く。',
      mean: 'skewer ＝ 串刺しにする、から「容赦なく笑いものにする」。批評でよく使う。',
      trap: '串の姿から「並べて集める」と取りやすい。批評の話の skewer は攻撃の意味。',
      use: 'The review totally skewered the movie.（その批評、映画をボロクソに書いてた）' },

    // why: faked account ← "not me" taken at face value; joking ← "so obviously" heard as playful
    { id: 'i2', skill: 'infer', level: 'B2', point: 'notme', seg: [245, 260],
      stem: 'What does Millicent’s first answer about the post show?',
      choices: ['She’s hoping a thin excuse will work', 'She’s sure someone faked her account',
                'She’s joking and expects him to laugh'], a: 0,
      cue: '名前の読み方と、少しあとの短い返事。',
      line: 'It says *not Millicent123*, so obviously it’s not me. … *fine.* It’s me.',
      said: '「名前に not が付いてるから私じゃない」と言い、すぐ「はいはい、私」と認める。',
      mean: 'not を付けただけの言い訳で、通らないのは本人も承知の上。',
      trap: 'not me を信じると「なりすまし」になる。すぐあとの fine は、言い訳をあきらめた合図。',
      use: 'Fine. You got me.（はいはい、バレたか）' },

    // why: guilt over her business ← "new business" from the gift scene; fear of her posts ← the exhibit's "careful
    //   about what they post online" and her post on the wall
    { id: 'd3', skill: 'detail', level: 'B2', point: 'parent', seg: [262.5, 270.3],
      stem: 'How does Millicent say she got the new things?',
      choices: ['By playing on his worries as a new parent', 'By playing on his guilt over her new business',
                'By playing on his fear of what she might post'], a: 0,
      cue: 'No のあと、「insecurities」の中身。',
      line: 'I just took advantage of your *insecurities about being a new parent* to get some cool stuff.',
      said: '「新米の親の不安につけこんで、いい物をもらっただけ」と明かす。',
      mean: 'take advantage of ＝ 〜につけこむ。insecurities は不安。',
      trap: 'new が続くので new business と混ざりやすい。about のあとを聞く。',
      use: 'Don’t take advantage of his kindness.（彼の優しさにつけこまないで）' },

    // why: her online post ← "in there" taken as the post on the wall; heard right ← a question about what was just
    //   said read as a hearing check
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'apology', seg: [271.9, 279.1],
      stem: 'After Millicent’s admission, what does the next question do?',
      choices: ['Points out she still hasn’t said sorry', 'Asks if her online post said sorry',
                'Checks that he heard her words right'], a: 0,
      cue: 'Come on のあとの、彼女の返事。',
      line: 'Was there *an apology* in there? — Come on. *An admission of guilt isn’t enough?*',
      said: '「今の中に謝罪はあった？」に、「認めただけじゃダメ？」と返す。',
      mean: '疑問の形で「まだ謝っていない」と指摘している。in there は今の発言の中。',
      trap: 'in there を展示の投稿と取ると話がずれる。there は直前の発言を指すことが多い。',
      use: 'Was there a “thank you” in there?（今ので「ありがとう」はあった？）' },

    // why: 2012 ← "twenty" plus a short second part; 2020 ← the weak final "one" lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'year', reveals: ['apology'], seg: [275, 282.4],
      stem: 'In the reply to “An admission of guilt isn’t enough?”, which year is named?',
      choices: ['2012', '2020', '2021'], a: 2, keep: true,
      cue: '「Not in」のあとの数字、最後まで。',
      line: 'Not in *2021*.',
      said: '「認めるだけじゃダメ？」に「2021年じゃ無理」と返す。今どき通らない、の意味。',
      mean: '年は twenty twenty-one と2つに分けて読む。',
      trap: '最後の one が弱いと twenty twenty に聞こえる。年は後半の数まで聞く。',
      use: 'Not in this day and age.（今の時代にそれはない）' },

    // R fix: the key was the only "No" (§9.6, V2 60 %); "Partly" became a second "No" with the wrong goal
    // why: yes ← "You're right" and the thanks taken at face value; end the lecture ← "You're right" heard as giving
    //   in to stop the telling-off
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'easy', seg: [288.2, 303.9],
      stem: 'When Millicent thanks Freddie for the moral lesson, is she sincere?',
      choices: ['Yes; the lesson really got through to her', 'No; she’s buttering him up to get it back',
                'No; she just wants the lecture to end'], a: 1,
      cue: 'お礼のあと、最後に彼女が言う一言。',
      line: 'Thank you for *teaching me a moral lesson*. … *You’re so easy.*',
      said: '「教訓をありがとう」と言い、キーボードを返されると「チョロいね」と言う。',
      mean: '反省のふりで相手をいい気分にさせる作戦。最後の一言で本心でないと分かる。',
      trap: 'お礼と反省は素直に聞こえやすい。最後まで聞いて、言葉と行動が合うかを見る。',
      use: 'Are you buttering me up?（おだててるの？）' },

    // R fix: "stop buying her things" was a filler (V2 60 %); now a close-the-matter near miss
    // why: grateful ← the thanks taken as sincere (the お礼 frame; a2's "Yes" reading); drop it ← the thanks heard as
    //   a way to end the row, which the keyboard and "You're so easy" refute
    // anchor: 297.7–303.6 s "You know what? Here, take the keyboard." then "You're so easy.": the praise pays off at
    //   once, and she says it worked
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'easy', seg: [290.9, 303.9],
      stem: 'Why does Millicent rank the lesson above “any gift”?',
      choices: ['So he’ll feel free to hand the gift back', 'So he’ll see she’s learned to be grateful',
                'So he’ll forgive her and drop the matter'], a: 0,
      cue: 'ほめたあと、何が起きて、彼女が何と言うか。',
      line: 'It’s *better than any gift* you could have ever gotten me. … *You’re so easy.*',
      said: '「どんな贈り物よりうれしい」と言うと、フレディはキーボードを返し、彼女は「チョロいね」。',
      mean: '贈り物はいらないと言えば、相手は返したくなる。感謝の形の取り返し作戦で、最後の一言が証拠。',
      trap: 'お礼の言葉は本心と取りやすい。ほめ言葉のすぐあとに何が起きたかで、目的を判断する。',
      use: 'You’re too easy, you know that?（チョロすぎだよ、ほんと）' },
  ]
};
