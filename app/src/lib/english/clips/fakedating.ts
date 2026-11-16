// REVIEW 2026-11-16: pass 4, fix 18, drop 1, new 0; ear checks 10
// REVIEW open: none
// “When fake dating goes too far | Parks and Recreation” (the official Parks and Recreation channel, Season 5): at a
// cookout, Ann and Tom keep up a fake relationship to win a bet, while Ron's slow grilling leaves everyone starving.
// Segments from the captions, words from whisper (2026-11-16). Left untested: Ron's “grill virgins” talking head
// (106–123 s, sexual metaphor), the glitter stretch (144–168 s, no captions after 154 s) and the last lines
// (169–175 s). Whisper's repeated lines after 176 s are hallucinations. No predict item.
// EAR CHECK: 7.8 s d1 — the man who refuses to sit (assumed Tom; whisper “Ann, I'm hungry”, captions “and i'm hungry” at 1.4 s) says “No, Jerry. It's dirty…”; the stem says only “the man”
// EAR CHECK: 12.2 s i1 — Ann offers the blanket “from your house” and Tom answers (speakers assumed from the names and “your house”)
// EAR CHECK: 22.1 s pr1 — “No such luck, Donna” is Tom, teasing (key rests on tone)
// EAR CHECK: 29.5 s s1 h1 — “didn't”: the t nearly silent (both have “didn't”); the two lines are two different voices
// EAR CHECK: 30.7 s a1 — “Shocking that…” is dry sarcasm, not real surprise (key rests on tone)
// EAR CHECK: 58.6 s s2 — “we'd be”: the 'd barely audible (both have “we'd”); check it isn't heard as “we're”
// EAR CHECK: 88.8 s a2 — Ron's “Fine.” is grudging (key rests on tone; speaker assumed Ron, answering Chris)
// EAR CHECK: 94.6 s h2 — Ron (assumed) gives the water-down answer
// EAR CHECK: 103.8 s x1 — “back off” linked into one stretch
// EAR CHECK: 136.2 s x2 — “pace yourself”: the s of pace and yourself run together
import type { Clip } from '../types.ts';

