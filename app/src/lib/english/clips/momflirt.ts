// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 1
// REVIEW open: c3 rests on the deadpan of “That's what we thought, too” (the contrast with 235.5 s is outside its
//   segment); if it doesn't sound flat on the phone, retire c3. s1 and x1 left the ear-check list (both sources
//   agree on their words: review-rubric addendum).
// REVIEW open: on a cold re-read, a1, pr2 and c1 still came in at 55–60 % (subtext vs. literal reading); kept.
// “Is Leslie's Mother Flirting With Ben? | Parks and Recreation” (the official Parks and Recreation channel, Season 3):
// after a bad first meeting, Leslie's mother Marlene raises the school-bus request; Leslie coaches Ben by playing her
// mother, sets up a café "chance" meeting where Ben is tough and the two bond over a comic strip, then Ben says Marlene
// made a pass at him, tells her he's dating Leslie, and the buses are settled.
// Segments from the captions, words from whisper (2026-11-16). Whisper loops “You keep your hands off him” over
// 308–330 s, so nothing after 300 s is used. Speakers come from the words: Ben is named (“Ben can handle it”, “Ben,
// wait”), Leslie is “Leslie and I are dating”, Marlene is named and called “Mom”; the role-play (58–92 s) is Leslie as
// her mother (“I'll be my mom”). Untested: 128.8 s (captions “talk to her”, whisper “talk to him”; a2's line leaves it
// out), 134 s (“This is not possible” vs “It's just not possible”), 142.9–148.5 s (who says the compromise lines),
// 184.5 s (“hash things out” vs “up”), 186 s (“It might get rough…”), the “asking for it / how were you dressed /
// harassment memo” stretch (245–259 s), and who says “Four buses” (n3's key holds either way: “Deal” follows “Two”).
// EAR CHECK: 290.4 s c3 — “That's what we thought, too” is said flat (irony), not with a laugh
import type { Clip } from '../types.ts';

