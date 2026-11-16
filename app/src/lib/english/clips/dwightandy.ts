// “Dwight vs. Andy - The Office US” (the official The Office channel, BEST OF SEASON 3): Dwight and Andy meet and argue
// over who outranks whom; Michael names Jim his new number two and Andy flatters him; in the parking lot the two trade
// car insults that sink to "Idiot!", and one of them tells the camera he won.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈154.5 s. Untested on purpose: 16.4–18.6 s
// (both sources have "My title has manager in it", which doesn't fit Andy's point; no key rests on it), 64–73 s (whisper
// "Shut it… suck up", the captions only "leadership… up"), 84.6 s ("please" in the captions only), 138–150 s (whisper
// "I always make you funny…", the captions "I was making fun of your comeback, that's why it worked"), 124.8–128.4 s
// ("Cor-not University" needs Cornell). Dwight and Andy name themselves at 8.5 and 10.8 s, and Michael says "Thank you,
// Andy" at 61.5 s; stems name the car owners by the show's casting (Dwight: Trans Am, Andy: X-Terra) but no key turns
// on which voice is whose.
// REVIEW 2026-11-16: pass 4, fix 18, drop 0, new 0; ear checks 1
// OPEN: d2 (Jim) stays answerable from show knowledge for fans; c1 is still near 50 % blind (the talking-head irony
//   is what the C2 type asks for).
// EAR CHECK: 105.5 s f3 — "1985 called, it wants its car back": both sources garble the middle ("called it once it's
//   car back"); the line shown fills in "wants its", and the key needs only "1985 called… car back" plus the '87 reply.
import type { Clip } from '../types.ts';

