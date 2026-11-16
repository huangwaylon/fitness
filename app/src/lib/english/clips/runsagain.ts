// “Leslie Runs Again | Parks and Recreation” (the official Parks and Recreation channel, Season 6): Leslie packs up her
// council office, sees Councilman Dexhart's new scandal on TV, decides to run for his seat, and asks everyone for advice.
// Segments from the captions, words from whisper (2026-11-16). The news stretch (31–90 s: sexting, "junk", "gets me
// off") is left out on purpose. Nothing is built on 128 s (whisper "campaign form", captions "campaign for him"), on
// the banner (167–176 s, garbled in both and mostly visual), or on the last speaker at 252.6 s (not named).
// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 1
// REVIEW open: no C2 (native-tier) items yet; GUIDE-v2 §10 asks for 2–4 per bank (an author task).
// EAR CHECK: 97.2 s r1 — the cut falls after "next election", before "Someone who is smart…"
import type { Clip } from '../types.ts';

export const runsAgain: Clip = {
  id: 'runsagain', video: 'kjl_mAFKFLc', title: 'Leslie Runs Again', dur: 279, wpm: 174, band: 'mid',
  tags: ['職場', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: left him ← "my wife" + sad song reads as a breakup; quit ← "job" heard, but "lost" missed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'job', seg: [0, 9.2],
      stem: 'Why does the caller want a sad, slow song?',
      choices: ['His wife has just lost her job', 'His wife has just left him for good',
                'His wife just quit to find a new job'], a: 0,
      cue: '「my wife」のすぐあとの動詞。', line: 'Well, my wife *lost her job*, so maybe something sad and slow.',
      said: '歌の電報を頼む。妻が職を失ったので、悲しくゆっくりした曲がいいと言う。',
      mean: 'lose one’s job ＝ 職を失う。自分から辞める quit とは逆の立場。',
      trap: 'job だけ聞くと「辞めた」と取りやすい。lost か quit か、動詞を先に聞く。',
      use: 'I’m sorry you lost your job.（仕事のこと、大変だったね）' },

    // R fix: V2 — the key shared one half with each distractor (blind 50 %); now all three pack up, and only Ben's view
    // differs. Dropped reveals 'job' (nothing here gives d1 away).
    // why: back soon ← the title ("Runs Again") read into Ben's words; go back ← Leslie's own "go back for those" heard as his
    { id: 'g2', skill: 'gist', level: 'B2', point: 'leave', seg: [11.5, 29.6],
      stem: 'What is happening between Leslie and Ben at the start?',
      choices: ['She is packing up to leave, and he says getting away is best for her',
                'She is packing up to leave, and he says she will be back there soon',
                'She is packing up to leave, and he urges her to go back for the rest'], a: 0,
      cue: '箱の中身の話と、Ben の「trust me」まで。',
      line: 'getting away from the city council is *absolutely the best thing for you*',
      said: '最後の荷物を箱に入れる Leslie に、Ben は議会を離れるのが一番だと言う。',
      mean: '部屋を出る片付けと、Ben の励まし。',
      trap: 'go back for those は Leslie の言葉で、Ben は止めている。だれの言葉かを声で分ける。',
      use: 'Trust me, this is best for you.（信じて、これが一番だよ）' },

    // R fix: V2/S2 — the stem's "I know I'm…" invited the stock "broken record" (blind 60 %); the stem no longer quotes
    // it, and the distractors are other admissions a speaker makes before advice.
    // why: broke a promise ← "broken" read alone; no right ← a self-deprecating preface read as "I shouldn't say this"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'record', seg: [22.4, 29.6],
      stem: 'Before his advice about the council, what does Ben admit about himself?',
      choices: ['He has told her the same thing before', 'He has broken a promise to stay quiet',
                'He has no right to give her advice'],
      a: 0,
      cue: 'Okay のあと、but の前の決まり文句。', line: 'Okay, I know I’m a *broken record*, but…',
      said: '「同じことばかり言ってるけど」と前置きして、また同じ助言をする。',
      mean: 'broken record ＝ 壊れたレコード。同じことを何度も繰り返す人。',
      trap: 'broken だけで「約束を破る」と取りやすい。レコードが同じ所を回る様子を思い浮かべる。',
      use: 'Sorry to sound like a broken record, but…（何度も言ってごめん、でも…）' },

    // predict: the segment stops after "next election"; the reveal plays her description
    // R fix: V2 — the title made "she means herself" the only fit (blind 65 %); the distractors now fit the title too.
    // seg now starts at 90.1 (the tail of "Teabag" ended near 90.0).
    // why: Ben's help ← the title says she runs, so a request for help seems next; Dexhart ← the news is still on
    { id: 'r1', skill: 'predict', level: 'B2', point: 'herself', seg: [90.1, 97.2], then: [97.2, 104.6],
      stem: 'After Leslie says someone will beat him in the next election, what comes next?',
      choices: ['Clues to who it is, without the name', 'A request that Ben back her campaign',
                'More jokes about Dexhart’s texts'],
      a: 0,
      cue: 'someone と、ぼかした言い方に注目。',
      line: 'Not after *someone* beats him… Someone who is smart and hardworking…',
      said: '「次の選挙で誰かが彼を倒すまでは」と言い、その「誰か」の説明を始める。',
      mean: 'someone とわざとぼかすのは、自分のことを匂わせる前置き。',
      trap: 'タイトルから応援の頼みが来ると思いやすい。ぼかした主語は話し手自身のことが多い。',
      use: 'I know someone who could do it.（それができる人、知ってるよ）' },

    // R fix: V2 — "far too modest" and "very unlike herself" were easy to strike (blind 50 %); new distractors are
    // readings a partial listener could hold.
    // why: long list ← the list is long, so the joke seems to be its length; can't tell ← his question taken at face value
    { id: 'h1', skill: 'humor', level: 'C1', point: 'isit', reveals: ['herself'], seg: [97.0, 108.4],
      stem: 'Why does the audience laugh at Ben’s question “Is it you?”',
      choices: ['Her list has as good as named her',
                'He is teasing her for such a long list',
                'He honestly can’t tell who she means'], a: 0,
      cue: '最後の2つの特徴と、Ben の短い質問。',
      line: '…is also *blonde and named Leslie* and loves you. — Is it you?',
      said: '「賢くて、経験があって、金髪で、名前は Leslie で、あなたを愛してる人」と並べる。',
      mean: 'ほぼ名乗っているのに、Ben がわざわざ確かめるので笑いになる。',
      trap: 'リストの長さが笑いどころと取りやすいが、最後の名前で答えはもう出ている。',
      use: 'Wait, are you talking about yourself?（待って、それ自分のこと？）' },

    // R fix: S4 — seg ended at 129.8, inside Ben's "I don't"; now 129.7.
    // why: own district ← "district" heard, plan missed; for good ← "move" read into "rent"
    { id: 'd2', skill: 'detail', level: 'B1', point: 'district', seg: [118.8, 129.7],
      stem: 'How does Leslie get around the first problem Ben names?',
      choices: ['By renting a second home in his district', 'By running in her own district instead',
                'By moving there for good after she wins'], a: 0,
      cue: '「Not yet」のあと、but で始まる案。',
      line: 'we don’t even live in Dexhart’s district. — Not yet. But we can go and *rent a second apartment*',
      said: '地区に住んでいないと言われ、「まだね」と答えて、もう1つ部屋を借りる案を出す。',
      mean: '立候補の条件を満たす抜け道。Not yet ＝ これから住む。',
      trap: 'district が何度も出るので地区を変えると取りやすい。but のあとが本当の案。',
      use: 'We could rent a place for a month.（ひと月だけ部屋を借りてもいいね）' },

    // R fix: V2 — "51 %" was the only just-over-half choice (blind 70 %); 50 % is now 55 %, a second near-majority.
    // why: 15 ← fifty-one heard as fifteen (-teen/-ty); 55 ← "one" heard as "five"; 61 ← first syllable misheard
    { id: 'n1', skill: 'number', level: 'B1', point: 'percent', reveals: ['district'], seg: [122.5, 132.0],
      stem: 'What share of their time would they spend in the new place?',
      choices: ['15%', '51%', '55%', '61%'], a: 1, keep: true,
      cue: 'spend のあと。Ben も同じ数を言い返す。', line: '…and we can spend *51%* of our time there',
      said: '時間の51パーセントをそこで過ごせば住民と言える、という計算。Ben もすぐ同じ数で返す。',
      mean: '半分より少しだけ多い数で、ぎりぎり条件を満たす抜け道。',
      trap: 'fifty-one の one は短く、five と混ざりやすい。-ty のあとの音まで聞く。',
      use: 'I spend half my time at home.（時間の半分は家にいる）' },

    // R fix: S4 — seg end moved off "Oh, it's not…" (136.85).
    // why: shopping carts / fishing boats ← "shipping" heard as shopping or fishing (/ʃ/ and vowel)
    { id: 'd3', skill: 'detail', level: 'B1', point: 'dump', seg: [129.5, 136.85],
      stem: 'What does Ben say the district is a dumping ground for?',
      choices: ['Old shipping containers', 'Old shopping carts', 'Old fishing boats and nets'], a: 0,
      cue: '「dumping ground for old」のあと。', line: 'It’s basically a dumping ground for old *shipping containers*.',
      said: 'あの地区は古い輸送用コンテナの捨て場のようなもの、アライグマの町だと言う。',
      mean: '住みたくない理由を大げさに言っている。dumping ground ＝ 捨て場。',
      trap: 'shipping と shopping は母音が違うだけ。i の短い音は「シ」に近い。',
      use: 'This street is basically a parking lot.（この通り、ほぼ駐車場だね）' },

    // R fix: S4 — seg ended inside "Well, so what"; now 144.05.
    // why: scandal past ← "sex scandal" earlier + "dirty" read as a dirty record; money ← "campaigns" read as spending
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'dirty', seg: [137.6, 144.05],
      stem: 'After “And also, Dexhart…”, what is Ben warning about?',
      choices: ['He plays rough and unfair to win', 'He has a messy past full of scandals',
                'He wins by spending huge sums'], a: 0,
      cue: '「And also」のあと。続く brutal も手がかり。',
      line: 'Dexhart *fights dirty*. And he’s never lost an election because he runs *brutal*… campaigns.',
      said: '汚い手を使い、激しい選挙戦で一度も負けていないと言う。',
      mean: 'fight dirty ＝ 反則も気にせず戦う。過去の話ではなく戦い方の話。',
      trap: 'スキャンダルの話から dirty を「汚れた過去」と取りやすい。fight と組めば戦い方。',
      use: 'Be careful, he fights dirty.（気をつけて、あの人は手段を選ばない）' },

    // R fix: V2 — "let Ben do the fighting" was easy to strike (blind 55 %); new C is the clean-campaign script. seg was
    // 143.6–150.4 (cut "campaign" and Ben's "Look"); now 144.0–150.3.
    // why: scared ← a reply to a warning is expected to be worry; keep it clean ← "dirt" heard, "plenty of dirt on" missed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'bringit', seg: [144.0, 150.3],
      stem: 'How does Leslie take Ben’s warning about Dexhart?',
      choices: ['She can’t wait to hit back at him', 'She is scared but tries to hide it',
                'She will run, but keep things clean'], a: 0,
      cue: '最初の短い2語と、最後の決まり文句。', line: 'Well, *so what*? … I say *bring it on*.',
      said: '「だから何？」と返し、相手の弱みは十分握っている、受けて立つと言う。',
      mean: 'so what と bring it on で、怖がるどころかやる気になっている。',
      trap: '注意されたら心配するのが普通の流れ。でも so what は「気にしない」の合図。',
      use: 'A harder test? Bring it on.（もっと難しい？受けて立つよ）' },

    // R fix: V2/S2 — the stem's "Look, I just think…" signalled push-back (blind 50 %); the stem no longer quotes it, and
    // the key no longer echoes "worth it". seg starts at 150.3 (149.9 cut "Dexhart").
    // why: help later ← Japanese frame: "calm down first, then I'll help"; agreeing ← "I just think" read as support
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'breath', seg: [150.3, 155.8],
      stem: 'What is Ben doing when he speaks up about her PR plan?',
      choices: ['Asking her to stop and rethink the whole idea', 'Offering to help her once she has calmed down',
                'Agreeing, but asking her to plan more carefully'], a: 0,
      cue: 'Look で話を止めたあとの2つの文。',
      line: 'we need to *take a deep breath*. Think about if this is *really worth it*.',
      said: '勢いづいた Leslie を止め、落ち着いて、本当に価値があるか考えようと言う。',
      mean: '反対を直接言わず、立ち止まらせる言い方。',
      trap: '手伝う約束はしていない。I just think は意見を柔らかく言う前置きで、賛成ではない。',
      use: 'Let’s take a deep breath and think.（いったん落ち着いて考えよう）' },

    // R fix: S4 — seg started inside Ben's "worth it"; now 155.6. Ear check removed: both transcripts agree.
    { id: 'x1', skill: 'dict', level: 'B2', point: 'getback', seg: [155.6, 158.4],
      stem: 'Type what Leslie says: “Anything is worth me ___ city council.” (3 words)', answer: 'getting back on',
      cue: '「worth me」のあと、速い3語。', line: 'Anything is worth me *getting back on* city council.',
      said: '議会に戻れるなら何でもする価値がある、と言い切る。',
      mean: 'get back on ＝ （元の場所・仕事に）戻る。on は議会の一員になること。',
      trap: 'getting の t は弾んで「ゲリン」に近く、back on はつながって「バッコン」に聞こえる。',
      use: 'I want to get back on the team.（チームに戻りたい）' },

    // why: explain ← "listen to yourself" + a list of her words read as a request to explain them; not hearing him ← "listen" taken as "listen to me"
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'yourself', seg: [179.0, 184.4],
      stem: 'When Ben repeats her words back to her, what is he doing?',
      choices: ['Showing her the plan is unlike her', 'Asking her to explain what they mean',
                'Telling her she isn’t hearing him out'], a: 0,
      cue: '彼女の言葉を2つ並べたあとの短い文。',
      line: 'Leslie, *listen to yourself*. Loopholes? Scorched-earth policies? *This isn’t you.*',
      said: '「自分の言ってることを聞いて。抜け道？焦土作戦？君らしくない」と言う。',
      mean: '本人の言葉をそのまま返して、いつもの彼女と違うと気づかせている。',
      trap: 'listen を「私の話を聞いて」と取りやすい。to yourself ＝ 自分の言葉に耳を向けて。',
      use: 'Listen to yourself. That’s not like you.（自分の言葉を聞いて。らしくないよ）' },

    // R fix: V2/N7 — the stem quoted "This isn't you", pr2's key (now reworded); C was a filler (blind 60 %), now the
    // wrong implication that she half agrees.
    // why: glad ← "aren't" heard as "are" (n't lost); worried ← Japanese frame: criticism read as sinking in
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'support', seg: [183.3, 186.9],
      stem: 'How does Leslie react to Ben’s objection to her plan?',
      choices: ['Hurt that Ben won’t back her', 'Glad that Ben is behind her', 'Worried that Ben may be right'],
      a: 0,
      cue: '文の頭の強い一言と、supporting の前。', line: 'I *cannot believe* you *aren’t* supporting me on this.',
      said: '「この件で応援してくれないなんて信じられない」と言う。',
      mean: 'cannot believe ＋ 否定で、がっかりして責める気持ち。',
      trap: 'aren’t の t は消えやすく are に聞こえる。cannot believe の強さで気持ちを取る。',
      use: 'I can’t believe you’re not coming.（来ないなんて信じられない）' },

    // R fix: V2 — "forgotten by the election" was a filler (blind 60 %). seg was 186.4–193.0 (cut "on this" and "You
    // know"); now 186.75–192.9.
    // why: set up ← "not a coincidence" read literally as a plot; blame her ← "the same day I'm leaving" read as suspicion on her
    { id: 'i1', skill: 'infer', level: 'B2', point: 'meant', seg: [186.75, 192.9],
      stem: 'What does Leslie make of the timing of Dexhart’s scandal?',
      choices: ['She sees it as a sign she should run', 'She thinks someone set it up on purpose',
                'She worries people will link it to her'], a: 0,
      cue: '「same day」のあとの2つの文。',
      line: '…the same day I’m leaving office. That is *not a coincidence*. This was *meant to be*.',
      said: '自分が議会を去る日に相手の問題が出た。偶然じゃない、と言う。',
      mean: 'meant to be ＝ そうなる運命。天の合図と見ている。',
      trap: 'not a coincidence だけだと「仕組まれた」と取りやすい。次の文が決め手。',
      use: 'Maybe it was meant to be.（運命だったのかもね）' },

    // why: help plan ← "feedback" read as campaign input; hear news ← "gather everyone" read as an announcement
    { id: 'i2', skill: 'infer', level: 'C1', point: 'feedback', reveals: ['meeting'], seg: [192.8, 200.1],
      stem: 'Why does Ben suggest bringing everyone in?',
      choices: ['He expects them to talk her out of it', 'He wants them to help plan the campaign',
                'He wants them to hear the news first'], a: 0,
      cue: '「You know what?」で話を変えたあと。',
      line: 'Why don’t we gather everyone in here, you explain… and we *get some feedback*.',
      said: 'みんなを集めて考えを説明し、意見をもらおうと提案する。',
      mean: '自分では止められないので、周りの意見で考え直させたい。Leslie は応援と受け取る。',
      trap: 'feedback を選挙の手伝いと取りやすい。直前まで反対していた流れで読む。',
      use: 'Why don’t we ask the others?（ほかの人にも聞いてみない？）' },

    // R fix: S3 — the cue named "Ben", which among the choices only the key has; the cue no longer names him.
    // why: too much ← "talking" read as "talking too much"; your turn ← literal "now you are the one who talks"
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'talking', seg: [197.0, 200.6],
      stem: 'What does Leslie mean by her quick reply to Ben’s idea?',
      choices: ['That’s more like it, Ben', 'Now you’re saying too much', 'Now it’s your turn to speak'], a: 0,
      cue: '提案の直後、短い3語。', line: '— *Now you’re talking.*',
      said: 'Ben の提案を聞いて、すぐに「そうこなくちゃ」と返す。',
      mean: 'Now you’re talking ＝ いいね、その調子。相手の案に乗るときの決まり文句。',
      trap: '文字通り「今あなたが話している」と取りやすい。気に入った提案への返事と覚える。',
      use: 'Free dessert? Now you’re talking.（デザート無料？そうこなくちゃ）' },

    // R fix: V2 (§9.4) — the title says she runs, which picked the key (blind 55 %); now every choice ends with her
    // running, and only the group's answer differs.
    // why: only Ron ← Ron's "no" is the last and clearest; split ← Andy's "I could be wrong" read as a yes
    { id: 'g1', skill: 'gist', level: 'B2', point: 'meeting', seg: [200.0, 252.5],
      stem: 'How does the group meeting go for Leslie?',
      choices: ['All of them say no, and she runs anyway',
                'Only Ron says no, and she runs anyway',
                'They are split, and she runs anyway'], a: 0,
      cue: '一人ずつの答えと、最後の彼女の決意。',
      said: '発表に誰も喜ばず、一人ずつ聞いてもみな反対。それでも Leslie は出馬すると言う。',
      mean: '助言を求めたのに、聞く気はなかったという流れ。',
      trap: 'Andy の「でも違うかも」で意見が割れたと取りやすいが、Andy も危ないと言っている。',
      use: 'Everyone said no, but I did it anyway.（みんな反対したけど、やった）' },
    // R fix: V2 — "hold the cheer until later" was easy to strike (blind 55 %); new C is the literal reading of "I love
    // the sound of silence".
    // why: shy ← silence read as shyness; prefers quiet ← "I love the sound of silence" taken literally
    { id: 'h2', skill: 'humor', level: 'C1', point: 'silence', reveals: ['meeting'], seg: [207.5, 219.6],
      stem: 'When nobody answers Leslie’s announcement, why is her next line funny?',
      choices: ['She pretends the silence means a cheer is coming', 'She teases them for being too shy to clap',
                'She claims she prefers a quiet, calm reaction'], a: 0,
      cue: '沈黙のあとの彼女の一言と、最後の right?',
      line: 'I love the *sound of silence before a big cheer*. That’s what’s happening, *right*?',
      said: '発表に誰も反応しない。「大歓声の前の静けさっていいよね。そうでしょ？」',
      mean: '反対の沈黙を、拍手の前ぶれと思おうとしている。right? に不安が出る。',
      trap: '相手を責めてはいない。良いほうに読もうとする言い方と、確かめる right? を聞く。',
      use: 'That’s a good sign, right?（いい兆しだよね？）' },

    // why: one of several ← "a lot of bad ideas" heard, "worst" missed; better than most ← "no offense" read as a softener before praise
    { id: 'd4', skill: 'detail', level: 'B1', point: 'worst', reveals: ['meeting'], seg: [219.6, 224.2],
      stem: 'How does the first person to answer rate Leslie’s idea?',
      choices: ['The worst idea heard all day', 'One of several bad ideas today', 'Bad, but better than most today'],
      a: 0,
      cue: '「a lot of bad ideas」のあとの短い文。',
      line: 'Leslie, no offense. I heard a lot of bad ideas today. *This is the worst.*',
      said: '「悪いけど、今日は悪い案をたくさん聞いた。これが一番ひどい」と言う。',
      mean: 'no offense ＝ 気を悪くしないで。きつい本音の前置き。',
      trap: 'no offense のあとはほめ言葉ではなく、厳しい意見が来る合図。',
      use: 'No offense, but that’s a bad idea.（悪いけど、それはやめたほうがいい）' },

    // R fix: S4 — seg ended inside "Andy?"; now 231.7.
    // why: do it ← "I would love it" heard, "but that means" missed; keep it sane ← "insane campaign" read as the thing to avoid
    { id: 'i3', skill: 'infer', level: 'C1', point: 'joker', reveals: ['meeting'], seg: [224.2, 231.7],
      stem: 'What is April’s advice, and why?',
      choices: ['Don’t, since she herself would enjoy it', 'Do it, since it would be fun to watch',
                'Do it, but keep the campaign sane'], a: 0,
      cue: '前半の「I would love it」と、but のあと。',
      line: 'I would love it if you ran an *insane* campaign… *But that means* you probably *shouldn’t* do it.',
      said: '「むちゃな選挙戦でジョーカーみたいになったら最高。だからやめたほうがいい」。',
      mean: '自分が喜ぶ＝ろくでもない、と分かっている彼女なりの反対。',
      trap: 'I would love it で賛成と取りやすい。but that means のあとが結論。',
      use: 'I’d love that, so it’s a bad idea.（最高だけど、だからダメ）' },

    // R fix: V2 — "I had to" made no sense before "see you go through" (blind 60 %); now "I hated to", where the 'd is
    // heard after hate. Ear check removed: both transcripts have "I'd hate to".
    // why: I hate to ← the weak 'd lost; I'd have to ← hate/have differ only in the vowel and final t/v; I hated to ← the 'd heard after hate
    { id: 's1', skill: 'sound', level: 'B2', point: 'hate', seg: [231.6, 236.6],
      stem: 'Fill the gap: “It seems risky, and ___ see you go through another tough fight.”',
      choices: ['I hate to', 'I’d hate to', 'I hated to', 'I’d have to'], a: 1,
      cue: 'risky and のすぐあと、短く弱い音から。', line: 'it seems risky, and *I’d hate to* see you go through another tough fight.',
      said: '危なそうだし、またつらい戦いをするのは見たくない、と言う。',
      mean: 'I’d hate to 〜 ＝ （もしそうなったら）〜したくない。',
      trap: '’d はほぼ聞こえず I hate になりやすい。hate の t は止まるだけで have と混ざる。',
      use: 'I’d hate to miss the last train.（終電を逃したくないな）' },

    // R fix: V2 — "such a long answer" was easy to strike (blind 55 %); new C is the Ron-dodges script. seg ended inside
    // "All of you"; now 249.05.
    // why: slow / dodging ← "dum-dum" read as a complaint about how he answered, not about what he said
    { id: 'h3', skill: 'humor', level: 'C1', point: 'dumdum', reveals: ['meeting'], seg: [239.2, 249.05],
      stem: 'Why is Leslie’s reply to Ron funny?',
      choices: ['She flatters him, then insults him once he says no',
                'She flatters him, then insults him for his slow answer',
                'She flatters him, then insults him for dodging the question'], a: 0,
      cue: '前半のほめ言葉と、Ron の答えの直後。',
      line: 'your words carry *great influence*… — I do not think you should run again. — *What the hell do you know*, dum-dum?',
      said: '「あなたの言葉は重い」と持ち上げておいて、反対されたとたん「何が分かるの」と返す。',
      mean: '賛成してくれる前提のほめ言葉だった、と分かるのがおかしい。',
      trap: 'Ron の答えは短く、すぐ出ている。ほめ言葉と悪口の落差を聞く。',
      use: 'What do you know about it?（それについて何が分かるの？）' },

    { id: 'x2', skill: 'dict', level: 'B1', point: 'without', reveals: ['meeting'], seg: [248.3, 252.5],
      stem: 'Type what Leslie says: “I am running again ___.” (4 words)', answer: 'with or without you',
      cue: '「running again」のあと、最後の4語。', line: 'I am running again *with or without you*.',
      said: '「これしか道はない。みんながいてもいなくても出る」と言い切る。',
      mean: 'with or without you ＝ 賛成でも反対でも。決意を示す決まった言い方。',
      trap: 'or は弱く「ア」程度で、with or がつながる。without の th も弱い。',
      use: 'I’m going, with or without you.（君が来なくても行くよ）' },

  ]
};
