// REVIEW 2026-11-16: pass 5, fix 19, drop 0, new 0; ear checks 0
// OPEN: a cold blind re-read still gets a1 (75 %), h2 (75 %), h4, i4 and h5 (70 %), from Tom's persona, the
//   title ("failure") or the key being the nuanced one. One more rewrite or a drop, if that matters to you.
// “Tom finds his true purpose: failure | Parks and Recreation” (the official Parks and Recreation channel, Season 7):
// Leslie praises Tom's success at his bistro; his friends back a big expansion; a narrator reports that he lost
// everything; Tom tells Lucy why this failure hurts; years later he is a best-selling author of “Failure”, speaking
// to a crowd and signing copies for his friends.
// Segments from the captions, words from whisper (2026-11-16). Tom, Leslie, Ben, Ron and Lucy are named in the audio.
// Untested on purpose: 0–10 s ("Tommy will"/"Tom, you'll" differ, speakers unclear), "Nice crew in/crudin" at
// 25.6 s, "Regal Meagle/Migo" at 75.5 s, the crowd's "A Gary!" at 208.7 s (whisper only), and 253–274 s (music;
// whisper loops "I love you").
// EAR CHECK: none (every key rests on words both sources agree on)
import type { Clip } from '../types.ts';

export const tomFailure: Clip = {
  id: 'tomfailure', video: 'ainXnhzE-Vo', title: 'Tom finds his true purpose: failure', dur: 274, wpm: 145,
  band: 'slow', tags: ['友だち', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 70 %. "Asking for a turn" and "criticism" were easy to rule out; the new distractors come from
    //   the scene just before (the closed-maintenance problem) and the Japanese ちょっといい？ request preface.
    // why: reassuring ← "Don't worry… you'll solve this problem" comes just before; a favor ← "Can I just say" heard
    //   as the ちょっといい？ that opens a request
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'canijust', seg: [10.15, 21.9],
      stem: 'When Leslie begins with “Can I just say, Tom…”, what is she doing?',
      choices: ['Opening a heartfelt compliment', 'Reassuring him about the problem', 'Leading up to a favor she needs'],
      a: 0,
      cue: '「Tom」と呼んだあとに続く中身。',
      line: 'Can I just say, Tom, *you have accomplished so much*.',
      said: '「ちょっと言わせて。Tom、本当にいろいろ成し遂げたね」と話しはじめる。',
      mean: 'Can I just say は許可を求める形の前置き。気持ちのこもった一言を言う合図。',
      trap: '頼みごとの前置きにも聞こえるが、返事を待たずにほめ言葉が続く。中身で判断する。',
      use: 'Can I just say, this is delicious.（言わせて、これおいしい）' },

    // R fix: V2, blind 55 % (Tom's persona). All three now open with "He thanks her", and one distractor is the near
    //   sound "proud of you too".
    // why: proud of her ← "proud of me, too" heard as the polite "proud of you, too"; luck ← the Japanese frame:
    //   praise is met with modesty (おかげさまで)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'proud', reveals: ['canijust'], seg: [16.3, 25.3],
      stem: 'How does Tom take Leslie’s praise?',
      choices: ['He thanks her and adds praise for himself', 'He thanks her and says he’s proud of her too',
                'He thanks her but says it was mostly luck'], a: 0,
      cue: 'ほめ言葉への、Tom の二つの返し。',
      line: 'Don’t forget *well-dressed*. … Thanks, Leslie. *I’m proud of me, too*.',
      said: '「おしゃれも忘れずに」と自分で足し、最後は「僕も自分が誇らしいよ」と言う。',
      mean: '遠慮せず、ほめ言葉にさらに自分で上乗せしている。Tom らしい明るい自信。',
      trap: 'よくある proud of you too に聞こえやすい。of me の一語を聞く。',
      use: 'Thanks! I’m pretty proud of it.（ありがとう、けっこう自信作なんだ）' },

    // why: thank-you note ← a gift from a stranger usually comes with a note; the bill ← a waiter bringing wine
    //   usually means paying for it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'wine', seg: [25.2, 34.0],
      stem: 'What has the man by the bar sent over?',
      choices: ['A glass of wine and a business card', 'A bottle of wine and a thank-you note',
                'A glass of wine and the bill for it'], a: 0,
      cue: '「sent you over」のあと、and の前後。',
      line: 'the gentleman by the bar there *sent you over this glass of wine* and… *business card*.',
      said: '「バーの男性から、このワインと名刺です」と店の人が持ってくる。',
      mean: '知らない人がワインと名刺を送ってくるほど、Tom は注目されている。',
      trap: 'glass と bottle はどちらもワインに合う。business card は名刺で、メモではない。',
      use: 'The couple over there sent you this.（あちらのお客様からです）' },

    // R fix: V2, blind 85 %. The menu option was a throwaway. The distractors are now the other ways to read "a huge
    //   expansion opportunity": one bigger restaurant, or a buyout.
    // why: bigger ← "expansion" heard as enlarging the one restaurant; sell to a chain ← "presented with… an
    //   opportunity" heard as a buyout offer
    { id: 'g1', skill: 'gist', level: 'B1', point: 'expand', seg: [35.0, 90.25],
      stem: 'What does Tom ask his friends to help him decide?',
      choices: ['Whether to open many more restaurants', 'Whether to make his restaurant bigger',
                'Whether to sell his restaurant to a chain'], a: 0,
      cue: '最初の「as you all know」のあと。',
      said: '店に大きな拡大の話が来ていて、決める前に仲間の意見を聞きたい、と言う。',
      mean: '仲間は順に意見を言い、最後に Tom は拡大を決める。',
      trap: 'expansion を一店の拡張と取りやすい。open new restaurants で、何店も出す話と分かる。',
      use: 'I want your opinion before I decide.（決める前に意見がほしい）' },

    // R fix: V2, blind 50 %. The new distractors are built on words that are said: "whining" misheard as bragging,
    //   and "congressman" doubted. The cue no longer quotes "No can-do" (its "no" was a key-only word).
    // why: bragging ← "whining" taken as showing off about the new job; doubt ← "No can-do" heard as refusing to
    //   believe "I'm a congressman"
    { id: 'i2', skill: 'infer', level: 'C1', point: 'bigshot', seg: [44.6, 55.3],
      stem: 'When Ben asks to be called by his name, what does the reply imply?',
      choices: ['His new title earns him no special treatment here', 'He should stop bragging about his new job',
                'His friends doubt he is really a congressman'], a: 0,
      cue: 'Ben の頼みへの返事と、その理由。',
      line: '*No can-do*, accounting nerd. We all knew you *before you were a big shot*.',
      said: '「無理だね、会計オタク。偉くなる前から知ってるんだから」と返される。',
      mean: '議員になっても仲間内では昔のまま。肩書きで特別扱いはしない、という冗談。',
      trap: 'whining を自慢と取りやすい。理由は before のあと。',
      use: 'You’re still just Mike to me.（私にとっては今もただのマイクだよ）' },

    // R fix: V2, blind 80 %. The literal "tasks" and "school" readings were easy to rule out. The new distractors fit
    //   the scene: paperwork (numbers) and asking advice (what Tom is doing right now).
    // why: paperwork ← homework = やるべき書類仕事, with "All the numbers line up"; advice ← Tom is asking his board
    //   right now, so "done your homework" seems to mean that
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'homework', seg: [55.2, 62.4],
      stem: 'In Ben’s advice, what does he say Tom has done?',
      choices: ['Looked into the facts carefully', 'Done all the paperwork already', 'Asked everyone for advice first'],
      a: 0,
      cue: '「risks」の話のあと、but に続く部分。',
      line: 'there are always going to be risks… but *you’ve done your homework*. All the numbers line up.',
      said: '「新しい店にリスクはつきもの。でも下調べはしてある。数字も合っている」と言う。',
      mean: 'do one’s homework ＝ 事前にしっかり調べる。宿題の意味ではない。',
      trap: 'homework を「やるべき作業・書類」と取りやすい。仕事の話では「下調べ」。',
      use: 'Do your homework before you buy a car.（車を買う前に下調べを）' },

    // why: against ← gambit heard as gamble (a bad bet); luck ← "nothing ventured, nothing gained" heard as a
    //   coin toss
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'ron', seg: [69.5, 75.45],
      stem: 'What is Ron’s view of the plan?',
      choices: ['For it: a bold risk worth taking', 'Against it: a reckless gamble', 'Unsure: it all comes down to luck'],
      a: 0,
      cue: 'but のあとのことわざ。',
      line: 'it’s a *bold capitalistic gambit*, son, but *nothing ventured, nothing gained*.',
      said: '「大胆な資本主義の賭けだ。だが、何もしなければ何も得られない」と言う。',
      mean: '挑戦しなければ得るものもない、という賛成のことわざ。',
      trap: 'gambit が gamble（ギャンブル）に聞こえて反対に取りやすい。but のあとが結論。',
      use: 'Nothing ventured, nothing gained. Let’s apply.（やってみなきゃ。応募しよう）' },

    // why: popular ← restaurants are the topic; loans ← "credit" comes up later (credit dried up), and cheap money
    //   would also make it a good time
    { id: 'd4', skill: 'detail', level: 'B1', point: 'realestate', seg: [76.25, 80.7],
      stem: 'What reason does the next friend give for doing it now?',
      choices: ['Property is cheap right now', 'Restaurants are popular right now', 'Loans are easy to get right now'],
      a: 0,
      cue: '最初の二語と、そのあとの形容詞。',
      line: '*Real estate is pretty cheap* right now. If you’re gonna do it, this is a good time.',
      said: '「今は不動産がかなり安い。やるなら今がいい時期だ」と言う。',
      mean: 'real estate ＝ 不動産（土地や建物）。安いうちに店の場所を押さえられる。',
      trap: 'right now が三つの選択肢すべてに合う。前の real estate を聞き取る。',
      use: 'Prices are pretty low right now.（今はかなり安いよ）' },

    // R fix: N7/B1. The stem ("How many Tom's Bistros… will there be") gives away g1's key, so it now reveals `expand`.
    // why: five ← "the next five years" comes just before; ten ← a round "chain" number; fifty ← -ty numbers blur
    { id: 'n1', skill: 'number', level: 'B1', point: 'twenty', reveals: ['expand'], seg: [80.6, 88.25], keep: true,
      stem: 'How many Tom’s Bistros does Tom say there will be?',
      choices: ['Five', 'Ten', 'Twenty', 'Fifty'], a: 2,
      cue: '「gonna be」のあとの数。',
      line: 'Over the next five years, there’s gonna be *20 Tom’s Bistros* across America.',
      said: '「この5年で、全米に20店のトムズ・ビストロができる」と宣言する。',
      mean: 'twenty ＝ 20。5年で20店という大きな計画。',
      trap: '先に five が聞こえるので混ざりやすい。five は年数、店の数は gonna be のあと。',
      use: 'There’ll be twenty of us at dinner.（夕食は20人になります）' },

    // R fix: V2, blind 75 %. The distractors are now the other two senses of "blow up": losing his temper, and the
    //   hit Tom meant.
    // why: angry ← blow up = 怒��が爆発する, the other common sense; a hit ← the narrator repeats Tom's words, and
    //   "but not in a good way" is lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'blowup', seg: [86.1, 95.75],
      stem: 'Why does the narrator’s first line get a laugh?',
      choices: ['It turns Tom’s word for a big hit into a crash', 'It uses Tom’s word to say he got very angry',
                'It agrees with Tom that he became a big hit'], a: 0,
      cue: 'Tom の最後の言葉と、ナレーションの最初の言葉。',
      line: 'Tommy’s about to *blow up*. — And blow up he did, *but not in a good way*.',
      said: '「大ブレイクするぞ」に、ナレーションが「ブレイクした。悪い意味で」と続ける。',
      mean: 'blow up は「大当たり」と「爆発・崩壊」の両方。同じ語で意味を裏返す。',
      trap: 'blow up には「怒りが爆発する」の意味もある。次の文で破産と分かる。',
      use: 'Her video totally blew up.（彼女の動画がバズった）' },

    // R fix: V2, blind 55 %. "Tom himself, who made the film" was the only choice with a filmmaker. Now each choice
    //   names a source: Tom's film, a film by Lucy, TV news. The segment runs on to Tom's "I had to" (110.6–110.9 s),
    //   which settles who made the film.
    // anchor: 96.8–101.9 s "worst of all, swaggerless" in the narration; 106.3–110.9 s "It's a whole documentary
    //   about my failures. — That you made. — I had to.": the film, and its ranking, are Tom's own
    // why: Lucy ← "That you made" heard as Tom pointing at her; TV news ← a narrator reporting someone's fall sounds
    //   like a news story
    { id: 'c1', skill: 'infer', level: 'C2', point: 'swagger', seg: [94.0, 111.1],
      stem: 'Who decided that losing his swagger was “worst of all”?',
      choices: ['Tom himself, in a film he made', 'Lucy, in a film she made about him', 'A TV news report on his downfall'],
      a: 0,
      cue: 'ナレーションのあと、Lucy の短い一言。',
      line: '…and *worst of all, swaggerless*. … It’s a whole documentary about my failures. — *That you made.*',
      said: 'ナレーションが「最悪なのはかっこよさを失ったこと」と言い、Lucy が「あなたが作ったんでしょ」。',
      mean: '映画を作ったのは Tom 本人。お金よりかっこよさを「最悪」としたのも彼自身。',
      trap: '声だけだと他人がからかっていると取りやすい。That you made が、だれの言葉かを変える。',
      use: 'You wrote this about yourself?（これ自分で自分のこと書いたの？）' },

    // R fix: V2, blind 85 %. The distractors are now the scene's two other real topics: Lucy's "stop watching" and
    //   Tom's "What do I do now?"
    // why: stop watching ← Lucy's first line, and the film runs through the talk; what next ← "What do I do now?" and
    //   "you'll come up with a new idea" close it
    { id: 'g2', skill: 'gist', level: 'B2', point: 'lucy', reveals: ['careful'], seg: [101.95, 144.6],
      stem: 'What is Tom’s talk with Lucy mainly about?',
      choices: ['Why this failure hurts more than before', 'Whether he should stop watching the film',
                'What business he should try next'], a: 0,
      cue: '後半の「That’s the problem, though」から。',
      said: 'Lucy が慰めるが、Tom は「今回は慎重にやったのに失敗した」と悩む。',
      mean: '失敗そのものより、正しくやっても失敗したことがつらい。Lucy はまた立ち直れると励ます。',
      trap: '映画の話や「次はどうする」も出るが、中心は後半の「今回は何がちがうか」。',
      use: 'That’s the part that really hurts.（そこが本当につらいところ）' },

    // R fix: V2, blind 55 %. The stem said "stop watching", which pointed at the key, and "rip it apart" was weak.
    //   The new stem doesn't name Lucy's words, and the new distractor reads tear as 涙.
    // why: crying ← tear read as 涙 (the same spelling); can't bear ← "can't" + a strong verb sounds like "can't
    //   stand it"
    { id: 'f6', skill: 'phrase', level: 'B2', point: 'tear', seg: [101.95, 108.15],
      stem: 'How does Tom answer Lucy’s first remark about the film?',
      choices: ['He can’t stop watching it', 'He can’t watch it without crying', 'He can’t bear to watch it'], a: 0,
      cue: '「can’t」のあとの動詞と、最後の語。',
      line: 'I *can’t tear myself away*.',
      said: '「目が離せないんだ。僕の失敗のドキュメンタリーだよ」と言う。',
      mean: 'tear oneself away ＝ 自分を引きはがす。can’t と組んで「やめられない」。',
      trap: 'tear を「涙」と取りやすい。away と組めば「離れる」。',
      use: 'I couldn’t tear myself away from the game.（試合から目が離せなかった）' },

    // R fix: V2, blind 80 %. The Lucy hint was weak. All three now say how he treats the clothes: mourns them,
    //   blames them, or kept them.
    // why: blames ← "pocket square collection" heard as the cause of his losses; kept ← "collection" caught and
    //   "had to sell" lost
    { id: 'h4', skill: 'humor', level: 'C1', point: 'pocket', seg: [110.95, 121.4],
      stem: 'Why does Tom’s list of losses get a laugh at the end?',
      choices: ['He mourns a fashion item as much as his fortune', 'He blames his spending on clothes for the loss',
                'He boasts that at least he kept his best clothes'], a: 0,
      cue: 'お金の話のあとに足す、もう一つの損。',
      line: 'The franchises, most of my money. *I had to sell my pocket square collection.*',
      said: '「店も、お金もほとんど失った。ポケットチーフまで売った。みんなどこを見るんだ」と嘆く。',
      mean: '大金の話と胸元のハンカチの話を同じ重さで語る。Tom らしい見栄が笑い。',
      trap: '服の話なので「服にお金を使った」と取りやすいが、売ったのは失ったあと。',
      use: 'I lost my wallet and, worse, my lucky pen.（財布と、もっと痛いのは幸運のペン）' },

    // R fix: V2, blind 80 %. The distractors are now a softer reproach (with the key's own "seen it coming") and the
    //   literal question.
    // why: hinting ← "predicted" heard with Japanese 「予想できたでしょ」 (a reproach); why ← "Who could have…?" read
    //   as a real question about the beef
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'beef', seg: [121.35, 130.1],
      stem: 'What is Lucy’s question about the beef doing?',
      choices: ['Saying nobody could have seen it coming', 'Hinting he should have seen it coming',
                'Asking why the country ran out of beef'], a: 0,
      cue: '質問のあと、答えを待つかどうか。',
      line: '*Who could have predicted* that the country would run out of beef? You just gotta move on.',
      said: '「国から牛肉がなくなるなんて、だれが予想できた？前に進むしかないよ」と言う。',
      mean: '答えを求めない問いで「だれにも分からなかった」と伝え、Tom を責めずに慰めている。',
      trap: '疑問文なので答えを探しやすい。答えを待たずに続くなら、問いの形の励まし。',
      use: 'Who could have known it would rain?（雨なんてだれが分かった？）' },

    // R fix: V2, blind 60 %. The stem's "list of bad luck" pointed at the economy. The new stem is neutral, and the
    //   distractors are two personal-credit readings.
    // why: credit rating ← "dried up" heard as a score going down; credit card ← katakana クレジット = カード
    { id: 'f7', skill: 'phrase', level: 'C1', point: 'credit', seg: [121.35, 128.3],
      stem: 'What does Lucy say happened with credit?',
      choices: ['Loans became hard to get', 'His credit card was cut off', 'His credit rating went down'], a: 0,
      cue: '「Stock market tanked」のすぐあと。',
      line: 'Stock market tanked, *credit dried up*.',
      said: '「株は暴落、融資も止まった」と、不運を並べる。',
      mean: 'credit dried up ＝ 銀行がお金を貸さなくなった。dry up は「干上がる」。',
      trap: 'カタカナのクレジットでカードの話と取りやすい。株と並ぶ、経済全体の話。',
      use: 'The money just dried up.（お金がすっかり底をついた）' },

    // R fix: V2, blind 85 %. "Friends blame him" was weak. Both distractors are now about his own fault, built on
    //   "reckless".
    // why: same mistake ← "something reckless" is said, but about the past; himself to blame ← the opposite: Lucy's
    //   bad-luck list seems to be what he rejects
    { id: 'i4', skill: 'infer', level: 'B2', point: 'careful', reveals: ['bust'], seg: [128.25, 138.9],
      stem: 'Why is this failure harder for Tom than his earlier ones?',
      choices: ['He was careful this time and still failed', 'He made the same reckless mistake again',
                'He has only himself to blame this time'], a: 0,
      cue: '「in the past」と「This time」を比べて。',
      line: 'I’ve gone bust in the past, but… *I did something reckless*. This time, *I was smart and careful*…',
      said: '「前の破産は無茶のせい。今回は賢く慎重にやったのに破産した」と言う。',
      mean: '原因が自分にないので、どうすればいいか分からない。それが一番つらい。',
      trap: 'reckless で「反省」に取りやすいが、それは昔の話。This time のあとが今回。',
      use: 'I did everything right, and it still failed.（全部ちゃんとやったのに、だめだった）' },

    // R fix: V2 and §9.5, blind 55 %. "I've been bust" isn't natural English, so it was easy to rule out. Cut to the
    //   three real options.
    // why: I went ← "went bust" is the common phrase, and "gone" and "went" both start soft; I'd gone ← the weak 've
    //   heard as 'd
    { id: 's1', skill: 'sound', level: 'B2', point: 'bust', seg: [130.05, 134.65],
      stem: 'Fill the gap: “___ bust in the past.”',
      choices: ['I’ve gone', 'I went', 'I’d gone'], a: 0,
      cue: '「problem, though」のあと、bust の前。',
      line: '*I’ve gone* bust in the past',
      said: '「前にも破産したことはある」と言う。',
      mean: 'I’ve の v はほぼ聞こえず、gone が強い。go bust ＝ 破産する。',
      trap: 'went bust もよく聞く形だが、母音が「ゴ」か「ウェ」かで分かれる。',
      use: 'I’ve been there before.（前にも行ったことがある）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'comeup', seg: [141.1, 143.4],
      stem: 'Type what Lucy says: “and you’ll ___ a new idea.” (3 words)', answer: 'come up with',
      cue: '「you’ll」のあと、三語がつながる。',
      line: 'and you’ll *come up with* a new idea.',
      said: '「新しいアイデアを思いつくよ」と励ます。',
      mean: 'come up with ＝ 思いつく。up with がつながり「カマップウィズ」に近い。',
      trap: 'up と with が弱く、つながって一語に聞こえやすい。アイデアの前なら come up with。',
      use: 'Can you come up with a better name?（もっといい名前、思いつく？）' },

    // why: four weeks / four days ← "four" caught, the unit lost; fourteen ← "-teen" heard in "four months"
    { id: 'n3', skill: 'number', level: 'B1', point: 'four', seg: [145.8, 150.5], keep: true,
      stem: 'How soon did Tom’s entertainment company fail?',
      choices: ['In four days', 'In four weeks', 'In four months', 'In fourteen months'], a: 2,
      cue: '「failed in」のあとの数と単位。',
      line: 'I once started an entertainment company. It failed in *four months*.',
      said: '「昔、エンタメ会社を始めた。4か月でつぶれた」と話す。',
      mean: 'four months ＝ 4か月。すぐに失敗した、ということ。',
      trap: 'four のあとの単位が速い。months の th と s はまとまって「マンス」に聞こえる。',
      use: 'The shop closed after four months.（その店は4か月で閉店した）' },

    // R fix: V2, blind 80 %. "Give up after fifty" was weak. The new distractor is the set phrase the line turns
    //   around ("land of second chances").
    // why: second chances ← the set phrase, and "second… chances" is said, but as what America is NOT about; two or
    //   three tries ← "second or third" caught and "isn't" lost
    { id: 'i5', skill: 'infer', level: 'B2', point: 'chances', seg: [155.5, 170.15],
      stem: 'What is Tom’s point about chances?',
      choices: ['Success can take dozens of tries', 'America is a land of second chances',
                'Big wins come after two or three tries'], a: 0,
      cue: '「isn’t about」と「It’s about」の対比。',
      line: 'the story of America *isn’t about second or third chances*. It’s about fourth, fifth… *fiftieth chances*.',
      said: '「アメリカは2度目や3度目でなく、4度目、5度目…50度目のチャンスの話だ」と言う。',
      mean: '何度失敗してもやり直せば成功できる。自分もそうだった、という話。',
      trap: 'second or third が先に聞こえるが、isn’t で否定されている。',
      use: 'Don’t give up. Try again.（あきらめないで、もう一回）' },

    // anchor: 195.0–204.7 s the "types" are the friends' names (Ben, Leslie and Ron are named earlier in the clip) and
    //   Tom's own; 210.9–212.2 s "Do not be a Gary", then 213.5–214.6 s "He's talking about me."
    // R fix: V2, blind 50 %. "Tom before his success" was weak. The new distractor is Tom's vanity ("my personal
    //   favorite, a Tom"), the other joke in the segment. The key is shortened (it was the longest).
    // why: anyone named Gary ← "a Gary" heard as a type of person, like "a Karen"; Tom ← "my personal favorite, a
    //   Tom" also gets a laugh, so the joke seems to be his vanity
    { id: 'c2', skill: 'humor', level: 'C2', point: 'gary', seg: [194.5, 215.4],
      stem: 'In “Do not be a Gary”, who is the joke on?',
      choices: ['The one friend left off the list', 'Anyone in the crowd named Gary',
                'Tom, who made himself the favorite'], a: 0,
      cue: '並ぶ名前がだれのものかと、最後の一言。',
      line: 'a Ben, a Leslie, a Ron… or my personal favorite, a Tom. … *Do not be a Gary.* — *He’s talking about me.*',
      said: '成功する人の型に仲間の名前を並べ、「Gary にはなるな」。客席の一人が「僕のことだ」と言う。',
      mean: '型の名前はみな仲間。一人だけ外された Gary が、悪い見本として笑いものにされている。',
      trap: '「～みたいな人」という一般名詞に聞こえやすい。名前が仲間のものと気づくと、特定の一人だと分かる。',
      use: 'Don’t be that guy.（ああいう人にはならないで）' },

    // R fix: V2, blind 85 %. The distractors are now the title in the wrong relation, and the Japanese modesty frame.
    // why: bad title ← "the book's called Failure" heard as a complaint about the title; modest ← the 謙遜 frame:
    //   a friend waving off thanks
    { id: 'h5', skill: 'humor', level: 'C1', point: 'take', seg: [221.4, 230.35],
      stem: 'Why does a friend say “I don’t know how to take that”?',
      choices: ['His thanks sound like they helped him fail', 'The friend is too modest to accept thanks',
                'The friend thinks Failure is a bad title'], a: 0,
      cue: 'お礼の言葉と、本のタイトルを合わせて。',
      line: 'I couldn’t have done it without you. — Well, *the book’s called Failure*.',
      said: '「君たちのおかげ」に、仲間が「本の題は『失敗』だよ。どう受け取れば」と返す。',
      mean: '「失敗」の本で「君たちのおかげ」と言われると、失敗に手を貸したようにも聞こえる。',
      trap: '題への文句や遠慮にも聞こえるが、引っかかるのはお礼と題の組み合わせ。',
      use: 'I’m not sure how to take that.（それ、どう受け取ればいいのかな）' },

    // anchor: 238.4–244.6 s the long message is "actually for Kendrick Lamar"; 246.0–248.5 s "Here's yours. Best
    //   wishes."; 250.8–251.9 s "I mean every word of it": two words to mean
    // R fix: V2, blind 50 %. "Insulting" was easy to rule out. The new distractor is the mix-up itself, which does
    //   happen but is put right with "Here's yours".
    // why: awkward ← "That's actually for Kendrick Lamar" heard as the end of it; sweet ← "every word" heard as
    //   covering the long, warm message he just read
    { id: 'c3', skill: 'attitude', level: 'C2', point: 'everyword', seg: [232.0, 252.4],
      stem: 'How does “I mean every word of it” land after their copy is read?',
      choices: ['Funny: there are only two words to mean', 'Awkward: he handed them the wrong copy',
                'Sweet: he means the longer message too'], a: 0,
      cue: '長い献辞がだれ宛てかと、彼らの分の長さ。',
      line: '…That’s actually *for Kendrick Lamar*. Here’s yours. *Best wishes.* … *I mean every word of it.*',
      said: '心のこもった長い献辞は別の有名人宛てで、仲間の本には「よろしく」だけ。そこで「全部本気だよ」と言う。',
      mean: '「一語一語本気」と言っても、二語しかない。立派な決め文句が、短すぎる中身で空回りしている。',
      trap: '取りちがえで終わったように見えるが、すぐ本物が渡される。決め文句は何に向けたかを聞く。',
      use: 'Short, but I mean it.（短いけど本気だよ）' },
  ]
};
