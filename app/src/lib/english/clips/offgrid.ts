// REVIEW 2026-11-16: pass 2, fix 22, drop 0, new 0; ear checks 2
// Q: c2 hangs on whisper's “now” against the captions' “know” (207 s). Please confirm it on the phone.
// “Ron Swanson Goes off the Grid | Parks and Recreation” (the official Parks and Recreation channel, Season 6): a
// coupon flyer reaches Ron at Diane's address, so he sets out to erase himself (the mailman, his last card, the diner
// photo, Tom's Facebook album, an RV with no address), until Diane asks him to stay on “our grid”.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 297 s. Speakers are settled by “Paul”
// (104.5 s), “Tom” (139.3 s, 199.7 s) and “darling” / “husband” (262–272 s); the person who praises Donna (38–47 s)
// and the two coworkers at 75–103 s are not named in both sources, and no key rests on who they are. Untested:
// 75.9 s (“That's crazy talk” / “That's crazy, Tom”), 120–127 s (“get you into the parking garage”), 150–153 s
// (“’em” / “him”, “shell” / “show”), 159–169 s (JJ's photo, a visual gag), 171–179 s (who says “so bad at eating”),
// the Vine stretch (210–242 s, garbled), and the 25–30 s magazine joke (world knowledge).
// EAR CHECK: 207 s c2 — whisper “I do now, yes”, captions “I do know, yes”: is it “now”, and does the stress fall on
//   it? (ship only once confirmed; if it's “know”, drop c2)
// EAR CHECK: 127.7 s s1 / 260.3 s x1 / 281.2 s s2 — the reductions are there (an audible ’ll in “I’ll be paying”;
//   “get in touch with” run together; “on our” linked, “our” weak); both sources have these words
import type { Clip } from '../types.ts';

