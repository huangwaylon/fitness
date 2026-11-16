// REVIEW 2026-11-16: pass 4, fix 20, drop 0, new 0; ear checks 2
// OPEN: the pilot's opening is famous, so d1 and g2 stay easy for anyone who knows the show, whatever the choices.
// “The Opening Scene of 'Friends' | Friends” (the official Friends channel, Best of Season 1): at the coffee house the
// friends quiz Monica about her date, Ross arrives crushed after his wife moves out, and Rachel runs in from her own
// wedding looking for Monica.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 260 s; whisper's repeated "kind of
// hoping" line after it is a hallucination. Untested on purpose: 10–12.5 s (the hump/hairpiece looks jokes), 22.7–28 s
// (the "not having sex" line), 39–50 s (the phone joke, innuendo), 71–73 s ("I want to kill myself"), 93–102 s (the
// aura lines, visual), 111–134 s (the lesbian lines), 146–152 s (strip joints), 162–164 s (the million-dollars joke
// rests on what's on screen), 176–178 s ("decaf": speaker and screen), 214–233 s (the gravy boat "turned on" line and
// Mr. Potato Head, world knowledge), 235.8 s ("always know" / "knew"). At 255.6 s whisper splits "who wasn't invited
// to the wedding" off as its own line: Monica cutting in, since Rachel answers it ("I was kind of hoping that
// wouldn't be an issue"). nt1 now turns on that split; a2 holds whoever says it.
// EAR CHECK: 86.5 s d4 — “Carol moved her stuff out today” (whisper) vs “your stuff” (captions); d4's key ("her
//   things") follows whisper, so a "your" would flip it
// EAR CHECK: 255.6 s nt1 — “who wasn't invited to the wedding” is Monica's cut-in, not the end of Rachel's sentence
//   (whisper splits it off; the captions run it on)
import type { Clip } from '../types.ts';

