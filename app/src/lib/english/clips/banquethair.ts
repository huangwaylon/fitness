// REVIEW 2026-11-16: pass 8, fix 15, drop 0, new 0; ear checks 1
// Open: i2's key is still the title's reading (two women… brave about who they are). The new "came without dates"
//   distractor reads the same words another way, but a learner who reads titles may still get it blind.
// Open: who asks "What the hell are you guys doing?" at 253 s isn't in either source. No key depends on it now (g2's
//   distractor was changed), but worth a listen if g2 is rewritten.
// “Two women being brave about who they are | Parks and Recreation” (the official Parks and Recreation channel,
// Season 1): before her mother's banquet Leslie gets a "political haircut" from a famous local barber; at the banquet
// people react to her new look, a former councilman praises her and her friend's "courage", and her friends' practice
// run for a talk with the zoning board turns into a game.
// Segments from the captions, words from whisper (2026-11-16). Whisper has no turn breaks here (long run-on blocks),
// so turns come from the captions' line breaks and the sense; speakers are settled by "Salvatore" (36.2 s), "I'm
// Leslie Knope" (45.8, 120.1 s), "April" (83.3 s), "Ann" (146 s). Untested on purpose: 8–9.4 s ("talent sense", whisper
// "talent since"), 28.4–30.7 s (Larry Bird, world knowledge), 111.7 s (captions "rarefied here", whisper "rarefied
// air"), 152–159 s (who says "black tie"; "my brother('s) she's/he's"), 165–168 s (captions garbled), 182–197 s (a list
// of names), 197–202 s (the Indianapolis line needs world knowledge), 212.9 s (captions "Mark", whisper "Marvin"),
// 215.5 s (a weight joke), 239–251 s (names garbled in both sources).
// Open: i2 is close to the title (two women… brave); its distractors lean on what's said just before, but a blind
//   reader who knows the title may still pick it.
// EAR CHECK: 122.5 s i2 — "I just wanted to tell you… what you two are doing is so brave… I wish I had your courage" is
//   assumed the councilman's (both sources run it on from Leslie's "I am the daughter of the honoree this evening")
import type { Clip } from '../types.ts';

