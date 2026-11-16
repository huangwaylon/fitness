// “Leslie won't be intimidated by cream pies | Parks and Recreation” (the official Parks and Recreation channel,
// Season 7): Ben's campaign drops a pie contest for candidates' wives from Leslie's schedule; the press turns it into
// "she looks down on families", Leslie decides to enter, and a women's group threatens to protest her if she does.
// Segments from the captions, words from whisper (2026-11-16). The contest's name is a pun (whisper "Pie Mary",
// captions "primary"), so stems call it "the pie contest" and no item turns on the word. Jen (the adviser) is named
// only later (187.9 s), so she is "the adviser" or "the visitor".
// Untested on purpose: 4–8 s (the "types of talk" list: "reel, and Ted" / "real intent"), 73–90 s (whisper loops),
// 147–156 s (the shouted questions; "None of your business" is missing from the captions), 203–208 s (the cookbook
// title is a pun on a book title), 236–244 s (the doorbell and greetings), 291–297 s apart from “Chop, chop” ("Babe" /
// "I think", "bacon", "want" / "won").
// EAR CHECK: 291.2 s c2 — "Chop, chop" is Ben's (he says "Hi. Ben Wyatt." at 296 s; whisper has "Babe, the oven's
//   ready", the captions "I think the oven's ready")
// REVIEW 2026-11-16: pass 7, fix 17, drop 0, new 0; ear checks 1
import type { Clip } from '../types.ts';

