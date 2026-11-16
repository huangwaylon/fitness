// REVIEW 2026-11-16: pass 9, fix 11, drop 0, new 0; ear checks 2
// REVIEW question: a1/d3's line has "We're gonna have a big family" (captions "we are going to"); whisper has
//   "You're gonna" (as if the doctor says it). Neither key rests on it, but the line may want "You're" if your ear says so
// “The Moment They Realized They’re Having Triplets | Friends” (the official Friends channel, Best of Season 4): the
// doctor says three babies, and Frank and Alice cheer; Phoebe, relieved, lists the worries she'd had (raising three,
// the cost), the joy drains, and Alice rallies with a plan to have her home-ec class sew baby clothes.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈54.5 s (music after; whisper invents
// "it'll be like me" lines from 58.6 s). No name is said in the audio: stems name Phoebe ("you guys" to the couple),
// Alice (the home-ec teacher) and Frank by role. Untested: 28.6 s ("Ugh!", whisper only), 27.2 s (captions "in the
// added expense", whisper "and the added expense"; x1's two words agree), 44.8 s (captions "homech").
// EAR CHECK: 23.4–28.8 s w1 — Phoebe answers "Why would we be freaked?" (assumed from "we" and her "you guys"; the
//   captions don't mark speakers)
// EAR CHECK: 43.6 s r1 nt1 — the cut falls after "um" and before the second "because… I teach home ec"
import type { Clip } from '../types.ts';

