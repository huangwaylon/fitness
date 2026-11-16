// “Chandler Is Desperate and Needy | Friends” (the official Friends channel, Best of Season 1): Chandler waits all day
// for Danielle to return his call, refuses to call her, calls her anyway, and finds his phone was off the whole time;
// when she turns up to check on him, he calls her needy.
// Segments from the captions, words from whisper (2026-11-16). Named in the audio: Danielle (2.2, 116.1, 195.9 s) and
// Chandler (118.8, 194.6 s). The friends are never named: stems say "a friend". Whisper runs the clip together in long
// chunks, so all timings are the captions'. Left out on purpose: "like I haven't been sitting around" (31.2 s; whisper
// "like I've been sitting"), the "Can I use your phone? … Yes, it's working" exchange (40–52 s: who holds which phone
// can't be settled from the words; f2 asks only the phrase), "While I'm dancing?" (147 s; whisper "Well, I'm
// dancing"), the Mr. Peanut aside (177–192 s: off topic, and it turns on "he's gay"), "I'll call you, or you call me,
// whatever" (219 s: which of the two says it isn't settled), and "Second day/date" (230.7 s; no item uses it).
// REVIEW 2026-11-16: pass 9, fix 15, drop 0, new 0; ear checks 1
// OPEN: h5 rests on its ear check; if "No" turns out to be whisper's "do you know", drop h5 (humor stays at 3).
// OPEN: nt2 is left as it is: about 45 % blind for a learner, and the anchor ("told her you did") settles it.
// EAR CHECK: 107.7 s h5 — captions “I have some pride. — DO YOU? — NO.”, whisper “I have some pride do you know”: the
//   key needs “No” as Chandler's own one-word answer to “Do you?”
import type { Clip } from '../types.ts';

