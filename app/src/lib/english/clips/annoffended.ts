// REVIEW 2026-11-16: pass 6, fix 18, drop 0, new 0; ear checks 1
// OPEN: nt1 needs Leslie as the speaker of “You're stupid…”; whisper's “you're drunk” (said to the drunk Ann)
//   settles it, but the captions lack it
// “Ann gets offended | Parks and Recreation” (the official Parks and Recreation channel, Season 3): Leslie leaves a
// party to help Ann cram for an interview, finds Ann there with a date instead, and polite digs turn into a fight.
// Segments from the captions, words from whisper (2026-11-16). Left out on purpose: the "cramming" double meaning
// (7.4–10.3 s), the date's intro, radio show and pickup line (42–72 s, innuendo; so no number item: the only number is
// his station), the drunk stretch (135–150 s, speakers unclear), and the overlapping, garbled shouting at 168–183 s and
// 210–216 s. The captions have "with that" / whisper "with Beth" at 120.2 s and "if that's my job" / "I might lose my
// job" at 122.6 s; the lines trim both. At 206.7 s whisper has "Maybe we shouldn't", captions "maybe we should";
// g2's key holds on either reading.
// EAR CHECK: 166.3 s nt1 — who says “You're stupid” (assumed Leslie, in a later talking head; whisper adds “you're
//   drunk”, the captions don't)
import type { Clip } from '../types.ts';