export const piemary: Clip = {
  id: 'piemary', video: 'BF7Sxw5_NsM', title: 'Leslie won\'t be intimidated by cream pies', dur: 319, wpm: 182,
  band: 'fast', tags: ['職場', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: rain ← the usual reason for a poncho; her blazer ← "melted crayon on my blazer" is the last thing she says
    { id: 'd1', skill: 'detail', level: 'B1', point: 'poncho', seg: [8.05, 16.55],
      stem: 'Why is the visitor wearing a poncho in Leslie’s house?',
      choices: ['Everything in the house is sticky', 'It has been raining hard all day',
                'She spilled something on her blazer'], a: 0,
      cue: '「because」のあと、文の最後の一語。',
      line: 'because every surface area in your house is *sticky*.',
      said: '「この家はどこもベタベタだから」と答え、前回は上着に溶けたクレヨンが付いたと言う。',
      mean: '子どものいる家への皮肉まじりの理由。雨とは関係ない。',
      trap: 'blazer が最後に聞こえるので今の汚れと取りやすいが、Last time の話。',
      use: 'Careful, the table’s a little sticky.（気をつけて、テーブルちょっとベタベタ）' },

    // R fix: V2 (blind 50 %: "real work gets done" was the only other reading, and it praised a town she is leaving).
    //   "A nice break from the busy city" (wrong direction) replaces it.
    // why: a nice break ← "get back to a city" heard as leaving a quiet place she enjoyed; too busy ← "a ton of stuff
    //   scheduled" just before
    { id: 'i1', skill: 'infer', level: 'B2', point: 'city', seg: [33.8, 38.8],
      stem: 'What does the visitor’s goodbye suggest about Leslie’s town?',
      choices: ['Not much worth her time happens there', 'It is a nice break from the busy city',
                'It is too busy for her to stay long'], a: 0,
      cue: '「get back to a city」のあとの説明。',
      line: 'I have to get back to *a city where things happen*.',
      said: '「何かが起きる街に戻らなきゃ」と言って出て行く。',
      mean: '裏返すと「ここは何も起きない街」。軽い嫌み。',
      trap: '都会に戻る＝ここは息抜き、と取りやすい。where things happen の裏は「ここは何もない」。',
      use: 'I need to get back to the office.（会社に戻らなきゃ）' },

    // R fix: V2 (blind 50 %: the three choices weren't parallel, and "no real duties" read as a filler). Three short
    //   "Full of / Something" descriptions now.
    // why: battles ← mine = 地雷 heard as war; nobody wants it ← "that's the problem" heard as a warning off the role
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'minefield', seg: [51.85, 56.0],
      stem: 'How does the adviser describe the role of a candidate’s wife?',
      choices: ['Full of hidden dangers', 'Full of tough battles', 'Something nobody wants'], a: 0,
      cue: '「that’s the problem」のあと、最後の名詞。',
      line: 'Being the wife of is a *minefield*.',
      said: '「候補者の妻という立場は地雷原だ」と言う。',
      mean: 'minefield ＝ どこに危険があるか分からない状況。一言で失敗しかねない。',
      trap: '地雷から戦争の話と取りやすい。勝ち負けでなく「踏むと危ない」場所のたとえ。',
      use: 'Office politics can be a minefield.（社内政治は地雷だらけ）' },

    // R fix: V2 (blind 60 %: "knowledge" in the stem pointed at "too smart", and "want a wife who has run" contradicted
    //   the stem). "May think she wants to be the candidate" (her own "I was an actual candidate") replaces it.
    // why: wants to be the candidate ← "I was an actual candidate" is said; dull ← a wife who talks policy heard as
    //   boring
    { id: 'i2', skill: 'infer', level: 'C1', point: 'smarties', reveals: ['minefield'], seg: [51.85, 65.55],
      stem: 'Why does the adviser see Leslie’s knowledge of the issues as a problem?',
      choices: ['Voters get nervous about a wife who seems smart',
                'Voters may think she wants to be the candidate',
                'Voters will find her dull if she talks policy'], a: 0,
      cue: '長いたとえ話のあと、「It’s the」で始まる文。',
      line: 'If you were just a ding-dong… *It’s the smarties that freak people out.*',
      said: '「おばかなら後ろに立たせればいい。怖がられるのは賢い人」と言う。',
      mean: '賢すぎる妻は有権者を不安にさせる、という皮肉な見方。知識が弱みになる。',
      trap: 'actual candidate が聞こえるので経験の話と取りやすい。結論は最後の一文。',
      use: 'Don’t overthink it. Keep it simple.（考えすぎないで、シンプルに）' },

    // R fix: V2 (blind 70 %: "can't judge voters at all" was a filler). "She already rates them fairly" (the line
    //   taken as a sincere denial) replaces it.
    // why: rates them fairly ← "I don't think that is possible" heard as "I'm not doing that"; can't win ← "possible"
    //   heard about Leslie's chances
    { id: 'h1', skill: 'humor', level: 'C1', point: 'possible', seg: [65.45, 71.6],
      stem: 'Why is the adviser’s reply to “underestimating the voters” funny?',
      choices: ['She means voters can’t be rated too low',
                'She means she already rates them fairly',
                'She means Leslie can’t win the voters over'], a: 0,
      cue: '短い返事の「that」が何を指すか。',
      line: 'I think you’re underestimating the voters. — *I don’t think that is possible.*',
      said: '「有権者を見くびってるよ」に「見くびるなんて無理」と返す。',
      mean: 'that ＝ 有権者を見くびること。低く見すぎることはできない、つまり最低だと思っている。',
      trap: '「見くびってない」の否定や勝ち目の話と取りやすい。that は直前の動詞を指す。',
      use: 'I don’t think that’s possible.（それは無理だと思う）' },

    // R fix: V2 (blind 85 %: the only choice where the press makes trouble). "Ben is hiding her away" (right
    //   mechanism, wrong target) replaces the praise reading.
    // why: hiding her ← "your campaign released a schedule" puts Ben in the questions first; let it go ← Leslie's turn
    //   to "Ben's $150 million" project heard as working
    { id: 'g1', skill: 'gist', level: 'B2', point: 'press', reveals: ['careto'], seg: [90.85, 156.0],
      stem: 'How does the press handle Leslie skipping the pie contest?',
      choices: ['They turn it into a story that she looks down on homemaking',
                'They turn it into a story that Ben is hiding her away',
                'They let it go once she points to Ben’s big project'], a: 0,
      cue: '記者たちの質問が、何についての質問か。',
      said: '欠場を「何の主張か」と問われ、ベンの事業に話を向けても、子どもや家庭の質問が続く。',
      mean: 'パイの欠場が「家庭を軽く見ている」話にすり替えられていく。',
      trap: '彼女は大きな事業の話で切り抜けようとするが、記者は乗らず質問が続く。',
      use: 'Let’s focus on the bigger picture.（もっと大きな話に目を向けよう）' },

    // R fix: V2 (blind 70 %: "a break" was a filler). "Checking whether Ben has time" (Care to = would you like to,
    //   the polite frame) and "confirm the schedule" (a keyword trap) now.
    // why: has time ← "Care to…?" = would you like to, heard as a polite offer; confirm ← "released a schedule" heard
    //   as what he asks about
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'careto', seg: [90.85, 97.3],
      stem: 'What is the reporter doing with the short question that ends the turn?',
      choices: ['Pushing Ben to justify his wife’s choice', 'Checking whether Ben has time to explain',
                'Asking Ben to confirm the schedule is right'], a: 0,
      cue: '予定の話のあと、最後の三語。',
      line: 'it looks like your wife is skipping the… *Care to explain?*',
      said: '「奥さんはあの催しに出ないようですね。説明していただけますか」と聞く。',
      mean: 'Care to ～? は形はていねいでも、記者が言うと「説明してもらおうか」という追及。',
      trap: 'Care to を親切な誘いと取りやすいが、問いつめる言い方にもなる。',
      use: 'Care to tell me what happened here?（何があったか説明してくれる？）' },

    // why: June's pie lost ← "June Hartwell's buttermilk meringue" is named just before; bad bakers ← "loser" heard
    //   as the other wives' baking
    { id: 'h2', skill: 'humor', level: 'C1', point: 'loser', seg: [104.2, 111.3],
      stem: 'Why is the line about the last contest’s loser a joke?',
      choices: ['It treats the contest itself as a loss for women',
                'It mocks June’s pie as the one that came last',
                'It says the other wives were all bad at baking'], a: 0,
      cue: '「winner」のあと、「loser」の文の最後。',
      line: 'The last contest’s winner was June Hartwell’s… *Last contest’s loser was all women.*',
      said: '「前回の優勝はジューンのパイ。前回の敗者は、女性全体」と言う。',
      mean: '妻にパイを競わせる行事そのものが、女性にとっての負け、という皮肉。',
      trap: 'June の名前の直後なので彼女のパイの話と取りやすい。loser は all women。',
      use: 'Honestly, nobody wins here.（正直、これじゃ誰も得しない）' },

    // why: fifteen/fifty ← -teen/-ty; one fifteen ← "one fifty" heard as "one fifteen"
    { id: 'n1', skill: 'number', level: 'B1', point: 'million', seg: [117.95, 126.45], keep: true,
      stem: 'How much is Ben’s revitalization project, as Leslie puts it?',
      choices: ['$15 million', '$50 million', '$115 million', '$150 million'], a: 3,
      cue: '「Like Ben’s」のすぐあとの数。',
      line: 'We’re just focusing on bigger issues. Like Ben’s *$150 million* revitalization project.',
      said: '「大きな問題に集中してる。ベンの1億5千万ドルの事業とか」と話をそらす。',
      mean: 'one fifty million ＝ 150。記者の目をパイからそらしたい。',
      trap: '-ty は前が強く、-teen は後ろが強い。語尾の強さで分ける。',
      use: 'It’s a fifty-dollar ticket, not fifteen.（15ドルじゃなくて50ドルの切符）' },

    // R fix: V2 (blind 50 %: "Don't you ever" is hard to say before "cook" without the t, so it was easy to rule out).
    //   "Do you even" (ever/even, one sound apart, and natural from a hostile reporter) replaces it.
    // why: did ← "do" weakened to "d'" sounds like a past "did"; even ← ever and even differ only in the last sound,
    //   and the accusing tone fits "even"
    { id: 's1', skill: 'sound', level: 'B2', point: 'cook', seg: [129.6, 135.15],
      stem: 'Fill the gap: “___ cook for your children?”',
      choices: ['Do you ever', 'Did you ever', 'Do you even'], a: 0,
      cue: '「homemaking」の文のあと、問いの頭の三語。',
      line: '*Do you ever* cook for your children?',
      said: '「子どもに料理をしたことはあるのか」と記者が聞く。',
      mean: 'Do you が弱まり「ジュ」に近い。ever と続けて「ジュエヴァ」。',
      trap: '縮んだ Do you は did に、ever は even にも聞こえる。語尾が「ヴァ」か「ヴン」かを聞く。',
      use: 'Do you ever eat breakfast?（朝ごはん食べることある？）' },

    // R fix: V2 (blind 55 %). Both distractors now turn on the same "right here", so the place word alone doesn't pick
    //   the key.
    // why: kids nearby ← "right here in front of you" heard as about the kids; can't say ← "What are you talking
    //   about?" heard as dodging
    { id: 'h3', skill: 'humor', level: 'B2', point: 'standing', seg: [134.65, 141.55],
      stem: 'Why does Leslie’s answer to the childcare question get a laugh?',
      choices: ['He asks where she is while she stands in front of him',
                'He asks who watches her kids while they stand nearby',
                'She can’t say who is watching her kids right now'], a: 0,
      cue: '記者の問いの最後と、彼女の答えの場所の語。',
      line: 'while you’re *out*… knows where? — *I’m standing right here in front of you.*',
      said: '「どこかに出歩いている間、子どもは誰が見てる？」に「目の前にいますけど」と返す。',
      mean: '決めつけた質問が、本人を目の前にして成り立っていない。',
      trap: '誰が子どもを見ているかの答えと取りやすい。彼女が言っているのは自分の居場所。',
      use: 'I’m right here, you know.（ここにいるんだけど）' },

    // R fix: V2 (blind 70 %: "power and money" was a filler). "Looks down on wives like June" (the host's claim just
    //   before, moved onto June's lines) replaces it.
    // why: looks down on June ← the host's "women who love their families are stupid" just before; equal ← "we all make
    //   certain choices" heard as fair
    { id: 'i3', skill: 'infer', level: 'C1', point: 'haveitall', seg: [171.8, 178.75],
      stem: 'What is June suggesting about Leslie with her two “chose” sentences?',
      choices: ['Leslie’s family comes second for her', 'Leslie looks down on wives like June',
                'Both of their choices are equally fine'], a: 0,
      cue: '二つの「chose」を並べると、何が対になるか。',
      line: 'Ms. Knope *chose to try to have it all*. *I chose to put my family first.*',
      said: '「人それぞれ。ノープさんは全部を取ろうとし、私は家族を第一にした」と言う。',
      mean: '自分は家族が一番、と並べることで、相手は家族が後回しだとほのめかす。',
      trap: 'we all make choices は公平に聞こえるが、前置き。後ろの対比に本音がある。',
      use: 'I chose to put my health first.（健康を一番にすることにした）' },

    // R fix: V2 (blind 55 %: "slip in an extreme claim" was the only knowing choice). "Lets June disagree" (the hedge
    //   taken as real 遠慮) replaces "wants some facts". N1/C8: the line is trimmed.
    // why: lets her disagree ← "just speculating" taken at face value as modesty; softens ← "Oh, I'm just…" heard as a
    //   step back after June's calm answer
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'speculating', reveals: ['haveitall'], seg: [178.7, 184.5],
      stem: 'What does the host’s opening, before his question about Leslie’s family, do?',
      choices: ['Covers himself so he can push a harsher claim', 'Lets June disagree, since he is only guessing',
                'Softens his view after June’s calm answer'], a: 0,
      cue: '「but」の前のひと言と、そのあとの問いの重さ。',
      line: '*I’m just speculating here, but* do you think… she actually *hates her family*?',
      said: '「推測だけど、ノープの行動は家族が嫌いだという意味では？」と聞く。',
      mean: '「推測にすぎないが」と前置きして、言い切れない極端な話を流している。',
      trap: '前置きを本当の控えめさと取りやすい。but のあとの中身の重さで判断する。',
      use: 'I’m just saying, it’s a little late.（言ってみただけ、ちょっと遅いよね）' },

    // why: thirteen ← "three" plus the stressed "hours" heard as -teen; three days ← "took" heard with a long wait
    { id: 'n2', skill: 'number', level: 'B1', point: 'hours', seg: [184.7, 190.05], keep: true,
      stem: 'How long did it take for the adviser’s warning to come true?',
      choices: ['Two hours', 'Three hours', 'Thirteen hours', 'Three days'], a: 1,
      cue: '「it only took」のあと。',
      line: 'it only took *three hours* for Jen to be right.',
      said: '「ジェンの言った通りになるのに3時間しかかからなかった」と言う。',
      mean: '心配されていた「話題の的」に、あっという間になった。',
      trap: 'three と hours がつながると -teen に聞こえやすい。teen なら「ティーン」が長く強い。',
      use: 'It only took ten minutes.（10分しかかからなかった）' },

    // R fix: V2 (blind 55 %: "show how silly the tradition is" contradicts entering it). "To win, so she can promote
    //   her cookbook" (said, but after "Besides") is the near miss now.
    // why: cookbook ← "So I'll win, and then I can promote my… cookbook" is said, as an extra; prove them wrong ← the
    //   host's "hates her family" just before
    { id: 'g2', skill: 'gist', level: 'B2', point: 'enter', reveals: ['hours'], seg: [184.7, 208.5],
      stem: 'What is Leslie’s main reason for entering the pie contest after all?',
      choices: ['To stop the story from crowding out Ben’s plan',
                'To prove the host wrong about how she sees family',
                'To win, so she can promote her cookbook'], a: 0,
      cue: 'ベンの反対のあと、「But the more」で始まる文。',
      said: 'ベンは「すぐ収まる」と言うが、彼女は「騒ぎが続くほど経済政策が話題にならない」と出場を決める。',
      mean: '目的は選挙のため。パイの腕前や本の宣伝は Besides のあとのおまけ。',
      trap: '番組の「家族嫌い」発言への反論と取りやすいが、彼女が言う理由は選挙の話。',
      use: 'It’s not worth the distraction.（気が散るだけで、やる価値がない）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'less', seg: [195.6, 199.3],
      stem: 'Type it: “The more they talk about this, ___ talk about your plan.” (5 words)',
      answer: "the less they're going to",
      cue: '「the more」と対になる部分。後半は速く弱い。',
      line: 'the more they talk about this, *the less they’re going to* talk about your economic plan.',
      said: '「この話が続くほど、政策の話は減る」と言う。後半が速い。',
      mean: 'the more A, the less B ＝ A が増えるほど B は減る。',
      trap: 'they’re が弱く消えたように聞こえやすい。going to の前の主語を待つ。',
      use: 'The more you practice, the less you worry.（練習するほど不安は減る）' },

    // R fix: V2 (blind 55 %). "Her real reason, after the official one" (main vs extra flipped) replaces "a whole new
    //   topic".
    // why: an objection ← "Besides" heard as "but"; the real reason ← the pies sound more like her than the economic
    //   plan, so Besides is heard as "the truth is"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'besides', reveals: ['enter'], seg: [198.9, 202.6],
      stem: 'What does the word that opens “I’m good at making pies” signal?',
      choices: ['One more reason on top of the first', 'A point against what she just said',
                'Her real reason, after the official one'], a: 0,
      cue: '経済政策の話のすぐあと、最初の一語。',
      line: '*Besides*, I’m good at making pies. So I’ll win…',
      said: '「それに、パイ作りは得意。だから勝てる」と続ける。',
      mean: 'besides ＝ それに、おまけに。主な理由のあとに、もう一つの理由を足す。',
      trap: 'besides を but や本音の合図と取りやすい。文頭なら「それに」で、理由の追加。',
      use: 'Besides, it’s on the way.（それに、通り道だし）' },

    // why: still awake ← "meltdowns for no reason" heard as the end; one outside ← "briefly got outside" heard as still
    //   out
    // R fix: S1: the stem named Ben, and no name or address settles who reads the list. It names the moment only.
    { id: 'd3', skill: 'detail', level: 'B1', point: 'kids', seg: [210.2, 222.85],
      stem: 'At the end of the long list about the kids, how are they now?',
      choices: ['They are all asleep at last', 'They are all still awake', 'One of them is still outside'], a: 0,
      cue: 'リストの最後、「They’re all」のあと。',
      line: 'Somehow, kids back in bed. *They’re all napping.*',
      said: '軽食、寝かしつけ、三人同時のかんしゃく、一人が外へ、と並べ、最後に「全員寝た」と言う。',
      mean: '大変だったが、なんとか全員寝かせた。',
      trap: '途中の大騒ぎが印象に残るが、答えはリストの最後。briefly は「少しの間だけ」。',
      use: 'Somehow, we made it on time.（なんとか間に合った）' },

    // anchor: 228.8–230.8 s "one for directly into mouth": both sources have no "my"/"your" before "mouth", at 182 wpm
    //   in a list that runs on from “One for baking”
    { id: 'c1', skill: 'dict', level: 'C2', point: 'mouth', seg: [225.4, 231.05],
      stem: 'Type the end: “One for baking, ___.” (5 words)', answer: 'one for directly into mouth',
      cue: '「One for baking」と同じ形のくり返し。文法より音を。',
      line: 'One for baking, *one for directly into mouth*.',
      said: '「一つはお菓子作り用、もう一つは口に直接用」と言う。mouth の前に my も your もない。',
      mean: '冠詞や所有格を省いた、ふざけた言い方。メモの見出しのような短い形で、わざと言っている。',
      trap: '習った文法に合わせて into my mouth と足したくなる。書き取りは聞こえた音だけ。',
      use: 'One for now, one for later.（一つは今、一つはあとで）' },

    // why: worried ← a visitor from a women's group arriving after the press trouble; back Ben ← a women's group at a
    //   candidate's home heard as an endorsement visit
    { id: 'a1', skill: 'attitude', level: 'B1', point: 'award', seg: [244.5, 250.55],
      stem: 'How does Leslie react when Elise arrives?',
      choices: ['Hopeful that she has come with an award', 'Worried that she has come to protest',
                'Glad that she has come to back Ben'], a: 0,
      cue: '「are you here to」のあとと、次の文。',
      line: 'are you here to *give me the Woman of the Year Award*? *I have a speech prepared.*',
      said: '「年間最優秀女性の賞をくれに来たの？スピーチも用意してある」と言い、すぐ見せようとする。',
      mean: '勝手に期待して、はしゃいでいる。返事は短い No。',
      trap: '女性団体と聞いて抗議を連想しやすいが、彼女の言葉は期待そのもの。',
      use: 'I have a speech prepared, just in case.（念のため、あいさつを用意してある）' },

    // R fix: V2 (blind 70 %: "a fair old tradition" contradicts "I agree"). "Dumb, but she wants the win" (her own "So
    //   I'll win" earlier) replaces it, so two choices share "dumb but".
    // why: wants the win ← "I'm good at making pies. So I'll win" earlier; the protest is dumb ← "it's dumb" heard
    //   about Elise's group
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'dumb', seg: [257.0, 264.25],
      stem: 'What is Leslie’s own view of the pie contest?',
      choices: ['She agrees it is dumb but will do it for Ben', 'She thinks it is dumb but wants the win',
                'She thinks the protest is the dumb part'], a: 0,
      cue: '「I agree」のあとと、「but」のあと。',
      line: 'I *agree that it’s dumb*, but *this is not about me*. It’s about Ben.',
      said: '「くだらないのは同感。でも私の問題じゃなくて、ベンのため」と言う。',
      mean: '本心は反対のまま、選挙のために出る。I agree で相手を認めてから but で理由。',
      trap: '勝ちたいから出る、と取りやすい。but のあとの not about me が理由。',
      use: 'I agree it’s silly, but let’s do it.（ばかげてるのは同感、でもやろう）' },

    // R fix: V2 + S1 (blind 70 %: "a contest she doesn't believe in" in the stem pointed at "give up"; it also states
    //   a2's key). The stem names the moment only; "win the small fight first" (lose/win order flipped) replaces "try
    //   again next time".
    // why: fight every battle ← both "battle" and "war" heard as fighting harder; win it first ← "lose" and "win" heard
    //   in the wrong order
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'battle', reveals: ['dumb'], seg: [261.6, 267.65],
      stem: 'What does the short saying Leslie ends her answer with mean here?',
      choices: ['Give up a small fight to win the big one', 'Fight every small fight to win the big one',
                'Win the small fight first, then the big one'], a: 0,
      cue: '「he will do more for women」のあと、対になる四語。',
      line: 'So, you know, *lose a battle, win the war*, that kind of thing.',
      said: '「小さな戦いに負けて、大きな戦争に勝つ、ってこと」と言う。',
      mean: '目先の主張は捨てて、大きな目的（ベンの当選）を取る、という考え。',
      trap: 'battle と war から「全部戦う」と取りやすい。lose と win の対比を聞く。',
      use: 'Lose the battle, win the war.（小さく負けて、大きく勝つ）' },

    // R fix: V2 (blind 50 %: "boast that their pie will win" fits no line). "Her threat of a protest is taken back"
    //   (right move, wrong scope: only the pies are taken back) replaces it.
    // why: the protest taken back ← "Metaphorically" heard as cancelling the whole warning; turned into a threat ← the
    //   order reversed
    { id: 'h4', skill: 'humor', level: 'C1', point: 'civil', seg: [270.6, 281.25],
      stem: 'Why is Elise’s warning about the protest funny?',
      choices: ['Her threat of pies in the face is taken back at once',
                'Her threat of a protest is taken back at once',
                'Her joke about liking pies turns into a real threat'], a: 0,
      cue: '「Hope you like pies」のあと、二つの短い言葉。',
      line: 'Hope you like pies. *In your face.* … *Metaphorically, we’ll be civil.*',
      said: '「パイはお好き？顔面に」と言ってから、「比喩よ、礼儀は守る」と付け足す。',
      mean: 'パイを顔に投げる、とおどしてすぐ取り消す。強気と弱気の落差が笑い。',
      trap: 'Metaphorically で全部取り消したと取りやすいが、消したのはパイだけ。抗議はそのまま。',
      use: 'Metaphorically speaking, of course.（もちろん、たとえだけど）' },

    // anchor: 285.9 s "my husband Ben is a progressive champion of women's rights", then 291.2 s "Chop, chop": the
    //   order to hurry up and bake follows the praise at once; 296 s "Hi. Ben Wyatt." he greets Elise only after
    // R fix: V2 (blind 50 %: "sound hollow" was the only knowing choice). Key and near miss are now a direct flip
    //   (undercuts / backs up what she said).
    // why: backs it up ← "Chop, chop" heard as cheering her on (sincerity flip); mocks Elise ← the pie talk heard as
    //   aimed at her protest
    { id: 'c2', skill: 'infer', level: 'C2', point: 'chopchop', seg: [285.4, 297.0],
      stem: 'Right after Leslie praises Ben to Elise, what does his “Chop, chop” do?',
      choices: ['It undercuts what she just said about him', 'It backs up what she just said about him',
                'It mocks what Elise just said about the contest'], a: 0,
      cue: 'ほめ言葉の直後に入る声と、そのあいさつの順番。',
      line: 'my husband Ben is a *progressive champion of women’s rights*. — …the oven’s ready. *Chop, chop.*',
      said: '「夫は女性の権利の旗手」と言った直後、ベンが入って来て「オーブンできたよ、ほら急いで」と言う。',
      mean: 'Chop, chop ＝「さっさと」と急かす言い方。紹介の直後なので、ほめ言葉が台無しになる。',
      trap: '明るい声なので応援に聞こえやすいが、急かす命令。あいさつが後なので、客には気づいていない。',
      use: 'Chop, chop! We’re going to be late.（急いで！遅れるよ）' },
  ]
};