export const momFlirt: Clip = {
  id: 'momflirt', video: 'oZn5LRn-giw', title: 'Is Leslie\'s Mother Flirting With Ben?', dur: 330, wpm: 183,
  band: 'fast', tags: ['職場', '恋愛'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: easy to push ← "pushover" is Ben's word just before; dull ← "cute" is said, and the cut-off "you give off
    //   a very…" invites a guess
    { id: 'd1', skill: 'detail', level: 'B2', point: 'firstmet', seg: [6.0, 14.8],
      stem: 'How did Leslie see Ben when they first met?',
      choices: ['As a tough, rigid man', 'As a soft man, easy to push', 'As cute, but a little dull'], a: 0,
      cue: '「When I first met you」のあと。',
      line: 'I thought you were a *fascist hardass*… *cute* fascist hardass',
      said: '「初対面では、すごく厳しい人だと思った。かわいいけど」と言う。',
      mean: 'fascist hardass は「堅物」の乱暴な言い方。押しに弱いとは誰も思わない、という励まし。',
      trap: 'pushover は直前の Ben の言葉。cute はあとの付け足し。',
      use: 'He seems strict, but he’s really kind.（厳しそうだけど本当は優しい）' },

    // why: ten ← the new number, said just before; forty ← four/forty differ only in the -ty ending
    { id: 'n1', skill: 'number', level: 'B1', point: 'four', seg: [15.3, 21.1], keep: true,
      stem: 'Before the new request, how many buses did the department want?',
      choices: ['Four', 'Ten', 'Forty'], a: 0,
      cue: '「I thought they only wanted」のあと。',
      line: 'I thought they only wanted *four*.',
      said: '「教育局がバス10台を要求」「4台だけのはずでは」。',
      mean: '要求が4台から10台に増えた。前の会議で Ben が甘く見られた結果。',
      trap: 'four と forty は語尾で決まる。forty なら最後に「ティ」がある。直前の10にも引かれやすい。',
      use: 'I thought you only wanted one.（1個だけ欲しいんだと思ってた）' },

    // R fix: B1 — its stem and line show "I'm a pushover", a1's key, so it reveals 'yachts'
    // R fix: V2 — "why not ask for 10?" in the stem ruled out "not that" by grammar alone; the stem now stops at
    //   "pushover…", so all three openers fit
    // why: not that ← now/not differ only in the last sound, and "not that I'm…" is a common opener; now, as ← the t
    //   of "that" drops, leaving "now-a…"
    { id: 's1', skill: 'sound', level: 'B2', point: 'nowthat', reveals: ['yachts'], seg: [21.0, 24.2],
      stem: 'Fill the gap: “Well, ___ I’m a pushover…”',
      choices: ['now that', 'not that', 'now, as'], a: 0,
      cue: '「Well,」の直後の2語。',
      line: 'Well, *now that* I’m a pushover, why not ask for 10?',
      said: '「今や僕は押しに弱い男だから、10台でも要求すれば？」と言う。',
      mean: 'now that ＝「〜になった今は」。that は弱く「ザッ」程度。理由を表すつなぎ。',
      trap: 'not that なら「〜ではないが」で逆の意味。now の「ナウ」の音で聞き分ける。',
      use: 'Now that you’re here, let’s start.（来てくれたし、始めよう）' },

    // R fix: V2 — "more and more buses" in the stem pointed at sarcasm, and the distractors were weak; neutral stem,
    //   two new near misses
    // why: playful ← rising numbers and "How about that?" sound light; admiring ← "why not ask for…" read as praise for
    //   the department's nerve
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'yachts', seg: [21.0, 28.4],
      stem: 'When Ben answers the news of the bigger request, how does he sound?',
      choices: ['Sarcastic, stung at being seen as weak', 'Playful, laughing the whole thing off',
                'Admiring, as if their nerve impressed him'], a: 0,
      cue: '数がどこまで増えるか、最後に何が出るか。',
      line: '…or *100 new school buses* and a *fleet of school yachts*? How about that?',
      said: '「20台、100台、いっそスクールヨットの船団でも」と数を盛っていく。',
      mean: 'ありえない要求まで並べる自虐の皮肉。押しに弱いと思われたことへの苛立ち。',
      trap: '声が弾むので冗談や感心に聞こえるが、pushover と自分で言う。大げさな列挙は皮肉の合図。',
      use: 'Sure, and why not a pony, too?（ついでにポニーもどう？）' },

    // R fix: V2 — the key was the only choice about the meeting itself; all three are now ways of talking to her
    // why: hear out ← "out" as in "hear her out"; take out ← "have… out" read like "have (dinner) out"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'haveitout', seg: [28.6, 36.4],
      stem: 'At the end of his plan, what does Ben say he’ll do with her mom?',
      choices: ['Argue until the matter is settled', 'Let her say everything she wants', 'Take her out to talk it over'],
      a: 0,
      cue: '「another meeting with her」のあとの短い言い方。',
      line: 'I’m going to have another meeting with her and *we’re going to have it out*.',
      said: '「お母さんのことを全部教えて。もう一度会って、やり合う」と言う。',
      mean: 'have it out ＝ 正面から言い合って決着をつける。対決の宣言。',
      trap: 'out から「話を聞く」や「外食」を想像しやすい。it は「もめごと」を指す。',
      use: 'Let’s just have it out.（もう話をつけよう）' },

    // R fix: V2 — "run" was the only choice that answered a confrontation plan; the distractors now read the "Or" too
    // why: cheer up ← a holiday idea sounds like a mood change after "pushover"; earned a break ← trips as a reward
    { id: 'i2', skill: 'infer', level: 'C1', point: 'belize', seg: [36.2, 43.4],
      stem: 'What does Leslie’s idea of a Belize trip show?',
      choices: ['She’d rather dodge her mom than fight', 'She’s changing the subject to cheer Ben up',
                'She thinks Ben has earned a break first'], a: 0,
      cue: '文頭の短い一語と、何の代わりの案か。',
      line: '*Or* we could go to Belize and go scuba diving',
      said: '母と対決する案を聞いて、「それか、ベリーズでダイビングでも」と別の案を出す。',
      mean: 'Or で対決の代わりに逃げる案を出している。母と戦うのが怖い本音がのぞく。',
      trap: '旅行の話は休息やご褒美に聞こえるが、Or は「その代わりに」。前の案を避ける合図。',
      use: 'Or we could just order pizza.（それか、ピザ頼んじゃう？）' },

    // R fix: V2 — on the cold re-read, "he let her down" was too weak (60 %); the new near miss is her mom's harshness
    // why: asked ← the practice follows Ben's own "Here's what we're going to do"; mom worse ← "I'll be my mom" heard as the
    //   reason for the harshness
    { id: 'd2', skill: 'detail', level: 'B1', point: 'harsh', seg: [50.6, 55.7],
      stem: 'In the practice, why will Leslie be harsh, she says?',
      choices: ['Because she likes him a lot', 'Because he asked her to be', 'Because her mom will be worse'], a: 0,
      cue: '「very harsh with you」のあと。',
      line: 'I’m going to be very harsh with you and *it’s only because I like you a lot*.',
      said: '「母の役をやる。すごく厳しくするけど、それはあなたが大好きだから」と言う。',
      mean: '本番で強くなってほしいから、わざと厳しくする。練習の前の予告。',
      trap: 'harsh や my mom だけ聞くと、罰や母のせいに聞こえる。because のあとに理由が来る。',
      use: 'I’m tough on you because I care.（あなたのためだから厳しくするの）' },

    // why: sits ← "you should be sitting by now" comes soon after (the opposite); too fast ← "just walk in and start
    //   talking" heard as a call to slow down
    { id: 'd3', skill: 'detail', level: 'B1', point: 'hello', seg: [58.0, 64.7],
      stem: 'Why does Leslie stop Ben right away in the practice?',
      choices: ['He greets her before getting down to it', 'He sits down before she has asked him to',
                'He brings up the buses much too quickly'], a: 0,
      cue: '「Wrong.」のあとの説明。',
      line: 'Hello. — Wrong. … *No preambles, no introductions*, just walk in and start talking.',
      said: '「Hello」と言った途端「ダメ。前置きもあいさつもなし、入ってすぐ話して」と止める。',
      mean: '母は前置きを弱さと見る。あいさつ抜きで本題に入れ、という指導。',
      trap: 'あとで「もう座ってて」とも言うので混ざりやすい。最初の Wrong の理由を聞く。',
      use: 'Let’s skip the small talk.（世間話は抜きにしよう）' },

    // R fix: V1/V2 — "Dr. Seuss" in the stem let world knowledge answer it; the stem names the moment only
    // why: formal ← "I'd like to discuss…" is stiff, and she wanted no preambles; sitting ← "you should be sitting by
    //   now" follows (he hasn't sat down yet)
    { id: 'h1', skill: 'humor', level: 'B2', point: 'seuss', seg: [65.0, 72.3],
      stem: 'Why does Leslie’s reply to Ben’s first real line get a laugh?',
      choices: ['She mocks the rhyme in his line', 'She mocks how stiff and formal he is',
                'She mocks him for sitting too soon'], a: 0,
      cue: 'Ben の最初の一文の、最後の2語の音。',
      line: 'I’d like to *discuss* the new school *bus*. — Well, I’d like to discuss your *rhyming*',
      said: '「バスの話を」に、母役が「あなたの韻の話を」と返す。',
      mean: 'discuss と bus の韻を、絵本作家の名前でからかう。中身でなく言い方を突く手。',
      trap: 'あとの「もう座ってて」や堅い言い方に気を取られやすい。直後の rhyming が答え。',
      use: 'Okay, that rhymed. Not on purpose.（あ、韻踏んじゃった。わざとじゃない）' },

    // R fix: V2 — the key was the only pointed choice; both distractors now describe her mom's way with words
    // why: grammar ← she "corrects" his speech, so it sounds like a grammar stickler; rhymes ← "Um / dumb" rhymes, like
    //   his line did
    { id: 'i3', skill: 'infer', level: 'C1', point: 'umdumb', seg: [74.2, 80.3],
      stem: 'When Leslie adds “That’s what she says to people”, what does Ben learn?',
      choices: ['Her mom jumps on any filler to rattle people', 'Her mom corrects people’s grammar all the time',
                'Her mom likes to answer people with rhymes'], a: 0,
      cue: '「Um」への返しと、そのあとの一言。',
      line: '*Um is the sound in dumb.* — That’s what she says to people.',
      said: '「Um」に「Um は dumb の音」と返し、「母は本当にそう言うの」と足す。',
      mean: '言いよどみ一つでも突いて、相手をひるませる人だと分かる。本番の厳しさの予告。',
      trap: '韻や言葉直しに聞こえるが、突いたのは Um という迷いの音。狙いは動揺させること。',
      use: 'Don’t let her rattle you.（あの人に動揺させられないでね）' },

    // why: start again ← he has just asked "Should we just start over?"; mark ← pin = 留める, as if pinning a note
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'pin', seg: [80.2, 83.8],
      stem: 'When Ben asks to start over, what does Leslie want to do?',
      choices: ['Stop for now and come back to it later', 'Start again from the very top right away',
                'Mark the key point so he won’t forget'], a: 0,
      cue: '「No. No,」のあとの言い方。',
      line: 'No. No, we need to *put a pin in this*.',
      said: 'やり直そうかと聞く Ben に「ううん、いったん保留」と言う。',
      mean: 'put a pin in it ＝ 話をいったん止めて、あとで戻る。会議でよく使う。',
      trap: 'pin から「印をつける」を想像しやすい。No のあとなので、やり直しも断っている。',
      use: 'Let’s put a pin in that for now.（その件はいったん保留で）' },

    // R fix: S4 — the segment ended 0.4 s after “this”; it now ends at 84.3
    { id: 'x1', skill: 'dict', level: 'B2', point: 'pin', seg: [81.6, 84.3],
      stem: 'Type what she says: “No, we need to ___.” (5 words)', answer: 'put a pin in this',
      cue: '2回目の「No」のあと。',
      line: 'No. No, we need to *put a pin in this*.',
      said: '「いったん保留にしよう」と言っている。',
      mean: 'put a と pin in がつながり「プラピニン」のように聞こえる。put の t は弾んで弱い。',
      trap: 'pin in が一語に聞こえやすい。動詞 put のあとに a と名詞が来る形を思い出して。',
      use: 'Hold that thought.（その話、ちょっと待って）' },

    // why: ten ← "10 minutes" comes right after, and "top ten" is the usual list; thousand ← hundred/thousand swap,
    //   a "huge list" picture
    { id: 'n2', skill: 'number', level: 'B1', point: 'topics', seg: [83.4, 91.9], keep: true,
      stem: 'How many topics are on her mother’s favorites list?',
      choices: ['Ten', 'A hundred', 'A thousand'], a: 1,
      cue: '「my mother’s top」のあと。',
      line: 'a list of my mother’s *top 100* favorite conversation topics',
      said: '「母のお気に入りの話題トップ100のリスト。暗記の時間は10分」と渡す。',
      mean: '100個を10分で覚えろという無茶な準備。母の機嫌をとる作戦。',
      trap: 'top ten という言い方に慣れていると10を選びやすい。10はあとの「10分」。',
      use: 'Here’s my top five list.（これが私のベスト5）' },

    // R fix: V2 — the key was the only two-part, hedged choice; all three are now two-part outcomes
    // why: deal ← "So, you got a deal?" heard as the deal itself; turns down ← "This is not possible" and "Maybe we
    //   could do this another time" early on, plus a polite "It was a pleasure"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'cafe', seg: [96.0, 194.0],
      stem: 'How does the coffee meeting end?',
      choices: ['She’ll think it over and meet him again', 'She takes his deal, and they shake on it',
                'She turns him down, but stays polite'], a: 0,
      cue: '最後の「deal?」への返事を聞いて。',
      line: 'let me *mull everything over*, and then we can *reconnect*…',
      said: '「取引成立？」と聞かれ、母は「よく考えて、また話し合いましょう」と答える。',
      mean: 'その場では決めず、次に会う約束だけ。最初は追い返そうとしていたのに、態度が変わった。',
      trap: 'deal が聞こえても成立とは限らない。質問か返事かを聞き分ける。',
      use: 'Let me mull it over.（ちょっと考えさせて）' },

    // why: make up ← an apology visit after the bad first meeting is the usual script; in private ← the later
    //   "we're dating" news
    { id: 'i4', skill: 'infer', level: 'C1', point: 'setup', seg: [96.3, 107.6],
      stem: 'Why has Leslie brought her mother to the café, from what she says?',
      choices: ['To soften her up for Ben’s visit', 'To make up for Ben’s first meeting',
                'To tell her about Ben in private'], a: 0,
      cue: '「I just figured」のあと。',
      line: 'I just figured, hey, why not *put my mother in a good mood*?',
      said: '母に「なんて気が利くの」と言われ、「母を上機嫌にしておこうと思って」と答える。',
      mean: 'この直後に Ben が現れる。偶然を装った待ち伏せの下準備だと分かる。',
      trap: '娘の親孝行に聞こえるが、狙いは Ben の交渉。直後に誰が来るかとつなげて聞く。',
      use: 'I figured I’d butter him up first.（先にご機嫌をとっておこうと思って）' },

    // R fix: V2/K6 — the scare quotes on "choice" flagged the key; plain wording, and "a better time" is the new near
    //   miss (her "another time")
    // why: better time ← "if you'd prefer" + her "Maybe we could do this another time" (the お任せします frame); phone
    //   ← call = 電話
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'yourcall', seg: [120.4, 127.8],
      stem: 'How does Ben finish his point about the education budget?',
      choices: ['He makes a threat sound like an option', 'He politely lets her pick a better time',
                'He asks her to call him with her answer'], a: 0,
      cue: '「Or if you’d prefer」から最後まで。',
      line: 'Or if you’d prefer, I could put a *permanent freeze* on the education budget. *It’s your call.*',
      said: '「なんなら教育予算を永久に凍結してもいい。決めるのはあなただ」と言う。',
      mean: '選ばせる形だが、片方は予算凍結。実質は「今ここで話すしかない」という脅し。',
      trap: 'your call を「お任せします」や電話と取りやすい。選択肢の中身を聞けば脅し。',
      use: 'Stay or go, it’s your call.（残るか帰るか、君が決めて）' },

    // why: worried ← "self-assured" read as a warning about arrogance; amused ← Ben's sudden toughness could seem
    //   funny to her
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'neutral', reveals: ['setup'], seg: [128.4, 133.0],
      stem: 'When Leslie tells her mom to talk to Ben, how does she come across?',
      choices: ['Neutral, as if she had no part in this', 'Worried that Ben is being far too proud',
                'Amused at how bossy Ben has become'], a: 0,
      cue: '「Mom」と呼んだあと、Ben をどう説明するか。',
      line: 'He seems pretty *self-assured*.',
      said: '母に「話してみたら？自信がありそう」と他人事のように言う。',
      mean: 'seems は初対面の人を評する言い方。仕組んだ本人が、知らないふりで援護している。',
      trap: 'self-assured を「うぬぼれ」と取ると心配に聞こえる。ここは Ben の後押し。',
      use: 'She seems pretty confident.（彼女、かなり自信ありそうだね）' },

    // R fix: V2 — the key was the only choice with an edge; all three now name the line's kind and its source
    // why: business giant ← Andrew Carnegie is the first quote, just before; children's book ← the earlier "Dr. Seuss",
    //   and a cartoon sounds childlike
    { id: 'h2', skill: 'humor', level: 'C1', point: 'quote', seg: [148.3, 161.3],
      stem: 'What makes Ben’s second quote funny in a hard bargaining talk?',
      choices: ['It’s an insult, borrowed from a comic strip', 'It’s a tough line, borrowed from a business giant',
                'It’s a kind line, borrowed from a kids’ book'], a: 0,
      cue: '「But your demands remind me」以降の引用。',
      line: 'your demands remind me of a different quote… *“You need a lobotomy. I’ll get a saw.”*',
      said: '「あなたの要求で思い出す名言がある。『脳の手術が要るね、ノコギリ持ってくる』」と言う。',
      mean: '漫画のせりふを借りて「その要求は正気じゃない」と言う。失礼を引用で包んだ返し。',
      trap: '最初の引用は実業家の言葉で、二つを混ぜやすい。中身と出どころで判断する。',
      use: 'To quote my dad, “Nice try.”（父の言葉を借りれば「惜しい」）' },

    // R fix: V2 — the near misses were weak (a near disaster); now "Ben's toughness" (what the scene shows) and
    //   "a lucky break" ("Thank God… Crisis averted")
    // why: Ben's toughness ← the café scene shows Ben winning; lucky break ← "Thank God… Crisis averted" read as relief
    // anchor: 163.6–167.2 s “this is some of my best work. This could not have gone better.” She claims the café as
    //   her doing (and 104.2 s “why not put my mother in a good mood?”)
    { id: 'c1', skill: 'infer', level: 'C2', point: 'setup', seg: [163.3, 172.3],
      stem: 'After Leslie’s words to the camera, how should we see the café meeting?',
      choices: ['As the setup she planned paying off', 'As Ben’s toughness winning, to her surprise',
                'As a lucky break she’s just relieved about'], a: 0,
      cue: 'カメラへの最初の一文と、場面との関係。',
      line: 'this is some of *my best work*. This *could not have gone better*.',
      said: 'カメラに「我ながら最高の仕事。これ以上ない出来」と話す。',
      mean: '場面では Ben の強気が効いて見えたが、この一言で自分の仕組んだ作戦だと分かる。',
      trap: 'Thank God は「運良く」に聞こえやすい。誰の手柄かを語る一文を探す。',
      use: 'Not to brag, but I planned it.（自慢じゃないけど、計画どおり）' },

    // why: fighting ← hitting = 打つ, and the meeting was called a "battle"; wrapping up ← "off" heard as ending
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'hitoff', seg: [167.8, 172.3],
      stem: 'To the camera, how does Leslie describe Ben and her mom?',
      choices: ['Getting along well right away', 'Fighting hard over the buses', 'Wrapping up their meeting'], a: 0,
      cue: '「They are really」のあと。',
      line: 'They are really *hitting it off*. Thank God.',
      said: 'カメラに「二人は意気投合してる。よかった」と話す。',
      mean: 'hit it off ＝ 会ってすぐ気が合う。交渉相手と打ち解けたことを喜んでいる。',
      trap: 'hit から「ぶつかる」、off から「終わる」を想像しやすい。Thank God が続くので良い知らせ。',
      use: 'We hit it off right away.（すぐに意気投合したよ）' },

    // R fix: V2 — the header's scene line and two off-scene distractors made it an 80 % guess; the distractors are now
    //   ways of handling a pass that the words he says rule out
    // why: flattered ← his earlier "She was just flirting a little"; report ← Leslie's "memo about sexual harassment"
    { id: 'g3', skill: 'gist', level: 'B1', point: 'reveal', seg: [252.8, 299.5],
      stem: 'In the last part, how does Ben handle the problem with Leslie’s mom?',
      choices: ['He tells her he’s seeing her daughter', 'He tells her he’s flattered, but says no',
                'He warns her he could report her'], a: 0,
      cue: '母の前で、Ben が最初に言うこと。',
      line: '*Leslie and I are dating.* We haven’t told anyone…',
      said: 'メキシコに行けと言われた Ben は、母の所へ戻り「レスリーと付き合っています」と打ち明ける。',
      mean: '逃げずに秘密を明かして、口説きを止めさせる。',
      trap: 'セクハラの通達も出るが Leslie の案。Ben が母の前で最初に言う一文を聞く。',
      use: 'I’ll just tell her the truth.（正直に話すよ）' },

    // R fix: V2 — "Leslie asked him" was a weak filler; the literal apology is now the near miss
    // why: regrets ← "I'm sorry we didn't tell you" taken at face value; flattered ← the polite-refusal frame (遠慮)
    // anchor: 266.9–279.2 s he opens with “Leslie and I are dating”, then “sorry we didn't tell you before you touched
    //   my knee”: the apology names her move, and “your daughter” says whose partner he is
    // retired: for the draws: it reveals g3's point (reveal), so play 3+ under g3 drew no C2 while it was unseen;
    //   c1, c3 remain
    { id: 'c2', skill: 'attitude', level: 'C2', point: 'knee', reveals: ['reveal'], seg: [266.4, 279.8], retired: true,
      stem: 'When Ben brings up her touching his knee, what is he really telling her?',
      choices: ['That her move was out of line, and it ends now', 'That he truly regrets not warning her sooner',
                'That he’s flattered, but has to say no'], a: 0,
      cue: '「I’m sorry」のあと、何について謝っているか。',
      line: 'Leslie and I are dating… *I’m sorry we didn’t tell you before you touched my knee*',
      said: '「レスリーと付き合っています。膝を触られる前に言えずすみません」と話す。',
      mean: '謝る形で相手のしたことを口にし、娘の恋人だと気づかせてやめさせる。',
      trap: 'I’m sorry を本当の謝罪と取ると後悔や断りに聞こえる。謝る対象が相手の行動なら遠回しの指摘。',
      use: 'Sorry, I should’ve said I’m married.（すみません、既婚だと言うべきでした）' },

    // R fix: V2 — the key was the only ironic reading; both distractors now take "thought, too" at face value
    // why: funny ← "too" as plain agreement; guessed ← "That's what we thought" read as "we expected that"
    // anchor: 278.4–279.2 s the end of Ben's stiff news (“could get your daughter fired”), then 290.4 s the flat “That's what we thought, too” after
    //   her “That is hilarious” (and 235.5 s Leslie's “The whole thing is screwed up now”)
    { id: 'c3', skill: 'humor', level: 'C2', point: 'hilarious', seg: [278.0, 292.5],
      stem: 'Why is “That’s what we thought, too” a joke?',
      choices: ['They say the opposite of what they felt', 'They honestly found it funny themselves',
                'They had guessed she would laugh at it'], a: 0,
      cue: '母の笑いへの返事と、それまでの二人の様子。',
      line: 'That is *hilarious*. — *That’s what we thought, too.*',
      said: '母が「おかしい！」と大笑いし、二人は「僕たちもそう思った」と返す。',
      mean: '実際は「最悪」と頭を抱えていた。正反対のことを真顔で言う、乾いた皮肉。',
      trap: 'too を素直な同意や予想と取りやすい。それまでの二人の反応と比べ、本心と逆なら皮肉。',
      use: 'Oh yeah, we loved that part too.（ああ、私たちもあそこ最高だと思った）' },

    // why: four ← the first number in the bargaining; ten ← the request at the start
    { id: 'n3', skill: 'number', level: 'B2', point: 'final', reveals: ['four'], seg: [295.6, 299.6], keep: true,
      stem: 'How many buses does the department end up with?',
      choices: ['Two', 'Four', 'Ten'], a: 0,
      cue: '最後の3つのやりとりの順番。',
      line: '*Four buses.* — *Two.* — *Deal.*',
      said: '「4台」「2台」「決まり」と短くやりとりする。',
      mean: 'Deal は直前の数に合意する言葉。最初の4台より少ない2台で決着した。',
      trap: '最初に聞こえる four を答えにしやすい。Deal が何に答えているかで判断。',
      use: 'Twenty dollars? — Fifteen. — Deal.（20ドル？—15。—決まり）' },
  ]
};