export const annOffended: Clip = {
  id: 'annoffended', video: '9szxKFkGea0', title: 'Ann gets offended', dur: 236, wpm: 185, band: 'mid',
  tags: ['友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // why: had to ← the past form; its d and the f of have both fade before "to"; used to ← the "-sta/-sta" ending sounds
    //   alike; got to ← same meaning, so only the first sound decides
    { id: 's1', skill: 'sound', level: 'B2', point: 'haveto', seg: [0.0, 5.05],
      stem: 'Fill the gap: “…but I ___ go help Ann.”',
      choices: ['have to', 'had to', 'used to', 'got to'], a: 0,
      cue: 'I really do, but I のすぐあと。',
      line: 'I wish I could stay, I really do, but I *have to* go help Ann.',
      said: '「本当はいたいけど、Ann を手伝いに行かないと」と言う。',
      mean: 'have to は v が f になり「ハフタ」。今夜しなければならないこと。',
      trap: 'had to なら過去の話。「ハッタ」との差は小さいので、今夜の予定かどうかで判断。',
      use: 'I have to run. See you!（もう行かなきゃ。またね）' },

    // R fix: V2 (blind 60 %): "the hospital" was a filler; now "a big exam", the usual meaning of "cramming"
    // why: exam ← "cramming" is the word for exam study, so "job" gets lost; own interview ← "big job interview" heard
    //   without "she's"
    { id: 'd1', skill: 'detail', level: 'B1', point: 'cram', seg: [0.0, 7.4],
      stem: 'Why does Leslie say she can’t stay tonight?',
      choices: ['To help Ann get ready for an interview', 'To help Ann study for a big exam', 'To get ready for her own interview'], a: 0,
      cue: 'help Ann のあと、She’s で始まる文。',
      line: 'She’s gonna be up all night *cramming for a big job interview*.',
      said: '「Ann は大事な就職面接のために、徹夜で詰めこみ勉強をする」と説明する。',
      mean: 'cram ＝ 試験や面接の前に、短い時間で詰めこむ。',
      trap: 'cramming は試験勉強の語なので「試験」と取りやすい。最後の job interview まで聞く。',
      use: 'I crammed all night for the test.（テストのために徹夜で詰めこんだ）' },

    // R fix: V2 (blind 60 %): two choices started "Small digs", so the key was the only one with both "digs" and a fight;
    //   the apology distractor is now "a frank, calm talk", Leslie's own plan to camera
    // why: cools ← Leslie's talk to camera about fighting clean and staying calm; frank talk ← "honest discussions
    //   between friends" in the same talking head, and the "kiss and make up" line
    { id: 'g1', skill: 'gist', level: 'B2', point: 'arc', seg: [18.0, 199.0],
      stem: 'How do things between Leslie and Ann change over the scene?',
      choices: ['Polite digs grow into an open fight', 'An open fight cools into a calm talk', 'Polite digs turn into a frank, calm talk'], a: 0,
      cue: '最初の遠回しな一言と、最後の言い合いを比べて。',
      said: '遠回しな皮肉から始まり、言い返し合いになり、最後は大声のけんかになる。',
      mean: '本音を言わずにとげを出すうちに、ぶつかり合いになる流れ。',
      trap: 'kiss and make up と言われる場面で仲直りを思いやすい。そのあとの言葉の強さを聞く。',
      use: 'Things got heated pretty fast.（あっという間に険悪になった）' },

    // R fix: V2 (blind 55 %): "left the papers at the office" was a filler; now "didn't think she needed it", the
    //   "anyway" read as "it didn't matter"
    // why: read most ← "read tonight" heard without "too much", a "done already" story; not needed ← "anyway" at the end
    //   heard as "it didn't matter"; "way too much stuff for me to read" is the reason
    { id: 'd2', skill: 'detail', level: 'B1', point: 'toomuch', seg: [22.25, 30.05],
      stem: 'What reason does Ann give for not being home preparing?',
      choices: ['There was far too much to read', 'She had read most of it already', 'She didn’t think she needed it'], a: 0,
      cue: 'Oh, well のあと、tonight で終わる文。',
      line: 'there was *way too much stuff* for me to read tonight anyway',
      said: '「今夜読むには量が多すぎたし、どうせ」と答える。',
      mean: 'anyway ＝「どうせ」。あきらめて遊びに来た、という言い訳。',
      trap: '準備をしていないので「もう終わった」と取りやすい。way too much ＝ 多すぎる。',
      use: 'There’s way too much to do today.（今日はやることが多すぎる）' },

    // R fix: V2 (blind 65 %): the request distractor was weak and the key the only "fault" choice; now "the wrong
    //   things to read", a second way to blame Leslie that "ridiculous amount" refutes
    // why: grateful ← "you gave me" heard as thanks; wrong things ← "ridiculous… stuff" heard as bad material, but
    //   "amount" makes it quantity
    { id: 'i1', skill: 'infer', level: 'C1', point: 'blame', reveals: ['toomuch'], seg: [22.25, 35.4],
      stem: 'What is Ann suggesting when she mentions who gave her the material?',
      choices: ['That Leslie gave too much, so it’s on her', 'That she’s grateful Leslie went to the trouble',
                'That Leslie gave her the wrong things to read'], a: 0,
      cue: 'I mean のあと、文の最後の2語。',
      line: 'I mean, it was a *ridiculous amount of stuff* that *you gave me*.',
      said: '「だって、あなたがくれた量がおかしかったの」と付け足す。',
      mean: '量の多さを Leslie のせいにして、準備していないことを言い訳している。',
      trap: 'you gave me だけだと感謝に聞こえる。ridiculous は責める合図、amount は量の話。',
      use: 'You gave me way too little time.（時間が全然足りなかったよ）' },

    // why: not going ← she skipped preparing, so dropping out seems likely; sure ← "think so" heard as confidence
    { id: 'd4', skill: 'detail', level: 'B1', point: 'interview', seg: [35.1, 39.0],
      stem: 'When Leslie asks about tomorrow’s interview, what does Ann answer?',
      choices: ['She thinks she will still go', 'She has decided not to go at all', 'She is sure she will get it'], a: 0,
      cue: '短い返事。I のあとの動詞に注目。',
      line: 'But you are going in for the interview tomorrow? — *I think so.*',
      said: '「でも明日の面接には行くんでしょ？」に「たぶんね」と答える。',
      mean: 'I think so ＝ はっきり yes と言わない、弱めの肯定。',
      trap: '準備していないので「行かない」と取りやすいが、so は「行く」を指している。',
      use: 'Are you coming? — I think so.（来る？—たぶんね）' },

    // R fix: V2 (blind 50 %): "left it at the party" was a filler; now "lent it to the date she brought", the keyword
    //   trap a guy + the man beside her
    // why: her date ← a man is sitting right there, so "a guy" seems to be him; but she can't recall the name
    //   ("what's-his-name") of someone she just introduced; not read ← the "too much to read" talk just before
    { id: 'd3', skill: 'detail', level: 'B1', point: 'book', seg: [73.7, 77.9],
      stem: 'What does Ann tell Leslie about her book?',
      choices: ['She can’t get it back from a guy', 'She lent it to the date she brought', 'She hasn’t found the time to read it'], a: 0,
      cue: 'by the way のあと、文の最後の言いよどみ。',
      line: 'I don’t think I can *get that book back* from, um, *what’s-his-name*.',
      said: '「あの本、何て名前だっけ、あの人から返してもらえそうにない」と言う。',
      mean: 'what’s-his-name ＝ 名前が出てこない男の人。別れた相手らしい。',
      trap: '読む量の話のあとなので「読んでいない」と取りやすい。get … back ＝ 取り返す。',
      use: 'I lent it to what’s-his-name.（あれ、何とかって人に貸したの）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'knownbetter', reveals: ['jab'], seg: [77.9, 82.75],
      stem: 'Type what Leslie says: “I ___ better than to loan something…” (3 words)', answer: 'should have known',
      cue: 'that’s okay, I mean のあと、better の前まで。',
      line: 'I mean, I *should have known* better than to loan something to one of your boyfriends.',
      said: '「あなたの彼氏に物を貸した私が浅はかだった」。should have は「シュダヴ」。',
      mean: '分かっていたはずなのに、という後悔の形。ここでは相手への皮肉。',
      trap: 'have が弱く、should known と書きがち。過去の後悔は have＋過去分詞。',
      use: 'I should have known better.（もっと考えるべきだった）' },

    // R fix: V2 (blind 55 %): the self-joke distractor was weak; now "a friendly tease Ann will laugh off", which Ann's
    //   "what are you saying, exactly?" (in the segment) refutes
    // why: kind ← "Oh, that's okay" taken as the whole message (the Japanese 大丈夫 frame); friendly ← "come and go so
    //   fast" said lightly, like ribbing between friends; Ann's challenge right after shows it stung
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'jab', seg: [77.9, 86.2],
      stem: 'How does Leslie’s answer about the book come across?',
      choices: ['As a dig at the way Ann dates', 'As a friendly tease Ann will laugh off', 'As a kind way of saying it’s fine'], a: 0,
      cue: 'boyfriends のあと、最後の短い文。',
      line: '…one of your boyfriends. They *come and go so fast*.',
      said: '「あなたの彼氏はすぐ入れ替わるから」と付け加える。',
      mean: '本のことを口実に、Ann の恋愛を皮肉っている。Ann が怒り始めるきっかけ。',
      trap: 'that’s okay で始まるので優しい返事に聞こえる。最初より、最後の一文に本音が来る。',
      use: 'People come and go.（人は入れ替わるものだよ）' },

    // R fix: V2 (blind 50 %): two "didn't hear" choices made the key the odd one out; one is now "playing along with
    //   the joke", the friendly reading
    // why: say again ← a question form read as "I didn't hear"; playing along ← a question back read as banter;
    //   "Uh" plus the final "exactly" make it a challenge
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'exactly', seg: [79.0, 86.2],
      stem: 'When Ann replies to Leslie’s answer about the book, what is she doing?',
      choices: ['Pushing Leslie to say it plainly', 'Asking Leslie to repeat herself', 'Playing along with Leslie’s joke'], a: 0,
      cue: 'Uh のあと。文末の一語に注目。',
      line: 'Uh, *what are you saying, exactly*?',
      said: '「ちょっと、それどういう意味？」と聞き返す。',
      mean: '文末に exactly を付けると「はっきり言ってみなさいよ」という挑戦になる。',
      trap: '疑問文なので聞き返しと取りやすい。文末の exactly は、相手の含みを問いただす合図。',
      use: 'What do you mean by that, exactly?（それ、どういう意味？）' },

    // R fix: V2 (blind 65 %): "hopes it lasts for years" was a filler; now "worried Ann will get hurt", the caring
    //   reading of a friend's question
    // why: curious ← a how-long question read as a real question; worried ← a friend asking about a new man sounds like
    //   concern; "let's be honest… with this guy" and his "Sitting right here" show it's a put-down
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'howlong', seg: [84.8, 89.75],
      stem: 'What is Leslie’s question about how long it will last really saying?',
      choices: ['That it surely won’t last long', 'That she’s curious how serious it is', 'That she’s worried Ann will get hurt'], a: 0,
      cue: 'let’s be honest のあとの疑問文。',
      line: 'let’s be honest. *How long is it gonna last* with this guy?',
      said: '「正直に言って、この人とはどれくらい続くの？」と言う。',
      mean: '答えを求めていない反語。「長くは続かない」と言っている。',
      trap: '疑問文なので本当に知りたいと取りやすい。let’s be honest の前置きが、きつい本音の合図。',
      use: 'Let’s be honest, it won’t work.（正直、うまくいかないよ）' },

    // R fix: V2 (blind 60 %): "change your style" was a literal filler; now "try being someone new", the other common
    //   sense of "wearing different hats" (roles), which "He's dumb, but he's fun" just before rules out
    // why: right one fast ← the usual "dating to find the one" script; someone new ← "different hats" = different roles;
    //   the hats are the men, as "He's dumb, but he's fun" shows
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hats', seg: [88.15, 97.25],
      stem: 'How does Ann explain the point of dating around?',
      choices: ['You get to try out all kinds of guys', 'You get to find the right one fast', 'You get to try being someone new'], a: 0,
      cue: 'whole point のあと、身につける物のたとえ。',
      line: 'you get to *try on a bunch of different hats*',
      said: '「色んな人とデートする意味は、色んな帽子を試せること」。',
      mean: 'try on hats ＝ 色々試す。ここでは色んなタイプの相手と付き合うこと。',
      trap: 'hats を役割と取りやすい。直前の He’s dumb, but he’s fun から帽子＝相手。',
      use: 'I’m trying on different careers.（色んな仕事を試しているところ）' },

    // C2 dict: a doubled "is" that grammar would drop
    // anchor: 94.0–95.9 s both sources have "…the whole point of dating around is you get to try on…"; the "is" repeats
    //   the verb of "that's", so a learner's grammar deletes it
    { id: 'nt2', skill: 'dict', level: 'C2', point: 'isyou', seg: [92.4, 97.25],
      stem: 'Type the middle: “That’s the whole point of dating around, ___ try on…” (4 words)', answer: 'is you get to',
      cue: 'around のあと、try の前まで。弱い語も全部。',
      line: 'that’s the whole point of dating around, *is you get to* try on…',
      said: '「デートを重ねる意味は、色々試せるってこと」。is は弱く短い。',
      mean: 'That’s the point に、is you get to… で中身を足す話し言葉の形。is が重なっても会話では自然。',
      trap: '文法から is を落としがち。言いよどみは書かず、聞こえた is は書く。',
      use: 'The thing is, is I’m broke.（問題はね、お金がないってこと）' },

    // R fix: V2 (blind 50 %): the key was the only choice about the image's target; now all three share the frame and
    //   differ in the target or the move
    // why: mocks hats ← Leslie answers in hat words, as if hats were the topic; Ann ← they're fighting, so the insult
    //   seems aimed at her; "this" points at the man sitting there
    { id: 'h2', skill: 'humor', level: 'C1', point: 'hatidiot', seg: [93.3, 100.35],
      stem: 'Why is Leslie’s comeback to the hats idea funny?',
      choices: ['She uses Ann’s image to insult the date', 'She uses Ann’s image to insult Ann', 'She mocks Ann for talking about hats'], a: 0,
      cue: 'hats の直後の返し。最初の this が指すもの。',
      line: 'Well, *this hat* is *an idiot*.',
      said: 'Ann の帽子のたとえを受けて、「この帽子はバカね」と返す。',
      mean: 'this hat ＝ 隣にいるデート相手。たとえをそのまま使って悪口にしている。',
      trap: 'Ann とけんか中なので Ann への悪口と取りやすい。this は目の前の人を指す。',
      use: 'Well, this one’s a keeper.（この人は手放しちゃだめね）' },

    // R fix: V2 (blind 70 %): the key was the only choice that doubted the denial; now all three are "upset/fine"
    //   readings of the denials, parallel in form
    // why: fine ← "No, I'm not" taken at face value, the question read as a surprise; admits ← "you seem mad at me" heard
    //   as Leslie's own confession; the stacked denials and the question turned back show anger she won't own
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'notmad', seg: [99.95, 112.5],
      stem: 'When Ann asks if she’s upset, how does Leslie really seem?',
      choices: ['Upset, but she won’t admit it', 'Upset, and she quickly admits it', 'Fine, just thrown by the question'], a: 0,
      cue: '同じ否定を何回言うか、と途中の聞き返し。',
      line: 'No, I’m not — are you — *you seem mad at me*. … *I’m not mad at you.*',
      said: '怒ってるのかと聞かれ、「怒ってない、そっちこそ」と返し、否定を何度も重ねる。',
      mean: '何度も否定し、問いを相手に返すのは、本当は怒っているサイン。',
      trap: '言葉どおり no を信じやすい。you seem mad は相手のこと。否定を重ねるほど逆の気持ち。',
      use: 'I’m fine. Totally fine.（大丈夫。全然大丈夫）' },

    // R fix: V2 (blind 70 %): "a sign the fight is ending" was a filler; now "a way to keep things light", the
    //   Japanese 冗談っぽく frame
    // why: sincere ← "offense" read literally, so the opener sounds like real care; light ← a set phrase repeated in turn
    //   sounds like a game; each "but" brings a sharper jab, and the last reply, "Offense", shows they land
    { id: 'm1', skill: 'marker', level: 'B2', point: 'nooffense', seg: [116.2, 130.6],
      stem: 'In the quick back-and-forth that follows, how is each opener being used?',
      choices: ['As thin cover for a real jab', 'As an honest wish not to hurt', 'As a way to keep things light'], a: 0,
      cue: '毎回の文頭の同じ言い方と、but のあと。',
      line: '*No offense, but* maybe you think I’m going too fast…',
      said: '二人とも「悪く取らないでね、でも」で始めて、きついことを言い合う。',
      mean: 'No offense, but ＝ 失礼を先に断る前置き。ここでは形だけで、中身は攻撃。',
      trap: '言葉どおりなら気づかい。but のあとが強いほど、前置きは形だけ。',
      use: 'No offense, but that shirt is loud.（悪いけど、そのシャツ派手だよ）' },

    // C2 infer: a plain-English paraphrase of a hedged jab
    // anchor: 123.5–126.7 s "maybe that's a little bit of an excuse for not acting on your feelings" comes inside a
    //   volley of "no offense, but" jabs; Leslie hits back at once (the nursing degree), and "Offense. That's rude."
    //   shows it landed in full
    // R fix: V2 (blind 55 %): the key was the only strong choice; now a second strong reading ("made it up") sits beside
    //   it, so the hedge vs the noun decides
    // why: partly ← "maybe… a little bit" taken as real hedging (the literal hedge); made up ← "excuse" heard as "a lie",
    //   but an excuse can be true; she says he hides behind it, not that it's false
    { id: 'nt3', skill: 'infer', level: 'C2', point: 'excuse', reveals: ['nooffense'], seg: [120.55, 131.55],
      stem: 'Which plain version keeps what Ann means about Leslie’s reason?',
      choices: ['You hide behind that reason', 'You made that reason up', 'That reason partly explains it'], a: 0,
      cue: 'maybe と a little bit のあと、excuse に続く部分。',
      line: 'maybe that’s *a little bit of an excuse* for *not acting on your feelings*',
      said: '「悪く取らないで、でもそれってちょっと、気持ちに向き合わない言い訳じゃない？」と言う。',
      mean: 'maybe や a little bit は遠慮ではなく、刺す言葉の包み紙。「理由を盾に逃げている」という意味。',
      trap: 'ぼかし語を本当の遠慮と取りやすい。ぼかしと強い名詞が並んだら、強い名詞が本音。',
      use: 'That’s a bit of an excuse, isn’t it?（それ、ちょっと言い訳じゃない？）' },

    // R fix: V2 (blind 55 %): both distractors were odd advice; now a literal reading and a work-vs-feelings reading
    // why: nursing school ← "I don't remember… nursing degree in feelings" heard as a memory of what Ann studied; work ←
    //   "nursing" and "feelings" set side by side; "I don't remember you having…" is the "who made you the expert?" pattern
    { id: 'i3', skill: 'infer', level: 'C1', point: 'degree', seg: [122.2, 130.5],
      stem: 'What is Leslie telling Ann with her line about a nursing degree?',
      choices: ['Ann is in no place to judge her feelings', 'Ann learned about feelings in nursing school', 'Ann cares more about work than feelings'], a: 0,
      cue: 'I don’t remember のあと、degree に続く語。',
      line: 'I don’t remember you having a *nursing degree* in *feelings*.',
      said: '「あなたが『気持ち』の看護学位を持ってたなんて知らない」と返す。',
      mean: '「専門家でもないのに、私の気持ちを語らないで」という反撃。',
      trap: '文字通り学校の話と取りやすい。「〜の資格があったっけ？」は口出しをはねつける型。',
      use: 'Since when are you a doctor?（いつから医者になったの？）' },

    // R fix: V2 (blind 50 %): "admits it was fair" was weak; now "flips the phrase to admit she meant it", sharing the
    //   key's frame
    // why: attack ← katakana オフェンス = attacking side (sports); meant it ← "Offense" heard as dropping the "no" of her
    //   own openers ("I did mean offense"); "That's rude" settles that she is the one hurt
    { id: 'h3', skill: 'humor', level: 'C1', point: 'offense', reveals: ['nooffense'], seg: [122.2, 131.55],
      stem: 'Why is Ann’s reply to the nursing-degree line funny?',
      choices: ['She flips the stock phrase to say she’s hurt', 'She means she’ll now go on the attack', 'She flips the stock phrase to admit she meant it'], a: 0,
      cue: 'degree の直後、短い一語とそのあとの文。',
      line: '*Offense.* That’s rude.',
      said: '「気持ちの学位」と言われ、「傷ついた。失礼ね」と返す。',
      mean: 'ずっと続いた No offense を裏返して「傷ついた」と言う。決まり文句の裏返しが笑い。',
      trap: 'カタカナのオフェンス（攻撃）と取りやすいが、offense ＝ 気分を害すること。',
      use: 'No offense. — None taken.（悪気はないよ。—気にしてない）' },

    // why: small ← an unknown word guessed from its cute sound; fair ← "fight clean" comes a few seconds later
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'doozy', seg: [150.8, 158.7],
      stem: 'To the camera, how does Leslie describe her first fight with Ann?',
      choices: ['As a really big, bad one', 'As a small and silly one', 'As a fair, clean one'], a: 0,
      cue: 'first fight のあと、it’s a に続く一語。',
      line: 'This is my first fight with Ann, and *it’s a doozy*.',
      said: '「Ann との初めてのけんか。しかも、とびきりのやつ」と話す。',
      mean: 'a doozy ＝ 並外れたもの。良いことにも悪いことにも使うが、ここは大げんか。',
      trap: '知らない語を響きから「小さい」と想像しやすい。and it’s a … は話を大きくする言い方。',
      use: 'That storm was a doozy.（あの嵐はすごかった）' },

    // C2 infer: the talking head against what follows
    // anchor: 158.7–165.9 s "it's important that we fight clean… focus and stay calm", then at once "You're stupid"
    //   (both sources)
    // R fix: V2 (blind 55 %): "a joke that shows the fight is over" was weak; now "the honest talk she said fights lead
    //   to", her own words a few seconds before
    // why: practicing ← talking heads often rehearse, and "All I need to do is focus" sounds like a warm-up; honest ←
    //   "honest discussions between friends" (154–158 s) heard as the plan, so bluntness fits it; but "fight clean… stay
    //   calm" is the plan, and name-calling breaks it
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'clean', seg: [158.25, 167.4],
      stem: 'After her talk of fighting clean, how should we hear what comes next?',
      choices: ['As proof the calm plan fell apart at once', 'As a line she’s practicing but won’t say',
                'As the honest talk she said fights need'], a: 0,
      cue: 'カメラへの方針の直後に来る、短い一言。',
      line: 'it’s important that we *fight clean*. All I need to do is focus and *stay calm*. … *You’re stupid.*',
      said: '「大事なのはきれいに戦うこと。集中して冷静に」と話した直後、「バカじゃないの」が来る。',
      mean: '立派な方針と、すぐ出る子どもっぽい悪口の落差が笑い。カメラへの言葉が場面で裏切られる。',
      trap: '練習のせりふなら落ち着いた言い方になるはず。方針の直後の一言は、方針の答え合わせ。',
      use: 'So much for staying calm.（冷静でいるはずが、これだ）' },

    // R fix: V2 (blind 55 %): "pushes back harder" was a filler; now "takes the easy way out", a common reading of a
    //   friend's "if I don't push you"
    // why: wrong way ← "right direction" heard and flipped; easy way ← the usual "without a push, you slack off" script;
    //   "you end up standing still" says she doesn't move at all
    { id: 'f4', skill: 'phrase', level: 'B2', point: 'push', seg: [183.1, 193.5],
      stem: 'What does Leslie say happens if she doesn’t push Ann?',
      choices: ['Ann stays just where she is', 'Ann heads off the wrong way', 'Ann takes the easy way out'], a: 0,
      cue: 'right direction のあと、end up に続く部分。',
      line: 'if I don’t *push you in the right direction*, you *end up standing still*',
      said: '「私が正しい方へ押さないと、あなたは立ち止まったまま」と言う。',
      mean: 'standing still ＝ 前に進まない。面接を勧めた理由の説明。',
      trap: 'right direction から「違う方向へ行く」と取りやすい。end up のあとが結果。',
      use: 'Without a deadline, I end up doing nothing.（締め切りがないと、結局何もしない）' },

    // R fix: V2 (blind 50 %): the key was the only two-part, nuanced "No"; now two "No" choices, the other the
    //   "sorry you're upset" non-apology, which "sorry that I thought about you" rules out
    // why: regrets ← "sorry" taken at face value; upset ← the familiar "I'm sorry you feel that way" non-apology; she
    //   apologizes for "thinking about you", then "But…" and "I was just trying to do you a favor" make it sarcastic
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'sorry', seg: [183.1, 195.35],
      stem: 'Is Leslie’s apology about the job sincere?',
      choices: ['No; she’s “sorry” for having been kind', 'Yes; she regrets putting Ann up for the job',
                'No; she’s only sorry that Ann is upset'], a: 0,
      cue: 'sorry のあとの内容と、but からの言い分。',
      line: 'Look, *I’m sorry that I thought about you for the job*, okay? *But*…',
      said: '「あなたを思って仕事を勧めて悪かったわね」と言い、but のあとで自分の正しさを言う。',
      mean: '親切を謝るのは本気の謝罪ではない。皮肉で「私は悪くない」と言っている。',
      trap: 'sorry が聞こえると謝罪と取りやすい。何を謝っているかと、but のあとを聞く。',
      use: 'Sorry for caring!（心配して悪かったわね！）' },

    // why: keep working ← "work together" heard without "shouldn't"; sorry ← "I'm sorry that I thought about you" heard
    //   as a real apology
    { id: 'g2', skill: 'gist', level: 'B1', point: 'end', reveals: ['sorry'], seg: [183.1, 209.0],
      stem: 'By the end of the clip, where do Leslie and Ann stand?',
      choices: ['They talk about not working together', 'They agree to keep working on the plan', 'They end by saying sorry to each other'], a: 0,
      cue: '最後の Maybe で始まる二つの文。',
      said: '「もう好意はたくさん」と言われ、「なら一緒に働かない方がいいかも」と言い合って終わる。',
      mean: '仲直りではなく、仕事の話まで壊れかけたまま場面が終わる。',
      trap: 'sorry が聞こえるので謝り合って終わると取りやすいが、最後の Maybe の文が結論。',
      use: 'Maybe we should take a break.（少し距離を置いた方がいいかも）' },
  ]
};
