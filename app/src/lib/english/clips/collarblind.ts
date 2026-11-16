// REVIEW 2026-11-16: pass 3, fix 16, drop 0, new 0; ear checks 1
// “"I Am Collar Blind" - The Office US” (the official The Office channel, Best of Season 2): Michael tours the
// warehouse for the camera crew, introduces its staff, and gives a speech on white collar versus blue collar.
// Segments from the captions, words from whisper (2026-11-16). Music to ≈ 22 s; talk ends at ≈ 117 s, and whisper's
// lines before 23 s and after 117 s are hallucinations. Untested: 22–28 s (a Lost reference), the Brangelina
// explanation (celebrity knowledge), 91–98 s ("I try / but try to stay out of it" differs between the sources; a Good
// Will Hunting reference). The warning man's name differs ("Kev" / "Joe") and stays out of every line.
// EAR CHECK: 114.2 s p1 — the cut falls after "And you know why not?", before "Because"
import type { Clip } from '../types.ts';

export const collarBlind: Clip = {
  id: 'collarblind', video: '1PQLrSWZPZs', title: '"I Am Collar Blind"', dur: 141, wpm: 194, band: 'fast',
  tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    // R fix: V2, blind 70 % ("which room" was a filler). Now "where to film next": a place reading that fits a tour.
    // why: where to film ← "where" taken as a place, and the crew is filming; what went wrong ← the apology just
    //   before reads as a problem to discuss
    { id: 'f1', skill: 'phrase', level: 'B1', point: 'wherewere', seg: [27.9, 37.4],
      stem: 'After apologizing, what does Michael’s short question do?',
      choices: ['Gets them back to what they were doing', 'Asks the crew where to film next',
                'Asks the crew what went wrong'], a: 0,
      cue: '謝ったあと、So で始まる質問。',
      line: 'I’m so sorry about that. *So, where were we?*',
      said: '「ごめんなさい。で、どこまで話したっけ？」と言う。',
      mean: 'Where were we? は中断のあと話を元に戻す決まり文句。場所の質問ではない。',
      trap: 'where を場所と取ると、次の撮影場所の話になる。So とセットで「本題に戻る」合図。',
      use: 'Sorry about that. Where were we?（失礼、どこまで話したっけ）' },

    // R fix: V2, blind 50 % ("offering to take them for her" was weak). Now "are her notes finished" (-ing missed).
    // why: feeling all right ← "are you okay" taken as a health check; finished ← "taking notes" heard as a check on
    //   work already done
    { id: 'pr1', skill: 'pragma', level: 'B2', point: 'notes', seg: [30.8, 37.4],
      stem: 'When Michael turns to Pam, what is he doing?',
      choices: ['Politely asking her to take notes', 'Checking that she’s feeling all right',
                'Asking if her notes are finished'], a: 0,
      cue: 'Pam の名前のあと、疑問文の形。',
      line: 'Pam, *are you okay taking notes* then?',
      said: '「Pam、メモを取ってもらっていい？」と聞き、お礼を言う。',
      mean: 'Are you okay ～ing? は、相手に作業を頼むていねいな形。体調の質問ではない。',
      trap: 'okay を「大丈夫？」と体調の意味に取りやすい。後ろに ～ing が続けば依頼。',
      use: 'Are you okay driving tonight?（今夜、運転お願いしていい？）' },

    // R fix: N7/C5: "Interviewing Darryl for the foreman job" hinted at d2's key (Darryl + foreman). Now a safety
    //   interview ("biggest fear"). Blind 45 %.
    // why: safety ← "what is your biggest fear?" in a warehouse sounds like a safety talk; shipments ← "getting all
    //   the shipments out" is said, but as Darryl's answer
    { id: 'g1', skill: 'gist', level: 'B1', point: 'tour', seg: [31, 67.9],
      stem: 'What is Michael mainly doing in this part?',
      choices: ['Showing a camera crew around the warehouse', 'Interviewing Darryl about a safety problem',
                'Checking that the shipments go out on time'], a: 0,
      cue: '最初の「So」から、彼が周りに出す指示。',
      line: 'So let’s *meet the warehouse*. Let’s *get some shots*.',
      said: '「倉庫のみんなに会おう。撮って」と言い、人を一人ずつ紹介していく。',
      mean: 'ドキュメンタリーの撮影隊に倉庫を案内している。shots は映像のカット。',
      trap: 'biggest fear は安全の話のようだが、紹介の流れの一つ。次々と人を紹介している。',
      use: 'Let me show you around.（ご案内しますね）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'fearq', seg: [46.9, 49.85],
      stem: 'Type Michael’s question: “Darryl, ___?” (5 words)', answer: 'what is your biggest fear',
      cue: 'Darryl と呼んだあとの質問全部。',
      line: 'Darryl, *what is your biggest fear*?',
      said: '「Darryl、一番怖いものは何？」と聞く。',
      mean: 'インタビュー風の質問。what is your が「ワッツョ」と一続きになる。',
      trap: 'is と your が弱く、what’s your に近く聞こえる。弱い語も一つずつ書く。',
      use: 'What’s your biggest fear about flying?（飛行機で一番怖いのは？）' },

    // R fix: V2, blind 60 %; "his team worries about the cameras" was close to the key (K1). Now "already behind".
    //   The ear check is gone: the inference rests on the words and who is asking, not on tone.
    // why: crew hurt ← a warehouse + cameras suggests safety worries; behind ← "getting all the shipments out" heard as
    //   a report that they're late
    { id: 'i1', skill: 'infer', level: 'C1', point: 'dig', reveals: ['fear'], seg: [46.9, 54.6],
      stem: 'Given the moment, what is Darryl suggesting with his answer?',
      choices: ['That this visit is getting in their way', 'That the crew might get hurt in here',
                'That his team is already behind on orders'], a: 0,
      cue: '質問している本人が、今何をしているか。',
      line: 'someone would *distract us* from getting all the shipments out…',
      said: '撮影隊を連れた上司に、一番の心配は「仕事の邪魔をされること」と答える。',
      mean: 'その「誰か」は目の前の訪問者。真顔で、今まさに邪魔されていると伝えている。',
      trap: '一般的な答えとして聞くと皮肉に気づかない。答えが今の状況に当てはまるかを考える。',
      use: 'No offense, but we’re kind of busy.（悪いけど、ちょっと忙しいんだ）' },

    // R fix: N7: "someone else being made the foreman" implied d2's key (Darryl is the foreman). Now "losing track of
    //   the shipments" (a word said, in the wrong relation).
    // why: getting hurt ← the usual warehouse worry (safety); losing track ← "shipments" is said, but the fear is
    //   being distracted
    { id: 'd1', skill: 'detail', level: 'B2', point: 'fear', seg: [49.4, 54.6],
      stem: 'What does Darryl say worries him most?',
      choices: ['Someone keeping them from getting orders out', 'Someone getting hurt on the warehouse floor',
                'Someone losing track of the shipments'], a: 0,
      cue: '「My biggest fear is that」のあと。',
      line: 'someone would *distract us from getting all the shipments out*…',
      said: '「誰かに気を散らされて、荷物を全部出せなくなること」と答える。',
      mean: '仕事の邪魔をされるのが一番困る、という答え。shipments は出荷する荷物。',
      trap: '倉庫なのでけがの心配を想像しやすいが、言っているのは distract（気を散らす）。動詞を聞く。',
      use: 'Please don’t distract the driver.（運転手の気を散らさないで）' },

    // why: Roy ← "not" is weak and Roy is the last name heard; neither ← "actually" heard as doubt about the title
    { id: 'd2', skill: 'detail', level: 'B1', point: 'foreman', seg: [50.9, 58.2],
      stem: 'According to Michael, who is the warehouse foreman?',
      choices: ['Darryl', 'Roy', 'Neither of them'], a: 0,
      cue: '紹介の続き、actually のあたり。',
      line: 'Darryl is *actually the foreman* here, and *not Roy*…',
      said: '「実は Darryl が現場の責任者で、Roy じゃない」。',
      mean: 'foreman ＝ 現場の監督。actually は「思われているのと違って」という訂正の合図。',
      trap: 'not が弱く、Roy の名前だけが耳に残りやすい。名前の前の否定語まで聞く。',
      use: 'She’s actually the manager here.（実は彼女がここの責任者です）' },

    // why: next summer ← "sometime" blurs the small word before summer; spring, fall ← the season word is lost after "sometime"
    { id: 'n1', skill: 'number', level: 'B1', point: 'summer', seg: [59.8, 64.3],
      stem: 'When are Roy and Pam getting married?',
      choices: ['This spring', 'This summer', 'This fall', 'Next summer'], a: 1, keep: true,
      cue: 'marrying Pam のあと、時の言い方。',
      line: 'Roy is actually going to be marrying Pam *sometime this summer*.',
      said: '「Roy はこの夏のどこかで Pam と結婚する」。',
      mean: 'sometime ＝ 日はまだ決まっていない。this summer で今年の夏。',
      trap: 'sometime に気を取られると this を聞き落とす。季節と前の小さな語をセットで聞く。',
      use: 'Let’s get lunch sometime next week.（来週どこかでランチしよう）' },

    // R fix: V2, blind 65 % (the key was the only one about the names). "Too rough for Pam" is now "mixes up the
    //   names by mistake".
    // why: an animal ← a ram is a strong, stubborn male sheep; a mistake ← "Ram" doesn't sound like either name, so it
    //   seems he got them wrong
    { id: 'h1', skill: 'humor', level: 'C1', point: 'ram', seg: [66, 77.6],
      stem: 'Why is Michael’s “It’s a Ram thing” funny?',
      choices: ['His blend of their two names sounds silly', 'He compares Roy to a strong, stubborn animal',
                'He mixes up their two names by mistake'], a: 0,
      cue: '「Roy and Pam」のあと、二人の名前の音。',
      line: 'Roy and Pam… it’s a *Ram*. It’s a Ram thing.',
      said: '有名カップルの呼び名をまねて、Roy と Pam を合わせて「ラム」と呼ぶ。',
      mean: '名前を混ぜた呼び名は華やかなはずが、羊の名前になる。ねらいが外れた笑い。',
      trap: 'ram（雄羊）の意味から乱暴さの話と取りやすいが、笑いは名前の組み合わせのずれ。',
      use: 'That nickname didn’t really work.（そのあだ名はイマイチだった）' },

    // R fix: V2, blind 80 %. The stem said "the warning", which also gave away f2's key; it's gone. The distractors
    //   now come from the moments just before (the wedding, the Ram joke).
    // why: the wedding ← "marrying Pam this summer" is the last thing said about Roy; the Ram joke ← it comes right
    //   before, so the beating seems to be about it
    { id: 'd3', skill: 'detail', level: 'B1', point: 'liking', seg: [77.5, 83.5],
      stem: 'Why might Roy try to beat the man up?',
      choices: ['He heard that the man likes Pam', 'He heard the man joked about the wedding', 'He heard the man laughed at “Ram”'],
      a: 0,
      cue: '「Roy heard about」のあと。',
      line: 'I bet Roy heard about *you liking Pam*.',
      said: '「Roy は君が Pam を好きだと聞いたんだ。殴りに来るぞ」と言う。',
      mean: 'Pam は Roy の婚約者。だから怒るかもしれない、という警告。',
      trap: 'heard about のあとが長く、liking が弱く聞こえる。about の後ろを最後まで聞く。',
      use: 'I heard about you moving. Congrats!（引っ越すんだって？おめでとう）' },

    // R fix: V2, blind 65 % ("ready to fight" was a weak fit for a thank-you). Now "annoyed at gossip".
    // why: a joke ← his light, quick reply reads as brushing it off; gossip ← "heard about you…" makes it sound like
    //   talk behind his back
    { id: 'i2', skill: 'infer', level: 'C1', point: 'nodeny', reveals: ['headsup', 'liking'], seg: [77.5, 87.9],
      stem: 'What does the man’s reply to the warning suggest?',
      choices: ['He doesn’t deny that he likes Pam', 'He thinks the warning is a joke', 'He’s annoyed that people gossip'],
      a: 0,
      cue: '警告のすぐあと、返事の最初の語。',
      line: '*Thanks for the heads up*…',
      said: '殴られるぞと言われて、「教えてくれてありがとう」とだけ返す。',
      mean: '否定せずにお礼を言うのは、話が本当だと認めているのと同じ。',
      trap: '軽い口調だと冗談として流したように聞こえるが、「そんなことない」とは言っていない。',
      use: 'Thanks for letting me know.（知らせてくれてありがとう）' },

    // R fix: V2, blind 60 % ("looking out for Pam" was weak). Now "keeping his secret from Roy".
    // why: cheer up ← "heads up" read like 顔を上げて (chin up); a secret ← a thank-you after private news read as
    //   thanks for keeping quiet
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'headsup', seg: [77.5, 87.9],
      stem: 'What is the man thanking him for?',
      choices: ['Telling him ahead of time', 'Trying to cheer him up', 'Keeping his secret from Roy'], a: 0,
      cue: '「Thanks for the」のあとの2語。',
      line: 'Thanks for the *heads up*…',
      said: '「殴られるかも」という話に「教えてくれてありがとう」と返す。',
      mean: 'heads up ＝ 前もっての注意・知らせ。仕事でもよく使う。',
      trap: 'heads up を「顔を上げて」と取ると「元気出して」になる。一まとまりで覚える。',
      use: 'Just a heads up: the train is late.（一応言っとくと、電車遅れてる）' },

    // why: he tried ← the past "heard" just before pulls it into the past; he'd try ← 'll and 'd are both tiny sounds
    { id: 's1', skill: 'sound', level: 'B2', point: 'helltry', seg: [79.8, 83.5],
      stem: 'Fill the gap: “I bet ___ to beat you up.”',
      choices: ['he’ll try', 'he tried', 'he’d try'], a: 0,
      cue: 'I bet のあと、he に付く小さな音。',
      line: 'I bet *he’ll try* to beat you up.',
      said: '「きっと殴りに来るぞ」と、これからのことを言う。',
      mean: 'he’ll は he will の短い形で、ほぼ「ヒル」。これからの予想を表す。',
      trap: 'll の音は小さく、he’d や tried と迷いやすい。I bet（きっと〜）は先の話によく使う。',
      use: 'I bet it’ll rain tomorrow.（明日はきっと雨だね）' },

    // R fix: V2, blind 55 % ("money back" was a filler). Now "advice for staying away from Roy".
    // why: staying away ← "if he does" heard as a plan to avoid him; hide behind ← back taken literally (後ろ)
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'back', seg: [83.1, 88],
      stem: 'Right after the thanks, what does the next line offer?',
      choices: ['Help if Roy starts a fight', 'Advice for staying away from Roy', 'A place to hide behind him'], a: 0,
      cue: 'お礼のすぐあと、if he does の前。',
      line: 'I *got your back* if he does.',
      said: '「もし来たら、俺が味方するよ」と言う。',
      mean: 'I got your back ＝ 味方する、守る。if he does は「彼が殴りに来たら」。',
      trap: 'back から「後ろ」を想像しやすいが、背中を守る、つまり味方するという意味。',
      use: 'Don’t worry, I’ve got your back.（大丈夫、味方だよ）' },

    // R fix: V2, blind 60 %. "Stern officer" is now "solemn leader at a ceremony" ("troops" + "important day").
    // why: worried ← "important day" heard as pressure; solemn ← "troops" + "an important day" sound like a ceremony
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'troops', seg: [98.1, 105.2],
      stem: 'How does Michael sound as he starts his speech to everyone?',
      choices: ['Fired up, like a coach before a game', 'Worried, as if a hard day is coming',
                'Solemn, like a leader at a ceremony'], a: 0,
      cue: '「All right」から、同じ意味の言葉の重ね方。',
      line: 'All right, troops. This is an *important day*. *Big day*.',
      said: '「よし、みんな。今日は大事な日だ。ビッグな日だ」と呼びかける。',
      mean: 'troops は冗談まじりの呼びかけ。big day と言い直し、気合いを入れている。',
      trap: 'troops を軍隊と取ると式典のように聞こえる。ここは「さあみんな」程度。',
      use: 'Okay, team, big day today!（よしみんな、今日は大事な日だ）' },

    // R fix: V2, blind 80 % ("compete" was weak). Now "the groups don't get along" (the wrong implication of "two
    //   groups").
    // why: shirts ← collar taken literally as clothing; don't get along ← "you may… see two groups here" read as
    //   naming a problem
    { id: 'g2', skill: 'gist', level: 'B2', point: 'message', reveals: ['collarblind'], seg: [98.1, 117.5],
      stem: 'What is Michael’s main message to the workers?',
      choices: ['He sees them all as one team, not two groups', 'He can’t tell the groups apart by their shirts',
                'He knows the two groups don’t get along'], a: 0,
      cue: '「two groups」のあと、but で始まる文。',
      line: 'But *I don’t see it that way*.',
      said: '「事務職と現場、二つのグループに見えるだろうが、私はそうは見ない」と話す。',
      mean: '事務と倉庫を分けない、みんな同じ仲間だというのが言いたいこと。',
      trap: 'shirts は collar（襟）を服の話と取った読み方。white-collar は事務職の意味。',
      use: 'We’re all on the same team here.（ここではみんな仲間だ）' },

    // predict: the segment stops before "Because"; the reveal plays the rest
    // R fix: V2, blind 60 % ("a list" was weak). Now "a story about himself" competes with the key.
    // why: a story ← a speech that turns to "why" often brings a personal story; calling out ← it's a question, so the
    //   workers' turn seems next
    { id: 'p1', skill: 'predict', level: 'B2', point: 'because', seg: [104, 114.2], then: [114.2, 117.5],
      stem: 'Right after “And you know why not?”, what kind of line is coming?',
      choices: ['His own short answer to the question', 'A story from his own past at work',
                'A pause for the workers to answer'], a: 0,
      cue: 'この形の質問は、誰が答えることが多い？',
      line: 'And you know why not? *Because I am collar blind.*',
      said: '「なぜか分かる？」と自分で聞き、すぐ「私は collar blind だから」と答える。',
      mean: '自問自答は、決めぜりふの前置き。聞き手に答えさせるつもりはない。',
      trap: '疑問文なので相手が答える番に思えるが、話し手はすぐ自分で答える。演説によくある型。',
      use: 'And you know what? It worked.（それでね、うまくいったんだ）' },

    // R fix: V2, blind 85 % (the key was the only one with a "phrase"). The distractors are now readings of the
    //   sound-alike too.
    // why: colors ← collar heard as color, so "color blind" taken as a sight problem; shirts ← collar taken literally
    //   as clothing
    { id: 'h2', skill: 'humor', level: 'C1', point: 'collarblind', seg: [108.9, 117.5],
      stem: 'What makes Michael’s final line a joke?',
      choices: ['It plays on a saying about treating all races alike', 'It sounds like he can’t see colors',
                'It sounds like he never looks at their shirts'], a: 0,
      cue: 'collar という語が、何の語に似て聞こえるか。',
      line: 'Because I am *collar blind*.',
      said: '「私は collar blind（襟が見えない）だから」としめくくる。',
      mean: 'color blind（人種で人を分けない）のもじり。襟の色、つまり職種で分けないと言う。',
      trap: '文字通り目や服の話と取りやすい。似た音の決まり文句に気づけば、しゃれだと分かる。',
      use: 'I don’t care where you’re from.（出身なんて気にしないよ）' },

    // R fix: V2, blind 85 %. "Unsure" is now "careful not to hurt anyone" (a Japanese politeness frame around race).
    // why: embarrassed ← "blind" heard as admitting a weakness; careful ← a line about race read as a delicate,
    //   hedged moment
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'proud', reveals: ['because'], seg: [108.9, 117.5],
      stem: 'How does Michael seem to feel about his final words?',
      choices: ['Proud, as if he’s said something clever', 'Embarrassed, as if admitting a weakness',
                'Careful, so that no one feels hurt'], a: 0,
      cue: '自分で問いを出したあとの、答えの言い方。',
      line: 'And you know why not? *Because I am collar blind.*',
      said: '「なぜか分かる？」と間をおき、「私は collar blind だから」と言い切る。',
      mean: '自分で考えた言葉を決めぜりふのように出している。うまいことを言ったつもり。',
      trap: 'blind を弱点の告白と取りやすい。前の自問自答の間が、自慢の合図。',
      use: 'Get it? Pretty clever, right?（分かる？うまいでしょ）' },
  ]
};