export const needyCall: Clip = {
  id: 'needycall', video: 'Or8-0edWdrc', title: 'Chandler Is Desperate and Needy', dur: 255, wpm: 134, band: 'slow',
  tags: ['電話', '恋愛'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 — blind ~50 %: "never got the message" was weakly tied to the end. Now "too busy to call back" (from
    //   "she's on the other line", 138 s).
    // why: too busy ← "she's on the other line… gonna call me back" (138 s) heard as the reason; decided not to ←
    //   Chandler's own "choosing not to call me" (86 s) taken as the answer
    { id: 'g1', skill: 'gist', level: 'B2', point: 'calling', seg: [0, 213],
      stem: 'By the end, what turns out to be true about the call Chandler waited for?',
      choices: ['She had been trying to call him all along', 'She had decided not to call him back at all',
                'She had been too busy to call him back'], a: 0,
      cue: '最後に訪ねてきた人が、来た理由として話すこと。',
      said: '一日中電話を待ち、無視されたと思いこむが、最後に彼女は「ずっと電話していた」と現れる。',
      mean: '心配はすべて空回りだった、という流れ。彼女は返事をしようとしていた。',
      trap: '途中の思いこみや「別の電話中」に引かれやすい。場面の答えは最後に本人の口から出る。',
      use: 'Turns out I was worried for nothing.（結局、心配しすぎだった）' },

    // R fix: V2 + K6 — blind 70 %: "rehearsed to sound offhand" was the only nuanced choice. Plain wording for all three.
    // why: rambling ← "working on for two hours" heard as a long message (the one we heard is short); second go ←
    //   "Oh, god" after he hangs up heard as a botched first attempt
    { id: 'i1', skill: 'infer', level: 'C1', point: 'rehearse', reveals: ['hours'], seg: [6.8, 21.3],
      stem: 'What does the friend’s question show about the message Chandler just left?',
      choices: ['It took far more work than it sounds', 'It was far longer than it needed to be',
                'It was his second go at the same call'], a: 0,
      cue: 'メッセージの短さと、友だちが言う時間の長さ。',
      line: 'Give me a call when you get a chance. Bye-bye. — That’s what you’ve been *working on for the past 2 hours*?',
      said: '「電話ちょうだい、じゃあね」と軽く入れたあと、「2時間それを練ってたの？」と言われる。',
      mean: '気軽に聞こえた留守電は、実は練りに練った台本だった。',
      trap: '2時間と聞くと長い伝言を想像しやすいが、聞こえた伝言は短い。短さと時間の差が要点。',
      use: 'Oh, I didn’t think you’d pick up!（あ、出ると思わなかった！）' },

    // why: twenty / twelve ← the same "tw-" start before a weak ending; "two" is short and easy to stretch
    // R fix: B1 — the stem says he's been "working on the message", which gives away i1's key.
    { id: 'n1', skill: 'number', level: 'B1', point: 'hours', reveals: ['rehearse'], seg: [17.4, 21.3], keep: true,
      stem: 'How long has Chandler been working on the message, says a friend?',
      choices: ['Twenty minutes', 'Two hours', 'Twelve hours'], a: 1,
      cue: '「for the past」のあと。',
      line: 'for the *past 2 hours*?',
      said: '「2時間もそれにかかってたの？」とあきれている。',
      mean: 'for the past ～ ＝「この〜の間ずっと」。短い留守電に2時間、という落差。',
      trap: 'twenty も twelve も two と同じ「トゥ」で始まる。語尾に音が続くかで聞き分ける。',
      use: 'I’ve been here for the past hour.（この1時間ずっとここにいたよ）' },

    // R fix: V2 — blind 50 %: "playing it back" was weak. Now "timing it" (another way to fuss over a message).
    // why: phoning ← "honing" and "phoning" differ by one sound, and he is waiting on a phone; timing ← a fussy caller
    //   checks the length, and "two hours" is about time
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'honing', seg: [21, 24.3],
      stem: 'What does Chandler say he has been doing with the message?',
      choices: ['Polishing it until it sounds right', 'Phoning her again and again with it',
                'Timing it so it doesn’t run too long'], a: 0,
      cue: '「Hey」のあと、I’ve been に続く一語。',
      line: 'Hey, I’ve been *honing* it.',
      said: '「磨きをかけてたんだよ」と開き直っている。',
      mean: 'hone ＝ 刃物を研ぐ → 技や文章に磨きをかける。短い留守電には大げさな語。',
      trap: 'phoning と一音違いで、電話の場面なので引かれやすい。h の音と、it が何を指すかで判断。',
      use: 'I’m honing my speech for Friday.（金曜のスピーチを練ってるところ）' },

    // why: cooking ← dishes = a kitchen at home; party ← "some kind of life" heard as friends over for dinner
    { id: 'd1', skill: 'detail', level: 'B1', point: 'dishes', seg: [24.2, 30.6],
      stem: 'When asked about the dish noises, what does Chandler say they were for?',
      choices: ['To sound like he was out at a restaurant', 'To sound like he was cooking a meal at home',
                'To sound like he had friends over for dinner'], a: 0,
      cue: '「I want her to think」のあと。',
      line: 'I want her to think I might be *in a restaurant*.',
      said: '食器の音を立てたのは、レストランにいると思わせたかったから。',
      mean: '家で電話を待っている、と思われたくない。外で楽しくしているふりの演出。',
      trap: '食器の音から料理や食事会を想像しやすい。I want her to think のあとが本人の説明。',
      use: 'I want them to think I’m busy.（忙しいと思われたいんだ）' },

    // why: for the record ← reference = 記録・参照, so "for the record"; just this once ← "future" heard as a condition
    //   on lending it ("next time, no")
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'future', seg: [41.9, 46.4],
      stem: 'In the reply to “Can I use your phone?”, what does the opening phrase mean?',
      choices: ['Just so you know for next time', 'Just so it’s on the record now', 'Just this once, as a favor'], a: 0,
      cue: '「Yeah」のあと、but に続く3語。',
      line: 'Yeah. But *for future reference*, that thing in your hand can also be used as a phone.',
      said: '「いいけど、今後のために言うと、手に持ってるそれも電話になるよ」。',
      mean: '「今後のために言っておくと」。軽い皮肉の前置きにも使う。',
      trap: 'reference を「記録」と取ると for the record に聞こえる。future は「次からは」。',
      use: 'For future reference, I take my coffee black.（今後のために、コーヒーはブラックで）' },

    // why: other callers ← many beeps = many calls, so many admirers (the jealous reading); tape full ← lots of beeps
    //   heard as a machine that can't take more
    { id: 'd2', skill: 'detail', level: 'B2', point: 'beeps', seg: [57, 64.4],
      stem: 'According to the friend, what would “a lot of beeps” on her machine mean?',
      choices: ['She hasn’t listened to her messages yet', 'Lots of other men have been calling her',
                'Her tape is full, so his message was lost'], a: 0,
      cue: '「that means」のあと。',
      line: 'if she has a lot of beeps, that means she *probably didn’t get her messages yet*.',
      said: '留守電に電話してピーが多ければ、まだメッセージを聞いていないということ。',
      mean: '返事がないのは無視ではないかも、と安心させる提案。',
      trap: 'ピーが多い＝電話が多い、と考えると別の男の話に飛ぶ。that means のあとが説明。',
      use: 'That means she’s probably still at work.（ってことは、たぶんまだ仕事中だね）' },

    // R fix: V2 — blind 55 %: "met through an ad" was weak. Now "Danielle's ad" (whose ad it is).
    // why: her ad ← "personal ad" heard as Danielle's, since she's the topic; snooping ← "you saw my ad" taken literally,
    //   as if the friend had read something private
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ad', reveals: ['needy'], seg: [65.2, 72],
      stem: 'Why does the line about a “personal ad” get a laugh?',
      choices: ['Those three words sound like his own dating ad', 'Those words are what Danielle wrote in her ad',
                'It means the friend has been reading his ad'], a: 0,
      cue: '直前に並べた3つの形容詞と、ad の関係。',
      line: 'a little *desperate, needy, pathetic*? — Ah, you obviously saw *my personal ad*.',
      said: '「必死で、さみしがりで、情けなく見える？」と聞き、「僕の恋人募集広告を見たね」と続ける。',
      mean: '自分の欠点3つを、広告の自己紹介文に見立てた自虐。',
      trap: 'ad を彼女の広告や、のぞき見の話と取りやすい。my ad と、直前の3語を指していると聞く。',
      use: 'Clearly, you’ve read my résumé.（さては僕の履歴書を読んだね）' },

    // why: cut off ← the machine he meant to reach, so the call "failed"; busy ← no beeps heard as a busy signal
    { id: 'd3', skill: 'detail', level: 'B1', point: 'answered', seg: [75, 78.4],
      stem: 'When asked how many beeps there were, what does Chandler report?',
      choices: ['Danielle picked up the phone herself', 'Her machine cut him off before the beep',
                'Her line was busy the whole time'], a: 0,
      cue: '「How many beeps?」の答え、2語。',
      line: 'How many beeps? — *She answered.*',
      said: '留守電のピーを数えるつもりが、本人が電話に出てしまった。',
      mean: 'answer ＝ 電話に出る。機械ではなく本人が出た、という報告。',
      trap: 'beeps を聞いて機械の話が続くと思いやすい。answer は電話では「出る」の意味。',
      use: 'I called, and she actually answered.（電話したら、本人が出たんだ）' },

    // R fix: V2 — blind 55 %: "greet her more politely" was weak. Now "comforting him" (a soft "you see" read as
    //   sympathy).
    // why: comforting ← the gentle "You see" read as sympathy after a bad moment; call back ← "where you'd use" heard
    //   as a plan for the next call
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'hello', reveals: ['answered'], seg: [75.3, 83.6],
      stem: 'After hearing the call’s outcome, what is the friend’s next line doing?',
      choices: ['Teasing him for freezing up and not speaking', 'Comforting him after an awkward moment',
                'Telling him to call back and say hello'], a: 0,
      cue: '「You see」のあと、we talked about で終わる文。',
      line: 'You see, this is where you’d use that *“hello” word* we talked about.',
      said: '「ここで、前に教えた『もしもし』って言葉を使うんだよ」と言う。',
      mean: '何も言えずに切ったことを、子どもに教えるような口調でからかっている。',
      trap: 'なぐさめやアドバイスに聞こえるが、もう遅い。終わったことへの「ここで使うんだよ」は、からかい。',
      use: 'This is where you say thank you.（ここで「ありがとう」って言うところだよ）' },

    // anchor: 76.8–83 s "She answered." then "this is where you'd use that hello word we talked about": a word "we talked
    //   about" can only be a lesson, and "hello" is the one word every caller knows
    // R fix: V2 — blind 50 %: "too quietly" was weak. Now "says hello at the wrong times" ("this is where you'd use"
    //   heard as a timing lesson); "She answered" and the silence refute it.
    // why: code word ← "that word we talked about" heard as a planned signal between friends; wrong times ← "this is
    //   where you'd use" heard as a lesson on timing, not on the word
    { id: 'nt1', skill: 'pragma', level: 'C2', point: 'hello', reveals: ['answered'], seg: [75.3, 83.6],
      stem: 'Taken literally, what would the friend’s remark say about Chandler?',
      choices: ['That he had to be taught to say hello', 'That they had agreed on a secret code word',
                'That he says hello at all the wrong times'], a: 0,
      cue: '「we talked about」が付くと、どんな言葉になるか。',
      line: 'this is where you’d use that *“hello” word we talked about*.',
      said: '「前に話し合った『もしもし』という言葉を、ここで使うんだよ」と言う。',
      mean: '本気なら「挨拶の仕方を教わった人」になる。ありえない前提で、固まった彼を子ども扱いする冗談。',
      trap: 'we talked about から、二人で決めた合図を想像しやすい。誰でも知っている語に付けた点がおかしさ。',
      use: 'Remember that “no” word? Try it sometime.（「ノー」って言葉、たまには使ってみて）' },

    // why: by accident ← "snub" is rare, and "forgotten" fits a missed call; to his face ← snub heard as a direct
    //   rejection, like "turned down"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'snubbed', seg: [84, 89.8],
      stem: 'How does Chandler describe the way Danielle is treating him now?',
      choices: ['Ignored on purpose', 'Forgotten by accident', 'Turned down to his face'], a: 0,
      cue: '「Now I’m needy and」のあと、一語。',
      line: 'She obviously got my message and is *choosing not to call me*. Now I’m needy and *snubbed*.',
      said: 'メッセージは届いたのに、わざとかけてこない。今は「冷たくされた」状態。',
      mean: 'snub ＝ わざと無視する。choosing not to がその説明。',
      trap: '電話が来ないので「忘れた」と取りやすい。choosing（選んで）とあるので、わざと。',
      use: 'I said hi, and he totally snubbed me.（挨拶したのに、完全に無視された）' },

    // R fix: V2 — blind 60 %: "denies leaving a message" was weak. Now "snaps no to end the argument".
    // why: pride intact ← "No" heard as his answer to "Why don't you just call her?" (no, I won't); snaps ← "No" heard
    //   as a curt end to the friends' pushing
    { id: 'h5', skill: 'humor', level: 'C1', point: 'pride', seg: [102.8, 110.5], retired: true,
      stem: 'Why does Chandler’s one-word answer at the end get a laugh?',
      choices: ['He gives up his pride the moment it’s doubted', 'He firmly refuses the idea of calling her',
                'He snaps “no” just to end the argument'], a: 0,
      cue: 'メッセージの話のあと、短い問いと一語の答え。',
      line: 'I left a message. *I have some pride.* — *Do you?* — *No.*',
      said: '「メッセージは残した。プライドがある」と言うが、「ある？」と聞かれて「ない」と即答。',
      mean: '言った直後に自分で認めてしまう落差が笑い。このあと彼は電話をかける。',
      trap: 'No を「電話しない」や打ち切りと取りやすい。No は直前の Do you? への答え。',
      use: 'I have some self-control. Okay, I don’t.（自制心はある。…うそ、ない）' },

    // why: can ← the t of "can't" barely sounds, so only the vowel tells; could ← "I could call her" fits a friend's
    //   suggestion, and its d is just as weak
    { id: 's1', skill: 'sound', level: 'B2', point: 'cant', seg: [104.1, 107.1],
      stem: 'Fill the gap: “I ___ her. I left a message.”',
      choices: ['can call', 'can’t call', 'could call'], a: 1,
      cue: '最初の I のすぐあと、母音の長さ。',
      line: '*I can’t call* her. I left a message. I have some pride.',
      said: '「電話できないよ。メッセージは残したし、プライドがある」。',
      mean: 'can’t は t がほぼ消え、「キャーン」と母音が長く強い。can は「クン」と弱く短い。',
      trap: 't を探すと聞き逃す。強く長い「キャー」なら can’t。後ろの理由とも合う。',
      use: 'I can’t talk now. Call you later?（今話せないんだ。あとでかけていい？）' },

    // R fix: V2 — blind 60 %: "get off the phone fast" was weak. Now "hint she should call more" (an indirect
    //   Japanese-style complaint).
    // why: sorry ← "I don't know if you tried" heard as an apology for missing her; hint ← "if you tried to call me"
    //   heard as an indirect "you should call me" (遠回しの不満)
    { id: 'i6', skill: 'infer', level: 'C1', point: 'shutoff', seg: [122.2, 130],
      stem: 'Why does Chandler tell Danielle what happened to his phone?',
      choices: ['To give a reason she might not have reached him', 'To say sorry for a call he knows he missed',
                'To hint that she should call him more often'], a: 0,
      cue: '「I don’t know if you tried」で始まる文。',
      line: 'I don’t know if you tried to call me because… idiot that I am, I *accidentally shut off my phone*.',
      said: '「もし電話くれてたら、ごめん、うっかり電源を切ってた」と言う。',
      mean: '自分から電話した気まずさを、相手が電話できなかった理由でごまかす作り話。',
      trap: 'お詫びに聞こえるが、if you tried と仮定の話。電話は動いていると思っている。',
      use: 'If you tried to call, my phone died.（もし電話くれてたら、電池切れで）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'shutoff', seg: [127.6, 130.1],
      stem: 'Type what he says: “I accidentally ___.” (4 words)', answer: 'shut off my phone',
      cue: '「accidentally」のあと、文の終わりまで。',
      line: 'I accidentally *shut off my phone*.',
      said: '「うっかり電話の電源を切っちゃって」と言う。',
      mean: 'shut off が「シャロフ」とつながる。t が母音にはさまれて弾む。',
      trap: 'shut と off が一語に聞こえ、語数を少なく数えやすい。4語を数えてから書く。',
      use: 'Don’t forget to shut off the lights.（電気を消すのを忘れないでね）' },

    // R fix: V2 — blind 50 %: "waiting in a line" didn't fit a phone call. Now "a bad line" (line = the connection).
    // why: with another man ← "the other line" heard as "the other man"; bad line ← line = 回線, so a poor connection
    { id: 'f5', skill: 'phrase', level: 'B1', point: 'otherline', seg: [137, 141.2],
      stem: 'Why can’t Danielle talk right now, as Chandler tells it?',
      choices: ['She is busy on another call', 'She has a bad line right now', 'She is out with another man'], a: 0,
      cue: '「She’s on the」のあと。',
      line: 'She’s *on the other line*. She’s going to call me back.',
      said: '「彼女は別の電話に出てる。かけ直してくれるって」。',
      mean: 'on the other line ＝ キャッチホンで別の電話に出ている。',
      trap: 'line だけ聞くと「回線が悪い」と取りやすい。the other line で「もう一本の電話」。',
      use: 'Sorry, I’m on the other line.（ごめん、別の電話に出てるの）' },

    // R fix: V2 — blind 55 %: "snaps at the friend" was weak. Now "the friend takes his curse as aimed at her".
    // why: wrong guess ← distracted Chandler gets the clue wrong, and "Thanks" is sarcastic; aimed at her ← "damn it"
    //   heard as cursing the friend, and "Thanks" as her sarcastic reply
    { id: 'h3', skill: 'humor', level: 'C1', point: 'ring', seg: [149.6, 155.3],
      stem: 'Why does the crossword moment get a laugh?',
      choices: ['His plea to the phone fits the clue', 'His guess at the clue is wrong but thanked',
                'The friend takes his curse as aimed at her'], a: 0,
      cue: '「Four letters」のヒントと、そのあとの答え。',
      line: 'Four letters, circle or hoop. — *Ring, damn it, ring.* — *Thanks.*',
      said: 'クロスワードの「4文字、円や輪」に、電話への「鳴ってくれ」が答えになる。',
      mean: 'ring ＝ 輪、そして「鳴る」。電話への言葉を、相手は答えと受け取る。',
      trap: 'damn it で怒っているように聞こえる。Thanks は皮肉でなく、答えへのお礼。',
      use: 'Come on, ring already!（ほら、早く鳴ってよ！）' },

    // R fix: V2 — blind 65 %: "annoyed a friend touched it" was weak. Now "embarrassed, laughing it off".
    // why: relieved ← it explains her silence, so it could be good news; laughing off ← "Mother of God" heard as a
    //   light, comic oops
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'turnedoff', seg: [158.4, 170],
      stem: 'When Chandler realizes why the phone got no answer, how does he react?',
      choices: ['Horrified at his own mistake', 'Relieved to have found the problem', 'Embarrassed, but laughing it off'], a: 0,
      cue: '同じ文を2回。2回目の前に付く言葉。',
      line: 'There was no answer. — *I turned it off.* *Mother of God*, I turned it off.',
      said: '友だちの電話がつながらなかったと聞き、「切ってた…なんてことだ」と言う。',
      mean: 'Mother of God は強い驚きと絶望。電話を逃したかもと気づいた。',
      trap: '原因が分かって安心、とも取れるが、I turned it off は自分のせいだという告白。',
      use: 'Oh no, I left it at home.（しまった、家に置いてきた）' },

    // anchor: 128.1 s "I accidentally shut off my phone" (said as an excuse), then 166–171.8 s "I turned it off… — Just
    //   like you told her you did": "told her you did" names the earlier excuse
    // why: told her to call ← "give me a call" (7.3 s) and "you told her" heard together; told her fine ← "I'm fine"
    //   (120 s) is the other thing he told her, and "did" is short enough to miss
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'shutoff', reveals: ['turnedoff'], seg: [165.8, 176],
      stem: 'What irony is the friend pointing out?',
      choices: ['The excuse he made up for her turned out true', 'He asked her to call, then made calling impossible',
                'He told her he was fine, but he clearly isn’t'], a: 0,
      cue: '「Just like you told her」のあとの、最後の短い語。',
      line: 'I turned it off. — *Just like you told her you did.* — Just pointing out the *irony*.',
      said: '「電源を切ってた」と言う彼に、「彼女に言ったとおりだね。皮肉だなって」と返す。',
      mean: 'さっき電話でついた作り話が、本当になっていた。you did は「切った」を受ける。',
      trap: '「電話して」と頼んだ点も皮肉に見えるが、言われたのは told her you did。最後の did を聞く。',
      use: 'Ironically, I was early for once.（皮肉にも、その日に限って早く着いた）' },

    // R fix: V2 — blind 70 %: only the key had her drop by. "He calls again, she's busy" becomes "she drops by, and he
    //   can't wait to see her again".
    // why: lets it ring ← the earlier "I'm not going to talk to her" heard as how it ends; can't wait ← "maybe we could
    //   get together later" and the friends' cheering heard as his mood
    { id: 'g2', skill: 'gist', level: 'B2', point: 'end', reveals: ['calling'], seg: [194.2, 243.3],
      stem: 'How do things stand between Chandler and Danielle at the end?',
      choices: ['She drops by, and then he has doubts about her', 'She calls back, and he lets the machine get it',
                'She drops by, and he can’t wait to see her again'], a: 0,
      cue: '最後の場面、だれが来て、彼がそのあと何と言うか。',
      said: '彼女が様子を見に訪ねてきて、また会う話になる。そのあと彼は「どうかな」と言い出す。',
      mean: 'あれほど待っていた相手に、会えたとたん迷い始める、という終わり方。',
      trap: '会う約束や歓声で、喜んでいると思いやすい。最後の but のあとが本音。',
      use: 'Now I’m not so sure about him.（今になって、彼のことが分からなくなってきた）' },

    // why: busy ← "there was no answer" heard as the same as a busy line; machine full ← the beeps talk earlier
    { id: 'd4', skill: 'detail', level: 'B1', point: 'wrongnum', reveals: ['calling'], seg: [202.6, 213],
      stem: 'Why couldn’t Danielle reach Chandler at first?',
      choices: ['She had his number wrong', 'His line was always busy', 'His machine was full'], a: 0,
      cue: '「it turns out」のあと。',
      line: 'I’ve been calling you, but it turns out I *had your number wrong*.',
      said: 'ずっと電話していたが、番号を間違えていた。正しい番号ではだれも出なかった。',
      mean: 'it turns out ＝「あとで分かったことに」。返事がなかった本当の理由。',
      trap: 'no answer を「話し中」と取りやすいが、話し中は busy。前半は番号の話。',
      use: 'It turns out I had the wrong address.（実は住所を間違えてた）' },

    // R fix: V2 — blind 55 %: "shy" was weak. Now "cool; pleased but hides it" (I don't know read as playing it cool).
    // why: cool ← "I don't know" heard as playing it cool in front of friends (照れ隠し); thrilled ← the friends'
    //   cheering read as his mood
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'end', seg: [228.4, 243.3],
      stem: 'When the friends cheer about a second date, how does Chandler respond?',
      choices: ['Doubtful; he has second thoughts', 'Thrilled; he can’t wait to see her', 'Cool; he’s pleased but hides it'], a: 0,
      cue: 'みんなの歓声のあとの、短い答え。',
      line: '*I don’t know.* — You don’t know? — Oh, well, she seems very nice and everything, *but*…',
      said: '「2回目のデートだね」と言われ、「どうかな」と答え、「いい人だけど…」と続ける。',
      mean: 'nice and everything, but… は、ほめてから本音に入る形。',
      trap: '周りが盛り上がると、喜びや照れ隠しと思いやすい。but のあとが本音。',
      use: 'He’s nice and everything, but…（いい人なんだけどね…）' },

    // R fix: V2 — blind 75 %: "agreed too quickly" was weak. Now "repeating what his friends called him" (needy was
    //   said earlier, but by Chandler himself, 66 s).
    // why: quoting her ← "make sure you were okay" heard as her own admission; friends' word ← "needy" (66 s) was said
    //   earlier, so it's heard as the friends' label for him
    { id: 'h4', skill: 'humor', level: 'C1', point: 'needy', reveals: ['end'], seg: [235.4, 243.6],
      stem: 'Why does Chandler’s last question get such a big laugh?',
      choices: ['He has been much needier than her all day', 'He is quoting what she said about herself',
                'He is repeating what his friends called him'], a: 0,
      cue: '最後の一語を、前半の彼の言葉と比べて。',
      line: 'coming all the way down here just to see if I was okay. I mean, *how needy is that?*',
      said: '「僕が無事か見に、わざわざ来るなんて。どれだけ構ってほしいんだか」と言う。',
      mean: '一日中電話を待っていた本人が、相手を needy と呼ぶ。自分に気づかない皮肉。',
      trap: '彼女や友だちの言葉の引用と取りやすい。needy は前半で彼が自分に使った語。',
      use: 'Pot, meet kettle.（人のこと言えないでしょ）' },
  ]
};
