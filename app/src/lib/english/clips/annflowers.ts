// REVIEW 2026-11-16: pass 3, fix 20, drop 0, new 0; ear checks 2 (as authored)
// OPEN: nt1 needs Ann's side (Leslie's spin team, 0–17 s) from outside its segment; the C2 anchor allows it, but retire
//   nt1 if that reads as context rather than listening
// “Ann can buy herself flowers now | Parks and recreation” (the official Parks and Recreation channel, Season 4): debate
// night spin room. Ann and Chris spin Leslie's on-stage mishap; Chris asks Ann to date him again, citing that he may lose
// his job if Newport wins; Tom, jealous, wrecks his own spin and begs Ann back; Ann turns Chris down kindly and gives Tom
// a "not right now".
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 205.5 s; music after. Names said: Chris
// (2.3, 51.3, 153.4 s), Ann (19.7 s), Tom (29.2, 122.2 s). Untested on purpose: 0–8 s past the gist (the mishap is
// bodily), 37.7–38.6 s ("Testify logic"), 81–90 s (speaker never named), 101–107 s (a sexual line), 117.6–122 s (who
// says the first "What about us?"), 134.7 s (captions "I do anything", whisper "I'd do anything"), 172–176 s (who says
// "he looks sad"), 186–205.5 s (captions "just like you won't", whisper "just like you want"; the closing spin's
// speakers are never named).
// EAR CHECK: 71.0 s s1 — "Would you" said as one blended "wuja" (both sources have "would you like that")
// EAR CHECK: 159.8 s x1 — "worth a" linked into one sound (both sources have "it was worth a shot")
import type { Clip } from '../types.ts';

