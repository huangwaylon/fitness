// “Leslie and Ben are very sober | Parks and Recreation” (the official Parks and Recreation channel, Season 6): out of
// office, Leslie hands trick-or-treaters a gloomy talk about peaking; Ben comes to comfort her and starts doubting his
// own career; a few drinks later the two of them try to get tattoos at a pawn shop until Ann stops them.
// REVIEW 2026-11-16: pass 1, fix 21, drop 0, new 0; ear checks 1
// Segments from the captions, words from whisper (2026-11-16). Whisper repeats 104–132 s twice (a loop) and drifts by
// up to 12 s there; every time below is from the captions. The captions have a gap at 78–89 s. Talk ends at ≈ 259 s.
// Untested: the April/Burt Macklin stretch (44–89 s, needs the show's backstory); "I'm kind of sweeter" (captions) vs
// "I'm gonna give you something sweeter" at 21 s (h1's line is trimmed to words in both); the "pill/peel bucket" at
// 220 s and "Mouse Queen" at 223 s; "haven't beat" (captions) vs "haven't peaked" (whisper) at 244.9 s.
// EAR CHECK: 89.1 s pr1 g2 n1 i3 — the man who comes in to comfort Leslie is taken to be Ben (no name in the audio
//   until "just write Ben" at 216 s; the title names Leslie and Ben)
import type { Clip } from '../types.ts';

