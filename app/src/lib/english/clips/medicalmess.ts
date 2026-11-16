// “April and Andy Are a Medical Mess - Parks and Recreation” (the official Parks and Recreation channel, Season 4):
// Andy and April cram a week of doctor's visits into their new insurance: Andy lists every odd symptom he has, fails an
// eye test, and when the desk asks for a $500 deductible the two run off, crash, and swear off doctors.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈198 s. Andy is named at 8.6 s and Dr. Harris
// at 67 s; April is named (by Andy) at 118 s. The captions are missing 153–166 s (the dash out, “I called an ambulance”,
// “Maybe we should see one of the other doctors”) and 185–190 s (“so romantic”), and garble 104 s (“lured you to any
// food” for “allergic to any food”), 110 s (“bended” for “been to”) and 117 s (“science class well test” for “science.
// — Cholesterol test”). Untested: 61 s, whisper “and I'll have to give you referrals”, captions “I don't have to give
// you referrals” (the lines trim it); 133–137 s, whisper “Here's your pill… we won't be needing that… free medicine
// card”, captions “bill… we need that… pre-medicine court”; the eye-chart words (visual); the “wiener” line (121 s).
// The stems leave unnamed the voices for “hooked on his own drugs”, “Yeah, he sneezed”, “That sounds about right”, the
// short corrections at 114–121 s and “Oh my God, you drove us here”.
// REVIEW 2026-11-16: pass 9, fix 14, drop 1, new 1; ear checks 2
// EAR CHECK: 88.3 s s1 — “won't have to” (both sources); the claim is that “won't” keeps its long “o” and the n/t,
//   unlike “want”, and starts with the w-glide, unlike “don't” (R: new distractor)
// EAR CHECK: 130.1 s x1 — “get you home” runs together as “getcha home” (both sources have the words)
import type { Clip } from '../types.ts';