export const dwightVsAndy: Clip = {
  id: 'dwightandy', video: 'QwfjeegBDeo', title: 'Dwight vs. Andy', dur: 178, wpm: 129,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2 (70 % blind): "met before" was a filler; "what each does on the sales team" is the literal reading of
    //   the two introductions.
    // why: film ← the film talk fills the second half of the meeting; what each does ← both open by stating their jobs
    { id: 'g1', skill: 'gist', level: 'B2', point: 'meet', reveals: ['rank'], seg: [5.2, 31],
      stem: 'What is the first conversation between Dwight and Andy mostly about?',
      choices: ['Which of the two ranks higher at work', 'Which of the two knows more about film',
                'What each of them does on the sales team'], a: 0,
      cue: '肩書きを言い合ったあとの、最初の質問。',
      said: '自己紹介で肩書きを言い合い、どちらが上かで張り合う。映画の話もその延長。',
      mean: '映画の話は、自分が上だと示すための材料。場面の中心は上下関係の張り合い。',
      trap: '後半は映画の話が続くので、そちらに引かれやすい。話題より、何を争っているかを聞く。',
      use: 'So who reports to whom here?（で、ここでは誰が誰の上司？）' },

    // R fix: V2 (50 % blind): the key shared one word with each distractor, so it was the "middle" choice. Now a
    //   balanced 2×2 (assistant or not, director or manager); 4 choices, all strong.
    // why: assistant ← Dwight's title, said just before; manager ← both titles start with "regional"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'title', seg: [10.2, 16.3],
      stem: 'How does Andy introduce his job title?',
      choices: ['Regional director in charge of sales', 'Assistant regional director in charge of sales',
                'Regional manager in charge of sales', 'Assistant regional manager in charge of sales'], a: 0,
      cue: '「Andy Bernard」と名乗った直後。',
      line: 'Andy Bernard, *regional director in charge of sales*.',
      said: '「営業担当の地域ディレクター」と名乗る。',
      mean: 'in charge of ～ ＝ 〜の担当・責任者。肩書きの後ろによく付く。',
      trap: '二人とも regional で始まるので混ざりやすい。後ろの director か manager かで聞き分ける。',
      use: 'Who’s in charge of the booking?（予約の担当はどなたですか）' },

    // R fix: V2 + K6: the key was the only "instead" and one distractor the only hedge ("at first"). Now three plain
    //   yes/no answers.
    // why: Michael ← Michael has just left ("Mike" is heard), a "we both answer to the boss" reading; to Dwight ← the
    //   short set phrase is missed, so Dwight's assumption seems to stand
    { id: 'i3', skill: 'infer', level: 'B2', point: 'rank', seg: [13.3, 23],
      stem: 'How does Andy answer Dwight’s question about reporting?',
      choices: ['No; Dwight will report to him', 'No; they both report to Michael',
                'Yes; he will report to Dwight'], a: 0,
      cue: '質問への最初の答え、短い決まり文句のあと。',
      line: 'So you’ll be reporting to me, then? — *On the contrary.*',
      said: '「じゃあ僕の部下だね」に「その逆だ」と返し、director の方が上だと言う。',
      mean: 'On the contrary ＝ まったく逆。部下はそっちだ、という切り返し。',
      trap: '短い決まり文句を聞き逃すと、Dwight の前提がそのまま通ったように聞こえる。',
      use: 'Bored? On the contrary, I loved it.（退屈？いや逆に、すごく楽しかった）' },

    // R fix: V2 (80 % blind): the dream-job distractor was the odd one out. Now "a film job he once had" (the keyword
    //   trap: film set heard as his past), of the same form.
    // why: below ← "manager" is heard in the stretch, and "highest" is missed; film job ← "on a film set" heard as
    //   his own past work
    { id: 'h1', skill: 'humor', level: 'C1', point: 'filmset', reveals: ['rank'], seg: [13.3, 23],
      stem: 'When Andy brings up a film set, what makes his argument funny?',
      choices: ['He settles an office rank by film-set rules', 'He admits that a director ranks below a manager',
                'He brags about a film job he once had'], a: 0,
      cue: '「director」のあと、どこの話を持ち出すか。',
      line: 'I’m a director. Which *on a film set* is the *highest title there is*.',
      said: 'director だと言い、「映画の撮影現場では一番上の肩書きだ」と付け足す。',
      mean: '会社の上下を、関係のない映画の世界の基準で決めようとしている。本人は大まじめ。',
      trap: 'film が何度も出るので映画好きの話に聞こえるが、肩書き争いの理屈に使っている。',
      use: 'That’s not how it works here.（ここではそうはいかないよ）' },

    // R fix: V2 (80 % blind): envy was a filler. "Doubt: he does not believe the number" (sarcasm read as disbelief) is
    //   the near miss now.
    // why: real praise ← "Congratulations" taken at face value (the お祝い frame); doubt ← sarcasm heard as "yeah,
    //   right", disbelief instead of "that's not much"
    { id: 't1', skill: 'attitude', level: 'C1', point: 'films', seg: [22.7, 31],
      stem: 'How does Andy mean his one-word reply to the film count?',
      choices: ['As a put-down: that is not many films', 'As real praise: that is a lot of films',
                'As doubt: he does not believe that number'], a: 0,
      cue: '「何でも知っている」と、その根拠の数の差。',
      line: 'I know *everything* about film. I’ve seen over 240 of them. — *Congratulations.*',
      said: '「映画は全部知ってる、240本以上見た」に、一言「おめでとう」とだけ返す。',
      mean: '「全部知っている」の根拠にしては少ない数。おめでとうは、大したことないと流す皮肉。',
      trap: 'お祝いの言葉なので本気に取りやすい。大きな主張に小さな根拠が来たら、皮肉を疑う。',
      use: 'Wow, congratulations. Want a medal?（へえ、おめでとう。メダルでもいる？）' },

    // R fix: V2 (60 % blind): the key was the only reply that pushed back. "You think I'm making that up?" (sarcasm read
    //   as disbelief) replaces the lend filler.
    // why: thank-you ← praise answered as praise (the お礼 frame); making it up ← sarcasm read as doubt about the
    //   number, not about its size
    // anchor: 24.9–29.2 s "I know everything about film… over 240 of them", then at 29.8 s a single "Congratulations":
    //   the reply is far too small for the claim, and nothing else is said
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'films', seg: [22.7, 31],
      stem: 'Which reply from Dwight would show he caught what “Congratulations” meant?',
      choices: ['Hey, 240 is a lot of movies!', 'Thank you. It took years of work.',
                'What, you think I’m making that up?'], a: 0,
      cue: '「何でも知ってる」の根拠と、一言の返事の釣り合い。',
      line: 'I’ve seen over 240 of them. — *Congratulations.*',
      said: '「240本以上見た」と胸を張ると、一言「おめでとう」とだけ返される。',
      mean: '「全部知っている」にしては少ない数への、皮肉なお祝い。気づいたなら、数を弁護するのが自然な返事になる。',
      trap: 'お祝いにはお礼、という型で選びやすい。返事は言葉の形でなく、相手が言いたいことに返す。',
      use: 'Hey, that’s still a lot!（いや、それでも多いでしょ！）' },

    // why: 24 ← "two forty" heard as twenty-four; 214 ← -teen/-ty plus hundred; 2,400 ← "two forty" heard as
    //   "twenty-four hundred"
    { id: 'n1', skill: 'number', level: 'B1', point: 'films', seg: [24.4, 29.7], keep: true,
      stem: 'How many films does Dwight say he has seen?',
      choices: ['24', '214', '240', '2,400'], a: 2,
      cue: '「I’ve seen over」のすぐあと。',
      line: 'I’ve seen *over 240* of them.',
      said: '「240本以上見た」と言う。',
      mean: 'over ＝ 〜以上。直前の「映画のことは何でも知っている」の根拠として出した数。',
      trap: '桁は、hundred があるかと語尾の -ty で決まる。短く言われると 24 に、長く聞くと 2,400 に寄りやすい。',
      use: 'I’ve been there over twenty times.（20回以上行ったよ）' },

    // R fix: V2 (70 % blind): "complains about pay" was a filler. All three now end with Andy reacting, and "Andy
    //   thanks him" uses the "Thank you, Andy" that Michael says.
    // why: raise ← "pay raise" is said; number three ← "number three" is asked about, but not decided; thanks ← it is
    //   Michael who says "Thank you, Andy"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'announce', reveals: ['flatter'], seg: [36.1, 64],
      stem: 'What happens in the scene where Michael makes his announcement?',
      choices: ['He names a new number two, and Andy praises him', 'He announces a pay raise, and Andy thanks him',
                'He names a new number three, and Andy thanks him'], a: 0,
      cue: '発表のあと、Andy が Michael に何を言うか。',
      said: 'Michael が新しいナンバー2を発表し、Andy が大げさにほめる。',
      mean: '発表そのものより、そのあと誰が Michael に取り入るかが場面の見どころ。',
      trap: 'number three も pay raise も聞こえるが、決まったのは2番だけ。',
      use: 'And now, a big announcement.（さて、大事なお知らせです）' },

    // R fix: K7 (tested): bare names failed the length rule (3 vs 4, 6). Now short sentences. Show fans may still know
    //   it (open).
    // why: Andy ← the newcomer who flatters Michael next; Dwight ← the "assistant regional manager" of the first scene
    { id: 'd2', skill: 'detail', level: 'B1', point: 'two', seg: [39.8, 44.4],
      stem: 'Who does Michael choose as his new number two?',
      choices: ['He picks Jim', 'He picks Andy', 'He picks Dwight'], a: 0,
      cue: '「decided to make」のすぐあとの名前。',
      line: 'I have decided to make *Jim* my new number two.',
      said: '「よく考えた末、ジムを新しいナンバー2にすることにした」と発表する。',
      mean: 'number two ＝ 2番手、右腕。make A B ＝ A を B にする。',
      trap: 'Jim は一音で短く、make にくっついて聞き逃しやすい。人名は動詞のすぐあとを待つ。',
      use: 'They made her team leader.（彼女がチームリーダーになった）' },

    // R fix: S1 + V2: "In the end" in the stem signalled a reversal. Removed.
    // why: no raise ← "doesn't come with a pay raise" heard first, and the reply's "No" sounds like agreement; not
    //   decided ← "not decided yet" is said a moment later, about number three
    { id: 'd3', skill: 'detail', level: 'B2', point: 'raise', seg: [44.9, 50.4],
      stem: 'Does the number-two job come with more pay?',
      choices: ['Yes, it comes with a raise', 'No, it comes with no raise', 'That has not been decided yet'], a: 0,
      cue: '「pay raise」のすぐあとの、短い返事。',
      line: 'it doesn’t come with a pay raise. — No, *it does, actually*.',
      said: '「昇給はないけどね」に、すぐ「いや、実はある」と返される。',
      mean: 'No は前の文の打ち消し。it does ＝ 昇給はある。',
      trap: '日本語の「いいえ、ない」とは逆になりやすい。does の強さで判断。',
      use: 'No, it does, actually. I checked.（いや、実はそうなんだ。確かめた）' },

    // R fix: V2 (80 % blind): the key was the only unkind choice. "Tease Jim for being too eager" is unkind too, and
    //   "If he even wants it" says the reverse of eager.
    // why: raise for himself ← "pay raise" heard as his own request; too eager ← a jab is heard, but aimed at Jim
    { id: 'i1', skill: 'infer', level: 'C1', point: 'raise', reveals: ['two'], seg: [44.9, 50.4],
      stem: 'What is the speaker trying to do with “If he even wants it…”?',
      choices: ['Make the new job sound less special', 'Hint that he wants a raise himself',
                'Tease Jim for being too eager'], a: 0,
      cue: '「even」の言い方と、すぐ返ってくる訂正。',
      line: '*If he even wants it*, it doesn’t come with a pay raise.',
      said: '「欲しければの話だけど、昇給もないしね」と口をはさみ、すぐ訂正される。',
      mean: 'even で「そもそも欲しいかどうか」と仕事の値打ちを下げる。選ばれなかった悔しさがにじむ。',
      trap: 'Jim へのからかいに聞こえるが、けなす相手は仕事のほう。even に注目。',
      use: 'If you even want it, that is.（まあ、欲しければだけど）' },

    // R fix: V2 + S1 (85 % blind): the stem named the number-three question, which gave the key. The stem now asks
    //   about the timing only, and "smooth things over after the pay-raise jab" replaces "cheer him up".
    // why: right pick ← "handled this entire situation" heard as approval of choosing Jim; smooth over ← the praise
    //   read as easing the tension after the jab about pay
    { id: 'i2', skill: 'infer', level: 'C1', point: 'flatter', reveals: ['two'], seg: [50.7, 64],
      stem: 'Why does Andy choose this moment to praise Michael?',
      choices: ['To get himself picked for the open spot', 'To back Michael’s choice of Jim for it',
                'To smooth things over after the pay jab'], a: 0,
      cue: '「not decided yet」のすぐあとに、誰が話し出すか。',
      line: 'That I have *not decided yet*. — Michael, I would just like to say…',
      said: '「3番はまだ決めていない」と聞いた直後、Andy が「見事な対応でした」とほめる。',
      mean: '空いている3番の座を狙った売り込み。ほめたタイミングが、目的を語っている。',
      trap: 'ほめ言葉は本心にも聞こえる。ほめた中身より、ほめたタイミングに注目。',
      use: 'Not to suck up, but great job.（ごますりじゃないけど、すごく良かった）' },

    // why: fair thinking ← "after a great deal of thought" just before; good humor ← an unknown word guessed from
    //   Michael's jokey style
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'aplomb', reveals: ['flatter'], seg: [55, 62.5],
      stem: 'Andy says Michael handled it “with great aplomb.” What does he mean?',
      choices: ['With calm, sure confidence', 'With careful, fair thinking', 'With a lot of good humor'], a: 0,
      cue: '「this entire situation」に続く、珍しい一語。',
      line: 'you have handled this entire situation *with great aplomb*.',
      said: '「この件全体を、実に堂々と処理されました」とほめる。',
      mean: 'aplomb ＝ 落ち着きと自信。難しい場面を動じずにこなすこと。改まった語で、大げさなほめ方。',
      trap: '直前の「よく考えた」に引かれて「慎重・公平」と取りやすいが、aplomb は態度の落ち着き。',
      use: 'She handled the angry guest with aplomb.（怒った客にも動じずに対応した）' },

    // why: 2 ← "double" mixed up with half; 4 ← the last number heard; 40 ← "four" heard as "forty"
    { id: 'n2', skill: 'number', level: 'B2', point: 'mpg', seg: [77.1, 82.1], keep: true,
      stem: 'By his reply, about how many miles per gallon does Dwight’s car get?',
      choices: ['2', '4', '8', '40'], a: 2,
      cue: '「four miles」への返事、数字を言わない言い方。',
      line: 'like, *four miles* to the gallon? — Uh, *try double that*.',
      said: '「4マイルくらい？」に「その倍だね」と返す。つまり約8マイル。',
      mean: 'Try ～ は相手の数を「〜だと思ってみな」と直す言い方。double that ＝ その2倍。',
      trap: '最後に聞こえた four をそのまま選びやすい。数字のない返事は、計算して答える。',
      use: 'Ten minutes? Try an hour.（10分？いや1時間はかかるよ）' },

    // R fix: V2 (75 % blind): "saves fuel" was a filler. "Andy's guess was way off" (the correction read as a win) is
    //   the near miss now.
    // why: half ← "double" and "half" confused; way off ← the proud tone heard as a winning correction
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mpg', seg: [77.1, 84.6],
      stem: 'Why is Dwight’s comeback about his mileage funny?',
      choices: ['Even doubled, that mileage is still awful', 'He means half that, but says double by mistake',
                'He shows that Andy’s guess was way off'], a: 0,
      cue: '直す前の数字と、直したあとの数字を比べて。',
      line: 'four miles to the gallon? — Uh, *try double that*. Classic Trans Am…',
      said: '「1ガロン4マイル？」に「その倍だ」と胸を張り、クラシックな名車だと続ける。',
      mean: '倍にしても約8マイルで、燃費はひどいまま。言い返したつもりで、悪口を認めている。',
      trap: '自信たっぷりに直すので「言い負かした」に聞こえるが、倍でも弱点は残る。',
      use: 'That’s not the comeback you think it is.（それ、言い返せてないよ）' },

    // R fix: V2 (70 % blind): the key was the one choice sharing a word with each distractor. Now a balanced 2×2
    //   (earth or rugged, Latin or Japanese); 4 choices, all built on words said.
    // why: rugged ← "luxurious yet rugged" just before; Japanese ← "Leave it to the Japanese" just before
    { id: 'd4', skill: 'detail', level: 'B1', point: 'latin', seg: [88.6, 96.2],
      stem: 'What does Andy say the name of his car means?',
      choices: ['“Earth” in Latin', '“Rugged” in Latin', '“Earth” in Japanese', '“Rugged” in Japanese'], a: 0,
      cue: '「not even a real word」への返事。言語と意味。',
      line: 'Actually, it is — it’s *Latin for “earth.”*',
      said: 'ラテン語で『大地』の意味だ、と言い返す。',
      mean: 'A is Latin for B ＝ A はラテン語で B の意味。名前の由来を言う形。',
      trap: '直前に Japanese と rugged が聞こえるので混ざりやすい。for の前が言語、後ろが意味。',
      use: '“Gracias” is Spanish for “thank you.”（グラシアスはスペイン語で「ありがとう」）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'bet', seg: [101.2, 103.85],
      stem: 'Type the reply: “Yeah, ___.” (4 words)', answer: 'i bet you would',
      cue: '「than an ex-earth」への、短い返事。',
      line: 'Yeah, *I bet you would*.',
      said: '「だろうね」と返す。bet you は「ベッチュ」とつながる。',
      mean: 'I bet you would ＝「そりゃそうだろうね」。相手の好みを皮肉っぽく認める言い方。',
      trap: 'bet you は一語のように聞こえやすい。t と y がつながる音に慣れておく。',
      use: 'I bet you’re tired after that flight.（そのフライトのあとじゃ疲れてるよね）' },

    // R fix: V2 (85 % blind): "someone phoned" was a filler. "Taken from someone" is the literal reading of "wants its
    //   car back".
    // why: built in 1985 ← the year taken as the car's real year; taken ← "wants its car back" read literally
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'old', seg: [103.4, 110.1],
      stem: 'When Andy says “1985 called…”, what is he really saying?',
      choices: ['Dwight’s car is badly out of date', 'Dwight’s car was built in 1985', 'Dwight’s car was taken from someone'],
      a: 0,
      cue: '「called」のあとと、Dwight の言い返し方。',
      line: '*1985 called*, it wants its *car back*. — Well, I hope 1985 has a time machine, ’cause I drive an ’87.',
      said: '「1985年が車を返せと電話してきた」とからかい、「87年式だ」と返される。',
      mean: '「(年) called…」は「古くさい」という定番のからかい。',
      trap: '1985 を年式と、「返して」を盗んだ車と取りやすい。返事の ’87 がヒント。',
      use: 'The ’80s called. They want that hat back.（その帽子、古くさいね）' },

    // R fix: V2 (70 % blind): the key was the only hostile choice. "Change the subject after losing that round" (the
    //   話は変わるけど frame inside the fight) replaces "agree and drop it".
    // why: calmer ← "speaking of" is the usual polite topic shift; losing ← the topic shift read as a retreat
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'speaking', seg: [106.9, 120.75],
      stem: 'How do both men use “speaking of…” in this exchange?',
      choices: ['To turn the other’s last words into a new insult', 'To move the talk on to a calmer, safer subject',
                'To change the subject after losing that round'], a: 0,
      cue: '直前の相手の言葉と、「speaking of」のあとの語。',
      line: 'Oh, *speaking of time machines*… — *Speaking of funerals*, why don’t you…',
      said: '相手が言った time machine や funeral を拾って、次の悪口につなげる。',
      mean: 'speaking of ～ は本来「〜と言えば」。ここでは悪口を続ける道具。',
      trap: '丁寧な話題転換に聞こえやすい。拾った語のあとに何が来るかで、働きが分かる。',
      use: 'Speaking of food, is anyone hungry?（食べ物と言えば、お腹すいた人いる？）' },

    // R fix: V2 (75 % blind): "hurt" was a filler. "Mocks how mean it was" (the right tone, the wrong target; the
    //   English-professor line settles it) is the near miss now.
    // why: admires ← "really well-constructed" taken at face value; mean ← "go die" is harsh, so the mockery is read
    //   as aimed at its cruelty
    { id: 't2', skill: 'attitude', level: 'B2', point: 'sentence', seg: [117.3, 129.6],
      stem: 'How does Andy mean his comment on Dwight’s sentence?',
      choices: ['He mocks how badly it was worded', 'He honestly admires how it was put',
                'He mocks how mean it was to say'], a: 0,
      cue: '「go ahead and go」の重ね方と、そのあとのほめ方。',
      line: 'why don’t you *go ahead and go* die? — Oh, that was a *really well-constructed sentence*.',
      said: '「さっさと行って死ね」と言われ、「実によくできた文だね、英語の教授になれば」と返す。',
      mean: 'go を2回重ねた不格好な文を、わざと大げさにほめてからかっている。',
      trap: 'ほめ言葉の形なので本気に取りやすい。ほめる中身が明らかに弱いときは皮肉。',
      use: 'Wow, great plan. Really well thought out.（へえ、すごい計画。よく考えたね）' },

    // R fix: V2 (60 % blind): "the speaker admits it" was a filler. "A draw both men accepted" (the fizzle read as a
    //   truce) replaces it. Still near 50 % blind (open).
    // why: the speaker won ← "totally got the best of" taken at face value; draw ← the fizzle read as a truce
    // anchor: 130.3–143 s the exchange sinks to "Idiot." … "You're the idiot!"; then 153–154.2 s to camera "I totally
    //   got the best of that interchange"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'best', seg: [129.8, 154.8],
      stem: 'After the closing comment to the camera, how should we judge the argument?',
      choices: ['Nobody won; it sank into name-calling', 'The speaker won, just as he claims',
                'It was a draw both men accepted'], a: 0,
      cue: '口論の終わり方と、カメラへの一言の差。',
      line: '*Idiot.* … You’re the idiot! … I *totally got the best of* that interchange.',
      said: '「バカ」「お前がバカだ」と言い合って終わったあと、カメラに「完全に僕の勝ちだった」と話す。',
      mean: 'カメラへの一言が場面を書きかえる形。ここでは逆に、勝ったと思い込む本人のずれが笑いになる。',
      trap: 'カメラへの本音をそのまま答えと取りやすい。本人の評価と、実際のやりとりを比べて聞く。',
      use: 'I think that went well. Right?（うまくいったと思う。だよね？）' },

    // R fix: V2 (95 % blind) + S3: "If I were…" in the stem settled the gap by grammar alone, and the cue's "idiot"
    //   tripped the leak check. The stem gives only the gapped clause; all four choices fit it.
    // why: I'll be ← the d and l are both soft after "I"; I'm ← the short d lost; I've been ← "be" heard as "been"
    { id: 's1', skill: 'sound', level: 'B2', point: 'ifidiot', seg: [131, 134.05],
      stem: 'Fill the gap in his comeback: “___ driving a Trans Am.”',
      choices: ['I’d be', 'I’ll be', 'I’m', 'I’ve been'], a: 0,
      cue: 'if 節のあと、I に付く短い音。',
      line: 'If I were an idiot, *I’d be* driving a Trans Am.',
      said: '「バカなら、トランザムに乗ってるさ」と言い返す。',
      mean: 'I’d の d はほとんど聞こえず、be につながる。',
      trap: 'd が弱いと I’ll や I’m に聞こえやすい。If I were と仮定したら、あとは I’d が来る。',
      use: 'If I were you, I’d take the train.（私なら電車で行くな）' },
  ]
};
