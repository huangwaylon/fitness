// “April Meets Tynnyfer | Parks and Recreation” (the official Parks and Recreation channel, Season 6): each Pawnee worker
// is paired with an Eagleton match; April gushes over hers, Tynnyfer, talks her out of the job, and sends her to a house
// that isn't hers.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 175 s; whisper's repeat of the last
// interview (175–186 s) is a hallucination. Untested: "Xanax o'clock" (30 s), the 63–68 s interview (speaker unclear,
// "I will. I already did." in whisper only), the nickname and "rejuvenation" lines (97–121 s, sexual), and "bonks"
// (45 s, "bongs" in the captions). No number item: the only number is "two Ys", which is about spelling.
// EAR CHECK: 151.4 s r1 — the cut falls after "Okay" and before "You should totally stay…"
// REVIEW 2026-11-16: pass 4, fix 17, drop 2, new 0; ear checks 1
// REVIEW Q: none. Removed two ear checks: Leslie is on screen (and April names her at 137 s), and the last
//   interview must be April's because it explains "my house in Miami"; no key depends on either.
import type { Clip } from '../types.ts';

export const aprilTynnyfer: Clip = {
  id: 'tynnyfer', video: 'j1HeNG1CjjE', title: 'April Meets Tynnyfer', dur: 187, wpm: 189, band: 'fast',
  tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "a new job title" had no clip word and nothing behind it; now a swap, the misreading of
    //   "your equivalent in Eagleton".
    // why: move ← "Eagleton" + a merger feel; swap ← "your equivalent" read as trading places
    { id: 'g2', skill: 'gist', level: 'B1', point: 'pair', seg: [0, 15.5],
      stem: 'What is being set up at the start of the clip?',
      choices: ['Pairing each person with an Eagleton match', 'Choosing which of them will move to Eagleton',
                'Swapping each person’s job with an Eagleton worker'], a: 0,
      cue: '最初の「Soon you will be」のあとの動詞。', line: 'Soon you will be *paired up* with the person who is roughly your *equivalent*',
      said: '近いうちに、Eagleton で同じような立場の人と組んでもらう、と説明している。',
      mean: '一人ずつ相手が発表される、顔合わせの場面。',
      trap: 'Eagleton が出るので「移る」「入れ替わる」話に聞こえやすい。paired up が中心の語。',
      use: 'We’ll be paired up for the project.（この企画ではペアを組みます）' },

    // R drop: w1 ("Who is paired with someone of the same name?") — a stated detail, not a voice/turn item (V4);
    //   retagged as detail it would make 5 details, and the name choices fail K7 (3 vs 5 letters). Deleted (never
    //   shipped).

    // R fix: V2 — "her sister's name" had nothing behind it; now a keyword trap on April's "Was your name Jennifer?"
    // why: by mistake ← April has just called her Jennifer; hates ← "No, it's…" heard as annoyance
    { id: 'd2', skill: 'detail', level: 'B1', point: 'rebrand', seg: [20.4, 28.3],
      stem: 'What does Tynnyfer say about the name Jennifer?',
      choices: ['It used to be her own name', 'People call her that by mistake', 'It is a name she can’t stand'], a: 0,
      cue: '「No, it’s…」のあと、「but then」の前。', line: 'I *used to be Jennifer*, but then I decided to rebrand myself.',
      said: '「前は Jennifer だったけど、自分をリブランドすることにした」と言う。',
      mean: '自分で名前を変えた、ということ。親が付けた名前ではない。',
      trap: 'No と否定から入るので嫌いな名前と取りやすいが、used to be ＝ 前はそうだった。',
      use: 'This used to be a bookstore.（ここは前は本屋だった）' },

    // R fix: V2 — "like a product" echoed "brand" and the other two were about something else; now all three are
    //   reasons for a new name.
    // why: married ← "my husband" comes later, and marriage is the usual reason for a new name; business ←
    //   "brand" = 商品・会社
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'rebrand', seg: [20.4, 28.3],
      stem: 'When she says she decided to “rebrand” herself, what does she mean?',
      choices: ['She remade her image, name and all', 'She took a new name when she married',
                'She took a new name for her business'], a: 0,
      cue: '「decided to」のあと。前の名前の話とつなげて。', line: 'I used to be Jennifer, but then I decided to *rebrand myself*.',
      said: '名前を Jennifer から変えたことを、リブランドと言っている。',
      mean: 'rebrand ＝ 商品のイメージを作り直すこと。人に使うと少しおおげさで、笑いになる。',
      trap: 'brand から会社や商売を思い浮かべやすいが、ここは自分のイメージの話。',
      use: 'The café rebranded last year.（そのカフェは去年イメージを一新した）' },

    // R fix: V2 — "really up to" pointed at the only choice with a hidden motive; now two choices are an act.
    //   B1: `job` dropped from reveals (its item, i2, is gone).
    // why: real friend ← all the gushing on the surface; keeps both ← they show off their "bonding" to Leslie,
    //   who then talks about commitment
    { id: 'g1', skill: 'gist', level: 'C1', point: 'fake', reveals: ['offer'], seg: [37, 175.4],
      stem: 'What is April really up to with Tynnyfer?',
      choices: ['Acting friendly to get her out of the way', 'Making a real friend in a new coworker',
                'Acting friendly so Leslie keeps them both'], a: 0,
      cue: '仲良しの会話と、最後の一人語りを比べて。',
      said: '服をほめ、仲良しを演じ、「この仕事はやめとけ」と言い、家まで貸すと言う。',
      mean: '表面は親友、本音は相手を追い払いたい。最後の一人語りで分かる。',
      trap: '話し方がずっと明るいので本当の友情に見える。本音は一人語りに出る。',
      use: 'She’s just being nice to get something.（何か目当てで優しくしてるだけ）' },

    // why: office ← "my" coworker-type story; shop ← "Where do I get that?" is about buying
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dress', seg: [41.6, 49.4],
      stem: 'Where did Tynnyfer first see the dress?',
      choices: ['On her spinning instructor', 'On a woman at her office', 'In a shop window in Eagleton'], a: 0,
      cue: 'ほめられた直後の返事、「wearing it」の前。', line: 'I saw my *spinning instructor* wearing it',
      said: 'エクササイズのインストラクターが着ているのを見て、どこで買えるのと思った。',
      mean: '服をほめられて、手に入れたいきさつを話している。',
      trap: '「どこで買うの？」と言うので店を選びやすいが、見たのは人が着ていたとき。',
      use: 'I saw my friend wearing it.（友だちが着てるのを見て）' },

    // why: I'd ← the v of I've and d sound alike when weak; I never ← the 've is lost altogether
    { id: 's2', skill: 'sound', level: 'B2', point: 'heard', seg: [54.4, 57.4],
      stem: 'Fill the gap: “___ heard of them before.”',
      choices: ['I’ve never', 'I’d never', 'I never'], a: 0,
      cue: '「Who are」の質問のすぐあと、最初の短い音。', line: '*I’ve never* heard of them before.',
      said: '「その人たち、聞いたことない」と言う。',
      mean: 'I’ve の v は弱く、never の n にすぐつながる。「アイヴネヴァ」に近い。',
      trap: 'I’d never なら過去のある時点の話になる。v は唇を軽くかむ音、d は舌の音。',
      use: 'I’ve never been to Hawaii.（ハワイは行ったことがない）' },

    // R fix: S1 — the stem no longer names the speaker (it was on the ear-check list for that alone).
    { id: 'x1', skill: 'dict', level: 'B1', point: 'delay', seg: [67.7, 72],
      stem: 'Type the first words on her return: “___, ladies.” (4 words)', answer: 'sorry for the delay',
      cue: '戻ってきたときの最初の一言。', line: '*Sorry for the delay*, ladies.',
      said: '「お待たせ、二人とも」と戻ってくる。',
      mean: 'for the は弱く、「フォザ」とつながる。delay は後ろに強勢。',
      trap: 'the はほとんど聞こえない。delay の前に短い音があれば the。',
      use: 'Sorry for the delay. I’m here now.（遅れてごめん、着いたよ）' },

    // R fix: V2 — blind, "did you have a chance" was the only stock opener; "have you had", the other stock
    //   opener, replaces the weak "would you have".
    // why: do you ← did you shrinks to "didja", close to "d'ya"; have you had ← the other stock form of the
    //   question, guessed from “a chance to”
    { id: 's1', skill: 'sound', level: 'B2', point: 'didyou', seg: [71.6, 76.4],
      stem: 'Fill the gap: “So, ___ a chance to compare notes…”',
      choices: ['did you have', 'do you have', 'have you had'], a: 0,
      cue: '「So」のすぐあと、弱くつながる部分。', line: 'So, *did you have* a chance to compare notes',
      said: '「話し合う時間はあった？」と聞いている。',
      mean: 'did you は「ディジュ」とつながる。待っていた間のことなので過去形。',
      trap: 'do you と似て聞こえるが、ここは「さっきまで」の話。最初の母音「イ」で判断。',
      use: 'Did you have a chance to look at it?（見てもらえました？）' },

    // R fix: V2 — "checked for errors" was weak; now a keyword trap on "respective duties".
    // why: written notes ← "notes" = メモ, taken literally; split duties ← "respective duties" heard as dividing them
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'notes', reveals: ['didyou'], seg: [71.6, 76.4],
      stem: 'When Leslie asks if they “compared notes”, what does she mean?',
      choices: ['Talked over what each of their jobs involves', 'Swapped the written notes they took in a meeting',
                'Agreed on who will take which duties'], a: 0,
      cue: '「compare notes」のあとの「on…」まで。', line: 'did you have a chance to *compare notes* on your respective duties?',
      said: 'それぞれの仕事について、話し合えたかと聞いている。',
      mean: 'compare notes ＝ 情報や経験を伝え合う。紙のメモは関係ない。',
      trap: 'notes を「メモ」と文字通り取ると紙の話に、duties を聞くと分担の話に引かれる。',
      use: 'Let’s compare notes after the tour.（ツアーのあとで感想を言い合おう）' },

    // R fix: V2 — "travel a lot" was the odd one out; now the literal haul (carry a heavy load), so all three are
    //   about the work.
    // why: heavy work ← haul = 重い荷を運ぶ, taken literally; long hours ← "long" + work
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'haul', seg: [102.2, 108],
      stem: 'When Leslie wants someone “in it for the long haul”, what does she mean?',
      choices: ['Someone who will stay for years', 'Someone who will do the heavy work', 'Someone who will work long hours'],
      a: 0,
      cue: '「Commitment」のすぐあとの一文。', line: 'I’m looking for someone who’s *in it for the long haul*.',
      said: '「長く続けてくれる人を探している」と言う。',
      mean: 'for the long haul ＝ 長い目で見て、最後まで。すぐやめない人、という意味。',
      trap: 'long から「長時間」、haul から「重い荷物」を想像しやすいが、続ける期間の長さの話。',
      use: 'We’re in it for the long haul.（長い目で取り組みます）' },

    // R fix: V2 — the key was the only "only"/"one" against two "both/neither + condition" choices; now three
    //   plain outcomes. V5: B2 → C1 (the cut is never said; it hangs on "one of you" mid-sentence).
    // why: share ← they've just shown off their bonding as a pair; neither ← "commit to Pawnee" read as having to
    //   move there
    { id: 'i3', skill: 'infer', level: 'C1', point: 'one', reveals: ['haul'], seg: [104.5, 113.85],
      stem: 'From Leslie’s talk about commitment, what does she imply about the job?',
      choices: ['One of the two will be let go', 'The two will share the job', 'Neither will be kept unless they move'],
      a: 0,
      cue: '最後の「if Pawnee is gonna commit to」のあと。',
      line: 'if Pawnee is gonna *commit to one of you*, you need to commit to Pawnee',
      said: '「Pawnee があなたたちの一人に決めるなら、その人も本気でいてほしい」と言う。',
      mean: 'one of you から、残れるのは二人のうち一人だと分かる。',
      trap: '仲良しを喜んだ直後なので「二人とも」と思いやすい。one of you を聞き落とさない。',
      use: 'Only one of us can get the room.（部屋を取れるのは一人だけ）' },

    // R fix: V2/K6 — the key was the only nuanced choice and "leave the room" had nothing behind it; now a
    //   Japanese frame (ちょっといいですか before a complaint).
    // why: problem ← ちょっといいですか usually comes before a complaint; stop ← it interrupts, so it sounds like
    //   "let me talk"
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'say', reveals: ['fake'], seg: [121.6, 129.9],
      stem: 'They keep opening with the same short question. What does it do here?',
      choices: ['Sets up a big show of warm feelings', 'Asks politely to bring up a problem',
                'Stops the other one from talking too much'], a: 0,
      cue: 'その質問のあとに続く内容と、声の明るさ。',
      line: '*Can I just say something?* I’m having so much fun right now.',
      said: '「ちょっと言っていい？」と前置きしてから、「今すごく楽しい」と言う。',
      mean: '大事な本音を言うふりの前置き。二人で言い合い、仲良しを大げさに演じている。',
      trap: '日本語の「ちょっといい？」は苦情の前置きにもなるが、ここで続くのは気持ちの告白。',
      use: 'Can I just say, this is delicious.（言わせて、これおいしい）' },

    // R drop: i2 ("Why does April tell Tynnyfer the job is so bad?") — the same fact as g1's key (C5), and its
    //   segment can't refute the surface reading, an honest warning from a new friend (K2); blind ~70 %. Deleted
    //   (never shipped). infer stays at 2 (i3, i1).

    // R fix: V2 — "too busy" was weak and the key the only general one; now "run-down", the literal pits = holes.
    // why: fights ← pit = 闘技場, taken literally; run-down ← pits = 穴だらけ, about the building
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'pits', seg: [129.9, 135.3],
      stem: 'What does April mean when she calls the office “the pits”?',
      choices: ['It is a miserable place to be', 'It is a place full of fights', 'It is a run-down, crumbling place'],
      a: 0,
      cue: '「Seriously」のすぐあとの短い一文。', line: 'This place is *the pits*.',
      said: '「ここは最悪だよ」と言っている。',
      mean: 'the pits ＝ 最悪、どん底。くだけた会話でよく使う。',
      trap: 'pit を「穴」や「闘技場」と文字通り取ると別の意味に見える。決まった言い方。',
      use: 'This weather is the pits.（この天気、最悪）' },

    // R fix: V2/K5 — "shows you would enjoy it" doesn't fit "would be like" (not a real reading); now filler
    //   like, which April uses all through the clip.
    // why: compares ← like = 〜のような; filler ← "Like, talking, like, so much forever" earlier
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', seg: [133.9, 140.9],
      stem: 'When April says “you’d be like…”, what does “like” do?',
      choices: ['Leads into how you would react', 'Compares you to someone else', 'Fills a pause while she thinks'], a: 0,
      cue: '「like」のすぐあとに来る音や声。', line: 'you’d be *like*, “Ugh,” and Leslie would be *like*, “Blah, blah, blah,”',
      said: '「働いたら『うぇ』ってなるし、Leslie は『ぺらぺら』」と言う。',
      mean: 'be like ＝「〜って言う・〜って感じ」。セリフや反応をそのまま引用する言い方。',
      trap: 'like は口ぐせのつなぎにもなるが、あとに声まねが来たら引用。「〜のような」とも違う。',
      use: 'And I was like, “No way!”（で、私「うそでしょ！」って）' },

    // why: Miami ← said a moment later; somewhere warm ← her own plan, in the same line
    { id: 'd4', skill: 'detail', level: 'B1', point: 'jail', seg: [141, 148.3],
      stem: 'Where does Tynnyfer say her husband is?',
      choices: ['In jail', 'In Miami', 'Somewhere warm'], a: 0,
      cue: '「while my husband is」のあと、最後の語。', line: 'going someplace warm while my husband is *in jail*',
      said: '夫が刑務所にいる間、暖かいところへ行こうと考えていた、と言う。',
      mean: 'さらっと言うが、かなり驚く事実。彼女の軽さが笑いになる。',
      trap: 'someplace warm は自分の行き先。while のあとが夫の居場所。',
      use: 'I’ll travel while my kids are at camp.（子どもがキャンプの間に旅行する）' },

    // R fix: V2 — "a goodbye" was a filler; now the pattern the same opener has set up twice (more gushing).
    //   N7: its trap calls the opener an act, p1's point, so it now reveals `say`.
    // why: confession ← "Can I just say something?" sounds like coming clean; gushing ← the same opener led into
    //   "I'm having so much fun" twice before
    { id: 'r1', skill: 'predict', level: 'B2', point: 'offer', reveals: ['fake', 'say'], seg: [141, 151.4],
      then: [151.4, 158],
      stem: 'Hearing her plan, April asks to say something. What kind of move comes next?',
      choices: ['An offer that sounds very generous', 'A confession about what she really plans',
                'More gushing about how fun this is'], a: 0,
      cue: '直前の「どこか暖かいところへ」という話に注目。',
      line: '*You should totally stay in my house in Miami.*',
      said: '暖かいところへ行きたいと聞いて、「マイアミの家に泊まって」と言う。',
      mean: '相手の願いにぴったりの申し出。気前のよさを演じている。',
      trap: '前置きが重いので本音の告白を予想しやすいが、この前置きは仲良しの演技。',
      use: 'You should totally come with us.（ぜひ一緒においでよ）' },

    // why: call ← the polite script for a host; push ← "jams" = stuck, so push it open
    { id: 'd5', skill: 'detail', level: 'B2', point: 'gate', seg: [157.4, 161.8],
      stem: 'What does April say to do if the gate sticks?',
      choices: ['Climb over it', 'Call her to open it', 'Push it hard'], a: 0,
      cue: '「but you can just」のあとの動詞。', line: 'The gate kind of jams sometimes, but you can just *jump it*.',
      said: '「門がときどき引っかかるけど、乗り越えればいい」と言う。',
      mean: 'jump ＝ ここでは「跳び越える」。勝手に入っていい、という話。',
      trap: 'jam ＝ 引っかかる、なので「押す」を選びやすい。but のあとが答え。',
      use: 'The door sticks, so pull it hard.（ドアが固いから強く引いて）' },

    // R fix: V2 — "amused" was weak; now 遠慮, a Japanese frame for a big offer. N7: the stem calls it an offer
    //   (r1's key), so it reveals `offer`.
    // why: suspicious ← "What?" just before; embarrassed ← 遠慮: a big favor is usually refused first in Japanese
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'fooled', reveals: ['fake', 'offer'], seg: [161.4, 166.6],
      stem: 'When Tynnyfer answers April’s offer, how does she feel?',
      choices: ['Grateful; she thinks April is sincere', 'Suspicious; she senses some kind of trick',
                'Embarrassed; she feels it is too much'], a: 0,
      cue: '申し出のあとの返事。「so」のあとの形容詞。', line: 'You are *so amazing* right now.',
      said: '「今のあなた、最高」と言い、聖人みたいだとほめる。',
      mean: '申し出を本気で信じ、感謝している。すっかりだまされている。',
      trap: '少し前の What? で疑っているように見えるが、そのあと「本気よ」と言われて信じる。',
      use: 'You’re a lifesaver.（本当に助かる）' },

    // R fix: V2/K5 — reworded into one parallel frame so "a stranger's" isn't the only odd shape. N7: its trap
    //   quotes "my house", r1's key, so it reveals `offer`.
    // why: friend's ← "Come by any time" + a name said as if she knows him; rarely goes ← "the gate jams" suggests
    //   an empty house
    { id: 'i1', skill: 'infer', level: 'B2', point: 'house', reveals: ['fake', 'offer'], seg: [166.4, 175.4],
      stem: 'What does April’s last interview reveal about the Miami house?',
      choices: ['It belongs to a man she has never met', 'It belongs to her, but she rarely goes',
                'It belongs to a friend who is away'], a: 0,
      cue: '最初の短い一文と、「address」の話。',
      line: 'It’s *Dwayne Wade’s house*. I got his *address off the internet*.',
      said: '「あれは有名選手の家。住所はネットで調べた」と明かす。',
      mean: '自分の家ではなく、知らない人の家に勝手に行かせようとしている。',
      trap: 'my house と言っていたので信じやすい。一人語りの場面では本音が出る。',
      use: 'I found the address online.（住所はネットで見つけた）' },

    // R fix: V2 — "nervous she will be found out" had nothing behind it; now "hope he's there" read kindly.
    // why: guilty ← "I really hope" sounds like a worried wish; excited ← "I really hope he's there when she walks
    //   in" heard without the end
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'wade', reveals: ['house', 'fake'], seg: [166.4, 175.4],
      stem: 'In her last interview, how does April feel about Tynnyfer’s trip?',
      choices: ['Gleeful, hoping it goes badly for her', 'Guilty, hoping nobody gets hurt',
                'Excited for her, hoping she meets him'], a: 0,
      cue: '「I really hope」のあと、最後まで。',
      line: 'I *really hope* he’s there when she walks in and he *throws a basketball at her head*.',
      said: '「彼女が入ったとき家主がいて、頭にボールを投げつけてほしい」と言う。',
      mean: '相手が痛い目にあうのを楽しみにしている。少しも悪いと思っていない。',
      trap: 'I hope は心配のときにも使うが、中身が「痛い目にあえ」なので期待の意味。',
      use: 'I really hope it works out.（うまくいくといいな）' },

    // R fix: V2 — the key was the only choice about the offer; now all three are, and differ on what it really was.
    //   N7: its said retells the offer (r1's key), so it reveals `offer`.
    // why: famous friend ← "It's Dwayne Wade's house" heard as a boast; romance ← "hope he's there when she walks
    //   in" read kindly
    { id: 'h2', skill: 'humor', level: 'C1', point: 'wade', reveals: ['house', 'fake', 'offer'], seg: [166.4, 175.4],
      stem: 'What makes April’s last interview funny?',
      choices: ['Her kind offer was a cruel trick all along', 'Her kind offer was a famous friend’s house',
                'Her kind offer was a way to set her up with him'], a: 0,
      cue: '前の場面の優しい申し出と、ここでの一言を比べて。',
      line: 'It’s Dwayne Wade’s house. … I really hope he’s there when she walks in',
      said: '優しく家を貸すと言ったのに、実は他人の家で、痛い目にあえばいいと思っている。',
      mean: '親切の顔と、意地悪な本音の落差が笑いになっている。',
      trap: 'hope he’s there を「会えるといいね」と取ると逆。後ろの一言まで聞く。',
      use: 'It sounded nice, but it was a trick.（親切そうで、実はわなだった）' },
  ]
};