export const offGrid: Clip = {
  id: 'offgrid', video: 'GDDof2NHInA', title: 'Ron Swanson Goes off the Grid', dur: 308, wpm: 171, band: 'fast',
  tags: ['職場', '家'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 80 %): the key matched the name, and the other two weren't free mail. Now "free paper of local
    //   news" (circular ≈ circulation) and "store card that saves cents" (Saver + coupons). S4: the segment ended inside
    //   "was"; it now ends at 5.65 s
    // why: store card ← "Saver" taken literally (貯金) + "coupons"; local news ← "free circular" heard as a free paper
    //   in circulation
    { id: 'd1', skill: 'detail', level: 'B1', point: 'penny', seg: [0, 5.65],
      stem: 'What is the Penny Saver, according to the answer Ron gets?',
      choices: ['A free sheet of ads and coupons', 'A store card that saves a few cents', 'A free paper of local news'],
      a: 0,
      cue: '質問のすぐあとの返事、1文全体。',
      line: 'It’s a *free circular with a bunch of coupons* in it.',
      said: '「Penny Saver って何？」への答えは「クーポンが入った無料のチラシ」。',
      mean: 'circular ＝ 配られる広告チラシ。Ron が頼んだものではない。',
      trap: 'Saver を「貯金」、circular を「新聞」と取りやすい。すぐあとの説明を聞く。',
      use: 'Do you have any coupons?（クーポンありますか）' },

    // R fix: V2 (blind 70 %): only the key was about mail reaching him. All three are now about mail; two put
    //   "Diane's address" and "P.O. box" in the wrong relation
    // why: Diane's name ← "at Diane's address" heard as "for Diane"; junk in the P.O. box ← "a single P.O. box" is
    //   said, but as his family's habit
    { id: 'g1', skill: 'gist', level: 'B1', point: 'trigger', reveals: ['month', 'invasion'], seg: [0, 39.1],
      stem: 'What sets off Ron’s anger at the start of the clip?',
      choices: ['A flyer found him at an address he’d just moved to', 'A flyer meant for him came in Diane’s name',
                'His family’s P.O. box filled up with junk mail'], a: 0,
      cue: '最初の数行、どこに何が届いたか。',
      said: '自分宛ての広告が、住んで1か月もたたない妻の家に届き、それを侵害だと言う。',
      mean: 'ただのチラシでも、新しい住所を知られたことが大問題。これが計画の始まり。',
      trap: 'Diane’s address や P.O. box に引かれやすいが、宛名は Ron 本人。',
      use: 'How did you get my address?（どうして私の住所を知ってるの？）' },

    // why: a month ← "less than" lost, only "a month" stays; a few months ← "a few months ago" comes later (JJ);
    //   several years ← "several generations" is said soon after
    // R fix: S4: the segment began inside "coupons"; it now starts at 5.65 s
    { id: 'n2', skill: 'number', level: 'B1', point: 'month', seg: [5.65, 13.0], keep: true,
      stem: 'How long has Ron lived at Diane’s address?',
      choices: ['Less than a week', 'Less than a month', 'A few months', 'Several years'], a: 1,
      cue: '「Diane’s address」のあと、期間の言い方。',
      line: 'where I’ve lived for *less than a month*',
      said: '妻の住所に住んで「1か月もたっていない」と言う。',
      mean: 'less than a month ＝ 1か月未満。住み始めたばかりなのに、という驚き。',
      trap: 'less than を聞き逃すと「1か月」だけが残る。week と month は語尾まで聞く。',
      use: 'I’ve lived here for less than a year.（ここに住んで1年たたない）' },

    // R fix: V2 (blind 75 %): "worried" and "curious" were mild fillers. Now a puzzled-and-amused reading of "How is
    //   that possible?" and a "sent to the wrong person" reading. S4: the segment began inside "coupons"; now 5.65 s
    // why: amused ← "How is that possible?" read as wonder; went to Diane ← "Diane's address" heard as the addressee
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'invasion', seg: [5.65, 15.8],
      stem: 'How does Ron react to getting the flyer?',
      choices: ['Outraged that his new address was already known', 'Puzzled, and a little amused, that he got mail',
                'Annoyed that his mail went to Diane instead'], a: 0,
      cue: '「How is that possible?」のあとの一文。',
      line: 'How is that possible? This is an *extreme invasion of privacy*.',
      said: '「どうしてそんなことが？ひどいプライバシーの侵害だ」と言う。',
      mean: 'ただの広告に extreme（極度の）まで付けて怒る。新しい住所を知られたのが許せない。',
      trap: '最初の質問だけだと「誰が送ったか知りたい」に見えるが、続く一文で怒りがはっきりする。',
      use: 'That’s a total invasion of privacy.（それは完全にプライバシーの侵害だよ）' },

    // R fix: V2 (blind 55 %): "for oven mitts" made the key the only odd, specific one. All three now say who undid
    //   Donna's work
    // why: Donna signed them up ← "She got me… mailing list" with "off" lost; kept writing ← "signed back up" missed,
    //   so the list seems to win
    { id: 'h1', skill: 'humor', level: 'C1', point: 'mitts', seg: [38.5, 47.2],
      stem: 'Why is the story meant to praise Donna funny?',
      choices: ['The speaker signed back up, undoing Donna’s help', 'Donna signed the speaker up, not off, by mistake',
                'The store kept on mailing, despite Donna’s help'], a: 0,
      cue: 'but のあと、話し手が自分でしたこと。',
      line: 'She *got me off* the… mailing list, but then I just *signed back up* again.',
      said: 'Donna のおかげでカタログの送付を止めたが、そのあと自分でまた登録した、と言う。',
      mean: 'ほめる例なのに、本人がすぐ元に戻している。理由はミトン。',
      trap: 'Donna が登録したと取ると笑いが消える。but のあとは話し手の行動。',
      use: 'I’m hooked on this show.（この番組にハマってる）' },

    // why: support until work ← "help me" heard as the turn where they back out; pay raise ← a boss's offer is
    //   usually money, and "early" is the last word, easily lost
    { id: 'g2', skill: 'gist', level: 'B2', point: 'early', seg: [70.0, 104.3],
      stem: 'When Ron shares his plan with two coworkers, how does it go?',
      choices: ['They object until he offers to let them leave early',
                'They support it until they hear how much work it is',
                'They laugh at it until he offers them a pay raise'], a: 0,
      cue: '計画への反対と、Ron の条件のあと。',
      said: '二人は反対して連呼するが、「手伝えば早く帰す」と言われると「グリッド反対！」に変わる。',
      mean: '早く帰れると聞いたとたん意見を変える。上司の取引で反対が消える。',
      trap: '給料の話は出ていない。go home early ＝ 早く帰る。条件は最後の語まで聞く。',
      use: 'If you help me, I’ll buy lunch.（手伝ってくれたらお昼おごるよ）' },

    // why: special meals ← the question names "the dope food", as if some meals earn a photo; cook at home ← "food" +
    //   "restaurants" heard as a view on eating out
    // R fix: V2 (blind 65 %): "cook at home" answered a different question. It's replaced by "taking is fine, just
    //   not posting", the half-agreement reading. S4: the segment began inside "jump-off"; it now starts at 80.6 s
    // why: special meals ← the question names "the dope food", as if some meals earn a photo; photos fine ← "post"
    //   is the word in the question, so the refusal seems to stop there
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'eating', seg: [80.6, 90.0],
      stem: 'When asked about posting food photos, what is Ron’s stance?',
      choices: ['Meals and places are to live in, not to post', 'Only really special meals are worth a photo',
                'Taking photos is fine, just not posting them'], a: 0,
      cue: '写真の質問への、Ron の短い3つの文。',
      line: '*Food is for eating. Places are for being.* End of discussion.',
      said: '「食べ物は食べるため。場所はいるため。話は終わり」と答える。',
      mean: '写真を撮って載せること自体に意味を認めていない。その場で楽しむもの、という考え。',
      trap: '特別な料理なら、と条件を足したくなるが、Ron は例外を作っていない。短い断言は全否定。',
      use: 'Vacations are for relaxing.（休みはのんびりするためのもの）' },

    // R fix: V2 (blind 50 %): "half joking" and "accept anything" were weak. Now "only guessing" (if = もし) and "any
    //   small step would do" (anything = 何でも). S4: the segment began inside "discussion"; it now starts at 90.0 s
    // why: guessing ← "if" read as a hedge (もしあれば); any step ← "anything" taken literally (何でも)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'ifanything', seg: [90.0, 94.3],
      stem: 'When Ron is told to get more on the grid, what does the opening add?',
      choices: ['That he needs the reverse of his plan', 'That the speaker is only guessing why',
                'That any small step online would do'], a: 0,
      cue: '「the grid is the best」のあと、文頭の2語。',
      line: '*If anything*, you need to get more on the grid.',
      said: '「グリッドを出るな」のあと、「むしろもっとつながるべき」と言う。',
      mean: 'if anything ＝「むしろ」。相手の考えと逆こそ正しい、と言う前置き。',
      trap: 'anything を「何でも」、if を「もし」と取ると弱い言い方に聞こえる。逆を言う合図。',
      use: 'If anything, it’s better than before.（むしろ前より良くなった）' },

    // R fix: V2 (blind 60 %): the distractors weren't about Ron's answer. Now a sincerity flip (grand words as
    //   agreement) and the wrong direction ("harsh" heard as Paul hitting back)
    // why: agrees grandly ← "Passing the buck" heard as Ron approving Paul's rule; Paul hits back ← "That seems harsh"
    //   heard as an insult in return
    { id: 'h2', skill: 'humor', level: 'C1', point: 'harsh', reveals: ['buck'], seg: [104.0, 118.7],
      stem: 'Why does the audience laugh at Ron’s answer to Paul?',
      choices: ['Ron meets a fair point with grand moral insults', 'Ron agrees with Paul, but in absurdly grand words',
                'Paul answers Ron’s insult with a harsher one'], a: 0,
      cue: 'Paul のふつうの返事と、Ron の言葉の重さ。',
      line: 'The *last refuge of the cowardly and black-hearted*. — *That seems harsh.*',
      said: '「配るだけ」と言う Paul を Ron は「弱虫で腹黒い」と責め、Paul は「きつい」と返す。',
      mean: '当然の返事に、悪人向けの大げさな言葉をぶつける落差が笑い。',
      trap: 'harsh を言い返しと取りやすいが、Paul は静かに言うだけ。強さを比べる。',
      use: 'Wow, that seems a little harsh.（うわ、それはちょっときつくない？）' },

    // why: taking money ← buck = dollar (literal); running from a fight ← "cowardly" comes right after
    // R fix: S4: the segment began inside "bury it"; it now starts at 110.15 s
    { id: 'f2', skill: 'phrase', level: 'C1', point: 'buck', seg: [110.15, 117.5],
      stem: 'What does Ron accuse Paul of with his first reply?',
      choices: ['Pushing the blame onto someone else', 'Taking money for not doing his job',
                'Running away from a fight with him'], a: 0,
      cue: 'Paul の返事のすぐあと、Ron の最初の3語。',
      line: '*Passing the buck.* The last refuge of the cowardly…',
      said: '「配るだけ」と言う Paul に、「責任逃れだ。弱虫の逃げ場だ」と返す。',
      mean: 'pass the buck ＝ 責任を他人に回す。相手を責める決まった言い方。',
      trap: 'buck は「ドル」でもあり、お金の話に聞こえやすい。pass と組めば責任の話。',
      use: 'Don’t pass the buck to me.（こっちに責任を押しつけないで）' },

    // why: I'd be ← 'll and 'd both shrink to a soft sound; I've been ← "be" heard as "been" before -ing;
    //   I'm ← the weak "be" dropped entirely
    // R fix: S4: the segment began inside "parking garage"; it now starts at 127.95 s
    { id: 's1', skill: 'sound', level: 'B2', point: 'cash', seg: [127.95, 131.2],
      stem: 'Fill the gap: “And ___ paying in cash.”',
      choices: ['I’ll be', 'I’d be', 'I’ve been', 'I’m'], a: 0,
      cue: '「and」のすぐあと、弱く短い2語。',
      line: '*I’ll be* taking the bus now, and *I’ll be* paying in cash.',
      said: '「これからはバスで、現金で払う」と言う。I’ll be が2回。',
      mean: 'I’ll be ～ing は「これからはそうする」。’ll は弱く「アイルビ」に近い。',
      trap: '’ll が弱いと I’d や I’m に聞こえやすい。前半の同じ形をヒントに後半を聞く。',
      use: 'I’ll be working from home tomorrow.（明日は在宅で働きます）' },

    // why: 15 ← fifty/fifteen, the stress swap; 20 ← "20 minutes" follows at once; 50 ← "-one" lost after "fifty"
    // R fix: S4: the segment began inside "ordered"; it now starts at 146.75 s
    { id: 'n1', skill: 'number', level: 'B1', point: 'eggs', seg: [146.75, 150.8], keep: true,
      stem: 'How many eggs did Ron eat at the diner?',
      choices: ['15', '20', '50', '51'], a: 3,
      cue: '「I believe」のあと、eggs の前の数。',
      line: '…*51 eggs* in 20 minutes.',
      said: '「20分で卵を51個」食べた、とダイナーの記録を話す。',
      mean: 'fifty-one ＝ 51。20分という短さと合わせて、店の記録になったほどの量。',
      trap: 'fifty は前、fifteen は後ろが強い。最後の one も落とさない。20 は時間の数。',
      use: 'I ate two plates in ten minutes.（10分で2皿食べた）' },

    // R fix: V2 (blind 60 %): the key was the only choice about photos. All three are now "He saw it in/at…"; one is
    //   the diner photo. S4: the segment began inside "missing"; it now starts at 190.15 s
    // why: the diner photo ← JJ's diner photo is the last photo talked about; at the office ← "all day" heard as Ron
    //   being seen around all day
    { id: 'i3', skill: 'infer', level: 'B2', point: 'album', seg: [190.15, 199.6],
      stem: 'How has Jean-Ralphio come to love Ron’s shirt?',
      choices: ['He saw it in Tom’s online photos of Ron', 'He saw it in the old photo at JJ’s diner',
                'He saw Ron wearing it at the office today'], a: 0,
      cue: '「What the hell」のあとの説明。',
      line: 'I’ve been *taking pictures of you all day* for my new *Facebook album*',
      said: '「一日中あなたの写真を撮って Facebook に載せてた」と Tom が言う。',
      mean: 'シャツはネットの写真で見られた。消したはずの写真が逆に広まっている。',
      trap: 'ダイナーの写真と考えやすい。all day と album でネット経由と分かる。',
      use: 'I saw your photos online.（ネットで写真見たよ）' },

    // anchor: 194.3–209.4 s Tom's album of photos "all day" is called "Getting Off the Grid", the opposite of Ron's
    //   goal; Tom answers "I do now, yes. Sorry.": an apology, so the "maybe" question was a reproach, not a hedge
    //   or a request for feedback
    // R fix: V2 (blind 70 %): the "improve the album" reading was weak. It's replaced by "you did it to mock me" (the
    //   right reproach, the wrong intent; Tom's "Great news" and "Sorry" refute it)
    // why: small issue ← "maybe" read as real caution (かもしれない); on purpose ← the album title "Getting Off the
    //   Grid" heard as Tom teasing him
    { id: 'c1', skill: 'pragma', level: 'C2', point: 'problem', reveals: ['album', 'donow'], seg: [194.2, 209.2],
      stem: 'Which plain-English version keeps what Ron means by his question to Tom?',
      choices: ['“Surely you see that this wrecks my plan.”', '“You did this on purpose to mock me, right?”',
                '“There may be a small issue; what do you think?”'], a: 0,
      cue: '問いの言い方と、Tom の返事の中身。',
      line: 'Tom, do you *maybe* see a problem with what you’ve done? — *I do now, yes. Sorry.*',
      said: '写真の話のあと「問題があると思わないか」と聞かれ、Tom は「今は分かる。ごめん」と返す。',
      mean: 'maybe は遠慮でなく、分かりきったことを本人に言わせる問い。謝罪が返るのは、叱られたと伝わった証拠。',
      trap: 'maybe を「かもしれない」と取ると小さな指摘に聞こえる。謝罪が返れば問いは非難。',
      use: 'Do you maybe want to rethink that?（それ、考え直したほうがよくない？）' },

    // anchor: 199.7–209.2 s "do you maybe see a problem" → "I do now, yes. Sorry.": "now" sets his view after Ron's
    //   question against his view before it ("Great news, Ron", 190.2 s), and "Sorry" confirms he hadn't seen it
    // R fix: V2 (blind 50 %): "it was clear to him" clashed with "Sorry", so the key was the only one that fit. Now
    //   "do" = an outright admission (verum focus) and "yes" = quick agreement to calm Ron. N1: the captions have "I do
    //   know, yes"; on the ear-check list with both versions
    // why: on "do" ← the emphatic "I DO" of an admission learners know from “Do you…? — I do!”; on "yes" ← a short
    //   yes after a question heard as appeasing agreement (the polite はい frame)
    { id: 'c2', skill: 'sound', level: 'C2', point: 'donow', reveals: ['problem'], seg: [199.4, 209.6], retired: true,
      stem: 'In Tom’s “I do now, yes”, where is the stress, and why?',
      choices: ['On “now”: he didn’t see it until just now', 'On “do”: he admits outright there’s a problem',
                'On “yes”: he agrees fast to calm Ron down'], a: 0,
      cue: '短い返事で、いちばん強く長く聞こえる語。',
      line: 'I do *now*, yes. Sorry.',
      said: '「問題が分かるか」と聞かれ、Tom は「今は分かる、うん。ごめん」と答える。',
      mean: 'now が強いと「さっきまでは分からなかった」という対比になる。言われて初めて気づいた、という告白。',
      trap: 'do を強めると「もちろん分かってた」になり、謝る流れと合わない。強勢は、何と比べているかを示す。',
      use: 'I get it now. Sorry.（今やっと分かった、ごめん）' },

    // R fix: V2 (blind 65 %): the key was the only quirky choice. "None, since he pays in gold" (gold is said just
    //   before) replaces the P.O. box. S4: the segment began inside "vehicle"; it now starts at 248.35 s
    // why: Diane's house ← "Diane's address" from the start of the clip; none ← "a certain amount of gold" heard as
    //   his way around the paperwork
    { id: 'd5', skill: 'detail', level: 'B2', point: 'parked', seg: [248.35, 256.2],
      stem: 'When the dealer asks for an address, what does Ron give?',
      choices: ['Wherever the RV is parked at the time', 'None at all, since he’s paying in gold',
                'Diane’s house, until he finds a spot'], a: 0,
      cue: '「insurance」のあと、Ron の2つの文。',
      line: 'This will be my new home. The address is *wherever it is parked*.',
      said: '保険のために住所が要ると言われ、「これが新しい家だ。住所は止めた場所だ」と答える。',
      mean: 'RV そのものを家にするので、決まった住所は持たない。住所を渡さずにすませている。',
      trap: '直前の gold や妻の家に引かれやすいが、ここでは RV の場所が住所。',
      use: 'I’ll call you wherever I end up.（どこに着いても電話するね）' },

    // why: phone battery ← "trying to get in touch… for hours" points at phones; locked out ← the usual "where
    //   have you been?" emergency at home
    { id: 'd6', skill: 'detail', level: 'B1', point: 'tire', seg: [256.3, 262.1],
      stem: 'What problem did Diane have while Ron was away?',
      choices: ['Her car got a flat tire', 'Her phone ran out of battery', 'She was locked out of the house'], a: 0,
      cue: '「Where have you been?」のすぐあと。',
      line: 'Where have you been? I had a *flat tire*…',
      said: '「どこにいたの？タイヤがパンクしたのよ」と Diane が言う。',
      mean: 'flat tire ＝ パンク。困ったときに連絡がつかなかったことを責めている。',
      trap: 'flat を「平ら」と取ると意味がつかめない。連絡がつかなかったのは Ron の方。',
      use: 'Our rental car got a flat tire.（レンタカーがパンクした）' },

    // R fix: V2 (blind 75 %): the key was the only compromise. Now a second compromise with a condition she never
    //   sets (a daily call) and a full "back on the grid"
    // why: fully back ← she scolds him, and "husband and a father" sounds like "come back"; daily call ← "get in touch
    //   with you for hours" heard as the rule she wants
    { id: 'g3', skill: 'gist', level: 'B2', point: 'ourgrid', reveals: ['value'], seg: [256.3, 297.4],
      stem: 'By the end, what does Diane ask of Ron?',
      choices: ['Stay off the grid, but within reach of family', 'Come back on the grid fully, for the children',
                'Stay off the grid, but phone home every day'], a: 0,
      cue: '最後の場面、Diane の but のあと。',
      line: 'you don’t have to be entirely on the grid, but you have to be *on our grid*.',
      said: '「完全につながってなくていい。でも私たちとはつながっていて」と言う。',
      mean: 'プライバシーは認めつつ、家族とは連絡がつくように、という線引き。',
      trap: '叱っているので「全部やめて」に聞こえやすいが、not entirely で半分は認めている。',
      use: 'Just keep your phone on for us.（私たちのために電源は入れておいて）' },

    // R fix: S4: the segment began inside "flat tire"; it now starts at 259.95 s
    { id: 'x1', skill: 'dict', level: 'B2', point: 'touch', seg: [259.95, 262.2],
      stem: 'Type what Diane says: “I’ve been trying to ___ you for hours.” (4 words)', answer: 'get in touch with',
      cue: '「trying to」のあと、つながる4語。',
      line: 'I’ve been trying to *get in touch with* you for hours.',
      said: '「何時間もあなたに連絡しようとしてた」と言う。',
      mean: 'get in touch with ＝ 連絡を取る。4語がつながり、一続きに聞こえる。',
      trap: 'in と with が弱く、get touch に聞こえやすい。小さな前置詞を2つとも書く。',
      use: 'I’ll get in touch with you next week.（来週連絡します）' },

    // R fix: V2 (blind 70 %): "forgot to charge his phone" was a filler. It's replaced by "shrugs off her flat tire"
    //   (the wrong target: a joke at her expense)
    // why: postal worker ← "postal worker" heard as the cause of the delay; shrugs off ← "Sorry, darling" said lightly
    //   right after her flat tire
    { id: 'h3', skill: 'humor', level: 'C1', point: 'effects', seg: [262.0, 268.5],
      stem: 'Why is Ron’s answer to “Where have you been?” funny?',
      choices: ['He lists alarming acts like ordinary chores', 'He shrugs off her flat tire as no big deal',
                'He blames a postal worker for the delay'], a: 0,
      cue: '「Sorry, darling」のあとの、忙しかった中身。',
      line: 'I’ve been busy *destroying most of my personal effects* and *threatening a postal worker*.',
      said: '「ごめん。持ち物をほとんど処分して、郵便配達を脅すので忙しかった」と答える。',
      mean: '物騒なことを、ふつうの用事のように並べる落差が笑い。',
      trap: 'postal worker を遅れの原因と取りやすいが、脅したのは Ron の方。',
      use: 'Sorry, I’ve been busy packing.（ごめん、荷造りで忙しくて）' },

    // R fix: V2 (blind 75 %): the distractors weren't the shape of an opening. Now the order flipped and full
    //   agreement plus a small favor. S4: the segment began inside "worker"; it now starts at 268.5 s
    // why: disagrees first ← "husband and a father" is the stronger, louder part; agrees ← "I know you value" read as
    //   full agreement (the Japanese そうだよね frame)
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'value', seg: [268.5, 276.7],
      stem: 'How does Diane open her complaint to Ron?',
      choices: ['She grants his view first, then disagrees', 'She disagrees first, then grants his view',
                'She agrees with him, then asks a small favor'], a: 0,
      cue: '名前を呼んだあと、but の前と後。',
      line: 'Ron, *I know you value your privacy, but* you are a husband and a father now.',
      said: '「プライバシーが大事なのは分かる。でも、もう夫で父親なのよ」と言う。',
      mean: 'I know ～, but は相手を認めてから本題に入る型。',
      trap: 'I know を同意と取ると、頼みが小さく聞こえる。認める→but→本音、の順を聞く。',
      use: 'I know you’re busy, but this is important.（忙しいのは分かるけど、大事な話なの）' },

    // why: on the ← "on the grid" is said earlier in the same sentence; on your ← "you have to be" primes "your"
    // R fix: S4: the segment began inside "off the grid"; it now starts at 278.65 s
    { id: 's2', skill: 'sound', level: 'B2', point: 'ourgrid', seg: [278.65, 282.1],
      stem: 'Fill the gap: “but you have to be ___ grid.”',
      choices: ['on our', 'on the', 'on your'], a: 0,
      cue: '「have to be」のあと、弱く短い2語。',
      line: 'but you have to be *on our* grid.',
      said: '「でも、私たちのグリッドには入っていて」と言う。',
      mean: 'on our は「オナー」のようにつながり、our は弱い。前半の on the grid と対比。',
      trap: '前半に on the grid があり、the と思いやすい。our なら「私たちの」。',
      use: 'You’re on our team now.（もう私たちのチームだよ）' },

    // anchor: 282.1–294.4 s "I suppose you wouldn't consider moving" is followed at once by a pitch ("I've heard the
    //   school system… is adequate"), and Diane answers it as his real habit ("your solution to every problem is to
    //   live inside a mountain")
    // why: stay put ← "wouldn't" read as Ron closing the topic himself (the Japanese 遠慮 frame); only joking ←
    //   tunnels under a mountain sound too odd to be meant
    // R fix: V2 (blind 50 %): reworded so all three are the same "stance + what he'll do" shape; the distractors
    //   keep their two misreadings
    { id: 'c3', skill: 'pragma', level: 'C2', point: 'mountain', seg: [281.9, 294.4],
      stem: 'Which plain-English version keeps what Ron means about moving?',
      choices: ['“I’d love us to move, though I expect a no.”', '“You’d never move, so I’ll drop the idea.”',
                '“I’m only joking; moving would be crazy.”'], a: 0,
      cue: '問いのあとに続ける話と、Diane の返事。',
      line: 'I *suppose you wouldn’t consider* moving. I’ve heard the school system… is adequate.',
      said: '「引っ越しは考えないだろうね」と言い、学校やトンネルの話を続ける。Diane は「何でも山で解決ね」。',
      mean: 'I suppose you wouldn’t ～ は、断られる前提で頼む型。説得が続くので本気。',
      trap: 'wouldn’t で話を引っこめたように聞こえるが、説得が続けば頼みごと。',
      use: 'I suppose you wouldn’t lend me your car?（車、貸してくれたりしないよね？）' },

    // R fix: V2 (blind 55 %): the key was the only one that read her words, not his. Now "sweet, but not for the
    //   kids" (school + "I love you, but") and "a joke she plays along with" ("I love you, too" follows)
    // why: not for the kids ← "school system" + "I love you, but" heard as a kind refusal on the children's behalf;
    //   plays along ← the tunnels sound absurd, and the scene ends warmly
    { id: 'i4', skill: 'infer', level: 'C1', point: 'mountain', seg: [281.9, 294.4],
      stem: 'What does Diane’s reply suggest about Ron’s moving idea?',
      choices: ['It’s his usual answer to every problem', 'It’s sweet, but not right for the kids',
                'It’s a joke she’s happy to play along with'], a: 0,
      cue: '「I love you, but」のあとの言い方。',
      line: 'I love you, but *your solution to every problem* is to live inside a mountain.',
      said: '「愛してる。でも、どんな問題も山の中に住んで解決しようとする」と言う。',
      mean: 'every problem で、今回が初めてではないと分かる。あきれつつ受け流している。',
      trap: '学校の話につられやすいが、but のあとは反対。every は「毎回」のしるし。',
      use: 'Your answer to everything is pizza.（何でもピザで解決するよね）' },
  ]
};