export const medicalMess: Clip = {
  id: 'medicalmess', video: 'u2AFI_M-QGg', title: 'April and Andy Are a Medical Mess', dur: 209, wpm: 162,
  band: 'mid', tags: ['家', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2, blind 55 % (only the key had "not a real question"); all three now say how it's aimed at the doctor
    // why: real worry ← the question form taken at face value (a patient asking if her doctor is safe); small talk ←
    //   a question to the doctor read as chat; "I bet you are" answers it herself, as a dig
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'drugs', seg: [3.0, 9.0],
      stem: 'How does the question about the doctor’s “own drugs” come across?',
      choices: ['As a playful dig at the doctor', 'As a real worry about the doctor',
                'As friendly small talk with the doctor'], a: 0,
      cue: '質問のすぐあと、自分で付け足す短い一言。',
      line: 'Are you the kind of doctor who gets hooked on his own drugs? *I bet you are.*',
      said: '医者に「自分の薬にハマるタイプでしょ」と聞き、答えを待たずに「きっとそう」と言う。',
      mean: '本当に知りたい質問ではなく、からかい。自分で答えるので、相手の返事は要らない。',
      trap: '質問の形なので心配や確認に聞こえやすい。I bet が付いたら、決めつけの冗談。',
      use: 'You’re a morning person, aren’t you? I bet you are.（朝型でしょ。絶対そう）' },

    // why: more serious ← "smacked his head against the wall" sounds worse than tripping; she pushed him ← "wall" +
    //   "smacked" built into a confession; "Yeah" opens it, then the story is a different, sillier one
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sneeze', seg: [8.0, 22.2],
      stem: 'After Andy’s injury story, why does the next reply get a laugh?',
      choices: ['It starts like support, then tells a far sillier story', 'It makes his small fall sound far more serious',
                'It owns up that she pushed him into the wall'], a: 0,
      cue: '一言目の「Yeah」のあと、話の中身が同じかどうか。',
      line: 'I was reading an *encyclopedia*, and I tripped… — *Yeah, he sneezed* and smacked his head against the wall.',
      said: 'アンディは「百科事典を読んでいて転んだ」、次の声は「うん、くしゃみして壁に頭をぶつけた」。',
      mean: 'Yeah で支えるふりをして、もっと間の抜けた話に変えている。',
      trap: '壁と聞くと大けがに思えるが、原因はくしゃみ。Yeah のあとの中身で判断。',
      use: 'Yeah, he “worked late.” At the bar.（うん、「残業」ね。バーで）' },

    // R drop: i1 ("brain helmet, you call it"). The key, that he thinks it's the doctors' word, is a thin read of a
    //   mangled "as you call it" that could as well be a joke (V3, K1). The bank is at 25 with g3, over the cap of 24
    // why: all right now ← "about right" heard as "all right" (his head is fine); Andy's version ← "right" = correct, so
    //   the first story; the reply comes straight after the sneeze version
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'aboutright', seg: [19.0, 23.6],
      stem: 'Right after the sneeze version, what does the reply to it mean?',
      choices: ['That version is easy to believe', 'His head seems to be all right now',
                'Andy’s first version is correct'], a: 0,
      cue: 'くしゃみの話の直後、三語ほどの短い返事。',
      line: '— Yeah, he sneezed… — *That sounds about right*.',
      said: 'くしゃみの話を聞いて「まあ、そんなところだろうね」と返す。',
      mean: 'sounds about right ＝ いかにもありそう。後の話を信じている。',
      trap: 'about right を all right と聞くと「大丈夫そう」になる。直前の話への返事。',
      use: 'Two hours? That sounds about right.（2時間？まあそんなもんだね）' },

    // R fix: V2, blind 50 % (the key was the only gentle one and the longest); now a "watch it" reading, the usual
    //   doctor's script
    // why: unsure ← "would" read as a hedge (〜かもしれない), so he isn't sure; keep an eye ← "if it's a concussion"
    //   heard as the start of a warning; "so I wouldn't worry about it" is the advice
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'worry', seg: [23.0, 27.2],
      stem: 'What does the doctor’s last sentence about the head injury do?',
      choices: ['Tells Andy there’s no need for concern', 'Tells Andy to keep an eye on it for now',
                'Admits the doctor isn’t sure what it is'], a: 0,
      cue: '「mild」のあと、so で始まる部分。',
      line: 'if it’s a concussion, it’s extremely mild, so *I wouldn’t worry about it*.',
      said: '「脳しんとうでもごく軽い。だから気にしなくていい」と言う。',
      mean: 'I wouldn’t ＝ 私ならしない。「心配いらない」をやわらかく伝える。',
      trap: 'would を自信のなさと取りやすいが、ここは助言。',
      use: 'I wouldn’t worry about it. It happens.（気にしなくていいよ。よくあること）' },

    // R fix: V2, blind 60 % (the stem said "change things"); the stem is neutral now, and the choices are three moves
    //   on the no
    // why: politer no ← the Japanese frame: "well, I mean" as a softener before the same answer (まあ…); firmer ←
    //   "I mean" as "I mean it"; "yeah" and a list of symptoms follow
    { id: 'm1', skill: 'marker', level: 'B2', point: 'imean', seg: [26.3, 34.2],
      stem: 'After the short “Nope”, what does the opening of the next answer do?',
      choices: ['Turns the no into a real yes', 'Softens the no to sound polite', 'Repeats the no more firmly'], a: 0,
      cue: '「Nope」の直後、文の頭に並ぶ短い語。',
      line: 'Anything else bothering you? — Nope. — Okay, *well, I mean, yeah*, I’ve got a weird rash…',
      said: '「ほかに気になる所は？」に「ない」と答えた直後、「いや、まあ、ある」と言い直す。',
      mean: 'Well, I mean ＝ 言い直しの合図。ここから長い症状リスト。',
      trap: '日本語の「まあ」のように、答えをやわらげる語と取りやすい。後ろに yeah が来る。',
      use: 'No. Well, I mean, maybe a little.（いや。まあ、ちょっとはね）' },

    // R fix: V2, blind 55 % (the rash choice didn't fit "when he walks"); all three happen when he walks now. Cue leak ("make") fixed
    // why: shake ← "rattle" heard without "snake… sound" (ガタガタ揺れる); swell ← an ankle complaint people expect; the
    //   line says what they "make": a sound
    { id: 'd2', skill: 'detail', level: 'B1', point: 'ankles', seg: [37.3, 42.0],
      stem: 'What does Andy say his ankles do?',
      choices: ['Make an odd noise when he walks', 'Shake a little whenever he walks',
                'Swell up a bit when he walks'], a: 0,
      cue: '「when I walk」のあと、動詞と最後の一語。',
      line: 'Sometimes when I walk, my ankles *make like a weird rattlesnake sound*.',
      said: '「歩くと、ときどき足首からガラガラヘビみたいな変な音がする」と言う。',
      mean: 'make a sound ＝ 音がする。rattlesnake ＝ ガラガラヘビ。',
      trap: 'rattle だけだと「揺れる」と取りやすい。動詞と最後の sound を聞く。',
      use: 'My car makes a weird sound.（車から変な音がする）' },

    // why: 20 ← "twenty" heard, the "-five" lost; 35 ← twenty/thirty with the weak first part; both sources say 25
    { id: 'n1', skill: 'number', level: 'B1', point: 'gum', seg: [50.0, 54.1], keep: true,
      stem: 'For how long has Andy been swallowing his gum?',
      choices: ['20 years', '25 years', '35 years'], a: 1,
      cue: '「for the past」のあとの数。',
      line: 'I’ve swallowed every piece of gum… for the past *25 years*.',
      said: '「この25年、かんだガムを全部飲み込んできた」と言う。',
      mean: 'for the past 25 years ＝ この25年ずっと。今も続いている習慣。',
      trap: 'twenty-five は後半の five が弱く、twenty だけに聞こえやすい。最後まで聞く。',
      use: 'I’ve lived here for the past ten years.（この10年ここに住んでいます）' },

    // why: when he fell ← the fall is the story he came in with; hit the wall ← the sneeze version; the line says "on the
    //   way over here"
    { id: 'd3', skill: 'detail', level: 'B1', point: 'thumb', seg: [54.4, 59.2],
      stem: 'When did Andy break his thumb?',
      choices: ['On his way to see the doctor', 'When he fell while reading',
                'When his head hit the wall'], a: 0,
      cue: '「thumb」の直後に続く場所の言い方。',
      line: 'And broke my thumb *on the way over here*. Just fix me.',
      said: '「ここに来る途中で親指を折った。とにかく治して」と言う。',
      mean: 'on the way over here ＝ ここへ来る途中。症状の最後に、さらっと大けがを足している。',
      trap: '最初の転んだ話と結びつけやすいが、親指は別の話。場所の言い方を聞き取る。',
      use: 'I lost my umbrella on the way over here.（来る途中で傘をなくした）' },

    // why: not charging ← "for nothing" read literally as "for free" (タダで); nothing serious ← "nothing" heard as "it's
    //   nothing"; the doctor has just said he can only do the thumb
    { id: 'p2', skill: 'phrase', level: 'B2', point: 'nothing', seg: [58.6, 68.0],
      stem: 'After the doctor’s answer, what does Andy mean by his thank-you?',
      choices: ['You didn’t help me with anything', 'You helped, and didn’t charge me',
                'I’m glad it turned out to be nothing'], a: 0,
      cue: '「Wow」のあと、thanks の後ろの二語。',
      line: 'Wow, *thanks for nothing*, Dr. Harris.',
      said: '親指以外は専門医へ、と言われ「わあ、どうも役立たず」と返す。',
      mean: 'thanks for nothing ＝ 何もしてくれなくてどうも。お礼の形の文句。',
      trap: 'for nothing を「タダで」と取りやすい。Wow と、直前の医者の答えから皮肉と分かる。',
      use: 'You forgot again? Thanks for nothing.（また忘れたの？役に立たないなあ）' },

    // R fix: V2, blind 60 % (the insult choice had no insult to point to); all three now "answer the jab", and the
    //   counterattack names something he could have mocked
    // why: owns up ← "You're welcome" heard as accepting the blame; mocks ← a dry reply read as a jab at Andy's long list;
    //   "You're welcome" is the stock reply to real thanks, nothing more
    { id: 'h2', skill: 'humor', level: 'C1', point: 'welcome', reveals: ['nothing'], seg: [64.9, 69.4],
      stem: 'Why does Dr. Harris’s short reply to Andy get a laugh?',
      choices: ['He answers the jab with the stock reply to real thanks', 'He answers the jab by owning up to being no help',
                'He answers the jab by mocking Andy’s many complaints'], a: 0,
      cue: '皮肉なお礼のあと、医者の返事の決まり文句。',
      line: 'Wow, thanks for nothing, Dr. Harris. — *You’re welcome.*',
      said: '「役に立たなかったね、どうも」と言われ、医者は「どういたしまして」とだけ返す。',
      mean: '皮肉を普通のお礼として受けている。気づかないのか、気づかないふりなのか。',
      trap: '言い返しや謝罪を期待すると外れる。決まり文句をそのまま返す、ずれが笑い。',
      use: 'Thanks a lot. — Anytime!（どうもね。—いつでもどうぞ！）' },

    // why: drive home ← "drove" heard as "drive" (a worry about the trip back); faking ← the silly chart answers
    //   ("potato shape", "middle finger") sound like clowning; "Oh my God, you drove us here" is alarm, not doubt
    { id: 'i3', skill: 'infer', level: 'B2', point: 'drove', seg: [68.8, 83.4],
      stem: 'After the eye-chart reading, what does the “Oh my God” line realize?',
      choices: ['He drove them here when he can barely see', 'He can’t see well enough to drive them home',
                'He has been faking how badly he can see'], a: 0,
      cue: '視力検査の読み上げの直後、驚きの一言。',
      line: '…smudge, the rest are all smudges. — Oh, my God, *you drove us here*.',
      said: '視力表がほとんど「しみ」にしか見えないと分かった直後、「ここまで運転してきたの？」と驚く。',
      mean: 'これだけ見えない人が運転していた、と気づいた一言。',
      trap: 'drove を drive と聞くと帰りの心配になる。過去形と here で、来た道の話。',
      use: 'Wait, you walked here? In this rain?（待って、歩いてきたの？この雨で？）' },

    // R fix: V2, blind 65 % ("so many doctors this week" echoed "all at once"); the stem is neutral now. `said` no
    //   longer gives s1's "won't have to"
    // why: second opinion ← the head injury opens the clip, so the visits look like its follow-up; red skin ← the
    //   redness comes up in this stretch; "made… appointments for ourselves in one week" is the plan
    { id: 'g1', skill: 'gist', level: 'B2', point: 'plan', seg: [81.4, 112.8],
      stem: 'What is the plan behind this week’s doctor visits?',
      choices: ['To get all their check-ups out of the way', 'To get a second opinion on Andy’s fall',
                'To find out why April’s skin went red'], a: 0,
      cue: '「appointments」を含む文と、その次の文。',
      line: 'We made, like, *100 million doctor’s appointments for ourselves in one week*.',
      said: '自分たちのために、1週間で医者の予約を山ほど入れた、と言う。',
      mean: '健康診断をまとめて済ませる計画。けがやアレルギーは、その中の一つ。',
      trap: 'けがやアレルギーの話が目立つが、予約は ourselves と自分たちの全部。',
      use: 'Let’s get it all done in one day.（1日で全部済ませよう）' },

    // why: 1 year ← "one week" is the number heard just before; 100 years ← "100 million" earlier; "like ten years"
    { id: 'n2', skill: 'number', level: 'B1', point: 'tenyears', reveals: ['wont'], seg: [86.6, 90.2], keep: true,
      stem: 'After this week, how long do they think they can skip doctors?',
      choices: ['1 year', '10 years', '100 years'], a: 1,
      cue: '「for, like」のあとの数。',
      line: 'After this, we won’t have to go to the doctor for, like, *10 years*.',
      said: '「これで、10年くらい医者に行かなくて済む」と言う。',
      mean: 'for like 10 years ＝ だいたい10年。like は「〜くらい」のぼかし。',
      trap: '直前の one week や 100 million に引っぱられやすい。like の直後を聞く。',
      use: 'I waited for, like, an hour.（1時間くらい待ったよ）' },

    // R fix: V2, blind 60 % (only the key fit "skip doctors" as a negative); "will" → "don't", a second negative that
    //   shares the long "o"
    // why: want to ← "won't" and "want" share most of their sound; don't have to ← the same "o" and n't, only the first
    //   consonant differs; "we won't" starts with a w-glide
    { id: 's1', skill: 'sound', level: 'B2', point: 'wont', seg: [86.6, 90.2],
      stem: 'Fill the gap: “After this, we ___ go to the doctor…”',
      choices: ['won’t have to', 'want to', 'don’t have to'], a: 0,
      cue: '「we」の直後、長めに伸びる母音。',
      line: 'After this, we *won’t have to* go to the doctor…',
      said: '「これでもう医者に行かなくていい」と言っている。',
      mean: 'won’t は「ウォウント」と長い「オウ」。want は短い「ア」に近い。',
      trap: 'n’t の t が消えると want に、「オウ」だけだと don’t にも聞こえる。頭の w と母音の長さで判断。',
      use: 'You won’t have to wait long.（長く待たなくて大丈夫）' },

    // R fix: V2, blind 55 % (the cost choice had no support); now two "Not serious" readings, so the reason decides
    // why: serious ← "I'll divorce you" taken literally; teasing the doctor ← her dig at the doctor at the start, read
    //   back into it; the reason she gives is "I like his face the way it is", aimed at Andy
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'divorce', seg: [92.8, 103.0],
      stem: 'How serious is April about leaving Andy over glasses?',
      choices: ['Not serious; she just likes his face as is', 'Not serious; she is only teasing the doctor',
                'Fully serious; she would really leave him'], a: 0,
      cue: 'メガネに反対する理由と、アンディの返事。',
      line: 'I *like his face the way it is*. If you get glasses, I’ll divorce you.',
      said: '「彼の顔は今のままがいい。メガネをかけたら離婚する」と言う。',
      mean: '大げさなおどしで、顔が好きだと伝えている。本気の離婚話ではない。',
      trap: 'divorce を文字通りに取りやすい。理由が「顔が好き」なら、大げさな愛情表現。',
      use: 'Cut your hair and I’ll never speak to you!（髪切ったら口きかないから！）' },

    // anchor: 94.8–99.0 s her reason is "I like his face the way it is"; 99.1–101.5 s his reply turns the threat into a
    //   compliment: "you heard her, Doc. Too handsome for glasses."
    // R fix: K1, "She makes his choices, and he goes along with it" was defensible (she decides, and he says "you
    //   heard her"); the three now differ only in what she means and how he takes it, each wrong in one place
    // why: threat ← "I'll divorce you" taken literally, and "you heard her" read as giving in (恐妻); joke he misreads ←
    //   her tone is light, but his "Too handsome" shows he got it, as praise
    { id: 'nt2', skill: 'attitude', level: 'C2', point: 'divorce', seg: [92.8, 103.0],
      stem: 'What do April’s threat and Andy’s reply tell us about how they see each other?',
      choices: ['She means it as praise, and he takes it that way', 'She means it as a threat, and he gives in to it',
                'She means it as a joke, but he takes it as a threat'], a: 0,
      cue: 'アンディの返事の「Too」で始まる三語。',
      line: 'I like his face the way it is. If you get glasses, I’ll divorce you. — Well, you heard her, Doc. *Too handsome for glasses.*',
      said: '「メガネをかけたら離婚」と言われ、アンディは医者に「聞いたでしょ。メガネには男前すぎるって」と返す。',
      mean: 'おどしの形のほめ言葉を、彼はほめ言葉としてそのまま受け取る。二人は同じ冗談の中にいる。',
      trap: '妻の命令に夫が従う型で聞きやすい。返事がほめ言葉を言い直していたら、おどしは愛情表現。',
      use: 'You heard her. I’m too cute to cook.（聞いたでしょ。私、料理するには可愛すぎるって）' },

    // R fix: K1, "the food test is what made her skin go red" is literally true (the test is done with needles); V2,
    //   blind 50 %. New distractors each misplace what she says she reacts to
    // why: food ← "allergic to any food" from the doctor just before; stabbed too hard ← "getting stabbed" heard as a
    //   complaint about the doctor; "allergic to getting stabbed by needles" names the needle itself
    { id: 'h3', skill: 'humor', level: 'C1', point: 'needles', seg: [102.9, 110.6],
      stem: 'Why is April’s guess about her redness funny?',
      choices: ['She calls a normal needle mark an allergy', 'She says she’s allergic to a food in the test',
                'She says the doctor stabbed her far too hard'], a: 0,
      cue: '「allergic to」のあと、何に反応したと言うか。',
      line: 'I think, *based on the redness*, I might be *allergic to getting stabbed by needles*.',
      said: '「この赤みから見て、針で刺されることにアレルギーがあるかも」と言う。',
      mean: '針で赤くなるのは当たり前。それを医者の口ぶりで「アレルギー」と言う冗談。',
      trap: '直前の food に引かれやすい。何へのアレルギーかは、最後の needles で決まる。',
      use: 'Based on the smell, I think dinner’s ready.（においからして、夕飯できたかな）' },

    // R fix: V4, a pattern in a 15 s stretch, not the scene's purpose: gist → pragma (g3 is the new second gist). V2,
    //   blind 50 % ("backing him up" was a filler); now a mocking reading. S4: seg starts at 109.5 s, just before
    //   "We have already been" (110.1 s), to fit 15 s
    // why: adds tests ← the replies come between his, so they sound like more tests; mocking ← short dry replies heard as
    //   jokes; each reply swaps his word: microwaved → "X-rayed", removed → "Looked at"
    { id: 'g2', skill: 'pragma', level: 'B2', point: 'correct', seg: [109.5, 121.3],
      stem: 'As Andy lists the tests they’ve had, what do the short replies keep doing?',
      choices: ['Fixing the words he uses for each test', 'Adding the tests he forgot to mention',
                'Making fun of each test he names'], a: 0,
      cue: 'アンディの言葉と、すぐあとの短い言葉を比べて。',
      line: 'I got my ankles *microwaved*. — *X-rayed*. … April had her sinuses *removed*. — *Looked at*.',
      said: '「足首をチンされた」に「レントゲン」、「鼻を取られた」に「診てもらった」と、短く言い直す。',
      mean: 'アンディの大げさで変な言い方を、一語で正しく直している。',
      trap: '間に入る短い言葉を、検査の追加と聞きやすい。直前の語と入れかわっているか聞く。',
      use: 'He ran ten miles. — Ten blocks.（10マイル走ったって。—10ブロックね）' },

    // why: "get you home" heard as "get your home"; the grammar would add words, the speech runs them together
    { id: 'x1', skill: 'dict', level: 'B2', point: 'icecream', seg: [129.6, 132.9],
      stem: 'Type what she says: “Let’s ___ and get me some ice cream.” (3 words)', answer: 'get you home',
      cue: '「Let’s」のすぐあと。三語がつながって聞こえる。',
      line: 'Let’s *get you home* and get me some ice cream.',
      said: '「あなたを家に連れて帰って、私にはアイスを買おう」と言う。',
      mean: 'get you home ＝ 家に連れて帰る。get you は「ゲッチュ」とつながる。',
      trap: 'get you が一語に聞こえ、your と書きやすい。後ろの home まで、三語で数える。',
      use: 'Let’s get you a coffee.（コーヒーでも買ってあげるよ）' },

    // why: $50 ← "five" heard, "hundred" weak; $5,000 ← hundred/thousand swap; both sources say $500, twice
    { id: 'n4', skill: 'number', level: 'B1', point: 'cost', seg: [137.2, 140.8], keep: true,
      stem: 'How much is the deductible for dental work?',
      choices: ['$50', '$500', '$5,000'], a: 1,
      cue: '「deductible」の直前の数字。',
      line: 'there’s a *$500* deductible for dental procedures.',
      said: '「歯の治療には500ドルの自己負担がある」と言われる。',
      mean: 'deductible ＝ 保険が払う前に自分で払う額。保険があっても払う分。',
      trap: 'hundred は弱く、five だけ残りやすい。thousand なら「サウ」が聞こえる。',
      use: 'Is there a deductible?（自己負担額はありますか）' },

    // R new: g2 moved to pragma (V4), leaving one gist; this asks how the visits end. Blind read (fresh): ~40 %
    // why: other doctors ← "Maybe we should see one of the other doctors" just before (whisper only; the captions miss
    //   153–166 s); pay up ← the desk's "$500" and the week's plan; "No, no more doctors… go home and care for each
    //   other" settles it
    { id: 'g3', skill: 'gist', level: 'B2', point: 'end', reveals: ['cost'], seg: [137.2, 185.0],
      stem: 'After the desk asks for money, what do Andy and April end up doing?',
      choices: ['Giving up on doctors to look after each other', 'Trying one of the other doctors on their list',
                'Paying the deductible to finish their check-ups'], a: 0,
      cue: '救急車の話のあと、「No」で始まる返事。',
      line: '*No, no more doctors.* … Let’s just go home and *care for each other*.',
      said: 'お金を求められて逃げ出し、事故のあと「もう医者はなし。家に帰って看病し合おう」と言う。',
      mean: '1週間で全部済ませる計画は、500ドルと事故で投げ出して終わる。',
      trap: '直前に「ほかの医者に」という案が出るので、続けると取りやすい。No のあとが答え。',
      use: 'No more takeout. Let’s cook at home.（もう出前はなし。家で作ろう）' },

    // anchor: 141.0–145.6 s "I think you're wrong… the insurance thing… I believe we're covered": a vague label and two
    //   hedges; 145.8 s "It's still $500"; 195.6 s he asks "What is insurance?"
    // R fix: V2, blind 55 % (“tired of explaining” had nothing to explain); now a near miss from “you're wrong”
    // why: sure of a mistake ← "you're wrong" heard as confidence; cheated ← "you're wrong" plus his later "scam
    //   artists"; the vague label and "I believe" show he doesn't know, and the last question confirms it
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'thing', reveals: ['cost'], seg: [140.3, 147.2],
      stem: 'When Andy says they have “the insurance thing”, what does the wording give away?',
      choices: ['That he doesn’t really know what insurance is', 'That he is sure the desk has made a mistake',
                'That he thinks the desk is trying to cheat them'], a: 0,
      cue: '名前の代わりの「thing」と、後ろの「I believe」。',
      line: 'Oh, I think you’re wrong. We have *the insurance thing*. *I believe* we’re covered. — It’s still $500.',
      said: '500ドルと言われ「保険のやつがある。カバーされてるはず」と返す。',
      mean: '名前を言えず thing でぼかし、I think と I believe も重ねる。最後の「保険って何？」で確定する。',
      trap: 'you’re wrong で自信があるように聞こえる。ぼかし語が重なったら、知らないサイン。',
      use: 'I did the tax thing online, I think.（税金のあれ、ネットでやった…はず）' },

    // R fix: V2, blind 60 % (the key was the only image, "like a fish on a line"); plain wording now, and a second
    //   cynical reading
    // why: feel better ← "free stuff" heard as free medicine that helps; high prices ← "scam artists" read as overcharging;
    //   "reel… in" is a fishing verb, and "Next thing you know, bam!" is the catch
    { id: 'p4', skill: 'phrase', level: 'C1', point: 'reelin', seg: [166.3, 178.6],
      stem: 'In Andy’s rant, what does he say doctors do with the free stuff?',
      choices: ['Use it to hook you so you keep coming back', 'Use it to make you feel better for a while',
                'Use it to make up for their high prices'], a: 0,
      cue: '「scam artists」の直後、in で終わる動詞。',
      line: 'They’re a bunch of scam artists. They *reel you in* with the free stuff.',
      said: '「医者はだます連中だ。タダのものでおびき寄せる」と言う。',
      mean: 'reel in ＝ 釣り糸を巻いて魚を引き寄せる。タダはエサ、という見方。',
      trap: 'free stuff を親切と取りやすい。scam artists のすぐあとなので、だます話の続き。',
      use: 'They reel you in with a low price.（安さで客を釣るんだ）' },

    // anchor: 173.8–178.1 s "Next thing you know, bam! You run into an ambulance. Every time.": the patient runs into it,
    //   so the "scam" is his own crash, made into a rule by "every time"
    // why: doctors ← his rant names them ("scam artists"), the sincere reading; drivers ← "run into an ambulance" heard
    //   the other way round, as an ambulance hitting you
    { id: 'nt1', skill: 'humor', level: 'C2', point: 'everytime', reveals: ['reelin'], seg: [166.3, 178.6],
      stem: 'In Andy’s rant about doctors, who is the joke on?',
      choices: ['Andy, who blames doctors for his own crash', 'Doctors, who lure people in with free care',
                'Ambulance drivers, who keep hitting people'], a: 0,
      cue: '「You run into」の主語と、最後の二語。',
      line: 'They *reel you in* with the free stuff. Next thing you know, bam! *You run into an ambulance. Every time.*',
      said: '「タダで釣って、気づけばドン！救急車にぶつかる。毎回そうだ」と医者を責める。',
      mean: 'ぶつかったのは自分。自分の事故を医者のせいにして、every time で決まりごとにしている。笑われているのは本人。',
      trap: '責める言葉が医者に向くので、医者が的に見えやすい。誰が何にぶつかったか、主語を追う。',
      use: 'I trip on this step every time.（この段差、毎回つまずくんだ）', retired: true },
  ]
};
