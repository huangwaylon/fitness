// REVIEW 2026-11-16: pass 9, fix 11, drop 0, new 0; ear checks 1
// Open: d1, s2 and r1 stay near 50 % blind for anyone who knows "tardiness", "that'll" and "you don't want to know".
// “Jim Threatens Dwight With A Full Disadulation - The Office US” (the official The Office channel, Best of Season 3):
// Dwight hands Jim a demerit for lateness and lays out his chain of penalties; Jim turns the system back on him.
// Segments from the captions, words from whisper (2026-11-16). Talk runs ≈ 6–66 s; whisper loops after 66 s. Untested:
// 27.5 s ("Lay it on me" / "I had on me"); the made-up word at ≈ 58 s differs in both sources and is never spelled.
// EAR CHECK: 63.0 s r1 — the cut falls after Dwight's "What's that?", before "Oh, you don't want to know" (captions put
//   "oh" at 62.5 s, whisper at ≈ 64 s)
import type { Clip } from '../types.ts';

export const disadulation: Clip = {
  id: 'disadulation', video: 'ClY_XjoiYXc', title: 'Jim Threatens Dwight With A Full Disadulation',
  dur: 92, wpm: 190, band: 'fast', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: blind-guessable (V2): "a long chain of penalties" was the only choice that sounded like the scene. The key
    //   is now the purpose, at the same length and specificity as the distractors.
    // why: manage the staff ← "second in command" and "above the law" heard as a lesson on running the office; sign
    //   for HR ← "tardiness" and "written up" heard as paperwork Jim must sign
    { id: 'g1', skill: 'gist', level: 'B1', point: 'purpose', reveals: ['tardy'], seg: [5.5, 53.2],
      stem: 'What is Dwight mainly trying to do in this conversation?',
      choices: ['Make Jim take his lateness seriously', 'Show Jim how to manage the staff',
                'Get Jim to sign a report for HR'], a: 0,
      cue: '前半、Dwight が数字を重ねていく話し方。',
      said: '遅刻の罰点を渡し、罰点が重なると何が起きるかを順に説明していく。',
      mean: '罰のしくみを並べて、遅刻を重く受け止めさせたい。',
      trap: 'second in command や written up で指導や書類の話に思えるが、どれも罰の説明の一部。',
      use: 'Let me walk you through the rules.（ルールを順に説明するね）' },

    // R fix: the title ("Jim Threatens Dwight") answered the turnabout (V2, GUIDE §9.4), and both "plays along"
    //   choices were two-part. Now asks how Jim treats the system before the twist; seg ends before the twist, so it no
    //   longer reveals `dontknow`. Point renamed: nothing else used `turn`.
    // why: argues ← Jim's questions heard as objections; follows ← "Oh, I understand" and "Now that sounds serious" taken
    //   at face value
    { id: 'g2', skill: 'gist', level: 'B2', point: 'playalong', reveals: ['love'], seg: [5.5, 53.2],
      stem: 'Through most of the scene, how does Jim respond to Dwight’s system?',
      choices: ['He plays along while making fun of it', 'He argues that the system is unfair',
                'He tries his best to follow its rules'], a: 0,
      cue: 'Jim の質問の仕方と、返事の調子。',
      said: '罰点を「気に入った」と言い、質問や「重大そうだ」で話に乗る。',
      mean: '本気で従う気はなく、Dwight のルールに付き合いながらからかっている。',
      trap: 'I understand や質問で真面目に見えるが、話を引き出すためのからかい。',
      use: 'Sure, I’ll play along.（いいよ、話に乗るよ）' },

    // why: leaving early ← a time-related offense heard without the word; missing a meeting ← "demerit" heard as a
    //   general work offense
    { id: 'd1', skill: 'detail', level: 'B2', point: 'tardy', seg: [5.8, 12.9],
      stem: 'What is Jim’s demerit for?',
      choices: ['Coming in late', 'Leaving work early', 'Missing a meeting'], a: 0,
      cue: 'Jim のフルネームのすぐあとの一語。',
      line: 'That is a demerit. Jim Halpert, *tardiness*.',
      said: '「これは罰点だ。Jim Halpert、遅刻」と読み上げる。',
      mean: 'tardiness ＝ 遅刻・時間に遅れること。学校や職場の書類でよく使う硬い語。',
      trap: '時間の違反というだけで「早退」も浮かぶが、tardy は来るのが遅い方。late と同じ向き。',
      use: 'Sorry for my tardiness this morning.（今朝は遅れてすみません）' },

    // R fix: blind-guessable (V2): "he likes clear rules" and "hides his worry" had no hook. Now the literal reading and
    //   the Japanese "humbly takes the feedback" frame.
    // why: pleased ← "love" taken at its word; thankful ← a demerit taken as feedback to accept (Japanese frame)
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'love', seg: [11.6, 18.5],
      stem: 'When Jim first reads the demerit, how does he really feel?',
      choices: ['Amused; he’s making fun of it', 'Pleased; he means what he says', 'Thankful; he wants to improve'],
      a: 0,
      cue: '紙を受け取った直後の Jim の一言と、言う内容のずれ。',
      line: 'Oh, *I love it already*.',
      said: '罰点を渡されて「おお、もう気に入ったよ」と言う。',
      mean: '罰を「気に入った」と言うのは反対の意味。からかって楽しんでいる。',
      trap: 'love を文字通り取ると本当に喜ぶか反省しているように見える。悪い物をほめたら、まず冗談を疑う。',
      use: 'Oh great, I love it already.（あーいいね、もう気に入ったよ）' },

    // R fix: the key was the only negative choice (K6) and "answer for the others" had no hook. The new distractor is
    //   the reading you get by missing "does not".
    // why: bend the rules ← "does not" lost, so rank puts him above the law; set the rules ← "second in command" heard as
    //   power to make rules
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'law', seg: [14.2, 18.5],
      stem: 'When Dwight mentions Jim’s rank, what point does he make?',
      choices: ['His rank doesn’t free him from the rules', 'His rank lets him bend the rules a bit',
                'His rank means he should set the rules'], a: 0,
      cue: 'second in command のあと、but で始まる部分。',
      line: 'You are second in command, but that does not put you *above the law*.',
      said: '「ナンバー2でも、法の上には立てない」と言う。',
      mean: 'above the law ＝ ルールの外にいる立場。地位があっても例外はない。',
      trap: 'command で「決める側」を想像し、does not を落とすと逆になる。but の後ろが本題。',
      use: 'Nobody here is above the rules.（ここではルールの例外はないよ）' },

    // why: You got to ← the soft v of "you've" lost; You get to ← "got" and "get" sound close and fit the gap; You're
    //   going to ← "gonna"-like rhythm
    { id: 's1', skill: 'sound', level: 'B2', point: 'gotto', seg: [14.2, 18.5],
      stem: 'Fill the gap: “___ learn, Jim.”',
      choices: ['You’ve got to', 'You get to', 'You’re going to'], a: 0,
      cue: '文の最初、短くつながった数語。',
      line: '*You’ve got to* learn, Jim.',
      said: '「Jim、お前は学ばなきゃいけない」と言う。',
      mean: 'got to が「ガッタ」とつながり、ve はほぼ消える。～しなきゃだめだ、の意味。',
      trap: 'get to なら「～させてもらえる」で意味が違う。got の o は口を大きく開ける。',
      use: 'You’ve got to try this place.（この店、絶対行ってみて）' },

    // R fix: "he likes getting a demerit" was a filler (V2/K3). Swapped for the quotative "like".
    // why: compares ← "like" as "similar to"; quoting ← the quotative "like" ("I was like…") heard before a question
    { id: 'm1', skill: 'marker', level: 'B2', point: 'like', seg: [18, 23.75],
      stem: 'After “lots of questions”, what does Jim’s next short word do?',
      choices: ['Leads into an example of a question', 'Compares the demerit to something else',
                'Shows he is quoting someone else'], a: 0,
      cue: 'lots of ～ の直後、短い一語。',
      line: 'I also have lots of questions, *like*, what does a demerit mean?',
      said: '「質問もたくさんある。たとえば、罰点ってどういう意味？」と聞く。',
      mean: 'この like は「たとえば」。例を出す合図で、会話でとても多い。',
      trap: 'like を「～のような」や引用の合図と取ると話がつながらない。質問の前の like はまず「たとえば」。',
      use: 'Any questions? Like, about parking?（質問ある？たとえば駐車とか）' },

    // R fix: "write the rule down" was a filler (K3). Now "Let's…" heard as an invitation to guess.
    // why: guess first ← "Let's…" heard as inviting Jim to work it out; refuses ← "you do not want…" heard as shutting
    //   the topic down
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'putway', seg: [21.3, 27.45],
      stem: 'When Jim asks what a demerit means, how does Dwight start his answer?',
      choices: ['He signals a simpler, indirect explanation', 'He asks Jim to guess the meaning first',
                'He refuses to explain the rule any further'], a: 0,
      cue: '質問の直後、Dwight の最初の数語。',
      line: '*Let’s put it this way.* You do not want to receive…',
      said: '「こう言っておこう。それを〜個もらうのは避けたいはずだ」と答える。',
      mean: '別の言い方をすると、の前置き。定義の代わりに分かりやすい形で答える。',
      trap: 'Let’s ～ で誘いや指示に聞こえやすいが、put it this way は言い換えの決まり文句。',
      use: 'Let’s put it this way: it’s not cheap.（まあ言ってみれば、安くはないね）' },

    // why: two ← "two of those" comes later in the chain; four, five ← the next numbers in the chain
    { id: 'n1', skill: 'number', level: 'B1', point: 'three', seg: [23.3, 29.95],
      stem: 'How many demerits lead to a citation?',
      choices: ['Two', 'Three', 'Four', 'Five'], a: 1, keep: true,
      cue: 'citation の直前の数。',
      line: '*Three demerits*, and you’ll receive a citation.',
      said: '「罰点3つで、警告書を1枚もらう」と言う。',
      mean: 'citation ＝ 正式な注意書き。罰点の次の段階。',
      trap: 'このあと数字が次々出るので混ざりやすい。数字と、その後ろの名詞をセットで聞く。',
      use: 'Three strikes and you’re out.（3回でアウトだよ）' },

    // R fix: the key was the only hedged choice ("barely", K6). The new distractor is hedged too, and built on the
    //   first step of the chain.
    // why: already a warning ← "warning" said often; almost a citation ← "three demerits… a citation", the first step,
    //   remembered without the count
    { id: 'i1', skill: 'infer', level: 'C1', point: 'chain', reveals: ['three', 'five', 'two', 'verbal'],
      seg: [27.4, 41.1],
      stem: 'From Dwight’s whole explanation, what follows about Jim’s single demerit?',
      choices: ['On its own, it barely matters', 'It already counts as a warning',
                'It almost earns him a citation'], a: 0,
      cue: '段階の数と、それぞれ何個必要かを数えてみて。',
      said: '罰点3つで1枚、それが5枚で違反、違反4つで口頭注意、と段階が延々と続く。',
      mean: '罰点1つでは何も起きないほど遠い道のり。それを真剣に語るのがおかしい。',
      trap: 'warning や citation が耳に残り重い罰に思えるが、段階の多さが本題。',
      use: 'It’s a long way from that.（そこまではまだ遠いよ）' },

    // R fix: "gets angry at Jim" was refuted by the tone more than the words. Now "scolds", which the why already named.
    // why: takes it as teasing ← Dwight's "Oh" read as a knowing reply; scolds ← "it is serious" read as a scolding
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'serious', seg: [29.4, 35.6],
      stem: 'How does Dwight take Jim’s “Now that sounds…” remark?',
      choices: ['At face value, and he keeps going happily', 'As a joke, and he plays along with it',
                'As a complaint, and he scolds Jim for it'], a: 0,
      cue: 'Jim の一言への返事と、そのあと続ける勢い。',
      line: 'Now that sounds serious. — Oh, *it is serious*.',
      said: 'Jim が「それは重大そうだ」と言い、Dwight は「ああ、重大だとも」と続ける。',
      mean: 'Jim のからかいを Dwight はそのまま受け取り、うれしそうに先へ進む。',
      trap: 'Oh で始まると冗談に乗る返事にも見える。返事のあと話を広げるかを見る。',
      use: 'Oh, it’s serious, believe me.（いや本当に深刻なんだって）' },

    // why: three ← "three" was the last number heard; four ← "four of those" follows right after
    { id: 'n2', skill: 'number', level: 'B1', point: 'five', seg: [31.95, 36.55],
      stem: 'How many citations lead to a violation?',
      choices: ['Three', 'Four', 'Five'], a: 2, keep: true,
      cue: 'violation の少し前、文の最初の数。',
      line: '*Five citations*, and you’re looking at a violation.',
      said: '「警告書5枚で違反1つになる」と言う。',
      mean: 'you’re looking at ～ ＝ ～が待っている。結果を予告する言い方で、見るという意味ではない。',
      trap: 'すぐあとに four が聞こえるので混ざりやすい。数字の直後の名詞で、どの段階か確かめる。',
      use: 'You’re looking at a two-hour wait.（2時間待ちになりますよ）' },

    // why: written warning ← it comes next in the chain; citation ← the earlier step, said twice
    { id: 'd2', skill: 'detail', level: 'B1', point: 'verbal', seg: [35, 38.4],
      stem: 'What do four violations get you?',
      choices: ['A verbal warning', 'A written warning', 'A citation'], a: 0,
      cue: 'Four of those のあと、warning の前の語。',
      line: 'Four of those, and you’ll receive a *verbal warning*.',
      said: '「違反4つで口頭での注意を受ける」と言う。',
      mean: 'verbal ＝ 口で言う。紙に書く written warning より一段軽い注意。',
      trap: 'warning が2回出るので、前に付く語を聞き落としやすい。名詞より前の形容詞に耳を向ける。',
      use: 'I’ll let you off with a verbal warning.（今回は口頭注意で済ませるよ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'keepup', seg: [37.2, 41.1],
      stem: 'Type what Dwight says: “___, and you’re looking at a written warning.” (3 words)', answer: 'keep it up',
      cue: 'verbal warning の直後、短い3語。',
      line: '*Keep it up*, and you’re looking at a written warning.',
      said: '「その調子で続けると、書面での注意になる」と言う。',
      mean: 'keep it up ＝ そのまま続ける。ここは悪いことを続けたら、という皮肉な使い方。',
      trap: 'keep‿it‿up が「キーピラップ」と一語のようにつながる。p と t が次の母音にくっつく。',
      use: 'Great job, keep it up!（いいね、その調子！）' },

    // why: one ← "a written warning" heard as a single step; four ← the number from the line before
    { id: 'n3', skill: 'number', level: 'B2', point: 'two', reveals: ['hurt', 'thatll'], seg: [37.2, 46.4],
      stem: 'How many written warnings bring the disciplinary review?',
      choices: ['One', 'Two', 'Four'], a: 1, keep: true,
      cue: 'written warning の直後、of those の前。',
      line: 'a written warning. *Two of those*, that’ll land you in a world of hurt…',
      said: '「書面注意2つで、ひどい目にあう」と言う。',
      mean: 'of those が前の written warning を指す。2つの文をつなげて聞く。',
      trap: '少し前の four が耳に残りやすい。of those が何を指すか、前の文で確かめる。',
      use: 'Two of those, please.（それを2つください）' },

    // R fix: blind-guessable (V2): "sent to work somewhere else" was weak. Now hurt = 傷つく (feelings), the
    //   other literal reading.
    // why: injured ← "hurt" taken literally; guilty ← "hurt" as hurt feelings (傷つく)
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'hurt', reveals: ['two', 'thatll'], seg: [40.8, 46.4],
      stem: 'When Dwight says what two written warnings lead to, what does he mean?',
      choices: ['You will be in very serious trouble', 'You will be hurt in a fight with him',
                'You will feel very guilty about it'], a: 0,
      cue: 'land you in のあと、in the form of の前。',
      line: 'Two of those, that’ll land you in *a world of hurt*.',
      said: '「それが2つで、ひどい目にあうぞ」と言い、懲戒の審査だと続ける。',
      mean: 'とんでもないトラブル、という大げさな脅し文句。',
      trap: 'hurt を文字通りに取るとけがや心の痛みの話になる。すぐ後の in the form of が中身を説明している。',
      use: 'Miss that flight, you’re in trouble.（その便を逃したら大変だよ）' },

    // why: that'd ← the 'll and 'd both shrink to a light sound; lend ← /æ/ vs /e/; that land ← 'll lost
    { id: 's2', skill: 'sound', level: 'C1', point: 'thatll', reveals: ['two'], seg: [40.8, 44],
      stem: 'Fill the gap: “Two of those, ___ you in a world of hurt.”',
      choices: ['that’ll land', 'that’d land', 'that’ll lend', 'that land'], a: 0,
      cue: 'those のあと、短くつながる2語。',
      line: 'Two of those, *that’ll land* you in a world of hurt.',
      said: '「それが2つで、ひどい目にあうことになる」。',
      mean: 'that’ll は「ザロー」のように t が弾み、ll が暗く短い。未来の結果を言い切っている。',
      trap: 'that’d なら「～だろう」と仮定になる。暗い l の音が残るか、d で止まるかを聞き分ける。',
      use: 'That’ll be twelve dollars.（12ドルになります）' },

    // R fix: a broken character in trap (短い); dropped the ear check: Dwight's superior can't be Dwight, and Jim's
    //   next line ("on my desk") settles the speaker.
    // why: Michael ← "immediate superior" filled in as the boss everyone knows; written by Jim ← "written up by me" heard
    //   as Jim's words
    { id: 'i2', skill: 'infer', level: 'B2', point: 'superior', seg: [43.9, 53.25],
      stem: 'After Dwight describes the final review, what does Jim point out?',
      choices: ['It would land on Jim’s own desk', 'It would land on their boss’s desk',
                'It would be written up by Jim himself'], a: 0,
      cue: 'my immediate superior の直後、短い一言と返事。',
      line: 'placed on the desk of my immediate superior. — *Which would be me.* — That is correct.',
      said: '審査書は直属の上司に届くと聞き、Jim が「それって僕だね」と返す。',
      mean: 'Jim が上の立場なので、罰の最後は Jim 自身に届くというオチ。',
      trap: 'superior で別の上司を思い浮かべやすい。直後の短い一言で誰かが決まる。',
      use: 'Which would be me, right?（それって僕のことだよね）' },

    // predict: the segment stops after Dwight's "What's that?"; the reveal plays Jim's answer
    // why: a definition ← a question usually gets an answer; an admission ← the word sounds made up, so Jim might own up
    { id: 'r1', skill: 'predict', level: 'B2', point: 'dontknow', seg: [53.2, 63], then: [63, 67],
      stem: 'When Dwight asks what the word means, what kind of answer comes next?',
      choices: ['A vague reply that keeps it scary', 'A clear definition of the word',
                'An admission that he made it up'], a: 0,
      cue: 'さっき Dwight 自身が使った答え方を思い出して。',
      line: 'What’s that? — Oh, *you don’t want to know*.',
      said: '「それ何？」と聞かれ、Jim は「知らない方がいいよ」とだけ答える。',
      mean: '中身を言わないことで、かえって怖さを残す答え方。',
      trap: '質問には説明が来ると思いやすい。脅す場面では、わざと答えないのも一つの手。',
      use: 'Trust me, you don’t want to know.（知らない方がいいって）' },

    // R fix: blind-guessable through the title (V2), and "such a rude word" was a filler. Shorter parallel choices. The
    //   `turn` reveal is gone with g2's new point. The stem said "the audience laugh"; the show has no studio audience.
    // why: forgot the word ← the stammer "What's a dis…" heard as Jim losing the word; too shy ← "don't want to know"
    //   heard as embarrassment
    { id: 'h1', skill: 'humor', level: 'C1', point: 'dontknow', reveals: ['three'], seg: [53.2, 66],
      stem: 'Why is Jim’s final answer funny?',
      choices: ['He uses Dwight’s own scare line on him', 'He admits he forgot the word he used',
                'He is too shy to say the word again'], a: 0,
      cue: '最後の一言と、前半の説明の言い方を比べて。',
      line: 'or you will receive a full… — Oh, *you don’t want to know*.',
      said: 'Jim が謎の言葉の罰で脅し、意味を聞かれると「知らない方がいい」と返す。',
      mean: '前半の「3つはもらいたくないはずだ」と同じ型で、立場が逆になった。',
      trap: '言いよどむのは Dwight の方で、Jim は余裕で答える。質問と答えの順で追う。',
      use: 'Let’s just say it’s not good.（まあ、良くはないとだけ言っておく）' },
  ]
};
