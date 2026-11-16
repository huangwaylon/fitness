// REVIEW 2026-11-16: pass 9, fix 13, drop 0, new 0; ear checks 0
// “Ron Swanson's New Desk | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Chris gives
// Ron a round swivel desk in the open office so he's "more accessible than ever"; Ron uses it to swivel away from a
// complaining citizen, then goes to Chris to say the new setup is making his whole staff miserable.
// Segments from the captions, words from whisper (2026-11-16). The sources differ at 13 s (the "Swedish concept" word,
// garbled in both), 60 s (the park's name), 63.7 s ("some tea" / "Sun tea"), 83.7 s ("isn't" / "ain't"), 96 s (the
// keyboard word), 111 s ("swivel" / "swim" your…), 114–123 s (the speech's slips after "a pork"), 127.7 s ("first thing"
// / "first day"), 149 s ("Give them time. They'll adjust" / "give him time don't adjust"), 156.7 s ("marooning him on" /
// "marooning in my") and 190–197 s (whisper's "I may have a compromise… Weak" / the captions' "a kind of reminds… a
// weird"); no key rests on those words, and no line quotes them. The 169–173 s crude simile is left out of every line.
// No ear checks: every key stands on words both sources share; speakers are named only where an address in the audio
// ("What is it, Jerry?", "April, that is…", "Donna, you know…", "perceptive, Ron") or the title settles it.
import type { Clip } from '../types.ts';