export const triplets: Clip = {
  id: 'triplets', video: 'rE6uq2c3Ydg', title: 'The Moment They Realized They’re Having Triplets', dur: 67, wpm: 149,
  band: 'slow', tags: ['家', '友だち'],
  show: 'Friends',
  credit: 'Friends (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 65 %: only one choice had the joy first); a distractor now shares the first two steps
    // why: calm planning ← "it's gonna be fine" plus the home-ec idea heard as a real, calm plan; anger → apology ← "Three babies?" and "freaked" heard as anger, "No, back to happy"
    //   as Phoebe saying sorry
    { id: 'g1', skill: 'gist', level: 'C1', point: 'scene', reveals: ['realize'], seg: [0, 55.5],
      stem: 'How does the mood change over the scene?',
      choices: ['Joy turns to worry, then to forced cheer', 'Joy turns to worry, then to calm planning',
                'Shock turns to anger, then to an apology'], a: 0,
      cue: '最初の喜び方と、Phoebe の話のあとの声。',
      said: '三つ子と聞いて大喜び。Phoebe が育てる大変さとお金の話をすると黙り、最後は無理に明るくする。',
      mean: '喜び→不安→空元気、という流れ。',
      trap: '最後の案を本気の計画と取りやすい。理由の前の間と、案の中身で、明るさが本物かを聞く。',
      use: 'Well, that killed the mood.（それで一気に空気が冷めた）' },

    // why: stunned ← "Three babies?" repeated as a question sounds like disbelief; calm ← "finally" heard as "we knew it
    //   was coming"
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'thrilled', reveals: ['family'], seg: [7.5, 17.0],
      stem: 'How do Frank and Alice first take the doctor’s news?',
      choices: ['Thrilled; it’s what they hoped for', 'Stunned; they can’t take it in yet', 'Calm; they had expected it'],
      a: 0,
      cue: '「Three babies?」のあとの声と言葉。',
      line: 'We’re gonna have a big family! — I always wanted *a big family*.',
      said: '「三つ子？」と聞き返したあと、「大家族になる！」「ずっと大家族がほしかった」と叫ぶ。',
      mean: 'always wanted ＝ ずっと望んでいた。願いがかなった喜び。',
      trap: '聞き返しは驚きに聞こえるが、すぐ歓声が続く。最初の一言より、そのあとの言葉で判断。',
      use: 'This is the best news ever!（最高の知らせだよ！）' },

    // why: van ← /b/–/v/, and a family of five needs a van; fam ← "family" comes right after, and the final -nd is weak
    { id: 's1', skill: 'sound', level: 'B2', point: 'band', seg: [8.5, 11.9],
      stem: 'Fill the gap: “I finally got my ___!”',
      choices: ['band', 'van', 'fam'], a: 0,
      cue: '「finally got my」の直後、短い一語。',
      line: 'I finally got my *band*!',
      said: '三つ子と聞いて「ついにバンドができた！」と叫ぶ。',
      mean: 'band の b は唇を閉じてから出す音。語尾の nd は弱く、「ベァン」に近く聞こえる。',
      trap: 'b と v は日本語では区別しにくい。唇を閉じる音か、下唇をかむ音か。車の話は出てこない。',
      use: 'We should start a band!（バンド組もうよ！）' },

    // R fix: V2 (blind 70 %: the key was the only "big" choice, next to a triplets title); "a big house" shares it
    // why: baby girl ← "babies" fills the ear, and it's the usual wish; big house ← "big" is heard, the noun lost
    { id: 'd3', skill: 'detail', level: 'B1', point: 'family', seg: [11.4, 17.0],
      stem: 'What does the couple say they always wanted?',
      choices: ['A big family', 'A baby girl', 'A big house'], a: 0,
      cue: '「always wanted」のあとの名詞。',
      line: 'We’re gonna have a big family! — I always wanted *a big family*.',
      said: '「大家族になる！」「ずっと大家族がほしかった」と二人で喜ぶ。',
      mean: '三つ子で一気に家族が増える。それが長年の願いだった。',
      trap: 'big だけ聞こえて名詞を落とすと「大きい家」に引かれる。形容詞のあとの名詞まで聞く。',
      use: 'I’ve always wanted to see Paris.（ずっとパリに行ってみたかった）' },

    // R fix: V2 (blind 65 %: "uneasy, as they seem too cheerful" was weak); the uneasy choice now takes "afraid" at
    //   face value
    // why: envious ← the sad-helper script, with "I always wanted" just before; uneasy ← "so afraid" heard as a fear she
    //   still has
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'relief', seg: [16.7, 22.4],
      stem: 'How does Phoebe feel as she sees the couple’s reaction?',
      choices: ['Relieved, after fearing the worst', 'Envious, since they get the babies', 'Uneasy, still afraid they’ll panic'],
      a: 0,
      cue: '「Oh, God」のあと、二つの文の時制。',
      line: 'I’m *so glad* you guys are happy. I *was so afraid*…',
      said: '「二人が喜んでくれてよかった。ずっと心配だったの」と言う。',
      mean: '心配していたことが外れて、ほっとしている。was で「さっきまでの心配」と分かる。',
      trap: 'afraid だけ拾うと今も不安に聞こえる。was は過去、I’m so glad が今の気持ち。',
      use: 'I’m so glad you liked it.（気に入ってもらえてよかった）' },

    // R fix: V2 (blind 60 %: the quarrel was weak) and B1 (the key names Phoebe as the one who raises the worries,
    //   w1's key: reveals whoworry)
    // why: doctor ← doctors bring the bad news in this script, and he spoke first; adding up the cost ← "expense" is
    //   heard, and the couple's "Oh." "Right." sound like their own sums
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['expense', 'whoworry'], seg: [17.0, 40.0],
      stem: 'What makes the couple’s mood change?',
      choices: ['Phoebe saying out loud what she had feared', 'The doctor warning them about the risks',
                'The couple adding up what it will cost'], a: 0,
      cue: '「Why would we…」への答えのあと。',
      said: '二人が喜ぶ中、Phoebe が「育てるのも大変だし、お金も…」と心配を口にし、二人は黙る。',
      mean: '悪い知らせは医者からでなく、仲間の何気ない一言から来る。',
      trap: '医者が最初に話すので、心配も医者からと思いやすい。空気が変わる直前に誰が話したかを聞く。',
      use: 'Sorry, I didn’t mean to spoil the mood.（ごめん、水を差すつもりじゃなかった）' },

    // R fix: V2 (blind 75 %: "over-excited" isn't something to be afraid of, so the key was one of two) and B1 (the
    //   stem's "so afraid" gives a2's key: reveals relief)
    // why: let down ← a fear of disappointment fits "so afraid", and "freaked" is a new word to many; worn out ← "all"
    //   + a past participle heard like "all worn out"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'freaked', reveals: ['relief'], seg: [19.5, 25.0],
      stem: 'At “I was so afraid you were gonna be…”, what did Phoebe fear?',
      choices: ['Panicked and upset', 'Let down and sad', 'Worn out and drained'], a: 0,
      cue: '「so afraid」のあと。直前の happy と比べて。',
      line: 'I was so afraid you were gonna *be all freaked*.',
      said: '「二人がすごく動揺するんじゃないかと心配だった」と言う。',
      mean: 'be all freaked ＝ すっかり取り乱す。all は強め。',
      trap: '「がっかり」や「疲れ」も心配の種になる。freak は落ち着きを失うこと。直前の happy と対で聞く。',
      use: 'Don’t freak out, but I lost the keys.（落ち着いて聞いて、鍵なくした）' },

    // why: will we ← "would" shrinks to a "wd" close to "will"; could we / should we ← the same rhythm, and only the weak
    //   onset differs
    { id: 's2', skill: 'sound', level: 'B2', point: 'wouldwe', seg: [19.6, 25.0],
      stem: 'Fill the gap: “Why ___ be freaked?”',
      choices: ['would we', 'will we', 'could we', 'should we'], a: 0,
      cue: '「Why」のすぐあと、弱い二語。',
      line: 'Why *would we* be freaked?',
      said: '「なんで僕らが動揺するの？」と聞き返す。',
      mean: 'would は「ウd」と弱く we とつながる。「そんな理由ある？」の返し。',
      trap: 'would の d は弱く、will と区別しにくい。「そんなはずない」の返しには would が来やすい。',
      use: 'Why would I lie to you?（なんで嘘をつく必要があるの？）' },

    // why: Alice ← a woman's voice answers, and she is the mother-to-be; Frank ← "we" heard as the speaker including
    //   himself; the doctor ← a doctor is the one who warns about risks
    { id: 'w1', skill: 'who', level: 'B2', point: 'whoworry', reveals: ['expense', 'wouldwe'], seg: [22.9, 29.0],
      stem: 'Who brings up the downsides of having three babies?',
      choices: ['Phoebe', 'Alice', 'Frank', 'The doctor'], a: 0,
      cue: '「Why would we…」と聞かれて、答えるのは誰か。',
      line: 'Why would *we* be freaked? — No, ’cause, you know, maybe it’s harder to raise them…',
      said: '夫婦の「なんで？」に Phoebe が「大変かも」と答える。',
      mean: 'we は夫婦。答えるのは、二人に you guys と話しかけていた Phoebe。',
      trap: '母親になる Alice と取りやすい。we と you guys が誰を指すかで話し手が分かる。',
      use: 'Why would I be upset?（なんで私が怒るの？）' },

    // R fix: V2 (blind 55 %: the key was the only nuanced choice) and B1 (the stem names Phoebe answering, w1's key:
    //   reveals whoworry); the key is plain now
    // why: nothing to worry ← "No" read as reassurance, the reply to "why would we be freaked?"; takes back ← "No" heard
    //   as a denial of her own "I was so afraid"
    { id: 'm1', skill: 'marker', level: 'C1', point: 'nocause', reveals: ['expense', 'whoworry'], seg: [22.9, 29.0],
      stem: 'When the couple asks her why, Phoebe begins with “No”. What does it do?',
      choices: ['Starts her explanation of the reason', 'Tells them there is nothing to worry about',
                'Denies she thought they would panic'], a: 0,
      cue: '「No」のすぐあとに続く言葉。',
      line: '*No*, ’cause, you know, maybe it’s harder to raise them…',
      said: '「いや、ほら、育てるの大変かもだし…」と説明を始める。',
      mean: '文頭の No は否定ではなく、言いにくい説明に入るクッション。「いや、それがね」に近い。',
      trap: 'No を「心配ない」と取ると、続く理由と合わない。No のあとに何が来るかで働きを決める。',
      use: 'No, it’s just that I’m tired.（いや、ただ疲れてるだけで）' },

    // R fix: V2 (blind 60 %: neither distractor touched what was said); one distractor now keeps the cost half
    // why: birth and health ← she is the one carrying them, so a health worry is the natural guess; cost and sleep ←
    //   "added expense" is caught, "harder to raise them" heard as the usual sleepless nights
    { id: 'd2', skill: 'detail', level: 'B1', point: 'expense', seg: [22.9, 29.0],
      stem: 'Which worries does Phoebe list?',
      choices: ['The work of raising them and the extra cost', 'The risk of the birth and her own health',
                'The extra cost and the lack of sleep'], a: 0,
      cue: '「maybe it’s」のあと、and でつながる二つ。',
      line: 'maybe it’s *harder to raise them* and *the added expense*…',
      said: '「三人育てるのは大変かも。それに出費も増えるし」と並べる。',
      mean: 'raise ＝ 育てる。added expense ＝ 増える出費。',
      trap: '三つ子を産む側の話と思うと、体の心配を選びやすい。and でつながる語を、二つとも拾う。',
      use: 'Kids are expensive to raise.（子どもを育てるのはお金がかかる）' },

    // R fix: V2 (blind 70 %: "planned long before" was weak); the distractor is now "knew, but didn't want to talk",
    //   and the segment starts at "Why would we be freaked?", which refutes it
    // why: knew but avoided it ← "Right." heard as "right, we know"; won't argue ← the Japanese frame: a short reply as polite,
    //   unspoken disagreement (遠慮)
    { id: 'i2', skill: 'infer', level: 'C1', point: 'realize', reveals: ['expense'], seg: [22.9, 35.0],
      stem: 'When the couple answers Phoebe with just “Oh.” and “Right.”, what does it show?',
      choices: ['They hadn’t thought about the costs until now', 'They knew the costs but didn’t want to discuss them',
                'They think she is wrong but won’t argue'], a: 0,
      cue: '短い返事の前の間と、その前の質問。',
      line: '*Oh.* … *Right.*',
      said: 'Phoebe の話のあと、二人は「あ…」「そうか」としか言えない。',
      mean: '言われて初めて現実に気づいた反応。さっきの「なんで動揺するの？」とつながる。',
      trap: 'Right を「分かってる」と取ると、準備ずみに聞こえる。間のあとの短い一言は、気づきの合図。',
      use: 'Oh. Right. I forgot about that.（あ、そうか。忘れてた）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'expense', seg: [25.0, 29.0],
      stem: 'Type what Phoebe says: “…and the ___, and…” (2 words)', answer: 'added expense',
      cue: '「raise them」のすぐあと。',
      line: 'maybe it’s harder to raise them, and the *added expense*, and…',
      said: '「それに出費も増えるし…」と言いかける。',
      mean: 'the added がつながり「ジャディッ」に近い。ed の d はほぼ聞こえない。',
      trap: 'added の語尾が消えて ad expense のように聞こえる。意味から「増えた」の added を補う。',
      use: 'Is there an added charge?（追加料金はかかりますか）' },

    // why: too negative ← the Japanese frame: a silence as quiet disapproval of the one who spoke; taking in the joy ←
    //   the right silence, the wrong direction (a happy pause before "Right")
    // anchor: 32.4–34.1 s (whisper 31.1–33.2 s) a gap of over a second between "Oh." and "Right."; 35.1 s Phoebe's "No,
    //   back to happy, back to happy!": she asks them to return to a joy that is gone
    { id: 'nt2', skill: 'infer', level: 'C2', point: 'realize', reveals: ['backhappy'], seg: [27.0, 39.3], retired: true,
      stem: 'Judging by Phoebe’s next line, what happened in the silence after “Oh.”?',
      choices: ['Her worries sank in and wiped out their joy', 'They quietly decided she was being too negative',
                'They were taking in the joy of having three'], a: 0,
      cue: '沈黙のあと、Phoebe が何に「戻ろう」と言うか。',
      line: '*Oh.* … *Right.* — No, *back to happy*, back to happy!',
      said: '「あ…」のあと長い間があって「そうか」。すぐ Phoebe が「だめ、喜びに戻って！」と言う。',
      mean: '「喜びに戻って」は、喜びが消えたと分かったから出る言葉。次の一言が、沈黙の中身を教えてくれる。',
      trap: '沈黙を「不満」や「感動」と取りやすい。間の意味は、その直後に誰が何を言うかで決まる。',
      use: 'Okay, let’s get back to the fun part.（さあ、楽しい話に戻ろう）' },

    // R fix: V2 (blind 75 %: the doctor choice was off the moment); it's now "No, no" heard as comfort
    // why: go home ← back = 帰る ("go back home"), with "happy" as how; fine to feel down ← the "No" read as comfort,
    //   the Japanese frame of 落ちこんでもいいよ
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'backhappy', reveals: ['realize'], seg: [31.5, 39.3],
      stem: 'After the couple goes quiet, what is Phoebe trying to do?',
      choices: ['Undo the damage her worries just did', 'Tell them it’s time to go home happy',
                'Let them know it’s fine to feel down'], a: 0,
      cue: '短い言葉を2回くり返すところ。誰に向けているか。',
      line: 'No, *back to happy*, back to happy!',
      said: '「だめだめ、喜ぶほうに戻って！」と二人に言う。',
      mean: '自分の一言で空気を壊したと気づき、取り消そうとしている。back to ～ ＝「～に戻ろう」。',
      trap: 'back を「家に帰る」と取りやすい。back to のあとが場所か、気持ちや状態かで意味が変わる。',
      use: 'Okay, back to work, everyone.（はい、みんな仕事に戻って）' },

    // R fix: S2 (the stem quoted "um", the hesitation that gives the key); it now names the moment only
    // why: the doctor ← "it's gonna be fine" sounds like a medical reassurance; worked out ← four quick "no"s and a firm
    //   "fine" sound like a settled plan
    { id: 'r1', skill: 'predict', level: 'B2', point: 'fine', seg: [38.9, 43.6], then: [43.6, 50.4],
      stem: 'Right after Alice’s “it’s gonna be fine”, what kind of reason is coming?',
      choices: ['One she is making up on the spot', 'One the doctor told them earlier', 'One she and Frank worked out long ago'],
      a: 0,
      cue: '「because」のあとの間と、言い直し。',
      line: 'it’s gonna be fine, because, *um*, because I teach home ec…',
      said: '「大丈夫、だって、えーと、だって私、家庭科を教えてるし…」と続ける。',
      mean: 'because のあとの um と言い直しは、その場で理由を探しているサイン。',
      trap: 'No が4回で自信ありげに聞こえるが、理由の前で止まる。強い言い方より、理由の前の間を聞く。',
      use: 'It’ll be fine, because… um… we’ll figure it out.（大丈夫、だって…まあ何とかなる）' },

    // why: cross with Phoebe ← the Japanese frame: four quick "no"s heard as shutting Phoebe down; fewer babies ← "back
    //   to happy" heard as proof the joy was put on from the start
    // anchor: 39.6–44.0 s "No, no, no, no, it's gonna be fine, because, um, because": the reason has to be searched for;
    //   44.3–50.2 s the one she finds covers baby clothes, nothing of "the added expense" of raising three
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'fine', reveals: ['clothes'], seg: [39.0, 54.6], retired: true,
      stem: 'Behind Alice’s “it’s gonna be fine”, what is she trying not to say?',
      choices: ['That she has no real answer to the cost', 'That she is cross with Phoebe for saying it',
                'That she would rather have had fewer babies'], a: 0,
      cue: '理由を言う前の間と、出てくる案の小ささ。',
      line: 'No, no, no, no, it’s gonna be fine, *because, um, because*…',
      said: '「大丈夫、だって、えーと…」と詰まってから、生徒にベビー服を作らせる案を出す。',
      mean: '「大丈夫」と言いたいが理由が見つからない。案が小さいほど、本当は困っているのが伝わる。',
      trap: 'No の連続を Phoebe への反発と取りやすいが、答えているのは出費の心配。否定のあとの理由の中身を聞く。',
      use: 'It’s fine, totally fine. Probably.（大丈夫、全然平気。たぶん）' },

    // why: sews herself ← "I can have…" heard as "I can make", and "all year long" as her own effort; a factory ← the
    //   "sweatshop" at the end heard as a real factory she knows
    { id: 'i4', skill: 'infer', level: 'B2', point: 'clothes', reveals: ['kids30'], seg: [43.5, 50.4],
      stem: 'From Alice’s plan, how would the baby clothes get made?',
      choices: ['Her students would sew them in class', 'She would sew them herself all year',
                'A cheap factory she knows would make them'], a: 0,
      cue: '「I teach」のあと、誰が作るのか。',
      line: 'I teach home ec, and I can have *30 kids making baby clothes*…',
      said: '「家庭科の先生だから、30人の生徒に一年中ベビー服を作らせられる」。',
      mean: 'have + 人 + ～ing ＝ 人に～させる。kids は授業の生徒たち。',
      trap: 'I can have を「自分で作れる」と取りやすい。have のあとの人が実際に作る人。',
      use: 'I’ll have someone pick you up.（誰かに迎えに行かせるね）' },

    // R fix: V2 (blind 65 %: "teasing Phoebe" was weak); now the wrong-target reading of "kids"
    // why: the joke on the sewing-shop idea ← "sweat" + "shop" heard as a shop for clothes, a word slip; her own babies
    //   ← "kids" heard as the triplets, so the babies are the ones put to work
    { id: 'h1', skill: 'humor', level: 'C1', point: 'sweatshop', reveals: ['clothes', 'kids30'], seg: [43.5, 55.0],
      stem: 'Why is Alice’s last line about her plan funny?',
      choices: ['She cheerfully compares her class to child labor', 'She means a sewing shop but picks a wrong word',
                'She jokes that her own babies will have to work'], a: 0,
      cue: '最後の「my very own little」のあとの語。',
      line: 'it’ll be like my very own little *sweatshop*.',
      said: '「私だけの小さな、子どもを働かせる工場みたい」と明るく言う。',
      mean: 'sweatshop ＝ 安く長く働かせる工場。自分の案をそう呼んでしまう。',
      trap: 'sweat と shop で「服の店」と取りやすい。明るい言い方と中身の落差が笑い。',
      use: 'It’s like my own little office.（私だけの小さなオフィスみたい）' },

    // why: 3 ← the three babies are the "kids" on everyone's mind; 13 ← -teen/-ty: thirty's stress and final t blur
    { id: 'n1', skill: 'number', level: 'B1', point: 'kids30', reveals: ['clothes'], seg: [45.9, 50.4], keep: true,
      stem: 'How many kids does Alice mention?',
      choices: ['3', '13', '30'], a: 2,
      cue: '「I can have」の直後の数。',
      line: 'I can have *30 kids* making baby clothes all year long.',
      said: '「30人の子にベビー服を作らせられる」と言う。',
      mean: 'thirty は前を強く「サーリィ」。thirteen なら後ろの teen が強く長い。',
      trap: '-ty と -teen は聞き分けにくい。強さが前か後ろか、語尾が「ティーン」と伸びるかで判断。',
      use: 'Sorry, was that thirteen or thirty?（すみません、13ですか30ですか）' },
  ]
};
