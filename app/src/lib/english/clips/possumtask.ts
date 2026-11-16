// REVIEW 2026-11-16: pass 7, fix 14, drop 0, new 0; ear checks 1 (s1 and x1/m1 taken off: both sources agree)
// Q: a1, a2, p1 and c2 lean on Leslie's eagerness; a viewer who knows her character guesses them more easily.
// “Andy Takes Down Pawnee's Notorious Opossum | Parks and Recreation” (the official Parks and Recreation channel,
// Season 2): Leslie briefs her possum task force; after the catch, an official from the mayor's office praises her,
// Andy introduces himself, a reporter is promised, Leslie tries to cash in a favor at once, and in a talking head she
// questions herself about whether they caught the right possum.
// Segments from the captions, words from whisper (2026-11-16). Untested on purpose: 9–31 s (the chase: overlapping
// shouts, whisper only), 31.4 s and 89.8 s ("poopy", "See you in hell, buddy": speaker and target unclear), 49–52 s
// (whisper "shoe shinest", captions "shoe shyness"), 55.8–59.4 s (captions garble "I do whatever I want"; only "no job"
// agrees), 80–83 s (whose "No." answers each favor is unclear). Names said: Leslie, Andy Dwyer. The man from the mayor's
// office is never named; his lines at 33.3, 59.4–72.8, 77.1 and 86.1 s are taken as one speaker, "the official".
// "No, we don't" (48.1 s) is a friend's, not named, so no item depends on who says it. No who items.
// EAR CHECK: 114.8 s h3 — whisper has "Uh." after the last question; the captions have nothing (music). Either way
//   no answer comes; check that the beat is a hesitation and not a cut
import type { Clip } from '../types.ts';