export const ronDesk: Clip = {
  id: 'rondesk', video: 'FGgGLLhbf78', title: 'Ron Swanson\'s New Desk', dur: 217, wpm: 151, band: 'slow',
  tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %): "more privacy" was the plain opposite of the open-office setup; "look more modern"
    //   fits a flashy new desk, and "more accessible than ever" refutes it
    // why: modern ← a round swivel desk and "the Swedish concept" sound like a design upgrade for show; faster ← the
    //   usual reason for a new desk (the office-upgrade script), and "see how it works?"
    { id: 'g1', skill: 'gist', level: 'B2', point: 'access', seg: [2.7, 56.7],
      stem: 'What is Chris trying to change about how Ron works?',
      choices: ['Make Ron easier for everyone to reach', 'Make Ron look more modern to visitors',
                'Help Ron get through his work faster'], a: 0,
      cue: '最後の Chris の一文、more のあとの形容詞。',
      said: '回転する丸い机を置き、Ron の部屋は待合室に。「前より会いやすくなる」と言う。',
      mean: '机も部屋も、Ron を職員や市民から近づきやすくするための変更。',
      trap: '目新しい机と Swedish で、見た目の改装に聞こえやすい。狙いは Chris の最後の一文。',
      use: 'I want to be easier to reach.（もっと声をかけやすい人になりたい）' },

    // why: simplicity ← "Swedish" brings the plain Swedish-design image (a script, not the words); teamwork ← a round
    //   desk in the middle of the room looks like a team idea
    { id: 'd1', skill: 'detail', level: 'B1', point: 'equality', seg: [8.4, 15.3],
      stem: 'What idea does Chris say the desk stands for?',
      choices: ['Equality', 'Simplicity', 'Teamwork'], a: 0,
      cue: '「Swedish concept」の少しあと、or のあと。',
      line: 'This desk is the epitome of the Swedish concept of … or *equality*.',
      said: '「この机は、スウェーデンの考え方、つまり平等を体現している」と言う。',
      mean: 'epitome ＝ 見本・典型。スウェーデン語の単語のあと、or で英語に言いかえている。',
      trap: '知らない外国語で耳が止まりやすい。or のあとに言いかえが来るので、そこまで待つ。',
      use: 'It’s the epitome of good service.（まさに良いサービスのお手本）' },

    // R fix: V2 + §9.6 (blind 55 %): the key was the only two-part answer; all three are now "X; Y"
    // why: forgot ← "What is it, Jerry?" sounds as if Jerry came with a question; ignored ← "You told me…" heard as
    //   blame, as if Chris had brushed him off
    { id: 'h1', skill: 'humor', level: 'B2', point: 'name', seg: [15.2, 24.85],
      stem: 'Why is Jerry’s reply to “What is it, Jerry?” funny?',
      choices: ['He has nothing to say; he just did as told', 'He forgot his question; he just went blank',
                'He feels ignored; he wants Chris to notice'], a: 0,
      cue: '直前の Chris の頼みと、Jerry の返事を並べて。',
      line: 'What is it, Jerry? — *You told me to say your name.*',
      said: '「名前を呼んで」と言われて呼んだだけ。「何だい」に「呼べと言ったから」と返す。',
      mean: '机の実演のための呼びかけを、本当の用事のように受けて返している。',
      trap: 'What is it? は用件を聞く形なので、話があったと思いやすい。直前の指示に戻る。',
      use: 'You told me to, so I did.（そう言われたから、やったんだよ）' },

    // R fix: V2 (blind 70 %, partly from knowing Ron): "a bigger room" became "a room that shows his rank", a status
    //   reading as plausible as the key's
    // why: wall space ← "many walls" taken literally (room for shelves and pictures); rank ← "my office" heard as
    //   status, though he names walls, not size or title
    { id: 'i2', skill: 'infer', level: 'B2', point: 'walls', seg: [35.7, 41.7],
      stem: 'What does Ron’s question about his office show he values?',
      choices: ['Being shut away from other people', 'Having wall space for his own things',
                'Having a room that shows his rank'], a: 0,
      cue: '「What about」で始まる質問の最後の二語。',
      line: '*What about my office* and its *many walls*?',
      said: '「僕の部屋は？あのたくさんの壁は？」と聞く。',
      mean: 'What about…? は不安や反対の合図。壁の多い、人から離れた部屋が好き。',
      trap: 'walls を文字通り「飾る場所」と取りやすい。What about…? は「どうなるの」という抗議。',
      use: 'What about my parking space?（私の駐車場はどうなるの？）' },

    // R fix: V2 (blind 70 %): "the way it looked" was a filler; "loved it even though it got in his way" takes
    //   "annoying" as his own, but sincerely
    // why: secretly glad ← "I loved that pillar" heard as sarcasm, with "annoying" as his own complaint; loved it anyway
    //   ← "annoying" heard as his own trouble, with "loved" taken at face value
    { id: 'h2', skill: 'humor', level: 'C1', point: 'pillar', seg: [43.85, 56.7],
      stem: 'Why does Ron’s comment about the pillar get a laugh?',
      choices: ['It kept people from hanging around his door', 'He’s secretly glad the thing is finally gone',
                'He loved it even though it got in his way'], a: 0,
      cue: '「loved」のあと、何がうれしかったかの一文。',
      line: 'I *loved* that pillar. It made it *really annoying to stand in my doorway*.',
      said: '「あの柱は大好きだった。おかげで僕の部屋の入口に立つのが面倒だった」と言う。',
      mean: '面倒なのは訪ねて来る人。人を遠ざけてくれたから好き、という理由。',
      trap: 'annoying を本人の不満と取ると皮肉に聞こえる。誰にとって面倒なのかを聞く。',
      use: 'I like my quiet corner.（静かな自分の隅っこが好き）' },

    // why: put back later ← "get over it" heard as a soothing "it'll pass", missing "'cause it's gone"; think it over ←
    //   "over it" heard as "think it over"
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'getover', seg: [48.88, 56.7],
      stem: 'What does Chris tell Ron to do about the pillar?',
      choices: ['Stop being upset; it’s not coming back', 'Stay calm; it might be put back later', 'Think it over before he complains'], a: 0,
      cue: '柱の話のすぐあと、cause の前の三語。',
      line: 'Well, *get over it*, ’cause it’s gone.',
      said: '「まあ、あきらめて。もうないんだから」と返す。',
      mean: 'get over it ＝ 気持ちを切りかえて受け入れる。少し突き放す言い方。',
      trap: 'over を「越える」と取ると物の話に聞こえる。’cause 以下が理由。',
      use: 'It’s over. Time to get over it.（終わったこと。もう切りかえよう）' },

    // why: watered plants ← "sprinkler" brings lawns and gardens to mind; drank from it ← the sign's own words "Do not
    //   drink…" heard as what he did
    { id: 'd3', skill: 'detail', level: 'B1', point: 'tea', seg: [56.3, 67.4],
      stem: 'What did the man do with the sprinkler water?',
      choices: ['He made some tea with it', 'He watered his garden with it', 'He drank it from the sprinkler'], a: 0,
      cue: '看板の話のあと、So で始まる文。',
      line: 'So I *made some tea with it*, and now I have an infection.',
      said: '「だからそれでお茶をいれた。そしたら感染症になった」と話す。',
      mean: '看板の注意のあと、その水でお茶を作り、体をこわしたという訴え。',
      trap: 'sprinkler や drink が先に聞こえ、そのまま飲んだと思いやすい。So のあとの動詞を聞く。',
      use: 'I made some tea. Want a cup?（お茶をいれたよ。飲む？）' },

    // R fix: V2 (blind 50 %): "the parks staff" was weak; "himself: he misread the sign" is the C2 near miss (right
    //   target, wrong reason), refuted by his quoting the sign word for word
    // why: the city ← the sign does admit bad water, and he later says "waste in your water system" (right mechanism,
    //   wrong target); misread ← right target, but he quotes the sign exactly, so he read it fine
    // anchor: 58.4–65.3 s "a sign… says 'Do not drink the sprinkler water.' So I made some tea with it, and now I have
    //   an infection": "So" turns the warning into his reason, and he complains about the result
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'sign', reveals: ['tea'], seg: [56.3, 67.4],
      stem: 'In the man’s complaint about the park sign, who is the joke on?',
      choices: ['Himself: he was warned, and did it anyway', 'The city: its own sign admits the water is bad',
                'Himself: he misread what the sign said'], a: 0,
      cue: '看板の言葉と、So のあとの行動を並べて。',
      line: 'a sign… that says, “*Do not drink* the sprinkler water.” *So I made some tea with it*…',
      said: '「飲むな」という看板を読んだうえで、その水でお茶をいれ、感染症になったと苦情を言う。',
      mean: 'So で「書いてあったから」の形になり、注意を守らなかった本人が笑われる。',
      trap: '苦情は市への皮肉に聞こえやすいが、看板は正しく注意している。So の前後のつながりで、誰の失敗かを聞く。',
      use: 'It said “wet paint,” so I touched it.（「ペンキ塗りたて」とあったから触った）' },

    // R fix: V2 (blind 60 %): "embarrassed by his story" was weak; "pleading for help" fits the repeated "Sir?", and
    //   "I'm talking to you!" refutes it
    // why: worried ← repeated "Sir? Are you listening?" can sound like checking on someone who seems unwell;
    //   pleading ← "Sir" over and over heard as begging, the Japanese お願いします frame
    { id: 'a3', skill: 'attitude', level: 'B1', point: 'sir', seg: [67.3, 74.4],
      stem: 'Across his repeated “Sir?”, how does the man’s tone change?',
      choices: ['From polite to openly fed up with Ron', 'From polite to worried that Ron is unwell', 'From polite to pleading for Ron’s help'], a: 0,
      cue: '何度目かの Sir のあと、最後の短い一文。',
      line: 'Sir, are you listening to me, sir? … *Sir, I’m talking to you!*',
      said: '「聞いてますか」から始まり、最後は「話してるんですよ！」と声を上げる。',
      mean: 'Sir は丁寧な呼びかけだが、くり返すうちに無視されたいら立ちに変わる。',
      trap: 'Sir があると丁寧なままに思える。最後の一文が本音。',
      use: 'Excuse me, I’m talking to you.（すみません、あなたに話しているんです）' },

    // R fix: V2 (blind 75 %): "fix a desk" was a filler; "point the man to another desk" is the office's usual move
    // why: find help ← turning away read as looking for a colleague who can deal with it; another desk ← "this isn't
    //   gonna work" heard as "not my department", the usual counter brush-off
    { id: 'i1', skill: 'infer', level: 'B2', point: 'dodge', seg: [82.0, 89.65],
      stem: 'What is Ron using the new desk for here?',
      choices: ['Turning away from someone he should help', 'Turning to find someone who can help him',
                'Turning to point the man to another desk'], a: 0,
      cue: '「Okay, you did not just…」の文の動詞。',
      line: 'you did not just *swivel away while I was talking to you*.',
      said: '「話している最中にくるっと向こうを向くなんて、ありえない」と怒る。',
      mean: '人に会いやすくするための机を、人を避けるのに使っている。そこが皮肉。',
      trap: 'this isn’t gonna work を「担当外」と取りやすいが、話がかみ合わないという意味。',
      use: 'Don’t walk away while I’m talking.（話している途中で行かないで）' },

    // why: two ← "down to one" with "to" heard as "two"; a second ← "minute" missed, a guess at a faster rate
    { id: 'n1', skill: 'number', level: 'B1', point: 'minute', seg: [89.65, 99.0], keep: true,
      stem: 'How fast can the speaker type on the spaceship keyboard now?',
      choices: ['One word a minute', 'Two words a minute', 'One word a second'], a: 0,
      cue: '「down to」のすぐあと。',
      line: '… *down to one word a minute*.',
      said: '「宇宙船みたいなキーボードのせいで、1分に1語しか打てない」と嘆く。',
      mean: 'down to ＝ 〜まで落ちた。速さが一番下まで下がったという言い方。',
      trap: 'down to の to が two に聞こえやすい。単位も最後まで聞く。',
      use: 'I’m down to my last ten dollars.（残り10ドルになっちゃった）' },

    // dict: "as well as I do" runs together after "you know" (both sources agree)
    { id: 'x1', skill: 'dict', level: 'B2', point: 'aswell', seg: [99.0, 102.1],
      stem: 'Type what he says: “Donna, you know ___, these…” (5 words)', answer: 'as well as i do',
      cue: '「you know」のすぐあと、these の前まで。',
      line: 'Donna, you know *as well as I do*, these…',
      said: '「ドナ、君も僕と同じくらい分かってるだろうけど」と前置きする。',
      mean: 'as well as I do が「アズウェラザイドゥ」とつながる。相手も知っている前提。',
      trap: '最初の as が弱く消えやすい。as well as は三語で一つの形。',
      use: 'You know as well as I do.（あなたも分かってるでしょ）' },

    // R fix: V2 (blind 55 %): "end with the new boss fired" was the odd one out; "hit the people at the bottom" is the
    //   workplace script for shake-ups
    // why: get worse ← "shakeups" heard as trouble that grows; bottom ← the usual end of a shake-up story (the
    //   workplace script), with "city manager" heard just before
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'peter', seg: [99.0, 105.25],
      stem: 'What does the speaker tell Donna the city manager shakeups always do?',
      choices: ['Die down on their own after a while', 'Get worse before they get any better', 'Hit the people at the bottom hardest'], a: 0,
      cue: 'always のあとの二語と、次の「wait」。',
      line: 'these city manager shakeups always *peter out*. We just have to *wait*.',
      said: '「新しい管理官の改革なんて、いつも立ち消えになる。待てばいい」と言う。',
      mean: 'peter out ＝ だんだん弱まって消える。だから何もせず待てばいい、という考え。',
      trap: 'shakeup の勢いで悪化の話と取りやすい。次の「待てばいい」が意味を決める。',
      use: 'The rain should peter out soon.（雨はそのうち弱まるはず）' },

    // why: agrees, he'll quit ← "won't" with its t lost heard as "will", and "I'm with you" as full agreement; just
    //   this once ← "Usually" misheard against "but this is…", as if this time were the exception to her disagreeing
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'withyou', seg: [99.0, 114.0],
      stem: 'How does Donna answer the advice to just wait?',
      choices: ['She usually agrees, but not this time', 'She agrees, since Chris will soon quit', 'She agrees with him, but just this once'], a: 0,
      cue: '返事の二文目と、Chris についての一言。',
      line: '*Usually, I’m with you, but* this is Chris Traeger… *He won’t quit.*',
      said: '「いつもなら賛成。でも相手はクリス、絶対にやめない」と言う。',
      mean: 'I’m with you ＝ 賛成。usually と but で、今回は反対だと伝える。',
      trap: 'I’m with you だけで同意と取りやすい。but のあとが本音。',
      use: 'Usually I’d agree, but not today.（いつもなら賛成だけど、今日は違う）' },

    // R fix: V2 (blind 65 %): the water-complaint filler gave way to "praise the plan but ask for more time", from
    //   "compliment" and Chris's "Give them time"
    // why: move staff ← Tom, April and Jerry are named one by one, heard as a request about those three, not the
    //   setup ("go back to the way it was"); more time ← "I mean that as a compliment" + "Give them time" heard as Ron's
    { id: 'g2', skill: 'gist', level: 'B2', point: 'request', reveals: ['goback'], seg: [99.0, 181.9],
      stem: 'Why does Ron go to see Chris in the second half?',
      choices: ['To get the old setup back for his unhappy staff', 'To ask Chris to move three of his staff elsewhere',
                'To praise the plan but ask for a little more time'], a: 0,
      cue: '部署の話のあと、職員一人ずつの説明。',
      said: 'ドナに背中を押され、職員の様子を挙げて、Chris に元に戻すよう頼む。',
      mean: '新しい配置で職員がみじめになっているので、元に戻してほしいという訪問。',
      trap: 'compliment が聞こえると好意的な訪問に思えるが、本題は元に戻す要求。',
      use: 'Can we talk about the new setup?（新しい体制について話せる？）' },

    // why: perk ← the vowel heard as the "er" sound; park ← the word he means (and says next), which the grammar of a
    //   dictionary definition expects
    { id: 's1', skill: 'sound', level: 'B2', point: 'pork', seg: [113.9, 118.33],
      stem: 'His first try: “Webster’s Dictionary describes a ___ as a…”',
      choices: ['pork', 'park', 'perk'], a: 0,
      cue: '「describes a」のすぐあと、母音の口の形。',
      line: 'Webster’s Dictionary describes a *pork* as a— no, it’s a park.',
      said: '辞書の定義から始めるが、park のつもりで pork と言ってしまう。',
      mean: 'pork は口を丸めた「オー」、park は大きく開けた「アー」。母音で聞き分ける。',
      trap: '話の流れから park を予想して耳が合わせやすい。予想でなく、母音の形を聞く。',
      use: 'I’ll have the pork, please.（ポークをお願いします）' },

    // R fix: V2 (blind 60 %): "mock Chris" was weak; "calm Chris, who has started to object" reads the line as a
    //   reply to "Now, wait a minute", which "so it pains me" refutes
    // why: softener ← "I mean that as a compliment" is a common hedge, read as politeness before a request (the
    //   Japanese 前置き frame); calming ← it comes right after Chris's "Now, wait a minute"
    { id: 'a4', skill: 'attitude', level: 'C1', point: 'compliment', seg: [132.3, 145.84],
      stem: 'Why does Ron add that he means it “as a compliment”?',
      choices: ['To him, wrecking the department is a good thing', 'To soften his harsh words before a request',
                'To calm Chris, who has started to object'], a: 0,
      cue: 'ruin の文と、そのあとの「so it pains me」。',
      line: 'a plan so spectacularly horrible that it might *ruin the entire department*. … *I mean that as a compliment*',
      said: '「部署をつぶしかねない、見事にひどい計画だ」と言い、「ほめ言葉だ」と付け足す。',
      mean: 'Ron にとって役所がだめになるのは良いこと。だから本気でほめている。',
      trap: '前置きの決まり文句と取りやすいが、すぐ「だから言うのはつらい」と続く。',
      use: 'I mean that in a good way.（いい意味で言ってるんだよ）' },

    // R fix: V2 (blind 70 %): "my staff only need more time" was Chris's view and easy to rule out; "which I'd hate"
    //   is the C2 near miss, one word off, refuted by "I mean that as a compliment"
    // why: I'd hate ← "horrible… ruin" heard as Ron's own dismay, missing the compliment; sorry to be blunt ← "it pains
    //   me to say this" read as an apology for harsh words (the Japanese 恐縮 frame)
    // anchor: 134–152.2 s "so spectacularly horrible… ruin the entire department" + "I mean that as a compliment, so it
    //   pains me to say this. My department has to go back…" + "No, they won't. They're miserable": the ruin is the
    //   praise, the "so" makes undoing it the pain, and the staff's misery is the reason
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'compliment', reveals: ['goback'], seg: [132.3, 152.95],
      stem: 'Which plain-English version keeps what Ron is telling Chris?',
      choices: ['“Your plan would wreck us, which I’d enjoy, but undo it.”',
                '“Your plan is awful, and I’m sorry to be so blunt about it.”',
                '“Your plan would wreck us, which I��d hate, so undo it.”'], a: 0,
      cue: 'compliment のあとの so と、「miserable」。',
      line: '*I mean that as a compliment*, *so it pains me* to say this. My department has to *go back*…',
      said: '「ほめ言葉だ。だから言うのはつらいが、部署は元に戻さないと」と言い、職員の不満を挙げる。',
      mean: 'つぶれるのは歓迎なのに、止めるしかない。so がその「つらさ」の理由を示す。',
      trap: 'pains me を「恐縮です」と取りやすい。前の compliment と so でつながる。',
      use: 'I hate to say it, but you’re right.（認めたくないけど、君の言う通り）' },

    // R fix: V2 (blind 70 %): "try the plan out on others" was weak; "left alone for a while" is Ron's own taste
    // why: more time ← "Give them time. They'll adjust" is said in the segment, by Chris; left alone ← Ron's dislike of
    //   change, heard in "it pains me to say this"
    { id: 'd5', skill: 'detail', level: 'B1', point: 'goback', seg: [141.5, 152.95],
      stem: 'What does Ron say must happen to his department?',
      choices: ['It has to go back to the way it was', 'It needs more time to get used to things', 'It has to be left alone for a while'], a: 0,
      cue: '「pains me to say this」のすぐあと。',
      line: 'My department *has to go back to the way it was*.',
      said: '「つらいが言わせてもらう。うちの部署は元のやり方に戻さないと」と言う。',
      mean: 'go back to the way it was ＝ 元の状態に戻る。前の形に、という要求。',
      trap: '直後の「時間をあげて」は Chris の返事。誰の言葉かを声と順番で分ける。',
      use: 'Can we go back to the old way?（前のやり方に戻せない？）' },

    // why: nobody watching ← Jerry's need ("only function if no one's looking") said a few lines later; clear task ←
    //   "performs" read as doing assigned work well (perform = 実行する), the usual boss's view
    { id: 'd6', skill: 'detail', level: 'B2', point: 'tom', seg: [151.55, 159.15],
      stem: 'What does Ron say Tom needs in order to work well?',
      choices: ['Someone around to impress', 'Nobody there to watch him', 'A clear task from his boss'], a: 0,
      cue: '「Tom only performs」のあと、when 以下。',
      line: '*Tom only performs when there’s someone to impress*',
      said: '「トムは、いいところを見せる相手がいるときしか力を出さない」と言う。',
      mean: 'perform ＝ ここでは「力を発揮する」。見せる相手がいないと働かないタイプ。',
      trap: '少しあとに「誰も見ていないと働ける」Jerry の話が来て混ざりやすい。名前の直後を聞く。',
      use: 'He works best with an audience.（人に見られているほど力を出す）' },

    // R fix: V2 (blind 60 %): "hates Chris most" was weak; "hates the job more than the people" is a near miss that
    //   "Everyone." refutes
    // why: doesn't know ← a rhetorical question taken as a real one (Ron answers it himself); the job ← "assistant to
    //   everyone" heard as the thing she'd hate
    { id: 'h3', skill: 'humor', level: 'C1', point: 'april', seg: [159.15, 166.25],
      stem: 'Why does Ron’s question about who April hates get a laugh?',
      choices: ['Her new job is to help the very people she hates', 'He acts as if he truly doesn’t know who she hates',
                'He says she hates the job more than the people'], a: 0,
      cue: '「assistant to」のあとの語と、答えの一語。',
      line: 'you made April *assistant to everyone*. You know who April hates? *Everyone.*',
      said: '「エイプリルを全員のアシスタントにした。彼女が嫌いなのは誰か？全員だ」と言う。',
      mean: '同じ everyone をくり返し、仕事の相手と嫌いな相手が丸ごと重なることを示すオチ。',
      trap: '問いかけを本当の質問と取りやすい。自分で答える質問は、オチの前振り。',
      use: 'Guess who’s late again? Me.（また遅刻したのは誰でしょう？私）' },

    // why: hand it off ← "roll over" heard as "turn over" (hand to someone else); put it off ← "roll over" as moving a
    //   date forward, as with a deadline
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'rollover', seg: [172.9, 181.9],
      stem: 'After “I understand your point, but…”, what does Chris say he won’t do?',
      choices: ['Give in to Ron without a fight', 'Hand the matter to someone else', 'Put the matter off for now'], a: 0,
      cue: '「no way that I can just」のあとの二語。',
      line: 'I understand your point, but there’s *no way that I can just roll over* on this.',
      said: '「言いたいことは分かる。でも、このまま簡単に引き下がるわけにはいかない」と言う。',
      mean: 'roll over ＝ 抵抗せずに降参する。犬があお向けになる姿から。',
      trap: 'over から「渡す」「先に送る」と取りやすい。no way と just に注目。',
      use: 'I’m not going to roll over on this.（これは簡単には譲れない）' },
  ]
};
