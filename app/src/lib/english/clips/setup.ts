// REVIEW 2026-11-16: pass 9, fix 10, drop 3, new 1; ear checks 2
// REVIEW open: p3 (dropped) — is the parking line (229.9 s) and “Danny, I feel a real connection” one speaker? The
//   captions run them together (“so I, I feel…”); if two, a pragma item on the trailing “so—” could come back
// “The Set Up - The Office US” (the official The Office channel, BEST OF SEASON 7): the office builds a fake company
// office to watch the salesman Danny sell; Danny turns the meeting around on Meredith, the replacements they send in
// get passed off as cleaners, and the setup falls apart when Michael walks in.
// Segments from the captions, words from whisper (2026-11-16). Untested: 21–30 s (“Paul Newman… The Stinger”: film
// knowledge, and “It's called the Stinger” is whisper only), 46–56 s (“Van Helsing”: needs vampire-film knowledge),
// 56–70 s (stray lines, unnamed speakers), 71–90 s (watchers talking over each other; whisper “handsome” vs captions
// “happy”), 112–126 s (“first date… third date”: innuendo), 150–159 s and 168–171 s (Stark Industries / “you're not
// gay”), 179–195 s and 213–229 s (mock Spanish), 251 s on (music). Speakers are named only where the audio names them
// (Jim, Danny, Meredith, Michael); others are “the planner”, “a watcher”, “the new man”.
// EAR CHECK: 166.3–168.5 s s1 — “gotta” (captions) vs “got to” (whisper); the item assumes one weak “gadda”
// EAR CHECK: 6.9–8 s x1 — “with a little tweaking” runs together (a little ≈ “alittle”, flapped t)
import type { Clip } from '../types.ts';

