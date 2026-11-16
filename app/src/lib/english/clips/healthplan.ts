// REVIEW 2026-11-16: pass 3, fix 20, drop 1, new 1; ear checks 0 (the four sound/dict ones went: both sources agree)
// Open: s3 (new) turns on the -ed of "I needed your permission" (184.9 s); both sources have "needed", so it isn't on
//   the list, but it's the one line worth a glance on the phone.
// “Dwight's Health Care Plan - The Office US” (the official The Office channel, Best of Season 1): Dwight defends his
// benefit cuts, hunts for whoever faked the medical forms, gets locked in by Jim, and phones Jan to fire him.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 227 s; whisper's repeated line after it
// is a hallucination. Untested: 117–135 s (the lock-in: mostly visual, "Jim, let me out" garbled), "Clean out your desk"
// at ≈ 143 s (captions: "not your desk"), and who says which line inside the Jim–Pam call (i3 doesn't depend on it).
// i1's line has "Count Chocula" (captions: "count dracula"); its key rests on "you know I love", which both agree on.
import type { Clip } from '../types.ts';

export const healthPlan: Clip = {
  id: 'healthplan', video: 'uzjLEpd7ebQ', title: "Dwight's Health Care Plan", dur: 251, wpm: 182, band: 'fast',
  tags: ['職場', '電話'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %): the key was the only choice in Dwight's own voice; all three are now "X, so the cuts were
    //   right", so the reason has to be heard. said no longer says 大きく削った (it gave away f2).
    // why: told to ← "I did my job" read literally as "I did what I was told"; losing money ← "I saved this company
    //   money" turned into a crisis story
    { id: 'g1', skill: 'gist', level: 'B2', point: 'defense', reveals: ['coddle'], seg: [2, 32],
      stem: 'In his talk to camera, what is Dwight’s main point?',
      choices: ['People must look after themselves, so the cuts were right',
                'He was only doing what he was told, so the cuts were right',
                'The company was losing money, so the cuts were right'], a: 0,
      cue: '「In the wild」から始まる、たとえ話の中身。',
      line: 'I don’t believe in *coddling people*. In the wild, there is *no health care*.',
      said: '福利厚生を削ってお金を浮かせた、甘やかすのは反対、野生に医療はない、と言う。',
      mean: '自分の身は自分で守れ、だから削って正しい、という主張。',
      trap: 'I did my job を「言われた通り」と取りやすいが、胸を張っている。赤字の話も出ない。',
      use: 'I was just doing my job.（仕事をしただけだよ）' },

    // R fix: V2 (blind 60 %) and K5: "cover injuries" answered a different question (which cuts, not how much); all
    //   three are now amounts
    // why: about half ← "slashed" caught as a big cut but "to the bone" not; here and there ← bone heard as the hard
    //   core that is left alone, so only small trims
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'bone', seg: [3, 9.4],
      stem: 'When Dwight describes how much he cut, what does he mean?',
      choices: ['He cut them almost to nothing', 'He cut them by about half', 'He cut them a little here and there'], a: 0,
      cue: '「benefits」のすぐあと、体の一部を使った言い方。',
      line: 'I *slashed* benefits *to the bone*.',
      said: '福利厚生を「骨まで」ばっさり削った、と言っている。',
      mean: 'cut ～ to the bone ＝ 削れるところまで削る。slash も「大幅に切る」という強い動詞。',
      trap: '骨を「芯は残した」と取ると、少し削った話に聞こえる。骨だけ残す、という強い比ゆ。',
      use: 'We cut costs to the bone.（経費をぎりぎりまで削った）' },

    // R fix: V2 (blind 65 %): "says sorry to the staff" was out of step with the talk; one distractor now shares the
    //   half-admission, so the second half has to be heard
    // why: changes subject ← the jump to "In the wild…" heard as a new topic; think it over ← Japanese frame: maybe =
    //   たぶん・分からない, read as real doubt
    { id: 't1', skill: 'attitude', level: 'B2', point: 'harsh', reveals: ['coddle'], seg: [8.9, 13.6],
      stem: 'When Dwight asks himself a question about his cuts, how does he answer?',
      choices: ['He half-admits it, then defends the cuts', 'He half-admits it, then changes the subject',
                'He says he isn’t sure, and will think it over'], a: 0,
      cue: '自分への質問のすぐあと、短い一語と、その次の文。',
      line: 'Was I too harsh? *Maybe*. I don’t believe in coddling people.',
      said: '「厳しすぎた？まあね」と軽く認め、すぐ「甘やかすのは反対」と続ける。',
      mean: 'この Maybe は「まあね、でも」程度。認めたふりをして、すぐ自分を正当化している。',
      trap: 'maybe を迷いと取りやすいが、考えは変わらない。次の一文が続きか別の話かで判断。',
      use: 'Was it expensive? Maybe. Worth it? Yes.（高かった？まあね。でも価値はあった）' },

    // R fix: V2 (blind 70 %): "paying people too little" clashed with a man who just cut benefits; it's now a trust
    //   reading. S4: the seg was 2.4 s; it's now 9.2–13.9.
    // why: close ← coddling ≈ cuddling (抱きしめる), heard as getting close; trusting ← an unknown word filled in from
    //   the scene's theme of faked forms
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'coddle', seg: [9.2, 13.9],
      stem: 'When Dwight says what he doesn’t believe in, what does he mean?',
      choices: ['Treating people too gently', 'Getting too close to people', 'Trusting people too easily'], a: 0,
      cue: '「I don’t believe in」のすぐあと、～ing の一語。',
      line: 'I don’t believe in *coddling* people.',
      said: '人を甘やかすのは反対だ、と言っている。',
      mean: 'coddle ＝ 甘やかす、過保護にする。医療保険を手厚くすることを、こう呼んでいる。',
      trap: 'cuddle（抱きしめる）と音が近く「親しくする」と取りやすい。coddle の o は口を大きく開けた「ア」。',
      use: 'Don’t coddle him; let him try.（甘やかさないで、やらせてみて）' },

    // R fix: V2 (blind 55 %): the key was the only choice with an animal in it (the stem says "the wild"); one
    //   distractor now has the lion too, and "forgets he was the one who got hurt" (half-defensible: he does answer
    //   his own hypothetical) is gone
    // why: hurt him too ← "I hurt my leg… I'm dead" heard as Dwight's own case; eat him first ← "a lion eats me" taken
    //   as his real point
    { id: 'h1', skill: 'humor', level: 'C1', point: 'lion', seg: [16.9, 31.8],
      stem: 'Why is the end of Dwight’s story about the wild funny?',
      choices: ['He casts himself as the lion, not the prey', 'He sees his own cuts would hurt him too',
                'He admits a lion would eat him first'], a: 0,
      cue: '「Well」のあとの、短い2つの文。',
      line: 'Well, I’m not dead. *I’m the lion. You’re dead.*',
      said: 'けがをして食べられる例のあと、「自分がライオンで、死ぬのは君だ」と言い直す。',
      mean: '弱い側の例を自分で話しておいて、急に強い側に回る。その思い込みが笑い。',
      trap: '最初の I は「だれか」の意味で、本人の話ではない。英語の I や you は例え話にも使う。',
      use: 'Say I lose my passport. Then what?（例えばパスポートをなくしたら？）' },

    // R fix: V2 (blind 60 %): the key was the only twist; the choices now share halves (two have the lock-in, two have
    //   a Jan reply). The stem says "culprit", not "faker" (it gave away d1).
    // why: fire ← "can I fire Jim?" is the call's last request; admits ← "I think you need to confess", and Jan's "when
    //   Michael gets back, tell him to call me"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'scene', seg: [35, 227],
      stem: 'How does Dwight’s hunt for the culprit turn out?',
      choices: ['He’s locked in, and Jan says he manages nothing',
                'He gets locked in, but Jan lets him fire Jim',
                'Jim admits it, and Jan says to wait for Michael'], a: 0,
      cue: '後半の電話、Jan の答えを思い出して。',
      said: '犯人を探すが、Jim に閉じこめられ、Jan には「何の責任者でもない」と言われる。',
      mean: '偉くなったつもりが、立場のなさを思い知らされる流れ。',
      trap: 'confess や fire Jim が何度も出るので、そうなったと思いやすい。Jan の答えは No。',
      use: 'That didn’t go as planned.（思った通りにはいかなかった）' },

    // R fix: V2 (blind 55 %): the key was the only "says X, but Y" choice; all three now report what he says first
    // why: upset ← "I'm not mad" with the weak not lost; let it go ← Japanese frame: 怒らないから言って = an offer to
    //   forgive
    { id: 't2', skill: 'attitude', level: 'C1', point: 'notmad', seg: [38, 43.2],
      stem: 'As Dwight opens the meeting, what is his real attitude?',
      choices: ['He says he’s calm, but he wants to punish someone', 'He says he’s upset, but only wants the truth',
                'He says he’s calm, and will let it go if they confess'], a: 0,
      cue: '「I just want to know who did it」の続き。',
      line: 'I’m *not mad*. I just want to know who did it *so I can punish them*.',
      said: '「怒ってない。誰がやったか知りたいだけ。罰したいから」と言う。',
      mean: '「怒ってない」と言いながら、目的は罰すること。言葉と本音がずれている。',
      trap: '日本語の「怒らないから言ってごらん」に近く聞こえるが、so のあとで目的がはっきりする。最後まで聞く。',
      use: 'I’m not mad, I’m just curious.（怒ってないよ、気になるだけ）' },

    // R fix: V2 (blind 65 %): "called in sick" was off the line's topic; the distractors are now the two readings
    //   of "forged medical information" a partial listener would make. The seg runs on to 55.6, to take in "How do you
    //   know that they're fake? Uh, leprosy?", which refutes the signature reading.
    // why: leaked ← "medical information" + "felony" = a privacy crime; signed ← forge's usual sense (a forged
    //   signature)
    { id: 'd1', skill: 'detail', level: 'B2', point: 'forged', seg: [44.2, 55.6],
      stem: 'What does Dwight say someone in the office has done?',
      choices: ['Put made-up illnesses on their forms', 'Leaked other people’s medical details',
                'Signed forms in someone else’s name'], a: 0,
      cue: '「someone」のあとの動詞と、続く質問への答え。',
      line: 'Someone *forged medical information*… How do you know that they’re *fake*? — Uh, leprosy?',
      said: '誰かが医療情報を偽造した、重罪だ、と言い、例として病名を挙げる。',
      mean: 'forge ＝ 偽造する。保険の書類に、うその病気を書いた人がいる。',
      trap: 'medical や felony から情報もれを想像しやすい。forge はサインにも使うが、例は病名。',
      use: 'Someone forged my signature.（誰かが私のサインを偽造した）' },

    // R fix: V2 (blind 55 %): "written to make fun of Dwight" was weak; it's now a delivery reading. Now reveals
    //   `forged`: the line shows the illnesses are made up (d1's key).
    // why: real names ← leprosy and flesh-eating bacteria are real illnesses; pronounce ← the "uh" and the pauses
    //   before each name heard as him struggling
    { id: 'h2', skill: 'humor', level: 'C1', point: 'fakes', reveals: ['forged'], seg: [52.6, 67],
      stem: 'Why is the list of illnesses Dwight reads out funny?',
      choices: ['It slides from real diseases to impossible ones', 'They’re real diseases that just sound silly',
                'Dwight can barely pronounce the medical words'], a: 0,
      cue: '後半の2つ、食べ物や SF のような病名。',
      line: 'Leprosy? Flesh-eating bacteria? *Hot dog fingers? … killer nanorobot infection?*',
      said: 'ハンセン病、人食いバクテリア、ホットドッグ指、殺人ナノロボット感染、と読み上げる。',
      mean: 'だんだんありえない病名になる。それを真面目に犯罪扱いするのがおかしい。',
      trap: '最初の2つは本当にある病気なので「名前が変なだけ」と思いやすい。後ろほど作り話。',
      use: 'That sounds made up.（それ、作り話っぽいね）' },

    // R drop: s2 (never shipped, deleted). V2 (blind 70 %): the tag "didn't you" is the default after "You did this",
    //   and "don't you" didn't fit the past tense (K5/§9.5). Same-polarity "did you?" is fine English, so no gap here
    //   can be fair. s3 (at 184 s) replaces it.

    // R fix: V2 (blind 55 %): "gives up on the yes-no argument" in the stem pointed at a decision; the stem now names
    //   the moment with "Okay, fine", which also makes the "accepts" reading more tempting
    // why: asks ← "you know what?" read as a real question (何を知ってる？); accepts ← "Okay, fine" read as agreeing
    //   with the denial
    { id: 'm1', skill: 'marker', level: 'B2', point: 'ykw', seg: [69.4, 75.4],
      stem: 'Right after “Okay, fine”, what does Dwight’s next short phrase do?',
      choices: ['Announces a decision he just made', 'Asks the others what they know', 'Shows that he now accepts the denial'],
      a: 0,
      cue: '「Okay, fine」の直後、短い決まり文句。',
      line: 'Okay, fine. *You know what?* I’m gonna have to interview each and every one of you',
      said: '「分かった、もういい。いいか、全員と面談する」と言い出す。',
      mean: 'You know what? は答えを求める質問ではなく、決めたことを言う前の合図。',
      trap: '疑問文の形なので質問と取りやすい。Okay, fine も同意ではなく「もういい」と打ち切る言葉。',
      use: 'You know what? Let’s just order pizza.（よし、もうピザ頼もう）' },

    // why: go home ← "until the perpetrator makes him or herself known" = a lock-in script; day's pay ← the money
    //   theme and a punishment script
    { id: 'd2', skill: 'detail', level: 'B1', point: 'nocover', seg: [74.5, 81.6],
      stem: 'What will happen until the guilty person comes forward?',
      choices: ['Nobody will get health coverage', 'Nobody will be allowed to go home', 'Everybody will lose a day’s pay'],
      a: 0,
      cue: '「until that time」のあと。',
      line: 'until that time, there will be *no health care coverage* for anyone.',
      said: '犯人が名乗り出るまで、全員の医療保険をなしにする、と言う。',
      mean: '一人のいたずらのために全員を罰する、という Dwight の強引なやり方。',
      trap: '「名乗り出るまで」と聞くと「帰さない」を想像しやすいが、取り上げるのは保険。罰の中身は最後に来る。',
      use: 'No dessert until you finish dinner.（夕ご飯を食べ終わるまでデザートなし）' },

    // R fix: V2 (blind 60 %): the stem's "The problem… people who are really suffering" let meaning pick "won't"; the
    //   stem is trimmed to the gap
    // why: want to ← won't /oʊ/ vs want /ɑ/, with the t dropped; will ← the n't lost entirely
    { id: 's1', skill: 'sound', level: 'B2', point: 'wont', seg: [90.6, 98.3],
      stem: 'Fill the gap: “…___ the care they need”',
      choices: ['won’t receive', 'want to receive', 'will receive'], a: 0,
      cue: '「medical condition」のすぐあと。',
      line: 'The problem, Jim, is that people who are really suffering… *won’t receive* the care they need',
      said: '「本当に病気の人が、必要な治療を受けられなくなる」と言う。',
      mean: 'won’t は口を丸めた「ウォウント」。want は「ワン」に近い短い音。',
      trap: 'won’t と want は似て聞こえる。The problem is のあとは悪い結果が来やすい。',
      use: 'The store won’t open until ten.（その店は10時まで開かない）' },

    // R fix: V2 (blind 50 %): "Dwight's own idea" was weak; it's now a sympathy reading. The stem says "wrote down that
    //   particular illness", not "fake illness" (it gave away d1).
    // why: sick one ← "Sounds tough" heard as sympathy aimed at Dwight; easy to fool ← the "ridiculous stuff" just
    //   before read as proof the forms are weak
    { id: 'i1', skill: 'infer', level: 'B2', point: 'chocula', seg: [104.5, 113.2],
      stem: 'Why does Dwight think Jim wrote down that particular illness?',
      choices: ['To mock something Dwight is known to love', 'To suggest that Dwight is the sick one',
                'To show the forms are easy to fool'], a: 0,
      cue: '「Is it because」のあと。',
      line: 'Is it because you know *I love* Count Chocula?',
      said: '「僕がそれを好きだと知ってて書いたのか」と Jim に聞いている。',
      mean: '病名は Dwight の好物をもじったもの。からかいだと思っている。',
      trap: 'Sounds tough を同情と取りやすいが皮肉。理由は because のあと。',
      use: 'Is this because I was late?（私が遅れたからなの？）' },

    // R fix: V2 (blind 65 %): the key was the only "knowing" reading; the choices are now even in length and kind.
    //   S4: the seg cut into "Let me out or you're fired"; it now ends at 138.45.
    // why: can't make out ← a muffled call from a locked room; prank ← "Let me out" with no name sounds like a joke call
    { id: 'i2', skill: 'infer', level: 'C1', point: 'whoisthis', seg: [135.4, 138.45],
      stem: 'When Dwight calls, why does Jim ask who is calling?',
      choices: ['He knows, but acts as if he doesn’t', 'He can’t make out the voice on the line',
                'He takes it for a prank caller'], a: 0,
      cue: '「Let me out」と言われたあとの返事。',
      line: 'Jim Halpert? — Let me out. — *Who is this?*',
      said: '仕事の電話のように出て、「出して」と言われても「どちら様？」と返す。',
      mean: '相手が Dwight なのは明らか。知らないふりをして、からかっている。',
      trap: '電話の Who is this? は普通の質問なので本気に取りやすい。流れと合わないときは、わざと。',
      use: 'Sorry, who’s calling, please?（失礼ですが、どちら様ですか）' },

    // R fix: S4: the seg began inside "you're fired" and ended inside "I'm manager"; it's now 137.5–141.25. Ear check
    //   dropped: both sources have "you can't".
    { id: 'x1', skill: 'dict', level: 'B1', point: 'cant', seg: [137.5, 141.25],
      stem: 'Type what Jim says: “No, ___ fire me.” (2 words)', answer: "you can't",
      cue: '「fired」と言われた直後の返事。',
      line: 'No, *you can’t* fire me. — Yes, I can.',
      said: '「クビにはできないよ」「できる」と言い合っている。',
      mean: 'can’t の t はほぼ聞こえない。can は弱く短く、can’t は強く長い「キャーン」。',
      trap: 't が聞こえず can と書きやすい。強さと長さで判断。続く Yes, I can もヒント。',
      use: 'You can’t park here.（ここは駐車できません）' },

    // why: week ← day is short and swallowed after "the"; month ← "acting manager" suggests a longer stretch
    { id: 'n1', skill: 'number', level: 'B1', point: 'day', reveals: ['cant'], seg: [139.6, 142.9], keep: true,
      stem: 'For how long does Dwight say he is manager?',
      choices: ['For the day', 'For the week', 'For the month'], a: 0,
      cue: '「I’m manager」の直後。',
      line: 'Yes, I can. I’m manager *for the day*.',
      said: '「できるさ。今日一日は自分がマネージャーだ」と言う。',
      mean: 'for the day ＝ その日だけ。期間限定の立場を、大げさに使っている。',
      trap: 'day は短く、the に続くと聞き落としやすい。the のあとの母音（エイ、イー、ア）で判断。',
      use: 'We’re only here for the day.（今日一日だけの滞在です）' },

    // R fix: V2 (blind 60 %): "the line is breaking up" was weak; it's now the voicemail beep, the commonest misreading
    //   S4: the seg was 2.9 s; it's now 143.8–147. S3: the cue quoted "hold on", a word only the key had.
    // why: voicemail ← beep = 留守電の「ピーッ」; battery ← beep = 電池切れの警告音
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'beep', seg: [143.8, 147],
      stem: 'What is Jim doing when he mentions a beep?',
      choices: ['Putting Dwight on hold for another call', 'Telling Dwight to leave him a voice message',
                'Warning Dwight his battery is dying'], a: 0,
      cue: '「Can you…?」のあとの、理由の一文。',
      line: 'Can you *hold on one second*? I’m *getting a beep*.',
      said: '「ちょっと待ってて。キャッチが入った」と言う。',
      mean: 'getting a beep ＝ 別の電話が入った。Dwight を保留にしておく口実。',
      trap: 'beep を留守電や電池切れの音と取りやすい。hold on と一緒なら、別の電話で「保留にする」話。',
      use: 'Can you hold on? I have another call.（ちょっと待って、別の電話が）' },

    // R fix: V2 (blind 55 %): the key was the only choice naming Dwight and the hold; it now says neither. Now reveals
    //   `beep`: mean and cue say Dwight is on hold (p1's key).
    // why: invite ← "the weekend" + "what are you up to?" = the date-invite script; checking ← "I'm not bothering you,
    //   am I?" taken as the reason for the call
    { id: 'i3', skill: 'infer', level: 'C1', point: 'drag', reveals: ['beep'], seg: [152.8, 167.6],
      stem: 'What is the real point of the phone chat that follows?',
      choices: ['To drag out the wait, chatting about nothing', 'To ask Jim to do something this weekend',
                'To check that Jim isn’t too busy to talk'], a: 0,
      cue: '話の中身がどれくらい大事か、と保留中のだれか。',
      line: 'this weekend, *nothing*. I’m *not really doing anything*.',
      said: 'Pam から電話が来て、週末の予定など、どうでもいい話を長く続ける。',
      mean: 'Dwight を保留にしたまま、わざと話を引きのばしている。',
      trap: 'weekend や up to で誘いの電話に見えるが、誘う言葉は出てこない。何のための電話かを考える。',
      use: 'Sorry, I got stuck on another call.（ごめん、別の電話につかまってた）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'upto', seg: [157.7, 160],
      stem: 'Type the question about weekend plans: “What ___?” (4 words)', answer: 'are you up to',
      cue: '「weekend」のあと、「Yeah?」に続く質問。',
      line: 'Yeah? What *are you up to*?',
      said: '「週末は何するの？」と聞いている。',
      mean: '予定や今していることを聞く定番。are you が弱く「アユ」とつながる。',
      trap: 'up to を「〜まで」と取ると意味が通らない。are はほとんど聞こえないこともある。',
      use: 'What are you up to tonight?（今夜は何するの？）' },

    // R new (replaces s2): a near-sound set where meaning can't choose. Blind read: 45 % on "I need" (wrong).
    // why: need ← the -ed after d is a light extra syllable, easy to lose before "your"; I'll need ← the dark l of I'll
    //   is nearly silent, so it hides in the gap between I and need
    { id: 's3', skill: 'sound', level: 'B2', point: 'needed', seg: [184, 187.8],
      stem: 'Fill the gap: “Listen, ___ your permission to fire Jim Halpert.”',
      choices: ['I need', 'I needed', 'I’ll need'], a: 1,
      cue: '「listen」のあと、動詞の形。',
      line: 'Listen, *I needed* your permission to fire Jim Halpert.',
      said: '「Jim をクビにする許可が欲しかった」と言う。',
      mean: 'needed の -ed は「ディッド」と1音節ふえる。過去形で少し遠回しな頼み方。',
      trap: 'need と思うと -ed を聞き落とす。音節の数を数える。I’ll の l はほぼ聞こえない。',
      use: 'I needed to ask you something.（ちょっと聞きたいことがあって）' },

    // R fix: V2 (blind 55 %): the key was the only choice on the scene's theme (health care); one distractor now is
    //   too, the other is his earlier claim. The stem says "When Jan challenges him", not "manages nothing" (that was
    //   g2's key).
    // why: forms ← the faked forms are the day's topic; running things ← "he put me in charge of the office", said a
    //   moment before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'charge', seg: [199.5, 210],
      stem: 'When Jan challenges him, what does Dwight say he’s in charge of?',
      choices: ['Picking the health care plan', 'Checking everyone’s health forms', 'Running things while Michael’s out'],
      a: 0,
      cue: '「That’s not entirely true」の続き。',
      line: 'he put me *in charge of picking the health care plan*.',
      said: '「完全にそうとは言えない。保険のプランを選ぶ係にしてもらった」と言い返す。',
      mean: '最初の「オフィスの責任者」から、ずっと小さい役目に話が縮んでいる。',
      trap: '少し前に office の責任者と言っているので選びやすいが、Jan に言われて言い方を変えている。',
      use: 'I’m in charge of the music.（音楽は私の担当です）' },

    // R fix: V2 (blind 50 %): "fix the plan" was weak; it's now Dwight's echo with me/you swapped
    // why: call Dwight ← Dwight repeats "call you immediately", so me and you swap; fire Jim ← Dwight's request
    //   keeps coming up
    { id: 'd5', skill: 'detail', level: 'B1', point: 'callme', seg: [212.5, 216.3],
      stem: 'What does Jan want Michael to do when he gets back?',
      choices: ['Call her right away', 'Call Dwight right away', 'Fire Jim right away'], a: 0,
      cue: '「When Michael gets back」の続き。',
      line: 'When Michael gets back, you tell him to *call me immediately*.',
      said: '「Michael が戻ったら、すぐ私に電話するよう伝えて」と言う。',
      mean: 'immediately ＝ すぐに。有無を言わせない口調。',
      trap: 'Dwight が call you immediately とくり返すので、me と you が入れかわりやすい。',
      use: 'Please tell her to call me back.（折り返し電話するよう伝えてください）' },

    // R fix: V2 (blind 50 %): "an apology for calling" was weak; it's now the "listen = urgent" reading
    // why: urgent ← "Oh, hey, listen" heard as the start of serious news; reminder ← "since" read as time (〜以来), as
    //   if pointing back to an earlier talk
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'since', seg: [216.3, 222.6],
      stem: 'How does Dwight lead into his last question to Jan?',
      choices: ['As a casual add-on, as if it just came up', 'As an urgent matter that can’t wait',
                'As a reminder of something she promised'], a: 0,
      cue: '「listen」のあと、質問の前の前置き。',
      line: 'Oh, hey, listen. Um, *since I have you on the phone*, um, can I fire Jim?',
      said: '「電話ついでに、Jim をクビにしていい？」と聞く。',
      mean: 'since I have you ＝「電話がつながっているから」。ついでの頼みに見せる前置き。',
      trap: 'listen を大事な話の合図、since を「〜以来」と取りやすい。ここは「〜だから」。',
      use: 'Since you’re here, can you help me?（せっかく来たなら、手伝ってくれる？）' },

    // R fix: V2 (blind 50 %): "used Michael's phone" was weak; it's now a wrong-person reading. S4: the seg started
    //   on "no" and cut "I thought this was your…"; it's now 221.8–227.5.
    // why: too many calls ← "ever again" heard as "stop calling me so often"; someone else ← the earlier "Who is
    //   this?" + "I thought this was your…" read as a wrong number
    { id: 'i5', skill: 'infer', level: 'B2', point: 'cell', seg: [221.8, 227.5],
      stem: 'What does Jan’s last request tell us about Dwight’s call?',
      choices: ['He called her private number, not her work one', 'He has called her too many times today',
                'He meant to call someone else at her office'], a: 0,
      cue: '最後の「Please don’t」の中身。',
      line: 'Please *don’t use my cell phone* ever again.',
      said: '「二度と私の携帯にかけないで」と言われ、Dwight は驚く。',
      mean: '仕事の番号ではなく、個人の携帯にかけていた。Jan はそれを嫌がっている。',
      trap: 'ever again を「何度もかけてくる」と取りやすいが、問題は回数ではなく、かけた番号。',
      use: 'Please don’t call this number again.（この番号にはもうかけないでください）' },
  ]
};
