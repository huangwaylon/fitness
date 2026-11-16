// REVIEW 2026-11-16: pass 8, fix 14, drop 1, new 0; ear checks 2
// REVIEW open: nt3 (dropped) — Jerry's 110.2 s line, “I wasn't mugged” or “I wasn't much”? If “mugged”, a short
//   detail item there (“What does Jerry tell Leslie before the event?”) could come back
// “Leslie Discovers Jerry's Burrito Lie | Parks and Recreation” (the official Parks and Recreation channel, Season 2):
// Leslie uses a TV news spot about Jerry's “mugging” to shame City Hall into funding park security; her boss Paul is
// furious but the money comes through, and before the press event Leslie learns Jerry fell into a creek after a burrito.
// Segments from the captions, words from whisper (2026-11-16). Untested: 53.5–59 s (“ten objects you didn't know you
// can eat”: a throwaway), 92–103 s and 113–123 s (the press-room opening; whisper and captions disagree, Jerry mumbles),
// 146.5–148 s (“The farting”: unclear in both), 164–170 s (the imagined Tom line: who speaks is unclear, and it ends on
// “kill your wife”), 170 s on (music). Named in the audio: Leslie, Jerry, Paul (“I'm sorry, Paul”), Tom (mentioned).
// The news anchor is “the anchor”.
// EAR CHECK: 157.8–159.2 s s1 — “didn't you just” said as one weak “dinchu-just” (both sources: “didn't you just”)
// EAR CHECK: 142.5–143.2 s x1 — “on my way” runs together (on‿my‿way ≈ “onmyway”); both sources agree on the words
import type { Clip } from '../types.ts';

