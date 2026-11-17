// A2 REVIEW 2026-11-17: keep 4, rewrite 9, retire 9, new 2
// “Dwight vs. Andy - The Office US” (the official The Office channel, BEST OF SEASON 3): Dwight and Andy meet and argue
// over who outranks whom; Michael names Jim his new number two and Andy flatters him; in the parking lot the two trade
// car insults that sink to "Idiot!", and one of them tells the camera he won.
// Segments from the captions, words from whisper (2026-11-16). Talk ends at ≈154.5 s. Untested: 16.4–18.6 s, 64–73 s
// (garbled), 103.5–106.7 s ("1985 called…", garbled in both), 124.8–154.8 s (garbled lines and the closing claim).
// Dwight and Andy name themselves at 8.5 and 10.8 s; Michael says "Thank you, Andy" at 61.5 s; no key turns on which
// voice owns which car. OPEN: d2 (Jim) is guessable for fans of the show.
import type { Clip } from '../types.ts';

export const dwightVsAndy: Clip = {
  id: 'dwightandy', video: 'QwfjeegBDeo', title: 'Dwight vs. Andy', dur: 178, wpm: 129,
  band: 'slow', tags: ['職場'],
  show: 'The Office',
  credit: 'The Office (official YouTube channel)',
  questions: [
    { id: 'f4', skill: 'phrase', level: 'B1', point: 'appreciate', seg: [0, 4.4],
      stem: 'What does “I appreciate it” mean?', ja: '“I appreciate it” はどういう意味？',
      choices: ['I’m grateful', 'I don’t need it', 'I’ll pay for it'], a: 0,
      choicesJa: ['感謝している', 'それはいらない', 'それは私が払う'],
      cue: '「thank you」のあと',
      line: 'Michael Scott, thank you. *I appreciate it*, Mike.',
      said: '「マイケル・スコット、ありがとう。感謝してるよ」と言う。',
      mean: 'I appreciate it ＝ ありがたい、感謝します。thank you のあとに重ねて、気持ちを強める。',
      trap: 'appreciate を「評価する」と思いやすい。人の親切に言うときは「ありがとう」。',
      use: 'Thanks for waiting. I appreciate it.（待ってくれてありがとう。助かります）' },

    { id: 'pr3', skill: 'pragma', level: 'B1', point: 'introduced', seg: [5.2, 10.9],
      stem: 'Why does Dwight say “we’ve not been introduced”?', ja: 'ドワイトはなぜ「まだ紹介されていない」と言う？',
      choices: ['To introduce himself', 'To say goodbye', 'To ask for help'], a: 0,
      choicesJa: ['自分から名乗るため', 'さよならを言うため', '助けを頼むため'],
      cue: '「Hello」のあと',
      line: '*I don’t believe we’ve been introduced.* Dwight Schrute, assistant regional manager.',
      said: '「はじめましてですね。ドワイト・シュルート、地域マネージャー補佐です」と名乗る。',
      mean: '直訳は「紹介されていないと思う」。初対面で自分から名乗るときの、ていねいな前置き。',
      trap: 'don’t believe（信じない）から、疑っていると思いやすい。I don’t believe 〜 は「〜ないと思う」。',
      use: 'Hi, I don’t think we’ve met. I’m Ken.（はじめまして、ケンです）' },

    { id: 'g1', skill: 'gist', level: 'B1', point: 'meet', seg: [5.2, 31],
      stem: 'What do Dwight and Andy argue about first?', ja: 'ドワイトとアンディは、まず何で言い合う？',
      choices: ['Who has the higher job', 'Who knows more about film', 'Who sells the most'], a: 0,
      choicesJa: ['どちらの役職が上か', 'どちらが映画にくわしいか', 'どちらがいちばん売るか'],
      cue: '名乗ったあとの最初の質問',
      said: '自己紹介で役職を言い合い、どちらが上かで張り合う。映画の話もその続き。',
      mean: 'report to 〜 ＝ 〜の部下になる。映画の話も、自分が上だと言うための材料。',
      trap: '後半は映画の話が続くので、そちらだと思いやすい。最初の質問 reporting to me を聞く。',
      use: 'Who do you report to?（あなたの上司は誰ですか）' },

    { id: 'd1', skill: 'detail', level: 'B1', point: 'title', seg: [10.2, 16.3],
      stem: 'What is Andy’s job title?', ja: 'アンディの役職は？',
      choices: ['Regional director', 'Regional manager', 'Assistant regional manager'], a: 0,
      choicesJa: ['地域ディレクター', '地域マネージャー', '地域マネージャー補佐'],
      cue: '「Andy Bernard」のすぐあと',
      line: 'Andy Bernard, *regional director in charge of sales*.',
      said: '「アンディ・バーナード、営業担当の地域ディレクター」と名乗る。',
      mean: 'in charge of 〜 ＝ 〜の担当。役職のあとによく付く。',
      trap: '二人とも regional で始まるので混ざりやすい。後ろが director か manager かを聞く。',
      use: 'Who’s in charge of the booking?（予約の担当はどなたですか）' },

    { id: 'i3', skill: 'phrase', level: 'B2', point: 'rank', seg: [13.3, 23],
      stem: 'What does Andy mean by “On the contrary”?', ja: 'アンディの “On the contrary” はどういう意味？',
      choices: ['It’s the opposite', 'Yes, that’s right', 'I don’t understand'], a: 0,
      choicesJa: ['その逆だ', 'うん、そのとおり', '意味が分からない'],
      cue: '質問への最初の答え',
      line: 'So you’ll be reporting to me, then? — *On the contrary.*',
      said: '「じゃあ僕の部下だね」に「その逆だ」と返し、director の方が上だと言う。',
      mean: 'On the contrary ＝ まったく逆で。相手の言ったことを、反対だと打ち消す。',
      trap: 'contrary を知らないと、うなずいたように聞こえやすい。あとで director の方が上と言う。',
      use: 'Bored? On the contrary, I loved it.（退屈？いや逆に、すごく楽しかった）' },

    // R fix: V2 (80 % blind): the dream-job distractor was the odd one out. Now "a film job he once had" (the keyword
    //   trap: film set heard as his past), of the same form.
    // why: below ← "manager" is heard in the stretch, and "highest" is missed; film job ← "on a film set" heard as
    //   his own past work
    { id: 'h1', skill: 'humor', level: 'C1', point: 'filmset', reveals: ['rank'], seg: [13.3, 23], retired: true,
      stem: 'When Andy brings up a film set, what makes his argument funny?',
      choices: ['He settles an office rank by film-set rules', 'He admits that a director ranks below a manager',
                'He brags about a film job he once had'], a: 0,
      cue: '「director」のあと、どこの話を持ち出すか。',
      line: 'I’m a director. Which *on a film set* is the *highest title there is*.',
      said: 'director だと言い、「映画の撮影現場では一番上の肩書きだ」と付け足す。',
      mean: '会社の上下を、関係のない映画の世界の基準で決めようとしている。本人は大まじめ。',
      trap: 'film が何度も出るので映画好きの話に聞こえるが、肩書き争いの理屈に使っている。',
      use: 'That’s not how it works here.（ここではそうはいかないよ）' },

    // R fix: V2 (80 % blind): envy was a filler. "Doubt: he does not believe the number" (sarcasm read as disbelief) is
    //   the near miss now.
    // why: real praise ← "Congratulations" taken at face value (the お祝い frame); doubt ← sarcasm heard as "yeah,
    //   right", disbelief instead of "that's not much"
    { id: 't1', skill: 'attitude', level: 'C1', point: 'films', seg: [22.7, 31], retired: true,
      stem: 'How does Andy mean his one-word reply to the film count?',
      choices: ['As a put-down: that is not many films', 'As real praise: that is a lot of films',
                'As doubt: he does not believe that number'], a: 0,
      cue: '「何でも知っている」と、その根拠の数の差。',
      line: 'I know *everything* about film. I’ve seen over 240 of them. — *Congratulations.*',
      said: '「映画は全部知ってる、240本以上見た」に、一言「おめでとう」とだけ返す。',
      mean: '「全部知っている」の根拠にしては少ない数。おめでとうは、大したことないと流す皮肉。',
      trap: 'お祝いの言葉なので本気に取りやすい。大きな主張に小さな根拠が来たら、皮肉を疑う。',
      use: 'Wow, congratulations. Want a medal?（へえ、おめでとう。メダルでもいる？）' },

    // R fix: V2 (60 % blind): the key was the only reply that pushed back. "You think I'm making that up?" (sarcasm read
    //   as disbelief) replaces the lend filler.
    // why: thank-you ← praise answered as praise (the お礼 frame); making it up ← sarcasm read as doubt about the
    //   number, not about its size
    // anchor: 24.9–29.2 s "I know everything about film… over 240 of them", then at 29.8 s a single "Congratulations":
    //   the reply is far too small for the claim, and nothing else is said
    { id: 'c2', skill: 'pragma', level: 'C2', point: 'films', seg: [22.7, 31], retired: true,
      stem: 'Which reply from Dwight would show he caught what “Congratulations” meant?',
      choices: ['Hey, 240 is a lot of movies!', 'Thank you. It took years of work.',
                'What, you think I’m making that up?'], a: 0,
      cue: '「何でも知ってる」の根拠と、一言の返事の釣り合い。',
      line: 'I’ve seen over 240 of them. — *Congratulations.*',
      said: '「240本以上見た」と胸を張ると、一言「おめでとう」とだけ返される。',
      mean: '「全部知っている」にしては少ない数への、皮肉なお祝い。気づいたなら、数を弁護するのが自然な返事になる。',
      trap: 'お祝いにはお礼、という型で選びやすい。返事は言葉の形でなく、相手が言いたいことに返す。',
      use: 'Hey, that’s still a lot!（いや、それでも多いでしょ！）' },

    { id: 'n1', skill: 'number', level: 'B1', point: 'films', seg: [24.4, 29.7], keep: true,
      stem: 'How many films does Dwight say he has seen?', ja: 'ドワイトは映画を何本見たと言う？',
      choices: ['24', '214', '240', '2,400'], a: 2,
      choicesJa: ['24本', '214本', '240本', '2,400本'],
      cue: '「I’ve seen over」のすぐあと',
      line: 'I’ve seen *over 240* of them.',
      said: '「240本以上見た」と言う。',
      mean: 'over ＝ 〜より多く。「映画のことは何でも知っている」の理由として出した数。',
      trap: '240 は「ハンドレッド」のあと「フォーティ」。214 は「フォーティーン」と伸び、24 には hundred がない。',
      use: 'I’ve been there over twenty times.（20回以上行ったよ）' },

    { id: 'g2', skill: 'gist', level: 'B1', point: 'announce', seg: [36.1, 64],
      stem: 'What is Michael’s big news?', ja: 'マイケルの大事な発表は？',
      choices: ['He picks a new number two', 'Everyone gets a pay raise', 'He picks a new number three'], a: 0,
      choicesJa: ['新しいナンバー2を選んだ', '全員の給料が上がる', '新しいナンバー3を選んだ'],
      cue: '「I have decided」のあと',
      said: 'マイケルが新しいナンバー2を発表し、アンディが大げさにほめる。',
      mean: 'number two ＝ 2番手、右腕。I have decided to 〜 ＝ 〜することに決めた。',
      trap: 'number three も pay raise も聞こえるが、決まったのは2番だけ。3番は not decided yet。',
      use: 'I have decided to move to Osaka.（大阪に引っ越すことに決めた）' },

    { id: 'd2', skill: 'detail', level: 'B1', point: 'two', seg: [39.8, 44.4],
      stem: 'Who does Michael choose as his new number two?', ja: 'マイケルが新しいナンバー2に選ぶのは誰？',
      choices: ['Jim', 'Andy', 'Dwight'], a: 0,
      choicesJa: ['ジム', 'アンディ', 'ドワイト'],
      cue: '「decided to make」のすぐあと',
      line: 'I have decided to make *Jim* my new number two.',
      said: '「よく考えた末、ジムを新しいナンバー2にすることにした」と発表する。',
      mean: 'make A B ＝ A を B にする。make Jim my number two ＝ ジムを2番手にする。',
      trap: 'Jim は一音で短く、make にくっついて聞き逃しやすい。make のすぐあとを待つ。',
      use: 'They made her team leader.（彼女がチームリーダーになった）' },

    { id: 'd3', skill: 'detail', level: 'B2', point: 'raise', seg: [44.9, 50.4],
      stem: 'What is true about pay for the new job?', ja: '新しい役目の給料について、正しいのは？',
      choices: ['It comes with a raise', 'It has no raise', 'No one knows yet'], a: 0,
      choicesJa: ['給料が上がる', '給料は上がらない', 'まだ誰も知らない'],
      cue: '「pay raise」のあとの短い返事',
      line: 'it doesn’t come with a pay raise. — No, *it does, actually*.',
      said: '「昇給はないけどね」に、すぐ「いや、実はある」と返される。',
      mean: 'No, it does ＝ いや、ある。No は前の「ない」を打ち消す。actually ＝ 実は。',
      trap: 'No から「ない」と思いやすい。英語の No のあとの it does は「ある」。',
      use: 'No, it does, actually. I checked.（いや、実はあるんだ。確かめたよ）' },

    // R fix: V2 (80 % blind): the key was the only unkind choice. "Tease Jim for being too eager" is unkind too, and
    //   "If he even wants it" says the reverse of eager.
    // why: raise for himself ← "pay raise" heard as his own request; too eager ← a jab is heard, but aimed at Jim
    { id: 'i1', skill: 'infer', level: 'C1', point: 'raise', reveals: ['two'], seg: [44.9, 50.4], retired: true,
      stem: 'What is the speaker trying to do with “If he even wants it…”?',
      choices: ['Make the new job sound less special', 'Hint that he wants a raise himself',
                'Tease Jim for being too eager'], a: 0,
      cue: '「even」の言い方と、すぐ返ってくる訂正。',
      line: '*If he even wants it*, it doesn’t come with a pay raise.',
      said: '「欲しければの話だけど、昇給もないしね」と口をはさみ、すぐ訂正される。',
      mean: 'even で「そもそも欲しいかどうか」と仕事の値打ちを下げる。選ばれなかった悔しさがにじむ。',
      trap: 'Jim へのからかいに聞こえるが、けなす相手は仕事のほう。even に注目。',
      use: 'If you even want it, that is.（まあ、欲しければだけど）' },

    { id: 'i2', skill: 'infer', level: 'C1', point: 'flatter', seg: [50.7, 64],
      stem: 'Why does Andy praise Michael right then?', ja: 'アンディはなぜその時マイケルをほめる？',
      choices: ['He wants to be number three', 'He thinks Jim is a good pick', 'He wants a pay raise'], a: 0,
      choicesJa: ['ナンバー3になりたい', 'ジムはいい人選だと思う', '給料を上げてほしい'],
      cue: '「not decided yet」のすぐあと',
      line: 'So who will be your new number three? — That I have *not decided yet*. — Michael, I would just like to say…',
      said: '「3番はまだ決めていない」と聞いた直後、アンディが「見事な対応でした」とほめる。',
      mean: '空いている3番の座をねらって、ごまをすっている。ほめたタイミングで分かる。',
      trap: 'ほめ言葉は本心にも聞こえやすい。直前の not decided yet（まだ決めていない）とつなげる。',
      use: 'I’m not just saying this, but great job.（お世辞じゃなく、すごく良かった）' },

    // why: fair thinking ← "after a great deal of thought" just before; good humor ← an unknown word guessed from
    //   Michael's jokey style
    { id: 'f1', skill: 'phrase', level: 'C1', point: 'aplomb', reveals: ['flatter'], seg: [55, 62.5], retired: true,
      stem: 'Andy says Michael handled it “with great aplomb.” What does he mean?',
      choices: ['With calm, sure confidence', 'With careful, fair thinking', 'With a lot of good humor'], a: 0,
      cue: '「this entire situation」に続く、珍しい一語。',
      line: 'you have handled this entire situation *with great aplomb*.',
      said: '「この件全体を、実に堂々と処理されました」とほめる。',
      mean: 'aplomb ＝ 落ち着きと自信。難しい場面を動じずにこなすこと。改まった語で、大げさなほめ方。',
      trap: '直前の「よく考えた」に引かれて「慎重・公平」と取りやすいが、aplomb は態度の落ち着き。',
      use: 'She handled the angry guest with aplomb.（怒った客にも動じずに対応した）' },

    { id: 'n2', skill: 'number', level: 'B2', point: 'mpg', seg: [77.1, 82.1], keep: true,
      stem: 'How many miles per gallon does Dwight’s car get?', ja: 'ドワイトの車は、1ガロンで何マイル走る？',
      choices: ['2', '4', '8', '40'], a: 2,
      choicesJa: ['2マイル', '4マイル', '8マイル', '40マイル'],
      cue: '「four miles」への返事',
      line: 'like, *four miles* to the gallon? — Uh, *try double that*.',
      said: '「4マイルくらい？」に「その倍だね」と返す。つまり約8マイル。',
      mean: 'Try 〜 ＝ いや〜だよ、と相手の数を直す言い方。double that ＝ その2倍。',
      trap: '最後に聞こえた four を選びやすい。double は2倍なので、4の2倍で8。',
      use: 'Ten minutes? Try an hour.（10分？いや1時間はかかるよ）' },

    // R fix: V2 (75 % blind): "saves fuel" was a filler. "Andy's guess was way off" (the correction read as a win) is
    //   the near miss now.
    // why: half ← "double" and "half" confused; way off ← the proud tone heard as a winning correction
    { id: 'h2', skill: 'humor', level: 'C1', point: 'mpg', seg: [77.1, 84.6], retired: true,
      stem: 'Why is Dwight’s comeback about his mileage funny?',
      choices: ['Even doubled, that mileage is still awful', 'He means half that, but says double by mistake',
                'He shows that Andy’s guess was way off'], a: 0,
      cue: '直す前の数字と、直したあとの数字を比べて。',
      line: 'four miles to the gallon? — Uh, *try double that*. Classic Trans Am…',
      said: '「1ガロン4マイル？」に「その倍だ」と胸を張り、クラシックな名車だと続ける。',
      mean: '倍にしても約8マイルで、燃費はひどいまま。言い返したつもりで、悪口を認めている。',
      trap: '自信たっぷりに直すので「言い負かした」に聞こえるが、倍でも弱点は残る。',
      use: 'That’s not the comeback you think it is.（それ、言い返せてないよ）' },

    { id: 'd4', skill: 'detail', level: 'B1', point: 'latin', seg: [88.6, 96.2],
      stem: 'What does Andy say the name of his car means?', ja: 'アンディは、自分の車の名前は何の意味だと言う？',
      choices: ['Earth, in Latin', 'Rugged, in Latin', 'Earth, in Japanese'], a: 0,
      choicesJa: ['ラテン語で「大地」', 'ラテン語で「たくましい」', '日本語で「大地」'],
      cue: '「not even a real word」への返事',
      line: 'Actually, it is — it’s *Latin for “earth.”*',
      said: '「本当の言葉だ。ラテン語で『大地』の意味だ」と言い返す。',
      mean: 'A is Latin for B ＝ A はラテン語で B の意味。言葉の意味を言うときの形。',
      trap: '直前に Japanese と rugged が聞こえるので混ざりやすい。for の前が言語、後ろが意味。',
      use: '“Gracias” is Spanish for “thank you.”（グラシアスはスペイン語で「ありがとう」）' },

    { id: 'x1', skill: 'dict', level: 'B2', point: 'bet', seg: [101.2, 103.85],
      stem: 'Type the reply: “Yeah, ___.” (4 words)', ja: '書こう：“Yeah, ___.”（4語）',
      answer: 'i bet you would',
      cue: '「than an ex-earth」への返事',
      line: 'Yeah, *I bet you would*.',
      said: '「ああ、そうだろうね」と返す。',
      mean: 'I bet 〜 ＝ きっと〜だろうね。bet you は「ベッチュ」とつながる。',
      trap: 'bet you が一語のように聞こえやすい。t と y がつながって「チュ」になる。',
      use: 'I bet you’re tired after that flight.（そのフライトのあとじゃ疲れてるよね）' },

    // R fix: V2 (85 % blind): "someone phoned" was a filler. "Taken from someone" is the literal reading of "wants its
    //   car back".
    // why: built in 1985 ← the year taken as the car's real year; taken ← "wants its car back" read literally
    { id: 'f3', skill: 'phrase', level: 'C1', point: 'old', seg: [103.4, 110.1], retired: true,
      stem: 'When Andy says “1985 called…”, what is he really saying?',
      choices: ['Dwight’s car is badly out of date', 'Dwight’s car was built in 1985', 'Dwight’s car was taken from someone'],
      a: 0,
      cue: '「called」のあとと、Dwight の言い返し方。',
      line: '*1985 called*, it wants its *car back*. — Well, I hope 1985 has a time machine, ’cause I drive an ’87.',
      said: '「1985年が車を返せと電話してきた」とからかい、「87年式だ」と返される。',
      mean: '「(年) called…」は「古くさい」という定番のからかい。',
      trap: '1985 を年式と、「返して」を盗んだ車と取りやすい。返事の ’87 がヒント。',
      use: 'The ’80s called. They want that hat back.（その帽子、古くさいね）' },

    { id: 'p1', skill: 'pragma', level: 'B2', point: 'speaking', seg: [106.9, 120.75],
      stem: 'Why do both men say “speaking of…”?', ja: '二人はなぜ “speaking of…” と言う？',
      choices: ['To start a new insult', 'To change to a calm topic', 'To say sorry'], a: 0,
      choicesJa: ['次の悪口を始めるため', '落ち着いた話に変えるため', '謝るため'],
      cue: '「speaking of」のあとの語',
      line: 'Oh, *speaking of time machines*… — *Speaking of funerals*, why don’t you…',
      said: '相手が言った time machine や funeral を拾って、次の悪口につなげる。',
      mean: 'speaking of 〜 ＝ 〜と言えば。ふつうは話題を変える言い方。ここでは悪口を続ける道具。',
      trap: 'ていねいな話題の切りかえだと思いやすい。あとに来るのは、相手をけなす話。',
      use: 'Speaking of food, is anyone hungry?（食べ物と言えば、お腹すいた人いる？）' },

    // R fix: V2 (75 % blind): "hurt" was a filler. "Mocks how mean it was" (the right tone, the wrong target; the
    //   English-professor line settles it) is the near miss now.
    // why: admires ← "really well-constructed" taken at face value; mean ← "go die" is harsh, so the mockery is read
    //   as aimed at its cruelty
    { id: 't2', skill: 'attitude', level: 'B2', point: 'sentence', seg: [117.3, 129.6], retired: true,
      stem: 'How does Andy mean his comment on Dwight’s sentence?',
      choices: ['He mocks how badly it was worded', 'He honestly admires how it was put',
                'He mocks how mean it was to say'], a: 0,
      cue: '「go ahead and go」の重ね方と、そのあとのほめ方。',
      line: 'why don’t you *go ahead and go* die? — Oh, that was a *really well-constructed sentence*.',
      said: '「さっさと行って死ね」と言われ、「実によくできた文だね、英語の教授になれば」と返す。',
      mean: 'go を2回重ねた不格好な文を、わざと大げさにほめてからかっている。',
      trap: 'ほめ言葉の形なので本気に取りやすい。ほめる中身が明らかに弱いときは皮肉。',
      use: 'Wow, great plan. Really well thought out.（へえ、すごい計画。よく考えたね）' },

    // R fix: V2 (60 % blind): "the speaker admits it" was a filler. "A draw both men accepted" (the fizzle read as a
    //   truce) replaces it. Still near 50 % blind (open).
    // why: the speaker won ← "totally got the best of" taken at face value; draw ← the fizzle read as a truce
    // anchor: 130.3–143 s the exchange sinks to "Idiot." … "You're the idiot!"; then 153–154.2 s to camera "I totally
    //   got the best of that interchange"
    { id: 'c1', skill: 'infer', level: 'C2', point: 'best', seg: [129.8, 154.8], retired: true,
      stem: 'After the closing comment to the camera, how should we judge the argument?',
      choices: ['Nobody won; it sank into name-calling', 'The speaker won, just as he claims',
                'It was a draw both men accepted'], a: 0,
      cue: '口論の終わり方と、カメラへの一言の差。',
      line: '*Idiot.* … You’re the idiot! … I *totally got the best of* that interchange.',
      said: '「バカ」「お前がバカだ」と言い合って終わったあと、カメラに「完全に僕の勝ちだった」と話す。',
      mean: 'カメラへの一言が場面を書きかえる形。ここでは逆に、勝ったと思い込む本人のずれが笑いになる。',
      trap: 'カメラへの本音をそのまま答えと取りやすい。本人の評価と、実際のやりとりを比べて聞く。',
      use: 'I think that went well. Right?（うまくいったと思う。だよね？）' },

    { id: 's1', skill: 'sound', level: 'B2', point: 'ifidiot', seg: [131, 134.05],
      stem: 'Fill the gap: “If I were an idiot, ___ driving a Trans Am.”', ja: '空所に入るのは？ “If I were an idiot, ___ driving a Trans Am.”',
      choices: ['I’d be', 'I’ll be', 'I’m'], a: 0,
      choicesJa: ['〜しているだろう', '〜しているつもりだ', '〜している'],
      cue: '「idiot」のあと',
      line: 'If I were an idiot, *I’d be* driving a Trans Am.',
      said: '「僕がバカなら、トランザムに乗ってるさ」と言い返す。',
      mean: 'I’d be ＝ 〜しているだろう。I’d の d はほとんど聞こえず、be につながる。',
      trap: 'I’ll なら「アイル」の l、I’m なら be がない。If I were のあとは I’d be が来る。',
      use: 'If I were you, I’d take the train.（私なら電車で行くな）' },
  ]
};
