// REVIEW 2026-11-16: pass 2, fix 20, drop 2, new 0; ear checks 0
// “Donna meets her new dramatic work bestie | Parks and recreation” (the official Parks and Recreation channel, Season 6):
// Leslie pairs her staff with their Eagleton matches; Donna's match, Craig, adores her, rants at a grass supplier, and
// talks cutbacks into a wave of offers to leave.
// Segments from the captions, words from whisper (2026-11-16). Nothing is built on who says "I'm right here" (122 s),
// "It won't last" (137 s), the Scandal exchange after 158 s, or "Who even are you?" (174 s): the speakers aren't settled
// by the audio. The coworker at 89 s is unnamed in the audio.
// R: the three ear checks are gone (addendum): x1 and s1 agree in both sources, and w1 is settled by "even Larry".
import type { Clip } from '../types.ts';

export const workBestie: Clip = {
  id: 'workbestie', video: 'ENw2r_HY6RU', title: 'Donna meets her new dramatic work bestie', dur: 196, wpm: 167,
  band: 'fast', tags: ['職場', '友だち'],
  show: 'Parks and Recreation',
  credit: 'Parks and Recreation (official YouTube channel)',
  questions: [
    // R fix: key's "same role" mirrored "equivalent" and the title, and was longest (V2/K6); all three now
    // "…each one…Eagleton…". seg ran to 15.0, cutting "Not surprised"; now ends after Tom's turn.
    // why: pick ← "paired up with" read as "pick a partner"; replace ← Eagleton + an equivalent sounds like a swap
    { id: 'g2', skill: 'gist', level: 'B1', point: 'pair', seg: [0, 21.1],
      stem: 'At the start, what is Leslie doing with her staff?',
      choices: ['Telling each one who their Eagleton partner will be',
                'Asking each one to pick a partner from the Eagleton staff',
                'Telling each one which Eagleton worker will replace them'], a: 0,
      cue: '名前を順に呼んだあとの「you’ll be with」。',
      line: 'Soon you will be *paired up with* the person who is *roughly your equivalent* in Eagleton.',
      said: '部下の名前を順に呼び、イーグルトン側の相手を一人ずつ告げている。',
      mean: '同じくらいの立場どうしを組ませる発表。本人は選んでいない。',
      trap: 'paired up with を「選ぶ」と取りやすい。you’ll be with は決まった相手を告げる言い方。',
      use: 'You’ll be paired up with a partner.（相手とペアになります）' },

    // R fix: "Another man named Ron" was the one odd-shaped choice (V2/K5), and "Tinnifer" is "Jennifer" in the
    // captions (K2); now three plain names. seg ended inside Tom's "Guess…".
    // why: Craig ← the name said for Donna; Eric ← the counterpart named a few lines later, for Tom
    { id: 'd1', skill: 'detail', level: 'B1', point: 'ron', seg: [5.3, 12.6],
      stem: 'Who is Ron paired with?',
      choices: ['Someone named Ron', 'Someone named Craig', 'Someone named Eric'], a: 0,
      cue: '最後に呼ばれる名前のあと、「also」に注目。',
      line: 'And Ron, your guy is *also named Ron*.',
      said: 'ロンの相手も「ロン」という名前だ、と言っている。',
      mean: 'also named Ron ＝ 同じ名前のロン。名前がかぶったという軽いおかしさ。',
      trap: '少し前に Craig、すぐあとに Eric の名も出る。だれの相手かは、呼ばれた名前のすぐあとで決まる。',
      use: 'My boss is also named Ken.（上司も同じケンって名前なの）' },

    // R fix: key was the only upbeat choice, so Tom's known vanity picked it (V2); a second upbeat reading added.
    // seg started inside "Ron".
    // why: sadly ← "Not surprised" read as resigned (やっぱりね); relieved ← no match read as "I get to work alone"
    { id: 'a1', skill: 'attitude', level: 'B2', point: 'unique', seg: [10.5, 21.2],
      stem: 'When Tom guesses he has no match, how does he take it?',
      choices: ['Proudly; he sees it as proof he is special', 'Sadly; he expected to be left out once again',
                'Gladly; he would rather work on his own anyway'], a: 0,
      cue: '「Not surprised」に続く言葉。',
      line: 'Not surprised. And *one of a kind*. Just like the custom Nikes I designed',
      said: '「驚かないね。唯一の存在だから。自分で作った特注の靴みたいに」と言う。',
      mean: 'one of a kind ＝ 唯一無二。相手がいないのを自慢にしている。',
      trap: 'Not surprised を「やっぱりね」と落ちこむ意味に取りやすい。続く言葉の明るさで判断。',
      use: 'This bag is one of a kind.（このバッグは一点物です）' },

    // R fix: "isn't really sure" was the only hedged choice and a filler (K3/K6); now 実は read as her own
    // surprise. seg cut "toes" and "Anyway".
    // why: softens ← Tom wanted no match, so it could sound like bad news gently put; surprised ← actually = 実は (news to her)
    { id: 'm1', skill: 'marker', level: 'B2', point: 'actually', seg: [21, 24.9],
      stem: 'When Leslie answers Tom, what does her “…, actually” do?',
      choices: ['It corrects what Tom has just assumed', 'It softens some bad news for Tom',
                'It shows the news surprised her as well'], a: 0,
      cue: '文の最後にそえた一語と、do の強さ。',
      line: 'You *do* have a counterpart, *actually*.',
      said: '「実はあなたにも相手がいるの。エリックという人」と伝える。',
      mean: '文末の actually は、相手の思い込みを正す働き。do を強く言うのも「いるのよ」の強調。',
      trap: 'actually を「実は私も驚いた」と取りやすいが、相手の思い込みを正している。',
      use: 'It’s free, actually.（実はそれ、無料なんです）' },

    // R fix: "taking back her praise" was a filler (K3); now the brush-off reading of anyway.
    // why: more on Eric ← "also" follows at once; brushing off ← anyway heard as "whatever" (どうでもいいけど)
    { id: 'm2', skill: 'marker', level: 'B2', point: 'anyway', seg: [21, 29.3],
      stem: 'After praising Eric, Leslie starts a sentence with one short word. What does it signal?',
      choices: ['She is closing that topic and moving on', 'She is adding one more point about Eric',
                'She is brushing off how Tom feels about it'], a: 0,
      cue: '「amazing」のあと、文頭の短い一語。',
      line: '*Anyway*, I also have a little surprise.',
      said: 'エリックの話を切り上げて、「ちょっとしたサプライズもあるの」と続ける。',
      mean: '文頭の anyway ＝「それはさておき」。話を区切って次の話題へ移る合図。',
      trap: 'also がすぐあとに来るので「まだエリックの話」と思いやすい。anyway のあとは別の話。',
      use: 'Anyway, let’s get back to the plan.（とにかく、計画の話に戻ろう）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'gonna', seg: [39.8, 42],
      stem: 'Type Donna’s reply: “___.” (2 words)', answer: 'wasn\'t gonna',
      cue: '「Never change it」の直後、短い返事。',
      line: 'Never change it! — *Wasn’t gonna*.',
      said: '「変えるつもりなんてなかったけど」とそっけなく返す。',
      mean: 'I wasn’t gonna change it の略。gonna は going to が縮んだ形。',
      trap: 'wasn’t の t はほぼ聞こえず、gonna は「ガナ」。2語を一つの音で聞く。',
      use: 'I wasn’t gonna say anything.（何も言うつもりなかったよ）' },

    // R drop d2: "plain and boring" is the stock reason to dislike the name Craig (V1, common sense) and "too
    // Spanish" was a filler (K3). Never shipped, deleted.

    // R fix: the stem quoted the idiom under test, so it was a vocab item (S2, GUIDE §9.2); it now names the
    // moment. "heavy load" reworded to keep its pull. seg started inside "manager".
    // why: heavy load ← 肩に重荷 frame; boss ← "carried the department" read as "ran it"
    { id: 'f1', skill: 'phrase', level: 'B2', point: 'shoulders', seg: [59.1, 67],
      stem: 'When Donna asks about his old job, what does Craig claim?',
      choices: ['He did most of the work and kept it going', 'He found the work heavy but stuck with it',
                'He was the boss of the whole department'], a: 0,
      cue: '「everything」を2回言ったあとの文。',
      line: 'I *carried* the Eagleton department *on my shoulders* for years, and I loved every second of it.',
      said: '「何年もあの部署を肩にかついできた。毎秒楽しかった」と言う。',
      mean: 'ほぼ一人で部署を支えてきた、という自慢。',
      trap: '「肩の重荷」から「つらかった」と取りやすいが、直後に loved every second と言う。',
      use: 'She carried the team this season.（今季は彼女がチームを支えた）' },

    // why: 18 ← -ty/-teen; 8 ← the weak -ty drops and leaves "eigh-"
    // R fix: seg ended inside "What?!"; now takes it in whole.
    { id: 'n1', skill: 'number', level: 'B1', point: 'cost', seg: [68.1, 73.6], keep: true,
      stem: 'How much more per square foot does the Bermuda grass cost?',
      choices: ['8 cents', '18 cents', '80 cents'], a: 2,
      cue: '「only」のあと、「more」の前。',
      line: 'It’s only *80 cents* more per square foot.',
      said: '「平方フィートあたり、たった80セント高いだけ」と言う。',
      mean: 'eighty は前を強く「エイティ」。eighteen なら後ろの「ティーン」が長く強い。',
      trap: '-ty と -teen は聞き分けにくい。数字のどこが強いか、語尾が伸びるかで判断する。',
      use: 'It’s only five dollars more.（たった5ドル高いだけです）' },

    // R drop i1: the key restates the title ("work bestie"), so it was blind-guessable (V2, §9.4), and every
    // Donna-centred rewrite left a defensible second key (K1). Never shipped, deleted.

    // R fix: "calm the room down" was a weak filler (K3); now a friendly joke aimed at Craig himself, the
    // Japanese 冗談で和ませる frame.
    // why: worried ← the polite preface sounds caring; teasing ← a joke read as friendly, not attacking
    { id: 'a2', skill: 'attitude', level: 'C1', point: 'meds', seg: [89.4, 98.6],
      stem: 'When a coworker asks Craig about medication, is it a real question?',
      choices: ['No; it’s a dig at how worked up he is', 'Yes; they’re worried he might be unwell',
                'No; it’s a friendly joke to help him relax'], a: 0,
      cue: '薬の量の言い方。「none」と「too much」。',
      line: 'some kind of medication that you maybe need a lot of and have *taken none of*, or maybe *too much of* today?',
      said: '「要る薬を全然飲んでないか、今日は飲みすぎたとか？」と聞く。',
      mean: '本当に体を心配してはいない。クレイグの興奮ぶりをからかう、遠回しな皮肉。',
      trap: '丁寧な前置きで本気の心配に聞こえやすい。「none か too much」という言い方が皮肉の印。',
      use: 'Are you feeling okay today?（今日、大丈夫？）' },

    // R fix: the key was the only choice that read the line as unfriendly (V2); the apology distractor is now a
    // real worry softened, so politeness is in two choices and only "fake" separates them.
    // why: unsure ← a hedge read as real doubt (〜かもしれませんが); softens ← a preface read as 気づかい
    { id: 'p1', skill: 'pragma', level: 'C1', point: 'meds', seg: [89.4, 98.6],
      stem: 'When a coworker asks Craig about medication, what does “I’m just guessing here” do?',
      choices: ['It adds fake politeness to make the dig sharper', 'It shows the speaker really isn’t sure he’s sick',
                'It softens a real worry so it sounds less rude'], a: 0,
      cue: '質問の途中に入る、短い前置き。',
      line: 'Is there, and *I’m just guessing here*, some kind of medication…',
      said: '質問の途中で「これは私の推測だけど」とわざと前置きしている。',
      mean: '控えめに見せる前置きを、皮肉を強めるために使っている。言いたいことははっきりしている。',
      trap: '日本語の「〜かもしれませんが」のように本当の迷いと取りやすい。中身が失礼なら、前置きは演技。',
      use: 'I’m just guessing, but you’re tired?（たぶんだけど、疲れてる？）' },

    // R fix: "…, not illness" made the key the only contrastive choice, and "sorry" answered a different question
    // (V2/K5); all three are now "He means…" about the condition.
    // why: real illness ← "medical condition" + "incurable" taken literally; medicine ← "medication" from the question
    { id: 'i2', skill: 'infer', level: 'B2', point: 'caring', seg: [96.9, 103.8],
      stem: 'What does Craig mean by his “medical condition”?',
      choices: ['He means he simply cares too much', 'He means he has an illness doctors can’t cure',
                'He means his medicine doesn’t always work'], a: 0,
      cue: '「medical condition」のあと、病名にあたる部分。',
      line: 'It’s called *caring too much*, and it’s *incurable*!',
      said: '「持病があるの。病名は『気にかけすぎ』。しかも治らない」と言い返す。',
      mean: '自分の熱さを「病気」と呼んでいる。からかいを、自分へのほめ言葉に変えて返している。',
      trap: 'condition と incurable で本当の病気と取りやすい。病名の中身を聞く。',
      use: 'I have a condition: I love food.（持病があってね、食べるのが大好きなの）' },

    // R fix: "turns the question back" was a filler (K3); now the calm-down-and-apologise script.
    // why: medication ← the word just heard in the question; says sorry ← the usual end of a sitcom rant
    { id: 'h1', skill: 'humor', level: 'C1', point: 'eczema', reveals: ['caring'], seg: [97, 107],
      stem: 'Why is Craig’s very last line in this exchange funny?',
      choices: ['He adds a real, dull problem after a grand one', 'He finally admits he does take medication',
                'He suddenly calms down and says sorry for yelling'], a: 0,
      cue: '「incurable」のあと、「Also」で始まる一言。',
      line: 'It’s called caring too much… *Also, I have eczema*.',
      said: '大げさな「気にかけすぎ病」のあと、「それと、肌の病気もある」と足す。',
      mean: '熱いせりふのあと、急に地味で本当の悩みを言う。その落差が笑い。',
      trap: 'medication が耳に残ると「薬を認めた」と取りやすい。eczema は皮ふの病気で、薬の話ではない。',
      use: 'Also, I’m allergic to cats.（それと、猫アレルギーもあるの）' },

    // R fix: the stem quoted the idiom under test (S2, §9.2) and blind it was 85 %; the stem now names the
    // moment, so the learner has to catch "glue".
    // why: fixes things ← glue as a repair tool; sticks to rules ← "stick" from glue
    { id: 'f2', skill: 'phrase', level: 'B2', point: 'glue', seg: [108, 114.4],
      stem: 'Before the bad news, how does Leslie describe Donna’s place in the department?',
      choices: ['Donna holds the whole team together', 'Donna fixes whatever gets broken',
                'Donna sticks very closely to all the rules'], a: 0,
      cue: '「basically」のあとのたとえ。',
      line: 'You’re basically *the glue* of this department.',
      said: '「あなたは基本的に、この部署のまとめ役だから」とドナに言う。',
      mean: 'the glue ＝ のり。人と人をくっつけて、チームをまとめる人のこと。',
      trap: 'glue を「直す道具」や「くっついて離れない」と取ると、ほかの2つに引かれる。人をつなぐたとえ。',
      use: 'She’s the glue of our family.（彼女がうちの家族をまとめている）' },

    // why: Donna decides ← she is the one spoken to; share ← "cutbacks" read as cutting hours, not people
    // R fix: seg ended inside Donna's "No".
    { id: 'd3', skill: 'detail', level: 'B1', point: 'cut', seg: [108, 116.5],
      stem: 'What does Leslie tell Donna about the cutbacks?',
      choices: ['Donna will stay, but Craig will go', 'Donna must decide which one goes',
                'Donna and Craig will share one job'], a: 0,
      cue: '「cutbacks」のあと、but に続く部分。',
      line: 'your job is *secure*, of course… But I think *Craig’s gonna have to go*.',
      said: '「人を減らす必要がある。あなたの仕事は安心して。でもクレイグは外れてもらうことになりそう」と言う。',
      mean: 'まず相手を安心させてから、本題を but のあとに言っている。',
      trap: '話しかけている相手がドナなので、ドナが選ぶと思いやすい。決めているのはレスリー。',
      use: 'Your job is safe, I promise.（あなたの仕事は大丈夫、約束する）' },

    // R fix: "unexpectedly" flagged the twist (V2/K6); removed. The mean gives away Leslie's frustration, so it
    // now reveals `game`.
    // why: Craig is let go ← Leslie's first plan, said clearly; everyone fights ← the usual layoff script
    { id: 'g1', skill: 'gist', level: 'B2', point: 'turn', reveals: ['cut', 'choose', 'planning', 'condo', 'game'], seg: [108, 149.3],
      stem: 'When Leslie raises cutbacks, how do things turn out?',
      choices: ['People start offering to leave on their own', 'Donna agrees, and Craig is told to go home',
                'Everyone argues hard to keep their own job'], a: 0,
      cue: '人を減らす話のあと、だれが何を申し出るか。',
      said: '人を減らす話をすると、ドナも「辞めてもいい」、ほかの人も「引退に戻る」と言い出す。',
      mean: '一人を減らすつもりが、次々に辞める申し出が出て、レスリーは困ってしまう。',
      trap: '最初の案（クレイグを外す）がそのまま決まると思いやすい。そのあとの申し出の流れを追う。',
      use: 'Is anyone willing to volunteer?（だれか自分から手を挙げる人いる？）' },

    // why: smart ← "crazy" is heard, then a "but"; friend ← they get along, and she defends him
    // R fix: seg ended inside "Donna"; its line ("cares more about this job") hints at i2's key, so it now
    // reveals `caring`.
    { id: 'd4', skill: 'detail', level: 'B1', point: 'keep', reveals: ['cut', 'caring'], seg: [116.3, 122.15],
      stem: 'Why does Donna want Leslie to keep Craig?',
      choices: ['No one cares more about the job than him', 'He is a bit crazy, but very smart',
                'He has already become a close friend of hers'], a: 0,
      cue: '「but」のあと、「never met anyone」に続く部分。',
      line: 'He’s crazy intense, but I’ve never met anyone who *cares more about this job*.',
      said: '「彼は残して。熱いけど、これほど仕事を大事にする人はいない」と言う。',
      mean: '���由は仕事への思い。crazy intense は「ものすごく熱い」で、変な人の意味ではない。',
      trap: 'crazy が耳に残ると「変」を理由と取りやすい。理由は but のあと。',
      use: 'I’ve never met anyone so kind.（こんなに優しい人に会ったことがない）' },

    // R fix: seg held Leslie's "Are you thinking about leaving?" and Donna's "I could", which state the key, so the
    // C1 inference was B2 at most (V5); it now stops before "Wait". "only joking" rests on "No joke", which the
    // captions hear as "no Joe" (K2); now the "than you" referent trap. Start no longer cuts "right here".
    // why: Leslie decides ← "if I had to choose" heard as handing over the choice; Leslie's job ← "he might care more than you" (to Leslie)
    { id: 'i3', skill: 'infer', level: 'C1', point: 'choose', reveals: ['planning'], seg: [123.6, 129.35],
      stem: 'What does Donna suggest when she compares herself with Craig?',
      choices: ['She would give up her own job so he could stay', 'She wants Leslie to make the hard choice for her',
                'She thinks Craig should take Leslie’s place instead'], a: 0,
      cue: '「if I had to choose」のあと、だれを選ぶか。',
      line: 'if I had to choose between him and me, *I’d choose him*.',
      said: '「彼はあなた以上に熱いかも。私と彼なら彼を選ぶ」と言う。',
      mean: '自分が辞めてでも、クレイグを残したい。だからレスリーは「辞めるの？」と聞き返す。',
      trap: 'choose が聞こえるので「選ぶのを任せる」と取りやすいが、選んでいるのはドナ自身。',
      use: 'If I had to choose, I’d pick this.（選ぶなら、こっちかな）' },

    // R fix: "couldn't" made no sense after "wasn't planning on it", so meaning picked the key (V2, §9.5); now weak
    // "can" [kən], which fits and sounds close. seg cut "condo"; now Leslie's question to "you know".
    // why: can ← weak can [kən] vs could [kəd], the d barely released; would ← could/would differ by one sound
    { id: 's1', skill: 'sound', level: 'B2', point: 'planning', reveals: ['choose'], seg: [129.3, 132.9],
      stem: 'Fill the gap: “I wasn’t planning on it, but I ___.”',
      choices: ['can', 'could', 'would'], a: 1,
      cue: '文の最後、but のあとの短い語の終わり。',
      line: 'I wasn’t planning on it, but *I could*.',
      said: '「辞めるつもりはなかったけど、辞めることもできる」と答える。',
      mean: 'could は「やろうと思えばできる」。ほかに行く場所があると続ける。',
      trap: '弱い can は「クン」、could は「クッ」で止まる。語の終わりが鼻に抜けるか、詰まるかで聞き分ける。',
      use: 'I could, but I’d rather not.（できるけど、やめておきたいな）' },

    // R fix: the key was the only hypothetical choice (K6); the Seattle distractor is now an already-made plan to
    // quit. Its key implies she'd leave, so it reveals `choose`. seg starts at Leslie's question.
    // why: planned ← condo + fiancé sound like a plan in place; married ← "fiancé" is heard
    { id: 'i4', skill: 'infer', level: 'B2', point: 'condo', reveals: ['planning', 'choose'], seg: [129.3, 136.4],
      stem: 'Why does Donna bring up a condo and a fiancé?',
      choices: ['To show she has places she could go', 'To hint she has already planned to quit',
                'To explain she is leaving to get married'], a: 0,
      cue: '「You know」のあと、二つの町の名前。',
      line: 'You know, I got the *condo in Seattle*, the *fiancé in Denver*.',
      said: '「ほら、シアトルに家もあるし、デンバーに婚約者もいるし」と言う。',
      mean: '辞めても行く場所はある、という言い方。引っ越すとも結婚するとも言っていない。',
      trap: '地名や fiancé が具体的なので、予定が決まっていると思いやすい。話は「もし辞めたら」。',
      use: 'I’ve got a place in Osaka.（大阪に家があるんだ）' },

    // R fix: blind 60 %: Craig, the one being cut, was the weak choice, so it came down to Larry vs the two women
    // (V2/K3); Craig is now Ron, another Pawnee staffer named in the clip.
    // why: Leslie ← her name opens the offer; Donna ← she just said she could leave; Ron ← a staffer named at the start
    { id: 'w1', skill: 'who', level: 'B2', point: 'larry', seg: [136.2, 144.2],
      stem: 'Who offers to go back into retirement?',
      choices: ['Larry', 'Ron', 'Donna', 'Leslie'], a: 0,
      cue: '申し出のすぐあと、レスリーの返事に出る名前。',
      line: 'What, *even Larry* wants out?',
      said: '「喜んで引退に戻るよ」という申し出に、レスリーが「ラリーまで？」と返す。',
      mean: '申し出の声だけでは分かりにくいが、返事の中の名前で話し手が決まる。',
      trap: '最初に Leslie と呼びかけるので、レスリーが言ったと思いやすい。呼びかけは話し相手の名前。',
      use: 'I’d be happy to help if you need.（必要なら喜んで手伝うよ）' },

    // R fix: "keep trying to leave" restated the stem's setup, so the key was the obvious fit (V2); it now names
    // what she objects to. seg starts before the offer the stem points at.
    // why: relieved ← she needs cuts, so a volunteer should help; amused ← "game" and the comic pile-up
    { id: 'a3', skill: 'attitude', level: 'B2', point: 'game', seg: [137.4, 149.3],
      stem: 'When Leslie hears this last offer, how does she react?',
      choices: ['Annoyed that people treat their jobs so lightly', 'Relieved that someone will go without a fight',
                'Amused by how fast all these offers pile up'], a: 0,
      cue: '「What the hell」で始まる、そのあとの問いかけ。',
      line: 'Does everybody think that running a town is *just some game* where people can *come and go as they please*?',
      said: '「どうなってるの？町の運営を、好きに出入りできるゲームだと思ってる？」と言う。',
      mean: '本当に質問してはいない。みんなが辞めたがることへのいら立ちをぶつけている。',
      trap: '人を減らしたいので「助かる」と思いやすい。強い問いかけは不満の印。',
      use: 'Come and go as you please.（ご自由に出入りしてください）' },

    // why: recording for a year ← "13 months" taken literally; broken ← DVR + a long time read as a fault
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'dvr', seg: [150.9, 158.1],
      stem: 'What does Craig mean by what he says about his DVR?',
      choices: ['He has far more shows saved than he’s watched', 'He has been recording Scandal for over a year',
                'His recorder has not worked for many months'], a: 0,
      cue: '「Plus」のあと、録画機を何にたとえるか。',
      line: 'Plus, my DVR is *13 months pregnant* with episodes of Scandal.',
      said: '「仕事が山ほどある。それに録画機が妊娠13か月だし」と言う。',
      mean: '予定日を過ぎるほど、見ていない録画がたまっている、という大げさなたとえ。',
      trap: '13 months を「13か月録画してきた」と取りやすい。pregnant with は「〜でパンパン」。',
      use: 'My inbox is full of emails.（受信箱がメールでいっぱい）' }
  ]
};