export const fakedating: Clip = {
  id: 'fakedating', video: 'o5027VakBfw', title: 'When fake dating goes too far', dur: 196, wpm: 206, band: 'fast',
  tags: ['恋愛', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: blind 55 % — the key was the only two-part reason; all three are now "X, and Y".
    // why: muddy ← "dirty" heard as wet ground, "linens" missed; tired legs ← "my legs are tired" said just before
    { id: 'd1', skill: 'detail', level: 'B1', point: 'linens', seg: [6.4, 11.3],
      stem: 'Why does the man refuse to sit on the ground?',
      choices: ['It’s dirty, and he’s in nice clothes', 'It’s muddy, and he’s in good shoes',
                'His legs hurt, and he’d struggle to get up'], a: 0,
      cue: '「sit on the ground」への返事、二つの理由。',
      line: 'It’s *dirty* and I’m *wearing my summer linens*.',
      said: '「地面は汚いし、夏用の麻の服を着てるから」と断る。',
      mean: 'linens ＝ 麻の服。服を汚したくないという、ちょっと気取った理由。',
      trap: 'legs are tired はその前の文句。断る理由は No のあとに来る。',
      use: 'I can’t, I’m wearing white pants.（無理、白いズボンをはいてるから）' },

    // R fix: blind 50 % — the key was the only complaint; the "forgot" distractor is now "upset" too.
    // why: forgot ← "That's not a picnic blanket" taken literally; warm ← "merino wool" heard as praise for warmth
    { id: 'i1', skill: 'infer', level: 'B2', point: 'throw', seg: [11.8, 17.9],
      stem: 'When Ann brings a blanket from his house, what does Tom’s reply show?',
      choices: ['He’s upset she used something fancy of his', 'He’s upset she forgot the real picnic blanket',
                'He’s pleased she found something so warm'], a: 0,
      cue: '「That’s not a picnic blanket」の次の文。',
      line: 'That’s not a picnic blanket. That’s a *merino wool throw* for my *Eames chair*.',
      said: '「ピクニック用じゃない。高級いす用のウールのひざ掛けだ」と言う。',
      mean: '高い物を地面に敷かれそうで、むっとしている。持ち物自慢も少し入っている。',
      trap: 'not a picnic blanket だけ聞くと「忘れた」に聞こえる。次の文が本当の不満。',
      use: 'That’s not a towel, that’s my good shirt!（それタオルじゃなくて、いいシャツだよ）' },

    // R fix: blind 70 % — the key was the only "no"; "hopes luck will change" became a polite no (thanks for caring).
    // why: bad luck ← "luck" read literally, next to "trouble"; thanks ← a "no" to a worried question read as polite (日本語の「ご心配なく」)
    { id: 'pr1', skill: 'pragma', level: 'C1', point: 'luck', seg: [18, 26.8],
      stem: 'When Donna asks about trouble at home, what does Tom’s “No such luck” do?',
      choices: ['Says no, as if she hoped for trouble', 'Admits that they’ve had some bad luck',
                'Says no, and thanks her for caring'], a: 0,
      cue: '家のことを聞かれて、どう答え始めるか。',
      line: 'Do I sense trouble…? — *No such luck*, Donna.',
      said: '「何かもめてる？」と聞かれ、「おあいにくさま」と返して仲良しだと言い張る。',
      mean: '相手がもめごとを望んでいる、とからかって否定している。',
      trap: 'luck を文字通り取ると不運を認めたことに。お礼ではなく、相手の期待を外したとからかう返事。',
      use: 'Did you win? — No such luck.（当たった？ーそううまくはいかないよ）' },

    // R fix: blind 85 % — the title says "fake dating" and only the key was a pretence; "moving in" became the
    //        fake-dating trope (to make someone jealous), which the title fits too.
    // why: jealous ← the usual fake-dating script + the title; hiding a reunion ← "pretending" + "together" in the wrong relation
    { id: 'g1', skill: 'gist', level: 'B1', point: 'fake', seg: [18, 65.5],
      stem: 'What are Ann and Tom doing about their relationship?',
      choices: ['Acting as if they’re still together', 'Faking a romance to make someone jealous',
                'Hiding that they got back together'], a: 0,
      cue: '「huge mistake」のあと、今していること。',
      line: 'so *we’re pretending to still be together*.',
      said: '失敗に気づいたのに、まだ付き合うふりを続けている。',
      mean: 'pretending to ＝ 〜のふりをする。周りに見せるための芝居。',
      trap: 'ふりの恋と聞くと、誰かの気を引く芝居を思いやすい。本当に付き合って別れたあとの芝居。',
      use: 'Let’s just pretend everything’s fine.（何もなかったふりをしよう）' },

    // R fix: blind 60 % — only the key had a setup/punch shape; the main distractor is now the comeback the setup promises.
    //        reveals 'wouldnt' removed: s1 now tests "didn't" and shares this item's point.
    // why: prove them wrong ← "didn't" lost, the usual comeback script; different things ← two voices, so it sounds like a disagreement
    { id: 'h1', skill: 'humor', level: 'C1', point: 'last', seg: [26.4, 30.4],
      stem: 'What makes the couple’s first two lines to the camera funny?',
      choices: ['They set up a comeback, then agree with the critics', 'They set up a comeback, then prove the critics wrong',
                'They each recall the critics saying something different'], a: 0,
      cue: '「Everyone said…」のあと、二人目の返し。',
      line: 'Everyone said it *wouldn’t last*. — And it *didn’t*.',
      said: '「みんな続かないって言ってた」「で、続かなかった」と二人で言う。',
      mean: '普通は「でも続いた」と見返す流れ。そこで素直に認めるのがおかしい。',
      trap: '声が二人なので言い合いに聞こえるが、中身は同じ向き。Everyone said のあとは逆転を待って聞く。',
      use: 'Everyone said I’d quit, and I did.（やめるって言われて、本当にやめた）' },

    // R fix: blind 80 % — "said it wouldn't last" is a set phrase, so the gap was guessable from the script. The gap is now
    //        the reply "And it ___", where did/didn't both make sense blind. Same fact as h1, so it shares h1's point.
    // why: did ← the final t of didn't lost, and the comeback script expects "did"; doesn't ← the n heard, the tense ignored
    { id: 's1', skill: 'sound', level: 'B2', point: 'last', seg: [26.4, 30.4],
      stem: 'Fill the gap: “Everyone said it wouldn’t last.” “And it ___.”',
      choices: ['did', 'didn’t', 'doesn’t'], a: 1,
      cue: '「And it」のすぐあと、短い一語。',
      line: 'Everyone said it wouldn’t last. — And it *didn’t*.',
      said: '「続かないって言われてた」「で、続かなかった」。',
      mean: 'didn’t の t はほぼ消え、「ディドゥン」と短く終わる。n の鼻音が否定の目印。',
      trap: 'did に聞こえると「でも続いた」と見返す話になる。t が消えても、最後の「ン」を聞く。',
      use: 'I hoped it would rain, but it didn’t.（雨を期待したけど、降らなかった）' },

    // R fix: blind 70 % — one "No" against two "Yes" singled out the key; now two "No" choices.
    // why: really thought ← "shocking" taken at face value; went well ← "wasn't a success" with the n't lost, sarcasm read the other way
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'shock', seg: [30.2, 34.2],
      stem: 'When the couple says “Shocking that our…”, are they really surprised?',
      choices: ['No; they mean it was bound to fail', 'No; they’re joking it went well',
                'Yes; they really thought it would work'], a: 0,
      cue: '計画をどう呼んでいるか、その言い方に注目。',
      line: '*Shocking* that our *drunken plan* to move in together wasn’t a success.',
      said: '「酔った勢いの同居計画がうまくいかなかったなんて、驚きだね」と言う。',
      mean: '少しも驚いていない皮肉。drunken plan と自分で呼ぶ時点で当然の結果。',
      trap: 'Shocking を文字通り「驚いた」と取りやすい。自分を笑うときは、強い言葉ほど逆の意味。',
      use: 'Shocking, the train is late again.（驚いたね、また電車が遅れてる）' },

    // R fix: blind 90 % — "drink any more tonight" was a filler; now "take the other back", a real sense of take back.
    // why: return things ← "take back" read literally as returning goods (moving in = shopping); take back a partner ← the breakup sense of "take someone back"
    { id: 'p1', skill: 'phrase', level: 'B2', point: 'takebacks', seg: [34, 40.6],
      stem: 'In the flashback, what does “No take-backs” mean?',
      choices: ['Neither of them can cancel it later', 'Neither of them can return what they buy',
                'Neither of them can take the other back'], a: 0,
      cue: '「when we sober up」とつなげて考えて。',
      line: '*No take-backs* when we sober up, though, partner.',
      said: '「酔いがさめても、なしにはできないからね、相棒」と念を押す。',
      mean: 'take back ＝ 言ったことを取り消す。子どもの約束のような言い方で決定を固める。',
      trap: 'take back を「物を返品する」「よりを戻す」と取りやすい。言葉や約束にも使う。',
      use: 'I take it back, you were right.（さっきのは取り消す、君が正しかった）' },

    // why: week ← "first" caught, the short noun lost; month ← "another month" comes later in the same talk
    { id: 'n1', skill: 'number', level: 'B1', point: 'day', seg: [41.3, 45.5],
      stem: 'When did they realize moving in was a huge mistake?',
      choices: ['After the first day', 'After the first week', 'After the first month'], a: 0, keep: true,
      cue: '「After the first」の最後の一語。',
      line: '*After the first day*, we realized we had made a huge mistake.',
      said: '「最初の日のあとで、大失敗だと気づいた」と話す。',
      mean: 'たった1日で無理だと分かった、という早さが笑いどころ。',
      trap: 'あとで another month が出てくるので混ざりやすい。期間は、どの話のものかと結びつけて聞く。',
      use: 'After the first day, I felt at home.（初日のあとには、もうなじんでた）' },

    // R fix: blind 60 % — "keep sharing the same house" contradicts the breakup (filler); now "stop people asking".
    // why: feel sorry ← "everyone… saying" read as worry about pity (face-saving); questions ← "everyone… saying" read as nosy talk to stop
    { id: 'd3', skill: 'detail', level: 'B2', point: 'why', reveals: ['fake'], seg: [45.3, 55],
      stem: 'Why are Ann and Tom keeping up the act?',
      choices: ['So nobody gets to feel they were right', 'So their friends won’t feel sorry for them',
                'So people will stop asking questions about it'], a: 0,
      cue: '「so smug」の部分と、「That way」のあと。',
      line: 'That way *no one gets the satisfaction of being right*.',
      said: '「続くわけない」と得意げな人たちに、正しかったと思わせたくない。',
      mean: 'smug ＝ 得意げ。satisfaction of being right ＝「ほら見たことか」の満足。',
      trap: '「同情されたくない」と取りやすいが、ここは相手を勝たせたくない意地。',
      use: 'I won’t give him the satisfaction.（あいつを喜ばせるもんか）' },

    // R fix: seg was 2.7 s (< 3 s); now 51.9–56.1. Blind 60 %: only the key had "admit…, yet"; one distractor now does too.
    // why: critics wrong ← "they are" heard but "even though" missed; miss each other ← "but still" read as still in love
    { id: 'i3', skill: 'infer', level: 'C1', point: 'evenso', seg: [51.9, 56.1],
      stem: 'At the end of the explanation, what does the short added remark show?',
      choices: ['They admit the critics are right, yet hold out', 'They admit they miss each other, yet hold out',
                'They insist the critics are wrong about them'], a: 0,
      cue: '「being right」のすぐあと、短い付け足し。',
      line: '*Even though they are*, but still.',
      said: '「まあ、みんなが正しいんだけどね。でもさ」と付け足す。',
      mean: '負けを認めつつ、意地で芝居を続ける本音。but still で言い切らずに終わる。',
      trap: 'they are だけでは何が「そう」なのか分かりにくい。前の being right を受けている。',
      use: 'I know it’s silly, but still.（ばかげてるのは分かってる、でもね）' },

    // R drop: m1 (marker, "More importantly") — blind 90 %; the marker is transparent at TOEIC 700+ (V3), and any
    //         stronger distractor would argue with the dictionary, not the audio. Never shipped: deleted.

    // R fix: seg was 2.6 s (< 3 s); now 56.1–60.1. Blind 55 %: "we'd been" didn't fit the sentence; now "we're".
    // why: we'll ← 'd and 'll both shrink to almost nothing; we're ← the d swallowed, "we be" heard as one syllable
    { id: 's2', skill: 'sound', level: 'B2', point: 'wed', seg: [56.1, 60.1],
      stem: 'Fill the gap: “…that ___ together for another month.”',
      choices: ['we’ll be', 'we’d be', 'we’re'], a: 1,
      cue: '「dollars that」のあと、弱く短い音。',
      line: '…that *we’d be* together for another month.',
      said: '「あと1か月一緒にいる、とかけた」。we’d の d はほとんど聞こえない。',
      mean: '過去の bet のあとなので will が would（’d）になる。',
      trap: '’d と ’ll はどちらも小さく、聞き分けにくい。前の動詞が過去なら ’d と考える。',
      use: 'I promised I’d be home by ten.（10時までに帰るって約束した）' },

    // why: $100 ← the "a" before the number primes "a hundred"; $10,000 ← "thousand" caught, an extra syllable imagined
    { id: 'n2', skill: 'number', level: 'B1', point: 'amount', reveals: ['wed'], seg: [56.3, 60.3],
      stem: 'How much did he bet Donna?',
      choices: ['$100', '$1,000', '$10,000'], a: 1, keep: true,
      cue: '「I bet Donna a」のすぐあと。',
      line: 'I bet Donna *a thousand dollars* that we’d be together…',
      said: '「あと1か月は一緒にいる、と Donna に千ドルかけた」と言う。',
      mean: 'a thousand ＝ 千。別れたことがばれたら、この大金を払うことになる。',
      trap: 'hundred と thousand は最初の音が違う。th の音を聞き取る。',
      use: 'I bet you ten dollars he’s late.（彼が遅れるのに10ドルかける）' },

    // R fix: blind 90 % — "too relaxed" and "tired of it" were fillers; now a ストレス reading and a "said it often" reading.
    // why: stresses him ← katakana ストレス; told many times ← "can't… enough" read as "I keep saying it"
    { id: 'pr2', skill: 'pragma', level: 'B2', point: 'stress', reveals: ['bankrupt'], seg: [59.6, 65],
      stem: 'What does “Can’t stress this enough” do here?',
      choices: ['Flags the next point as very important', 'Says it stresses him out too much to discuss',
                'Says he has told people this many times'], a: 0,
      cue: '「bankrupt」の前置き。カタカナ語に注意。',
      line: '*Can’t stress this enough*. If she finds out that we broke up, I’ll go bankrupt.',
      said: '「これは何度でも言う。ばれたら破産だ」と強調する。',
      mean: '動詞の stress ＝ 強調する。次の一文がとても大事だという予告。',
      trap: 'stress をカタカナの「ストレス」と取ると話が合わない。enough と組んで「いくら言っても足りない」。',
      use: 'I can’t stress this enough: bring water.（何度でも言うけど、水を持ってきて）' },

    // R fix: blind 50 % — "pay back slowly" was a filler; now a confident reading of "if she finds out".
    // why: spent ← "go bankrupt" heard as already broke; sure ← the "if" missed, bravado expected from him
    { id: 'i4', skill: 'infer', level: 'B2', point: 'bankrupt', seg: [60.9, 65.5],
      stem: 'What does the last line of the talking head suggest about him?',
      choices: ['He can’t afford to lose the bet', 'He has already spent the money',
                'He’s sure Donna will never find out'], a: 0,
      cue: '「If she finds out」のあと。',
      line: 'If she finds out that we broke up, *I’ll go bankrupt*.',
      said: '「別れたとばれたら、ぼくは破産だ」と言う。',
      mean: 'かけに負けたら払えない、つまりお金に余裕がない。大げさに言って笑わせている。',
      trap: 'go bankrupt を「もう破産した」と取りやすい。I’ll と if があるので、まだ起きていない話。',
      use: 'If I buy this, I’ll go broke.（これを買ったら金欠になる）' },

    // R fix: blind 60 % — the key was the only "hungry, but…" choice; all three now start from the hunger.
    // why: forgot meat ← "the meat" + "just have to" with "thaw" lost; nothing to drink ← "Is there at least something to drink?"
    { id: 'g2', skill: 'gist', level: 'B2', point: 'wait', reveals: ['hours'], seg: [66, 106],
      stem: 'What is the main problem at the cookout?',
      choices: ['The guests are hungry, but it’ll be hours', 'The guests are hungry, but Ron forgot the meat',
                'The guests are hungry, and there’s nothing to drink'], a: 0,
      cue: '「Food!」の歓声のあと、肉について言われること。',
      said: 'みんな空腹なのに、肉はこれから解凍して焼くので何時間もかかる。',
      mean: '料理人のこだわりと、腹ぺこの客のずれが、このあとの笑いの元。',
      trap: 'Is there at least something to drink? から何もないと思いやすいが、ビールはある。',
      use: 'How long until the food’s ready?（料理はあとどのくらい？）' },

    // R fix: blind 50 % — choices now share one frame, so only the verb after "have to" decides.
    // why: bought ← "I just have to" + "the meat", the verb lost; smoke ← "grill it up" + "hours" = slow cooking
    { id: 'd4', skill: 'detail', level: 'B1', point: 'hours', seg: [71.3, 76.5],
      stem: 'Why will the food take a few hours?',
      choices: ['The meat still has to thaw first', 'The meat still has to be bought', 'The meat still has to smoke slowly'],
      a: 0,
      cue: '「I just have to」のすぐあとの動詞。',
      line: 'I just have to *thaw the meat*, season it, and grill it up',
      said: '「肉を解凍して、味付けして、焼くだけ。だから数時間」と言う。',
      mean: 'thaw ＝ 解凍する。just と言いながら、一番時間のかかる作業から始まる。',
      trap: 'thaw は短く弱い音で聞き逃しやすい。grill や hours だけ拾うと焼く時間の話に思える。',
      use: 'I forgot to thaw the chicken.（鶏肉を解凍し忘れた）' },

    // R fix: blind 70 % — "Politely" was only in the key; now in all three.
    // why: unwell ← "I'm now feeling" read as his own state; asking ← "feelings update" heard as a check-in question
    { id: 'pr3', skill: 'pragma', level: 'C1', point: 'antsy', seg: [82.2, 88.4],
      stem: 'What is Chris really doing with his “feelings update”?',
      choices: ['Politely telling Ron to hurry up', 'Politely saying he feels unwell', 'Politely asking how Ron is feeling'],
      a: 0,
      cue: '「I’m now feeling that」のあと、誰の話か。',
      line: 'feelings update: I’m now feeling that *your guests are getting a little antsy*.',
      said: '「気持ちの報告。お客さんが少しそわそわしてきた気がする」と言う。',
      mean: 'antsy ＝ じっとしていられない。直接「急いで」と言わず、客の様子として伝えている。',
      trap: 'feeling が二度出るので自分の体調の話に聞こえる。that のあとは客の様子。',
      use: 'The kids are getting a little antsy.（子どもたちがそわそわしてきた）' },

    // R fix: blind 65 % — the key was the only reluctant feeling; "proud" became "angry; refuses", which his next words rule out.
    // why: pleased ← "Fine" read as 「いいね」; refuses ← a clipped "Fine." heard as a flat no
    { id: 'a2', skill: 'attitude', level: 'B2', point: 'fine', seg: [88.3, 91.7],
      stem: 'When Ron answers “Fine…”, how does he sound?',
      choices: ['Grudging; he’s giving in a little', 'Angry; he refuses to change a thing', 'Pleased; he wanted to go faster'],
      a: 0,
      cue: '最初の一語の調子と、「skip」のあと。',
      line: '*Fine*. I’ll *skip a few steps* and speed things up.',
      said: '「分かったよ。いくつか手順を飛ばして急ぐ」と言う。',
      mean: 'Fine. は渋々の「はいはい」。本当は手を抜きたくない気持ちがにじむ。',
      trap: 'Fine を「いいね」と明るく取りやすい。一語だけの Fine. は不満を含むことが多い。',
      use: 'Fine, I’ll do it myself.（分かったよ、自分でやる）' },

    // R fix: blind 70 % — only the key was nuanced; the fountain distractor is now the literal first half of his answer.
    // why: beer as it is ← "beer" for the children heard, "water down" missed; fountain ← "get water from that water fountain" heard, the rest lost
    { id: 'h2', skill: 'humor', level: 'C1', point: 'water', seg: [91.4, 102.5],
      stem: 'When asked about drinks for the children, what makes Ron’s answer funny?',
      choices: ['He’d rather water down beer than serve plain water', 'He tells the children to drink the beer as it is',
                'He tells the children to drink from the fountain'], a: 0,
      cue: '「fountain」のあと、その水を何に使うか。',
      line: 'get water from that water fountain and use it to *water down the beer*.',
      said: '「水飲み場の水で、ビールを薄めればいい」と答える。',
      mean: '水があるのに、ビールを薄めて子どもに出そうとする発想。',
      trap: '前半だけなら「水飲み場へ」、beer だけなら「ビール」に聞こえる。water down まで聞く。',
      use: 'Don’t water down the juice.（ジュースを薄めないで）' },

    { id: 'x1', skill: 'dict', level: 'B1', point: 'backoff', seg: [102.4, 105.9],
      stem: 'Type what he says: “Would everyone please ___ and just let me cook?” (2 words)', answer: 'back off',
      cue: '「please」のすぐあと。',
      line: 'Now would everyone please *back off* and just let me cook in peace?',
      said: '「みんな、離れて静かに料理させてくれ」と頼む。',
      mean: 'back off ＝ 下がる、口出しをやめる。少しいら立った頼み方。',
      trap: 'back off は「バッコフ」とつながる。ck と o が一つの音になって聞こえる。',
      use: 'Back off, I can handle this.（口出ししないで、自分でできる）' },

    { id: 'x2', skill: 'dict', level: 'B2', point: 'pace', seg: [134.3, 137],
      stem: 'Type what he says: “So remember to ___.” (2 words)', answer: 'pace yourself',
      cue: '「basically grapes」のあと、文の終わり。',
      line: 'they’re basically grapes, so remember to *pace yourself*.',
      said: '「ほぼブドウだから、食べすぎないようにね」と言う。',
      mean: 'pace yourself ＝ 自分のペースを守る。レーズンをごちそう扱いするのがおかしい。',
      trap: 'pace の s と yourself がつながる。カタカナの「ペース」と同じ意味。',
      use: 'It’s a long hike, so pace yourself.（長い山道だから無理しないで）' },
  ]
};