export const verySober: Clip = {
  id: 'verysober', video: 'O4LLO6fjKoU', title: 'Leslie and Ben are very sober', dur: 280, wpm: 170, band: 'mid',
  tags: ['恋愛', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 85 %; "ghosts" was a filler): a distractor is now "invisible" read as an excuse for a bare
    //   house; S4 (the start cut the child's question): seg starts 8.35
    // why: school ← "disappointment… never climb any higher" heard as a warning about grades; decorations ← "Scary
    //   stuff is invisible" heard as an excuse for having none up
    { id: 'i1', skill: 'infer', level: 'C1', point: 'scary', reveals: ['chapter'], seg: [8.35, 18.6],
      stem: 'When a child asks where the scary stuff is, what is Leslie really describing?',
      choices: ['What has just happened in her own life', 'Why her house has no decorations this year',
                'What will happen if the kids fail at school'], a: 0,
      cue: '並べたものの順番に注目。',
      line: '*achieving your greatest goal, having it all fall apart*, and knowing that you’ll never climb any higher.',
      said: '「怖いものは見えない。夢が破れる、目標をかなえて全部崩れる」と並べる。',
      mean: '目標達成→崩れる→もう上がれない、は彼女自身の話。子ども向けのおばけではない。',
      trap: 'invisible を飾りがない言い訳と取りやすい。中身は「議員の章は終わった」と重なる。',
      use: 'Honestly, the scariest thing is a deadline.（正直、一番怖いのは締め切り）' },

    // R fix: V2 (blind 80 %; "bad for their teeth" was weak): a distractor is now "the truth" read as a lecture on
    //   honesty; S4 (the start cut "higher"): seg starts 18.85
    // why: honesty ← "The truth" heard as a lesson about not lying; costumes ← "turkeys" heard as a comment on their
    //   outfits
    { id: 'h1', skill: 'humor', level: 'B2', point: 'truth', seg: [18.85, 28.8],
      stem: 'When the kids ask for candy, why does Leslie’s answer get a laugh?',
      choices: ['She hands small kids a gloomy life lesson instead', 'She hands small kids a lecture on telling the truth',
                'She calls the kids turkeys because of their costumes'], a: 0,
      cue: '「sweeter than candy」のあとに来る物。',
      line: 'sweeter than candy… *The truth.* …some of you have *already peaked*.',
      said: '「お菓子より甘いものをあげる。真実よ。もう頂点を過ぎた子もいるかも」と言う。',
      mean: 'ハロウィーンの子どもに、お菓子の代わりに暗い人生訓を渡すずれが笑い。',
      trap: 'truth を「うそはだめ」、turkeys を衣装の話と取りやすい。真実とは「頂点を過ぎた」。',
      use: 'I’ll give you something better: advice.（もっといいものをあげる。助言よ）' },

    // R fix: V2 (blind 70 %; "after saying some have peaked" set up the key): the stem now names the moment by
    //   "turkeys"; S4 (the start cut "truth", the end cut "Okay"): seg now 23.55–28.85
    // why: easier ← "downhill" in its other sense, the easy part of a walk; next house ← taken literally, the kids
    //   heading down the street
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'downhill', reveals: ['truth'], seg: [23.55, 28.85],
      stem: 'What does Leslie tell the kids just before calling them “turkeys”?',
      choices: ['Things will only get worse from now on', 'The hard part of life is behind them now',
                'The next house is just down the hill'], a: 0,
      cue: '「peaked」のすぐあと、たとえの言い方。',
      line: '*It’s all downhill from here*, turkeys.',
      said: '「ここから先はずっと下り坂よ、おちびさんたち」と言う。',
      mean: 'all downhill ＝ ここから悪くなる一方。頂点（peak）を過ぎた、の続き。',
      trap: 'downhill は「楽になる」の意味でも使う。直前に peaked があれば、悪くなるほう。',
      use: 'After thirty, it’s all downhill.（30過ぎたら下り坂だよ）' },

    // R fix: V2 (blind 70 %; "until spring" was a filler): a distractor is now the title heard without "not"; S4
    //   (the start cut "Knope, kids", the end cut "Just"): seg now 31.0–35.55
    // why: run again ← "City Councilwoman" heard as her current goal; title ← "It's not City Councilwoman Knope" heard
    //   without "not"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'chapter', seg: [31.0, 35.55],
      stem: 'What does Leslie say about being City Councilwoman?',
      choices: ['That part of her life is over', 'She’d still like to be called by it', 'She plans to run for it again'],
      a: 0,
      cue: '「because」のあと。',
      line: 'It’s not City Councilwoman Knope, because *that chapter in my life is already over*.',
      said: '「ノープさんでいいの。議員の章はもう終わったから」と言う。',
      mean: 'chapter ＝ 人生の一時期。本の章にたとえて「あの時代は終わった」と言っている。',
      trap: 'Councilwoman で今も議員に聞こえる。not と already over まで聞く。',
      use: 'That chapter of my life is closed.（あの時期はもう終わった）' },

    // R fix: V2 (blind 85 %; "makes her cry" was a filler): a distractor is now Ben losing patience at "Or do you?"
    // why: comeback ← Ben's "keep climbing back up that hill" sounds like the last word; fed up ← her "Or do you?"
    //   pushes back on his advice
    { id: 'g2', skill: 'gist', level: 'B2', point: 'turn', reveals: ['candyjob', 'eighteen'], seg: [89.0, 136.5],
      stem: 'How does Ben’s visit to comfort Leslie turn out?',
      choices: ['He ends up worrying about his own career', 'He cheers her up, and she plans a comeback',
                'He gets fed up when she won’t take advice'], a: 0,
      cue: '彼が自分の仕事を並べ始めたところ。',
      said: 'ベンは「坂をまた登れ」と励ますが、職歴を並べるうち「僕も18で頂点？」と言い出す。',
      mean: '励ます側が、話すうちに自分も同じ悩みに落ちる、という逆転。',
      trap: 'keep climbing で成功、Or do you? で口論と取りやすい。揺らぐのは本人。',
      use: 'Wait, now I’m worried about me.（待って、今度は自分が心配になってきた）' },

    // R fix: V2 (blind 70 %; "asking her to say" was weak): a distractor is now "I know" heard as his own feeling;
    //   S4 (the end cut Leslie's "I"): seg ends 93.15
    // why: ought to ← "must" read as obligation (〜しなければならない); felt it too ← "I know… feel awful" heard as
    //   about himself, and he later says "I know the feeling"
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'must', seg: [89.0, 93.15],
      stem: 'When Ben first comes in, what is his second sentence doing?',
      choices: ['Guessing how she feels, to show sympathy', 'Telling her she ought to feel bad about it',
                'Saying he has felt just as awful before'], a: 0,
      cue: '「I am really sorry」のあとの文。',
      line: 'Hey, I am really sorry. *I know you must feel awful.*',
      said: '「本当に気の毒に。きっとつらいよね」と声をかける。',
      mean: 'この must は「きっと〜だろう」という推測。相手の気持ちを思いやる定番の言い方。',
      trap: 'must を「〜すべき」、I know を彼自身の話と取りやすい。feel の前の must は推測。',
      use: 'You must be tired after the flight.（長旅で疲れたでしょう）' },

    // R fix: V2 (blind 65 %; "won't" didn't fit the reply): "won't" → "didn't"; S4 (the end cut "know"): seg ends
    //   94.9
    // why: do ← the n't of "don't" drops and only "do" is left, an emphatic "I do"; didn't ← the n't is caught, the
    //   d- start heard as past
    { id: 's1', skill: 'sound', level: 'B2', point: 'awful', seg: [91.3, 94.9],
      stem: 'Fill the gap: “I know you must feel awful.” — “I ___ feel awful.”',
      choices: ['don’t', 'do', 'didn’t'], a: 0,
      cue: '返事の I のすぐあと、短い一語。',
      line: '“…you must feel awful.” — “I *don’t* feel awful.”',
      said: '「つらいよね」と言われ、「つらくなんかない」と返す。',
      mean: 'don’t は弱く「ドン」。t はほぼ消えるが、ン の鼻音は残る。',
      trap: 'n’t が聞こえないと do に聞こえ、正反対の意味になる。ン の響きを手がかりに。',
      use: 'I don’t mind at all.（全然かまわないよ）' },

    // R fix: V2 (blind 55 %; the key was the only state that fits "finally"): "fight back" → "too tired", from
    //   "relax"; S4 (the start cut "awful", the end cut "Yeah"): seg now 93.15–99.35
    // why: awful ← "awful" is said twice just before; tired ← "I can finally relax" heard as needing rest
    { id: 'd2', skill: 'detail', level: 'B1', point: 'relax', reveals: ['awful'], seg: [93.15, 99.35],
      stem: 'How does Leslie say she feels now?',
      choices: ['Free, and able to relax at last', 'Too tired to do anything more', 'Awful about losing her job'], a: 0,
      cue: '「I feel like」のあと。',
      line: 'I feel like I can *finally relax*. Accepting that you’ve peaked is *very freeing*.',
      said: '「やっと気が楽。頂点を過ぎたと認めると解放される」と言う。',
      mean: 'finally relax ＝ やっと気を抜ける。freeing ＝ 解放された気分にさせる。',
      trap: '直前の awful が残り、relax は「疲れた」にも聞こえる。',
      use: 'It’s so freeing to say no.（断ると本当に気が楽）' },

    // why: thirteen ← the -teen is heard but the first syllable blurs; thirty ← -teen/-ty
    { id: 'n1', skill: 'number', level: 'B1', point: 'eighteen', seg: [99.2, 103.4], keep: true,
      stem: 'How old was Ben when he was impeached?',
      choices: ['Thirteen', 'Eighteen', 'Thirty'], a: 1,
      cue: '「impeached when I was」のあと。',
      line: 'I was impeached *when I was 18*, and it was brutal.',
      said: '「僕は18歳でだんがいされた。あれはきつかった」と言う。',
      mean: 'impeach ＝ 職を解かれる。eighteen は -teen を強く長く言う。',
      trap: '-teen と -ty は強勢の位置、thirteen と eighteen は出だしで分ける。',
      use: 'I moved out when I was eighteen.（18で家を出た）' },

    // R fix: S4 (the end cut Leslie's "Or"): seg ends 106.28
    { id: 'x1', skill: 'dict', level: 'B2', point: 'hill', seg: [103.4, 106.28],
      stem: 'Type what Ben says: “you have to keep ___ that hill.” (3 words)', answer: 'climbing back up',
      cue: '「keep」のあと、hill の前。',
      line: 'you have to keep *climbing back up* that hill.',
      said: '「でも、その坂をまた登り続けなきゃ」と励ます。',
      mean: 'climb back up ＝ もう一度登る。失ったものを取り戻す努力のたとえ。',
      trap: 'climbing の b は読まず、back‿up がつながって「バカップ」に聞こえる。',
      use: 'It took months to climb back up.（立ち直るのに何か月もかかった）' },

    // R fix: V2 (blind 50 %; "checking she heard" was weak): a distractor is now agreeing and asking how; S4 (the
    //   start cut Ben's "keep climbing back up that hill", which "Or do you?" answers): seg now 103.45–116.4
    // why: about Ben ← "do you" heard as asking whether Ben himself climbed back; how to start ← the question heard
    //   as agreement, with "Maybe instead of…" as a request for steps
    { id: 'pr2', skill: 'pragma', level: 'C1', point: 'ordoyou', seg: [103.45, 116.4],
      stem: 'When Leslie answers Ben’s advice with a short question, what is she doing?',
      choices: ['Doubting that anyone has to climb back at all', 'Asking whether Ben really climbed back himself',
                'Agreeing, and asking him how she should start'], a: 0,
      cue: '短い問いのあとに続く「Maybe」以下。',
      line: '*Or do you?* Maybe instead of working super hard to rebuild your life…',
      said: '「本当に？必死に立て直す代わりに『いい時代だった』と言えば？」と返す。',
      mean: 'Or do you? ＝ 本当にそう？相手の have to に疑問を投げる。',
      trap: 'do you を「あなたは？」と取りやすい。have to を受けた問いで、主語は人一般。',
      use: 'You have to go. — Or do I?（行かなきゃ。—本当に？）' },

    // R fix: V2 (blind 60 %; "bored" was a filler): a distractor is now the caring-husband script, shock; S4 (the
    //   start cut "chill"): seg starts 116.5, with her idea
    // why: won over ← "Well, sure" heard as full agreement (the 「おっしゃる通り」 frame); shocked ← the usual script
    //   of a supportive husband hearing "spend the rest of my life really chill"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'appealing', seg: [116.5, 122.8],
      stem: 'How does Ben respond to Leslie’s idea of a chill life?',
      choices: ['Tempted, but not fully agreeing', 'Won over; he wants the same', 'Shocked that she would give up'],
      a: 0,
      cue: '「sure」のあと、part of。',
      line: 'Well, sure, I mean, *part of that* sounds very appealing.',
      said: '「まあ、確かに、その一部はすごく魅力的に聞こえる」と言う。',
      mean: 'part of that ＝ 一部は。全部には賛成していない含みで、このあと but が来る。',
      trap: 'sure で賛成と取りやすい。part of のような限定は、反論の前置き。',
      use: 'Part of me wants to say yes.（ちょっとイエスと言いたい気もする）' },

    // R fix: V2 (blind 80 %; "late for his charity job" was a filler): a distractor is now the comfort scene's own
    //   worry; S4 (the end cut Leslie's "There"): seg ends 134.85
    // why: made her worse ← he came to comfort her, so a sudden "Oh God" sounds like a blunder; charity in trouble ←
    //   "crisis" carried over from “budget crisis management”
    { id: 'i3', skill: 'infer', level: 'C1', point: 'candyjob', seg: [122.8, 134.85],
      stem: 'Why does Ben stop mid-sentence and say “Oh God”?',
      choices: ['His own job list shows his career sliding', 'He realizes his words made her feel worse',
                'He realizes his charity is facing a crisis'], a: 0,
      cue: '前の仕事と今の仕事の並べ方。',
      line: 'I took a job in *city budget crisis management*, and now I work for *a candy charity*.',
      said: '「市の財政危機の管理をして、今はお菓子の慈善団体で働いてる」と言いかけて止まる。',
      mean: '並べると大きな仕事から小さな仕事へ下っている。説得の途中で、自分も頂点を過ぎたと気づく。',
      trap: 'crisis が残り、失言とも取りやすい。今と昔の仕事の並びで考える。',
      use: 'Wait. Did I just argue against myself?（待って、自分で自分に反論した？）' },

    // R fix: V2 (blind 70 %; "shocked" was a filler): a distractor now answers the question's content (a later peak)
    // why: hands drink ← "There it is" taken literally, pointing at the drink; corrects ← a reply to "Did I peak at
    //   18?" heard as an answer about the age
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'thereitis', reveals: ['eighteen'], seg: [132.4, 137.0],
      stem: 'After Ben asks if he peaked at 18, what does Leslie’s reply do?',
      choices: ['Welcomes him to the view she has reached', 'Hands him the drink she has just poured',
                'Corrects him: he peaked later than 18'], a: 0,
      cue: '短い一言と、続く「Drink up」。',
      line: 'Did I peak when I was 18? — *There it is.* Drink up.',
      said: '「僕は18で頂点だった？」に、「ほら来た。さあ飲んで」と返す。',
      mean: 'There it is ＝ ほら、そこに来た。待っていた気づきに相手がたどり着いた合図。',
      trap: '物を指す「はい、どうぞ」や、年の訂正と取りやすい。返しているのは問いの気づきのほう。',
      use: 'And there it is: the real reason.（ほら出た、本当の理由が）' },

    // R fix: V2 (blind 85 %; "costumes" was a filler, and only the key was about love): a distractor is now rings,
    //   what a pawn shop sells, for "love each other forever"
    // why: sell things ← "pawn shop" is said, and she has just lost her job; rings ← "love each other forever" + a
    //   pawn shop, where rings are sold
    { id: 'g1', skill: 'gist', level: 'B2', point: 'tattoo', reveals: ['pawnshop'], seg: [141.0, 178.5],
      stem: 'Why do Leslie and Ben end up at the pawn shop?',
      choices: ['To get tattoos that show their love is forever', 'To buy rings that show their love is forever',
                'To sell things now that her job has ended'], a: 0,
      cue: '「something big」のあとの思いつき。',
      said: '「ずっと愛し合うと人に示す大きなことを」と言い、質屋で入れ墨を頼む。',
      mean: '仕事の悩みを、二人の愛を形に残すことで乗り越えようとしている。',
      trap: '質屋（pawn shop）なので売り買いや指輪と取りやすいが、頼むのは入れ墨。',
      use: 'Let’s do something big to celebrate.（お祝いに何か大きなことをしよう）' },

    // R fix: V2 (blind 65 %; only the key contradicted the quote): all three now name a worry plus a proof; S4 (the
    //   end cut "Yeah"): seg ends 166.05
    // why: marriage ← "love each other forever" heard as the worry itself (a scope shift from career to love);
    //   wedding ← "married me in front of people" + "something big" heard as wanting a second ceremony
    // anchor: 159.7–165.8 s "We may have peaked, but it doesn't matter. We need to do something big… that really lets
    //   people know": if it truly didn't matter, nothing would need proving to anyone
    // retired: never drawn under g1, which shares its point (tattoo), so play 3 under g1 had no C2 to give
    { id: 'nt1', skill: 'attitude', level: 'C2', point: 'tattoo', seg: [157.0, 166.05], retired: true,
      stem: 'When they say peaking “doesn’t matter”, what are they trying not to say?',
      choices: ['That peaking bothers them, so they want proof', 'That their marriage worries them, so they want proof',
                'That they want a second, bigger wedding as proof'], a: 0,
      cue: '「関係ない」と言った直後の文。',
      line: 'We may have peaked, but *it doesn’t matter*. *We need to do something big*…',
      said: '「頂点は過ぎたかもしれないけど関係ない」と言った直後に、「何か大きなことをしなきゃ」と言う。',
      mean: '本当に関係ないなら、人に示す必要はない。「関係ない」と言った口で証明を急ぐのが、気にしているしるし。',
      trap: '愛の言葉が多いので、夫婦の不安と取りやすい。愛は確かで、気にしているのは「頂点」のほう。',
      use: 'I’m totally fine. Now, where’s the wine?（全然平気。で、ワインはどこ？）' },

    // anchor: 172.6–173.4 s both sources have "tattoos in our bodies": a drunk slip that a learner's grammar would
    //   "fix" to "on", right after "We're sober"
    // R fix: S4 (the start cut "sober", the end cut the owner's "Tattoos?"): seg now 171.8–174.25
    // retired: with nt1 (one C2 alone is under the tier's 2)
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'inour', seg: [171.8, 174.25], retired: true,
      stem: 'Type the request: “We would like to get tattoos ___.” (3 words)', answer: 'in our bodies',
      cue: '「tattoos」のすぐあと。文法より、聞こえた音を。',
      line: 'We would like to get tattoos *in our bodies* because we love each other.',
      said: '「しらふです。愛し合っているので、体の中に入れ墨を入れたいです」と頼む。',
      mean: 'ふつうは on our bodies。in と言ってしまうのが、しらふではないしるしで、そこも笑い。',
      trap: '習った形に合わせて on と書きたくなる。書き取りは正しい文でなく、言われた音を書く。',
      use: 'We’re sober. Very, very sober.（しらふです。とっても）' },

    // R fix: V2 (blind 60 %; "a tattoo shop, fully booked" was weak): a distractor is now a referral, from “But…
    //   I can do that”; S4 (the start cut "each other"): seg starts 174.25
    // why: knows a place ← "But, yeah, sure" heard as the start of a helpful referral; can't help ← "This is a pawn
    //   shop" heard as the end of it, missing "But, yeah, sure"
    { id: 'd4', skill: 'detail', level: 'B2', point: 'pawnshop', seg: [174.25, 178.6],
      stem: 'How does the shop owner answer the tattoo request?',
      choices: ['It is a pawn shop, but he’ll do it anyway', 'It is a pawn shop, but he knows a tattoo place',
                'It is a pawn shop, so he can’t help them'], a: 0,
      cue: '「This is a」の文と、続く But。',
      line: 'Tattoos? *This is a pawn shop.* *But, yeah, sure, I can do that.*',
      said: '「入れ墨？ここは質屋だよ。でもまあ、いいよ、できるよ」と答える。',
      mean: '入れ墨の店ではないのに引き受ける。その軽さが、この先の騒ぎにつながる。',
      trap: 'pawn shop で断った、But で紹介と思いやすい。I can do that が本当の答え。',
      use: 'Not my job, but sure, I’ll help.（担当じゃないけど、いいよ手伝う）' },

    // R fix: V2 (blind 50 %; "flat" vs "polite"/"unsure" flagged the key): choices are now near sounds, nope/yep
    // why: yep ← nope and yep share the vowel and the final p, and a polite shop owner is the usual script; maybe ←
    //   the "Okay" right after heard as part of the answer
    { id: 'a3', skill: 'detail', level: 'B1', point: 'cutest', seg: [192.6, 197.4],
      stem: 'How does the shop owner answer when asked if they’re the cutest couple?',
      choices: ['A quick “nope”', 'A quick “yep”', 'A slow “maybe”'], a: 0,
      cue: '問いのすぐあとの一語。',
      line: 'Are we the cutest couple you’ve ever seen? — *Nope.*',
      said: '「私たち、今まで見た中で一番かわいいカップル？」に、「いや」と即答される。',
      mean: 'Nope ＝ No のくだけた形。迷わず即答なので、そっけない否定。',
      trap: '客には愛想よく、という型で yep と聞きやすい。出だしの n を聞く。音は短い「ノウプ」。',
      use: 'Is it ready? — Nope, five more minutes.（できた？—まだ、あと5分）' },

    // why: own face ← "a portrait" heard as a portrait of herself dressed as someone famous; tastefully ← "tastefully
    //   done" heard as her real taste, so the joke seems to be speed or style
    // R fix: S4 (the start cut "it is", the end cut "No"): seg now 202.1–214.25
    { id: 'h4', skill: 'humor', level: 'C1', point: 'subtle', seg: [202.1, 214.25],
      stem: 'Why does Leslie’s portrait idea get a laugh?',
      choices: ['She calls a tattoo inside a tattoo “very subtle”', 'She wants her own face drawn as a famous woman',
                'She asks for it to be done tastefully and quickly'], a: 0,
      cue: '最後の「and that’s」のあと。',
      line: 'she has a very classy tattoo of Pat Benatar on her arm, and *that’s very subtle*.',
      said: '「有名な女性の肖像。その腕に歌手の入れ墨。すごく控えめ」と頼む。',
      mean: '入れ墨の中の人物にさらに入れ墨、という派手な案を「控えめ」と呼ぶずれ。人名は知らなくていい。',
      trap: '人名に気を取られやすいが、笑いは最後の subtle。中身と評価のずれを聞く。',
      use: 'Nothing fancy, just something subtle.（派手じゃなく、控えめなので）' },

    // R fix: V2 (blind 75 %; the two literal "scratch" readings left the key the only idiom): "scrape deeper" → "add a
    //   name", from “just write Ben”; S4 (the start cut "subtle", the end cut "Do you have"): seg now 212.85–216.68
    // why: sketch lightly ← "scratch" taken literally (引っかく), a light first line; add a name ← "just write Ben"
    //   heard as an addition to the design
    { id: 'p3', skill: 'phrase', level: 'B2', point: 'scratch', seg: [212.85, 216.68],
      stem: 'Right after the portrait idea, what is the tattoo man asked to do?',
      choices: ['Drop that idea and just write a name', 'Keep that idea but add a name to it',
                'Sketch that idea lightly onto the skin'], a: 0,
      cue: '「No」のあとの2語と、そのくり返し。',
      line: '*No, scratch that. Scratch all that*, just write Ben.',
      said: '「いや、今のなし。全部なし。ただ Ben と書いて」と言い直す。',
      mean: 'scratch that ＝ 今のは取り消し。書いた物を線で消すイメージ。',
      trap: 'scratch を「引っかく」、名前は追加と取りやすい。No のあとなら取り消し。',
      use: 'Meet at six — no, scratch that, seven.（6時に、いや取り消し、7時）' },

    // R fix: V2 (blind 80 %; "friends she is proud of" was a filler): a distractor is now a polite host seeing guests
    //   out; S4 (the start cut "sense", the end cut "go"): seg now 247.05–254.3
    // why: customers ← "nice man" and "thank me" heard as settling a bill; guests ← "say goodbye to the nice man" heard
    //   as polite leave-taking
    { id: 'a5', skill: 'attitude', level: 'C1', point: 'niceman', seg: [247.05, 254.3],
      stem: 'How is Ann treating Leslie and Ben as she takes them out?',
      choices: ['Like small kids being taken home', 'Like guests she must see out politely',
                'Like customers who still owe money'], a: 0,
      cue: '「say goodbye to」の言い方。',
      line: '*say goodbye to the nice man*, and *thank me* for saving you…',
      said: '「親切なおじさんにさよならして。私にお礼を言って」と言う。',
      mean: '子どもに言う決まり文句。冒頭の子どもたちと同じ形で、大人二人が子ども扱い。',
      trap: 'thank で支払い、goodbye で礼儀と取りやすい。say goodbye to … は子ども向け。',
      use: 'Say thank you to the lady.（お姉さんにありがとうって言って）' },
  ]
};