export const annFlowers: Clip = {
  id: 'annflowers', video: 'nKaUJj68lfY', title: 'Ann can buy herself flowers now', dur: 226, wpm: 153,
  band: 'slow', tags: ['恋愛', '職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 — "looking after Leslie" was easy to rule out; now "telling people why she got sick", the right
    //   audience with the wrong move
    // why: practice ← "tried to answer a question" heard as a rehearsal; why sick ← "threw up" heard as the point, the
    //   one-word order at the end and Chris's reframe missed
    { id: 'g1', skill: 'gist', level: 'B2', point: 'spin', seg: [0.5, 18.5],
      stem: 'What are Ann and Chris doing in the first part of the clip?',
      choices: ['Making Leslie’s bad moments sound good', 'Helping Leslie practice for her debate',
                'Telling people why Leslie got sick'], a: 0,
      cue: 'Ann の話の最後の一語と、Chris の言い方。',
      line: 'Leslie just tried to answer a question and… threw up. *Spin.*',
      said: '討論中の Leslie の失敗を Ann が伝え、Chris に「スピンして」と頼む。',
      mean: 'spin ＝ 悪い出来事を都合よく言い換えて記者に伝えること。二人はその係。',
      trap: 'threw up だけ聞くと体調の説明に聞こえる。最後の命令の一語が仕事。',
      use: 'How do we spin this?（これ、どう言い繕う？）' },

    // R fix: V2 — "polluted air" was a filler; now "praise for her hard work", a second reframe of the accident
    // why: forgets ← the praise sounds like a normal change of topic, both puns missed; hard work ← "overflowing with
    //   ideas" heard as "she pushed herself too hard"
    { id: 'h1', skill: 'humor', level: 'C1', point: 'methane', reveals: ['spin'], seg: [8.3, 17.5],
      stem: 'Why is Chris’s quick answer about Leslie funny?',
      choices: ['He turns her accident into a link to her gas plan', 'He forgets the accident and just praises her plan',
                'He turns her accident into praise for her hard work'], a: 0,
      cue: '「speaking of」のあとの一語と、その前の動詞。',
      line: 'Leslie Knope is literally *overflowing* with ideas… And *speaking of methane*, have you heard about her plan…',
      said: '「アイデアがあふれ出ている。メタンと言えば、ガス削減の計画は…」と言う。',
      mean: 'overflowing は吐いたこと、methane はおならを指す。失敗を言葉遊びで政策につなぐ。',
      trap: '政策の話だけ聞くと普通のほめ言葉。直前の失敗と重なる語を探す。',
      use: 'Speaking of which, are you free Friday?（そういえば、金曜あいてる？）' },

    // R fix: V2 + S4 — the key was the only romantic choice; "his partner at work" is now "his friend outside work",
    //   the other reading of "a team in real life". The seg now runs on to "romantically involved", which refutes it
    // why: friend ← "a team in real life" heard as friendship; keep apart ← "in real life" heard as a line he won't cross
    { id: 'i1', skill: 'infer', level: 'B2', point: 'decision', seg: [19.2, 32.8],
      stem: 'After praising their teamwork, what has Chris decided to do?',
      choices: ['To ask Ann to date him once more', 'To become Ann’s friend outside of work',
                'To keep work and dating apart'], a: 0,
      cue: '「in real life」と、決意のあとの Tom についての質問。',
      line: 'It’s silly that we’re *not a team in real life*… and I have made a decision.',
      said: '「最高のチーム。実生活でチームじゃないのはおかしい。決めた」と言う。',
      mean: '実生活のチーム ＝ 恋人同士。仕事の外でも組みたい、つまり復縁を申し込む決意。',
      trap: 'in real life だけなら友だちとも取れる。次の romantically で決まる。',
      use: 'Are you two a thing in real life?（二人って実際付き合ってるの？）' },

    // anchor: 21.6–26.1 s "It's silly that we're not a team in real life. I just heard those words come out of my
    //   mouth, and I have made a decision.": the phrase is followed by a decision, not a retraction
    // R fix: V2 — "those were Ann's words" was a filler; now the target shift "what you want", so two choices share the
    //   realization frame
    // why: silly thing said ← "silly" is heard, and the phrase's usual use is embarrassment at oneself; what you want ←
    //   "we" in "not a team" heard as a read on Ann, though the decision is his
    { id: 'nt2', skill: 'pragma', level: 'C2', point: 'decision', seg: [21.2, 26.85],
      stem: 'Which plain-English version keeps what Chris means about hearing his own words?',
      choices: ['“Saying it out loud showed me what I want.”', '“I can’t believe I said something so silly.”',
                '“Saying it out loud showed me what you want.”'], a: 0,
      cue: '決まり文句のあとに、何が続くか。',
      line: 'I just heard those words come out of my mouth, *and I have made a decision*.',
      said: '「実生活でチームじゃないのはおかしい」と言い、「今の言葉を自分で聞いて、決めた」と続ける。',
      mean: 'この言い回しはふつう失言への後悔。ここでは決意が続き、自分の言葉で本心に気づいた合図になる。',
      trap: 'silly が聞こえると失言の反省に聞こえる。決まり文句の型より、後ろに続く文で意味を決める。',
      use: 'Saying it out loud, I knew I was ready.（口に出して、準備ができてると分かった）' },

    // R fix: S4 — the seg ended inside "Testify logic" (37.7–39.0 s); it now runs past it
    // why: can't believe the breakup ← "broke up" said just before, "can't believe" tied to it; feelings ← Chris's next
    //   line ("I still have feelings") carried back to Ann
    { id: 'd1', skill: 'detail', level: 'B1', point: 'tom', seg: [26.4, 39.3],
      stem: 'What does Ann say about her time with Tom?',
      choices: ['She can’t believe they ever dated', 'She can’t believe they broke up', 'She still has feelings for him'], a: 0,
      cue: '「broke up」のあと、honestly に続く部分。',
      line: 'Yes, we broke up. And I honestly *can’t believe we ever dated*.',
      said: '「別れた。正直、付き合ってたこと自体が信じられない」と答える。',
      mean: 'ever ＝「そもそも」。別れたことでなく、付き合ったことを悔やんでいる。',
      trap: 'broke up が直前なので「別れが信じられない」と取りやすい。ever が目印。',
      use: 'I can’t believe I ever said that.（あんなこと言ったなんて信じられない）' },

    // R fix: V2 — "shy, playing it down" was easy to rule out; now "nervous, losing track", the repeated "feelings"
    //   heard as fumbling. Its trap names "another try": reveals decision
    // why: joking ← "primal feelings" sounds odd, so it's heard as a gag; nervous ← "feelings… feelings… feelings" heard
    //   as fumbling, the stronger word each time missed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'feelings', reveals: ['decision'], seg: [40.2, 50.4],
      stem: 'How does Chris come across as he tells Ann how he feels?',
      choices: ['Earnest, with each word stronger than the last', 'Joking, to make the moment less awkward',
                'Nervous, and losing track of his words'], a: 0,
      cue: '「feelings」の前に付く語が、どう変わるか。',
      line: 'I still have feelings for you. *Strong* feelings. *Emotional, primal* feelings.',
      said: '「まだ気持ちがある。強い気持ち。感情的で本能的な気持ち」と重ねる。',
      mean: '形容詞がどんどん強くなる。冗談でなく、本気で気持ちを伝えている。',
      trap: 'primal は大げさで笑えるが、本人は真剣。最後に another try と頼んでいる。',
      use: 'I’d like to give it another try.（もう一度やってみたい）' },

    // why: three weeks ← "three" caught, "months" lost in the fast run; a year ← "a year ago" comes right after
    { id: 'n1', skill: 'number', level: 'B1', point: 'months', seg: [50.8, 55.4], keep: true,
      stem: 'How long did Ann and Chris go out?',
      choices: ['About three weeks', 'About three months', 'About a year'], a: 1,
      cue: '「like」のあとの数と単位。',
      line: 'we dated for, like, *three months* a year ago.',
      said: '「付き合ってたのは3か月くらい、それも1年前」と言う。',
      mean: 'like は「〜くらい」。短い交際だった、と強調している。',
      trap: 'すぐあとの a year ago は「いつ」の話。for のあとが「どのくらいの間」。',
      use: 'We talked for, like, an hour.（1時間くらい話した）' },

    // R fix: V2 — the key was the only choice about exaggeration; "a better life since then" is now "the breakup as
    //   worse", the same move on the wrong target
    // why: breakup ← "this" tied to the breakup Ann just mentioned, not the dating; new with her ← "build… into
    //   something" heard as a plan for the future
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'built', seg: [54.5, 58.4],
      stem: 'When Ann says what Chris has done with their past, what does she mean?',
      choices: ['He remembers it as bigger than it was', 'He remembers the breakup as worse than it was',
                'He wants to build something new with her'], a: 0,
      cue: '「something」のあと、文の最後の短い否定。',
      line: 'you’ve *built this into something that it wasn’t*.',
      said: '「実際以上のものに作り上げてる」と言う。',
      mean: 'build A into B ＝ A を B に仕立てる。短い交際を大恋愛にしている、という指摘。',
      trap: 'build を「新しく作る」と取ると未来の話になる。that it wasn’t ＝「実際は違った」。',
      use: 'Don’t build it up into a big deal.（大げさに考えすぎないで）' },

    // R fix: B1 — the stem ("dating again") gives away i1's key: reveals decision
    // why: her rule ← the weak "your" heard as "my"; campaign ← debate night in the background, the rule's owner filled
    //   in as the city
    { id: 'd2', skill: 'detail', level: 'B2', point: 'rule', reveals: ['decision'], seg: [58.2, 62.4],
      stem: 'What second reason does Ann give against dating again?',
      choices: ['His own rule bans dating someone he manages', 'Her own rule bans dating anyone at work',
                'The city’s rule bans dating during a campaign'], a: 0,
      cue: '「according to」のあとの持ち主と、理由。',
      line: 'according to *your rule*, we can’t date because *you’re my boss*.',
      said: '「あなたのルールだと、上司とは付き合えない」と言う。',
      mean: '相手が自分で作ったルールを持ち出して断っている。言い返しにくい理由。',
      trap: 'your は弱く短く、my と区別しにくい。because 以下の you’re my boss で持ち主が分かる。',
      use: 'By your own rule, that’s not allowed.（あなたのルールだと、それはだめでしょ）' },

    // R fix: V4 — the reason is said in the next line, so detail, not infer. V2/K6 + S3 — the key was the only choice
    //   with a clip name (Newport); the cue's "If" was a word only the key had
    // why: step down ← "maybe not for long" heard as his own choice, "may replace me" missed; Ann moves ← "not for
    //   long" heard about her job, not his
    { id: 'i2', skill: 'detail', level: 'B2', point: 'notlong', seg: [61.9, 70.0],
      stem: 'Why does Chris answer “Maybe not for long”?',
      choices: ['He might be replaced after the election', 'He plans to step down so they can date',
                'He expects Ann to move to a new job'], a: 0,
      cue: '次の文の主語と、文の最後の一語。',
      line: 'Maybe not for long. If Newport wins, the city council *may replace me*.',
      said: '「Newport が勝てば、市議会が僕を替えるかも」と言う。',
      mean: '上司でなくなれば、ルールの問題が消える、という理屈。辞めるのは本人の意思ではない。',
      trap: 'not for long を自分で辞める宣言と取りやすい。replace me の主語は市議会。',
      use: 'I won’t be here for long.（ここにいるのも長くはない）' },

    // anchor: 63.5–71.8 s "If Newport wins… it would open it up for us to be together. Would you like that?": "that" is
    //   Newport winning, asked by a member of Leslie's own spin team (named as such from 0–17 s)
    // R fix: K1 + S1 (one rewrite) — "date him once the race is over" was defensible as the literal ask, and the stem
    //   ("Given whose side…") pointed at the key. Now asks why the question is awkward; Tom is the new miss. Its line
    //   shows "for us to be together": reveals decision
    // why: quit ← "replace me" heard as his offer (i2's trap carried up); Chris or Tom ← the Tom breakup a minute
    //   earlier, carried into this ask
    { id: 'nt1', skill: 'infer', level: 'C2', point: 'notlong', reveals: ['likethat', 'decision'], seg: [62.0, 72.4],
      stem: 'Why is “Would you like that?” an awkward question for Ann?',
      choices: ['It asks her to want her own candidate to lose', 'It asks her to want Chris to quit his job',
                'It asks her to choose between Chris and Tom'], a: 0,
      cue: '「Would you like that?」の that が指す条件。',
      line: 'If Newport wins… it would open it up for us to be together. *Would you like that?*',
      said: '「Newport が勝てば僕は替えられ、二人は付き合える。どう？」と聞く。',
      mean: 'that は Newport の勝利、つまり Leslie の負け。応援チームの一員が、相手候補の勝利を喜ぶかと聞いている。',
      trap: 'replace me を「辞める」と取りやすい。that は If の条件を指す。',
      use: 'Wouldn’t that be nice?（そうなったら良くない？）' },

    // R fix: B1 — its line shows "for us to be together": reveals decision
    // why: Wouldn't ← the blended "wuja" is close to "wouldn't you" with the t lost; Did you ← "-d you" gives the same
    //   "ja"; Do you ← "would" shrinks to a short "wu"
    { id: 's1', skill: 'sound', level: 'B2', point: 'likethat', reveals: ['decision'], seg: [70.0, 73.0],
      stem: 'Fill the gap: “___ like that?”',
      choices: ['Would you', 'Wouldn’t you', 'Did you', 'Do you'], a: 0,
      cue: '文頭、二語がつながって一つに聞こえる部分。',
      line: 'But it would open it up for us to be together. *Would you* like that?',
      said: '「一緒になれる道が開ける。そうなったらいい？」と聞く。',
      mean: 'would you が「ウジュ」とつながる。d と y が合わさって「ジュ」になる。',
      trap: 'did you も「ジュ」で終わる。頭の「ウ」の音と、仮定の話の流れで would と分かる。',
      use: 'Would you like some help?（手伝おうか？）' },

    // R fix: S4 — the seg ran into "And we all know the…", cutting words and starting the sexual line; now ends after
    //   "pristine"
    // why: 70% ← "seventy" caught, the weak "-eight" lost; 87% ← the two digits swapped (seventy-eight / eighty-seven)
    { id: 'n2', skill: 'number', level: 'B1', point: 'pct', seg: [89.8, 101.15], keep: true,
      stem: 'What share of people call the parks “pristine”?',
      choices: ['70%', '78%', '87%'], a: 1,
      cue: '「of Pawneans」の直前の数字。',
      line: '*78%* of Pawneans label our parks pristine.',
      said: '「市民の78％が、公園はきれいだと言っている」と返す。',
      mean: 'seventy-eight percent。pristine ＝ 新品のようにきれい。汚くないという反論。',
      trap: 'seventy のあとの eight は短く弱い。一の位まで聞く。',
      use: 'Ninety percent of people agree.（9割の人が賛成している）' },

    // R fix: V2 — two literal readings of "fighting" and the key the only one about the race; "arguing" is now "close to
    //   winning", the race read the wrong way
    // why: danger ← "fighting for our lives" taken literally; winning ← "fighting" heard as "giving it everything", the
    //   "for our lives" (survival) missed
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'lives', seg: [107.7, 113.2],
      stem: 'After “Excuse us”, what is the speaker saying about tonight?',
      choices: ['Their side is in real trouble in the race', 'Their side is in real danger of getting hurt',
                'Their side is close to winning the race'], a: 0,
      cue: '「wrong with you?」のあとの文。',
      line: 'What the hell is wrong with you? *We’re fighting for our lives* out there.',
      said: '「何考えてるの？こっちは必死で戦ってるのよ」と言う。',
      mean: 'fight for one’s life ＝ 生き残りをかけて必死。負けそうな選挙の大げさな言い方。',
      trap: '文字どおりなら命の危険、勢いと取れば優勢。for our lives は「生き残り」。',
      use: 'This team is fighting for its life.（このチームは崖っぷちだ）' },

    // why: working with Chris ← they really are a spin team, so "riding the… train" heard as work; trip ← "train" taken
    //   literally
    { id: 'f4', skill: 'phrase', level: 'C1', point: 'train', seg: [112.9, 120.35],
      stem: 'What does Tom accuse Ann of in his first complaint?',
      choices: ['Already going out with Chris again', 'Already working closely with Chris',
                'Already taking a trip with Chris'], a: 0,
      cue: '「already」のあとの言い方と、次の I saw の文。',
      line: 'you’re already *riding the Traeger train*. … I saw you guys *getting back together*.',
      said: '「もう Traeger 号に乗ってる」と責める。',
      mean: 'Traeger は Chris の名字。ride the 〜 train ＝ 〜に乗る。もう Chris と付き合っているという非難。',
      trap: '一緒に働く二人なので仕事の話に聞こえる。次の文が中身。',
      use: 'Everyone’s on the pizza train tonight.（今夜はみんなピザに夢中）' },

    // R fix: V2/K6 — the key was the only two-part reason; all three are now "He gets X and feels Y"
    // why: jealous ← his complaint about Chris a moment ago; worn out ← "fighting for our lives" and the long night
    { id: 'd3', skill: 'detail', level: 'B2', point: 'nervous', seg: [125.7, 134.0],
      stem: 'Why does Tom say he acts the way he does?',
      choices: ['He gets nervous and feels she’s too good for him', 'He gets jealous and feels she likes Chris more',
                'He gets worn out and feels the campaign is too much'], a: 0,
      cue: '「because」のあと、二つの理由。',
      line: 'because *I’m nervous* and I feel like *you’re out of my league*.',
      said: '「緊張するし、君は高嶺の花だから」と謝る。',
      mean: 'out of my league ＝ 自分とは格が違う。ひどい態度は自信のなさの裏返しだと認めている。',
      trap: '直前の文句から嫉妬を選びやすいが、本人の理由は because のあと。',
      use: 'She’s way out of my league.（彼女は僕には高嶺の花だ）' },

    // R fix: V2 — "her vote in the city election" was a filler (Tom isn't running); now "vote for Leslie as a favor"
    // why: Leslie ← "vote for me" heard alone as a campaign ask, "to be your boyfriend" lost; mocks ← campaign words read as
    //   sarcasm, though he has just said sorry
    { id: 'h2', skill: 'humor', level: 'C1', point: 'vote', seg: [133.7, 140.8],
      stem: 'Why does Tom’s last plea to Ann get a laugh?',
      choices: ['He begs her back in the words of a campaign', 'He asks her to vote for Leslie as a favor to him',
                'He mocks the campaign he is working for'], a: 0,
      cue: '「vote for me」のあとに続く語。',
      line: 'Please, *vote for me* to be your *boyfriend*.',
      said: '「何でもするから、よりを戻したい。僕を彼氏に投票して」と頼む。',
      mean: '討論会の夜なので、頼み方まで選挙の言葉。本気の告白を演説の形で言うのが笑い。',
      trap: 'vote だけ聞くと本当の選挙の話。to be your boyfriend までが一つの頼み。',
      use: 'Vote for me as team captain!（キャプテンに私を選んで！）' },

    // R fix: S1 — it isn't the final statement (the closing spin is at 196 s); the stem now names the moment. V2/K6 —
    //   "clearly" was an absolute only in a distractor, and the key the only two-part choice
    // why: Leslie ← it's her spin team, so the listener fills in her name and a win; both ← "one of these candidates is
    //   right" heard without "and one of them is not"
    { id: 'i4', skill: 'infer', level: 'C1', point: 'undeniable', seg: [141.0, 150.0],
      stem: 'What does the line on “what the voters saw tonight” actually tell them?',
      choices: ['That one candidate is right, without saying which', 'That Leslie is the right one, since she won tonight',
                'That both candidates have something to offer the town'], a: 0,
      cue: '文の最後まで、名前が出てくるかどうか。',
      line: 'one of these candidates is *right for this town* and one of them *is not*.',
      said: '「一方の候補はこの町にふさわしく、もう一方は違う。それが今夜の事実」と言う。',
      mean: 'どちらとは言っていないので、中身は空っぽ。散々な夜には、名前を出さないのが精一杯。',
      trap: '応援側の発言なので Leslie と補いやすい。名前は一度も出ていない。',
      use: 'Let’s just say one of us was right.（どっちが正しかったかは言わないでおく）' },

    // R fix: V2 — the title ("can buy herself flowers") and a lone "no" made the key easy; "yes if not her boss" is now
    //   a second no, "he asks her to think again", refuted by "It was worth a shot"
    // why: maybe ← Chris's earlier "think about it" and the "not right now" Ann says later; think again ← his earlier
    //   "Just think about it" carried into the end
    { id: 'g2', skill: 'gist', level: 'B1', point: 'ending', seg: [149.9, 172.5],
      stem: 'How do things end between Ann and Chris?',
      choices: ['She says no, and he wishes her well', 'She says maybe, once the race is over',
                'She says no, and he asks her to think again'], a: 0,
      cue: '「flattering」のあとの返事と、彼の最後の言葉。',
      line: 'I’m sorry, Chris… I just don’t think it’s a *good idea*.',
      said: 'Ann が「良くないと思う」と断り、Chris は彼女の幸せを願う。',
      mean: 'はっきり断られても、Chris は相手を立てて引き下がる。きれいな終わり方。',
      trap: '先の think about it から保留と取りやすい。sorry で始まる返事は断り。',
      use: 'Thanks, but I don’t think it’s a good idea.（ありがとう、でもやめておく）' },

    // R fix: V2 — "teases him" was a filler (he hadn't praised her); now the modesty reading (謙遜)
    // why: means yes ← flattered = pleased, and 「光栄です」 often comes before a yes in Japanese; modesty ← the Japanese
    //   「私なんて」 frame, a compliment answered by playing it down
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'flatter', reveals: ['ending'], seg: [152.3, 158.3],
      stem: 'Before Ann gives her answer, what does her second sentence do?',
      choices: ['It softens the no that she is about to give', 'It thanks him for asking and means yes',
                'It plays down his praise out of modesty'], a: 0,
      cue: '「sorry」のあとの短い文と、続く just。',
      line: 'I’m sorry, Chris. *It’s very flattering*. I just… I just don’t think it’s a good idea.',
      said: '「ごめんね。うれしいけど、ただ、良くないと思う」と言う。',
      mean: 'It’s flattering ＝「光栄だけど」。断る前に相手の気持ちを立てる決まり文句。',
      trap: 'flattering を yes と取りやすい。sorry が先、just が後なら断り。',
      use: 'I’m flattered, but I have to say no.（光栄だけど、お断りしないと）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'shot', seg: [158.9, 161.1],
      stem: 'Type what Chris says: “It was ___.” (3 words)', answer: 'worth a shot',
      cue: '断られた直後、Chris の最初の一言。',
      line: 'It was *worth a shot*.',
      said: '「言ってみる価値はあった」と、さらりと引き下がる。',
      mean: 'worth a shot ＝ ダメ元でも試す価値がある。worth と a がつながり「ワーサ」に聞こえる。',
      trap: 'worth a が一語に聞こえ、shot だけ残りやすい。th の音は弱い。',
      use: 'Ask her. It’s worth a shot.（聞いてみなよ、ダメ元で）' },

    // R fix: V2/K6 — the key was the only hedged choice and "never" an absolute only in a distractor; now a hedged
    //   near miss ("toward a yes") and a firm no
    // why: firm ← "never… ever again" heard as a flat no to him; toward a yes ← "not right now" heard as "yes, later"
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'notnow', seg: [175.9, 184.5],
      stem: 'How sure is Ann when asked about getting back together?',
      choices: ['Unsure, though leaning toward a no', 'Unsure, though leaning toward a yes',
                'Firm, with a clear no from the start'], a: 0,
      cue: '最初の短い返事が、何回、どう変わるか。',
      line: '*No. I don’t know. No, not right now.*',
      said: '「ううん。分からない。ううん、今はまだ」と揺れる。',
      mean: 'no と I don’t know を行き来している。きっぱり断ってはいないが、今は戻る気はない。',
      trap: 'never ever だけ聞くと強い拒否。でもそれは、誰とも付き合わないかも、という話。',
      use: 'Not right now. Maybe later.（今は無理。またあとで）' },

    // R fix: K5 — the key began "It…", the others "He…"
    // why: move on ← take = 受け入れる, so "accept it's over" (the Japanese 「受け止める」 frame); doubts ← the short
    //   reply heard as disbelief, though "you know what else?" carries him on, upbeat
    { id: 'p3', skill: 'pragma', level: 'C1', point: 'takeit', seg: [181.1, 189.6],
      stem: 'What does Tom mean by his short reply to Ann’s “never… again”?',
      choices: ['He finds it not great, but good enough', 'He accepts it’s over and is ready to move on',
                'He doubts that she really means what she says'], a: 0,
      cue: '「ever again」の直後、三語の返事。',
      line: 'There’s a chance I’m never going to date anyone ever again. — *I’ll take it.*',
      said: '「もう誰とも付き合わないかも」と言われ、「それでいい」と返す。',
      mean: 'I’ll take it ＝ 最高ではないが、それで手を打つ。完全な no でなければ十分。',
      trap: 'take を「諦めて受け入れる」と取りやすい。彼はまだあきらめていない。',
      use: 'A B-plus? I’ll take it.（Bプラス？それで十分）' },
  ]
};
