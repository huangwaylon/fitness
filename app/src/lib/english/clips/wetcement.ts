// “Wet Cement  - The Office US” (the official The Office channel, BEST OF SEASON 4): the sidewalk outside is wet,
// and Michael begs the office for something to put in it; he turns down initials and a picture, loves the celebrity
// handprints, loves a face print even more, ignores a safety warning, gives a grand speech, then tells the camera
// what it means to him.
// Segments from the captions, words from whisper (2026-11-16). Only Michael is named in the audio ("Phil" is in
// whisper only); the others are "a coworker".
// Untested on purpose: 24–47 s (a childhood story and "You draw a picture… says so much more than words" overlap and
// are garbled in the captions), "it's drying" at 9.4 s (captions "strike"), "Ma'am, translate" at 52.6 s (captions
// "man"), 63–69 s (crowd), the "Hurry, please" / "Can you breathe?" / "Hold your breath" asides inside 75–86 s, and
// 86–91 s (innuendo).
// REVIEW 2026-11-16: pass 6, fix 14, drop 1, new 0; ear checks 1
// Open: c2's segment is 15.9 s (a C2 talking-head item, inside the 25 s limit); the repo's 3–15 s test may need the
//   C2 exemption.
// EAR CHECK: 81.5 s c1 — the second view: whisper "it's deep down inside", captions "it's your outside" (c1's "Deep inside"
//   choice uses whisper's words; the key rests on "that's also not true", in both)
import type { Clip } from '../types.ts';

