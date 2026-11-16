// “Ben Visits Entertainment 720 | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Ben
// comes to help Tom and Jean-Ralphio's company with its paperwork, finds a $100,000 receptionist and a printing press
// for "money", tells them to downsize and keep records, and is thanked and shown the door.
// Segments from the captions, words from whisper (2026-11-16). Speech stops at ~218 s; the rest is music. Skipped as
// overlapping or music: 128–140 s (party music; whisper loops "It's not good") and 157–170 s (the "Jello shot" chant).
// The captions garble the players' names (no item uses them), 89–93 s ("end of the Cent sent", see the ear check),
// 185 s ("there wouldn't know", whisper "wouldn't owe") and 194 s ("YouTube Osos" for "you two bozos"); no other key
// rests on those words, and the lines trim them. Ben is named at 32.4, 34.0, 62.3 and 207.4 s; Tom and Jean-Ralphio
// are never told apart in the stems ("the owners", "an owner"). Untested: who says "Thank you, I've been trying to tell
// them that" (182 s), "Aw, snap" vs whisper's "Aw, Snapple" (149 s), and the last line (217 s, "you/he didn't even get
// one").
// REVIEW 2026-11-16: pass 7, fix 16, drop 1, new 1; ear checks 1 (unchanged)
// EAR CHECK: 86.1–93.4 s h2 — whisper “bankrupt by the end of this sentence”, captions “by the end of the Cent sent”;
//   the key needs “this sentence” (and Ben as the speaker, by the turn-taking with the receptionist)
import type { Clip } from '../types.ts';