export const jerryBurritoLie: Clip = {
  id: 'burritolie', video: 'L_DLeITTiNo', title: 'Leslie Discovers Jerry\'s Burrito Lie', dur: 190, wpm: 141,
  band: 'slow', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: real saying ← "the old saying" taken at face value; misquote ← "muggers have their own ideas" heard as the
    //   real end of a famous line
    // R fix: S3 (the cue quoted "old", a word only the key had)
    { id: 'h1', skill: 'humor', level: 'C1', point: 'saying', seg: [0, 7.8],
      stem: 'Why is the anchor’s opening line funny?',
      choices: ['His “old saying” is just a plain remark', 'He quotes a famous saying far too seriously',
                'He gets the words of a famous saying wrong'], a: 0,
      cue: '格言の前置きのあとに続く中身。',
      line: 'We’ve all heard *the old saying*, “*Parks are supposed to be fun*.”',
      said: '「昔から言うように『公園は楽しい所であるべき』」と始め、強盗の話に入る。',
      mean: '格言らしく前置きしたのに、中身はただの感想。大げさな枠と平凡な中身の差が笑い。',
      trap: 'old saying と聞くと本物の格言を探しがち。中身がことわざらしいかを聞く。',
      use: 'As they say, better late than never.（よく言うよね、遅くてもやらないよりまし）' },

    // R fix: V2 (blind 60 %: the only money choice for a parks employee on TV); C5 (the key, "park safety", gives away
    //   d1's "security upgrades": reveals it)
    // why: donations ← "we need money" heard as an appeal to viewers; warn people away ← "who's next?" and "muggers"
    //   heard as a call to avoid the park
    { id: 'g1', skill: 'gist', level: 'B1', point: 'blame', reveals: ['money', 'security'], seg: [7.5, 53.7],
      stem: 'What does Leslie use the TV interview to do?',
      choices: ['Pressure City Hall into paying for park safety', 'Ask viewers to donate money for park safety',
                'Warn viewers to stay out of the park for now'], a: 0,
      cue: '最後の「government」で終わる二文。',
      line: 'We need *money from City Hall*, and it’s not coming through… your *government is failing you*.',
      said: 'ジェリーの事件を紹介し、警備の失敗を挙げ、市からお金が来ない、行政が市民を見捨てていると訴える。',
      mean: '事件をきっかけに、市役所に予算を出させる圧力をかけている。',
      trap: '強盗や警備の話で「公園は危ない」が要点に聞こえる。最後に誰を責めるかで決める。',
      use: 'We need more support from the city.（市からもっと支援が必要です）' },

    // R fix: S4 (seg 19.6 s, over 15 s; now 18.7–33.2 s, from “sloppily out of shape”); V2 (blind 55 %: the key alone
    //   had the ironic "means to be standing up for" shape)
    // why: the viewers ← "your" in every phrase heard as insulting the audience; Karl ← "he's failing" comes right after,
    //   so the list seems aimed at the security head
    // anchor: 14.2–31.9 s “This is my coworker, Jerry… Diabetic, sloppily out of shape, friend… Who's next? Your frumpy
    //   uncle, your simple neighbor, your unpopular coworker”: the list describes people like the Jerry she introduced,
    //   and “coworker” closes it
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'list', seg: [18.7, 33.2],
      stem: 'In Leslie’s plea for sympathy, who is the joke on?',
      choices: ['Jerry, the coworker she is there to stand up for', 'The viewers, whose families she is trying to scare',
                'Karl, the security head she says is failing'], a: 0,
      cue: 'リストの最後の一語と、最初の紹介。',
      line: 'my coworker, Jerry… *Diabetic, sloppily out of shape, friend*. … your *unpopular coworker*.',
      said: 'ジェリーを「糖尿病で太めの、友だち」と紹介し、「次はあなたの叔父か…不人気な同僚か」と続ける。',
      mean: '同情を集めるはずの言葉が、ジェリーの悪口になる。最後の coworker で、リストが彼の姿と分かる。',
      trap: 'your が続くので視聴者への悪口に聞こえる。誰をなぞるリストかで笑われ役が決まる。',
      use: 'I mean this kindly, but…（悪気はないんだけど…）' },

    // R fix: V2 (blind 70 %: quoting "Who's next?" answered it); S4 (seg started inside "Ramsett Park"; now 21.0 s, with
    //   "he was mugged")
    // why: easy target ← the list (frumpy, simple, unpopular) and "sloppily out of shape" heard as "the weak get
    //   mugged"; stay away ← "mugged… in Ramsett Park" heard as a warning about the place
    { id: 'i1', skill: 'infer', level: 'B2', point: 'list', seg: [21, 33.2],
      stem: 'After the mugging news, what point is Leslie making to viewers?',
      choices: ['Anyone’s loved ones could be attacked next', 'Jerry was an easy target for a mugger',
                'Viewers should stay away from the park'], a: 0,
      cue: '質問のあと、your で始まる三つ。',
      line: '*Who’s next?* *Your* frumpy uncle, *your* simple neighbor, *your* unpopular coworker.',
      said: '「次は誰？あなたの叔父さん、近所の人、同僚かも」と並べる。',
      mean: 'your を重ねて、事件を視聴者の身近な人の話にする。不安を呼ぶ訴え方。',
      trap: '悪口のような形容が耳に残る。注目は your の繰り返しで、相手を巻きこむ言い方。',
      use: 'It could happen to anyone.（誰にでも起こりうる）' },

    // why: contradicts himself ← "right" and "not bad" sound like opposite ideas; asks for criticism ← "not bad" heard as
    //   inviting Leslie to say what's bad
    { id: 'h2', skill: 'humor', level: 'C1', point: 'notbad', seg: [37.9, 45.4],
      stem: 'Why is the anchor’s follow-up question funny?',
      choices: ['It repeats the first question in childish words', 'It contradicts the question he has just asked',
                'It asks Leslie to say what is bad about the city'], a: 0,
      cue: '二つ目の質問が、一つ目に何を足しているか。',
      line: 'So what is the solution to fix this? *To make it right and not bad?*',
      said: '「解決策は？正しくして、悪くなくするには？」と聞き直す。',
      mean: '二つ目は一つ目の言いかえで、中身が増えない。子どもっぽい言葉で同じことを言うのがおかしい。',
      trap: 'right と bad が反対に聞こえ、矛盾と取りやすい。言いかえは中身が増えたかで聞く。',
      use: 'In other words, what can we do?（つまり、何ができる？）' },

    // why: late ← "not coming" heard as "not here yet"; not enough ← "money" heard with a complaint about the amount
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'money', seg: [45.4, 49.3],
      stem: 'What does Leslie say about the money from City Hall?',
      choices: ['It hasn’t been given to them', 'It is coming, but slowly',
                'It isn’t enough for the parks'], a: 0,
      cue: '「and it’s not」のあとの2語。',
      line: 'We need money from City Hall, and *it’s not coming through*.',
      said: '「市からのお金が要るのに、出てこない」。',
      mean: 'come through ＝ 約束や支払いが実際に届く。否定で「出てこない」。',
      trap: 'coming を「向かっている」と取ると遅れの話に聞こえる。come through は届くかどうか。',
      use: 'Did my payment come through?（入金、届きましたか）' },

    // R fix: S2/V2 (blind 50 %): the stem quoted "sorry", the word under test, and two choices were apologies
    // why: apology for the mugging ← "sorry" next to the crime story; her department's failure ← she works for the
    //   government she names
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'sorry', seg: [48.9, 53.7],
      stem: 'What do Leslie’s words just before “your government” do?',
      choices: ['Soften a harsh claim she is about to make', 'Apologize to the city for the mugging',
                'Admit her own department has let people down'], a: 0,
      cue: '「sorry to say this」のあと、but の先。',
      line: 'And Pawnee, I am *sorry to say this, but* your government is failing you.',
      said: '「言いにくいのですが、行政は市民を見捨てています」と言う。',
      mean: 'sorry to say this, but ＝ 言いにくいことの前置き。謝罪ではなく、批判を強める。',
      trap: 'sorry を謝罪と取りやすい。but のあとに本題が来る。',
      use: 'Sorry to say this, but you’re wrong.（言いにくいけど、それは違うよ）' },

    // why: who made you ← "possessed" heard as someone controlling her; what did you get ← "possessed" heard as owning
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'possessed', seg: [59.1, 65.9],
      stem: 'What is Paul asking Leslie when the scene moves to his office?',
      choices: ['Why on earth she did something so foolish', 'Who it was that told her to go on TV',
                'What she was hoping to get out of it'], a: 0,
      cue: '最初の一文の動詞と、そのあとの返事。',
      line: '*What possessed you* to do that? — I’m sorry, Paul, but one of my guys got mugged',
      said: '「一体何を考えてあんなことを？」に、「部下が襲われたので」と答える。',
      mean: 'What possessed you to…? ＝ あきれと怒りの「一体なぜ」。',
      trap: 'possess を「持つ」「操る」と取ると、人や得を聞く質問に聞こえる。決まった怒りの形。',
      use: 'What possessed you to buy that?（なんでそんな物買ったの）' },

    // R fix: V2 (blind 55 %: the only angry choice for a boss after a TV stunt)
    // why: without his OK ← a boss angry about TV sounds like a permission problem, but his words name the badmouthing;
    //   sympathetic ← "one of my guys got mugged" and "how upset you are" heard as concern
    { id: 't1', skill: 'attitude', level: 'B1', point: 'angry', reveals: ['possessed'], seg: [59.1, 70.4],
      stem: 'How does Paul feel about Leslie’s TV appearance?',
      choices: ['Angry that she spoke badly of the city on TV', 'Angry that she went on TV without his OK',
                'Sympathetic, since one of her staff was hurt'], a: 0,
      cue: '「I don’t care」のあとの命令の形。',
      line: 'I don’t care how upset you are. *You do not badmouth your own government on TV*.',
      said: '「どれだけ動揺していようと、テレビで自分の役所の悪口を言うな」と叱る。',
      mean: 'badmouth ＝ 悪く言う。You do not… は強い禁止で、怒っている。',
      trap: 'upset は彼女の気持ちの話で、彼は気にしないと言う。怒りの理由は禁止の文の中身。',
      use: 'Don’t badmouth your boss online.（ネットで上司の悪口はだめ）' },

    // R fix: V2 (blind 50 %: "grudgingly" was the only mixed tone); the seg now runs to 80.3 s so "The mayor is going
    //   to divert…" refutes the sarcasm reading
    // why: sincerely pleased ← "happy to know" and "worked" taken at face value; sarcastic ← the dry "I'm sure you'll
    //   be happy" heard as meaning the opposite
    { id: 't2', skill: 'attitude', level: 'C1', point: 'stunt', seg: [71, 80.3],
      stem: 'How does Paul deliver the news that her plan worked?',
      choices: ['Grudgingly, still annoyed at how she did it', 'Sarcastically, hinting it didn’t really work',
                'Warmly, glad that she won the money'], a: 0,
      cue: '「worked」の前の、計画の呼び方。',
      line: 'I’m sure you’ll be happy to know your *little stunt* worked.',
      said: '「君のちょっとした芝居がうまくいって、うれしいだろうね」と言う。',
      mean: 'stunt ＝ 人目を引く派手な行動。little で見下し、成功をしぶしぶ伝える。',
      trap: 'happy で喜び、乾いた言い方で皮肉と取りやすい。成功は本当で、不満は呼び方に出る。',
      use: 'Nice little stunt you pulled there.（うまいことやったね）' },

    // why: 250 / 25,000 ← "two… five hundred" with a weak "thousand" lost or added; 2,000 ← the "five hundred" swallowed
    // R fix: N4 (the trap assumed "two thousand five hundred", but the use says "twenty-five hundred"; the form isn't
    //   settled by the transcripts, so the trap now covers both)
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [74.4, 80.3],
      stem: 'How much will the mayor send to the parks?',
      choices: ['$250', '$2,000', '$2,500', '$25,000'], a: 2, keep: true,
      cue: '「divert」のすぐあとの金額。',
      line: 'The mayor is going to divert *$2,500* to the parks',
      said: '「市長が公園に2500ドル回す」。',
      mean: 'divert ＝ 別の用途から回す。小さな額だが、レスリーの作戦は成功した。',
      trap: '桁の語が続くと一つ落としやすい。hundred の前の数と、thousand の有無を聞く。',
      use: 'That’ll be twenty-five hundred, please.（2500になります）' },

    // R fix: V2 (blind 70 %: doctor bills and a new park were fillers after a mugging story)
    // why: equipment ← "upgrades" caught without "security"; a reward ← the mugging story invites catching the mugger
    { id: 'd1', skill: 'detail', level: 'B1', point: 'security', seg: [74.4, 80.3],
      stem: 'What is the mayor’s money for?',
      choices: ['Upgrading security in the parks', 'Upgrading equipment in the parks',
                'Offering a reward to catch the mugger'], a: 0,
      cue: '金額のあと、「for」に続く語。',
      line: 'to the parks *for security upgrades*.',
      said: '「警備の強化のために、公園にお金を回す」。',
      mean: 'security upgrades ＝ 警備の改善。レスリーがテレビで訴えた点にそのまま応えている。',
      trap: 'upgrades だけ拾うと設備の更新に聞こえる。for のあと、直前の語とセットで聞く。',
      use: 'We need some security upgrades.（警備を強化しないと）' },

    // why: today ← a fast, weak "tomorrow" lost; two ← "ten" and "two" are both short, one-beat numbers
    // R fix: K8 (times, in ascending order, but no keep: true)
    { id: 'n2', skill: 'number', level: 'B1', point: 'time', seg: [80.2, 84.2],
      stem: 'When is the announcement?',
      choices: ['Today at two', 'Today at ten', 'Tomorrow at two', 'Tomorrow at ten'], a: 3, keep: true,
      cue: '「announcement」のあと、日と時刻。',
      line: 'There’s gonna be an announcement *tomorrow at 10:00* in the press room',
      said: '「明日10時、記者室で発表がある」。',
      mean: 'There’s gonna be ＝ 予定を伝える言い方。日にちと時刻を続けて言う。',
      trap: 'tomorrow は弱く速く言われがち。ten は「テン」と短く、two とは母音が違う。',
      use: 'There’s a meeting tomorrow at ten.（明日10時に会議があります）' },

    // why: literal ← "who you're referring to" taken as a real question, so he explains; sincere policy ← "We treat
    //   everyone with respect" heard as a plain statement he can agree with
    // anchor: 85–90.4 s Paul names Jerry by his worst moment (“the doofus that got…”), and Leslie, who knows exactly who,
    //   says she doesn't and adds “with respect”: the only reading that fits both is a rebuke
    // R fix: S4 (seg ended on "Okay", under 0.5 s after it)
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'respect', seg: [84.6, 93.5],
      stem: 'Which reply from Paul would show he understood Leslie?',
      choices: ['Fine. Please bring Jerry, then.', 'You know, the guy who got mugged.',
                'Good. Respect matters a lot here.'], a: 0,
      cue: '彼の呼び方と、彼女の二文目の語。',
      line: 'make sure you bring *the doofus* that got… — *I don’t know who you’re referring to*. We treat everyone *with respect*…',
      said: '「あのまぬけを連れて来い」に、「どなたのことか分かりません。ここでは皆を尊重しています」と返す。',
      mean: '知らないふりで、悪口の呼び方を受け取らない。分かった人なら、名前で言い直す。',
      trap: '言葉どおりなら「誰か説明する」返事になる。知らないふりは、言い方を直せという合図。',
      use: 'Sorry, who? Oh, you mean Ken.（え、誰？ああ、ケンさんね）' },

    // why: memorize ← "speak" heard as giving a speech; keep it short ← "You'll be fine" heard as "don't worry, it's
    //   quick"
    // R fix: S3 (the cue quoted "how", a word only the key had)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'heart', seg: [103.2, 109.6],
      stem: 'What does Leslie tell Jerry to do at the press event?',
      choices: ['Say honestly how it felt to him', 'Read out a speech she has written',
                'Keep it short and leave the rest to her'], a: 0,
      cue: '「for you」のあとの3語。',
      line: 'Just talk about how hard it was for you. *Speak from the heart*. You’ll be fine.',
      said: '「どれだけ大変だったか話して。心から。大丈夫」と励ます。',
      mean: 'speak from the heart ＝ 飾らず本心で話す。スピーチの前によく言う。',
      trap: 'speak を「演説」と取ると原稿の話に聞こえる。from the heart は「本心から」。',
      use: 'Don’t read it. Speak from the heart.（読まずに、心から話して）' },

    // R drop: nt3 — its key rests on “I wasn't mugged” (whisper) vs “I wasn't much” (captions), said over the
    //   press-room speaker; no segment ≤ 15 s holds both that line and “hysterical muteness” (S4); and “what is she
    //   trying not to say” is an infer, not an attitude (V4). The bank keeps 2 C2 items (nt1, nt2)

    // why: a broken arm ← "this" points at the sling; a knee ← he "fell", so a leg injury seems likely
    { id: 'd2', skill: 'detail', level: 'B1', point: 'shoulder', seg: [135.3, 140.1],
      stem: 'Which injury does Jerry say is real?',
      choices: ['A dislocated shoulder', 'A broken upper arm', 'A badly twisted knee'], a: 0,
      cue: '「This is real」のあと。',
      line: 'This is real. I really *dislocated my shoulder*.',
      said: '「これは本物。本当に肩を外した」。',
      mean: 'dislocate ＝ 関節を外す。けがは本当だが、原因が別だと分かる前ぶれ。',
      trap: '腕をつっているので骨折に聞こえやすい。体の部位の語をそのまま聞く。',
      use: 'I think I dislocated my finger.（指を脱臼したかも）' },

    // why: how often ← "even" heard as "ever" (did you ever go?); which day ← "yesterday" heard as checking the date
    { id: 'i2', skill: 'infer', level: 'C1', point: 'even', seg: [135.3, 142],
      stem: 'What does Leslie’s question about the park show?',
      choices: ['She now doubts his whole story', 'She wants to know how often he goes there',
                'She is checking which day it happened'], a: 0,
      cue: '「in the park」の前の、短い一語。',
      line: 'Is this fake? … *Were you even in the park* yesterday?',
      said: '「これも偽物？そもそも昨日公園にいたの？」と聞く。',
      mean: 'even で「そもそも」。前提から疑っている。',
      trap: 'even と ever は似た音。疑問文の even は「〜すら」で、根っこを疑う。',
      use: 'Did you even read it?（そもそも読んだの？）' },

    // R fix: V2/§9.4 (blind 60 %: the title, "Burrito Lie", picked the only breakfast choice; now all three are
    //   burrito stories); S3 (the cue quoted "for", a word only the key had); C6 (it sat after d3, out of clip order)
    // why: a bird took it ← "Lord Sheldon, he lunged at a bird" heard with the roles swapped; slipped while eating ←
    //   "log in the creek" and "lose my balance" caught without "reach for it"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'truth', reveals: ['drop'], seg: [139.9, 157.6],
      stem: 'How did Jerry really hurt himself?',
      choices: ['He fell reaching for the burrito he had dropped', 'He fell chasing a bird that took his burrito',
                'He slipped in the creek while eating his burrito'], a: 0,
      cue: '「lose my balance」の前の動き。',
      line: 'So I go to *reach for it*, and I *lose my balance*, and I fall on my shoulder.',
      said: '鳥を追った騒ぎでブリトーが丸太に落ち、取ろうとしてバランスを崩し、肩から落ちた。',
      mean: '強盗の話は作り話。けがの本当の原因はブリトー。',
      trap: '鳥、丸太、川がどれも出てくるので組み合わせを取りちがえやすい。it が何をさすかを追う。',
      use: 'I lost my balance and fell.（バランスを崩して転んだ）' },

    // R fix: S4 (seg started inside "yesterday" and ended inside "burrito")
    { id: 'x1', skill: 'dict', level: 'B2', point: 'way', seg: [142, 146.8],
      stem: 'Type what Jerry says: “I was ___ to feed the hummingbirds.” (3 words)', answer: 'on my way',
      cue: '「Look」のあと、was に続く3語。',
      line: 'I was *on my way* to feed the hummingbirds',
      said: '「ハチドリにえさをやりに行く途中だった」。',
      mean: 'on my way to… ＝ 〜へ行く途中。そこで朝食のブリトーを買った。',
      trap: '3語がつながり「オンマイウェイ」とひと続き。my は弱く短い。',
      use: 'I’m on my way to the station.（駅に向かってるところ）' },

    // why: slipped ← "log in the creek" and "lose my balance" come next, but as the fall; bird ← "a bird" is said, as
    //   what Lord Sheldon lunged at
    { id: 'd3', skill: 'detail', level: 'B2', point: 'drop', seg: [147.4, 153.6],
      stem: 'What made Jerry drop his burrito?',
      choices: ['Lord Sheldon lunged at a bird', 'A bird flew right at him',
                'He slipped on a log in the creek'], a: 0,
      cue: '「dropped」の直前の出来事。',
      line: '*Lord Sheldon, he lunged at a bird*, I dropped the burrito, and it lands on a log',
      said: '「ロード・シェルドンが鳥に飛びかかって、ブリトーを落とし、川の丸太に乗った」。',
      mean: 'lunge at ＝ 飛びかかる。落とした原因と、そのあと転んだ話は別。',
      trap: 'bird や log は言われているが役割が違う。dropped の前が原因。',
      use: 'The dog lunged at the mailman.（犬が郵便屋さんに飛びかかった）' },

    // why: do you ← "didn't" loses its t and n't; did you ← a past question heard without the -n't; didn't you ← "just"
    //   is short and weak
    { id: 's1', skill: 'sound', level: 'B2', point: 'didnt', seg: [157.3, 161],
      stem: 'Fill the gap: “Why ___ tell everybody the truth?”',
      choices: ['did you just', 'didn’t you just', 'don’t you just', 'didn’t you'], a: 1,
      cue: '「Why」のあと、弱くつながる3語。',
      line: 'Why *didn’t you just* tell everybody the truth?',
      said: '「どうして素直に本当のことを言わなかったの？」。',
      mean: 'didn’t you が「ディドンチュ」とつながる。just で「素直に」。',
      trap: 'n’t の t が消えて did you に聞こえやすい。n の鼻音が残るかを聞く。',
      use: 'Why didn’t you just call me?（電話してくれればよかったのに）' },

    // why: fired ← lying to the press sounds like a firing offense; helping Leslie ← the money came from his story
    { id: 'i3', skill: 'infer', level: 'B2', point: 'tom', seg: [157.3, 163.4],
      stem: 'Why didn’t Jerry tell the truth, by his answer?',
      choices: ['He was afraid of being teased by Tom', 'He was afraid of being fired for it',
                'He wanted to help Leslie get the money'], a: 0,
      cue: '「Are you kidding me?」のあとの一文。',
      line: 'Are you kidding me? *Imagine what Tom would have said*.',
      said: '「冗談でしょ。トムに何て言われたか想像してよ」と答える。',
      mean: '本当の理由は、からかわれるのが怖かったこと。Imagine… で答えを相手に想像させる。',
      trap: '嘘の重さから「クビが怖い」に聞こえる。名前が出たら、その人が理由。',
      use: 'Imagine what Mom would say!（お母さんが何て言うか！）' },
  ]
};
