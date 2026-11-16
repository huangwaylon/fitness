// “April Tries to Get Fired | Parks and Recreation” (the official Parks and Recreation channel, Season 3): April, now
// Chris's assistant, fakes passing on his lunch message so she'll be fired; Ann covers for her, a fake letter asks for
// her back, and instead of firing her Chris offers her a job in Indianapolis.
// Segments from the captions, words from whisper (2026-11-16). Both sources garble 119–121 s (“you're gone and trying
// isn't cool” / “Your yawn and trying isn't cool”), so m1's line skips it with …. Left out on purpose: “he's not into
// you sexually” (48–50 s), who “Burt Macklin” is and Andy's “Macklin's call” (backstory), and the talking head at
// 144–151 s (its speaker and stance need the show). The clip's only number (“two of my favorite people”) isn't worth an
// item.
// REVIEW 2026-11-16: pass 9, fix 11, drop 0, new 0; ear checks 0 (x1, nt1 and s1's checks are gone: both sources
//   agree word for word on “let you know”, “it's not it” and “I'm gonna be going back”, rubric addendum)
// Open: the blind reads still lean on the title (“Tries to Get Fired”) and April's deadpan, which a learner who
//   knows the show brings too.
import type { Clip } from '../types.ts';

export const aprilGetFired: Clip = {
  id: 'aprilgetfire', video: 'DgXIcpvdrq4', title: 'April Tries to Get Fired', dur: 163, wpm: 148, band: 'slow',
  tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 75 %: "fires her, then changes his mind" was a filler; now an apology-to-Ann reading
    // why: apologize to Ann ← the first half is about the lunch April wrecked, and Ann is at the office; parks ← the letter asks him to
    //   "release April back to us"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'outcome', reveals: ['offer', 'force'], seg: [0, 144.4],
      stem: 'How does Chris end up handling April’s behavior?',
      choices: ['He offers her a job instead of firing her', 'He keeps her on and has her apologize to Ann', 'He lets her return to the parks office'], a: 0,
      cue: '後半、Chris が Indianapolis の話をする部分。',
      said: '辞めたいなら無理強いしないと言い、そのあと「一緒に Indianapolis で働かないか」と誘う。',
      mean: 'クビを狙った行動が、逆に仕事の誘いにつながる皮肉な結末。',
      trap: '手紙の「パークス部に戻して」が通ったと取りやすいが、Chris は応じていない。',
      use: 'I’m not going to force you.（無理にとは言わないよ）' },

    // R fix: V2, blind 60 %: "Ann gets it, but comes by anyway" was easy to rule out; now a voicemail reading of the
    //   "call"
    // why: rudely ← the "call" at 16–24 s, with "I knew you wouldn't care", heard as real; voicemail ← nobody answers
    //   in that "call", so it sounds like a message left on a machine
    { id: 'g2', skill: 'gist', level: 'B2', point: 'call', reveals: ['figured'], seg: [0, 67.5],
      stem: 'In the first part, what happens to Chris’s lunch message?',
      choices: ['April never passes it on, on purpose', 'April passes it on, but adds a rude remark', 'April leaves it on a voicemail Ann misses'], a: 0,
      cue: 'Ann が来たあと、April が自分で言う理由。',
      said: '電話をかけたふりだけで、伝えていない。Ann に「わざと電話しなかった」と自分で言う。',
      mean: '電話の場面は芝居。わざと失敗して、クビになろうとしている。',
      trap: '電話の声が聞こえるので伝えたと取りやすいが、あとで I didn’t call you と言う。',
      use: 'Did you get my message?（伝言、届いた？）' },

    // why: mocks ← "way to…" heard as sarcasm about how slow she was; before he called ← "initiative" (doing things
    //   unasked) taken at face value
    { id: 'h1', skill: 'humor', level: 'C1', point: 'initiative', seg: [0, 6.6],
      stem: 'Why is the exchange right after April comes in funny?',
      choices: ['He praises her for doing just what he asked', 'He’s mocking her for being so slow to come in',
                'She came in before he even called her'], a: 0,
      cue: 'ほめ言葉のあとの、April の短い返事。',
      line: 'April, way to come in. *Great initiative.* — *You called me in.*',
      said: '呼ばれて入っただけで「すばらしい積極性」とほめられ、「呼んだでしょ」と返す。',
      mean: 'initiative ＝ 自分から動くこと。言われた通りにしただけで大げさにほめる。',
      trap: 'way to ～ は皮肉にもなるが、ここは本気。返事が、呼ばれて来たと示す。',
      use: 'Way to go! Great job.（やったね！よくできました）' },

    // why: unwell ← "unable to enjoy lunch" heard as a health excuse; leave ← "all day" heard as "away all day"
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'swamped', seg: [6.3, 15.4],
      stem: 'What reason does Chris give for canceling lunch?',
      choices: ['He has too much work all day', 'He isn’t feeling well today', 'He has to leave the office'], a: 0,
      cue: 'as I am just のあとの一語。',
      line: 'as I am *just swamped all day*.',
      said: '「今日は一日中忙しいので、昼食をご一緒できない」と伝えてほしい、と頼む。',
      mean: 'swamped ＝（仕事に）埋もれるほど忙しい。swamp は沼地。',
      trap: 'unable to enjoy を体調の話と取りやすいが、理由は as のあと。',
      use: 'Sorry, I’m swamped this week.（ごめん、今週は手いっぱいで）' },

    // why: write down ← copy = 写す; a copy ← copy = コピー, a document to forward
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'copy', seg: [6.3, 15.4],
      stem: 'How does April answer Chris’s request?',
      choices: ['“Got it, I’ll do it.”', '“I’ll write that down.”', '“I’ll send you a copy.”'], a: 0,
      cue: '頼みのすぐあと、April の2語の返事。',
      line: '*Copy that.*',
      said: '頼みを聞いて「了解」と答える。',
      mean: 'Copy that ＝ 無線の「了解」。仕事で使うと少しふざけた感じになる。',
      trap: 'copy を「写す」「コピー」と取ると、ほかの2つに引かれる。無線用語の「受信した」。',
      use: 'Copy that. On my way.（了解、すぐ行く）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'letknow', seg: [18.2, 21.05],
      stem: 'Type the words: “calling to ___ that Chris can’t make lunch.” (3 words)', answer: 'let you know',
      cue: 'calling to のすぐあと、that の前まで。',
      line: 'I’m just calling to *let you know* that Chris can’t make lunch today.',
      said: '「Chris が今日のランチに来られないとお知らせします」。',
      mean: 'let you know は「レッチュノウ」とつながる。t と y がくっつく。電話の決まり文句。',
      trap: 'let you が一語に聞こえ、短く感じやすい。お知らせの決まった形として覚える。',
      use: 'I’ll let you know tomorrow.（明日お知らせします）' },

    // why: moved ← "stood me up" heard as "put off"; can't make ← "can't make lunch" was April's line on the phone
    { id: 'd1', skill: 'detail', level: 'B2', point: 'stoodup', reveals: ['call'], seg: [33.2, 38.35],
      stem: 'Why has Ann come to the office?',
      choices: ['To ask why Chris missed their lunch', 'To ask why Chris moved their lunch', 'To tell Chris she can’t make lunch either'], a: 0,
      cue: 'I came to see のあと、Chris がしたこと。',
      line: 'I came to see why Chris *stood me up* for lunch',
      said: '「Chris がランチをすっぽかした理由を確かめに来た」と言う。',
      mean: 'stand someone up ＝ 約束をすっぽかす。',
      trap: 'stood up を「延期」と取りやすい。延期は put off、来なかったら stood up。',
      use: 'I got stood up last night.（昨日、すっぽかされた）' },

    // R fix: V2, blind 55 %: "far too busy" was a filler; now a jealousy reading. S3: the cue's "April" was only in
    //   the key
    // why: avoiding ← April's "Because he doesn't like you?" offered as the answer; to herself ← "I work for your
    //   boyfriend", said with an edge
    { id: 'i1', skill: 'infer', level: 'C1', point: 'figured', reveals: ['call'], seg: [33.2, 43.85],
      stem: 'When Ann says she “just figured it out”, what has she figured out?',
      choices: ['April never passed on the message', 'Chris has been avoiding her lately', 'April wants Chris all to herself'], a: 0,
      cue: 'figured it out のあと、本人が自分で言う理由。',
      line: 'I think I just *figured it out*. … it’s because *I didn’t call you*, deliberately',
      said: 'April が部下だと知って「分かった」と言い、April が「わざと電話しなかった」と認める。',
      mean: '伝言係が April だと知り、伝わらなかった理由を察した。',
      trap: 'April の「嫌われてるから？」に引かれやすいが、Ann は否定している。',
      use: 'I think I figured it out.（分かった気がする）' },

    // C2 dict: "it's not it", where grammar expects "it's not that"
    // anchor: 40.4–40.6 s both sources "I'm pretty sure it's not it", three fast weak words at the end of the reply
    { id: 'nt1', skill: 'dict', level: 'C2', point: 'notit', seg: [38.3, 40.85],
      stem: 'Type the end of the reply: “No, I’m pretty sure ___.” (3 words)', answer: "it's not it",
      cue: 'pretty sure のあと、文の最後まで。弱い語も全部。',
      line: 'No, I’m pretty sure *it’s not it*.',
      said: '「ううん、それはないと思う」。it’s not it の3語が速く、ひと続き。',
      mean: '教科書なら it’s not that。会話では it がそのまま「その理由」を指すこともある。',
      trap: '習った形に直して that と書きたくなる。最後の音は短い it。書き取りは聞こえた語を書く。',
      use: 'Nah, I don’t think that’s it.（いや、それは違うと思う）' },

    // R fix: V2, blind 55 %: "forgot" is now tied to Ann's later "very apologetic", so it has a pull of its own
    // why: forgot and sorry ← "didn't call you" heard without "deliberately", plus Ann's "very apologetic" later;
    //   called but missed ← the
    //   "call" at 16–24 s seemed real
    { id: 'd2', skill: 'detail', level: 'B1', point: 'call', seg: [40.45, 48.9],
      stem: 'What does April say Ann should tell Chris?',
      choices: ['That April skipped the call on purpose', 'That April forgot, and is very sorry', 'That April called, but Ann never picked up'], a: 0,
      cue: 'didn’t のあとに付く一語と、その次の文。',
      line: 'it’s because I didn’t call you, *deliberately*, which… is a *fireable offense*, so I would tell him that.',
      said: '「わざと電話しなかった。クビに値するから、彼にそう言えば」と言う。',
      mean: 'deliberately ＝ わざと。fireable offense ＝ クビに値する行為。',
      trap: 'deliberately を聞き落とすと「忘れた」に引かれる。',
      use: 'I didn’t do it on purpose!（わざとじゃないよ！）' },

    // R fix: V2, blind 50 %: "make Chris feel bad" was a filler; now a thank-you reading of the praise
    // why: really did ← "very apologetic on the phone" taken at face value; thank ← "she also sent me flowers" heard
    //   as gratitude for real flowers
    { id: 'i2', skill: 'infer', level: 'C1', point: 'cover', reveals: ['call'], seg: [55.3, 64.4],
      stem: 'After what April admitted, why does Ann praise her to Chris?',
      choices: ['To keep April from getting fired', 'Because April really did say sorry', 'To thank April in front of her boss'], a: 0,
      cue: '「謝ってくれた」のあと、もう一つ付け足す話。',
      line: 'April here was *very apologetic* on the phone. She also *sent me flowers*.',
      said: '「電話でとても謝ってくれた。花まで送ってくれた」と言う。',
      mean: 'April は電話もしていない。Ann は話を作って、クビにならないようかばっている。',
      trap: '文字通りなら April が謝ったことになるが、本人がさっき「わざと電話しなかった」と言っている。',
      use: 'She was very apologetic about it.（彼女、とても恐縮してたよ）' },

    // why: suspicious ← the audience knows it's a lie, so Chris seems to know too; embarrassed ← flowers are what he
    //   should have sent after canceling
    { id: 't2', skill: 'attitude', level: 'B1', point: 'touch', reveals: ['cover'], seg: [62.5, 67.5],
      stem: 'How does Chris react to hearing about the flowers?',
      choices: ['Pleased with April for the thought', 'Suspicious that April is lying to him', 'Embarrassed that he sent none'], a: 0,
      cue: '花の話のあと、April の名前に続く2語。',
      line: 'She also sent me flowers. — April. *Nice touch.*',
      said: '花まで送ったと聞き、「April、気が利くね」とほめる。',
      mean: 'nice touch ＝ ちょっとした気配り、いい演出。Chris は話をそのまま信じている。',
      trap: '見ている側は嘘と知っているので疑っていると思いやすいが、Chris の言葉はほめ言葉だけ。',
      use: 'The candles are a nice touch.（キャンドル、いい演出だね）' },

    // why: FBI for a while ← "FBI" is in the signature and "permanently" is a long, fast word; emergency ← "there is
    //   an emergency regarding the Parks Department" heard as the request itself
    { id: 'd3', skill: 'detail', level: 'B2', point: 'release', seg: [86.85, 101.7],
      stem: 'What does the letter ask Chris to do?',
      choices: ['Send April back to the parks office for good', 'Lend April to the FBI for a short time',
                'Help the parks office with an emergency'], a: 0,
      cue: 'Please で始まる文の最後の一語。',
      line: 'Please *release April back to us permanently*.',
      said: '「April を永久にこちらへ返してほしい」と手紙を読む。',
      mean: 'release ～ back ＝ ～を（元の所へ）戻す。permanently ＝ ずっと。',
      trap: 'emergency が目立つので「手伝って」と取りやすいが、頼みは Please のあと。',
      use: 'Can I have my pen back?（ペン返してもらえる？）' },

    // why: firing ← the title and "You didn't have to do this" heard as a verdict; warning ← the same line heard as a
    //   reprimand
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'force', seg: [107.7, 114.1],
      stem: 'What is Chris doing when he says “April, listen…”?',
      choices: ['Giving her an easy way out of the job', 'Firing her for the made-up letter', 'Warning her never to try a stunt like this again'], a: 0,
      cue: 'If you don’t want to のあとの、Chris の約束。',
      line: 'If you don’t want to work for me, *I’m not gonna force you*. You didn’t have to do this.',
      said: '「働きたくないなら無理強いはしない。こんなことしなくていい」と言う。',
      mean: '叱るのでもクビにするのでもなく、辞める道を穏やかに示している。',
      trap: 'didn’t have to do this を叱責と取りやすいが、「しなくてよかった」という優しい言い方。',
      use: 'You didn’t have to do that.（そこまでしなくてよかったのに）' },

    // R fix: V2, blind 70 %: "something on his desk" was a filler; now a stern reading of "Look"
    // why: look at him ← look = 見る, a request for eye contact; losing patience ← a sharp "Look," after a fake letter
    //   sounds like a scolding is coming
    { id: 'm1', skill: 'marker', level: 'B2', point: 'look', seg: [117.3, 123.35],
      stem: 'Chris opens his next turn with “Look”. What does it do?',
      choices: ['Signals he is about to speak frankly', 'Asks April to look straight at him', 'Shows he is starting to lose patience'], a: 0,
      cue: '文頭の一語と、すぐあとの I get it。',
      line: '*Look*, I get it. … but I think you’re smart.',
      said: '「いいかい、分かってるよ。でも君は頭がいいと思う」と話し始める。',
      mean: '文頭の Look は「いいかい」。本音や大事な話を切り出す合図で、何も見せていない。',
      trap: 'look を「見て」や叱る前触れと取りやすい。続く I get it で前置きと分かる。',
      use: 'Look, I know you’re busy, but…（あのさ、忙しいのは分かるけど…）' },

    // R fix: V2, blind 65 %: "I wanna be going back" was the one unnatural choice; now "I might be", which starts
    //   with the same "aim-" sound
    // why: gotta ← "gonna" and "gotta" differ only in n vs a flapped t; might ← "I'm g-" blurs into "I mi-"
    { id: 's1', skill: 'sound', level: 'B2', point: 'goingback', seg: [123.6, 128.0],
      stem: 'Fill the gap: “___ going back to Indianapolis soon.”',
      choices: ['I’m gonna be', 'I’ve gotta be', 'I might be'], a: 0,
      cue: '文の最初、とても速い3語。',
      line: '*I’m gonna be* going back to Indianapolis soon',
      said: '「もうすぐ Indianapolis に戻る予定」と言う。',
      mean: 'gonna be going ＝ 〜することになっている。gonna は「ガナ」、gotta は「ガラ」。',
      trap: '最初の I’m と、n／t の音で聞き分ける。might なら t が残る。',
      use: 'I’m gonna be late tonight.（今夜は遅くなりそう）' },

    // R fix: V2, blind 75 %: "time off" was a filler; now "Indianapolis" in the wrong relation
    // why: parks ← "going back" heard about April, not Chris; better job there ← "Indianapolis" heard, but as where
    //   she'd look for work ← "Think about it" comes a moment later
    { id: 'd4', skill: 'detail', level: 'B1', point: 'offer', reveals: ['goingback'], seg: [123.6, 128.0],
      stem: 'What does Chris suggest April do?',
      choices: ['Come and work for him in Indianapolis', 'Go back to work at the parks office', 'Look for a better job in Indianapolis'], a: 0,
      cue: 'I think you should のあと。',
      line: 'I’m gonna be going back to Indianapolis soon… I think you should *come work for me*.',
      said: '「もうすぐ戻る。一緒に来て働かないか」と誘う。',
      mean: 'I think you should ～ は、やわらかい提案・誘いの形。',
      trap: 'going back を April のことと取ると「パークス部に戻る」に引かれる。戻るのは Chris。',
      use: 'I think you should come with us.（一緒に来たらいいと思う）' },

    // R fix: V2, blind 65 %: "touched" was weak; now "all the way" read as worry about the distance. C5: the stem and
    //   choices give away d4's job offer in Indianapolis, so it reveals `offer`
    // why: excited ← "Wow" heard as enthusiasm; worried ← "all the way to Indianapolis" heard as the problem, but the
    //   complaint that follows is about the job
    { id: 't1', skill: 'attitude', level: 'C1', point: 'vitamins', reveals: ['offer'], seg: [127.75, 134.25],
      stem: 'How does April feel about Chris’s offer?',
      choices: ['Unimpressed: it sounds like errands', 'Excited to move to a bigger city', 'Worried about moving so far away'], a: 0,
      cue: 'Wow のあと、自分の仕事を想像して言う部分。',
      line: 'Wow. Move *all the way* to Indianapolis so I can *pick up your vitamins and supplements*.',
      said: '「わあ。はるばる引っ越して、あなたのビタミン剤を買いに行くわけ」と返す。',
      mean: '仕事を雑用に言いかえて、魅力がないと伝える皮肉。Wow も感心ではない。',
      trap: 'Wow を素直な驚きと取りやすいが、続く中身が雑用。all the way は「わざわざ」。',
      use: 'Wow. Sounds thrilling.（わあ、ワクワクするね）' },

    // R fix: V2, blind 50 %: "a firm no and gave up" was ruled out by "Think about it"; now a near miss, a joke let
    //   pass
    // why: excitement ← "Wow" read sincerely, matching how the offer was made; let it pass ← a short, light reply
    //   after a jab read as brushing it off, but "starts somewhere" answers the jab's content
    // anchor: 134.3–135.6 s "Everybody starts somewhere" concedes the job is small (it answers "pick up your
    //   vitamins"); 136.4–140.9 s he sells the upside and ends on "Think about it"
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'vitamins', reveals: ['starts'], seg: [127.75, 141.5],
      stem: 'What does Chris’s answer show about how he took April’s remark?',
      choices: ['He heard the complaint under the joke', 'He took her “Wow” as real excitement', 'He took it as a joke and let it pass'], a: 0,
      cue: 'Chris の最初の一文が、何に答えているか。',
      line: 'so I can pick up your *vitamins*… — *Everybody starts somewhere.* … Think about it.',
      said: '「ビタミン剤を買いに？」に「誰でも最初はそこから。考えて」と返す。',
      mean: '皮肉の形はほめも怒りもせず流し、中の不満「雑用だ」にだけ答えている。皮肉を正しく受け取った返事。',
      trap: '軽い返事なので聞き流したと取りやすい。返事が相手の不満の中身に合っていれば、伝わっている。',
      use: 'Fair point. But think about it.（それはそう。でも考えてみて）' },

    // R fix: V2, blind 70 %: "start right away" was a filler; now "somewhere" read as "anywhere"
    // why: move away ← "somewhere" heard as a place to move to; whatever job ← "somewhere" read as "wherever you like"
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'starts', reveals: ['vitamins'], seg: [127.75, 141.5],
      stem: 'What does Chris’s first reply to April’s remark mean?',
      choices: ['Small jobs are how everyone begins', 'Everyone has to move away sometime', 'She can start in whatever job she likes'], a: 0,
      cue: 'April の返事のすぐあと、短い一文。',
      line: '*Everybody starts somewhere.* You’ll travel',
      said: '「誰でも最初は下から。旅も出会いもある」と返す。',
      mean: 'Everybody starts somewhere ＝ 小さな仕事も出発点、という励ましの決まり文句。',
      trap: 'somewhere を「どこか遠く」と取ると引っ越しの話に聞こえる。ここは「どの段階」。',
      use: 'We all start at the bottom.（みんな下積みから始めるんだ）' },
  ]
};
