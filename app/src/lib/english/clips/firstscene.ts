// “The First Scene Ever | Parks and Recreation” (the official Parks and Recreation channel, Season 1): Leslie runs a
// park survey, coaxes a drunk out of a children's slide, and tells the camera how much her government job matters and
// how far she plans to go.
// Segments from the captions, words from whisper (2026-11-16). Leslie names herself at 6.7 s. Who reports the slide is
// unclear (whisper "Miss Knope, there's a drunk…", captions "it's no there's a drunk…"), so no item names them or
// keys on those words. Whisper's "Okay, please go away" (56 s) isn't in the captions and isn't used. The list of
// politicians (66–70 s) is used only for the self-inclusion joke; no item needs to know who they are.
// EAR CHECK: 52.6 s s1 — “We’re gonna need you to” runs together (gonna ≈ ガナ, need you ≈ ニージュ); both sources agree on the words
// EAR CHECK: 42.5 s x2 — “need our help” links into ニーダワ; both sources agree on the words
// REVIEW 2026-11-16: pass 4, fix 16, drop 1, new 1; ear checks 2
// REVIEW open: none
import type { Clip } from '../types.ts';

export const firstScene: Clip = {
  id: 'firstscene', video: 'THPw7kGe8BY', title: 'The First Scene Ever', dur: 97, wpm: 157, band: 'mid',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 70 % (V2): the key was the only upbeat choice, and "its future" gave away i2's career reading;
    //   now a second positive distractor, and the key reveals nothing about the ride
    // why: unfair to workers ← the DMV complaints take up a whole stretch (keyword); old job ← "now things have
    //   changed" heard as her leaving a job she disliked
    { id: 'g1', skill: 'gist', level: 'B1', point: 'mission', reveals: ['stinks', 'needed'], seg: [0, 86],
      stem: 'What do Leslie’s comments to the camera keep coming back to?',
      choices: ['How much she believes in her job and herself', 'How unfair people are to those in government',
                'How glad she is to be done with her old job'], a: 0,
      cue: 'カメラに向かって話す3つの場面の共通点。',
      said: '役所の仕事は今や必要とされている、女性の時代だ、私は止まらない、とカメラに語る。',
      mean: '自分の仕事への誇りと、大きな将来への自信が全体を通したテーマ。',
      trap: '悪口は人に言われる話の前置き。things have changed も転職でなく周りの変化。',
      use: 'I really believe in what I do.（自分の仕事に誇りを持っています）' },

    // R fix: blind 60 % (V2): "moderate" was the only middle-of-the-scale choice; now three middle words, told apart
    //   by sound. "a lot of fun" is no longer a choice, so the `put` reveal goes.
    // why: modest ← near sound (mo-d-), same idea; medium ← the katakana word for 真ん中 a listener fills in
    { id: 'd1', skill: 'detail', level: 'B1', point: 'moderate', seg: [12.2, 23.2],
      stem: 'In Leslie’s survey question, what is the second of the three options?',
      choices: ['A moderate amount of fun', 'A modest amount of fun', 'A medium amount of fun'], a: 0,
      cue: '2つ目の having のあと。',
      line: 'having a *moderate amount of fun* and somewhat enjoying yourself',
      said: '「楽しんでいる」「そこそこ楽しんでいる」「まったく楽しくない」の3択で聞く。',
      mean: 'moderate ＝ ほどほどの、適度な。真ん中の選択肢。',
      trap: 'modest も medium も意味は近く、真ん中と分かると推測で埋めやすい。mo のあとの音まで聞く。',
      use: 'I’d like a moderate amount of ice.（氷は少なめ…いや、ほどほどで）' },

    // R fix: blind 65 % (V2, S1): "the way she words" pointed at the careful wording; the stem now names the moment
    //   only, and the choices are reworded in parallel. Its trap says she writes the answer down, so it reveals `put`.
    // why: bored ← a survey read off a form sounds routine; playful ← the wording is funny, so she seems to be joking
    { id: 't3', skill: 'attitude', level: 'C1', point: 'survey', reveals: ['moderate', 'put'], seg: [12.2, 27],
      stem: 'How does Leslie come across while asking her survey question?',
      choices: ['Earnest, measuring fun in official terms', 'Bored, reading out a form she knows by heart',
                'Playful, poking fun at her own survey'], a: 0,
      cue: '3つの選択肢の言い方の細かさ。',
      line: 'having a *moderate amount of fun* and *somewhat enjoying* yourself, or having no fun and no enjoyment?',
      said: '「楽しさ」を3段階に分け、一つ一つきっちりと読み上げる。',
      mean: '遊びの場での「楽しさ」まで役所の言葉で測ろうとする、まじめすぎる人物像が見える。',
      trap: '言い回しがおかしいので冗談に聞こえやすいが、本人は真剣。すぐに答えを書いている。',
      use: 'On a scale of one to five?（5段階で言うと？）' },

    // R fix: blind 50 % (V2): "next park event" was a filler; now put = 置く read as setting it aside
    // why: set aside ← put read as 置く (put aside); fourth option ← she seems to add to her list
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'put', seg: [21.5, 26.5],
      stem: 'When Leslie finishes asking, what is she doing with “a lot of fun”?',
      choices: ['Writing it down as the answer', 'Setting it aside for a later question', 'Adding it as a fourth option'],
      a: 0,
      cue: '最後の文の、gonna のあとの短い動詞。',
      line: 'I’m gonna *put* a lot of fun.',
      said: '質問を終えると「a lot of fun と書いておくね」と言う。',
      mean: 'put ＝ ここでは「（用紙に）書く」。Put your name here. と同じ。',
      trap: 'put を「置く・加える」と取ると、選択肢を増やす話に聞こえる。用紙なら「書く」。',
      use: 'What should I put for my address?（住所の欄には何て書けばいい？）' },

    // R fix: K1/V1: "talks the man out" claimed an outcome the audio never gives (the clip moves on before he does);
    //   the key is now what she does, and the distractors are reworded to match
    // why: calls someone ← "we're gonna need you to" sounds like bringing in help; lets him rest ← the long, soft
    //   requests sound like she gives up
    { id: 'g2', skill: 'gist', level: 'B2', point: 'handle', reveals: ['slide', 'asleep', 'gentle', 'gonna'], seg: [26, 59.1],
      stem: 'How does the problem reported in the park get handled?',
      choices: ['Leslie asks him to leave, more firmly each time', 'Leslie calls in someone else to move him',
                'Leslie lets him rest until he wakes up'], a: 0,
      cue: '頼み方が、問いかけから少しずつ変わるところ。',
      said: '寝ている男に、腕を横に、こっちへ来る？、出てもらいます、起きて、と順に頼む。',
      mean: '自分一人で、やわらかい頼みから少しずつ強めて外へ出そうとする。',
      trap: 'gonna need you to は「人を呼ぶ」でなく「あなたに〜してもらう」。誰も呼んでいない。',
      use: 'Let’s take it one step at a time.（一歩ずつやっていこう）' },

    // R fix: blind 50 % (V2): two choices said "drunk man"; now drunk/truck (d–t, the n lost) as the near sound
    // why: a child stuck ← "children's slide" comes right after (keyword); truck ← "drunk" heard as truck
    { id: 'd2', skill: 'detail', level: 'B1', point: 'slide', seg: [26.2, 30.6],
      stem: 'What problem is reported to Leslie in the park?',
      choices: ['A drunk man is stuck in a slide', 'A child is stuck at the top of a slide',
                'A truck is stuck next to the slide'], a: 0,
      cue: 'there’s a のあとの2語。',
      line: 'there’s *a drunk stuck in the slide*.',
      said: '「酔っぱらいが滑り台に挟まっている」と知らせが来る。',
      mean: 'a drunk ＝ 酔っぱらい（名詞）。stuck ＝ 動けなくなっている。',
      trap: 'children’s slide で子どもの話に、drunk を truck と聞いて車の話にしやすい。',
      use: 'My card is stuck in the machine.（カードが機械に詰まりました）' },

    // why: with a child ← "children's slide" heard as a question about who he came with; unsafe ← a rule heard as a
    //   safety warning
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'allowed', reveals: ['slide', 'asleep'], seg: [29.4, 34.2],
      stem: 'When Leslie first speaks to the man in the slide, what is she doing?',
      choices: ['Telling him he has to get out', 'Asking him if he came with a child', 'Warning him the slide is unsafe'],
      a: 0,
      cue: 'Sir のあとの2文が、どんな事実を言っているか。',
      line: 'Sir, this is a *children’s slide*. You’re *not allowed* to sleep in here.',
      said: '「ここは子ども用の滑り台です。ここで寝てはいけません」と伝える。',
      mean: '決まりを言うだけで「出てください」の意味になる。命令を和らげる言い方。',
      trap: '事実を述べる文は情報に聞こえやすい。規則を相手に言うときは「やめて・出て」の合図。',
      use: 'Sir, this is a no-smoking area.（すみません、ここは禁煙です）' },

    // R drop: d3 (V1): "the lines at the DMV are too long" is the stock complaint, so world knowledge answers it
    //   (blind 70 %), and any same-shaped rewrite stays guessable. Replaced by d5 (R new).

    // R fix: blind 55 % (V2): the coworkers choice had no hook in the audio; now "when I first" heard as her first day
    // why: her own past view ← "but now things have changed" sounds as if she used to think so; her boss ← "when I
    //   first" heard as her first day at work, when someone told her this
    // anchor: 34–38.5 s "when I first tell people… they say" frames the quote; "Oh, the government" is spoken as someone else
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'stinks', seg: [33.6, 42.4],
      stem: 'When Leslie says the government stinks, whose view is she giving?',
      choices: ['Other people’s, acted out in their voice', 'Her own, from before things changed for her',
                'Her boss’s, from her first day on the job'], a: 0,
      cue: 'stinks の前の「they say」と、その前の文。',
      line: 'when I first tell people… *they say*, “Oh, the government. The government *stinks*.”',
      said: '「役所で働いていると言うと、みんな『役所なんてダメだ』と言う」と、他人の口ぶりをまねる。',
      mean: 'they say のあとは引用。英会話では、他人のせりふを声色ごとまねてよく話す。本人の意見でない。',
      trap: '「でも今は変わった」と続くので、昔の自分の考えと取りやすい。変わったのは人々の必要のほう。',
      use: 'And they’re like, “Why are you so late?”（で、みんな「なんで遅いの？」って感じ）', retired: true },

    // why: thanked ← the upbeat tone heard as gratitude she gets (nobody thanks her); hurt ← the complaints just
    //   before still in the air
    { id: 't1', skill: 'attitude', level: 'B1', point: 'needed', seg: [39.9, 46.4],
      stem: 'How does Leslie say she feels about her work now?',
      choices: ['Glad that people rely on her now', 'Proud that people finally thank her',
                'Hurt that people still complain'], a: 0,
      cue: '最後の文の、feels のあと。',
      line: 'And it *feels good to be needed*.',
      said: '「今は人々が助けを必要としていて、必要とされるのは気分がいい」と話す。',
      mean: 'be needed ＝ 必要とされる。仕事のやりがいを素直に語っている。',
      trap: '前の悪口が残ると傷ついて聞こえ、前向きなら感謝と取りやすい。言うのは「必要とされる」喜び。',
      use: 'It feels good to help out.（手伝えるのはうれしい）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'needhelp', seg: [40.2, 46.4],
      stem: 'Type what Leslie says: “People ___.” (3 words)', answer: 'need our help',
      cue: '「things have changed」のすぐあと。',
      line: 'But now things have changed. People *need our help*.',
      said: '「でも今は変わった。人々は私たちの助けを必要としている」。',
      mean: 'need our がつながって「ニーダワ」のように聞こえる。our は弱く短い。',
      trap: 'our が消えて need help に聞こえやすい。つながった音の中に小さい語がないか確かめる。',
      use: 'Do you need any help?（何か手伝おうか？）' },

    // R fix: blind 55 % (V2): "tired of being needed" had nothing to stand on; now a "harder than it sounds" reading
    // why: helps a lot ← the sincere reading: park visitors really do depend on her; warning ← the trouble right after
    //   "good to be needed" heard as the hard side of the job
    // anchor: 40–46 s "People need our help… it feels good to be needed", then 45.9–59 s the help is talking a drunk
    //   out of a children's slide
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'helpjoke', reveals: ['needed', 'needhelp', 'asleep', 'gentle', 'gonna', 'slide'],
      seg: [40.2, 59.1],
      stem: 'After Leslie’s comment to the camera about her work, how does the slide scene land?',
      choices: ['As a joke on her: the “help” is moving a drunk', 'As proof: park visitors really do depend on her',
                'As a warning: the job is harder than it sounds'], a: 0,
      cue: '「必要とされる」の直後に何を手伝っているか。',
      line: 'People *need our help*. And it feels good to be needed. … *we’re gonna need you to get out*.',
      said: '「人々が助けを必要としている」と語った直後、滑り台で寝る酔っぱらいを外へ出そうとする場面になる。',
      mean: 'カメラへの立派な言葉を、すぐ次の場面が小さくする。編集で作る笑い。本人は大まじめ。',
      trap: '言葉どおり「役に立っている証拠」と取りやすい。この形式では、言葉と場面の差が笑いどころ。',
      use: 'Big plans, small start.（大きな夢、小さな一歩）', retired: true },

    // why: hold the sides ← "side" heard with "slide"; over his head ← the usual way down a slide headfirst
    { id: 'd4', skill: 'detail', level: 'B1', point: 'arms', seg: [45.4, 50.4],
      stem: 'What does Leslie first ask the man to do with his arms?',
      choices: ['Put them down at his sides', 'Hold on to the sides of the slide', 'Put them up over his head'], a: 0,
      cue: '最初の Could you のあと。',
      line: 'Could you put your *arms to your side*?',
      said: '「腕を体の横につけてもらえますか？そうすれば滑り降りやすいかも」と頼む。',
      mean: 'to your side ＝ 体の横に。気をつけの姿勢。',
      trap: 'side と slide が近くに出るので、滑り台の縁をつかむ話に聞こえやすい。your side は体の横。',
      use: 'Keep your arms at your sides.（腕は体の横に）' },

    // R fix: K1: "first try" also fits p1's "this is a children's slide" (29.9 s), and "first" hinted at a soft-then-hard
    //   order; the stem now names the moment
    // why: firmly ← "we're gonna need you to get out" comes a few seconds later; call him a ride ← "come this way"
    //   heard as an offer to take him somewhere
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'gentle', reveals: ['arms'], seg: [45.4, 51.7],
      stem: 'Back at the slide after the camera, how does Leslie ask the man?',
      choices: ['Gently, with suggestions and questions', 'Firmly, with an order to get out now',
                'Kindly, with an offer to call him a ride'], a: 0,
      cue: 'Could you、might、Do you want の形。',
      line: 'Could you…? And that *might help* you slide down a little easier? *Do you want* to come this way?',
      said: '「〜してもらえますか」「楽かも」「こっちに来ます？」と、問いかけを重ねる。',
      mean: 'might や Do you want…? は、命令を提案の形にやわらげる。',
      trap: 'このあと get out と強めるので、最初から命令と覚えやすい。最初は問いかけだけ。',
      use: 'Do you want to sit over here?（こちらに座りますか？）' },

    // R fix: blind 50 % (V2): "keep arguing" had no hook; now "stuck" (said at 28.9 s) as the keyword trap
    // why: pretending ← the man never speaks, so he might be ignoring her; stuck ← the report said "stuck in the slide"
    { id: 'i1', skill: 'infer', level: 'B2', point: 'asleep', seg: [45.4, 59.1],
      stem: 'What do Leslie’s last words to the man suggest about him?',
      choices: ['He has slept through her requests', 'He is pretending not to hear her',
                'He is stuck and can’t get himself out'], a: 0,
      cue: '最後の Okay のあとの2語。',
      line: 'Okay, *wake up*. Here we go. Out of the slide.',
      said: '何度頼んでも動かず、最後に「起きて、さあ、滑り台から出て」と言う。',
      mean: 'wake up と言う以上、相手は眠ったまま。ここまでの頼みは聞こえていなかった。',
      trap: '返事がないと無視に、stuck から挟まったままに聞こえやすい。最後の一言が状態を言う。',
      use: 'Wake up, we’re here.（起きて、着いたよ）' },

    // R fix: blind 75 % (V2): two choices didn't fit the scene (leave you to / don't need you to); now three natural
    //   requests told apart only by the weak words
    // why: we'll ← "we're gonna" squashed into one weak syllable; just ← ガナ heard as ジャス, both short and unstressed
    { id: 's1', skill: 'sound', level: 'B2', point: 'gonna', seg: [50.55, 54.7],
      stem: 'Fill the gap: “Okay, ___ get out.”',
      choices: ['we’re gonna need you to', 'we’ll need you to', 'we just need you to'], a: 0,
      cue: 'Okay のあと、速くつながる部分。',
      line: 'Okay, *we’re gonna need you to* get out.',
      said: '「出てもらう必要があります」と一段強める。',
      mean: '「ウィアガナニージュトゥ」と一続き。丁寧だが断れない言い方。',
      trap: 'gonna は弱く速いので we’ll や just に聞こえがち。need の前の音節の数を数える。',
      use: 'I’m gonna need you to sign here.（こちらにサインをお願いします）' },

    // R fix: blind 75 % (V2): "a hobby" broke the parallel (the others are groups of people); now "rich people" from
    //   club as a members' club. h1's stem ("women in politics") gives this away, so h1 now reveals `boysclub`.
    // why: young people ← "boys" read literally as 少年; rich people ← "club" as an exclusive members' club
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'boysclub', seg: [58.8, 64.2],
      stem: 'What does Leslie say has changed about government?',
      choices: ['It isn’t just for men anymore', 'It isn’t just for the young anymore', 'It isn’t just for the rich anymore'],
      a: 0,
      cue: 'isn’t just a のあとと、次の文の主語。',
      line: 'government isn’t just a *boys’ club* anymore. *Women are everywhere*.',
      said: '「役所はもう男だけの世界じゃない。女性がどこにでもいる」。',
      mean: 'boys’ club ＝ 男性だけで固まった集団。boys は年齢ではなく「男たち」。',
      trap: 'boys を少年、club を会員制クラブと取りやすい。次の文の主語が答え合わせ。',
      use: 'This team isn’t a boys’ club.（このチームは男だけの世界じゃない）' },

    // R fix: blind 70 % (V2): "women she has worked with" was a filler; now "me" heard as a filler "um"
    // why: forgot a name ← "me" lands where a fourth famous name should be; says um ← "me" heard as a hesitation
    { id: 'h1', skill: 'humor', level: 'C1', point: 'list', reveals: ['boysclub'], seg: [63.4, 72.1],
      stem: 'Why is Leslie’s list of women in politics funny?',
      choices: ['She slips herself in among famous leaders', 'She forgets a name and fills the gap with herself',
                'She loses her place and says “um” mid-list'], a: 0,
      cue: '名前が並ぶ中の、短い一語。',
      line: 'Hillary Clinton, Sarah Palin, *me*, Nancy Pelosi. *We did it!*',
      said: '女性政治家の名前を挙げる途中に、さらりと「私」を入れ、「やったね」と言う。',
      mean: '有名な政治家と同列に自分を置く大胆さが笑いどころ。迷わず、わざと入れている。',
      trap: '「me」を言いよどみと聞きやすいが、声は止まらない。we も自分を含めた「私たち」。',
      use: 'Me, Beyoncé, and Taylor Swift.（私とビヨンセとテイラー・スウィフトね）' },

    // R fix: blind 65 % (V2), and the cue leaked "get" (only in the key); the choices are now all about joining, and
    //   the cue drops "get"
    // why: later ← "buckle up" heard as waiting until things settle; safe ← "buckle up" as a real safety rule
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'board', seg: [72.1, 79.0],
      stem: 'What is Leslie telling people to do?',
      choices: ['Join her now and be ready for a wild ride', 'Join her now, but play it safe for a while',
                'Wait and join her once things settle down'], a: 0,
      cue: 'on board と、and のあとの動詞。',
      line: 'get *on board* and *buckle up*',
      said: '「乗り込んで、ベルトを締めて」と乗り物にたとえる。',
      mean: 'get on board ＝ 仲間に加わる。buckle up ＝ 覚悟して備える。どちらも「今」の話。',
      trap: 'シートベルトから安全の話と取りやすい。ここでは「激しくなるから備えて」の意味。',
      use: 'Buckle up, it’s going to be busy.（覚悟して、忙しくなるよ）' },

    // R fix: blind 75 % (V2): "a big new ride" was too literal to tempt; a park-plans reading (scope shift) replaces it
    // why: a long trip ← "ride" as a real journey; park plans ← a park employee talking about something big
    { id: 'i2', skill: 'infer', level: 'B2', point: 'ride', seg: [75.6, 79.0],
      stem: 'What does Leslie mean when she says her ride will be a big one?',
      choices: ['Her career will go a long way', 'Her trip will take a long time', 'Her park plans will be huge'],
      a: 0,
      cue: 'because のあと、my のあとの名詞が何のたとえか。',
      line: 'because *my ride’s gonna be a big one*.',
      said: '「私の乗り物は大物になるから」と言う。',
      mean: 'ride はここでは自分の出世・キャリアのたとえ。get on board から続くイメージ。',
      trap: '公園の職員なので公園の計画に聞こえやすい。my ride は自分の道。直前の「乗り込んで」の続き。',
      use: 'It’s been a wild ride.（波乱万丈だったよ）' },

    // R fix: blind 65 % (V2): "teasing the drunk" had no hook; now you/I (whose motion sickness). The said note no
    //   longer gives away d5's "stopping".
    // why: real advice ← she works for parks, and rides cause motion sickness; herself ← "if you get motion sickness"
    //   heard as her own problem
    { id: 'h2', skill: 'humor', level: 'C1', point: 'motion', reveals: ['ride'], seg: [78.4, 85.6],
      stem: 'Why is Leslie’s advice about motion sickness funny?',
      choices: ['She pushes the ride image way too far', 'She gives real advice for park rides',
                'She admits she gets motion sick herself'], a: 0,
      cue: '前の文の「乗り物」とのつながり。',
      line: 'if you get *motion sickness*, put your head between your knees',
      said: '「乗り物酔いする人は、頭をひざの間に入れて」と、乗り物のたとえのまま聞き手に言う。',
      mean: '出世を乗り物にたとえたまま、酔い止めの姿勢まで本気で言うのがおかしい。',
      trap: '具体的なので本当の注意に聞こえやすい。たとえ話の途中だと気づけば、言い過ぎが笑いどころ。',
      use: 'Hold on tight, here we go.（しっかりつかまって、行くよ）' },

    // R new: replaces d3 (literal count)
    // why: slow down ← "stopping" heard loosely as easing off; wait ← "for no one" goes with "wait" in a set phrase
    //   (time waits for no one)
    { id: 'd5', skill: 'detail', level: 'B1', point: 'stop', seg: [81.2, 85.6],
      stem: 'At the very end, what does Leslie say she won’t do for anyone?',
      choices: ['Stop', 'Slow down', 'Wait'], a: 0,
      cue: '最後の文、自分の名前のあとの動詞。',
      line: 'Leslie Knope’s *stopping* for no one.',
      said: '「レスリー・ノープは誰のためにも止まらない」と締める。',
      mean: 'stop for no one ＝ 誰のためにも止まらない。乗り物のたとえの続き。',
      trap: 'wait for no one という決まった言い方もあり混ざりやすい。ing の前の動詞を聞く。',
      use: 'I’m not stopping for anyone.（誰が何と言っても止まらないよ）' },
  ]
};