export const pilotOpening: Clip = {
  id: 'pilotopen', video: 'sIZ91tq8Lr0', title: 'The Opening Scene of ‘Friends’', dur: 271, wpm: 147, band: 'slow',
  tags: ['友だち', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %): only the key was about her date; all three are now about it
    // why: getting her ready ← "date" and "going out to dinner" heard as the usual pre-date script; talking her out
    //   of it ← "something wrong with him" + "what I went through with Carl" heard as dissuasion, and "guy I work
    //   with" as the reason
    { id: 'g1', skill: 'gist', level: 'B1', point: 'opening', seg: [2, 28.6],
      stem: 'What are the friends doing with Monica at the start?',
      choices: ['Quizzing her about a man she’s seeing', 'Helping her get ready for a big date',
                'Talking her out of a date with a coworker'], a: 0,
      cue: '最初の一言のあとの、みんなの質問。',
      said: 'モニカのデート相手について、みんなが「変な所があるはず」と質問攻めにする。',
      mean: 'からかい半分の質問攻め。相手を誰も知らない。',
      trap: 'Carl や something wrong から「やめておけ」と取りやすいが、相手を知らずに推測で聞いているだけ。',
      use: 'Okay, spill. Who is he?（さあ白状して。誰なの？）' },

    // why: old school friend ← "high school" and "Lincoln High" come up later; her brother's friend ← "my brother"
    //   is said later too
    // R fix: K6: the key was the only minimizer ("Just"); all three have it now. Cue leak "just" removed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'work', seg: [2, 5.5],
      stem: 'How does Monica describe the man at first?',
      choices: ['Just someone she works with', 'Just an old friend from high school', 'Just a friend of her brother’s'],
      a: 0,
      cue: '最初の一文のすぐあと。',
      line: 'it’s just *some guy I work with*',
      said: '「ただの職場の人よ」と、大したことではないように言う。',
      mean: 'some guy ＝ ある男の人。特別な相手ではない、と言いたい。',
      trap: 'あとで high school や brother も出てくるが、この人の説明ではない。最初の答えをそのまま拾う。',
      use: 'He’s just a guy from my gym.（ジムで会うただの人だよ）' },

    // R fix: V2 (blind 80 %): the two weak distractors are now a privacy reading and a "later" reading
    // why: too private ← "nothing to tell" read as 言えない (she won't say here); tell them later ← the Japanese
    //   「またあとで」 frame for putting off a question
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'nothing', seg: [2, 5.5],
      stem: 'What does Monica mean by her very first words?',
      choices: ['It’s really not much of a story', 'It’s too private to talk about here', 'She’ll tell them about it later'],
      a: 0,
      cue: '最初の一文。そのあとの「just」とセットで。',
      line: '*There’s nothing to tell*. It’s just…',
      said: '「話すようなことは何もないの」と切り出す。',
      mean: '大した話じゃない、と軽く流す決まり文句。本当に何もないとは限らない。',
      trap: '「ここでは言えない」「あとで話す」とは別。nothing to tell は「話すほどのことはない」。',
      use: 'There’s nothing to tell, really.（話すほどのことはないってば）' },

    // R fix: V2 (blind 70 %): the distractors are now a work trip and a friends' outing; cue leak "on" removed
    // why: hanging out as a friend ← go out with = 一緒に出かける, the literal reading; a work trip ← "some guy I
    //   work with" just before, joined to "going out"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'goingout', seg: [5.2, 10],
      stem: 'When a friend answers “Come on…”, what does he say Monica is doing?',
      choices: ['She’s going on a date with him', 'She’s going on a work trip with him',
                'She’s hanging out with him as a friend'], a: 0,
      cue: '反論の一言のすぐあと。',
      line: 'Come on, *you’re going out with* the guy.',
      said: '「何言ってるの、その人とデートするんでしょ」と返す。',
      mean: 'go out with ＋人 ＝ デートする・付き合う。場所の「外出」ではない。',
      trap: 'go out with を「一緒に出かける」と文字通りに取りやすい。with のあとが人なら恋愛の話が多い。',
      use: 'Are you two going out?（二人、付き合ってるの？）' },

    // R fix: V2 (blind 75 %): "There's got to be" was the only set phrase after "There's"; the gap now takes in
    //   "There's", so "There has to" (same sense, near sound) competes
    // why: There has to ← same meaning, and "-s t-" blurs into "has to"; There's bound to ← same meaning, short onset
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [5.2, 10],
      stem: 'Fill the gap: “___ be something wrong with him.”',
      choices: ['There’s got to', 'There has to', 'There’s bound to'], a: 0,
      cue: '文の最初、短くつながる3語。',
      line: '*There’s got to be* something wrong with him.',
      said: '「どこかおかしいところがあるはずだ」と言っている。',
      mean: 'There’s got to が「ゼアズガラ」とつながる（gotta）。〜に違いない。',
      trap: 'has to も同じ意味で「ハストゥ」と聞こえやすい。ここは z のあとに弾む「ガラ」が来る。',
      use: 'There’s got to be a better way.（もっといい方法があるはず）' },

    // R fix: V2 (blind 70 %): "warned her" was weak; it's now Monica as the one hurt ("her… went through… Carl")
    // why: Carl is the date ← the only man named in the scene, heard as Monica's date; Monica had the bad time ←
    //   "I don't want her to go through" heard with the "I went through" lost
    { id: 'i1', skill: 'infer', level: 'B2', point: 'carl', seg: [17, 20.9],
      stem: 'What does the friend who mentions Carl let slip?',
      choices: ['She herself had a bad time with Carl', 'Monica once had a bad time with Carl',
                'Carl is the man Monica is dating'], a: 0,
      cue: '「what I went through」のあとの名前。',
      line: 'I don’t want her to *go through what I went through* with Carl',
      said: '「私がカールで味わった思いを、彼女にさせたくない」と言う。',
      mean: 'go through ＝ つらい経験をする。カールとはひどい目にあった、と分かる。',
      trap: '名前が出る男性はカールだけなので、デート相手と取りやすい。with Carl は「カールとの間で」。',
      use: 'I know what you’re going through.（大変なのは分かるよ）' },

    // R fix: V2 (blind 60 %): the key was the only school choice; now two are school, two are cafeterias
    // why: school gym ← "back in high school" kept, the room lost; office cafeteria ← "the middle of the cafeteria"
    //   kept, "high school" lost (being exposed at work is the usual bad-dream script)
    { id: 'd2', skill: 'detail', level: 'B1', point: 'dream', seg: [31.2, 38.5],
      stem: 'In the dream someone describes, where is he standing?',
      choices: ['In his old high school cafeteria', 'In his old high school gym', 'In the cafeteria at his office'],
      a: 0,
      cue: '「I’m back in」のあと、場所を表す語。',
      line: 'I’m *back in high school*. I’m standing in the middle of the *cafeteria*',
      said: '「高校に戻っていて、食堂の真ん中に立っている」という夢の話。',
      mean: 'back in high school ＝ 高校時代に戻って。夢の場面設定。',
      trap: 'cafeteria は会社にもあり職場に取りやすい。直前の high school とつなげる。',
      use: 'I dreamed I was back in school.（学生に戻った夢を見た）' },

    // R fix: V2 (blind 50 %) and a cue leak ("weird" in the cue and only the key); choices now parallel
    // why: wakes him ← "the phone starts to ring" is the usual way a dream ends; calls too much ← "never" heard as
    //   "ever", which flips the mother into an overbearing one
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mother', seg: [50.4, 63.5],
      stem: 'Why does the end of the phone part of the dream get a laugh?',
      choices: ['In real life his mom never once calls him', 'In real life his mom calls him too much',
                'In the dream, the call is what wakes him'], a: 0,
      cue: '電話の相手が分かったあとの一言。',
      line: 'it turns out it’s my mother, which is very, very weird, *because she never calls me*.',
      said: '夢の中で電話が鳴り、母からだと分かる。「すごく変だ、母は電話してこないから」。',
      mean: '夢の変な所を挙げるはずが、現実の寂しい事実を言ってしまう。そのずれが笑い。',
      trap: '電話が鳴ると「目が覚める」型を期待しやすい。never を聞き落とすと逆の意味になる。',
      use: 'Weird, because he never texts me.（変なの、彼から連絡なんて来ないのに）' },

    // R fix: V2 (blind 55 %): "torn apart inside" echoed the intestine image; the key is plainer, and "stomach bug"
    //   is now a mild-illness idiom
    // why: under the weather ← body parts heard as a health complaint, the size of it lost; smothered by the fuss ←
    //   "tied it around my neck" read as feeling choked by everyone's worry
    { id: 'i3', skill: 'infer', level: 'B2', point: 'intestine', seg: [74.4, 82.5],
      stem: 'What is Ross saying with his description of how he feels?',
      choices: ['He feels utterly crushed', 'He feels a bit under the weather', 'He feels smothered by the fuss'], a: 0,
      cue: '「Are you okay」への答え全体。',
      line: 'I just feel like someone *reached down my throat*… and *tied it around my neck*.',
      said: '「誰かに小腸を口から引き出され、首に巻きつけられた気分」と答える。',
      mean: '大げさなたとえで、ひどく傷ついていると伝えている。体の不調の話ではない。',
      trap: '体の部分が続くので体調の話に聞こえやすい。I feel like… のあとは気持ちのたとえが多い。',
      use: 'I feel like a truck hit me.（トラックにはねられたような気分）' },

    // R fix: V2 (blind 75 %): choices made parallel (all "a snack is offered…"), so the key no longer stands out
    // why: a hint to stop ← the offer heard as changing the subject on purpose (話をそらす); as if hungry ←
    //   "small intestine… mouth" heard as stomach talk, so food sounds like the fix
    { id: 'h2', skill: 'humor', level: 'C1', point: 'cookie', seg: [74.4, 85.5],
      stem: 'Why does the one-word offer after that description get a laugh?',
      choices: ['A tiny snack is offered for a huge pain', 'A snack is offered as a hint to stop',
                'A snack is offered as if he were hungry'], a: 0,
      cue: '長いたとえ話の直後の一語。',
      line: '…and tied it around my neck. — *Cookie?*',
      said: 'ひどい苦しみを長々と語ったあと、誰かが「クッキーいる？」と一言。',
      mean: '大きすぎる痛みに、小さすぎるなぐさめ。その釣り合わなさが笑い。',
      trap: '話をそらしたと取りやすいが、本人はなぐさめているつもり。大小の落差を聞く。',
      use: 'Want some chocolate? It helps.（チョコ食べる？元気出るよ）' },

    // R fix: V2 (blind 70 %): "moved back in" was common-sense wrong for an upset Ross; it's now a tense near miss,
    //   and the stem no longer says "today". The ear check above was corrected: this key does rest on "her"
    // why: tomorrow ← "moved" heard without its -d, as a plan; phoned to say ← "Carol" + "today" heard as news by
    //   phone
    // retired: the key (“her things”) rests on words the sources dispute, “her stuff” (whisper) /
    //   “your stuff” (captions); back after its ear check (86.5 s)
    { id: 'd4', skill: 'detail', level: 'B2', point: 'carol', seg: [85.5, 90.2], retired: true,
      stem: 'What news explains why Ross is so upset?',
      choices: ['Carol took her things out today', 'Carol will take her things out tomorrow',
                'Carol phoned to say she was moving'], a: 0,
      cue: '「Carol」で始まる一文の、最後の方。',
      line: 'Carol *moved* her *stuff out* today.',
      said: '「キャロルが今日、荷物を運び出したの」と説明する。',
      mean: 'move ～ out ＝ 荷物を運び出す。別れて出ていったことを表す。',
      trap: 'moved の d は弱く、これからの話にも聞こえやすい。today と過去形がそろえば、もう済んだこと。',
      use: 'My roommate moved out last week.（ルームメイトが先週出ていった）' },

    // R fix: V2 (blind 50 %): "made peace" was the easy "yes"; it's now a sincere-but-hurting yes
    // why: yes, though it hurts ← the calm "I'll be fine… really" heard as a brave, sincere wish; too worn out ← the
    //   flat, tired "I'll be fine" heard as giving up ("To hell with her, she left me" shows he cares a lot)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'happy', seg: [103.4, 110.6],
      stem: 'When Ross wishes Carol well, does he mean it?',
      choices: ['No; he’s covering up his anger', 'No; he’s too worn out to care', 'Yes; though it still hurts a lot'],
      a: 0,
      cue: '「No, you don’t」と言われたあとの返事。',
      line: 'I hope she’ll be very happy. — No, you don’t. — *No, I don’t. To hell with her*, she left me!',
      said: '「彼女の幸せを願うよ」と言うが、「うそ」と返され、すぐ「ああ、願ってない」と認める。',
      mean: '平気なふりをしていただけで、本当は怒っている。',
      trap: '落ち着いた言い方を本心と取りやすい。すぐあとの言い直しまで聞いてから判断する。',
      use: 'I’m fine. No, actually, I’m not.（平気。いや、本当は平気じゃない）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'married', seg: [154.45, 157.6],
      stem: 'Type what he wants: “I just ___ again.” (4 words)', answer: 'want to be married',
      cue: '「I just」が3回。3回目のあと。',
      line: 'I just, I just, I just *want to be married* again.',
      said: '「ただ、また結婚したいだけなんだ」と言う。',
      mean: 'want to が「ワナ」とつながる。be married は「結婚している状態」。',
      trap: 'want to は弱く縮むので、to be を落としやすい。I just の繰り返しは言いよどみ。',
      use: 'I just want to go home.（ただ家に帰りたい）' },

    // R fix: V2 (blind 85 %): the key was the only past-tense, two-part story; "come back with her" is now a
    //   left-at-the-altar story. Cue leak "go" removed
    // why: left at the altar ← "Barry" and "get out of there" heard with the wrong one leaving; invite her at last ←
    //   "wasn't invited to the wedding" heard as Rachel putting it right now
    { id: 'g2', skill: 'gist', level: 'B2', point: 'rachel', seg: [166.3, 260.1],
      stem: 'Why has Rachel come looking for Monica?',
      choices: ['She ran out on her wedding and had nowhere to go', 'She was left at the altar and had nowhere to go',
                'She’s come to invite Monica to the wedding at last'], a: 0,
      cue: '話の最後、「So anyway」のあとの理由。',
      said: '結婚式の直前に逃げ出してきて、行く当てがなく、モニカを頼ってきた。',
      mean: '場面の後半は、この「逃げてきた花嫁」の事情説明。',
      trap: 'Barry の話が続くので、置いていかれたのは彼女だと取りやすい。get out of there と言っているのは本人。',
      use: 'I didn’t know who else to call.（ほかに誰に電話すればいいか分からなくて）' },

    // R fix: V2 (blind 70 %): distractors now a plausible worry and a plausible complaint
    // why: upset at the search ← "you weren't there" heard as a complaint; nervous ← turning up unannounced after
    //   drifting apart is the awkward script (a Japanese 遠慮 frame)
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'relief', seg: [166.3, 176.45],
      stem: 'How does Rachel sound when she finds Monica?',
      choices: ['Hugely relieved to have found her at last', 'Nervous about how Monica will react',
                'Upset that she had to search so long'], a: 0,
      cue: '最初の数語と、話す速さ。',
      line: 'Oh God, Monica, hi! *Thank God!*',
      said: '「モニカ！よかった！」と言い、ここに来るまでのことを一気に話す。',
      mean: 'Thank God ＝ 助かった、よかった。やっと会えた安心と興奮。',
      trap: 'you weren’t there を文句と取りやすいが、ここは経緯の説明。最初の一言が気持ちを決める。',
      use: 'Thank God you’re here!（来てくれてよかった！）' },

    // anchor: 174.0–176.0 s "…said that you might be here, and you are, you are": both sources have "and you are"
    //   with no "here", at ≈ 300 wpm
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'youare', seg: [173.97, 176.45],
      stem: 'Type what she says: “…you might be here, ___!” (3 words)', answer: 'and you are',
      cue: '「might be here」の直後。文法より、聞こえた音を。',
      line: '…said that you might be here, *and you are*, you are!',
      said: '「ここにいるかもと言われて、ほんとにいた！」と一気に言う。3語は弱くひと続き。',
      mean: 'and you are のあとの here を省いた形。「本当にいた」という喜び。',
      trap: '習った形の and here you are に直したくなる。書き取りは、正しい文ではなく言われた音を書く。',
      use: 'They said it’d rain, and it did.（雨だって言ってたけど、本当に降った）' },

    // R fix: V2 (blind 70 %): the key was the only figurative reading; "last friend" is now a second figurative one
    // why: an accident ← survivor = 生存者, the literal reading; hard to get into ← "survive" read as getting
    //   through the entrance exam (受験を乗り切る)
    { id: 'i4', skill: 'infer', level: 'C1', point: 'survivor', seg: [180.2, 184.93],
      stem: 'What does the way Rachel is introduced suggest about their school?',
      choices: ['High school was something to get through', 'Rachel once survived a serious accident',
                'Lincoln High was a hard school to get into'], a: 0,
      cue: '名前のあと、学校名に続く一語。',
      line: 'this is Rachel, *another Lincoln High survivor*.',
      said: '「こちらレイチェル。リンカーン高校を生きのびた仲間」と紹介する。',
      mean: 'survivor は冗談。高校時代は「乗り切る」ものだった、という軽い言い方。',
      trap: 'survivor を「事故の生存者」と取りやすい。学校名と並ぶと、大変だった時期を笑う言い方。',
      use: 'Welcome, fellow Monday survivors.（月曜を乗り切った仲間たち、ようこそ）' },

    // R fix: V2 (blind 60 %): "wait for her friends" was weak; it's now a kind offer to wait
    // why: more guests coming ← the question read literally, as if bridesmaids are on their way; offering to wait ←
    //   "or are we waiting" heard as 気遣い, giving her time
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'tellus', reveals: ['bridesmaids'], seg: [200.7, 206.4],
      stem: 'What is Monica doing with her “So you want to tell us now…” question?',
      choices: ['Nudging Rachel to explain, with a joke', 'Asking if more of the wedding party is coming',
                'Kindly offering to wait until she’s ready'], a: 0,
      cue: '「or are we waiting for」のあとの部分。',
      line: 'So you want to tell us now, or are we waiting for *four wet bridesmaids*?',
      said: '「今話す？それとも、ずぶぬれの花嫁付添人4人を待つ？」と聞く。',
      mean: 'ありえない選択肢を並べて、「さあ話して」と軽く促している。',
      trap: '文字通りに取ると、まだ人が来るのかという質問になる。A or B の B が冗談なら、A を促している。',
      use: 'So, are you going to tell me?（で、話してくれるの？どうなの？）' },

    // why: Two ← the weak "for" heard as "to"/"two", and the real number taken as part of "wet"; Five ← "four" + the
    //   "w" of "wet" blur into a longer number
    { id: 'n2', skill: 'number', level: 'B2', point: 'bridesmaids', seg: [200.7, 206.4], keep: true,
      stem: 'How many bridesmaids does Monica joke about waiting for?',
      choices: ['Two', 'Four', 'Five'], a: 1,
      cue: '「waiting」のすぐあと、似た音が2つ続く。',
      line: 'are we waiting *for four* wet bridesmaids?',
      said: '「ずぶぬれの付添人4人を待ってるの？」と冗談を言う。',
      mean: 'for four が「フォフォー」と続く。前の for は弱く、あとの four が強い。',
      trap: '同じ音が2回続くと1回分に聞こえやすい。弱い for と強い four を分けて聞く。',
      use: 'A table for four, please.（4人で、お願いします）' },

    // why: 1 hour ← "a half hour" with a weak "half"; 1½ hours ← "half" and "hour" side by side heard as "an hour
    //   and a half"
    { id: 'n1', skill: 'number', level: 'B1', point: 'halfhour', seg: [208.5, 211.7], keep: true,
      stem: 'How long before the wedding did it start?',
      choices: ['30 minutes', '1 hour', '1½ hours'], a: 0,
      cue: '「about」のあとの時間。',
      line: 'it started *about a half hour* before the wedding',
      said: '「式の30分前くらいに始まったの」と話す。',
      mean: 'a half hour ＝ half an hour ＝ 30分。アメリカ英語に多い語順。',
      trap: 'half と hour が並ぶので「1時間半」と取りやすい。それなら an hour and a half。',
      use: 'I’ll be there in a half hour.（30分で着くよ）' },

    // R fix: V2 (blind 75 %): "one more reason" was weak; it's now a wrap-up reading
    // why: doesn't care ← "anyway" read as "whatever" (どうでもいい); about to wrap up ← "anyway" read as 要するに,
    //   the signal that a story is ending
    { id: 'm1', skill: 'marker', level: 'B2', point: 'anyway', seg: [234.2, 247.3],
      stem: 'After her side comment about Barry, what does her next short word do?',
      choices: ['It brings her back to the main story', 'It shows she doesn’t care about Barry',
                'It shows she’s about to wrap up'], a: 0,
      cue: '笑いのあと、話を立て直す一語。',
      line: '…he looked familiar, but… *Anyway*, I just had to get out of there',
      said: '脱線した冗談のあと、「とにかく、そこから逃げ出さなきゃと思った」と話を戻す。',
      mean: 'anyway ＝ 話を本筋に戻す合図。「それはさておき」。',
      trap: 'anyway を「どうでもいい」と取りやすい。脱線のあとの anyway は、話を戻す働き。',
      use: 'Anyway, where was I?（で、どこまで話したっけ）' },

    // R fix: V2 (blind 50 %): the key was the only gradual choice; "slowly" now appears twice
    // why: suddenly stopped speaking ← "apart" heard as a break-up; slowly moved away ← drift = 漂う, read as physical
    //   distance
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'drifted', seg: [247.35, 252.6],
      stem: 'How does Rachel describe what happened between her and Monica?',
      choices: ['They slowly stopped being close', 'They suddenly stopped speaking', 'They slowly moved further away'],
      a: 0,
      cue: '「you and I have kind of」のあと。',
      line: 'you and I have kind of *drifted apart*',
      said: '「あなたとは少し疎遠だったけど」と前置きする。',
      mean: 'drift apart ＝ けんかでなく、自然と離れていく。kind of でやわらげている。',
      trap: 'apart で「けんか別れ」、drift で「遠くへ引っ越した」と取りやすい。気持ちの距離の話。',
      use: 'We drifted apart after college.（大学のあと疎遠になった）' },

    // R fix: K1/V1: the old key ("the one person not at my wedding") read Monica's cut-in as Rachel's reason. Rewritten
    //   on the same moment: the key is Rachel's own reason, and the old key is now the turn-merge near miss
    // anchor: 252.9–255.6 s "you're the only person I knew who lived here in the city", then a second voice: "who
    //   wasn't invited to the wedding", answered by Rachel's "I was kind of hoping that wouldn't be an issue"
    // why: the one I left out ← Monica's cut-in folded into Rachel's sentence (the turn change missed); the friend
    //   she trusts ← the warm reading ("the only person" heard as "the one I rely on"; sincerity flip)
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'invited', reveals: ['drifted'], seg: [247.35, 260.1],
      stem: 'Which plain-English version keeps why Rachel came to Monica?',
      choices: ['“You were the only one I knew here.”', '“You were the one person I left out.”',
                '“You’re still the friend I trust the most.”'], a: 0,
      cue: '「drifted apart, but」のあと。声が変わる所も。',
      line: 'you’re *the only person I knew who lived here in the city* — Who wasn’t invited to the wedding.',
      said: '「この街の知り合いはあなただけ」と言うと、モニカが「式に呼ばれなかった人ね」と付け足す。',
      mean: '理由は親しさでなく「ほかに知り合いがいない」。式の話はモニカの皮肉な付け足し。',
      trap: '続けて聞くと、式の一言までレイチェルの理由に聞こえる。声が変わったら、話し手が変わったと考える。',
      use: 'You were the only one awake.（起きてたのが君だけだったから電話した）' },

    // R fix: V2 (blind 55 %): "annoyed… still upset" was the odd one out; it's now a milder hurt
    // why: hurt ← "issue" heard as Rachel stung by the remark; relieved ← "wouldn't be an issue" taken literally, as
    //   "it's no problem"
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'issue', reveals: ['invited'], seg: [252.38, 260.1],
      stem: 'How does Rachel feel as she says her last line?',
      choices: ['Embarrassed that it came up', 'Hurt that Monica raised it', 'Relieved that it isn’t a problem'],
      a: 0,
      cue: '「wedding」のあとの返事。kind of の柔らかさ。',
      line: '…who wasn’t invited to the wedding. — Oh, I was *kind of hoping that wouldn’t be an issue*.',
      said: '式に呼ばなかった話になり、「そこは問題にならないといいなと」と言う。',
      mean: '気まずさをごまかす控えめな言い方。',
      trap: 'wouldn’t be an issue を「問題ない」と取ると安心に聞こえる。I was hoping は「〜だといいなと」。',
      use: 'I was hoping you wouldn’t notice.（気づかれないといいなと思ってた）' },
  ]
};