export const possumTaskForce: Clip = {
  id: 'possumtask', video: 'M0-c3bF-bdc', title: 'Andy Takes Down Pawnee\'s Notorious Opossum', dur: 127, wpm: 164,
  band: 'mid', tags: ['職場', 'お願い・断り'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: V2 (blind 60 %): "smarter possum" was weak; "one day" swaps the noun after "may only"
    // why: one day ← "may only… one" heard, the noun swapped; one trap ← "one" is said, attached to the wrong noun
    { id: 'd1', skill: 'detail', level: 'B1', point: 'chance', seg: [0, 5.3],
      stem: 'What reason does Leslie give for planning so carefully?',
      choices: ['They may only get one chance at it', 'They may only have one day to do it',
                'They only have one trap to use'], a: 0,
      cue: '最初の一文、catch の前。',
      line: 'We may *only get one chance* to catch this thing',
      said: '「捕まえるチャンスは一度きりかもしれない」と言う。',
      mean: 'だから作戦を立てて、慎重にやろうという流れ。',
      trap: 'one や may only は聞こえるが、つながる語が違う。one のすぐあとの名詞、chance まで聞く。',
      use: 'We may only get one shot at this.（チャンスは一度きりかも）' },

    // R fix: V2 (blind 70 %): "show how clever" was weak; katakana スマート (neat, simple) added
    // why: simple ← smart as katakana スマート (すっきり); fooled ← play = 演じる, so "act calm"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'smart', reveals: ['playit'], seg: [0, 5.3],
      stem: 'What does Leslie mean by “play it smart”?',
      choices: ['Think before acting, and not rush in', 'Keep it simple, and just move in fast',
                'Act calm so the possum is fooled'], a: 0,
      cue: '「one chance」と言ったあとの so 以下。',
      line: 'so we have to *play it smart*',
      said: '「だから、うまく立ち回らないと」と言う。',
      mean: 'play it smart ＝ 慎重に、賢く動く。play it safe（安全策をとる）と同じ形。',
      trap: 'play を「演じる」、smart をカタカナの「スマート」と取ると、ほかの2つに引かれる。',
      use: 'Let’s play it safe and leave early.（念のため早めに出よう）' },

    // R fix: V2 (blind 50 %): "play this" was the odd one; the weak "it" dropped is the nearer sound
    // why: had to ← "have to" shrinks to "hafta" and its v can sound like a d; have to play ← the weak "it" is
    //   swallowed by "play"
    { id: 's1', skill: 'sound', level: 'B2', point: 'playit', reveals: ['smart'], seg: [0, 5.3],
      stem: 'Fill the gap: “so we ___ smart.”',
      choices: ['have to play it', 'had to play it', 'have to play'], a: 0,
      cue: '「so we」のあと、短くつながる部分。',
      line: 'so we *have to play it* smart',
      said: '「だから、うまくやらないと」。have to は「ハフタ」、play it はつながる。',
      mean: 'これからの作戦の話なので現在形の have to。',
      trap: 'hafta の f を d と聞くと had to になる。it は弱く、play に飲まれやすい。',
      use: 'I have to get going.（もう行かなきゃ）' },

    // why: helped ← "just a simple…" and "I had a great task force" taken as real modesty (謙遜); lucky ← "simple" heard
    //   as "it was simple / easy", and "executed it" missed
    // anchor: 36.3–40.5 s "just a simple" frames "mastermind who planned the whole operation and executed it to
    //   perfection": the modest frame holds the biggest possible claim
    { id: 'c3', skill: 'infer', level: 'C2', point: 'mastermind', seg: [32.1, 41.1],
      stem: 'Which plain-English version keeps what Leslie means about her role?',
      choices: ['“I ran the whole thing, and I did it perfectly.”', '“I only helped; the task force did the real work.”',
                '“I made a plan, but mostly we just got lucky.”'], a: 0,
      cue: '「just a simple」のあとに続く、言葉の大きさ。',
      line: 'I was *just a simple mastermind* who planned the whole operation and *executed it to perfection*.',
      said: '「私はただの、作戦全体を立てて完璧に実行した、しがない黒幕ですから」と言う。',
      mean: '「ただの」「しがない」で謙遜の形をとり、中身は最大の自慢。形と中身のずれで手柄を全部取っている。',
      trap: '前の「いいチームだった」とつながり、謙遜に聞こえやすい。just a の後ろが大きいほど、遊びの謙遜。',
      use: 'I’m just a humble genius, really.（ただの謙虚な天才だよ）' },

    // R fix: C5: its key ("takes the credit") gives away c3's key, so it now reveals `mastermind`
    // why: steps back ← she does say "he actually caught the thing", heard as handing over the credit; luck ← "just a
    //   simple…" heard as playing the win down
    { id: 'g1', skill: 'gist', level: 'B2', point: 'cashin', reveals: ['eager', 'mastermind'], seg: [32.1, 90.6],
      stem: 'How does Leslie handle her success with the official?',
      choices: ['She takes the credit, then asks for favors', 'She steps back and lets Andy take the credit',
                'She plays the catch down as plain luck'], a: 0,
      cue: '前半のほめ言葉への返事と、後半の申し出への返事。',
      line: 'I need *so many special favors*.',
      said: '手柄は自分の作戦だと言い、市長室の申し出にはすぐ頼みごとを並べる。',
      mean: '成功を自分の得点にして、すぐに使おうとする流れ。Andy の紹介はついで。',
      trap: 'Andy が捕まえたと紹介するので譲ったように見えるが、その前に自分の手柄を言い切っている。',
      use: 'Can I cash in that favor now?（あの貸し、今使っていい？）' },

    // R fix: V2 (blind 60 %): "that name" was vague and alone in kind; all three now name what is denied
    // why: Mr. Dwyer ← the official has just used it, the keyword trap; not friends ← "we don’t" heard as denying "my
    //   friends", not "call me"
    { id: 'p2', skill: 'pragma', level: 'B2', point: 'nodont', reveals: ['radical'], seg: [42.9, 49.0],
      stem: 'When someone answers “No, we don’t”, what are they saying?',
      choices: ['Nobody calls him Andy Radical', 'Nobody calls him Mr. Dwyer', 'They aren’t really his friends'], a: 0,
      cue: '直前の文の動詞、call を思い出して。',
      line: 'Please, my friends *call me Andy Radical*. — *No, we don’t.*',
      said: '「友だちはアンディ・ラディカルと呼ぶ」に、すぐ「呼ばないよ」と返る。',
      mean: 'we don’t ＝ we don’t call you that。あだ名を否定している。',
      trap: '省かれた動詞は直前の call。friends を打ち消してはいない。',
      use: 'No, we don’t. Nobody says that.（言わないよ。誰もそんなこと）' },

    // why: shy ← praise ("Mr. Dwyer") often meets 照れ in Japanese; joking ← a silly nickname heard as self-mockery,
    //   the sincerity flip
    { id: 'a2', skill: 'attitude', level: 'B1', point: 'radical', seg: [42.9, 47.2],
      stem: 'How does Andy sound when the official calls him “Mr. Dwyer”?',
      choices: ['Proud, and keen on his new nickname', 'Shy, and uneasy about the praise',
                'Joking; he can’t stand the nickname'], a: 0,
      cue: '「Please」で始まる返事。',
      line: '*Please*, my friends call me *Andy Radical*.',
      said: '「どうぞ、友だちはアンディ・ラディカルって呼ぶんで」と言う。',
      mean: 'Please ＝「そんな堅苦しく呼ばないで」。自分でつけたあだ名を気に入っている。',
      trap: '日本語の「いえいえ」に近い照れと取りやすいが、すぐ自分のあだ名を名のっている。',
      use: 'Please, call me Ken.（どうぞ、ケンと呼んでください）' },

    // R fix: V2 (blind 65 %): the key alone talked about the pattern; "mixes up day and night" is a pattern reading too
    // why: mixes up ← "different time of day" heard as a slip; three jobs ← three "by…" titles heard as jobs, but "no
    //   job" ends the list
    { id: 'h2', skill: 'humor', level: 'C1', point: 'byday', seg: [48.0, 59.5],
      stem: 'Why does Andy’s “by day…” introduction get a laugh?',
      choices: ['He botches a hero’s “by day, by night” line', 'He mixes up which job is by day or night',
                'He boasts about holding down three jobs'], a: 0,
      cue: '真ん中の「by…」と、最後の短い一言。',
      line: 'By *different time of day*, Andy Radical… And by night… *no job*.',
      said: '「昼は靴みがき、別の時間帯はポッサム捕り、夜は…無職」と名のる。',
      mean: 'ヒーローの「昼は〜、夜は〜」の型をまねるが、真ん中も夜もしまらない。型が崩れるのが笑い。',
      trap: '名前が3つ出るので仕事自慢に聞こえるが、最後は no job。型のどこが崩れたかを聞く。',
      use: 'By day, a student; by night, a DJ.（昼は学生、夜はDJ）' },

    // R fix: V2 (blind 55 %): "a great risk" was a filler; "raise funds" keeps "opportunity" and misses "PR"
    // why: funds ← "opportunity" heard, "PR" missed; hire Andy ← Andy was just introduced, the keyword trap
    { id: 'd4', skill: 'detail', level: 'B1', point: 'pr', seg: [59.0, 62.6],
      stem: 'How does the official see the catch?',
      choices: ['As a great chance for good press', 'As a great chance to raise funds',
                'As a great reason to hire Andy'], a: 0,
      cue: '「We think」で始まる一文の最後。',
      line: 'We think that this is a *great PR opportunity*',
      said: '「これはいい PR の機会だと思う」と言う。',
      mean: 'PR opportunity ＝ 宣伝のチャンス。市の評判を上げられる、ということ。',
      trap: 'opportunity は長くて聞き落としやすい。直前の自己紹介に引っぱられず、文の最後まで聞く。',
      use: 'This is a great opportunity for us.（これは絶好の機会だ）' },

    // why: meeting with the mayor ← "the mayor's office" is said, in the wrong relation; TV crew ← "pictures" and
    //   "stop by" heard as filming
    { id: 'd2', skill: 'detail', level: 'B1', point: 'reporter', reveals: ['pr'], seg: [59.0, 68.4],
      stem: 'What has the official arranged for the task force?',
      choices: ['A reporter to interview them and take photos', 'A meeting where the mayor thanks them in person',
                'A TV crew to film them on the next catch'], a: 0,
      cue: '「so we’ve arranged」のあと。',
      line: 'we’ve arranged for *a reporter from the journal to stop by*… get some pictures',
      said: '新聞の記者が来て取材し、チームの写真を撮る、と伝える。',
      mean: 'the journal は地元の新聞。宣伝のチャンスなので記事にしてもらう。',
      trap: 'mayor が聞こえるので市長との面会を選びやすい。stop by は「立ち寄る」で、撮影隊ではない。',
      use: 'A reporter will stop by at three.（3時に記者が立ち寄ります）' },

    // R fix: V2 (blind 60 %): "owes Andy money" was weak; "Andy’s credit" is the wrong target of the same offer
    // why: Andy ← he did the catching, so the credit seems his: right mechanism, wrong target; Leslie owes ← the give-
    //   and-take frame (お返し) reverses who owes whom
    { id: 'i1', skill: 'infer', level: 'C1', point: 'favor', seg: [59.0, 73.0],
      stem: 'What does the official’s last offer suggest about the catch?',
      choices: ['It has earned Leslie credit with the mayor’s office',
                'It has earned Andy credit with the mayor’s office',
                'It means Leslie must now do the office a favor'], a: 0,
      cue: '「next time you need」で始まる一文。',
      line: 'next time *you need a special favor* from the mayor’s office, *give me a call*',
      said: '「市長室に頼みがあったら電話して」と言う。',
      mean: '捕獲の成功で、Leslie は市長室に「貸し」ができた。頼みを聞くと申し出ている。',
      trap: '日本語の「お返し」の感覚で、Leslie が借りを作ったと取りやすい。you need なので頼むのは彼女。',
      use: 'If you ever need anything, call me.（何かあったら電話して）' },

    // R fix: V2 (blind 60 %): "awkwardly" was weak; "save it for later" reads "I will" as a promise for the future
    // why: later ← "I will" heard as a promise to call some day; polite ← the Japanese frame: an open offer heard as
    //   社交辞令
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'eager', reveals: ['favor'], seg: [68.3, 78.2],
      stem: 'How does Leslie take the offer?',
      choices: ['Eagerly, as if she could use it at once', 'Gladly, but she’ll save it for later',
                'Politely, though she won’t really call'], a: 0,
      cue: '「Oh my God」のあと、いくつ頼みがあるか。',
      line: 'Oh my God, I will. I need *so many special favors*. *Which one should I choose?*',
      said: '「もちろん！特別な頼みはいっぱいある。どれにしよう？」とすぐ乗る。',
      mean: '「今度」の申し出を、その場で使おうとしている。張り切りすぎが笑い。',
      trap: '「今度電話して」は社交辞令になりやすいが、彼女は本気で受け取り、すぐ選び始める。',
      use: 'Oh, I will. Trust me.（ええ、絶対そうする）' },

    // R fix: V2 (blind 50 %): "think of a favor" was not his job; "warns of limits" reads the later "business hours"
    //   back in
    // why: limits ← the later "business hours" read back into this "Well"; agrees ← "well" heard as "okay, then",
    //   ignoring "don’t"
    { id: 'm1', skill: 'marker', level: 'B2', point: 'well', reveals: ['donthave'], seg: [73.0, 79.55],
      stem: 'What does the official’s “Well…” do before his reply?',
      choices: ['Gently corrects what she has assumed', 'Warns her the offer has its limits',
                'Agrees with her and moves things on'], a: 0,
      cue: '「Which one should I choose?」への返事の最初。',
      line: '*Well*, you don’t have to choose, right?',
      said: '「どれにしよう」に、「いや、選ばなくていいでしょ」と返す。',
      mean: 'この Well は、相手の思い込みを柔らかく直す前置き。今すぐ一つ選ぶ話ではない。',
      trap: 'Well のあとは「選ばなくていい」で、制限の話ではない。Well＋否定は、やんわり訂正の合図。',
      use: 'Well, you don’t have to decide now.（いや、今決めなくていいよ）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'donthave', seg: [77.5, 79.55],
      stem: 'Type the reply: “Well, ___ choose, right?” (4 words)', answer: 'you don\'t have to',
      cue: '「Well」のすぐあと、ひと続きの4語。',
      line: 'Well, *you don’t have to* choose, right?',
      said: '「選ばなくていいでしょ」。t は消え、have to は「ハフタ」。',
      mean: 'don’t have to ＝「〜しなくていい」。must not（してはいけない）とは違う。',
      trap: 'you don’t が「ユドン」とつながる。4語あると数えてから書く。',
      use: 'You don’t have to pay me back.（返さなくていいよ）' },

    // why: when not to call ← a considerate reading that fits "what time do you sleep"; sleeps badly ← "at night" and
    //   "go to sleep" heard as about her own sleep
    { id: 'd3', skill: 'detail', level: 'B1', point: 'night', seg: [82.6, 86.45],
      stem: 'Why does Leslie want to know when he goes to sleep?',
      choices: ['Her best ideas tend to come at night', 'She wants to know when not to phone him',
                'She sleeps badly and stays up late'], a: 0,
      cue: '質問のあと、’Cause で始まる理由。',
      line: '’Cause *my best ideas usually come to me at night*.',
      said: '「何時に寝る？いいアイデアはたいてい夜に浮かぶから」と聞く。',
      mean: '夜中に思いついたら電話したい、ということ。',
      trap: '寝る時間を聞くのは気づかいに聞こえるが、理由は自分のアイデアの都合。',
      use: 'My best ideas come in the shower.（いい考えはシャワー中に浮かぶ）' },

    // R fix: V2 (blind 65 %): "asking her office hours" was weak; "keep calls short" is the nearer misreading of the
    //   limit
    // why: short ← the limit heard as on length, not time; agrees ← "Let’s… shall we?" heard as an eager yes (〜しましょう)
    { id: 'p1', skill: 'pragma', level: 'B2', point: 'hours', reveals: ['night'], seg: [82.6, 88.6],
      stem: 'What is the official doing with his “Let’s…, shall we?” reply?',
      choices: ['Turning down calls at night, but kindly', 'Asking her to keep her calls short',
                'Agreeing to hear her ideas after work'], a: 0,
      cue: '夜の話のすぐあと、hours の前の語。',
      line: 'Let’s *stick to business hours*, shall we?',
      said: '「仕事の時間内にしておきましょうか」と返す。',
      mean: '「夜の電話はやめて」を、Let’s と shall we で柔らかく言う断り方。',
      trap: 'Let’s は「〜しよう」と前向きに聞こえるが、ここは条件をつけて線を引いている。',
      use: 'Let’s keep it short, shall we?（手短にしましょうか）' },

    // R fix: V2 (blind 55 %): "what time do you wake up" was the odd one; "only work things" reads "business" as the
    //   topic
    // why: work things ← "business" heard as the topic, not the hours; short calls ← reads the limit as about length,
    //   not time
    // anchor: 86.5–87.8 s "stick to business hours" answers "What time do you usually go to sleep?… at night"
    //   (83.2–86.4
    //   s): the limit is on *when* she calls, so only a reply that moves the calls into the day fits
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'hours', seg: [82.6, 88.6],
      stem: 'Which reply from Leslie would match what the official meant?',
      choices: ['Oh, sure. Nine to five it is, then.', 'Sure. Only work things, I promise.',
                'Don’t worry, I’ll keep my calls short.'], a: 0,
      cue: '夜の話に対して、彼が何を区切ったか。',
      line: 'Let’s *stick to business hours*, shall we?',
      said: '夜中のアイデアの電話をほのめかした Leslie に、「仕事の時間内で」と返す。',
      mean: '区切ったのは話題や長さでなく、電話してよい時間帯。わかったなら「昼のうちに」と受けるのが自然で、ほかは聞き流した返事。',
      trap: '柔らかい言い方なので話が続くと思いやすい。返事は、相手が区切ったものに合わせる。',
      use: 'Sure. Business hours only, got it.（了解、業務時間内だけね）' },

    // why: certain ← the first "Yes" heard as the answer; the wrong one ← the "No" heard as the bottom line
    { id: 'i3', skill: 'infer', level: 'B2', point: 'sure', seg: [96.0, 103.9],
      stem: 'From her first three answers to herself, how sure is Leslie?',
      choices: ['Fairly sure, though not completely', 'Completely sure it’s the right one',
                'Pretty sure that it’s the wrong one'], a: 0,
      cue: '「Yes」「No」「Maybe」の順番に注目。',
      line: 'Am I sure…? *Yes.* Am I *quite* sure? *No.* Am I sure *enough*? *Maybe.*',
      said: '「確か？はい。完全に？いいえ。十分に？たぶん」と自問する。',
      mean: 'sure → quite sure → sure enough と基準が変わるたび答えが弱まる。それなりに確か、程度。',
      trap: '最初の Yes や No だけで決めやすい。3つまとめて聞く。',
      use: 'Am I sure? Not quite.（確か？いや、完全には）' },

    // why: pride ← "As a city official… ask myself a lot of questions" taken at face value; regret ← "would I feel
    //   badly? Of course" taken as the bottom line
    { id: 'g2', skill: 'gist', level: 'C1', point: 'doubts', reveals: ['sure', 'depends'], seg: [96.0, 116.0],
      stem: 'What does Leslie’s talk to the camera mostly show?',
      choices: ['Doubts she would rather not look at closely', 'Pride in how carefully she made her choice',
                'Regret that the possum had to be caught'], a: 0,
      cue: '自分への質問に、はっきり答えられているか。',
      said: 'ポッサムが本当に目当ての一匹か、自分に質問を重ねるが、どれもはっきりしない。',
      mean: '質問を重ねるのは、確信がないのを正面から見ないため。慎重さの形をとった不安。',
      trap: '「公務員として自問する」は立派に聞こえるが、答えが全部ぼやけている。',
      use: 'I have my doubts, honestly.（正直、ちょっと疑ってる）' },

    // R fix: V2 (blind 50 %) + §9.6: the key was the only two-part answer; all three are now parallel, and "likely"
    //   softened to "might"
    // why: couldn’t cope ← "live with myself" read with the force of "Of course" carried over; needs facts ← "depends"
    //   read as real caution, the literal hedge
    // anchor: 103.6–108.1 s "would I feel badly? Of course" then the bigger question "Could I live with myself?" gets
    //   the weaker "That depends": the stronger the question, the softer the answer, so the guilt has a limit
    // retired: for the draws (play 3+ under g2 drew no C2): g2 reveals its point
    { id: 'c1', skill: 'attitude', level: 'C2', point: 'depends', reveals: ['sure'], seg: [103.4, 108.4], retired: true,
      stem: 'After “Of course”, how does her “That depends” land?',
      choices: ['Her guilt has limits; she might cope', 'Her guilt is huge; she couldn’t cope',
                'She can’t say yet; it needs more facts'], a: 0,
      cue: '2つの質問の重さと、答えの強さの差。',
      line: 'would I feel badly? *Of course.* Could I live with myself? *That depends.*',
      said: '「悪いと思う？もちろん。自分を許せる？場合による」と答える。',
      mean: '軽い問いには「もちろん」、重い問いには「場合による」。罪悪感はあっても、結局は平気だと伝わる。',
      trap: 'depends を慎重さと取りやすいが、条件はもう出そろっている。重い問いほど答えが弱いのが遊び。',
      use: 'Would I do it again? That depends.（またやるか？場合によるね）' },

    // R fix: V2 (blind 55 %): "annoyed at being asked" was weak; "admits it may be the wrong possum" carries her
    //   earlier "Maybe" to the end
    // why: wrong possum ← her earlier "Maybe" carried to the end; forgets ← "Uh" read as a lost train of thought
    { id: 'h3', skill: 'humor', level: 'C1', point: 'uh', reveals: ['doubts'], seg: [108.0, 116.0],
      stem: 'Why does the very end of her talk get a laugh?',
      choices: ['Her method fails her own last question', 'She forgets what she was going to ask',
                'She admits it may well be the wrong possum'], a: 0,
      cue: '最後の質問のあと、答えが来るかどうか。',
      line: 'Does doing so *help me make decisions*? … Uh.',
      said: '「自分に質問するのは大事。それで決められる？…えっと」と詰まる。',
      mean: '質問すれば決められる、という方法そのものに答えられない。方法が自分に返ってくるのが笑い。',
      trap: '詰まったのを物忘れと取りやすいが、質問しているのは彼女自身。答えがないこと自体がオチ。',
      use: 'Does that help? Uh… not really.（役に立つ？えっと…あまり）' },
  ]
};
