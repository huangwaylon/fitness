// “Andy Fails his Eye Test | Parks and Recreation” (the official Parks and Recreation channel, Season 4): Andy comes
// to Ann with a long list of complaints, learns what insurance is (or isn't), and sees Dr. Harris, who can only fix
// his thumb and says he needs glasses.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 169 s. Andy, Ann and Dr. Harris are named
// in the audio; Andy's wife (April) is never named, so no stem names her. Untested on purpose: 0–3.4 s (a sexual jab
// at Ann), 26–40 s (the fall and its flashback: visual), 48–51 s (who says "yes, you can, we have insurance"), 63.4–69 s
// ("you still got it for me": unclear), 120.3 s (captions "indeed", whisper "Andy!"), 135.6–147.3 s (the eye chart:
// visual, and "middle finger"), 148.2 s ("you drove us here": eyesight or insurance is open), 166.4 s (captions "you
// heard her", whisper "you heard it"), 168.6 s ("No offense" rests on whether the doctor wears glasses: visual).
// EAR CHECK: 61.6 s i2 — “Oh my God, we used to live together” is Ann's (no name is said; Andy's wife lives with him now,
//   so "used to" fits Ann)
// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 1 (unchanged)
import type { Clip } from '../types.ts';

export const andyEyeTest: Clip = {
  id: 'eyetest', video: 'wy0K449Zk0U', title: 'Andy Fails his Eye Test', dur: 190, wpm: 163, band: 'mid',
  tags: ['友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 70 %, right): “an answer to the question she asked” was absurd; it’s now “an apology first” (a Japanese
    //   frame). The stem now asks “asking for?”, so the choices fit it
    // why: louder ← “try that again” heard as “say it again” (not heard); apology ← after a rude line, “try again” read
    //   as “say sorry first” (日本語の「まず謝って」)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'again', seg: [3.9, 10.3],
      stem: 'After the rude try, what is “Do you want to try that again?” asking for?',
      choices: ['The same question, asked more politely', 'The same question, asked more loudly',
                'A real apology before anything else'], a: 0,
      cue: '直後に来る、言い直された質問と比べて。',
      line: 'Do you want to *try that again*? — Hey, Ann, are you still a nurse? Because…',
      said: '失礼な聞き方のあと「言い直したら？」と言われ、ていねいに聞き直す。',
      mean: 'try that again ＝ やり直す。もっとましな言い方でもう一度、という意味。',
      trap: '「もう一度」や「まず謝って」と取りやすい。直後に何が来るか（言い直し）で判断。',
      use: 'Want to try that again, politely?（ていねいに言い直してみる？）' },

    // R fix: V2 (blind 75 %, right): with “Eye Test” in the title, only the key was about health; the distractors are now the
    //   title’s eye test and the money talk
    // why: eye test ← the title, and “seeing double” comes soon; a bill ← “we can’t afford it” comes a minute later
    { id: 'g1', skill: 'gist', level: 'B1', point: 'help', seg: [6.4, 22.5],
      stem: 'At the start, why have they come to Ann?',
      choices: ['Andy isn’t well and needs her to look at him', 'Andy needs an eye test before he can drive',
                'His wife needs help paying a doctor’s bill'], a: 0,
      cue: '「are you still a nurse」のあと、because。',
      line: 'are you still a nurse? Because *Andy’s not feeling well*.',
      said: '「まだ看護師？アンディの具合が悪くて」とアンに声をかける。',
      mean: '看護師のアンに、アンディを診てもらいに来た。これが場面の目的。',
      trap: '題名の目の検査や、あとのお金の話に引っぱられやすい。目的は最初の because のあとに来る。',
      use: 'I’m not feeling well today.（今日は具合が悪い）' },

    // why: hurt ← "my teeth hurt" comes right after; spots ← "seeing" caught, "double" missed
    { id: 'd1', skill: 'detail', level: 'B1', point: 'eyes', seg: [10.3, 16.3],
      stem: 'What does Andy say is wrong with his eyes?',
      choices: ['He’s seeing double', 'They hurt a lot', 'He’s seeing spots'], a: 0,
      cue: '「headache」のあと、seeing の次の語。',
      line: 'I just got a headache, and I’m *seeing double*.',
      said: '「頭が痛くて、物が二重に見える」と言う。',
      mean: 'see double ＝ 物がだぶって見える。頭を打ったときによく出る症状。',
      trap: 'hurt は直後の teeth（歯）の話。seeing のあとの一語まで聞く。',
      use: 'I’m so tired I’m seeing double.（疲れすぎて物が二重に見える）' },

    // R fix: V2 (blind 70 %, right): the key was the only two-part answer; all three are now “real symptoms; some…”
    // why: making up ← a long, odd list sounds exaggerated; hunger ← “I’m hungry” was the last thing he said
    { id: 'i1', skill: 'infer', level: 'B2', point: 'person', reveals: ['stuck'], seg: [10.3, 22.5],
      stem: 'What is Ann saying about Andy’s list of complaints?',
      choices: ['Some are real symptoms; some are just normal life', 'Some are real symptoms; some he’s making up',
                'Some are real symptoms; some are just hunger'], a: 0,
      cue: '「some of those」と「some of them」の対比。',
      line: 'some of those things are *symptoms*, and some of them are *just being a person*.',
      said: '「症状のものもあるし、ただ人間として普通のこともある」と答える。',
      mean: '頭の中の曲や空腹は病気でなく、誰にでもある日常。やんわりした皮肉。',
      trap: 'being a person を仮病や空腹と取りやすい。some … and some … は二分する合図。',
      use: 'That’s not a symptom. That’s Monday.（それは症状じゃない、月曜日なだけ）' },

    // R fix: V2 (blind 85 %, right): composing and loud music were far off; the distractors are now a symptom reading and
    //   stuck read as 詰まる
    // why: ringing ← it’s a list of symptoms, and “song… in my head” sounds like a noise in the ears; can’t recall ←
    //   stuck read as 詰まる, a tune that won’t come out
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'stuck', seg: [12.2, 16.3],
      stem: 'What does Andy mean when he mentions a song in his head?',
      choices: ['A tune keeps playing in his mind', 'He keeps hearing a ringing sound',
                'He can’t recall a tune he heard'], a: 0,
      cue: '「song」のあとの一語に注目。',
      line: 'I got *a song stuck in my head*, and my teeth hurt.',
      said: '「歌が頭から離れないし、歯も痛い」と続ける。',
      mean: 'a song stuck in my head ＝ 曲が頭の中でくり返し流れる。病気ではない。',
      trap: 'stuck を「詰まって出ない」と取りやすい。stuck in my head ＝ はまって離れない。',
      use: 'That song is stuck in my head.（あの曲が頭から離れない）' },

    // why: not hurt ← "Yeah, I'm good" is said just before; the wall ← "smash my head area into the wall area" earlier
    { id: 'm1', skill: 'marker', level: 'B2', point: 'gold', seg: [31.0, 44.2],
      stem: 'When Andy wraps up the story of his fall, what does he say matters?',
      choices: ['That he owns a gold record', 'That he wasn’t badly hurt', 'That the wall needs fixing'], a: 0,
      cue: '文頭の短いつなぎ言葉のあと。',
      line: '*Point is*, I have a *gold record*.',
      said: '頭を打った話のあと、「要するに、ゴールドレコードがあるってこと」と言う。',
      mean: 'Point is ＝ 要するに、大事なのは。けがより自慢が本題になっている。',
      trap: '直前の I’m good（平気）に引っぱられやすい。Point is のあとが言いたいこと。',
      use: 'Point is, we made it on time.（要するに、間に合ったってこと）' },

    // R fix: V2 (blind 85 %, right): the distractors were absolutes (“all of it”, “nothing”); now all three are “X; other
    //   problems need a doctor”
    // why: head ← she asked “Did you hit your head?” earlier; eyes ← “seeing double” was the first problem he named
    { id: 'd2', skill: 'detail', level: 'B2', point: 'real', seg: [44.1, 48.0],
      stem: 'What does Ann say she can help Andy with?',
      choices: ['Small injuries; other problems need a doctor', 'His head injury; other problems need a doctor',
                'His eyes; other problems need a doctor'], a: 0,
      cue: '「cuts and bruises」と、but のあと。',
      line: 'I can help you with *cuts and bruises*, but the other stuff, you’re gonna have to see *a real doctor*.',
      said: '「切り傷やあざなら手当てできる。ほかは本物の医者に診てもらって」と言う。',
      mean: 'できるのは軽いけがだけ。頭や目の症状は医者の仕事、と線を引いている。',
      trap: '頭や目は前に出た話題で選びやすい。cuts and bruises の範囲を but で分ける。',
      use: 'I can help with that, but not this.（それは手伝えるけど、これは無理）' },

    // R fix: V2 (blind 50 %, right): “the doctors” was weak; it’s now the insurers. B no longer says “he” (the speaker isn’t
    //   named in the audio)
    // why: the two ← the jab sounds like the punchline; insurers ← “insurance is for… your car” heard as a dig at what
    //   policies cover
    // anchor: 52.8–61.0 s he calls both of them "not that smart", then says "insurance is for if something bad happens
    //   to your car" and "I haven't had it in years"; 61.6 s "Oh my God, we used to live together"
    { id: 'nt2', skill: 'humor', level: 'C2', point: 'insurance', seg: [48.0, 63.3],
      stem: 'When insurance comes up, who is the joke on?',
      choices: ['The one “correcting” them, who has it wrong', 'The two being called not that smart',
                'Insurance companies, for covering only cars'], a: 0,
      cue: '人を賢くないと言った直後の説明に注目。',
      line: '…*because insurance is for if something bad happens to your car*. P.S., I haven’t had it in years.',
      said: '二人を「賢くない」と言い、「保険は車のため。ちなみに何年も入ってない」と続ける。',
      mean: '人の知識をばかにした本人が、いちばんわかっていない。笑われているのは訂正した側で、本人は気づいていない。',
      trap: '悪口が強いので、言われた二人が笑われていると取りやすい。誰の説明が外れているかを追う。',
      use: 'Says the guy who got lost twice.（2回も道に迷った人が言う？）' },

    // R fix: V2 (blind 55 %, right): only the key was odd, so it stood out as the sitcom twist; all three are now “When
    //   something bad happens to your…”
    // why: house ← home insurance, and the final r of “car” is weak; health ← true in real life, and Ann’s “see a real
    //   doctor” is just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'insurance', seg: [52.4, 61.4],
      stem: 'In the reply about insurance, what does the speaker say it’s for?',
      choices: ['When something bad happens to your car', 'When something bad happens to your house',
                'When something bad happens to your health'], a: 0,
      cue: '「because」のあと、最後の名詞。',
      line: 'because *insurance is for if something bad happens to your car*.',
      said: '「保険は、車に何か悪いことが起きたときのためのもの」と言う。',
      mean: '話し手は、保険を車の保険のことだと思いこんでいる。医療保険を知らない。',
      trap: '現実には医療の保険もあるので選びやすい。問われているのは、話し手が言ったこと。',
      use: 'Insurance is for emergencies.（保険は緊急時のためのもの）' },

    // R fix: V2 (blind 70 %, right): “still owns a car” was weak; it’s now an embarrassed reading. The fond reading stays: the
    //   next line (“Aw, you still got it for me”) takes the gasp that way
    // why: fondly ← “Oh my God… together” heard as nostalgia (懐かしい), which is how the next line takes it;
    //   embarrassed ← “used to live together” heard as a secret let slip
    { id: 'i2', skill: 'infer', level: 'C1', point: 'livedwith', seg: [57.3, 63.3],
      stem: 'Why does Ann gasp that they “used to live together”?',
      choices: ['She’s shocked he had no insurance back then', 'She’s fondly recalling the days they lived together',
                'She’s embarrassed their past came up here'], a: 0,
      cue: '直前の「P.S.」の一文から考えて。',
      line: 'P.S., I *haven’t had it in years*. — Oh my God, *we used to live together*.',
      said: '「ちなみに何年も保険に入ってない」と聞き、アンが「一緒に住んでたのに」と声を上げる。',
      mean: '同居していた頃も無保険だったと気づき、ぞっとしている。懐かしさではない。',
      trap: 'Oh my God を懐かしさと取りやすい。直前の告白が驚きの理由になる。',
      use: 'Wait, you’ve been driving without insurance?（え、保険なしで運転してたの？）' },

    // why: safe ← the question form taken as a real check (a patient's worry); small talk ← a casual question to a
    //   stranger read as making conversation
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'hooked', seg: [69.9, 74.5],
      stem: 'What is the question about doctors and drugs meant to do?',
      choices: ['Tease the doctor, not get an answer', 'Check whether the doctor is safe',
                'Fill a quiet moment with small talk'], a: 0,
      cue: '質問のあと、自分で答える一言。',
      line: 'Are you the kind of doctor who gets hooked on his own drugs? *I bet you are.*',
      said: '「自分の薬にハマるタイプの医者でしょ。きっとそう」と言う。',
      mean: '答えを待たずに I bet you are と決めつける。質問ではなく、からかい。',
      trap: '質問の形なので確かめていると取りやすい。自分で答えたら、聞く気はない。',
      use: 'You’re one of those morning people, aren’t you?（朝型の人でしょ、きっと）' },

    // R fix: V2 (blind 65 %, right): the key was the only one with “calls it”; one distractor is now “or” heard as a slip and
    //   its fix
    // why: a real helmet ← “helmet” taken literally after “hit my head”; mix-up ← “or” heard as a self-correction of a
    //   slip
    { id: 'h2', skill: 'humor', level: 'C1', point: 'helmet', seg: [74.5, 85.7],
      stem: 'Why does Andy’s “brain helmet” get a laugh?',
      choices: ['He offers a silly name for the head as a medical term', 'He says he had a helmet on, so he wasn’t hurt',
                'He mixes up “head” and “helmet” and fixes it'], a: 0,
      cue: '「you call it」が誰の言い方を指すか。',
      line: 'hit my head. Or *brain helmet, you call it*.',
      said: '「頭を打った。あ、きみらの言う『脳ヘルメット』ね」と言い直す。',
      mean: '頭の骨を子どもっぽい言葉で言い、医者の用語のように扱う。背のびの空回り。',
      trap: 'or を言いまちがいの訂正と取りやすい。you call it は「そちらの呼び方で言えば」。',
      use: 'A “remote,” as you call it.（いわゆるリモコンね）' },

    // R fix: V2 (blind 60 %, right): “can’t remember” was the only innocent choice beside the key; it’s now “hurt worse than he
    //   lets on”, a cover-up too
    // why: hurt worse ← a head knock plus a vague story sounds like toughing it out; can’t see ← his bad eyesight comes
    //   out later in the clip
    // anchor: 76.0–84.1 s the smart-sounding "reading an encyclopedia" story wobbles ("tripped or fell over");
    //   85.7–89.3 s "he sneezed and smacked his head against the wall" — "That sounds about right"
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'sneeze', reveals: ['helmet'], seg: [74.5, 89.8],
      stem: 'When Andy tells the encyclopedia story, what is he trying not to say?',
      choices: ['That the real accident was a silly one', 'That he was hurt worse than he lets on',
                'That he fell because he can’t see well'], a: 0,
      cue: '話の賢さと、すぐあとに出る別の話。',
      line: 'I was *reading an encyclopedia*, and I tripped or fell over… — he *sneezed* and smacked his head against the wall.',
      said: '「百科事典を読んでいて転んだ」と話すが、すぐ「くしゃみして壁にぶつけた」と入る。',
      mean: '賢そうな場面を作り、まぬけな本当の原因を隠そうとした。訂正を誰も否定せず、医者も納得する。',
      trap: 'あいまいな話し方を、けがを隠す強がりと取りやすい。迷いは作り話の跡で、本当の話はすぐ横にある。',
      use: 'I was “studying,” not napping.（「勉強してた」の、昼寝じゃなくて）' },

    // R fix: V2 (blind 55 %, right): the choices now all start “It suggests…” and the key no longer says “sillier”
    // why: common ← “sounds about right” read as a medical “that’s normal”; encyclopedia ← the doctor asked Andy, so the
    //   reply sounds aimed at his story
    { id: 'h3', skill: 'humor', level: 'C1', point: 'sneeze', seg: [78.7, 89.8],
      stem: 'Why does the doctor’s reply to the sneeze story get a laugh?',
      choices: ['It suggests a dumb accident is just what he’d expect', 'It suggests a sneeze is a common way to get hurt',
                'It suggests the encyclopedia story is the true one'], a: 0,
      cue: '二つの話のうち、医者がどちらに返したか。',
      line: 'he *sneezed and smacked his head against the wall*. — *That sounds about right.*',
      said: '本の話のあと「くしゃみして壁にぶつけた」と聞き、医者は「それっぽいね」。',
      mean: '賢そうな話より、まぬけな話を本当らしいと認める。アンディへの見方が透ける。',
      trap: '医学的に「よくある」と取りやすい。sounds about right ＝ いかにもありそう。',
      use: 'Late again? Sounds about right.（また遅刻？まあ、そうだろうね）' },

    // R fix: V2 (blind 50 %, right): “would” contradicted “extremely mild”, so it fell out on meaning; it’s now “don’t”, which
    //   fits as well as “won’t”
    // why: won’t ← the vowel and the n caught, the -d- missed; don’t ← “so I don’t worry” fits the meaning, and the w is
    //   lost
    { id: 's1', skill: 'sound', level: 'B2', point: 'mild', seg: [89.6, 93.4],
      stem: 'Fill the gap: “…it’s extremely mild, so I ___ worry about it.”',
      choices: ['wouldn’t', 'won’t',
                'don’t'], a: 0,
      cue: '「so I」のすぐあと、短く弱い語。',
      line: 'it’s extremely mild, so I *wouldn’t* worry about it.',
      said: '「脳しんとうでも、ごく軽いから心配いらない」と言う。',
      mean: 'wouldn’t は「ウドゥン」と短く、t はほぼ消える。I wouldn’t ～ はやわらかい助言。',
      trap: 'won’t や don’t も意味は通るので、音の長さと d で決める。',
      use: 'I wouldn’t worry about it.（気にしなくていいと思うよ）' },

    // R fix: V2 (blind 60 %, right): the thank-you and unsure readings were weak; both are now things “Well, I mean” often does
    // why: soften ← “Well, I mean” heard as a softener (日本語の「いえ、まあ」); a reason ← “I mean” heard as “what I mean
    //   is…”
    { id: 'm2', skill: 'marker', level: 'B2', point: 'imean', seg: [93.3, 100.8],
      stem: 'Right after Andy says “Nope”, what do his next few words do?',
      choices: ['Take back the “no” and start a list', 'Soften the “no” so it sounds less rude',
                'Explain the “no” with a quick reason'], a: 0,
      cue: '「Nope」と「Okay」のあと、文頭の短い言葉。',
      line: 'Nope. — Okay. — *Well, I mean, yeah*, I’ve got a weird rash…',
      said: '「ほかには？」に「ない」と答えたのに、「まあ、ていうか、ある」と並べ始める。',
      mean: 'Well, I mean は言い直しの合図。no を取り消し、本当はあると言い出す。',
      trap: '「いえ、まあ」と遠慮で終わる型で聞きやすい。I mean のあとに本題が来る。',
      use: 'No. Well, I mean, maybe.（ううん、まあ、ていうか、たぶん）' },

    // R fix: S3. The cue named “with”, a word only the key had
    // why: choked while driving ← "you drove us here" comes later, and a candy-bar mishap; without chewing ←
    //   "swallowed every piece of gum" comes right after
    { id: 'd5', skill: 'detail', level: 'B1', point: 'twix', seg: [111.4, 116.85],
      stem: 'What does Andy say once happened with a Twix?',
      choices: ['He ate one with the wrapper still on', 'He choked on one while he was driving',
                'He swallowed one without chewing it'], a: 0,
      cue: '「Twix」のあとの、食べ方の説明。',
      line: 'I once ate a Twix *with the wrapper on it*.',
      said: '「ツイックスを包み紙ごと食べた。包み紙は出てきてない」と言う。',
      mean: 'wrapper ＝ 包み紙。外の紙まで食べてしまった、という話。',
      trap: 'swallowed は直後のガムの話。once ate のあとの with ～ まで聞く。',
      use: 'Take the wrapper off first.（まず包み紙を取って）' },

    // why: twenty ← the "five" runs into "years"; thirty-five ← "-ty-five" caught, the first part missed
    { id: 'n1', skill: 'number', level: 'B1', point: 'gum', seg: [116.85, 120.3], keep: true,
      stem: 'For how long has Andy swallowed every piece of gum he chewed?',
      choices: ['twenty years', 'twenty-five years', 'thirty-five years'], a: 1,
      cue: '「for the past」のあとの数。',
      line: 'every piece of gum that I’ve chewed *for the past 25 years*.',
      said: '「この25年間、かんだガムは全部飲みこんできた」と言う。',
      mean: 'for the past ～ years ＝ この～年間ずっと。今も続いていること。',
      trap: 'five の v が years につながり、聞き落としやすい。数の最後の音まで聞く。',
      use: 'I’ve lived here for the past ten years.（この10年ここに住んでいる）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'thumb', seg: [121.3, 123.5],
      stem: 'Type how the thumb news ends: “I broke my thumb ___.” (5 words)', answer: 'on the way over here',
      cue: '「thumb」のあと、場所と時を表す5語。',
      line: '…broke my thumb *on the way over here*.',
      said: '「ここへ来る途中で親指を折った」とついでのように言う。',
      mean: 'on the way over here ＝ ここへ来る途中で。the と over が弱く、ひと続き。',
      trap: 'way over がつながり、over を落としやすい。語数を数えて確かめる。',
      use: 'I grabbed coffee on the way over here.（来る途中でコーヒー買ってきた）' },

    // R fix: V2 (blind 70 %, right): the distractors were absolutes (“every one”, “nothing at all”); all three now start “a little help”
    // why: glasses ← “you definitely need glasses” heard as the end of it; a bill ← “we can’t afford it” earlier, and
    //   “thanks for nothing” heard as about money
    { id: 'g2', skill: 'gist', level: 'B2', point: 'visit', reveals: ['thanks'], seg: [125.4, 169.6],
      stem: 'How does Andy’s visit to Dr. Harris end up?',
      choices: ['He gets a little help, and advice he won’t take', 'He gets a little help, and glasses he agrees to wear',
                'He gets a little help, and a bill they can’t pay'], a: 0,
      cue: '医者の提案と、最後のやり取り。',
      line: 'you *definitely need glasses*. — No, he’s *not getting glasses*.',
      said: '親指の手当てと専門医の紹介だけ。メガネが要ると言われても妻が反対し、アンディも従う。',
      mean: '問題はほぼ解決せず、いちばん確かな助言も受け入れない、という結末。',
      trap: 'need glasses で決まりと取りやすい。助言のあと、誰が何と言い返すかまで聞く。',
      use: 'You definitely need a break.（絶対に休みが必要だよ）' },

    // R fix: V2 (blind 50 %, right): “glad it was free” was weak; the distractors now take “thanks” at face value, or the
    //   specialists as bad news
    // why: grateful ← “thanks” taken at face value, and the thumb does get fixed; worried ← “specialists for the other
    //   thousand things” heard as bad news
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'thanks', seg: [125.4, 134.2],
      stem: 'After hearing what the doctor can do, how does Andy feel?',
      choices: ['Let down that he got so little help', 'Grateful for the help with his thumb',
                'Worried about seeing so many specialists'], a: 0,
      cue: '「thanks」のあとの二語。',
      line: 'Wow, *thanks for nothing*, Dr. Harris.',
      said: '親指以外は専門医へ、と言われ、「なんにもしてくれなくてどうも」と返す。',
      mean: 'thanks for nothing ＝ 役に立たなかったね、という皮肉なお礼。',
      trap: 'thanks を素直なお礼と取りやすい。thanks for nothing は皮肉。',
      use: 'Thanks for nothing, weather app.（役に立たないな、天気アプリ）' },

    // why: two ← "to" and "the doctor" put "two" in the ear; a hundred ← "100 million" appointments is said just before
    { id: 'n2', skill: 'number', level: 'B2', point: 'ten', seg: [149.5, 156.6], keep: true,
      stem: 'After this week, how long do they think they can skip the doctor?',
      choices: ['two years', 'ten years', 'a hundred years'], a: 1,
      cue: '「for like」のあとの数。',
      line: 'we won’t have to go to the doctor *for like 10 years*.',
      said: '「1週間で山ほど予約したから、10年くらい医者に行かなくていい」と言う。',
      mean: 'like は「だいたい」のぼかし。100 million は大げさで、本当の数ではない。',
      trap: '直前の 100 million に引っぱられやすい。like のあとの数が答え。',
      use: 'I’ll be there in like ten minutes.（10分くらいで着く）' },

    // R fix: V2 (blind 55 %, right): “always decides what he wears” was an absolute only in a distractor (K6)
    // why: bossy ← “he’s not getting glasses” heard as an order; worried ← “we can’t afford it” earlier in the clip
    { id: 'a1', skill: 'attitude', level: 'C1', point: 'divorce', seg: [159.4, 165.7],
      stem: 'How serious is the threat about glasses?',
      choices: ['Playful: she likes his face just as it is', 'Bossy: she wants the say over how he looks',
                'Worried: she thinks glasses will cost too much'], a: 0,
      cue: '脅しの前の一文、理由の言い方。',
      line: 'I *like his face the way it is*. If you get glasses, I’ll divorce you.',
      said: '「メガネはだめ。今の顔が好きなの。メガネをかけたら離婚よ」と言う。',
      mean: '理由が「今の顔が好き」なので、離婚は本気でなく好意を大げさに言う冗談。',
      trap: '強い言葉だけ聞くと本気の命令に取りやすい。脅しは直前の理由とセットで聞く。',
      use: 'If you leave early, I’ll never forgive you.（先に帰ったら一生許さない）' },

    // R fix: S1. “Andy’s reason” named the speaker; no name in the audio settles who says it
    { id: 'x2', skill: 'dict', level: 'B1', point: 'handsome', seg: [165.6, 168.5],
      stem: 'Type the reason given: “___ for glasses.” (2 words)', answer: 'too handsome',
      cue: '「Doc」のあと、for の前の2語。',
      line: '…*Too handsome* for glasses.',
      said: '「聞いただろ、先生。メガネには男前すぎる」と言う。',
      mean: 'too ～ for … ＝ …には～すぎる。かけない言い訳を自慢にしている。',
      trap: 'too は弱く、handsome とつながる。too を落とさない。',
      use: 'I’m too tired for this.（これをやるには疲れすぎ）' },
  ]
};
