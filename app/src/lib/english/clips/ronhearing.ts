// “Ron Swanson Answers Questions with Questions | Parks and Recreation” (the official Parks and Recreation channel,
// Season 2): at Leslie's abuse-of-power hearing, Tom jokes, Leslie's apology to him goes wrong, Ron dodges every
// question, and Leslie uses her date Justin as a witness to find out whether he enjoyed their evening.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈ 169 s; whisper's lines after 177 s are
// hallucinations. Untested: 52.8–58 s (the "white stallion / little brown pony" line), 90.0 s "quid pro quo" (Latin,
// world knowledge). The captions' "own game" (whisper "own gain") stays out of every line.
// REVIEW 2026-11-16: pass 7, fix 16, drop 0, new 0; ear checks 2
// Open: no C2 (native-tier) items yet; GUIDE §10 asks for 2–4, and ref/types.ts has no 'C2' level.
// EAR CHECK: 21.7 s r1 — the cut falls after Tom's “…for her own gain”, before “Thank you, Tom”
// EAR CHECK: 83.4 s h3 — “No, I wouldn't have” is the questioner, not Ron (by voice; captions don't say)
import type { Clip } from '../types.ts';

export const ronHearing: Clip = {
  id: 'ronhearing', video: 'byYsenDcx0A', title: 'Ron Swanson Answers Questions with Questions', dur: 190, wpm: 184,
  band: 'mid', tags: ['職場'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 60 %: "Tom told the truth" was weak; new distractors, all about Leslie (K3/K5)
    // why: lied ← "what happened last night" + "the truth coming out" right after; party rules ← the party talk later
    { id: 'g1', skill: 'gist', level: 'B1', point: 'charge', seg: [0, 16.2],
      stem: 'What is the hearing set up to decide?',
      choices: ['Whether Leslie misused her position', 'Whether Leslie lied about last night',
                'Whether Leslie’s party broke work rules'], a: 0,
      cue: '最初の長い文の後半、whether のあと。',
      line: 'we will determine whether you are guilty of *abusing your power*.',
      said: '委員会が昨夜のことを細かく調べ、職権乱用があったかを決めると告げる。',
      mean: '聴聞会の目的。レスリーが立場を使って何かを得たかどうかが問題。',
      trap: 'last night や truth など目立つ語に引っぱられやすい。目的は whether のあとに来る。',
      use: 'We’ll go over every detail.（細かいところまで全部確認します）' },

    // why: confess ← "the truth coming out" read as her own confession; nervous ← "coming out" read as something
    //   being exposed
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'truth', reveals: ['forward'], seg: [12.2, 16.2],
      stem: 'When asked if she has anything to say, how does Leslie sound?',
      choices: ['Sure the facts will clear her', 'Ready to confess what she did',
                'Nervous about what will come out'], a: 0,
      cue: 'Just that のあとの動詞句。',
      line: 'Just that I’m *looking forward to* the truth coming out.',
      said: '「真実が明らかになるのが楽しみです、とだけ」と答える。',
      mean: 'looking forward to ＝ 楽しみにしている。調べられても平気という自信。',
      trap: 'truth coming out は「ばれる」ときにも使うので不安に読みやすい。前の動詞を聞く。',
      use: 'I can’t wait to hear the results.（結果を聞くのが待ちきれない）' },

    // predict: the segment stops after Tom's first sentence; `then` plays Leslie's thanks and his twist
    // R fix: blind 70 %: "speak in private" was a filler; an example backing the praise replaces it (K3)
    // why: warmer ← Leslie's "Thank you" makes the praise sound sincere; example ← praise is often backed with a
    //   story, the usual script
    { id: 'r1', skill: 'predict', level: 'B2', point: 'cant', seg: [12.2, 21.7], then: [21.7, 26.9],
      stem: 'After Tom praises Leslie, what kind of line is coming?',
      choices: ['A twist that takes the praise back', 'A thank-you, then more of the same praise',
                'An example of her helping people'], a: 0,
      cue: 'would like to say の would が何を予告するか。',
      line: 'I *would like to* say that… — Thank you, Tom. — *But I can’t*, because Leslie loves using people…',
      said: '「人を利用しない人だと言いたい…でも無理、大好きだから」。',
      mean: 'would like to say は「言いたいところだが」。ほめて落とす前置き。',
      trap: 'Thank you が入るので本気に聞こえる。would like to の後は but が多い。',
      use: 'I’d love to help, but I can’t.（手伝いたいけど、無理なんだ）' },

    // R fix: blind 50 %: the choices weren't parallel; now each pairs a move with "recorded" (K5/K6)
    // why: permission ← the reply to "If I may" is usually "go ahead"; refusal ← "on the record" = 記録に残る, read
    //   as a reason not to speak
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'record', seg: [27.2, 32.95],
      stem: 'When Leslie asks to speak to Tom on the record, what does the reply do?',
      choices: ['Says she needn’t ask: it’s all recorded', 'Says she may go ahead: it’ll be recorded',
                'Says she can’t: it would all be recorded'], a: 0,
      cue: 'If I may, Phil のあとの返事。all に注目。',
      line: 'I’d like to say something to Tom on the record. — *This has all been on the record.*',
      said: '「記録に残る形で言いたい」に「全部最初から記録されてる」と返す。',
      mean: 'わざわざ頼む必要はない、という指摘。正式な場なので発言はもう全部記録中。',
      trap: 'If I may への返事は「どうぞ」が普通なので許可と思いやすい。中身が「もう記録済み」かを聞く。',
      use: 'Off the record, I agree with you.（ここだけの話、賛成です）' },

    // R fix: blind 50 %: "one of the teachers" is refuted by a plain "No"; a second ex-wife reading replaces it (K3)
    // why: divorced ← "ex-wife" heard without "soon-to-be"; remarried ← "ex-wife" and "wife" both heard, put together
    //   the wrong way round
    { id: 'd1', skill: 'detail', level: 'B2', point: 'wendy', seg: [32.85, 40.8],
      stem: 'When asked if Wendy is a teacher, who does Tom say she is?',
      choices: ['His wife, soon to be divorced', 'His ex-wife, divorced last year',
                'His ex-wife, who has married again'], a: 0,
      cue: 'No のあと。ex-wife の前の部分。',
      line: 'No, she’s my *soon-to-be ex-wife*…',
      said: '「いや、もうすぐ元妻になる人」と答える。今はまだ妻。',
      mean: 'soon-to-be ＝ もうすぐ〜になる。離婚の手続き中だと分かる。',
      trap: 'ex-wife だけ聞くと、もう離婚済みに思える。前の soon-to-be で時期が変わる。',
      use: 'Meet my soon-to-be boss.（もうすぐ上司になる人です）' },

    // why: someone new ← "future wife" heard without "then-to-be" linking it back to her; glad ← "hopefully" attached
    //   to the divorce
    { id: 'i1', skill: 'infer', level: 'C1', point: 'future', reveals: ['wendy'], seg: [36.95, 40.9],
      stem: 'What does Tom’s add-on after “ex-wife” reveal?',
      choices: ['He hopes to remarry her later', 'He plans to marry somebody new',
                'He’s glad the marriage is ending'], a: 0,
      cue: 'ex-wife のあと、hopefully で始まる部分。',
      line: 'soon-to-be ex-wife, *and hopefully then-to-be future wife*.',
      said: '「もうすぐ元妻、そして願わくはその後また未来の妻」と付け足す。',
      mean: '離婚したあと、同じ人ともう一度結婚したいと思っている。まだ未練がある。',
      trap: 'future wife だけ聞くと新しい相手の話に思える。then（その後）が同じ人につないでいる。',
      use: 'Hopefully, we’ll meet again.（またお会いできたらいいですね）' },

    // R fix: blind 55 %: "introduced her date first" was weak; the literal 目の前で reading is now its own choice (K3)
    // why: showed off ← "in front of" = 目の前で; ended ← "friendship" + "romance" read as a swap
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'infront', seg: [41.1, 46.7],
      stem: 'In Leslie’s first apology to Tom, what does she admit?',
      choices: ['She let a new romance matter more than him', 'She showed off her new romance in front of him',
                'She ended their friendship for a romance'], a: 0,
      cue: 'really sorry のあと、put A ___ B の形。',
      line: 'I put a new romance *in front of* an old friendship.',
      said: '「新しい恋を古い友情より優先してしまった」と謝る。',
      mean: 'put A in front of B ＝ AをBより先にする、優先する。',
      trap: 'in front of を「目の前で」と訳すと、見せつけた話に聞こえる。put と組むと順番・優先の意味。',
      use: 'Don’t put work in front of your health.（健康より仕事を優先しないで）' },

    // R fix: blind 50 %: the choices weren't parallel; all three now start "Her new wording" (K5)
    // why: rehearsed ← a reworded apology can sound practiced; blaming ← "man-child" heard as an accusation
    { id: 'h2', skill: 'humor', level: 'C1', point: 'ruin', seg: [46.6, 52.7],
      stem: 'Why does Tom cut in during Leslie’s second try at the apology?',
      choices: ['Her new wording makes him sound small', 'Her new wording sounds rehearsed, not sincere',
                'Her new wording blames him for the fight'], a: 0,
      cue: '2回目の言い直しで、自分が何と呼ばれたか。',
      line: 'I put a beautiful man in front of an *adorable man-child*. — *You’re ruining it.*',
      said: '「美しい男性を、かわいい大人こどもより優先した」と言い直し、トムが「台無しだ」と止める。',
      mean: '謝るたびに相手を下げる言い方になり、謝罪にならない。',
      trap: '言い直しは丁寧にも聞こえるが、比べられたトムの呼び名が下がっている。その語を聞く。',
      use: 'You’re ruining the moment.（いい雰囲気が台無しだよ）' },

    // R fix: the cue said "enjoy being", the key's own words (S3). Blind: wrong, otherwise kept
    // why: find out ← answering with questions sounds like gathering information; afraid ← protecting a friend is
    //   the usual sitcom motive
    { id: 'i2', skill: 'infer', level: 'B2', point: 'hostile', seg: [60.1, 72.2],
      stem: 'In Ron’s interview, what is the reason behind his plan?',
      choices: ['He enjoys being difficult at government hearings', 'He wants to find out what the committee knows',
                'He is afraid of saying something that hurts Leslie'], a: 0,
      cue: 'When it comes to … のあと、好きな証人の型。',
      line: 'the only type of witness I enjoy being is *a hostile one*.',
      said: '「政府の聴聞会では、協力しない証人になるのが好き」と言う。',
      mean: 'hostile witness ＝ 非協力的な証人。わざと手こずらせるのを楽しんでいる。',
      trap: '質問で返すと情報集めに聞こえるが、理由は enjoy。目的より好みの話。',
      use: 'When it comes to food, I’m easy.（食べ物に関してはこだわりません）' },

    // R fix: blind 55 %: "rude voice" was weak; "Ron answers it himself" is the near miss (K3)
    // why: Ron answers ← right mechanism, wrong speaker; left early ← "No, I wouldn't have" taken as Ron's answer
    { id: 'h3', skill: 'humor', level: 'C1', point: 'stayed', reveals: ['wouldyou'], seg: [72.9, 84.7],
      stem: 'Why is the exchange about whether Ron would have stayed funny?',
      choices: ['The questioner ends up answering his own question', 'Ron turns it around, then answers it himself',
                'Ron admits he would have left the party early'], a: 0,
      cue: '最後の No, I wouldn’t have. は誰の声か。',
      line: 'Would you have? — *No, I wouldn’t have.*',
      said: 'ロンは質問を質問で返し、最後は質問した側が「私なら残らない」と答えてしまう。',
      mean: 'ロンは一度も答えていない。答える人と聞く人が入れ替わるのがおかしい。',
      trap: '最後の一言をロンの答えと思うと「途中で帰った」と読める。声の主を確かめる。',
      use: 'Answer my question first.（まず私の質問に答えて）' },

    // R fix: blind 55 %: "Wouldn't you" added as a 4th sound-alike (V2)
    // why: Did ← "would you" links into a short "wudja", easy to hear as "didja"; Could ← only the first sound differs;
    //   Wouldn't ← a lost n't is easy to imagine back in
    { id: 's1', skill: 'sound', level: 'B2', point: 'wouldyou', seg: [80.0, 83.0],
      stem: 'Fill the gap: “I don’t know. ___ have?”',
      choices: ['Would you', 'Wouldn’t you', 'Could you', 'Did you'], a: 0,
      cue: 'I don’t know. のあと、have の前の2語。',
      line: 'I don’t know. *Would you* have?',
      said: '「さあね。あなたなら？」と返す。would you は「ウッジュ」とつながる。',
      mean: 'Would you have? ＝ あなたならそうした？という仮定。',
      trap: 'd と y がつながると did you と似る。後ろの have で would と分かる。',
      use: 'What would you have done?（あなたならどうしてた？）' },

    // R fix: blind 55 %: "praising" was weak; an "Oh = I see" reading replaces it (K3)
    // why: doesn't know ← "What constitutes a promise?" just before makes him seem confused; accepting ← "Oh" heard
    //   as 「なるほど」
    { id: 'p2', skill: 'pragma', level: 'C1', point: 'latin', seg: [87.0, 93.5],
      stem: 'After the questioner defines a promise, what is Ron’s reply really doing?',
      choices: ['Dodging again with an off-topic question', 'Asking because he doesn’t know the term',
                'Accepting the answer now it’s been defined'], a: 0,
      cue: '定義を言われたあと、Oh で始まる返事。',
      line: 'A quid pro quo. — *Oh, do you know Latin?*',
      said: '見返りの約束を意味するラテン語で説明され、「へえ、ラテン語できるの？」と返す。',
      mean: '答えずに別の質問で話をそらしている。最初に言った作戦どおり。',
      trap: 'Oh を「なるほど」と取ると、納得したように聞こえる。答えたか、別の質問をしたかで判断する。',
      use: 'Why do you ask?（どうしてそんなこと聞くの？）' },

    // R fix: blind 65 %: "sorry the questions are over" was weak; new distractor (K3)
    // why: worried ← a witness's "Are we done?" can sound anxious; hurt ← "Thank you, Ron" heard as being cut off
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'done', seg: [93.2, 97.9],
      stem: 'When the questioner thanks Ron, how does he seem to feel?',
      choices: ['Eager to get out of there', 'Worried he said too much', 'Hurt that they cut him off'], a: 0,
      cue: 'Thank you, Ron. のあとの短い問い。',
      line: 'Thank you, Ron. — *Are we done?*',
      said: '「ありがとう、ロン」に「もう終わり？」と返す。最後まで質問の形。',
      mean: '早く切り上げたい気持ち。礼にも答えず、帰ることしか頭にない。',
      trap: 'Are we done? は不安そうにも聞こえるが、ロンはずっと非協力的。流れの中で読む。',
      use: 'Are we done here?（もう終わりでいい？）' },

    // why: teacher ← "teachers from the local rec center" in the question; job ← "work for the government" in the
    //   question, with "don't" weak
    { id: 'd2', skill: 'detail', level: 'B1', point: 'guest', seg: [97.9, 107.3],
      stem: 'How does the next witness explain why he was there that night?',
      choices: ['He was a guest at a friend’s dinner', 'He was one of the rec center teachers',
                'He was there for his government job'], a: 0,
      cue: '長い質問のあと、No で始まる答え。',
      line: 'No, I was simply attending *a dinner party at my friend’s house*.',
      said: '「いいえ、友人の家のディナーパーティーに出ていただけです」。',
      mean: '政府の人でも先生でもない、ただの客という立場。',
      trap: '質問の中に government や teachers が出るので引っぱられやすい。答えの部分だけを聞く。',
      use: 'I’m just here for the party.（パーティーに来ただけです）' },

    // why: not sure ← "become clear" heard as "it isn't clear (to me)"; obvious ← "clear" = 明らか, read as "it's
    //   clear already"
    { id: 'p3', skill: 'pragma', level: 'B2', point: 'clear', seg: [107.15, 110.45],
      stem: 'When the committee asks why this witness is there, what does Leslie do?',
      choices: ['She puts off explaining until later', 'She admits she isn’t sure herself',
                'She says the reason is obvious'], a: 0,
      cue: 'Why is he here? への短い答え。will に注目。',
      line: 'Why is he here, Ms. Knope? — *That will become clear*.',
      said: '「彼はなぜここに？」に「いずれ分かります」と答える。',
      mean: '今は説明しない、という先送り。本当の目的を隠したまま進めたい。',
      trap: 'clear ＝ 明らか、だけで訳すと「見れば分かる」に聞こえる。will become で「これから」の話。',
      use: 'It’ll all make sense soon.（すぐに分かりますよ）' },

    // R fix: blind 50 %: "promises" was weak; "see her again" is the near miss, from his own later ask (K3)
    // why: teachers ← her questions keep mentioning the rec center teachers; see again ← he asks to see her later,
    //   turned the wrong way round
    { id: 'g2', skill: 'gist', level: 'B2', point: 'motive', reveals: ['pleasant', 'business'], seg: [110.45, 170.0],
      stem: 'What is Leslie really trying to find out from this witness?',
      choices: ['Whether he enjoyed their evening together', 'Whether he wants to see her again',
                'Whether he knew the guests were teachers'], a: 0,
      cue: 'pleasant と言われたあとの追及と、最後のひと言。',
      line: 'So did you get that? He said *amazing* and *awesome*.',
      said: '証人に「楽しかったか」をしつこく聞き、最後に「amazing と awesome だって」と喜ぶ。',
      mean: '聴聞会の証人を使って、デートの感想を確かめる。',
      trap: 'rec center teachers が何度も出るので本題に見えるが、最後に取って付けた一言。',
      use: 'Did you have a good time?（楽しかった？）' },

    // R fix: blind 60 %: "proof he understands the oath" was weak; new distractor. Its choices and trap name the
    //   charge, so it reveals g1's point (K3/B1)
    // why: covering up ← he mentions "no abuse of power", so pushing looks like cross-examination; for the record ←
    //   "Be specific… under oath" sounds like a formal demand
    { id: 'i3', skill: 'infer', level: 'C1', point: 'pleasant', reveals: ['charge'], seg: [112.85, 127.5],
      stem: 'Why does Leslie keep pushing after his first description of the evening?',
      choices: ['His word for it sounds too lukewarm to her', 'She suspects he’s hiding an abuse of power',
                'She needs a clearer answer for the record'], a: 0,
      cue: 'very pleasant time と言われたあとの質問の並び。',
      line: 'Could you define *pleasant*? Did you have a good time? Did you have a great time?',
      said: '「pleasant を定義して。good？ great？」と強い言葉を求める。',
      mean: 'pleasant は「感じがよい」程度で物足りない。もっと言ってほしい。',
      trap: '直前に abuse of power が出て尋問に見えるが、聞くのは楽しさの度合いだけ。',
      use: 'Could you be more specific?（もう少し具体的に言ってもらえますか）' },

    // R fix: blind 70 %: "answer quickly" was weak; a second "under" reading replaces it (K3)
    // why: pressure ← "under" + stress, as in "under pressure"; authority ← "under" + a formal hearing, as in "under
    //   her"
    { id: 'f3', skill: 'phrase', level: 'B2', point: 'oath', seg: [121.9, 127.5],
      stem: 'What does Leslie remind the witness of, right after “Be specific”?',
      choices: ['He has sworn to tell the truth', 'He is under a lot of pressure', 'He is under her authority here'], a: 0,
      cue: 'remember that you’re のあとの2語。',
      line: 'Be specific, and do remember that you’re *under oath*.',
      said: '「具体的に。宣誓していることをお忘れなく」と念を押す。',
      mean: 'under oath ＝ うそをつかないと誓った状態。法廷ドラマ風の言い方で迫る。',
      trap: 'under から under pressure（重圧）を連想しやすい。oath（誓い）まで聞く。',
      use: 'Do you swear to tell the truth?（真実を話すと誓いますか）' },

    // why: another party ← "the night before" + party; ate too much ← "dinner party" from his earlier answer
    { id: 'd3', skill: 'detail', level: 'B2', point: 'asleep', seg: [129.3, 138.1],
      stem: 'What reason does the witness give for falling asleep?',
      choices: ['He’d stayed up all night on a work case', 'He’d been at another party the night before',
                'He’d eaten too much at the dinner party'], a: 0,
      cue: 'so のあと、had to で始まる部分。',
      line: 'I’ve been given a case the night before, so I had to *stay up all night working on it*.',
      said: '前の晩に案件を任され、徹夜で取り組んでいたと説明する。',
      mean: 'case ＝ 仕事の案件。寝たのは退屈だったからではない、という弁解。',
      trap: 'night before と party が近いと、別のパーティー帰りと思いやすい。理由は had to の後。',
      use: 'I stayed up late finishing a report.（報告書を仕上げて夜更かしした）' },

    // R fix: blind 70 %: "change the subject" was weak; a disagreement reading replaces it (K3)
    // why: correcting ← "I mean" is a normal way to fix a mistake; disagreeing ← "I mean, look" often comes before a
    //   polite "no"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'fillers', seg: [131.3, 135.6],
      stem: 'Right after he is told he fell asleep, what do his short fillers show?',
      choices: ['He’s flustered and hunting for words', 'He’s correcting a fact she got wrong',
                'He’s politely disagreeing with her'], a: 0,
      cue: 'so sorry のあと、本題までの短い語の連続。',
      line: 'Oh God, I’m so sorry. … *I mean, look, I, uh, you know*, I’ve been given a case…',
      said: '「ごめん」のあと、短い語を重ねてから理由を話す。',
      mean: '言葉をつなぎながら言い訳を探している。慌てていて、すぐに説明できない。',
      trap: 'I mean を「訂正」と覚えていると修正に聞こえる。中身のない語が続くのは迷いの合図。',
      use: 'Well, I mean, it’s complicated.（いや、まあ、ややこしいんだ）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'forward', seg: [140.1, 143.3],
      stem: 'Type what he says: “Are you kidding me? I was ___.” (4 words)', answer: 'looking forward to it',
      cue: 'kidding me のあと、I was に続く4語。',
      line: 'Are you kidding me? I was *looking forward to it*.',
      said: '「冗談でしょ、楽しみにしてたんだ」と言う。',
      mean: 'look forward to ＋名詞 ＝ 〜を楽しみにする。to のあとは it（デート）。',
      trap: 'forward to it がつながり、to が聞き取りにくい。決まった形で覚えておく。',
      use: 'I’m really looking forward to the weekend.（週末が本当に楽しみ）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'hour', seg: [148.8, 154.6],
      stem: 'When will the committee announce what it decides?',
      choices: ['In about half an hour', 'In about an hour', 'In about two hours'], a: 1, keep: true,
      cue: 'take a break のあと、文の最後。',
      line: 'we’ll let you know what we decide in *about an hour*.',
      said: '「休憩を取って、1時間ほどで結果を知らせる」。',
      mean: 'about an hour ＝ 1時間くらい。an は母音の前の形。',
      trap: 'about an が「アバウタン」とつながり、an が聞こえにくい。half や two が入るかを聞く。',
      use: 'I’ll call you back in ten minutes.（10分後に折り返します）' },

    // R fix: blind 70 %: the key was the only "Acting formal"; a formal-and-cool reading now pairs with it (K6)
    // why: cool ← "can't talk about it right now" taken at face value; annoyed ← "I'm in the middle of official
    //   business" heard as a complaint
    { id: 'a3', skill: 'attitude', level: 'C1', point: 'business', seg: [156.1, 162.5],
      stem: 'When the witness asks to see her later, how does Leslie come across?',
      choices: ['Acting formal, but clearly thrilled', 'Acting formal, and cool toward him',
                'Annoyed that he interrupts her work'], a: 0,
      cue: 'official business と断ったあと、最後の一言。',
      line: 'I’m in the middle of official business… — Okay. — *But yes, yes, you will.*',
      said: '「公務中なので今は話せない」と堅く言ったあと、「でも、うん、会えるよ」と付け足す。',
      mean: '仕事の顔を保とうとしても、うれしさが隠せない。yes の繰り返しが本音。',
      trap: '前半だけ聞くと冷たい断りに見える。But のあとに本音が来る。',
      use: 'Sorry, I’m in the middle of something.（ごめん、今ちょっと手が離せない）' },
  ]
};