export const ent720: Clip = {
  id: 'ent720', video: 'w_ul6dXgkSk', title: 'Ben Visits Entertainment 720', dur: 238, wpm: 174, band: 'fast',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: 70% ← "seventy" caught and "five" lost in the fast run; 25% ← "-ty-five" heard as twenty-five after "only"
    { id: 'n1', skill: 'number', level: 'B1', point: 'pct', seg: [11.9, 16.8],
      stem: 'What share of his NBA salary are they paying the player?',
      choices: ['25%', '70%', '75%'], a: 2, keep: true,
      cue: 'only like のあとの数字。最後まで聞く。',
      line: 'NBA’s on strike, so we got him for *only like 75%* of his original NBA salary.',
      said: 'リーグがストライキ中なので、元の給料の75%ほどで雇えたと自慢する。',
      mean: 'only like ＝「たった〜くらい」。安く雇えたと言うが、それでも大金。',
      trap: 'seventy のあとの five が速く、70 で止めやすい。数字は最後の音まで聞く。',
      use: 'I got it for only like half price.（半額くらいで買えた）' },

    // R fix: V2 (blind 75 %): "invest" and "try out" were fillers; now a job interview ("thank you so much for coming
    //   out"), which "here to help us with the paperwork" refutes
    // why: interview ← "thank you so much for coming out" sounds like a welcome for a candidate; hoops ← basketball
    //   and an NBA player just before
    { id: 'g1', skill: 'gist', level: 'B1', point: 'paperwork', seg: [31, 47.9],
      stem: 'Why has Ben come to the company?',
      choices: ['To help with their paperwork', 'To interview for a job there', 'To shoot hoops with the players'], a: 0,
      cue: '「誰？」と聞かれたあとの紹介。',
      line: 'This is Ben. He’s here to *help us with the paperwork*.',
      said: '「これがベン。書類仕事を手伝いに来てくれた」と紹介される。',
      mean: '遊びだらけの会社に、まじめな事務の担当が来た、という場面の始まり。',
      trap: 'バスケの話や「来てくれてありがとう」から、選手や面接と思いやすい。here to のあとが目的。',
      use: 'I’m here to help with the move.（引っ越しの手伝いに来ました）' },

    // R fix: V2 (blind 60 %) and S1: the scare quotes on "help" pointed at the irony; the stem is plain now and the
    //   key is worded as flatly as the others. Its line shows "could do better", so it reveals `better` (s1)
    // why: fake name ← "Is that your real name?" heard as suspicion; other visitor ← a new name handed out as if
    //   they'd confused him with someone
    { id: 'h1', skill: 'humor', level: 'C1', point: 'rename', reveals: ['better'], seg: [32.1, 39],
      stem: 'When Ben confirms his real name, what is funny about the reply?',
      choices: ['They treat his name as a problem to fix', 'They suspect he has given them a fake name',
                'They take him for a different visitor'], a: 0,
      cue: 'Yes のあと、better と help の使い方。',
      line: 'Oh, *you could do better than that*. I’m going to *help you out* right now. Your name is Angelo.',
      said: '本名かと聞き、そうだと答えると「もっといい名前にできる。助けてやる」と勝手に新しい名前を付ける。',
      mean: '名前を直すべき欠点のように扱い、それを親切だと思っている。',
      trap: 'real name? を「偽名では」と疑う質問に取りやすい。疑いでなく、評価の前ふり。',
      use: 'You could do better than that.（もっといいのがあるよ）' },

    // R new: the bank had no `sound` item (C2 coverage); this takes pr1's place. Both sources: "you could do better
    //   than that" (35.7–36.4 s)
    // why: a 2 × 2 of near sounds, so no choice is the centre: couldn't ← n't's t lost; could've done ← 've weak, and
    //   "do" and "done" close; couldn't have done ← both at once (= "that's perfect")
    { id: 's1', skill: 'sound', level: 'B2', point: 'better', seg: [34.9, 38],
      stem: 'Fill the gap: “Oh, you ___ better than that.”',
      choices: ['could do', 'couldn’t do', 'could’ve done', 'couldn’t have done'], a: 0,
      cue: 'Oh, you のすぐあと、弱く短い部分。',
      line: 'Ben, is that your real name? — Yes. — Oh, you *could do* better than that.',
      said: '本名だと聞き、「もっといい名前にできるよ」と言って、勝手に名前を変える流れになる。',
      mean: 'could do が「クドゥ」と一続き。これからの話。',
      trap: 'n’t や ’ve は弱く聞き分けにくい。否定や過去なら、名前を変える流れと合わない。',
      use: 'I think we could do better.（もっと良くできると思う）' },

    // R fix: V2 (blind 55 %): "bring the forms" was weak; now "help us" read as teaching them, which "take care of it
    //   for us" refutes
    // why: show them ← "help us with the paperwork" heard as teaching; done already ← "take care of it" heard as a
    //   final check
    { id: 'i1', skill: 'infer', level: 'B2', point: 'find', reveals: ['paperwork'], seg: [43.5, 47.9],
      stem: 'What do the owners expect Ben to do about the paperwork?',
      choices: ['Find it and handle all of it', 'Show them how to fill it out', 'Check the work they already did'], a: 0,
      cue: 'Secondly のあと、but で何を頼むか。',
      line: 'I don’t know *where the paperwork is*, but when you find it, can you *take care of it for us*?',
      said: '「書類がどこにあるか知らないけど、見つけたら片づけてくれる？」と頼む。',
      mean: '場所も知らず、中身にも関わる気がない。全部ベンに任せるつもり。',
      trap: 'take care of を「確認する」と軽く取りやすい。for us まで聞くと、代わりに片づける話。',
      use: 'Can you take care of the bill?（会計をお願いできる？）' },

    // why: party ← the company's party life (later "clubs"); phones ← a tech-happy company would sign digitally
    { id: 'd2', skill: 'detail', level: 'B1', point: 'pens', seg: [47.25, 50.4],
      stem: 'Why don’t the owners have any pens?',
      choices: ['They fear ink stains on their shirts', 'They lost all of them at a party',
                'They sign everything on their phones'], a: 0,
      cue: 'pens のすぐあと、理由の部分。',
      line: 'We don’t have any pens because we’re *afraid it’s going to leak*…',
      said: '「ペンはない。シャツにインクがもれるのが怖いから」と言う。',
      mean: 'leak ＝ もれる。仕事の道具より服を大事にする、ばかばかしい理由。',
      trap: 'pens だけを聞くと、なくした話を思いやすい。because のあとが理由。',
      use: 'My pen leaked all over my bag.（ペンがかばんの中でもれた）' },

    // R fix: N6: notes trimmed to ≤ 120 characters; the item itself passes
    // C2 dict: "it's" where grammar wants "they're", in a run of weak words
    // anchor: 48.9–49.6 s "we're afraid it's going to leak" (both sources), all four words unstressed and fast; the
    //   "it" stands for "pens"
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'pens', seg: [47.25, 50.4],
      stem: 'Type what he says: “…because we’re ___ leak.” (4 words)', answer: 'afraid it\'s going to',
      cue: 'we’re のあと、leak の前まで。聞こえた形で。',
      line: 'because we’re *afraid it’s going to* leak',
      said: '「インクがもれるのが怖くて」。afraid it’s going to が一続きで速い。',
      mean: 'pens は複数でも、話し言葉では it で受けることがある。',
      trap: 'pens に合わせて they’re と書きたくなる。聞こえた語を書く。',
      use: 'Bring a jacket. It’s going to rain.（上着を持って。雨が降るよ）' },

    // R fix: V2 (blind 60 %) and K2: nothing in the words refutes "fed up and wants to leave"; now a second literal
    //   reading (a tour)
    // why: address ← "where are we?" taken literally; tour ← the same words as a newcomer's request to be shown
    //   around
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'lost', seg: [57, 61.95],
      stem: 'When asked if he has questions, what does Ben’s reply show?',
      choices: ['He’s baffled by the whole place', 'He’d like a tour of the building',
                'He wants the office’s street address'], a: 0,
      cue: 'questions? と聞かれたあとの短い返事。',
      line: 'Do we have questions? — Yeah, *where are we?*',
      said: '「質問は？」と聞かれ、「ああ、ここはどこ？」と返す。',
      mean: '住所を聞いているのではない。「ここは一体何なんだ」という、あきれた戸惑い。',
      trap: 'where are we を文字どおり場所の質問と取りやすい。場面のめちゃくちゃさに対する一言。',
      use: 'Wait, what is happening right now?（待って、今何が起きてるの？）' },

    // R fix: V2 (blind 50 %): the key's "Nobody" overstated one reply; it now says only what her answer supports
    // why: away today ← "I guess" heard as filling in for someone; unwelcome ← a short reply heard as cold (she then
    //   tells a stranger her pay)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'recep', seg: [71.9, 85.9],
      stem: 'What does the receptionist’s answer suggest about the company?',
      choices: ['Roles there are vague, even to staff', 'Its usual receptionist is away today',
                'Its staff aren’t meant to talk to visitors'], a: 0,
      cue: '受付かと聞かれた返事と、そのあとの給料の話。',
      line: 'Are you the receptionist? — *I guess. I don’t really know.*',
      said: '「受付の人？」と聞かれ、「たぶん。よく分からない」と答え、給料はすらすら話す。',
      mean: '自分の仕事が何かも分からないほど、会社の役割がはっきりしていない。',
      trap: 'I guess を「代わりに座っている」と取りやすい。すぐ給料を話すので、口が重いのでもない。',
      use: 'I guess I’m in charge? I don’t know.（たぶん私が担当？分からないけど）' },

    // why: $10,000 ← "a hundred thousand" split into Japanese 万 units; $1,000,000 ← a shock reaction expected
    { id: 'n2', skill: 'number', level: 'B1', point: 'salary', reveals: ['medical'], seg: [78, 86],
      stem: 'How much does the receptionist say she’s paid?',
      choices: ['$10,000 a year', '$100,000 a year', '$1,000,000 a year'], a: 1, keep: true,
      cue: 'paying you? のあとの金額。',
      line: '*$100,000 a year* with full medical.',
      said: '「年10万ドル、医療保険つき」と答える。',
      mean: '受付にしては高すぎる給料。会社のお金の使い方が見える一言。',
      trap: 'hundred thousand は日本語の「万」と区切りが違う。1000が100こで10万と考える。',
      use: 'It pays fifty thousand a year.（年5万ドルの仕事です）' },

    // why: doctor ← "medical" read as a person or place (医療 = 医者); medicine ← メディカル heard as 薬
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'medical', reveals: ['salary'], seg: [79.8, 86],
      stem: 'Besides the pay, what else does the receptionist say she gets?',
      choices: ['Complete health insurance', 'A doctor on call all day', 'Free medicine when she’s ill'], a: 0,
      cue: 'year のあと、with で始まる部分。',
      line: '$100,000 a year *with full medical*.',
      said: '給料に加えて、医療の保険が全部ついていると言う。',
      mean: 'full medical ＝ 医療保険を全額カバー。仕事の待遇を言うときの決まった言い方。',
      trap: 'medical を医者や薬と取りやすい。仕事の話の medical は保険のこと。',
      use: 'Does the job come with full medical?（その仕事、医療保険は全部つく？）' },

    // EAR CHECK: see the header (86.1–93.4 s)
    // R fix: V2 (blind 70 %): "absurdly" marked the key as the joke and "she talks too long" was weak; the choices
    //   now differ only in the timescale or the cause
    // why: within a year ← "a year" just before (the salary); her pay ← he is reacting to her salary, so the cause is
    //   heard as the joke
    { id: 'h2', skill: 'humor', level: 'C1', point: 'bankrupt', seg: [85.75, 93.4],
      stem: 'Why is Ben’s guess about the company’s future funny?',
      choices: ['He means they’ll go broke in seconds', 'He means they will go broke within a year',
                'He means her pay alone will sink them'], a: 0,
      cue: 'bankrupt のあと、by the end of で何の終わりか。',
      line: 'they’ll be *bankrupt by the end of this sentence*.',
      said: '「この文を言い終わるころには、破産してるだろうね」と言う。',
      mean: '「すぐ」を、言い終わるまでの数秒に大げさに言いかえた冗談。',
      trap: '直前の a year につられやすい。by the end of のあとの語で、どれほどの短さかを聞く。',
      use: 'I’ll be broke by Friday.（金曜には金欠だよ）', retired: true },

    // R fix: V2 (blind 60 %): "renting out their hangar" was a filler; now merchandise, from the "logo" line
    // why: shirts ← "our faces and the E720 logo" (on the bills, 114 s) heard as merchandise; clubs ← they're heard
    //   at clubs later
    { id: 'd5', skill: 'detail', level: 'B1', point: 'print', seg: [103.2, 111.8],
      stem: 'How do the owners say they make money?',
      choices: ['By printing their own bills', 'By selling shirts with their logo', 'By throwing parties at clubs'], a: 0,
      cue: '同じ質問を2回くり返したあと、By で始まる答え。',
      line: 'By *literally printing our own money*.',
      said: '「お金の稼ぎ方？文字どおり、自分たちでお金を作ってる」と答える。',
      mean: 'literally ＝ 文字どおり。たとえではなく、本当に紙のお金を作っている。',
      trap: 'make money を「稼ぐ」と取ったまま聞くと、答えのずれに気づきにくい。',
      use: 'I literally ran all the way here.（ほんとに、ずっと走って来た）' },

    // R drop: pr1 (pragma, "you can't just print your own money"). V1: common sense gives the key, because anyone
    //   knows printing money isn't allowed. It never shipped, so it's deleted; s1 (sound) takes its place.

    // R fix: V2 (blind 65 %): "club events" was weak; now player contracts, a business paper that "books" doesn't mean
    // why: shelves ← books read literally (本); contracts ← the NBA players they pay, and "on business" just before
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'books', seg: [140.2, 145.5],
      stem: 'When Ben turns serious, what does he ask to see?',
      choices: ['Their accounts and records', 'The books on their shelves', 'Their contracts with players'], a: 0,
      cue: 'business の話に切りかえた直後。',
      line: 'I need to see *all of your books*.',
      said: '遊びから急に仕事モードになり、「帳簿を全部見せて」と言う。',
      mean: 'books ＝ 会社のお金の記録・帳簿。business の文脈ではこの意味。',
      trap: 'books を本と取りやすい。会社やお金の話なら帳簿のこと。',
      use: 'Let’s go over the books tonight.（今夜、帳簿を見直そう）' },

    // R fix: V2 (blind 70 %): the key was the only vivid "trend" choice; all three are now plain feelings of one shape
    // why: annoyed ← "baby" from strangers can sound rude; teasing ← "baby" heard as a jab at Ben being childish
    { id: 'h3', skill: 'humor', level: 'C1', point: 'baby', seg: [145.4, 153.7],
      stem: 'Why is the question about calling everybody “baby” funny?',
      choices: ['He’s excited to pick up a word he just heard', 'He’s annoyed that strangers call him baby',
                'He’s teasing Ben for sounding childish'], a: 0,
      cue: '質問のあと、Because で何が続くか。',
      line: 'Are we calling everybody baby now? Because honestly, *I love that*.',
      said: '「みんなを baby って呼ぶことにした？正直、それ大好き」と言う。',
      mean: 'たまたま出た一語を、新しい流行のように喜んで飛びつく。中身より流行を追う二人らしさ。',
      trap: '質問の形なので、文句を言っていると取りやすい。Because のあとに本音が来る。',
      use: 'Are we doing hats now? I love that.（帽子かぶる流れ？いいね）' },

    // R fix: V2 (blind 70 %): "hire more staff" was weak; now investors, a real survival move that "downsize" refutes.
    //   Key reworded so it isn't the shortest (C7)
    // why: investors ← "survive" + money trouble suggest raising cash; bigger ← "hangar" said next
    { id: 'd7', skill: 'detail', level: 'B2', point: 'downsize', seg: [170.7, 174.75],
      stem: 'What is the first thing Ben says they must do to survive?',
      choices: ['Make the company smaller', 'Find investors right away', 'Move into a bigger space'], a: 0,
      cue: 'immediately need to のあとの動詞。',
      line: 'you immediately need to *downsize*.',
      said: '「会社を続けたいなら、すぐに規模を小さくしないと」と言う。',
      mean: 'downsize ＝ 人や物を減らし、規模を小さくする。',
      trap: 'survive から「お金を集める」と取りやすい。down の向きで小さくする話と分かる。',
      use: 'We’re downsizing to a smaller apartment.（小さい部屋に引っ越す）' },

    // why: takes back ← I mean read as 訂正 (Japanese 「いや」); second point ← "And two" comes right after the reply
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', reveals: ['downsize'], seg: [170.7, 176.95],
      stem: 'After saying they must downsize, what does Ben’s next sentence do?',
      choices: ['Gives an example of what to cut', 'Takes back what he has just said', 'Moves on to his second point'], a: 0,
      cue: 'downsize のあと、文頭の短い2語。',
      line: '…downsize. *I mean*, you don’t need this airplane hangar.',
      said: '「つまり、この飛行機の格納庫はいらないでしょ」と続ける。',
      mean: 'I mean ＝ つまり・たとえば。言ったことを具体的に言い直す合図。',
      trap: '日本語の「いや」のように訂正と取りやすい。I mean のあとは中身の説明が多い。',
      use: 'It’s pricey. I mean, ten dollars for toast?（高いね。トーストで10ドル？）' },

    // R fix: N6: notes trimmed to ≤ 120 characters; the item itself passes (blind 45 %, wrong)
    // C2 plain-English paraphrase
    // why: undecided ← "Um, I think" read as real doubt (かもしれない); let it go ← "we do" heard as agreeing with
    //   "you need to downsize"
    // anchor: 174.8–177.7 s "you don't need this airplane hangar" — "Um, I think we do": "do" = "need it"; and at
    //   209–213 s "I think we know what we're doing" (g2's segment)
    { id: 'nt3', skill: 'pragma', level: 'C2', point: 'hangar', seg: [170.7, 177.95],
      stem: 'Which plain-English version keeps the reply about the hangar?',
      choices: ['“No, we’re keeping it.”', '“Maybe; we haven’t decided.”', '“Fine, we’ll let it go.”'], a: 0,
      cue: 'need の文に、do が何を受けて返しているか。',
      line: 'you don’t need this airplane hangar. — Um, *I think we do*.',
      said: '「格納庫はいらないでしょ」に「えー、いると思う」と返す。',
      mean: 'do は need を受けて「いる」。Um と I think はやわらげ。',
      trap: 'I think を「かもしれない」と取ると迷いに聞こえる。do が何の代わりかを前の文から取る。',
      use: 'You don’t need that. — I think I do.（それいらないでしょ —いると思う）' },

    // R fix: V2 (blind 70 %): "put him in charge" was a filler; now a partial acceptance, which "as far as business
    //   decisions go, I think we know what we're doing" refutes
    // why: cut spending ← "Thank you, I've been trying to tell them that" heard as the owners agreeing; some of it ←
    //   the same line, or "I think we do" about the hangar alone, heard as a partial yes
    { id: 'g2', skill: 'gist', level: 'B2', point: 'advice', reveals: ['respect', 'downsize'], seg: [170.7, 216.9],
      stem: 'How do the owners take Ben’s business advice in the end?',
      choices: ['They thank him, then brush all of it off', 'They agree to cut back on their spending',
                'They accept some of it and skip the rest'], a: 0,
      cue: '最後の Ben の名前のあと、but で何が続くか。',
      line: 'Ben, thanks for your time. But *with all due respect*… *I think we know what we’re doing*.',
      said: '小さくしろ、記録をつけろ、という助言に、礼を言いつつ「自分たちで分かってる」と返す。',
      mean: '丁寧な言葉で、助言をまるごと断っている。',
      trap: 'thanks の丁寧さで受け入れたと取りやすい。but のあとが本当の返事。',
      use: 'Thanks, but I think I’ve got it.（ありがとう、でも大丈夫だと思う）' },

    // why: hurt ← a put-down usually ends a guest's visit; amused ← he's been playing along with nicknames all day
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'firm', seg: [195.8, 207.3],
      stem: 'When Ben answers the owners’ put-down, how does he sound?',
      choices: ['Firm; he won’t give ground', 'Hurt; he’s ready to leave', 'Amused; he’s playing along'], a: 0,
      cue: '文頭の Look と、最後の短い一言。',
      line: '*Look*, you guys can swagger around all you want, but… *That’s a fact.*',
      said: '「いいか、好きなだけ威張ってていいけど…これは事実だ」と言い切る。',
      mean: 'Look で話を切りかえ、That’s a fact で念を押す。引かずに言い返している。',
      trap: '言われっぱなしの客が帰る、という型で聞きやすい。最初と最後の一言で強さが分かる。',
      use: 'Look, I’m not mad. That’s a fact.（いいかい、怒ってない。本当に）' },

    // R fix: V2 (blind 50 %): "partying at clubs" was easy to rule out; now money, read from “all you want, but
    //   businesses need revenue”
    // why: walk around ← swagger heard as just walking (around); spending ← "all you want, but… revenue" heard as
    //   being about money
    { id: 'p4', skill: 'phrase', level: 'C1', point: 'swagger', seg: [196.7, 202.55],
      stem: 'What does Ben say the owners are free to keep doing?',
      choices: ['Strutting around like big shots', 'Walking around their big office', 'Spending money however they like'], a: 0,
      cue: 'can のあとの動詞と、all you want。',
      line: 'you guys can *swagger around* all you want, but businesses need revenue',
      said: '「好きなだけ威張って歩いていいけど、会社には収入がいる」と言う。',
      mean: 'swagger ＝ 偉そうにふるまう。all you want で「勝手にどうぞ、でも」。',
      trap: 'around があるので、ただ歩き回ると取りやすい。swagger は態度の語。',
      use: 'You can complain all you want, but…（いくら文句を言ってもいいけど…）' },

    // C2 how it lands
    // R fix: V2 (blind 55 %) and K6: the key alone echoed the stem's "warning", and "now trust Ben" was weak; now the
    //   おみやげ frame its trap already names
    // why: bribe ← "books" were demanded earlier, so a gift sounds like hush money; good terms ← the Japanese おみやげ
    //   frame: a parting gift as 気づかい after a brush-off
    // anchor: 199.7–206.8 s "businesses need revenue… you're dead in a month", then 213.7–216.3 s "Don't forget to
    //   grab a free iPad on your way out": the gift is the waste he just warned about
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'ipad', reveals: ['month'], seg: [196.7, 216.9],
      stem: 'After Ben’s warning about money, how should we hear the free-iPad offer?',
      choices: ['As proof that none of it sank in', 'As a bribe to keep the books quiet',
                'As a kind gesture to end on good terms'], a: 0,
      cue: '収入の話と、最後の一言を比べて。',
      line: 'businesses need *revenue*… you’re *dead in a month*. … Don’t forget to grab a *free iPad* on your way out.',
      said: '収入がないと1か月で終わると言われたのに、帰りに「無料のiPadを持っていって」と言う。',
      mean: '親切に見えて、警告を聞いていない証拠。お金を配る癖がそのまま出ている。',
      trap: '帰りのおみやげは気づかいに聞こえやすい。直前の警告と並べて見る。',
      use: 'Sure, let’s save money. Free cake, anyone?（節約しよう。誰かケーキ無料でどう？）' },

    // why: a week ← "dead" + urgency; six months ← "month" heard with a plural s; a year ← the salary "a year" earlier
    { id: 'n3', skill: 'number', level: 'B1', point: 'month', seg: [202.1, 207.3],
      stem: 'How soon does Ben say they’re finished without a real plan?',
      choices: ['In a week', 'In a month', 'In six months', 'In a year'], a: 1, keep: true,
      cue: 'dead のあと、in で始まる期間。',
      line: 'Unless you start working on an actual plan, you’re *dead in a month*.',
      said: '「ちゃんとした計画を始めないと、1か月で終わりだ」と言う。',
      mean: 'dead ＝ 会社がつぶれる、の強い言い方。in a month ＝ 1か月後に。',
      trap: 'month と months は最後の s で分かれる。a があれば1つ。',
      use: 'My phone will be dead in an hour.（あと1時間で電池が切れる）' },

    // R fix: V2 (blind 60 %) and S1: "the polite opening… set up" told the reader a contrast was coming; the stem now
    //   only names the moment, and "apology" (weak) became a partial yes
    // why: promise ← "respect" heard as accepting his view (Japanese frame: 敬意 = 同意); partial yes ← "as far as
    //   business decisions go" heard as limiting a concession
    { id: 'pr3', skill: 'pragma', level: 'B2', point: 'respect', reveals: ['advice'], seg: [207.1, 213.65],
      stem: 'What follows the owner’s “thanks for your time”?',
      choices: ['A flat refusal of Ben’s advice', 'A promise to follow Ben’s advice', 'A partial yes, with conditions'], a: 0,
      cue: 'thanks のあと、but に続く丁寧な前置き。',
      line: 'But *with all due respect*, as far as business decisions go, *I think we know what we’re doing*.',
      said: '「お言葉ですが、経営のことは自分たちで分かってます」と返す。',
      mean: 'with all due respect ＝「お言葉ですが」。このあとに反対や断りが来る合図。',
      trap: 'respect を「敬意があるから従う」と取りやすい。この前置きのあとは、ほぼ反論。',
      use: 'With all due respect, I disagree.（お言葉ですが、反対です）' },
  ]
};