export const officeSetUp: Clip = {
  id: 'setup', video: 'VcQvAze0_PI', title: 'The Set Up  - The Office US', dur: 273, wpm: 155, band: 'mid',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %: the key was the only choice about selling); S4 (gist seg was 11.6 s, now 17.9 s)
    // why: notice ← "a different office" heard as the test itself (will he spot the fake?); rival offer ← "a different
    //   office" and "lure" heard as another company luring him away
    { id: 'g1', skill: 'gist', level: 'B1', point: 'plan', seg: [0, 17.9],
      stem: 'What does the planner want to see by using the fake office?',
      choices: ['How Danny sells when he thinks the client is real', 'Whether Danny will notice that the office is fake',
                'Whether Danny will turn down an offer from a rival'], a: 0,
      cue: '計画の説明の最後、短い動詞二つ。',
      line: 'We *lure Danny* to it and *watch him sell*.',
      said: 'オフィスを手直しして別の会社に見せ、ダニーを呼んで売りこみを見る計画。',
      mean: 'lure ＝ おびき寄せる。本番と思っている彼の営業ぶりを見るのが目的。',
      trap: '秘密や偽物という語から、正直さのテストに聞こえる。最後の watch him sell が目的。',
      use: 'I just want to watch you work.（仕事ぶりを見たいだけだよ）' },

    // R new: nt3 (C2) replaces nt2 to keep 2 C2 items (a C2 sound would ship retired until heard)
    // why: Jim ← his flat question can sound naive, as if he missed the point; Danny ← he is the plan's target, so the
    //   joke seems aimed at him
    // anchor: 0–6.8 s “of the utmost secrecy” → “Is that your office?” → “Yes, Jim.”: the grand secret is the planner's
    //   own office, and the “Yes” confirms Jim's flat question
    { id: 'nt3', skill: 'humor', level: 'C2', point: 'secret', seg: [0, 9.1],
      stem: 'In the opening exchange with Jim, who is the joke on?',
      choices: ['The planner, whose big secret is just his own office', 'Jim, who asks a question with an obvious answer',
                'Danny, who will soon be fooled by this very office'], a: 0,
      cue: '大げさな前置きと、ジムの短い質問への返事。',
      line: 'What I’m about to show you is of the *utmost secrecy*. — *Is that your office?* — *Yes*, Jim.',
      said: '「これから見せるのは極秘だ」と大げさに始めると、ジムが「それ、あなたのオフィス？」と聞き、「そうだ」と答える。',
      mean: '極秘と言って見せたのは自分の部屋。大きな前置きと中身の落差で、言った本人が笑われる。',
      trap: 'ジムの質問を的外れと取りやすい。答えが Yes なら、質問は図星だった。',
      use: 'Don’t make it sound like a big secret.（大げさな秘密みたいに言わないで）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'tweak', seg: [6.4, 9.1],
      stem: 'Type what he says: “___, it becomes a different office.” (4 words)', answer: 'with a little tweaking',
      cue: '「Yes, Jim」のあと、文の頭の4語。',
      line: '*with a little tweaking*, it becomes a different office.',
      said: '「ちょっと手を加えれば、別の会社のオフィスになる」。',
      mean: 'tweak ＝ 細かく調整する。a little tweaking で「少し手直しすれば」。',
      trap: 'a little がつながり「アリル」に近い。t が弾んで、little が短く聞こえる。',
      use: 'It just needs a little tweaking.（ちょっと手直しすれば大丈夫）' },

    // why: which movie ← "The what?" just before is a question, so the reply sounds like one too; nothing like it ←
    //   "I think" heard as disagreeing with the comparison itself
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'sting', seg: [13.8, 20.5],
      stem: 'When the planner compares the setup to a movie, what does the reply do?',
      choices: ['It gently corrects the title he used', 'It asks which movie he is thinking of',
                'It says the plan is nothing like the movie'], a: 0,
      cue: '「like the movie」への返事の、最初の3語。',
      line: 'This is a *stinger*. … Like the movie. — *I think you mean* The Sting.',
      said: '「スティンガーだ、映画の」に「スティングのことでしょ」と返す。',
      mean: 'I think you mean ＝ 相手の言い方を、角を立てずに直す決まった形。',
      trap: 'I think を「反対」と取ると、比較の否定に聞こえる。you mean の後が正しい形。',
      use: 'I think you mean Tuesday.（火曜日のことだよね）' },

    // why: one/ten ← short words at a fast check-in; twelve ← "two" and "twelve" share the tw- start
    // R fix: S4 (seg 2.9 s, under 3 s, and ended inside “hon”)
    { id: 'n1', skill: 'number', level: 'B1', point: 'time', seg: [31.4, 34.6],
      stem: 'What time is Danny’s appointment?',
      choices: ['One o’clock', 'Two o’clock', 'Ten o’clock', 'Twelve o’clock'], a: 1, keep: true,
      cue: '受付の確認の一言、o’clock の前。',
      line: 'You’re *two o’clock*? — Thanks, hon.',
      said: '受付で「2時のお約束の方ですね？」と確かめられる。',
      mean: 'You’re two o’clock? ＝ 予約の時刻で人を呼ぶ、受付の言い方。',
      trap: 'two と twelve はどちらも tw で始まる。twelve なら最後に「ルヴ」が付く。',
      use: 'Hi, I’m your three o’clock.（3時に予約している者です）' },

    // why: ran a company ← "head of the company" is said, but as the part she plays; good actor ← "perfect choice to
    //   play" heard as praise for her acting
    { id: 'd1', skill: 'detail', level: 'B1', point: 'meredith', seg: [34.7, 45.4],
      stem: 'What reason is given for choosing Meredith?',
      choices: ['Her lunch break matched the meeting time', 'She once ran a company of her own',
                'She is the best actor in the office'], a: 0,
      cue: '「perfect choice」のすぐあとの理由。',
      line: 'Her *lunch break lined up* with our appointment with Danny',
      said: '「メレディスが適役だった。昼休みがダニーとの約束の時間と重なったから」。',
      mean: 'line up with ＝ 時間がぴったり重なる。選んだ理由はそれだけ。',
      trap: 'perfect choice を演技力のほめ言葉と取りやすい。直後の理由の中身を聞く。',
      use: 'Does Friday line up with your schedule?（金曜で予定は合う？）' },

    // why: real praise ← "perfect choice" taken at face value; she'll ruin it ← the dry delivery heard as sarcasm about
    //   her (the sincerity flip: a low bar heard as a put-down)
    // anchor: 35.2–44.9 s “the perfect choice… Her lunch break lined up with our appointment… that's it. That's really
    //   all we were looking for”: the only reason named is timing, and “all we were looking for” says so
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'meredith', seg: [34.7, 45.4],
      stem: 'After the comment to the camera, how should we hear “perfect choice”?',
      choices: ['As true only because she happened to be free', 'As real praise for how well she can play a boss',
                'As sarcasm, because they expect her to fail'], a: 0,
      cue: '「perfect」と、そのあとの理由の小ささ。',
      line: 'Meredith was the *perfect choice*… Her lunch break lined up… *That’s really all we were looking for*.',
      said: '「社長役にぴったりだった」と言い、理由は昼休みの時間だけ、「求めていたのはそれだけ」と続ける。',
      mean: '大きなほめ言葉のあとに小さな理由を出すと、ほめ言葉が中身を失う。失敗の予想ではなく、条件が低かっただけ。',
      trap: '冷めた言い方を皮肉と取りやすい。皮肉か本気かは、言葉が何を理由に挙げるかで決める。',
      use: 'He was perfect. He was free.（彼が最適だった。暇だったから）' },

    // why: amused ← the scene is funny, and "stop looking at him" can sound teasing; sorry ← "I'm sorry" is said right
    //   after, but by her
    // R fix: S4 (seg ended inside “I'm sorry”, which the line quotes)
    { id: 't1', skill: 'attitude', level: 'B1', point: 'pull', seg: [90.3, 95.7],
      stem: 'How does the person giving Meredith instructions sound?',
      choices: ['Impatient with her for losing focus', 'Amused by how much she seems to like Danny',
                'Sorry for putting her in this spot'], a: 0,
      cue: '命令の形が二つ続くところ。',
      line: '*Pull it together*, all right? *Stop looking at him*. — I’m sorry.',
      said: '「しっかりして。彼を見るのをやめて」と言われ、メレディスが謝る。',
      mean: 'pull it together ＝ 気を取り直す。命令を重ねて、いら立っている。',
      trap: '場面がおかしいので面白がっているように聞こえる。謝っているのは言われた側。',
      use: 'Pull it together. We’re on in five.（しっかり。あと5分で本番）' },

    // R drop: p2 — V4 (a detail tagged pragma) and its key restated f1's (“see if she suits him” = “a good fit”), on
    //   i1's point; nothing it tested is lost

    // R fix: V2 (blind 70 %: healthy and paper size were fillers next to a sales meeting)
    // why: budget ← "fit" as in "fits the budget", the sales reading; supplier ← the usual sales-call script (are you
    //   happy with who you buy from?)
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'fit', seg: [102.6, 107.6],
      stem: 'What does Danny say he wants to find out by meeting her?',
      choices: ['If the two of them would work well together', 'If his prices would fit within her budget',
                'If she is happy with her current supplier'], a: 0,
      cue: '「see if we’d be a」のあとの2語。',
      line: 'I’m here to meet you, see if we’d be a, you know, *good fit*.',
      said: '「会って、うまくやっていける相手か見たい」。',
      mean: 'a good fit ＝ 相性がいい、組む相手として合う。人や会社に使う。',
      trap: 'fit を「予算に合う」と取りやすい。人について a good fit と言えば相性。',
      use: 'I think we’d be a good fit.（私たち、相性いいと思う）' },

    // R fix: V4 (the watcher says it outright: a detail, not an infer); V2 (blind 55 %): the reversed her/him reading
    //   replaces "about to sell her paper"
    // why: reversed ← weak "her"/"him" lost, and the plan expected Danny to do the selling; name slip ← "Van Helsing"
    //   has just been an issue
    { id: 'i1', skill: 'detail', level: 'B2', point: 'flip', seg: [107.4, 112.3],
      stem: 'What has the watcher just realized?',
      choices: ['Danny is getting Meredith to sell to him', 'Meredith is getting Danny to sell to her',
                'Meredith has forgotten her made-up name'], a: 0,
      cue: '「Oh my God」のあと、誰が誰に売るか。',
      line: 'Oh, my God. *He’s making her sell to him*.',
      said: '「なんてこと、彼が彼女に売りこませてる」と気づく。',
      mean: 'make 人 do ＝ 〜させる。売りに来た人が、逆に相手に売りこませている。',
      trap: 'sell だけ拾うと、彼が売る話に聞こえる。her と him の順番で向きが分かる。',
      use: 'She made me pay for dinner.（彼女に夕食代を払わされた）' },

    // R fix: V2 (blind 55 %): "really" in the stem pointed at the non-literal choice, and "bigger office" was weak
    // why: work from home ← "never been a desk man" read literally (he says "on the road", not home); fake office ← the
    //   learner knows it's fake, Danny doesn't
    { id: 'i2', skill: 'pragma', level: 'C1', point: 'desk', seg: [128.6, 136.5],
      stem: 'When Danny brings up the desk, what is he doing?',
      choices: ['Making the meeting feel closer and less formal', 'Explaining why he would rather work from home',
                'Pointing out that the office looks wrong'], a: 0,
      cue: '「so far apart」と、そのあとの自分の話。',
      line: 'what is with this desk *keeping us so far apart*? I’ve never been a desk man.',
      said: '「この机のせいで遠いよね。机に向かう仕事は性に合わない」と言い、距離を詰める。',
      mean: '机を「二人を隔てる物」と言って、商談を気楽な場にする営業の手。',
      trap: 'desk man を「在宅派」と文字どおりに取りやすい。far apart は人と人の距離の話。',
      use: 'Let’s not be so formal.（そんなに堅くならずにいこう）' },

    // why: needed elsewhere ← "They need Meredith somewhere else" is said, but as the cover story later; seen through ← "Oh,
    //   man" heard as alarm that Danny knows
    // R fix: S4 (seg started inside “Oh, man”, 142.9 s)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'drink', seg: [142.4, 150.6],
      stem: 'Why do the watchers decide to send someone else in?',
      choices: ['The talk has turned to drinks, not paper', 'Meredith is needed somewhere else in the office',
                'Danny has worked out that it is a setup'], a: 0,
      cue: '直前の部屋の会話が、何の話になっているか。',
      line: 'So, *what’s your drink*? Your vodka man? Me too. — We’ve got to get someone else in there *right now*.',
      said: '部屋では好きなお酒の話になり、外の人たちが「今すぐ別の人を入れないと」と言う。',
      mean: '商談が飲み友だちの雑談になり、売りこみが見られない。だから人を替える。',
      trap: '「よそで必要」は、あとでダニーに使う口実。本当の理由は直前の会話の中身。',
      use: 'So, what’s your drink?（で、何飲む？）' },

    // why: pitch at once ← "make him pitch to you" is said, as the next step; end the meeting ← "get her out" heard as
    //   getting everyone out
    { id: 'd2', skill: 'detail', level: 'B1', point: 'out', reveals: ['gotta'], seg: [158.6, 164.6],
      stem: 'What is the new man’s first job once he goes in?',
      choices: ['Getting Meredith out of the room fast', 'Making Danny start his sales pitch at once',
                'Telling Danny the meeting is over'], a: 0,
      cue: '「taking over」のあとの指示。',
      line: 'So, you’re taking over. You just gotta *get her out of there* as soon as you can.',
      said: '「君が代わる。まずはできるだけ早く彼女を部屋から出して」。',
      mean: 'get 人 out of there ＝ その場から連れ出す。最初の仕事はメレディスを外すこと。',
      trap: '売りこませる話はこのあとの手順。then のあとに来るのが次の段階。',
      use: 'Get me out of here.（ここから連れ出して）' },

    // why: wanna ← the same shape (-nna), and "want to see" fits; gonna ← "you're gonna see" fits the plan too
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotta', seg: [165.8, 169],
      stem: 'Fill the gap: “You ___ see what he’s got.”',
      choices: ['gotta', 'wanna', 'gonna'], a: 0,
      cue: '「pitch to you」の次、見る前の短い音。',
      line: 'Then make him pitch to you. — You *gotta* see what he’s got.',
      said: '「売りこませて。彼の実力を見なきゃ」。',
      mean: 'gotta ＝ got to。「〜しなきゃ」で、t が弾んで「ガダ」に近い。',
      trap: 'wanna、gonna も同じ形で聞き分けにくい。真ん中が「ダ」なら gotta。',
      use: 'You gotta try this.（これ絶対食べてみて）' },

    // R fix: V2 (blind 60 %: "go along" was the only improv-like choice)
    // why: get out ← "roll" as in "let's roll" (leave), plus "get her out of there as soon as you can" in the same
    //   briefing; let Meredith handle it ← "doesn't speak English" plans are in the air, so staying quiet sounds safe
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'roll', seg: [172.2, 175.2],
      stem: 'What is the new man told to do if something unexpected happens?',
      choices: ['Go along with it and carry on', 'Get out of there as fast as he can',
                'Keep quiet and let Meredith handle it'], a: 0,
      cue: '「if anything else happens」のあと。',
      line: 'if anything else happens, just *roll with it*.',
      said: '「何か起きても、そのまま合わせて」。',
      mean: 'roll with it ＝ 流れに合わせる、その場で対応する。',
      trap: 'roll を「出発する」と取ると逃げる指示に聞こえる。with it が付けば、流れに乗る。',
      use: 'Plans changed. Just roll with it.（予定変更。合わせていこう）' },

    // why: Danny pitches ← the plan as briefed; Danny leaves ← a setup this odd would make anyone walk out
    { id: 'g2', skill: 'gist', level: 'B2', point: 'cleaner', seg: [177.4, 222.5],
      stem: 'How do the attempts to replace Meredith turn out?',
      choices: ['She passes each new man off as a cleaner', 'Meredith leaves, but Danny still won’t pitch',
                'Danny sees through it and walks out'], a: 0,
      cue: '新しい人が入るたびの、彼女の紹介の言葉。',
      line: 'This is Manuel, *my cleaning man*. … This is Esteban, *another cleaning man*.',
      said: '入ってきた人を「掃除の人よ」と紹介し、次の人も「もう一人の掃除の人」と言う。',
      mean: '連れ出されるはずのメレディスが居座り、来た人を掃除係にしてしまう。',
      trap: '作戦の説明から、うまく交代したと思いやすい。another で失敗の繰り返しと分かる。',
      use: 'This is Ken, another friend from work.（こちらケン、職場の友だち）' },

    // why: inherited it ← "a corporation you inherited from your father" is the earlier briefing's story; checking on
    //   her ← "Meredith is fired" heard as him reviewing her work
    { id: 'd3', skill: 'detail', level: 'B2', point: 'cover', seg: [195.6, 203.5],
      stem: 'In the second briefing, what is the new man told he has just done?',
      choices: ['Bought the company and fired Meredith', 'Inherited the company from his father',
                'Been sent to check on Meredith’s work'], a: 0,
      cue: '「hotshot」のあと、過去の出来事を言う二文。',
      line: 'You’ve *just bought this company*. *Meredith is fired*. It’s a whole new regime.',
      said: '「君は会社を買ったばかり。メレディスはクビ。新体制だ」と設定を伝える。',
      mean: '新しい持ち主という設定なら、ダニーは彼に売りこむしかない。',
      trap: '父から継いだ会社は前の作戦の設定。今回は just bought と fired を聞く。',
      use: 'There’s a whole new team now.（今はチームが一新したよ）' },

    // why: impressed ← "Great, sounds awesome" taken at face value; worried ← a bigger lie heard as risky, so the reply
    //   sounds cautious
    // R fix: S4 (seg started inside “He's got to pitch to you now”)
    { id: 't2', skill: 'attitude', level: 'C1', point: 'google', seg: [202.2, 209.55],
      stem: 'When the new man changes his cover story, how does the planner react?',
      choices: ['He humors him and moves him along', 'He is impressed by the bigger story',
                'He worries the story is too big'], a: 0,
      cue: 'ほめ言葉のすぐあとの「just」。',
      line: 'Stark Industries isn’t real. I run Google. — *Great, sounds awesome. Just* have him pitch to you.',
      said: '新しい人が勝手に設定を変えると、「いいね、最高。とにかく売りこませて」と返す。',
      mean: '早口のほめ言葉は聞き流しの合図。just で本題に引き戻している。',
      trap: 'awesome を本気の感心と取りやすい。すぐ just が来たら「それはいいから」。',
      use: 'Sounds great. Just be on time.（いいね。とにかく時間どおりに）' },

    // why: agreeing to fail ← "Will do" read word for word, as if he had said yes to letting them down; backs off ←
    //   "Yeah, sure" after it heard as him losing his nerve
    { id: 'h1', skill: 'humor', level: 'C1', point: 'willdo', seg: [209.1, 213],
      stem: 'Why is the new man’s answer to “Don’t let us down” funny?',
      choices: ['He “fixes” a normal yes into an odd one', 'He says yes to letting them down on purpose',
                'He promises too much, then backs off'], a: 0,
      cue: '返事を二回言う、その違い。',
      line: 'Don’t let us down. — *Will do*. — *Won’t do*.',
      said: '「がっかりさせるなよ」に「了解」と答え、すぐ「Won’t do」と言い直す。',
      mean: 'Will do は「了解」で通じる。字面を気にして直したせいで、かえって変な返事に。',
      trap: '字面どおり「失敗します」と言ったと取りやすい。決まり文句は字面より働きで聞く。',
      use: 'Don’t forget the keys. — Will do.（鍵忘れないで。—了解）' },

    // R drop: p3 — K1: the captions run on (“…others do that so I, I feel a real connection… I gotta get real”), so
    //   the parking line may be the same speaker's warm-up confession, which makes the "admitting something he feels
    //   bad about" distractor defensible; and the speaker is unnamed (see the open question)

    // R fix: V2 (blind 60 %): "panic" in the stem ruled out the harmless readings; "get real" read as "get serious"
    //   now makes a distractor, and the choices no longer guess the speaker's gender
    // why: business ← "get real" as "get serious, get down to business"; falling for Danny ← "a real connection" after
    //   Meredith's flirting
    { id: 'i4', skill: 'infer', level: 'C1', point: 'getreal', reveals: ['gotta'], seg: [233.6, 241],
      stem: 'How do the watchers take the line to Danny about a connection?',
      choices: ['As a sign the setup is about to be confessed', 'As a sign the talk is finally turning to business',
                'As a sign the speaker is falling for Danny'], a: 0,
      cue: '「connection」のあと、and で続く後半。',
      line: 'Danny, I feel a real connection to you, and *I gotta get real*. — No, no, no… *I’m going in*.',
      said: '「君とは通じ合える。正直に言わないと」で、外が「だめ、行く」と騒ぐ。',
      mean: 'get real ＝ 正直になる。打ち明けたら仕掛けがばれるので止めに行く。',
      trap: 'get real を「本題に入る」と取りやすい。周りの反応で意味を確かめる。',
      use: 'Okay, let me get real with you.（じゃあ、正直に言うね）' },

    // R drop: nt2 — V1: why Michael walking in ends the cover needs the show (that Danny knows him); the clip never
    //   ties the planner to the name, so the key also rests on telling voices apart (it was an ear check)
  ]
};