export const banquetHair: Clip = {
  id: 'banquethair', video: 'OB5ZbUHsuPE', title: 'Two women being brave about who they are', dur: 279, wpm: 157,
  band: 'slow', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 % (the only plainly positive choice); now a second positive one that "local" tempts. The
    //   segment starts at 2.0 s so it holds "To the max", which the trap cites
    // why: proud but small ← "local government" heard as her own admission that it's minor; amused ← the over-the-top
    //   comparison heard as sarcasm about a small event
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'hype', seg: [2.0, 13.2],
      stem: 'How does Leslie feel about tonight’s event?',
      choices: ['Thrilled; to her it’s a huge star event', 'Proud, though she admits it’s a small event',
                'Amused that people take it so seriously'], a: 0,
      cue: '「most exclusive」と、そのあとの比べ方。',
      line: 'It is *the most exclusive local government event of the year*… like the *Oscars times the Grammys plus the Super Bowl*.',
      said: '「地方行政で一番格の高い会。アカデミー賞かけるグラミー賞たすスーパーボウル」と言う。',
      mean: '地方の会を世界的なショーに例えるほど、本気で盛り上がっている。',
      trap: '大げさな比べ方は皮肉にも聞こえる。直前の To the max も含め、言葉はすべて上向き。',
      use: 'This party is going to be huge!（このパーティー、すごいことになるよ）' },

    // R fix: S1/V2, blind 55 %: "how dressy" in the stem gave the key. The stem names the moment only, the choices are
    //   three readings of "change", and the segment starts at Leslie's answer
    // why: other plans ← change read as "change plans" (予定を変える); change her mind ← "should probably change"
    //   heard as backing out of an event too grand for her
    { id: 'i1', skill: 'infer', level: 'B2', point: 'change', seg: [2.0, 16.4],
      stem: 'After Leslie describes the event, what does her friend decide to do?',
      choices: ['Change into something dressier', 'Change her plans for tonight', 'Change her mind about going'], a: 0,
      cue: '「Wow, okay」のあとの短い一文。',
      line: 'Wow, okay. Um, I should probably *change*.',
      said: '「わあ、そう。じゃあ着替えたほうがいいかも」と答える。',
      mean: 'change だけで「着替える」。今の服では足りないと思った。',
      trap: 'change を「予定を変える」と取りやすい。格の高い会の話の直後で目的語がなければ、着替え。',

      use: 'Give me a minute to change.（着替えるからちょっと待って）' },

    // why: 1968 ← fifty/sixty blurred; 1985 ← the digits swapped; 1948 ← the middle of the year lost
    { id: 'n1', skill: 'number', level: 'B1', point: 'since', seg: [16.5, 23.5],
      stem: 'Since when has Salvatore been cutting hair in town?',
      choices: ['1948', '1958', '1968', '1985'], a: 1, keep: true,
      cue: '「Pioneer Hall」のあと、年の後半2けた。',
      line: '…has been cutting hair across from Pioneer Hall *since 1958*.',
      said: 'サルヴァトーレは、パイオニア・ホールの向かいで1958年から髪を切っている。',
      mean: '1958 は nineteen fifty-eight と、2けたずつ読む。',
      trap: 'fifty と sixty は語頭の音で決まる。年は前半より後半の2けたに集中する。',
      use: 'This place has been here since 1958.（この店は1958年からある）' },

    // R fix: V2, blind 65 % (two odd fillers); now "on the go" (movers) and "locals for years" (at one point or another)
    // why: on the go ← "movers and shakers" read word by word (動き回る人); locals ← "come through Pawnee… at one point
    //   or another" heard as everyone in town over the years
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'movers', seg: [23.2, 28.2],
      stem: 'Who does Leslie say has sat in Salvatore’s chair?',
      choices: ['Powerful people who get things done', 'Busy people who are always on the go', 'Locals who have lived here for years'],
      a: 0,
      cue: '「all the」に続く、二語の組み合わせ。',
      line: 'All the *movers and shakers* who come through Pawnee have sat in that chair…',
      said: '「パーニーに来た大物は、みんなあの椅子に座った」とカメラに話す。',
      mean: 'movers and shakers ＝ 影響力のある人、物事を動かす人。決まった言い方。',
      trap: 'move（引っ越す）や shake（震える）と一語ずつ訳すと外れる。二語で一つの意味。',
      use: 'She knows all the movers and shakers.（彼女は大物をみんな知っている）' },

    // C2: why it's funny, settled by a later line
    // R fix: V2, blind 60 % (the teasing filler); now "a movie line": the right mechanism, the wrong source
    // why: heard it before ← "classic" read as "typical of him", which assumes she knows him; movie line ← "classic"
    //   heard as a classic film quote (right mechanism, wrong target: "Classic Salvatore" makes it his own)
    // anchor: 38.6 s "Classic Salvatore", then 40.4–42.5 s "Do I know you? — Uh, no.": she has never met him, so
    //   "classic" is a fan's pose
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'classic', seg: [33.8, 47.8],
      stem: 'Why is Leslie’s reaction to “My feet hurt” funny?',
      choices: ['She treats a plain complaint as a famous line', 'She has heard him say it on many past visits',
                'She thinks he is quoting a line from a movie'], a: 0,
      cue: '彼女の一言のあと、彼の質問とその答え。',
      line: 'My feet hurt. — *Classic Salvatore*. — *Do I know you?* — Uh, *no*.',
      said: '「裏話は？」に「足が痛い」。「さすがサルヴァトーレ」と返すと、「知り合い？」「いいえ」。',
      mean: '初対面なのに「いつもの名言」扱い。ただの愚痴を伝説の一言にするファン心理。',
      trap: 'classic を「彼らしい」と取ると昔なじみに聞こえる。Do I know you? への答えで初対面と分かる。',
      use: 'Late again? Classic Dave.（また遅刻？さすがデイブ）' },

    // R fix: V2, blind 55 %; "both being honored" now takes "I am also being honored" literally, with the mother kept
    // why: both honored ← "in a way I am also being honored" taken literally, "in a way" lost; mayor ← her "first
    //   official political haircut" heard as the start of a campaign
    { id: 'g1', skill: 'gist', level: 'B2', point: 'honor', reveals: ['mother'], seg: [48.2, 72.0],
      stem: 'Why does tonight matter so much to Leslie?',
      choices: ['Her mother is being honored at the event', 'She and her mother are both being honored',
                'She plans to announce a run for mayor'], a: 0,
      cue: '「my mom」に続く部分と、その次の so。',
      line: 'my mom is being honored tonight, so *in a way I am also being honored*…',
      said: '母が今夜表彰されるので、「ある意味、私も表彰される」と言う。',
      mean: '主役は母。娘として、自分も光を浴びる気分でいる。',
      trap: 'I am also being honored を文字通り取ると受賞者になる。in a way（ある意味）が付いている。',
      use: 'In a way, it’s my night too.（ある意味、私の夜でもある）' },

    // R fix: V2, blind 70 %: "How is Leslie related" presupposed a family tie. The stem is neutral now, and the
    //   distractors build on "Nope" and "that depends"
    // why: never met ← the first word "Nope" taken as the answer; works with ← "that depends" heard as "only through
    //   work", the "her daughter" after it lost
    { id: 'd1', skill: 'detail', level: 'B2', point: 'mother', seg: [48.2, 57.4],
      stem: 'What does Leslie tell Salvatore about the Marlene he mentions?',
      choices: ['That Marlene is her mother', 'That she has never met her', 'That she only works with her'], a: 0,
      cue: '最初の一語で止めず、そのあとの問い返しまで。',
      line: 'Nope — that depends. Would you call being *her daughter* related?',
      said: '「いいえ。…まあ、娘であることを親戚と呼ぶなら」と言い直す。',
      mean: '最初の Nope はすぐ取り消され、実は娘だと遠回しに認めている。',
      trap: '最初の一語で決めやすい。that depends のように言い直しが来たら、後ろが本当の答え。',
      use: 'That depends on what you mean.（それは意味によるね）' },

    // why: impressed ← "her daughter" heard as big news (Marlene is being honored); confused ← "that Marlene something"
    //   earlier, as if he doesn't know who she is
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'whatelse', reveals: ['mother'], seg: [52.4, 57.6],
      stem: 'How does Salvatore react to Leslie’s answer about Marlene?',
      choices: ['Irritated by her roundabout way of saying it', 'Impressed to learn whose daughter she is',
                'Confused about which Marlene she means'], a: 0,
      cue: '彼女の問い返しへの、短い返事の出だし。',
      line: '*What the hell else would you call it?*',
      said: '「娘が親戚じゃなきゃ、何だって言うんだ」と返す。',
      mean: 'what the hell else ＝ ほかに何がある。遠回しな言い方にいら立っている。',
      trap: '有名人の娘と知って驚いたとも取れるが、返事は答え方への文句。the hell は不満の強め。',
      use: 'What else would you call it?（ほかに何て言うの？）' },

    // why: did ← do and did both shrink to "d'"; would ← "wudja" against "whaddaya"; what you want ← "do" dropped
    //   altogether
    { id: 's1', skill: 'sound', level: 'C1', point: 'wantme', seg: [57.3, 60.3],
      stem: 'Fill the gap: “Now, ___ me to do with this?”',
      choices: ['what do you want', 'what did you want', 'what would you want', 'what you want'], a: 0,
      cue: '「Now」のあと、速く縮んだ問いの出だし。',
      line: 'Now, *what do you want* me to do with this?',
      said: '髪を見ながら「で、これをどうしてほしい？」と聞く。',
      mean: 'what do you want が「ワダヤワン」のように縮む。do はほぼ「ダ」。',
      trap: 'did なら過去の話になる。これからの注文なので現在形。縮んだ音は場面の時で決める。',
      use: 'What do you want me to do?（どうしてほしい？）' },

    // why: two styles ← mix read literally (混ぜる); simple ← "a little bit" heard as "keep it small"
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'mixup', seg: [60.0, 71.6],
      stem: 'What kind of haircut does Leslie ask Salvatore for?',
      choices: ['Something different from her usual look', 'A mix of two different hairstyles',
                'Something simple that won’t stand out'], a: 0,
      cue: '「I just wanted to」に続く句。',
      line: 'I just wanted to *mix things up* a little bit… something *sassy but powerful* and dynastic.',
      said: '「ちょっと変化をつけたくて。生意気だけど力強くて、名家っぽいのを」と頼む。',
      mean: 'mix things up ＝ いつもと変える。特別な夜に、新しい自分を見せたい。',
      trap: 'mix を「混ぜる」と取りやすい。things up と組むと「変化をつける」。',
      use: 'Let’s mix things up this weekend.（今週末はいつもと変えよう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'pin', seg: [64.8, 68.6],
      stem: 'Type what Leslie suggests: “you know, ___, something sassy” (3 words)', answer: 'pin it up',
      cue: '「you know」のあと、短い3語。',
      line: 'you know, *pin it up*, something sassy…',
      said: '「ほら、上でまとめるとか、生意気な感じに」と例を出す。',
      mean: 'pin it up ＝ 髪をピンで上げる。三語が「ピニラップ」とつながる。',
      trap: 'it の t が弾んで「ラ」に近くなり、一語に聞こえやすい。動詞＋it＋up の形を思い出す。',
      use: 'Should I pin it up?（髪、上げたほうがいい？）' },

    // R fix: V2, blind 50 % (the key alone named the dig); now two "takes sir as…" choices, wrong in one way each
    // why: in on it ← Leslie heard as joking back about her own hair (sincerity flip); snaps back ← "you don't need to
    //   call me sir" heard as a sharp reply to the dig, not a friendly one about work hours
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sir', reveals: ['wow'], seg: [79.6, 84.5],
      stem: 'Why is Leslie’s reply to April’s greeting funny?',
      choices: ['She takes “sir” as work manners, missing the dig', 'She jokes back at April about the new hair',
                'She takes “sir” as a dig and snaps back at her'], a: 0,
      cue: '「off the clock」が、何の話だと思っているか。',
      line: 'Good evening, *sir*. — Oh, I’m *off the clock*, April. You don’t need to call me sir.',
      said: '「こんばんは、サー」に、「今は勤務外だから、サーはいらない」と返す。',
      mean: '女性に sir は髪型へのからかい。彼女は職場の敬語と受け取り、気づいていない。',
      trap: '本人も分かって返したとも取れるが、off the clock は仕事の話。このずれが笑い。',
      use: 'I’m off the clock.（今は勤務時間外です）' },

    // why: only tonight ← the honoree's night is the topic; until the election ← "mayor" heard with an election in view
    { id: 'd2', skill: 'detail', level: 'B1', point: 'mayor', seg: [84.3, 91.9],
      stem: 'When does Leslie tell the camera she’ll wear her hair like this?',
      choices: ['When she’s the town’s first woman mayor', 'On special nights that honor her mother',
                'Every day until the next city election'], a: 0,
      cue: '「and yes」のあと、条件を表す部分。',
      line: 'Salvatore calls this hairdo *the mayor*. And yes, I will wear my hair like this *when I’m the first female mayor* of Pawnee.',
      said: '「この髪型の名は『市長』。初の女性市長になったら、この髪にする」と話す。',
      mean: 'first female mayor ＝ 初の女性市長。髪型の名前を自分の夢に重ねる。',
      trap: '今夜は母の会なので「特別な夜だけ」と取りやすい。when の後ろが条件を決める。',
      use: 'When I’m rich, I’ll buy a boat.（お金持ちになったら船を買う）' },

    // R fix: V2, blind 55 % (the complaint filler); now "in the mood to party", which "overdressed… everyone's looking
    //   at us" refutes, so the segment now starts at "I'm way overdressed"
    // why: polite ← "Yes, I do" heard as the polite yes (遠慮 frame); party mood ← the extra "very much" heard as
    //   excitement, the unease just before lost
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'drink', seg: [94.3, 104.9],
      stem: 'When Leslie offers a drink, how does her friend’s answer come across?',
      choices: ['As if she badly needs one right now', 'As a polite yes, though she isn’t keen',
                'As a sign she’s in the mood to party'], a: 0,
      cue: '「Yes, I do」のあとの付け足し。',
      line: 'You want a drink? — Yes, I do. *Very much*…',
      said: '「飲む？」に「ええ。とっても飲みたい」と念を押す。',
      mean: '強い付け足しは、落ち着かない場で一息つきたいから。みんなの視線が気になっている。',
      trap: '礼儀の「いただきます」と取りやすい。very much の付け足しが本音を示す。',
      use: 'I could really use a drink.（一杯やりたい気分）' },

    // R fix: V2/S1, blind 60 %: "naming the man" hinted at an important person. The stem now points at the phrase,
    //   with the key word left out, and the far-seats filler is now an "atmosphere" reading of air
    // why: stuffy ← "rarefied air" read literally (thin air); stiff mood ← "air" taken as 雰囲気, the room's feel
    { id: 'f5', skill: 'phrase', level: 'C1', point: 'rarefied', seg: [104.9, 111.6],
      stem: 'What does Leslie mean when she says they’re “in … air tonight”?',
      choices: ['They’re among very important people', 'The room is getting hot and stuffy',
                'The mood in the room is stiff and formal'], a: 0,
      cue: '名前のあと「we are in」に続く語。',
      line: 'That’s former city councilman Frank Schnabel. Oh, we are in *rarefied air* tonight.',
      said: '「元市議のフランク・シュナベルよ。今夜は雲の上の世界ね」と言う。',
      mean: 'rarefied air ＝ 本来は高い所の薄い空気。転じて、選ばれた人だけの世界。',
      trap: '文字通り「空気が薄い」と取りやすい。直前に大物の名前があれば、格の高さの話。',
      use: 'We’re in rarefied air tonight.（今夜は特別な人ばかりだね）' },

    // R fix: V2, blind 55 %; the park filler is now "came without dates", a reading of "being who you are" for two
    //   women at a gala. The title still points at the key (see Open)
    // why: her mother ← "the daughter of the honoree" just before, so "brave" heard as following Marlene; no dates ←
    //   "brave… being who you are" heard as two single women coming on their own (一人で来る勇気)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'brave', seg: [118.2, 132.2],
      stem: 'When the councilman praises “what you two are doing”, what is he assuming?',
      choices: ['That Leslie and her friend are a couple', 'That Leslie dares to follow her mother',
                'That the two came without dates on purpose'], a: 0,
      cue: '「you two」と「courage」の組み合わせ。',

      line: 'what *you two* are doing is so brave. And just *being who you are*. I wish I had your courage.',
      said: '元市議が「君たちは勇敢だ。ありのままでいる勇気がうらやましい」と言う。',
      mean: '自分らしく生きる人への決まった励まし。二人を恋人同士だと思っている。',
      trap: '直前の「表彰される人の娘」から母の話と取りやすいが、you two で二人のこと。',
      use: 'Just be who you are.（ありのままでいて）' },

    // C2: what the reply says, set against the compliment before it
    // R fix: V2, blind 55 % (the "surprise she came" filler); now a second "shock" choice, wrong only in saying it aloud
    // why: higher praise ← "wow" taken at face value, a step up from "stunning" (Leslie's own reading); says it's a
    //   mistake ← the shock heard, but the holding back missed (he says only "wow" and "You got it")
    // anchor: 144.8–148.2 s "you look stunning. But Leslie… wow": the "but" sets the wow against the compliment;
    //   150–151.7 s "I was going for wow. — You got it."
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'wow', seg: [139.5, 152.2],
      stem: 'After praising her friend’s look, what does the coworker’s “wow” for Leslie mean?',
      choices: ['Shock at her look, kept short on purpose', 'Even higher praise than he gave her friend',
                'Shock at her look, and he says it’s a mistake'], a: 0,
      cue: '「stunning」のあとの but と、そのあとの間。',
      line: 'I mean, Ann, you look *stunning*. *But* Leslie… wow. — I was going for wow. — You got it.',
      said: '「アン、すごくきれいだ。でもレスリー…ワオ」。彼女は「ワオを狙ったの」、彼は「達成だね」。',
      mean: 'but がほめ言葉と対比させるので、wow はほめていない。彼女はほめ言葉と受け取り、彼はそのまま流す。',
      trap: 'wow を最上級のほめ言葉と取りやすい。ほめたあとの but は、反対向きの合図。',
      use: 'The cake looks great. But the frosting… wow.（ケーキは素敵。でもクリームが…すごいね）' },

    // why: accepts ← "Oh, thanks" heard as a yes; asks ← the item named as a question
    { id: 'pr1', skill: 'pragma', level: 'B1', point: 'imokay', seg: [160.5, 164.8],
      stem: 'When the shrimp comes by, what does Leslie’s first reply do?',
      choices: ['Politely turns it down', 'Happily accepts one', 'Asks what is in it'], a: 0,
      cue: '「thanks」のあとの二語。',
      line: 'Oh, thanks, *I’m okay*. — I wasn’t offering.',
      said: '「ありがとう、でも結構です」と断るが、「勧めてないよ」と返される。',
      mean: 'I’m okay ＝「私は大丈夫」＝ いりません。thanks が付いても断り。',
      trap: 'thanks から受け取ると思いやすい。I’m okay は丁寧な「結構です」。',
      use: 'I’m good, thanks.（大丈夫です、ありがとう）' },

    // R fix: V2, blind 55 % (the thank-you filler); now a wrong-direction rezoning choice
    // why: keep from rezoning ← "rezone" and "park" caught, the direction lost; join the board ← "she's on the zoning
    //   board" heard as an invitation
    { id: 'd3', skill: 'detail', level: 'B1', point: 'rezone', seg: [168.6, 174.8],
      stem: 'Why does Leslie want to talk to Janine Restrepo?',
      choices: ['To get the pit rezoned as a park', 'To keep the board from rezoning the pit', 'To ask her to join the zoning board'],
      a: 0,
      cue: '「we need to」に続く部分。',
      line: 'We need to *rezone the pit* to turn it into a park, and she’s on the zoning board.',
      said: '「穴の土地を公園にするには用途変更が必要で、彼女は委員」と説明する。',
      mean: 'rezone ＝ 土地の使い道の区分を変える。その権限を持つ人に頼みたい。',
      trap: 'zoning board から誘う話と取りやすいが、on the board ＝ もう委員。',
      use: 'I need to talk to the manager.（責任者と話したいのですが）' },

    // why: eighteen / eighty ← -teen/-ty against a bare "eight"; four ← a smaller round number
    { id: 'n2', skill: 'number', level: 'B1', point: 'eight', seg: [176.7, 182.0],
      stem: 'How many living award winners does Leslie say are at that table?',
      choices: ['Four', 'Eight', 'Eighteen', 'Eighty'], a: 1, keep: true,
      cue: '「at that table are all」のあとの数。',
      line: 'At that table are *all eight living* Talent and Award winners.',
      said: '「あのテーブルに、存命の受賞者8人が全員いる」と興奮する。',
      mean: 'all eight living ＝ 存命の8人全員。',
      trap: 'eight に living が続き、eighteen に聞こえやすい。-teen なら語尾が長く強い。',
      use: 'All four of us are here.（4人全員そろったよ）' },

    // R fix: K2, "Janine overhears it and comes over" can't be refuted from the words: neither source says who asks
    //   "What the hell are you guys doing?" at 253 s. It's now "Leslie leaves to talk to Janine", which the game refutes
    // why: goes to Janine ← "she's right behind us" and "just go up there and say hello"; ready ← "Hello, Madam Zoning
    //   Board member… I am Leslie Knope" heard as a pitch that went well
    { id: 'g2', skill: 'gist', level: 'B2', point: 'roleplay', seg: [203.2, 258.0],
      stem: 'How does the practice for Leslie’s zoning talk turn out?',
      choices: ['Her friends all play big shots, and it gets silly', 'Leslie leaves to go and talk to Janine herself',
                'Leslie gets her pitch right and feels ready'], a: 0,
      cue: '彼女の案のあと、次々に名乗る人たち。',
      line: '…and I have *more power than* Janine Restrepo, so I can do whatever I want.',
      said: '友人たちが委員や元市議になりきり、「もっと権力がある」と張り合って、練習は崩れる。',
      mean: '真面目な練習のはずが、偉い人ごっこの遊びになった。',
      trap: 'Janine の名前が何度も出るので本人と話したと思いやすいが、全員が演じている。',
      use: 'Let’s practice. I’ll be the customer.（練習しよう。私が客役ね）' },

    // R fix: V2, blind 50 % (the only negative); now a second negative, "too rude", from the Japanese frame
    // why: praise ← "brilliant" taken at face value; rude ← walking straight up to a board member heard as bad manners
    //   (いきなり話しかけるのは失礼), though "political strategy" is about tactics
    { id: 'a4', skill: 'attitude', level: 'B2', point: 'strategy', reveals: ['overthink'], seg: [208.8, 217.4],
      stem: 'What does Leslie think of the advice to just go up and say hello?',
      choices: ['It’s far too simple to work', 'It’s a smart, clear plan', 'It’s too rude to just walk up'], a: 0,
      cue: '「brilliant」のあと、彼女が足す案。',
      line: 'just go up there and say hello… — *Brilliant political strategy*… Maybe I should mention…',
      said: '「行って挨拶すれば」に「見事な政治戦略ね」と返し、別の手を考える。',
      mean: 'brilliant は皮肉。単純すぎると思い、もっと手の込んだ切り出し方を探す。',
      trap: 'brilliant をそのままほめ言葉と取りやすい。すぐ別の案を出すなら皮肉の合図。',
      use: 'Brilliant idea. Really.（すばらしい案だね。ほんとに）' },

    // R fix: V2, blind 70 % (the "too loudly" filler); now a mirror "easier than it is" that "over-" settles
    // why: not enough ← "over-" missed, "thinking" heard as "think it through"; easier ← the friend's own "just go up
    //   and say hello" heard as what Leslie is doing
    { id: 'f6', skill: 'phrase', level: 'B1', point: 'overthink', seg: [213.8, 217.6],
      stem: 'What does her friend say Leslie is doing about the zoning talk?',
      choices: ['Making it harder than it is', 'Not thinking it through enough', 'Making it sound easier than it is'], a: 0,

      cue: '話題選びの案への、すぐの返事。',
      line: 'You’re *overthinking* this.',
      said: '話題選びに悩む彼女に、「考えすぎだよ」と言う。',
      mean: 'overthink ＝ 考えすぎる。over- は「〜しすぎ」。',
      trap: 'over が弱く thinking だけ残ると「よく考えて」に聞こえる。over- は「しすぎ」。',
      use: 'Don’t overthink it.（考えすぎないで）' },
  ]
};