export const wetCement: Clip = {
  id: 'wetcement', video: 'tg-scNVvWDU', title: 'Wet Cement  - The Office US', dur: 135, wpm: 150,
  band: 'mid', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: h2 was dropped, so 'loveit' left the reveals; the why comment is rewrapped. Blind 45 %, kept as is.
    // why: cools as they get sillier ← he says "no" to the initials and the picture, and the face idea sounds silly;
    //   first sensible ← the handprints are the safe, famous idea and he says "I love it" to them
    { id: 'g1', skill: 'gist', level: 'B2', point: 'arc', reveals: ['more', 'safe', 'initials', 'handprints'],
      seg: [0, 63.4],
      stem: 'How does Michael’s hunt for an idea turn out?',
      choices: ['He likes the ideas more as they get riskier', 'He cools on the ideas as they get sillier',
                'He takes the first sensible idea he hears'], a: 0,
      cue: '案が出るたびの、Michael の返事の変化。',
      said: 'イニシャルや絵には「だめ」。手形に「最高」、顔に「もっと最高」、危ないと言われても「最高」。',
      mean: '案が大胆で危なくなるほど、Michael は喜ぶ。止める声も通じない。',
      trap: '最初は断り続けるので「全部断る」と取りやすい。後半の返事の変化を聞く。',
      use: 'The crazier, the better.（ぶっ飛んでるほどいい）' },

    // R fix: V2 (blind 75 %, right): with the title, writing in wet cement was the only fun use. All three now
    //   write in it; the distractors twist "I" and "lifelong".
    // why: who first ← "what do I write?" heard without the "I", as a turn-taking question; so it lasts ←
    //   "lifelong" heard as lasting, and "it's drying, fast" as a worry about how to write it
    { id: 'd1', skill: 'detail', level: 'B1', point: 'write', reveals: ['dream'], seg: [0, 14.2],
      stem: 'What does Michael want everyone’s ideas for?',
      choices: ['What to write in the cement before it dries', 'Who should be first to write in the cement',
                'How to write in the cement so it will last'], a: 0,
      cue: '外の何が急いでいるかと、最後の質問。',
      line: '*Wet cement, outside*… This is a lifelong dream, *what do I write?*',
      said: '「外のセメントが乾いていく、急げ。一生の夢なんだ、何を書けばいい？」と呼びかける。',
      mean: '欲しいのは、乾く前にセメントに書く言葉のアイデア。',
      trap: 'lifelong や fast から「誰が」「どう残す」の話にも聞こえるが、聞いているのは what。',
      use: 'Quick, I need your ideas!（急いで、アイデアちょうだい！）' },

    // why: no ideas ← "we don't know" heard as "we can't think of anything"; too busy ← the usual office push-back
    //   to a boss shouting "right now, go"
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'lost', seg: [6.0, 11.1],
      stem: 'What is the coworker doing when cutting in after “Ideas please, right now”?',
      choices: ['Asking him to explain what this is about', 'Telling him they have no ideas to give',
                'Telling him they are too busy right now'], a: 0,
      cue: 'Ideas please のあとの一言と、Michael の返し。',
      line: 'Michael, *we don’t know what you’re talking about*. — Wet cement, outside…',
      said: '「何の話か分からない」と口をはさみ、Michael は「外のセメント」と説明しはじめる。',
      mean: '断りではなく、まず事情を説明してと求める言い方。',
      trap: 'don’t know から「アイデアがない」と取りやすいが、分からないのは話の中身。直後の説明が答え。',
      use: 'Sorry, what are we talking about?（ごめん、何の話？）' },

    // why: last night ← dream = 寝て見る夢; last for all time ← lifelong read as "lasting forever", which fits cement
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'dream', reveals: ['write'], seg: [10.4, 14.2],
      stem: 'Just before asking what to write, how does Michael describe this chance?',
      choices: ['Something he has wanted all his life', 'Something he dreamed about last night',
                'Something that will last for all time'], a: 0,
      cue: '「what do I write」の直前の言い方。',
      line: 'This is a *lifelong dream*, what do I write?',
      said: '「これは一生の夢なんだ。何を書けばいい？」と言う。',
      mean: 'lifelong ＝ 生まれてからずっとの。昔からやりたかったこと、という大げさな言い方。',
      trap: 'dream を寝て見る夢、lifelong を「永遠に残る」と取りやすい。life は「一生」。',
      use: 'Seeing Paris is a lifelong dream.（パリは昔からの夢なんだ）' },

    // R fix: V2 (blind 55 %, right: initials are the classic answer). "A short message" became the handprint, a later
    //   idea, so two of the four are ideas that do come up.
    // why: full name ← "Some idiot named…" right after; handprint ← the idea Michael loves later; a picture ← a later
    //   idea in the brainstorm
    { id: 'd3', skill: 'detail', level: 'B1', point: 'initials', seg: [13.5, 17.0],
      stem: 'What does the first coworker suggest Michael put in the cement?',
      choices: ['His initials', 'His full name', 'His handprint', 'A picture'], a: 0,
      cue: '「Michael, you could put」のあと。',
      line: 'Michael, you could put *your initials* in it. — MGS, no.',
      said: '同僚が「イニシャルを入れたら」と言い、Michael は「MGS、だめ」と返す。',
      mean: 'initials ＝ 名前の頭文字。最初の案は頭文字で、すぐ断られる。',
      trap: 'あとで絵や手形の案も出るので混ざりやすい。最初の案は put のすぐあとを聞く。',
      use: 'Just put your initials here.（ここにイニシャルだけ書いて）' },

    // R fix: V2 (blind 55 %, right: "complain" was a weak literal reading). It became the wrong-direction reading,
    //   blame for credit.
    // why: get blamed ← "claim… for it" heard as being held to account (credit and blame mixed); be paid ← credit
    //   read as money (クレジット)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'initials', seg: [13.5, 24.15],
      stem: 'What does Michael fear a stranger named “Mark Greg Sputnik” would do?',
      choices: ['Say that he was the one who wrote it', 'Get blamed for writing in the cement',
                'Ask to be paid for using his initials'], a: 0,
      cue: '「will」のあとの動詞と、その目的語。',
      line: 'Some idiot named Mark Greg Sputnik will *claim credit for it*.',
      said: '「マーク・グレッグ・スプートニクとかいう奴が自分のだと言う」と断る。',
      mean: 'claim credit ＝ 自分の手柄だと言う。claim は苦情ではない。',
      trap: 'credit をお金、claim を責められる話と取りやすい。二語で一つの意味。',
      use: 'She claimed credit for my work.（彼女が私の仕事を自分の手柄にした）' },

    // R fix: V2 (blind 55 %, right: "correct a detail" was weak). It became the opposite reading of the explainer.
    // why: more slowly ← Michael's "translate" (if caught) sounds like a speed problem, and she talks fast; nothing
    //   to do with it ← her story never says "cement", so a reply can sound like a dismissal (refuted: "in the cement")
    { id: 'i1', skill: 'infer', level: 'C1', point: 'kelly', reveals: ['handprints'], seg: [46.8, 56.6],
      stem: 'Why does another coworker speak up right after the E! story?',
      choices: ['To say what idea her story was getting at', 'To repeat her story more slowly for Michael',
                'To say her story has nothing to do with it'], a: 0,
      cue: '彼女の話に出てこない語が、次の人から出る。',
      line: 'I was watching E!… oh my God, *he looks so good*. — … She’s talking about *the handprints*…',
      said: 'スターの話が「かっこいい」で終わり、別の人が「セメントの手形のこと」と言いなおす。',
      mean: '彼女の話は案の中身に届いていない。もう一人が、言いたかったことを言葉にした。',
      trap: '速さの話や「関係ない」という返しに取りやすい。新しく出た語に注目。',
      use: 'What she means is, we need more time.（つまり、もっと時間が要るってこと）' },

    // R fix: V2/V1 (blind 70 %, right: world knowledge of the Chinese Theater gave the key). All three are now
    //   things stars do leave in that cement, so only the audio's "hand" decides.
    // why: footprints ← "-prints" caught, "hand" lost; signatures ← names are the other thing stars leave there
    { id: 'd2', skill: 'detail', level: 'B1', point: 'handprints', seg: [52.2, 56.6],
      stem: 'According to the coworker who explains, what is the E! story about?',
      choices: ['Handprints that stars press into cement', 'Footprints that stars press into cement',
                'Names that stars sign into the cement'], a: 0,
      cue: '「She’s talking about」のあと。',
      line: 'She’s talking about *the handprints that celebrities make in the cement*.',
      said: '「セレブがセメントに付ける手形の話です」と説明する。',
      mean: 'handprints ＝ 手形。有名人がセメントに手を押しつけて残すもの。',
      trap: '足形やサインも有名人らしい話。prints だけ拾わず、前の hand まで聞くと「手」。',
      use: 'Wipe your handprints off the glass.（ガラスの手の跡をふいて）' },

    // R fix: V2 (blind 55 %, right: "too far" was the odd one out). It became "just as much", so the three choices
    //   are more / less / the same.
    // why: not as much ← "more" heard as a comparison he's making against the face; just as much ← "more" is short
    //   and easy to lose, and "I love it" alone sounds like the same reply
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'more', reveals: ['star', 'handprints'], seg: [52.2, 59.7],
      stem: 'How does Michael react to the idea of using his face?',
      choices: ['He likes it even better than the handprints', 'He likes it, but not as much as the handprints',
                'He likes it just as much as the handprints'], a: 0,
      cue: '最後の返事に足される一語。',
      line: 'If you were a real star, you’d put your face in it. — *I love it more!*',
      said: '手形に「最高！」と言い、顔の案には「もっと最高！」と返す。',
      mean: 'love it more ＝ さらに気に入った。案が大胆になるほど喜んでいる。',
      trap: 'more が短く、聞こえないと手形と同じ返事に聞こえる。返事の最後の一語まで聞く。',
      use: 'I love this one even more.（こっちのほうがもっと好き）' },

    // R fix: V2 (blind 70 %, right: after "If you were…" only "you'd" was grammatical). All three now fit the
    //   grammar and differ by sound only; one 'd against 'd've is heavy reduction, so the level is C1.
    // why: could ← /kʊd/ rhymes with "you'd", and the y-/k- start is quick; you'd have ← a weak extra "of" sound
    //   between "you'd" and "put" is easy to imagine in fast speech
    { id: 's1', skill: 'sound', level: 'C1', point: 'star', seg: [56.6, 59.7],
      stem: 'Fill the gap: “If you were a real star, ___ your face in it.”',
      choices: ['you’d put', 'you could put', 'you’d have put'], a: 0,
      cue: 'star のあと、とても短い一音。',
      line: 'If you were a real star, *you’d put* your face in it.',
      said: '「本物のスターなら、顔を押しつけるよね」と言う。',
      mean: 'you’d ＝ you would。d はほぼ聞こえず「ユッ・プッ」と二拍。',
      trap: 'could なら k の破裂、have なら「ァヴ」の一拍が増える。速い所は拍の数を数えて聞き分ける。',
      use: 'If I were you, I’d ask.（私なら聞いてみる）' },


    // R fix: V2 (blind 55 %, right: "daring" was weak). It became the does/doesn't trap. S4: 58.2 s cut "your
    //   face", and 61.2 s ran into the whisper-only "I love it!".
    // why: safe enough ← "doesn't" is weak and lost, so "seem safe" sounds like a go-ahead; keep the cement safe ←
    //   "safe" heard without "doesn't", as care for the cement
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'safe', reveals: ['more'], seg: [56.6, 61.0],
      stem: 'What is the coworker’s reply to Michael’s “I love it more!” doing?',
      choices: ['Warning him that the idea could hurt him', 'Saying the idea seems safe enough to try',
                'Asking how they’ll keep the cement safe'], a: 0,
      cue: '「I love it more!」のすぐあとの一言。',
      line: '*That doesn’t seem safe.*',
      said: '顔の案に大喜びする Michael に、同僚が「安全じゃなさそう」と言う。',
      mean: 'doesn’t seem ＝ ～ではなさそう。やめて、と柔らかく伝える注意。',
      trap: 'safe だけ拾うと「セメントを守る」話に聞こえる。doesn’t は否定の注意。',
      use: 'That doesn’t seem like a good idea.（それ、いい考えじゃなさそう）' },

    // R drop: h2 (K1/N1): its key line, "I love it!" after the warning, is in whisper only, and g1's key (riskier is
    //   better) also defends a "danger draws him in" reading. Never shipped, so deleted; the ear check went with it.

    // why: narrows ← "the idea of a man" heard as one specific idea, a refinement rather than a retreat to "a man"; has died ←
    //   "immortalize a man" sounds like a memorial
    { id: 'i2', skill: 'infer', level: 'C1', point: 'idea', seg: [68.3, 76.85],
      stem: 'In the cement speech, what does “Maybe the idea of a man” do?',
      choices: ['It takes back the contrast he has just drawn', 'It narrows his point to one kind of idea',
                'It shows the speech honors a man who has died'], a: 0,
      cue: '「not to」「but」の対比と、Maybe 以下。',
      line: 'We are here today *not to immortalize a man, but an idea*. *Maybe the idea of a man.*',
      said: '「男でなく考えを残すために集まった。いや、男という考えかも」と話す。',
      mean: 'not A but B の対比のすぐあと、A に近い言い方へ戻る。大きな話がしぼむ。',
      trap: 'immortalize で葬式の話に聞こえやすい。Maybe は前言を引っこめる合図。',
      use: 'Well, maybe not a party, but dinner.（パーティーじゃなくても、夕食なら）' },

    // why: deep inside ← "deep" is heard, and it's the next view he names; born with ← greatness and skin (the body)
    //   heard as something natural
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'skin', seg: [76.4, 80.45],
      stem: 'What does Michael say “some people” believe about greatness?',
      choices: ['That it’s only on the surface', 'That it’s hidden deep inside', 'That it’s something you’re born with'],
      a: 0,
      cue: '「some people say」の前の二語。',
      line: 'Greatness is only *skin deep*, some people say. Well, that’s not true.',
      said: '「偉大さは皮一枚だけ、と言う人もいる。それは違う」と話す。',
      mean: 'skin deep ＝ 表面だけの。「美しさは見かけだけ」という言い回しの言いかえ。',
      trap: 'deep から「奥深い」と取りやすいが、皮の厚さまで、つまり浅い。',
      use: 'His charm is only skin deep.（彼の魅力は見かけだけ）' },

    // anchor: 79.7–80.5 s "Well, that's not true" after the first view; 83.6–85.4 s "that's also not true" after the
    //   second: both places are ruled out, and no third is given before "Go!"
    // R fix: V2 (blind 50 %, right: the only choice with a reason after the colon). All three now give a place and
    //   a reason in the same shape.
    // why: deep inside ← the last-heard view taken as his own, with "also" lost under "Hold your breath" (the
    //   last-heard keyword); both ← rejecting two views heard as granting each a part (wrong direction)
    { id: 'c1', skill: 'humor', level: 'C2', point: 'skin', seg: [76.4, 85.55],
      stem: 'Taken seriously, what has Michael’s speech said about where greatness lies?',
      choices: ['Nowhere: he rejects both views he names', 'Deep inside: he rejects only the surface view',
                'In both: he finds some truth in each view'], a: 0,
      cue: '二つの意見のあと、それぞれの返し。',
      line: 'Greatness is only skin deep, some people say. *Well, that’s not true.* Other people believe it’s deep down inside. And in this case, *that’s also not true.*',
      said: '「偉大さは表面だけと言う人がいる。違う。奥にあると言う人も。今回はそれも違う」と続ける。',
      mean: '本気で聞くと「偉大さはどこにもない」になる。両方を打ち消して、立派な式の話が空になる。',
      trap: '最後に出た意見が答えに聞こえやすい。also not true の also は、二つ目も消すという合図。',
      use: 'Good? Not really. Bad? Also no.（良かった？いや。悪い？それも違う）' },

    // R fix: V2 (blind 55 %, right: the only choice about the future). "Face over initials" (never mentioned) became
    //   a future reading built on "a real star". The key lost "to him" and the notes lost "That's me", c2's anchor,
    //   so g2 no longer reveals 'aboutme' (that reveal blocked c2 from play 3 in 19/20 draws).
    // why: family ← "grandkids… great-grandkids" heard as people invited today; famous ← "a real star" in the
    //   brainstorm, and "come back here when I'm 100" heard as fans coming (refuted: "That's me", "a good feeling")
    { id: 'g2', skill: 'gist', level: 'B2', point: 'legacy', seg: [90.1, 112.9],
      stem: 'What is Michael’s comment to the camera mainly about?',
      choices: ['Why the face print will matter years from now',
                'Why he wants his family to come and see the ceremony',
                'Why he hopes the face print will make him famous one day'], a: 0,
      cue: '話の最後のほう、何年後の話か。',
      said: '「今日は特別な日」と始め、孫やひ孫のこと、年をとってからここへ戻ってくる日のことを話す。',
      mean: '顔の跡は何十年先まで残り、そのときも意味を持つ、という話。',
      trap: 'grandkids から家族を呼ぶ話に聞こえやすいが、孫は未来の話。そこを聞く。',
      use: 'I want to be remembered for this.（これで覚えていてほしい）' },

    // anchor: 91.4 s "a very special day for me", 93.7–94.4 s "it's really not about me", then 105.4–105.9 s "say,
    //   'That's me.'": the comment that disowns itself ends on him
    // R fix: V2 (blind 65 %, right): "He says today is not about him" set up the irony, so the "after all" key stood
    //   out. The stem now points at the grandkids; the choices are parallel ("mostly about… in the end").
    // why: family ← "It's about my grandkids… great-grandkids" taken as sincere (sincerity flip); growing old ←
    //   "when I'm 100" heard as the point (the last-heard keyword; refuted: "That's me" is where it ends)
    { id: 'c2', skill: 'infer', level: 'C2', point: 'aboutme', seg: [90.1, 106.0],
      stem: 'In his comment to the camera, how does his talk of grandkids land?',
      choices: ['As mostly about Michael himself, in the end', 'As mostly about his family, in the end',
                'As mostly about growing old, in the end'], a: 0,
      cue: '冒頭の「about me」と、最後のほうの一言。',
      line: 'it’s *really not about me*. It’s about my grandkids… and say, “*That’s me.*”',
      said: '「自分のためじゃない、孫やひ孫のため」と言ったあと、「これが僕だ」と言う日を思い描く。',
      mean: '「自分の話ではない」と前置きしながら、行き着く先は「これが僕」。カメラへの一言が自分で自分を打ち消している。',
      trap: '孫の話を本心と取りやすい。前置きの否定は、あとの言葉と比べてから信じる。',
      use: 'It’s not about me. Okay, maybe a little.（私の話じゃない。まあ、少しはね）' },

    // why: sixty / eighty ← the usual "when I'm old" ages; ninety ← -ty heard where "a hun-" is weak
    { id: 'n1', skill: 'number', level: 'B1', point: 'hundred', seg: [95.9, 101.95], keep: true,
      stem: 'At what age does Michael picture himself coming back?',
      choices: ['Sixty', 'Eighty', 'Ninety', 'A hundred'], a: 3,
      cue: '「when I’m」のあとの数。',
      line: 'I can come back here when I’m *100*…',
      said: '「100歳になったらここに戻ってきて」と話す。',
      mean: 'a hundred ＝ 100。年をとった自分を大げさに思い描いている。',
      trap: 'a が弱く「ハンドレッ」だけ聞こえる。-ty の数と違い、hun の音で始まる。',
      use: 'My grandma just turned ninety.（祖母がちょうど90歳になった）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'piece', seg: [101.35, 105.05],
      stem: 'Type what he says: “and I can find ___ cement” (3 words)', answer: 'that piece of',
      cue: '「find」のあと、三語がつながる。',
      line: 'and I can find *that piece of* cement',
      said: '「あのセメントのかけらを見つけて」と言う。',
      mean: 'piece of がつながり「ピーソブ」に近い。that の th も弱い。年をとっても場所を覚えているつもり。',
      trap: 'of が弱く消えて、語の数を数えにくい。piece のあとは of が来やすい。',
      use: 'Can I have a piece of cake?（ケーキを一切れもらえる？）' },


    // R fix: S4 (105.75 s cut "me"); now 104.9–109.5.
    { id: 'x2', skill: 'dict', level: 'B2', point: 'facehole', seg: [104.9, 109.5],
      stem: 'Type the end: “Look, kids, your daddy ___.” (4 words)', answer: 'left that face hole',
      cue: '「your daddy」のあと、四語。',
      line: 'Look, kids, your daddy *left that face hole*.',
      said: '「ほら、パパがこの顔の穴を残した」と子どもに言う姿を思い描く。',
      mean: 'left that の t が消え「レフザッ」に近い。face hole は s と h がつながる。',
      trap: 'left の t が落ちやすい。過去の話なら left（残した）を考える。',
      use: 'Who left the lights on?（電気つけっぱなしにしたの誰？）' },

    // R fix: V2/K1 (blind 60 %, right): "sure" sat badly with "I don't know". All three are now a feeling plus a
    //   reading of "I don't know". S4: 105.75 s cut "me".
    // why: unsure ← "I don't know" read as doubt about the face print (the Japanese わからない = 迷い); embarrassed ←
    //   "face hole" sounds silly, so he might be laughing it off
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'goodfeel', seg: [104.9, 112.9],
      stem: 'How does Michael feel as he ends his comment to the camera?',
      choices: ['Happy, even if he can’t explain why', 'Unsure, as if it might have been a mistake',
                'Embarrassed, as if the plan sounds silly'], a: 0,
      cue: '最後の二文と、その順番。',
      line: '*I don’t know. It’s a good feeling.*',
      said: '「わからない」と言葉に詰まったあと、「いい気分だ」と締める。',
      mean: 'I don’t know は説明をあきらめる合図。気持ちは最後の good feeling にある。',
      trap: '「わからない」を迷いや後悔と取りやすい。英語では話を打ち切るときにもよく使う。',
      use: 'I don’t know. It just feels right.（うまく言えないけど、しっくりくる）' },
  ]
};
